import { obtenerBlob } from '../api';
import { claveFoto, rutaFoto } from './foto';

/**
 * Fotos de perfil ya descargadas, por (persona, versión). Un <img> no manda la cabecera de sesión, así que la
 * imagen se pide con fetch y se muestra desde un blob. Aquí se guarda una sola vez por versión; si alguien cambia
 * su foto, la versión cambia y se pide la nueva. Se vacía al cerrar la sesión.
 */

const listas = new Map<string, string>();
const enCurso = new Map<string, Promise<string | null>>();
const fallidas = new Map<string, number>();
const REINTENTO_MS = 30_000;
let generacion = 0;

export function fotoEnCache(id: number, version: number): string | null {
  return listas.get(claveFoto(id, version)) ?? null;
}

/** La dirección local (blob:) de la foto, o `null` si no se pudo cargar. Nunca lanza error. */
export function cargarFoto(id: number, version: number): Promise<string | null> {
  const k = claveFoto(id, version);
  const lista = listas.get(k);
  if (lista) return Promise.resolve(lista);
  const pendiente = enCurso.get(k);
  if (pendiente) return pendiente;
  const fallo = fallidas.get(k);
  if (fallo !== undefined && Date.now() - fallo < REINTENTO_MS) return Promise.resolve(null);

  const miGeneracion = generacion;
  const p = obtenerBlob(rutaFoto(id, version))
    .then((blob) => {
      const url = URL.createObjectURL(blob);
      if (miGeneracion !== generacion) {
        URL.revokeObjectURL(url);
        return null;
      }
      listas.set(k, url);
      return url;
    })
    .catch(() => {
      if (miGeneracion === generacion) fallidas.set(k, Date.now());
      return null;
    })
    .finally(() => {
      if (enCurso.get(k) === p) enCurso.delete(k);
    });
  enCurso.set(k, p);
  return p;
}

/** Olvida todas las fotos (al cerrar sesión o cuando la sesión termina sola). */
export function limpiarCacheFotos(): void {
  generacion++;
  for (const url of listas.values()) URL.revokeObjectURL(url);
  listas.clear();
  enCurso.clear();
  fallidas.clear();
}

/** Cuando alguien cambia su foto, las versiones anteriores de esa persona ya no sirven. */
export function olvidarFotosDe(id: number, conservar?: number): void {
  const prefijo = `${Math.trunc(id)}:`;
  for (const [k, url] of listas) {
    if (k.startsWith(prefijo) && k !== claveFoto(id, conservar ?? -1)) {
      URL.revokeObjectURL(url);
      listas.delete(k);
    }
  }
}
