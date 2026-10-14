/**
 * Lote 9, almacenaje: libreros, estantes, gabinetes, taquillas, cómodas, archivadores, baúl, andamio y carrito.
 *
 * Dos constructores de cajas:
 *  - `estanteria()`: carcasa abierta (costados, baldas, fondo) con el contenido modelado en cajas (libros, frascos, macetas,
 *    platos, objetos de colección). Al ser cajas, las cuatro orientaciones salen solas: de frente se ven los lomos, por atrás el
 *    panel liso y de lado el costado.
 *  - `mueble()`: cuerpo cerrado con el frente pintado (cajones, puertas, taquillas) y, por los otros lados, paneles lisos.
 * El material principal (madera de 5 tonos o metal de 4) es el que se recolorea en las variantes; los libros, frascos y demás
 * objetos de adentro mantienen su color.
 */

import { Lienzo, rampa } from '../nucleo';
import type { ColorEntrada } from '../nucleo';
import { AZUL, METAL, METAL_OSCURO, NEGRO, ORO, bx, caraSur, conEtiqueta, registrarReceta, tonos5 } from './l9-comun';
import type { CajaPlano, Cuadros, Modelo, Receta, TonosCaja } from './l9-comun';
import { azar } from './l8-comun';

const NOGAL = tonos5('madera-oscura');
const ROBLE = tonos5('madera-clara');
const CUERO = tonos5('cuero');
const DESDE_NOGAL = rampa('madera-oscura');
const DESDE_ROBLE = rampa('madera-clara');
const DESDE_CUERO = rampa('cuero');
const DESDE_METAL = rampa('metal');
const DESDE_NARANJA = rampa('naranja');
const DESDE_PASTEL = rampa('hoja-pastel');

/** Un tono de libro o de objeto: cara de arriba, lomo y sombra. */
const objeto = (r: string): TonosCaja => ({ superior: `${r}-3`, frente: `${r}-2`, luz: `${r}-${Math.min(4, rampa(r).length - 1)}`, luzFrente: `${r}-3`, sombra: `${r}-1`, sombraLado: `${r}-1` });
const LIBROS: readonly TonosCaja[] = [objeto('rojo-suave'), objeto('vidrio'), objeto('planta'), objeto('tela-calida'), objeto('morado'), objeto('naranja'), objeto('crema'), objeto('hoja-pastel')];
const PAPEL: TonosCaja = { superior: 'neutro-7', frente: 'neutro-6', luz: 'neutro-7', luzFrente: 'neutro-7', sombra: 'neutro-4', sombraLado: 'neutro-5' };
const VIDRIO_FRASCO: TonosCaja = { superior: 'vidrio-3', frente: 'vidrio-2', luz: 'neutro-7', luzFrente: 'vidrio-3', sombra: 'vidrio-1', sombraLado: 'vidrio-1' };

// ---------------------------------------------------------------------------
// Estanterías
// ---------------------------------------------------------------------------

type Contenido = 'libros' | 'frascos' | 'macetas' | 'platos' | 'curiosidades' | 'mixto' | 'cajas';

interface OpEstanteria {
  ancho: number;
  /** Altura total en filas desde el piso. */
  altura: number;
  /** Cuántos compartimentos verticales. */
  baldas: number;
  madera: TonosCaja;
  fondo?: TonosCaja;
  contenido: Contenido;
  semilla: number;
  /** Divisiones verticales para hacer cubos. */
  cubos?: number;
  /** Cornisa o remate de arriba. */
  cornisa?: TonosCaja;
  /** Los compartimentos de arriba y de abajo con puertas (no se ve el contenido): 0, 1 o 2. */
  puertasAbajo?: boolean;
  /** Patas altas. */
  patas?: boolean;
  /** Ancho de los listones del costado. */
  costado?: number;
}

function relleno(o: OpEstanteria, x0: number, x1: number, y0: number, y1: number, zBase: number, zTop: number, rnd: () => number, cajas: CajaPlano[]): void {
  const alto = zTop - zBase;
  if (alto < 4) return;
  switch (o.contenido) {
    case 'libros': {
      let x = x0 + 1;
      while (x < x1 - 2) {
        const w = 2 + Math.floor(rnd() * 3);
        const h = Math.max(4, Math.round(alto * (0.62 + rnd() * 0.36)));
        const t = LIBROS[Math.floor(rnd() * LIBROS.length)] as TonosCaja;
        if (x + w > x1 - 1) break;
        if (rnd() < 0.1) {
          x += 2;
          continue;
        }
        cajas.push(bx(x, y0 + 4, x + w, y1, zBase, zBase + h, t, { esquinas: 0 }));
        x += w;
      }
      break;
    }
    case 'frascos': {
      for (let x = x0 + 2; x + 6 <= x1 - 1; x += 7) {
        const h = Math.min(alto - 3, 6);
        const t = [objeto('naranja'), objeto('rojo-suave'), objeto('planta'), objeto('tela-calida')][Math.floor(rnd() * 4)] as TonosCaja;
        cajas.push(bx(x, y0 + 5, x + 6, y1 - 1, zBase, zBase + h, VIDRIO_FRASCO, { esquinas: 1 }));
        cajas.push(bx(x + 1, y0 + 6, x + 5, y1 - 2, zBase, zBase + h - 2, t, { esquinas: 1 }));
        cajas.push(bx(x + 1, y0 + 6, x + 5, y1 - 2, zBase + h, zBase + h + 1, METAL));
      }
      break;
    }
    case 'macetas': {
      for (let x = x0 + 2; x + 8 <= x1 - 1; x += 11) {
        const hm = Math.min(5, alto - 4);
        cajas.push(bx(x + 1, y0 + 6, x + 7, y1 - 1, zBase, zBase + hm, objeto('maceta-terracota'), { esquinas: 1 }));
        cajas.push(bx(x, y0 + 5, x + 8, y1 - 1, zBase + hm, zBase + Math.min(alto - 1, hm + 6), objeto('planta'), { esquinas: 3 }));
      }
      break;
    }
    case 'platos': {
      let x = x0 + 2;
      while (x + 3 <= x1 - 2) {
        if (rnd() < 0.55) {
          const n = 2 + Math.floor(rnd() * 2);
          for (let k = 0; k < n; k++) cajas.push(bx(x, y0 + 5, x + 3, y1 - 1, zBase + k * 2, zBase + k * 2 + 2, PAPEL, { esquinas: 1 }));
          x += 5;
        } else {
          const t = LIBROS[Math.floor(rnd() * LIBROS.length)] as TonosCaja;
          cajas.push(bx(x, y0 + 6, x + 4, y1 - 2, zBase, zBase + 4, t, { esquinas: 1 }));
          x += 6;
        }
      }
      break;
    }
    case 'curiosidades': {
      let x = x0 + 2;
      let k = 0;
      while (x + 4 <= x1 - 2) {
        const t = LIBROS[(k * 3 + Math.floor(rnd() * 3)) % LIBROS.length] as TonosCaja;
        const w = 3 + Math.floor(rnd() * 3);
        const h = 3 + Math.floor(rnd() * Math.max(1, alto - 5));
        cajas.push(bx(x, y0 + 5, x + w, y1 - 2, zBase, zBase + h, k % 3 === 0 ? PAPEL : t, { esquinas: k % 2 === 0 ? 2 : 0 }));
        x += w + 2;
        k++;
      }
      break;
    }
    case 'cajas': {
      let x = x0 + 2;
      let k = 0;
      while (x + 5 <= x1 - 1) {
        if (rnd() < 0.6) {
          const t = [objeto('tela-calida'), objeto('crema'), objeto('tela-gris'), objeto('hoja-pastel')][k % 4] as TonosCaja;
          cajas.push(bx(x, y0 + 4, x + 6, y1 - 1, zBase, zBase + Math.min(alto - 2, 5), t, { esquinas: 1 }));
        }
        x += 8;
        k++;
      }
      break;
    }
    case 'mixto': {
      relleno({ ...o, contenido: 'libros' }, x0, (x0 + x1) / 2, y0, y1, zBase, zTop, rnd, cajas);
      relleno({ ...o, contenido: 'macetas' }, (x0 + x1) / 2, x1, y0, y1, zBase, zTop, rnd, cajas);
      break;
    }
  }
}

function estanteria(o: OpEstanteria): Modelo {
  const W = o.ancho * 32;
  const x0 = 2;
  const x1 = W - 3;
  const y0 = 3;
  const y1 = 28;
  const cajas: CajaPlano[] = [];
  const m = o.madera;
  const c = o.costado ?? 3;
  const base = o.patas === true ? 4 : 3;
  const cornisa = o.cornisa !== undefined ? 3 : 0;
  const zTope = o.altura - cornisa;
  // Fondo, costados y baldas.
  cajas.push(bx(x0 + c, y0, x1 - c, y0 + 3, base, zTope, o.fondo ?? { ...m, superior: m.frente, frente: m.sombra ?? m.frente, luz: m.frente }));
  cajas.push(bx(x0, y0, x0 + c, y1, 0, zTope, m), bx(x1 - c, y0, x1, y1, 0, zTope, m));
  cajas.push(bx(x0, y0, x1, y1, zTope - 2, zTope, m, { etiqueta: 'tapa' }));
  const compartimentos = o.baldas;
  const alto = zTope - 2 - base;
  const paso = alto / compartimentos;
  const rnd = azar(o.semilla);
  for (let i = 0; i < compartimentos; i++) {
    const zBase = Math.round(base + i * paso);
    cajas.push(bx(x0 + c, y0, x1 - c, y1, zBase, zBase + 2, m, { etiqueta: 'balda' }));
    const zTech = Math.round(base + (i + 1) * paso);
    const cubos = o.cubos ?? 1;
    for (let k = 0; k < cubos; k++) {
      const cx0 = x0 + c + ((x1 - x0 - 2 * c) * k) / cubos + (k === 0 ? 0 : 1);
      const cx1 = x0 + c + ((x1 - x0 - 2 * c) * (k + 1)) / cubos - (k === cubos - 1 ? 0 : 1);
      if (!(o.puertasAbajo === true && i === 0)) relleno(o, cx0, cx1, y0, y1, zBase + 2, zTech, rnd, cajas);
      if (k > 0) cajas.push(bx(cx0 - 1, y0, cx0 + 1, y1, zBase + 2, zTech, m));
    }
  }
  if (o.puertasAbajo === true) {
    cajas.push(bx(x0 + c, y1 - 2, x1 - c, y1, base, Math.round(base + paso), m, { etiqueta: 'puerta' }));
  }
  if (o.cornisa !== undefined) cajas.push(bx(x0 - 1 < 1 ? 1 : x0 - 1, y0, x1 + 1 > W - 3 ? W - 3 : x1 + 1, y1, zTope, o.altura, o.cornisa, { etiqueta: 'cornisa' }));
  if (o.patas === true) {
    for (const [px, py] of [[x0, y0], [x1 - 3, y0], [x0, y1 - 3], [x1 - 3, y1 - 3]] as const) cajas.push(bx(px, py, px + 3, py + 3, 0, base, m));
  }
  return {
    W,
    D: 32,
    cajas,
    detalle: (l, p, giro, cs) => {
      if (giro !== 'S') return;
      for (const b of conEtiqueta(cs, 'puerta')) {
        const r = caraSur(b, p);
        l.rect(r.x, r.y, r.w, 1, 'madera-oscura-4');
        l.rect(r.x + r.w / 2, r.y + 1, 1, r.h - 1, 'madera-oscura-0');
        l.rect(r.x + r.w / 2 - 3, r.y + Math.floor(r.h / 2), 2, 2, 'tela-calida-3');
        l.rect(r.x + r.w / 2 + 2, r.y + Math.floor(r.h / 2), 2, 2, 'tela-calida-3');
      }
    },
  };
}

// ---------------------------------------------------------------------------
// Muebles cerrados
// ---------------------------------------------------------------------------

interface OpMueble {
  ancho: number;
  /** Altura del cuerpo en filas desde el piso (sin patas). */
  altura: number;
  cuerpo: TonosCaja;
  /** Tapa de otro material, un poco más ancha (opcional). */
  tapa?: TonosCaja;
  patas?: 'cortas' | 'altas' | 'ruedas' | 'zocalo';
  frente: { tipo: 'cajones'; filas: number; columnas: number } | { tipo: 'puertas'; n: number } | { tipo: 'taquillas'; n: number } | { tipo: 'lisa' };
  tirador: ColorEntrada;
  lineas?: ColorEntrada;
  /** Tapa abovedada (baúl) y correas de metal. */
  baul?: boolean;
  fondoPlano?: boolean;
  /** Pie de rueda o de gabinete en `zocalo`. */
  zocalo?: TonosCaja;
}

function mueble(o: OpMueble): Modelo {
  const W = o.ancho * 32;
  const x0 = 2;
  const x1 = W - 3;
  const y0 = 4;
  const y1 = 28;
  const cajas: CajaPlano[] = [];
  const hp = o.patas === 'altas' ? 6 : o.patas === 'ruedas' ? 3 : o.patas === 'cortas' ? 3 : 0;
  if (o.patas === 'altas' || o.patas === 'cortas') {
    const g = 3;
    for (const [px, py] of [[x0 + 2, y0 + 1], [x1 - g - 2, y0 + 1], [x0 + 2, y1 - g - 1], [x1 - g - 2, y1 - g - 1]] as const) cajas.push(bx(px, py, px + g, py + g, 0, hp, NOGAL));
  } else if (o.patas === 'ruedas') {
    for (const [px, py] of [[x0 + 2, y0 + 1], [x1 - 5, y0 + 1], [x0 + 2, y1 - 4], [x1 - 5, y1 - 4]] as const) cajas.push(bx(px, py, px + 3, py + 3, 0, hp, NEGRO, { esquinas: 1 }));
  } else if (o.patas === 'zocalo' && o.zocalo !== undefined) {
    cajas.push(bx(x0 + 1, y0 + 1, x1 - 1, y1 - 1, 0, 3, o.zocalo));
  }
  const zc0 = o.patas === 'zocalo' ? 3 : hp;
  const zc1 = zc0 + o.altura;
  if (o.baul === true) {
    cajas.push(bx(x0, y0, x1, y1, zc0, zc1 - 4, o.cuerpo, { esquinas: 1, etiqueta: 'cuerpo' }));
    cajas.push(bx(x0 + 1, y0 + 1, x1 - 1, y1 - 1, zc1 - 4, zc1, o.cuerpo, { esquinas: 3, etiqueta: 'tapa' }));
    for (const x of [x0 + 7, x1 - 10]) cajas.push(bx(x, y0 - 1 < 1 ? 1 : y0 - 1, x + 3, y1 + 1, zc0, zc1, METAL_OSCURO, { esquinas: 0 }));
    cajas.push(bx(x0 + (x1 - x0) / 2 - 2, y1, x0 + (x1 - x0) / 2 + 2, y1 + 1, zc1 - 7, zc1 - 3, ORO));
  } else {
    cajas.push(bx(x0, y0, x1, y1, zc0, zc1, o.cuerpo, { esquinas: 0, etiqueta: 'cuerpo' }));
    if (o.tapa !== undefined) cajas.push(bx(x0 - 1 < 1 ? 1 : x0 - 1, y0 - 1, x1 + 1 > W - 3 ? W - 3 : x1 + 1, y1 + 1, zc1, zc1 + 2, o.tapa, { etiqueta: 'losa' }));
  }
  return {
    W,
    D: 32,
    cajas,
    detalle: (l, p, giro, cs) => {
      if (giro !== 'S') return;
      const lineas = o.lineas ?? 'azul-oficina-0';
      for (const c of conEtiqueta(cs, 'cuerpo')) {
        const r = caraSur(c, p);
        const f = o.frente;
        if (f.tipo === 'cajones') {
          const hh = r.h / f.filas;
          const ww = r.w / f.columnas;
          for (let j = 0; j < f.filas; j++) {
            for (let i = 0; i < f.columnas; i++) {
              const px = Math.round(r.x + i * ww);
              const py = Math.round(r.y + j * hh);
              if (j > 0) l.rect(px, py, Math.round(ww), 1, lineas);
              if (i > 0 && j === 0) l.rect(px, r.y, 1, r.h, lineas);
              const cx = Math.round(px + ww / 2);
              const cy = Math.round(py + hh / 2);
              l.rect(cx - 1, cy, 3, 1, o.tirador);
              l.px(cx - 1, cy + 1, lineas);
              l.px(cx + 1, cy + 1, lineas);
            }
          }
        } else if (f.tipo === 'puertas') {
          const ww = r.w / f.n;
          for (let i = 0; i < f.n; i++) {
            const px = Math.round(r.x + i * ww);
            if (i > 0) l.rect(px, r.y, 1, r.h, lineas);
            l.rect(px + 3, r.y + 3, Math.round(ww) - 6, 1, lineas);
            l.rect(px + 3, r.y + r.h - 3, Math.round(ww) - 6, 1, lineas);
            const lado = i % 2 === 0 ? Math.round(ww) - 6 : 4;
            l.rect(px + lado, r.y + Math.floor(r.h / 2) - 1, 1, 3, o.tirador);
          }
        } else if (f.tipo === 'taquillas') {
          const ww = r.w / f.n;
          for (let i = 0; i < f.n; i++) {
            const px = Math.round(r.x + i * ww);
            if (i > 0) l.rect(px, r.y, 1, r.h, lineas);
            const rejillas = Math.min(4, Math.floor((r.h - 8) / 3));
            for (let k = 0; k < rejillas; k++) l.rect(px + 4, r.y + 3 + k * 2, Math.round(ww) - 8, 1, lineas);
            l.rect(px + Math.round(ww) - 6, r.y + Math.floor(r.h / 2) + 1, 2, 3, o.tirador);
            l.rect(px + 4, r.y + r.h - 6, 5, 2, 'neutro-6');
          }
        }
      }
    },
  };
}

// ---------------------------------------------------------------------------
// Objetos con forma propia
// ---------------------------------------------------------------------------

/** Andamio: tubos de acero en las esquinas, barandas y dos plataformas de tablones. */
function andamio(): Modelo {
  const W = 64;
  const cajas: CajaPlano[] = [];
  const z = 46;
  for (const [x, y] of [[3, 4], [W - 6, 4], [3, 24], [W - 6, 24]] as const) cajas.push(bx(x, y, x + 3, y + 3, 0, z, METAL));
  for (const zz of [14, 30, 44]) {
    cajas.push(bx(3, 4, W - 3, 6, zz, zz + 2, METAL_OSCURO), bx(3, 26, W - 3, 28, zz, zz + 2, METAL_OSCURO));
  }
  for (const [zz, tono] of [[14, ROBLE], [30, tonos5('madera-clara', -1)]] as const) {
    for (let i = 0; i < 4; i++) cajas.push(bx(3 + i * 14.5, 6, 3 + (i + 1) * 14.5 - 1, 26, zz + 2, zz + 4, tono, { etiqueta: 'tablon' }));
  }
  for (const x of [3, W - 6]) {
    cajas.push(bx(x, 4, x + 3, 6, 6, 8, METAL), bx(x, 26, x + 3, 28, 22, 24, METAL), bx(x, 4, x + 3, 6, 22, 24, METAL), bx(x, 26, x + 3, 28, 6, 8, METAL));
  }
  return { W, D: 32, cajas };
}

/** Carrito de herramientas: cajón rojo de tres cajones con asa y cuatro ruedas. */
function carritoHerramientas(): Modelo {
  const W = 32;
  const cajas: CajaPlano[] = [];
  const naranja = tonos5('naranja');
  for (const [px, py] of [[4, 7], [23, 7], [4, 24], [23, 24]] as const) cajas.push(bx(px, py, px + 4, py + 4, 0, 4, NEGRO, { esquinas: 1 }));
  cajas.push(bx(3, 6, 29, 28, 4, 22, naranja, { etiqueta: 'cuerpo' }));
  cajas.push(bx(3, 6, 29, 28, 22, 24, METAL, { etiqueta: 'losa' }));
  cajas.push(bx(2, 5, 5, 8, 20, 30, METAL_OSCURO), bx(27, 5, 30, 8, 20, 30, METAL_OSCURO), bx(2, 5, 30, 8, 28, 31, METAL_OSCURO));
  return {
    W,
    D: 32,
    cajas,
    detalle: (l, p, giro, cs) => {
      if (giro !== 'S') return;
      for (const c of conEtiqueta(cs, 'cuerpo')) {
        const r = caraSur(c, p);
        for (let j = 1; j < 3; j++) l.rect(r.x, r.y + Math.round((r.h * j) / 3), r.w, 1, 'naranja-0');
        for (let j = 0; j < 3; j++) l.rect(r.x + 9, r.y + Math.round((r.h * (j + 0.5)) / 3), 10, 1, 'neutro-6');
      }
    },
  };
}

// ---------------------------------------------------------------------------
// Recetas
// ---------------------------------------------------------------------------

export const RECETAS_ALMACENAJE: readonly Receta[] = [
  { id: 'mueble-planos', modelo: mueble({ ancho: 2, altura: 16, cuerpo: ROBLE, tapa: { ...ROBLE, superior: 'madera-clara-4' }, patas: 'cortas', frente: { tipo: 'cajones', filas: 3, columnas: 3 }, tirador: 'metal-3', lineas: 'madera-clara-0' }), desde: DESDE_ROBLE },
  { id: 'librero-alto', modelo: estanteria({ ancho: 2, altura: 50, baldas: 5, madera: NOGAL, contenido: 'libros', semilla: 11 }), desde: DESDE_NOGAL },
  { id: 'archivador-metalico', modelo: mueble({ ancho: 1, altura: 30, cuerpo: METAL, tapa: { ...METAL, superior: 'neutro-6' }, patas: 'zocalo', zocalo: METAL_OSCURO, frente: { tipo: 'cajones', filas: 4, columnas: 1 }, tirador: 'neutro-7', lineas: 'metal-0' }), desde: DESDE_METAL },
  { id: 'aparador-moderno', modelo: mueble({ ancho: 3, altura: 14, cuerpo: NOGAL, tapa: { ...NOGAL, superior: 'madera-oscura-4' }, patas: 'altas', frente: { tipo: 'puertas', n: 3 }, tirador: 'neutro-6', lineas: 'madera-oscura-0' }), desde: DESDE_NOGAL },
  { id: 'estante-conservas', modelo: estanteria({ ancho: 2, altura: 40, baldas: 3, madera: METAL, contenido: 'frascos', semilla: 3, costado: 2 }), desde: DESDE_METAL },
  { id: 'estante-madera-recuperada', modelo: estanteria({ ancho: 2, altura: 38, baldas: 3, madera: tonos5('madera-oscura', -1), contenido: 'mixto', semilla: 5 }), desde: DESDE_NOGAL },
  { id: 'librero-chippendale', modelo: estanteria({ ancho: 2, altura: 52, baldas: 4, madera: CUERO, contenido: 'libros', semilla: 17, cornisa: { ...CUERO, superior: 'cuero-4' }, puertasAbajo: true }), desde: DESDE_CUERO },
  { id: 'estante-cubiculo', modelo: estanteria({ ancho: 2, altura: 34, baldas: 2, madera: ROBLE, contenido: 'cajas', semilla: 23, cubos: 3, costado: 2 }), desde: DESDE_ROBLE },
  { id: 'baul-vapor', modelo: mueble({ ancho: 2, altura: 20, cuerpo: CUERO, patas: 'cortas', baul: true, frente: { tipo: 'lisa' }, tirador: 'tela-calida-3' }), desde: DESDE_CUERO },
  { id: 'gabinete-curiosidades', modelo: estanteria({ ancho: 2, altura: 54, baldas: 4, madera: NOGAL, contenido: 'curiosidades', semilla: 31, cornisa: { ...NOGAL, superior: 'madera-oscura-4' }, patas: true }), desde: DESDE_NOGAL },
  { id: 'estante-cocina', modelo: estanteria({ ancho: 2, altura: 40, baldas: 3, madera: ROBLE, contenido: 'platos', semilla: 7, costado: 2 }), desde: DESDE_ROBLE },
  { id: 'librero-mediano', modelo: estanteria({ ancho: 2, altura: 34, baldas: 3, madera: ROBLE, contenido: 'libros', semilla: 13 }), desde: DESDE_ROBLE },
  { id: 'fichero-tarjetas', modelo: mueble({ ancho: 1, altura: 28, cuerpo: tonos5('madera-clara', 0), tapa: { ...ROBLE, superior: 'madera-clara-4' }, patas: 'cortas', frente: { tipo: 'cajones', filas: 5, columnas: 3 }, tirador: 'tela-calida-3', lineas: 'madera-clara-0' }), desde: DESDE_ROBLE },
  { id: 'taquillas-bajas', modelo: mueble({ ancho: 2, altura: 26, cuerpo: METAL, patas: 'zocalo', zocalo: METAL_OSCURO, frente: { tipo: 'taquillas', n: 4 }, tirador: 'neutro-7', lineas: 'metal-0' }), desde: DESDE_METAL },
  { id: 'gabinete-oficina', modelo: mueble({ ancho: 2, altura: 26, cuerpo: METAL, tapa: { ...METAL, superior: 'neutro-6' }, patas: 'zocalo', zocalo: METAL_OSCURO, frente: { tipo: 'puertas', n: 2 }, tirador: 'neutro-7', lineas: 'metal-0' }), desde: DESDE_METAL },
  { id: 'taquillas-altas', modelo: mueble({ ancho: 2, altura: 52, cuerpo: METAL, patas: 'zocalo', zocalo: METAL_OSCURO, frente: { tipo: 'taquillas', n: 3 }, tirador: 'neutro-7', lineas: 'metal-0' }), desde: DESDE_METAL },
  { id: 'andamio', modelo: andamio(), desde: DESDE_METAL },
  { id: 'gabinete-cocina-pequeno', modelo: mueble({ ancho: 1, altura: 22, cuerpo: tonos5('hoja-pastel'), tapa: { ...ROBLE, superior: 'madera-clara-3' }, patas: 'zocalo', zocalo: tonos5('hoja-pastel', -1), frente: { tipo: 'puertas', n: 1 }, tirador: 'neutro-7', lineas: 'hoja-pastel-0' }), desde: DESDE_PASTEL },
  { id: 'comoda-alta', modelo: mueble({ ancho: 1, altura: 38, cuerpo: tonos5('madera-oscura'), tapa: { ...NOGAL, superior: 'madera-oscura-4' }, patas: 'cortas', frente: { tipo: 'cajones', filas: 5, columnas: 1 }, tirador: 'tela-calida-3', lineas: 'madera-oscura-0' }), desde: DESDE_NOGAL },
  { id: 'gabinete-cocina-grande', modelo: mueble({ ancho: 2, altura: 22, cuerpo: tonos5('hoja-pastel'), tapa: { ...ROBLE, superior: 'madera-clara-3' }, patas: 'zocalo', zocalo: tonos5('hoja-pastel', -1), frente: { tipo: 'puertas', n: 2 }, tirador: 'neutro-7', lineas: 'hoja-pastel-0' }), desde: DESDE_PASTEL },
  { id: 'carrito-herramientas', modelo: carritoHerramientas(), desde: DESDE_NARANJA },
];

export function cuadrosAlmacenaje9(): Cuadros {
  const c: Cuadros = new Map();
  for (const r of RECETAS_ALMACENAJE) registrarReceta(c, r);
  return c;
}

void AZUL;
void (null as unknown as Lienzo);
