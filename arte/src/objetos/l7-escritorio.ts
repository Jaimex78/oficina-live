/**
 * Lote 7 (OBSOLETO): el escritorio largo de cuatro casillas. Lo reemplaza `escritorio-3x1` (lote 8); sigue dibujándose
 * porque hay mapas guardados que lo usan. Cuando ya no quede ninguno, se borra este archivo con su lote.
 *
 * El escritorio largo usa la misma estructura vertical que los de `l1-puestos.ts` (tapa de la fila 2 a la 19, labio en
 * las filas 20 y 21, panel y patas de la 22 a la 29) para que los apoyados del lote encajen igual que sobre un
 * escritorio individual. Tapa blanca con el panel frontal azul grisáceo; las patas intermedias marcan cuatro puestos.
 */

import { Lienzo } from '../nucleo';
import { MATERIALES, panelConPatas, tapaConLabio, type VarianteMueble } from './l1-puestos';
import { cerrarSuelo, registrarVariantes } from './l8-comun';
import type { Cuadros } from './l8-comun';

export function dibujarEscritorioLargo(variante: VarianteMueble): Lienzo {
  const m = MATERIALES[variante];
  const l = new Lienzo(128, 32);
  tapaConLabio(l, 3, 2, 122, 18, m, 41);
  panelConPatas(l, 3, 122, 22, m, [30, 62, 94]);
  // Pasacables a la altura de cada puesto: una ranura en la parte de atrás de la tapa.
  for (const x of [14, 46, 78, 110]) {
    l.rect(x, 4, 5, 2, m.panelSombra);
    l.rect(x, 4, 5, 1, m.pata);
  }
  return cerrarSuelo(l);
}

export function cuadrosEscritorio(): Cuadros {
  const c: Cuadros = new Map();
  registrarVariantes(c, 'escritorio-largo', 'S', {
    base: dibujarEscritorioLargo('base'),
    madera: dibujarEscritorioLargo('madera'),
    negro: dibujarEscritorioLargo('negro'),
  });
  return c;
}
