import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { cliente, crearEntorno, sesionComo, type Entorno } from './ayudas';

let env: Entorno;
let admin: ReturnType<typeof cliente>;

beforeAll(async () => {
  env = await crearEntorno();
  admin = (await sesionComo(env, 'jefa', 'admin')).api;
});
afterAll(async () => {
  await env.cerrar();
});

const datos = { nombre: 'Diana Castaño', correo: 'Diana@Ejemplo.com', cargo: 'Analista', mensaje: 'Entro la próxima semana.' };

describe('solicitud de acceso pública', () => {
  it('se puede enviar sin sesión y queda pendiente con el correo en minúsculas', async () => {
    const r = await cliente(env.app).post('/api/solicitudes').send(datos);
    expect(r.status).toBe(201);
    const lista = await admin.get('/api/admin/solicitudes?estado=pendiente');
    expect(lista.body.solicitudes).toHaveLength(1);
    expect(lista.body.solicitudes[0]).toMatchObject({ nombre: 'Diana Castaño', correo: 'diana@ejemplo.com', estado: 'pendiente' });
  });

  it('no duplica a quien ya tiene una pendiente', async () => {
    const r = await cliente(env.app).post('/api/solicitudes').send(datos);
    expect(r.status).toBe(201);
    expect(await env.ctx.prisma.solicitud.count()).toBe(1);
  });

  it('valida nombre y correo', async () => {
    expect((await cliente(env.app).post('/api/solicitudes').send({ ...datos, correo: 'mal' })).status).toBe(422);
    expect((await cliente(env.app).post('/api/solicitudes').send({ ...datos, correo: 'otra@ejemplo.com', nombre: '' })).status).toBe(422);
    expect((await cliente(env.app).post('/api/solicitudes').send({ ...datos, correo: 'otra@ejemplo.com', mensaje: 'x'.repeat(501) })).status).toBe(422);
  });

  it('limita cuántas se envían por conexión y por hora', async () => {
    await env.ctx.ajustes.guardar({ solicitudes_por_ip_hora: 2 });
    expect((await cliente(env.app).post('/api/solicitudes').send({ ...datos, correo: 'dos@ejemplo.com' })).status).toBe(201);
    const tercera = await cliente(env.app).post('/api/solicitudes').send({ ...datos, correo: 'tres@ejemplo.com' });
    expect(tercera.status).toBe(429);
  });

  it('se puede cerrar desde la configuración', async () => {
    await env.ctx.ajustes.guardar({ solicitudes_activas: false });
    expect((await cliente(env.app).post('/api/solicitudes').send({ ...datos, correo: 'cerrada@ejemplo.com' })).status).toBe(403);
    expect((await cliente(env.app).get('/api/publico/config')).body.solicitudesActivas).toBe(false);
    await env.ctx.ajustes.guardar({ solicitudes_activas: true, solicitudes_por_ip_hora: 50 });
  });
});

describe('atención de solicitudes', () => {
  it('la administración las marca atendidas o rechazadas, una sola vez', async () => {
    const lista = await admin.get('/api/admin/solicitudes?estado=pendiente');
    const id = lista.body.solicitudes[0].id as number;
    const r = await admin.post(`/api/admin/solicitudes/${id}/atender`).send({ estado: 'atendida' });
    expect(r.status).toBe(200);
    expect(r.body.solicitud).toMatchObject({ estado: 'atendida', atendidaPor: 'jefa' });
    expect((await admin.post(`/api/admin/solicitudes/${id}/atender`).send({ estado: 'rechazada' })).status).toBe(409);
    expect((await admin.post('/api/admin/solicitudes/999/atender').send({ estado: 'atendida' })).status).toBe(404);
    expect((await admin.post(`/api/admin/solicitudes/${id}/atender`).send({ estado: 'otra' })).status).toBe(422);
  });
});
