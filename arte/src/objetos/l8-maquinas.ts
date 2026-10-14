/**
 * Lote 8, máquinas del taller y de la oficina: impresoras 3D, multifunción, plotter, CNC, brazos robóticos y la máquina
 * de montaje de componentes.
 *
 * Reglas (ver `l8-comun.ts` y `GUIA-ESTILO-GATHER-V2.md`):
 *  - Las dos impresoras 3D van sobre un escritorio: su borde de abajo queda en la fila `pie(16)` y se cierran con
 *    `cerrarApoyado`.
 *  - Lo demás es de piso: se cierra con `cerrarSuelo` (contorno y sombra de dos tonos abajo a la derecha).
 *  - Luz arriba a la izquierda, 3 a 4 tonos por material, luces indicadoras en tonos claros y saturados.
 *  - Cada objeto lleva un cartel de advertencia en franjas amarillas y negras o una pieza que lo identifique.
 */

import { Lienzo } from '../nucleo';
import type { ColorEntrada } from '../nucleo';
import { AZ, MT, NE, PZ, VI, cerrarApoyado, cerrarSuelo, pie, registrar } from './l8-comun';
import type { Cuadros } from './l8-comun';

// ---------------------------------------------------------------------------
// Materiales: cada uno va de la sombra profunda a la luz
// ---------------------------------------------------------------------------

type Tonos = readonly [ColorEntrada, ColorEntrada, ColorEntrada, ColorEntrada];

/** Carcasa clara de oficina (gris azulado casi blanco). */
const CLARO: Tonos = [PZ(2), PZ(3), PZ(4), PZ(5)];
/** Carcasa de taller, más oscura. */
const TALLER: Tonos = [PZ(0), PZ(1), PZ(2), PZ(3)];
/** Plástico azul marino de los paneles. */
const MARINO: Tonos = [AZ(0), AZ(1), AZ(2), AZ(3)];
/** Pintura amarilla industrial: la sombra vira al naranja. */
const AMARILLO: Tonos = ['naranja-1', 'tela-calida-1', 'tela-calida-2', 'tela-calida-3'];
/** Pintura naranja. */
const NARANJA: Tonos = ['naranja-0', 'naranja-1', 'naranja-2', 'naranja-3'];
/** Pintura blanca de los robots colaborativos. */
const BLANCO: Tonos = [PZ(2), PZ(3), PZ(4), NE(7)];
/** Acero. */
const ACERO: Tonos = [MT(0), MT(1), MT(2), MT(3)];

const NEGRO_FRANJA: ColorEntrada = 'neutro-1';

// ---------------------------------------------------------------------------
// Piezas comunes
// ---------------------------------------------------------------------------

/** Caja con luz arriba y a la izquierda, sombra a la derecha y abajo. `t` va de la sombra profunda a la luz. */
function caja(l: Lienzo, x: number, y: number, w: number, h: number, t: Tonos): void {
  l.rect(x, y, w, h, t[2]);
  l.rect(x, y, w, 1, t[3]);
  l.rect(x, y + 1, 1, h - 1, t[3]);
  l.rect(x + w - 1, y + 1, 1, h - 1, t[1]);
  l.rect(x + 1, y + h - 1, w - 1, 1, t[1]);
}

/** Franjas diagonales amarillas y negras (cartel de advertencia). */
function franjas(l: Lienzo, x: number, y: number, w: number, h: number, ancho = 3): void {
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      l.px(x + i, y + j, (i + j) % (ancho * 2) < ancho ? 'tela-calida-3' : NEGRO_FRANJA);
    }
  }
}

/** Cartel cuadrado de peligro: fondo amarillo, borde negro y un signo de exclamación. */
function cartelPeligro(l: Lienzo, x: number, y: number, lado = 7): void {
  l.rect(x, y, lado, lado, 'tela-calida-3');
  l.rect(x, y, lado, 1, NEGRO_FRANJA);
  l.rect(x, y + lado - 1, lado, 1, NEGRO_FRANJA);
  l.rect(x, y, 1, lado, NEGRO_FRANJA);
  l.rect(x + lado - 1, y, 1, lado, NEGRO_FRANJA);
  const c = x + Math.floor(lado / 2);
  l.rect(c, y + 1, 1, lado - 4, NEGRO_FRANJA);
  l.px(c, y + lado - 2, NEGRO_FRANJA);
}

/** Tornillo de 1 px. */
function tornillo(l: Lienzo, x: number, y: number): void {
  l.px(x, y, MT(3));
}

/**
 * Barra gruesa de `(x0, y0)` a `(x1, y1)` con volumen: la cara que mira a la luz (arriba a la izquierda) es la más clara
 * y la de abajo a la derecha la más oscura. `t` va de la sombra profunda a la luz.
 */
function barra(l: Lienzo, x0: number, y0: number, x1: number, y1: number, ancho: number, t: Tonos): void {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const largo = Math.hypot(dx, dy);
  const ux = dx / largo;
  const uy = dy / largo;
  let nx = -uy;
  let ny = ux;
  if (nx * -0.7 + ny * -0.7 < 0) {
    nx = -nx;
    ny = -ny;
  }
  const m = ancho / 2;
  const xa = Math.floor(Math.min(x0, x1) - m - 1);
  const xb = Math.ceil(Math.max(x0, x1) + m + 1);
  const ya = Math.floor(Math.min(y0, y1) - m - 1);
  const yb = Math.ceil(Math.max(y0, y1) + m + 1);
  for (let y = ya; y <= yb; y++) {
    for (let x = xa; x <= xb; x++) {
      const px = x + 0.5 - (x0 + 0.5);
      const py = y + 0.5 - (y0 + 0.5);
      const a = (px * ux + py * uy) / largo;
      if (a < 0 || a > 1) continue;
      const s = px * nx + py * ny;
      if (Math.abs(s) > m) continue;
      const r = s / m;
      l.px(x, y, r > 0.3 ? t[3] : r < -0.5 ? t[1] : t[2]);
    }
  }
}

/** Articulación redonda de un brazo: disco marino con la luz arriba a la izquierda y un eje de acero al centro. */
function junta(l: Lienzo, cx: number, cy: number, r: number, color: Tonos = MARINO): void {
  l.elipse(cx, cy, r, r, color[1]);
  l.elipse(cx - 1, cy - 1, r - 1, r - 1, color[2]);
  l.px(cx - r + 1, cy - 1, color[3]);
  l.px(cx - 1, cy - r + 1, color[3]);
  l.rect(cx - 1, cy - 1, 2, 2, MT(2));
  l.px(cx - 1, cy - 1, MT(3));
}

/** Carrete visto de lado: aro de plástico claro, filamento de color y un agujero en el centro. */
function carrete(l: Lienzo, cx: number, cy: number, r: number, filamento: Tonos = NARANJA): void {
  l.elipse(cx, cy, r, r, NE(4));
  l.elipse(cx - 1, cy - 1, r - 1, r - 1, NE(6));
  l.elipse(cx, cy, r - 1, r - 1, filamento[2], { relleno: false });
  l.elipse(cx, cy, r - 2, r - 2, filamento[2]);
  l.elipse(cx - 1, cy - 1, r - 2, r - 2, filamento[3], { relleno: false });
  l.elipse(cx, cy, 1, 1, AZ(0));
  l.px(cx, cy, MT(2));
}

/** Pieza impresa en capas: pirámide escalonada que sube desde `base` (fila de abajo). */
function piezaImpresa(l: Lienzo, xCentro: number, base: number, anchoBase: number, filas: number, t: Tonos = NARANJA): void {
  for (let k = 0; k < filas; k++) {
    const w = anchoBase - k * 2;
    if (w < 2) break;
    const y = base - k;
    const x = xCentro - Math.floor(w / 2);
    l.rect(x, y, w, 1, k % 2 === 0 ? t[2] : t[3]);
    l.px(x, y, t[3]);
    l.px(x + w - 1, y, t[1]);
  }
}

/** Cilindro horizontal con volumen (rollo de papel, rodillo). `t` va de la sombra a la luz, de 4 tonos. */
function cilindroH(l: Lienzo, x: number, y: number, w: number, h: number, t: Tonos): void {
  const n = h;
  for (let j = 0; j < n; j++) {
    const f = j / Math.max(1, n - 1);
    const tono = f < 0.2 ? t[3] : f < 0.55 ? t[2] : f < 0.85 ? t[1] : t[0];
    l.rect(x, y + j, w, 1, tono);
  }
}

/** Luz indicadora de 2 x 1 con un punto blanco. */
function luz(l: Lienzo, x: number, y: number, color: ColorEntrada): void {
  l.rect(x, y, 2, 1, color);
}

// ---------------------------------------------------------------------------
// 1. Impresora 3D cerrada (1 x 1 apoyada, sobresale 16): 32 x 48, borde de abajo en la fila 26
// ---------------------------------------------------------------------------

function impresora3dCerrada(): Lienzo {
  const l = new Lienzo(32, 48);
  const fb = pie(16);
  // Carrete de filamento sobre la tapa.
  carrete(l, 16, 5, 4);
  l.rect(14, 8, 5, 1, MT(1));
  // Carcasa.
  caja(l, 4, 8, 24, fb - 8 + 1, CLARO);
  // Tapa azul con una ranura.
  l.rect(5, 9, 22, 2, VI(1));
  l.rect(5, 9, 22, 1, VI(2));
  l.rect(5, 10, 22, 1, VI(0));
  l.rect(9, 9, 6, 1, VI(3));
  // Ventana de vidrio: marco y fondo oscuro.
  l.rect(6, 12, 20, 11, AZ(0));
  l.rect(7, 13, 18, 9, AZ(2));
  l.rect(7, 13, 18, 4, AZ(3));
  l.rect(7, 17, 18, 1, AZ(2));
  // Riel y carro del cabezal.
  l.rect(8, 14, 16, 1, MT(2));
  l.rect(8, 15, 16, 1, MT(1));
  l.rect(14, 14, 5, 3, MT(3));
  l.rect(14, 16, 5, 1, MT(1));
  l.rect(15, 17, 3, 1, MT(2));
  l.px(16, 18, 'naranja-3');
  // Cama de impresión.
  l.rect(8, 20, 16, 2, MT(2));
  l.rect(8, 20, 16, 1, MT(3));
  l.rect(8, 21, 16, 1, MT(1));
  // Pieza naranja ya impresa.
  piezaImpresa(l, 16, 19, 8, 3);
  // Reflejos en el vidrio.
  l.linea(8, 19, 11, 16, VI(2));
  l.linea(8, 17, 9, 16, VI(3));
  l.linea(21, 19, 23, 17, VI(2));
  // Panel de abajo: pantalla, luces y perilla.
  l.rect(7, 24, 7, 2, AZ(0));
  l.rect(8, 24, 3, 1, VI(3));
  l.rect(8, 25, 5, 1, VI(2));
  luz(l, 17, 25, 'planta-4');
  luz(l, 20, 25, 'tela-calida-3');
  l.rect(23, 24, 3, 2, MT(1));
  l.px(23, 24, MT(3));
  l.px(24, 24, MT(2));
  // Pie.
  l.rect(5, fb, 22, 1, CLARO[0]);
  tornillo(l, 5, 23);
  tornillo(l, 26, 23);
  return cerrarApoyado(l);
}

// ---------------------------------------------------------------------------
// 2. Impresora 3D abierta (1 x 1 apoyada, sobresale 16): marco con pórtico y carrete lateral
// ---------------------------------------------------------------------------

function impresora3dAbierta(): Lienzo {
  const l = new Lienzo(32, 48);
  const fb = pie(16);
  // Postes del marco.
  caja(l, 3, 3, 3, 20, ACERO);
  caja(l, 19, 3, 3, 20, ACERO);
  // Travesaño de arriba con tornillos.
  caja(l, 3, 3, 19, 3, ACERO);
  tornillo(l, 5, 4);
  tornillo(l, 20, 4);
  // Pórtico naranja del eje X con el cabezal.
  caja(l, 6, 8, 13, 3, NARANJA);
  l.rect(6, 10, 13, 1, 'naranja-0');
  caja(l, 10, 10, 6, 4, MARINO);
  l.rect(11, 11, 4, 1, VI(2));
  l.rect(11, 14, 4, 1, MT(3));
  l.px(12, 15, 'naranja-4');
  l.px(13, 15, 'naranja-3');
  // Pieza a medio imprimir: vasija de capas que sube desde la cama.
  const capas: ReadonlyArray<readonly [number, number]> = [[16, 8], [17, 8], [18, 10], [19, 10], [20, 10]];
  capas.forEach(([y, w], k) => {
    const x = 12 - Math.floor(w / 2);
    l.rect(x, y, w, 1, k % 2 === 0 ? 'naranja-3' : 'naranja-2');
    l.px(x, y, 'naranja-4');
    l.px(x + w - 1, y, 'naranja-1');
  });
  l.px(11, 15, 'naranja-3');
  // Cama de impresión.
  l.rect(5, 21, 15, 2, MT(2));
  l.rect(5, 21, 15, 1, MT(3));
  l.rect(5, 22, 15, 1, MT(1));
  // Base con pantalla y luces.
  caja(l, 3, 23, 19, fb - 23 + 1, MARINO);
  l.rect(5, 24, 6, 2, AZ(0));
  l.rect(6, 24, 3, 1, VI(3));
  l.rect(6, 25, 4, 1, VI(2));
  luz(l, 14, 25, 'planta-4');
  luz(l, 17, 25, 'naranja-3');
  // Carrete lateral con su soporte y el tubo hacia el cabezal.
  l.rect(24, 12, 1, 8, MT(1));
  l.rect(23, 19, 4, 2, MT(2));
  carrete(l, 25, 9, 4);
  l.linea(21, 11, 15, 13, NE(6));
  l.linea(22, 10, 21, 11, NE(5));
  return cerrarApoyado(l);
}

// ---------------------------------------------------------------------------
// 3. Impresora multifunción (2 x 1, sobresale 16): 64 x 48
// ---------------------------------------------------------------------------

function impresoraOficina(): Lienzo {
  const l = new Lienzo(64, 48);
  // Hojas en la bandeja del alimentador.
  l.rect(8, 1, 24, 2, NE(7));
  l.rect(8, 2, 24, 1, NE(5));
  l.rect(10, 1, 10, 1, NE(6));
  // Alimentador de documentos.
  caja(l, 5, 3, 34, 4, CLARO);
  l.rect(6, 5, 32, 1, CLARO[1]);
  // Tapa del escáner.
  caja(l, 2, 7, 58, 6, CLARO);
  l.rect(3, 11, 56, 1, VI(1));
  l.rect(3, 12, 56, 1, AZ(1));
  // Cuerpo.
  caja(l, 4, 13, 54, 30, CLARO);
  // Panel de control inclinado: pantalla, botones y arranque.
  caja(l, 38, 14, 18, 8, MARINO);
  l.rect(40, 15, 8, 5, AZ(0));
  l.rect(41, 16, 6, 1, VI(3));
  l.rect(41, 17, 4, 1, VI(2));
  l.rect(41, 18, 5, 1, VI(2));
  for (let j = 0; j < 2; j++) for (let i = 0; i < 3; i++) l.px(50 + i * 2, 15 + j * 2, (i + j) % 2 === 0 ? NE(5) : AZ(4));
  l.rect(50, 19, 2, 1, 'planta-4');
  l.rect(53, 19, 2, 1, 'rojo-suave-3');
  // Salida de papel: hueco oscuro, hojas que salen y el labio de la bandeja.
  l.rect(7, 16, 30, 11, AZ(0));
  l.rect(8, 17, 28, 9, AZ(1));
  l.rect(8, 17, 28, 1, AZ(2));
  l.rect(10, 22, 24, 5, NE(7));
  l.rect(10, 22, 24, 1, NE(6));
  l.rect(12, 24, 12, 1, VI(2));
  l.rect(12, 25, 8, 1, NE(4));
  l.rect(10, 26, 24, 1, NE(5));
  l.rect(7, 27, 30, 1, CLARO[0]);
  // Dos cassettes de papel con asa y etiqueta de tamaño.
  for (const y of [30, 37]) {
    caja(l, 6, y, 50, 6, CLARO);
    l.rect(22, y + 2, 18, 1, AZ(1));
    l.rect(22, y + 3, 18, 1, NE(7));
    l.rect(49, y + 1, 4, 3, NE(7));
    l.px(50, y + 2, 'tela-calida-3');
    l.px(52, y + 2, VI(2));
    luz(l, 8, y + 2, y === 30 ? 'planta-4' : AZ(3));
  }
  l.rect(5, 36, 52, 1, AZ(1));
  // Cartel de advertencia (zona caliente) en el costado.
  franjas(l, 41, 24, 10, 2, 2);
  // Zócalo y patas.
  l.rect(6, 43, 50, 1, AZ(2));
  l.rect(6, 44, 5, 1, AZ(1));
  l.rect(51, 44, 5, 1, AZ(1));
  for (const x of [8, 53]) tornillo(l, x, 14);
  return cerrarSuelo(l);
}

// ---------------------------------------------------------------------------
// 4. Impresora de gran formato (3 x 1, sobresale 16): 96 x 48
// ---------------------------------------------------------------------------

function impresoraGranFormato(): Lienzo {
  const l = new Lienzo(96, 48);
  // Patas y travesaño del soporte.
  for (const x of [8, 82]) {
    l.rect(x, 24, 4, 19, MT(2));
    l.rect(x, 24, 1, 19, MT(3));
    l.rect(x + 3, 24, 1, 19, MT(1));
    l.rect(x - 2, 42, 8, 2, AZ(1));
    l.rect(x - 2, 42, 8, 1, AZ(2));
  }
  l.rect(12, 33, 70, 2, MT(2));
  l.rect(12, 33, 70, 1, MT(3));
  l.rect(12, 35, 70, 1, MT(1));
  // Rollo de papel arriba, con sus tapas.
  cilindroH(l, 12, 1, 56, 6, [NE(3), NE(4), NE(6), NE(7)]);
  l.rect(10, 1, 3, 6, AZ(1));
  l.rect(10, 1, 3, 1, AZ(3));
  l.rect(68, 1, 3, 6, AZ(1));
  l.rect(68, 1, 3, 1, AZ(3));
  l.rect(14, 3, 20, 1, VI(1));
  // Cuerpo del plotter.
  caja(l, 4, 7, 87, 17, CLARO);
  l.rect(5, 9, 85, 2, VI(1));
  l.rect(5, 9, 85, 1, VI(2));
  l.rect(5, 10, 85, 1, VI(0));
  // Ventana de los cartuchos de tinta.
  l.rect(8, 12, 17, 8, AZ(0));
  const tintas: readonly ColorEntrada[] = [VI(2), 'rojo-suave-3', 'tela-calida-3', NE(2)];
  tintas.forEach((c, i) => {
    l.rect(10 + i * 4, 13, 3, 6, c);
    l.rect(10 + i * 4, 13, 1, 6, i === 3 ? NE(4) : NE(7));
    l.rect(12 + i * 4, 13, 1, 6, AZ(1));
  });
  // Panel de control: pantalla y botones.
  caja(l, 68, 12, 20, 9, MARINO);
  l.rect(70, 13, 9, 6, AZ(0));
  l.rect(71, 14, 7, 1, VI(3));
  l.rect(71, 15, 5, 1, VI(2));
  l.rect(71, 16, 6, 1, 'planta-4');
  l.rect(71, 17, 3, 1, 'tela-calida-3');
  for (let i = 0; i < 4; i++) l.px(81 + i * 2, 14, i % 2 === 0 ? NE(5) : AZ(4));
  l.rect(81, 17, 2, 2, 'planta-4');
  l.rect(85, 17, 2, 2, 'rojo-suave-3');
  // Ranura de salida.
  l.rect(10, 21, 68, 2, AZ(0));
  // Plano que sale: hoja azul con cuadrícula y un dibujo, cada vez más ancha hacia abajo.
  for (let j = 0; j < 19; j++) {
    const y = 22 + j;
    const xa = 14 - Math.floor(j / 3);
    const xb = 74 + Math.floor(j / 3);
    l.rect(xa, y, xb - xa + 1, 1, VI(0));
    l.px(xa, y, VI(1));
    l.px(xb, y, AZ(1));
  }
  l.rect(8, 40, 74, 1, NE(6));
  // Cuadrícula del plano.
  for (let j = 24; j < 40; j += 4) l.rect(14, j, 60, 1, VI(1));
  for (let i = 18; i < 72; i += 8) l.rect(i, 23, 1, 17, VI(1));
  // Dibujo de una planta: muros y puerta en blanco.
  l.rect(24, 27, 32, 1, NE(7));
  l.rect(24, 37, 32, 1, NE(7));
  l.rect(24, 27, 1, 11, NE(7));
  l.rect(55, 27, 1, 11, NE(7));
  l.rect(38, 27, 1, 6, NE(7));
  l.rect(38, 36, 1, 2, NE(7));
  l.rect(26, 29, 5, 3, VI(2));
  l.rect(46, 30, 7, 4, VI(2));
  l.px(40, 28, 'tela-calida-3');
  l.px(41, 28, 'tela-calida-3');
  // Franjas de advertencia en el costado derecho y tornillos.
  franjas(l, 56, 20, 9, 2, 2);
  for (const [x, y] of [[6, 8], [88, 8], [6, 22], [88, 22]] as const) tornillo(l, x, y);
  return cerrarSuelo(l);
}

// ---------------------------------------------------------------------------
// 5. Máquina CNC (2 x 2, sobresale 16): 64 x 80
// ---------------------------------------------------------------------------

function maquinaCnc(): Lienzo {
  const l = new Lienzo(64, 80);
  // Luz de torre sobre la cabina: tres segmentos.
  l.rect(41, 6, 5, 3, MT(1));
  l.rect(41, 6, 1, 3, MT(2));
  for (const [y, c, c2] of [[1, 'rojo-suave-3', 'rojo-suave-4'], [3, 'tela-calida-3', 'tela-calida-3'], [5, 'planta-4', 'planta-4']] as const) {
    l.rect(41, y, 5, 2, c);
    l.px(41, y, c2);
  }
  // Cabina de seguridad.
  caja(l, 3, 8, 45, 67, TALLER);
  // Techo con rejillas de ventilación.
  l.rect(4, 9, 43, 4, TALLER[2]);
  for (let i = 0; i < 6; i++) l.rect(8 + i * 3, 10, 2, 2, TALLER[0]);
  // Puerta: marco marino y vidrio de seguridad.
  l.rect(6, 14, 38, 35, AZ(1));
  l.rect(6, 14, 38, 1, AZ(3));
  l.rect(6, 14, 1, 35, AZ(3));
  l.rect(7, 15, 36, 33, AZ(0));
  // Interior: pared del fondo con luz de trabajo.
  l.rect(8, 16, 34, 31, AZ(1));
  l.rect(8, 16, 34, 1, 'tela-calida-3');
  l.rect(8, 17, 34, 1, AZ(2));
  // Pórtico y carro del husillo.
  caja(l, 8, 21, 34, 3, ACERO);
  l.rect(8, 23, 34, 1, MT(0));
  caja(l, 21, 24, 10, 8, NARANJA);
  l.rect(22, 27, 8, 1, 'naranja-1');
  l.px(23, 29, MT(3));
  // Husillo y herramienta.
  caja(l, 24, 32, 5, 6, ACERO);
  l.rect(26, 38, 2, 4, MT(3));
  l.px(26, 42, 'naranja-4');
  // Mesa de trabajo con ranuras en T.
  l.rect(9, 43, 32, 4, MT(2));
  l.rect(9, 43, 32, 1, MT(3));
  l.rect(9, 44, 32, 1, MT(1));
  for (let i = 0; i < 8; i++) l.rect(11 + i * 4, 45, 2, 1, MT(1));
  l.rect(9, 46, 32, 1, MT(0));
  // Pieza de madera con una cavidad ya fresada.
  l.rect(14, 38, 22, 4, 'madera-clara-4');
  l.rect(14, 38, 22, 1, NE(7));
  l.rect(14, 42, 22, 1, 'madera-clara-2');
  l.rect(35, 39, 1, 4, 'madera-clara-1');
  l.rect(20, 39, 10, 2, 'madera-clara-1');
  l.rect(21, 39, 8, 1, 'madera-clara-2');
  l.px(17, 40, 'madera-clara-3');
  l.px(32, 40, 'madera-clara-3');
  // Virutas sobre la mesa.
  for (const x of [12, 33, 38, 11]) l.px(x, 43, 'madera-clara-4');
  // Reflejos del vidrio de la puerta.
  l.linea(36, 27, 40, 23, VI(1));
  l.linea(35, 33, 40, 28, VI(0));
  l.linea(10, 30, 12, 28, VI(1));
  // Manija de la puerta.
  caja(l, 44, 27, 3, 11, ACERO);
  // Base: dos puertas con asa y rejillas.
  l.rect(4, 50, 43, 1, TALLER[0]);
  for (const x of [6, 26]) {
    l.rect(x, 52, 19, 15, TALLER[1]);
    l.rect(x, 52, 19, 1, TALLER[3]);
    l.rect(x, 52, 1, 15, TALLER[3]);
    l.rect(x + 8, 55, 3, 1, MT(3));
    l.rect(x + 8, 56, 3, 1, MT(1));
  }
  for (let k = 0; k < 3; k++) l.rect(9, 59 + k * 2, 10, 1, TALLER[0]);
  cartelPeligro(l, 31, 58);
  franjas(l, 5, 68, 41, 3, 3);
  l.rect(4, 71, 43, 1, TALLER[0]);
  l.rect(5, 72, 4, 3, AZ(1));
  l.rect(42, 72, 4, 3, AZ(1));
  // Brazo y consola de control.
  l.rect(47, 22, 5, 3, MT(2));
  l.rect(47, 22, 5, 1, MT(3));
  caja(l, 51, 18, 10, 28, MARINO);
  l.rect(53, 20, 7, 7, AZ(0));
  l.rect(54, 21, 5, 1, 'planta-4');
  l.rect(54, 23, 3, 1, VI(2));
  l.rect(54, 25, 5, 1, 'tela-calida-3');
  l.px(53, 20, NE(7));
  for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) l.px(53 + i * 2, 29 + j * 2, (i + j) % 3 === 0 ? 'tela-calida-3' : NE(5));
  l.elipse(56, 38, 2, 2, MT(2));
  l.px(55, 37, MT(3));
  l.elipse(56, 43, 2, 1, 'tela-calida-3');
  l.rect(55, 43, 2, 1, 'rojo-suave-3');
  l.px(55, 42, 'rojo-suave-4');
  return cerrarSuelo(l);
}

// ---------------------------------------------------------------------------
// 6. Brazo robótico de garra (1 x 1, sobresale 32): 32 x 64
// ---------------------------------------------------------------------------

function garra(l: Lienzo, x: number, y: number): void {
  // Muñeca y palma de la pinza, con dos dedos que se cierran hacia adentro.
  caja(l, x, y, 9, 4, MARINO);
  l.px(x + 4, y + 1, 'planta-4');
  for (const lado of [0, 1] as const) {
    const fx = lado === 0 ? x : x + 6;
    l.rect(fx, y + 4, 3, 6, ACERO[2]);
    l.rect(fx, y + 4, 1, 6, ACERO[3]);
    l.rect(fx + 2, y + 4, 1, 6, ACERO[1]);
    // Punta que gira hacia el centro.
    const tx = lado === 0 ? fx + 3 : fx - 2;
    l.rect(tx, y + 9, 2, 2, ACERO[2]);
    l.px(tx, y + 9, ACERO[3]);
    l.px(lado === 0 ? tx + 1 : tx, y + 10, ACERO[1]);
  }
}

function robotGarra(): Lienzo {
  const l = new Lienzo(32, 64);
  // Placa de la base con tornillos y franjas.
  caja(l, 5, 54, 21, 6, MARINO);
  franjas(l, 6, 57, 19, 2, 2);
  tornillo(l, 7, 55);
  tornillo(l, 23, 55);
  // Torre giratoria amarilla con una luz.
  caja(l, 9, 46, 14, 9, AMARILLO);
  l.rect(10, 50, 12, 1, AMARILLO[1]);
  l.rect(10, 53, 12, 1, AMARILLO[0]);
  luz(l, 11, 52, 'planta-4');
  // Brazo inferior, codo, antebrazo y muñeca.
  barra(l, 15, 46, 9, 23, 7, AMARILLO);
  barra(l, 9, 23, 22, 9, 6, AMARILLO);
  junta(l, 15, 45, 4);
  junta(l, 9, 22, 4);
  junta(l, 22, 8, 3);
  // Garra de dos dedos.
  garra(l, 18, 12);
  // Cable de la torre.
  l.linea(22, 51, 25, 53, AZ(2));
  return cerrarSuelo(l, { contacto: [15, 58, 11, 2] });
}

// ---------------------------------------------------------------------------
// 7. Brazo robótico con herramienta (1 x 1, sobresale 32): 32 x 64, pintura blanca con soldador
// ---------------------------------------------------------------------------

function robotHerramienta(): Lienzo {
  const l = new Lienzo(32, 64);
  // Mesa de soldadura a la izquierda: pieza de acero con el cordón.
  caja(l, 1, 44, 8, 14, TALLER);
  l.rect(0, 42, 11, 3, MT(2));
  l.rect(0, 42, 11, 1, MT(3));
  l.rect(0, 44, 11, 1, MT(1));
  l.rect(2, 42, 6, 1, 'naranja-3');
  l.rect(3, 48, 4, 1, MT(3));
  l.rect(3, 50, 4, 1, TALLER[0]);
  // Pedestal redondo con tornillos.
  l.elipse(16, 56, 11, 3, AZ(1));
  l.elipse(15, 55, 10, 2, AZ(2));
  l.rect(6, 55, 21, 3, AZ(1));
  l.rect(6, 55, 21, 1, AZ(3));
  for (const x of [9, 15, 21]) tornillo(l, x, 57);
  // Torre blanca con banda azul y luz.
  caja(l, 10, 46, 13, 9, BLANCO);
  l.rect(11, 50, 11, 2, VI(1));
  l.rect(11, 50, 11, 1, VI(2));
  luz(l, 12, 53, 'tela-calida-3');
  cartelPeligro(l, 18, 47, 3);
  // Brazos blancos.
  barra(l, 16, 46, 23, 24, 7, BLANCO);
  barra(l, 23, 24, 10, 10, 6, BLANCO);
  junta(l, 16, 45, 4);
  junta(l, 23, 23, 4);
  junta(l, 10, 10, 3);
  // Banda azul del antebrazo.
  barra(l, 18, 19, 14, 15, 6, [VI(0), VI(0), VI(1), VI(2)]);
  // Soldador: mango, cuello y boquilla de cobre que apunta a la pieza.
  barra(l, 9, 13, 7, 30, 4, MARINO);
  barra(l, 7, 30, 7, 35, 3, ACERO);
  l.rect(6, 35, 3, 3, 'naranja-2');
  l.rect(6, 35, 1, 3, 'naranja-3');
  l.px(7, 38, 'naranja-4');
  // Chispas.
  for (const [x, y, c] of [[4, 39, 'tela-calida-3'], [9, 39, NE(7)], [6, 40, NE(7)], [11, 38, 'naranja-3'], [2, 38, 'tela-calida-3'], [8, 41, 'tela-calida-3']] as const) l.px(x, y, c);
  return cerrarSuelo(l, { contacto: [16, 58, 11, 2] });
}

// ---------------------------------------------------------------------------
// 8. Máquina de montaje de componentes (2 x 2, sobresale 16): 64 x 80
// ---------------------------------------------------------------------------

function pickAndPlace(): Lienzo {
  const l = new Lienzo(64, 80);
  // Baliza de torre.
  l.rect(52, 7, 5, 3, MT(1));
  for (const [y, c] of [[1, 'rojo-suave-3'], [3, 'tela-calida-3'], [5, 'planta-4']] as const) {
    l.rect(52, y, 5, 2, c);
  }
  // Marco superior.
  caja(l, 3, 10, 57, 6, TALLER);
  // Zona de trabajo abierta.
  l.rect(3, 16, 57, 34, AZ(1));
  l.rect(3, 16, 57, 1, AZ(2));
  // Montantes laterales.
  caja(l, 3, 16, 4, 34, TALLER);
  caja(l, 56, 16, 4, 34, TALLER);
  // Viga del eje X con el cabezal de boquillas.
  caja(l, 7, 20, 49, 4, ACERO);
  l.rect(7, 23, 49, 1, MT(0));
  caja(l, 31, 24, 8, 7, MARINO);
  l.rect(32, 26, 6, 1, VI(2));
  for (const x of [32, 34, 36]) l.rect(x, 31, 1, 3, MT(3));
  l.px(33, 27, 'planta-4');
  // Mesa con rieles de transporte.
  l.rect(7, 42, 49, 7, PZ(3));
  l.rect(7, 42, 49, 1, PZ(5));
  l.rect(7, 47, 49, 2, PZ(1));
  l.rect(7, 40, 49, 1, MT(3));
  l.rect(7, 41, 49, 1, MT(1));
  // Alimentadores bajo las bobinas: bloque marino con ranuras de cinta.
  caja(l, 7, 36, 24, 4, MARINO);
  for (const x of [12, 17, 22, 27]) l.rect(x, 38, 2, 1, AZ(0));
  l.px(9, 37, 'planta-4');
  l.px(10, 37, 'tela-calida-3');
  // Placa verde con componentes.
  l.rect(32, 39, 21, 8, 'planta-1');
  l.rect(32, 39, 21, 1, 'planta-3');
  l.rect(32, 39, 1, 8, 'planta-3');
  l.rect(52, 40, 1, 7, 'planta-0');
  l.rect(33, 46, 20, 1, 'planta-0');
  for (const [x, y, w, h] of [[35, 41, 4, 3], [41, 41, 3, 2], [46, 42, 4, 3], [38, 45, 5, 1]] as const) {
    l.rect(x, y, w, h, AZ(0));
    l.px(x, y, AZ(3));
  }
  for (let i = 0; i < 7; i++) l.px(33 + i * 3, 40, 'tela-calida-3');
  l.px(50, 41, 'tela-calida-3');
  l.px(47, 46, 'tela-calida-3');
  // Dos bobinas de componentes con su cinta, que baja al alimentador.
  for (const cx of [13, 25]) {
    l.rect(cx - 1, 33, 3, 3, 'tela-calida-2');
    l.px(cx - 1, 33, 'tela-calida-3');
    l.elipse(cx, 28, 6, 6, NE(4));
    l.elipse(cx - 1, 27, 5, 5, NE(6));
    l.elipse(cx, 28, 4, 4, 'tela-calida-2');
    l.elipse(cx - 1, 27, 3, 3, 'tela-calida-3', { relleno: false });
    l.elipse(cx, 28, 1, 1, AZ(0));
    l.px(cx, 28, MT(2));
    l.px(cx, 25, AZ(0));
    l.px(cx, 31, AZ(0));
    l.px(cx - 3, 28, AZ(0));
    l.px(cx + 3, 28, AZ(0));
  }
  // Riel por donde viaja la placa.
  l.rect(32, 38, 21, 1, MT(2));
  // Base con puertas, rejillas y franjas de advertencia.
  l.rect(4, 50, 55, 1, TALLER[0]);
  caja(l, 3, 51, 57, 22, TALLER);
  for (const x of [6, 32]) {
    l.rect(x, 54, 25, 12, TALLER[1]);
    l.rect(x, 54, 25, 1, TALLER[3]);
    l.rect(x, 54, 1, 12, TALLER[3]);
    l.rect(x + 20, 58, 1, 4, MT(3));
  }
  for (let k = 0; k < 3; k++) l.rect(11, 58 + k * 2, 14, 1, TALLER[0]);
  cartelPeligro(l, 39, 56);
  luz(l, 49, 57, 'planta-4');
  luz(l, 49, 60, 'tela-calida-3');
  franjas(l, 4, 67, 55, 3, 3);
  l.rect(4, 70, 55, 1, TALLER[0]);
  l.rect(5, 73, 4, 2, AZ(1));
  l.rect(54, 73, 4, 2, AZ(1));
  return cerrarSuelo(l);
}

export function cuadrosMaquinas(): Cuadros {
  const c: Cuadros = new Map();
  registrar(c, 'impresora-3d-cerrada', 'S', impresora3dCerrada());
  registrar(c, 'impresora-3d-abierta', 'S', impresora3dAbierta());
  registrar(c, 'impresora-oficina', 'S', impresoraOficina());
  registrar(c, 'impresora-gran-formato', 'S', impresoraGranFormato());
  registrar(c, 'maquina-cnc', 'S', maquinaCnc());
  registrar(c, 'robot-garra', 'S', robotGarra());
  registrar(c, 'robot-herramienta', 'S', robotHerramienta());
  registrar(c, 'maquina-pick-and-place', 'S', pickAndPlace());
  return c;
}
