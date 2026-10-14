/**
 * Contrato de la biblioteca de arte: lo que el pipeline de arte publica y lo que el mundo, el editor y el servidor leen.
 * Casilla de 32 px. Vista desde arriba con leve ángulo (3/4).
 */

import type { GrupoId } from './grupos';

export const CASILLA = 32;

export const DIRECCIONES = ['N', 'E', 'S', 'O'] as const;
export type Direccion = (typeof DIRECCIONES)[number];
/** «U» = única: el objeto no tiene versiones por dirección. */
export type Orientacion = Direccion | 'U';

/** Cómo se acomoda quien se sienta: ver `ObjetoCatalogo.sentado` y `sentado.ts`. */
export interface DatosSentadoParcial {
  dx?: number;
  dy?: number;
  /** Banda de la imagen del asiento que se vuelve a dibujar por delante de la persona, en filas contadas desde el borde de ABAJO: [desde, hasta] con desde > hasta (0 es el borde de abajo); `null` = ninguna. */
  corte?: readonly [number, number] | null;
  pose?: Direccion;
}

export const CATEGORIAS_OBJETO = [
  { id: 'pisos', nombre: 'Pisos' },
  { id: 'paredes', nombre: 'Paredes, ventanas y puertas' },
  { id: 'puestos', nombre: 'Puestos de trabajo' },
  { id: 'asientos', nombre: 'Sillas y asientos' },
  { id: 'mesas', nombre: 'Mesas' },
  { id: 'tecnologia', nombre: 'Tecnología' },
  { id: 'colaboracion', nombre: 'Colaboración' },
  { id: 'cocina', nombre: 'Cocina y descanso' },
  { id: 'decoracion', nombre: 'Decoración' },
  { id: 'temporada', nombre: 'Temporada y eventos' },
  { id: 'exterior', nombre: 'Exterior' },
  { id: 'juegos', nombre: 'Juegos y ocio' },
  { id: 'banos', nombre: 'Baños' },
] as const;
export type CategoriaId = (typeof CATEGORIAS_OBJETO)[number]['id'];

/** Subcarpetas de «Temporada y eventos»: una por fiesta del año. */
export const COLECCIONES = [
  { id: 'halloween', nombre: 'Halloween' },
  { id: 'navidad', nombre: 'Navidad' },
  { id: 'amor-amistad', nombre: 'Amor y Amistad' },
  { id: 'ano-nuevo', nombre: 'Año Nuevo' },
  { id: 'colombia', nombre: 'Fiestas de Colombia' },
  { id: 'pascua', nombre: 'Semana Santa y Pascua' },
  { id: 'cumpleanos', nombre: 'Cumpleaños y fiestas' },
] as const;
export type ColeccionId = (typeof COLECCIONES)[number]['id'];

/**
 * Dónde se dibuja:
 * - piso: la capa de baldosas, una por casilla (1x1), debajo de todo.
 * - suelo: plano sobre el piso (alfombras, marcas), debajo de objetos y personas.
 * - objeto: se ordena por su borde inferior junto con las personas (se pasa por detrás o por delante).
 * - sobre: siempre encima de las personas (lámparas colgantes, ramas, techos).
 */
export type CapaObjeto = 'piso' | 'suelo' | 'objeto' | 'sobre';

export type Interaccion = 'ninguna' | 'sentarse' | 'enlace' | 'nota' | 'imagen' | 'incrustado' | 'teams' | 'puerta' | 'portal';

/** Luz propia del objeto (lámparas, pantallas, letreros). Con las luces apagadas (modo oscuro) deja un charco de luz. */
export interface Emisor {
  color: string;
  /** Alcance en casillas. */
  radio: number;
  /** 0 a 1. */
  intensidad: number;
  /** «noche»: solo se nota con las luces apagadas. «siempre»: también de día (por ejemplo una pantalla). */
  modo: 'siempre' | 'noche';
  parpadeo?: boolean;
  /** Centro de la luz en píxeles desde la esquina superior izquierda del objeto. Por defecto, su centro. */
  centro?: { x: number; y: number };
}

/** Abertura que deja entrar el día: con las luces encendidas (modo claro) proyecta claridad sobre el piso. */
export interface VentanaLuz {
  /** Lado de la oficina al que da la ventana. */
  lado: Direccion;
  /** Casillas de luz que deja pasar. */
  abertura: number;
}

export interface VarianteObjeto {
  id: string;
  nombre: string;
  /** Color de muestra para el selector. */
  muestra?: string;
}

export interface MarcoAtlas {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ObjetoCatalogo {
  /** Estable: lo guardan los mapas. Minúsculas con guiones: `silla-oficina`. */
  id: string;
  nombre: string;
  categoria: CategoriaId;
  etiquetas: string[];
  /** Tamaño de la huella en casillas. */
  ancho: number;
  alto: number;
  /** Casillas que bloquean el paso, como desplazamientos [dx, dy] desde la esquina superior izquierda. Vacío = se puede atravesar. */
  bloquea: [number, number][];
  /** Píxeles que el dibujo sube por encima de su huella (objetos altos). */
  sobresale: number;
  capa: CapaObjeto;
  /** ['U'] o las direcciones disponibles. En paredes con autotile no se usa: ver `autotile`. */
  orientaciones: Orientacion[];
  /** Siempre al menos una: `base`. */
  variantes: VarianteObjeto[];
  /**
   * Id de frame del atlas por orientación (o por máscara, si hay autotile) y variante.
   * Ejemplo: frames['S']['rojo'] = 'silla-oficina@S~rojo'.
   */
  frames: Record<string, Record<string, string>>;
  /** 'paredes4': las claves de `frames` son máscaras de 4 vecinos N,E,S,O (por ejemplo '1010'). */
  autotile?: 'paredes4';
  interaccion: Interaccion;
  /**
   * Para `sentarse`: casilla del asiento y hacia dónde mira quien se sienta.
   * Si falta, toda casilla de la huella es un asiento y se mira hacia la orientación del objeto.
   */
  asiento?: { dx: number; dy: number; mira: Direccion };
  /**
   * Para `sentarse`: ajuste fino de cómo se ve quien se sienta, por orientación (los valores por defecto salen de la familia del asiento,
   * ver `sentado.ts`). `dx` y `dy` mueven los pies respecto del centro de la casilla (24 px bajo su borde de arriba), `corte` es la banda de filas
   * de la imagen del asiento [desde, hasta) que se dibuja POR DELANTE de la persona (respaldo de espaldas, borde del cojín y apoyabrazos de frente)
   * y `pose` la vista del personaje que se usa (por defecto la de la orientación). Todo opcional.
   */
  sentado?: Partial<Record<Orientacion, DatosSentadoParcial>>;
  emisor?: Emisor;
  ventana?: VentanaLuz;
  /** Se coloca encima de otro objeto (un monitor sobre el escritorio): puede ocupar casillas ya ocupadas y nunca bloquea. */
  apoyado?: boolean;
  /** Va sobre la cara de una pared (cuadros, relojes, pantallas de pared): exige pared bajo su huella. La orientación elige la cara. */
  montado?: boolean;
  /**
   * Pieza de la línea de pared. Solo una por casilla.
   * - `muro`: pared que se une con las vecinas (autotile) o divisor.
   * - `abertura`: ventana, puerta o arco dentro de la línea: reemplaza al muro de esa casilla y los muros vecinos se unen a ella.
   */
  pared?: 'muro' | 'abertura';
  /**
   * Lote de producción de arte. 1 es lo imprescindible, 2 el resto del inventario base, 3 pisos, juegos y objetos pequeños de estilo similar,
   * 4 equipo gamer, PlayStation y baños, 5 el ocio (billar, dardos, música, karts), 6 las fiestas del año, 7 los primeros puestos de trabajo
   * y 8 en adelante los lotes del molde Gather v2 (puede ser cualquier número; el atlas del lote N se llama `objetos-v(N+1)`).
   */
  lote: number;
  /** Reemplazado por otro objeto: sigue en el inventario (y se dibuja) para que los mapas guardados no se rompan, pero el catálogo del editor lo oculta. */
  obsoleto?: boolean;
  /** Id del objeto que lo reemplaza (solo con `obsoleto`). */
  reemplazadoPor?: string;
  /** Subcarpeta dentro de la categoría (por ahora, las fiestas del año en «temporada»). */
  coleccion?: ColeccionId;
  /** Pestaña del panel de objetos del editor. Si falta, se deduce de la categoría (ver `grupoDe` en `grupos.ts`). */
  grupo?: GrupoId;
}

export interface CatalogoObjetos {
  version: 1;
  archivo: string;
  huella: string;
  ancho: number;
  alto: number;
  frames: Record<string, MarcoAtlas>;
  objetos: ObjetoCatalogo[];
}

/** Id de frame canónico. El pipeline lo genera y el motor lo lee tal cual desde `ObjetoCatalogo.frames`. */
export function idFrame(objeto: string, orientacion: string, variante: string): string {
  const o = orientacion === 'U' ? '' : `@${orientacion}`;
  const v = variante === 'base' ? '' : `~${variante}`;
  return `${objeto}${o}${v}`;
}

/** Máscara de vecinos para paredes: N, E, S, O (1 = hay pared conectada). */
export function mascaraVecinos(n: boolean, e: boolean, s: boolean, o: boolean): string {
  return `${n ? 1 : 0}${e ? 1 : 0}${s ? 1 : 0}${o ? 1 : 0}`;
}

export const OPUESTA: Record<Direccion, Direccion> = { N: 'S', S: 'N', E: 'O', O: 'E' };

/** Rota una dirección 90 grados en sentido horario. */
export function girar(d: Direccion): Direccion {
  return d === 'N' ? 'E' : d === 'E' ? 'S' : d === 'S' ? 'O' : 'N';
}
