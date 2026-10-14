import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Permiso, RespuestaSesion, UsuarioPublico } from '@ol/shared';
import { EVENTO_SESION_TERMINADA, api, token } from '../api';
import { limpiarCacheFotos } from '../util/cacheFotos';

interface ContextoSesion {
  usuario: UsuarioPublico | null;
  /** true mientras se comprueba si el token guardado sigue valiendo. */
  cargando: boolean;
  /** Mensaje para el ingreso cuando la sesión terminó sola. */
  aviso: string | null;
  ingresar(usuario: string, clave: string): Promise<UsuarioPublico>;
  salir(): Promise<void>;
  /** Después de cambiar la clave: llega token nuevo (el anterior ya no sirve). */
  reemplazarSesion(r: RespuestaSesion): void;
  limpiarAviso(): void;
  /** Cambia los datos de la persona en pantalla (por ejemplo, después de guardar su personaje). */
  actualizarUsuario(u: UsuarioPublico): void;
  tiene(permiso: Permiso): boolean;
}

const Ctx = createContext<ContextoSesion | null>(null);

export function SesionProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioPublico | null>(null);
  const [cargando, setCargando] = useState<boolean>(() => token.leer() !== null);
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    if (token.leer() === null) return;
    let vigente = true;
    api<{ usuario: UsuarioPublico }>('/auth/yo')
      .then((r) => vigente && setUsuario(r.usuario))
      .catch(() => token.borrar())
      .finally(() => vigente && setCargando(false));
    return () => {
      vigente = false;
    };
  }, []);

  useEffect(() => {
    const alTerminar = () => {
      limpiarCacheFotos();
      setUsuario(null);
      setAviso('Tu sesión terminó. Ingresa de nuevo para continuar.');
    };
    window.addEventListener(EVENTO_SESION_TERMINADA, alTerminar);
    return () => window.removeEventListener(EVENTO_SESION_TERMINADA, alTerminar);
  }, []);

  const ingresar = useCallback(async (nombre: string, clave: string) => {
    const r = await api<RespuestaSesion>('/auth/login', { metodo: 'POST', cuerpo: { usuario: nombre, clave }, sinCierreDeSesion: true });
    token.guardar(r.token);
    setAviso(null);
    setUsuario(r.usuario);
    return r.usuario;
  }, []);

  const salir = useCallback(async () => {
    try {
      await api('/auth/salir', { metodo: 'POST' });
    } catch {
      /* si el servidor no responde, igual se cierra aquí */
    }
    token.borrar();
    limpiarCacheFotos();
    setUsuario(null);
    setAviso(null);
  }, []);

  const reemplazarSesion = useCallback((r: RespuestaSesion) => {
    token.guardar(r.token);
    setUsuario(r.usuario);
  }, []);

  const valor = useMemo<ContextoSesion>(
    () => ({
      usuario,
      cargando,
      aviso,
      ingresar,
      salir,
      reemplazarSesion,
      limpiarAviso: () => setAviso(null),
      actualizarUsuario: setUsuario,
      tiene: (p) => usuario?.permisos.includes(p) ?? false,
    }),
    [usuario, cargando, aviso, ingresar, salir, reemplazarSesion],
  );

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useSesion(): ContextoSesion {
  const c = useContext(Ctx);
  if (!c) throw new Error('useSesion debe usarse dentro de SesionProvider');
  return c;
}
