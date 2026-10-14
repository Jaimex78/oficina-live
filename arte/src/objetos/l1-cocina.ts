/**
 * Cocina y descanso del lote 1: máquina de café, nevera y mesón.
 *
 * Estilo Gather: aparatos blancos con detalles azul marino y contorno azul marino de 1 px. El mesón comparte
 * los materiales de los escritorios (tapa blanca con labio y frente azul grisáceo), así sus variantes
 * `madera`, `blanco` y `negro` salen de `MATERIALES`. La máquina de café emite luz cálida: su pantalla y la taza
 * se dibujan en `naranja` y `tela-calida` claros.
 */

import { Lienzo } from '../nucleo';
import { cerrar, registrarObjeto, type Cuadros } from './l1-comun';
import { MATERIALES, tapaConLabio, type MaterialMueble, type VarianteMueble } from './l1-puestos';

const AZ = (n: 0 | 1 | 2 | 3 | 4) => `azul-oficina-${n}` as const;
const NE = (n: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7) => `neutro-${n}` as const;
const NA = (n: 0 | 1 | 2 | 3 | 4) => `naranja-${n}` as const;

/**
 * Máquina de café de grano: un gabinete azul grisáceo con la cafetera blanca encima. La pantalla y la taza
 * brillan en ámbar (es lo que emite la luz), con tres botones, boquilla, bandeja de goteo y una taza servida.
 */
function maquinaCafe(): Lienzo {
  const l = new Lienzo(32, 48);
  // Gabinete: tapa blanca con labio, frente azul grisáceo y dos puertas con tirador.
  l.rect(4, 27, 24, 5, NE(7));
  l.rect(27, 28, 1, 4, NE(6));
  l.rect(4, 32, 24, 1, NE(6));
  l.rect(4, 33, 24, 10, AZ(3));
  l.rect(4, 33, 24, 1, AZ(4));
  l.rect(4, 40, 24, 3, AZ(2));
  l.rect(15, 34, 2, 8, AZ(2));
  for (const x of [11, 19]) l.rect(x, 36, 3, 2, NE(6));
  l.rect(6, 43, 3, 2, AZ(1));
  l.rect(23, 43, 3, 2, AZ(1));
  // Cafetera: carcasa blanca con brillo arriba y a la izquierda y sombra a la derecha.
  l.rect(8, 4, 16, 23, NE(7));
  l.rect(8, 4, 16, 2, NE(6));
  l.rect(22, 6, 2, 21, NE(5));
  l.rect(8, 4, 1, 23, NE(7));
  // Pantalla ámbar con dos renglones.
  l.rect(11, 8, 10, 6, AZ(1));
  l.rect(12, 9, 8, 4, NA(4));
  l.rect(12, 9, 8, 1, NE(7));
  l.rect(13, 11, 4, 1, NA(2));
  l.rect(13, 12, 6, 1, NA(1));
  // Tres botones: rojo, naranja y azul.
  l.rect(11, 16, 2, 2, 'rojo-3');
  l.rect(15, 16, 2, 2, NA(2));
  l.rect(19, 16, 2, 2, 'vidrio-2');
  // Boquilla, taza y bandeja de goteo.
  l.rect(13, 19, 6, 2, AZ(3));
  l.rect(13, 19, 6, 1, AZ(4));
  l.rect(15, 21, 2, 1, AZ(2));
  l.rect(13, 22, 6, 4, NA(3));
  l.rect(13, 22, 6, 1, 'madera-oscura-1');
  l.rect(13, 25, 6, 1, NA(2));
  l.rect(19, 23, 1, 2, NA(2));
  l.rect(9, 26, 14, 1, AZ(4));
  l.rect(9, 27, 14, 1, AZ(3));
  return cerrar(l);
}

/** Nevera blanca: puerta del congelador arriba, puerta grande abajo, dos manijas azul marino y notas con imán. */
function nevera(): Lienzo {
  const l = new Lienzo(32, 56);
  // Cara superior y frente con luz a la izquierda y sombra a la derecha.
  l.rect(5, 5, 22, 5, NE(7));
  l.rect(5, 5, 22, 1, NE(7));
  l.rect(26, 6, 1, 4, NE(6));
  l.rect(5, 10, 22, 42, NE(7));
  l.rect(24, 10, 3, 42, NE(6));
  l.rect(26, 10, 1, 42, NE(5));
  l.rect(5, 51, 22, 1, NE(5));
  l.rect(5, 9, 22, 1, NE(6));
  // Juntas de las dos puertas.
  l.rect(5, 24, 22, 1, NE(5));
  l.rect(5, 25, 22, 1, NE(6));
  // Manijas verticales.
  l.rect(21, 14, 2, 8, AZ(3));
  l.rect(21, 14, 1, 8, AZ(4));
  l.rect(21, 28, 2, 12, AZ(3));
  l.rect(21, 28, 1, 12, AZ(4));
  // Notas con imán en la puerta de abajo.
  l.rect(8, 31, 5, 6, 'tela-calida-3');
  l.rect(8, 36, 5, 1, 'tela-calida-1');
  l.rect(8, 31, 2, 1, 'rojo-3');
  l.rect(9, 40, 4, 5, 'rojo-suave-3');
  l.rect(9, 44, 4, 1, 'rojo-suave-1');
  // Patas bajas.
  l.rect(7, 52, 3, 2, AZ(2));
  l.rect(22, 52, 3, 2, AZ(2));
  return cerrar(l);
}

/** Mesón de cocina de frente (S): tapa con labio, tres puertas con tirador y zócalo. */
function mesonS(m: MaterialMueble, semilla: number): Lienzo {
  const l = new Lienzo(96, 40);
  tapaConLabio(l, 1, 3, 94, 12, m, semilla);
  l.rect(3, 17, 90, 19, m.panel);
  l.rect(3, 17, 90, 1, m.panelSombra);
  for (const x of [33, 64]) l.rect(x, 18, 1, 18, m.panelSombra);
  for (const x of [3, 34, 65]) l.rect(x, 18, 1, 18, m.labioCara);
  for (const x of [13, 44, 75]) {
    l.rect(x, 20, 7, 1, m.labio);
    l.rect(x, 21, 7, 1, m.pata);
  }
  l.rect(3, 33, 90, 3, m.panelSombra);
  l.rect(5, 36, 86, 2, m.pata);
  return cerrar(l);
}

/** Mesón de lado (E u O): la tapa corre hacia abajo y al sur se ve el costado del gabinete. */
function mesonLateral(m: MaterialMueble, semilla: number): Lienzo {
  const l = new Lienzo(32, 104);
  tapaConLabio(l, 3, 8, 26, 70, m, semilla);
  l.rect(5, 80, 22, 18, m.panel);
  l.rect(5, 80, 22, 1, m.panelSombra);
  l.rect(5, 80, 1, 18, m.labioCara);
  l.rect(8, 84, 16, 10, m.panel);
  l.rect(8, 84, 16, 1, m.panelSombra);
  l.rect(8, 84, 1, 10, m.panelSombra);
  l.rect(8, 93, 16, 1, m.labioCara);
  l.rect(5, 94, 22, 4, m.panelSombra);
  l.rect(6, 98, 20, 2, m.pata);
  return cerrar(l);
}

export function dibujarCocina(salida: Cuadros): void {
  registrarObjeto(salida, 'maquina-cafe', () => maquinaCafe());
  registrarObjeto(salida, 'nevera', () => nevera());
  const variantes: VarianteMueble[] = ['base', 'madera', 'blanco', 'negro'];
  registrarObjeto(salida, 'meson', (clave) => (clave === 'S' ? mesonS(MATERIALES.base, 71) : mesonLateral(MATERIALES.base, 72)), {
    variante: (_base, variante, clave) => {
      if (!variantes.includes(variante as VarianteMueble)) return undefined;
      const m = MATERIALES[variante as VarianteMueble];
      return clave === 'S' ? mesonS(m, 71) : mesonLateral(m, 72);
    },
  });
}
