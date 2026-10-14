import { asientosDe, celdasDe, huellaColocada, objetoPorId, type Asiento, type AreaPersonal, type BuscarObjeto, type SalaMapa } from '@ol/shared';
import type { RectCasillas } from './areas';

/** Encontrar el escritorio de una persona, o el libre más cercano. Lógica pura: no sabe de Phaser. */

export interface Quien {
  id: number;
  nombre: string;
  apodo: string;
}

export interface EscritorioHallado {
  asiento: Asiento;
  /** Cómo se llama el puesto, para el aviso «Yendo a tu escritorio». */
  etiqueta: string;
  /** De dónde salió: el puesto asignado a tu cuenta, tu área personal, el puesto con tu nombre o uno libre. */
  origen: 'cuenta' | 'area' | 'nombre' | 'libre';
}

const normalizar = (t: string): string =>
  t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

/** «Ana Ruiz · Data Entry» → «ana ruiz». */
export const nombreDeEtiqueta = (etiqueta: string): string => normalizar(etiqueta.split('·')[0] ?? '');

/**
 * ¿Ese nombre del puesto es de esta persona? Vale el nombre completo, el apodo, o el nombre del puesto como inicio
 * del nombre completo («Camila» en el puesto, «Camila Torres» en la cuenta) y al revés.
 */
export function coincideNombre(nombrePuesto: string, q: Pick<Quien, 'nombre' | 'apodo'>): boolean {
  const p = normalizar(nombrePuesto);
  if (!p) return false;
  const completo = normalizar(q.nombre);
  const apodo = normalizar(q.apodo);
  if (p === completo || (apodo !== '' && p === apodo)) return true;
  if (completo.startsWith(`${p} `) || p.startsWith(`${completo} `)) return true;
  return false;
}

/** ¿Hay un escritorio (de la categoría «puestos») pegado al asiento? Así se distingue una silla de escritorio de una de comedor. */
export function tieneEscritorioAlLado(sala: SalaMapa, a: Asiento, buscar: BuscarObjeto = objetoPorId): boolean {
  for (const c of sala.colocaciones) {
    const o = buscar(c.objeto);
    if (!o || o.categoria !== 'puestos' || o.apoyado) continue;
    for (const [x, y] of celdasDe(huellaColocada(o, c.x, c.y, c.orientacion))) {
      if (Math.abs(x - a.x) + Math.abs(y - a.y) === 1) return true;
    }
  }
  return false;
}

/** «Escritorio de Ana», «Oficina de Ana»...: el nombre de la persona va después del «de». */
const RE_AREA_DE = /^(?:escritorio|oficina|puesto|espacio|mesa) de (.+)$/;

const dentroDe = (r: RectCasillas, x: number, y: number): boolean => x >= r.x && y >= r.y && x < r.x + r.w && y < r.y + r.h;

/**
 * Tu escritorio. En este orden: el puesto asignado a tu cuenta, el área personal que te dieron, el puesto que lleva tu nombre,
 * el área llamada «Escritorio de ...» u «Oficina de ...» con tu nombre y, si no hay nada de eso, el escritorio libre más cercano a `desde`
 * (en píxeles; normalmente donde llegaste). `ocupado` dice si alguien ya está sentado en un asiento.
 */
export function buscarMiEscritorio(sala: SalaMapa, q: Quien, desde: { x: number; y: number }, ocupado: (a: Asiento) => boolean = () => false, buscar: BuscarObjeto = objetoPorId): EscritorioHallado | null {
  const asientos = asientosDe(sala, buscar);
  const deSilla = (colocacion: string): Asiento | undefined => asientos.find((a) => a.colocacion === colocacion);
  const dentroDelArea = (r: RectCasillas): Asiento | undefined => {
    const cx = r.x + r.w / 2;
    const cy = r.y + r.h / 2;
    return asientos
      .filter((a) => dentroDe(r, a.x, a.y) && tieneEscritorioAlLado(sala, a, buscar))
      .sort((a, b) => Math.hypot(a.x + 0.5 - cx, a.y + 0.5 - cy) - Math.hypot(b.x + 0.5 - cx, b.y + 0.5 - cy))[0];
  };
  const etiquetaDe = (colocacion: string): string => sala.puestos.find((p) => p.colocacion === colocacion)?.etiqueta ?? '';

  const porCuenta = sala.puestos.find((p) => p.usuarioId === q.id);
  const aCuenta = porCuenta ? deSilla(porCuenta.colocacion) : undefined;
  if (porCuenta && aCuenta) return { asiento: aCuenta, etiqueta: porCuenta.etiqueta, origen: 'cuenta' };

  for (const area of sala.areas ?? []) {
    if (!area.duenos.includes(q.id)) continue;
    const a = dentroDelArea(area.rect);
    if (a) return { asiento: a, etiqueta: etiquetaDe(a.colocacion) || area.nombre, origen: 'area' };
  }

  for (const p of sala.puestos) {
    if (!coincideNombre(nombreDeEtiqueta(p.etiqueta), q)) continue;
    const a = deSilla(p.colocacion);
    if (a) return { asiento: a, etiqueta: p.etiqueta, origen: 'nombre' };
  }

  for (const area of sala.areas ?? []) {
    const m = RE_AREA_DE.exec(normalizar(area.nombre));
    if (!m || !coincideNombre(m[1] ?? '', q)) continue;
    const a = dentroDelArea(area.rect);
    if (a) return { asiento: a, etiqueta: etiquetaDe(a.colocacion) || area.nombre, origen: 'area' };
  }

  return escritorioLibreMasCercano(sala, desde, ocupado, buscar);
}

/** El escritorio sin dueño más cercano a un punto: una silla con escritorio al lado que ningún puesto reclama y donde no hay nadie sentado. */
export function escritorioLibreMasCercano(sala: SalaMapa, desde: { x: number; y: number }, ocupado: (a: Asiento) => boolean = () => false, buscar: BuscarObjeto = objetoPorId): EscritorioHallado | null {
  const reclamadas = new Set(sala.puestos.filter((p) => p.usuarioId !== null || p.etiqueta.trim() !== '').map((p) => p.colocacion));
  let mejor: Asiento | null = null;
  let mejorD = Infinity;
  for (const a of asientosDe(sala, buscar)) {
    if (reclamadas.has(a.colocacion) || ocupado(a) || !tieneEscritorioAlLado(sala, a, buscar)) continue;
    const d = Math.hypot((a.x + 0.5) * 32 - desde.x, (a.y + 0.5) * 32 - desde.y);
    if (d < mejorD) {
      mejorD = d;
      mejor = a;
    }
  }
  return mejor ? { asiento: mejor, etiqueta: 'Escritorio libre', origen: 'libre' } : null;
}

/** Quien hace doble clic sobre un escritorio quiere sentarse en él: la silla libre pegada a ese escritorio. */
export function sillaDeEscritorio(sala: SalaMapa, escritorio: { x: number; y: number; ancho: number; alto: number }, ocupado: (a: Asiento) => boolean = () => false, buscar: BuscarObjeto = objetoPorId): Asiento | null {
  let mejor: Asiento | null = null;
  let mejorD = Infinity;
  for (const a of asientosDe(sala, buscar)) {
    if (ocupado(a)) continue;
    const dx = Math.max(escritorio.x - a.x, 0, a.x - (escritorio.x + escritorio.ancho - 1));
    const dy = Math.max(escritorio.y - a.y, 0, a.y - (escritorio.y + escritorio.alto - 1));
    if (dx + dy !== 1) continue; // pegada: a una casilla de la huella, sin diagonales
    const d = Math.hypot(a.x - (escritorio.x + escritorio.ancho / 2), a.y - (escritorio.y + escritorio.alto / 2));
    if (d < mejorD) {
      mejorD = d;
      mejor = a;
    }
  }
  return mejor;
}

/** ¿Esta área personal es tuya? Si tu cuenta es dueña, o se llama «Escritorio de ...» u «Oficina de ...» con tu nombre. */
export function esMiArea(area: Pick<AreaPersonal, 'nombre' | 'duenos'>, q: Quien): boolean {
  if (area.duenos.includes(q.id)) return true;
  const m = RE_AREA_DE.exec(normalizar(area.nombre));
  return Boolean(m && coincideNombre(m[1] ?? '', q));
}

/** El escritorio (de la categoría «puestos») que cubre una casilla, con su huella. Sirve para sentarse al tocar el escritorio. */
export function escritorioEnCasilla(sala: SalaMapa, cx: number, cy: number, buscar: BuscarObjeto = objetoPorId): { x: number; y: number; ancho: number; alto: number } | null {
  for (const c of sala.colocaciones) {
    const o = buscar(c.objeto);
    if (!o || o.categoria !== 'puestos' || o.apoyado) continue;
    const h = huellaColocada(o, c.x, c.y, c.orientacion);
    if (cx >= h.x && cy >= h.y && cx < h.x + h.ancho && cy < h.y + h.alto) return { x: h.x, y: h.y, ancho: h.ancho, alto: h.alto };
  }
  return null;
}
