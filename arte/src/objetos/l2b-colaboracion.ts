/**
 * Colaboración del lote 2B: rotafolio, corcho, pared de post-its, recepción, tótem de bienvenida y buzón de ideas.
 *
 * Estilo Gather: formas blandas, contorno azul marino, notas de colores suaves. Los carteles llevan rayas en lugar
 * de texto (lo pone el motor). El rojo coral aparece solo como acento. La recepción usa los materiales del
 * mostrador del mundo (tapa clara y panel azul grisáceo, o madera, blanco y negro).
 */

import { Lienzo } from '../nucleo';
import type { ColorEntrada } from '../nucleo';
import { MOSTRADORES, METAL, azar, construirCategoria, cuerpoBlando, entre, esquinas, poste, registrar, registrarVariantes, terminar, vetas } from './l2b-comun';
import type { Constructores, Cuadros, EstiloMostrador } from './l2b-comun';

// ---------------------------------------------------------------------------
// Rotafolio
// ---------------------------------------------------------------------------

/** Rotafolio sobre un trípode: bloque de hojas con garabatos de colores, bandeja con un marcador y tres patas. */
export function dibujarRotafolio(): Lienzo {
  const l = new Lienzo(32, 48);
  // Patas: la de atrás primero, luego las dos de adelante abiertas.
  l.linea(16, 31, 16, 42, 'azul-oficina-2');
  l.linea(17, 31, 17, 42, 'azul-oficina-2');
  l.linea(8, 31, 4, 44, 'azul-oficina-3');
  l.linea(9, 31, 5, 44, 'azul-oficina-4');
  l.linea(23, 31, 27, 44, 'azul-oficina-2');
  l.linea(22, 31, 26, 44, 'azul-oficina-3');
  // Soporte del bloque.
  cuerpoBlando(l, 5, 2, 22, 30, 3, ['azul-oficina-1', 'azul-oficina-2', 'azul-oficina-3']);
  // Hoja con rayas, un garabato y una bombilla dibujada a mano.
  l.rect(7, 7, 18, 22, 'neutro-7');
  l.rect(7, 28, 18, 1, 'neutro-6');
  l.rect(24, 8, 1, 21, 'neutro-6');
  l.rect(9, 9, 11, 2, 'rojo-suave-3');
  l.rect(9, 13, 8, 1, 'vidrio-1');
  l.rect(9, 15, 10, 1, 'vidrio-1');
  l.rect(9, 17, 6, 1, 'vidrio-1');
  l.elipse(19, 22, 2, 2, 'tela-calida-3');
  l.rect(18, 25, 3, 1, 'baldosa-gris-3');
  l.rect(9, 21, 5, 5, 'hoja-pastel-3');
  l.rect(9, 21, 5, 1, 'hoja-pastel-4');
  // Grapa del bloque y bandeja con un marcador.
  l.rect(9, 3, 14, 3, 'baldosa-gris-4');
  l.rect(9, 5, 14, 1, 'baldosa-gris-3');
  l.rect(6, 31, 20, 2, 'baldosa-gris-4');
  l.rect(6, 31, 20, 1, 'neutro-7');
  l.rect(10, 30, 6, 1, 'rojo-suave-3');
  return terminar(l);
}

// ---------------------------------------------------------------------------
// Tótem de bienvenida
// ---------------------------------------------------------------------------

/** Tótem digital vertical: pantalla de retrato con cabecera roja, tarjeta de bienvenida y tres botones, sobre un pie. */
export function dibujarTotemBienvenida(): Lienzo {
  const l = new Lienzo(32, 56);
  l.rectRedondeado(6, 49, 20, 4, 2, 'baldosa-gris-4');
  l.rect(8, 49, 16, 1, 'neutro-7');
  l.rect(8, 52, 16, 1, 'baldosa-gris-2');
  poste(l, 13, 44, 6, 6, METAL);
  cuerpoBlando(l, 7, 3, 18, 42, 3, ['azul-oficina-1', 'azul-oficina-2', 'azul-oficina-3']);
  // Pantalla: cabecera roja, tarjeta clara con rayas y botones de colores.
  l.rect(9, 6, 14, 36, 'neutro-7');
  l.rect(9, 6, 14, 9, 'rojo-3');
  l.rect(9, 6, 14, 1, 'rojo-4');
  l.rect(11, 9, 10, 1, 'neutro-7');
  l.rect(11, 11, 6, 1, 'rojo-4');
  l.elipse(15.5, 22, 4, 4, 'lavanda-3');
  l.elipse(15.5, 22, 2, 2, 'lavanda-4');
  l.rect(11, 29, 10, 1, 'baldosa-gris-3');
  l.rect(11, 31, 7, 1, 'baldosa-gris-3');
  for (const [x, c] of [[10, 'vidrio-1'], [14, 'naranja-3'], [18, 'hoja-pastel-3']] as const) {
    l.rect(x, 35, 4, 4, c);
    l.rect(x, 35, 4, 1, 'neutro-7');
  }
  return terminar(l);
}

// ---------------------------------------------------------------------------
// Buzón de ideas
// ---------------------------------------------------------------------------

/** Buzón de ideas: caja naranja redondeada con ranura arriba y una bombilla amarilla en el frente, sobre un pedestal. */
export function dibujarBuzonIdeas(): Lienzo {
  const l = new Lienzo(32, 40);
  poste(l, 13, 26, 8, 6, METAL);
  l.rectRedondeado(9, 33, 14, 4, 1, 'baldosa-gris-4');
  l.rect(10, 33, 12, 1, 'neutro-7');
  cuerpoBlando(l, 5, 3, 22, 24, 4, ['rojo-3', 'rojo-4', 'rojo-4']);
  cuerpoBlando(l, 5, 3, 22, 24, 4, ['naranja-1', 'naranja-2', 'naranja-3']);
  l.rect(10, 6, 12, 2, 'azul-oficina-1');
  // Placa circular con la bombilla.
  l.elipse(15.5, 17, 6, 6, 'neutro-7');
  l.elipse(15.5, 17, 5, 5, 'neutro-6');
  l.elipse(15.5, 16, 3, 3, 'tela-calida-2');
  l.elipse(15.5, 15, 2, 2, 'tela-calida-3');
  l.rect(14, 19, 4, 1, 'baldosa-gris-3');
  l.rect(14, 20, 4, 1, 'baldosa-gris-4');
  l.px(14, 15, 'neutro-7');
  l.rect(22, 21, 3, 3, 'baldosa-gris-4');
  l.px(23, 22, 'azul-oficina-1');
  return terminar(l);
}

// ---------------------------------------------------------------------------
// Recepción
// ---------------------------------------------------------------------------

/** Panel hundido: marco oscuro arriba y a la izquierda, claro abajo y a la derecha. */
function panel(l: Lienzo, x: number, y: number, w: number, h: number, e: EstiloMostrador): void {
  l.rect(x, y, w, h, e.frente[1]);
  l.rect(x, y, w, 1, e.frente[0]);
  l.rect(x, y, 1, h, e.frente[0]);
  l.rect(x + 1, y + h - 1, w - 1, 1, e.frente[2]);
  l.rect(x + w - 1, y + 1, 1, h - 1, e.frente[2]);
}

/** Recepción vista de frente: mostrador alto con repisa de atención, tres paneles hundidos y una franja roja de marca. */
export function dibujarRecepcionS(e: EstiloMostrador): Lienzo {
  const l = new Lienzo(96, 40);
  const x0 = 1;
  const w = 92;
  l.rect(x0, 1, w, 6, e.tapa[1]);
  l.rect(x0, 1, w, 1, e.tapa[2]);
  l.rect(x0, 2, 1, 5, e.tapa[2]);
  l.rect(x0 + w - 1, 2, 1, 5, e.tapa[0]);
  if (e.vetas !== null) vetas(l, x0 + 2, 3, w - 4, 3, 5101, e.vetas[0], e.vetas[1], 8);
  l.rect(x0, 7, w, 1, e.labio[2]);
  l.rect(x0, 8, w, 2, e.labio[1]);
  l.rect(x0, 9, w, 1, e.labio[0]);
  l.rect(x0, 10, w, 27, e.frente[1]);
  panel(l, x0 + 3, 12, 28, 19, e);
  panel(l, x0 + 34, 12, 24, 19, e);
  panel(l, x0 + 61, 12, 28, 19, e);
  l.rect(x0 + 3, 20, 86, 3, 'rojo-3');
  l.rect(x0 + 3, 20, 86, 1, 'rojo-4');
  l.rect(x0 + 3, 22, 86, 1, 'rojo-2');
  l.rect(x0, 33, w, 1, e.frente[0]);
  l.rect(x0, 34, w, 3, e.zocalo);
  esquinas(l, x0, 1, w, 36);
  return terminar(l);
}

/** Recepción vista por detrás: la tapa de trabajo, el respaldo de la repisa y tres cajones con tirador. */
export function dibujarRecepcionN(e: EstiloMostrador): Lienzo {
  const l = new Lienzo(96, 40);
  const x0 = 1;
  const w = 92;
  l.rect(x0, 1, w, 9, e.fondo[1]);
  l.rect(x0, 1, w, 1, e.fondo[2]);
  l.rect(x0, 9, w, 1, e.fondo[0]);
  l.rect(x0, 10, w, 14, e.tapa[1]);
  l.rect(x0, 10, w, 1, e.tapa[0]);
  l.rect(x0, 11, 1, 13, e.tapa[2]);
  l.rect(x0 + w - 1, 11, 1, 13, e.tapa[0]);
  if (e.vetas !== null) vetas(l, x0 + 2, 12, w - 4, 11, 5102, e.vetas[0], e.vetas[1], 15);
  l.rect(40, 14, 16, 3, 'azul-oficina-2');
  l.rect(41, 16, 14, 1, 'azul-oficina-3');
  l.rect(x0, 24, w, 1, e.labio[2]);
  l.rect(x0, 25, w, 2, e.labio[1]);
  l.rect(x0, 26, w, 1, e.labio[0]);
  l.rect(x0, 27, w, 10, e.frente[1]);
  for (const x of [3, 34, 65]) {
    panel(l, x0 + x - 1, 28, 28, 6, e);
    l.rect(x0 + x + 9, 30, 8, 1, 'baldosa-gris-4');
  }
  l.rect(x0, 35, w, 2, e.zocalo);
  esquinas(l, x0, 1, w, 36);
  return terminar(l);
}

/**
 * Recepción de lado: arriba la tapa de trabajo y la repisa alta, el frente a un lado con la franja roja y, en el extremo
 * sur, la sección con sus dos alturas. `lado` es hacia donde mira el frente (este u oeste).
 */
export function dibujarRecepcionLado(e: EstiloMostrador, lado: 'E' | 'O'): Lienzo {
  const l = new Lienzo(32, 104);
  const este = lado === 'E';
  const yFin = 100;
  const largo = yFin - 21;
  const xTrabajo = este ? 2 : 14;
  const xRepisa = este ? 13 : 8;
  const xFrente = este ? 21 : 2;
  l.rect(xTrabajo, 1, 12, largo, e.tapa[1]);
  l.rect(xTrabajo, 1, 12, 1, e.tapa[2]);
  l.rect(xTrabajo, 1, 1, largo, este ? e.tapa[2] : e.tapa[1]);
  l.rect(xTrabajo + 11, 2, 1, largo - 1, e.tapa[0]);
  if (e.vetas !== null) vetas(l, xTrabajo + 2, 4, 8, largo - 6, 5103, e.vetas[0], e.vetas[1], 12);
  l.rect(xRepisa, 1, 6, largo, e.labio[2]);
  l.rect(xRepisa + 5, 2, 1, largo - 1, e.labio[1]);
  l.rect(xFrente, 1, 9, largo, e.frente[1]);
  l.rect(xFrente + (este ? 8 : 0), 1, 1, largo, e.frente[0]);
  l.rect(xFrente + 2, 4, 5, largo - 6, e.frente[2]);
  l.rect(xFrente + 3, 4, 3, largo - 6, e.frente[1]);
  l.rect(xFrente + 4, 4, 2, largo - 6, 'rojo-3');
  l.rect(xFrente + 4, 4, 1, largo - 6, 'rojo-4');
  const y0 = yFin - 19;
  l.rect(2, y0 + 9, 28, 12, e.frente[1]);
  l.rect(xTrabajo, y0 + 9, 12, 1, e.tapa[2]);
  l.rect(xTrabajo, y0 + 10, 12, 2, e.tapa[1]);
  l.rect(xRepisa, y0, 17, 12, e.frente[1]);
  l.rect(xRepisa, y0, 17, 1, e.labio[2]);
  l.rect(xRepisa, y0 + 1, 17, 1, e.labio[1]);
  l.rect(xRepisa + 2, y0 + 5, 13, 3, 'rojo-3');
  l.rect(xRepisa + 2, y0 + 5, 13, 1, 'rojo-4');
  l.rect(xRepisa + 2, y0 + 7, 13, 1, 'rojo-2');
  l.rect(2, y0 + 17, 28, 4, e.zocalo);
  esquinas(l, 2, 1, 28, yFin);
  return terminar(l);
}

// ---------------------------------------------------------------------------
// Registro
// ---------------------------------------------------------------------------

function variantesMostrador(dibujar: (e: EstiloMostrador) => Lienzo): Record<string, Lienzo> {
  return { base: dibujar(MOSTRADORES.base), madera: dibujar(MOSTRADORES.madera), blanco: dibujar(MOSTRADORES.blanco), negro: dibujar(MOSTRADORES.negro) };
}

const CONSTRUCTORES: Constructores = {
  rotafolio: (c) => registrar(c, 'rotafolio', 'U', dibujarRotafolio()),
  'totem-bienvenida': (c) => registrar(c, 'totem-bienvenida', 'U', dibujarTotemBienvenida()),
  'buzon-ideas': (c) => registrar(c, 'buzon-ideas', 'U', dibujarBuzonIdeas()),
  recepcion: (c) => {
    registrarVariantes(c, 'recepcion', 'S', variantesMostrador(dibujarRecepcionS));
    registrarVariantes(c, 'recepcion', 'N', variantesMostrador(dibujarRecepcionN));
    registrarVariantes(c, 'recepcion', 'E', variantesMostrador((e) => dibujarRecepcionLado(e, 'E')));
    registrarVariantes(c, 'recepcion', 'O', variantesMostrador((e) => dibujarRecepcionLado(e, 'O')));
  },
};

/** Todos los cuadros de la categoría colaboración que ya están dibujados (corcho y post-its están en `l2b-paredes.ts`). */
export function cuadrosColaboracion(): Cuadros {
  return construirCategoria(CONSTRUCTORES);
}
void azar;
void entre;
void ((_: ColorEntrada) => 0);
