/**
 * Lote 14, divisores: `divisor-cubiculo`, `divisor-urinario` y `puerta-cubiculo`.
 *
 * Misma geometría que el divisor bajo del lote 2A (`l2a-paredes.ts`): un «más» delgado centrado en x = 16 con una tapa de
 * 6 px (filas 12 a 17), tallos hacia el norte y el sur y una cara que mira al sur desde la fila 18. Como lo alto sube en pantalla,
 * la tapa queda en las mismas filas sin importar cuánto sobresalga el cuadro: la cara es lo que crece (cubículo: 16 filas de más
 * que el divisor bajo de 8, urinario: 8). Así las tres piezas se unen entre sí y con las paredes vecinas.
 *
 * Detalle propio: el panel flota 3 filas sobre el piso (como los cubículos de verdad, para que se vean los zapatos) y lleva una
 * franja baja un tono más oscura. Material en tres variantes dibujadas a mano: gris azulado (base), azul y madera.
 *
 * La puerta es el mismo tramo este-oeste con un hueco de 26 px de ancho de la fila 22 al piso del panel. La hoja no se dibuja
 * aquí: la pone `web/src/mundo/puertas.ts` en código, de este color, y gira al acercarse alguien.
 */

import { objetoPorId } from '@ol/shared';
import { Lienzo } from '../nucleo';
import type { Cuadros } from './l4-comun';

const ANCHO = 32;
const TALLO_X0 = 13;
const TALLO_X1 = 19;
const TAPA_Y0 = 12;
const TAPA_Y1 = 18;
/** Filas libres bajo el panel (el contorno cae en la primera). */
const LUZ_SUELO = 4;
/** Hueco de la puerta: columnas 3 a 28 (26 px) y filas 22 hasta el pie del panel. */
export const HUECO_PUERTA = { x0: 3, x1: 29, y0: 22 } as const;

export interface Material {
  tapa: string;
  tapaLado: string;
  filo: string;
  cara: string;
  banda: string;
  sombra: string;
}

export const MATERIALES: Readonly<Record<string, Material>> = {
  base: { tapa: 'pizarra-5', tapaLado: 'pizarra-4', filo: 'neutro-7', cara: 'pizarra-4', banda: 'pizarra-3', sombra: 'pizarra-2' },
  azul: { tapa: 'vidrio-3', tapaLado: 'vidrio-2', filo: 'vidrio-2', cara: 'vidrio-1', banda: 'vidrio-0', sombra: 'vidrio-0' },
  madera: { tapa: 'madera-clara-4', tapaLado: 'madera-clara-3', filo: 'madera-clara-4', cara: 'madera-clara-2', banda: 'madera-clara-1', sombra: 'madera-clara-1' },
};

type Rejilla = boolean[][];

/** Qué cubren la tapa y la cara de una pieza, para el alto `alto` del cuadro. Misma lógica del divisor bajo. */
function regiones(mascara: string, alto: number): { tapa: Rejilla; cara: Rejilla; s: boolean; e: boolean; o: boolean; xi: number; xd: number } {
  if (!/^[01]{4}$/.test(mascara)) throw new RangeError(`Máscara de pared inválida: "${mascara}".`);
  const [n, e, s, o] = [...mascara].map((c) => c === '1') as [boolean, boolean, boolean, boolean];
  const vacia = (): Rejilla => Array.from({ length: alto }, () => new Array<boolean>(ANCHO).fill(false));
  const tapa = vacia();
  const cara = vacia();
  const xi = o ? 0 : TALLO_X0;
  const xd = e ? ANCHO : TALLO_X1;
  const marcar = (m: Rejilla, x0: number, y0: number, x1: number, y1: number): void => {
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) (m[y] as boolean[])[x] = true;
  };
  const piePanel = alto - LUZ_SUELO;
  marcar(tapa, xi, TAPA_Y0, xd, TAPA_Y1);
  if (n) marcar(tapa, TALLO_X0, 0, TALLO_X1, TAPA_Y0);
  if (s) marcar(tapa, TALLO_X0, TAPA_Y1, TALLO_X1, 32);
  if (!s) marcar(cara, xi, TAPA_Y1, xd, piePanel);
  else {
    if (xi < TALLO_X0 - 1) marcar(cara, xi, TAPA_Y1, TALLO_X0 - 1, piePanel);
    if (xd > TALLO_X1 + 1) marcar(cara, TALLO_X1 + 1, TAPA_Y1, xd, piePanel);
  }
  return { tapa, cara, s, e, o, xi, xd };
}

/** Pieza de divisor para una máscara de vecinos N, E, S, O. `abertura` talla el hueco de la puerta (solo en el tramo este-oeste). */
function pieza(mascara: string, sobresale: number, m: Material, abertura = false): Lienzo {
  const alto = 32 + sobresale;
  const g = regiones(mascara, alto);
  const l = new Lienzo(ANCHO, alto);
  const hay = (r: Rejilla, x: number, y: number): boolean => y >= 0 && y < alto && x >= 0 && x < ANCHO && (r[y] as boolean[])[x] === true;
  const pie = alto - LUZ_SUELO; // primera fila libre bajo el panel
  const conRanura = pie - TAPA_Y1 >= 20; // los paneles altos llevan una ranura a lo ancho

  for (let y = 0; y < alto; y++) {
    for (let x = 0; x < ANCHO; x++) {
      if (!hay(g.tapa, x, y)) continue;
      l.px(x, y, !hay(g.tapa, x + 1, y) && x + 1 < ANCHO ? m.tapaLado : m.tapa);
    }
  }
  for (let y = TAPA_Y1; y < pie; y++) {
    for (let x = 0; x < ANCHO; x++) {
      if (!hay(g.cara, x, y)) continue;
      let c = m.cara;
      if (y === TAPA_Y1) c = m.filo;
      else if (y >= pie - 5) c = m.banda;
      else if (y === pie - 6) c = m.sombra;
      else if (conRanura && y === TAPA_Y1 + 5) c = m.sombra;
      else if (conRanura && y === TAPA_Y1 + 6) c = m.filo;
      l.px(x, y, c);
    }
  }
  // Extremos libres del panel: luz a la izquierda y sombra a la derecha.
  if (!g.s && !g.o) l.rect(g.xi, TAPA_Y1 + 2, 1, pie - 7 - TAPA_Y1 - 2, m.filo);
  if (!g.s && !g.e) l.rect(g.xd - 1, TAPA_Y1 + 2, 1, pie - 7 - TAPA_Y1 - 2, m.sombra);
  if (abertura) {
    // Hueco de la puerta: se talla la cara y la banda, y se deja el dintel de 4 filas (18 a 21) y las dos jambas.
    l.rect(HUECO_PUERTA.x0, HUECO_PUERTA.y0, HUECO_PUERTA.x1 - HUECO_PUERTA.x0, pie - HUECO_PUERTA.y0, 'transparente');
  }
  return l.contorno('azul-oficina-0', { diagonales: true });
}

const claves = (): string[] => Array.from({ length: 16 }, (_, i) => [8, 4, 2, 1].map((b) => ((i & b) !== 0 ? '1' : '0')).join(''));

function ponerAutotile(c: Cuadros, id: string, sobresale: number): void {
  const o = objetoPorId(id);
  if (o === undefined) throw new Error(`[${id}] no existe en el inventario.`);
  for (const [variante, m] of Object.entries(MATERIALES)) {
    if (!o.variantes.some((v) => v.id === variante)) continue;
    for (const clave of claves()) {
      const frame = o.frames[clave]?.[variante];
      if (frame === undefined) throw new Error(`[${id}] falta ${clave} ${variante}.`);
      c.set(frame, pieza(clave, sobresale, m));
    }
  }
}

export function cuadrosDivisores14(): Cuadros {
  const c: Cuadros = new Map();
  ponerAutotile(c, 'divisor-cubiculo', 16);
  ponerAutotile(c, 'divisor-urinario', 8);
  const puerta = objetoPorId('puerta-cubiculo');
  if (puerta === undefined) throw new Error('[puerta-cubiculo] no existe en el inventario.');
  for (const [variante, m] of Object.entries(MATERIALES)) {
    const frame = puerta.frames['S']?.[variante];
    if (frame === undefined) throw new Error(`[puerta-cubiculo] falta S ${variante}.`);
    c.set(frame, pieza('0101', 16, m, true));
  }
  return c;
}
