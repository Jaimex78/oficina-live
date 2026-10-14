import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = path.dirname(fileURLToPath(import.meta.url));

/** Raíz del proyecto: server/src -> server -> raíz. */
export const RAIZ = path.resolve(aqui, '..', '..');
export const VERSION = '0.1.0';

export interface Config {
  puerto: number;
  host: string;
  /** Carpeta con la base, los respaldos y el secreto. Nunca es pública ni va en git. */
  dataDir: string;
  dbPath: string;
  respaldosDir: string;
  /** Carpeta con la interfaz compilada. Si no existe, el servidor solo expone la API. */
  webDist: string | null;
  secreto: string;
  /** Detrás de Cloudflare o un proxy: confiar en la IP que ellos informan. */
  confiarProxy: boolean;
  /** Hosts que pueden abrir el WebSocket cuando el sitio está detrás de un proxy que cambia el Host. */
  origenesPermitidos: string[];
  demo: boolean;
  /** Versión final local: carpeta data-local, sin cuentas ni datos de ejemplo. */
  local: boolean;
  /** Dirección que ve quien abre un enlace de activación (para armar los enlaces escritos por el servidor). */
  urlPublica: string;
  /** Mapa con el que arranca una base nueva: «vacia» (cascarón del edificio) o «naos» (planta de ejemplo). */
  plantillaInicial: 'vacia' | 'naos';
  /** Costo de scrypt (N). Más bajo solo en pruebas. */
  costoHash: number;
  migracionesDir: string;
  schemaPrisma: string;
}

function leerSecreto(dataDir: string): string {
  const env = process.env.OL_SECRETO?.trim();
  if (env && env.length >= 32) return env;
  const archivo = path.join(dataDir, 'secreto.key');
  if (fs.existsSync(archivo)) return fs.readFileSync(archivo, 'utf8').trim();
  const nuevo = crypto.randomBytes(48).toString('hex');
  fs.writeFileSync(archivo, `${nuevo}\n`, { mode: 0o600 });
  return nuevo;
}

export function cargarConfig(sobre: Partial<Config> = {}): Config {
  const demo = sobre.demo ?? process.env.OL_DEMO === '1';
  const local = sobre.local ?? (process.env.OL_LOCAL === '1' && !demo);
  const dataDir = sobre.dataDir ?? path.resolve(process.env.OL_DATA ?? path.join(RAIZ, demo ? 'data-demo' : local ? 'data-local' : 'data'));
  fs.mkdirSync(dataDir, { recursive: true, mode: 0o700 });
  const respaldosDir = path.join(dataDir, 'respaldos');
  fs.mkdirSync(respaldosDir, { recursive: true, mode: 0o700 });
  const webDist = path.join(RAIZ, 'web', 'dist');
  return {
    puerto: Number(process.env.OL_PUERTO ?? 8790),
    host: process.env.OL_HOST ?? '127.0.0.1',
    dataDir,
    dbPath: path.join(dataDir, 'interna.sqlite'),
    respaldosDir,
    webDist: fs.existsSync(path.join(webDist, 'index.html')) ? webDist : null,
    secreto: leerSecreto(dataDir),
    confiarProxy: process.env.OL_PROXY === '1',
    origenesPermitidos: (process.env.OL_ORIGENES ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    demo,
    local,
    urlPublica: (process.env.OL_URL_PUBLICA ?? 'http://localhost:5190').replace(/\/+$/, ''),
    plantillaInicial: demo ? 'naos' : 'vacia',
    costoHash: 2 ** 15,
    migracionesDir: path.join(RAIZ, 'server', 'prisma', 'migrations'),
    schemaPrisma: path.join(RAIZ, 'server', 'prisma', 'schema.prisma'),
    ...sobre,
  };
}
