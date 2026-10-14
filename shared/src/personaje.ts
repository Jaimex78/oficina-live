import type { ColeccionId, Direccion, MarcoAtlas } from './arte';
import type { MascotaSpec } from './mascota';

/**
 * Contrato de los personajes personalizables.
 * Cada parte (cuerpo, ropa, pelo, accesorios) se dibuja como un cuadro completo de 32x64 y se apila.
 * El color sale de recolorear marcadores (ver marcadores del pipeline): una forma pintada sirve para muchos colores.
 */

export const PERSONAJE_ANCHO = 32;
export const PERSONAJE_ALTO = 64;

/** Orden de las direcciones en la hoja de animación: frente, izquierda, derecha, espalda. */
export const DIRECCIONES_PERSONAJE: readonly Direccion[] = ['S', 'O', 'E', 'N'];

/**
 * Cuadros por dirección (los 8 de la hoja del personaje v5):
 *  0 = quieto, 1 a 4 = ciclo de caminar (contacto A, paso A, contacto B, paso B), 5 = sentado,
 *  6 = quieto con el ojo medio cerrado (parpadeo), 7 = sentado con el ojo medio cerrado.
 * Solo el cuerpo (la capa `cuerpo`, que lleva los ojos) trae los 8; las demás partes animadas traen 6 y usan el 0 o el 5 en los de parpadeo.
 */
export const CUADROS = { quieto: 0, pasoA: 1, pasoB: 3, caminar0: 1, sentado: 5, parpadeoQuieto: 6, parpadeoSentado: 7 } as const;
/** Columnas de la hoja armada de un personaje. */
export const CUADROS_HOJA = 8;
/** Cuántos cuadros tiene una parte animada (sin los de parpadeo) y cuántos el cuerpo. */
export const CUADROS_PARTE_ANIMADA = 6;
export const CICLO_CAMINAR = [1, 2, 3, 4] as const;

/**
 * Las capas que no se mueven al caminar (peinado, gafas, sombrero) bajan estos píxeles en cada cuadro para acompañar a la cabeza del cuerpo:
 * en los pasos la cabeza sube una fila (-1). Al sentarse la cabeza no se mueve.
 */
export const REBOTE: readonly number[] = [0, 0, -1, 0, -1, 0, 0, 0];

/** El rebote de las partes estáticas de PERFIL (E y O): igual que el frente, los 4 cuadros de caminar mueven la cabeza igual en las 4 direcciones. */
export const REBOTE_PERFIL: readonly number[] = [0, 0, -1, 0, -1, 0, 0, 0];

/** Cuántas filas baja una parte estática en un cuadro, según la dirección. */
export const reboteDe = (dir: Direccion, cuadro: number): number => ((dir === 'E' || dir === 'O' ? REBOTE_PERFIL : REBOTE)[cuadro] ?? 0);

/**
 * De atrás hacia adelante. Cada parte pertenece a una capa.
 * `atras` va detrás del cuerpo (capas, colas, alas, el respaldo de una silla de ruedas) y `delante` va
 * por encima de todo (la rueda cercana de una silla, el manubrio de un scooter).
 * `chaqueta` (blazer, abrigo, chaleco) va sobre la prenda de arriba y debajo del cuello y de la barba.
 * `cuello` es lo que se pone sobre la ropa (bufanda, mochila, collar).
 * `barba` (vello facial) va sobre la piel, la ropa y el cuello, y debajo del pelo, de las gafas y de lo que va en la cabeza.
 * `cara` es para las gafas y `cabeza` para los sombreros.
 */
export const CAPAS_PERSONAJE = ['sombra', 'atras', 'cuerpo', 'zapatos', 'abajo', 'arriba', 'chaqueta', 'cuello', 'barba', 'pelo', 'cara', 'cabeza', 'delante'] as const;
export type CapaPersonaje = (typeof CAPAS_PERSONAJE)[number];

/** Material recoloreable (los 8 slots de marcadores del pipeline). */
export const SLOTS_COLOR = ['piel', 'cabello', 'ropaA', 'ropaB', 'pantalon', 'zapatos', 'accA', 'accB'] as const;
export type SlotColor = (typeof SLOTS_COLOR)[number];

/** Rampa de 5 tonos, del más oscuro (contorno y sombra profunda) al brillo. */
export type Rampa5 = readonly [string, string, string, string, string];

export interface OpcionColor {
  id: string;
  nombre: string;
  rampa: Rampa5;
}

/** Subcarpetas de los accesorios: las categorías Sombrero, Gafas y Otro del editor (la v4 renombró `otros` a `otro`). */
export const CARPETAS_ACCESORIO = [
  { id: 'sombrero', nombre: 'Sombrero' },
  { id: 'gafas', nombre: 'Gafas' },
  { id: 'otro', nombre: 'Otro' },
] as const;
export type CarpetaAccesorio = (typeof CARPETAS_ACCESORIO)[number]['id'];

export interface ParteCatalogo {
  id: string;
  nombre: string;
  capa: CapaPersonaje;
  /** Slots de color que usa esta parte (para mostrar los selectores justos). */
  slots: SlotColor[];
  /**
   * Id de frame por dirección y cuadro: frames['S'][0]. Las partes estáticas (pelo, gafas, sombrero) traen
   * solo el cuadro 0 y se reutilizan en los demás con REBOTE. Las animadas traen 6 cuadros y el cuerpo 8 (con los de parpadeo).
   */
  frames: Partial<Record<Direccion, string[]>>;
  /**
   * Cuadros de una capa compañera que va DETRÁS del cuerpo (capa `atras`): la melena que cae por la espalda, la mochila vista de frente, la capa.
   * Mismas reglas que `frames` (un cuadro por dirección si es estática, 6 si se anima). Falta si la parte no trae nada detrás.
   */
  atras?: Partial<Record<Direccion, string[]>>;
  /** Etiquetas de búsqueda y de grupo («gafas», «gorra», «formal»…). */
  etiquetas: string[];
  /** Solo en los accesorios: la subcarpeta donde se muestra (`sombrero`, `gafas`, `otro`). */
  carpeta?: CarpetaAccesorio;
  /**
   * Solo en los sombreros: el peinado no se ve por encima de esta fila del cuadro (el sombrero lo cubre).
   * Las filas de abajo (patillas, melena, la nuca) se siguen viendo. Sin este campo el peinado se dibuja entero.
   */
  ocultaPeloSobre?: number;
  /**
   * Ropa premium: solo la elige quien tiene el paquete «Ropa premium» (la administración lo asigna). Lo básico no lleva este campo.
   * Quien ya lleva puesta una parte premium la conserva: el paquete solo controla lo que se puede elegir.
   */
  premium?: boolean;
}

/**
 * Un disfraz es un traje completo. Reemplaza la prenda de arriba, la de abajo y los zapatos del avatar
 * (el cuerpo y la piel se ven donde el disfraz los deja ver; la cara siempre se ve salvo en las máscaras).
 * Se arma con varias partes, cada una en su capa: el traje (animado, capa `arriba`), la cabeza o la máscara
 * (estática, capa `cabeza` o `cara`) y lo que va detrás del cuerpo (capa `atras`, una capa o una cola).
 */
export interface DisfrazCatalogo {
  id: string;
  nombre: string;
  coleccion: ColeccionId;
  /** El disfraz trae su propia cabeza: no se dibuja el peinado. */
  ocultaPelo: boolean;
  /** El disfraz no deja dibujar ningún accesorio (gafas, sombreros, mochila…). */
  ocultaAccesorios: boolean;
  /** El disfraz trae su propio sombrero: no se dibujan los accesorios de la capa `cabeza`. */
  ocultaCabeza?: boolean;
  /** El disfraz tapa la cara (máscara, cabeza de animal, vendas): no se dibuja la barba. Falta en los catálogos anteriores a la v3. */
  ocultaBarba?: boolean;
  /** Slots de color propios del disfraz (`ropaA` y `ropaB`). Sus partes también pueden usar la `piel` del avatar. */
  slots: SlotColor[];
  /** Ids de `colores` con los que se ve el disfraz si la persona no elige otros. */
  porDefecto: { color: string; color2?: string };
  etiquetas: string[];
  partes: ParteCatalogo[];
}

/**
 * Una ayuda de movilidad o un vehículo (patineta, scooter, silla de ruedas). Se dibuja bajo y alrededor del
 * personaje y puede cambiar su postura: `elevacion` sube al personaje (está parado sobre la patineta) y
 * `cuadroCuerpo` dice qué cuadro del cuerpo se usa en cada cuadro (la silla de ruedas deja al personaje sentado).
 * Las partes de la ayuda siguen el cuadro pedido (las ruedas giran).
 */
export interface MovilidadCatalogo {
  id: string;
  nombre: string;
  /** Slots de color de la ayuda (`accA`). */
  slots: SlotColor[];
  /** Id de `colores` con el que se ve si la persona no elige otro. */
  porDefecto: string;
  /** Píxeles que sube todo el personaje, por cuadro de la hoja (8). */
  elevacion: readonly number[];
  /** Cuadro de animación del cuerpo, la ropa y los zapatos que se usa en cada cuadro pedido. */
  cuadroCuerpo: readonly (0 | 1 | 2 | 3 | 4 | 5 | 6 | 7)[];
  etiquetas: string[];
  partes: ParteCatalogo[];
}

export interface CatalogoPersonaje {
  version: 1;
  archivo: string;
  huella: string;
  ancho: number;
  alto: number;
  frames: Record<string, MarcoAtlas>;
  /** Tabla exacta de marcadores (slot -> 5 colores hex) que el navegador cambia por la rampa elegida. */
  marcadores: Record<SlotColor, readonly string[]>;
  pieles: OpcionColor[];
  pelos: OpcionColor[];
  /** Colores de ropa y accesorios que se pueden elegir (16 en la v4). */
  colores: OpcionColor[];
  /** Los cuerpos: en la v4 son las 5 variantes de cara de la categoría Piel (lisa, con pecas, con manchas...). */
  cuerpos: ParteCatalogo[];
  peinados: ParteCatalogo[];
  arriba: ParteCatalogo[];
  /** Chaquetas (capa `chaqueta`, sobre `arriba`). Falta en los catálogos anteriores a la v4. */
  chaquetas?: ParteCatalogo[];
  abajo: ParteCatalogo[];
  zapatos: ParteCatalogo[];
  accesorios: ParteCatalogo[];
  /** Disfraces (trajes completos de Halloween, Navidad y demás fiestas). Falta en los catálogos de la v1. */
  especiales: DisfrazCatalogo[];
  /** Patineta, scooter y silla de ruedas. Falta en los catálogos de la v1. */
  movilidad: MovilidadCatalogo[];
  /**
   * Barbas y vello facial (capa `barba`, un cuadro por dirección, slot `cabello`). Se ven de frente y de lado: de espaldas
   * no traen cuadro. Usan los colores de `pelos`. Falta en los catálogos anteriores a la v3.
   */
  barbas?: ParteCatalogo[];
}

/** Las 12 categorías del editor, en su orden: las 11 de Gather y «Mascota» al final (extra propio). La interfaz las muestra con estos nombres. */
export const CATEGORIAS_EDITOR = [
  { id: 'piel', nombre: 'Piel' },
  { id: 'cabello', nombre: 'Cabello' },
  { id: 'vello', nombre: 'Vello facial' },
  { id: 'arriba', nombre: 'Arriba' },
  { id: 'chaqueta', nombre: 'Chaqueta' },
  { id: 'abajo', nombre: 'Abajo' },
  { id: 'zapatos', nombre: 'Zapatos' },
  { id: 'sombrero', nombre: 'Sombrero' },
  { id: 'gafas', nombre: 'Gafas' },
  { id: 'otro', nombre: 'Otro' },
  { id: 'disfraz', nombre: 'Disfraz' },
  { id: 'mascota', nombre: 'Mascota' },
] as const;
export type CategoriaEditor = (typeof CATEGORIAS_EDITOR)[number]['id'];

/** Lo que se guarda por persona: ids elegidos, nunca imágenes. El servidor lo valida contra el catálogo. */
export interface AvatarSpec {
  v: 1;
  cuerpo: string;
  piel: string;
  peinado: string;
  pelo: string;
  arriba: string;
  colorArriba: string;
  /** Segundo color de la prenda de arriba (cuello, mangas, estampado), si la prenda lo usa. */
  colorArriba2: string;
  /** Chaqueta opcional (capa `chaqueta`, sobre la prenda de arriba). `color` es un id de `colores`. */
  chaqueta?: { id: string; color: string };
  abajo: string;
  colorAbajo: string;
  zapatos: string;
  colorZapatos: string;
  accesorios: { id: string; color: string; color2?: string }[];
  /** Disfraz opcional: reemplaza arriba, abajo y zapatos. Los colores faltantes son los del disfraz. */
  especial?: { id: string; color?: string; color2?: string };
  /** Ayuda de movilidad opcional. */
  movilidad?: { id: string; color?: string };
  /**
   * Barba opcional. `color` es un id de `pelos`: si viene vacío o no existe, la barba toma el color del pelo del personaje.
   * Un disfraz con `ocultaBarba` la oculta.
   */
  barba?: { id: string; color: string };
  /**
   * Mascota opcional: acompaña al personaje. Nadie la tiene por defecto: hace falta un paquete de mascotas que asigna la
   * administración. No cambia el dibujo del personaje (por eso no entra en `claveAvatar`).
   */
  mascota?: MascotaSpec;
}

export const MAX_ACCESORIOS = 4;
