/**
 * Cuerpo del personaje v5 en cada pose, como rejilla de letras (lienzo de 32 x 64), listo para vestir.
 *
 * Cuadros de la hoja (índice de `cuadro`, igual en las 4 direcciones):
 *   0 quieto   1 a 4 ciclo de caminar (contacto A, paso A, contacto B, paso B)   5 sentado
 *   6 quieto con ojo medio cerrado (parpadeo)   7 sentado con ojo medio cerrado
 * Vistas dibujadas: S frente, N espalda, I perfil izquierdo. El perfil derecho (D) es el espejo del I.
 *
 * Cada pose parte del cuerpo del diseñador (camiseta de tirantes y shorts) y se le hace cirugía de píxeles (`vistas.ts`, `sentado.ts`).
 * La prenda de arriba y la de abajo se pintan después SOBRE las zonas de esa rejilla (`zonas`), así siguen al cuerpo en todas las poses.
 */

import { ANCHO } from './datos-disenador';
import { OJO_ABIERTO_I, OJO_MEDIO_I, OJO_MEDIO_S } from './disenador';
import { copiar, BASE_S } from './rejilla';
import type { Rejilla } from './rejilla';
import { caraFrente, caraPerfil } from './rostro';
import { sentadoEspalda, sentadoFrente, sentadoPerfil } from './sentado';
import { BASE_I, BASE_N, caminarFrontal, caminarPerfilIzquierdo, reboteCuadro } from './vistas';
import type { Cuadro } from './vistas';

export type Vista = 'S' | 'N' | 'I';
export const CUADROS_HOJA = 8;
export const CUADRO_SENTADO = 5;
export const CUADRO_QUIETO_PARPADEO = 6;
export const CUADRO_SENTADO_PARPADEO = 7;

/** Letras de la camiseta de tirantes del diseñador: n brillo, f base, l sombra, k borde. */
export const LETRAS_TANQUE = 'nflk';
/** Letras de piel del diseñador (j es el rubor, B el brillo de la cara 5). */
export const LETRAS_PIEL = 'bcimejB';

export interface PoseCuerpo {
  g: Rejilla;
  vista: Vista;
  cuadro: number;
  /** Desplazamiento vertical de la cabeza respecto del quieto (0 o -1 al caminar). */
  rebote: number;
  /** Fila desde la que es cadera (shorts). */
  yCadera: number;
}

const esSentado = (c: number): boolean => c === CUADRO_SENTADO || c === CUADRO_SENTADO_PARPADEO;
const esParpadeo = (c: number): boolean => c === CUADRO_QUIETO_PARPADEO || c === CUADRO_SENTADO_PARPADEO;

/** El cuerpo con camiseta de tirantes y shorts del diseñador en la pose `cuadro`, con la cara `cara` (0 a 4) y el ojo abierto o medio cerrado. */
export function poseCuerpo(vista: Vista, cuadro: number, cara = 0): PoseCuerpo {
  let g: Rejilla = copiar(vista === 'S' ? BASE_S : vista === 'N' ? BASE_N : BASE_I);
  if (vista === 'S') caraFrente(g, cara);
  if (vista === 'I') {
    caraPerfil(g, cara);
    for (const k of OJO_ABIERTO_I.keys()) g[Math.floor(k / ANCHO)]![k % ANCHO] = 'd';
  }
  const cam = { f: 'f', l: 'l', k: 'k' };
  let rebote = 0;
  const camina = cuadro >= 1 && cuadro <= 4;
  if (camina) {
    const c = (cuadro - 1) as Cuadro;
    rebote = reboteCuadro(c);
    g = vista === 'I' ? caminarPerfilIzquierdo(c, g, cam) : caminarFrontal(g, c, vista === 'N');
  }
  if (esSentado(cuadro)) {
    g = vista === 'S' ? sentadoFrente(g) : vista === 'N' ? sentadoEspalda(g) : sentadoPerfil(g, { n: 'n', f: 'f', l: 'l', k: 'k' }, cam);
  }
  if (esParpadeo(cuadro) && vista !== 'N') {
    for (const [k, hex] of vista === 'S' ? OJO_MEDIO_S : OJO_MEDIO_I) {
      const letra = letraDeHex(hex);
      g[Math.floor(k / ANCHO)]![k % ANCHO] = letra;
    }
  }
  return { g, vista, cuadro, rebote, yCadera: vista === 'I' ? 56 : 55 };
}

import { LEYENDA } from './datos-disenador';
const INVERSA = new Map(Object.entries(LEYENDA).map(([k, v]) => [v, k]));
export function letraDeHex(hex: string): string {
  const l = INVERSA.get(hex);
  if (!l) throw new Error(`Sin letra para ${hex}`);
  return l;
}

// ---------------------------------------------------------------------------
// Zonas del cuerpo, para vestirlo
// ---------------------------------------------------------------------------

/**
 * T torso (camiseta)   C pecho de piel dentro del escote   N cuello y hombros altos   A brazo   M mano
 * H cadera (shorts)    P pierna   F pie
 * Solo se marcan los píxeles de relleno; el contorno negro queda sin zona.
 */
export type Zona = 'T' | 'C' | 'N' | 'A' | 'M' | 'H' | 'P' | 'F';
export type Zonas = Map<number, Zona>;

const esPiel = (ch: string): boolean => LETRAS_PIEL.includes(ch);
const esTanque = (ch: string): boolean => LETRAS_TANQUE.includes(ch);

/** Componentes conexos (4 vecinos) de un conjunto de claves. */
function componentes(claves: Set<number>): number[][] {
  const vistos = new Set<number>();
  const out: number[][] = [];
  for (const k of claves) {
    if (vistos.has(k)) continue;
    const comp: number[] = [];
    const pila = [k];
    vistos.add(k);
    while (pila.length) {
      const c = pila.pop()!;
      comp.push(c);
      const x = c % ANCHO;
      for (const n of [c - 1, c + 1, c - ANCHO, c + ANCHO]) {
        if (!claves.has(n) || vistos.has(n)) continue;
        if ((n === c - 1 && x === 0) || (n === c + 1 && x === ANCHO - 1)) continue;
        vistos.add(n);
        pila.push(n);
      }
    }
    out.push(comp);
  }
  return out;
}

/** Clasifica los píxeles de relleno de una pose en zonas. */
export function zonas(p: PoseCuerpo): Zonas {
  const { g, vista } = p;
  const z: Zonas = new Map();
  const arm = new Set<number>();
  const leg = new Set<number>();
  for (let y = 46; y < 64; y++) for (let x = 0; x < ANCHO; x++) {
    const ch = g[y]![x]!;
    if (ch === '.' || ch === 'a') continue;
    const k = y * ANCHO + x;
    if (esTanque(ch)) { z.set(k, y >= p.yCadera ? 'H' : 'T'); continue; }
    if (!esPiel(ch)) continue;
    if (vista === 'I') {
      // perfil: cuello (fila 46), pecho dentro del escote (47), la piel dentro del torso (hasta la 55) es el brazo, de ahí abajo las piernas
      if (y <= 46) z.set(k, 'N');
      else if (y === 47) z.set(k, 'C');
      else if (y <= 55) arm.add(k);
      else leg.add(k);
    } else if (y === 46) {
      z.set(k, x >= 11 && x <= 20 ? 'N' : 'A');
    } else if (y <= 48 && x >= 11 && x <= 20) z.set(k, 'C');
    else if (x <= 10 || x >= 21) { if (y <= 56 && !(y >= p.yCadera && x >= 10 && x <= 21)) arm.add(k); else leg.add(k); }
    else leg.add(k);
  }
  // brazos: las 2 últimas filas de cada brazo son la mano
  for (const comp of componentes(arm)) {
    const yMax = Math.max(...comp.map((k) => Math.floor(k / ANCHO)));
    for (const k of comp) z.set(k, Math.floor(k / ANCHO) >= yMax - 1 ? 'M' : 'A');
  }
  // piernas: las 2 últimas filas de cada pierna son el pie
  for (const comp of componentes(leg)) {
    const yMax = Math.max(...comp.map((k) => Math.floor(k / ANCHO)));
    for (const k of comp) z.set(k, Math.floor(k / ANCHO) >= yMax - 1 ? 'F' : 'P');
  }
  return z;
}
