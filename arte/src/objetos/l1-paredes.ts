/**
 * Sistema de paredes del lote 1. Es la pieza más delicada: 16 máscaras de vecinos por material, y las
 * aberturas (ventana, puertas) que ocupan el lugar de una pieza y deben encajar con los muros vecinos.
 *
 * La geometría de cada pieza (cuadro de 32 x 64, anclado abajo) está explicada en el bloque de `lote1.ts`.
 * Aquí viven las constantes, la geometría por máscara y los pintores de cada material.
 */

import { MASCARAS_PARED } from '@ol/shared';
import { Lienzo } from '../nucleo';
import { Mascara, registrarObjeto, type Cuadros } from './l1-comun';

// ---------------------------------------------------------------------------
// Constantes de geometría (todas las paredes y aberturas comparten estas)
// ---------------------------------------------------------------------------

/** Ancho y alto del cuadro de una pieza de pared. */
export const PARED_ANCHO = 32;
export const PARED_ALTO = 64;
/** El tallo (la parte vertical y el centro de cada pieza): 10 px de tapa, de la columna 11 a la 20. */
export const TALLO_X0 = 11;
export const TALLO_X1 = 21;
/** Tapa del tramo horizontal: filas 6 a 15. Es el grosor de la pared (10 px) visto desde arriba. */
export const TAPA_Y0 = 6;
export const TAPA_Y1 = 16;
/** Cara frontal (la que mira al sur): filas 16 a 63, 48 px, más alta que un personaje. */
export const CARA_Y0 = 16;
/** El zócalo ocupa las 8 últimas filas de la cara. */
export const ZOCALO_Y0 = 56;

export interface Geometria {
  n: boolean;
  e: boolean;
  s: boolean;
  o: boolean;
  /** Píxeles de la tapa (vista desde arriba). Incluye el tramo horizontal y los tallos hacia el norte y el sur. */
  tapa: Mascara;
  /** Píxeles de la cara frontal. Solo existe donde no hay pared al sur. */
  cara: Mascara;
  /** Extremos del tramo horizontal, para que el pintor sepa dónde acaba la pared. */
  xi: number;
  xd: number;
}

/**
 * Qué ocupa cada máscara de vecinos (N, E, S, O). La pared es un "más" delgado centrado en x = 16 y pegado
 * al borde sur de la casilla:
 *  - el cubo central es la tapa del tramo horizontal, filas 6 a 15 (con la cara debajo, filas 16 a 63);
 *  - con vecino al norte sube un tallo de tapa por las filas 0 a 5;
 *  - con vecino al sur baja un tallo de tapa por las filas 16 a 31 (y el resto de la franja la dibuja la pieza del sur);
 *  - con vecino al este u oeste el tramo horizontal llega hasta el borde del cuadro;
 *  - la cara solo aparece donde no hay pared al sur. Si hay pared al sur, la cara queda a los lados del tallo.
 */
export function geometria(mascara: string): Geometria {
  if (!/^[01]{4}$/.test(mascara)) throw new RangeError(`Máscara de pared inválida: "${mascara}".`);
  const [n, e, s, o] = [...mascara].map((c) => c === '1') as [boolean, boolean, boolean, boolean];
  const xi = o ? 0 : TALLO_X0;
  const xd = e ? PARED_ANCHO : TALLO_X1;
  const tapa = new Mascara(PARED_ANCHO, PARED_ALTO).rect(xi, TAPA_Y0, xd - xi, TAPA_Y1 - TAPA_Y0);
  if (n) tapa.rect(TALLO_X0, 0, TALLO_X1 - TALLO_X0, TAPA_Y0);
  if (s) tapa.rect(TALLO_X0, TAPA_Y1, TALLO_X1 - TALLO_X0, 16);
  const cara = new Mascara(PARED_ANCHO, PARED_ALTO);
  if (!s) {
    cara.rect(xi, CARA_Y0, xd - xi, PARED_ALTO - CARA_Y0);
  } else {
    // A los lados del tallo (sin su contorno de 1 px, que lo pone el tallo).
    if (xi < TALLO_X0 - 1) cara.rect(xi, CARA_Y0, TALLO_X0 - 1 - xi, PARED_ALTO - CARA_Y0);
    if (xd > TALLO_X1 + 1) cara.rect(TALLO_X1 + 1, CARA_Y0, xd - TALLO_X1 - 1, PARED_ALTO - CARA_Y0);
  }
  return { n, e, s, o, tapa, cara, xi, xd };
}

/** Tramos contiguos [desde, hasta) de la cara en una fila (la cara puede partirse en dos a los lados de un tallo). */
export function tramosDeCara(cara: Mascara, y = CARA_Y0): Array<[number, number]> {
  const tramos: Array<[number, number]> = [];
  let inicio = -1;
  for (let x = 0; x <= PARED_ANCHO; x++) {
    const hay = cara.en(x, y);
    if (hay && inicio < 0) inicio = x;
    if (!hay && inicio >= 0) {
      tramos.push([inicio, x]);
      inicio = -1;
    }
  }
  return tramos;
}

// ---------------------------------------------------------------------------
// Pared lisa (pintura cálida con zócalo de madera)
// ---------------------------------------------------------------------------

/** Zócalo oscuro azul marino (estilo Gather): brillo arriba, cuerpo, sombra abajo. Ocupa 8 filas desde `y`. */
export function pintarZocalo(l: Lienzo, x: number, ancho: number, y = ZOCALO_Y0): void {
  l.rect(x, y, ancho, 1, 'azul-oficina-3');
  l.rect(x, y + 1, ancho, 4, 'azul-oficina-2');
  l.rect(x, y + 5, ancho, 2, 'azul-oficina-1');
  l.rect(x, y + 7, ancho, 1, 'azul-oficina-0');
}

/** Oclusión de la cara cerca del zócalo: cuatro filas que oscurecen poco a poco (tramas de coordenadas del lienzo). */
export function pintarOclusion(l: Lienzo, cara: Mascara, claro: string, oscuro: string, zocaloY = ZOCALO_Y0): void {
  const patrones = [
    [zocaloY - 4, 'bayer25'],
    [zocaloY - 3, 'bayer50'],
    [zocaloY - 2, 'bayer75'],
  ] as const;
  for (let x = 0; x < l.ancho; x++) {
    for (const [y, patron] of patrones) {
      if (cara.en(x, y)) l.trama(x, y, 1, 1, claro, oscuro, patron);
    }
    if (cara.en(x, zocaloY - 1)) l.px(x, zocaloY - 1, oscuro);
  }
}

export interface RegionesLisas {
  tapa: Mascara;
  cara: Mascara;
  /** Fila donde empieza el zócalo. */
  zocaloY: number;
  /** El primer y el último píxel de la cara (para el brillo y la sombra de los extremos), o `null` si no es un extremo. */
  extremoIzquierdo: number | null;
  extremoDerecho: number | null;
}

/**
 * Pinta tapa, cara, oclusión y zócalo de una pared lisa sobre las regiones dadas. La usan las piezas de pared,
 * la columna y las aberturas (que parten de la pared lisa y le suman su marco).
 */
export function pintarLiso(l: Lienzo, r: RegionesLisas): void {
  for (let y = 0; y < l.alto; y++) {
    for (let x = 0; x < l.ancho; x++) {
      if (!r.tapa.en(x, y)) continue;
      // Luz arriba a la izquierda: el borde derecho de la tapa baja un tono.
      const enSombra = !r.tapa.en(x + 1, y) && x + 1 < l.ancho;
      l.px(x, y, enSombra ? 'lavanda-3' : 'lavanda-4');
    }
  }
  for (let y = CARA_Y0; y < l.alto; y++) {
    for (let x = 0; x < l.ancho; x++) {
      if (r.cara.en(x, y)) l.px(x, y, y >= r.zocaloY ? 'azul-oficina-2' : 'lavanda-2');
    }
  }
  pintarOclusion(l, r.cara, 'lavanda-2', 'lavanda-1', r.zocaloY);
  for (const [desde, hasta] of tramosDeCara(r.cara, r.zocaloY)) pintarZocalo(l, desde, hasta - desde, r.zocaloY);
  // Extremos de la cara: brillo a la izquierda y sombra a la derecha, solo donde la pared termina de verdad.
  const alto = r.zocaloY - 4 - CARA_Y0;
  if (r.extremoIzquierdo !== null) l.rect(r.extremoIzquierdo, CARA_Y0, 1, alto, 'lavanda-3');
  if (r.extremoDerecho !== null) l.rect(r.extremoDerecho, CARA_Y0, 1, alto, 'lavanda-1');
}

/** Pieza de pared lisa dibujada con la rampa `lavanda` (las variantes `gris` y `rojo` salen de recolorear). */
export function muroLiso(mascara: string): Lienzo {
  const g = geometria(mascara);
  const l = new Lienzo(PARED_ANCHO, PARED_ALTO);
  pintarLiso(l, {
    tapa: g.tapa,
    cara: g.cara,
    zocaloY: ZOCALO_Y0,
    extremoIzquierdo: !g.s && !g.o ? g.xi : null,
    extremoDerecho: !g.s && !g.e ? g.xd - 1 : null,
  });
  return l.contorno('azul-oficina-0', { diagonales: true });
}

// ---------------------------------------------------------------------------
// Pared de vidrio (marco de aluminio y cristal que deja ver lo que hay detrás)
// ---------------------------------------------------------------------------

/** Filas del vidrio: riel superior 16 a 18, cristal 19 a 59, banda esmerilada 34 a 43, riel inferior 60 a 63. */
const VIDRIO_RIEL_SUP = 16;
const VIDRIO_CRISTAL_Y0 = 19;
const VIDRIO_BANDA_Y0 = 34;
const VIDRIO_BANDA_Y1 = 44;
const VIDRIO_RIEL_INF = 60;

/**
 * Pared de vidrio. El cristal es transparente de verdad (alfa 0): se ve el piso y a quien esté detrás.
 * Lo que da la lectura de vidrio es el marco de aluminio, una banda esmerilada a la altura de la cintura
 * y dos destellos en diagonal. La tapa es un canal de aluminio con el núcleo azul claro, así los tramos
 * verticales también se leen como vidrio y no como una viga.
 */
export function muroVidrio(mascara: string): Lienzo {
  const g = geometria(mascara);
  // Capa 1: el marco (aluminio). Es lo único que lleva contorno.
  const marco = new Lienzo(PARED_ANCHO, PARED_ALTO);
  // Núcleo de la tapa: lo que queda al restar 2 px de borde en todo lo que no continúa en otra pieza.
  // Lo que queda fuera del cuadro cuenta como "dentro": la tapa sigue en la pieza vecina. Lo mismo el tallo del sur.
  const sigueAlSur = (x: number, y: number) => g.s && x >= TALLO_X0 && x < TALLO_X1 && y >= 32;
  const dentro = (x: number, y: number) => x < 0 || y < 0 || x >= PARED_ANCHO || y >= PARED_ALTO || g.tapa.en(x, y) || sigueAlSur(x, y);
  const eslabones: Array<[number, number]> = [[-1, 0], [1, 0], [0, -1], [0, 1], [-2, 0], [2, 0], [0, -2], [0, 2], [-1, -1], [1, -1], [-1, 1], [1, 1]];
  for (let y = 0; y < PARED_ALTO; y++) {
    for (let x = 0; x < PARED_ANCHO; x++) {
      if (!g.tapa.en(x, y)) continue;
      const nucleo = eslabones.every(([dx, dy]) => dentro(x + dx, y + dy));
      if (nucleo) marco.px(x, y, 'vidrio-3');
      else marco.px(x, y, !g.tapa.en(x + 1, y) && x + 1 < PARED_ANCHO ? 'metal-2' : 'metal-3');
    }
  }
  // Una línea más oscura en el centro del núcleo: el canal tiene fondo.
  for (let y = 0; y < PARED_ALTO; y++) {
    for (let x = 0; x < PARED_ANCHO; x++) {
      if (marco.leerHex(x, y) !== '#D6F1FA') continue;
      const arriba = marco.leerHex(x, y - 1);
      const izq = marco.leerHex(x - 1, y);
      if (arriba === '#8794A8' || arriba === '#C4CDD9' || izq === '#8794A8' || izq === '#C4CDD9') marco.px(x, y, 'vidrio-2');
    }
  }
  // Caras: por cada tramo de cara, rieles arriba y abajo y un poste en cada extremo.
  const frosted = new Lienzo(PARED_ANCHO, PARED_ALTO);
  for (const [desde, hasta] of tramosDeCara(g.cara)) {
    marco.rect(desde, VIDRIO_RIEL_SUP, hasta - desde, 2, 'metal-2');
    marco.rect(desde, VIDRIO_RIEL_SUP + 2, hasta - desde, 1, 'metal-1');
    marco.rect(desde, VIDRIO_RIEL_INF, hasta - desde, 1, 'metal-3');
    marco.rect(desde, VIDRIO_RIEL_INF + 1, hasta - desde, 2, 'metal-2');
    marco.rect(desde, VIDRIO_RIEL_INF + 3, hasta - desde, 1, 'metal-1');
    // Poste izquierdo (siempre: o es el extremo de la pared o es la unión con el panel de al lado).
    marco.rect(desde, VIDRIO_RIEL_SUP, 1, PARED_ALTO - VIDRIO_RIEL_SUP, 'metal-3');
    marco.rect(desde + 1, VIDRIO_RIEL_SUP, 1, PARED_ALTO - VIDRIO_RIEL_SUP, 'metal-2');
    // Poste derecho solo si el tramo termina dentro del cuadro (si no, el panel vecino pone el suyo).
    if (hasta < PARED_ANCHO) {
      marco.rect(hasta - 2, VIDRIO_RIEL_SUP, 1, PARED_ALTO - VIDRIO_RIEL_SUP, 'metal-2');
      marco.rect(hasta - 1, VIDRIO_RIEL_SUP, 1, PARED_ALTO - VIDRIO_RIEL_SUP, 'metal-1');
    }
    // Banda esmerilada y destellos entre los postes.
    const x0 = desde + 2;
    const x1 = hasta < PARED_ANCHO ? hasta - 2 : hasta;
    frosted.rect(x0, VIDRIO_BANDA_Y0, x1 - x0, VIDRIO_BANDA_Y1 - VIDRIO_BANDA_Y0, 'vidrio-3');
    frosted.rect(x0, VIDRIO_BANDA_Y0, x1 - x0, 1, 'vidrio-2');
    frosted.rect(x0, VIDRIO_BANDA_Y1 - 1, x1 - x0, 1, 'vidrio-2');
    frosted.trama(x0, VIDRIO_BANDA_Y0 + 3, x1 - x0, 4, 'vidrio-3', 'vidrio-2', 'bayer25');
    for (let y = VIDRIO_CRISTAL_Y0 + 1; y < VIDRIO_RIEL_INF - 1; y++) {
      if (y >= VIDRIO_BANDA_Y0 - 1 && y <= VIDRIO_BANDA_Y1) continue;
      for (let x = x0; x < x1; x++) {
        const d = (x + y) % 32;
        if (d >= 12 && d < 15) frosted.px(x, y, 'vidrio-3');
        else if (d === 18) frosted.px(x, y, 'blanco');
      }
    }
  }
  const contorneado = marco.contorno('azul-oficina-0', { diagonales: true });
  const l = new Lienzo(PARED_ANCHO, PARED_ALTO);
  l.pegar(frosted, 0, 0);
  l.pegar(contorneado, 0, 0);
  return l;
}

// ---------------------------------------------------------------------------
// Columna (pilar suelto, objeto de una casilla, alto como la pared)
// ---------------------------------------------------------------------------

export function columna(): Lienzo {
  const l = new Lienzo(32, 64);
  const tapa = new Mascara(32, 64).rect(9, 2, 14, 14);
  const cara = new Mascara(32, 64).rect(9, 16, 14, 46);
  pintarLiso(l, { tapa, cara, zocaloY: 54, extremoIzquierdo: 9, extremoDerecho: 22 });
  l.contorno('azul-oficina-0', { diagonales: true });
  return l.sombraProyectada('neutro-2', 2, 2, { patron: 'degradado' });
}

export function dibujarParedes(salida: Cuadros): void {
  registrarObjeto(salida, 'pared-lisa', muroLiso, {
    // Variantes: gris azulado (`baldosa-gris`) y rojo coral. El zócalo y el contorno azul marino no cambian.
    variante: (base, variante) => {
      const destino = variante === 'gris' ? 'baldosa-gris' : variante === 'rojo' ? 'rojo' : null;
      if (!destino) return undefined;
      return base.recolorear(Object.fromEntries([1, 2, 3, 4].map((t) => [`lavanda-${t}`, `${destino}-${t}`])));
    },
  });
  registrarObjeto(salida, 'vidrio', muroVidrio);
  registrarObjeto(salida, 'columna', columna);
}

export { MASCARAS_PARED };
