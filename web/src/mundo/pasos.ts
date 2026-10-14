import { CICLO_CAMINAR, VELOCIDAD_PX_S } from '@ol/shared';

/**
 * La cadencia de los pasos de un personaje. Como en Gather, el ciclo de caminar sigue la DISTANCIA recorrida, no el reloj: si
 * te mueves despacio los pies van despacio, y al parar el cuerpo queda en el cuadro de quieto de inmediato. Cada cuadro del ciclo
 * dura `PX_POR_CUADRO` píxeles de recorrido (a la velocidad normal, 8 cuadros por segundo, como antes).
 *
 * El personaje v5 trae 4 cuadros de caminar por dirección (contacto A, paso A, contacto B, paso B): son los cuadros 1 a 4 de la hoja
 * (`CICLO_CAMINAR`); el 0 es quieto, el 5 sentado y el 6 y 7 los de parpadeo (ver `avatar.ts`). Los cuadros de contacto (índices 0 y 2 del ciclo)
 * son los de apoyo en los que se detiene al parar.
 */
export const CUADROS_DE_CAMINAR = 4;
export const PRIMER_CUADRO_CAMINAR = 1;
/** Cuadros por segundo del ciclo a la velocidad normal. */
export const CUADROS_POR_SEGUNDO = 8;
export const PX_POR_CUADRO = VELOCIDAD_PX_S / CUADROS_POR_SEGUNDO;

/** El ciclo de índices de cuadro de la hoja: los 4 cuadros de caminar, en orden. */
export const cicloDeCaminar = (): readonly number[] => CICLO_CAMINAR;

/** Índice de cuadro de la hoja de la persona que lleva `px` píxeles de recorrido en el ciclo. */
export function cuadroDeCaminar(px: number, ciclo: readonly number[] = cicloDeCaminar()): number {
  const n = ciclo.length;
  const i = ((Math.floor(px / PX_POR_CUADRO) % n) + n) % n;
  return ciclo[i] ?? 0;
}

/**
 * Al parar, el recorrido salta al siguiente paso «de apoyo» (un cuadro de índice par del ciclo): así la próxima vez que arranque
 * empieza ya en un paso, sin un cuadro de quieto de más, y alterna de pie.
 */
export function recorridoAlParar(px: number, largoCiclo: number = cicloDeCaminar().length): number {
  const cuadros = Math.ceil(px / PX_POR_CUADRO);
  const par = cuadros % 2 === 0 ? cuadros : cuadros + 1;
  return (par % largoCiclo) * PX_POR_CUADRO;
}
