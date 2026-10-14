/**
 * Ayudas del lote 5 (atlas `objetos-v6`): mesas de juego, cosas de pared, música, kart, silla gamer y aparatos.
 *
 * Reusa las sombras del lote 4 (`cerrarSuelo`: dos tonos sólidos de `azul-oficina`, `cerrarColgado`: 1 px sobre la
 * pared) y agrega lo que piden estos objetos: bloques sombreados con la luz a la izquierda, un plano de mesa que se
 * puede girar 90 grados (para las orientaciones `E`) y bolas, fichas y cartas pequeñas.
 */

import { Lienzo } from '../nucleo';
import type { ColorEntrada } from '../nucleo';
import { cuerpoBlando } from './l2b-comun';
import { cerrarColgado, cerrarSinSombra, cerrarSuelo, registrar, registrarVariantes } from './l4-comun';
import type { Cuadros } from './l4-comun';

export { cerrarColgado, cerrarSinSombra, cerrarSuelo, cuerpoBlando, registrar, registrarVariantes };
export type { Cuadros };

/** Tres tonos de un material: sombra, medio y luz (de oscuro a claro). */
export interface Tonos {
  sombra: ColorEntrada;
  medio: ColorEntrada;
  luz: ColorEntrada;
}

/** Atajo para armar tonos desde una rampa y tres índices. */
export function tonosDe(rampa: string, sombra: number, medio: number, luz: number): Tonos {
  return { sombra: `${rampa}-${sombra}`, medio: `${rampa}-${medio}`, luz: `${rampa}-${luz}` };
}

/** Bloque con luz arriba y a la izquierda, sombra abajo y a la derecha. */
export function bloque(l: Lienzo, x: number, y: number, ancho: number, alto: number, t: Tonos): Lienzo {
  l.rect(x, y, ancho, alto, t.medio);
  l.rect(x, y, ancho, 1, t.luz);
  l.rect(x, y, 1, alto, t.luz);
  l.rect(x + ancho - 1, y + 1, 1, Math.max(0, alto - 1), t.sombra);
  l.rect(x + 1, y + alto - 1, Math.max(0, ancho - 1), 1, t.sombra);
  return l;
}

/** Columna fina de tres tonos: luz a la izquierda, medio y sombra a la derecha. */
export function columna(l: Lienzo, x: number, y: number, ancho: number, alto: number, t: Tonos): Lienzo {
  if (ancho <= 1) return l.rect(x, y, 1, alto, t.medio);
  if (ancho === 2) return l.rect(x, y, 1, alto, t.luz).rect(x + 1, y, 1, alto, t.sombra);
  l.rect(x, y, ancho, alto, t.medio);
  l.rect(x, y, 1, alto, t.luz);
  l.rect(x + ancho - 1, y, 1, alto, t.sombra);
  return l;
}

/** Quita las cuatro esquinas de un rectángulo (esquina de 1 px). */
export function esquinas(l: Lienzo, x: number, y: number, ancho: number, alto: number): Lienzo {
  l.px(x, y, null).px(x + ancho - 1, y, null).px(x, y + alto - 1, null).px(x + ancho - 1, y + alto - 1, null);
  return l;
}

/** Ayuda para orientaciones laterales: la pieza se dibuja con la geometría del este y se refleja para el oeste. */
export function lados(lado: 'E' | 'O', anchoLienzo = 32): { X: (x: number, ancho: number) => number; XC: (cx: number) => number; e: boolean } {
  const e = lado === 'E';
  return { e, X: (x, ancho) => (e ? x : anchoLienzo - x - ancho), XC: (cx) => (e ? cx : anchoLienzo - 1 - cx) };
}

/** Rellena una forma de arco con biselado: borde claro a la izquierda y arriba, oscuro a la derecha y abajo. */
export function rellenarArco(l: Lienzo, forma: (x: number, y: number) => boolean, x0: number, x1: number, y0: number, y1: number, tonos: readonly ColorEntrada[]): void {
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      if (!forma(x, y)) continue;
      const izqArriba = !forma(x - 1, y) || !forma(x, y - 1);
      const derAbajo = !forma(x + 1, y) || !forma(x, y + 1);
      l.px(x, y, izqArriba ? (tonos[3] as ColorEntrada) : derAbajo ? (tonos[0] as ColorEntrada) : (tonos[2] as ColorEntrada));
    }
  }
}

// ---------------------------------------------------------------------------
// Mesas
// ---------------------------------------------------------------------------

export interface OpcionesMesa {
  x: number;
  y: number;
  ancho: number;
  /** Alto en pantalla de la cara superior. */
  fondo: number;
  /** Radio de las esquinas de la tapa. */
  radio: number;
  /** Tonos de la tapa (el borde). */
  tapa: Tonos;
  /** Tonos del faldón y de las patas. */
  faldon: Tonos;
  pata: Tonos;
  canto?: number;
  alturaFaldon?: number;
  alturaPata?: number;
  /** Distancia de las patas al borde: más grande en tapas muy redondeadas. */
  margenPata?: number;
}

/** Medidas que salen de `cuerpoMesa` y sirven para la sombra de contacto. */
export interface MedidasMesa {
  /** Fila donde empieza el faldón. */
  yFaldon: number;
  /** Fila donde termina la pata. */
  yPie: number;
}

/**
 * Cuerpo de una mesa en vista 3/4: patas y faldón atrás, luego el canto y la tapa. La tapa queda como un marco (el
 * borde de madera, plástico o cuero) y quien llama pinta encima el paño, el hielo o el tablero.
 */
export function cuerpoMesa(l: Lienzo, o: OpcionesMesa): MedidasMesa {
  const canto = o.canto ?? 3;
  const alturaFaldon = o.alturaFaldon ?? 5;
  const alturaPata = o.alturaPata ?? 7;
  const margen = o.margenPata ?? 3;
  const yFaldon = o.y + o.fondo + canto;
  const yPie = yFaldon + alturaFaldon + alturaPata;
  // Patas delanteras: columnas con un pie un poco más oscuro.
  for (const px of [o.x + margen, o.x + o.ancho - margen - 5]) {
    columna(l, px, yFaldon - 1, 5, alturaFaldon + alturaPata + 1, o.pata);
    l.rect(px, yPie - 1, 5, 1, o.pata.sombra);
    esquinas(l, px, yPie - 1, 5, 1);
  }
  // Faldón: queda en sombra bajo el canto.
  const fx = o.x + margen - 1;
  const fa = o.ancho - 2 * margen + 2;
  l.rect(fx, yFaldon, fa, alturaFaldon, o.faldon.medio);
  l.rect(fx, yFaldon, fa, 1, o.faldon.sombra);
  l.rect(fx, yFaldon + 1, 1, alturaFaldon - 1, o.faldon.luz);
  l.rect(fx + fa - 1, yFaldon + 1, 1, alturaFaldon - 1, o.faldon.sombra);
  // Canto y tapa.
  cuerpoBlando(l, o.x, o.y, o.ancho, o.fondo + canto, o.radio, [o.tapa.sombra, o.tapa.medio, o.tapa.luz]);
  // El canto queda en sombra: se repinta solo lo que ya existe, para respetar las esquinas redondeadas.
  for (let j = 0; j < canto - 1; j++) {
    for (let i = 1; i < o.ancho - 1; i++) {
      if (l.esOpaco(o.x + i, o.y + o.fondo + j)) l.px(o.x + i, o.y + o.fondo + j, j === 0 ? o.tapa.medio : o.tapa.sombra);
    }
  }
  return { yFaldon, yPie };
}

/**
 * Plano de una mesa: coordenadas `(u, v)` con `u` a lo largo del lado largo y `v` a lo ancho. En `S` el largo es
 * horizontal; con `girado` (orientación `E`) el largo pasa a ser vertical. Dibuja con las mismas funciones en las dos
 * orientaciones, y deja las cosas redondas (bolas, fichas) sin girar.
 */
export class Plano {
  constructor(
    readonly l: Lienzo,
    readonly x0: number,
    readonly y0: number,
    /** Largo del plano. */
    readonly U: number,
    /** Ancho del plano. */
    readonly V: number,
    readonly girado: boolean,
  ) {}

  /** Esquina superior izquierda en pantalla del punto `(u, v)`. */
  pt(u: number, v: number): [number, number] {
    return this.girado ? [this.x0 + v, this.y0 + u] : [this.x0 + u, this.y0 + v];
  }

  rect(u: number, v: number, w: number, h: number, c: ColorEntrada): this {
    if (this.girado) this.l.rect(this.x0 + v, this.y0 + u, h, w, c);
    else this.l.rect(this.x0 + u, this.y0 + v, w, h, c);
    return this;
  }

  px(u: number, v: number, c: ColorEntrada): this {
    const [x, y] = this.pt(u, v);
    this.l.px(x, y, c);
    return this;
  }

  linea(u0: number, v0: number, u1: number, v1: number, c: ColorEntrada): this {
    const [xa, ya] = this.pt(u0, v0);
    const [xb, yb] = this.pt(u1, v1);
    this.l.linea(xa, ya, xb, yb, c);
    return this;
  }

  elipse(u: number, v: number, ru: number, rv: number, c: ColorEntrada): this {
    const [x, y] = this.pt(u, v);
    if (this.girado) this.l.elipse(x, y, rv, ru, c);
    else this.l.elipse(x, y, ru, rv, c);
    return this;
  }

  /** Bola de 4 x 4 con su esquina superior izquierda en `(u, v)`. */
  bola(u: number, v: number, t: readonly [ColorEntrada, ColorEntrada]): this {
    const [x, y] = this.pt(u, v);
    bola(this.l, x, y, t);
    return this;
  }
}

/** Bola de 4 x 4: cuerpo, un brillo arriba a la izquierda y una sombra abajo a la derecha. */
export function bola(l: Lienzo, x: number, y: number, t: readonly [ColorEntrada, ColorEntrada]): Lienzo {
  l.rect(x, y + 1, 4, 2, t[0]);
  l.rect(x + 1, y, 2, 1, t[0]);
  l.rect(x + 1, y + 3, 2, 1, t[1]);
  l.px(x + 3, y + 2, t[1]);
  l.px(x + 3, y + 1, t[0]);
  l.px(x + 1, y + 1, 'neutro-7');
  return l;
}

/** Ficha de póker vista de arriba: pila de `n` fichas de 5 x 2 con el borde de otro color. */
export function pilaFichas(l: Lienzo, x: number, y: number, n: number, t: readonly [ColorEntrada, ColorEntrada]): Lienzo {
  for (let i = 0; i < n; i++) {
    const yy = y - i * 2;
    l.rect(x + 1, yy, 3, 3, t[0]);
    l.rect(x, yy + 1, 5, 2, t[0]);
    l.rect(x, yy + 2, 5, 1, t[1]);
    l.px(x + 1, yy + 1, 'neutro-7');
    l.px(x + 3, yy + 1, t[1]);
  }
  return l;
}

/** Carta de 4 x 5 con su palo de un píxel (`palo`) y el borde de abajo a la derecha en gris. */
export function carta(l: Lienzo, x: number, y: number, palo: ColorEntrada | null): Lienzo {
  l.rect(x, y, 4, 5, 'neutro-7');
  l.rect(x + 3, y, 1, 5, 'neutro-6');
  l.rect(x, y + 4, 4, 1, 'neutro-6');
  if (palo === null) {
    l.rect(x, y, 4, 5, 'azul-oficina-2');
    l.rect(x + 1, y + 1, 2, 3, 'rojo-2');
  } else {
    l.px(x + 1, y + 1, palo).px(x + 1, y + 2, palo);
  }
  return l;
}

// ---------------------------------------------------------------------------
// Varios
// ---------------------------------------------------------------------------

/** Comprime un lienzo en horizontal a `ancho` columnas, tomando una de cada tantas (sirve para ver una cara de lado). */
export function comprimirH(origen: Lienzo, ancho: number, desdeDerecha = false): Lienzo {
  const r = new Lienzo(ancho, origen.alto);
  for (let c = 0; c < ancho; c++) {
    const k = desdeDerecha ? ancho - 1 - c : c;
    const sx = Math.min(origen.ancho - 1, Math.round(((k + 0.5) * origen.ancho) / ancho - 0.5));
    for (let y = 0; y < origen.alto; y++) {
      const hex = origen.leerHex(sx, y);
      if (hex !== null) r.px(c, y, hex);
    }
  }
  return r;
}
