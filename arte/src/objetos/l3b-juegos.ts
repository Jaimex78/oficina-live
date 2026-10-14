/**
 * Máquina arcade del lote 3B: gabinete alto con marquesina, pantalla verde, panel de mando y puerta de monedas.
 *
 * Variantes `base` (gris con franjas verdes), `azul` y `rojo`: cada una cambia el gabinete y sus franjas, no la
 * pantalla. La pantalla usa los tonos más claros y saturados (verde `planta-4`, celeste `vidrio-3`) para que se lea
 * encendida de noche: el resplandor verde lo pone el motor. Medida 32 x 56. Orientaciones `S` (de frente) y `E`.
 */

import { Lienzo } from '../nucleo';
import { poligono } from './l2b-comun';
import { AZ, MO, NA, NE, PL, TC, VI, registrarVariantes, terminar } from './l3b-comun';
import type { Cuadros, Tres } from './l3b-comun';

interface Tema {
  /** Gabinete: sombra, medio y luz. */
  cuerpo: Tres;
  /** Franjas laterales: sombra, medio y luz. */
  franja: Tres;
}

const TEMAS: Readonly<Record<string, Tema>> = {
  base: { cuerpo: ['tela-gris-0', 'tela-gris-1', 'tela-gris-2'], franja: [PL(1), PL(2), PL(3)] },
  azul: { cuerpo: [AZ(1), AZ(2), AZ(3)], franja: [VI(0), VI(1), VI(2)] },
  rojo: { cuerpo: ['rojo-0', 'rojo-1', 'rojo-2'], franja: [TC(1), TC(2), TC(3)] },
};

/** Escena del juego: nave abajo, tres filas de invasores y estrellas. Es la parte que emite luz. */
function pantallaJuego(l: Lienzo, x: number, y: number): void {
  l.rect(x, y, 16, 15, AZ(1));
  l.rect(x, y, 16, 1, VI(0));
  l.rect(x, y, 1, 15, VI(0));
  for (const [dx, dy] of [[3, 3], [12, 5], [7, 10], [14, 11], [1, 8]] as const) l.px(x + dx, y + dy, VI(3));
  // Marcador.
  l.rect(x + 2, y + 1, 4, 1, 'tela-calida-3');
  l.rect(x + 10, y + 1, 3, 1, 'tela-calida-3');
  // Invasores.
  for (let fila = 0; fila < 3; fila++) {
    for (let col = 0; col < 4; col++) {
      const px = x + 2 + col * 3 + (fila % 2);
      const py = y + 4 + fila * 3;
      l.rect(px, py, 2, 1, fila === 1 ? VI(3) : PL(4));
      l.px(px, py + 1, fila === 1 ? VI(3) : PL(4));
    }
  }
  // Nave y disparo.
  l.rect(x + 6, y + 12, 4, 2, 'neutro-7');
  l.px(x + 7, y + 11, 'neutro-7').px(x + 8, y + 11, 'neutro-7');
  l.px(x + 7, y + 8, TC(3));
}

function arcadeS(t: Tema): Lienzo {
  const l = new Lienzo(32, 56);
  const [osc, med, luz] = t.cuerpo;
  // Gabinete.
  l.rect(3, 1, 26, 52, med);
  l.rect(3, 1, 1, 52, luz);
  l.rect(28, 2, 1, 51, osc);
  // Marquesina iluminada con franjas de colores.
  l.rect(5, 2, 22, 8, MO(2));
  l.rect(5, 2, 22, 1, MO(4));
  l.rect(5, 9, 22, 1, MO(0));
  l.rect(7, 4, 4, 4, TC(3));
  l.rect(12, 4, 3, 4, NA(3));
  l.rect(16, 4, 5, 4, TC(3));
  l.rect(22, 4, 3, 4, VI(2));
  l.rect(7, 4, 4, 1, 'neutro-7');
  l.rect(16, 4, 5, 1, 'neutro-7');
  // Franjas laterales.
  l.rect(3, 10, 2, 39, t.franja[1]);
  l.rect(3, 10, 1, 39, t.franja[2]);
  l.rect(27, 10, 2, 39, t.franja[1]);
  l.rect(28, 10, 1, 39, t.franja[0]);
  // Marco y pantalla.
  l.rect(6, 10, 20, 19, 'neutro-1');
  l.rect(6, 10, 20, 1, 'neutro-3');
  l.rect(8, 12, 16, 15, AZ(1));
  pantallaJuego(l, 8, 12);
  // Panel de mando inclinado: cara superior clara y frente morado.
  l.rect(5, 29, 22, 3, MO(3));
  l.rect(5, 29, 22, 1, MO(4));
  l.rect(5, 32, 22, 4, MO(2));
  l.rect(5, 35, 22, 1, MO(0));
  l.rect(26, 32, 1, 3, MO(1));
  // Palanca (bola roja) y botones de colores.
  l.rect(8, 31, 4, 1, NE(1));
  l.rect(9, 29, 2, 3, NE(2));
  l.elipse(9.5, 29, 1.5, 1.5, 'rojo-3');
  l.px(9, 28, 'rojo-4');
  for (const [x, c] of [[16, TC(3)], [19, 'rojo-3'], [22, VI(2)]] as const) {
    l.rect(x, 30, 2, 2, c);
    l.px(x, 30, 'neutro-7');
  }
  l.rect(16, 33, 2, 1, NE(5));
  l.rect(19, 33, 2, 1, NE(5));
  // Parte baja: puerta de monedas roja con dos ranuras, y zócalo.
  l.rect(5, 36, 22, 1, osc);
  l.rect(10, 38, 12, 8, 'rojo-2');
  l.rect(10, 38, 12, 1, 'rojo-3');
  l.rect(10, 38, 1, 8, 'rojo-3');
  l.rect(21, 39, 1, 7, 'rojo-1');
  l.rect(10, 45, 12, 1, 'rojo-1');
  l.rect(13, 40, 2, 3, NE(1));
  l.rect(17, 40, 2, 3, NE(1));
  l.rect(13, 44, 2, 1, TC(3));
  l.rect(17, 44, 2, 1, TC(3));
  l.rect(4, 47, 24, 6, osc);
  l.rect(4, 47, 24, 1, med);
  l.rect(7, 49, 18, 1, med);
  return terminar(l);
}

/** De lado: la marquesina sobresale al frente, la pantalla se inclina, el panel de mando asoma y atrás está el arte lateral. */
function arcadeE(t: Tema): Lienzo {
  const l = new Lienzo(32, 56);
  const [osc, med, luz] = t.cuerpo;
  // Casco trasero y frente.
  l.rect(4, 1, 18, 52, med);
  l.rect(4, 1, 1, 52, luz);
  l.rect(21, 2, 1, 51, osc);
  l.rect(21, 10, 4, 19, 'neutro-1');
  l.rect(21, 10, 4, 1, 'neutro-3');
  l.rect(21, 30, 4, 22, osc);
  l.rect(21, 30, 1, 22, med);
  // Marquesina que sobresale.
  l.rect(4, 1, 24, 9, MO(2));
  l.rect(4, 1, 24, 1, MO(4));
  l.rect(4, 1, 1, 9, MO(3));
  l.rect(4, 9, 24, 1, MO(0));
  l.rect(26, 2, 2, 7, MO(1));
  l.rect(22, 3, 4, 5, TC(3));
  l.rect(22, 3, 4, 1, 'neutro-7');
  // Pantalla vista de canto: una línea de luz verde.
  l.rect(23, 12, 2, 15, AZ(1));
  l.rect(24, 12, 1, 15, PL(4));
  // Panel de mando que asoma, con la palanca.
  l.rect(21, 28, 8, 3, MO(3));
  l.rect(21, 28, 8, 1, MO(4));
  l.rect(21, 31, 8, 3, MO(2));
  l.rect(21, 33, 8, 1, MO(0));
  l.rect(27, 25, 2, 4, NE(2));
  l.elipse(27.5, 25, 1.5, 1.5, 'rojo-3');
  l.rect(23, 28, 2, 2, TC(3));
  // Puerta de monedas, solo se ve su borde.
  l.rect(24, 38, 2, 8, 'rojo-2');
  l.rect(24, 38, 1, 8, 'rojo-3');
  // Zócalo.
  l.rect(4, 47, 22, 6, osc);
  l.rect(4, 47, 22, 1, med);
  // Arte lateral: panel con franja, un rayo y estrellas.
  l.rect(6, 12, 14, 34, t.franja[1]);
  l.rect(6, 12, 14, 1, t.franja[2]);
  l.rect(6, 12, 1, 34, t.franja[2]);
  l.rect(19, 13, 1, 33, t.franja[0]);
  l.rect(6, 45, 14, 1, t.franja[0]);
  l.rect(8, 14, 10, 30, MO(1));
  l.rect(8, 14, 10, 1, MO(2));
  l.rect(8, 14, 1, 30, MO(2));
  poligono(l, [[14, 17], [10, 29], [13, 29], [11, 40], [17, 26], [14, 26], [16, 17]], TC(3));
  poligono(l, [[14, 17], [10, 29], [12, 29], [14, 20]], 'neutro-7');
  l.px(16, 19, 'neutro-7').px(10, 21, 'neutro-7').px(16, 36, 'neutro-7').px(11, 42, TC(3));
  return terminar(l);
}

export function cuadrosArcade(): Cuadros {
  const c: Cuadros = new Map();
  registrarVariantes(c, 'maquina-arcade', 'S', Object.fromEntries(Object.entries(TEMAS).map(([n, t]) => [n, arcadeS(t)])));
  registrarVariantes(c, 'maquina-arcade', 'E', Object.fromEntries(Object.entries(TEMAS).map(([n, t]) => [n, arcadeE(t)])));
  return c;
}
