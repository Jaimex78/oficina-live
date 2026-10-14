import { useCallback, useEffect, useRef, useState } from 'react';
import type { ConfigPlanner, DatosPlanner, EntradaTarea, TareaPlanner } from '@ol/shared';
import { ErrorApi } from '../api';
import { actualizarTareaPlanner, borrarTableroPlanner, borrarTareaPlanner, crearTableroPlanner, crearTareaPlanner, guardarConfigPlanner, moverTareaPlanner, pedirPlanner } from './api';

const CADA_CUANTO_MS = 30_000;

const mensajeDe = (x: unknown, defecto: string): string => (x instanceof ErrorApi || x instanceof Error ? x.message : defecto);

/**
 * Las tareas de un tablero del Planner y lo que se puede hacer con ellas. Se refresca solo cada medio minuto y al volver a
 * la pestaña. Sin `tableroId` abre el primero.
 */
export function usePlanner(tableroId?: number) {
  const [datos, setDatos] = useState<DatosPlanner | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ocupado = useRef(0);
  const tablero = useRef(tableroId);
  tablero.current = tableroId;

  const recargar = useCallback(async () => {
    try {
      const d = await pedirPlanner(tablero.current);
      setDatos(d);
      setError(null);
    } catch (x) {
      setError(mensajeDe(x, 'No se pudo cargar el Planner.'));
    }
  }, []);

  useEffect(() => {
    setDatos((d) => (d && tableroId !== undefined && d.tablero.id !== tableroId ? null : d));
    void recargar();
  }, [recargar, tableroId]);

  useEffect(() => {
    const t = setInterval(() => {
      // No se pisa lo que la persona está moviendo en este momento.
      if (ocupado.current === 0 && document.visibilityState === 'visible') void recargar();
    }, CADA_CUANTO_MS);
    const alVolver = () => document.visibilityState === 'visible' && ocupado.current === 0 && void recargar();
    document.addEventListener('visibilitychange', alVolver);
    return () => {
      clearInterval(t);
      document.removeEventListener('visibilitychange', alVolver);
    };
  }, [recargar]);

  const conservar = async <T,>(f: () => Promise<T>): Promise<T> => {
    ocupado.current++;
    try {
      return await f();
    } finally {
      ocupado.current--;
    }
  };

  const reemplazar = (t: TareaPlanner) => setDatos((d) => (d ? { ...d, tareas: d.tareas.map((x) => (x.id === t.id ? t : x)) } : d));

  return {
    datos,
    error,
    recargar,
    crear: (e: EntradaTarea) =>
      conservar(async () => {
        const t = await crearTareaPlanner(e, datos?.tablero.id ?? tableroId);
        setDatos((d) => (d ? { ...d, tareas: [...d.tareas, t] } : d));
        return t;
      }),
    actualizar: (id: number, e: EntradaTarea) =>
      conservar(async () => {
        const t = await actualizarTareaPlanner(id, e);
        reemplazar(t);
        return t;
      }),
    /** Mueve la tarjeta en pantalla al instante y avisa al servidor; si falla, vuelve a leer. */
    mover: (id: number, columnaId: number, posicion: number) =>
      conservar(async () => {
        setDatos((d) => {
          if (!d) return d;
          const t = d.tareas.find((x) => x.id === id);
          if (!t) return d;
          const resto = d.tareas.filter((x) => x.id !== id);
          const destino = resto.filter((x) => x.columnaId === columnaId).sort((a, b) => a.orden - b.orden);
          destino.splice(Math.max(0, Math.min(destino.length, posicion)), 0, { ...t, columnaId });
          const ordenadas = new Map(destino.map((x, i) => [x.id, { ...x, orden: i }]));
          return { ...d, tareas: [...resto.filter((x) => x.columnaId !== columnaId), ...ordenadas.values()] };
        });
        try {
          reemplazar(await moverTareaPlanner(id, columnaId, posicion));
        } catch (x) {
          await recargar();
          throw x;
        }
      }),
    borrar: (id: number) =>
      conservar(async () => {
        await borrarTareaPlanner(id);
        setDatos((d) => (d ? { ...d, tareas: d.tareas.filter((x) => x.id !== id) } : d));
      }),
    guardarConfig: (c: ConfigPlanner) =>
      conservar(async () => {
        if (!datos) return;
        setDatos(await guardarConfigPlanner(datos.tablero.id, c));
      }),
    crearTablero: (e: { nombre: string; color?: string; copiarDe?: number }) => conservar(() => crearTableroPlanner(e)),
    borrarTablero: (id: number) => conservar(() => borrarTableroPlanner(id)),
  };
}

export type ApiPlanner = ReturnType<typeof usePlanner>;
