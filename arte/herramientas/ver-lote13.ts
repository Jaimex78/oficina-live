/**
 * Vista previa de un grupo del lote 13 (exterior y juegos) sin tocar nada publicado.
 *
 *   npx tsx arte/herramientas/ver-lote13.ts <grupo> [escala=3] [filtro|todo] [columnas=8]
 *
 * `grupo` es arboles, jardin (agua y plantas), exterior o juegos (incluye pizarras y objetos inteligentes). Escribe
 * `arte/salida/lote13-<grupo>-hoja.png`: la variante base de cada objeto (con `todo` en lugar del filtro, también las variantes).
 */

import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { escribirPng, hojaContacto, rutaSalida } from '../src/nucleo';

const FUENTES: Record<string, [string, string]> = {
  arboles: ['../src/objetos/l13-arboles', 'cuadrosArboles13'],
  jardin: ['../src/objetos/l13-jardin', 'cuadrosJardin13'],
  exterior: ['../src/objetos/l13-exterior', 'cuadrosExterior13'],
  juegos: ['../src/objetos/l13-juegos', 'cuadrosJuegos13'],
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
  .filter(([id]) => (todo || !id.includes('~')) && (filtro === undefined || filtro === '' || todo || filtro.split('|').some((f) => id.includes(f))))
  .map(([id, lienzo]) => ({ id, lienzo }));
const dir = rutaSalida();
mkdirSync(dir, { recursive: true });
const salida = join(dir, `lote13-${grupo}-hoja.png`);
escribirPng(hojaContacto(items, { escala: Number(escalaTexto ?? 3), columnas: Number(columnasTexto ?? 8), etiquetas: true }), salida);
console.log(`${items.length} cuadros en ${salida}`);
