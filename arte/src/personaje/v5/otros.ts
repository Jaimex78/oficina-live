/**
 * «Otro» del catálogo v5 (4): mochila, bufanda, auriculares al cuello y capa. Siguen al cuerpo en todas las poses (6 cuadros por vista), así que
 * se pintan sobre las zonas como la ropa. Lo que cae detrás del cuerpo (la mochila de frente, la capa) va en la capa `atras`.
 * S frente, N espalda, I perfil izquierdo.
 */

import { ANCHO } from './datos-disenador';
import type { Capa } from './disenador';
import { Pincel, conSilueta, ctxDe, NEGRO } from './vestir';
import type { Ctx, Slot } from './vestir';
import type { Vista } from './pose';

export interface PiezaDef {
  id: string;
  nombre: string;
  capa: 'sombra' | 'atras' | 'cuerpo' | 'zapatos' | 'abajo' | 'arriba' | 'chaqueta' | 'cuello' | 'barba' | 'pelo' | 'cara' | 'cabeza' | 'delante';
  carpeta?: 'sombrero' | 'gafas' | 'otro';
  slots: Slot[];
  etiquetas: string[];
  ocultaPeloSobre?: number;
  /** true: un cuadro por cada uno de los 6 de la hoja; false: un solo cuadro por vista (baja con el rebote de la cabeza). */
  animada: boolean;
  vistas: Vista[];
  frame(vista: Vista, cuadro: number): Capa;
  /** Capa de detrás del cuerpo (compañera de la principal). */
  atras?(vista: Vista, cuadro: number): Capa;
}

/** Contorno en anillo de una masa que cae detrás del cuerpo. */
export function anillo(relleno: Capa): Capa {
  const out: Capa = new Map(relleno);
  for (const k of relleno.keys()) {
    const x = k % ANCHO;
    for (const n of [k - ANCHO, k + ANCHO, k - 1, k + 1]) {
      if (n < 0 || (n === k - 1 && x === 0) || (n === k + 1 && x === ANCHO - 1)) continue;
      if (!relleno.has(n)) out.set(n, NEGRO);
    }
  }
  return out;
}

const ctx = (v: Vista, c: number): Ctx => ctxDe(v, c);
const sentado = (c: number): boolean => c === 5;
const filaTorsoFin = 56;

// ---------- mochila ----------
const mochila: PiezaDef = {
  id: 'acc-mochila', nombre: 'Mochila', capa: 'cuello', carpeta: 'otro', slots: ['accA', 'accB'], etiquetas: ['mochila', 'escuela', 'viaje'], animada: true, vistas: ['S', 'N', 'I'],
  frame(v, c) {
    const cx = ctx(v, c), p = new Pincel(cx), y0 = cx.y0Torso;
    if (v === 'S') {
      // tirantes sobre los hombros y el pecho, con hebilla
      for (const x of [12, 19]) { p.v(x, y0, y0 + 6, 'accB', 2); p.v(x + 1, y0, y0 + 6, 'accB', 1); p.s(x, y0 + 6, 'accB', 4); p.s(x + 1, y0 + 6, 'accB', 3); }
      return conSilueta(cx, p.m);
    }
    if (v === 'N') {
      // la mochila cubre la espalda: tapa, bolsillo y tirantes por los lados
      for (let y = y0 + 1; y <= (sentado(c) ? 56 : filaTorsoFin); y++) for (let x = 10; x <= 21; x++) {
        const borde = x === 10 || y === y0 + 1;
        p.s(x, y, 'accA', borde ? 3 : x >= 20 ? 1 : 2);
      }
      p.h(10, 21, y0 + 5, 'accA', 1); p.h(11, 20, y0 + 6, 'accA', 3);
      p.h(12, 19, y0 + 3, 'accB', 2); p.s(15, y0 + 4, 'accB', 4); p.s(16, y0 + 4, 'accB', 4);
      for (let y = y0 + 8; y <= y0 + 9; y++) for (let x = 12; x <= 19; x++) p.s(x, y, 'accA', y === y0 + 8 ? 3 : 1);
      for (const x of [8, 9, 22, 23]) p.v(x, y0, y0 + 5, 'accB', x === 8 || x === 22 ? 2 : 1);
      return conSilueta(cx, p.m);
    }
    for (const x of [13, 14]) { p.v(x, y0, y0 + 6, 'accB', x === 13 ? 2 : 1); }
    p.s(13, y0 + 6, 'accB', 4);
    return conSilueta(cx, p.m);
  },
  atras(v, c) {
    const cx = ctx(v, c), p = new Pincel(cx), y0 = cx.y0Torso;
    if (v === 'N') return new Map();
    const baja = sentado(c) ? 56 : filaTorsoFin;
    if (v === 'S') {
      for (let y = y0 + 1; y <= baja; y++) for (let x = 5; x <= 26; x++) p.s(x, y, 'accA', x <= 5 ? 3 : x >= 26 ? 1 : 2);
      p.h(5, 26, y0 + 1, 'accA', 3);
    } else {
      for (let y = y0 + 1; y <= baja; y++) for (let x = 19; x <= 25; x++) p.s(x, y, 'accA', x === 19 ? 3 : x >= 24 ? 1 : 2);
      p.h(19, 25, y0 + 1, 'accA', 3); p.h(20, 25, y0 + 5, 'accA', 1); p.h(20, 24, y0 + 7, 'accB', 2);
    }
    return anillo(p.m);
  },
};

// ---------- bufanda ----------
const bufanda: PiezaDef = {
  id: 'acc-bufanda', nombre: 'Bufanda', capa: 'cuello', carpeta: 'otro', slots: ['accA', 'accB'], etiquetas: ['bufanda', 'invierno', 'cuello'], animada: true, vistas: ['S', 'N', 'I'],
  frame(v, c) {
    const cx = ctx(v, c), p = new Pincel(cx), y0 = cx.y0Torso;
    const raya = (x: number, y: number): [Slot, number] => ((x + (v === 'I' ? y : 0)) % 4 < 2 ? ['accA', 2] : ['accB', 2]);
    const pon = (x: number, y: number, t = 0): void => { const [s, ton] = raya(x, y); p.s(x, y, s, ton + t); };
    p.porZona('N', (x, y) => { if (!(v === 'I' && y < y0)) pon(x, y, y === y0 ? 1 : 0); });
    if (v === 'S') {
      for (let x = 12; x <= 19; x++) pon(x, y0 + 1, 1);
      for (let x = 13; x <= 18; x++) pon(x, y0 + 2, -1);
      for (let y = y0 + 2; y <= y0 + 8; y++) for (const x of [19, 20]) pon(x, y, x === 19 ? 1 : -1);
      for (const x of [19, 20]) if ((x + y0) % 2 === 0) p.m.delete((y0 + 8) * ANCHO + x);
    } else if (v === 'N') {
      for (let x = 12; x <= 19; x++) pon(x, y0 + 1, 1);
      for (let x = 13; x <= 18; x++) pon(x, y0 + 2, -1);
      for (let y = y0 + 2; y <= y0 + 9; y++) for (const x of [14, 15]) pon(x, y, x === 14 ? 1 : -1);
    } else {
      p.porZona('C', (x, y) => pon(x, y, 1));
      for (let y = y0 + 1; y <= y0 + 8; y++) for (const x of [16, 17, 18]) pon(x, y, x === 16 ? 1 : -1);
    }
    return conSilueta(cx, p.m);
  },
};

// ---------- auriculares al cuello ----------
const auriculares: PiezaDef = {
  id: 'acc-auriculares-cuello', nombre: 'Auriculares al cuello', capa: 'cuello', carpeta: 'otro', slots: ['accA', 'accB'], etiquetas: ['auriculares', 'musica', 'cuello'], animada: true, vistas: ['S', 'N', 'I'],
  frame(v, c) {
    const cx = ctx(v, c), p = new Pincel(cx), y0 = cx.y0Torso;
    const copa = (x0: number, y: number): void => {
      for (let j = 0; j < 4; j++) for (let i = 0; i < 3; i++) p.s(x0 + i, y + j, 'accA', i === 0 ? 3 : i === 2 ? 1 : 2);
      p.v(x0 + 1, y + 1, y + 2, 'accB', 2);
      p.s(x0, y, 'accA', 4);
    };
    if (v === 'S' || v === 'N') {
      p.h(12, 19, y0, 'accA', 1); p.h(11, 20, y0 + 1, 'accA', 0);
      copa(9, y0); copa(20, y0);
    } else {
      p.h(17, 19, y0, 'accA', 1);
      copa(14, y0);
      p.s(19, y0 + 1, 'accA', 1);
    }
    return conSilueta(cx, p.m);
  },
};

// ---------- capa ----------
const hemOnda = (x: number, y: number, c: number): number => y + (((x + (c % 2) * 2) % 4 < 2) ? 0 : 1);
const capa: PiezaDef = {
  id: 'acc-capa', nombre: 'Capa', capa: 'cuello', carpeta: 'otro', slots: ['accA', 'accB'], etiquetas: ['capa', 'heroe', 'disfraz'], animada: true, vistas: ['S', 'N', 'I'],
  frame(v, c) {
    const cx = ctx(v, c), p = new Pincel(cx), y0 = cx.y0Torso;
    if (v === 'N') {
      const fin = sentado(c) ? 56 : 61;
      for (let y = y0; y <= fin; y++) {
        const ancho = Math.min(12, 7 + Math.floor((y - y0) / 3));
        for (let x = 16 - ancho; x <= 15 + ancho; x++) {
          if (y >= fin - 1 && y > hemOnda(x, fin - 1, c)) continue;
          const t = x <= 16 - ancho + 1 ? 3 : x >= 15 + ancho - 1 ? 1 : 2;
          p.s(x, y, 'accA', t);
        }
      }
      p.h(11, 20, y0, 'accB', 3); p.h(12, 19, y0 + 1, 'accB', 2);
      for (const x of [10, 13, 18, 21]) p.v(x, y0 + 4, fin - 1, 'accA', 1, true);
      return conSilueta(cx, p.m);
    }
    // de frente y de perfil la capa va detrás; delante solo el cuello con el broche
    if (v === 'S') {
      p.h(11, 20, y0, 'accA', 3); p.h(12, 19, y0 + 1, 'accA', 2);
      p.s(15, y0 + 1, 'accB', 4); p.s(16, y0 + 1, 'accB', 3); p.s(15, y0 + 2, 'accB', 2); p.s(16, y0 + 2, 'accB', 1);
    } else {
      p.porZona('N', (x, y) => p.s(x, y, 'accA', 3));
      p.s(14, y0 + 1, 'accB', 4); p.s(14, y0 + 2, 'accB', 2);
    }
    return conSilueta(cx, p.m);
  },
  atras(v, c) {
    const cx = ctx(v, c), p = new Pincel(cx), y0 = cx.y0Torso;
    if (v === 'N') return new Map();
    const fin = sentado(c) ? 57 : 61;
    if (v === 'S') {
      for (let y = y0; y <= fin; y++) {
        const ancho = Math.min(13, 9 + Math.floor((y - y0) / 3));
        for (let x = 16 - ancho; x <= 15 + ancho; x++) {
          if (y >= fin - 1 && y > hemOnda(x, fin - 1, c)) continue;
          p.s(x, y, 'accA', x <= 16 - ancho + 1 ? 3 : x >= 15 + ancho - 1 ? 1 : 2);
        }
      }
      for (const x of [5, 8, 23, 26]) p.v(x, y0 + 5, fin - 1, 'accA', 1, true);
    } else {
      for (let y = y0; y <= fin; y++) {
        const ancho = Math.min(9, 5 + Math.floor((y - y0) / 3));
        for (let x = 18; x <= 18 + ancho; x++) {
          if (y >= fin - 1 && y > hemOnda(x, fin - 1, c)) continue;
          p.s(x, y, 'accA', x <= 19 ? 3 : x >= 18 + ancho - 1 ? 1 : 2);
        }
      }
      for (const x of [21, 24]) p.v(x, y0 + 5, fin - 1, 'accA', 1, true);
    }
    return anillo(p.m);
  },
};

export const OTROS: PiezaDef[] = [mochila, bufanda, auriculares, capa];
