/**
 * Ayudas del lote 13 (atlas `objetos-v14`): exterior y juegos. Reusa las del lote 10 (rampas, `maceta`, `abanico`, `copa`,
 * `flor`, `suelo`...) y agrega lo que piden los árboles, las piedras y las mesas de juego: matas de follaje con contorno propio,
 * pisos de pino con o sin nieve, rocas, tablones, ruedas, el tablero de una mesa y la rejilla de tipografía de píxeles.
 */

import { Lienzo } from '../nucleo';
import type { ColorEntrada } from '../nucleo';
import { poligono } from './l2b-comun';
import { rp, CM, HP, WC, WO, azar } from './l10-comun';
import type { Cuadros } from './l10-comun';

export * from './l10-comun';
export { poligono } from './l2b-comun';
export { sombraSuelo, terminar } from './l3b-comun';

export const BA = rp('baldosa');
export type { Cuadros };

/** Entero entre `a` y `b` con el generador `r`. */
export const ent = (r: () => number, a: number, b: number): number => a + Math.floor(r() * (b - a + 1));

/**
 * Mata de follaje: elipse sombreada con motas de luz y de sombra y contorno propio (`cont`), pegada sobre lo que ya hay.
 * `t` son cuatro tonos de oscuro a claro.
 */
export function mata(l: Lienzo, cx: number, cy: number, rx: number, ry: number, t: readonly ColorEntrada[], cont: ColorEntrada, semilla: number): void {
  const p = new Lienzo(l.ancho, l.alto);
  p.elipseSombreada(cx, cy, rx, ry, t, { relieve: 0.85 });
  const r = azar(semilla);
  for (let i = 0; i < Math.round((rx * ry) / 22); i++) {
    const x = Math.round(cx + (r() * 2 - 1) * rx * 0.7);
    const y = Math.round(cy + (r() * 2 - 1) * ry * 0.7);
    const luz = x < cx;
    if (p.esOpaco(x, y) && p.esOpaco(x + 1, y)) {
      p.rect(x, y, 2, 1, (luz ? t[2] : t[0]) as ColorEntrada);
      if (luz && p.esOpaco(x, y - 1)) p.px(x, y - 1, t[3] as ColorEntrada);
    }
  }
  p.contorno(cont);
  l.pegar(p, 0, 0);
}

/** Tronco recto con luz a la izquierda, sombra a la derecha y marcas de corteza. */
export function tronco(l: Lienzo, x: number, y0: number, y1: number, w: number, r: (n: number) => ColorEntrada = WO, semilla = 3): void {
  const h = y1 - y0 + 1;
  l.rect(x, y0, w, h, r(2));
  l.rect(x, y0, 2, h, r(3));
  l.rect(x + w - 2, y0, 2, h, r(1));
  const az = azar(semilla);
  for (let y = y0 + 3; y < y1 - 1; y += ent(az, 4, 7)) l.rect(x + ent(az, 1, 2), y, ent(az, 2, w - 3), 1, r(1));
  l.px(x + 2, y0 + 5, r(4));
}

/** Pasto: matitas de 2 filas alrededor de los puntos dados. */
export function pasto(l: Lienzo, puntos: ReadonlyArray<readonly [number, number]>): void {
  for (const [x, y] of puntos) {
    l.rect(x, y - 1, 1, 2, 'cesped-2');
    l.px(x + 1, y, 'cesped-3');
  }
}

/**
 * Un piso de pino: triángulo con la base festoneada, sombreado por columnas (luz a la izquierda) y rayas de ramas. Con `nieve`,
 * el borde de arriba lleva una capa blanca que sigue la pendiente. Se dibuja aparte con su contorno y se pega.
 */
export function pisoPino(l: Lienzo, cx: number, yTope: number, yBase: number, mitad: number, semilla: number, nieve = false): void {
  const p = new Lienzo(l.ancho, l.alto);
  poligono(p, [[cx, yTope], [cx + mitad, yBase - 2], [cx - mitad, yBase - 2]], HP(2));
  for (let x = cx - mitad + 2; x <= cx + mitad - 2; x += 6) p.elipse(Math.round(x), yBase - 3, 3, 3, HP(2));
  p.rect(Math.round(cx - mitad + 2), yBase - 4, Math.round(mitad * 2 - 3), 2, HP(2));
  const copia = p.copiar();
  const alto = yBase - yTope;
  const r = azar(semilla);
  for (let y = yTope; y <= yBase; y++) {
    for (let x = 0; x < l.ancho; x++) {
      if (!copia.esOpaco(x, y)) continue;
      const ancho = Math.max(2, ((y - yTope) / alto) * mitad + 1);
      const u = (x - cx) / ancho;
      const v = (y - yTope) / alto;
      const u2 = u + 0.2 * (v - 0.5);
      const damero = (x + y) % 2 === 0;
      let c: ColorEntrada = HP(2);
      if (u2 < -0.46 || (u2 < -0.34 && damero)) c = HP(3);
      if (u2 > 0.34 || (u2 > 0.22 && damero)) c = HP(1);
      if (u2 < -0.72 && v < 0.75 && y % 3 === 0) c = HP(4);
      if ((y - yTope) % 7 === 5 && (x + y * 3) % 5 < 3 && v > 0.15 && v < 0.85) c = u > 0.2 ? HP(0) : HP(1);
      if (y >= yBase - 4) c = u > 0.3 || (u > 0.15 && damero) ? HP(0) : HP(1);
      p.px(x, y, c);
    }
  }
  for (let i = 0; i < 2; i++) {
    const y = yTope + ent(r, Math.floor(alto * 0.3), Math.floor(alto * 0.7));
    const x = Math.round(cx - ((y - yTope) / alto) * mitad * 0.55) + ent(r, -2, 1);
    if (p.esOpaco(x, y)) p.px(x, y, HP(4));
  }
  if (nieve) {
    for (let x = 0; x < l.ancho; x++) {
      let y0 = -1;
      for (let y = yTope; y <= yBase - 5; y++) {
        if (copia.esOpaco(x, y)) {
          y0 = y;
          break;
        }
      }
      if (y0 < 0) continue;
      const prof = 3 + ((x * 5) % 3) + (y0 === yTope ? 2 : 0);
      for (let k = 0; k < prof; k++) {
        if (!p.esOpaco(x, y0 + k) || y0 + k > yBase - 5) break;
        p.px(x, y0 + k, x < cx - 1 ? 'neutro-7' : x > cx + mitad * 0.35 ? BA(2) : BA(3));
      }
    }
  }
  p.contorno(HP(0));
  l.pegar(p, 0, 0);
}

/** Roca redonda con volumen: tres a cuatro tonos de `cemento`, una grieta y, si se pide, musgo arriba. */
export function roca(l: Lienzo, cx: number, cy: number, rx: number, ry: number, musgo = false, tonos: readonly ColorEntrada[] = [CM(0), CM(1), CM(2), CM(3)]): void {
  l.elipseSombreada(cx, cy, rx, ry, tonos, { relieve: 0.8 });
  if (rx >= 5) {
    l.px(cx + 1, cy, CM(0));
    l.px(cx + 2, cy + 1, CM(0));
  }
  if (musgo) {
    l.rect(cx - Math.floor(rx / 2), cy - ry + 1, rx, 1, 'cesped-1');
    l.px(cx - Math.floor(rx / 2) + 1, cy - ry, 'cesped-2');
  }
}

/** Rueda de carro: llanta oscura con eje claro. */
export function rueda(l: Lienzo, cx: number, cy: number, r: number): void {
  l.elipse(cx, cy, r, r, 'neutro-1');
  l.elipse(cx, cy, Math.max(1, r - 2), Math.max(1, r - 2), 'neutro-3');
  l.px(cx, cy, 'neutro-6');
  l.px(cx - 1, cy - 1, 'neutro-5');
}

/** Tablón horizontal de madera con luz arriba y vetas. */
export function tablon(l: Lienzo, x: number, y: number, w: number, h: number, r: (n: number) => ColorEntrada = WC): void {
  l.rect(x, y, w, h, r(2));
  l.rect(x, y, w, 1, r(3));
  l.rect(x, y + h - 1, w, 1, r(1));
  l.rect(x + w - 1, y, 1, h, r(1));
}

/** Rejilla de texto: un carácter por píxel y una leyenda de colores; el espacio queda transparente. Se pega en `(x, y)`. */
export function rejilla(l: Lienzo, x: number, y: number, filas: readonly string[], leyenda: Readonly<Record<string, ColorEntrada>>): void {
  filas.forEach((fila, j) => {
    [...fila].forEach((ch, i) => {
      const c = leyenda[ch];
      if (c !== undefined) l.px(x + i, y + j, c);
    });
  });
}

/**
 * Mesa de juego de 2 casillas vista de frente y un poco desde arriba: tapa, canto y cuatro patas. Devuelve el rectángulo de la
 * tapa donde se dibuja el juego. El cuadro mide 64 de ancho y `32 + s` de alto.
 */
export function mesaDeJuego(l: Lienzo, tapa: readonly [ColorEntrada, ColorEntrada, ColorEntrada], borde: (n: number) => ColorEntrada = WO): { x: number; y: number; w: number; h: number } {
  const yb = l.alto - 4;
  const y0 = yb - 26;
  // Patas.
  for (const x of [5, 54]) {
    l.rect(x, y0 + 20, 4, 7, borde(2));
    l.rect(x, y0 + 20, 1, 7, borde(3));
    l.rect(x + 3, y0 + 20, 1, 7, borde(1));
  }
  // Canto de la mesa.
  l.rect(2, y0 + 16, 60, 4, borde(2));
  l.rect(2, y0 + 16, 60, 1, borde(3));
  l.rect(2, y0 + 19, 60, 1, borde(1));
  l.rect(61, y0 + 16, 1, 4, borde(1));
  // Tapa.
  l.rect(2, y0, 60, 16, borde(2));
  l.rect(2, y0, 60, 1, borde(3));
  l.rect(2, y0, 1, 16, borde(3));
  l.rect(61, y0, 1, 16, borde(1));
  l.rect(3, y0 + 1, 58, 14, tapa[1]);
  l.rect(3, y0 + 1, 58, 1, tapa[2]);
  l.rect(3, y0 + 14, 58, 1, tapa[0]);
  return { x: 4, y: y0 + 2, w: 56, h: 12 };
}

/** Registra un cuadro de orientación única, con las variantes recoloreadas desde `desde`. */
export { registrarR as reg } from './l10-comun';
