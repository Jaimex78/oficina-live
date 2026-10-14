/**
 * Carros, moto y bus, pequeños y vistos desde arriba y de lado (tres cuartos). Seis colores de carro: taxi amarillo,
 * blanco, negro, rojo, azul y plata. Cada color tiene dos orientaciones: en sentido este (el motor lo voltea para ir
 * al oeste) y en sentido sur y norte para la calle 102.
 */

import { Lienzo } from '../nucleo';
import { k, type Token } from './paleta';
import type { SpriteConAncla } from './sprites-vegetacion';

export type ColorAuto = 'taxi' | 'blanco' | 'negro' | 'rojo' | 'azul' | 'plata';
export const COLORES_AUTO: readonly ColorAuto[] = ['taxi', 'blanco', 'negro', 'rojo', 'azul', 'plata'];

/** Tres tonos por color: oscuro, medio y claro. */
const TONOS_AUTO: Readonly<Record<ColorAuto, readonly [Token, Token, Token]>> = {
  taxi: ['ta0', 'ta1', 'ta2'],
  blanco: ['c2', 'c3', 'c4'],
  negro: ['ac1', 'ac2', 'ac3'],
  rojo: ['ro0', 'ro1', 'ro2'],
  azul: ['vg0', 'vg1', 'vg2'],
  plata: ['c0', 'c1', 'c2'],
};

/** Cambia el color de los píxeles ya pintados de un rectángulo (sirve para dar bandas de luz a una forma). */
function bandaSobreForma(l: Lienzo, x: number, y: number, w: number, h: number, color: string): void {
  for (let py = y; py < y + h; py++) {
    for (let px = x; px < x + w; px++) if (l.esOpaco(px, py)) l.px(px, py, color);
  }
}

/** Carro de lado, mirando al este. Mide 60 x 30 y las ruedas asoman por el borde de abajo. */
export function spriteAutoEste(c: ColorAuto): SpriteConAncla {
  const [t0, t1, t2] = TONOS_AUTO[c].map(k) as [string, string, string];
  const l = new Lienzo(60, 30);
  // Ruedas: solo se ve la mitad de abajo.
  for (const x of [11, 47]) {
    l.elipse(x, 25, 5, 3, k('ac0'));
    l.rect(x - 1, 25, 3, 1, k('ac2'));
  }
  // Carrocería.
  l.rectRedondeado(2, 4, 56, 20, 6, t1);
  bandaSobreForma(l, 0, 4, 60, 5, t2);
  bandaSobreForma(l, 0, 19, 60, 5, t0);
  // Capó y baúl, con sus costuras.
  l.rect(45, 9, 1, 10, t0);
  l.rect(12, 9, 1, 10, t0);
  // Cabina: techo claro, vidrio delantero, vidrio trasero y ventanas de la puerta.
  l.rectRedondeado(16, 6, 28, 15, 4, t2);
  l.rect(38, 8, 6, 11, k('cr1'));
  l.rect(38, 8, 6, 2, k('cr2'));
  l.rect(15, 9, 5, 9, k('cr0'));
  l.rect(21, 18, 17, 3, k('cr0'));
  l.rect(29, 18, 1, 3, t1);
  l.rect(21, 8, 17, 1, t2);
  // Luces: faros delante (este) y pilotos atrás (oeste).
  l.rect(57, 7, 1, 3, k('bombilla'));
  l.rect(57, 18, 1, 3, k('bombilla'));
  l.rect(2, 7, 1, 3, k('ro2'));
  l.rect(2, 18, 1, 3, k('ro2'));
  if (c === 'taxi') {
    // Aviso de taxi sobre el techo.
    l.rect(26, 12, 7, 3, k('c4'));
    l.rect(27, 13, 5, 1, k('ac0'));
  }
  l.contorno(k('ol'));
  return { id: `auto-e-${c}`, lienzo: l, ancla: { x: 30, y: 25 } };
}

/** Carro visto de frente (va hacia el sur, hacia quien mira) o de espaldas (va hacia el norte). Mide 30 x 60. */
export function spriteAutoVertical(c: ColorAuto, rumbo: 's' | 'n'): SpriteConAncla {
  const [t0, t1, t2] = TONOS_AUTO[c].map(k) as [string, string, string];
  const l = new Lienzo(30, 60);
  // Ruedas que asoman a los lados.
  for (const y of [14, 41]) {
    l.rect(1, y, 3, 8, k('ac0'));
    l.rect(26, y, 3, 8, k('ac0'));
  }
  l.rectRedondeado(3, 3, 24, 54, 7, t1);
  bandaSobreForma(l, 3, 0, 6, 60, t2);
  bandaSobreForma(l, 21, 0, 6, 60, t0);
  if (rumbo === 's') {
    // Frente abajo: capó, vidrio grande, techo, vidrio trasero chico y baúl arriba.
    l.rect(4, 44, 22, 1, t0);
    l.rect(6, 34, 18, 9, k('cr1'));
    l.rect(6, 34, 18, 2, k('cr2'));
    l.rectRedondeado(7, 17, 16, 16, 3, t2);
    l.rect(8, 11, 14, 5, k('cr0'));
    l.rect(4, 10, 22, 1, t0);
    l.rect(5, 54, 5, 2, k('bombilla'));
    l.rect(20, 54, 5, 2, k('bombilla'));
    l.rect(5, 4, 4, 2, k('ro2'));
    l.rect(21, 4, 4, 2, k('ro2'));
  } else {
    // De espaldas: el vidrio trasero y el baúl quedan abajo, los pilotos también.
    l.rect(4, 15, 22, 1, t0);
    l.rect(6, 16, 18, 8, k('cr1'));
    l.rect(6, 16, 18, 2, k('cr2'));
    l.rectRedondeado(7, 25, 16, 15, 3, t2);
    l.rect(7, 41, 16, 6, k('cr0'));
    l.rect(4, 48, 22, 1, t0);
    l.rect(5, 5, 5, 2, k('bombilla'));
    l.rect(20, 5, 5, 2, k('bombilla'));
    l.rect(5, 53, 4, 2, k('ro2'));
    l.rect(21, 53, 4, 2, k('ro2'));
  }
  if (c === 'taxi') {
    l.rect(11, 25, 8, 3, k('c4'));
    l.rect(12, 26, 6, 1, k('ac0'));
  }
  l.contorno(k('ol'));
  return { id: `auto-${rumbo}-${c}`, lienzo: l, ancla: { x: 15, y: 54 } };
}

/** Moto de lado, mirando al este, con su conductor con casco. Mide 28 x 18. */
export function spriteMotoEste(): SpriteConAncla {
  const l = new Lienzo(28, 18);
  for (const x of [6, 21]) {
    l.elipse(x, 13, 4, 4, k('ac0'));
    l.elipse(x, 13, 2, 2, k('c1'));
  }
  // Cuerpo y tanque.
  l.rect(8, 8, 13, 4, k('ro1'));
  l.rect(8, 8, 13, 1, k('ro2'));
  l.rect(19, 6, 5, 3, k('ac2'));
  l.rect(5, 9, 5, 2, k('ac1'));
  // Conductor: casco, torso inclinado y brazo hacia el manubrio.
  l.elipse(15, 3, 3, 3, k('co1'));
  l.rect(14, 2, 2, 1, k('co2'));
  l.rect(12, 5, 6, 5, k('je1'));
  l.rect(17, 7, 5, 2, k('pe1'));
  l.rect(13, 10, 4, 3, k('je0'));
  l.contorno(k('ol'));
  return { id: 'moto-e', lienzo: l, ancla: { x: 14, y: 16 } };
}

/** Bus rojo articulado (como los de la Troncal de la Av. Caracas), mirando al este. Mide 124 x 34. */
export function spriteBusEste(): SpriteConAncla {
  const W = 124;
  const l = new Lienzo(W, 34);
  for (const x of [20, 36, 92, 108]) {
    l.elipse(x, 29, 5, 3, k('ac0'));
    l.rect(x - 1, 29, 3, 1, k('ac2'));
  }
  // Cuerpo: techo claro y costado rojo con la banda de ventanas.
  l.rectRedondeado(2, 4, W - 4, 24, 5, k('ro1'));
  bandaSobreForma(l, 0, 4, W, 15, k('c3'));
  bandaSobreForma(l, 0, 4, W, 2, k('c4'));
  bandaSobreForma(l, 0, 27, W, 1, k('ro0'));
  // Juntas del techo y equipos de aire.
  for (const x of [30, 60, 90]) l.rect(x, 5, 1, 13, k('c2'));
  for (const x of [14, 46, 78, 100]) {
    l.rect(x, 7, 12, 8, k('c2'));
    l.rect(x + 1, 8, 10, 1, k('c4'));
    l.rect(x + 3, 11, 6, 1, k('c1'));
  }
  // Costado: ventanas con parantes.
  l.rect(5, 20, W - 10, 5, k('cr0'));
  for (let x = 14; x < W - 8; x += 10) l.rect(x, 20, 1, 5, k('ro1'));
  l.rect(5, 20, W - 10, 1, k('cr1'));
  // Puertas dobles con vidrio.
  for (const x of [20, 80]) {
    l.rect(x, 19, 8, 8, k('c2'));
    l.rect(x + 1, 20, 3, 6, k('cr1'));
    l.rect(x + 4, 20, 3, 6, k('cr1'));
  }
  // Fuelle del articulado.
  l.rect(60, 4, 8, 24, k('ac1'));
  for (let x = 61; x < 68; x += 2) l.rect(x, 4, 1, 24, k('ac2'));
  // Frente: parabrisas, faros y rótulo de destino.
  l.rect(W - 9, 6, 6, 14, k('cr1'));
  l.rect(W - 9, 6, 6, 2, k('cr2'));
  l.rect(W - 6, 22, 3, 3, k('bombilla'));
  l.rect(W - 18, 6, 8, 3, k('cin0'));
  // Luces de atrás.
  l.rect(2, 21, 1, 4, k('ro2'));
  l.contorno(k('ol'));
  return { id: 'bus-e', lienzo: l, ancla: { x: 62, y: 28 } };
}

/** Todos los vehículos. */
export function spritesVehiculos(): SpriteConAncla[] {
  const salida: SpriteConAncla[] = [];
  for (const c of COLORES_AUTO) {
    salida.push(spriteAutoEste(c), spriteAutoVertical(c, 's'), spriteAutoVertical(c, 'n'));
  }
  salida.push(spriteMotoEste(), spriteBusEste());
  return salida;
}
