/**
 * Lote 8, escritorios de oficina como los de Gather: tapa clara casi blanca, labio azul grisáceo y frente de pizarra
 * con cajonera. Dos tamaños (3 x 1 y 3 x 2 casillas), cuatro orientaciones y cuatro variantes.
 *
 * Medidas (medidas en la captura de escritorios de Gather, ver `GUIA-ESTILO-GATHER-V2.md`), para un fondo de una casilla:
 *   cuadro de `ancho * 32` por `32 + 10`; cada fila contada desde el borde de abajo del cuadro (H = alto del cuadro):
 *     fila 0            contorno
 *     fila 1            borde trasero de la tapa (un tono más oscuro)
 *     filas 2 a H-16    tapa (25 filas con un fondo de una casilla)
 *     fila H-15         brillo del labio
 *     filas H-14, H-13  labio
 *     fila H-12         arista de luz del frente
 *     filas H-11 a H-5  frente (7 filas): ranuras de las patas y cajonera
 *     fila H-4          borde inferior del frente
 *     fila H-3          contorno
 *     filas H-2, H-1    sombra
 * Con fondo de dos casillas la tapa crece 32 filas y el resto queda igual (siempre contado desde abajo).
 *
 * Orientación: `S` y `N` (la cara larga hacia el sur o hacia el norte: `N` es la cara de atrás, lisa, sin cajonera) y
 * `E` y `O` (girado 90 grados: el frente se ve como una franja de 5 px en el lado al que mira).
 * Variantes: `base` (tapa blanca, frente pizarra), `madera`, `negro` y `rojo` (frente rojo coral).
 */

import { Lienzo } from '../nucleo';
import type { ColorEntrada } from '../nucleo';
import { SOBRESALE_ESCRITORIO, cerrarSuelo, registrarVariantes } from './l8-comun';
import type { Cuadros } from './l8-comun';

/** Colores de un escritorio. Todos son nombres de la paleta. */
export interface MaterialEscritorio {
  tapa: ColorEntrada;
  /** Borde trasero y borde derecho de la tapa: un tono más oscuro. */
  tapaSombra: ColorEntrada;
  /** Brillo de la arista de adelante, labio, y arista de luz del frente. */
  labioLuz: ColorEntrada;
  labio: ColorEntrada;
  arista: ColorEntrada;
  frente: ColorEntrada;
  borde: ColorEntrada;
  /** Hueco oscuro de las patas y borde de la cajonera. */
  ranura: ColorEntrada;
  cajon: ColorEntrada;
  cajonLuz: ColorEntrada;
  /** Vetas de la tapa, o `null` si es lisa. */
  veta: readonly [ColorEntrada, ColorEntrada] | null;
}

export type VarianteEscritorio = 'base' | 'madera' | 'negro' | 'rojo';

export const MATERIALES_ESCRITORIO: Readonly<Record<VarianteEscritorio, MaterialEscritorio>> = {
  base: { tapa: 'neutro-7', tapaSombra: 'pizarra-5', labioLuz: 'pizarra-4', labio: 'pizarra-3', arista: 'pizarra-2', frente: 'pizarra-1', borde: 'pizarra-0', ranura: 'azul-oficina-1', cajon: 'pizarra-2', cajonLuz: 'pizarra-3', veta: null },
  madera: { tapa: 'madera-clara-3', tapaSombra: 'madera-clara-2', labioLuz: 'madera-clara-4', labio: 'madera-clara-2', arista: 'madera-clara-1', frente: 'madera-oscura-3', borde: 'madera-oscura-1', ranura: 'madera-oscura-0', cajon: 'madera-oscura-4', cajonLuz: 'madera-clara-2', veta: ['madera-clara-2', 'madera-clara-4'] },
  negro: { tapa: 'neutro-2', tapaSombra: 'neutro-1', labioLuz: 'neutro-4', labio: 'neutro-3', arista: 'neutro-3', frente: 'neutro-1', borde: 'neutro-0', ranura: 'neutro-0', cajon: 'neutro-2', cajonLuz: 'neutro-3', veta: null },
  rojo: { tapa: 'neutro-7', tapaSombra: 'pizarra-5', labioLuz: 'pizarra-4', labio: 'pizarra-3', arista: 'rojo-3', frente: 'rojo-2', borde: 'rojo-0', ranura: 'rojo-0', cajon: 'rojo-3', cajonLuz: 'rojo-4', veta: null },
};

function vetas(l: Lienzo, x: number, y: number, ancho: number, alto: number, m: MaterialEscritorio, semilla: number): void {
  if (m.veta === null) return;
  let a = semilla * 7919;
  const rnd = (): number => {
    a = (a * 1103515245 + 12345) & 0x7fffffff;
    return a / 0x7fffffff;
  };
  const n = Math.max(4, Math.round((ancho * alto) / 220));
  for (let i = 0; i < n; i++) {
    const largo = 6 + Math.floor(rnd() * 12);
    const vx = x + 2 + Math.floor(rnd() * Math.max(1, ancho - 4 - largo));
    const vy = y + 2 + Math.floor(rnd() * Math.max(1, alto - 4));
    l.rect(vx, vy, Math.min(largo, ancho - 4), 1, i % 3 === 2 ? m.veta[1] : m.veta[0]);
  }
}

/** Cuerpo de un escritorio visto de frente o por detrás: tapa, labio, arista y frente, sin detalles ni contorno. */
function cuerpoLargo(l: Lienzo, w: number, H: number, m: MaterialEscritorio, semilla: number): { x0: number; x1: number } {
  const x0 = 2;
  const x1 = w - 5;
  const ancho = x1 - x0 + 1;
  l.rect(x0, 1, ancho, H - 16, m.tapa);
  l.rect(x0, 1, ancho, 1, m.tapaSombra);
  l.rect(x1, 1, 1, H - 16, m.tapaSombra);
  vetas(l, x0, 2, ancho, H - 18, m, semilla);
  l.rect(x0, H - 15, ancho, 1, m.labioLuz);
  l.rect(x0, H - 14, ancho, 2, m.labio);
  l.rect(x0, H - 12, ancho, 1, m.arista);
  l.rect(x0, H - 11, ancho, 7, m.frente);
  l.rect(x0, H - 4, ancho, 1, m.borde);
  return { x0, x1 };
}

/** Pata del escritorio vista de frente: bloque oscuro de 4 x 6 con una arista de luz arriba y a la izquierda. */
function ranuraPata(l: Lienzo, x: number, H: number, m: MaterialEscritorio): void {
  l.rect(x, H - 10, 4, 6, m.ranura);
  l.rect(x, H - 10, 4, 1, m.cajon);
  l.rect(x, H - 9, 1, 5, m.cajonLuz);
}

/** Cajonera de tres cajones de 20 px: caras claras con una manija oscura al centro. */
function cajonera(l: Lienzo, x: number, H: number, m: MaterialEscritorio): void {
  for (let k = 0; k < 3; k++) {
    const y = H - 10 + k * 2;
    l.rect(x, y, 20, 1, m.cajonLuz);
    l.rect(x, y + 1, 20, 1, m.cajon);
    l.rect(x + 8, y + 1, 4, 1, m.ranura);
  }
  l.rect(x - 1, H - 10, 1, 6, m.ranura);
  l.rect(x + 20, H - 10, 1, 6, m.ranura);
}

export function dibujarEscritorioFrente(ancho: number, fondo: number, variante: VarianteEscritorio, atras = false): Lienzo {
  const m = MATERIALES_ESCRITORIO[variante];
  const w = ancho * 32;
  const H = fondo * 32 + SOBRESALE_ESCRITORIO;
  const l = new Lienzo(w, H);
  const { x0, x1 } = cuerpoLargo(l, w, H, m, ancho * 3 + fondo + (atras ? 5 : 0));
  ranuraPata(l, x0 + 3, H, m);
  ranuraPata(l, x1 - 6, H, m);
  if (!atras) {
    cajonera(l, x0 + 10, H, m);
  } else {
    // Cara de atrás: lisa, con una bandeja de cables (línea oscura) entre las dos patas.
    l.rect(x0 + 10, H - 9, x1 - x0 - 19, 1, m.ranura);
  }
  return cerrarSuelo(l);
}

/** Escritorio girado 90 grados: la huella pasa a `fondo` x `ancho` casillas y el frente queda como franja lateral. */
export function dibujarEscritorioLado(ancho: number, fondo: number, lado: 'E' | 'O', variante: VarianteEscritorio): Lienzo {
  const m = MATERIALES_ESCRITORIO[variante];
  const w = fondo * 32;
  const H = ancho * 32 + SOBRESALE_ESCRITORIO;
  const l = new Lienzo(w, H);
  const x0 = 2;
  const x1 = w - 5;
  const franja = 5;
  // La franja del frente va en el lado al que mira: este (derecha) u oeste (izquierda).
  const fx = lado === 'E' ? x1 - franja + 1 : x0;
  const tx = lado === 'E' ? x0 : x0 + franja;
  const tw = x1 - x0 + 1 - franja;
  const yFin = H - 16;
  // Tapa.
  l.rect(tx, 1, tw, yFin, m.tapa);
  l.rect(tx, 1, tw, 1, m.tapaSombra);
  l.rect(lado === 'E' ? tx : tx + tw - 1, 1, 1, yFin, m.tapaSombra);
  vetas(l, tx, 2, tw, yFin - 2, m, ancho * 5 + fondo + (lado === 'E' ? 0 : 2));
  // Franja del frente: labio, arista y dos filas de frente.
  if (lado === 'E') {
    l.rect(fx, 1, 1, yFin, m.labioLuz);
    l.rect(fx + 1, 1, 1, yFin, m.labio);
    l.rect(fx + 2, 1, 1, yFin, m.arista);
    l.rect(fx + 3, 1, 2, yFin, m.frente);
    // Patas (ranuras) en los dos extremos de la franja.
    l.rect(fx + 3, 4, 2, 7, m.ranura);
    l.rect(fx + 3, yFin - 8, 2, 7, m.ranura);
    // Cajonera hacia el norte.
    for (let k = 0; k < 3; k++) {
      l.rect(fx + 3, 14 + k * 3, 2, 1, m.cajonLuz);
      l.rect(fx + 3, 15 + k * 3, 2, 1, m.cajon);
    }
  } else {
    l.rect(fx, 1, 2, yFin, m.frente);
    l.rect(fx + 2, 1, 1, yFin, m.arista);
    l.rect(fx + 3, 1, 1, yFin, m.labio);
    l.rect(fx + 4, 1, 1, yFin, m.labioLuz);
    l.rect(fx, 4, 2, 7, m.ranura);
    l.rect(fx, yFin - 8, 2, 7, m.ranura);
    for (let k = 0; k < 3; k++) {
      l.rect(fx, 14 + k * 3, 2, 1, m.cajonLuz);
      l.rect(fx, 15 + k * 3, 2, 1, m.cajon);
    }
  }
  // Extremo sur: se ve el canto (labio) y el frente de la cabecera, como en un escritorio de frente.
  const ancho2 = x1 - x0 + 1;
  l.rect(x0, H - 15, ancho2, 1, m.labioLuz);
  l.rect(x0, H - 14, ancho2, 2, m.labio);
  l.rect(x0, H - 12, ancho2, 1, m.arista);
  l.rect(x0, H - 11, ancho2, 7, m.frente);
  l.rect(x0, H - 4, ancho2, 1, m.borde);
  ranuraPata(l, lado === 'E' ? x1 - 6 : x0 + 6, H, m);
  return cerrarSuelo(l);
}

export function cuadrosEscritorios(): Cuadros {
  const c: Cuadros = new Map();
  const variantes: VarianteEscritorio[] = ['base', 'madera', 'negro', 'rojo'];
  for (const [id, ancho, fondo] of [['escritorio-3x1', 3, 1], ['escritorio-3x2', 3, 2]] as const) {
    for (const clave of ['S', 'N', 'E', 'O']) {
      const porVariante: Record<string, Lienzo> = {};
      for (const v of variantes) {
        porVariante[v] = clave === 'S' ? dibujarEscritorioFrente(ancho, fondo, v) : clave === 'N' ? dibujarEscritorioFrente(ancho, fondo, v, true) : dibujarEscritorioLado(ancho, fondo, clave === 'E' ? 'E' : 'O', v);
      }
      registrarVariantes(c, id, clave, porVariante);
    }
  }
  return c;
}
