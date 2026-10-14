/**
 * Lote 4, tecnología gamer: la consola PlayStation 5 con su control (el computador gamer pasó al lote 8, `l8-pcs.ts`).
 *
 * Va apoyada sobre un escritorio: su última fila de cuerpo es `FILA_APOYO` (15), la fila 0 queda para el
 * contorno y llevan el reborde de sombra de 1 px sobre la tapa. Todo lo que emite luz (pantalla, ventiladores, teclado,
 * franja de la consola) usa los tonos más claros y saturados de su rampa para leerse encendido de noche.
 *
 * La PS5 es una consola ORIGINAL en el espíritu de una consola blanca y negra con una línea azul: no copia logos ni
 * marcas, y los símbolos del control son cuatro puntos de colores.
 */

import { Lienzo } from '../nucleo';
import { B, cerrarApoyado, registrar } from './l4-comun';
import type { Cuadros } from './l4-comun';

// ---------------------------------------------------------------------------
// PlayStation 5
// ---------------------------------------------------------------------------

/** Consola vertical blanca con paneles negros curvos y una línea de luz azul, y un control blanco a su lado. */
export function dibujarPs5(): Lienzo {
  const l = new Lienzo(32, 32);
  // Consola: dos placas blancas curvas a los lados de un cuerpo negro. 11 de ancho, 13 de alto.
  const x = 3;
  const y = B - 14;
  l.rectRedondeado(x, y, 11, 13, 3, 'neutro-7');
  // Placa blanca de la derecha, en sombra.
  l.rect(x + 8, y + 1, 3, 11, 'baldosa-gris-4');
  l.rect(x + 10, y + 2, 1, 9, 'baldosa-gris-3');
  l.rect(x + 8, y + 12, 3, 1, 'baldosa-gris-3');
  // Placa blanca de la izquierda, con luz.
  l.rect(x + 2, y + 2, 1, 10, 'neutro-6');
  // Cuerpo negro central con el borde izquierdo brillante y un reflejo.
  l.rect(x + 4, y + 1, 4, 11, 'neutro-1');
  l.rect(x + 4, y + 1, 1, 11, 'neutro-3');
  l.rect(x + 7, y + 2, 1, 10, 'neutro-0');
  l.rect(x + 5, y + 1, 2, 1, 'neutro-3');
  l.rect(x + 5, y + 3, 1, 3, 'neutro-2');
  // Línea de luz azul entre la placa izquierda y el cuerpo: lo que emite.
  l.rect(x + 3, y + 2, 1, 10, 'vidrio-3');
  l.rect(x + 3, y + 4, 1, 6, 'neutro-7');
  // Puertos abajo del cuerpo.
  l.px(x + 5, y + 10, 'vidrio-1');
  l.px(x + 6, y + 10, 'neutro-4');
  // Base: anillo blanco y gris bajo la consola.
  l.rect(x - 1, B - 1, 13, 2, 'neutro-6');
  l.rect(x - 1, B - 1, 13, 1, 'neutro-7');
  l.rect(x - 1, B, 13, 1, 'baldosa-gris-3');
  // Control blanco: cuerpo ancho con dos empuñaduras, panel táctil negro con luz azul, cruceta, botones y palancas.
  const cx = 17;
  const cy = B - 7;
  l.rect(cx + 1, cy, 10, 4, 'neutro-7');
  l.rect(cx, cy + 2, 4, 5, 'neutro-7');
  l.rect(cx + 9, cy + 2, 4, 5, 'neutro-7');
  l.rect(cx + 2, cy + 4, 8, 2, 'neutro-7');
  l.rect(cx + 1, cy + 3, 1, 1, 'neutro-6');
  l.rect(cx, cy + 6, 4, 1, 'baldosa-gris-3');
  l.rect(cx + 9, cy + 6, 4, 1, 'baldosa-gris-3');
  l.rect(cx + 12, cy + 3, 1, 3, 'baldosa-gris-3');
  l.rect(cx + 4, cy + 5, 5, 1, 'baldosa-gris-3');
  l.rect(cx + 4, cy + 1, 5, 2, 'neutro-1'); // panel táctil
  l.rect(cx + 3, cy + 1, 1, 2, 'vidrio-3'); // barra de luz
  l.rect(cx + 9, cy + 1, 1, 2, 'vidrio-3');
  l.px(cx + 2, cy + 3, 'neutro-5'); // cruceta
  l.px(cx + 1, cy + 4, 'neutro-5');
  l.px(cx + 3, cy + 4, 'neutro-5');
  l.px(cx + 2, cy + 5, 'neutro-5');
  l.px(cx + 10, cy + 3, 'rojo-suave-3'); // cuatro botones
  l.px(cx + 12, cy + 4, 'rojo-3');
  l.px(cx + 10, cy + 5, 'vidrio-2');
  l.px(cx + 8, cy + 4, 'hoja-pastel-3');
  l.px(cx + 4, cy + 6, 'neutro-2'); // palancas
  l.px(cx + 8, cy + 6, 'neutro-2');
  return cerrarApoyado(l, { diagonales: true });
}

// ---------------------------------------------------------------------------
// Registro
// ---------------------------------------------------------------------------

export function cuadrosGamer(): Cuadros {
  const c: Cuadros = new Map();
  registrar(c, 'ps5', 'S', dibujarPs5());
  return c;
}
