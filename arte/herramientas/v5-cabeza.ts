/** Hoja de revisión de piezas de cabeza (solo para mirar): vello | sombrero | gafas, sobre el maniquí con el peinado 7. npx tsx arte/herramientas/v5-cabeza.ts vello|sombrero|gafas [escala] */
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { COLORES, PELOS, PIELES } from '../src/personaje/colores';
import { PRENDAS } from '../src/personaje/v5/prendas';
import { capaCuerpo, capaPrenda, lienzoDeCapas } from '../src/personaje/v5/armado5';
import type { Vista4 } from '../src/personaje/v5/armado5';
import { capasPeinado, PEINADOS_V5 } from '../src/personaje/v5/cabeza';
import { GAFAS, SOMBREROS, VELLOS } from '../src/personaje/v5/accesorios';
import type { DefAccesorio } from '../src/personaje/v5/accesorios';
import { ANCHO } from '../src/personaje/v5/datos-disenador';
import type { Capa } from '../src/personaje/v5/disenador';
import { espejoCapa } from '../src/personaje/v5/disenador';
import { hoja } from './v5-vista';
import type { Celda } from './v5-vista';

const id = (i: string) => PRENDAS.find((p) => p.id === i)!;
const color = (i: string): readonly string[] => COLORES.find((c) => c.id === i)!.rampa;
const cat = process.argv[2] ?? 'sombrero';
const escala = Number(process.argv[3] ?? 6);
const lista: DefAccesorio[] = cat === 'vello' ? VELLOS : cat === 'gafas' ? GAFAS : SOMBREROS;
const corta = (c: Capa, desde: number): Capa => { const o: Capa = new Map(); for (const [k, v] of c) if (Math.floor(k / ANCHO) >= desde) o.set(k, v); return o; };
const peinado = PEINADOS_V5.find((p) => p.id === (process.env.PEINADO ?? 'p7'))!;
const celdas: Celda[] = [];
for (const [i, d] of lista.entries()) {
  const rampas = { piel: PIELES[2]!.rampa, cabello: PELOS[2]!.rampa, ropaA: color('azul-violeta'), ropaB: color('beige'), pantalon: color('gris'), zapatos: color('negro'), accA: color(['rojo', 'verde', 'negro', 'amarillo'][i % 4]!), accB: color(['negro', 'blanco', 'gris', 'azul-violeta'][i % 4]!) };
  for (const v of ['S', 'N', 'I', 'D'] as Vista4[]) {
    const b = (v === 'D' ? 'I' : v) as 'S' | 'N' | 'I';
    const c = capasPeinado(peinado, b);
    const f = (x: Capa): Capa => (v === 'D' ? espejoCapa(x) : x);
    const ac = d.vistas.includes(b) ? f(d.dibujar(b)) : new Map();
    const corte = d.ocultaPeloSobre;
    const capas = [f(c.atras), capaCuerpo(v, 0), capaPrenda(id('abajo-pantalon'), v, 0), capaPrenda(id('arriba-camiseta'), v, 0), corte ? corta(f(c.frente), corte) : f(c.frente), ac];
    celdas.push({ lienzo: lienzoDeCapas(d.capa === 'barba' ? [f(c.atras), capaCuerpo(v, 0), capaPrenda(id('arriba-camiseta'), v, 0), ac, f(c.frente)] : capas, rampas), etiqueta: `${d.nombre} ${v}` });
  }
}
hoja(celdas, { columnas: 8, escala, ventana: [1, 22, 30, 28], ruta: join(tmpdir(), 'oficina-live', 'v5', `cab-${cat}.png`) });
