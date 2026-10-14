/**
 * Vista previa de un grupo del lote 9 sin tocar nada publicado.
 *
 *   npx tsx arte/herramientas/ver-lote9.ts <grupo> [escala=3] [filtro]
 *
 * `grupo` es una clave de `GRUPOS_LOTE_9` (`sillas`, `sofas`, `mesas`, `almacenaje`). Escribe en `arte/salida/`
 * `lote9-<grupo>-hoja.png`: una hoja de contacto con la vista `S` de la variante base de cada objeto (y `filtro`, si se da,
 * deja solo los ids que lo contienen; con `todo` en lugar del filtro dibuja también las demás orientaciones).
 */

import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { escribirPng, hojaContacto, rutaSalida } from '../src/nucleo';
import { GRUPOS_LOTE_9 } from '../src/objetos/l9-todo';

const [grupo, escalaTexto, filtro] = process.argv.slice(2);
if (grupo === undefined || GRUPOS_LOTE_9[grupo] === undefined) {
  console.error(`Grupos: ${Object.keys(GRUPOS_LOTE_9).join(', ')}`);
  process.exit(1);
}
const cuadros = GRUPOS_LOTE_9[grupo]();
const todo = filtro === 'todo';
const items = [...cuadros.entries()]
  .filter(([id]) => (todo || !id.includes('~')) && (todo || /@S$|^[^@]+$/.test(id)) && (filtro === undefined || todo || id.includes(filtro)))
  .map(([id, lienzo]) => ({ id, lienzo }));
const dir = rutaSalida();
mkdirSync(dir, { recursive: true });
escribirPng(hojaContacto(items, { escala: Number(escalaTexto ?? 3), columnas: 6, etiquetas: true }), join(dir, `lote9-${grupo}-hoja.png`));
console.log(`${items.length} cuadros en ${join(dir, `lote9-${grupo}-hoja.png`)}`);
