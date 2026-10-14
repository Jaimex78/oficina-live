/**
 * Transcribe a código los PERFILES del cuerpo base del arte base de Jaime Orozco (archivos 12 y 13).
 *
 * Estos dos PNG no son 4x exactos como el frente: tienen fondo sólido y el píxel de juego mide 6,67 px de pantalla
 * (celdas de 6 u 8 px según el redondeo), así que la rejilla se detecta a partir de los cambios de color. Cada archivo da
 * una figura de 16 columnas x 33 filas, igual de alta que el frente (33). Los colores de estos PNG están corridos unos
 * pocos niveles respecto del 09 (por ejemplo F0C19B en vez de F9BF95); cada color se asigna al color equivalente del 09.
 *
 * Escribe `arte/src/personaje/v5/datos-perfiles.ts` con las filas, los bordes de celda (para reconstruir el raster
 * original y comparar) y la tabla de equivalencias de color.
 *
 *   npx tsx arte/herramientas/transcribir-perfiles.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { PNG } from 'pngjs';

const dir = 'arte/referencia/estilo-pixel-gba/';
const archivos = [
  ['izquierdo', '12-DISENADOR-base-perfil-izquierdo.png'],
  ['derecho', '13-DISENADOR-base-perfil-derecho.png'],
] as const;
const EQUIV: Record<string, string> = {
  '#F0C19B': 'b', '#CD8C64': 'c', '#222033': 'd', '#6E442F': 'e', '#ECE9EF': 'f', '#FFFEFD': 'g', '#603B33': 'h',
  '#C38F65': 'i', '#E58A65': 'j', '#9193A4': 'k', '#C7C2D0': 'l', '#A16643': 'm', '#FFFFFF': 'n', '#000000': 'a',
};
const FONDO = '#E4F1E2';

export function celdas(bordes: number[], largo: number): number[] {
  // añade los bordes ocultos: un tramo de 12 son 2 celdas, de 28 son 4, etc. (los píxeles de esos tramos son iguales)
  const out = [bordes[0]!];
  for (let i = 1; i < bordes.length; i++) {
    const g = bordes[i]! - bordes[i - 1]!;
    const n = Math.max(1, Math.round(g / 6.667));
    for (let k = 1; k <= n; k++) out.push(Math.round(bordes[i - 1]! + (g * k) / n));
  }
  void largo;
  return out;
}

const salida: string[] = [];
const info: Record<string, { x: number[]; y: number[]; filas: string[] }> = {};
for (const [clave, nombre] of archivos) {
  const p = PNG.sync.read(readFileSync(dir + nombre));
  const W = p.width, H = p.height;
  const hexAt = (x: number, y: number): string => { const i = (y * W + x) * 4; return '#' + [0, 1, 2].map((k) => p.data[i + k]!.toString(16).padStart(2, '0')).join('').toUpperCase(); };
  const igualesFila = (a: number, b: number): boolean => { for (let x = 0; x < W; x++) if (hexAt(x, a) !== hexAt(x, b)) return false; return true; };
  const igualesCol = (a: number, b: number): boolean => { for (let y = 0; y < H; y++) if (hexAt(a, y) !== hexAt(b, y)) return false; return true; };
  // caja de la figura
  let x0 = W, y0 = H, x1 = 0, y1 = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (hexAt(x, y) !== FONDO) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  const by: number[] = [y0], bx: number[] = [x0];
  for (let y = y0 + 1; y <= y1; y++) if (!igualesFila(y, y - 1)) by.push(y);
  for (let x = x0 + 1; x <= x1; x++) if (!igualesCol(x, x - 1)) bx.push(x);
  by.push(y1 + 1); bx.push(x1 + 1);
  const ey = celdas(by, H), ex = celdas(bx, W);
  const filas: string[] = [];
  for (let r = 0; r < ey.length - 1; r++) {
    let s = '';
    for (let c = 0; c < ex.length - 1; c++) {
      const h = hexAt(Math.floor((ex[c]! + ex[c + 1]!) / 2), Math.floor((ey[r]! + ey[r + 1]!) / 2));
      if (h === FONDO) { s += '.'; continue; }
      const l = EQUIV[h];
      if (!l) throw new Error(`${nombre}: color sin equivalencia ${h}`);
      s += l;
    }
    filas.push(s);
  }
  info[clave] = { x: ex, y: ey, filas };
  console.log(clave, 'columnas', ex.length - 1, 'filas', ey.length - 1);
}
let out = `/**\n * Transcripción literal de los perfiles del cuerpo base del arte base de Jaime Orozco (archivos 12 y 13).\n * Generado por \`arte/herramientas/transcribir-perfiles.ts\`: no se edita a mano. Cada figura mide 16 columnas x 33 filas de píxeles de juego\n * (la misma altura que el frente del 09). \`BORDES_X\` y \`BORDES_Y\` son los bordes de celda en el PNG original (píxeles de pantalla)\n * y sirven para reconstruir el raster y comprobar la diferencia. Letras = colores de \`LEYENDA\` de \`datos-disenador.ts\`.\n */\n\n`;
out += `export const COLORES_PNG: Readonly<Record<string, string>> = ${JSON.stringify(EQUIV)};\nexport const FONDO_PNG = '${FONDO}';\n\n`;
for (const [clave] of archivos) {
  const i = info[clave]!;
  const K = clave.toUpperCase();
  out += `export const PERFIL_${K}: readonly string[] = [\n${i.filas.map((f) => `  '${f}',`).join('\n')}\n];\nexport const BORDES_X_${K}: readonly number[] = ${JSON.stringify(i.x)};\nexport const BORDES_Y_${K}: readonly number[] = ${JSON.stringify(i.y)};\n\n`;
}
writeFileSync('arte/src/personaje/v5/datos-perfiles.ts', out);
void salida;
