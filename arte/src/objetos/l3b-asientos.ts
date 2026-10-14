/**
 * Silla tallada del lote 3B: respaldo alto de nogal con un medallón tallado y cojín de tela.
 *
 * El cojín se dibuja con `tela-gris` y de ahí salen las variantes `rojo`, `azul` y `verde`. La madera no cambia.
 * Medida 32 x 40: el respaldo sube por el 8 que sobresale. En `S` quien se sienta mira hacia abajo (respaldo arriba);
 * en `N` mira hacia arriba y se ve la espalda del respaldo; en `E` y `O` se ve de lado.
 */

import { Lienzo } from '../nucleo';
import { cuerpoBlando, poste, registrar, terminar, TG, W } from './l3b-comun';
import type { Cuadros, Tres } from './l3b-comun';

const MADERA: Tres = [W(1), W(2), W(3)];
const TELA: Tres = [TG(1), TG(2), TG(3)];

/** Cojín del asiento con una cenefa de rombos pequeños. */
function cojin(l: Lienzo, x: number, y: number, ancho: number): void {
  cuerpoBlando(l, x, y, ancho, 7, 3, TELA);
  for (let i = x + 3; i < x + ancho - 3; i += 2) l.px(i, y + 3 + ((i - x) % 4 === 3 ? 0 : 1), (i - x) % 4 === 3 ? TG(3) : TG(1));
  l.rect(x + 2, y + 6, ancho - 4, 1, TG(1));
}

/** Remates en forma de bola sobre los postes del respaldo. */
function remate(l: Lienzo, x: number, y: number): void {
  l.rect(x, y, 3, 2, W(4));
  l.px(x, y, null).px(x + 2, y, null);
  l.px(x + 1, y + 1, W(3));
}

function sillaS(): Lienzo {
  const l = new Lienzo(32, 40);
  // Patas traseras, cortas y oscuras, detrás del asiento.
  l.rect(11, 31, 2, 3, W(1)).rect(19, 31, 2, 3, W(1));
  // Patas delanteras y travesaño.
  poste(l, 8, 31, 6, 3, MADERA);
  poste(l, 21, 31, 6, 3, MADERA);
  l.rect(11, 34, 10, 1, W(1));
  // Postes del respaldo.
  poste(l, 8, 3, 20, 3, MADERA);
  poste(l, 21, 3, 20, 3, MADERA);
  remate(l, 8, 1);
  remate(l, 21, 1);
  // Travesaño alto con cresta en arco.
  l.rect(11, 4, 10, 5, W(2));
  l.rect(13, 2, 6, 3, W(2));
  l.rect(14, 1, 4, 1, W(3));
  l.rect(11, 3, 2, 1, W(3));
  l.rect(19, 3, 2, 1, W(3));
  l.rect(13, 2, 6, 1, W(3));
  l.rect(11, 4, 10, 1, W(3));
  l.rect(11, 8, 10, 1, W(1));
  l.px(15, 6, W(1)).px(16, 6, W(1)).px(13, 6, W(3)).px(18, 6, W(3));
  // Panel del respaldo: tela tensada con un medallón tallado (una carita).
  l.rect(11, 9, 10, 13, TG(1));
  l.rect(11, 9, 10, 1, TG(2));
  l.rect(11, 9, 1, 13, TG(2));
  l.rect(20, 10, 1, 12, TG(0));
  l.elipse(15.5, 14, 3, 4, W(3));
  l.elipse(15.5, 14, 2, 3, W(2));
  l.px(14, 13, W(0)).px(17, 13, W(0));
  l.rect(15, 16, 2, 1, W(1));
  l.px(14, 11, W(4)).px(15, 11, W(4));
  // Travesaño bajo el respaldo y asiento.
  l.rect(9, 22, 14, 1, W(2));
  cojin(l, 7, 22, 18);
  l.rect(7, 29, 18, 3, W(2));
  l.rect(7, 29, 18, 1, W(3));
  l.rect(7, 31, 18, 1, W(1));
  l.px(12, 30, W(3)).px(19, 30, W(3));
  return terminar(l);
}

function sillaN(): Lienzo {
  const l = new Lienzo(32, 40);
  // Patas: las delanteras (junto a quien mira) llegan más abajo.
  l.rect(11, 31, 2, 3, W(1)).rect(19, 31, 2, 3, W(1));
  poste(l, 8, 31, 6, 3, MADERA);
  poste(l, 21, 31, 6, 3, MADERA);
  l.rect(11, 34, 10, 1, W(1));
  // Asiento: solo asoma el borde trasero del cojín bajo el respaldo.
  cuerpoBlando(l, 7, 26, 18, 6, 2, TELA);
  // Respaldo visto de espaldas: marco y tablero liso con travesaños.
  poste(l, 8, 3, 25, 3, MADERA);
  poste(l, 21, 3, 25, 3, MADERA);
  remate(l, 8, 1);
  remate(l, 21, 1);
  l.rect(11, 4, 10, 24, W(2));
  l.rect(13, 2, 6, 3, W(2));
  l.rect(14, 1, 4, 1, W(3));
  l.rect(13, 2, 6, 1, W(3));
  l.rect(11, 3, 2, 1, W(3));
  l.rect(19, 3, 2, 1, W(3));
  l.rect(11, 4, 10, 1, W(3));
  l.rect(11, 9, 10, 1, W(1));
  l.rect(11, 18, 10, 1, W(1));
  l.rect(11, 27, 10, 1, W(1));
  l.rect(11, 10, 1, 17, W(3));
  l.rect(20, 10, 1, 17, W(1));
  l.elipse(15.5, 14, 2, 3, W(3));
  l.px(15, 13, W(4));
  l.rect(8, 25, 16, 2, W(2));
  l.rect(8, 26, 16, 1, W(1));
  return terminar(l);
}

/** De lado: el respaldo queda atrás (oeste para `E`, este para `O`) y las patas delanteras al otro extremo. */
function sillaLado(frente: 'E' | 'O'): Lienzo {
  const l = new Lienzo(32, 40);
  const X = (x: number, ancho: number): number => (frente === 'E' ? x : 32 - x - ancho);
  // Patas: la de atrás es la continuación del poste del respaldo.
  poste(l, X(21, 3), 31, 6, 3, MADERA);
  poste(l, X(9, 3), 3, 34, 3, MADERA);
  l.rect(X(12, 9), 34, 9, 1, W(1));
  // Remate y cresta del respaldo.
  remate(l, X(9, 3), 1);
  // Cojín y bastidor del asiento.
  cojin(l, X(9, 17), 22, 17);
  l.rect(X(9, 17), 29, 17, 3, W(2));
  l.rect(X(9, 17), 29, 17, 1, W(3));
  l.rect(X(9, 17), 31, 17, 1, W(1));
  // Respaldo de lado: tablero delgado con tela y el medallón de canto.
  const xr = X(11, 2);
  l.rect(xr, 5, 2, 17, TG(2));
  l.rect(xr, 5, 1, 17, TG(3));
  l.rect(xr + 1, 5, 1, 17, TG(1));
  l.px(X(9, 3), 12, W(4)).px(X(9, 3), 17, W(4)).px(X(9, 3), 22, W(4));
  return terminar(l);
}

export function cuadrosSillaTallada(): Cuadros {
  const c: Cuadros = new Map();
  registrar(c, 'silla-tallada', 'S', sillaS(), 'tela-gris');
  registrar(c, 'silla-tallada', 'N', sillaN(), 'tela-gris');
  registrar(c, 'silla-tallada', 'E', sillaLado('E'), 'tela-gris');
  registrar(c, 'silla-tallada', 'O', sillaLado('O'), 'tela-gris');
  return c;
}
