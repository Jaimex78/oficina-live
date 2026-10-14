import Phaser from 'phaser';
import { PROF } from '@ol/shared';
import type { AreaMundo } from './areas';

/**
 * Los contornos que se dibujan sobre el mundo al caminar: blanco de 1 px al pasar el puntero por una sala o un área,
 * azul violeta al tocarla y verde azulado alrededor de tu propio escritorio. Cada línea mide lo mismo en pantalla con cualquier zoom.
 */

const VIOLETA = 0x5b4bdb;
const VERDE_AZULADO = 0x2dbfb0;
const SOMBRA = 0x0f1430;

export interface EntradaContornos {
  zoom: number;
  hover: AreaMundo | null;
  seleccion: AreaMundo | null;
  /** Tu escritorio, cuando estás parado en él. */
  miArea: AreaMundo | null;
  visible: boolean;
}

export class Contornos {
  private readonly g: Phaser.GameObjects.Graphics;
  private firma = '';

  constructor(escena: Phaser.Scene) {
    this.g = escena.add.graphics().setDepth(PROF.marcas - 5);
  }

  actualizar(e: EntradaContornos): void {
    // Solo se vuelve a dibujar si algo cambió: casi todos los cuadros no hay nada nuevo.
    const f = `${e.visible ? 1 : 0}|${e.zoom.toFixed(3)}|${e.hover?.id ?? ''}|${e.seleccion?.id ?? ''}|${e.miArea?.id ?? ''}`;
    if (f === this.firma) return;
    this.firma = f;
    const g = this.g;
    g.clear();
    if (!e.visible) return;
    const px = 1 / e.zoom;
    const rect = (a: AreaMundo) => ({ x: a.rect.x * 32, y: a.rect.y * 32, w: a.rect.w * 32, h: a.rect.h * 32 });

    if (e.miArea) {
      const r = rect(e.miArea);
      g.fillStyle(VERDE_AZULADO, 0.06);
      g.fillRect(r.x, r.y, r.w, r.h);
      g.lineStyle(1.5 * px, VERDE_AZULADO, 0.95);
      g.strokeRect(r.x + 0.75 * px, r.y + 0.75 * px, r.w - 1.5 * px, r.h - 1.5 * px);
    }
    if (e.seleccion) {
      const r = rect(e.seleccion);
      g.fillStyle(VIOLETA, 0.07);
      g.fillRect(r.x, r.y, r.w, r.h);
      g.lineStyle(2 * px, VIOLETA, 1);
      g.strokeRect(r.x + px, r.y + px, r.w - 2 * px, r.h - 2 * px);
    }
    if (e.hover && e.hover.id !== e.seleccion?.id) {
      const r = rect(e.hover);
      // Un hilo oscuro por fuera para que el blanco se lea también sobre pisos claros.
      g.lineStyle(px, SOMBRA, 0.38);
      g.strokeRect(r.x - 0.5 * px, r.y - 0.5 * px, r.w + px, r.h + px);
      g.lineStyle(px, 0xffffff, 1);
      g.strokeRect(r.x + 0.5 * px, r.y + 0.5 * px, r.w - px, r.h - px);
    }
  }

  destruir(): void {
    this.g.destroy();
  }
}
