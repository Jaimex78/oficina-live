import { COLECCIONES, type ColeccionId, type ObjetoCatalogo } from './arte';

/**
 * Qué parte del catálogo puede usar cada persona. Lo básico lo usa todo el mundo; lo demás se reparte en paquetes que la
 * administración asigna cuenta por cuenta. El servidor lo exige (al editar un área y al guardar un personaje).
 */
export interface PaqueteAcceso {
  id: string;
  nombre: string;
  descripcion: string;
  grupo: 'objetos' | 'fiestas' | 'personaje';
}

export const PAQUETES_ACCESO: readonly PaqueteAcceso[] = [
  { id: 'gamer', nombre: 'Gamer', descripcion: 'Computador gamer, PlayStation, silla gamer y arcade.', grupo: 'objetos' },
  { id: 'juegos', nombre: 'Juegos y ocio', descripcion: 'Billar, dardos, póker, rockola, karts y más.', grupo: 'objetos' },
  { id: 'exterior', nombre: 'Exterior y jardín', descripcion: 'Árboles, bancas, sombrillas y jardineras.', grupo: 'objetos' },
  ...COLECCIONES.map((c) => ({ id: `fiesta-${c.id}`, nombre: c.nombre, descripcion: `Objetos y disfraces de ${c.nombre}.`, grupo: 'fiestas' as const })),
  { id: 'ropa-premium', nombre: 'Ropa premium', descripcion: 'Chaquetas, sombreros, gafas y accesorios llamativos del personaje (capas, alas, kimono, monóculo...). Lo básico es libre para todos.', grupo: 'personaje' },
  { id: 'mascotas', nombre: 'Mascotas', descripcion: 'Todas las mascotas (12) que acompañan al personaje.', grupo: 'personaje' },
  { id: 'mascotas-animales', nombre: 'Mascotas: animales', descripcion: 'Solo los animales: gato, perro, conejo, búho, pollito, panda, rana y zorro.', grupo: 'personaje' },
  { id: 'mascotas-fantasticas', nombre: 'Mascotas: fantásticas', descripcion: 'Solo las inventadas: dragoncito, nube, hongo y fantasmita.', grupo: 'personaje' },
  { id: 'movilidad', nombre: 'Movilidad', descripcion: 'Patineta, scooter y silla de ruedas para el personaje.', grupo: 'personaje' },
];

/** Paquetes que ya no existen con su nombre viejo y a cuál equivalen (las cuentas guardadas no pierden lo que tenían). */
export const PAQUETES_RENOMBRADOS: Readonly<Record<string, string>> = { 'accesorios-especiales': 'ropa-premium' };

/** Los ids válidos: los de la lista y los nombres viejos, que se convierten al leerlos. */
export const IDS_PAQUETES: ReadonlySet<string> = new Set([...PAQUETES_ACCESO.map((p) => p.id), ...Object.keys(PAQUETES_RENOMBRADOS)]);

/** Lo que se le dice a quien ve algo bloqueado del personaje. */
export const AVISO_ASIGNACION = 'Pídele a un administrador que te la asigne.';

/** Los objetos del paquete «Gamer», además de los de la categoría de juegos. */
const OBJETOS_GAMER: ReadonlySet<string> = new Set(['pc-gamer', 'ps5', 'sillon-gamer', 'consola-juegos', 'maquina-arcade']);

/** El paquete que hace falta para usar un objeto. `null` es que es básico y lo puede usar cualquiera. */
export function paqueteDeObjeto(o: Pick<ObjetoCatalogo, 'id' | 'categoria' | 'coleccion'>): string | null {
  if (o.coleccion) return `fiesta-${o.coleccion}`;
  if (OBJETOS_GAMER.has(o.id)) return 'gamer';
  if (o.categoria === 'juegos') return 'juegos';
  if (o.categoria === 'exterior') return 'exterior';
  return null;
}

export function objetoDisponible(o: Pick<ObjetoCatalogo, 'id' | 'categoria' | 'coleccion'>, paquetes: readonly string[], fecha: Date = new Date()): boolean {
  const p = paqueteDeObjeto(o);
  if (p === null || paquetes.includes(p)) return true;
  // Lo de una fiesta también se abre solo en las fechas de esa fiesta.
  return o.coleccion !== undefined && coleccionActiva(o.coleccion, fecha);
}

// ---------- fiestas del año ----------

/** Fechas en que cada fiesta se activa sola para todas las personas (mes y día, hora de Colombia). `null`: solo por paquete. */
const VENTANAS_FIESTAS: Record<ColeccionId, ReadonlyArray<readonly [number, number]> | 'pascua' | null> = {
  halloween: [[1015, 1102]],
  navidad: [[1201, 106]],
  'amor-amistad': [[910, 925]],
  'ano-nuevo': [[1226, 108]],
  colombia: [[710, 725], [801, 810]],
  pascua: 'pascua',
  cumpleanos: null,
};

/** Domingo de Pascua de un año (algoritmo de Meeus, Jones y Butcher). */
export function domingoDePascua(anio: number): { mes: number; dia: number } {
  const a = anio % 19;
  const b = Math.floor(anio / 100);
  const c = anio % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return { mes, dia };
}

/** ¿Está la fiesta en sus fechas? Usa la hora de Colombia (UTC-5). */
export function coleccionActiva(col: ColeccionId, fecha: Date = new Date()): boolean {
  const local = new Date(fecha.getTime() - 5 * 3_600_000);
  const mes = local.getUTCMonth() + 1;
  const dia = local.getUTCDate();
  const v = mes * 100 + dia;
  const ventana = VENTANAS_FIESTAS[col];
  if (ventana === null) return false;
  if (ventana === 'pascua') {
    // Semana Santa: desde ocho días antes del domingo de Pascua hasta el lunes siguiente.
    const { mes: pm, dia: pd } = domingoDePascua(local.getUTCFullYear());
    const pascua = Date.UTC(local.getUTCFullYear(), pm - 1, pd);
    const hoy = Date.UTC(local.getUTCFullYear(), mes - 1, dia);
    const dias = Math.round((hoy - pascua) / 86_400_000);
    return dias >= -8 && dias <= 1;
  }
  return ventana.some(([desde, hasta]) => (desde <= hasta ? v >= desde && v <= hasta : v >= desde || v <= hasta));
}

/** Las fiestas que están abiertas hoy para todo el mundo. */
export const coleccionesActivas = (fecha: Date = new Date()): ColeccionId[] => COLECCIONES.map((c) => c.id).filter((id) => coleccionActiva(id, fecha));

// ---------- personaje ----------

/**
 * Ropa premium: una parte con `premium: true` en el catálogo (chaquetas, sombreros, gafas y «Otro» llamativos) la elige solo quien
 * tiene el paquete «Ropa premium». Lo básico no lleva marca y lo usa cualquiera.
 */
export const tienePremium = (paquetes: readonly string[]): boolean => paquetes.includes('ropa-premium');

export const parteDisponible = (parte: { premium?: boolean }, paquetes: readonly string[]): boolean => parte.premium !== true || tienePremium(paquetes);

/** Una mascota se abre con el paquete general «Mascotas» o con el de su grupo (animales o fantásticas). Nadie la tiene por defecto. */
export const mascotaDisponible = (m: { grupo: string }, paquetes: readonly string[]): boolean => paquetes.includes('mascotas') || paquetes.includes(`mascotas-${m.grupo}`);

/** Un disfraz está disponible en las fechas de su fiesta o si la administración le dio el paquete de esa fiesta. */
export const disfrazDisponible = (d: { coleccion?: string }, paquetes: readonly string[], fecha: Date = new Date()): boolean =>
  d.coleccion !== undefined && (paquetes.includes(`fiesta-${d.coleccion}`) || coleccionActiva(d.coleccion as ColeccionId, fecha));

export const movilidadDisponible = (paquetes: readonly string[]): boolean => paquetes.includes('movilidad');

/** Deja solo ids de paquetes que existen, sin repetir. */
export function limpiarPaquetes(valor: unknown): string[] {
  if (!Array.isArray(valor)) return [];
  const ids = valor.filter((v): v is string => typeof v === 'string' && IDS_PAQUETES.has(v)).map((v) => PAQUETES_RENOMBRADOS[v] ?? v);
  return [...new Set(ids)];
}

const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const textoMD = (v: number): string => `${v % 100} ${MESES_CORTOS[Math.floor(v / 100) - 1] ?? ''}`;

/** Cuándo se activa una fiesta, para decírselo a quien la ve bloqueada. `null` si solo se abre por paquete. */
export function textoVentana(col: ColeccionId): string | null {
  const v = VENTANAS_FIESTAS[col];
  if (v === null) return null;
  if (v === 'pascua') return 'Semana Santa';
  return v.map(([d, h]) => `del ${textoMD(d)} al ${textoMD(h)}`).join(' y ');
}
