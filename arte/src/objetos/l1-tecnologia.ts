/**
 * Tecnología del lote 1: TV de pared y pantalla de sala (el monitor pasó al lote 8, `l8-pcs.ts`).
 *
 * Todas las pantallas comparten el bisel (`neutro` 1) y el vidrio encendido (`vidrio` 3 y 2 como fondo, con
 * barras de `vidrio` 1 que hacen de interfaz). Una pantalla "luz siempre" se dibuja con los tonos más claros
 * de su rampa para que se lea encendida de noche: el resplandor lo pone el motor, no el arte.
 * Ningún texto ni logo real: los renglones son barras de 1 px.
 *
 * La orientación de monitores y pantallas es hacia donde mira la PANTALLA: en N se ve la parte trasera
 * (la pantalla mira hacia arriba, de espaldas a quien juega).
 */

import { Lienzo } from '../nucleo';
import { cerrar, registrarObjeto, type Cuadros } from './l1-comun';

const ME = (n: 0 | 1 | 2 | 3) => `metal-${n}` as const;
const AZ = (n: 0 | 1 | 2 | 3 | 4) => `azul-oficina-${n}` as const;
const NE = (n: 0 | 1 | 2 | 3 | 4 | 5) => `neutro-${n}` as const;
const VI = (n: 0 | 1 | 2 | 3) => `vidrio-${n}` as const;

/** Contenido de una pantalla encendida: fondo claro, una barra de título, renglones y un acento rojo. */
export function pantallaEncendida(l: Lienzo, x: number, y: number, ancho: number, alto: number, semilla = 0): void {
  l.rect(x, y, ancho, alto, VI(3));
  l.rect(x, y + Math.floor(alto * 0.6), ancho, alto - Math.floor(alto * 0.6), VI(2));
  l.rect(x, y, ancho, 1, VI(1));
  if (alto >= 6) {
    const largos = [0.7, 0.5, 0.6];
    for (let i = 0; i < 3 && y + 2 + i * 2 < y + alto - 1; i++) {
      l.rect(x + 1, y + 2 + i * 2, Math.max(2, Math.floor((ancho - 2) * (largos[(i + semilla) % 3] ?? 0.5))), 1, VI(1));
    }
  }
  if (ancho >= 12 && alto >= 7) l.rect(x + ancho - 5, y + alto - 3, 3, 2, 'rojo-3');
}

// ---------------------------------------------------------------------------
// Láminas laterales: lo montado en una pared vertical (E y O) se ve de canto, como una franja delgada
// pegada al costado de la tapa de la pared, hacia el lado al que mira.
// ---------------------------------------------------------------------------

/**
 * Franja de canto pegada a la tapa de una pared vertical. E asoma a la derecha de la tapa (columnas 21 en
 * adelante) y O a la izquierda (hasta la columna 10). Luz a la izquierda en ambos.
 */
export function laminaLateral(l: Lienzo, mira: 'E' | 'O', y0: number, y1: number, ancho: number, colores: { luz: string; medio: string; oscuro: string; borde?: string }): void {
  const x = mira === 'E' ? 21 : 11 - ancho;
  l.rect(x, y0, ancho, y1 - y0, colores.medio);
  l.rect(x, y0, 1, y1 - y0, colores.luz);
  l.rect(x + ancho - 1, y0, 1, y1 - y0, colores.oscuro);
  if (colores.borde) {
    // Filo luminoso en el lado al que mira (la pantalla, el cristal o el papel).
    l.rect(mira === 'E' ? x + ancho - 1 : x, y0 + 2, 1, y1 - y0 - 4, colores.borde);
  }
}

// ---------------------------------------------------------------------------
// TV de pared (2 x 1, sobresale 16): llena la cara de la pared (cuadro de 64 x 48 sobre las filas 16 a 63)
// ---------------------------------------------------------------------------

/** Diapositiva de presentación: título rojo, imagen con un sol, renglones y un gráfico de barras. */
export function pantallaDiapositiva(l: Lienzo, x: number, y: number, ancho: number, alto: number): void {
  l.rect(x, y, ancho, alto, VI(3));
  l.rect(x, y, ancho, 4, 'rojo-3');
  l.rect(x, y + 3, ancho, 1, 'rojo-2');
  // Imagen a la izquierda: cielo con un sol y una colina.
  const iw = Math.floor(ancho * 0.4);
  l.rect(x + 3, y + 7, iw, alto - 11, VI(2));
  l.rect(x + 3, y + alto - 7, iw, 3, 'planta-3');
  l.rect(x + 3, y + alto - 7, iw, 1, 'planta-4');
  l.elipse(x + 3 + iw - 6, y + 11, 2, 2, 'tela-calida-3');
  // Renglones y barras a la derecha.
  const xr = x + 6 + iw;
  const largo = ancho - iw - 9;
  l.rect(xr, y + 7, largo, 1, VI(1));
  l.rect(xr, y + 9, Math.floor(largo * 0.75), 1, VI(1));
  const barras = [5, 8, 6, 10, 7];
  const anchoBarra = Math.max(2, Math.floor((largo - 4) / barras.length) - 1);
  barras.forEach((h, i) => {
    const bx = xr + i * (anchoBarra + 1);
    const alturaMax = alto - 17;
    const bh = Math.max(2, Math.min(h, alturaMax));
    l.rect(bx, y + alto - 3 - bh, anchoBarra, bh, i === 3 ? 'rojo-3' : VI(1));
  });
}

function tvParedS(): Lienzo {
  const l = new Lienzo(64, 48);
  l.rect(5, 5, 54, 28, AZ(1));
  l.rect(5, 5, 54, 1, AZ(2));
  l.rect(5, 5, 1, 28, AZ(2));
  l.rect(58, 6, 1, 27, AZ(0));
  l.rect(6, 32, 52, 1, AZ(0));
  pantallaDiapositiva(l, 7, 7, 50, 24);
  // Reflejo en diagonal sobre el vidrio.
  l.linea(10, 29, 16, 23, 'blanco');
  l.linea(13, 29, 18, 24, VI(3));
  // Soporte a la pared: una barra de metal asoma por debajo.
  l.rect(26, 33, 12, 2, AZ(2));
  l.rect(26, 33, 12, 1, AZ(3));
  return cerrar(l);
}

function tvParedLateral(mira: 'E' | 'O'): Lienzo {
  const l = new Lienzo(32, 80);
  laminaLateral(l, mira, 8, 66, 6, { luz: AZ(2), medio: AZ(1), oscuro: AZ(0), borde: VI(3) });
  return cerrar(l);
}

// ---------------------------------------------------------------------------
// Pantalla de sala (3 x 1, sobresale 16): pantalla grande sobre pie con base de metal
// ---------------------------------------------------------------------------

function pantallaSalaS(): Lienzo {
  const l = new Lienzo(96, 48);
  // Pie y base en T con dos ruedas.
  l.rect(45, 33, 6, 8, AZ(2));
  l.rect(45, 33, 1, 8, AZ(3));
  l.rect(50, 33, 1, 8, AZ(1));
  l.rect(22, 41, 52, 2, AZ(2));
  l.rect(22, 41, 52, 1, AZ(3));
  l.rect(22, 43, 52, 1, AZ(1));
  for (const x of [24, 69]) l.rect(x, 44, 3, 2, AZ(2));
  // Bisel y pantalla.
  l.rect(5, 2, 86, 32, AZ(1));
  l.rect(5, 2, 86, 1, AZ(2));
  l.rect(5, 2, 1, 32, AZ(2));
  l.rect(90, 3, 1, 31, AZ(0));
  l.rect(6, 33, 84, 1, AZ(0));
  pantallaDiapositiva(l, 8, 5, 80, 26);
  l.linea(12, 29, 20, 21, 'blanco');
  l.linea(16, 29, 22, 23, VI(3));
  return cerrar(l);
}

function pantallaSalaLateral(): Lienzo {
  const l = new Lienzo(32, 112);
  // Pie en T visto de lado: una barra larga en el piso y el poste.
  l.rect(14, 78, 4, 10, AZ(2));
  l.rect(14, 78, 1, 10, AZ(3));
  l.rect(12, 88, 8, 2, AZ(2));
  l.rect(12, 88, 8, 1, AZ(3));
  l.rect(12, 18, 8, 3, AZ(1));
  // Lámina de pantalla vista de canto: un listón alto con el filo encendido hacia el este.
  l.rect(13, 6, 7, 74, AZ(1));
  l.rect(13, 6, 1, 74, AZ(2));
  l.rect(19, 7, 1, 73, AZ(0));
  l.rect(19, 10, 1, 66, VI(3));
  l.rect(18, 10, 1, 66, VI(2));
  for (const y of [18, 50, 76]) l.rect(13, y, 7, 1, AZ(0));
  for (const y of [90, 18]) l.rect(11, y + 1, 10, 1, AZ(2));
  return cerrar(l);
}

export function dibujarTecnologia(salida: Cuadros): void {
  registrarObjeto(salida, 'tv-pared', (clave) => (clave === 'S' ? tvParedS() : tvParedLateral(clave === 'E' ? 'E' : 'O')));
  registrarObjeto(salida, 'pantalla-sala', (clave) => (clave === 'S' ? pantallaSalaS() : pantallaSalaLateral()));
}
