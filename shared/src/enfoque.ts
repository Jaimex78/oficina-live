/**
 * Sesiones de enfoque en las zonas de coworking, como el «Coworking de Focused» de Gather. Nada de esto toca Spotify:
 * el enlace del Jam es solo un enlace que se abre en una pestaña nueva.
 */

export const MODOS_ENFOQUE = ['enfoque', 'pomodoro', 'libre'] as const;
export type ModoEnfoque = (typeof MODOS_ENFOQUE)[number];
export const ETIQUETA_MODO_ENFOQUE: Record<ModoEnfoque, string> = { enfoque: 'Enfoque', pomodoro: 'Pomodoro', libre: 'Libre' };

export const DURACIONES_ENFOQUE = [15, 25, 45, 60, 90] as const;
export const DURACION_ENFOQUE_POR_DEFECTO = 60;

/** Quién se entera de la sesión: «todos» ven el tema y el tiempo; «estado» solo ven que estás concentrado; «nadie» no ve nada. */
export const VISIBILIDADES_ENFOQUE = ['todos', 'estado', 'nadie'] as const;
export type VisibilidadEnfoque = (typeof VISIBILIDADES_ENFOQUE)[number];
export const ETIQUETA_VISIBILIDAD_ENFOQUE: Record<VisibilidadEnfoque, string> = {
  todos: 'Sí, todos disponibles',
  estado: 'Solo el estado',
  nadie: 'No',
};

export const TEMA_ENFOQUE_MAX = 80;
export const ENLACE_ENFOQUE_MAX = 300;
export const POMODORO_TRABAJO_MIN = 25;
export const POMODORO_DESCANSO_MIN = 5;

/** Lo que pide quien inicia la sesión. */
export interface PedidoEnfoque {
  modo: ModoEnfoque;
  /** Texto libre, opcional. */
  tema: string;
  minutos: number;
  /** Enlace de un Jam de Spotify, opcional. */
  spotify?: string;
  visibilidad: VisibilidadEnfoque;
}

/** Lo que ven los demás de una sesión que se comparte con «todos». `inicio` y `fin` son milisegundos de época del servidor. */
export interface SesionEnfoquePublica {
  modo: ModoEnfoque;
  tema: string;
  inicio: number;
  fin: number;
  spotify?: string;
  /** Hora del servidor cuando se mandó, para corregir la diferencia entre relojes. Solo viaja por la red: el navegador la quita. */
  ahora?: number;
}

/** La sesión completa: la ve quien la inició (con su elección de quién se entera). */
export interface SesionEnfoque extends SesionEnfoquePublica {
  visibilidad: VisibilidadEnfoque;
}

/** Solo enlaces de Spotify con https: `open.spotify.com` o `spotify.link`. Cualquier otra cosa no se abre desde la oficina. */
export function esEnlaceSpotify(texto: string | undefined | null): texto is string {
  if (!texto || texto.length > ENLACE_ENFOQUE_MAX || /\s/.test(texto)) return false;
  try {
    const u = new URL(texto);
    return u.protocol === 'https:' && !u.username && !u.password && (u.hostname === 'open.spotify.com' || u.hostname === 'spotify.link');
  } catch {
    return false;
  }
}

/** Quita lo que sobra del texto del tema: espacios de más y saltos de línea. */
export function limpiarTema(t: string): string {
  return t.replace(/\s+/g, ' ').trim().slice(0, TEMA_ENFOQUE_MAX);
}

export function restanteMs(s: Pick<SesionEnfoquePublica, 'fin'>, ahora: number): number {
  return Math.max(0, s.fin - ahora);
}

/** Minutos que faltan, redondeados hacia arriba (con 30 s faltando se dice «1 min»). */
export function minutosRestantes(s: Pick<SesionEnfoquePublica, 'fin'>, ahora: number): number {
  return Math.ceil(restanteMs(s, ahora) / 60_000);
}

/** «42:07». */
export function textoCronometro(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export interface FasePomodoro {
  fase: 'trabajo' | 'descanso';
  /** Lo que falta de esta fase, sin pasarse del final de la sesión. */
  restanteMs: number;
  /** Número de ciclo, desde 1. */
  ciclo: number;
}

/** Pomodoro: ciclos de 25 minutos de trabajo y 5 de descanso, contados desde el inicio de la sesión. */
export function fasePomodoro(s: Pick<SesionEnfoquePublica, 'inicio' | 'fin'>, ahora: number): FasePomodoro {
  const trabajo = POMODORO_TRABAJO_MIN * 60_000;
  const ciclo = (POMODORO_TRABAJO_MIN + POMODORO_DESCANSO_MIN) * 60_000;
  const t = Math.max(0, ahora - s.inicio);
  const dentro = t % ciclo;
  const enTrabajo = dentro < trabajo;
  const finDeFase = s.inicio + t - dentro + (enTrabajo ? trabajo : ciclo);
  return { fase: enTrabajo ? 'trabajo' : 'descanso', restanteMs: Math.max(0, Math.min(finDeFase, s.fin) - ahora), ciclo: Math.floor(t / ciclo) + 1 };
}

/** ¿El pedido es válido? Devuelve el pedido ya limpio, o un texto con lo que está mal. */
export function validarPedidoEnfoque(p: unknown): PedidoEnfoque | string {
  if (typeof p !== 'object' || p === null) return 'La sesión no es válida.';
  const x = p as Record<string, unknown>;
  if (!(MODOS_ENFOQUE as readonly unknown[]).includes(x.modo)) return 'Ese modo no existe.';
  if (!(DURACIONES_ENFOQUE as readonly unknown[]).includes(x.minutos)) return 'Elige una duración de la lista.';
  if (!(VISIBILIDADES_ENFOQUE as readonly unknown[]).includes(x.visibilidad)) return 'Elige quién se entera de la sesión.';
  const tema = typeof x.tema === 'string' ? limpiarTema(x.tema) : '';
  const bruto = typeof x.spotify === 'string' ? x.spotify.trim() : '';
  if (bruto && !esEnlaceSpotify(bruto)) return 'El enlace tiene que ser de Spotify (open.spotify.com o spotify.link).';
  return { modo: x.modo as ModoEnfoque, tema, minutos: x.minutos as number, ...(bruto ? { spotify: bruto } : {}), visibilidad: x.visibilidad as VisibilidadEnfoque };
}
