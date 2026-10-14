/**
 * Junta los dibujos del lote 13 sin efectos secundarios: las pruebas y el constructor lo importan. Aquí vive la lista de
 * grupos de dibujo y el control de que no falte ni sobre ningún cuadro.
 *
 * Atlas `objetos-v14` (todo el lote). Cada grupo es un archivo `l13-<grupo>.ts` que exporta una función `cuadros...()`; para
 * sumar un grupo se agrega a `GRUPOS_LOTE_13`. `l13-juegos.ts` dibuja los juegos y los objetos inteligentes.
 */

import { INVENTARIO, type ObjetoCatalogo } from '@ol/shared';
import { framesEsperados, verificarObjeto } from './comunes';
import type { Cuadros } from './l8-comun';
import { cuadrosArboles13 } from './l13-arboles';
import { cuadrosExterior13 } from './l13-exterior';
import { cuadrosJardin13 } from './l13-jardin';
import { cuadrosJuegos13 } from './l13-juegos';
import { LOTE_13_ARBOLES, LOTE_13_JARDIN } from '../../../shared/src/inventario-lotes/l13';

/** Los grupos de dibujo del lote 13, por nombre. */
export const GRUPOS_LOTE_13: Readonly<Record<string, () => Cuadros>> = {
  arboles: cuadrosArboles13,
  jardin: cuadrosJardin13,
  exterior: cuadrosExterior13,
  juegos: cuadrosJuegos13,
};

/** Los objetos del lote 13 en el orden del inventario. */
export function objetosDelLote13(): ObjetoCatalogo[] {
  return INVENTARIO.filter((o) => o.lote === 13);
}

/** Hojas de revisión: una por familia. */
export const FAMILIAS_LOTE_13 = ['arboles', 'jardin', 'exterior', 'juegos'] as const;
export type FamiliaLote13 = (typeof FAMILIAS_LOTE_13)[number];

const EN_ARBOLES = new Set(LOTE_13_ARBOLES.map((o) => o.id));
const EN_JARDIN = new Set(LOTE_13_JARDIN.map((o) => o.id));

/** A qué hoja de revisión va cada objeto (los juegos y los objetos inteligentes comparten hoja). */
export function familiaDeRevision(o: ObjetoCatalogo): FamiliaLote13 {
  if (EN_ARBOLES.has(o.id)) return 'arboles';
  if (EN_JARDIN.has(o.id)) return 'jardin';
  if (o.categoria === 'juegos' || o.categoria === 'colaboracion') return 'juegos';
  return 'exterior';
}

export interface ResultadoLote13 {
  /** Todos los cuadros dibujados por id canónico. */
  cuadros: Cuadros;
  /** Los objetos del lote 13 según el inventario. */
  objetos: ObjetoCatalogo[];
  /** Los que tienen todos sus cuadros con la medida exacta (los únicos que se publican). */
  terminados: ObjetoCatalogo[];
  /** Los que todavía no tienen todos sus cuadros. */
  pendientes: ObjetoCatalogo[];
}

/** Dibuja todo y revisa que no haya cuadros repetidos ni cuadros que el inventario no promete. */
export function construirLote13(): ResultadoLote13 {
  const cuadros: Cuadros = new Map();
  for (const [grupo, fuente] of Object.entries(GRUPOS_LOTE_13)) {
    for (const [id, lienzo] of fuente()) {
      if (cuadros.has(id)) throw new Error(`El cuadro ${id} está dibujado dos veces (grupo ${grupo}).`);
      cuadros.set(id, lienzo);
    }
  }
  const objetos = objetosDelLote13();
  const esperados = new Set(objetos.flatMap((o) => framesEsperados(o).map((f) => f.id)));
  const demas = [...cuadros.keys()].filter((id) => !esperados.has(id));
  if (demas.length > 0) throw new Error(`Hay cuadros que el inventario no promete: ${demas.slice(0, 10).join(', ')}.`);
  const terminados = objetos.filter((o) => verificarObjeto(o, cuadros).length === 0);
  const hechos = new Set(terminados.map((o) => o.id));
  return { cuadros, objetos, terminados, pendientes: objetos.filter((o) => !hechos.has(o.id)) };
}
