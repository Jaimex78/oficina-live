import { useCallback, useEffect, useState } from 'react';

/** Carga datos al montar y cuando cambian las dependencias. Entrega estado de carga, error y una función para reintentar. */
export function useCarga<T>(cargador: () => Promise<T>, dependencias: readonly unknown[]) {
  const [datos, setDatos] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    setError(null);
    cargador()
      .then((d) => vigente && setDatos(d))
      .catch((e: unknown) => vigente && setError(e instanceof Error ? e.message : 'No se pudo cargar. Intenta de nuevo.'))
      .finally(() => vigente && setCargando(false));
    return () => {
      vigente = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencias, version]);

  const recargar = useCallback(() => setVersion((v) => v + 1), []);
  return { datos, error, cargando, recargar, poner: setDatos };
}

/** Valor que se actualiza solo después de que la persona deja de escribir. */
export function useRetardo<T>(valor: T, ms = 250): T {
  const [retardado, setRetardado] = useState(valor);
  useEffect(() => {
    const t = setTimeout(() => setRetardado(valor), ms);
    return () => clearTimeout(t);
  }, [valor, ms]);
  return retardado;
}
