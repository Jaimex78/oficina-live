/**
 * Los 5 disfraces de Halloween sobre la figura v5 (calamar rosa, momia, vampiro, zorro, bruja). Cada uno es un traje completo (capa `arriba`,
 * 6 cuadros por vista, sigue al cuerpo), una cabeza (capa `cabeza`, estática) y, si hace falta, algo detrás del cuerpo (capa `atras`).
 * Reemplazan arriba, abajo, zapatos y chaqueta. Slots: `ropaA` (color principal) y `ropaB` (secundario); la piel es la de la persona.
 *
 * Las medidas de `arte/GUIA-PERSONAJES-V5.md` (antes V4) se ajustaron a la figura v5 de 20 de ancho y 33 de alto (lienzo de 32 x 64):
 *   calamar rosa  la cabeza y el cuerpo en gota, con punta sobre la cabeza (3 filas) y piernas de tentáculo
 *   momia         vendas en todo el cuerpo y la cabeza, ojos al descubierto
 *   vampiro       pelo hacia atrás con pico, cuello alto de 4 píxeles, capa de 24 de ancho con forro
 *   zorro         orejas de 4 filas sobre la cabeza, mejillas de pelo (1 px a cada lado) y cola
 *   bruja         sombrero de 11 filas con ala de 23 de ancho, vestido hasta los pies
 */

import { ANCHO } from './datos-disenador';
import type { Capa } from './disenador';
import { anillo } from './otros';
import type { PiezaDef } from './otros';
import { el, po, pintarPelo } from './pelo';
import type { Forma } from './pelo';
import type { Vista } from './pose';
import { Pincel, TONO_PIEL, TONO_TANQUE, conSilueta, ctxDe, mk } from './vestir';
import type { Ctx, Slot } from './vestir';

export interface DefDisfrazV5 {
  id: string;
  nombre: string;
  coleccion: 'halloween';
  ocultaPelo: boolean;
  ocultaAccesorios: boolean;
  ocultaCabeza?: boolean;
  ocultaBarba?: boolean;
  porDefecto: { color: string; color2?: string };
  etiquetas: string[];
  partes: PiezaDef[];
}

const ctx = (v: Vista, c: number): Ctx => ctxDe(v, c);
const tonoZ = (l: string, z: string): number => ('nflk'.includes(l) ? TONO_TANQUE[l]! : z === 'C' || z === 'N' ? 2 : (TONO_PIEL[l] ?? 2));
const rampa = (slot: Slot): readonly string[] => [0, 1, 2, 3, 4].map((t) => mk(slot, t));
const unir = (...cs: Capa[]): Capa => { const o: Capa = new Map(); for (const c of cs) for (const [k, v] of c) o.set(k, v); return o; };

/** Los ojos quedan al descubierto: rectángulos de los ojos en cada vista. */
const OJOS: Record<Vista, [number, number, number, number][]> = {
  S: [[10, 41, 13, 43], [18, 41, 21, 43]],
  N: [],
  I: [[10, 41, 14, 43]],
};
const esOjo = (v: Vista, x: number, y: number): boolean => OJOS[v].some(([x0, y0, x1, y1]) => x >= x0 && x <= x1 && y >= y0 && y <= y1);

/** Cubre con `slot` toda la piel de la cabeza (filas 29 a 45), dejando los ojos. `f` da el tono. */
function cubrirCabeza(p: Pincel, v: Vista, slot: Slot, f: (x: number, y: number, tonoBase: number) => number, hastaFila = 45): void {
  const cx = p.ctx;
  for (const k of cx.relleno) {
    const x = k % ANCHO, y = Math.floor(k / ANCHO);
    if (y < 29 || y > hastaFila || esOjo(v, x, y)) continue;
    const l = cx.p.g[y]![x]!;
    // los rasgos de la cara (cejas, ojos, boca) no se cubren
    if (v !== 'N' && y >= 39 && 'dgfkh'.includes(l)) continue;
    p.s(x, y, slot, f(x, y, TONO_PIEL[l] ?? 2));
  }
}

const traje = (id: string, nombre: string, slots: Slot[], f: (p: Pincel, c: Ctx, v: Vista) => void, sobresale = true) => ({
  id, nombre, capa: 'arriba' as const, slots, etiquetas: ['disfraz'], animada: true, vistas: ['S', 'N', 'I'] as Vista[],
  frame(v: Vista, c: number): Capa {
    const cx = ctx(v, c);
    const p = new Pincel(cx);
    f(p, cx, v);
    return sobresale ? conSilueta(cx, p.m) : p.m;
  },
});

/** Cubre el cuerpo de cuello para abajo con el slot, con la luz del cuerpo (todas las zonas menos la cabeza). */
function cuerpoCompleto(p: Pincel, slot: Slot, zonasQue = 'TCNAMHPF', d = 0): void {
  p.porZona(zonasQue, (x, y, l, z) => p.s(x, y, slot, tonoZ(l, z) + d));
}

const cabezaDe = (id: string, nombre: string, f: (v: Vista) => Capa, ocultaPeloSobre?: number): PiezaDef => ({
  id, nombre, capa: 'cabeza', slots: ['ropaA', 'ropaB'], etiquetas: ['disfraz'], animada: false, vistas: ['S', 'N', 'I'],
  ...(ocultaPeloSobre === undefined ? {} : { ocultaPeloSobre }),
  frame: (v) => f(v),
});

function formas(v: Vista, fs: Forma[], slot: Slot, semilla: number, conSil = true): Capa {
  const r = pintarPelo(fs, rampa(slot), { semilla });
  return conSil ? conSilueta(ctxDe(v, 0), r) : r;
}

// ---------------------------------------------------------------------------
// Calamar rosa
// ---------------------------------------------------------------------------
const CALAMAR: DefDisfrazV5 = {
  id: 'especial-calamar', nombre: 'Calamar rosa', coleccion: 'halloween', ocultaPelo: true, ocultaAccesorios: true, ocultaBarba: true,
  porDefecto: { color: 'rosa', color2: 'magenta' }, etiquetas: ['calamar', 'fantasma', 'rosa'],
  partes: [
    { ...traje('disfraz-calamar-traje', 'Traje', ['ropaA', 'ropaB'], (p, c, v) => {
      cuerpoCompleto(p, 'ropaA', 'TCNAMH');
      // piernas de tentáculo con ventosas
      p.porZona('PF', (x, y, l, z) => p.s(x, y, 'ropaA', z === 'F' ? 1 : tonoZ(l, z) + 1));
      p.porZona('PF', (x, y) => { if ((x + y) % 3 === 0) p.s(x, y, 'ropaB', 3); });
      // manchas de ventosas en el cuerpo
      p.porZona('TA', (x, y) => { if ((x * 3 + y * 5) % 11 === 0) p.s(x, y, 'ropaB', 3); });
      // el cuerpo se ensancha un píxel a cada lado en la cadera (gota)
      if (v !== 'I') for (const y of [c.p.yCadera, c.p.yCadera + 1]) for (const x of [10, 21]) if (c.zona(x + (x === 10 ? 1 : -1), y)) p.s(x, y, 'ropaA', 2);
    }) },
    cabezaDe('disfraz-calamar-cabeza', 'Cabeza', (v) => {
      const cx = ctxDe(v, 0);
      const p = new Pincel(cx);
      cubrirCabeza(p, v, 'ropaA', (_x, y, t) => (y <= 31 ? 3 : t));
      // punta de la gota sobre la cabeza y ventosas
      const punta = pintarPelo([po([[13, 30], [16, 25], [19, 30]], { brillo: 0.6 })], rampa('ropaA'), { semilla: 3 });
      for (const [k, val] of punta) p.m.set(k, val);
      for (const [x, y] of v === 'N' ? [[11, 35], [20, 37], [16, 40], [13, 43], [18, 32]] as const : [[11, 33], [20, 35], [15, 31], [22, 40], [9, 40]] as const) p.sobre(x, y, 'ropaB', 3);
      return conSilueta(cx, p.m);
    }),
  ],
};

// ---------------------------------------------------------------------------
// Momia
// ---------------------------------------------------------------------------
const venda = (x: number, y: number): number => (y % 3 === 0 ? 1 : (x + y * 2) % 7 === 0 ? 4 : (x + y) % 5 === 0 ? 3 : 2);
const MOMIA: DefDisfrazV5 = {
  id: 'especial-momia', nombre: 'Momia', coleccion: 'halloween', ocultaPelo: true, ocultaAccesorios: true, ocultaBarba: true,
  porDefecto: { color: 'beige' }, etiquetas: ['momia', 'vendas'],
  partes: [
    { ...traje('disfraz-momia-traje', 'Traje', ['ropaA'], (p, c) => {
      p.porZona('TCNAMHPF', (x, y) => p.s(x, y, 'ropaA', venda(x, y)));
      // puntas sueltas de las vendas
      const sueltos: [number, number][] = [[6, 53], [25, 54], [10, 60], [21, 59]];
      for (const [x, y] of sueltos) if (!c.relleno.has(y * ANCHO + x) && c.vista !== 'I') p.s(x, y, 'ropaA', 3);
    }) },
    cabezaDe('disfraz-momia-cabeza', 'Cabeza', (v) => {
      const cx = ctxDe(v, 0);
      const p = new Pincel(cx);
      cubrirCabeza(p, v, 'ropaA', (x, y) => venda(x, y));
      // las vendas se cruzan en diagonal sobre la frente
      for (let x = 8; x <= 24; x++) if ((x + 3) % 6 === 0) for (const y of [33, 34, 35]) p.sobre(x - (y - 33), y, 'ropaA', 1);
      return conSilueta(cx, p.m);
    }),
  ],
};

// ---------------------------------------------------------------------------
// Vampiro
// ---------------------------------------------------------------------------
const BLANCO = '#FFFFFF', CREMA = '#ECE9F0';
const VAMPIRO: DefDisfrazV5 = {
  id: 'especial-vampiro', nombre: 'Vampiro', coleccion: 'halloween', ocultaPelo: true, ocultaAccesorios: false, ocultaCabeza: true,
  porDefecto: { color: 'negro', color2: 'rojo' }, etiquetas: ['vampiro', 'capa'],
  partes: [
    {
      id: 'disfraz-vampiro-atras', nombre: 'Capa', capa: 'atras', slots: ['ropaA', 'ropaB'], etiquetas: ['disfraz'], animada: true, vistas: ['S', 'N', 'I'],
      frame(v, c) {
        const cx = ctx(v, c), p = new Pincel(cx), y0 = cx.y0Torso;
        if (v === 'N') return new Map();
        const fin = c === 5 ? 57 : 61;
        const x0 = v === 'S' ? 3 : 18, x1 = v === 'S' ? 28 : 28;
        for (let y = y0; y <= fin; y++) {
          const a = Math.min(1, (y - y0) / 8);
          const izq = v === 'S' ? Math.round(9 - a * 6) : 18, der = v === 'S' ? Math.round(22 + a * 6) : Math.round(22 + a * 6);
          for (let x = Math.max(x0, izq); x <= Math.min(x1, der); x++) {
            if (y >= fin - 1 && (x + (c % 2)) % 4 < 2) continue;
            const borde = x <= izq + 1 || x >= der - 1;
            p.s(x, y, borde && y > y0 + 4 ? 'ropaB' : 'ropaA', borde && y > y0 + 4 ? 2 : x >= der - 3 ? 0 : 1);
          }
        }
        return anillo(p.m);
      },
    },
    { ...traje('disfraz-vampiro-traje', 'Traje', ['ropaA', 'ropaB'], (p, c, v) => {
      const y0 = c.y0Torso;
      p.porZona('TCNAMHPF', (x, y, l, z) => p.s(x, y, 'ropaA', z === 'F' ? 0 : tonoZ(l, z)));
      if (v === 'S') {
        // camisa blanca en V, broche rojo y cuello alto
        for (let y = y0 + 1; y <= y0 + 5; y++) { const w = Math.max(0, 3 - Math.floor((y - y0 - 1) / 2)); for (let x = 16 - w; x <= 15 + w; x++) if (p.tiene(x, y) || c.zona(x, y)) p.put(x, y, (x + y) % 3 === 0 ? CREMA : BLANCO); }
        p.s(15, y0 + 2, 'ropaB', 3); p.s(16, y0 + 2, 'ropaB', 1);
        for (const [x, y] of [[10, y0 - 1], [11, y0 - 1], [10, y0], [11, y0], [12, y0], [20, y0 - 1], [21, y0 - 1], [21, y0], [20, y0], [19, y0]] as const) p.s(x, y, 'ropaA', x === 10 || x === 21 ? 2 : 3);
        p.s(10, y0 - 2, 'ropaA', 3); p.s(21, y0 - 2, 'ropaA', 3);
        p.h(9, 22, 54, 'ropaB', 1, true);
      } else if (v === 'N') {
        for (const [x, y] of [[10, y0 - 1], [11, y0 - 1], [10, y0], [11, y0], [12, y0], [20, y0 - 1], [21, y0 - 1], [21, y0], [20, y0], [19, y0]] as const) p.s(x, y, 'ropaA', 3);
        p.v(15, y0 + 1, 54, 'ropaA', 1, true); p.v(16, y0 + 1, 54, 'ropaA', 3, true);
      } else {
        p.porZona('C', (x, y) => p.put(x, y, BLANCO));
        p.s(13, y0 - 1, 'ropaA', 3); p.s(14, y0 - 1, 'ropaA', 2); p.s(13, y0, 'ropaA', 3);
      }
      // puños blancos
      p.porZona('A', (x, y, _l) => { if (!c.z.has((y + 1) * ANCHO + x) || c.z.get((y + 1) * ANCHO + x) !== 'A') p.put(x, y, BLANCO); });
      p.porZona('F', (x, y) => { if ((x + y) % 4 === 0) p.s(x, y, 'ropaA', 3); });
    }) },
    cabezaDe('disfraz-vampiro-cabeza', 'Pelo y colmillos', (v) => {
      const cx = ctxDe(v, 0);
      const fs: Forma[] = v === 'S'
        ? [el(16, 33.4, 9.9, 6.2, { brillo: 0.6, tono: 1 }), po([[7.2, 38.6], [6.6, 33.4], [9, 29.4], [13, 27.4], [19, 27.4], [23, 29.2], [25.4, 33.4], [24.8, 38.6], [23, 36.4], [19, 35.4], [16, 38.6], [13, 35.4], [9, 36.4]], { brillo: 0.55, tono: 1 })]
        : v === 'N'
          ? [el(16, 35.6, 10, 8.4, { brillo: 0.5, tono: 1 }), po([[7.4, 40], [6.8, 33.6], [9, 29.4], [13, 27.4], [19, 27.4], [23, 29.2], [25.4, 33.6], [25, 40], [23.2, 44.4], [16, 45.6], [9, 44.2]], { brillo: 0.5, tono: 1 })]
          : [el(14.8, 34.2, 9.6, 6, { brillo: 0.6, tono: 1 }), po([[6.4, 38], [7.6, 33], [10.4, 29.4], [15, 28], [20, 28.6], [23.8, 31.8], [24.6, 37.4], [24.4, 43], [22, 40.4], [18.6, 36.4], [13, 36], [9.6, 37.4]], { brillo: 0.55, tono: 1 })];
      const pelo = formas(v, fs, 'ropaA', 9);
      const p = new Pincel(cx);
      if (v === 'S') { p.put(14, 45, BLANCO); p.put(17, 45, BLANCO); }
      if (v === 'I') { p.put(11, 45, BLANCO); }
      return unir(pelo, p.m);
    }),
  ],
};

// ---------------------------------------------------------------------------
// Zorro
// ---------------------------------------------------------------------------
const ZORRO: DefDisfrazV5 = {
  id: 'especial-zorro', nombre: 'Zorro', coleccion: 'halloween', ocultaPelo: true, ocultaAccesorios: false, ocultaCabeza: true,
  porDefecto: { color: 'naranja', color2: 'blanco' }, etiquetas: ['zorro', 'animal', 'cola'],
  partes: [
    {
      id: 'disfraz-zorro-atras', nombre: 'Cola', capa: 'atras', slots: ['ropaA', 'ropaB'], etiquetas: ['disfraz'], animada: true, vistas: ['S', 'I'],
      frame(v, c) {
        const cx = ctx(v, c), p = new Pincel(cx);
        const sube = c >= 1 && c <= 4 && (c % 2 === 0) ? 1 : 0;
        const fs: Forma[] = v === 'S'
          ? [po([[21, 56], [24, 51], [28, 52], [29, 57], [27, 61], [23, 61]], { brillo: 0.6 })]
          : [po([[19, 55], [23, 50], [28, 51], [30, 57], [27, 62], [21, 62]], { brillo: 0.6 })];
        const r = pintarPelo(fs, rampa('ropaA'), { semilla: 12 });
        for (const [k, val] of r) p.m.set(k - sube * ANCHO, val);
        // la punta blanca
        for (const [k] of r) { const x = k % ANCHO, y = Math.floor(k / ANCHO) - sube; if (y >= 58 || x >= 28) p.s(x, y, 'ropaB', 3); }
        return anillo(p.m);
      },
    },
    { ...traje('disfraz-zorro-traje', 'Traje', ['ropaA', 'ropaB'], (p, c, v) => {
      p.porZona('TCNAMH', (x, y, l, z) => p.s(x, y, 'ropaA', tonoZ(l, z)));
      p.porZona('PF', (x, y, _l, z) => p.s(x, y, 'ropaA', z === 'F' ? 0 : 1));
      p.porZona('M', (x, y) => p.s(x, y, 'ropaA', 0));
      // panza y pecho blancos
      if (v !== 'N') p.porZona('TC', (x, y) => { if (y >= c.y0Torso + 1 && x >= (v === 'S' ? 13 : 12) && x <= (v === 'S' ? 18 : 14)) p.s(x, y, 'ropaB', 3); });
      else p.porZona('T', (x, y) => { if (y >= c.y0Torso + 8 && x >= 13 && x <= 18) p.s(x, y, 'ropaA', 3); });
      p.porZona('H', (x, y) => { if (y === c.p.yCadera) p.s(x, y, 'ropaA', 1); });
      if (v === 'N') {
        // la cola de espaldas, sobre las piernas
        const k = c.cuadro >= 1 && c.cuadro <= 4 ? 0 : 0;
        for (let y = 55; y <= 61; y++) { const w = y < 58 ? 2 : y < 60 ? 3 : 2; for (let x = 16 - w; x <= 15 + w; x++) p.s(x, y - k, y >= 59 ? 'ropaB' : 'ropaA', y >= 59 ? 3 : x <= 14 ? 3 : 2); }
      }
    }) },
    cabezaDe('disfraz-zorro-cabeza', 'Orejas y mejillas', (v) => {
      const cx = ctxDe(v, 0);
      const p = new Pincel(cx);
      // gorra de pelo hasta media frente
      cubrirCabeza(p, v, 'ropaA', (_x, y, t) => (y <= 31 ? 3 : t), v === 'N' ? 45 : 37);
      const orejas = v === 'S'
        ? [po([[8, 31], [8.6, 24.4], [13.6, 29]], { brillo: 0.6 }), po([[23.4, 31], [23, 24.4], [18, 29]], { brillo: 0.6 })]
        : v === 'N'
          ? [po([[8, 31], [8.6, 24.4], [13.6, 29]], { brillo: 0.6 }), po([[23.4, 31], [23, 24.4], [18, 29]], { brillo: 0.6 })]
          : [po([[9.4, 31], [10, 24.4], [15, 29.2]], { brillo: 0.6 }), po([[16, 30], [20, 24.6], [22, 31]], { brillo: 0.6, tono: 2 })];
      const o = pintarPelo(orejas, rampa('ropaA'), { semilla: 4 });
      for (const [k, val] of o) p.m.set(k, val);
      // interior rosado de las orejas (segundo color) y mejillas de pelo
      const dentro: [number, number][] = v === 'S' ? [[10, 28], [10, 27], [21, 28], [21, 27]] : v === 'I' ? [[11, 28], [11, 27], [19, 28]] : [];
      for (const [x, y] of dentro) p.sobre(x, y, 'ropaB', 2);
      if (v === 'S') { for (const [x, y] of [[7, 42], [7, 43], [8, 44], [24, 42], [24, 43], [23, 44]] as const) p.s(x, y, 'ropaB', 3); p.put(15, 44, '#222034'); p.put(16, 44, '#222034'); }
      if (v === 'I') { for (const [x, y] of [[17, 42], [17, 43], [16, 44]] as const) p.s(x, y, 'ropaB', 3); p.put(8, 44, '#222034'); }
      return conSilueta(cx, p.m);
    }),
  ],
};

// ---------------------------------------------------------------------------
// Bruja
// ---------------------------------------------------------------------------
const BRUJA: DefDisfrazV5 = {
  id: 'especial-bruja', nombre: 'Bruja', coleccion: 'halloween', ocultaPelo: false, ocultaAccesorios: false, ocultaCabeza: true,
  porDefecto: { color: 'morado', color2: 'negro' }, etiquetas: ['bruja', 'sombrero', 'vestido'],
  partes: [
    { ...traje('disfraz-bruja-traje', 'Vestido', ['ropaA', 'ropaB'], (p, c, v) => {
      const y0 = c.y0Torso;
      p.porZona('TCNAM', (x, y, l, z) => p.s(x, y, 'ropaA', z === 'M' ? 3 : tonoZ(l, z)));
      p.porZona('A', (x, y) => { if (!c.z.has((y + 1) * ANCHO + x) || c.z.get((y + 1) * ANCHO + x) !== 'A') p.s(x, y, 'ropaB', 2); });
      // cuello y cinturón
      if (v === 'S') { p.h(12, 19, y0 + 1, 'ropaB', 2); p.s(15, y0 + 1, 'ropaB', 4); p.s(16, y0 + 1, 'ropaB', 3); }
      else if (v === 'N') p.h(12, 19, y0 + 1, 'ropaB', 2);
      p.porZona('T', (x, y) => { if (y === 53) p.s(x, y, 'ropaB', 1); });
      p.porZona('T', (x, y) => { if (y === 53 && (x === 15 || x === 16) && v === 'S') p.s(x, y, 'ropaB', 4); });
      // falda hasta los pies: un trapecio que se ensancha, con pliegues y dobladillo
      const yIni = c.p.yCadera, yFin = 61;
      const mov = c.cuadro >= 1 && c.cuadro <= 4 ? (c.cuadro % 2 === 0 ? 1 : 0) : 0;
      for (let y = yIni; y <= yFin; y++) {
        const a = (y - yIni) / (yFin - yIni);
        const x0 = v === 'I' ? Math.round(11 - a * 3) : Math.round(10 - a * 4), x1 = v === 'I' ? Math.round(19 + a * 3) : Math.round(21 + a * 4);
        for (let x = x0; x <= x1; x++) {
          const borde = x <= x0 + 1 ? 3 : x >= x1 - 1 ? 1 : 2;
          p.s(x, y, 'ropaA', (x + y) % 5 === 0 && y > yIni + 1 ? 1 : borde);
        }
        if (y >= yFin - 1) for (let x = x0; x <= x1; x++) { if ((x + mov) % 3 === 0 && y === yFin) p.m.delete(y * ANCHO + x); else if (y === yFin - 1) p.s(x, y, 'ropaB', 2); }
      }
      // botas negras asoman bajo la falda
      p.porZona('F', (x, y) => { if (y >= 60) p.s(x, y, 'ropaB', 0); });
    }) },
    cabezaDe('disfraz-bruja-sombrero', 'Sombrero', (v) => {
      const cx = ctxDe(v, 0);
      const ala = v === 'I' ? [el(14.6, 34.6, 11.4, 2.3, { brillo: 0.5 })] : [el(16, 34.6, 12, 2.3, { brillo: 0.5 })];
      const cono = v === 'I'
        ? [po([[9, 34], [22, 34], [20, 28.6], [18.6, 23], [14, 18.4], [10.6, 22.4], [11, 28]], { brillo: 0.6 })]
        : [po([[9, 34], [23, 34], [20.6, 28.6], [19, 23.4], [14.8, 19.4], [13, 21.6], [12, 28]], { brillo: 0.6 })];
      const A = pintarPelo([...ala, ...cono], rampa('ropaA'), { semilla: 6 });
      const p = new Pincel(cx);
      for (const [k, val] of A) p.m.set(k, val);
      // banda y hebilla
      for (let x = 8; x <= 24; x++) { p.sobre(x, 32, 'ropaB', 2); p.sobre(x, 31, 'ropaB', 1); }
      if (v === 'S') { p.sobre(15, 31, 'ropaB', 4); p.sobre(16, 31, 'ropaB', 4); p.sobre(15, 32, 'ropaB', 3); p.sobre(16, 32, 'ropaB', 3); }
      if (v === 'I') { p.sobre(12, 31, 'ropaB', 4); p.sobre(12, 32, 'ropaB', 3); }
      return conSilueta(cx, p.m);
    }, 35),
  ],
};

export const DISFRACES: DefDisfrazV5[] = [CALAMAR, MOMIA, VAMPIRO, ZORRO, BRUJA];
