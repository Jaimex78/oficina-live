import type { Request } from 'express';
import { Router } from 'express';
import type { Prisma } from '@prisma/client';
import { z } from 'zod';
import { IDS_PAQUETES, ROLES, esRol, limpiarPaquetes, type ResultadoLote, type Rol } from '@ol/shared';
import { aAdmin, leerAcceso } from '../auth/servicio';
import type { Contexto } from '../contexto';
import { ErrorHttp, parsear } from '../errores';

const USUARIO_RE = /^[a-z0-9][a-z0-9._-]{2,31}$/;
const correoOpcional = z
  .string()
  .trim()
  .toLowerCase()
  .max(120, 'El correo es demasiado largo.')
  .refine((v) => v === '' || z.string().email().safeParse(v).success, 'Escribe un correo válido.');
const rol = z.enum(ROLES, { errorMap: () => ({ message: 'Elige un rol válido.' }) });

const esqNuevo = z.object({
  usuario: z
    .string({ required_error: 'Escribe el usuario.' })
    .trim()
    .toLowerCase()
    .regex(USUARIO_RE, 'El usuario usa minúsculas, números, punto, guion o guion bajo (de 3 a 32 caracteres).'),
  nombre: z.string({ required_error: 'Escribe el nombre.' }).trim().min(2, 'Escribe el nombre.').max(80, 'El nombre es demasiado largo.'),
  cargo: z.string().trim().max(80, 'El cargo es demasiado largo.').optional().default(''),
  correo: correoOpcional.optional().default(''),
  rol,
});

const correoObligatorio = z
  .string({ required_error: 'Escribe el correo.' })
  .trim()
  .toLowerCase()
  .max(120, 'El correo es demasiado largo.')
  .email('Escribe un correo válido.');

const esqPerfil = z.object({
  nombre: z.string({ required_error: 'Escribe el nombre.' }).trim().min(2, 'Escribe el nombre.').max(80, 'El nombre es demasiado largo.'),
  correo: correoObligatorio,
  cargo: z.string().trim().max(80, 'El cargo es demasiado largo.').optional().default(''),
  rol,
  acceso: z
    .array(z.string().refine((v) => IDS_PAQUETES.has(v), 'Ese paquete no existe.'))
    .max(IDS_PAQUETES.size, 'Hay demasiados paquetes.')
    .optional()
    .default([]),
});

const MAX_LOTE = 200;
const esqLote = z.object({ texto: z.string({ required_error: 'Pega la lista de personas.' }).max(60_000, 'La lista es demasiado larga.') });

/** Acepta el rol por su nombre interno o por el que se ve en pantalla. */
function rolDeTexto(t: string): Rol | null {
  const v = t
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  if (v === '') return 'usuario';
  if (esRol(v)) return v;
  if (v === 'administracion' || v === 'administrador' || v === 'administradora') return 'admin';
  if (v === 'persona') return 'usuario';
  return null;
}

const esqEditar = z.object({
  nombre: z.string().trim().min(2, 'Escribe el nombre.').max(80, 'El nombre es demasiado largo.').optional(),
  cargo: z.string().trim().max(80, 'El cargo es demasiado largo.').optional(),
  correo: correoOpcional.optional(),
  rol: rol.optional(),
  activo: z.boolean({ invalid_type_error: 'El estado no es válido.' }).optional(),
  acceso: z
    .array(z.string().refine((v) => IDS_PAQUETES.has(v), 'Ese paquete no existe.'))
    .max(IDS_PAQUETES.size, 'Hay demasiados paquetes.')
    .optional(),
});

function idDe(req: Request): number {
  const id = Number(req.params['id']);
  if (!Number.isInteger(id) || id < 1) throw new ErrorHttp(404, 'No existe esa cuenta.');
  return id;
}

export function rutasAdminUsuarios(ctx: Contexto): Router {
  const r = Router();

  const buscar = async (id: number) => {
    const u = await ctx.prisma.usuario.findUnique({ where: { id } });
    if (!u) throw new ErrorHttp(404, 'No existe esa cuenta.');
    return u;
  };

  const otrosAdminsActivos = (excepto: number) => ctx.prisma.usuario.count({ where: { rol: 'admin', activo: true, pendiente: false, NOT: { id: excepto } } });

  r.get('/', async (req, res) => {
    const q = typeof req.query['q'] === 'string' ? req.query['q'].trim() : '';
    const filtroRol = typeof req.query['rol'] === 'string' && esRol(req.query['rol']) ? req.query['rol'] : undefined;
    const estado = req.query['activo'];
    const where: Prisma.UsuarioWhereInput = {
      ...(filtroRol ? { rol: filtroRol } : {}),
      ...(estado === '1' ? { activo: true } : estado === '0' ? { activo: false } : {}),
      ...(q ? { OR: [{ usuario: { contains: q } }, { nombre: { contains: q } }, { correo: { contains: q } }, { cargo: { contains: q } }] } : {}),
    };
    const filas = await ctx.prisma.usuario.findMany({ where, orderBy: [{ activo: 'desc' }, { nombre: 'asc' }] });
    res.json({ usuarios: filas.map(aAdmin) });
  });

  r.post('/', async (req, res) => {
    const d = parsear(esqNuevo, req.body);
    const { usuario, claveTemporal } = await ctx.auth.crearUsuario(d);
    await ctx.auditoria.registrar({ usuario: req.usuario!, accion: 'crear_usuario', objeto: usuario.usuario, detalle: `rol ${usuario.rol}`, ip: req.ipReal });
    res.status(201).json({ usuario: aAdmin(usuario), claveTemporal });
  });

  // ---- Perfiles pendientes de activación (sin contraseña: la persona la crea con su enlace) ----

  r.get('/correo', (_req, res) => {
    res.json({ disponible: ctx.correo.disponible });
  });

  r.post('/perfil', async (req, res) => {
    const d = parsear(esqPerfil, req.body);
    const { usuario, enlace } = await ctx.auth.crearPerfil(d);
    await ctx.auditoria.registrar({ usuario: req.usuario!, accion: 'crear_perfil', objeto: usuario.usuario, detalle: `rol ${usuario.rol}; correo ${usuario.correo}`, ip: req.ipReal });
    res.status(201).json({ usuario: aAdmin(usuario), enlace });
  });

  r.post('/lote', async (req, res) => {
    const { texto } = parsear(esqLote, req.body);
    const lineas = texto
      .split(/\r?\n/)
      .map((l, i) => ({ linea: i + 1, partes: l.split(/[,;\t]/).map((x) => x.trim()) }))
      .filter((l) => l.partes.some(Boolean));
    if (lineas.length === 0) throw new ErrorHttp(422, 'Pega al menos una línea con «Nombre, correo, rol».');
    if (lineas.length > MAX_LOTE) throw new ErrorHttp(422, `Son demasiadas líneas: el máximo es ${MAX_LOTE} por lote.`);
    const resultados: ResultadoLote[] = [];
    for (const { linea, partes } of lineas) {
      const [nombre = '', correo = '', rolTexto = '', ...resto] = partes;
      const base = { linea, nombre, correo: correo.toLowerCase(), rol: rolTexto || 'usuario' };
      try {
        const r = rolDeTexto(rolTexto);
        if (r === null) throw new ErrorHttp(422, 'El rol no es válido. Usa administración, constructor o persona.');
        const d = parsear(esqPerfil, { nombre, correo, rol: r, cargo: resto.join(', ') });
        const { usuario, enlace } = await ctx.auth.crearPerfil(d);
        await ctx.auditoria.registrar({ usuario: req.usuario!, accion: 'crear_perfil', objeto: usuario.usuario, detalle: `rol ${usuario.rol}; correo ${usuario.correo}; en lote`, ip: req.ipReal });
        resultados.push({ ...base, rol: usuario.rol, ok: true, usuario: aAdmin(usuario), enlace });
      } catch (x) {
        if (!(x instanceof ErrorHttp)) throw x;
        resultados.push({ ...base, ok: false, error: x.message });
      }
    }
    res.status(201).json({ resultados });
  });

  r.post('/:id/enlace', async (req, res) => {
    const id = idDe(req);
    await buscar(id);
    const { usuario, enlace } = await ctx.auth.generarEnlace(id);
    await ctx.auditoria.registrar({ usuario: req.usuario!, accion: 'generar_enlace', objeto: usuario.usuario, ip: req.ipReal });
    res.json({ usuario: aAdmin(usuario), enlace });
  });

  r.patch('/:id', async (req, res) => {
    const id = idDe(req);
    const d = parsear(esqEditar, req.body);
    const actual = await buscar(id);
    const yo = req.usuario!;

    const cambiaRol = d.rol !== undefined && d.rol !== actual.rol;
    const desactiva = d.activo === false && actual.activo;
    if (id === yo.id && (cambiaRol || desactiva)) throw new ErrorHttp(409, 'No puedes quitarte la administración ni desactivar tu propia cuenta.');
    if (actual.rol === 'admin' && actual.activo && (cambiaRol || desactiva) && (await otrosAdminsActivos(id)) === 0) {
      throw new ErrorHttp(409, 'Siempre debe quedar al menos una persona administradora activa.');
    }
    if (d.correo && d.correo !== actual.correo) await ctx.auth.verificarCorreoLibre(d.correo, id);

    const data: Prisma.UsuarioUpdateInput = {};
    const cambios: string[] = [];
    const poner = <K extends 'nombre' | 'cargo' | 'correo' | 'rol' | 'activo'>(campo: K, valor: (typeof actual)[K] | undefined) => {
      if (valor === undefined || valor === actual[campo]) return;
      (data as Record<string, unknown>)[campo] = valor;
      cambios.push(`${campo}: ${String(actual[campo])} → ${String(valor)}`);
    };
    poner('nombre', d.nombre);
    poner('cargo', d.cargo);
    poner('correo', d.correo);
    poner('rol', d.rol);
    poner('activo', d.activo);
    if (d.acceso !== undefined) {
      const nuevoAcceso = limpiarPaquetes(d.acceso).sort();
      const previo = [...leerAcceso(actual.acceso)].sort();
      if (JSON.stringify(nuevoAcceso) !== JSON.stringify(previo)) {
        data.acceso = JSON.stringify(nuevoAcceso);
        cambios.push(`acceso: ${previo.length} → ${nuevoAcceso.length} paquetes`);
      }
    }
    if (desactiva) data.versionToken = { increment: 1 }; // cierra sus sesiones abiertas

    if (cambios.length === 0) {
      res.json({ usuario: aAdmin(actual) });
      return;
    }
    const nuevo = await ctx.prisma.usuario.update({ where: { id }, data });
    if (desactiva) ctx.presencia?.expulsar(id);
    // Si cambió su acceso y está en la oficina, su personaje (y su mascota) se actualizan en el acto.
    else if (data.acceso !== undefined) ctx.presencia?.perfilCambiado?.(nuevo);
    await ctx.auditoria.registrar({ usuario: yo, accion: 'editar_usuario', objeto: nuevo.usuario, detalle: cambios.join('; '), ip: req.ipReal });
    res.json({ usuario: aAdmin(nuevo) });
  });

  r.post('/:id/restablecer-clave', async (req, res) => {
    const u = await buscar(idDe(req));
    if (u.pendiente) throw new ErrorHttp(409, 'Esa cuenta aún no se activa: genera un enlace nuevo en vez de restablecer la contraseña.');
    const claveTemporal = await ctx.auth.restablecerClave(u.id);
    ctx.presencia?.expulsar(u.id);
    await ctx.auditoria.registrar({ usuario: req.usuario!, accion: 'restablecer_clave', objeto: u.usuario, ip: req.ipReal });
    res.json({ claveTemporal });
  });

  r.post('/:id/desbloquear', async (req, res) => {
    const u = await buscar(idDe(req));
    const nuevo = await ctx.prisma.usuario.update({ where: { id: u.id }, data: { intentosFallidos: 0, bloqueadoHasta: null } });
    await ctx.auditoria.registrar({ usuario: req.usuario!, accion: 'editar_usuario', objeto: u.usuario, detalle: 'desbloqueó la cuenta', ip: req.ipReal });
    res.json({ usuario: aAdmin(nuevo) });
  });

  r.delete('/:id', async (req, res) => {
    const u = await buscar(idDe(req));
    if (u.id === req.usuario!.id) throw new ErrorHttp(409, 'No puedes eliminar tu propia cuenta.');
    if (u.rol === 'admin' && u.activo && (await otrosAdminsActivos(u.id)) === 0) {
      throw new ErrorHttp(409, 'Siempre debe quedar al menos una persona administradora activa.');
    }
    await ctx.prisma.usuario.delete({ where: { id: u.id } });
    ctx.presencia?.expulsar(u.id);
    await ctx.auditoria.registrar({ usuario: req.usuario!, accion: 'eliminar_usuario', objeto: u.usuario, ip: req.ipReal });
    res.json({ ok: true });
  });

  return r;
}
