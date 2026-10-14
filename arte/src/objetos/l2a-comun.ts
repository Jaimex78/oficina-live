/**
 * Ayudas del lote 2A: estilo Gather (contorno azul marino y recoloreo por pares), azar determinista, sombra estándar,
 * trazos que envuelven (para pisos sin costuras) y la expansión de un dibujo base a todos los cuadros que promete
 * el inventario (orientaciones o máscaras y variantes).
 *
 * Reglas de arte (ver `GUIA-ESTILO-GATHER.md`, que manda sobre el estilo de referencia del núcleo):
 * formas redondeadas y blandas, contorno de 1 px en `azul-oficina-0` (nunca negro), sombreado de 2 a 3 tonos,
 * luz arriba a la izquierda y una sola sombra abajo a la derecha.
 */

import type { ObjetoCatalogo } from '@ol/shared';
import { Lienzo } from '../nucleo';
import type { ColorEntrada } from '../nucleo';
import { recolorearVariante } from './comunes';

/** Lo que dibuja cada objeto: un lienzo por clave (orientación o máscara) y la rampa con que se dibujó. */
export interface DibujoObjeto {
  /** Rampa del material que cambia de color en las variantes (`azul-oficina`, `crema`, `metal`...). Sirve al recoloreo estándar. */
  rampaBase: string;
  /** Un lienzo por clave de orientación (`S`, `E`, `U`...) o máscara de vecinos (`0101`). */
  vistas: Readonly<Record<string, Lienzo>>;
  /**
   * Variante a medida: si devuelve un lienzo, se usa en lugar del recoloreo estándar de `comunes.ts`.
   * Los objetos del estilo Gather la usan porque su material base (tapa blanca con panel azul, tapizado crema, silla azul
   * marino) no es una de las rampas que conoce el recoloreo estándar.
   */
  variante?: (base: Lienzo, variante: string, clave: string) => Lienzo | undefined;
}

/** Contorno de todos los objetos del estilo Gather: azul marino muy oscuro, cerca del tono 0 de `azul-oficina`. */
export const COLOR_CONTORNO = 'azul-oficina-0';
/** Color de la única sombra horneada de cada objeto. */
export const COLOR_SOMBRA = 'neutro-2';

/** Contorno exterior de 1 px en azul marino (en las 4 direcciones: los escalones de las curvas quedan limpios). */
export function contornoGather(l: Lienzo): Lienzo {
  return l.contorno(COLOR_CONTORNO);
}

/** Un par `[origen, destino]` para recolorear: nombres de la paleta o hex. */
export type ParColor = readonly [string, string];

/**
 * Recolorea un lienzo con una lista de pares. Lo que no está en la lista no cambia: así el contorno azul marino
 * (y todo lo que no deba cambiar de color entre variantes) pasa intacto.
 */
export function recolorearPares(l: Lienzo, pares: readonly ParColor[]): Lienzo {
  const mapa: Record<string, string> = {};
  for (const [origen, destino] of pares) mapa[origen] = destino;
  return l.recolorear(mapa);
}

/** Pares tono a tono entre dos rampas: `nombre-<tono>` de `desde` a `hacia`, para cada tono de la lista. */
export function paresDeRampa(desde: string, hacia: string, tonos: ReadonlyArray<number>, tonosDestino: ReadonlyArray<number> = tonos): ParColor[] {
  return tonos.map((t, i) => [`${desde}-${t}`, `${hacia}-${tonosDestino[i] ?? t}`] as const);
}

/** Generador pseudoaleatorio con semilla (mulberry32): mismas semillas, mismos números. */
export function azar(semilla: number): () => number {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Entero entre `min` y `max`, ambos incluidos. */
export function entre(r: () => number, min: number, max: number): number {
  return min + Math.floor(r() * (max - min + 1));
}

/** Pinta un píxel con vuelta al otro lado del lienzo: así los motivos que cruzan el borde de un piso repiten sin costura. */
export function pxEnvuelto(l: Lienzo, x: number, y: number, color: ColorEntrada): void {
  l.px(((x % l.ancho) + l.ancho) % l.ancho, ((y % l.alto) + l.alto) % l.alto, color);
}

/** Rectángulo con vuelta al otro lado del lienzo. */
export function rectEnvuelto(l: Lienzo, x: number, y: number, w: number, h: number, color: ColorEntrada): void {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) pxEnvuelto(l, x + i, y + j, color);
}

/** La única sombra del objeto: gris frío, 2 px a la derecha y 2 hacia abajo, suave al alejarse (la del estilo de referencia). */
export function sombraEstandar(l: Lienzo): Lienzo {
  return l.sombraProyectada(COLOR_SOMBRA, 2, 2, { patron: 'degradado' });
}

/**
 * Oscuridad del piso entre las patas de un mueble: una fila sólida y dos tramadas,
 * pegadas con modo `debajo` para no tapar nada del propio mueble.
 */
export function oscuridadBajo(l: Lienzo, x: number, y: number, ancho: number, filas = 3): Lienzo {
  const capa = new Lienzo(l.ancho, l.alto);
  capa.rect(x, y, ancho, 1, 'neutro-2');
  if (filas > 1) capa.trama(x, y + 1, ancho, filas - 1, null, 'neutro-2', 'bayer50');
  return l.pegar(capa, 0, 0, { modo: 'debajo' });
}

/** Pata fina de tres tonos de izquierda a derecha: luz, medio y sombra (la del escritorio de referencia). */
export function pataMetal(l: Lienzo, x: number, y: number, alto: number, ancho = 3): Lienzo {
  if (ancho === 1) return l.rect(x, y, 1, alto, 'metal-2');
  if (ancho === 2) return l.rect(x, y, 1, alto, 'metal-3').rect(x + 1, y, 1, alto, 'metal-1');
  l.rect(x, y, 1, alto, 'metal-3').rect(x + 1, y, ancho - 2, alto, 'metal-2').rect(x + ancho - 1, y, 1, alto, 'metal-1');
  return l;
}

export interface OpcionesVetas {
  /** `h`: la veta corre en horizontal; `v`: en vertical. */
  eje: 'h' | 'v';
  /** Largo de cada trazo, de `min` a `max` píxeles. */
  largo: readonly [number, number];
  /** Cuántos trazos oscuros y cuántos claros. */
  oscuras: number;
  claras: number;
  oscuro?: ColorEntrada;
  claro?: ColorEntrada;
  semilla: number;
  /** Margen libre dentro del rectángulo, para no tocar los bordes con brillo. */
  margen?: number;
}

/**
 * Vetas de madera: trazos de 1 px en el tono vecino, largos y paralelos al lado largo del tablero.
 * Se reparten sin tocarse (cada trazo reserva la fila o columna vecina) y nunca salen del rectángulo.
 * Con una semilla fija el resultado es siempre el mismo.
 */
export function vetas(l: Lienzo, x: number, y: number, ancho: number, alto: number, o: OpcionesVetas): Lienzo {
  const r = azar(o.semilla);
  const margen = o.margen ?? 2;
  const oscuro = o.oscuro ?? 'madera-oscura-2';
  const claro = o.claro ?? 'madera-oscura-4';
  const horizontal = o.eje === 'h';
  const largoMax = horizontal ? ancho - 2 * margen : alto - 2 * margen;
  const ocupado = new Set<string>();
  const libre = (cx: number, cy: number, largo: number): boolean => {
    for (let k = -1; k <= largo; k++) {
      for (const d of [-1, 0, 1]) {
        if (ocupado.has(horizontal ? `${cx + k},${cy + d}` : `${cx + d},${cy + k}`)) return false;
      }
    }
    return true;
  };
  const poner = (cantidad: number, color: ColorEntrada): void => {
    let intentos = 0;
    let hechas = 0;
    while (hechas < cantidad && intentos < cantidad * 30) {
      intentos++;
      const largo = Math.min(largoMax, entre(r, o.largo[0], o.largo[1]));
      if (largo < 2) continue;
      const cx = horizontal ? x + margen + entre(r, 0, Math.max(0, ancho - 2 * margen - largo)) : x + margen + entre(r, 0, Math.max(0, ancho - 2 * margen - 1));
      const cy = horizontal ? y + margen + entre(r, 0, Math.max(0, alto - 2 * margen - 1)) : y + margen + entre(r, 0, Math.max(0, alto - 2 * margen - largo));
      if (!libre(cx, cy, largo)) continue;
      for (let k = 0; k < largo; k++) {
        const px = horizontal ? cx + k : cx;
        const py = horizontal ? cy : cy + k;
        l.px(px, py, color);
        ocupado.add(`${px},${py}`);
      }
      hechas++;
    }
  };
  poner(o.oscuras, oscuro);
  poner(o.claras, claro);
  return l;
}

/** Pata de madera de tres tonos de izquierda a derecha (luz, medio, sombra) con un pie más oscuro. */
export function pataMadera(l: Lienzo, x: number, y: number, alto: number, ancho = 4): Lienzo {
  l.rect(x, y, ancho, alto, 'madera-oscura-2');
  l.rect(x, y, 1, alto, 'madera-oscura-3');
  l.rect(x + ancho - 1, y, 1, alto, 'madera-oscura-1');
  l.rect(x, y + alto - 1, ancho, 1, 'madera-oscura-1');
  return l;
}

/** Elipse tramada: una sombra suave bajo un objeto redondo (se pega con modo `debajo`). */
export function elipseTramada(l: Lienzo, cx: number, cy: number, rx: number, ry: number, color: ColorEntrada, patron: 'bayer50' | 'bayer25' = 'bayer50'): Lienzo {
  const capa = new Lienzo(l.ancho, l.alto);
  capa.elipse(cx, cy, rx, ry, color);
  const salida = new Lienzo(l.ancho, l.alto);
  for (let y = 0; y < l.alto; y++) {
    for (let x = 0; x < l.ancho; x++) {
      if (!capa.esOpaco(x, y)) continue;
      const segundo = patron === 'bayer50' ? ((x + y) & 1) === 0 : (x & 1) === 0 && (y & 1) === 0;
      if (segundo) salida.px(x, y, color);
    }
  }
  return l.pegar(salida, 0, 0, { modo: 'debajo' });
}

/** Cuántos píxeles de un color hay en un rectángulo (sirve para pruebas y comprobaciones). */
export function contarColor(l: Lienzo, hex: string, x0: number, y0: number, w: number, h: number): number {
  let n = 0;
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (l.leerHex(x, y) === hex) n++;
  return n;
}

/**
 * Convierte el dibujo base de un objeto en TODOS los cuadros que promete el inventario:
 * una vista por cada clave (orientación o máscara) y una copia recoloreada por cada variante.
 * Lanza un error si falta una vista: el inventario manda, no se inventan ni se omiten cuadros.
 */
export function expandirVariantes(objeto: ObjetoCatalogo, dibujo: DibujoObjeto): Map<string, Lienzo> {
  const cuadros = new Map<string, Lienzo>();
  for (const [clave, porVariante] of Object.entries(objeto.frames)) {
    const base = dibujo.vistas[clave];
    if (base === undefined) throw new Error(`[${objeto.id}] falta la vista "${clave}" del dibujo base.`);
    for (const [variante, id] of Object.entries(porVariante)) {
      if (variante === 'base') {
        cuadros.set(id, base.copiar());
        continue;
      }
      cuadros.set(id, dibujo.variante?.(base, variante, clave) ?? recolorearVariante(base, dibujo.rampaBase, variante));
    }
  }
  return cuadros;
}
