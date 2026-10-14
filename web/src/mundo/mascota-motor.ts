import { CASILLA, VELOCIDAD_PX_S, type Animacion, type Celda, type Direccion } from '@ol/shared';
import { avanzarPorRuta, chocaEn, lineaLibre, pasoConDeslizamiento } from './movimiento';
import { celdaDePies, centroDeCelda, rutaAPunto, type Cuadricula } from './ruta';

/**
 * El movimiento de una mascota, sin Phaser. Cada cliente la simula sola a partir de la posición mostrada de su dueño:
 *  - Camina detrás de él siguiendo sus migas (el camino que el dueño ya recorrió), a `DISTANCIA` píxeles. Como el dueño pasó por
 *    ahí, casi nunca choca; si algo se atraviesa, rodea con el camino más corto de la rejilla (A*).
 *  - Usa la misma rejilla de colisión y la misma caja que las personas: no atraviesa paredes ni muebles.
 *  - Si el dueño se queda quieto unos segundos, se sienta; luego se duerme. Si el dueño se sienta, ella busca una casilla libre junto a su silla.
 *  - Si queda muy lejos (cambio de sala, corrección del servidor) o atascada, aparece junto a su dueño.
 * Es barata: el costo por cuadro es constante y el camino con A* solo se calcula si la línea recta está bloqueada, a lo sumo dos veces por segundo.
 */

/** A qué distancia (píxeles, por el camino recorrido) camina detrás de su dueño. */
export const DISTANCIA = 22;
/** Un poco más rápida que las personas, para alcanzarlas sin quedar pegada. */
export const VELOCIDAD_MASCOTA = VELOCIDAD_PX_S * 1.08;
/** Cuánto se separa a un lado de su dueño cuando él se queda quieto (para no taparse detrás de él). */
export const LADO_REPOSO = 22;
/** Segundos con el dueño quieto antes de que ella se acomode a su lado. */
export const T_REPOSO = 0.35;
/** Segundos quieta antes de sentarse y antes de dormirse. */
export const T_SENTARSE = 2.5;
export const T_DORMIRSE = 14;
/** Más lejos que esto (píxeles), aparece junto al dueño. */
export const DISTANCIA_SALTO = 11 * CASILLA;
/** Segundos sin avanzar (con algo a lo lejos que alcanzar) antes de aparecer junto al dueño. */
export const T_ATASCADA = 1.6;

export type Postura = 'camina' | 'quieta' | 'sentada' | 'dormida';

export interface Dueno {
  x: number;
  y: number;
  dir: Direccion;
  anim: Animacion;
  /** Id de la sala: si cambia, la mascota aparece junto al dueño. */
  sala: string;
}

interface Punto {
  x: number;
  y: number;
}

const largo = (a: Punto, b: Punto): number => Math.hypot(a.x - b.x, a.y - b.y);

/** El punto que queda `d` píxeles atrás por el camino recorrido, o `null` si el dueño aún no se alejó tanto de donde empezó. */
export function puntoAtras(migas: readonly Punto[], dueno: Punto, d: number): Punto | null {
  let previo: Punto = dueno;
  let acumulado = 0;
  for (let i = migas.length - 1; i >= 0; i--) {
    const m = migas[i] as Punto;
    const seg = largo(previo, m);
    if (acumulado + seg >= d && seg > 0) {
      const t = (d - acumulado) / seg;
      return { x: previo.x + (m.x - previo.x) * t, y: previo.y + (m.y - previo.y) * t };
    }
    acumulado += seg;
    previo = m;
  }
  return null;
}

export function direccionHacia(dx: number, dy: number, actual: Direccion): Direccion {
  if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) return actual;
  return Math.abs(dx) > Math.abs(dy) + 0.01 ? (dx < 0 ? 'O' : 'E') : dy < 0 ? 'N' : 'S';
}

export class MascotaSim {
  x: number;
  y: number;
  dir: Direccion = 'S';
  postura: Postura = 'quieta';
  /** Segundos que lleva sin moverse (para sentarse y dormir). */
  tQuieta = 0;
  private readonly migas: Punto[] = [];
  private ruta: Celda[] = [];
  private tRuta = 0;
  private tAtascada = 0;
  private sala: string;
  /** La casilla junto a la silla donde espera cuando el dueño está sentado (se recalcula si el dueño cambia de casilla). */
  private junto: { dueno: string; punto: Punto } | null = null;

  constructor(x: number, y: number, sala = '') {
    this.x = x;
    this.y = y;
    this.sala = sala;
  }

  /** Aparece en (x, y) sin trayecto ni migas. */
  colocar(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.migas.length = 0;
    this.ruta = [];
    this.tAtascada = 0;
    this.junto = null;
  }

  /** Aparece en una casilla libre cerca del dueño (la más cercana a donde él está). */
  aparecerCerca(d: Dueno, g: Cuadricula): void {
    const c = celdaDePies(d.x, d.y);
    let mejor: Punto | null = null;
    let md = Infinity;
    for (let r = 1; r <= 3 && mejor === null; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          const k = { x: c.x + dx, y: c.y + dy };
          if (!libre(g, k)) continue;
          const p = centroDeCelda(k);
          // Los lados del dueño se prefieren a estar justo detrás o delante de él.
          const dd = largo(p, d) + (dx === 0 ? 24 : 0);
          if (dd < md) {
            md = dd;
            mejor = p;
          }
        }
      }
    }
    const p = mejor ?? { x: d.x, y: d.y };
    this.colocar(p.x, p.y);
    this.dir = d.dir;
    this.postura = 'quieta';
    this.tQuieta = 0;
  }

  /** La casilla libre pegada a la del dueño (que está sentado) que le queda más cerca a la mascota; sin elegir la del frente si hay otra. */
  private lugarJunto(d: Dueno, g: Cuadricula): Punto | null {
    const c = celdaDePies(d.x, d.y);
    const clave = `${c.x},${c.y}`;
    if (this.junto?.dueno === clave) return this.junto.punto;
    let mejor: Punto | null = null;
    let md = Infinity;
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, 1], [0, -1], [-1, 1], [1, 1], [-1, -1], [1, -1]] as const) {
      const k = { x: c.x + dx, y: c.y + dy };
      if (!libre(g, k)) continue;
      const p = centroDeCelda(k);
      // A los lados y atrás de la silla se prefieren sobre el frente.
      const dd = largo(p, { x: this.x, y: this.y }) + (dy === 1 ? 40 : 0);
      if (dd < md) {
        md = dd;
        mejor = p;
      }
    }
    this.junto = { dueno: clave, punto: mejor ?? { x: d.x, y: d.y } };
    return mejor;
  }

  /** Avanza `dt` segundos. Devuelve si se movió. */
  actualizar(dt: number, d: Dueno, g: Cuadricula): boolean {
    if (g.ancho === 0) return false;
    if (d.sala !== this.sala) {
      this.sala = d.sala;
      this.aparecerCerca(d, g);
      return false;
    }
    if (largo(this, d) > DISTANCIA_SALTO || chocaEn(g, this.x, this.y)) {
      this.aparecerCerca(d, g);
      return false;
    }

    // Migas: los puntos por donde pasó el dueño, cada 3 píxeles, sin guardar más de lo que la mascota puede necesitar.
    const ultima = this.migas[this.migas.length - 1];
    if (!ultima || largo(ultima, d) >= 3) this.migas.push({ x: d.x, y: d.y });
    while (this.migas.length > 2 && this.largoMigas(d) > DISTANCIA + 70) this.migas.shift();

    // A dónde ir.
    let meta: Punto | null;
    if (d.anim === 'sentado') {
      this.tDuenoQuieto = 0;
      meta = this.lugarJunto(d, g);
    } else {
      this.junto = null;
      meta = puntoAtras(this.migas, d, DISTANCIA);
      // Aún no hay camino suficiente: si está lejos, va hacia el dueño; si está cerca, se queda.
      if (!meta && largo(this, d) > DISTANCIA + 10) meta = { x: d.x, y: d.y };
      // Si el dueño está quieto y la mascota ya está a su alcance, no se mueve (evita vaivenes por las migas).
      if (meta && largo(this, d) <= DISTANCIA + 3 && !this.duenoSeMovio(d)) meta = null;
      // Con el dueño quieto un momento, se acomoda a su lado (no detrás, donde él la taparía).
      this.tDuenoQuieto = this.duenoSeMovio(d) ? 0 : this.tDuenoQuieto + dt;
      if (this.tDuenoQuieto >= T_REPOSO) meta = this.puntoDeReposo(d, g) ?? meta;
    }

    let movio = false;
    let vx = 0;
    let vy = 0;
    if (meta && largo(this, meta) > 2) {
      const paso = VELOCIDAD_MASCOTA * dt * (largo(this, d) > DISTANCIA * 3 ? 1.35 : 1);
      if (lineaLibre(g, this.x, this.y, meta.x, meta.y)) {
        this.ruta = [];
        const dx = meta.x - this.x;
        const dy = meta.y - this.y;
        const dd = Math.hypot(dx, dy);
        const r = pasoConDeslizamiento(g, this.x, this.y, dx / dd, dy / dd, Math.min(paso, dd));
        movio = r.movio;
        vx = dx / dd;
        vy = dy / dd;
        this.x = r.x;
        this.y = r.y;
      } else {
        // Algo se interpone: camino más corto por la rejilla, recalculado a lo sumo cada medio segundo.
        this.tRuta -= dt;
        if (this.ruta.length === 0 || this.tRuta <= 0) {
          this.tRuta = 0.5;
          this.ruta = rutaAPunto(g, celdaDePies(this.x, this.y), celdaDePies(meta.x, meta.y)) ?? [];
        }
        const a = avanzarPorRuta(g, this.x, this.y, this.ruta, paso);
        movio = a.movio;
        vx = a.vx;
        vy = a.vy;
        this.x = a.x;
        this.y = a.y;
      }
      this.tAtascada = movio ? 0 : this.tAtascada + dt;
      if (this.tAtascada > T_ATASCADA) {
        this.aparecerCerca(d, g);
        return false;
      }
    } else this.tAtascada = 0;

    this.ultimoDueno = { x: d.x, y: d.y };
    if (movio) {
      this.dir = direccionHacia(vx, vy, this.dir);
      this.postura = 'camina';
      this.tQuieta = 0;
    } else {
      this.tQuieta += dt;
      // Parada: mira a su dueño.
      this.dir = direccionHacia(d.x - this.x, d.y - 8 - this.y, this.dir);
      const lista = d.anim === 'sentado' ? 0.8 : T_SENTARSE;
      this.postura = this.tQuieta >= T_DORMIRSE ? 'dormida' : this.tQuieta >= lista ? 'sentada' : 'quieta';
    }
    return movio;
  }

  private ultimoDueno: Punto | null = null;
  private tDuenoQuieto = 0;
  private reposo: { dueno: string; punto: Punto | null } | null = null;

  /** Un punto libre a la izquierda o a la derecha del dueño, el que le queda más cerca a la mascota; `null` si no hay ninguno. */
  private puntoDeReposo(d: Dueno, g: Cuadricula): Punto | null {
    const clave = `${Math.round(d.x)},${Math.round(d.y)}`;
    if (this.reposo?.dueno === clave && this.reposo.punto) return this.reposo.punto;
    if (this.reposo?.dueno === clave) return null;
    let mejor: Punto | null = null;
    let md = Infinity;
    for (const [dx, dy] of [[-1, 0], [1, 0], [-1, 0.3], [1, 0.3], [-0.8, -0.5], [0.8, -0.5]] as const) {
      const p = { x: d.x + dx * LADO_REPOSO, y: d.y + dy * LADO_REPOSO };
      if (chocaEn(g, p.x, p.y) || !lineaLibre(g, d.x, d.y, p.x, p.y)) continue;
      const dd = largo(p, this);
      if (dd < md) {
        md = dd;
        mejor = p;
      }
    }
    this.reposo = { dueno: clave, punto: mejor };
    return mejor;
  }
  private duenoSeMovio(d: Dueno): boolean {
    const u = this.ultimoDueno;
    return u === null || largo(u, d) > 0.05;
  }

  private largoMigas(dueno: Punto): number {
    let total = 0;
    let previo = dueno;
    for (let i = this.migas.length - 1; i >= 0; i--) {
      const m = this.migas[i] as Punto;
      total += largo(previo, m);
      previo = m;
    }
    return total;
  }

  get cantidadMigas(): number {
    return this.migas.length;
  }
}

function libre(g: Cuadricula, c: Celda): boolean {
  return c.x >= 0 && c.y >= 0 && c.x < g.ancho && c.y < g.alto && g.bloqueo[c.y * g.ancho + c.x] !== 1;
}

/** El cuadro de animación (0 quieto, 1 y 2 pasos, 3 sentada o dormida) para una postura y un instante. */
export function cuadroDeMascota(postura: Postura, tMs: number, fase: number): 0 | 1 | 2 | 3 {
  if (postura === 'sentada' || postura === 'dormida') return 3;
  if (postura === 'quieta') return 0;
  // Ciclo de caminar 1, 0, 2, 0 a 8 cuadros por segundo, como las personas.
  const ciclo = [1, 0, 2, 0] as const;
  return ciclo[Math.floor(tMs / 125 + fase * 4) % 4] ?? 0;
}
