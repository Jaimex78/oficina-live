import { CASILLA } from './arte';
import { huellaDe, objetoPorId } from './inventario';
import type { SalaMapa } from './mapa';
import { celdasDe, dentro, huellaColocada, indiceDe, type BuscarObjeto } from './oficina';

/** Profundidades fijas del mundo: el piso va debajo de todo, las luces y las etiquetas encima. */
export const PROF = {
  piso: -1_000_000,
  suelo: -500_000,
  sobre: 500_000,
  luces: 800_000,
  marcas: 900_000,
  etiquetas: 950_000,
} as const;

/**
 * Orden de dibujo de cada colocación (en el mismo orden que `sala.colocaciones`): se ordenan por su borde inferior,
 * así una persona pasa por delante de lo que queda al norte de sus pies y por detrás de lo que queda al sur.
 * Lo apoyado va justo encima de lo que lo sostiene, y lo colgado justo encima de su pared.
 * El motor del navegador y el compositor del arte usan esta misma función.
 */
export function profundidades(sala: SalaMapa, buscar: BuscarObjeto = objetoPorId): number[] {
  const ix = indiceDe(sala, buscar);
  const base = new Map<number, number>();
  const prof: number[] = [];
  sala.colocaciones.forEach((c, i) => {
    const o = buscar(c.objeto);
    if (!o) {
      prof[i] = 0;
      return;
    }
    const h = huellaDe(o, c.orientacion);
    const fondo = (c.y + h.alto) * CASILLA;
    let p = fondo;
    if (o.capa === 'suelo') p = PROF.suelo + fondo * 0.01;
    else if (o.capa === 'sobre' && !o.apoyado && !o.montado) p = PROF.sobre + fondo;
    else if (!o.pared && !o.apoyado && !o.montado && o.bloquea.length === 0) p = fondo - CASILLA / 2;
    prof[i] = p;
    if (!o.apoyado && !o.montado) base.set(i, p);
  });
  sala.colocaciones.forEach((c, i) => {
    const o = buscar(c.objeto);
    if (!o || (!o.apoyado && !o.montado)) return;
    let mejor = -Infinity;
    for (const [x, y] of celdasDe(huellaColocada(o, c.x, c.y, c.orientacion))) {
      if (!dentro(sala, x, y)) continue;
      const k = y * sala.ancho + x;
      if (o.montado) {
        const pared = ix.pared[k];
        if (pared !== undefined && pared >= 0) mejor = Math.max(mejor, base.get(pared) ?? -Infinity);
      } else {
        for (const idx of ix.ocupa.get(k) ?? []) mejor = Math.max(mejor, base.get(idx) ?? -Infinity);
      }
    }
    const extra = o.capa === 'sobre' ? PROF.sobre : 0;
    if (mejor > -Infinity) prof[i] = mejor + 0.5 + extra;
    else prof[i] = extra + (prof[i] ?? 0);
  });
  return prof;
}
