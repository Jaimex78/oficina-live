/**
 * Pisos del lote 1: madera clara, madera oscura, baldosa y cemento. Cada uno es un tile de 32 x 32
 * que repite sin costuras (se comprueba con `mosaico(3, 3)` y `desplazar(16, 16)` en las pruebas).
 *
 * Reglas del piso: es el fondo de todo, así que poco contraste, tres tonos de una sola rampa y nada
 * de ruido. Nada se dibuja pegado a los bordes izquierdo y derecho: cada fila de tablas cruza el tile
 * completo y su junta vertical cae en un x distinto por fila. Las tramas usan coordenadas del lienzo.
 *
 * Estilo Gather: la madera clara es casi crema (como el ladrillo crema de los pasillos), la baldosa y el cemento son
 * gris azulado (`baldosa-gris`). El piso de madera oscura es una rampa más oscura que los muebles de nogal (tablero en tono 3), para que
 * escritorios y mesas se separen del suelo por valor y no solo por contorno.
 */

import { Lienzo } from '../nucleo';
import { registrarObjeto, vetas, type Cuadros } from './l1-comun';

/** Madera clara: tablas de 7 px con brillo en el canto y una junta de testa por fila. Es el piso de referencia del estilo. */
export function pisoMaderaClara(): Lienzo {
  const l = new Lienzo(32, 32);
  const juntas = [12, 28, 5, 21];
  const vetasPorFila: Array<Array<[number, number, number]>> = [
    [[2, 3, 6], [17, 5, 5]],
    [[8, 3, 5], [15, 5, 7]],
    [[11, 2, 6], [24, 5, 4]],
    [[3, 4, 5], [16, 2, 6]],
  ];
  for (let fila = 0; fila < 4; fila++) {
    const y = fila * 8;
    l.rect(0, y, 32, 7, 'ladrillo-crema-3'); // cuerpo de la tabla: roble claro, casi crema como el ladrillo del estilo Gather
    l.rect(0, y + 7, 32, 1, 'ladrillo-crema-1'); // ranura entre tablas
    l.rect(juntas[fila] ?? 0, y, 1, 7, 'ladrillo-crema-0'); // junta de testa
    for (const [x, dy, largo] of vetasPorFila[fila] ?? []) l.rect(x, y + dy, largo, 1, 'ladrillo-crema-2');
  }
  return l;
}

/**
 * Madera oscura (nogal): tablas anchas de 16 px, con la rampa un paso más oscura que los muebles.
 * Dos tablas por tile, cada una con una junta de testa en un x distinto y vetas largas y suaves.
 */
export function pisoMaderaOscura(): Lienzo {
  const l = new Lienzo(32, 32);
  const juntas = [21, 7];
  for (let fila = 0; fila < 2; fila++) {
    const y = fila * 16;
    l.rect(0, y, 32, 15, 'madera-oscura-2'); // cuerpo de la tabla
    l.rect(0, y, 32, 1, 'madera-oscura-3'); // brillo del canto superior
    l.rect(0, y + 15, 32, 1, 'madera-oscura-1'); // ranura entre tablas
    l.rect(juntas[fila] ?? 0, y, 1, 15, 'madera-oscura-1'); // junta de testa
    l.rect((juntas[fila] ?? 0) - 1, y, 1, 1, 'madera-oscura-3'); // la testa levanta un brillo junto a la junta
    vetas(l, 0, y + 2, 32, 12, 40 + fila * 7, { oscuras: 4, claras: 2, colorOscuro: 'madera-oscura-1', colorClaro: 'madera-oscura-3', largo: [6, 15] });
  }
  return l;
}

/**
 * Baldosa gris azulada clara: losetas de 16 x 16 con junta en el borde superior e izquierdo (así empatan solas
 * con las vecinas), bisel blanco arriba y a la izquierda, y un brillo corto distinto en cada loseta.
 */
export function pisoBaldosa(): Lienzo {
  const l = new Lienzo(32, 32);
  const brillos: Array<[number, number]> = [[11, 5], [8, 4], [9, 6], [12, 3]];
  let n = 0;
  for (const ty of [0, 16]) {
    for (const tx of [0, 16]) {
      const [largoArriba, largoIzquierda] = brillos[n++] ?? [10, 4];
      l.rect(tx, ty, 16, 16, 'baldosa-gris-4'); // cuerpo
      l.rect(tx, ty, 16, 1, 'baldosa-gris-3'); // junta superior
      l.rect(tx, ty, 1, 16, 'baldosa-gris-3'); // junta izquierda
      l.rect(tx + 2, ty + 1, largoArriba, 1, 'neutro-7'); // brillo del borde superior
      l.rect(tx + 1, ty + 2, 1, largoIzquierda, 'neutro-7'); // brillo del borde izquierdo
      l.rect(tx + 13, ty + 13, 2, 2, 'baldosa-gris-3'); // esquina en sombra, abajo a la derecha
    }
  }
  return l;
}

/**
 * Cemento pulido en gris azulado: una losa de 32 x 32 con junta de dilatación en el borde superior e izquierdo
 * y manchas suaves de dos tonos (rayas cortas de 1 px), sin ningún píxel suelto.
 */
export function pisoCemento(): Lienzo {
  const l = new Lienzo(32, 32);
  l.rect(0, 0, 32, 32, 'baldosa-gris-3');
  l.rect(0, 0, 32, 1, 'baldosa-gris-2'); // junta superior
  l.rect(0, 0, 1, 32, 'baldosa-gris-2'); // junta izquierda
  const claras: Array<[number, number, number]> = [[4, 4, 6], [19, 7, 5], [9, 13, 7], [22, 18, 6], [5, 24, 5], [15, 28, 6]];
  const oscuras: Array<[number, number, number]> = [[14, 3, 5], [3, 9, 4], [20, 12, 6], [12, 20, 5], [25, 26, 4], [7, 17, 4]];
  for (const [x, y, largo] of claras) l.rect(x, y, largo, 1, 'baldosa-gris-4');
  for (const [x, y, largo] of oscuras) l.rect(x, y, largo, 1, 'baldosa-gris-2');
  // Pulido: una franja diagonal apenas más clara, de 1 px.
  for (let i = 0; i < 6; i++) l.px(24 + i, 3 + i, 'baldosa-gris-4');
  return l;
}

export function dibujarPisos(salida: Cuadros): void {
  registrarObjeto(salida, 'piso-madera-clara', pisoMaderaClara);
  registrarObjeto(salida, 'piso-madera-oscura', pisoMaderaOscura);
  registrarObjeto(salida, 'piso-baldosa', pisoBaldosa);
  registrarObjeto(salida, 'piso-cemento', pisoCemento);
}
