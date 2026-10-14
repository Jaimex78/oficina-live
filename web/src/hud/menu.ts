import { useEffect, useRef, type RefObject } from 'react';

const ITEMS = '[role="menuitem"]:not(:disabled), [role="menuitemradio"]:not(:disabled), [data-menu-item]:not(:disabled)';

interface Opciones {
  /** El botón que lo abre: un clic en él no cuenta como «afuera» y al cerrar con Escape el foco vuelve ahí. */
  disparador?: RefObject<HTMLElement | null>;
  /** Mueve el foco al primer elemento al abrir. */
  enfocar?: boolean;
}

/**
 * Comportamiento común de los menús flotantes: cierra con Escape o con un clic afuera, devuelve el foco
 * al botón que lo abrió y recorre las opciones con las flechas.
 */
export function useMenu<T extends HTMLElement>(abierto: boolean, cerrar: () => void, { disparador, enfocar = true }: Opciones = {}): RefObject<T | null> {
  const raiz = useRef<T | null>(null);
  const cerrarRef = useRef(cerrar);
  cerrarRef.current = cerrar;

  useEffect(() => {
    if (!abierto) return;
    const el = raiz.current;
    if (enfocar) (el?.querySelector<HTMLElement>('[data-autofoco]') ?? el?.querySelector<HTMLElement>(ITEMS))?.focus();

    const afuera = (e: Event) => {
      const t = e.target as Node;
      if (raiz.current?.contains(t) || disparador?.current?.contains(t)) return;
      cerrarRef.current();
    };
    const tecla = (e: KeyboardEvent) => {
      // Con una ventana modal encima (buscador, configuración), Escape es de ella, no de este menú.
      if (e.key === 'Escape' && document.querySelector('.hd-velo, .velo') && !raiz.current?.closest('.hd-velo, .velo')) return;
      if (e.key === 'Escape') {
        e.stopPropagation();
        cerrarRef.current();
        disparador?.current?.focus();
        return;
      }
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      const todos = [...(raiz.current?.querySelectorAll<HTMLElement>(ITEMS) ?? [])];
      if (todos.length === 0) return;
      if (!raiz.current?.contains(document.activeElement)) return;
      e.preventDefault();
      const i = todos.indexOf(document.activeElement as HTMLElement);
      const sig = e.key === 'ArrowDown' ? (i + 1) % todos.length : (i - 1 + todos.length) % todos.length;
      todos[sig]?.focus();
    };
    document.addEventListener('pointerdown', afuera);
    document.addEventListener('keydown', tecla, true);
    return () => {
      document.removeEventListener('pointerdown', afuera);
      document.removeEventListener('keydown', tecla, true);
    };
  }, [abierto, disparador, enfocar]);

  return raiz;
}

/** ⌘ en Mac, Ctrl en el resto. Solo para mostrarlo: el atajo acepta ambas. */
export const TECLA_MODIFICADORA = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent) ? '⌘' : 'Ctrl';
