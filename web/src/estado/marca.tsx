import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { ConfigPublica } from '@ol/shared';
import { api } from '../api';
import { hexARgb } from '../util/formato';
import type { Rgb } from '../hooks/useLucesInteractivas';
import { mezclar } from '../util/formato';

const POR_DEFECTO: ConfigPublica = {
  nombre: 'Oficina Live',
  colorPrimario: '#EF3B3A',
  colorSecundario: '#1C1C1E',
  solicitudesActivas: true,
  claveMin: 10,
  version: '',
};

interface ContextoMarca {
  marca: ConfigPublica;
  /** Colores de las luces del ingreso, derivados del color principal. */
  paletaLuces: Rgb[];
  refrescar(): Promise<void>;
}

const Ctx = createContext<ContextoMarca | null>(null);

function paletaDesde(hex: string): Rgb[] {
  const base = hexARgb(hex);
  return [base, mezclar(base, [255, 255, 255], 0.28), mezclar(base, [0, 0, 0], 0.22), [168, 168, 178]];
}

/** Nombre y colores elegidos en Configuración. Se aplican como variables CSS en toda la plataforma. */
export function MarcaProvider({ children }: { children: ReactNode }) {
  const [marca, setMarca] = useState<ConfigPublica>(POR_DEFECTO);

  const refrescar = useCallback(async () => {
    try {
      setMarca(await api<ConfigPublica>('/publico/config'));
    } catch {
      /* se queda con la marca por defecto */
    }
  }, []);

  useEffect(() => {
    void refrescar();
  }, [refrescar]);

  useEffect(() => {
    const raiz = document.documentElement.style;
    raiz.setProperty('--primario', marca.colorPrimario);
    raiz.setProperty('--secundario', marca.colorSecundario);
    raiz.setProperty('--primario-rgb', hexARgb(marca.colorPrimario).join(', '));
    document.title = marca.nombre;
  }, [marca]);

  const valor = useMemo<ContextoMarca>(() => ({ marca, paletaLuces: paletaDesde(marca.colorPrimario), refrescar }), [marca, refrescar]);
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useMarca(): ContextoMarca {
  const c = useContext(Ctx);
  if (!c) throw new Error('useMarca debe usarse dentro de MarcaProvider');
  return c;
}
