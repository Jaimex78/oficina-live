/**
 * Medidor de las capturas de referencia de Gather (solo estudio: no copia ni calca píxeles, solo mide).
 *
 * Uso, desde la raíz del repositorio:
 *   npx tsx arte/herramientas/medir-gather.ts colores  <png> x y w h [cuantos=12] [paso=6]
 *   npx tsx arte/herramientas/medir-gather.ts filas    <png> y x0 x1 [tolerancia=18]
 *   npx tsx arte/herramientas/medir-gather.ts columnas <png> x y0 y1 [tolerancia=18]
 *   npx tsx arte/herramientas/medir-gather.ts ficha    <png de escritorios>
 *
 * - `colores`: los colores más frecuentes de una región, cuantizados a `paso` niveles, con el vecino más cercano de
 *   nuestra paleta y la distancia en OKLab (menos de 0,03 se lee igual a simple vista).
 * - `filas` y `columnas`: tramos de color parejo a lo largo de una línea. Sirven para medir alturas de tapa, labio y
 *   frente de un escritorio, o el periodo de un patrón de alfombra.
 * - `ficha`: la tabla de materiales de `GUIA-ESTILO-GATHER-V2.md` (regiones fijas de `usuario-escritorios-product-team.png`).
 *
 * Las capturas JPEG se pasan antes a PNG (`sips -s format png entrada.jpg --out salida.png`).
 */

import { readFileSync } from 'node:fs';
import { PNG } from 'pngjs';
import { hexAOklch, RAMPAS } from '../src/nucleo';

interface Rgb {
  r: number;
  g: number;
  b: number;
}

function cargar(ruta: string): PNG {
  return PNG.sync.read(readFileSync(ruta));
}

function leer(p: PNG, x: number, y: number): Rgb {
  const i = (y * p.width + x) * 4;
  return { r: p.data[i] ?? 0, g: p.data[i + 1] ?? 0, b: p.data[i + 2] ?? 0 };
}

const hex = (c: Rgb): string => `#${[c.r, c.g, c.b].map((v) => Math.min(255, v).toString(16).padStart(2, '0')).join('')}`.toUpperCase();

function oklab(h: string): [number, number, number] {
  const { L, C, h: tono } = hexAOklch(h);
  const rad = (tono * Math.PI) / 180;
  return [L, C * Math.cos(rad), C * Math.sin(rad)];
}

const PALETA: { nombre: string; hex: string; lab: [number, number, number] }[] = [];
for (const [rampa, tonos] of Object.entries(RAMPAS)) {
  tonos.forEach((h, i) => PALETA.push({ nombre: `${rampa}-${i}`, hex: h, lab: oklab(h) }));
}

function vecino(h: string): { nombre: string; hex: string; d: number } {
  const lab = oklab(h);
  let mejor = PALETA[0]!;
  let d = Infinity;
  for (const e of PALETA) {
    const dd = Math.hypot(lab[0] - e.lab[0], lab[1] - e.lab[1], lab[2] - e.lab[2]);
    if (dd < d) {
      d = dd;
      mejor = e;
    }
  }
  return { nombre: mejor.nombre, hex: mejor.hex, d };
}

export function coloresDe(p: PNG, x: number, y: number, w: number, h: number, cuantos = 12, paso = 6): { hex: string; n: number }[] {
  const m = new Map<string, number>();
  for (let j = y; j < y + h; j++) {
    for (let i = x; i < x + w; i++) {
      const c = leer(p, i, j);
      const q = (v: number): number => Math.min(255, Math.round(v / paso) * paso);
      const k = hex({ r: q(c.r), g: q(c.g), b: q(c.b) });
      m.set(k, (m.get(k) ?? 0) + 1);
    }
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, cuantos).map(([k, n]) => ({ hex: k, n }));
}

function tramos(valores: Rgb[], desde: number, tolerancia: number): string[] {
  const salida: string[] = [];
  let previo: Rgb | null = null;
  let inicio = 0;
  valores.forEach((c, i) => {
    if (previo && Math.abs(c.r - previo.r) + Math.abs(c.g - previo.g) + Math.abs(c.b - previo.b) > tolerancia) {
      salida.push(`${desde + inicio}:${i - inicio}:${hex(previo)}`);
      inicio = i;
    }
    previo = c;
  });
  if (previo) salida.push(`${desde + inicio}:${valores.length - inicio}:${hex(previo)}`);
  return salida;
}

function imprimirColores(p: PNG, x: number, y: number, w: number, h: number, cuantos: number, paso: number): void {
  for (const { hex: k, n } of coloresDe(p, x, y, w, h, cuantos, paso)) {
    const v = vecino(k);
    console.log(`${k} x${n}  ->  ${v.nombre} ${v.hex}  dE=${v.d.toFixed(3)}`);
  }
}

/** Regiones fijas de la captura de escritorios (coordenadas de la imagen de 604 x 354). */
const FICHA: ReadonlyArray<readonly [string, number, number, number, number]> = [
  ['tapa del escritorio', 250, 105, 12, 30],
  ['labio', 250, 136, 100, 5],
  ['frente', 250, 142, 100, 9],
  ['silla', 292, 153, 32, 26],
  ['alfombra gris', 250, 190, 100, 60],
  ['piso crema', 180, 10, 60, 100],
  ['torre', 277, 86, 14, 38],
  ['monitor central', 287, 87, 33, 24],
  ['teclado', 296, 125, 30, 9],
  ['control de videojuego', 272, 124, 22, 12],
  ['planta', 503, 92, 28, 28],
  ['lámpara', 576, 74, 24, 32],
  ['mochila', 490, 148, 34, 34],
  ['alfombra morada', 0, 10, 150, 90],
];

const [, , modo, ruta, ...resto] = process.argv;
if (modo !== undefined && ruta !== undefined && import.meta.url === `file://${process.argv[1]}`) {
  const p = cargar(ruta);
  const n = (i: number, def: number): number => (resto[i] === undefined ? def : Number(resto[i]));
  if (modo === 'colores') imprimirColores(p, n(0, 0), n(1, 0), n(2, p.width), n(3, p.height), n(4, 12), n(5, 6));
  else if (modo === 'filas') {
    const y = n(0, 0);
    const x0 = n(1, 0);
    const x1 = n(2, p.width - 1);
    console.log(tramos(Array.from({ length: x1 - x0 + 1 }, (_, i) => leer(p, x0 + i, y)), x0, n(3, 18)).join('  '));
  } else if (modo === 'columnas') {
    const x = n(0, 0);
    const y0 = n(1, 0);
    const y1 = n(2, p.height - 1);
    console.log(tramos(Array.from({ length: y1 - y0 + 1 }, (_, i) => leer(p, x, y0 + i)), y0, n(3, 18)).join('  '));
  } else if (modo === 'ficha') {
    for (const [nombre, x, y, w, h] of FICHA) {
      console.log(`== ${nombre}`);
      imprimirColores(p, x, y, w, h, 6, 6);
    }
  } else console.error(`Modo desconocido: ${modo}`);
}

