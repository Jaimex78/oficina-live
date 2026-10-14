import type { ConstructorSala } from '../oficina';

/**
 * Baños con cubículos para las plantillas (lote 14). Cada función arma el INTERIOR de un baño de 10 columnas por 4 filas con su
 * esquina superior izquierda en `(x0, y0)`: sanitarios, divisores y puertas de cubículo, urinarios con su divisor, lavamanos con su
 * espejo, dispensadores, secador y papelera. Las paredes del baño (y la puerta de entrada, junto a la columna 0 de la fila 3)
 * las pone quien arma la planta, así que el muro norte (fila `y0 - 1`) y el muro este (columna `x0 + 10`) deben existir.
 *
 * Filas de los cubículos: 0 sanitario, 1 casilla de pie, 2 línea de puertas, 3 pasillo. La línea de puertas alterna puerta y
 * divisor, así cada sanitario queda con pared o divisor a los dos lados y la puerta al sur. Todo se construye con `.estricto()`.
 */

export type MaterialBano = 'base' | 'azul' | 'madera';

/** Un cubículo: el sanitario contra el muro norte y su puerta en la línea de puertas, tres casillas de fondo. */
function cubiculo(b: ConstructorSala, x: number, y0: number, mat: MaterialBano): void {
  b.poner('sanitario', x, y0, 'S').poner('puerta-cubiculo', x, y0 + 2, 'S', mat);
}

/** Divisor de cubículo de tres casillas de largo, del muro norte a la línea de puertas. */
function divisorLargo(b: ConstructorSala, x: number, y0: number, mat: MaterialBano): void {
  for (let r = 0; r < 3; r++) b.poner('divisor-cubiculo', x, y0 + r, 'U', mat);
}

/** Baño de hombres: 3 cubículos, 2 urinarios con divisor y 2 lavabos con espejo. */
export function banoHombres(b: ConstructorSala, x0: number, y0: number, mat: MaterialBano = 'base'): void {
  for (const c of [0, 2, 4]) cubiculo(b, x0 + c, y0, mat);
  for (const c of [1, 3, 5]) divisorLargo(b, x0 + c, y0, mat);
  // Urinarios colgados del muro norte, con un panel entre los dos.
  b.poner('urinario', x0 + 7, y0 - 1, 'S').poner('urinario', x0 + 9, y0 - 1, 'S').poner('divisor-urinario', x0 + 8, y0, 'U', mat);
  b.poner('dispensador-papel', x0 + 6, y0 - 1, 'S');
  // Lavabos contra el muro este, con el espejo, el jabón y el secador colgados encima.
  b.poner('lavabo-meson', x0 + 9, y0 + 2, 'O').poner('espejo-bano', x0 + 10, y0 + 2, 'O');
  b.poner('dispensador-jabon', x0 + 10, y0 + 1, 'O').poner('secador-manos', x0 + 10, y0, 'O');
  b.poner('papelera-bano', x0 + 6, y0 + 1, 'U');
}

/** Baño de mujeres: 4 cubículos y 2 lavabos con espejo entre el segundo y el tercero. */
export function banoMujeres(b: ConstructorSala, x0: number, y0: number, mat: MaterialBano = 'base'): void {
  for (const c of [0, 2, 7, 9]) cubiculo(b, x0 + c, y0, mat);
  for (const c of [1, 3, 6, 8]) divisorLargo(b, x0 + c, y0, mat);
  // Lavabos contra el muro norte, en el hueco de dos casillas entre los divisores.
  b.poner('lavabo-meson', x0 + 4, y0, 'S').poner('espejo-bano', x0 + 4, y0 - 1, 'S');
  b.poner('dispensador-jabon', x0 + 3, y0 - 1, 'S').poner('dispensador-papel', x0 + 6, y0 - 1, 'S').poner('secador-manos', x0 + 10, y0 + 3, 'O').poner('papelera-bano', x0 + 5, y0 + 2, 'U');
}
