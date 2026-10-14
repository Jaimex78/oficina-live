/**
 * Cerca baja del lote 2B (`cerca`, autotile de 16 máscaras de vecinos N, E, S, O).
 *
 * Sigue la geometría de paredes del lote 1, pero más baja y calada: un cuadro de 32 x 40 anclado abajo (la fila 39 es
 * el borde sur de la casilla). Una cerca de tablillas es un "más" delgado centrado en x = 16:
 *
 *   filas 0 a 7     tallo hacia el norte (si hay vecino al norte), columnas 14 a 17
 *   filas 8 a 11    remate del poste del centro (si no hay vecino al norte)
 *   filas 11 a 38   tablillas de 3 px con 1 px de hueco (se ve a través) y dos travesaños detrás
 *   filas 12 a 39   tallo hacia el sur (si hay vecino al sur), o el frente del poste si la cerca termina ahí
 *
 * Las tablillas repiten cada 4 px y encajan entre casillas vecinas. La pieza del sur sigue el tallo en sus filas 0 a 7,
 * que caen sobre las filas 32 a 39 de ésta: ambas pintan el mismo tallo. Lleva `madera-clara` como rampa base; las
 * variantes `blanco` y `negro` salen de recolorearla. Sin contorno tonal (taparía los huecos): el sombreado va en las
 * propias tablillas y una sombra de 1 px abajo y a la derecha.
 */

import { Lienzo } from '../nucleo';
import { MASCARAS_PARED } from '@ol/shared';
import { construirCategoria, registrar } from './l2b-comun';
import type { Constructores, Cuadros } from './l2b-comun';

const ALTO_BASE = 39;

/** Tallo de 4 px de ancho (luz, medio, medio, sombra) entre las filas `y0` y `y1`. */
function tallo(l: Lienzo, y0: number, y1: number): void {
  const alto = y1 - y0 + 1;
  l.rect(14, y0, 1, alto, 'madera-clara-4');
  l.rect(15, y0, 2, alto, 'madera-clara-3');
  l.rect(17, y0, 1, alto, 'madera-clara-2');
}

/** Dibuja una pieza de cerca para una máscara de vecinos como `0101` (N, E, S, O). */
export function dibujarCerca(mascara: string): Lienzo {
  const l = new Lienzo(32, 40);
  const [n, e, s, o] = [...mascara].map((c) => c === '1');
  const horizontal = e === true || o === true;
  const xa = o ? 0 : 13;
  const xb = e ? 31 : 18;

  if (horizontal) {
    // Travesaños detrás de las tablillas.
    for (const y of [19, 29]) {
      l.rect(xa, y, xb - xa + 1, 1, 'madera-clara-3');
      l.rect(xa, y + 1, xb - xa + 1, 1, 'madera-clara-1');
    }
    // Tablillas de 3 px con hueco de 1: luz, medio y sombra; punta en la del centro.
    for (let x = xa; x <= xb; x++) {
      const k = x % 4;
      if (k === 3) continue;
      const tono = k === 0 ? 'madera-clara-4' : k === 1 ? 'madera-clara-3' : 'madera-clara-2';
      const arriba = k === 1 ? 11 : 12;
      l.rect(x, arriba, 1, ALTO_BASE - arriba, tono);
      l.px(x, ALTO_BASE - 1, 'madera-clara-1');
    }
  }
  // Tallos hacia el norte y el sur, o poste del centro.
  if (n) tallo(l, 0, 11);
  if (s) tallo(l, 12, ALTO_BASE);
  else {
    // Poste del centro: cuerpo con luz a la izquierda y sombra a la derecha, y la base más oscura.
    l.rect(14, 12, 1, 27, 'madera-clara-4');
    l.rect(15, 12, 2, 27, 'madera-clara-3');
    l.rect(17, 12, 1, 27, 'madera-clara-2');
    l.rect(14, ALTO_BASE - 1, 4, 1, 'madera-clara-1');
  }
  if (!n) {
    // Remate: bloque un poco más ancho que el poste con su luz.
    l.rect(13, 9, 6, 3, 'madera-clara-3');
    l.rect(13, 9, 6, 1, 'madera-clara-4');
    l.rect(13, 9, 1, 3, 'madera-clara-4');
    l.rect(18, 10, 1, 2, 'madera-clara-2');
    l.rect(14, 8, 4, 1, 'madera-clara-4');
    l.rect(13, 11, 6, 1, 'madera-clara-2');
  }
  l.sombraProyectada('azul-oficina-2', 1, 1);
  return l;
}

const CONSTRUCTORES: Constructores = {
  cerca: (c) => {
    for (const mascara of MASCARAS_PARED) registrar(c, 'cerca', mascara, dibujarCerca(mascara), 'madera-clara');
  },
};

/** Todos los cuadros de la cerca: 16 máscaras por 3 variantes. */
export function cuadrosCerca(): Cuadros {
  return construirCategoria(CONSTRUCTORES);
}
