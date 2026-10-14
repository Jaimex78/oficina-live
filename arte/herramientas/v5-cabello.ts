/** Hoja de revisión de los 12 peinados (solo para mirar): S, N, I y D sobre el maniquí, en 3 pieles. npx tsx arte/herramientas/v5-cabello.ts [escala] */
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { COLORES, PELOS, PIELES } from '../src/personaje/colores';
import { PRENDAS } from '../src/personaje/v5/prendas';
import { capaCuerpo, capaPrenda, lienzoDeCapas } from '../src/personaje/v5/armado5';
import type { Vista4 } from '../src/personaje/v5/armado5';
import { capasPeinado, PEINADOS_V5 } from '../src/personaje/v5/cabeza';
import { espejoCapa } from '../src/personaje/v5/disenador';
import { hoja } from './v5-vista';
import type { Celda } from './v5-vista';

const id = (i: string) => PRENDAS.find((p) => p.id === i)!;
const color = (i: string): readonly string[] => COLORES.find((c) => c.id === i)!.rampa;
const escala = Number(process.argv[2] ?? 6);
const celdas: Celda[] = [];
PEINADOS_V5.forEach((p, i) => {
  const pelo = PELOS[[1, 5, 3, 2, 6, 9, 4, 0, 7, 1, 5, 3][i]!]!.rampa;
  const rampas = { piel: PIELES[[1, 2, 0, 3, 2, 4, 1, 2, 3, 0, 2, 1][i]!]!.rampa, cabello: p.id === 'p1' ? ['#222034', '#2D2833', '#393137', '#453E50', '#61535E'] : pelo, ropaA: color('azul-violeta'), ropaB: color('beige'), pantalon: color('gris'), zapatos: color('negro') };
  for (const v of ['S', 'N', 'I', 'D'] as Vista4[]) {
    const b = v === 'D' ? 'I' : v;
    const c = capasPeinado(p, b as 'S' | 'N' | 'I');
    const f = (x: typeof c.frente) => (v === 'D' ? espejoCapa(x) : x);
    const capas = [f(c.atras), capaCuerpo(v, 0), capaPrenda(id('abajo-pantalon'), v, 0), capaPrenda(id('arriba-camiseta'), v, 0), f(c.frente)];
    celdas.push({ lienzo: lienzoDeCapas(capas, rampas), etiqueta: `${p.id} ${p.nombre} ${v}` });
  }
});
hoja(celdas, { columnas: 8, escala, ventana: [1, 22, 30, 32], ruta: process.env.SALIDA ?? join(tmpdir(), 'oficina-live', 'v5', 'cabello.png') });
