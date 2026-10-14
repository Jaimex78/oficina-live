import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { CLAVE, cliente, crearCuenta, crearEntorno, ingresar, sesionComo, type Entorno } from './ayudas';

let env: Entorno;
let api: ReturnType<typeof cliente>;
let adminId: number;

beforeAll(async () => {
  env = await crearEntorno();
  const s = await sesionComo(env, 'jefa', 'admin');
  api = s.api;
  adminId = s.cuenta.id;
});
afterAll(async () => {
  await env.cerrar();
});

describe('crear cuentas', () => {
  it('crea una cuenta con clave temporal que se muestra una sola vez', async () => {
    const r = await api.post('/api/admin/usuarios').send({ usuario: 'Laura.Perez', nombre: 'Laura Pérez', cargo: 'Copy', correo: 'Laura@Ejemplo.com', rol: 'usuario' });
    expect(r.status).toBe(201);
    expect(r.body.usuario).toMatchObject({ usuario: 'laura.perez', correo: 'laura@ejemplo.com', rol: 'usuario', debeCambiarClave: true });
    const temporal = r.body.claveTemporal as string;
    expect(temporal.length).toBeGreaterThanOrEqual(12);

    const guardada = await env.ctx.prisma.usuario.findUniqueOrThrow({ where: { usuario: 'laura.perez' } });
    expect(guardada.claveHash).not.toContain(temporal);

    // puede ingresar con la temporal, pero debe cambiarla
    const token = await ingresar(env.app, 'laura.perez', temporal);
    expect((await cliente(env.app, token).get('/api/cuenta')).body.codigo).toBe('cambiar_clave');

    // la lista no vuelve a mostrar la clave
    const lista = await api.get('/api/admin/usuarios');
    expect(JSON.stringify(lista.body)).not.toContain(temporal);
  });

  it('rechaza usuarios repetidos, nombres inválidos, roles inventados y correos repetidos', async () => {
    expect((await api.post('/api/admin/usuarios').send({ usuario: 'laura.perez', nombre: 'Otra Laura', rol: 'usuario' })).status).toBe(409);
    expect((await api.post('/api/admin/usuarios').send({ usuario: 'Con Espacios', nombre: 'Xx', rol: 'usuario' })).status).toBe(422);
    expect((await api.post('/api/admin/usuarios').send({ usuario: 'ab', nombre: 'Xx', rol: 'usuario' })).status).toBe(422);
    expect((await api.post('/api/admin/usuarios').send({ usuario: 'rolextra', nombre: 'Xx', rol: 'superadmin' })).status).toBe(422);
    expect((await api.post('/api/admin/usuarios').send({ usuario: 'correomal', nombre: 'Xx', rol: 'usuario', correo: 'no-es-correo' })).status).toBe(422);
    const dup = await api.post('/api/admin/usuarios').send({ usuario: 'otrolaura', nombre: 'Laura Dos', rol: 'usuario', correo: 'LAURA@ejemplo.com' });
    expect(dup.status).toBe(409);
    expect(dup.body.error).toMatch(/correo/);
  });
});

describe('editar, bloquear y eliminar', () => {
  it('edita datos y rol, y deja el detalle en la actividad', async () => {
    const u = await crearCuenta(env.ctx, 'editable', 'usuario');
    const r = await api.patch(`/api/admin/usuarios/${u.id}`).send({ cargo: 'Diseño', rol: 'constructor' });
    expect(r.status).toBe(200);
    expect(r.body.usuario).toMatchObject({ cargo: 'Diseño', rol: 'constructor', permisos: ['construir', 'caminar'] });
    const registro = await env.ctx.prisma.actividad.findFirstOrThrow({ where: { accion: 'editar_usuario', objeto: 'editable' } });
    expect(registro.detalle).toContain('rol: usuario → constructor');
  });

  it('nadie se quita la administración ni se desactiva ni se elimina a sí mismo', async () => {
    expect((await api.patch(`/api/admin/usuarios/${adminId}`).send({ rol: 'usuario' })).status).toBe(409);
    expect((await api.patch(`/api/admin/usuarios/${adminId}`).send({ activo: false })).status).toBe(409);
    expect((await api.delete(`/api/admin/usuarios/${adminId}`)).status).toBe(409);
    // cambiar otros datos propios sí se puede
    expect((await api.patch(`/api/admin/usuarios/${adminId}`).send({ cargo: 'Dirección' })).status).toBe(200);
  });

  it('al desactivar una cuenta se cierran sus sesiones y ya no puede ingresar', async () => {
    const u = await crearCuenta(env.ctx, 'saliente', 'usuario');
    const token = await ingresar(env.app, 'saliente');
    expect((await cliente(env.app, token).get('/api/cuenta')).status).toBe(200);

    expect((await api.patch(`/api/admin/usuarios/${u.id}`).send({ activo: false })).status).toBe(200);
    expect((await cliente(env.app, token).get('/api/cuenta')).status).toBe(401);
    expect((await cliente(env.app).post('/api/auth/login').send({ usuario: 'saliente', clave: CLAVE })).status).toBe(401);

    expect((await api.patch(`/api/admin/usuarios/${u.id}`).send({ activo: true })).status).toBe(200);
    expect((await cliente(env.app).post('/api/auth/login').send({ usuario: 'saliente', clave: CLAVE })).status).toBe(200);
  });

  it('restablece la clave: queda temporal, se cierran las sesiones y la anterior deja de valer', async () => {
    const u = await crearCuenta(env.ctx, 'olvidadiza', 'usuario');
    const token = await ingresar(env.app, 'olvidadiza');
    const r = await api.post(`/api/admin/usuarios/${u.id}/restablecer-clave`);
    expect(r.status).toBe(200);
    expect((await cliente(env.app, token).get('/api/cuenta')).status).toBe(401);
    expect((await cliente(env.app).post('/api/auth/login').send({ usuario: 'olvidadiza', clave: CLAVE })).status).toBe(401);
    const nuevo = await cliente(env.app).post('/api/auth/login').send({ usuario: 'olvidadiza', clave: r.body.claveTemporal });
    expect(nuevo.status).toBe(200);
    expect(nuevo.body.usuario.debeCambiarClave).toBe(true);
  });

  it('desbloquea una cuenta bloqueada por intentos', async () => {
    await env.ctx.ajustes.guardar({ intentos_max: 3 });
    const u = await crearCuenta(env.ctx, 'torpe', 'usuario');
    for (let i = 0; i < 3; i++) await cliente(env.app).post('/api/auth/login').send({ usuario: 'torpe', clave: 'mala1Mala' });
    const lista = await api.get('/api/admin/usuarios?q=torpe');
    expect(lista.body.usuarios[0].bloqueadaHasta).toEqual(expect.any(String));

    expect((await api.post(`/api/admin/usuarios/${u.id}/desbloquear`)).status).toBe(200);
    expect((await cliente(env.app).post('/api/auth/login').send({ usuario: 'torpe', clave: CLAVE })).status).toBe(200);
  });

  it('elimina otra cuenta y lo registra', async () => {
    const u = await crearCuenta(env.ctx, 'borrable', 'usuario');
    expect((await api.delete(`/api/admin/usuarios/${u.id}`)).status).toBe(200);
    expect(await env.ctx.prisma.usuario.findUnique({ where: { id: u.id } })).toBeNull();
    expect(await env.ctx.prisma.actividad.count({ where: { accion: 'eliminar_usuario', objeto: 'borrable' } })).toBe(1);
    expect((await api.delete(`/api/admin/usuarios/${u.id}`)).status).toBe(404);
  });
});

describe('lista', () => {
  it('busca por texto y filtra por rol y estado', async () => {
    await crearCuenta(env.ctx, 'busqueda1', 'constructor', { nombre: 'Zacarías Búsqueda' });
    const porTexto = await api.get('/api/admin/usuarios?q=Zacar');
    expect(porTexto.body.usuarios.map((x: { usuario: string }) => x.usuario)).toContain('busqueda1');
    const porRol = await api.get('/api/admin/usuarios?rol=constructor');
    expect(porRol.body.usuarios.every((x: { rol: string }) => x.rol === 'constructor')).toBe(true);
    const inactivos = await api.get('/api/admin/usuarios?activo=0');
    expect(inactivos.body.usuarios.every((x: { activo: boolean }) => !x.activo)).toBe(true);
  });
});
