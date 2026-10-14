/**
 * Luces de pared del lote 12: cuerdas de luces, linterna de papel, farol marroquí, luz industrial, lámpara de pared y paneles
 * hexagonales. Todas llevan emisor: la parte que alumbra se dibuja con los tonos más claros y saturados de su rampa.
 */

import { Lienzo, rampa } from '../nucleo';
import type { ColorEntrada } from '../nucleo';
import { poligono } from './l2b-comun';
import { registrarTabla } from './l12-comun';
import type { Cuadros, Dibujo, Fila } from './l12-comun';

/** Altura del hilo de una cuerda en la columna `x`: dos senos de 30 px de ancho que cuelgan entre clavos. */
const cuelga = (x: number, x0: number, ancho: number, flecha: number): number => 2 + Math.round(flecha * Math.sin((Math.PI * (((x - x0) % ancho) + 0.5)) / ancho));

function cuerda(l: Lienzo, W: number, colores: readonly ColorEntrada[], cada = 5): void {
  const ancho = (W - 4) / 2;
  for (let x = 2; x < W - 2; x++) l.px(x, cuelga(x, 2, ancho, 6), 'neutro-3');
  for (const x of [2, 2 + ancho, W - 3]) {
    l.px(x, 1, 'metal-3');
    l.px(x, 2, 'metal-2');
  }
  let k = 0;
  for (let x = 4; x < W - 3; x += cada) {
    const y = cuelga(x, 2, ancho, 6) + 1;
    const c = colores[k % colores.length] as ColorEntrada;
    l.rect(x, y, 2, 3, c);
    l.px(x, y, 'neutro-7');
    l.px(x, y - 1, 'metal-2');
    k++;
  }
}

const dibCuerdaColores: Dibujo = (l, W) => cuerda(l, W, ['rojo-3', 'tela-calida-3', 'planta-4', 'vidrio-3', 'morado-3', 'naranja-3']);
const dibCuerdaColor: Dibujo = (l, W) => cuerda(l, W, ['tela-calida-3', 'tela-calida-2']);

function linterna(l: Lienzo): void {
  l.linea(15, 1, 15, 4, 'neutro-3');
  l.rect(13, 4, 5, 2, 'neutro-2');
  l.rect(13, 4, 5, 1, 'neutro-4');
  l.elipse(15.5, 16, 8, 9.5, 'rojo-suave-2');
  l.elipse(14.5, 15, 6.5, 8, 'rojo-suave-3');
  l.elipse(14, 14, 4, 6, 'rojo-suave-4');
  // Costillas del papel plegado.
  for (const dx of [-5, -2, 2, 5]) l.linea(15 + dx, 8 + Math.abs(dx) / 2, 15 + dx, 24 - Math.abs(dx) / 2, 'rojo-suave-1');
  l.rect(13, 24, 5, 2, 'neutro-2');
  l.rect(13, 24, 5, 1, 'neutro-4');
  l.linea(15, 26, 15, 29, 'neutro-3');
  l.rect(14, 29, 3, 1, 'rojo-suave-4');
  l.px(11, 11, 'neutro-7');
}

function farol(l: Lienzo): void {
  l.elipse(15.5, 2, 2, 1.5, 'metal-3', { relleno: false });
  l.rect(14, 3, 4, 2, 'metal-2');
  poligono(l, [[15.5, 5], [23, 11], [8, 11]], 'metal-2');
  l.rect(8, 11, 15, 2, 'neutro-2');
  l.rect(8, 11, 15, 1, 'metal-3');
  // Cuerpo con tres vidrios de colores.
  l.rect(9, 13, 13, 13, 'neutro-2');
  const vidrios: ColorEntrada[] = ['naranja-3', 'tela-calida-3', 'rojo-suave-3'];
  vidrios.forEach((c, i) => {
    l.rect(10 + i * 4, 14, 3, 11, c);
    l.rect(10 + i * 4, 14, 1, 11, 'neutro-7');
    l.rect(10 + i * 4, 21, 3, 4, i === 1 ? 'naranja-3' : 'tela-calida-3');
  });
  l.rect(8, 26, 15, 2, 'neutro-2');
  l.rect(8, 26, 15, 1, 'metal-3');
  poligono(l, [[10, 28], [21, 28], [18, 30], [13, 30]], 'metal-1');
}

function luzIndustrial(l: Lienzo): void {
  l.rect(12, 1, 8, 3, 'metal-2');
  l.rect(12, 1, 8, 1, 'metal-3');
  l.rect(14, 4, 4, 6, 'neutro-2');
  l.rect(14, 4, 1, 6, 'metal-2');
  l.rect(15, 10, 4, 3, 'neutro-2');
  // Pantalla de cúpula y bombilla debajo.
  l.elipseSombreada(15.5, 19, 9.5, 6.5, ['neutro-1', 'neutro-2', 'neutro-3', 'neutro-4']);
  l.rect(5, 19, 22, 8, null);
  l.rect(5, 19, 22, 2, 'neutro-2');
  l.rect(4, 21, 24, 2, 'neutro-1');
  l.rect(4, 21, 24, 1, 'neutro-3');
  l.rect(13, 23, 6, 1, 'metal-2');
  l.rect(13, 24, 6, 3, 'tela-calida-3');
  l.rect(14, 24, 2, 2, 'blanco');
  l.rect(14, 27, 4, 1, 'tela-calida-2');
}

function lamparaPared(l: Lienzo): void {
  // Placa, brazo curvo y pantalla cónica que alumbra hacia arriba y hacia abajo.
  l.rect(13, 22, 6, 7, 'metal-2');
  l.rect(13, 22, 6, 1, 'metal-3');
  l.rect(13, 22, 1, 7, 'metal-3');
  l.rect(18, 23, 1, 6, 'metal-1');
  l.rect(15, 17, 2, 6, 'metal-2');
  l.rect(15, 17, 1, 6, 'metal-3');
  poligono(l, [[9, 17], [23, 17], [21, 6], [11, 6]], 'crema-3');
  poligono(l, [[10, 16], [16, 16], [15, 7], [12, 7]], 'crema-4');
  l.rect(22, 8, 1, 9, 'crema-1');
  l.rect(9, 17, 14, 1, 'crema-2');
  l.rect(11, 5, 10, 1, 'tela-calida-3');
  l.rect(10, 18, 12, 1, 'tela-calida-3');
  l.rect(12, 19, 8, 1, 'tela-calida-2');
}

const HEX_CENTROS: ReadonlyArray<readonly [number, number]> = [[13, 11], [31, 11], [49, 11], [22, 18], [40, 18]];

function luzHex(l: Lienzo): void {
  const R = 6;
  for (const [cx, cy] of HEX_CENTROS) {
    const pts = (r: number): Array<[number, number]> => [[cx - r, cy], [cx - r / 2, cy - r * 0.87], [cx + r / 2, cy - r * 0.87], [cx + r, cy], [cx + r / 2, cy + r * 0.87], [cx - r / 2, cy + r * 0.87]];
    poligono(l, pts(R), 'tela-calida-1');
    poligono(l, pts(R - 1), 'tela-calida-2');
    poligono(l, pts(R - 2.2), 'tela-calida-3');
    l.rect(cx - 2, cy - 2, 2, 1, 'blanco');
    l.px(cx - 2, cy - 1, 'blanco');
  }
}

export const TABLA_LUCES: readonly Fila[] = [
  ['luces-cuerda-colores', dibCuerdaColores],
  ['luces-cuerda-color', dibCuerdaColor, rampa('tela-calida')],
  ['linterna-papel-pastel', linterna, rampa('rojo-suave')],
  ['farol-marroqui-pared', farol],
  ['luz-industrial-pared', luzIndustrial],
  ['lampara-pared', lamparaPared, rampa('crema')],
  ['luces-hexagonales', luzHex, rampa('tela-calida')],
];

export function cuadrosLuces12(): Cuadros {
  return registrarTabla(new Map(), TABLA_LUCES);
}
