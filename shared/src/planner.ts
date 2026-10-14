/**
 * Planner interno: tareas del equipo en columnas, con campos que la administración puede cambiar (Marca, Cliente,
 * semáforo de prioridad...). Este archivo define lo que viaja entre el servidor y la interfaz, y las reglas puras.
 */

export const LIMITES_PLANNER = {
  tableros: 20,
  subtareas: 40,
  comentario: 1000,
  miembros: 12,
  columnas: 12,
  campos: 12,
  opcionesPorCampo: 40,
  tareas: 2000,
  titulo: 120,
  descripcion: 2000,
  nombre: 40,
  texto: 200,
} as const;

/** Colores para columnas y opciones. Los tres primeros son el semáforo. */
export const COLORES_PLANNER = [
  { id: 'rojo', nombre: 'Rojo', hex: '#E5484D' },
  { id: 'amarillo', nombre: 'Amarillo', hex: '#F5A524' },
  { id: 'verde', nombre: 'Verde', hex: '#2FB344' },
  { id: 'azul', nombre: 'Azul', hex: '#3B82F6' },
  { id: 'morado', nombre: 'Morado', hex: '#A855F7' },
  { id: 'rosa', nombre: 'Rosa', hex: '#EC4899' },
  { id: 'naranja', nombre: 'Naranja', hex: '#F97316' },
  { id: 'turquesa', nombre: 'Turquesa', hex: '#14B8A6' },
  { id: 'gris', nombre: 'Gris', hex: '#8E8E93' },
] as const;

export const esColor = (v: unknown): v is string => typeof v === 'string' && /^#[0-9A-Fa-f]{6}$/.test(v);

export type TipoCampoPlanner = 'lista' | 'texto' | 'fecha';
export const TIPOS_CAMPO_PLANNER: readonly TipoCampoPlanner[] = ['lista', 'texto', 'fecha'];

export interface OpcionPlanner {
  id: number;
  nombre: string;
  color: string;
}

export interface CampoPlanner {
  id: number;
  nombre: string;
  tipo: TipoCampoPlanner;
  /** Una lista con semáforo se muestra con sus colores (rojo, amarillo, verde). */
  semaforo: boolean;
  opciones: OpcionPlanner[];
}

export interface TableroPlanner {
  id: number;
  nombre: string;
  color: string;
}

export interface ColumnaPlanner {
  id: number;
  nombre: string;
  color: string;
  /** Las tareas que llegan aquí cuentan como terminadas. */
  esFinal: boolean;
  /** Máximo de tareas que caben en la columna. `null`: sin límite. */
  limite: number | null;
}

export interface SubtareaPlanner {
  id: number;
  titulo: string;
  hecha: boolean;
}

export interface ComentarioPlanner {
  id: number;
  autorId: number | null;
  autor: string;
  texto: string;
  creadaEn: string;
}

export type ValorCampo = number | string | null;

export interface TareaPlanner {
  id: number;
  titulo: string;
  descripcion: string;
  columnaId: number;
  /** Quien responde por la tarea. Recibe el aviso cuando se la asignan. */
  responsableId: number | null;
  /** Las demás personas que colaboran. También reciben los avisos de la tarea. */
  miembros: number[];
  /** AAAA-MM-DD. */
  fechaLimite: string | null;
  /** Por id de campo: la opción elegida (id), un texto o una fecha. */
  valores: Record<string, ValorCampo>;
  orden: number;
  archivada: boolean;
  subtareas: SubtareaPlanner[];
  /** Cuántos comentarios tiene (el texto se pide al abrir la tarea). */
  comentarios: number;
  creadaPor: string;
  creadaPorId: number | null;
  creadaEn: string;
  completadaEn: string | null;
}

export interface PersonaPlanner {
  id: number;
  nombre: string;
  usuario: string;
  /** Versión de su foto de perfil (0 o ausente: sin foto). */
  foto?: number;
}

export interface DatosPlanner {
  tableros: TableroPlanner[];
  /** El tablero del que vienen las columnas, los campos y las tareas. */
  tablero: TableroPlanner;
  columnas: ColumnaPlanner[];
  campos: CampoPlanner[];
  tareas: TareaPlanner[];
  personas: PersonaPlanner[];
}

/** Lo que trae una tarea nueva o editada. Los campos que faltan no se tocan. */
export interface EntradaTarea {
  titulo?: string;
  descripcion?: string;
  columnaId?: number;
  responsableId?: number | null;
  miembros?: number[];
  fechaLimite?: string | null;
  valores?: Record<string, ValorCampo>;
  archivada?: boolean;
  /** La lista completa de subtareas: las que traen `id` se actualizan, las nuevas se crean y las que faltan se borran. */
  subtareas?: { id?: number; titulo: string; hecha: boolean }[];
}

/** Lo que se manda al guardar la configuración: los que traen `id` se actualizan, los que no, se crean y los que faltan se borran. */
export interface ConfigPlanner {
  /** Nombre y color del tablero (si no vienen, no cambian). */
  nombre?: string;
  color?: string;
  columnas: { id?: number; nombre: string; color: string; esFinal: boolean; limite?: number | null }[];
  campos: {
    id?: number;
    nombre: string;
    tipo: TipoCampoPlanner;
    semaforo: boolean;
    opciones: { id?: number; nombre: string; color: string }[];
  }[];
}

/** Configuración con la que arranca el Planner la primera vez. Todo se puede cambiar después. */
export const CONFIG_INICIAL_PLANNER: ConfigPlanner = {
  columnas: [
    { nombre: 'Por hacer', color: '#8E8E93', esFinal: false, limite: null },
    { nombre: 'En curso', color: '#3B82F6', esFinal: false, limite: null },
    { nombre: 'En revisión', color: '#A855F7', esFinal: false, limite: null },
    { nombre: 'Hecho', color: '#2FB344', esFinal: true, limite: null },
  ],
  campos: [
    { nombre: 'Prioridad', tipo: 'lista', semaforo: true, opciones: [{ nombre: 'Urgente', color: '#E5484D' }, { nombre: 'Importante', color: '#F5A524' }, { nombre: 'Normal', color: '#2FB344' }] },
    { nombre: 'Marca', tipo: 'lista', semaforo: false, opciones: [] },
    { nombre: 'Cliente', tipo: 'lista', semaforo: false, opciones: [{ nombre: 'Cliente A', color: '#2FB344' }, { nombre: 'Cliente B', color: '#E5484D' }] },
  ],
};

/**
 * Deja solo los valores que tienen sentido con los campos actuales: una lista exige una opción que exista,
 * un texto se recorta y una fecha debe ser AAAA-MM-DD. Lo demás se descarta.
 */
export function limpiarValores(campos: readonly CampoPlanner[], valores: Record<string, ValorCampo> | undefined): Record<string, ValorCampo> {
  const salida: Record<string, ValorCampo> = {};
  if (!valores) return salida;
  for (const c of campos) {
    const v = valores[String(c.id)];
    if (v === undefined || v === null || v === '') continue;
    if (c.tipo === 'lista') {
      const id = typeof v === 'number' ? v : Number(v);
      if (Number.isInteger(id) && c.opciones.some((o) => o.id === id)) salida[String(c.id)] = id;
    } else if (c.tipo === 'texto') {
      if (typeof v === 'string' && v.trim()) salida[String(c.id)] = v.trim().slice(0, LIMITES_PLANNER.texto);
    } else if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v))) salida[String(c.id)] = v;
  }
  return salida;
}

/** ¿La tarea ya pasó su fecha límite sin estar terminada? */
export function estaVencida(t: Pick<TareaPlanner, 'fechaLimite' | 'completadaEn'>, hoy: Date = new Date()): boolean {
  if (!t.fechaLimite || t.completadaEn) return false;
  const limite = Date.parse(`${t.fechaLimite}T23:59:59`);
  return !Number.isNaN(limite) && limite < hoy.getTime();
}

/** Aviso para una persona, que se ve en la campana. */
export interface NotificacionPlanner {
  id: number;
  tipo: 'tarea_asignada' | 'tarea_miembro' | 'tarea_comentario' | 'tarea_terminada' | 'tarea_vence';
  titulo: string;
  texto: string;
  /** Ruta dentro de la plataforma a la que lleva el aviso. */
  enlace: string;
  leida: boolean;
  creadaEn: string;
}

export interface RespuestaNotificaciones {
  notificaciones: NotificacionPlanner[];
  /** Cuántas siguen sin leer (no solo las de la lista). */
  sinLeer: number;
}

/** Progreso de las subtareas de una tarea, por ejemplo «2/5». `null` si no tiene. */
export function progresoSubtareas(t: Pick<TareaPlanner, 'subtareas'>): { hechas: number; total: number } | null {
  if (t.subtareas.length === 0) return null;
  return { hechas: t.subtareas.filter((x) => x.hecha).length, total: t.subtareas.length };
}
