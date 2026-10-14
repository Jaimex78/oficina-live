/** Estudio: convierte una captura de Gather de escala 8 en su rejilla de píxeles de juego y la imprime con letras de clase (no guarda nada). */
import { readFileSync } from 'node:fs';
import { PNG } from 'pngjs';
const dir = process.env.REFERENCIA ?? 'arte/referencia/gather/avatar/';
const [nombre, ox, oy, cols, filas, esc] = [process.argv[2]!, +process.argv[3]!, +process.argv[4]!, +process.argv[5]!, +process.argv[6]!, +(process.argv[7] ?? 8)];
const p = PNG.sync.read(readFileSync(dir + nombre));
const clase = (r: number, g: number, b: number): string => {
  const l = (r * 299 + g * 587 + b * 114) / 1000;
  if (r < 22 && g < 22 && b < 28) return 'K';
  if (r > 215 && g > 215 && b > 200 && Math.abs(r - b) < 25) return 'W';
  if (r > g + 25 && g > b + 15 && l > 150) return r > 235 && g > 170 ? 'S' : 's';
  if (r > g + 40 && l > 120) return 'r';
  if (r > g + 15 && g > b && l < 150) return 'b';
  if (l < 75) return 'h';
  if (l < 100) return 'j';
  if (l < 130) return 'g';
  if (l < 170) return 'G';
  return '.';
};
for (let y = 0; y < filas; y++) {
  let s = String(y).padStart(2) + ' ';
  for (let x = 0; x < cols; x++) {
    const px = Math.round(ox + x * esc + esc / 2), py = Math.round(oy + y * esc + esc / 2);
    const i = (py * p.width + px) * 4;
    s += clase(p.data[i]!, p.data[i + 1]!, p.data[i + 2]!);
  }
  console.log(s);
}
