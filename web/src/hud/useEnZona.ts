import { useEffect, useRef, useState } from 'react';
import type { Puente } from '../mundo/puente';
import { celdaDePies } from '../mundo/ruta';
import type { PersonaVista } from '../mundo/vivo';

export interface RectZona {
  x: number;
  y: number;
  w: number;
  h: number;
}

const clave = (l: readonly PersonaVista[]): string => l.map((p) => `${p.id}:${p.estado}:${p.enfoque?.fin ?? 0}:${p.enfoque?.tema ?? ''}`).join('|');

/** Las personas (tú incluido) que están dentro de un rectángulo de casillas. Se vuelve a mirar cada medio segundo: caminar no avisa. */
export function usePersonasEn(puente: Puente, rect: RectZona | null): PersonaVista[] {
  const [lista, setLista] = useState<PersonaVista[]>([]);
  const ultima = useRef('');
  const { x, y, w, h } = rect ?? { x: 0, y: 0, w: 0, h: 0 };
  const hay = rect !== null;
  useEffect(() => {
    if (!hay) {
      ultima.current = '';
      setLista([]);
      return;
    }
    const calcular = () => {
      const v = puente.vivo;
      const todos = v.yo ? [v.yo, ...v.otros.values()] : [...v.otros.values()];
      const dentro = todos
        .filter((p) => {
          const c = celdaDePies(p.x, p.y);
          return c.x >= x && c.y >= y && c.x < x + w && c.y < y + h;
        })
        .sort((a, b) => (a.id === v.yo?.id ? -1 : b.id === v.yo?.id ? 1 : a.nombre.localeCompare(b.nombre, 'es')));
      const k = clave(dentro);
      if (k === ultima.current) return;
      ultima.current = k;
      setLista(dentro);
    };
    calcular();
    const t = window.setInterval(calcular, 500);
    const baja = puente.vivo.suscribir(calcular);
    return () => {
      window.clearInterval(t);
      baja();
    };
  }, [puente, hay, x, y, w, h]);
  return lista;
}
