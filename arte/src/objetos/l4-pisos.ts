/**
 * Pisos de la primera mitad del lote 3: ladrillo crema, alfombra lavanda, baldosa en damero y losa con rombos.
 *
 * Son los pisos del estilo Gather (pasillos, salas, áreas de equipo y descanso). Cada uno es un tile de 32 x 32 que
 * repite sin costuras: todo lo periódico tiene un período que divide a 32 (16 o 8), los motivos que cruzan el borde
 * se dibujan con vuelta al otro lado y no hay nada pegado a un borde que no empate con el opuesto. Es el fondo de
 * todo, así que el contraste es bajo y el ruido, cero. Los pisos no llevan contorno ni sombra.
 */

import { Lienzo } from '../nucleo';
import { pxEnvuelto, rectEnvuelto } from './l4-comun';

const LADO = 32;

/**
 * Ladrillo crema de los pasillos: ladrillos de 16 x 8 en aparejo trabado (cada hilada corrida 8 px), junta de 1 px en
 * el tono medio, brillo en el borde de arriba y una que otra pieza más oscura. Período 16 en x y 32 en y.
 */
export function pisoLadrilloCrema(): Lienzo {
  const l = new Lienzo(LADO, LADO);
  l.rect(0, 0, LADO, LADO, 'ladrillo-crema-1'); // la junta es el fondo: los ladrillos se dibujan encima
  // Qué ladrillos van más oscuros (hilada, posición): reparto que no forma diagonales ni columnas.
  const oscuros = new Set(['0,1', '1,0', '2,1', '3,0']);
  const vetas: ReadonlyArray<readonly [number, number, number, number]> = [
    // [hilada, posición, x dentro del ladrillo, largo]
    [0, 0, 4, 5],
    [1, 1, 7, 4],
    [2, 0, 3, 4],
    [3, 1, 6, 5],
  ];
  for (let hilada = 0; hilada < 4; hilada++) {
    const y = hilada * 8;
    const corrimiento = hilada % 2 === 0 ? 0 : 8;
    for (let pos = 0; pos < 2; pos++) {
      const x = corrimiento + pos * 16;
      const oscuro = oscuros.has(`${hilada},${pos}`);
      rectEnvuelto(l, x, y, 15, 7, oscuro ? 'ladrillo-crema-2' : 'ladrillo-crema-3');
      rectEnvuelto(l, x + 1, y, 13, 1, oscuro ? 'ladrillo-crema-3' : 'ladrillo-crema-4'); // brillo del borde de arriba
      rectEnvuelto(l, x, y + 6, 15, 1, oscuro ? 'ladrillo-crema-1' : 'ladrillo-crema-2'); // un tono más oscuro abajo
      for (const [h, p, dx, largo] of vetas) {
        if (h === hilada && p === pos) rectEnvuelto(l, x + dx, y + 3, largo, 1, oscuro ? 'ladrillo-crema-1' : 'ladrillo-crema-2');
      }
    }
  }
  return l;
}

/**
 * Alfombra lavanda de las salas: bandas en zigzag de 8 px que suben y bajan 8 px, en dos lavandas muy cercanas, con un
 * hilo oscuro en el borde de cada banda y un rombo claro en medio de las bandas anchas. Todo tiene período 16 o 32:
 * repite sin costura.
 */
export function pisoAlfombraLavanda(): Lienzo {
  const l = new Lienzo(LADO, LADO);
  for (let y = 0; y < LADO; y++) {
    const fase = y % 16;
    const desfase = fase < 8 ? fase : 16 - fase;
    for (let x = 0; x < LADO; x++) {
      const t = (x + desfase) % 16;
      l.px(x, y, t < 8 ? 'lavanda-3' : 'lavanda-2');
      if (t === 8) l.px(x, y, 'lavanda-1'); // el hilo oscuro que marca el borde de cada banda
    }
  }
  // Rombo claro de 5 px en el centro de cada banda ancha, a la altura de la vuelta del zigzag.
  for (const [cx, cy] of [[4, 8], [20, 8], [12, 0], [28, 0]] as const) {
    for (let dy = -2; dy <= 2; dy++) {
      const ancho = 2 - Math.abs(dy);
      for (let dx = -ancho; dx <= ancho; dx++) pxEnvuelto(l, cx + dx, cy + dy, dx === 0 && dy === 0 ? 'lavanda-1' : 'lavanda-4');
    }
  }
  return l;
}

/**
 * Baldosa gris azulada en damero: losetas de 16 x 16 que alternan dos grises muy cercanos. Cada loseta lleva su bisel
 * (un tono más claro arriba y a la izquierda, uno más oscuro abajo y a la derecha) y un brillo corto. Período 32.
 */
export function pisoBaldosaAjedrez(): Lienzo {
  const l = new Lienzo(LADO, LADO);
  for (let ty = 0; ty < 2; ty++) {
    for (let tx = 0; tx < 2; tx++) {
      const clara = (tx + ty) % 2 === 0;
      const x = tx * 16;
      const y = ty * 16;
      const cuerpo = clara ? 'baldosa-gris-4' : 'baldosa-gris-3';
      const luz = clara ? 'neutro-7' : 'baldosa-gris-4';
      const sombra = clara ? 'baldosa-gris-3' : 'baldosa-gris-2';
      l.rect(x, y, 16, 16, cuerpo);
      l.rect(x, y, 16, 1, luz);
      l.rect(x, y, 1, 16, luz);
      l.rect(x + 1, y + 15, 15, 1, sombra);
      l.rect(x + 15, y + 1, 1, 14, sombra);
      // Brillos cortos: distintos en cada loseta para que no se vea la repetición cada 16 px.
      const brillos = clara ? [[4, 4, 3]] : [[9, 6, 3]];
      for (const [bx, by, largo] of brillos) l.rect(x + (bx as number), y + (by as number), largo as number, 1, luz);
    }
  }
  return l;
}

/**
 * Losa clara con rombos (la de las áreas de descanso): una celosía de rombos de 16 px formada por líneas a 45 grados,
 * con luz pegada a cada línea y un rombo menor más oscuro al centro de cada uno. Todo es periódico con período 16.
 */
export function pisoLosaRombos(): Lienzo {
  const l = new Lienzo(LADO, LADO);
  for (let y = 0; y < LADO; y++) {
    for (let x = 0; x < LADO; x++) {
      const d1 = (x + y) % 16;
      const d2 = (x - y + 32) % 16;
      const u = Math.min(d1, 16 - d1); // distancia a la línea de una diagonal
      const v = Math.min(d2, 16 - d2); // distancia a la línea de la otra
      const borde = Math.min(u, v);
      let c: string = 'baldosa-3';
      if (borde === 0) c = 'baldosa-1'; // la línea de la celosía
      else if (borde === 1) c = 'neutro-7'; // luz pegada a la línea
      if (u >= 5 && v >= 5) c = 'baldosa-2'; // centro del rombo
      l.px(x, y, c);
    }
  }
  return l;
}
