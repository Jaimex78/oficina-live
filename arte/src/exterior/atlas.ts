/**
 * Constructor `exterior-v1`: el atlas del exterior de la oficina (calle, andén, edificios vecinos, árboles, carros,
 * gente y mobiliario). Se publica en `web/public/assets/exterior/exterior-v1.png` y `exterior-v1.json`.
 *
 * Hay dos clases de cuadros en el mismo atlas:
 *  - tiles de 32 x 32 (suelo, techos, parapetos, fachadas, máscaras de luz y sombras). El JSON trae `tiles.nombres`,
 *    la lista de sus ids: el motor arma con ellos su mapa de baldosas.
 *  - sprites sueltos (árboles, carros, gente, postes...). El JSON trae `anclas`, el punto donde apoya cada uno en el suelo.
 *
 * Todo es de día y de un solo atlas: la noche la hace el motor con un multiplicador azul, capas de luz y halos.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { registrarConstructor } from '../construir';
import { Lienzo, codificarPng, empaquetar, jsonLegible, rutaRaiz, validarAtlas } from '../nucleo';
import type { ItemSprite, Marco } from '../nucleo';
import { COLORES_AUTO } from './sprites-vehiculos';
import { coloresExterior } from './paleta';
import { spritesArboles, spriteAlcorque, spriteArbusto, spriteSeto, spriteSombraElipse, type SpriteConAncla } from './sprites-vegetacion';
import { spritesGente } from './sprites-gente';
import { spritesMobiliario } from './sprites-mobiliario';
import { spritesTren } from './sprites-tren';
import { spritesVehiculos } from './sprites-vehiculos';
import { TONOS_BLOQUE, tilesFachada, ESTILOS_TECHO, LADOS_PARAPETO, nombreParapeto, nombreTecho, tileFachadaBloque, tileLote, tileParapeto, tileTecho, tileTechoBloque } from './tiles-edificio';
import {
  nombreAnden,
  tileAnden,
  tileAsfalto,
  tileDobleCentro,
  tileFlecha,
  tileVia,
  tileConcreto,
  tilePasto,
  tilePlaza,
  tileSombra,
  tileTierra,
  type LadoBordillo,
} from './tiles-suelo';

/** Carpeta (desde la raíz del repo) donde se publica el atlas del exterior. */
export const DIR_EXTERIOR = join('web', 'public', 'assets', 'exterior');
export const NOMBRE_ATLAS_EXTERIOR = 'exterior-v1';

/** Combinaciones de bordillo que usa el andén: sin bordillo, un lado, y las cuatro esquinas de calle. */
export const COMBOS_ANDEN: readonly (readonly LadoBordillo[])[] = [
  [],
  ['N'],
  ['S'],
  ['E'],
  ['O'],
  ['N', 'E'],
  ['N', 'O'],
  ['S', 'E'],
  ['S', 'O'],
];

export const VARIANTES_ANDEN = ['a', 'b', 'c', 'd'] as const;

interface TileItem {
  id: string;
  lienzo: Lienzo;
}

/** Todos los tiles de 32 x 32, en un orden fijo. */
export function todosLosTiles(): TileItem[] {
  const t: TileItem[] = [];
  const poner = (id: string, lienzo: Lienzo): void => {
    t.push({ id, lienzo });
  };
  VARIANTES_ANDEN.forEach((v, i) => {
    for (const lados of COMBOS_ANDEN) poner(nombreAnden(v, lados), tileAnden(i, lados));
  });
  poner('plaza-a', tilePlaza(0));
  poner('plaza-b', tilePlaza(1));
  poner('concreto-a', tileConcreto(0));
  poner('concreto-b', tileConcreto(1));
  for (const tipo of ['a', 'b', 'c'] as const) poner(`asf-${tipo}`, tileAsfalto(tipo));
  for (const lado of ['N', 'S', 'E', 'O'] as const) poner(`asf-cuneta-${lado.toLowerCase()}`, tileAsfalto('a', { cuneta: lado }));
  poner('asf-guion-h', tileAsfalto('a', { guion: 'h' }));
  poner('asf-guion-v', tileAsfalto('a', { guion: 'v' }));
  poner('asf-doble-h-sup', tileAsfalto('a', { doble: 'h-sup' }));
  poner('asf-doble-h-inf', tileAsfalto('a', { doble: 'h-inf' }));
  poner('asf-doble-v-izq', tileAsfalto('a', { doble: 'v-izq' }));
  poner('asf-doble-v-der', tileAsfalto('a', { doble: 'v-der' }));
  poner('asf-cebra-h', tileAsfalto('a', { cebra: 'h' }));
  poner('asf-cebra-v', tileAsfalto('a', { cebra: 'v' }));
  poner('asf-cebra-h-n', tileAsfalto('a', { cebra: 'h', cuneta: 'N' }));
  poner('asf-cebra-h-s', tileAsfalto('a', { cebra: 'h', cuneta: 'S' }));
  poner('asf-cebra-v-e', tileAsfalto('a', { cebra: 'v', cuneta: 'E' }));
  poner('asf-cebra-v-o', tileAsfalto('a', { cebra: 'v', cuneta: 'O' }));
  for (let i = 0; i < 4; i++) poner(`pasto-${'abcd'[i]}`, tilePasto(i));
  for (let i = 0; i < 2; i++) poner(`tierra-${'ab'[i]}`, tileTierra(i));
  for (const s of ['sur', 'este', 'esquina', 'llena'] as const) poner(`sombra-${s}`, tileSombra(s));
  for (const estilo of ESTILOS_TECHO) {
    poner(nombreTecho(estilo, 'a'), tileTecho(estilo, 0));
    poner(nombreTecho(estilo, 'b'), tileTecho(estilo, 1));
  }
  for (const lado of LADOS_PARAPETO) poner(nombreParapeto(lado), tileParapeto(lado));
  for (const tono of TONOS_BLOQUE) {
    poner(`bloque-techo-${tono}`, tileTechoBloque(tono));
    for (const pos of ['tope', 'medio', 'base'] as const) poner(`bloque-fac-${pos}-${tono}`, tileFachadaBloque(pos, tono));
  }
  for (let i = 0; i < 2; i++) poner(`lote-${'ab'[i]}`, tileLote(i));
  poner('via-n', tileVia('n'));
  poner('via-s', tileVia('s'));
  poner('via-paso-n', tileVia('n', true));
  poner('via-paso-s', tileVia('s', true));
  poner('asf-doble-v-c', tileDobleCentro());
  poner('asf-flecha-o-24-n', tileFlecha('o', 24, 'N'));
  poner('asf-flecha-o-8-s', tileFlecha('o', 8, 'S'));
  poner('asf-flecha-e-24-n', tileFlecha('e', 24, 'N'));
  poner('asf-flecha-e-8-s', tileFlecha('e', 8, 'S'));
  for (const f of tilesFachada()) poner(f.id, f.lienzo);
  return t;
}

/** Sombras y otros sprites sueltos que no son de un grupo grande. */
function spritesVarios(): SpriteConAncla[] {
  return [
    spriteAlcorque(),
    spriteSeto(),
    spriteArbusto('arbusto-g', 30, 1),
    spriteArbusto('arbusto-m', 22, 2),
    spriteArbusto('arbusto-p', 16, 3),
    spriteSombraElipse('sombra-copa-g', 38, 13),
    spriteSombraElipse('sombra-copa-m', 28, 10),
    spriteSombraElipse('sombra-copa-p', 20, 7),
    spriteSombraElipse('sombra-auto-h', 30, 6),
    spriteSombraElipse('sombra-auto-v', 12, 28),
    spriteSombraElipse('sombra-bus', 62, 7),
    spriteSombraElipse('sombra-persona', 6, 3),
    spriteSombraElipse('sombra-poste', 5, 12),
  ];
}

export interface ResultadoExterior {
  atlas: Lienzo;
  frames: Record<string, Marco>;
  tiles: string[];
  anclas: Record<string, { x: number; y: number }>;
  metadatos: Record<string, unknown>;
}

/** Dibuja todo y lo empaqueta (sin escribir nada). */
export function construirExterior(): ResultadoExterior {
  const tiles = todosLosTiles();
  const sprites: SpriteConAncla[] = [...spritesArboles(), ...spritesVarios(), ...spritesVehiculos(), ...spritesTren(), ...spritesGente(), ...spritesMobiliario()];
  const items: ItemSprite[] = [...tiles.map((t) => ({ id: t.id, lienzo: t.lienzo })), ...sprites.map((s) => ({ id: s.id, lienzo: s.lienzo }))];
  const { atlas, frames } = empaquetar(items, { anchoMax: 1024, relleno: 2 });
  const anclas: Record<string, { x: number; y: number }> = {};
  for (const s of [...sprites].sort((a, b) => (a.id < b.id ? -1 : 1))) anclas[s.id] = s.ancla;
  const nombresTiles = tiles.map((t) => t.id);
  const metadatos = {
    nota: 'Exterior de Oficina Live: calle, andén y vecinos vistos desde el piso 4. Solo de día; la noche la hace el motor.',
    tiles: { lado: 32, nombres: nombresTiles },
    anclas,
    colores: COLORES_AUTO,
  };
  return { atlas, frames, tiles: nombresTiles, anclas, metadatos };
}

function escribirSiCambio(ruta: string, contenido: Buffer): boolean {
  if (existsSync(ruta) && readFileSync(ruta).equals(contenido)) return false;
  mkdirSync(dirname(ruta), { recursive: true });
  writeFileSync(ruta, contenido);
  return true;
}

/** Revisa el atlas contra la paleta del exterior y el tope de 128 colores. Devuelve la lista de problemas. */
export function revisarExterior(r: ResultadoExterior): string[] {
  const problemas = validarAtlas(r.atlas, r.frames, { paleta: coloresExterior(), relleno: 2 });
  const usados = r.atlas.colores().size;
  if (usados > 128) problemas.push(`El atlas usa ${usados} colores y el tope es 128.`);
  return problemas;
}

/** Escribe el PNG y el JSON del atlas. `raiz` permite probar sin tocar las carpetas reales. */
export function publicarExterior(r: ResultadoExterior, raiz: string = rutaRaiz()): { rutaPng: string; rutaJson: string; huella: string; cambiado: boolean } {
  const problemas = revisarExterior(r);
  if (problemas.length > 0) throw new Error(`El atlas ${NOMBRE_ATLAS_EXTERIOR} no pasa la validación y no se publicó:\n${problemas.join('\n')}`);
  const png = codificarPng(r.atlas);
  const huella = createHash('sha1').update(png).digest('hex').slice(0, 10);
  const ordenados: Record<string, Marco> = {};
  for (const id of Object.keys(r.frames).sort()) {
    const m = r.frames[id] as Marco;
    ordenados[id] = { x: m.x, y: m.y, w: m.w, h: m.h };
  }
  const manifiesto = {
    version: 1,
    archivo: `${NOMBRE_ATLAS_EXTERIOR}.png`,
    huella,
    ancho: r.atlas.ancho,
    alto: r.atlas.alto,
    frames: ordenados,
    ...r.metadatos,
  };
  const rutaPng = join(raiz, DIR_EXTERIOR, `${NOMBRE_ATLAS_EXTERIOR}.png`);
  const rutaJson = join(raiz, DIR_EXTERIOR, `${NOMBRE_ATLAS_EXTERIOR}.json`);
  const a = escribirSiCambio(rutaPng, png);
  const b = escribirSiCambio(rutaJson, Buffer.from(`${jsonLegible(manifiesto)}\n`, 'utf8'));
  return { rutaPng, rutaJson, huella, cambiado: a || b };
}

registrarConstructor(NOMBRE_ATLAS_EXTERIOR, (ctx) => {
  const r = construirExterior();
  const problemas = revisarExterior(r);
  if (problemas.length > 0) throw new Error(`El exterior no pasa la validación:\n${problemas.slice(0, 20).join('\n')}`);
  ctx.log(`${r.tiles.length} tiles y ${Object.keys(r.frames).length - r.tiles.length} sprites en un atlas de ${r.atlas.ancho}x${r.atlas.alto}, ${r.atlas.colores().size} colores`);
  ctx.guardarPng('exterior-atlas.png', r.atlas);
  ctx.guardarPng('exterior-atlas-x2.png', r.atlas.escalar(2));
  if (ctx.publicar) {
    const p = publicarExterior(r);
    ctx.log(`atlas "${NOMBRE_ATLAS_EXTERIOR}" publicado (${p.huella}${p.cambiado ? '' : ', sin cambios'}) en ${DIR_EXTERIOR}`);
  } else {
    ctx.log(`atlas "${NOMBRE_ATLAS_EXTERIOR}" listo; no se publica (usa --publicar)`);
  }
});
