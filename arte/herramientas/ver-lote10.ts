/**
 * Vista previa de un grupo del lote 10 sin tocar nada publicado.
 *
 *   npx tsx arte/herramientas/ver-lote10.ts <grupo> [escala=3] [filtro|todo] [columnas=8]
 *
 * `grupo` es plantas, luz (lámparas, arte y museo), piezas o deportes (deportes y temporada). Escribe `arte/salida/lote10-<grupo>-hoja.png`: la variante base de cada objeto
 * (con `todo` en lugar del filtro, también las variantes).
 */

import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { escribirPng, hojaContacto, rutaSalida } from '../src/nucleo';

const FUENTES: Record<string, [string, string]> = {
  plantas: ['../src/objetos/l10-plantas', 'cuadrosPlantas10'],
  luz: ['../src/objetos/l10-luz', 'cuadrosLuz10'],
  piezas: ['../src/objetos/l10-piezas', 'cuadrosPiezas10'],
  deportes: ['../src/objetos/l10-deportes', 'cuadrosDeportes10'],
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
const salida = join(dir, `lote10-${grupo}-hoja.png`);
escribirPng(hojaContacto(items, { escala: Number(escalaTexto ?? 3), columnas: Number(columnasTexto ?? 8), etiquetas: true }), salida);
console.log(`${items.length} cuadros en ${salida}`);
