/**
 * Motor de dibujo de las mascotas: una rejilla de 24 x 24 con formas rellenas que se sombrean solas
 * (luz arriba a la izquierda) y llevan contorno casi negro de 1 px en su borde.
 * Los colores son marcadores (`accA` y `accB`, 5 tonos) o colores fijos de la paleta (ojos, picos, rubor).
 */

import { colorMarcador } from '../nucleo';
import type { Slot } from '../nucleo';

export const L = 24;
export const TINTA = '#0A0A0A';
export const BLANCO = '#FFFFFF';
export const ROSA = '#F4A09C';
export const ROSA_OSC = '#E8636A';
export const NARANJA = '#E88A3A';
export const NARANJA_OSC = '#C96A28';
export const NARANJA_PROF = '#9A4A1C';

export type Cel = string | null;
export type SlotMascota = 'accA' | 'accB';

export const mat = (slot: SlotMascota, tono: number): string => colorMarcador(slot as Slot, Math.max(0, Math.min(4, Math.round(tono))));

export interface Forma {
  dentro(x: number, y: number): boolean;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

export const elipse = (cx: number, cy: number, rx: number, ry: number): Forma => ({ cx, cy, rx, ry, dentro: (x, y) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1 });

export function poligono(pts: ReadonlyArray<readonly [number, number]>): Forma {
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const x0 = Math.min(...xs);
  const x1 = Math.max(...xs);
  const y0 = Math.min(...ys);
  const y1 = Math.max(...ys);
  return {
    cx: (x0 + x1) / 2,
    cy: (y0 + y1) / 2,
    rx: Math.max(1, (x1 - x0) / 2),
    ry: Math.max(1, (y1 - y0) / 2),
    dentro: (x, y) => {
      let d = false;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const [xi, yi] = pts[i] as readonly [number, number];
        const [xj, yj] = pts[j] as readonly [number, number];
        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) d = !d;
      }
      return d;
    },
  };
}

export const rectangulo = (x0: number, y0: number, x1: number, y1: number): Forma => ({ cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, rx: (x1 - x0 + 1) / 2, ry: (y1 - y0 + 1) / 2, dentro: (x, y) => x >= x0 && x <= x1 && y >= y0 && y <= y1 });

export function union(...fs: Forma[]): Forma {
  const x0 = Math.min(...fs.map((f) => f.cx - f.rx));
  const x1 = Math.max(...fs.map((f) => f.cx + f.rx));
  const y0 = Math.min(...fs.map((f) => f.cy - f.ry));
  const y1 = Math.max(...fs.map((f) => f.cy + f.ry));
  return { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, rx: (x1 - x0) / 2, ry: (y1 - y0) / 2, dentro: (x, y) => fs.some((f) => f.dentro(x, y)) };
}

export const inter = (a: Forma, b: Forma): Forma => ({ cx: b.cx, cy: b.cy, rx: b.rx, ry: b.ry, dentro: (x, y) => a.dentro(x, y) && b.dentro(x, y) });
export const resta = (a: Forma, b: Forma): Forma => ({ ...a, dentro: (x, y) => a.dentro(x, y) && !b.dentro(x, y) });

/** Una cadena de círculos (colas, orejas caídas): `pts` con el radio de cada uno o uno solo para todos. */
export function cadena(pts: ReadonlyArray<readonly [number, number]>, r: number | readonly number[]): Forma {
  const fs: Forma[] = [];
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i] as readonly [number, number];
    const rr = typeof r === 'number' ? r : (r[i] ?? r[r.length - 1] ?? 1);
    fs.push(elipse(p[0], p[1], rr, rr));
    const q = pts[i + 1];
    if (q) {
      const rq = typeof r === 'number' ? r : (r[i + 1] ?? rr);
      for (const t of [0.33, 0.66]) fs.push(elipse(p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, rr + (rq - rr) * t, rr + (rq - rr) * t));
    }
  }
  return union(...fs);
}

export interface OpcionesLlenar {
  /** Cambia el tono base (2): -1 más oscuro, +1 más claro. */
  tono?: number;
  contorno?: boolean;
  /** Un píxel de brillo (tono 4) arriba a la izquierda. */
  brillo?: boolean;
  /** Sin sombreado: todo el relleno en el tono base. */
  plano?: boolean;
  /** Color fijo (no recoloreable) en vez de marcador. */
  fijo?: string;
  contornoFijo?: string;
  /** Lados donde no se pone contorno. */
  sin?: ReadonlyArray<'n' | 's' | 'o' | 'e'>;
}

export class Pincel {
  readonly celdas: Cel[] = new Array<Cel>(L * L).fill(null);

  get(x: number, y: number): Cel {
    return x < 0 || y < 0 || x >= L || y >= L ? null : (this.celdas[y * L + x] ?? null);
  }
  set(x: number, y: number, c: Cel): void {
    const ix = Math.round(x);
    const iy = Math.round(y);
    if (ix >= 0 && iy >= 0 && ix < L && iy < L) this.celdas[iy * L + ix] = c;
  }

  llenar(f: Forma, slot: SlotMascota, o: OpcionesLlenar = {}): void {
    const dentro = new Set<number>();
    for (let y = 0; y < L; y++) for (let x = 0; x < L; x++) if (f.dentro(x, y)) dentro.add(y * L + x);
    const esta = (x: number, y: number): boolean => x >= 0 && y >= 0 && x < L && y < L && dentro.has(y * L + x);
    const sin = new Set(o.sin ?? []);
    const base = 2 + (o.tono ?? 0);
    let brilloXY: [number, number] | null = null;
    if (o.brillo) {
      let mejor = 1e9;
      const px = f.cx - f.rx * 0.45;
      const py = f.cy - f.ry * 0.5;
      for (const k of dentro) {
        const x = k % L;
        const y = Math.floor(k / L);
        const d = (x - px) ** 2 + (y - py) ** 2;
        const borde = !esta(x - 1, y) || !esta(x + 1, y) || !esta(x, y - 1) || !esta(x, y + 1);
        if (!borde && d < mejor) {
          mejor = d;
          brilloXY = [x, y];
        }
      }
    }
    for (const k of dentro) {
      const x = k % L;
      const y = Math.floor(k / L);
      const abierto = (!esta(x, y - 1) && !sin.has('n')) || (!esta(x, y + 1) && !sin.has('s')) || (!esta(x - 1, y) && !sin.has('o')) || (!esta(x + 1, y) && !sin.has('e'));
      if (abierto && o.contorno !== false) {
        this.celdas[k] = o.contornoFijo ?? mat(slot, 0);
        continue;
      }
      if (o.fijo !== undefined) {
        this.celdas[k] = o.fijo;
        continue;
      }
      let t = base;
      if (!o.plano) {
        const u = (x - f.cx) / f.rx;
        const v = (y - f.cy) / f.ry;
        const l = -(0.55 * u + 0.85 * v);
        t = l > 0.5 ? base + 1 : l < -0.42 ? base - 1 : base;
      }
      this.celdas[k] = mat(slot, Math.max(1, Math.min(3, t)));
    }
    if (brilloXY && o.fijo === undefined) this.set(brilloXY[0], brilloXY[1], mat(slot, Math.min(4, base + 2)));
  }

  px(x: number, y: number, c: Cel): void {
    this.set(x, y, c);
  }
  pxs(pts: ReadonlyArray<readonly [number, number]>, c: Cel): void {
    for (const [x, y] of pts) this.set(x, y, c);
  }
  rect(x: number, y: number, w: number, h: number, c: Cel): void {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c);
  }
}
