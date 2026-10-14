/**
 * Junta los dibujos del lote 14 (baños con cubículos) sin efectos secundarios: las pruebas y el constructor lo importan.
 * Atlas `objetos-v15` (todo el lote). Cada grupo es un archivo `l14-<grupo>.ts` que exporta una función `cuadros...()`.
 */

import { INVENTARIO, type ObjetoCatalogo } from '@ol/shared';
import { framesEsperados, verificarObjeto } from './comunes';
import type { Cuadros } from './l8-comun';
import { cuadrosBanos14 } from './l14-banos';
import { cuadrosDivisores14 } from './l14-divisores';

/** Los grupos de dibujo del lote 14, por nombre. */
export const GRUPOS_LOTE_14: Readonly<Record<string, () => Cuadros>> = {
  divisores: cuadrosDivisores14,
  banos: cuadrosBanos14,
};

export function objetosDelLote14(): ObjetoCatalogo[] {
  return INVENTARIO.filter((o) => o.lote === 14);
}

/** Hojas de revisión: divisores y puerta por un lado, accesorios por otro. */
export const FAMILIAS_LOTE_14 = ['divisores', 'accesorios'] as const;
export type FamiliaLote14 = (typeof FAMILIAS_LOTE_14)[number];
export const familiaDeRevision14 = (o: ObjetoCatalogo): FamiliaLote14 => (o.categoria === 'paredes' ? 'divisores' : 'accesorios');

export interface ResultadoLote14 {
  cuadros: Cuadros;
  objetos: ObjetoCatalogo[];
  terminados: ObjetoCatalogo[];
  pendientes: ObjetoCatalogo[];
}

/** Dibuja todo y revisa que no haya cuadros repetidos ni cuadros que el inventario no promete. */
export function construirLote14(): ResultadoLote14 {
  const cuadros: Cuadros = new Map();
  for (const [grupo, fuente] of Object.entries(GRUPOS_LOTE_14)) {
    for (const [id, lienzo] of fuente()) {
      if (cuadros.has(id)) throw new Error(`El cuadro ${id} está dibujado dos veces (grupo ${grupo}).`);
      cuadros.set(id, lienzo);
    }
  }
  const objetos = objetosDelLote14();
  const esperados = new Set(objetos.flatMap((o) => framesEsperados(o).map((f) => f.id)));
  const demas = [...cuadros.keys()].filter((id) => !esperados.has(id));
  if (demas.length > 0) throw new Error(`Hay cuadros que el inventario no promete: ${demas.slice(0, 10).join(', ')}.`);
  const terminados = objetos.filter((o) => verificarObjeto(o, cuadros).length === 0);
  const hechos = new Set(terminados.map((o) => o.id));
  return { cuadros, objetos, terminados, pendientes: objetos.filter((o) => !hechos.has(o.id)) };
}
