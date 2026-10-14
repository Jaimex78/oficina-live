/**
 * Lote 10, lámparas, velas, piezas de museo, jarrones, atriles y figuras (33 objetos). Todo lo que emite luz lleva su parte
 * encendida con los tonos más claros (`tela-calida-3`, `crema-4`): el resplandor lo pone el motor.
 */

import { Lienzo } from '../nucleo';
import type { ColorEntrada } from '../nucleo';
import {
  AZ, BG, CE, CM, CR, CU, HOJA, HOJA_OSCURA, LA, MC, ME, MO, NA, NE, PL, RS, TC, VI, WC, WO,
  apoyado, bloque, flor, florGrande, hex, llama, nuevo, pie, pieA, registrarR, suelo, tn, vela,
} from './l10-comun';
import type { Cuadros } from './l10-comun';

const LAT = (n: number): ColorEntrada => TC(Math.max(0, Math.min(3, n)));
const MARMOL = (n: number): ColorEntrada => NE(n + 3);

/** Poste de 2 px de ancho (luz a la izquierda). */
function poste(l: Lienzo, x: number, y0: number, y1: number, r: (n: number) => ColorEntrada = ME): void {
  l.rect(x, y0, 2, y1 - y0 + 1, r(2));
  l.rect(x, y0, 1, y1 - y0 + 1, r(3));
}

/** Pie redondo de una lámpara de piso o de mesa. */
function pieRedondo(l: Lienzo, cx: number, yb: number, rx: number, r: (n: number) => ColorEntrada = ME): void {
  l.elipseSombreada(cx, yb - 1, rx, 2, [r(0), r(1), r(2), r(3)]);
}

// ---------------------------------------------------------------------------
// Lámparas
// ---------------------------------------------------------------------------

function lamparaArco(): Lienzo {
  const l = nuevo(40);
  const yb = pie(l);
  // Arco: poste y curva hasta la pantalla.
  const ruta: ReadonlyArray<readonly [number, number]> = [[8, yb - 5], [8, 28], [9, 18], [14, 11], [20, 9], [24, 12], [24, 18]];
  for (let i = 0; i < ruta.length - 1; i++) {
    const [x0, y0] = ruta[i] as readonly [number, number];
    const [x1, y1] = ruta[i + 1] as readonly [number, number];
    l.linea(x0, y0, x1, y1, ME(2));
    l.linea(x0 + 1, y0, x1 + 1, y1, ME(1));
    l.linea(x0 - 1, y0 - 1, x1 - 1, y1 - 1, ME(3));
  }
  // Pantalla en cúpula y foco encendido.
  l.elipseSombreada(24, 22, 5, 5, tn('metal', 0, 3));
  l.rect(19, 25, 11, 1, ME(1));
  l.elipse(24, 27, 3, 1, TC(3));
  l.rect(22, 27, 3, 1, CR(4));
  // Base de mármol.
  bloque(l, 3, yb - 4, 13, 5, MARMOL);
  return suelo(l, 9, yb, 6);
}

function lamparaMolecular(): Lienzo {
  const l = nuevo(8);
  const fb = pieA(8);
  const esferas: ReadonlyArray<readonly [number, number, number]> = [[8, fb - 13, 2], [23, fb - 14, 2], [15, fb - 19, 2], [22, fb - 5, 2], [8, fb - 5, 2]];
  for (const [x, y] of esferas) l.linea(15, fb - 10, x, y, ME(1));
  for (const [x, y, r] of esferas) l.elipseSombreada(x, y, r + 1, r + 1, tn('neutro', 4, 7));
  l.elipseSombreada(15, fb - 10, 4, 4, tn('tela-calida', 1, 3));
  l.px(14, fb - 11, CR(4));
  l.px(13, fb - 12, NE(7));
  pieRedondo(l, 15, fb, 6);
  return apoyado(l);
}

function lamparaMacetaPanton(): Lienzo {
  const l = nuevo(8);
  const fb = pieA(8);
  poste(l, 15, fb - 8, fb - 2, ME);
  pieRedondo(l, 16, fb, 6);
  // Cúpula chica boca abajo y cúpula grande encima.
  l.elipseSombreada(16, fb - 9, 5, 4, tn('naranja', 0, 3));
  l.rect(11, fb - 8, 11, 2, NA(1));
  l.elipseSombreada(16, fb - 14, 9, 7, tn('naranja', 1, 4));
  l.rect(7, fb - 9, 19, 1, NA(1));
  l.rect(10, fb - 9, 12, 1, TC(3));
  return apoyado(l);
}

function lamparaTuberia(): Lienzo {
  const l = nuevo(16);
  const fb = pieA(16);
  // Brida, tubo en L, válvula de cobre y foco con jaula.
  bloque(l, 6, fb - 3, 11, 4, (n) => ME(n));
  poste(l, 10, fb - 22, fb - 4, (n) => ME(n - 1));
  l.rect(9, fb - 12, 4, 3, NA(2));
  l.rect(9, fb - 12, 4, 1, NA(3));
  l.rect(10, fb - 22, 11, 2, ME(2));
  l.rect(10, fb - 22, 11, 1, ME(3));
  l.rect(19, fb - 20, 4, 3, ME(1));
  l.elipse(21, fb - 14, 3, 4, TC(3));
  l.rect(20, fb - 16, 2, 3, CR(4));
  l.linea(18, fb - 17, 18, fb - 12, ME(2));
  l.linea(24, fb - 17, 24, fb - 12, ME(1));
  l.rect(19, fb - 10, 5, 1, ME(1));
  return apoyado(l);
}

function lamparaFloral(): Lienzo {
  const l = nuevo(8);
  const fb = pieA(8);
  // Base de cerámica con cuello y pantalla cónica estampada.
  l.elipseSombreada(15, fb - 4, 6, 5, tn('neutro', 4, 7));
  l.rect(14, fb - 11, 3, 4, NE(5));
  l.rect(14, fb - 11, 1, 4, NE(7));
  l.px(12, fb - 4, VI(2));
  l.px(15, fb - 2, VI(2));
  l.px(18, fb - 5, VI(2));
  for (let i = 0; i < 9; i++) l.rect(8 + Math.floor(i / 2), fb - 11 - i, 15 - Math.floor(i / 2) * 2, 1, CR(3));
  l.rect(8, fb - 11, 1, 1, CR(2));
  for (let i = 0; i < 9; i++) l.px(22 - Math.floor(i / 2), fb - 11 - i, CR(2));
  l.rect(8, fb - 11, 15, 1, CR(2));
  for (const [x, y] of [[11, fb - 13], [16, fb - 16], [19, fb - 12], [14, fb - 10]] as const) flor(l, x, y, RS, TC(3));
  return apoyado(l);
}

function lamparaLava(): Lienzo {
  const l = nuevo(8);
  const fb = pieA(8);
  // Base de metal, cuerpo de vidrio con líquido y burbujas de cera, tapa.
  l.rect(11, fb - 4, 10, 5, ME(2));
  l.rect(11, fb - 4, 10, 1, ME(3));
  l.rect(11, fb - 4, 1, 5, ME(3));
  l.rect(20, fb - 4, 1, 5, ME(1));
  l.rect(9, fb, 14, 1, ME(1));
  for (let i = 0; i < 16; i++) {
    const w = 8 - Math.abs(i - 7) * 0 + (i < 8 ? i / 3 : (15 - i) / 1.2) * 0;
    void w;
  }
  const filas = [[13, 6], [12, 8], [11, 9], [10, 10], [10, 10], [10, 10], [10, 10], [11, 9], [11, 9], [12, 8], [12, 8], [13, 6]] as const;
  filas.forEach(([x, ancho], i) => {
    const y = fb - 5 - (filas.length - 1 - i);
    l.rect(x, y, ancho, 1, RS(1));
    l.px(x, y, RS(2));
    l.px(x + ancho - 1, y, RS(0));
  });
  l.elipseSombreada(15, fb - 7, 3, 3, tn('rojo-suave', 1, 4));
  l.elipseSombreada(17, fb - 13, 2, 2, tn('rojo-suave', 1, 4));
  l.rect(13, fb - 15, 6, 1, RS(4));
  l.rect(13, fb - 17, 6, 1, ME(2));
  l.rect(14, fb - 18, 4, 1, ME(3));
  l.rect(12, fb - 16, 1, 1, NE(7));
  return apoyado(l);
}

function lamparaTiffany(): Lienzo {
  const l = nuevo(8);
  const fb = pieA(8);
  // Pie de bronce.
  poste(l, 15, fb - 8, fb - 2, (n) => LAT(n - 1));
  l.elipseSombreada(16, fb - 1, 6, 2, tn('tela-calida', 0, 3));
  // Pantalla de vitral: cúpula con parches de colores y plomo entre ellos.
  const colores: readonly ColorEntrada[] = [RS(3), VI(2), TC(3), PL(3)];
  const cx = 16;
  const cy = fb - 9;
  for (let y = cy - 8; y <= cy; y++) {
    for (let x = cx - 10; x <= cx + 10; x++) {
      const u = (x - cx) / 10.5;
      const v = (y - cy) / 8.5;
      if (u * u + v * v > 1) continue;
      const lineaX = (x - (cx - 10)) % 4 === 0;
      const lineaY = (y - (cy - 8)) % 3 === 0;
      if (lineaX || lineaY) l.px(x, y, WO(1));
      else l.px(x, y, colores[(Math.floor((x - cx + 10) / 4) + Math.floor((y - cy + 8) / 3) * 2) % 4] as ColorEntrada);
    }
  }
  l.rect(cx - 10, cy + 1, 21, 1, LAT(1));
  l.rect(cx - 10, cy, 21, 1, WO(1));
  return apoyado(l);
}

function lamparaFlecos(): Lienzo {
  const l = nuevo(24);
  const yb = pie(l);
  pieRedondo(l, 15, yb, 7, (n) => WO(n + 1));
  l.rect(14, 18, 2, yb - 19, WO(3));
  l.rect(14, 18, 1, yb - 19, WO(4));
  // Pantalla de tambor y flecos que cuelgan.
  l.rect(5, 6, 21, 11, CR(3));
  l.rect(5, 6, 21, 2, CR(4));
  l.rect(5, 6, 1, 11, CR(4));
  l.rect(24, 6, 2, 11, CR(2));
  l.rect(5, 16, 21, 1, CR(1));
  for (let x = 6; x <= 25; x += 2) {
    const largo = 5 + (x % 4 === 0 ? 1 : 0);
    l.rect(x, 17, 1, largo, CR(2));
    l.px(x, 17 + largo - 1, CR(4));
  }
  l.rect(12, 9, 6, 3, TC(3));
  return suelo(l, 15, yb, 7);
}

// ---------------------------------------------------------------------------
// Velas
// ---------------------------------------------------------------------------

function candeleroPie(): Lienzo {
  const l = nuevo(24);
  const yb = pie(l);
  // Vela alta, platillo, tallo con nudos y base.
  vela(l, 13, 20, 5, 10);
  l.rect(10, 20, 11, 2, LAT(3));
  l.rect(10, 20, 11, 1, LAT(3));
  l.rect(10, 21, 11, 1, LAT(1));
  l.rect(14, 22, 3, yb - 26, LAT(2));
  l.rect(14, 22, 1, yb - 26, LAT(3));
  for (const y of [28, 36]) l.elipseSombreada(15, y, 3, 2, tn('tela-calida', 0, 3));
  l.elipseSombreada(15, yb - 3, 7, 3, tn('tela-calida', 0, 3));
  return suelo(l, 15, yb, 7);
}

function candeleroMesa(): Lienzo {
  const l = nuevo(8);
  const fb = pieA(8);
  vela(l, 13, fb - 9, 5, 9);
  l.rect(10, fb - 9, 11, 2, LAT(3));
  l.rect(10, fb - 8, 11, 1, LAT(1));
  l.rect(14, fb - 7, 3, 4, LAT(2));
  l.rect(14, fb - 7, 1, 4, LAT(3));
  l.elipseSombreada(15, fb - 1, 6, 2, tn('tela-calida', 0, 3));
  return apoyado(l);
}

/** Brazos de un candelabro: curva desde el tallo hasta cada vela. */
function brazos(l: Lienzo, y: number, xs: readonly number[], yv: number): void {
  for (const x of xs) {
    const lado = x < 15 ? -1 : 1;
    l.linea(15, y, 15 + lado * Math.round(Math.abs(x - 15) * 0.5), y - 2, LAT(2));
    l.linea(15 + lado * Math.round(Math.abs(x - 15) * 0.5), y - 2, x, yv + 1, LAT(2));
    l.rect(x - 2, yv, 5, 2, LAT(3));
    l.rect(x - 2, yv + 1, 5, 1, LAT(1));
  }
}

function candelabroMesa(): Lienzo {
  const l = nuevo(8);
  const fb = pieA(8);
  brazos(l, fb - 5, [8, 15, 23], fb - 10);
  vela(l, 6, fb - 11, 5, 8);
  vela(l, 13, fb - 11, 5, 8);
  vela(l, 21, fb - 11, 5, 8);
  l.rect(14, fb - 11, 3, 8, LAT(2));
  l.rect(14, fb - 11, 1, 8, LAT(3));
  l.elipseSombreada(15, fb - 1, 6, 2, tn('tela-calida', 0, 3));
  return apoyado(l);
}

function candelabroPie(): Lienzo {
  const l = nuevo(24);
  const yb = pie(l);
  const xs = [4, 9, 15, 21, 26];
  // Brazos curvos a dos alturas.
  brazos(l, 34, [4, 26], 22);
  brazos(l, 30, [9, 21], 17);
  l.rect(14, 12, 3, yb - 16, LAT(2));
  l.rect(14, 12, 1, yb - 16, LAT(3));
  for (const x of xs) vela(l, x - 2, (x === 15 ? 12 : x === 9 || x === 21 ? 17 : 22) - 1, 5, 7);
  for (const y of [38, 44]) l.elipseSombreada(15, y, 3, 2, tn('tela-calida', 0, 3));
  l.elipseSombreada(15, yb - 3, 8, 3, tn('tela-calida', 0, 3));
  return suelo(l, 15, yb, 8);
}

function faroloMarroqui(): Lienzo {
  const l = nuevo(8);
  const yb = pie(l);
  // Asa de anilla y tapa puntiaguda.
  l.linea(15, 4, 12, 9, ME(2));
  l.linea(16, 4, 19, 9, ME(2));
  l.rect(14, 3, 3, 2, TC(2));
  for (let i = 0; i < 6; i++) l.rect(15 - i - 1, 8 + i, 2 * i + 4, 1, TC(i < 2 ? 3 : 2));
  l.rect(8, 14, 16, 1, TC(1));
  // Cuerpo con tres ventanas de vidrio de color encendidas.
  l.rect(9, 15, 14, 14, ME(1));
  l.rect(9, 15, 1, 14, ME(2));
  for (const x of [10, 14, 18]) {
    l.rect(x, 17, 3, 9, NA(3));
    l.rect(x, 17, 3, 2, NA(4));
    l.px(x + 1, 16, NA(3));
    l.rect(x + 1, 20, 1, 4, TC(3));
  }
  l.rect(8, 29, 16, 2, TC(1));
  l.rect(8, 29, 16, 1, TC(2));
  l.rect(11, 31, 10, 1, ME(0));
  void yb;
  return suelo(l, 15, 31, 7);
}

function faroloPapelMesa(): Lienzo {
  const l = nuevo(8);
  const fb = pieA(8);
  l.rect(12, fb - 18, 8, 2, WO(2));
  l.elipseSombreada(16, fb - 9, 9, 8, tn('naranja', 1, 4));
  l.rect(7, fb - 9, 19, 1, NA(1));
  for (const x of [12, 16, 20]) l.rect(x, fb - 16, 1, 15, NA(1));
  l.rect(12, fb - 2, 8, 2, WO(2));
  l.rect(12, fb - 2, 8, 1, WO(3));
  l.px(16, fb + 1, TC(3));
  l.px(16, fb + 2, TC(2));
  l.rect(10, fb - 10, 3, 3, TC(3));
  return apoyado(l);
}

function inciensoVarillas(): Lienzo {
  const l = nuevo(8);
  const fb = pieA(8);
  // Varillas inclinadas con la brasa roja, humo, y un cuenco de cerámica.
  for (const [x1, y1] of [[9, fb - 18], [15, fb - 20], [21, fb - 17]] as const) {
    l.linea(15, fb - 4, x1, y1, WC(2));
    l.px(x1, y1, RS(3));
    l.px(x1, y1 - 1, RS(4));
  }
  for (const [x, y] of [[9, fb - 22], [10, fb - 24], [15, fb - 24], [14, fb - 26], [21, fb - 21], [22, fb - 23]] as const) l.px(x, y, NE(5));
  l.elipseSombreada(15, fb - 2, 7, 3, tn('baldosa-gris', 0, 3));
  l.rect(9, fb - 4, 13, 1, BG(4));
  l.rect(11, fb - 5, 9, 1, WO(0));
  return apoyado(l);
}

// ---------------------------------------------------------------------------
// Piezas de museo y arte
// ---------------------------------------------------------------------------

function pedestal(l: Lienzo, yb: number, alto: number): number {
  bloque(l, 8, yb - alto, 15, alto + 1, MARMOL);
  l.rect(7, yb - alto, 17, 2, NE(6));
  l.rect(7, yb - alto + 1, 17, 1, NE(4));
  l.rect(7, yb, 17, 1, NE(3));
  return yb - alto;
}

function bustoMujer(): Lienzo {
  const l = nuevo(16);
  const yb = pie(l);
  const top = pedestal(l, yb, 12);
  // Hombros con escote, cuello largo, cara con peinado recogido y moño.
  l.elipseSombreada(15, top - 3, 9, 4, tn('neutro', 4, 7));
  l.rect(10, top - 4, 3, 1, NE(4));
  l.rect(18, top - 4, 3, 1, NE(4));
  l.rect(13, top - 9, 5, 6, NE(5));
  l.rect(13, top - 9, 2, 6, NE(6));
  l.elipseSombreada(15, top - 15, 5, 6, tn('neutro', 4, 7));
  l.elipseSombreada(15, top - 19, 5, 4, tn('neutro', 2, 5));
  l.elipseSombreada(15, top - 24, 3, 2, tn('neutro', 2, 5));
  l.rect(11, top - 17, 1, 4, NE(3));
  l.rect(19, top - 17, 1, 4, NE(3));
  l.px(14, top - 14, NE(3));
  l.px(17, top - 14, NE(3));
  l.px(15, top - 12, NE(4));
  l.rect(14, top - 10, 3, 1, NE(4));
  return suelo(l, 15, yb, 9);
}

function bustoHombre(): Lienzo {
  const l = nuevo(16);
  const yb = pie(l);
  const top = pedestal(l, yb, 12);
  // Toga con pliegues, cuello grueso, mandíbula cuadrada y pelo corto.
  l.elipseSombreada(15, top - 3, 10, 4, tn('neutro', 4, 7));
  l.linea(10, top - 5, 20, top - 1, NE(4));
  l.rect(12, top - 10, 7, 7, NE(5));
  l.rect(12, top - 10, 3, 7, NE(6));
  l.rect(11, top - 20, 9, 11, NE(6));
  l.rect(11, top - 20, 2, 11, NE(7));
  l.rect(19, top - 20, 1, 11, NE(4));
  l.rect(11, top - 22, 9, 4, NE(4));
  l.rect(11, top - 22, 9, 1, NE(5));
  l.rect(13, top - 15, 2, 1, NE(3));
  l.rect(17, top - 15, 2, 1, NE(3));
  l.rect(15, top - 13, 1, 2, NE(4));
  l.rect(12, top - 10, 8, 1, NE(4));
  return suelo(l, 15, yb, 9);
}

/** Urna griega: cuerpo anaranjado con la franja de figuras negras, asas y cuello. */
function urna(l: Lienzo, yb: number, alto: number, ancho: number): void {
  const cy = yb - Math.round(alto * 0.4);
  // Asas.
  for (const lado of [-1, 1]) {
    const x = 15 + lado * (ancho + 1);
    l.rect(lado < 0 ? x : x - 1, cy - Math.round(alto * 0.22), 2, Math.round(alto * 0.4), 'neutro-1');
  }
  l.elipseSombreada(15, cy, ancho, Math.round(alto * 0.4), tn('maceta-terracota', 0, 3));
  // Cuello y boca.
  l.rect(12, cy - Math.round(alto * 0.4) - 4, 7, 5, MC(2));
  l.rect(12, cy - Math.round(alto * 0.4) - 4, 2, 5, MC(3));
  l.rect(11, cy - Math.round(alto * 0.4) - 5, 9, 2, MC(3));
  l.rect(11, cy - Math.round(alto * 0.4) - 4, 9, 1, MC(1));
  // Pie.
  l.rect(11, yb - 2, 9, 3, MC(1));
  l.rect(11, yb - 2, 9, 1, MC(2));
  // Franja de figuras.
  l.rect(15 - ancho + 1, cy - 1, ancho * 2 - 1, 4, 'neutro-1');
  for (let x = 15 - ancho + 2; x < 15 + ancho - 1; x += 3) {
    l.px(x, cy, MC(2));
    l.px(x + 1, cy + 1, MC(2));
    l.px(x, cy + 2, MC(2));
  }
}

function urnaGriegaBaja(): Lienzo {
  const l = nuevo(8);
  urna(l, pie(l), 18, 9);
  return suelo(l, 15, pie(l), 8);
}

function urnaGriegaAlta(): Lienzo {
  const l = nuevo(24);
  urna(l, pie(l), 34, 8);
  return suelo(l, 15, pie(l), 8);
}

function jarronMeiji(): Lienzo {
  const l = nuevo(16);
  const fb = pieA(16);
  // Boca ancha dorada, cuello, cuerpo de porcelana con flores azules y pie.
  l.rect(11, fb - 25, 11, 2, TC(3));
  l.rect(11, fb - 24, 11, 1, TC(1));
  l.rect(13, fb - 23, 7, 6, NE(6));
  l.rect(13, fb - 23, 2, 6, NE(7));
  l.rect(19, fb - 23, 1, 6, NE(4));
  l.elipseSombreada(16, fb - 10, 9, 10, tn('neutro', 4, 7));
  l.rect(12, fb - 1, 9, 2, TC(2));
  l.rect(12, fb - 1, 9, 1, TC(3));
  l.rect(8, fb - 13, 17, 3, VI(1));
  l.rect(8, fb - 13, 17, 1, TC(2));
  for (const x of [10, 14, 18, 22]) l.px(x, fb - 12, NE(7));
  for (const [x, y] of [[13, fb - 7], [19, fb - 6], [16, fb - 4]] as const) {
    l.px(x, y, VI(1));
    l.px(x + 1, y, VI(2));
    l.px(x, y + 1, VI(2));
  }
  return apoyado(l);
}

function jarronEdo(): Lienzo {
  const l = nuevo(8);
  const fb = pieA(8);
  // Tarro panzón de esmalte verde mar con un chorreado.
  l.rect(11, fb - 14, 11, 3, BG(2));
  l.rect(11, fb - 14, 11, 1, BG(4));
  l.elipseSombreada(16, fb - 6, 10, 7, tn('baldosa-gris', 0, 3));
  l.rect(13, fb - 12, 7, 2, BG(1));
  for (const [x, h] of [[11, 4], [15, 7], [20, 3]] as const) l.rect(x, fb - 11, 2, h, BG(3));
  l.rect(12, fb, 9, 1, BG(0));
  return apoyado(l);
}

function jarronModerno(): Lienzo {
  const l = nuevo(16);
  const fb = pieA(16);
  // Cuerpo bajo y panzón con un cuello largo y fino.
  l.rect(14, fb - 25, 5, 15, NA(2));
  l.rect(14, fb - 25, 2, 15, NA(3));
  l.rect(18, fb - 25, 1, 15, NA(1));
  l.rect(13, fb - 26, 7, 2, NA(3));
  l.elipseSombreada(16, fb - 7, 8, 8, tn('naranja', 0, 3));
  l.rect(12, fb, 9, 1, NA(0));
  l.px(11, fb - 11, NA(4));
  l.px(12, fb - 12, NA(4));
  return apoyado(l);
}

function jarronModernoRedondo(): Lienzo {
  const l = nuevo(8);
  const fb = pieA(8);
  l.elipseSombreada(16, fb - 7, 9, 8, tn('planta', 1, 4));
  l.rect(12, fb - 16, 9, 3, PL(2));
  l.rect(12, fb - 16, 3, 3, PL(3));
  l.rect(11, fb - 17, 11, 2, PL(4));
  l.rect(11, fb - 16, 11, 1, PL(1));
  l.px(11, fb - 10, NE(7));
  l.px(12, fb - 11, NE(7));
  return apoyado(l);
}

function jarronMonumental(): Lienzo {
  const l = nuevo(40);
  const yb = pie(l);
  const cy = yb - 22;
  for (const lado of [-1, 1]) {
    const x = lado < 0 ? 3 : 27;
    l.rect(x, cy - 12, 2, 14, VI(1));
    l.rect(lado < 0 ? x + 2 : x - 2, cy - 14, 2, 2, VI(1));
  }
  l.rect(11, cy - 30, 10, 2, VI(2));
  l.elipseSombreada(16, cy, 12, 16, tn('neutro', 4, 7));
  l.rect(12, cy - 26, 8, 6, NE(6));
  l.rect(12, cy - 26, 3, 6, NE(7));
  l.rect(19, cy - 26, 1, 6, NE(4));
  l.rect(10, cy - 29, 12, 3, VI(1));
  l.rect(10, cy - 29, 12, 1, VI(3));
  l.rect(12, yb - 3, 9, 4, VI(1));
  l.rect(12, yb - 3, 9, 1, VI(2));
  // Franjas azules con motivo de olas.
  for (const y of [cy - 7, cy + 4]) {
    l.rect(5, y, 22, 3, VI(1));
    for (let x = 6; x < 26; x += 3) l.px(x, y + 1, VI(3));
  }
  l.elipse(16, cy - 1, 4, 3, VI(2));
  l.px(15, cy - 2, NE(7));
  return suelo(l, 15, yb, 9);
}

function jarronRosas(): Lienzo {
  const l = nuevo(16);
  const fb = pieA(16);
  // Tallos y hojas, rosas rojas y florero de vidrio.
  for (const [x, y] of [[10, fb - 22], [16, fb - 26], [22, fb - 21]] as const) {
    l.linea(16, fb - 6, x, y + 2, PL(2));
  }
  l.hoja([16, fb - 12], [9, fb - 16], 4, HOJA);
  l.hoja([16, fb - 14], [24, fb - 17], 4, HOJA);
  for (const [x, y] of [[10, fb - 22], [16, fb - 26], [22, fb - 21]] as const) florGrande(l, x, y, RS, RS(1));
  l.rect(9, fb - 14, 14, 15, VI(3));
  l.rect(9, fb - 14, 1, 15, NE(7));
  l.rect(22, fb - 14, 1, 15, VI(2));
  l.rect(9, fb, 14, 1, VI(1));
  l.rect(9, fb - 14, 14, 1, NE(7));
  l.rect(10, fb - 4, 12, 4, VI(2));
  for (const x of [13, 16, 19]) l.rect(x, fb - 13, 1, 9, PL(2));
  return apoyado(l);
}

function jarronLirios(): Lienzo {
  const l = nuevo(16);
  const fb = pieA(16);
  for (const [x, y] of [[10, fb - 23], [16, fb - 27], [22, fb - 22]] as const) {
    l.linea(16, fb - 8, x, y + 3, PL(2));
    // Trompeta de lirio: pétalos blancos abiertos y centro amarillo.
    l.hoja([x, y + 3], [x - 5, y - 2], 4, tn('neutro', 4, 7));
    l.hoja([x, y + 3], [x + 5, y - 2], 4, tn('neutro', 4, 7));
    l.hoja([x, y + 3], [x, y - 4], 4, tn('neutro', 4, 7));
    l.px(x, y, TC(3));
  }
  l.hoja([16, fb - 12], [8, fb - 14], 4, HOJA_OSCURA);
  l.hoja([16, fb - 12], [24, fb - 15], 4, HOJA_OSCURA);
  // Florero de cerámica azul.
  l.rect(11, fb - 10, 10, 2, AZ(3));
  l.elipseSombreada(16, fb - 4, 7, 5, tn('azul-oficina', 1, 4));
  l.rect(12, fb, 9, 1, AZ(1));
  return apoyado(l);
}

function atrilAntiguo(): Lienzo {
  const l = nuevo(24);
  const yb = pie(l);
  // Tablero inclinado con un libro abierto, columna torneada y base de tres patas.
  l.rect(5, 10, 21, 4, WO(3));
  l.rect(5, 10, 21, 1, WO(4));
  l.rect(5, 13, 21, 1, WO(1));
  l.rect(8, 6, 15, 5, NE(7));
  l.rect(15, 6, 1, 5, NE(4));
  l.rect(9, 8, 5, 1, NE(4));
  l.rect(17, 8, 5, 1, NE(4));
  l.rect(8, 10, 15, 1, NE(5));
  l.rect(13, 14, 5, 3, WO(2));
  l.rect(14, 17, 3, yb - 24, WO(3));
  l.rect(14, 17, 1, yb - 24, WO(4));
  for (const y of [22, 30]) l.elipseSombreada(15, y, 3, 2, tn('madera-oscura', 1, 4));
  l.rect(8, yb - 5, 15, 2, WO(2));
  l.rect(8, yb - 5, 15, 1, WO(4));
  l.rect(6, yb - 3, 4, 4, WO(2));
  l.rect(21, yb - 3, 4, 4, WO(1));
  l.rect(6, yb, 4, 1, WO(0));
  l.rect(21, yb, 4, 1, WO(0));
  return suelo(l, 15, yb, 9);
}

function atrilModerno(): Lienzo {
  const l = nuevo(24);
  const yb = pie(l);
  // Caja trapezoidal de madera clara con tapa inclinada y círculo de logo.
  l.rect(5, 6, 21, 3, WC(4));
  l.rect(5, 6, 21, 1, NE(7));
  l.rect(5, 8, 21, 1, WC(2));
  l.rect(7, 9, 18, yb - 9, WC(3));
  l.rect(7, 9, 2, yb - 9, WC(4));
  l.rect(23, 9, 2, yb - 9, WC(1));
  l.rect(7, yb, 18, 1, WC(0));
  l.rect(8, 9, 16, 1, WC(1));
  l.elipse(15, 22, 4, 4, WC(2));
  l.elipse(15, 22, 3, 3, RS(2));
  l.rect(14, 21, 2, 2, NE(7));
  l.rect(9, yb - 8, 14, 1, WC(2));
  // Micrófono de cuello de ganso.
  l.linea(22, 6, 24, 2, ME(2));
  l.elipse(24, 2, 1, 1, ME(1));
  return suelo(l, 15, yb, 9);
}

function estatuillaAlce(): Lienzo {
  const l = nuevo(8);
  const fb = pieA(8);
  // Cuerpo, patas, cabeza, hocico y cornamenta palmeada.
  l.elipseSombreada(15, fb - 8, 7, 4, tn('madera-oscura', 1, 4));
  for (const x of [9, 12, 18, 21]) l.rect(x, fb - 5, 2, 5, WO(1));
  l.rect(9, fb - 5, 1, 5, WO(2));
  l.rect(21, fb - 16, 4, 8, WO(2));
  l.elipseSombreada(23, fb - 15, 3, 3, tn('madera-oscura', 1, 4));
  l.rect(24, fb - 13, 4, 3, WO(2));
  l.rect(23, fb - 20, 7, 3, WC(3));
  l.rect(21, fb - 19, 3, 1, WC(2));
  l.rect(27, fb - 22, 3, 2, WC(3));
  l.rect(21, fb - 22, 3, 2, WC(3));
  l.px(23, fb - 15, NE(7));
  l.rect(8, fb, 17, 1, WO(0));
  return apoyado(l);
}

function estatuillaCiervo(): Lienzo {
  const l = nuevo(8);
  const fb = pieA(8);
  // Ciervo dorado de patas largas con cornamenta ramificada.
  l.elipseSombreada(14, fb - 9, 6, 3, tn('tela-calida', 0, 3));
  for (const x of [9, 11, 17, 19]) l.rect(x, fb - 7, 1, 7, LAT(1));
  l.rect(9, fb - 7, 1, 7, LAT(2));
  l.rect(18, fb - 18, 3, 9, LAT(2));
  l.elipseSombreada(20, fb - 18, 3, 2, tn('tela-calida', 0, 3));
  l.rect(21, fb - 17, 4, 2, LAT(2));
  l.linea(19, fb - 20, 17, fb - 27, LAT(3));
  l.linea(21, fb - 20, 23, fb - 27, LAT(3));
  l.linea(18, fb - 23, 15, fb - 24, LAT(3));
  l.linea(22, fb - 23, 25, fb - 24, LAT(3));
  l.rect(7, fb, 17, 1, LAT(0));
  return apoyado(l);
}

function barcoModelo(): Lienzo {
  const l = nuevo(16);
  const fb = pieA(16);
  // Mástil, velas blancas, bandera, casco de madera y soporte.
  l.rect(15, fb - 26, 2, 22, WO(2));
  l.px(17, fb - 27, RS(3));
  l.rect(17, fb - 27, 4, 2, RS(3));
  l.rect(8, fb - 22, 7, 12, NE(7));
  l.rect(8, fb - 22, 7, 1, NE(5));
  l.rect(14, fb - 22, 1, 12, NE(5));
  l.rect(17, fb - 20, 7, 9, NE(6));
  l.rect(17, fb - 20, 7, 1, NE(5));
  l.rect(8, fb - 4, 18, 1, WO(4));
  l.rect(5, fb - 3, 22, 3, WO(2));
  l.rect(5, fb - 3, 22, 1, WO(3));
  l.rect(7, fb, 18, 1, WO(1));
  l.rect(22, fb - 6, 4, 3, WO(2));
  l.rect(10, fb + 1, 3, 2, WC(1));
  l.rect(19, fb + 1, 3, 2, WC(1));
  return apoyado(l);
}

function bolaCristal(): Lienzo {
  const l = nuevo(8);
  const fb = pieA(8);
  // Soporte dorado y bola de cristal con niebla morada.
  l.rect(9, fb - 3, 14, 3, LAT(2));
  l.rect(9, fb - 3, 14, 1, LAT(3));
  l.rect(8, fb, 16, 1, LAT(0));
  l.rect(11, fb - 5, 10, 2, LAT(1));
  l.elipseSombreada(16, fb - 12, 9, 9, tn('morado', 0, 3));
  l.elipse(16, fb - 11, 5, 4, MO(3));
  l.elipse(15, fb - 11, 3, 2, MO(4));
  l.px(11, fb - 17, NE(7));
  l.px(12, fb - 18, NE(7));
  l.px(11, fb - 16, NE(7));
  l.px(20, fb - 8, MO(4));
  return apoyado(l);
}

function globoTerraqueo(): Lienzo {
  const l = nuevo(16);
  const fb = pieA(16);
  const cx = 16;
  const cy = fb - 15;
  // Esfera con continentes, aro meridiano y pie.
  l.elipseSombreada(cx, cy, 9, 9, tn('vidrio', 0, 3));
  const tierras: ReadonlyArray<readonly [number, number, number, number]> = [[-4, -4, 4, 3], [2, -2, 4, 5], [-5, 3, 3, 2]];
  for (const [dx, dy, rx, ry] of tierras) {
    for (let y = -ry; y <= ry; y++) {
      for (let x = -rx; x <= rx; x++) {
        if ((x * x) / (rx * rx) + (y * y) / (ry * ry) > 1) continue;
        const px = cx + dx + x;
        const py = cy + dy + y;
        if ((px - cx) ** 2 + (py - cy) ** 2 < 70) l.px(px, py, (px - cx) + (py - cy) < -2 ? PL(4) : PL(3));
      }
    }
  }
  l.linea(cx + 10, cy - 8, cx + 10, cy + 8, ME(2));
  l.linea(cx + 9, cy - 9, cx + 10, cy - 8, ME(3));
  l.rect(cx - 1, cy + 9, 3, 4, ME(2));
  l.rect(cx - 5, fb - 2, 11, 2, ME(2));
  l.rect(cx - 5, fb - 2, 11, 1, ME(3));
  l.rect(cx - 6, fb, 13, 1, ME(1));
  return apoyado(l);
}

// ---------------------------------------------------------------------------

const POTS = undefined;
type Hacer = () => Lienzo;
const TABLA: ReadonlyArray<readonly [string, Hacer, readonly string[] | undefined]> = [
  ['lampara-arco', lamparaArco, POTS],
  ['lampara-molecular', lamparaMolecular, POTS],
  ['lampara-maceta-panton', lamparaMacetaPanton, hex('naranja')],
  ['lampara-tuberia', lamparaTuberia, POTS],
  ['lampara-floral', lamparaFloral, POTS],
  ['lampara-lava', lamparaLava, hex('rojo-suave')],
  ['lampara-tiffany', lamparaTiffany, POTS],
  ['lampara-flecos', lamparaFlecos, hex('crema')],
  ['candelero-pie', candeleroPie, POTS],
  ['candelero-mesa', candeleroMesa, POTS],
  ['candelabro-mesa', candelabroMesa, POTS],
  ['candelabro-pie', candelabroPie, POTS],
  ['farol-marroqui', faroloMarroqui, hex('naranja')],
  ['farol-papel-mesa', faroloPapelMesa, hex('naranja')],
  ['incienso-varillas', inciensoVarillas, POTS],
  ['busto-mujer', bustoMujer, POTS],
  ['busto-hombre', bustoHombre, POTS],
  ['urna-griega-baja', urnaGriegaBaja, POTS],
  ['urna-griega-alta', urnaGriegaAlta, POTS],
  ['jarron-meiji', jarronMeiji, POTS],
  ['jarron-edo', jarronEdo, POTS],
  ['jarron-moderno', jarronModerno, hex('naranja')],
  ['jarron-moderno-redondo', jarronModernoRedondo, hex('planta')],
  ['jarron-monumental', jarronMonumental, POTS],
  ['jarron-rosas', jarronRosas, hex('rojo-suave')],
  ['jarron-lirios', jarronLirios, ['#8C8C96', '#B2B2BB', '#D7D7DD', '#FFFFFF']],
  ['atril-antiguo', atrilAntiguo, POTS],
  ['atril-moderno', atrilModerno, POTS],
  ['estatuilla-alce', estatuillaAlce, POTS],
  ['estatuilla-ciervo', estatuillaCiervo, POTS],
  ['barco-modelo', barcoModelo, POTS],
  ['bola-cristal', bolaCristal, POTS],
  ['globo-terraqueo', globoTerraqueo, POTS],
];

export function cuadrosLuz10(): Cuadros {
  const c: Cuadros = new Map();
  for (const [id, hacer, desde] of TABLA) registrarR(c, id, 'U', hacer(), desde);
  return c;
}

void CE; void CM; void CU; void LA; void llama;
