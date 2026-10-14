/**
 * Piezas de pared del lote 2A: divisor bajo (16 máscaras), puerta de vidrio, arco y ascensor.
 *
 * Todas encajan con el sistema de paredes del lote 1 (geometría y materiales documentados en `lote1.ts`):
 *  - el divisor bajo es la misma pared a escala de cintura: un "más" delgado centrado en x = 16 y pegado al borde sur
 *    de su casilla, con tapa lavanda, tallos hacia el norte y el sur, cara hacia el sur y zócalo azul marino.
 *    Mide 32 x 40 (casilla más 8 filas). Sus variantes `gris` y `rojo` son las de `pared-lisa`;
 *  - la puerta de vidrio parte de la pared de vidrio del lote 1 (`muroVidrio`);
 *  - el arco y el ascensor parten de dos piezas de pared lisa (`muroLiso`), así que tienen la misma tapa, altura,
 *    grosor, rampas y zócalo que sus vecinas. En tramos verticales (E) solo se ve la tapa, como en las puertas del lote 1.
 * Todo con contorno de 1 px en `azul-oficina-0`.
 */

import { Lienzo } from '../nucleo';
import { PARED_ALTO, PARED_ANCHO, TALLO_X0, TALLO_X1, muroLiso, muroVidrio } from './l1-paredes';
import type { DibujoObjeto } from './l2a-comun';
import { COLOR_CONTORNO, paresDeRampa, recolorearPares } from './l2a-comun';

/** Contorno de las piezas de pared: azul marino, con diagonales para que las esquinas queden cerradas (como en el lote 1). */
function contornear(l: Lienzo): Lienzo {
  return l.contorno(COLOR_CONTORNO, { diagonales: true });
}

// ---------------------------------------------------------------------------
// Divisor bajo
// ---------------------------------------------------------------------------

/** Ancho y alto del cuadro del divisor: una casilla más 8 filas que sobresalen. */
export const DIVISOR_ANCHO = 32;
export const DIVISOR_ALTO = 40;
/** El tallo (la parte vertical y el centro de cada pieza): 6 px de tapa, de la columna 13 a la 18. */
export const DIVISOR_TALLO_X0 = 13;
export const DIVISOR_TALLO_X1 = 19;
/** Tapa del tramo horizontal: filas 12 a 17 (el grosor del panel visto desde arriba). */
export const DIVISOR_TAPA_Y0 = 12;
export const DIVISOR_TAPA_Y1 = 18;
/** Cara que mira al sur: filas 18 a 39 (22 filas). El zócalo ocupa las 4 últimas. */
export const DIVISOR_CARA_Y0 = 18;
export const DIVISOR_ZOCALO_Y0 = 36;

/** Qué cubre cada máscara de vecinos (N, E, S, O): las regiones de tapa y de cara de una pieza del divisor. */
export function regionesDivisor(mascara: string): { tapa: boolean[][]; cara: boolean[][]; xi: number; xd: number; s: boolean; e: boolean; o: boolean } {
  if (!/^[01]{4}$/.test(mascara)) throw new RangeError(`Máscara de pared inválida: "${mascara}".`);
  const [n, e, s, o] = [...mascara].map((c) => c === '1') as [boolean, boolean, boolean, boolean];
  const tapa = Array.from({ length: DIVISOR_ALTO }, () => new Array<boolean>(DIVISOR_ANCHO).fill(false));
  const cara = Array.from({ length: DIVISOR_ALTO }, () => new Array<boolean>(DIVISOR_ANCHO).fill(false));
  const xi = o ? 0 : DIVISOR_TALLO_X0;
  const xd = e ? DIVISOR_ANCHO : DIVISOR_TALLO_X1;
  const marcar = (m: boolean[][], x0: number, y0: number, x1: number, y1: number): void => {
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) (m[y] as boolean[])[x] = true;
  };
  marcar(tapa, xi, DIVISOR_TAPA_Y0, xd, DIVISOR_TAPA_Y1);
  if (n) marcar(tapa, DIVISOR_TALLO_X0, 0, DIVISOR_TALLO_X1, DIVISOR_TAPA_Y0);
  if (s) marcar(tapa, DIVISOR_TALLO_X0, DIVISOR_TAPA_Y1, DIVISOR_TALLO_X1, 32);
  if (!s) {
    marcar(cara, xi, DIVISOR_CARA_Y0, xd, DIVISOR_ALTO);
  } else {
    // A los lados del tallo (sin su contorno de 1 px, que lo pone el tallo).
    if (xi < DIVISOR_TALLO_X0 - 1) marcar(cara, xi, DIVISOR_CARA_Y0, DIVISOR_TALLO_X0 - 1, DIVISOR_ALTO);
    if (xd > DIVISOR_TALLO_X1 + 1) marcar(cara, DIVISOR_TALLO_X1 + 1, DIVISOR_CARA_Y0, xd, DIVISOR_ALTO);
  }
  return { tapa, cara, xi, xd, s, e, o };
}

/**
 * Pieza del divisor bajo para una máscara de vecinos. Panel de `lavanda` con zócalo azul marino:
 * las variantes `gris` y `rojo` recolorean solo el panel.
 */
export function divisorBajo(mascara: string): Lienzo {
  const g = regionesDivisor(mascara);
  const l = new Lienzo(DIVISOR_ANCHO, DIVISOR_ALTO);
  const hay = (m: boolean[][], x: number, y: number): boolean => y >= 0 && y < DIVISOR_ALTO && x >= 0 && x < DIVISOR_ANCHO && (m[y] as boolean[])[x] === true;

  // Tapa: clara, con el borde derecho un tono más abajo (la luz viene de la izquierda).
  for (let y = 0; y < DIVISOR_ALTO; y++) {
    for (let x = 0; x < DIVISOR_ANCHO; x++) {
      if (!hay(g.tapa, x, y)) continue;
      const enSombra = !hay(g.tapa, x + 1, y) && x + 1 < DIVISOR_ANCHO;
      l.px(x, y, enSombra ? 'lavanda-3' : 'lavanda-4');
    }
  }
  // Cara: panel con un filo claro arriba, dos filas de oclusión y el zócalo azul marino abajo.
  for (let y = DIVISOR_CARA_Y0; y < DIVISOR_ALTO; y++) {
    for (let x = 0; x < DIVISOR_ANCHO; x++) {
      if (!hay(g.cara, x, y)) continue;
      let c = 'lavanda-2';
      if (y === DIVISOR_CARA_Y0) c = 'lavanda-3';
      else if (y === DIVISOR_ZOCALO_Y0 - 2) c = ((x + y) & 1) === 0 ? 'lavanda-1' : 'lavanda-2';
      else if (y === DIVISOR_ZOCALO_Y0 - 1) c = 'lavanda-1';
      else if (y === DIVISOR_ZOCALO_Y0) c = 'azul-oficina-3';
      else if (y === DIVISOR_ZOCALO_Y0 + 1) c = 'azul-oficina-2';
      else if (y === DIVISOR_ZOCALO_Y0 + 2) c = 'azul-oficina-1';
      else if (y === DIVISOR_ZOCALO_Y0 + 3) c = 'azul-oficina-0';
      l.px(x, y, c);
    }
  }
  // Extremos libres: brillo a la izquierda y sombra a la derecha, solo donde el panel termina de verdad.
  if (!g.s && !g.o) l.rect(g.xi, DIVISOR_CARA_Y0 + 2, 1, DIVISOR_ZOCALO_Y0 - 2 - DIVISOR_CARA_Y0 - 2, 'lavanda-3');
  if (!g.s && !g.e) l.rect(g.xd - 1, DIVISOR_CARA_Y0 + 2, 1, DIVISOR_ZOCALO_Y0 - 2 - DIVISOR_CARA_Y0 - 2, 'lavanda-1');
  return contornear(l);
}

/** Variantes del divisor: las mismas que `pared-lisa`. `gris` pasa al gris azulado de `baldosa-gris` y `rojo` al rojo de marca. */
export function varianteDivisor(base: Lienzo, variante: string): Lienzo | undefined {
  const destino = variante === 'gris' ? 'baldosa-gris' : variante === 'rojo' ? 'rojo' : null;
  if (destino === null) return undefined;
  return recolorearPares(base, paresDeRampa('lavanda', destino, [1, 2, 3, 4]));
}

export function dibujoDivisorBajo(): DibujoObjeto {
  const vistas: Record<string, Lienzo> = {};
  for (let i = 0; i < 16; i++) {
    const clave = [8, 4, 2, 1].map((b) => ((i & b) !== 0 ? '1' : '0')).join('');
    vistas[clave] = divisorBajo(clave);
  }
  return { rampaBase: 'lavanda', vistas, variante: varianteDivisor };
}

// ---------------------------------------------------------------------------
// Puerta de vidrio
// ---------------------------------------------------------------------------

/**
 * Puerta de vidrio de frente (orientación S). Parte de la pared de vidrio de un tramo recto y le suma lo que
 * hace puerta: dos jambas de aluminio, bisagras a la izquierda, una barra de empuje a la derecha y un umbral
 * a ras de piso en lugar del riel inferior.
 */
export function puertaVidrioS(): Lienzo {
  const l = muroVidrio('0101');
  // El riel inferior pasa a ser un umbral de tres filas, pegado al piso.
  l.rect(2, 60, PARED_ANCHO - 2, 1, null);
  const marco = new Lienzo(PARED_ANCHO, PARED_ALTO);
  // Jamba derecha: tres columnas de aluminio con la luz a la izquierda.
  marco.rect(29, 16, 1, PARED_ALTO - 16, 'metal-3');
  marco.rect(30, 16, 1, PARED_ALTO - 16, 'metal-2');
  marco.rect(31, 16, 1, PARED_ALTO - 16, 'metal-1');
  // Umbral.
  marco.rect(3, 61, 26, 1, 'metal-3');
  marco.rect(3, 62, 26, 1, 'metal-2');
  marco.rect(3, 63, 26, 1, 'metal-1');
  // Bisagras: dos pletinas que entran en el vidrio, con su pasador.
  for (const y of [26, 52]) {
    marco.rect(2, y, 3, 4, 'metal-3');
    marco.rect(2, y + 3, 3, 1, 'metal-1');
    marco.px(3, y + 1, 'metal-0');
  }
  // Barra de empuje: dos columnas con soportes arriba y abajo.
  marco.rect(23, 38, 1, 14, 'metal-3');
  marco.rect(24, 38, 1, 14, 'metal-2');
  marco.rect(25, 37, 1, 1, 'metal-1');
  marco.rect(25, 52, 1, 1, 'metal-1');
  l.pegar(contornear(marco), 0, 0);
  return l;
}

/**
 * Puerta de vidrio en un tramo vertical (E): se ve el canal de aluminio con el núcleo azul claro, una jamba de
 * aluminio en cada extremo, el canto de la hoja y la manija en el lado derecho.
 */
export function puertaVidrioVertical(): Lienzo {
  const l = muroVidrio('1010');
  const ancho = TALLO_X1 - TALLO_X0;
  const marco = new Lienzo(PARED_ANCHO, PARED_ALTO);
  // Jambas: un bloque de aluminio en cada extremo del tramo, con su junta.
  for (const y of [0, 27]) {
    marco.rect(TALLO_X0, y, ancho, 5, 'metal-2');
    marco.rect(TALLO_X0, y, 1, 5, 'metal-3');
    marco.rect(TALLO_X1 - 1, y, 1, 5, 'metal-1');
  }
  marco.rect(TALLO_X0, 5, ancho, 1, 'metal-1');
  marco.rect(TALLO_X0, 26, ancho, 1, 'metal-1');
  // Canto de la hoja: una línea fina al centro del núcleo.
  l.rect(15, 6, 2, 20, 'vidrio-2');
  // Manija de metal junto al borde derecho.
  marco.rect(TALLO_X1 - 4, 13, 2, 3, 'metal-3');
  marco.rect(TALLO_X1 - 4, 16, 2, 1, 'metal-1');
  l.pegar(contornear(marco), 0, 0);
  return l;
}

export function dibujoPuertaVidrio(): DibujoObjeto {
  return { rampaBase: 'metal', vistas: { S: puertaVidrioS(), E: puertaVidrioVertical() } };
}

// ---------------------------------------------------------------------------
// Arco y ascensor: dos piezas de pared lisa con un hueco o un portal tallado en la cara
// ---------------------------------------------------------------------------

/** Dos piezas de pared lisa en tramo recto, una al lado de la otra (cuadro de 64 x 64). */
function paredDoble(): Lienzo {
  const l = new Lienzo(PARED_ANCHO * 2, PARED_ALTO);
  l.pegar(muroLiso('0101'), 0, 0);
  l.pegar(muroLiso('0101'), PARED_ANCHO, 0);
  return l;
}

const CX = 31.5;

/** ¿Está (x, y) dentro de un arco de medio punto con el arranque en `arranque`, semiancho `a` y flecha `ry`? */
function dentroDeArco(x: number, y: number, a: number, ry: number, arranque: number): boolean {
  if (Math.abs(x - CX) > a) return false;
  if (y >= arranque) return true;
  const t = (arranque - y) / ry;
  if (t > 1) return false;
  return Math.abs(x - CX) <= a * Math.sqrt(1 - t * t);
}

/**
 * Arco de paso de frente (orientación S): un hueco de medio punto tallado en dos paredes lisas, con una moldura
 * lavanda de tres píxeles alrededor (clara arriba y a la izquierda, en sombra abajo y a la derecha), una clave en el
 * vértice, contorno azul marino y el zócalo cortado.
 */
export function arcoS(): Lienzo {
  const l = paredDoble();
  const arranque = 38;
  const abre = (x: number, y: number): boolean => dentroDeArco(x, y, 21.5, 15.8, arranque);
  const moldura = new Lienzo(64, 64);
  for (let y = 17; y < 56; y++) {
    for (let x = 0; x < 64; x++) {
      if (!dentroDeArco(x, y, 24.5, 18.8, arranque) || abre(x, y)) continue;
      // Normal hacia afuera del arco y su producto con la luz (arriba a la izquierda).
      const u = (x - CX) / 24.5;
      const v = y >= arranque ? 0 : (y - arranque) / 18.8;
      const n = Math.hypot(u, v) || 1;
      const luz = (-0.6 * u - 0.8 * v) / n;
      moldura.px(x, y, luz > 0.3 ? 'lavanda-4' : luz > -0.3 ? 'lavanda-3' : 'lavanda-1');
    }
  }
  // Clave del arco: un bloque claro que sobresale de la moldura, justo en el vértice.
  moldura.rect(29, 17, 6, 6, 'lavanda-4');
  moldura.rect(34, 18, 1, 5, 'lavanda-3');
  moldura.rect(29, 22, 6, 1, 'lavanda-3');
  // Contorno exterior de la moldura: azul marino, para que se lea contra la cara.
  l.pegar(contornear(moldura), 0, 0);
  // El hueco: se borra la cara (y el zócalo) para que se vea el piso y lo que hay detrás.
  for (let y = 16; y < 64; y++) for (let x = 0; x < 64; x++) if (abre(x, y)) l.px(x, y, null);
  // Contorno interior del hueco: una línea azul marina que lo recorta.
  for (let y = 16; y < 64; y++) {
    for (let x = 0; x < 64; x++) {
      if (!abre(x, y)) continue;
      const borde = !abre(x, y - 1) || !abre(x - 1, y) || !abre(x + 1, y);
      if (borde && y < 63) l.px(x, y, COLOR_CONTORNO);
    }
  }
  return l;
}

/** Arco en un tramo vertical (E): solo se ve la tapa, con los dos pilares marcados en los extremos. */
export function arcoVertical(): Lienzo {
  const largo = 64;
  const l = new Lienzo(PARED_ANCHO, PARED_ALTO + 32);
  const ancho = TALLO_X1 - TALLO_X0;
  l.rect(TALLO_X0, 0, ancho, largo, 'lavanda-4');
  l.rect(TALLO_X1 - 1, 0, 1, largo, 'lavanda-3'); // sombra a la derecha
  // Pilares: un tono más abajo en los extremos, con su junta.
  for (const y of [0, largo - 6]) {
    l.rect(TALLO_X0, y, ancho, 6, 'lavanda-3');
    l.rect(TALLO_X0, y, 1, 6, 'lavanda-4');
  }
  l.rect(TALLO_X0, 6, ancho, 1, 'lavanda-1');
  l.rect(TALLO_X0, largo - 7, ancho, 1, 'lavanda-1');
  // Dovela central (clave del arco).
  l.rect(TALLO_X0 + 2, largo / 2 - 2, ancho - 4, 4, 'lavanda-3');
  l.rect(TALLO_X0 + 2, largo / 2 - 2, 1, 4, 'lavanda-4');
  return contornear(l);
}

export function dibujoArco(): DibujoObjeto {
  return { rampaBase: 'lavanda', vistas: { S: arcoS(), E: arcoVertical() } };
}

/**
 * Ascensor de frente (orientación S): marco de acero, dos puertas corredizas cerradas, el indicador de piso
 * encima (lo único que emite luz) y la botonera a la derecha. El indicador usa los tonos más claros.
 */
export function ascensorS(): Lienzo {
  const l = paredDoble();
  const marco = new Lienzo(64, 64);
  // Marco del portal: tres píxeles de acero con la luz a la izquierda y arriba.
  marco.rect(6, 22, 52, 42, 'metal-2');
  marco.rect(6, 22, 52, 1, 'metal-3');
  marco.rect(6, 22, 1, 42, 'metal-3');
  marco.rect(57, 23, 1, 41, 'metal-1');
  marco.rect(7, 23, 50, 1, 'metal-3');
  // Puertas corredizas: acero cepillado con un reflejo y la junta al centro.
  for (const [x0, x1] of [[9, 31], [32, 54]] as const) {
    marco.rect(x0, 25, x1 - x0 + 1, 38, 'metal-2');
    marco.rect(x0, 25, 2, 38, 'metal-3'); // brillo del borde izquierdo de cada hoja
    marco.rect(x1, 25, 1, 38, 'metal-1'); // sombra del borde derecho
    marco.rect(x0, 25, x1 - x0 + 1, 1, 'metal-1'); // sombra bajo el dintel
    marco.rect(x0, 58, x1 - x0 + 1, 5, 'metal-1'); // zócalo de la puerta
    marco.rect(x0, 58, x1 - x0 + 1, 1, 'metal-2');
    // Reflejo en diagonal.
    marco.linea(x0 + 5, 44, x0 + 11, 32, 'metal-3');
    marco.linea(x0 + 7, 46, x0 + 13, 34, 'metal-3');
  }
  marco.rect(31, 25, 1, 38, 'metal-0'); // junta de las dos hojas
  // Umbral a ras de piso.
  marco.rect(9, 63, 46, 1, 'metal-3');
  l.pegar(contornear(marco), 0, 0);
  // Indicador de piso sobre el marco: panel azul marino con una flecha y dos dígitos, todo en los tonos claros.
  const panel = new Lienzo(64, 64);
  panel.rect(24, 16, 16, 6, 'azul-oficina-0');
  panel.rect(25, 17, 14, 4, 'azul-oficina-1');
  panel.rect(27, 18, 1, 1, 'blanco');
  panel.rect(26, 19, 3, 1, 'blanco');
  panel.rect(25, 20, 5, 1, 'blanco'); // flecha hacia arriba
  for (const [x, claro] of [[32, true], [36, false]] as const) {
    panel.rect(x, 18, 2, 3, claro ? 'blanco' : 'vidrio-3');
    panel.px(x, 19, 'azul-oficina-1');
  }
  l.pegar(panel, 0, 0);
  // Botonera a la derecha del portal: placa de acero con dos botones, uno encendido.
  l.rect(59, 36, 4, 10, COLOR_CONTORNO);
  l.rect(60, 37, 2, 8, 'metal-3');
  l.rect(60, 38, 2, 2, 'blanco');
  l.rect(60, 42, 2, 2, 'neutro-5');
  return l;
}

/** Ascensor en un tramo vertical (E): se ve la tapa de acero del pozo con la lucecita del indicador. */
export function ascensorVertical(): Lienzo {
  const largo = 64;
  const l = new Lienzo(PARED_ANCHO, PARED_ALTO + 32);
  const ancho = TALLO_X1 - TALLO_X0;
  l.rect(TALLO_X0, 0, ancho, largo, 'metal-2');
  l.rect(TALLO_X0, 0, 1, largo, 'metal-3');
  l.rect(TALLO_X0 + 1, 0, 1, largo, 'metal-3');
  l.rect(TALLO_X1 - 1, 0, 1, largo, 'metal-1');
  // Juntas de las dos mitades de la cabina y los extremos del pozo.
  l.rect(TALLO_X0, 6, ancho, 1, 'metal-1');
  l.rect(TALLO_X0, largo - 7, ancho, 1, 'metal-1');
  l.rect(TALLO_X0, largo / 2 - 1, ancho, 2, 'metal-1');
  // Lucecita del indicador (la que emite luz).
  l.rect(TALLO_X0 + 3, largo / 2 - 6, 4, 3, 'azul-oficina-0');
  l.rect(TALLO_X0 + 4, largo / 2 - 5, 2, 1, 'blanco');
  return contornear(l);
}

export function dibujoAscensor(): DibujoObjeto {
  return { rampaBase: 'metal', vistas: { S: ascensorS(), E: ascensorVertical() } };
}
