/**
 * Ayudas del lote 11 (atlas `objetos-v12`): comida y bebida dibujada en cuadrícula de texto, un carácter por píxel, con el
 * acabado de Gather v2 (contorno azul marino de 1 px, luz arriba a la izquierda, 2 a 4 tonos por material).
 *
 * `spr(id, filas, local?)` crea el cuadro de `id` (el alto sale de `sobresale` en el inventario), centra la cuadrícula en la
 * casilla, la apoya en la fila `pieA(s)` y cierra con contorno y sombra. Los renglones más cortos se completan con vacío.
 * Variantes: `registrarR` recolorea la rampa que se pasa en `desde`; cada dibujo usa UNA sola rampa en el material que cambia.
 */

import { Lienzo } from '../nucleo';
import type { ColorEntrada } from '../nucleo';
import { objetoPorId } from '@ol/shared';
import { apoyado, hex, pieA, registrarR, suelo } from './l10-comun';
import type { Cuadros } from './l10-comun';

export { apoyado, hex, pieA, registrarR, suelo };
export type { Cuadros };

/** Letra a color. Minúsculas y mayúsculas siguen el orden de cada rampa, del más claro al más oscuro. */
export const PAL: Readonly<Record<string, ColorEntrada>> = {
  // neutro 7..1 y negro tinta
  w: 'neutro-7', l: 'neutro-6', g: 'neutro-5', m: 'neutro-4', d: 'neutro-3', K: 'neutro-2', k: 'neutro-1', '@': 'neutro-0',
  // metal 3..0
  A: 'metal-3', B: 'metal-2', C: 'metal-1', D: 'metal-0',
  // vidrio 3..0
  e: 'vidrio-3', v: 'vidrio-2', u: 'vidrio-1', U: 'vidrio-0',
  // tela cálida (amarillos y dorados) 3..0
  Y: 'tela-calida-3', y: 'tela-calida-2', j: 'tela-calida-1', J: 'tela-calida-0',
  // madera clara (pan y masa) 4..0
  p: 'madera-clara-4', b: 'madera-clara-3', n: 'madera-clara-2', N: 'madera-clara-1', M: 'madera-clara-0',
  // madera oscura (café, chocolate, carne) 4..0
  o: 'madera-oscura-4', O: 'madera-oscura-3', q: 'madera-oscura-2', Q: 'madera-oscura-1', X: 'madera-oscura-0',
  // planta (verdes) 4..0
  G: 'planta-4', h: 'planta-3', H: 'planta-2', F: 'planta-1', E: 'planta-0',
  // rojo suave (tomate, fresa, glaseado) 4..0
  z: 'rojo-suave-4', r: 'rojo-suave-3', t: 'rojo-suave-2', T: 'rojo-suave-1', Z: 'rojo-suave-0',
  // naranja 4..0
  a: 'naranja-4', c: 'naranja-3', f: 'naranja-2', i: 'naranja-1', I: 'naranja-0',
  // crema 4..0
  W: 'crema-4', V: 'crema-3', S: 'crema-2', s: 'crema-1', $: 'crema-0',
  // morado 4..0
  '4': 'morado-4', P: 'morado-3', L: 'morado-2', '5': 'morado-1', '6': 'morado-0',
  // rojo de marca 4..0
  '1': 'rojo-4', '2': 'rojo-3', '3': 'rojo-2', '7': 'rojo-1', '8': 'rojo-0',
  // hoja pastel 4..1
  '9': 'hoja-pastel-4', '0': 'hoja-pastel-3', '!': 'hoja-pastel-2', '?': 'hoja-pastel-1',
  // cuero 4..1
  '+': 'cuero-4', '*': 'cuero-3', '=': 'cuero-2', '-': 'cuero-1',
  // tela gris 3..0
  '%': 'tela-gris-3', '&': 'tela-gris-2', '/': 'tela-gris-1', '#': 'tela-gris-0',
};

/** Pone una cuadrícula de texto en `(x0, y0)`: `.` y espacio son vacío. */
export function pintar(l: Lienzo, x0: number, y0: number, filas: readonly string[], local: Readonly<Record<string, ColorEntrada>> = {}): void {
  filas.forEach((fila, j) => {
    [...fila].forEach((ch, i) => {
      if (ch === '.' || ch === ' ') return;
      const color = local[ch] ?? PAL[ch];
      if (color === undefined) throw new Error(`Carácter "${ch}" sin color en la fila ${j}: ${fila}`);
      l.px(x0 + i, y0 + j, color);
    });
  });
}

/** Un cuadro de comida o bebida apoyado: cuadrícula centrada en la casilla con su base en la fila `pieA(s)`. */
export function spr(id: string, filas: readonly string[], local: Readonly<Record<string, ColorEntrada>> = {}, dx = 0, extra?: (l: Lienzo, fb: number, x0: number) => void): Lienzo {
  const o = objetoPorId(id);
  if (o === undefined) throw new Error(`[${id}] no existe en el inventario.`);
  const s = o.sobresale;
  const l = new Lienzo(32, 32 + s);
  const ancho = Math.max(...filas.map((f) => f.length));
  const fb = pieA(s);
  const y0 = fb - filas.length + 1;
  if (y0 < 1) throw new Error(`[${id}] la cuadrícula (${filas.length} filas) no cabe con sobresale ${s}: máximo ${s + 14} filas.`);
  const x0 = Math.floor((32 - ancho) / 2) + dx;
  pintar(l, x0, y0, filas, local);
  extra?.(l, fb, x0);
  return o.apoyado === true ? apoyado(l) : suelo(l, 15, fb + 1, Math.min(8, Math.floor(ancho / 2)));
}

export type Hacer = () => Lienzo;
export type Fila = readonly [id: string, hacer: Hacer, desde?: readonly string[]];

/** Registra una tabla de dibujos `[id, función, rampa de origen]`. */
export function registrarTabla(c: Cuadros, tabla: readonly Fila[]): Cuadros {
  for (const [id, hacer, desde] of tabla) registrarR(c, id, 'U', hacer(), desde);
  return c;
}

/** Un cuadro dibujado con funciones: `dibujar(l, fb)` recibe el lienzo y la fila de la base. Cierra igual que `spr`. */
export function dib(id: string, dibujar: (l: Lienzo, fb: number) => void): Lienzo {
  const o = objetoPorId(id);
  if (o === undefined) throw new Error(`[${id}] no existe en el inventario.`);
  const l = new Lienzo(32, 32 + o.sobresale);
  const fb = pieA(o.sobresale);
  dibujar(l, fb);
  return o.apoyado === true ? apoyado(l) : suelo(l, 15, fb + 1, 7);
}

/** Tonos de una rampa de `a` a `b` como lista de nombres (de oscuro a claro). */
export const tonosDe = (nombre: string, a: number, b: number): ColorEntrada[] => {
  const r: ColorEntrada[] = [];
  for (let i = a; i <= b; i++) r.push(`${nombre}-${i}`);
  return r;
};

/**
 * Taza o vaso de pared recta: `x` es la columna de la izquierda, `fb` la fila de la base, `c` son los cuatro colores
 * `[luz, medio, sombra, base]`. Con `asa` suma el asa de 2 px a la derecha; `boca` pinta el líquido en la primera fila.
 */
export function taza(l: Lienzo, x: number, fb: number, w: number, h: number, c: readonly [ColorEntrada, ColorEntrada, ColorEntrada, ColorEntrada], asa = true, boca?: ColorEntrada): void {
  const y = fb - h + 1;
  l.rect(x, y, w, h, c[1]);
  l.rect(x, y, 1, h, c[0]);
  l.rect(x + w - 1, y, 1, h, c[2]);
  l.rect(x, fb, w, 1, c[3]);
  if (boca !== undefined) l.rect(x + 1, y, w - 2, 1, boca);
  if (asa) {
    l.px(x + w, y + 1, c[1]);
    l.px(x + w + 1, y + 2, c[2]);
    for (let j = 3; j < h - 2; j++) l.px(x + w + 1, y + j, c[2]);
    l.px(x + w, y + h - 3, c[2]);
  }
}

/** Plato hondo visto de arriba y de frente: elipse blanca con borde. */
export function plato(l: Lienzo, cx: number, fb: number, rx: number, ry = 3): void {
  l.elipseSombreada(cx, fb - ry + 1, rx, ry, tonosDe('neutro', 4, 7));
  l.elipse(cx, fb - ry, Math.max(2, rx - 2), Math.max(1, ry - 2), 'neutro-6');
}

/** Cuenco: media elipse de alto `h` con boca elíptica; `fuera` y `dentro` son listas de tonos de oscuro a claro. */
export function cuenco(l: Lienzo, cx: number, fb: number, rx: number, h: number, fuera: readonly ColorEntrada[], dentro: ColorEntrada): void {
  const ry = Math.max(2, Math.floor(rx / 3));
  for (let j = 0; j < h; j++) {
    const t = j / Math.max(1, h - 1);
    const ancho = Math.round(rx * (1 - 0.35 * t));
    const y = fb - h + 1 + j;
    l.rect(cx - ancho, y, ancho * 2 + 1, 1, fuera[Math.min(fuera.length - 1, 1)] as ColorEntrada);
    l.px(cx - ancho, y, fuera[fuera.length - 1] as ColorEntrada);
    l.px(cx + ancho, y, fuera[0] as ColorEntrada);
    if (j === h - 1) l.rect(cx - ancho, y, ancho * 2 + 1, 1, fuera[0] as ColorEntrada);
  }
  l.elipseSombreada(cx, fb - h + 1, rx, ry, [fuera[0] as ColorEntrada, fuera[Math.min(2, fuera.length - 1)] as ColorEntrada, fuera[fuera.length - 1] as ColorEntrada]);
  l.elipse(cx, fb - h + 1, rx - 1, Math.max(1, ry - 1), dentro);
}
