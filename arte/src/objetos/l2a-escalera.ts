/**
 * Escalera del lote 2A: sube hacia el norte, de 2 x 2 casillas más 16 filas que sobresalen (cuadro de 64 x 80).
 *
 * Estilo Gather: seis escalones con la huella de madera clara y la contrahuella pintada de blanco, entre dos barandas
 * de `azul-oficina` con postes de arranque, y contorno azul marino. Se lee como una escalera por la repetición de franjas
 * de madera (la huella, que mira hacia arriba) y blancas (la contrahuella, que mira al sur). Es un portal entre pisos:
 * no bloquea el paso.
 */

import { Lienzo } from '../nucleo';
import type { DibujoObjeto } from './l2a-comun';
import { contornoGather, sombraEstandar } from './l2a-comun';

const ESCALONES = 6;
const HUELLA = 8;
const CONTRAHUELLA = 4;
/** Fila donde apoya la contrahuella más baja (el borde sur de la escalera sobre el piso). */
const PISO = 77;
const X0 = 8;
const X1 = 56;

/** Baranda de azul marino: columna de tres tonos con la luz a la izquierda, entre `yTop` y `yBase`, con un pasamanos más claro arriba. */
function baranda(l: Lienzo, x: number, yTop: number, yBase: number): void {
  l.rect(x, yTop, 1, yBase - yTop, 'azul-oficina-4');
  l.rect(x + 1, yTop, 2, yBase - yTop, 'azul-oficina-3');
  l.rect(x + 3, yTop, 1, yBase - yTop, 'azul-oficina-2');
  // Pasamanos: un travesaño claro sobre el borde superior.
  l.rectRedondeado(x - 1, yTop, 6, 3, 2, 'azul-oficina-3');
  l.rect(x, yTop, 4, 1, 'azul-oficina-4');
}

export function dibujoEscalera(): DibujoObjeto {
  const l = new Lienzo(64, 80);
  // Escalones, del más lejano al más cercano (así los cercanos tapan lo de atrás).
  for (let k = ESCALONES - 1; k >= 0; k--) {
    const base = PISO + 1 - k * (HUELLA + CONTRAHUELLA); // fila bajo la contrahuella de este escalón
    const contraY = base - CONTRAHUELLA;
    const huellaY = contraY - HUELLA;
    // Huella: madera clara con el canto delantero más claro y el fondo en sombra.
    l.rect(X0, huellaY, X1 - X0, HUELLA, 'madera-clara-3');
    l.rect(X0, huellaY, X1 - X0, 1, 'madera-clara-2');
    l.rect(X0, contraY - 1, X1 - X0, 1, 'madera-clara-4');
    // Veta: dos trazos cortos por huella, desplazados para que no formen columnas.
    l.rect(X0 + 5 + ((k * 7) % 13), huellaY + 3, 9, 1, 'madera-clara-2');
    l.rect(X0 + 24 + ((k * 5) % 11), huellaY + 5, 8, 1, 'madera-clara-2');
    // Contrahuella pintada de blanco: cara vertical que mira al sur, con la sombra del canto de arriba.
    l.rect(X0, contraY, X1 - X0, CONTRAHUELLA, 'neutro-6');
    l.rect(X0, contraY, X1 - X0, 1, 'neutro-4');
    l.rect(X0, base - 1, X1 - X0, 1, 'neutro-5');
    l.rect(X0, contraY + 1, 1, CONTRAHUELLA - 1, 'neutro-7');
  }
  // Barandas a los dos lados, de arriba abajo, con un poste de arranque más alto en el escalón de abajo.
  const yAlto = PISO + 1 - (ESCALONES - 1) * (HUELLA + CONTRAHUELLA) - CONTRAHUELLA - HUELLA;
  baranda(l, 3, yAlto - 6, PISO - 1);
  baranda(l, 57, yAlto - 6, PISO - 1);
  for (const x of [2, 56]) {
    l.rectRedondeado(x, PISO - 14, 6, 14, 2, 'azul-oficina-2');
    l.rect(x, PISO - 14, 1, 14, 'azul-oficina-3');
    l.rect(x + 5, PISO - 14, 1, 14, 'azul-oficina-1');
    l.rect(x + 1, PISO - 15, 4, 1, 'azul-oficina-4');
  }
  contornoGather(l);
  sombraEstandar(l);
  return { rampaBase: 'madera-clara', vistas: { U: l } };
}
