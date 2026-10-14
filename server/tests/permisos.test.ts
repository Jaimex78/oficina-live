import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { cliente, crearEntorno, sesionComo, type Entorno } from './ayudas';

let env: Entorno;
beforeAll(async () => {
  env = await crearEntorno();
});
afterAll(async () => {
  await env.cerrar();
});

const RUTAS_ADMIN = [
  '/api/admin/usuarios',
  '/api/admin/solicitudes',
  '/api/admin/actividad',
  '/api/admin/actividad/csv',
  '/api/admin/ajustes',
  '/api/admin/respaldos',
  '/api/admin/sistema',
];

describe('quién puede entrar a cada zona', () => {
  it('sin sesión, todo lo privado responde 401', async () => {
    for (const ruta of ['/api/cuenta', ...RUTAS_ADMIN]) {
      const r = await cliente(env.app).get(ruta);
      expect(r.status, ruta).toBe(401);
    }
  });

  it('una persona y un constructor no entran a la administración', async () => {
    for (const rol of ['usuario', 'constructor'] as const) {
      const { api } = await sesionComo(env, `prueba-${rol}`, rol);
      for (const ruta of RUTAS_ADMIN) {
        const r = await api.get(ruta);
        expect(r.status, `${rol} → ${ruta}`).toBe(403);
      }
      expect((await api.get('/api/cuenta')).status).toBe(200);
    }
  });

  it('la administración entra a todo', async () => {
    const { api } = await sesionComo(env, 'jefa', 'admin');
    for (const ruta of RUTAS_ADMIN) {
      const r = await api.get(ruta);
      expect(r.status, ruta).toBe(200);
    }
  });

  it('las escrituras de administración también están cerradas a los demás roles', async () => {
    const { api } = await sesionComo(env, 'persona', 'usuario');
    expect((await api.post('/api/admin/usuarios').send({ usuario: 'x1', nombre: 'Xx', rol: 'admin' })).status).toBe(403);
    expect((await api.put('/api/admin/ajustes').send({ cambios: { sesion_horas: 72 } })).status).toBe(403);
    expect((await api.post('/api/admin/respaldos')).status).toBe(403);
    expect(env.ctx.ajustes.obtener('sesion_horas')).toBe(8);
  });

  it('las rutas que no existen responden 404 en JSON y las cabeceras de seguridad están puestas', async () => {
    const r = await cliente(env.app).get('/api/no-existe');
    expect(r.status).toBe(404);
    expect(r.body.error).toBeTruthy();
    expect(r.headers['x-powered-by']).toBeUndefined();
    expect(r.headers['x-content-type-options']).toBe('nosniff');
    expect(r.headers['content-security-policy']).toContain("default-src 'self'");
    expect(r.headers['content-security-policy']).toContain("frame-ancestors 'none'");
  });

  it('un JSON mal formado devuelve 400 con un mensaje legible', async () => {
    const r = await cliente(env.app).post('/api/auth/login').set('Content-Type', 'application/json').send('{ no es json');
    expect(r.status).toBe(400);
    expect(r.body.error).toMatch(/formato/);
  });
});
