/**
 * Ayudas del lote 3B. Reusa las del lote 2B (azar, contorno azul marino, cajas, postes) y agrega lo que piden estos
 * objetos: sombra de suelo suave en dos tonos, bloques verticales con luz a la izquierda y el cuerpo de un árbol.
 */

import { Lienzo } from '../nucleo';
import type { ColorEntrada } from '../nucleo';
import { COLOR_SOMBRA, dentroElipse, poste as posteDeLuzASombra } from './l2b-comun';

export {
  azar,
  caja3d,
  construirCategoria,
  cuerpoBlando,
  entre,
  oscuridadBajo,
  PIEL,
  registrar,
  registrarVariantes,
  terminar,
  vetas,
} from './l2b-comun';
export type { Constructores, Cuadros } from './l2b-comun';

/** Tres tonos de una rampa de la paleta, de oscuro a claro: `[sombra, medio, luz]`. */
export type Tres = readonly [ColorEntrada, ColorEntrada, ColorEntrada];

/** Nogal: la madera de la silla, la cómoda y la chimenea. */
export const W = (n: 0 | 1 | 2 | 3 | 4): ColorEntrada => `madera-oscura-${n}`;
/** Roble claro. */
export const R = (n: 0 | 1 | 2 | 3 | 4): ColorEntrada => `madera-clara-${n}`;
/** Azul marino de la oficina (el 0 es el contorno). */
export const AZ = (n: 0 | 1 | 2 | 3 | 4): ColorEntrada => `azul-oficina-${n}`;
export const NE = (n: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7): ColorEntrada => `neutro-${n}`;
export const PL = (n: 0 | 1 | 2 | 3 | 4): ColorEntrada => `planta-${n}`;
export const HP = (n: 0 | 1 | 2 | 3 | 4): ColorEntrada => `hoja-pastel-${n}`;
export const CE = (n: 0 | 1 | 2 | 3): ColorEntrada => `cesped-${n}`;
export const TC = (n: 0 | 1 | 2 | 3): ColorEntrada => `tela-calida-${n}`;
export const VI = (n: 0 | 1 | 2 | 3): ColorEntrada => `vidrio-${n}`;
export const MT = (n: 0 | 1 | 2 | 3): ColorEntrada => `maceta-terracota-${n}`;
export const NA = (n: 0 | 1 | 2 | 3 | 4): ColorEntrada => `naranja-${n}`;
export const RS = (n: 0 | 1 | 2 | 3 | 4): ColorEntrada => `rojo-suave-${n}`;
export const BG = (n: 0 | 1 | 2 | 3 | 4): ColorEntrada => `baldosa-gris-${n}`;
export const ME = (n: 0 | 1 | 2 | 3): ColorEntrada => `metal-${n}`;
export const CR = (n: 0 | 1 | 2 | 3 | 4): ColorEntrada => `crema-${n}`;
export const MO = (n: 0 | 1 | 2 | 3 | 4): ColorEntrada => `morado-${n}`;
export const CM = (n: 0 | 1 | 2 | 3): ColorEntrada => `cemento-${n}`;
export const TG = (n: 0 | 1 | 2 | 3): ColorEntrada => `tela-gris-${n}`;

/**
 * Sombra de suelo suave para lo que no es una caja (balón, árboles, trípode): una elipse sólida en `azul-oficina-2`
 * y, alrededor, un anillo tramado que se disuelve. Va debajo de lo ya dibujado (no tapa nada) y cae a la derecha.
 */
export function sombraSuelo(l: Lienzo, cx: number, cy: number, rx: number, ry: number, anillo = 2): Lienzo {
  const capa = new Lienzo(l.ancho, l.alto);
  for (let y = 0; y < l.alto; y++) {
    for (let x = 0; x < l.ancho; x++) {
      if (dentroElipse(x, y, cx, cy, rx, ry)) capa.px(x, y, COLOR_SOMBRA);
      else if (dentroElipse(x, y, cx, cy, rx + anillo, ry + Math.max(1, anillo - 1)) && (x + y) % 2 === 0) capa.px(x, y, COLOR_SOMBRA);
    }
  }
  return l.pegar(capa, 0, 0, { modo: 'debajo' });
}

/** Bloque vertical de tres tonos: luz a la izquierda, medio al centro y sombra a la derecha. */
export function bloque(l: Lienzo, x: number, y: number, ancho: number, alto: number, t: Tres): Lienzo {
  if (ancho <= 1) return l.rect(x, y, 1, alto, t[1]);
  if (ancho === 2) return l.rect(x, y, 1, alto, t[2]).rect(x + 1, y, 1, alto, t[0]);
  l.rect(x, y, ancho, alto, t[1]);
  l.rect(x, y, 1, alto, t[2]);
  l.rect(x + ancho - 1, y, 1, alto, t[0]);
  return l;
}

/** Cuenta cuántos píxeles opacos hay en un rectángulo (para pruebas rápidas de dibujo). */
export function opacosEn(l: Lienzo, x: number, y: number, w: number, h: number): number {
  let n = 0;
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (l.esOpaco(i, j)) n++;
  return n;
}

/**
 * Poste fino con luz a la izquierda. A diferencia de `poste` del lote 2B (que recibe `[luz, medio, sombra]`), aquí los
 * tonos van como en todo el lote 3B: `[sombra, medio, luz]`.
 */
export function poste(l: Lienzo, x: number, y: number, alto: number, ancho: number, t: Tres): Lienzo {
  return posteDeLuzASombra(l, x, y, alto, ancho, [t[2], t[1], t[0]]);
}
