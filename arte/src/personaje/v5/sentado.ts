/**
 * Poses sentado del cuerpo base, derivadas de los sprites del diseñador. El tronco y la cabeza no se mueven (siguen en las mismas
 * filas que de pie, así el peinado y la ropa del torso se montan sin tocarlos); lo que cambia son las piernas y, de perfil, el brazo.
 *
 *  - S (de frente, sofá, butaca, puf): muslos hacia el espectador (cortos por la perspectiva), rodillas, espinillas y pies. Suela en la fila 62.
 *  - N (de espaldas, silla de escritorio): se corta por la cadera (fila 57); el respaldo de la silla tapa de la fila 52 hacia abajo.
 *  - I (perfil izquierdo, silla de comedor, banca): torso derecho, muslo horizontal hacia delante (a la izquierda), espinilla vertical, brazo
 *    adelantado con la mano sobre el muslo. El perfil derecho es el espejo. Suela en la fila 63.
 */

import { BASE_I } from './vistas';
import type { LetrasCamiseta } from './vistas';
import { borrar, copiar, poner, rellenar } from './rejilla';
import type { Rejilla } from './rejilla';

export interface LetrasShorts { n: string; f: string; l: string; k: string }
export const LETRAS_SHORTS_TIRANTES: LetrasShorts = { n: 'n', f: 'f', l: 'l', k: 'k' };

export const SUELA_SENTADO = { S: 62, N: 57, I: 63 } as const;

/** Pone una fila de texto en columnas absolutas; '.' no toca el píxel. */
const fila = (g: Rejilla, y: number, x0: number, texto: string): void => {
  for (let i = 0; i < texto.length; i++) if (texto[i] !== '.') g[y]![x0 + i] = texto[i]!;
};

export function sentadoFrente(base: Rejilla, s: LetrasShorts = LETRAS_SHORTS_TIRANTES): Rejilla {
  const g = copiar(base);
  // se quitan las piernas y los shorts de pie (las manos de las filas 55 quedan: columnas <= 9 y >= 22)
  for (let y = 55; y <= 61; y++) for (let x = 9; x <= 22; x++) g[y]![x] = '.';
  const { n, f, l, k } = s;
  // simétrico respecto del eje del cuerpo (entre las columnas 15 y 16): cadera 10..21, muslos 9..22, rodillas y pies 9..14 y 17..22
  fila(g, 55, 10, `a${l}${f}${f}${f}${f}${f}${f}${f}${f}${l}a`);
  fila(g, 56, 9, `a${l}${f}${f}${f}${k}aa${k}${f}${f}${f}${l}a`);
  fila(g, 57, 9, `a${l}${f}${n}${f}${k}aa${k}${f}${n}${f}${l}a`);
  // rodillas
  fila(g, 58, 9, 'abbbba..abbbba');
  fila(g, 59, 9, 'acbbca..acbbca');
  fila(g, 60, 9, 'acccca..acccca');
  fila(g, 61, 9, 'acccca..acccca');
  fila(g, 62, 9, 'aaaaaa..aaaaaa');
  return g;
}

export function sentadoEspalda(base: Rejilla): Rejilla {
  const g = copiar(base);
  for (let y = 58; y < g.length; y++) for (let x = 0; x < 32; x++) g[y]![x] = '.';
  return g;
}

/** Perfil izquierdo sentado. `base` es el cuerpo ya con cara y ropa de color (sin caminar). */
export function sentadoPerfil(base: Rejilla, s: LetrasShorts = LETRAS_SHORTS_TIRANTES, cam: LetrasCamiseta = { f: 'f', l: 'l', k: 'k' }): Rejilla {
  const { n, f, l, k } = s;
  const h = copiar(base);
  // 1. del brazo exacto se conserva el brazo hasta el codo (filas 48..51); de ahí hacia abajo es camiseta
  for (let y = 52; y <= 55; y++) for (let x = 14; x <= 18; x++) if ('bemci'.includes(h[y]![x]!)) h[y]![x] = x === 18 ? cam.l : cam.f;
  // 2. se quitan las piernas de pie y los shorts de la cadera
  borrar(h, 2, 23, 56, 63);
  const nuevo = new Set<number>();
  const px = (x: number, y: number, letra: string): void => { h[y]![x] = letra; nuevo.add(y * 100 + x); };
  const rect = (x0: number, x1: number, y0: number, y1: number, letra: string): void => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) px(x, y, letra); };
  // pierna lejana: asoma detrás de la espinilla cercana
  rect(10, 12, 59, 62, 'm'); rect(12, 12, 59, 62, 'e'); rect(10, 12, 62, 62, 'e');
  // cadera y muslo: un tubo horizontal de la cadera (col 18) a la rodilla (col 9)
  rect(9, 18, 56, 58, f);
  rect(10, 13, 56, 56, n);
  rect(9, 18, 58, 58, l);
  rect(9, 9, 56, 58, k);
  rect(18, 18, 56, 57, l);
  // rodilla (piel) y espinilla que baja vertical
  rect(7, 8, 57, 58, 'b'); rect(8, 8, 58, 58, 'c');
  rect(7, 9, 59, 62, 'c'); rect(7, 7, 59, 61, 'b'); rect(9, 9, 59, 62, 'e');
  // pie hacia delante
  rect(4, 9, 62, 62, 'c'); rect(4, 5, 62, 62, 'b');
  const marcas: [number, number][] = [];
  for (const k2 of nuevo) {
    const x = k2 % 100, y = Math.floor(k2 / 100);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) if (h[y + dy]![x + dx] === '.') marcas.push([x + dx, y + dy]);
  }
  for (const [x, y] of marcas) h[y]![x] = 'a';
  // 3. codo y antebrazo hacia delante; la mano descansa sobre el muslo
  const nuevo2 = new Set<number>();
  const p2 = (x: number, y: number, letra: string): void => { h[y]![x] = letra; nuevo2.add(y * 100 + x); };
  for (let x = 15; x <= 18; x++) p2(x, 52, x === 18 ? 'e' : 'b');
  for (let x = 11; x <= 18; x++) p2(x, 53, x === 18 ? 'e' : 'b');
  for (let x = 10; x <= 16; x++) p2(x, 54, x >= 15 ? 'c' : 'b');
  for (let x = 10; x <= 12; x++) p2(x, 55, x === 12 ? 'c' : 'b');
  for (const k2 of nuevo2) {
    const x = k2 % 100, y = Math.floor(k2 / 100);
    for (const [dx, dy] of [[-1, 0], [0, 1], [0, -1]] as const) {
      const c = h[y + dy]![x + dx]!;
      if (c === '.') h[y + dy]![x + dx] = 'a';
    }
  }
  return h;
}

void BASE_I;
