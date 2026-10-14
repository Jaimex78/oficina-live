/**
 * Empaquetador de sprites en un atlas.
 *
 * Algoritmo: estantes. Los sprites se ordenan por alto (de mayor a menor) y
 * luego por id, y se acomodan de izquierda a derecha; cuando una fila se
 * llena, empieza otro estante. El orden de entrada no importa: los mismos
 * sprites siempre dan el mismo atlas, byte por byte.
 *
 * Entre sprites (y alrededor del atlas) queda un relleno transparente. Evita
 * el "sangrado de textura": en WebGL, con filtros o escalas raras, el sprite
 * vecino se asomaría en el borde.
 */

import { Lienzo } from './lienzo';
import type { ItemSprite, Marco, ResultadoAtlas } from './tipos';

export interface OpcionesEmpaquetado {
  /** Ancho máximo del atlas en píxeles. Por defecto 1024. */
  anchoMax?: number;
  /** Píxeles transparentes entre sprites y en los bordes. Por defecto 2. */
  relleno?: number;
}

function compararCadenas(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * Junta los sprites en un solo lienzo y devuelve dónde quedó cada uno.
 * `frames[id]` es el rectángulo exacto del sprite, sin el relleno.
 * Lanza un error si hay ids repetidos o un sprite no cabe en `anchoMax`.
 */
export function empaquetar(items: readonly ItemSprite[], opciones: OpcionesEmpaquetado = {}): ResultadoAtlas {
  const anchoMax = opciones.anchoMax ?? 1024;
  const relleno = opciones.relleno ?? 2;
  if (!Number.isInteger(anchoMax) || anchoMax < 1) throw new RangeError(`anchoMax inválido: ${anchoMax}.`);
  if (!Number.isInteger(relleno) || relleno < 0) throw new RangeError(`relleno inválido: ${relleno}.`);
  if (items.length === 0) throw new RangeError('No hay sprites para empaquetar.');

  const vistos = new Set<string>();
  for (const item of items) {
    if (item.id === '') throw new RangeError('Hay un sprite con id vacío.');
    if (vistos.has(item.id)) throw new RangeError(`Id repetido en el atlas: "${item.id}".`);
    vistos.add(item.id);
    if (item.lienzo.ancho + 2 * relleno > anchoMax) {
      throw new RangeError(
        `El sprite "${item.id}" mide ${item.lienzo.ancho} px de ancho y no cabe en un atlas de ${anchoMax} px con relleno ${relleno}.`,
      );
    }
  }

  const orden = [...items].sort(
    (a, b) => b.lienzo.alto - a.lienzo.alto || compararCadenas(a.id, b.id),
  );

  const frames: Record<string, Marco> = {};
  let x = relleno;
  let y = relleno;
  let altoEstante = 0;
  let anchoUsado = 0;
  for (const item of orden) {
    const { ancho, alto } = item.lienzo;
    if (x > relleno && x + ancho + relleno > anchoMax) {
      y += altoEstante + relleno;
      x = relleno;
      altoEstante = 0;
    }
    frames[item.id] = { x, y, w: ancho, h: alto };
    x += ancho + relleno;
    altoEstante = Math.max(altoEstante, alto);
    anchoUsado = Math.max(anchoUsado, x);
  }
  const anchoAtlas = Math.max(1, anchoUsado);
  const altoAtlas = Math.max(1, y + altoEstante + relleno);

  const atlas = new Lienzo(anchoAtlas, altoAtlas);
  for (const item of orden) {
    const marco = frames[item.id] as Marco;
    atlas.pegar(item.lienzo, marco.x, marco.y, { modo: 'reemplazar' });
  }
  return { atlas, frames };
}
