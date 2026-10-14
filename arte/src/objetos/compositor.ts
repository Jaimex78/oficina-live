/**
 * Compositor de escenas: arma una sala completa con los cuadros de arte, con las mismas reglas de orden que el
 * motor del navegador (la función `profundidades` de shared). Sirve para revisar cada objeto EN CONTEXTO:
 * paredes unidas, sillas junto a escritorios, lo colgado sobre su pared.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { CASILLA, apoyosDe, frameDeColocacion, huellaDe, mascaraPared, objetoPorId, profundidades, type MarcoAtlas, type SalaMapa } from '@ol/shared';
import { Lienzo, leerPng, rutaRaiz } from '../nucleo';

export type ResolverCuadro = (id: string) => Lienzo | undefined;

export interface OpcionesComposicion {
  /** Píxeles libres arriba para lo que sobresale de la primera fila (paredes altas). Por defecto 64. */
  margenSuperior?: number;
  /** Casillas a mostrar: recorta la escena. Por defecto toda la sala. */
  region?: { x: number; y: number; w: number; h: number };
  /** Dibuja lo apoyado sobre la tapa de su mueble, como el navegador (por defecto sí). `false` lo deja donde estaba: sirve para las hojas «antes». */
  apoyos?: boolean;
}

const FONDO = '#14141A';
const FALTA = '#FF00FF';

/** Dibuja un cuadro magenta con la medida esperada cuando el arte todavía no existe. */
function marcadorFalta(ancho: number, alto: number): Lienzo {
  const l = new Lienzo(ancho, alto);
  l.rectBorde(0, 0, ancho, alto, FALTA);
  l.linea(0, 0, ancho - 1, alto - 1, FALTA);
  l.linea(ancho - 1, 0, 0, alto - 1, FALTA);
  return l;
}

export function componerSala(sala: SalaMapa, resolver: ResolverCuadro, opciones: OpcionesComposicion = {}): Lienzo {
  const margen = opciones.margenSuperior ?? 64;
  const lienzo = new Lienzo(sala.ancho * CASILLA, sala.alto * CASILLA + margen);
  lienzo.rect(0, 0, lienzo.ancho, lienzo.alto, FONDO);

  for (let y = 0; y < sala.alto; y++) {
    for (let x = 0; x < sala.ancho; x++) {
      const id = sala.piso[y]?.[x];
      if (!id) continue;
      const o = objetoPorId(id);
      if (!o) continue;
      const cuadro = resolver(frameDeColocacion(o, 'U', 'base')) ?? marcadorFalta(CASILLA, CASILLA);
      lienzo.pegar(cuadro, x * CASILLA, y * CASILLA + margen);
    }
  }

  const prof = profundidades(sala);
  const apoyos = opciones.apoyos === false ? new Map<string, { dx: number; dy: number }>() : apoyosDe(sala);
  const orden = sala.colocaciones.map((_, i) => i).sort((a, b) => (prof[a] ?? 0) - (prof[b] ?? 0) || a - b);
  for (const i of orden) {
    const c = sala.colocaciones[i]!;
    const o = objetoPorId(c.objeto);
    if (!o) continue;
    const h = huellaDe(o, c.orientacion);
    const mascara = o.autotile ? mascaraPared(sala, c.x, c.y) : undefined;
    const id = frameDeColocacion(o, c.orientacion, c.variante, mascara);
    const ancho = h.ancho * CASILLA;
    const alto = h.alto * CASILLA + o.sobresale;
    const cuadro = resolver(id) ?? marcadorFalta(ancho, alto);
    const ap = apoyos.get(c.id);
    lienzo.pegar(cuadro, c.x * CASILLA + (ap?.dx ?? 0), (c.y + h.alto) * CASILLA - cuadro.alto + margen + (ap?.dy ?? 0));
  }

  const r = opciones.region;
  if (!r) return lienzo;
  return lienzo.recortar(r.x * CASILLA, r.y * CASILLA, r.w * CASILLA, r.h * CASILLA + margen);
}

interface AtlasPublicado {
  archivo: string;
  frames: Record<string, MarcoAtlas>;
}

/** Cuadros de todos los atlas de objetos ya publicados (`objetos*.json` y su PNG). Lo que aún no existe queda sin resolver. */
export function resolverDesdePublicados(raiz: string = rutaRaiz()): ResolverCuadro {
  const dirJson = join(raiz, 'shared', 'src', 'catalogo');
  const dirPng = join(raiz, 'web', 'public', 'assets', 'arte');
  const cuadros = new Map<string, { atlas: Lienzo; marco: MarcoAtlas }>();
  if (existsSync(dirJson)) {
    for (const nombre of readdirSync(dirJson).filter((n) => n.startsWith('objetos') && n.endsWith('.json'))) {
      const json = JSON.parse(readFileSync(join(dirJson, nombre), 'utf8')) as AtlasPublicado;
      const rutaPng = join(dirPng, json.archivo);
      if (!existsSync(rutaPng)) continue;
      const atlas = leerPng(rutaPng);
      for (const [id, marco] of Object.entries(json.frames)) cuadros.set(id, { atlas, marco });
    }
  }
  return (id) => {
    const e = cuadros.get(id);
    return e ? e.atlas.recortar(e.marco.x, e.marco.y, e.marco.w, e.marco.h) : undefined;
  };
}

/** Une resolvers: el primero que tenga el cuadro gana (los cuadros en memoria del grupo, luego los publicados). */
export function resolverCombinado(...resolvers: ResolverCuadro[]): ResolverCuadro {
  return (id) => {
    for (const r of resolvers) {
      const c = r(id);
      if (c) return c;
    }
    return undefined;
  };
}
