import { useCallback, useMemo, useRef } from 'react';
import { api, ErrorApi } from '../api';
import { useAvisos } from '../componentes/Avisos';
import { leerPref } from './preferencias';
import { aEnlaceApp, CHAT_GENERAL, copiarTexto, esHttps } from './teams';
import type { PedidoTeams } from './teams-contexto';

export type ModoAbrirTeams = 'navegador' | 'app';
export const MODOS_TEAMS: readonly ModoAbrirTeams[] = ['navegador', 'app'];
export const CLAVE_MODO_TEAMS = 'teams_abrir';

/** Dónde abre Teams esta persona: se lee al hacer clic, así que un cambio en Configuración vale de inmediato. */
export const modoTeams = (): ModoAbrirTeams => leerPref<ModoAbrirTeams>(CLAVE_MODO_TEAMS, 'navegador', MODOS_TEAMS);

export interface EnlaceTeamsServidor {
  url: string;
  urlApp: string;
  titulo: string;
  invitados: number;
}

/** El servidor arma el enlace con los correos de los invitados: aquí solo llega el enlace, nunca la lista de correos. */
export const pedirEnlaceTeams = (p: PedidoTeams): Promise<EnlaceTeamsServidor> => api<EnlaceTeamsServidor>('/teams/enlace', { metodo: 'POST', cuerpo: p });

/**
 * Abre un enlace de Teams. En el navegador, la pestaña se abre en el acto (con el clic) y se llena cuando llega el enlace:
 * así el bloqueador de ventanas no la frena. En la aplicación se usa el esquema `msteams://`.
 */
export async function abrirTeams(obtener: () => Promise<{ url: string; urlApp: string }>, modo: ModoAbrirTeams = modoTeams()): Promise<void> {
  const ventana = modo === 'navegador' ? window.open('', '_blank') : null;
  try {
    const e = await obtener();
    if (modo === 'app') window.location.href = e.urlApp;
    else if (ventana) {
      ventana.opener = null;
      ventana.location.href = e.url;
    } else window.open(e.url, '_blank', 'noopener,noreferrer');
  } catch (err) {
    ventana?.close();
    throw err;
  }
}

/**
 * Las acciones de Teams de la interfaz, con los avisos ya resueltos. Todas piden el enlace al servidor, salvo el chat general
 * y la reunión de una sala (que ya trae su enlace).
 */
export function useTeams() {
  const avisos = useAvisos();
  const ocupado = useRef(false);

  const decir = useCallback(
    (e: unknown) => {
      if (e instanceof ErrorApi && e.estado === 409) avisos.info(e.message);
      else avisos.error(e instanceof ErrorApi ? e.message : 'No pude armar el enlace de Teams. Intenta de nuevo.');
    },
    [avisos],
  );

  const abrir = useCallback(
    async (p: PedidoTeams) => {
      if (ocupado.current) return;
      ocupado.current = true;
      try {
        await abrirTeams(() => pedirEnlaceTeams(p));
      } catch (e) {
        decir(e);
      } finally {
        ocupado.current = false;
      }
    },
    [decir],
  );

  const copiar = useCallback(
    async (p: PedidoTeams) => {
      try {
        const e = await pedirEnlaceTeams(p);
        avisos.info((await copiarTexto(e.url)) ? 'Copié el enlace de Teams.' : 'No pude copiar el enlace. Cópialo a mano.');
      } catch (e) {
        decir(e);
      }
    },
    [avisos, decir],
  );

  const abrirGeneral = useCallback(() => {
    void abrirTeams(() => Promise.resolve(CHAT_GENERAL)).catch(decir);
  }, [decir]);

  /** La reunión real de una sala (su `enlaceTeams`, que es un enlace https de reunión). */
  const abrirReunion = useCallback(
    (enlace: string) => {
      if (!esHttps(enlace)) return;
      void abrirTeams(() => Promise.resolve({ url: enlace, urlApp: aEnlaceApp(enlace) })).catch(decir);
    },
    [decir],
  );

  const chatCon = useCallback((id: number, lugar?: string) => abrir({ tipo: 'chat', personas: [id], ...(lugar ? { lugar } : {}) }), [abrir]);
  const llamarA = useCallback((id: number) => abrir({ tipo: 'llamada', personas: [id] }), [abrir]);

  return useMemo(() => ({ abrir, copiar, abrirGeneral, abrirReunion, chatCon, llamarA }), [abrir, copiar, abrirGeneral, abrirReunion, chatCon, llamarA]);
}

export type AccionesTeams = ReturnType<typeof useTeams>;
