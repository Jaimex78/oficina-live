import fs from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { huellaEnlace } from '../src/auth/servicio';
import { CLAVE, cliente, crearCuenta, crearEntorno, ingresar, sesionComo, type Entorno } from './ayudas';

let env: Entorno;
beforeAll(async () => {
  env = await crearEntorno();
});
afterAll(async () => {
  await env.cerrar();
});

const NUEVA = 'ClaveNueva2026';
const tokenDe = (url: string) => new URL(url).searchParams.get('token') as string;

async function perfil(correo: string, nombre = 'Persona Nueva', rol = 'usuario') {
  const { ctx } = env;
  const { usuario, enlace } = await ctx.auth.crearPerfil({ nombre, correo, rol: rol as 'usuario' });
  return { usuario, enlace, token: enlace.token };
}

describe('arranque limpio y primer administrador', () => {
  it('no crea cuentas demo ni «admin»: solo la persona administradora, pendiente, con su enlace en un archivo 600', async () => {
    const e = await crearEntorno({ plantilla: 'vacia' });
    try {
      expect(await e.ctx.prisma.usuario.count()).toBe(0);
      const r = await e.ctx.auth.asegurarPrimerAdmin('Administración', 'primera.admin@ejemplo.com');
      expect(r?.archivo).toBe(path.join(e.dir, 'ENLACE-ADMIN.txt'));
      expect(fs.statSync(r!.archivo).mode & 0o777).toBe(0o600);
      expect(fs.readFileSync(r!.archivo, 'utf8')).toContain(r!.enlace.url);

      const filas = await e.ctx.prisma.usuario.findMany();
      expect(filas).toHaveLength(1);
      expect(filas[0]).toMatchObject({ correo: 'primera.admin@ejemplo.com', rol: 'admin', pendiente: true });
      expect(filas.some((f) => f.usuario === 'admin' || f.usuario.startsWith('demo.'))).toBe(false);
      expect(await e.ctx.prisma.solicitud.count()).toBe(0);

      // Mientras siga pendiente y el archivo exista, arrancar de nuevo no cambia nada.
      expect(await e.ctx.auth.asegurarPrimerAdmin('Administración', 'primera.admin@ejemplo.com')).toBeNull();
      // Si el archivo se pierde, se genera un enlace nuevo (el anterior deja de servir).
      fs.rmSync(r!.archivo);
      const otra = await e.ctx.auth.asegurarPrimerAdmin('Administración', 'primera.admin@ejemplo.com');
      expect(otra).not.toBeNull();
      await expect(e.ctx.auth.consultarEnlace(r!.enlace.token, '')).rejects.toMatchObject({ estado: 400 });
      await e.ctx.auth.activar(otra!.enlace.token, NUEVA, '');
      // Ya activada: no vuelve a generar nada.
      expect(await e.ctx.auth.asegurarPrimerAdmin('Administración', 'primera.admin@ejemplo.com')).toBeNull();
    } finally {
      await e.cerrar();
    }
  });

  it('la oficina arranca vacía: solo el edificio', async () => {
    const e = await crearEntorno({ plantilla: 'vacia' });
    try {
      const sala = e.ctx.oficina.publicado().mapa.salas[0]!;
      expect(sala.zonas).toHaveLength(0);
      expect(sala.areas ?? []).toHaveLength(0);
      expect(sala.llegadas.length).toBeGreaterThan(0);
      const objetos = new Set(sala.colocaciones.map((c) => c.objeto));
      expect([...objetos].every((o) => ['pared-lisa', 'cerca', 'puerta-simple'].includes(o))).toBe(true);
    } finally {
      await e.cerrar();
    }
  });
});

describe('enlaces de activación', () => {
  it('guarda solo la huella SHA-256 del enlace, de 256 bits, que vence a los 7 días', async () => {
    const { usuario, enlace, token } = await perfil('huella@ejemplo.com');
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/); // 32 bytes en base64url
    expect(tokenDe(enlace.url)).toBe(token);
    const fila = await env.ctx.prisma.usuario.findUniqueOrThrow({ where: { id: usuario.id } });
    expect(fila.enlaceHash).toBe(huellaEnlace(token));
    expect(fila.enlaceHash).not.toContain(token);
    expect(JSON.stringify(fila)).not.toContain(token);
    expect(fila).toMatchObject({ pendiente: true, claveHash: '!pendiente' });
    const dias = (fila.enlaceVence!.getTime() - Date.now()) / 86_400_000;
    expect(dias).toBeGreaterThan(6.99);
    expect(dias).toBeLessThan(7.01);
  });

  it('activa la cuenta, inicia sesión y se puede entrar después con el correo', async () => {
    const { token } = await perfil('Maria.Perez@Ejemplo.com', 'María Pérez');
    const api = cliente(env.app);
    const info = await api.post('/api/auth/activacion/consultar').send({ token });
    expect(info.status).toBe(200);
    expect(info.body).toEqual({ nombre: 'María Pérez', correo: 'maria.perez@ejemplo.com' });

    const corta = await api.post('/api/auth/activacion').send({ token, clave: 'corta' });
    expect(corta.status).toBe(422); // una clave floja no gasta el enlace
    const r = await api.post('/api/auth/activacion').send({ token, clave: NUEVA });
    expect(r.status).toBe(200);
    expect(r.body.usuario).toMatchObject({ correo: 'maria.perez@ejemplo.com', debeCambiarClave: false, personajeListo: false });
    const yo = await cliente(env.app, r.body.token).get('/api/auth/yo');
    expect(yo.status).toBe(200);

    const fila = await env.ctx.prisma.usuario.findFirstOrThrow({ where: { correo: 'maria.perez@ejemplo.com' } });
    expect(fila).toMatchObject({ pendiente: false, enlaceHash: null, enlaceVence: null });
    expect(fila.claveHash.startsWith('scrypt$')).toBe(true);
    expect(await ingresar(env.app, 'maria.perez@ejemplo.com', NUEVA)).toEqual(expect.any(String));
  });

  it('el enlace sirve una sola vez, también si llegan dos peticiones a la vez', async () => {
    const { token } = await perfil('doble@ejemplo.com');
    const api = cliente(env.app);
    const [a, b] = await Promise.all([api.post('/api/auth/activacion').send({ token, clave: NUEVA }), api.post('/api/auth/activacion').send({ token, clave: 'OtraClave2026x' })]);
    expect([a.status, b.status].sort()).toEqual([200, 400]);
    const tercera = await api.post('/api/auth/activacion').send({ token, clave: NUEVA });
    expect(tercera.status).toBe(400);
    expect((await api.post('/api/auth/activacion/consultar').send({ token })).status).toBe(400);
  });

  it('enlace usado, vencido, alterado o inventado: mismo mensaje neutro', async () => {
    const { usuario, token } = await perfil('vence@ejemplo.com');
    const api = cliente(env.app);
    const alterado = token.slice(0, -1) + (token.endsWith('A') ? 'B' : 'A');
    await env.ctx.prisma.usuario.update({ where: { id: usuario.id }, data: { enlaceVence: new Date(Date.now() - 1000) } });
    const mensajes = new Set<string>();
    for (const t of [token, alterado, 'inventado', 'x'.repeat(43)]) {
      const r = await api.post('/api/auth/activacion').send({ token: t, clave: NUEVA });
      expect(r.status).toBe(400);
      mensajes.add(r.body.error);
    }
    expect(mensajes.size).toBe(1);
    expect([...mensajes][0]).toMatch(/no es válido o ya venció/);
    expect([...mensajes][0]).not.toMatch(/vence@|existe/);
  });

  it('un enlace nuevo invalida el anterior', async () => {
    const { usuario, token } = await perfil('nuevo-enlace@ejemplo.com');
    const { enlace } = await env.ctx.auth.generarEnlace(usuario.id);
    await expect(env.ctx.auth.consultarEnlace(token, '')).rejects.toMatchObject({ estado: 400 });
    expect((await env.ctx.auth.consultarEnlace(enlace.token, '')).correo).toBe('nuevo-enlace@ejemplo.com');
  });

  it('un correo sin activar que intenta ingresar recibe el mismo mensaje que una clave mala', async () => {
    await perfil('pendiente@ejemplo.com');
    const api = cliente(env.app);
    const pend = await api.post('/api/auth/login').send({ usuario: 'pendiente@ejemplo.com', clave: NUEVA });
    const nadie = await api.post('/api/auth/login').send({ usuario: 'nadie@ejemplo.com', clave: NUEVA });
    expect(pend.status).toBe(401);
    expect(pend.body.error).toBe(nadie.body.error);
    expect(pend.body.error).toMatch(/enlace de activación/);
    // Tampoco entra con la «clave» interna de las cuentas pendientes.
    expect((await api.post('/api/auth/login').send({ usuario: 'pendiente@ejemplo.com', clave: '!pendiente' })).status).toBe(401);
  });

  it('limita los intentos con enlaces malos por conexión', async () => {
    const e = await crearEntorno();
    try {
      await e.ctx.ajustes.guardar({ ip_intentos_max: 5 });
      const api = cliente(e.app);
      let ultimo = 0;
      for (let i = 0; i < 7; i++) ultimo = (await api.post('/api/auth/activacion/consultar').send({ token: `malo-${i}` })).status;
      expect(ultimo).toBe(429);
    } finally {
      await e.cerrar();
    }
  });
});

describe('administración de perfiles', () => {
  it('solo administración crea perfiles y generar enlaces', async () => {
    const persona = await sesionComo(env, 'rol.persona', 'usuario');
    const constructor = await sesionComo(env, 'rol.constructor', 'constructor');
    for (const s of [persona, constructor]) {
      expect((await s.api.post('/api/admin/usuarios/perfil').send({ nombre: 'Alguien', correo: 'a@ejemplo.com', rol: 'usuario' })).status).toBe(403);
      expect((await s.api.post('/api/admin/usuarios/lote').send({ texto: 'A B, a@ejemplo.com, persona' })).status).toBe(403);
      expect((await s.api.post(`/api/admin/usuarios/${persona.cuenta.id}/enlace`)).status).toBe(403);
    }
  });

  it('crea un perfil con correo obligatorio, único y en minúsculas, y audita sin guardar el enlace', async () => {
    const admin = await sesionComo(env, 'adm.perfil', 'admin');
    const sin = await admin.api.post('/api/admin/usuarios/perfil').send({ nombre: 'Sin Correo', rol: 'usuario' });
    expect(sin.status).toBe(422);
    const r = await admin.api.post('/api/admin/usuarios/perfil').send({ nombre: 'Luis Gómez', correo: ' Luis.Gomez@EJEMPLO.com ', rol: 'constructor', cargo: 'Diseño' });
    expect(r.status).toBe(201);
    expect(r.body.usuario).toMatchObject({ correo: 'luis.gomez@ejemplo.com', rol: 'constructor', cargo: 'Diseño', pendiente: true });
    expect(r.body.enlace.url).toContain('/activar?token=');
    expect(JSON.stringify(r.body.usuario)).not.toContain(r.body.enlace.token);
    const repetido = await admin.api.post('/api/admin/usuarios/perfil').send({ nombre: 'Otro', correo: 'luis.gomez@ejemplo.com', rol: 'usuario' });
    expect(repetido.status).toBe(409);

    const bitacora = await env.ctx.prisma.actividad.findMany({ where: { accion: { in: ['crear_perfil', 'generar_enlace'] } } });
    expect(bitacora.some((a) => a.accion === 'crear_perfil' && a.objeto === 'luis.gomez')).toBe(true);
    expect(JSON.stringify(bitacora)).not.toContain(r.body.enlace.token);

    const nuevo = await admin.api.post(`/api/admin/usuarios/${r.body.usuario.id}/enlace`);
    expect(nuevo.status).toBe(200);
    expect(nuevo.body.enlace.token).not.toBe(r.body.enlace.token);
    expect((await env.ctx.prisma.actividad.findMany({ where: { accion: 'generar_enlace' } })).length).toBeGreaterThan(0);
    // Una cuenta ya activada no tiene enlace, y restablecer su clave sí se puede.
    expect((await admin.api.post(`/api/admin/usuarios/${admin.cuenta.id}/enlace`)).status).toBe(409);
    expect((await admin.api.post(`/api/admin/usuarios/${r.body.usuario.id}/restablecer-clave`)).status).toBe(409);
  });

  it('acepta cualquier dominio por defecto y rechaza los no autorizados cuando se restringe', async () => {
    const admin = await sesionComo(env, 'adm.dominio', 'admin');
    const perfil = (correo: string) => admin.api.post('/api/admin/usuarios/perfil').send({ nombre: 'Externa', correo, rol: 'usuario' });
    // Sin restricción (el valor por defecto está vacío), cualquier dominio sirve.
    expect(env.ctx.auth.dominiosPermitidos()).toEqual([]);
    expect((await perfil('libre@agencia.co')).status).toBe(201);
    // Con una lista, solo valen esos dominios.
    expect((await admin.api.put('/api/admin/ajustes').send({ cambios: { dominios_permitidos: 'ejemplo.com' } })).status).toBe(200);
    const no = await perfil('externa@agencia.co');
    expect(no.status).toBe(422);
    expect(no.body.error).toMatch(/agencia\.co.*no está autorizado/);
    const guardar = await admin.api.put('/api/admin/ajustes').send({ cambios: { dominios_permitidos: 'ejemplo.com, @Agencia.co' } });
    expect(guardar.status).toBe(200);
    expect((await perfil('externa@agencia.co')).status).toBe(201);
    expect((await admin.api.put('/api/admin/ajustes').send({ cambios: { dominios_permitidos: 'no es un dominio' } })).status).toBe(422);
    // Vaciar la lista vuelve a permitir cualquier dominio.
    expect((await admin.api.put('/api/admin/ajustes').send({ cambios: { dominios_permitidos: '' } })).status).toBe(200);
    expect((await perfil('otra@cualquiera.org')).status).toBe(201);
    await admin.api.put('/api/admin/ajustes').send({ cambios: { dominios_permitidos: 'ejemplo.com' } });
  });

  it('el lote crea las válidas, informa cada error y entrega un enlace por persona', async () => {
    const admin = await sesionComo(env, 'adm.lote', 'admin');
    const texto = ['Ana Ruiz, ana.lote@ejemplo.com, persona', 'Beto Díaz, beto.lote@ejemplo.com, constructor', 'Sin Dominio, sd@gmail.com, persona', 'Rol Malo, rm@ejemplo.com, jefe', 'Repetida, ana.lote@ejemplo.com, persona', '', 'Solo Nombre'].join('\n');
    const r = await admin.api.post('/api/admin/usuarios/lote').send({ texto });
    expect(r.status).toBe(201);
    const res = r.body.resultados as { ok: boolean; correo: string; rol: string; error?: string; enlace?: { url: string } }[];
    expect(res.map((x) => x.ok)).toEqual([true, true, false, false, false, false]);
    expect(res[1]).toMatchObject({ rol: 'constructor' });
    expect(res[0]!.enlace!.url).toContain('/activar?token=');
    expect(new Set(res.filter((x) => x.ok).map((x) => x.enlace!.url)).size).toBe(2);
    expect(res[2]!.error).toMatch(/gmail\.com/);
    expect(res[3]!.error).toMatch(/rol/);
    expect(res[4]!.error).toMatch(/correo/);
    const grande = await admin.api.post('/api/admin/usuarios/lote').send({ texto: Array.from({ length: 201 }, (_, i) => `P ${i}, p${i}@ejemplo.com, persona`).join('\n') });
    expect(grande.status).toBe(422);
  });

  it('una cuenta pendiente se ve como tal en la lista y su dueño ya no cuenta como administración activa', async () => {
    const admin = await sesionComo(env, 'adm.lista', 'admin');
    const p = await admin.api.post('/api/admin/usuarios/perfil').send({ nombre: 'Pendiente Admin', correo: 'pend.admin@ejemplo.com', rol: 'admin' });
    const lista = await admin.api.get('/api/admin/usuarios');
    const fila = (lista.body.usuarios as { id: number; pendiente: boolean; enlaceVence: string | null }[]).find((u) => u.id === p.body.usuario.id)!;
    expect(fila.pendiente).toBe(true);
    expect(fila.enlaceVence).toEqual(expect.any(String));
    expect((await admin.api.get('/api/admin/usuarios/correo')).body).toEqual({ disponible: false });
  });
});

describe('contraseña de siempre', () => {
  it('las cuentas creadas con contraseña (demo y pruebas) siguen entrando normal', async () => {
    await crearCuenta(env.ctx, 'clasica', 'usuario');
    expect(await ingresar(env.app, 'clasica', CLAVE)).toEqual(expect.any(String));
  });
});
