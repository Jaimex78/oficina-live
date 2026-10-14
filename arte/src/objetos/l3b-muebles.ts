/**
 * Muebles del lote 3B: cómoda, estante de plantas, estante de frascos y mini nevera.
 *
 * Vista 3/4 con luz arriba a la izquierda: cara superior más clara, frente más oscuro, contorno azul marino y una
 * sola sombra abajo a la derecha. En las orientaciones `E` el mueble largo queda de pie: arriba su tapa (con las
 * plantas o los frascos asomando), abajo el testero, y a la derecha una franja angosta con el frente.
 */

import { Lienzo } from '../nucleo';
import type { ColorEntrada } from '../nucleo';
import {
  AZ, BG, CR, ME, MO, MT, NA, NE, PIEL, PL, R, RS, TC, VI, W,
  azar, bloque, caja3d, cuerpoBlando, entre, poste, registrar, terminar, vetas,
} from './l3b-comun';
import type { Cuadros, Tres } from './l3b-comun';

// ---------------------------------------------------------------------------
// Cómoda
// ---------------------------------------------------------------------------

/** Tirador de latón: una barrita con su sombra. */
function tirador(l: Lienzo, x: number, y: number, ancho = 5): void {
  l.rect(x, y, ancho, 2, TC(3));
  l.rect(x, y + 2, ancho, 1, TC(1));
  l.px(x, y, 'neutro-7');
}

/** Frente de un cajón: marco con luz arriba y a la izquierda y sombra abajo y a la derecha. */
function cajon(l: Lienzo, x: number, y: number, ancho: number, alto: number): void {
  l.rect(x, y, ancho, alto, W(2));
  l.rect(x, y, ancho, 1, W(3));
  l.rect(x, y, 1, alto, W(3));
  l.rect(x, y + alto - 1, ancho, 1, W(1));
  l.rect(x + ancho - 1, y + 1, 1, alto - 1, W(1));
}

/** Cómoda de tres cajones con dos tiradores de latón cada uno, vista de frente. */
export function dibujarComodaS(): Lienzo {
  const l = new Lienzo(64, 40);
  caja3d(l, { x: 3, y: 6, ancho: 58, fondo: 8, alto: 21 }, { ...PIEL.nogal, filo: W(4) });
  vetas(l, 5, 7, 54, 6, 3101, W(2), W(4), 5);
  for (const y of [15, 21, 27]) {
    cajon(l, 5, y, 54, 6);
    tirador(l, 17, y + 2);
    tirador(l, 42, y + 2);
  }
  // Patas cortas torneadas.
  for (const x of [5, 54]) {
    bloque(l, x, 34, 4, 3, [W(1), W(2), W(3)]);
    l.rect(x, 33, 4, 1, W(1));
  }
  return terminar(l);
}

/** Cómoda girada: de pie, con la tapa larga arriba, el testero abajo y la franja de cajones a la derecha. */
export function dibujarComodaE(): Lienzo {
  const l = new Lienzo(32, 72);
  // Tapa larga con luz arriba y a la izquierda.
  l.rect(6, 3, 19, 46, W(3));
  l.rect(6, 3, 19, 1, W(4));
  l.rect(6, 3, 1, 46, W(4));
  vetas(l, 8, 6, 14, 40, 3102, W(2), W(4), 6);
  // Testero (el extremo sur) con un panel hundido.
  l.rect(6, 49, 19, 17, W(2));
  l.rect(6, 49, 19, 1, W(1));
  l.rect(6, 50, 1, 16, W(3));
  l.rect(24, 50, 1, 16, W(1));
  l.rect(6, 65, 19, 1, W(1));
  l.rect(9, 52, 13, 11, W(1));
  l.rect(10, 53, 11, 9, W(2));
  l.rect(10, 53, 11, 1, W(3));
  // Franja del frente (mira al este): tres cajones vistos de canto con su tirador.
  l.rect(25, 4, 4, 62, W(2));
  l.rect(25, 4, 4, 1, W(3));
  l.rect(28, 5, 1, 61, W(1));
  for (const y of [19, 34, 49]) l.rect(25, y, 4, 1, W(1));
  for (const y of [11, 26, 41, 56]) l.rect(26, y, 2, 3, TC(3)).px(26, y, 'neutro-7');
  for (const y of [13, 28, 43, 58]) l.rect(27, y + 1, 1, 1, TC(1));
  // Patas.
  for (const x of [8, 22]) {
    bloque(l, x, 66, 4, 3, [W(1), W(2), W(3)]);
  }
  return terminar(l);
}

// ---------------------------------------------------------------------------
// Plantas pequeñas para los estantes
// ---------------------------------------------------------------------------

type Maceta = 'barro' | 'gris' | 'morada' | 'azul';
type Follaje = 'roseta' | 'flores' | 'cactus' | 'colgante' | 'alta';

function tonosMaceta(m: Maceta): Tres {
  if (m === 'gris') return [BG(2), BG(3), BG(4)];
  if (m === 'morada') return [MO(0), MO(1), MO(3)];
  if (m === 'azul') return [AZ(2), AZ(3), AZ(4)];
  return [MT(1), MT(2), MT(3)];
}

/**
 * Planta en maceta con el pie en `(cx, yBase)`: maceta de `ancho` por `altoMaceta` y encima el follaje elegido.
 * `flor` es el color de las flores del tipo `flores`.
 */
function planta(l: Lienzo, cx: number, yBase: number, maceta: Maceta, follaje: Follaje, altoFollaje: number, flor: ColorEntrada = TC(3)): void {
  const t = tonosMaceta(maceta);
  const ancho = follaje === 'alta' ? 9 : follaje === 'cactus' ? 7 : 8;
  const alto = follaje === 'alta' ? 5 : 4;
  const x0 = cx - Math.floor(ancho / 2);
  const yTope = yBase - alto + 1;
  // Hojas: detrás de la maceta.
  const yh = yTope - 1;
  if (follaje === 'roseta') {
    l.elipseSombreada(cx, yh - altoFollaje / 2, 5, altoFollaje / 2 + 1, [PL(1), PL(2), PL(3), PL(4)]);
    l.linea(cx, yh, cx - 4, yh - altoFollaje, PL(3));
    l.linea(cx, yh, cx + 4, yh - altoFollaje + 1, PL(3));
  } else if (follaje === 'flores') {
    l.elipseSombreada(cx, yh - 2, 4, 3, [PL(1), PL(2), PL(3)]);
    for (const [dx, dy] of [[-3, -altoFollaje + 1], [0, -altoFollaje - 1], [3, -altoFollaje + 2], [-1, -3]] as const) {
      l.rect(cx + dx - 1, yh + dy - 1, 3, 3, flor);
      l.px(cx + dx, yh + dy, 'neutro-7');
    }
  } else if (follaje === 'cactus') {
    l.rectRedondeado(cx - 2, yh - altoFollaje, 5, altoFollaje + 2, 2, PL(3));
    l.rect(cx - 2, yh - altoFollaje, 1, altoFollaje + 2, PL(4));
    l.rect(cx + 2, yh - altoFollaje + 1, 1, altoFollaje + 1, PL(2));
    l.rect(cx - 5, yh - 3, 2, 1, PL(3)).rect(cx - 5, yh - 5, 1, 3, PL(3));
    l.px(cx, yh - altoFollaje + 1, flor);
  } else if (follaje === 'colgante') {
    l.elipseSombreada(cx, yh - 2, 4, 3, [PL(1), PL(2), PL(3)]);
    l.rect(cx - 5, yh, 1, 5, PL(3)).rect(cx + 5, yh, 1, 7, PL(2)).rect(cx - 3, yh + 1, 1, 4, PL(2));
    l.rect(cx - 5, yh + 5, 1, 1, PL(4));
  } else {
    // Hojas largas en abanico.
    l.hoja([cx, yh], [cx - 5, yh - altoFollaje], 6, [PL(1), PL(2), PL(3), PL(4)]);
    l.hoja([cx, yh], [cx + 5, yh - altoFollaje + 1], 6, [PL(1), PL(2), PL(3), PL(4)]);
    l.hoja([cx, yh], [cx, yh - altoFollaje - 2], 6, [PL(1), PL(2), PL(3), PL(4)]);
  }
  // Maceta.
  cuerpoBlando(l, x0, yTope, ancho, alto, 2, t);
  l.rect(x0, yTope, ancho, 1, t[2]);
}

// ---------------------------------------------------------------------------
// Estante de plantas
// ---------------------------------------------------------------------------

/** Listón del estante: tapa clara y canto medio. */
function tabla(l: Lienzo, x: number, y: number, ancho: number): void {
  l.rect(x, y, ancho, 3, R(2));
  l.rect(x, y, ancho, 1, R(4));
  l.rect(x, y + 2, ancho, 1, R(1));
}

/** Estante de madera con tres filas de plantas en macetas distintas, y plantas más altas encima. */
export function dibujarEstantePlantasS(): Lienzo {
  const l = new Lienzo(64, 56);
  // Fondo de cada hueco.
  l.rect(2, 14, 60, 33, R(1));
  // Plantas de arriba (sobre la tabla alta).
  planta(l, 11, 13, 'gris', 'roseta', 6);
  planta(l, 31, 13, 'barro', 'alta', 4);
  planta(l, 51, 13, 'azul', 'flores', 4, TC(3));
  // Dos filas dentro del estante.
  planta(l, 9, 28, 'barro', 'flores', 4, MO(3));
  planta(l, 20, 28, 'gris', 'roseta', 5);
  planta(l, 43, 28, 'morada', 'alta', 3);
  planta(l, 54, 28, 'barro', 'cactus', 6, NA(3));
  planta(l, 10, 43, 'azul', 'colgante', 4);
  planta(l, 22, 43, 'barro', 'roseta', 5);
  planta(l, 41, 43, 'gris', 'flores', 5, RS(3));
  planta(l, 53, 43, 'morada', 'roseta', 5);
  // Sombras bajo cada tabla.
  for (const y of [17, 32]) l.rect(5, y, 54, 1, R(0));
  // Laterales, divisor central y tablas.
  for (const x of [2, 59]) bloque(l, x, 14, 3, 33, [R(2), R(3), R(4)]);
  bloque(l, 31, 17, 3, 27, [R(2), R(3), R(4)]);
  tabla(l, 2, 14, 60);
  tabla(l, 2, 29, 60);
  tabla(l, 2, 44, 60);
  // Base: armario cerrado con dos puertas y pomos.
  l.rect(2, 47, 60, 7, R(2));
  l.rect(2, 47, 60, 1, R(3));
  l.rect(2, 53, 60, 1, R(1));
  for (const x of [5, 34]) {
    l.rect(x, 48, 25, 5, R(1));
    l.rect(x + 1, 49, 23, 3, R(2));
    l.rect(x + 1, 49, 23, 1, R(3));
  }
  l.rect(27, 49, 2, 2, TC(3));
  l.rect(35, 49, 2, 2, TC(3));
  return terminar(l);
}

/** Estante de plantas de lado: arriba las copas verdes sobre la tapa, abajo el testero con su franja de macetas. */
export function dibujarEstantePlantasE(): Lienzo {
  const l = new Lienzo(32, 88);
  // Tapa larga de madera, con macetas y copas de arriba a abajo.
  l.rect(6, 3, 19, 48, R(3));
  l.rect(6, 3, 19, 1, R(4));
  l.rect(6, 3, 1, 48, R(4));
  const r = azar(3201);
  for (const [y, tipo] of [[7, 0], [19, 1], [31, 2], [43, 0]] as const) {
    const cx = 12 + entre(r, 0, 3) + tipo * 2;
    l.rect(cx - 3, y + 6, 7, 4, tipo === 1 ? BG(3) : MT(2));
    l.rect(cx - 3, y + 6, 7, 1, tipo === 1 ? BG(4) : MT(3));
    l.elipseSombreada(cx, y + 2, 6, 5, [PL(1), PL(2), PL(3), PL(4)]);
    if (tipo === 2) {
      l.px(cx - 2, y + 1, TC(3)).px(cx + 2, y + 3, MO(3));
      l.px(cx, y, NA(3));
    }
  }
  // Testero con el hueco de la última fila.
  l.rect(6, 51, 19, 31, R(2));
  l.rect(6, 51, 19, 1, R(3));
  l.rect(6, 52, 1, 30, R(3));
  l.rect(24, 52, 1, 30, R(1));
  l.rect(6, 81, 19, 1, R(1));
  l.rect(9, 55, 13, 23, R(1));
  l.rect(10, 56, 11, 21, R(2));
  l.rect(10, 56, 11, 1, R(3));
  l.rect(10, 66, 11, 2, R(1));
  // Franja del frente (este): las tablas de las tres filas, vistas de canto.
  l.rect(25, 4, 4, 78, R(1));
  l.rect(25, 4, 1, 78, R(2));
  for (const y of [16, 36, 56, 76]) l.rect(25, y, 4, 2, R(3));
  for (const y of [8, 26, 46, 66]) l.rect(26, y, 2, 4, PL(3)).px(26, y, PL(4));
  l.rect(8, 82, 4, 3, R(1));
  l.rect(20, 82, 4, 3, R(1));
  return terminar(l);
}

// ---------------------------------------------------------------------------
// Estante de frascos
// ---------------------------------------------------------------------------

/** Frasco de vidrio con tapa blanca: la tapa arriba, el vidrio claro con brillo, y el contenido de color. */
function frasco(l: Lienzo, x: number, yAbajo: number, ancho: number, alto: number, contenido: ColorEntrada | null, llenado: number): void {
  const y0 = yAbajo - alto + 1;
  l.rect(x, y0 + 2, ancho, alto - 2, VI(3));
  l.rect(x, y0 + 2, 1, alto - 2, 'neutro-7');
  l.rect(x + ancho - 1, y0 + 3, 1, alto - 3, VI(2));
  l.rect(x, yAbajo, ancho, 1, VI(1));
  if (contenido !== null) {
    l.rect(x + 1, yAbajo - llenado, ancho - 2, llenado, contenido);
    l.rect(x + 1, yAbajo - llenado, ancho - 2, 1, 'neutro-7');
    l.px(x + 1, yAbajo - llenado, 'neutro-7');
  }
  l.rect(x, y0, ancho, 2, 'neutro-6');
  l.rect(x, y0, ancho, 1, 'neutro-7');
  l.rect(x + ancho - 1, y0 + 1, 1, 1, 'neutro-4');
}

/** Hilera de frascos sobre la tabla `yTabla`, con alturas y contenidos alternados. */
function hilera(l: Lienzo, x0: number, yAbajo: number, contenidos: ReadonlyArray<ColorEntrada | null>, altos: readonly number[]): void {
  contenidos.forEach((c, i) => frasco(l, x0 + i * 8, yAbajo, 7, altos[i % altos.length] as number, c, c === null ? 0 : 4 + (i % 2) * 2));
}

/** Estante metálico abierto con tres hileras: frascos de cristal arriba, de colores en medio y abajo. */
export function dibujarEstanteFrascosS(): Lienzo {
  const l = new Lienzo(64, 48);
  // Fondo.
  l.rect(6, 2, 52, 41, BG(2));
  // Contenidos.
  hilera(l, 8, 13, [CR(3), null, 'neutro-6', CR(4), null, CR(3)], [11, 9, 10]);
  hilera(l, 8, 26, [NA(3), RS(3), TC(3), NA(2), RS(2), TC(3)], [10, 9]);
  hilera(l, 8, 39, [PL(3), RS(2), MT(2), PL(4), RS(3), NA(2)], [10, 9, 10]);
  // Sombra bajo cada tabla, en el fondo.
  for (const y of [17, 30, 43]) l.rect(6, y, 52, 1, BG(1));
  // Postes y tablas de metal.
  for (const x of [3, 58]) poste(l, x, 2, 43, 3, [ME(1), ME(2), ME(3)]);
  for (const y of [14, 27, 40]) {
    l.rect(3, y, 58, 3, ME(2));
    l.rect(3, y, 58, 1, ME(3));
    l.rect(3, y + 2, 58, 1, ME(1));
  }
  l.rect(3, 43, 58, 2, ME(1));
  return terminar(l);
}

/** Estante de frascos de lado: la tabla de arriba con las tapas vistas desde arriba, y el testero metálico. */
export function dibujarEstanteFrascosE(): Lienzo {
  const l = new Lienzo(32, 80);
  // Tapa: la tabla alta con una fila de tapas redondas.
  l.rect(6, 3, 19, 46, ME(3));
  l.rect(6, 3, 19, 1, 'neutro-7');
  l.rect(6, 3, 1, 46, 'neutro-7');
  l.rect(24, 4, 1, 45, ME(2));
  for (let i = 0; i < 5; i++) {
    const y = 9 + i * 8;
    l.elipse(14, y, 3, 3, 'neutro-6');
    l.elipse(14, y, 2, 2, 'neutro-7');
    l.px(15, y + 1, 'neutro-4');
  }
  // Testero: marco metálico con tres hileras, de cada una se ve el primer frasco.
  l.rect(6, 49, 19, 26, BG(2));
  l.rect(6, 49, 19, 1, ME(3));
  for (const [i, c] of [CR(3), NA(3), PL(3)].entries()) {
    const yb = 56 + i * 7;
    frasco(l, 11, yb, 8, 7, c, 3);
    l.rect(6, yb + 1, 19, 2, ME(2));
    l.rect(6, yb + 1, 19, 1, ME(3));
  }
  for (const x of [6, 22]) bloque(l, x, 49, 3, 27, [ME(1), ME(2), ME(3)]);
  l.rect(6, 75, 19, 1, ME(1));
  // Franja del frente (este): los frascos de canto, en filas.
  l.rect(25, 4, 4, 72, BG(1));
  for (const y of [14, 30, 46, 62]) l.rect(25, y, 4, 2, ME(3));
  for (const y of [6, 22, 38, 54, 68]) l.rect(26, y, 2, 5, y % 3 === 0 ? RS(3) : VI(3));
  return terminar(l);
}

// ---------------------------------------------------------------------------
// Mini nevera
// ---------------------------------------------------------------------------

/** Nevera pequeña menta con congelador arriba, asas, una nota y dos imanes. */
export function dibujarMiniNevera(): Lienzo {
  const l = new Lienzo(32, 40);
  caja3d(l, { x: 5, y: 3, ancho: 22, fondo: 5, alto: 27 }, {
    sup: 'baldosa-3',
    supLuz: 'neutro-7',
    frente: 'baldosa-2',
    frenteLuz: 'baldosa-3',
    frenteSombra: 'baldosa-1',
  });
  // Puerta del congelador y separación.
  l.rect(5, 8, 22, 1, BG(1));
  l.rect(6, 9, 20, 8, 'baldosa-2');
  l.rect(6, 9, 20, 1, 'baldosa-3');
  l.rect(5, 17, 22, 2, BG(1));
  l.rect(5, 17, 22, 1, BG(0));
  // Asas verticales.
  l.rect(9, 11, 2, 4, ME(2));
  l.rect(9, 11, 1, 4, ME(3));
  l.rect(9, 21, 2, 7, ME(2));
  l.rect(9, 21, 1, 7, ME(3));
  // Nota pegada con dos imanes.
  l.rect(16, 21, 7, 8, 'neutro-7');
  l.rect(16, 28, 7, 1, 'neutro-5');
  l.rect(18, 24, 4, 1, 'neutro-4').rect(18, 26, 3, 1, 'neutro-4');
  l.rect(17, 20, 2, 2, 'rojo-3');
  l.rect(21, 20, 2, 2, TC(3));
  // Patas.
  l.rect(8, 30, 3, 2, NE(2));
  l.rect(22, 30, 3, 2, NE(2));
  return terminar(l);
}

export function cuadrosMuebles(): Cuadros {
  const c: Cuadros = new Map();
  registrar(c, 'comoda', 'S', dibujarComodaS(), 'madera-oscura');
  registrar(c, 'comoda', 'E', dibujarComodaE(), 'madera-oscura');
  registrar(c, 'estante-plantas', 'S', dibujarEstantePlantasS());
  registrar(c, 'estante-plantas', 'E', dibujarEstantePlantasE());
  registrar(c, 'estante-frascos', 'S', dibujarEstanteFrascosS());
  registrar(c, 'estante-frascos', 'E', dibujarEstanteFrascosE());
  registrar(c, 'mini-nevera', 'U', dibujarMiniNevera());
  return c;
}
