/**
 * Junta los dibujos del lote 8 sin efectos secundarios: las pruebas y el constructor lo importan. Aquí vive la lista
 * de grupos de dibujo y el control de que no falte ni sobre ningún cuadro.
 *
 * Atlas `objetos-v9`. Cada grupo es un archivo `l8-<grupo>.ts` que exporta una función `cuadros...()`; para sumar un grupo
 * se agrega a `GRUPOS_LOTE_8`.
 */

import { INVENTARIO, type ObjetoCatalogo } from '@ol/shared';
import { framesEsperados, verificarObjeto } from './comunes';
import type { Cuadros } from './l8-comun';
import { cuadrosAccesorios } from './l8-accesorios';
import { cuadrosEscritorios } from './l8-escritorio';
import { cuadrosMaquinas } from './l8-maquinas';
import { cuadrosPcsA } from './l8-pcs';
import { cuadrosPcsB } from './l8-pcs-b';
import { cuadrosPequenos } from './l8-pequenos';
import { cuadrosSillas } from './l8-silla';

/** Los grupos de dibujo del lote 8, por nombre. */
export const GRUPOS_LOTE_8: Readonly<Record<string, () => Cuadros>> = {
  escritorios: cuadrosEscritorios,
  sillas: cuadrosSillas,
  'pcs-a': cuadrosPcsA,
  accesorios: cuadrosAccesorios,
  'pcs-b': cuadrosPcsB,
  pequenos: cuadrosPequenos,
  maquinas: cuadrosMaquinas,
};

/** Los objetos del lote 8 en el orden del inventario. */
export function objetosDelLote8(): ObjetoCatalogo[] {
  return INVENTARIO.filter((o) => o.lote === 8);
}

export interface ResultadoLote8 {
  /** Todos los cuadros dibujados por id canónico. */
  cuadros: Cuadros;
  /** Los objetos del lote 8 según el inventario. */
  objetos: ObjetoCatalogo[];
  /** Los que tienen todos sus cuadros con la medida exacta (los únicos que se publican). */
  terminados: ObjetoCatalogo[];
  /** Los que todavía no tienen todos sus cuadros. */
  pendientes: ObjetoCatalogo[];
}

/** Dibuja todo y revisa que no haya cuadros repetidos ni cuadros que el inventario no promete. */
export function construirLote8(): ResultadoLote8 {
  const cuadros: Cuadros = new Map();
  for (const [grupo, fuente] of Object.entries(GRUPOS_LOTE_8)) {
    for (const [id, lienzo] of fuente()) {
      if (cuadros.has(id)) throw new Error(`El cuadro ${id} está dibujado dos veces (grupo ${grupo}).`);
      cuadros.set(id, lienzo);
    }
  }
  const objetos = objetosDelLote8();
  const esperados = new Set(objetos.flatMap((o) => framesEsperados(o).map((f) => f.id)));
  const demas = [...cuadros.keys()].filter((id) => !esperados.has(id));
  if (demas.length > 0) throw new Error(`Hay cuadros que el inventario no promete: ${demas.slice(0, 10).join(', ')}.`);
  const terminados = objetos.filter((o) => verificarObjeto(o, cuadros).length === 0);
  const hechos = new Set(terminados.map((o) => o.id));
  return { cuadros, objetos, terminados, pendientes: objetos.filter((o) => !hechos.has(o.id)) };
}
