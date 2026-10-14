/**
 * Capas EXACTAS del personaje del diseñador (solo de frente), reconstruidas desde `datos-disenador.ts`:
 *
 *   base       cuerpo calvo en camiseta de tirantes (archivo 09)
 *   pelo       peinado oscuro despeinado: todo lo que el archivo 10 añade o cambia sobre el 09
 *   chaqueta   chaqueta negra abierta + sus mangas: lo que el 11 añade o cambia sobre el 10 (sin las piernas)
 *   pantalon   el pantalón oscuro que trae el 11 (las piernas y el borde de la camisa en la cadera)
 *
 * Ninguna capa borra píxeles de la anterior (se comprobó en los datos), así que componer base + pelo + chaqueta + pantalon
 * reproduce los PNG 10 y 11 con diferencia 0. La comprobación corre en `ver-personajes-v5.ts`.
 */

import { Lienzo } from '../../nucleo';
import { ALTO, ANCHO, BASE, CONCHAQUETA, CONPELO, FILA_INICIAL, LEYENDA } from './datos-disenador';
import { PERFIL_DERECHO, PERFIL_IZQUIERDO } from './datos-perfiles';
import { LEYENDA_ROJA, PERFIL_PELO_DERECHO, PERFIL_PELO_IZQUIERDO } from './datos-perfiles-pelo';

/** Capa dispersa: clave `y * 32 + x` -> color hex. */
export type Capa = Map<number, string>;

function aCapa(filas: readonly string[]): Capa {
  const c: Capa = new Map();
  filas.forEach((fila, r) => {
    for (let x = 0; x < fila.length; x++) {
      const ch = fila[x]!;
      if (ch === '.') continue;
      const hex = LEYENDA[ch];
      if (!hex) throw new Error(`Letra sin color: ${ch}`);
      c.set((r + FILA_INICIAL) * ANCHO + x, hex);
    }
  });
  return c;
}

function diferencia(a: Capa, b: Capa): Capa {
  const d: Capa = new Map();
  for (const [k, v] of b) if (a.get(k) !== v) d.set(k, v);
  for (const k of a.keys()) if (!b.has(k)) throw new Error('Una capa borraría píxeles: hay que marcar borrados');
  return d;
}

const completaBase = aCapa(BASE);
const completaPelo = aCapa(CONPELO);
const completaChaqueta = aCapa(CONCHAQUETA);

const resto = diferencia(completaPelo, completaChaqueta);
const pantalon: Capa = new Map();
const chaqueta: Capa = new Map();
for (const [k, v] of resto) {
  const x = k % ANCHO;
  const y = Math.floor(k / ANCHO);
  (y >= 55 && x >= 10 && x <= 21 ? pantalon : chaqueta).set(k, v);
}

export const CAPAS_DISENADOR = {
  base: completaBase,
  pelo: diferencia(completaBase, completaPelo),
  chaqueta,
  pantalon,
} as const;

/** Une capas en orden (la última queda encima). */
export function unirCapas(...capas: Capa[]): Capa {
  const out: Capa = new Map();
  for (const c of capas) for (const [k, v] of c) out.set(k, v);
  return out;
}

export function capaALienzo(c: Capa, ancho = ANCHO, alto = ALTO): Lienzo {
  const l = new Lienzo(ancho, alto);
  for (const [k, v] of c) l.px(k % ANCHO, Math.floor(k / ANCHO), v);
  return l;
}

/** Desplaza una capa (dx, dy) píxeles. */
export function moverCapa(c: Capa, dx: number, dy: number): Capa {
  const out: Capa = new Map();
  for (const [k, v] of c) {
    const x = (k % ANCHO) + dx;
    const y = Math.floor(k / ANCHO) + dy;
    if (x >= 0 && x < ANCHO && y >= 0 && y < ALTO) out.set(y * ANCHO + x, v);
  }
  return out;
}

export const CAPAS_COMPLETAS = { base: completaBase, conPelo: completaPelo, conChaqueta: completaChaqueta };

/** Pone filas de letras en una capa con su esquina en (x0, y0) del lienzo de 32 x 64. */
export function capaDeFilas(filas: readonly string[], x0: number, y0: number, leyenda: Readonly<Record<string, string>> = LEYENDA): Capa {
  const c: Capa = new Map();
  filas.forEach((fila, r) => {
    for (let x = 0; x < fila.length; x++) {
      const ch = fila[x]!;
      if (ch === '.') continue;
      const hex = leyenda[ch];
      if (!hex) throw new Error(`Letra sin color: ${ch}`);
      c.set((r + y0) * ANCHO + x + x0, hex);
    }
  });
  return c;
}

/** Los perfiles del diseñador (16 x 33) puestos en el lienzo: columnas 8..23, filas 29..61 (la suela del frente está en la 61). */
export const PERFIL_X0 = 8;
export const PERFIL_Y0 = 29;
export const BASE_PERFIL_IZQ: Capa = capaDeFilas(PERFIL_IZQUIERDO, PERFIL_X0, PERFIL_Y0);
export const BASE_PERFIL_DER: Capa = capaDeFilas(PERFIL_DERECHO, PERFIL_X0, PERFIL_Y0);

/** Espejo horizontal respecto del eje del personaje (entre las columnas 15 y 16). */
export function espejoCapa(c: Capa): Capa {
  const out: Capa = new Map();
  for (const [k, v] of c) out.set(Math.floor(k / ANCHO) * ANCHO + (ANCHO - 1 - (k % ANCHO)), v);
  return out;
}

// ---------- perfiles con pelo y chaqueta roja (archivos 15 y 16) ----------

/** Letras de color de los perfiles 15 y 16: las del diseñador más los 4 rojos de la chaqueta. */
export const LEYENDA_COMPLETA: Readonly<Record<string, string>> = { ...LEYENDA, ...LEYENDA_ROJA };

/**
 * Los perfiles 15 y 16 miden 21 x 34 y llevan el mismo rostro que el perfil base 12: el pixel (x, y) del archivo cae en la columna
 * `x + 4` y en la fila `y + 28` del lienzo (la cara coincide con la del 12 desplazada 4 columnas y 1 fila).
 */
export const PERFIL_PELO_X0 = 4;
export const PERFIL_PELO_Y0 = 28;
/** Primera fila del lienzo que es de la chaqueta (por debajo de la barbilla); las de arriba son pelo y ojo. */
export const FILA_CHAQUETA_PERFIL = 45;

const invertirFilas = (filas: readonly string[]): string[] => filas.map((f) => f.split('').reverse().join(''));

/** Los dos dibujos exactos del diseñador mirando a la IZQUIERDA: el 15 (ojo medio cerrado) y el 16 espejado (ojo abierto). */
export const PERFIL_P1_MEDIO: Capa = capaDeFilas(PERFIL_PELO_IZQUIERDO, PERFIL_PELO_X0, PERFIL_PELO_Y0, LEYENDA_COMPLETA);
export const PERFIL_P1_ABIERTO: Capa = capaDeFilas(invertirFilas(PERFIL_PELO_DERECHO), PERFIL_PELO_X0, PERFIL_PELO_Y0, LEYENDA_COMPLETA);

function sobreBase(sprite: Capa): Capa {
  const d = new Map<number, string>();
  for (const [k, v] of sprite) if (BASE_PERFIL_IZQ.get(k) !== v) d.set(k, v);
  for (const k of BASE_PERFIL_IZQ.keys()) if (!sprite.has(k)) throw new Error('El perfil con pelo no cubre un píxel del perfil base');
  return d;
}
const sobre12: Capa = sobreBase(PERFIL_P1_ABIERTO);
const parte = (c: Capa, arriba: boolean): Capa => {
  const o: Capa = new Map();
  for (const [k, v] of c) if ((Math.floor(k / ANCHO) < FILA_CHAQUETA_PERFIL) === arriba) o.set(k, v);
  return o;
};

/**
 * Perfil izquierdo del diseñador separado en capas sobre el perfil base 12:
 *   pelo      peinado 1 de perfil con su contorno y el ojo abierto (16 espejado); va sobre el cuerpo
 *   ojoMedio  los 17 píxeles que cambian con el ojo medio cerrado (el 15): reemplazan a los del pelo, es el parpadeo
 *   chaqueta  la chaqueta roja con solapa, manga y camisa (por debajo de la barbilla)
 * Con `ojoMedio` aplicado, base + pelo + chaqueta es EXACTAMENTE el 15; sin él, el 16 espejado.
 */
export const PERFIL_P1 = {
  pelo: parte(sobre12, true),
  chaqueta: parte(sobre12, false),
  ojoMedio: (() => {
    const o: Capa = new Map();
    for (const [k, v] of PERFIL_P1_MEDIO) if (PERFIL_P1_ABIERTO.get(k) !== v) o.set(k, v);
    return o;
  })(),
} as const;

/** El perfil completo del diseñador (cuerpo base 12 + capas), mirando a la izquierda (`I`) o a la derecha (`D`, espejo), con el ojo abierto o medio cerrado. */
export function perfilExacto(lado: 'I' | 'D', ojo: 'abierto' | 'medio'): Capa {
  const c = unirCapas(BASE_PERFIL_IZQ, PERFIL_P1.pelo, ojo === 'medio' ? PERFIL_P1.ojoMedio : new Map(), PERFIL_P1.chaqueta);
  return lado === 'I' ? c : espejoCapa(c);
}

// ---------- parpadeo: cuadro de ojo medio cerrado ----------

/**
 * Ojo medio cerrado (espabilar), píxeles que REEMPLAZAN a los del ojo abierto en el cuerpo base. Se dibuja como cuadro alterno de la
 * capa `cuerpo` (el ojo abierto es el cuadro normal).
 *   I (perfil izquierdo): los 8 píxeles del ojo que el diseñador cambia en el 15 (la línea de la pestaña baja una fila y tapa el iris).
 *       Los 9 píxeles de más que cambian en el 15 son el borde del flequillo del peinado 1 y no se usan en los demás peinados.
 *   S (frente): derivado con la misma regla: la línea de la pestaña de arriba (fila 41) pasa a piel y el ojo (fila 42) se vuelve una línea oscura.
 * El perfil derecho y la espalda: el derecho es el espejo del izquierdo; la espalda no tiene ojos.
 */
const OJO_I_FILA_MINIMA = 41; // fila del lienzo desde la que el cambio es del ojo y no del flequillo (fila 13 del archivo + 28)
export const OJO_MEDIO_I: Capa = (() => {
  const o: Capa = new Map();
  for (const [k, v] of PERFIL_P1.ojoMedio) if (Math.floor(k / ANCHO) >= OJO_I_FILA_MINIMA) o.set(k, v);
  return o;
})();
export const OJO_MEDIO_S: Capa = (() => {
  const o: Capa = new Map();
  for (const x of [11, 12, 13, 18, 19, 20]) { o.set(41 * ANCHO + x, LEYENDA.b!); o.set(42 * ANCHO + x, LEYENDA.d!); }
  return o;
})();

// ---------- el ojo de los perfiles 15 y 16 dentro del cuerpo ----------

/**
 * En el perfil con pelo del diseñador la línea de la pestaña es 2 píxeles más larga que en el 12 (filas 41, columnas 9 y 10 del lienzo).
 * Esos píxeles son de la CARA, no del peinado: se separan del peinado 1 y pasan al cuerpo de perfil, así todos los peinados llevan el mismo ojo.
 */
const ES_PESTANA = (k: number, v: string): boolean => v === LEYENDA.d && Math.floor(k / ANCHO) === 41 && k % ANCHO <= 13;
export const OJO_ABIERTO_I: Capa = (() => {
  const o: Capa = new Map();
  for (const [k, v] of PERFIL_P1.pelo) if (ES_PESTANA(k, v)) o.set(k, v);
  return o;
})();
/** El peinado 1 de perfil sin los píxeles del ojo. */
export const PELO_P1_PERFIL: Capa = (() => {
  const o: Capa = new Map();
  for (const [k, v] of PERFIL_P1.pelo) if (!ES_PESTANA(k, v)) o.set(k, v);
  return o;
})();
