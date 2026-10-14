/**
 * Paleta del exterior de Oficina Live (la calle, el andén y los vecinos que se ven desde el piso 4).
 *
 * Es una paleta aparte de la compartida (`nucleo/paleta.ts`), igual que la de la fachada del ingreso: la calle necesita
 * grises de asfalto, adoquines, azules de vidrio y verdes de copa que no están en la compartida, y esa no se toca.
 * Los tonos de andén, asfalto, árboles, vidrio y conos son EXACTAMENTE los del día de `ingreso/paleta-naos.ts`, para que
 * el exterior se sienta el mismo lugar que la entrada animada. Lo que no existía allá se agrega aquí.
 *
 * Solo hay valores de día. La noche no se dibuja: el motor la produce con un multiplicador azul y capas de luz.
 * El tope es de 128 colores (lo revisa `exterior.test.ts`).
 */

import { TOKENS_NAOS, type TokenNaos } from '../ingreso/paleta-naos';

const naos = (t: TokenNaos): string => TOKENS_NAOS[t][0];

export const TOKENS = {
  // ---- De la fachada del ingreso (día) ----
  c0: naos('c0'),
  c1: naos('c1'),
  c2: naos('c2'),
  c3: naos('c3'),
  c4: naos('c4'),
  ac0: naos('ac0'),
  ac1: naos('ac1'),
  ac2: naos('ac2'),
  ac3: naos('ac3'),
  vg0: naos('vg0'),
  vg1: naos('vg1'),
  vg2: naos('vg2'),
  vg3: naos('vg3'),
  vv0: naos('vv0'),
  vv1: naos('vv1'),
  ol: naos('ol'),
  v0: naos('v0'),
  v1: naos('v1'),
  v2: naos('v2'),
  v3: naos('v3'),
  v4: naos('v4'),
  pasto0: naos('pasto0'),
  pasto1: naos('pasto1'),
  pasto2: naos('pasto2'),
  tr0: naos('tr0'),
  tr1: naos('tr1'),
  tr2: naos('tr2'),
  adJ: naos('adJ'),
  adG0: naos('adG0'),
  adG1: naos('adG1'),
  adP0: naos('adP0'),
  adP1: naos('adP1'),
  bo0: naos('bo0'),
  bo1: naos('bo1'),
  bo2: naos('bo2'),
  as0: naos('as0'),
  as1: naos('as1'),
  as2: naos('as2'),
  pi0: naos('pi0'),
  pi1: naos('pi1'),
  co0: naos('co0'),
  co1: naos('co1'),
  co2: naos('co2'),
  co3: naos('co3'),
  co4: naos('co4'),
  cin0: naos('cin0'),
  bombilla: naos('bombilla'),
  sombraAc: naos('sombraAc'),

  // ---- Nuevos: líneas de la calzada y tierra ----
  ama0: '#C9981A',
  ama1: '#F2C94C',
  pasto3: '#6F9A3E',
  tie0: '#7A6A52',
  tie1: '#978462',
  tie2: '#B39F78',
  gr0: '#4E535F',
  gr1: '#626874',
  gr2: '#787E8A',


  // ---- Bloques de los vecinos: tonos apagados y desaturados, sin detalle, para que el ojo se quede en la avenida ----
  mu0: '#7D8795',
  mu1: '#8A94A2',
  mu2: '#97A1AE',
  mu3: '#A4AEBA',
  mu4: '#B3BCC7',
  mf0: '#6A7586',
  mf1: '#768192',
  mf2: '#838E9E',
  ml0: '#8F9C8C',
  ml1: '#99A696',
  ml2: '#A4B0A1',

  // ---- Luz de ventanas encendidas (las capas de noche) ----
  lw0: '#E08A2C',
  lw1: '#FFB347',
  lw2: '#FFD890',
  lw3: '#FFF0B0',

  // ---- Vestíbulo de Naos (mismos tonos del ingreso) ----
  pl0: '#8A4E26',
  pl1: '#C27A34',
  pl2: '#F0A848',

  // ---- Carros ----
  ta0: '#B07A0C',
  ta1: '#E6B422',
  ta2: '#FFE066',
  ro0: '#8E1F26',
  ro1: '#C42B33',
  ro2: '#EE5459',
  cr0: '#1E2736',
  cr1: '#34465E',
  cr2: '#6C88A8',

  // ---- Gente ----
  pe0: '#F0C8A4',
  pe1: '#D9A07A',
  pe2: '#B0764E',
  pe3: '#7A4A30',
  mo0: '#4A3A7A',
  mo1: '#6F55B0',
  mo2: '#9B79DA',
  je0: '#2F3957',
  je1: '#46557A',

  // ---- Árboles de flor (jacarandá) ----
  ja0: '#5B3F8E',
  ja1: '#7E5BB8',
  ja2: '#A37FD8',
  ja3: '#C9AEF0',

  // ---- Cosas sueltas ----
  tk0: '#7C8EA4',
  tk1: '#A9BACC',
  tk2: '#D2DDE8',
  vb0: '#1E6E86',
  vb1: '#2C94AE',
  vb2: '#5CBAD0',
  sh: '#0E1220',
} as const;

export type Token = keyof typeof TOKENS;

/** Hex de un token de la paleta del exterior. */
export const k = (t: Token): string => TOKENS[t];

/** Todos los colores permitidos en el exterior (hex en mayúsculas, sin repetidos). */
export function coloresExterior(): string[] {
  return [...new Set(Object.values(TOKENS).map((h) => h.toUpperCase()))];
}
