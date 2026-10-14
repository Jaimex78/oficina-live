import { CICLO_CAMINAR, DIRECCIONES_PERSONAJE, PERSONAJE_ALTO, PERSONAJE_ANCHO, type Direccion } from '@ol/shared';
import { ALTO, ANCHO, elipse, rect, type Ctx } from './dibujo';

/** Piezas compartidas por las escenas del ingreso: recursos, personaje, texto y luces. */

export interface ImagenesNaos {
  dia: HTMLImageElement;
  noche: HTMLImageElement;
  hojaIzq: HTMLImageElement;
  hojaDer: HTMLImageElement;
  interior: HTMLImageElement;
}

/** Arte original del lobby, el ascensor y el pasillo (arte/src/ingreso/ascensor.ts), en cuadrícula de 320 x 180. */
export interface ImagenesAscensor {
  marco: HTMLImageElement;
  hojaIzq: HTMLImageElement;
  hojaDer: HTMLImageElement;
  llamada: HTMLImageElement;
  interior: HTMLImageElement;
  lobby: HTMLImageElement;
  cabina: HTMLImageElement;
  pasillo: HTMLImageElement;
  puertaAbierta: HTMLImageElement;
}

export interface RecursosIngreso {
  /** Hoja del personaje: 4 columnas (cuadros) por 4 filas (S, O, E, N), cada celda de 32x48. */
  hoja: HTMLCanvasElement;
  noche: boolean;
  /** Fachada real de Naos en pixel art (arte/src/ingreso). Si falta, se dibuja una de respaldo. */
  naos: ImagenesNaos | null;
  /** Lobby, ascensor y pasillo. Si faltan, esas escenas se dibujan como un fondo liso. */
  asc: ImagenesAscensor | null;
}

export const C = {
  navy: '#141828',
  navy2: '#2F3957',
  navy3: '#46557A',
  lavanda: ['#585C98', '#7479B4', '#8A90C8', '#9FA6DA', '#C4C9EE'],
  vidrio: ['#2E5E9A', '#4F96CB', '#8FD0EC', '#D6F1FA'],
  crema: ['#BDAE92', '#D3C5A9', '#E5D9BD', '#F1E9D3', '#FBF8EA'],
  metal: ['#2E3644', '#566274', '#8794A8', '#C4CDD9'],
  rojo: '#EF3B3A',
  verde: ['#2F5A4B', '#4E8468', '#77AA88', '#A3CBA8'],
  madera: ['#5E3A34', '#885544', '#B07158', '#D09A7A'],
  arena: ['#B08A66', '#CBA582', '#E0C2A0', '#EED9BC'],
  luz: '#FFE9A8',
} as const;

/** El personaje se dibuja al doble (40 x 66 de figura) en todo el ingreso, para que se lea junto a las puertas y las fachadas. */
export const ESCALA_PERSONAJE = 2;

export function personaje(c: Ctx, r: RecursosIngreso, dir: Direccion, cuadro: number, x: number, yPies: number, alfa = 1, esc = ESCALA_PERSONAJE): void {
  const fila = Math.max(0, DIRECCIONES_PERSONAJE.indexOf(dir));
  c.globalAlpha = alfa;
  c.drawImage(r.hoja, cuadro * PERSONAJE_ANCHO, fila * PERSONAJE_ALTO, PERSONAJE_ANCHO, PERSONAJE_ALTO, Math.round(x - (PERSONAJE_ANCHO * esc) / 2), Math.round(yPies - 62 * esc), PERSONAJE_ANCHO * esc, PERSONAJE_ALTO * esc);
  c.globalAlpha = 1;
}

/** Cuadro del ciclo de caminar (4 cuadros, 8 por segundo). Los pies están en el borde de abajo de la fila 61 del cuadro de 64 (por eso `62`). */
export const paso = (t: number): number => CICLO_CAMINAR[Math.floor(t * 8) % CICLO_CAMINAR.length] ?? 0;

export function sombraPies(c: Ctx, x: number, y: number, alfa = 0.28, ancho = 10): void {
  c.globalAlpha = alfa;
  elipse(c, '#000000', x, y - 1, ancho, Math.max(2, Math.round(ancho * 0.3)));
  c.globalAlpha = 1;
}

/** Marca pixel art de la plataforma (la casita de 3 x 3), de `lado` píxeles de lado. Es la misma de `MarcaLive`. */
export function marcaPixel(c: Ctx, x: number, y: number, lado: number, color = '#FFFFFF'): void {
  const celda = lado / 11;
  c.fillStyle = color;
  for (const [i, j] of [[1, 0], [0, 1], [1, 1], [2, 1], [0, 2], [2, 2]] as const) {
    const x0 = Math.round(x + i * 4 * celda);
    const y0 = Math.round(y + j * 4 * celda);
    c.fillRect(x0, y0, Math.round(x + (i * 4 + 3) * celda) - x0, Math.round(y + (j * 4 + 3) * celda) - y0);
  }
}

export function texto(c: Ctx, s: string, x: number, y: number, tam: number, color: string, alinear: CanvasTextAlign = 'left', familia = '"Inter Variable", sans-serif'): void {
  c.font = `700 ${tam}px ${familia}`;
  c.textAlign = alinear;
  c.textBaseline = 'alphabetic';
  c.fillStyle = color;
  c.fillText(s, x, y);
}

// ---------- cuadrícula de 320 x 180 (lobby, cabina y pasillo) ----------

export const CUADRICULA = { ancho: ANCHO / 2, alto: ALTO / 2 } as const;
let fuera: HTMLCanvasElement | null = null;

/**
 * Dibuja una escena en una cuadrícula de 320 x 180 y la amplía 2x sobre el lienzo. Así el arte, las luces y el
 * personaje (17 x 26 en la cuadrícula) tienen los mismos píxeles gruesos y se leen como una sola imagen.
 */
export function enCuadricula(c: Ctx, dibujar: (g: Ctx) => void): void {
  if (!fuera) {
    fuera = document.createElement('canvas');
    fuera.width = CUADRICULA.ancho;
    fuera.height = CUADRICULA.alto;
  }
  const g = fuera.getContext('2d');
  if (!g) return;
  g.imageSmoothingEnabled = false;
  g.globalAlpha = 1;
  g.clearRect(0, 0, CUADRICULA.ancho, CUADRICULA.alto);
  dibujar(g);
  c.imageSmoothingEnabled = false;
  c.drawImage(fuera, 0, 0, ANCHO, ALTO);
}

/** Personaje en la cuadrícula: tamaño real de la hoja (17 x 26), que al ampliar la cuadrícula queda al doble. */
export const personajeG = (g: Ctx, r: RecursosIngreso, dir: Direccion, cuadro: number, x: number, yPies: number, alfa = 1): void => personaje(g, r, dir, cuadro, x, yPies, alfa, 1);

// ---------- luces de pixel art ----------

/** Resplandor en anillos escalonados (no degradado suave) para que se vea como pixel art. */
export function halo(g: Ctx, cx: number, cy: number, rx: number, ry: number, color: string, alfa: number): void {
  for (const k of [1, 0.78, 0.56, 0.34]) {
    g.globalAlpha = alfa * 0.32;
    elipse(g, color, cx, cy, Math.max(1, rx * k), Math.max(1, ry * k));
  }
  g.globalAlpha = 1;
}

/** Cono de luz hacia abajo, en bandas de 3 filas que se apagan con la distancia. */
export function cono(g: Ctx, cx: number, y0: number, w0: number, w1: number, alto: number, color: string, alfa: number): void {
  const bandas = Math.ceil(alto / 3);
  for (let i = 0; i < bandas; i++) {
    const f = i / bandas;
    const w = Math.round(w0 + (w1 - w0) * f);
    g.globalAlpha = alfa * (1 - f * 0.85);
    rect(g, color, cx - w / 2, y0 + i * 3, w, 3);
  }
  g.globalAlpha = 1;
}

export function velo(g: Ctx, color: string, alfa: number): void {
  if (alfa <= 0.004) return;
  g.globalAlpha = Math.min(1, alfa);
  rect(g, color, 0, 0, CUADRICULA.ancho, CUADRICULA.alto);
  g.globalAlpha = 1;
}

/** Fluorescente que parpadea suave: casi siempre 1, con caídas breves y distintas en cada tubo. */
export function parpadeo(reloj: number, fase: number): number {
  const a = Math.sin(reloj * 1.9 + fase * 2.3) * Math.sin(reloj * 5.1 + fase);
  const caida = Math.max(0, a - 0.6) / 0.4;
  return 1 - 0.28 * caida * caida + 0.03 * Math.sin(reloj * 31 + fase);
}

// ---------- letras y números de 3 x 5 ----------

const LETRAS: Readonly<Record<string, readonly number[]>> = {
  '1': [2, 6, 2, 2, 7],
  '2': [7, 1, 7, 4, 7],
  '3': [7, 1, 7, 1, 7],
  '4': [5, 5, 7, 1, 1],
  E: [7, 4, 6, 4, 7],
  X: [5, 5, 2, 5, 5],
  I: [7, 2, 2, 2, 7],
  T: [7, 2, 2, 2, 2],
};

export function texto3x5(g: Ctx, s: string, x: number, y: number, color: string): void {
  let cx = x;
  for (const ch of s) {
    const filas = LETRAS[ch];
    if (filas) filas.forEach((bits, j) => [0, 1, 2].forEach((i) => ((bits >> (2 - i)) & 1) === 1 && rect(g, color, cx + i, y + j, 1, 1)));
    cx += 4;
  }
}
