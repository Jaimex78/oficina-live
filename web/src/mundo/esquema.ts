import Phaser from 'phaser';
import { CASILLA, celdasDe, huellaColocada, objetoPorId, type SalaMapa } from '@ol/shared';
import type { AreaMundo, ClaseId } from './areas';
import type { AnclaNombre } from './etiquetas';
import { aNumero, colorDePersona, inicialDe } from './estados-vista';
import { COLOR_CLASE, ICONO_DE_CLASE, dibujarIcono } from './iconos';
import { aMundo, aPantalla, type Proyeccion } from './proyeccion';
import { radioCirculo } from './zoom';

/**
 * La vista esquemática de lejos: sin arte, cada zona es un rectángulo teñido según su clase (reunión azul claro,
 * descanso rosa, escritorios gris, privada gris azulado, abierta durazno), los escritorios son puntos en cuadrícula
 * y las personas son círculos de color con su inicial. Se superpone al mundo con una transparencia que sube y baja suave.
 */

interface Paleta {
  piso: number;
  fondo: number;
  punto: number;
  texto: string;
  zonas: Record<ClaseId, { relleno: number; borde: number }>;
}

const CLARA: Paleta = {
  piso: 0xffffff,
  fondo: 0xd6f0da,
  punto: 0xb3bac9,
  texto: '#1F2433',
  zonas: {
    reunion: { relleno: 0xe4e8fc, borde: 0xbcc5f4 },
    descanso: { relleno: 0xfde8f3, borde: 0xf0b4d5 },
    escritorios: { relleno: 0xf1f3f8, borde: 0xd2d8e4 },
    privada: { relleno: 0xdde3ec, borde: 0xb3bdcd },
    abierta: { relleno: 0xfdf0e3, borde: 0xecd2b5 },
    silenciosa: { relleno: 0xe1f5e9, borde: 0xb5dfc5 },
    coworking: { relleno: 0xdcf5f1, borde: 0xa9dfd8 },
    escritorio: { relleno: 0xe9ecf3, borde: 0xc6cddb },
  },
};

const OSCURA: Paleta = {
  piso: 0x1a1f2e,
  fondo: 0x0e1118,
  punto: 0x56607a,
  texto: '#10131C',
  zonas: {
    reunion: { relleno: 0x26305a, borde: 0x4a58a0 },
    descanso: { relleno: 0x4a2540, borde: 0x8a4676 },
    escritorios: { relleno: 0x232a3d, borde: 0x3b4660 },
    privada: { relleno: 0x2a3245, borde: 0x465270 },
    abierta: { relleno: 0x3d3022, borde: 0x6d5a3e },
    silenciosa: { relleno: 0x1f3a2e, borde: 0x3c6e55 },
    coworking: { relleno: 0x1d3a3a, borde: 0x3a7a74 },
    escritorio: { relleno: 0x252c40, borde: 0x3b4660 },
  },
};

export const paletaDeEsquema = (oscuro: boolean): Paleta => (oscuro ? OSCURA : CLARA);

const PROF_BASE = 600_000;
const RES_ICONO = 4;
const TAM_ICONO = 18;

export interface EntradaEsquema {
  vp: Proyeccion;
  sala: SalaMapa | null;
  areas: readonly AreaMundo[];
  oscuro: boolean;
  /** 0 oculto, 1 completo. */
  t: number;
  personas: readonly AnclaNombre[];
  yoId: number | null;
}

export class Esquema {
  private readonly suelo: Phaser.GameObjects.Graphics;
  private readonly zonas: Phaser.GameObjects.Graphics;
  private readonly puntos: Phaser.GameObjects.Graphics;
  private readonly circulos: Phaser.GameObjects.Graphics;
  private readonly iniciales = new Map<number, Phaser.GameObjects.Text>();
  private iconos: { img: Phaser.GameObjects.Image; area: AreaMundo }[] = [];
  private fijo = { sala: null as SalaMapa | null, oscuro: false, zoom: -1, areas: null as readonly AreaMundo[] | null };

  constructor(private readonly escena: Phaser.Scene) {
    this.suelo = escena.add.graphics().setDepth(PROF_BASE).setVisible(false);
    this.zonas = escena.add.graphics().setDepth(PROF_BASE + 1).setVisible(false);
    this.puntos = escena.add.graphics().setDepth(PROF_BASE + 2).setVisible(false);
    this.circulos = escena.add.graphics().setDepth(PROF_BASE + 4).setVisible(false);
  }

  /** Color de fondo del lienzo cuando el esquema está completo (verde pálido de día, casi negro de noche). */
  static colorDeFondo(oscuro: boolean): number {
    return paletaDeEsquema(oscuro).fondo;
  }

  private texturaIcono(clase: ClaseId, oscuro: boolean): string {
    const color = COLOR_CLASE[clase][oscuro ? 'oscuro' : 'claro'];
    const key = `esq-ico|${ICONO_DE_CLASE[clase]}|${color}`;
    if (this.escena.textures.exists(key)) return key;
    const c = document.createElement('canvas');
    c.width = c.height = TAM_ICONO * RES_ICONO;
    const g = c.getContext('2d') as CanvasRenderingContext2D;
    g.scale(RES_ICONO, RES_ICONO);
    dibujarIcono(g, ICONO_DE_CLASE[clase], 0, 0, TAM_ICONO, color);
    this.escena.textures.addCanvas(key, c)?.setFilter(Phaser.Textures.FilterMode.LINEAR);
    return key;
  }

  /** Redibuja lo que no se mueve: el piso, las zonas, los puntos de los escritorios y los iconos. */
  private dibujarFijo(sala: SalaMapa, areas: readonly AreaMundo[], oscuro: boolean, zoom: number): void {
    const pal = paletaDeEsquema(oscuro);
    const px = 1 / zoom;

    const s = this.suelo.clear();
    s.fillStyle(pal.piso, 1);
    for (let y = 0; y < sala.alto; y++) {
      const fila = sala.piso[y];
      if (!fila) continue;
      let ini = -1;
      for (let x = 0; x <= sala.ancho; x++) {
        const hay = x < sala.ancho && Boolean(fila[x]);
        if (hay && ini < 0) ini = x;
        if (!hay && ini >= 0) {
          s.fillRect(ini * CASILLA, y * CASILLA, (x - ini) * CASILLA, CASILLA);
          ini = -1;
        }
      }
    }

    const z = this.zonas.clear();
    const grandes = areas.filter((a) => a.origen === 'zona').sort((a, b) => b.rect.w * b.rect.h - a.rect.w * a.rect.h);
    for (const a of grandes) {
      const c = pal.zonas[a.claseId];
      const r = { x: a.rect.x * CASILLA, y: a.rect.y * CASILLA, w: a.rect.w * CASILLA, h: a.rect.h * CASILLA };
      z.fillStyle(c.relleno, 1);
      z.fillRect(r.x, r.y, r.w, r.h);
      z.lineStyle(1.5 * px, c.borde, 1);
      z.strokeRect(r.x + 0.75 * px, r.y + 0.75 * px, r.w - 1.5 * px, r.h - 1.5 * px);
    }

    const p = this.puntos.clear();
    p.fillStyle(pal.punto, 1);
    const radio = Math.max(3 * px, 3);
    for (const c of sala.colocaciones) {
      const o = objetoPorId(c.objeto);
      if (!o || o.categoria !== 'puestos' || o.apoyado) continue;
      const celdas = celdasDe(huellaColocada(o, c.x, c.y, c.orientacion));
      let sx = 0;
      let sy = 0;
      for (const [x, y] of celdas) {
        sx += x;
        sy += y;
      }
      p.fillCircle((sx / celdas.length + 0.5) * CASILLA, (sy / celdas.length + 0.5) * CASILLA, radio);
    }

    for (const i of this.iconos) i.img.destroy();
    this.iconos = [];
    for (const a of grandes) {
      if (a.claseId === 'abierta' || a.claseId === 'escritorios' || a.claseId === 'privada') continue;
      const img = this.escena.add.image(0, 0, this.texturaIcono(a.claseId, oscuro)).setOrigin(0.5, 0.5).setDepth(PROF_BASE + 3).setVisible(false);
      this.iconos.push({ img, area: a });
    }
    this.fijo = { sala, oscuro, zoom, areas };
  }

  actualizar(e: EntradaEsquema): void {
    const visible = e.t > 0.01 && e.sala !== null;
    for (const g of [this.suelo, this.zonas, this.puntos, this.circulos]) g.setVisible(visible);
    if (!visible || !e.sala) {
      for (const i of this.iconos) i.img.setVisible(false);
      for (const t of this.iniciales.values()) t.setVisible(false);
      return;
    }
    const f = this.fijo;
    const cambio = f.sala !== e.sala || f.oscuro !== e.oscuro || f.areas !== e.areas || Math.abs(f.zoom - e.vp.zoom) > 0.004;
    if (cambio) this.dibujarFijo(e.sala, e.areas, e.oscuro, e.vp.zoom);
    for (const g of [this.suelo, this.zonas, this.puntos, this.circulos]) g.setAlpha(e.t);

    // Iconos de clase, en el centro de cada zona y siempre del mismo tamaño en pantalla.
    const escalaIcono = 1 / (e.vp.zoom * RES_ICONO);
    for (const i of this.iconos) {
      const r = i.area.rect;
      const c = aPantalla(e.vp, (r.x + r.w / 2) * CASILLA, (r.y + r.h / 2) * CASILLA);
      const ancho = r.w * CASILLA * e.vp.zoom;
      const alto = r.h * CASILLA * e.vp.zoom;
      const entra = ancho > TAM_ICONO * 1.6 && alto > TAM_ICONO * 1.6;
      i.img.setVisible(entra);
      if (!entra) continue;
      const m = aMundo(e.vp, Math.round(c.x), Math.round(c.y));
      i.img.setPosition(m.x, m.y).setScale(escalaIcono).setAlpha(e.t * 0.9);
    }

    // Personas: un círculo de color con su inicial.
    const g = this.circulos.clear();
    const r = radioCirculo(e.vp.zoom);
    const vivas = new Set<number>();
    for (const a of e.personas) {
      const p = a.persona;
      const cx = p.vx;
      const cy = p.vy - 12;
      const yo = p.id === e.yoId;
      g.fillStyle(0x0f1430, 0.18);
      g.fillCircle(cx + 1 / e.vp.zoom, cy + 2 / e.vp.zoom, r);
      g.fillStyle(aNumero(colorDePersona(p.id)), 1);
      g.fillCircle(cx, cy, r);
      g.lineStyle((yo ? 3 : 2) / e.vp.zoom, yo ? 0x5b4bdb : 0xffffff, 1);
      g.strokeCircle(cx, cy, r);

      let t = this.iniciales.get(p.id);
      if (!t) {
        t = this.escena.add
          .text(0, 0, '', { fontFamily: '"Inter Variable", Inter, system-ui, sans-serif', fontSize: '14px', fontStyle: '700', color: paletaDeEsquema(e.oscuro).texto, resolution: 3 })
          .setOrigin(0.5, 0.5)
          .setDepth(PROF_BASE + 5);
        this.iniciales.set(p.id, t);
      }
      const inicial = inicialDe(p);
      if (t.text !== inicial) t.setText(inicial);
      t.setColor(paletaDeEsquema(e.oscuro).texto);
      const s = aPantalla(e.vp, cx, cy);
      const m = aMundo(e.vp, Math.round(s.x), Math.round(s.y));
      t.setVisible(true).setAlpha(e.t).setScale(1 / e.vp.zoom).setPosition(m.x, m.y);
      vivas.add(p.id);
    }
    for (const [id, t] of this.iniciales) {
      if (vivas.has(id)) continue;
      t.destroy();
      this.iniciales.delete(id);
    }
  }

  destruir(): void {
    this.suelo.destroy();
    this.zonas.destroy();
    this.puntos.destroy();
    this.circulos.destroy();
    for (const i of this.iconos) i.img.destroy();
    for (const t of this.iniciales.values()) t.destroy();
    this.iconos = [];
    this.iniciales.clear();
  }
}
