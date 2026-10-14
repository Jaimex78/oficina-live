import { CASILLA, type Celda } from '@ol/shared';
import { centroDeCelda, type Cuadricula } from './ruta';

/**
 * El movimiento de tu personaje sobre la cuadrícula, sin Phaser: la misma caja de colisión que usa el motor y una regla
 * más estricta que la del servidor (que solo mira la casilla de los pies). Así se puede probar caminando de verdad sobre el mapa.
 */

/** Media anchura de la caja de colisión y su altura hacia arriba desde los pies, en píxeles. */
export const MITAD_CAJA = 6;
export const ALTO_CAJA = 6;
/** Cuántos píxeles se corre de lado para rodear una esquina que se rozó. */
export const AYUDA_ESQUINA = 10;

export function bloqueada(g: Cuadricula, cx: number, cy: number): boolean {
  if (cx < 0 || cy < 0 || cx >= g.ancho || cy >= g.alto) return true;
  return g.bloqueo[cy * g.ancho + cx] === 1;
}

/** ¿La caja de colisión de un personaje con los pies en (x, y) toca algo sólido? */
export function chocaEn(g: Cuadricula, x: number, y: number): boolean {
  for (const [dx, dy] of [[-MITAD_CAJA, 0], [MITAD_CAJA, 0], [-MITAD_CAJA, -ALTO_CAJA], [MITAD_CAJA, -ALTO_CAJA]] as const) {
    if (bloqueada(g, Math.floor((x + dx) / CASILLA), Math.floor((y + dy) / CASILLA))) return true;
  }
  return false;
}

/** Línea recta de un punto a otro sin tocar nada sólido (se mira cada 4 píxeles). */
export function lineaLibre(g: Cuadricula, x0: number, y0: number, x1: number, y1: number): boolean {
  const d = Math.hypot(x1 - x0, y1 - y0);
  const n = Math.max(1, Math.ceil(d / 4));
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    if (chocaEn(g, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t)) return false;
  }
  return true;
}

export interface ResultadoPaso {
  x: number;
  y: number;
  movio: boolean;
}

/**
 * Un paso de `paso` píxeles en la dirección (vx, vy), que debe venir normalizada. Si un eje se traba, el otro sigue (se desliza por la pared).
 * Si vas recto y solo rozas una esquina, te corre de lado hasta `AYUDA_ESQUINA` píxeles para que pases, como en Gather.
 */
export function pasoConDeslizamiento(g: Cuadricula, x: number, y: number, vx: number, vy: number, paso: number): ResultadoPaso {
  const nx = x + vx * paso;
  const ny = y + vy * paso;
  let px = chocaEn(g, nx, y) ? x : nx;
  let py = chocaEn(g, px, ny) ? y : ny;
  const avanzo = Math.abs(px - x) + Math.abs(py - y);
  const queria = Math.abs(vx) + Math.abs(vy) > 0;
  // Casi recto y sin avanzar nada: ¿hay paso un poco más al lado?
  if (queria && avanzo < paso * 0.2) {
    if (Math.abs(vy) < 0.3 && Math.abs(vx) > 0.7) {
      const k = holguraLateral(g, nx, y, 'y');
      if (k !== 0) py = y + Math.sign(k) * Math.min(Math.abs(k), paso * 0.8);
    } else if (Math.abs(vx) < 0.3 && Math.abs(vy) > 0.7) {
      const k = holguraLateral(g, x, ny, 'x');
      if (k !== 0) px = x + Math.sign(k) * Math.min(Math.abs(k), paso * 0.8);
    }
  }
  const movio = Math.abs(px - x) + Math.abs(py - y) > 0.05;
  return { x: px, y: py, movio };
}

/** Cuánto hay que correrse en el eje `eje` (con signo) para que la caja quepa en (x, y); 0 si no hay forma dentro de la ayuda. */
function holguraLateral(g: Cuadricula, x: number, y: number, eje: 'x' | 'y'): number {
  for (let k = 1; k <= AYUDA_ESQUINA; k++) {
    const a = eje === 'y' ? !chocaEn(g, x, y - k) : !chocaEn(g, x - k, y);
    const b = eje === 'y' ? !chocaEn(g, x, y + k) : !chocaEn(g, x + k, y);
    if (a) return -k;
    if (b) return k;
  }
  return 0;
}

export interface AvanceRuta {
  x: number;
  y: number;
  vx: number;
  vy: number;
  movio: boolean;
  /** Llegó al final del camino en este paso. */
  termino: boolean;
}

/**
 * Un paso siguiendo un camino de casillas. Corta esquinas: apunta a la casilla más lejana (de las próximas) a la que se llega
 * en línea recta sin tocar nada, y descarta las que deja atrás. Modifica `ruta`. Nunca pasa de largo la casilla a la que apunta.
 */
export function avanzarPorRuta(g: Cuadricula, x: number, y: number, ruta: Celda[], paso: number): AvanceRuta {
  const nada: AvanceRuta = { x, y, vx: 0, vy: 0, movio: false, termino: false };
  if (ruta.length === 0) return { ...nada, termino: true };
  // La casilla final se alcanza siempre por su centro; las intermedias se pueden saltar si se ve la siguiente.
  let salto = 0;
  for (let i = Math.min(ruta.length - 1, 6); i > 0; i--) {
    const c = centroDeCelda(ruta[i] as Celda);
    if (lineaLibre(g, x, y, c.x, c.y)) {
      salto = i;
      break;
    }
  }
  if (salto > 0) ruta.splice(0, salto);
  const meta = centroDeCelda(ruta[0] as Celda);
  const dx = meta.x - x;
  const dy = meta.y - y;
  const d = Math.hypot(dx, dy);
  if (d < 2) {
    ruta.shift();
    return { ...nada, termino: ruta.length === 0 };
  }
  const vx = dx / d;
  const vy = dy / d;
  const r = pasoConDeslizamiento(g, x, y, vx, vy, Math.min(paso, d));
  const llega = Math.hypot(meta.x - r.x, meta.y - r.y) < 2 && ruta.length === 1;
  if (llega) ruta.shift();
  return { x: r.x, y: r.y, vx, vy, movio: r.movio, termino: llega };
}
