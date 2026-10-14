/**
 * Junta los dibujos del lote 6 (las fiestas del año, atlas `objetos-v7`) sin efectos secundarios: las pruebas y el
 * constructor lo importan. Aquí vive la lista exacta de objetos por colección y el control de que no falte ni sobre
 * ningún cuadro.
 */

import { INVENTARIO, type ObjetoCatalogo } from '@ol/shared';
import { framesEsperados, verificarObjeto } from './comunes';
import type { Cuadros } from './l6-comun';
import { cuadrosHalloween } from './l6-halloween';
import { cuadrosAmor } from './l6-amor';
import { cuadrosAnoNuevo } from './l6-ano-nuevo';
import { cuadrosColombia } from './l6-colombia';
import { cuadrosCumpleanos } from './l6-cumpleanos';
import { cuadrosNavidad } from './l6-navidad';
import { cuadrosPascua } from './l6-pascua';

/** Los 32 objetos del lote, por colección (el orden de las colecciones es el de las hojas de revisión). */
export const IDS_LOTE_6: Readonly<Record<string, readonly string[]>> = {
  halloween: ['calabaza-grande', 'telarana', 'esqueleto', 'tumba', 'caldero', 'fantasma-colgante', 'murcielagos', 'escoba', 'arbol-seco', 'bowl-dulces'],
  navidad: ['pesebre', 'muneco-nieve', 'corona-navidena', 'guirnalda', 'reno', 'calcetin-chimenea'],
  'amor-amistad': ['ramo-rosas', 'globos-corazon', 'oso-peluche', 'caja-chocolates'],
  'ano-nuevo': ['copas-champan', 'globos-ano-nuevo', 'cuenta-regresiva', 'serpentinas'],
  colombia: ['bandera-colombia', 'sombrero-vueltiao', 'mochila-wayuu', 'mascara-carnaval'],
  pascua: ['huevos-pascua', 'conejo-pascua'],
  cumpleanos: ['torta-cumpleanos', 'sombreros-fiesta'],
};

/** Quién dibuja cada colección. */
const FUENTES: Readonly<Record<string, () => Cuadros>> = {
  halloween: cuadrosHalloween,
  navidad: cuadrosNavidad,
  'amor-amistad': cuadrosAmor,
  'ano-nuevo': cuadrosAnoNuevo,
  colombia: cuadrosColombia,
  pascua: cuadrosPascua,
  cumpleanos: cuadrosCumpleanos,
};

/** Colecciones ya dibujadas. Cambia entre hitos: el último hito las incluye a todas. */
export const COLECCIONES_LISTAS: readonly string[] = Object.keys(FUENTES);

/** Los ids de una colección (o de todas) en el orden del lote. */
export function idsDe(coleccion?: string): string[] {
  return coleccion === undefined ? Object.values(IDS_LOTE_6).flat() : [...(IDS_LOTE_6[coleccion] ?? [])];
}

/** Los objetos de una colección (o de todo el lote), en el orden del inventario. */
export function objetosDelLote6(coleccion?: string): ObjetoCatalogo[] {
  const ids = new Set(idsDe(coleccion));
  return INVENTARIO.filter((o) => ids.has(o.id));
}

export interface ResultadoLote6 {
  /** Todos los cuadros dibujados por id canónico. */
  cuadros: Cuadros;
  /** Los 32 objetos del lote. */
  objetos: ObjetoCatalogo[];
  /** Los que tienen todos sus cuadros con la medida exacta y pertenecen a una colección ya lista. */
  terminados: ObjetoCatalogo[];
}

/** Dibuja todo el lote y revisa que no haya cuadros repetidos ni de más. */
export function construirLote6(): ResultadoLote6 {
  const cuadros: Cuadros = new Map();
  for (const coleccion of COLECCIONES_LISTAS) {
    for (const [id, lienzo] of (FUENTES[coleccion] as () => Cuadros)()) {
      if (cuadros.has(id)) throw new Error(`El cuadro ${id} está dibujado dos veces.`);
      cuadros.set(id, lienzo);
    }
  }
  const objetos = objetosDelLote6();
  const esperados = new Set(objetos.flatMap((o) => framesEsperados(o).map((f) => f.id)));
  const demas = [...cuadros.keys()].filter((id) => !esperados.has(id));
  if (demas.length > 0) throw new Error(`Hay cuadros que el inventario no promete: ${demas.slice(0, 10).join(', ')}.`);
  const listas = new Set(COLECCIONES_LISTAS.flatMap((c) => idsDe(c)));
  const terminados = objetos.filter((o) => listas.has(o.id) && verificarObjeto(o, cuadros).length === 0);
  return { cuadros, objetos, terminados };
}
