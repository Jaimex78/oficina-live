/**
 * Ayudas del lote 2B (tecnología, colaboración, cocina, decoración, temporada y exterior).
 *
 * Aquí viven los atajos que comparten todos los dibujos del lote: azar determinista,
 * cajas en vista 3/4 con luz arriba a la izquierda, el acabado (contorno tonal y una sola
 * sombra) y el registro de cada dibujo con sus orientaciones y variantes.
 *
 * Todo sigue el estilo de referencia del núcleo (`demo/estilo-referencia.ts`).
 */

import { objetoPorId } from '@ol/shared';
import { Lienzo, mapaEntreRampas, rampa } from '../nucleo';
import type { ColorEntrada } from '../nucleo';
import { recolorearVariante } from './comunes';

/** Cuadros dibujados: id canónico del frame a lienzo. */
export type Cuadros = Map<string, Lienzo>;

/**
 * Última fila del cuerpo de lo que va apoyado sobre una mesa (en un cuadro de 32 px). Es la misma fila 15 en que
 * apoya el monitor del lote 1. Las tapas de escritorio y mesón ocupan de la fila 2 a la 17: el objeto apoya hacia el
 * frente de la tapa y su sombra cae sobre ella, sin llegar al canto frontal.
 */
export const FILA_APOYO = 15;

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

// ---------------------------------------------------------------------------
// Acabado: contorno azul marino y sombra
// ---------------------------------------------------------------------------

/** Contorno de todo el estilo Gather: azul marino muy oscuro, no negro. */
export const CONTORNO: ColorEntrada = 'azul-oficina-0';
/** Contorno más suave (un tono arriba) para objetos muy claros o muy pequeños. */
export const CONTORNO_SUAVE: ColorEntrada = 'azul-oficina-1';
/** Color de la única sombra: azul grisáceo, se lee sobre ladrillo crema, lavanda y baldosa gris. */
export const COLOR_SOMBRA: ColorEntrada = 'azul-oficina-2';

export interface OpcionesAcabado {
  /** `false` quita la sombra (objetos colgados, de suelo o que van sobre las personas). Por defecto la estándar. */
  sombra?: boolean;
  /** Desplazamiento de la sombra, `[dx, dy]`. Por defecto `[2, 2]`. */
  desplazamiento?: readonly [number, number];
  /** El contorno también mira las diagonales (cierra mejor las formas redondas, pero engorda las esquinas). */
  diagonales?: boolean;
  /** Color del contorno. Por defecto `CONTORNO`. */
  contorno?: ColorEntrada;
}

/** La sombra estándar: azul grisáceo, 2 px a la derecha y 2 abajo, suave al alejarse. */
export function sombraEstandar(l: Lienzo, dx = 2, dy = 2): Lienzo {
  return l.sombraProyectada(COLOR_SOMBRA, dx, dy, { patron: 'degradado' });
}

/** Contorno azul marino alrededor de la silueta y, al final, la única sombra del objeto. */
export function terminar(l: Lienzo, opciones: OpcionesAcabado = {}): Lienzo {
  l.contorno(opciones.contorno ?? CONTORNO, opciones.diagonales ? { diagonales: true } : {});
  if (opciones.sombra !== false) {
    const [dx, dy] = opciones.desplazamiento ?? [2, 2];
    sombraEstandar(l, dx, dy);
  }
  return l;
}

/**
 * Oscuridad del piso entre las patas de un mueble: una fila sólida y el resto tramado,
 * pegada con modo `debajo` para no tapar nada del propio mueble.
 */
export function oscuridadBajo(l: Lienzo, x: number, y: number, ancho: number, filas = 3): Lienzo {
  const capa = new Lienzo(l.ancho, l.alto);
  capa.rect(x, y, ancho, 1, COLOR_SOMBRA);
  if (filas > 1) capa.trama(x, y + 1, ancho, filas - 1, null, COLOR_SOMBRA, 'bayer50');
  return l.pegar(capa, 0, 0, { modo: 'debajo' });
}

/**
 * Vetas de madera: rayas de 1 px de alto y de 4 a 12 de largo, sin salirse del rectángulo.
 * `cantidad` trazos, uno de cada tres con el tono claro.
 */
export function vetas(l: Lienzo, x: number, y: number, ancho: number, alto: number, semilla: number, oscuro: ColorEntrada, claro: ColorEntrada, cantidad: number): Lienzo {
  const r = azar(semilla);
  for (let i = 0; i < cantidad; i++) {
    const largo = Math.min(entre(r, 4, 12), ancho);
    const px = x + entre(r, 0, Math.max(0, ancho - largo));
    const py = y + entre(r, 0, Math.max(0, alto - 1));
    l.rect(px, py, largo, 1, i % 3 === 2 ? claro : oscuro);
  }
  return l;
}

/** Relleno de un polígono por líneas de barrido (regla par-impar), con los vértices en coordenadas de píxel. */
export function poligono(l: Lienzo, puntos: ReadonlyArray<readonly [number, number]>, color: ColorEntrada): Lienzo {
  if (puntos.length < 3) return l;
  const ys = puntos.map((p) => p[1]);
  const y0 = Math.floor(Math.min(...ys));
  const y1 = Math.ceil(Math.max(...ys));
  for (let y = y0; y <= y1; y++) {
    const yc = y + 0.5;
    const cortes: number[] = [];
    for (let i = 0; i < puntos.length; i++) {
      const a = puntos[i];
      const b = puntos[(i + 1) % puntos.length];
      if (a === undefined || b === undefined) continue;
      if ((a[1] <= yc && b[1] > yc) || (b[1] <= yc && a[1] > yc)) cortes.push(a[0] + ((yc - a[1]) / (b[1] - a[1])) * (b[0] - a[0]));
    }
    cortes.sort((m, n) => m - n);
    for (let k = 0; k + 1 < cortes.length; k += 2) {
      const xa = Math.ceil((cortes[k] ?? 0) - 0.5);
      const xb = Math.ceil((cortes[k + 1] ?? 0) - 0.5);
      if (xb > xa) l.rect(xa, y, xb - xa, 1, color);
    }
  }
  return l;
}

/** ¿El píxel `(x, y)` cae dentro de la elipse de centro `(cx, cy)` y radios `rx`, `ry`? Misma regla que `Lienzo.elipse`. */
export function dentroElipse(x: number, y: number, cx: number, cy: number, rx: number, ry: number): boolean {
  const u = (x - cx) / (rx + 0.5);
  const v = (y - cy) / (ry + 0.5);
  return u * u + v * v <= 1;
}

// ---------------------------------------------------------------------------
// Cajas en vista 3/4
// ---------------------------------------------------------------------------

/** Tonos de una caja: la cara superior recibe la luz y la frontal se oscurece hacia la derecha y abajo. */
export interface PielCaja {
  /** Cara superior. */
  sup: ColorEntrada;
  /** Brillo del borde superior e izquierdo de la cara superior. */
  supLuz: ColorEntrada;
  /** Cara frontal. */
  frente: ColorEntrada;
  /** Columna izquierda de la cara frontal. */
  frenteLuz?: ColorEntrada;
  /** Columna derecha y fila inferior de la cara frontal. */
  frenteSombra?: ColorEntrada;
  /** Arista entre la cara superior y la frontal (primera fila del frente). */
  filo?: ColorEntrada;
}

/** Pieles de uso común: todos los objetos de una misma familia comparten materiales. */
export const PIEL = {
  /** Plástico blanco azulado de electrodomésticos: luz blanca, medio `baldosa-gris` y sombra más profunda. */
  blanco: { sup: 'neutro-7', supLuz: 'neutro-7', frente: 'baldosa-gris-4', frenteLuz: 'neutro-7', frenteSombra: 'baldosa-gris-3' },
  /** Plástico gris suave. */
  gris: { sup: 'baldosa-gris-4', supLuz: 'neutro-7', frente: 'baldosa-gris-3', frenteLuz: 'baldosa-gris-4', frenteSombra: 'baldosa-gris-2' },
  /** Plástico azul marino de pantallas y equipos. */
  oscuro: { sup: 'azul-oficina-3', supLuz: 'azul-oficina-4', frente: 'azul-oficina-2', frenteLuz: 'azul-oficina-3', frenteSombra: 'azul-oficina-1' },
  /** Panel azul grisáceo de escritorios y mostradores. */
  azul: { sup: 'azul-oficina-4', supLuz: 'neutro-7', frente: 'azul-oficina-3', frenteLuz: 'azul-oficina-4', frenteSombra: 'azul-oficina-2' },
  /** Acero inoxidable. */
  acero: { sup: 'metal-3', supLuz: 'neutro-7', frente: 'metal-2', frenteLuz: 'metal-3', frenteSombra: 'metal-1' },
  /** Madera clara cálida (mesas redondas, estantes). */
  crema: { sup: 'crema-4', supLuz: 'neutro-7', frente: 'crema-2', frenteLuz: 'crema-3', frenteSombra: 'crema-1' },
  /** Roble claro. */
  roble: { sup: 'madera-clara-3', supLuz: 'madera-clara-4', frente: 'madera-clara-2', frenteLuz: 'madera-clara-3', frenteSombra: 'madera-clara-1' },
  /** Nogal, para detalles. */
  nogal: { sup: 'madera-oscura-3', supLuz: 'madera-oscura-4', frente: 'madera-oscura-2', frenteLuz: 'madera-oscura-3', frenteSombra: 'madera-oscura-1' },
  /** Cemento pulido. */
  cemento: { sup: 'cemento-3', supLuz: 'neutro-6', frente: 'cemento-2', frenteLuz: 'cemento-3', frenteSombra: 'cemento-1' },
} as const satisfies Record<string, PielCaja>;

export interface MedidasCaja {
  x: number;
  y: number;
  ancho: number;
  /** Alto en pantalla de la cara superior. */
  fondo: number;
  /** Alto en pantalla de la cara frontal. */
  alto: number;
}

/**
 * Caja 3/4 sombreada: cara superior con brillo arriba y a la izquierda, frente con una columna
 * de luz a la izquierda y una de sombra a la derecha y abajo. Después se le pasa `terminar`.
 */
export function caja3d(l: Lienzo, m: MedidasCaja, piel: PielCaja): Lienzo {
  const { x, y, ancho, fondo, alto } = m;
  if (fondo > 0) {
    l.rect(x, y, ancho, fondo, piel.sup);
    l.rect(x, y, ancho, 1, piel.supLuz);
    l.rect(x, y + 1, 1, Math.max(0, fondo - 1), piel.supLuz);
  }
  l.rect(x, y + fondo, ancho, alto, piel.frente);
  if (piel.filo !== undefined) l.rect(x, y + fondo, ancho, 1, piel.filo);
  if (piel.frenteLuz !== undefined) l.rect(x, y + fondo, 1, alto, piel.frenteLuz);
  if (piel.frenteSombra !== undefined) {
    l.rect(x + ancho - 1, y + fondo, 1, alto, piel.frenteSombra);
    l.rect(x, y + fondo + alto - 1, ancho, 1, piel.frenteSombra);
  }
  return l;
}

/**
 * Cuerpo blando de bordes redondeados con tres tonos: sombra abajo y a la derecha, tono medio y luz arriba y a la
 * izquierda. Es la base de casi todo el estilo Gather: aparatos, macetas, cojines, carcasas.
 * `tonos` va de la sombra a la luz: `[sombra, medio, luz]`.
 */
export function cuerpoBlando(l: Lienzo, x: number, y: number, ancho: number, alto: number, radio: number, tonos: readonly [ColorEntrada, ColorEntrada, ColorEntrada]): Lienzo {
  l.rectRedondeado(x, y, ancho, alto, radio, tonos[0]);
  l.rectRedondeado(x, y, ancho - 1, alto - 1, radio, tonos[1]);
  const r = Math.max(1, radio - 1);
  l.rect(x + r, y, Math.max(1, ancho - 2 - r * 2), 1, tonos[2]);
  l.rect(x, y + r, 1, Math.max(1, alto - 2 - r * 2), tonos[2]);
  return l;
}

/** Quita los píxeles de las cuatro esquinas de un rectángulo para que no se vea tan duro (esquina de 1 px). */
export function esquinas(l: Lienzo, x: number, y: number, ancho: number, alto: number, quitar: readonly ('ni' | 'nd' | 'si' | 'sd')[] = ['ni', 'nd', 'si', 'sd']): Lienzo {
  if (quitar.includes('ni')) l.px(x, y, null);
  if (quitar.includes('nd')) l.px(x + ancho - 1, y, null);
  if (quitar.includes('si')) l.px(x, y + alto - 1, null);
  if (quitar.includes('sd')) l.px(x + ancho - 1, y + alto - 1, null);
  return l;
}

/** Los tres tonos de un material de mostrador: sombra, medio y luz. */
export type Tonos3 = readonly [ColorEntrada, ColorEntrada, ColorEntrada];

/** Cómo se ve un mostrador (barra, recepción, mesón): una tapa, un frente, un panel trasero y el zócalo. */
export interface EstiloMostrador {
  /** Panel trasero (salpicadero). */
  fondo: Tonos3;
  /** Cara superior. */
  tapa: Tonos3;
  /** Canto grueso de la tapa. */
  labio: Tonos3;
  /** Frente. */
  frente: Tonos3;
  /** Zócalo y sombra de abajo. */
  zocalo: ColorEntrada;
  /** Vetas o motas de la tapa: `[oscuro, claro]`, o `null` si es lisa. */
  vetas: readonly [ColorEntrada, ColorEntrada] | null;
  /** Color de los listones del frente (separación) o `null` si es liso. */
  listones: ColorEntrada | null;
}

/** Mostradores del mundo: la tapa clara con panel azul grisáceo de los escritorios y sus variantes de material. */
export const MOSTRADORES = {
  base: {
    fondo: ['baldosa-gris-3', 'baldosa-gris-4', 'neutro-6'],
    tapa: ['neutro-5', 'neutro-6', 'neutro-7'],
    labio: ['neutro-5', 'neutro-6', 'neutro-7'],
    frente: ['azul-oficina-2', 'azul-oficina-3', 'azul-oficina-4'],
    zocalo: 'azul-oficina-1',
    vetas: null,
    listones: 'azul-oficina-2',
  },
  madera: {
    fondo: ['madera-clara-1', 'madera-clara-2', 'madera-clara-3'],
    tapa: ['madera-clara-2', 'madera-clara-3', 'madera-clara-4'],
    labio: ['madera-clara-2', 'madera-clara-3', 'madera-clara-4'],
    frente: ['madera-clara-1', 'madera-clara-2', 'madera-clara-3'],
    zocalo: 'madera-clara-0',
    vetas: ['madera-clara-2', 'madera-clara-4'],
    listones: 'madera-clara-1',
  },
  blanco: {
    fondo: ['baldosa-gris-3', 'baldosa-gris-4', 'neutro-6'],
    tapa: ['neutro-5', 'neutro-6', 'neutro-7'],
    labio: ['neutro-5', 'neutro-6', 'neutro-7'],
    frente: ['baldosa-gris-3', 'baldosa-gris-4', 'neutro-6'],
    zocalo: 'baldosa-gris-2',
    vetas: null,
    listones: 'baldosa-gris-3',
  },
  negro: {
    fondo: ['azul-oficina-1', 'azul-oficina-2', 'azul-oficina-3'],
    tapa: ['azul-oficina-1', 'azul-oficina-2', 'azul-oficina-3'],
    labio: ['azul-oficina-1', 'azul-oficina-2', 'azul-oficina-3'],
    frente: ['azul-oficina-1', 'azul-oficina-1', 'azul-oficina-2'],
    zocalo: 'azul-oficina-0',
    vetas: null,
    listones: 'azul-oficina-0',
  },
} as const satisfies Record<string, EstiloMostrador>;

/** Columna o poste fino de tres tonos de izquierda a derecha: luz, medio y sombra (como las patas de referencia). */
export function poste(l: Lienzo, x: number, y: number, alto: number, ancho: number, tonos: readonly [ColorEntrada, ColorEntrada, ColorEntrada]): Lienzo {
  if (ancho === 1) return l.rect(x, y, 1, alto, tonos[1]);
  if (ancho === 2) return l.rect(x, y, 1, alto, tonos[0]).rect(x + 1, y, 1, alto, tonos[2]);
  l.rect(x, y, 1, alto, tonos[0]).rect(x + 1, y, ancho - 2, alto, tonos[1]).rect(x + ancho - 1, y, 1, alto, tonos[2]);
  return l;
}

/** Los tres tonos del metal, de la luz a la sombra. */
export const METAL: readonly [ColorEntrada, ColorEntrada, ColorEntrada] = ['metal-3', 'metal-2', 'metal-1'];

// ---------------------------------------------------------------------------
// Registro de cuadros
// ---------------------------------------------------------------------------

/**
 * Registra el dibujo base de una orientación (o máscara) y todas sus variantes, recoloreando `base`
 * desde la rampa con que se dibujó. Lanza un error si el inventario no promete esa clave.
 */
export function registrar(cuadros: Cuadros, id: string, clave: string, base: Lienzo, rampaBase?: string): void {
  const objeto = objetoPorId(id);
  if (objeto === undefined) throw new Error(`[${id}] no existe en el inventario.`);
  const porVariante = objeto.frames[clave];
  if (porVariante === undefined) throw new Error(`[${id}] el inventario no promete la clave "${clave}".`);
  for (const [variante, idFrame] of Object.entries(porVariante)) {
    if (variante === 'base') cuadros.set(idFrame, base);
    else if (rampaBase !== undefined) cuadros.set(idFrame, recolorearVariante(base, rampaBase, variante));
    else throw new Error(`[${id}] la variante "${variante}" necesita una rampa base para recolorear.`);
  }
}

/**
 * Registra una clave con un dibujo propio por variante (para las que no salen de recolorear una sola rampa,
 * como un ramo de globos de varios colores que en otra variante es de un solo color).
 */
export function registrarVariantes(cuadros: Cuadros, id: string, clave: string, porVariante: Readonly<Record<string, Lienzo>>): void {
  const objeto = objetoPorId(id);
  if (objeto === undefined) throw new Error(`[${id}] no existe en el inventario.`);
  const esperadas = objeto.frames[clave];
  if (esperadas === undefined) throw new Error(`[${id}] el inventario no promete la clave "${clave}".`);
  for (const [variante, idFrame] of Object.entries(esperadas)) {
    const l = porVariante[variante];
    if (l === undefined) throw new Error(`[${id}] falta la variante "${variante}" de "${clave}".`);
    cuadros.set(idFrame, l);
  }
}

/**
 * Variantes de color por cambio de rampa. `desde` son los tonos con que se dibujó la base (de oscuro a claro) y
 * `destinos` dice, por variante, a qué tonos pasan. Devuelve un lienzo por variante, con `base` incluida.
 * Los tonos que no están en `desde` (contorno, acentos de otra rampa) no cambian.
 */
export function variantesPorRampa(base: Lienzo, desde: readonly string[], destinos: Readonly<Record<string, readonly string[]>>): Record<string, Lienzo> {
  const r: Record<string, Lienzo> = { base };
  for (const [nombre, hacia] of Object.entries(destinos)) r[nombre] = base.recolorear(mapaEntreRampas(desde, hacia));
  return r;
}

/** Los cinco tonos de una rampa de la paleta, de oscuro a claro. */
export function tonos5(nombre: string): readonly string[] {
  return rampa(nombre);
}

/** Lo que cada objeto de una categoría entrega: una función por id que llena los cuadros. */
export type Constructores = Readonly<Record<string, (cuadros: Cuadros) => void>>;

/** Corre los constructores de una categoría y devuelve todos sus cuadros. */
export function construirCategoria(constructores: Constructores): Cuadros {
  const cuadros: Cuadros = new Map();
  for (const construir of Object.values(constructores)) construir(cuadros);
  return cuadros;
}

// ---------------------------------------------------------------------------
// Variantes de varios colores
// ---------------------------------------------------------------------------

/**
 * Pasa un dibujo de varias telas a una sola: cada rampa de origen se cambia por la rampa de destino
 * (por ejemplo un ramo de globos rojo, amarillo y azul pasa a ser todo azul). Los tonos que no
 * pertenecen a una rampa de origen no cambian.
 */
export function aUnSoloColor(l: Lienzo, origenes: readonly (readonly string[])[], destino: readonly string[]): Lienzo {
  const mapa: Record<string, string> = {};
  for (const o of origenes) Object.assign(mapa, mapaEntreRampas(o, destino));
  return l.recolorear(mapa);
}

/** Destinos de las variantes de color con rampa de 4 tonos (los mismos que usa `recolorearVariante`). */
export const DESTINO_COLOR: Readonly<Record<string, readonly string[]>> = {
  rojo: rampa('rojo').slice(0, 4),
  azul: rampa('vidrio'),
  verde: rampa('planta').slice(0, 4),
  amarillo: rampa('tela-calida'),
  negro: rampa('neutro').slice(0, 4),
  blanco: rampa('neutro').slice(4, 8),
  gris: rampa('tela-gris'),
};
