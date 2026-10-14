import type { GrupoId } from './grupos';
import { idFrame, type CapaObjeto, type CategoriaId, type ColeccionId, type Emisor, type Interaccion, type ObjetoCatalogo, type Orientacion, type VarianteObjeto } from './arte';

/**
 * Piezas para definir objetos del inventario: la función `def`, las listas de orientaciones y de variantes, y el
 * atajo de luces. Viven aquí (y no en `inventario.ts`) para que cada lote nuevo pueda definir sus objetos en su propio
 * archivo de `inventario-lotes/` sin importaciones circulares. Ver `arte/GUIA-OBJETOS-V2.md`.
 *
 * Convención de huella: `ancho`, `alto` y `bloquea` describen la orientación «S» (de frente).
 * En «N» se giran 180 grados; en «E» y «O» se giran 90 grados y se transponen (ver `huellaDe`).
 * Vista 3/4: el dibujo mide `ancho * 32` de ancho y `alto * 32 + sobresale` de alto, anclado a la esquina inferior izquierda.
 */

export const U: Orientacion[] = ['U'];
export const CUATRO: Orientacion[] = ['S', 'E', 'N', 'O'];
export const HV: Orientacion[] = ['S', 'E'];
export const MURO: Orientacion[] = ['S', 'E', 'O'];

export const COLORES_VARIANTE: Record<string, VarianteObjeto> = {
  base: { id: 'base', nombre: 'Original', muestra: '#8E8E93' },
  gris: { id: 'gris', nombre: 'Gris', muestra: '#9A9AA0' },
  rojo: { id: 'rojo', nombre: 'Rojo coral', muestra: '#EF3B3A' },
  negro: { id: 'negro', nombre: 'Negro', muestra: '#1C1C1E' },
  blanco: { id: 'blanco', nombre: 'Blanco', muestra: '#F2F2F7' },
  madera: { id: 'madera', nombre: 'Madera', muestra: '#B9854F' },
  verde: { id: 'verde', nombre: 'Verde', muestra: '#3E8E5A' },
  azul: { id: 'azul', nombre: 'Azul', muestra: '#3B6FB6' },
  amarillo: { id: 'amarillo', nombre: 'Amarillo', muestra: '#E8B83B' },
  naranja: { id: 'naranja', nombre: 'Naranja', muestra: '#E27D3A' },
  morado: { id: 'morado', nombre: 'Morado', muestra: '#9B79DA' },
};

export function todas(ancho: number, alto: number): [number, number][] {
  const r: [number, number][] = [];
  for (let y = 0; y < alto; y++) for (let x = 0; x < ancho; x++) r.push([x, y]);
  return r;
}

export interface Def {
  id: string;
  nombre: string;
  categoria: CategoriaId;
  etiquetas?: string[];
  ancho?: number;
  alto?: number;
  /** 'todo' bloquea toda la huella; 'nada' deja pasar; o una lista de casillas. */
  bloquea?: 'todo' | 'nada' | [number, number][];
  sobresale?: number;
  capa?: CapaObjeto;
  orientaciones?: Orientacion[];
  variantes?: string[];
  interaccion?: Interaccion;
  emisor?: Emisor;
  ventana?: boolean;
  apoyado?: boolean;
  montado?: boolean;
  pared?: 'muro' | 'abertura';
  autotile?: 'paredes4';
  /** Lote de producción de arte (cualquier número). Ver `inventario-lotes/` y `arte/GUIA-OBJETOS-V2.md`. */
  lote?: number;
  /** Reemplazado por otro objeto: sigue dibujándose para los mapas guardados, pero el catálogo del editor lo oculta. */
  obsoleto?: boolean;
  /** Id del objeto que lo reemplaza (solo con `obsoleto`). */
  reemplazadoPor?: string;
  coleccion?: ColeccionId;
  /** Pestaña del panel del editor, solo si la regla por categoría no la acierta. */
  grupo?: GrupoId;
}

export function def(d: Def): ObjetoCatalogo {
  const ancho = d.ancho ?? 1;
  const alto = d.alto ?? 1;
  const bloquea = d.bloquea === 'nada' ? [] : Array.isArray(d.bloquea) ? d.bloquea : todas(ancho, alto);
  const variantes = (d.variantes ?? ['base']).map((v) => COLORES_VARIANTE[v] ?? { id: v, nombre: v });
  const base: ObjetoCatalogo = {
    id: d.id,
    nombre: d.nombre,
    categoria: d.categoria,
    etiquetas: d.etiquetas ?? [],
    ancho,
    alto,
    bloquea,
    sobresale: d.sobresale ?? 0,
    capa: d.capa ?? 'objeto',
    orientaciones: d.orientaciones ?? U,
    variantes,
    frames: {},
    interaccion: d.interaccion ?? 'ninguna',
    lote: d.lote ?? 2,
  };
  if (d.autotile) base.autotile = d.autotile;
  if (d.emisor) base.emisor = d.emisor;
  if (d.ventana) base.ventana = { lado: 'S', abertura: 1 };
  if (d.apoyado) base.apoyado = true;
  if (d.montado) base.montado = true;
  if (d.pared) base.pared = d.pared;
  if (d.coleccion) base.coleccion = d.coleccion;
  if (d.grupo) base.grupo = d.grupo;
  if (d.obsoleto) base.obsoleto = true;
  if (d.reemplazadoPor) base.reemplazadoPor = d.reemplazadoPor;
  base.frames = framesDe(base);
  return base;
}

/** Las 16 máscaras de vecinos N, E, S, O. */
export const MASCARAS_PARED: readonly string[] = Array.from({ length: 16 }, (_, i) => [8, 4, 2, 1].map((b) => ((i & b) !== 0 ? '1' : '0')).join(''));

/** Frames esperados de un objeto, con el id canónico. El pipeline de arte debe producir exactamente estos. */
export function framesDe(o: Pick<ObjetoCatalogo, 'id' | 'orientaciones' | 'variantes' | 'autotile'>): Record<string, Record<string, string>> {
  const claves: readonly string[] = o.autotile === 'paredes4' ? MASCARAS_PARED : o.orientaciones;
  const salida: Record<string, Record<string, string>> = {};
  for (const k of claves) {
    const porVariante: Record<string, string> = {};
    for (const v of o.variantes) porVariante[v.id] = idFrame(o.id, k, v.id);
    salida[k] = porVariante;
  }
  return salida;
}

export const luz = (color: string, radio: number, intensidad: number, modo: 'siempre' | 'noche' = 'noche', parpadeo = false): Emisor => ({ color, radio, intensidad, modo, ...(parpadeo ? { parpadeo } : {}) });
export const CALIDA = '#FFD79A';
export const PANTALLA = '#9CC8FF';

export const SILLA = ['base', 'rojo', 'negro', 'blanco'];
export const TELA = ['base', 'rojo', 'azul', 'verde', 'amarillo', 'negro'];
export const MADERAS = ['base', 'madera', 'blanco', 'negro'];
export const TELA2 = ['base', 'rojo', 'azul', 'verde', 'amarillo', 'negro', 'morado'];

