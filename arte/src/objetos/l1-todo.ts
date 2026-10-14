/**
 * Junta todas las categorías del lote 1 en un solo mapa de cuadros y calcula qué objetos están terminados
 * (los que tienen TODOS los cuadros que promete el inventario). No tiene efectos secundarios: las pruebas
 * lo importan directamente; el registro del constructor vive en `lote1.ts`.
 */

import { INVENTARIO, type ObjetoCatalogo } from '@ol/shared';
import { framesEsperados } from './comunes';
import type { Cuadros } from './l1-comun';
import { dibujarAberturas } from './l1-aberturas';
import { dibujarAsientos } from './l1-asientos';
import { dibujarParedes } from './l1-paredes';
import { dibujarPisos } from './l1-pisos';
import { dibujarCocina } from './l1-cocina';
import { dibujarColaboracion } from './l1-colaboracion';
import { dibujarDecoracion } from './l1-decoracion';
import { dibujarMesas } from './l1-mesas';
import { dibujarPuestos } from './l1-puestos';
import { dibujarTecnologia } from './l1-tecnologia';

export interface ResultadoLote1 {
  /** Todos los cuadros dibujados, por id canónico. */
  cuadros: Cuadros;
  /** Objetos del lote 1 del inventario, en el orden del inventario. */
  lote: ObjetoCatalogo[];
  /** De ellos, los que ya tienen todos sus cuadros. */
  terminados: ObjetoCatalogo[];
}

/** Los 40 objetos del lote 1 según el inventario (`lote: 1`). */
export function objetosDelLote1(): ObjetoCatalogo[] {
  return INVENTARIO.filter((o) => o.lote === 1);
}

export function construirLote1(): ResultadoLote1 {
  const cuadros: Cuadros = new Map();
  dibujarPisos(cuadros);
  dibujarParedes(cuadros);
  dibujarAberturas(cuadros);
  dibujarPuestos(cuadros);
  dibujarAsientos(cuadros);
  dibujarMesas(cuadros);
  dibujarTecnologia(cuadros);
  dibujarColaboracion(cuadros);
  dibujarCocina(cuadros);
  dibujarDecoracion(cuadros);
  const lote = objetosDelLote1();
  const terminados = lote.filter((o) => framesEsperados(o).every((f) => cuadros.has(f.id)));
  return { cuadros, lote, terminados };
}
