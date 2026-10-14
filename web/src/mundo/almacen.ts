import { useSyncExternalStore } from 'react';

/** Estado compartido y reactivo entre React y el motor del mundo (Phaser). Sin dependencias. */
export interface Almacen<T> {
  get(): T;
  set(cambio: Partial<T> | ((actual: T) => Partial<T>)): void;
  subscribe(escucha: () => void): () => void;
}

export function crearAlmacen<T extends object>(inicial: T): Almacen<T> {
  let estado = inicial;
  const escuchas = new Set<() => void>();
  return {
    get: () => estado,
    set(cambio) {
      const parcial = typeof cambio === 'function' ? cambio(estado) : cambio;
      let hay = false;
      for (const k of Object.keys(parcial) as (keyof T)[]) {
        if (!Object.is(estado[k], parcial[k])) {
          hay = true;
          break;
        }
      }
      if (!hay) return;
      estado = { ...estado, ...parcial };
      for (const e of [...escuchas]) e();
    },
    subscribe(e) {
      escuchas.add(e);
      return () => {
        escuchas.delete(e);
      };
    },
  };
}

/** El selector debe devolver valores simples o referencias estables, nunca objetos nuevos en cada llamada. */
export function useAlmacen<T extends object, R>(almacen: Almacen<T>, selector: (estado: T) => R): R {
  return useSyncExternalStore(
    almacen.subscribe,
    () => selector(almacen.get()),
    () => selector(almacen.get()),
  );
}
