import { useCallback, useEffect, useState } from 'react';
import type { NotificacionPlanner } from '@ol/shared';
import { marcarNotificacion, marcarTodasNotificaciones, pedirNotificaciones } from './api';

const CADA_CUANTO_MS = 20_000;

/** Los avisos de la persona: se leen al abrir y cada 20 segundos mientras la pestaña está visible. */
export function useNotificaciones(activo: boolean) {
  const [lista, setLista] = useState<NotificacionPlanner[]>([]);
  const [sinLeer, setSinLeer] = useState(0);

  const recargar = useCallback(async () => {
    try {
      const r = await pedirNotificaciones();
      setLista(r.notificaciones);
      setSinLeer(r.sinLeer);
    } catch {
      /* si falla, se queda lo último que había */
    }
  }, []);

  useEffect(() => {
    if (!activo) return;
    void recargar();
    const t = setInterval(() => document.visibilityState === 'visible' && void recargar(), CADA_CUANTO_MS);
    const alVolver = () => document.visibilityState === 'visible' && void recargar();
    document.addEventListener('visibilitychange', alVolver);
    return () => {
      clearInterval(t);
      document.removeEventListener('visibilitychange', alVolver);
    };
  }, [activo, recargar]);

  return {
    lista,
    sinLeer,
    recargar,
    leer: async (id: number) => {
      setLista((l) => l.map((n) => (n.id === id ? { ...n, leida: true } : n)));
      setSinLeer((n) => Math.max(0, n - 1));
      try {
        await marcarNotificacion(id);
      } catch {
        await recargar();
      }
    },
    leerTodas: async () => {
      setLista((l) => l.map((n) => ({ ...n, leida: true })));
      setSinLeer(0);
      try {
        await marcarTodasNotificaciones();
      } catch {
        await recargar();
      }
    },
  };
}
