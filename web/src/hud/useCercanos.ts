import { useEffect, useState } from 'react';
import { CASILLA } from '@ol/shared';
import type { Puente } from '../mundo/puente';
import type { PersonaVista } from '../mundo/vivo';
import { distanciaCercania } from './tipos';

/** Quienes están dentro del radio de cercanía de tu personaje, de la misma sala. */
export function cercanosA(p: Puente): PersonaVista[] {
  const yo = p.vivo.yo;
  if (!yo) return [];
  const radio = distanciaCercania(p) * CASILLA;
  return [...p.vivo.otros.values()].filter((o) => o.sala === yo.sala && Math.hypot(o.x - yo.x, o.y - yo.y) <= radio).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

/** Lo mismo, pero como estado de React: se revisa cada 600 ms y solo cambia si cambia quién está cerca. */
export function useCercanos(puente: Puente, activo = true): PersonaVista[] {
  const [lista, setLista] = useState<PersonaVista[]>([]);
  useEffect(() => {
    if (!activo) return;
    const revisar = () => {
      const nueva = cercanosA(puente);
      setLista((vieja) => (vieja.length === nueva.length && vieja.every((p, i) => p.id === nueva[i]?.id) ? vieja : nueva));
    };
    revisar();
    const t = setInterval(revisar, 600);
    return () => clearInterval(t);
  }, [puente, activo]);
  return lista;
}
