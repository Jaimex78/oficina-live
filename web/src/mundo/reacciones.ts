import Phaser from 'phaser';
import { PROF } from '@ol/shared';
import { escalaDeAparicion, opacidadDeReaccion } from './animacion-reaccion';
import { aMundo, aPantalla, type Proyeccion } from './proyeccion';
import type { VivoMundo } from './vivo';

/**
 * Las reacciones con emoji: suben flotando sobre la cabeza de quien reaccionó y se desvanecen. Miden lo mismo en pantalla
 * con cualquier zoom y siguen a la persona mientras suben.
 */

const DURACION_MS = 2400;
const SUBE_PX = 46;
const TAM_PX = 24;
const MAX_VIVAS = 24;
const PROF_REACCION = PROF.etiquetas + 2;

interface Viva {
  id: number;
  texto: Phaser.GameObjects.Text;
  nace: number;
  /** Desvío horizontal, en píxeles de pantalla, para que varias seguidas no se tapen. */
  desvio: number;
}

export class Reacciones {
  private readonly vivas: Viva[] = [];
  private contador = 0;

  constructor(
    private readonly escena: Phaser.Scene,
    private readonly vivo: VivoMundo,
  ) {}

  mostrar(id: number, emoji: string, ahoraMs: number): void {
    if (this.vivas.length >= MAX_VIVAS) this.vivas.shift()?.texto.destroy();
    const texto = this.escena.add
      .text(0, 0, emoji, { fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif', fontSize: `${TAM_PX}px`, resolution: 2 })
      .setOrigin(0.5, 1)
      .setDepth(PROF_REACCION);
    // Cada reacción seguida de la misma persona sale un poco a un lado.
    const desvio = ((this.contador++ % 3) - 1) * 14;
    this.vivas.push({ id, texto, nace: ahoraMs, desvio });
  }

  actualizar(ahoraMs: number, vp: Proyeccion, yCabezaDe: (id: number) => number | null): void {
    for (let i = this.vivas.length - 1; i >= 0; i--) {
      const v = this.vivas[i] as Viva;
      const k = (ahoraMs - v.nace) / DURACION_MS;
      const p = this.vivo.yo?.id === v.id ? this.vivo.yo : this.vivo.otros.get(v.id);
      const yCabeza = yCabezaDe(v.id);
      if (k >= 1 || !p || yCabeza === null) {
        v.texto.destroy();
        this.vivas.splice(i, 1);
        continue;
      }
      const s = aPantalla(vp, p.vx, yCabeza);
      const subida = SUBE_PX * (1 - (1 - k) ** 2);
      const sx = Math.round(s.x + v.desvio + Math.sin(k * 9 + v.id) * 3);
      const sy = Math.round(s.y - 26 - subida);
      const m = aMundo(vp, sx, sy);
      v.texto
        .setPosition(m.x, m.y)
        .setScale(escalaDeAparicion(k) / vp.zoom)
        .setAlpha(opacidadDeReaccion(k));
    }
  }

  destruir(): void {
    for (const v of this.vivas) v.texto.destroy();
    this.vivas.length = 0;
  }
}

