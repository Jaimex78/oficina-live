/**
 * Generador de peinados en el estilo del diseñador: masas y mechones que se pintan de atrás hacia delante, cada uno con su luz
 * (brillo arriba a la izquierda, sombra abajo a la derecha), vetas a lo largo del mechón y punta oscura. Los tonos son 5 por pelo, como en
 * el peinado del diseñador: [más oscuro, oscuro, medio, base, luz].
 *
 * Una forma es una elipse (masa o rizo), un trazo (mechón con ancho que cambia a lo largo) o un polígono. Todo se evalúa en el centro del
 * píxel, así que el resultado nunca tiene semitransparencias y la silueta sale redondeada y sin cortes planos.
 */

import { hexARgb, mezclarHex, rgbAHex } from '../../nucleo';
import type { Capa } from './disenador';
import { ANCHO, ALTO } from './datos-disenador';

export type Pt = readonly [number, number];

interface Base {
  /** Tono de partida: 0 oscuro ... 4 luz; 3 es la base. */
  tono?: number;
  /** Probabilidad (0..1) de brillo en el lado de la luz. */
  brillo?: number;
  /** Sin veta ni brillo (zonas planas como el moño liso). */
  liso?: boolean;
  /** Los píxeles de esta forma nunca se oscurecen hasta el contorno. */
  semilla?: number;
}
export interface Elipse extends Base { tipo: 'elipse'; c: Pt; r: Pt; /** rizos: oscurece el borde y marca un reflejo arriba-izquierda */ rizo?: boolean; }
export interface Trazo extends Base { tipo: 'trazo'; pts: Pt[]; w: number | number[]; punta?: boolean; }
export interface Poli extends Base { tipo: 'poli'; pts: Pt[]; }
export type Forma = Elipse | Trazo | Poli;

export const el = (cx: number, cy: number, rx: number, ry: number, o: Base & { rizo?: boolean } = {}): Elipse => ({ tipo: 'elipse', c: [cx, cy], r: [rx, ry], ...o });
export const tr = (pts: Pt[], w: number | number[], o: Base & { punta?: boolean } = {}): Trazo => ({ tipo: 'trazo', pts, w, punta: true, ...o });
export const po = (pts: Pt[], o: Base = {}): Poli => ({ tipo: 'poli', pts, ...o });

const LUZ: Pt = [-0.6, -0.8];

function hash(a: number, b: number, c: number): number {
  let h = Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263) ^ Math.imul(c | 0, 2147483647);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
}

/** Cinco tonos de un cabello a partir de su color base (el del diseñador: 222034, 2D2833, 393137, 453E50, 61535E). */
export function rampaPelo(base: string, opciones: { oscuro?: string; luz?: string } = {}): string[] {
  const osc = opciones.oscuro ?? '#16121F';
  const luz = opciones.luz ?? '#FFF1DC';
  return [mezclarHex(base, osc, 0.62), mezclarHex(base, osc, 0.42), mezclarHex(base, osc, 0.2), base, mezclarHex(base, luz, 0.22)];
}
export const PELO_DISENADOR: readonly string[] = ['#222034', '#2D2833', '#393137', '#453E50', '#61535E'];

interface Celda { forma: number; luz: number; u: number; v: number; ax: number; ay: number }

function distSeg(px: number, py: number, a: Pt, b: Pt): { d: number; t: number; side: number; ox: number; oy: number } {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const l2 = dx * dx + dy * dy || 1e-9;
  let t = ((px - a[0]) * dx + (py - a[1]) * dy) / l2;
  t = Math.max(0, Math.min(1, t));
  const qx = a[0] + t * dx, qy = a[1] + t * dy;
  const ox = px - qx, oy = py - qy;
  return { d: Math.hypot(ox, oy), t, side: 0, ox, oy };
}

function dentroPoli(px: number, py: number, pts: readonly Pt[]): boolean {
  let dentro = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i]!, [xj, yj] = pts[j]!;
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) dentro = !dentro;
  }
  return dentro;
}

/** Rellena una cuadrícula de formas: cada celda recuerda qué forma la cubre y su luz local (-1 sombra a 1 luz). */
function cubrir(formas: readonly Forma[], ancho: number, alto: number): (Celda | null)[] {
  const g: (Celda | null)[] = new Array(ancho * alto).fill(null);
  formas.forEach((f, idx) => {
    for (let y = 0; y < alto; y++) for (let x = 0; x < ancho; x++) {
      const px = x + 0.5, py = y + 0.5;
      let cel: Celda | null = null;
      if (f.tipo === 'elipse') {
        const dx = (px - f.c[0]) / (f.r[0] + 0.35), dy = (py - f.c[1]) / (f.r[1] + 0.35);
        if (dx * dx + dy * dy <= 1) cel = { forma: idx, luz: dx * LUZ[0] + dy * LUZ[1], u: Math.hypot(dx, dy), v: dx, ax: f.c[0], ay: f.c[1] };
      } else if (f.tipo === 'poli') {
        if (dentroPoli(px, py, f.pts)) {
          const cx = f.pts.reduce((s, p) => s + p[0], 0) / f.pts.length, cy = f.pts.reduce((s, p) => s + p[1], 0) / f.pts.length;
          const rx = Math.max(...f.pts.map((p) => Math.abs(p[0] - cx))) || 1, ry = Math.max(...f.pts.map((p) => Math.abs(p[1] - cy))) || 1;
          const dx = (px - cx) / rx, dy = (py - cy) / ry;
          cel = { forma: idx, luz: dx * LUZ[0] + dy * LUZ[1], u: 0.5, v: dx, ax: cx, ay: cy };
        }
      } else {
        const n = f.pts.length - 1;
        let mejor: { d: number; t: number; i: number; ox: number; oy: number } | null = null;
        for (let i = 0; i < n; i++) {
          const r = distSeg(px, py, f.pts[i]!, f.pts[i + 1]!);
          if (!mejor || r.d < mejor.d) mejor = { d: r.d, t: (i + r.t) / n, i, ox: r.ox, oy: r.oy };
        }
        if (mejor) {
          const ws = Array.isArray(f.w) ? f.w : [f.w, f.w];
          const pos = mejor.t * (ws.length - 1);
          const i0 = Math.min(ws.length - 2, Math.floor(pos));
          const w = ws[i0]! + (ws[i0 + 1]! - ws[i0]!) * (pos - i0);
          if (mejor.d <= w / 2 + 0.2) {
            const hw = Math.max(0.5, w / 2);
            cel = { forma: idx, luz: (mejor.ox * LUZ[0] + mejor.oy * LUZ[1]) / hw, u: mejor.t, v: (mejor.ox * LUZ[0] + mejor.oy * LUZ[1]) / hw, ax: px - mejor.ox, ay: py - mejor.oy };
          }
        }
      }
      if (cel) g[y * ancho + x] = cel;
    }
  });
  return g;
}

/** Pinta un conjunto de formas (de atrás hacia delante) como capa. `rampa` son 5 colores hex. */
export function pintarPelo(formas: readonly Forma[], rampa: readonly string[], opciones: { semilla?: number; ancho?: number; alto?: number; /** índice de la rampa que hace de base (3 por defecto) */ baseIdx?: number } = {}): Capa {
  const W = opciones.ancho ?? ANCHO;
  const H = opciones.alto ?? ALTO;
  const sem = opciones.semilla ?? 1;
  const g = cubrir(formas, W, H);
  // limpieza de silueta: se quitan píxeles sueltos
  const vecino = (x: number, y: number, dx: number, dy: number): boolean => x + dx >= 0 && y + dy >= 0 && x + dx < W && y + dy < H && g[(y + dy) * W + x + dx] !== null;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!g[y * W + x]) continue;
    const n = +vecino(x, y, 1, 0) + +vecino(x, y, -1, 0) + +vecino(x, y, 0, 1) + +vecino(x, y, 0, -1);
    if (n <= 1) g[y * W + x] = null;
  }
  const out: Capa = new Map();
  const ruido = (x: number, y: number, k: number): number => {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const s = (t: number): number => t * t * (3 - 2 * t);
    const a = hash(xi, yi, k), b = hash(xi + 1, yi, k), c = hash(xi, yi + 1, k), d = hash(xi + 1, yi + 1, k);
    return (a + (b - a) * s(xf)) * (1 - s(yf)) + (c + (d - c) * s(xf)) * s(yf);
  };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const c = g[y * W + x];
    if (!c) continue;
    const f = formas[c.forma]!;
    let t = f.tono ?? 3;
    const h1 = hash(x, y, sem + c.forma * 31);
    const izq = x > 0 ? g[y * W + x - 1] : null;
    const arr = y > 0 ? g[(y - 1) * W + x] : null;
    const der = x < W - 1 ? g[y * W + x + 1] : null;
    const aba = y < H - 1 ? g[(y + 1) * W + x] : null;
    const vacio = (o: Celda | null | undefined): boolean => !o;
    const delante = (o: Celda | null | undefined): boolean => !!o && o.forma > c.forma;
    const detras = (o: Celda | null | undefined): boolean => !!o && o.forma < c.forma;
    if (!f.liso) {
      // cúmulos alargados a lo largo del flujo: el ruido se estira en la dirección del mechón
      let along = y, across = x;
      if (f.tipo === 'trazo') {
        const p0 = f.pts[0]!, p1 = f.pts[f.pts.length - 1]!;
        const dx = p1[0] - p0[0], dy = p1[1] - p0[1], l = Math.hypot(dx, dy) || 1;
        along = (x * dx + y * dy) / l;
        across = (-x * dy + y * dx) / l;
      } else {
        along = y + x * 0.35;
        across = x - y * 0.35;
      }
      const n = ruido(across / 1.5, along / 3.4, sem + c.forma * 17);
      const lit = c.luz;
      const claro = (f.brillo ?? 0.45);
      if (n > 0.68 - claro * 0.18 && lit > -0.35) t = 4;
      else if (n < 0.27 + (lit < 0 ? 0.12 : 0)) t = 2;
      if (f.tipo === 'elipse' && f.rizo) {
        // rizo: reflejo arriba-izquierda y media luna oscura abajo-derecha
        t = 3;
        if (lit > 0.5 && h1 < 0.8) t = 4;
        else if (lit < -0.42) t = h1 < 0.7 ? 2 : 1;
        else if (h1 < 0.12) t = 2;
        else if (h1 > 0.93) t = 4;
      }
    }
    // el borde que da al vacío es un tono más oscuro (como en el peinado del diseñador); la sombra de lo que está delante cae a la derecha y abajo
    const borde = vacio(izq) || vacio(arr) || vacio(der) || vacio(aba);
    const rizoF = f.tipo === 'elipse' && f.rizo === true;
    if (borde && !f.liso && !rizoF && h1 < 0.78) t = Math.min(t, 2);
    if (borde && rizoF && h1 < 0.5 && c.luz < 0.2) t = Math.min(t, 2);
    if ((delante(izq) || delante(arr)) && !f.liso) t = Math.min(t, h1 < 0.6 ? 1 : 2);
    if (!f.liso && (detras(izq) || detras(arr)) && (vacio(der) === false) && h1 < 0.5 && t === 3) t = 4;
    if (f.tipo === 'trazo' && f.punta !== false && c.u > 0.86) t = Math.min(t, h1 < 0.5 ? 1 : 2);
    t = Math.max(0, Math.min(4, t));
    const idx = Math.max(0, Math.min(rampa.length - 1, t + ((opciones.baseIdx ?? 3) - 3)));
    out.set(y * ANCHO + x, rampa[idx]!);
  }
  return out;
}

/** Contorno negro alrededor de `capa` donde no hay nada en `ocupado` (el resto de la figura). */
export function contornear(capa: Capa, ocupado: ReadonlySet<number> | ((k: number) => boolean), color = '#000000'): Capa {
  const es = typeof ocupado === 'function' ? ocupado : (k: number): boolean => ocupado.has(k);
  const out: Capa = new Map();
  for (const k of capa.keys()) {
    const x = k % ANCHO, y = Math.floor(k / ANCHO);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const xx = x + dx, yy = y + dy;
      if (xx < 0 || yy < 0 || xx >= ANCHO || yy >= ALTO) continue;
      const kk = yy * ANCHO + xx;
      if (!capa.has(kk) && !es(kk)) out.set(kk, color);
    }
  }
  return out;
}

void hexARgb; void rgbAHex;
