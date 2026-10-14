/**
 * Objetos apoyados sobre muebles: qué mueble los sostiene en una sala y dónde se dibujan.
 * La geometría vive en `superficies.ts`; aquí se mira la sala.
 */

import type { Orientacion } from './arte';
import { objetoPorId } from './inventario';
import type { SalaMapa } from './mapa';
import { celdasDe, huellaColocada, indiceDe, type BuscarObjeto } from './oficina';
import { apoyarSobre, tapaCubreCasilla, tieneSuperficie, type MuebleBajo, type ResultadoApoyo } from './superficies';
import type { ObjetoCatalogo } from './arte';

export interface Apoyo {
  /** Id de la colocación del mueble que lo sostiene. */
  sobre: string;
  dx: number;
  dy: number;
}

export type ResultadoSoporte = ({ ok: true } & Apoyo) | { ok: false; motivo: string; sinMueble?: boolean };

const SIN_MUEBLE = 'Ponlo sobre una mesa o un escritorio.';

/**
 * Busca el mueble con superficie bajo todas las casillas del objeto y calcula su posición. `ignorar` son colocaciones que
 * no cuentan (la que se está moviendo).
 */
export function soporteDe(sala: SalaMapa, o: ObjetoCatalogo, x: number, y: number, orientacion: Orientacion, ignorar: ReadonlySet<string> = new Set(), buscar: BuscarObjeto = objetoPorId): ResultadoSoporte {
  const ix = indiceDe(sala, buscar);
  const celdas = celdasDe(huellaColocada(o, x, y, orientacion));
  let candidatos: { id: string; m: MuebleBajo }[] | null = null;
  for (const [cx, cy] of celdas) {
    if (cx < 0 || cy < 0 || cx >= sala.ancho || cy >= sala.alto) return { ok: false, motivo: SIN_MUEBLE, sinMueble: true };
    const aqui: { id: string; m: MuebleBajo }[] = [];
    for (const i of ix.ocupa.get(cy * sala.ancho + cx) ?? []) {
      const c = sala.colocaciones[i];
      const m = c ? buscar(c.objeto) : undefined;
      if (!c || !m || ignorar.has(c.id) || !tieneSuperficie(m)) continue;
      const mueble: MuebleBajo = { objeto: m, x: c.x, y: c.y, orientacion: c.orientacion };
      if (tapaCubreCasilla(mueble, cx, cy)) aqui.push({ id: c.id, m: mueble });
    }
    candidatos = candidatos === null ? aqui : candidatos.filter((p) => aqui.some((q) => q.id === p.id));
    if (candidatos.length === 0) return { ok: false, motivo: SIN_MUEBLE, sinMueble: true };
  }
  let ultimo: ResultadoApoyo = { ok: false, motivo: SIN_MUEBLE };
  for (const { id, m } of candidatos ?? []) {
    const r = apoyarSobre(o, x, y, orientacion, m);
    if (r.ok) return { ok: true, sobre: id, dx: r.dx, dy: r.dy };
    ultimo = r;
  }
  return ultimo.ok ? { ok: false, motivo: SIN_MUEBLE, sinMueble: true } : { ok: false, motivo: ultimo.motivo };
}

const cache = new WeakMap<SalaMapa, Map<string, Apoyo>>();

/**
 * Posición automática de cada objeto apoyado de la sala (por id de colocación). Los que no tienen mueble debajo o no caben
 * no aparecen: se dibujan donde estaban y la Revisión avisa. No cambia nada de lo guardado: se calcula al dibujar.
 */
export function apoyosDe(sala: SalaMapa, buscar: BuscarObjeto = objetoPorId): Map<string, Apoyo> {
  const usable = buscar === objetoPorId;
  if (usable) {
    const previo = cache.get(sala);
    if (previo) return previo;
  }
  const r = new Map<string, Apoyo>();
  for (const c of sala.colocaciones) {
    const o = buscar(c.objeto);
    if (!o?.apoyado) continue;
    const s = soporteDe(sala, o, c.x, c.y, c.orientacion, new Set([c.id]), buscar);
    if (s.ok) r.set(c.id, { sobre: s.sobre, dx: s.dx, dy: s.dy });
  }
  if (usable) cache.set(sala, r);
  return r;
}


/**
 * Dónde se podría poner de nuevo un objeto apoyado que está mal (sin mueble debajo o que no cabe): la casilla libre más
 * cercana sobre la tapa de algún mueble donde sí cabe. null si no hay ninguna.
 */
export function reubicarApoyado(sala: SalaMapa, c: { id: string; objeto: string; x: number; y: number; orientacion: Orientacion }, buscar: BuscarObjeto = objetoPorId): { x: number; y: number } | null {
  const o = buscar(c.objeto);
  if (!o?.apoyado || o.montado) return null;
  const ix = indiceDe(sala, buscar);
  const ignorar = new Set([c.id]);
  const libre = (k: number) => !(ix.apoyados.get(k) ?? []).some((i) => sala.colocaciones[i]?.id !== c.id);
  let mejor: { d: number; x: number; y: number } | null = null;
  for (const m of sala.colocaciones) {
    const om = buscar(m.objeto);
    if (!om || om.apoyado || om.montado || !tieneSuperficie(om)) continue;
    for (const [cx, cy] of celdasDe(huellaColocada(om, m.x, m.y, m.orientacion))) {
      const d = Math.abs(cx - c.x) + Math.abs(cy - c.y);
      if (mejor && d >= mejor.d) continue;
      const celdas = celdasDe(huellaColocada(o, cx, cy, c.orientacion));
      if (!celdas.every(([x, y]) => x >= 0 && y >= 0 && x < sala.ancho && y < sala.alto && libre(y * sala.ancho + x))) continue;
      if (!soporteDe(sala, o, cx, cy, c.orientacion, ignorar, buscar).ok) continue;
      mejor = { d, x: cx, y: cy };
    }
  }
  return mejor ? { x: mejor.x, y: mejor.y } : null;
}
