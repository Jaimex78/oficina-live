import Phaser from 'phaser';
import { CASILLA, INVENTARIO, PROF, apoyosDe, huellaDe, mascaraPared, objetoPorId, profundidades, type SalaMapa } from '@ol/shared';
import type { Arte } from './arte';

/**
 * Dibuja una sala: el piso como un mapa de baldosas y cada objeto como una imagen ordenada por su borde inferior,
 * de modo que las personas pasan por delante o por detrás según donde pisen. Solo toca lo que cambió.
 */
export class VistaSala {
  private mapa: Phaser.Tilemaps.Tilemap | null = null;
  private capaPiso: Phaser.Tilemaps.TilemapLayer | null = null;
  private pisoPrevio: string[][] | null = null;
  private dimension = '';
  private readonly indicePiso = new Map<string, number>();
  private readonly imagenes = new Map<string, { img: Phaser.GameObjects.Image; clave: string }>();
  private readonly placas = new Map<string, Phaser.GameObjects.Text>();
  private placaVisible: string | null = null;
  /** Transparencia de todo el arte (el esquema lo tapa al alejar). */
  private alfa = 1;

  constructor(
    private readonly escena: Phaser.Scene,
    private readonly arte: Arte,
  ) {}

  /** Transparencia del piso y de todos los objetos. A 0 no se dibuja nada (no cuesta). */
  setAlfa(a: number): void {
    if (a === this.alfa) return;
    this.alfa = a;
    this.aplicarAlfa();
  }

  private aplicarAlfa(): void {
    const visible = this.alfa > 0.01;
    this.capaPiso?.setAlpha(this.alfa).setVisible(visible);
    for (const e of this.imagenes.values()) e.img.setAlpha(this.alfa).setVisible(visible);
  }

  /** Imagen que se está dibujando para una colocación (para resaltarla o medirla). */
  imagenDe(id: string): Phaser.GameObjects.Image | undefined {
    return this.imagenes.get(id)?.img;
  }

  sincronizar(sala: SalaMapa | null): void {
    if (!sala) {
      this.limpiar();
      return;
    }
    const dim = `${sala.id}:${sala.ancho}x${sala.alto}`;
    if (dim !== this.dimension) {
      this.limpiar();
      this.dimension = dim;
    }
    this.sincronizarPiso(sala);
    this.sincronizarObjetos(sala);
  }

  // ---------- piso ----------

  private tileset(): string {
    const pisos = INVENTARIO.filter((o) => o.capa === 'piso');
    const llave = `pisos-${pisos.length}-${this.arte.pintados}`;
    if (this.escena.textures.exists(llave)) {
      pisos.forEach((o, i) => this.indicePiso.set(o.id, i));
      return llave;
    }
    const c = document.createElement('canvas');
    c.width = pisos.length * CASILLA;
    c.height = CASILLA;
    const g = c.getContext('2d') as CanvasRenderingContext2D;
    pisos.forEach((o, i) => {
      this.indicePiso.set(o.id, i);
      this.arte.dibujarEn(g, this.arte.asegurar(o, 'U', 'base'), i * CASILLA, 0);
    });
    this.escena.textures.addCanvas(llave, c);
    return llave;
  }

  private sincronizarPiso(sala: SalaMapa): void {
    if (!this.mapa) {
      const llave = this.tileset();
      this.mapa = this.escena.make.tilemap({ tileWidth: CASILLA, tileHeight: CASILLA, width: sala.ancho, height: sala.alto });
      const ts = this.mapa.addTilesetImage('pisos', llave, CASILLA, CASILLA, 0, 0);
      if (ts) {
        this.capaPiso = this.mapa.createBlankLayer('pisos', ts, 0, 0) ?? null;
        this.capaPiso?.setDepth(PROF.piso);
        if (this.alfa !== 1) this.aplicarAlfa();
      }
      this.pisoPrevio = null;
    }
    const capa = this.capaPiso;
    if (!capa) return;
    const previo = this.pisoPrevio;
    for (let y = 0; y < sala.alto; y++) {
      const fila = sala.piso[y];
      const filaPrevia = previo?.[y];
      if (!fila || fila === filaPrevia) continue;
      for (let x = 0; x < sala.ancho; x++) {
        const id = fila[x] ?? '';
        if (filaPrevia && filaPrevia[x] === id) continue;
        const idx = id ? this.indicePiso.get(id) : undefined;
        if (idx === undefined) capa.removeTileAt(x, y);
        else capa.putTileAt(idx, x, y);
      }
    }
    this.pisoPrevio = sala.piso;
  }

  // ---------- objetos ----------

  private sincronizarObjetos(sala: SalaMapa): void {
    const prof = profundidades(sala);
    // Lo apoyado se dibuja sobre la tapa del mueble que lo sostiene (posición automática, nada guardado cambia).
    const apoyos = apoyosDe(sala);

    const vistos = new Set<string>();
    sala.colocaciones.forEach((c, i) => {
      const o = objetoPorId(c.objeto);
      if (!o) return;
      vistos.add(c.id);
      const mascara = o.autotile ? mascaraPared(sala, c.x, c.y) : undefined;
      const frame = this.arte.asegurar(o, c.orientacion, c.variante, mascara);
      const h = huellaDe(o, c.orientacion);
      const ap = apoyos.get(c.id);
      const clave = `${frame}|${c.x},${c.y},${h.alto}|${ap?.dx ?? 0},${ap?.dy ?? 0}`;
      const px = c.x * CASILLA + (ap?.dx ?? 0);
      const py = (c.y + h.alto) * CASILLA + (ap?.dy ?? 0);
      let e = this.imagenes.get(c.id);
      if (!e) {
        const ref = this.arte.referencia(this.escena.textures, frame);
        if (!ref) return;
        const img = this.escena.add.image(px, py, ref.key, ref.frame).setOrigin(0, 1);
        if (this.alfa !== 1) img.setAlpha(this.alfa).setVisible(this.alfa > 0.01);
        e = { img, clave };
        this.imagenes.set(c.id, e);
      } else if (e.clave !== clave) {
        const ref = this.arte.referencia(this.escena.textures, frame);
        if (ref) e.img.setTexture(ref.key, ref.frame);
        e.img.setPosition(px, py);
        e.clave = clave;
      }
      const p = prof[i] ?? py;
      if (e.img.depth !== p) e.img.setDepth(p);
    });
    for (const [id, e] of this.imagenes) {
      if (vistos.has(id)) continue;
      e.img.destroy();
      this.imagenes.delete(id);
    }
    this.sincronizarPlacas(sala);
  }

  /** Solo una placa a la vez, y solo cuando la piden (puntero encima, sentarse o tocar el puesto): no estorban la vista. */
  mostrarPlaca(id: string | null): void {
    if (id === this.placaVisible) return;
    this.placaVisible = id;
    for (const [pid, t] of this.placas) t.setVisible(pid === id);
  }

  /**
   * Placas con el nombre y el cargo de quien tiene cada puesto. Van del lado libre del asiento: arriba si la silla mira
   * al sur (la persona está al norte de la mesa) y abajo si mira al norte.
   */
  private sincronizarPlacas(sala: SalaMapa): void {
    const vistas = new Set<string>();
    for (const pu of sala.puestos) {
      const texto = pu.etiqueta.trim();
      const c = sala.colocaciones.find((x) => x.id === pu.colocacion);
      const o = c ? objetoPorId(c.objeto) : undefined;
      if (!texto || !c || !o) continue;
      vistas.add(pu.id);
      // La placa cabe en el ancho de una casilla: primer nombre y cargo en dos líneas. El nombre completo está en la etiqueta del puesto.
      const [nombreCompleto, cargo] = texto.split(' · ');
      const primero = (nombreCompleto ?? texto).split(' ')[0] ?? texto;
      const contenido = cargo ? `${primero}\n${cargo}` : primero;
      const h = huellaDe(o, c.orientacion);
      const arriba = c.orientacion !== 'N';
      const x = c.x * CASILLA + (h.ancho * CASILLA) / 2;
      const y = arriba ? c.y * CASILLA - o.sobresale - 2 : (c.y + h.alto) * CASILLA + 3;
      let t = this.placas.get(pu.id);
      if (!t) {
        t = this.escena.add
          .text(0, 0, '', { fontFamily: '"Inter Variable", Inter, system-ui, sans-serif', fontSize: '5.5px', fontStyle: '700', color: '#ffffff', align: 'center', backgroundColor: '#141828E6', padding: { x: 1, y: 1 }, lineSpacing: -1, resolution: 8 })
          .setDepth(PROF.etiquetas - 1);
        this.placas.set(pu.id, t);
      }
      if (t.text !== contenido) t.setText(contenido);
      t.setOrigin(0.5, arriba ? 1 : 0).setPosition(Math.round(x), Math.round(y)).setVisible(this.placaVisible === pu.id);
    }
    for (const [id, t] of this.placas) {
      if (vistas.has(id)) continue;
      t.destroy();
      this.placas.delete(id);
    }
  }

  private limpiar(): void {
    for (const e of this.imagenes.values()) e.img.destroy();
    this.imagenes.clear();
    for (const t of this.placas.values()) t.destroy();
    this.placas.clear();
    this.capaPiso?.destroy();
    this.mapa?.destroy();
    this.capaPiso = null;
    this.mapa = null;
    this.pisoPrevio = null;
    this.dimension = '';
  }

  destruir(): void {
    this.limpiar();
  }
}
