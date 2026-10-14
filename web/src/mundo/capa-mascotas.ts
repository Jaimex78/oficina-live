import Phaser from 'phaser';
import { MASCOTA_ALTO, MASCOTA_ANCHO, DIRECCIONES_PERSONAJE, PROF, claveMascota, type MascotaSpec, type SalaMapa } from '@ol/shared';
import { texturaDePildora } from './etiquetas';
import { PILDORA } from './estados-vista';
import { MascotaSim, cuadroDeMascota } from './mascota-motor';
import { celdaMascota, type FuenteMascotas } from './mascotas';
import { aMundo, aPantalla, type Proyeccion } from './proyeccion';
import type { Puente } from './puente';
import type { Cuadricula } from './ruta';
import type { PersonaVista } from './vivo';

/**
 * Las mascotas en el mundo. Cada persona con mascota tiene una `MascotaSim` (ver `mascota-motor.ts`) que camina detrás de ella;
 * aquí se dibujan con su sombra, en el mismo orden de profundidad que las personas (por los pies), y su etiqueta de nombre al
 * pasar el puntero. Barato: un sprite y una sombra por mascota, una textura por mascota y color, sin trabajo si nadie tiene una.
 */

/** Medio ancho de la zona donde el puntero «toca» a la mascota y alturas de arriba y de abajo desde sus pies. */
const MITAD_TOQUE = 9;
const ALTO_TOQUE = 20;
const ALTO_TOQUE_SENTADA = 13;
const MARGEN_PILDORA = 2;
const RES_PILDORA = 2;

interface Entrada {
  duenoId: number;
  sim: MascotaSim;
  clave: string;
  spec: MascotaSpec;
  textura: string;
  sprite: Phaser.GameObjects.Sprite;
  sombra: Phaser.GameObjects.Image;
  sueno: Phaser.GameObjects.Image;
  fase: number;
  sala: string;
}

export class CapaMascotas {
  private readonly entradas = new Map<number, Entrada>();
  private fuente: FuenteMascotas | null;
  private pildora: Phaser.GameObjects.Image | null = null;
  private alfa = 1;
  /** Dueño de la mascota bajo el puntero (su nombre se muestra encima). */
  hoverDueno: number | null = null;

  constructor(
    private readonly escena: Phaser.Scene,
    private readonly puente: Puente,
  ) {
    this.fuente = puente.mascotas ?? null;
    if (!escena.textures.exists('sombra-mascota')) {
      const c = document.createElement('canvas');
      c.width = 16;
      c.height = 6;
      const g = c.getContext('2d') as CanvasRenderingContext2D;
      const ovalo = (rx: number, ry: number, alfa: number) => {
        g.fillStyle = `rgba(20,24,40,${alfa})`;
        for (let y = -ry; y <= ry; y++) {
          const ancho = Math.round(rx * Math.sqrt(1 - (y * y) / (ry * ry + 0.0001)));
          g.fillRect(8 - ancho, 3 + y, ancho * 2, 1);
        }
      };
      ovalo(7, 2, 0.16);
      ovalo(5, 1, 0.2);
      escena.textures.addCanvas('sombra-mascota', c);
    }
    if (!escena.textures.exists('sueno-mascota')) {
      // Una «z» de 5 x 5 píxeles, clara con contorno oscuro, para cuando duerme.
      const c = document.createElement('canvas');
      c.width = 7;
      c.height = 7;
      const g = c.getContext('2d') as CanvasRenderingContext2D;
      const z: ReadonlyArray<readonly [number, number]> = [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [3, 1], [2, 2], [1, 3], [0, 4], [1, 4], [2, 4], [3, 4], [4, 4]];
      g.fillStyle = '#1B2036';
      for (const [x, y] of z) for (const [ox, oy] of [[-1, 0], [1, 0], [0, -1], [0, 1]] as const) g.fillRect(1 + x + ox, 1 + y + oy, 1, 1);
      g.fillStyle = '#EAF0FF';
      for (const [x, y] of z) g.fillRect(1 + x, 1 + y, 1, 1);
      escena.textures.addCanvas('sueno-mascota', c);
    }
  }

  private textura(spec: MascotaSpec): string | null {
    const f = this.fuente;
    if (!f) return null;
    const llave = `mascota:${claveMascota(spec)}`;
    if (this.escena.textures.exists(llave)) return llave;
    const hoja = f.hoja(spec);
    if (!hoja) return null;
    const tex = this.escena.textures.addCanvas(llave, hoja);
    if (!tex) return null;
    for (const dir of DIRECCIONES_PERSONAJE) {
      for (let c = 0; c < 4; c++) {
        const { x, y } = celdaMascota(dir, c);
        tex.add(`${dir}${c}`, 0, x, y, MASCOTA_ANCHO, MASCOTA_ALTO);
      }
    }
    return llave;
  }

  private quitar(e: Entrada): void {
    e.sprite.destroy();
    e.sombra.destroy();
    e.sueno.destroy();
  }

  /** Mueve y dibuja las mascotas. `dtMs` y `tMs` son los de Phaser; `g` es la rejilla de colisión de la sala. */
  actualizar(dtMs: number, tMs: number, sala: SalaMapa | null, g: Cuadricula): void {
    const v = this.puente.vivo;
    const duenos: PersonaVista[] = [];
    if (this.fuente && sala) {
      if (v.yo?.avatar?.mascota) duenos.push(v.yo);
      for (const p of v.otros.values()) if (p.avatar?.mascota) duenos.push(p);
    }
    if (duenos.length === 0 && this.entradas.size === 0) return;
    const vivos = new Set<number>();
    const dt = Math.min(dtMs, 100) / 1000;
    for (const p of duenos) {
      const spec = p.avatar!.mascota!;
      const clave = claveMascota(spec);
      let e = this.entradas.get(p.id);
      if (e && e.clave !== clave) {
        this.quitar(e);
        this.entradas.delete(p.id);
        e = undefined;
      }
      if (!e) {
        const textura = this.textura(spec);
        if (!textura) continue;
        const sim = new MascotaSim(p.vx, p.vy, sala!.id);
        const sprite = this.escena.add.sprite(p.vx, p.vy, textura, `${p.dir}0`).setOrigin(0.5, 1);
        const sombra = this.escena.add.image(p.vx, p.vy, 'sombra-mascota');
        const sueno = this.escena.add.image(p.vx, p.vy, 'sueno-mascota').setVisible(false).setOrigin(0.5, 1);
        e = { duenoId: p.id, sim, clave, spec, textura, sprite, sombra, sueno, fase: (p.id * 0.61) % 1, sala: sala!.id };
        this.entradas.set(p.id, e);
        sim.aparecerCerca({ x: p.vx, y: p.vy, dir: p.dir, anim: p.anim, sala: sala!.id }, g);
      }
      vivos.add(p.id);
      e.sim.actualizar(dt, { x: p.vx, y: p.vy, dir: p.dir, anim: p.anim, sala: sala!.id }, g);
      const x = Math.round(e.sim.x);
      const y = Math.round(e.sim.y);
      const cuadro = cuadroDeMascota(e.sim.postura, tMs, e.fase);
      e.sprite.setFrame(`${e.sim.dir}${cuadro}`);
      e.sprite.setPosition(x, y).setDepth(y - 0.3);
      e.sombra.setPosition(x, y - 2).setDepth(y - 0.8);
      const dormida = e.sim.postura === 'dormida';
      e.sueno.setVisible(dormida && this.alfa > 0.01);
      if (dormida) {
        const ciclo = (tMs / 1400 + e.fase) % 1;
        e.sueno.setPosition(x + 7 + Math.round(ciclo * 3), y - 22 - Math.round(ciclo * 6)).setDepth(y + 0.5).setAlpha(this.alfa * (ciclo < 0.8 ? 1 : (1 - ciclo) * 5));
      }
    }
    for (const [id, e] of this.entradas) {
      if (vivos.has(id)) continue;
      this.quitar(e);
      this.entradas.delete(id);
    }
  }

  /** El dueño de la mascota que se ve bajo un punto del mundo (la de más al frente), o `null`. */
  bajo(px: number, py: number): number | null {
    let mejor: Entrada | null = null;
    for (const e of this.entradas.values()) {
      const alto = e.sim.postura === 'sentada' || e.sim.postura === 'dormida' ? ALTO_TOQUE_SENTADA : ALTO_TOQUE;
      if (Math.abs(px - e.sim.x) <= MITAD_TOQUE && py >= e.sim.y - alto && py <= e.sim.y + 2 && (!mejor || e.sim.y > mejor.sim.y)) mejor = e;
    }
    return mejor?.duenoId ?? null;
  }

  /** El nombre de la mascota (el que le puso su dueño o, si no tiene, el de su especie) para la etiqueta. */
  private nombreDe(e: Entrada): string {
    return e.spec.nombre?.trim() || this.fuente?.def(e.spec.id)?.nombre || 'Mascota';
  }

  /** Dibuja la etiqueta con el nombre sobre la mascota que está bajo el puntero. */
  actualizarEtiqueta(vp: Proyeccion, oscuro: boolean, visible: boolean): void {
    const e = visible && this.hoverDueno !== null ? this.entradas.get(this.hoverDueno) : undefined;
    if (!e) {
      this.pildora?.setVisible(false);
      return;
    }
    const estilo = oscuro ? PILDORA.claraOscura : PILDORA.clara;
    const t = texturaDePildora(this.escena, { texto: this.nombreDe(e), fondo: estilo.fondo, colorTexto: estilo.texto, borde: estilo.borde, tam: 11, peso: 600 });
    this.pildora ??= this.escena.add.image(0, 0, t.key).setOrigin(0, 0).setDepth(PROF.etiquetas);
    if (this.pildora.texture.key !== t.key) this.pildora.setTexture(t.key);
    const dormida = e.sim.postura === 'dormida';
    const s = aPantalla(vp, e.sim.x, e.sim.y - (e.sim.postura === 'sentada' || dormida ? 20 : 28));
    const m = aMundo(vp, Math.round(s.x - t.w / 2) - MARGEN_PILDORA, Math.round(s.y - 3 - t.h) - MARGEN_PILDORA);
    this.pildora.setPosition(m.x, m.y).setScale(1 / (vp.zoom * RES_PILDORA)).setVisible(this.alfa > 0.5);
  }

  /** Transparencia (el esquema las tapa al alejar). */
  setAlfa(a: number): void {
    this.alfa = a;
    const visible = a > 0.01;
    for (const e of this.entradas.values()) {
      e.sprite.setAlpha(a).setVisible(visible);
      e.sombra.setAlpha(a).setVisible(visible);
    }
  }

  /** Cuántas mascotas hay dibujadas (para pruebas y depuración). */
  get cantidad(): number {
    return this.entradas.size;
  }

  destruir(): void {
    for (const e of this.entradas.values()) this.quitar(e);
    this.entradas.clear();
    this.pildora?.destroy();
    this.pildora = null;
  }
}

export { MASCOTA_ALTO };
