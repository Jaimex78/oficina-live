/**
 * Pisos del lote 2A: alfombra gris, alfombra roja, césped, deck, parquet en espiga y baldosa de cocina.
 *
 * Estilo Gather: tonos suaves y desaturados, poco contraste y ningún ruido que compita con los objetos.
 * Todos son tiles de 32 x 32 sin costuras: los motivos que cruzan el borde se dibujan con vuelta al otro lado
 * (`pxEnvuelto`) y todo lo periódico tiene un período que divide a 32, así el mosaico de 3 x 3 y el tile
 * desplazado 16 px no muestran ninguna unión.
 */

import { Lienzo } from '../nucleo';
import { azar, entre, pxEnvuelto } from './l2a-comun';

const LADO = 32;

/**
 * Alfombra con zigzag escalonado: bandas diagonales de 4 px de dos tonos cercanos que suben y bajan 8 px.
 * El zigzag tiene período 8 en x y 16 en y (los dos dividen a 32), así que repite sin costura. Es el mismo
 * lenguaje de las alfombras de las salas de Gather, pero muy suave: casi no compite con lo que se pone encima.
 */
function alfombraZigzag(claro: string, oscuro: string, borde: string): Lienzo {
  const l = new Lienzo(LADO, LADO);
  for (let y = 0; y < LADO; y++) {
    const fase = y % 16;
    const desplazamiento = fase < 8 ? fase : 16 - fase;
    for (let x = 0; x < LADO; x++) {
      const t = (x + desplazamiento) % 8;
      l.px(x, y, t < 4 ? claro : oscuro);
      // Un hilo más claro (o más oscuro) marca el borde de cada banda: da el relieve del tejido.
      if (t === 0) l.px(x, y, borde);
    }
  }
  return l;
}

/** Alfombra gris de oficina: gris medio claro con un zigzag suave y un hilo más claro en el borde de cada banda. */
export function pisoAlfombraGris(): Lienzo {
  return alfombraZigzag('neutro-5', 'neutro-4', 'neutro-6');
}

/** Alfombra roja suave: el rojo de las alfombras de Gather, cálido y claro, nunca el rojo vivo de la marca. */
export function pisoAlfombraRoja(): Lienzo {
  return alfombraZigzag('rojo-suave-2', 'rojo-suave-1', 'rojo-suave-2');
}

/**
 * Césped claro: verde fresco con matas de tres tipos (en V, hoja suelta y arco bajo) y manchas de sombra.
 * Cada mata cae en una casilla de 8 x 8 con posición libre y vuelta al otro lado: reparto parejo sin filas visibles.
 */
export function pisoCesped(): Lienzo {
  const l = new Lienzo(LADO, LADO);
  l.rect(0, 0, LADO, LADO, 'cesped-2');
  const r = azar(913);
  for (let by = 0; by < LADO; by += 8) {
    for (let bx = 0; bx < LADO; bx += 8) {
      const x = bx + entre(r, 0, 7);
      const y = by + entre(r, 1, 7);
      const tipo = r();
      if (tipo < 0.45) {
        // Mata en V: pie más oscuro y dos hojas claras que se abren.
        pxEnvuelto(l, x, y, 'cesped-1');
        pxEnvuelto(l, x - 1, y - 1, 'cesped-3');
        pxEnvuelto(l, x + 1, y - 1, 'cesped-3');
        if (r() < 0.3) pxEnvuelto(l, x, y - 2, 'cesped-3');
      } else if (tipo < 0.8) {
        // Hoja suelta: un trazo oscuro con la punta clara.
        pxEnvuelto(l, x, y, 'cesped-1');
        pxEnvuelto(l, x, y - 1, 'cesped-3');
        pxEnvuelto(l, x + 1, y - 2, 'cesped-3');
      } else {
        // Arco bajo: tres píxeles de sombra en curva.
        pxEnvuelto(l, x - 1, y, 'cesped-1');
        pxEnvuelto(l, x, y - 1, 'cesped-1');
        pxEnvuelto(l, x + 1, y, 'cesped-1');
      }
    }
  }
  // Manchas de sombra entre matas: dos píxeles pegados.
  for (let k = 0; k < 6; k++) {
    const x = entre(r, 0, LADO - 1);
    const y = entre(r, 0, LADO - 1);
    pxEnvuelto(l, x, y, 'cesped-1');
    pxEnvuelto(l, x + 1, y, 'cesped-1');
  }
  return l;
}

/** Deck de terraza: tablas anchas de madera clara con ranuras marcadas y vetas largas. */
export function pisoDeck(): Lienzo {
  const l = new Lienzo(LADO, LADO);
  // Tres tablas de 11, 11 y 10 filas (ranura incluida): suman 32 y repiten en vertical.
  const filas: Array<[number, number]> = [
    [0, 11],
    [11, 11],
    [22, 10],
  ];
  const juntas = [20, 6, 27];
  const vetas: Array<Array<[number, number, number]>> = [
    [[3, 3, 9], [18, 7, 8]],
    [[10, 2, 8], [22, 6, 7]],
    [[1, 5, 8], [14, 3, 10]],
  ];
  filas.forEach(([y, alto], i) => {
    l.rect(0, y, LADO, alto - 1, 'madera-clara-3'); // cuerpo de la tabla
    l.rect(0, y, LADO, 2, 'madera-clara-4'); // brillo del canto superior
    l.rect(0, y + alto - 1, LADO, 1, 'madera-clara-1'); // ranura entre tablas
    l.rect(juntas[i] ?? 0, y, 1, alto - 1, 'madera-clara-2'); // junta de testa
    for (const [x, dy, largo] of vetas[i] ?? []) l.rect(x, y + dy, largo, 1, 'madera-clara-2');
    l.rect(0, y + alto - 2, LADO, 1, 'madera-clara-2'); // sombra propia al pie de cada tabla
  });
  return l;
}

/**
 * Parquet en espiga: tablones de 4 x 16 px, mitad horizontales y mitad verticales.
 * Los tablones nacen en una red de pasos (4, 4) y (16, -16); el patrón repite cada 32 px en ambos ejes.
 * El tono de cada tablón sale de su posición en el tile (dos tonos claros), así es idéntico en todos los tiles.
 */
export function pisoParquet(): Lienzo {
  const l = new Lienzo(LADO, LADO);
  const w = 4;
  const largo = 16;
  const tablones: Array<{ x: number; y: number; ancho: number; alto: number }> = [];
  for (let i = -16; i <= 16; i++) {
    for (let j = -3; j <= 3; j++) {
      const hx = i * w + j * largo;
      const hy = i * w - j * largo;
      tablones.push({ x: hx, y: hy, ancho: largo, alto: w });
      tablones.push({ x: hx + largo, y: hy + w - largo, ancho: w, alto: largo });
    }
  }
  const mod = (n: number) => ((n % LADO) + LADO) % LADO;
  for (const t of tablones) {
    const horizontal = t.ancho > t.alto;
    const tono = ((mod(t.x) * 7 + mod(t.y) * 13 + (horizontal ? 5 : 11)) >> 2) % 3 === 0 ? 'madera-clara-4' : 'madera-clara-3';
    for (let y = 0; y < t.alto; y++) {
      for (let x = 0; x < t.ancho; x++) {
        const ranura = y === t.alto - 1 || x === t.ancho - 1;
        pxEnvuelto(l, t.x + x, t.y + y, ranura ? 'madera-clara-2' : tono);
      }
    }
  }
  return l;
}

/**
 * Baldosa de cocina: damero de losas de 16 x 16, una blanca y otra gris muy clara, con bisel claro arriba y a la
 * izquierda y una junta fina gris azulada abajo y a la derecha (así empatan solas con las vecinas).
 */
export function pisoCocina(): Lienzo {
  const l = new Lienzo(LADO, LADO);
  for (let by = 0; by < 2; by++) {
    for (let bx = 0; bx < 2; bx++) {
      const clara = (bx + by) % 2 === 0;
      const x = bx * 16;
      const y = by * 16;
      l.rect(x, y, 16, 16, clara ? 'neutro-7' : 'neutro-6');
      l.rect(x, y, 15, 1, 'neutro-7'); // brillo del borde superior
      l.rect(x, y, 1, 15, 'neutro-7'); // brillo del borde izquierdo
      l.rect(x + 15, y, 1, 16, 'baldosa-gris-4'); // junta derecha
      l.rect(x, y + 15, 16, 1, 'baldosa-gris-4'); // junta inferior
      // Un reflejo corto en diagonal, distinto en cada losa para que no se vea tablero.
      const largo = 3 + ((bx * 2 + by) % 3);
      for (let k = 0; k < largo; k++) l.px(x + 3 + k, y + 8 - k, clara ? 'baldosa-gris-4' : 'neutro-7');
    }
  }
  return l;
}
