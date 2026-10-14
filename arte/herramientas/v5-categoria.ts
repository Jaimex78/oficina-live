/**
 * Hoja de revisión de una categoría del catálogo v5 (solo para mirar): cada pieza con un maniquí fijo, en frente, espalda, perfiles,
 * un paso de caminar de frente y de perfil, y sentada en las 3 orientaciones.
 *   npx tsx arte/herramientas/v5-categoria.ts arriba|chaqueta|abajo|zapatos [escala]
 */
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { COLORES, PIELES } from '../src/personaje/colores';
import { PRENDAS } from '../src/personaje/v5/prendas';
import type { DefPrenda } from '../src/personaje/v5/prendas';
import { capaCuerpo, capaPrenda, lienzoDeCapas } from '../src/personaje/v5/armado5';
import type { Vista4 } from '../src/personaje/v5/armado5';
import { hoja } from './v5-vista';
import type { Celda } from './v5-vista';

const color = (id: string): readonly string[] => COLORES.find((c) => c.id === id)!.rampa;
export const RAMPAS_MANIQUI = { piel: PIELES[2]!.rampa, ropaA: color('azul-violeta'), ropaB: color('beige'), pantalon: color('gris'), zapatos: color('negro') };
const VISTAS: [Vista4, number, string][] = [['S', 0, 'S'], ['N', 0, 'N'], ['I', 0, 'I'], ['D', 0, 'D'], ['S', 2, 'S paso'], ['I', 2, 'I paso'], ['S', 5, 'S sent'], ['N', 5, 'N sent'], ['I', 5, 'I sent']];

export function celdasDe(def: DefPrenda | null, mani: DefPrenda[], rampas: Record<string, readonly string[]> = RAMPAS_MANIQUI): Celda[] {
  const out: Celda[] = [];
  const solo = process.env.V?.split(',');
  for (const [v, c, et] of VISTAS.filter(([vv, cc]) => !solo || solo.includes(`${vv}${cc}`))) {
    const capas = [capaCuerpo(v, c), ...mani.map((d) => capaPrenda(d, v, c)), ...(def ? [capaPrenda(def, v, c)] : [])];
    out.push({ lienzo: lienzoDeCapas(capas, rampas), etiqueta: def ? `${def.nombre} ${et}` : et });
  }
  return out;
}

if (process.argv[1]?.endsWith('v5-categoria.ts')) {
  const cat = process.argv[2] ?? 'arriba';
  const escala = Number(process.argv[3] ?? 5);
  const lista = PRENDAS.filter((p) => p.capa === cat);
  const porId = (id: string): DefPrenda => PRENDAS.find((p) => p.id === id)!;
  const mani: DefPrenda[] = [];
  if (cat !== 'zapatos') mani.push(porId('zapatos-tenis'));
  if (cat !== 'abajo') mani.push(porId('abajo-pantalon'));
  if (cat !== 'arriba' && cat !== 'chaqueta') mani.push(porId('arriba-camiseta'));
  if (cat === 'chaqueta') mani.push(porId('arriba-camiseta'));
  const celdas = lista.flatMap((d) => celdasDe(d, mani.filter((m) => m.capa !== d.capa)));
  hoja(celdas, { columnas: Number(process.env.COLS ?? 9), escala, ventana: (process.env.VENT?.split(',').map(Number) as [number, number, number, number] | undefined) ?? [2, 43, 28, 21], ruta: process.env.SALIDA ?? join(tmpdir(), 'oficina-live', 'v5', `cat-${cat}.png`) });
}
