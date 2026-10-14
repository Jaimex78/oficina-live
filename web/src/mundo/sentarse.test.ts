import { CASILLA, type Asiento } from '@ol/shared';
import { describe, expect, it } from 'vitest';
import { avanzarPorRuta, pasoConDeslizamiento } from './movimiento';
import { centroDeCelda, type Cuadricula } from './ruta';
import { asientoBajoElCentro, ESPERA_SENTARSE_MS, SentarseAlParar } from './sentarse';

/**
 * Sala de 9x5. Fila 0: escritorios (sólidos). Fila 1: sillas de escritorio en x=1, 3, 5 y 7 (miran al norte), un puff en (4,3)
 * y un sofá de dos puestos en (1,3) y (2,3). Los asientos NO bloquean. El pasillo libre está en y>=2.
 */
function sala(): { g: Cuadricula; asientos: Asiento[] } {
  const ancho = 9;
  const alto = 5;
  const bloqueo = new Uint8Array(ancho * alto);
  for (let x = 0; x < ancho; x++) bloqueo[x] = 1;
  const asientos: Asiento[] = [];
  for (const x of [1, 3, 5, 7]) asientos.push({ colocacion: `s${x}`, x, y: 1, mira: 'N' });
  asientos.push({ colocacion: 'puff', x: 4, y: 3, mira: 'S', sinFrente: true });
  asientos.push({ colocacion: 'sofa', x: 1, y: 3, mira: 'S' }, { colocacion: 'sofa', x: 2, y: 3, mira: 'S' });
  return { g: { ancho, alto, bloqueo }, asientos };
}

const libre = () => false;
const DT = 1000 / 60;
const VEL = (140 * DT) / 1000;

/** Camina con una flecha (vx, vy) durante `ms` y devuelve dónde acaba; cuenta las veces que el detector habría sentado. */
function caminar(g: Cuadricula, asientos: Asiento[], det: SentarseAlParar, x: number, y: number, vx: number, vy: number, ms: number) {
  let sentadas = 0;
  for (let t = 0; t < ms; t += DT) {
    const r = pasoConDeslizamiento(g, x, y, vx, vy, VEL);
    x = r.x;
    y = r.y;
    if (det.paso(DT, false, x, y, asientos, libre)) sentadas++;
  }
  return { x, y, sentadas };
}

/** Se queda quieto `ms` y devuelve el asiento donde se habría sentado, o null. */
function quedarse(det: SentarseAlParar, asientos: Asiento[], x: number, y: number, ms: number, ocupado: (a: Asiento) => boolean = libre) {
  for (let t = 0; t < ms; t += DT) {
    const a = det.paso(DT, true, x, y, asientos, ocupado);
    if (a) return a;
  }
  return null;
}

describe('los asientos no son obstáculos', () => {
  it('se cruza el pasillo de sillas, el puff y el sofá caminando, sin trabarse ni sentarse', () => {
    const { g, asientos } = sala();
    const det = new SentarseAlParar();
    // por la fila 1 (sillas) de izquierda a derecha
    const p = centroDeCelda({ x: 0, y: 1 });
    const r = caminar(g, asientos, det, p.x, p.y, 1, 0, 2500);
    expect(r.x).toBeGreaterThan(8 * CASILLA);
    expect(r.sentadas).toBe(0);
    // por la fila 3 (sofá y puff)
    const q = centroDeCelda({ x: 0, y: 3 });
    const r2 = caminar(g, asientos, new SentarseAlParar(), q.x, q.y, 1, 0, 2500);
    expect(r2.x).toBeGreaterThan(8 * CASILLA);
    expect(r2.sentadas).toBe(0);
  });

  it('cruzar una silla hacia arriba, de espaldas al escritorio, tampoco la traba', () => {
    const { g, asientos } = sala();
    const p = centroDeCelda({ x: 3, y: 3 });
    const r = caminar(g, asientos, new SentarseAlParar(), p.x, p.y, 0, -1, 900);
    expect(r.y).toBeLessThan(2 * CASILLA); // llegó hasta la silla (fila 1) y topó con el escritorio
    expect(r.sentadas).toBe(0);
  });
});

describe('sentarse al detenerse', () => {
  it('detenerse en el centro de la silla sienta, con la orientación del asiento', () => {
    const { asientos } = sala();
    const p = centroDeCelda({ x: 3, y: 1 });
    const a = quedarse(new SentarseAlParar(), asientos, p.x, p.y, 0);
    expect(a).toBeNull(); // nunca se movió: aparecer encima no sienta
    const det = new SentarseAlParar();
    caminar(sala().g, asientos, det, p.x - 40, p.y, 1, 0, 0);
    det.paso(DT, false, p.x, p.y, asientos, libre); // venía caminando
    const s = quedarse(det, asientos, p.x, p.y, ESPERA_SENTARSE_MS + 60);
    expect(s?.colocacion).toBe('s3');
    expect(s?.mira).toBe('N');
  });

  it('con tolerancia: no sienta antes de ~160 ms quieto', () => {
    const { asientos } = sala();
    const p = centroDeCelda({ x: 3, y: 1 });
    const det = new SentarseAlParar();
    det.paso(DT, false, p.x, p.y, asientos, libre);
    expect(quedarse(det, asientos, p.x, p.y, ESPERA_SENTARSE_MS - 40)).toBeNull();
  });

  it('puff y sofá: detenerse sobre su casilla sienta, desde cualquier lado', () => {
    const { asientos } = sala();
    for (const [cx, cy, id] of [[4, 3, 'puff'], [2, 3, 'sofa']] as const) {
      const p = centroDeCelda({ x: cx, y: cy });
      const det = new SentarseAlParar();
      det.paso(DT, false, p.x, p.y, asientos, libre);
      expect(quedarse(det, asientos, p.x, p.y, 300)?.colocacion).toBe(id);
    }
  });

  it('detenerse a medio pelo, con el centro en la casilla vecina, no sienta', () => {
    const { asientos } = sala();
    const c = centroDeCelda({ x: 4, y: 3 });
    for (const x of [4 * CASILLA - 1, 5 * CASILLA + 1]) {
      const det = new SentarseAlParar();
      det.paso(DT, false, x, c.y, asientos, libre);
      expect(quedarse(det, asientos, x, c.y, 500)).toBeNull();
    }
    // y justo dentro del borde sí
    const det = new SentarseAlParar();
    det.paso(DT, false, 4 * CASILLA + 1, c.y, asientos, libre);
    expect(quedarse(det, asientos, 4 * CASILLA + 1, c.y, 300)?.colocacion).toBe('puff');
  });

  it('un asiento ocupado no sienta', () => {
    const { asientos } = sala();
    const p = centroDeCelda({ x: 4, y: 3 });
    const det = new SentarseAlParar();
    det.paso(DT, false, p.x, p.y, asientos, libre);
    expect(quedarse(det, asientos, p.x, p.y, 500, () => true)).toBeNull();
  });

  it('tras levantarte no vuelves a sentarte ahí hasta salir de la casilla', () => {
    const { asientos } = sala();
    const p = centroDeCelda({ x: 4, y: 3 });
    const det = new SentarseAlParar();
    det.paso(DT, false, p.x, p.y, asientos, libre);
    det.ignorarHasta(asientos.find((a) => a.colocacion === 'puff')!);
    expect(quedarse(det, asientos, p.x, p.y, 600)).toBeNull();
    // sales de la casilla y vuelves: ahora sí
    det.paso(DT, false, p.x + 40, p.y, asientos, libre);
    det.paso(DT, false, p.x, p.y, asientos, libre);
    expect(quedarse(det, asientos, p.x, p.y, 300)?.colocacion).toBe('puff');
  });

  it('un camino (doble clic) que termina en el centro del asiento queda dentro de su casilla', () => {
    const { g, asientos } = sala();
    const ruta = [{ x: 2, y: 2 }, { x: 3, y: 2 }, { x: 3, y: 1 }];
    let p = centroDeCelda({ x: 1, y: 2 });
    let termino = false;
    for (let i = 0; i < 400 && !termino; i++) {
      const r = avanzarPorRuta(g, p.x, p.y, ruta, VEL);
      p = { x: r.x, y: r.y };
      termino = r.termino;
    }
    expect(termino).toBe(true);
    expect(asientoBajoElCentro(asientos, p.x, p.y, libre)?.colocacion).toBe('s3');
  });
});
