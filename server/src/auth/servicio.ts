import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { Prisma, type PrismaClient, type Usuario } from '@prisma/client';
import { PERMISOS_POR_ROL, esRol, limpiarPaquetes, type EnlaceActivacion, type Rol, type UsuarioAdmin, type UsuarioPublico } from '@ol/shared';
import type { ServicioAjustes } from '../ajustes/servicio';
import type { Auditoria } from '../auditoria';
import type { Config } from '../config';
import { ErrorHttp } from '../errores';
import { versionFoto } from '../fotos/servicio';
import { personajeInicial, personajeVisible } from '../personaje/catalogo';
import { claveTemporal, hashear, motivoClaveInvalida, verificar } from './clave';
import type { Tokens } from './token';

/** El mismo mensaje para toda falla de ingreso: no delata si la cuenta existe, si está bloqueada o si espera su activación. */
const MENSAJE_LOGIN = 'Usuario o contraseña incorrectos. Si es tu primer ingreso, revisa tu enlace de activación o pídele uno a una persona administradora.';
const MENSAJE_ENLACE = 'Este enlace no es válido o ya venció. Pídele uno nuevo a una persona administradora.';
/** Valor que ninguna contraseña puede producir: las cuentas pendientes no tienen clave hasta que se activan. */
const CLAVE_PENDIENTE = '!pendiente';

/** Huella SHA-256 (hex) de un enlace de activación. Es lo único que se guarda. */
export function huellaEnlace(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function iguales(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export interface DatosPerfil {
  nombre: string;
  correo: string;
  cargo?: string;
  rol: Rol;
  acceso?: string[];
}

export function aPublico(u: Usuario): UsuarioPublico {
  const rol: Rol = esRol(u.rol) ? u.rol : 'usuario';
  return {
    id: u.id,
    usuario: u.usuario,
    nombre: u.nombre,
    cargo: u.cargo,
    correo: u.correo,
    rol,
    permisos: [...PERMISOS_POR_ROL[rol]],
    debeCambiarClave: u.debeCambiarClave,
    activo: u.activo,
    creadoEn: u.creadoEn.toISOString(),
    ultimoIngreso: u.ultimoIngreso ? u.ultimoIngreso.toISOString() : null,
    apodo: u.apodo,
    // El disfraz, la movilidad y los accesorios de fantasía solo se ven cuando están disponibles (fechas de fiesta o paquete).
    personaje: personajeVisible(leerPersonaje(u.personaje), leerAcceso(u.acceso)),
    acceso: leerAcceso(u.acceso),
    personajeListo: u.personajeListo,
    foto: versionFoto(u),
  };
}

/** Los paquetes del catálogo de una cuenta, guardados como JSON. Si está dañado, no tiene ninguno. */
export function leerAcceso(texto: string): string[] {
  try {
    return limpiarPaquetes(JSON.parse(texto));
  } catch {
    return [];
  }
}

/** El personaje se guarda como JSON; si está dañado se trata como «aún no lo creó». */
function leerPersonaje(texto: string | null): UsuarioPublico['personaje'] {
  if (!texto) return null;
  try {
    const v: unknown = JSON.parse(texto);
    return typeof v === 'object' && v !== null && (v as { v?: unknown }).v === 1 ? (v as UsuarioPublico['personaje']) : null;
  } catch {
    return null;
  }
}

export function aAdmin(u: Usuario): UsuarioAdmin {
  const bloqueada = u.bloqueadoHasta && u.bloqueadoHasta.getTime() > Date.now() ? u.bloqueadoHasta.toISOString() : null;
  const enlaceVence = u.pendiente && u.enlaceVence ? u.enlaceVence.toISOString() : null;
  return { ...aPublico(u), bloqueadaHasta: bloqueada, pendiente: u.pendiente, enlaceVence };
}

export interface DatosNuevoUsuario {
  usuario: string;
  nombre: string;
  cargo?: string;
  correo?: string;
  rol: Rol;
  /** Si no se da, se genera una temporal y la persona debe cambiarla al entrar. */
  clave?: string;
  debeCambiar?: boolean;
}

export class ServicioAuth {
  private falsoHash: Promise<string> | null = null;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly config: Config,
    private readonly ajustes: ServicioAjustes,
    private readonly auditoria: Auditoria,
    private readonly tokens: Tokens,
    private readonly intentosIp: Map<string, number[]>,
  ) {}

  // ---------- límite por conexión ----------

  private revisarIp(ip: string): void {
    if (!ip) return;
    const maximo = this.ajustes.obtener<number>('ip_intentos_max');
    const ventana = this.ajustes.obtener<number>('ip_ventana_min') * 60_000;
    const ahora = Date.now();
    const vivos = (this.intentosIp.get(ip) ?? []).filter((t) => ahora - t < ventana);
    this.intentosIp.set(ip, vivos);
    if (vivos.length >= maximo) throw new ErrorHttp(429, 'Demasiados intentos de ingreso desde tu conexión. Espera unos minutos.');
  }

  private fallarIp(ip: string): void {
    if (!ip) return;
    const lista = this.intentosIp.get(ip) ?? [];
    lista.push(Date.now());
    this.intentosIp.set(ip, lista);
  }

  // ---------- ingreso ----------

  async login(usuarioEntrada: string, clave: string, ip: string): Promise<{ usuario: Usuario; token: string }> {
    this.revisarIp(ip);
    const nombre = usuarioEntrada.trim().toLowerCase();
    // Se entra con el usuario o con el correo de trabajo.
    const u = (await this.prisma.usuario.findUnique({ where: { usuario: nombre } })) ?? (nombre.includes('@') ? await this.prisma.usuario.findFirst({ where: { correo: nombre } }) : null);

    if (!u || !u.activo) {
      // Se gasta un tiempo parecido al de verificar una clave real, para no delatar si la cuenta existe.
      await verificar(clave, await this.hashFalso());
      this.fallarIp(ip);
      await this.auditoria.registrar({ accion: 'login_fallido', objeto: nombre.slice(0, 40), detalle: 'usuario desconocido o inactivo', ip });
      throw new ErrorHttp(401, MENSAJE_LOGIN);
    }

    if (u.pendiente) {
      await verificar(clave, await this.hashFalso());
      this.fallarIp(ip);
      await this.auditoria.registrar({ usuario: u, accion: 'login_fallido', detalle: 'cuenta pendiente de activación', ip });
      throw new ErrorHttp(401, MENSAJE_LOGIN);
    }

    const ahora = new Date();
    if (u.bloqueadoHasta && u.bloqueadoHasta > ahora) {
      const mins = Math.ceil((u.bloqueadoHasta.getTime() - ahora.getTime()) / 60_000);
      throw new ErrorHttp(429, `Cuenta bloqueada por intentos fallidos. Intenta en ${mins} min.`);
    }

    if (!(await verificar(clave, u.claveHash))) {
      await this.registrarFallo(u, ip, 'clave incorrecta');
      throw new ErrorHttp(401, MENSAJE_LOGIN);
    }

    const actualizado = await this.prisma.usuario.update({
      where: { id: u.id },
      data: { intentosFallidos: 0, bloqueadoHasta: null, ultimoIngreso: ahora },
    });
    await this.auditoria.registrar({ usuario: actualizado, accion: 'login', ip });
    return { usuario: actualizado, token: await this.tokens.emitir(actualizado) };
  }

  /** Suma un fallo y bloquea la cuenta al llegar al máximo. */
  private async registrarFallo(u: Usuario, ip: string, detalle: string): Promise<void> {
    const n = u.intentosFallidos + 1;
    const bloquear = n >= this.ajustes.obtener<number>('intentos_max');
    const minutos = this.ajustes.obtener<number>('bloqueo_min');
    await this.prisma.usuario.update({
      where: { id: u.id },
      data: { intentosFallidos: bloquear ? 0 : n, bloqueadoHasta: bloquear ? new Date(Date.now() + minutos * 60_000) : null },
    });
    this.fallarIp(ip);
    await this.auditoria.registrar({ usuario: u, accion: 'login_fallido', detalle, ip });
    if (bloquear) await this.auditoria.registrar({ usuario: u, accion: 'bloqueo_cuenta', detalle: `${minutos} min`, ip });
  }

  async cambiarClave(u: Usuario, actual: string, nueva: string, ip: string): Promise<string> {
    if (!(await verificar(actual, u.claveHash))) {
      await this.registrarFallo(u, ip, 'clave actual incorrecta al cambiar');
      throw new ErrorHttp(401, 'La contraseña actual no es correcta.');
    }
    const motivo = motivoClaveInvalida(nueva, this.ajustes.obtener<number>('clave_min'));
    if (motivo) throw new ErrorHttp(422, motivo);
    if (nueva === actual) throw new ErrorHttp(422, 'La contraseña nueva debe ser distinta de la actual.');

    const actualizado = await this.prisma.usuario.update({
      where: { id: u.id },
      data: { claveHash: await hashear(nueva, this.config.costoHash), debeCambiarClave: false, intentosFallidos: 0, bloqueadoHasta: null, versionToken: { increment: 1 } },
    });
    await this.auditoria.registrar({ usuario: actualizado, accion: 'cambio_clave', ip });
    return this.tokens.emitir(actualizado);
  }

  // ---------- cuentas ----------

  async crearUsuario(d: DatosNuevoUsuario): Promise<{ usuario: Usuario; claveTemporal: string | null }> {
    const nombreUsuario = d.usuario.trim().toLowerCase();
    const correo = (d.correo ?? '').trim().toLowerCase();
    if (correo) await this.verificarCorreoLibre(correo);
    if (await this.prisma.usuario.findUnique({ where: { usuario: nombreUsuario } })) throw new ErrorHttp(409, 'Ya existe una cuenta con ese usuario.');
    const temporal = d.clave ? null : claveTemporal(this.ajustes.obtener<number>('clave_min'));
    const clave = d.clave ?? (temporal as string);
    try {
      const usuario = await this.prisma.usuario.create({
        data: {
          usuario: nombreUsuario,
          nombre: d.nombre.trim(),
          cargo: (d.cargo ?? '').trim(),
          correo,
          rol: d.rol,
          claveHash: await hashear(clave, this.config.costoHash),
          debeCambiarClave: d.debeCambiar ?? temporal !== null,
          // Cada cuenta nueva trae un personaje preseleccionado; la persona lo cambia (o lo confirma) la primera vez que entra.
          personaje: JSON.stringify(personajeInicial(Math.floor(Math.random() * 2 ** 31))),
        },
      });
      return { usuario, claveTemporal: temporal };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') throw new ErrorHttp(409, 'Ya existe una cuenta con ese usuario.');
      throw e;
    }
  }

  async verificarCorreoLibre(correo: string, excepto?: number): Promise<void> {
    const otro = await this.prisma.usuario.findFirst({ where: { correo, ...(excepto ? { NOT: { id: excepto } } : {}) } });
    if (otro) throw new ErrorHttp(409, 'Ese correo ya está en otra cuenta.');
  }

  /** Nueva clave temporal: la persona deberá cambiarla, y sus sesiones abiertas se cierran. */
  async restablecerClave(id: number): Promise<string> {
    const temporal = claveTemporal(this.ajustes.obtener<number>('clave_min'));
    await this.prisma.usuario.update({
      where: { id },
      data: { claveHash: await hashear(temporal, this.config.costoHash), debeCambiarClave: true, intentosFallidos: 0, bloqueadoHasta: null, versionToken: { increment: 1 } },
    });
    return temporal;
  }

  // ---------- perfiles y enlaces de activación ----------

  dominiosPermitidos(): string[] {
    return this.ajustes
      .obtener<string>('dominios_permitidos')
      .split(',')
      .map((d) => d.trim().toLowerCase())
      .filter(Boolean);
  }

  /**
   * Rechaza un correo cuyo dominio la administración no ha autorizado. Devuelve el correo ya en minúsculas.
   * Si la lista de dominios está vacía, se acepta cualquier dominio.
   */
  verificarDominio(correoEntrada: string): string {
    const correo = correoEntrada.trim().toLowerCase();
    const dominio = correo.split('@')[1] ?? '';
    if (!dominio) throw new ErrorHttp(422, 'Escribe un correo válido.');
    const permitidos = this.dominiosPermitidos();
    if (permitidos.length > 0 && !permitidos.includes(dominio)) {
      throw new ErrorHttp(422, `El dominio «${dominio}» no está autorizado. Solo se aceptan: ${permitidos.join(', ')}. Para autorizar otro, agrégalo en Configuración, Seguridad, «Dominios de correo permitidos».`);
    }
    return correo;
  }

  /** Nombre de usuario libre a partir de la parte local del correo (minúsculas, números, punto, guion). */
  private async usuarioLibre(correo: string): Promise<string> {
    let base = (correo.split('@')[0] ?? '').replace(/[^a-z0-9._-]/g, '').replace(/^[^a-z0-9]+/, '').slice(0, 28);
    if (base.length < 3) base = `${base}usuario`.slice(0, 28);
    for (let n = 0; n < 1000; n++) {
      const candidato = n === 0 ? base : `${base}${n + 1}`;
      if (!(await this.prisma.usuario.findUnique({ where: { usuario: candidato } }))) return candidato;
    }
    return `${base}${randomBytes(3).toString('hex')}`;
  }

  private enlaceNuevo(): { token: string; hash: string; vence: Date } {
    const token = randomBytes(32).toString('base64url'); // 256 bits
    const dias = this.ajustes.obtener<number>('activacion_dias');
    return { token, hash: huellaEnlace(token), vence: new Date(Date.now() + dias * 86_400_000) };
  }

  private aEnlace(token: string, vence: Date): EnlaceActivacion {
    return { token, url: `${this.config.urlPublica}/activar?token=${token}`, vence: vence.toISOString() };
  }

  /** Crea una cuenta SIN contraseña, pendiente de activación, y su primer enlace (que se muestra una sola vez). */
  async crearPerfil(d: DatosPerfil): Promise<{ usuario: Usuario; enlace: EnlaceActivacion }> {
    const correo = this.verificarDominio(d.correo);
    await this.verificarCorreoLibre(correo);
    const e = this.enlaceNuevo();
    try {
      const usuario = await this.prisma.usuario.create({
        data: {
          usuario: await this.usuarioLibre(correo),
          nombre: d.nombre.trim(),
          cargo: (d.cargo ?? '').trim(),
          correo,
          rol: d.rol,
          claveHash: CLAVE_PENDIENTE,
          debeCambiarClave: false,
          pendiente: true,
          enlaceHash: e.hash,
          enlaceVence: e.vence,
          acceso: JSON.stringify(limpiarPaquetes(d.acceso ?? [])),
          personaje: JSON.stringify(personajeInicial(Math.floor(Math.random() * 2 ** 31))),
        },
      });
      return { usuario, enlace: this.aEnlace(e.token, e.vence) };
    } catch (x) {
      if (x instanceof Prisma.PrismaClientKnownRequestError && x.code === 'P2002') throw new ErrorHttp(409, 'Ya existe un perfil con ese correo.');
      throw x;
    }
  }

  /** Enlace nuevo para una cuenta pendiente. El anterior deja de servir. */
  async generarEnlace(id: number): Promise<{ usuario: Usuario; enlace: EnlaceActivacion }> {
    const actual = await this.prisma.usuario.findUnique({ where: { id } });
    if (!actual) throw new ErrorHttp(404, 'No existe esa cuenta.');
    if (!actual.pendiente) throw new ErrorHttp(409, 'Esa cuenta ya está activada. Si olvidó su contraseña, restablécela.');
    const e = this.enlaceNuevo();
    const usuario = await this.prisma.usuario.update({ where: { id }, data: { enlaceHash: e.hash, enlaceVence: e.vence } });
    return { usuario, enlace: this.aEnlace(e.token, e.vence) };
  }

  /** Busca la cuenta de un enlace vigente. Cualquier falla (inventado, usado, vencido, alterado) da el mismo mensaje. */
  private async cuentaDeEnlace(token: string, ip: string): Promise<Usuario> {
    this.revisarIp(ip);
    const hash = huellaEnlace(typeof token === 'string' ? token.slice(0, 200) : '');
    const u = await this.prisma.usuario.findUnique({ where: { enlaceHash: hash } });
    const sirve = u !== null && u.enlaceHash !== null && iguales(u.enlaceHash, hash) && u.pendiente && u.activo && u.enlaceVence !== null && u.enlaceVence > new Date();
    if (!sirve) {
      this.fallarIp(ip);
      await this.auditoria.registrar({ accion: 'activacion_fallida', detalle: 'enlace no válido, usado o vencido', ip });
      throw new ErrorHttp(400, MENSAJE_ENLACE);
    }
    return u;
  }

  /** Qué mostrar en la pantalla «Crea tu contraseña». No cambia nada. */
  async consultarEnlace(token: string, ip: string): Promise<{ nombre: string; correo: string }> {
    const u = await this.cuentaDeEnlace(token, ip);
    return { nombre: u.nombre, correo: u.correo };
  }

  /** Crea la contraseña, activa la cuenta, gasta el enlace e inicia sesión. */
  async activar(token: string, clave: string, ip: string): Promise<{ usuario: Usuario; token: string }> {
    const u = await this.cuentaDeEnlace(token, ip);
    const motivo = motivoClaveInvalida(clave, this.ajustes.obtener<number>('clave_min'));
    if (motivo) throw new ErrorHttp(422, motivo);
    const claveHash = await hashear(clave, this.config.costoHash);
    const ahora = new Date();
    // Un solo uso, aunque lleguen dos peticiones a la vez: solo una logra cambiar la fila.
    const r = await this.prisma.usuario.updateMany({
      where: { id: u.id, enlaceHash: u.enlaceHash as string, pendiente: true, enlaceVence: { gt: ahora } },
      data: { claveHash, pendiente: false, enlaceHash: null, enlaceVence: null, debeCambiarClave: false, intentosFallidos: 0, bloqueadoHasta: null, ultimoIngreso: ahora, versionToken: { increment: 1 } },
    });
    if (r.count !== 1) {
      this.fallarIp(ip);
      throw new ErrorHttp(400, MENSAJE_ENLACE);
    }
    const activada = await this.prisma.usuario.findUniqueOrThrow({ where: { id: u.id } });
    await this.auditoria.registrar({ usuario: activada, accion: 'activar_cuenta', ip });
    return { usuario: activada, token: await this.tokens.emitir(activada) };
  }

  /**
   * Versión final local: si la base está vacía crea la cuenta de la primera persona administradora, pendiente de activación,
   * y deja su enlace (de un solo uso) en un archivo 600. Si ya hay cuentas no toca nada, salvo que esa persona siga
   * pendiente y su enlace se haya perdido o vencido: entonces genera uno nuevo.
   */
  async asegurarPrimerAdmin(nombre: string, correo: string): Promise<{ archivo: string; enlace: EnlaceActivacion } | null> {
    const archivo = path.join(this.config.dataDir, 'ENLACE-ADMIN.txt');
    const existente = await this.prisma.usuario.findFirst({ where: { correo: correo.toLowerCase() } });
    let enlace: EnlaceActivacion;
    if (!existente) {
      if ((await this.prisma.usuario.count()) > 0) return null;
      ({ enlace } = await this.crearPerfil({ nombre, correo, rol: 'admin' }));
    } else if (existente.pendiente && (!fs.existsSync(archivo) || !existente.enlaceVence || existente.enlaceVence <= new Date())) {
      ({ enlace } = await this.generarEnlace(existente.id));
    } else {
      return null;
    }
    const vence = new Date(enlace.vence).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
    fs.writeFileSync(
      archivo,
      `Enlace para crear tu contraseña (${correo}):\n\n${enlace.url}\n\nSirve una sola vez y vence el ${vence}.\nCuando lo uses, borra este archivo.\n`,
      { mode: 0o600 },
    );
    fs.chmodSync(archivo, 0o600);
    return { archivo, enlace };
  }

  private hashFalso(): Promise<string> {
    this.falsoHash ??= hashear('contraseña-que-nadie-usa', this.config.costoHash);
    return this.falsoHash;
  }
}
