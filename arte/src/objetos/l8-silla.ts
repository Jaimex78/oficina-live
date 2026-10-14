/**
 * Lote 8, silla de oficina de Gather: gris, de respaldo redondeado con malla, brazos laterales y base de cinco patas
 * con ruedas visibles. Mide 24 x 22 px dentro de la casilla de 32 (columnas 4 a 27, filas 5 a 26).
 *
 * Orientación = hacia dónde mira QUIEN SE SIENTA (contrato de `GUIA-OBJETOS.md`):
 *  - `N`: mira al norte, el respaldo queda abajo y se ve la espalda de la silla (la que está al sur de un escritorio).
 *  - `S`: mira al sur, se ve el frente: el asiento, los brazos y el respaldo detrás.
 *  - `E` y `O`: de lado.
 * Todo se dibuja con la rampa `tela-gris` (4 tonos) y el contorno azul marino, así que las variantes salen de recolorear
 * (`rojo`, `negro`, `blanco`).
 */

import { Lienzo } from '../nucleo';
import type { ColorEntrada } from '../nucleo';
import { TG, cerrarSuelo, registrar } from './l8-comun';
import type { Cuadros } from './l8-comun';

const OSC = TG(0);
const BASE = TG(1);
const MEDIO = TG(2);
const LUZ = TG(3);
const RUEDA_BRILLO: ColorEntrada = 'neutro-5';

/** Base de la silla vista desde atrás o de frente: columna, barra y tres ruedas de 3 x 3 con un brillo. */
function baseEstrella(l: Lienzo, frente: boolean): void {
  l.rect(15, 21, 2, 2, OSC);
  l.px(15, 21, MEDIO);
  l.rect(9, 23, 14, 1, OSC);
  l.rect(15, 23, 2, 1, MEDIO);
  for (const x of [8, 21]) {
    l.rect(x, 23, 3, 3, OSC);
    l.px(x, 23, RUEDA_BRILLO);
    l.px(x + 1, 24, MEDIO);
  }
  const yc = frente ? 25 : 24;
  l.rect(15, yc, 2, 2, OSC);
  l.px(15, yc, RUEDA_BRILLO);
}

function brazos(l: Lienzo, y: number, alto: number): void {
  for (const x of [4, 25]) {
    l.rect(x, y, 3, alto, BASE);
    l.rect(x, y, 3, 1, LUZ);
    l.rect(x, y + 1, 1, alto - 1, MEDIO);
    l.rect(x + 2, y + 2, 1, alto - 2, OSC);
    l.rect(x + 1, y + alto, 2, 1, OSC);
  }
}

/** Respaldo con malla: rectángulo redondeado con un panel de cuadritos y una equis. */
function respaldoConMalla(l: Lienzo, y: number, alto: number): void {
  l.rectRedondeado(7, y, 18, alto, 4, BASE);
  // Arista de luz arriba y a la izquierda, sombra abajo y a la derecha.
  l.rect(10, y, 12, 1, MEDIO);
  l.rect(8, y + 2, 1, alto - 5, MEDIO);
  l.rect(9, y + 1, 2, 1, MEDIO);
  l.rect(11, y, 5, 1, LUZ);
  l.rect(9, y + 1, 1, 1, LUZ);
  l.rect(24, y + 3, 1, alto - 5, OSC);
  l.rect(9, y + alto - 1, 14, 1, OSC);
  // Panel de malla: fondo oscuro, cuadritos y una equis.
  const px = 10;
  const py = y + 3;
  const pw = 12;
  const ph = alto - 7;
  l.rect(px, py, pw, ph, OSC);
  for (let j = 0; j < ph; j++) for (let i = 0; i < pw; i++) if ((i + j) % 2 === 0) l.px(px + i, py + j, BASE);
  for (let k = 0; k < ph; k++) {
    const a = Math.round((k * (pw - 1)) / (ph - 1));
    l.px(px + a, py + k, MEDIO);
    l.px(px + pw - 1 - a, py + k, MEDIO);
  }
  // Barra lumbar debajo de la malla.
  l.rect(10, py + ph + 1, 12, 1, MEDIO);
}

function sillaEspalda(): Lienzo {
  const l = new Lienzo(32, 32);
  baseEstrella(l, false);
  // Asiento: se asoma debajo del respaldo.
  l.rectRedondeado(8, 17, 16, 5, 2, BASE);
  l.rect(9, 21, 14, 1, OSC);
  brazos(l, 9, 9);
  respaldoConMalla(l, 5, 14);
  return cerrarSuelo(l);
}

function sillaFrente(): Lienzo {
  const l = new Lienzo(32, 32);
  baseEstrella(l, true);
  // Respaldo visto por dentro: se ve la parte de arriba, más clara, y una costura central.
  l.rectRedondeado(8, 5, 16, 9, 4, MEDIO);
  l.rect(11, 5, 8, 1, LUZ);
  l.rect(9, 6, 1, 3, LUZ);
  l.rect(23, 7, 1, 6, BASE);
  l.rect(15, 7, 2, 6, BASE);
  // Asiento acolchado visto desde arriba, con el frente en sombra.
  l.rectRedondeado(7, 12, 18, 10, 4, MEDIO);
  l.rect(9, 12, 14, 1, LUZ);
  l.rect(8, 13, 1, 5, LUZ);
  l.rect(9, 13, 14, 6, MEDIO);
  l.rect(9, 13, 14, 1, LUZ);
  l.rect(8, 19, 16, 3, BASE);
  l.rect(9, 21, 14, 1, OSC);
  l.rect(24, 15, 1, 6, OSC);
  l.rect(15, 15, 2, 3, BASE);
  brazos(l, 8, 10);
  return cerrarSuelo(l);
}

function sillaLado(lado: 'E' | 'O'): Lienzo {
  const l = new Lienzo(32, 32);
  // Todo se piensa mirando al este (respaldo a la izquierda, asiento hacia la derecha). Para `O` se espeja la posición
  // de cada pieza, pero la luz sigue entrando por la izquierda: la columna clara va siempre a la izquierda de la pieza
  // en pantalla y la oscura a la derecha.
  const sx = (x: number, w: number): number => (lado === 'E' ? x : 32 - x - w);
  const pieza = (x: number, y: number, w: number, h: number, c: ColorEntrada, luz?: ColorEntrada, sombra?: ColorEntrada): void => {
    const px = sx(x, w);
    l.rect(px, y, w, h, c);
    if (luz !== undefined) l.rect(px, y, 1, h, luz);
    if (sombra !== undefined) l.rect(px + w - 1, y, 1, h, sombra);
  };
  // Columna y base con tres ruedas.
  pieza(14, 21, 3, 2, OSC);
  pieza(8, 23, 15, 1, OSC);
  for (const x of [7, 14, 22]) {
    pieza(x, 24, 2, 2, OSC);
    l.px(sx(x, 2), 24, RUEDA_BRILLO);
  }
  // Asiento.
  pieza(8, 16, 17, 6, BASE, MEDIO, OSC);
  pieza(9, 16, 15, 1, LUZ);
  pieza(9, 21, 15, 1, OSC);
  // Respaldo: tablón vertical con la malla de perfil.
  pieza(6, 5, 6, 16, BASE, MEDIO, OSC);
  pieza(7, 5, 4, 1, LUZ);
  pieza(8, 8, 2, 11, OSC);
  for (let y = 9; y < 18; y += 2) pieza(8, y, 2, 1, BASE);
  // Brazo.
  pieza(12, 12, 10, 3, MEDIO, LUZ, BASE);
  pieza(12, 14, 10, 1, OSC);
  pieza(12, 14, 2, 3, BASE, MEDIO, OSC);
  return cerrarSuelo(l);
}

export function dibujarSilla(clave: string): Lienzo {
  if (clave === 'N') return sillaEspalda();
  if (clave === 'S') return sillaFrente();
  return sillaLado(clave === 'E' ? 'E' : 'O');
}

export function cuadrosSillas(): Cuadros {
  const c: Cuadros = new Map();
  for (const clave of ['S', 'N', 'E', 'O']) registrar(c, 'silla-oficina', clave, dibujarSilla(clave), 'tela-gris');
  return c;
}
