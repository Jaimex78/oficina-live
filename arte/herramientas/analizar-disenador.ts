import { readFileSync } from 'node:fs';
import { PNG } from 'pngjs';
const dir = 'arte/referencia/estilo-pixel-gba/';
for (const n of process.argv.slice(2)) {
  const p = PNG.sync.read(readFileSync(dir + n));
  const W = p.width, H = p.height;
  const cols = new Map<string, number>();
  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  let alfas = new Set<number>();
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4; const a = p.data[i + 3]!; alfas.add(a);
    if (a === 0) continue;
    x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
    const h = '#' + [0, 1, 2].map((k) => p.data[i + k]!.toString(16).padStart(2, '0')).join('').toUpperCase();
    cols.set(h, (cols.get(h) ?? 0) + 1);
  }
  console.log(n, W, H, 'bbox', x0, y0, x1, y1, 'w', x1 - x0 + 1, 'h', y1 - y0 + 1, 'alfas', [...alfas].join(','));
  console.log([...cols.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}:${v}`).join(' '));
  // runs
  const hist = new Map<number, number>();
  for (let y = y0; y <= y1; y++) { let r = 1; for (let x = x0 + 1; x <= x1 + 1; x++) { const a = x <= x1 ? (y * W + x) * 4 : -1; const b = (y * W + x - 1) * 4; if (a >= 0 && p.data[a] === p.data[b] && p.data[a + 1] === p.data[b + 1] && p.data[a + 2] === p.data[b + 2] && p.data[a + 3] === p.data[b + 3]) r++; else { hist.set(r, (hist.get(r) ?? 0) + 1); r = 1; } } }
  console.log('runs', [...hist.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => `${k}:${v}`).join(' '));
}
