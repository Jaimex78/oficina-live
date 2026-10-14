/**
 * Asientos del lote 2A: silla ejecutiva, banco, taburete, banca interior y silla de comedor (los sofás viven en `l2a-sofas.ts`).
 *
 * Estilo Gather (ver `GUIA-ESTILO-GATHER.md`):
 *  - la silla ejecutiva es de azul marino (`azul-oficina`) con respaldo redondeado, cabecero y una base de cinco patas de
 *    `metal` que no cambia de color; las variantes `rojo`, `negro` y `blanco` recolorean solo la tapicería;
 *  - banco, taburete, banca y silla de comedor son de madera clara (`crema`) con un cojín de `azul-oficina`: las variantes
 *    `madera`, `blanco` y `negro` recolorean solo la madera y dejan el cojín azul.
 * Todos con contorno de 1 px en `azul-oficina-0`, luz arriba a la izquierda y una sola sombra abajo a la derecha.
 *
 * Orientación de un asiento: hacia dónde MIRA quien se sienta. En `S` el respaldo queda arriba y se ve el frente;
 * en `N` se ve la espalda de la silla; en `E` y `O` se ve de lado.
 */

import { Lienzo } from '../nucleo';
import type { DibujoObjeto, ParColor } from './l2a-comun';
import { contornoGather, paresDeRampa, recolorearPares, sombraEstandar } from './l2a-comun';

// ---------------------------------------------------------------------------
// Variantes
// ---------------------------------------------------------------------------

const TAPIZ = [1, 2, 3, 4] as const;

/** Variantes de la silla ejecutiva: la tapicería de `azul-oficina` pasa a rojo, negro o blanco. El contorno y el metal no cambian. */
export function varianteSillaAzul(base: Lienzo, variante: string): Lienzo | undefined {
  const pares: ParColor[] = [];
  if (variante === 'rojo') pares.push(...paresDeRampa('azul-oficina', 'rojo', TAPIZ));
  else if (variante === 'negro') pares.push(...paresDeRampa('azul-oficina', 'neutro', TAPIZ, [1, 2, 3, 4]));
  else if (variante === 'blanco') pares.push(...paresDeRampa('azul-oficina', 'neutro', TAPIZ, [4, 5, 6, 7]));
  else return undefined;
  return recolorearPares(base, pares);
}

/** Variantes de un asiento de madera clara con cojín azul: la rampa `crema` cambia, el cojín no. */
export function varianteMaderaCrema(base: Lienzo, variante: string): Lienzo | undefined {
  const tonos = [0, 1, 2, 3, 4];
  if (variante === 'madera') return recolorearPares(base, paresDeRampa('crema', 'madera-clara', tonos));
  if (variante === 'blanco') return recolorearPares(base, paresDeRampa('crema', 'neutro', tonos, [3, 4, 5, 6, 7]));
  if (variante === 'negro') return recolorearPares(base, paresDeRampa('crema', 'neutro', tonos, [0, 1, 2, 3, 4]));
  return undefined;
}

// ---------------------------------------------------------------------------
// Piezas de la silla ejecutiva
// ---------------------------------------------------------------------------

const AZ = { sombra: 'azul-oficina-1', medio: 'azul-oficina-2', luz: 'azul-oficina-3', brillo: 'azul-oficina-4' } as const;

/**
 * Pieza tapizada redondeada con luz arriba a la izquierda: sombra de fondo, cuerpo un paso más pequeño y luz en el borde
 * de arriba y de la izquierda. `radio` 5 da una curva amplia (recorta 4 px la esquina), 3 una más cerrada.
 */
function tapizado(l: Lienzo, x: number, y: number, ancho: number, alto: number, radio: number, tonos: { sombra: string; medio: string; luz: string } = AZ): void {
  l.rectRedondeado(x, y, ancho, alto, radio, tonos.sombra);
  l.rectRedondeado(x, y, ancho - 1, alto - 1, radio, tonos.medio);
  l.rect(x + radio - 1, y, ancho - 2 * radio + 1, 1, tonos.luz);
  l.rect(x, y + radio - 1, 1, alto - 2 * radio + 1, tonos.luz);
}

/** Base de cinco brazos de metal vista de frente, con columna, brazos y ruedas. */
function baseGiratoria(l: Lienzo, yColumna: number): void {
  l.rect(15, yColumna, 2, 3, 'metal-2');
  l.rect(16, yColumna, 1, 3, 'metal-1');
  const y = yColumna + 3;
  l.rect(9, y, 14, 1, 'metal-1');
  l.rect(9, y, 5, 1, 'metal-2');
  l.linea(9, y, 6, y + 2, 'metal-1');
  l.linea(22, y, 25, y + 2, 'metal-1');
  l.rect(15, y + 1, 2, 1, 'metal-1');
  for (const x of [5, 15, 25]) l.rect(x, y + 2, 2, 1, 'metal-0');
}

/** Apoyabrazos de plástico visto de frente: almohadilla con brillo y poste fino. */
function apoyabrazos(l: Lienzo, x: number, yAlmohadilla: number, poste: number): void {
  l.rect(x + 2, yAlmohadilla + 3, 1, poste, 'metal-1');
  l.rectRedondeado(x, yAlmohadilla, 5, 3, 2, 'metal-2');
  l.rect(x + 1, yAlmohadilla, 3, 1, 'metal-3');
}

// ---------------------------------------------------------------------------
// Silla ejecutiva
// ---------------------------------------------------------------------------

/** Frente: respaldo alto redondeado con cabecero y una costura, apoyabrazos y asiento mullido. 32 x 40. */
function ejecutivaS(): Lienzo {
  const l = new Lienzo(32, 40);
  apoyabrazos(l, 3, 18, 6);
  apoyabrazos(l, 25, 18, 6);
  // Respaldo alto con cabecero más claro.
  tapizado(l, 8, 1, 16, 22, 5);
  l.rectRedondeado(10, 2, 12, 7, 3, AZ.luz); // cabecero
  l.rect(12, 3, 7, 1, AZ.brillo);
  l.rect(10, 9, 12, 1, AZ.sombra); // costura bajo el cabecero
  l.rect(11, 16, 10, 1, AZ.sombra); // costura de la zona lumbar
  // Asiento mullido: cara superior clara y frente en sombra.
  l.rectRedondeado(6, 23, 20, 10, 4, AZ.sombra);
  l.rectRedondeado(6, 23, 20, 8, 4, AZ.medio);
  l.rectRedondeado(7, 23, 18, 5, 3, AZ.luz);
  l.rect(9, 24, 8, 1, AZ.brillo);
  baseGiratoria(l, 33);
  contornoGather(l);
  return sombraEstandar(l);
}

/** Espalda: se ve la parte de atrás del respaldo, los apoyabrazos a los lados y el asiento como alas a los costados. */
function ejecutivaN(): Lienzo {
  const l = new Lienzo(32, 40);
  // Asiento, lejos: el respaldo lo tapa y solo se ven sus alas laterales.
  tapizado(l, 6, 14, 20, 10, 4);
  apoyabrazos(l, 3, 14, 6);
  apoyabrazos(l, 25, 14, 6);
  // Respaldo por detrás: carcasa redondeada con dos nervios horizontales.
  tapizado(l, 8, 8, 16, 27, 6);
  l.rect(11, 15, 10, 1, AZ.sombra);
  l.rect(11, 21, 10, 1, AZ.sombra);
  l.rect(11, 27, 10, 1, AZ.sombra);
  l.rectRedondeado(12, 10, 8, 3, 2, AZ.luz); // luz en el borde de arriba
  baseGiratoria(l, 33);
  contornoGather(l);
  return sombraEstandar(l);
}

/**
 * De lado hacia el este: respaldo a la izquierda y asiento a la derecha. El oeste es la misma silla vista
 * hacia el otro lado, con las luces y las sombras vueltas a colocar (la luz sigue a la izquierda).
 */
function ejecutivaLado(oeste: boolean): Lienzo {
  const l = new Lienzo(32, 40);
  const dx = (x: number, ancho: number): number => (oeste ? 32 - x - ancho : x);
  // Respaldo con recline: cabecero hacia atrás y lumbar adelantada.
  l.rectRedondeado(dx(5, 7), 1, 7, 10, 3, AZ.luz);
  l.rect(dx(5, 7) + (oeste ? 0 : 5), 3, 2, 7, AZ.medio);
  l.rect(dx(6, 6), 10, 6, 7, AZ.medio);
  l.rect(dx(6, 6) + (oeste ? 0 : 5), 10, 1, 7, AZ.sombra);
  l.rectRedondeado(dx(7, 6), 16, 6, 10, 3, AZ.medio);
  l.rect(dx(7, 6) + (oeste ? 0 : 5), 17, 1, 8, AZ.sombra);
  l.rect(dx(oeste ? 8 : 7, 4), 18, 1, 6, AZ.luz);
  // Asiento mullido visto de lado.
  l.rectRedondeado(dx(9, 18), 24, 18, 10, 4, AZ.sombra);
  l.rectRedondeado(dx(9, 18), 24, 17, 8, 4, AZ.medio);
  l.rectRedondeado(dx(oeste ? 10 : 10, 16), 24, 16, 5, 3, AZ.luz);
  // Apoyabrazos del lado visible: almohadilla corta sobre la mitad delantera del asiento.
  l.rectRedondeado(dx(oeste ? 8 : 15, 10), 18, 10, 3, 2, 'metal-2');
  l.rect(dx(oeste ? 9 : 16, 8), 18, 8, 1, 'metal-3');
  l.rect(dx(oeste ? 11 : 20, 2), 21, 1, 4, 'metal-1');
  // Columna y base vistas de lado.
  l.rect(dx(15, 2), 34, 2, 2, 'metal-2');
  l.rect(dx(16, 1), 34, 1, 2, 'metal-1');
  l.rect(dx(7, 18), 36, 18, 1, 'metal-1');
  l.rect(dx(oeste ? 14 : 7, 5), 36, 5, 1, 'metal-2');
  for (const x of [6, 15, 24]) l.rect(dx(x, 2), 37, 2, 1, 'metal-0');
  contornoGather(l);
  return sombraEstandar(l);
}

export function dibujoSillaEjecutiva(): DibujoObjeto {
  return { rampaBase: 'azul-oficina', vistas: { S: ejecutivaS(), N: ejecutivaN(), E: ejecutivaLado(false), O: ejecutivaLado(true) }, variante: varianteSillaAzul };
}

// ---------------------------------------------------------------------------
// Madera clara con cojín azul: silla de comedor, banco, taburete y banca
// ---------------------------------------------------------------------------

const MA = { sombra: 'crema-1', medio: 'crema-2', tapa: 'crema-3', luz: 'crema-4' } as const;

/** Pata de madera clara: dos o tres píxeles con luz a la izquierda y sombra a la derecha. */
function patita(l: Lienzo, x: number, y: number, alto: number, ancho = 2): void {
  l.rect(x, y, ancho, alto, MA.medio);
  l.rect(x, y, 1, alto, MA.tapa);
  l.rect(x + ancho - 1, y, 1, alto, MA.sombra);
}

/** Cojín azul redondeado visto desde arriba o de frente: sombra, cuerpo y luz. */
function cojinAzul(l: Lienzo, x: number, y: number, ancho: number, alto: number, radio = 3): void {
  tapizado(l, x, y, ancho, alto, radio);
}

/** Frente: respaldo de madera con listones y travesaño, cojín azul en el asiento y patas delanteras. */
function comedorS(): Lienzo {
  const l = new Lienzo(32, 32);
  // Patas traseras, asoman entre las delanteras.
  patita(l, 11, 23, 5, 1);
  patita(l, 20, 23, 5, 1);
  // Respaldo: travesaño redondeado y listones separados por líneas oscuras.
  l.rectRedondeado(9, 2, 14, 12, 3, MA.medio);
  l.rect(11, 2, 10, 2, MA.luz);
  l.rect(9, 5, 14, 1, MA.sombra);
  for (const x of [13, 18]) l.rect(x, 6, 1, 8, MA.sombra);
  l.rect(9, 6, 1, 7, MA.tapa);
  l.rect(22, 6, 1, 7, MA.sombra);
  // Asiento de madera con el cojín azul encima.
  l.rectRedondeado(8, 14, 16, 10, 3, MA.medio);
  l.rect(8, 22, 16, 2, MA.sombra);
  cojinAzul(l, 9, 14, 14, 8, 3);
  // Patas delanteras.
  patita(l, 9, 24, 6, 2);
  patita(l, 21, 24, 6, 2);
  contornoGather(l);
  return sombraEstandar(l);
}

/** Espalda: el respaldo tapa casi todo el asiento; se ven los montantes, los listones y las patas traseras. */
function comedorN(): Lienzo {
  const l = new Lienzo(32, 32);
  // Borde lejano del asiento con su cojín, a ambos lados del respaldo.
  l.rectRedondeado(8, 8, 16, 9, 3, MA.medio);
  cojinAzul(l, 9, 8, 14, 7, 3);
  // Respaldo por detrás.
  l.rectRedondeado(9, 10, 14, 15, 3, MA.medio);
  l.rect(11, 10, 10, 2, MA.luz);
  l.rect(9, 13, 14, 1, MA.sombra);
  for (const x of [13, 18]) l.rect(x, 14, 1, 9, MA.sombra);
  l.rect(9, 14, 1, 8, MA.tapa);
  l.rect(22, 14, 1, 8, MA.sombra);
  l.rect(9, 23, 14, 2, MA.sombra);
  // Patas traseras.
  patita(l, 9, 25, 5, 2);
  patita(l, 21, 25, 5, 2);
  contornoGather(l);
  return sombraEstandar(l);
}

/** De lado: el respaldo a un extremo, el asiento con su cojín extendido hacia delante y dos patas. `oeste` mira hacia la izquierda. */
function comedorLado(oeste: boolean): Lienzo {
  const l = new Lienzo(32, 32);
  const dx = (x: number, ancho: number): number => (oeste ? 32 - x - ancho : x);
  // Montante trasero: sube desde el piso hasta el borde del respaldo.
  l.rectRedondeado(dx(8, 3), 3, 3, 27, 2, MA.medio);
  l.rect(dx(oeste ? 10 : 8, 1), 4, 1, 25, MA.tapa);
  l.rect(dx(oeste ? 8 : 10, 1), 4, 1, 25, MA.sombra);
  l.rect(dx(9, 1), 3, 1, 1, MA.luz);
  // Asiento de madera con el cojín azul encima.
  l.rectRedondeado(dx(8, 17), 15, 17, 9, 3, MA.medio);
  l.rect(dx(8, 17), 22, 17, 2, MA.sombra);
  cojinAzul(l, dx(9, 15), 14, 15, 8, 3);
  // Pata delantera y travesaño entre patas.
  patita(l, dx(21, 3), 24, 6, 3);
  l.rect(dx(11, 10), 27, 10, 1, MA.sombra);
  contornoGather(l);
  return sombraEstandar(l);
}

export function dibujoSillaComedor(): DibujoObjeto {
  return { rampaBase: 'crema', vistas: { S: comedorS(), N: comedorN(), E: comedorLado(false), O: comedorLado(true) }, variante: varianteMaderaCrema };
}

/** Banco acolchado: asiento de cojín azul sobre un marco de madera clara con cuatro patas. */
export function dibujoBanco(): DibujoObjeto {
  const l = new Lienzo(32, 32);
  // Patas traseras, asoman entre las delanteras.
  patita(l, 8, 20, 6, 2);
  patita(l, 22, 20, 6, 2);
  // Marco de madera y canto.
  l.rectRedondeado(4, 14, 24, 10, 3, MA.medio);
  l.rect(4, 22, 24, 2, MA.sombra);
  // Cojín azul con dos botones.
  cojinAzul(l, 5, 11, 22, 11, 4);
  l.px(11, 16, AZ.sombra);
  l.px(20, 16, AZ.sombra);
  // Patas delanteras y travesaño.
  patita(l, 5, 24, 6, 3);
  patita(l, 24, 24, 6, 3);
  l.rect(8, 26, 16, 1, MA.sombra);
  contornoGather(l);
  sombraEstandar(l);
  return { rampaBase: 'crema', vistas: { U: l }, variante: varianteMaderaCrema };
}

/** Taburete alto: cojín redondo azul sobre un aro de madera, tres patas gruesas abiertas y un travesaño para los pies. */
export function dibujoTaburete(): DibujoObjeto {
  const l = new Lienzo(32, 32);
  // Pata trasera, vertical y en sombra: asoma entre las delanteras.
  l.rect(14, 19, 4, 10, MA.sombra);
  // Patas delanteras gruesas (3 px) que se abren hacia los lados.
  for (let k = 0; k < 11; k++) {
    const d = Math.floor((k * 4) / 10);
    l.rect(11 - d, 19 + k, 3, 1, MA.tapa);
    l.px(13 - d, 19 + k, MA.medio);
    l.rect(18 + d, 19 + k, 3, 1, MA.medio);
    l.px(20 + d, 19 + k, MA.sombra);
  }
  // Travesaño para los pies.
  l.rect(9, 24, 14, 2, MA.medio);
  l.rect(9, 25, 14, 1, MA.sombra);
  // Asiento: aro de madera y cojín redondo azul con un botón al centro.
  l.elipse(16, 16, 10, 5, MA.sombra);
  l.elipse(16, 15, 10, 5, MA.medio);
  l.elipseSombreada(16, 14, 9, 4, [AZ.sombra, AZ.medio, AZ.luz], { relieve: 0.55, umbrales: [0.28, 0.78] });
  l.px(16, 14, AZ.sombra);
  contornoGather(l);
  sombraEstandar(l);
  return { rampaBase: 'crema', vistas: { U: l }, variante: varianteMaderaCrema };
}

// ---------------------------------------------------------------------------
// Banca interior (madera clara con cojines azules)
// ---------------------------------------------------------------------------

/** Banca de recepción de 2 x 1: respaldo bajo y asiento de madera clara con dos cojines azules y patas de madera. */
function bancaS(): Lienzo {
  const l = new Lienzo(64, 32);
  // Respaldo bajo de listones.
  l.rectRedondeado(4, 3, 56, 10, 3, MA.medio);
  l.rect(7, 3, 50, 2, MA.luz);
  l.rect(4, 8, 56, 1, MA.sombra);
  l.rect(4, 11, 56, 2, MA.sombra);
  // Asiento y canto, con dos cojines azules.
  l.rectRedondeado(3, 12, 58, 12, 3, MA.medio);
  l.rect(3, 22, 58, 2, MA.sombra);
  cojinAzul(l, 5, 12, 26, 9, 3);
  cojinAzul(l, 33, 12, 26, 9, 3);
  // Patas: una en cada extremo y una al centro.
  for (const x of [6, 30, 55]) patita(l, x, 24, 6, 3);
  contornoGather(l);
  return sombraEstandar(l);
}

function bancaE(): Lienzo {
  const l = new Lienzo(32, 64);
  // Respaldo: banda vertical a la izquierda (oeste).
  l.rectRedondeado(3, 3, 7, 53, 3, MA.medio);
  l.rect(4, 3, 2, 52, MA.tapa);
  l.rect(9, 5, 1, 50, MA.sombra);
  // Asiento: marco de madera con dos cojines azules en fila hacia el sur.
  l.rectRedondeado(10, 3, 18, 53, 3, MA.medio);
  cojinAzul(l, 11, 5, 16, 24, 4);
  cojinAzul(l, 11, 31, 16, 24, 4);
  l.rect(3, 55, 25, 3, MA.sombra);
  // Patas del extremo sur.
  for (const x of [5, 22]) patita(l, x, 58, 4, 3);
  contornoGather(l);
  return sombraEstandar(l);
}

export function dibujoBancaInterior(): DibujoObjeto {
  return { rampaBase: 'crema', vistas: { S: bancaS(), E: bancaE() }, variante: varianteMaderaCrema };
}
