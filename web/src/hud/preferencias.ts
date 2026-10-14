import { useCallback, useState } from 'react';

/** Preferencias de la interfaz que se recuerdan en este navegador. Si no hay almacenamiento, duran hasta recargar. */
const PREFIJO = 'ol_hud_';

export function leerPref<T extends string | boolean>(clave: string, defecto: T, validos?: readonly T[]): T {
  try {
    const crudo = localStorage.getItem(PREFIJO + clave);
    if (crudo === null) return defecto;
    const v = (typeof defecto === 'boolean' ? crudo === '1' : crudo) as T;
    if (validos && !validos.includes(v)) return defecto;
    return v;
  } catch {
    return defecto;
  }
}

export function guardarPref(clave: string, valor: string | boolean): void {
  try {
    localStorage.setItem(PREFIJO + clave, typeof valor === 'boolean' ? (valor ? '1' : '0') : valor);
  } catch {
    /* sin almacenamiento */
  }
}

export function usePref<T extends string | boolean>(clave: string, defecto: T, validos?: readonly T[]): [T, (v: T) => void] {
  const [valor, setValor] = useState<T>(() => leerPref(clave, defecto, validos));
  const fijar = useCallback(
    (v: T) => {
      setValor(v);
      guardarPref(clave, v);
    },
    [clave],
  );
  return [valor, fijar];
}
