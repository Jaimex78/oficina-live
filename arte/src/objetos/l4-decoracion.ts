/**
 * Objetos pequeños de la primera mitad del lote 3 (los del catálogo de Gather): manzana, cono naranja, planta de hojas
 * en bowl, suculenta, planta globo, lámpara de escritorio, pato de goma, taza con postre, bowl de comida, consola con
 * control, figuritas y reloj de pie.
 *
 * Los apoyados (manzana, plantas de escritorio, lámpara, pato, taza, bowl, consola, figuritas) se dibujan ya sobre la
 * tapa de un escritorio: su última fila de cuerpo es `FILA_APOYO` (15), la fila 0 queda para el contorno y llevan un
 * reborde de sombra de 1 px. El cono, la planta globo y el reloj de pie son de suelo: sombra en dos tonos y, los altos,
 * una mancha de contacto bajo la base. La lámpara y la consola emiten luz: su parte encendida lleva los tonos más claros.
 */

import { Lienzo, rampa } from '../nucleo';
import type { ColorEntrada } from '../nucleo';
import { poligono } from './l2b-comun';
import { B, cerrarApoyado, cerrarSuelo, enElipse, registrar, volumen } from './l4-comun';
import type { Cuadros } from './l4-comun';

/** Atajo: lienzo desde una cuadrícula de texto (`.` es transparente). */
function cuadricula(lineas: readonly string[], leyenda: Readonly<Record<string, ColorEntrada>>): Lienzo {
  return Lienzo.desdeTexto(lineas, leyenda);
}

/** Rampa como lista de nombres de color (`planta-1`, `planta-2`...). */
function tonosDe(nombre: string, desde: number, hasta: number): string[] {
  const n = rampa(nombre).length;
  const r: string[] = [];
  for (let i = desde; i <= Math.min(hasta, n - 1); i++) r.push(`${nombre}-${i}`);
  return r;
}

// ---------------------------------------------------------------------------
// Manzana
// ---------------------------------------------------------------------------

/** Manzana roja con dos lóbulos arriba, rabito, una hoja y un destello. Mide 12 x 11 y apoya en la fila 15. */
export function dibujarManzana(): Lienzo {
  const l = new Lienzo(32, 32);
  const cx = 16;
  const cy = 11;
  // Dos lóbulos que se juntan: la muesca de arriba sale sola de la unión.
  const dentro = (x: number, y: number) => enElipse(x, y, cx - 2, cy, 4, 4) || enElipse(x, y, cx + 2, cy, 4, 4) || (y >= cy && enElipse(x, y, cx, cy, 5, 4));
  volumen(l, cx, cy, 6.5, 5.5, dentro, ['rojo-1', 'rojo-2', 'rojo-3', 'rojo-4']);
  l.px(13, 8, 'neutro-7'); // destello
  l.px(13, 9, 'rojo-4');
  l.px(14, 7, 'rojo-4');
  // Rabito y hoja.
  l.px(16, 7, 'madera-oscura-3');
  l.px(16, 6, 'madera-oscura-2');
  l.px(17, 5, 'madera-oscura-2');
  l.rect(18, 4, 3, 1, 'planta-3');
  l.rect(18, 5, 4, 1, 'planta-3');
  l.rect(19, 6, 2, 1, 'planta-2');
  l.px(18, 4, 'planta-4');
  l.px(19, 5, 'planta-4');
  return cerrarApoyado(l, { diagonales: true });
}

// ---------------------------------------------------------------------------
// Cono naranja
// ---------------------------------------------------------------------------

/** Cono de tráfico: cuerpo naranja con luz a la izquierda, dos bandas reflectantes y base cuadrada. Es de suelo. */
export function dibujarConoNaranja(): Lienzo {
  const l = new Lienzo(32, 32);
  const y0 = 5;
  const y1 = 24;
  // Base cuadrada vista desde arriba: cara superior y canto.
  l.rect(6, 24, 20, 2, 'naranja-3');
  l.rect(6, 26, 20, 3, 'naranja-1');
  l.rect(6, 26, 20, 1, 'naranja-2');
  l.rect(6, 24, 20, 1, 'naranja-4');
  l.rect(6, 24, 1, 5, 'naranja-3');
  l.rect(25, 26, 1, 3, 'naranja-0');
  l.rect(7, 28, 18, 1, 'naranja-0');
  for (const [x, y] of [[6, 24], [25, 24], [6, 28], [25, 28]] as const) l.px(x, y, null);
  // Cuerpo: trapecio que se abre hacia abajo, con las puntas redondeadas arriba.
  for (let y = y0; y <= y1; y++) {
    const t = (y - y0) / (y1 - y0);
    const mitad = 2.5 + t * 6; // semiancho
    const izq = Math.round(16 - mitad);
    const der = Math.round(16 + mitad);
    const ancho = der - izq;
    const banda = (y >= 12 && y <= 14) || (y >= 17 && y <= 19);
    for (let x = izq; x < der; x++) {
      const u = (x - izq) / ancho;
      let c: string;
      if (banda) c = u < 0.3 ? 'neutro-7' : u < 0.7 ? 'neutro-6' : 'neutro-5';
      else c = u < 0.25 ? 'naranja-3' : u < 0.62 ? 'naranja-2' : 'naranja-1';
      l.px(x, y, c);
    }
  }
  l.rect(14, y0 - 1, 4, 1, 'naranja-3'); // punta redondeada
  l.px(14, y0, 'naranja-4');
  return cerrarSuelo(l, { contacto: [17, 28, 10, 2] });
}

// ---------------------------------------------------------------------------
// Planta de hojas en bowl
// ---------------------------------------------------------------------------

/** Bowl blanco azulado: solo se ve la mitad de adelante (la de atrás la tapan las hojas): labio claro y cuerpo redondo. */
function bowl(l: Lienzo, cx: number, yBorde: number, rx: number): void {
  for (let y = yBorde; y <= B; y++) {
    const t = (y - yBorde) / (B - yBorde + 0.5);
    const mitad = y === yBorde ? rx : Math.round(rx * Math.sqrt(Math.max(0, 1 - t * t * 0.6)));
    for (let x = cx - mitad; x <= cx + mitad; x++) {
      const u = (x - (cx - mitad)) / Math.max(1, 2 * mitad);
      l.px(x, y, y === yBorde ? 'neutro-7' : u < 0.28 ? 'neutro-7' : u < 0.7 ? 'baldosa-gris-4' : 'baldosa-gris-3');
    }
  }
  l.rect(cx - rx + 3, B, 2 * rx - 5, 1, 'baldosa-gris-2');
  l.rect(cx + 2, yBorde + 1, rx - 2, 1, 'baldosa-gris-3'); // sombra del labio
}

/** Una hoja con punta y su propio contorno verde oscuro: así las hojas se separan unas de otras. */
function hojaConBorde(l: Lienzo, base: readonly [number, number], punta: readonly [number, number], ancho: number): void {
  const capa = new Lienzo(l.ancho, l.alto);
  capa.hoja(base, punta, ancho, tonosDe('planta', 2, 4));
  capa.contorno('planta-1');
  l.pegar(capa, 0, 0);
}

/** Planta de hojas anchas en un bowl gris azulado: abanico de hojas con punta, brillantes, cada una con su borde. */
export function dibujarPlantaHelecho(): Lienzo {
  const l = new Lienzo(32, 32);
  // Las de afuera y de atrás primero; el labio del bowl tapa después sus bases.
  hojaConBorde(l, [12, 12], [3, 7], 7);
  hojaConBorde(l, [20, 12], [29, 7], 7);
  hojaConBorde(l, [13, 12], [6, 3], 7);
  hojaConBorde(l, [19, 12], [26, 3], 7);
  hojaConBorde(l, [15, 12], [11, 2], 7);
  hojaConBorde(l, [17, 12], [21, 2], 7);
  hojaConBorde(l, [16, 12], [16, 4], 7);
  bowl(l, 16, 11, 8);
  return cerrarApoyado(l);
}

// ---------------------------------------------------------------------------
// Suculenta
// ---------------------------------------------------------------------------

/** Suculenta gris verdosa con dos brazos, en una maceta redonda azul marino. */
export function dibujarSuculenta(): Lienzo {
  const l = new Lienzo(32, 32);
  const cx = 16;
  // Maceta: cuerpo cónico y borde claro.
  for (let y = 10; y <= B; y++) {
    const mitad = y === 10 ? 6 : y <= 12 ? 5 : y <= 14 ? 4 : 3;
    for (let x = cx - mitad; x <= cx + mitad; x++) {
      const u = (x - (cx - mitad)) / (2 * mitad);
      l.px(x, y, u < 0.3 ? 'azul-oficina-3' : u < 0.7 ? 'azul-oficina-2' : 'azul-oficina-1');
    }
  }
  l.rect(cx - 6, 10, 13, 1, 'azul-oficina-4');
  l.rect(cx - 5, 9, 11, 1, 'madera-oscura-2');
  // Tronco central y brazos.
  const verde = (x: number, y: number, ancho: number, alto: number) => {
    l.rect(x, y, ancho, alto, 'hoja-pastel-2');
    l.rect(x, y, 1, alto, 'hoja-pastel-3');
    l.rect(x + ancho - 1, y, 1, alto, 'hoja-pastel-1');
  };
  verde(14, 1, 5, 9);
  l.px(14, 1, null);
  l.px(18, 1, null);
  verde(8, 5, 3, 5); // brazo izquierdo, pegado por un codo
  l.rect(10, 8, 4, 2, 'hoja-pastel-2');
  l.rect(10, 8, 4, 1, 'hoja-pastel-3');
  l.px(8, 5, null);
  l.px(10, 5, null);
  verde(22, 3, 3, 6); // brazo derecho
  l.rect(19, 7, 4, 2, 'hoja-pastel-2');
  l.rect(19, 7, 4, 1, 'hoja-pastel-3');
  l.px(22, 3, null);
  l.px(24, 3, null);
  // Espinas.
  for (const [x, y] of [[16, 3], [16, 6], [9, 7], [23, 5]] as const) l.px(x, y, 'hoja-pastel-4');
  return cerrarApoyado(l);
}

// ---------------------------------------------------------------------------
// Planta globo
// ---------------------------------------------------------------------------

/** Planta globo: una copa redonda y tupida sobre un tallo corto, en una maceta gris azulada. Es de suelo y sobresale 8. */
export function dibujarPlantaGlobo(): Lienzo {
  const l = new Lienzo(32, 40);
  // Maceta: cuerpo acampanado con labio claro.
  for (let y = 27; y <= 35; y++) {
    const t = (y - 27) / 8;
    const mitad = Math.round(8 - t * 3);
    for (let x = 17 - mitad; x <= 17 + mitad; x++) {
      const u = (x - (17 - mitad)) / (2 * mitad);
      l.px(x, y, u < 0.3 ? 'neutro-7' : u < 0.68 ? 'baldosa-gris-4' : 'baldosa-gris-3');
    }
  }
  l.rect(9, 27, 17, 2, 'neutro-7');
  l.rect(9, 28, 17, 1, 'baldosa-gris-4');
  l.rect(12, 35, 11, 1, 'baldosa-gris-2');
  l.rect(10, 29, 15, 1, 'baldosa-gris-2');
  // Tallo.
  l.rect(16, 21, 3, 7, 'planta-2');
  l.rect(16, 21, 1, 7, 'planta-3');
  l.rect(18, 21, 1, 7, 'planta-1');
  // Copa: esfera con luz arriba a la izquierda y mechones oscuros que dan textura de hojas.
  l.elipseSombreada(16, 12, 9, 9, ['planta-1', 'planta-2', 'planta-3', 'planta-4']);
  for (const [x, y, ancho] of [[12, 14, 4], [17, 18, 4], [20, 11, 3], [11, 9, 3]] as const) {
    l.rect(x, y, ancho, 1, 'planta-1');
    l.rect(x + 1, y - 1, ancho - 1, 1, 'planta-2');
  }
  l.rect(11, 6, 3, 1, 'planta-4');
  l.px(10, 8, 'planta-4');
  return cerrarSuelo(l, { contacto: [18, 36, 9, 2] });
}

// ---------------------------------------------------------------------------
// Lámpara de escritorio
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Pato de goma
// ---------------------------------------------------------------------------

/** Pato de goma amarillo de perfil, mirando a la derecha: pico naranja, ala, cola levantada y brillo. Mide 15 x 12. */
export function dibujarPatoDeGoma(): Lienzo {
  const parte = cuadricula(
    [
      '.......hhhh......',
      '......hhyyyy.....',
      '.....hhyyykyy.oo.',
      '.....hyyyyyyyooO.',
      '.....yyyyyyyyyO..',
      '..h...yyyyyyyy...',
      '.hyh.yyyyyyyyyy..',
      '.yyyyyyyyyyyyyy..',
      'yyyyyywwyyyyyyy..',
      'yyyyywwwwyyyyyy..',
      '.ssyyyyyyyyyyss..',
      '..sssssssssssss..',
    ],
    {
      h: 'tela-calida-3',
      y: 'tela-calida-2',
      s: 'tela-calida-1',
      k: 'azul-oficina-0',
      o: 'naranja-2',
      O: 'naranja-1',
      w: 'tela-calida-3',
    },
  );
  const l = new Lienzo(32, 32);
  l.pegar(parte, 8, B - 11);
  return cerrarApoyado(l, { diagonales: true });
}

// ---------------------------------------------------------------------------
// Taza con postre
// ---------------------------------------------------------------------------

/** Taza gris azulada con un remolino de crema en tres pisos, una cereza y una barquilla clavada a la derecha. */
export function dibujarTazaPostre(): Lienzo {
  const l = new Lienzo(32, 32);
  // Asa a la derecha: anillo de 4 x 5 con el hueco vacío.
  l.rect(21, 10, 4, 5, 'baldosa-gris-3');
  l.rect(22, 11, 2, 3, null);
  l.rect(21, 10, 3, 1, 'baldosa-gris-4');
  // Cuerpo de la taza: luz a la izquierda, sombra a la derecha y abajo.
  l.rectRedondeado(10, 9, 12, 7, 2, 'baldosa-gris-3');
  l.rectRedondeado(10, 9, 11, 6, 2, 'baldosa-gris-4');
  l.rect(10, 10, 2, 4, 'neutro-7');
  l.rect(11, 9, 8, 1, 'neutro-7');
  l.rect(12, 15, 8, 1, 'baldosa-gris-2');
  l.rect(14, 12, 4, 1, 'vidrio-1'); // franja decorativa
  // Crema en tres pisos, cada uno más angosto, con una línea de sombra entre uno y otro.
  const piso = (x: number, y: number, ancho: number, alto: number) => {
    l.rectRedondeado(x, y, ancho, alto, 2, 'pared-calida-2');
    l.rectRedondeado(x, y, ancho - 1, alto - 1, 2, 'pared-calida-3');
    l.rect(x + 1, y, Math.max(1, ancho - 4), 1, 'neutro-7');
    l.rect(x + 1, y, 1, Math.max(1, alto - 2), 'neutro-7');
  };
  piso(11, 7, 10, 4);
  piso(12, 5, 8, 3);
  piso(14, 3, 5, 3);
  // Cereza arriba.
  l.rect(15, 1, 2, 2, 'rojo-3');
  l.px(15, 1, 'rojo-4');
  // Barquilla clavada hacia arriba y a la derecha.
  l.linea(18, 7, 23, 2, 'madera-clara-2');
  l.linea(19, 7, 24, 2, 'madera-clara-3');
  l.linea(17, 7, 22, 2, 'madera-clara-1');
  return cerrarApoyado(l, { diagonales: true });
}

// ---------------------------------------------------------------------------
// Bowl de comida
// ---------------------------------------------------------------------------

/** Tazón de fideos visto desde arriba: caldo, fideos, medio huevo, carne y cebollín dentro de un bowl gris azulado. */
export function dibujarBowlComida(): Lienzo {
  const l = new Lienzo(32, 32);
  const cx = 16;
  const cy = 6;
  // Cuerpo: la mitad de abajo del bowl, que se cierra hacia la base.
  for (let y = cy; y <= B; y++) {
    const t = (y - cy) / (B - cy + 0.4);
    const mitad = Math.round(10 * Math.sqrt(Math.max(0, 1 - t * t * 0.78)));
    for (let x = cx - mitad; x <= cx + mitad; x++) {
      const u = (x - (cx - mitad)) / Math.max(1, 2 * mitad);
      l.px(x, y, u < 0.25 ? 'neutro-7' : u < 0.66 ? 'baldosa-gris-4' : 'baldosa-gris-3');
    }
  }
  l.rect(cx - 4, B, 9, 1, 'baldosa-gris-2');
  l.rect(cx - 8, cy + 6, 15, 1, 'vidrio-1'); // banda decorativa
  l.rect(cx - 8, cy + 6, 4, 1, 'vidrio-2');
  // Borde: anillo claro y, adentro, el caldo.
  l.elipse(cx, cy, 10, 4, 'neutro-7');
  l.elipse(cx, cy + 1, 9, 3, 'baldosa-gris-3');
  l.elipse(cx, cy + 1, 8, 3, 'naranja-1');
  l.elipse(cx, cy + 1, 7, 2, 'naranja-2');
  // Fideos: trazos claros que se cruzan.
  for (const [x, y, ancho] of [[10, 6, 4], [13, 8, 5], [17, 5, 5], [20, 7, 3], [11, 5, 3]] as const) l.rect(x, y, ancho, 1, 'tela-calida-3');
  l.rect(12, 7, 3, 1, 'tela-calida-2');
  l.rect(18, 6, 3, 1, 'tela-calida-2');
  // Medio huevo con yema, una lonja de carne y cebollín.
  l.elipse(12, 6, 2, 1, 'neutro-7');
  l.px(12, 6, 'tela-calida-2');
  l.px(13, 6, 'tela-calida-2');
  l.elipse(20, 7, 2, 1, 'rojo-suave-2');
  l.px(19, 7, 'rojo-suave-3');
  for (const [x, y] of [[16, 5], [17, 7], [14, 8], [22, 6]] as const) l.px(x, y, 'planta-3');
  return cerrarApoyado(l, { diagonales: true });
}

// ---------------------------------------------------------------------------
// Consola y control
// ---------------------------------------------------------------------------

/** Consola oscura con un cartucho asomando y un piloto azul encendido, y un control gris claro con botones de colores. */
export function dibujarConsolaJuegos(): Lienzo {
  const l = new Lienzo(32, 32);
  // Cartucho que asoma por arriba, detrás de la consola.
  l.rect(8, 3, 6, 4, 'rojo-3');
  l.rect(8, 3, 6, 1, 'rojo-4');
  l.rect(9, 4, 4, 1, 'neutro-7');
  l.rect(13, 3, 1, 4, 'rojo-2');
  // Consola: cara superior y frente, luz a la izquierda y sombra a la derecha.
  l.rect(3, 7, 15, 3, 'azul-oficina-3');
  l.rect(3, 7, 15, 1, 'azul-oficina-4');
  l.rect(3, 7, 1, 3, 'azul-oficina-4');
  l.rect(3, 10, 15, 5, 'azul-oficina-2');
  l.rect(3, 10, 1, 5, 'azul-oficina-3');
  l.rect(17, 10, 1, 5, 'azul-oficina-1');
  l.rect(3, 14, 15, 1, 'azul-oficina-1');
  l.rect(6, 11, 9, 1, 'azul-oficina-1'); // ranura
  // Piloto y botón de encendido: lo que emite luz lleva los tonos más claros.
  l.rect(5, 13, 3, 1, 'vidrio-3');
  l.px(6, 13, 'neutro-7');
  l.rect(13, 13, 2, 1, 'azul-oficina-4');
  // Control: cuerpo con dos agarraderas.
  l.rect(20, 8, 10, 3, 'baldosa-gris-4');
  l.rect(19, 10, 4, 5, 'baldosa-gris-4');
  l.rect(27, 10, 4, 5, 'baldosa-gris-4');
  l.rect(21, 11, 8, 2, 'baldosa-gris-4');
  l.rect(20, 8, 10, 1, 'neutro-7');
  l.rect(19, 10, 1, 4, 'neutro-7');
  l.rect(30, 10, 1, 4, 'baldosa-gris-3');
  l.rect(20, 14, 3, 1, 'baldosa-gris-3');
  l.rect(28, 14, 3, 1, 'baldosa-gris-3');
  l.rect(22, 13, 6, 1, 'baldosa-gris-3');
  // Cruceta y botones.
  l.rect(21, 10, 3, 1, 'azul-oficina-2');
  l.rect(22, 9, 1, 3, 'azul-oficina-2');
  l.px(27, 9, 'rojo-suave-3');
  l.px(29, 10, 'hoja-pastel-3');
  l.px(27, 11, 'vidrio-2');
  l.px(25, 10, 'tela-calida-3');
  return cerrarApoyado(l);
}

// ---------------------------------------------------------------------------
// Figuritas
// ---------------------------------------------------------------------------

/** Tres figuritas de colección: un robot azul, un gato naranja sentado y un dinosaurio verde. */
export function dibujarFiguritas(): Lienzo {
  const robot = cuadricula(
    [
      '....r....',
      '....g....',
      '.abbbbbc.',
      '.abkbkbc.',
      '.abbbbbc.',
      '.accccdc.',
      '..bbbbc..',
      '.bbyybbc.',
      '.bbbbbcc.',
      '..bb.cc..',
      '..bb.cc..',
    ],
    { a: 'vidrio-3', b: 'vidrio-2', c: 'vidrio-1', d: 'vidrio-0', k: 'azul-oficina-0', r: 'rojo-3', g: 'metal-2', y: 'tela-calida-3' },
  );
  const gato = cuadricula(
    [
      '.a....a.',
      '.aa..aa.',
      'abbbbbbc',
      'abkbbkbc',
      'abbwwbbc',
      '.abbbbc.',
      'abbbbbbc',
      'abbwwbbc',
      'abbbbbcc',
      '.ccc.cc.',
    ],
    { a: 'naranja-3', b: 'naranja-2', c: 'naranja-1', k: 'azul-oficina-0', w: 'neutro-7' },
  );
  const dino = cuadricula(
    [
      '...ddd...',
      '..daabbb.',
      '..abkbbb.',
      '.dabbbbbb',
      '.dabbwww.',
      'dabbbbc..',
      'dabbbbbc.',
      '.abbbbbcc',
      '..bb.bc..',
      '..cc.cc..',
    ],
    { a: 'planta-4', b: 'planta-3', c: 'planta-2', d: 'tela-calida-3', k: 'azul-oficina-0', w: 'neutro-7' },
  );
  const l = new Lienzo(32, 32);
  l.pegar(robot, 2, B - 10);
  l.pegar(gato, 13, B - 9);
  l.pegar(dino, 22, B - 9);
  // Una peana corta bajo todas: una tira de madera clara.
  l.rect(2, B, 29, 1, 'madera-clara-2');
  return cerrarApoyado(l);
}

// ---------------------------------------------------------------------------
// Reloj de pie
// ---------------------------------------------------------------------------

/** Reloj de pie de madera: copete arqueado con esfera, cuerpo con vidrio y péndulo dorado, y base con zócalo. Mide 32 x 64. */
export function dibujarRelojDePie(): Lienzo {
  const l = new Lienzo(32, 64);
  const [sombra, medio, luz, brillo] = ['madera-oscura-1', 'madera-oscura-2', 'madera-oscura-3', 'madera-oscura-4'] as const;
  // Cuerpo central.
  l.rect(8, 23, 16, 27, medio);
  l.rect(8, 23, 2, 27, luz);
  l.rect(22, 23, 2, 27, sombra);
  // Copete: rectángulo con arco arriba.
  for (let y = 2; y <= 22; y++) {
    const ancho = y < 10 ? Math.round(9 * Math.sqrt(Math.max(0, 1 - ((10 - y) / 8) ** 2))) : 9;
    for (let x = 16 - ancho; x < 16 + ancho; x++) {
      const u = (x - (16 - ancho)) / (2 * ancho);
      l.px(x, y, u < 0.18 ? luz : u > 0.82 ? sombra : medio);
    }
  }
  l.rect(9, 3, 3, 1, brillo);
  // Esfera: aro dorado, cara crema, marcas y manecillas (las diez y diez).
  l.elipse(16, 12, 6, 6, 'tela-calida-2');
  l.elipse(16, 12, 5, 5, 'pared-calida-3');
  l.rect(12, 8, 2, 1, 'tela-calida-3');
  l.px(10, 11, 'tela-calida-3');
  for (const [x, y] of [[16, 8], [16, 16], [12, 12], [20, 12]] as const) l.px(x, y, 'madera-oscura-1');
  l.linea(16, 12, 13, 9, 'azul-oficina-0');
  l.linea(16, 12, 19, 8, 'azul-oficina-0');
  l.px(16, 12, 'rojo-3');
  // Cuello con moldura dorada.
  l.rect(9, 19, 14, 4, sombra);
  l.rect(9, 19, 14, 1, 'tela-calida-2');
  l.rect(9, 22, 14, 1, 'tela-calida-1');
  // Puerta con vidrio: marco, fondo oscuro, péndulo y destello.
  l.rect(11, 26, 10, 21, luz);
  l.rect(12, 27, 8, 19, 'madera-oscura-0');
  l.rect(12, 27, 1, 19, 'azul-oficina-1');
  l.linea(14, 31, 13, 36, 'azul-oficina-3');
  l.linea(15, 28, 13, 33, 'azul-oficina-2');
  l.rect(15, 28, 2, 11, 'tela-calida-1'); // varilla
  l.elipse(16, 40, 3, 3, 'tela-calida-2'); // lenteja
  l.elipse(16, 40, 2, 2, 'tela-calida-3');
  l.px(15, 39, 'neutro-7');
  // Base: moldura clara, tablero con un panel hundido y dos patas.
  l.rect(6, 50, 20, 3, luz);
  l.rect(6, 50, 20, 1, brillo);
  l.rect(6, 52, 20, 1, sombra);
  l.rect(6, 53, 20, 5, medio);
  l.rect(6, 53, 2, 5, luz);
  l.rect(24, 53, 2, 5, sombra);
  l.rect(10, 54, 12, 3, sombra);
  l.rect(10, 54, 12, 1, 'madera-oscura-0');
  l.rect(11, 55, 10, 1, medio);
  l.rect(7, 58, 4, 2, sombra);
  l.rect(21, 58, 4, 2, sombra);
  return cerrarSuelo(l, { contacto: [17, 60, 11, 2] });
}

// ---------------------------------------------------------------------------
// Registro
// ---------------------------------------------------------------------------

/** Todos los cuadros de esta categoría que no son pisos, taza, bowl, consola, figuritas ni reloj (están en otros archivos). */
export function cuadrosPequenos(): Cuadros {
  const c: Cuadros = new Map();
  registrar(c, 'manzana', 'U', dibujarManzana());
  registrar(c, 'cono-naranja', 'U', dibujarConoNaranja());
  registrar(c, 'planta-helecho', 'U', dibujarPlantaHelecho());
  registrar(c, 'suculenta', 'U', dibujarSuculenta());
  registrar(c, 'planta-globo', 'U', dibujarPlantaGlobo());
  registrar(c, 'pato-de-goma', 'U', dibujarPatoDeGoma());
  registrar(c, 'taza-postre', 'U', dibujarTazaPostre());
  registrar(c, 'bowl-comida', 'U', dibujarBowlComida());
  registrar(c, 'consola-juegos', 'U', dibujarConsolaJuegos());
  registrar(c, 'figuritas', 'U', dibujarFiguritas());
  registrar(c, 'reloj-de-pie', 'U', dibujarRelojDePie());
  return c;
}
