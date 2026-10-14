/**
 * Utilidades compartidas del arte del exterior.
 */

import { Lienzo } from '../nucleo';
import { k, type Token } from './paleta';

/** Lado de una casilla del mundo, en píxeles. */
export const LADO = 32;

/** Número pseudoaleatorio estable entre 0 y 1 a partir de tres enteros (mismos datos, mismo resultado). */
export function azar(a: number, b: number, c = 0): number {
  let h = Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263) + Math.imul(c | 0, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** Un tile vacío de 32 x 32. */
export const tileNuevo = (): Lienzo => new Lienzo(LADO, LADO);

/** Pone un píxel con un token de la paleta del exterior. */
export function pk(l: Lienzo, x: number, y: number, t: Token): void {
  l.px(x, y, k(t));
}

/** Rectángulo con un token. */
export function rk(l: Lienzo, x: number, y: number, w: number, h: number, t: Token): void {
  l.rect(x, y, w, h, k(t));
}

/** Elige de una lista por índice (se recorta a los extremos). */
export function elegir<T>(lista: readonly T[], i: number): T {
  return lista[Math.max(0, Math.min(lista.length - 1, i))] as T;
}

/** Textura de trama fina: pone `t` en los píxeles donde el azar cae bajo `umbral`. */
export function salpicar(l: Lienzo, x0: number, y0: number, w: number, h: number, t: Token, umbral: number, semilla: number): void {
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) {
      if (azar(x, y, semilla) < umbral) pk(l, x, y, t);
    }
  }
}
