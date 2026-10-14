import type Phaser from 'phaser';
import type { SalaMapa } from '@ol/shared';
import { ExteriorEnEscena, type Exterior, type OpcionesExterior } from './capas';

export { ID_SALA_CON_CALLE, MARGEN_EXTERIOR, llevaCalle } from './geometria';
export type { Exterior, OpcionesExterior } from './capas';

/**
 * Dibuja la calle, el andén y los edificios vecinos alrededor de la sala, vistos desde el piso 4. Va detrás de todo lo
 * demás (profundidades por debajo del piso de la sala). Solo la sala principal lleva calle: ver `llevaCalle`.
 * El atlas se baja en segundo plano; mientras tanto se ve el fondo de bruma.
 */
export function crearExterior(escena: Phaser.Scene, sala: SalaMapa, opciones: OpcionesExterior): Exterior {
  return new ExteriorEnEscena(escena, sala, opciones);
}
