import { CASILLA, type Asiento } from '@ol/shared';
import { ALTO_CAJA } from './movimiento';

/**
 * Sentarse al estilo de Gather: los asientos no bloquean, se cruzan caminando. Solo se sienta quien SE DETIENE con el centro
 * del cuerpo dentro de la casilla de un asiento libre: sin teclas, sin camino y tras una pequeña tolerancia (`ESPERA_SENTARSE_MS`).
 * Si sigue caminando, pasa de largo. Al levantarse no se vuelve a sentar en ese mismo asiento hasta salir de su casilla.
 */
export const ESPERA_SENTARSE_MS = 160;

const mismo = (a: Asiento, b: Asiento): boolean => a.colocacion === b.colocacion && a.x === b.x && a.y === b.y;

/** El asiento libre bajo el centro del cuerpo (los pies están en (x, y)), o null. */
export function asientoBajoElCentro(asientos: readonly Asiento[], x: number, y: number, ocupado: (a: Asiento) => boolean): Asiento | null {
  const cx = Math.floor(x / CASILLA);
  const cy = Math.floor((y - ALTO_CAJA / 2) / CASILLA);
  return asientos.find((a) => a.x === cx && a.y === cy && !ocupado(a)) ?? null;
}

/** Cuenta cuánto lleva quieto el personaje y decide cuándo sentarlo. */
export class SentarseAlParar {
  private quietoMs = 0;
  private movio = false;
  private ignorado: Asiento | null = null;

  /** Tras sentarse o aparecer en un lugar nuevo: hay que volver a moverse para que cuente como «detenerse». */
  reiniciar(): void {
    this.quietoMs = 0;
    this.movio = false;
  }

  /** Tras levantarse: ese asiento no vuelve a sentarte hasta que salgas de su casilla. */
  ignorarHasta(a: Asiento): void {
    this.ignorado = a;
    this.quietoMs = 0;
  }

  /**
   * Un cuadro. `quieto` = sin teclas, sin camino y sin avanzar. Devuelve el asiento donde sentarse, o null.
   */
  paso(dtMs: number, quieto: boolean, x: number, y: number, asientos: readonly Asiento[], ocupado: (a: Asiento) => boolean): Asiento | null {
    const bajo = asientoBajoElCentro(asientos, x, y, () => false);
    if (this.ignorado && !(bajo && mismo(bajo, this.ignorado))) this.ignorado = null;
    if (!quieto) {
      this.quietoMs = 0;
      this.movio = true;
      return null;
    }
    this.quietoMs += dtMs;
    if (!this.movio || this.quietoMs < ESPERA_SENTARSE_MS) return null;
    if (!bajo || ocupado(bajo) || (this.ignorado && mismo(bajo, this.ignorado))) return null;
    return bajo;
  }
}
