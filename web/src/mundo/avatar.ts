import { CUADROS, CUADROS_HOJA, DIRECCIONES_PERSONAJE, PERSONAJE_ALTO, PERSONAJE_ANCHO, claveAvatar, planDeAvatar, type AvatarSpec, type CatalogoPersonaje, type Cuadro, type Direccion, type MarcoAtlas } from '@ol/shared';

/**
 * Hojas de animación de los personajes: 8 columnas (cuadros 0 a 7: quieto, 4 de caminar, sentado y los dos de parpadeo) por 4 filas
 * (direcciones S, O, E, N), cada celda de 32x64 con los pies en la fila 61.
 * Con el atlas pintado se arma con `planDeAvatar`; mientras no exista, se dibuja un personaje provisional con código.
 */

export const COLUMNAS_HOJA = CUADROS_HOJA;
export const FILAS_HOJA = 4;

export interface FuenteAvatares {
  /** Hoja ya armada (en caché) para un avatar. `semilla` colorea al provisional de quien aún no creó el suyo. */
  hoja(spec: AvatarSpec | null, semilla: number): HTMLCanvasElement;
  /** Un solo cuadro (32x64) de un avatar: sirve para las miniaturas del creador, sin armar la hoja entera. */
  celda?(spec: AvatarSpec, dir: Direccion, cuadro: Cuadro): HTMLCanvasElement;
  /** true si los cuadros son los del atlas pintado. */
  readonly pintado: boolean;
  /** Catálogo de partes y colores, si ya existe el atlas. */
  readonly catalogo: CatalogoPersonaje | null;
}

export const celdaHoja = (dir: Direccion, cuadro: number): { x: number; y: number } => ({
  x: cuadro * PERSONAJE_ANCHO,
  y: Math.max(0, DIRECCIONES_PERSONAJE.indexOf(dir)) * PERSONAJE_ALTO,
});

function nuevaHoja(): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = COLUMNAS_HOJA * PERSONAJE_ANCHO;
  c.height = FILAS_HOJA * PERSONAJE_ALTO;
  const g = c.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D;
  g.imageSmoothingEnabled = false;
  return [c, g];
}

// ---------- provisional ----------

function hash(texto: string): number {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) h = Math.imul(h ^ texto.charCodeAt(i), 16777619);
  return h >>> 0;
}
const hsl = (h: number, s: number, l: number): string => `hsl(${h % 360} ${s}% ${l}%)`;

const PIELES = ['#F1C9A5', '#E3A878', '#C98A5B', '#9C6240', '#6F4129'];

function dibujarProvisional(g: CanvasRenderingContext2D, ox: number, oy: number, dir: Direccion, cuadro: number, colores: { piel: string; pelo: string; arriba: string; abajo: string; zapato: string }): void {
  const r = (c: string, x: number, y: number, w: number, h: number) => {
    g.fillStyle = c;
    g.fillRect(ox + x, oy + y, w, h);
  };
  const sentado = cuadro === CUADROS.sentado || cuadro === CUADROS.parpadeoSentado;
  const camina = cuadro >= 1 && cuadro <= 4;
  const paso = camina ? (cuadro % 2 === 1 ? 0 : cuadro === 2 ? 1 : -1) : 0;
  const baja = sentado ? 0 : paso !== 0 ? -1 : 0;
  const tinta = '#14141A';
  const lado = dir === 'E' || dir === 'O';

  // piernas y zapatos (pies en la fila 61)
  if (!sentado) {
    const izq = paso === 1 ? 2 : 0;
    const der = paso === -1 ? 2 : 0;
    r(tinta, 10, 55 + izq - 1, 6, 8 - izq);
    r(tinta, 16, 55 + der - 1, 6, 8 - der);
    r(colores.abajo, 11, 55 + izq, 4, 4 - izq);
    r(colores.abajo, 17, 55 + der, 4, 4 - der);
    r(colores.zapato, 11, 59 + izq, 4, 2 - izq);
    r(colores.zapato, 17, 59 + der, 4, 2 - der);
  } else {
    r(tinta, 9, 55, 14, 8);
    r(colores.abajo, 10, 56, 12, 4);
    r(colores.zapato, 10, 60, 4, 2);
    r(colores.zapato, 18, 60, 4, 2);
  }

  // torso y brazos
  const ty = 47 + baja;
  r(tinta, 10, ty - 1, 12, 10);
  r(colores.arriba, 11, ty, 10, 8);
  if (!lado) {
    r(colores.arriba, 7, ty, 4, 6);
    r(colores.arriba, 21, ty, 4, 6);
    r(colores.piel, 7, ty + 6, 4, 2);
    r(colores.piel, 21, ty + 6, 4, 2);
  } else {
    r(colores.arriba, 13 + paso * 2, ty + 1, 5, 6);
    r(colores.piel, 13 + paso * 2, ty + 6, 5, 2);
  }

  // cabeza y pelo
  const hy = 29 + baja;
  r(tinta, 8, hy - 1, 16, 19);
  r(colores.piel, 9, hy, 14, 17);
  if (dir === 'N') {
    r(colores.pelo, 9, hy, 14, 14);
  } else {
    r(colores.pelo, 9, hy, 14, 7);
    r(colores.pelo, 9, hy + 6, 2, 4);
    r(colores.pelo, 21, hy + 6, 2, 4);
    if (dir === 'S') {
      r(tinta, 12, hy + 12, 2, 2);
      r(tinta, 18, hy + 12, 2, 2);
    } else {
      r(tinta, dir === 'E' ? 19 : 12, hy + 12, 2, 2);
      r(colores.pelo, dir === 'E' ? 9 : 17, hy + 6, 6, 6);
    }
  }
}

export class AvataresProvisionales implements FuenteAvatares {
  readonly pintado = false;
  readonly catalogo = null;
  private readonly cache = new Map<string, HTMLCanvasElement>();

  hoja(spec: AvatarSpec | null, semilla: number): HTMLCanvasElement {
    const llave = spec ? claveAvatar(spec) : `semilla:${semilla}`;
    const hecha = this.cache.get(llave);
    if (hecha) return hecha;
    const h = hash(llave);
    const colores = {
      piel: PIELES[h % PIELES.length] as string,
      pelo: hsl(h >> 3, 35, 22 + (h % 3) * 8),
      arriba: hsl(h >> 7, 55, 45),
      abajo: hsl(h >> 11, 25, 28),
      zapato: hsl(h >> 15, 15, 20),
    };
    const [c, g] = nuevaHoja();
    for (const dir of DIRECCIONES_PERSONAJE) {
      for (let cuadro = 0; cuadro < COLUMNAS_HOJA; cuadro++) {
        const { x, y } = celdaHoja(dir, cuadro);
        dibujarProvisional(g, x, y, dir, cuadro, colores);
      }
    }
    this.cache.set(llave, c);
    return c;
  }
}

// ---------- con el atlas pintado ----------

export class AvataresDeAtlas implements FuenteAvatares {
  readonly pintado = true;
  private readonly cache = new Map<string, HTMLCanvasElement>();
  private readonly respaldo = new AvataresProvisionales();
  private readonly marcadores: Map<string, { slot: string; tono: number }>;

  constructor(
    readonly catalogo: CatalogoPersonaje,
    private readonly imagen: CanvasImageSource,
  ) {
    this.marcadores = new Map();
    for (const [slot, tonos] of Object.entries(catalogo.marcadores)) tonos.forEach((hex, tono) => this.marcadores.set(hex.toUpperCase(), { slot, tono }));
  }

  /** Dibuja un cuadro del atlas, cambiando los colores marcador por las rampas elegidas. */
  private dibujarCapa(g: CanvasRenderingContext2D, marco: MarcoAtlas, ox: number, oy: number, rampas: Partial<Record<string, readonly string[]>>, filaMin = 0): void {
    const tmp = document.createElement('canvas');
    tmp.width = marco.w;
    tmp.height = marco.h;
    const t = tmp.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D;
    t.drawImage(this.imagen, marco.x, marco.y, marco.w, marco.h, 0, 0, marco.w, marco.h);
    // Un sombrero cubre el peinado: no se dibujan las filas de arriba del cuadro.
    if (filaMin > 0) t.clearRect(0, 0, marco.w, Math.min(marco.h, filaMin));
    const datos = t.getImageData(0, 0, marco.w, marco.h);
    const d = datos.data;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] === 0) continue;
      const hex = `#${(d[i]! << 16 | d[i + 1]! << 8 | d[i + 2]!).toString(16).padStart(6, '0').toUpperCase()}`;
      const m = this.marcadores.get(hex);
      if (!m) continue;
      const destino = rampas[m.slot]?.[m.tono];
      if (!destino) continue;
      const n = Number.parseInt(destino.slice(1), 16);
      d[i] = (n >> 16) & 255;
      d[i + 1] = (n >> 8) & 255;
      d[i + 2] = n & 255;
    }
    t.putImageData(datos, 0, 0);
    g.drawImage(tmp, ox, oy);
  }

  private readonly celdas = new Map<string, HTMLCanvasElement>();

  celda(spec: AvatarSpec, dir: Direccion, cuadro: Cuadro): HTMLCanvasElement {
    const llave = `${claveAvatar(spec)}|${dir}${cuadro}`;
    const hecha = this.celdas.get(llave);
    if (hecha) return hecha;
    const c = document.createElement('canvas');
    c.width = PERSONAJE_ANCHO;
    c.height = PERSONAJE_ALTO;
    const g = c.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D;
    g.imageSmoothingEnabled = false;
    for (const capa of planDeAvatar(spec, this.catalogo, dir, cuadro)) {
      const marco = this.catalogo.frames[capa.frame];
      if (marco) this.dibujarCapa(g, marco, 0, capa.dy, capa.rampas, capa.filaMin);
    }
    this.celdas.set(llave, c);
    return c;
  }

  hoja(spec: AvatarSpec | null, semilla: number): HTMLCanvasElement {
    if (!spec) return this.respaldo.hoja(null, semilla);
    const llave = claveAvatar(spec);
    const hecha = this.cache.get(llave);
    if (hecha) return hecha;
    const [c, g] = nuevaHoja();
    for (const dir of DIRECCIONES_PERSONAJE) {
      for (let cuadro = 0; cuadro < COLUMNAS_HOJA; cuadro++) {
        const { x, y } = celdaHoja(dir, cuadro);
        for (const capa of planDeAvatar(spec, this.catalogo, dir, cuadro as Cuadro)) {
          const marco = this.catalogo.frames[capa.frame];
          if (marco) this.dibujarCapa(g, marco, x, y + capa.dy, capa.rampas, capa.filaMin);
        }
      }
    }
    this.cache.set(llave, c);
    return c;
  }
}
