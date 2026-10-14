import type { ComentarioPlanner, ConfigPlanner, DatosPlanner, EntradaTarea, RespuestaNotificaciones, TareaPlanner } from '@ol/shared';
import { api } from '../api';

const consulta = (tablero?: number): string => (tablero ? `?tablero=${tablero}` : '');

export const pedirPlanner = (tablero?: number): Promise<DatosPlanner> => api<DatosPlanner>(`/planner${consulta(tablero)}`);

export async function crearTareaPlanner(e: EntradaTarea, tablero?: number): Promise<TareaPlanner> {
  return (await api<{ tarea: TareaPlanner }>(`/planner/tareas${consulta(tablero)}`, { metodo: 'POST', cuerpo: e })).tarea;
}

export async function actualizarTareaPlanner(id: number, e: EntradaTarea): Promise<TareaPlanner> {
  return (await api<{ tarea: TareaPlanner }>(`/planner/tareas/${id}`, { metodo: 'PATCH', cuerpo: e })).tarea;
}

export async function moverTareaPlanner(id: number, columnaId: number, posicion: number): Promise<TareaPlanner> {
  return (await api<{ tarea: TareaPlanner }>(`/planner/tareas/${id}/mover`, { metodo: 'POST', cuerpo: { columnaId, posicion } })).tarea;
}

export async function borrarTareaPlanner(id: number): Promise<void> {
  await api(`/planner/tareas/${id}`, { metodo: 'DELETE' });
}

export const pedirTareaPlanner = (id: number): Promise<{ tarea: TareaPlanner; tableroId: number; comentarios: ComentarioPlanner[] }> => api(`/planner/tareas/${id}`);

export async function comentarPlanner(id: number, texto: string): Promise<ComentarioPlanner> {
  return (await api<{ comentario: ComentarioPlanner }>(`/planner/tareas/${id}/comentarios`, { metodo: 'POST', cuerpo: { texto } })).comentario;
}

export async function borrarComentarioPlanner(id: number, comentario: number): Promise<void> {
  await api(`/planner/tareas/${id}/comentarios/${comentario}`, { metodo: 'DELETE' });
}

export const guardarConfigPlanner = (tablero: number, c: ConfigPlanner): Promise<DatosPlanner> => api<DatosPlanner>(`/planner/tableros/${tablero}/config`, { metodo: 'PUT', cuerpo: c });

export const crearTableroPlanner = (e: { nombre: string; color?: string; copiarDe?: number }): Promise<DatosPlanner> => api<DatosPlanner>('/planner/tableros', { metodo: 'POST', cuerpo: e });

export async function borrarTableroPlanner(id: number): Promise<void> {
  await api(`/planner/tableros/${id}`, { metodo: 'DELETE' });
}

// ---------- avisos ----------

export const pedirNotificaciones = (): Promise<RespuestaNotificaciones> => api<RespuestaNotificaciones>('/notificaciones');
export const marcarNotificacion = (id: number): Promise<unknown> => api(`/notificaciones/${id}/leida`, { metodo: 'POST', cuerpo: {} });
export const marcarTodasNotificaciones = (): Promise<unknown> => api('/notificaciones/leidas', { metodo: 'POST', cuerpo: {} });
