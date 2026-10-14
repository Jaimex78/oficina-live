/**
 * Rejilla de letras editable (lienzo de 32 x 64) para derivar vistas desde los sprites exactos del diseñador.
 * Trabaja con las mismas letras de `LEYENDA` (`datos-disenador.ts`). Las operaciones son de cirugía de píxeles: reemplazar tramos de
 * una fila, estirar o acortar un tramo repitiendo o quitando una fila, mover bloques. Nada de esto toca los sprites originales.
 */

import { ALTO, ANCHO, BASE, FILA_INICIAL } from './datos-disenador';
import { capaDeFilas } from './disenador';
import type { Capa } from './disenador';

export type Rejilla = string[][];

export function vacia(): Rejilla {
  return Array.from({ length: ALTO }, () => Array.from({ length: ANCHO }, () => '.'));
}

export function desdeFilas(filas: readonly string[], y0 = FILA_INICIAL, x0 = 0): Rejilla {
  const g = vacia();
  filas.forEach((f, r) => {
    for (let x = 0; x < f.length; x++) if (x + x0 < ANCHO && r + y0 < ALTO) g[r + y0]![x + x0] = f[x]!;
  });
  return g;
}

export const copiar = (g: Rejilla): Rejilla => g.map((r) => r.slice());
export const filaTexto = (g: Rejilla, y: number): string => g[y]!.join('');
export const aCapaRejilla = (g: Rejilla): Capa => capaDeFilas(g.map((r) => r.join('')), 0, 0);

/** Reemplaza `texto` en la fila `y` desde la columna `x0`; el punto `_` en el texto deja el píxel como estaba. */
export function poner(g: Rejilla, y: number, x0: number, texto: string): void {
  for (let i = 0; i < texto.length; i++) if (texto[i] !== '_') g[y]![x0 + i] = texto[i]!;
}

/** Rellena un rectángulo [x0..x1] x [y0..y1] con una letra. */
export function rellenar(g: Rejilla, x0: number, x1: number, y0: number, y1: number, letra: string): void {
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) g[y]![x] = letra;
}

/** Copia un bloque de la rejilla (columnas x0..x1, filas y0..y1). */
export function bloque(g: Rejilla, x0: number, x1: number, y0: number, y1: number): string[][] {
  const out: string[][] = [];
  for (let y = y0; y <= y1; y++) out.push(g[y]!.slice(x0, x1 + 1));
  return out;
}

/** Pega un bloque en (x0, y0) sin tocar los píxeles transparentes del bloque. */
export function pegar(g: Rejilla, b: string[][], x0: number, y0: number): void {
  b.forEach((fila, r) => fila.forEach((ch, c) => {
    const y = y0 + r;
    const x = x0 + c;
    if (ch !== '.' && y >= 0 && y < ALTO && x >= 0 && x < ANCHO) g[y]![x] = ch;
  }));
}

/** Vacía un rectángulo. */
export const borrar = (g: Rejilla, x0: number, x1: number, y0: number, y1: number): void => rellenar(g, x0, x1, y0, y1, '.');

/**
 * Estira verticalmente un tramo de filas [y0..y1] de las columnas [x0..x1]: la fila `filaRepetida` se repite `n` veces de más
 * (n positivo) o se quita `-n` veces (n negativo). Devuelve el bloque nuevo, de (y1 - y0 + 1 + n) filas, listo para pegar en y0.
 */
export function estirar(g: Rejilla, x0: number, x1: number, y0: number, y1: number, filaRepetida: number, n: number): string[][] {
  const filas: string[][] = [];
  for (let y = y0; y <= y1; y++) {
    const f = g[y]!.slice(x0, x1 + 1);
    if (n < 0 && y >= filaRepetida && y < filaRepetida - n) continue; // se quitan |n| filas desde filaRepetida
    filas.push(f);
    if (n > 0 && y === filaRepetida) for (let k = 0; k < n; k++) filas.push(f.slice());
  }
  return filas;
}

export const BASE_S: Rejilla = desdeFilas(BASE);
