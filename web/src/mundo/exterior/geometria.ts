import type { SalaMapa } from '@ol/shared';
import type { Geometria, Rect } from './tipos';

/** Casillas de exterior que se dibujan más allá de cada lado de la sala. */
export const MARGEN_EXTERIOR = 24;

/** Solo la sala principal (el piso 4 de Naos) lleva calle. Las demás salas conservan el fondo plano de siempre. */
export const ID_SALA_CON_CALLE = 'piso-4';

export const llevaCalle = (sala: SalaMapa): boolean => sala.id === ID_SALA_CON_CALLE;

/** Mínimo rectángulo que contiene las casillas con piso que cumplen la condición, o `null` si no hay ninguna. */
function cajaDe(sala: SalaMapa, cumple: (piso: string) => boolean): Rect | null {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (let y = 0; y < sala.alto; y++) {
    const fila = sala.piso[y];
    if (!fila) continue;
    for (let x = 0; x < sala.ancho; x++) {
      const p = fila[x];
      if (!p || !cumple(p)) continue;
      x0 = Math.min(x0, x);
      y0 = Math.min(y0, y);
      x1 = Math.max(x1, x + 1);
      y1 = Math.max(y1, y + 1);
    }
  }
  return Number.isFinite(x0) ? { x0, y0, x1, y1 } : null;
}

/**
 * Lee de la sala dónde está el edificio. El piso del balcón (`piso-deck`) se separa del cuerpo del edificio: el cuerpo
 * da la fachada y el balcón sale de la esquina. Si la sala no tiene piso, se usa casi toda la sala.
 */
export function geometriaDeSala(sala: SalaMapa): Geometria {
  const ed = cajaDe(sala, (p) => p !== 'piso-deck') ?? { x0: 1, y0: 1, x1: Math.max(2, sala.ancho - 1), y1: Math.max(2, sala.alto - 1) };
  const balcon = cajaDe(sala, (p) => p === 'piso-deck');
  return { ancho: sala.ancho, alto: sala.alto, ed, balcon };
}
