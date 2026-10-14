/**
 * Paleta global del arte de Oficina Live.
 *
 * Reglas:
 * - Entre 48 y 128 colores en total. Hoy son 120: las primeras 14 rampas son la base, las 10 siguientes se agregaron
 *   para un estilo suave inspirado en Gather (lavanda, azul de oficina, ladrillo crema...) y `pizarra` (6 tonos) salió de
 *   medir los escritorios de Gather v2. Ver GUIA-ESTILO-GATHER.md y GUIA-ESTILO-GATHER-V2.md. Quedan 8 libres.
 * - Organizados en rampas de 4 a 6 tonos, del más oscuro (0) al más claro.
 *   La rampa `neutro` es la excepción: tiene 8 tonos para llegar hasta el blanco.
 * - Cada color pertenece a UNA sola rampa. Así `oscurecerEnRampa` y el
 *   contorno tonal siempre saben cuál es "el tono anterior".
 * - Piel y cabello NO viven aquí: los define el módulo de personajes con
 *   marcadores de recoloreo (ver `marcadores.ts`).
 * - Acentos de marca: rojo coral #EF3B3A (oscuro #D42E2D), negro tinta
 *   #0A0A0A, grises y blanco. No hay logos ni tipografías de marca en el código.
 *
 * Nombre de cada color: `<rampa>-<tono>`, por ejemplo `madera-clara-3`.
 * También hay alias cortos (`tinta`, `blanco`, `rojo-coral`, ...).
 */

import { esHex, hexAOklch, normalizarHex, oklchAHex } from './color';

/**
 * Las rampas, del tono más oscuro (0) al más claro.
 * Convención de uso en objetos con vista 3/4 y luz arriba a la izquierda:
 * - tono más bajo: contorno y sombra profunda,
 * - tono siguiente: cara frontal en sombra,
 * - tono medio: cara frontal iluminada o cara superior en sombra,
 * - tonos altos: cara superior y brillos.
 */
export const RAMPAS = {
  /** Grises neutros con un leve tinte frío en las sombras. El 0 es negro tinta y el 7 es blanco. */
  neutro: ['#0A0A0A', '#25252B', '#44444C', '#666670', '#8C8C96', '#B2B2BB', '#D7D7DD', '#FFFFFF'],
  /** Pared cálida: crema con sombras de gris pardo. */
  'pared-calida': ['#7E6A62', '#B9A38F', '#E2D3BB', '#F6EEDD'],
  /** Madera clara tipo roble o abedul. */
  'madera-clara': ['#7B4B3A', '#B07A4E', '#D4A26A', '#E9C28A', '#F7DDB0'],
  /** Madera oscura tipo nogal. */
  'madera-oscura': ['#2A1820', '#4B2B2B', '#73452F', '#986444', '#BD8A60'],
  /** Metal frío: acero y aluminio. */
  metal: ['#2E3644', '#566274', '#8794A8', '#C4CDD9'],
  /** Vidrio y azules de pantalla: del azul profundo al celeste claro. */
  vidrio: ['#2E5E9A', '#4F96CB', '#8FD0EC', '#D6F1FA'],
  /** Tela gris con un leve tinte violeta. */
  'tela-gris': ['#34364A', '#565A72', '#7E839A', '#A9AEC0'],
  /** Tela cálida tipo mostaza. También sirve para dorados y amarillos. */
  'tela-calida': ['#8A561F', '#C28A28', '#E6B445', '#F8DB84'],
  /** Hojas y plantas de interior. */
  planta: ['#123C34', '#1C6542', '#34934A', '#67BD58', '#A5E07B'],
  /** Maceta de barro cocido. */
  'maceta-terracota': ['#6E2F2E', '#A5503A', '#D27B4E', '#EDA776'],
  /** Cemento pulido, gris cálido. */
  cemento: ['#6F6A6B', '#96908E', '#BAB4AD', '#D8D3CB'],
  /** Baldosa clara con una pizca de verde. */
  baldosa: ['#7E9A9A', '#A9C3C0', '#D2E3DD', '#EEF6F1'],
  /** Césped exterior, más amarillo que la planta de interior. */
  cesped: ['#2F6B3A', '#4C9A3F', '#7CC24E', '#B3E26E'],
  /** Rojo coral. El tono 3 es #EF3B3A y el 2 es su oscuro #D42E2D. */
  rojo: ['#6A1B2B', '#A62430', '#D42E2D', '#EF3B3A', '#F98C80'],

  // ---- Rampas del estilo Gather (suaves y desaturadas, con contorno azul marino muy oscuro) ----
  /** Alfombras y paredes de las salas: lavanda con zigzag. */
  lavanda: ['#585C98', '#7479B4', '#8A90C8', '#9FA6DA', '#C4C9EE'],
  /** Sillas de oficina, paneles de escritorio y contorno de objetos: azul marino. El 0 es el contorno oscuro. */
  'azul-oficina': ['#141828', '#2F3957', '#46557A', '#6677A0', '#95A5C8'],
  /** Baldosa gris azulada de las áreas de equipo y losas de descanso. */
  'baldosa-gris': ['#4C6060', '#667777', '#8399A0', '#A9BBBB', '#CFDCDC'],
  /** Ladrillo crema de los pasillos. */
  'ladrillo-crema': ['#BDAE92', '#D3C5A9', '#E5D9BD', '#F1E9D3', '#FBF8EA'],
  /** Rojo suave de sillones y alfombras (más cálido y claro que el rojo de marca). */
  'rojo-suave': ['#6E3340', '#A8384A', '#CC4455', '#E8636A', '#F4A09C'],
  /** Naranja de sillones, conos y detalles. */
  naranja: ['#9A4A1C', '#C96A28', '#E88A3A', '#F5B263', '#FBD79A'],
  /** Cuero y madera tallada rojiza. */
  cuero: ['#5E3A34', '#885544', '#B07158', '#D09A7A', '#EBC7AA'],
  /** Plantas de tono pastel. */
  'hoja-pastel': ['#2F5A4B', '#4E8468', '#77AA88', '#A3CBA8', '#CFE6CC'],
  /** Crema arenosa de sofás tapizados y mesas redondas. */
  crema: ['#B08A66', '#CBA582', '#E0C2A0', '#EED9BC', '#F8EBD6'],
  /** Morado de puffs y acentos. */
  morado: ['#4A3A7A', '#6F55B0', '#9B79DA', '#BB8EEE', '#DAB8F7'],

  // ---- Estilo Gather v2 medido (ver GUIA-ESTILO-GATHER-V2.md) ----
  /**
   * Pizarra: el gris azulado de los escritorios y los equipos de Gather, medido en la captura de escritorios.
   * Tono 1 `#636D77`: frente del escritorio. Tono 2 `#7E8A97`: arista de luz del frente. Tono 3 `#B4C0CC`: labio.
   * Tono 4 `#CFD7E5`: brillo del labio. Tono 5 `#EEF2F8`: sombra suave sobre la tapa blanca. Tono 0 `#414A56`: sombra
   * del frente y borde inferior.
   */
  pizarra: ['#414A56', '#636D77', '#7E8A97', '#B4C0CC', '#CFD7E5', '#EEF2F8'],
} as const;

// `as const` solo protege en tiempo de compilación: aquí se congela también en ejecución,
// para que nadie cambie la paleta por accidente con un `push` o una asignación.
for (const tonos of Object.values(RAMPAS)) Object.freeze(tonos);
Object.freeze(RAMPAS);

/** Nombres de rampa válidos, por ejemplo `'madera-clara'`. */
export type NombreRampa = keyof typeof RAMPAS;

type IndicesDeRampa<T extends readonly unknown[]> = Extract<keyof T, `${number}`>;

/** Nombre canónico de un color de la paleta, por ejemplo `'madera-clara-3'`. */
export type NombreColor = {
  [K in NombreRampa]: `${K}-${IndicesDeRampa<(typeof RAMPAS)[K]>}`;
}[NombreRampa];

/** Alias cortos de los colores más usados. */
export const ALIAS = {
  tinta: 'neutro-0',
  blanco: 'neutro-7',
  'rojo-coral': 'rojo-3',
  'rojo-coral-oscuro': 'rojo-2',
} as const satisfies Record<string, NombreColor>;

export type NombreAlias = keyof typeof ALIAS;

/** Rampa de 5 tonos (0 = contorno o sombra profunda, 4 = brillo). */
export type Rampa5 = readonly [string, string, string, string, string];

function construirPaleta(): Readonly<Record<NombreColor, string>> {
  const salida: Record<string, string> = {};
  for (const nombre of Object.keys(RAMPAS) as NombreRampa[]) {
    (RAMPAS[nombre] as readonly string[]).forEach((hex, indice) => {
      salida[`${nombre}-${indice}`] = hex;
    });
  }
  return Object.freeze(salida) as Readonly<Record<NombreColor, string>>;
}

/** Todos los colores de la paleta: nombre canónico a hex en mayúsculas. */
export const PALETA: Readonly<Record<NombreColor, string>> = construirPaleta();

const TODOS_LOS_NOMBRES = [...Object.keys(PALETA), ...Object.keys(ALIAS), 'transparente'];

/** Hex (mayúsculas) a su ubicación `{ rampa, indice }`. Cada color está en una sola rampa. */
const UBICACION = new Map<string, { rampa: NombreRampa; indice: number }>();
for (const nombre of Object.keys(RAMPAS) as NombreRampa[]) {
  (RAMPAS[nombre] as readonly string[]).forEach((hex, indice) => {
    UBICACION.set(hex, { rampa: nombre, indice });
  });
}

function distanciaEdicion(a: string, b: string): number {
  const fila = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let anterior = fila[0] ?? 0;
    fila[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const actual = fila[j] ?? 0;
      const costo = a[i - 1] === b[j - 1] ? 0 : 1;
      fila[j] = Math.min((fila[j] ?? 0) + 1, (fila[j - 1] ?? 0) + 1, anterior + costo);
      anterior = actual;
    }
  }
  return fila[b.length] ?? 0;
}

/** Hasta 3 candidatos parecidos a lo escrito: primero los que lo contienen, luego los de menor distancia de edición. */
function sugerir(consulta: string, candidatos: readonly string[]): string[] {
  const q = consulta.toLowerCase();
  return candidatos
    .map((candidato) => {
      const contiene = candidato.includes(q) || (candidato.length > 2 && q.includes(candidato));
      return { candidato, puntaje: (contiene ? 0 : 10) + distanciaEdicion(q, candidato) };
    })
    .sort((a, b) => a.puntaje - b.puntaje || (a.candidato < b.candidato ? -1 : 1))
    .slice(0, 3)
    .map((s) => s.candidato);
}

/**
 * Resuelve un color a `#RRGGBB` en mayúsculas.
 * Acepta un hex (`#e9c28a`), un nombre de la paleta (`madera-clara-3`) o un alias (`tinta`).
 * Lanza un error con sugerencias si el nombre no existe.
 */
export function color(nombreOHex: string): string {
  if (nombreOHex.startsWith('#')) return normalizarHex(nombreOHex);
  const canonico = (ALIAS as Record<string, string>)[nombreOHex] ?? nombreOHex;
  const hex = (PALETA as Record<string, string>)[canonico];
  if (hex === undefined) {
    throw new Error(
      `Color desconocido: "${nombreOHex}". ¿Quisiste decir ${sugerir(nombreOHex, TODOS_LOS_NOMBRES)
        .map((s) => `"${s}"`)
        .join(', ')}?`,
    );
  }
  return hex;
}

/** La rampa completa por nombre, del tono más oscuro al más claro. */
export function rampa(nombre: NombreRampa | (string & {})): readonly string[] {
  const r = (RAMPAS as Record<string, readonly string[]>)[nombre];
  if (r === undefined) {
    const candidatos = sugerir(nombre, Object.keys(RAMPAS))
      .map((n) => `"${n}"`)
      .join(', ');
    throw new Error(`Rampa desconocida: "${nombre}". ¿Quisiste decir ${candidatos}?`);
  }
  return r;
}

/** ¿Este hex es uno de los colores de la paleta? No distingue mayúsculas. */
export function esColorDePaleta(hex: string): boolean {
  return esHex(hex) && UBICACION.has(hex.toUpperCase());
}

/** Dónde está un color en la paleta: su rampa y su tono. `null` si no pertenece. */
export function ubicarEnPaleta(hex: string): { rampa: NombreRampa; indice: number } | null {
  if (!esHex(hex)) return null;
  return UBICACION.get(hex.toUpperCase()) ?? null;
}

/** Nombre canónico (`madera-clara-3`) de un hex de la paleta, o `null`. */
export function nombreDeColor(hex: string): NombreColor | null {
  const u = ubicarEnPaleta(hex);
  return u === null ? null : (`${u.rampa}-${u.indice}` as NombreColor);
}

// ---------------------------------------------------------------------------
// Rampa de 5 tonos a partir de un color base
// ---------------------------------------------------------------------------

const L_MIN = 0.07;
const L_MAX = 0.97;
const MATIZ_SOMBRA = 285; // azul violeta
const MATIZ_LUZ = 95; // amarillo

/** Mueve `h` hacia `objetivo` por el arco más corto, como máximo `grados`. */
function acercarMatiz(h: number, objetivo: number, grados: number): number {
  const d = ((objetivo - h + 540) % 360) - 180;
  const paso = Math.min(Math.abs(d), grados) * Math.sign(d);
  return (h + paso + 360) % 360;
}

/**
 * Genera una rampa de 5 tonos desde un color base (el tono 2 es el base).
 *
 * - Las sombras (tonos 0 y 1) se corren hacia el azul violeta y las luces
 *   (tonos 3 y 4) hacia el amarillo: es lo que hace que el arte se vea
 *   vivo y no solo "más oscuro" o "más claro".
 * - Los saltos de luminosidad se reparten con OKLCH. Si un lado no tiene
 *   espacio (colores muy claros o muy oscuros), el otro lado se abre más.
 * - Es determinista: la misma entrada siempre da los mismos 5 hex.
 *
 * Úsala para variantes de color (sillas, sofás, ropa, cabello) y para
 * crear rampas de personajes con marcadores.
 */
export function rampa5(baseHex: string): Rampa5 {
  const base = normalizarHex(baseHex);
  const o = hexAOklch(base);
  const L = o.L;

  // Saltos deseados hacia abajo (tono 1 y 0) y hacia arriba (tono 3 y 4).
  const bajada: [number, number] = [0.125, 0.115];
  const subida: [number, number] = [0.09, 0.08];
  const espacioAbajo = Math.max(0, L - L_MIN);
  const espacioArriba = Math.max(0, L_MAX - L);
  const escalaAbajo = Math.min(1, espacioAbajo / (bajada[0] + bajada[1]));
  const escalaArriba = Math.min(1, espacioArriba / (subida[0] + subida[1]));
  const refuerzoAbajo = 1 + 0.8 * (1 - escalaArriba);
  const refuerzoArriba = 1 + 0.8 * (1 - escalaAbajo);

  let d1 = bajada[0] * escalaAbajo * refuerzoAbajo;
  let d0 = bajada[1] * escalaAbajo * refuerzoAbajo;
  let u3 = subida[0] * escalaArriba * refuerzoArriba;
  let u4 = subida[1] * escalaArriba * refuerzoArriba;
  if (d1 + d0 > espacioAbajo && d1 + d0 > 0) {
    const k = espacioAbajo / (d1 + d0);
    d1 *= k;
    d0 *= k;
  }
  if (u3 + u4 > espacioArriba && u3 + u4 > 0) {
    const k = espacioArriba / (u3 + u4);
    u3 *= k;
    u4 *= k;
  }

  // Grises: no tienen matiz propio, así que damos un tinte frío a las
  // sombras y casi nada a las luces.
  const neutro = o.C < 0.02;
  const matizSombra = neutro ? MATIZ_SOMBRA : o.h;
  const matizLuz = neutro ? MATIZ_LUZ : o.h;
  const croma = (factor: number): number => o.C * factor;

  const t0 = oklchAHex(L - d1 - d0, neutro ? 0.022 : croma(0.85), acercarMatiz(matizSombra, MATIZ_SOMBRA, 12));
  const t1 = oklchAHex(L - d1, neutro ? 0.014 : croma(0.97), acercarMatiz(matizSombra, MATIZ_SOMBRA, 6));
  const t3 = oklchAHex(L + u3, neutro ? 0.006 : croma(0.94), acercarMatiz(matizLuz, MATIZ_LUZ, 5));
  const t4 = oklchAHex(L + u3 + u4, neutro ? 0.008 : croma(0.7), acercarMatiz(matizLuz, MATIZ_LUZ, 10));
  return [t0, t1, base, t3, t4];
}

// ---------------------------------------------------------------------------
// Contorno tonal y variantes de color
// ---------------------------------------------------------------------------

/**
 * El tono anterior (más oscuro) de la rampa que contiene al color.
 * - Si es el tono 0 de su rampa, devuelve el mismo color (ya es el más oscuro).
 * - `pasos` retrocede varios tonos de una vez (por defecto 1).
 * - Si el color NO pertenece a la paleta, devuelve un tono más oscuro calculado
 *   con `rampa5` (mismo criterio de sombra con corrimiento de matiz).
 *
 * Es la base del contorno tonal: el borde de una forma toma el tono
 * anterior de su propio color, no negro.
 */
export function oscurecerEnRampa(hex: string, pasos = 1): string {
  const h = normalizarHex(hex);
  const ubicacion = UBICACION.get(h);
  if (ubicacion !== undefined) {
    const tonos = RAMPAS[ubicacion.rampa] as readonly string[];
    return tonos[Math.max(0, ubicacion.indice - Math.max(0, Math.floor(pasos)))] ?? h;
  }
  if (pasos <= 0) return h;
  // Fuera de la paleta: sombra generada. Un paso usa el tono 1, dos o más el tono 0.
  const generada = rampa5(h);
  return pasos >= 2 ? generada[0] : generada[1];
}

/**
 * Mapa tono a tono entre dos rampas, para recolorear un sprite:
 * `lienzo.recolorear(mapaEntreRampas('tela-gris', 'rojo'))`.
 * Si tienen distinto largo, empareja por posición relativa (el más oscuro con
 * el más oscuro, el más claro con el más claro).
 */
export function mapaEntreRampas(
  desde: NombreRampa | readonly string[] | (string & {}),
  hacia: NombreRampa | readonly string[] | (string & {}),
): Record<string, string> {
  const a = typeof desde === 'string' ? rampa(desde) : desde;
  const b = typeof hacia === 'string' ? rampa(hacia) : hacia;
  const mapa: Record<string, string> = {};
  a.forEach((hex, i) => {
    const j = a.length === 1 ? 0 : Math.round((i * (b.length - 1)) / (a.length - 1));
    mapa[normalizarHex(hex)] = normalizarHex(b[j] ?? hex);
  });
  return mapa;
}
