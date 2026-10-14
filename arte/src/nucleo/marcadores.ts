/**
 * Marcadores de recoloreo para personajes personalizables.
 *
 * La idea: el arte base del personaje se dibuja UNA vez con colores marcador.
 * Cada marcador dice "aquí va el tono T del slot S" (por ejemplo, el tono 2
 * de la piel). Para armar a una persona concreta se cambia cada marcador por
 * el tono correspondiente de la rampa elegida. Con pocas formas salen miles
 * de combinaciones, y el servidor solo guarda ids del catálogo.
 *
 * Tabla exacta (el navegador debe implementar la misma lógica):
 *
 *   R = 250 siempre
 *   G = 8 x (índice del slot)        0, 8, 16, 24, 32, 40, 48, 56
 *   B = 200 + 12 x tono              200, 212, 224, 236, 248
 *
 * Son colores rosados muy vivos, a más de 100 de distancia (en RGB) de
 * cualquier color de la paleta: no se confunden con nada y, si alguno se
 * queda sin recolorear, salta a la vista y `validarLienzo` lo reporta.
 *
 * Las 8 filas y 5 columnas completas están en el README.
 */

import type { Lienzo } from './lienzo';
import { normalizarHex, rgbAHex } from './color';
import type { Rampa5 } from './paleta';

/** Las zonas recoloreables de un personaje, en el orden de la tabla. */
export const SLOTS = [
  'piel',
  'cabello',
  'ropaA',
  'ropaB',
  'pantalon',
  'zapatos',
  'accA',
  'accB',
] as const;

export type Slot = (typeof SLOTS)[number];

/** Cada slot tiene 5 tonos. */
export const TONOS_POR_SLOT = 5;

/** Índice de tono: 0 a 4. */
export type Tono = 0 | 1 | 2 | 3 | 4;

/** Qué significa cada tono. Sirve igual para marcadores y para rampas de 5 tonos. */
export const NOMBRES_TONO: readonly [string, string, string, string, string] = [
  'contorno o sombra profunda',
  'sombra',
  'base',
  'luz',
  'brillo',
];

const R_MARCADOR = 250;
const G_POR_SLOT = 8;
const B_BASE = 200;
const B_POR_TONO = 12;

type TonosMarcador = readonly [string, string, string, string, string];

function construirMarcadores(): Readonly<Record<Slot, TonosMarcador>> {
  const salida = {} as Record<Slot, TonosMarcador>;
  SLOTS.forEach((slot, indiceSlot) => {
    salida[slot] = [0, 1, 2, 3, 4].map((tono) =>
      rgbAHex(R_MARCADOR, G_POR_SLOT * indiceSlot, B_BASE + B_POR_TONO * tono),
    ) as unknown as TonosMarcador;
  });
  return Object.freeze(salida);
}

/** Tabla completa: slot a sus 5 colores marcador (tono 0 al 4), en `#RRGGBB` mayúsculas. */
export const MARCADORES: Readonly<Record<Slot, TonosMarcador>> = construirMarcadores();

const INVERSO = new Map<string, { slot: Slot; tono: Tono }>();
for (const slot of SLOTS) {
  MARCADORES[slot].forEach((hex, tono) => {
    INVERSO.set(hex, { slot, tono: tono as Tono });
  });
}

/** El color marcador de un slot y un tono (0 a 4). Lanza un error si el tono no existe. */
export function colorMarcador(slot: Slot, tono: number): string {
  const tonos = MARCADORES[slot] as TonosMarcador | undefined;
  if (tonos === undefined) throw new Error(`Slot desconocido: "${String(slot)}". Los slots son: ${SLOTS.join(', ')}.`);
  const hex = tonos[tono];
  if (!Number.isInteger(tono) || hex === undefined) {
    throw new Error(`Tono fuera de rango: ${tono}. Cada slot tiene tonos del 0 al ${TONOS_POR_SLOT - 1}.`);
  }
  return hex;
}

/** ¿Es este hex uno de los 40 colores marcador? */
export function esMarcador(hex: string): boolean {
  return INVERSO.has(hex.toUpperCase());
}

/** A qué slot y tono corresponde un marcador, o `null` si no lo es. */
export function infoMarcador(hex: string): { slot: Slot; tono: Tono } | null {
  return INVERSO.get(hex.toUpperCase()) ?? null;
}

/** Una rampa de 5 tonos por slot. Los slots que falten conservan sus marcadores. */
export type RampasPorSlot = Partial<Record<Slot, readonly string[]>>;

/**
 * Cambia cada marcador por el tono correspondiente de la rampa de su slot y
 * devuelve un lienzo nuevo (el original no se toca).
 *
 * - Cada rampa debe tener exactamente 5 colores hex (tono 0 al 4). Sirve
 *   `rampa5('#C68642')` o una rampa escrita a mano.
 * - Los slots sin rampa dejan sus marcadores tal cual.
 * - Los colores que no son marcadores (contornos negros, ojos, detalles) pasan
 *   sin cambios.
 */
export function recolorearConRampas(lienzo: Lienzo, rampas: RampasPorSlot): Lienzo {
  const mapa: Record<string, string> = {};
  for (const slot of SLOTS) {
    const rampa = rampas[slot];
    if (rampa === undefined) continue;
    if (rampa.length !== TONOS_POR_SLOT) {
      throw new Error(
        `La rampa de "${slot}" debe tener ${TONOS_POR_SLOT} tonos y tiene ${rampa.length}.`,
      );
    }
    MARCADORES[slot].forEach((marcador, tono) => {
      mapa[marcador] = normalizarHex(rampa[tono] ?? marcador);
    });
  }
  for (const clave of Object.keys(rampas)) {
    if (!(SLOTS as readonly string[]).includes(clave)) {
      throw new Error(`Slot desconocido: "${clave}". Los slots son: ${SLOTS.join(', ')}.`);
    }
  }
  return lienzo.recolorear(mapa);
}

/** ¿Quedan marcadores sin recolorear en este lienzo? Devuelve cuántos píxeles. */
export function contarMarcadores(lienzo: Lienzo): number {
  let total = 0;
  const datos = lienzo.datos;
  for (let i = 0; i < datos.length; i += 4) {
    if (datos[i + 3] !== 255) continue;
    if (datos[i] !== R_MARCADOR) continue;
    if (INVERSO.has(rgbAHex(datos[i] ?? 0, datos[i + 1] ?? 0, datos[i + 2] ?? 0))) total++;
  }
  return total;
}

/**
 * Colores de vista previa: sirven SOLO para que la hoja de contacto muestre
 * un personaje con colores reconocibles antes de recolorearlo. No son arte
 * final ni hacen parte de la paleta.
 */
export const PREVISUALIZACION_MARCADORES: Readonly<Record<Slot, Rampa5>> = Object.freeze({
  piel: ['#8E5C3A', '#C08B53', '#E0A878', '#F1C99A', '#FFE2BC'],
  cabello: ['#1F1410', '#3B2519', '#5C3A21', '#7E5330', '#A06E43'],
  ropaA: ['#243A6B', '#34569A', '#4F7AC6', '#7BA3E0', '#B3CDF2'],
  ropaB: ['#1E4F3A', '#2F7A52', '#47A36B', '#79C98F', '#B4E6BF'],
  pantalon: ['#262A3A', '#3A4057', '#545C7A', '#7C86A6', '#A9B2CC'],
  zapatos: ['#17110F', '#2C2220', '#4A3A36', '#6E5A52', '#93807A'],
  accA: ['#8A561F', '#C28A28', '#E6B445', '#F8DB84', '#FFF0B8'],
  accB: ['#6A1B2B', '#A62430', '#D42E2D', '#EF3B3A', '#F98C80'],
});

/** La fórmula exacta de los marcadores, por si el navegador prefiere calcular en vez de buscar en una tabla. */
export const FORMULA_MARCADORES = {
  r: R_MARCADOR,
  gPorSlot: G_POR_SLOT,
  bBase: B_BASE,
  bPorTono: B_POR_TONO,
} as const;

/** Forma JSON de la tabla: slot a sus 5 colores hex (tono 0 al 4). Es la clave `marcadores` de los atlas de personajes. */
export type TablaMarcadoresJson = Record<Slot, string[]>;

/**
 * La tabla de marcadores lista para escribir como JSON, con la misma forma
 * que `CatalogoPersonaje.marcadores` en `shared`: `{ piel: [5 hex], cabello: [...], ... }`.
 * Es lo que `publicarAtlas` escribe bajo la clave `marcadores`.
 */
export function marcadoresJson(): TablaMarcadoresJson {
  const tabla = {} as TablaMarcadoresJson;
  for (const slot of SLOTS) tabla[slot] = [...MARCADORES[slot]];
  return tabla;
}
