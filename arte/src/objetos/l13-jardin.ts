/**
 * Lote 13, agua, piedra y plantas de jardín (11 objetos): estanque con peces koi, cascada, jardín zen con roca, linterna de
 * piedra, arbustos, helecho, hosta, equinácea, rosal y girasoles de jardín. Todo de orientación única.
 *
 * Variantes por recoloreo: las flores se dibujan con `rojo-suave` (arbusto, equinácea) o `rojo` (rosal) y se recolorean a
 * amarillo, morado y blanco.
 */

import { Lienzo } from '../nucleo';
import type { ColorEntrada } from '../nucleo';
import { dentroElipse } from './l2b-comun';
import {
  BA, CE, CM, CR, HOJA, HOJA_PASTEL, LC, NA, PL, RO, RS, TC, VI, WC, WO,
  abanico, azar, bola, ent, flor, hex, mata, pasto, registrarR, roca, sueloLibre, tablon, tn,
} from './l13-comun';
import type { Cuadros } from './l13-comun';

// ---------------------------------------------------------------------------
// Estanque con peces koi (2 x 2)
// ---------------------------------------------------------------------------

/** Un pez visto desde arriba: cuerpo ovalado con cola y una mancha. `dir` es 1 si mira a la derecha, -1 a la izquierda. */
function pez(l: Lienzo, x: number, y: number, dir: 1 | -1, cuerpo: ColorEntrada, mancha: ColorEntrada): void {
  l.elipse(x, y, 4, 2, cuerpo);
  l.px(x - dir * 5, y, cuerpo);
  l.px(x - dir * 6, y - 1, cuerpo);
  l.px(x - dir * 6, y + 1, cuerpo);
  l.rect(x - 1, y - 1, 3, 2, mancha);
  l.px(x + dir * 3, y - 1, 'neutro-1');
}

function estanque(): Lienzo {
  const l = new Lienzo(64, 64);
  l.elipse(32, 36, 29, 21, CM(1));
  l.elipse(32, 35, 26, 18, VI(0));
  l.elipse(33, 36, 25, 17, VI(1));
  l.elipse(33, 37, 20, 12, VI(2));
  l.elipse(30, 33, 11, 5, VI(3));
  // Ondas y brillos.
  for (const [x, y, w] of [[18, 40, 5], [42, 44, 6], [46, 28, 4], [24, 28, 5]] as const) l.rect(x, y, w, 1, VI(3));
  // Nenúfares con una flor.
  for (const [x, y] of [[40, 34], [16, 34], [28, 46]] as const) {
    l.elipse(x, y, 5, 3, PL(2));
    l.elipse(x - 1, y - 1, 3, 1, PL(3));
    l.px(x + 2, y, VI(1));
    l.px(x + 3, y, VI(1));
  }
  flor(l, 40, 33, RS, TC(3));
  // Peces: naranja con blanco, blanco con naranja y uno más.
  pez(l, 25, 39, -1, NA(2), 'neutro-7');
  pez(l, 46, 41, 1, 'neutro-7', NA(3));
  pez(l, 33, 28, 1, NA(3), RS(3));
  // Piedras del borde, de atrás hacia adelante.
  const piedras: [number, number, number, number][] = [];
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2;
    piedras.push([Math.round(32 + Math.cos(a) * 28.5), Math.round(36 + Math.sin(a) * 20.5), 4 + (i % 3 === 0 ? 1 : 0), 3 + (i % 2)]);
  }
  piedras.sort((p, q) => p[1] - q[1]);
  piedras.forEach(([x, y, rx, ry], i) => roca(l, x, y, rx, ry, i % 5 === 1));
  return sueloLibre(l);
}

// ---------------------------------------------------------------------------
// Cascada (2 x 2, 32 de alto extra)
// ---------------------------------------------------------------------------

function cascada(): Lienzo {
  const l = new Lienzo(64, 96);
  // Charco.
  l.elipse(32, 78, 28, 12, VI(0));
  l.elipse(32, 79, 27, 11, VI(1));
  l.elipse(32, 80, 21, 8, VI(2));
  // Pared de roca, hilera por hilera (cada una tapa un poco la de arriba).
  const hileras: [number, number[], number, number][] = [
    [16, [22, 34, 46], 9, 8],
    [28, [14, 26, 38, 50], 9, 9],
    [41, [9, 21, 33, 45, 56], 9, 9],
    [54, [7, 19, 31, 43, 55], 9, 9],
    [65, [10, 24, 38, 52], 10, 8],
  ];
  hileras.forEach(([y, xs, rx, ry], h) => xs.forEach((x, i) => roca(l, x, y, rx, ry, h === 0 && i % 2 === 0)));
  // Verde arriba.
  mata(l, 22, 9, 8, 5, [PL(1), PL(2), PL(3), PL(4)], PL(0), 81);
  mata(l, 42, 10, 7, 5, [PL(1), PL(2), PL(3), PL(4)], PL(0), 82);
  // Dos chorros.
  const chorro = (x: number, w: number, y0: number, y1: number): void => {
    l.rect(x, y0, w, y1 - y0, VI(2));
    l.rect(x, y0, 1, y1 - y0, VI(3));
    l.rect(x + w - 1, y0, 1, y1 - y0, VI(1));
    for (let y = y0 + 2; y < y1 - 2; y += 6) l.rect(x + 1, y, Math.max(1, w - 3), 2, 'neutro-7');
  };
  chorro(21, 8, 14, 70);
  chorro(37, 5, 26, 72);
  // Espuma donde cae el agua y piedras del frente.
  for (const [x, y, rx] of [[25, 71, 8], [40, 73, 6]] as const) {
    l.elipse(x, y, rx, 2, 'neutro-7');
    l.elipse(x - 1, y - 1, rx - 3, 1, BA(3));
  }
  for (const [x, y, rx, ry] of [[8, 80, 5, 4], [55, 80, 5, 4], [20, 88, 5, 3], [44, 88, 6, 3], [32, 90, 4, 2]] as const) roca(l, x, y, rx, ry, x === 8);
  return sueloLibre(l);
}

// ---------------------------------------------------------------------------
// Jardín zen con roca (2 x 2, 8 de alto extra)
// ---------------------------------------------------------------------------

function jardinZen(): Lienzo {
  const l = new Lienzo(64, 72);
  // Arena rastrillada.
  l.rect(4, 22, 56, 38, LC(3));
  const rx = 38;
  const ry = 38;
  for (let y = 24; y < 58; y += 4) {
    for (let x = 5; x < 59; x++) if (!dentroElipse(x, y, rx, ry, 26, 17)) l.px(x, y, LC(1));
  }
  for (const [a, b] of [[12, 8], [18, 12], [24, 16]] as const) l.elipse(rx, ry, a, b, LC(1), { relleno: false });
  l.elipse(rx, ry, 9, 6, LC(3));
  // Marco de tablones.
  tablon(l, 2, 16, 60, 6, WC);
  l.rect(2, 16, 4, 48, WC(2));
  l.rect(2, 16, 1, 48, WC(3));
  l.rect(5, 22, 1, 38, WC(1));
  l.rect(58, 16, 4, 48, WC(2));
  l.rect(61, 16, 1, 48, WC(1));
  l.rect(58, 22, 1, 38, WC(3));
  tablon(l, 2, 58, 60, 8, WC);
  l.rect(4, 59, 56, 1, WC(4));
  // Rocas: la grande con musgo, dos chicas.
  roca(l, 22, 49, 4, 3, false);
  roca(l, 50, 50, 3, 2, false);
  roca(l, 38, 33, 10, 9, true);
  roca(l, 31, 38, 5, 4, false);
  return sueloLibre(l);
}

// ---------------------------------------------------------------------------
// Linterna de piedra (1 x 1, 32 de alto extra)
// ---------------------------------------------------------------------------

function linternaPiedra(): Lienzo {
  const l = new Lienzo(32, 64);
  // Pie y poste.
  l.rect(8, 54, 16, 5, CM(2));
  l.rect(8, 54, 16, 1, CM(3));
  l.rect(23, 55, 1, 4, CM(1));
  l.rect(13, 42, 6, 12, CM(2));
  l.rect(13, 42, 2, 12, CM(3));
  l.rect(18, 42, 1, 12, CM(1));
  // Plato y caja de la llama.
  l.rect(7, 38, 18, 4, CM(2));
  l.rect(7, 38, 18, 1, CM(3));
  l.rect(24, 39, 1, 3, CM(1));
  l.rect(10, 27, 12, 11, CM(2));
  l.rect(10, 27, 2, 11, CM(3));
  l.rect(21, 27, 1, 11, CM(1));
  l.rect(13, 30, 6, 6, TC(3));
  l.rect(13, 30, 6, 1, 'tela-calida-2');
  l.rect(15, 30, 1, 6, TC(2));
  l.px(14, 31, CR(4));
  // Techo en pagoda y remate.
  for (let i = 0; i < 4; i++) {
    const y = 26 - i * 2;
    l.rect(3 + i * 2, y, 26 - i * 4, 2, i === 0 ? CM(3) : CM(2));
    l.px(3 + i * 2, y, CM(3));
    l.px(28 - i * 2, y + 1, CM(1));
  }
  l.rect(3, 26, 26, 1, CM(3));
  l.rect(3, 27, 26, 1, CM(1));
  l.elipseSombreada(16, 14, 3, 3, [CM(1), CM(2), CM(3), CM(3)]);
  l.px(16, 10, CM(3));
  l.px(11, 18, CE(2));
  l.px(12, 18, CE(2));
  l.px(9, 56, CE(2));
  return sueloLibre(l);
}

// ---------------------------------------------------------------------------
// Arbustos y plantas de jardín
// ---------------------------------------------------------------------------

const VERDES: ColorEntrada[] = [PL(1), PL(2), PL(3), PL(4)];

function arbusto(conFlores: boolean): Lienzo {
  const l = new Lienzo(32, 40);
  pasto(l, [[3, 35], [5, 36], [27, 36], [29, 35]]);
  mata(l, 9, 27, 8, 7, VERDES, PL(0), 91);
  mata(l, 23, 27, 8, 7, VERDES, PL(0), 92);
  mata(l, 16, 21, 10, 9, VERDES, PL(0), 93);
  mata(l, 16, 30, 13, 6, VERDES, PL(0), 94);
  if (conFlores) for (const [x, y] of [[8, 25], [14, 18], [22, 22], [18, 29], [26, 28], [11, 31], [20, 14]] as const) flor(l, x, y, RS, CR(4));
  return sueloLibre(l);
}

function suelitoDeMata(l: Lienzo, cx: number, y: number, rx: number): void {
  l.elipse(cx, y, rx, 2, WO(1));
  l.elipse(cx - 1, y - 1, rx - 2, 1, WO(2));
}

function helechoJardin(): Lienzo {
  const l = new Lienzo(32, 48);
  suelitoDeMata(l, 16, 42, 9);
  abanico(l, 16, 41, 9, 24, 7, -82, 82, HOJA, 0.3);
  abanico(l, 16, 41, 6, 15, 5, -55, 55, HOJA_PASTEL, 0.2);
  return sueloLibre(l);
}

function hostaJardin(): Lienzo {
  const l = new Lienzo(32, 40);
  suelitoDeMata(l, 16, 35, 11);
  const hojas: [number, number][] = [[3, 29], [29, 29], [5, 19], [27, 19], [16, 12]];
  for (const [x, y] of hojas) l.hoja([16, 34], [x, y], 11, HOJA_PASTEL, { nervadura: true });
  l.hoja([16, 34], [10, 22], 9, HOJA, { nervadura: true });
  l.hoja([16, 34], [22, 22], 9, HOJA, { nervadura: true });
  return sueloLibre(l);
}

function equinacea(): Lienzo {
  const l = new Lienzo(32, 48);
  suelitoDeMata(l, 16, 43, 8);
  l.hoja([16, 42], [6, 34], 6, VERDES);
  l.hoja([16, 42], [26, 35], 6, VERDES);
  const flores: [number, number, number][] = [[10, 38, 18], [17, 36, 10], [24, 38, 20]];
  for (const [x, yb, yc] of flores) {
    l.linea(x < 16 ? 15 : x > 16 ? 18 : 16, 42, x, yc + 3, PL(2));
    // Pétalos que caen alrededor del cono.
    for (const [px, py] of [[-6, 3], [-5, -2], [-3, -5], [0, -6], [4, -5], [6, -1], [6, 3]] as const) {
      l.hoja([x, yc], [x + px, yc + py], 3, [RS(1), RS(2), RS(3), RS(4)]);
    }
    l.elipseSombreada(x, yc, 3, 3, [NA(0), NA(1), NA(2), NA(3)]);
    void yb;
  }
  return sueloLibre(l);
}

function rosal(): Lienzo {
  const l = new Lienzo(32, 48);
  pasto(l, [[3, 44], [5, 45], [27, 45], [29, 44]]);
  mata(l, 9, 33, 8, 8, VERDES, PL(0), 95);
  mata(l, 23, 33, 8, 8, VERDES, PL(0), 96);
  mata(l, 16, 27, 10, 9, VERDES, PL(0), 97);
  mata(l, 16, 38, 13, 6, VERDES, PL(0), 98);
  for (const [x, y] of [[8, 29], [15, 20], [22, 25], [17, 32], [26, 33], [10, 37], [21, 17]] as const) {
    bola(l, x, y, 3, 3, [RO(1), RO(2), RO(3), RO(4)]);
    l.px(x, y, RO(0));
    l.px(x + 1, y - 1, RO(1));
  }
  return sueloLibre(l);
}

function girasolJardin(): Lienzo {
  const l = new Lienzo(32, 64);
  suelitoDeMata(l, 16, 58, 10);
  // Tallos y hojas.
  l.linea(16, 57, 16, 22, PL(2));
  l.linea(17, 57, 17, 22, PL(1));
  l.linea(14, 57, 8, 36, PL(2));
  l.linea(18, 57, 25, 34, PL(2));
  l.hoja([16, 48], [5, 42], 7, VERDES);
  l.hoja([17, 44], [28, 40], 7, VERDES);
  l.hoja([15, 54], [8, 52], 5, VERDES);
  const cabeza = (x: number, y: number, r: number): void => {
    const n = 12;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      l.hoja([x, y], [Math.round(x + Math.cos(a) * (r + 3)), Math.round(y + Math.sin(a) * (r + 3))], 4, [TC(0), TC(1), TC(2), TC(3)]);
    }
    l.elipseSombreada(x, y, r - 1, r - 1, [WO(0), WO(1), WO(2), WO(3)]);
    l.px(x - 1, y - 1, WO(4));
  };
  cabeza(8, 34, 3);
  cabeza(25, 32, 3);
  cabeza(16, 15, 5);
  return sueloLibre(l);
}

void azar;
void ent;
void hex;
void tn;
void CE;

export function cuadrosJardin13(): Cuadros {
  const c: Cuadros = new Map();
  const ROSA = hex('rojo-suave');
  registrarR(c, 'estanque-koi', 'U', estanque());
  registrarR(c, 'cascada', 'U', cascada());
  registrarR(c, 'jardin-zen', 'U', jardinZen());
  registrarR(c, 'linterna-piedra', 'U', linternaPiedra());
  registrarR(c, 'arbusto', 'U', arbusto(false));
  registrarR(c, 'arbusto-flores', 'U', arbusto(true), ROSA);
  registrarR(c, 'helecho-jardin', 'U', helechoJardin());
  registrarR(c, 'hosta-jardin', 'U', hostaJardin());
  registrarR(c, 'equinacea', 'U', equinacea(), ROSA);
  registrarR(c, 'rosal', 'U', rosal(), hex('rojo'));
  registrarR(c, 'girasol-jardin', 'U', girasolJardin());
  return c;
}
