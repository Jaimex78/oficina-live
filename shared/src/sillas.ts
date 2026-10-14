/**
 * Sillas automáticas: «Poner sillas alrededor» de una mesa o un escritorio.
 *
 * Reglas (también en `arte/GUIA-ARMADO-REALISTA.md`):
 *  - Las sillas van en las casillas pegadas a la huella de la mesa (sin hueco), nunca en las esquinas.
 *  - Quedan orientadas hacia la mesa: arriba de la mesa miran al sur («S»), abajo al norte («N»), a la izquierda al este
 *    («E») y a la derecha al oeste («O»).
 *  - Siempre simétricas y centradas en su lado:
 *      · «todos» y «largos»: una silla por casilla del lado (lado par = pares de sillas, lado impar = pares y una al centro).
 *      · «uno» (una por lado): lado impar = una silla al centro; lado par = el par central.
 *      · Mesas redondas con huella par (2x2, 4x4): no hay casilla central, así que «uno» usa la variante simétrica más
 *        cercana, un molinete de cuatro sillas (una por lado, cada una corrida media mesa en el sentido del reloj): queda
 *        igual al girarlo 90 grados. Con «todos» van pares en cada lado.
 *  - Se omiten las casillas con pared, puerta, otro objeto, sin piso o fuera de la sala (la lista de omitidas explica cada una).
 */

import type { Direccion, ObjetoCatalogo, Orientacion } from './arte';
import { objetoPorId } from './inventario';
import type { Colocacion, SalaMapa } from './mapa';
import { colocar, esFallo, evaluarColocacion, huellaColocada, type BuscarObjeto, type Fallo } from './oficina';
import { tapaS } from './superficies';

export type LadosSillas = 'todos' | 'largos' | 'uno' | 'ninguno';

export interface OpcionesSillas {
  lados?: LadosSillas;
  /** Id del objeto silla. Por defecto la silla de comedor. */
  silla?: string;
  variante?: string;
  /** Genera el id de cada silla (para plantillas con ids estables). Sin esto, ids al azar como en el editor. */
  ids?: () => string;
}

export interface PlanSilla {
  x: number;
  y: number;
  /** Hacia dónde mira la silla (hacia la mesa). */
  orientacion: Direccion;
  lado: 'arriba' | 'abajo' | 'izquierda' | 'derecha';
}

export interface SillaOmitida {
  x: number;
  y: number;
  motivo: string;
}

export const SILLA_POR_DEFECTO = 'silla-comedor';

const AFUERA = /columpio|perezosa|camping|jardin|adirondack|plegable|exterior/;

/** Sillas que se ofrecen para rodear una mesa: 1x1, con las cuatro orientaciones. Incluye butacas. */
export function esAsientoParaMesa(o: ObjetoCatalogo): boolean {
  return o.interaccion === 'sentarse' && o.ancho === 1 && o.alto === 1 && !o.obsoleto && o.orientaciones.includes('N') && o.orientaciones.includes('S') && /^(silla-|butaca)/.test(o.id) && !AFUERA.test(o.id);
}

/** Silla de mesa propiamente dicha (comedor, reunión, oficina): se espera junto a una mesa o escritorio. No aplica a butacas, sofás ni puffs. */
export function esSillaDeMesa(o: ObjetoCatalogo): boolean {
  return o.interaccion === 'sentarse' && o.ancho === 1 && o.alto === 1 && /^silla-/.test(o.id) && !AFUERA.test(o.id) && !/^silla-(espacial|barcelona|modernista)/.test(o.id) && o.orientaciones.includes('N');
}

/** ¿Es una mesa o un escritorio al que se le ponen sillas? Los que tienen superficie, salvo lo que se pega a la pared. */
export function esMesaParaSillas(o: ObjetoCatalogo): boolean {
  if (o.apoyado || o.montado || o.pared || o.interaccion === 'sentarse') return false;
  if (!/^(mesa-|escritorio|mesa$)/.test(o.id) && o.categoria !== 'mesas') return false;
  return tapaS(o) !== null;
}

export const esRedonda = (o: ObjetoCatalogo): boolean => tapaS(o)?.forma === 'elipse';

const FRENTE: Record<PlanSilla['lado'], Direccion> = { arriba: 'S', abajo: 'N', izquierda: 'E', derecha: 'O' };

/** Qué casillas de un lado de `n` casillas llevan silla. */
function indices(n: number, lados: LadosSillas, lado: PlanSilla['lado'], redondaPar: boolean): number[] {
  const todas = Array.from({ length: n }, (_, i) => i);
  if (lados === 'ninguno') return [];
  if (lados === 'todos' || lados === 'largos') return todas;
  if (n % 2 === 1) return [(n - 1) / 2];
  if (redondaPar) return [lado === 'arriba' || lado === 'derecha' ? n / 2 - 1 : n / 2];
  return [n / 2 - 1, n / 2];
}

export interface ResultadoPlan {
  sillas: PlanSilla[];
  omitidas: SillaOmitida[];
}

/** Dónde irían las sillas de una mesa, sin tocar la sala. */
export function planSillas(sala: SalaMapa, mesa: Colocacion, opciones: OpcionesSillas = {}, buscar: BuscarObjeto = objetoPorId): ResultadoPlan | Fallo {
  const om = buscar(mesa.objeto);
  if (!om || !esMesaParaSillas(om)) return { error: 'A este objeto no se le ponen sillas.' };
  const so = buscar(opciones.silla ?? SILLA_POR_DEFECTO);
  if (!so || so.interaccion !== 'sentarse' || !so.orientaciones.includes('N')) return { error: 'Esa silla no existe o no sirve para una mesa.' };
  const lados = opciones.lados ?? (esRedonda(om) ? 'uno' : 'todos');
  const h = huellaColocada(om, mesa.x, mesa.y, mesa.orientacion);
  const ladosAUsar: PlanSilla['lado'][] = lados === 'largos' ? (h.ancho >= h.alto ? ['arriba', 'abajo'] : ['izquierda', 'derecha']) : ['arriba', 'derecha', 'abajo', 'izquierda'];
  const redondaPar = esRedonda(om) && h.ancho % 2 === 0 && h.alto % 2 === 0;
  const sillas: PlanSilla[] = [];
  const omitidas: SillaOmitida[] = [];
  for (const lado of ladosAUsar) {
    const horizontal = lado === 'arriba' || lado === 'abajo';
    const n = horizontal ? h.ancho : h.alto;
    for (const i of indices(n, lados, lado, redondaPar)) {
      const x = horizontal ? h.x + i : lado === 'izquierda' ? h.x - 1 : h.x + h.ancho;
      const y = !horizontal ? h.y + i : lado === 'arriba' ? h.y - 1 : h.y + h.alto;
      sillas.push({ x, y, orientacion: FRENTE[lado], lado });
    }
  }
  // Se prueba cada casilla con las reglas de colocación normales; lo que no cabe se omite con su motivo.
  const buenas: PlanSilla[] = [];
  for (const s of sillas) {
    const ev = evaluarColocacion(sala, so, s.x, s.y, s.orientacion, { buscar });
    if (ev.ok) buenas.push(s);
    else omitidas.push({ x: s.x, y: s.y, motivo: ev.motivo });
  }
  return { sillas: buenas, omitidas };
}

/** Pone las sillas alrededor de una mesa. Devuelve la sala nueva, las sillas puestas y las casillas omitidas. */
export function sillasAlrededor(sala: SalaMapa, mesaId: string, opciones: OpcionesSillas = {}, buscar: BuscarObjeto = objetoPorId): { sala: SalaMapa; puestas: Colocacion[]; omitidas: SillaOmitida[] } | Fallo {
  const mesa = sala.colocaciones.find((c) => c.id === mesaId);
  if (!mesa) return { error: 'Esa mesa ya no está.' };
  const plan = planSillas(sala, mesa, opciones, buscar);
  if (esFallo(plan)) return plan;
  const silla = opciones.silla ?? SILLA_POR_DEFECTO;
  let actual = sala;
  const puestas: Colocacion[] = [];
  for (const s of plan.sillas) {
    const r = colocar(actual, { objeto: silla, x: s.x, y: s.y, orientacion: s.orientacion, variante: opciones.variante ?? 'base', ...(opciones.ids ? { id: opciones.ids() } : {}) }, buscar);
    if (esFallo(r)) {
      plan.omitidas.push({ x: s.x, y: s.y, motivo: r.error });
      continue;
    }
    actual = r.sala;
    puestas.push(r.colocacion);
  }
  return { sala: actual, puestas, omitidas: plan.omitidas };
}

/** Lado de la mesa en que está una casilla pegada a ella, o null si no está pegada (las esquinas no cuentan). */
export function ladoPegado(h: { x: number; y: number; ancho: number; alto: number }, x: number, y: number): PlanSilla['lado'] | null {
  const dentroX = x >= h.x && x < h.x + h.ancho;
  const dentroY = y >= h.y && y < h.y + h.alto;
  if (dentroX && y === h.y - 1) return 'arriba';
  if (dentroX && y === h.y + h.alto) return 'abajo';
  if (dentroY && x === h.x - 1) return 'izquierda';
  if (dentroY && x === h.x + h.ancho) return 'derecha';
  return null;
}

/** «Sus» sillas: asientos de mesa pegados a la mesa y mirando hacia ella. Se calcula por cercanía; no se guarda nada. */
export function sillasDeMesa(sala: SalaMapa, mesa: Colocacion, buscar: BuscarObjeto = objetoPorId): Colocacion[] {
  const om = buscar(mesa.objeto);
  if (!om || !esMesaParaSillas(om)) return [];
  const h = huellaColocada(om, mesa.x, mesa.y, mesa.orientacion);
  return sala.colocaciones.filter((c) => {
    const o = buscar(c.objeto);
    if (!o || !(esAsientoParaMesa(o) || esSillaDeMesa(o))) return false;
    const lado = ladoPegado(h, c.x, c.y);
    return lado !== null && c.orientacion === FRENTE[lado];
  });
}

/** Mesa más cercana a una silla (por distancia entre casillas) y la casilla de la silla pegada a ella que mira a la mesa. */
export function arreglarSilla(sala: SalaMapa, silla: Colocacion, buscar: BuscarObjeto = objetoPorId): { x: number; y: number; orientacion: Orientacion } | null {
  const so = buscar(silla.objeto);
  if (!so) return null;
  let mejor: { d: number; x: number; y: number; orientacion: Orientacion } | null = null;
  for (const c of sala.colocaciones) {
    const om = buscar(c.objeto);
    if (!om || !esMesaParaSillas(om)) continue;
    const h = huellaColocada(om, c.x, c.y, c.orientacion);
    const lados: PlanSilla['lado'][] = ['arriba', 'abajo', 'izquierda', 'derecha'];
    for (const lado of lados) {
      const horizontal = lado === 'arriba' || lado === 'abajo';
      const n = horizontal ? h.ancho : h.alto;
      for (let i = 0; i < n; i++) {
        const x = horizontal ? h.x + i : lado === 'izquierda' ? h.x - 1 : h.x + h.ancho;
        const y = !horizontal ? h.y + i : lado === 'arriba' ? h.y - 1 : h.y + h.alto;
        const d = Math.abs(x - silla.x) + Math.abs(y - silla.y);
        if (mejor && d >= mejor.d) continue;
        if (!evaluarColocacion(sala, so, x, y, FRENTE[lado], { buscar, ignorar: new Set([silla.id]) }).ok) continue;
        mejor = { d, x, y, orientacion: FRENTE[lado] };
      }
    }
  }
  return mejor ? { x: mejor.x, y: mejor.y, orientacion: mejor.orientacion } : null;
}
