/**
 * Lote 10, plantas y macetas (35 objetos). Todas de orientación única. Las macetas de barro se dibujan con la rampa
 * `maceta-terracota` y las variantes `blanco`, `negro` y `azul` la recolorean; las flores se dibujan con `rojo-suave`
 * y las variantes `amarillo`, `morado` y `blanco` la recolorean.
 */

import { Lienzo, rampa } from '../nucleo';
import type { ColorEntrada } from '../nucleo';
import {
  AZ, BG, CE, CM, CR, CU, HOJA, HOJA_OSCURA, HOJA_PASTEL, MC, ME, NA, NE, PL, RS, TC, VI, WC, WO,
  abanico, apoyado, azar, bloque, copa, flor, florGrande, hex, maceta, nuevo, pie, pieA, registrarR, suelo, sueloLibre, tallo, tierra, tn,
} from './l10-comun';
import type { Cuadros } from './l10-comun';

const POT = hex('maceta-terracota');
const ROSA = hex('rojo-suave');

// ---------------------------------------------------------------------------
// Pequeñas, para escritorio
// ---------------------------------------------------------------------------

function hostaChica(): Lienzo {
  const l = nuevo(8);
  const fb = pieA(8);
  const top = fb - 7;
  abanico(l, CX15, top + 1, 6, 11, 7, -82, 82, HOJA, 0.25);
  maceta(l, CX15, fb, 10, 6);
  return apoyado(l);
}
const CX15 = 15;

function brote(): Lienzo {
  const l = nuevo(8);
  const fb = pieA(8);
  const top = fb - 6;
  tallo(l, 15, top, 15, top - 5, PL(3));
  l.hoja([15, top - 4], [8, top - 9], 5, HOJA);
  l.hoja([15, top - 4], [22, top - 10], 5, HOJA);
  l.hoja([15, top - 5], [15, top - 9], 3, tn('planta', 2, 4));
  maceta(l, 15, fb, 8, 5);
  return apoyado(l);
}

function aloeVera(): Lienzo {
  const l = nuevo(8);
  const fb = pieA(8);
  abanico(l, 15, fb - 6, 7, 12, 5, -62, 62, HOJA_PASTEL, 0.15);
  maceta(l, 15, fb, 10, 6, (n) => BG(n + 1), 2);
  return apoyado(l);
}

function bambuSuerte(): Lienzo {
  const l = nuevo(8);
  const fb = pieA(8);
  // Tallos con nudos.
  for (const [x, h] of [[12, 14], [15, 18], [18, 12]] as const) {
    l.rect(x, fb - 7 - h, 2, h, PL(3));
    l.rect(x, fb - 7 - h, 1, h, PL(4));
    for (let y = fb - 10; y > fb - 7 - h; y -= 5) l.rect(x, y, 2, 1, PL(1));
    l.hoja([x + 1, fb - 7 - h + 2], [x + 6, fb - 7 - h - 3], 3, HOJA);
    l.hoja([x, fb - 7 - h + 3], [x - 5, fb - 7 - h - 2], 3, HOJA);
  }
  // Florero de vidrio con piedras.
  l.rect(9, fb - 7, 14, 8, VI(3));
  l.rect(9, fb - 7, 1, 8, 'neutro-7');
  l.rect(22, fb - 7, 1, 8, VI(2));
  l.rect(9, fb, 14, 1, VI(1));
  l.rect(10, fb - 2, 12, 2, VI(1));
  for (const x of [11, 14, 17, 20]) l.px(x, fb - 2, NE(5));
  return apoyado(l);
}

function bonsai(): Lienzo {
  const l = nuevo(8);
  const fb = pieA(8);
  // Maceta baja y rectangular.
  l.rect(8, fb - 3, 16, 4, CU(1));
  l.rect(8, fb - 3, 16, 1, CU(3));
  l.rect(8, fb - 3, 1, 4, CU(2));
  l.rect(23, fb - 3, 1, 4, CU(0));
  l.rect(10, fb, 3, 1, CU(0));
  l.rect(19, fb, 3, 1, CU(0));
  // Tronco torcido.
  l.linea(15, fb - 4, 14, fb - 8, WO(3));
  l.linea(14, fb - 8, 17, fb - 12, WO(3));
  l.linea(16, fb - 4, 15, fb - 8, WO(2));
  l.linea(17, fb - 12, 18, fb - 15, WO(2));
  // Copas.
  copa(l, 15, fb - 17, [[-7, 3, 4], [7, 4, 4], [0, -1, 5]], HOJA);
  return apoyado(l);
}

function cactusDiminuto(): Lienzo {
  const l = nuevo(8);
  const fb = pieA(8);
  // Columna con dos brazos.
  l.elipseSombreada(15, fb - 11, 3, 7, HOJA);
  l.rect(9, fb - 10, 3, 2, PL(2));
  l.rect(10, fb - 14, 2, 5, PL(3));
  l.rect(19, fb - 12, 3, 2, PL(2));
  l.rect(20, fb - 15, 2, 4, PL(3));
  l.rect(11, fb - 9, 5, 2, PL(2));
  l.rect(15, fb - 11, 5, 2, PL(2));
  l.rect(15, fb - 16, 1, 9, PL(1));
  for (const [x, y] of [[14, fb - 15], [14, fb - 11], [17, fb - 13], [10, fb - 13], [21, fb - 14]] as const) l.px(x, y, CR(4));
  flor(l, 15, fb - 20, RS, TC(3));
  maceta(l, 15, fb, 8, 5);
  return apoyado(l);
}

function terrario(): Lienzo {
  const l = nuevo(8);
  const fb = pieA(8);
  // Caja de vidrio.
  l.rect(7, fb - 16, 18, 17, VI(3));
  l.rect(7, fb - 16, 18, 1, 'neutro-7');
  l.rect(7, fb - 16, 1, 17, 'neutro-7');
  l.rect(24, fb - 16, 1, 17, VI(2));
  // Contenido: tierra, musgo, piedras y plantas.
  l.rect(8, fb - 3, 16, 4, WO(2));
  l.rect(8, fb - 4, 16, 1, CE(2));
  l.elipseSombreada(12, fb - 5, 3, 2, HOJA_OSCURA);
  l.elipseSombreada(20, fb - 6, 3, 3, HOJA);
  l.rect(14, fb - 3, 4, 2, CM(2));
  l.rect(14, fb - 3, 4, 1, CM(3));
  l.hoja([16, fb - 4], [14, fb - 11], 4, HOJA);
  l.hoja([17, fb - 4], [19, fb - 12], 4, HOJA);
  l.hoja([16, fb - 4], [16, fb - 13], 3, HOJA_PASTEL);
  l.rect(7, fb + 1 - 1, 18, 1, WO(1));
  l.rect(7, fb, 18, 1, WO(2));
  l.rect(7, fb, 18, 1, WO(1));
  l.px(9, fb - 14, 'neutro-7');
  l.px(9, fb - 13, 'neutro-7');
  return apoyado(l);
}

// ---------------------------------------------------------------------------
// De piso, de una casilla
// ---------------------------------------------------------------------------

function hostaGrande(): Lienzo {
  const l = nuevo(16);
  const yb = pie(l);
  const top = yb - 10;
  abanico(l, 15, top + 1, 8, 17, 9, -88, 88, HOJA, 0.3);
  abanico(l, 15, top + 1, 5, 12, 7, -60, 60, tn('planta', 2, 4), 0.2);
  maceta(l, 15, yb, 14, 9);
  return suelo(l);
}

function monstera(): Lienzo {
  const l = nuevo(32);
  const yb = pie(l);
  const top = yb - 12;
  // Hojas grandes en forma de corazón con cortes profundos: [x, y, rx, ry, angulo].
  const hojas: ReadonlyArray<readonly [number, number, number, number, number]> = [
    [7, 40, 6, 5, -25], [24, 38, 6, 5, 25], [8, 25, 7, 6, -20], [23, 22, 7, 6, 20], [15, 11, 7, 7, 0],
  ];
  for (const [x, y] of hojas) {
    l.linea(15, top, x, y + 3, PL(1));
    l.linea(16, top, x + 1, y + 3, PL(1));
  }
  for (const [x, y, rx, ry, ang] of hojas) {
    l.elipseSombreada(x, y, rx, ry, HOJA, { angulo: ang });
    // Nervadura y cortes hacia los dos lados.
    l.linea(x, y - ry + 1, x, y + ry - 1, PL(1));
    for (const dy of [-3, 0, 3]) {
      for (let k = 0; k < 3; k++) {
        l.px(x - rx + k, y + dy, null);
        l.px(x + rx - k, y + dy + 1, null);
      }
    }
    l.px(x - 2, y - 2, null);
    l.px(x + 2, y + 2, null);
  }
  maceta(l, 15, yb, 16, 10);
  return suelo(l);
}

function macetaCeramica(): Lienzo {
  const l = nuevo(16);
  const yb = pie(l);
  const top = yb - 13;
  abanico(l, 15, top + 2, 8, 12, 5, -65, 65, HOJA_PASTEL, 0.15);
  abanico(l, 15, top + 2, 5, 9, 4, -35, 35, tn('hoja-pastel', 2, 4), 0.1);
  maceta(l, 15, yb, 18, 12, MCF, 4);
  return suelo(l, 15, yb, 8);
}
const MCF = (n: number): ColorEntrada => `maceta-terracota-${n}`;

function macetaBambu(): Lienzo {
  const l = nuevo(32);
  const yb = pie(l);
  canas(l, [9, 13, 17, 21], [14, 8, 11, 17], yb - 10);
  bloque(l, 6, yb - 10, 20, 11, (n) => CM(Math.min(3, n)));
  l.rect(7, yb - 10, 18, 1, WO(1));
  return suelo(l, 15, yb, 9);
}

/** Cañas de bambú (2 px) en las columnas `xs`, de `ytop` a `yb`, con nudos y hojas arriba. */
function canas(l: Lienzo, xs: readonly number[], tops: readonly number[], yb: number): void {
  xs.forEach((x, i) => {
    const t = tops[i] as number;
    l.rect(x, t, 2, yb - t, PL(3));
    l.rect(x, t, 1, yb - t, PL(4));
    for (let y = yb - 5; y > t + 2; y -= 6) l.rect(x, y, 2, 1, PL(1));
    l.hoja([x + 1, t + 3], [x + 8, t - 3], 3, HOJA);
    l.hoja([x, t + 5], [x - 7, t], 3, HOJA);
    l.hoja([x + 1, t + 1], [x + 1, t - 6], 3, tn('planta', 2, 4));
  });
}

function ficusLira(): Lienzo {
  const l = nuevo(32);
  const yb = pie(l);
  const top = yb - 12;
  l.rect(15, 10, 2, top - 10, WO(3));
  l.rect(16, 10, 1, top - 10, WO(1));
  // Hojas anchas arriba y angostas abajo (forma de violín).
  const hojas: ReadonlyArray<readonly [number, number, number]> = [
    [8, 42, -35], [23, 40, 35], [7, 30, -38], [24, 28, 38], [10, 18, -22], [21, 15, 22], [15, 8, 0],
  ];
  for (const [x, y] of hojas) l.linea(15, Math.min(top - 2, y + 6), x, y, WO(2));
  for (const [x, y, a] of hojas) {
    l.elipseSombreada(x, y, 4, 7, HOJA, { angulo: a });
    l.linea(x - Math.round(a / 20), y - 5, x + Math.round(a / 20), y + 5, PL(1));
  }
  maceta(l, 15, yb, 16, 10);
  return suelo(l);
}

function avePorFlor(): Lienzo {
  const l = nuevo(32);
  const yb = pie(l);
  const top = yb - 10;
  // Hojas grandes en paleta.
  abanico(l, 15, top, 7, 24, 9, -62, 62, HOJA, 0.3);
  // Tallos con las flores de ave: pico naranja y plumas azules.
  for (const [x, y] of [[10, 18], [20, 14]] as const) {
    l.linea(15, top, x, y + 3, PL(2));
    l.hoja([x, y + 2], [x - 4, y - 5], 3, tn('vidrio', 0, 2));
    l.hoja([x, y + 2], [x + 4, y - 4], 3, tn('naranja', 1, 3));
    l.hoja([x, y + 2], [x, y - 7], 3, tn('naranja', 2, 4));
    l.rect(x - 2, y + 1, 5, 2, PL(1));
  }
  maceta(l, 15, yb, 14, 9);
  return suelo(l);
}

function jardineraEnredadera(): Lienzo {
  const l = nuevo(32);
  const yb = pie(l);
  // Espaldera.
  for (const x of [8, 15, 22]) l.rect(x, 8, 1, yb - 8 - 9, WC(2));
  for (const y of [10, 18, 26, 34]) l.rect(8, y, 15, 1, WC(3));
  // Enredadera en zigzag con hojas y flores.
  const az = azar(7);
  let x = 9;
  for (let y = yb - 11; y > 9; y -= 2) {
    x = Math.max(9, Math.min(22, x + (az() < 0.5 ? -2 : 2)));
    l.px(x, y, PL(2));
    l.px(x + 1, y, PL(3));
    if (az() < 0.55) l.rect(x + (az() < 0.5 ? -2 : 2), y - 1, 2, 2, PL(3));
    if (y % 6 === 3) flor(l, x + 1, y - 1, RS, 'neutro-7');
  }
  // Cajón de madera.
  bloque(l, 5, yb - 9, 22, 10, (n) => WC(n + 0), true);
  l.rect(6, yb - 9, 20, 1, WO(1));
  l.rect(7, yb - 10, 18, 1, PL(2));
  l.px(9, yb - 11, PL(3));
  return suelo(l, 15, yb, 10);
}

function plantaEspaldera(): Lienzo {
  const l = nuevo(32);
  const yb = pie(l);
  const top = yb - 9;
  // Arco de la espaldera.
  l.linea(8, top, 10, 8, WC(2));
  l.linea(22, top, 20, 8, WC(2));
  l.linea(10, 8, 15, 3, WC(3));
  l.linea(20, 8, 15, 3, WC(3));
  for (const y of [14, 22, 30]) {
    const inset = Math.round((y - 8) * 0.1);
    l.rect(9 + inset, y, 13 - inset * 2, 1, WC(3));
  }
  // Hiedra.
  const az = azar(11);
  for (let y = top - 1; y > 4; y -= 2) {
    const dx = Math.round(Math.sin(y * 0.6) * 4);
    for (const lado of [-1, 1]) if (az() < 0.7) l.elipseSombreada(15 + dx + lado * 3, y, 2, 2, HOJA);
  }
  copa(l, 15, top - 4, [[-3, 0, 4], [3, 1, 4]], HOJA);
  maceta(l, 15, yb, 14, 8);
  return suelo(l);
}

function plantaSerpiente(): Lienzo {
  const l = nuevo(24);
  const yb = pie(l);
  const top = yb - 10;
  abanico(l, 15, top + 1, 7, 23, 5, -32, 32, HOJA_OSCURA, 0.35);
  // Bordes amarillos y vetas claras.
  for (const [dx, h] of [[-5, 14], [0, 20], [5, 15]] as const) l.rect(15 + dx, top - h, 1, h - 2, CE(3));
  maceta(l, 15, yb, 14, 9);
  return suelo(l);
}

function potosMaceta(): Lienzo {
  const l = nuevo(16);
  const yb = pie(l);
  const top = yb - 10;
  copa(l, 15, top - 3, [[-6, 1, 4], [6, 1, 4], [0, -2, 5], [-3, 2, 4], [4, 3, 4]], HOJA);
  // Enredaderas que caen por la maceta.
  for (const [x0, largo] of [[8, 11], [22, 9], [11, 7]] as const) {
    for (let i = 0; i < largo; i += 2) {
      l.px(x0 + (i % 4 === 0 ? 0 : 1), top + 2 + i, PL(2));
      l.rect(x0 - 1 + (i % 4 === 0 ? 0 : 2), top + 3 + i, 2, 2, PL(3));
    }
  }
  maceta(l, 15, yb, 14, 9);
  return suelo(l);
}

function jardineraLarga(): Lienzo {
  const l = nuevo(16, 2);
  const yb = pie(l);
  // Follaje primero, caja encima.
  const bolas: Array<readonly [number, number, number]> = [[8, 24, 5], [19, 20, 6], [31, 23, 6], [43, 19, 6], [54, 24, 5], [14, 27, 4], [38, 27, 5]];
  copa(l, 0, 0, bolas, HOJA);
  for (const x of [12, 26, 36, 48]) flor(l, x, 20 + (x % 3) * 2, RS, TC(3));
  bloque(l, 3, yb - 11, 58, 12, (n) => CM(Math.min(3, n)));
  l.rect(4, yb - 11, 56, 1, WO(1));
  l.rect(4, yb - 10, 56, 1, CM(3));
  return suelo(l, 32, yb, 26);
}

function helechoMaceta(): Lienzo {
  const l = nuevo(16);
  const yb = pie(l);
  const top = yb - 10;
  abanico(l, 15, top + 1, 7, 15, 5, -92, 92, HOJA_OSCURA, 0.3);
  abanico(l, 15, top + 1, 8, 13, 4, -78, 78, HOJA, 0.3);
  abanico(l, 15, top + 1, 4, 9, 4, -40, 40, tn('planta', 2, 4), 0.2);
  maceta(l, 15, yb, 14, 9);
  return suelo(l);
}

function girasolesMaceta(): Lienzo {
  const l = nuevo(32);
  const yb = pie(l);
  const top = yb - 9;
  const flores: ReadonlyArray<readonly [number, number]> = [[8, 24], [22, 20], [15, 10]];
  for (const [x, y] of flores) {
    l.linea(15, top, x, y + 5, PL(2));
    l.linea(16, top, x + 1, y + 5, PL(1));
  }
  l.hoja([15, top - 4], [6, top - 8], 5, HOJA);
  l.hoja([16, top - 6], [25, top - 11], 5, HOJA);
  l.hoja([15, top - 12], [8, top - 15], 4, HOJA);
  for (const [x, y] of flores) {
    l.elipseSombreada(x, y, 6, 6, tn('tela-calida', 1, 3));
    for (const [dx, dy] of [[0, -7], [-6, -3], [6, -3], [-6, 3], [6, 3], [0, 7]] as const) l.px(x + dx, y + dy, TC(2));
    l.elipseSombreada(x, y, 3, 3, tn('madera-oscura', 0, 2));
    l.px(x - 1, y - 1, WO(3));
  }
  maceta(l, 15, yb, 14, 9);
  return suelo(l);
}

function calendulasMaceta(): Lienzo {
  const l = nuevo(16);
  const yb = pie(l);
  const top = yb - 10;
  copa(l, 15, top - 2, [[-6, 1, 4], [6, 1, 4], [0, -2, 5]], HOJA);
  const az = azar(5);
  for (const [dx, dy] of [[-8, 0], [-3, -5], [3, -4], [8, 1], [0, 1], [-5, 4], [5, 4]] as const) florGrande(l, 15 + dx, top - 3 + dy, NA, TC(3));
  void az;
  maceta(l, 15, yb, 14, 9);
  return suelo(l);
}

function crisantemos(): Lienzo {
  const l = nuevo(8);
  const yb = pie(l);
  const top = yb - 8;
  abanico(l, 15, top, 7, 9, 4, -85, 85, HOJA_OSCURA, 0.1);
  // Racimo de flores pequeñas, cada una con su centro.
  for (const [dx, dy] of [[-8, -4], [-3, -9], [3, -8], [8, -4], [0, -4], [-5, 0], [5, 0], [-2, -13], [2, -1]] as const) flor(l, 15 + dx, top + dy, RS, TC(3));
  maceta(l, 15, yb, 12, 7);
  return suelo(l);
}

function regaderaMaceta(): Lienzo {
  const l = nuevo(8);
  const yb = pie(l);
  // Plantas dentro de la regadera.
  abanico(l, 15, yb - 9, 6, 10, 4, -60, 60, HOJA, 0.15);
  flor(l, 10, yb - 16, RS, TC(3));
  flor(l, 20, yb - 17, RS, TC(3));
  // Cuerpo, pico y asa de metal.
  l.rect(7, yb - 10, 16, 11, ME(2));
  l.rect(7, yb - 10, 16, 1, ME(3));
  l.rect(7, yb - 10, 1, 11, ME(3));
  l.rect(22, yb - 10, 1, 11, ME(1));
  l.rect(7, yb, 16, 1, ME(1));
  l.rect(8, yb - 9, 14, 1, WO(1));
  l.linea(23, yb - 3, 28, yb - 12, ME(2));
  l.linea(23, yb - 5, 28, yb - 13, ME(1));
  l.rect(27, yb - 14, 3, 2, ME(3));
  arco(l, 7, yb - 8, 7, yb - 2, 5, ME(3));
  return suelo(l, 15, yb, 8);
}

function arco(l: Lienzo, x0: number, y0: number, x1: number, y1: number, ancho: number, color: ColorEntrada): void {
  l.linea(x0, y0, x0 - ancho, y0 + 1, color);
  l.linea(x0 - ancho, y0 + 1, x0 - ancho, y1 - 1, color);
  l.linea(x0 - ancho, y1 - 1, x1, y1, color);
}

function plantaEnFlor(): Lienzo {
  const l = nuevo(16);
  const yb = pie(l);
  const top = yb - 10;
  copa(l, 15, top - 4, [[-6, 2, 5], [6, 2, 5], [0, -2, 6], [-3, 3, 4], [4, 4, 4]], HOJA);
  for (const [dx, dy] of [[-7, 0], [-2, -6], [4, -5], [8, 1], [0, 0], [-4, 4], [6, 5]] as const) florGrande(l, 15 + dx, top - 5 + dy, RS, TC(3));
  maceta(l, 15, yb, 14, 9);
  return suelo(l);
}

function hierbaPampa(): Lienzo {
  const l = nuevo(32);
  const yb = pie(l);
  const top = yb - 9;
  // Plumas largas, crema y blancas.
  abanico(l, 15, top, 9, 28, 6, -42, 42, [CR(1), CR(3), CR(4), NE(7)], 0.3);
  abanico(l, 15, top, 5, 20, 5, -24, 24, [CR(2), CR(4), NE(7), NE(7)], 0.2);
  // Tallos al pie.
  abanico(l, 15, top + 1, 5, 7, 2, -60, 60, tn('cesped', 0, 2), 0.1);
  maceta(l, 15, yb, 14, 9);
  return suelo(l);
}

function ramaDecorativa(): Lienzo {
  const l = nuevo(32);
  const yb = pie(l);
  // Ramas secas que salen del florero.
  const ramas: ReadonlyArray<readonly [number, number, number, number]> = [
    [15, yb - 16, 9, 6], [15, yb - 16, 22, 4], [15, yb - 16, 15, 2], [13, yb - 22, 6, 12], [17, yb - 24, 24, 14], [15, yb - 30, 11, 9],
  ];
  for (const [x0, y0, x1, y1] of ramas) l.linea(x0, y0, x1, y1, WO(3));
  l.linea(15, yb - 16, 15, yb - 22, WO(3));
  for (const [x, y] of [[9, 6], [22, 4], [15, 2], [6, 12], [24, 14], [11, 9]] as const) {
    l.px(x, y, RS(3));
    l.px(x + 1, y + 1, RS(4));
  }
  // Florero alto de cerámica blanca.
  l.elipseSombreada(15, yb - 8, 7, 10, tn('neutro', 4, 7));
  l.rect(12, yb - 19, 7, 3, NE(5));
  l.rect(12, yb - 19, 7, 1, NE(7));
  l.rect(11, yb - 3, 9, 3, NE(4));
  return suelo(l, 15, yb, 7);
}

function lirioPaz(): Lienzo {
  const l = nuevo(16);
  const yb = pie(l);
  const top = yb - 10;
  abanico(l, 15, top + 1, 7, 15, 6, -75, 75, HOJA_OSCURA, 0.25);
  for (const [x, y] of [[11, top - 10], [19, top - 14], [15, top - 8]] as const) {
    l.linea(15, top, x, y + 3, PL(2));
    l.hoja([x, y + 4], [x, y - 3], 5, tn('neutro', 4, 7));
    l.px(x, y, TC(3));
    l.px(x, y + 1, TC(2));
  }
  maceta(l, 15, yb, 14, 9);
  return suelo(l);
}

function filodendro(): Lienzo {
  const l = nuevo(24);
  const yb = pie(l);
  const top = yb - 10;
  const hojas: ReadonlyArray<readonly [number, number, number]> = [
    [7, top - 6, -30], [23, top - 8, 30], [9, top - 18, -15], [22, top - 20, 15], [15, top - 24, 0], [15, top - 12, 0],
  ];
  for (const [x, y] of hojas) l.linea(15, top, x, y + 3, PL(1));
  for (const [x, y, a] of hojas) {
    l.elipseSombreada(x, y, 5, 4, HOJA, { angulo: a });
    l.rect(x - 3, y, 7, 1, PL(1));
  }
  maceta(l, 15, yb, 14, 9);
  return suelo(l);
}

function ficus(): Lienzo {
  const l = nuevo(40);
  const yb = pie(l);
  const top = yb - 11;
  l.rect(14, 22, 3, top - 22, WO(3));
  l.rect(16, 22, 1, top - 22, WO(1));
  l.linea(15, 30, 9, 24, WO(3));
  l.linea(16, 30, 22, 24, WO(3));
  copa(l, 15, 17, [[-8, 4, 6], [8, 5, 6], [0, -5, 7], [-4, 3, 6], [5, 1, 6], [-9, -2, 4], [10, -1, 4]], HOJA);
  for (const [dx, dy] of [[-7, 2], [3, -8], [8, 4], [-2, 8]] as const) l.px(15 + dx, 17 + dy, PL(4));
  maceta(l, 15, yb, 16, 10);
  return suelo(l);
}

function palmaMaceta(): Lienzo {
  const l = nuevo(40);
  const yb = pie(l);
  const top = yb - 10;
  // Dos troncos.
  l.rect(14, 24, 3, top - 24, WO(3));
  l.rect(16, 24, 1, top - 24, WO(1));
  for (let y = 26; y < top; y += 4) l.rect(14, y, 3, 1, WO(2));
  // Hojas largas que caen a los lados.
  abanico(l, 15, 25, 5, 22, 5, -110, 110, HOJA_OSCURA, 0.25);
  abanico(l, 15, 25, 7, 20, 5, -85, 85, HOJA, 0.3);
  abanico(l, 15, 24, 3, 14, 4, -30, 30, tn('planta', 2, 4), 0.1);
  maceta(l, 15, yb, 16, 10);
  return suelo(l);
}

function pastoOrnamental(): Lienzo {
  const l = nuevo(16);
  const yb = pie(l);
  const top = yb - 9;
  abanico(l, 15, top + 1, 11, 16, 3, -74, 74, tn('cesped', 0, 3), 0.35);
  abanico(l, 15, top + 1, 6, 12, 3, -45, 45, tn('cesped', 1, 3).concat(['cesped-3' as ColorEntrada]).slice(0, 4), 0.2);
  maceta(l, 15, yb, 14, 8);
  return suelo(l);
}

// ---------------------------------------------------------------------------
// Grandes y largas
// ---------------------------------------------------------------------------

function plantaCarnivora(): Lienzo {
  const l = nuevo(32, 2, 2);
  const yb = pie(l);
  const top = yb - 15;
  // Tallos curvos hacia tres bocas.
  const bocas: ReadonlyArray<readonly [number, number, number]> = [[16, 40, 10], [48, 34, 11], [32, 14, 12]];
  for (const [x, y] of bocas) {
    l.linea(32, top, x, y + 7, PL(2));
    l.linea(33, top, x + 1, y + 7, PL(1));
  }
  l.hoja([32, top], [6, top - 6], 8, HOJA);
  l.hoja([32, top], [58, top - 4], 8, HOJA);
  for (const [x, y, r] of bocas) trampa(l, x, y, r);
  maceta(l, 32, yb, 26, 15, MCF, 5);
  return suelo(l, 32, yb, 13);
}

/** Boca de planta carnívora: mandíbula de abajo verde, boca roja y mandíbula de arriba con dientes. */
function trampa(l: Lienzo, cx: number, cy: number, r: number): void {
  l.elipseSombreada(cx, cy + 3, r, Math.round(r * 0.55), HOJA);
  l.elipseSombreada(cx, cy + 1, r - 2, Math.round(r * 0.35), tn('rojo-suave', 0, 3));
  l.elipseSombreada(cx, cy - 4, r, Math.round(r * 0.6), HOJA);
  l.elipseSombreada(cx, cy - 1, r - 2, Math.round(r * 0.3), tn('rojo-suave', 0, 3));
  for (let x = cx - r + 2; x < cx + r - 1; x += 2) {
    l.px(x, cy - 2, NE(7));
    l.px(x + 1, cy + 3, NE(7));
  }
}

function cajonSiembra(): Lienzo {
  const l = nuevo(8, 2);
  const yb = pie(l);
  // Plántulas.
  for (const x of [10, 20, 30, 40, 50]) {
    const alto = 4 + (x % 3) * 2;
    l.linea(x, yb - 12, x, yb - 12 - alto, PL(2));
    l.hoja([x, yb - 11 - alto + 2], [x - 5, yb - 14 - alto], 3, HOJA);
    l.hoja([x, yb - 11 - alto + 2], [x + 5, yb - 14 - alto], 3, HOJA);
  }
  // Cajón de tablas.
  l.rect(3, yb - 12, 58, 13, WC(2));
  l.rect(3, yb - 12, 58, 2, WO(1));
  l.rect(3, yb - 10, 58, 1, WC(4));
  l.rect(3, yb - 6, 58, 1, WC(1));
  l.rect(3, yb - 12, 1, 13, WC(3));
  l.rect(60, yb - 12, 1, 13, WC(1));
  l.rect(3, yb, 58, 1, WC(0));
  for (const x of [8, 31, 54]) l.px(x, yb - 4, WC(0));
  return suelo(l, 32, yb, 26);
}

function barreraPlantas(): Lienzo {
  const l = nuevo(24, 2);
  const yb = pie(l);
  // Seto denso: bloque con bultos arriba.
  l.rectRedondeado(4, 10, 56, yb - 10 - 9, 5, PL(2));
  const bolas: Array<readonly [number, number, number]> = [];
  for (let x = 8; x < 60; x += 10) bolas.push([x, 14 + (x % 20 === 8 ? 0 : 3), 6]);
  for (let x = 12; x < 60; x += 14) bolas.push([x, 26, 6]);
  for (let x = 6; x < 60; x += 12) bolas.push([x, 36, 6]);
  copa(l, 0, 0, bolas, HOJA);
  bloque(l, 6, yb - 9, 52, 10, (n) => CM(Math.min(3, n)));
  l.rect(7, yb - 9, 50, 1, WO(1));
  return suelo(l, 32, yb, 24);
}

function muroBambu(): Lienzo {
  const l = nuevo(32, 2);
  const yb = pie(l);
  const xs: number[] = [];
  const tops: number[] = [];
  for (let x = 6; x < 56; x += 5) {
    xs.push(x);
    tops.push(8 + ((x * 7) % 14));
  }
  canas(l, xs, tops, yb - 10);
  bloque(l, 3, yb - 10, 58, 11, (n) => CM(Math.min(3, n)));
  l.rect(4, yb - 10, 56, 1, WO(1));
  return suelo(l, 32, yb, 26);
}

// ---------------------------------------------------------------------------

const _sin = sueloLibre;
void _sin;
void rampa;
void AZ;
void CU;

type Hacer = () => Lienzo;
const TABLA: ReadonlyArray<readonly [string, Hacer, readonly string[] | undefined]> = [
  ['hosta-chica', hostaChica, undefined],
  ['hosta-grande', hostaGrande, POT],
  ['monstera', monstera, POT],
  ['maceta-ceramica', macetaCeramica, POT],
  ['maceta-bambu', macetaBambu, undefined],
  ['ficus-lira', ficusLira, POT],
  ['ave-paraiso-en-flor', avePorFlor, undefined],
  ['jardinera-enredadera', jardineraEnredadera, ROSA],
  ['planta-espaldera', plantaEspaldera, undefined],
  ['brote', brote, undefined],
  ['aloe-vera', aloeVera, undefined],
  ['planta-serpiente', plantaSerpiente, POT],
  ['potos-maceta', potosMaceta, POT],
  ['jardinera-larga', jardineraLarga, undefined],
  ['helecho-maceta', helechoMaceta, POT],
  ['girasoles-maceta', girasolesMaceta, undefined],
  ['calendulas-maceta', calendulasMaceta, undefined],
  ['crisantemos', crisantemos, ROSA],
  ['regadera-maceta', regaderaMaceta, hex('metal')],
  ['planta-en-flor', plantaEnFlor, ROSA],
  ['hierba-pampa', hierbaPampa, undefined],
  ['rama-decorativa', ramaDecorativa, undefined],
  ['bambu-suerte', bambuSuerte, undefined],
  ['lirio-paz', lirioPaz, POT],
  ['filodendro', filodendro, POT],
  ['ficus', ficus, POT],
  ['palma-maceta', palmaMaceta, POT],
  ['pasto-ornamental', pastoOrnamental, POT],
  ['bonsai', bonsai, undefined],
  ['cactus-diminuto', cactusDiminuto, undefined],
  ['planta-carnivora', plantaCarnivora, undefined],
  ['cajon-siembra', cajonSiembra, undefined],
  ['barrera-plantas', barreraPlantas, undefined],
  ['terrario', terrario, undefined],
  ['muro-bambu', muroBambu, undefined],
];

export function cuadrosPlantas10(): Cuadros {
  const c: Cuadros = new Map();
  for (const [id, hacer, desde] of TABLA) registrarR(c, id, 'U', hacer(), desde);
  return c;
}
