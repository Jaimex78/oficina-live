/**
 * Lote 13, el resto del exterior (22 objetos): troncos y tocón, fogatas, parrillas, carros de comida, antorcha tiki, carretilla,
 * tendedero, flamingo de césped, paca de heno, panel solar, turbina, condensador de aire, arco de otoño, mojón, mástil de cintas
 * y fuegos artificiales. Todo de orientación única.
 *
 * Variantes por recoloreo: los carros de comida se dibujan con la rampa `rojo` (toldo y cuerpo) y pasan a azul y amarillo.
 */

import { Lienzo } from '../nucleo';
import type { ColorEntrada } from '../nucleo';
import { dentroElipse } from './l2b-comun';
import {
  AZ, CE, CM, CR, HOJA, MO, NA, NE, ME, PL, RO, RS, TC, VI, WC, WO,
  azar, ent, hex, pasto, poligono, registrarR, roca, rueda, sueloLibre, tronco,
} from './l13-comun';
import type { Cuadros } from './l13-comun';

// ---------------------------------------------------------------------------
// Troncos y tocón
// ---------------------------------------------------------------------------

/** Cara cortada de un tronco con anillos. */
function caraTronco(l: Lienzo, cx: number, cy: number, rx: number, ry: number): void {
  l.elipseSombreada(cx, cy, rx, ry, [WC(1), WC(2), WC(3), WC(4)], { relieve: 0.6 });
  if (rx >= 4) l.elipse(cx, cy, Math.round(rx * 0.6), Math.round(ry * 0.6), WC(1), { relleno: false });
  if (rx >= 6) l.elipse(cx, cy, Math.round(rx * 0.25), Math.round(ry * 0.25), WC(1), { relleno: false });
  l.px(cx, cy, WC(1));
}

function troncoTumbado(largo: number, ancho: number): Lienzo {
  const l = new Lienzo(ancho * 32, 32);
  const x1 = largo + 2;
  l.rect(8, 12, x1 - 8, 15, WO(2));
  l.rect(8, 12, x1 - 8, 3, WO(3));
  l.rect(8, 24, x1 - 8, 3, WO(1));
  const r = azar(101 + largo);
  for (let x = 10; x < x1 - 6; x += ent(r, 5, 9)) l.rect(x, ent(r, 15, 22), ent(r, 3, 6), 1, WO(1));
  l.elipse(x1, 19, 3, 7, WO(1));
  l.px(x1 - 1, 12, WO(3));
  caraTronco(l, 8, 19, 6, 8);
  l.rect(Math.round(x1 / 2), 10, 3, 2, 'cesped-2');
  l.px(Math.round(x1 / 2) + 1, 9, 'cesped-3');
  return sueloLibre(l);
}

function tocon(): Lienzo {
  const l = new Lienzo(32, 40);
  l.elipse(16, 33, 10, 3, WO(2));
  l.rect(6, 17, 20, 16, WO(2));
  l.rect(6, 17, 3, 16, WO(3));
  l.rect(22, 17, 4, 16, WO(1));
  const r = azar(111);
  for (let y = 21; y < 32; y += ent(r, 3, 4)) l.rect(ent(r, 9, 12), y, ent(r, 3, 5), 1, WO(1));
  // Raíces.
  l.rect(3, 31, 4, 3, WO(2));
  l.rect(25, 31, 4, 3, WO(1));
  l.elipse(16, 17, 10, 5, WC(3));
  l.elipse(16, 17, 8, 3, WC(3), { relleno: false });
  l.elipse(16, 17, 5, 2, WC(2), { relleno: false });
  l.px(16, 17, WC(1));
  l.rect(8, 16, 3, 1, WC(4));
  pasto(l, [[3, 35], [29, 35]]);
  return sueloLibre(l);
}

// ---------------------------------------------------------------------------
// Fuego
// ---------------------------------------------------------------------------

/** Llama grande de tres capas. `(cx, yb)` es el centro de la base. */
function fuego(l: Lienzo, cx: number, yb: number, h: number): void {
  poligono(l, [[cx - 6, yb], [cx - 4, yb - Math.round(h * 0.4)], [cx - 5, yb - Math.round(h * 0.55)], [cx - 1, yb - h], [cx + 1, yb - Math.round(h * 0.65)], [cx + 4, yb - Math.round(h * 0.75)], [cx + 6, yb - Math.round(h * 0.3)], [cx + 6, yb]], NA(2));
  poligono(l, [[cx - 4, yb], [cx - 3, yb - Math.round(h * 0.4)], [cx, yb - Math.round(h * 0.78)], [cx + 3, yb - Math.round(h * 0.4)], [cx + 4, yb]], NA(3));
  poligono(l, [[cx - 2, yb], [cx - 1, yb - Math.round(h * 0.4)], [cx + 1, yb - Math.round(h * 0.5)], [cx + 2, yb]], TC(3));
  l.px(cx, yb - 1, CR(4));
  l.px(cx, yb - 2, CR(4));
}

function fogataPozo(): Lienzo {
  const l = new Lienzo(32, 48);
  const cx = 16;
  const piedras = (atras: boolean): void => {
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const y = 38 + Math.sin(a) * 6;
      if ((y < 38) === atras) roca(l, Math.round(cx + Math.cos(a) * 12), Math.round(y), 3, 3, false);
    }
  };
  l.elipse(cx, 38, 11, 5, WO(0));
  piedras(true);
  l.elipse(cx, 38, 8, 3, NE(1));
  l.linea(8, 40, 22, 35, WO(2));
  l.linea(9, 41, 23, 36, WO(1));
  l.linea(10, 35, 23, 41, WO(3));
  l.linea(10, 36, 24, 42, WO(1));
  fuego(l, cx, 38, 24);
  piedras(false);
  return sueloLibre(l);
}

function fogataAbierta(): Lienzo {
  const l = new Lienzo(32, 48);
  const cx = 16;
  l.elipse(cx, 40, 12, 4, NE(1));
  l.elipse(cx, 40, 9, 3, NE(2));
  for (const [x, y] of [[8, 40], [14, 43], [22, 41], [18, 38]] as const) l.px(x, y, NE(3));
  // Leños apoyados formando una tienda.
  l.linea(7, 42, 15, 30, WO(2));
  l.linea(8, 42, 16, 30, WO(1));
  l.linea(25, 42, 17, 30, WO(2));
  l.linea(24, 42, 16, 30, WO(1));
  l.linea(13, 43, 16, 31, WO(3));
  fuego(l, cx, 40, 22);
  l.linea(10, 41, 22, 40, WO(2));
  l.linea(10, 42, 22, 41, WO(1));
  roca(l, 4, 42, 3, 2, false);
  roca(l, 28, 42, 3, 2, false);
  roca(l, 14, 46, 3, 2, false);
  return sueloLibre(l);
}

function antorchaTiki(): Lienzo {
  const l = new Lienzo(32, 64);
  l.elipse(16, 58, 7, 2, WO(1));
  l.elipse(16, 57, 5, 1, WO(2));
  l.rect(14, 24, 4, 34, WC(2));
  l.rect(14, 24, 1, 34, WC(3));
  l.rect(17, 24, 1, 34, WC(1));
  for (let y = 30; y < 57; y += 8) l.rect(14, y, 4, 1, WC(0));
  // Copa de la llama con aro de cuerda.
  l.rect(10, 19, 12, 6, WO(2));
  l.rect(10, 19, 2, 6, WO(3));
  l.rect(20, 19, 2, 6, WO(1));
  l.rect(9, 17, 14, 3, WO(3));
  l.rect(9, 19, 14, 1, WO(1));
  l.px(14, 22, WO(4));
  fuego(l, 16, 18, 17);
  return sueloLibre(l);
}

// ---------------------------------------------------------------------------
// Parrillas
// ---------------------------------------------------------------------------

function parrillaParque(): Lienzo {
  const l = new Lienzo(32, 56);
  // Poste y base.
  l.rect(14, 34, 5, 17, ME(2));
  l.rect(14, 34, 1, 17, ME(3));
  l.rect(18, 34, 1, 17, ME(1));
  l.elipse(16, 51, 7, 2, ME(1));
  l.elipse(15, 50, 5, 1, ME(2));
  // Caja con carbón y parrilla.
  l.rect(4, 25, 24, 10, ME(1));
  l.rect(4, 25, 24, 1, ME(2));
  l.rect(4, 25, 2, 10, ME(2));
  l.rect(26, 26, 2, 9, ME(0));
  l.rect(4, 34, 24, 1, ME(0));
  l.rect(4, 15, 24, 10, ME(2));
  l.rect(4, 15, 24, 1, ME(3));
  l.rect(5, 16, 22, 8, NE(1));
  l.rect(6, 17, 20, 6, NA(1));
  for (const [x, y] of [[8, 19], [12, 21], [16, 18], [20, 20], [23, 22], [10, 18]] as const) l.px(x, y, NA(3));
  l.px(14, 20, TC(3));
  l.px(21, 19, TC(3));
  for (let x = 6; x < 26; x += 3) l.rect(x, 16, 1, 8, ME(3));
  l.rect(5, 19, 22, 1, ME(2));
  // Asa.
  l.linea(28, 18, 31, 14, ME(2));
  return sueloLibre(l);
}

function parrillaBola(): Lienzo {
  const l = new Lienzo(32, 56);
  // Patas, rueda y bandeja de ceniza.
  l.linea(10, 36, 7, 51, ME(1));
  l.linea(11, 36, 8, 51, ME(2));
  l.linea(22, 36, 25, 51, ME(1));
  l.linea(21, 36, 24, 51, ME(0));
  l.linea(16, 38, 16, 51, ME(1));
  l.elipse(16, 42, 7, 2, ME(1));
  rueda(l, 25, 50, 2);
  // Cuenco y tapa.
  l.elipseSombreada(16, 32, 11, 8, [RO(1), RO(2), RO(3), RO(4)], { relieve: 0.85 });
  l.elipseSombreada(16, 24, 11, 10, [RO(1), RO(2), RO(3), RO(4)], { relieve: 0.9 });
  l.rect(5, 28, 22, 2, NE(1));
  l.rect(5, 28, 4, 1, NE(3));
  l.elipse(16, 17, 1, 1, ME(2));
  l.px(21, 20, NE(7));
  l.px(20, 19, NE(7));
  // Asa de la tapa.
  l.linea(10, 15, 22, 15, ME(2));
  l.linea(9, 17, 10, 15, ME(1));
  l.linea(23, 17, 22, 15, ME(1));
  return sueloLibre(l);
}

// ---------------------------------------------------------------------------
// Carros de comida (2 x 1, 32 de alto extra)
// ---------------------------------------------------------------------------

/** Toldo de rayas con borde festoneado; `(x0, x1)` son los bordes y `yb` la fila de abajo. */
function toldo(l: Lienzo, x0: number, x1: number, y0: number, yb: number, plano = false): void {
  const w = x1 - x0;
  const pts: [number, number][] = plano ? [[x0, yb], [x0 + 3, y0], [x1 - 3, y0], [x1, yb]] : [[x0, yb], [x0 + Math.round(w * 0.15), y0 + 5], [x0 + Math.round(w * 0.5), y0], [x1 - Math.round(w * 0.15), y0 + 5], [x1, yb]];
  poligono(l, pts, 'neutro-7');
  for (let k = 0; ; k++) {
    const xa = x0 + k * 14 + 2;
    if (xa > x1) break;
    for (let y = y0; y <= yb; y++) for (let x = xa; x < xa + 7 && x <= x1; x++) if (l.leerHex(x, y) === '#FFFFFF') l.px(x, y, RO(3));
  }
  // Sombra a la derecha y festón de abajo.
  for (let y = y0; y <= yb; y++) for (let x = x1 - 10; x <= x1; x++) {
    const h = l.leerHex(x, y);
    if (h === '#FFFFFF') l.px(x, y, NE(5));
    else if (h !== null && h.toUpperCase() === '#EF3B3A') l.px(x, y, RO(2));
  }
  for (let x = x0 + 3; x < x1; x += 7) {
    const c: ColorEntrada = Math.floor((x - x0) / 7) % 2 === 0 ? 'neutro-7' : RO(3);
    l.elipse(x, yb + 1, 3, 2, c);
  }
}

function carroPerrosCalientes(): Lienzo {
  const l = new Lienzo(64, 64);
  // Asa y pata de apoyo.
  l.linea(58, 38, 63, 33, ME(2));
  l.rect(4, 52, 3, 6, ME(1));
  // Cuerpo.
  l.rect(6, 33, 52, 19, RO(3));
  l.rect(6, 33, 3, 19, RO(4));
  l.rect(55, 33, 3, 19, RO(2));
  l.rect(6, 49, 52, 3, RO(1));
  l.rect(6, 40, 52, 3, 'neutro-7');
  l.rect(55, 40, 3, 3, NE(5));
  // Mostrador.
  l.rect(4, 30, 56, 4, NE(6));
  l.rect(4, 30, 56, 1, 'neutro-7');
  l.rect(4, 33, 56, 1, NE(4));
  // Perro caliente dibujado en el frente: pan, salchicha y mostaza.
  l.elipse(32, 47, 10, 3, TC(3));
  l.elipse(32, 46, 9, 2, RS(2));
  l.linea(25, 46, 39, 46, TC(2));
  l.px(27, 45, TC(3));
  l.px(33, 45, TC(3));
  // Botellas de kétchup y mostaza y un platillo.
  l.rect(10, 23, 4, 7, RO(2));
  l.rect(11, 21, 2, 2, NE(7));
  l.rect(16, 24, 4, 6, TC(2));
  l.rect(17, 22, 2, 2, NE(7));
  l.elipse(46, 28, 6, 1, 'neutro-7');
  l.rect(42, 26, 8, 2, TC(3));
  l.rect(43, 25, 6, 1, RS(2));
  // Palo y toldo.
  l.rect(31, 12, 2, 18, ME(2));
  toldo(l, 4, 60, 4, 20);
  // Ruedas.
  rueda(l, 20, 56, 4);
  rueda(l, 46, 56, 4);
  return sueloLibre(l);
}

function carroPiragua(): Lienzo {
  const l = new Lienzo(64, 64);
  l.linea(58, 38, 63, 33, ME(2));
  l.rect(4, 52, 3, 6, ME(1));
  // Cuerpo claro con rayas rojas.
  l.rect(6, 33, 52, 19, NE(6));
  l.rect(6, 33, 3, 19, 'neutro-7');
  l.rect(55, 33, 3, 19, NE(5));
  for (let x = 10; x < 54; x += 8) l.rect(x, 36, 4, 14, RO(3));
  l.rect(6, 49, 52, 3, NE(4));
  l.rect(4, 30, 56, 4, NE(6));
  l.rect(4, 30, 56, 1, 'neutro-7');
  l.rect(4, 33, 56, 1, NE(4));
  // Frascos de jarabe de colores.
  const jarabes: ColorEntrada[] = [RS(3), VI(2), PL(3), TC(3), MO(3), NA(3)];
  jarabes.forEach((c, i) => {
    const x = 8 + i * 6;
    l.rect(x, 22, 4, 8, c);
    l.rect(x, 22, 1, 8, 'neutro-7');
    l.rect(x + 1, 19, 2, 3, NE(7));
  });
  // Bloque de hielo y vasito de cono.
  l.rect(46, 20, 10, 10, VI(3));
  l.rect(46, 20, 3, 10, 'neutro-7');
  l.rect(53, 21, 3, 9, VI(2));
  l.px(50, 23, 'neutro-7');
  // Toldo plano sostenido por dos postes.
  l.rect(5, 12, 2, 18, ME(2));
  l.rect(57, 12, 2, 18, ME(2));
  toldo(l, 2, 62, 3, 14, true);
  rueda(l, 20, 56, 4);
  rueda(l, 46, 56, 4);
  return sueloLibre(l);
}

// ---------------------------------------------------------------------------
// Jardín y patio
// ---------------------------------------------------------------------------

function carretilla(): Lienzo {
  const l = new Lienzo(32, 40);
  // Asas y pata.
  l.linea(21, 22, 31, 27, WC(2));
  l.linea(21, 23, 31, 28, WC(1));
  l.rect(23, 26, 2, 9, WC(1));
  // Cajón con tierra y plantitas.
  poligono(l, [[5, 14], [27, 14], [23, 26], [9, 26]], RO(2));
  l.rect(5, 14, 22, 1, RO(4));
  l.linea(6, 15, 9, 25, RO(3));
  l.linea(7, 15, 10, 25, RO(3));
  l.linea(26, 15, 23, 25, RO(1));
  l.linea(25, 15, 22, 25, RO(1));
  l.elipse(16, 13, 10, 3, WO(1));
  l.elipse(15, 12, 8, 2, WO(2));
  l.hoja([12, 13], [9, 6], 4, HOJA);
  l.hoja([17, 13], [19, 5], 4, HOJA);
  l.hoja([20, 13], [24, 8], 4, HOJA);
  rueda(l, 7, 29, 5);
  l.rect(5, 24, 3, 3, ME(2));
  return sueloLibre(l);
}

function tendedero(): Lienzo {
  const l = new Lienzo(96, 64);
  // Postes con travesaño.
  for (const x of [3, 89]) {
    tronco(l, x, 14, 59, 4, WO, x);
    l.rect(x - 3, 12, 10, 3, WO(3));
    l.rect(x - 3, 14, 10, 1, WO(1));
  }
  l.elipse(5, 59, 5, 2, WO(1));
  l.elipse(91, 59, 5, 2, WO(1));
  const yLinea = (x: number): number => 14 + Math.round(4 * Math.sin((Math.PI * (x - 7)) / 82));
  for (let x = 7; x <= 89; x++) l.px(x, yLinea(x), NE(3));
  const prenda = (x: number, w: number, h: number, c: ColorEntrada, luz: ColorEntrada, sombra: ColorEntrada): void => {
    const y = yLinea(x + Math.floor(w / 2)) + 1;
    l.rect(x, y, w, h, c);
    l.rect(x, y, 2, h, luz);
    l.rect(x + w - 2, y, 2, h, sombra);
    l.rect(x, y + h - 1, w, 1, sombra);
    l.rect(x + 2, y - 1, 1, 3, WC(3));
    l.rect(x + w - 3, y - 1, 1, 3, WC(3));
  };
  // Camiseta con mangas, toalla, pantalón, medias y vestido.
  prenda(15, 14, 15, VI(2), VI(3), VI(1));
  l.rect(12, yLinea(22) + 1, 3, 6, VI(2));
  l.rect(29, yLinea(22) + 1, 3, 6, VI(1));
  prenda(36, 12, 20, RS(3), RS(4), RS(2));
  l.rect(37, yLinea(42) + 8, 10, 2, 'neutro-7');
  prenda(52, 10, 18, AZ(2), AZ(3), AZ(1));
  l.rect(56, yLinea(57) + 12, 1, 6, AZ(1));
  prenda(67, 4, 8, TC(3), CR(4), TC(1));
  prenda(73, 4, 8, PL(3), PL(4), PL(1));
  return sueloLibre(l);
}

function flamingo(): Lienzo {
  const l = new Lienzo(32, 48);
  pasto(l, [[10, 44], [13, 45], [21, 45], [24, 44]]);
  // Patas finas.
  l.linea(15, 43, 15, 32, RS(2));
  l.linea(19, 43, 20, 38, RS(2));
  l.linea(20, 38, 17, 33, RS(2));
  l.rect(12, 43, 5, 1, RS(1));
  l.rect(18, 43, 4, 1, RS(1));
  // Cola, cuerpo y ala.
  l.hoja([11, 28], [3, 31], 5, [RS(1), RS(2), RS(3), RS(4)]);
  l.elipseSombreada(16, 29, 8, 5, [RS(1), RS(2), RS(3), RS(4)], { relieve: 0.8 });
  l.elipseSombreada(14, 29, 5, 3, [RS(1), RS(1), RS(2), RS(3)], { relieve: 0.6 });
  // Cuello en S y cabeza con pico.
  for (const [x0, y0, x1, y1] of [[20, 27, 23, 22], [23, 22, 20, 17], [20, 17, 20, 12]] as const) {
    l.linea(x0, y0, x1, y1, RS(3));
    l.linea(x0 + 1, y0, x1 + 1, y1, RS(2));
  }
  l.elipse(20, 10, 3, 2, RS(3));
  l.px(22, 11, 'neutro-6');
  l.px(23, 12, NE(1));
  l.px(23, 11, NE(1));
  l.px(19, 9, NE(0));
  return sueloLibre(l);
}

function pacaHeno(): Lienzo {
  const l = new Lienzo(32, 40);
  l.rect(12, 14, 14, 20, TC(2));
  l.rect(12, 14, 14, 2, TC(3));
  l.rect(12, 32, 14, 2, TC(1));
  l.elipse(26, 24, 3, 10, TC(1));
  for (const x of [17, 22]) l.rect(x, 14, 1, 20, WO(3));
  l.elipseSombreada(12, 24, 9, 10, [TC(1), TC(2), TC(3), CR(4)], { relieve: 0.55 });
  l.elipse(12, 24, 6, 7, TC(1), { relleno: false });
  l.elipse(12, 24, 3, 4, TC(1), { relleno: false });
  l.px(12, 24, WO(3));
  for (const [x, y] of [[3, 19], [20, 15], [5, 31], [24, 33], [8, 15]] as const) l.px(x, y, CR(3));
  l.px(2, 28, TC(3));
  l.px(1, 29, TC(2));
  return sueloLibre(l);
}

function panelSolar(): Lienzo {
  const l = new Lienzo(64, 56);
  // Patas y refuerzo.
  l.rect(14, 38, 3, 14, ME(1));
  l.rect(47, 38, 3, 14, ME(1));
  l.linea(15, 46, 48, 46, ME(2));
  l.rect(10, 51, 11, 1, ME(0));
  l.rect(43, 51, 11, 1, ME(0));
  // Marco y celdas en perspectiva.
  poligono(l, [[10, 12], [54, 12], [61, 41], [3, 41]], ME(2));
  const pt = (u: number, v: number): [number, number] => {
    const xa = 13 + (51 - 13) * u;
    const xb = 8 + (56 - 8) * u;
    return [Math.round(xa + (xb - xa) * v), Math.round(15 + (38 - 15) * v)];
  };
  poligono(l, [pt(0, 0), pt(1, 0), pt(1, 1), pt(0, 1)], VI(0));
  for (let i = 0; i <= 6; i++) {
    const [x0, y0] = pt(i / 6, 0);
    const [x1, y1] = pt(i / 6, 1);
    l.linea(x0, y0, x1, y1, AZ(1));
  }
  for (let j = 0; j <= 4; j++) {
    const [x0, y0] = pt(0, j / 4);
    const [x1, y1] = pt(1, j / 4);
    l.linea(x0, y0, x1, y1, AZ(1));
  }
  // Reflejos.
  for (const [u, v] of [[0.1, 0.1], [0.28, 0.12], [0.5, 0.35], [0.8, 0.6]] as const) {
    const [x, y] = pt(u, v);
    l.rect(x, y, 3, 2, VI(1));
    l.px(x, y, VI(2));
  }
  l.rect(4, 40, 56, 2, ME(1));
  l.rect(3, 41, 58, 1, ME(0));
  l.rect(10, 12, 44, 1, ME(3));
  return sueloLibre(l);
}

function turbina(): Lienzo {
  const l = new Lienzo(64, 128);
  // Torre troncocónica con luz a la izquierda.
  poligono(l, [[30, 40], [34, 40], [38, 123], [26, 123]], NE(6));
  poligono(l, [[30, 40], [31, 40], [32, 123], [26, 123]], 'neutro-7');
  poligono(l, [[33, 40], [34, 40], [38, 123], [34, 123]], NE(4));
  l.rect(24, 120, 16, 4, NE(4));
  l.rect(24, 120, 16, 1, NE(6));
  l.rect(29, 80, 6, 1, NE(5));
  // Góndola y buje.
  l.rect(26, 32, 12, 9, NE(6));
  l.rect(26, 32, 12, 2, 'neutro-7');
  l.rect(36, 33, 2, 8, NE(4));
  l.rect(26, 40, 12, 1, NE(4));
  // Aspas: una arriba y dos abajo.
  for (const [x, y] of [[32, 8], [56, 50], [8, 50]] as const) l.hoja([32, 35], [x, y], 8, [NE(4), NE(5), NE(6), 'neutro-7']);
  l.elipseSombreada(32, 35, 4, 4, [NE(3), NE(4), NE(5), NE(6)]);
  l.px(31, 34, 'neutro-7');
  return sueloLibre(l);
}

function condensador(): Lienzo {
  const l = new Lienzo(32, 40);
  // Patas, cuerpo con rejillas laterales y tapa con el ventilador.
  for (const x of [6, 22]) l.rect(x, 34, 4, 2, NE(2));
  l.rect(4, 21, 24, 13, NE(6));
  l.rect(4, 21, 2, 13, 'neutro-7');
  l.rect(26, 21, 2, 13, NE(4));
  for (let y = 24; y < 33; y += 2) l.rect(7, y, 17, 1, NE(4));
  l.rect(4, 33, 24, 1, NE(4));
  l.rect(4, 11, 24, 11, NE(5));
  l.rect(4, 11, 24, 1, NE(6));
  l.elipse(15, 16, 9, 4, NE(3));
  l.elipse(15, 16, 7, 3, NE(1));
  l.linea(9, 16, 21, 16, NE(3));
  l.linea(12, 13, 18, 19, NE(3));
  l.linea(18, 13, 12, 19, NE(3));
  l.elipse(15, 16, 2, 1, NE(5));
  // Tuberías.
  l.rect(27, 27, 4, 2, ME(2));
  l.rect(27, 30, 4, 2, 'neutro-4');
  return sueloLibre(l);
}

function arcoOtono(): Lienzo {
  const l = new Lienzo(96, 80);
  for (const x of [5, 85]) {
    tronco(l, x, 22, 76, 6, WC, x);
    l.elipse(x + 3, 76, 6, 2, WO(1));
  }
  for (let x = 8; x <= 88; x++) {
    const y = 24 - Math.round(18 * Math.sin((Math.PI * (x - 8)) / 80));
    l.rect(x, y, 1, 5, WC(2));
    l.px(x, y, WC(3));
    l.px(x, y + 4, WC(1));
  }
  // Hojas de otoño sobre el arco y los postes, y una guirnalda que cuelga.
  const r = azar(121);
  const hojas: ColorEntrada[] = [NA(2), NA(3), RO(2), TC(2), NA(1), RO(3), PL(2), TC(3)];
  const hoja = (x: number, y: number): void => {
    const c = hojas[ent(r, 0, hojas.length - 1)] as ColorEntrada;
    l.elipse(x, y, 2, 2, c);
    l.px(x - 1, y - 1, hojas[ent(r, 1, 3)] as ColorEntrada);
  };
  for (let x = 6; x <= 90; x += 3) hoja(x, 24 - Math.round(18 * Math.sin((Math.PI * (x - 8)) / 80)) + ent(r, -1, 6));
  for (const px of [5, 85]) for (let y = 24; y < 60; y += 4) hoja(px + ent(r, 0, 6), y + ent(r, 0, 2));
  for (const x of [22, 38, 58, 74]) {
    const ya = 24 - Math.round(18 * Math.sin((Math.PI * (x - 8)) / 80)) + 5;
    for (let k = 0; k < 3; k++) hoja(x + ent(r, -1, 1), ya + 2 + k * 4);
  }
  for (const x of [12, 90]) l.elipseSombreada(x, 72, 5, 4, [NA(0), NA(1), NA(2), NA(3)]);
  return sueloLibre(l);
}

function mojon(): Lienzo {
  const l = new Lienzo(32, 40);
  l.rect(8, 31, 16, 4, CM(1));
  l.rect(8, 31, 16, 1, CM(2));
  l.rect(10, 15, 12, 17, CM(2));
  l.rect(10, 15, 3, 17, CM(3));
  l.rect(19, 15, 3, 17, CM(1));
  l.elipse(16, 15, 6, 3, CM(3));
  l.rect(10, 22, 12, 3, 'neutro-7');
  l.rect(19, 22, 3, 3, NE(5));
  l.px(12, 14, 'neutro-7');
  return sueloLibre(l);
}

function mastilCintas(): Lienzo {
  const l = new Lienzo(32, 96);
  l.elipse(16, 90, 8, 2, WO(1));
  l.elipse(15, 89, 6, 1, WO(2));
  tronco(l, 14, 12, 90, 4, WC, 131);
  const cintas: [number, number, ColorEntrada][] = [
    [3, 86, RS(3)], [9, 91, VI(2)], [23, 91, TC(3)], [29, 85, PL(3)], [5, 72, MO(3)], [27, 70, NA(3)],
  ];
  for (const [x, y, c] of cintas) {
    for (let k = 0; k < 2; k++) {
      const x0 = 16 + k;
      let px = x0;
      let py = 14;
      for (let t = 1; t <= 20; t++) {
        const f = t / 20;
        const nx = Math.round(x0 + (x - x0) * f + Math.sin(f * 9) * 2);
        const ny = Math.round(14 + (y - 14) * f);
        l.linea(px, py, nx, ny, k === 0 ? c : (c as string).replace(/-\d$/, (m) => `-${Math.max(0, Number(m.slice(1)) - 1)}`));
        px = nx;
        py = ny;
      }
    }
  }
  // Corona de flores arriba.
  l.elipse(16, 10, 8, 3, PL(2));
  for (const [x, y, c] of [[10, 9, RS(3)], [15, 7, TC(3)], [21, 9, MO(3)], [13, 12, NE(7)], [19, 12, RS(3)]] as const) l.px(x, y, c);
  l.elipse(16, 6, 2, 2, TC(3));
  return sueloLibre(l);
}

function cajaFuegos(): Lienzo {
  const l = new Lienzo(32, 40);
  // Cohetes que asoman de la caja.
  const cohetes: [number, ColorEntrada][] = [[10, RO(3)], [16, VI(2)], [22, TC(3)]];
  for (const [x, c] of cohetes) {
    l.rect(x, 8, 1, 14, WC(2));
    poligono(l, [[x - 2, 14], [x + 3, 14], [x, 6]], c);
    l.rect(x - 2, 14, 5, 3, 'neutro-6');
    l.px(x - 1, 8, 'neutro-7');
  }
  l.rect(4, 21, 24, 14, WC(2));
  l.rect(4, 21, 24, 2, WC(3));
  l.rect(4, 33, 24, 2, WC(1));
  l.rect(26, 22, 2, 12, WC(1));
  l.rect(4, 27, 24, 1, WC(1));
  l.rect(9, 24, 14, 8, 'neutro-7');
  l.rect(9, 31, 14, 1, NE(5));
  poligono(l, [[16, 25], [19, 29], [16, 31], [13, 29]], RO(3));
  l.px(16, 28, TC(3));
  return sueloLibre(l);
}

function cohete(): Lienzo {
  const l = new Lienzo(32, 64);
  l.elipse(16, 58, 7, 2, WO(1));
  l.rect(15, 38, 2, 21, WC(2));
  l.rect(15, 38, 1, 21, WC(3));
  l.rect(12, 14, 8, 26, NE(6));
  l.rect(12, 14, 2, 26, 'neutro-7');
  l.rect(18, 14, 2, 26, NE(4));
  l.rect(12, 24, 8, 3, RO(3));
  l.rect(12, 32, 8, 2, RO(3));
  poligono(l, [[12, 14], [20, 14], [16, 3]], RO(3));
  poligono(l, [[12, 14], [14, 14], [16, 3]], RO(4));
  poligono(l, [[12, 34], [8, 42], [12, 40]], RO(2));
  poligono(l, [[20, 34], [24, 42], [20, 40]], RO(2));
  l.rect(15, 41, 2, 4, TC(2));
  l.px(16, 45, TC(3));
  l.px(16, 46, CR(4));
  return sueloLibre(l);
}

void CE;
void dentroElipse;

export function cuadrosExterior13(): Cuadros {
  const c: Cuadros = new Map();
  const ROJO = hex('rojo');
  registrarR(c, 'tronco-largo', 'U', troncoTumbado(54, 2));
  registrarR(c, 'tronco-corto', 'U', troncoTumbado(24, 1));
  registrarR(c, 'tocon', 'U', tocon());
  registrarR(c, 'fogata-pozo', 'U', fogataPozo());
  registrarR(c, 'fogata-abierta', 'U', fogataAbierta());
  registrarR(c, 'parrilla-parque', 'U', parrillaParque());
  registrarR(c, 'parrilla-bola', 'U', parrillaBola());
  registrarR(c, 'carro-hot-dogs', 'U', carroPerrosCalientes(), ROJO);
  registrarR(c, 'carro-piragua', 'U', carroPiragua(), ROJO);
  registrarR(c, 'antorcha-tiki', 'U', antorchaTiki());
  registrarR(c, 'carretilla', 'U', carretilla());
  registrarR(c, 'tendedero', 'U', tendedero());
  registrarR(c, 'flamingo-cesped', 'U', flamingo());
  registrarR(c, 'paca-heno', 'U', pacaHeno());
  registrarR(c, 'panel-solar', 'U', panelSolar());
  registrarR(c, 'turbina-viento', 'U', turbina());
  registrarR(c, 'condensador-aire', 'U', condensador());
  registrarR(c, 'arco-otono', 'U', arcoOtono());
  registrarR(c, 'mojon', 'U', mojon());
  registrarR(c, 'mastil-cintas', 'U', mastilCintas());
  registrarR(c, 'caja-fuegos', 'U', cajaFuegos());
  registrarR(c, 'cohete-fuegos', 'U', cohete());
  return c;
}
