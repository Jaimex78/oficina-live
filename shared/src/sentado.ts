import type { DatosSentadoParcial, Direccion, ObjetoCatalogo, Orientacion } from './arte';

/**
 * Cómo se ve quien se sienta, por familia de asiento y orientación (sustituye las reglas sueltas de `sentado-anclas.ts`).
 *
 * Referencia: el personaje v5 es un cuadro de 32 x 64 con los pies en la fila 61; de pie sus pies están en el centro de la casilla, 24 px bajo
 * su borde de arriba. Sentado, los pies quedan en (centro + dx, borde de arriba + 24 + dy). El asiento se dibuja detrás de la persona y la banda
 * `corte` (banda de la imagen del asiento, medida en filas DESDE SU BORDE DE ABAJO: [desde, hasta) con desde > hasta, y 0 es el borde de abajo, así sirve igual para asientos de 32 o de 40 px de alto) se vuelve a dibujar por delante: de espaldas es el
 * respaldo; de frente, el borde del cojín y la parte baja de los apoyabrazos, así los muslos quedan DENTRO del asiento; de perfil, el apoyabrazos
 * cercano. Los pies siempre asoman por debajo de la banda. Con `dy` entre -4 y 9 el asiento se sigue encontrando bajo los pies (ver `asientoBajoElCentro`).
 */
export interface DatosSentado {
  dx: number;
  dy: number;
  /** [desde, hasta] en filas contadas desde el borde de abajo de la imagen del asiento (desde > hasta): la banda que se dibuja por delante. */
  corte: readonly [number, number] | null;
  pose: Direccion;
  /** Asiento mullido (butaca, sofá, módulo, puf): suena a cojín; los demás, a madera o plástico. */
  blando: boolean;
}

export type FamiliaAsiento = 'oficina' | 'comedor' | 'clasica' | 'butaca' | 'sofa' | 'modulo' | 'banca' | 'puf';

const FAMILIA_POR_ID: Record<string, FamiliaAsiento> = {};
const reg = (f: FamiliaAsiento, ids: string[]): void => ids.forEach((i) => (FAMILIA_POR_ID[i] = f));
reg('oficina', ['silla-oficina', 'silla-ejecutiva', 'silla-giratoria-industrial', 'silla-malla-ergonomica', 'sillon-gamer', 'silla-giratoria-madera', 'silla-oficina-delgada']);
reg('comedor', ['silla-comedor', 'silla-reunion', 'silla-comedor-industrial', 'silla-simple', 'silla-plastica', 'silla-cafe', 'silla-z', 'silla-auxiliar-moderna', 'silla-roble-curvo', 'silla-wabi-sabi', 'silla-modernista', 'silla-tallada']);
reg('clasica', ['silla-chippendale', 'silla-salon-antigua', 'silla-director', 'silla-barcelona', 'silla-camping', 'silla-jardin-plegable', 'silla-ratan', 'silla-adirondack', 'silla-perezosa', 'silla-espacial', 'silla-columpio']);
reg('butaca', ['butaca', 'sillon-rojo', 'butaca-knoll', 'butaca-art-deco', 'butaca-aviador', 'butaca-nube', 'butaca-acogedora', 'butaca-en-u', 'butaca-lecorbusier', 'sillon-lounger', 'sillon-huevo', 'sillon-huevo-mimbre']);
reg('sofa', ['sofa-2', 'sofa-3', 'sofa-l', 'sofa-cuero-moderno', 'sofa-antiguo', 'sofa-knoll', 'sofa-lecorbusier', 'sofa-art-deco', 'sofa-aviador', 'chaise-antigua']);
reg('modulo', ['modular-segmento', 'modular-exterior-segmento', 'modular-exterior-esquina', 'modular-esquina']);
reg('banca', ['banca-interior', 'banca-exterior', 'banca-parque', 'banca-jardin', 'banca-con-cojin']);
reg('puf', ['puff', 'puf-saco', 'banco', 'taburete']);

/** La familia de un asiento (para los que no están en la lista, por su nombre y por si tiene una sola orientación). */
export function familiaDeAsiento(o: Pick<ObjetoCatalogo, 'id' | 'orientaciones'>): FamiliaAsiento {
  const f = FAMILIA_POR_ID[o.id];
  if (f) return f;
  if (o.orientaciones.length === 1) return 'puf';
  if (/sof|chaise/.test(o.id)) return 'sofa';
  if (/banca|banco/.test(o.id)) return 'banca';
  if (/butaca|sillon/.test(o.id)) return 'butaca';
  return 'comedor';
}

type PorMira = Record<Orientacion, DatosSentadoParcial & { dx: number; dy: number }>;
const D = (dx: number, dy: number, corte: readonly [number, number] | null = null, pose?: Direccion): DatosSentadoParcial & { dx: number; dy: number } => ({ dx, dy, corte, ...(pose ? { pose } : {}) });

/** Valores por defecto por familia y orientación. Se afinan mirando `arte/herramientas/hoja-sentadas.ts`. */
export const SENTADO_FAMILIA: Record<FamiliaAsiento, PorMira> = {
  oficina: { S: D(0, 4, [15, 8]), N: D(0, 6, [12, 0]), E: D(-5, -3, null), O: D(5, -3, null), U: D(0, 2) },
  comedor: { S: D(0, 3, [13, 8]), N: D(0, 6, [12, 0]), E: D(-5, -3, null), O: D(5, -3, null), U: D(0, 2) },
  clasica: { S: D(0, 3, [13, 7]), N: D(0, 6, [18, 0]), E: D(-5, -3, null), O: D(5, -3, null), U: D(0, 2) },
  butaca: { S: D(0, 4, [12, 6]), N: D(0, 6, [16, 0]), E: D(-4, -3, null), O: D(4, -3, null), U: D(0, 2) },
  sofa: { S: D(0, 4, [12, 6]), N: D(0, 6, [16, 0]), E: D(-4, -3, null), O: D(4, -3, null), U: D(0, 2) },
  modulo: { S: D(0, 4, [12, 6]), N: D(0, 6, [16, 0]), E: D(-4, -3, null), O: D(4, -3, null), U: D(0, 2) },
  banca: { S: D(0, 3, [13, 8]), N: D(0, 6, [12, 0]), E: D(-4, -3, null), O: D(4, -3, null), U: D(0, 2) },
  puf: { S: D(0, 2), N: D(0, 2), E: D(0, 2), O: D(0, 2), U: D(0, 2) },
};

/** Ajustes por objeto (sobre los de su familia). Se aplican al inventario en `inventario.ts`. */
export const SENTADO_AJUSTES: Record<string, Partial<Record<Orientacion, DatosSentadoParcial>>> = {};

/** Lo que usa el motor: valores de la familia + ajuste del objeto. `mira` es la dirección hacia la que mira quien se sienta. */
export function datosSentado(o: Pick<ObjetoCatalogo, 'id' | 'orientaciones' | 'sentado'>, mira: Direccion): DatosSentado {
  const sinFrente = o.orientaciones.length === 1;
  const clave: Orientacion = sinFrente ? 'U' : mira;
  const base = SENTADO_FAMILIA[familiaDeAsiento(o)][clave];
  const ajuste = o.sentado?.[clave];
  return {
    dx: ajuste?.dx ?? base.dx,
    dy: ajuste?.dy ?? base.dy,
    corte: ajuste?.corte !== undefined ? ajuste.corte : (base.corte ?? null),
    pose: ajuste?.pose ?? base.pose ?? mira,
    blando: ['butaca', 'sofa', 'modulo', 'puf'].includes(familiaDeAsiento(o)),
  };
}

/** Para la hoja de revisión y las pruebas: igual que `datosSentado` con la forma `{ dx, dy, corte, pose }`. */
export const reglasDeSentado = (o: ObjetoCatalogo, mira: Direccion): DatosSentado => datosSentado(o, mira);
