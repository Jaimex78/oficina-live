/**
 * Lote 7 (OBSOLETO): solo queda el escritorio largo, que sigue dibujándose para los mapas guardados que lo usan.
 * Todo lo demás del lote 7 (computadores, torre, mochila, audífonos) se rehizo en el lote 8 con el mismo id.
 *
 * Atlas `objetos-v8`: 1 objeto.
 */

import { INVENTARIO, type ObjetoCatalogo } from '@ol/shared';
import { framesEsperados, verificarObjeto } from './comunes';
import type { Cuadros } from './l8-comun';
import { cuadrosEscritorio } from './l7-escritorio';

export const IDS_ATLAS_V8: readonly string[] = ['escritorio-largo'];

/** Los objetos del atlas, en el orden del inventario. */
export function objetosDelAtlasV8(): ObjetoCatalogo[] {
  const ids = new Set(IDS_ATLAS_V8);
  return INVENTARIO.filter((o) => ids.has(o.id));
}

export interface ResultadoLote7 {
  cuadros: Cuadros;
  objetos: ObjetoCatalogo[];
  terminados: ObjetoCatalogo[];
}

/** Dibuja todo y revisa que no haya cuadros de más ni de menos. */
export function construirLote7(): ResultadoLote7 {
  const cuadros: Cuadros = new Map();
  for (const [id, lienzo] of cuadrosEscritorio()) cuadros.set(id, lienzo);
  const objetos = objetosDelAtlasV8();
  const esperados = new Set(objetos.flatMap((o) => framesEsperados(o).map((f) => f.id)));
  const demas = [...cuadros.keys()].filter((id) => !esperados.has(id));
  if (demas.length > 0) throw new Error(`Hay cuadros que el inventario no promete: ${demas.slice(0, 10).join(', ')}.`);
  const terminados = objetos.filter((o) => verificarObjeto(o, cuadros).length === 0);
  return { cuadros, objetos, terminados };
}
