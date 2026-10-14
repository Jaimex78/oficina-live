/**
 * Lote 10, aparatos, instrumentos y objetos de oficina y hogar (33 objetos): tocadiscos, radio, micrófonos, máquina de
 * escribir, teléfono, libros y papeles, caballete, calefacción y clima, minibar, reciclaje, hielera, cestas, barriles,
 * flechas y divisores de sala.
 */

import { Lienzo } from '../nucleo';
import type { ColorEntrada } from '../nucleo';
import { CONTORNO } from './l4-comun';
import {
  AZ, BG, CE, CM, CR, HOJA, ME, NA, NE, PL, RS, TC, TG, VI, WC, WO,
  apoyado, bloque, hex, hojaPapel, nuevo, pie, pieA, registrarR, rp, suelo, sueloLibre, tn,
} from './l10-comun';
import type { Cuadros } from './l10-comun';

const LAT = (n: number): ColorEntrada => TC(Math.max(0, Math.min(3, n)));

/** Pie redondo chico para aparatos. */
const pieRedondo = (l: Lienzo, cx: number, yb: number, rx: number): void => {
  l.elipseSombreada(cx, yb - 1, rx, 2, tn('metal', 0, 3));
};

// ---------------------------------------------------------------------------
// Música y audio
// ---------------------------------------------------------------------------

function tocadiscosAntiguo(): Lienzo {
  const l = nuevo(16);
  const fb = pieA(16);
  // Caja de madera con el plato, y la bocina de latón que sube.
  bloque(l, 6, fb - 8, 20, 9, (n) => WO(n + 1));
  l.rect(7, fb - 8, 18, 1, WO(4));
  l.elipseSombreada(15, fb - 8, 7, 2, tn('neutro', 0, 3));
  l.rect(14, fb - 9, 2, 1, RS(3));
  l.linea(22, fb - 9, 17, fb - 8, ME(3));
  // Bocina: cuello angosto que se abre en una campana.
  for (let i = 0; i < 9; i++) {
    const ancho = 4 + Math.round(i * 0.6);
    l.rect(15 - Math.floor(ancho / 2) + 1, fb - 9 - i, ancho, 1, LAT(2));
    l.px(15 - Math.floor(ancho / 2) + 1, fb - 9 - i, LAT(3));
  }
  l.elipseSombreada(18, fb - 22, 9, 7, tn('tela-calida', 0, 3));
  l.elipseSombreada(16, fb - 22, 6, 5, tn('madera-oscura', 0, 2));
  l.px(23, fb - 6, LAT(3));
  l.rect(24, fb - 5, 3, 1, LAT(3));
  return apoyado(l);
}

function tocadiscosModerno(): Lienzo {
  const l = nuevo(8);
  const fb = pieA(8);
  // Plinto de madera con patas, disco negro con etiqueta y brazo.
  l.rect(4, fb - 10, 24, 8, WC(3));
  l.rect(4, fb - 10, 24, 1, WC(4));
  l.rect(4, fb - 10, 1, 8, WC(4));
  l.rect(4, fb - 3, 24, 4, WC(2));
  l.rect(4, fb - 3, 24, 1, WC(3));
  l.rect(27, fb - 10, 1, 11, WC(1));
  l.rect(6, fb + 1, 2, 2, WC(1));
  l.rect(24, fb + 1, 2, 2, WC(1));
  l.elipseSombreada(14, fb - 6, 9, 3, tn('neutro', 0, 3));
  l.elipse(14, fb - 6, 2, 1, RS(3));
  l.px(14, fb - 6, NE(7));
  l.linea(26, fb - 9, 17, fb - 6, ME(3));
  l.rect(24, fb - 10, 3, 2, ME(2));
  l.px(7, fb - 9, TC(3));
  return apoyado(l);
}

function radioAntigua(): Lienzo {
  const l = nuevo(24);
  const yb = pie(l);
  // Mueble de madera con la parte de arriba redondeada, dial, perillas y rejilla de tela.
  l.rectRedondeado(6, 8, 20, yb - 12, 4, WO(2));
  l.rect(7, 10, 1, yb - 20, WO(3));
  l.rect(24, 12, 2, yb - 22, WO(1));
  l.rect(9, 12, 14, 8, TC(2));
  l.rect(9, 12, 14, 1, TC(3));
  for (let x = 11; x < 22; x += 2) l.px(x, 15, WO(1));
  l.rect(15, 13, 1, 6, RS(3));
  for (const x of [11, 19]) {
    l.elipseSombreada(x, 24, 2, 2, tn('tela-calida', 0, 3));
  }
  l.rect(9, 28, 14, yb - 32, CR(2));
  for (let x = 10; x < 23; x += 2) l.rect(x, 29, 1, yb - 34, WO(1));
  l.rect(9, 28, 14, 1, WO(1));
  l.rect(9, yb - 5, 14, 1, WO(1));
  l.rect(8, yb - 3, 3, 4, WO(1));
  l.rect(21, yb - 3, 3, 4, WO(1));
  return suelo(l, 15, yb, 9);
}

function microfonoBrazo(): Lienzo {
  const l = nuevo(16);
  const fb = pieA(16);
  // Abrazadera, poste, brazo articulado y, al final, el micrófono con su filtro antipop.
  bloque(l, 6, fb - 4, 8, 5, (n) => ME(n));
  l.rect(9, fb - 22, 2, 18, ME(2));
  l.rect(9, fb - 22, 1, 18, ME(3));
  l.linea(10, fb - 22, 19, fb - 25, ME(2));
  l.linea(10, fb - 23, 19, fb - 26, ME(3));
  l.rect(9, fb - 24, 3, 3, ME(1));
  l.elipse(22, fb - 22, 6, 6, ME(2));
  l.elipse(22, fb - 22, 5, 5, NE(1));
  for (let y = fb - 26; y <= fb - 18; y += 2) for (let x = 18 + (y % 4 === 0 ? 0 : 1); x <= 26; x += 2) l.px(x, y, NE(3));
  l.rect(20, fb - 24, 3, 1, NE(5));
  return apoyado(l);
}

function microfonoPie(): Lienzo {
  const l = nuevo(32);
  const yb = pie(l);
  // Trípode de tres patas, caña y micrófono de mano con su cápsula.
  l.linea(15, yb - 14, 5, yb - 1, ME(2));
  l.linea(16, yb - 14, 26, yb - 1, ME(1));
  l.linea(15, yb - 14, 15, yb - 1, ME(2));
  l.rect(14, 18, 3, yb - 31, ME(2));
  l.rect(14, 18, 1, yb - 31, ME(3));
  l.rect(12, yb - 16, 7, 2, ME(1));
  l.rect(13, 14, 5, 6, ME(1));
  l.rect(13, 14, 2, 6, ME(2));
  l.elipseSombreada(15, 8, 4, 4, tn('metal', 0, 3));
  for (const [x, y] of [[13, 7], [16, 8], [14, 10]] as const) l.px(x, y, ME(1));
  l.rect(12, 12, 7, 2, ME(1));
  return suelo(l, 15, yb, 8);
}

function microfonoEscritorio(): Lienzo {
  const l = nuevo(8);
  const fb = pieA(8);
  pieRedondo(l, 15, fb, 7);
  l.rect(14, fb - 7, 3, 6, ME(2));
  l.rect(14, fb - 7, 1, 6, ME(3));
  l.rectRedondeado(9, fb - 17, 12, 11, 4, ME(2));
  l.rect(10, fb - 15, 10, 7, NE(2));
  for (let y = fb - 15; y < fb - 8; y += 2) for (let x = 11 + (y % 4 === 0 ? 0 : 1); x < 19; x += 2) l.px(x, y, NE(4));
  l.rect(10, fb - 16, 10, 1, ME(3));
  l.px(15, fb - 7, RS(3));
  return apoyado(l);
}

// ---------------------------------------------------------------------------
// Escritorio y papeles
// ---------------------------------------------------------------------------

function maquinaEscribir(): Lienzo {
  const l = nuevo(8);
  const fb = pieA(8);
  // Hoja de papel que sube del rodillo, cuerpo gris con las hileras de teclas.
  hojaPapel(l, 10, fb - 21, 11, 10, true);
  l.rect(7, fb - 11, 18, 3, ME(1));
  l.rect(7, fb - 12, 18, 1, ME(3));
  l.rect(5, fb - 11, 2, 2, ME(2));
  l.rect(25, fb - 11, 2, 2, ME(2));
  l.rect(6, fb - 8, 20, 9, TG(1));
  l.rect(6, fb - 8, 20, 1, TG(3));
  l.rect(6, fb - 8, 1, 9, TG(2));
  l.rect(25, fb - 8, 1, 9, TG(0));
  l.rect(6, fb, 20, 1, TG(0));
  for (const y of [fb - 6, fb - 3]) for (let x = 9; x < 24; x += 3) l.rect(x, y, 2, 2, NE(7));
  l.rect(11, fb - 1, 10, 1, NE(6));
  return apoyado(l);
}

function telefonoDisco(): Lienzo {
  const l = nuevo(0);
  const fb = pieA(0);
  // Auricular sobre la horquilla, base redondeada con el disco de marcar.
  l.rectRedondeado(7, fb - 5, 18, 6, 2, PL(2));
  l.rect(8, fb - 5, 16, 1, PL(4));
  l.rect(7, fb, 18, 1, PL(0));
  l.elipse(15, fb - 2, 4, 2, NE(7));
  l.elipse(15, fb - 2, 1, 1, PL(2));
  for (const x of [12, 14, 16, 18]) l.px(x, fb - 3, NE(4));
  l.rect(6, fb - 11, 20, 3, PL(3));
  l.rect(6, fb - 11, 20, 1, PL(4));
  l.rect(6, fb - 9, 20, 1, PL(1));
  l.rect(5, fb - 10, 3, 5, PL(2));
  l.rect(24, fb - 10, 3, 5, PL(1));
  return apoyado(l);
}

function libroCerrado(): Lienzo {
  const l = nuevo(0);
  const fb = pieA(0);
  // Tapa, lomo con la etiqueta y las páginas del canto.
  l.rect(7, fb - 9, 18, 6, RS(2));
  l.rect(7, fb - 9, 18, 1, RS(4));
  l.rect(7, fb - 9, 1, 6, RS(3));
  l.rect(24, fb - 9, 1, 6, RS(0));
  l.rect(10, fb - 7, 7, 3, NE(7));
  l.rect(11, fb - 6, 4, 1, RS(1));
  l.rect(7, fb - 3, 18, 4, NE(6));
  l.rect(9, fb - 3, 15, 4, NE(7));
  l.rect(9, fb - 1, 15, 1, NE(5));
  l.rect(7, fb - 3, 2, 4, RS(1));
  l.rect(7, fb, 18, 1, RS(0));
  return apoyado(l);
}

function libroAbierto(): Lienzo {
  const l = nuevo(0);
  const fb = pieA(0);
  // Cubierta de cuero y dos páginas con renglones, curvas hacia el lomo.
  l.rect(5, fb - 1, 22, 2, WO(2));
  l.rect(5, fb + 1 - 1, 22, 1, WO(1));
  hojaPapel(l, 6, fb - 9, 10, 9, true);
  hojaPapel(l, 16, fb - 9, 10, 9, true);
  l.rect(15, fb - 9, 2, 9, NE(5));
  l.rect(6, fb - 10, 10, 1, NE(5));
  l.rect(16, fb - 10, 10, 1, NE(6));
  return apoyado(l);
}

function documento(): Lienzo {
  const l = nuevo(0);
  const fb = pieA(0);
  // Hoja con encabezado, renglones y la esquina doblada.
  l.rect(8, fb - 11, 16, 12, NE(7));
  l.rect(23, fb - 11, 1, 12, NE(5));
  l.rect(8, fb, 16, 1, NE(5));
  l.rect(10, fb - 9, 6, 2, AZ(3));
  for (let y = fb - 5; y < fb - 1; y += 2) l.rect(10, y, 12, 1, NE(4));
  l.rect(10, fb - 6, 12, 1, NE(4));
  l.rect(19, fb - 11, 5, 4, NE(5));
  l.rect(19, fb - 11, 1, 4, NE(6));
  l.px(23, fb - 11, NE(4));
  return apoyado(l);
}

function documentosPila(): Lienzo {
  const l = nuevo(0);
  const fb = pieA(0);
  // Cuatro hojas apiladas y desalineadas, con una carpeta amarilla abajo.
  l.rect(5, fb - 3, 21, 4, TC(2));
  l.rect(5, fb - 3, 21, 1, TC(3));
  l.rect(5, fb - 3, 6, 1, TC(1));
  for (const [x, y] of [[7, fb - 5], [9, fb - 7], [6, fb - 9], [8, fb - 11]] as const) {
    l.rect(x, y, 17, 3, NE(7));
    l.rect(x, y + 2, 17, 1, NE(5));
    l.rect(x + 16, y, 1, 3, NE(5));
  }
  l.rect(10, fb - 11, 7, 1, AZ(3));
  l.rect(10, fb - 10, 11, 1, NE(4));
  return apoyado(l);
}

function notasArtista(): Lienzo {
  const l = nuevo(0);
  const fb = pieA(0);
  // Cuaderno de dibujo con un esbozo, paleta de colores y un lápiz.
  l.rect(5, fb - 11, 17, 12, NE(7));
  l.rect(21, fb - 11, 1, 12, NE(5));
  l.rect(5, fb, 17, 1, NE(5));
  l.rect(5, fb - 11, 2, 12, AZ(2));
  l.elipse(13, fb - 7, 3, 2, AZ(3));
  l.rect(10, fb - 5, 7, 3, AZ(3));
  l.rect(9, fb - 6, 9, 1, RS(3));
  l.px(13, fb - 4, NE(7));
  for (const [x, c] of [[24, RS(3)], [24, VI(2)], [24, TC(3)]] as const) l.rect(x, fb - 11 + ([RS(3), VI(2), TC(3)].indexOf(c) * 3), 4, 2, c);
  l.linea(22, fb - 1, 28, fb - 9, TC(3));
  l.px(28, fb - 10, WO(2));
  return apoyado(l);
}

function notasPluma(): Lienzo {
  const l = nuevo(0);
  const fb = pieA(0);
  // Hoja con letra ondulada, tintero azul y una pluma de ave.
  l.rect(5, fb - 11, 16, 12, NE(7));
  l.rect(20, fb - 11, 1, 12, NE(5));
  l.rect(5, fb, 16, 1, NE(5));
  for (let y = fb - 9; y < fb - 1; y += 2) {
    for (let x = 7; x < 19; x += 3) l.px(x, y, AZ(3));
    for (let x = 8; x < 18; x += 3) l.px(x, y - 1, AZ(2));
  }
  l.rect(22, fb - 6, 6, 7, AZ(1));
  l.rect(22, fb - 6, 1, 7, AZ(3));
  l.rect(23, fb - 8, 4, 2, AZ(2));
  l.rect(24, fb - 5, 3, 1, VI(2));
  l.hoja([24, fb - 8], [29, fb - 21], 6, tn('neutro', 4, 7));
  l.linea(24, fb - 8, 28, fb - 20, NE(3));
  return apoyado(l);
}

function planoAzul(): Lienzo {
  const l = nuevo(0);
  const fb = pieA(0);
  // Plano azul con cuadrícula y trazos blancos, y un rollo al lado.
  l.rect(4, fb - 11, 19, 12, VI(1));
  l.rect(4, fb - 11, 19, 1, VI(2));
  for (let x = 6; x < 23; x += 4) l.rect(x, fb - 10, 1, 11, VI(0));
  for (let y = fb - 7; y < fb; y += 4) l.rect(5, y, 18, 1, VI(0));
  l.rect(8, fb - 5, 8, 4, NE(7));
  l.rect(9, fb - 4, 6, 2, VI(1));
  l.linea(8, fb - 5, 12, fb - 8, NE(7));
  l.linea(16, fb - 5, 12, fb - 8, NE(7));
  l.rect(23, fb - 9, 5, 10, VI(2));
  l.rect(23, fb - 9, 1, 10, VI(3));
  l.rect(27, fb - 9, 1, 10, VI(0));
  l.rect(23, fb - 9, 5, 1, NE(7));
  l.rect(23, fb - 6, 5, 1, WC(3));
  return apoyado(l);
}

function caballeteCartel(): Lienzo {
  const l = nuevo(32);
  const yb = pie(l);
  // Patas traseras, patas delanteras, travesaño, bandeja y el cartel.
  l.linea(14, 12, 15, yb - 2, WO(1));
  l.linea(15, 12, 16, yb - 2, WO(1));
  l.linea(6, 6, 3, yb, WC(2));
  l.linea(7, 6, 4, yb, WC(3));
  l.linea(25, 6, 28, yb, WC(1));
  l.linea(24, 6, 27, yb, WC(2));
  l.rect(5, 34, 22, 2, WC(2));
  l.rect(4, yb - 14, 24, 2, WC(3));
  l.rect(4, yb - 14, 24, 1, WC(4));
  l.rect(8, 8, 17, 28, NE(7));
  l.rect(24, 8, 1, 28, NE(5));
  l.rect(8, 35, 17, 1, NE(5));
  l.rect(10, 11, 13, 4, RS(3));
  l.rect(10, 17, 13, 9, VI(2));
  l.elipse(14, 21, 2, 2, TC(3));
  l.rect(10, 22, 13, 4, PL(3));
  l.rect(10, 28, 13, 1, NE(4));
  l.rect(10, 31, 9, 1, NE(4));
  l.rect(7, 6, 19, 2, WC(3));
  return suelo(l, 15, yb, 10);
}

// ---------------------------------------------------------------------------
// Clima y hogar
// ---------------------------------------------------------------------------

function radiador(): Lienzo {
  const l = nuevo(0, 2);
  const yb = pie(l);
  // Barra superior, aletas de hierro blancas y tuberías con las llaves a los lados.
  const y0 = yb - 20;
  for (let x = 5; x < 58; x += 4) {
    l.rect(x, y0 + 2, 3, 17, NE(6));
    l.rect(x, y0 + 2, 1, 17, NE(7));
    l.rect(x + 2, y0 + 2, 1, 17, NE(4));
  }
  l.rect(4, y0, 56, 3, NE(6));
  l.rect(4, y0, 56, 1, NE(7));
  l.rect(4, y0 + 2, 56, 1, NE(4));
  l.rect(4, yb - 2, 56, 3, NE(5));
  l.rect(4, yb - 2, 56, 1, NE(6));
  l.rect(4, yb, 56, 1, NE(3));
  l.rect(56, y0 + 5, 4, 3, ME(2));
  l.rect(56, y0 + 5, 4, 1, ME(3));
  l.rect(2, yb - 6, 4, 3, ME(2));
  l.rect(6, yb + 1 - 1, 3, 1, ME(1));
  l.rect(8, yb + 1, 3, 0, ME(1));
  return suelo(l, 32, yb, 26);
}

function calefactor(): Lienzo {
  const l = nuevo(8);
  const yb = pie(l);
  // Caja blanca con rejilla de resistencias encendidas, perillas y patas.
  bloque(l, 7, yb - 22, 18, 23, (n) => NE(n + 3));
  l.rect(9, yb - 17, 14, 14, NE(1));
  for (let y = yb - 16; y < yb - 4; y += 3) {
    l.rect(10, y, 12, 1, NA(3));
    l.rect(10, y + 1, 12, 1, NA(1));
  }
  l.rect(10, yb - 16, 12, 1, TC(3));
  l.rect(10, yb - 20, 3, 2, RS(3));
  l.rect(15, yb - 20, 3, 2, ME(3));
  l.rect(9, yb + 1 - 1, 3, 1, NE(3));
  l.rect(20, yb, 3, 1, NE(3));
  return suelo(l, 15, yb, 9);
}

function airePortatil(): Lienzo {
  const l = nuevo(16);
  const yb = pie(l);
  // Torre blanca con rejilla arriba, panel con pantalla, ruedas y la manguera enrollada.
  bloque(l, 6, 6, 19, yb - 10, (n) => NE(n + 3));
  for (let y = 9; y < 15; y += 2) l.rect(9, y, 13, 1, NE(4));
  l.rect(9, 18, 13, 7, NE(2));
  l.rect(10, 19, 7, 3, VI(3));
  l.rect(12, 20, 3, 1, VI(1));
  l.px(19, 20, PL(4));
  l.px(21, 20, RS(3));
  l.rect(10, 23, 11, 1, NE(4));
  for (let y = 29; y < yb - 6; y += 3) l.rect(9, y, 13, 1, NE(4));
  l.rect(8, yb - 3, 4, 4, NE(1));
  l.rect(19, yb - 3, 4, 4, NE(1));
  // Manguera que sale por el costado.
  l.rect(24, 24, 4, 3, NE(5));
  for (let i = 0; i < 4; i++) l.rect(26 + (i % 2), 28 + i * 3, 2, 2, NE(i % 2 === 0 ? 6 : 4));
  return suelo(l, 15, yb, 10);
}

function ventiladorGiratorio(): Lienzo {
  const l = nuevo(24);
  const yb = pie(l);
  const cx = 15;
  const cy = 14;
  // Pie, poste, motor y la jaula con las aspas adentro.
  pieRedondo(l, cx, yb, 8);
  l.rect(cx - 1, cy + 11, 3, yb - cy - 12, ME(2));
  l.rect(cx - 1, cy + 11, 1, yb - cy - 12, ME(3));
  l.elipse(cx, cy, 11, 11, ME(1));
  l.elipse(cx, cy, 10, 10, VI(3));
  for (const [dx, dy] of [[0, -5], [5, 3], [-5, 3]] as const) l.hoja([cx, cy], [cx + dx, cy + dy], 5, tn('vidrio', 0, 3));
  l.linea(cx - 10, cy, cx + 10, cy, ME(2));
  l.linea(cx, cy - 10, cx, cy + 10, ME(2));
  l.linea(cx - 7, cy - 7, cx + 7, cy + 7, ME(2));
  l.linea(cx + 7, cy - 7, cx - 7, cy + 7, ME(2));
  l.elipse(cx, cy, 3, 3, ME(1));
  l.elipse(cx, cy, 2, 2, ME(3));
  return suelo(l, cx, yb, 8);
}

function minibar(): Lienzo {
  const l = nuevo(16);
  const yb = pie(l);
  // Botella y copa encima, mueble de madera con puerta de vidrio y botellas.
  l.rect(9, 7, 3, 9, PL(3));
  l.rect(9, 7, 1, 9, PL(4));
  l.rect(9, 4, 3, 3, PL(2));
  l.rect(10, 3, 1, 1, PL(1));
  l.rect(20, 11, 5, 5, VI(3));
  l.rect(21, 11, 1, 4, NE(7));
  l.rect(22, 16, 1, 1, VI(2));
  bloque(l, 5, 16, 21, yb - 16 + 1, (n) => WO(n + 1));
  l.rect(6, 16, 19, 1, WO(4));
  l.rect(8, 20, 15, yb - 25, VI(2));
  l.rect(8, 20, 15, 1, VI(3));
  for (const y of [28, 35]) l.rect(8, y, 15, 1, WO(1));
  const botellas: ReadonlyArray<readonly [number, ColorEntrada]> = [[9, PL(3)], [12, RS(3)], [15, TC(3)], [18, PL(4)], [21, RS(2)]];
  for (const [x, c] of botellas) {
    l.rect(x, 22, 2, 5, c);
    l.rect(x, 30, 2, 4, c);
    l.px(x, 22, NE(7));
  }
  l.rect(8, yb - 3, 15, 1, WO(1));
  l.rect(6, yb, 3, 1, WO(0));
  l.rect(22, yb, 3, 1, WO(0));
  return suelo(l, 15, yb, 10);
}

function contenedoresReciclaje(): Lienzo {
  const l = nuevo(8, 2);
  const yb = pie(l);
  const colores = [rp('vidrio'), rp('planta'), rp('tela-calida')];
  colores.forEach((c, i) => {
    const x = 4 + i * 20;
    bloque(l, x, yb - 17, 16, 18, (n) => c(n), false);
    l.rect(x - 1, yb - 20, 18, 4, c(3));
    l.rect(x - 1, yb - 20, 18, 1, NE(7));
    l.rect(x - 1, yb - 17, 18, 1, c(1));
    // Símbolo de reciclaje: triángulo blanco con el hueco al centro.
    l.rect(x + 6, yb - 12, 5, 1, NE(7));
    l.rect(x + 5, yb - 11, 7, 1, NE(7));
    l.rect(x + 4, yb - 10, 9, 2, NE(7));
    l.rect(x + 6, yb - 10, 5, 1, c(1));
    l.rect(x + 3, yb - 7, 3, 1, NE(7));
    l.rect(x + 11, yb - 7, 3, 1, NE(7));
    l.rect(x + 2, yb, 3, 1, c(0));
    l.rect(x + 11, yb, 3, 1, c(0));
  });
  return suelo(l, 32, yb, 26);
}

function hieleraBebidas(): Lienzo {
  const l = nuevo(8);
  const yb = pie(l);
  // Cuellos de botella y latas que asoman, hielo y la caja azul con asas.
  for (const [x, c] of [[10, PL(3)], [15, RS(3)], [20, TC(3)]] as const) {
    l.rect(x, yb - 20, 3, 8, c);
    l.rect(x, yb - 20, 1, 8, NE(7));
    l.rect(x + 1, yb - 22, 1, 2, c);
  }
  bloque(l, 5, yb - 14, 22, 15, (n) => `vidrio-${n}`, false);
  l.rect(5, yb - 14, 22, 4, NE(7));
  l.rect(5, yb - 11, 22, 1, NE(5));
  l.rect(7, yb - 13, 3, 2, VI(3));
  l.rect(14, yb - 13, 3, 2, VI(3));
  l.rect(22, yb - 13, 3, 2, VI(3));
  l.rect(3, yb - 8, 2, 4, NE(5));
  l.rect(27, yb - 8, 2, 4, NE(4));
  l.rect(7, yb - 4, 18, 1, VI(0));
  l.rect(6, yb, 3, 1, VI(0));
  l.rect(23, yb, 3, 1, VI(0));
  return suelo(l, 15, yb, 11);
}

// ---------------------------------------------------------------------------
// Cestas y barriles
// ---------------------------------------------------------------------------

/** Cesta de mimbre: cuerpo tejido, borde y asa opcional. */
export function cestaBase(l: Lienzo, fb: number, ancho = 20, asa = false): void {
  const x0 = 16 - Math.floor(ancho / 2);
  l.rect(x0, fb - 7, ancho, 8, WC(2));
  for (let y = fb - 7; y <= fb; y++) for (let x = x0; x < x0 + ancho; x++) if ((x + y) % 3 === 0) l.px(x, y, WC(3));
  for (let y = fb - 6; y <= fb; y += 2) for (let x = x0 + 1; x < x0 + ancho; x += 3) l.px(x, y, WC(1));
  l.rect(x0 - 1, fb - 8, ancho + 2, 2, WC(4));
  l.rect(x0 - 1, fb - 7, ancho + 2, 1, WC(3));
  l.rect(x0 + ancho - 1, fb - 6, 1, 7, WC(1));
  l.rect(x0, fb, ancho, 1, WC(0));
  if (asa) {
    l.linea(x0 + 1, fb - 8, x0 + 4, fb - 13, WC(3));
    l.linea(x0 + 4, fb - 13, x0 + ancho - 5, fb - 13, WC(3));
    l.linea(x0 + ancho - 5, fb - 13, x0 + ancho - 2, fb - 8, WC(2));
  }
}

function cestaPicnic(): Lienzo {
  const l = nuevo(0);
  const fb = pieA(0);
  cestaBase(l, fb, 22, true);
  // Mantel de cuadros que asoma por el borde.
  for (let x = 6; x < 26; x++) for (let y = fb - 10; y < fb - 8; y++) l.px(x, y, ((x >> 1) + (y >> 1)) % 2 === 0 ? RS(3) : NE(7));
  return apoyado(l);
}

function cesta(): Lienzo {
  const l = nuevo(0);
  const fb = pieA(0);
  cestaBase(l, fb, 20, false);
  l.rect(8, fb - 9, 17, 2, WO(1));
  l.rect(5, fb - 6, 3, 3, WC(3));
  l.rect(24, fb - 6, 3, 3, WC(1));
  return apoyado(l);
}

function cestaManzanas(): Lienzo {
  const l = nuevo(0);
  const fb = pieA(0);
  // Manzanas rojas amontonadas, una verde, sobre el borde de la cesta.
  for (const [x, y, c] of [[10, fb - 10, RS], [15, fb - 12, RS], [20, fb - 10, rp('planta')], [12, fb - 9, RS], [18, fb - 9, RS]] as const) {
    const t: readonly ColorEntrada[] = c === RS ? tn('rojo-suave', 0, 3) : tn('planta', 1, 4);
    l.elipseSombreada(x, y, 3, 3, t);
    l.px(x, y - 3, WO(2));
  }
  cestaBase(l, fb, 20, false);
  return apoyado(l);
}

/** Barril de madera: panza, aros de metal y tapa. */
function barril(l: Lienzo, yb: number, rx: number, alto: number, aros: readonly number[]): void {
  const cy = yb - Math.floor(alto / 2);
  const ry = Math.floor(alto / 2);
  l.elipseSombreada(15, cy, rx, ry, tn('madera-clara', 0, 4));
  for (let x = 15 - rx + 3; x < 15 + rx - 1; x += 3) l.rect(x, cy - ry + 3, 1, alto - 6, WC(1));
  for (const f of aros) {
    const y = cy - ry + f;
    const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - ((y - cy) / (ry + 0.5)) ** 2)));
    l.rect(15 - w, y, w * 2 + 1, 2, ME(2));
    l.rect(15 - w, y, w * 2 + 1, 1, ME(3));
  }
  l.elipse(15, cy - ry + 1, rx - 2, 2, WC(4));
  l.elipse(15, cy - ry + 1, rx - 4, 1, WC(3));
}

function barrilChico(): Lienzo {
  const l = nuevo(8);
  const yb = pie(l);
  barril(l, yb, 9, 20, [4, 13]);
  return suelo(l, 15, yb, 8);
}

function barrilGrande(): Lienzo {
  const l = nuevo(16);
  const yb = pie(l);
  barril(l, yb, 11, 30, [5, 21]);
  return suelo(l, 15, yb, 10);
}

// ---------------------------------------------------------------------------
// Señales
// ---------------------------------------------------------------------------

/** Flecha que apunta hacia abajo, rellena de amarillo con luz arriba a la izquierda. */
function flechaAbajo(l: Lienzo, cx: number, y0: number, y1: number, ancho: number): void {
  const cabeza = Math.round((y1 - y0) * 0.5);
  const tallo = Math.max(4, Math.round(ancho * 0.45));
  l.rect(cx - Math.floor(tallo / 2), y0, tallo, y1 - y0 - cabeza, TC(2));
  l.rect(cx - Math.floor(tallo / 2), y0, 1, y1 - y0 - cabeza, TC(3));
  l.rect(cx - Math.floor(tallo / 2) + tallo - 1, y0, 1, y1 - y0 - cabeza, TC(1));
  for (let i = 0; i < cabeza; i++) {
    const w = Math.max(1, Math.round(ancho * (1 - i / cabeza)));
    const x = cx - Math.floor(w / 2);
    l.rect(x, y1 - cabeza + i, w, 1, i < 2 ? TC(3) : TC(2));
    l.px(x, y1 - cabeza + i, TC(3));
    l.px(x + w - 1, y1 - cabeza + i, TC(1));
  }
}

function flechaFlotante(): Lienzo {
  const l = nuevo(16);
  const yb = pie(l);
  // Sombra redonda en el piso y la flecha suspendida encima.
  l.elipse(16, yb - 1, 8, 2, AZ(3));
  l.elipse(15, yb - 2, 6, 1, AZ(2));
  flechaAbajo(l, 15, 4, yb - 10, 16);
  l.contorno(CONTORNO);
  return l;
}

function flechaPiso(): Lienzo {
  const l = nuevo(0);
  // Flecha pintada en el piso, apuntando al sur (hacia abajo en pantalla), con borde oscuro.
  flechaAbajo(l, 15, 4, 27, 20);
  l.contorno(CONTORNO);
  return l;
}

// ---------------------------------------------------------------------------
// Divisores de sala
// ---------------------------------------------------------------------------

/** Tres paneles que zigzaguean: el del medio un poco más oscuro. */
function biombo(l: Lienzo, yb: number, alto: number, marco: (n: number) => ColorEntrada, tela: (n: number) => ColorEntrada, motivo: (l: Lienzo, x: number, y: number, w: number, h: number, i: number) => void): void {
  const y0 = yb - alto;
  [4, 23, 42].forEach((x, i) => {
    const w = 18;
    const dy = i === 1 ? 2 : 0;
    l.rect(x, y0 + dy, w, alto - dy, marco(2));
    l.rect(x + 1, y0 + dy + 2, w - 2, alto - dy - 5, tela(i === 1 ? 2 : 3));
    motivo(l, x + 1, y0 + dy + 2, w - 2, alto - dy - 5, i);
    l.rect(x, y0 + dy, w, 1, marco(3));
    l.rect(x, yb - 1, w, 2, marco(1));
    l.rect(x, y0 + dy, 1, alto - dy, marco(3));
    l.rect(x + w - 1, y0 + dy, 1, alto - dy, marco(1));
  });
}

function biomboFloral(): Lienzo {
  const l = nuevo(24, 2);
  const yb = pie(l);
  biombo(l, yb, 38, WO, CR, (lienzo, x, y, w, h, i) => {
    // Rama con hojas y flores en cada panel.
    lienzo.linea(x + 2, y + h - 2, x + w - 4, y + 3, PL(2));
    lienzo.linea(x + 3, y + h - 2, x + w - 3, y + 4, PL(1));
    for (const [dx, dy] of [[4, h - 8], [w - 6, 8], [w - 9, h - 14]] as const) {
      lienzo.hoja([x + dx, y + dy + 2], [x + dx + 3, y + dy - 3], 3, HOJA);
      lienzo.px(x + dx, y + dy, RS(3));
      lienzo.px(x + dx + 1, y + dy, RS(4));
      lienzo.px(x + dx, y + dy + 1, RS(2));
    }
    if (i !== 1) lienzo.px(x + 3, y + 5, RS(3));
  });
  return suelo(l, 32, yb, 26);
}

function biomboSeda(): Lienzo {
  const l = nuevo(24, 2);
  const yb = pie(l);
  biombo(l, yb, 38, (n) => `neutro-${Math.min(3, n)}`, (n) => `morado-${n + 1}`, (lienzo, x, y, w, h, i) => {
    // Grulla dorada y cañas de bambú bordadas.
    lienzo.linea(x + 3, y + h - 1, x + 3, y + 2, TC(2));
    lienzo.linea(x + w - 4, y + h - 1, x + w - 4, y + 6, TC(2));
    for (const yy of [y + 9, y + 18, y + 26]) {
      lienzo.rect(x + 2, yy, 3, 1, TC(1));
      lienzo.rect(x + w - 5, yy + 2, 3, 1, TC(1));
    }
    const ay = y + 8 + i * 3;
    lienzo.rect(x + 6, ay, 6, 2, TC(3));
    lienzo.rect(x + 4, ay - 2, 4, 1, TC(3));
    lienzo.linea(x + 12, ay, x + 14, ay - 3, TC(3));
    lienzo.rect(x + 8, ay + 2, 1, 3, TC(2));
  });
  return suelo(l, 32, yb, 26);
}

function divisorIndustrial(): Lienzo {
  const l = nuevo(24, 2);
  const yb = pie(l);
  const y0 = yb - 38;
  // Marco de metal oscuro, paneles de chapa perforada y ruedas.
  l.rect(3, y0, 58, 3, ME(1));
  l.rect(3, y0, 58, 1, ME(3));
  l.rect(3, yb - 6, 58, 3, ME(1));
  l.rect(3, yb - 6, 58, 1, ME(2));
  for (const x of [3, 22, 41, 59]) {
    l.rect(x, y0, 2, 38 - 3, ME(1));
    l.rect(x, y0, 1, 38 - 3, ME(2));
  }
  for (const x of [5, 24, 43]) {
    l.rect(x, y0 + 3, 17, 38 - 9, ME(2));
    for (let y = y0 + 5; y < yb - 8; y += 3) for (let xx = x + 1 + ((y - y0) % 6 === 2 ? 1 : 0); xx < x + 16; xx += 3) l.px(xx, y, ME(0));
    l.rect(x, y0 + 3, 17, 1, ME(3));
  }
  for (const x of [5, 28, 52]) {
    l.rect(x, yb - 3, 4, 4, NE(1));
    l.rect(x, yb - 3, 1, 4, NE(3));
  }
  return suelo(l, 32, yb, 26);
}

// ---------------------------------------------------------------------------

type Hacer = () => Lienzo;
const SIN = undefined;
const TABLA: ReadonlyArray<readonly [string, Hacer, readonly string[] | undefined]> = [
  ['tocadiscos-antiguo', tocadiscosAntiguo, SIN],
  ['tocadiscos-moderno', tocadiscosModerno, SIN],
  ['radio-antigua', radioAntigua, SIN],
  ['microfono-brazo', microfonoBrazo, SIN],
  ['microfono-pie', microfonoPie, SIN],
  ['microfono-escritorio', microfonoEscritorio, SIN],
  ['maquina-escribir', maquinaEscribir, SIN],
  ['telefono-disco', telefonoDisco, hex('planta')],
  ['libro-cerrado', libroCerrado, hex('rojo-suave')],
  ['libro-abierto', libroAbierto, SIN],
  ['documento', documento, SIN],
  ['documentos-pila', documentosPila, SIN],
  ['notas-artista', notasArtista, SIN],
  ['notas-pluma', notasPluma, SIN],
  ['plano-azul', planoAzul, SIN],
  ['caballete-cartel', caballeteCartel, SIN],
  ['radiador', radiador, SIN],
  ['calefactor', calefactor, SIN],
  ['aire-portatil', airePortatil, SIN],
  ['ventilador-giratorio', ventiladorGiratorio, SIN],
  ['minibar', minibar, SIN],
  ['contenedores-reciclaje', contenedoresReciclaje, SIN],
  ['hielera-bebidas', hieleraBebidas, hex('vidrio')],
  ['cesta-picnic', cestaPicnic, SIN],
  ['cesta', cesta, SIN],
  ['cesta-manzanas', cestaManzanas, SIN],
  ['barril-chico', barrilChico, SIN],
  ['barril-grande', barrilGrande, SIN],
  ['flecha-flotante', flechaFlotante, hex('tela-calida')],
  ['flecha-piso', flechaPiso, hex('tela-calida')],
  ['biombo-floral', biomboFloral, SIN],
  ['biombo-seda', biomboSeda, SIN],
  ['divisor-industrial', divisorIndustrial, SIN],
];

export function cuadrosPiezas10(): Cuadros {
  const c: Cuadros = new Map();
  for (const [id, hacer, desde] of TABLA) registrarR(c, id, 'U', hacer(), desde);
  return c;
}

void BG; void CE; void CM; void CR; void NA; void VI; void sueloLibre; void pie;
