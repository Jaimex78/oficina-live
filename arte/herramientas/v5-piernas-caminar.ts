/**
 * Hoja interna de revisión: piernas del cuerpo base y de la falda, y tiras de caminar en 4 direcciones (solo para mirar).
 *   npx tsx herramientas/v5-piernas-caminar.ts <ruta.png>            hoja de ahora
 *   ANTES=<hoja-antes.png> npx tsx herramientas/v5-piernas-caminar.ts <ruta.png>   apila la de antes encima
 */
import { COLORES, PIELES } from '../src/personaje/colores';
import { Lienzo, escribirPng, leerPng, dibujarTexto } from '../src/nucleo';
import { PRENDAS } from '../src/personaje/v5/prendas';
import { capaCuerpo, capaPrenda, lienzoDeCapas } from '../src/personaje/v5/armado5';
import type { Vista4 } from '../src/personaje/v5/armado5';
import { hoja } from './v5-vista';
import type { Celda } from './v5-vista';

const color = (id: string): readonly string[] => COLORES.find((c) => c.id === id)!.rampa;
const R = { piel: PIELES[2]!.rampa, ropaA: color('azul-violeta'), ropaB: color('beige'), pantalon: color('gris'), zapatos: color('negro') };
const p = (id: string) => PRENDAS.find((x) => x.id === id)!;

const celda = (v: Vista4, c: number, ids: string[], et: string): Celda => ({
  lienzo: lienzoDeCapas([capaCuerpo(v, c), ...ids.map((i) => capaPrenda(p(i), v, c))], R),
  etiqueta: et,
});
const ruta = process.argv[2]!;
const base = ruta.replace(/\.png$/, '');
const vent = (process.env.VENT?.split(',').map(Number) as [number, number, number, number] | undefined) ?? [4, 42, 24, 21];
const todas: [Vista4, number][] = [['S', 0], ['N', 0], ['I', 0], ['S', 2], ['N', 2], ['I', 2], ['S', 5], ['N', 5], ['I', 5]];
const v = (ids: string[], nombre: string): Celda[] => todas.map(([vv, c]) => celda(vv, c, ids, `${nombre} ${vv}${c}`));

hoja([...v([], 'base'), ...v(['arriba-camiseta', 'abajo-falda', 'zapatos-tenis'], 'falda'), ...v(['arriba-camiseta', 'abajo-pantalon', 'zapatos-tenis'], 'pant')],
  { columnas: 9, escala: Number(process.env.ESC ?? 6), ventana: vent, ruta: `${base}-a.png` });

const tiras: Celda[] = [];
for (const d of ['S', 'N', 'I', 'D'] as Vista4[]) for (const c of [0, 1, 2, 3, 4]) tiras.push(celda(d, c, ['arriba-camiseta', 'abajo-pantalon', 'zapatos-tenis'], `${d}${c}`));
hoja(tiras, { columnas: 5, escala: Number(process.env.ESCB ?? 4), ventana: (process.env.VENTB?.split(',').map(Number) as [number, number, number, number] | undefined) ?? [2, 27, 28, 36], ruta: `${base}-b.png` });

// apila: [antes-a, antes-b] o solo [a, b]
const partes: { l: Lienzo; t: string }[] = [];
const cargar = (rt: string, t: string): void => { partes.push({ l: leerPng(rt), t }); };
if (process.env.ANTES) { cargar(`${process.env.ANTES}-a.png`, 'ANTES'); }
cargar(`${base}-a.png`, process.env.ANTES ? 'DESPUES' : 'AHORA');
if (process.env.ANTES) cargar(`${process.env.ANTES}-b.png`, 'CAMINAR ANTES');
cargar(`${base}-b.png`, process.env.ANTES ? 'CAMINAR DESPUES' : 'CAMINAR');
const ancho = Math.max(...partes.map((x) => x.l.ancho));
const alto = partes.reduce((s, x) => s + x.l.alto + 12, 0);
const out = new Lienzo(ancho, alto);
out.rect(0, 0, ancho, alto, '#2A2733');
let y = 0;
for (const x of partes) { dibujarTexto(out, x.t, 4, y + 2, '#FFFFFF', 1); out.pegar(x.l, 0, y + 12); y += x.l.alto + 12; }
escribirPng(out, ruta);
