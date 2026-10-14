/**
 * Prendas del catálogo v5: Arriba (6), Chaqueta (5), Abajo (5) y Zapatos (4).
 *
 * Cada prenda es una función `(ctx) => relleno` que pinta con marcadores de color SOBRE las zonas del cuerpo en la pose pedida
 * (`pose.ts`, `vestir.ts`). Como trabaja sobre las zonas y no sobre filas fijas, la misma prenda sirve en las 3 vistas, en los 4 cuadros de
 * caminar y sentada. El contorno que sobresale lo agrega `conSilueta`.
 *
 * Luz: la camiseta de tirantes del diseñador ya trae la luz del cuerpo (n brillo, f base, l sombra, k borde); la prenda la hereda.
 * Slots: ropaA (cuerpo de la prenda), ropaB (cuello, puños, detalles), pantalon (abajo), zapatos.
 */

import { ANCHO } from './datos-disenador';
import { Pincel, TONO_PIEL, TONO_TANQUE, conSilueta, mk } from './vestir';
import type { Ctx, Slot } from './vestir';
import type { Capa } from './disenador';

export interface DefPrenda {
  id: string;
  nombre: string;
  capa: 'arriba' | 'chaqueta' | 'abajo' | 'zapatos';
  slots: Slot[];
  etiquetas: string[];
  /** Dibuja el relleno de la prenda (sin contorno). */
  dibujar(ctx: Ctx): Capa;
}

type Dibujo = (p: Pincel, c: Ctx) => void;
const prenda = (id: string, nombre: string, capa: DefPrenda['capa'], slots: Slot[], etiquetas: string[], f: Dibujo, sobresale = false): DefPrenda => ({
  id, nombre, capa, slots, etiquetas,
  dibujar(ctx) {
    const p = new Pincel(ctx);
    f(p, ctx);
    return sobresale ? conSilueta(ctx, p.m) : p.m;
  },
});

const S = (c: Ctx): boolean => c.vista === 'S';
const N = (c: Ctx): boolean => c.vista === 'N';
const I = (c: Ctx): boolean => c.vista === 'I';

/** Columnas del torso en frente y espalda, y la columna del centro (dos píxeles: 15 y 16). */
const TX0 = 11, TX1 = 20;

// ---------- piezas comunes ----------

/** Mangas: `largo` es cuántas filas bajan desde el hombro (o `todo`). La última fila de la manga lleva el puño. */
function mangas(p: Pincel, c: Ctx, slot: Slot, largo: number | 'todo', puno: { slot: Slot; tono: number } | null = { slot, tono: 1 }): void {
  const y0 = c.y0Torso;
  const limite = largo === 'todo' ? 99 : y0 + largo + (I(c) ? 2 : 0);
  const filas = new Map<number, number>();
  p.porZona('A', (x, y, l) => {
    if (y > limite) return;
    p.s(x, y, slot, TONO_PIEL[l] === 0 ? 1 : TONO_PIEL[l] === 1 ? 1 : TONO_PIEL[l] === 3 ? 3 : 2);
    filas.set(y, (filas.get(y) ?? 0) + 1);
  });
  if (puno && filas.size) {
    const yMax = Math.max(...filas.keys());
    p.porZona('A', (x, y) => { if (y === yMax) p.s(x, y, puno.slot, puno.tono); });
  }
  // luz en el borde de arriba del brazo (los primeros píxeles de cada fila del hombro)
  p.porZona('A', (x, y) => { if (y === y0 + 1 && p.tiene(x, y) && (x === 8 || x === 22 || I(c))) p.s(x, y, slot, 3); });
}

function torso(p: Pincel, slot: Slot): void {
  p.cubrir('T', slot);
}

/** Escote redondo: cubre el pecho y deja un hueco de piel al cuello; el borde lleva el color del cuello. */
function escoteRedondo(p: Pincel, c: Ctx, slot: Slot, cuello: { slot: Slot; tono: number }): void {
  const y0 = c.y0Torso;
  if (S(c)) {
    p.porZona('C', (x, y) => { if (!(y === y0 + 1 && x >= 14 && x <= 17)) p.s(x, y, slot, y === y0 + 1 ? 1 : 2); });
    p.h(13, 18, y0 + 2, cuello.slot, cuello.tono, true);
    p.s(13, y0 + 1, cuello.slot, cuello.tono); p.s(18, y0 + 1, cuello.slot, cuello.tono);
    p.s(12, y0 + 1, slot, 2); p.s(19, y0 + 1, slot, 2);
  } else if (N(c)) {
    p.porZona('C', (x, y) => p.s(x, y, slot, y === y0 + 1 ? cuello.tono : 2));
    p.h(13, 18, y0 + 1, cuello.slot, cuello.tono);
  } else {
    p.porZona('C', (x, y) => p.s(x, y, slot, 2));
    p.porZona('C', (x, y) => { if (x === Math.min(...[...c.z].filter(([k, z]) => z === 'C' && Math.floor(k / ANCHO) === y).map(([k]) => k % ANCHO))) p.s(x, y, cuello.slot, cuello.tono); });
  }
}

/** Dobladillo: la última fila del torso, más oscura, con costura. */
function dobladillo(p: Pincel, c: Ctx, slot: Slot, tono = 1): void {
  p.porZona('T', (x, y) => { if (y >= 53) p.s(x, y, slot, tono); });
}

// ---------------------------------------------------------------------------
// ARRIBA (6)
// ---------------------------------------------------------------------------

const camiseta = prenda('arriba-camiseta', 'Camiseta', 'arriba', ['ropaA', 'ropaB'], ['camiseta', 'basica'], (p, c) => {
  torso(p, 'ropaA');
  mangas(p, c, 'ropaA', 3);
  escoteRedondo(p, c, 'ropaA', { slot: 'ropaB', tono: 1 });
  // pliegue del pecho y costura del hombro
  if (S(c)) { p.s(13, 52, 'ropaA', 3); p.s(18, 50, 'ropaA', 1); p.s(14, 53, 'ropaA', 1); }
});

const camisa = prenda('arriba-camisa', 'Camisa de manga larga', 'arriba', ['ropaA', 'ropaB'], ['camisa', 'formal'], (p, c) => {
  torso(p, 'ropaA');
  mangas(p, c, 'ropaA', 'todo', { slot: 'ropaB', tono: 3 });
  const y0 = c.y0Torso;
  p.porZona('C', (x, y) => p.s(x, y, 'ropaA', 2));
  if (S(c)) {
    // cuello de puntas y botonadura
    p.h(12, 14, y0 + 1, 'ropaB', 3); p.h(17, 19, y0 + 1, 'ropaB', 3);
    p.s(13, y0 + 2, 'ropaB', 3); p.s(18, y0 + 2, 'ropaB', 3);
    p.s(15, y0 + 1, 'ropaB', 1); p.s(16, y0 + 1, 'ropaB', 1);
    p.v(15, y0 + 2, 54, 'ropaB', 1, true); p.v(16, y0 + 2, 54, 'ropaA', 3, true);
    for (const y of [y0 + 4, y0 + 6]) p.s(16, y, 'ropaB', 4);
    p.h(12, 14, 50, 'ropaA', 1, true); p.s(12, 51, 'ropaA', 1, ); p.s(14, 51, 'ropaA', 1);
  } else if (N(c)) {
    p.h(12, 19, y0 + 1, 'ropaB', 3);
    p.h(12, 19, y0 + 3, 'ropaA', 1, true);
    p.v(15, y0 + 4, 54, 'ropaA', 1, true);
  } else {
    p.porZona('C', (x, y) => p.s(x, y, 'ropaB', 3));
    p.porZona('T', (x, y) => { if (y >= y0 + 3 && y % 2 === 0 && p.tiene(x, y) && x === Math.min(...[...c.z].filter(([k, z]) => z === 'T' && Math.floor(k / ANCHO) === y).map(([k]) => k % ANCHO))) p.s(x, y, 'ropaB', 4); });
  }
});

const polo = prenda('arriba-polo', 'Polo', 'arriba', ['ropaA', 'ropaB'], ['polo', 'casual'], (p, c) => {
  torso(p, 'ropaA');
  mangas(p, c, 'ropaA', 3, { slot: 'ropaB', tono: 2 });
  const y0 = c.y0Torso;
  p.porZona('C', (x, y) => p.s(x, y, 'ropaA', 2));
  if (S(c)) {
    p.h(12, 14, y0 + 1, 'ropaB', 3); p.h(17, 19, y0 + 1, 'ropaB', 3);
    p.s(13, y0 + 2, 'ropaB', 2); p.s(18, y0 + 2, 'ropaB', 2);
    p.s(15, y0 + 1, 'ropaB', 1); p.s(16, y0 + 1, 'ropaB', 1);
    p.v(15, y0 + 2, y0 + 4, 'ropaB', 2); p.v(16, y0 + 2, y0 + 4, 'ropaB', 2);
    p.s(15, y0 + 3, 'ropaB', 4); p.s(16, y0 + 3, 'ropaB', 0);
  } else if (N(c)) {
    p.h(12, 19, y0 + 1, 'ropaB', 3);
  } else {
    p.porZona('C', (x, y) => p.s(x, y, 'ropaB', 3));
  }
  p.porZona('T', (x, y) => { if (y === 54) p.s(x, y, 'ropaA', 1); });
});

const buso = prenda('arriba-buso', 'Buso con capota', 'arriba', ['ropaA', 'ropaB'], ['buso', 'hoodie', 'capota'], (p, c) => {
  torso(p, 'ropaA');
  mangas(p, c, 'ropaA', 'todo', { slot: 'ropaA', tono: 0 });
  const y0 = c.y0Torso;
  p.porZona('C', (x, y) => p.s(x, y, 'ropaA', 1));
  if (S(c)) {
    // capota alrededor del cuello, cordones y bolsillo canguro
    p.h(11, 20, y0, 'ropaA', 1, true);
    p.h(12, 19, y0 + 1, 'ropaA', 1);
    p.h(14, 17, y0 + 1, 'ropaA', 0);
    p.s(13, y0 + 2, 'ropaA', 2); p.s(18, y0 + 2, 'ropaA', 2);
    p.v(13, y0 + 2, y0 + 5, 'ropaB', 3); p.v(18, y0 + 2, y0 + 5, 'ropaB', 3);
    p.s(13, y0 + 6, 'ropaB', 1); p.s(18, y0 + 6, 'ropaB', 1);
    p.h(12, 19, 52, 'ropaA', 1, true); p.s(12, 53, 'ropaA', 1); p.s(19, 53, 'ropaA', 1);
    p.s(15, 53, 'ropaA', 1); p.s(16, 53, 'ropaA', 1);
  } else if (N(c)) {
    // la capota cae sobre la espalda
    p.h(11, 20, y0, 'ropaA', 1, true);
    p.h(12, 19, y0 + 1, 'ropaA', 1);
    p.h(13, 18, y0 + 2, 'ropaA', 3);
    p.h(13, 18, y0 + 3, 'ropaA', 2);
    p.h(14, 17, y0 + 4, 'ropaA', 1);
    p.s(13, y0 + 3, 'ropaA', 1); p.s(18, y0 + 3, 'ropaA', 1);
  } else {
    p.h(0, 0, 0, 'ropaA', 0, true);
    p.porZona('N', (x, y) => p.s(x, y, 'ropaA', 1));
    p.porZona('T', (x, y) => { if (y === y0 + 1 || y === y0 + 2) p.s(x, y, 'ropaA', 1); });
    p.porZona('T', (x, y) => { if (y >= 53) p.s(x, y, 'ropaA', 1); });
  }
  p.porZona('T', (x, y) => { if (y === 54) p.s(x, y, 'ropaA', 0); });
});

const sueter = prenda('arriba-sueter', 'Suéter', 'arriba', ['ropaA', 'ropaB'], ['sueter', 'tejido', 'lana'], (p, c) => {
  torso(p, 'ropaA');
  mangas(p, c, 'ropaA', 'todo', { slot: 'ropaB', tono: 2 });
  p.porZona('C', (x, y) => p.s(x, y, 'ropaA', 2));
  // tejido: diagonales de punto claro
  for (const [k, v] of [...p.m]) {
    const x = k % ANCHO, y = Math.floor(k / ANCHO);
    if ((x + y * 2) % 4 === 0 && v === mk('ropaA', 2)) p.s(x, y, 'ropaA', 3);
    if ((x + y * 2) % 4 === 2 && v === mk('ropaA', 3)) p.s(x, y, 'ropaA', 2);
  }
  escoteRedondo(p, c, 'ropaA', { slot: 'ropaB', tono: 2 });
  // elástico del borde y de los puños
  p.porZona('T', (x, y) => { if (y >= 53) p.s(x, y, 'ropaB', x % 2 === 0 ? 1 : 2); });
});

const blusa = prenda('arriba-blusa', 'Blusa', 'arriba', ['ropaA', 'ropaB'], ['blusa', 'elegante'], (p, c) => {
  torso(p, 'ropaA');
  mangas(p, c, 'ropaA', 3, { slot: 'ropaB', tono: 3 });
  const y0 = c.y0Torso;
  p.porZona('C', (x, y) => p.s(x, y, 'ropaA', 2));
  if (S(c)) {
    // escote en V con vuelo y botones
    p.s(14, y0 + 1, 'piel', 2); p.s(15, y0 + 1, 'piel', 2); p.s(16, y0 + 1, 'piel', 2); p.s(17, y0 + 1, 'piel', 2);
    p.s(15, y0 + 2, 'piel', 2); p.s(16, y0 + 2, 'piel', 2);
    p.s(13, y0 + 1, 'ropaB', 3); p.s(18, y0 + 1, 'ropaB', 3); p.s(14, y0 + 2, 'ropaB', 3); p.s(17, y0 + 2, 'ropaB', 3);
    p.s(15, y0 + 3, 'ropaB', 3); p.s(16, y0 + 3, 'ropaB', 3);
    p.v(13, 50, 52, 'ropaA', 1, true); p.v(18, 50, 52, 'ropaA', 1, true);
  } else if (N(c)) {
    p.h(13, 18, y0 + 1, 'ropaB', 3);
    p.v(13, 50, 52, 'ropaA', 1, true); p.v(18, 50, 52, 'ropaA', 1, true);
  } else {
    p.porZona('C', (x, y) => p.s(x, y, 'ropaB', 3));
  }
  // el vuelo de la cintura (froncido) y dobladillo claro
  p.porZona('T', (x, y) => { if (y === 53 && x % 2 === 0) p.s(x, y, 'ropaA', 3); if (y === 54) p.s(x, y, 'ropaB', 3); });
});

export const ARRIBA: DefPrenda[] = [camiseta, camisa, polo, buso, sueter, blusa];

// ---------------------------------------------------------------------------
// CHAQUETA (5): capa `chaqueta`, sobre la prenda de arriba
// ---------------------------------------------------------------------------

/** Tira de la cadera: la chaqueta cubre los shorts (zona H) con el tono de la prenda. */
function faldon(p: Pincel, slot: Slot, tono: number): void {
  p.porZona('H', (x, y, l) => { if ('nflk'.includes(l)) p.s(x, y, slot, Math.min(tono, TONO_TANQUE[l]! + (tono - 2))); });
}

/**
 * Prenda larga de frente y de espalda: en cada fila de [desde, hasta] rellena todo lo que hay entre la primera y la última casilla de la cadera y las piernas
 * del cuerpo (de pie, caminando o sentado), así el espacio entre las piernas nunca deja ver el fondo. Solo pone píxeles donde la prenda aún no pintó.
 */
function cubrirEntrePiernas(p: Pincel, c: Ctx, slot: Slot, tono: number, desde: number, hasta: number): void {
  if (c.vista === 'I') return;
  for (let y = desde; y <= hasta; y++) {
    const xs = [...c.z].filter(([k, z]) => 'HP'.includes(z) && Math.floor(k / ANCHO) === y).map(([k]) => k % ANCHO);
    if (!xs.length) continue;
    for (let x = Math.min(...xs); x <= Math.max(...xs); x++) if (!p.tiene(x, y)) p.s(x, y, slot, tono);
  }
}

const blazer = prenda('chaqueta-blazer', 'Blazer abierto', 'chaqueta', ['ropaA', 'ropaB'], ['blazer', 'formal', 'saco'], (p, c) => {
  const y0 = c.y0Torso;
  p.cubrir('T', 'ropaA');
  p.cubrir('N', 'ropaA', { desplazar: -1 });
  mangas(p, c, 'ropaA', 'todo', { slot: 'ropaB', tono: 3 });
  faldon(p, 'ropaA', 2);
  p.porZona('C', (x, y) => p.s(x, y, 'ropaA', 2));
  if (S(c)) {
    // se abre el frente: queda a la vista la prenda de arriba entre las solapas
    for (let y = y0 + 1; y <= 56; y++) {
      const ancho = y <= y0 + 2 ? 1 : y <= y0 + 5 ? 2 : 3;
      for (let x = 16 - ancho; x <= 15 + ancho; x++) p.m.delete(y * ANCHO + x);
    }
    // solapas con muesca, cuello y botones
    p.s(12, y0 + 1, 'ropaB', 3); p.s(13, y0 + 1, 'ropaB', 3); p.s(13, y0 + 2, 'ropaB', 3); p.s(14, y0 + 2, 'ropaB', 2); p.s(14, y0 + 3, 'ropaB', 3);
    p.s(19, y0 + 1, 'ropaB', 3); p.s(18, y0 + 1, 'ropaB', 3); p.s(18, y0 + 2, 'ropaB', 3); p.s(17, y0 + 2, 'ropaB', 2); p.s(17, y0 + 3, 'ropaB', 3);
    p.s(14, y0 + 4, 'ropaA', 4); p.s(13, y0 + 5, 'ropaA', 3);
    p.s(17, y0 + 4, 'ropaA', 1); p.s(18, y0 + 5, 'ropaA', 1);
    p.h(12, 13, 53, 'ropaA', 1, true); p.h(18, 19, 53, 'ropaA', 1, true);
    p.s(14, 54, 'ropaB', 3); p.s(17, 54, 'ropaB', 3);
  } else if (N(c)) {
    p.s(12, y0 + 1, 'ropaB', 3); p.h(13, 18, y0 + 1, 'ropaB', 2); p.s(19, y0 + 1, 'ropaB', 3);
    p.v(15, y0 + 2, 56, 'ropaA', 1, true); p.v(16, y0 + 2, 56, 'ropaA', 3, true);
    p.h(14, 17, 56, 'ropaA', 0, true);
    p.h(11, 20, y0 + 3, 'ropaA', 3, true);
  } else {
    p.porZona('C', (x, y) => p.s(x, y, 'ropaB', 3));
    p.porZona('T', (x, y) => { if (y >= y0 + 1 && y <= y0 + 4 && p.tiene(x, y)) { const x0 = Math.min(...[...c.z].filter(([k, z]) => z === 'T' && Math.floor(k / ANCHO) === y).map(([k]) => k % ANCHO)); if (x === x0 || x === x0 + 1) p.s(x, y, 'ropaB', 3); } });
  }
});

const chaquetaZip = prenda('chaqueta-chaqueta', 'Chaqueta con cierre', 'chaqueta', ['ropaA', 'ropaB'], ['chaqueta', 'casual', 'cierre'], (p, c) => {
  const y0 = c.y0Torso;
  p.cubrir('T', 'ropaA');
  p.cubrir('N', 'ropaA', { desplazar: -1 });
  mangas(p, c, 'ropaA', 'todo', { slot: 'ropaB', tono: 1 });
  faldon(p, 'ropaA', 2);
  p.porZona('C', (x, y) => p.s(x, y, 'ropaA', 2));
  if (S(c)) {
    p.h(12, 19, y0 + 1, 'ropaB', 2); p.h(12, 13, y0, 'ropaB', 1, true); p.h(18, 19, y0, 'ropaB', 1, true);
    p.v(15, y0 + 2, 56, 'ropaB', 0); p.v(16, y0 + 2, 56, 'ropaB', 4);
    p.s(16, y0 + 2, 'ropaB', 4); p.s(15, 55, 'ropaB', 3);
    p.h(12, 14, 52, 'ropaA', 1, true); p.h(17, 19, 52, 'ropaA', 1, true);
    p.h(12, 20, 54, 'ropaB', 1, true);
  } else if (N(c)) {
    p.h(12, 19, y0 + 1, 'ropaB', 2); p.h(12, 19, y0 + 2, 'ropaA', 3);
    p.h(11, 20, y0 + 4, 'ropaA', 1, true);
    p.h(11, 20, 54, 'ropaB', 1, true);
  } else {
    p.porZona('C', (x, y) => p.s(x, y, 'ropaB', 2));
    p.porZona('T', (x, y) => { if (y >= 53) p.s(x, y, 'ropaB', 1); });
    p.porZona('T', (x, y) => { const x0 = Math.min(...[...c.z].filter(([k, z]) => z === 'T' && Math.floor(k / ANCHO) === y).map(([k]) => k % ANCHO)); if (x === x0 && y > y0 + 1) p.s(x, y, 'ropaB', 4); });
  }
});

const abrigo = prenda('chaqueta-abrigo', 'Abrigo', 'chaqueta', ['ropaA', 'ropaB'], ['abrigo', 'invierno', 'largo'], (p, c) => {
  const y0 = c.y0Torso;
  p.cubrir('T', 'ropaA', { desplazar: -1 });
  p.cubrir('N', 'ropaA', { desplazar: -1 });
  mangas(p, c, 'ropaA', 'todo', { slot: 'ropaB', tono: 1 });
  faldon(p, 'ropaA', 1);
  p.porZona('C', (x, y) => p.s(x, y, 'ropaA', 1));
  // largo hasta la rodilla: cubre los muslos y vuela un píxel por cada lado
  p.porZona('P', (x, y) => { if (y <= 58) p.s(x, y, 'ropaA', 1); });
  p.porZona('H', (x, y, _l) => p.s(x, y, 'ropaA', 2));
  if (S(c)) {
    for (const y of [56, 57, 58]) { p.s(10, y, 'ropaA', 1); p.s(21, y, 'ropaA', 1); }
    for (let x = 12; x <= 19; x++) p.s(x, 57, 'ropaA', 1);
    p.h(11, 20, 58, 'ropaA', 0);
    // solapas anchas, botones en dos filas y cinturón
    p.s(12, y0 + 1, 'ropaB', 3); p.s(13, y0 + 1, 'ropaB', 3); p.s(13, y0 + 2, 'ropaB', 3); p.s(14, y0 + 2, 'ropaB', 2); p.s(14, y0 + 3, 'ropaB', 3); p.s(14, y0 + 4, 'ropaB', 3);
    p.s(19, y0 + 1, 'ropaB', 3); p.s(18, y0 + 1, 'ropaB', 3); p.s(18, y0 + 2, 'ropaB', 3); p.s(17, y0 + 2, 'ropaB', 2); p.s(17, y0 + 3, 'ropaB', 3); p.s(17, y0 + 4, 'ropaB', 3);
    p.v(15, y0 + 2, 58, 'ropaA', 0); p.v(16, y0 + 2, 58, 'ropaA', 3);
    for (const y of [y0 + 4, y0 + 6, 54]) { p.s(14, y, 'ropaB', 4); p.s(17, y, 'ropaB', 4); }
    p.h(11, 20, 54, 'ropaB', 1, true);
  } else if (N(c)) {
    for (const y of [56, 57, 58]) { p.s(10, y, 'ropaA', 1); p.s(21, y, 'ropaA', 1); }
    for (let x = 12; x <= 19; x++) p.s(x, 57, 'ropaA', 1);
    p.h(11, 20, 58, 'ropaA', 0);
    p.h(12, 19, y0 + 1, 'ropaB', 2);
    p.v(15, y0 + 2, 58, 'ropaA', 0); p.v(16, y0 + 2, 58, 'ropaA', 3);
    p.h(11, 20, 54, 'ropaB', 1, true);
  } else {
    p.porZona('C', (x, y) => p.s(x, y, 'ropaB', 3));
    p.porZona('T', (x, y) => { if (y >= 53) p.s(x, y, 'ropaB', 1); });
    p.porZona('H', (x, y) => { if (y >= 56) p.s(x, y, 'ropaA', 1); });
  }
  cubrirEntrePiernas(p, c, 'ropaA', 1, c.p.yCadera, 58);
}, true);

const chaleco = prenda('chaqueta-chaleco', 'Chaleco', 'chaqueta', ['ropaA', 'ropaB'], ['chaleco', 'formal', 'sin mangas'], (p, c) => {
  const y0 = c.y0Torso;
  p.cubrir('T', 'ropaA');
  p.cubrir('N', 'ropaA', { desplazar: -1 });
  faldon(p, 'ropaA', 1);
  p.porZona('C', (x, y) => p.s(x, y, 'ropaA', 2));
  if (S(c)) {
    // escote en V profundo con bordes claros, botones y dos bolsillos
    for (let y = y0 + 1; y <= y0 + 6; y++) { const w = y <= y0 + 2 ? 1 : y <= y0 + 4 ? 2 : 1; for (let x = 16 - w; x <= 15 + w; x++) p.m.delete(y * ANCHO + x); }
    p.s(13, y0 + 1, 'ropaB', 3); p.s(14, y0 + 2, 'ropaB', 3); p.s(14, y0 + 3, 'ropaB', 3); p.s(15, y0 + 5, 'ropaB', 3);
    p.s(18, y0 + 1, 'ropaB', 3); p.s(17, y0 + 2, 'ropaB', 3); p.s(17, y0 + 3, 'ropaB', 3); p.s(16, y0 + 5, 'ropaB', 3);
    p.s(15, y0 + 6, 'ropaB', 4); p.s(15, y0 + 8, 'ropaB', 4);
    p.h(12, 13, 53, 'ropaA', 1, true); p.h(18, 19, 53, 'ropaA', 1, true);
  } else if (N(c)) {
    p.h(12, 19, y0 + 1, 'ropaB', 2);
    p.h(11, 20, y0 + 4, 'ropaA', 1, true);
    p.s(11, y0 + 5, 'ropaB', 3); p.s(20, y0 + 5, 'ropaB', 3);
    p.h(13, 18, 54, 'ropaB', 3, true);
  } else {
    p.porZona('C', (x, y) => p.s(x, y, 'ropaB', 3));
    p.porZona('T', (x, y) => { const x0 = Math.min(...[...c.z].filter(([k, z]) => z === 'T' && Math.floor(k / ANCHO) === y).map(([k]) => k % ANCHO)); if (x === x0 && y > y0) p.s(x, y, 'ropaB', 3); });
  }
});

const cardigan = prenda('chaqueta-cardigan', 'Cárdigan', 'chaqueta', ['ropaA', 'ropaB'], ['cardigan', 'tejido', 'abierto'], (p, c) => {
  const y0 = c.y0Torso;
  p.cubrir('T', 'ropaA');
  p.cubrir('N', 'ropaA', { desplazar: -1 });
  mangas(p, c, 'ropaA', 'todo', { slot: 'ropaB', tono: 2 });
  faldon(p, 'ropaA', 2);
  p.porZona('C', (x, y) => p.s(x, y, 'ropaA', 2));
  // punto: texturizado suave
  for (const [k, v] of [...p.m]) {
    const x = k % ANCHO, y = Math.floor(k / ANCHO);
    if ((x * 2 + y) % 4 === 0 && v === mk('ropaA', 2)) p.s(x, y, 'ropaA', 3);
  }
  if (S(c)) {
    for (let y = y0 + 1; y <= 56; y++) for (let x = 15; x <= 16; x++) p.m.delete(y * ANCHO + x);
    // canto de botones y ojales a cada lado de la abertura
    for (let y = y0 + 1; y <= 56; y++) { p.s(14, y, 'ropaB', 2); p.s(17, y, 'ropaB', 2); }
    for (const y of [y0 + 3, y0 + 5, y0 + 7]) { p.s(14, y, 'ropaB', 4); p.s(17, y, 'ropaB', 0); }
    p.h(11, 13, 53, 'ropaB', 1, true); p.h(18, 20, 53, 'ropaB', 1, true);
    p.h(12, 13, 51, 'ropaA', 1, true); p.h(18, 19, 51, 'ropaA', 1, true);
    p.h(12, 19, y0 + 1, 'ropaB', 2, true);
  } else if (N(c)) {
    p.h(12, 19, y0 + 1, 'ropaB', 2);
    p.h(11, 20, 54, 'ropaB', 1, true);
  } else {
    p.porZona('C', (x, y) => p.s(x, y, 'ropaB', 2));
    p.porZona('T', (x, y) => { if (y >= 53) p.s(x, y, 'ropaB', 1); });
  }
});

export const CHAQUETAS: DefPrenda[] = [blazer, chaquetaZip, abrigo, chaleco, cardigan];

// ---------------------------------------------------------------------------
// ABAJO (5): slot `pantalon`
// ---------------------------------------------------------------------------

/** Cubre la cadera y las piernas (sin los pies) con el color del pantalón. `hasta` limita las filas de la pierna. */
function pantalonBase(p: Pincel, c: Ctx, hasta = 99, alturaPieNegativa = 0): void {
  void alturaPieNegativa;
  p.porZona('H', (x, y, l) => p.s(x, y, 'pantalon', 'nflk'.includes(l) ? TONO_TANQUE[l]! : 2));
  p.porZona('P', (x, y, l) => { if (y <= hasta) p.s(x, y, 'pantalon', l === 'b' ? 3 : l === 'c' || l === 'i' ? 2 : l === 'm' ? 1 : 1); });
  void c;
}

const pantalon = prenda('abajo-pantalon', 'Pantalón largo', 'abajo', ['pantalon'], ['pantalon', 'largo'], (p, c) => {
  pantalonBase(p, c);
  // bota del pantalón: el borde de abajo, más oscuro
  p.porZona('P', (x, y) => { if (![...c.z].some(([k, z]) => z === 'P' && k === (y + 1) * ANCHO + x)) p.s(x, y, 'pantalon', 1); });
  p.porZona('H', (x, y) => { if (y === c.p.yCadera) p.s(x, y, 'pantalon', 1); });
}, true);

const jean = prenda('abajo-jean', 'Jean', 'abajo', ['pantalon'], ['jean', 'pantalon', 'denim'], (p, c) => {
  pantalonBase(p, c);
  // pretina con trabillas, bolsillos y costuras claras; el desgaste de la rodilla
  p.porZona('H', (x, y) => { if (y === c.p.yCadera) p.s(x, y, 'pantalon', 1); });
  if (c.vista !== 'I') {
    for (const x of [12, 19]) p.sobre(x, c.p.yCadera, 'pantalon', 0);
    p.porZona('H', (x, y) => { if (y === c.p.yCadera + 1 && (x === 12 || x === 19)) p.s(x, y, 'pantalon', 4); });
  }
  p.porZona('P', (x, y) => { if ((x + y) % 3 === 0 && y >= 58) p.s(x, y, 'pantalon', 3); });
  p.porZona('P', (x, y) => { if (![...c.z].some(([k, z]) => z === 'P' && k === (y + 1) * ANCHO + x)) p.s(x, y, 'pantalon', 3); });
}, true);

const corto = prenda('abajo-corto', 'Pantalón corto', 'abajo', ['pantalon'], ['corto', 'bermuda', 'short'], (p, c) => {
  pantalonBase(p, c, c.p.yCadera + 2);
  p.porZona('H', (x, y) => { if (y === c.p.yCadera) p.s(x, y, 'pantalon', 1); });
  // dobladillo
  const yCorte = c.p.yCadera + 2;
  p.porZona('P', (x, y) => { if (y === yCorte && p.tiene(x, y)) p.s(x, y, 'pantalon', 1); });
  p.porZona('H', (x, y) => { if (y === c.p.yCadera + 1 && x % 3 === 0) p.s(x, y, 'pantalon', 3); });
});

const falda = prenda('abajo-falda', 'Falda', 'abajo', ['pantalon'], ['falda', 'vuelo'], (p, c) => {
  // de frente y de espalda la falda es una sola pieza: tapa el espacio entre las piernas del cuerpo (columnas 14 a 17) hasta el dobladillo
  const entera = c.vista !== 'I';
  p.porZona('H', (x, y, l) => p.s(x, y, 'pantalon', entera ? (x <= 11 || x >= 20 ? 1 : l === 'n' ? 3 : 2) : 'nflk'.includes(l) ? TONO_TANQUE[l]! : 2));
  p.porZona('H', (x, y) => { if (y === c.p.yCadera) p.s(x, y, 'pantalon', 0); });
  if (entera) {
    // en cada fila de la cadera se rellena todo lo que hay entre la primera y la última casilla de la prenda (el hueco entre las piernas, de pie, caminando o sentado)
    const hs0 = [...c.z].filter(([, z]) => z === 'H').map(([k]) => ({ x: k % ANCHO, y: Math.floor(k / ANCHO) }));
    const yFin = Math.max(...hs0.map((h) => h.y));
    for (let y = c.p.yCadera; y <= yFin; y++) {
      const xs0 = hs0.filter((h) => h.y === y).map((h) => h.x);
      for (let x = Math.min(...xs0); x <= Math.max(...xs0); x++) if (!p.tiene(x, y) || y === c.p.yCadera) p.s(x, y, 'pantalon', y === c.p.yCadera ? 0 : 2);
    }
  }
  const yb = c.p.yCadera + 1;
  // vuelo: la falda baja una fila más y sale un píxel por cada lado
  const hs = [...c.z].filter(([, z]) => z === 'H').map(([k]) => ({ x: k % ANCHO, y: Math.floor(k / ANCHO) }));
  const yMax = Math.max(...hs.map((h) => h.y));
  const xs = hs.filter((h) => h.y === yMax).map((h) => h.x);
  const x0 = Math.min(...hs.map((h) => h.x)), x1 = Math.max(...hs.map((h) => h.x));
  if (c.vista !== 'I') {
    for (let x = x0 - 1; x <= x1 + 1; x++) { if (c.p.g[yMax]![x] !== undefined) p.s(x, yMax + 1, 'pantalon', 2); }
    for (let x = x0 - 2; x <= x1 + 2; x++) p.s(x, yMax + 2, 'pantalon', 1);
    p.s(x0 - 1, yMax, 'pantalon', 2); p.s(x1 + 1, yMax, 'pantalon', 2);
  } else {
    for (let x = x0 - 2; x <= x1 + 2; x++) p.s(x, yMax + 1, 'pantalon', 2);
    for (let x = x0 - 2; x <= x1 + 2; x++) p.s(x, yMax + 2, 'pantalon', 1);
  }
  // pliegues
  for (let x = x0 + 1; x <= x1; x += 3) { p.sobre(x, yb, 'pantalon', 1); p.sobre(x, yMax + 1, 'pantalon', 1); p.sobre(x - 1, yMax + 1, 'pantalon', 3); }
  void xs;
}, true);

const vestir = prenda('abajo-vestir', 'Pantalón de vestir', 'abajo', ['pantalon'], ['pantalon', 'vestir', 'formal'], (p, c) => {
  pantalonBase(p, c);
  // cinturón con hebilla y raya del pantalón
  p.porZona('H', (x, y) => { if (y === c.p.yCadera) p.s(x, y, 'pantalon', 0); });
  if (c.vista === 'S') p.sobre(15, c.p.yCadera, 'pantalon', 4);
  if (c.vista === 'S') p.sobre(16, c.p.yCadera, 'pantalon', 4);
  p.porZona('P', (x, y) => { if (y >= c.p.yCadera + 2 && p.tiene(x, y) && (x === 12 || x === 19)) p.s(x, y, 'pantalon', 4); });
  p.porZona('P', (x, y) => { if (![...c.z].some(([k, z]) => z === 'P' && k === (y + 1) * ANCHO + x)) p.s(x, y, 'pantalon', 1); });
}, true);

export const ABAJO: DefPrenda[] = [pantalon, jean, corto, falda, vestir];

// ---------------------------------------------------------------------------
// ZAPATOS (4): slot `zapatos`
// ---------------------------------------------------------------------------

const tenis = prenda('zapatos-tenis', 'Tenis', 'zapatos', ['zapatos'], ['tenis', 'deportivo'], (p, c) => {
  p.porZona('F', (x, y) => p.s(x, y, 'zapatos', 2));
  // suela clara en la última fila de cada pie, puntera y cordones
  const filas = new Map<string, number>();
  p.porZona('F', (x, y) => { const cl = I(c) ? 'm' : x < 16 ? 'i' : 'd'; filas.set(cl, Math.max(filas.get(cl) ?? 0, y)); });
  p.porZona('F', (x, y) => {
    const cl = I(c) ? 'm' : x < 16 ? 'i' : 'd';
    if (y === filas.get(cl)) p.s(x, y, 'zapatos', 4);
    else if ((x + y) % 2 === 0) p.s(x, y, 'zapatos', 3);
  });
});

const botas = prenda('zapatos-botas', 'Botas', 'zapatos', ['zapatos'], ['botas', 'cuero'], (p, c) => {
  // caña: la botas sube una fila sobre el pie
  p.porZona('F', (x, y) => p.s(x, y, 'zapatos', 2));
  const filaPie = new Set<number>();
  for (const [k, z] of c.z) if (z === 'F') filaPie.add(Math.floor(k / ANCHO));
  p.porZona('P', (x, y) => { if (c.z.get((y + 1) * ANCHO + x) === 'F') { p.s(x, y, 'zapatos', 1); } });
  p.porZona('P', (x, y) => { if (c.z.get((y + 1) * ANCHO + x) === 'F' && (x + y) % 2 === 0) p.s(x, y, 'zapatos', 3); });
  p.porZona('F', (x, y) => { if (!c.z.has((y + 1) * ANCHO + x) || c.z.get((y + 1) * ANCHO + x) !== 'F') p.s(x, y, 'zapatos', 0); });
  p.porZona('F', (x, y) => { if (c.z.get((y - 1) * ANCHO + x) === 'P' || ((x + y) % 4 === 0)) p.s(x, y, 'zapatos', 3); });
});

const zapatoVestir = prenda('zapatos-formales', 'Zapatos de vestir', 'zapatos', ['zapatos'], ['formal', 'zapatos', 'vestir'], (p, c) => {
  p.porZona('F', (x, y) => p.s(x, y, 'zapatos', 1));
  p.porZona('F', (x, y) => { if (c.z.get((y - 1) * ANCHO + x) !== 'F') p.s(x, y, 'zapatos', 2); });
  p.porZona('F', (x, y) => { if (c.z.get((y - 1) * ANCHO + x) !== 'F' && (x % 3 === 0 || I(c))) p.s(x, y, 'zapatos', 4); });
  p.porZona('F', (x, y) => { if (!c.z.has((y + 1) * ANCHO + x) || c.z.get((y + 1) * ANCHO + x) !== 'F') p.s(x, y, 'zapatos', 0); });
});

const sandalias = prenda('zapatos-sandalias', 'Sandalias', 'zapatos', ['zapatos'], ['sandalias', 'verano'], (p, c) => {
  // el pie queda a la vista: solo suela y tiras
  p.porZona('F', (x, y) => { if (!c.z.has((y + 1) * ANCHO + x) || c.z.get((y + 1) * ANCHO + x) !== 'F') p.s(x, y, 'zapatos', 1); });
  p.porZona('F', (x, y) => { if (c.z.get((y + 1) * ANCHO + x) === 'F' && ((x + y) % 2 === 0)) p.s(x, y, 'zapatos', 3); });
  p.porZona('P', (x, y) => { if (c.z.get((y + 1) * ANCHO + x) === 'F' && x % 2 === 0) p.s(x, y, 'zapatos', 3); });
});

export const ZAPATOS: DefPrenda[] = [tenis, botas, zapatoVestir, sandalias];

export const PRENDAS: DefPrenda[] = [...ARRIBA, ...CHAQUETAS, ...ABAJO, ...ZAPATOS];
