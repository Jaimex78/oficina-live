/**
 * Cocina y descanso del lote 2B: microondas, dispensador de agua, máquina expendedora, barra,
 * cafetera, tostadora, frutero, nevera de bebidas y lavaplatos.
 *
 * Estilo Gather: formas blandas y redondeadas, contorno azul marino, colores suaves con acentos saturados.
 * Los apoyados (microondas, cafetera, tostadora, frutero) se dibujan sobre la tapa de un mesón:
 * su última fila de cuerpo es `FILA_APOYO` y la sombra cae sobre la tapa.
 */

import { Lienzo } from '../nucleo';
import { FILA_APOYO, MOSTRADORES, construirCategoria, cuerpoBlando, dentroElipse, esquinas, registrar, registrarVariantes, terminar, vetas } from './l2b-comun';
import type { Constructores, Cuadros, EstiloMostrador } from './l2b-comun';

const LADO = 32;
const B = FILA_APOYO;

// ---------------------------------------------------------------------------
// Apoyados
// ---------------------------------------------------------------------------

/** Microondas blanco azulado: puerta de vidrio oscuro con un plato dentro, panel con pantalla y botones de colores. */
export function dibujarMicroondas(): Lienzo {
  const l = new Lienzo(LADO, LADO);
  cuerpoBlando(l, 4, 4, 24, 12, 3, ['baldosa-gris-3', 'baldosa-gris-4', 'neutro-7']);
  // Puerta: marco, vidrio oscuro, plato con comida y reflejo.
  l.rectRedondeado(6, 6, 14, 8, 2, 'azul-oficina-3');
  l.rectRedondeado(7, 7, 12, 6, 1, 'azul-oficina-1');
  l.elipse(13, 11, 4, 1, 'neutro-6');
  l.rect(11, 10, 5, 1, 'naranja-3');
  l.px(12, 10, 'naranja-4');
  l.linea(8, 12, 10, 8, 'azul-oficina-3');
  l.px(9, 8, 'azul-oficina-4');
  // Manija y panel.
  l.rect(20, 7, 1, 6, 'azul-oficina-3');
  l.rect(22, 6, 5, 3, 'azul-oficina-1');
  l.rect(22, 7, 3, 1, 'hoja-pastel-4');
  l.rect(22, 10, 2, 1, 'naranja-2');
  l.rect(25, 10, 2, 1, 'azul-oficina-3');
  l.rect(22, 12, 5, 2, 'rojo-3');
  l.rect(22, 12, 5, 1, 'rojo-4');
  return terminar(l);
}

/** Cafetera de cápsulas roja con una taza blanca bajo el pico, bandeja y un botón encendido. */
export function dibujarCafetera(): Lienzo {
  const l = new Lienzo(LADO, LADO);
  // Bandeja.
  l.rectRedondeado(7, 13, 16, 3, 2, 'azul-oficina-2');
  l.rect(9, 13, 12, 1, 'azul-oficina-4');
  // Cuerpo con el hueco de la taza.
  cuerpoBlando(l, 8, 1, 14, 13, 3, ['rojo-suave-1', 'rojo-suave-2', 'rojo-suave-4']);
  l.rect(10, 5, 10, 7, 'rojo-suave-1');
  l.rect(10, 5, 10, 1, 'rojo-suave-0');
  // Pico y botón.
  l.rect(13, 5, 4, 3, 'neutro-4');
  l.rect(13, 5, 4, 1, 'neutro-6');
  l.rect(18, 2, 2, 2, 'naranja-3');
  l.px(18, 2, 'naranja-4');
  l.rect(10, 2, 5, 2, 'rojo-suave-3');
  // Taza blanca con café.
  l.rectRedondeado(12, 8, 6, 5, 2, 'neutro-7');
  l.rect(17, 8, 1, 5, 'baldosa-gris-4');
  l.rect(12, 8, 6, 1, 'cuero-1');
  l.rect(18, 9, 1, 2, 'neutro-6');
  l.px(19, 10, 'neutro-6');
  return terminar(l);
}

/** Tostadora de menta con cromo, dos rebanadas de pan asomando, palanca roja y un mando. */
export function dibujarTostadora(): Lienzo {
  const l = new Lienzo(LADO, LADO);
  // Cuerpo menta.
  cuerpoBlando(l, 5, 8, 22, 8, 3, ['hoja-pastel-1', 'hoja-pastel-3', 'hoja-pastel-4']);
  // Pan: dos rebanadas con corteza que asoman por las ranuras.
  for (const x of [9, 18]) {
    l.rectRedondeado(x, 2, 6, 8, 2, 'cuero-3');
    l.rectRedondeado(x + 1, 3, 4, 6, 1, 'crema-4');
    l.px(x + 1, 3, 'neutro-7');
    l.rect(x, 9, 6, 1, 'hoja-pastel-1');
  }
  // Brillo cromado, palanca y mando.
  l.rect(7, 12, 18, 1, 'neutro-7');
  l.rect(7, 13, 18, 1, 'hoja-pastel-2');
  l.rect(24, 10, 2, 3, 'rojo-suave-3');
  l.px(24, 10, 'rojo-suave-4');
  l.rect(8, 10, 3, 2, 'azul-oficina-3');
  l.px(8, 10, 'azul-oficina-4');
  return terminar(l);
}

/** Frutero de madera clara con manzana roja, naranja, pera y ciruela. */
export function dibujarFrutero(): Lienzo {
  const l = new Lienzo(LADO, LADO);
  const cx = 16;
  const cy = B - 6;
  // Interior oscuro del cuenco.
  l.elipse(cx, cy, 11, 3, 'crema-0');
  // Frutas, de atrás hacia adelante.
  l.elipseSombreada(cx, cy - 4, 3, 3, ['planta-1', 'planta-2', 'planta-3', 'planta-4']);
  l.elipseSombreada(cx - 6, cy - 2, 4, 4, ['rojo-1', 'rojo-2', 'rojo-3', 'rojo-4']);
  l.px(cx - 5, cy - 7, 'planta-3');
  l.px(cx - 4, cy - 7, 'planta-2');
  l.elipseSombreada(cx + 6, cy - 2, 4, 4, ['naranja-1', 'naranja-2', 'naranja-3', 'naranja-4']);
  l.elipseSombreada(cx, cy - 1, 3, 3, ['morado-1', 'morado-2', 'morado-3', 'morado-4']);
  // Pared exterior del cuenco, por filas.
  const semiancho = [11, 11, 10, 9, 8, 6, 4];
  semiancho.forEach((h, i) => {
    const y = cy + i;
    for (let x = cx - h; x <= cx + h; x++) {
      if (dentroElipse(x, y, cx, cy, 11, 3)) continue;
      const t = x - (cx - h);
      l.px(x, y, i === semiancho.length - 1 ? 'crema-1' : t < 3 ? 'crema-4' : t > 2 * h - 3 ? 'crema-1' : 'crema-3');
    }
  });
  // Labio de la boca con brillo a la izquierda.
  for (let x = cx - 11; x <= cx + 11; x++) {
    for (let y = cy; y <= cy + 4; y++) {
      if (dentroElipse(x, y, cx, cy, 11, 3) && !dentroElipse(x, y, cx, cy, 10, 2)) l.px(x, y, x < cx - 3 ? 'neutro-7' : 'crema-4');
    }
  }
  return terminar(l);
}

// ---------------------------------------------------------------------------
// Aparatos de pie
// ---------------------------------------------------------------------------

/** Dispensador de agua: garrafón azul redondeado, cuerpo blanco azulado, dos grifos, bandeja y gabinete. */
export function dibujarDispensadorAgua(): Lienzo {
  const l = new Lienzo(32, 48);
  // Cuerpo.
  cuerpoBlando(l, 6, 17, 20, 28, 3, ['baldosa-gris-3', 'baldosa-gris-4', 'neutro-7']);
  // Panel de grifos hundido con un grifo azul (frío) y uno rojo (caliente).
  l.rectRedondeado(9, 23, 14, 10, 2, 'baldosa-gris-3');
  l.rect(10, 23, 12, 1, 'baldosa-gris-2');
  l.rect(11, 25, 4, 3, 'vidrio-1');
  l.rect(11, 25, 4, 1, 'vidrio-3');
  l.rect(12, 28, 2, 3, 'metal-2');
  l.rect(17, 25, 4, 3, 'rojo-3');
  l.rect(17, 25, 4, 1, 'rojo-4');
  l.rect(18, 28, 2, 3, 'metal-2');
  // Bandeja de goteo con rejilla y gabinete con su manija.
  l.rectRedondeado(8, 35, 16, 4, 1, 'azul-oficina-3');
  l.rect(9, 36, 14, 1, 'azul-oficina-2');
  l.rect(9, 38, 14, 1, 'azul-oficina-2');
  l.rect(8, 40, 16, 1, 'baldosa-gris-3');
  l.rect(21, 41, 2, 2, 'azul-oficina-3');
  // Garrafón: botella azul con cuello, brillo a la izquierda, sombra a la derecha y nivel del agua.
  l.rect(12, 14, 8, 4, 'vidrio-1');
  l.rect(12, 14, 1, 4, 'vidrio-2');
  l.rect(19, 14, 1, 4, 'vidrio-0');
  l.rect(11, 17, 10, 2, 'azul-oficina-3');
  l.rect(11, 17, 10, 1, 'azul-oficina-4');
  l.rectRedondeado(9, 1, 14, 15, 5, 'vidrio-1');
  l.rect(9, 4, 14, 1, 'vidrio-2');
  l.rect(12, 2, 8, 2, 'vidrio-3');
  l.rect(10, 6, 2, 7, 'vidrio-3');
  l.px(12, 3, 'neutro-7');
  l.rect(21, 6, 2, 8, 'vidrio-0');
  l.rect(14, 14, 4, 1, 'vidrio-0');
  return terminar(l);
}

/** Máquina expendedora roja con tapa gris, vitrina azul con productos, teclado a la derecha y cajón de entrega. */
export function dibujarMaquinaExpendedora(): Lienzo {
  const l = new Lienzo(32, 56);
  // Cuerpo rojo y tapa gris con su pantalla.
  cuerpoBlando(l, 3, 8, 25, 45, 3, ['rojo-suave-1', 'rojo-suave-2', 'rojo-suave-3']);
  cuerpoBlando(l, 3, 2, 25, 10, 3, ['baldosa-gris-2', 'baldosa-gris-3', 'baldosa-gris-4']);
  l.rect(6, 4, 9, 4, 'azul-oficina-1');
  l.rect(7, 5, 5, 1, 'hoja-pastel-4');
  l.rect(7, 6, 3, 1, 'hoja-pastel-3');
  l.rect(18, 5, 2, 2, 'naranja-3');
  l.rect(22, 5, 3, 2, 'azul-oficina-3');
  // Vitrina: marco y fondo azul con una cuadrícula de productos.
  l.rectRedondeado(5, 12, 16, 27, 2, 'azul-oficina-2');
  l.rect(6, 13, 14, 25, 'vidrio-2');
  const colores = ['vidrio-1', 'vidrio-0', 'vidrio-1', 'lavanda-3', 'vidrio-1', 'naranja-3', 'vidrio-1', 'hoja-pastel-3', 'vidrio-0', 'rojo-suave-3'];
  for (let fila = 0; fila < 4; fila++) {
    const y = 14 + fila * 6;
    for (let k = 0; k < 4; k++) {
      const c = colores[(fila * 3 + k * 2) % colores.length] ?? 'vidrio-1';
      l.rect(7 + k * 3 + (k > 1 ? 0 : 0), y, 2, 4, c);
      l.px(7 + k * 3, y, 'neutro-7');
    }
    l.rect(6, y + 4, 14, 1, 'azul-oficina-3');
  }
  l.linea(8, 36, 12, 31, 'neutro-7');
  // Teclado, pantalla, monedero y lector.
  l.rect(22, 12, 5, 27, 'baldosa-gris-4');
  l.rect(22, 12, 1, 27, 'neutro-7');
  l.rect(23, 13, 4, 3, 'azul-oficina-1');
  l.rect(24, 14, 2, 1, 'hoja-pastel-4');
  for (let fila = 0; fila < 4; fila++) {
    l.rect(23, 18 + fila * 3, 2, 2, 'azul-oficina-3');
    l.px(23, 18 + fila * 3, 'azul-oficina-4');
    l.px(26, 18 + fila * 3, 'azul-oficina-2');
  }
  l.rect(24, 31, 1, 3, 'azul-oficina-1');
  l.rect(23, 35, 4, 3, 'azul-oficina-2');
  l.px(24, 36, 'naranja-3');
  // Cajón de entrega y zócalo.
  l.rectRedondeado(5, 42, 16, 7, 2, 'azul-oficina-2');
  l.rect(6, 43, 14, 5, 'azul-oficina-1');
  l.rect(6, 43, 14, 1, 'azul-oficina-3');
  l.rect(3, 50, 25, 3, 'rojo-suave-1');
  return terminar(l);
}

/** Nevera de bebidas: cuerpo blanco azulado, rótulo luminoso, puerta de vidrio con botellas y latas y rejilla abajo. */
export function dibujarNeveraBebidas(): Lienzo {
  const l = new Lienzo(32, 56);
  cuerpoBlando(l, 4, 3, 24, 50, 3, ['baldosa-gris-3', 'baldosa-gris-4', 'neutro-7']);
  // Rótulo luminoso.
  l.rectRedondeado(6, 5, 20, 6, 2, 'azul-oficina-3');
  l.rect(8, 7, 11, 2, 'neutro-7');
  l.rect(21, 7, 3, 2, 'naranja-3');
  // Puerta de vidrio: marco azul marino y fondo frío.
  l.rectRedondeado(6, 13, 20, 33, 2, 'azul-oficina-2');
  l.rect(7, 14, 18, 31, 'vidrio-3');
  const colores = ['rojo-suave-3', 'hoja-pastel-3', 'naranja-3', 'lavanda-3', 'vidrio-1', 'tela-calida-3'];
  [24, 33, 42].forEach((y, fila) => {
    for (let k = 0; k < 4; k++) {
      const x = 8 + k * 4;
      const c = colores[(fila * 2 + k) % colores.length] ?? 'rojo-suave-3';
      if ((k + fila) % 2 === 0) {
        l.rect(x, y - 6, 3, 6, c);
        l.rect(x, y - 6, 3, 1, 'neutro-6');
        l.rect(x, y - 5, 1, 4, 'neutro-7');
      } else {
        l.rect(x, y - 5, 3, 5, c);
        l.rect(x + 1, y - 7, 1, 2, c);
        l.rect(x + 1, y - 8, 1, 1, 'azul-oficina-3');
        l.rect(x, y - 4, 1, 3, 'neutro-7');
      }
    }
    l.rect(7, y, 18, 1, 'azul-oficina-4');
    l.rect(7, y + 1, 18, 1, 'vidrio-2');
  });
  for (let k = 0; k < 4; k++) l.rect(8 + k * 4, 19, 3, 5, colores[(k * 2 + 1) % colores.length] ?? 'rojo-suave-3');
  l.linea(8, 24, 12, 19, 'neutro-7');
  l.rect(24, 22, 1, 14, 'azul-oficina-1');
  // Rejilla de ventilación.
  l.rect(6, 47, 20, 4, 'azul-oficina-2');
  l.trama(6, 48, 20, 2, 'azul-oficina-1', 'azul-oficina-3', 'lineas-h');
  return terminar(l);
}

// ---------------------------------------------------------------------------
// Mostradores: barra y lavaplatos
// ---------------------------------------------------------------------------

/**
 * Barra de bar: panel trasero, tapa con el material del estilo (blanca con panel azul grisáceo por defecto), labio,
 * frente de listones y reposapiés de metal. La tapa ocupa las mismas filas que la de un escritorio para que lo apoyado encaje.
 */
export function dibujarBarraS(e: EstiloMostrador): Lienzo {
  const l = new Lienzo(96, 40);
  const x0 = 1;
  const w = 92;
  // Panel trasero con cuatro tableros.
  l.rect(x0, 1, w, 9, e.fondo[1]);
  l.rect(x0, 1, w, 1, e.fondo[2]);
  for (const x of [23, 46, 69]) {
    l.rect(x, 3, 1, 6, e.fondo[0]);
    l.rect(x + 1, 3, 1, 6, e.fondo[2]);
  }
  l.rect(x0, 9, w, 1, e.fondo[0]);
  // Tapa.
  l.rect(x0, 10, w, 14, e.tapa[1]);
  l.rect(x0, 10, w, 1, e.tapa[0]);
  l.rect(x0, 11, 1, 13, e.tapa[2]);
  l.rect(x0 + 1, 11, w - 2, 1, e.tapa[2]);
  l.rect(x0 + w - 1, 11, 1, 13, e.tapa[0]);
  if (e.vetas !== null) vetas(l, x0 + 2, 12, w - 4, 11, 4101, e.vetas[0], e.vetas[1], 15);
  // Labio grueso.
  l.rect(x0, 24, w, 1, e.labio[2]);
  l.rect(x0, 25, w, 2, e.labio[1]);
  l.rect(x0, 26, w, 1, e.labio[0]);
  // Frente: listones verticales con una ranura y una luz a la izquierda de cada uno.
  l.rect(x0, 27, w, 8, e.frente[1]);
  if (e.listones !== null) {
    for (let x = 0; x < w; x++) {
      const k = x % 6;
      if (k === 5) l.rect(x0 + x, 27, 1, 8, e.listones);
      else if (k === 0) l.rect(x0 + x, 27, 1, 8, e.frente[2]);
    }
  }
  l.rect(x0, 27, w, 1, e.frente[0]);
  // Zócalo.
  l.rect(x0, 35, w, 2, e.zocalo);
  // Reposapiés: barra de metal con soportes.
  l.rect(4, 31, 86, 1, 'metal-3');
  l.rect(4, 32, 86, 1, 'metal-1');
  for (const x of [12, 46, 80]) l.rect(x, 33, 2, 2, 'metal-2');
  esquinas(l, x0, 1, w, 36);
  return terminar(l);
}

/** Barra girada: el lado largo corre en vertical y el frente de listones mira al este. */
export function dibujarBarraE(e: EstiloMostrador): Lienzo {
  const l = new Lienzo(32, 104);
  const x0 = 2;
  const yFin = 100;
  const largo = yFin - 14;
  // Panel trasero (oeste) y tapa.
  l.rect(x0, 1, 4, largo, e.fondo[1]);
  l.rect(x0, 1, 1, largo, e.fondo[2]);
  l.rect(x0 + 3, 1, 1, largo, e.fondo[0]);
  l.rect(x0 + 4, 1, 14, largo, e.tapa[1]);
  l.rect(x0 + 4, 1, 1, largo, e.tapa[0]);
  l.rect(x0 + 5, 1, 12, 1, e.tapa[2]);
  l.rect(x0 + 17, 2, 1, largo - 1, e.tapa[0]);
  if (e.vetas !== null) vetas(l, x0 + 6, 3, 10, 82, 4102, e.vetas[0], e.vetas[1], 14);
  // Labio y frente (este): franjas horizontales.
  l.rect(x0 + 18, 1, 2, largo, e.labio[1]);
  l.rect(x0 + 18, 1, 1, largo, e.labio[2]);
  l.rect(x0 + 20, 1, 6, largo, e.frente[1]);
  if (e.listones !== null) for (let y = 0; y < largo; y++) if (y % 6 === 5) l.rect(x0 + 20, 1 + y, 6, 1, e.listones);
  l.rect(x0 + 25, 1, 1, largo, e.frente[0]);
  // Reposapiés visto de canto.
  l.rect(x0 + 21, 4, 2, largo - 6, 'metal-3');
  l.rect(x0 + 23, 4, 1, largo - 6, 'metal-1');
  // Extremo sur: se ve la sección completa del mueble.
  const y0 = yFin - 13;
  l.rect(x0, y0, 26, 14, e.frente[1]);
  l.rect(x0, y0, 26, 1, e.labio[2]);
  l.rect(x0, y0 + 1, 26, 2, e.labio[1]);
  l.rect(x0, y0 + 2, 26, 1, e.labio[0]);
  if (e.listones !== null) {
    for (let x = 0; x < 26; x++) {
      const k = x % 6;
      if (k === 5) l.rect(x0 + x, y0 + 3, 1, 8, e.listones);
      else if (k === 0) l.rect(x0 + x, y0 + 3, 1, 8, e.frente[2]);
    }
  }
  l.rect(x0, y0 + 11, 26, 3, e.zocalo);
  l.rect(x0 + 1, y0 + 7, 24, 1, 'metal-3');
  l.rect(x0 + 1, y0 + 8, 24, 1, 'metal-1');
  esquinas(l, x0, 1, 26, yFin);
  return terminar(l);
}

/**
 * Lavaplatos: mostrador blanco con pila de acero y grifo de cuello de cisne, escurridor con platos, salpicadero de
 * baldosa, lavavajillas de acero a la izquierda y alacena azul grisácea a la derecha.
 */
export function dibujarLavaplatosS(): Lienzo {
  const l = new Lienzo(64, 40);
  const x0 = 1;
  const w = 60;
  // Salpicadero de baldosa con juntas desfasadas.
  l.rect(x0, 1, w, 9, 'baldosa-gris-4');
  l.rect(x0, 5, w, 1, 'baldosa-gris-3');
  for (let x = 0; x < w; x++) {
    if (x % 8 === 0) l.rect(x0 + x, 2, 1, 3, 'baldosa-gris-3');
    if (x % 8 === 4) l.rect(x0 + x, 6, 1, 3, 'baldosa-gris-3');
  }
  l.rect(x0, 1, w, 1, 'neutro-7');
  l.rect(x0, 9, w, 1, 'baldosa-gris-2');
  // Tapa clara.
  l.rect(x0, 10, w, 14, 'neutro-6');
  l.rect(x0, 10, w, 1, 'baldosa-gris-3');
  l.rect(x0, 11, w, 1, 'neutro-7');
  l.rect(x0, 11, 1, 13, 'neutro-7');
  l.rect(x0 + w - 1, 11, 1, 13, 'neutro-5');
  // Pila: borde, fondo de acero y desagüe.
  l.rectRedondeado(12, 12, 29, 10, 2, 'azul-oficina-2');
  l.rectRedondeado(13, 13, 27, 8, 1, 'metal-2');
  l.rect(14, 13, 25, 2, 'metal-1');
  l.rect(14, 15, 1, 5, 'metal-3');
  l.rect(15, 19, 24, 1, 'metal-3');
  l.elipse(26.5, 18, 2, 1, 'azul-oficina-1');
  // Escurridor con ranuras y dos platos.
  for (const y of [13, 15, 17, 19, 21]) l.rect(44, y, 15, 1, 'baldosa-gris-3');
  l.elipse(51, 18, 6, 2, 'neutro-7');
  l.elipse(51, 17, 5, 1, 'neutro-6');
  l.rect(46, 19, 11, 1, 'baldosa-gris-3');
  l.rect(48, 16, 6, 1, 'vidrio-2');
  // Grifo de cuello de cisne con su sombra.
  l.rect(30, 3, 2, 9, 'metal-3');
  l.rect(31, 3, 1, 9, 'metal-2');
  l.rect(30, 2, 7, 2, 'metal-3');
  l.rect(36, 2, 2, 5, 'metal-3');
  l.rect(37, 3, 1, 4, 'metal-2');
  l.rect(29, 11, 5, 2, 'metal-2');
  l.px(34, 12, 'vidrio-1');
  // Labio.
  l.rect(x0, 24, w, 1, 'neutro-7');
  l.rect(x0, 25, w, 2, 'azul-oficina-3');
  l.rect(x0, 26, w, 1, 'azul-oficina-2');
  // Lavavajillas: frente de acero con manija y panel.
  l.rect(x0, 27, 29, 10, 'metal-3');
  l.rect(x0, 27, 29, 2, 'metal-2');
  l.rect(x0 + 28, 27, 1, 10, 'metal-2');
  l.rect(x0 + 3, 29, 23, 2, 'azul-oficina-3');
  l.rect(x0 + 3, 31, 23, 1, 'azul-oficina-2');
  l.rect(x0 + 21, 28, 3, 1, 'hoja-pastel-4');
  l.rect(x0 + 2, 33, 25, 1, 'metal-2');
  l.rect(x0, 35, 29, 2, 'azul-oficina-2');
  // Alacena azul grisácea.
  l.rect(x0 + 30, 27, 30, 10, 'azul-oficina-3');
  l.rect(x0 + 30, 27, 30, 1, 'azul-oficina-2');
  l.rect(x0 + 30, 28, 1, 8, 'azul-oficina-4');
  l.rect(x0 + 59, 27, 1, 10, 'azul-oficina-2');
  l.rect(x0 + 44, 27, 1, 8, 'azul-oficina-2');
  l.rect(x0 + 45, 28, 1, 7, 'azul-oficina-4');
  l.rect(x0 + 42, 29, 1, 4, 'neutro-6');
  l.rect(x0 + 47, 29, 1, 4, 'neutro-6');
  l.rect(x0 + 30, 35, 30, 2, 'azul-oficina-2');
  esquinas(l, x0, 1, w, 36);
  return terminar(l);
}

/** Lavaplatos girado: pila en la parte de arriba, el acero del frente a la derecha y la alacena en el extremo sur. */
export function dibujarLavaplatosE(): Lienzo {
  const l = new Lienzo(32, 72);
  const x0 = 2;
  const yFin = 68;
  const largo = yFin - 14;
  // Salpicadero de baldosa (oeste) y tapa clara.
  l.rect(x0, 1, 4, largo, 'baldosa-gris-4');
  l.rect(x0, 1, 1, largo, 'neutro-7');
  l.rect(x0 + 3, 1, 1, largo, 'baldosa-gris-2');
  for (let y = 0; y < largo; y += 8) l.rect(x0 + 1, 1 + y, 2, 1, 'baldosa-gris-3');
  l.rect(x0 + 4, 1, 17, largo, 'neutro-6');
  l.rect(x0 + 4, 1, 17, 1, 'neutro-7');
  l.rect(x0 + 4, 1, 1, largo, 'baldosa-gris-3');
  l.rect(x0 + 20, 2, 1, largo - 1, 'neutro-5');
  // Pila, desagüe y escurridor.
  l.rectRedondeado(x0 + 6, 5, 12, 26, 2, 'azul-oficina-2');
  l.rectRedondeado(x0 + 7, 6, 10, 24, 1, 'metal-2');
  l.rect(x0 + 8, 6, 2, 24, 'metal-1');
  l.rect(x0 + 15, 7, 1, 22, 'metal-3');
  l.elipse(x0 + 12, 22, 2, 2, 'azul-oficina-1');
  for (const y of [35, 38, 41]) l.rect(x0 + 7, y, 11, 1, 'baldosa-gris-3');
  l.elipse(x0 + 12, 46, 5, 3, 'neutro-7');
  l.elipse(x0 + 12, 45, 4, 2, 'neutro-6');
  // Grifo visto desde el lado.
  l.rect(x0 + 5, 3, 3, 3, 'metal-3');
  l.rect(x0 + 6, 3, 1, 3, 'metal-2');
  l.rect(x0 + 8, 3, 6, 2, 'metal-3');
  // Frente (este): acero del lavavajillas arriba y alacena en el extremo.
  l.rect(x0 + 21, 1, 5, 40, 'metal-3');
  l.rect(x0 + 21, 1, 1, 40, 'neutro-7');
  l.rect(x0 + 25, 1, 1, 40, 'metal-2');
  l.rect(x0 + 22, 8, 2, 22, 'azul-oficina-3');
  l.rect(x0 + 21, 41, 5, yFin - 54, 'azul-oficina-3');
  l.rect(x0 + 25, 41, 1, yFin - 54, 'azul-oficina-2');
  // Extremo sur: sección con las dos puertas.
  const y0 = yFin - 13;
  l.rect(x0, y0, 26, 14, 'azul-oficina-3');
  l.rect(x0, y0, 26, 1, 'neutro-7');
  l.rect(x0, y0 + 1, 26, 2, 'azul-oficina-4');
  l.rect(x0, y0 + 2, 26, 1, 'azul-oficina-2');
  l.rect(x0, y0 + 3, 1, 8, 'azul-oficina-4');
  l.rect(x0 + 25, y0 + 3, 1, 8, 'azul-oficina-2');
  l.rect(x0 + 12, y0 + 3, 1, 8, 'azul-oficina-2');
  l.rect(x0 + 13, y0 + 3, 1, 8, 'azul-oficina-4');
  l.rect(x0 + 10, y0 + 5, 1, 4, 'neutro-6');
  l.rect(x0 + 15, y0 + 5, 1, 4, 'neutro-6');
  l.rect(x0, y0 + 11, 26, 3, 'azul-oficina-2');
  esquinas(l, x0, 1, 26, yFin);
  return terminar(l);
}

// ---------------------------------------------------------------------------
// Registro
// ---------------------------------------------------------------------------

/** Las cuatro variantes de un mostrador: cada una se dibuja con su propio material, no se recolorea. */
function variantesMostrador(dibujar: (e: EstiloMostrador) => Lienzo): Record<string, Lienzo> {
  return { base: dibujar(MOSTRADORES.base), madera: dibujar(MOSTRADORES.madera), blanco: dibujar(MOSTRADORES.blanco), negro: dibujar(MOSTRADORES.negro) };
}

const CONSTRUCTORES: Constructores = {
  microondas: (c) => registrar(c, 'microondas', 'U', dibujarMicroondas()),
  cafetera: (c) => registrar(c, 'cafetera', 'U', dibujarCafetera()),
  tostadora: (c) => registrar(c, 'tostadora', 'U', dibujarTostadora()),
  frutero: (c) => registrar(c, 'frutero', 'U', dibujarFrutero()),
  'dispensador-agua': (c) => registrar(c, 'dispensador-agua', 'U', dibujarDispensadorAgua()),
  'maquina-expendedora': (c) => registrar(c, 'maquina-expendedora', 'U', dibujarMaquinaExpendedora()),
  'nevera-bebidas': (c) => registrar(c, 'nevera-bebidas', 'U', dibujarNeveraBebidas()),
  barra: (c) => {
    registrarVariantes(c, 'barra', 'S', variantesMostrador(dibujarBarraS));
    registrarVariantes(c, 'barra', 'E', variantesMostrador(dibujarBarraE));
  },
  lavaplatos: (c) => {
    registrar(c, 'lavaplatos', 'S', dibujarLavaplatosS());
    registrar(c, 'lavaplatos', 'E', dibujarLavaplatosE());
  },
};

/** Todos los cuadros de la categoría cocina que ya están dibujados. */
export function cuadrosCocina(): Cuadros {
  return construirCategoria(CONSTRUCTORES);
}
