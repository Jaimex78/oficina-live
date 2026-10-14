/**
 * Navidad (lote 6): pesebre, muñeco de nieve, corona, guirnalda, reno y calcetines. 12 cuadros.
 *
 * Sombras: pesebre, muñeco y reno van sobre el piso (dos tonos y mancha de contacto); corona, guirnalda y calcetines
 * cuelgan de la pared (1 px sobre ella; en las paredes verticales solo se ve la franja de la tapa, así que ahí son
 * placas delgadas de 4 px). Los verdes son los de `planta`, los rojos los de `rojo` y el dorado el de `tela-calida`.
 */

import { Lienzo } from '../nucleo';
import type { ColorEntrada } from '../nucleo';
import { azar, cerrarColgante, cerrarSuelo, conBorde, enElipse, entre, placaLateral, poligono, pxSobre, quitar, registrar, sombrearBordes, trazo, volumen } from './l6-comun';
import type { Cuadros } from './l6-comun';

/** Una estrella de cinco puntas rellena, de radio `r`, con el centro más claro. */
function estrella(l: Lienzo, cx: number, cy: number, r: number, color: ColorEntrada, centro: ColorEntrada): void {
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < 10; i++) {
    const a = (-90 + i * 36) * (Math.PI / 180);
    const rr = i % 2 === 0 ? r : r * 0.45;
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  poligono(l, pts, color);
  l.px(Math.round(cx), Math.round(cy), centro);
}

// ---------------------------------------------------------------------------
// Pesebre
// ---------------------------------------------------------------------------

/** Una figura arrodillada del pesebre: túnica, capucha y cara; `halo` pone un aro dorado sobre la cabeza. */
function figura(l: Lienzo, cx: number, pies: number, alto: number, tunica: readonly [ColorEntrada, ColorEntrada, ColorEntrada], capucha: ColorEntrada, halo: boolean): void {
  const cabeza = pies - alto + 3;
  for (let y = cabeza + 3; y <= pies; y++) {
    const t = (y - (cabeza + 3)) / Math.max(1, pies - cabeza - 3);
    const mitad = 2 + Math.round(t * 2.2);
    for (let x = cx - mitad; x <= cx + mitad; x++) l.px(x, y, x < cx - mitad / 2 ? tunica[2] : x > cx + mitad / 2 ? tunica[0] : tunica[1]);
  }
  l.elipse(cx, cabeza, 3, 3, capucha);
  l.px(cx - 2, cabeza - 2, tunica[2]);
  l.rect(cx - 1, cabeza, 3, 3, 'cuero-4');
  l.px(cx - 1, cabeza + 1, 'azul-oficina-0');
  l.px(cx + 1, cabeza + 1, 'azul-oficina-0');
  if (halo) {
    l.elipse(cx, cabeza - 4, 3, 1, 'tela-calida-3', { relleno: false });
  }
}

/** Pesebre: techo de paja sobre postes de madera, con María, José y el niño en el comedero, una oveja y la estrella. 64 x 40. */
export function dibujarPesebre(): Lienzo {
  const l = new Lienzo(64, 40);
  const r = azar(23);
  // Suelo de paja.
  l.elipse(32, 34, 28, 2, 'tela-calida-1');
  for (let i = 0; i < 30; i++) {
    const x = 6 + entre(r, 0, 50);
    pxSobre(l, x, 32 + entre(r, 0, 3), i % 3 === 0 ? 'tela-calida-3' : 'tela-calida-2');
    pxSobre(l, x + 1, 33 + entre(r, 0, 2), 'tela-calida-2');
  }
  // Pared del fondo, de tablas oscuras.
  l.rect(9, 18, 46, 17, 'madera-oscura-1');
  for (let x = 12; x < 54; x += 6) l.rect(x, 18, 1, 17, 'madera-oscura-0');
  l.rect(9, 18, 46, 1, 'madera-oscura-0');
  // Postes.
  for (const x of [6, 54]) {
    l.rect(x, 16, 4, 21, 'madera-clara-2');
    l.rect(x, 16, 1, 21, 'madera-clara-3');
    l.rect(x + 3, 16, 1, 21, 'madera-clara-1');
  }
  // Techo de paja: triángulo con hileras.
  const techo: Array<[number, number]> = [[32, 5], [2, 19], [62, 19]];
  poligono(l, techo, 'tela-calida-2');
  for (let y = 5; y <= 19; y++) {
    const mitad = Math.round((30 * (y - 4)) / 15);
    l.rect(32 - mitad, y, Math.max(2, Math.round(mitad * 0.55)), 1, 'tela-calida-3');
    l.rect(32 + mitad - Math.max(2, Math.round(mitad * 0.45)), y, Math.max(2, Math.round(mitad * 0.45)), 1, 'tela-calida-1');
  }
  for (let y = 8; y <= 18; y += 3) {
    const mitad = Math.round((30 * (y - 4)) / 15);
    for (let x = 32 - mitad + 3; x < 32 + mitad - 2; x += 5 + (y % 2)) l.rect(x, y, 3, 1, 'tela-calida-0');
  }
  // Viga del alero.
  l.rect(2, 19, 60, 2, 'madera-oscura-2');
  l.rect(2, 19, 60, 1, 'madera-oscura-3');
  // Comedero con paja y el niño.
  for (let y = 30; y <= 35; y++) {
    const mitad = 6 - Math.floor((y - 30) * 0.6);
    for (let x = 32 - mitad; x <= 32 + mitad; x++) l.px(x, y, x < 30 ? 'madera-clara-3' : x > 34 ? 'madera-clara-1' : 'madera-clara-2');
  }
  l.rect(26, 29, 13, 2, 'tela-calida-3');
  l.rect(26, 29, 13, 1, 'tela-calida-2');
  l.elipse(32, 29, 3, 2, 'neutro-7');
  l.px(34, 30, 'neutro-6');
  l.rect(29, 27, 3, 3, 'cuero-4');
  l.px(29, 28, 'azul-oficina-0');
  l.px(31, 28, 'azul-oficina-0');
  // Personas y oveja.
  figura(l, 19, 35, 15, ['vidrio-0', 'vidrio-1', 'vidrio-2'], 'vidrio-2', true);
  figura(l, 45, 35, 15, ['madera-oscura-1', 'madera-oscura-2', 'madera-oscura-3'], 'madera-oscura-2', true);
  l.rect(50, 20, 1, 15, 'madera-clara-2');
  l.px(50, 20, 'madera-clara-3');
  l.px(51, 20, 'madera-clara-2');
  l.elipse(11, 33, 3, 2, 'neutro-7');
  l.rect(8, 32, 3, 2, 'neutro-6');
  l.rect(13, 31, 3, 3, 'azul-oficina-2');
  l.px(14, 32, 'neutro-7');
  l.rect(10, 35, 1, 1, 'azul-oficina-1');
  l.rect(13, 35, 1, 1, 'azul-oficina-1');
  // Estrella sobre el techo.
  estrella(l, 32, 2, 4, 'tela-calida-3', 'neutro-7');
  return cerrarSuelo(l, { contacto: [33, 35, 29, 2], diagonales: true });
}

// ---------------------------------------------------------------------------
// Muñeco de nieve
// ---------------------------------------------------------------------------

/** Muñeco de nieve de dos bolas y cabeza, con sombrero de copa, bufanda a rayas, nariz de zanahoria y brazos de ramas. 32 x 48. */
export function dibujarMunecoNieve(): Lienzo {
  const l = new Lienzo(32, 48);
  const nieve = ['vidrio-2', 'vidrio-3', 'neutro-6', 'neutro-7'] as const;
  // Brazos de ramas, detrás de las bolas.
  trazo(l, 9, 29, 3, 22, 2, 2, 'madera-oscura-2');
  l.linea(5, 24, 3, 25, 'madera-oscura-2');
  l.linea(4, 23, 4, 20, 'madera-oscura-2');
  trazo(l, 23, 29, 28, 23, 2, 2, 'madera-oscura-2');
  l.linea(26, 25, 28, 26, 'madera-oscura-2');
  l.linea(27, 24, 28, 21, 'madera-oscura-2');
  sombrearBordes(l, 'madera-oscura-2', 'madera-oscura-3', 'madera-oscura-1');
  // Bolas de abajo hacia arriba.
  volumen(l, 15.5, 37, 10.5, 8.5, (x, y) => enElipse(x, y, 15.5, 37, 10, 8), nieve, [0.38, 0.66, 0.9]);
  volumen(l, 15.5, 27, 8.5, 7.5, (x, y) => enElipse(x, y, 15.5, 27, 8, 7), nieve, [0.38, 0.66, 0.9]);
  volumen(l, 15.5, 17, 7.5, 6.5, (x, y) => enElipse(x, y, 15.5, 17, 7, 6), nieve, [0.38, 0.66, 0.9]);
  // Botones de carbón.
  for (const y of [25, 29, 33]) l.rect(15, y, 2, 2, 'azul-oficina-0');
  // Cara: ojos de carbón, sonrisa de piedritas y nariz de zanahoria.
  l.rect(12, 15, 2, 2, 'azul-oficina-0');
  l.rect(18, 15, 2, 2, 'azul-oficina-0');
  for (const [x, y] of [[12, 21], [13, 22], [15, 22], [16, 22], [18, 22], [19, 21]] as const) l.px(x, y, 'azul-oficina-0');
  l.rect(15, 18, 5, 2, 'naranja-3');
  l.rect(15, 18, 5, 1, 'naranja-4');
  l.rect(19, 19, 3, 1, 'naranja-2');
  l.px(21, 20, 'naranja-1');
  l.px(11, 18, 'rojo-suave-4');
  l.px(11, 19, 'rojo-suave-4');
  // Bufanda a rayas rojas y verdes, con una punta que cuelga.
  for (let x = 8; x <= 23; x++) {
    const raya = Math.floor((x - 8) / 3) % 2 === 0;
    l.px(x, 22 + (x < 10 || x > 21 ? 1 : 0), raya ? 'rojo-3' : 'planta-3');
    l.px(x, 23 + (x < 10 || x > 21 ? 1 : 0), raya ? 'rojo-2' : 'planta-2');
  }
  l.rect(20, 24, 4, 7, 'rojo-3');
  l.rect(20, 24, 4, 1, 'rojo-4');
  l.rect(22, 24, 2, 7, 'rojo-2');
  l.rect(20, 27, 4, 2, 'planta-3');
  l.rect(22, 27, 2, 2, 'planta-2');
  for (const x of [20, 22]) l.px(x, 31, 'rojo-2');
  // Sombrero de copa negro con cinta roja.
  l.rect(9, 11, 14, 2, 'azul-oficina-1');
  l.rect(9, 11, 14, 1, 'azul-oficina-3');
  l.rect(11, 3, 10, 8, 'azul-oficina-1');
  l.rect(11, 3, 2, 8, 'azul-oficina-3');
  l.rect(19, 3, 2, 8, 'azul-oficina-0');
  l.rect(11, 8, 10, 2, 'rojo-3');
  l.rect(19, 8, 2, 2, 'rojo-2');
  l.rect(11, 3, 10, 1, 'azul-oficina-2');
  return cerrarSuelo(l, { contacto: [17, 44, 10, 2], diagonales: true });
}

// ---------------------------------------------------------------------------
// Corona y guirnalda
// ---------------------------------------------------------------------------

/** Pinta una pieza de follaje navideño: verde con luz arriba a la izquierda, motas claras y oscuras. */
function follaje(l: Lienzo, x: number, y: number, luz: number, r: () => number): void {
  let c: ColorEntrada = 'planta-2';
  if (luz > 0.55) c = 'planta-3';
  else if (luz < -0.45) c = 'planta-1';
  const azarTono = r();
  if (azarTono > 0.9 && luz > -0.2) c = 'planta-4';
  else if (azarTono < 0.12) c = 'planta-1';
  l.px(x, y, c);
}

/** Bayas, bolitas doradas y una moña roja sobre una pieza redonda o larga. */
function adorno(l: Lienzo, x: number, y: number, tipo: 'baya' | 'bola' | 'oro'): void {
  if (tipo === 'baya') {
    l.rect(x, y, 2, 2, 'rojo-3');
    l.px(x, y, 'rojo-4');
  } else if (tipo === 'bola') {
    l.rect(x, y, 3, 3, 'rojo-3');
    l.px(x, y, 'neutro-7');
    l.px(x + 2, y + 2, 'rojo-1');
  } else {
    l.rect(x, y, 3, 3, 'tela-calida-2');
    l.px(x, y, 'neutro-7');
    l.px(x + 2, y + 2, 'tela-calida-1');
  }
}

/** Moña roja: dos lazos y un nudo, con colas. Centrada en `cx`, `cy`. */
function mona(l: Lienzo, cx: number, cy: number): void {
  // Colas.
  l.linea(cx - 1, cy + 1, cx - 4, cy + 5, 'rojo-2');
  l.linea(cx, cy + 1, cx - 3, cy + 5, 'rojo-3');
  l.linea(cx + 1, cy + 1, cx + 4, cy + 5, 'rojo-2');
  l.linea(cx + 2, cy + 1, cx + 5, cy + 5, 'rojo-1');
  // Lazos.
  l.elipse(cx - 4, cy - 1, 3, 2, 'rojo-3');
  l.elipse(cx + 5, cy - 1, 3, 2, 'rojo-2');
  l.rect(cx - 6, cy - 2, 3, 1, 'rojo-4');
  l.rect(cx - 5, cy - 1, 2, 1, 'rojo-3');
  l.rect(cx + 3, cy, 4, 1, 'rojo-1');
  // Nudo.
  l.rect(cx - 1, cy - 2, 3, 4, 'rojo-2');
  l.rect(cx - 1, cy - 2, 1, 4, 'rojo-3');
  l.px(cx - 1, cy - 2, 'rojo-4');
}

/** Corona navideña: aro de ramas de pino con bayas, bolitas doradas y una moña roja abajo. 32 x 32. */
export function dibujarCoronaS(): Lienzo {
  const l = new Lienzo(32, 32);
  const r = azar(31);
  const cx = 15.5;
  const cy = 10.5;
  for (let y = 0; y < 24; y++) {
    for (let x = 4; x < 28; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const d = Math.hypot(dx, dy * 1.04);
      const borde = 9.6 + Math.sin(Math.atan2(dy, dx) * 9) * 0.7;
      if (d < 4.4 || d > borde) continue;
      follaje(l, x, y, (-dx * 0.6 - dy * 0.8) / 8, r);
    }
  }
  // Ramitas sueltas hacia afuera: dan forma de pino.
  for (const [x, y] of [[15, 0], [16, 1], [5, 6], [26, 5], [4, 13], [27, 14], [8, 19], [23, 19]] as const) {
    l.px(x, y, 'planta-3');
    l.px(x + (x < 15 ? -1 : 1), y, 'planta-2');
  }
  adorno(l, 7, 8, 'baya');
  adorno(l, 8, 9, 'baya');
  adorno(l, 21, 4, 'baya');
  adorno(l, 22, 5, 'baya');
  adorno(l, 21, 17, 'oro');
  adorno(l, 10, 3, 'oro');
  adorno(l, 4, 12, 'bola');
  adorno(l, 24, 11, 'bola');
  mona(l, 16, 17);
  return cerrarColgante(l);
}

/** Corona vista de canto sobre la tapa de una pared vertical: tira de pino con una bola roja y una dorada. 32 x 32. */
export function dibujarCoronaLado(lado: 'E' | 'O'): Lienzo {
  const l = new Lienzo(32, 32);
  const r = azar(33);
  placaLateral(l, lado, 2, 20, 4, (i, j) => {
    const ancho = j < 2 || j > 17 ? 2 : 4;
    if (i >= ancho) return null;
    const tono = r();
    return i === 0 ? (tono > 0.6 ? 'planta-4' : 'planta-3') : i === 3 || (i === 1 && ancho === 2) ? 'planta-1' : tono > 0.85 ? 'planta-3' : 'planta-2';
  });
  placaLateral(l, lado, 7, 3, 3, (i, j) => (j === 0 && i === 0 ? 'neutro-7' : 'rojo-3'));
  placaLateral(l, lado, 13, 3, 3, (i, j) => (j === 0 && i === 0 ? 'neutro-7' : 'tela-calida-2'));
  placaLateral(l, lado, 17, 5, 4, (i, j) => (j < 2 ? 'rojo-3' : i < 2 ? 'rojo-2' : 'rojo-1'));
  return cerrarColgante(l);
}

/** Altura de la curva de la guirnalda en la columna `x` (cuelga entre dos clavos). */
function colgado(x: number): number {
  const u = (x - 3) / 57;
  return 4 + Math.round(9 * 4 * u * (1 - u));
}

/** Guirnalda de pino que cuelga entre dos clavos, con moñas rojas en los extremos, bolas y luces. 64 x 32. */
export function dibujarGuirnaldaS(): Lienzo {
  const l = new Lienzo(64, 32);
  const r = azar(41);
  for (let x = 3; x <= 60; x++) {
    const y = colgado(x);
    for (let k = -2; k <= 2; k++) {
      const ondulacion = Math.round(Math.sin(x * 0.9) * 0.6);
      const yy = y + k + ondulacion;
      follaje(l, x, yy, -k / 2.5 - 0.2 + (x < 30 ? 0.2 : 0), r);
    }
    if (x % 6 === 0) {
      l.px(x, y - 3, 'planta-3');
      l.px(x + 1, y + 3, 'planta-1');
    }
  }
  // Bolas y bayas colgando.
  for (const [x, tipo] of [[14, 'bola'], [24, 'oro'], [32, 'baya'], [40, 'oro'], [50, 'bola']] as const) adorno(l, x - 1, colgado(x) + 1, tipo);
  // Luces diminutas.
  for (const [x, c] of [[10, 'tela-calida-3'], [19, 'vidrio-2'], [28, 'rojo-4'], [36, 'planta-4'], [45, 'tela-calida-3'], [55, 'vidrio-2']] as const) l.px(x, colgado(x) - 3, c);
  // Moñas rojas en los clavos.
  mona(l, 9, 6);
  mona(l, 54, 6);
  // Clavos dorados.
  for (const x of [3, 60]) l.rect(x, 1, 2, 2, 'tela-calida-3');
  return cerrarColgante(l);
}

/** Guirnalda vista de canto sobre la tapa de una pared vertical: tira de pino que baja con bolas y luces. 32 x 64. */
export function dibujarGuirnaldaLado(lado: 'E' | 'O'): Lienzo {
  const l = new Lienzo(32, 64);
  const r = azar(43);
  placaLateral(l, lado, 2, 45, 4, (i, j) => {
    const ancho = j % 12 < 2 ? 3 : 4;
    if (i >= ancho) return null;
    const t = r();
    return i === 0 ? (t > 0.6 ? 'planta-4' : 'planta-3') : i === 3 ? 'planta-1' : t > 0.85 ? 'planta-3' : 'planta-2';
  });
  for (const [y, c] of [[8, 'rojo-3'], [20, 'tela-calida-2'], [32, 'rojo-3'], [41, 'tela-calida-2']] as const) placaLateral(l, lado, y, 3, 3, (i, j) => (i === 0 && j === 0 ? 'neutro-7' : c));
  placaLateral(l, lado, 47, 6, 4, (i, j) => (j < 2 ? 'rojo-3' : i < 2 ? 'rojo-2' : 'rojo-1'));
  return cerrarColgante(l);
}

// ---------------------------------------------------------------------------
// Reno
// ---------------------------------------------------------------------------

/** Reno de frente, de pelaje cálido, nariz roja grande, cuernos ramificados y bufanda con cascabel. 32 x 48, pezuñas en la fila 45. */
export function dibujarReno(): Lienzo {
  const l = new Lienzo(32, 48);
  const pelo = ['cuero-0', 'cuero-1', 'cuero-2', 'cuero-3'] as const;
  // Cuernos: ramas de madera clara que salen de la cabeza, cada una con dos puntas.
  for (const lado of [-1, 1]) {
    const x = (dx: number): number => 16 + lado * dx;
    trazo(l, x(5), 15, x(7), 8, 3, 2, 'madera-clara-2');
    trazo(l, x(7), 8, x(6), 2, 2, 2, 'madera-clara-2');
    trazo(l, x(7), 9, x(11), 4, 2, 2, 'madera-clara-2');
    trazo(l, x(6), 13, x(11), 11, 2, 2, 'madera-clara-2');
  }
  sombrearBordes(l, 'madera-clara-2', 'madera-clara-3', 'madera-clara-1');
  // Patas y pezuñas.
  for (const x of [9, 19]) {
    l.rect(x, 39, 4, 6, 'cuero-2');
    l.rect(x, 39, 1, 6, 'cuero-3');
    l.rect(x + 3, 39, 1, 6, 'cuero-1');
    l.rect(x, 44, 4, 2, 'madera-oscura-1');
    l.px(x, 44, 'madera-oscura-3');
  }
  // Cuerpo y pecho claro.
  volumen(l, 16, 36, 10.5, 7, (x, y) => enElipse(x, y, 16, 36, 10, 6.5), pelo, [0.3, 0.6, 0.86]);
  l.elipse(16, 38, 4, 3, 'crema-4');
  l.rect(13, 36, 3, 2, 'crema-4');
  // Orejas.
  for (const lado of [-1, 1]) {
    const cx = 16 + lado * 9;
    l.elipse(cx, 18, 3, 2, 'cuero-2', { angulo: lado * 25 });
    l.elipse(cx, 18, 1, 1, 'rojo-suave-4');
  }
  // Cabeza con luz a la izquierda.
  volumen(l, 15.5, 22, 8.5, 7.5, (x, y) => enElipse(x, y, 15.5, 22, 8, 7), pelo, [0.3, 0.6, 0.86]);
  // Hocico claro y nariz roja.
  l.elipse(16, 27, 5, 3, 'crema-4');
  l.rect(11, 28, 10, 2, 'crema-3');
  l.rect(14, 24, 5, 4, 'rojo-3');
  l.rect(14, 24, 5, 1, 'rojo-4');
  l.rect(17, 26, 2, 2, 'rojo-2');
  l.px(14, 25, 'neutro-7');
  // Ojos con brillo.
  for (const x of [11, 20]) {
    l.rect(x, 19, 2, 3, 'azul-oficina-0');
    l.px(x, 19, 'neutro-7');
  }
  // Boca.
  l.px(14, 29, 'azul-oficina-1');
  l.px(18, 29, 'azul-oficina-1');
  l.px(15, 30, 'azul-oficina-1');
  l.px(17, 30, 'azul-oficina-1');
  // Bufanda a rayas y cascabel.
  for (let x = 8; x <= 24; x++) {
    const raya = Math.floor((x - 8) / 3) % 2 === 0;
    l.px(x, 30 + (x < 10 || x > 22 ? 1 : 0), raya ? 'planta-3' : 'rojo-3');
    l.px(x, 31 + (x < 10 || x > 22 ? 1 : 0), raya ? 'planta-2' : 'rojo-2');
  }
  l.rect(16, 32, 3, 3, 'tela-calida-3');
  l.px(16, 32, 'neutro-7');
  l.px(18, 34, 'tela-calida-1');
  return cerrarSuelo(l, { contacto: [17, 45, 10, 1], diagonales: true });
}

// ---------------------------------------------------------------------------
// Calcetines
// ---------------------------------------------------------------------------

/** Un calcetín de Navidad: puño blanco, caña, talón y punta de otro color; el pie apunta a la derecha. */
function calcetin(l: Lienzo, x: number, y: number, tonos: readonly [ColorEntrada, ColorEntrada, ColorEntrada, ColorEntrada], detalle: readonly [ColorEntrada, ColorEntrada]): void {
  const [oscuro, medio, claro, brillo] = tonos;
  // Caña.
  l.rect(x + 1, y + 3, 6, 9, medio);
  l.rect(x + 1, y + 3, 2, 9, claro);
  l.rect(x + 6, y + 3, 1, 9, oscuro);
  // Pie, hacia la derecha, con talón y punta de otro color.
  l.rect(x + 1, y + 11, 10, 5, medio);
  l.rect(x + 1, y + 11, 10, 1, claro);
  l.rect(x + 1, y + 15, 10, 1, oscuro);
  l.rect(x + 7, y + 12, 4, 4, detalle[0]);
  l.rect(x + 1, y + 12, 3, 4, detalle[0]);
  l.px(x + 7, y + 12, detalle[1]);
  // Puño de piel blanca.
  l.rect(x, y + 1, 8, 3, 'neutro-7');
  l.rect(x + 5, y + 2, 3, 2, 'neutro-6');
  l.rect(x + 1, y, 6, 1, 'neutro-6');
  // Pliegue y brillo.
  l.px(x + 2, y + 5, brillo);
  l.px(x + 2, y + 6, brillo);
  // Gancho.
  l.rect(x + 3, y - 2, 2, 3, 'tela-calida-2');
  l.px(x + 3, y - 2, 'tela-calida-3');
}

/** Dos calcetines de Navidad, uno rojo y uno verde, colgados de una vara de madera con una ramita de acebo. 32 x 32. */
export function dibujarCalcetinesS(): Lienzo {
  const l = new Lienzo(32, 32);
  // Vara.
  l.rect(2, 1, 28, 2, 'madera-oscura-2');
  l.rect(2, 1, 28, 1, 'madera-oscura-3');
  l.rect(1, 0, 2, 4, 'tela-calida-2');
  l.rect(29, 0, 2, 4, 'tela-calida-2');
  l.px(1, 0, 'tela-calida-3');
  l.px(29, 0, 'tela-calida-3');
  calcetin(l, 4, 3, ['rojo-1', 'rojo-3', 'rojo-4', 'neutro-7'], ['planta-3', 'planta-4']);
  calcetin(l, 18, 3, ['planta-1', 'planta-2', 'planta-3', 'planta-4'], ['rojo-3', 'rojo-4']);
  // Acebo en el centro de la vara.
  l.rect(14, 3, 2, 2, 'planta-3');
  l.rect(16, 3, 2, 1, 'planta-2');
  l.px(15, 5, 'rojo-3');
  l.px(16, 5, 'rojo-3');
  l.px(16, 6, 'rojo-2');
  return cerrarColgante(l);
}

/** Calcetines vistos de canto sobre la tapa de una pared vertical: vara y dos calcetines delgados. 32 x 32. */
export function dibujarCalcetinesLado(lado: 'E' | 'O'): Lienzo {
  const l = new Lienzo(32, 32);
  placaLateral(l, lado, 1, 21, 1, () => 'madera-oscura-2');
  placaLateral(l, lado, 3, 9, 4, (i, j) => (j < 2 ? 'neutro-7' : j >= 7 ? (i < 3 ? 'planta-3' : 'planta-2') : i < 3 ? 'rojo-3' : 'rojo-1'));
  placaLateral(l, lado, 13, 9, 4, (i, j) => (j < 2 ? 'neutro-7' : j >= 7 ? (i < 3 ? 'rojo-3' : 'rojo-1') : i < 3 ? 'planta-2' : 'planta-1'));
  return cerrarColgante(l);
}

// ---------------------------------------------------------------------------
// Registro
// ---------------------------------------------------------------------------

export function cuadrosNavidad(): Cuadros {
  const c: Cuadros = new Map();
  registrar(c, 'pesebre', 'U', dibujarPesebre());
  registrar(c, 'muneco-nieve', 'U', dibujarMunecoNieve());
  registrar(c, 'corona-navidena', 'S', dibujarCoronaS());
  registrar(c, 'corona-navidena', 'E', dibujarCoronaLado('E'));
  registrar(c, 'corona-navidena', 'O', dibujarCoronaLado('O'));
  registrar(c, 'guirnalda', 'S', dibujarGuirnaldaS());
  registrar(c, 'guirnalda', 'E', dibujarGuirnaldaLado('E'));
  registrar(c, 'guirnalda', 'O', dibujarGuirnaldaLado('O'));
  registrar(c, 'reno', 'U', dibujarReno());
  registrar(c, 'calcetin-chimenea', 'S', dibujarCalcetinesS());
  registrar(c, 'calcetin-chimenea', 'E', dibujarCalcetinesLado('E'));
  registrar(c, 'calcetin-chimenea', 'O', dibujarCalcetinesLado('O'));
  return c;
}

void quitar;
