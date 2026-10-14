/**
 * Transcribe a código los perfiles con pelo y chaqueta roja del arte base de Jaime Orozco (archivos 15 y 16).
 * El píxel de juego mide unos 5,33 px de pantalla (celdas de 4 o 6 px alternadas), así que la rejilla es la de los cambios de color:
 * cada tramo entre cambios es exactamente una celda. Escribe `arte/src/personaje/v5/datos-perfiles-pelo.ts`.
 *
 *   npx tsx arte/herramientas/transcribir-perfiles-pelo.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { PNG } from 'pngjs';

const dir = 'arte/referencia/estilo-pixel-gba/';
const archivos = [
  ['izquierdo', '15-DISENADOR-perfil-izquierdo-pelo-chaqueta-roja-ojo-medio-cerrado.png'],
  ['derecho', '16-DISENADOR-perfil-derecho-pelo-chaqueta-roja-ojo-abierto.png'],
] as const;
const EQUIV: Record<string, string> = {
  '#F0C19B': 'b', '#CD8C64': 'c', '#222033': 'd', '#6E442F': 'e', '#ECE9EF': 'f', '#FFFEFD': 'g', '#603B33': 'h',
  '#C38F65': 'i', '#E58A65': 'j', '#9193A4': 'k', '#C7C2D0': 'l', '#A16643': 'm', '#FFFFFF': 'n', '#000000': 'a',
  '#383137': 'o', '#443E4F': 'p', '#2C2832': 'q', '#5F545D': 'r',
  '#681E2A': 'W', '#8E2C36': 'X', '#B9434B': 'Y', '#D46071': 'Z',
};
const FONDO = '#DDEEDC';

const info: Record<string, { x: number[]; y: number[]; filas: string[]; difPx: number }> = {};
for (const [clave, nombre] of archivos) {
  const p = PNG.sync.read(readFileSync(dir + nombre));
  const W = p.width, H = p.height;
  const hexAt = (x: number, y: number): string => { const i = (y * W + x) * 4; return '#' + [0, 1, 2].map((k) => p.data[i + k]!.toString(16).padStart(2, '0')).join('').toUpperCase(); };
  let x0 = W, y0 = H, x1 = 0, y1 = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (hexAt(x, y) !== FONDO) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  const bx: number[] = [x0], by: number[] = [y0];
  for (let x = x0 + 1; x <= x1; x++) { let d = false; for (let y = y0; y <= y1 && !d; y++) if (hexAt(x, y) !== hexAt(x - 1, y)) d = true; if (d) bx.push(x); }
  for (let y = y0 + 1; y <= y1; y++) { let d = false; for (let x = x0; x <= x1 && !d; x++) if (hexAt(x, y) !== hexAt(x, y - 1)) d = true; if (d) by.push(y); }
  bx.push(x1 + 1); by.push(y1 + 1);
  const filas: string[] = [];
  for (let r = 0; r < by.length - 1; r++) {
    let s = '';
    for (let c = 0; c < bx.length - 1; c++) {
      const h = hexAt(Math.floor((bx[c]! + bx[c + 1]!) / 2), Math.floor((by[r]! + by[r + 1]!) / 2));
      if (h === FONDO) { s += '.'; continue; }
      const l = EQUIV[h];
      if (!l) throw new Error(`${nombre}: color sin equivalencia ${h}`);
      s += l;
    }
    filas.push(s);
  }
  // reconstruye el raster y cuenta píxeles distintos (el PNG original tiene colores corridos: se compara por equivalencia)
  let dif = 0;
  for (let r = 0; r < by.length - 1; r++) for (let c = 0; c < bx.length - 1; c++) {
    const esperado = filas[r]![c]!;
    for (let y = by[r]!; y < by[r + 1]!; y++) for (let x = bx[c]!; x < bx[c + 1]!; x++) {
      const h = hexAt(x, y); const l = h === FONDO ? '.' : EQUIV[h];
      if (l !== esperado) dif++;
    }
  }
  info[clave] = { x: bx, y: by, filas, difPx: dif };
  console.log(clave, 'columnas', bx.length - 1, 'filas', by.length - 1, 'píxeles de pantalla distintos al reconstruir:', dif);
}
let out = `/**\n * Transcripción literal de los perfiles con pelo y chaqueta roja del arte base de Jaime Orozco (archivos 15 y 16).\n * Generado por \`arte/herramientas/transcribir-perfiles-pelo.ts\`: no se edita a mano. Cada figura mide 21 columnas por 34 filas de píxeles de juego.\n * El 15 lleva el ojo medio cerrado (espabilar) y el 16 el ojo abierto. Letras = \`LEYENDA\` de \`datos-disenador.ts\` más W X Y Z (los 4 rojos de la chaqueta, de oscuro a claro).\n */\n\n`;
out += `/** Los 4 tonos de la chaqueta roja, del más oscuro al más claro (las demás letras son las de LEYENDA). */\nexport const LEYENDA_ROJA: Readonly<Record<string, string>> = { W: '#681E2A', X: '#8E2C36', Y: '#B9434B', Z: '#D46071' };\n`;
out += `export const COLORES_PNG_PELO: Readonly<Record<string, string>> = ${JSON.stringify(EQUIV)};\nexport const FONDO_PNG_PELO = '${FONDO}';\n\n`;
for (const [clave] of archivos) {
  const i = info[clave]!;
  const K = clave.toUpperCase();
  out += `export const PERFIL_PELO_${K}: readonly string[] = [\n${i.filas.map((f) => `  '${f}',`).join('\n')}\n];\nexport const BORDES_X_PELO_${K}: readonly number[] = ${JSON.stringify(i.x)};\nexport const BORDES_Y_PELO_${K}: readonly number[] = ${JSON.stringify(i.y)};\n\n`;
}
writeFileSync('arte/src/personaje/v5/datos-perfiles-pelo.ts', out);
