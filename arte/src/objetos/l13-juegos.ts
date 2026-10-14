/**
 * Lote 13, juegos interactivos y objetos inteligentes (13 + 3 objetos): mesas de juego (palabras secretas, pueblo y lobos,
 * cartas de patrones, construcción de mazos), cabinas y quioscos (bloques que caen, dibujo en equipo, adivinar, dock de
 * repositorio), torneo de cuatro, minigolf, gong y dos pizarras (de pared y de pie); luego bandeja de entrada, monitor de
 * estado y bombilla de estado como adornos apoyados.
 *
 * Todos son dibujos GENÉRICOS (sin marcas ni juegos de terceros). Los juegos llevan `interaccion: 'enlace'`. La pizarra de
 * pared es un colgante con las tres orientaciones de pared (`registrarPared`).
 */

import { Lienzo } from '../nucleo';
import type { ColorEntrada } from '../nucleo';
import { centrar, marco, PLATA, registrarPared } from './l12-comun';
import {
  AZ, CE, CM, CR, MO, NE, ME, PL, RO, RS, TC, VI, WC, WO,
  apoyado, hex, mesaDeJuego, nuevo, pieA, poligono, registrarR, rejilla, roca, rueda, sueloLibre,
} from './l13-comun';
import type { Cuadros } from './l13-comun';

/** Fila de cartas rectangulares con una raya de texto: `colores` se reparte de izquierda a derecha y de arriba abajo. */
function cartas(l: Lienzo, x0: number, y0: number, cols: number, filas: number, w: number, h: number, colores: readonly ColorEntrada[], texto: ColorEntrada): void {
  for (let j = 0; j < filas; j++) {
    for (let i = 0; i < cols; i++) {
      const c = colores[(j * cols + i) % colores.length] as ColorEntrada;
      const x = x0 + i * (w + 1);
      const y = y0 + j * (h + 1);
      l.rect(x, y, w, h, c);
      l.rect(x, y + h - 1, w, 1, NE(4));
      l.rect(x + 1, y + Math.floor(h / 2), Math.max(1, w - 3), 1, texto);
    }
  }
}

// ---------------------------------------------------------------------------
// Mesas de juego (2 x 1, 8 de alto extra)
// ---------------------------------------------------------------------------

function mesaPalabras(): Lienzo {
  const l = new Lienzo(64, 40);
  const t = mesaDeJuego(l, [CR(2), CR(3), CR(4)], WO);
  // Rejilla de palabras: crema, rojas, azules y una negra.
  const colores: ColorEntrada[] = [CR(4), RS(3), CR(4), VI(2), CR(4), CR(4), NE(1), CR(4), RS(3), CR(4)];
  cartas(l, t.x + 1, t.y + 1, 5, 2, 10, 5, colores, NE(3));
  l.rect(t.x + 1, t.y + 1, 10, 1, CR(4));
  return sueloLibre(l);
}

function mesaLobos(): Lienzo {
  const l = new Lienzo(64, 40);
  const t = mesaDeJuego(l, [AZ(0), AZ(1), AZ(2)], WO);
  const cy = t.y + 6;
  // Luna creciente.
  l.elipse(12, cy, 5, 5, CR(4));
  l.elipse(14, cy - 1, 4, 4, AZ(1));
  // Cabeza de lobo en silueta con ojos amarillos.
  poligono(l, [[24, cy - 5], [27, cy - 1], [37, cy - 1], [40, cy - 5], [41, cy + 2], [32, cy + 5], [23, cy + 2]], NE(1));
  l.px(28, cy, TC(3));
  l.px(36, cy, TC(3));
  l.px(32, cy + 3, NE(5));
  // Estrellas y cartas de rol.
  for (const [x, y] of [[6, t.y + 2], [20, t.y + 10], [44, t.y + 2], [50, t.y + 11]] as const) l.px(x, y, TC(3));
  cartas(l, 47, t.y + 3, 3, 1, 5, 8, [RS(3), NE(6), TC(3)], NE(3));
  return sueloLibre(l);
}

function mesaPatrones(): Lienzo {
  const l = new Lienzo(64, 40);
  const t = mesaDeJuego(l, [PL(0), PL(1), PL(2)], WO);
  const tintas: ColorEntrada[] = [RS(3), PL(4), MO(3)];
  for (let j = 0; j < 2; j++) {
    for (let i = 0; i < 6; i++) {
      const x = t.x + 1 + i * 9;
      const y = t.y + 1 + j * 6;
      l.rect(x, y, 8, 5, 'neutro-7');
      l.rect(x, y + 4, 8, 1, NE(5));
      const n = 1 + ((i + j) % 3);
      const c = tintas[(i + j * 2) % 3] as ColorEntrada;
      for (let k = 0; k < n; k++) l.rect(x + 1 + k * 3 - (n === 1 ? -2 : 0) + (n === 2 ? 1 : 0), y + 1, 2, 3, c);
    }
  }
  return sueloLibre(l);
}

function mesaMazos(): Lienzo {
  const l = new Lienzo(64, 40);
  const t = mesaDeJuego(l, [WC(1), WC(2), WC(3)], WO);
  // Cuatro montones de cartas con el dorso de colores.
  const dorsos: ColorEntrada[] = [VI(1), RS(2), PL(2), MO(2)];
  dorsos.forEach((c, i) => {
    const x = t.x + 2 + i * 11;
    l.rect(x, t.y + 3, 9, 7, c);
    l.rect(x + 1, t.y + 4, 7, 5, c);
    l.rect(x, t.y + 9, 9, 2, NE(6));
    l.rect(x, t.y + 3, 9, 1, 'neutro-7');
    l.rect(x + 2, t.y + 5, 5, 3, 'neutro-7');
    l.px(x + 4, t.y + 6, c);
  });
  // Monedas y un abanico de cartas.
  for (const [x, y] of [[48, t.y + 3], [51, t.y + 5], [49, t.y + 7], [52, t.y + 9]] as const) {
    l.elipse(x, y, 1, 1, TC(3));
    l.px(x, y, TC(1));
  }
  cartas(l, 55, t.y + 2, 1, 2, 4, 5, ['neutro-7', CR(4)], NE(3));
  return sueloLibre(l);
}

// ---------------------------------------------------------------------------
// Cabinas y quioscos (1 x 1, 32 de alto extra)
// ---------------------------------------------------------------------------

function juegoBloques(): Lienzo {
  const l = new Lienzo(32, 64);
  // Cuerpo de la cabina.
  l.rect(5, 12, 22, 44, AZ(2));
  l.rect(5, 12, 3, 44, AZ(3));
  l.rect(24, 12, 3, 44, AZ(1));
  // Rótulo de arriba.
  l.rect(5, 6, 22, 7, MO(2));
  l.rect(5, 6, 22, 1, MO(3));
  l.rect(24, 7, 3, 6, MO(1));
  for (const [x, y, c] of [[9, 9, RS(3)], [13, 9, TC(3)], [17, 9, VI(2)], [21, 9, PL(3)]] as const) l.rect(x, y, 3, 3, c);
  // Pantalla con bloques apilados y una pieza que cae.
  l.rect(8, 15, 16, 22, NE(0));
  l.rect(9, 16, 14, 20, AZ(0));
  const celda = (cx: number, cy: number, c: ColorEntrada): void => {
    l.rect(10 + cx * 3, 17 + cy * 3, 3, 3, c);
    l.px(10 + cx * 3, 17 + cy * 3, 'neutro-7');
  };
  for (const [cx, cy, c] of [[0, 5, RS(3)], [1, 5, RS(3)], [2, 5, RS(3)], [3, 5, TC(3)], [0, 4, RS(3)], [2, 4, VI(2)], [3, 4, TC(3)], [1, 3, PL(3)], [2, 3, VI(2)], [2, 2, VI(2)], [1, 0, MO(3)], [0, 1, MO(3)], [1, 1, MO(3)], [2, 1, MO(3)]] as const) celda(cx, cy, c);
  // Panel de mando con palanca y botones.
  l.rect(5, 39, 22, 6, AZ(1));
  l.rect(5, 39, 22, 1, AZ(3));
  l.rect(9, 40, 2, 3, NE(1));
  l.elipse(10, 40, 1, 1, RS(3));
  l.rect(17, 41, 3, 2, RS(3));
  l.rect(21, 41, 3, 2, TC(3));
  l.rect(7, 47, 18, 9, AZ(1));
  l.rect(10, 50, 12, 1, AZ(2));
  return sueloLibre(l);
}

function juegoDibujo(): Lienzo {
  const l = new Lienzo(32, 64);
  // Patas del caballete.
  l.linea(16, 8, 5, 58, WC(1));
  l.linea(17, 8, 6, 58, WC(2));
  l.linea(16, 8, 27, 58, WC(1));
  l.linea(15, 8, 26, 58, WC(2));
  l.linea(16, 30, 16, 58, WC(0));
  // Lienzo con un dibujo en equipo: sol, casa, pasto y garabato.
  l.rect(6, 9, 20, 28, WC(3));
  l.rect(8, 11, 16, 24, 'neutro-7');
  l.rect(8, 11, 16, 1, NE(6));
  l.rect(8, 28, 16, 7, PL(3));
  l.elipse(20, 16, 3, 3, TC(3));
  l.rect(11, 22, 7, 6, RS(3));
  poligono(l, [[10, 22], [19, 22], [14, 17]], RO(2));
  l.rect(13, 25, 2, 3, WC(2));
  l.linea(9, 31, 14, 33, VI(2));
  l.linea(14, 33, 19, 30, VI(2));
  l.linea(19, 30, 23, 33, MO(3));
  // Repisa con pinturas y un pincel.
  l.rect(4, 38, 24, 3, WC(2));
  l.rect(4, 38, 24, 1, WC(4));
  for (const [x, c] of [[7, RS(3)], [12, VI(2)], [17, TC(3)]] as const) {
    l.rect(x, 36, 3, 2, c);
    l.px(x, 36, 'neutro-7');
  }
  l.linea(22, 37, 26, 32, WC(1));
  l.px(26, 31, MO(3));
  return sueloLibre(l);
}

function juegoAdivinar(): Lienzo {
  const l = new Lienzo(32, 64);
  // Pedestal.
  l.rect(12, 38, 8, 20, AZ(2));
  l.rect(12, 38, 2, 20, AZ(3));
  l.rect(18, 38, 2, 20, AZ(1));
  l.rect(7, 56, 18, 3, AZ(1));
  l.rect(7, 56, 18, 1, AZ(3));
  // Cartel redondo con la interrogación.
  l.elipseSombreada(16, 22, 14, 14, [MO(1), MO(2), MO(3), MO(4)], { relieve: 0.7 });
  l.elipse(16, 22, 11, 11, MO(2), { relleno: false });
  rejilla(l, 13, 14, [
    '.###.',
    '#...#',
    '....#',
    '...#.',
    '..#..',
    '..#..',
    '.....',
    '..#..',
  ], { '#': 'neutro-7' });
  for (const [x, y] of [[3, 8], [28, 10], [29, 34], [3, 32]] as const) l.px(x, y, TC(3));
  return sueloLibre(l);
}

function dockRepositorio(): Lienzo {
  const l = new Lienzo(32, 64);
  // Base con puertos y cable.
  l.rect(4, 49, 24, 9, NE(2));
  l.rect(4, 49, 24, 1, NE(4));
  l.rect(4, 49, 2, 9, NE(3));
  l.rect(26, 50, 2, 8, NE(1));
  for (const x of [8, 12, 16]) l.rect(x, 53, 3, 2, NE(0));
  l.px(23, 53, PL(4));
  l.px(23, 52, PL(3));
  l.linea(27, 56, 31, 52, NE(1));
  // Cuello y pantalla.
  l.rect(13, 44, 6, 6, NE(1));
  l.rect(2, 8, 28, 37, NE(2));
  l.rect(2, 8, 28, 1, NE(4));
  l.rect(2, 8, 1, 37, NE(4));
  l.rect(29, 9, 1, 36, NE(1));
  l.rect(4, 10, 24, 32, NE(0));
  // Gráfico de ramas: una línea principal, una rama que se separa y se une, y los nodos de cada cambio.
  l.rect(10, 14, 1, 24, VI(2));
  l.linea(10, 20, 17, 24, PL(3));
  l.rect(17, 24, 1, 8, PL(3));
  l.linea(17, 32, 10, 35, PL(3));
  const nodo = (x: number, y: number, c: ColorEntrada): void => {
    l.rect(x - 1, y - 1, 3, 3, c);
    l.px(x - 1, y - 1, 'neutro-7');
  };
  for (const y of [14, 20, 28, 35]) nodo(10, y, VI(3));
  for (const y of [24, 31]) nodo(17, y, PL(4));
  nodo(10, 38, MO(3));
  // Líneas de detalle a la derecha de cada nodo.
  for (const [x, y, w, c] of [[13, 14, 9, NE(4)], [21, 24, 6, NE(3)], [21, 31, 5, NE(3)], [13, 38, 8, NE(4)], [14, 28, 7, NE(3)]] as const) l.rect(x, y, w, 1, c);
  return sueloLibre(l);
}

// ---------------------------------------------------------------------------
// Torneo de cuatro (2 x 1, 32 de alto extra)
// ---------------------------------------------------------------------------

function torneoCuatro(): Lienzo {
  const l = new Lienzo(64, 64);
  // Patas con ruedas.
  for (const x of [9, 51]) {
    l.rect(x, 40, 4, 17, ME(1));
    l.rect(x, 40, 1, 17, ME(2));
    l.rect(x - 3, 56, 10, 2, ME(0));
    rueda(l, x + 2, 59, 2);
  }
  // Tablero.
  l.rect(4, 4, 56, 37, ME(2));
  l.rect(4, 4, 56, 1, ME(3));
  l.rect(4, 4, 1, 37, ME(3));
  l.rect(59, 5, 1, 36, ME(1));
  l.rect(6, 6, 52, 33, NE(7));
  l.rect(6, 6, 52, 1, NE(6));
  const casilla = (x: number, y: number, c: ColorEntrada): void => {
    l.rect(x, y, 11, 4, c);
    l.rect(x, y + 3, 11, 1, NE(5));
    l.rect(x + 1, y + 1, 6, 1, 'neutro-7');
  };
  // Cuatro participantes, dos finalistas y el campeón.
  const cuadro: [number, number, ColorEntrada][] = [[9, 9, VI(2)], [9, 15, RS(3)], [9, 28, PL(3)], [9, 34, MO(3)]];
  for (const [x, y, c] of cuadro) casilla(x, y, c);
  casilla(26, 12, RS(3));
  casilla(26, 31, PL(3));
  casilla(41, 22, PL(3));
  const lin = AZ(1);
  for (const [y0, y1, x, xn] of [[11, 17, 20, 26], [30, 36, 20, 26]] as const) {
    l.rect(20, y0, 3, 1, lin);
    l.rect(20, y1, 3, 1, lin);
    l.rect(22, y0, 1, y1 - y0 + 1, lin);
    l.rect(22, Math.round((y0 + y1) / 2), xn - 22, 1, lin);
    void x;
  }
  l.rect(37, 14, 3, 1, lin);
  l.rect(37, 33, 3, 1, lin);
  l.rect(39, 14, 1, 20, lin);
  l.rect(39, 24, 2, 1, lin);
  // Copa del campeón.
  l.rect(53, 22, 4, 3, TC(3));
  l.rect(54, 25, 2, 3, TC(2));
  l.rect(52, 28, 6, 2, TC(1));
  l.px(52, 22, TC(2));
  l.px(57, 22, TC(2));
  return sueloLibre(l);
}

// ---------------------------------------------------------------------------
// Minigolf (3 x 1, 16 de alto extra)
// ---------------------------------------------------------------------------

function minigolf(): Lienzo {
  const l = new Lienzo(96, 48);
  // Pista elevada con borde de madera y césped sintético.
  l.rect(3, 19, 90, 21, WC(2));
  l.rect(3, 19, 90, 2, WC(3));
  l.rect(3, 37, 90, 3, WC(1));
  l.rect(90, 20, 3, 17, WC(1));
  l.rect(6, 22, 84, 15, CE(2));
  for (let x = 7; x < 89; x += 3) {
    l.px(x, 23 + ((x * 7) % 12), CE(3));
    l.px(x + 1, 24 + ((x * 5) % 11), CE(1));
  }
  l.rect(6, 22, 84, 1, CE(1));
  // Obstáculos: una rampa y una barrera.
  poligono(l, [[38, 36], [52, 36], [52, 29]], CM(2));
  l.rect(52, 29, 3, 7, CM(1));
  l.rect(30, 24, 3, 8, WC(3));
  l.rect(30, 24, 1, 8, WC(4));
  // Hoyo con bandera y bola.
  l.elipse(72, 30, 3, 2, NE(0));
  l.rect(72, 8, 1, 22, NE(5));
  poligono(l, [[73, 8], [82, 11], [73, 14]], RO(3));
  l.elipse(15, 31, 1, 1, 'neutro-7');
  l.rect(11, 33, 8, 1, 'neutro-7');
  return sueloLibre(l);
}

// ---------------------------------------------------------------------------
// Gong (1 x 1, 32 de alto extra)
// ---------------------------------------------------------------------------

function gong(): Lienzo {
  const l = new Lienzo(32, 64);
  for (const x of [3, 26]) {
    l.rect(x, 6, 3, 52, WO(2));
    l.rect(x, 6, 1, 52, WO(3));
    l.rect(x + 2, 6, 1, 52, WO(1));
  }
  l.rect(2, 6, 28, 4, WO(3));
  l.rect(2, 9, 28, 1, WO(1));
  l.rect(0, 56, 9, 3, WO(1));
  l.rect(23, 56, 9, 3, WO(1));
  // Cuerdas y disco de bronce.
  l.linea(7, 10, 11, 25, NE(3));
  l.linea(25, 10, 21, 25, NE(3));
  l.elipseSombreada(16, 32, 10, 10, [TC(0), TC(1), TC(2), TC(3)], { relieve: 0.7 });
  l.elipse(16, 32, 7, 7, TC(1), { relleno: false });
  l.elipseSombreada(16, 32, 3, 3, [TC(1), TC(2), TC(3), CR(4)]);
  // Mazo apoyado.
  l.linea(27, 58, 23, 46, WC(2));
  l.elipseSombreada(22, 44, 3, 3, [WO(0), WO(1), WO(2), WO(3)]);
  return sueloLibre(l);
}

// ---------------------------------------------------------------------------
// Pizarras
// ---------------------------------------------------------------------------

/** Garabatos de lluvia de ideas: notas adhesivas, flechas y una nube. */
function contenidoPizarra(l: Lienzo, x: number, y: number, w: number, h: number): void {
  l.rect(x, y, w, h, 'neutro-7');
  l.rect(x, y + h - 1, w, 1, NE(6));
  const nota = (nx: number, ny: number, c: ColorEntrada): void => {
    l.rect(nx, ny, 7, 7, c);
    l.rect(nx, ny + 6, 7, 1, NE(4));
    l.rect(nx + 1, ny + 2, 4, 1, NE(3));
    l.rect(nx + 1, ny + 4, 3, 1, NE(3));
  };
  nota(x + 3, y + 3, TC(3));
  nota(x + Math.round(w * 0.42), y + 4, RS(4));
  nota(x + w - 11, y + 3, PL(4));
  l.linea(x + 11, y + 7, x + Math.round(w * 0.42) - 1, y + 7, VI(2));
  l.linea(x + Math.round(w * 0.42) + 8, y + 7, x + w - 12, y + 7, VI(2));
  l.rect(x + 4, y + h - 8, Math.round(w * 0.35), 1, RS(3));
  l.rect(x + 4, y + h - 5, Math.round(w * 0.5), 1, VI(2));
  l.linea(x + w - 14, y + h - 4, x + w - 5, y + h - 8, MO(3));
}

function pizarraPie(): Lienzo {
  const l = new Lienzo(64, 64);
  for (const x of [8, 53]) {
    l.rect(x, 44, 3, 14, ME(1));
    l.rect(x, 44, 1, 14, ME(2));
    l.rect(x - 3, 56, 9, 2, ME(0));
    rueda(l, x + 1, 59, 2);
  }
  l.rect(4, 5, 56, 38, ME(2));
  l.rect(4, 5, 56, 1, ME(3));
  l.rect(4, 5, 1, 38, ME(3));
  l.rect(59, 6, 1, 37, ME(1));
  contenidoPizarra(l, 6, 7, 52, 31);
  l.rect(4, 40, 56, 4, ME(1));
  l.rect(4, 40, 56, 1, ME(3));
  for (const [x, c] of [[12, RO(3)], [17, VI(2)], [22, PL(3)]] as const) l.rect(x, 41, 4, 2, c);
  return sueloLibre(l);
}

function pizarraPared(l: Lienzo, W: number, H: number): void {
  const [x, y] = centrar(W, H, 58, 26);
  const i = marco(l, x, y, 58, 26, PLATA, 2);
  contenidoPizarra(l, i.x, i.y, i.w, i.h);
  l.rect(x + 3, y + 25, 52, 1, ME(1));
  l.rect(x + 6, y + 24, 3, 1, RO(3));
  l.rect(x + 11, y + 24, 3, 1, VI(2));
}

// ---------------------------------------------------------------------------
// Objetos inteligentes de adorno (apoyados)
// ---------------------------------------------------------------------------

function bandejaEntrada(): Lienzo {
  const l = nuevo(8);
  const fb = pieA(8);
  // Bandeja de abajo con cartas, y la de arriba sostenida por dos soportes.
  l.rect(6, fb - 4, 20, 5, NE(2));
  l.rect(6, fb - 4, 20, 1, NE(4));
  l.rect(25, fb - 3, 1, 4, NE(1));
  l.rect(8, fb - 9, 16, 6, 'neutro-7');
  l.rect(8, fb - 9, 16, 1, NE(6));
  l.linea(8, fb - 9, 16, fb - 5, NE(4));
  l.linea(24, fb - 9, 16, fb - 5, NE(4));
  l.rect(12, fb - 12, 12, 4, CR(4));
  l.px(18, fb - 10, RO(3));
  l.rect(6, fb - 13, 2, 10, NE(2));
  l.rect(24, fb - 13, 2, 10, NE(1));
  l.rect(6, fb - 14, 20, 3, NE(3));
  l.rect(6, fb - 14, 20, 1, NE(5));
  // Aviso de pendientes.
  l.elipse(25, fb - 17, 3, 3, RO(3));
  l.px(24, fb - 18, 'neutro-7');
  return apoyado(l);
}

function monitorEstado(): Lienzo {
  const l = nuevo(16);
  const fb = pieA(16);
  l.rect(10, fb - 3, 12, 4, NE(3));
  l.rect(10, fb - 3, 12, 1, NE(5));
  l.rect(14, fb - 6, 4, 4, NE(2));
  l.rect(4, fb - 24, 24, 19, NE(2));
  l.rect(4, fb - 24, 24, 1, NE(4));
  l.rect(4, fb - 24, 1, 19, NE(4));
  l.rect(27, fb - 23, 1, 18, NE(1));
  l.rect(6, fb - 22, 20, 14, AZ(1));
  // Tres servicios: activo, en revisión y caído.
  const fila = (y: number, punto: ColorEntrada, barra: ColorEntrada, ancho: number): void => {
    l.rect(8, y, 3, 3, punto);
    l.px(8, y, 'neutro-7');
    l.rect(13, y + 1, ancho, 1, barra);
  };
  fila(fb - 20, PL(4), PL(3), 10);
  fila(fb - 16, TC(3), TC(2), 7);
  fila(fb - 12, RO(3), RO(2), 11);
  l.rect(6, fb - 22, 3, 1, 'neutro-7');
  return apoyado(l);
}

function bombillaEstado(): Lienzo {
  const l = nuevo(16);
  const fb = pieA(16);
  l.rect(9, fb - 3, 14, 4, NE(2));
  l.rect(9, fb - 3, 14, 1, NE(4));
  l.rect(12, fb - 8, 8, 5, ME(2));
  for (const y of [fb - 7, fb - 5]) l.rect(12, y, 8, 1, ME(1));
  l.rect(12, fb - 8, 2, 5, ME(3));
  l.elipseSombreada(16, fb - 17, 8, 9, [TC(1), TC(2), TC(3), CR(4)], { relieve: 0.8 });
  l.linea(14, fb - 9, 14, fb - 14, CR(4));
  l.linea(18, fb - 9, 18, fb - 14, CR(4));
  l.linea(14, fb - 14, 18, fb - 14, CR(4));
  l.px(12, fb - 21, 'neutro-7');
  l.px(12, fb - 20, 'neutro-7');
  return apoyado(l);
}

void CE;
void roca;
void MO;
void hex;

export function cuadrosJuegos13(): Cuadros {
  const c: Cuadros = new Map();
  registrarPared(c, 'pizarra-pared', pizarraPared);
  registrarR(c, 'pizarra-pie', 'U', pizarraPie());
  registrarR(c, 'mesa-palabras', 'U', mesaPalabras());
  registrarR(c, 'mesa-lobos', 'U', mesaLobos());
  registrarR(c, 'mesa-patrones', 'U', mesaPatrones());
  registrarR(c, 'mesa-mazos', 'U', mesaMazos());
  registrarR(c, 'juego-bloques', 'U', juegoBloques());
  registrarR(c, 'juego-dibujo', 'U', juegoDibujo());
  registrarR(c, 'juego-adivinar', 'U', juegoAdivinar());
  registrarR(c, 'torneo-cuatro', 'U', torneoCuatro());
  registrarR(c, 'minigolf', 'U', minigolf());
  registrarR(c, 'gong', 'U', gong());
  registrarR(c, 'dock-repositorio', 'U', dockRepositorio());
  registrarR(c, 'bandeja-entrada', 'U', bandejaEntrada());
  registrarR(c, 'monitor-estado', 'U', monitorEstado());
  registrarR(c, 'bombilla-estado', 'U', bombillaEstado(), hex('tela-calida'));
  return c;
}
