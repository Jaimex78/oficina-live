/**
 * Ayudas compartidas por todo el lote 1: generador con semilla, sombra estándar, veta de madera,
 * contorno con mapa propio y registro de cuadros por objeto, orientación y variante.
 *
 * Cada archivo `l1-<categoria>.ts` dibuja una categoría con estas ayudas y entrega sus cuadros
 * a `l1-todo.ts`, que los junta para el constructor `objetos-lote1`.
 */

import { objetoPorId } from '@ol/shared';
import { Lienzo, color, oscurecerTonal } from '../nucleo';
import type { ColorEntrada } from '../nucleo';
import { recolorearVariante } from './comunes';

/** Cuadros por id canónico (`silla-oficina@S~rojo`). */
export type Cuadros = Map<string, Lienzo>;

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

/** Contorno de todos los objetos del estilo Gather: azul marino muy oscuro (no negro, no tonal). */
export const COLOR_CONTORNO = 'azul-oficina-0' as const;

/**
 * La única sombra de un objeto suelto: gris frío tramado, 2 px a la derecha y 2 abajo. Se aplica al final,
 * después del contorno. El primer píxel junto al objeto va sólido y el resto a media trama, como una sombra
 * que se suaviza al alejarse, y deja ver el piso. Usa `neutro-2` y no un tono de `azul-oficina`, `crema` o
 * `morado`, para que al recolorear las variantes de color la sombra no cambie de color.
 */
export function sombra(l: Lienzo): Lienzo {
  return l.sombraProyectada('neutro-2', 2, 2, { patron: 'degradado' });
}

/**
 * Cierra un objeto: contorno azul marino de 1 px y, salvo que se pida lo contrario, su sombra.
 * Las cosas planas del suelo (alfombras, portal) y lo colgado en la pared no llevan sombra proyectada afuera.
 */
export function cerrar(l: Lienzo, opciones: { sombra?: boolean; diagonales?: boolean } = {}): Lienzo {
  l.contorno(COLOR_CONTORNO, opciones.diagonales ? { diagonales: true } : {});
  return opciones.sombra === false ? l : sombra(l);
}

/** Recolorea tono a tono de una lista de colores de paleta a otra (misma cantidad). El contorno no se toca. */
export function recolorTonos(l: Lienzo, desde: readonly string[], hacia: readonly string[]): Lienzo {
  if (desde.length !== hacia.length) throw new RangeError(`recolorTonos: ${desde.length} tonos de origen y ${hacia.length} de destino.`);
  const mapa: Record<string, string> = {};
  desde.forEach((origen, i) => {
    mapa[color(origen)] = color(hacia[i] as string);
  });
  return l.recolorear(mapa);
}

/**
 * Oscuridad bajo un mueble con tablero (mesas, escritorios): una fila sólida y el resto tramado bajo el canto.
 * Se pega con modo `debajo`, así nunca tapa nada del mueble.
 */
export function oscuridadBajoMesa(l: Lienzo, x: number, y: number, ancho: number, filas = 3): Lienzo {
  const capa = new Lienzo(l.ancho, l.alto);
  capa.rect(x, y, ancho, 1, 'neutro-2');
  if (filas > 1) capa.trama(x, y + 1, ancho, filas - 1, null, 'neutro-2', 'bayer50');
  return l.pegar(capa, 0, 0, { modo: 'debajo' });
}

export interface OpcionesVeta {
  /** Cuántas vetas oscuras. */
  oscuras: number;
  /** Cuántas vetas claras (brillos). */
  claras?: number;
  colorOscuro: ColorEntrada;
  colorClaro?: ColorEntrada;
  /** Largo mínimo y máximo de cada veta, en píxeles. */
  largo?: readonly [number, number];
}

/**
 * Vetas de madera: rayas de 1 px de alto, de 4 a 14 de largo, en el tono vecino de la rampa.
 * Nunca tocan el borde del rectángulo (deja 2 px a cada lado) ni se pegan entre sí en la misma fila.
 */
export function vetas(l: Lienzo, x: number, y: number, w: number, h: number, semilla: number, o: OpcionesVeta): void {
  const rnd = azar(semilla);
  const [minimo, maximo] = o.largo ?? [4, 14];
  const ocupado = new Set<string>();
  const poner = (c: ColorEntrada) => {
    for (let intento = 0; intento < 12; intento++) {
      const largo = Math.min(w - 4, minimo + Math.floor(rnd() * (maximo - minimo + 1)));
      if (largo < 3) return;
      const fila = y + Math.floor(rnd() * h);
      const inicio = x + 2 + Math.floor(rnd() * Math.max(1, w - 4 - largo + 1));
      let libre = true;
      for (let i = -1; i <= largo; i++) if (ocupado.has(`${inicio + i},${fila}`)) libre = false;
      if (!libre) continue;
      for (let i = 0; i < largo; i++) ocupado.add(`${inicio + i},${fila}`);
      l.rect(inicio, fila, largo, 1, c);
      return;
    }
  };
  for (let i = 0; i < o.oscuras; i++) poner(o.colorOscuro);
  for (let i = 0; i < (o.claras ?? 0); i++) poner(o.colorClaro ?? o.colorOscuro);
}

export interface OpcionesRegistro {
  /** Rampa con la que se dibujó la base (para recolorear las variantes). Por defecto `tela-gris`. */
  rampa?: string;
  /**
   * Variante a medida: si devuelve un lienzo, se usa en lugar del recoloreo estándar.
   * Sirve para objetos cuya variante no es solo un cambio de rampa (cuadros, alfombras con patrón).
   */
  variante?: (base: Lienzo, variante: string, clave: string) => Lienzo | undefined;
}

/**
 * Registra todos los cuadros de un objeto del inventario: dibuja la base de cada orientación (o máscara)
 * con `dibujar(clave)` y saca las demás variantes recoloreando (`recolorearVariante`).
 * Los ids salen del inventario, así no se inventa ninguno.
 */
export function registrarObjeto(salida: Cuadros, id: string, dibujar: (clave: string) => Lienzo, opciones: OpcionesRegistro = {}): void {
  const objeto = objetoPorId(id);
  if (!objeto) throw new Error(`El objeto "${id}" no existe en el inventario.`);
  for (const [clave, porVariante] of Object.entries(objeto.frames)) {
    const base = dibujar(clave);
    for (const [variante, idCuadro] of Object.entries(porVariante)) {
      const propio = variante === 'base' ? undefined : opciones.variante?.(base, variante, clave);
      const lienzo = propio ?? (variante === 'base' ? base.copiar() : recolorearVariante(base, opciones.rampa ?? 'tela-gris', variante));
      salida.set(idCuadro, lienzo);
    }
  }
}

/**
 * Contorno tonal con un mapa propio: para cada color vecino dice de qué color es el borde.
 * Lo que no está en el mapa baja un tono en su rampa, como el contorno normal.
 * Las llaves y los valores pueden ser nombres de la paleta o hex.
 */
export function contornoConMapa(l: Lienzo, mapa: Readonly<Record<string, string>>, opciones: { diagonales?: boolean } = {}): Lienzo {
  const tabla = new Map<string, string>();
  for (const [origen, destino] of Object.entries(mapa)) tabla.set(color(origen), color(destino));
  return l.contornoTonal({
    ...(opciones.diagonales ? { diagonales: true } : {}),
    oscurecer: (hex, pasos) => tabla.get(hex.toUpperCase()) ?? oscurecerTonal(hex, pasos),
  });
}

/** Mapa de píxeles de una forma: sirve para preguntar "¿hay algo aquí?" al sombrear bordes. */
export class Mascara {
  readonly ancho: number;
  readonly alto: number;
  private readonly datos: Uint8Array;

  constructor(ancho: number, alto: number) {
    this.ancho = ancho;
    this.alto = alto;
    this.datos = new Uint8Array(ancho * alto);
  }

  rect(x: number, y: number, w: number, h: number): this {
    for (let j = Math.max(0, y); j < Math.min(this.alto, y + h); j++) {
      for (let i = Math.max(0, x); i < Math.min(this.ancho, x + w); i++) this.datos[j * this.ancho + i] = 1;
    }
    return this;
  }

  /** ¿Hay algo en (x, y)? Fuera de la máscara siempre es falso. */
  en(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.ancho && y < this.alto && this.datos[y * this.ancho + x] === 1;
  }
}
