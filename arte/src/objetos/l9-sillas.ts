/**
 * Lote 9, sillas de una casilla (la mitad de los asientos de Gather). Cada silla es un modelo de cajas en el plano `S`
 * (quien se sienta mira al sur, el respaldo queda al norte); de ahí salen las cuatro orientaciones.
 *
 * La mayoría salen de `silla()`, un constructor con piezas intercambiables (patas, respaldo, brazos). Las que tienen una
 * forma propia (director, camping, adirondack, espacial...) tienen su modelo aparte. Todas respetan:
 *  - el plano de 32 x 32 con las cajas entre x = 3 y 29;
 *  - el asiento a 4 a 7 filas de altura y el respaldo por encima (hasta 8 filas más si el objeto sobresale 8);
 *  - un tapiz recoloreable de 4 tonos (`TAPICES`) o madera de 5 tonos.
 */

import type { Lienzo } from '../nucleo';
import { TAPICES, bx, botones, caraSur, conEtiqueta, patas4, registrarReceta, tonos5, tonosTapiz } from './l9-comun';
import type { CajaPlano, Cuadros, Modelo, Receta, TonosCaja } from './l9-comun';
import { AZUL, MADERA_CLARA, MADERA_OSCURA, METAL, METAL_OSCURO, NEGRO } from './l9-comun';
import { rampa } from '../nucleo';

const CX = 16;

type Patas = 'cuatro' | 'gruesas' | 'pedestal' | 'estrella' | 'trineo' | 'torneadas' | 'ninguna';
type FormaRespaldo = 'panel' | 'tablillas' | 'escalera' | 'alas' | 'curvo' | 'bajo' | 'redondo' | 'sin';

interface OpSilla {
  /** Ancho y fondo del asiento. */
  ancho?: number;
  fondo?: number;
  /** Altura del asiento: de `z0` a `z1`. */
  z0?: number;
  z1?: number;
  asiento: TonosCaja;
  marco: TonosCaja;
  respaldoTonos?: TonosCaja;
  patas?: Patas;
  respaldo?: FormaRespaldo;
  /** Cuántas filas sube el respaldo sobre el asiento. */
  alto?: number;
  brazos?: 'fino' | 'grueso' | 'no';
  alturaBrazo?: number;
  /** Botones de capitoné en el respaldo y el asiento. */
  botones?: string;
  esquinas?: number;
}

function silla(o: OpSilla): Modelo {
  const ancho = o.ancho ?? 18;
  const fondo = o.fondo ?? 15;
  const z0 = o.z0 ?? 4;
  const z1 = o.z1 ?? 7;
  const x0 = CX - ancho / 2;
  const x1 = CX + ancho / 2;
  const y0 = 11;
  const y1 = Math.min(26, y0 + fondo);
  const cajas: CajaPlano[] = [];
  const esq = o.esquinas ?? 1;
  const rt = o.respaldoTonos ?? o.asiento;
  const alto = o.alto ?? 8;
  switch (o.patas ?? 'cuatro') {
    case 'cuatro':
      cajas.push(...patas4(x0, y0 - 2, x1, y1, 0, z0, o.marco, 2));
      break;
    case 'gruesas':
      cajas.push(...patas4(x0, y0 - 3, x1, y1, 0, z0, o.marco, 3));
      break;
    case 'torneadas':
      cajas.push(...patas4(x0 + 1, y0 - 2, x1 - 1, y1 - 1, 0, z0, o.marco, 2));
      cajas.push(bx(x0 + 1, y0 + 4, x1 - 1, y0 + 5, 1, 2, o.marco));
      break;
    case 'pedestal':
      cajas.push(bx(CX - 2, 16, CX + 2, 20, 0, z0, o.marco), bx(CX - 6, 14, CX + 6, 22, 0, 2, o.marco, { esquinas: 2 }));
      break;
    case 'estrella':
      cajas.push(bx(CX - 2, 16, CX + 2, 20, 1, z0, METAL_OSCURO), bx(x0 - 1, 17, x1 + 1, 19, 0, 2, o.marco), bx(CX - 1, 12, CX + 1, 25, 0, 2, o.marco));
      for (const [px, py] of [[x0 - 2, 16], [x1 - 1, 16], [CX - 2, 11], [CX - 2, 24]] as const) cajas.push(bx(px, py, px + 3, py + 3, 0, 2, NEGRO));
      break;
    case 'trineo':
      for (const x of [x0 + 1, x1 - 3]) cajas.push(bx(x, y0 - 3, x + 2, y1 + 1, 0, 2, o.marco), bx(x, y1 - 4, x + 2, y1 - 2, 2, z0, o.marco));
      cajas.push(bx(x0 + 1, y0 - 3, x1 - 1, y0 - 1, 1, 3, o.marco));
      break;
    case 'ninguna':
      break;
  }
  cajas.push(bx(x0, y0, x1, y1, z0, z1, o.asiento, { esquinas: esq, etiqueta: 'asiento' }));
  const yb0 = y0 - 5;
  const yb1 = y0 - 1;
  const zb0 = z1;
  const zb1 = z1 + alto;
  switch (o.respaldo ?? 'panel') {
    case 'panel':
      cajas.push(bx(x0 + 1, yb0, x1 - 1, yb1, zb0, zb1, rt, { esquinas: Math.min(2, esq + 1), etiqueta: 'respaldo' }));
      break;
    case 'bajo':
      cajas.push(bx(x0 + 1, yb0 + 1, x1 - 1, yb1, zb0, zb0 + Math.max(3, alto - 3), rt, { esquinas: 1, etiqueta: 'respaldo' }));
      break;
    case 'redondo':
      cajas.push(bx(x0, yb0, x1, yb1, zb0, zb1, rt, { esquinas: 3, etiqueta: 'respaldo' }));
      break;
    case 'curvo':
      cajas.push(bx(x0 + 3, yb0, x1 - 3, yb1 - 1, zb0, zb1, rt, { esquinas: 2, etiqueta: 'respaldo' }), bx(x0, yb0 + 3, x0 + 4, yb1 + 4, zb0, zb1 - 3, rt, { esquinas: 2 }), bx(x1 - 4, yb0 + 3, x1, yb1 + 4, zb0, zb1 - 3, rt, { esquinas: 2 }));
      break;
    case 'alas':
      cajas.push(bx(x0 + 1, yb0, x1 - 1, yb1, zb0, zb1, rt, { esquinas: 3, etiqueta: 'respaldo' }), bx(x0 - 1, yb0 + 1, x0 + 3, y1 - 2, zb0, zb1 - 3, rt, { esquinas: 2 }), bx(x1 - 3, yb0 + 1, x1 + 1, y1 - 2, zb0, zb1 - 3, rt, { esquinas: 2 }));
      break;
    case 'tablillas': {
      const n = 4;
      const paso = (ancho - 4) / n;
      cajas.push(bx(x0, yb1 - 2, x0 + 2, yb1, zb0, zb1, o.marco), bx(x1 - 2, yb1 - 2, x1, yb1, zb0, zb1, o.marco));
      for (let i = 0; i < n; i++) cajas.push(bx(x0 + 2 + i * paso + 1, yb1 - 2, x0 + 2 + (i + 1) * paso, yb1, zb0 + 1, zb1 - 1, rt));
      break;
    }
    case 'escalera':
      cajas.push(bx(x0, yb1 - 2, x0 + 2, yb1, zb0, zb1, o.marco), bx(x1 - 2, yb1 - 2, x1, yb1, zb0, zb1, o.marco));
      for (const z of [zb0 + 2, zb0 + 5, zb1 - 3]) cajas.push(bx(x0 + 2, yb1 - 2, x1 - 2, yb1, z, z + 2, o.marco));
      break;
    case 'sin':
      break;
  }
  if (o.brazos === 'fino' || o.brazos === 'grueso') {
    const g = o.brazos === 'fino' ? 2 : 4;
    const h = o.alturaBrazo ?? 4;
    for (const x of [x0 - g, x1]) {
      cajas.push(bx(x, y0 - 2, x + g, y1 - 3, z0 + 1, z1 + h, o.brazos === 'fino' ? o.marco : o.asiento, { esquinas: g > 2 ? 2 : 0 }));
    }
  }
  const crema = o.botones;
  return {
    W: 32,
    D: 32,
    cajas,
    detalle: crema === undefined ? undefined : (l: Lienzo, p, _g, cs) => {
      for (const c of conEtiqueta(cs, 'respaldo')) botones(l, caraSur(c, p), crema, 9);
    },
  };
}

// ---------------------------------------------------------------------------
// Tapices y maderas
// ---------------------------------------------------------------------------

const T = {
  cuero: tonosTapiz(TAPICES.cuero),
  crema: tonosTapiz(TAPICES.crema),
  gris: tonosTapiz(TAPICES.gris),
  lavanda: tonosTapiz(TAPICES.lavanda),
  naranja: tonosTapiz(TAPICES.naranja),
  morado: tonosTapiz(TAPICES.morado),
  pastel: tonosTapiz(TAPICES.pastel),
  rosa: tonosTapiz(TAPICES.rosa),
  mostaza: tonosTapiz(TAPICES.mostaza),
};
const HEX = {
  cuero: TAPICES.cuero.h,
  crema: TAPICES.crema.h,
  gris: TAPICES.gris.h,
  lavanda: TAPICES.lavanda.h,
  naranja: TAPICES.naranja.h,
  morado: TAPICES.morado.h,
  pastel: TAPICES.pastel.h,
  rosa: TAPICES.rosa.h,
  mostaza: TAPICES.mostaza.h,
  madera: rampa('madera-oscura'),
  maderaClara: rampa('madera-clara'),
};
const NOGAL = MADERA_OSCURA;
const ROBLE = MADERA_CLARA;
const CAOBA = tonos5('cuero');

// ---------------------------------------------------------------------------
// Sillas con forma propia
// ---------------------------------------------------------------------------

/** Silla de director: lona entre dos marcos de madera, respaldo de lona y brazos largos. */
function sillaDirector(): Modelo {
  const cajas: CajaPlano[] = [];
  for (const x of [5, 24]) cajas.push(bx(x, 9, x + 3, 12, 0, 12, NOGAL), bx(x, 24, x + 3, 27, 0, 7, NOGAL), bx(x, 11, x + 3, 25, 11, 13, NOGAL));
  cajas.push(bx(8, 9, 24, 12, 8, 15, T.naranja, { esquinas: 1, etiqueta: 'respaldo' }), bx(8, 12, 24, 25, 6, 8, T.naranja, { esquinas: 1 }));
  cajas.push(bx(6, 17, 26, 19, 1, 3, NOGAL));
  return { W: 32, D: 32, cajas };
}

/** Silla plegable de camping: marco de tubo gris, asiento y respaldo de lona. */
function sillaCamping(): Modelo {
  const cajas: CajaPlano[] = [];
  for (const x of [6, 23]) cajas.push(bx(x, 24, x + 3, 27, 0, 7, METAL), bx(x, 9, x + 3, 12, 0, 12, METAL), bx(x, 12, x + 3, 24, 5, 7, METAL));
  cajas.push(bx(9, 12, 23, 25, 6, 9, T.pastel, { esquinas: 1, etiqueta: 'asiento' }), bx(9, 9, 23, 12, 8, 17, T.pastel, { esquinas: 1, etiqueta: 'respaldo' }));
  cajas.push(bx(7, 17, 25, 19, 1, 3, METAL));
  return { W: 32, D: 32, cajas };
}

/** Silla Adirondack: tablones inclinados, brazos anchos y planos. */
function sillaAdirondack(): Modelo {
  const cajas: CajaPlano[] = [];
  cajas.push(...patas4(8, 13, 24, 27, 0, 5, ROBLE, 2));
  cajas.push(bx(9, 12, 23, 27, 5, 8, ROBLE, { esquinas: 1 }));
  for (let i = 0; i < 5; i++) cajas.push(bx(8 + i * 3, 5, 10 + i * 3 + 1, 11, 7, 19 - Math.abs(2 - i) * 1, i % 2 === 0 ? ROBLE : { ...ROBLE, superior: 'madera-clara-4' }, { esquinas: i === 0 || i === 4 ? 1 : 0 }));
  for (const x of [4, 24]) cajas.push(bx(x, 11, x + 4, 28, 8, 11, ROBLE, { esquinas: 1 }));
  return { W: 32, D: 32, cajas };
}

/** Silla de jardín plegable (lawn chair): marco de aluminio con tiras de tela de colores. */
function sillaJardin(): Modelo {
  const cajas: CajaPlano[] = [];
  for (const x of [6, 23]) cajas.push(bx(x, 24, x + 3, 27, 0, 8, METAL), bx(x, 8, x + 3, 12, 0, 14, METAL), bx(x, 12, x + 3, 24, 6, 8, METAL), bx(x - 1, 14, x + 4, 22, 8, 10, METAL));
  const tiras = [T.pastel, T.crema];
  for (let i = 0; i < 6; i++) cajas.push(bx(9, 12 + i * 2.2, 23, 12 + i * 2.2 + 1.6, 6, 8, tiras[i % 2] as TonosCaja, { etiqueta: 'asiento' }));
  for (let i = 0; i < 4; i++) cajas.push(bx(9, 8, 23, 11, 8 + i * 2, 9.4 + i * 2, tiras[i % 2] as TonosCaja, { etiqueta: 'respaldo' }));
  return { W: 32, D: 32, cajas };
}

/** Silla espacial: cápsula blanca redonda sobre un pie central, como una cáscara con el borde azul. */
function sillaEspacial(): Modelo {
  const cajas: CajaPlano[] = [];
  cajas.push(bx(CX - 7, 15, CX + 7, 24, 0, 2, METAL_OSCURO, { esquinas: 3 }), bx(CX - 2, 17, CX + 2, 21, 2, 7, METAL));
  const blanco: TonosCaja = { superior: 'neutro-7', frente: 'neutro-6', luz: 'neutro-7', luzFrente: 'neutro-7', sombra: 'neutro-4', sombraLado: 'neutro-5' };
  cajas.push(bx(CX - 10, 12, CX + 10, 26, 7, 11, blanco, { esquinas: 3, etiqueta: 'asiento' }));
  cajas.push(bx(CX - 11, 6, CX + 11, 14, 8, 22, blanco, { esquinas: 3, etiqueta: 'respaldo' }));
  cajas.push(bx(CX - 7, 8, CX + 7, 14, 12, 20, AZUL, { esquinas: 3, giros: ['S'] }));
  return { W: 32, D: 32, cajas };
}

/** Silla en Z: una sola lámina doblada en Z, con patín de tubo. */
function sillaZ(): Modelo {
  const cajas: CajaPlano[] = [];
  for (const x of [8, 21]) cajas.push(bx(x, 8, x + 3, 27, 0, 2, METAL_OSCURO));
  cajas.push(bx(8, 8, 24, 11, 0, 3, METAL_OSCURO));
  cajas.push(bx(8, 20, 24, 27, 0, 5, NEGRO));
  cajas.push(bx(8, 12, 24, 27, 5, 8, AZUL, { esquinas: 1, etiqueta: 'asiento' }));
  cajas.push(bx(8, 5, 24, 11, 6, 20, AZUL, { esquinas: 1, etiqueta: 'respaldo' }));
  return { W: 32, D: 32, cajas };
}

/** Silla de madera de un solo cuerpo curvo (silla de roble): el respaldo envuelve al asiento. */
function sillaRobleCurvo(): Modelo {
  const cajas: CajaPlano[] = [];
  cajas.push(...patas4(7, 10, 25, 27, 0, 5, ROBLE, 2));
  cajas.push(bx(7, 11, 25, 26, 5, 7, ROBLE, { esquinas: 2, etiqueta: 'asiento' }));
  cajas.push(bx(9, 5, 23, 8, 7, 17, ROBLE, { esquinas: 2, etiqueta: 'respaldo' }), bx(6, 7, 10, 20, 7, 14, ROBLE, { esquinas: 2 }), bx(22, 7, 26, 20, 7, 14, ROBLE, { esquinas: 2 }));
  return { W: 32, D: 32, cajas };
}

/** Silla de ratán: asiento y respaldo de mimbre tejido, redondeados. */
function sillaRatan(): Modelo {
  const m = tonos5('madera-clara');
  const cajas: CajaPlano[] = [];
  cajas.push(...patas4(7, 11, 25, 27, 0, 5, m, 2));
  cajas.push(bx(7, 11, 25, 27, 5, 8, m, { esquinas: 3, etiqueta: 'asiento' }));
  cajas.push(bx(7, 4, 25, 11, 8, 24, m, { esquinas: 3, etiqueta: 'respaldo' }));
  cajas.push(bx(11, 6, 21, 11, 12, 21, tonos5('madera-clara', -1)));
  return {
    W: 32,
    D: 32,
    cajas,
    detalle: (l, p, g, cs) => {
      // Trama del mimbre: puntos de un tono más oscuro en cuadrícula sobre la cara de adelante del respaldo y del asiento.
      for (const c of conEtiqueta(cs, 'respaldo')) {
        const r = caraSur(c, p);
        for (let j = 1; j < r.h - 1; j += 2) for (let i = 1 + (j % 4 === 1 ? 0 : 1); i < r.w - 1; i += 2) l.px(r.x + i, r.y + j, 'madera-clara-1');
      }
      void g;
    },
  };
}

/** Banco redondo de cuatro patas finas y respaldo de aro: silla de café. */
function sillaCafe(): Modelo {
  return silla({ asiento: AZUL, marco: METAL, patas: 'cuatro', respaldo: 'escalera', alto: 9, ancho: 16, fondo: 14, z0: 5, z1: 7, esquinas: 2 });
}

// ---------------------------------------------------------------------------
// Recetas
// ---------------------------------------------------------------------------

const S_PLAS = tonosTapiz(TAPICES.gris);

export const RECETAS_SILLAS: readonly Receta[] = [
  { id: 'silla-espacial', modelo: sillaEspacial(), desde: rampa('neutro').slice(4, 8) },
  { id: 'silla-z', modelo: sillaZ(), desde: rampa('azul-oficina').slice(1, 5) },
  { id: 'silla-jardin-plegable', modelo: sillaJardin(), desde: HEX.pastel },
  { id: 'silla-giratoria-industrial', modelo: silla({ asiento: NEGRO, marco: METAL, patas: 'estrella', respaldo: 'bajo', alto: 8, ancho: 16, fondo: 14, brazos: 'no' }), desde: rampa('neutro').slice(1, 5) },
  { id: 'silla-simple', modelo: silla({ asiento: NOGAL, marco: NOGAL, patas: 'cuatro', respaldo: 'panel', alto: 8, ancho: 18 }), desde: HEX.madera },
  { id: 'silla-chippendale', modelo: silla({ asiento: T.rosa, marco: CAOBA, patas: 'torneadas', respaldo: 'curvo', alto: 15, ancho: 18, botones: 'rojo-suave-1', respaldoTonos: CAOBA }), desde: HEX.rosa },
  { id: 'silla-salon-antigua', modelo: silla({ asiento: T.mostaza, marco: NOGAL, patas: 'torneadas', respaldo: 'redondo', alto: 14, ancho: 17, respaldoTonos: T.mostaza, botones: 'tela-calida-0', esquinas: 2 }), desde: HEX.mostaza },
  { id: 'silla-director', modelo: sillaDirector(), desde: HEX.naranja },
  { id: 'silla-wabi-sabi', modelo: silla({ asiento: ROBLE, marco: ROBLE, patas: 'gruesas', respaldo: 'tablillas', alto: 9, ancho: 17, fondo: 14 }), desde: HEX.maderaClara },
  { id: 'silla-cafe', modelo: sillaCafe(), desde: rampa('azul-oficina').slice(1, 5) },
  { id: 'silla-adirondack', modelo: sillaAdirondack(), desde: HEX.maderaClara },
  { id: 'silla-comedor-industrial', modelo: silla({ asiento: METAL_OSCURO, marco: METAL, patas: 'cuatro', respaldo: 'escalera', alto: 10, ancho: 17, fondo: 14, z0: 5, z1: 7 }), desde: rampa('metal') },
  { id: 'silla-plastica', modelo: silla({ asiento: S_PLAS, marco: METAL, patas: 'cuatro', respaldo: 'curvo', alto: 10, ancho: 17, fondo: 14, esquinas: 2 }), desde: HEX.gris },
  { id: 'silla-auxiliar-moderna', modelo: silla({ asiento: T.cuero, marco: NOGAL, patas: 'cuatro', respaldo: 'curvo', alto: 8, ancho: 17, fondo: 15 }), desde: HEX.cuero },
  { id: 'silla-malla-ergonomica', modelo: silla({ asiento: AZUL, marco: METAL_OSCURO, patas: 'estrella', respaldo: 'panel', alto: 17, ancho: 16, fondo: 14, brazos: 'fino', alturaBrazo: 6, respaldoTonos: NEGRO, esquinas: 2 }), desde: rampa('azul-oficina').slice(1, 5) },
  { id: 'silla-giratoria-madera', modelo: silla({ asiento: ROBLE, marco: NOGAL, patas: 'pedestal', respaldo: 'curvo', alto: 8, ancho: 17, fondo: 14, esquinas: 2 }), desde: HEX.maderaClara },
  { id: 'silla-oficina-delgada', modelo: silla({ asiento: NEGRO, marco: METAL, patas: 'estrella', respaldo: 'panel', alto: 10, ancho: 14, fondo: 13, esquinas: 2 }), desde: rampa('neutro').slice(1, 5) },
  { id: 'silla-camping', modelo: sillaCamping(), desde: HEX.pastel },
  { id: 'silla-ratan', modelo: sillaRatan(), desde: HEX.maderaClara },
  { id: 'silla-roble-curvo', modelo: sillaRobleCurvo(), desde: HEX.maderaClara },
  { id: 'silla-modernista', modelo: silla({ asiento: T.crema, marco: NOGAL, patas: 'torneadas', respaldo: 'tablillas', alto: 14, ancho: 17, respaldoTonos: NOGAL }), desde: HEX.crema },
];

export function cuadrosSillas9(): Cuadros {
  const c: Cuadros = new Map();
  for (const r of RECETAS_SILLAS) registrarReceta(c, r);
  return c;
}
