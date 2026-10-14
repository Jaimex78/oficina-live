/**
 * Dibujo de la fachada de Naos Empresarial (Ak 9 con calle 102, Bogotá).
 *
 * Vista de calle desde la esquina: el tambor redondo de concreto a la derecha
 * y la fachada larga de vidrio con celosías alejándose a la izquierda. El
 * suelo (acera y calle) es plano para que un personaje de 32 x 48 camine en
 * línea recta; el edificio sí lleva perspectiva (las franjas de piso
 * convergen hacia un punto de fuga a la izquierda, a la altura del suelo).
 *
 * Todo se dibuja por código con la paleta propia de `paleta-naos.ts`. El mismo
 * dibujo produce el día y la noche.
 */

import { Lienzo } from '../nucleo';
import type { PaletaNaos, TokenNaos } from './paleta-naos';
import { paletaNaos } from './paleta-naos';
import { hojaPuerta, interiorLobby } from './puerta-naos';

// ---------------------------------------------------------------------------
// Medidas de la escena
// ---------------------------------------------------------------------------

export const ANCHO_ESCENA = 640;
export const ALTO_ESCENA = 360;

/** Fila donde el edificio toca el suelo (línea de pared de la acera). */
export const SUELO = 252;
/** Fila donde apoyan los pies del personaje. */
export const PIES_Y = 298;
/** Borde de la acera (arriba del bordillo). */
export const BORDILLO_Y = 320;

/** La puerta de vidrio: hueco de 40 x 58 con los pies a nivel de acera. */
export const PUERTA = { x: 372, y: 194, ancho: 40, alto: 58 } as const;

/** Donde termina la fachada larga y empieza el tambor. */
export const XN = 470;
/** Punto de fuga (a la izquierda, a la altura del suelo). */
const VPX = -500;

const NIVEL_BASE = 66;
const ALTO_PISO = 25;
const ALTO_LOSA = 3;
const NIVEL_TOPE_PISOS = NIVEL_BASE + ALTO_PISO * 6;
const NIVEL_CORONA = NIVEL_TOPE_PISOS + 14;

/** Tambor: columnas y centro. */
export const TX0 = 469;
export const TX1 = 591;
const TCX = 530;
const TMEDIO = 62;

/** Nivel (en píxeles a escala 1) del borde inferior del piso `k` (1 a 6). */
export function nivelPiso(k: number): number {
  return NIVEL_BASE + ALTO_PISO * (k - 1);
}

/** Escala de perspectiva de la fachada larga en la columna `x`. */
export function escalaFachada(x: number): number {
  return (x - VPX) / (XN - VPX);
}

/** Fila de pantalla de un nivel sobre el suelo, en la columna `x` de la fachada larga. */
export function filaFachada(nivel: number, x: number): number {
  return Math.round(SUELO - escalaFachada(x) * nivel);
}

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

/** Número pseudoaleatorio estable entre 0 y 1 a partir de tres enteros. */
function azar(a: number, b: number, c = 0): number {
  let h = Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263) + Math.imul(c | 0, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

function elegir<T>(lista: readonly T[], i: number): T {
  return lista[Math.max(0, Math.min(lista.length - 1, i))] as T;
}

interface Cx {
  l: Lienzo;
  k: PaletaNaos;
  noche: boolean;
}

export interface OpcionesEscena {
  noche: boolean;
  /** Sin calle, árboles, poste ni conos: solo el edificio sobre su cielo (panel de ingreso). */
  soloEdificio?: boolean;
}

/** ¿Cuánta luz cae en este punto del suelo? 0 nada, 1 a 3 de más tenue a plena (solo de noche). */
function luzSuelo(x: number, y: number): number {
  const focos: ReadonlyArray<readonly [number, number, number, number]> = [
    [392, 290, 70, 30],
    [300, 298, 52, 18],
  ];
  let mejor = 0;
  for (const [cx, cy, rx, ry] of focos) {
    const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
    if (d < 0.3) mejor = Math.max(mejor, 3);
    else if (d < 0.6) mejor = Math.max(mejor, 2);
    else if (d < 1) mejor = Math.max(mejor, 1);
  }
  return mejor;
}

/** ¿Este píxel toma el color iluminado? Los bordes del charco de luz se tramean. */
function iluminado(luz: number, x: number, y: number): boolean {
  if (luz >= 3) return true;
  if (luz === 2) return ((x + y) & 1) === 0;
  if (luz === 1) return (x & 1) === 0 && (y & 1) === 0;
  return false;
}

// ---------------------------------------------------------------------------
// Cielo, nubes, estrellas, torres y apartamentos
// ---------------------------------------------------------------------------

function cielo(c: Cx, altoTotal: number): void {
  const { l, k } = c;
  const bandas: TokenNaos[] = ['cielo0', 'cielo1', 'cielo2', 'cielo3', 'cielo4', 'cielo5'];
  l.degradadoV(0, 0, ANCHO_ESCENA, SUELO, bandas.map((t) => k(t)), { dither: true });
  if (altoTotal > SUELO) l.rect(0, SUELO, ANCHO_ESCENA, altoTotal - SUELO, k('cielo5'));
}

function nube(c: Cx, cx: number, cy: number, w: number, h: number): void {
  const { l, k } = c;
  const partes: ReadonlyArray<readonly [number, number, number, number]> = [
    [0, 0, 0.5, 0.45],
    [-0.28, 0.14, 0.3, 0.34],
    [0.3, 0.12, 0.32, 0.36],
    [-0.06, -0.22, 0.26, 0.36],
    [0.16, -0.12, 0.2, 0.3],
  ];
  const dibujar = (color: string, dy: number, encoge: number): void => {
    for (const [ox, oy, rx, ry] of partes) {
      l.elipse(cx + ox * w, cy + oy * h + dy, Math.max(1, rx * w - encoge), Math.max(1, ry * h - encoge), color);
    }
  };
  dibujar(k('nube0'), 3, 0);
  dibujar(k('nube1'), 1, 0);
  dibujar(k('nube2'), -1, 2);
  // Brillo arriba a la izquierda.
  l.elipse(cx - 0.12 * w, cy - 0.2 * h - 2, 0.2 * w, 0.14 * h, k('nube3'));
  l.elipse(cx + 0.2 * w, cy - 0.06 * h - 2, 0.12 * w, 0.1 * h, k('nube3'));
}

function nubes(c: Cx): void {
  // Un banco grande y gris arriba, otros más pequeños a distintas alturas.
  nube(c, 250, 44, 150, 34);
  nube(c, 150, 20, 90, 22);
  nube(c, 395, 30, 110, 26);
  nube(c, 600, 70, 96, 24);
  nube(c, 58, 112, 70, 18);
  nube(c, 540, 154, 72, 16);
  nube(c, 470, 8, 120, 20);
  nube(c, 20, 70, 80, 20);
}

function estrellas(c: Cx): void {
  const { l, k } = c;
  for (let i = 0; i < 120; i++) {
    const x = Math.floor(azar(i, 1, 99) * ANCHO_ESCENA);
    const y = Math.floor(azar(i, 2, 99) * 190);
    // Menos estrellas cerca del horizonte.
    if (azar(i, 3, 99) * 190 < y * 0.9) continue;
    const brillante = azar(i, 4, 99) > 0.88;
    if (brillante) {
      l.px(x, y, k('estrella1'));
      l.px(x - 1, y, k('estrella0'));
      l.px(x + 1, y, k('estrella0'));
      l.px(x, y - 1, k('estrella0'));
      l.px(x, y + 1, k('estrella0'));
    } else {
      l.px(x, y, azar(i, 5, 99) > 0.5 ? k('estrella1') : k('estrella0'));
    }
  }
}

/** Torre lejana de vidrio azulado. */
function torre(c: Cx, x0: number, x1: number, top: number, semilla: number): void {
  const { l, k, noche } = c;
  l.rect(x0, top, x1 - x0, SUELO - top, k('torre1'));
  // Ventanas en cuadrícula de 6 x 4.
  for (let y = top + 3; y < SUELO; y += 4) {
    for (let x = x0 + 1; x < x1 - 1; x += 6) {
      const r = azar(x, y, semilla);
      let tono: TokenNaos = r < 0.5 ? 'torre1' : r < 0.82 ? 'torre2' : 'torreV';
      if (noche && r > 0.9) tono = 'torreLuz';
      else if (noche && r > 0.86) tono = 'torreFria';
      l.rect(x, y, 5, 3, k(tono));
    }
  }
  // Remate, borde iluminado a la izquierda y sombra a la derecha.
  l.rect(x0, top, x1 - x0, 2, k('torre3'));
  l.rect(x0, top + 2, x1 - x0, 1, k('torre0'));
  l.rect(x0, top, 1, SUELO - top, k('torre3'));
  l.rect(x1 - 2, top + 2, 2, SUELO - top, k('torre0'));
}

function torresLejanas(c: Cx): void {
  torre(c, 6, 50, 38, 3);
  torre(c, 54, 98, 66, 5);
  torre(c, 96, 134, 84, 8);
  // Antena de la primera.
  c.l.rect(27, 28, 1, 10, c.k('torre0'));
}

function apartamentos(c: Cx): void {
  const { l, k, noche } = c;
  const x0 = 578;
  const top = 128;
  l.rect(x0, top, ANCHO_ESCENA - x0, SUELO - top, k('lad2'));
  // Hiladas de ladrillo.
  for (let y = top + 2; y < SUELO; y += 3) l.rect(x0, y, ANCHO_ESCENA - x0, 1, k('lad1'));
  l.rect(x0, top, ANCHO_ESCENA - x0, 3, k('lad3'));
  l.rect(x0, top + 3, ANCHO_ESCENA - x0, 1, k('lad0'));
  l.rect(x0, top, 2, SUELO - top, k('lad3'));
  // Ventanas con balcón.
  for (let piso = 0; piso < 9; piso++) {
    const y0 = top + 8 + piso * 13;
    for (let x = x0 + 6; x < ANCHO_ESCENA; x += 13) {
      const luz = noche && azar(x, piso, 7) > 0.62;
      l.rect(x, y0, 7, 8, k('lad3'));
      l.rect(x + 1, y0 + 1, 5, 6, luz ? k('ladLuz') : k('ladVent'));
      l.rect(x - 1, y0 + 9, 9, 1, k('lad0'));
    }
  }
}

// ---------------------------------------------------------------------------
// Acera, bordillo y calle
// ---------------------------------------------------------------------------

function acera(c: Cx): void {
  const { l, k, noche } = c;
  const H_ADOQUIN = 6;
  const W_ADOQUIN = 12;
  for (let y = SUELO; y < BORDILLO_Y; y++) {
    const fila = Math.floor((y - SUELO) / H_ADOQUIN);
    const desfase = (fila % 2) * (W_ADOQUIN / 2);
    for (let x = 0; x < ANCHO_ESCENA; x++) {
      const col = Math.floor((x + desfase) / W_ADOQUIN);
      const luz = noche ? luzSuelo(x, y) : 0;
      const encendido = iluminado(luz, x, y);
      const junta = (y - SUELO) % H_ADOQUIN === H_ADOQUIN - 1 || (x + desfase) % W_ADOQUIN === W_ADOQUIN - 1;
      let token: TokenNaos;
      if (junta) {
        token = encendido ? 'adJl' : 'adJ';
      } else {
        const rosa = (col + fila * 2) % 7 === 0;
        const claro = azar(col, fila, 4) > 0.5;
        if (rosa) token = encendido ? (claro ? 'adP1l' : 'adP0l') : claro ? 'adP1' : 'adP0';
        else token = encendido ? (claro ? 'adG1l' : 'adG0l') : claro ? 'adG1' : 'adG0';
      }
      l.px(x, y, k(token));
    }
  }
  // Sombra de contacto del edificio sobre la acera.
  for (let x = 0; x < ANCHO_ESCENA; x++) {
    if (x >= 334 && x <= 450 && noche) continue;
    l.px(x, SUELO, k('sombraAc'));
    if (x % 2 === 0 || x > 468) l.px(x, SUELO + 1, k('sombraAc'));
  }
}

function bordilloYCalle(c: Cx): void {
  const { l, k } = c;
  l.rect(0, BORDILLO_Y, ANCHO_ESCENA, 1, k('bo2'));
  l.rect(0, BORDILLO_Y + 1, ANCHO_ESCENA, 3, k('bo1'));
  l.rect(0, BORDILLO_Y + 4, ANCHO_ESCENA, 1, k('bo0'));
  for (let y = BORDILLO_Y + 5; y < ALTO_ESCENA; y++) {
    for (let x = 0; x < ANCHO_ESCENA; x++) {
      const r = azar(x, y, 21);
      let t: TokenNaos = 'as1';
      if (y < BORDILLO_Y + 8) t = 'as0';
      else if (r < 0.05) t = 'as0';
      else if (r > 0.95) t = 'as2';
      l.px(x, y, k(t));
    }
  }
  // Línea continua junto al bordillo y línea de carril discontinua.
  l.rect(0, BORDILLO_Y + 13, ANCHO_ESCENA, 1, k('pi1'));
  for (let x = 0; x < ANCHO_ESCENA; x += 44) {
    l.rect(x + 6, ALTO_ESCENA - 16, 26, 2, k('pi0'));
  }
}

// ---------------------------------------------------------------------------
// Fachada larga
// ---------------------------------------------------------------------------

function modulosDeFachada(): { junta: Uint8Array; indice: Int16Array } {
  const largo = XN + 8;
  const junta = new Uint8Array(largo);
  const indice = new Int16Array(largo);
  let x = XN + 6;
  const posiciones: number[] = [];
  while (x >= 0) {
    posiciones.push(Math.round(x));
    x -= 17 * escalaFachada(x);
  }
  for (const p of posiciones) if (p >= 0 && p < largo) junta[p] = 1;
  let m = posiciones.length;
  for (let i = 0; i < largo; i++) {
    if (junta[i] === 1) m--;
    indice[i] = m;
  }
  return { junta, indice };
}

const CELOSIA_CLARA: readonly TokenNaos[] = ['ac2', 'ac1', 'ac0'];

function tonoVidrio(modulo: number, piso: number): TokenNaos {
  const r = azar(modulo, piso, 11);
  if (piso <= 2) {
    if (r < 0.28) return 'vg1';
    if (r < 0.5) return 'vg2';
    if (r < 0.7) return 'vg3';
    return 'vv1';
  }
  if (piso <= 5) {
    if (r < 0.5) return 'vg1';
    if (r < 0.65) return 'vg0';
    if (r < 0.85) return 'vv0';
    return 'vg2';
  }
  if (r < 0.46) return 'vg1';
  if (r < 0.7) return 'vg0';
  if (r < 0.9) return 'vv0';
  return 'vg2';
}

function vidrioMasClaro(t: TokenNaos): TokenNaos {
  switch (t) {
    case 'vg0':
      return 'vg1';
    case 'vg1':
      return 'vg2';
    case 'vv0':
      return 'vv1';
    default:
      return 'vg3';
  }
}

function zonaPiso(c: Cx, x: number, yTop: number, yBot: number, piso: number, modulo: number, esJunta: boolean): void {
  const { l, k, noche } = c;
  const h = yBot - yTop;
  if (h <= 0) return;
  const nSup = Math.max(2, Math.round(h * 0.42));
  const nVid = Math.max(2, Math.round(h * 0.3));
  const base = tonoVidrio(modulo, piso);
  // Ventana encendida de noche: todo el piso 4 y alguna suelta.
  const r = azar(modulo, piso, 31);
  const calida = noche && (piso === 4 || r > 0.97);
  const fria = noche && piso !== 4 && r > 0.9 && r <= 0.97;
  for (let i = 0; i < h; i++) {
    const y = yTop + i;
    let token: TokenNaos;
    if (i === 0) {
      token = 'ac0'; // sombra bajo la losa de arriba
    } else if (esJunta) {
      token = 'ac0';
    } else if (i < nSup) {
      token = elegir(CELOSIA_CLARA, (i - 1) % 3);
    } else if (i < nSup + nVid) {
      const g = i - nSup;
      const ultima = g === nVid - 1;
      if (calida) token = g === 0 ? 'luz0' : ultima ? 'luz3' : azar(modulo, piso, 5) > 0.5 ? 'luz2' : 'luz1';
      else if (fria) token = g === 0 ? 'vg0' : ultima ? 'fria1' : 'fria0';
      else if (g === 0) token = 'vg0';
      else if (ultima) token = vidrioMasClaro(base);
      else token = (x * 2 + y * 3 + piso * 5) % 41 < 2 ? vidrioMasClaro(base) : base;
    } else {
      token = elegir(CELOSIA_CLARA, (i - nSup - nVid) % 3);
    }
    l.px(x, y, k(token));
  }
}

function losa(c: Cx, x: number, yTop: number, yBot: number): void {
  const { l, k } = c;
  const h = yBot - yTop;
  for (let i = 0; i < h; i++) {
    let token: TokenNaos = 'c2';
    if (i === 0 && h > 1) token = 'c3';
    else if (i === h - 1 && h > 1) token = 'c1';
    l.px(x, yTop + i, k(token));
  }
}

function corona(c: Cx, x: number): void {
  const { l, k } = c;
  const yTop = filaFachada(NIVEL_CORONA, x);
  const yBot = filaFachada(NIVEL_TOPE_PISOS, x);
  const h = yBot - yTop;
  for (let i = 0; i < h; i++) {
    let token: TokenNaos;
    if (i === 0) token = 'c4';
    else if (i === 1) token = 'c2';
    else if (i === h - 1) token = 'crown0';
    else token = elegir(['crown2', 'crown1', 'crown0'] as const, (i - 2) % 3);
    l.px(x, yTop + i, k(token));
  }
}

function baseFachada(c: Cx, x: number): void {
  const { l, k } = c;
  const yTop = filaFachada(NIVEL_BASE, x);
  const s = escalaFachada(x);
  for (let y = yTop; y < SUELO; y++) {
    const nivel = (SUELO - y) / s;
    let token: TokenNaos = 'c2';
    if (y - yTop < 2) token = 'c1'; // sombra bajo la primera losa
    else if (nivel < 6) token = 'c1'; // zócalo
    else {
      // Juntas horizontales cada 12 niveles y marcas de encofrado.
      const banda = Math.floor(nivel / 12);
      const sobreJunta = Math.abs(nivel - banda * 12) < 0.55 * (1 / s);
      if (sobreJunta && banda > 0) token = 'c1';
      else if (azar(Math.floor(x / 4), banda, 5) < 0.2 && x % 4 < 2 && (y * 7 + banda) % 3 === 0) token = 'c1';
      else if ((Math.floor(x / (28 * s)) !== Math.floor((x - 1) / (28 * s))) && x > 0) token = 'c1';
    }
    l.px(x, y, k(token));
  }
}

function fachadaLarga(c: Cx): void {
  const { junta, indice } = modulosDeFachada();
  for (let x = 0; x < XN + 8; x++) {
    const s = escalaFachada(x);
    const Y = (n: number): number => Math.round(SUELO - s * n);
    baseFachada(c, x);
    losa(c, x, Y(nivelPiso(1) + ALTO_LOSA), Y(nivelPiso(1)));
    for (let piso = 1; piso <= 6; piso++) {
      const lo = nivelPiso(piso);
      const hi = lo + ALTO_PISO;
      zonaPiso(c, x, Y(hi), Y(lo + ALTO_LOSA), piso, indice[x] ?? 0, junta[x] === 1);
      if (piso < 6) losa(c, x, Y(hi + ALTO_LOSA), Y(hi));
    }
    corona(c, x);
  }
}

// ---------------------------------------------------------------------------
// Tambor de concreto con terrazas
// ---------------------------------------------------------------------------

function sagitaTambor(nivel: number, x: number): number {
  const t = Math.max(-1, Math.min(1, (x - TCX) / TMEDIO));
  return Math.round(0.034 * nivel * (1 - t * t));
}

/** Fila del arco (borde de un anillo de nivel `nivel`) en la columna `x`. */
export function arco(nivel: number, x: number): number {
  return SUELO - nivel - sagitaTambor(nivel, x);
}

/** Índice de luz del cilindro (4 claro a 0 oscuro) con transición en tablero. */
function luzCilindro(x: number, y: number): number {
  const u = (x - TX0) / (TX1 - TX0);
  const limites = [0.16, 0.38, 0.6, 0.82];
  let idx = 4;
  for (const b of limites) {
    if (u >= b + 0.012) idx--;
    else if (u >= b - 0.012 && ((x + y) & 1) === 1) idx--;
  }
  return idx;
}

const CONCRETO: readonly TokenNaos[] = ['c0', 'c1', 'c2', 'c3', 'c4'];
const ACERO: readonly TokenNaos[] = ['ac0', 'ac1', 'ac2', 'ac3', 'ac3'];

function concreto(idx: number): TokenNaos {
  return elegir(CONCRETO, idx);
}

/** Marca de encofrado: un guion de 2 x 1 un tono más oscuro. */
function conMarca(x: number, y: number, idx: number, densidad = 0.2): number {
  if (x % 4 < 2 && azar(Math.floor(x / 4), Math.floor(y / 5), 17) < densidad && (y * 5 + x) % 5 === 0) return Math.max(0, idx - 1);
  return idx;
}

const LETRAS: Readonly<Record<string, readonly string[]>> = {
  N: ['X...X', 'XX..X', 'X.X.X', 'X..XX', 'X...X', 'X...X', 'X...X'],
  A: ['.XXX.', 'X...X', 'X...X', 'XXXXX', 'X...X', 'X...X', 'X...X'],
  O: ['.XXX.', 'X...X', 'X...X', 'X...X', 'X...X', 'X...X', '.XXX.'],
  S: ['.XXXX', 'X....', 'X....', '.XXX.', '....X', '....X', 'XXXX.'],
};

/** Letras NAOS grabadas en la base del tambor. */
function rotuloNaos(c: Cx): void {
  const { l, k } = c;
  const nivelBase = 29;
  const palabra = 'NAOS';
  const ancho = palabra.length * 5 + (palabra.length - 1) * 2;
  const x0 = TCX - Math.floor(ancho / 2);
  const dibujar = (dx: number, dy: number, token: TokenNaos): void => {
    for (let n = 0; n < palabra.length; n++) {
      const glifo = LETRAS[palabra[n] as string] as readonly string[];
      for (let fila = 0; fila < glifo.length; fila++) {
        const linea = glifo[fila] as string;
        for (let col = 0; col < linea.length; col++) {
          if (linea[col] !== 'X') continue;
          const x = x0 + n * 7 + col + dx;
          l.px(x, SUELO - nivelBase - sagitaTambor(nivelBase, x) - (glifo.length - 1 - fila) + dy, k(token));
        }
      }
    }
  };
  dibujar(1, 1, 'c1');
  dibujar(0, 0, 'c4');
}

function tambor(c: Cx): void {
  const { k, noche } = c;
  const capa = new Lienzo(ANCHO_ESCENA, ALTO_ESCENA);
  const xs = Array.from({ length: TX1 - TX0 + 5 }, (_, i) => TX0 - 2 + i);
  const arboles = [-22, 16, -6, 30, -32, 8];

  // Base de concreto liso.
  for (const x of xs) {
    const sobresale = x < TX0 || x > TX1;
    if (sobresale) continue;
    const yTop = arco(NIVEL_BASE, x);
    for (let y = yTop; y < SUELO; y++) {
      let idx = luzCilindro(x, y);
      const nivel = SUELO - y;
      if (y - yTop < 2) idx = Math.max(0, idx - 2);
      else if (nivel < 5) idx = Math.max(0, idx - 1);
      else {
        // Juntas curvas cada 16 niveles.
        for (const n of [16, 32, 48]) if (y === arco(n, x)) idx = Math.max(0, idx - 1);
        idx = conMarca(x, y, idx, 0.24);
      }
      capa.px(x, y, k(concreto(idx)));
    }
  }

  // Pisos con terraza.
  for (let piso = 1; piso <= 6; piso++) {
    const lo = nivelPiso(piso);
    const hi = lo + ALTO_PISO;
    for (const x of xs) {
      const amplio = x >= TX0 - 1 && x <= TX1 + 1;
      const dentro = x >= TX0 && x <= TX1;
      if (!amplio) continue;
      const yLosaTop = arco(lo + ALTO_LOSA, x);
      const yLosaBot = arco(lo, x);
      // Losa: la cara de adelante, un tono más clara.
      for (let y = yLosaTop; y < yLosaBot; y++) {
        let idx = Math.min(4, luzCilindro(x, y) + 1);
        if (y === yLosaBot - 1) idx = Math.max(0, idx - 2);
        else if (y === yLosaTop) idx = Math.min(4, idx + 1);
        else idx = conMarca(x, y, idx, 0.14);
        capa.px(x, y, k(concreto(idx)));
      }
      if (!dentro) continue;
      // Terraza abierta.
      const yRecTop = arco(hi - 5, x);
      const yRecBot = yLosaTop;
      const pared = x < TX0 + 5 || x > TX1 - 5;
      for (let y = yRecTop; y < yRecBot; y++) {
        let idx = luzCilindro(x, y);
        if (pared) {
          idx = conMarca(x, y, idx, 0.2);
          capa.px(x, y, k(concreto(idx)));
        } else {
          let token: TokenNaos = idx >= 4 ? 'cs2' : idx >= 3 ? 'cs1' : 'cs0';
          if (conMarca(x, y, 2, 0.2) < 2) token = idx >= 4 ? 'cs1' : idx >= 3 ? 'cs0' : 'cs1';
          if (noche && piso === 4) token = y - yRecTop < 2 ? 'luz0' : (y - yRecTop) > (yRecBot - yRecTop - 3) ? 'luz3' : 'luz2';
          else if (y === yRecTop) token = 'cs0';
          capa.px(x, y, k(token));
        }
      }
      // Anillo de celosías sobre la terraza.
      const yAnTop = arco(hi, x);
      const yAnBot = yRecTop;
      for (let y = yAnTop; y < yAnBot; y++) {
        const idx = luzCilindro(x, y);
        const r = y - yAnTop;
        const tono = r === yAnBot - yAnTop - 1 ? 'ac0' : (ACERO[Math.max(0, idx - (r % 3))] as TokenNaos);
        capa.px(x, y, k(r === 0 ? 'ac0' : tono));
      }
    }
    // Barandas y árbol delgado de cada terraza.
    for (const x of xs) {
      if (x < TX0 + 5 || x > TX1 - 5) continue;
      const idx = luzCilindro(x, arco(lo + 6, x));
      const yBaseTerraza = arco(lo + ALTO_LOSA, x);
      const yBarandaTop = arco(lo + ALTO_LOSA + 6, x);
      const poste = (x - TX0) % 5 === 0;
      capa.px(x, yBarandaTop, k(elegir(ACERO, idx)));
      capa.px(x, arco(lo + ALTO_LOSA + 3, x), k(elegir(ACERO, idx - 2)));
      if (poste) for (let y = yBarandaTop + 1; y < yBaseTerraza; y++) capa.px(x, y, k(elegir(ACERO, idx - 1)));
    }
    const ox = arboles[piso - 1] as number;
    const xa = TCX + ox;
    const yCopa = arco(lo + 14, xa);
    for (let y = arco(lo + 10, xa); y < arco(lo + ALTO_LOSA, xa); y++) capa.px(xa, y, k('tr1'));
    capa.elipseSombreada(xa, yCopa, 5, 6.5, [k('v1'), k('v2'), k('v3'), k('v4')]);
    // Baranda por delante del tronco.
    for (let x = xa - 4; x <= xa + 4; x++) {
      if (x < TX0 + 5 || x > TX1 - 5) continue;
      capa.px(x, arco(lo + ALTO_LOSA + 6, x), k(elegir(ACERO, luzCilindro(x, 0))));
    }
  }

  // Corona: anillos curvos profundos de celosía.
  for (const x of xs) {
    const amplio = x >= TX0 - 2 && x <= TX1 + 2;
    if (!amplio) continue;
    const yTop = arco(NIVEL_CORONA, x);
    const yBot = arco(NIVEL_TOPE_PISOS, x);
    for (let y = yTop; y < yBot; y++) {
      const idx = luzCilindro(x, y);
      const r = y - yTop;
      let token: TokenNaos;
      if (r === 0) token = concreto(Math.min(4, idx + 1));
      else if (r === 1) token = concreto(Math.max(0, idx - 1));
      else if (y === yBot - 1) token = 'crown0';
      else {
        const pat: readonly TokenNaos[] = idx >= 3 ? ['crown2', 'crown1', 'crown0'] : ['crown1', 'crown0', 'crown0'];
        token = elegir(pat, (r - 2) % 3);
      }
      capa.px(x, y, k(token));
    }
  }

  capa.contorno(k('ol'));
  // El contorno no debe recortar el borde izquierdo contra la fachada con un trazo claro.
  c.l.pegar(capa, 0, 0);
  rotuloNaos(c);
}

// ---------------------------------------------------------------------------
// Lobby, puerta y marquesina
// ---------------------------------------------------------------------------

const LOBBY_X0 = 334;
const LOBBY_X1 = 450;

function lobby(c: Cx): void {
  const { l, k, noche } = c;
  // Marco de aluminio y vidrio de los dos paños.
  const paños: ReadonlyArray<readonly [number, number]> = [
    [LOBBY_X0, PUERTA.x - 2],
    [PUERTA.x + PUERTA.ancho + 2, LOBBY_X1],
  ];
  const yTop = (x: number): number => filaFachada(NIVEL_BASE - 7, x);
  for (const [xa, xb] of paños) {
    for (let x = xa; x <= xb; x++) {
      const top = yTop(x);
      const bot = SUELO - 3;
      const h = bot - top;
      for (let y = top; y < bot; y++) {
        const f = (y - top) / h;
        let token: TokenNaos;
        if (noche) {
          token = f < 0.3 ? 'luz1' : f < 0.62 ? 'luz2' : 'luz3';
          if (y === top) token = 'luz0';
        } else if (f < 0.42) {
          token = (x + y * 2) % 19 < 3 ? 'vg3' : (x + y * 2) % 19 < 7 ? 'vg2' : 'vg1';
          if (y === top) token = 'vg0';
        } else if (f < 0.5) {
          token = (x + y) % 2 === 0 ? 'vg1' : 'luz0';
        } else {
          token = azar(x >> 1, y, 6) > 0.93 ? 'luz2' : 'luz0';
        }
        l.px(x, y, k(token));
      }
      // Antepecho oscuro.
      l.px(x, bot, k('c1'));
      l.rect(x, bot + 1, 1, 2, k('c0'));
    }
  }
  // Un escritorio de recepción y una planta vistos a través del vidrio.
  const xr = 424;
  const yr = SUELO - 18;
  l.rect(xr, yr, 22, 14, k(noche ? 'luz0' : 'iw1'));
  l.rect(xr, yr, 22, 2, k(noche ? 'luz3' : 'luz1'));
  l.rect(xr, yr + 2, 22, 1, k(noche ? 'luz1' : 'iw0'));
  l.elipseSombreada(344, SUELO - 19, 5, 8, [k('v0'), k('v1'), k('v2'), k('v3')]);
  l.rect(341, SUELO - 12, 7, 9, k('iw0'));
  l.rect(341, SUELO - 12, 7, 1, k('iw2'));
  // Parantes verticales.
  for (const mx of [LOBBY_X0, 353, PUERTA.x - 2, PUERTA.x + PUERTA.ancho, 431, LOBBY_X1 - 1]) {
    const top = yTop(mx);
    l.rect(mx, top, 2, SUELO - 3 - top, k('ac1'));
    l.rect(mx, top, 1, SUELO - 3 - top, k('ac2'));
  }
  // Dintel sobre los paños.
  for (let x = LOBBY_X0; x <= LOBBY_X1; x++) {
    const top = yTop(x);
    l.rect(x, top - 2, 1, 2, k('ac1'));
    l.px(x, top - 2, k('ac2'));
  }
}

/** Marquesina de concreto, dintel y umbral de la puerta (sin las hojas). */
function marquesina(c: Cx): void {
  const { l, k } = c;
  const x0 = PUERTA.x - 18;
  const x1 = PUERTA.x + PUERTA.ancho + 18;
  const ancho = x1 - x0;
  const y0 = PUERTA.y - 12;
  l.rect(x0, y0, ancho, 1, k('c4'));
  l.rect(x0, y0 + 1, ancho, 3, k('c3'));
  l.rect(x0, y0 + 4, ancho, 2, k('c2'));
  l.rect(x0, y0 + 6, ancho, 1, k('c1'));
  l.rect(x0, y0 + 7, ancho, 1, k('c0'));
  l.rect(x0 + ancho - 1, y0, 1, 8, k('c1'));
  // Sombra de la marquesina sobre el vidrio.
  l.rect(x0 + 1, y0 + 8, ancho - 2, 2, k('ac0'));
  // Dintel de aluminio de la puerta.
  l.rect(PUERTA.x - 3, PUERTA.y - 3, PUERTA.ancho + 6, 3, k('ac1'));
  l.rect(PUERTA.x - 3, PUERTA.y - 3, PUERTA.ancho + 6, 1, k('ac3'));
  // Umbral.
  l.rect(PUERTA.x - 2, SUELO, PUERTA.ancho + 4, 2, k('c3'));
  l.rect(PUERTA.x - 2, SUELO + 1, PUERTA.ancho + 4, 1, k('c1'));
}

// ---------------------------------------------------------------------------
// Jardín curvo, árboles, poste, conos
// ---------------------------------------------------------------------------

function enJardin(x: number, y: number): boolean {
  const e = ((x - 548) / 98) ** 2 + ((y - 250) / 24) ** 2 <= 1;
  const franja = y >= 244 && y <= 262 && x >= 458;
  return e || franja;
}

function jardin(c: Cx): void {
  const { l, k } = c;
  const capa = new Lienzo(ANCHO_ESCENA, ALTO_ESCENA);
  // Tierra y pasto bajo.
  for (let y = 222; y < 280; y++) {
    for (let x = 440; x < ANCHO_ESCENA; x++) {
      if (!enJardin(x, y)) continue;
      const r = azar(x, y, 8);
      capa.px(x, y, k(r < 0.3 ? 'v0' : r < 0.85 ? 'v1' : 'v2'));
    }
  }
  // Borde de concreto en el frente y los lados.
  for (let y = 222; y < 280; y++) {
    for (let x = 440; x < ANCHO_ESCENA; x++) {
      if (!enJardin(x, y)) continue;
      const abajo = !enJardin(x, y + 1) || !enJardin(x, y + 2);
      const lado = !enJardin(x - 1, y);
      if (abajo) capa.px(x, y, k(!enJardin(x, y + 1) ? 'c1' : 'c3'));
      else if (lado) capa.px(x, y, k('c3'));
    }
  }
  const dentro = (x: number, y: number): boolean => enJardin(x, y) && enJardin(x, y + 3) && enJardin(x - 1, y);

  // Pasto alto: penachos de tres hojas con la punta amarillenta.
  const penachos: Array<{ x: number; y: number; alto: number; semilla: number }> = [];
  for (let i = 0; i < 90; i++) {
    const x = 454 + Math.floor(azar(i, 1, 40) * 190);
    const y = 238 + Math.floor(azar(i, 2, 40) * 30);
    if (!dentro(x, y)) continue;
    penachos.push({ x, y, alto: 5 + Math.floor(azar(i, 3, 40) * 6), semilla: i });
  }
  penachos.sort((a, b) => a.y - b.y);
  for (const p of penachos) {
    for (let h = -1; h <= 1; h++) {
      const largo = p.alto - Math.abs(h) * 2;
      for (let n = 0; n < largo; n++) {
        const inclinacion = Math.round((h * n) / 3);
        const x = p.x + h + inclinacion;
        const y = p.y - n;
        const punta = n >= largo - 2;
        const tono: TokenNaos = punta ? (n === largo - 1 ? 'pasto2' : 'pasto1') : n < 2 ? 'v2' : h < 0 ? 'pasto0' : 'v3';
        capa.px(x, y, k(tono));
      }
    }
  }
  // Arbustos redondos.
  const arbustos: ReadonlyArray<readonly [number, number, number]> = [
    [470, 254, 10],
    [506, 264, 12],
    [590, 258, 13],
    [628, 250, 11],
  ];
  for (const [x, y, r] of arbustos) {
    capa.elipseSombreada(x, y - r * 0.5, r * 1.25, r, [k('v1'), k('v2'), k('v3'), k('v4')]);
    capa.px(x - 3, y - r * 0.9, k('v4'));
    capa.px(x - 4, y - r * 0.7, k('v4'));
    capa.px(x + 3, y - r * 0.2, k('v1'));
    for (let i = 0; i < r * 3; i++) {
      const px = Math.round(x + (azar(i, x, 71) - 0.5) * r * 2.3);
      const py = Math.round(y - r * 0.5 + (azar(i, y, 72) - 0.5) * r * 1.7);
      if (!capa.esOpaco(px, py)) continue;
      const claro = px < x - r * 0.1 && py < y - r * 0.5;
      capa.rect(px, py, 2, 1, k(claro ? 'v4' : px > x + r * 0.3 ? 'v1' : 'v2'));
    }
  }
  capa.contorno(k('v0'));
  l.pegar(capa, 0, 0);
}

function arbol(c: Cx, x: number, yBase: number): void {
  const { l, k } = c;
  const capa = new Lienzo(ANCHO_ESCENA, ALTO_ESCENA);
  // Alcorque en la acera.
  capa.elipse(x, yBase + 1, 10, 3, k('adJ'));
  capa.elipse(x, yBase, 8, 2, k('tr0'));
  for (let i = -6; i <= 6; i += 3) capa.px(x + i, yBase, k('adJ'));
  // Tronco con luz a la izquierda.
  for (let y = yBase - 38; y <= yBase; y++) {
    const ancho = y > yBase - 6 ? 5 : 4;
    const x0 = x - Math.floor(ancho / 2);
    capa.rect(x0, y, ancho, 1, k('tr1'));
    capa.px(x0, y, k('tr2'));
    capa.px(x0 + ancho - 1, y, k('tr0'));
  }
  // Copa de racimos redondos, de atrás hacia adelante.
  const cy = yBase - 62;
  const racimos: ReadonlyArray<readonly [number, number, number]> = [
    [0, 14, 15],
    [-17, 6, 14],
    [18, 6, 14],
    [-9, -13, 14],
    [11, -12, 13],
    [0, 0, 20],
  ];
  for (const [dx, dy, r] of racimos) {
    capa.elipseSombreada(x + dx, cy + dy, r, r, [k('v1'), k('v2'), k('v3'), k('v4')]);
  }
  // Detalle de hojas: motas claras arriba a la izquierda y oscuras abajo.
  for (let i = 0; i < 46; i++) {
    const a = azar(i, x, 61) * Math.PI * 2;
    const rr = Math.sqrt(azar(i, x, 62)) * 24;
    const px = Math.round(x + Math.cos(a) * rr);
    const py = Math.round(cy + Math.sin(a) * rr * 0.9);
    if (!capa.esOpaco(px, py)) continue;
    capa.rect(px, py, 2, 1, k(py < cy ? 'v4' : 'v0'));
  }
  capa.contorno(k('v0'));
  l.pegar(capa, 0, 0);
}

function poste(c: Cx, x: number, yBase: number, yTope: number): void {
  const { l, k, noche } = c;
  const capa = new Lienzo(ANCHO_ESCENA, ALTO_ESCENA);
  // Base y fuste.
  capa.rect(x - 3, yBase - 4, 7, 4, k('ac1'));
  capa.rect(x - 3, yBase - 4, 7, 1, k('ac3'));
  capa.rect(x - 1, yTope, 3, yBase - yTope, k('ac1'));
  capa.rect(x - 1, yTope, 1, yBase - yTope, k('ac3'));
  // Brazo curvo hacia la derecha y luminaria.
  for (let i = 0; i < 20; i++) {
    const dy = Math.round(-Math.sqrt(Math.max(0, 1 - (i / 20) ** 2)) * 5 + 5);
    capa.rect(x + 1 + i, yTope - 1 + dy - 2, 1, 2, k('ac1'));
  }
  const lx = x + 18;
  const ly = yTope + 3;
  capa.rect(lx - 2, ly, 11, 3, k('ac2'));
  capa.rect(lx - 2, ly, 11, 1, k('ac3'));
  capa.rect(lx - 1, ly + 3, 9, 1, k('bombilla'));
  capa.contorno(k('ol'));
  l.pegar(capa, 0, 0);
  if (noche) {
    // Halo escalonado de la luz.
    const cx = lx + 3;
    const cy = ly + 4;
    for (let y = cy - 30; y <= cy + 30; y++) {
      for (let px = cx - 30; px <= cx + 30; px++) {
        const d = Math.hypot(px - cx, (y - cy) * 1.1);
        const par = ((px + y) & 1) === 0;
        let token: TokenNaos | null = null;
        if (d < 5) token = 'bombilla';
        else if (d < 10) token = par ? 'halo2' : 'halo1';
        else if (d < 17) token = par ? 'halo1' : null;
        else if (d < 26) token = par ? 'halo0' : null;
        if (token === null) continue;
        if (d >= 5 && l.esOpaco(px, y) && (px >= lx - 3 && px <= lx + 9 && y >= ly - 1 && y <= ly + 4)) continue;
        l.px(px, y, k(token));
      }
    }
    l.rect(lx - 2, ly, 11, 3, k('ac2'));
    l.rect(lx - 2, ly, 11, 1, k('ac3'));
    l.rect(lx - 1, ly + 3, 9, 1, k('bombilla'));
  }
}

function cono(c: Cx, x: number, yBase: number): void {
  const { l, k } = c;
  const capa = new Lienzo(ANCHO_ESCENA, ALTO_ESCENA);
  capa.rect(x - 5, yBase - 2, 11, 2, k('co4'));
  capa.rect(x - 5, yBase - 2, 11, 1, k('ac2'));
  for (let i = 0; i < 12; i++) {
    const y = yBase - 3 - i;
    const mitad = Math.min(4, 1 + Math.floor((11 - i) / 3));
    const banda = i === 4 || i === 5;
    capa.rect(x - mitad, y, mitad * 2 + 1, 1, k(banda ? 'co3' : 'co1'));
    capa.px(x - mitad, y, k(banda ? 'co3' : 'co2'));
    capa.px(x + mitad, y, k('co0'));
    if (mitad > 2) capa.px(x + mitad - 1, y, k(banda ? 'co3' : 'co0'));
  }
  capa.contorno(k('co4'));
  l.pegar(capa, 0, 0);
}

function cintaDeObra(c: Cx, xa: number, xb: number, yBase: number): void {
  const { l, k } = c;
  for (const x of [xa, xb]) {
    l.rect(x, yBase - 14, 2, 14, k('ac1'));
    l.px(x, yBase - 14, k('ac3'));
  }
  for (let x = xa + 2; x < xb; x++) {
    const t = (x - xa) / (xb - xa);
    const caida = Math.round(Math.sin(t * Math.PI) * 3);
    const y = yBase - 11 + caida;
    const amarillo = Math.floor((x + y) / 3) % 2 === 0;
    l.px(x, y, k(amarillo ? 'cin0' : 'cin1'));
    l.px(x, y + 1, k(amarillo ? 'cin0' : 'cin1'));
  }
}

// ---------------------------------------------------------------------------
// Escena completa
// ---------------------------------------------------------------------------

export function dibujarEscena(opciones: OpcionesEscena): Lienzo {
  const noche = opciones.noche;
  const solo = opciones.soloEdificio ?? false;
  const l = new Lienzo(ANCHO_ESCENA, ALTO_ESCENA);
  const c: Cx = { l, k: paletaNaos(noche), noche };

  cielo(c, ALTO_ESCENA);
  if (noche) estrellas(c);
  nubes(c);
  torresLejanas(c);
  apartamentos(c);

  if (solo) {
    // Suelo de panel: acera tenue que se funde en el fondo oscuro.
    acera(c);
    // Cuatro bandas de trama que van de la acera al fondo oscuro.
    for (let y = 284; y < ALTO_ESCENA; y++) {
      const banda = Math.floor((y - 284) / 9);
      for (let x = 0; x < ANCHO_ESCENA; x++) {
        const cubre =
          banda <= 0 ? false : banda === 1 ? (x & 1) === 0 && (y & 1) === 0 : banda === 2 ? ((x + y) & 1) === 0 : banda === 3 ? !((x & 1) === 1 && (y & 1) === 1) : true;
        if (cubre) l.px(x, y, c.k('cielo0'));
      }
    }
  } else {
    acera(c);
    bordilloYCalle(c);
  }

  fachadaLarga(c);
  tambor(c);
  lobby(c);
  l.pegar(interiorLobby(), PUERTA.x, PUERTA.y);
  l.pegar(hojaPuerta('izq'), PUERTA.x, PUERTA.y);
  l.pegar(hojaPuerta('der'), PUERTA.x + 20, PUERTA.y);
  marquesina(c);
  jardin(c);

  if (!solo) {
    arbol(c, 70, 282);
    arbol(c, 196, 282);
    poste(c, 300, 284, 116);
    cintaDeObra(c, 142, 238, 316);
    for (const x of [128, 246, 340, 472, 578]) cono(c, x, 316);
  }
  return l;
}

// ---------------------------------------------------------------------------
// Geometría del piso 4 (la oficina de ejemplo)
// ---------------------------------------------------------------------------

export interface GeometriaPiso4 {
  /** Caja que contiene toda la franja (fachada larga y tambor). */
  caja: { x: number; y: number; ancho: number; alto: number };
  /** Fachada larga: bordes de la franja en la columna izquierda y en la derecha (x1 incluida). */
  fachada: { x0: number; x1: number; y0Arriba: number; y0Abajo: number; y1Arriba: number; y1Abajo: number };
  /** Tambor: bordes en las puntas (x0, x1) y en el centro (xCentro), donde el arco sube más. */
  tambor: { x0: number; x1: number; xCentro: number; yBordeArriba: number; yBordeAbajo: number; yCentroArriba: number; yCentroAbajo: number };
}

/** La franja del piso 4: de la losa de abajo (inclusive) al borde de arriba. */
export function geometriaPiso4(): GeometriaPiso4 {
  const lo = nivelPiso(4);
  const hi = lo + ALTO_PISO;
  const arriba = (x: number): number => filaFachada(hi, x);
  const abajo = (x: number): number => filaFachada(lo, x);
  const xFin = TX0 - 1;
  const yMin = arco(hi, TCX);
  const yMax = abajo(0);
  return {
    caja: { x: 0, y: yMin, ancho: TX1 + 1, alto: yMax - yMin },
    fachada: { x0: 0, x1: xFin, y0Arriba: arriba(0), y0Abajo: abajo(0), y1Arriba: arriba(xFin), y1Abajo: abajo(xFin) },
    tambor: {
      x0: TX0,
      x1: TX1,
      xCentro: TCX,
      yBordeArriba: arco(hi, TX0),
      yBordeAbajo: arco(lo, TX0),
      yCentroArriba: arco(hi, TCX),
      yCentroAbajo: arco(lo, TCX),
    },
  };
}
