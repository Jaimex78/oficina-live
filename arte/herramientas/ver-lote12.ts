/**
 * Vista previa de un grupo del lote 12 (objetos de pared) sin tocar nada publicado.
 *
 *   npx tsx arte/herramientas/ver-lote12.ts <grupo> [escala=4] [filtro|todo] [columnas=9]
 *
 * `grupo` es ventanas, arte, luces, plantas u otros. Escribe `arte/salida/lote12-<grupo>-hoja.png`: las tres orientaciones
 * (S, E y O) de la variante base de cada objeto (con `todo` en lugar del filtro, también las variantes).
 */

import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { escribirPng, hojaContacto, rutaSalida } from '../src/nucleo';

const FUENTES: Record<string, [string, string]> = {
  ventanas: ['../src/objetos/l12-ventanas', 'cuadrosVentanas12'],
  arte: ['../src/objetos/l12-arte', 'cuadrosArte12'],
  luces: ['../src/objetos/l12-luces', 'cuadrosLuces12'],
  plantas: ['../src/objetos/l12-plantas', 'cuadrosPlantas12'],
  otros: ['../src/objetos/l12-otros', 'cuadrosOtros12'],
};
const [grupo, escalaTexto, filtro, columnasTexto] = process.argv.slice(2);
if (grupo === undefined || FUENTES[grupo] === undefined) {
  console.error(`Grupos: ${Object.keys(FUENTES).join(', ')}`);
  process.exit(1);
}
const [ruta, nombre] = FUENTES[grupo] as [string, string];
const modulo = (await import(ruta)) as Record<string, () => Map<string, import('../src/nucleo').Lienzo>>;
const cuadros = (modulo[nombre] as () => Map<string, import('../src/nucleo').Lienzo>)();
const todo = filtro === 'todo';
const items = [...cuadros.entries()]
  .filter(([id]) => (todo || !id.includes('~')) && (filtro === undefined || todo || filtro.split('|').some((f) => id.includes(f))))
  .map(([id, lienzo]) => ({ id, lienzo }));
const dir = rutaSalida();
mkdirSync(dir, { recursive: true });
const salida = join(dir, `lote12-${grupo}-hoja.png`);
escribirPng(hojaContacto(items, { escala: Number(escalaTexto ?? 4), columnas: Number(columnasTexto ?? 9), etiquetas: true }), salida);
console.log(`${items.length} cuadros en ${salida}`);
