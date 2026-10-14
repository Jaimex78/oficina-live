/**
 * Cosas colgadas de la pared del lote 5: diana de dardos y aro de baloncesto.
 *
 * Geometría de paredes del lote 1: la cara del sur ocupa las filas 0 a 23 de un cuadro de 32 (con `sobresale` 8, hasta la
 * 31) y el zócalo las 8 últimas. En las paredes verticales (`E` y `O`) solo se ve la franja de la tapa, columnas 11 a
 * 20: lo colgado es una placa delgada pegada a ella (el este a la derecha de la franja, el oeste a la izquierda).
 * Sombra: 1 px abajo y a la derecha, sobre la pared.
 */

import { Lienzo } from '../nucleo';
import type { ColorEntrada } from '../nucleo';
import { cerrarColgado, comprimirH, lados, registrar } from './l5-comun';
import type { Cuadros } from './l5-comun';

/**
 * En el oeste el contorno y la sombra de la placa caerían sobre la franja de la tapa (columna 11 en adelante): se corre
 * todo una columna a la izquierda para que el contorno quede al lado de la franja y no encima.
 */
function pegadoALaFranja(l: Lienzo, este: boolean): Lienzo {
  if (este) return l;
  const r = new Lienzo(l.ancho, l.alto);
  r.pegar(l, -1, 0);
  return r;
}

// ---------------------------------------------------------------------------
// Diana de dardos
// ---------------------------------------------------------------------------

/** Cara de la diana, de 21 x 21 con el centro en el píxel (10, 10) del recorte. Sin contorno ni dardos. */
function caraDiana(): Lienzo {
  const l = new Lienzo(21, 21);
  for (let y = 0; y < 21; y++) {
    for (let x = 0; x < 21; x++) {
      const d = Math.hypot(x - 10, y - 10);
      if (d > 10.5) continue;
      const ang = Math.atan2(y - 10, x - 10) + Math.PI / 2 + Math.PI / 20;
      const sector = Math.floor((((ang % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) / ((2 * Math.PI) / 20));
      const negro = sector % 2 === 0;
      let c: ColorEntrada;
      if (d < 1.5) c = 'rojo-3';
      else if (d < 2.9) c = 'neutro-7';
      else if (d < 5) c = negro ? 'neutro-1' : 'crema-4';
      else if (d < 6.6) c = negro ? 'rojo-1' : 'rojo-3';
      else if (d < 8.6) c = negro ? 'neutro-1' : 'crema-4';
      else if (d < 9.6) c = negro ? 'rojo-1' : 'rojo-3';
      else c = 'neutro-2';
      l.px(x, y, c);
    }
  }
  // Brillo del aro exterior arriba a la izquierda.
  for (const [x, y] of [[4, 2], [3, 3], [2, 4], [5, 1], [1, 5]] as const) l.px(x, y, 'neutro-4');
  return l;
}

/** Dardo clavado de frente: la punta, el cuerpo y las plumas de color. */
function dardo(l: Lienzo, tx: number, ty: number, color: ColorEntrada): void {
  l.px(tx, ty, 'metal-3');
  l.px(tx - 1, ty - 1, 'neutro-6');
  l.rect(tx - 3, ty - 3, 2, 2, color);
  l.px(tx - 3, ty - 3, 'neutro-7');
}

export function dibujarDianaS(): Lienzo {
  const l = new Lienzo(32, 32);
  l.pegar(caraDiana(), 5, 1);
  dardo(l, 12, 9, 'vidrio-2');
  dardo(l, 19, 14, 'tela-calida-3');
  dardo(l, 16, 11, 'neutro-7');
  return cerrarColgado(l);
}

/** De lado: la diana vista casi de canto, una placa de 4 columnas pegada a la franja de la tapa. */
export function dibujarDianaLado(lado: 'E' | 'O'): Lienzo {
  const { e } = lados(lado);
  const l = new Lienzo(32, 32);
  const placa = comprimirH(caraDiana(), 4, !e);
  l.pegar(placa, e ? 21 : 7, 1);
  // El borde que toca la pared va más oscuro.
  l.rect(e ? 21 : 10, 4, 1, 15, 'neutro-1');
  return cerrarColgado(pegadoALaFranja(l, e));
}

// ---------------------------------------------------------------------------
// Aro de baloncesto
// ---------------------------------------------------------------------------

/** Red: trapecio blanco con diagonales que se cruzan y borde de abajo festoneado. */
function red(l: Lienzo, cx: number, y0: number, alto: number, mitadArriba: number, mitadAbajo: number): void {
  for (let j = 0; j < alto; j++) {
    const mitad = Math.round(mitadArriba + ((mitadAbajo - mitadArriba) * j) / Math.max(1, alto - 1));
    for (let x = cx - mitad; x < cx + mitad; x++) {
      const diag = (x + j) % 3 === 0 || (x - j + 30) % 3 === 0;
      l.px(x, y0 + j, diag ? 'neutro-7' : 'neutro-5');
    }
  }
  // Festón del borde de abajo.
  for (let x = cx - mitadAbajo; x < cx + mitadAbajo; x += 2) l.px(x, y0 + alto, 'neutro-6');
}

export function dibujarAroS(): Lienzo {
  const l = new Lienzo(32, 40);
  // Tablero: blanco con marco rojo y el cuadro de puntería.
  l.rect(5, 1, 22, 14, 'neutro-6');
  l.rect(5, 1, 22, 1, 'neutro-7');
  l.rect(5, 1, 1, 14, 'neutro-7');
  l.rect(26, 2, 1, 13, 'neutro-4');
  l.rect(6, 14, 21, 1, 'neutro-4');
  l.rectBorde(11, 6, 10, 7, 'rojo-3');
  l.rect(11, 6, 10, 1, 'rojo-4');
  // Red y aro: el aro sale hacia quien mira, así que se ve como un óvalo bajo el tablero.
  red(l, 16, 18, 9, 5, 3);
  l.elipse(15.5, 17, 6, 2, 'naranja-2');
  l.elipse(15.5, 17, 5, 1, 'naranja-0');
  l.rect(10, 16, 11, 1, 'naranja-4');
  l.rect(9, 17, 1, 1, 'naranja-3');
  l.rect(22, 18, 1, 1, 'naranja-1');
  // Soporte del tablero al aro.
  l.rect(14, 14, 3, 2, 'metal-2');
  l.px(14, 14, 'metal-3');
  return cerrarColgado(l);
}

export function dibujarAroLado(lado: 'E' | 'O'): Lienzo {
  const { e, X } = lados(lado);
  const l = new Lienzo(32, 40);
  // Tablero visto de canto: placa delgada y alta.
  l.rect(X(21, 3), 1, 3, 15, 'neutro-6');
  l.rect(X(21, 3) + (e ? 0 : 2), 1, 1, 15, e ? 'neutro-7' : 'neutro-4');
  l.rect(X(21, 3) + 1, 5, 1, 7, 'rojo-3');
  // Aro: sale de la placa como un óvalo aplastado, con la red colgando.
  const sx = e ? 24 : 7;
  for (let j = 0; j < 9; j++) {
    const ancho = Math.max(2, 6 - Math.floor(j / 2));
    const x = e ? sx : sx - ancho + 1;
    for (let i = 0; i < ancho; i++) l.px(x + i, 19 + j, (i + j) % 2 === 0 ? 'neutro-7' : 'neutro-5');
  }
  l.rect(e ? sx : sx - 5, 17, 6, 2, 'naranja-2');
  l.rect(e ? sx : sx - 5, 17, 6, 1, 'naranja-3');
  l.px(e ? sx + 5 : sx - 5, 18, 'naranja-1');
  // Soporte.
  l.rect(X(21, 3) + (e ? 2 : -2), 15, 3, 2, 'metal-2');
  return cerrarColgado(pegadoALaFranja(l, e));
}

// ---------------------------------------------------------------------------
// Registro
// ---------------------------------------------------------------------------

export function cuadrosPared(): Cuadros {
  const c: Cuadros = new Map();
  registrar(c, 'diana-dardos', 'S', dibujarDianaS());
  registrar(c, 'diana-dardos', 'E', dibujarDianaLado('E'));
  registrar(c, 'diana-dardos', 'O', dibujarDianaLado('O'));
  registrar(c, 'aro-baloncesto', 'S', dibujarAroS());
  registrar(c, 'aro-baloncesto', 'E', dibujarAroLado('E'));
  registrar(c, 'aro-baloncesto', 'O', dibujarAroLado('O'));
  return c;
}
