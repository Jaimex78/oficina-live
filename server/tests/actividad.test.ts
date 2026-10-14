import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { celdaCsv } from '../src/auditoria';
import { CLAVE, cliente, crearCuenta, crearEntorno, sesionComo, type Entorno } from './ayudas';

let env: Entorno;
let admin: ReturnType<typeof cliente>;

beforeAll(async () => {
  env = await crearEntorno();
  admin = (await sesionComo(env, 'jefa', 'admin')).api;
  await crearCuenta(env.ctx, 'ana');
  await cliente(env.app).post('/api/auth/login').send({ usuario: 'ana', clave: CLAVE });
  await cliente(env.app).post('/api/auth/login').send({ usuario: 'ana', clave: 'mala1Mala' });
  for (let i = 0; i < 12; i++) await env.ctx.auditoria.registrar({ accion: 'editar_usuario', objeto: `relleno${i}`, ip: '10.0.0.1' });
});
afterAll(async () => {
  await env.cerrar();
});

describe('registro de actividad', () => {
  it('guarda ingresos y fallos con persona, hora e IP', async () => {
    const r = await admin.get('/api/admin/actividad?usuario=ana&porPagina=50');
    const acciones = r.body.registros.map((x: { accion: string }) => x.accion);
    expect(acciones).toContain('login');
    expect(acciones).toContain('login_fallido');
    const login = r.body.registros.find((x: { accion: string }) => x.accion === 'login');
    expect(login.ip).toBeTruthy();
    expect(new Date(login.fecha).getTime()).toBeGreaterThan(Date.now() - 60_000);
  });

  it('pagina, filtra por acción y busca por texto', async () => {
    const p1 = await admin.get('/api/admin/actividad?porPagina=10&pagina=1');
    expect(p1.body.registros).toHaveLength(10);
    expect(p1.body.total).toBeGreaterThan(10);
    const p2 = await admin.get('/api/admin/actividad?porPagina=10&pagina=2');
    expect(p2.body.registros[0].id).toBeLessThan(p1.body.registros[9].id);

    const soloEdiciones = await admin.get('/api/admin/actividad?accion=editar_usuario&porPagina=100');
    expect(soloEdiciones.body.registros.every((x: { accion: string }) => x.accion === 'editar_usuario')).toBe(true);
    expect(soloEdiciones.body.total).toBe(12);

    const busqueda = await admin.get('/api/admin/actividad?q=relleno7');
    expect(busqueda.body.total).toBe(1);

    const futuro = await admin.get(`/api/admin/actividad?desde=${encodeURIComponent(new Date(Date.now() + 86_400_000).toISOString())}`);
    expect(futuro.body.total).toBe(0);
  });

  it('exporta CSV con BOM y deja constancia', async () => {
    const r = await admin.get('/api/admin/actividad/csv?accion=editar_usuario');
    expect(r.status).toBe(200);
    expect(r.headers['content-type']).toContain('text/csv');
    expect(r.headers['content-disposition']).toContain('attachment');
    expect(r.text.startsWith('﻿fecha,usuario,accion,descripcion,objeto,detalle,ip')).toBe(true);
    expect(r.text.split('\r\n').filter(Boolean)).toHaveLength(13);
    expect(await env.ctx.prisma.actividad.count({ where: { accion: 'actividad_exportada' } })).toBe(1);
  });

  it('neutraliza celdas que Excel leería como fórmulas y escapa comillas y comas', () => {
    expect(celdaCsv('=HYPERLINK("http://x")')).toBe(`"'=HYPERLINK(""http://x"")"`);
    expect(celdaCsv('+1+1')).toBe("'+1+1");
    expect(celdaCsv('@cmd')).toBe("'@cmd");
    expect(celdaCsv('a, b')).toBe('"a, b"');
    expect(celdaCsv('normal')).toBe('normal');
  });
});
