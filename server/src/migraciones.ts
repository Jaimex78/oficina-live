import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import type { PrismaClient } from '@prisma/client';
import { RAIZ, type Config } from './config';
import { nombreRespaldo } from './respaldos';

/**
 * Aplica las migraciones pendientes al arrancar. Si la base ya tenía datos, guarda antes una copia
 * "previo-migracion" (estándar de plataformas: respaldo antes de cada cambio de esquema).
 */
export async function aplicarMigraciones(config: Config, prisma: PrismaClient): Promise<{ aplicadas: number; respaldo: string | null }> {
  const totales = fs.existsSync(config.migracionesDir)
    ? fs.readdirSync(config.migracionesDir, { withFileTypes: true }).filter((d) => d.isDirectory()).length
    : 0;

  let hechas = 0;
  if (fs.existsSync(config.dbPath) && fs.statSync(config.dbPath).size > 0) {
    try {
      const filas = await prisma.$queryRawUnsafe<{ n: number | bigint }[]>('SELECT COUNT(*) AS n FROM _prisma_migrations WHERE finished_at IS NOT NULL');
      hechas = Number(filas[0]?.n ?? 0);
    } catch {
      hechas = 0;
    }
  }

  const pendientes = totales - hechas;
  if (pendientes <= 0) return { aplicadas: 0, respaldo: null };

  let respaldo: string | null = null;
  if (hechas > 0) {
    respaldo = nombreRespaldo('previo-migracion');
    fs.copyFileSync(config.dbPath, path.join(config.respaldosDir, respaldo));
    fs.chmodSync(path.join(config.respaldosDir, respaldo), 0o600);
  }

  const cli = path.join(RAIZ, 'node_modules', 'prisma', 'build', 'index.js');
  execFileSync(process.execPath, [cli, 'migrate', 'deploy', '--schema', config.schemaPrisma], {
    env: { ...process.env, DATABASE_URL: `file:${config.dbPath}` },
    stdio: 'pipe',
  });
  return { aplicadas: pendientes, respaldo };
}
