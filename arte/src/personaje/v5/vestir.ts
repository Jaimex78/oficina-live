/**
 * Herramientas para vestir el cuerpo v5: contexto de una pose (cuerpo, zonas, siluetas), marcadores de color, tonos y cierre de silueta.
 *
 * Una prenda es una capa (mapa `y * 32 + x -> color`) pintada en colores MARCADOR (`ropaA`, `ropaB`, `pantalon`, `zapatos`, `accA`, `accB`,
 * `cabello`, `piel`): el navegador cambia cada marcador por el tono de la rampa elegida. Los colores fijos (contorno negro, ojos) van en hex.
 *
 * Contorno: el cuerpo trae el suyo. Una prenda que sobresale del cuerpo trae el contorno de lo que sobresale (`conSilueta`), y si cubre un
 * trozo del contorno del cuerpo lo repinta con su color para que no quede una línea negra dentro.
 */

import { colorMarcador } from '../../nucleo';
import type { Slot } from '../../nucleo';
import { ALTO, ANCHO, LEYENDA } from './datos-disenador';
import type { Capa } from './disenador';
import { poseCuerpo, zonas } from './pose';
import type { PoseCuerpo, Vista, Zona, Zonas } from './pose';

export type { Slot };
export const NEGRO = '#000000';
export const mk = (slot: Slot, tono: number): string => colorMarcador(slot, Math.max(0, Math.min(4, tono)));

/** Tono de la camiseta del diseñador por letra: n brillo -> luz (3), f base (2), l sombra (1), k borde (0). */
export const TONO_TANQUE: Readonly<Record<string, number>> = { n: 3, f: 2, l: 1, k: 0 };
/** Tono de piel por letra: b base, c y i y m y j sombra, e y h sombra honda, B luz. */
export const TONO_PIEL: Readonly<Record<string, number>> = { b: 2, c: 1, i: 1, m: 1, j: 1, e: 0, h: 0, B: 3 };

export interface Ctx {
  p: PoseCuerpo;
  z: Zonas;
  vista: Vista;
  cuadro: number;
  /** Letras del cuerpo (la camiseta de tirantes y los shorts del diseñador están puestos). */
  letra(x: number, y: number): string;
  zona(x: number, y: number): Zona | undefined;
  /** Píxeles de relleno del cuerpo (todo lo que no es transparente ni contorno). */
  relleno: Set<number>;
  /** Contorno negro del cuerpo. */
  contorno: Set<number>;
  /** Contorno del cuerpo que da al vacío (la silueta). */
  silueta: Set<number>;
  /** Filas del torso: primera y última (la primera sube 1 al caminar). */
  y0Torso: number;
}

const cache = new Map<string, Ctx>();

export function ctxDe(vista: Vista, cuadro: number, cara = 0): Ctx {
  const llave = `${vista}${cuadro}.${cara}`;
  const hecho = cache.get(llave);
  if (hecho) return hecho;
  const p = poseCuerpo(vista, cuadro, cara);
  const z = zonas(p);
  const relleno = new Set<number>();
  const contorno = new Set<number>();
  for (let y = 0; y < ALTO; y++) for (let x = 0; x < ANCHO; x++) {
    const ch = p.g[y]![x]!;
    if (ch === '.') continue;
    (ch === 'a' ? contorno : relleno).add(y * ANCHO + x);
  }
  const vacio = (k: number): boolean => k < 0 || k >= ANCHO * ALTO || (!relleno.has(k) && !contorno.has(k));
  const silueta = new Set<number>();
  for (const k of contorno) {
    const x = k % ANCHO;
    if (vacio(k - ANCHO) || vacio(k + ANCHO) || (x > 0 && vacio(k - 1)) || (x < ANCHO - 1 && vacio(k + 1))) silueta.add(k);
  }
  const ctx: Ctx = {
    p, z, vista, cuadro, relleno, contorno, silueta,
    letra: (x, y) => (x < 0 || y < 0 || x >= ANCHO || y >= ALTO ? '.' : p.g[y]![x]!),
    zona: (x, y) => z.get(y * ANCHO + x),
    y0Torso: vista === 'I' ? 46 : 46 + p.rebote,
  };
  cache.set(llave, ctx);
  return ctx;
}

// ---------------------------------------------------------------------------
// Cuerpo desnudo (capa `cuerpo`)
// ---------------------------------------------------------------------------

const FIJOS = new Set(Object.keys(LEYENDA));

/** El cuerpo con piel recoloreable. La camiseta y los shorts del diseñador se vuelven piel (la ropa de verdad la pone cada prenda). */
export function cuerpoDesnudo(ctx: Ctx): Capa {
  const out: Capa = new Map();
  const { g } = ctx.p;
  for (let y = 0; y < ALTO; y++) for (let x = 0; x < ANCHO; x++) {
    let ch = g[y]![x]!;
    if (ch === '.') continue;
    const k = y * ANCHO + x;
    if (ch === 'a') { out.set(k, NEGRO); continue; }
    if (y >= 46 && 'nflk'.includes(ch)) ch = ch === 'n' || ch === 'f' ? 'b' : 'c';
    const t = TONO_PIEL[ch];
    if (t !== undefined) { out.set(k, mk('piel', t)); continue; }
    if (!FIJOS.has(ch)) throw new Error(`Letra sin color en el cuerpo: ${ch}`);
    out.set(k, LEYENDA[ch]!);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Pincel de prenda
// ---------------------------------------------------------------------------

export class Pincel {
  readonly m: Capa = new Map();
  constructor(readonly ctx: Ctx) {}
  put(x: number, y: number, hex: string): void {
    if (x < 0 || y < 0 || x >= ANCHO || y >= ALTO) return;
    this.m.set(y * ANCHO + x, hex);
  }
  /** Pone el tono `tono` del slot en (x, y). */
  s(x: number, y: number, slot: Slot, tono: number): void {
    this.put(x, y, mk(slot, tono));
  }
  tiene(x: number, y: number): boolean { return this.m.has(y * ANCHO + x); }
  /** Solo si ya hay un píxel de la prenda (para detalles que no deben salirse). */
  sobre(x: number, y: number, slot: Slot, tono: number): void {
    if (this.tiene(x, y)) this.s(x, y, slot, tono);
  }
  /** Pinta una línea horizontal. */
  h(x0: number, x1: number, y: number, slot: Slot, tono: number, solo = false): void {
    for (let x = x0; x <= x1; x++) (solo ? this.sobre : this.s).call(this, x, y, slot, tono);
  }
  v(x: number, y0: number, y1: number, slot: Slot, tono: number, solo = false): void {
    for (let y = y0; y <= y1; y++) (solo ? this.sobre : this.s).call(this, x, y, slot, tono);
  }
  /** Recorre los píxeles del cuerpo que están en alguna de las zonas. */
  porZona(zs: string, f: (x: number, y: number, letra: string, z: Zona) => void): void {
    for (const [k, z] of this.ctx.z) if (zs.includes(z)) f(k % ANCHO, Math.floor(k / ANCHO), this.ctx.p.g[Math.floor(k / ANCHO)]![k % ANCHO]!, z);
  }
  /** Cubre las zonas con el color de `slot`, conservando la luz y la sombra del cuerpo (camiseta y piel). */
  cubrir(zs: string, slot: Slot, opciones: { filas?: [number, number]; desplazar?: number } = {}): void {
    const d = opciones.desplazar ?? 0;
    this.porZona(zs, (x, y, l, z) => {
      if (opciones.filas && (y < opciones.filas[0] || y > opciones.filas[1])) return;
      const t = 'nflk'.includes(l) ? TONO_TANQUE[l]! : z === 'C' || z === 'N' ? 2 : (TONO_PIEL[l] ?? 2);
      this.s(x, y, slot, t + d);
    });
  }
}

/** Todos los píxeles de la prenda como lista. */
const claves = (c: Capa): number[] => [...c.keys()];

/**
 * Cierra la silueta de una prenda: pone el contorno negro donde la prenda sobresale del cuerpo y repinta con el color de la prenda el contorno
 * del cuerpo que la prenda deja por dentro. `relleno` son los píxeles de la prenda sin contorno.
 */
export function conSilueta(ctx: Ctx, relleno: Capa, extra: ReadonlySet<number> = new Set()): Capa {
  const out: Capa = new Map(relleno);
  const union = new Set<number>([...ctx.relleno, ...claves(relleno), ...extra]);
  const borde = new Set<number>();
  for (const k of union) {
    const x = k % ANCHO;
    for (const n of [k - ANCHO, k + ANCHO, k - 1, k + 1]) {
      if (n < 0 || n >= ANCHO * ALTO) continue;
      if ((n === k - 1 && x === 0) || (n === k + 1 && x === ANCHO - 1)) continue;
      if (!union.has(n)) borde.add(n);
    }
  }
  for (const n of borde) if (!ctx.contorno.has(n)) out.set(n, NEGRO);
  // contorno de silueta del cuerpo que quedó dentro: se repinta
  for (const n of ctx.silueta) {
    if (borde.has(n) || out.has(n)) continue;
    let color: string | undefined;
    const x = n % ANCHO;
    for (const v of [n - 1, n + 1, n - ANCHO, n + ANCHO]) {
      if ((v === n - 1 && x === 0) || (v === n + 1 && x === ANCHO - 1)) continue;
      const c = relleno.get(v);
      if (c) { color = c; break; }
    }
    if (color) out.set(n, color);
  }
  return out;
}

export const rampaFija = (hex: readonly string[]): readonly string[] => hex;
