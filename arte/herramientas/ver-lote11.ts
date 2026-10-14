/**
 * Vista previa de un grupo del lote 11 sin tocar nada publicado.
 *
 *   npx tsx arte/herramientas/ver-lote11.ts <grupo> [escala=4] [filtro|todo] [columnas=8]
 *
 * `grupo` es cafe, bebidas, almuerzo o dulces. Escribe `arte/salida/lote11-<grupo>-hoja.png`: la variante base de cada
 * objeto (con `todo` en lugar del filtro, también las variantes).
 */

import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { escribirPng, hojaContacto, rutaSalida } from '../src/nucleo';

const FUENTES: Record<string, [string, string]> = {
  cafe: ['../src/objetos/l11-cafe', 'cuadrosCafe11'],
  bebidas: ['../src/objetos/l11-bebidas', 'cuadrosBebidas11'],
  almuerzo: ['../src/objetos/l11-almuerzo', 'cuadrosAlmuerzo11'],
  dulces: ['../src/objetos/l11-dulces', 'cuadrosDulces11'],
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
const salida = join(dir, `lote11-${grupo}-hoja.png`);
escribirPng(hojaContacto(items, { escala: Number(escalaTexto ?? 4), columnas: Number(columnasTexto ?? 8), etiquetas: true }), salida);
console.log(`${items.length} cuadros en ${salida}`);
