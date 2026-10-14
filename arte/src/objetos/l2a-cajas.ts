/**
 * Cajas en vista 3/4: un mueble se describe UNA vez como un conjunto de cajas sobre un plano (la orientación `S`)
 * y de ahí salen las cuatro orientaciones. Resuelve lo difícil de girar un mueble en 3/4: qué pieza tapa a cuál.
 *
 * Reglas de la vista (las del estilo de referencia):
 * - la cámara mira desde el sur y un poco desde arriba: de cada caja se ven la cara superior y la cara sur;
 * - la altura sube la caja en pantalla fila por fila, y la profundidad del plano ocupa `ky` filas por píxel;
 * - las cajas se pintan de norte a sur y, si una apoya sobre otra, primero la de abajo (`ordenDePintado`).
 *
 * Un cuadro de cada orientación se ajusta a su propio lienzo con su `Proyeccion`: la profundidad real de un mueble
 * no cabe igual de bien de frente que de lado, así que cada orientación elige su escala vertical (`ky`).
 */

import { Lienzo } from '../nucleo';
import type { ColorEntrada } from '../nucleo';

/** Colores de una caja. La cara superior es la más clara y la sur la más oscura. */
export interface TonosCaja {
  superior: ColorEntrada;
  frente: ColorEntrada;
  /** Brillo de la primera fila y la primera columna de la cara superior (luz arriba a la izquierda). */
  luz?: ColorEntrada;
  /** Brillo de la primera columna de la cara sur. */
  luzFrente?: ColorEntrada;
  /** Primera fila de la cara sur: el filo claro que une la tapa con el canto (como `filo` de `Lienzo.caja`). */
  filo?: ColorEntrada;
  /** Última fila de la cara sur. */
  sombra?: ColorEntrada;
  /** Última columna de las dos caras: el borde que da la espalda a la luz. */
  sombraLado?: ColorEntrada;
}

/** Una caja sobre el plano: `x` hacia el este, `y` hacia el sur (en píxeles de plano) y `z` hacia arriba (en filas). */
export interface CajaPlano {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  z0: number;
  z1: number;
  tonos: TonosCaja;
  /** Niveles de redondeo de las cuatro esquinas del contorno visible: 0 recto, 1 recorta 1 px, 2 recorta 3 px, 3 recorta 6 px. */
  esquinas?: number;
  /** Esquinas que se mantienen rectas (por ejemplo la que se apoya contra otra pieza). */
  rectas?: ReadonlyArray<'nw' | 'ne' | 'sw' | 'se'>;
  /** Si se indica, la caja solo se dibuja en estas orientaciones (por ejemplo, un cojín de respaldo que de lado no se ve). */
  giros?: ReadonlyArray<Giro>;
  /** No pinta el brillo de la fila superior de la cara superior (una caja que continúa a otra por el norte). */
  sinLuzArriba?: boolean;
  /** No pinta el brillo de la columna izquierda de la cara superior (una caja que continúa a otra por el oeste). */
  sinLuzIzquierda?: boolean;
  /** Nombre libre para localizar la caja al añadir detalles. */
  etiqueta?: string;
}

/** Cómo se lleva el plano a la pantalla de un cuadro. */
export interface Proyeccion {
  /** Fila del borde sur del plano a nivel del piso. */
  base: number;
  /** Profundidad total del plano, en píxeles de plano. */
  fondo: number;
  /** Filas de pantalla por cada píxel de profundidad del plano. */
  ky: number;
  /**
   * Opcional: proyección por tramos. Lista de pares `[y del plano, fila del piso]` en orden creciente de `y`;
   * entre dos pares se interpola en línea recta (y fuera de ellos se prolonga el último tramo). Sirve para muebles en L,
   * donde el brazo largo y la chaise piden escalas verticales distintas dentro del mismo cuadro.
   */
  tramos?: ReadonlyArray<readonly [number, number]>;
}

export type Giro = 'S' | 'E' | 'N' | 'O';

/** Fila de pantalla del piso en el punto `y` del plano (sin altura). */
export function pisoEn(p: Proyeccion, y: number): number {
  const t = p.tramos;
  if (t === undefined || t.length < 2) return p.base - (p.fondo - y) * p.ky;
  let i = 0;
  while (i < t.length - 2 && y > (t[i + 1] as readonly [number, number])[0]) i++;
  const [y0, f0] = t[i] as readonly [number, number];
  const [y1, f1] = t[i + 1] as readonly [number, number];
  return f0 + ((y - y0) * (f1 - f0)) / (y1 - y0);
}

/** Fila de pantalla de un punto del plano a una altura `z`. */
export function filaDe(p: Proyeccion, y: number, z: number): number {
  return Math.round(pisoEn(p, y) - z);
}

/** Lleva las cajas del plano `S` (de ancho `W` y fondo `D`) a la orientación pedida. Devuelve también las nuevas medidas del plano. */
export function girarCajas(cajas: readonly CajaPlano[], giro: Giro, W: number, D: number): { cajas: CajaPlano[]; ancho: number; fondo: number } {
  const rotar = (c: CajaPlano): CajaPlano => {
    switch (giro) {
      case 'S':
        return c;
      case 'N':
        return { ...c, x0: W - c.x1, x1: W - c.x0, y0: D - c.y1, y1: D - c.y0 };
      case 'E':
        return { ...c, x0: c.y0, x1: c.y1, y0: W - c.x1, y1: W - c.x0 };
      case 'O':
        return { ...c, x0: D - c.y1, x1: D - c.y0, y0: c.x0, y1: c.x1 };
    }
  };
  const gira90 = giro === 'E' || giro === 'O';
  return { cajas: cajas.filter((c) => c.giros === undefined || c.giros.includes(giro)).map(rotar), ancho: gira90 ? D : W, fondo: gira90 ? W : D };
}

/** Píxeles que se recortan en una esquina con `n` niveles de redondeo, como desplazamientos desde la esquina. */
function recortesDeEsquina(n: number): Array<[number, number]> {
  const r: Array<[number, number]> = [];
  for (let k = 0; k < n; k++) for (let j = 0; j < n - k; j++) r.push([k, j]);
  return r;
}

/** Rectángulo de pantalla de la cara superior de una caja (para añadir vetas o detalles encima). */
export function caraSuperior(c: CajaPlano, p: Proyeccion): { x: number; y: number; w: number; h: number } {
  const y = filaDe(p, c.y0, c.z1);
  return { x: Math.round(c.x0), y, w: Math.round(c.x1) - Math.round(c.x0), h: filaDe(p, c.y1, c.z1) - y };
}

/** Rectángulo de pantalla de la cara sur de una caja (para añadir puertas, cajones o rótulos encima). */
export function caraSur(c: CajaPlano, p: Proyeccion): { x: number; y: number; w: number; h: number } {
  const y = filaDe(p, c.y1, c.z1);
  return { x: Math.round(c.x0), y, w: Math.round(c.x1) - Math.round(c.x0), h: c.z1 - c.z0 };
}

/** Dibuja una caja: cara superior y cara sur, con sus brillos y sombras, sobre `l`. Lo recortado por las esquinas deja ver lo que hay detrás. */
export function dibujarCaja(l: Lienzo, c: CajaPlano, p: Proyeccion): void {
  const x = Math.round(c.x0);
  const w = Math.round(c.x1) - x;
  const yTop = filaDe(p, c.y0, c.z1);
  const ySur = filaDe(p, c.y1, c.z1);
  const yBase = ySur + (c.z1 - c.z0);
  const hTop = Math.max(0, ySur - yTop);
  const hFrente = Math.max(0, yBase - ySur);
  if (w <= 0 || hTop + hFrente <= 0) return;
  const t = c.tonos;
  const capa = new Lienzo(l.ancho, l.alto);
  if (hTop > 0) {
    capa.rect(x, yTop, w, hTop, t.superior);
    if (t.luz !== undefined) {
      if (c.sinLuzArriba !== true) capa.rect(x, yTop, w, 1, t.luz);
      if (c.sinLuzIzquierda !== true) capa.rect(x, yTop, 1, hTop, t.luz);
    }
    if (t.sombraLado !== undefined && w > 2) capa.rect(x + w - 1, yTop + 1, 1, hTop - 1, t.sombraLado);
  }
  if (hFrente > 0) {
    capa.rect(x, ySur, w, hFrente, t.frente);
    if (t.filo !== undefined) capa.rect(x, ySur, w, 1, t.filo);
    if (t.luzFrente !== undefined) capa.rect(x, ySur, 1, hFrente, t.luzFrente);
    if (t.sombraLado !== undefined && w > 2) capa.rect(x + w - 1, ySur, 1, hFrente, t.sombraLado);
    if (t.sombra !== undefined) capa.rect(x, yBase - 1, w, 1, t.sombra);
  }
  // Esquinas redondeadas del contorno total (cara superior más cara sur).
  const n = c.esquinas ?? 0;
  if (n > 0 && w >= 6 && hTop + hFrente >= 6) {
    const alto = hTop + hFrente;
    const rectas = new Set(c.rectas ?? []);
    const esquinas: Array<['nw' | 'ne' | 'sw' | 'se', number, number, number, number]> = [
      ['nw', x, yTop, 1, 1],
      ['ne', x + w - 1, yTop, -1, 1],
      ['sw', x, yTop + alto - 1, 1, -1],
      ['se', x + w - 1, yTop + alto - 1, -1, -1],
    ];
    for (const [nombre, ex, ey, sx, sy] of esquinas) {
      if (rectas.has(nombre)) continue;
      for (const [i, j] of recortesDeEsquina(Math.min(n, Math.floor(w / 2), Math.floor(alto / 2)))) capa.px(ex + sx * i, ey + sy * j, null);
    }
  }
  l.pegar(capa, 0, 0);
}

/** Rectángulo de pantalla que cubre una caja (cara superior más cara sur). */
function rectPantalla(c: CajaPlano, p: Proyeccion): { x0: number; x1: number; y0: number; y1: number } {
  const ySur = filaDe(p, c.y1, c.z1);
  return { x0: Math.round(c.x0), x1: Math.round(c.x1), y0: filaDe(p, c.y0, c.z1), y1: ySur + (c.z1 - c.z0) };
}

/**
 * ¿La caja `a` debe pintarse antes que `b`? Solo importa si se pisan en pantalla:
 * - si se pisan en el plano (una apoya sobre la otra), primero la de abajo;
 * - si no, primero la que queda más al norte (la del sur está más cerca de la cámara).
 * Devuelve `null` si no hay ninguna restricción.
 */
function vaAntes(a: CajaPlano, b: CajaPlano, p: Proyeccion): boolean | null {
  const ra = rectPantalla(a, p);
  const rb = rectPantalla(b, p);
  if (ra.x1 <= rb.x0 || rb.x1 <= ra.x0 || ra.y1 <= rb.y0 || rb.y1 <= ra.y0) return null;
  const seSuperponenEnY = a.y0 < b.y1 && b.y0 < a.y1;
  if (seSuperponenEnY) {
    if (a.z0 !== b.z0) return a.z0 < b.z0;
    return a.z1 === b.z1 ? null : a.z1 < b.z1;
  }
  return a.y1 <= b.y0;
}

/** Orden de pintado: un orden topológico de las relaciones de `vaAntes` (a igualdad, de norte a sur y de abajo hacia arriba). */
export function ordenDePintado(cajas: readonly CajaPlano[], p: Proyeccion): CajaPlano[] {
  const n = cajas.length;
  const despues: number[][] = Array.from({ length: n }, () => []);
  const entrantes = new Array<number>(n).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const r = vaAntes(cajas[i] as CajaPlano, cajas[j] as CajaPlano, p);
      if (r === null) continue;
      const [a, b] = r ? [i, j] : [j, i];
      (despues[a] as number[]).push(b);
      entrantes[b] = (entrantes[b] ?? 0) + 1;
    }
  }
  const clave = (i: number): number[] => {
    const c = cajas[i] as CajaPlano;
    return [c.y1, c.z1, c.x0, i];
  };
  const listos: number[] = [];
  for (let i = 0; i < n; i++) if (entrantes[i] === 0) listos.push(i);
  const salida: CajaPlano[] = [];
  const hechos = new Set<number>();
  while (listos.length > 0) {
    listos.sort((u, v) => {
      const a = clave(u);
      const b = clave(v);
      return (a[0] as number) - (b[0] as number) || (a[1] as number) - (b[1] as number) || (a[2] as number) - (b[2] as number) || (a[3] as number) - (b[3] as number);
    });
    const i = listos.shift() as number;
    hechos.add(i);
    salida.push(cajas[i] as CajaPlano);
    for (const j of despues[i] as number[]) {
      entrantes[j] = (entrantes[j] ?? 0) - 1;
      if (entrantes[j] === 0) listos.push(j);
    }
  }
  // Si hubiera un ciclo (cajas que se pisan sin lógica), las que faltan van por borde sur.
  if (salida.length < n) {
    const faltan = cajas.map((c, i) => ({ c, i })).filter(({ i }) => !hechos.has(i)).sort((a, b) => a.c.y1 - b.c.y1 || a.c.z1 - b.c.z1 || a.i - b.i);
    for (const { c } of faltan) salida.push(c);
  }
  return salida;
}

/** Dibuja todas las cajas en el orden correcto (ver `ordenDePintado`). */
export function dibujarCajas(l: Lienzo, cajas: readonly CajaPlano[], p: Proyeccion): void {
  for (const c of ordenDePintado(cajas, p)) dibujarCaja(l, c, p);
}

/** Atajo: modelo en el plano `S`, girado y dibujado en un lienzo del tamaño dado. */
export function renderizarGiro(
  modelo: readonly CajaPlano[],
  giro: Giro,
  plano: { ancho: number; fondo: number },
  lienzo: { ancho: number; alto: number },
  proy: (ancho: number, fondo: number) => Proyeccion,
  extra?: (l: Lienzo, p: Proyeccion, g: { ancho: number; fondo: number }) => void,
): Lienzo {
  const l = new Lienzo(lienzo.ancho, lienzo.alto);
  const g = girarCajas(modelo, giro, plano.ancho, plano.fondo);
  const p = proy(g.ancho, g.fondo);
  dibujarCajas(l, g.cajas, p);
  extra?.(l, p, { ancho: g.ancho, fondo: g.fondo });
  return l;
}
