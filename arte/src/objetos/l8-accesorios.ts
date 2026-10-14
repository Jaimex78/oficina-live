/**
 * Lote 8, accesorios de escritorio: tazas de tres tamaños y un vaso para llevar, lámparas, control de videojuegos,
 * teléfono de oficina, cuadernos, audífonos, planta chica y la mochila que se deja junto a la silla.
 *
 * Son objetos pequeños con tonos saturados (naranja, azul, verde) como los de Gather. Lo apoyado se dibuja con su borde
 * de abajo en la fila `sobresale + 14` (un poco más al frente que los computadores, que quedan en la fila 10) y lleva el
 * reborde de sombra de 1 px de `cerrarApoyado`. Las variantes de color salen de recolorear la rampa `tela-gris`; los detalles
 * de otro color (franja naranja de la taza, bombilla, cremallera) no se recolorean.
 */

import { Lienzo } from '../nucleo';
import type { ColorEntrada } from '../nucleo';
import { AZ, NE, TG, VI, cerrarApoyado, cerrarSuelo, controlJuego, cuadernoChico, registrar } from './l8-comun';
import type { Cuadros } from './l8-comun';

/** Fila donde apoya un accesorio chico en un cuadro que sobresale `s`. */
const pieChico = (s: number): number => s + 14;

// ---------------------------------------------------------------------------
// Tazas y vaso
// ---------------------------------------------------------------------------

const CAFE: ColorEntrada = 'madera-oscura-1';
const CAFE_LUZ: ColorEntrada = 'madera-oscura-3';

/** Taza con franja naranja y café. `w` x `h` es el cuerpo; el asa va a la derecha. Sale centrada en la casilla. */
function taza(w: number, h: number, asa: boolean): Lienzo {
  const l = new Lienzo(32, 32);
  const fb = pieChico(0);
  const x = Math.floor((32 - w - (asa ? 2 : 0)) / 2);
  const y = fb - h + 1;
  // Cuerpo.
  l.rect(x, y + 1, w, h - 1, TG(1));
  l.rect(x, y + 1, 1, h - 1, TG(2));
  l.rect(x + w - 1, y + 1, 1, h - 1, TG(0));
  l.rect(x + 1, fb, w - 2, 0, TG(0));
  l.rect(x, fb, w, 1, TG(0));
  // Boca con café.
  l.rect(x, y, w, 2, TG(3));
  l.rect(x + 1, y + 1, w - 2, 1, CAFE);
  l.px(x + 1, y + 1, CAFE_LUZ);
  // Franja naranja a media altura.
  const yb = y + Math.max(3, Math.floor(h / 2) - 1);
  l.rect(x, yb, w, 2, 'naranja-2');
  l.rect(x, yb, w, 1, 'naranja-3');
  l.px(x + w - 1, yb + 1, 'naranja-1');
  if (asa) {
    l.rect(x + w, y + 3, 2, 1, TG(2));
    l.rect(x + w + 1, y + 4, 1, Math.max(1, h - 7), TG(2));
    l.rect(x + w, y + h - 3, 2, 1, TG(1));
  }
  return cerrarApoyado(l);
}

function vasoParaLlevar(): Lienzo {
  const l = new Lienzo(32, 32);
  const fb = pieChico(0);
  const x = 12;
  // Cuerpo en trapecio: más ancho arriba.
  for (let j = 0; j < 9; j++) {
    const y = fb - 8 + j;
    const ancho = 8 - Math.floor(j / 4);
    const x0 = x + Math.floor((8 - ancho) / 2);
    l.rect(x0, y, ancho, 1, TG(1));
    l.px(x0, y, TG(2));
    l.px(x0 + ancho - 1, y, TG(0));
  }
  // Funda de cartón naranja.
  l.rect(x + 1, fb - 5, 6, 4, 'naranja-2');
  l.rect(x + 1, fb - 5, 6, 1, 'naranja-3');
  l.px(x + 6, fb - 3, 'naranja-1');
  l.px(x + 6, fb - 2, 'naranja-1');
  // Tapa blanca con la boquilla.
  l.rect(x - 1, fb - 10, 10, 2, NE(7));
  l.rect(x - 1, fb - 9, 10, 1, NE(5));
  l.rect(x + 1, fb - 12, 6, 2, NE(7));
  l.px(x + 5, fb - 12, NE(5));
  return cerrarApoyado(l);
}

// ---------------------------------------------------------------------------
// Lámparas (sobresale 8: 32 x 40, el borde de abajo en la fila 22)
// ---------------------------------------------------------------------------

/** Lámpara articulada de brazos delgados con cabeza cónica y una bombilla encendida. */
function lamparaArticulada(): Lienzo {
  const l = new Lienzo(32, 40);
  const fb = pieChico(8);
  // Base.
  l.rect(9, fb - 1, 12, 2, TG(1));
  l.rect(9, fb - 1, 12, 1, TG(2));
  l.px(20, fb, TG(0));
  // Brazo bajo e inferior.
  l.linea(14, fb - 2, 19, fb - 12, TG(0));
  l.linea(15, fb - 2, 20, fb - 12, TG(1));
  l.linea(19, fb - 13, 11, fb - 17, TG(0));
  l.linea(19, fb - 12, 12, fb - 16, TG(1));
  l.rect(18, fb - 14, 3, 3, TG(2));
  l.px(14, fb - 3, TG(3));
  // Cabeza: pantalla cónica que mira hacia abajo y a la izquierda.
  for (let j = 0; j < 6; j++) l.rect(5 - Math.floor(j / 2) + 1, fb - 20 + j, 8 + j, 1, j < 2 ? TG(2) : j < 4 ? TG(1) : TG(0));
  l.rect(6, fb - 14, 8, 1, 'tela-calida-3');
  l.px(8, fb - 13, 'tela-calida-3');
  l.px(11, fb - 13, 'tela-calida-3');
  return cerrarApoyado(l);
}

/** Lámpara de escritorio con pantalla de vidrio amarillo y base de bronce. */
function lamparaPantalla(): Lienzo {
  const l = new Lienzo(32, 40);
  const fb = pieChico(8);
  // Base de madera oscura.
  l.rect(10, fb - 2, 12, 3, 'madera-oscura-2');
  l.rect(10, fb - 2, 12, 1, 'madera-oscura-4');
  l.rect(21, fb - 1, 1, 2, 'madera-oscura-1');
  // Cuello de bronce.
  l.rect(15, fb - 10, 2, 8, 'madera-clara-1');
  l.rect(15, fb - 10, 1, 8, 'madera-clara-3');
  // Pantalla de vidrio en forma de domo: más angosta arriba y ancha abajo, con el borde de abajo más oscuro.
  for (let j = 0; j < 8; j++) {
    const ancho = 8 + j * 1 + (j > 5 ? 0 : 0);
    const x0 = 16 - Math.floor(ancho / 2);
    const y = fb - 18 + j;
    l.rect(x0, y, ancho, 1, j < 2 ? 'tela-calida-3' : j < 7 ? 'tela-calida-2' : 'tela-calida-1');
    l.px(x0, y, 'tela-calida-3');
    l.px(x0 + ancho - 1, y, 'tela-calida-1');
  }
  l.rect(13, fb - 16, 3, 1, NE(7));
  l.rect(12, fb - 13, 8, 1, 'tela-calida-3');
  return cerrarApoyado(l);
}

// ---------------------------------------------------------------------------
// Teléfono de oficina, control, cuadernos
// ---------------------------------------------------------------------------

function telefonoEscritorio(): Lienzo {
  const l = new Lienzo(32, 32);
  const fb = pieChico(0);
  // Base en cuña: parte de atrás más alta con la pantallita y adelante el teclado numérico.
  l.rect(9, fb - 7, 14, 8, TG(1));
  l.rect(9, fb - 7, 14, 1, TG(3));
  l.rect(9, fb - 6, 1, 7, TG(2));
  l.rect(22, fb - 6, 1, 7, TG(0));
  l.rect(9, fb, 14, 1, TG(0));
  l.rect(11, fb - 6, 6, 2, VI(2));
  l.rect(11, fb - 6, 6, 1, VI(3));
  l.rect(18, fb - 6, 3, 2, 'planta-3');
  for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) l.px(12 + i * 3, fb - 3 + j, j % 2 === 0 ? NE(6) : TG(3));
  // Auricular apoyado en la base: arco con las dos puntas hacia abajo.
  l.rect(8, fb - 11, 16, 2, TG(0));
  l.rect(8, fb - 11, 16, 1, TG(2));
  l.rect(7, fb - 10, 4, 5, TG(1));
  l.rect(21, fb - 10, 4, 5, TG(1));
  l.rect(7, fb - 10, 1, 4, TG(2));
  l.rect(24, fb - 9, 1, 4, TG(0));
  l.rect(8, fb - 6, 2, 1, TG(0));
  l.rect(22, fb - 6, 2, 1, TG(0));
  l.px(25, fb - 4, TG(1));
  l.px(26, fb - 3, TG(1));
  l.px(26, fb - 2, TG(1));
  return cerrarApoyado(l);
}

function control(): Lienzo {
  const l = new Lienzo(32, 32);
  controlJuego(l, 8, pieChico(0) - 8, TG(1));
  return cerrarApoyado(l);
}

/** Cuaderno cerrado: tapa dura con espiral a la izquierda, elástico y una etiqueta blanca. */
function cuadernoCerrado(): Lienzo {
  const l = new Lienzo(32, 32);
  const fb = pieChico(0);
  const x = 8;
  const y = fb - 11;
  l.rect(x, y, 16, 12, TG(1));
  l.rect(x, y, 16, 1, TG(3));
  l.rect(x, y + 1, 2, 11, TG(2));
  l.rect(x + 15, y + 1, 1, 11, TG(0));
  l.rect(x, y + 11, 16, 1, TG(0));
  for (let k = 0; k < 4; k++) l.rect(x - 1, y + 1 + k * 3, 3, 1, NE(5));
  l.rect(x + 11, y, 2, 12, 'rojo-suave-2');
  l.rect(x + 5, y + 3, 5, 4, NE(7));
  l.rect(x + 5, y + 6, 5, 1, NE(5));
  l.rect(x + 6, y + 4, 3, 1, NE(4));
  return cerrarApoyado(l);
}

function cuadernoAbierto(): Lienzo {
  const l = new Lienzo(32, 32);
  const fb = pieChico(0);
  const x = 4;
  const y = fb - 11;
  // Dos hojas con renglones y la costura al centro.
  l.rect(x, y + 1, 24, 11, NE(7));
  l.rect(x, y, 24, 2, NE(6));
  l.rect(x + 12, y, 1, 12, NE(4));
  l.rect(x, y + 11, 24, 1, NE(5));
  l.rect(x + 23, y + 1, 1, 11, NE(5));
  for (let k = 0; k < 4; k++) {
    l.rect(x + 2, y + 3 + k * 2, 8, 1, VI(2));
    l.rect(x + 14, y + 3 + k * 2, k === 3 ? 5 : 8, 1, VI(2));
  }
  l.rect(x + 14, y + 4, 6, 1, NE(2));
  // Lápiz sobre la hoja derecha.
  l.rect(x + 12, y + 9, 10, 2, 'tela-calida-3');
  l.rect(x + 12, y + 9, 10, 1, 'tela-calida-2');
  l.rect(x + 21, y + 9, 2, 2, 'madera-clara-3');
  l.px(x + 23, y + 10, NE(1));
  l.rect(x + 11, y + 9, 1, 2, 'rojo-suave-3');
  return cerrarApoyado(l);
}

// ---------------------------------------------------------------------------
// Audífonos, planta chica y mochila
// ---------------------------------------------------------------------------

/** Audífonos de diadema colgados de un soporte (sobresale 8: 32 x 40, el borde de abajo en la fila 22). */
function audifonos(): Lienzo {
  const l = new Lienzo(32, 40);
  const fb = pieChico(8);
  l.elipse(16, fb - 12, 9, 8, NE(2));
  l.elipse(16, fb - 12, 7, 6, null);
  l.rect(0, fb - 11, 32, 14, null);
  l.rect(11, fb - 20, 10, 1, NE(4));
  l.px(8, fb - 19, NE(4));
  l.px(7, fb - 18, NE(3));
  // Soporte con base ancha.
  l.rect(15, fb - 16, 3, 16, AZ(2));
  l.rect(15, fb - 16, 1, 16, AZ(3));
  l.rect(14, fb - 17, 5, 2, AZ(3));
  l.rect(10, fb - 1, 13, 2, AZ(2));
  l.rect(10, fb - 1, 13, 1, AZ(3));
  // Almohadillas con anillo rojo.
  for (const [x, derecha] of [[5, false], [21, true]] as const) {
    l.rect(x, fb - 13, 6, 7, NE(1));
    l.rect(x, fb - 13, 6, 1, NE(3));
    l.rect(x, fb - 12, 1, 6, NE(3));
    l.rect(x + 5, fb - 12, 1, 6, NE(0));
    l.rect(x + 2, fb - 11, 2, 3, derecha ? 'rojo-2' : 'rojo-3');
    l.px(x + 2, fb - 11, derecha ? 'rojo-3' : 'rojo-4');
  }
  return cerrarApoyado(l);
}

/** Planta chica: sábila de hojas puntiagudas en una maceta naranja (sobresale 8: 32 x 40). */
function plantaChica(): Lienzo {
  const l = new Lienzo(32, 40);
  const fb = pieChico(8);
  const hojas: readonly ColorEntrada[] = ['hoja-pastel-1', 'hoja-pastel-2', 'hoja-pastel-3'];
  // Hojas en abanico (las de atrás primero).
  l.hoja([16, fb - 7], [16, fb - 21], 7, hojas);
  l.hoja([15, fb - 7], [7, fb - 17], 6, hojas);
  l.hoja([17, fb - 7], [25, fb - 17], 6, hojas);
  l.hoja([14, fb - 7], [10, fb - 13], 5, hojas);
  l.hoja([18, fb - 7], [22, fb - 13], 5, hojas);
  // Maceta de barro naranja.
  l.rect(10, fb - 8, 12, 3, 'naranja-3');
  l.rect(10, fb - 8, 12, 1, 'naranja-4');
  l.rect(11, fb - 5, 10, 6, 'naranja-2');
  l.rect(11, fb - 5, 1, 6, 'naranja-3');
  l.rect(20, fb - 5, 1, 6, 'naranja-1');
  l.rect(11, fb, 10, 1, 'naranja-0');
  return cerrarApoyado(l);
}

/** Mochila de piso junto a la silla: cuerpo, bolsillo con cierre, correas y una asa. Se recolorea desde `tela-gris`. */
function mochila(): Lienzo {
  const l = new Lienzo(32, 32);
  // Asa de arriba.
  l.rect(13, 3, 6, 1, TG(0));
  l.px(12, 4, TG(0));
  l.px(19, 4, TG(0));
  // Cuerpo con la parte de arriba redondeada.
  l.rectRedondeado(6, 4, 20, 24, 6, TG(1));
  l.rect(8, 5, 12, 1, TG(2));
  l.rect(7, 7, 1, 17, TG(2));
  l.rect(24, 9, 1, 17, TG(0));
  l.rect(8, 27, 16, 1, TG(0));
  // Bolsillo frontal con cierre y tirador naranja.
  l.rectRedondeado(9, 14, 14, 10, 3, TG(2));
  l.rect(10, 14, 12, 1, TG(3));
  l.rect(9, 16, 14, 1, TG(0));
  l.rect(15, 15, 2, 2, 'naranja-3');
  l.px(15, 15, 'naranja-4');
  // Cierre principal y correas laterales.
  l.rect(9, 9, 14, 1, TG(0));
  l.rect(14, 8, 4, 2, 'naranja-2');
  l.rect(5, 12, 2, 10, TG(0));
  l.rect(25, 12, 2, 10, TG(0));
  return cerrarSuelo(l, { contacto: [16, 27, 9, 1] });
}

// ---------------------------------------------------------------------------

export function cuadrosAccesorios(): Cuadros {
  const c: Cuadros = new Map();
  for (const [id, w, h, asa] of [['taza-regular', 7, 9, true], ['taza-ancha', 9, 8, true], ['taza-alta', 7, 12, false]] as const) {
    registrar(c, id, 'U', taza(w, h, asa), 'tela-gris');
  }
  registrar(c, 'vaso-para-llevar', 'U', vasoParaLlevar(), 'tela-gris');
  registrar(c, 'lampara-escritorio', 'U', lamparaArticulada(), 'tela-gris');
  registrar(c, 'lampara-pantalla', 'U', lamparaPantalla());
  registrar(c, 'telefono-escritorio', 'S', telefonoEscritorio(), 'tela-gris');
  registrar(c, 'control-videojuegos', 'S', control(), 'tela-gris');
  registrar(c, 'cuaderno-cerrado', 'U', cuadernoCerrado(), 'tela-gris');
  registrar(c, 'cuaderno-abierto', 'U', cuadernoAbierto());
  registrar(c, 'audifonos-escritorio', 'S', audifonos());
  registrar(c, 'planta-chica', 'U', plantaChica());
  registrar(c, 'mochila', 'U', mochila(), 'tela-gris');
  void cuadernoChico;
  return c;
}
