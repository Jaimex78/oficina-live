/**
 * Colores del personaje: 5 pieles, 12 colores de cabello y vello, y 16 de ropa.
 *
 * Cada opción es una rampa de 5 tonos que reemplaza a los marcadores de su slot:
 *   0 contorno (un tono casi negro del propio color; es lo que se ve en el borde de cada material)
 *   1 sombra, 2 base, 3 luz, 4 brillo.
 * Los tonos base salen de medir las muestras del editor de Gather (el tono 2 de cada rampa).
 * Las luces van un poco hacia el amarillo y las sombras hacia el azul violeta, y el contorno
 * nunca es negro puro: es una sombra muy profunda del mismo matiz.
 */

import type { OpcionColor, Rampa5 } from '@ol/shared';
import { hexAOklch, oklchAHex } from '../nucleo';

const MATIZ_LUZ = 85;
const MATIZ_SOMBRA = 295;

/** Acerca un matiz (en grados) a otro, hasta `max` grados, por el camino corto. */
function hacia(h: number, objetivo: number, max: number): number {
  let d = ((objetivo - h + 540) % 360) - 180;
  d = Math.max(-max, Math.min(max, d));
  return (h + d + 360) % 360;
}

/** Rampa de 5 tonos a partir del tono base. `t0` fija la luminosidad del contorno (0 a 1). */
export function rampa(base: string, o: { t0?: number; sube?: number; baja?: number } = {}): Rampa5 {
  const c = hexAOklch(base);
  const sube = o.sube ?? 0.085;
  const baja = o.baja ?? 0.125;
  const neutro = c.C < 0.02;
  const t1 = oklchAHex(Math.max(0.12, c.L - baja), neutro ? 0.016 : c.C * 1.02, neutro ? MATIZ_SOMBRA : hacia(c.h, MATIZ_SOMBRA, 9));
  const t0 = oklchAHex(o.t0 ?? 0.15, neutro ? 0.015 : Math.min(0.05, c.C * 0.3), neutro ? MATIZ_SOMBRA : hacia(c.h, MATIZ_SOMBRA, 14));
  const t3 = oklchAHex(Math.min(0.97, c.L + sube), neutro ? 0.006 : c.C * 0.95, neutro ? MATIZ_LUZ : hacia(c.h, MATIZ_LUZ, 6));
  const t4 = oklchAHex(Math.min(0.99, c.L + sube * 1.9), neutro ? 0.008 : c.C * 0.62, neutro ? MATIZ_LUZ : hacia(c.h, MATIZ_LUZ, 11));
  return [t0, t1, base.toUpperCase(), t3, t4];
}

const op = (id: string, nombre: string, rampa5: Rampa5): OpcionColor => ({ id, nombre, rampa: rampa5 });

/**
 * Las 5 pieles, de clara a oscura, con los tonos del arte base de Jaime Orozco: la piel 2 es la suya (sombra honda 75412B, sombra D8885C, base
 * F9BF95, luz FFD9BC). Tono 0 = sombra honda (cejas, boca, nuca; el contorno del cuerpo es negro fijo), 1 = sombra (rubor, pecas, brazo), 2 = base,
 * 3 = luz, 4 = brillo.
 */
export const PIELES: OpcionColor[] = [
  op('piel-1', 'Tono 1', ['#8B5237', '#E8A184', '#FDD7B8', '#FFE9D6', '#FFF5EC']),
  op('piel-2', 'Tono 2', ['#75412B', '#D8885C', '#F9BF95', '#FFD9BC', '#FFE8D4']),
  op('piel-3', 'Tono 3', ['#5B301C', '#B2693F', '#D79A6E', '#E8B38D', '#F3CDAB']),
  op('piel-4', 'Tono 4', ['#44220F', '#8A4F2A', '#B07646', '#C79465', '#DAAE85']),
  op('piel-5', 'Tono 5', ['#2D1609', '#5B351C', '#80522F', '#9A6A44', '#B58459']),
];

/**
 * Los 12 colores de cabello y vello facial, en el orden del editor de Gather. Gather trae tres cafés claros;
 * aquí el café más claro se cambió por un café oscuro, el tono natural que más falta hacía en Colombia.
 */
export const PELOS: OpcionColor[] = [
  op('pelo-blanco', 'Blanco', ['#14141E', '#B2B4C6', '#DCDEEA', '#F0F1F8', '#FFFFFF']),
  op('pelo-casi-negro', 'Casi negro', rampa('#32343B', { t0: 0.1, sube: 0.09, baja: 0.08 })),
  op('pelo-cafe-oscuro', 'Café oscuro', rampa('#6A4129')),
  op('pelo-cafe', 'Café', rampa('#AB7144')),
  op('pelo-caqui', 'Caqui', rampa('#9F8553')),
  op('pelo-rubio', 'Rubio', rampa('#F2B55B')),
  op('pelo-rojizo', 'Rojizo', rampa('#933B29')),
  op('pelo-naranja', 'Naranja', rampa('#E4853A')),
  op('pelo-rosa', 'Rosa', rampa('#F76899')),
  op('pelo-morado', 'Morado', rampa('#9869B1')),
  op('pelo-celeste', 'Celeste', rampa('#2DBDFF')),
  op('pelo-verde', 'Verde', rampa('#349141')),
];

/** Los 16 colores de ropa y accesorios, en el orden del editor de Gather. */
export const COLORES: OpcionColor[] = [
  op('rojo', 'Rojo', rampa('#E8372A')),
  op('naranja', 'Naranja', rampa('#F5994A')),
  op('amarillo', 'Amarillo', rampa('#FBC63F')),
  op('oliva', 'Oliva', rampa('#66783E')),
  op('verde', 'Verde', rampa('#349141')),
  op('verde-azulado', 'Verde azulado', rampa('#1D766B')),
  op('celeste', 'Celeste', rampa('#2DB6F5')),
  op('azul-violeta', 'Azul violeta', rampa('#6F82F5')),
  op('morado', 'Morado', rampa('#9869B1')),
  op('magenta', 'Magenta', rampa('#E03DBE')),
  op('rosa', 'Rosa', rampa('#F76899')),
  op('cafe', 'Café', rampa('#B76E4A')),
  op('beige', 'Beige', ['#1E1612', '#B8A28C', '#E3CAAE', '#F2E0C8', '#FFF3E2']),
  op('blanco', 'Blanco', ['#14141E', '#B6BACD', '#E6E8F0', '#F6F7FB', '#FFFFFF']),
  op('gris', 'Gris', rampa('#9193A6', { t0: 0.14 })),
  op('negro', 'Negro', rampa('#32343B', { t0: 0.09, sube: 0.1, baja: 0.08 })),
];
