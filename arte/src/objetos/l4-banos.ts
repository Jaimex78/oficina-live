/**
 * Lote 4, baños: sanitario, lavamanos con espejo y urinario.
 *
 * Material: porcelana blanca azulada (luz `neutro-7`, medio `baldosa-gris-4`, sombra `baldosa-gris-3`, sombra profunda
 * `baldosa-gris-2`) y grifería cromada (rampa `metal`). Todo con contorno azul marino y la sombra de su clase:
 *  - sanitario y lavamanos son de suelo: sombra en dos tonos, con una mancha de contacto bajo la base;
 *  - el urinario es de pared: sombra de 1 px sobre ella, y sigue la geometría de pared del lote 1 (la cara del sur va de la
 *    fila 16 a la 63 del cuadro de pared; en las paredes verticales E y O solo se ve la franja de la tapa, columnas 11 a
 *    20, y lo colgado es un perfil pegado a ella).
 *
 * Las orientaciones laterales (`E`, `O`) se dibujan con una sola función y un espejo de la geometría: la luz sigue
 * viniendo de la izquierda en las dos, porque el sombreado se calcula en pantalla y no en el objeto.
 */

import { Lienzo } from '../nucleo';
import type { ColorEntrada } from '../nucleo';
import { PORCELANA, cerrarColgado, cerrarSuelo, registrar } from './l4-comun';
import type { Cuadros } from './l4-comun';

const { brillo: BRILLO, luz: LUZ, medio: MEDIO, sombra: SOMBRA, profunda: PROFUNDA } = PORCELANA;

/** Tono de la porcelana según qué tan a la derecha cae un punto (0 izquierda, 1 derecha): luz a la izquierda. */
function porcelana(u: number): ColorEntrada {
  return u < 0.22 ? BRILLO : u < 0.62 ? MEDIO : u < 0.88 ? SOMBRA : PROFUNDA;
}

/** Rectángulo de porcelana con luz a la izquierda y sombra a la derecha. */
function rectPorcelana(l: Lienzo, x: number, y: number, ancho: number, alto: number): void {
  for (let i = 0; i < ancho; i++) l.rect(x + i, y, 1, alto, porcelana(i / Math.max(1, ancho - 1)));
}

/** Cara superior de porcelana: clara, con un brillo en el borde de arriba. */
function tapaPorcelana(l: Lienzo, x: number, y: number, ancho: number, alto: number): void {
  l.rect(x, y, ancho, alto, BRILLO);
  l.rect(x + ancho - 2, y, 2, alto, LUZ);
  l.rect(x, y + alto - 1, ancho, 1, LUZ);
}

// ---------------------------------------------------------------------------
// Sanitario
// ---------------------------------------------------------------------------

/** Tanque visto de frente (S) o por detrás (N): cara superior con la tapa y el botón, y cara frontal. */
function tanque(l: Lienzo, x: number, y: number, ancho: number, alto: number, boton: boolean): void {
  const fondo = 5;
  tapaPorcelana(l, x, y, ancho, fondo);
  l.rect(x + 1, y + fondo - 1, ancho - 2, 1, MEDIO); // junta entre la tapa y el cuerpo
  rectPorcelana(l, x, y + fondo, ancho, alto - fondo);
  l.rect(x, y + alto - 1, ancho, 1, PROFUNDA);
  if (boton) {
    const cx = x + Math.floor(ancho / 2);
    l.rect(cx - 1, y + 1, 3, 2, 'metal-3');
    l.rect(cx, y + 2, 2, 1, 'metal-2');
    l.px(cx - 1, y + 1, 'neutro-7');
  }
}

/** Tapa del asiento: óvalo claro con aro, bisagras atrás y brillo arriba a la izquierda. */
function tapaAsiento(l: Lienzo, cx: number, cy: number, rx: number, ry: number): void {
  l.elipse(cx, cy, rx, ry, SOMBRA); // el aro del asiento, un poco más oscuro
  l.elipse(cx - 1, cy - 1, rx - 1, ry - 1, LUZ);
  l.elipse(cx - 1, cy - 1, rx - 2, ry - 2, BRILLO);
  l.elipse(cx + 1, cy + 1, rx - 4, ry - 4, LUZ); // zona en sombra, abajo a la derecha
  l.elipse(cx - 1, cy - 2, rx - 5, ry - 5, BRILLO);
}

/** Cuerpo del inodoro bajo la tapa: se cierra hacia el pedestal. */
function tazaCuerpo(l: Lienzo, cx: number, y0: number, y1: number, mitadArriba: number, mitadAbajo: number): void {
  for (let y = y0; y <= y1; y++) {
    const t = (y - y0) / Math.max(1, y1 - y0);
    const mitad = Math.round(mitadArriba + (mitadAbajo - mitadArriba) * t);
    for (let x = cx - mitad; x <= cx + mitad; x++) l.px(x, y, porcelana((x - (cx - mitad)) / Math.max(1, 2 * mitad)));
  }
}

/** Sanitario de frente (S): el tanque al fondo, la tapa del asiento y la taza que baja hasta el pedestal. */
export function dibujarSanitarioS(): Lienzo {
  const l = new Lienzo(32, 40);
  tanque(l, 8, 2, 16, 15, true);
  tazaCuerpo(l, 16, 28, 35, 8, 5);
  l.rect(12, 35, 9, 1, PROFUNDA);
  tapaAsiento(l, 16, 23, 9, 8);
  // Bisagras del asiento, pegadas al tanque.
  l.rect(11, 16, 2, 2, 'metal-2');
  l.rect(20, 16, 2, 2, 'metal-1');
  l.px(11, 16, 'metal-3');
  return cerrarSuelo(l, { contacto: [17, 36, 8, 2] });
}

/** Sanitario por detrás (N): el tanque grande al frente y, asomando por encima, la tapa del asiento. */
export function dibujarSanitarioN(): Lienzo {
  const l = new Lienzo(32, 40);
  tapaAsiento(l, 16, 9, 9, 7);
  tanque(l, 7, 15, 18, 20, false);
  // Tubo de agua que sale del suelo por detrás del tanque.
  l.rect(15, 33, 3, 2, 'metal-2');
  l.rect(15, 33, 1, 2, 'metal-3');
  l.rect(13, 35, 7, 1, 'metal-1');
  return cerrarSuelo(l, { contacto: [16, 36, 9, 2] });
}

/**
 * Sanitario de lado (E u O): el tanque alto a un lado y la taza que se alarga hacia `lado`. Se dibuja con la geometría
 * del este y se refleja para el oeste, sin tocar el sombreado (la luz sigue a la izquierda).
 */
export function dibujarSanitarioLado(lado: 'E' | 'O'): Lienzo {
  const l = new Lienzo(32, 40);
  const e = lado === 'E';
  const X = (x: number, ancho: number): number => (e ? x : 32 - x - ancho); // columna izquierda de una pieza
  const XC = (cx: number): number => (e ? cx : 31 - cx); // columna del centro de una pieza simétrica
  // Tanque pegado a la parte de atrás (el lado contrario a la taza), con el botón en la cara superior.
  tanque(l, X(3, 10), 5, 10, 22, false);
  l.rect(X(6, 4), 6, 4, 2, 'metal-3');
  l.rect(X(6, 4) + (e ? 1 : 0), 7, 3, 1, 'metal-2');
  // Taza: cuerpo que baja al pedestal y, encima, la tapa en un óvalo alargado hacia el lado de la taza.
  tazaCuerpo(l, XC(19), 28, 35, 8, 4);
  l.rect(XC(19) - 4, 35, 9, 1, PROFUNDA);
  tapaAsiento(l, XC(20), 25, 9, 6);
  // Bisagra entre el tanque y la tapa.
  l.rect(X(11, 2), 21, 2, 2, 'metal-2');
  l.px(X(11, 2) + (e ? 0 : 1), 21, 'metal-3');
  return cerrarSuelo(l, { contacto: [XC(19) + 1, 36, 10, 2] });
}

// ---------------------------------------------------------------------------
// Lavamanos con espejo
// ---------------------------------------------------------------------------

/** Lavamanos redondo visto desde arriba: aro blanco con su borde, cubeta en sombra arriba a la izquierda y desagüe. */
function lavabo(l: Lienzo, cx: number, cy: number, rx: number, ry: number): void {
  l.elipse(cx, cy, rx, ry, SOMBRA); // el borde del lavabo sobre el mesón
  l.elipse(cx, cy, rx - 1, ry - 1, BRILLO); // aro blanco
  l.elipse(cx, cy, rx - 3, ry - 2, SOMBRA); // la cubeta hundida
  l.elipse(cx + 1, cy + 1, rx - 4, ry - 3, MEDIO); // el fondo recibe luz hacia abajo y a la derecha
  l.elipse(cx + 2, cy + 1, Math.max(1, rx - 6), Math.max(1, ry - 4), LUZ);
  l.px(cx, cy, 'metal-1'); // desagüe
  l.px(cx + 1, cy, 'metal-2');
}

/** Grifo cromado visto de frente: base, cuello, pico que mira al lavabo y dos manijas. */
function grifo(l: Lienzo, cx: number, y: number): void {
  l.rect(cx - 3, y + 2, 7, 2, 'metal-2');
  l.rect(cx - 3, y + 2, 7, 1, 'metal-3');
  l.rect(cx - 1, y - 2, 3, 5, 'metal-3');
  l.rect(cx + 1, y - 2, 1, 5, 'metal-1');
  l.rect(cx - 1, y + 3, 3, 2, 'metal-2');
  l.px(cx - 1, y + 3, 'neutro-7');
  l.rect(cx - 4, y, 2, 2, 'metal-2');
  l.rect(cx + 3, y, 2, 2, 'metal-2');
  l.px(cx - 4, y, 'metal-3');
  l.px(cx + 3, y, 'metal-3');
}

/** Espejo grande de marco cromado con cristal claro y destellos en diagonal. */
function espejo(l: Lienzo, x: number, y: number, ancho: number, alto: number): void {
  l.rect(x, y, ancho, alto, 'metal-2');
  l.rect(x, y, ancho, 1, 'metal-3');
  l.rect(x, y, 1, alto, 'metal-3');
  l.rect(x + ancho - 1, y + 1, 1, alto - 1, 'metal-1');
  l.rect(x + 1, y + alto - 1, ancho - 1, 1, 'metal-1');
  l.rect(x + 2, y + 2, ancho - 4, alto - 4, 'vidrio-3');
  l.rect(x + 2, y + alto - 5, ancho - 4, 3, 'vidrio-2'); // el cristal se oscurece hacia abajo
  l.rect(x + 2, y + alto - 3, ancho - 4, 1, 'vidrio-1');
  // Destellos: dos rayas en diagonal, una gruesa y otra fina.
  for (let i = 0; i < 9; i++) l.px(x + 9 + i, y + 12 - i, 'neutro-7');
  for (let i = 0; i < 9; i++) l.px(x + 10 + i, y + 12 - i, 'neutro-7');
  for (let i = 0; i < 5; i++) l.px(x + 22 + i, y + 12 - i, 'neutro-7');
}

/** Dos lavamanos blancos con grifería cromada sobre un mesón claro y un espejo grande detrás. Mide 64 x 56. */
export function dibujarLavamanosS(conEspejo = true): Lienzo {
  const l = new Lienzo(64, 56);
  if (conEspejo) espejo(l, 4, 1, 56, 22);
  // Mesón: cara superior de mármol claro, canto y frente con dos puertas.
  l.rect(2, 23, 60, 16, BRILLO);
  l.rect(2, 23, 60, 1, LUZ); // salpicadero al fondo
  l.rect(2, 24, 60, 1, MEDIO);
  l.rect(2, 23, 1, 16, BRILLO);
  l.rect(60, 25, 2, 14, LUZ);
  l.rect(2, 38, 60, 3, LUZ); // canto grueso del mesón
  l.rect(2, 38, 60, 1, BRILLO);
  l.rect(2, 40, 60, 1, SOMBRA);
  l.rect(3, 41, 58, 11, SOMBRA); // frente, más azulado que la tapa
  l.rect(3, 41, 1, 11, MEDIO);
  l.rect(60, 41, 1, 11, PROFUNDA);
  l.rect(30, 41, 3, 10, PROFUNDA); // división entre las dos puertas
  l.rect(30, 41, 1, 10, SOMBRA);
  l.rect(3, 51, 58, 1, PROFUNDA);
  for (const x of [6, 36]) {
    l.rect(x, 43, 22, 7, MEDIO);
    l.rect(x, 43, 22, 1, LUZ);
    l.rect(x + 21, 43, 1, 7, SOMBRA);
    l.rect(x, 49, 22, 1, SOMBRA);
  }
  l.rect(26, 45, 2, 3, 'metal-2');
  l.rect(34, 45, 2, 3, 'metal-2');
  l.px(26, 45, 'metal-3');
  l.px(34, 45, 'metal-3');
  // Lavamanos y grifos.
  for (const cx of [17, 46]) {
    lavabo(l, cx, 32, 10, 5);
    grifo(l, cx, 24);
  }
  return cerrarSuelo(l, { contacto: [33, 52, 28, 1], largo: 2 });
}

/**
 * Lavamanos de lado (E u O): el mesón corre de norte a sur con dos lavabos y el espejo es una placa delgada y alta
 * pegada a la pared del lado contrario. Mide 32 x 88. Se dibuja con la geometría del este y se refleja para el oeste.
 */
export function dibujarLavamanosLado(lado: 'E' | 'O', conEspejo = true): Lienzo {
  const l = new Lienzo(32, 88);
  const e = lado === 'E';
  const X = (x: number, ancho: number): number => (e ? x : 32 - x - ancho);
  const XC = (cx: number): number => (e ? cx : 31 - cx);
  if (conEspejo) {
    // Espejo: placa delgada y alta pegada a la pared (vista de canto).
    l.rect(X(1, 5), 3, 5, 76, 'metal-2');
    l.rect(X(1, 5), 3, 5, 1, 'metal-3');
    l.rect(X(1, 5) + (e ? 0 : 4), 3, 1, 76, e ? 'metal-3' : 'metal-1');
    l.rect(X(1, 5) + (e ? 4 : 0), 4, 1, 75, e ? 'metal-1' : 'metal-3');
    l.rect(X(3, 2), 6, 2, 70, 'vidrio-3');
    l.rect(X(3, 2) + (e ? 0 : 1), 6, 1, 70, 'neutro-7');
    for (const y of [14, 15, 30, 44]) l.rect(X(3, 2), y, 2, 1, 'neutro-7');
  }
  // Mesón visto desde arriba: tapa larga de mármol claro, salpicadero junto al espejo y canto grueso en el extremo sur.
  l.rect(X(7, 20), 26, 20, 56, BRILLO);
  l.rect(X(7, 20) + (e ? 19 : 0), 26, 1, 56, LUZ);
  l.rect(X(7, 20), 26, 20, 1, LUZ);
  l.rect(X(8, 1), 27, 1, 54, MEDIO);
  l.rect(X(7, 20), 81, 20, 3, LUZ);
  l.rect(X(7, 20), 81, 20, 1, BRILLO);
  l.rect(X(7, 20), 83, 20, 1, SOMBRA);
  // Frente del mueble en el extremo sur, con una puerta.
  rectPorcelana(l, X(8, 18), 84, 18, 4);
  l.rect(X(10, 14), 85, 14, 1, LUZ);
  l.rect(X(16, 2), 86, 2, 1, 'metal-2');
  // Lavabos con su grifo pegado al espejo.
  for (const cy of [43, 67]) {
    lavabo(l, XC(17), cy, 7, 6);
    l.rect(X(9, 3), cy - 1, 3, 3, 'metal-2');
    l.rect(X(9, 3), cy - 1, 3, 1, 'metal-3');
    l.rect(X(11, 3), cy, 3, 1, 'metal-3');
    l.px(X(9, 1), cy - 3, 'metal-3');
    l.px(X(9, 1), cy + 3, 'metal-3');
  }
  return cerrarSuelo(l, { contacto: [XC(17), 86, 9, 1], largo: 2 });
}

// ---------------------------------------------------------------------------
// Urinario
// ---------------------------------------------------------------------------

/**
 * Urinario de frente (S), colgado de la pared: tubo de descarga cromado arriba, carcasa de porcelana con la cubeta
 * hundida y desagüe abajo. Mide 32 x 40: la cara de la pared ocupa las filas 0 a 31 y el zócalo las 8 últimas.
 */
export function dibujarUrinarioS(): Lienzo {
  const l = new Lienzo(32, 40);
  // Tubo de descarga y válvula, cromados, arriba.
  l.rect(15, 2, 3, 4, 'metal-3');
  l.rect(17, 2, 1, 4, 'metal-1');
  l.rect(14, 5, 5, 2, 'metal-2');
  l.rect(14, 5, 5, 1, 'metal-3');
  // Carcasa: óvalo alto de porcelana con luz a la izquierda.
  for (let y = 7; y <= 28; y++) {
    const t = (y - 7) / 21;
    const mitad = Math.round(7 * Math.sqrt(Math.max(0, 1 - (2 * t - 1) ** 6 * 0.55)));
    for (let x = 16 - mitad; x <= 16 + mitad; x++) l.px(x, y, porcelana((x - (16 - mitad)) / Math.max(1, 2 * mitad)));
  }
  // Labio claro y cubeta hundida: en sombra arriba y a la izquierda, clara abajo a la derecha.
  l.elipse(16, 17, 5, 9, BRILLO);
  l.elipse(16, 18, 4, 8, SOMBRA);
  l.elipse(17, 19, 3, 6, MEDIO);
  l.elipse(17, 21, 2, 4, LUZ);
  l.rect(13, 11, 4, 1, PROFUNDA);
  l.px(12, 12, PROFUNDA);
  // Rejilla del desagüe.
  l.rect(15, 24, 3, 2, 'metal-2');
  l.px(15, 24, 'metal-3');
  l.px(17, 25, 'metal-1');
  // Tubo de salida abajo.
  l.rect(15, 28, 3, 2, 'metal-2');
  l.px(15, 28, 'metal-3');
  return cerrarColgado(l);
}

/**
 * Urinario de lado (E u O): perfil de la carcasa pegado a la franja de la tapa de una pared vertical (columnas 11 a
 * 20 del cuadro). El este lo deja asomar a la derecha de la franja y el oeste a la izquierda, con la luz a la izquierda.
 */
export function dibujarUrinarioLado(lado: 'E' | 'O'): Lienzo {
  const l = new Lienzo(32, 40);
  const e = lado === 'E';
  const x0 = e ? 21 : 3; // borde izquierdo del perfil
  const ancho = 8;
  // Perfil: media elipse alta que sale de la pared (el lado plano pegado a ella).
  for (let y = 6; y <= 27; y++) {
    const t = (y - 6) / 21;
    const sale = Math.round(ancho * Math.sqrt(Math.max(0, 1 - (2 * t - 1) ** 2 * 0.9)));
    for (let i = 0; i < sale; i++) {
      const xx = e ? x0 + i : x0 + ancho - 1 - i; // e: pegado a la pared por la izquierda; o: por la derecha
      const u = (xx - x0) / Math.max(1, ancho - 1);
      l.px(xx, y, porcelana(Math.min(0.9, u)));
    }
  }
  // Tubo de descarga: sale de la pared y sube.
  const xt = e ? 21 : 8;
  l.rect(xt, 3, 3, 4, 'metal-3');
  l.rect(xt + 2, 3, 1, 4, 'metal-1');
  // Labio de la cubeta, en sombra, y desagüe abajo.
  const xl = e ? 24 : 5;
  l.rect(xl, 9, 3, 1, SOMBRA);
  l.rect(xl, 10, 1, 8, SOMBRA);
  l.rect(e ? 23 : 6, 27, 3, 2, 'metal-2');
  l.px(e ? 23 : 6, 27, 'metal-3');
  return cerrarColgado(l);
}

// ---------------------------------------------------------------------------
// Registro
// ---------------------------------------------------------------------------

export function cuadrosBanos(): Cuadros {
  const c: Cuadros = new Map();
  registrar(c, 'sanitario', 'S', dibujarSanitarioS());
  registrar(c, 'sanitario', 'N', dibujarSanitarioN());
  registrar(c, 'sanitario', 'E', dibujarSanitarioLado('E'));
  registrar(c, 'sanitario', 'O', dibujarSanitarioLado('O'));
  registrar(c, 'lavamanos', 'S', dibujarLavamanosS());
  registrar(c, 'lavamanos', 'E', dibujarLavamanosLado('E'));
  registrar(c, 'urinario', 'S', dibujarUrinarioS());
  registrar(c, 'urinario', 'E', dibujarUrinarioLado('E'));
  registrar(c, 'urinario', 'O', dibujarUrinarioLado('O'));
  return c;
}
