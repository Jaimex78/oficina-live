/**
 * Junta los dibujos del lote 11 sin efectos secundarios: las pruebas y el constructor lo importan. Aquí vive la lista
 * de grupos de dibujo y el control de que no falte ni sobre ningún cuadro.
 *
 * Atlas `objetos-v12` (toda la comida y bebida del lote). Cada grupo es un archivo `l11-<grupo>.ts` que exporta una función
 * `cuadros...()`; para sumar un grupo se agrega a `GRUPOS_LOTE_11`.
 */

import { INVENTARIO, type ObjetoCatalogo } from '@ol/shared';
import { framesEsperados, verificarObjeto } from './comunes';
import type { Cuadros } from './l8-comun';
import { cuadrosAlmuerzo11 } from './l11-almuerzo';
import { cuadrosBebidas11 } from './l11-bebidas';
import { cuadrosCafe11 } from './l11-cafe';
import { cuadrosDulces11 } from './l11-dulces';
import { LOTE_11_ALMUERZO, LOTE_11_BEBIDAS, LOTE_11_CAFETERIA } from '../../../shared/src/inventario-lotes/l11';

/** Los grupos de dibujo del lote 11, por nombre. */
export const GRUPOS_LOTE_11: Readonly<Record<string, () => Cuadros>> = {
  cafe: cuadrosCafe11,
  bebidas: cuadrosBebidas11,
  almuerzo: cuadrosAlmuerzo11,
  dulces: cuadrosDulces11,
};

/** Los objetos del lote 11 en el orden del inventario. */
export function objetosDelLote11(): ObjetoCatalogo[] {
  return INVENTARIO.filter((o) => o.lote === 11);
}

/** Hojas de revisión: una por familia (cafetería, bebidas, almuerzo, frutas y postres con platos colombianos). */
export const FAMILIAS_LOTE_11 = ['cafeteria', 'bebidas', 'almuerzo', 'dulces'] as const;
export type FamiliaLote11 = (typeof FAMILIAS_LOTE_11)[number];

const EN_CAFETERIA = new Set(LOTE_11_CAFETERIA.map((o) => o.id));
const EN_BEBIDAS = new Set(LOTE_11_BEBIDAS.map((o) => o.id));
const EN_ALMUERZO = new Set(LOTE_11_ALMUERZO.map((o) => o.id));

/** A qué hoja de revisión va cada objeto. */
export function familiaDeRevision(o: ObjetoCatalogo): FamiliaLote11 {
  if (EN_CAFETERIA.has(o.id)) return 'cafeteria';
  if (EN_BEBIDAS.has(o.id)) return 'bebidas';
  if (EN_ALMUERZO.has(o.id)) return 'almuerzo';
  return 'dulces';
}

export interface ResultadoLote11 {
  /** Todos los cuadros dibujados por id canónico. */
  cuadros: Cuadros;
  /** Los objetos del lote 11 según el inventario. */
  objetos: ObjetoCatalogo[];
  /** Los que tienen todos sus cuadros con la medida exacta (los únicos que se publican). */
  terminados: ObjetoCatalogo[];
  /** Los que todavía no tienen todos sus cuadros. */
  pendientes: ObjetoCatalogo[];
}

/** Dibuja todo y revisa que no haya cuadros repetidos ni cuadros que el inventario no promete. */
export function construirLote11(): ResultadoLote11 {
  const cuadros: Cuadros = new Map();
  for (const [grupo, fuente] of Object.entries(GRUPOS_LOTE_11)) {
    for (const [id, lienzo] of fuente()) {
      if (cuadros.has(id)) throw new Error(`El cuadro ${id} está dibujado dos veces (grupo ${grupo}).`);
      cuadros.set(id, lienzo);
    }
  }
  const objetos = objetosDelLote11();
  const esperados = new Set(objetos.flatMap((o) => framesEsperados(o).map((f) => f.id)));
  const demas = [...cuadros.keys()].filter((id) => !esperados.has(id));
  if (demas.length > 0) throw new Error(`Hay cuadros que el inventario no promete: ${demas.slice(0, 10).join(', ')}.`);
  const terminados = objetos.filter((o) => verificarObjeto(o, cuadros).length === 0);
  const hechos = new Set(terminados.map((o) => o.id));
  return { cuadros, objetos, terminados, pendientes: objetos.filter((o) => !hechos.has(o.id)) };
}
