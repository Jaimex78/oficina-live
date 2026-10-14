/** Lector sencillo de los atlas publicados: devuelve los píxeles RGBA de cualquier frame por su id. */
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DIR_CAT = join(RAIZ, 'shared', 'src', 'catalogo');
const DIR_PNG = join(RAIZ, 'web', 'public', 'assets', 'arte');

export interface Imagen {
  w: number;
  h: number;
  d: Uint8Array;
}
interface Marco {
  x: number;
  y: number;
  w: number;
  h: number;
}
const atlas = new Map<string, { png: PNG; marcos: Record<string, Marco> }>();
const donde = new Map<string, string>();
for (const f of readdirSync(DIR_CAT).filter((n) => /^objetos-v.*\.json$/.test(n))) {
  const cat = JSON.parse(readFileSync(join(DIR_CAT, f), 'utf8')) as { archivo: string; frames: Record<string, Marco> };
  atlas.set(cat.archivo, { png: PNG.sync.read(readFileSync(join(DIR_PNG, cat.archivo))), marcos: cat.frames });
  for (const id of Object.keys(cat.frames)) donde.set(id, cat.archivo);
}

export function frame(id: string): Imagen | null {
  const a = donde.get(id);
  if (!a) return null;
  const { png, marcos } = atlas.get(a)!;
  const m = marcos[id]!;
  const d = new Uint8Array(m.w * m.h * 4);
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) for (let c = 0; c < 4; c++) d[(y * m.w + x) * 4 + c] = png.data[((m.y + y) * png.width + m.x + x) * 4 + c]!;
  return { w: m.w, h: m.h, d };
}

/** Caja de píxeles no transparentes (alfa > 20). */
export function caja(im: Imagen, umbral = 20): { x0: number; y0: number; x1: number; y1: number } | null {
  let x0 = im.w, y0 = im.h, x1 = -1, y1 = -1;
  for (let y = 0; y < im.h; y++) for (let x = 0; x < im.w; x++) if (im.d[(y * im.w + x) * 4 + 3]! >= umbral) {
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  return x1 < 0 ? null : { x0, y0, x1, y1 };
}

export interface Elemento {
  im: Imagen;
  x: number;
  y: number;
  /** Rectángulos a dibujar encima (en coordenadas de la hoja ya escaladas por `esc`): [x,y,w,h,color]. */
  marcos?: [number, number, number, number, string][];
}
const hex = (c: string): [number, number, number] => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];

/** Dibuja una hoja: imágenes con escala `esc` sobre un fondo, con rejilla de casillas opcional y rectángulos. */
export function hoja(ancho: number, alto: number, esc: number, elementos: Elemento[], rejilla = 32, ruta?: string): PNG {
  const out = new PNG({ width: ancho * esc, height: alto * esc });
  for (let i = 0; i < out.data.length; i += 4) { out.data[i] = 150; out.data[i + 1] = 152; out.data[i + 2] = 160; out.data[i + 3] = 255; }
  const pon = (X: number, Y: number, r: number, g: number, b: number, a = 255) => {
    if (X < 0 || Y < 0 || X >= out.width || Y >= out.height) return;
    const k = (Y * out.width + X) * 4;
    const t = a / 255;
    out.data[k] = out.data[k]! * (1 - t) + r * t; out.data[k + 1] = out.data[k + 1]! * (1 - t) + g * t; out.data[k + 2] = out.data[k + 2]! * (1 - t) + b * t; out.data[k + 3] = 255;
  };
  for (const e of elementos) {
    for (let y = 0; y < e.im.h; y++) for (let x = 0; x < e.im.w; x++) {
      const k = (y * e.im.w + x) * 4;
      const a = e.im.d[k + 3]!;
      if (a === 0) continue;
      for (let sy = 0; sy < esc; sy++) for (let sx = 0; sx < esc; sx++) pon((e.x + x) * esc + sx, (e.y + y) * esc + sy, e.im.d[k]!, e.im.d[k + 1]!, e.im.d[k + 2]!, a);
    }
  }
  if (rejilla) for (let X = 0; X < out.width; X++) for (let Y = 0; Y < out.height; Y++) if (X % (rejilla * esc) === 0 || Y % (rejilla * esc) === 0) pon(X, Y, 255, 255, 255, 40);
  for (const e of elementos) for (const [x, y, w, h, c] of e.marcos ?? []) {
    const [r, g, b] = hex(c);
    for (let X = x; X < x + w; X++) { pon(X, y, r, g, b); pon(X, y + h - 1, r, g, b); }
    for (let Y = y; Y < y + h; Y++) { pon(x, Y, r, g, b); pon(x + w - 1, Y, r, g, b); }
  }
  if (ruta) { mkdirSync(dirname(ruta), { recursive: true }); writeFileSync(ruta, PNG.sync.write(out)); }
  return out;
}
