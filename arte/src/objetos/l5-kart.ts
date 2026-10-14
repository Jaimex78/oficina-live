/**
 * Kart del lote 5: un kart pequeño visto desde arriba en 3/4, con cuatro orientaciones y las variantes base (naranja),
 * azul y rojo. La orientación es hacia donde MIRA el kart: en `S` se ve el frente (morro abajo), en `N` la trasera
 * (con el motor y el escape), y en `E` y `O` el perfil. Las variantes salen de recolorear los cuatro tonos de la
 * carrocería (`naranja-1` a `naranja-4`); llantas, asiento, volante y metal no cambian.
 *
 * Sombra de suelo en dos tonos (la del lote 4) con una mancha de contacto bajo el chasis. En `O` la geometría es la de
 * `E` reflejada y las luces se calculan en pantalla, así que la luz sigue a la izquierda.
 */

import { Lienzo, color, rampa } from '../nucleo';
import type { ColorEntrada } from '../nucleo';
import { poligono, variantesPorRampa } from './l2b-comun';
import { cerrarSuelo, lados, registrarVariantes, rellenarArco, tonosDe } from './l5-comun';
import type { Cuadros, Tonos } from './l5-comun';

/** Tonos de la carrocería de la variante base, de oscuro a claro. */
const CARROCERIA: readonly string[] = ['naranja-1', 'naranja-2', 'naranja-3', 'naranja-4'];
const DESDE: readonly string[] = CARROCERIA.map((n) => color(n));

/** Colores de las variantes: cuatro tonos de oscuro a claro. */
const DESTINOS: Readonly<Record<string, readonly string[]>> = {
  azul: ['azul-oficina-2', 'vidrio-0', 'vidrio-1', 'vidrio-2'].map((n) => color(n)),
  rojo: rampa('rojo').slice(0, 4),
};

const LLANTA: Tonos = tonosDe('neutro', 0, 1, 3);
const ASIENTO: Tonos = tonosDe('azul-oficina', 0, 1, 3);

/** Llanta vista de frente o por detrás: caucho oscuro con la banda de rodadura y un brillo arriba a la izquierda. */
function llanta(l: Lienzo, x: number, y: number, ancho: number, alto: number): void {
  l.rectRedondeado(x, y, ancho, alto, 3, LLANTA.sombra);
  l.rectRedondeado(x, y, ancho - 1, alto - 1, 3, 'neutro-1');
  l.rect(x + 1, y + 1, 1, Math.max(1, alto - 4), 'neutro-3');
  l.rect(x + 2, y, Math.max(1, ancho - 5), 1, 'neutro-2');
  for (let j = 3; j < alto - 2; j += 3) l.rect(x + 2, y + j, ancho - 4, 1, 'neutro-0');
}

/** Volante de frente: aro oscuro con el centro más claro. */
function volanteFrente(l: Lienzo, cx: number, cy: number): void {
  l.elipse(cx, cy, 4, 2, 'neutro-1');
  l.elipse(cx, cy, 3, 1, 'neutro-2');
  l.elipse(cx, cy, 1, 0, 'neutro-4');
  l.px(cx - 2, cy - 1, 'neutro-3');
}

/** Carrocería con bisel: la forma la da `forma`. */
function carroceria(l: Lienzo, forma: (x: number, y: number) => boolean, x0: number, x1: number, y0: number, y1: number): void {
  rellenarArco(l, forma, x0, x1, y0, y1, CARROCERIA);
}

/** Forma a partir de un polígono: rellena en un lienzo auxiliar y luego pregunta por píxel. */
function formaDe(puntos: ReadonlyArray<readonly [number, number]>): (x: number, y: number) => boolean {
  const aux = new Lienzo(40, 40);
  poligono(aux, puntos, 'neutro-7');
  return (x, y) => aux.esOpaco(x, y);
}

export function dibujarKartS(): Lienzo {
  const l = new Lienzo(32, 32);
  // Atrás: motor y escape.
  l.rect(11, 2, 10, 4, 'neutro-2');
  l.rect(11, 2, 10, 1, 'neutro-4');
  l.rect(11, 2, 1, 4, 'neutro-3');
  l.rect(19, 3, 2, 2, 'metal-1');
  l.px(13, 3, 'metal-3');
  // Llantas traseras (más anchas).
  llanta(l, 2, 3, 7, 10);
  llanta(l, 23, 3, 7, 10);
  // Chasis que se afina hacia el morro.
  const forma = formaDe([[9, 6], [23, 6], [25, 14], [21, 26], [11, 26], [7, 14]]);
  carroceria(l, forma, 5, 27, 5, 27);
  // Asiento: respaldo y cojín.
  l.rectRedondeado(11, 6, 10, 8, 3, ASIENTO.sombra);
  l.rectRedondeado(11, 6, 9, 7, 3, 'azul-oficina-1');
  l.rect(12, 6, 6, 1, ASIENTO.luz);
  l.rect(12, 7, 1, 4, 'azul-oficina-2');
  l.elipse(15.5, 15, 4, 2, 'azul-oficina-2');
  l.elipse(15, 14, 2, 1, ASIENTO.luz);
  // Llantas delanteras.
  llanta(l, 3, 17, 6, 9);
  llanta(l, 23, 17, 6, 9);
  // Volante y columna.
  l.rect(15, 19, 2, 4, 'neutro-2');
  volanteFrente(l, 16, 19);
  // Placa de número en el morro y parachoques.
  l.elipse(15.5, 24, 3, 1, 'neutro-7');
  l.px(15, 24, 'neutro-1').px(16, 24, 'neutro-1');
  l.rect(10, 27, 12, 2, 'metal-2');
  l.rect(10, 27, 12, 1, 'metal-3');
  l.rect(21, 28, 1, 1, 'metal-1');
  return cerrarSuelo(l, { contacto: [16, 27, 11, 2] });
}

export function dibujarKartN(): Lienzo {
  const l = new Lienzo(32, 32);
  // Delante: parachoques y morro.
  l.rect(10, 1, 12, 2, 'metal-2');
  l.rect(10, 1, 12, 1, 'metal-3');
  l.rect(21, 2, 1, 1, 'metal-1');
  // Llantas delanteras, más lejanas.
  llanta(l, 3, 4, 6, 9);
  llanta(l, 23, 4, 6, 9);
  // Chasis que se ensancha hacia atrás.
  const forma = formaDe([[11, 3], [21, 3], [25, 12], [25, 22], [7, 22], [7, 12]]);
  carroceria(l, forma, 5, 27, 2, 24);
  l.elipse(15.5, 5, 2, 1, 'neutro-7');
  l.px(15, 5, 'neutro-1').px(16, 5, 'neutro-1');
  // Respaldo del asiento, visto por detrás, con su reposacabezas.
  l.rectRedondeado(10, 9, 12, 14, 4, ASIENTO.sombra);
  l.rectRedondeado(10, 9, 11, 13, 4, 'azul-oficina-1');
  l.rect(12, 9, 6, 1, ASIENTO.luz);
  l.rect(10, 12, 1, 6, 'azul-oficina-2');
  l.rect(15, 11, 1, 9, 'azul-oficina-0');
  // Llantas traseras y motor con escape.
  llanta(l, 2, 17, 7, 10);
  llanta(l, 23, 17, 7, 10);
  l.rect(10, 22, 12, 5, 'neutro-2');
  l.rect(10, 22, 12, 1, 'neutro-4');
  l.rect(10, 22, 1, 5, 'neutro-3');
  l.rect(21, 23, 1, 4, 'neutro-1');
  l.rect(18, 26, 3, 2, 'metal-2');
  l.px(18, 26, 'metal-3');
  l.rect(12, 24, 4, 1, 'neutro-0');
  return cerrarSuelo(l, { contacto: [16, 27, 11, 2] });
}

export function dibujarKartLado(lado: 'E' | 'O'): Lienzo {
  const { e, X, XC } = lados(lado);
  const l = new Lienzo(32, 32);
  const espejo = (puntos: ReadonlyArray<readonly [number, number]>): Array<[number, number]> => puntos.map(([x, y]) => [e ? x : 32 - x, y]);
  // Chasis bajo, con el morro a la derecha.
  const forma = formaDe(espejo([[9, 13], [24, 15], [29, 20], [28, 24], [6, 24], [5, 18]]));
  carroceria(l, forma, 3, 30, 11, 25);
  // Respaldo alto y cojín, atrás.
  l.rectRedondeado(X(4, 7), 7, 7, 14, 3, ASIENTO.sombra);
  l.rectRedondeado(X(4, 7), 7, 6, 13, 3, 'azul-oficina-1');
  l.rect(X(5, 4), 8, 4, 1, ASIENTO.luz);
  l.rect(X(4, 1), 9, 1, 8, 'azul-oficina-2');
  l.rect(X(8, 8), 17, 8, 3, 'azul-oficina-2');
  l.rect(X(8, 8), 17, 8, 1, ASIENTO.luz);
  // Columna y volante, inclinados hacia el piloto.
  l.linea(XC(17), 19, XC(15), 12, 'neutro-2');
  l.elipse(XC(14), 11, 2, 3, 'neutro-1');
  l.elipse(XC(14), 11, 1, 2, 'neutro-2');
  l.px(XC(13), 9, 'neutro-4');
  // Llantas: la de atrás grande, la de adelante un poco menor, con tapacubos de metal.
  llanta(l, X(3, 9), 16, 9, 10);
  llanta(l, X(20, 8), 17, 8, 9);
  l.elipse(XC(7.5), 21, 1, 1, 'metal-2');
  l.px(XC(7), 20, 'metal-3');
  l.elipse(XC(24), 21, 1, 1, 'metal-2');
  l.px(XC(23), 20, 'metal-3');
  // Número en el morro, escape atrás.
  l.elipse(XC(25.5), 19, 2, 1, 'neutro-7');
  l.px(XC(25), 19, 'neutro-1');
  l.rect(X(2, 3), 18, 3, 2, 'metal-2');
  l.px(X(2, 3) + (e ? 0 : 2), 18, 'metal-3');
  return cerrarSuelo(l, { contacto: [XC(16), 26, 12, 1] });
}

export function cuadrosKart(): Cuadros {
  const c: Cuadros = new Map();
  const poner = (clave: string, base: Lienzo): void => registrarVariantes(c, 'kart', clave, variantesPorRampa(base, DESDE, DESTINOS));
  poner('S', dibujarKartS());
  poner('N', dibujarKartN());
  poner('E', dibujarKartLado('E'));
  poner('O', dibujarKartLado('O'));
  return c;
}
