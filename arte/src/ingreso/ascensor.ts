/**
 * Constructor `ingreso-ascensor`: arte original de las escenas de lobby, ascensor y llegada al piso 4
 * del ingreso animado. Las referencias de estilo guían el estilo,
 * la luz y el ritmo; ningún píxel se copia.
 *
 * Todo se dibuja en una cuadrícula de 320 x 180 (la escena la amplía 2x a 640 x 360 con vecino más
 * cercano, igual que el personaje, que allí mide 17 x 26). Escribe en `web/public/assets/ingreso/`:
 *   ascensor-marco.png                 pared y marco de las puertas (con el hueco transparente)
 *   ascensor-hoja-izq.png / -der.png   las dos hojas de acero con reflejos diagonales
 *   ascensor-llamada.png               botonera de llamada junto a las puertas
 *   ascensor-interior.png              lo que se ve al abrir: la cabina por dentro
 *   lobby-fondo.png                    el lobby del edificio (sin ascensor, sin luces; la puerta de madera es decorado y queda cerrada)
 *   cabina-fondo.png                   la cabina vista desde adentro (puertas cerradas y botonera)
 *   pasillo-fondo.png                  el pasillo del piso 4 (sin ascensor, sin luces; la puerta de madera es decorado y queda cerrada)
 *   pasillo-puerta-abierta.png         la puerta de madera abierta (luz de la oficina)
 *   ingreso-ascensor-meta.json         coordenadas para el código de las escenas
 * Las luces (focos, fluorescentes, pantalla) las anima el código encima.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { registrarConstructor } from '../construir';
import type { ContextoConstruccion } from '../construir';
import { Lienzo, codificarPng, jsonLegible, rutaRaiz, validarLienzo } from '../nucleo';
import { DIR_INGRESO } from './fachada';

/** Paleta propia de estas escenas: colores fijos, la luz del día y de la noche se aplica en el código. */
export const TOKENS_ASCENSOR = {
  ol0: '#1C1820',
  ol1: '#2A2430',
  // Pared lavanda, como la de la referencia de las puertas.
  lv0: '#8C93BE',
  lv1: '#A9B0D6',
  lv2: '#C3C9E6',
  lv3: '#DDE1F4',
  // Acero.
  st0: '#3C4658',
  st1: '#5C687E',
  st2: '#8794AC',
  st3: '#B4BFD2',
  st4: '#DCE3EE',
  st5: '#F2F6FB',
  fr0: '#252A36',
  fr1: '#3A4152',
  // Ámbar del indicador y de los botones.
  am0: '#7A4A08',
  am1: '#C98410',
  am2: '#FFC21A',
  am3: '#FFE27A',
  in0: '#0E0D12',
  in1: '#1A1820',
  in2: '#2A2630',
  // Madera cálida de la cabina.
  wd0: '#2E1612',
  wd1: '#4A241C',
  wd2: '#6E3A2C',
  wd3: '#93543C',
  wd4: '#B87450',
  // Latón.
  br0: '#7A5424',
  br1: '#B8842E',
  br2: '#E6B450',
  br3: '#FFE08E',
  // Baldosas cálidas.
  fl0: '#6A4426',
  fl1: '#9A6A38',
  fl2: '#C8924C',
  fl3: '#EFC070',
  // Rojo del botón del piso.
  rj0: '#8A1218',
  rj1: '#D8262C',
  rj2: '#FF5A52',
  // Pasillo.
  pa0: '#6E6870',
  pa1: '#8E8892',
  pa2: '#B0AAB0',
  pa3: '#CFC9C8',
  zc0: '#3E3A4E',
  zc1: '#585470',
  ps0: '#2A2E40',
  ps1: '#3A3F58',
  ps2: '#50567A',
  ce0: '#34343F',
  ce1: '#4A4A58',
  fx0: '#76766A',
  fx1: '#B8B89A',
  fx2: '#E8E8CC',
  pw0: '#4E2A16',
  pw1: '#7A4424',
  pw2: '#A2662F',
  pw3: '#C98A48',
  vx0: '#0E5A2E',
  vx1: '#1FA050',
  vx2: '#6CF08A',
  vx3: '#D2FFD8',
  az0: '#1A3A78',
  az1: '#3A78D0',
  az2: '#7CB4F2',
  az3: '#CDE6FF',
  es0: '#3A2A28',
  es1: '#5A423A',
  vg0: '#1E5A38',
  vg1: '#2E8844',
  vg2: '#54AE50',
  mc0: '#8E4627',
  mc1: '#B8623C',
} as const;

export type TokenAscensor = keyof typeof TOKENS_ASCENSOR;
const T = TOKENS_ASCENSOR;
export const coloresAscensor = (): string[] => [...new Set(Object.values(TOKENS_ASCENSOR).map((h) => h.toUpperCase()))];

/** Geometría compartida con el código de las escenas (web/src/ingreso/ascensor.ts). */
export const GEO = {
  cuadricula: { ancho: 320, alto: 180 },
  marco: { ancho: 56, alto: 70, abertura: { x: 10, y: 22, ancho: 36, alto: 46 }, indicador: { x: 18, y: 7, ancho: 20, alto: 6 } },
  hoja: { ancho: 18, alto: 46 },
  llamada: { ancho: 8, alto: 14 },
  cabina: {
    ancho: 160,
    alto: 180,
    puertas: { x: 45, y: 28, ancho: 70, alto: 64 },
    indicador: { x: 52, y: 17, ancho: 56, alto: 8 },
    lampara: { x: 70, y: 2, ancho: 20, alto: 4 },
    panel: { x: 142, y: 50, ancho: 16, alto: 58 },
    // Centros de los botones (columna izquierda y derecha, de abajo hacia arriba). El 4 es el de la derecha, segunda fila.
    botones: { x: [147, 153], y: [97, 87, 77, 67] },
  },
  lobby: { sueloY: 104, marcoX: 200, marcoY: 34, llamadaX: 187, llamadaY: 72, lamparas: [60, 150, 255] },
  pasillo: {
    sueloY: 120,
    marcoX: 14,
    marcoY: 50,
    placa: { x: 96, y: 46, ancho: 80, alto: 20 },
    puerta: { x: 232, y: 66, ancho: 30, alto: 54 },
    pantalla: { x: 195, y: 82, ancho: 18, alto: 14 },
    fluorescentes: [60, 150, 240],
  },
} as const;

function ruido(a: number, b: number, c = 0): number {
  let h = Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263) + Math.imul(c | 0, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

// ---------- tipografía mínima de 3 x 5 (para el cartel y los números) ----------

const LETRAS: Readonly<Record<string, readonly number[]>> = {
  '1': [2, 6, 2, 2, 7],
  '2': [7, 1, 7, 4, 7],
  '3': [7, 1, 7, 1, 7],
  '4': [5, 5, 7, 1, 1],
  E: [7, 4, 6, 4, 7],
  X: [5, 5, 2, 5, 5],
  I: [7, 2, 2, 2, 7],
  T: [7, 2, 2, 2, 2],
};

function texto3x5(l: Lienzo, s: string, x: number, y: number, color: string): void {
  let cx = x;
  for (const ch of s) {
    const filas = LETRAS[ch];
    if (filas) filas.forEach((bits, j) => [0, 1, 2].forEach((i) => ((bits >> (2 - i)) & 1) === 1 && l.px(cx + i, y + j, color)));
    cx += 4;
  }
}

// ---------- el ascensor visto de frente (lobby y pasillo) ----------

export function marcoAscensor(): Lienzo {
  const { ancho: W, alto: H, abertura: A, indicador: I } = GEO.marco;
  const l = new Lienzo(W, H);
  l.rect(0, 0, W, H, T.lv1);
  l.rect(2, 2, 3, H - 2, T.lv2);
  l.rect(W - 5, 2, 3, H - 2, T.lv0);
  l.rect(2, 2, W - 4, 2, T.lv2);
  // Marco exterior oscuro (arriba y a los lados; abajo apoya en el piso).
  l.rect(0, 0, W, 2, T.ol0);
  l.rect(0, 0, 2, H, T.ol0);
  l.rect(W - 2, 0, 2, H, T.ol0);
  l.rect(0, H - 1, W, 1, T.ol0);
  // Caja del indicador de piso.
  l.rect(I.x - 2, I.y - 2, I.ancho + 4, I.alto + 4, T.fr0);
  l.rect(I.x - 1, I.y - 1, I.ancho + 2, I.alto + 2, T.fr1);
  l.rect(I.x, I.y, I.ancho, I.alto, T.in0);
  l.rect(I.x - 2, I.y - 2, I.ancho + 4, 1, T.st1);
  // Marco de las puertas: dos anillos de acero oscuro con luz arriba y a la izquierda.
  l.rect(A.x - 3, A.y - 3, A.ancho + 6, A.alto + 3, T.fr0);
  l.rect(A.x - 2, A.y - 2, A.ancho + 4, A.alto + 2, T.fr1);
  l.rect(A.x - 2, A.y - 2, A.ancho + 4, 1, T.st2);
  l.rect(A.x - 2, A.y - 2, 1, A.alto + 2, T.st1);
  l.rect(A.x - 1, A.y - 1, A.ancho + 2, 1, T.in2);
  // Umbral.
  l.rect(A.x - 3, A.y + A.alto, A.ancho + 6, 2, T.st3);
  l.rect(A.x - 3, A.y + A.alto + 1, A.ancho + 6, 1, T.st1);
  // Hueco transparente: ahí van el interior y las hojas.
  l.rect(A.x, A.y, A.ancho, A.alto, 'transparente');
  return l;
}

/** Una hoja de acero: la diagonal de reflejos cruza las dos hojas como un solo vidrio. */
export function hojaAscensor(lado: 'izq' | 'der'): Lienzo {
  const { ancho: W, alto: H } = GEO.hoja;
  const l = new Lienzo(W, H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const xg = lado === 'izq' ? x : W + x;
      const borde = 12 + Math.floor(xg * 0.55);
      let c: string = T.st4;
      if (y >= 35) c = T.st2;
      else if (y === borde || y === borde + 1) c = T.st5;
      else if (y > borde + 1 && y < borde + 9) c = T.st3;
      else if (y >= borde + 9) c = (x + y) % 2 === 0 ? T.st3 : T.st2;
      l.px(x, y, c);
    }
  }
  l.rect(0, 35, W, 1, T.st1);
  // Bordes: el de afuera (contra el marco) y el de adentro (costura central).
  const afuera = lado === 'izq' ? 0 : W - 1;
  const adentro = lado === 'izq' ? W - 1 : 0;
  const dentro2 = lado === 'izq' ? W - 2 : 1;
  const afuera2 = lado === 'izq' ? 1 : W - 2;
  l.rect(afuera, 0, 1, H, T.st1);
  l.rect(afuera2, 0, 1, H - 11, T.st3);
  l.rect(adentro, 0, 1, H, T.st0);
  l.rect(dentro2, 0, 1, H, T.st1);
  l.rect(0, 0, W, 1, T.st1);
  l.rect(0, H - 1, W, 1, T.st0);
  return l;
}

export function llamadaAscensor(): Lienzo {
  const { ancho: W, alto: H } = GEO.llamada;
  const l = new Lienzo(W, H);
  l.rect(0, 0, W, H, T.ol0);
  l.rect(1, 1, W - 2, H - 2, T.st3);
  l.rect(1, 1, W - 2, 1, T.st4);
  for (const y of [3, 8]) {
    l.rect(2, y, 4, 3, T.fr1);
    l.rect(3, y, 2, 1, T.st2);
  }
  l.px(3, 4, T.st3);
  l.px(4, 9, T.st3);
  return l;
}

/** La cabina vista por la abertura: madera cálida, un pasamanos de latón y el piso de baldosas. */
export function interiorAscensor(): Lienzo {
  const { ancho: W, alto: H } = { ancho: GEO.marco.abertura.ancho, alto: GEO.marco.abertura.alto };
  const l = new Lienzo(W, H);
  l.rect(0, 0, W, H, T.wd2);
  for (let x = 4; x < W - 4; x += 7) {
    l.rect(x, 6, 1, 32, T.wd1);
    l.rect(x + 1, 6, 1, 32, T.wd3);
  }
  l.rect(0, 0, W, 6, T.wd0);
  l.rect(0, 0, 4, H, T.wd1);
  l.rect(W - 4, 0, 4, H, T.wd1);
  l.rect(3, 6, 1, 32, T.wd0);
  l.rect(W - 4, 6, 1, 32, T.wd0);
  l.rect(12, 2, 12, 2, T.br3);
  l.rect(11, 3, 14, 1, T.br2);
  // Pasamanos.
  l.rect(4, 26, W - 8, 2, T.br1);
  l.rect(4, 26, W - 8, 1, T.br3);
  l.rect(4, 28, W - 8, 1, T.br0);
  // Piso.
  l.rect(0, 38, W, H - 38, T.fl1);
  l.rect(0, 38, W, 1, T.fl0);
  for (let x = 0; x < W; x += 9) l.rect(x, 39, 1, H - 39, T.fl0);
  l.rect(0, 43, W, 1, T.fl0);
  l.rect(8, 40, 20, 5, T.fl2);
  l.rect(12, 41, 12, 3, T.fl3);
  return l;
}

// ---------- el lobby ----------

export function fondoLobby(): Lienzo {
  const l = new Lienzo(320, 180);
  const S = GEO.lobby.sueloY;
  // Pared con paños verticales y zócalo azul oscuro.
  l.rect(0, 0, 320, S, T.lv2);
  for (let x = 0; x < 320; x += 40) {
    l.rect(x, 10, 1, S - 10, T.lv1);
    l.rect(x + 1, 10, 1, S - 10, T.lv3);
  }
  l.rect(0, 0, 320, 8, T.lv0);
  l.rect(0, 8, 320, 2, T.lv1);
  l.rect(0, 80, 320, 2, T.lv3);
  l.rect(0, 82, 320, S - 82, T.zc1);
  for (let x = 6; x < 320; x += 20) l.rect(x, 86, 12, S - 90, T.zc0);
  l.rect(0, S - 3, 320, 3, T.fr0);
  l.rect(0, 80, 320, 1, T.lv3);
  // Luminarias de techo (la luz la pone el código).
  for (const cx of GEO.lobby.lamparas) {
    l.rect(cx - 18, 8, 36, 4, T.st2);
    l.rect(cx - 16, 8, 32, 2, T.st4);
    l.rect(cx - 18, 11, 36, 1, T.st0);
  }
  // Piso de piedra clara con juntas en perspectiva.
  l.rect(0, S, 320, 180 - S, T.pa3);
  const filas = [S, S + 8, S + 20, S + 36, S + 56, S + 80];
  for (const y of filas) l.rect(0, y, 320, 1, T.pa2);
  for (let k = -10; k <= 10; k++) l.linea(160 + k * 14, S, 160 + k * 46, 180, T.pa2);
  l.rect(0, S, 320, 2, T.pa1);
  l.rect(0, S + 1, 320, 1, T.pa0);
  // Alfombra azulada de recibimiento.
  for (let y = 122; y < 172; y++) {
    const m = Math.floor((y - 122) * 0.35);
    l.rect(70 - m, y, 190 + 2 * m, 1, (y + 3) % 6 === 0 ? T.zc1 : T.lv0);
  }
  // Recepción a la izquierda.
  l.rect(10, 76, 96, 4, T.wd4);
  l.rect(10, 76, 96, 1, T.br3);
  l.rect(10, 80, 96, 24, T.wd2);
  for (let x = 14; x < 104; x += 12) l.rect(x, 84, 8, 16, T.wd1);
  for (let x = 14; x < 104; x += 12) l.rect(x, 84, 8, 1, T.wd3);
  l.rect(10, 80, 96, 1, T.wd3);
  l.rect(10, 102, 96, 2, T.wd0);
  l.rect(66, 58, 22, 16, T.fr0);
  l.rect(67, 59, 20, 12, T.az1);
  l.rect(67, 59, 20, 2, T.az2);
  l.rect(75, 71, 4, 5, T.es1);
  // Plantas.
  for (const [px, py] of [[118, 104], [300, 104]] as const) {
    l.rect(px - 6, py - 12, 12, 12, T.mc1);
    l.rect(px - 7, py - 12, 14, 3, T.mc0);
    l.elipseSombreada(px, py - 24, 9, 12, [T.vg0, T.vg1, T.vg2, T.vg2]);
    l.elipseSombreada(px - 6, py - 30, 5, 8, [T.vg0, T.vg1, T.vg2, T.vg2]);
  }
  // Cuadro grande.
  l.rect(134, 26, 38, 30, T.br1);
  l.rect(136, 28, 34, 26, T.lv3);
  l.rect(138, 40, 30, 10, T.az1);
  l.rect(142, 31, 10, 10, T.vg2);
  l.rect(156, 33, 8, 7, T.am2);
  l.rect(138, 47, 30, 3, T.az0);
  return l;
}

// ---------- la cabina por dentro ----------

export function fondoCabina(): Lienzo {
  const { ancho: W, alto: H, puertas: P, indicador: I, lampara: L, panel: Pn, botones: B } = GEO.cabina;
  const l = new Lienzo(W, H);
  l.rect(0, 0, W, H, T.in0);
  const FONDO = { x0: 24, x1: 136, y0: 12, y1: 100 };
  // Pared del fondo.
  l.rect(FONDO.x0, FONDO.y0, FONDO.x1 - FONDO.x0, FONDO.y1 - FONDO.y0, T.wd2);
  for (let x = FONDO.x0 + 2; x < FONDO.x1; x += 14) l.rect(x, FONDO.y0, 1, FONDO.y1 - FONDO.y0, T.wd1);
  // Techo y paredes laterales en perspectiva.
  for (let x = 0; x < FONDO.x0; x++) {
    const arriba = Math.floor(x * 0.5);
    const abajo = Math.round(H - x * (80 / FONDO.x0));
    for (const xx of [x, W - 1 - x]) {
      l.rect(xx, 0, 1, arriba, T.wd0);
      l.rect(xx, arriba, 1, abajo - arriba, xx < W / 2 ? T.wd1 : T.wd1);
      // Panel enmarcado.
      if (x > 4 && x < FONDO.x0 - 3) {
        const a2 = arriba + 12 + Math.floor((x - 4) * 0.1);
        const b2 = abajo - 24 - Math.floor((x - 4) * 0.8);
        l.rect(xx, a2, 1, b2 - a2, x === 5 || x === FONDO.x0 - 4 ? T.wd0 : T.wd2);
        l.px(xx, a2, T.wd0);
        l.px(xx, b2 - 1, T.wd0);
      }
    }
  }
  l.rect(0, 0, W, 1, T.in0);
  for (let x = FONDO.x0; x < FONDO.x1; x++) l.rect(x, 0, 1, FONDO.y0, T.wd0);
  l.rect(FONDO.x0, FONDO.y0 - 1, FONDO.x1 - FONDO.x0, 1, T.wd1);
  // Lámpara del techo (la luz y el halo los pone el código).
  l.rect(L.x, L.y, L.ancho, L.alto, T.br1);
  l.rect(L.x + 2, L.y + 1, L.ancho - 4, 2, T.br3);
  // Piso con baldosas en perspectiva.
  for (let y = FONDO.y1; y < H; y++) {
    const m = ((y - FONDO.y1) * FONDO.x0) / (H - FONDO.y1);
    l.rect(Math.round(FONDO.x0 - m), y, Math.round(FONDO.x1 - FONDO.x0 + 2 * m), 1, T.fl1);
  }
  for (const y of [100, 108, 118, 131, 147, 166]) {
    const m = ((y - FONDO.y1) * FONDO.x0) / (H - FONDO.y1);
    l.rect(Math.round(FONDO.x0 - m), y, Math.round(FONDO.x1 - FONDO.x0 + 2 * m), 1, T.fl0);
  }
  for (let k = -5; k <= 5; k++) l.linea(80 + k * 11, FONDO.y1, 80 + k * 28, H - 1, T.fl0);
  for (let y = 104; y < H - 6; y++) {
    const ancho = Math.floor(12 + (y - 104) * 0.9);
    for (let x = 80 - ancho; x <= 80 + ancho; x++) {
      if (l.leerHex(x, y) === T.fl1 && ((x + y) % 2 === 0 || y > 130)) l.px(x, y, y > 125 ? T.fl3 : T.fl2);
    }
  }
  // Zócalo de la pared del fondo.
  l.rect(FONDO.x0, FONDO.y1 - 3, FONDO.x1 - FONDO.x0, 3, T.wd0);
  // Pasamanos de latón en el fondo, a los lados de las puertas.
  for (const x0 of [FONDO.x0, P.x + P.ancho + 1]) {
    const w = x0 === FONDO.x0 ? P.x - 1 - FONDO.x0 : FONDO.x1 - (P.x + P.ancho + 1);
    l.rect(x0, 72, w, 2, T.br1);
    l.rect(x0, 72, w, 1, T.br3);
    l.rect(x0, 74, w, 1, T.br0);
  }
  // Puertas cerradas: marco de latón y dos hojas con dibujo en V.
  l.rect(P.x - 3, P.y - 3, P.ancho + 6, P.alto + 3, T.br0);
  l.rect(P.x - 2, P.y - 2, P.ancho + 4, P.alto + 2, T.br1);
  l.rect(P.x - 2, P.y - 2, P.ancho + 4, 1, T.br3);
  l.rect(P.x - 2, P.y - 2, 1, P.alto + 2, T.br2);
  const hw = P.ancho / 2;
  for (const lado of [0, 1] as const) {
    const x0 = P.x + lado * hw;
    l.rect(x0, P.y, hw, P.alto, T.wd3);
    l.rect(x0 + 2, P.y + 2, hw - 4, P.alto - 4, T.wd2);
    for (let y = P.y + 4; y < P.y + P.alto - 6; y += 6) {
      const cx = lado === 0 ? x0 + hw - 3 : x0 + 2;
      const lx = lado === 0 ? x0 + 3 : x0 + hw - 4;
      l.linea(cx, y, lx, y + 4, T.wd4);
      l.linea(cx, y + 1, lx, y + 5, T.wd1);
    }
    l.rect(x0, P.y, hw, 1, T.wd1);
    l.rect(x0, P.y, 1, P.alto, lado === 0 ? T.wd4 : T.wd1);
    l.rect(x0 + hw - 1, P.y, 1, P.alto, lado === 0 ? T.wd1 : T.wd4);
    l.rect(x0 + 2, P.y + P.alto - 4, hw - 4, 3, T.br0);
  }
  l.rect(P.x + hw - 1, P.y, 2, P.alto, T.in0);
  // Dintel con la caja del indicador de piso.
  l.rect(I.x - 3, I.y - 3, I.ancho + 6, I.alto + 6, T.br0);
  l.rect(I.x - 2, I.y - 2, I.ancho + 4, I.alto + 4, T.br1);
  l.rect(I.x - 2, I.y - 2, I.ancho + 4, 1, T.br3);
  l.rect(I.x, I.y, I.ancho, I.alto, T.in0);
  // Botonera: placa de latón con dos columnas de botones redondos.
  l.rect(Pn.x - 1, Pn.y - 1, Pn.ancho + 2, Pn.alto + 2, T.ol0);
  l.rect(Pn.x, Pn.y, Pn.ancho, Pn.alto, T.br1);
  l.rect(Pn.x, Pn.y, Pn.ancho, 1, T.br3);
  l.rect(Pn.x, Pn.y, 1, Pn.alto, T.br2);
  l.rect(Pn.x + Pn.ancho - 1, Pn.y, 1, Pn.alto, T.br0);
  l.rect(Pn.x + 1, Pn.y + 1, Pn.ancho - 2, Pn.alto - 2, T.in1);
  for (let j = 0; j < 3; j++) l.rect(Pn.x + 3, Pn.y + 3 + j * 2, Pn.ancho - 6, 1, T.in2);
  for (const cx of B.x) {
    for (const cy of B.y) {
      l.rect(cx - 2, cy - 2, 5, 5, T.br0);
      l.rect(cx - 1, cy - 2, 3, 5, T.br1);
      l.rect(cx - 2, cy - 1, 5, 3, T.br1);
      l.rect(cx - 1, cy - 1, 3, 3, T.br2);
      l.px(cx - 1, cy - 1, T.br3);
    }
  }
  // Una placa pequeña de alarma bajo los botones.
  l.rect(Pn.x + 3, Pn.y + Pn.alto - 6, Pn.ancho - 6, 3, T.rj0);
  return l;
}

// ---------- el pasillo del piso 4 ----------

export function fondoPasillo(): Lienzo {
  const { sueloY: S, placa, puerta, pantalla } = GEO.pasillo;
  const l = new Lienzo(320, 180);
  // Pared con juntas y zócalo.
  l.rect(0, 0, 320, S, T.pa1);
  for (let x = 0; x < 320; x += 32) {
    l.rect(x, 20, 1, 74, T.pa0);
    l.rect(x + 1, 20, 1, 74, T.pa2);
  }
  l.rect(0, 92, 320, 2, T.pa3);
  l.rect(0, 94, 320, S - 94, T.zc1);
  for (let x = 4; x < 320; x += 24) {
    l.rect(x, 98, 16, S - 104, T.zc0);
    l.rect(x, 98, 16, 1, T.zc1);
  }
  l.rect(0, S - 3, 320, 3, T.fr0);
  // Techo con losetas y los tubos fluorescentes apagados (la luz la pone el código).
  l.rect(0, 0, 320, 20, T.ce0);
  for (let x = 0; x < 320; x += 24) l.rect(x, 0, 1, 20, T.ce1);
  l.rect(0, 10, 320, 1, T.ce1);
  l.rect(0, 20, 320, 2, T.ce1);
  l.rect(0, 22, 320, 1, T.in2);
  for (const cx of GEO.pasillo.fluorescentes) {
    l.rect(cx - 25, 13, 50, 6, T.fx0);
    l.rect(cx - 24, 14, 48, 4, T.fx1);
    l.rect(cx - 22, 15, 44, 2, T.fx2);
    l.rect(cx - 25, 18, 50, 1, T.ce0);
    l.rect(cx - 26, 12, 52, 1, T.ce1);
  }
  // Piso: alfombra azul grisácea.
  l.rect(0, S, 320, 180 - S, T.ps1);
  for (let y = S; y < 180; y++) for (let x = 0; x < 320; x++) if (ruido(x, y, 9) > 0.86) l.px(x, y, ruido(x, y, 4) > 0.5 ? T.ps0 : T.ps2);
  l.rect(0, S, 320, 3, T.ps0);
  for (let x = 0; x < 320; x += 64) l.rect(x, S + 40, 40, 1, T.ps2);
  // Placa del logo: el logo real lo dibuja el código encima.
  l.rect(placa.x - 2, placa.y - 2, placa.ancho + 4, placa.alto + 4, T.st1);
  l.rect(placa.x - 1, placa.y - 1, placa.ancho + 2, placa.alto + 2, T.fr1);
  l.rect(placa.x, placa.y, placa.ancho, placa.alto, T.in1);
  l.rect(placa.x - 2, placa.y - 2, placa.ancho + 4, 1, T.st3);
  // Planta junto al ascensor.
  l.rect(78, S - 12, 12, 12, T.mc1);
  l.rect(77, S - 12, 14, 3, T.mc0);
  l.elipseSombreada(84, S - 24, 9, 12, [T.vg0, T.vg1, T.vg2, T.vg2]);
  l.elipseSombreada(90, S - 30, 5, 8, [T.vg0, T.vg1, T.vg2, T.vg2]);
  // Mostrador con monitor.
  l.rect(184, 96, 42, 3, T.wd4);
  l.rect(184, 96, 42, 1, T.br3);
  l.rect(184, 99, 42, S - 99, T.wd2);
  for (let x = 188; x < 224; x += 12) l.rect(x, 103, 8, 12, T.wd1);
  l.rect(184, S - 3, 42, 3, T.wd0);
  l.rect(pantalla.x - 2, pantalla.y - 2, pantalla.ancho + 4, pantalla.alto + 4, T.es0);
  l.rect(pantalla.x, pantalla.y, pantalla.ancho, pantalla.alto, T.az1);
  l.rect(pantalla.x, pantalla.y, pantalla.ancho, 2, T.az2);
  l.rect(pantalla.x + 2, pantalla.y + 5, 10, 1, T.az3);
  l.rect(pantalla.x + 2, pantalla.y + 8, 7, 1, T.az2);
  l.rect(pantalla.x + 7, pantalla.y + pantalla.alto + 2, 4, 2, T.es1);
  l.rect(pantalla.x + 3, 94, 12, 2, T.es0);
  // Puerta de madera cerrada: es solo parte de la pared, el personaje no la usa.
  l.rect(puerta.x - 3, puerta.y - 3, puerta.ancho + 6, puerta.alto + 3, T.pa3);
  l.rect(puerta.x - 3, puerta.y - 3, puerta.ancho + 6, 1, T.pa3);
  l.rect(puerta.x - 3, puerta.y - 3, 1, puerta.alto + 3, T.pa2);
  l.rect(puerta.x + puerta.ancho + 2, puerta.y - 3, 1, puerta.alto + 3, T.pa1);
  l.rect(puerta.x, puerta.y, puerta.ancho, puerta.alto, T.pw2);
  l.rect(puerta.x, puerta.y, puerta.ancho, 1, T.pw3);
  l.rect(puerta.x, puerta.y, 1, puerta.alto, T.pw3);
  l.rect(puerta.x + puerta.ancho - 1, puerta.y, 1, puerta.alto, T.pw1);
  for (const [py, ph] of [[puerta.y + 5, 18], [puerta.y + 28, 20]] as const) {
    l.rect(puerta.x + 5, py, puerta.ancho - 10, ph, T.pw1);
    l.rect(puerta.x + 6, py + 1, puerta.ancho - 12, ph - 2, T.pw2);
    l.rect(puerta.x + 6, py + ph - 1, puerta.ancho - 11, 1, T.pw3);
  }
  l.rect(puerta.x + puerta.ancho - 6, puerta.y + 27, 3, 3, T.br2);
  l.px(puerta.x + puerta.ancho - 6, puerta.y + 27, T.br3);
  return l;
}

/** La puerta de madera ya abierta: se ve la luz de la oficina y la hoja casi de canto a la izquierda. */
export function puertaPasilloAbierta(): Lienzo {
  const { puerta } = GEO.pasillo;
  const W = puerta.ancho + 6;
  const H = puerta.alto + 3;
  const l = new Lienzo(W, H);
  l.rect(0, 0, W, H, T.pa3);
  l.rect(0, 0, 1, H, T.pa2);
  l.rect(W - 1, 0, 1, H, T.pa1);
  // La oficina de fondo: luz cálida que baja de intensidad hacia el piso.
  l.degradadoV(3, 3, puerta.ancho, puerta.alto, [T.br3, T.br3, T.fl3, T.fl2, T.fl2, T.fl1], { dither: true });
  // La hoja abierta, en perspectiva (angosta, con contorno).
  for (let x = 0; x < 8; x++) {
    const recorte = Math.floor(x * 0.9);
    l.rect(3 + x, 3 + recorte, 1, puerta.alto - recorte * 2 + 1, x === 0 ? T.pw3 : x < 6 ? T.pw2 : T.pw1);
  }
  l.rect(11, 3 + 8, 1, puerta.alto - 15, T.pw0);
  return l;
}

// ---------- construcción ----------

export interface ResultadoAscensor {
  piezas: ReadonlyArray<readonly [string, Lienzo]>;
  meta: Record<string, unknown>;
}

export function construirAscensor(): ResultadoAscensor {
  const piezas: ReadonlyArray<readonly [string, Lienzo]> = [
    ['ascensor-marco.png', marcoAscensor()],
    ['ascensor-hoja-izq.png', hojaAscensor('izq')],
    ['ascensor-hoja-der.png', hojaAscensor('der')],
    ['ascensor-llamada.png', llamadaAscensor()],
    ['ascensor-interior.png', interiorAscensor()],
    ['lobby-fondo.png', fondoLobby()],
    ['cabina-fondo.png', fondoCabina()],
    ['pasillo-fondo.png', fondoPasillo()],
    ['pasillo-puerta-abierta.png', puertaPasilloAbierta()],
  ];
  const meta = {
    version: 1,
    nota: 'Coordenadas en la cuadrícula de 320 x 180 (la escena la amplía 2x). El personaje mide 17 x 26 en esa cuadrícula.',
    ...GEO,
    archivos: piezas.map(([n]) => n),
  };
  return { piezas, meta };
}

function escribirSiCambio(ruta: string, contenido: Buffer): void {
  if (existsSync(ruta) && readFileSync(ruta).equals(contenido)) return;
  mkdirSync(dirname(ruta), { recursive: true });
  writeFileSync(ruta, contenido);
}

registrarConstructor('ingreso-ascensor', (ctx: ContextoConstruccion) => {
  const r = construirAscensor();
  const problemas: string[] = [];
  for (const [nombre, lienzo] of r.piezas) {
    for (const p of validarLienzo(lienzo, { paleta: coloresAscensor(), noVacio: true })) problemas.push(`[${nombre}] ${p}`);
  }
  if (problemas.length > 0) throw new Error(`El arte del ascensor no pasa la validación:\n${problemas.join('\n')}`);
  const dir = join(rutaRaiz(), DIR_INGRESO);
  for (const [nombre, lienzo] of r.piezas) escribirSiCambio(join(dir, nombre), codificarPng(lienzo));
  escribirSiCambio(join(dir, 'ingreso-ascensor-meta.json'), Buffer.from(`${jsonLegible(r.meta)}\n`, 'utf8'));
  for (const [nombre, lienzo] of r.piezas) {
    if (nombre.endsWith('-fondo.png')) ctx.guardarPng(`ingreso-${nombre.replace('.png', '')}-revision.png`, lienzo.escalar(2));
  }
  const unidad = new Lienzo(176, 70);
  const [, marco] = r.piezas[0] ?? [];
  const [, hi] = r.piezas[1] ?? [];
  const [, hd] = r.piezas[2] ?? [];
  const [, inte] = r.piezas[4] ?? [];
  if (marco && hi && hd && inte) {
    const a = GEO.marco.abertura;
    unidad.rect(0, 0, 176, 70, T.in2);
    // Cerrada, abriéndose y abierta, como la referencia de las puertas.
    [0, 9, 18].forEach((gap, i) => {
      const x0 = 2 + i * 58;
      const u = new Lienzo(56, 70);
      u.pegar(inte, a.x, a.y);
      if (gap < 18) {
        u.pegar(hi.recortar(gap, 0, 18 - gap, 46), a.x, a.y);
        u.pegar(hd.recortar(0, 0, 18 - gap, 46), a.x + 18 + gap, a.y);
      }
      u.pegar(marco, 0, 0);
      unidad.pegar(u, x0, 0);
    });
    ctx.guardarPng('ingreso-ascensor-revision-puertas.png', unidad.escalar(4));
  }
  ctx.log(`${r.piezas.length} imágenes y la meta escritas en ${DIR_INGRESO}`);
});
