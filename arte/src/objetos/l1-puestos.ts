/**
 * Puestos de trabajo del lote 1: escritorio individual, escritorio doble, mesa compartida de 6 y panel divisor.
 *
 * Estilo Gather: la tapa es blanca y casi plana, con un labio claro en el borde; debajo va un panel frontal
 * azul grisáceo (`azul-oficina`) entre dos patas oscuras. Contorno azul marino de 1 px. Encima de la tapa hay
 * pocos objetos pequeños (una taza y una libreta) en el rincón que no usa el monitor.
 *
 * Estructura vertical de todo mueble con tablero, contada desde el borde inferior H del cuadro:
 *   tapa (vista desde arriba)   filas  y0 a H-13   (y0 = 2 si el mueble tiene una casilla de fondo, 6 si tiene dos o más)
 *   labio del borde             filas  H-12 y H-11
 *   panel frontal y patas       filas  H-10 a H-3
 * Con esa estructura el monitor (apoyado, con la base en la fila 15 de su casilla) queda sobre la tapa en la
 * casilla de arriba y también en la de abajo de los escritorios de dos casillas de fondo, y su teclado cabe
 * en las filas 16 a 19 de la casilla.
 *
 * Variantes: `base` es el estilo Gather (blanco con panel azul grisáceo); `madera` es la alternativa de madera
 * clara; `blanco` es todo blanco con panel gris claro y `negro` es negro. Cada variante se dibuja con su
 * propio conjunto de colores (`MATERIALES`), no por recoloreo, para que el detalle quede bien en todas.
 */

import { Lienzo } from '../nucleo';
import { cerrar, registrarObjeto, type Cuadros } from './l1-comun';

export type VarianteMueble = 'base' | 'madera' | 'blanco' | 'negro';

/** Colores de un mueble con tablero. Todos son nombres de la paleta. */
export interface MaterialMueble {
  tapa: string;
  /** Un tono menos en el borde derecho de la tapa (la luz viene de la izquierda). */
  tapaSombra: string;
  /** Primera fila del labio (la arista que recibe la luz) y la segunda (la cara del labio). */
  labio: string;
  labioCara: string;
  panel: string;
  panelSombra: string;
  /** Línea fina que separa tapa y labio en los muebles de madera. */
  pata: string;
  pataLuz: string;
  /** Veta suave de la tapa, o `null` si la tapa es lisa. */
  veta: string | null;
  vetaLuz: string | null;
}

export const MATERIALES: Record<VarianteMueble, MaterialMueble> = {
  base: { tapa: 'neutro-7', tapaSombra: 'neutro-6', labio: 'neutro-6', labioCara: 'azul-oficina-4', panel: 'azul-oficina-3', panelSombra: 'azul-oficina-2', pata: 'azul-oficina-1', pataLuz: 'azul-oficina-2', veta: null, vetaLuz: null },
  madera: { tapa: 'madera-clara-3', tapaSombra: 'madera-clara-2', labio: 'madera-clara-4', labioCara: 'madera-clara-2', panel: 'madera-clara-1', panelSombra: 'madera-oscura-2', pata: 'madera-oscura-1', pataLuz: 'madera-oscura-2', veta: 'madera-clara-2', vetaLuz: 'madera-clara-4' },
  blanco: { tapa: 'neutro-7', tapaSombra: 'neutro-6', labio: 'neutro-6', labioCara: 'neutro-5', panel: 'neutro-5', panelSombra: 'neutro-4', pata: 'neutro-3', pataLuz: 'neutro-4', veta: null, vetaLuz: null },
  negro: { tapa: 'neutro-2', tapaSombra: 'neutro-1', labio: 'neutro-3', labioCara: 'neutro-4', panel: 'neutro-1', panelSombra: 'neutro-0', pata: 'neutro-0', pataLuz: 'neutro-1', veta: null, vetaLuz: null },
};

/**
 * Tapa con labio: rectángulo de `fondo` filas desde `y`, y debajo dos filas de labio. La tapa lleva una
 * fila de sombra a la derecha y, en la madera, vetas largas de 1 px.
 */
export function tapaConLabio(l: Lienzo, x: number, y: number, ancho: number, fondo: number, m: MaterialMueble, semilla = 1): void {
  l.rect(x, y, ancho, fondo, m.tapa);
  l.rect(x + ancho - 1, y, 1, fondo, m.tapaSombra);
  if (m.veta && m.vetaLuz) {
    // Vetas de 1 px: largas y suaves, siempre dentro de la tapa (a 2 px de los bordes).
    const n = Math.max(3, Math.round((ancho * fondo) / 160));
    let a = semilla * 7919;
    const rnd = () => {
      a = (a * 1103515245 + 12345) & 0x7fffffff;
      return a / 0x7fffffff;
    };
    for (let i = 0; i < n; i++) {
      const largo = 6 + Math.floor(rnd() * 10);
      const vx = x + 2 + Math.floor(rnd() * Math.max(1, ancho - 4 - largo));
      const vy = y + 2 + Math.floor(rnd() * Math.max(1, fondo - 4));
      l.rect(vx, vy, Math.min(largo, ancho - 4), 1, i % 3 === 2 ? m.vetaLuz : m.veta);
    }
  }
  l.rect(x, y + fondo, ancho, 1, m.labio);
  l.rect(x, y + fondo + 1, ancho, 1, m.labioCara);
}

/** Panel frontal entre dos patas: `ancho` es el de la tapa; el panel es 2 px más angosto por lado. */
export function panelConPatas(l: Lienzo, x: number, ancho: number, filaPanel: number, m: MaterialMueble, centrales: readonly number[] = []): void {
  l.rect(x + 2, filaPanel, ancho - 4, 6, m.panel);
  l.rect(x + 2, filaPanel + 4, ancho - 4, 2, m.panelSombra);
  for (const px of [x + 1, x + ancho - 4, ...centrales]) {
    l.rect(px, filaPanel, 3, 8, m.pata);
    l.rect(px, filaPanel, 1, 8, m.pataLuz);
  }
}

/** Taza de cerámica coral con asa y vapor de color: un detalle pequeño que da vida a la tapa. */
export function taza(l: Lienzo, x: number, y: number): void {
  l.rect(x, y, 5, 5, 'naranja-2');
  l.rect(x, y, 5, 1, 'naranja-4');
  l.rect(x, y, 1, 5, 'naranja-3');
  l.rect(x + 4, y + 1, 1, 4, 'naranja-1');
  l.rect(x + 1, y + 1, 3, 1, 'naranja-0');
  l.rect(x + 5, y + 1, 1, 3, 'naranja-1');
  l.px(x + 1, y + 4, 'naranja-1');
  l.px(x + 3, y + 4, 'naranja-1');
}

/** Libreta azul con hojas a un lado y un lápiz. */
export function libreta(l: Lienzo, x: number, y: number): void {
  l.rect(x, y, 9, 6, 'azul-oficina-3');
  l.rect(x, y, 9, 1, 'azul-oficina-4');
  l.rect(x + 8, y + 1, 1, 5, 'azul-oficina-2');
  l.rect(x, y + 5, 9, 1, 'azul-oficina-2');
  l.rect(x + 1, y + 2, 6, 2, 'neutro-7');
  l.rect(x + 1, y + 2, 6, 1, 'neutro-6');
  l.rect(x + 7, y + 1, 1, 4, 'rojo-suave-3');
}

// ---------------------------------------------------------------------------
// Escritorio individual (2 x 1)
// ---------------------------------------------------------------------------

/** Escritorio visto de frente (S) o por detrás (N): la taza y la libreta van del lado contrario al monitor. */
function escritorioFrenteOEspalda(m: MaterialMueble, lado: 'S' | 'N', semilla: number): Lienzo {
  const l = new Lienzo(64, 32);
  tapaConLabio(l, 3, 2, 58, 18, m, semilla);
  panelConPatas(l, 3, 58, 22, m);
  if (lado === 'S') {
    taza(l, 45, 7);
    libreta(l, 50, 11);
  } else {
    taza(l, 14, 7);
    libreta(l, 5, 11);
  }
  return cerrar(l);
}

/** Escritorio de lado (E u O): se ve el costado como un panel con patas en las esquinas del frente. */
function escritorioLateral(m: MaterialMueble, frente: 'E' | 'O', semilla: number): Lienzo {
  const l = new Lienzo(32, 64);
  tapaConLabio(l, 3, 6, 26, 46, m, semilla);
  // Costado visible (el extremo sur): panel y dos patas.
  l.rect(5, 54, 22, 6, m.panel);
  l.rect(5, 58, 22, 2, m.panelSombra);
  for (const px of [4, 25]) {
    l.rect(px, 54, 3, 8, m.pata);
    l.rect(px, 54, 1, 8, m.pataLuz);
  }
  if (frente === 'E') taza(l, 20, 14);
  else taza(l, 7, 14);
  libreta(l, frente === 'E' ? 12 : 10, 34);
  return cerrar(l);
}

// ---------------------------------------------------------------------------
// Escritorio doble (2 x 2)
// ---------------------------------------------------------------------------

/**
 * Escritorio para dos puestos. Cada puesto tiene su rincón libre para el monitor (arriba a la izquierda y abajo
 * a la derecha, como en la oficina de ejemplo) y la taza y la libreta quedan en los otros dos rincones.
 */
function escritorioDoble(m: MaterialMueble, orientacion: 'S' | 'E', semilla: number): Lienzo {
  const l = new Lienzo(64, 64);
  tapaConLabio(l, 3, 6, 58, 46, m, semilla);
  panelConPatas(l, 3, 58, 54, m, [30]);
  if (orientacion === 'S') {
    taza(l, 46, 10);
    libreta(l, 50, 17);
    taza(l, 12, 40);
    libreta(l, 5, 33);
  } else {
    taza(l, 12, 10);
    libreta(l, 5, 17);
    taza(l, 46, 40);
    libreta(l, 50, 33);
  }
  // Una ranura para pasar cables en el centro de la tapa.
  l.rect(29, 28, 6, 2, m.panelSombra);
  l.rect(29, 28, 6, 1, m.pata);
  return cerrar(l);
}

// ---------------------------------------------------------------------------
// Mesa compartida de 6 (4 x 2)
// ---------------------------------------------------------------------------

/** Mesa larga de equipo: tapa grande, panel corrido y tres patas (extremos y centro). Sirve de frente (S) y de lado (E). */
function mesaCompartida(m: MaterialMueble, orientacion: 'S' | 'E', semilla: number): Lienzo {
  const ancho = orientacion === 'S' ? 128 : 64;
  const alto = orientacion === 'S' ? 64 : 128;
  const l = new Lienzo(ancho, alto);
  tapaConLabio(l, 3, 6, ancho - 6, alto - 18, m, semilla);
  panelConPatas(l, 3, ancho - 6, alto - 10, m, orientacion === 'S' ? [Math.floor(ancho / 2) - 2] : []);
  if (orientacion === 'S') {
    for (const x of [14, 50, 86]) taza(l, x, 12);
    for (const x of [30, 100]) libreta(l, x, 36);
  } else {
    for (const y of [14, 54, 94]) taza(l, 10, y);
    for (const y of [30, 72]) libreta(l, 38, y);
  }
  return cerrar(l);
}

// ---------------------------------------------------------------------------
// Panel divisor (1 x 1, sobresale 16)
// ---------------------------------------------------------------------------

/**
 * Panel divisor tapizado con marco claro y dos patines. La tela se dibuja con la rampa `lavanda` (las variantes
 * `gris` y `rojo` recolorean de ahí) y el marco con `azul-oficina`. De frente (S) se ve el tapizado y de lado
 * (E) el canto delgado.
 */
function panelDivisor(orientacion: 'S' | 'E'): Lienzo {
  const l = new Lienzo(32, 48);
  if (orientacion === 'S') {
    l.rect(2, 8, 28, 34, 'azul-oficina-4');
    l.rect(2, 8, 28, 1, 'neutro-7');
    l.rect(29, 9, 1, 33, 'azul-oficina-3');
    l.rect(4, 11, 24, 29, 'lavanda-2');
    l.rect(4, 11, 24, 1, 'lavanda-3');
    l.rect(4, 11, 2, 29, 'lavanda-3');
    l.rect(26, 11, 2, 29, 'lavanda-1');
    l.rect(4, 24, 24, 1, 'lavanda-1');
    l.rect(4, 25, 24, 1, 'lavanda-3');
    for (const x of [4, 23]) {
      l.rect(x, 42, 5, 2, 'azul-oficina-1');
      l.rect(x, 42, 5, 1, 'azul-oficina-2');
    }
  } else {
    l.rect(11, 8, 10, 34, 'azul-oficina-4');
    l.rect(11, 8, 10, 2, 'neutro-7');
    l.rect(20, 10, 1, 32, 'azul-oficina-3');
    l.rect(13, 11, 6, 29, 'lavanda-2');
    l.rect(13, 11, 1, 29, 'lavanda-3');
    l.rect(18, 11, 1, 29, 'lavanda-1');
    l.rect(9, 42, 14, 2, 'azul-oficina-1');
    l.rect(9, 42, 14, 1, 'azul-oficina-2');
  }
  return cerrar(l);
}

export function dibujarPuestos(salida: Cuadros): void {
  const variantes: VarianteMueble[] = ['base', 'madera', 'blanco', 'negro'];
  /** Registra un mueble con tablero dibujando cada variante con sus colores. */
  const conVariantes = (id: string, dibujar: (m: MaterialMueble, clave: string, semilla: number) => Lienzo, semilla: number): void => {
    registrarObjeto(salida, id, (clave) => dibujar(MATERIALES.base, clave, semilla), {
      variante: (_base, variante, clave) => (variantes.includes(variante as VarianteMueble) ? dibujar(MATERIALES[variante as VarianteMueble], clave, semilla) : undefined),
    });
  };
  conVariantes('escritorio-individual', (m, clave, s) => (clave === 'S' || clave === 'N' ? escritorioFrenteOEspalda(m, clave, s) : escritorioLateral(m, clave === 'E' ? 'E' : 'O', s)), 11);
  conVariantes('escritorio-doble', (m, clave, s) => escritorioDoble(m, clave === 'S' ? 'S' : 'E', s), 21);
  conVariantes('mesa-compartida-6', (m, clave, s) => mesaCompartida(m, clave === 'S' ? 'S' : 'E', s), 31);
  registrarObjeto(salida, 'panel-divisor', (clave) => panelDivisor(clave === 'S' ? 'S' : 'E'), {
    variante: (base, variante) => {
      if (variante === 'gris') return base.recolorear(Object.fromEntries(['lavanda-1', 'lavanda-2', 'lavanda-3'].map((c, i) => [c, `baldosa-gris-${i + 2}`])));
      if (variante === 'rojo') return base.recolorear(Object.fromEntries(['lavanda-1', 'lavanda-2', 'lavanda-3'].map((c, i) => [c, `rojo-${i + 1}`])));
      return undefined;
    },
  });
}
