import fs from 'node:fs';
import path from 'node:path';
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

describe('respaldos', () => {
  it('crea una copia consistente de la base, la lista y la audita', async () => {
    const r = await admin.post('/api/admin/respaldos');
    expect(r.status).toBe(201);
    const nombre = r.body.respaldo.nombre as string;
    expect(nombre).toMatch(/^respaldo-\d{8}-\d{9}-manual\.sqlite$/);
    const archivo = path.join(env.ctx.config.respaldosDir, nombre);
    expect(fs.readFileSync(archivo).subarray(0, 15).toString()).toBe('SQLite format 3');
    expect(fs.statSync(archivo).mode & 0o777).toBe(0o600);
    expect((await admin.get('/api/admin/respaldos')).body.respaldos.map((x: { nombre: string }) => x.nombre)).toContain(nombre);
    expect(await env.ctx.prisma.actividad.count({ where: { accion: 'respaldo_manual' } })).toBe(1);
  });

  it('descarga el archivo y deja constancia', async () => {
    const lista = (await admin.get('/api/admin/respaldos')).body.respaldos as { nombre: string; bytes: number }[];
    const nombre = lista[0]!.nombre;
    const r = await admin.get(`/api/admin/respaldos/${nombre}`).buffer(true).parse((res, cb) => {
      const trozos: Buffer[] = [];
      res.on('data', (t: Buffer) => trozos.push(t));
      res.on('end', () => cb(null, Buffer.concat(trozos)));
    });
    expect(r.status).toBe(200);
    expect((r.body as Buffer).length).toBe(lista[0]!.bytes);
    expect(await env.ctx.prisma.actividad.count({ where: { accion: 'respaldo_descargado' } })).toBe(1);
  });

  it('no deja descargar nada fuera de la carpeta de respaldos', async () => {
    for (const nombre of ['..%2Fsecreto.key', '..%2F..%2Fetc%2Fpasswd', 'interna.sqlite', 'respaldo-x-manual.sqlite']) {
      const r = await admin.get(`/api/admin/respaldos/${nombre}`);
      expect(r.status, nombre).toBe(404);
    }
  });

  it('conserva solo los más recientes, pero nunca borra los previos a una migración', async () => {
    fs.copyFileSync(env.ctx.config.dbPath, path.join(env.ctx.config.respaldosDir, 'respaldo-20200101-000000000-previo-migracion.sqlite'));
    await env.ctx.ajustes.guardar({ respaldos_max: 2 });
    for (let i = 0; i < 4; i++) await admin.post('/api/admin/respaldos');
    const lista = env.ctx.respaldos.listar();
    expect(lista.filter((r) => r.motivo === 'manual')).toHaveLength(2);
    expect(lista.filter((r) => r.motivo === 'previo-migracion')).toHaveLength(1);
  });

  it('el automático solo se hace cuando pasó el tiempo configurado', async () => {
    const otro = await crearEntorno();
    try {
      await otro.ctx.ajustes.guardar({ respaldo_auto_horas: 0 });
      expect(await otro.ctx.respaldos.automatico()).toBeNull();
      await otro.ctx.ajustes.guardar({ respaldo_auto_horas: 1 });
      const primero = await otro.ctx.respaldos.automatico();
      expect(primero?.motivo).toBe('auto');
      expect(await otro.ctx.respaldos.automatico()).toBeNull();
    } finally {
      await otro.cerrar();
    }
  });
});
