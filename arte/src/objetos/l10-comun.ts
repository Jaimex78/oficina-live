/**
 * Ayudas del lote 10 (atlas `objetos-v11`): decoración dibujada a mano, pieza por pieza, con el acabado de Gather v2
 * (contorno azul marino de 1 px, luz arriba a la izquierda, 2 a 4 tonos por material, sombra de dos tonos).
 *
 * Reglas de lienzo (casilla de 32 px): el dibujo se apoya en `pie(l)` (última fila de un objeto de piso, deja 3 filas para
 * contorno y sombra) o en `pieA(s)` (última fila de lo apoyado en un escritorio, como los accesorios del lote 8). Todo se
 * centra en `CX`: el cuerpo cabe entre x = 2 y x = 28.
 *
 * Variantes: se recolorea solo el material principal (`registrarR` de `l9-comun.ts`); el contorno no cambia.
 */

import { Lienzo, rampa } from '../nucleo';
import type { ColorEntrada } from '../nucleo';
import { cerrarApoyado, cerrarSuelo } from './l4-comun';
import type { Cuadros } from './l4-comun';

export { cerrarApoyado, cerrarSuelo };
export type { Cuadros };
export { registrarR, recolorear9 } from './l9-comun';
export { azar } from './l2b-comun';

export const CX = 15;

/** Rampa de la paleta como función `n -> nombre de color`. */
export const rp =
  (nombre: string) =>
  (n: number): ColorEntrada =>
    `${nombre}-${n}`;

export const PL = rp('planta');
export const HP = rp('hoja-pastel');
export const CE = rp('cesped');
export const MC = rp('maceta-terracota');
export const NE = rp('neutro');
export const ME = rp('metal');
export const VI = rp('vidrio');
export const TC = rp('tela-calida');
export const NA = rp('naranja');
export const RS = rp('rojo-suave');
export const RO = rp('rojo');
export const MO = rp('morado');
export const LA = rp('lavanda');
export const CU = rp('cuero');
export const CR = rp('crema');
export const WO = rp('madera-oscura');
export const WC = rp('madera-clara');
export const AZ = rp('azul-oficina');
export const BG = rp('baldosa-gris');
export const CM = rp('cemento');
export const TG = rp('tela-gris');
export const PZ = rp('pizarra');
export const PC = rp('pared-calida');
export const LC = rp('ladrillo-crema');

/** Tonos de una rampa, de `a` a `b` incluidos, como nombres de color (de oscuro a claro). */
export const tn = (nombre: string, a: number, b: number): ColorEntrada[] => {
  const r: ColorEntrada[] = [];
  for (let i = a; i <= b; i++) r.push(`${nombre}-${i}`);
  return r;
};

export const HOJA = tn('planta', 1, 4);
export const HOJA_PASTEL = tn('hoja-pastel', 1, 4);
export const HOJA_OSCURA = tn('planta', 0, 3);

/** Hex de una rampa (para recolorear variantes). */
export const hex = (nombre: string, a = 0, b?: number): readonly string[] => rampa(nombre).slice(a, b);

/** Lienzo de `ancho x alto` casillas con `s` filas que sobresalen. */
export const nuevo = (s: number, ancho = 1, alto = 1): Lienzo => new Lienzo(ancho * 32, alto * 32 + s);

/** Última fila del cuerpo de un objeto de piso. */
export const pie = (l: Lienzo): number => l.alto - 4;
/** Última fila del cuerpo de lo apoyado, en un cuadro que sobresale `s`. */
export const pieA = (s: number): number => s + 14;

/** Cierra un objeto de piso con contorno y sombra; `ancho` es el semiancho de la mancha de contacto bajo la base. */
export const suelo = (l: Lienzo, cx = CX, yb = l.alto - 4, rx = 7): Lienzo => cerrarSuelo(l, { contacto: [cx, yb - 1, rx, 1] });
/** Cierra un objeto de piso sin mancha de contacto. */
export const sueloLibre = (l: Lienzo): Lienzo => cerrarSuelo(l);
export const apoyado = (l: Lienzo): Lienzo => cerrarApoyado(l);

// ---------------------------------------------------------------------------
// Piezas que se repiten
// ---------------------------------------------------------------------------

/** Maceta de barro: aro de 3 filas y cuerpo que se angosta hacia abajo. Devuelve la fila de arriba del aro. */
export function maceta(l: Lienzo, cx: number, yb: number, w: number, h: number, r: (n: number) => ColorEntrada = MC, taper = 3): number {
  const top = yb - h + 1;
  for (let i = 0; i < h; i++) {
    const ww = w - Math.round((taper * i) / Math.max(1, h - 1));
    const x0 = cx - Math.floor(ww / 2);
    l.rect(x0, top + i, ww, 1, r(2));
    l.px(x0, top + i, r(3));
    l.px(x0 + ww - 1, top + i, r(1));
    if (ww > 6) l.px(x0 + ww - 2, top + i, r(1));
    if (i === h - 1) l.rect(x0, top + i, ww, 1, r(1));
  }
  const rw = w + 2;
  const rx = cx - Math.floor(rw / 2);
  l.rect(rx, top - 2, rw, 3, r(3));
  l.rect(rx, top, rw, 1, r(2));
  l.px(rx + rw - 1, top - 2, r(2));
  l.px(rx + rw - 1, top - 1, r(2));
  l.rect(rx + 1, top - 2, Math.max(1, rw - 3), 1, r(3));
  return top - 2;
}

/** Tierra visible sobre el aro de una maceta. */
export const tierra = (l: Lienzo, cx: number, y: number, w: number): void => {
  l.rect(cx - Math.floor(w / 2), y, w, 1, WO(1));
};

/** Abanico de hojas desde `(bx, by)`: `n` hojas entre los ángulos `a0` y `a1` (grados desde la vertical, positivo a la derecha). */
export function abanico(l: Lienzo, bx: number, by: number, n: number, largo: number, ancho: number, a0: number, a1: number, tonos: readonly ColorEntrada[] = HOJA, caida = 0.2): void {
  const lista: { f: number; ang: number }[] = [];
  for (let i = 0; i < n; i++) {
    const f = n === 1 ? 0.5 : i / (n - 1);
    lista.push({ f, ang: a0 + (a1 - a0) * f });
  }
  // Primero las de los lados, al final la del centro.
  lista.sort((p, q) => Math.abs(q.f - 0.5) - Math.abs(p.f - 0.5));
  for (const { f, ang } of lista) {
    const rad = (ang * Math.PI) / 180;
    const len = largo * (1 - caida * Math.abs(f - 0.5) * 2);
    l.hoja([bx, by], [Math.round(bx + Math.sin(rad) * len), Math.round(by - Math.cos(rad) * len)], ancho, tonos);
  }
}

/** Racimo de bolas de follaje: cada una `[dx, dy, radio]` respecto de `(cx, cy)`. De atrás hacia adelante. */
export function copa(l: Lienzo, cx: number, cy: number, bolas: readonly (readonly [number, number, number])[], tonos: readonly ColorEntrada[] = HOJA): void {
  for (const [dx, dy, r] of bolas) l.elipseSombreada(cx + dx, cy + dy, r, Math.max(2, Math.round(r * 0.9)), tonos);
}

/** Tallo vertical o inclinado de 1 px (o 2). */
export function tallo(l: Lienzo, x0: number, y0: number, x1: number, y1: number, color: ColorEntrada = PL(2), grueso = false): void {
  l.linea(x0, y0, x1, y1, color);
  if (grueso) l.linea(x0 + 1, y0, x1 + 1, y1, PL(1));
}

/** Flor de 5 px (cruz) con centro; `p` es la rampa de pétalos (n -> color) y `c` el centro. */
export function flor(l: Lienzo, x: number, y: number, p: (n: number) => ColorEntrada = RS, c: ColorEntrada = TC(3)): void {
  l.px(x - 1, y, p(3));
  l.px(x + 1, y, p(2));
  l.px(x, y - 1, p(4));
  l.px(x, y + 1, p(2));
  l.px(x, y, c);
}

/** Flor de 3 x 3 con esquinas: más grande. */
export function florGrande(l: Lienzo, x: number, y: number, p: (n: number) => ColorEntrada = RS, c: ColorEntrada = TC(3)): void {
  l.rect(x - 1, y - 1, 3, 3, p(3));
  l.px(x - 1, y - 1, p(4));
  l.px(x + 1, y + 1, p(2));
  l.px(x, y, c);
  l.px(x, y - 2, p(3));
  l.px(x - 2, y, p(3));
  l.px(x + 2, y, p(2));
  l.px(x, y + 2, p(2));
}

/** Elipse sombreada con tres tonos `[sombra, medio, luz]` de una rampa. */
export function bola(l: Lienzo, cx: number, cy: number, rx: number, ry: number, tonos: readonly ColorEntrada[]): void {
  l.elipseSombreada(cx, cy, rx, ry, tonos);
}

/** Bloque vertical de luz a la izquierda y sombra a la derecha, con tapa más clara. */
export function bloque(l: Lienzo, x: number, y: number, w: number, h: number, r: (n: number) => ColorEntrada, tapa = true): void {
  l.rect(x, y, w, h, r(2));
  l.rect(x, y, 1, h, r(3));
  l.rect(x + w - 1, y, 1, h, r(1));
  if (w > 4) l.rect(x + w - 2, y, 1, h, r(1));
  l.rect(x, y + h - 1, w, 1, r(1));
  if (tapa) l.rect(x, y, w, 1, r(3));
}

/** Llama de vela: gota amarilla con corazón claro. `(x, y)` es la punta de abajo. */
export function llama(l: Lienzo, x: number, y: number): void {
  l.px(x, y, TC(2));
  l.px(x, y - 1, TC(3));
  l.px(x, y - 2, CR(4));
  l.px(x, y - 3, TC(3));
}

/** Vela: cuerpo crema de `h` filas, `w` de ancho, con llama encima. */
export function vela(l: Lienzo, x: number, yb: number, w: number, h: number): void {
  l.rect(x, yb - h + 1, w, h, CR(4));
  l.rect(x, yb - h + 1, 1, h, 'neutro-7');
  l.rect(x + w - 1, yb - h + 1, 1, h, CR(2));
  llama(l, x + Math.floor(w / 2), yb - h);
}

/** Papel con renglones: hoja blanca de `w x h` con líneas. */
export function hojaPapel(l: Lienzo, x: number, y: number, w: number, h: number, lineas = true): void {
  l.rect(x, y, w, h, 'neutro-7');
  l.rect(x + w - 1, y, 1, h, 'neutro-5');
  l.rect(x, y + h - 1, w, 1, 'neutro-5');
  if (lineas) for (let j = y + 2; j < y + h - 2; j += 2) l.rect(x + 1, j, Math.max(1, w - 4), 1, 'neutro-4');
}

/** Arco de píxeles entre dos puntos pasando por la altura `alto` (curva simple). Para asas y aros. */
export function arco(l: Lienzo, x0: number, y0: number, x1: number, y1: number, alto: number, color: ColorEntrada): void {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2 + 2;
  let px = x0;
  let py = y0;
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    const x = Math.round(x0 + (x1 - x0) * t);
    const y = Math.round(y0 + (y1 - y0) * t - Math.sin(Math.PI * t) * alto);
    l.linea(px, py, x, y, color);
    px = x;
    py = y;
  }
}
