/**
 * Paleta propia de la escena de Naos Empresarial (ingreso).
 *
 * Es una paleta aparte de la compartida (`nucleo/paleta.ts`, tope de 128): la
 * fachada necesita azules de vidrio, grises de acero y luces cálidas que no
 * están en la compartida, y no se toca la compartida. Cada color tiene dos
 * valores, uno de día y uno de noche. El mismo dibujo sirve para las dos
 * versiones: solo cambia el valor que devuelve `paletaNaos(noche)`.
 *
 * Los colores fijos (puerta y lobby) llevan el mismo valor de día y de noche
 * para que los sprites de la puerta encajen en las dos escenas.
 */

/** [día, noche] */
type Par = readonly [string, string];

export const TOKENS_NAOS = {
  // ---- Cielo, nubes y estrellas ----
  cielo0: ['#6890C8', '#060A1C'],
  cielo1: ['#7FA2D0', '#090F2A'],
  cielo2: ['#98B4D6', '#0D1639'],
  cielo3: ['#AEC4DC', '#131F4A'],
  cielo4: ['#C2D2E2', '#1A2A5C'],
  cielo5: ['#D4DEE8', '#26346C'],
  nube0: ['#8A98B0', '#121A3E'],
  nube1: ['#AAB8CC', '#19234C'],
  nube2: ['#CAD4E2', '#232F5C'],
  nube3: ['#E8EDF3', '#2F3C6C'],
  estrella0: ['#D5E2EC', '#9FB4F0'],
  estrella1: ['#FFFFFF', '#FFFFFF'],

  // ---- Torres lejanas de vidrio ----
  torre0: ['#5F7FA8', '#0E1738'],
  torre1: ['#7794BB', '#141E46'],
  torre2: ['#92AACB', '#1B2655'],
  torre3: ['#AEC2DB', '#26336A'],
  torreV: ['#7A82B4', '#181C48'],
  torreLuz: ['#C3D4E8', '#FFD58A'],
  torreFria: ['#AEC2DB', '#8FB0F0'],

  // ---- Edificio de apartamentos de ladrillo ----
  lad0: ['#6B3F34', '#1A1018'],
  lad1: ['#8A5545', '#281820'],
  lad2: ['#A66B55', '#36202A'],
  lad3: ['#C48A6C', '#44303A'],
  ladVent: ['#3A3A52', '#0C0F1E'],
  ladLuz: ['#3A3A52', '#FFC870'],

  // ---- Vidrio azulado de Naos ----
  vg0: ['#1D3F80', '#081634'],
  vg1: ['#2E62B0', '#0E2250'],
  vg2: ['#4B88D4', '#173470'],
  vg3: ['#86B8EA', '#28508E'],
  vv0: ['#5B58B8', '#221E66'],
  vv1: ['#7E78D4', '#342E84'],

  // ---- Acero de las celosías ----
  ac0: ['#1B212D', '#070A12'],
  ac1: ['#2C3443', '#0F1420'],
  ac2: ['#444E5F', '#1A2132'],
  ac3: ['#6E7A8A', '#2C3648'],
  crown0: ['#10141C', '#04060B'],
  crown1: ['#1B2029', '#090C14'],
  crown2: ['#2A313E', '#121828'],

  // ---- Concreto blanco grisáceo ----
  c0: ['#767C88', '#161C30'],
  c1: ['#9CA2AC', '#232B44'],
  c2: ['#BEC3C8', '#34405E'],
  c3: ['#D8DBDC', '#4A5878'],
  c4: ['#EEEFEC', '#62739A'],

  cs0: ['#58606E', '#0B1020'],
  cs1: ['#6E7686', '#121A30'],
  cs2: ['#8890A0', '#1A2440'],

  // ---- Luz cálida de las oficinas y el lobby ----
  luz0: ['#8A4E26', '#B8631F'],
  luz1: ['#C27A34', '#E08A2C'],
  luz2: ['#E8A858', '#FFB347'],
  luz3: ['#FFD890', '#FFDB8A'],
  fria0: ['#4B88D4', '#5C7CC8'],
  fria1: ['#86B8EA', '#9DB8F0'],

  // ---- Contorno oscuro azulado ----
  ol: ['#1B2340', '#04060E'],

  // ---- Verdes ----
  v0: ['#14382C', '#06181A'],
  v1: ['#1E5A38', '#0C2A20'],
  v2: ['#2E8844', '#143F28'],
  v3: ['#54AE50', '#1F5C34'],
  v4: ['#8CD068', '#327A42'],
  pasto0: ['#8DB04A', '#3E5A2A'],
  pasto1: ['#C0D86C', '#5A7A36'],
  pasto2: ['#DDE88A', '#7A9A4A'],
  tr0: ['#3C2A28', '#0C0A10'],
  tr1: ['#5C4234', '#1A1416'],
  tr2: ['#7E6048', '#2A2022'],

  // ---- Adoquines grises y rosados ----
  adJ: ['#8C8E96', '#1C2034'],
  adG0: ['#A4A7AD', '#272D44'],
  adG1: ['#B8BBC0', '#323955'],
  adP0: ['#C09B98', '#3E3048'],
  adP1: ['#D4B2AC', '#4B3A58'],
  adJl: ['#8C8E96', '#363240'],
  adG0l: ['#A4A7AD', '#46414F'],
  adG1l: ['#B8BBC0', '#564F5C'],
  adP0l: ['#C09B98', '#64484F'],
  adP1l: ['#D4B2AC', '#745560'],
  sombraAc: ['#7C7E88', '#10142A'],

  // ---- Borde de acera y asfalto ----
  bo0: ['#7E7C7C', '#1A1E32'],
  bo1: ['#AAA8A6', '#2C3248'],
  bo2: ['#CBC9C5', '#3C4460'],
  as0: ['#3A3D46', '#0C0E1C'],
  as1: ['#484C56', '#121528'],
  as2: ['#5A5F6A', '#1A1E34'],
  pi0: ['#E8E8E2', '#8E92A0'],
  pi1: ['#BDBDB8', '#5E6274'],

  // ---- Conos y cinta de obra ----
  co0: ['#B8400E', '#7A2C0C'],
  co1: ['#E2601C', '#B04814'],
  co2: ['#F88A3E', '#D86A24'],
  co3: ['#F2F2EC', '#C8C8C4'],
  co4: ['#2A2A32', '#14141C'],
  cin0: ['#E2B52C', '#8A7220'],
  cin1: ['#2A2A32', '#14141C'],

  // ---- Poste de alumbrado ----
  bombilla: ['#F2EEDC', '#FFF0B0'],
  halo0: ['#F2EEDC', '#3C3452'],
  halo1: ['#F2EEDC', '#5E4C58'],
  halo2: ['#F2EEDC', '#8A6A5E'],

  // ---- Colores fijos: puerta y lobby (iguales de día y de noche) ----
  pv0: ['#1A3468', '#1A3468'],
  pv1: ['#24508F', '#24508F'],
  pv2: ['#3A6DB4', '#3A6DB4'],
  pv3: ['#6C9ED6', '#6C9ED6'],
  pl0: ['#8A4E26', '#8A4E26'],
  pl1: ['#C27A34', '#C27A34'],
  pl2: ['#F0A848', '#F0A848'],
  pm0: ['#1B212D', '#1B212D'],
  pm1: ['#2C3443', '#2C3443'],
  pm2: ['#566274', '#566274'],
  pm3: ['#8794A8', '#8794A8'],
  iw0: ['#2A150E', '#2A150E'],
  iw1: ['#43241A', '#43241A'],
  iw2: ['#6A3A24', '#6A3A24'],
  iw3: ['#8E5230', '#8E5230'],
  if0: ['#7A4A2C', '#7A4A2C'],
  if1: ['#B27A44', '#B27A44'],
  if2: ['#E2AE62', '#E2AE62'],
  if3: ['#FFD890', '#FFD890'],
  iv0: ['#1E5A38', '#1E5A38'],
  iv1: ['#2E8844', '#2E8844'],
  iv2: ['#54AE50', '#54AE50'],
} as const satisfies Record<string, Par>;

export type TokenNaos = keyof typeof TOKENS_NAOS;

/** Devuelve el color hex de cada token para el modo pedido. */
export type PaletaNaos = (token: TokenNaos) => string;

export function paletaNaos(noche: boolean): PaletaNaos {
  const i = noche ? 1 : 0;
  return (token) => TOKENS_NAOS[token][i];
}

/** Todos los colores hex que usa el modo pedido (sirve para validar el lienzo). */
export function coloresNaos(noche: boolean): string[] {
  const i = noche ? 1 : 0;
  return [...new Set(Object.values(TOKENS_NAOS).map((par) => par[i].toUpperCase()))];
}
