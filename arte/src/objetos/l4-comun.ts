/**
 * Ayudas del lote 4 y de la primera mitad del lote 3 (atlas `objetos-v4`).
 *
 * Aquí viven las sombras de este lote. Las sombras van bien hechas, así que no se usa la trama de la sombra
 * estándar: cada clase de objeto tiene la suya, siempre en `azul-oficina` y nunca en negro duro.
 *  - Piso y suelo: sombra proyectada abajo a la derecha en DOS tonos escalonados (`azul-oficina-2` pegado al objeto y
 *    `azul-oficina-3` más lejos), sólidos y sin trama. Los objetos altos suman una mancha plana de contacto bajo la base.
 *  - Apoyado: un reborde de 1 px de `azul-oficina-2` sobre la superficie, abajo y a la derecha.
 *  - Colgado de una pared: la misma de 1 px, sobre la pared.
 *  - Pisos y lo que va sobre las personas: sin sombra.
 */

import { Lienzo } from '../nucleo';
import type { ColorEntrada } from '../nucleo';
import { CONTORNO, FILA_APOYO, entre, azar, registrar, registrarVariantes } from './l2b-comun';
import type { Cuadros } from './l2b-comun';

export { CONTORNO, FILA_APOYO, entre, azar, registrar, registrarVariantes };
export type { Cuadros };

/** Sombra pegada al objeto. */
export const SOMBRA_CERCA: ColorEntrada = 'azul-oficina-2';
/** Sombra más lejana, un escalón más clara. */
export const SOMBRA_LEJOS: ColorEntrada = 'azul-oficina-3';

/** Última fila del cuerpo de lo que va apoyado en una mesa (la misma de los demás apoyados). */
export const B = FILA_APOYO;

export interface OpcionesSuelo {
  /** Mancha plana de contacto bajo la base: `[cx, cy, rx, ry]`. Para objetos altos. */
  contacto?: readonly [number, number, number, number];
  /** Cuántos píxeles se alarga la sombra (1 o 2). Por defecto 2. */
  largo?: 1 | 2;
  /** Contorno con diagonales (cierra mejor las formas redondas). */
  diagonales?: boolean;
}

/**
 * Cierra un objeto de suelo: contorno azul marino y sombra proyectada en dos tonos. La sombra solo cae sobre píxeles
 * vacíos, así que nunca tapa nada del objeto. Con `contacto`, la base lleva además una mancha plana.
 */
export function cerrarSuelo(l: Lienzo, o: OpcionesSuelo = {}): Lienzo {
  l.contorno(CONTORNO, o.diagonales ? { diagonales: true } : {});
  const largo = o.largo ?? 2;
  const cerca = l.capaSombra(SOMBRA_CERCA, 1, 1);
  const lejos = largo === 2 ? l.capaSombra(SOMBRA_LEJOS, 2, 2) : null;
  const capa = new Lienzo(l.ancho, l.alto);
  if (o.contacto !== undefined) {
    const [cx, cy, rx, ry] = o.contacto;
    capa.elipse(cx + 1, cy + 1, rx + 1, ry + 1, SOMBRA_LEJOS);
    capa.elipse(cx, cy, rx, ry, SOMBRA_CERCA);
  }
  // Primero lo más cercano, luego lo lejano: cada capa solo rellena donde no hay nada.
  capa.pegar(cerca, 0, 0, { modo: 'debajo' });
  if (lejos !== null) capa.pegar(lejos, 0, 0, { modo: 'debajo' });
  return l.pegar(capa, 0, 0, { modo: 'debajo' });
}

/** Cierra un objeto apoyado en una mesa: contorno y un reborde de sombra de 1 px sobre la superficie. */
export function cerrarApoyado(l: Lienzo, o: { diagonales?: boolean } = {}): Lienzo {
  l.contorno(CONTORNO, o.diagonales ? { diagonales: true } : {});
  return l.sombraProyectada(SOMBRA_CERCA, 1, 1);
}

/** Cierra algo colgado de una pared: contorno y sombra de 1 px sobre ella. */
export function cerrarColgado(l: Lienzo): Lienzo {
  return cerrarApoyado(l);
}

/** Cierra lo que va sobre las personas o plano en el piso: solo el contorno. */
export function cerrarSinSombra(l: Lienzo): Lienzo {
  return l.contorno(CONTORNO);
}

/** Rampa de 5 tonos de la paleta, como lista de nombres de color (`['madera-clara-0', ...]`). */
export function tonos(rampa: string, desde = 0, hasta = 5): string[] {
  const r: string[] = [];
  for (let i = desde; i < hasta; i++) r.push(`${rampa}-${i}`);
  return r;
}

/** Píxel con vuelta al otro lado del lienzo: así los motivos que cruzan el borde de un piso repiten sin costura. */
export function pxEnvuelto(l: Lienzo, x: number, y: number, color: ColorEntrada): void {
  l.px(((x % l.ancho) + l.ancho) % l.ancho, ((y % l.alto) + l.alto) % l.alto, color);
}

/** Rectángulo con vuelta al otro lado del lienzo. */
export function rectEnvuelto(l: Lienzo, x: number, y: number, w: number, h: number, color: ColorEntrada): void {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) pxEnvuelto(l, x + i, y + j, color);
}

/** Pega `parte` en `(x, y)` y devuelve el lienzo. Atajo para componer con piezas pequeñas dibujadas aparte. */
export function sobre(l: Lienzo, parte: Lienzo, x: number, y: number): Lienzo {
  return l.pegar(parte, x, y);
}

/** Los cuatro tonos de la porcelana blanca de los baños: luz, medio, sombra y sombra profunda (de claro a oscuro). */
export const PORCELANA = {
  brillo: 'neutro-7',
  luz: 'neutro-6',
  medio: 'baldosa-gris-4',
  sombra: 'baldosa-gris-3',
  profunda: 'baldosa-gris-2',
} as const;

/**
 * Sombreado de volumen para una forma cualquiera (`dentro` dice qué píxeles son de la forma), con luz arriba a la
 * izquierda. `tonos` va del más oscuro al más claro. Es lo que hace `elipseSombreada`, pero para siluetas libres
 * (una manzana, un tazón, un huevo). `cx`, `cy`, `rx`, `ry` son el centro y los radios de la esfera imaginaria.
 */
export function volumen(
  l: Lienzo,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  dentro: (x: number, y: number) => boolean,
  tonosVolumen: readonly ColorEntrada[],
  umbrales?: readonly number[],
): Lienzo {
  const n = tonosVolumen.length;
  const cortes = umbrales ?? (n === 2 ? [0.62] : n === 3 ? [0.5, 0.78] : [0.42, 0.66, 0.88]);
  const lx = -0.45;
  const ly = -0.55;
  const lz = 0.7;
  for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++) {
    for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
      if (!dentro(x, y)) continue;
      const u = Math.max(-1, Math.min(1, (x + 0.5 - cx) / rx)) * 0.9;
      const v = Math.max(-1, Math.min(1, (y + 0.5 - cy) / ry)) * 0.9;
      const w = Math.sqrt(Math.max(0, 1 - u * u - v * v));
      const luz = Math.max(0, u * lx + v * ly + w * lz);
      let i = 0;
      while (i < cortes.length && luz >= (cortes[i] as number)) i++;
      l.px(x, y, tonosVolumen[i] as ColorEntrada);
    }
  }
  return l;
}

/** ¿El píxel `(x, y)` cae dentro de la elipse de centro `(cx, cy)` y radios `rx`, `ry`? Misma regla que `Lienzo.elipse`. */
export function enElipse(x: number, y: number, cx: number, cy: number, rx: number, ry: number): boolean {
  const u = (x - cx) / (rx + 0.5);
  const v = (y - cy) / (ry + 0.5);
  return u * u + v * v <= 1;
}
