/**
 * Mide la tapa de cada mueble que sirve de apoyo, directamente sobre los dibujos publicados.
 *
 *   npx tsx arte/herramientas/medir-superficies.ts            escribe shared/src/superficies-medidas.ts y la hoja de revisión
 *   npx tsx arte/herramientas/medir-superficies.ts --solo-hoja solo la hoja
 *
 * Tapa = región clara de arriba hasta el labio delantero (donde la luminosidad cae o termina el dibujo), con 2 px de
 * margen respecto del borde visible. Coordenadas en píxeles relativas a la esquina superior izquierda de la huella
 * (la huella es la parte de abajo del dibujo: `sobresale` px de dibujo quedan por encima, así que `y` puede ser negativa).
 * Se mide la orientación «S»; las otras se derivan por márgenes y solo se guardan las que se desvían más de 3 px.
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { INVENTARIO, huellaDe, type ObjetoCatalogo } from '@ol/shared';
import { caja, frame, hoja, type Elemento, type Imagen } from './_atlas';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
const MARGEN = 2;
const lum = (d: Uint8Array, k: number) => 0.299 * d[k]! + 0.587 * d[k + 1]! + 0.114 * d[k + 2]!;

/** Familias que sirven de apoyo. Todo lo demás (estantes altos, juegos, mesas con red o pantalla) queda fuera. */
export function esCandidato(o: ObjetoCatalogo): boolean {
  if (o.apoyado || o.montado || o.pared || o.capa !== 'objeto' || o.interaccion === 'sentarse') return false;
  if (/^(mesa-(billar|air-hockey|poker|pingpong|ajedrez|teams|de-bruja|palabras|lobos|patrones|mazos|terraza))$/.test(o.id)) return false;
  if (/^(escritorio-|mesa-|meson$|barra$|cajonera$|comoda$|aparador-|gabinete-cocina-|gabinete-oficina$|mueble-planos$|baul-vapor$|taquillas-bajas$)/.test(o.id)) return o.ancho * o.alto >= 1;
  return false;
}

/** Mide la tapa de un dibujo (en coordenadas del dibujo). */
export function medirTapa(im: Imagen): Rect | null {
  const { w, h, d } = im;
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3]! >= 128) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  if (x1 < 0) return null;
  // Dos bandas, a 15-30 % y a 70-85 % del ancho: así los enchufes, manijas y cajones del centro no confunden la lectura.
  const bandas: [number, number][] = [
    [Math.floor(x0 + (x1 - x0) * 0.15), Math.ceil(x0 + (x1 - x0) * 0.3)],
    [Math.floor(x0 + (x1 - x0) * 0.7), Math.ceil(x0 + (x1 - x0) * 0.85)],
  ];
  const hasta = (c0: number, c1: number): number => {
    const filaL = (y: number): number | null => {
      let s = 0, n = 0;
      for (let x = c0; x <= c1; x++) { const k = (y * w + x) * 4; if (d[k + 3]! >= 128) { s += lum(d, k); n++; } }
      return n >= (c1 - c0 + 1) * 0.5 ? s / n : null;
    };
    const ref = [0, 1, 2, 3].map((i) => filaL(y0 + 3 + i)).filter((v): v is number => v !== null);
    const Lref = ref.reduce((a, b) => a + b, 0) / Math.max(1, ref.length);
    let ultima = y0 + 3;
    for (let y = y0 + 3; y <= y1; y++) {
      const L = filaL(y);
      if (L === null || L < Lref - 42) break;
      ultima = y;
    }
    return ultima;
  };
  const ultima = Math.min(...bandas.map(([a, b]) => hasta(a, b)));
  const bajo = ultima - 1 - MARGEN + 1; // el último renglón claro es el reborde; se descuenta él y el margen
  const rect = { x: x0 + MARGEN, y: y0 + MARGEN, w: x1 - x0 + 1 - 2 * MARGEN, h: bajo - (y0 + MARGEN) };
  return rect.w > 4 && rect.h > 3 ? rect : null;
}

const aHuella = (r: Rect, o: ObjetoCatalogo): Rect => ({ ...r, y: r.y - o.sobresale });

/** Deriva la tapa de otra orientación a partir de la «S» con los márgenes (la vista siempre es desde el sur: el labio queda abajo). */
export function derivar(s: Rect, o: ObjetoCatalogo, orientacion: string): Rect {
  const hs = huellaDe(o, 'S');
  const hn = huellaDe(o, orientacion);
  const Ws = hs.ancho * 32, Hs = hs.alto * 32, Wn = hn.ancho * 32, Hn = hn.alto * 32;
  const izq = s.x, der = Ws - (s.x + s.w), atras = s.y, frente = Hs - (s.y + s.h);
  return { x: izq, y: atras, w: Wn - izq - der, h: Hn - atras - frente };
}

const SALIDA_TS = join(process.cwd(), 'shared/src/superficies-medidas.ts');
const SALIDA_CAJAS = join(process.cwd(), 'shared/src/superficies-cajas.ts');
const HOJAS = join(process.cwd(), 'arte/referencia/propia/armado-realista');

function main() {
  const solo = process.argv.includes('--solo-hoja');
  const medidas: Record<string, Rect> = {};
  const otras: Record<string, Record<string, Rect>> = {};
  const sin: string[] = [];
  const elementos: Elemento[] = [];
  let x = 4, y = 4, fila = 0;
  for (const o of INVENTARIO.filter(esCandidato)) {
    const fS = o.frames[o.orientaciones.includes('S') ? 'S' : (o.orientaciones[0] as string)]?.base;
    const im = fS ? frame(fS) : null;
    const t = im ? medirTapa(im) : null;
    if (!im || !t) { sin.push(o.id); continue; }
    const s = aHuella(t, o);
    medidas[o.id] = s;
    for (const or of o.orientaciones) {
      if (or === 'S' || or === 'U') continue;
      const fo = o.frames[or]?.base;
      const imo = fo ? frame(fo) : null;
      const to = imo ? medirTapa(imo) : null;
      if (!to) continue;
      const real = aHuella(to, o);
      const der = derivar(s, o, or);
      const dif = [real.x - der.x, real.y - der.y, real.w - der.w, real.h - der.h].map(Math.abs);
      // Solo diferencias pequeñas son un dibujo distinto de verdad; las enormes son lecturas malas y se descartan.
      if (dif.some((v) => v > 3) && dif.every((v) => v <= 12)) (otras[o.id] ??= {})[or] = real;
    }
    if (x + im.w + 8 > 400) { x = 4; y += fila + 8; fila = 0; }
    elementos.push({ im, x, y, marcos: [[(x + t.x) * 3, (y + t.y) * 3, t.w * 3, t.h * 3, '#ff2d55']] });
    x += im.w + 8; fila = Math.max(fila, im.h);
  }
  console.log(`${Object.keys(medidas).length} tapas medidas, ${Object.keys(otras).length} con orientaciones distintas, sin tapa: ${sin.join(', ') || 'ninguno'}`);
  hoja(410, y + fila + 8, 3, elementos, 0, join(HOJAS, 'tapas-medidas.png'));
  // Caja visible de cada objeto apoyado (en píxeles del dibujo), por orientación.
  const cajas: Record<string, Record<string, [number, number, number, number]>> = {};
  for (const o of INVENTARIO.filter((q) => q.apoyado)) {
    for (const or of o.orientaciones) {
      const fid = o.frames[or]?.base;
      const im = fid ? frame(fid) : null;
      if (!im) continue;
      const b = caja(im, 128);
      if (b) (cajas[o.id] ??= {})[or] = [b.x0, b.y0, b.x1 - b.x0 + 1, b.y1 - b.y0 + 1];
    }
  }
  if (solo) return;
  const f = (r: Rect) => `{ x: ${r.x}, y: ${r.y}, w: ${r.w}, h: ${r.h} }`;
  const cuerpo = [
    '// GENERADO por arte/herramientas/medir-superficies.ts: no se edita a mano (las correcciones van en `superficies.ts`).',
    '// Tapa de cada mueble en píxeles relativos a la esquina superior izquierda de su huella en orientación «S».',
    "import type { Tapa } from './superficies';",
    '',
    'export const TAPAS_MEDIDAS: Readonly<Record<string, Tapa>> = {',
    ...Object.entries(medidas).map(([id, r]) => `  '${id}': ${f(r)},`),
    '};',
    '',
    '/** Orientaciones cuyo dibujo se aparta de lo derivado por márgenes (cajones, bloques de cajones, etc.). */',
    'export const TAPAS_MEDIDAS_ORIENTACION: Readonly<Record<string, Readonly<Record<string, Tapa>>>> = {',
    ...Object.entries(otras).map(([id, m]) => `  '${id}': { ${Object.entries(m).map(([k, r]) => `${k}: ${f(r)}`).join(', ')} },`),
    '};',
    '',
  ].join('\n');
  writeFileSync(SALIDA_TS, cuerpo);
  const filasCajas = Object.entries(cajas).map(([id, m]) => {
    const claves = Object.keys(m);
    const iguales = claves.every((k) => m[k]!.join() === m[claves[0]!]!.join());
    return `  '${id}': { ${(iguales ? [claves[0]!] : claves).map((k) => `${k}: [${m[k]!.join(', ')}]`).join(', ')} },`;
  });
  writeFileSync(SALIDA_CAJAS, ['// GENERADO por arte/herramientas/medir-superficies.ts: no se edita a mano.', '// Caja visible de cada objeto apoyado en píxeles del dibujo: [x, y, ancho, alto]. Una sola clave = igual en todas las orientaciones.', 'export const CAJAS_APOYADOS: Readonly<Record<string, Readonly<Record<string, readonly [number, number, number, number]>>>> = {', ...filasCajas, '};', ''].join('\n'));
  console.log(`escrito ${SALIDA_TS}`);
}
if (process.argv[1]?.endsWith('medir-superficies.ts')) main();
