/**
 * Lienzo: una imagen RGBA sin suavizado para dibujar pixel art por código.
 *
 * Reglas del lienzo:
 * - Se crea transparente.
 * - Cada píxel es alfa 0 (vacío) o alfa 255 (opaco). Nunca hay semitransparencia.
 *   Un píxel vacío siempre vale (0, 0, 0, 0).
 * - Dibujar fuera del lienzo no lanza errores: se recorta en silencio.
 * - Los métodos que DIBUJAN modifican el lienzo y devuelven `this`, así se
 *   encadenan: `l.rect(...).linea(...).contornoTonal()`.
 * - Los métodos que TRANSFORMAN (`recortar`, `copiar`, `voltearH`, `voltearV`,
 *   `recolorear`, `escalar`, `mosaico`, `desplazar`) devuelven un lienzo NUEVO
 *   y no tocan el original.
 *
 * Colores aceptados (`ColorEntrada`): `"#RRGGBB"`, un nombre de la paleta
 * (`"madera-clara-3"`), un alias (`"tinta"`), o `null` / `"transparente"` para borrar.
 * Las coordenadas decimales se truncan al píxel que las contiene.
 */

import { createHash } from 'node:crypto';
import { luminancia, normalizarHex } from './color';
import { colorMarcador, infoMarcador } from './marcadores';
import { color as colorDePaleta, oscurecerEnRampa, rampa as rampaDePaleta } from './paleta';
import type { ColorEntrada, Marco, ModoPegado, PatronTrama, Rgba } from './tipos';

/** Lado máximo de un lienzo. Protege contra errores que pedirían gigas de memoria. */
export const LADO_MAXIMO = 8192;

const TRANSPARENTE = -1;
const CACHE_COLORES = new Map<string, number>();

/** Color de entrada a entero `0xRRGGBB`, o `-1` si es transparente. */
function resolver(entrada: ColorEntrada): number {
  if (entrada === null) return TRANSPARENTE;
  const guardado = CACHE_COLORES.get(entrada);
  if (guardado !== undefined) return guardado;
  const valor =
    entrada === 'transparente' ? TRANSPARENTE : Number.parseInt(colorDePaleta(entrada).slice(1), 16);
  CACHE_COLORES.set(entrada, valor);
  return valor;
}

function enteroAHex(valor: number): string {
  return `#${valor.toString(16).padStart(6, '0').toUpperCase()}`;
}

function aEntero(valor: number, nombre: string): number {
  if (!Number.isFinite(valor)) {
    throw new TypeError(`${nombre} debe ser un número finito, y se recibió ${String(valor)}.`);
  }
  return Math.floor(valor);
}

/**
 * ¿Este píxel usa el segundo color de la trama? Las coordenadas son del
 * lienzo, no del rectángulo: así las tramas de objetos vecinos encajan y los
 * mosaicos de 32 px no tienen costuras. Ver README para los dibujos.
 */
export function usaSegundoColor(patron: PatronTrama, x: number, y: number): boolean {
  switch (patron) {
    case 'tablero':
      return ((x + y) & 1) === 1;
    case 'bayer50':
      return ((x + y) & 1) === 0;
    case 'bayer25':
      return (x & 1) === 0 && (y & 1) === 0;
    case 'bayer75':
      return !((x & 1) === 0 && (y & 1) === 1);
    case 'lineas-h':
      return (y & 1) === 1;
    case 'lineas-v':
      return (x & 1) === 1;
    case 'diagonal':
      return ((x + y) & 3) === 0;
  }
}

/** Opciones de `contornoTonal`. */
export interface OpcionesContornoTonal {
  /** También mira los vecinos en diagonal. Por defecto no. */
  diagonales?: boolean;
  /** Cuántos tonos más oscuro que el vecino. Por defecto 1. */
  pasos?: number;
  /**
   * - `exterior` (por defecto): pinta los píxeles VACÍOS que tocan la forma.
   *   La forma crece 1 px por cada lado, así que déjale ese margen.
   * - `interior`: oscurece los píxeles del borde de la propia forma. La
   *   silueta no cambia de tamaño. Los bordes del lienzo no cuentan como borde.
   */
  modo?: 'exterior' | 'interior';
  /** Función propia para elegir el color del borde. Por defecto, el tono anterior de la rampa. */
  oscurecer?: (hex: string, pasos: number) => string;
}

/** Opciones de `sombraProyectada` y `capaSombra`. */
export interface OpcionesSombra {
  /**
   * Si es `true` (por defecto) la sombra se extruye desde la forma hasta el
   * desplazamiento, así no queda partida cuando `dx` o `dy` son mayores a 1.
   */
  extruir?: boolean;
  /**
   * Para sombras que no tapan del todo el piso, pinta solo una parte de los
   * píxeles:
   * - cualquier patrón de trama: `bayer50` pinta la mitad, `bayer25` un cuarto;
   * - `degradado`: el primer píxel junto al objeto va sólido y el resto a
   *   `bayer50`, como una sombra que se suaviza al alejarse.
   * Por defecto la sombra es sólida.
   */
  patron?: PatronTrama | 'degradado';
}

/** Opciones de `hoja`. */
export interface OpcionesHoja {
  /** Dibuja la nervadura central con el tono más oscuro. Por defecto no. */
  nervadura?: boolean;
}

/** Opciones de `caja`: la receta de una caja en vista 3/4. */
export interface OpcionesCaja {
  /** Esquina superior izquierda de toda la caja (empieza por la cara superior). */
  x: number;
  y: number;
  ancho: number;
  /** Alto en pantalla de la cara superior (la profundidad vista desde arriba). */
  fondo: number;
  /** Alto en pantalla de la cara frontal (la altura del objeto). */
  alto: number;
  superior: ColorEntrada;
  frontal: ColorEntrada;
  /** Brillo en los bordes superior e izquierdo de la cara superior (luz arriba a la izquierda). */
  luz?: ColorEntrada;
  /** Arista entre la cara superior y la frontal: la primera fila de la cara frontal. */
  filo?: ColorEntrada;
  /** Línea de sombra en la última fila de la cara frontal. */
  sombra?: ColorEntrada;
}

/** Opciones de `elipse`. */
export interface OpcionesElipse {
  /** `true` (por defecto) rellena; `false` dibuja solo el borde de 1 px. */
  relleno?: boolean;
  /** Giro en grados, sentido horario en pantalla. 0 por defecto. */
  angulo?: number;
}

/** Opciones de `elipseSombreada`. */
export interface OpcionesElipseSombreada {
  /** Giro en grados, sentido horario en pantalla. 0 por defecto. */
  angulo?: number;
  /**
   * Hacia dónde está la luz, como vector `[x, y, z]` (z hacia quien mira).
   * Por defecto arriba a la izquierda y un poco al frente.
   */
  luz?: readonly [number, number, number];
  /** Cuánta curvatura tiene la cúpula, de 0 (plana, un solo tono) a 1. Por defecto 0.9. */
  relieve?: number;
  /** Umbrales de luz (0 a 1, creciente) que separan los tonos: uno menos que la cantidad de tonos. */
  umbrales?: readonly number[];
}

const LUZ_POR_DEFECTO: readonly [number, number, number] = [-0.55, -0.7, 0.45];
/** Dirección de la luz sobre el plano de la pantalla: hacia arriba a la izquierda. */
const LUZ_PLANA: readonly [number, number] = [-0.6, -0.8];

function umbralesPorDefecto(tonos: number): readonly number[] {
  switch (tonos) {
    case 2:
      return [0.45];
    case 3:
      return [0.3, 0.72];
    case 4:
      return [0.3, 0.62, 0.88];
    case 5:
      return [0.3, 0.62, 0.84, 0.96];
    default:
      return Array.from({ length: tonos - 1 }, (_, i) => (i + 1) / tonos);
  }
}

/** Geometría de una elipse girada: ¿un píxel está adentro? y sus coordenadas normalizadas. */
function medirElipse(cx: number, cy: number, rx: number, ry: number, angulo: number) {
  if (!Number.isFinite(cx) || !Number.isFinite(cy) || !Number.isFinite(rx) || !Number.isFinite(ry) || !Number.isFinite(angulo)) {
    throw new TypeError('La elipse necesita centro, radios y ángulo finitos.');
  }
  if (rx < 0 || ry < 0) return null;
  const ax = rx + 0.5;
  const ay = ry + 0.5;
  const rad = (angulo * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const medida = (px: number, py: number): { u: number; v: number } => {
    const dx = px - cx;
    const dy = py - cy;
    return { u: (dx * cos + dy * sin) / ax, v: (-dx * sin + dy * cos) / ay };
  };
  const radio = Math.max(rx, ry) + 1;
  return {
    medida,
    dentro: (px: number, py: number): boolean => {
      const { u, v } = medida(px, py);
      return u * u + v * v <= 1;
    },
    caja: (ancho: number, alto: number) => ({
      x0: Math.max(0, Math.floor(cx - radio - 1)),
      x1: Math.min(ancho - 1, Math.ceil(cx + radio + 1)),
      y0: Math.max(0, Math.floor(cy - radio - 1)),
      y1: Math.min(alto - 1, Math.ceil(cy + radio + 1)),
    }),
  };
}

const VECINOS_4: ReadonlyArray<readonly [number, number]> = [
  [0, -1],
  [-1, 0],
  [1, 0],
  [0, 1],
];
const VECINOS_8: ReadonlyArray<readonly [number, number]> = [
  ...VECINOS_4,
  [-1, -1],
  [1, -1],
  [-1, 1],
  [1, 1],
];

const CACHE_OSCURECER = new Map<string, string>();

/**
 * Tono más oscuro de un color para el contorno tonal. Entiende la paleta, los
 * marcadores de personajes (baja un tono dentro del mismo slot) y cualquier
 * otro color (sombra generada con `rampa5`).
 */
export function oscurecerTonal(hex: string, pasos = 1): string {
  const h = normalizarHex(hex);
  const clave = `${h}|${pasos}`;
  const guardado = CACHE_OSCURECER.get(clave);
  if (guardado !== undefined) return guardado;
  const marcador = infoMarcador(h);
  const resultado =
    marcador !== null
      ? colorMarcador(marcador.slot, Math.max(0, marcador.tono - Math.max(0, Math.floor(pasos))))
      : oscurecerEnRampa(h, pasos);
  CACHE_OSCURECER.set(clave, resultado);
  return resultado;
}

export class Lienzo {
  readonly ancho: number;
  readonly alto: number;
  /** Píxeles RGBA, fila por fila. Se puede leer directamente; para escribir usa los métodos. */
  readonly datos: Uint8ClampedArray;

  constructor(ancho: number, alto: number) {
    if (!Number.isInteger(ancho) || !Number.isInteger(alto) || ancho < 1 || alto < 1) {
      throw new RangeError(`Medidas de lienzo inválidas: ${String(ancho)} x ${String(alto)}. Deben ser enteros de 1 en adelante.`);
    }
    if (ancho > LADO_MAXIMO || alto > LADO_MAXIMO) {
      throw new RangeError(`Lienzo demasiado grande: ${ancho} x ${alto}. El lado máximo es ${LADO_MAXIMO}.`);
    }
    this.ancho = ancho;
    this.alto = alto;
    this.datos = new Uint8ClampedArray(ancho * alto * 4);
  }

  // -------------------------------------------------------------------------
  // Construcción
  // -------------------------------------------------------------------------

  /**
   * Crea un lienzo desde datos RGBA (por ejemplo, de un PNG leído).
   * Los píxeles con alfa 0 se normalizan a (0, 0, 0, 0). Si llegan alfas
   * parciales se conservan tal cual para que `validarLienzo` los reporte.
   */
  static desdeDatos(ancho: number, alto: number, datos: ArrayLike<number>): Lienzo {
    const l = new Lienzo(ancho, alto);
    if (datos.length !== ancho * alto * 4) {
      throw new RangeError(`Se esperaban ${ancho * alto * 4} valores RGBA y llegaron ${datos.length}.`);
    }
    for (let i = 0; i < datos.length; i += 4) {
      const a = datos[i + 3] ?? 0;
      if (a === 0) continue;
      l.datos[i] = datos[i] ?? 0;
      l.datos[i + 1] = datos[i + 1] ?? 0;
      l.datos[i + 2] = datos[i + 2] ?? 0;
      l.datos[i + 3] = a;
    }
    return l;
  }

  /**
   * Crea un lienzo desde una cuadrícula de texto. Cada carácter es un píxel.
   * `.` es transparente (salvo que la leyenda lo redefina). Todos los demás
   * caracteres deben estar en la leyenda.
   *
   * ```ts
   * Lienzo.desdeTexto(
   *   ['.oo.', 'oxxo', '.oo.'],
   *   { o: 'tinta', x: 'rojo-3' },
   * );
   * ```
   */
  static desdeTexto(lineas: readonly string[], leyenda: Readonly<Record<string, ColorEntrada>>): Lienzo {
    if (lineas.length === 0) throw new RangeError('La cuadrícula de texto no tiene filas.');
    const ancho = [...(lineas[0] ?? '')].length;
    if (ancho === 0) throw new RangeError('La primera fila de la cuadrícula de texto está vacía.');
    const l = new Lienzo(ancho, lineas.length);
    lineas.forEach((linea, y) => {
      const caracteres = [...linea];
      if (caracteres.length !== ancho) {
        throw new RangeError(
          `La fila ${y} mide ${caracteres.length} caracteres y la primera mide ${ancho}. Todas las filas deben medir lo mismo.`,
        );
      }
      caracteres.forEach((c, x) => {
        let entrada: ColorEntrada | undefined;
        if (Object.prototype.hasOwnProperty.call(leyenda, c)) entrada = leyenda[c];
        else if (c === '.') entrada = null;
        else {
          throw new RangeError(`El carácter "${c}" (fila ${y}, columna ${x}) no está en la leyenda.`);
        }
        if (entrada !== undefined) l.poner(y * l.ancho + x, resolver(entrada));
      });
    });
    return l;
  }

  // -------------------------------------------------------------------------
  // Acceso básico
  // -------------------------------------------------------------------------

  /** ¿La coordenada cae dentro del lienzo? */
  dentro(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.ancho && y < this.alto;
  }

  private poner(indicePixel: number, valor: number): void {
    const i = indicePixel * 4;
    const d = this.datos;
    if (valor === TRANSPARENTE) {
      d[i] = 0;
      d[i + 1] = 0;
      d[i + 2] = 0;
      d[i + 3] = 0;
    } else {
      d[i] = (valor >> 16) & 255;
      d[i + 1] = (valor >> 8) & 255;
      d[i + 2] = valor & 255;
      d[i + 3] = 255;
    }
  }

  /** Lee un píxel como entero `0xRRGGBB` o `-1` si está vacío o fuera del lienzo. */
  private leerEntero(x: number, y: number): number {
    if (!this.dentro(x, y)) return TRANSPARENTE;
    const i = (y * this.ancho + x) * 4;
    const d = this.datos;
    if ((d[i + 3] ?? 0) === 0) return TRANSPARENTE;
    return ((d[i] ?? 0) << 16) | ((d[i + 1] ?? 0) << 8) | (d[i + 2] ?? 0);
  }

  /** Pinta un píxel. Fuera del lienzo no hace nada. */
  px(x: number, y: number, color: ColorEntrada): this {
    const xi = aEntero(x, 'x');
    const yi = aEntero(y, 'y');
    if (this.dentro(xi, yi)) this.poner(yi * this.ancho + xi, resolver(color));
    return this;
  }

  /** Lee un píxel como `{ r, g, b, a }`. Vacío o fuera del lienzo da `{ 0, 0, 0, 0 }`. */
  leer(x: number, y: number): Rgba {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    if (!this.dentro(xi, yi)) return { r: 0, g: 0, b: 0, a: 0 };
    const i = (yi * this.ancho + xi) * 4;
    const d = this.datos;
    return { r: d[i] ?? 0, g: d[i + 1] ?? 0, b: d[i + 2] ?? 0, a: d[i + 3] ?? 0 };
  }

  /** Lee un píxel como `#RRGGBB` en mayúsculas, o `null` si está vacío o fuera del lienzo. */
  leerHex(x: number, y: number): string | null {
    const v = this.leerEntero(Math.floor(x), Math.floor(y));
    return v === TRANSPARENTE ? null : enteroAHex(v);
  }

  /** ¿Hay un píxel visible en esta coordenada? */
  esOpaco(x: number, y: number): boolean {
    return this.leerEntero(Math.floor(x), Math.floor(y)) !== TRANSPARENTE;
  }

  // -------------------------------------------------------------------------
  // Formas
  // -------------------------------------------------------------------------

  /** Rectángulo relleno. */
  rect(x: number, y: number, w: number, h: number, color: ColorEntrada): this {
    const x0 = Math.max(0, aEntero(x, 'x'));
    const y0 = Math.max(0, aEntero(y, 'y'));
    const x1 = Math.min(this.ancho, aEntero(x, 'x') + aEntero(w, 'w'));
    const y1 = Math.min(this.alto, aEntero(y, 'y') + aEntero(h, 'h'));
    if (x1 <= x0 || y1 <= y0) return this;
    const v = resolver(color);
    for (let py = y0; py < y1; py++) {
      for (let px = x0; px < x1; px++) this.poner(py * this.ancho + px, v);
    }
    return this;
  }

  /** Solo el borde de un rectángulo, hacia adentro. `grosor` en píxeles (1 por defecto). */
  rectBorde(x: number, y: number, w: number, h: number, color: ColorEntrada, grosor = 1): this {
    const xi = aEntero(x, 'x');
    const yi = aEntero(y, 'y');
    const wi = aEntero(w, 'w');
    const hi = aEntero(h, 'h');
    const g = Math.max(1, aEntero(grosor, 'grosor'));
    if (wi <= 0 || hi <= 0) return this;
    if (wi <= 2 * g || hi <= 2 * g) return this.rect(xi, yi, wi, hi, color);
    this.rect(xi, yi, wi, g, color);
    this.rect(xi, yi + hi - g, wi, g, color);
    this.rect(xi, yi + g, g, hi - 2 * g, color);
    this.rect(xi + wi - g, yi + g, g, hi - 2 * g, color);
    return this;
  }

  /**
   * Rectángulo con esquinas redondeadas. `radio` es el radio del círculo de
   * cada esquina: 2 recorta 1 píxel por esquina y 4 recorta 3 (el redondeo
   * clásico del pixel art). Radio 1 o menos deja un rectángulo normal.
   */
  rectRedondeado(x: number, y: number, w: number, h: number, radio: number, color: ColorEntrada): this {
    const xi = aEntero(x, 'x');
    const yi = aEntero(y, 'y');
    const wi = aEntero(w, 'w');
    const hi = aEntero(h, 'h');
    if (wi <= 0 || hi <= 0) return this;
    const r = Math.min(Math.max(0, aEntero(radio, 'radio')), Math.floor(Math.min(wi, hi) / 2));
    const v = resolver(color);
    // Solo se recorre la parte que cae dentro del lienzo, aunque el rectángulo sea enorme.
    for (let j = Math.max(0, -yi); j < Math.min(hi, this.alto - yi); j++) {
      for (let i = Math.max(0, -xi); i < Math.min(wi, this.ancho - xi); i++) {
        const px = xi + i;
        const py = yi + j;
        let dentroDeEsquina = true;
        if (r > 1) {
          const ci = i < r ? r - i - 0.5 : i >= wi - r ? i - (wi - r) + 0.5 : -1;
          const cj = j < r ? r - j - 0.5 : j >= hi - r ? j - (hi - r) + 0.5 : -1;
          if (ci >= 0 && cj >= 0) dentroDeEsquina = ci * ci + cj * cj <= r * r;
        }
        if (dentroDeEsquina) this.poner(py * this.ancho + px, v);
      }
    }
    return this;
  }

  /** Línea de Bresenham, con los dos extremos incluidos. */
  linea(x0: number, y0: number, x1: number, y1: number, color: ColorEntrada): this {
    let x = aEntero(x0, 'x0');
    let y = aEntero(y0, 'y0');
    const xf = aEntero(x1, 'x1');
    const yf = aEntero(y1, 'y1');
    const v = resolver(color);
    const dx = Math.abs(xf - x);
    const dy = -Math.abs(yf - y);
    const sx = x < xf ? 1 : -1;
    const sy = y < yf ? 1 : -1;
    let error = dx + dy;
    const tope = dx + Math.abs(dy) + 2;
    if (tope > 2_000_000) {
      throw new RangeError(`Línea demasiado larga (${Math.max(dx, Math.abs(dy))} px): revisa las coordenadas.`);
    }
    for (let n = 0; n < tope; n++) {
      if (this.dentro(x, y)) this.poner(y * this.ancho + x, v);
      if (x === xf && y === yf) break;
      const e2 = 2 * error;
      if (e2 >= dy) {
        error += dy;
        x += sx;
      }
      if (e2 <= dx) {
        error += dx;
        y += sy;
      }
    }
    return this;
  }

  /**
   * Elipse con centro `(cx, cy)` y radios `rx`, `ry`. El ancho resultante es
   * `2 * rx + 1`: con radios enteros sale de ancho impar. Para anchos pares
   * usa un centro y un radio con medio píxel (`cx = 15.5, rx = 3.5` da 8 de ancho).
   *
   * - `relleno` es `true` por defecto. Con `{ relleno: false }` dibuja solo el
   *   borde de 1 px (ver también `elipseBorde`).
   * - `angulo` gira la elipse en grados, en sentido horario en pantalla: 0
   *   deja el eje `rx` horizontal, -45 lo apunta arriba a la derecha.
   */
  elipse(cx: number, cy: number, rx: number, ry: number, color: ColorEntrada, opciones: OpcionesElipse = {}): this {
    const relleno = opciones.relleno ?? true;
    const medir = medirElipse(cx, cy, rx, ry, opciones.angulo ?? 0);
    if (medir === null) return this;
    const v = resolver(color);
    const adentro = (px: number, py: number): boolean => medir.dentro(px, py);
    const caja = medir.caja(this.ancho, this.alto);
    for (let py = caja.y0; py <= caja.y1; py++) {
      for (let px = caja.x0; px <= caja.x1; px++) {
        if (!adentro(px, py)) continue;
        if (relleno || !adentro(px - 1, py) || !adentro(px + 1, py) || !adentro(px, py - 1) || !adentro(px, py + 1)) {
          this.poner(py * this.ancho + px, v);
        }
      }
    }
    return this;
  }

  /**
   * Elipse con volumen: se pinta con varios tonos como si fuera una cúpula
   * iluminada desde arriba a la izquierda. Sirve para todo lo blando o
   * redondo: hojas, cojines, puffs, macetas, globos, frutas.
   *
   * `tonos` va del más oscuro al más claro (2 a 5 tonos). Normalmente se pasan
   * los tonos 1 a 4 de una rampa, y el tono 0 queda para el contorno tonal:
   * `l.elipseSombreada(16, 20, 6, 4, rampa('planta').slice(1)).contornoTonal()`.
   * El centro de la forma toma un tono medio, arriba a la izquierda sale el
   * más claro y abajo a la derecha el más oscuro.
   */
  elipseSombreada(cx: number, cy: number, rx: number, ry: number, tonos: readonly ColorEntrada[], opciones: OpcionesElipseSombreada = {}): this {
    const n = tonos.length;
    if (n < 2) throw new RangeError('elipseSombreada necesita al menos 2 tonos.');
    const umbrales = opciones.umbrales ?? umbralesPorDefecto(n);
    if (umbrales.length !== n - 1) {
      throw new RangeError(`Con ${n} tonos hacen falta ${n - 1} umbrales y se recibieron ${umbrales.length}.`);
    }
    const angulo = opciones.angulo ?? 0;
    const medir = medirElipse(cx, cy, rx, ry, angulo);
    if (medir === null) return this;
    const relieve = Math.min(1, Math.max(0, opciones.relieve ?? 0.9));
    const [lx0, ly0, lz0] = opciones.luz ?? LUZ_POR_DEFECTO;
    const norma = Math.hypot(lx0, ly0, lz0) || 1;
    const [lx, ly, lz] = [lx0 / norma, ly0 / norma, lz0 / norma];
    const rad = (angulo * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const colores = tonos.map((t) => resolver(t));
    const caja = medir.caja(this.ancho, this.alto);
    for (let py = caja.y0; py <= caja.y1; py++) {
      for (let px = caja.x0; px <= caja.x1; px++) {
        const m = medir.medida(px, py);
        const r2 = m.u * m.u + m.v * m.v;
        if (r2 > 1) continue;
        // Normal de una cúpula en el marco de la elipse, girada al marco de la pantalla.
        const nu = m.u * relieve;
        const nv = m.v * relieve;
        const nw = Math.sqrt(Math.max(0, 1 - nu * nu - nv * nv));
        const nx = nu * cos - nv * sin;
        const ny = nu * sin + nv * cos;
        const luz = Math.max(0, nx * lx + ny * ly + nw * lz);
        let indice = 0;
        while (indice < umbrales.length && luz >= (umbrales[indice] as number)) indice++;
        this.poner(py * this.ancho + px, colores[indice] as number);
      }
    }
    return this;
  }

  /**
   * Una hoja alargada y con punta, sombreada con luz arriba a la izquierda.
   * Va desde el punto `base` (donde se une al tallo) hasta `punta`, y `ancho`
   * es lo más ancha que llega a ser (cerca de un tercio desde la base).
   *
   * `tonos` va del más oscuro al más claro: 3 tonos (sombra, base, luz) o 4
   * (con brillo). Con `{ nervadura: true }` marca la vena central con el tono
   * más oscuro, útil en hojas grandes. Después se le pasa `contornoTonal()`.
   *
   * ```ts
   * l.hoja([16, 44], [6, 14], 8, rampa('planta').slice(1)).contornoTonal();
   * ```
   */
  hoja(base: readonly [number, number], punta: readonly [number, number], ancho: number, tonos: readonly ColorEntrada[], opciones: OpcionesHoja = {}): this {
    if (tonos.length < 3 || tonos.length > 4) {
      throw new RangeError('hoja necesita 3 o 4 tonos: sombra, base, luz y, si quieres, brillo.');
    }
    const [x0, y0] = base;
    const [x1, y1] = punta;
    const dx = x1 - x0;
    const dy = y1 - y0;
    const largo = Math.hypot(dx, dy);
    if (!(largo > 0) || !Number.isFinite(largo) || !Number.isFinite(ancho)) return this;
    const ux = dx / largo;
    const uy = dy / largo;
    // Normal del eje que mira hacia la luz (arriba a la izquierda).
    let nx = uy;
    let ny = -ux;
    if (nx * LUZ_PLANA[0] + ny * LUZ_PLANA[1] < 0) {
      nx = -nx;
      ny = -ny;
    }
    const mitad = Math.max(0.5, ancho / 2);
    const colores = tonos.map((t) => resolver(t));
    const sombra = colores[0] as number;
    const medio = colores[1] as number;
    const luz = colores[2] as number;
    const brillo = colores.length === 4 ? (colores[3] as number) : luz;
    const nervadura = opciones.nervadura ?? false;
    const xMin = Math.max(0, Math.floor(Math.min(x0, x1) - mitad - 1));
    const xMax = Math.min(this.ancho - 1, Math.ceil(Math.max(x0, x1) + mitad + 1));
    const yMin = Math.max(0, Math.floor(Math.min(y0, y1) - mitad - 1));
    const yMax = Math.min(this.alto - 1, Math.ceil(Math.max(y0, y1) + mitad + 1));
    for (let y = yMin; y <= yMax; y++) {
      for (let x = xMin; x <= xMax; x++) {
        const px = x - x0;
        const py = y - y0;
        const t = (px * ux + py * uy) / largo;
        if (t < -0.02 || t > 1.02) continue;
        const tt = Math.min(1, Math.max(0, t));
        const semiancho = Math.max(0.5, mitad * Math.sin(Math.PI * tt ** 0.7) ** 0.9);
        const d = px * nx + py * ny;
        if (Math.abs(d) > semiancho) continue;
        const r = d / Math.max(semiancho, 0.75);
        let v = sombra;
        if (r > 0.55 && tt > 0.2 && tt < 0.85) v = brillo;
        else if (r > 0.12) v = luz;
        else if (r > -0.35) v = medio;
        if (nervadura && Math.abs(d) < 0.5 && tt > 0.12 && tt < 0.88) v = sombra;
        this.poner(y * this.ancho + x, v);
      }
    }
    return this;
  }

  /** Solo el borde de una elipse (igual que `elipse(..., { relleno: false })`). */
  elipseBorde(cx: number, cy: number, rx: number, ry: number, color: ColorEntrada): this {
    return this.elipse(cx, cy, rx, ry, color, { relleno: false });
  }

  /**
   * Relleno por inundación (cubeta de pintura). Cambia la región conectada
   * (en 4 direcciones) del mismo color exacto del píxel `(x, y)`.
   * Con `null` borra la región.
   */
  rellenar(x: number, y: number, color: ColorEntrada): this {
    const xi = aEntero(x, 'x');
    const yi = aEntero(y, 'y');
    if (!this.dentro(xi, yi)) return this;
    const w = this.ancho;
    const h = this.alto;
    const d = this.datos;
    const inicio = (yi * w + xi) * 4;
    const objetivo = [d[inicio] ?? 0, d[inicio + 1] ?? 0, d[inicio + 2] ?? 0, d[inicio + 3] ?? 0] as const;
    const nuevo = resolver(color);
    const nr = nuevo === TRANSPARENTE ? 0 : (nuevo >> 16) & 255;
    const ng = nuevo === TRANSPARENTE ? 0 : (nuevo >> 8) & 255;
    const nb = nuevo === TRANSPARENTE ? 0 : nuevo & 255;
    const na = nuevo === TRANSPARENTE ? 0 : 255;
    if (objetivo[0] === nr && objetivo[1] === ng && objetivo[2] === nb && objetivo[3] === na) return this;

    const coincide = (i: number): boolean =>
      d[i] === objetivo[0] && d[i + 1] === objetivo[1] && d[i + 2] === objetivo[2] && d[i + 3] === objetivo[3];
    const pila: number[] = [yi * w + xi];
    while (pila.length > 0) {
      const p = pila.pop() as number;
      const i = p * 4;
      if (!coincide(i)) continue;
      this.poner(p, nuevo);
      const px = p % w;
      const py = (p - px) / w;
      if (px > 0) pila.push(p - 1);
      if (px < w - 1) pila.push(p + 1);
      if (py > 0) pila.push(p - w);
      if (py < h - 1) pila.push(p + w);
    }
    return this;
  }

  /**
   * Rellena un rectángulo mezclando dos colores con una trama (dither).
   * El patrón se calcula con las coordenadas del lienzo, no del rectángulo,
   * por eso las tramas de dos objetos vecinos encajan sin costura.
   * Con `null` en un color, esos píxeles quedan vacíos.
   */
  trama(x: number, y: number, w: number, h: number, colorA: ColorEntrada, colorB: ColorEntrada, patron: PatronTrama): this {
    const x0 = Math.max(0, aEntero(x, 'x'));
    const y0 = Math.max(0, aEntero(y, 'y'));
    const x1 = Math.min(this.ancho, aEntero(x, 'x') + aEntero(w, 'w'));
    const y1 = Math.min(this.alto, aEntero(y, 'y') + aEntero(h, 'h'));
    const a = resolver(colorA);
    const b = resolver(colorB);
    for (let py = y0; py < y1; py++) {
      for (let px = x0; px < x1; px++) {
        this.poner(py * this.ancho + px, usaSegundoColor(patron, px, py) ? b : a);
      }
    }
    return this;
  }

  /**
   * Degradado vertical por bandas. `rampa` va de arriba hacia abajo: el primer
   * color queda arriba. Puede ser una lista de colores o el nombre de una
   * rampa de la paleta (que va del más oscuro al más claro; para luz arriba
   * pásala invertida).
   *
   * Con `{ dither: true }` el paso entre bandas se suaviza con dos filas de tablero.
   */
  degradadoV(x: number, y: number, w: number, h: number, rampa: string | readonly ColorEntrada[], opciones: { dither?: boolean } = {}): this {
    const colores: readonly ColorEntrada[] = typeof rampa === 'string' ? rampaDePaleta(rampa) : rampa;
    const n = colores.length;
    const wi = aEntero(w, 'w');
    const hi = aEntero(h, 'h');
    if (n === 0 || wi <= 0 || hi <= 0) return this;
    const xi = aEntero(x, 'x');
    const yi = aEntero(y, 'y');
    const banda = (fila: number): number => Math.min(n - 1, Math.floor((fila * n) / hi));
    for (let fila = Math.max(0, -yi); fila < Math.min(hi, this.alto - yi); fila++) {
      const b = banda(fila);
      const esUltima = fila < hi - 1 && banda(fila + 1) !== b;
      const esPrimera = fila > 0 && banda(fila - 1) !== b;
      for (let columna = Math.max(0, -xi); columna < Math.min(wi, this.ancho - xi); columna++) {
        const px = xi + columna;
        const py = yi + fila;
        let indice = b;
        if (opciones.dither) {
          const par = ((px + py) & 1) === 0;
          if (esUltima && par) indice = b + 1;
          else if (esPrimera && !esUltima && par) indice = b;
          else if (esPrimera && !esUltima && !par) indice = b - 1;
        }
        const entrada = colores[Math.min(n - 1, Math.max(0, indice))];
        this.poner(py * this.ancho + px, resolver(entrada ?? null));
      }
    }
    return this;
  }

  /**
   * Una caja en vista 3/4: cara superior (más clara) arriba y cara frontal
   * (más oscura) debajo, con luz desde arriba a la izquierda. Es la base de
   * escritorios, mesas, archivadores y cualquier mueble de lados rectos.
   * Después se le pasa `contornoTonal()` y, si hace falta, `sombraProyectada()`.
   */
  caja(o: OpcionesCaja): this {
    const { x, y, ancho, fondo, alto } = o;
    this.rect(x, y, ancho, fondo, o.superior);
    this.rect(x, y + fondo, ancho, alto, o.frontal);
    if (o.luz !== undefined) {
      this.rect(x, y, ancho, 1, o.luz);
      this.rect(x, y + 1, 1, Math.max(0, fondo - 1), o.luz);
    }
    if (o.filo !== undefined) this.rect(x, y + fondo, ancho, 1, o.filo);
    if (o.sombra !== undefined) this.rect(x, y + fondo + alto - 1, ancho, 1, o.sombra);
    return this;
  }

  // -------------------------------------------------------------------------
  // Contornos y sombras
  // -------------------------------------------------------------------------

  /**
   * Contorno exterior de 1 px de un solo color: pinta cada píxel vacío que
   * toca la forma (en 4 direcciones, o en 8 con `diagonales`). La forma crece
   * 1 px hacia cada lado, así que déjale margen en el lienzo.
   */
  contorno(color: ColorEntrada, opciones: { diagonales?: boolean } = {}): this {
    const vecinos = opciones.diagonales ? VECINOS_8 : VECINOS_4;
    const v = resolver(color);
    const w = this.ancho;
    const h = this.alto;
    const ocupado = this.mapaOcupacion();
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (ocupado[y * w + x] === 1) continue;
        for (const [dx, dy] of vecinos) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && ny >= 0 && nx < w && ny < h && ocupado[ny * w + nx] === 1) {
            this.poner(y * w + x, v);
            break;
          }
        }
      }
    }
    return this;
  }

  /**
   * Contorno selectivo (sel-out): cada píxel de borde toma el tono ANTERIOR de
   * la rampa de su vecino, no negro. Así el borde de una madera clara es una
   * madera un poco más oscura, el de una tela roja es un rojo más profundo, y
   * el dibujo se ve integrado en vez de recortado con tijeras.
   *
   * Si un píxel vacío toca varios colores, toma el borde más oscuro de ellos.
   * Entiende la paleta, los marcadores de personajes y cualquier otro color.
   * Ver `OpcionesContornoTonal` para `modo`, `pasos` y `diagonales`.
   */
  contornoTonal(opciones: OpcionesContornoTonal = {}): this {
    const vecinos = opciones.diagonales ? VECINOS_8 : VECINOS_4;
    const pasos = opciones.pasos ?? 1;
    const oscurecer = opciones.oscurecer ?? oscurecerTonal;
    const modo = opciones.modo ?? 'exterior';
    const w = this.ancho;
    const h = this.alto;
    const ocupado = this.mapaOcupacion();
    const original = this.datos.slice();

    const memo = new Map<number, { entero: number; luz: number }>();
    const borde = (entero: number): { entero: number; luz: number } => {
      let r = memo.get(entero);
      if (r === undefined) {
        const hex = oscurecer(enteroAHex(entero), pasos);
        r = { entero: Number.parseInt(hex.slice(1), 16), luz: luminancia(hex) };
        memo.set(entero, r);
      }
      return r;
    };
    const colorOriginal = (p: number): number =>
      ((original[p * 4] ?? 0) << 16) | ((original[p * 4 + 1] ?? 0) << 8) | (original[p * 4 + 2] ?? 0);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const p = y * w + x;
        if (modo === 'exterior') {
          if (ocupado[p] === 1) continue;
          let mejor: { entero: number; luz: number } | null = null;
          for (const [dx, dy] of vecinos) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
            const q = ny * w + nx;
            if (ocupado[q] !== 1) continue;
            const candidato = borde(colorOriginal(q));
            if (mejor === null || candidato.luz < mejor.luz) mejor = candidato;
          }
          if (mejor !== null) this.poner(p, mejor.entero);
        } else {
          if (ocupado[p] !== 1) continue;
          let esBorde = false;
          for (const [dx, dy] of vecinos) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
            if (ocupado[ny * w + nx] !== 1) {
              esBorde = true;
              break;
            }
          }
          if (esBorde) this.poner(p, borde(colorOriginal(p)).entero);
        }
      }
    }
    return this;
  }

  /**
   * La única sombra del objeto: una copia de la silueta corrida `(dx, dy)`,
   * pintada SOLO donde el lienzo está vacío. Con luz arriba a la izquierda la
   * sombra cae abajo a la derecha: `dx` y `dy` positivos (1 o 2 píxeles).
   * No hay semitransparencia, así que para una sombra suave usa
   * `{ patron: 'degradado' }`, `'bayer50'` o `'bayer25'`.
   * Si prefieres la sombra como capa aparte, mira `capaSombra`.
   */
  sombraProyectada(color: ColorEntrada, dx: number, dy: number, opciones: OpcionesSombra = {}): this {
    return this.pegar(this.capaSombra(color, dx, dy, opciones), 0, 0, { modo: 'debajo' });
  }

  /**
   * Igual que `sombraProyectada`, pero NO toca este lienzo: devuelve un lienzo
   * nuevo del mismo tamaño que contiene solo la sombra. Sirve para pegarla
   * después (`l.pegar(capa, 0, 0, { modo: 'debajo' })`), para tramar la
   * oscuridad bajo una mesa, o para publicarla como un frame aparte que el
   * motor dibuje con transparencia.
   */
  capaSombra(color: ColorEntrada, dx: number, dy: number, opciones: OpcionesSombra = {}): Lienzo {
    const dxi = aEntero(dx, 'dx');
    const dyi = aEntero(dy, 'dy');
    const capa = new Lienzo(this.ancho, this.alto);
    if (dxi === 0 && dyi === 0) return capa;
    const extruir = opciones.extruir ?? true;
    const v = resolver(color);
    const w = this.ancho;
    const h = this.alto;
    const ocupado = this.mapaOcupacion();

    // Desplazamientos por los que se arrastra la silueta, del más cercano al más lejano.
    const pasos: Array<[number, number]> = [];
    if (extruir) {
      const n = Math.max(Math.abs(dxi), Math.abs(dyi));
      for (let k = 1; k <= n; k++) pasos.push([Math.round((dxi * k) / n), Math.round((dyi * k) / n)]);
    } else {
      pasos.push([dxi, dyi]);
    }

    // Para cada píxel de sombra, en qué paso (1 es el más cercano al objeto) lo alcanza la silueta.
    const paso = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (ocupado[y * w + x] !== 1) continue;
        pasos.forEach(([ox, oy], k) => {
          const tx = x + ox;
          const ty = y + oy;
          if (tx < 0 || ty < 0 || tx >= w || ty >= h) return;
          if (ocupado[ty * w + tx] === 1) return;
          const actual = paso[ty * w + tx] as number;
          if (actual === 0 || k + 1 < actual) paso[ty * w + tx] = k + 1;
        });
      }
    }
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const k = paso[y * w + x] as number;
        if (k === 0) continue;
        if (opciones.patron === 'degradado') {
          if (k > 1 && !usaSegundoColor('bayer50', x, y)) continue;
        } else if (opciones.patron !== undefined && !usaSegundoColor(opciones.patron, x, y)) {
          continue;
        }
        capa.poner(y * w + x, v);
      }
    }
    return capa;
  }

  private mapaOcupacion(): Uint8Array {
    const n = this.ancho * this.alto;
    const mapa = new Uint8Array(n);
    const d = this.datos;
    for (let i = 0; i < n; i++) mapa[i] = (d[i * 4 + 3] ?? 0) > 0 ? 1 : 0;
    return mapa;
  }

  // -------------------------------------------------------------------------
  // Pegar, copiar y transformar
  // -------------------------------------------------------------------------

  /**
   * Pega otro lienzo con su esquina superior izquierda en `(x, y)`.
   * `espejoH` lo pega volteado. `modo` (ver `ModoPegado`): `sobre` por defecto.
   * Pegar un lienzo sobre sí mismo está permitido (se copia antes).
   */
  pegar(otro: Lienzo, x: number, y: number, opciones: { espejoH?: boolean; modo?: ModoPegado } = {}): this {
    const origen = otro === this ? otro.copiar() : otro;
    const xi = aEntero(x, 'x');
    const yi = aEntero(y, 'y');
    const modo = opciones.modo ?? 'sobre';
    const espejo = opciones.espejoH ?? false;
    for (let sy = 0; sy < origen.alto; sy++) {
      const ty = yi + sy;
      if (ty < 0 || ty >= this.alto) continue;
      for (let sx = 0; sx < origen.ancho; sx++) {
        const tx = xi + (espejo ? origen.ancho - 1 - sx : sx);
        if (tx < 0 || tx >= this.ancho) continue;
        const valor = origen.leerEntero(sx, sy);
        const destino = ty * this.ancho + tx;
        switch (modo) {
          case 'sobre':
            if (valor !== TRANSPARENTE) this.poner(destino, valor);
            break;
          case 'reemplazar':
            this.poner(destino, valor);
            break;
          case 'debajo':
            if (valor !== TRANSPARENTE && this.leerEntero(tx, ty) === TRANSPARENTE) this.poner(destino, valor);
            break;
          case 'borrar':
            if (valor !== TRANSPARENTE) this.poner(destino, TRANSPARENTE);
            break;
        }
      }
    }
    return this;
  }

  /** Lienzo nuevo con el rectángulo `(x, y, w, h)`. Lo que caiga fuera queda vacío. */
  recortar(x: number, y: number, w: number, h: number): Lienzo {
    const nuevo = new Lienzo(aEntero(w, 'w'), aEntero(h, 'h'));
    const xi = aEntero(x, 'x');
    const yi = aEntero(y, 'y');
    for (let sy = 0; sy < nuevo.alto; sy++) {
      for (let sx = 0; sx < nuevo.ancho; sx++) {
        const v = this.leerEntero(xi + sx, yi + sy);
        if (v !== TRANSPARENTE) nuevo.poner(sy * nuevo.ancho + sx, v);
      }
    }
    return nuevo;
  }

  /** Copia independiente. */
  copiar(): Lienzo {
    const nuevo = new Lienzo(this.ancho, this.alto);
    nuevo.datos.set(this.datos);
    return nuevo;
  }

  /** Lienzo nuevo volteado de izquierda a derecha. */
  voltearH(): Lienzo {
    const nuevo = new Lienzo(this.ancho, this.alto);
    for (let y = 0; y < this.alto; y++) {
      for (let x = 0; x < this.ancho; x++) {
        const v = this.leerEntero(this.ancho - 1 - x, y);
        if (v !== TRANSPARENTE) nuevo.poner(y * this.ancho + x, v);
      }
    }
    return nuevo;
  }

  /** Lienzo nuevo volteado de arriba abajo. */
  voltearV(): Lienzo {
    const nuevo = new Lienzo(this.ancho, this.alto);
    for (let y = 0; y < this.alto; y++) {
      for (let x = 0; x < this.ancho; x++) {
        const v = this.leerEntero(x, this.alto - 1 - y);
        if (v !== TRANSPARENTE) nuevo.poner(y * this.ancho + x, v);
      }
    }
    return nuevo;
  }

  /**
   * Lienzo nuevo con colores cambiados. `mapa` puede ser un objeto o un `Map`
   * de color de origen a color de destino (hex o nombre de paleta; `null` borra),
   * o una función `(hex) => color | undefined` (`undefined` deja el color igual).
   * Los colores que no están en el mapa no cambian.
   * Para pasar de una rampa a otra mira `mapaEntreRampas`.
   */
  recolorear(
    mapa: Readonly<Record<string, ColorEntrada>> | ReadonlyMap<string, ColorEntrada> | ((hex: string) => ColorEntrada | undefined),
  ): Lienzo {
    let buscar: (hex: string) => ColorEntrada | undefined;
    if (typeof mapa === 'function') {
      buscar = mapa;
    } else {
      const tabla = new Map<number, ColorEntrada>();
      const entradas: Iterable<[string, ColorEntrada]> = mapa instanceof Map ? mapa.entries() : Object.entries(mapa);
      for (const [origen, destino] of entradas) tabla.set(resolver(origen), destino);
      buscar = (hex) => tabla.get(Number.parseInt(hex.slice(1), 16));
    }
    const nuevo = this.copiar();
    const cache = new Map<number, number | undefined>();
    for (let p = 0; p < this.ancho * this.alto; p++) {
      const v = this.leerEntero(p % this.ancho, Math.floor(p / this.ancho));
      if (v === TRANSPARENTE) continue;
      let cambio = cache.get(v);
      if (!cache.has(v)) {
        const destino = buscar(enteroAHex(v));
        cambio = destino === undefined ? undefined : resolver(destino);
        cache.set(v, cambio);
      }
      if (cambio !== undefined) nuevo.poner(p, cambio);
    }
    return nuevo;
  }

  /** Lienzo nuevo ampliado `n` veces sin suavizado (cada píxel pasa a ser un bloque de n x n). */
  escalar(n: number): Lienzo {
    const k = aEntero(n, 'n');
    if (k < 1) throw new RangeError(`La escala debe ser un entero de 1 en adelante, y se recibió ${n}.`);
    const nuevo = new Lienzo(this.ancho * k, this.alto * k);
    for (let y = 0; y < this.alto; y++) {
      for (let x = 0; x < this.ancho; x++) {
        const v = this.leerEntero(x, y);
        if (v === TRANSPARENTE) continue;
        for (let j = 0; j < k; j++) {
          for (let i = 0; i < k; i++) nuevo.poner((y * k + j) * nuevo.ancho + x * k + i, v);
        }
      }
    }
    return nuevo;
  }

  /** Lienzo nuevo con este repetido `nx` veces a lo ancho y `ny` a lo alto. Sirve para revisar que un tile no tenga costuras. */
  mosaico(nx: number, ny: number): Lienzo {
    const cx = aEntero(nx, 'nx');
    const cy = aEntero(ny, 'ny');
    const nuevo = new Lienzo(this.ancho * cx, this.alto * cy);
    for (let j = 0; j < cy; j++) {
      for (let i = 0; i < cx; i++) nuevo.pegar(this, i * this.ancho, j * this.alto, { modo: 'reemplazar' });
    }
    return nuevo;
  }

  /** Lienzo nuevo corrido `(dx, dy)` con vuelta al otro lado (envolvente). Sirve para dibujar y probar tiles sin costuras. */
  desplazar(dx: number, dy: number): Lienzo {
    const sx = aEntero(dx, 'dx');
    const sy = aEntero(dy, 'dy');
    const nuevo = new Lienzo(this.ancho, this.alto);
    for (let y = 0; y < this.alto; y++) {
      for (let x = 0; x < this.ancho; x++) {
        const tx = (((x + sx) % this.ancho) + this.ancho) % this.ancho;
        const ty = (((y + sy) % this.alto) + this.alto) % this.alto;
        const v = this.leerEntero(x, y);
        if (v !== TRANSPARENTE) nuevo.poner(ty * this.ancho + tx, v);
      }
    }
    return nuevo;
  }

  // -------------------------------------------------------------------------
  // Consulta
  // -------------------------------------------------------------------------

  /** El rectángulo mínimo que contiene todos los píxeles visibles, o `null` si el lienzo está vacío. */
  cajaOpaca(): Marco | null {
    let x0 = this.ancho;
    let y0 = this.alto;
    let x1 = -1;
    let y1 = -1;
    for (let y = 0; y < this.alto; y++) {
      for (let x = 0; x < this.ancho; x++) {
        if ((this.datos[(y * this.ancho + x) * 4 + 3] ?? 0) === 0) continue;
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
    return x1 < 0 ? null : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
  }

  /** Cuántos píxeles visibles hay. */
  contarOpacos(): number {
    let total = 0;
    for (let i = 3; i < this.datos.length; i += 4) if ((this.datos[i] ?? 0) > 0) total++;
    return total;
  }

  /** Histograma de colores visibles: `#RRGGBB` a cantidad de píxeles, del más usado al menos usado. */
  colores(): Map<string, number> {
    const cuenta = new Map<string, number>();
    for (let p = 0; p < this.ancho * this.alto; p++) {
      const v = this.leerEntero(p % this.ancho, Math.floor(p / this.ancho));
      if (v === TRANSPARENTE) continue;
      const hex = enteroAHex(v);
      cuenta.set(hex, (cuenta.get(hex) ?? 0) + 1);
    }
    return new Map([...cuenta.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)));
  }

  /** ¿Tienen las mismas medidas y los mismos píxeles? */
  igual(otro: Lienzo): boolean {
    if (otro.ancho !== this.ancho || otro.alto !== this.alto) return false;
    for (let i = 0; i < this.datos.length; i++) if (this.datos[i] !== otro.datos[i]) return false;
    return true;
  }

  /** Huella de 10 caracteres hex (sha1 de medidas y píxeles). Sirve para comparar resultados y probar determinismo. */
  huella(): string {
    return createHash('sha1')
      .update(`${this.ancho}x${this.alto}:`)
      .update(this.datos)
      .digest('hex')
      .slice(0, 10);
  }

  /**
   * Vuelca el lienzo a una cuadrícula de texto (lo inverso de `desdeTexto`)
   * para mirarlo en la terminal o escribir pruebas. Asigna a cada color una
   * letra por orden de aparición. Devuelve las filas y la leyenda usada.
   */
  aTexto(): { lineas: string[]; leyenda: Record<string, string> } {
    const letras = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const letraDe = new Map<string, string>();
    const leyenda: Record<string, string> = {};
    const lineas: string[] = [];
    for (let y = 0; y < this.alto; y++) {
      let fila = '';
      for (let x = 0; x < this.ancho; x++) {
        const hex = this.leerHex(x, y);
        if (hex === null) {
          fila += '.';
          continue;
        }
        let letra = letraDe.get(hex);
        if (letra === undefined) {
          letra = letras[letraDe.size] ?? '?';
          letraDe.set(hex, letra);
          leyenda[letra] = hex;
        }
        fila += letra;
      }
      lineas.push(fila);
    }
    return { lineas, leyenda };
  }
}
