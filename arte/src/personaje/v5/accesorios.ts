/**
 * Piezas de cabeza del catálogo v5: Vello facial (4), Sombrero (4) y Gafas (4). Estáticas (un cuadro por vista; bajan con el rebote de la cabeza).
 * S frente, N espalda, I perfil izquierdo (el derecho es el espejo). Coordenadas del lienzo de 32 x 64: cabeza con contorno en las columnas 8 a 23
 * y las filas 29 a 46; ojos en las filas 41 a 43 (de frente: columnas 10 a 13 y 18 a 21; de perfil: columnas 11 a 14).
 */

import { ANCHO } from './datos-disenador';
import type { Capa } from './disenador';
import { el, po, pintarPelo, tr } from './pelo';
import type { Forma } from './pelo';
import { Pincel, conSilueta, ctxDe, mk } from './vestir';
import type { Ctx, Slot } from './vestir';
import type { Vista } from './pose';

export interface DefAccesorio {
  id: string;
  nombre: string;
  capa: 'barba' | 'cabeza' | 'cara';
  carpeta?: 'sombrero' | 'gafas';
  slots: Slot[];
  etiquetas: string[];
  /** Vistas que trae (la espalda de unas gafas o de un bigote no existe). */
  vistas: Vista[];
  /** Los sombreros: el peinado no se ve por encima de esta fila. */
  ocultaPeloSobre?: number;
  dibujar(vista: Vista): Capa;
}

const rampa = (slot: Slot): readonly string[] => [0, 1, 2, 3, 4].map((t) => mk(slot, t));

/** Pinta formas con una rampa de marcadores y cierra la silueta contra el cuerpo (cuadro 0). */
function volumen(vista: Vista, formas: Forma[], slot: Slot, semilla = 5, opciones: { sinSilueta?: boolean; baseIdx?: number } = {}): Capa {
  const relleno = pintarPelo(formas, rampa(slot), { semilla, baseIdx: opciones.baseIdx ?? 3 });
  return opciones.sinSilueta ? relleno : conSilueta(ctxDe(vista, 0), relleno);
}

// ---------------------------------------------------------------------------
// GAFAS
// ---------------------------------------------------------------------------

/** Ojo izquierdo y derecho de frente (centros de los lentes) y de perfil. */
const OJOS_S: readonly [number, number][] = [[12, 42], [20, 42]];
const OJO_I: readonly [number, number] = [13, 42];

type Lente = (p: Pincel, cx: number, cy: number, perfil: boolean) => void;

function gafas(id: string, nombre: string, etiquetas: string[], lente: Lente, puente: (p: Pincel) => void): DefAccesorio {
  return {
    id, nombre, capa: 'cara', carpeta: 'gafas', slots: ['accA', 'accB'], etiquetas, vistas: ['S', 'I'],
    dibujar(vista) {
      const p = new Pincel(ctxDe(vista, 0));
      if (vista === 'S') {
        for (const [cx, cy] of OJOS_S) lente(p, cx, cy, false);
        puente(p);
        // patillas hacia las orejas
        p.s(9, 41, 'accA', 1); p.s(8, 41, 'accA', 1); p.s(23, 41, 'accA', 1); p.s(24, 41, 'accA', 1);
      } else {
        lente(p, OJO_I[0], OJO_I[1], true);
        // patilla hacia la oreja
        for (let x = 17; x <= 21; x++) p.s(x, 41, 'accA', 1);
      }
      return p.m;
    },
  };
}

const aroRedondo: Lente = (p, cx, cy) => {
  // anillo de 6 x 5 con las esquinas cortadas
  p.h(cx - 1, cx + 2, cy - 2, 'accA', 2);
  p.h(cx - 1, cx + 2, cy + 2, 'accA', 1);
  p.v(cx - 2, cy - 1, cy + 1, 'accA', 2);
  p.v(cx + 3, cy - 1, cy + 1, 'accA', 1);
  p.s(cx - 1, cy - 2, 'accA', 3);
};
const aroCuadrado: Lente = (p, cx, cy) => {
  p.h(cx - 2, cx + 3, cy - 2, 'accA', 2);
  p.h(cx - 2, cx + 3, cy + 2, 'accA', 1);
  p.v(cx - 2, cy - 1, cy + 1, 'accA', 2);
  p.v(cx + 3, cy - 1, cy + 1, 'accA', 1);
  p.s(cx - 2, cy - 2, 'accA', 3);
};
const lenteSol: Lente = (p, cx, cy) => {
  // lente oscuro lleno con un brillo
  for (let y = cy - 2; y <= cy + 1; y++) for (let x = cx - 2; x <= cx + 3; x++) p.s(x, y, 'accB', y === cy - 2 ? 1 : 0);
  p.h(cx - 2, cx + 3, cy - 2, 'accA', 2);
  p.h(cx - 2, cx + 3, cy + 2, 'accA', 1);
  p.v(cx - 3, cy - 2, cy + 2, 'accA', 2);
  p.v(cx + 4, cy - 2, cy + 2, 'accA', 1);
  p.s(cx - 1, cy - 1, 'accB', 3); p.s(cx, cy - 1, 'accB', 2);
};
const sinMarco: Lente = (p, cx, cy) => {
  // sin aro: solo las esquinas del lente y un destello
  p.s(cx - 2, cy - 2, 'accA', 4); p.s(cx + 3, cy - 2, 'accA', 4);
  p.s(cx - 2, cy + 2, 'accA', 3); p.s(cx + 3, cy + 2, 'accA', 3);
  p.s(cx - 1, cy - 2, 'accA', 4); p.s(cx + 2, cy + 2, 'accA', 3);
};
const puenteSimple = (p: Pincel): void => { p.s(14, 41, 'accA', 2); p.s(15, 41, 'accA', 2); p.s(16, 41, 'accA', 2); p.s(17, 41, 'accA', 2); };
const puenteSol = (p: Pincel): void => { p.h(14, 17, 40, 'accA', 2); p.h(14, 17, 41, 'accA', 1); };
const puenteFino = (p: Pincel): void => { p.s(15, 41, 'accA', 4); p.s(16, 41, 'accA', 4); };

export const GAFAS: DefAccesorio[] = [
  gafas('acc-gafas-redondas', 'Gafas redondas', ['gafas', 'redondas'], aroRedondo, puenteSimple),
  gafas('acc-gafas-cuadradas', 'Gafas cuadradas', ['gafas', 'cuadradas', 'montura'], aroCuadrado, puenteSimple),
  gafas('acc-gafas-sol', 'Gafas de sol', ['gafas', 'sol', 'oscuras'], lenteSol, puenteSol),
  gafas('acc-gafas-sin-marco', 'Gafas sin marco', ['gafas', 'ligeras', 'sin marco'], sinMarco, puenteFino),
];

// ---------------------------------------------------------------------------
// SOMBREROS
// ---------------------------------------------------------------------------

function sombrero(id: string, nombre: string, etiquetas: string[], ocultaPeloSobre: number | undefined, f: (v: Vista) => Capa): DefAccesorio {
  return { id, nombre, capa: 'cabeza', carpeta: 'sombrero', slots: ['accA', 'accB'], etiquetas, vistas: ['S', 'N', 'I'], ...(ocultaPeloSobre === undefined ? {} : { ocultaPeloSobre }), dibujar: f };
}

const unir = (...cs: Capa[]): Capa => { const o: Capa = new Map(); for (const c of cs) for (const [k, v] of c) o.set(k, v); return o; };

const gorra = sombrero('acc-gorra', 'Gorra', ['gorra', 'deportivo'], 36, (v) => {
  if (v === 'S') {
    const cuerpo = volumen('S', [el(16, 32.2, 9.7, 5.4, { brillo: 0.6 }), po([[7, 34], [25, 34], [24.6, 36.4], [7.4, 36.4]], { brillo: 0.5 })], 'accA', 5);
    const visera = new Pincel(ctxDe('S', 0));
    visera.h(9, 23, 36, 'accA', 1); visera.h(10, 22, 37, 'accA', 0); visera.h(9, 23, 35, 'accA', 2);
    visera.s(16, 26, 'accB', 3); visera.s(15, 26, 'accB', 2); visera.s(16, 27, 'accB', 2);
    return conSilueta(ctxDe('S', 0), unir(cuerpo, visera.m));
  }
  if (v === 'N') {
    const cuerpo = volumen('N', [el(16, 32.4, 9.8, 5.6, { brillo: 0.6 }), po([[7, 34], [25, 34], [24.6, 36.4], [7.4, 36.4]], { brillo: 0.4 })], 'accA', 5, { sinSilueta: true });
    const p = new Pincel(ctxDe('N', 0));
    p.h(12, 19, 36, 'accB', 1); p.h(13, 18, 37, 'accB', 0);
    p.s(16, 26, 'accB', 3);
    return conSilueta(ctxDe('N', 0), unir(cuerpo, p.m));
  }
  const cuerpo = volumen('I', [el(15, 32.4, 9.7, 5.4, { brillo: 0.6 }), po([[7, 34.6], [24, 34], [24.4, 36.4], [8, 36.4]], { brillo: 0.5 })], 'accA', 5, { sinSilueta: true });
  const p = new Pincel(ctxDe('I', 0));
  p.h(3, 10, 36, 'accA', 1); p.h(4, 9, 37, 'accA', 0); p.h(4, 8, 35, 'accA', 2); p.h(5, 11, 36, 'accA', 1);
  p.s(14, 26, 'accB', 3); p.s(15, 26, 'accB', 2);
  return conSilueta(ctxDe('I', 0), unir(cuerpo, p.m));
});

const gorro = sombrero('acc-gorro-lana', 'Gorro de lana', ['gorro', 'lana', 'invierno'], 38, (v) => {
  const cx = v === 'I' ? 15 : 16;
  const dome = volumen(v, [el(cx, 31.8, 10.4, 6.2, { brillo: 0.6 })], 'accA', 6, { sinSilueta: true });
  const p = new Pincel(ctxDe(v, 0));
  const x0 = v === 'I' ? 5 : 6, x1 = v === 'I' ? 24 : 25;
  // doblez con costillas y borla
  for (let y = 35; y <= 38; y++) for (let x = x0 + (y === 38 ? 1 : 0); x <= x1 - (y === 38 ? 1 : 0); x++) p.s(x, y, 'accB', (x + y) % 2 === 0 ? 2 : 1);
  p.h(x0, x1, 35, 'accB', 3);
  const borla = volumen(v, [el(cx, 25, 2.7, 2.6, { rizo: true, brillo: 0.7 })], 'accB', 8, { sinSilueta: true });
  return conSilueta(ctxDe(v, 0), unir(dome, p.m, borla));
});

const boina = sombrero('acc-boina', 'Boina', ['boina', 'artista'], 33, (v) => {
  const ox = v === 'I' ? -0.6 : 0.8;
  const disco = volumen(v, [el(15.4 + ox, 31.2, 10.6, 4.6, { brillo: 0.6 }), el(13.6 + ox, 32.4, 8.4, 3.8, { brillo: 0.4 })], 'accA', 7, { sinSilueta: true });
  const p = new Pincel(ctxDe(v, 0));
  p.s(Math.round(15.4 + ox), 26, 'accB', 2); p.s(Math.round(15.4 + ox), 27, 'accB', 1); p.s(Math.round(16.4 + ox), 26, 'accB', 3);
  return conSilueta(ctxDe(v, 0), unir(disco, p.m));
});

const audifonos = sombrero('acc-audifonos', 'Audífonos', ['audifonos', 'musica'], undefined, (v) => {
  const p = new Pincel(ctxDe(v, 0));
  const arco = (cx: number, cy: number, r: number, a0: number, a1: number, grosor = 2): void => {
    for (let a = a0; a <= a1; a += 0.01) {
      const x = Math.round(cx + Math.cos(a) * r), y = Math.round(cy - Math.sin(a) * r);
      for (let g = 0; g < grosor; g++) p.s(x, y - g, 'accA', g === 0 ? 1 : 3);
    }
  };
  if (v === 'S' || v === 'N') {
    arco(16, 38, 10.2, 0.05, Math.PI - 0.05);
    for (const cx of [7, 24]) {
      for (let y = 39; y <= 44; y++) for (let x = cx - 1; x <= cx + 1; x++) p.s(x, y, 'accA', x === cx - 1 ? 3 : 2);
      p.v(cx + (cx < 16 ? 0 : 0), 40, 43, 'accB', 2);
      p.h(cx - 1, cx + 1, 39, 'accA', 3);
    }
    return conSilueta(ctxDe(v, 0), p.m);
  }
  arco(15, 37, 9.6, 0.4, 2.6);
  for (let y = 38; y <= 44; y++) for (let x = 19; x <= 22; x++) p.s(x, y, 'accA', x === 19 ? 3 : x === 22 ? 1 : 2);
  p.v(21, 40, 43, 'accB', 2);
  return conSilueta(ctxDe(v, 0), p.m);
});

export const SOMBREROS: DefAccesorio[] = [gorra, gorro, boina, audifonos];

// ---------------------------------------------------------------------------
// VELLO FACIAL (slot cabello)
// ---------------------------------------------------------------------------

function vello(id: string, nombre: string, etiquetas: string[], f: (vista: Vista) => Forma[]): DefAccesorio {
  return {
    id, nombre, capa: 'barba', slots: ['cabello'], etiquetas, vistas: ['S', 'I'],
    dibujar(vista) {
      const ctx = ctxDe(vista, 0);
      const relleno = pintarPelo(f(vista), rampa('cabello'), { semilla: id.length });
      return conSilueta(ctx, relleno);
    },
  };
}

export const VELLOS: DefAccesorio[] = [
  vello('barba-bigote-clasico', 'Bigote', ['bigote'], (v) => (v === 'S'
    ? [po([[12.4, 44], [15, 43.3], [17, 43.3], [19.6, 44], [19, 45.2], [17, 44.6], [15, 44.6], [13, 45.2]], { tono: 2, liso: false })]
    : [po([[9, 43], [13.6, 42.8], [15.4, 44.6], [13.4, 45.8], [9.8, 45.6]], { tono: 2, liso: true })])),
  vello('barba-perilla', 'Perilla', ['perilla', 'chivo'], (v) => (v === 'S'
    ? [po([[14, 44.6], [18, 44.6], [17.6, 46.6], [16, 47.4], [14.4, 46.6]], { tono: 2 }), tr([[16, 44.6], [16, 45.6]], 1.6, { tono: 3, liso: true, punta: false })]
    : [po([[9.6, 44.6], [12, 44.8], [12.4, 46.4], [10.4, 47], [9.4, 46]], { tono: 2 })])),
  vello('barba-corta', 'Barba corta', ['barba', 'corta'], (v) => (v === 'S'
    ? [po([[8.6, 40], [9.8, 40], [10.6, 43], [12.6, 44.6], [19.4, 44.6], [21.4, 43], [22.2, 40], [23.4, 40], [23.4, 44], [21, 46.4], [16, 47], [11, 46.4], [8.6, 44]], { tono: 1, brillo: 0.15 })]
    : [po([[17, 40], [20, 40], [20.4, 43.6], [18, 46], [14, 46.6], [10, 46.2], [9.2, 45], [12, 44.6], [14.4, 43.4], [16.6, 42]], { tono: 1, brillo: 0.15 })])),
  vello('barba-completa', 'Barba completa', ['barba', 'completa', 'larga'], (v) => (v === 'S'
    ? [po([[8.2, 39], [10, 39], [10.8, 42.4], [12.4, 43.4], [15, 43.6], [17, 43.6], [19.6, 43.4], [21.2, 42.4], [22, 39], [23.8, 39], [24, 44.6], [22.4, 48], [19, 50.4], [16, 51], [13, 50.4], [9.6, 48], [8, 44.6]], { tono: 2, brillo: 0.3 }), tr([[13, 47], [14.4, 49.6]], 1.6, { tono: 1, punta: false })]
    : [po([[15, 38.6], [19.8, 38.6], [20.6, 44], [19, 48], [15, 50], [11, 49.4], [8.6, 47], [9, 44.8], [11.8, 44.4], [14, 42.8]], { tono: 2, brillo: 0.3 })])),
];

void ANCHO;
