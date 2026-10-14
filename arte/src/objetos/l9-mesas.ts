/**
 * Lote 9, mesas y escritorios. Las mesas rectangulares y los escritorios salen de `mesa()`, un constructor de cajas con
 * piezas intercambiables (tapa, patas, cajoneras, detalles de la tapa); las redondas se dibujan directo en `mesaRedonda()`.
 *
 * Familias de Gather con sus tres fondos (1, 2 y 3 casillas, siempre de 3 de ancho): tronco, Chippendale, industrial, simple,
 * pesada, octagonal y de conferencia. Cada familia es UNA función de estilo y los tres tamaños salen de la misma pieza
 * (la tapa crece y las patas se quedan en las esquinas).
 *
 * Medidas de la vista (casilla de 32 px): la tapa llega a 13 filas del piso y mide 3 de grosor; la escala vertical vale 1
 * (cada píxel de fondo es una fila), como en los escritorios del lote 8. `sobresale` es 10 (8 en las mesas bajas).
 */

import { Lienzo, rampa } from '../nucleo';
import type { ColorEntrada } from '../nucleo';
import { AZUL, MADERA_CLARA, MADERA_OSCURA, METAL, METAL_OSCURO, NEGRO, ORO, VIDRIO, bx, cerrarSuelo, conEtiqueta, caraSuperior, caraSur, patas4, registrarR, registrarReceta, tonos5 } from './l9-comun';
import type { CajaPlano, Cuadros, Giro, Modelo, Proyeccion, Receta, Rect, TonosCaja } from './l9-comun';
import { azar } from './l8-comun';

const CUERO = tonos5('cuero');
const CREMA = tonos5('crema');
const CEMENTO: TonosCaja = { superior: 'cemento-3', frente: 'cemento-2', luz: 'neutro-6', luzFrente: 'cemento-3', filo: 'cemento-3', sombra: 'cemento-0', sombraLado: 'cemento-1' };
const PIZARRA_TAPA: TonosCaja = { superior: 'pizarra-4', frente: 'pizarra-1', luz: 'pizarra-5', luzFrente: 'pizarra-2', filo: 'pizarra-3', sombra: 'pizarra-0', sombraLado: 'pizarra-0' };
const MARMOL: TonosCaja = { superior: 'neutro-7', frente: 'neutro-6', luz: 'neutro-7', luzFrente: 'neutro-7', filo: 'neutro-7', sombra: 'baldosa-gris-3', sombraLado: 'neutro-5' };
const NOGAL = MADERA_OSCURA;
const ROBLE = MADERA_CLARA;

type Patas = 'cuatro' | 'gruesas' | 'torneadas' | 'caballete' | 'panel' | 'metal' | 'tronco' | 'cajonera' | 'ninguna' | 'tubular';
type Forma = 'rect' | 'octagono' | 'ovalo';

interface OpMesa {
  ancho: number;
  fondo: number;
  tapa: TonosCaja;
  /** Material de las patas y los costados. */
  marco: TonosCaja;
  /** Alto de la tapa sobre el piso, en filas. */
  alto?: number;
  grosor?: number;
  patas?: Patas;
  forma?: Forma;
  esquinas?: number;
  /** Línea de incrustación por dentro del borde de la tapa. */
  incrustacion?: ColorEntrada;
  /** Panel interior de otro material (cuero de un escritorio ejecutivo, vidrio). */
  panel?: ColorEntrada;
  anillos?: boolean;
  remaches?: boolean;
  tablones?: [ColorEntrada, ColorEntrada];
  /** Cajonera a un lado ('izq', 'der') o a los dos, con su tono de frente. */
  cajonera?: { lado: 'izq' | 'der' | 'ambos'; tonos: TonosCaja; tirador: ColorEntrada };
  /** Un travesaño bajo la tapa (carril, estante). */
  estante?: TonosCaja;
  transportador?: boolean;
  /** Vetas cortas de la madera de la tapa (dos tonos). */
  vetas?: [ColorEntrada, ColorEntrada];
  /** Faldón (travesaño) bajo la tapa, entre las patas. */
  faldon?: TonosCaja;
  /** Tablero inclinado: la tapa sube hacia el fondo. */
  inclinado?: boolean;
}

/** Cuerpo de una mesa o un escritorio visto desde el sur: tapa con grosor, patas y detalles. */
function mesa(o: OpMesa): Modelo {
  const W = o.ancho * 32;
  const D = o.fondo * 32;
  const x0 = 2;
  const x1 = W - 3;
  const y0 = 3;
  const y1 = D - 4;
  const z1 = o.alto ?? 13;
  const gr = o.grosor ?? 3;
  const z0 = z1 - gr;
  const cajas: CajaPlano[] = [];
  const patas = o.patas ?? 'cuatro';
  const med = Math.round((y0 + y1) / 2);
  switch (patas) {
    case 'cuatro':
      cajas.push(...patas4(x0 + 2, y0 + 1, x1 - 2, y1 - 1, 0, z0, o.marco, 3));
      break;
    case 'gruesas':
      cajas.push(...patas4(x0 + 2, y0 + 1, x1 - 2, y1 - 1, 0, z0, o.marco, 5));
      break;
    case 'torneadas':
      cajas.push(...patas4(x0 + 3, y0 + 2, x1 - 3, y1 - 2, 0, z0, o.marco, 3));
      for (const [px, py] of [[x0 + 3, y1 - 5], [x1 - 6, y1 - 5]] as const) cajas.push(bx(px - 1, py - 1, px + 4, py + 4, 3, 6, o.marco, { esquinas: 2 }));
      break;
    case 'tubular':
      cajas.push(...patas4(x0 + 2, y0 + 1, x1 - 2, y1 - 1, 0, z0, METAL, 2));
      cajas.push(bx(x0 + 2, y0 + 1, x0 + 4, y1 - 1, 0, 2, METAL), bx(x1 - 4, y0 + 1, x1 - 2, y1 - 1, 0, 2, METAL));
      break;
    case 'metal':
      cajas.push(...patas4(x0 + 3, y0 + 2, x1 - 3, y1 - 2, 0, z0, METAL_OSCURO, 3));
      cajas.push(bx(x0 + 3, y0 + 2, x0 + 6, y1 - 2, 3, 5, METAL), bx(x1 - 6, y0 + 2, x1 - 3, y1 - 2, 3, 5, METAL));
      break;
    case 'tronco':
      for (const [px, py] of [[x0 + 3, y0 + 2], [x1 - 8, y0 + 2], [x0 + 3, y1 - 7], [x1 - 8, y1 - 7]] as const) cajas.push(bx(px, py, px + 5, py + 5, 0, z0, o.marco, { esquinas: 1 }));
      break;
    case 'caballete':
      cajas.push(bx(x0 + 3, y0 + 2, x0 + 8, y1 - 2, 0, z0, o.marco), bx(x1 - 8, y0 + 2, x1 - 3, y1 - 2, 0, z0, o.marco), bx(x0 + 8, med - 1, x1 - 8, med + 1, 3, 6, o.marco));
      break;
    case 'panel':
      cajas.push(bx(x0 + 2, y0 + 1, x0 + 7, y1 - 1, 0, z0, o.marco), bx(x1 - 7, y0 + 1, x1 - 2, y1 - 1, 0, z0, o.marco), bx(x0 + 7, y1 - 4, x1 - 7, y1 - 2, 4, z0, o.marco));
      break;
    case 'cajonera': {
      const lado = o.cajonera?.lado ?? 'der';
      const t = o.cajonera?.tonos ?? o.marco;
      cajas.push(bx(x0 + 2, y0 + 1, x0 + 6, y0 + 5, 0, z0, o.marco), bx(x1 - 6, y0 + 1, x1 - 2, y0 + 5, 0, z0, o.marco));
      cajas.push(bx(x0 + 2, y1 - 5, x0 + 6, y1 - 1, 0, z0, o.marco), bx(x1 - 6, y1 - 5, x1 - 2, y1 - 1, 0, z0, o.marco));
      if (lado !== 'der') cajas.push(bx(x0 + 2, y0 + 1, x0 + 22, y1 - 1, 0, z0, t, { esquinas: 0, etiqueta: 'cajonera' }));
      if (lado !== 'izq') cajas.push(bx(x1 - 22, y0 + 1, x1 - 2, y1 - 1, 0, z0, t, { esquinas: 0, etiqueta: 'cajonera' }));
      cajas.push(bx(x0 + 22, y1 - 4, x1 - 22, y1 - 2, 3, z0, o.marco));
      break;
    }
    case 'ninguna':
      break;
  }
  if (o.faldon !== undefined && patas !== 'ninguna') cajas.push(bx(x0 + 3, y0 + 2, x1 - 3, y1 - 2, z0 - 3, z0, o.faldon));
  if (o.estante !== undefined) cajas.push(bx(x0 + 5, y0 + 4, x1 - 5, y1 - 3, 3, 5, o.estante));
  if (o.inclinado === true) {
    // Tablero que sube hacia el fondo: cuatro franjas escalonadas.
    const franjas = 4;
    const largo = (y1 - y0) / franjas;
    for (let i = 0; i < franjas; i++) {
      cajas.push(bx(x0, y1 - (i + 1) * largo, x1, y1 - i * largo, z0 + i, z1 + i, o.tapa, { esquinas: 0, etiqueta: i === 0 ? 'tapa' : 'tapa-franja', sinLuzArriba: i > 0 }));
    }
  } else {
    cajas.push(bx(x0, y0, x1, y1, z0, z1, o.tapa, { esquinas: o.esquinas ?? 0, etiqueta: 'tapa' }));
  }
  const semilla = o.ancho * 31 + o.fondo * 7 + (o.anillos === true ? 1 : 0);
  return {
    W,
    D,
    cajas,
    kyMax: 1,
    detalle: (l, p, giro, cs) => detalleMesa(l, p, giro, cs, o, azar(semilla)),
  };
}

/** Detalles sobre la tapa y las cajoneras, y recorte de las esquinas de tapas octagonales y ovaladas. */
function detalleMesa(l: Lienzo, p: Proyeccion, giro: Giro, cs: readonly CajaPlano[], o: OpMesa, rnd: () => number): void {
  const tapa = conEtiqueta(cs, 'tapa')[0];
  if (tapa === undefined) return;
  const cara = caraSuperior(tapa, p);
  const gr = o.grosor ?? 3;
  const inclinado = o.inclinado === true;
  const alturaCara = inclinado ? Math.max(1, cara.h - 3) : cara.h;
  const sup: Rect = { x: cara.x, y: cara.y, w: cara.w, h: alturaCara };
  const t = o.tapa;
  // Panel interior (cuero, vidrio): rectángulo por dentro con un borde de la tapa.
  if (o.panel !== undefined && sup.w > 10 && sup.h > 8) {
    l.rect(sup.x + 3, sup.y + 3, sup.w - 6, sup.h - 6, o.panel);
    l.rect(sup.x + 3, sup.y + 3, sup.w - 6, 1, 'neutro-6');
    l.rect(sup.x + 3, sup.y + 3, 1, sup.h - 6, 'neutro-6');
  }
  if (o.incrustacion !== undefined && sup.w > 10 && sup.h > 8) {
    l.rectBorde(sup.x + 2, sup.y + 2, sup.w - 4, sup.h - 4, o.incrustacion, 1);
  }
  if (o.vetas !== undefined && sup.w > 12) {
    const n = Math.max(4, Math.round((sup.w * sup.h) / 160));
    for (let i = 0; i < n; i++) {
      const largo = 5 + Math.floor(rnd() * 10);
      const vx = sup.x + 3 + Math.floor(rnd() * Math.max(1, sup.w - 6 - largo));
      const vy = sup.y + 2 + Math.floor(rnd() * Math.max(1, sup.h - 4));
      l.rect(vx, vy, Math.min(largo, sup.w - 6), 1, i % 3 === 2 ? o.vetas[1] : o.vetas[0]);
    }
  }
  if (o.tablones !== undefined) {
    const [a, b] = o.tablones;
    for (let y = sup.y + 5; y < sup.y + sup.h - 2; y += 5) l.rect(sup.x + 1, y, sup.w - 2, 1, a);
    let k = 0;
    for (let y = sup.y + 1; y < sup.y + sup.h - 2; y += 5) {
      const x = sup.x + 4 + Math.floor(rnd() * Math.max(1, sup.w - 12));
      l.rect(x, y, 1, Math.min(4, sup.y + sup.h - 2 - y), b);
      k++;
    }
    void k;
  }
  if (o.anillos === true) {
    const n = Math.max(1, Math.round(sup.w / 40));
    for (let i = 0; i < n; i++) {
      const cx = sup.x + Math.round((sup.w * (i + 0.5)) / n);
      const cy = sup.y + Math.round(sup.h / 2);
      const rx = Math.min(10, Math.floor(sup.w / (2 * n)) - 2);
      const ry = Math.max(2, Math.min(7, Math.floor(sup.h / 2) - 2));
      if (rx < 4) continue;
      l.elipse(cx, cy, rx, ry, 'cuero-2', { relleno: false });
      l.elipse(cx, cy, Math.max(2, Math.round(rx * 0.55)), Math.max(1, Math.round(ry * 0.55)), 'cuero-1', { relleno: false });
      l.px(cx, cy, 'cuero-0');
    }
  }
  if (o.transportador === true && sup.w > 30) {
    const cx = sup.x + Math.round(sup.w / 2);
    const cy = sup.y + sup.h - 4;
    const r = Math.min(12, Math.floor(sup.h) - 5);
    if (r >= 5) {
      l.elipse(cx, cy, r, r, 'azul-oficina-4', { relleno: false });
      l.rect(cx - r, cy, 2 * r + 1, 1, 'azul-oficina-4');
      for (let a = 0; a <= 180; a += 30) {
        const rad = (a * Math.PI) / 180;
        l.px(cx + Math.round(Math.cos(rad) * (r - 2)), cy - Math.round(Math.sin(rad) * (r - 2)), 'azul-oficina-2');
      }
    }
    for (let x = sup.x + 4; x < sup.x + sup.w - 4; x += 4) l.px(x, sup.y + 1, x % 8 === 0 ? 'azul-oficina-2' : 'azul-oficina-3');
  }
  if (o.remaches === true) {
    const y = cara.y + cara.h + 1;
    for (let x = cara.x + 3; x < cara.x + cara.w - 2; x += 8) l.px(x, y, 'metal-3');
  }
  // Cajoneras: líneas entre cajones y tirador, solo vistas de frente.
  if (giro === 'S' && o.cajonera !== undefined) {
    const { tirador } = o.cajonera;
    for (const c of conEtiqueta(cs, 'cajonera')) {
      const r = caraSur(c, p);
      const n = r.h >= 9 ? 3 : 2;
      const hCajon = r.h / n;
      for (let k = 0; k < n; k++) {
        const y = Math.round(r.y + k * hCajon);
        if (k > 0) l.rect(r.x + 1, y, r.w - 2, 1, 'azul-oficina-0');
        l.rect(r.x + Math.floor(r.w / 2) - 2, Math.round(y + hCajon / 2), 4, 1, tirador);
      }
    }
  }
  // Tablero inclinado: hoja de papel con trazos.
  if (inclinado) {
    const franjas = conEtiqueta(cs, 'tapa').concat(conEtiqueta(cs, 'tapa-franja'));
    const ys = franjas.map((c) => caraSuperior(c, p));
    const top = Math.min(...ys.map((r) => r.y));
    const bottom = Math.max(...ys.map((r) => r.y + r.h));
    const x = cara.x + 5;
    const w = cara.w - 10;
    if (w > 8 && bottom - top > 8) {
      l.rect(x, top + 2, w, bottom - top - 5, 'neutro-7');
      l.rect(x, top + 2, w, 1, 'azul-oficina-4');
      for (let j = top + 5; j < bottom - 4; j += 3) l.rect(x + 2, j, Math.max(2, w - 4 - ((j * 7) % 9)), 1, 'vidrio-1');
      l.elipse(x + w - 6, top + 7, 3, 3, 'rojo-suave-2', { relleno: false });
    }
  }
  // Recorte de esquinas.
  const area: Rect = { x: cara.x, y: cara.y, w: cara.w, h: inclinado ? cara.h : cara.h + gr };
  if (o.forma === 'octagono') recortarOctagono(l, area, Math.min(9, Math.floor(area.h / 2), Math.floor(area.w / 4)));
  if (o.forma === 'ovalo') recortarOvalo(l, area);
  void t;
}

function recortarOctagono(l: Lienzo, r: Rect, c: number): void {
  for (let j = 0; j < c; j++) {
    for (let i = 0; i < c - j; i++) {
      for (const [x, y] of [[r.x + i, r.y + j], [r.x + r.w - 1 - i, r.y + j], [r.x + i, r.y + r.h - 1 - j], [r.x + r.w - 1 - i, r.y + r.h - 1 - j]] as const) l.px(x, y, null);
    }
  }
}

function recortarOvalo(l: Lienzo, r: Rect): void {
  const cx = r.x + (r.w - 1) / 2;
  const cy = r.y + (r.h - 1) / 2;
  for (let y = r.y; y < r.y + r.h; y++) {
    for (let x = r.x; x < r.x + r.w; x++) {
      const u = (x - cx) / (r.w / 2);
      const v = (y - cy) / (r.h / 2);
      if (u * u + v * v > 1.02) l.px(x, y, null);
    }
  }
}

// ---------------------------------------------------------------------------
// Mesas redondas (se dibujan directo; una sola vista)
// ---------------------------------------------------------------------------

interface OpRedonda {
  /** Casillas de ancho y de alto, y filas extra. */
  tw: number;
  th: number;
  sobresale: number;
  /** Rampa de 5 tonos de la tapa, de la tapa (3 y 4) y del canto (1 y 2). */
  tapa: string;
  canto?: string;
  /** Pies: tres patas, columna central con base o patas torneadas. */
  pies: 'tres' | 'columna' | 'torneadas';
  pie?: string;
  marmol?: boolean;
  /** Radio de la tapa menor que el máximo (para mesas pequeñas). */
  reduccion?: number;
}

function mesaRedonda(o: OpRedonda): Lienzo {
  const W = o.tw * 32;
  const H = o.th * 32 + o.sobresale;
  const l = new Lienzo(W, H);
  const cx = (W - 3) / 2 + 1;
  const rx = Math.floor((W - 8) / 2) - (o.reduccion ?? 0);
  const alturaTapa = H - 4 - 10;
  const ryMax = Math.max(4, Math.floor(alturaTapa / 2) - 2 - (o.reduccion ?? 0));
  const ry = o.tw === 1 ? Math.min(ryMax, Math.round(rx * 0.6)) : ryMax;
  const cy = 2 + ry + 1;
  const pie = o.pie ?? 'madera-oscura';
  const canto = o.canto ?? o.tapa;
  const piso = H - 4;
  // Pies: se dibujan primero (quedan debajo del canto).
  if (o.pies === 'tres') {
    for (const [dx, ancho] of [[-0.62, 3], [0, 3], [0.62, 3]] as const) {
      const x = Math.round(cx + dx * rx - 1);
      const y0 = cy + ry - 1;
      l.rect(x, y0, ancho, piso - y0, `${pie}-2`);
      l.rect(x, y0, 1, piso - y0, `${pie}-3`);
      l.rect(x + ancho - 1, y0 + 2, 1, piso - y0 - 2, `${pie}-1`);
    }
  } else if (o.pies === 'torneadas') {
    for (const dx of [-0.66, 0.66]) {
      const x = Math.round(cx + dx * rx - 1);
      const y0 = cy + ry - 1;
      l.rect(x, y0, 3, piso - y0, `${pie}-2`);
      l.rect(x, y0, 1, piso - y0, `${pie}-3`);
      l.rect(x + 2, y0 + 2, 1, piso - y0 - 2, `${pie}-1`);
      l.rect(x - 1, piso - 2, 5, 2, `${pie}-2`);
      l.rect(x - 1, y0 + Math.floor((piso - y0) / 2), 5, 2, `${pie}-3`);
    }
  } else {
    const y0 = cy + ry - 1;
    l.rect(Math.round(cx) - 2, y0, 5, piso - y0 - 2, `${pie}-2`);
    l.rect(Math.round(cx) - 2, y0, 1, piso - y0 - 2, `${pie}-3`);
    l.rect(Math.round(cx) + 2, y0 + 2, 1, piso - y0 - 4, `${pie}-1`);
    l.elipse(Math.round(cx), piso - 2, Math.min(9, Math.floor(rx * 0.55)), 2, `${pie}-2`);
    l.elipse(Math.round(cx) - 1, piso - 3, Math.min(8, Math.floor(rx * 0.5)), 1, `${pie}-3`);
  }
  // Canto y tapa.
  l.elipse(cx, cy + 3, rx, ry, `${canto}-1`);
  l.elipse(cx, cy + 2, rx, ry, `${canto}-2`);
  l.elipse(cx, cy, rx, ry, `${o.tapa}-3`);
  // Luz arriba a la izquierda: un anillo más claro y un reflejo.
  l.elipse(cx, cy, rx, ry, `${o.tapa}-4`, { relleno: false });
  l.elipse(cx + 1, cy + 1, rx - 2, Math.max(2, ry - 2), `${o.tapa}-3`);
  l.elipse(cx + 1, cy + 1, rx - 2, Math.max(2, ry - 2), `${o.tapa}-2`, { relleno: false, angulo: 0 });
  l.rect(Math.round(cx - rx * 0.55), Math.round(cy - ry * 0.45), 3, 1, `${o.tapa}-4`);
  l.px(Math.round(cx - rx * 0.55) - 1, Math.round(cy - ry * 0.45) + 1, `${o.tapa}-4`);
  if (o.marmol === true) {
    l.elipse(cx, cy, rx - 1, ry - 1, 'neutro-7');
    for (const [dx, dy, largo] of [[-0.3, -0.3, 5], [0.2, 0.1, 6], [-0.1, 0.4, 4], [0.5, -0.3, 3]] as const) l.linea(Math.round(cx + dx * rx), Math.round(cy + dy * ry), Math.round(cx + dx * rx) + largo, Math.round(cy + dy * ry) - 2, 'baldosa-gris-3');
  }
  return cerrarSuelo(l, { diagonales: true });
}

/** Mesa lateral pequeña: una bandeja redonda sobre tres patas finas abiertas. */
function mesaLateralFina(o: { tw: number; th: number; sobresale: number; tapa: string; pie: string }): Lienzo {
  const l = new Lienzo(o.tw * 32, o.th * 32 + o.sobresale);
  const H = l.alto;
  const cx = 15;
  const rx = 10;
  const piso = H - 4;
  // Tres patas abiertas.
  for (const [x0, x1] of [[cx - 8, cx - 11], [cx, cx], [cx + 8, cx + 11]] as const) {
    const largo = piso - 18;
    for (let k = 0; k <= largo; k++) {
      const x = Math.round(x0 + ((x1 - x0) * k) / largo);
      l.rect(x, 18 + k, 2, 1, k > largo / 2 ? `${o.pie}-2` : `${o.pie}-3`);
    }
  }
  l.elipse(cx, 12, rx, 6, `${o.tapa}-1`);
  l.elipse(cx, 11, rx, 6, `${o.tapa}-2`);
  l.elipse(cx, 9, rx, 6, `${o.tapa}-3`);
  l.elipse(cx, 9, rx, 6, `${o.tapa}-4`, { relleno: false });
  l.elipse(cx + 1, 10, rx - 2, 4, `${o.tapa}-3`);
  l.rect(cx - 6, 6, 3, 1, `${o.tapa}-4`);
  return cerrarSuelo(l, { diagonales: true });
}

/** Soporte para plantas: columna fina con una repisa redonda arriba y una base ancha. */
function soportePlantas(): Lienzo {
  const l = new Lienzo(32, 40);
  const cx = 15;
  l.rect(cx - 1, 14, 3, 20, 'madera-oscura-2');
  l.rect(cx - 1, 14, 1, 20, 'madera-oscura-3');
  l.rect(cx + 1, 16, 1, 18, 'madera-oscura-1');
  l.elipse(cx, 33, 8, 3, 'madera-oscura-1');
  l.elipse(cx, 32, 8, 3, 'madera-oscura-2');
  l.elipse(cx - 1, 31, 6, 2, 'madera-oscura-3');
  l.elipse(cx, 16, 11, 5, 'madera-oscura-1');
  l.elipse(cx, 15, 11, 5, 'madera-oscura-2');
  l.elipse(cx, 13, 11, 5, 'madera-oscura-3');
  l.elipse(cx, 13, 11, 5, 'madera-oscura-4', { relleno: false });
  l.elipse(cx + 1, 14, 9, 3, 'madera-oscura-3');
  l.rect(cx - 7, 11, 3, 1, 'madera-oscura-4');
  return cerrarSuelo(l, { diagonales: true });
}

// ---------------------------------------------------------------------------
// Recetas: familias de mesas
// ---------------------------------------------------------------------------

const VETA_CLARA: [ColorEntrada, ColorEntrada] = ['madera-clara-2', 'madera-clara-4'];
const VETA_CREMA: [ColorEntrada, ColorEntrada] = ['crema-1', 'crema-4'];
const DESDE_NOGAL = rampa('madera-oscura');
const DESDE_ROBLE = rampa('madera-clara');
const DESDE_CUERO = rampa('cuero');
const DESDE_CREMA = rampa('crema');
const DESDE_PIZARRA = rampa('pizarra');
const DESDE_CEMENTO = rampa('cemento');

interface FamiliaMesa {
  clave: string;
  desde: readonly string[];
  /** Opciones por fondo (1, 2 o 3). */
  op: (fondo: number) => Omit<OpMesa, 'ancho' | 'fondo'>;
}

const FAMILIAS: readonly FamiliaMesa[] = [
  { clave: 'tronco', desde: DESDE_NOGAL, op: () => ({ tapa: { ...NOGAL, filo: 'madera-oscura-4' }, marco: tonos5('madera-oscura', -1), patas: 'tronco', grosor: 4, anillos: true, esquinas: 1 }) },
  { clave: 'chippendale', desde: DESDE_CUERO, op: () => ({ tapa: CUERO, marco: CUERO, patas: 'torneadas', grosor: 3, incrustacion: 'cuero-4', esquinas: 1 }) },
  { clave: 'industrial', desde: DESDE_NOGAL, op: () => ({ tapa: NOGAL, marco: METAL_OSCURO, patas: 'metal', grosor: 3, remaches: true, tablones: ['madera-oscura-1', 'madera-oscura-4'] }) },
  { clave: 'simple', desde: DESDE_ROBLE, op: () => ({ tapa: ROBLE, marco: ROBLE, patas: 'cuatro', grosor: 3, vetas: VETA_CLARA, faldon: ROBLE }) },
  { clave: 'pesada', desde: DESDE_NOGAL, op: () => ({ tapa: { ...NOGAL, superior: 'madera-oscura-2', luz: 'madera-oscura-4' }, marco: tonos5('madera-oscura', -1), patas: 'gruesas', grosor: 5, alto: 14, tablones: ['madera-oscura-1', 'madera-oscura-3'] }) },
  { clave: 'octagonal', desde: DESDE_CREMA, op: () => ({ tapa: CREMA, marco: tonos5('crema', -1), patas: 'cuatro', grosor: 3, forma: 'octagono', incrustacion: 'crema-1', vetas: VETA_CREMA }) },
  { clave: 'conferencia', desde: DESDE_PIZARRA, op: () => ({ tapa: PIZARRA_TAPA, marco: METAL, patas: 'tubular', grosor: 3, incrustacion: 'pizarra-3' }) },
];

const recetasFamilia: Receta[] = FAMILIAS.flatMap((f) =>
  [1, 2, 3].map((fondo): Receta => ({ id: `mesa-${f.clave}-3x${fondo}`, modelo: mesa({ ancho: 3, fondo, ...f.op(fondo) }), desde: f.desde })),
);

// ---------------------------------------------------------------------------
// Recetas: escritorios (3 casillas, cuatro orientaciones)
// ---------------------------------------------------------------------------

const D3 = (o: Omit<OpMesa, 'ancho' | 'fondo'>): Modelo => mesa({ ancho: 3, fondo: 1, ...o });
const CAJON_CLARO = { tonos: tonos5('madera-clara', -1) as TonosCaja, tirador: 'madera-clara-4' as ColorEntrada };

const recetasEscritorio: Receta[] = [
  { id: 'escritorio-simple', modelo: D3({ tapa: ROBLE, marco: ROBLE, patas: 'cuatro', vetas: VETA_CLARA, faldon: ROBLE }), desde: DESDE_ROBLE },
  { id: 'escritorio-chippendale', modelo: D3({ tapa: CUERO, marco: CUERO, patas: 'cajonera', cajonera: { lado: 'ambos', tonos: CUERO, tirador: 'tela-calida-3' }, incrustacion: 'cuero-4', esquinas: 1 }), desde: DESDE_CUERO },
  { id: 'escritorio-zen', modelo: D3({ tapa: CREMA, marco: tonos5('madera-oscura', -1), patas: 'cuatro', grosor: 2, alto: 11, vetas: VETA_CREMA, faldon: tonos5('madera-oscura', -1) }), desde: DESDE_CREMA },
  { id: 'escritorio-ovalado', modelo: D3({ tapa: BLANCO_TAPA(), marco: METAL, patas: 'tubular', forma: 'ovalo', grosor: 3 }), desde: rampa('neutro').slice(3, 8) },
  { id: 'escritorio-industrial', modelo: D3({ tapa: NOGAL, marco: METAL_OSCURO, patas: 'metal', remaches: true, tablones: ['madera-oscura-1', 'madera-oscura-4'], estante: METAL }), desde: DESDE_NOGAL },
  { id: 'escritorio-ejecutivo-antiguo', modelo: D3({ tapa: CUERO, marco: CUERO, patas: 'cajonera', cajonera: { lado: 'ambos', tonos: CUERO, tirador: 'tela-calida-3' }, panel: 'planta-1', esquinas: 1, grosor: 4 }), desde: DESDE_CUERO },
  { id: 'escritorio-oficina', modelo: D3({ tapa: ROBLE, marco: ROBLE, patas: 'cajonera', vetas: VETA_CLARA, cajonera: { lado: 'der', tonos: { ...tonos5('madera-clara', -1) }, tirador: 'madera-clara-0' } }), desde: DESDE_ROBLE },
  { id: 'escritorio-bauhaus', modelo: D3({ tapa: NEGRO, marco: METAL, patas: 'tubular', grosor: 2, alto: 12 }), desde: rampa('neutro').slice(0, 5) },
  { id: 'escritorio-patas-nelson', modelo: D3({ tapa: CREMA, marco: NOGAL, patas: 'cuatro', grosor: 2, alto: 12, esquinas: 1, vetas: VETA_CREMA, faldon: NOGAL }), desde: DESDE_CREMA },
  { id: 'escritorio-ejecutivo-moderno', modelo: D3({ tapa: VIDRIO_TAPA(), marco: METAL_OSCURO, patas: 'cajonera', cajonera: { lado: 'izq', tonos: NEGRO, tirador: 'metal-3' }, grosor: 2 }), desde: rampa('vidrio') },
  { id: 'mesa-de-dibujo', modelo: D3({ tapa: PIZARRA_TAPA, marco: METAL, patas: 'tubular', inclinado: true, grosor: 2, alto: 12 }), desde: DESDE_PIZARRA },
  { id: 'escritorio-transportador', modelo: D3({ tapa: ROBLE, marco: METAL, patas: 'metal', transportador: true, vetas: VETA_CLARA }), desde: DESDE_ROBLE },
  { id: 'escritorio-madera-recuperada', modelo: D3({ tapa: { ...NOGAL, superior: 'madera-oscura-3' }, marco: tonos5('madera-oscura', -1), patas: 'caballete', tablones: ['madera-oscura-1', 'madera-oscura-4'], grosor: 4 }), desde: DESDE_NOGAL },
];

function BLANCO_TAPA(): TonosCaja {
  return { superior: 'neutro-7', frente: 'neutro-5', luz: 'neutro-7', luzFrente: 'neutro-6', filo: 'neutro-6', sombra: 'neutro-3', sombraLado: 'neutro-4' };
}
function VIDRIO_TAPA(): TonosCaja {
  return { superior: 'vidrio-3', frente: 'vidrio-1', luz: 'neutro-7', luzFrente: 'vidrio-2', filo: 'vidrio-2', sombra: 'vidrio-0', sombraLado: 'vidrio-0' };
}

// ---------------------------------------------------------------------------
// Recetas: mesas sueltas
// ---------------------------------------------------------------------------

const M = (o: Omit<OpMesa, 'ancho' | 'fondo'> & { ancho: number; fondo: number }): Modelo => mesa(o);

const recetasSueltas: Receta[] = [
  { id: 'mesa-piedra', modelo: M({ ancho: 2, fondo: 1, tapa: CEMENTO, marco: tonos5('cemento', -1) as TonosCaja, patas: 'caballete', grosor: 4, alto: 13 }), desde: DESDE_CEMENTO },
  { id: 'mesa-cuadrada', modelo: M({ ancho: 2, fondo: 2, tapa: ROBLE, marco: ROBLE, patas: 'cuatro', grosor: 3, vetas: VETA_CLARA, faldon: ROBLE }), desde: DESDE_ROBLE },
  { id: 'mesa-centro-antigua', modelo: M({ ancho: 2, fondo: 1, tapa: CUERO, marco: CUERO, patas: 'torneadas', alto: 11, incrustacion: 'cuero-4', esquinas: 1 }), desde: DESDE_CUERO },
  { id: 'mesa-centro-tronco', modelo: M({ ancho: 2, fondo: 1, tapa: { ...NOGAL, filo: 'madera-oscura-4' }, marco: tonos5('madera-oscura', -1), patas: 'tronco', alto: 11, grosor: 4, anillos: true, esquinas: 2 }), desde: DESDE_NOGAL },
  { id: 'mesa-centro-simple', modelo: M({ ancho: 2, fondo: 1, tapa: CREMA, marco: tonos5('crema', -1), patas: 'cuatro', alto: 10, vetas: VETA_CREMA, faldon: tonos5('crema', -1) }), desde: DESDE_CREMA },
];

export function cuadrosMesas9(): Cuadros {
  const c: Cuadros = new Map();
  for (const r of [...recetasFamilia, ...recetasEscritorio, ...recetasSueltas]) registrarReceta(c, r);
  // Mesas redondas y pequeñas (una sola vista).
  const redondas: ReadonlyArray<readonly [string, Lienzo, readonly string[]]> = [
    ['mesa-lateral-moderna', mesaLateralFina({ tw: 1, th: 1, sobresale: 8, tapa: 'crema', pie: 'madera-oscura' }), rampa('crema')],
    ['mesa-centro-redonda', mesaRedonda({ tw: 2, th: 2, sobresale: 8, tapa: 'madera-clara', pies: 'tres', pie: 'madera-oscura' }), DESDE_ROBLE],
    ['mesa-elegante-marmol', mesaRedonda({ tw: 1, th: 1, sobresale: 8, tapa: 'neutro', canto: 'baldosa-gris', pies: 'columna', pie: 'tela-calida', marmol: true, reduccion: 0 }), rampa('neutro').slice(3, 8)],
    ['mesa-elegante-redonda', mesaRedonda({ tw: 1, th: 1, sobresale: 8, tapa: 'cuero', pies: 'columna', pie: 'cuero' }), DESDE_CUERO],
    ['mesa-redonda-grande', mesaRedonda({ tw: 3, th: 3, sobresale: 10, tapa: 'madera-clara', pies: 'columna', pie: 'madera-oscura' }), DESDE_ROBLE],
  ];
  for (const [id, lienzo, desde] of redondas) registrarR(c, id, 'U', lienzo, desde);
  registrarR(c, 'soporte-plantas', 'U', soportePlantas(), DESDE_NOGAL);
  return c;
}

void ORO;
void AZUL;
void CAJON_CLARO;
void patas4;
