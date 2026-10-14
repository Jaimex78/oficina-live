/**
 * Junta los dibujos del lote 12 sin efectos secundarios: las pruebas y el constructor lo importan. Aquí vive la lista de
 * grupos de dibujo y el control de que no falte ni sobre ningún cuadro.
 *
 * Atlas `objetos-v13` (todos los objetos de pared del lote). Cada grupo es un archivo `l12-<grupo>.ts` que exporta una función
 * `cuadros...()`; para sumar un grupo se agrega a `GRUPOS_LOTE_12`.
 */

import { INVENTARIO, type ObjetoCatalogo } from '@ol/shared';
import { framesEsperados, verificarObjeto } from './comunes';
import type { Cuadros } from './l8-comun';
import { cuadrosArte12 } from './l12-arte';
import { cuadrosLuces12 } from './l12-luces';
import { cuadrosOtros12 } from './l12-otros';
import { cuadrosPlantas12 } from './l12-plantas';
import { cuadrosVentanas12 } from './l12-ventanas';
import { LOTE_12_ARTE, LOTE_12_LUCES, LOTE_12_PLANTAS, LOTE_12_VENTANAS } from '../../../shared/src/inventario-lotes/l12';

/** Los grupos de dibujo del lote 12, por nombre. */
export const GRUPOS_LOTE_12: Readonly<Record<string, () => Cuadros>> = {
  ventanas: cuadrosVentanas12,
  arte: cuadrosArte12,
  luces: cuadrosLuces12,
  plantas: cuadrosPlantas12,
  otros: cuadrosOtros12,
};

/** Los objetos del lote 12 en el orden del inventario. */
export function objetosDelLote12(): ObjetoCatalogo[] {
  return INVENTARIO.filter((o) => o.lote === 12);
}

/** Hojas de revisión: una por familia. */
export const FAMILIAS_LOTE_12 = ['ventanas', 'arte', 'luces', 'plantas', 'otros'] as const;
export type FamiliaLote12 = (typeof FAMILIAS_LOTE_12)[number];

const EN_VENTANAS = new Set(LOTE_12_VENTANAS.map((o) => o.id));
const EN_ARTE = new Set(LOTE_12_ARTE.map((o) => o.id));
const EN_LUCES = new Set(LOTE_12_LUCES.map((o) => o.id));
const EN_PLANTAS = new Set(LOTE_12_PLANTAS.map((o) => o.id));

/** A qué hoja de revisión va cada objeto. */
export function familiaDeRevision(o: ObjetoCatalogo): FamiliaLote12 {
  if (EN_VENTANAS.has(o.id)) return 'ventanas';
  if (EN_ARTE.has(o.id)) return 'arte';
  if (EN_LUCES.has(o.id)) return 'luces';
  if (EN_PLANTAS.has(o.id)) return 'plantas';
  return 'otros';
}

export interface ResultadoLote12 {
  /** Todos los cuadros dibujados por id canónico. */
  cuadros: Cuadros;
  /** Los objetos del lote 12 según el inventario. */
  objetos: ObjetoCatalogo[];
  /** Los que tienen todos sus cuadros con la medida exacta (los únicos que se publican). */
  terminados: ObjetoCatalogo[];
  /** Los que todavía no tienen todos sus cuadros. */
  pendientes: ObjetoCatalogo[];
}

/** Dibuja todo y revisa que no haya cuadros repetidos ni cuadros que el inventario no promete. */
export function construirLote12(): ResultadoLote12 {
  const cuadros: Cuadros = new Map();
  for (const [grupo, fuente] of Object.entries(GRUPOS_LOTE_12)) {
    for (const [id, lienzo] of fuente()) {
      if (cuadros.has(id)) throw new Error(`El cuadro ${id} está dibujado dos veces (grupo ${grupo}).`);
      cuadros.set(id, lienzo);
    }
  }
  const objetos = objetosDelLote12();
  const esperados = new Set(objetos.flatMap((o) => framesEsperados(o).map((f) => f.id)));
  const demas = [...cuadros.keys()].filter((id) => !esperados.has(id));
  if (demas.length > 0) throw new Error(`Hay cuadros que el inventario no promete: ${demas.slice(0, 10).join(', ')}.`);
  const terminados = objetos.filter((o) => verificarObjeto(o, cuadros).length === 0);
  const hechos = new Set(terminados.map((o) => o.id));
  return { cuadros, objetos, terminados, pendientes: objetos.filter((o) => !hechos.has(o.id)) };
}
