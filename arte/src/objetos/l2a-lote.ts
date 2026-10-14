/**
 * Lote 2A: la lista de objetos, sus dibujos y la forma de armar todos sus cuadros.
 *
 * Este módulo no registra nada ni escribe archivos: lo usan el constructor (`lote2a.ts`) y las pruebas.
 * Cada objeto se dibuja UNA vez por vista (orientación o máscara) con la rampa de su material, y de ahí se
 * expanden las variantes de color con `recolorearVariante` (ver `expandirVariantes`).
 */

import { objetoPorId, type CategoriaId, type ObjetoCatalogo } from '@ol/shared';
import { Lienzo } from '../nucleo';
import type { DibujoObjeto } from './l2a-comun';
import { expandirVariantes } from './l2a-comun';
import { dibujoSillaComedor, dibujoSillaEjecutiva, dibujoBanco, dibujoBancaInterior, dibujoTaburete } from './l2a-asientos';
import { dibujoMesaAlta, dibujoMesaComedor, dibujoFutbolin, dibujoMesaPingpong, dibujoMesaReunion12, dibujoMesaReunion8 } from './l2a-mesas';
import { pisoAlfombraGris, pisoAlfombraRoja, pisoCesped, pisoCocina, pisoDeck, pisoParquet } from './l2a-pisos';
import { dibujoArchivador, dibujoCajonera, dibujoEscritorioDePie, dibujoEscritorioL, dibujoLocker, dibujoPapelera } from './l2a-puestos';
import { dibujoEscalera } from './l2a-escalera';
import { dibujoArco, dibujoAscensor, dibujoDivisorBajo, dibujoPuertaVidrio } from './l2a-paredes';
import { dibujoSofa2, dibujoSofaL } from './l2a-sofas';

/** Un piso es un tile único de 32 x 32: su dibujo base es el propio tile. */
function dePiso(f: () => Lienzo): () => DibujoObjeto {
  return () => ({ rampaBase: 'madera-clara', vistas: { U: f() } });
}

/** Dibujos del lote 2A, por id de objeto. Los objetos que aún no tienen dibujo no aparecen aquí. */
export const DIBUJOS_2A: Readonly<Record<string, () => DibujoObjeto>> = {
  // Pisos
  'piso-alfombra-gris': dePiso(pisoAlfombraGris),
  'piso-alfombra-roja': dePiso(pisoAlfombraRoja),
  'piso-cesped': dePiso(pisoCesped),
  'piso-deck': dePiso(pisoDeck),
  'piso-parquet': dePiso(pisoParquet),
  'piso-cocina': dePiso(pisoCocina),
  // Paredes, aberturas y escalera
  'divisor-bajo': dibujoDivisorBajo,
  'puerta-vidrio': dibujoPuertaVidrio,
  arco: dibujoArco,
  escalera: dibujoEscalera,
  ascensor: dibujoAscensor,
  // Puestos
  'escritorio-l': dibujoEscritorioL,
  'escritorio-de-pie': dibujoEscritorioDePie,
  locker: dibujoLocker,
  archivador: dibujoArchivador,
  cajonera: dibujoCajonera,
  papelera: dibujoPapelera,
  // Asientos
  'silla-ejecutiva': dibujoSillaEjecutiva,
  banco: dibujoBanco,
  taburete: dibujoTaburete,
  'sofa-2': dibujoSofa2,
  'sofa-l': dibujoSofaL,
  'banca-interior': dibujoBancaInterior,
  'silla-comedor': dibujoSillaComedor,
  // Mesas
  'mesa-reunion-8': dibujoMesaReunion8,
  'mesa-reunion-12': dibujoMesaReunion12,
  'mesa-alta': dibujoMesaAlta,
  'mesa-comedor': dibujoMesaComedor,
  'mesa-pingpong': dibujoMesaPingpong,
  futbolin: dibujoFutbolin,
};

/** Los 30 objetos del lote 2A, agrupados por categoría y en el orden de la tarea. */
export const OBJETOS_2A_POR_CATEGORIA: Readonly<Partial<Record<CategoriaId, readonly string[]>>> = {
  pisos: ['piso-alfombra-gris', 'piso-alfombra-roja', 'piso-cesped', 'piso-deck', 'piso-parquet', 'piso-cocina'],
  paredes: ['divisor-bajo', 'puerta-vidrio', 'arco', 'escalera', 'ascensor'],
  puestos: ['escritorio-l', 'escritorio-de-pie', 'locker', 'archivador', 'cajonera', 'papelera'],
  asientos: ['silla-ejecutiva', 'banco', 'taburete', 'sofa-2', 'sofa-l', 'banca-interior', 'silla-comedor'],
  mesas: ['mesa-reunion-8', 'mesa-reunion-12', 'mesa-alta', 'mesa-comedor', 'mesa-pingpong', 'futbolin'],
};

/** Ids de los 30 objetos, en el orden de la tarea. */
export const IDS_2A: readonly string[] = Object.values(OBJETOS_2A_POR_CATEGORIA).flat();

/** Ids del lote 2A que ya tienen dibujo. */
export function idsDibujados(): string[] {
  return IDS_2A.filter((id) => DIBUJOS_2A[id] !== undefined);
}

/** Los objetos del inventario del lote 2A. Falla si algún id no existe: el inventario manda. */
export function objetosDelLote(ids: readonly string[] = IDS_2A): ObjetoCatalogo[] {
  return ids.map((id) => {
    const o = objetoPorId(id);
    if (!o) throw new Error(`El objeto "${id}" no existe en el inventario.`);
    return o;
  });
}

/** Construye TODOS los cuadros de los objetos pedidos (por defecto, los que ya tienen dibujo), con sus variantes. */
export function construirCuadros2a(ids: readonly string[] = idsDibujados()): Map<string, Lienzo> {
  const cuadros = new Map<string, Lienzo>();
  for (const o of objetosDelLote(ids)) {
    const dibujo = DIBUJOS_2A[o.id];
    if (dibujo === undefined) throw new Error(`El objeto "${o.id}" todavía no tiene dibujo.`);
    for (const [id, lienzo] of expandirVariantes(o, dibujo())) cuadros.set(id, lienzo);
  }
  return cuadros;
}
