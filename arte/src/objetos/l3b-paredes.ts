/**
 * Cuadro de mariposas del lote 3B (colgado de la pared, 2 x 1, sobresale 0).
 *
 * Geometría de paredes del lote 1: la cara del sur ocupa de la fila 16 a la 63 de la pared y el zócalo las 8 últimas.
 * Un colgante de `sobresale` 0 cubre de la fila 32 a la 63: su cara visible son las filas 0 a 23. En las paredes
 * verticales (`E` y `O`) solo se ve la franja de la tapa, así que el cuadro es una placa delgada pegada a ella.
 * Sombra: 1 px a la derecha y abajo sobre la pared.
 */

import { Lienzo } from '../nucleo';
import { CR, NE, W, AZ, VI, NA, MO, RS, TC, PL, registrar, terminar } from './l3b-comun';
import type { Cuadros, Tres } from './l3b-comun';

/** Colores de cada ejemplar: borde de ala, ala y mancha clara. */
const ESPECIES: readonly Tres[] = [
  [VI(0), VI(1), VI(3)],
  [NA(1), NA(2), NA(4)],
  [MO(1), MO(2), MO(4)],
  [RS(1), RS(2), RS(4)],
  [TC(1), TC(2), TC(3)],
  [PL(1), PL(3), PL(4)],
];

/** Mariposa abierta de 11 x 8: borde `o`, ala `w`, mancha `s` y cuerpo `b`. Simétrica respecto de su columna central. */
const MARIPOSA = [
  '...o...o...',
  '.oooo.oooo.',
  'owwwwbwwwwo',
  'owswwbwwswo',
  '.owwobowwo.',
  '..owwbwwo..',
  '..owobowo..',
  '...oo.oo...',
] as const;

function mariposa(l: Lienzo, x: number, y: number, t: Tres): void {
  l.pegar(Lienzo.desdeTexto(MARIPOSA, { o: t[0], w: t[1], s: t[2], b: AZ(1) }), x, y);
}

/** Cuadro de frente: marco de nogal, fondo crema y cuatro mariposas en hilera, con el brillo del cristal. */
export function dibujarCuadroMariposasS(): Lienzo {
  const l = new Lienzo(64, 32);
  l.rect(3, 1, 58, 17, W(2));
  l.rect(3, 1, 58, 1, W(3));
  l.rect(3, 1, 1, 17, W(3));
  l.rect(60, 2, 1, 16, W(1));
  l.rect(4, 17, 57, 1, W(1));
  l.rect(5, 3, 54, 13, W(1));
  l.rect(6, 4, 52, 11, CR(4));
  l.rect(6, 4, 52, 1, CR(3));
  l.rect(6, 4, 1, 11, CR(3));
  ESPECIES.slice(0, 4).forEach((t, i) => mariposa(l, 7 + i * 13, 5, t));
  // Brillo del cristal: dos trazos cortos en las esquinas del fondo.
  l.px(7, 4, NE(7)).px(8, 4, NE(7));
  l.px(57, 14, NE(6));
  return terminar(l, { desplazamiento: [1, 1] });
}

/** Cuadro de lado: placa delgada con marco, fondo crema y mariposas de canto (puntos de color). */
export function dibujarCuadroMariposasLado(lado: 'E' | 'O'): Lienzo {
  const l = new Lienzo(32, 64);
  const x = lado === 'E' ? 21 : 7;
  l.rect(x, 14, 4, 36, W(2));
  l.rect(x, 14, 1, 36, W(3));
  l.rect(x + 3, 14, 1, 36, W(1));
  l.rect(x, 14, 4, 1, W(3));
  l.rect(x, 49, 4, 1, W(1));
  l.rect(x + 1, 16, 2, 32, CR(4));
  [20, 27, 34, 41].forEach((y, i) => {
    const t = ESPECIES[i] as Tres;
    l.rect(x + 1, y, 2, 3, t[1]);
    l.px(x + 1, y, t[2]);
    l.px(x + (lado === 'E' ? 2 : 1), y + 2, t[0]);
  });
  return terminar(l, { desplazamiento: [1, 1] });
}

export function cuadrosCuadroMariposas(): Cuadros {
  const c: Cuadros = new Map();
  registrar(c, 'cuadro-mariposas', 'S', dibujarCuadroMariposasS());
  registrar(c, 'cuadro-mariposas', 'E', dibujarCuadroMariposasLado('E'));
  registrar(c, 'cuadro-mariposas', 'O', dibujarCuadroMariposasLado('O'));
  return c;
}
