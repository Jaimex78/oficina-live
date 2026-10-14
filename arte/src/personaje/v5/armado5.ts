/**
 * Armado de cuadros del personaje v5: capa del cuerpo, capa de una prenda y composición con rampas de color (para revisar el arte).
 * `vista` es S, N, I o D (D es el espejo de I). `cuadro` es el índice de la hoja (0 quieto, 1 a 4 caminar, 5 sentado, 6 y 7 parpadeo).
 */

import { Lienzo, recolorearConRampas } from '../../nucleo';
import type { RampasPorSlot } from '../../nucleo';
import { ALTO, ANCHO } from './datos-disenador';
import { espejoCapa } from './disenador';
import type { Capa } from './disenador';
import { CUADRO_QUIETO_PARPADEO, CUADRO_SENTADO, CUADRO_SENTADO_PARPADEO } from './pose';
import type { Vista } from './pose';
import { ctxDe, cuerpoDesnudo } from './vestir';
import type { DefPrenda } from './prendas';

export type Vista4 = Vista | 'D';
export const base = (v: Vista4): Vista => (v === 'D' ? 'I' : v);
const espejar = (v: Vista4, c: Capa): Capa => (v === 'D' ? espejoCapa(c) : c);

/** Las prendas no cambian con el parpadeo: usan el cuadro de quieto o de sentado. */
export const cuadroSinParpadeo = (c: number): number => (c === CUADRO_QUIETO_PARPADEO ? 0 : c === CUADRO_SENTADO_PARPADEO ? CUADRO_SENTADO : c);

export function capaCuerpo(v: Vista4, cuadro: number, cara = 0): Capa {
  return espejar(v, cuerpoDesnudo(ctxDe(base(v), cuadro, cara)));
}

export function capaPrenda(def: DefPrenda, v: Vista4, cuadro: number): Capa {
  return espejar(v, def.dibujar(ctxDe(base(v), cuadroSinParpadeo(cuadro))));
}

export function lienzoDeCapas(capas: readonly Capa[], rampas: RampasPorSlot): Lienzo {
  const l = new Lienzo(ANCHO, ALTO);
  for (const c of capas) for (const [k, v] of c) l.px(k % ANCHO, Math.floor(k / ANCHO), v);
  return recolorearConRampas(l, rampas);
}
