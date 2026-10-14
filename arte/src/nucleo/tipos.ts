/**
 * Tipos compartidos del núcleo de arte.
 *
 * Aquí viven solo tipos (nada de lógica), para que cualquier módulo los
 * importe sin crear ciclos.
 */

import type { Lienzo } from './lienzo';
import type { NombreAlias, NombreColor } from './paleta';

/**
 * Lo que acepta cualquier método que pinta:
 * - `"#RRGGBB"`,
 * - un nombre de la paleta (`"madera-clara-3"`) o un alias (`"tinta"`),
 * - `null` o `"transparente"` para borrar.
 * El tipo sugiere los nombres de la paleta, pero acepta cualquier cadena:
 * un nombre equivocado lanza un error con sugerencias al pintar.
 */
export type ColorEntrada = NombreColor | NombreAlias | 'transparente' | (string & {}) | null;

/** Color con canal alfa. Los lienzos solo guardan alfa 0 o 255. */
export interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

/** Rectángulo en píxeles. `x` e `y` son la esquina superior izquierda. */
export interface Marco {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Medidas de un lienzo o de una cuadrícula. */
export interface Medidas {
  ancho: number;
  alto: number;
}

/** Un sprite con nombre, listo para empaquetar o mostrar en la hoja de contacto. */
export interface ItemSprite {
  id: string;
  lienzo: Lienzo;
}

/**
 * Cómo se mezclan dos colores en `trama`. El porcentaje es la parte de
 * píxeles que toma el segundo color.
 */
export type PatronTrama =
  | 'tablero'
  | 'bayer25'
  | 'bayer50'
  | 'bayer75'
  | 'lineas-h'
  | 'lineas-v'
  | 'diagonal';

/**
 * Cómo se pega un lienzo sobre otro:
 * - `sobre`: los píxeles opacos del origen tapan al destino (por defecto).
 * - `reemplazar`: copia todo el rectángulo, transparencia incluida.
 * - `debajo`: el origen solo aparece donde el destino está vacío.
 * - `borrar`: borra el destino donde el origen es opaco (sirve de máscara).
 */
export type ModoPegado = 'sobre' | 'reemplazar' | 'debajo' | 'borrar';

/** Resultado de empaquetar sprites en un atlas. */
export interface ResultadoAtlas {
  atlas: Lienzo;
  frames: Record<string, Marco>;
}
