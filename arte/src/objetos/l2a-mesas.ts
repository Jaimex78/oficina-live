/**
 * Mesas del lote 2A: mesa de reunión de 8 y de 12, mesa de comedor, mesa alta, mesa de ping-pong y futbolín.
 *
 * Estilo Gather (ver `GUIA-ESTILO-GATHER.md`):
 *  - mesas de reunión: tapa blanca de esquinas redondeadas con un canto gris, faldón y patas de `azul-oficina`
 *    (el panel azul grisáceo de los escritorios de Gather), módulos de conexión de metal;
 *  - comedor y mesa alta: madera clara en la rampa `crema`, con patas del mismo tono un paso más oscuras;
 *  - ping-pong: tapa verde con líneas blancas y red; futbolín: caja de `cuero` con cancha verde y barras con jugadores.
 * Todo con contorno de 1 px en `azul-oficina-0`, luz arriba a la izquierda y una sola sombra abajo a la derecha.
 *
 * Variantes: las de las mesas claras (`madera`, `blanco`, `negro`) salen de mapas a medida que cambian la tapa y el
 * panel y dejan intactos el contorno y los herrajes de metal.
 *
 * Orientaciones: en `S` el lado largo es horizontal. En `E` el mismo mueble gira y el lado largo es vertical:
 * desde el sur solo se ven las patas del extremo sur.
 */

import { Lienzo } from '../nucleo';
import type { DibujoObjeto, ParColor } from './l2a-comun';
import { contornoGather, elipseTramada, oscuridadBajo, paresDeRampa, recolorearPares, sombraEstandar } from './l2a-comun';

// ---------------------------------------------------------------------------
// Tapa clara de esquinas redondeadas
// ---------------------------------------------------------------------------

interface OpcionesTapa {
  x: number;
  y: number;
  ancho: number;
  /** Alto en pantalla de la cara superior. */
  fondo: number;
  /** Alto en pantalla del canto frontal. */
  canto: number;
  /** Radio de las esquinas: 2 recorta 1 px, 3 recorta 2 y 4 recorta 3. */
  radio?: number;
}

/**
 * Tapa blanca vista en 3/4: el canto (gris) se dibuja primero y la cara superior encima, los dos redondeados,
 * así el canto asoma bajo las esquinas de abajo. El borde derecho y el inferior bajan un tono (luz a la izquierda).
 */
function tapaClara(l: Lienzo, o: OpcionesTapa): void {
  const r = o.radio ?? 3;
  l.rectRedondeado(o.x, o.y, o.ancho, o.fondo + o.canto, r, 'neutro-5'); // canto en sombra
  l.rect(o.x + 1, o.y + o.fondo, o.ancho - 2, 1, 'neutro-6'); // el filo del canto recibe la luz
  l.rectRedondeado(o.x, o.y, o.ancho, o.fondo, r, 'neutro-7'); // cara superior
  // El borde derecho y el inferior de la cara superior bajan un tono.
  l.rect(o.x + o.ancho - 2, o.y + r, 1, o.fondo - 2 * r, 'neutro-6');
  l.rect(o.x + r, o.y + o.fondo - 2, o.ancho - 2 * r, 1, 'neutro-6');
}

/** Módulo de conexión embutido en la tapa: caja de metal con una ranura. */
function modulo(l: Lienzo, x: number, y: number, ancho: number, alto: number): void {
  l.rect(x, y, ancho, alto, 'metal-2');
  l.rect(x, y, ancho, 1, 'metal-3');
  l.rect(x, y + alto - 1, ancho, 1, 'metal-1');
  l.rect(x + 1, y + 1, ancho - 2, 1, 'metal-1');
}

/**
 * Faldón azul grisáceo bajo el canto: el panel frontal de los escritorios de Gather. Luz arriba, sombra abajo y un
 * bisel hundido en el centro para que se lea como panel y no como una franja.
 */
function faldon(l: Lienzo, x: number, y: number, ancho: number, alto = 8): void {
  l.rect(x, y, ancho, alto, 'azul-oficina-3');
  l.rect(x, y, ancho, 1, 'azul-oficina-4');
  l.rect(x, y + alto - 1, ancho, 1, 'azul-oficina-2');
  if (ancho > 14 && alto >= 6) {
    l.rect(x + 3, y + 2, ancho - 6, alto - 4, 'azul-oficina-2'); // hueco del panel
    l.rect(x + 4, y + 3, ancho - 8, alto - 5, 'azul-oficina-3'); // fondo del panel, un paso más claro
  }
}

/** Pata de panel de `azul-oficina`: luz a la izquierda, sombra a la derecha, un pie más oscuro y las esquinas de abajo redondeadas. */
function pataPanel(l: Lienzo, x: number, y: number, alto: number, ancho = 6): void {
  l.rect(x, y, ancho, alto, 'azul-oficina-2');
  l.rect(x, y, 1, alto, 'azul-oficina-3');
  l.rect(x + ancho - 1, y, 1, alto, 'azul-oficina-1');
  l.rect(x, y + alto - 1, ancho, 1, 'azul-oficina-1');
  l.px(x, y + alto - 1, null);
  l.px(x + ancho - 1, y + alto - 1, null);
}

// ---------------------------------------------------------------------------
// Variantes de las mesas claras (tapa blanca y panel azul grisáceo)
// ---------------------------------------------------------------------------

const TAPA_BLANCA = ['neutro-7', 'neutro-6', 'neutro-5'] as const;
const PANEL_AZUL = [4, 3, 2, 1] as const;

/**
 * Variantes de una mesa clara. `madera`: tapa de madera clara con panel de nogal. `blanco`: todo blanco, con el panel
 * gris claro. `negro`: tapa y panel gris oscuro. No cambian el contorno ni los herrajes de metal.
 */
export function varianteMesaClara(base: Lienzo, variante: string): Lienzo | undefined {
  const pares: ParColor[] = [];
  if (variante === 'madera') {
    pares.push(['neutro-7', 'madera-clara-4'], ['neutro-6', 'madera-clara-3'], ['neutro-5', 'madera-clara-2']);
    pares.push(...paresDeRampa('azul-oficina', 'madera-oscura', PANEL_AZUL));
  } else if (variante === 'blanco') {
    pares.push(...paresDeRampa('azul-oficina', 'neutro', PANEL_AZUL, [7, 6, 5, 4]));
  } else if (variante === 'negro') {
    pares.push(['neutro-7', 'neutro-3'], ['neutro-6', 'neutro-2'], ['neutro-5', 'neutro-1']);
    pares.push(...paresDeRampa('azul-oficina', 'neutro', PANEL_AZUL, [3, 2, 1, 1]));
  } else {
    return undefined;
  }
  return recolorearPares(base, pares);
}

/** Variantes de una mesa de madera clara en la rampa `crema`: `madera` (más oscura), `blanco` y `negro`. */
export function varianteMesaCrema(base: Lienzo, variante: string): Lienzo | undefined {
  const tonos = [0, 1, 2, 3, 4];
  if (variante === 'madera') return recolorearPares(base, paresDeRampa('crema', 'madera-clara', tonos));
  if (variante === 'blanco') return recolorearPares(base, paresDeRampa('crema', 'neutro', tonos, [3, 4, 5, 6, 7]));
  if (variante === 'negro') return recolorearPares(base, paresDeRampa('crema', 'neutro', tonos, [0, 1, 2, 3, 4]));
  return undefined;
}

// ---------------------------------------------------------------------------
// Mesa de reunión de 8 y de 12
// ---------------------------------------------------------------------------

const CANTO_REUNION = 3;
const PATAS_REUNION = 4;
const FALDON_REUNION = 8;

/**
 * Mesa de reunión larga. `celdas` es el largo en casillas (4 o 6); el fondo siempre es de 2 casillas.
 * Dos patas de panel en los extremos (y dos de apoyo en la de 12) bajo un faldón continuo.
 */
function mesaReunion(celdas: number, orientacion: 'S' | 'E'): Lienzo {
  const horizontal = orientacion === 'S';
  const largoPx = celdas * 32;
  const l = horizontal ? new Lienzo(largoPx, 64) : new Lienzo(64, largoPx);
  if (horizontal) {
    const fondo = 40;
    tapaClara(l, { x: 3, y: 2, ancho: largoPx - 8, fondo, canto: CANTO_REUNION, radio: 4 });
    const yFaldon = 2 + fondo + CANTO_REUNION;
    faldon(l, 7, yFaldon, largoPx - 16, FALDON_REUNION);
    const yPatas = yFaldon + FALDON_REUNION;
    const posiciones = celdas > 4 ? [7, Math.round(largoPx / 3) - 3, Math.round((2 * largoPx) / 3) - 3, largoPx - 15] : [7, largoPx - 15];
    for (const px of posiciones) pataPanel(l, px, yPatas, PATAS_REUNION);
    const modulos = celdas > 4 ? [Math.round(largoPx / 3), Math.round((2 * largoPx) / 3)] : [Math.round(largoPx / 2)];
    for (const mx of modulos) modulo(l, mx - 4, 2 + Math.round(fondo / 2) - 2, 8, 5);
    contornoGather(l);
    sombraEstandar(l);
    oscuridadBajo(l, 14, yPatas, largoPx - 30, 3);
  } else {
    const ancho = 50;
    const x0 = 7;
    const fondo = largoPx - 2 - CANTO_REUNION - FALDON_REUNION - PATAS_REUNION - 5;
    tapaClara(l, { x: x0, y: 2, ancho, fondo, canto: CANTO_REUNION, radio: 4 });
    const yFaldon = 2 + fondo + CANTO_REUNION;
    faldon(l, x0 + 4, yFaldon, ancho - 8, FALDON_REUNION);
    const yPatas = yFaldon + FALDON_REUNION;
    for (const px of [x0 + 4, x0 + ancho - 10]) pataPanel(l, px, yPatas, PATAS_REUNION);
    const modulos = celdas > 4 ? [Math.round(fondo / 3), Math.round((2 * fondo) / 3)] : [Math.round(fondo / 2)];
    for (const my of modulos) modulo(l, x0 + Math.round(ancho / 2) - 4, my, 8, 5);
    contornoGather(l);
    sombraEstandar(l);
    oscuridadBajo(l, x0 + 11, yPatas, ancho - 22, 3);
  }
  return l;
}

export function dibujoMesaReunion8(): DibujoObjeto {
  return { rampaBase: 'neutro', vistas: { S: mesaReunion(4, 'S'), E: mesaReunion(4, 'E') }, variante: varianteMesaClara };
}

export function dibujoMesaReunion12(): DibujoObjeto {
  return { rampaBase: 'neutro', vistas: { S: mesaReunion(6, 'S'), E: mesaReunion(6, 'E') }, variante: varianteMesaClara };
}

// ---------------------------------------------------------------------------
// Mesa de comedor (madera clara)
// ---------------------------------------------------------------------------

/** Tapa de madera clara: canto en `crema-1`, cara superior en `crema-3` con un borde claro arriba y a la izquierda. */
function tapaCrema(l: Lienzo, o: OpcionesTapa): void {
  const r = o.radio ?? 3;
  l.rectRedondeado(o.x, o.y, o.ancho, o.fondo + o.canto, r, 'crema-1');
  l.rect(o.x + 1, o.y + o.fondo, o.ancho - 2, 1, 'crema-2');
  l.rectRedondeado(o.x, o.y, o.ancho, o.fondo, r, 'crema-3');
  l.rect(o.x + r, o.y, o.ancho - 2 * r, 1, 'crema-4'); // brillo del borde superior
  l.rect(o.x, o.y + r, 1, o.fondo - 2 * r, 'crema-4'); // brillo del borde izquierdo
  l.rect(o.x + o.ancho - 2, o.y + r, 1, o.fondo - 2 * r, 'crema-2'); // sombra del borde derecho
  l.rect(o.x + r, o.y + o.fondo - 2, o.ancho - 2 * r, 1, 'crema-2'); // sombra del borde inferior
  // Bisel hundido a 4 px del borde: línea clara abajo y a la derecha, sombra arriba y a la izquierda (luz de la izquierda).
  if (o.ancho > 24 && o.fondo > 20) {
    l.rect(o.x + 5, o.y + 4, o.ancho - 10, 1, 'crema-2');
    l.rect(o.x + 4, o.y + 5, 1, o.fondo - 10, 'crema-2');
    l.rect(o.x + 5, o.y + o.fondo - 5, o.ancho - 10, 1, 'crema-4');
    l.rect(o.x + o.ancho - 5, o.y + 5, 1, o.fondo - 10, 'crema-4');
  }
}

/** Pata redonda de madera: luz a la izquierda, medio y sombra a la derecha. */
function pataCrema(l: Lienzo, x: number, y: number, alto: number, ancho = 5): void {
  l.rect(x, y, ancho, alto, 'crema-2');
  l.rect(x, y, 1, alto, 'crema-3');
  l.rect(x + ancho - 1, y, 1, alto, 'crema-1');
  l.rect(x, y + alto - 1, ancho, 1, 'crema-1');
  l.px(x, y + alto - 1, null);
  l.px(x + ancho - 1, y + alto - 1, null);
}

const CANTO_COMEDOR = 3;
const PATAS_COMEDOR = 13;

/**
 * Mesa de comedor de 3 x 2: tapa de madera clara con esquinas muy redondeadas, faldón y cuatro patas gruesas
 * (solo se ven las dos de adelante). Más cálida que la de reunión: toda de `crema`.
 */
function mesaComedor(orientacion: 'S' | 'E'): Lienzo {
  const horizontal = orientacion === 'S';
  const l = horizontal ? new Lienzo(96, 64) : new Lienzo(64, 96);
  const ancho = horizontal ? 88 : 50;
  const x0 = horizontal ? 3 : 7;
  const fondo = horizontal ? 38 : 96 - 2 - CANTO_COMEDOR - PATAS_COMEDOR - 6;
  tapaCrema(l, { x: x0, y: 2, ancho, fondo, canto: CANTO_COMEDOR, radio: 4 });
  const yPatas = 2 + fondo + CANTO_COMEDOR;
  const izquierda = x0 + 3;
  const derecha = x0 + ancho - 8;
  // Faldón entre las patas, justo bajo el canto.
  l.rect(izquierda + 5, yPatas, derecha - izquierda - 5, 3, 'crema-2');
  l.rect(izquierda + 5, yPatas + 2, derecha - izquierda - 5, 1, 'crema-1');
  pataCrema(l, izquierda, yPatas, PATAS_COMEDOR);
  pataCrema(l, derecha, yPatas, PATAS_COMEDOR);
  contornoGather(l);
  sombraEstandar(l);
  oscuridadBajo(l, izquierda + 6, yPatas + 3, derecha - izquierda - 7, 3);
  return l;
}

export function dibujoMesaComedor(): DibujoObjeto {
  return { rampaBase: 'crema', vistas: { S: mesaComedor('S'), E: mesaComedor('E') }, variante: varianteMesaCrema };
}

// ---------------------------------------------------------------------------
// Mesa alta
// ---------------------------------------------------------------------------

/**
 * Mesa alta de café: tapa redonda de madera clara sobre una columna de `azul-oficina` y una base plana.
 * Es la única mesa vista de lado y no de frente: la tapa es una elipse con su canto debajo.
 */
export function dibujoMesaAlta(): DibujoObjeto {
  const l = new Lienzo(32, 32);
  // Base plana y columna.
  l.elipse(16, 28, 7, 2, 'azul-oficina-1');
  l.elipse(16, 27, 7, 2, 'azul-oficina-2');
  l.elipse(16, 27, 5, 1, 'azul-oficina-3');
  l.rect(14, 15, 4, 12, 'azul-oficina-2');
  l.rect(14, 15, 1, 12, 'azul-oficina-3');
  l.rect(17, 15, 1, 12, 'azul-oficina-1');
  // Tapa: canto, cara superior con brillo a la izquierda y sombra a la derecha.
  l.elipse(16, 11, 11, 6, 'crema-1');
  l.elipse(16, 10, 11, 6, 'crema-2');
  l.elipseSombreada(16, 8, 11, 6, ['crema-2', 'crema-3', 'crema-4'], { relieve: 0.45, umbrales: [0.25, 0.82] });
  contornoGather(l);
  sombraEstandar(l);
  // La tapa proyecta su sombra sobre el piso, alrededor de la base.
  elipseTramada(l, 18, 26, 9, 3, 'neutro-2');
  return { rampaBase: 'crema', vistas: { U: l }, variante: varianteMesaCrema };
}

// ---------------------------------------------------------------------------
// Mesa de ping-pong
// ---------------------------------------------------------------------------

/** Raqueta vista desde arriba: pala roja con goma y mango de madera clara. */
function raqueta(l: Lienzo, x: number, y: number, mango: 'abajo' | 'derecha' | 'izquierda'): void {
  l.elipse(x, y, 3, 3, 'rojo-suave-1');
  l.elipse(x - 0.5, y - 0.5, 2, 2, 'rojo-suave-3');
  l.px(x - 1, y - 1, 'rojo-suave-4');
  if (mango === 'abajo') l.rect(x - 1, y + 3, 2, 3, 'crema-2');
  else if (mango === 'derecha') l.rect(x + 3, y - 1, 3, 2, 'crema-2');
  else l.rect(x - 6, y - 1, 3, 2, 'crema-2');
}

/** Líneas blancas de la mesa de ping-pong: contorno a 2 px del borde y raya central a lo largo. */
function lineasPingpong(l: Lienzo, x: number, y: number, ancho: number, fondo: number, eje: 'h' | 'v'): void {
  l.rectBorde(x + 2, y + 2, ancho - 4, fondo - 4, 'neutro-7');
  if (eje === 'h') l.rect(x + 2, y + Math.floor(fondo / 2), ancho - 4, 1, 'neutro-7');
  else l.rect(x + Math.floor(ancho / 2), y + 2, 1, fondo - 4, 'neutro-7');
}

/** Mesa de ping-pong: tapa verde con líneas blancas, red al centro y patas de `azul-oficina` con ruedas. */
function mesaPingpong(orientacion: 'S' | 'E'): Lienzo {
  const horizontal = orientacion === 'S';
  const l = horizontal ? new Lienzo(96, 64) : new Lienzo(64, 96);
  const x0 = horizontal ? 3 : 7;
  const ancho = horizontal ? 88 : 50;
  const y0 = 4;
  const canto = 3;
  const patas = 13;
  const fondo = horizontal ? 38 : 96 - y0 - canto - patas - 6;
  // Canto azul marino y cara superior verde con brillo a la izquierda y arriba.
  l.rectRedondeado(x0, y0, ancho, fondo + canto, 3, 'azul-oficina-2');
  l.rect(x0 + 1, y0 + fondo, ancho - 2, 1, 'azul-oficina-3');
  l.rectRedondeado(x0, y0, ancho, fondo, 3, 'planta-2');
  l.rect(x0 + 3, y0, ancho - 6, 1, 'planta-3');
  l.rect(x0, y0 + 3, 1, fondo - 6, 'planta-3');
  l.rect(x0 + ancho - 2, y0 + 3, 1, fondo - 6, 'planta-1');
  lineasPingpong(l, x0, y0, ancho, fondo, horizontal ? 'h' : 'v');
  const yPatas = y0 + fondo + canto;
  // Patas de panel con travesaño y ruedas.
  const izquierda = x0 + 5;
  const derecha = x0 + ancho - 9;
  l.rect(izquierda + 4, yPatas, derecha - izquierda - 4, 2, 'azul-oficina-1');
  for (const px of [izquierda, derecha]) {
    l.rect(px, yPatas, 4, patas - 2, 'azul-oficina-2');
    l.rect(px, yPatas, 1, patas - 2, 'azul-oficina-3');
    l.rect(px + 3, yPatas, 1, patas - 2, 'azul-oficina-1');
    l.rect(px - 1, yPatas + patas - 2, 6, 2, 'azul-oficina-1');
    l.rect(px, yPatas + patas - 1, 4, 1, 'neutro-4'); // rueda
  }
  if (horizontal) {
    // Red de frente a lo largo del ancho: línea vertical con broches en los dos bordes.
    const nx = x0 + Math.floor(ancho / 2) - 1;
    l.rect(nx, y0 - 3, 2, fondo + 2, 'neutro-7');
    l.rect(nx + 1, y0 - 3, 1, fondo + 2, 'neutro-5');
    l.rect(nx - 1, y0 - 3, 4, 3, 'azul-oficina-3');
    l.rect(nx - 1, y0 - 3, 4, 1, 'azul-oficina-4');
    l.rect(nx - 1, y0 + fondo - 1, 4, 3, 'azul-oficina-3');
    l.rect(nx - 1, y0 + fondo + 1, 4, 1, 'azul-oficina-1');
    raqueta(l, x0 + 20, y0 + 28, 'derecha');
    raqueta(l, x0 + ancho - 22, y0 + 10, 'izquierda');
    l.rect(x0 + 52, y0 + 22, 2, 2, 'neutro-7'); // pelota
  } else {
    // Red de cara: franja horizontal con cinta blanca arriba y malla tramada.
    const ny = y0 + Math.floor(fondo / 2) - 3;
    l.trama(x0, ny + 1, ancho, 4, 'neutro-6', 'neutro-4', 'tablero');
    l.rect(x0, ny, ancho, 1, 'neutro-7');
    l.rect(x0, ny + 4, ancho, 1, 'neutro-5');
    for (const px of [x0 - 3, x0 + ancho]) {
      l.rect(px, ny - 1, 3, 7, 'azul-oficina-3');
      l.rect(px, ny - 1, 3, 1, 'azul-oficina-4');
    }
    raqueta(l, x0 + 14, y0 + 14, 'abajo');
    raqueta(l, x0 + ancho - 14, y0 + fondo - 14, 'abajo');
    l.rect(x0 + 30, y0 + fondo - 18, 2, 2, 'neutro-7'); // pelota
  }
  contornoGather(l);
  sombraEstandar(l);
  oscuridadBajo(l, izquierda + 5, yPatas + 2, derecha - izquierda - 6, 3);
  return l;
}

export function dibujoMesaPingpong(): DibujoObjeto {
  return { rampaBase: 'planta', vistas: { S: mesaPingpong('S'), E: mesaPingpong('E') } };
}

// ---------------------------------------------------------------------------
// Futbolín
// ---------------------------------------------------------------------------

/** Cantidad de jugadores por barra, de izquierda a derecha (o de arriba abajo), y su equipo. */
const BARRAS: ReadonlyArray<{ hombres: number; rojo: boolean }> = [
  { hombres: 1, rojo: true },
  { hombres: 2, rojo: true },
  { hombres: 3, rojo: false },
  { hombres: 5, rojo: true },
  { hombres: 5, rojo: false },
  { hombres: 3, rojo: true },
  { hombres: 2, rojo: false },
  { hombres: 1, rojo: false },
];

/** Jugador visto desde arriba: bloque de 3 x 3 con el tono claro arriba y el oscuro abajo. */
function jugador(l: Lienzo, x: number, y: number, rojo: boolean): void {
  l.rect(x, y, 3, 3, rojo ? 'rojo-suave-2' : 'azul-oficina-4');
  l.rect(x, y, 3, 1, rojo ? 'rojo-suave-4' : 'neutro-7');
  l.rect(x + 2, y + 1, 1, 2, rojo ? 'rojo-suave-1' : 'azul-oficina-3');
}

/** Mango redondo de una barra: plástico azul marino con un brillo arriba a la izquierda. */
function mango(l: Lienzo, x: number, y: number): void {
  l.rect(x, y, 3, 3, 'azul-oficina-2');
  l.px(x, y, 'azul-oficina-4');
  l.px(x + 1, y, 'azul-oficina-3');
  l.px(x, y + 1, 'azul-oficina-3');
  l.px(x + 2, y + 2, 'azul-oficina-1');
}

/** Futbolín de 3 x 2: caja de `cuero` con la cancha verde, ocho barras con jugadores y mangos a los lados. */
function futbolin(orientacion: 'S' | 'E'): Lienzo {
  const horizontal = orientacion === 'S';
  const l = horizontal ? new Lienzo(96, 64) : new Lienzo(64, 96);
  const x0 = horizontal ? 3 : 7;
  const ancho = horizontal ? 88 : 50;
  const y0 = 4;
  const canto = 4;
  const patas = 12;
  const fondo = horizontal ? 38 : 96 - y0 - canto - patas - 6;
  // Caja: canto oscuro y tapa de cuero con brillo arriba y a la izquierda.
  l.rectRedondeado(x0, y0, ancho, fondo + canto, 3, 'cuero-1');
  l.rect(x0 + 1, y0 + fondo, ancho - 2, 1, 'cuero-2');
  l.rectRedondeado(x0, y0, ancho, fondo, 3, 'cuero-2');
  l.rect(x0 + 3, y0, ancho - 6, 1, 'cuero-4');
  l.rect(x0, y0 + 3, 1, fondo - 6, 'cuero-3');
  l.rect(x0 + ancho - 2, y0 + 3, 1, fondo - 6, 'cuero-1');
  // Cancha: verde con franjas de césped cortado y líneas blancas.
  const cx = x0 + 4;
  const cy = y0 + 4;
  const cw = ancho - 8;
  const ch = fondo - 8;
  l.rect(cx, cy, cw, ch, 'planta-1');
  if (horizontal) {
    for (let k = 0; k < cw; k += 12) l.rect(cx + k, cy, 6, ch, 'planta-2');
  } else {
    for (let k = 0; k < ch; k += 12) l.rect(cx, cy + k, cw, 6, 'planta-2');
  }
  l.rectBorde(cx + 1, cy + 1, cw - 2, ch - 2, 'neutro-6');
  if (horizontal) {
    l.rect(cx + Math.floor(cw / 2), cy + 1, 1, ch - 2, 'neutro-6');
    l.elipseBorde(cx + Math.floor(cw / 2), cy + Math.floor(ch / 2), 5, 5, 'neutro-6');
    for (const gx of [cx + 1, cx + cw - 5]) l.rect(gx, cy + Math.floor(ch / 2) - 5, 4, 11, 'planta-1');
    for (const gx of [cx + 1, cx + cw - 2]) l.rect(gx, cy + Math.floor(ch / 2) - 5, 1, 11, 'neutro-6');
    // Porterías: aberturas oscuras en los extremos de la caja.
    for (const gx of [x0, x0 + ancho - 2]) l.rect(gx, cy + Math.floor(ch / 2) - 4, 2, 9, 'azul-oficina-0');
  } else {
    l.rect(cx + 1, cy + Math.floor(ch / 2), cw - 2, 1, 'neutro-6');
    l.elipseBorde(cx + Math.floor(cw / 2), cy + Math.floor(ch / 2), 5, 5, 'neutro-6');
    for (const gy of [cy + 1, cy + ch - 5]) l.rect(cx + Math.floor(cw / 2) - 5, gy, 11, 4, 'planta-1');
    for (const gy of [cy + 1, cy + ch - 2]) l.rect(cx + Math.floor(cw / 2) - 5, gy, 11, 1, 'neutro-6');
    l.rect(cx + Math.floor(cw / 2) - 4, y0, 9, 2, 'azul-oficina-0');
  }
  // Patas de `azul-oficina` con faldón.
  const yPatas = y0 + fondo + canto;
  const izquierda = x0 + 4;
  const derecha = x0 + ancho - 9;
  l.rect(izquierda + 5, yPatas, derecha - izquierda - 5, 2, 'azul-oficina-1');
  for (const px of [izquierda, derecha]) pataPanel(l, px, yPatas, patas, 5);
  // Barras con sus jugadores y mangos en los dos extremos.
  const separacion = horizontal ? (cw - 10) / 7 : (ch - 10) / 7;
  BARRAS.forEach((b, i) => {
    const pos = Math.round(5 + i * separacion);
    for (let h = 0; h < b.hombres; h++) {
      const largoBarra = horizontal ? ch : cw;
      const paso = Math.floor((largoBarra - 6) / Math.max(b.hombres, 2));
      const centro = Math.round(largoBarra / 2 - ((b.hombres - 1) * paso) / 2 + h * paso);
      if (horizontal) jugador(l, cx + pos - 1, cy + centro - 1, b.rojo);
      else jugador(l, cx + centro - 1, cy + pos - 1, b.rojo);
    }
    if (horizontal) {
      l.rect(cx + pos, cy, 1, ch, 'metal-3'); // barra
      mango(l, cx + pos - 1, y0 - 2); // mango norte
      mango(l, cx + pos - 1, y0 + fondo + canto - 1); // mango sur, delante del canto
    } else {
      l.rect(cx, cy + pos, cw, 1, 'metal-3');
      mango(l, x0 - 3, cy + pos - 1); // mango oeste
      mango(l, x0 + ancho, cy + pos - 1); // mango este
    }
  });
  contornoGather(l);
  sombraEstandar(l);
  oscuridadBajo(l, izquierda + 6, yPatas + 2, derecha - izquierda - 7, 3);
  return l;
}

export function dibujoFutbolin(): DibujoObjeto {
  return { rampaBase: 'cuero', vistas: { S: futbolin('S'), E: futbolin('E') } };
}
