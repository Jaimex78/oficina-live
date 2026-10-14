import Phaser from 'phaser';
import { CASILLA, PROF, huellaColocada, huellaDe, objetoPorId, type Direccion, type SalaMapa } from '@ol/shared';

/**
 * Las luces de la oficina. Con las luces encendidas (tema claro) entra el día por las ventanas.
 * Con las luces apagadas (tema oscuro) la oficina queda en penumbra y cada lámpara, pantalla y persona abre su charco de luz.
 * `luz` va de 0 (apagadas) a 1 (encendidas) y cambia con suavidad.
 */

interface Foco {
  /** Colocación de la lámpara: sirve para apagarla sin tocar las demás. Vacío si no es una lámpara. */
  lampara: string;
  x: number;
  y: number;
  radio: number;
  color: number;
  intensidad: number;
  siempre: boolean;
  parpadeo: boolean;
  fase: number;
}

interface Rayo {
  x: number;
  y: number;
  lado: Direccion;
  largo: number;
}

const COLOR_OSCURO = 0x05070f;
const ALFA_OSCURO = 0.8;
const MITAD = 2; // la oscuridad se dibuja a media resolución: las luces son suaves y así pesa cuatro veces menos

function hexNum(c: string): number {
  return Number.parseInt(c.replace('#', ''), 16);
}

function texturaRadial(escena: Phaser.Scene): void {
  if (escena.textures.exists('luz-radial')) return;
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d') as CanvasRenderingContext2D;
  const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.3, 'rgba(255,255,255,0.78)');
  grad.addColorStop(0.62, 'rgba(255,255,255,0.28)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  escena.textures.addCanvas('luz-radial', c);
}

function texturaRayo(escena: Phaser.Scene): void {
  if (escena.textures.exists('luz-rayo')) return;
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 160;
  const g = c.getContext('2d') as CanvasRenderingContext2D;
  const vertical = g.createLinearGradient(0, 0, 0, 160);
  vertical.addColorStop(0, 'rgba(255,248,225,0.95)');
  vertical.addColorStop(0.55, 'rgba(255,248,225,0.34)');
  vertical.addColorStop(1, 'rgba(255,248,225,0)');
  g.fillStyle = vertical;
  g.beginPath();
  g.moveTo(10, 0);
  g.lineTo(54, 0);
  g.lineTo(64, 160);
  g.lineTo(0, 160);
  g.closePath();
  g.fill();
  g.globalCompositeOperation = 'destination-in';
  const lados = g.createLinearGradient(0, 0, 64, 0);
  lados.addColorStop(0, 'rgba(0,0,0,0)');
  lados.addColorStop(0.25, 'rgba(0,0,0,1)');
  lados.addColorStop(0.75, 'rgba(0,0,0,1)');
  lados.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = lados;
  g.fillRect(0, 0, 64, 160);
  escena.textures.addCanvas('luz-rayo', c);
}

export class Luces {
  private focos: Foco[] = [];
  private rayos: Rayo[] = [];
  private oscuridad: Phaser.GameObjects.RenderTexture | null = null;
  private borrador: Phaser.GameObjects.Image;
  private readonly brillos: Phaser.GameObjects.Image[] = [];
  private readonly rayosImg: Phaser.GameObjects.Image[] = [];
  /** 1 con todo el efecto, 0 sin nada: baja a 0 cuando la vista esquemática tapa el mundo. */
  intensidad = 1;
  /** Lámparas que esta persona apagó. Es solo visual y de su pantalla: nadie más lo ve. */
  apagadas: ReadonlySet<string> = new Set();
  private dimension = '';
  private ancho = 0;
  private alto = 0;
  /** Tramos de casillas con piso (en píxeles): la penumbra solo cubre ahí, así la calle de afuera no se apaga con las luces de adentro. */
  private zonasConPiso: Array<{ x: number; y: number; w: number; h: number }> = [];

  constructor(private readonly escena: Phaser.Scene) {
    texturaRadial(escena);
    texturaRayo(escena);
    this.borrador = escena.add.image(0, 0, 'luz-radial').setVisible(false).setOrigin(0.5);
  }

  /** Vuelve a leer los focos y las ventanas de la sala. */
  sincronizar(sala: SalaMapa | null): void {
    this.focos = [];
    this.rayos = [];
    if (!sala) {
      this.oscuridad?.destroy();
      this.oscuridad = null;
      this.dimension = '';
      return;
    }
    sala.colocaciones.forEach((c, i) => {
      const o = objetoPorId(c.objeto);
      if (!o) return;
      const h = huellaDe(o, c.orientacion);
      const w = h.ancho * CASILLA;
      const alto = h.alto * CASILLA + o.sobresale;
      const izq = c.x * CASILLA;
      const arr = (c.y + h.alto) * CASILLA - alto;
      if (o.emisor) {
        const centro = o.emisor.centro ?? { x: w / 2, y: alto / 2 };
        this.focos.push({
          lampara: o.id.startsWith('lampara-') ? c.id : '',
          x: izq + centro.x,
          y: arr + centro.y,
          radio: o.emisor.radio * CASILLA,
          color: hexNum(o.emisor.color),
          intensidad: o.emisor.intensidad,
          siempre: o.emisor.modo === 'siempre',
          parpadeo: Boolean(o.emisor.parpadeo),
          fase: (i * 1.7) % 6.28,
        });
      }
      if (o.ventana) {
        const lado: Direccion = c.orientacion === 'E' || c.orientacion === 'O' || c.orientacion === 'N' ? c.orientacion : 'S';
        const celdas = huellaColocada(o, c.x, c.y, c.orientacion);
        this.rayos.push({ x: celdas.x * CASILLA + (celdas.ancho * CASILLA) / 2, y: celdas.y * CASILLA + (celdas.alto * CASILLA) / 2, lado, largo: 3.4 * CASILLA });
      }
    });

    this.zonasConPiso = [];
    sala.piso.forEach((fila, y) => {
      let ini = -1;
      for (let x = 0; x <= sala.ancho; x++) {
        const hay = x < sala.ancho && Boolean(fila[x]);
        if (hay && ini < 0) ini = x;
        if (!hay && ini >= 0) {
          this.zonasConPiso.push({ x: ini * CASILLA, y: y * CASILLA, w: (x - ini) * CASILLA, h: CASILLA });
          ini = -1;
        }
      }
    });

    const dim = `${sala.id}:${sala.ancho}x${sala.alto}`;
    if (dim !== this.dimension) {
      this.dimension = dim;
      this.ancho = sala.ancho * CASILLA;
      this.alto = sala.alto * CASILLA;
      this.oscuridad?.destroy();
      this.oscuridad = this.escena.add
        .renderTexture(0, 0, Math.ceil(this.ancho / MITAD), Math.ceil(this.alto / MITAD))
        .setOrigin(0, 0)
        .setScale(MITAD)
        .setDepth(PROF.luces)
        .setVisible(false);
      this.oscuridad.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
    }

    // Rayos de sol: uno por ventana.
    while (this.rayosImg.length < this.rayos.length) this.rayosImg.push(this.escena.add.image(0, 0, 'luz-rayo').setBlendMode(Phaser.BlendModes.ADD).setDepth(PROF.luces - 1));
    this.rayosImg.forEach((img, i) => {
      const r = this.rayos[i];
      if (!r) {
        img.setVisible(false);
        return;
      }
      const giro: Record<Direccion, number> = { S: 0, O: Math.PI / 2, N: Math.PI, E: -Math.PI / 2 };
      img.setOrigin(0.5, 0).setPosition(r.x, r.y).setRotation(giro[r.lado]).setScale(1, r.largo / 160).setData('visible', true);
    });
  }

  /** `luz`: 0 apagadas, 1 encendidas. `personas`: puntos de luz propia (los pies de cada avatar). */
  actualizar(tiempoMs: number, luz: number, personas: ReadonlyArray<{ x: number; y: number }>, vista: Phaser.Geom.Rectangle): void {
    const k = this.intensidad;
    const noche = (1 - luz) * k;
    // Sol por las ventanas: solo con las luces encendidas.
    this.rayosImg.forEach((img, i) => {
      const activo = Boolean(this.rayos[i]) && luz > 0.02 && k > 0.02;
      img.setVisible(activo);
      if (activo) img.setAlpha(0.17 * luz * k);
    });

    const rt = this.oscuridad;
    if (!rt) return;
    if (noche < 0.01) {
      rt.setVisible(false);
      this.brillos.forEach((b) => b.setVisible(false));
      return;
    }
    rt.setVisible(true);
    rt.clear();
    for (const z of this.zonasConPiso) rt.fill(COLOR_OSCURO, ALFA_OSCURO * noche, z.x / MITAD, z.y / MITAD, z.w / MITAD, z.h / MITAD);

    let n = 0;
    const margen = 360;
    const pintar = (f: Foco, alfa: number) => {
      if (f.x + f.radio < vista.x - margen || f.x - f.radio > vista.right + margen || f.y + f.radio < vista.y - margen || f.y - f.radio > vista.bottom + margen) return;
      const parp = f.parpadeo ? 0.82 + 0.18 * Math.sin(tiempoMs / 140 + f.fase) : 1;
      const a = Math.min(1, alfa * parp);
      const escala = (f.radio * 2) / 256;
      this.borrador.setScale(escala / MITAD).setAlpha(a);
      rt.erase(this.borrador, f.x / MITAD, f.y / MITAD);
      // Color del charco: encima de la penumbra, aditivo.
      let b = this.brillos[n];
      if (!b) {
        b = this.escena.add.image(0, 0, 'luz-radial').setBlendMode(Phaser.BlendModes.ADD).setDepth(PROF.luces + 1);
        this.brillos[n] = b;
      }
      b.setVisible(true).setPosition(f.x, f.y).setScale(escala * 0.9).setTint(f.color).setAlpha(a * 0.42 * noche);
      n++;
    };

    for (const f of this.focos) {
      if (f.lampara && this.apagadas.has(f.lampara)) continue;
      const fuerza = f.siempre ? f.intensidad : f.intensidad * noche;
      pintar(f, fuerza * (f.siempre ? 1 : 1));
    }
    for (const p of personas) {
      pintar({ lampara: '', x: p.x, y: p.y - 16, radio: 2.1 * CASILLA, color: 0xfff1d6, intensidad: 0.55, siempre: false, parpadeo: false, fase: 0 }, 0.55 * noche);
    }
    for (let i = n; i < this.brillos.length; i++) this.brillos[i]?.setVisible(false);
  }

  destruir(): void {
    this.oscuridad?.destroy();
    this.borrador.destroy();
    this.brillos.forEach((b) => b.destroy());
    this.rayosImg.forEach((b) => b.destroy());
    this.oscuridad = null;
    this.brillos.length = 0;
    this.rayosImg.length = 0;
  }
}
