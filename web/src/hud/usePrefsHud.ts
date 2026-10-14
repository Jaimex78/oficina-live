import { useEffect } from 'react';
import type { Puente } from '../mundo/puente';
import { usePref } from './preferencias';
import { ordenesDe, fijarVistaEsquema, type ModoRendimiento, type ModoVista } from './tipos';

export const MODOS_VISTA: readonly ModoVista[] = ['simplificado', 'inmersivo', 'automatico'];
export const MODOS_RENDIMIENTO: readonly ModoRendimiento[] = ['calidad', 'equilibrado', 'eficiente'];

/** Preferencias de la interfaz flotante, recordadas en este navegador, y su efecto en el mundo y en la página. */
export function usePrefsHud(puente: Puente) {
  const [panelAbierto, setPanelAbierto] = usePref<boolean>('panel', true);
  const [minimapa, setMinimapa] = usePref<boolean>('minimapa', true);
  const [vista, setVista] = usePref<ModoVista>('vista', 'automatico', MODOS_VISTA);
  const [rendimiento, setRendimiento] = usePref<ModoRendimiento>('rendimiento', 'equilibrado', MODOS_RENDIMIENTO);
  const [avisosNavegador, setAvisosNavegador] = usePref<boolean>('avisos_navegador', false);
  const [burbujas, setBurbujas] = usePref<boolean>('burbujas', true);

  // La vista elegida se le entrega al motor al entrar y cada vez que cambia.
  useEffect(() => {
    fijarVistaEsquema(puente, vista);
    // Al construir, la interfaz se va: el editor siempre trabaja sobre el arte, no sobre el esquema.
    return () => fijarVistaEsquema(puente, 'inmersivo');
  }, [puente, vista]);

  // El rendimiento cambia la interfaz (CSS) y, si el motor lo sabe, también el mundo.
  useEffect(() => {
    document.documentElement.dataset['rendimiento'] = rendimiento;
    ordenesDe(puente).fijarRendimiento?.(rendimiento);
    return () => {
      delete document.documentElement.dataset['rendimiento'];
    };
  }, [puente, rendimiento]);

  return { panelAbierto, setPanelAbierto, minimapa, setMinimapa, vista, setVista, rendimiento, setRendimiento, avisosNavegador, setAvisosNavegador, burbujas, setBurbujas };
}

export type PrefsHud = ReturnType<typeof usePrefsHud>;
