import type { EstadoPresencia } from '@ol/shared';

/** Cómo se ve cada estado de presencia en el mundo: el punto de la píldora de nombre. Lógica pura. */

/** Verde disponible, rojo ocupado (concentrado), azul en reunión y naranja ausente. */
export const COLOR_PUNTO: Record<EstadoPresencia, string> = {
  disponible: '#22C55E',
  concentrado: '#EF4444',
  reunion: '#3B82F6',
  ausente: '#F59E0B',
};

/** Colores de la píldora: la tuya y la seleccionada van en azul violeta con letra blanca; las demás, claras. */
export const PILDORA = {
  propia: { fondo: '#5B4BDB', texto: '#FFFFFF', borde: '#4B3CC4' },
  clara: { fondo: '#FFFFFF', texto: '#1F2433', borde: '#D9DCE6' },
  /** Para el modo oscuro del mundo: la clara se vuelve gris azulada oscura, la propia no cambia. */
  claraOscura: { fondo: '#23283A', texto: '#F2F4FA', borde: '#3A4156' },
} as const;

export type VarianteNombre = 'yo' | 'seleccionada' | 'otra';

/** ¿Va en azul violeta? Tú y quien tengas seleccionado. */
export const esPildoraDestacada = (v: VarianteNombre): boolean => v === 'yo' || v === 'seleccionada';

export const MAX_CARACTERES_NOMBRE = 22;

/** Recorta con puntos suspensivos si pasa del largo. Cuenta caracteres, no bytes. */
export function recortar(texto: string, max: number = MAX_CARACTERES_NOMBRE): string {
  const t = texto.trim().replace(/\s+/g, ' ');
  const letras = [...t];
  return letras.length <= max ? t : `${letras.slice(0, Math.max(1, max - 1)).join('').trimEnd()}…`;
}

/** Lo que dice la píldora: el apodo si lo tiene y, si no, el nombre completo, recortado. */
export function textoDePildora(p: { nombre: string; apodo: string }): string {
  return recortar(p.apodo.trim() || p.nombre);
}

/** La inicial para el círculo de la vista esquemática. */
export function inicialDe(p: { nombre: string; apodo: string }): string {
  const t = (p.apodo.trim() || p.nombre.trim()).replace(/^[^\p{L}\p{N}]+/u, '');
  return ([...t][0] ?? '?').toLocaleUpperCase('es');
}

/** Un color estable para cada persona (círculos del esquema), sacado de su id. Colores suaves, como los avatares de Gather. */
const PALETA_AVATARES = ['#F9A8A0', '#F6C177', '#9AD7A5', '#8FC8EA', '#C7A8F0', '#F2A7D1', '#A8D5D0', '#E7C28F'] as const;
export const colorDePersona = (id: number): string => PALETA_AVATARES[Math.abs(Math.trunc(id)) % PALETA_AVATARES.length] as string;

/** «#RRGGBB» → número 0xRRGGBB (para Phaser). */
export function aNumero(css: string): number {
  return Number.parseInt(css.replace('#', ''), 16);
}
