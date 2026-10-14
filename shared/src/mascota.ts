import type { Direccion, MarcoAtlas } from './arte';
import type { Rampa5, SlotColor } from './personaje';

/**
 * Contrato de las mascotas: criaturas pequeñas que acompañan al personaje (un extra propio, Gather no las tiene).
 * Cada mascota se dibuja en un cuadro de 32 x 32 con los pies en la fila 31 (la figura mide hasta 24 x 24), 4 direcciones y
 * 4 cuadros: 0 quieto, 1 paso A, 2 paso B y 3 sentada o dormida. El color sale de recolorear los marcadores `accA` y `accB`.
 * La persona solo guarda ids (`MascotaSpec`); el servidor los valida contra el catálogo y contra sus paquetes.
 */

export const MASCOTA_ANCHO = 32;
export const MASCOTA_ALTO = 32;
/** Largo máximo del nombre opcional de una mascota. */
export const MAX_NOMBRE_MASCOTA = 20;

export const GRUPOS_MASCOTA = [
  { id: 'animales', nombre: 'Animales' },
  { id: 'fantasticas', nombre: 'Fantásticas' },
] as const;
export type GrupoMascota = (typeof GRUPOS_MASCOTA)[number]['id'];

export interface VarianteMascota {
  id: string;
  nombre: string;
  /** Rampas de 5 tonos que reemplazan a los marcadores `accA` (color principal) y `accB` (secundario). */
  rampas: Partial<Record<SlotColor, Rampa5>>;
}

export interface MascotaCatalogo {
  id: string;
  nombre: string;
  descripcion: string;
  grupo: GrupoMascota;
  /** Id de cuadro por dirección y cuadro: frames['S'][0]. Siempre 4 cuadros por dirección. */
  frames: Partial<Record<Direccion, string[]>>;
  variantes: VarianteMascota[];
  etiquetas: string[];
}

export interface CatalogoMascotas {
  version: 1;
  archivo: string;
  huella: string;
  ancho: number;
  alto: number;
  frames: Record<string, MarcoAtlas>;
  marcadores: Record<SlotColor, readonly string[]>;
  mascotas: MascotaCatalogo[];
}

/** Lo que se guarda por persona. `color` es el id de una variante de esa mascota; `nombre` es opcional. */
export interface MascotaSpec {
  id: string;
  color: string;
  nombre?: string;
}

export const mascotaPorId = (cat: CatalogoMascotas, id: string): MascotaCatalogo | undefined => cat.mascotas.find((m) => m.id === id);

/** Revisa una mascota contra el catálogo. Devuelve el problema en español o `null` si todo existe. */
export function validarMascota(m: MascotaSpec | undefined, cat: CatalogoMascotas): string | null {
  if (m === undefined) return null;
  if (typeof m !== 'object' || m === null || typeof m.id !== 'string' || typeof m.color !== 'string') return 'La mascota no tiene el formato correcto.';
  const def = mascotaPorId(cat, m.id);
  if (!def) return 'La mascota elegida ya no existe en el catálogo.';
  if (!def.variantes.some((v) => v.id === m.color)) return 'El color de la mascota ya no existe.';
  if (m.nombre !== undefined && (typeof m.nombre !== 'string' || m.nombre.length > MAX_NOMBRE_MASCOTA)) return `El nombre de la mascota admite hasta ${MAX_NOMBRE_MASCOTA} letras.`;
  return null;
}

/** La variante de color elegida (o la primera de la mascota). */
export function varianteDe(def: MascotaCatalogo, color: string): VarianteMascota | undefined {
  return def.variantes.find((v) => v.id === color) ?? def.variantes[0];
}

/** Texto estable de una mascota: llave para guardar en caché su hoja ya armada. */
export const claveMascota = (m: MascotaSpec): string => `${m.id}:${m.color}`;

/** Limpia el nombre de una mascota: sin espacios de más y sin caracteres de control. */
export function limpiarNombreMascota(n: unknown): string | undefined {
  if (typeof n !== 'string') return undefined;
  // eslint-disable-next-line no-control-regex
  const t = n.replace(/\s+/g, ' ').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, MAX_NOMBRE_MASCOTA);
  return t === '' ? undefined : t;
}
