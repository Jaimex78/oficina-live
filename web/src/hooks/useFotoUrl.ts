import { useEffect, useState } from 'react';
import { cargarFoto, fotoEnCache } from '../util/cacheFotos';
import { claveFoto, tieneFoto } from '../util/foto';

/** La dirección local de la foto de una persona (o `null` mientras carga, si no tiene o si falla). */
export function useFotoUrl(id: number, version: number | null | undefined): string | null {
  const v = tieneFoto(version) ? version : 0;
  const clave = claveFoto(id, v);
  const [cargada, setCargada] = useState<{ clave: string; url: string | null } | null>(null);

  useEffect(() => {
    if (v === 0 || fotoEnCache(id, v)) return;
    let vigente = true;
    void cargarFoto(id, v).then((url) => vigente && setCargada({ clave, url }));
    return () => {
      vigente = false;
    };
  }, [id, v, clave]);

  if (v === 0) return null;
  return fotoEnCache(id, v) ?? (cargada?.clave === clave ? cargada.url : null);
}
