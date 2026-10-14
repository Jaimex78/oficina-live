import type { VistaEsquema } from './tipos';

/**
 * Pasos de zoom de los botones. De 1 hacia arriba son enteros para que el pixel art no se deforme; hacia abajo
 * llegan hasta la vista esquemática (0,35 y menos), para que la oficina entera quepa en pantalla.
 */
export const ZOOMS = [0.15, 0.25, 0.35, 0.5, 1, 2, 3, 4] as const;

/** Con este zoom o menos (al alejar) el mundo cambia al esquema; con este o más (al acercar) vuelve al arte. Entre los dos no cambia. */
export const ESQUEMA_ENTRA_BAJO = 0.42;
export const ESQUEMA_SALE_SOBRE = 0.58;

/** Cuánto aire se deja alrededor de la sala al calcular el zoom que la hace caber (en píxeles del mundo). */
const AIRE_PX = 48;

/**
 * El zoom con el que la sala entera cabe en la pantalla, con un poco de aire. `vistaAncho` y `vistaAlto` son los píxeles
 * del lienzo; `salaAncho` y `salaAlto`, los píxeles del mundo.
 */
export function zoomQueAjusta(vistaAncho: number, vistaAlto: number, salaAncho: number, salaAlto: number): number {
  if (vistaAncho <= 0 || vistaAlto <= 0 || salaAncho <= 0 || salaAlto <= 0) return ZOOMS[0];
  return Math.min(vistaAncho / (salaAncho + 2 * AIRE_PX), vistaAlto / (salaAlto + 2 * AIRE_PX));
}

/**
 * El paso de zoom más lejano que se permite: el último de la lista que deja la sala a poco más de la mitad de la pantalla
 * (como Gather: se ve toda la oficina con aire alrededor). Nunca baja del primer paso.
 */
export function zoomMinimoPermitido(ajuste: number, pasos: readonly number[] = ZOOMS): number {
  const primero = pasos[0] ?? 0.15;
  const objetivo = ajuste * 0.62;
  let mejor = primero;
  for (const p of pasos) if (p <= objetivo + 1e-9) mejor = p;
  return mejor;
}

/** Si el esquema debe verse: «forzada» siempre, «apagada» nunca y «auto» según el zoom, con histéresis para que no parpadee. */
export function debeVerEsquema(modo: VistaEsquema, zoom: number, previo: boolean): boolean {
  if (modo === 'forzada') return true;
  if (modo === 'apagada') return false;
  return previo ? zoom < ESQUEMA_SALE_SOBRE : zoom < ESQUEMA_ENTRA_BAJO;
}

/** Acerca `valor` a `objetivo` con un suavizado exponencial que no depende de los cuadros por segundo. */
export function suavizar(valor: number, objetivo: number, dtSeg: number, velocidad: number): number {
  const k = 1 - Math.exp(-dtSeg * velocidad);
  const v = valor + (objetivo - valor) * k;
  return Math.abs(objetivo - v) < 0.004 ? objetivo : v;
}

/** El paso de zoom siguiente (o anterior) respetando el mínimo permitido. Si no hay otro, devuelve el mismo. */
export function pasoDeZoom(actual: number, paso: 1 | -1, minimo: number = ZOOMS[0], pasos: readonly number[] = ZOOMS): number {
  const permitidos = pasos.filter((z) => z >= minimo - 1e-9);
  let i = permitidos.findIndex((z) => Math.abs(z - actual) < 1e-9);
  if (i < 0) {
    // Un valor que no es un paso (por ejemplo, el zoom automático): se parte del paso más cercano.
    let mejor = 0;
    for (let k = 0; k < permitidos.length; k++) if (Math.abs((permitidos[k] as number) - actual) < Math.abs((permitidos[mejor] as number) - actual)) mejor = k;
    i = mejor;
  }
  return permitidos[Math.max(0, Math.min(permitidos.length - 1, i + paso))] ?? actual;
}

/**
 * Radio, en píxeles del mundo, del círculo de cada persona en la vista esquemática. Mide unos 13 píxeles de pantalla,
 * pero nunca menos que una persona de verdad ni más de una casilla, para que se entienda a cualquier zoom.
 */
export function radioCirculo(zoom: number): number {
  return Math.max(14, Math.min(36, 13 / Math.max(zoom, 0.01)));
}
