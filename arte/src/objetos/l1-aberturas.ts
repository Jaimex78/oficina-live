/**
 * Aberturas del lote 1: ventana, puerta simple y puerta doble, más el portal (una baldosa mágica del piso).
 *
 * Una abertura ocupa el lugar de una pieza de pared y debe encajar con los muros vecinos: misma tapa,
 * misma altura, mismo grosor y la misma pared lisa a ambos lados. Por eso cada una parte de la pared
 * lisa (`muroLiso`) con la máscara de un tramo recto (0101 en horizontal, 1010 en vertical) y le suma su marco.
 *
 * En tramos horizontales (orientación S) la cara se ve de frente y la abertura es un hueco de verdad.
 * En tramos verticales (E y O) solo se ve la tapa como una franja delgada, así que la abertura se lee en la
 * franja: la ventana es un cristal con marco dentro de la tapa y la puerta es un dintel de madera con sus dos jambas.
 */

import { Lienzo } from '../nucleo';
import { registrarObjeto, type Cuadros } from './l1-comun';
import { PARED_ALTO, PARED_ANCHO, TALLO_X0, TALLO_X1, muroLiso } from './l1-paredes';

// ---------------------------------------------------------------------------
// Ventana
// ---------------------------------------------------------------------------

/** Un vidrio de ventana: cielo claro arriba, un poco más profundo abajo, sombra de hueco y un destello. */
function vidrioDeVentana(l: Lienzo, x: number, y: number, ancho: number, alto: number): void {
  l.rect(x, y, ancho, alto, 'vidrio-2');
  l.rect(x, y, ancho, Math.ceil(alto * 0.45), 'vidrio-3');
  l.rect(x, y, ancho, 1, 'vidrio-1'); // sombra del dintel
  l.rect(x, y, 1, alto, 'vidrio-1'); // sombra de la jamba izquierda
  l.rect(x + 1, y + alto - 2, ancho - 1, 1, 'vidrio-3'); // reflejo en el borde bajo
  // Destello en diagonal, dos trazos paralelos.
  l.linea(x + 2, y + 6, x + 5, y + 3, 'blanco');
  l.linea(x + 4, y + 7, x + 7, y + 4, 'vidrio-3');
}

/** Ventana de frente en un tramo horizontal: marco blanco de 4 vidrios, alféizar y sombra bajo el alféizar. */
export function ventanaS(): Lienzo {
  const l = muroLiso('0101');
  // Marco exterior y su fino contorno sobre la pared.
  l.rectBorde(2, 20, 28, 31, 'lavanda-1');
  l.rect(3, 21, 26, 28, 'neutro-6');
  l.rect(3, 21, 26, 1, 'blanco'); // luz arriba
  l.rect(3, 21, 1, 28, 'blanco'); // luz a la izquierda
  l.rect(28, 22, 1, 27, 'neutro-5'); // sombra a la derecha
  l.rect(4, 48, 25, 1, 'neutro-5'); // sombra abajo
  // Cuatro vidrios con travesaños de 2 px.
  vidrioDeVentana(l, 5, 23, 10, 11);
  vidrioDeVentana(l, 17, 23, 10, 11);
  vidrioDeVentana(l, 5, 36, 10, 11);
  vidrioDeVentana(l, 17, 36, 10, 11);
  l.rect(15, 23, 2, 24, 'neutro-6');
  l.rect(16, 23, 1, 24, 'neutro-5');
  l.rect(5, 34, 22, 2, 'neutro-6');
  l.rect(5, 35, 22, 1, 'neutro-5');
  // Alféizar que sobresale y su sombra sobre la pared.
  l.rect(1, 49, 30, 1, 'blanco');
  l.rect(1, 50, 30, 1, 'neutro-5');
  l.rect(2, 51, 28, 1, 'lavanda-1');
  return l;
}

/**
 * Ventana en un tramo vertical (E mira al este, O mira al oeste). Se ve desde arriba: dentro de la tapa
 * hay un cristal con marco blanco y, hacia el lado al que mira, el alféizar asoma de la pared.
 */
export function ventanaLateral(mira: 'E' | 'O'): Lienzo {
  const l = muroLiso('1010');
  l.rect(13, 3, 6, 26, 'neutro-6');
  l.rect(13, 3, 6, 1, 'blanco');
  l.rect(13, 3, 1, 26, 'blanco');
  l.rect(18, 4, 1, 25, 'neutro-5');
  l.rect(14, 28, 4, 1, 'neutro-5');
  vidrioLateral(l, 14, 4, 4, 24);
  // Alféizar: sobresale 2 px del lado al que mira, con luz a la izquierda.
  if (mira === 'E') {
    l.rect(21, 6, 1, 20, 'blanco');
    l.rect(22, 7, 1, 19, 'neutro-5');
    l.rect(21, 26, 2, 1, 'neutro-4');
  } else {
    l.rect(10, 6, 1, 20, 'blanco');
    l.rect(9, 7, 1, 19, 'neutro-6');
    l.rect(9, 26, 2, 1, 'neutro-4');
  }
  return l;
}

function vidrioLateral(l: Lienzo, x: number, y: number, ancho: number, alto: number): void {
  l.rect(x, y, ancho, alto, 'vidrio-2');
  l.rect(x, y, ancho, 8, 'vidrio-3');
  l.rect(x, y, 1, alto, 'vidrio-1');
  l.linea(x + 1, y + 10, x + 3, y + 6, 'blanco');
  l.linea(x + 1, y + 18, x + 3, y + 14, 'vidrio-3');
}

// ---------------------------------------------------------------------------
// Puertas
// ---------------------------------------------------------------------------

/** Marco de madera de una puerta de frente: dintel, dos jambas, bisagras y umbral. Ocupa `ancho` px desde x = 0. */
function marcoDePuerta(l: Lienzo, ancho: number): void {
  // La tapa de la puerta es de madera: así encaja tanto entre paredes lavanda como entre vidrios.
  l.rect(0, 6, ancho, 1, 'madera-clara-4');
  l.rect(0, 7, ancho, 8, 'madera-clara-3');
  l.rect(0, 15, ancho, 1, 'madera-clara-2');
  // Dintel: de la fila 16 a la 23, de lado a lado, justo debajo de la tapa.
  l.rect(0, 16, ancho, 1, 'madera-clara-4');
  l.rect(0, 17, ancho, 5, 'madera-clara-3');
  l.rect(0, 22, ancho, 1, 'madera-clara-2');
  l.rect(0, 23, ancho, 1, 'madera-clara-1');
  // El hueco: se borra la cara de la pared para que se vea lo que hay detrás.
  l.rect(3, 24, ancho - 6, PARED_ALTO - 24, null);
  // Jambas: luz a la izquierda de cada una.
  l.rect(0, 24, 1, PARED_ALTO - 24, 'madera-clara-4');
  l.rect(1, 24, 2, PARED_ALTO - 24, 'madera-clara-3');
  l.rect(ancho - 3, 24, 2, PARED_ALTO - 24, 'madera-clara-3');
  l.rect(ancho - 1, 24, 1, PARED_ALTO - 24, 'madera-clara-2');
  // Fondo del hueco: una línea de sombra en el dintel y en las jambas, para dar profundidad.
  l.rect(3, 24, ancho - 6, 1, 'madera-clara-1');
  l.rect(3, 25, 1, PARED_ALTO - 25, 'madera-clara-1');
  l.rect(ancho - 4, 25, 1, PARED_ALTO - 25, 'madera-clara-2');
  // Bisagras: dos pletinas de metal en la jamba izquierda.
  for (const y of [32, 50]) {
    l.rect(1, y, 2, 4, 'metal-3');
    l.rect(1, y + 3, 2, 1, 'metal-1');
    l.px(2, y + 1, 'metal-1');
  }
  // Umbral de metal pegado al piso.
  l.rect(4, 61, ancho - 8, 1, 'metal-3');
  l.rect(4, 62, ancho - 8, 1, 'metal-2');
  l.rect(4, 63, ancho - 8, 1, 'metal-1');
}

/** Puerta simple de frente (orientación S): un hueco de 26 px con marco de madera en un tramo recto. */
export function puertaSimpleS(): Lienzo {
  const l = muroLiso('0101');
  marcoDePuerta(l, PARED_ANCHO);
  return l;
}

/** Puerta doble de frente (orientación S): ocupa dos casillas y deja un hueco de 58 px. */
export function puertaDobleS(): Lienzo {
  const l = new Lienzo(PARED_ANCHO * 2, PARED_ALTO);
  l.pegar(muroLiso('0101'), 0, 0);
  l.pegar(muroLiso('0101'), PARED_ANCHO, 0);
  marcoDePuerta(l, PARED_ANCHO * 2);
  return l;
}

/**
 * Puerta en un tramo vertical (orientación E): la tapa pasa a ser un dintel de madera con una jamba en cada
 * extremo. `casillas` es 1 en la puerta simple y 2 en la doble (en la doble, el cuadro mide 32 x 96).
 */
export function puertaVertical(casillas: 1 | 2): Lienzo {
  const largo = 32 * casillas;
  const l = new Lienzo(PARED_ANCHO, PARED_ALTO + 32 * (casillas - 1));
  const ancho = TALLO_X1 - TALLO_X0;
  l.rect(TALLO_X0, 0, ancho, largo, 'madera-clara-3');
  l.rect(TALLO_X0, 0, 1, largo, 'madera-clara-4'); // luz a la izquierda
  l.rect(TALLO_X1 - 1, 0, 1, largo, 'madera-clara-2'); // sombra a la derecha
  // Jambas: un bloque en cada extremo con su junta, y la junta de las hojas en el centro de la doble.
  for (const y of [0, largo - 4]) {
    l.rect(TALLO_X0, y, ancho, 4, 'madera-clara-2');
    l.rect(TALLO_X0, y, 1, 4, 'madera-clara-3');
  }
  l.rect(TALLO_X0, 4, ancho, 1, 'madera-clara-1');
  l.rect(TALLO_X0, largo - 5, ancho, 1, 'madera-clara-1');
  if (casillas === 2) l.rect(TALLO_X0, largo / 2 - 1, ancho, 2, 'madera-clara-1');
  // Manijas de metal: un par de puntos en el lado derecho del dintel de cada hoja.
  for (let i = 0; i < casillas; i++) {
    const y = 12 + 32 * i;
    l.rect(TALLO_X1 - 4, y, 2, 2, 'metal-3');
    l.rect(TALLO_X1 - 4, y + 2, 2, 1, 'metal-1');
  }
  return l.contorno('azul-oficina-0', { diagonales: true });
}

// ---------------------------------------------------------------------------
// Portal
// ---------------------------------------------------------------------------

/**
 * Portal: una baldosa mágica que brilla. Placa de metal redonda con runas, un disco de luz azul que se
 * aclara hasta un núcleo blanco, destellos en espiral y cuatro gemas rojas (el acento rojo coral).
 * La luz violeta azulada se dibuja con la rampa `vidrio`: es la más cercana que tiene la paleta.
 */
export function portal(): Lienzo {
  const l = new Lienzo(32, 32);
  const c = 15.5;
  // Placa de metal: borde oscuro, bisel claro arriba a la izquierda.
  l.elipse(c, c, 14.5, 14.5, 'azul-oficina-0');
  l.elipseSombreada(c, c, 13.5, 13.5, ['metal-1', 'metal-2', 'metal-3'], { relieve: 0.55 });
  l.elipse(c, c, 10.5, 10.5, 'azul-oficina-0'); // ranura interior
  // Disco de luz en bandas: del azul profundo al núcleo blanco.
  const bandas: Array<[number, string]> = [[9.5, 'vidrio-0'], [8, 'vidrio-1'], [6.2, 'vidrio-2'], [4.4, 'vidrio-3'], [2.4, 'blanco']];
  for (const [r, color] of bandas) l.elipse(c, c, r, r, color);
  // Espiral: cuatro brazos de destello que giran alrededor del núcleo.
  for (let k = 0; k < 4; k++) {
    const a0 = (k * Math.PI) / 2;
    for (let t = 0; t <= 1; t += 0.06) {
      const radio = 3 + t * 5.4;
      const ang = a0 + t * 1.5;
      const x = Math.round(c + Math.cos(ang) * radio);
      const y = Math.round(c + Math.sin(ang) * radio);
      l.px(x, y, t < 0.5 ? 'blanco' : 'vidrio-3');
    }
  }
  // Runas en la placa: ocho marcas cortas entre el borde y la ranura.
  for (let k = 0; k < 8; k++) {
    const ang = (k * Math.PI) / 4 + Math.PI / 8;
    const x = Math.round(c + Math.cos(ang) * 12.2);
    const y = Math.round(c + Math.sin(ang) * 12.2);
    l.px(x, y, 'azul-oficina-0');
  }
  // Gemas rojas en los cuatro puntos cardinales de la placa.
  for (const [x, y] of [[15, 3], [15, 27], [3, 15], [27, 15]] as const) {
    l.rect(x, y, 2, 2, 'rojo-3');
    l.px(x, y, 'rojo-4');
    l.px(x + 1, y + 1, 'rojo-2');
  }
  return l;
}

export function dibujarAberturas(salida: Cuadros): void {
  registrarObjeto(salida, 'pared-ventana', (clave) => (clave === 'S' ? ventanaS() : ventanaLateral(clave === 'E' ? 'E' : 'O')), {});
  registrarObjeto(salida, 'puerta-simple', (clave) => (clave === 'S' ? puertaSimpleS() : puertaVertical(1)));
  registrarObjeto(salida, 'puerta-doble', (clave) => (clave === 'S' ? puertaDobleS() : puertaVertical(2)));
  registrarObjeto(salida, 'portal', portal);
}
