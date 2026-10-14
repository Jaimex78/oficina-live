import { readFileSync } from 'node:fs';
import { PNG } from 'pngjs';
const dir = 'arte/referencia/estilo-pixel-gba/';
const n = process.argv[2]!;
const p = PNG.sync.read(readFileSync(dir + n));
const letras = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const map = new Map<string, string>();
const hexAt = (gx: number, gy: number): string | null => { const i = ((gy * 4) * p.width + gx * 4) * 4; if (p.data[i + 3] === 0) return null; return '#' + [0, 1, 2].map((k) => p.data[i + k]!.toString(16).padStart(2, '0')).join('').toUpperCase(); };
// verificar que cada bloque 4x4 es uniforme
let bad = 0;
for (let gy = 0; gy < 64; gy++) for (let gx = 0; gx < 32; gx++) { const h0 = hexAt(gx, gy); for (let dy = 0; dy < 4; dy++) for (let dx = 0; dx < 4; dx++) { const i = ((gy * 4 + dy) * p.width + gx * 4 + dx) * 4; const h = p.data[i + 3] === 0 ? null : '#' + [0, 1, 2].map((k) => p.data[i + k]!.toString(16).padStart(2, '0')).join('').toUpperCase(); if (h !== h0) bad++; } }
console.log('bloques no uniformes:', bad);
const rows: string[] = [];
for (let gy = 0; gy < 64; gy++) { let s = ''; for (let gx = 0; gx < 32; gx++) { const h = hexAt(gx, gy); if (!h) { s += '.'; continue; } if (!map.has(h)) map.set(h, letras[map.size]!); s += map.get(h); } rows.push(s); }
rows.forEach((r, i) => { if (/[^.]/.test(r)) console.log(String(i).padStart(2), r); });
console.log([...map.entries()].map(([h, l]) => `${l}=${h}`).join(' '));
