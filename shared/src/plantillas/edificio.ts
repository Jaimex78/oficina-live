import type { ConstructorSala } from '../oficina';

/**
 * El cascarón de la oficina de ejemplo en el piso 4 de Naos Empresarial, Bogotá, compartido por todas las plantillas del mapa: la sala mide 46x30
 * casillas (la calle y los vecinos de afuera encajan con estas medidas), el área interior es x 2..35, y 4..25 y el balcón de la
 * esquina sureste va de x 37..41, y 20..27 con la esquina de afuera redondeada. Los muros exteriores rodean los dos; el balcón lleva
 * baranda baja (`cerca`) y piso de deck. La puerta del balcón está en (36, 20).
 */

export const SALA_ANCHO = 46;
export const SALA_ALTO = 30;
export const X0 = 2;
export const X1 = 35;
export const Y0 = 4;
export const Y1 = 25;

export const interiorSala = (x: number, y: number): boolean => x >= X0 && x <= X1 && y >= Y0 && y <= Y1;
/** Balcón de la esquina sureste: x 37..41, y 20..27 con la esquina de afuera redondeada. */
export const interiorBalcon = (x: number, y: number): boolean => {
  if (x < 37 || x > 41 || y < 20 || y > 27) return false;
  return !((x === 41 && y >= 26) || (x === 40 && y === 27));
};

function vecino(f: (x: number, y: number) => boolean, x: number, y: number): boolean {
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (f(x + dx, y + dy)) return true;
  return false;
}
export const anilloSala = (x: number, y: number): boolean => !interiorSala(x, y) && vecino(interiorSala, x, y);
export const anilloBalcon = (x: number, y: number): boolean => !interiorBalcon(x, y) && vecino(interiorBalcon, x, y);

/** ¿Hay piso (interior, muro o balcón) en esta casilla? */
export const hayPiso = (x: number, y: number): boolean => interiorSala(x, y) || anilloSala(x, y) || interiorBalcon(x, y) || anilloBalcon(x, y);
export const esBalcon = (x: number, y: number): boolean => interiorBalcon(x, y) || anilloBalcon(x, y);

/**
 * Pinta el piso de todo el edificio (el muro también necesita piso debajo) con `pisoDe(x, y)` y pone los muros exteriores
 * (`pared-lisa`) y la baranda del balcón (`cerca`). No pone la puerta del balcón ni los puntos de llegada.
 */
export function cascaron(b: ConstructorSala, pisoDe: (x: number, y: number) => string): void {
  for (let y = 0; y < SALA_ALTO; y++) {
    let ini = -1;
    let actual = '';
    for (let x = 0; x <= SALA_ANCHO - 1; x++) {
      const p = hayPiso(x, y) ? (esBalcon(x, y) ? 'piso-deck' : pisoDe(x, y)) : '';
      if (p !== actual) {
        if (actual) b.piso(ini, y, x - ini, 1, actual);
        ini = x;
        actual = p;
      }
    }
  }
  for (let y = 0; y < SALA_ALTO; y++) {
    for (let x = 0; x < SALA_ANCHO - 1; x++) {
      if (anilloSala(x, y) && !interiorBalcon(x, y)) b.poner('pared-lisa', x, y, 'U');
      else if (anilloBalcon(x, y) && !anilloSala(x, y)) b.poner('cerca', x, y, 'U');
    }
  }
}
