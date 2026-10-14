import { useEffect, useMemo, useState } from 'react';
import type { Puente } from '../mundo/puente';
import type { PersonaVista } from '../mundo/vivo';
import { pedirMiembros, type MiembroOficina } from '../mundo/api-oficina';

export interface Presencia {
  yo: PersonaVista | null;
  /** Quienes están en la oficina ahora, sin ti, por nombre. */
  otros: PersonaVista[];
  /** Cambia cada vez que algo de la presencia cambia: sirve para recalcular lo derivado. */
  version: number;
}

/** Lo que pasa en la oficina ahora (de `puente.vivo`). Se actualiza cuando alguien entra, sale o cambia de estado. */
export function usePresencia(puente: Puente): Presencia {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    setVersion((v) => v + 1);
    return puente.vivo.suscribir(() => setVersion((v) => v + 1));
  }, [puente]);
  return useMemo(() => {
    const otros = [...puente.vivo.otros.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    return { yo: puente.vivo.yo, otros, version };
    // `version` es lo que invalida: `vivo` se muta en el mismo objeto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puente, version]);
}

export type Miembro = MiembroOficina;

/**
 * La lista completa de personas activas de la organización, para mostrar también a quienes no están en línea.
 * La entrega el servidor a cualquiera que pueda entrar (sin correos). Se vuelve a pedir cada minuto y, con un pequeño
 * retraso, cuando cambia cuánta gente hay en la sala.
 */
export function useMiembros(activo: boolean, enLinea = 0): Miembro[] {
  const [lista, setLista] = useState<Miembro[]>([]);
  const [recargas, setRecargas] = useState(0);
  useEffect(() => {
    if (!activo) return;
    const t = window.setTimeout(() => setRecargas((n) => n + 1), 1500);
    return () => window.clearTimeout(t);
  }, [activo, enLinea]);
  useEffect(() => {
    if (!activo) {
      setLista([]);
      return;
    }
    let vigente = true;
    const cargar = () => {
      pedirMiembros()
        .then((l) => vigente && setLista(l))
        .catch(() => undefined);
    };
    cargar();
    const t = setInterval(() => document.visibilityState === 'visible' && cargar(), 60_000);
    return () => {
      vigente = false;
      clearInterval(t);
    };
  }, [activo, recargas]);
  return lista;
}
