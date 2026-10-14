/**
 * Los 6 peinados de la propuesta v5, definidos como formas para `pintarPelo` (atrás = detrás del cuerpo, frente = encima de la cabeza)
 * en las 3 vistas que se dibujan: S frente, N espalda e I perfil izquierdo (mira a la izquierda). El perfil derecho es el espejo del
 * izquierdo. Coordenadas del lienzo de 32 x 64 (cabeza: contorno en las columnas 8..23, filas 29..45; ojos en las filas 41..43).
 *
 *   1  despeinado oscuro de lado (el del diseñador; de frente se usa el sprite exacto, N e I se derivan de su construcción)
 *   2  flequillo largo recto con media melena
 *   3  rizado corto
 *   4  afro
 *   5  melena larga suelta con puntas
 *   6  moño alto con mechones sueltos
 */

import { el, po, tr, pintarPelo, rampaPelo, PELO_DISENADOR } from './pelo';
import type { Forma } from './pelo';
import type { Capa } from './disenador';

export type VistaPelo = 'S' | 'N' | 'I';
export interface Peinado {
  id: string;
  nombre: string;
  /** Color base de cabello (el 1 usa los 5 tonos del diseñador). */
  color: string;
  rampa: readonly string[];
  /** Formas por vista: `atras` va debajo del cuerpo; `frente` encima. */
  vistas: Record<VistaPelo, { atras: Forma[]; frente: Forma[] }>;
}

// ---------- utilidades ----------
/** Corona de rizos: reparte círculos con desfase en un polígono (centro dentro), de arriba hacia abajo. */
function rizos(poligono: [number, number][], paso: number, radio: number, semilla: number, excluir: (x: number, y: number) => boolean = () => false): Forma[] {
  const xs = poligono.map((p) => p[0]), ys = poligono.map((p) => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const dentro = (px: number, py: number): boolean => {
    let d = false;
    for (let i = 0, j = poligono.length - 1; i < poligono.length; j = i++) {
      const [xi, yi] = poligono[i]!, [xj, yj] = poligono[j]!;
      if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) d = !d;
    }
    return d;
  };
  const out: Forma[] = [];
  let fila = 0;
  for (let y = y0; y <= y1; y += paso * 0.86, fila++) {
    for (let x = x0 + (fila % 2 === 0 ? 0 : paso / 2); x <= x1; x += paso) {
      const j1 = Math.sin((x * 12.9898 + y * 78.233 + semilla) * 43758.5453) * 0.5;
      const j2 = Math.sin((x * 39.346 + y * 11.135 + semilla) * 24634.6345) * 0.5;
      const cx = x + (j1 - Math.floor(j1) - 0.5) * 1.2, cy = y + (j2 - Math.floor(j2) - 0.5) * 1.0;
      if (dentro(cx, cy) && !excluir(cx, cy)) out.push(el(cx, cy, radio, radio * 0.92, { rizo: true, brillo: 0.6 }));
    }
  }
  return out;
}

const ES = (c: string): readonly string[] => rampaPelo(c);

// ---------- 1. despeinado oscuro de lado ----------
const P1: Peinado = {
  id: 'p1', nombre: 'despeinado oscuro de lado', color: '#453E50', rampa: PELO_DISENADOR,
  vistas: {
    S: { atras: [], frente: [] }, // exacto del diseñador
    N: {
      atras: [],
      frente: [
        po([[8.5, 38], [7.6, 33.5], [9.5, 30.2], [13, 28.2], [18, 27.4], [22, 28.3], [24.5, 31], [25.3, 35], [24.6, 40], [23.4, 44], [20, 44.6], [16, 43.4], [12.4, 44.6], [9, 43]], { brillo: 0.5 }),
        tr([[17, 30], [20, 28.3], [23.5, 29.6]], [4, 5, 3], { brillo: 0.6 }),
        tr([[10, 38], [10, 42], [10.6, 45.4]], [3, 2.4, 1.2]),
        tr([[14, 39], [13.8, 43], [14.6, 46]], [3, 2.4, 1.2], { tono: 2 }),
        tr([[18.5, 39], [19, 43], [18.4, 46]], [3, 2.4, 1.2]),
        tr([[22.5, 38], [22.3, 42], [21.6, 45]], [3, 2.4, 1.2], { tono: 2 }),
      ],
    },
    I: {
      atras: [],
      frente: [
        po([[9.5, 38.5], [8.4, 34], [9.4, 31], [12, 28.8], [16.5, 27.8], [20.6, 28.6], [23.4, 31.4], [24.4, 36], [23.8, 41], [22.4, 44.2], [19.5, 44.4], [18.5, 40.5], [16, 38], [13, 37.4], [10.6, 38.6]], { brillo: 0.5 }),
        tr([[14, 29.5], [18, 27.6], [21.5, 28.4]], [4, 5, 3], { brillo: 0.6 }),
        tr([[13, 33], [10.5, 36.5], [8.8, 40]], [3.4, 2.6, 1.2]),
        tr([[17, 34], [14.6, 37.6], [12.6, 40.4]], [3.2, 2.4, 1.2], { tono: 2 }),
        tr([[20.5, 36], [19.6, 40], [19, 44]], [3, 2.4, 1.2]),
        tr([[20, 31], [23.4, 29.2], [26.2, 30.4]], [3, 2.6, 1.2]),
        tr([[12, 33.6], [9.4, 35], [7.2, 37.6]], [2.8, 2.2, 1.2], { tono: 2 }),
      ],
    },
  },
};

// ---------- 2. flequillo largo con media melena ----------
const C2 = '#E9B85F';
const P2: Peinado = {
  id: 'p2', nombre: 'flequillo largo recto', color: C2, rampa: ES(C2),
  vistas: {
    S: {
      atras: [el(15.5, 38.5, 11.3, 9.8, { brillo: 0.35 }), tr([[5.5, 40], [5.8, 44], [6.6, 47.5]], [3, 2.6, 1.2]), tr([[25.5, 40], [25.2, 44], [24.4, 47.5]], [3, 2.6, 1.2], { tono: 2 })],
      frente: [
        el(15.5, 33, 9.6, 6.7, { brillo: 0.55 }),
        po([[8.4, 33], [22.6, 33], [23.2, 40.4], [21.8, 40.9], [20.4, 40], [18.8, 40.8], [17.2, 40.1], [15.6, 40.9], [14, 40.1], [12.4, 40.8], [10.8, 40], [9.2, 40.6]], { brillo: 0.5 }),
        tr([[9.2, 34], [9, 40], [9.2, 46]], [3, 2.8, 1.2]),
        tr([[22, 34], [22.2, 40], [22, 46]], [3, 2.8, 1.2], { tono: 2 }),
      ],
    },
    N: {
      atras: [],
      frente: [
        po([[7.6, 38], [7, 33], [9, 29.6], [13, 27.8], [18, 27.4], [22.5, 28.6], [25, 32], [25.6, 38], [25.2, 44], [24, 47.2], [21.5, 46.2], [19, 47.4], [16.5, 46.3], [14, 47.4], [11.5, 46.3], [9, 47.3], [7.4, 44]], { brillo: 0.5 }),
        tr([[10, 33], [9.4, 40], [9.6, 46]], [3, 2.6, 1.2]),
        tr([[15.5, 31], [15.6, 39], [15.8, 46]], [3, 2.6, 1.2], { tono: 2 }),
        tr([[21, 33], [21.6, 40], [21.4, 46]], [3, 2.6, 1.2]),
      ],
    },
    I: {
      atras: [el(19.5, 39, 6.5, 8.6, { brillo: 0.35 }), tr([[17, 42], [18.5, 45], [19.5, 47.5]], [3, 2.6, 1.2])],
      frente: [
        el(16.5, 33.8, 8.4, 6, { brillo: 0.55 }),
        po([[8.6, 34], [20, 33], [21, 38], [19.5, 38.6], [18, 37.8], [16, 40.2], [14, 39.6], [12.4, 40.8], [10.6, 40], [9.3, 40.6], [8.6, 38]], { brillo: 0.5 }),
        tr([[18.6, 34], [19.2, 40], [19.4, 46]], [3.6, 3, 1.2]),
        tr([[22, 35], [22.6, 40], [22.2, 45]], [3, 2.6, 1.2], { tono: 2 }),
      ],
    },
  },
};

// ---------- 3. rizado corto ----------
const C3 = '#5A3B28';
const P3: Peinado = {
  id: 'p3', nombre: 'rizado corto', color: C3, rampa: ES(C3),
  vistas: {
    S: {
      atras: [],
      frente: [
        el(15.5, 32.5, 9.6, 5, { brillo: 0.3 }),
        ...rizos([[7.4, 38], [6.8, 33.5], [8.6, 29.6], [12, 26.8], [17, 26.2], [21.6, 27.6], [24.6, 31], [25.6, 36], [24.8, 39.6], [22.6, 37.6], [19, 35], [16, 35.8], [12.6, 35], [9.2, 37.4]], 4.2, 3.0, 3, (x, y) => y > 36.5 && x > 11.2 && x < 20.4),
      ],
    },
    N: {
      atras: [],
      frente: [
        el(15.5, 35, 9.8, 8.5, { brillo: 0.3 }),
        ...rizos([[7, 40], [6.6, 33.5], [8.6, 29.4], [12, 26.8], [17, 26.2], [21.8, 27.6], [24.8, 31], [25.8, 36], [25.2, 41.6], [22.5, 44.6], [16, 45.4], [10, 44.6]], 4.2, 3.0, 5),
      ],
    },
    I: {
      atras: [],
      frente: [
        el(17, 33, 8.8, 6.3, { brillo: 0.3 }),
        ...rizos([[9, 38.5], [8.4, 33.5], [10, 29.8], [13.4, 27], [18, 26.4], [22.4, 28], [25, 31.6], [25.6, 36.6], [24.6, 41.6], [22, 43.6], [19.6, 39], [17, 36.6], [14, 36.4], [11, 37.4]], 4.2, 3.0, 7),
      ],
    },
  },
};

// ---------- 4. afro ----------
const C4 = '#2E2A33';
const afroS = (cx: number, cy: number, rx: number, ry: number, semilla: number, excluir: (x: number, y: number) => boolean): Forma[] => {
  const pts: [number, number][] = [];
  for (let i = 0; i < 28; i++) { const a = (i / 28) * Math.PI * 2; pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); }
  return rizos(pts, 4.5, 3.3, semilla, excluir);
};
const P4: Peinado = {
  id: 'p4', nombre: 'afro', color: C4, rampa: ES(C4),
  vistas: {
    S: {
      atras: [el(15.5, 34, 12.4, 10.2, { brillo: 0.2 })],
      frente: [...afroS(15.5, 33.2, 12.6, 10.4, 11, (x, y) => y > 36.8 && x > 9.8 && x < 22.2)],
    },
    N: { atras: [], frente: [el(15.5, 34, 12, 10.8, { brillo: 0.2 }), ...afroS(15.5, 33.6, 12.8, 11.4, 13, () => false)] },
    I: {
      atras: [el(17.5, 34, 11, 10.2, { brillo: 0.2 })],
      frente: [...afroS(17.2, 33.4, 11.8, 10.4, 17, (x, y) => y > 36.8 && x < 14.4)],
    },
  },
};

// ---------- 5. melena larga suelta con puntas ----------
const C5 = '#933B29';
const P5: Peinado = {
  id: 'p5', nombre: 'melena larga suelta', color: C5, rampa: ES(C5),
  vistas: {
    S: {
      atras: [
        po([[7, 36], [5.4, 42], [4.8, 48], [5.6, 54], [7.6, 52.4], [9, 55.4], [10.4, 50], [10.4, 38]], { brillo: 0.35 }),
        po([[24, 36], [26.6, 42], [27.2, 48], [26.4, 54], [24.4, 52.4], [23, 55.4], [21.6, 50], [21.6, 38]], { brillo: 0.35 }),
      ],
      frente: [
        el(15.5, 33, 9.8, 6.8, { brillo: 0.55 }),
        tr([[9, 33], [8.2, 40], [8.4, 47], [8.8, 53]], [3.8, 3.4, 3, 1.4]),
        tr([[22, 33], [22.8, 40], [22.6, 47], [22.2, 53]], [3.8, 3.4, 3, 1.4], { tono: 2 }),
        tr([[13, 31], [11, 35], [9.6, 40]], [3.6, 3, 1.2]),
        tr([[18, 31], [20.6, 35], [22.4, 40]], [3.6, 3, 1.2], { tono: 2 }),
        tr([[7.2, 38], [6.6, 44], [7, 50]], [2.6, 2.4, 1.2]),
        tr([[24, 38], [24.6, 44], [24.2, 50]], [2.6, 2.4, 1.2], { tono: 2 }),
      ],
    },
    N: {
      atras: [],
      frente: [
        po([[7.6, 38], [7, 33], [9, 29.6], [13, 27.8], [18, 27.4], [22.5, 28.6], [25, 32], [25.6, 38], [26.4, 46], [26, 53], [24.2, 55.6], [22.2, 53], [20, 56], [18, 53], [15.6, 56.2], [13.4, 53], [11, 55.8], [9, 53], [6.8, 55], [6.6, 46]], { brillo: 0.45 }),
        tr([[11, 34], [9.6, 44], [9, 54]], [3.4, 3, 1.4]),
        tr([[15.5, 32], [15.2, 44], [15, 55]], [3.4, 3, 1.4], { tono: 2 }),
        tr([[21, 34], [22, 44], [22.4, 54]], [3.4, 3, 1.4]),
      ],
    },
    I: {
      atras: [po([[16, 36], [20, 33], [25.4, 38], [26.2, 46], [25.6, 54], [23.4, 52], [21.4, 55.6], [19.4, 51], [17, 44]], { brillo: 0.35 })],
      frente: [
        el(16.8, 33, 8.6, 6.8, { brillo: 0.55 }),
        tr([[12, 31], [10.4, 35], [9, 39.6]], [3.6, 3, 1.2]),
        tr([[18.4, 34], [19, 42], [19.4, 49], [19, 54]], [4, 3.6, 3, 1.4]),
        tr([[22.4, 36], [23.4, 44], [23.2, 51]], [3, 2.8, 1.2], { tono: 2 }),
        tr([[11, 46.5], [10.2, 49.5], [10.6, 53]], [2.8, 2.6, 1.4]),
      ],
    },
  },
};

// ---------- 6. moño alto con mechones ----------
const C6 = '#9869B1';
const P6: Peinado = {
  id: 'p6', nombre: 'moño alto con mechones', color: C6, rampa: ES(C6),
  vistas: {
    S: {
      atras: [],
      frente: [
        el(15.5, 33.6, 8.9, 6, { brillo: 0.5, liso: false }),
        po([[8, 38], [7.4, 33.4], [9.6, 29.8], [13, 28.2], [18, 28.2], [21.8, 29.8], [24, 33.4], [23.6, 38], [22.4, 36.6], [20, 35.4], [15.6, 35.8], [11, 35.4], [9, 36.8]], { brillo: 0.5 }),
        tr([[15.5, 32], [15.5, 29], [15.5, 26.5]], [4, 3.4, 3]),
        el(15.5, 25.4, 4.6, 4.1, { rizo: true, brillo: 0.7 }),
        tr([[9.4, 35.5], [8.6, 41], [8.8, 47]], [2.8, 2.4, 1.2]),
        tr([[22.6, 35.5], [23.4, 41], [23.2, 46]], [2.8, 2.4, 1.2], { tono: 2 }),
      ],
    },
    N: {
      atras: [],
      frente: [
        el(15.5, 34.4, 9.6, 8, { brillo: 0.5 }),
        po([[7.6, 40], [7, 33.4], [9.4, 29.6], [13, 28], [18, 28], [22, 29.6], [24.6, 33.4], [24.2, 40], [22.4, 43.8], [15.8, 44.6], [10, 43.6]], { brillo: 0.5 }),
        tr([[10, 38], [12, 33], [14.4, 29.6]], [3, 2.6, 2]),
        tr([[21, 38], [19, 33], [16.6, 29.6]], [3, 2.6, 2], { tono: 2 }),
        tr([[15.5, 43], [15.5, 38], [15.5, 30]], [3, 3, 2.6]),
        el(15.5, 25.4, 4.6, 4.1, { rizo: true, brillo: 0.7 }),
        tr([[10.6, 41], [10.4, 44], [11, 46]], [2.4, 2, 1.2]),
        tr([[20.6, 41], [20.8, 44], [20.2, 46]], [2.4, 2, 1.2], { tono: 2 }),
      ],
    },
    I: {
      atras: [],
      frente: [
        el(17, 33.4, 8.4, 6, { brillo: 0.5 }),
        po([[9.2, 38], [8.4, 33.4], [10.4, 29.8], [14, 28.2], [19, 28.2], [22.6, 30.4], [24.6, 34.4], [24.2, 41], [22.4, 44], [20, 40], [17.6, 36.4], [13.6, 35.6], [10.6, 36.6]], { brillo: 0.5 }),
        tr([[12, 32], [16, 29], [19.4, 26.8]], [3.4, 3, 2.6]),
        el(19.2, 25.2, 4.5, 4, { rizo: true, brillo: 0.7 }),
        tr([[17.2, 36.5], [16.4, 41.5], [16.8, 47]], [2.8, 2.4, 1.2]),
      ],
    },
  },
};

export const PEINADOS: Peinado[] = [P1, P2, P3, P4, P5, P6];

/** Pinta un peinado en una vista: devuelve capas `atras` y `frente` (sin contorno). */
export function pintarPeinado(p: Peinado, vista: VistaPelo, semilla = 1): { atras: Capa; frente: Capa } {
  const v = p.vistas[vista];
  return { atras: pintarPelo(v.atras, p.rampa, { semilla }), frente: pintarPelo(v.frente, p.rampa, { semilla: semilla + 3 }) };
}
