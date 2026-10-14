/**
 * Ropa y accesorios sobre el cuerpo base del diseñador.
 *
 *  - Camiseta de color + shorts: recolor por letras de la camiseta de tirantes y de los shorts del sprite, más mangas cortas.
 *  - Chaqueta negra abierta y pantalón oscuro: de frente son las capas exactas del 11; de espalda y de perfil se pintan con el generador
 *    de mechones (`pelo.ts`) usando los 5 tonos de la chaqueta del diseñador (222034, 272936, 32343B, 464952, 696C72).
 *  - Gafas redondas: aro negro de 1 px alrededor de cada ojo.
 */

import { LEYENDA } from './datos-disenador';
import { CAPAS_DISENADOR } from './disenador';
import type { Capa } from './disenador';
import { el, po, tr, pintarPelo } from './pelo';
import type { Forma } from './pelo';
import type { Rejilla } from './rejilla';
import { ANCHO } from './datos-disenador';

export const RAMPA_CHAQUETA: readonly string[] = [LEYENDA.d!, LEYENDA.u!, LEYENDA.s!, LEYENDA.t!, LEYENDA.v!];

/** Rampas de ropa de color: [hem/sombra honda, sombra, base, luz, brillo]. */
export interface RampaRopa { oscuro: string; sombra: string; base: string; luz: string; brillo: string }
export const ROPA_COLOR: Record<string, RampaRopa> = {
  celeste: { oscuro: '#1F6F9A', sombra: '#2AA0D8', base: '#2DB6F5', luz: '#7FD4FA', brillo: '#C4EBFD' },
  rojo: { oscuro: '#8E1F1A', sombra: '#C42C22', base: '#E8372A', luz: '#F2796B', brillo: '#F9B4AA' },
  verde: { oscuro: '#1F5A29', sombra: '#2C7A38', base: '#349141', luz: '#6CBF76', brillo: '#B1E0B6' },
  amarillo: { oscuro: '#A07A1E', sombra: '#DDA82E', base: '#FBC63F', luz: '#FDDD7C', brillo: '#FEF0BB' },
  beige: { oscuro: '#8B7B5A', sombra: '#BFAE86', base: '#D9C7A0', luz: '#EADCBE', brillo: '#F7F0DE' },
  azul: { oscuro: '#3A4AA8', sombra: '#586AD6', base: '#6F82F5', luz: '#9DAAF8', brillo: '#D0D6FC' },
  gris: { oscuro: '#4C4E5C', sombra: '#757890', base: '#9396AD', luz: '#B7BACB', brillo: '#DADCE7' },
};

/**
 * Recolorea la camiseta de tirantes (filas `yCamiseta0..yCamiseta1`) y los shorts (desde `yShorts`) de una rejilla de cuerpo base.
 * Letras de la camiseta del diseñador: n brillo, f base, l sombra, k borde/tirante.
 */
export function recolorearRopa(g: Rejilla, camiseta: RampaRopa, shorts: RampaRopa, yCamiseta0: number, yShorts: number): Record<string, string> {
  const out: Record<string, string> = {};
  const mapa = (r: RampaRopa): Record<string, string> => ({ n: 'N', f: 'F', l: 'L', k: 'K' });
  void mapa;
  for (let y = yCamiseta0; y < g.length; y++) for (let x = 0; x < ANCHO; x++) {
    const ch = g[y]![x]!;
    if (!'nflk'.includes(ch)) continue;
    const corto = y >= yShorts;
    g[y]![x] = corto ? { n: 'Q', f: 'R', l: 'S', k: 'T' }[ch]! : { n: 'N', f: 'F', l: 'L', k: 'K' }[ch]!;
  }
  out.N = camiseta.luz; out.F = camiseta.base; out.L = camiseta.sombra; out.K = camiseta.oscuro;
  out.Q = shorts.luz; out.R = shorts.base; out.S = shorts.sombra; out.T = shorts.oscuro;
  return out;
}

/** Mangas cortas de la camiseta: cubre el brazo (letras de piel) en las filas dadas, columnas por vista. */
export function mangasCortas(g: Rejilla, tramos: readonly { x0: number; x1: number; y0: number; y1: number }[]): void {
  for (const t of tramos) for (let y = t.y0; y <= t.y1; y++) for (let x = t.x0; x <= t.x1; x++) {
    const ch = g[y]![x]!;
    if ('bcimeBj'.includes(ch)) g[y]![x] = y === t.y1 ? 'K' : x === t.x0 || x === t.x1 ? 'L' : 'F';
  }
}

// ---------- gafas ----------
export function gafas(vista: 'S' | 'I' | 'N', color = '#222034'): Capa {
  const c: Capa = new Map();
  const aro = (cx: number, cy: number, r: number): void => {
    for (let y = Math.floor(cy - r - 1); y <= Math.ceil(cy + r + 1); y++) for (let x = Math.floor(cx - r - 1); x <= Math.ceil(cx + r + 1); x++) {
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      if (d >= r - 0.45 && d <= r + 0.42) c.set(y * ANCHO + x, color);
    }
  };
  if (vista === 'S') {
    aro(12.5, 42, 2.75);
    aro(19.5, 42, 2.75);
    for (let x = 15; x <= 16; x++) c.set(41 * ANCHO + x, color);
  } else if (vista === 'I') {
    aro(12, 42, 2.75);
    for (let x = 15; x <= 18; x++) c.set(41 * ANCHO + x, color);
  }
  return c;
}

// ---------- chaqueta y pantalón de espalda y de perfil ----------
const JAQ: { oscuro: string[] } = { oscuro: [] };
void JAQ;

function pintarRopa(formas: Forma[], semilla: number): Capa {
  return pintarPelo(formas, RAMPA_CHAQUETA, { semilla, baseIdx: 2 });
}

/** Chaqueta negra de espalda (el contorno lo agrega quien compone). */
export function chaquetaEspalda(): { pantalon: Capa; chaqueta: Capa } {
  const pantalon = pintarRopa([
    // dos piernas separadas, con la punta del zapato un tono más claro
    po([[11, 56], [14.8, 56], [14.8, 61], [10.8, 61]], { brillo: 0.3 }),
    po([[17.2, 56], [21, 56], [21.2, 61], [17.2, 61]], { brillo: 0.3 }),
    tr([[12.4, 60.2], [13.4, 60.2]], 1.2, { tono: 4, liso: true, punta: false }),
    tr([[18.8, 60.2], [19.8, 60.2]], 1.2, { tono: 4, liso: true, punta: false }),
  ], 5);
  const chaqueta = pintarRopa([
    // cuerpo con falda
    po([[10, 46.6], [12, 45.8], [20, 45.8], [22, 46.6], [22, 52], [22.6, 57.6], [20, 58.4], [16, 57.4], [12, 58.4], [9.4, 57.6], [10, 52]], { brillo: 0.4 }),
    // yugo de los hombros con luz
    tr([[10.4, 47.4], [14, 46.6], [18, 46.6], [21.6, 47.4]], [3, 3.2, 3.2, 3], { brillo: 0.9, tono: 4 }),
    // mangas (a cada lado) con costura y puño
    tr([[7.6, 47.6], [6.8, 52], [7.2, 56.4]], [4.2, 4.6, 4.2], { brillo: 0.5 }),
    tr([[24.4, 47.6], [25.2, 52], [24.8, 56.4]], [4.2, 4.6, 4.2], { brillo: 0.4, tono: 2 }),
    tr([[5.4, 56.4], [7.6, 56.6], [9.4, 56.4]], 1.5, { tono: 4, liso: true, punta: false }),
    tr([[22.6, 56.4], [24.4, 56.6], [26.6, 56.4]], 1.5, { tono: 4, liso: true, punta: false }),
    // separación de las mangas, costura central y abertura trasera
    tr([[9.8, 48], [9.8, 52], [9.4, 56.4]], 1.2, { tono: 1, liso: true, punta: false }),
    tr([[22.2, 48], [22.2, 52], [22.6, 56.4]], 1.2, { tono: 1, liso: true, punta: false }),
    tr([[16, 47.4], [16, 52], [16, 57.8]], 1.2, { tono: 1, liso: true }),
    tr([[12.8, 54.6], [13, 56], [12.6, 57.8]], [1.4, 1.4, 1.2], { tono: 2 }),
    tr([[19.2, 54.6], [19, 56], [19.4, 57.8]], [1.4, 1.4, 1.2], { tono: 2 }),
  ], 9);
  return { pantalon, chaqueta };
}

/** Chaqueta y pantalón de perfil izquierdo (la figura mira a la izquierda). */
export function chaquetaPerfil(): { pantalon: Capa; chaqueta: Capa } {
  const pantalon = pintarRopa([
    // pierna lejana y pierna cercana, con el zapato más claro en la punta
    po([[14.6, 56], [19, 56], [19, 61], [14.6, 61]], { brillo: 0.2, tono: 2 }),
    po([[11.8, 56], [16.6, 56], [16.6, 61], [11.8, 61]], { brillo: 0.4 }),
    tr([[12.6, 60.3], [14.2, 60.3]], 1.2, { tono: 4, liso: true, punta: false }),
  ], 5);
  const chaqueta = pintarRopa([
    // cuerpo: borde delantero un poco hacia dentro para que asome la camiseta blanca
    po([[14, 46.6], [16, 45.9], [19.6, 46.4], [21, 50], [21.8, 55], [22.6, 58.2], [18, 58], [14, 58.2], [13.4, 52]], { brillo: 0.4 }),
    tr([[15.6, 47.4], [18, 46.8], [20, 47.8]], [3, 3.2, 3], { brillo: 0.9, tono: 4 }),
    // solapa delantera
    tr([[13.9, 47.4], [13.7, 52], [13.4, 57.2]], [1.8, 1.8, 1.6], { tono: 4, liso: true }),
    // manga sobre el brazo, con puño claro
    tr([[16.6, 47.8], [17, 52], [16.8, 56.2]], [5, 5, 4.6], { brillo: 0.55 }),
    tr([[14.8, 56.4], [16.8, 56.6], [18.8, 56.4]], 1.5, { tono: 4, liso: true, punta: false }),
    // separación de la manga y faldón trasero
    tr([[14.4, 49], [14.6, 53], [14.4, 56]], 1.1, { tono: 1, liso: true, punta: false }),
    tr([[20.8, 52], [21.8, 55.6], [22.6, 58.4]], [2.6, 2.8, 1.2], { tono: 2 }),
  ], 11);
  return { pantalon, chaqueta };
}

export const CHAQUETA_FRENTE: { pantalon: Capa; chaqueta: Capa } = { pantalon: CAPAS_DISENADOR.pantalon, chaqueta: CAPAS_DISENADOR.chaqueta };
void el;
