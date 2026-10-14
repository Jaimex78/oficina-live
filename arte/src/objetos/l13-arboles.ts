/**
 * Lote 13, árboles (8 objetos): arce, sauce llorón, cerezo en flor, palmera de coco, árbol de invierno, pino pequeño, pino
 * pequeño nevado y pino grande nevado. Los grandes miden 64 x 128 y se anclan en la huella de 2 x 2 (solo bloquea el tronco);
 * los pequeños, 32 x 96. Luz arriba a la izquierda, contorno azul marino y sombra de suelo suave a la derecha.
 *
 * Variantes: el arce se recolorea desde la rampa `planta` (otoño naranja y rojo); el cerezo, desde `rojo-suave` (blanco).
 */

import { Lienzo } from '../nucleo';
import type { ColorEntrada } from '../nucleo';
import { BA, CE, HP, NE, PL, RS, CR, WO, WC, ent, hex, mata, pasto, pisoPino, registrarR, sombraSuelo, terminar, tronco } from './l13-comun';
import type { Cuadros } from './l13-comun';
import { azar } from './l2b-comun';

const VERDES: ColorEntrada[] = [PL(1), PL(2), PL(3), PL(4)];
const ROSAS: ColorEntrada[] = [RS(2), RS(3), RS(4), CR(4)];

const grande = (): Lienzo => new Lienzo(64, 128);

/** Cierra un árbol: contorno azul marino y mancha de suelo a la derecha del tronco. */
function cerrar(l: Lienzo, cx = 36, cy = 121, rx = 19): Lienzo {
  terminar(l, { sombra: false });
  return sombraSuelo(l, cx, cy, rx, 3, 3);
}

/** Raíces y pasto al pie de un tronco. */
function pie(l: Lienzo, x: number): void {
  l.rect(x - 4, 118, 4, 4, WO(2));
  l.rect(x + 8, 118, 4, 4, WO(1));
  l.px(x - 4, 118, null);
  pasto(l, [[x - 10, 121], [x - 8, 122], [x + 11, 122], [x + 14, 121], [x + 17, 122]]);
}

// ---------------------------------------------------------------------------
// Arce
// ---------------------------------------------------------------------------

function arce(): Lienzo {
  const l = grande();
  tronco(l, 28, 72, 121, 9, WO, 5);
  l.linea(30, 80, 20, 62, WO(2));
  l.linea(31, 80, 21, 62, WO(3));
  l.linea(36, 78, 46, 60, WO(2));
  l.linea(37, 78, 47, 60, WO(1));
  pie(l, 32);
  const m = (cx: number, cy: number, rx: number, ry: number, s: number): void => mata(l, cx, cy, rx, ry, VERDES, PL(0), s);
  m(20, 26, 13, 12, 31);
  m(44, 26, 13, 12, 32);
  m(32, 16, 13, 11, 33);
  m(12, 42, 12, 11, 34);
  m(52, 42, 12, 11, 35);
  m(32, 36, 18, 14, 36);
  m(21, 55, 15, 10, 37);
  m(43, 55, 15, 10, 38);
  m(32, 59, 18, 8, 39);
  m(7, 55, 6, 5, 40);
  m(57, 55, 6, 5, 41);
  return cerrar(l);
}

// ---------------------------------------------------------------------------
// Sauce llorón
// ---------------------------------------------------------------------------

function sauce(): Lienzo {
  const l = grande();
  // Tronco inclinado que se bifurca; asoma bajo la cortina de ramas.
  tronco(l, 28, 90, 121, 9, WO, 7);
  l.linea(30, 92, 24, 70, WO(2));
  l.linea(31, 92, 25, 70, WO(3));
  l.linea(36, 90, 42, 68, WO(2));
  l.linea(37, 90, 43, 68, WO(1));
  pie(l, 32);
  const m = (cx: number, cy: number, rx: number, ry: number, s: number): void => mata(l, cx, cy, rx, ry, [CE(1), CE(2), CE(3), HP(4)], CE(0), s);
  // Cúpula de arriba.
  m(32, 14, 13, 9, 51);
  m(17, 24, 13, 10, 52);
  m(47, 24, 13, 10, 53);
  m(32, 26, 20, 12, 54);
  // Cortina: columnas de 2 px que cuelgan, más cortas al centro para dejar ver el tronco.
  const r = azar(55);
  const claro: ColorEntrada[] = [CE(3), HP(2), CE(2)];
  const medio: ColorEntrada[] = [CE(2), CE(3), CE(2)];
  const oscuro: ColorEntrada[] = [CE(1), CE(2), CE(1)];
  for (let x = 6; x <= 58; x += 2) {
    const centro = Math.abs(x - 32);
    const hueco = Math.max(0, 20 - centro * 1.25);
    const fin = Math.round(106 - hueco) - ent(r, 0, 12);
    const ini = 28 + Math.round(Math.max(0, centro - 18) * 0.6);
    const tonos = x < 24 ? claro : x < 40 ? medio : oscuro;
    for (let y = ini; y <= fin; y++) {
      if (y > 56 && x % 10 === 0) continue;
      const ancho = y > fin - 7 ? 1 : 2;
      let c = tonos[Math.floor(x / 2) % 3] as ColorEntrada;
      if (y > fin - 3) c = x < 40 ? HP(3) : CE(3);
      if (x < 38 && (x + Math.floor(y / 9) * 3) % 6 === 0 && y % 9 < 3) c = HP(3);
      l.rect(x, y, ancho, 1, c);
    }
  }
  return cerrar(l);
}

// ---------------------------------------------------------------------------
// Cerezo en flor
// ---------------------------------------------------------------------------

function cerezo(): Lienzo {
  const l = grande();
  // Tronco retorcido con ramas que se ven entre las flores.
  tronco(l, 28, 80, 121, 8, WO, 9);
  l.linea(30, 84, 16, 62, WO(2));
  l.linea(31, 84, 17, 62, WO(3));
  l.linea(35, 82, 50, 60, WO(2));
  l.linea(36, 82, 51, 60, WO(1));
  l.linea(33, 82, 33, 58, WO(2));
  pie(l, 32);
  const m = (cx: number, cy: number, rx: number, ry: number, s: number): void => mata(l, cx, cy, rx, ry, ROSAS, RS(0), s);
  m(18, 28, 11, 10, 61);
  m(46, 26, 12, 10, 62);
  m(32, 18, 11, 9, 63);
  m(10, 44, 9, 8, 64);
  m(54, 44, 9, 8, 65);
  m(32, 36, 15, 11, 66);
  m(20, 50, 11, 8, 67);
  m(44, 50, 11, 8, 68);
  m(32, 56, 14, 7, 69);
  // Pétalos caídos en el suelo.
  for (const [x, y] of [[20, 120], [24, 123], [43, 122], [47, 120], [51, 123], [14, 122]] as const) l.px(x, y, RS(4));
  return cerrar(l);
}

// ---------------------------------------------------------------------------
// Palmera de coco
// ---------------------------------------------------------------------------

/** Una fronda: sube hasta `(mx, my)` y cae hasta `(tx, ty)`. */
function fronda(l: Lienzo, bx: number, by: number, mx: number, my: number, tx: number, ty: number, ancho: number): void {
  l.hoja([bx, by], [mx, my], ancho, VERDES, { nervadura: true });
  l.hoja([mx, my], [tx, ty], Math.max(3, ancho - 2), VERDES, { nervadura: true });
}

function palmeraCoco(): Lienzo {
  const l = grande();
  // Tronco curvo con anillos.
  const puntos: [number, number][] = [];
  for (let y = 121; y >= 38; y--) {
    const t = (121 - y) / 83;
    puntos.push([Math.round(28 + Math.sin(t * Math.PI * 0.8) * 7 + t * 4), y]);
  }
  for (const [x, y] of puntos) {
    const w = y > 100 ? 7 : 6 - Math.floor((121 - y) / 40);
    l.rect(x, y, Math.max(4, w), 1, WC(1));
    l.px(x, y, WC(2));
    l.px(x + 1, y, WC(3));
    l.px(x + Math.max(4, w) - 1, y, WC(0));
    if (y % 5 === 0) l.rect(x, y, Math.max(4, w), 1, WC(0));
  }
  l.rect(24, 118, 4, 4, WC(1));
  l.rect(37, 118, 4, 4, WC(0));
  pasto(l, [[20, 121], [22, 122], [42, 122], [44, 121], [47, 122]]);
  const [hx, hy] = puntos[puntos.length - 1] as [number, number];
  const cx = hx + 3;
  const cy = hy;
  // Frondas de atrás hacia adelante.
  fronda(l, cx, cy, cx - 14, cy - 16, cx - 32, cy + 2, 11);
  fronda(l, cx, cy, cx + 14, cy - 16, cx + 29, cy + 3, 11);
  fronda(l, cx, cy, cx - 24, cy - 3, cx - 28, cy + 20, 10);
  fronda(l, cx, cy, cx + 24, cy - 3, cx + 26, cy + 20, 10);
  fronda(l, cx, cy, cx - 8, cy - 22, cx - 20, cy - 14, 10);
  fronda(l, cx, cy, cx + 8, cy - 22, cx + 20, cy - 14, 10);
  fronda(l, cx, cy, cx, cy - 24, cx + 2, cy - 8, 8);
  // Cocos.
  for (const [dx, dy] of [[-4, 5], [1, 7], [5, 4]] as const) l.elipseSombreada(cx + dx, cy + dy, 3, 3, [WO(1), WO(2), WO(3), WO(4)]);
  return cerrar(l, 38, 121, 18);
}

// ---------------------------------------------------------------------------
// Árbol de invierno
// ---------------------------------------------------------------------------

function ramas(l: Lienzo, x: number, y: number, ang: number, largo: number, grosor: number, prof: number, r: () => number): void {
  const rad = (ang * Math.PI) / 180;
  const x1 = x + Math.sin(rad) * largo;
  const y1 = y - Math.cos(rad) * largo;
  for (let k = 0; k < grosor; k++) {
    l.linea(Math.round(x) + k, Math.round(y), Math.round(x1) + k, Math.round(y1), k === 0 ? WO(3) : WO(1));
  }
  // Nieve sobre la rama: un trazo claro por encima.
  if (prof < 3) {
    const mx = Math.round((x + x1) / 2);
    const my = Math.round((y + y1) / 2);
    l.rect(mx - 1, my - 2, 3, 1, 'neutro-7');
  }
  if (prof === 0) return;
  const n = prof >= 3 ? 2 : r() > 0.4 ? 2 : 1;
  for (let i = 0; i < n; i++) {
    const giro = (i === 0 ? -1 : 1) * ent(r, 22, 42);
    ramas(l, x1, y1, ang + giro, largo * (0.68 + r() * 0.12), Math.max(1, grosor - 1), prof - 1, r);
  }
}

function arbolInvierno(): Lienzo {
  const l = grande();
  const r = azar(77);
  tronco(l, 28, 80, 121, 8, WO, 11);
  ramas(l, 32, 84, -8, 26, 3, 4, r);
  ramas(l, 33, 86, 22, 22, 2, 3, r);
  ramas(l, 31, 88, -34, 20, 2, 3, r);
  pie(l, 32);
  // Montículo de nieve al pie y copos de nieve sobre el tronco.
  l.elipseSombreada(34, 120, 20, 4, [BA(2), BA(3), 'neutro-7']);
  l.rect(28, 78, 8, 2, 'neutro-7');
  return cerrar(l, 38, 122, 21);
}

// ---------------------------------------------------------------------------
// Pinos
// ---------------------------------------------------------------------------

/** Pino pequeño: 32 x 96, tres pisos. */
function pinoChico(nieve: boolean): Lienzo {
  const l = new Lienzo(32, 96);
  const cx = 15.5;
  tronco(l, 13, 74, 91, 5, WO, 21);
  l.rect(11, 89, 2, 3, WO(2));
  l.rect(18, 89, 2, 3, WO(1));
  pasto(l, [[6, 91], [8, 92], [24, 92], [26, 91]]);
  pisoPino(l, cx, 36, 76, 14, 22, nieve);
  pisoPino(l, cx, 18, 52, 11, 23, nieve);
  pisoPino(l, cx, 3, 30, 8, 24, nieve);
  if (nieve) l.rect(7, 91, 18, 1, 'neutro-6');
  terminar(l, { sombra: false });
  return sombraSuelo(l, 19, 92, 10, 2, 2);
}

/** Pino grande: 64 x 128, cuatro pisos, con o sin nieve. */
function pinoGrande(nieve: boolean): Lienzo {
  const l = grande();
  const cx = 31.5;
  tronco(l, 28, 84, 122, 8, WO, 31);
  l.rect(26, 119, 3, 3, WO(2));
  l.rect(35, 119, 3, 3, WO(1));
  pasto(l, [[22, 120], [24, 121], [39, 121], [41, 120], [44, 121]]);
  pisoPino(l, cx, 52, 90, 29, 32, nieve);
  pisoPino(l, cx, 34, 68, 24, 33, nieve);
  pisoPino(l, cx, 18, 48, 18, 34, nieve);
  pisoPino(l, cx, 3, 28, 12, 35, nieve);
  if (nieve) l.elipseSombreada(33, 121, 17, 3, [BA(2), BA(3), 'neutro-7']);
  return cerrar(l, 37, 121, 19);
}

void NE;
void hex;

export function cuadrosArboles13(): Cuadros {
  const c: Cuadros = new Map();
  registrarR(c, 'arce', 'U', arce(), hex('planta'));
  registrarR(c, 'sauce-lloron', 'U', sauce());
  registrarR(c, 'cerezo', 'U', cerezo(), hex('rojo-suave'));
  registrarR(c, 'palmera-coco', 'U', palmeraCoco());
  registrarR(c, 'arbol-invierno', 'U', arbolInvierno());
  registrarR(c, 'pino-chico', 'U', pinoChico(false));
  registrarR(c, 'pino-chico-nevado', 'U', pinoChico(true));
  registrarR(c, 'pino-nevado', 'U', pinoGrande(true));
  return c;
}
