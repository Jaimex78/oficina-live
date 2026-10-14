import Phaser from 'phaser';
import { CASILLA, PROF } from '@ol/shared';

export interface RectCasillas {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Lo que se oscurece afuera de la sala: gris azulado, para que el color de lo de afuera se apague y no solo se oscurezca. */
const COLOR = 0x23262f;
const ALFA_MAX = 0.62;
/** Qué tan lejos del mapa llega el velo: la cámara puede mostrar márgenes (calle, vecinos) fuera de la sala. */
const MARGEN = 6000;
/** Rapidez del fundido: ~250 ms en llegar casi del todo. */
const RAPIDEZ = 11;

/**
 * Como en Gather al entrar a una sala de reuniones: todo lo de afuera se atenúa (oscurece y desatura) y el rectángulo de la sala
 * queda a plena luz. Es un velo en el mundo, con un hueco del tamaño de la sala, que aparece y desaparece con un fundido corto.
 * Va sobre las luces (de noche el hueco sigue siendo la luz de siempre) y bajo las etiquetas y las marcas.
 */
export class Atenuacion {
  private readonly g: Phaser.GameObjects.Graphics;
  /** Cuánto del velo se ve: de 0 a 1. */
  private t = 0;
  private objetivo = 0;
  private rect: RectCasillas | null = null;
  private pintado = '';

  constructor(escena: Phaser.Scene) {
    this.g = escena.add.graphics().setDepth(PROF.luces + 50).setVisible(false);
  }

  /** La sala en la que estás (null al salir). Al salir el hueco se queda donde estaba mientras el velo se desvanece. */
  fijar(sala: RectCasillas | null): void {
    if (sala) this.rect = { ...sala };
    this.objetivo = sala ? 1 : 0;
  }

  /** Cuánto del velo se ve ahora (de 0 a 1), para las pruebas. */
  get nivel(): number {
    return this.t;
  }

  /** `visible` baja el velo a cero sin cambiar la sala: en la vista esquemática o al construir no se atenúa. */
  actualizar(dt: number, visible: number): void {
    this.t += (this.objetivo - this.t) * (1 - Math.exp(-dt * RAPIDEZ));
    if (Math.abs(this.objetivo - this.t) < 0.004) this.t = this.objetivo;
    const alfa = this.t * ALFA_MAX * Math.max(0, Math.min(1, visible));
    const r = this.rect;
    if (!r || alfa < 0.003) {
      if (this.pintado !== '') {
        this.g.clear().setVisible(false);
        this.pintado = '';
      }
      return;
    }
    const clave = `${r.x},${r.y},${r.w},${r.h},${alfa.toFixed(3)}`;
    if (clave === this.pintado) return;
    this.pintado = clave;
    const x0 = r.x * CASILLA;
    const y0 = r.y * CASILLA;
    const x1 = (r.x + r.w) * CASILLA;
    const y1 = (r.y + r.h) * CASILLA;
    this.g.clear().setVisible(true).fillStyle(COLOR, alfa);
    this.g.fillRect(-MARGEN, -MARGEN, 2 * MARGEN + 0, MARGEN + y0); // arriba
    this.g.fillRect(-MARGEN, y1, 2 * MARGEN, MARGEN); // abajo
    this.g.fillRect(-MARGEN, y0, MARGEN + x0, y1 - y0); // izquierda
    this.g.fillRect(x1, y0, MARGEN, y1 - y0); // derecha
  }

  destruir(): void {
    this.g.destroy();
  }
}
