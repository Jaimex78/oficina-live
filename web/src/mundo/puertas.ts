import Phaser from 'phaser';
import { CASILLA, huellaDe, objetoPorId, profundidades, type Colocacion, type SalaMapa } from '@ol/shared';

/**
 * Hojas de las puertas, al estilo de Gather: la puerta está cerrada, una hoja de
 * madera que llena el hueco; al acercarse alguien se abre girando sobre su bisagra hacia el lado de quien llega, y se cierra sola
 * cuando ya no hay nadie cerca (es decir, cuando la persona ya cruzó y se alejó). No hay cerraduras: cerrada o abierta, la puerta
 * se atraviesa igual (el movimiento no mira este estado). El arte de la puerta (`puerta-simple`, `puerta-doble`) es solo el marco con
 * el hueco abierto, así que la hoja se dibuja en código encima, sin cuadros nuevos.
 */

import { avanzarPuerta, hayAlguienCerca, type Presencia } from './puertas-logica';

/** Giro máximo de la hoja al abrir: casi de canto, para que se vea que dejó libre el paso. */
const GIRO_MAX = (82 * Math.PI) / 180;

const MADERA = { clara: 0xe9c28a, media: 0xd4a26a, sombra: 0xb07a4e, oscura: 0x7b4b3a, metal: 0x9aa3b2, metalSombra: 0x5b6577 };

/** Hojas de la puerta de cubículo (lote 14): del color del panel de cada variante, más bajas que una puerta de pared. */
const HOJAS_CUBICULO: Record<string, typeof MADERA> = {
  base: { clara: 0xeef2f8, media: 0xb4c0cc, sombra: 0x7e8a97, oscura: 0x636d77, metal: 0xc4cdd9, metalSombra: 0x566274 },
  azul: { clara: 0x8fd0ec, media: 0x4f96cb, sombra: 0x2e5e9a, oscura: 0x2e5e9a, metal: 0xc4cdd9, metalSombra: 0x566274 },
  madera: { clara: 0xf7ddb0, media: 0xd4a26a, sombra: 0xb07a4e, oscura: 0x7b4b3a, metal: 0xc4cdd9, metalSombra: 0x566274 },
};
const esPuerta = (id: string): boolean => id === 'puerta-simple' || id === 'puerta-doble' || id === 'puerta-cubiculo';

function suave(t: number): number {
  return t * t * (3 - 2 * t);
}

interface Hoja {
  /** Bisagra en el suelo (píxeles de mundo) y hacia dónde apunta la hoja cerrada (vector unitario en el plano del piso). */
  hx: number;
  hy: number;
  dx: number;
  dy: number;
  largo: number;
  /** Una imagen por hoja: cada una se ordena con su punto más al frente, para que quien cruza no quede tapado por la hoja abierta. */
  g: Phaser.GameObjects.Graphics;
}

interface PuertaVista {
  c: Colocacion;
  huella: { x: number; y: number; ancho: number; alto: number };
  vertical: boolean;
  hojas: Hoja[];
  alto: number;
  /** Colores de la hoja (la madera de siempre, o el material del cubículo). */
  pal: typeof MADERA;
  /** Profundidad del marco de la puerta (el borde inferior de su casilla). */
  prof: number;
  p: number;
  /** Si alguien está cerca (la hoja va hacia abierta): para sonar una sola vez al abrir. */
  abierta: boolean;
  /** De qué lado se abre: +1 hacia el sur (o el este) y -1 hacia el norte (o el oeste), según de dónde llegó la última persona. */
  lado: 1 | -1;
  dibujado: string;
}

export class PuertasVista {
  private puertas: PuertaVista[] = [];
  private firma = '';
  private alfa = 1;
  private visible = true;

  constructor(private readonly escena: Phaser.Scene) {}

  sincronizar(sala: SalaMapa | null): void {
    if (!sala) {
      this.limpiar();
      return;
    }
    const firma = sala.colocaciones
      .filter((c) => esPuerta(c.objeto))
      .map((c) => `${c.id}:${c.objeto}:${c.variante}:${c.x},${c.y},${c.orientacion}`)
      .join('|');
    if (firma === this.firma) return;
    this.limpiar();
    this.firma = firma;
    const prof = profundidades(sala);
    sala.colocaciones.forEach((c, i) => {
      if (!esPuerta(c.objeto)) return;
      const o = objetoPorId(c.objeto);
      if (!o) return;
      const h = huellaDe(o, c.orientacion);
      const vertical = c.orientacion !== 'S';
      const n = vertical ? h.alto : h.ancho;
      const x0 = c.x * CASILLA;
      const y0 = c.y * CASILLA;
      const hojas: Hoja[] = [];
      const nueva = (hx: number, hy: number, dx: number, dy: number, largo: number): Hoja => ({ hx, hy, dx, dy, largo, g: this.escena.add.graphics() });
      let alto: number;
      if (!vertical) {
        // Hueco del arte (l1-aberturas): de la fila 24 a la 61 del cuadro de 64 px, 3 px de jamba a cada lado.
        // Puerta de cubículo (cuadro de 48 px): el hueco va de la fila 22 al pie del panel, en la fila 44.
        const cubiculo = c.objeto === 'puerta-cubiculo';
        const suelo = cubiculo ? y0 + CASILLA - 48 + 44 : y0 + CASILLA - 64 + 61;
        alto = cubiculo ? 22 : 37;
        const ancho = CASILLA * n - 6;
        if (n === 1) hojas.push(nueva(x0 + 3, suelo, 1, 0, ancho));
        else {
          hojas.push(nueva(x0 + 3, suelo, 1, 0, ancho / 2));
          hojas.push(nueva(x0 + CASILLA * n - 3, suelo, -1, 0, ancho / 2));
        }
      } else {
        // En un muro vertical se ve la hoja de canto: una tira fina que sigue la línea del muro, con la bisagra en los extremos.
        const xc = x0 + CASILLA / 2;
        alto = 24;
        const largo = CASILLA * n - 4;
        if (n === 1) hojas.push(nueva(xc, y0 + 2, 0, 1, largo));
        else {
          hojas.push(nueva(xc, y0 + 2, 0, 1, largo / 2));
          hojas.push(nueva(xc, y0 + CASILLA * n - 2, 0, -1, largo / 2));
        }
      }
      this.puertas.push({ c, huella: { x: c.x, y: c.y, ancho: h.ancho, alto: h.alto }, vertical, hojas, alto, pal: c.objeto === 'puerta-cubiculo' ? (HOJAS_CUBICULO[c.variante] ?? HOJAS_CUBICULO['base']!) : MADERA, prof: prof[i] ?? y0 + CASILLA, p: 0, abierta: false, lado: 1, dibujado: '' });
    });
    this.aplicarVisibilidad();
  }

  /** Una puerta empieza a abrirse (alguien se acerca) o a cerrarse (se aleja): `x`, `y` es su centro en píxeles del mundo. Lo conecta el motor para el sonido. */
  alCambiar: ((abre: boolean, x: number, y: number) => void) | null = null;

  /** `gente`: los pies de todas las personas de la sala (tú y las demás). */
  actualizar(dt: number, gente: readonly Presencia[]): void {
    for (const pu of this.puertas) {
      const cerca = this.visible ? hayAlguienCerca(pu.huella, gente) : false;
      const cx = (pu.huella.x + pu.huella.ancho / 2) * CASILLA;
      const cy = (pu.huella.y + pu.huella.alto / 2) * CASILLA;
      if (cerca !== pu.abierta) {
        pu.abierta = cerca;
        if (cerca) this.alCambiar?.(true, cx, cy);
      }
      if (cerca) pu.lado = this.ladoDe(pu, gente);
      const p = avanzarPuerta(pu.p, cerca, dt);
      // El golpe al cerrar suena cuando la hoja termina de cerrarse.
      if (pu.p > 0 && p === 0) this.alCambiar?.(false, cx, cy);
      if (p !== pu.p || pu.dibujado === '') {
        pu.p = p;
        this.dibujar(pu);
      }
    }
  }

  /** Estado de las puertas (0 cerrada, 1 abierta) en el orden en que se colocaron: para pruebas y capturas. */
  estados(): { id: string; p: number }[] {
    return this.puertas.map((pu) => ({ id: pu.c.id, p: pu.p }));
  }

  setAlfa(a: number): void {
    if (a === this.alfa) return;
    this.alfa = a;
    this.aplicarVisibilidad();
  }

  /** Solo se ven al caminar (en el editor la puerta es el marco, para poder elegirlo y moverlo). */
  setVisible(v: boolean): void {
    if (v === this.visible) return;
    this.visible = v;
    this.aplicarVisibilidad();
  }

  private aplicarVisibilidad(): void {
    for (const pu of this.puertas) for (const h of pu.hojas) h.g.setAlpha(this.alfa).setVisible(this.visible && this.alfa > 0.01);
  }

  /** El lado por el que está la persona más cercana: el este o el sur (+1), o el oeste o el norte (-1). */
  private ladoDe(pu: PuertaVista, gente: readonly Presencia[]): 1 | -1 {
    const cx = (pu.huella.x + pu.huella.ancho / 2) * CASILLA;
    const cy = (pu.huella.y + pu.huella.alto / 2) * CASILLA;
    let mejor = Infinity;
    let lado: 1 | -1 = pu.lado;
    for (const p of gente) {
      const d = Math.hypot(p.x - cx, p.y - 8 - cy);
      if (d >= mejor) continue;
      mejor = d;
      const v = pu.vertical ? p.x - cx : p.y - 8 - cy;
      if (Math.abs(v) > 3) lado = v > 0 ? 1 : -1;
    }
    return lado;
  }

  private dibujar(pu: PuertaVista): void {
    const e = suave(pu.p);
    const clave = `${e.toFixed(3)}|${pu.lado}`;
    if (clave === pu.dibujado) return;
    pu.dibujado = clave;
    const th = e * GIRO_MAX;
    for (const h of pu.hojas) {
      // Punta de la hoja: gira en el plano del piso alrededor de la bisagra hacia el lado de quien llega.
      const px = h.dx !== 0 ? 0 : pu.lado;
      const py = h.dx !== 0 ? pu.lado : 0;
      const tx = h.hx + (h.dx * Math.cos(th) + px * Math.sin(th)) * h.largo;
      const ty = h.hy + (h.dy * Math.cos(th) + py * Math.sin(th)) * h.largo;
      h.g.clear();
      this.hoja(h.g, h.hx, h.hy, tx, ty, pu.alto, pu.pal);
      // Más al frente que el punto de la hoja que da más al sur, pero nunca por detrás del marco.
      h.g.setDepth(pu.vertical ? Math.max(h.hy, ty) + 0.01 : pu.prof + 0.01);
    }
  }

  /**
   * Una hoja de pie sobre el piso, de la bisagra (hx, hy) a la punta (tx, ty), con `alto` px de alto: la cara, la tapa (4 px de
   * grosor) y el canto de la punta. Las tres se proyectan como el resto del arte: lo alto sube en pantalla.
   */
  private hoja(g: Phaser.GameObjects.Graphics, hx: number, hy: number, tx: number, ty: number, alto: number, pal: typeof MADERA): void {
    const largo = Math.hypot(tx - hx, ty - hy) || 1;
    const nx = -(ty - hy) / largo;
    const ny = (tx - hx) / largo;
    const t = 2;
    // Cara (el lado que mira a la cámara).
    g.fillStyle(pal.media, 1);
    g.fillPoints([new Phaser.Math.Vector2(hx, hy), new Phaser.Math.Vector2(tx, ty), new Phaser.Math.Vector2(tx, ty - alto), new Phaser.Math.Vector2(hx, hy - alto)], true);
    // Detalle de la cara: tablero hundido y manija, solo cuando se ve de frente.
    const ancho = Math.abs(tx - hx);
    if (ancho > 10) {
      const x = Math.min(hx, tx);
      g.lineStyle(1, pal.sombra, 1);
      g.strokeRect(x + 3, Math.min(hy, ty) - alto + 5, ancho - 6, alto - 10);
      const mx = hx < tx ? tx - 5 : tx + 5;
      g.fillStyle(pal.metal, 1);
      g.fillRect(mx - 1, ty - alto / 2, 2, 3);
      g.fillStyle(pal.metalSombra, 1);
      g.fillRect(mx - 1, ty - alto / 2 + 3, 2, 1);
    } else if (largo > 0 && Math.abs(ty - hy) > 10 && ancho <= 10) {
      // Tira de canto (muro vertical): una junta clara a lo largo.
      g.lineStyle(1, pal.sombra, 1);
      g.lineBetween(hx, hy - alto + 2, tx, ty - alto + 2);
    }
    // Tapa: la hoja vista desde arriba, con luz.
    g.fillStyle(pal.clara, 1);
    g.fillPoints(
      [
        new Phaser.Math.Vector2(hx - nx * t, hy - alto - ny * t),
        new Phaser.Math.Vector2(tx - nx * t, ty - alto - ny * t),
        new Phaser.Math.Vector2(tx + nx * t, ty - alto + ny * t),
        new Phaser.Math.Vector2(hx + nx * t, hy - alto + ny * t),
      ],
      true,
    );
    // Canto de la punta, que mira a la cámara cuando la hoja va hacia ella o a lo largo del muro.
    g.fillStyle(pal.sombra, 1);
    g.fillPoints(
      [
        new Phaser.Math.Vector2(tx - nx * t, ty - alto - ny * t),
        new Phaser.Math.Vector2(tx + nx * t, ty - alto + ny * t),
        new Phaser.Math.Vector2(tx + nx * t, ty + ny * t),
        new Phaser.Math.Vector2(tx - nx * t, ty - ny * t),
      ],
      true,
    );
    // Bisagra: un punto de metal en el arranque de la hoja.
    g.fillStyle(pal.metal, 1);
    g.fillRect(hx - 1, hy - alto * 0.7, 2, 3);
    g.fillRect(hx - 1, hy - alto * 0.25, 2, 3);
  }

  private limpiar(): void {
    for (const pu of this.puertas) for (const h of pu.hojas) h.g.destroy();
    this.puertas = [];
    this.firma = '';
  }

  destruir(): void {
    this.limpiar();
  }
}
