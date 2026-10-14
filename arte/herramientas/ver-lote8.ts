/**
 * Vista previa de un grupo del lote 8 sin tocar nada publicado ni los archivos de los demás grupos.
 *
 *   npx tsx arte/herramientas/ver-lote8.ts <grupo> [escala=4]
 *
 * `grupo` es una clave de `GRUPOS_LOTE_8` (`pcs-b`, `pequenos`, `maquinas`, ...). Escribe en `arte/salida/`:
 *  - `lote8-<grupo>-hoja.png`: hoja de contacto con todos los cuadros del grupo.
 *  - `lote8-<grupo>-escena.png`: cada objeto apoyado sobre un escritorio de 3 casillas con su silla (los de piso, sueltos en
 *    el suelo), a escala 3, para juzgarlos en contexto junto a la referencia.
 */

import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { CASILLA, huellaDe, objetoPorId } from '@ol/shared';
import { Lienzo, escribirPng, hojaContacto, rutaSalida } from '../src/nucleo';
import { resolverCombinado, resolverDesdePublicados } from '../src/objetos/compositor';
import { framesEsperados } from '../src/objetos/comunes';
import { cuadrosEscritorios } from '../src/objetos/l8-escritorio';
import { cuadrosSillas } from '../src/objetos/l8-silla';
import { GRUPOS_LOTE_8 } from '../src/objetos/l8-todo';

const [grupo, escalaTexto] = process.argv.slice(2);
if (grupo === undefined || GRUPOS_LOTE_8[grupo] === undefined) {
  console.error(`Grupos: ${Object.keys(GRUPOS_LOTE_8).join(', ')}`);
  process.exit(1);
}
const escala = Number(escalaTexto ?? 4);
const cuadros = GRUPOS_LOTE_8[grupo]();
const dir = rutaSalida();
mkdirSync(dir, { recursive: true });
const items = [...cuadros.entries()].map(([id, lienzo]) => ({ id, lienzo }));
escribirPng(hojaContacto(items, { escala, columnas: 4, etiquetas: true }), join(dir, `lote8-${grupo}-hoja.png`));

// Escena: escritorios con lo apoyado, y lo de piso en una fila aparte.
const todos = new Map([...cuadrosEscritorios(), ...cuadrosSillas(), ...cuadros]);
const resolver = resolverCombinado((id) => todos.get(id), resolverDesdePublicados());
const ids = new Set<string>();
for (const id of cuadros.keys()) ids.add(id.split('@')[0]!.split('~')[0]!);
const objetos = [...ids].map((id) => objetoPorId(id)).filter((o) => o !== undefined);
const apoyados = objetos.filter((o) => o.apoyado === true);
const de_piso = objetos.filter((o) => o.apoyado !== true);
const margen = 40;
const ancho = Math.max(12, apoyados.length * 3 + 2) * CASILLA;
const alto = (6 + 6) * CASILLA + margen;
const escena = new Lienzo(Math.min(ancho, 40 * CASILLA), alto);
escena.rect(0, 0, escena.ancho, escena.alto, '#8A90C8');
const pegar = (id: string, x: number, yAbajo: number): void => {
  const c = resolver(id);
  if (c) escena.pegar(c, x, yAbajo - c.alto);
};
let x = CASILLA;
for (const o of apoyados) {
  if (x + 3 * CASILLA > escena.ancho) break;
  pegar('escritorio-3x1@S', x, margen + 2 * CASILLA);
  const f = framesEsperados(o)[0]!;
  pegar(f.id, x, margen + 2 * CASILLA);
  pegar('silla-oficina@N', x + CASILLA, margen + 3 * CASILLA);
  x += 4 * CASILLA;
}
let px = CASILLA;
for (const o of de_piso) {
  const h = huellaDe(o, o.orientaciones[0] ?? 'U');
  if (px + h.ancho * CASILLA > escena.ancho) break;
  const f = framesEsperados(o)[0]!;
  pegar(f.id, px, margen + 8 * CASILLA);
  px += (h.ancho + 1) * CASILLA;
}
escribirPng(escena.escalar(3), join(dir, `lote8-${grupo}-escena.png`));
console.log(`${items.length} cuadros de ${objetos.length} objetos. Hoja y escena en ${dir}`);
