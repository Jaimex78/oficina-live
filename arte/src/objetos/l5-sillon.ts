/**
 * Silla gamer del lote 5: respaldo alto con alas y reposacabezas de color, asiento con refuerzos laterales,
 * apoyabrazos y base de cinco patas con ruedas. Sobresale 16 px (mide 32 x 48), cuatro orientaciones y cuatro colores.
 *
 * La orientación es hacia donde mira QUIEN SE SIENTA: en `S` el respaldo queda arriba, detrás, y se ve el asiento de
 * frente; en `N` se ve la espalda del respaldo; en `E` y `O` el perfil. La carcasa es negra y no cambia: las variantes
 * (`base` verde, `rojo`, `azul`, `morado`) recolorean solo los cuatro tonos del acento. `O` usa la geometría de `E`
 * reflejada con la luz todavía a la izquierda.
 *
 * Sombra de suelo en dos tonos (la del lote 4) con una mancha de contacto bajo la base.
 */

import { Lienzo, color, rampa } from '../nucleo';
import type { ColorEntrada } from '../nucleo';
import { variantesPorRampa } from './l2b-comun';
import { cerrarSuelo, columna, cuerpoBlando, lados, registrarVariantes, tonosDe } from './l5-comun';
import type { Cuadros, Tonos } from './l5-comun';

/** Cuatro tonos del acento de la variante base (verde), de oscuro a claro. */
const ACENTO: readonly string[] = ['planta-1', 'planta-2', 'planta-3', 'planta-4'];
const DESDE: readonly string[] = ACENTO.map((n) => color(n));

const DESTINOS: Readonly<Record<string, readonly string[]>> = {
  rojo: rampa('rojo').slice(0, 4),
  azul: ['azul-oficina-2', 'vidrio-0', 'vidrio-1', 'vidrio-2'].map((n) => color(n)),
  morado: rampa('morado').slice(0, 4),
};

/** Acento como tonos de columna: sombra, medio y luz. */
const ACC: Tonos = { sombra: ACENTO[0] as string, medio: ACENTO[1] as string, luz: ACENTO[2] as string };
const NEGRO: readonly [ColorEntrada, ColorEntrada, ColorEntrada] = ['neutro-1', 'neutro-2', 'neutro-3'];
const NEGRO_T: Tonos = tonosDe('neutro', 1, 2, 4);

/** Base de cinco patas con ruedas, vista de frente: columna de gas y patas que se abren. */
function baseFrente(l: Lienzo): void {
  const patas: Array<[number, number]> = [[5, 42], [27, 42], [9, 44], [23, 44]];
  for (const [x, y] of patas) {
    l.linea(16, 39, x, y, 'neutro-2');
    l.linea(16, 40, x, y + (y === 42 ? 1 : 0), 'neutro-1');
    l.rect(x - 1, y, 3, 2, 'neutro-3');
    l.px(x - 1, y, 'neutro-4');
  }
  l.rect(15, 44, 3, 1, 'neutro-1');
  columna(l, 14, 35, 5, 6, tonosDe('metal', 1, 2, 3));
  l.rect(12, 38, 9, 2, 'neutro-2');
  l.rect(12, 38, 9, 1, 'neutro-3');
}

/** Respaldo con alas de color, visto de frente. */
function respaldoFrente(l: Lienzo): void {
  cuerpoBlando(l, 7, 1, 18, 26, 7, NEGRO);
  l.rect(11, 9, 10, 16, 'neutro-1');
  for (let y = 11; y < 24; y += 2) l.px(13, y, 'neutro-3').px(18, y, 'neutro-3');
  // Alas laterales.
  columna(l, 8, 9, 3, 15, ACC);
  columna(l, 21, 9, 3, 15, ACC);
  l.rect(8, 9, 3, 1, ACC.luz);
  // Reposacabezas.
  cuerpoBlando(l, 10, 2, 12, 6, 3, [ACC.sombra, ACC.medio, ACC.luz]);
  l.rect(12, 3, 5, 1, 'neutro-7');
  // Cojín lumbar.
  l.rect(13, 17, 6, 3, ACC.medio);
  l.rect(13, 17, 6, 1, ACC.luz);
  l.rect(13, 19, 6, 1, ACC.sombra);
}

export function dibujarSillonGamerS(): Lienzo {
  const l = new Lienzo(32, 48);
  baseFrente(l);
  respaldoFrente(l);
  // Asiento con refuerzos laterales de color.
  cuerpoBlando(l, 6, 24, 20, 11, 4, NEGRO);
  l.rect(12, 26, 8, 7, 'neutro-2');
  columna(l, 8, 26, 2, 7, ACC);
  columna(l, 22, 26, 2, 7, ACC);
  // Apoyabrazos: poste y almohadilla.
  for (const x of [2, 25]) {
    l.rect(x + 1, 25, 3, 6, 'neutro-1');
    bloque4(l, x, 20, 5, 5);
  }
  return cerrarSuelo(l, { contacto: [17, 43, 11, 2], diagonales: false });
}

/** Almohadilla de apoyabrazos: negra, con luz arriba a la izquierda. */
function bloque4(l: Lienzo, x: number, y: number, ancho: number, alto: number): void {
  l.rect(x, y, ancho, alto, NEGRO_T.medio);
  l.rect(x, y, ancho, 1, NEGRO_T.luz);
  l.rect(x, y, 1, alto, NEGRO_T.luz);
  l.rect(x + ancho - 1, y + 1, 1, alto - 1, NEGRO_T.sombra);
  l.rect(x + 1, y + alto - 1, ancho - 1, 1, NEGRO_T.sombra);
}

export function dibujarSillonGamerN(): Lienzo {
  const l = new Lienzo(32, 48);
  baseFrente(l);
  // Apoyabrazos a los lados, asomando detrás del respaldo.
  for (const x of [2, 25]) {
    l.rect(x + 1, 24, 3, 8, 'neutro-1');
    bloque4(l, x, 19, 5, 5);
  }
  // Respaldo visto por detrás: más ancho y alto, con franja central de color.
  cuerpoBlando(l, 5, 3, 22, 31, 8, NEGRO);
  l.rect(9, 12, 14, 19, 'neutro-1');
  l.rect(9, 12, 14, 1, 'neutro-3');
  l.rect(9, 12, 1, 19, 'neutro-2');
  columna(l, 14, 12, 4, 19, ACC);
  l.rect(14, 12, 4, 1, ACC.luz);
  // Reposacabezas por detrás.
  cuerpoBlando(l, 9, 4, 14, 7, 3, [ACC.sombra, ACC.medio, ACC.luz]);
  l.rect(11, 5, 6, 1, 'neutro-7');
  // Costuras y rombo de marca.
  for (let y = 15; y < 30; y += 2) l.px(11, y, 'neutro-3').px(20, y, 'neutro-3');
  l.px(15, 22, ACC.luz).px(16, 21, ACC.luz).px(16, 23, ACC.luz).px(17, 22, ACC.luz);
  return cerrarSuelo(l, { contacto: [17, 43, 11, 2] });
}

export function dibujarSillonGamerLado(lado: 'E' | 'O'): Lienzo {
  const { e, X, XC } = lados(lado);
  const l = new Lienzo(32, 48);
  // Base: columna y patas vistas de lado.
  l.linea(XC(16), 40, XC(5), 43, 'neutro-2');
  l.linea(XC(16), 40, XC(27), 43, 'neutro-2');
  l.linea(XC(16), 41, XC(5), 44, 'neutro-1');
  l.linea(XC(16), 41, XC(27), 44, 'neutro-1');
  l.rect(X(10, 13), 40, 13, 2, 'neutro-2');
  l.rect(X(10, 13), 40, 13, 1, 'neutro-3');
  for (const cx of [4, 26]) {
    l.rect(X(cx, 3), 43, 3, 2, 'neutro-3');
    l.px(X(cx, 3) + (e ? 0 : 2), 43, 'neutro-4');
  }
  columna(l, X(14, 5), 35, 5, 6, tonosDe('metal', 1, 2, 3));
  // Respaldo alto, atrás, con su ala de color y el reposacabezas hacia delante.
  cuerpoBlando(l, X(4, 9), 1, 9, 27, 4, NEGRO);
  columna(l, X(5, 3), 9, 3, 16, ACC);
  l.rect(X(5, 3), 9, 3, 1, ACC.luz);
  cuerpoBlando(l, X(6, 8), 2, 8, 6, 3, [ACC.sombra, ACC.medio, ACC.luz]);
  l.rect(X(8, 4), 3, 4, 1, 'neutro-7');
  l.rect(X(10, 2), 4, 2, 6, 'neutro-2');
  // Asiento largo hacia delante, con su refuerzo de color.
  cuerpoBlando(l, X(6, 21), 24, 21, 11, 4, NEGRO);
  l.rect(X(10, 15), 26, 15, 2, ACC.medio);
  l.rect(X(10, 15), 26, 15, 1, ACC.luz);
  // Apoyabrazos: poste y almohadilla larga.
  l.rect(X(12, 3), 25, 3, 7, 'neutro-1');
  bloque4(l, X(10, 13), 21, 13, 4);
  return cerrarSuelo(l, { contacto: [XC(16), 44, 11, 1] });
}

export function cuadrosSillonGamer(): Cuadros {
  const c: Cuadros = new Map();
  const poner = (clave: string, base: Lienzo): void => registrarVariantes(c, 'sillon-gamer', clave, variantesPorRampa(base, DESDE, DESTINOS));
  poner('S', dibujarSillonGamerS());
  poner('N', dibujarSillonGamerN());
  poner('E', dibujarSillonGamerLado('E'));
  poner('O', dibujarSillonGamerLado('O'));
  return c;
}
