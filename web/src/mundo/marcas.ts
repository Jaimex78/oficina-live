import Phaser from 'phaser';
import { CASILLA, huellaColocada, huellaDe, mascaraPared, objetoPorId, type SalaMapa, type TipoZona } from '@ol/shared';
import { PROF } from '@ol/shared';
import type { Arte } from './arte';
import type { EstadoMundo } from './tipos';

const COLOR_ZONA: Record<TipoZona, number> = {
  abierta: 0x6b8cff,
  silenciosa: 0x34c759,
  privada: 0xa855f7,
  sala: 0xef3b3a,
  coworking: 0x2dd4bf,
};

const hexAColor = (c: string | undefined): number | null => (c && /^#[0-9a-fA-F]{6}$/.test(c) ? Number.parseInt(c.slice(1), 16) : null);

/** Todo lo que se dibuja encima del mundo mientras se edita: rejilla, sombra del objeto, selección, zonas, llegadas y avisos. */
export class Marcas {
  private readonly g: Phaser.GameObjects.Graphics;
  private readonly rejilla: Phaser.GameObjects.TileSprite;
  private readonly fantasma: Phaser.GameObjects.Image;
  private readonly rotulos: Phaser.GameObjects.Text[] = [];
  private pingInicio = new Map<number, number>();
  private dimension = '';

  constructor(
    private readonly escena: Phaser.Scene,
    private readonly arte: Arte,
  ) {
    if (!escena.textures.exists('rejilla')) {
      const c = document.createElement('canvas');
      c.width = c.height = CASILLA;
      const g = c.getContext('2d') as CanvasRenderingContext2D;
      g.fillStyle = '#ffffff';
      g.fillRect(CASILLA - 1, 0, 1, CASILLA);
      g.fillRect(0, CASILLA - 1, CASILLA, 1);
      escena.textures.addCanvas('rejilla', c);
    }
    this.rejilla = escena.add.tileSprite(0, 0, CASILLA, CASILLA, 'rejilla').setOrigin(0, 0).setDepth(PROF.marcas - 2).setAlpha(0.14).setVisible(false);
    this.g = escena.add.graphics().setDepth(PROF.marcas);
    this.fantasma = escena.add.image(0, 0, '__DEFAULT').setOrigin(0, 1).setDepth(PROF.marcas - 1).setVisible(false);
  }

  private rotulo(i: number): Phaser.GameObjects.Text {
    let t = this.rotulos[i];
    if (!t) {
      t = this.escena.add
        .text(0, 0, '', { font: '700 11px "Inter Variable", Inter, system-ui, sans-serif', color: '#ffffff', stroke: '#0a0b10', strokeThickness: 3, resolution: 3 })
        .setOrigin(0, 0)
        .setDepth(PROF.marcas + 1);
      this.rotulos[i] = t;
    }
    return t;
  }

  limpiar(): void {
    this.g.clear();
    this.rejilla.setVisible(false);
    this.fantasma.setVisible(false);
    this.rotulos.forEach((t) => t.setVisible(false));
  }

  actualizar(estado: EstadoMundo, sala: SalaMapa, tMs: number, zoom: number, cursor: { x: number; y: number } | null, claro: boolean): void {
    const g = this.g;
    g.clear();
    const dim = `${sala.id}:${sala.ancho}x${sala.alto}`;
    if (dim !== this.dimension) {
      this.dimension = dim;
      this.rejilla.setSize(sala.ancho * CASILLA, sala.alto * CASILLA);
    }
    this.rejilla.setVisible(estado.rejilla).setTint(claro ? 0x000000 : 0xffffff).setAlpha(claro ? 0.16 : 0.14);
    const fino = 1 / zoom;

    // Vista previa de lo que va a tocar el pincel o el rectángulo.
    if (estado.vistaPrevia) {
      const color = estado.vistaPrevia.tono === 'bien' ? 0x34c759 : 0xef3b3a;
      g.fillStyle(color, estado.vistaPrevia.tono === 'borrar' ? 0.5 : 0.38);
      for (const [x, y] of estado.vistaPrevia.celdas) g.fillRect(x * CASILLA, y * CASILLA, CASILLA, CASILLA);
    }

    // Zonas.
    let nRotulo = 0;
    if (estado.capas) {
      for (const z of sala.zonas) {
        const color = hexAColor(z.color) ?? COLOR_ZONA[z.tipo];
        const sel = estado.seleccion.some((s) => s.tipo === 'zona' && s.id === z.id);
        g.fillStyle(color, sel ? 0.2 : 0.1);
        g.fillRect(z.rect.x * CASILLA, z.rect.y * CASILLA, z.rect.w * CASILLA, z.rect.h * CASILLA);
        g.lineStyle(sel ? 3 * fino : 2 * fino, color, sel ? 1 : 0.7);
        g.strokeRect(z.rect.x * CASILLA + fino, z.rect.y * CASILLA + fino, z.rect.w * CASILLA - 2 * fino, z.rect.h * CASILLA - 2 * fino);
        const t = this.rotulo(nRotulo++);
        t.setText(z.nombre).setVisible(true).setScale(1 / zoom).setPosition(z.rect.x * CASILLA + 4 / zoom, z.rect.y * CASILLA + 3 / zoom);
      }
      // Áreas personales: el rectángulo donde cada persona puede cambiar cosas.
      for (const a of sala.areas ?? []) {
        const sinDuenos = a.duenos.length === 0;
        const color = sinDuenos ? 0x8e8e93 : 0x22b8d9;
        g.fillStyle(color, 0.1);
        g.fillRect(a.rect.x * CASILLA, a.rect.y * CASILLA, a.rect.w * CASILLA, a.rect.h * CASILLA);
        g.lineStyle(2 * fino, color, 0.85);
        g.strokeRect(a.rect.x * CASILLA + fino, a.rect.y * CASILLA + fino, a.rect.w * CASILLA - 2 * fino, a.rect.h * CASILLA - 2 * fino);
        const t = this.rotulo(nRotulo++);
        const corto = a.nombre.replace(/^Escritorio de /, '');
        t.setText(sinDuenos ? `${corto} (libre)` : corto).setVisible(true).setScale(1 / zoom).setPosition(a.rect.x * CASILLA + 4 / zoom, (a.rect.y + a.rect.h) * CASILLA - 16 / zoom);
      }
      // Puntos de llegada.
      for (const l of sala.llegadas) {
        const cx = (l.x + 0.5) * CASILLA;
        const cy = (l.y + 0.5) * CASILLA;
        const sel = estado.seleccion.some((s) => s.tipo === 'llegada' && s.x === l.x && s.y === l.y);
        g.fillStyle(0x34c759, 0.3);
        g.fillCircle(cx, cy, 12);
        g.lineStyle(2 * fino, sel ? 0xffffff : 0x34c759, 1);
        g.strokeCircle(cx, cy, 12);
        g.fillStyle(0x34c759, 1);
        g.fillTriangle(cx, cy - 6, cx - 5, cy + 4, cx + 5, cy + 4);
      }
      // Avisos de la revisión.
      for (const p of estado.problemas) {
        if (p.x === undefined || p.y === undefined) continue;
        const x = p.x * CASILLA + CASILLA - 6;
        const y = p.y * CASILLA + 6;
        g.fillStyle(p.nivel === 'error' ? 0xef3b3a : 0xf2b84b, 1);
        g.fillCircle(x, y, 5);
        g.lineStyle(1.5 * fino, 0x0a0b10, 1);
        g.strokeCircle(x, y, 5);
      }
    }
    for (let i = nRotulo; i < this.rotulos.length; i++) this.rotulos[i]?.setVisible(false);

    // Quien edita solo su área ve todo lo demás apagado.
    const ap = estado.areaPermitida;
    if (ap) {
      const W = sala.ancho * CASILLA;
      const H = sala.alto * CASILLA;
      const x1 = ap.x * CASILLA;
      const y1 = ap.y * CASILLA;
      const x2 = (ap.x + ap.w) * CASILLA;
      const y2 = (ap.y + ap.h) * CASILLA;
      g.fillStyle(0x0a0b10, 0.5);
      g.fillRect(0, 0, W, y1);
      g.fillRect(0, y2, W, H - y2);
      g.fillRect(0, y1, x1, y2 - y1);
      g.fillRect(x2, y1, W - x2, y2 - y1);
      g.lineStyle(3 * fino, 0xef3b3a, 1);
      g.strokeRect(x1 + fino, y1 + fino, x2 - x1 - 2 * fino, y2 - y1 - 2 * fino);
    }

    // Zona que se está dibujando.
    if (estado.zonaEnCurso) {
      const r = estado.zonaEnCurso;
      g.fillStyle(0xef3b3a, 0.18);
      g.fillRect(r.x * CASILLA, r.y * CASILLA, r.w * CASILLA, r.h * CASILLA);
      g.lineStyle(2 * fino, 0xef3b3a, 1);
      g.strokeRect(r.x * CASILLA, r.y * CASILLA, r.w * CASILLA, r.h * CASILLA);
    }

    // Selección de objetos.
    for (const s of estado.seleccion) {
      if (s.tipo !== 'colocacion') continue;
      const c = sala.colocaciones.find((p) => p.id === s.id);
      const o = c ? objetoPorId(c.objeto) : undefined;
      if (!c || !o) continue;
      const h = huellaColocada(o, c.x, c.y, c.orientacion);
      const x = h.x * CASILLA;
      const y = h.y * CASILLA;
      const w = h.ancho * CASILLA;
      const alto = h.alto * CASILLA;
      const sobre = o.sobresale;
      g.fillStyle(0xffffff, 0.12);
      g.fillRect(x, y - sobre, w, alto + sobre);
      g.lineStyle(2 * fino, 0xef3b3a, 1);
      g.strokeRect(x, y - sobre, w, alto + sobre);
      g.lineStyle(fino, 0xffffff, 0.9);
      g.strokeRect(x, y, w, alto);
      g.fillStyle(0xef3b3a, 1);
      for (const [px, py] of [[x, y - sobre], [x + w, y - sobre], [x, y + alto], [x + w, y + alto]] as const) g.fillRect(px - 2 * fino, py - 2 * fino, 4 * fino, 4 * fino);
    }

    // Cuadro de selección por arrastre.
    if (estado.marquesina) {
      const m = estado.marquesina;
      g.fillStyle(0xffffff, 0.1);
      g.fillRect(m.x, m.y, m.w, m.h);
      g.lineStyle(fino, 0xffffff, 0.9);
      g.strokeRect(m.x, m.y, m.w, m.h);
    }

    // Sombra del objeto que se va a colocar.
    const f = estado.fantasma;
    if (f) {
      const o = objetoPorId(f.objeto);
      if (o) {
        const h = huellaDe(o, f.orientacion);
        const mascara = o.autotile ? mascaraPared(sala, f.x, f.y) : undefined;
        const id = this.arte.asegurar(o, f.orientacion, f.variante, mascara);
        const ref = this.arte.referencia(this.escena.textures, id);
        if (ref) {
          this.fantasma.setTexture(ref.key, ref.frame).setPosition(f.x * CASILLA + (f.dx ?? 0), (f.y + h.alto) * CASILLA + (f.dy ?? 0)).setAlpha(f.valido ? 0.78 : 0.5);
          if (f.valido) this.fantasma.clearTint();
          else this.fantasma.setTint(0xff6b63);
          this.fantasma.setVisible(true);
        }
        const color = f.valido ? 0x34c759 : 0xef3b3a;
        g.fillStyle(color, 0.22);
        g.fillRect(f.x * CASILLA, f.y * CASILLA, f.ancho * CASILLA, f.alto * CASILLA);
        g.lineStyle(2 * fino, color, 1);
        g.strokeRect(f.x * CASILLA, f.y * CASILLA, f.ancho * CASILLA, f.alto * CASILLA);
      }
    } else {
      this.fantasma.setVisible(false);
      if (cursor && cursor.x >= 0 && cursor.y >= 0 && cursor.x < sala.ancho && cursor.y < sala.alto) {
        g.lineStyle(2 * fino, 0xffffff, 0.9);
        g.strokeRect(cursor.x * CASILLA, cursor.y * CASILLA, CASILLA, CASILLA);
      }
    }

    // Parpadeo para mostrar un problema.
    if (estado.ping) {
      const n = estado.ping.n;
      if (!this.pingInicio.has(n)) this.pingInicio.set(n, tMs);
      const dt = (tMs - (this.pingInicio.get(n) ?? tMs)) / 1400;
      if (dt < 1) {
        const cx = (estado.ping.x + 0.5) * CASILLA;
        const cy = (estado.ping.y + 0.5) * CASILLA;
        for (let i = 0; i < 2; i++) {
          const k = (dt + i * 0.35) % 1;
          g.lineStyle(3 * fino, 0xef3b3a, 1 - k);
          g.strokeCircle(cx, cy, 10 + k * 46);
        }
      }
      if (this.pingInicio.size > 6) this.pingInicio = new Map([[n, this.pingInicio.get(n) ?? tMs]]);
    }
  }

  destruir(): void {
    this.g.destroy();
    this.rejilla.destroy();
    this.fantasma.destroy();
    this.rotulos.forEach((t) => t.destroy());
    this.rotulos.length = 0;
  }
}
