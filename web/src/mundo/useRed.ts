import { useEffect, useRef } from 'react';
import { EVENTO_SESION_TERMINADA, token } from '../api';
import type { Puente } from './puente';
import { ClienteRed, urlDePresencia } from './red';

export interface OpcionesUseRed {
  /** Se publicó otra versión del mapa (o la bienvenida trae una distinta). Número 0: el servidor no tiene versión. */
  alMapa?: (numero: number) => void;
}

/**
 * Conecta tu sesión al servidor de presencia mientras la oficina está abierta: tú apareces para los demás,
 * ves a quienes están, y tus movimientos, tu estado y tus reacciones viajan por el WebSocket.
 * Todo lo que llega se escribe en `puente.vivo`; los avisos salen por `puente.alRed`, `puente.alChat` y compañía.
 */
export function useRed(puente: Puente | null, opciones: OpcionesUseRed = {}): void {
  // Las opciones cambian en cada render; el cliente solo debe crearse una vez por puente.
  const alMapa = useRef(opciones.alMapa);
  alMapa.current = opciones.alMapa;

  useEffect(() => {
    if (!puente) return;
    const p = puente;
    const cliente = new ClienteRed({
      vivo: p.vivo,
      token: () => token.leer(),
      url: urlDePresencia(),
      alEstado: (info) => {
        p.almacen.set({ red: info.estado, redMotivo: info.motivo ?? null });
        p.alRed?.(info);
      },
      alMapa: (n) => alMapa.current?.(n),
      alChat: (m) => p.alChat?.(m),
      alSaludo: (m) => p.alSaludo?.(m),
      alResultadoSaludo: (m) => p.alResultadoSaludo?.(m),
      alError: (m) => p.alErrorRed?.(m),
      alBienvenida: (_sala, ajustes) => {
        p.ajustes = ajustes;
        p.alAjustes?.(ajustes);
        // Quedaste donde el servidor te puso: la cámara y cualquier camino en curso deben enterarse (el motor escucha a `vivo`).
        p.ordenes?.centrarEnMi();
      },
      alSesionTerminada: () => {
        token.borrar();
        window.dispatchEvent(new Event(EVENTO_SESION_TERMINADA));
      },
    });
    p.alMover = (x, y, dir, anim) => cliente.mover(x, y, dir, anim);
    p.alReaccion = (emoji) => cliente.reaccionar(emoji);
    p.red = {
      get estado() {
        return cliente.estado;
      },
      cambiarEstado: (c) => cliente.cambiarEstado(c),
      chat: (t) => cliente.chat(t),
      saludar: (a) => cliente.saludar(a),
      enfocar: (pedido) => cliente.enfocar(pedido),
      bloquearSala: (zona, bloqueada) => cliente.bloquearSala(zona, bloqueada),
      reintentar: () => cliente.reintentar(),
    };
    cliente.iniciar();
    return () => {
      cliente.detener();
      if (p.red) delete p.red;
      delete p.alMover;
      delete p.alReaccion;
    };
  }, [puente]);
}
