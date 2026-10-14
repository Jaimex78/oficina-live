import { CASILLA } from '@ol/shared';

/** Hasta dónde llega el «cerca» medido desde el borde de la puerta, en píxeles: poco más de una casilla. */
export const ALCANCE_PUERTA = CASILLA * 1.1;
/** Cuánto tarda la hoja en pasar de cerrada a abierta, en segundos. */
export const DURACION_PUERTA = 0.2;
export interface Presencia {
  x: number;
  y: number;
}

/** ¿Hay alguien con los pies a menos de `alcance` del rectángulo de la puerta (en casillas x, y, ancho, alto)? */
export function hayAlguienCerca(huella: { x: number; y: number; ancho: number; alto: number }, gente: readonly Presencia[], alcance = ALCANCE_PUERTA): boolean {
  const x0 = huella.x * CASILLA;
  const y0 = huella.y * CASILLA;
  const x1 = (huella.x + huella.ancho) * CASILLA;
  const y1 = (huella.y + huella.alto) * CASILLA;
  for (const p of gente) {
    // Los pies están en p.y; el centro del cuerpo queda unos 8 px más arriba.
    const px = Math.max(x0, Math.min(p.x, x1));
    const py = Math.max(y0, Math.min(p.y - 8, y1));
    if (Math.hypot(p.x - px, p.y - 8 - py) <= alcance) return true;
  }
  return false;
}

/** Avance del estado de una puerta hacia su objetivo (0 cerrada, 1 abierta), con suavidad. Es pura para poder probarla. */
export function avanzarPuerta(p: number, abierta: boolean, dt: number): number {
  const paso = dt / DURACION_PUERTA;
  const meta = abierta ? 1 : 0;
  if (p < meta) return Math.min(meta, p + paso);
  return Math.max(meta, p - paso);
}

