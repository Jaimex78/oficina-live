/**
 * Sillón de la primera mitad del lote 3: butaca redondeada de respaldo en cáscara, con cojín de asiento y una base
 * giratoria oscura. Sobresale 8 px (el respaldo es alto). Cuatro orientaciones y siete colores.
 *
 * La orientación es hacia donde mira QUIEN SE SIENTA: en `S` el respaldo queda arriba y se ve el asiento de frente; en `N`
 * se ve la espalda de la cáscara; en `E` y `O` se ve de perfil. `O` es el reflejo de la geometría de `E` con la luz
 * todavía a la izquierda (el sombreado de cada pieza se calcula en pantalla).
 *
 * Se dibuja con la rampa `rojo-suave` (5 tonos) y las demás variantes salen de recolorear esa rampa: la base es el rojo
 * suave de Gather y la variante `rojo` es el rojo de marca. La base giratoria es de `neutro` y no cambia.
 */

import { Lienzo } from '../nucleo';
import type { ColorEntrada } from '../nucleo';
import { cuerpoBlando } from './l2b-comun';
import { cerrarSuelo, registrar } from './l4-comun';
import type { Cuadros } from './l4-comun';

type Tres = readonly [ColorEntrada, ColorEntrada, ColorEntrada];

/** Tonos de las tres piezas: la cáscara (la más oscura), el respaldo interior y el cojín del asiento. */
const CASCARA: Tres = ['rojo-suave-0', 'rojo-suave-1', 'rojo-suave-2'];
const INTERIOR: Tres = ['rojo-suave-1', 'rojo-suave-2', 'rojo-suave-3'];
const COJIN: Tres = ['rojo-suave-2', 'rojo-suave-3', 'rojo-suave-4'];

/** Base giratoria: columna corta y disco plano de gris oscuro, con luz a la izquierda. `cx` es su centro. */
function base(l: Lienzo, cx: number, yDisco: number): void {
  l.rect(cx - 2, yDisco - 3, 4, 3, 'neutro-2');
  l.rect(cx - 2, yDisco - 3, 1, 3, 'neutro-3');
  l.elipse(cx, yDisco, 7, 1, 'neutro-2');
  l.rect(cx - 5, yDisco - 1, 6, 1, 'neutro-3');
  l.rect(cx + 2, yDisco, 5, 1, 'neutro-1');
}

/** Botones del tapizado: puntos oscuros en rombo. */
function botones(l: Lienzo, puntos: ReadonlyArray<readonly [number, number]>): void {
  for (const [x, y] of puntos) l.px(x, y, 'rojo-suave-0');
}

/** Sillón de frente (S): cáscara alta con alas a los lados, respaldo acolchado y cojín de asiento adelante. */
export function dibujarSillonS(): Lienzo {
  const l = new Lienzo(32, 40);
  base(l, 16, 36);
  cuerpoBlando(l, 4, 2, 24, 27, 7, CASCARA); // cáscara
  cuerpoBlando(l, 9, 6, 14, 18, 4, INTERIOR); // respaldo acolchado
  botones(l, [[13, 11], [18, 11], [15, 16], [20, 16], [11, 16]]);
  cuerpoBlando(l, 2, 15, 8, 17, 3, CASCARA); // ala izquierda
  cuerpoBlando(l, 22, 15, 8, 17, 3, CASCARA); // ala derecha
  l.rect(3, 16, 2, 4, 'rojo-suave-2'); // luz sobre el hombro izquierdo
  cuerpoBlando(l, 8, 22, 16, 10, 4, COJIN); // cojín del asiento
  l.rect(10, 22, 6, 1, 'rojo-suave-4');
  l.rect(9, 30, 14, 2, 'rojo-suave-1'); // el frente del cojín queda en sombra
  l.rect(9, 30, 14, 1, 'rojo-suave-2');
  return cerrarSuelo(l, { contacto: [18, 37, 9, 1] });
}

/** Sillón de espaldas (N): se ve la cáscara por fuera, con la costura vertical y las alas asomando. */
export function dibujarSillonN(): Lienzo {
  const l = new Lienzo(32, 40);
  base(l, 16, 36);
  cuerpoBlando(l, 3, 3, 26, 30, 8, CASCARA);
  cuerpoBlando(l, 6, 6, 20, 24, 6, INTERIOR);
  l.rect(16, 7, 1, 22, 'rojo-suave-1'); // costura vertical
  l.rect(15, 7, 1, 22, 'rojo-suave-3');
  // Hilvanes horizontales del tapizado.
  for (const y of [13, 20, 26]) {
    l.rect(8, y, 7, 1, 'rojo-suave-1');
    l.rect(18, y, 6, 1, 'rojo-suave-1');
  }
  l.rect(5, 5, 4, 2, 'rojo-suave-2');
  return cerrarSuelo(l, { contacto: [18, 37, 9, 1] });
}

/**
 * Sillón de perfil (E u O): el respaldo alto a la espalda de quien se sienta, el cojín del asiento hacia `lado` y la ala
 * lateral cubriendo el costado. Se dibuja con la geometría del este y se refleja para el oeste.
 */
export function dibujarSillonLado(lado: 'E' | 'O'): Lienzo {
  const l = new Lienzo(32, 40);
  const e = lado === 'E';
  /** Para una pieza rectangular: columna izquierda ya reflejada. */
  const X = (x: number, ancho: number): number => (e ? x : 32 - x - ancho);
  const XC = (cx: number): number => (e ? cx : 31 - cx);
  base(l, XC(15), 36);
  // Respaldo alto, detrás.
  cuerpoBlando(l, X(3, 11), 2, 11, 29, 5, CASCARA);
  cuerpoBlando(l, X(6, 6), 6, 6, 21, 3, INTERIOR);
  // Cojín del asiento, que se alarga hacia delante.
  cuerpoBlando(l, X(8, 20), 21, 20, 10, 4, COJIN);
  l.rect(X(10, 6), 21, 6, 1, 'rojo-suave-4');
  l.rect(X(9, 18), 29, 18, 2, 'rojo-suave-1');
  // Ala lateral: un panel grande y redondeado que tapa el costado del asiento y del respaldo.
  cuerpoBlando(l, X(5, 18), 12, 18, 19, 6, CASCARA);
  cuerpoBlando(l, X(8, 12), 15, 12, 12, 4, INTERIOR);
  botones(l, [[XC(12), 19], [XC(16), 19], [XC(14), 23]]);
  l.rect(X(6, 4), 14, 4, 1, 'rojo-suave-2');
  return cerrarSuelo(l, { contacto: [XC(16), 37, 11, 1] });
}

// ---------------------------------------------------------------------------
// Registro
// ---------------------------------------------------------------------------

export function cuadrosSillon(): Cuadros {
  const c: Cuadros = new Map();
  registrar(c, 'sillon-rojo', 'S', dibujarSillonS(), 'rojo-suave');
  registrar(c, 'sillon-rojo', 'N', dibujarSillonN(), 'rojo-suave');
  registrar(c, 'sillon-rojo', 'E', dibujarSillonLado('E'), 'rojo-suave');
  registrar(c, 'sillon-rojo', 'O', dibujarSillonLado('O'), 'rojo-suave');
  return c;
}
