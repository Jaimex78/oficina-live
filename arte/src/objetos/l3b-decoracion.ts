/**
 * Decoración suelta del lote 3B: perchero con bombillas, cámara en trípode, ave del paraíso, espantapájaros y balón.
 *
 * Todos son de orientación única (`U`). Lo que emite luz (las bombillas del perchero) usa los tonos más claros de
 * `tela-calida` y crema para leerse encendido de noche; el resplandor lo pone el motor.
 */

import { Lienzo } from '../nucleo';
import { dentroElipse } from './l2b-comun';
import {
  AZ, BG, CR, MT, NA, NE, PL, RS, TC, VI, W, R, ME,
  bloque, cuerpoBlando, poste, registrar, sombraSuelo, terminar,
} from './l3b-comun';
import type { Cuadros } from './l3b-comun';

// ---------------------------------------------------------------------------
// Perchero con bombillas
// ---------------------------------------------------------------------------

/** Bombilla redonda encendida: aro ámbar, cuerpo amarillo claro y un destello blanco. */
function bombilla(l: Lienzo, cx: number, cy: number): void {
  l.elipse(cx, cy, 3, 3, TC(1));
  l.elipse(cx, cy, 2, 2, TC(3));
  l.rect(cx - 1, cy - 1, 2, 2, CR(4));
  l.px(cx - 2, cy - 2, 'neutro-7');
  l.px(cx + 2, cy + 2, TC(2));
  l.px(cx + 1, cy + 3, TC(1));
}

/** Perchero de pie: poste de aluminio con seis brazos que terminan en una bombilla, y base redonda. */
export function dibujarPerchero(): Lienzo {
  const l = new Lienzo(32, 64);
  // Base redonda.
  l.elipse(15.5, 58, 8, 3, ME(1));
  l.elipse(15.5, 57, 8, 2, ME(2));
  l.rect(9, 56, 7, 1, ME(3));
  // Poste.
  poste(l, 15, 9, 48, 2, [ME(1), ME(2), ME(3)]);
  l.rect(14, 7, 4, 3, ME(3));
  l.px(14, 7, null).px(17, 7, null);
  // Brazos y bombillas: [altura donde nace en el poste, x de la bombilla, y de la bombilla].
  const brazos: ReadonlyArray<readonly [number, number, number]> = [
    [21, 7, 11], [23, 25, 14], [35, 6, 26], [37, 26, 29], [47, 8, 40], [45, 25, 41],
  ];
  for (const [ya, bx, by] of brazos) {
    const izq = bx < 16;
    const x0 = izq ? 14 : 17;
    l.linea(x0, ya, bx, by + 3, ME(2));
    l.linea(x0, ya + 1, bx + (izq ? 1 : -1), by + 4, ME(1));
    l.rect(bx - 1, by + 3, 3, 2, ME(1));
    bombilla(l, bx, by);
  }
  return terminar(l);
}

// ---------------------------------------------------------------------------
// Cámara en trípode
// ---------------------------------------------------------------------------

/** Cámara de video oscura sobre un trípode de tres patas abiertas. */
export function dibujarCamaraTripode(): Lienzo {
  const l = new Lienzo(32, 48);
  // Patas: izquierda, derecha y la del frente (más larga, más cerca de quien juega).
  l.linea(15, 22, 7, 42, NE(1));
  l.linea(14, 22, 6, 42, NE(3));
  l.linea(16, 22, 24, 42, NE(1));
  l.linea(17, 22, 25, 42, NE(2));
  l.rect(15, 24, 2, 21, NE(2));
  l.rect(15, 24, 1, 21, NE(3));
  l.rect(16, 24, 1, 21, NE(1));
  for (const [x, y] of [[5, 42], [24, 42], [14, 45]] as const) l.rect(x, y, 3, 1, NE(0));
  // Columna y plato.
  poste(l, 15, 15, 8, 2, [NE(1), NE(2), NE(3)]);
  l.rect(11, 14, 10, 2, ME(1));
  l.rect(11, 14, 10, 1, ME(2));
  // Cuerpo de la cámara con el visor arriba y el objetivo saliendo a la izquierda.
  cuerpoBlando(l, 10, 5, 14, 9, 2, [NE(1), NE(2), NE(3)]);
  l.rect(17, 3, 5, 2, NE(2));
  l.rect(17, 3, 5, 1, NE(3));
  l.rect(5, 7, 6, 6, NE(2));
  l.rect(5, 7, 6, 1, NE(4));
  l.rect(5, 12, 6, 1, NE(1));
  l.elipse(6, 9.5, 2, 2.5, ME(3));
  l.rect(5, 8, 2, 3, NE(0));
  l.px(5, 8, VI(2));
  l.px(21, 8, 'rojo-3');
  l.px(13, 7, NE(5));
  return terminar(l);
}

// ---------------------------------------------------------------------------
// Ave del paraíso
// ---------------------------------------------------------------------------

/** Hoja ancha y ovalada con su propio contorno verde oscuro, para que se separen las que se tapan entre sí. */
function hojaAncha(l: Lienzo, base: readonly [number, number], punta: readonly [number, number], ancho: number): void {
  const dx = punta[0] - base[0];
  const dy = punta[1] - base[1];
  const largo = Math.hypot(dx, dy);
  const angulo = (Math.atan2(dy, dx) * 180) / Math.PI;
  const sola = new Lienzo(l.ancho, l.alto);
  sola.elipseSombreada((base[0] + punta[0]) / 2, (base[1] + punta[1]) / 2, largo / 2, ancho / 2, [PL(1), PL(2), PL(3), PL(4)], { angulo });
  const ux = dx / largo;
  const uy = dy / largo;
  sola.linea(Math.round(base[0] + ux * 2), Math.round(base[1] + uy * 2), Math.round(punta[0] - ux * 2), Math.round(punta[1] - uy * 2), PL(1));
  sola.contorno(PL(0));
  l.pegar(sola, 0, 0);
}

/** Una flor del ave del paraíso: vaina verde, tres pétalos naranja en abanico y dos lenguas azules. */
function flor(l: Lienzo, cx: number, cy: number): void {
  // Pétalos naranja en abanico, de atrás hacia adelante.
  l.linea(cx - 1, cy, cx - 4, cy - 3, NA(2));
  l.linea(cx, cy, cx - 3, cy - 4, NA(3));
  l.linea(cx + 1, cy, cx + 4, cy - 3, NA(2));
  l.linea(cx, cy, cx + 3, cy - 4, NA(3));
  l.rect(cx - 1, cy - 5, 2, 5, NA(3));
  l.px(cx - 1, cy - 5, NA(4)).px(cx - 4, cy - 3, NA(4)).px(cx + 4, cy - 3, NA(1));
  // Lenguas azules que salen de la vaina.
  l.linea(cx - 1, cy + 1, cx - 4, cy, VI(2));
  l.linea(cx + 1, cy + 1, cx + 4, cy, VI(1));
  // Vaina verde en forma de bote.
  l.elipse(cx, cy + 1.5, 2, 1, PL(2));
  l.px(cx - 1, cy + 1, PL(3));
}

/** Ave del paraíso en una maceta gris azulada: hojas grandes y tres flores naranja y azul. */
export function dibujarAveDelParaiso(): Lienzo {
  const l = new Lienzo(32, 64);
  // Tallos de las flores.
  for (const [x, y] of [[6, 20], [26, 15], [16, 8]] as const) {
    l.linea(16, 46, x, y + 3, PL(2));
    l.linea(17, 46, x + 1, y + 3, PL(1));
  }
  for (const [x, y] of [[6, 20], [26, 15], [16, 8]] as const) flor(l, x, y);
  // Hojas, de atrás hacia adelante.
  hojaAncha(l, [16, 45], [16, 25], 7);
  hojaAncha(l, [16, 45], [9, 23], 7);
  hojaAncha(l, [16, 45], [24, 22], 7);
  hojaAncha(l, [15, 46], [2, 33], 7);
  hojaAncha(l, [17, 46], [30, 32], 7);
  hojaAncha(l, [15, 46], [4, 44], 6);
  hojaAncha(l, [17, 46], [28, 44], 6);
  hojaAncha(l, [16, 46], [16, 36], 6);
  // Maceta: borde ancho y cuerpo que se angosta, gris azulado como la del estilo Gather.
  l.rect(10, 45, 12, 2, W(1));
  cuerpoBlando(l, 9, 55 - 8, 14, 15, 3, [BG(2), BG(3), BG(4)]);
  cuerpoBlando(l, 7, 46, 18, 5, 2, [BG(3), BG(4), NE(7)]);
  l.rect(9, 51, 1, 8, BG(4));
  l.rect(12, 59, 8, 1, BG(2));
  return terminar(l);
}

// ---------------------------------------------------------------------------
// Espantapájaros
// ---------------------------------------------------------------------------

/** Espantapájaros con sombrero de paja y pluma, camisa roja, peto azul y paja en las manos, sobre su poste. */
export function dibujarEspantapajaros(): Lienzo {
  const l = new Lienzo(32, 56);
  // Poste y base de tablas.
  poste(l, 14, 34, 17, 4, [W(1), W(2), W(3)]);
  bloque(l, 10, 50, 12, 3, [R(1), R(2), R(3)]);
  // Brazos con camisa a cuadros: mangas largas y paja en las puntas.
  l.rect(4, 18, 24, 5, RS(2));
  l.rect(4, 18, 24, 1, RS(3));
  l.rect(4, 22, 24, 1, RS(1));
  for (let x = 7; x < 28; x += 4) l.rect(x, 19, 1, 3, RS(1));
  for (const x0 of [1, 27]) {
    l.rect(x0, 18, 4, 5, TC(3));
    l.rect(x0, 18, 4, 1, 'tela-calida-3');
    l.px(x0 + (x0 === 1 ? 0 : 3), 17, TC(3)).px(x0 + (x0 === 1 ? 0 : 3), 23, TC(2)).px(x0 + (x0 === 1 ? 1 : 2), 23, TC(3));
    l.px(x0 + 1, 20, TC(2)).px(x0 + 2, 21, TC(2));
  }
  // Torso: camisa y peto.
  l.rect(10, 17, 12, 8, RS(2));
  l.rect(10, 17, 12, 1, RS(3));
  l.rect(10, 17, 1, 8, RS(3));
  l.rect(21, 18, 1, 7, RS(1));
  l.rect(11, 21, 10, 13, VI(1));
  l.rect(11, 21, 1, 13, VI(2));
  l.rect(20, 22, 1, 12, VI(0));
  l.rect(11, 18, 2, 4, VI(1));
  l.rect(19, 18, 2, 4, VI(1));
  l.rect(11, 18, 1, 4, VI(2));
  l.rect(12, 22, 2, 2, TC(3));
  l.rect(18, 22, 2, 2, TC(3));
  l.rect(14, 27, 4, 4, TC(2));
  l.px(14, 27, TC(3)).px(17, 30, TC(1));
  l.px(15, 28, TC(1)).px(16, 29, TC(1));
  // Paja que asoma por el peto, abajo.
  for (const x of [11, 13, 15, 17, 19]) l.rect(x, 34, 2, 2 + (x % 4 === 3 ? 1 : 0), TC(3));
  l.rect(12, 35, 8, 1, TC(2));
  // Cabeza.
  l.elipseSombreada(15.5, 12.5, 5, 4.5, [CR(2), CR(3), CR(4)]);
  l.px(13, 12, AZ(0)).px(14, 12, AZ(0)).px(18, 12, AZ(0)).px(17, 12, AZ(0));
  l.px(13, 15, MT(1)).px(14, 16, MT(1)).px(15, 16, MT(1)).px(16, 16, MT(1)).px(17, 15, MT(1));
  l.px(15, 13, MT(3)).px(16, 13, MT(3));
  // Pelo de paja a los lados del sombrero.
  for (const [x, y, w] of [[8, 9, 3], [8, 11, 2], [21, 9, 3], [22, 11, 2]] as const) l.rect(x, y, w, 2, TC(3));
  l.px(8, 13, TC(2)).px(23, 13, TC(2));
  // Sombrero de paja con cinta roja y una pluma naranja.
  l.elipse(15.5, 8, 10, 2, R(2));
  l.rect(7, 8, 17, 1, R(3));
  l.rect(9, 10, 14, 1, R(1));
  l.rectRedondeado(11, 2, 10, 7, 4, R(3));
  l.rect(11, 2, 3, 6, R(4));
  l.rect(20, 3, 1, 5, R(2));
  l.rect(11, 6, 10, 2, RS(2));
  l.rect(11, 6, 10, 1, RS(3));
  l.linea(20, 5, 24, 0 + 1, NA(3));
  l.linea(21, 5, 25, 2, NA(2));
  l.px(24, 1, NA(4));
  return terminar(l);
}

// ---------------------------------------------------------------------------
// Balón de fútbol
// ---------------------------------------------------------------------------

/** Balón de fútbol blanco con parches azul marino, apoyado en el piso. Suelto (no bloquea). */
export function dibujarBalonFutbol(): Lienzo {
  const cx = 15;
  const cy = 17;
  const l = new Lienzo(32, 32);
  l.elipseSombreada(cx, cy, 8, 8, [NE(5), NE(6), NE(7)], { relieve: 0.6 });
  // Parches sobre una capa aparte y recortados a la esfera, para que no se salgan.
  const parches = new Lienzo(32, 32);
  const penta = (px: number, py: number, w: number, h: number): void => {
    parches.rect(px, py + 1, w, h - 2, AZ(1));
    parches.rect(px + 1, py, w - 2, h, AZ(1));
  };
  penta(13, 14, 5, 5);
  penta(12, 9, 7, 3);
  penta(20, 12, 4, 5);
  penta(19, 21, 4, 3);
  penta(8, 20, 4, 4);
  penta(7, 13, 3, 4);
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) if (!dentroElipse(x, y, cx, cy, 8, 8)) parches.px(x, y, null);
  }
  l.pegar(parches, 0, 0);
  // Luz arriba a la izquierda y sombra abajo a la derecha.
  l.px(10, 11, 'neutro-7').px(11, 10, 'neutro-7');
  for (const [x, y] of [[20, 23], [21, 22], [22, 20], [19, 24], [18, 24]] as const) if (l.leerHex(x, y) === '#FFFFFF' || l.leerHex(x, y) === '#D7D7DD') l.px(x, y, NE(5));
  terminar(l, { sombra: false });
  return sombraSuelo(l, 17, 25, 8, 2);
}

// ---------------------------------------------------------------------------
// Registro
// ---------------------------------------------------------------------------

export function cuadrosDecoracion3B(): Cuadros {
  const c: Cuadros = new Map();
  registrar(c, 'perchero', 'U', dibujarPerchero());
  registrar(c, 'camara-tripode', 'U', dibujarCamaraTripode());
  registrar(c, 'ave-del-paraiso', 'U', dibujarAveDelParaiso());
  registrar(c, 'espantapajaros', 'U', dibujarEspantapajaros());
  registrar(c, 'balon-futbol', 'U', dibujarBalonFutbol());
  return c;
}

