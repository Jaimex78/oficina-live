import Phaser from 'phaser';
import { CASILLA, type SalaMapa } from '@ol/shared';
import { cargarAtlasExterior, type AtlasExterior } from './atlas';
import { geometriaDeSala, MARGEN_EXTERIOR } from './geometria';
import { construirPlano } from './plano';
import { Gente, Tren, Trafico, estadoSemaforos, type LuzSemaforo, type Vehiculo } from './trafico';
import { Z, type Plano } from './tipos';
import { paletaDeEsquema } from '../esquema';
import { mezclarColor } from './util';

/**
 * Profundidades del exterior. Todo va por debajo del piso de la sala (`PROF.piso`, -1.000.000) para que la sala y las
 * personas siempre queden por encima. Los objetos se ordenan por su pie: `BASE + y`.
 */
const BASE = -1_900_000;
const PROF_FONDO = BASE - 6000;
const PROF_SUELO = BASE - 5000;
const PROF_DETALLE = BASE - 4800;
const PROF_SOMBRA_SUELO = BASE - 4600;
const PROF_SOMBRA_OBJ = BASE - 3000;
const PROF_BRUMA = BASE + 10_000;
const PROF_NOCHE = BASE + 20_000;
const PROF_LUZ_VENTANAS = BASE + 30_000;
const PROF_HALOS = BASE + 31_000;
const PROF_CUBIERTA = BASE + 35_000;
const PROF_ATENUACION = BASE + 40_000;

/** Color de la bruma lejana de día (la misma que el fondo de la escena). De noche lo oscurece el multiplicador. */
const BRUMA = 0xb9cadf;
/** Con qué se multiplica todo el exterior de noche: un azul oscuro. */
const COLOR_NOCHE = 0x3d4c86;
const ALFA_SOMBRA = 0.3;
const GRANDE = 16_000;

export interface Exterior {
  /** Rectángulo que cubre el exterior, en píxeles del mundo. */
  readonly limites: Phaser.Geom.Rectangle;
  /** Cuántos píxeles más allá de la sala puede mirar la cámara sin quedarse sin dibujo. */
  readonly margenCamara: number;
  actualizarLuz(luz: 'claro' | 'oscuro'): void;
  /** La vista esquemática (zoom lejano): bandas planas y sin animación. */
  modoEsquema(activo: boolean): void;
  /** El modo construir atenúa el exterior para que no estorbe. */
  modoEdicion(activo: boolean): void;
  destruir(): void;
}

export interface OpcionesExterior {
  luz: 'claro' | 'oscuro';
}

type Objeto = Phaser.GameObjects.GameObject & { destroy(): void };

interface ArbolVivo {
  img: Phaser.GameObjects.Image;
  base: string;
  fase: number;
  frame: number;
}

interface VehiculoVivo {
  v: Vehiculo;
  img: Phaser.GameObjects.Image;
  sombra: Phaser.GameObjects.Image;
  faro: Phaser.GameObjects.Image | null;
  frame: string;
}

interface PeatonVivo {
  img: Phaser.GameObjects.Image;
  sombra: Phaser.GameObjects.Image;
}

interface SemaforoVivo {
  img: Phaser.GameObjects.Image;
  eje: 'h' | 'v' | 'pc';
  estado: LuzSemaforo | '';
  glow: Phaser.GameObjects.Image;
}

interface HaloVivo {
  img: Phaser.GameObjects.Image;
  alfa: number;
  parpadeo: boolean;
  fase: number;
}

const VIENTO = ['a', 'b', 'c', 'b'] as const;

function texturaHalo(escena: Phaser.Scene): void {
  if (escena.textures.exists('ext-halo')) return;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d') as CanvasRenderingContext2D;
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.25, 'rgba(255,255,255,0.7)');
  grad.addColorStop(0.6, 'rgba(255,255,255,0.22)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const t = escena.textures.addCanvas('ext-halo', c);
  t?.setFilter(Phaser.Textures.FilterMode.LINEAR);
}

/** Degradado blanco que se funde a transparente: `ext-bruma-v` (de arriba abajo) y `ext-bruma-h` (de izquierda a derecha). */
function texturasBruma(escena: Phaser.Scene): void {
  const hacer = (clave: string, vertical: boolean): void => {
    if (escena.textures.exists(clave)) return;
    const c = document.createElement('canvas');
    c.width = vertical ? 4 : 256;
    c.height = vertical ? 256 : 4;
    const g = c.getContext('2d') as CanvasRenderingContext2D;
    const grad = vertical ? g.createLinearGradient(0, 0, 0, 256) : g.createLinearGradient(0, 0, 256, 0);
    // Opaca en el borde y cada vez más transparente hacia adentro.
    grad.addColorStop(0, 'rgba(255,255,255,0.92)');
    grad.addColorStop(0.35, 'rgba(255,255,255,0.55)');
    grad.addColorStop(0.7, 'rgba(255,255,255,0.14)');
    grad.addColorStop(0.94, 'rgba(255,255,255,0)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, c.width, c.height);
    const t = escena.textures.addCanvas(clave, c);
    t?.setFilter(Phaser.Textures.FilterMode.LINEAR);
  };
  hacer('ext-bruma-v', true);
  hacer('ext-bruma-h', false);
}

/** El exterior ya armado en una escena de Phaser. */
export class ExteriorEnEscena implements Exterior {
  readonly limites: Phaser.Geom.Rectangle;
  readonly margenCamara: number;

  private readonly plano: Plano;
  private vivo = true;
  private atlas: AtlasExterior | null = null;
  private claveAtlas = '';
  private readonly objetos: Objeto[] = [];
  private mapa: Phaser.Tilemaps.Tilemap | null = null;
  private capaSuelo: Phaser.Tilemaps.TilemapLayer | null = null;
  private capaDetalle: Phaser.Tilemaps.TilemapLayer | null = null;
  private capaSombra: Phaser.Tilemaps.TilemapLayer | null = null;
  private capaLuz: Phaser.Tilemaps.TilemapLayer | null = null;
  private readonly fondo: Phaser.GameObjects.Rectangle;
  private noche: Phaser.GameObjects.Rectangle | null = null;
  private atenuacion: Phaser.GameObjects.Rectangle | null = null;
  /** La cubierta lisa del color del fondo del esquema y las bandas de calle, andén y vecinos encima. */
  private cubierta: Phaser.GameObjects.Rectangle | null = null;
  private esquema: Phaser.GameObjects.Image | null = null;
  private claveEsquema = '';
  private readonly dinamicos: Objeto[] = []; // lo que se oculta en el esquema
  private bruma: Phaser.GameObjects.Image[] = [];
  private arboles: ArbolVivo[] = [];
  private carros: VehiculoVivo[] = [];
  private peatones: PeatonVivo[] = [];
  private semaforos: SemaforoVivo[] = [];
  private halos: HaloVivo[] = [];
  private trafico: Trafico;
  private gente: Gente;
  private tren: Tren;
  private unidadesTren: Array<{ img: Phaser.GameObjects.Image; luz: Phaser.GameObjects.Image }> = [];
  private faroTren: Phaser.GameObjects.Image | null = null;
  private pitido: Phaser.GameObjects.Image | null = null;
  private balizas: Array<{ img: Phaser.GameObjects.Image; glow: Phaser.GameObjects.Image }> = [];

  /** 1 es de día y 0 de noche. Se mueve con suavidad hacia `luzObjetivo`. */
  private luz: number;
  private luzObjetivo: number;
  /** Qué tanto se ve el esquema: 0 el arte, 1 las bandas planas. Sigue a `esqObjetivo` con suavidad. */
  private esqT = 0;
  private esqObjetivo = 0;
  private enEdicion = false;
  private tiempo = 0;
  private cuadroPrevio = '';
  private readonly alActualizar: (tiempo: number, delta: number) => void;
  private readonly alApagar: () => void;

  constructor(
    private readonly escena: Phaser.Scene,
    sala: SalaMapa,
    opciones: OpcionesExterior,
  ) {
    this.plano = construirPlano(geometriaDeSala(sala));
    const { plano } = this;
    this.limites = new Phaser.Geom.Rectangle(plano.x0 * CASILLA, plano.y0 * CASILLA, plano.ancho * CASILLA, plano.alto * CASILLA);
    this.margenCamara = MARGEN_EXTERIOR * CASILLA;
    this.luzObjetivo = opciones.luz === 'claro' ? 1 : 0;
    this.luz = this.luzObjetivo;
    this.trafico = new Trafico(plano.carriles);
    this.gente = new Gente(plano.rutas);
    this.tren = new Tren(plano.via.xMin, plano.via.xMax);

    // El fondo se crea ya, para que mientras se baja el atlas no se vea el vacío.
    this.fondo = escena.add.rectangle(this.limites.centerX, this.limites.centerY, GRANDE, GRANDE, BRUMA).setDepth(PROF_FONDO);
    this.objetos.push(this.fondo);

    this.alActualizar = (t, delta) => this.actualizar(t, delta);
    this.alApagar = () => this.destruir();
    escena.events.on(Phaser.Scenes.Events.UPDATE, this.alActualizar);
    escena.events.once(Phaser.Scenes.Events.SHUTDOWN, this.alApagar);

    void cargarAtlasExterior().then(
      (a) => {
        if (!this.vivo) return;
        try {
          this.construir(a);
        } catch (e) {
          console.warn('[exterior]', e);
        }
      },
      (e: unknown) => console.warn('[exterior]', e),
    );
  }

  // ---------- Montaje ----------

  private registrarTexturas(a: AtlasExterior): void {
    const tex = this.escena.textures;
    this.claveAtlas = `ext-atlas-${a.huella}`;
    if (!tex.exists(this.claveAtlas)) {
      const t = tex.addImage(this.claveAtlas, a.imagen);
      if (t) for (const [id, m] of Object.entries(a.frames)) t.add(id, 0, m.x, m.y, m.w, m.h);
    }
    const claveTiles = `ext-tiles-${a.huella}`;
    if (!tex.exists(claveTiles)) {
      // Hoja de tiles con un píxel extruido alrededor de cada uno: sin costuras al hacer zoom con escalas raras.
      const COLS = 32;
      const filas = Math.ceil(a.tiles.length / COLS);
      const c = document.createElement('canvas');
      c.width = COLS * 34;
      c.height = filas * 34;
      const g = c.getContext('2d') as CanvasRenderingContext2D;
      g.imageSmoothingEnabled = false;
      a.tiles.forEach((id, i) => {
        const m = a.frames[id];
        if (!m) return;
        const x = 1 + (i % COLS) * 34;
        const y = 1 + Math.floor(i / COLS) * 34;
        g.drawImage(a.imagen, m.x, m.y, 32, 32, x, y, 32, 32);
        g.drawImage(a.imagen, m.x, m.y, 32, 1, x, y - 1, 32, 1);
        g.drawImage(a.imagen, m.x, m.y + 31, 32, 1, x, y + 32, 32, 1);
        g.drawImage(a.imagen, m.x, m.y, 1, 32, x - 1, y, 1, 32);
        g.drawImage(a.imagen, m.x + 31, m.y, 1, 32, x + 32, y, 1, 32);
        g.drawImage(a.imagen, m.x, m.y, 1, 1, x - 1, y - 1, 1, 1);
        g.drawImage(a.imagen, m.x + 31, m.y, 1, 1, x + 32, y - 1, 1, 1);
        g.drawImage(a.imagen, m.x, m.y + 31, 1, 1, x - 1, y + 32, 1, 1);
        g.drawImage(a.imagen, m.x + 31, m.y + 31, 1, 1, x + 32, y + 32, 1, 1);
      });
      tex.addCanvas(claveTiles, c);
    }
  }

  private construir(a: AtlasExterior): void {
    this.atlas = a;
    const { escena, plano } = this;
    this.registrarTexturas(a);
    texturaHalo(escena);
    texturasBruma(escena);

    // ----- Mapa de baldosas: suelo, detalle, sombras y luz de ventanas -----
    const indice = new Map<string, number>();
    a.tiles.forEach((id, i) => indice.set(id, i));
    const mapa = escena.make.tilemap({ tileWidth: CASILLA, tileHeight: CASILLA, width: plano.ancho, height: plano.alto });
    const ts = mapa.addTilesetImage('exterior', `ext-tiles-${a.huella}`, CASILLA, CASILLA, 1, 2);
    if (!ts) throw new Error('No se pudo armar el tileset del exterior');
    this.mapa = mapa;
    const capa = (nombre: string, datos: (string | null)[], prof: number): Phaser.Tilemaps.TilemapLayer | null => {
      const l = mapa.createBlankLayer(nombre, ts, plano.x0 * CASILLA, plano.y0 * CASILLA);
      if (!l) return null;
      for (let i = 0; i < datos.length; i++) {
        const id = datos[i];
        if (!id) continue;
        const t = indice.get(id);
        if (t === undefined) continue;
        l.putTileAt(t, i % plano.ancho, Math.floor(i / plano.ancho));
      }
      l.setDepth(prof);
      this.objetos.push(l);
      return l;
    };
    this.capaSuelo = capa('suelo', plano.suelo, PROF_SUELO);
    this.capaDetalle = capa('detalle', plano.detalle, PROF_DETALLE);
    this.capaSombra = capa('sombra', plano.sombra, PROF_SOMBRA_SUELO);
    this.capaSombra?.setAlpha(ALFA_SOMBRA);
    this.capaLuz = capa('luz', plano.luz, PROF_LUZ_VENTANAS);
    this.capaLuz?.setAlpha(0);

    // ----- Árboles -----
    for (const ar of plano.arboles) {
      const base = `arbol-${ar.modelo}`;
      if (ar.alcorque) this.sprite('alcorque', ar.x, ar.y, BASE + ar.y - 900);
      const sombraId = ar.modelo === 'g' ? 'sombra-copa-g' : ar.modelo === 'p' ? 'sombra-copa-p' : 'sombra-copa-m';
      this.sprite(sombraId, ar.x + 14, ar.y - 4, PROF_SOMBRA_OBJ).setAlpha(ALFA_SOMBRA);
      const img = this.sprite(`${base}-a`, ar.x, ar.y, BASE + ar.y);
      if (ar.espejo) img.setFlipX(true);
      this.arboles.push({ img, base, fase: ar.fase, frame: 0 });
    }

    // ----- Mobiliario fijo -----
    for (const p of plano.props) {
      if (p.sombra) this.sprite(p.sombra.frame, p.x + p.sombra.dx, p.y + p.sombra.dy, PROF_SOMBRA_OBJ).setAlpha(ALFA_SOMBRA);
      const img = this.sprite(p.frame, p.x, p.y, BASE + p.y);
      if (p.espejo) img.setFlipX(true);
    }
    for (const q of plano.quietos) {
      this.sprite('sombra-persona', q.x, q.y, PROF_SOMBRA_OBJ).setAlpha(ALFA_SOMBRA);
      this.sprite(`pers-${q.variante + 1}-s-0`, q.x, q.y, BASE + q.y);
    }

    // ----- Semáforos -----
    for (const s of plano.semaforos) {
      const img = this.sprite('semaforo-r', s.x, s.y, BASE + s.y);
      const glow = this.halo(s.x, s.y - 34, 22, 0xff5a4a, 0.9, false);
      this.semaforos.push({ img, eje: s.eje, estado: '', glow });
    }

    // ----- Carros y gente (los que se mueven) -----
    for (const v of this.trafico.vehiculos) {
      const frame = this.frameDe(v);
      const img = this.sprite(frame, 0, 0, BASE).setOrigin(0.5, 0.5);
      const sombra = this.sprite(v.tipo === 'bus' ? 'sombra-bus' : v.carril.eje === 'h' ? 'sombra-auto-h' : 'sombra-auto-v', 0, 0, PROF_SOMBRA_OBJ + 100).setAlpha(ALFA_SOMBRA);
      const faro = this.halo(0, 0, 46, 0xffe9b0, 0.5, false, false);
      this.carros.push({ v, img, sombra, faro, frame });
    }
    for (let i = 0; i < this.gente.peatones.length; i++) {
      const img = this.sprite('pers-1-e-0', 0, 0, BASE);
      const sombra = this.sprite('sombra-persona', 0, 0, PROF_SOMBRA_OBJ + 100).setAlpha(ALFA_SOMBRA);
      this.peatones.push({ img, sombra });
    }

    // ----- Tren: locomotora y cuatro vagones, con sus luces; balizas del paso peatonal y pitido -----
    const yVia = (plano.via.y0 + plano.via.y1) / 2;
    ['tren-loco-e', 'tren-vagon-a', 'tren-vagon-b', 'tren-vagon-a', 'tren-vagon-b'].forEach((f) => {
      const img = this.sprite(f, 0, yVia, BASE + yVia).setOrigin(0.5, 0.5).setVisible(false);
      const luz = this.halo(0, yVia, 26, 0xffd890, 0.45, false, false);
      this.unidadesTren.push({ img, luz });
    });
    this.faroTren = this.halo(0, yVia, 84, 0xfff0c0, 0.9, false, false);
    this.pitido = this.sprite('pitido', 0, yVia, BASE + yVia + 50).setVisible(false);
    for (const dx of [-26, 26]) {
      const x = plano.via.xPaso + dx;
      const y = plano.via.y1 - 8;
      const img = this.sprite('baliza-c', x, y, BASE + y);
      const glow = this.halo(x, y - 24, 16, 0xff4a3a, 0.8, false, false);
      this.balizas.push({ img, glow });
    }

    // ----- Focos de noche (postes, vestíbulo, paradero, obra) -----
    for (const f of plano.focos) {
      this.halo(f.x, f.y, f.radio, f.color, f.intensidad, Boolean(f.parpadeo));
      if (f.radio > 60) this.halo(f.x, f.y, f.radio * 0.4, 0xffe6b0, f.intensidad * 0.4, Boolean(f.parpadeo));
    }

    // ----- Bruma en los bordes, multiplicador de noche y atenuación del modo construir -----
    const L = this.limites;
    const grosor = 16 * CASILLA;
    const bruma = (clave: string, x: number, y: number, w: number, h: number, flipX: boolean, flipY: boolean): void => {
      const img = escena.add.image(x, y, clave).setOrigin(0, 0).setDisplaySize(w, h).setTint(BRUMA).setDepth(PROF_BRUMA);
      img.setFlipX(flipX).setFlipY(flipY);
      this.objetos.push(img);
      this.bruma.push(img);
    };
    bruma('ext-bruma-v', L.x, L.y, L.width, grosor, false, false);
    bruma('ext-bruma-v', L.x, L.bottom - grosor, L.width, grosor, false, true);
    bruma('ext-bruma-h', L.x, L.y, grosor, L.height, false, false);
    bruma('ext-bruma-h', L.right - grosor, L.y, grosor, L.height, true, false);

    this.noche = escena.add.rectangle(L.centerX, L.centerY, GRANDE, GRANDE, 0xffffff).setDepth(PROF_NOCHE).setBlendMode(Phaser.BlendModes.MULTIPLY).setVisible(false);
    this.objetos.push(this.noche);
    this.atenuacion = escena.add.rectangle(L.centerX, L.centerY, GRANDE, GRANDE, 0xe4e5ec, 0).setDepth(PROF_ATENUACION).setVisible(false);
    this.objetos.push(this.atenuacion);

    // ----- Vista esquemática: un píxel por casilla, ampliado sin suavizado -----
    this.armarEsquema();

    this.aplicarLuz();
    this.aplicarModos();
  }

  /** Imagen de un cuadro del atlas apoyada en su ancla. */
  private sprite(frame: string, x: number, y: number, prof: number): Phaser.GameObjects.Image {
    const a = this.atlas as AtlasExterior;
    const m = a.frames[frame];
    const an = a.anclas[frame] ?? (m ? { x: m.w / 2, y: m.h } : { x: 0, y: 0 });
    const img = this.escena.add.image(x, y, this.claveAtlas, frame).setOrigin(m ? an.x / m.w : 0.5, m ? an.y / m.h : 1).setDepth(prof);
    this.objetos.push(img);
    this.dinamicos.push(img);
    return img;
  }

  /** Charco de luz aditivo. Con `registrar` se enciende solo de noche; los de los faros los maneja cada carro. */
  private halo(x: number, y: number, radio: number, color: number, alfa: number, parpadeo: boolean, registrar = true): Phaser.GameObjects.Image {
    const img = this.escena.add
      .image(x, y, 'ext-halo')
      .setBlendMode(Phaser.BlendModes.ADD)
      .setTint(color)
      .setDisplaySize(radio * 2, radio * 2)
      .setDepth(PROF_HALOS)
      .setAlpha(0);
    this.objetos.push(img);
    this.dinamicos.push(img);
    if (registrar) this.halos.push({ img, alfa, parpadeo, fase: Math.random() * 6 });
    return img;
  }

  /** Dos texturas de esquema (día y noche): un píxel por casilla, con los bordes repetidos hacia afuera para que las calles sigan. */
  private armarEsquema(): void {
    const { plano, escena } = this;
    const PAD = 24;
    const W = plano.ancho + 2 * PAD;
    const H = plano.alto + 2 * PAD;
    const hacer = (oscuro: boolean): string => {
      const clave = `ext-esquema-${this.claveAtlas}-${oscuro ? 'n' : 'd'}`;
      if (escena.textures.exists(clave)) return clave;
      const c = document.createElement('canvas');
      c.width = W;
      c.height = H;
      const g = c.getContext('2d') as CanvasRenderingContext2D;
      // Los pastos quedan transparentes: se ve la cubierta, que ya es del color del fondo.
      const color: Record<number, string | null> = oscuro
        ? { [Z.PASTO]: null, [Z.LOTE]: null, [Z.VIA]: '#222a3c', [Z.CALLE]: '#1b2030', [Z.CALLEJON]: '#171b27', [Z.ANDEN]: '#252c40', [Z.PLAZA]: '#252c40', [Z.TECHO]: '#151b24', [Z.FACHADA]: '#151b24', [Z.EDIFICIO]: '#151b24' }
        : { [Z.PASTO]: null, [Z.LOTE]: null, [Z.VIA]: '#aeb4c1', [Z.CALLE]: '#c3c8d3', [Z.CALLEJON]: '#cfd3dc', [Z.ANDEN]: '#f1f2f6', [Z.PLAZA]: '#f1f2f6', [Z.TECHO]: '#c9e4cf', [Z.FACHADA]: '#c9e4cf', [Z.EDIFICIO]: '#c9e4cf' };
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const cx = Math.max(0, Math.min(plano.ancho - 1, x - PAD));
          const cy = Math.max(0, Math.min(plano.alto - 1, y - PAD));
          const col = color[plano.zona[cy * plano.ancho + cx] ?? 0];
          if (!col) continue;
          g.fillStyle = col;
          g.fillRect(x, y, 1, 1);
        }
      }
      escena.textures.addCanvas(clave, c);
      return clave;
    };
    const dia = hacer(false);
    const noche = hacer(true);
    this.claveEsquema = `${dia}|${noche}`;
    this.cubierta = escena.add.rectangle(this.limites.centerX, this.limites.centerY, GRANDE, GRANDE, paletaDeEsquema(false).fondo).setDepth(PROF_CUBIERTA).setAlpha(0).setVisible(false);
    this.objetos.push(this.cubierta);
    this.esquema = escena.add
      .image((plano.x0 - PAD) * CASILLA, (plano.y0 - PAD) * CASILLA, dia)
      .setOrigin(0, 0)
      .setScale(CASILLA)
      .setDepth(PROF_CUBIERTA + 1)
      .setAlpha(0)
      .setVisible(false);
    this.objetos.push(this.esquema);
  }

  private frameDe(v: Vehiculo): string {
    if (v.tipo === 'bus') return 'bus-e';
    if (v.tipo === 'moto') return 'moto-e';
    if (v.carril.eje === 'h') return `auto-e-${v.color}`;
    return `auto-${v.carril.dir === 1 ? 's' : 'n'}-${v.color}`;
  }

  // ---------- Luz y modos ----------

  actualizarLuz(luz: 'claro' | 'oscuro'): void {
    this.luzObjetivo = luz === 'claro' ? 1 : 0;
  }

  modoEsquema(activo: boolean): void {
    this.esqObjetivo = activo ? 1 : 0;
  }

  modoEdicion(activo: boolean): void {
    this.enEdicion = activo;
    this.aplicarModos();
  }

  /** Atenuación del modo construir y, con el esquema completo, el arte se esconde del todo (y deja de animarse). */
  private aplicarModos(): void {
    this.atenuacion?.setVisible(this.enEdicion);
    if (this.atenuacion) this.atenuacion.setFillStyle(this.colorFondoMotor(), this.enEdicion ? 0.58 : 0);
    this.aplicarEsquema();
  }

  /** Muestra u oculta cada parte según `esqT`: la cubierta y las bandas se funden con el arte. */
  private aplicarEsquema(): void {
    const t = this.esqT;
    const arte = t < 0.985;
    this.cubierta?.setVisible(t > 0.01).setAlpha(t);
    this.esquema?.setVisible(t > 0.01).setAlpha(t);
    this.capaSuelo?.setVisible(arte);
    this.capaDetalle?.setVisible(arte);
    this.capaSombra?.setVisible(arte);
    this.capaLuz?.setVisible(arte);
    for (const o of this.dinamicos) (o as unknown as Phaser.GameObjects.Image).setVisible(arte);
    for (const b of this.bruma) b.setVisible(arte);
    this.fondo.setVisible(arte);
    if (arte) this.pintarHalos(1 - this.luz, this.tiempo);
  }

  /** Color del fondo del motor con la luz actual: la atenuación se funde con él. */
  private colorFondoMotor(): number {
    return mezclarColor(0x090a0e, 0xe4e5ec, this.luz);
  }

  private aplicarLuz(): void {
    const noche = 1 - this.luz;
    if (this.noche) {
      this.noche.setVisible(noche > 0.01);
      this.noche.setFillStyle(mezclarColor(0xffffff, COLOR_NOCHE, noche));
    }
    if (this.capaLuz) this.capaLuz.setAlpha(noche);
    if (this.atenuacion && this.enEdicion) this.atenuacion.setFillStyle(this.colorFondoMotor(), 0.58);
    // Esquema: de noche usa la paleta oscura (la misma del esquema del motor).
    const oscuro = this.luz < 0.5;
    this.cubierta?.setFillStyle(paletaDeEsquema(oscuro).fondo);
    const [dia, nocheClave] = this.claveEsquema.split('|');
    const clave = oscuro ? nocheClave : dia;
    if (this.esquema && clave && this.esquema.texture.key !== clave) this.esquema.setTexture(clave);
    this.pintarHalos(noche, this.tiempo);
  }

  private pintarHalos(noche: number, tMs: number): void {
    const visible = noche > 0.01 && this.esqT < 0.985;
    for (const h of this.halos) {
      const parp = h.parpadeo ? 0.45 + 0.55 * Math.max(0, Math.sin(tMs / 380 + h.fase)) : 1;
      h.img.setVisible(visible);
      if (visible) h.img.setAlpha(h.alfa * noche * parp);
    }
  }

  // ---------- Animación ----------

  private actualizar(tMs: number, delta: number): void {
    if (!this.vivo || !this.atlas) return;
    const dt = Math.min(delta, 100) / 1000;
    this.tiempo = tMs;
    // La luz se acerca a su objetivo con suavidad.
    if (this.luz !== this.luzObjetivo) {
      this.luz += (this.luzObjetivo - this.luz) * (1 - Math.exp(-dt * 2.2));
      if (Math.abs(this.luzObjetivo - this.luz) < 0.003) this.luz = this.luzObjetivo;
      this.aplicarLuz();
    }
    if (this.esqT !== this.esqObjetivo) {
      this.esqT += (this.esqObjetivo - this.esqT) * (1 - Math.exp(-dt * 7));
      if (Math.abs(this.esqObjetivo - this.esqT) < 0.004) this.esqT = this.esqObjetivo;
      this.aplicarEsquema();
    }
    // Con el esquema completo no se anima nada.
    if (this.esqT >= 0.985) return;

    const t = tMs / 1000;
    const noche = 1 - this.luz;
    // Los árboles mueven sus hojas con un ritmo distinto cada uno.
    for (const a of this.arboles) {
      const k = Math.floor(t / 0.7 + a.fase * 4) % 4;
      if (k !== a.frame) {
        a.frame = k;
        a.img.setFrame(`${a.base}-${VIENTO[k] as string}`);
      }
    }
    this.pintarHalos(noche, tMs);

    // Semáforos.
    const luces = estadoSemaforos(t);
    for (const s of this.semaforos) {
      const e = luces[s.eje];
      if (e !== s.estado) {
        s.estado = e;
        s.img.setFrame(e === 'verde' ? 'semaforo-v' : e === 'amarillo' ? 'semaforo-a' : 'semaforo-r');
        s.glow.setTint(e === 'verde' ? 0x62e07a : e === 'amarillo' ? 0xffd34a : 0xff5a4a);
      }
    }

    // Carros.
    this.trafico.avanzar(dt, t);
    for (const c of this.carros) {
      const v = c.v;
      const p = this.trafico.posicion(v);
      const f = this.frameDe(v);
      if (f !== c.frame) {
        c.frame = f;
        c.img.setFrame(f);
      }
      const horizontal = v.carril.eje === 'h';
      c.img.setFlipX(horizontal && v.carril.dir === -1);
      c.img.setPosition(Math.round(p.x), Math.round(p.y + (horizontal ? 1 : 0)));
      c.img.setDepth(BASE + p.y + (horizontal ? (v.tipo === 'bus' ? 15 : 13) : 28));
      c.sombra.setPosition(Math.round(p.x + 3), Math.round(p.y + (horizontal ? 12 : 4)));
      if (c.faro) {
        const adelante = v.carril.dir * (v.largo / 2 - 6);
        c.faro.setPosition(Math.round(horizontal ? p.x + adelante : p.x), Math.round(horizontal ? p.y : p.y + adelante));
        c.faro.setVisible(noche > 0.01);
        c.faro.setAlpha(0.6 * noche);
      }
    }

    // Peatones.
    this.gente.avanzar(dt, { senales: luces, trenCerca: this.tren.cerca(t, this.plano.via.xPaso, 1100) });
    this.actualizarTren(t, noche);
    const paso = Math.floor(t * 4.5) % 2;
    this.gente.peatones.forEach((p, i) => {
      const o = this.peatones[i];
      if (!o) return;
      o.img.setFrame(`pers-${p.ruta.variante + 1}-${p.dir}-${p.camina ? paso : 0}`);
      o.img.setFlipX(p.voltear);
      o.img.setPosition(Math.round(p.x), Math.round(p.y));
      o.img.setDepth(BASE + p.y);
      o.sombra.setPosition(Math.round(p.x + 2), Math.round(p.y - 1));
    });
  }

  /** Mueve el tren (si está pasando), su pitido y las balizas del paso peatonal. */
  private actualizarTren(t: number, noche: number): void {
    const yVia = (this.plano.via.y0 + this.plano.via.y1) / 2 + 1;
    const e = this.tren.estado(t);
    this.unidadesTren.forEach((u, i) => {
      const un = e.unidades[i];
      const ver = e.presente && Boolean(un);
      u.img.setVisible(ver);
      u.luz.setVisible(ver && noche > 0.01);
      if (!ver || !un) return;
      u.img.setFrame(un.tipo === 'loco' ? 'tren-loco-e' : `tren-${un.tipo}`);
      u.img.setFlipX(e.dir === -1);
      u.img.setPosition(Math.round(un.x), Math.round(yVia));
      u.img.setDepth(BASE + yVia + 14);
      u.luz.setPosition(Math.round(un.x), Math.round(yVia - 2));
      u.luz.setAlpha(0.45 * noche);
    });
    if (this.faroTren) {
      this.faroTren.setVisible(e.presente && noche > 0.01);
      if (e.presente) this.faroTren.setPosition(Math.round(e.frente + e.dir * 26), Math.round(yVia - 2)).setAlpha(0.9 * noche);
    }
    // Pitido visual: dos ráfagas cada cuatro segundos mientras el tren pasa.
    if (this.pitido) {
      const r = t % 4;
      const suena = e.presente && (r < 0.45 || (r > 0.75 && r < 1.2));
      this.pitido.setVisible(suena);
      if (suena) this.pitido.setOrigin(e.dir === 1 ? 0 : 1, 0.5).setFlipX(e.dir === -1).setPosition(Math.round(e.frente + e.dir * 4), Math.round(yVia - 12));
    }
    // Balizas: las luces rojas se alternan mientras el tren está cerca del paso.
    const activo = this.tren.cerca(t, this.plano.via.xPaso, 900);
    const frame = !activo ? 'baliza-c' : Math.floor(t * 2.5) % 2 === 0 ? 'baliza-a' : 'baliza-b';
    for (const b of this.balizas) {
      b.img.setFrame(frame);
      b.glow.setVisible(activo && noche > 0.01);
      b.glow.setAlpha(0.8 * noche);
    }
  }

  // ---------- Fin ----------

  destruir(): void {
    if (!this.vivo) return;
    this.vivo = false;
    this.escena.events.off(Phaser.Scenes.Events.UPDATE, this.alActualizar);
    this.escena.events.off(Phaser.Scenes.Events.SHUTDOWN, this.alApagar);
    for (const o of this.objetos) o.destroy();
    this.objetos.length = 0;
    this.mapa?.destroy();
    this.mapa = null;
    this.capaSuelo = this.capaDetalle = this.capaSombra = this.capaLuz = null;
    this.arboles = [];
    this.carros = [];
    this.peatones = [];
    this.semaforos = [];
    this.halos = [];
    this.bruma = [];
    this.dinamicos.length = 0;
  }
}
