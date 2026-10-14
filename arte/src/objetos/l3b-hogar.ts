/**
 * Chimenea con repisa y acuario del lote 3B.
 *
 * Lo que emite luz usa los tonos más claros y saturados de su rampa: las llamas de la chimenea (naranja, amarillo y
 * crema) y el agua con la barra de luz del acuario (celestes y blanco). El resplandor lo pone el motor.
 */

import { Lienzo } from '../nucleo';
import type { ColorEntrada } from '../nucleo';
import { poligono } from './l2b-comun';
import {
  AZ, BG, CM, CR, ME, NA, NE, PL, R, RS, TC, VI, W,
  bloque, poste, registrar, terminar,
} from './l3b-comun';
import type { Cuadros } from './l3b-comun';

// ---------------------------------------------------------------------------
// Chimenea
// ---------------------------------------------------------------------------

/** Candelabro de hierro con una vela roja encendida. `alto` es la altura de la vela. */
function candelabro(l: Lienzo, x: number, yBase: number, alto: number): void {
  // Base, tallo y copa de hierro.
  l.rect(x - 3, yBase - 2, 7, 2, AZ(1));
  l.rect(x - 3, yBase - 2, 7, 1, AZ(2));
  l.rect(x - 1, yBase - 7, 3, 5, AZ(1));
  l.rect(x - 2, yBase - 9, 5, 2, AZ(2));
  l.rect(x - 2, yBase - 9, 5, 1, AZ(3));
  // Vela roja y llama.
  const y0 = yBase - 9 - alto;
  l.rect(x - 1, y0, 3, alto, 'rojo-2');
  l.rect(x - 1, y0, 1, alto, 'rojo-3');
  l.rect(x - 1, y0, 3, 1, NE(7));
  l.elipse(x, y0 - 2, 1, 2, NA(3));
  l.px(x, y0 - 2, TC(3));
  l.px(x, y0 - 1, CR(4));
  l.px(x, y0 - 4, NA(2));
}

/** Cuadro enmarcado en dorado con un paisaje: cielo, sol, montañas y colinas. */
function cuadroPaisaje(l: Lienzo, x: number, y: number, ancho: number, alto: number): void {
  l.rect(x, y, ancho, alto, TC(2));
  l.rect(x, y, ancho, 1, TC(3));
  l.rect(x, y, 1, alto, TC(3));
  l.rect(x + ancho - 1, y + 1, 1, alto - 1, TC(1));
  l.rect(x + 1, y + alto - 1, ancho - 1, 1, TC(1));
  const ix = x + 2;
  const iy = y + 2;
  const iw = ancho - 4;
  const ih = alto - 4;
  l.rect(ix, iy, iw, ih, VI(2));
  l.rect(ix, iy, iw, 2, VI(3));
  l.elipse(ix + iw - 5, iy + 3, 1.5, 1.5, TC(3));
  poligono(l, [[ix, iy + ih], [ix + 6, iy + 2], [ix + 12, iy + ih]], CM(1));
  poligono(l, [[ix + 8, iy + ih], [ix + 15, iy + 3], [ix + 24, iy + ih]], CM(2));
  l.px(ix + 6, iy + 2, NE(7)).px(ix + 15, iy + 3, NE(7)).px(ix + 14, iy + 4, NE(6));
  l.rect(ix, iy + ih - 3, iw, 3, PL(2));
  l.rect(ix, iy + ih - 3, iw, 1, PL(3));
  l.rect(ix + 14, iy + ih - 2, 8, 1, PL(1));
}

/** Reloj de repisa: caja de madera clara con esfera blanca y manecillas. */
function relojRepisa(l: Lienzo, x: number, yBase: number): void {
  l.rect(x - 4, yBase - 8, 9, 8, R(3));
  l.rect(x - 4, yBase - 8, 9, 1, R(4));
  l.rect(x - 4, yBase - 1, 9, 1, R(1));
  l.rect(x + 4, yBase - 7, 1, 7, R(2));
  l.elipse(x, yBase - 4, 3, 3, NE(7));
  l.linea(x, yBase - 4, x, yBase - 6, AZ(1));
  l.linea(x, yBase - 4, x + 2, yBase - 4, AZ(1));
  l.px(x - 2, yBase - 6, NE(6));
}

/** Libros de pie con lomos de colores. */
function libros(l: Lienzo, x: number, yBase: number): void {
  const lomos: ReadonlyArray<readonly [ColorEntrada, ColorEntrada, number]> = [
    [NA(3), NA(2), 11], [TC(3), TC(2), 12], [RS(2), RS(1), 10], [VI(1), VI(0), 11], [PL(3), PL(2), 10],
  ];
  let cx = x;
  for (const [luz, sombra, alto] of lomos) {
    l.rect(cx, yBase - alto, 3, alto, luz);
    l.rect(cx + 2, yBase - alto, 1, alto, sombra);
    l.rect(cx, yBase - alto, 3, 1, NE(7));
    l.rect(cx, yBase - alto + 3, 3, 1, sombra);
    cx += 3;
  }
}

/** Llamas en capas: naranja saturado afuera, amarillo claro y crema al centro. */
function llamas(l: Lienzo): void {
  poligono(l, [[37, 53], [36, 45], [40, 39], [43, 43], [45, 34], [49, 41], [53, 35], [55, 43], [59, 39], [60, 46], [58, 53]], NA(2));
  poligono(l, [[40, 53], [40, 47], [43, 44], [45, 39], [48, 44], [51, 38], [54, 45], [57, 47], [56, 53]], NA(3));
  poligono(l, [[44, 53], [44, 48], [47, 44], [50, 48], [53, 53]], TC(3));
  poligono(l, [[46, 53], [47, 49], [49, 49], [51, 53]], CR(4));
}

/** Chimenea de madera oscura con repisa, candelabros, cuadro, reloj y libros, hogar de piedra y fuego encendido. */
export function dibujarChimenea(): Lienzo {
  const l = new Lienzo(96, 64);
  // Pared de fondo sobre la repisa.
  l.rect(6, 6, 82, 20, W(1));
  l.rect(6, 6, 82, 1, W(2));
  // Cornisa superior.
  l.rect(4, 2, 86, 4, W(3));
  l.rect(4, 2, 86, 1, W(4));
  l.rect(4, 5, 86, 1, W(1));
  // Objetos de la repisa, detrás de ella.
  cuadroPaisaje(l, 35, 7, 26, 11);
  candelabro(l, 12, 26, 7);
  candelabro(l, 25, 26, 5);
  relojRepisa(l, 48, 26);
  libros(l, 68, 26);
  // Repisa: tabla gruesa que sobresale a los lados.
  l.rect(2, 26, 90, 4, W(3));
  l.rect(2, 26, 90, 1, W(4));
  l.rect(2, 29, 90, 1, W(1));
  l.rect(2, 28, 90, 1, W(2));
  // Frente de la chimenea y pilastras.
  l.rect(6, 30, 82, 26, W(2));
  l.rect(6, 30, 82, 2, W(1));
  bloque(l, 6, 32, 10, 24, [W(1), W(2), W(3)]);
  bloque(l, 77, 32, 10, 24, [W(1), W(2), W(3)]);
  for (const x of [6, 77]) {
    l.rect(x + 2, 35, 6, 1, W(4));
    l.rect(x + 2, 36, 6, 1, W(1));
    l.rect(x + 2, 51, 6, 1, W(4));
    l.rect(x + 2, 52, 6, 1, W(1));
  }
  // Hogar: arco oscuro con ladrillos.
  l.rectRedondeado(17, 32, 60, 24, 4, W(0));
  l.rect(17, 36, 60, 20, W(0));
  for (let fila = 0; fila < 5; fila++) {
    const y = 38 + fila * 4;
    l.rect(18, y, 58, 1, W(1));
    for (let x = 20 + (fila % 2) * 5; x < 76; x += 10) l.rect(x, y + 1, 1, 3, W(1));
  }
  // Brasas detrás del fuego.
  l.rect(30, 52, 36, 3, NA(1));
  l.rect(34, 51, 28, 1, NA(1));
  llamas(l);
  // Leños cruzados.
  l.rect(30, 53, 36, 3, W(2));
  l.rect(30, 53, 36, 1, W(3));
  l.rect(30, 55, 36, 1, W(1));
  l.elipse(31, 54, 1, 1.5, W(4));
  l.elipse(65, 54, 1, 1.5, W(4));
  l.linea(36, 54, 60, 51, W(3));
  // Morillos de hierro a los lados del fuego.
  for (const x of [22, 68]) {
    poste(l, x, 40, 15, 3, [AZ(1), AZ(2), AZ(3)]);
    l.elipse(x + 1, 39, 2, 2, AZ(2));
    l.px(x, 38, AZ(4));
    l.rect(x - 2, 55, 7, 1, AZ(1));
  }
  // Hogar de piedra: losa con juntas escalonadas.
  l.rect(1, 56, 92, 6, CM(2));
  l.rect(1, 56, 92, 1, CM(3));
  l.rect(1, 61, 92, 1, CM(0));
  for (let x = 7; x < 93; x += 12) l.rect(x, 57, 1, 4, CM(1));
  for (let x = 13; x < 93; x += 12) l.rect(x, 59, 1, 2, CM(1));
  l.rect(1, 58, 92, 1, CM(1));
  l.rect(1, 57, 92, 1, CM(3));
  return terminar(l);
}

// ---------------------------------------------------------------------------
// Acuario
// ---------------------------------------------------------------------------

/** Un pez de perfil: cuerpo, aleta de cola, ojo y una franja. `mira` es hacia dónde nada. */
function pez(l: Lienzo, x: number, y: number, cuerpo: ColorEntrada, luz: ColorEntrada, cola: ColorEntrada, mira: 1 | -1): void {
  l.rect(x, y, 6, 3, cuerpo);
  l.rect(x + 1, y - 1, 4, 1, cuerpo);
  l.rect(x + 1, y, 4, 1, luz);
  l.rect(mira === 1 ? x - 2 : x + 6, y - 1, 2, 5, cola);
  l.px(mira === 1 ? x + 4 : x + 1, y + 1, AZ(0));
  l.px(mira === 1 ? x + 2 : x + 3, y + 1, NE(7));
}

/** Castillo de adorno de piedra con dos torres, almenas y una puerta. */
function castillo(l: Lienzo, x: number, yBase: number): void {
  l.rect(x + 3, yBase - 8, 12, 8, CM(2));
  l.rect(x + 3, yBase - 8, 12, 1, CM(3));
  for (const dx of [0, 14]) {
    l.rect(x + dx, yBase - 11, 5, 11, CM(2));
    l.rect(x + dx, yBase - 11, 1, 11, CM(3));
    l.rect(x + dx + 4, yBase - 10, 1, 10, CM(1));
    for (const mx of [0, 2, 4]) l.rect(x + dx + mx, yBase - 13, 1, 2, CM(2));
  }
  l.rect(x + 7, yBase - 5, 4, 5, AZ(1));
  l.rect(x + 8, yBase - 6, 2, 1, AZ(1));
  l.rect(x + 6, yBase - 7, 1, 2, CM(1));
  l.px(x + 11, yBase - 7, CM(1));
}

/** Coral ramificado en rosa y naranja. */
function coral(l: Lienzo, x: number, yBase: number): void {
  const ramas: ReadonlyArray<readonly [number, number, ColorEntrada]> = [[0, 10, RS(3)], [-4, 7, NA(3)], [4, 8, RS(2)], [-7, 5, RS(3)], [7, 4, NA(3)]];
  for (const [dx, alto, c] of ramas) {
    l.rect(x + dx, yBase - alto, 2, alto, c);
    l.rect(x + dx - 1, yBase - alto - 1, 4, 2, c);
    l.px(x + dx - 1, yBase - alto - 1, NE(7));
  }
  l.rect(x - 8, yBase - 2, 18, 2, RS(1));
}

/** Alga que ondula: columna de dos píxeles que se corre a los lados. */
function alga(l: Lienzo, x: number, yBase: number, alto: number): void {
  for (let i = 0; i < alto; i++) {
    const dx = [0, 1, 1, 0, -1, -1][i % 6] as number;
    l.rect(x + dx, yBase - i, 2, 1, i % 3 === 0 ? PL(4) : PL(3));
    l.px(x + dx + 2, yBase - i, PL(2));
  }
}

/** Acuario grande sobre mueble de nogal: lámpara de luz arriba, agua con castillo, coral, algas y cuatro peces. */
export function dibujarAcuarioS(): Lienzo {
  const l = new Lienzo(64, 48);
  // Mueble de nogal con dos puertas.
  l.rect(3, 29, 58, 15, W(2));
  l.rect(3, 29, 58, 2, W(3));
  l.rect(3, 29, 58, 1, W(4));
  l.rect(3, 43, 58, 1, W(1));
  for (const x of [6, 34]) {
    l.rect(x, 32, 25, 10, W(1));
    l.rect(x + 1, 33, 23, 8, W(2));
    l.rect(x + 1, 33, 23, 1, W(3));
    l.rect(x + 1, 33, 1, 8, W(3));
  }
  l.rect(29, 36, 2, 3, TC(3));
  l.rect(35, 36, 2, 3, TC(3));
  l.rect(5, 44, 4, 2, W(1));
  l.rect(55, 44, 4, 2, W(1));
  // Marco del tanque y agua en bandas.
  l.rect(3, 6, 58, 23, ME(2));
  l.rect(3, 6, 58, 1, ME(3));
  l.rect(3, 28, 58, 1, ME(1));
  l.rect(4, 7, 56, 21, VI(2));
  l.rect(4, 7, 56, 1, VI(3));
  l.rect(4, 14, 56, 6, VI(1));
  l.rect(4, 20, 56, 8, VI(1));
  l.trama(4, 12, 56, 2, VI(2), VI(1), 'bayer50');
  l.trama(4, 20, 56, 2, VI(1), VI(0), 'bayer25');
  // Arena y piedras.
  l.rect(4, 24, 56, 4, CR(3));
  l.rect(4, 24, 56, 1, CR(4));
  l.rect(4, 27, 56, 1, CR(2));
  for (const x of [8, 18, 29, 38, 49, 55]) l.px(x, 25, NE(5));
  l.elipse(35, 24, 4, 2, CM(2));
  l.rect(32, 22, 4, 1, CM(3));
  // Adornos y plantas.
  castillo(l, 7, 25);
  coral(l, 49, 25);
  alga(l, 28, 24, 11);
  alga(l, 40, 24, 8);
  alga(l, 55, 24, 6);
  // Peces y burbujas.
  pez(l, 25, 11, NA(2), NA(3), NA(3), 1);
  pez(l, 43, 15, RS(2), RS(3), RS(4), -1);
  pez(l, 13, 9, VI(0), VI(1), TC(3), 1);
  pez(l, 36, 19, TC(2), TC(3), TC(3), 1);
  for (const [x, y] of [[22, 9], [21, 13], [46, 10], [47, 12], [31, 15]] as const) l.px(x, y, VI(3));
  l.rect(53, 9, 2, 2, VI(3));
  // Brillo del vidrio.
  l.rect(4, 8, 1, 17, NE(7));
  l.rect(5, 9, 1, 4, VI(3));
  l.linea(10, 8, 14, 8, VI(3));
  l.linea(52, 22, 56, 18, VI(2));
  // Lámpara de luz arriba.
  l.rectRedondeado(2, 2, 60, 5, 2, BG(3));
  l.rect(2, 2, 60, 1, NE(7));
  l.rect(6, 4, 52, 1, NE(7));
  l.rect(6, 5, 52, 1, VI(3));
  l.rect(2, 6, 60, 1, BG(2));
  return terminar(l);
}

/** Acuario de lado: arriba la tapa con su luz, abajo el testero, y a la derecha el frente con agua y madera. */
export function dibujarAcuarioE(): Lienzo {
  const l = new Lienzo(32, 80);
  // Tapa larga con la lámpara.
  l.rect(6, 3, 19, 42, BG(4));
  l.rect(6, 3, 19, 1, NE(7));
  l.rect(6, 3, 1, 42, NE(7));
  l.rect(24, 4, 1, 41, BG(3));
  l.rect(10, 7, 11, 34, NE(7));
  l.rect(10, 7, 1, 34, BG(4));
  l.rect(20, 8, 1, 33, VI(3));
  for (const y of [14, 22, 30]) l.rect(10, y, 11, 1, VI(3));
  // Testero del tanque: agua con arena, castillo pequeño y un alga.
  l.rect(6, 45, 19, 19, ME(2));
  l.rect(6, 45, 19, 1, ME(3));
  l.rect(8, 47, 15, 15, VI(2));
  l.rect(8, 47, 15, 1, VI(3));
  l.rect(8, 52, 15, 10, VI(1));
  l.trama(8, 50, 15, 2, VI(2), VI(1), 'bayer50');
  l.rect(8, 58, 15, 4, CR(3));
  l.rect(8, 58, 15, 1, CR(4));
  l.rect(9, 51, 1, 8, NE(7));
  alga(l, 12, 58, 8);
  l.elipse(19, 58, 2, 1, CM(2));
  pez(l, 14, 51, NA(2), NA(3), NA(3), 1);
  // Testero del mueble.
  l.rect(6, 64, 19, 11, W(2));
  l.rect(6, 64, 19, 2, W(3));
  l.rect(6, 64, 19, 1, W(4));
  l.rect(6, 74, 19, 1, W(1));
  l.rect(9, 67, 13, 6, W(1));
  l.rect(10, 68, 11, 4, W(2));
  // Franja del frente (este): a la izquierda el agua con peces, a la derecha el mueble.
  l.rect(25, 4, 2, 60, VI(1));
  l.rect(25, 4, 1, 60, VI(3));
  for (const [y, c] of [[10, NA(3)], [24, TC(3)], [38, RS(3)], [50, NA(3)]] as const) l.rect(25, y, 2, 2, c);
  l.rect(25, 56, 2, 6, CR(3));
  l.rect(27, 4, 2, 71, W(2));
  l.rect(28, 5, 1, 70, W(1));
  l.rect(27, 4, 2, 1, W(3));
  for (const y of [14, 32, 50]) l.rect(27, y, 2, 1, W(1));
  l.rect(27, 68, 2, 2, TC(3));
  // Patas.
  l.rect(8, 75, 4, 2, W(1));
  l.rect(21, 75, 4, 2, W(1));
  return terminar(l);
}

export function cuadrosHogar(): Cuadros {
  const c: Cuadros = new Map();
  registrar(c, 'chimenea', 'U', dibujarChimenea());
  registrar(c, 'acuario', 'S', dibujarAcuarioS());
  registrar(c, 'acuario', 'E', dibujarAcuarioE());
  return c;
}
