/**
 * Enlaces profundos a un lugar de la oficina: `/oficina?sala=<id de la zona>`. Quien lo abre entra a la oficina y ve la tarjeta
 * de ese lugar (con «Ir a»). No lleva nada personal: solo el id de la zona.
 */

export const PARAMETRO_SALA = 'sala';

export function enlaceDeZona(id: string, origen: string = window.location.origin): string {
  return `${origen}/oficina?${PARAMETRO_SALA}=${encodeURIComponent(id)}`;
}

/** El id de zona que trae la dirección (`?sala=...`), o null si no hay o es raro. */
export function zonaDeLaDireccion(busqueda: string): string | null {
  const v = new URLSearchParams(busqueda).get(PARAMETRO_SALA);
  return v && v.length <= 60 ? v : null;
}
