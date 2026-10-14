import type { Carril, RutaPeaton } from './tipos';

/** Generador pseudoaleatorio con semilla (mulberry32). */
export function crearAzar(semilla: number): () => number {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type LuzSemaforo = 'verde' | 'amarillo' | 'rojo';

export interface EstadoSenales {
  /** Ak 9 en el cruce con la calle 102 (la calzada norte, hacia el oeste). */
  h: LuzSemaforo;
  /** Calle 102 hacia el sur. */
  v: LuzSemaforo;
  /** Paso de peatones de la avenida: en rojo para los carros mientras la gente cruza. */
  pc: LuzSemaforo;
  /** Es el turno de los peatones: cruzan la calle 102 y la avenida con la vía. */
  peatones: boolean;
  /** Segundos desde que empezó el turno de los peatones (0 si no es su turno). */
  transcurridoPeatones: number;
}

interface Fase {
  h: LuzSemaforo;
  v: LuzSemaforo;
  pc: LuzSemaforo;
  peatones: boolean;
  dur: number;
}

/**
 * Ciclo del cruce: la Ak 9 pasa 11 s, la calle 102 pasa 7 s, y luego los peatones tienen 14 s para cruzar la calle 102 y
 * toda la avenida (con la vía del tren). Entre fase y fase hay amarillo y un instante con todo en rojo.
 */
const CICLO: readonly Fase[] = [
  { h: 'verde', v: 'rojo', pc: 'verde', peatones: false, dur: 11 },
  { h: 'amarillo', v: 'rojo', pc: 'verde', peatones: false, dur: 2.2 },
  { h: 'rojo', v: 'rojo', pc: 'verde', peatones: false, dur: 1.4 },
  { h: 'rojo', v: 'verde', pc: 'verde', peatones: false, dur: 7 },
  { h: 'rojo', v: 'amarillo', pc: 'verde', peatones: false, dur: 2.2 },
  { h: 'rojo', v: 'rojo', pc: 'rojo', peatones: false, dur: 1.4 },
  { h: 'rojo', v: 'rojo', pc: 'rojo', peatones: true, dur: 14 },
  { h: 'rojo', v: 'rojo', pc: 'rojo', peatones: false, dur: 1.6 },
];
export const DURACION_CICLO = CICLO.reduce((a, f) => a + f.dur, 0);

/** Estado de las señales en el segundo `t`. */
export function estadoSemaforos(t: number): EstadoSenales {
  let r = ((t % DURACION_CICLO) + DURACION_CICLO) % DURACION_CICLO;
  for (const f of CICLO) {
    if (r < f.dur) return { h: f.h, v: f.v, pc: f.pc, peatones: f.peatones, transcurridoPeatones: f.peatones ? r : 0 };
    r -= f.dur;
  }
  return { h: 'rojo', v: 'rojo', pc: 'rojo', peatones: false, transcurridoPeatones: 0 };
}

// ---------------------------------------------------------------------------
// Tren
// ---------------------------------------------------------------------------

export const TREN = {
  /** Píxeles por segundo: lento. */
  velocidad: 95,
  /** Cada cuántos segundos empieza un paso. Entre pasos la vía queda vacía. */
  periodo: 100,
  /** Segundo del período en el que arranca el paso. */
  inicio: 6,
  largoLoco: 66,
  largoVagon: 50,
  vagones: 4,
  hueco: 1,
} as const;

export interface UnidadTren {
  tipo: 'loco' | 'vagon-a' | 'vagon-b';
  /** Centro de la unidad sobre la vía. */
  x: number;
}

export interface EstadoTren {
  presente: boolean;
  /** +1 hacia el este y -1 hacia el oeste: cada paso va al revés del anterior. */
  dir: 1 | -1;
  /** Dónde está la nariz de la locomotora. */
  frente: number;
  unidades: UnidadTren[];
}

const LARGO_TREN = TREN.largoLoco + TREN.vagones * (TREN.largoVagon + TREN.hueco);

/** El tren que pasa de lado a lado del exterior de vez en cuando, con la locomotora delante y cuatro vagones. */
export class Tren {
  /** Segundos que dura un paso, de borde a borde. */
  readonly duracion: number;

  constructor(
    private readonly xMin: number,
    private readonly xMax: number,
  ) {
    this.duracion = (xMax - xMin + LARGO_TREN) / TREN.velocidad;
  }

  estado(t: number): EstadoTren {
    const k = Math.floor(t / TREN.periodo);
    const dir: 1 | -1 = k % 2 === 0 ? 1 : -1;
    const tau = t - k * TREN.periodo - TREN.inicio;
    if (tau < 0 || tau > this.duracion) return { presente: false, dir, frente: 0, unidades: [] };
    const frente = dir === 1 ? this.xMin + TREN.velocidad * tau : this.xMax - TREN.velocidad * tau;
    const unidades: UnidadTren[] = [{ tipo: 'loco', x: frente - dir * (TREN.largoLoco / 2) }];
    for (let i = 0; i < TREN.vagones; i++) {
      const atras = TREN.largoLoco + TREN.hueco + TREN.largoVagon / 2 + i * (TREN.largoVagon + TREN.hueco);
      unidades.push({ tipo: i % 2 === 0 ? 'vagon-a' : 'vagon-b', x: frente - dir * atras });
    }
    return { presente: true, dir, frente, unidades };
  }

  /** ¿Hay tren a menos de `margen` píxeles de `x`, en cualquier parte de su largo? */
  cerca(t: number, x: number, margen: number): boolean {
    const e = this.estado(t);
    if (!e.presente) return false;
    const cola = e.frente - e.dir * LARGO_TREN;
    const a = Math.min(e.frente, cola);
    const b = Math.max(e.frente, cola);
    return x > a - margen && x < b + margen;
  }
}

// ---------------------------------------------------------------------------
// Carros
// ---------------------------------------------------------------------------

export type TipoVehiculo = 'auto' | 'bus' | 'moto';
export const COLORES_CARRO = ['taxi', 'blanco', 'negro', 'rojo', 'azul', 'plata'] as const;
export type ColorCarro = (typeof COLORES_CARRO)[number];

export interface Vehiculo {
  id: number;
  carril: Carril;
  tipo: TipoVehiculo;
  color: ColorCarro;
  /** Avance del centro sobre el carril, desde `inicio`, en píxeles. */
  u: number;
  v: number;
  /** Largo del vehículo más un poco de aire, en píxeles. */
  largo: number;
  vmax: number;
  /** El bus ya paró en la parada de esta vuelta. */
  yaParo: boolean;
  /** Segundo hasta el que el bus espera en la parada. */
  espera: number;
  /** Este carro toma el giro del carril (se decide al entrar al carril). */
  gira: boolean;
}

const LARGO: Record<TipoVehiculo, number> = { auto: 64, bus: 126, moto: 30 };
/** Distancia a la que se revisa que el carril de destino esté libre antes de unirse. */
const VENTANA_LIBRE = 95;

/**
 * Tránsito de la avenida y la calle 102: cada carro sigue al de adelante, frena en las líneas de pare, el bus para en
 * el paradero y los carros de la calle 102 giran a la derecha hacia la avenida (y algunos de la avenida giran hacia
 * la calle 102). Es una simulación mínima: nada de adelantamientos.
 */
export class Trafico {
  readonly vehiculos: Vehiculo[] = [];
  private readonly azar: () => number;
  private nextId = 0;
  private readonly grupos = new Map<string, { c: Carril; lista: Vehiculo[] }>();

  constructor(carriles: readonly Carril[], semilla = 7) {
    this.azar = crearAzar(semilla);
    for (const c of carriles) this.grupos.set(c.id, { c, lista: [] });
    for (const c of carriles) {
      const largoCarril = Math.abs(c.fin - c.inicio);
      for (let i = 0; i < c.cantidad; i++) {
        const tipo: TipoVehiculo = c.especiales?.[i] ?? 'auto';
        const veh: Vehiculo = {
          id: this.nextId++,
          carril: c,
          tipo,
          color: this.colorAzar(),
          u: ((i + 0.15 + this.azar() * 0.7) * largoCarril) / c.cantidad,
          v: 0,
          largo: LARGO[tipo],
          vmax: this.velocidadAzar(tipo),
          yaParo: false,
          espera: 0,
          gira: c.empalme ? this.azar() < c.empalme.probabilidad : false,
        };
        this.vehiculos.push(veh);
        this.grupos.get(c.id)?.lista.push(veh);
      }
    }
  }

  private colorAzar(): ColorCarro {
    return COLORES_CARRO[Math.floor(this.azar() * COLORES_CARRO.length)] as ColorCarro;
  }

  private velocidadAzar(tipo: TipoVehiculo): number {
    if (tipo === 'bus') return 52 + this.azar() * 8;
    if (tipo === 'moto') return 84 + this.azar() * 14;
    return 58 + this.azar() * 28;
  }

  /** Centro del vehículo en píxeles del mundo. */
  posicion(v: Vehiculo): { x: number; y: number } {
    const s = v.carril.inicio + v.carril.dir * v.u;
    return v.carril.eje === 'h' ? { x: s, y: v.carril.fijo } : { x: v.carril.fijo, y: s };
  }

  /** ¿Está libre el carril de destino alrededor del punto donde se uniría este carro? */
  private destinoLibre(destino: Carril, punto: number): boolean {
    const g = this.grupos.get(destino.id);
    if (!g) return true;
    for (const w of g.lista) {
      const s = destino.inicio + destino.dir * w.u;
      const antes = (punto - s) * destino.dir; // positivo: el otro todavía no llegó al punto
      if (antes >= -(w.largo / 2 + 40) && antes <= VENTANA_LIBRE) return false;
    }
    return true;
  }

  private mover(v: Vehiculo, a: Carril): void {
    const de = this.grupos.get(v.carril.id);
    if (de) de.lista.splice(de.lista.indexOf(v), 1);
    v.carril = a;
    this.grupos.get(a.id)?.lista.push(v);
  }

  avanzar(dt: number, t: number): void {
    const senales = estadoSemaforos(t);
    const dtc = Math.min(dt, 0.1);
    const saltos: Array<{ v: Vehiculo; a: Carril; u: number }> = [];
    const salidas: Vehiculo[] = [];
    for (const { c, lista } of this.grupos.values()) {
      lista.sort((a, b) => b.u - a.u);
      const largoCarril = Math.abs(c.fin - c.inicio);
      for (let i = 0; i < lista.length; i++) {
        const v = lista[i] as Vehiculo;
        const adelante = lista[i - 1];
        const frente = v.u + v.largo / 2;
        let libre = Infinity;
        if (adelante) libre = adelante.u - adelante.largo / 2 - frente;
        for (const l of c.pares) {
          const uPare = (l.pos - c.inicio) * c.dir;
          const luz = senales[l.senal];
          if (frente <= uPare + 1.5 && luz !== 'verde') {
            const d = uPare - frente;
            // Con amarillo, el que ya está encima de la línea sigue.
            if (luz === 'rojo' || d > 22) libre = Math.min(libre, Math.max(0, d));
          }
        }
        if (v.tipo === 'bus' && c.parada !== undefined && !v.yaParo) {
          const uParada = (c.parada - c.inicio) * c.dir;
          const d = uParada - v.u;
          libre = Math.min(libre, Math.max(0, d));
          if (d < 3 && v.v < 5) {
            v.yaParo = true;
            v.espera = t + 5;
          }
        }
        const e = c.empalme;
        if (e && v.gira) {
          const destino = this.grupos.get(e.destino)?.c;
          if (destino) {
            const uDesde = (e.desde - c.inicio) * c.dir;
            const uEn = (e.en - c.inicio) * c.dir;
            // El punto de unión, medido sobre el eje del carril de destino, es la coordenada fija de este carril.
            const punto = c.fijo;
            if (v.u >= uEn) {
              if (this.destinoLibre(destino, punto)) {
                saltos.push({ v, a: destino, u: (punto - destino.inicio) * destino.dir });
                continue;
              }
              libre = Math.min(libre, 0);
            } else if (frente >= uDesde - 1 && !this.destinoLibre(destino, punto)) {
              libre = Math.min(libre, Math.max(0, uDesde - frente));
            }
          }
        }
        let objetivo = Math.max(0, Math.min(v.vmax, (libre - 6) * 2));
        if (v.espera > t) objetivo = 0;
        if (objetivo > v.v) v.v += Math.min(objetivo - v.v, 70 * dtc);
        else v.v -= Math.min(v.v - objetivo, 260 * dtc);
        v.u += v.v * dtc;
        if (v.u - v.largo / 2 > largoCarril + 60) salidas.push(v);
      }
    }
    for (const s of saltos) {
      this.mover(s.v, s.a);
      s.v.u = s.u;
      s.v.v = Math.min(s.v.v, 45);
      s.v.gira = false;
    }
    for (const v of salidas) {
      // Sale por el extremo y reaparece por el principio (de este carril o del que corresponda), con otro color.
      const destino = (v.carril.reaparece ? this.grupos.get(v.carril.reaparece)?.c : undefined) ?? v.carril;
      if (destino !== v.carril) this.mover(v, destino);
      const largoDestino = Math.abs(destino.fin - destino.inicio);
      v.u = -v.largo / 2 - 40 - this.azar() * largoDestino * 0.15;
      v.color = this.colorAzar();
      v.yaParo = false;
      v.espera = 0;
      v.gira = destino.empalme ? this.azar() < destino.empalme.probabilidad : false;
      if (v.tipo === 'auto') v.vmax = this.velocidadAzar('auto');
    }
  }
}

// ---------------------------------------------------------------------------
// Peatones
// ---------------------------------------------------------------------------

export type DirPeaton = 'e' | 's' | 'n';

export interface Peaton {
  ruta: RutaPeaton;
  /** Avance entre 0 (punto A) y 1 (punto B). */
  p: number;
  sentido: 1 | -1;
  /** Segundos que le quedan de pausa en un extremo. */
  pausa: number;
  x: number;
  y: number;
  dir: DirPeaton;
  voltear: boolean;
  camina: boolean;
  /** Espera su turno para cruzar. */
  esperando: boolean;
}

export interface ContextoGente {
  senales: EstadoSenales;
  /** Hay tren cerca del paso peatonal de la vía: no se cruza la avenida. */
  trenCerca: boolean;
}

/**
 * Peatones que van y vienen entre dos puntos, con una pausa en cada extremo. Los que cruzan una calle esperan el turno
 * de los peatones y salen en los primeros segundos de ese turno, para alcanzar a cruzar con los carros detenidos.
 */
export class Gente {
  readonly peatones: Peaton[];
  private readonly azar: () => number;

  constructor(rutas: readonly RutaPeaton[], semilla = 11) {
    this.azar = crearAzar(semilla);
    this.peatones = rutas.map((r) => {
      // Los que cruzan empiezan en un extremo: nadie arranca a mitad de la calzada.
      const p0 = r.cruce ? (r.fase < 0.5 ? 0 : 1) : r.fase;
      const p: Peaton = { ruta: r, p: p0, sentido: p0 >= 1 ? -1 : r.fase < 0.5 ? 1 : -1, pausa: r.cruce ? 0 : 0, x: r.ax, y: r.ay, dir: 'e', voltear: false, camina: true, esperando: false };
      this.colocar(p);
      return p;
    });
  }

  private colocar(p: Peaton): void {
    const r = p.ruta;
    p.x = r.ax + (r.bx - r.ax) * p.p;
    p.y = r.ay + (r.by - r.ay) * p.p;
    const dx = r.bx - r.ax;
    const dy = r.by - r.ay;
    if (Math.abs(dx) >= Math.abs(dy)) {
      p.dir = 'e';
      p.voltear = p.sentido * dx < 0;
    } else {
      p.dir = p.sentido * dy > 0 ? 's' : 'n';
      p.voltear = false;
    }
  }

  avanzar(dt: number, ctx: ContextoGente): void {
    const dtc = Math.min(dt, 0.1);
    for (const p of this.peatones) {
      if (p.pausa > 0) {
        p.pausa -= dtc;
        p.camina = false;
        continue;
      }
      const r = p.ruta;
      const enExtremo = p.p <= 0 || p.p >= 1;
      if (r.cruce && enExtremo) {
        const s = ctx.senales;
        const turno = s.peatones && s.transcurridoPeatones < 1.4;
        const libre = r.cruce === 'v' || !ctx.trenCerca;
        if (!(turno && libre)) {
          p.esperando = true;
          p.camina = false;
          continue;
        }
      }
      p.esperando = false;
      const largo = Math.hypot(r.bx - r.ax, r.by - r.ay) || 1;
      p.p += (p.sentido * r.velocidad * dtc) / largo;
      p.camina = true;
      if (p.p >= 1 || p.p <= 0) {
        p.p = Math.max(0, Math.min(1, p.p));
        p.sentido = p.sentido === 1 ? -1 : 1;
        p.pausa = 1.2 + this.azar() * 3;
      }
      this.colocar(p);
    }
  }
}
