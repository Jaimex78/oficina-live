/**
 * Armado del catálogo v5 (personaje de 32 x 64): junta todas las piezas, saca sus cuadros (4 direcciones: S frente, O perfil izquierdo, E perfil
 * derecho = espejo, N espalda) y los empaqueta en el atlas `personajes-v5`.
 *
 * Los ids de cuadro son `<parte>@<dirección><cuadro>` (`arriba-camiseta@S0`); la capa compañera de detrás del cuerpo añade `a` al final
 * (`peinado-melena@S0a`). Cuadros (8): 0 quieto, 1 a 4 caminar, 5 sentado, 6 y 7 con el ojo medio cerrado (solo `cuerpo`). Las partes animadas
 * traen 6 y las estáticas 1. Los ids de las partes y de los colores NO cambian una vez publicados: las personas solo guardan ids.
 *
 * AGREGAR UNA PIEZA: defínela en su archivo (`prendas.ts`, `accesorios.ts`, `otros.ts`, `cabello.ts`, `disfraces.ts`), súmala a la lista de `PARTES`
 * y, si es premium, a `premium.ts`. El catálogo, el atlas, las hojas de revisión y las pruebas la recogen solas.
 */

import type { CapaPersonaje, CatalogoPersonaje, Direccion, DisfrazCatalogo, ParteCatalogo, SlotColor } from '@ol/shared';
import { CUADROS_PARTE_ANIMADA, DIRECCIONES_PERSONAJE, SLOTS_COLOR } from '@ol/shared';
import { Lienzo, PALETA, empaquetar } from '../nucleo';
import type { ItemSprite } from '../nucleo';
import { COLORES, PELOS, PIELES } from './colores';
import { PREMIUM } from './premium';
import { ALTO, ANCHO, LEYENDA } from './v5/datos-disenador';
import { espejoCapa } from './v5/disenador';
import type { Capa } from './v5/disenador';
import { capaCuerpo, cuadroSinParpadeo } from './v5/armado5';
import { GAFAS, SOMBREROS, VELLOS } from './v5/accesorios';
import type { DefAccesorio } from './v5/accesorios';
import { CABELLOS } from './v5/cabello';
import { capasPeinado } from './v5/cabeza';
import { DISFRACES } from './v5/disfraces';
import type { DefDisfrazV5 } from './v5/disfraces';
import { OTROS } from './v5/otros';
import type { PiezaDef } from './v5/otros';
import { PRENDAS } from './v5/prendas';
import type { DefPrenda } from './v5/prendas';
import { ctxDe } from './v5/vestir';
import type { Vista } from './v5/pose';

export const CUADROS_CUERPO = 8;

/**
 * Colores fijos del personaje (no recoloreables), además de la paleta global: el contorno negro, los ojos, las cejas y la boca del arte base de Jaime Orozco
 * (`LEYENDA` de `v5/datos-disenador.ts`), y el blanco y el crema de la camisa del vampiro. Se pasan a la validación a propósito.
 */
export const COLORES_FIJOS_V5: readonly string[] = [...Object.values(LEYENDA), '#000000', '#FFFFFF', '#ECE9F0', '#222034'];
export const VALIDACION_V5 = { multiplo: { ancho: 32, alto: 64 }, relleno: 2, paleta: [...Object.values(PALETA), ...COLORES_FIJOS_V5] } as const;

/** Caras (categoría Piel): ids de la v4 (no cambian), el número es la cara del diseñador (0 = la suya) o su variante. */
export const CARAS_V5: ReadonlyArray<{ id: string; nombre: string; cara: number }> = [
  { id: 'lisa', nombre: 'Lisa', cara: 1 },
  { id: 'pecas', nombre: 'Con pecas', cara: 2 },
  { id: 'manchas', nombre: 'Con manchas', cara: 3 },
  { id: 'parches', nombre: 'Con parches claros', cara: 4 },
  { id: 'rubor', nombre: 'Con rubor (la base)', cara: 0 },
];

/** Ids de los peinados: los de la v4 que siguen y los nuevos. */
const ID_PEINADO: Record<string, string> = {
  p1: 'peinado-despeinado', p2: 'peinado-flequillo', p3: 'peinado-rizado', p4: 'peinado-afro', p5: 'peinado-melena', p6: 'peinado-mono',
  p7: 'peinado-corto', p8: 'peinado-rapado', p9: 'peinado-rizos-largos', p10: 'peinado-trenzas', p11: 'peinado-cola', p12: 'peinado-ondulado',
};

// ---------- adaptadores a PiezaDef ----------
const dePrenda = (d: DefPrenda): PiezaDef => ({
  id: d.id, nombre: d.nombre, capa: d.capa, slots: d.slots, etiquetas: d.etiquetas, animada: true, vistas: ['S', 'N', 'I'],
  frame: (v, c) => d.dibujar(ctxDe(v, cuadroSinParpadeo(c))),
});
const deAccesorio = (d: DefAccesorio): PiezaDef => ({
  id: d.id, nombre: d.nombre, capa: d.capa, ...(d.carpeta ? { carpeta: d.carpeta } : {}), slots: d.slots, etiquetas: d.etiquetas,
  ...(d.ocultaPeloSobre === undefined ? {} : { ocultaPeloSobre: d.ocultaPeloSobre }), animada: false, vistas: d.vistas, frame: (v) => d.dibujar(v),
});
const dePeinado = (p: (typeof CABELLOS)[number]): PiezaDef => ({
  id: ID_PEINADO[p.id]!, nombre: p.nombre[0]!.toUpperCase() + p.nombre.slice(1), capa: 'pelo', slots: ['cabello'], etiquetas: p.etiquetas, animada: false, vistas: ['S', 'N', 'I'],
  frame: (v) => capasPeinado(p, v).frente,
  atras: (v) => capasPeinado(p, v).atras,
});

/** Las partes del catálogo por categoría, en el orden en que las muestra el editor. */
export const PARTES = {
  peinados: CABELLOS.map(dePeinado),
  barbas: VELLOS.map(deAccesorio),
  arriba: PRENDAS.filter((p) => p.capa === 'arriba').map(dePrenda),
  chaquetas: PRENDAS.filter((p) => p.capa === 'chaqueta').map(dePrenda),
  abajo: PRENDAS.filter((p) => p.capa === 'abajo').map(dePrenda),
  zapatos: PRENDAS.filter((p) => p.capa === 'zapatos').map(dePrenda),
  accesorios: [...SOMBREROS.map(deAccesorio), ...GAFAS.map(deAccesorio), ...OTROS] as PiezaDef[],
};
export const DISFRACES_DEF: readonly DefDisfrazV5[] = DISFRACES;

export type MetadatosCatalogo = Pick<CatalogoPersonaje, 'pieles' | 'pelos' | 'colores' | 'cuerpos' | 'peinados' | 'arriba' | 'abajo' | 'zapatos' | 'accesorios' | 'especiales' | 'movilidad'> & {
  barbas: ParteCatalogo[];
  chaquetas: ParteCatalogo[];
};

export interface CatalogoConstruido {
  items: ItemSprite[];
  /** Id de cuadro a lienzo (con marcadores, sin recolorear). */
  lienzos: Map<string, Lienzo>;
  meta: MetadatosCatalogo;
}

export const idCuadro = (parte: string, dir: Direccion, cuadro: number, atras = false): string => `${parte}@${dir}${cuadro}${atras ? 'a' : ''}`;

export function capaALienzo(c: Capa): Lienzo {
  const l = new Lienzo(ANCHO, ALTO);
  for (const [k, v] of c) l.px(k % ANCHO, Math.floor(k / ANCHO), v);
  return l;
}

const vistaDe = (dir: Direccion): Vista => (dir === 'O' || dir === 'E' ? 'I' : (dir as 'S' | 'N'));
const espejar = (dir: Direccion, c: Capa): Capa => (dir === 'E' ? espejoCapa(c) : c);

/** Una lista de cuadros para una capa (principal o compañera) de una pieza, o null si está vacía. */
function listaDe(
  def: PiezaDef,
  dir: Direccion,
  cuadros: readonly number[],
  hacer: (v: Vista, c: number) => Capa,
  atras: boolean,
  items: ItemSprite[],
  lienzos: Map<string, Lienzo>,
): string[] | null {
  const v = vistaDe(dir);
  if (!def.vistas.includes(v)) return null;
  const ids: string[] = [];
  let algo = false;
  for (const c of cuadros) {
    const capa = espejar(dir, hacer(v, c));
    if (capa.size > 0) algo = true;
    const id = idCuadro(def.id, dir, c, atras);
    const l = capaALienzo(capa);
    items.push({ id, lienzo: l });
    lienzos.set(id, l);
    ids.push(id);
  }
  if (!algo) {
    for (const id of ids) { items.splice(items.findIndex((i) => i.id === id), 1); lienzos.delete(id); }
    return null;
  }
  return ids;
}

function construirParte(def: PiezaDef, items: ItemSprite[], lienzos: Map<string, Lienzo>): ParteCatalogo {
  const cuadros = def.animada ? [0, 1, 2, 3, 4, 5] : [0];
  const frames: Partial<Record<Direccion, string[]>> = {};
  const atras: Partial<Record<Direccion, string[]>> = {};
  for (const dir of DIRECCIONES_PERSONAJE) {
    const f = listaDe(def, dir, cuadros, def.frame, false, items, lienzos);
    if (f) frames[dir] = f;
    if (def.atras) {
      const a = listaDe(def, dir, cuadros, def.atras, true, items, lienzos);
      if (a) atras[dir] = a;
    }
  }
  return {
    id: def.id,
    nombre: def.nombre,
    capa: def.capa as CapaPersonaje,
    slots: [...def.slots],
    frames,
    ...(Object.keys(atras).length > 0 ? { atras } : {}),
    etiquetas: [...def.etiquetas],
    ...(def.carpeta === undefined ? {} : { carpeta: def.carpeta }),
    ...(def.ocultaPeloSobre === undefined ? {} : { ocultaPeloSobre: def.ocultaPeloSobre }),
    ...(PREMIUM.has(def.id) ? { premium: true } : {}),
  };
}

/** El cuerpo (capa `cuerpo`): 8 cuadros por dirección; de espaldas no hay ojos, así que el parpadeo repite quieto y sentado. */
function construirCuerpo(c: (typeof CARAS_V5)[number], items: ItemSprite[], lienzos: Map<string, Lienzo>): ParteCatalogo {
  const id = `cara-${c.id}`;
  const frames: Partial<Record<Direccion, string[]>> = {};
  for (const dir of DIRECCIONES_PERSONAJE) {
    const v = vistaDe(dir);
    const ids: string[] = [];
    for (let cu = 0; cu < CUADROS_CUERPO; cu++) {
      if (v === 'N' && cu >= 6) { ids.push(ids[cu === 6 ? 0 : 5]!); continue; }
      const capa = espejar(dir, capaCuerpo(v, cu, c.cara));
      const fid = idCuadro(id, dir, cu);
      const l = capaALienzo(capa);
      items.push({ id: fid, lienzo: l });
      lienzos.set(fid, l);
      ids.push(fid);
    }
    frames[dir] = ids;
  }
  return { id, nombre: c.nombre, capa: 'cuerpo', slots: ['piel'], frames, etiquetas: ['piel', 'cara', c.id] };
}

/** Los slots que usan las partes de un disfraz, en el orden del contrato y sin la piel (es la del avatar). */
function slotsDe(partes: readonly PiezaDef[]): SlotColor[] {
  const usados = new Set<SlotColor>();
  for (const p of partes) for (const s of p.slots) usados.add(s as SlotColor);
  return SLOTS_COLOR.filter((s) => usados.has(s) && s !== 'piel');
}

function construirDisfraz(def: DefDisfrazV5, items: ItemSprite[], lienzos: Map<string, Lienzo>): DisfrazCatalogo {
  return {
    id: def.id,
    nombre: def.nombre,
    coleccion: def.coleccion,
    ocultaPelo: def.ocultaPelo,
    ocultaAccesorios: def.ocultaAccesorios,
    ...(def.ocultaCabeza === undefined ? {} : { ocultaCabeza: def.ocultaCabeza }),
    ...(def.ocultaBarba === undefined ? {} : { ocultaBarba: def.ocultaBarba }),
    slots: slotsDe(def.partes),
    porDefecto: { ...def.porDefecto },
    etiquetas: [...def.etiquetas],
    partes: def.partes.map((d) => construirParte(d, items, lienzos)),
  };
}

/** Dibuja todos los cuadros del catálogo. Determinista: mismos datos, mismos bytes. */
export function construirCatalogo(): CatalogoConstruido {
  const items: ItemSprite[] = [];
  const lienzos = new Map<string, Lienzo>();
  const cat = (lista: readonly PiezaDef[]): ParteCatalogo[] => lista.map((d) => construirParte(d, items, lienzos));
  const meta: MetadatosCatalogo = {
    pieles: PIELES,
    pelos: PELOS,
    colores: COLORES,
    cuerpos: CARAS_V5.map((c) => construirCuerpo(c, items, lienzos)),
    peinados: cat(PARTES.peinados),
    arriba: cat(PARTES.arriba),
    chaquetas: cat(PARTES.chaquetas),
    abajo: cat(PARTES.abajo),
    zapatos: cat(PARTES.zapatos),
    accesorios: cat(PARTES.accesorios),
    especiales: DISFRACES_DEF.map((d) => construirDisfraz(d, items, lienzos)),
    // La mecánica de movilidad sigue en el contrato (plan, servidor, paquetes); su arte se rehace aparte.
    movilidad: [],
    barbas: cat(PARTES.barbas),
  };
  return { items, lienzos, meta };
}

/** Empaqueta los cuadros: relleno de 2 px y atlas de hasta 1024 px de ancho. */
export function empaquetarCatalogo(items: readonly ItemSprite[]) {
  return empaquetar(items, { anchoMax: 1024, relleno: 2 });
}

void CUADROS_PARTE_ANIMADA;
