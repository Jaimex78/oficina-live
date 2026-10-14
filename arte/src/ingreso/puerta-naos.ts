/**
 * Sprites de la puerta de vidrio de Naos: dos hojas y el hueco del lobby.
 *
 * Usan solo colores fijos de la paleta de la escena (los mismos de día y de
 * noche) para que encajen en las dos versiones. El código del juego anima la
 * puerta: pone `interior` en el hueco y desliza o abre las hojas encima.
 */

import { Lienzo } from '../nucleo';
import { paletaNaos } from './paleta-naos';

export const HOJA_ANCHO = 20;
export const HOJA_ALTO = 58;
export const INTERIOR_ANCHO = 40;
export const INTERIOR_ALTO = 58;

function azar(a: number, b: number, c = 0): number {
  let h = Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263) + Math.imul(c | 0, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** Hoja izquierda: el borde de adentro (el que se junta con la otra hoja) queda a la derecha. */
function hojaIzquierda(): Lienzo {
  const k = paletaNaos(false);
  const l = new Lienzo(HOJA_ANCHO, HOJA_ALTO);
  l.rect(0, 0, HOJA_ANCHO, HOJA_ALTO, k('pm1'));
  // Vidrio: azul con destellos diagonales arriba y el lobby cálido visto abajo.
  for (let y = 3; y < 50; y++) {
    for (let x = 2; x < HOJA_ANCHO - 2; x++) {
      let t: 'pv0' | 'pv1' | 'pv2' | 'pv3' | 'pl0' | 'pl1' | 'pl2' = 'pv1';
      if (y < 30) {
        const d = (x + y) % 15;
        if (y < 5) t = 'pv0';
        else if (d < 2) t = 'pv3';
        else if (d < 5) t = 'pv2';
      } else if (y < 34) {
        t = (x + y) % 2 === 0 ? 'pv1' : 'pl0';
      } else {
        t = azar(x, y, 3) > 0.92 ? 'pl2' : y > 44 ? 'pl1' : 'pl0';
      }
      l.px(x, y, k(t));
    }
  }
  // Marco: luz arriba y a la izquierda, sombra abajo y a la derecha.
  l.rect(0, 0, HOJA_ANCHO, 1, k('pm3'));
  l.rect(0, 0, 1, HOJA_ALTO, k('pm2'));
  l.rect(1, 1, HOJA_ANCHO - 2, 1, k('pm2'));
  l.rect(HOJA_ANCHO - 1, 0, 1, HOJA_ALTO, k('pm0'));
  l.rect(2, 2, HOJA_ANCHO - 4, 1, k('pm0'));
  l.rect(1, 49, HOJA_ANCHO - 2, 1, k('pm0'));
  // Zócalo de acero.
  l.rect(1, 50, HOJA_ANCHO - 2, 8, k('pm2'));
  l.rect(1, 50, HOJA_ANCHO - 2, 1, k('pm3'));
  l.rect(1, 57, HOJA_ANCHO - 1, 1, k('pm0'));
  l.rect(4, 53, HOJA_ANCHO - 8, 1, k('pm1'));
  // Manija vertical junto al borde de adentro.
  l.rect(14, 20, 2, 20, k('pm3'));
  l.rect(15, 20, 1, 20, k('pm1'));
  l.rect(13, 22, 1, 1, k('pm0'));
  l.rect(13, 37, 1, 1, k('pm0'));
  return l;
}

export function hojaPuerta(lado: 'izq' | 'der'): Lienzo {
  const izq = hojaIzquierda();
  return lado === 'izq' ? izq : izq.voltearH();
}

/** Lo que se ve al abrir la puerta: un lobby cálido y oscuro. */
export function interiorLobby(): Lienzo {
  const k = paletaNaos(false);
  const l = new Lienzo(INTERIOR_ANCHO, INTERIOR_ALTO);
  // Muro de listones de madera.
  l.rect(0, 0, INTERIOR_ANCHO, 44, k('iw1'));
  for (let x = 1; x < INTERIOR_ANCHO; x += 4) l.rect(x, 6, 1, 38, k('iw0'));
  // Techo con dos luminarias y su luz sobre el muro.
  l.rect(0, 0, INTERIOR_ANCHO, 6, k('iw0'));
  for (const cx of [10, 30]) {
    l.rect(cx - 4, 4, 9, 2, k('if2'));
    l.rect(cx - 2, 4, 5, 1, k('if3'));
    for (let y = 6; y < 22; y++) {
      const ancho = 4 + Math.floor((y - 6) / 2);
      for (let x = cx - ancho; x <= cx + ancho; x++) {
        if (x < 0 || x >= INTERIOR_ANCHO) continue;
        if ((x + y) % 2 === 0 && y < 16) l.px(x, y, k('iw3'));
        else if ((x + y) % 2 === 0) l.px(x, y, k('iw2'));
      }
    }
  }
  // Ascensor al fondo.
  l.rect(14, 12, 12, 32, k('pm1'));
  l.rect(15, 13, 10, 31, k('pm2'));
  l.rect(19, 13, 2, 31, k('pm0'));
  l.rect(15, 13, 1, 31, k('pm3'));
  l.rect(20, 13, 1, 31, k('pm1'));
  l.rect(17, 9, 6, 2, k('pm0'));
  l.rect(19, 9, 2, 2, k('pl2'));
  // Planta alta en maceta, a la izquierda.
  l.rect(2, 36, 8, 8, k('iw3'));
  l.rect(2, 36, 8, 1, k('if1'));
  l.rect(2, 43, 8, 1, k('iw0'));
  l.rect(5, 26, 2, 10, k('iw0'));
  l.elipseSombreada(6, 24, 4.5, 8, [k('iv0'), k('iv1'), k('iv2'), k('iv2')]);
  // Mostrador de recepción a la derecha, con una lámpara.
  l.rect(28, 30, 12, 14, k('iw2'));
  l.rect(28, 30, 12, 2, k('if2'));
  l.rect(28, 32, 12, 1, k('iw0'));
  l.rect(28, 43, 12, 1, k('iw0'));
  for (let x = 30; x < 39; x += 3) l.rect(x, 34, 1, 8, k('iw1'));
  l.rect(36, 27, 1, 3, k('pm1'));
  l.rect(35, 25, 3, 2, k('pl2'));
  // Piso pulido que refleja las luces.
  l.rect(0, 44, INTERIOR_ANCHO, 14, k('if1'));
  l.rect(0, 44, INTERIOR_ANCHO, 2, k('if0'));
  l.rect(0, 50, INTERIOR_ANCHO, 1, k('if0'));
  l.rect(0, 55, INTERIOR_ANCHO, 1, k('if0'));
  for (const cx of [10, 30, 20]) {
    for (let y = 46; y < 58; y++) {
      const ancho = cx === 20 ? 1 : 2;
      l.rect(cx - ancho, y, ancho * 2 + 1, 1, k(y < 50 ? 'if2' : 'if3'));
    }
  }
  for (let y = 56; y < 58; y++) l.rect(0, y, INTERIOR_ANCHO, 1, k('if2'));
  return l;
}
