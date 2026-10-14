import { useEffect } from 'react';
import { ZOOMS } from '../mundo/escena';
import type { Almacen } from '../mundo/almacen';
import type { EstadoMundo } from '../mundo/tipos';
import type { ControladorEditor } from './controlador';

const enCampo = (t: EventTarget | null): boolean => {
  const e = t as HTMLElement | null;
  return Boolean(e && (e.tagName === 'INPUT' || e.tagName === 'TEXTAREA' || e.tagName === 'SELECT' || e.isContentEditable));
};

/** Atajos de teclado del modo construir. No actúan mientras escribes en un campo o hay una ventana abierta. */
export function useAtajosEditor(ctl: ControladorEditor | null, almacen: Almacen<EstadoMundo>, activo: boolean): void {
  useEffect(() => {
    if (!activo || !ctl) return;
    const alTeclear = (e: KeyboardEvent) => {
      if (enCampo(e.target) || document.querySelector('[role="dialog"]')) return;
      const mod = e.ctrlKey || e.metaKey;
      const k = e.key.toLowerCase();
      const s = almacen.get();
      if (mod && k === 'z') {
        e.preventDefault();
        if (e.shiftKey) ctl.rehacer();
        else ctl.deshacer();
        return;
      }
      if (mod && k === 'y') {
        e.preventDefault();
        ctl.rehacer();
        return;
      }
      if (mod && k === 'd') {
        e.preventDefault();
        ctl.duplicarSeleccion();
        return;
      }
      if (mod || e.altKey) return;
      switch (k) {
        case 'escape':
          ctl.cancelar();
          break;
        case 'r':
          ctl.girar();
          break;
        case 'delete':
        case 'backspace':
          e.preventDefault();
          ctl.borrarSeleccion();
          break;
        case 'v':
          ctl.elegirHerramienta('seleccionar');
          break;
        case 'h':
          ctl.elegirHerramienta('mano');
          break;
        case 'e':
          ctl.elegirHerramienta('borrar');
          break;
        case 'g':
          almacen.set({ rejilla: !s.rejilla });
          break;
        case '+':
        case '=': {
          const i = ZOOMS.findIndex((z) => z === s.zoom);
          const z = ZOOMS[Math.min(ZOOMS.length - 1, i + 1)];
          if (z !== undefined) almacen.set({ zoom: z });
          break;
        }
        case '-': {
          const i = ZOOMS.findIndex((z) => z === s.zoom);
          const z = ZOOMS[Math.max(0, i - 1)];
          if (z !== undefined) almacen.set({ zoom: z });
          break;
        }
        case 'arrowleft':
        case 'arrowright':
        case 'arrowup':
        case 'arrowdown':
          if (s.seleccion.some((x) => x.tipo === 'colocacion')) {
            e.preventDefault();
            ctl.empujar(k === 'arrowleft' ? -1 : k === 'arrowright' ? 1 : 0, k === 'arrowup' ? -1 : k === 'arrowdown' ? 1 : 0);
          }
          break;
        default:
          break;
      }
    };
    // Si la ventana pierde el foco con el botón apretado, el soltar no llega: se cierra el gesto.
    const alPerderFoco = () => ctl.soltarPuntero();
    window.addEventListener('keydown', alTeclear);
    window.addEventListener('blur', alPerderFoco);
    return () => {
      window.removeEventListener('keydown', alTeclear);
      window.removeEventListener('blur', alPerderFoco);
    };
  }, [ctl, almacen, activo]);
}
