/**
 * Lo que cuelga de las paredes en el lote 2B: cuadro chico, reloj de pared, espejo, cortinas, corcho,
 * pared de post-its, cartel de cumpleaños y cámara de sala.
 *
 * Geometría (la fijó el lote 1): una pared mide 32 x 64, la cara que mira al sur ocupa de la fila 16 a la 63 del
 * cuadro y el zócalo de madera las 8 últimas. Un colgante de `sobresale` 0 cubre de la fila 32 a la 63 de la pared:
 * su cara visible son las filas 0 a 23 y el zócalo empieza en la fila 24. Con `sobresale` 8 la cara llega a la fila 31
 * y con 16 a la fila 39. Las piezas de pared vertical solo muestran su tapa (franja de 10 px, columnas 11 a 20): lo
 * que cuelga de ellas (orientaciones `E` y `O`) se dibuja como una placa delgada pegada a esa franja.
 *
 * Sombra: un colgante deja una sombra de 1 px a la derecha y abajo sobre la pared.
 */

import { Lienzo, rampa } from '../nucleo';
import type { ColorEntrada } from '../nucleo';
import { azar, construirCategoria, entre, registrar, registrarVariantes, terminar, variantesPorRampa } from './l2b-comun';
import type { Constructores, Cuadros } from './l2b-comun';

/** Acabado de un colgante: contorno tonal y sombra de 1 px sobre la pared (o ninguna si va sobre las personas). */
function acabarColgante(l: Lienzo, sombra = true): Lienzo {
  return terminar(l, sombra ? { desplazamiento: [1, 1] } : { sombra: false });
}

// ---------------------------------------------------------------------------
// Cuadro chico
// ---------------------------------------------------------------------------

/** Cuadro chico de frente: marco oscuro, paspartú blanco y un cartel abstracto con un sol rojo y una barra azul. */
export function dibujarCuadroChicoS(): Lienzo {
  const l = new Lienzo(32, 32);
  l.rect(5, 2, 22, 15, 'neutro-2');
  l.rect(5, 2, 22, 1, 'neutro-3');
  l.rect(5, 2, 1, 15, 'neutro-3');
  l.rect(26, 3, 1, 14, 'neutro-1');
  l.rect(6, 16, 21, 1, 'neutro-1');
  l.rect(7, 4, 18, 11, 'neutro-7');
  l.rect(7, 4, 18, 1, 'neutro-6');
  l.rect(7, 4, 1, 11, 'neutro-6');
  // Arte: fondo crema, sol rojo, barra azul y línea negra.
  l.rect(9, 6, 14, 7, 'pared-calida-3');
  l.elipse(13.5, 9, 2.5, 2.5, 'rojo-3');
  l.px(12, 8, 'rojo-4');
  l.rect(18, 7, 4, 5, 'vidrio-1');
  l.rect(18, 7, 1, 5, 'vidrio-2');
  l.rect(9, 12, 14, 1, 'neutro-1');
  return acabarColgante(l);
}

/** Placa delgada pegada a la franja de una pared vertical: marco y una tira de arte que se ve de canto. */
function placaLateral(l: Lienzo, lado: 'E' | 'O', y0: number, alto: number, ancho: number, marco: readonly [ColorEntrada, ColorEntrada, ColorEntrada], arte: (fila: number) => ColorEntrada): void {
  const x0 = lado === 'E' ? 21 : 11 - ancho;
  for (let i = 0; i < ancho; i++) {
    const esBordeExterior = lado === 'E' ? i === ancho - 1 : i === 0;
    const esBordeInterior = lado === 'E' ? i === 0 : i === ancho - 1;
    l.rect(x0 + i, y0, 1, alto, esBordeExterior ? (lado === 'E' ? marco[2] : marco[0]) : marco[1]);
    if (!esBordeExterior && !esBordeInterior) for (let j = 1; j < alto - 1; j++) l.px(x0 + i, y0 + j, arte(j));
  }
  l.rect(x0, y0, ancho, 1, marco[0]);
  l.rect(x0, y0 + alto - 1, ancho, 1, marco[2]);
}

export function dibujarCuadroChicoLado(lado: 'E' | 'O'): Lienzo {
  const l = new Lienzo(32, 32);
  placaLateral(l, lado, 4, 16, 4, ['neutro-3', 'neutro-2', 'neutro-1'], (j) => (j < 5 ? 'pared-calida-3' : j < 10 ? 'rojo-3' : 'vidrio-1'));
  return acabarColgante(l);
}

// ---------------------------------------------------------------------------
// Reloj de pared
// ---------------------------------------------------------------------------

/** Reloj redondo de pared marcando las diez y diez, con segundero rojo. */
export function dibujarRelojParedS(): Lienzo {
  const l = new Lienzo(32, 32);
  const cx = 15.5;
  const cy = 9.5;
  l.elipse(cx, cy, 8, 8, 'neutro-2');
  l.elipse(cx, cy, 6.5, 6.5, 'neutro-7');
  for (const [x, y] of [[15, 4], [15, 14], [10, 9], [20, 9]] as const) l.rect(x, y, 2, 1, 'neutro-1');
  for (const [x, y] of [[10, 9], [20, 9]] as const) l.rect(x, y, 1, 2, 'neutro-1');
  l.rect(15, 4, 2, 2, 'neutro-1');
  l.rect(15, 14, 2, 1, 'neutro-1');
  // Brillo del aro arriba a la izquierda y sombra abajo a la derecha.
  l.rect(9, 4, 3, 1, 'neutro-4');
  l.px(8, 5, 'neutro-4');
  l.px(7, 7, 'neutro-4');
  l.rect(19, 14, 3, 1, 'neutro-1');
  // Manecillas y centro.
  l.linea(15, 9, 12, 6, 'neutro-1');
  l.linea(16, 9, 20, 5, 'neutro-1');
  l.linea(16, 9, 16, 14, 'rojo-3');
  l.rect(15, 8, 2, 2, 'neutro-1');
  l.px(15, 8, 'neutro-3');
  return acabarColgante(l);
}

export function dibujarRelojParedLado(lado: 'E' | 'O'): Lienzo {
  const l = new Lienzo(32, 32);
  const x0 = lado === 'E' ? 21 : 7;
  l.elipse(x0 + 1.5, 9.5, 2, 8, 'neutro-2');
  l.rect(lado === 'E' ? x0 + 1 : x0 + 1, 3, 2, 13, 'neutro-7');
  l.rect(lado === 'E' ? x0 + 1 : x0 + 2, 5, 1, 1, 'neutro-1');
  l.rect(lado === 'E' ? x0 + 1 : x0 + 2, 9, 1, 1, 'neutro-1');
  l.rect(lado === 'E' ? x0 + 1 : x0 + 2, 13, 1, 1, 'neutro-1');
  l.rect(lado === 'E' ? x0 + 2 : x0, 3, 1, 14, lado === 'E' ? 'neutro-1' : 'neutro-4');
  return acabarColgante(l);
}

// ---------------------------------------------------------------------------
// Cámara de sala
// ---------------------------------------------------------------------------

/** Cámara de videollamadas: barra oscura con el lente al centro, micrófonos a los lados y un soporte a la pared. */
export function dibujarCamaraSalaS(): Lienzo {
  const l = new Lienzo(32, 32);
  l.rectRedondeado(5, 4, 22, 8, 3, 'neutro-2');
  l.rect(7, 4, 18, 1, 'neutro-4');
  l.rect(6, 5, 1, 4, 'neutro-3');
  l.rect(7, 11, 18, 1, 'neutro-1');
  // Lente con destello.
  l.elipse(15.5, 8, 3, 3, 'neutro-5');
  l.elipse(15.5, 8, 2, 2, 'neutro-1');
  l.px(14, 7, 'vidrio-2');
  // Micrófonos y luz de estado.
  for (const x of [8, 10, 21, 23]) l.px(x, 8, 'neutro-1');
  l.rect(23, 6, 2, 1, 'planta-4');
  // Soporte a la pared.
  l.rect(13, 12, 5, 2, 'metal-2');
  l.rect(13, 12, 1, 2, 'metal-3');
  l.rect(11, 14, 9, 1, 'metal-1');
  return acabarColgante(l, false);
}

export function dibujarCamaraSalaLado(lado: 'E' | 'O'): Lienzo {
  const l = new Lienzo(32, 32);
  const x0 = lado === 'E' ? 21 : 5;
  l.rectRedondeado(x0, 4, 6, 8, 2, 'neutro-2');
  l.rect(x0, 4, 6, 1, 'neutro-4');
  l.rect(lado === 'E' ? x0 + 5 : x0, 5, 1, 7, lado === 'E' ? 'neutro-1' : 'neutro-3');
  const xl = lado === 'E' ? x0 + 3 : x0 + 1;
  l.rect(xl, 6, 2, 3, 'neutro-1');
  l.px(xl, 7, 'vidrio-2');
  l.rect(lado === 'E' ? x0 - 2 : x0 + 6, 7, 2, 2, 'metal-2');
  return acabarColgante(l, false);
}

// ---------------------------------------------------------------------------
// Espejo
// ---------------------------------------------------------------------------

/** Espejo alto de pared: marco fino dorado, vidrio claro y dos destellos en diagonal. */
export function dibujarEspejoS(): Lienzo {
  const l = new Lienzo(32, 40);
  l.rectRedondeado(5, 2, 22, 31, 6, 'tela-calida-2');
  l.rect(8, 2, 16, 1, 'tela-calida-3');
  l.rect(5, 8, 1, 18, 'tela-calida-3');
  l.rect(26, 8, 1, 18, 'tela-calida-1');
  l.rect(8, 32, 16, 1, 'tela-calida-1');
  l.rectRedondeado(7, 4, 18, 27, 4, 'vidrio-3');
  l.rectRedondeado(7, 18, 18, 13, 4, 'vidrio-2');
  l.rect(9, 18, 14, 1, 'vidrio-3');
  // Destellos y borde interior en sombra.
  l.linea(10, 22, 17, 8, 'neutro-7');
  l.linea(11, 22, 18, 8, 'neutro-7');
  l.linea(14, 26, 20, 14, 'neutro-7');
  l.rect(24, 8, 1, 20, 'vidrio-2');
  l.rect(9, 30, 14, 1, 'vidrio-1');
  return acabarColgante(l);
}

export function dibujarEspejoLado(lado: 'E' | 'O'): Lienzo {
  const l = new Lienzo(32, 40);
  placaLateral(l, lado, 3, 29, 4, ['tela-calida-3', 'tela-calida-2', 'tela-calida-1'], (j) => (j % 9 < 2 ? 'neutro-7' : j > 14 ? 'vidrio-2' : 'vidrio-3'));
  return acabarColgante(l);
}

// ---------------------------------------------------------------------------
// Cortinas
// ---------------------------------------------------------------------------

/** Una cortina de tela de ancho `ancho`, pliegues verticales (luz, medio, sombra) y borde interior en curva. */
function cortina(l: Lienzo, x: number, ancho: number, hacia: 'der' | 'izq'): void {
  const patron = ['lavanda-3', 'lavanda-2', 'lavanda-2', 'lavanda-1'];
  // Borde interior: ancho del drapeado por fila (más estrecho a la altura del lazo).
  const anchoEn = (y: number): number => {
    const t = (y - 3) / 41;
    const curva = Math.sin(Math.PI * Math.min(1, t * 1.15)) * 0.0;
    return Math.round(ancho - 2 * Math.abs(t - 0.58) * 2.2 + curva);
  };
  for (let y = 3; y <= 44; y++) {
    const w = anchoEn(y);
    for (let i = 0; i < w; i++) {
      const col = hacia === 'der' ? x + i : x + ancho - 1 - i;
      l.px(col, y, patron[(hacia === 'der' ? i : w - 1 - i) % patron.length] ?? 'lavanda-2');
    }
  }
  // Dobladillo y lazo.
  for (let i = 0; i < ancho; i++) {
    const col = hacia === 'der' ? x + i : x + ancho - 1 - i;
    l.px(col, 44, 'lavanda-1');
  }
  const wl = anchoEn(26);
  const xl = hacia === 'der' ? x : x + ancho - wl;
  l.rect(xl, 26, wl, 2, 'lavanda-1');
  l.rect(xl, 26, wl, 1, 'lavanda-3');
}

/** Cortinas abiertas a los dos lados de la ventana, colgando de una barra con remates. El centro queda libre. */
export function dibujarCortinasS(): Lienzo {
  const l = new Lienzo(32, 48);
  cortina(l, 2, 10, 'der');
  cortina(l, 20, 10, 'izq');
  // Barra con remates y anillas.
  l.rect(2, 1, 28, 2, 'metal-2');
  l.rect(2, 1, 28, 1, 'metal-3');
  l.elipse(1.5, 1.5, 1.5, 1.5, 'metal-3');
  l.elipse(30.5, 1.5, 1.5, 1.5, 'metal-1');
  for (const x of [4, 7, 10, 22, 25, 28]) l.rect(x, 3, 1, 2, 'metal-3');
  return acabarColgante(l);
}

export function dibujarCortinasLado(lado: 'E' | 'O'): Lienzo {
  const l = new Lienzo(32, 48);
  const x0 = lado === 'E' ? 21 : 5;
  const patron = lado === 'E' ? ['lavanda-2', 'lavanda-1', 'lavanda-2', 'lavanda-3', 'lavanda-1', 'lavanda-1'] : ['lavanda-3', 'lavanda-3', 'lavanda-2', 'lavanda-1', 'lavanda-2', 'lavanda-1'];
  for (let y = 4; y <= 44; y++) for (let i = 0; i < 6; i++) l.px(x0 + i, y, patron[i] ?? 'lavanda-2');
  l.rect(x0, 26, 6, 2, 'lavanda-1');
  l.rect(x0, 26, 6, 1, 'lavanda-3');
  l.rect(x0, 44, 6, 1, 'lavanda-1');
  l.rect(lado === 'E' ? x0 - 1 : x0, 2, 7, 2, 'metal-2');
  l.rect(lado === 'E' ? x0 - 1 : x0, 2, 7, 1, 'metal-3');
  return acabarColgante(l);
}

// ---------------------------------------------------------------------------
// Corcho y pared de post-its
// ---------------------------------------------------------------------------

/** Tablero de corcho con marco de nogal, cuatro notas de colores y sus chinchetas. */
export function dibujarCorchoS(): Lienzo {
  const l = new Lienzo(32, 40);
  // Marco de nogal.
  l.rect(3, 6, 26, 21, 'cuero-2');
  l.rect(3, 6, 26, 1, 'cuero-3');
  l.rect(3, 6, 1, 21, 'cuero-3');
  l.rect(28, 7, 1, 20, 'cuero-1');
  l.rect(4, 26, 25, 1, 'cuero-1');
  // Corcho con motas.
  l.rect(5, 8, 22, 17, 'madera-clara-2');
  const r = azar(8101);
  for (let i = 0; i < 46; i++) {
    const x = 5 + entre(r, 0, 21);
    const y = 8 + entre(r, 0, 16);
    l.px(x, y, i % 3 === 0 ? 'madera-clara-3' : 'madera-clara-1');
  }
  l.rect(5, 8, 22, 1, 'madera-clara-1');
  // Notas: amarilla, rosa, azul y blanca, con una raya de texto y su chincheta.
  const notas: Array<[number, number, number, number, ColorEntrada, ColorEntrada]> = [
    [7, 10, 7, 6, 'tela-calida-3', 'tela-calida-1'],
    [16, 9, 7, 5, 'rojo-4', 'rojo-2'],
    [18, 16, 7, 7, 'vidrio-3', 'vidrio-1'],
    [8, 18, 6, 6, 'neutro-7', 'neutro-4'],
  ];
  for (const [x, y, w, h, c, raya] of notas) {
    l.rect(x, y, w, h, c);
    l.rect(x + 1, y + 2, w - 3, 1, raya);
    if (h > 5) l.rect(x + 1, y + 4, w - 4, 1, raya);
    l.px(x + Math.floor(w / 2), y, 'rojo-3');
  }
  return acabarColgante(l);
}

export function dibujarCorchoLado(lado: 'E' | 'O'): Lienzo {
  const l = new Lienzo(32, 40);
  placaLateral(l, lado, 6, 21, 5, ['cuero-3', 'cuero-2', 'cuero-1'], (j) => (j % 6 === 2 ? 'tela-calida-3' : j % 6 === 5 ? 'rojo-4' : 'madera-clara-2'));
  return acabarColgante(l);
}

/** Pared de post-its: tablero claro con una cuadrícula de notas de colores y rayas en lugar de texto. */
export function dibujarParedPostitsS(): Lienzo {
  const l = new Lienzo(64, 40);
  l.rect(3, 4, 58, 29, 'neutro-6');
  l.rect(3, 4, 58, 1, 'neutro-7');
  l.rect(3, 4, 1, 29, 'neutro-7');
  l.rect(60, 5, 1, 28, 'neutro-4');
  l.rect(4, 32, 57, 1, 'neutro-4');
  const colores: Array<[ColorEntrada, ColorEntrada]> = [
    ['tela-calida-3', 'tela-calida-1'],
    ['rojo-4', 'rojo-2'],
    ['planta-4', 'planta-2'],
    ['vidrio-2', 'vidrio-0'],
    ['maceta-terracota-3', 'maceta-terracota-1'],
  ];
  const r = azar(8201);
  for (let fila = 0; fila < 3; fila++) {
    for (let col = 0; col < 7; col++) {
      if (r() < 0.14) continue;
      const [c, raya] = colores[entre(r, 0, colores.length - 1)] ?? colores[0]!;
      const x = 5 + col * 8 + entre(r, 0, 1);
      const y = 6 + fila * 9 + entre(r, 0, 1);
      l.rect(x, y, 7, 7, c);
      l.rect(x + 1, y + 2, 5, 1, raya);
      l.rect(x + 1, y + 4, 3, 1, raya);
      l.rect(x, y + 6, 7, 1, raya);
    }
  }
  return acabarColgante(l);
}

export function dibujarParedPostitsLado(lado: 'E' | 'O'): Lienzo {
  const l = new Lienzo(32, 72);
  const colores: ColorEntrada[] = ['tela-calida-3', 'rojo-4', 'planta-4', 'vidrio-2', 'maceta-terracota-3'];
  placaLateral(l, lado, 8, 56, 5, ['neutro-7', 'neutro-6', 'neutro-4'], (j) => (j % 6 === 5 ? 'neutro-6' : colores[Math.floor(j / 6) % colores.length] ?? 'neutro-7'));
  return acabarColgante(l);
}

// ---------------------------------------------------------------------------
// Cartel de cumpleaños
// ---------------------------------------------------------------------------

/** Cartel de cumpleaños: tablero crema con borde rojo, rayas de colores en lugar del texto, gorro y globos. */
export function dibujarCartelCumpleanosS(): Lienzo {
  const l = new Lienzo(64, 32);
  // Tablero.
  l.rect(4, 3, 56, 18, 'rojo-3');
  l.rect(4, 3, 56, 1, 'rojo-4');
  l.rect(4, 3, 1, 18, 'rojo-4');
  l.rect(5, 20, 55, 1, 'rojo-2');
  l.rect(59, 4, 1, 17, 'rojo-2');
  l.rect(6, 5, 52, 14, 'neutro-7');
  l.rect(6, 5, 52, 1, 'neutro-6');
  // Rayas que hacen de texto: titular grueso y dos renglones.
  l.rect(16, 7, 32, 3, 'rojo-2');
  l.rect(20, 12, 24, 2, 'vidrio-1');
  l.rect(24, 15, 16, 2, 'tela-calida-2');
  // Gorro de fiesta a la izquierda.
  l.rect(9, 12, 6, 1, 'vidrio-1');
  l.rect(10, 9, 4, 3, 'vidrio-1');
  l.rect(11, 7, 2, 2, 'vidrio-2');
  l.rect(11, 6, 2, 1, 'tela-calida-3');
  l.px(10, 11, 'neutro-7');
  // Globos a la derecha.
  l.elipse(52, 10, 2, 3, 'tela-calida-2');
  l.elipse(55, 12, 2, 3, 'vidrio-1');
  l.px(51, 9, 'tela-calida-3');
  l.px(54, 11, 'vidrio-2');
  // Confeti dentro del tablero y colgadores arriba.
  for (const [x, y, c] of [[17, 16, 'rojo-3'], [43, 15, 'planta-3'], [47, 17, 'vidrio-1'], [19, 6, 'tela-calida-2']] as const) l.rect(x, y, 2, 1, c);
  l.rect(12, 1, 1, 2, 'neutro-4');
  l.rect(51, 1, 1, 2, 'neutro-4');
  return acabarColgante(l);
}

export function dibujarCartelCumpleanosLado(lado: 'E' | 'O'): Lienzo {
  const l = new Lienzo(32, 64);
  const franjas: ColorEntrada[] = ['rojo-3', 'neutro-7', 'tela-calida-3', 'neutro-7', 'vidrio-1', 'neutro-7'];
  placaLateral(l, lado, 8, 44, 5, ['rojo-4', 'rojo-3', 'rojo-2'], (j) => franjas[Math.floor(j / 4) % franjas.length] ?? 'neutro-7');
  return acabarColgante(l);
}

// ---------------------------------------------------------------------------
// Registro
// ---------------------------------------------------------------------------

const TELA = rampa('lavanda');
/** Variantes de las cortinas: de `lavanda` a rojo suave, azul de oficina, hoja pastel, amarillo y gris oscuro. */
function variantesCortina(base: Lienzo): Record<string, Lienzo> {
  return variantesPorRampa(base, TELA, {
    rojo: rampa('rojo-suave'),
    azul: rampa('azul-oficina'),
    verde: rampa('hoja-pastel'),
    amarillo: [...rampa('tela-calida'), rampa('crema')[4] as string],
    negro: rampa('neutro').slice(0, 5),
  });
}

const CONSTRUCTORES: Constructores = {
  'cuadro-chico': (c) => {
    registrar(c, 'cuadro-chico', 'S', dibujarCuadroChicoS());
    registrar(c, 'cuadro-chico', 'E', dibujarCuadroChicoLado('E'));
    registrar(c, 'cuadro-chico', 'O', dibujarCuadroChicoLado('O'));
  },
  'reloj-pared': (c) => {
    registrar(c, 'reloj-pared', 'S', dibujarRelojParedS());
    registrar(c, 'reloj-pared', 'E', dibujarRelojParedLado('E'));
    registrar(c, 'reloj-pared', 'O', dibujarRelojParedLado('O'));
  },
  'camara-sala': (c) => {
    registrar(c, 'camara-sala', 'S', dibujarCamaraSalaS());
    registrar(c, 'camara-sala', 'E', dibujarCamaraSalaLado('E'));
    registrar(c, 'camara-sala', 'O', dibujarCamaraSalaLado('O'));
  },
  espejo: (c) => {
    registrar(c, 'espejo', 'S', dibujarEspejoS());
    registrar(c, 'espejo', 'E', dibujarEspejoLado('E'));
    registrar(c, 'espejo', 'O', dibujarEspejoLado('O'));
  },
  cortinas: (c) => {
    registrarVariantes(c, 'cortinas', 'S', variantesCortina(dibujarCortinasS()));
    registrarVariantes(c, 'cortinas', 'E', variantesCortina(dibujarCortinasLado('E')));
    registrarVariantes(c, 'cortinas', 'O', variantesCortina(dibujarCortinasLado('O')));
  },
  corcho: (c) => {
    registrar(c, 'corcho', 'S', dibujarCorchoS());
    registrar(c, 'corcho', 'E', dibujarCorchoLado('E'));
    registrar(c, 'corcho', 'O', dibujarCorchoLado('O'));
  },
  'pared-postits': (c) => {
    registrar(c, 'pared-postits', 'S', dibujarParedPostitsS());
    registrar(c, 'pared-postits', 'E', dibujarParedPostitsLado('E'));
    registrar(c, 'pared-postits', 'O', dibujarParedPostitsLado('O'));
  },
  'cartel-cumpleanos': (c) => {
    registrar(c, 'cartel-cumpleanos', 'S', dibujarCartelCumpleanosS());
    registrar(c, 'cartel-cumpleanos', 'E', dibujarCartelCumpleanosLado('E'));
    registrar(c, 'cartel-cumpleanos', 'O', dibujarCartelCumpleanosLado('O'));
  },
};

/** Todos los cuadros de lo que cuelga de las paredes. */
export function cuadrosParedes(): Cuadros {
  return construirCategoria(CONSTRUCTORES);
}
