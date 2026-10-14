import type { Orientacion } from '../arte';
import type { ConstructorSala } from '../oficina';
import type { LadosSillas } from '../sillas';

/**
 * Atajos para armar plantillas con realismo (ver `arte/GUIA-ARMADO-REALISTA.md`). Todo se pone sobre un `ConstructorSala` que ya
 * llamó `.estricto()`: lo apoyado va sobre una mesa donde cabe, las sillas pegadas a la mesa y mirándola.
 */

/** Un objeto sobre una mesa: `[objeto, casillas a la derecha de la esquina de la mesa, casillas hacia abajo, variante]`. */
export type Sobre = readonly [objeto: string, dx: number, dy?: number, variante?: string];
/** Un objeto colgado de la pared: `[objeto, x, variante]`. */
export type Colgado = readonly [objeto: string, x: number, variante?: string];

/** Pantallas y computadores se dibujan siempre de frente. */
const DE_FRENTE = /^(portatil|monitor|pc-|computador|tableta|laptop|telefono-conferencia|ps5|control-videojuegos|telefono-escritorio)/;

/** Pone objetos sobre una mesa cuya esquina superior izquierda es `(x, y)`. */
export function sobreMesa(b: ConstructorSala, x: number, y: number, lista: readonly Sobre[]): void {
  for (const [id, dx, dy, v] of lista) b.poner(id, x + dx, y + (dy ?? 0), DE_FRENTE.test(id) ? 'S' : undefined, v);
}

/** Pone cuadros, relojes, ventanas y letreros sobre el muro de la fila `y` (miran al sur). */
export function colgar(b: ConstructorSala, y: number, lista: readonly Colgado[]): void {
  for (const [id, x, v] of lista) b.poner(id, x, y, 'S', v);
}

export interface PuestoDeTrabajo {
  x: number;
  y: number;
  /** Escritorio de 3 casillas contra el muro norte. */
  mueble: string;
  silla: string;
  colorSilla?: string;
  sobre?: readonly Sobre[];
  /** Etiqueta del puesto (la persona que lo ocupa). */
  etiqueta?: string;
  variante?: string;
}

/** Un escritorio de 3 casillas con su silla al centro, del lado sur y mirando al escritorio. */
export function puestoDeTrabajo(b: ConstructorSala, p: PuestoDeTrabajo): void {
  b.poner(p.mueble, p.x, p.y, 'S', p.variante);
  sobreMesa(b, p.x, p.y, p.sobre ?? []);
  b.poner(p.silla, p.x + 1, p.y + 1, 'N', p.colorSilla);
  if (p.etiqueta) b.puesto(b.ultima().id, p.etiqueta);
}

export interface MesaConSillas {
  mesa: string;
  x: number;
  y: number;
  orientacion?: Orientacion;
  variante?: string;
  silla: string;
  colorSilla?: string;
  lados?: LadosSillas;
  sobre?: readonly Sobre[];
}

/** Una mesa con sus sillas pegadas y simétricas (`sillasAlrededor`) y lo apoyado encima. */
export function mesaConSillas(b: ConstructorSala, m: MesaConSillas): void {
  b.poner(m.mesa, m.x, m.y, m.orientacion, m.variante);
  b.sillasAlrededor({ ...(m.lados ? { lados: m.lados } : {}), silla: m.silla, ...(m.colorSilla ? { variante: m.colorSilla } : {}) });
  sobreMesa(b, m.x, m.y, m.sobre ?? []);
}

/**
 * Mesa de reuniones de 3x2 cuyo lado de abajo queda contra una pared o tapado por ella: sillas arriba y en las dos puntas, simétricas
 * y pegadas, sin sillas abajo (donde nadie las vería sentadas).
 */
export function mesaConSillasSinAbajo(b: ConstructorSala, x: number, y: number, silla: string, colorSilla: string | undefined, sobre: readonly Sobre[], mesa = 'mesa-conferencia-3x2'): void {
  b.poner(mesa, x, y, 'S');
  sobreMesa(b, x, y, sobre);
  for (let i = 0; i < 3; i++) b.poner(silla, x + i, y - 1, 'S', colorSilla);
  b.poner(silla, x - 1, y, 'E', colorSilla).poner(silla, x - 1, y + 1, 'E', colorSilla).poner(silla, x + 3, y, 'O', colorSilla).poner(silla, x + 3, y + 1, 'O', colorSilla);
}
