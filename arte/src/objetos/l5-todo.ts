/**
 * Junta los dibujos del lote 5 sin efectos secundarios: las pruebas y el constructor lo importan. Aquí vive la lista
 * exacta de objetos y el control de que no falte ni sobre ningún cuadro.
 *
 * Atlas `objetos-v6`: 15 objetos.
 */

import { INVENTARIO, type ObjetoCatalogo } from '@ol/shared';
import { framesEsperados, verificarObjeto } from './comunes';
import type { Cuadros } from './l5-comun';
import { cuadrosEquipos } from './l5-equipos';
import { cuadrosKart } from './l5-kart';
import { cuadrosMesas } from './l5-mesas';
import { cuadrosMusica } from './l5-musica';
import { cuadrosPared } from './l5-pared';
import { cuadrosSillonGamer } from './l5-sillon';

/** Los 15 objetos del lote 5, por grupo y en el orden del inventario. */
export const IDS_LOTE_5: Readonly<Record<string, readonly string[]>> = {
  mesas: ['mesa-billar', 'mesa-air-hockey', 'mesa-poker', 'mesa-ajedrez'],
  pared: ['diana-dardos', 'aro-baloncesto'],
  musica: ['jukebox', 'piano', 'guitarra', 'vinilo-alfombra'],
  vehiculos: ['kart', 'sillon-gamer'],
  equipos: ['cabina-fotos', 'rack-servidores', 'nevera-vinos'],
};

export const IDS_ATLAS_V6: readonly string[] = Object.values(IDS_LOTE_5).flat();

/** Los objetos del atlas, en el orden del inventario. */
export function objetosDelAtlasV6(): ObjetoCatalogo[] {
  const ids = new Set(IDS_ATLAS_V6);
  return INVENTARIO.filter((o) => ids.has(o.id));
}

export interface ResultadoLote5 {
  /** Todos los cuadros dibujados por id canónico. */
  cuadros: Cuadros;
  /** Los 15 objetos del atlas. */
  objetos: ObjetoCatalogo[];
  /** Los que tienen todos sus cuadros con la medida exacta. */
  terminados: ObjetoCatalogo[];
}

/** Dibuja todo y revisa que no haya cuadros repetidos, de más ni de menos. */
export function construirLote5(): ResultadoLote5 {
  const cuadros: Cuadros = new Map();
  for (const fuente of [cuadrosMesas, cuadrosPared, cuadrosMusica, cuadrosKart, cuadrosSillonGamer, cuadrosEquipos]) {
    for (const [id, lienzo] of fuente()) {
      if (cuadros.has(id)) throw new Error(`El cuadro ${id} está dibujado dos veces.`);
      cuadros.set(id, lienzo);
    }
  }
  const objetos = objetosDelAtlasV6();
  const esperados = new Set(objetos.flatMap((o) => framesEsperados(o).map((f) => f.id)));
  const demas = [...cuadros.keys()].filter((id) => !esperados.has(id));
  if (demas.length > 0) throw new Error(`Hay cuadros que el inventario no promete: ${demas.slice(0, 10).join(', ')}.`);
  const terminados = objetos.filter((o) => verificarObjeto(o, cuadros).length === 0);
  return { cuadros, objetos, terminados };
}
