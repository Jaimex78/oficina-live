/**
 * Junta los dibujos del lote 2B (52 objetos, 186 cuadros) sin efectos secundarios: las pruebas y el constructor
 * lo importan. Aquí vive la lista exacta de objetos del lote y el control de que no falte ni sobre ningún cuadro.
 */

import { INVENTARIO, objetoPorId, type ObjetoCatalogo } from '@ol/shared';
import { framesEsperados, verificarObjeto } from './comunes';
import { cuadrosCerca } from './l2b-cerca';
import { cuadrosCocina } from './l2b-cocina';
import { cuadrosColaboracion } from './l2b-colaboracion';
import type { Cuadros } from './l2b-comun';
import { cuadrosDecoracion } from './l2b-decoracion';
import { cuadrosExterior } from './l2b-exterior';
import { cuadrosParedes } from './l2b-paredes';
import { cuadrosTecnologia } from './l2b-tecnologia';
import { cuadrosTemporada } from './l2b-temporada';

/** Los 52 objetos del lote, por categoría del inventario (el lote 1 y el 2A dibujan el resto). */
export const IDS_LOTE_2B: Readonly<Record<string, readonly string[]>> = {
  tecnologia: ['pizarra-digital', 'proyector', 'camara-sala', 'parlante'],
  colaboracion: ['rotafolio', 'corcho', 'pared-postits', 'recepcion', 'totem-bienvenida', 'buzon-ideas'],
  cocina: ['microondas', 'dispensador-agua', 'maquina-expendedora', 'barra', 'cafetera', 'tostadora', 'frutero', 'nevera-bebidas', 'lavaplatos'],
  decoracion: ['planta-colgante', 'palmera', 'cuadro-chico', 'reloj-pared', 'lampara-mesa', 'lampara-colgante', 'trofeos', 'bandera', 'cojin', 'pecera', 'cortinas', 'espejo', 'alfombra-redonda'],
  temporada: ['luces-navidad', 'arbol-navidad', 'calabazas', 'globos', 'banderines', 'regalos', 'cartel-cumpleanos', 'pinata'],
  exterior: ['banca-exterior', 'mesa-terraza', 'sombrilla', 'jardinera', 'arbol', 'fuente', 'bicicletero', 'cerca'],
};

/** Objetos del lote 2B que ya se publican en `objetos-v3`. Cambia entre hitos: el último hito los incluye a todos. */
export const OBJETOS_PUBLICADOS: readonly string[] = Object.values(IDS_LOTE_2B).flat();

/** Los objetos del lote, en el orden del inventario. */
export function objetosDelLote2B(): ObjetoCatalogo[] {
  const ids = new Set(Object.values(IDS_LOTE_2B).flat());
  return INVENTARIO.filter((o) => ids.has(o.id));
}

export interface ResultadoLote2B {
  /** Todos los cuadros dibujados por id canónico. */
  cuadros: Cuadros;
  /** Los 52 objetos del lote. */
  objetos: ObjetoCatalogo[];
  /** Los que tienen todos sus cuadros y se publican (`OBJETOS_PUBLICADOS`). */
  terminados: ObjetoCatalogo[];
}

/** Dibuja todo el lote y revisa que no haya cuadros repetidos, de más ni de menos. */
export function construirLote2B(): ResultadoLote2B {
  const cuadros: Cuadros = new Map();
  const fuentes = [cuadrosTecnologia, cuadrosColaboracion, cuadrosCocina, cuadrosDecoracion, cuadrosTemporada, cuadrosExterior, cuadrosParedes, cuadrosCerca];
  for (const fuente of fuentes) {
    for (const [id, lienzo] of fuente()) {
      if (cuadros.has(id)) throw new Error(`El cuadro ${id} está dibujado dos veces.`);
      cuadros.set(id, lienzo);
    }
  }
  const objetos = objetosDelLote2B();
  const esperados = new Set(objetos.flatMap((o) => framesEsperados(o).map((f) => f.id)));
  const demas = [...cuadros.keys()].filter((id) => !esperados.has(id));
  if (demas.length > 0) throw new Error(`Hay cuadros que el inventario no promete: ${demas.slice(0, 10).join(', ')}.`);
  const publicados = new Set(OBJETOS_PUBLICADOS);
  const terminados = objetos.filter((o) => publicados.has(o.id) && verificarObjeto(o, cuadros).length === 0);
  return { cuadros, objetos, terminados };
}

/** Los 52 ids por si una prueba necesita comprobar que el inventario sigue teniéndolos. */
export function idsDelLote2B(): string[] {
  return Object.values(IDS_LOTE_2B).flat().filter((id) => objetoPorId(id) !== undefined);
}
