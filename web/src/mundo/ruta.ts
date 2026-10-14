import { CASILLA, alcanzables, buscarRuta, indiceDe, masCercanoAlcanzable, type Asiento, type Celda, type SalaMapa } from '@ol/shared';
import type { RectCasillas } from './areas';

/**
 * Planes de camino sobre la cuadrícula de la sala. Usan la misma regla de paso que el servidor
 * (`indiceDe(sala).bloqueo`: sin piso o con algo sólido; los asientos se cruzan) y el A* de `shared`.
 */

export interface Cuadricula {
  ancho: number;
  alto: number;
  /** 1 = no se puede pisar. */
  bloqueo: Uint8Array;
}

export const cuadriculaDe = (sala: SalaMapa): Cuadricula => ({ ancho: sala.ancho, alto: sala.alto, bloqueo: indiceDe(sala).bloqueo });

/** La casilla donde están los pies de un personaje (los pies quedan 4 píxeles dentro de su casilla, como en el motor). */
export const celdaDePies = (x: number, y: number): Celda => ({ x: Math.floor(x / CASILLA), y: Math.floor((y - 4) / CASILLA) });

/** El punto donde se para un personaje en el centro de una casilla (en píxeles). */
export const centroDeCelda = (c: Celda): { x: number; y: number } => ({ x: c.x * CASILLA + CASILLA / 2, y: c.y * CASILLA + 24 });

const dentro = (g: Cuadricula, c: Celda): boolean => c.x >= 0 && c.y >= 0 && c.x < g.ancho && c.y < g.alto;
const acotar = (g: Cuadricula, c: Celda): Celda => ({ x: Math.max(0, Math.min(g.ancho - 1, c.x)), y: Math.max(0, Math.min(g.alto - 1, c.y)) });

/** Camino a una casilla. Si está bloqueada (un escritorio, una pared) o no se puede llegar, va a la casilla alcanzable que queda más cerca. */
export function rutaAPunto(g: Cuadricula, desde: Celda, objetivo: Celda): Celda[] | null {
  const origen = acotar(g, desde);
  let destino: Celda | null = acotar(g, objetivo);
  if (g.bloqueo[destino.y * g.ancho + destino.x]) destino = masCercanoAlcanzable(g.bloqueo, g.ancho, g.alto, origen, destino);
  if (!destino) return null;
  const directa = buscarRuta(g.bloqueo, g.ancho, g.alto, origen, destino);
  if (directa) return directa;
  // Un lugar al que no se puede llegar caminando (otro lado de un muro): se acerca lo más que se pueda.
  const cerca = masCercanoAlcanzable(g.bloqueo, g.ancho, g.alto, origen, destino);
  return cerca ? buscarRuta(g.bloqueo, g.ancho, g.alto, origen, cerca) : null;
}

/** Camino hasta quedar pegado a otra casilla (donde está una persona). Si ya estás pegado, no hace falta caminar. */
export function rutaAlLado(g: Cuadricula, desde: Celda, objetivo: Celda): Celda[] | null {
  const origen = acotar(g, desde);
  if (Math.max(Math.abs(origen.x - objetivo.x), Math.abs(origen.y - objetivo.y)) <= 1) return [];
  let mejor: Celda[] | null = null;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      const c = { x: objetivo.x + dx, y: objetivo.y + dy };
      if (!dentro(g, c) || g.bloqueo[c.y * g.ancho + c.x]) continue;
      const r = buscarRuta(g.bloqueo, g.ancho, g.alto, origen, c);
      if (r && (!mejor || r.length < mejor.length)) mejor = r;
    }
  }
  return mejor ?? rutaAPunto(g, desde, objetivo);
}

/**
 * Camino hasta el centro del asiento: se sienta al llegar (queda quieto dentro de su casilla). Si el asiento está tapado y no se
 * puede llegar caminando, va a lo más cercano y `llegaSentado` es false (no rompe nada, solo no se sienta). Null si no hay a dónde ir.
 */
export function rutaAAsiento(g: Cuadricula, desde: Celda, a: Asiento): { ruta: Celda[]; llegaSentado: boolean } | null {
  const origen = acotar(g, desde);
  if (origen.x === a.x && origen.y === a.y) return { ruta: [], llegaSentado: true };
  if (!g.bloqueo[a.y * g.ancho + a.x]) {
    const directa = buscarRuta(g.bloqueo, g.ancho, g.alto, origen, { x: a.x, y: a.y });
    if (directa) return { ruta: directa, llegaSentado: true };
  }
  const cerca = masCercanoAlcanzable(g.bloqueo, g.ancho, g.alto, origen, { x: a.x, y: a.y });
  const ruta = cerca ? buscarRuta(g.bloqueo, g.ancho, g.alto, origen, cerca) : null;
  return ruta ? { ruta, llegaSentado: false } : null;
}

/** Camino al centro de una zona o un área: va a la casilla alcanzable de adentro que queda más cerca del centro. */
export function rutaAArea(sala: SalaMapa, g: Cuadricula, desde: Celda, r: RectCasillas): Celda[] | null {
  const origen = acotar(g, desde);
  const vistas = alcanzables(sala, [origen]);
  const cx = r.x + (r.w - 1) / 2;
  const cy = r.y + (r.h - 1) / 2;
  let mejor: Celda | null = null;
  let mejorD = Infinity;
  for (let y = Math.max(0, r.y); y < Math.min(g.alto, r.y + r.h); y++) {
    for (let x = Math.max(0, r.x); x < Math.min(g.ancho, r.x + r.w); x++) {
      const k = y * g.ancho + x;
      if (g.bloqueo[k] || !vistas[k]) continue;
      const d = (x - cx) ** 2 + (y - cy) ** 2;
      if (d < mejorD) {
        mejorD = d;
        mejor = { x, y };
      }
    }
  }
  return mejor ? buscarRuta(g.bloqueo, g.ancho, g.alto, origen, mejor) : null;
}

/** Largo de un camino en casillas, contando la diagonal como 1,4 (sirve para comparar y para decidir si vale la pena). */
export function largoDeRuta(desde: Celda, ruta: readonly Celda[]): number {
  let total = 0;
  let a = desde;
  for (const b of ruta) {
    total += a.x !== b.x && a.y !== b.y ? 1.4142 : 1;
    a = b;
  }
  return total;
}
