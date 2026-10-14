import { objetoPorId, type AreaPersonal, type BuscarObjeto, type SalaMapa, type Zona } from '@ol/shared';

/**
 * Las «áreas» que el puntero puede tocar en el mundo: las zonas del mapa (salas, cafetería, equipos...) y las áreas
 * personales (el escritorio de cada persona). Todo es lógica pura para poder probarla sin Phaser.
 */

export type ClaseId = 'reunion' | 'descanso' | 'escritorios' | 'privada' | 'abierta' | 'silenciosa' | 'escritorio' | 'coworking';

/** El nombre de cada clase, como se muestra en la pista «Tipo: Nombre». */
export const ETIQUETA_CLASE: Record<ClaseId, string> = {
  reunion: 'Sala de reuniones',
  descanso: 'Zona de descanso',
  escritorios: 'Escritorios del equipo',
  privada: 'Sala privada',
  abierta: 'Área abierta',
  silenciosa: 'Zona silenciosa',
  escritorio: 'Escritorio',
  coworking: 'Zona de coworking',
};

export interface RectCasillas {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface AreaMundo {
  id: string;
  nombre: string;
  claseId: ClaseId;
  /** Texto para mostrar: «Sala de reuniones». */
  clase: string;
  rect: RectCasillas;
  origen: 'zona' | 'area';
}

const sinTildes = (t: string): string => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const RE_REUNION = /reunion|junta|huddle|sala de |comite|board/;
const RE_DESCANSO = /descanso|cafe|play|lounge|ocio|juego|comedor|cocina|pantry|terraza/;
const RE_EQUIPO = /escritorio|equipo|team|digital|coworking|oficina de/;

const dentroDe = (r: RectCasillas, x: number, y: number): boolean => x >= r.x && y >= r.y && x < r.x + r.w && y < r.y + r.h;

/**
 * Qué clase de lugar es una zona. El tipo del editor manda cuando dice algo concreto (sala, privada, silenciosa);
 * si es «abierta», se mira qué hay adentro (mesas de Teams, escritorios, sofás y cocina) y, al final, el nombre.
 */
export function claseDeZona(z: Zona, sala: SalaMapa, buscar: BuscarObjeto = objetoPorId): ClaseId {
  if (z.tipo === 'sala') return 'reunion';
  if (z.tipo === 'coworking') return 'coworking';
  if (z.tipo === 'privada') return 'privada';
  if (z.tipo === 'silenciosa') return 'silenciosa';
  let reunion = 0;
  let descanso = 0;
  let escritorios = 0;
  for (const c of sala.colocaciones) {
    if (!dentroDe(z.rect, c.x, c.y)) continue;
    const o = buscar(c.objeto);
    if (!o) continue;
    // Pesos: un escritorio vale más que un puff (cada oficina trae el suyo) y una mesa de Teams marca una sala de reuniones.
    if (o.interaccion === 'teams') reunion += 3;
    else if (/^mesa-reunion|pizarra|proyector/.test(o.id)) reunion += 1.5;
    if (o.categoria === 'puestos' && !o.apoyado) escritorios += 2;
    else if (/^sofa/.test(o.id)) descanso += 1.5;
    else if (/^(puff|butaca)/.test(o.id)) descanso += 0.5;
    else if (o.categoria === 'cocina' || o.categoria === 'juegos' || o.id === 'ps5') descanso += 1;
  }
  if (escritorios >= 4 && escritorios >= reunion && escritorios >= descanso) return 'escritorios';
  if (reunion >= 3 && reunion >= descanso) return 'reunion';
  if (descanso >= 2) return 'descanso';
  const n = sinTildes(z.nombre);
  if (RE_REUNION.test(n)) return 'reunion';
  if (RE_EQUIPO.test(n)) return 'escritorios';
  if (RE_DESCANSO.test(n)) return 'descanso';
  return 'abierta';
}

/** Zonas y áreas personales de una sala, en el orden en que se prueban al tocar (las áreas personales primero). */
export function areasDeSala(sala: SalaMapa, buscar: BuscarObjeto = objetoPorId): AreaMundo[] {
  const zonas: AreaMundo[] = sala.zonas.map((z) => {
    const claseId = claseDeZona(z, sala, buscar);
    return { id: z.id, nombre: z.nombre, claseId, clase: ETIQUETA_CLASE[claseId], rect: z.rect, origen: 'zona' };
  });
  const personales: AreaMundo[] = (sala.areas ?? []).map((a: AreaPersonal) => ({
    id: a.id,
    nombre: a.nombre,
    claseId: 'escritorio',
    clase: ETIQUETA_CLASE.escritorio,
    rect: a.rect,
    origen: 'area',
  }));
  // Dentro de cada grupo, la más chica primero: una sala dentro de otra gana la de adentro.
  const porTamano = (a: AreaMundo, b: AreaMundo): number => a.rect.w * a.rect.h - b.rect.w * b.rect.h;
  return [...personales.sort(porTamano), ...zonas.sort(porTamano)];
}

/** El área que está bajo un punto del mundo en casillas (puede traer decimales). `areas` ya viene ordenada por `areasDeSala`. */
export function areaBajo(areas: readonly AreaMundo[], cx: number, cy: number): AreaMundo | null {
  for (const a of areas) if (dentroDe(a.rect, cx, cy)) return a;
  return null;
}

/** Las zonas que se rotulan con una píldora sobre el grupo. Las áreas personales no: serían demasiadas. */
export const zonasRotuladas = (areas: readonly AreaMundo[]): AreaMundo[] => areas.filter((a) => a.origen === 'zona' && a.nombre.trim() !== '');
