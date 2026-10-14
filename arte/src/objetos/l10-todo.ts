/**
 * Junta los dibujos del lote 10 sin efectos secundarios: las pruebas y el constructor lo importan. Aquí vive la lista
 * de grupos de dibujo y el control de que no falte ni sobre ningún cuadro.
 *
 * Atlas `objetos-v11` (toda la decoración del lote). Cada grupo es un archivo `l10-<grupo>.ts` que exporta una función
 * `cuadros...()`; para sumar un grupo se agrega a `GRUPOS_LOTE_10`.
 */

import { INVENTARIO, type ObjetoCatalogo } from '@ol/shared';
import { framesEsperados, verificarObjeto } from './comunes';
import type { Cuadros } from './l8-comun';
import { cuadrosDeportes10 } from './l10-deportes';
import { cuadrosLuz10 } from './l10-luz';
import { cuadrosPiezas10 } from './l10-piezas';
import { cuadrosPlantas10 } from './l10-plantas';

/** Los grupos de dibujo del lote 10, por nombre. */
export const GRUPOS_LOTE_10: Readonly<Record<string, () => Cuadros>> = {
  plantas: cuadrosPlantas10,
  luz: cuadrosLuz10,
  piezas: cuadrosPiezas10,
  deportes: cuadrosDeportes10,
};

/** Los objetos del lote 10 en el orden del inventario. */
export function objetosDelLote10(): ObjetoCatalogo[] {
  return INVENTARIO.filter((o) => o.lote === 10);
}

/** Hojas de revisión: una por familia (plantas, lámparas y velas, arte y museo, aparatos y hogar, deportes, temporada). */
export const FAMILIAS_LOTE_10 = ['plantas', 'lamparas', 'arte', 'piezas', 'deportes', 'temporada'] as const;
export type FamiliaLote10 = (typeof FAMILIAS_LOTE_10)[number];

const IDS_LAMPARAS = /^(lampara-|candel|farol-|incienso)/;
const IDS_ARTE = /^(busto-|urna-|jarron-|atril-|estatuilla-|barco-|bola-|globo-)/;

/** A qué hoja de revisión va cada objeto. */
export function familiaDeRevision(o: ObjetoCatalogo): FamiliaLote10 {
  if (o.categoria === 'temporada') return 'temporada';
  if (o.categoria === 'juegos') return 'deportes';
  if (o.etiquetas.includes('planta')) return 'plantas';
  if (IDS_LAMPARAS.test(o.id)) return 'lamparas';
  if (IDS_ARTE.test(o.id)) return 'arte';
  return 'piezas';
}

export interface ResultadoLote10 {
  /** Todos los cuadros dibujados por id canónico. */
  cuadros: Cuadros;
  /** Los objetos del lote 10 según el inventario. */
  objetos: ObjetoCatalogo[];
  /** Los que tienen todos sus cuadros con la medida exacta (los únicos que se publican). */
  terminados: ObjetoCatalogo[];
  /** Los que todavía no tienen todos sus cuadros. */
  pendientes: ObjetoCatalogo[];
}

/** Dibuja todo y revisa que no haya cuadros repetidos ni cuadros que el inventario no promete. */
export function construirLote10(): ResultadoLote10 {
  const cuadros: Cuadros = new Map();
  for (const [grupo, fuente] of Object.entries(GRUPOS_LOTE_10)) {
    for (const [id, lienzo] of fuente()) {
      if (cuadros.has(id)) throw new Error(`El cuadro ${id} está dibujado dos veces (grupo ${grupo}).`);
      cuadros.set(id, lienzo);
    }
  }
  const objetos = objetosDelLote10();
  const esperados = new Set(objetos.flatMap((o) => framesEsperados(o).map((f) => f.id)));
  const demas = [...cuadros.keys()].filter((id) => !esperados.has(id));
  if (demas.length > 0) throw new Error(`Hay cuadros que el inventario no promete: ${demas.slice(0, 10).join(', ')}.`);
  const terminados = objetos.filter((o) => verificarObjeto(o, cuadros).length === 0);
  const hechos = new Set(terminados.map((o) => o.id));
  return { cuadros, objetos, terminados, pendientes: objetos.filter((o) => !hechos.has(o.id)) };
}
