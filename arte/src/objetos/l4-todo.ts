/**
 * Junta los dibujos del lote 4 (equipo gamer, PlayStation y baños) y de la primera mitad del lote 3 sin efectos secundarios: las
 * pruebas y el constructor lo importan. Aquí vive la lista exacta de objetos y el control de que no falte ni sobre
 * ningún cuadro.
 *
 * Atlas `objetos-v4`: 22 objetos (5 del lote 4 y 17 del lote 3).
 */

import { INVENTARIO, type ObjetoCatalogo } from '@ol/shared';
import { framesEsperados, verificarObjeto } from './comunes';
import type { Cuadros } from './l4-comun';
import { registrar } from './l4-comun';
import { cuadrosBanos } from './l4-banos';
import { cuadrosPequenos } from './l4-decoracion';
import { cuadrosGamer } from './l4-gamer';
import { pisoAlfombraLavanda, pisoBaldosaAjedrez, pisoLadrilloCrema, pisoLosaRombos } from './l4-pisos';
import { cuadrosSillon } from './l4-sillon';

/** Los 5 objetos del lote 4 en el orden del inventario. */
export const IDS_LOTE_4: readonly string[] = ['ps5', 'sanitario', 'lavamanos', 'urinario'];

/** Los 17 objetos de la primera mitad del lote 3, por tipo. */
export const IDS_LOTE_3A: Readonly<Record<string, readonly string[]>> = {
  pisos: ['piso-ladrillo-crema', 'piso-alfombra-lavanda', 'piso-baldosa-ajedrez', 'piso-losa-rombos'],
  decoracion: ['manzana', 'cono-naranja', 'planta-helecho', 'suculenta', 'planta-globo', 'pato-de-goma', 'figuritas', 'reloj-de-pie'],
  cocina: ['taza-postre', 'bowl-comida'],
  tecnologia: ['consola-juegos'],
  asientos: ['sillon-rojo'],
};

/** Todos los ids del atlas, lote 3A primero. */
export const IDS_ATLAS_V4: readonly string[] = [...Object.values(IDS_LOTE_3A).flat(), ...IDS_LOTE_4];

/** Los pisos del lote 3A: tiles de 32 x 32 sin costuras. */
export function cuadrosPisos(): Cuadros {
  const c: Cuadros = new Map();
  registrar(c, 'piso-ladrillo-crema', 'U', pisoLadrilloCrema());
  registrar(c, 'piso-alfombra-lavanda', 'U', pisoAlfombraLavanda());
  registrar(c, 'piso-baldosa-ajedrez', 'U', pisoBaldosaAjedrez());
  registrar(c, 'piso-losa-rombos', 'U', pisoLosaRombos());
  return c;
}

/** Los objetos del atlas, en el orden del inventario. */
export function objetosDelAtlasV4(): ObjetoCatalogo[] {
  const ids = new Set(IDS_ATLAS_V4);
  return INVENTARIO.filter((o) => ids.has(o.id));
}

export interface ResultadoLote4 {
  /** Todos los cuadros dibujados por id canónico. */
  cuadros: Cuadros;
  /** Los 22 objetos del atlas. */
  objetos: ObjetoCatalogo[];
  /** Los que tienen todos sus cuadros con la medida exacta. */
  terminados: ObjetoCatalogo[];
}

/** Dibuja todo y revisa que no haya cuadros repetidos, de más ni de menos. */
export function construirLote4(): ResultadoLote4 {
  const cuadros: Cuadros = new Map();
  for (const fuente of [cuadrosPisos, cuadrosPequenos, cuadrosGamer, cuadrosSillon, cuadrosBanos]) {
    for (const [id, lienzo] of fuente()) {
      if (cuadros.has(id)) throw new Error(`El cuadro ${id} está dibujado dos veces.`);
      cuadros.set(id, lienzo);
    }
  }
  const objetos = objetosDelAtlasV4();
  const esperados = new Set(objetos.flatMap((o) => framesEsperados(o).map((f) => f.id)));
  const demas = [...cuadros.keys()].filter((id) => !esperados.has(id));
  if (demas.length > 0) throw new Error(`Hay cuadros que el inventario no promete: ${demas.slice(0, 10).join(', ')}.`);
  const terminados = objetos.filter((o) => verificarObjeto(o, cuadros).length === 0);
  return { cuadros, objetos, terminados };
}
