/**
 * Lote 9, sofás, butacas, módulos, bancas y asientos de forma libre. Cada uno es un modelo de cajas en el plano `S`
 * (quien se sienta mira al sur, el respaldo al norte); de ahí salen las cuatro orientaciones.
 *
 * `sofa()` arma sofás y butacas de n casillas de ancho con piezas intercambiables (patas, brazos, respaldo, cojines,
 * botones). Lo demás (huevo, columpio, banca de parque, módulos de esquina, chaise, puf saco...) tiene su modelo aparte.
 * Los cojines llevan un tapiz recoloreable de 4 tonos (`TAPICES`); el marco, las patas y el metal no cambian de color.
 */

import { Lienzo, rampa } from '../nucleo';
import type { ColorEntrada } from '../nucleo';
import { AZUL, MADERA_CLARA, MADERA_OSCURA, METAL, METAL_OSCURO, NEGRO, ORO, TAPICES, bx, botones, caraSuperior, caraSur, conEtiqueta, registrarReceta, tonos5, tonosTapiz } from './l9-comun';
import type { CajaPlano, Cuadros, Modelo, Receta, TonosCaja } from './l9-comun';

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
  maderaOscura: rampa('madera-oscura'),
  maderaClara: rampa('madera-clara'),
};
const NOGAL = MADERA_OSCURA;
const ROBLE = MADERA_CLARA;
const BLANCO_PINTADO: TonosCaja = { superior: 'neutro-7', frente: 'neutro-6', luz: 'neutro-7', luzFrente: 'neutro-7', sombra: 'neutro-4', sombraLado: 'neutro-5' };

interface OpSofa {
  /** Casillas de ancho y de fondo. */
  n: number;
  fondo?: number;
  tapiz: TonosCaja;
  marco?: TonosCaja;
  patas?: 'cortas' | 'altas' | 'metal' | 'zocalo' | 'ninguna';
  brazos?: 'redondos' | 'finos' | 'bajos' | 'altos' | 'sin';
  /** Cuánto sube el respaldo sobre el asiento. */
  respaldo?: number;
  /** Cojines de espalda (por defecto uno por casilla; 0 para no ponerlos). */
  cojines?: number;
  botones?: string;
  esquinas?: number;
  brazoTonos?: TonosCaja;
  /** Barra de madera o metal por encima del respaldo. */
  barra?: TonosCaja;
}

function sofa(o: OpSofa): Modelo {
  const W = o.n * 32;
  const fondo = o.fondo ?? 1;
  const D = fondo * 32;
  const marco = o.marco ?? NEGRO;
  const patas = o.patas ?? 'cortas';
  const hp = patas === 'altas' || patas === 'metal' ? 4 : patas === 'ninguna' ? 0 : patas === 'zocalo' ? 0 : 2;
  const zs0 = hp + (patas === 'zocalo' ? 3 : 1);
  const zs1 = zs0 + 4;
  const esq = o.esquinas ?? 2;
  const aw = o.brazos === 'sin' ? 0 : o.brazos === 'finos' ? 3 : o.brazos === 'bajos' ? 5 : o.brazos === 'altos' ? 7 : o.brazos === undefined ? 6 : 6;
  const x0 = 2;
  const x1 = W - 3;
  const yB = 3;
  const yS = 11;
  const y1 = D - 4;
  const cajas: CajaPlano[] = [];
  if (patas !== 'ninguna' && patas !== 'zocalo') {
    const g = patas === 'metal' ? 2 : 3;
    for (const [x, y] of [[x0 + 1, yB + 1], [x1 - g - 1, yB + 1], [x0 + 1, y1 - g - 1], [x1 - g - 1, y1 - g - 1]] as const) cajas.push(bx(x, y, x + g, y + g, 0, hp + 1, patas === 'metal' ? METAL : marco));
  }
  // Base (zócalo o bastidor) bajo los cojines.
  cajas.push(bx(x0, yB, x1, y1, hp, zs0, patas === 'zocalo' ? marco : marco, { esquinas: 1 }));
  const ancho = x1 - x0 - 2 * aw;
  const nc = o.n === 1 ? 1 : o.n;
  const brazoT = o.brazoTonos ?? o.tapiz;
  // Respaldo: panel alto detrás y cojines pegados.
  const altoResp = o.respaldo ?? 11;
  cajas.push(bx(x0 + aw, yB, x1 - aw, yS - 1, zs0, zs1 + altoResp, o.tapiz, { esquinas: Math.min(3, esq + 1), etiqueta: 'panel' }));
  const cojinesEspalda = o.cojines ?? nc;
  for (let i = 0; i < cojinesEspalda; i++) {
    const cx0 = x0 + aw + (ancho * i) / cojinesEspalda;
    const cx1 = x0 + aw + (ancho * (i + 1)) / cojinesEspalda;
    cajas.push(bx(cx0 + (i === 0 ? 0 : 0.5), yS - 1, cx1 - (i === cojinesEspalda - 1 ? 0 : 0.5), yS + 3, zs1, zs1 + Math.max(5, altoResp - 3), o.tapiz, { esquinas: esq, giros: ['S'], etiqueta: 'respaldo' }));
  }
  // Asiento: un cojín por casilla.
  for (let i = 0; i < nc; i++) {
    const cx0 = x0 + aw + (ancho * i) / nc;
    const cx1 = x0 + aw + (ancho * (i + 1)) / nc;
    cajas.push(bx(cx0, yS - 1, cx1, y1, zs0, zs1, o.tapiz, { esquinas: esq, etiqueta: 'asiento' }));
  }
  // Brazos.
  if (aw > 0) {
    const altoBrazo = o.brazos === 'finos' ? 8 : o.brazos === 'altos' ? 14 : o.brazos === 'bajos' ? 8 : 11;
    for (const x of [x0, x1 - aw]) cajas.push(bx(x, yB, x + aw, y1, hp, zs0 + altoBrazo, o.brazos === 'finos' ? (o.brazoTonos ?? marco) : brazoT, { esquinas: o.brazos === 'finos' ? 0 : esq }));
  }
  if (o.barra !== undefined) cajas.push(bx(x0 + aw, yB, x1 - aw, yB + 3, zs1 + altoResp, zs1 + altoResp + 2, o.barra));
  const b = o.botones;
  return {
    W,
    D,
    cajas,
    detalle:
      b === undefined
        ? undefined
        : (l: Lienzo, p, _g, cs) => {
            for (const c of conEtiqueta(cs, 'respaldo')) botones(l, caraSur(c, p), b, 12);
            for (const c of conEtiqueta(cs, 'asiento')) botones(l, caraSuperior(c, p), b, 12);
          },
  };
}

// ---------------------------------------------------------------------------
// Sofás y butacas de forma propia
// ---------------------------------------------------------------------------

/** Módulo recto de un sofá modular: asiento y respaldo sin brazos para que se pegue a otro. */
function moduloSegmento(t: TonosCaja, marco: TonosCaja, exterior = false): Modelo {
  const cajas: CajaPlano[] = [];
  if (exterior) {
    // Estructura de mimbre con patas y cojines gruesos.
    for (const [x, y] of [[3, 4], [26, 4], [3, 26], [26, 26]] as const) cajas.push(bx(x, y, x + 3, y + 3, 0, 3, marco));
    cajas.push(bx(2, 3, 30, 29, 3, 5, marco, { esquinas: 1 }));
  } else {
    cajas.push(bx(2, 3, 30, 29, 0, 3, marco, { esquinas: 1 }));
  }
  const z0 = exterior ? 5 : 3;
  cajas.push(bx(2, 3, 30, 10, z0, z0 + 14, t, { esquinas: 3, etiqueta: 'panel' }));
  cajas.push(bx(2, 10, 30, 29, z0, z0 + 5, t, { esquinas: 3, etiqueta: 'asiento' }));
  cajas.push(bx(4, 10, 28, 14, z0 + 5, z0 + 12, t, { esquinas: 2, giros: ['S'], etiqueta: 'respaldo' }));
  return {
    W: 32,
    D: 32,
    cajas,
    detalle: (l, p, _g, cs) => {
      const c = exterior ? 'madera-clara-1' : 'azul-oficina-1';
      for (const r of conEtiqueta(cs, 'respaldo')) botones(l, caraSur(r, p), c, 20);
    },
  };
}

/** Módulo de esquina: respaldo al norte y al oeste, asiento con un cojín que da la vuelta. */
function moduloEsquina(t: TonosCaja, marco: TonosCaja, exterior = false): Modelo {
  const cajas: CajaPlano[] = [];
  if (exterior) {
    for (const [x, y] of [[3, 4], [26, 4], [3, 26], [26, 26]] as const) cajas.push(bx(x, y, x + 3, y + 3, 0, 3, marco));
    cajas.push(bx(2, 3, 30, 29, 3, 5, marco, { esquinas: 1 }));
  } else {
    cajas.push(bx(2, 3, 30, 29, 0, 3, marco, { esquinas: 1 }));
  }
  const z0 = exterior ? 5 : 3;
  cajas.push(bx(2, 3, 30, 10, z0, z0 + 14, t, { esquinas: 3, rectas: ['sw'], etiqueta: 'panel' }));
  cajas.push(bx(2, 10, 9, 29, z0, z0 + 14, t, { esquinas: 3, rectas: ['ne'], etiqueta: 'panel' }));
  cajas.push(bx(9, 10, 30, 29, z0, z0 + 5, t, { esquinas: 3, etiqueta: 'asiento' }));
  cajas.push(bx(10, 10, 28, 14, z0 + 5, z0 + 12, t, { esquinas: 2, giros: ['S'], etiqueta: 'respaldo' }));
  return {
    W: 32,
    D: 32,
    cajas,
    detalle: (l, p, _g, cs) => {
      const c = exterior ? 'madera-clara-1' : 'azul-oficina-1';
      for (const r of conEtiqueta(cs, 'respaldo')) botones(l, caraSur(r, p), c, 20);
    },
  };
}

/** Chaise antigua: un diván largo (1 de ancho por 2 de fondo) con un extremo alto y curvo, tapizado con botones. */
function chaise(): Modelo {
  const cajas: CajaPlano[] = [];
  for (const [x, y] of [[4, 5], [25, 5], [4, 58], [25, 58]] as const) cajas.push(bx(x, y, x + 3, y + 3, 0, 4, NOGAL));
  cajas.push(bx(3, 4, 30, 61, 3, 6, NOGAL, { esquinas: 1 }));
  cajas.push(bx(3, 4, 30, 14, 6, 26, T.rosa, { esquinas: 3, etiqueta: 'panel' }));
  cajas.push(bx(3, 14, 12, 40, 6, 17, T.rosa, { esquinas: 3 }));
  cajas.push(bx(12, 14, 30, 61, 6, 10, T.rosa, { esquinas: 2, etiqueta: 'asiento' }));
  cajas.push(bx(3, 40, 12, 61, 6, 10, T.rosa, { esquinas: 2, etiqueta: 'asiento' }));
  cajas.push(bx(5, 14, 28, 18, 10, 22, T.rosa, { esquinas: 3, giros: ['S'], etiqueta: 'respaldo' }));
  return {
    W: 32,
    D: 64,
    cajas,
    detalle: (l, p, _g, cs) => {
      for (const c of conEtiqueta(cs, 'respaldo')) botones(l, caraSur(c, p), 'rojo-suave-1', 10);
      for (const c of conEtiqueta(cs, 'asiento')) botones(l, caraSuperior(c, p), 'rojo-suave-1', 14);
    },
  };
}

/** Banca de parque: dos costados de hierro, listones de madera en el asiento y en el respaldo. */
function bancaParque(): Modelo {
  const cajas: CajaPlano[] = [];
  for (const x of [5, 56]) cajas.push(bx(x, 6, x + 3, 28, 0, 10, METAL_OSCURO), bx(x, 6, x + 3, 10, 10, 24, METAL_OSCURO), bx(x - 1, 12, x + 4, 28, 9, 12, METAL_OSCURO));
  for (let i = 0; i < 3; i++) cajas.push(bx(4, 12 + i * 6, 60, 12 + i * 6 + 4.5, 9, 12, ROBLE, { etiqueta: 'asiento' }));
  for (let i = 0; i < 3; i++) cajas.push(bx(5, 5, 59, 9, 12 + i * 4, 15 + i * 4, ROBLE, { etiqueta: 'respaldo' }));
  return { W: 64, D: 32, cajas };
}

/** Banca de jardín: madera pintada de blanco, respaldo de listones, brazos bajos. */
function bancaJardin(): Modelo {
  const cajas: CajaPlano[] = [];
  for (const x of [5, 56]) cajas.push(bx(x, 8, x + 3, 28, 0, 8, BLANCO_PINTADO), bx(x, 8, x + 3, 12, 8, 20, BLANCO_PINTADO), bx(x - 1, 10, x + 4, 28, 12, 15, BLANCO_PINTADO));
  for (let i = 0; i < 3; i++) cajas.push(bx(4, 12 + i * 6, 60, 12 + i * 6 + 4.5, 8, 11, BLANCO_PINTADO));
  for (let i = 0; i < 4; i++) cajas.push(bx(8 + i * 13, 7, 8 + i * 13 + 10, 10, 11, 19, BLANCO_PINTADO, { esquinas: 1 }));
  return { W: 64, D: 32, cajas };
}

/** Banca con cojín: tablón de madera sobre patas con un cojín largo encima. */
function bancaCojin(): Modelo {
  const cajas: CajaPlano[] = [];
  for (const [x, y] of [[5, 8], [56, 8], [5, 22], [56, 22]] as const) cajas.push(bx(x, y, x + 3, y + 4, 0, 9, NOGAL));
  cajas.push(bx(3, 6, 61, 28, 9, 12, NOGAL, { esquinas: 1 }));
  cajas.push(bx(5, 8, 59, 27, 12, 16, T.lavanda, { esquinas: 3, etiqueta: 'asiento' }));
  return { W: 64, D: 32, cajas, detalle: (l, p, _g, cs) => conEtiqueta(cs, 'asiento').forEach((c) => botones(l, caraSuperior(c, p), 'lavanda-1', 14)) };
}

/** Puf saco: una bolsa blanda, achatada, con un pliegue. Una sola vista (no gira). */
function pufSaco(): Modelo {
  const cajas: CajaPlano[] = [];
  cajas.push(bx(5, 8, 27, 28, 0, 9, T.naranja, { esquinas: 3, etiqueta: 'asiento' }));
  cajas.push(bx(8, 10, 24, 24, 9, 12, T.naranja, { esquinas: 3 }));
  cajas.push(bx(10, 5, 22, 12, 4, 15, T.naranja, { esquinas: 3 }));
  return { W: 32, D: 32, cajas, kyMax: 0.8 };
}

/** Sillón huevo: cáscara redonda y alta sobre un pie central, cojín claro adentro. */
function sillonHuevo(): Modelo {
  const cajas: CajaPlano[] = [];
  cajas.push(bx(CXs - 8, 14, CXs + 8, 26, 0, 2, METAL_OSCURO, { esquinas: 3 }), bx(CXs - 2, 18, CXs + 2, 22, 2, 8, METAL));
  cajas.push(bx(CXs - 11, 13, CXs + 11, 28, 8, 12, T.mostaza, { esquinas: 3, etiqueta: 'asiento' }));
  cajas.push(bx(CXs - 12, 5, CXs + 12, 17, 8, 30, T.mostaza, { esquinas: 3, etiqueta: 'panel' }));
  cajas.push(bx(CXs - 8, 11, CXs + 8, 16, 12, 24, tonosTapiz({ n: ['crema-1', 'crema-2', 'crema-3', 'crema-4'], h: [] }), { esquinas: 3, giros: ['S'], etiqueta: 'respaldo' }));
  return { W: 32, D: 32, cajas };
}
const CXs = 16;

/** Sillón huevo de mimbre colgante: un cesto ovalado colgado de un brazo, con un poste atrás. */
function huevoMimbre(): Modelo {
  const m = tonos5('madera-clara');
  const cajas: CajaPlano[] = [];
  cajas.push(bx(12, 3, 20, 9, 0, 3, METAL_OSCURO, { esquinas: 2 }), bx(15, 5, 18, 8, 3, 38, METAL), bx(15, 5, 18, 22, 36, 38, METAL));
  cajas.push(bx(CXs - 1, 18, CXs + 1, 20, 22, 36, METAL_OSCURO));
  cajas.push(bx(CXs - 11, 12, CXs + 11, 28, 6, 12, T.crema, { esquinas: 3, etiqueta: 'asiento' }));
  cajas.push(bx(CXs - 12, 8, CXs + 12, 18, 8, 28, m, { esquinas: 3, etiqueta: 'panel' }));
  cajas.push(bx(CXs - 8, 12, CXs + 8, 17, 12, 24, T.crema, { esquinas: 3, giros: ['S'] }));
  return {
    W: 32,
    D: 32,
    cajas,
    kyMax: 0.6,
    detalle: (l, p, _g, cs) => {
      for (const c of conEtiqueta(cs, 'panel')) {
        const r = caraSur(c, p);
        for (let j = 1; j < r.h - 1; j += 2) for (let i = 1 + (j % 4 === 1 ? 0 : 1); i < r.w - 1; i += 2) if (l.esOpaco(r.x + i, r.y + j)) l.px(r.x + i, r.y + j, 'madera-clara-1');
      }
    },
  };
}

/** Silla columpio: asiento suspendido por dos cadenas de un travesaño apoyado en dos patas. */
function sillaColumpio(): Modelo {
  const cajas: CajaPlano[] = [];
  for (const x of [3, 26]) cajas.push(bx(x, 4, x + 3, 7, 0, 34, METAL_OSCURO), bx(x, 24, x + 3, 27, 0, 34, METAL_OSCURO));
  cajas.push(bx(3, 4, 29, 7, 32, 35, METAL_OSCURO), bx(3, 24, 29, 27, 32, 35, METAL_OSCURO));
  cajas.push(bx(3, 14, 29, 17, 32, 35, METAL_OSCURO));
  for (const x of [8, 22]) cajas.push(bx(x, 14, x + 1, 15, 12, 33, METAL));
  cajas.push(bx(6, 9, 26, 26, 7, 12, T.pastel, { esquinas: 2, etiqueta: 'asiento' }));
  cajas.push(bx(6, 6, 26, 10, 10, 22, T.pastel, { esquinas: 2, etiqueta: 'panel' }));
  return { W: 32, D: 32, cajas, kyMax: 0.55 };
}

/** Silla con patas en X (Barcelona): dos cojines de cuero con botones sobre un marco cromado. */
function sillaBarcelona(): Modelo {
  const cajas: CajaPlano[] = [];
  for (const x of [6, 24]) cajas.push(bx(x, 6, x + 2, 28, 0, 2, METAL), bx(x, 8, x + 2, 11, 2, 11, METAL), bx(x, 22, x + 2, 25, 2, 7, METAL));
  cajas.push(bx(6, 17, 26, 19, 3, 5, METAL));
  cajas.push(bx(6, 12, 26, 27, 7, 11, T.cuero, { esquinas: 2, etiqueta: 'asiento' }));
  cajas.push(bx(7, 6, 25, 11, 9, 22, T.cuero, { esquinas: 2, etiqueta: 'respaldo' }));
  return { W: 32, D: 32, cajas, detalle: (l, p, _g, cs) => {
    for (const c of conEtiqueta(cs, 'respaldo')) botones(l, caraSur(c, p), 'cuero-0', 7);
    for (const c of conEtiqueta(cs, 'asiento')) botones(l, caraSuperior(c, p), 'cuero-0', 9);
  } };
}

/** Butaca en U: respaldo y brazos de una sola pieza que abraza el cojín, sobre patas cortas. */
function butacaEnU(): Modelo {
  const cajas: CajaPlano[] = [];
  for (const [x, y] of [[6, 6], [23, 6], [6, 24], [23, 24]] as const) cajas.push(bx(x, y, x + 3, y + 3, 0, 4, NOGAL));
  cajas.push(bx(3, 4, 29, 28, 3, 5, NOGAL, { esquinas: 1 }));
  cajas.push(bx(3, 4, 29, 11, 5, 17, T.morado, { esquinas: 3, etiqueta: 'panel' }));
  cajas.push(bx(3, 11, 9, 28, 5, 15, T.morado, { esquinas: 3 }), bx(23, 11, 29, 28, 5, 15, T.morado, { esquinas: 3 }));
  cajas.push(bx(9, 11, 23, 28, 5, 10, T.morado, { esquinas: 2, etiqueta: 'asiento' }));
  return { W: 32, D: 32, cajas, detalle: (l, p, _g, cs) => conEtiqueta(cs, 'asiento').forEach((c) => botones(l, caraSuperior(c, p), 'morado-0', 12)) };
}

/** Butaca nube: tres almohadones blandos y redondos apilados. */
function butacaNube(): Modelo {
  const cajas: CajaPlano[] = [];
  cajas.push(bx(3, 4, 29, 28, 0, 6, BLANCO_PINTADO, { esquinas: 3 }));
  cajas.push(bx(3, 4, 29, 14, 6, 21, BLANCO_PINTADO, { esquinas: 3, etiqueta: 'panel' }));
  cajas.push(bx(3, 10, 11, 28, 6, 14, BLANCO_PINTADO, { esquinas: 3 }), bx(21, 10, 29, 28, 6, 14, BLANCO_PINTADO, { esquinas: 3 }));
  cajas.push(bx(10, 13, 22, 28, 6, 11, BLANCO_PINTADO, { esquinas: 3, etiqueta: 'asiento' }));
  return { W: 32, D: 32, cajas };
}

/** Sillón lounger: cáscara de madera curvada y cojines de cuero sobre una base de cinco puntas. */
function lounger(): Modelo {
  const cajas: CajaPlano[] = [];
  cajas.push(bx(8, 16, 24, 20, 0, 3, METAL_OSCURO), bx(14, 10, 18, 27, 0, 3, METAL_OSCURO), bx(14, 16, 18, 20, 3, 6, METAL));
  cajas.push(bx(4, 9, 28, 28, 6, 9, NOGAL, { esquinas: 3 }));
  cajas.push(bx(5, 3, 27, 12, 8, 24, NOGAL, { esquinas: 3, etiqueta: 'panel' }));
  cajas.push(bx(7, 11, 25, 28, 9, 13, T.cuero, { esquinas: 3, etiqueta: 'asiento' }));
  cajas.push(bx(8, 7, 24, 13, 11, 22, T.cuero, { esquinas: 3, giros: ['S'], etiqueta: 'respaldo' }));
  return { W: 32, D: 32, cajas };
}

/** Silla perezosa: reclinable, con respaldo largo y descansapiés al frente. */
function sillaPerezosa(): Modelo {
  const cajas: CajaPlano[] = [];
  cajas.push(bx(3, 4, 29, 28, 0, 4, NOGAL, { esquinas: 1 }));
  cajas.push(bx(4, 4, 28, 12, 4, 24, T.mostaza, { esquinas: 3, etiqueta: 'panel' }));
  cajas.push(bx(4, 12, 28, 22, 4, 9, T.mostaza, { esquinas: 2, etiqueta: 'asiento' }));
  cajas.push(bx(6, 22, 26, 29, 4, 7, T.mostaza, { esquinas: 2 }));
  cajas.push(bx(3, 11, 8, 24, 4, 12, T.mostaza, { esquinas: 2 }), bx(24, 11, 29, 24, 4, 12, T.mostaza, { esquinas: 2 }));
  return { W: 32, D: 32, cajas };
}

/** Butaca cubo con marco tubular: cuatro cojines de cuero dentro de un marco de tubo cromado. */
function butacaCubo(): Modelo {
  const cajas: CajaPlano[] = [];
  for (const [x, y] of [[3, 4], [27, 4], [3, 26], [27, 26]] as const) cajas.push(bx(x, y, x + 2, y + 2, 0, 12, METAL));
  cajas.push(bx(3, 4, 29, 6, 10, 12, METAL), bx(3, 4, 5, 28, 10, 12, METAL), bx(27, 4, 29, 28, 10, 12, METAL));
  cajas.push(bx(3, 4, 29, 28, 2, 4, METAL));
  cajas.push(bx(5, 6, 27, 12, 4, 16, T.cuero, { esquinas: 2, etiqueta: 'panel' }));
  cajas.push(bx(5, 12, 27, 28, 4, 9, T.cuero, { esquinas: 2, etiqueta: 'asiento' }));
  cajas.push(bx(6, 12, 26, 14, 9, 14, T.cuero, { esquinas: 1, giros: ['S'], etiqueta: 'respaldo' }));
  return { W: 32, D: 32, cajas };
}

// ---------------------------------------------------------------------------
// Recetas
// ---------------------------------------------------------------------------

export const RECETAS_SOFAS: readonly Receta[] = [
  { id: 'sofa-cuero-moderno', modelo: sofa({ n: 3, tapiz: T.cuero, marco: NOGAL, patas: 'altas', brazos: 'finos', respaldo: 8, botones: 'cuero-0', esquinas: 1 }), desde: HEX.cuero },
  { id: 'butaca-art-deco', modelo: sofa({ n: 1, tapiz: T.rosa, marco: ORO, patas: 'altas', brazos: 'redondos', respaldo: 16, esquinas: 3, botones: 'rojo-suave-1' }), desde: HEX.rosa },
  { id: 'modular-segmento', modelo: moduloSegmento(T.gris, AZUL), desde: HEX.gris },
  { id: 'butaca-knoll', modelo: sofa({ n: 1, tapiz: T.lavanda, marco: METAL, patas: 'metal', brazos: 'bajos', respaldo: 10, esquinas: 3 }), desde: HEX.lavanda },
  { id: 'banca-con-cojin', modelo: bancaCojin(), desde: HEX.lavanda },
  { id: 'sillon-huevo', modelo: sillonHuevo(), desde: HEX.mostaza },
  { id: 'butaca-aviador', modelo: sofa({ n: 1, tapiz: T.cuero, marco: METAL, patas: 'metal', brazos: 'bajos', respaldo: 11, brazoTonos: METAL, esquinas: 2 }), desde: HEX.cuero },
  { id: 'modular-exterior-segmento', modelo: moduloSegmento(T.pastel, tonos5('madera-clara'), true), desde: HEX.pastel },
  { id: 'butaca-nube', modelo: butacaNube(), desde: rampa('neutro').slice(4, 8) },
  { id: 'sofa-antiguo', modelo: sofa({ n: 3, tapiz: T.crema, marco: NOGAL, patas: 'cortas', brazos: 'redondos', respaldo: 13, botones: 'crema-0', esquinas: 3, barra: NOGAL }), desde: HEX.crema },
  { id: 'sofa-knoll', modelo: sofa({ n: 2, tapiz: T.gris, marco: METAL, patas: 'metal', brazos: 'finos', brazoTonos: METAL, respaldo: 9, esquinas: 1 }), desde: HEX.gris },
  { id: 'silla-columpio', modelo: sillaColumpio(), desde: HEX.pastel },
  { id: 'butaca-acogedora', modelo: sofa({ n: 1, tapiz: T.naranja, marco: NOGAL, patas: 'cortas', brazos: 'redondos', respaldo: 12, esquinas: 3, botones: 'naranja-1' }), desde: HEX.naranja },
  { id: 'modular-exterior-esquina', modelo: moduloEsquina(T.pastel, tonos5('madera-clara'), true), desde: HEX.pastel },
  { id: 'silla-barcelona', modelo: sillaBarcelona(), desde: HEX.cuero },
  { id: 'butaca-en-u', modelo: butacaEnU(), desde: HEX.morado },
  { id: 'puf-saco', modelo: pufSaco(), desde: HEX.naranja },
  { id: 'sillon-huevo-mimbre', modelo: huevoMimbre(), desde: HEX.maderaClara },
  { id: 'sofa-lecorbusier', modelo: sofa({ n: 3, tapiz: T.cuero, marco: METAL, patas: 'metal', brazos: 'altos', respaldo: 6, cojines: 3, brazoTonos: T.cuero, esquinas: 1 }), desde: HEX.cuero },
  { id: 'sofa-art-deco', modelo: sofa({ n: 2, tapiz: T.mostaza, marco: ORO, patas: 'altas', brazos: 'redondos', respaldo: 15, esquinas: 3, botones: 'tela-calida-0' }), desde: HEX.mostaza },
  { id: 'chaise-antigua', modelo: chaise(), desde: HEX.rosa },
  { id: 'sofa-aviador', modelo: sofa({ n: 3, tapiz: T.cuero, marco: METAL, patas: 'metal', brazos: 'bajos', respaldo: 10, brazoTonos: METAL, esquinas: 2 }), desde: HEX.cuero },
  { id: 'modular-esquina', modelo: moduloEsquina(T.gris, AZUL), desde: HEX.gris },
  { id: 'butaca-lecorbusier', modelo: butacaCubo(), desde: HEX.cuero },
  { id: 'banca-parque', modelo: bancaParque(), desde: HEX.maderaClara },
  { id: 'banca-jardin', modelo: bancaJardin(), desde: rampa('neutro').slice(3, 8) },
  { id: 'sillon-lounger', modelo: lounger(), desde: HEX.cuero },
  { id: 'silla-perezosa', modelo: sillaPerezosa(), desde: HEX.mostaza },
];

export function cuadrosSofas9(): Cuadros {
  const c: Cuadros = new Map();
  for (const r of RECETAS_SOFAS) registrarReceta(c, r);
  return c;
}

void MADERA_CLARA;
void ROBLE;
void NEGRO;
void (null as unknown as ColorEntrada);
