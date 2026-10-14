/**
 * Junta los dibujos del lote 9 sin efectos secundarios: las pruebas y el constructor lo importan. Aquí vive la lista
 * de grupos de dibujo y el control de que no falte ni sobre ningún cuadro.
 *
 * Atlas `objetos-v10` (asientos), `objetos-v10-mesas` y `objetos-v10-almacenaje`. Cada grupo es un archivo `l9-<grupo>.ts` que exporta una función `cuadros...()`; para sumar un grupo
 * se agrega a `GRUPOS_LOTE_9`.
 */

import { INVENTARIO, type ObjetoCatalogo } from '@ol/shared';
import { framesEsperados, verificarObjeto } from './comunes';
import type { Cuadros } from './l8-comun';
import { cuadrosAlmacenaje9 } from './l9-almacenaje';
import { cuadrosMesas9 } from './l9-mesas';
import { cuadrosSillas9 } from './l9-sillas';
import { cuadrosSofas9 } from './l9-sofas';

/** Los grupos de dibujo del lote 9, por nombre. */
export const GRUPOS_LOTE_9: Readonly<Record<string, () => Cuadros>> = {
  sillas: cuadrosSillas9,
  sofas: cuadrosSofas9,
  mesas: cuadrosMesas9,
  almacenaje: cuadrosAlmacenaje9,
};

/** Los objetos del lote 9 en el orden del inventario. */
export function objetosDelLote9(): ObjetoCatalogo[] {
  return INVENTARIO.filter((o) => o.lote === 9);
}

/** A qué hoja de revisión va cada objeto: asientos, mesas (con escritorios) o almacenaje. */
export function categoriaDeRevision(o: ObjetoCatalogo): 'asientos' | 'mesas' | 'almacenaje' {
  if (o.categoria === 'asientos') return 'asientos';
  if (o.categoria === 'mesas' || o.categoria === 'puestos') return 'mesas';
  return 'almacenaje';
}

/** Un atlas por categoría de revisión (juntos pasarían de 4096 px de alto). */
export const NOMBRES_ATLAS_LOTE_9 = { asientos: 'objetos-v10', mesas: 'objetos-v10-mesas', almacenaje: 'objetos-v10-almacenaje' } as const;

export interface ResultadoLote9 {
  /** Todos los cuadros dibujados por id canónico. */
  cuadros: Cuadros;
  /** Los objetos del lote 9 según el inventario. */
  objetos: ObjetoCatalogo[];
  /** Los que tienen todos sus cuadros con la medida exacta (los únicos que se publican). */
  terminados: ObjetoCatalogo[];
  /** Los que todavía no tienen todos sus cuadros. */
  pendientes: ObjetoCatalogo[];
}

/** Dibuja todo y revisa que no haya cuadros repetidos ni cuadros que el inventario no promete. */
export function construirLote9(): ResultadoLote9 {
  const cuadros: Cuadros = new Map();
  for (const [grupo, fuente] of Object.entries(GRUPOS_LOTE_9)) {
    for (const [id, lienzo] of fuente()) {
      if (cuadros.has(id)) throw new Error(`El cuadro ${id} está dibujado dos veces (grupo ${grupo}).`);
      cuadros.set(id, lienzo);
    }
  }
  const objetos = objetosDelLote9();
  const esperados = new Set(objetos.flatMap((o) => framesEsperados(o).map((f) => f.id)));
  const demas = [...cuadros.keys()].filter((id) => !esperados.has(id));
  if (demas.length > 0) throw new Error(`Hay cuadros que el inventario no promete: ${demas.slice(0, 10).join(', ')}.`);
  const terminados = objetos.filter((o) => verificarObjeto(o, cuadros).length === 0);
  const hechos = new Set(terminados.map((o) => o.id));
  return { cuadros, objetos, terminados, pendientes: objetos.filter((o) => !hechos.has(o.id)) };
}
