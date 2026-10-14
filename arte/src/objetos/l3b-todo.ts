/**
 * Junta los dibujos del lote 3B (16 objetos, 48 cuadros) sin efectos secundarios: las pruebas y el constructor lo
 * importan. Aquí vive la lista exacta de objetos del lote y el control de que no falte ni sobre ningún cuadro.
 */

import { INVENTARIO, objetoPorId, type ObjetoCatalogo } from '@ol/shared';
import { framesEsperados, verificarObjeto } from './comunes';
import { cuadrosSillaTallada } from './l3b-asientos';
import { cuadrosArboles } from './l3b-arboles';
import type { Cuadros } from './l3b-comun';
import { cuadrosDecoracion3B } from './l3b-decoracion';
import { cuadrosHogar } from './l3b-hogar';
import { cuadrosArcade } from './l3b-juegos';
import { cuadrosMuebles } from './l3b-muebles';
import { cuadrosCuadroMariposas } from './l3b-paredes';

/** Los 16 objetos del lote, por categoría del inventario (la primera mitad del lote 3 va en el 3A). */
export const IDS_LOTE_3B: Readonly<Record<string, readonly string[]>> = {
  asientos: ['silla-tallada'],
  decoracion: ['perchero', 'ave-del-paraiso', 'comoda', 'estante-plantas', 'chimenea', 'acuario', 'cuadro-mariposas'],
  tecnologia: ['camara-tripode'],
  temporada: ['espantapajaros'],
  juegos: ['maquina-arcade', 'balon-futbol'],
  cocina: ['estante-frascos', 'mini-nevera'],
  exterior: ['pino', 'abedul'],
};

/** Orden del lote tal como lo pidió el coordinador. */
export const ORDEN_LOTE_3B: readonly string[] = [
  'silla-tallada', 'perchero', 'camara-tripode', 'ave-del-paraiso', 'espantapajaros', 'maquina-arcade', 'balon-futbol', 'comoda',
  'estante-plantas', 'estante-frascos', 'chimenea', 'acuario', 'mini-nevera', 'cuadro-mariposas', 'pino', 'abedul',
];

/** Los objetos del lote, en el orden del lote. */
export function objetosDelLote3B(): ObjetoCatalogo[] {
  return ORDEN_LOTE_3B.map((id) => {
    const o = objetoPorId(id);
    if (!o) throw new Error(`El inventario no tiene "${id}".`);
    return o;
  });
}

export interface ResultadoLote3B {
  /** Todos los cuadros dibujados por id canónico. */
  cuadros: Cuadros;
  /** Los 16 objetos del lote. */
  objetos: ObjetoCatalogo[];
}

/** Dibuja todo el lote y revisa que no haya cuadros repetidos, de más ni de menos. */
export function construirLote3B(): ResultadoLote3B {
  const cuadros: Cuadros = new Map();
  const fuentes = [cuadrosSillaTallada, cuadrosDecoracion3B, cuadrosArcade, cuadrosMuebles, cuadrosHogar, cuadrosCuadroMariposas, cuadrosArboles];
  for (const fuente of fuentes) {
    for (const [id, lienzo] of fuente()) {
      if (cuadros.has(id)) throw new Error(`El cuadro ${id} está dibujado dos veces.`);
      cuadros.set(id, lienzo);
    }
  }
  const objetos = objetosDelLote3B();
  const esperados = new Set(objetos.flatMap((o) => framesEsperados(o).map((f) => f.id)));
  const demas = [...cuadros.keys()].filter((id) => !esperados.has(id));
  if (demas.length > 0) throw new Error(`Hay cuadros que el inventario no promete: ${demas.slice(0, 10).join(', ')}.`);
  const problemas = objetos.flatMap((o) => verificarObjeto(o, cuadros));
  if (problemas.length > 0) throw new Error(`${problemas.length} problemas:\n${problemas.slice(0, 20).join('\n')}`);
  return { cuadros, objetos };
}

/** Los 16 ids por si una prueba necesita comprobar que el inventario sigue teniéndolos. */
export function idsDelLote3B(): string[] {
  return ORDEN_LOTE_3B.filter((id) => INVENTARIO.some((o) => o.id === id));
}
