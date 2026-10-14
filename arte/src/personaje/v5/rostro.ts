/**
 * Pieles y caras sobre los sprites del diseñador.
 *
 *  - 5 pieles: cada una cambia solo los colores de piel del sprite (letras b base, c sombra, i peca, m sombra de brazo, e sombra honda,
 *    j rubor, B brillo). La piel 2 es la del diseñador; las otras cuatro siguen la escala de Gather (de clara a oscura).
 *  - 5 caras: la cara del diseñador (0) y 4 variantes que solo tocan pecas, manchas, brillo, cejas y boca; los ojos no cambian.
 */

import { LEYENDA } from './datos-disenador';
import type { Rejilla } from './rejilla';

export const NOMBRES_PIEL = ['Piel 1', 'Piel 2 (base)', 'Piel 3', 'Piel 4', 'Piel 5'] as const;
export const PIELES_V5: Record<string, string>[] = [
  { b: '#FDD7B8', c: '#E8A184', i: '#E09A76', m: '#C98660', e: '#8B5237', j: '#F68E7A', B: '#FFE9D6' },
  { b: LEYENDA.b!, c: LEYENDA.c!, i: LEYENDA.i!, m: LEYENDA.m!, e: LEYENDA.e!, j: LEYENDA.j!, B: '#FFD9BC' },
  { b: '#D79A6E', c: '#B2693F', i: '#B77A4D', m: '#8A4B2A', e: '#5B301C', j: '#D9745A', B: '#E8B38D' },
  { b: '#B07646', c: '#8A4F2A', i: '#94603A', m: '#6B3A1E', e: '#44220F', j: '#B5533E', B: '#C79465' },
  { b: '#80522F', c: '#5B351C', i: '#6A401F', m: '#482611', e: '#2D1609', j: '#8D4531', B: '#9A6A44' },
];

/** Leyenda de letras con la piel `n` (0..4) puesta. */
export function leyendaConPiel(n: number, extra: Record<string, string> = {}): Record<string, string> {
  return { ...LEYENDA, ...PIELES_V5[n]!, ...extra };
}

export const NOMBRES_CARA = ['cara 1: la base', 'cara 2: lisa', 'cara 3: pecas', 'cara 4: manchas', 'cara 5: brillo y sonrisa'] as const;

const en = (g: Rejilla, x: number, y: number, de: string, a: string): void => {
  if (de.includes(g[y]![x]!)) g[y]![x] = a;
};

/** Cambia las pecas y rasgos de la cara de frente (S). Los ojos (filas 41..43) no se tocan. */
export function caraFrente(g: Rejilla, n: number): void {
  if (n === 1) {
    for (let y = 42; y <= 46; y++) for (let x = 10; x <= 21; x++) en(g, x, y, 'i', 'b');
  } else if (n === 2) {
    for (const [x, y] of [[14, 42], [17, 42], [15, 44], [12, 45], [19, 45], [13, 38], [18, 38]] as const) en(g, x, y, 'b', 'i');
  } else if (n === 3) {
    for (const [x, y] of [[12, 35], [13, 35], [13, 36], [19, 34], [19, 35], [16, 33], [11, 38], [21, 38]] as const) en(g, x, y, 'b', 'c');
    for (const [x, y] of [[15, 36], [17, 37]] as const) en(g, x, y, 'b', 'i');
  } else if (n === 4) {
    for (const [x, y] of [[11, 32], [12, 32], [12, 33], [13, 33], [13, 34], [12, 34], [11, 35], [12, 35], [14, 32], [14, 33], [15, 32], [10, 37], [10, 38], [11, 37]] as const) en(g, x, y, 'b', 'B');
    for (const x of [11, 12, 13, 18, 19, 20]) en(g, x, 39, 'c', 'h');
    for (const x of [15, 16]) en(g, x, 44, 'b', 'e');
  }
}

/** Lo mismo para el perfil izquierdo (I). */
export function caraPerfil(g: Rejilla, n: number): void {
  if (n === 1) {
    for (let y = 40; y <= 45; y++) for (let x = 8; x <= 17; x++) en(g, x, y, 'i', 'b');
  } else if (n === 2) {
    for (const [x, y] of [[10, 43], [12, 44], [9, 41], [11, 38], [16, 39]] as const) en(g, x, y, 'b', 'i');
  } else if (n === 3) {
    for (const [x, y] of [[11, 35], [12, 35], [13, 34], [15, 36], [10, 37], [14, 45]] as const) en(g, x, y, 'b', 'c');
  } else if (n === 4) {
    for (const [x, y] of [[10, 33], [11, 33], [11, 34], [12, 34], [12, 35], [13, 33], [14, 33], [10, 35], [9, 37], [10, 37]] as const) en(g, x, y, 'b', 'B');
    for (const x of [11, 12, 13]) en(g, x, 39, 'c', 'h');
    for (const x of [9, 10]) en(g, x, 44, 'b', 'e');
  }
}
