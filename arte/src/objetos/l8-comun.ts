/**
 * Ayudas del lote 8 (atlas `objetos-v9`): el molde del estilo Gather v2 medido (ver `GUIA-ESTILO-GATHER-V2.md`).
 *
 * Reúne en un solo lugar lo que todo objeto del molde comparte:
 *  - Los roles de color: contorno, pizarra (escritorios y carcasas), plásticos azul marino, pantallas.
 *  - El acabado: contorno azul marino de 1 px y sombra de dos tonos (suelo) o reborde de 1 px (apoyado).
 *  - Las piezas que se repiten en todos los puestos: monitor de frente y en ángulo, torre con luces, teclado,
 *    ratón, control de videojuego, tazas, cuaderno, lámpara.
 *  - Los contenidos de pantalla (código, gráficos, datos, terminal, ciudad de neón, partitura, diseño).
 *
 * Reglas de altura de un puesto Gather (casilla de 32 px, fila 0 arriba):
 *  - Un escritorio de una casilla de fondo mide `ancho * 32` por `32 + 10`: la tapa llega hasta la fila 16 de la
 *    casilla, el labio ocupa las filas 17 a 20 y el frente de la 21 a la 28.
 *  - Lo apoyado se dibuja con su borde de abajo en la fila 10 de su casilla (`FILA_PIE`: el pie del monitor y el borde de
 *    adelante del teclado), hacia el fondo de la tapa, y lo alto sube por encima de la casilla con `sobresale`. Delante
 *    quedan unas 6 filas de tapa libre, como en Gather.
 *  - Todas las pantallas se ven de frente, encendidas y con contenido.
 */

import { Lienzo } from '../nucleo';
import type { ColorEntrada } from '../nucleo';
import { azar, cerrarApoyado, cerrarSuelo, registrar, registrarVariantes } from './l4-comun';
import type { Cuadros } from './l4-comun';

export { azar, cerrarApoyado, cerrarSuelo, registrar, registrarVariantes };
export type { Cuadros };

/** Contorno de todo el molde: azul marino muy oscuro. */
export const CONTORNO: ColorEntrada = 'azul-oficina-0';
export const AZ = (n: 0 | 1 | 2 | 3 | 4): ColorEntrada => `azul-oficina-${n}`;
export const NE = (n: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7): ColorEntrada => `neutro-${n}`;
export const VI = (n: 0 | 1 | 2 | 3): ColorEntrada => `vidrio-${n}`;
/** Pizarra: gris azulado de los escritorios y los equipos (rampa medida en Gather v2). */
export const PZ = (n: 0 | 1 | 2 | 3 | 4 | 5): ColorEntrada => `pizarra-${n}`;
export const MT = (n: 0 | 1 | 2 | 3): ColorEntrada => `metal-${n}`;
export const TG = (n: 0 | 1 | 2 | 3): ColorEntrada => `tela-gris-${n}`;

/** Altura que sobresale un escritorio de una casilla de fondo por encima de su huella. */
export const SOBRESALE_ESCRITORIO = 10;

// ---------------------------------------------------------------------------
// Contenidos de pantalla
// ---------------------------------------------------------------------------

/** Región interior de una pantalla: donde se pinta el contenido. */
export interface Region {
  x: number;
  y: number;
  ancho: number;
  alto: number;
}

const SINTAXIS: readonly ColorEntrada[] = ['morado-3', 'planta-4', 'vidrio-2', 'naranja-4', 'rojo-suave-3', 'tela-calida-3'];

/** Editor de código: fondo oscuro, números de línea y renglones de colores con sangría. */
export function pantallaCodigo(l: Lienzo, r: Region, semilla = 1): void {
  l.rect(r.x, r.y, r.ancho, r.alto, AZ(0));
  const az = azar(semilla * 977);
  const sangrias = [0, 2, 2, 4, 2, 0, 2, 4, 4, 2, 0];
  let fila = 0;
  for (let y = r.y + 1; y < r.y + r.alto; y += 2) {
    const sangria = sangrias[(fila + semilla) % sangrias.length] as number;
    l.px(r.x + 1, y, NE(3));
    let x = r.x + 3 + sangria;
    const limite = r.x + r.ancho - 1;
    let k = 0;
    while (x < limite - 1) {
      const largo = 2 + Math.floor(az() * 4);
      const final = Math.min(limite, x + largo);
      l.rect(x, y, final - x, 1, SINTAXIS[(fila + k + semilla) % SINTAXIS.length] as ColorEntrada);
      x = final + 1;
      k++;
      if (az() < 0.28) break;
    }
    fila++;
  }
}

/** Tablero de gráficos: barras de colores y un círculo con una porción. Fondo claro. */
export function pantallaGraficos(l: Lienzo, r: Region): void {
  l.rect(r.x, r.y, r.ancho, r.alto, NE(7));
  l.rect(r.x, r.y, r.ancho, 2, VI(1));
  l.rect(r.x + 1, r.y, 3, 1, NE(7));
  const base = r.y + r.alto - 2;
  l.rect(r.x + 1, base + 1, Math.max(4, Math.floor(r.ancho * 0.62)), 1, NE(5));
  const colores: readonly ColorEntrada[] = ['rojo-suave-3', 'tela-calida-3', 'planta-3', VI(2), 'morado-3'];
  const alturas = [3, 5, 4, 6, 3, 5];
  const maxBarras = Math.floor((r.ancho * 0.62) / 3);
  for (let i = 0; i < Math.min(maxBarras, alturas.length); i++) {
    const h = Math.min(alturas[i] as number, r.alto - 4);
    l.rect(r.x + 1 + i * 3, base - h + 1, 2, h, colores[i % colores.length] as ColorEntrada);
  }
  const cx = r.x + r.ancho - 5;
  const cy = r.y + Math.floor(r.alto / 2) + 1;
  if (r.ancho >= 16 && r.alto >= 8) {
    l.elipse(cx, cy, 3, 3, VI(2));
    for (let y = -3; y <= 0; y++) for (let x = 0; x <= 3; x++) if (x * x + y * y <= 11) l.px(cx + x, cy + y, 'rojo-suave-3');
    l.px(cx, cy, NE(7));
  }
}

/** Panel de datos: cuadrícula de celdas con alguna resaltada. Fondo claro. */
export function pantallaDatos(l: Lienzo, r: Region): void {
  l.rect(r.x, r.y, r.ancho, r.alto, NE(6));
  l.rect(r.x, r.y, r.ancho, 2, 'planta-3');
  const colores: readonly ColorEntrada[] = [VI(2), 'tela-calida-3', 'planta-3', 'rojo-suave-3', 'morado-3'];
  let k = 0;
  for (let y = r.y + 3; y + 1 < r.y + r.alto; y += 2) {
    for (let x = r.x + 1; x + 3 < r.x + r.ancho; x += 5) {
      l.rect(x, y, 4, 1, (k + y) % 4 === 0 ? (colores[k % colores.length] as ColorEntrada) : NE(4));
      k++;
    }
  }
}

/** Terminal: fondo casi negro, renglones verdes y blancos con un cursor. */
export function pantallaTerminal(l: Lienzo, r: Region): void {
  l.rect(r.x, r.y, r.ancho, r.alto, AZ(0));
  const largos = [0.7, 0.45, 0.8, 0.35, 0.6, 0.5];
  let i = 0;
  for (let y = r.y + 1; y < r.y + r.alto - 1; y += 2) {
    const ancho = Math.max(2, Math.floor((r.ancho - 3) * (largos[i % largos.length] as number)));
    l.rect(r.x + 1, y, 1, 1, 'planta-4');
    l.rect(r.x + 3, y, ancho, 1, i % 3 === 0 ? 'planta-4' : NE(5));
    i++;
  }
  l.rect(r.x + 3, Math.min(r.y + r.alto - 1, r.y + 1 + (i - 1) * 2 + 2), 2, 1, NE(7));
}

/** Documento: barra de título, texto y una imagen. */
export function pantallaDocumento(l: Lienzo, r: Region): void {
  l.rect(r.x, r.y, r.ancho, r.alto, NE(7));
  l.rect(r.x, r.y, r.ancho, 2, 'rojo-suave-3');
  l.rect(r.x + 1, r.y + 3, Math.floor(r.ancho * 0.45), 1, NE(4));
  for (let k = 0; k < 3; k++) l.rect(r.x + 1, r.y + 5 + k * 2, Math.floor(r.ancho * 0.45) - (k % 2), 1, NE(5));
  const ix = r.x + Math.floor(r.ancho * 0.55);
  const iw = r.ancho - Math.floor(r.ancho * 0.55) - 1;
  l.rect(ix, r.y + 3, iw, r.alto - 4, VI(2));
  l.rect(ix, r.y + r.alto - 3, iw, 2, 'planta-3');
  l.px(ix + 2, r.y + 5, 'tela-calida-3');
  l.px(ix + 3, r.y + 5, 'tela-calida-3');
}

/** Ciudad de neón al atardecer (la pantalla de los equipos de juego y de diseño). */
export function pantallaCiudad(l: Lienzo, r: Region, cielo: readonly [ColorEntrada, ColorEntrada, ColorEntrada] = ['morado-1', 'morado-2', 'rojo-suave-3'], sol: ColorEntrada = 'tela-calida-3'): void {
  const { x, y, ancho, alto } = r;
  l.rect(x, y, ancho, Math.max(1, Math.floor(alto * 0.4)), cielo[0]);
  l.rect(x, y + Math.floor(alto * 0.4), ancho, Math.max(1, Math.floor(alto * 0.25)), cielo[1]);
  l.rect(x, y + Math.floor(alto * 0.65), ancho, alto - Math.floor(alto * 0.65), cielo[2]);
  const cx = x + Math.floor(ancho * 0.6);
  const rs = Math.max(2, Math.floor(alto * 0.35));
  for (let j = 0; j < rs; j++) {
    const medio = Math.round(rs * Math.sqrt(Math.max(0, 1 - ((rs - 1 - j) / rs) ** 2)));
    for (let i = cx - medio; i <= cx + medio; i++) l.px(i, y + 1 + j, sol);
  }
  const torres: ReadonlyArray<readonly [number, number, number]> = [[1, 3, 3], [5, 2, 2], [8, 4, 4], [14, 3, 2], [19, 3, 3]];
  for (const [tx, tw, th] of torres) {
    if (tx + tw > ancho) continue;
    l.rect(x + tx, y + alto - th, tw, th, AZ(1));
    l.rect(x + tx, y + alto - th, tw, 1, AZ(2));
  }
  l.rect(x, y + alto - 1, ancho, 1, AZ(0));
}

/** Lienzo de diseño: formas de colores sobre fondo claro con una paleta de color a un lado. */
export function pantallaDiseno(l: Lienzo, r: Region): void {
  l.rect(r.x, r.y, r.ancho, r.alto, NE(7));
  l.rect(r.x, r.y, 3, r.alto, NE(6));
  const muestras: readonly ColorEntrada[] = ['rojo-suave-3', 'tela-calida-3', 'planta-3', VI(2)];
  muestras.forEach((c, i) => {
    if (r.y + 1 + i * 2 < r.y + r.alto) l.rect(r.x + 1, r.y + 1 + i * 2, 1, 1, c);
  });
  l.elipse(r.x + 8, r.y + Math.floor(r.alto / 2), 3, 3, 'rojo-suave-3');
  l.rect(r.x + 11, r.y + 2, Math.max(3, r.ancho - 14), Math.max(3, r.alto - 5), VI(1));
  l.rect(r.x + 11, r.y + r.alto - 3, Math.max(3, r.ancho - 14), 1, 'tela-calida-3');
}

/** Ondas de audio sobre fondo oscuro (equipos de música). */
export function pantallaOndas(l: Lienzo, r: Region, color: ColorEntrada = 'planta-4'): void {
  l.rect(r.x, r.y, r.ancho, r.alto, AZ(0));
  const alturas = [1, 2, 4, 3, 5, 2, 4, 6, 3, 2, 4, 1, 3, 5, 2];
  const mitad = r.y + Math.floor(r.alto / 2);
  for (let i = 0; i < r.ancho - 2; i += 2) {
    const h = Math.min(alturas[(i / 2) % alturas.length] as number, Math.floor((r.alto - 2) / 2));
    l.rect(r.x + 1 + i, mitad - h + 1, 1, h * 2 - 1, i % 6 === 0 ? 'tela-calida-3' : color);
  }
}

// ---------------------------------------------------------------------------
// Monitor
// ---------------------------------------------------------------------------

/**
 * Monitor visto de frente. `(x, y)` es la esquina superior izquierda y `ancho` x `alto` el tamaño total. Bisel azul
 * marino con arista de luz arriba y a la izquierda; la barbilla de abajo lleva un puntito de encendido.
 * Devuelve la región de la pantalla (1 px de bisel arriba y a los lados, 3 px de barbilla abajo).
 */
export function monitor(l: Lienzo, x: number, y: number, ancho: number, alto: number, pintar: (l: Lienzo, r: Region) => void): Region {
  l.rect(x, y, ancho, alto, AZ(1));
  l.rect(x, y, ancho, 1, AZ(3));
  l.rect(x, y + 1, 1, alto - 1, AZ(2));
  l.rect(x + ancho - 1, y + 1, 1, alto - 1, AZ(0));
  l.rect(x + 1, y + alto - 1, ancho - 2, 1, AZ(0));
  const r: Region = { x: x + 1, y: y + 1, ancho: ancho - 2, alto: alto - 4 };
  pintar(l, r);
  // Reflejo del vidrio: esquina de luz.
  l.px(r.x, r.y, NE(7)).px(r.x + 1, r.y, NE(7)).px(r.x, r.y + 1, NE(7));
  // Encendido en la barbilla.
  l.px(x + Math.floor(ancho / 2), y + alto - 2, 'planta-4');
  return r;
}

/**
 * Cuello y pie de un monitor: el cuello baja desde la barbilla (`yCuello`) hasta la base, que es una pastilla de 2 filas
 * cuya última fila es `yBase`. `centro` es la columna del medio del cuello.
 */
export function pieDeMonitor(l: Lienzo, centro: number, yCuello: number, yBase: number, anchoPie = 10): void {
  l.rect(centro - 1, yCuello, 3, yBase - yCuello - 1, AZ(2));
  l.rect(centro - 1, yCuello, 1, yBase - yCuello - 1, AZ(3));
  l.rect(centro + 1, yCuello, 1, yBase - yCuello - 1, AZ(1));
  const x = centro - Math.floor(anchoPie / 2);
  l.rect(x, yBase - 1, anchoPie, 2, AZ(2));
  l.rect(x, yBase - 1, anchoPie, 1, AZ(3));
  l.rect(x + anchoPie - 1, yBase, 1, 1, AZ(1));
}

/**
 * Monitor girado hacia quien trabaja: la pantalla se ve en ángulo (más angosta y con un lado más bajo), como los
 * monitores laterales de los puestos de Gather. `lado` es 'D' si es el de la derecha del puesto (su borde derecho baja)
 * o 'I' si es el de la izquierda (su borde izquierdo baja). `caida` son los píxeles que baja el lado lejano.
 */
export function monitorAngulado(l: Lienzo, x: number, y: number, ancho: number, alto: number, lado: 'D' | 'I', pintar: (l: Lienzo, r: Region) => void, caida = 3): void {
  const plano = new Lienzo(ancho, alto);
  monitor(plano, 0, 0, ancho, alto, pintar);
  for (let i = 0; i < ancho; i++) {
    const t = lado === 'D' ? i / (ancho - 1) : 1 - i / (ancho - 1);
    const dy = Math.round(t * caida);
    l.pegar(plano.recortar(i, 0, 1, alto), x + i, y + dy);
  }
}

// ---------------------------------------------------------------------------
// Torre
// ---------------------------------------------------------------------------

/**
 * Torre de computador de frente: carcasa azul marino con arista de luz, dos bahías de unidad, un botón y una luz de
 * color. `(x, y)` es la esquina superior izquierda. `luz` es el color del indicador (tonos claros: se lee encendida).
 */
export function torre(l: Lienzo, x: number, y: number, ancho: number, alto: number, luz: ColorEntrada = VI(2), lucesExtra: readonly ColorEntrada[] = []): void {
  l.rect(x, y, ancho, alto, AZ(1));
  l.rect(x, y, ancho, 1, AZ(3));
  l.rect(x, y + 1, 1, alto - 1, AZ(2));
  l.rect(x + ancho - 1, y + 1, 1, alto - 1, AZ(0));
  l.rect(x + 1, y + alto - 1, ancho - 2, 1, AZ(0));
  // Dos bahías de unidad.
  for (let k = 0; k < 2; k++) {
    l.rect(x + 2, y + 3 + k * 3, ancho - 4, 1, AZ(0));
    l.rect(x + 2, y + 4 + k * 3, ancho - 4, 1, AZ(2));
  }
  // Botón y luz.
  l.rect(x + 2, y + alto - 7, 2, 2, luz);
  l.px(x + 2, y + alto - 7, NE(7));
  lucesExtra.forEach((c, i) => l.px(x + 2 + i * 2, y + alto - 4, c));
  // Rejilla inferior.
  l.rect(x + 2, y + alto - 3, ancho - 4, 1, AZ(0));
}

// ---------------------------------------------------------------------------
// Teclados, ratones y accesorios
// ---------------------------------------------------------------------------

/**
 * Teclado grueso como los de Gather: visto de frente y un poco desde arriba, de 9 filas. Cuerpo, cuatro hileras de teclas
 * de 2 px con 1 px de separación, una barra espaciadora y el canto de adelante en sombra. `ancho` mínimo 14.
 */
export function teclado(l: Lienzo, x: number, y: number, ancho = 21, cuerpo: ColorEntrada = AZ(2), tecla: ColorEntrada = AZ(4), borde: ColorEntrada = AZ(3)): void {
  l.rect(x, y, ancho, 9, cuerpo);
  l.rect(x, y, ancho, 1, borde);
  l.rect(x, y + 1, 1, 7, borde);
  l.rect(x + ancho - 1, y + 1, 1, 8, AZ(1));
  l.rect(x, y + 8, ancho, 1, AZ(1));
  for (let fila = 0; fila < 3; fila++) {
    for (let i = 2; i < ancho - 2; i += 3) l.rect(x + i, y + 1 + fila * 2, 2, 1, tecla);
  }
  l.rect(x + 4, y + 7, ancho - 8, 1, tecla);
  for (let fila = 0; fila < 3; fila++) for (let i = 2; i < ancho - 2; i += 3) l.px(x + i, y + 2 + fila * 2, AZ(1));
}

/** Teclado claro (blanco y gris): para equipos retro y de diseño. */
export function tecladoClaro(l: Lienzo, x: number, y: number, ancho = 21): void {
  teclado(l, x, y, ancho, NE(5), NE(7), NE(7));
  l.rect(x, y + 8, ancho, 1, NE(3));
  l.rect(x + ancho - 1, y + 1, 1, 8, NE(4));
}

/** Ratón de 5 x 7: cuerpo con luz, línea entre los botones, rueda y el cable que sube hacia el computador. */
export function raton(l: Lienzo, x: number, y: number, color: ColorEntrada = AZ(4)): void {
  l.rect(x + 1, y, 3, 7, color);
  l.rect(x, y + 1, 5, 5, color);
  l.rect(x + 1, y, 3, 1, NE(7));
  l.px(x, y + 1, NE(7));
  l.rect(x + 2, y, 1, 3, AZ(2));
  l.rect(x + 4, y + 2, 1, 4, AZ(3));
  l.rect(x + 1, y + 6, 3, 1, AZ(3));
  l.px(x + 2, y + 1, VI(2));
  l.px(x + 2, y - 1, AZ(3));
  l.px(x + 2, y - 2, AZ(3));
}

/** Alfombrilla de ratón: lámina plana con borde un tono más claro arriba. */
export function alfombrilla(l: Lienzo, x: number, y: number, ancho: number, alto: number, cuerpo: ColorEntrada = AZ(1), borde: ColorEntrada = AZ(2)): void {
  l.rect(x, y, ancho, alto, cuerpo);
  l.rect(x, y, ancho, 1, borde);
  l.rect(x, y + 1, 1, alto - 1, borde);
}

/** Control de videojuego de 15 x 9: cuerpo gris con dos palancas, cruceta y botones de colores. */
export function controlJuego(l: Lienzo, x: number, y: number, color: ColorEntrada = TG(1)): void {
  l.rect(x + 2, y, 11, 6, color);
  l.rect(x + 1, y + 1, 13, 5, color);
  l.rect(x, y + 3, 4, 6, color);
  l.rect(x + 11, y + 3, 4, 6, color);
  l.rect(x + 2, y, 11, 1, TG(2));
  l.rect(x, y + 3, 1, 5, TG(2));
  l.rect(x + 14, y + 4, 1, 5, TG(0));
  l.rect(x + 1, y + 8, 3, 1, TG(0));
  l.rect(x + 11, y + 8, 3, 1, TG(0));
  // Cruceta y palanca izquierda.
  l.rect(x + 3, y + 2, 3, 1, NE(7));
  l.rect(x + 4, y + 1, 1, 3, NE(7));
  l.rect(x + 3, y + 5, 3, 3, TG(0));
  l.px(x + 4, y + 6, TG(3));
  // Palanca derecha y botones.
  l.rect(x + 9, y + 5, 3, 3, TG(0));
  l.px(x + 10, y + 6, TG(3));
  l.px(x + 11, y + 1, 'rojo-suave-3');
  l.px(x + 10, y + 2, VI(2));
  l.px(x + 12, y + 2, 'tela-calida-3');
  l.px(x + 11, y + 3, 'planta-4');
  l.px(x + 7, y + 2, VI(2));
}

/** Taza chica de 5 x 5 con asa y café, en la rampa pedida. */
export function tazaChica(l: Lienzo, x: number, y: number, rampa: string): void {
  l.rect(x, y, 5, 5, `${rampa}-2`);
  l.rect(x, y, 5, 1, `${rampa}-3`);
  l.rect(x, y + 1, 1, 4, `${rampa}-3`);
  l.rect(x + 4, y + 1, 1, 4, `${rampa}-1`);
  l.rect(x + 1, y + 4, 3, 1, `${rampa}-1`);
  l.rect(x + 1, y + 1, 3, 1, 'madera-oscura-1');
  l.rect(x + 5, y + 1, 1, 3, `${rampa}-1`);
}

/** Cuaderno cerrado de 9 x 6 con una etiqueta blanca y un marcador. */
export function cuadernoChico(l: Lienzo, x: number, y: number, rampa = 'rojo-suave'): void {
  l.rect(x, y, 9, 6, `${rampa}-2`);
  l.rect(x, y, 9, 1, `${rampa}-3`);
  l.rect(x, y + 1, 1, 5, `${rampa}-3`);
  l.rect(x + 8, y + 1, 1, 5, `${rampa}-1`);
  l.rect(x + 1, y + 5, 8, 1, `${rampa}-1`);
  l.rect(x + 3, y + 2, 4, 2, NE(7));
  l.rect(x + 3, y + 3, 4, 1, NE(6));
  l.rect(x + 7, y + 4, 1, 2, 'tela-calida-3');
}

/** Luz de color que cicla (teclados y marcos con luces). */
export function ciclo(luces: readonly ColorEntrada[], i: number): ColorEntrada {
  return luces[((i % luces.length) + luces.length) % luces.length] as ColorEntrada;
}

/** Cable fino de `(x0, y0)` a `(x1, y1)`: una línea de 1 px. */
export function cable(l: Lienzo, x0: number, y0: number, x1: number, y1: number, color: ColorEntrada = AZ(2)): void {
  l.linea(x0, y0, x1, y1, color);
}

/**
 * Última fila del cuerpo de lo apoyado en un escritorio (el borde de adelante del teclado, el pie del monitor), según lo
 * que sobresale: la fila 10 de la casilla. En Gather el equipo queda hacia el fondo de la tapa y deja unas 6 filas de
 * tapa libre delante (donde apoya los brazos quien trabaja); la tapa llega hasta la fila 16.
 */
export const FILA_PIE = 10;
export const pie = (sobresale: number): number => sobresale + FILA_PIE;
