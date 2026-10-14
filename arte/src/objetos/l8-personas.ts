/**
 * Personas en las escenas de revisión: arma los personajes del atlas publicado y los pone sentados o de pie en una sala,
 * en el orden de dibujo del motor (`profundidades` de shared). Sirve para comparar un puesto de trabajo completo con la
 * referencia de Gather (material de estudio local de terceros).
 *
 *  - Sentadas: el sprite de 32 x 48 con el cuadro 3 del personaje, anclado abajo al centro de la casilla de la silla,
 *    3 px sobre su borde inferior, a la profundidad de la silla más 0,6.
 *  - De pie: anclado a `y * 32 + 24` y dibujado a la profundidad de sus pies.
 * El sprite del personaje no lleva la silla: la pone el objeto `silla-oficina` del atlas.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { CASILLA, frameDeColocacion, huellaDe, mascaraPared, migrarAvatar, objetoPorId, planDeAvatar, profundidades } from '@ol/shared';
import type { AvatarSpec, CatalogoPersonaje, Direccion, SalaMapa } from '@ol/shared';
import { Lienzo, leerPng, recolorearConRampas, rutaRaiz } from '../nucleo';
import type { ResolverCuadro } from './compositor';

const FONDO = '#14141A';
const FALTA = '#FF00FF';

export interface Personas {
  cat: CatalogoPersonaje;
  lienzos: Map<string, Lienzo>;
}

/** Lee el atlas de personajes ya publicado (el `personajes-v*` más nuevo). Devuelve `null` si todavía no existe. */
export function cargarPersonajes(raiz: string = rutaRaiz()): Personas | null {
  const dir = join(raiz, 'shared', 'src', 'catalogo');
  if (!existsSync(dir)) return null;
  // El catálogo de personajes más nuevo gana (`personajes-v3` sobre `personajes-v2`), como en el navegador.
  const nombre = readdirSync(dir).filter((n) => /^personajes-v\d+\.json$/.test(n)).sort((x, y) => Number(x.match(/\d+/)?.[0]) - Number(y.match(/\d+/)?.[0])).pop();
  if (nombre === undefined) return null;
  const json = join(dir, nombre);
  const png = join(raiz, 'web', 'public', 'assets', 'arte', nombre.replace(/\.json$/, '.png'));
  if (!existsSync(png)) return null;
  const cat = JSON.parse(readFileSync(json, 'utf8')) as CatalogoPersonaje;
  const atlas = leerPng(png);
  const lienzos = new Map<string, Lienzo>();
  for (const [id, m] of Object.entries(cat.frames)) lienzos.set(id, atlas.recortar(m.x, m.y, m.w, m.h));
  return { cat, lienzos };
}

/** Un personaje armado como lo arma el navegador: plan de capas y recoloreo por marcadores. */
export function armarPersonaje(p: Personas, spec: AvatarSpec, dir: Direccion, cuadro: 0 | 1 | 2 | 3): Lienzo {
  const salida = new Lienzo(CASILLA, 48);
  for (const capa of planDeAvatar(spec, p.cat, dir, cuadro)) {
    const base = p.lienzos.get(capa.frame);
    if (base === undefined) throw new Error(`Falta el cuadro ${capa.frame} en el catálogo de personajes.`);
    const color = recolorearConRampas(base, capa.rampas);
    const desde = capa.filaMin ?? 0;
    salida.pegar(desde > 0 ? color.recortar(0, desde, color.ancho, color.alto - desde) : color, 0, desde + capa.dy);
  }
  return salida;
}

export interface PersonaEnSala {
  /** Casilla donde se sienta (la de la silla) o donde está de pie. */
  x: number;
  y: number;
  dir: Direccion;
  sentada: boolean;
  spec: AvatarSpec;
  /** Desplazamiento fino en píxeles (sentada o de pie), para casos de revisión. */
  dx?: number;
}

function marcadorFalta(ancho: number, alto: number): Lienzo {
  const l = new Lienzo(ancho, alto);
  l.rectBorde(0, 0, ancho, alto, FALTA);
  l.linea(0, 0, ancho - 1, alto - 1, FALTA);
  l.linea(ancho - 1, 0, 0, alto - 1, FALTA);
  return l;
}

/** Como `componerSala`, más las personas en el orden de profundidad del motor. */
export function componerConPersonas(sala: SalaMapa, resolver: ResolverCuadro, personas: readonly PersonaEnSala[], gente: Personas | null, margen = 16): Lienzo {
  const lienzo = new Lienzo(sala.ancho * CASILLA, sala.alto * CASILLA + margen);
  lienzo.rect(0, 0, lienzo.ancho, lienzo.alto, FONDO);
  for (let y = 0; y < sala.alto; y++) {
    for (let x = 0; x < sala.ancho; x++) {
      const id = sala.piso[y]?.[x];
      if (!id) continue;
      const o = objetoPorId(id);
      if (!o) continue;
      lienzo.pegar(resolver(frameDeColocacion(o, 'U', 'base')) ?? marcadorFalta(CASILLA, CASILLA), x * CASILLA, y * CASILLA + margen);
    }
  }
  const prof = profundidades(sala);
  type Pieza = { prof: number; orden: number; dibujar: () => void };
  const piezas: Pieza[] = [];
  sala.colocaciones.forEach((c, i) => {
    const o = objetoPorId(c.objeto);
    if (!o) return;
    piezas.push({
      prof: prof[i] ?? 0,
      orden: i,
      dibujar: () => {
        const h = huellaDe(o, c.orientacion);
        const mascara = o.autotile ? mascaraPared(sala, c.x, c.y) : undefined;
        const id = frameDeColocacion(o, c.orientacion, c.variante, mascara);
        const cuadro = resolver(id) ?? marcadorFalta(h.ancho * CASILLA, h.alto * CASILLA + o.sobresale);
        lienzo.pegar(cuadro, c.x * CASILLA, (c.y + h.alto) * CASILLA - cuadro.alto + margen);
      },
    });
  });
  if (gente) {
    personas.forEach((p, k) => {
      const sprite = armarPersonaje(gente, p.spec, p.dir, p.sentada ? 3 : 0);
      const px = p.x * CASILLA + CASILLA / 2 + (p.dx ?? 0);
      const py = p.sentada ? p.y * CASILLA + CASILLA - 3 : p.y * CASILLA + 24;
      let profundidad = py;
      if (p.sentada) {
        const idx = sala.colocaciones.findIndex((c) => c.objeto === 'silla-oficina' && c.x === p.x && c.y === p.y);
        if (idx >= 0) profundidad = (prof[idx] ?? 0) + 0.6;
      }
      piezas.push({ prof: profundidad, orden: 10_000 + k, dibujar: () => lienzo.pegar(sprite, px - 16, py - 48 + margen) });
    });
  }
  piezas.sort((a, b) => a.prof - b.prof || a.orden - b.orden);
  for (const p of piezas) p.dibujar();
  return lienzo;
}

// ---------------------------------------------------------------------------
// Salas de revisión
// ---------------------------------------------------------------------------

/** Seis personas distintas y repetibles, de pelo corto y mediano para que se vea el cuerpo. Sin accesorios. */
export function avataresDeRevision(gente: Personas | null): AvatarSpec[] {
  if (!gente) return [];
  const persona = (o: Partial<AvatarSpec>): AvatarSpec => ({
    v: 1,
    cuerpo: 'cuerpo-a',
    piel: 'piel-3',
    peinado: 'peinado-corto-raya',
    pelo: 'pelo-castano',
    arriba: 'arriba-camiseta',
    colorArriba: 'azul',
    colorArriba2: 'blanco',
    abajo: 'abajo-pantalon',
    colorAbajo: 'azul-marino',
    zapatos: 'zapatos-tenis',
    colorZapatos: 'negro',
    accesorios: [],
    ...o,
  });
  return [
    persona({}),
    persona({ piel: 'piel-5', peinado: 'peinado-corto-clasico', pelo: 'pelo-negro', arriba: 'arriba-polo', colorArriba: 'rojo-coral' }),
    persona({ piel: 'piel-2', peinado: 'peinado-bob-flequillo', pelo: 'pelo-pelirrojo', arriba: 'arriba-blusa', colorArriba: 'verde' }),
    persona({ piel: 'piel-7', peinado: 'peinado-rapado', pelo: 'pelo-negro', arriba: 'arriba-buso', colorArriba: 'gris' }),
    persona({ piel: 'piel-4', peinado: 'peinado-mono-alto', pelo: 'pelo-castano-oscuro', arriba: 'arriba-camisa', colorArriba: 'celeste' }),
    persona({ piel: 'piel-1', peinado: 'peinado-rizado-corto', pelo: 'pelo-rubio', arriba: 'arriba-sueter', colorArriba: 'morado' }),
    // Los ids de arriba son del catálogo anterior: `migrarAvatar` los lleva al catálogo vigente (v4) sin cambiar quién es cada persona.
  ].map((p, i) => migrarAvatar(p, gente.cat, i + 1));
}

export function personasSentadas(gente: Personas | null, sala: SalaMapa, dir: Direccion): PersonaEnSala[] {
  const avatares = avataresDeRevision(gente);
  const sillas = sala.colocaciones.filter((c) => c.objeto === 'silla-oficina');
  return sillas.map((c, i) => ({ x: c.x, y: c.y, dir, sentada: true, spec: avatares[i % avatares.length] as AvatarSpec }));
}

