/**
 * Ayudas del lote 6 (las fiestas del año, atlas `objetos-v7`).
 *
 * Reúne lo que ya fijaron los lotes anteriores (sombras bien hechas del lote 4, ayudas del 2B) y suma lo que piden las
 * fiestas: trazos con grosor que cambia (ramas, escobas), sombreado automático por bordes, placas delgadas para lo que
 * cuelga de paredes verticales y una cuadrícula de texto corta.
 *
 * Sombras (bien hechas, nunca en negro duro):
 *  - Piso: abajo a la derecha en dos tonos sólidos (`azul-oficina-2` y `azul-oficina-3`), nunca negro, y una mancha de
 *    contacto bajo la base de lo alto (`cerrarSuelo`).
 *  - Apoyado en una mesa: reborde de 1 px (`cerrarApoyado`).
 *  - Colgado de una pared: sombra de 1 px sobre ella (`cerrarColgante`).
 *  - En el aire (capa `sobre`): sin sombra (`cerrarSinSombra`).
 */

import { Lienzo } from '../nucleo';
import type { ColorEntrada } from '../nucleo';
import { B, CONTORNO, SOMBRA_CERCA, SOMBRA_LEJOS, cerrarApoyado, cerrarColgado, cerrarSinSombra, cerrarSuelo, enElipse, registrar, registrarVariantes, tonos, volumen } from './l4-comun';
import type { Cuadros } from './l4-comun';
import { aUnSoloColor, azar, entre, poligono } from './l2b-comun';

export { B, CONTORNO, SOMBRA_CERCA, SOMBRA_LEJOS, cerrarApoyado, cerrarColgado as cerrarColgante, cerrarSinSombra, cerrarSuelo, enElipse, registrar, registrarVariantes, tonos, volumen, aUnSoloColor, azar, entre, poligono };
export type { Cuadros };

/** Atajo: lienzo desde una cuadrícula de texto (`.` es transparente). */
export function cuadricula(lineas: readonly string[], leyenda: Readonly<Record<string, ColorEntrada>>): Lienzo {
  return Lienzo.desdeTexto(lineas, leyenda);
}

/** Disco relleno de diámetro `2 * r + 1`. */
export function disco(l: Lienzo, cx: number, cy: number, r: number, color: ColorEntrada): Lienzo {
  return l.elipse(cx, cy, r, r, color);
}

/**
 * Trazo con grosor que cambia de `w0` a `w1` píxeles (ramas, mangos, hilos gruesos). Estampa elipses a lo largo de la
 * línea, así los empalmes quedan redondos. Todo en un solo color: el sombreado se da después con `sombrearBordes`.
 */
export function trazo(l: Lienzo, x0: number, y0: number, x1: number, y1: number, w0: number, w1: number, color: ColorEntrada): Lienzo {
  const pasos = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 1.5));
  for (let i = 0; i <= pasos; i++) {
    const t = i / pasos;
    const w = w0 + (w1 - w0) * t;
    const r = Math.max(0, (w - 1) / 2);
    l.elipse(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, r, r, color);
  }
  return l;
}

/**
 * Sombreado de bordes para siluetas finas y largas: dentro de las filas `[y0, y1]`, los píxeles de `medio` que tienen
 * vacío (o de otro tono) a la izquierda pasan a `luz`, y los que lo tienen a la derecha o abajo pasan a `sombra`.
 * Es la luz de arriba a la izquierda aplicada a ramas, troncos y mangos.
 */
export function sombrearBordes(l: Lienzo, medio: ColorEntrada, luz: ColorEntrada, sombra: ColorEntrada, y0 = 0, y1 = l.alto - 1, grosor = 1): Lienzo {
  const mHex = l.copiar();
  const base = new Lienzo(1, 1).px(0, 0, medio).leerHex(0, 0);
  const esMedio = (x: number, y: number): boolean => mHex.leerHex(x, y) === base;
  for (let y = y0; y <= y1; y++) {
    for (let x = 0; x < l.ancho; x++) {
      if (!esMedio(x, y)) continue;
      let izq = false;
      let der = false;
      for (let k = 1; k <= grosor; k++) {
        if (!esMedio(x - k, y)) izq = true;
        if (!esMedio(x + k, y)) der = true;
      }
      if (der) l.px(x, y, sombra);
      else if (izq) l.px(x, y, luz);
    }
  }
  return l;
}

/** Los tonos de hueso: crema cálida, de la sombra a la luz. */
export const HUESO = ['crema-1', 'crema-2', 'crema-3', 'crema-4'] as const;

/** Donde queda la franja de la tapa de una pared vertical dentro de un cuadro de 32 px de ancho (columnas 11 a 20). */
export const FRANJA_TAPA = { desde: 11, hasta: 20 } as const;

/**
 * Placa delgada pegada a la tapa de una pared vertical (orientaciones `E` y `O` de lo colgado): en `E` queda a la
 * derecha de la franja (desde la columna 21) y en `O` a la izquierda (termina en la columna 10). Las paredes verticales
 * solo muestran la franja de la tapa, así que lo colgado ahí es una tira de `ancho` px que se ve de canto.
 * `pintar(i, j)` da el color de la columna `i` (0 junto a la pared) y la fila `j` (0 arriba) de la placa.
 */
export function placaLateral(
  l: Lienzo,
  lado: 'E' | 'O',
  y0: number,
  alto: number,
  ancho: number,
  pintar: (i: number, j: number) => ColorEntrada | null,
): Lienzo {
  for (let i = 0; i < ancho; i++) {
    const x = lado === 'E' ? 21 + i : 10 - i;
    for (let j = 0; j < alto; j++) {
      const c = pintar(i, j);
      if (c !== null) l.px(x, y0 + j, c);
    }
  }
  return l;
}

/** Fila de píxeles con un patrón repetido (`patron` es una lista de colores). Útil para rayas y tramas de tela. */
export function fila(l: Lienzo, x: number, y: number, largo: number, patron: readonly ColorEntrada[]): Lienzo {
  for (let i = 0; i < largo; i++) l.px(x + i, y, patron[i % patron.length] as ColorEntrada);
  return l;
}

/** Pone un píxel solo si cae sobre algo ya dibujado (para brillos y detalles que no deben salirse de la silueta). */
export function pxSobre(l: Lienzo, x: number, y: number, color: ColorEntrada): Lienzo {
  if (l.esOpaco(x, y)) l.px(x, y, color);
  return l;
}

/** Borra un píxel (esquina o muesca). */
export function quitar(l: Lienzo, ...puntos: ReadonlyArray<readonly [number, number]>): Lienzo {
  for (const [x, y] of puntos) l.px(x, y, null);
  return l;
}

/**
 * Dibuja una pieza en un lienzo aparte, le pone su propio contorno (`borde`) y la pega. Así las piezas que se
 * amontonan (dulces, huevos, hojas) se separan unas de otras como en las plantas del lote 4.
 */
export function conBorde(l: Lienzo, borde: ColorEntrada, dibujar: (pieza: Lienzo) => void, opciones: { diagonales?: boolean } = {}): Lienzo {
  const pieza = new Lienzo(l.ancho, l.alto);
  dibujar(pieza);
  pieza.contorno(borde, opciones.diagonales ? { diagonales: true } : {});
  return l.pegar(pieza, 0, 0);
}

/** Corrida horizontal de un hueco: `[y, x0, x1]` (extremos incluidos). */
export type Corrida = readonly [number, number, number];

/**
 * Hueco luminoso tallado (calabaza, caldero): un reborde oscuro sobre lo ya dibujado y dentro, luz cálida con el anillo
 * en un tono más bajo y el centro en el más claro. Lo que emite luz lleva los tonos más claros y saturados.
 */
export function huecoLuminoso(
  l: Lienzo,
  corridas: readonly Corrida[],
  colores: { reborde: ColorEntrada; anillo: ColorEntrada; interior: ColorEntrada; centro?: ColorEntrada },
): Lienzo {
  const set = new Set<string>();
  for (const [y, x0, x1] of corridas) for (let x = x0; x <= x1; x++) set.add(`${x},${y}`);
  const dentro = (x: number, y: number): boolean => set.has(`${x},${y}`);
  for (const [y, x0, x1] of corridas) {
    for (let x = x0 - 1; x <= x1 + 1; x++) {
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const px = x + dx;
        const py = y + dy;
        if (!dentro(px, py) && l.esOpaco(px, py) && !(dx !== 0 && dy !== 0)) l.px(px, py, colores.reborde);
      }
    }
  }
  for (const [y, x0, x1] of corridas) {
    for (let x = x0; x <= x1; x++) {
      const borde = !dentro(x - 1, y) || !dentro(x + 1, y) || !dentro(x, y - 1) || !dentro(x, y + 1);
      l.px(x, y, borde ? colores.anillo : colores.interior);
    }
  }
  if (colores.centro !== undefined) {
    for (const [y, x0, x1] of corridas) {
      for (let x = x0; x <= x1; x++) {
        const todo = [-1, 0, 1].every((dy) => [-1, 0, 1].every((dx) => dentro(x + dx, y + dy)));
        if (todo) l.px(x, y, colores.centro);
      }
    }
  }
  return l;
}
