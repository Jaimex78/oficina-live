import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { RAIZ, cargarConfig } from '../src/config';
import { aplicarMigraciones } from '../src/migraciones';

describe('migraciones al arrancar', () => {
  it('crea la base desde cero sin respaldo previo', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ol-mig-'));
    const config = cargarConfig({ dataDir: dir, costoHash: 2 ** 10, secreto: 's'.repeat(40), webDist: null });
    const prisma = new PrismaClient({ datasources: { db: { url: `file:${config.dbPath}` } } });
    try {
      const r = await aplicarMigraciones(config, prisma);
      expect(r.aplicadas).toBeGreaterThan(0);
      expect(r.respaldo).toBeNull();
      expect(await prisma.usuario.count()).toBe(0);
      expect((await aplicarMigraciones(config, prisma)).aplicadas).toBe(0);
    } finally {
      await prisma.$disconnect();
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('antes de cambiar el esquema de una base con datos, guarda una copia «previo-migracion»', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ol-mig-'));
    const prismaDir = path.join(dir, 'prisma');
    fs.cpSync(path.join(RAIZ, 'server', 'prisma'), prismaDir, { recursive: true });
    const config = cargarConfig({
      dataDir: path.join(dir, 'datos'),
      costoHash: 2 ** 10,
      secreto: 's'.repeat(40),
      webDist: null,
      migracionesDir: path.join(prismaDir, 'migrations'),
      schemaPrisma: path.join(prismaDir, 'schema.prisma'),
    });
    const prisma = new PrismaClient({ datasources: { db: { url: `file:${config.dbPath}` } } });
    try {
      await aplicarMigraciones(config, prisma);
      await prisma.usuario.create({ data: { usuario: 'existente', nombre: 'Ya Estaba', claveHash: 'x' } });

      // llega una migración nueva
      const nueva = path.join(prismaDir, 'migrations', '29990101000000_prueba');
      fs.mkdirSync(nueva);
      fs.writeFileSync(path.join(nueva, 'migration.sql'), 'CREATE TABLE "Prueba" ("id" INTEGER NOT NULL PRIMARY KEY);\n');

      const r = await aplicarMigraciones(config, prisma);
      expect(r.aplicadas).toBe(1);
      expect(r.respaldo).toMatch(/previo-migracion\.sqlite$/);
      expect(fs.existsSync(path.join(config.respaldosDir, r.respaldo as string))).toBe(true);

      // la copia tiene los datos de antes de migrar
      const copia = new PrismaClient({ datasources: { db: { url: `file:${path.join(config.respaldosDir, r.respaldo as string)}` } } });
      try {
        expect(await copia.usuario.count()).toBe(1);
        await expect(copia.$queryRawUnsafe('SELECT * FROM "Prueba"')).rejects.toThrow();
      } finally {
        await copia.$disconnect();
      }
      // y la base migrada conserva los datos y tiene la tabla nueva
      expect(await prisma.usuario.count()).toBe(1);
      expect(await prisma.$queryRawUnsafe('SELECT * FROM "Prueba"')).toEqual([]);
    } finally {
      await prisma.$disconnect();
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
