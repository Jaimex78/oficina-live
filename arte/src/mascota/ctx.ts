/**
 * Esqueleto común de las mascotas: cabeza grande, cuerpo corto y pies. Cada especie lo configura y agrega sus piezas
 * (orejas, colas, picos...). Todo se dibuja en una rejilla de 24 x 24 con los pies en la fila 23 (después se coloca en el
 * cuadro de 32 x 32). Vistas: S (frente), E (perfil mirando a la derecha) y N (espalda); O es el espejo de E.
 * Cuadros: 0 quieto, 1 y 2 pasos (el cuerpo baja 1 y un pie sube), 3 sentado o dormido (ojos cerrados).
 */

import { BLANCO, ROSA, TINTA, Pincel, cadena, elipse, inter, mat, poligono } from './pincel';
import type { Forma, OpcionesLlenar, SlotMascota } from './pincel';

export type Vista = 'S' | 'E' | 'N';
export type NumCuadro = 0 | 1 | 2 | 3;
export type Gancho = (c: Ctx) => void;

export interface OjosCfg {
  /** Fila de arriba de los ojos relativa al centro de la cabeza. */
  dy?: number;
  /** Separación del centro (en columnas). */
  sep?: number;
  alto?: number;
  rubor?: boolean;
  /** En el perfil: columnas a la derecha del centro de la cabeza. */
  ladoDx?: number;
  /** Fila fija (ignora dy). */
  y?: number;
  /** Ojos sobre fondo oscuro (panda): dos píxeles blancos para que se lean. */
  claros?: boolean;
}

export interface Cfg {
  cab: { rx: number; ry: number; cy: number };
  cue: { rx: number; ry: number; cy: number };
  /** Cuánto baja la cabeza al sentarse (3 por defecto). */
  baja?: number;
  /** Mitad de la separación de los pies (3.5). */
  sep?: number;
  pies?: false | { slot?: SlotMascota; tono?: number; rx?: number; fijo?: string } | Gancho;
  vientre?: { rx: number; ry: number; dy?: number; dx?: number; tono?: number };
  sinCuerpo?: boolean;
  atras?: Gancho;
  orejas?: Gancho;
  cuerpo?: Gancho;
  rostro?: Gancho;
  frente?: Gancho;
  ojos?: false | OjosCfg;
}

export class Ctx {
  readonly p = new Pincel();
  readonly bob: number;
  readonly sentado: boolean;
  readonly E: boolean;
  readonly N: boolean;
  readonly S: boolean;
  readonly hx: number;
  readonly hy: number;
  readonly bx: number;
  readonly by: number;
  readonly cueRx: number;
  readonly cueRy: number;
  /** Cuánto se movió la cabeza respecto de la postura de pie. */
  readonly o: number;

  constructor(
    readonly v: Vista,
    readonly f: NumCuadro,
    readonly cfg: Cfg,
  ) {
    this.E = v === 'E';
    this.N = v === 'N';
    this.S = v === 'S';
    this.sentado = f === 3;
    this.bob = f === 1 || f === 2 ? 1 : 0;
    this.hx = 11.5 + (this.E ? 1.5 : 0);
    this.hy = cfg.cab.cy + (this.sentado ? (cfg.baja ?? 3) : this.bob);
    this.o = this.hy - cfg.cab.cy;
    this.cueRx = cfg.cue.rx + (this.E ? 1.5 : 0) + (this.sentado ? 1.5 : 0);
    this.cueRy = this.sentado ? cfg.cue.ry - 0.6 : cfg.cue.ry;
    this.bx = 11.5 + (this.E ? -1 : 0);
    this.by = this.sentado ? 23.3 - this.cueRy : cfg.cue.cy + this.bob;
  }

  /** x reflejada para la vista de frente y de espalda. */
  m = (x: number): number => 23 - x;
  cabeza = (): Forma => elipse(this.hx, this.hy, this.cfg.cab.rx, this.cfg.cab.ry);
  cuerpoForma = (): Forma => elipse(this.bx, this.by, this.cueRx, this.cueRy);
  /** Pie levantado en el cuadro de paso: 1 el izquierdo, 2 el derecho. */
  alza = (lado: 'i' | 'd'): number => ((lado === 'i' && this.f === 1) || (lado === 'd' && this.f === 2) ? 1 : 0);

  llenar(f: Forma, slot: SlotMascota, o?: OpcionesLlenar): void {
    this.p.llenar(f, slot, o);
  }

  /** Un trozo de otra forma recortado con la cabeza (rubor, hocico, cachetes) sin contorno. */
  sobreCabeza(f: Forma, slot: SlotMascota, o: OpcionesLlenar = {}): void {
    this.p.llenar(inter(this.cabeza(), f), slot, { contorno: false, plano: true, ...o });
  }

  /** Un par simétrico en las vistas de frente y espalda; en el perfil solo se llama con `lado = 1`. */
  par(f: (x: (v: number) => number, lado: 1 | -1) => void): void {
    f((v) => v, 1);
    f((v) => 23 - v, -1);
  }

  /** Cola o cadena de círculos. */
  cola(pts: ReadonlyArray<readonly [number, number]>, r: number | readonly number[], slot: SlotMascota = 'accA', o?: OpcionesLlenar): void {
    this.p.llenar(cadena(pts, r), slot, o);
  }

  poli(pts: ReadonlyArray<readonly [number, number]>, slot: SlotMascota, o?: OpcionesLlenar): void {
    this.p.llenar(poligono(pts), slot, o);
  }

  ojos(o: OjosCfg = {}): void {
    const alto = this.sentado ? 1 : (o.alto ?? 3);
    const top = Math.round(o.y ?? this.hy + (o.dy ?? 1.5));
    const g = this.p;
    const ojo = (x0: number): void => {
      if (this.sentado) {
        // Dormido o tranquilo: un trazo curvo.
        g.px(x0, top + 1, o.claros ? BLANCO : TINTA);
        g.px(x0 + 1, top + 1, o.claros ? BLANCO : TINTA);
        return;
      }
      for (let j = 0; j < alto; j++) {
        g.px(x0, top + j, TINTA);
        g.px(x0 + 1, top + j, TINTA);
      }
      g.px(x0, top, BLANCO);
      if (o.claros) g.px(x0, top + 1, BLANCO);
    };
    if (this.N) return;
    if (this.S) {
      const m = Math.round(this.hx - 0.5);
      const sep = o.sep ?? 3;
      ojo(m - sep);
      ojo(m + sep);
      if (o.rubor !== false) {
        g.px(m - sep - 2, top + alto, ROSA);
        g.px(m + sep + 3, top + alto, ROSA);
      }
    } else {
      const x0 = Math.round(this.hx + (o.ladoDx ?? 3));
      ojo(x0);
      if (o.rubor !== false) g.px(x0 - 3, top + alto, ROSA);
    }
  }

  fase(): number {
    return [0, 1, 0, -1][this.f] ?? 0;
  }
}

function pies(c: Ctx): void {
  const cfg = c.cfg;
  if (cfg.pies === false) return;
  if (typeof cfg.pies === 'function') {
    cfg.pies(c);
    return;
  }
  const po = cfg.pies ?? {};
  const slot = po.slot ?? 'accA';
  const o = { tono: po.tono ?? -1, ...(po.fijo ? { fijo: po.fijo } : {}) };
  const rx = po.rx ?? 2.4;
  const half = cfg.sep ?? 3.5;
  if (c.sentado) {
    if (c.E) c.llenar(elipse(c.bx + 3.5, 22.3, rx, 1.6), slot, o);
    else {
      c.llenar(elipse(11.5 - half * 0.7, 22.3, rx, 1.6), slot, o);
      c.llenar(elipse(11.5 + half * 0.7, 22.3, rx, 1.6), slot, o);
    }
    return;
  }
  if (c.E) {
    const atras = c.bx - 3 + (c.f === 1 ? -1 : 0);
    const adelante = c.bx + 3.5 + (c.f === 2 ? 1 : 0);
    c.llenar(elipse(atras, 22.2 - c.alza('i'), rx, 1.6), slot, o);
    c.llenar(elipse(adelante, 22.2 - c.alza('d'), rx, 1.6), slot, o);
  } else {
    c.llenar(elipse(11.5 - half, 22.2 - c.alza('i'), rx, 1.6), slot, o);
    c.llenar(elipse(11.5 + half, 22.2 - c.alza('d'), rx, 1.6), slot, o);
  }
}

/** Dibuja una mascota con el esqueleto común. */
export function chibi(cfg: Cfg, v: Vista, f: NumCuadro): Pincel {
  const c = new Ctx(v, f, cfg);
  cfg.atras?.(c);
  if (!c.sentado) pies(c);
  if (!cfg.sinCuerpo) {
    c.llenar(c.cuerpoForma(), 'accA', { brillo: true });
    if (cfg.vientre && !c.N) {
      const vi = cfg.vientre;
      c.p.llenar(inter(c.cuerpoForma(), elipse(c.bx + (vi.dx ?? 0) + (c.E ? 1 : 0), c.by + (vi.dy ?? 0.5), vi.rx, vi.ry)), 'accB', { contorno: false, plano: true, tono: vi.tono ?? 0 });
    }
  }
  cfg.cuerpo?.(c);
  if (c.sentado) pies(c);
  cfg.orejas?.(c);
  c.llenar(c.cabeza(), 'accA', { brillo: true });
  cfg.rostro?.(c);
  if (cfg.ojos !== false) c.ojos(cfg.ojos ?? {});
  cfg.frente?.(c);
  return c.p;
}

export { mat };
