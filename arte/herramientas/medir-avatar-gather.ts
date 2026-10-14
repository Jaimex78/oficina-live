/** Mide capturas de avatares de Gather (solo estudio): escala del píxel de juego y cajas de la figura. No copia píxeles. */
import { readFileSync } from 'node:fs';
import { PNG } from 'pngjs';

const dir = process.env.REFERENCIA ?? 'arte/referencia/gather/avatar/';
for (const nombre of process.argv.slice(2)) {
  const p = PNG.sync.read(readFileSync(dir + nombre));
  const W = p.width, H = p.height;
  const negro = (x: number, y: number): boolean => {
    const i = (y * W + x) * 4;
    return p.data[i]! < 22 && p.data[i + 1]! < 22 && p.data[i + 2]! < 28 && p.data[i + 3]! > 200;
  };
  // runs de negro horizontales y verticales
  const hist = new Map<number, number>();
  const sumar = (n: number): void => { hist.set(n, (hist.get(n) ?? 0) + 1); };
  for (let y = 0; y < H; y++) { let r = 0; for (let x = 0; x <= W; x++) { if (x < W && negro(x, y)) r++; else { if (r > 0) sumar(r); r = 0; } } }
  for (let x = 0; x < W; x++) { let r = 0; for (let y = 0; y <= H; y++) { if (y < H && negro(x, y)) r++; else { if (r > 0) sumar(r); r = 0; } } }
  const top = [...hist.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => `${k}:${v}`).join(' ');
  // bbox de negro
  let x0 = W, y0 = H, x1 = 0, y1 = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (negro(x, y)) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  console.log(nombre, `${W}x${H}`, `bboxNegro x ${x0}-${x1} y ${y0}-${y1}`, `runs ${top}`);
}
