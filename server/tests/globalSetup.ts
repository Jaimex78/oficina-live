import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { RAIZ } from '../src/config';

/** Base ya migrada, creada una sola vez. Cada archivo de pruebas trabaja sobre su propia copia. */
export const PLANTILLA = path.join(os.tmpdir(), 'ol-plantilla-pruebas.sqlite');

export default function setup(): void {
  fs.rmSync(PLANTILLA, { force: true });
  execFileSync(
    process.execPath,
    [path.join(RAIZ, 'node_modules', 'prisma', 'build', 'index.js'), 'migrate', 'deploy', '--schema', path.join(RAIZ, 'server', 'prisma', 'schema.prisma')],
    { env: { ...process.env, DATABASE_URL: `file:${PLANTILLA}` }, stdio: 'pipe' },
  );
}
