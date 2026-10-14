/**
 * Transcribe a código los 3 archivos originales del diseñador (32 x 64 px de juego a 4x) y escribe `arte/src/personaje/v5/datos-disenador.ts`.
 * Cada archivo se guarda como filas de letras con una leyenda de colores común. `ver-personajes-v5.ts` comprueba después que
 * la reconstrucción tiene 0 píxeles de diferencia con el PNG original.
 *
 *   npx tsx arte/herramientas/transcribir-disenador.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { PNG } from 'pngjs';

const dir = 'arte/referencia/estilo-pixel-gba/';
const archivos = [
  ['base', '09-DISENADOR-base-calvo-camiseta.png'],
  ['conPelo', '10-DISENADOR-base-con-pelo.png'],
  ['conChaqueta', '11-DISENADOR-base-con-chaqueta.png'],
] as const;
const letras = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const leyenda = new Map<string, string>();
const filas: Record<string, string[]> = {};
for (const [clave, nombre] of archivos) {
  const p = PNG.sync.read(readFileSync(dir + nombre));
  if (p.width !== 128 || p.height !== 256) throw new Error(`${nombre}: tamaño inesperado`);
  const rs: string[] = [];
  for (let gy = 0; gy < 64; gy++) {
    let s = '';
    for (let gx = 0; gx < 32; gx++) {
      const i = (gy * 4 * p.width + gx * 4) * 4;
      if (p.data[i + 3] === 0) { s += '.'; continue; }
      const h = '#' + [0, 1, 2].map((k) => p.data[i + k]!.toString(16).padStart(2, '0')).join('').toUpperCase();
      if (!leyenda.has(h)) leyenda.set(h, letras[leyenda.size]!);
      s += leyenda.get(h)!;
    }
    rs.push(s);
  }
  filas[clave] = rs;
}
const primera = 26, ultima = 62; // las demás filas están vacías en los tres archivos
for (const [clave] of archivos) {
  const rs = filas[clave]!;
  if (rs.slice(0, primera).some((r) => /[^.]/.test(r)) || rs.slice(ultima + 1).some((r) => /[^.]/.test(r))) throw new Error('hay dibujo fuera del rango');
}
let out = `/**\n * Transcripción literal de los 3 archivos del arte base de Jaime Orozco (32 x 64 px de juego; los PNG originales están a 4x, archivos 09, 10 y 11). Generado por \`arte/herramientas/transcribir-disenador.ts\`: no se edita a mano.\n * Cada fila es una fila de píxeles desde la ${primera} hasta la ${ultima} del lienzo; \`.\` es transparente y cada letra un color de \`LEYENDA\`.\n */\n\n`;
out += `export const FILA_INICIAL = ${primera};\nexport const ANCHO = 32;\nexport const ALTO = 64;\n\nexport const LEYENDA: Readonly<Record<string, string>> = {\n`;
for (const [h, l] of leyenda) out += `  ${l}: '${h}',\n`;
out += '};\n\n';
for (const [clave] of archivos) {
  out += `export const ${clave.toUpperCase()}: readonly string[] = [\n`;
  for (const r of filas[clave]!.slice(primera, ultima + 1)) out += `  '${r}',\n`;
  out += '];\n\n';
}
writeFileSync('arte/src/personaje/v5/datos-disenador.ts', out);
console.log('colores', leyenda.size);
