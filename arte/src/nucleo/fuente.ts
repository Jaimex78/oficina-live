/**
 * Fuente bitmap de 3 x 5 píxeles, incluida en el núcleo para rotular hojas de
 * contacto y detalles diminutos (teclas, números de reloj, etiquetas de prueba).
 *
 * Soporta A a Z, 0 a 9 y signos básicos. Las minúsculas se muestran como
 * mayúsculas y las vocales con tilde y la Ñ se dibujan sin la marca. Lo que no
 * está en la fuente se dibuja como `?`.
 *
 * NO es una fuente de marca ni de interfaz: es solo para uso técnico. Las
 * letras dentro del mundo del juego usarán una fuente pixel libre (pendiente de elegir).
 */

import type { Lienzo } from './lienzo';
import type { ColorEntrada } from './tipos';

export const ANCHO_GLIFO = 3;
export const ALTO_GLIFO = 5;

type Glifo = readonly [string, string, string, string, string];

/** Cada glifo son 5 filas de 3 caracteres: `#` pinta y `.` deja vacío. */
const GLIFOS: Readonly<Record<string, Glifo>> = {
  A: ['.#.', '#.#', '###', '#.#', '#.#'],
  B: ['##.', '#.#', '##.', '#.#', '##.'],
  C: ['.##', '#..', '#..', '#..', '.##'],
  D: ['##.', '#.#', '#.#', '#.#', '##.'],
  E: ['###', '#..', '##.', '#..', '###'],
  F: ['###', '#..', '##.', '#..', '#..'],
  G: ['.##', '#..', '#.#', '#.#', '.##'],
  H: ['#.#', '#.#', '###', '#.#', '#.#'],
  I: ['###', '.#.', '.#.', '.#.', '###'],
  J: ['..#', '..#', '..#', '#.#', '.#.'],
  K: ['#.#', '#.#', '##.', '#.#', '#.#'],
  L: ['#..', '#..', '#..', '#..', '###'],
  M: ['#.#', '###', '###', '#.#', '#.#'],
  N: ['##.', '#.#', '#.#', '#.#', '#.#'],
  O: ['.#.', '#.#', '#.#', '#.#', '.#.'],
  P: ['##.', '#.#', '##.', '#..', '#..'],
  Q: ['.#.', '#.#', '#.#', '##.', '.##'],
  R: ['##.', '#.#', '##.', '#.#', '#.#'],
  S: ['.##', '#..', '.#.', '..#', '##.'],
  T: ['###', '.#.', '.#.', '.#.', '.#.'],
  U: ['#.#', '#.#', '#.#', '#.#', '###'],
  V: ['#.#', '#.#', '#.#', '#.#', '.#.'],
  W: ['#.#', '#.#', '###', '###', '#.#'],
  X: ['#.#', '#.#', '.#.', '#.#', '#.#'],
  Y: ['#.#', '#.#', '.#.', '.#.', '.#.'],
  Z: ['###', '..#', '.#.', '#..', '###'],
  '0': ['###', '#.#', '#.#', '#.#', '###'],
  '1': ['.#.', '##.', '.#.', '.#.', '###'],
  '2': ['##.', '..#', '.#.', '#..', '###'],
  '3': ['##.', '..#', '.#.', '..#', '##.'],
  '4': ['#.#', '#.#', '###', '..#', '..#'],
  '5': ['###', '#..', '##.', '..#', '##.'],
  '6': ['.##', '#..', '###', '#.#', '###'],
  '7': ['###', '..#', '.#.', '.#.', '.#.'],
  '8': ['###', '#.#', '###', '#.#', '###'],
  '9': ['###', '#.#', '###', '..#', '##.'],
  ' ': ['...', '...', '...', '...', '...'],
  '-': ['...', '...', '###', '...', '...'],
  _: ['...', '...', '...', '...', '###'],
  '.': ['...', '...', '...', '...', '.#.'],
  ',': ['...', '...', '...', '.#.', '#..'],
  ':': ['...', '.#.', '...', '.#.', '...'],
  ';': ['...', '.#.', '...', '.#.', '#..'],
  '/': ['..#', '..#', '.#.', '#..', '#..'],
  '\\': ['#..', '#..', '.#.', '..#', '..#'],
  '(': ['.#.', '#..', '#..', '#..', '.#.'],
  ')': ['.#.', '..#', '..#', '..#', '.#.'],
  '[': ['##.', '#..', '#..', '#..', '##.'],
  ']': ['.##', '..#', '..#', '..#', '.##'],
  '+': ['...', '.#.', '###', '.#.', '...'],
  '=': ['...', '###', '...', '###', '...'],
  '*': ['...', '#.#', '.#.', '#.#', '...'],
  '#': ['#.#', '###', '#.#', '###', '#.#'],
  '!': ['.#.', '.#.', '.#.', '...', '.#.'],
  '?': ['##.', '..#', '.#.', '...', '.#.'],
  '%': ['#.#', '..#', '.#.', '#..', '#.#'],
  "'": ['.#.', '.#.', '...', '...', '...'],
  '"': ['#.#', '#.#', '...', '...', '...'],
  '<': ['..#', '.#.', '#..', '.#.', '..#'],
  '>': ['#..', '.#.', '..#', '.#.', '#..'],
  '@': ['###', '#.#', '###', '#..', '.##'],
  '~': ['...', '.##', '##.', '...', '...'],
  '|': ['.#.', '.#.', '.#.', '.#.', '.#.'],
  '^': ['.#.', '#.#', '...', '...', '...'],
};

/** Todos los caracteres que la fuente sabe dibujar (ya en mayúsculas). */
export const CARACTERES_FUENTE: string = Object.keys(GLIFOS).join('');

/** Los glifos tal cual, por si una prueba o una herramienta necesita comprobarlos. */
export function glifoDe(caracter: string): Glifo | undefined {
  return GLIFOS[caracter];
}

/** Pasa a mayúsculas, quita las tildes (la Ñ pasa a N) y unifica las rayas largas a un guion. */
export function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/\p{M}/gu, '') // marcas combinantes: quita tildes y diéresis tras normalizar
    .replace(/\p{Pd}/gu, '-') // cualquier raya o guion Unicode pasa a un guion simple
    .toUpperCase();
}

/** Ancho en píxeles que ocupa un texto: 3 por letra más 1 de separación, por `escala`. */
export function anchoTexto(texto: string, escala = 1): number {
  const n = [...normalizarTexto(texto)].length;
  return n === 0 ? 0 : (n * (ANCHO_GLIFO + 1) - 1) * escala;
}

/**
 * Dibuja `texto` con la esquina superior izquierda en `(x, y)` y devuelve el
 * ancho que ocupó. `escala` agranda cada píxel de la fuente (1, 2, 3...).
 */
export function dibujarTexto(
  lienzo: Lienzo,
  texto: string,
  x: number,
  y: number,
  color: ColorEntrada,
  escala = 1,
): number {
  const e = Math.max(1, Math.floor(escala));
  let cursor = x;
  const normalizado = normalizarTexto(texto);
  for (const caracter of normalizado) {
    const glifo = GLIFOS[caracter] ?? (GLIFOS['?'] as Glifo);
    glifo.forEach((fila, j) => {
      for (let i = 0; i < ANCHO_GLIFO; i++) {
        if (fila[i] === '#') lienzo.rect(cursor + i * e, y + j * e, e, e, color);
      }
    });
    cursor += (ANCHO_GLIFO + 1) * e;
  }
  return anchoTexto(texto, e);
}
