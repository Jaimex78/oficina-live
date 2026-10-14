import { objetoPorId } from '@ol/shared';
import { frame, hoja, type Elemento } from './_atlas';
import { join } from 'node:path';
// uso: _ver.ts [--esc=4] id[:orientaciones|:todas] ...
const args = process.argv.slice(2);
const esc = Number((args.find((a) => a.startsWith('--esc=')) ?? '--esc=4').slice(6));
const els: Elemento[] = [];
let x = 4, y = 4, fila = 0;
for (const a of args.filter((a) => !a.startsWith('--'))) {
  const [id, ors] = a.split(':');
  const o = objetoPorId(id!);
  if (!o) { console.log('sin objeto', id); continue; }
  for (const or of ors === 'todas' || !ors ? o.orientaciones : ors.split('')) {
    const fid = o.frames[or]?.base;
    const im = fid ? frame(fid) : null;
    if (!im) { console.log('sin frame', id, or, fid); continue; }
    if (x + im.w > 1600 / esc) { x = 4; y += fila + 6; fila = 0; }
    els.push({ im, x, y }); x += im.w + 8; fila = Math.max(fila, im.h);
  }
}
hoja(1600 / esc + 10, y + fila + 8, esc, els, 32, join(process.cwd(), 'arte/referencia/propia/armado-realista/_tmp.png'));
