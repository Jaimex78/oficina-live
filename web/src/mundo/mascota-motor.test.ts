import { describe, expect, it } from 'vitest';
import { ConstructorSala, VELOCIDAD_PX_S } from '@ol/shared';
import { DISTANCIA, MascotaSim, T_DORMIRSE, T_SENTARSE, cuadroDeMascota, direccionHacia, puntoAtras, type Dueno } from './mascota-motor';
import { chocaEn } from './movimiento';
import { celdaDePies, centroDeCelda, cuadriculaDe, rutaAPunto } from './ruta';

/** Sala de 14 x 9 con un muro vertical en x = 7 y una puerta de una casilla en y = 4. */
const sala = new ConstructorSala('s', 'S', 14, 9).piso(0, 0, 14, 9, 'piso-madera-clara').muro(7, 0, 7, 3).muro(7, 5, 7, 8).construir();
const g = cuadriculaDe(sala);
const DT = 1 / 60;

const dueno = (x: number, y: number, extra: Partial<Dueno> = {}): Dueno => ({ x, y, dir: 'E', anim: 'quieto', sala: 's', ...extra });

/** Mueve al dueño en línea recta (en pasos de 1/60 s a velocidad normal) hacia un punto y avanza la mascota. */
function caminar(sim: MascotaSim, d: Dueno, hacia: { x: number; y: number }, alCuadro?: () => void): void {
  for (let i = 0; i < 60 * 30; i++) {
    const dx = hacia.x - d.x;
    const dy = hacia.y - d.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 1) break;
    const paso = Math.min(dist, VELOCIDAD_PX_S * DT);
    d.x += (dx / dist) * paso;
    d.y += (dy / dist) * paso;
    d.anim = 'caminar';
    sim.actualizar(DT, d, g);
    alCuadro?.();
  }
  d.anim = 'quieto';
}

/** El dueño sigue un camino de casillas (rodeando el muro por la puerta). */
function recorrer(sim: MascotaSim, d: Dueno, hasta: { x: number; y: number }, alCuadro?: () => void): void {
  const ruta = rutaAPunto(g, celdaDePies(d.x, d.y), celdaDePies(hasta.x, hasta.y))!;
  for (const c of ruta) caminar(sim, d, centroDeCelda(c), alCuadro);
}

describe('puntoAtras', () => {
  it('mide por el camino recorrido y no en línea recta', () => {
    const migas = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }];
    const p = puntoAtras(migas, { x: 10, y: 15 }, 8)!;
    expect(p).toEqual({ x: 10, y: 7 });
    const q = puntoAtras(migas, { x: 10, y: 15 }, 20)!;
    expect(q.y).toBe(0);
    expect(q.x).toBeCloseTo(5, 5);
    expect(puntoAtras(migas, { x: 10, y: 15 }, 99)).toBeNull();
  });
  it('direccionHacia usa el eje dominante y conserva la dirección si no hay movimiento', () => {
    expect(direccionHacia(5, 1, 'S')).toBe('E');
    expect(direccionHacia(-5, 1, 'S')).toBe('O');
    expect(direccionHacia(1, -5, 'S')).toBe('N');
    expect(direccionHacia(0, 0, 'O')).toBe('O');
  });
});

describe('la mascota sigue a su dueño', () => {
  it('camina detrás con retraso, sin pegarse ni quedar lejos', () => {
    const d = dueno(2 * 32 + 16, 2 * 32 + 24);
    const sim = new MascotaSim(d.x, d.y, 's');
    sim.aparecerCerca(d, g);
    let max = 0;
    let min = Infinity;
    let cuadros = 0;
    caminar(sim, d, { x: 6 * 32 + 16, y: 2 * 32 + 24 }, () => {
      cuadros++;
      if (cuadros < 90) return;
      const dist = Math.hypot(sim.x - d.x, sim.y - d.y);
      max = Math.max(max, dist);
      min = Math.min(min, dist);
    });
    expect(max).toBeLessThan(DISTANCIA + 14);
    expect(min).toBeGreaterThan(10);
    // Va detrás: queda al oeste de su dueño, que camina al este.
    expect(sim.x).toBeLessThan(d.x);
    expect(sim.postura).not.toBe('dormida');
  });

  it('nunca entra en una pared ni en un mueble y cruza la puerta tras su dueño', () => {
    const d = dueno(3 * 32 + 16, 4 * 32 + 24);
    const sim = new MascotaSim(d.x, d.y, 's');
    sim.aparecerCerca(d, g);
    let choques = 0;
    let pasoPuerta = false;
    const cuadro = () => {
      if (chocaEn(g, sim.x, sim.y)) choques++;
      if (sim.x > 8 * 32) pasoPuerta = true;
    };
    recorrer(sim, d, centroDeCelda({ x: 11, y: 7 }), cuadro);
    recorrer(sim, d, centroDeCelda({ x: 2, y: 1 }), cuadro);
    expect(choques).toBe(0);
    expect(pasoPuerta).toBe(true);
    // Terminó cerca de su dueño, del mismo lado del muro.
    for (let i = 0; i < 120; i++) sim.actualizar(DT, d, g);
    expect(Math.hypot(sim.x - d.x, sim.y - d.y)).toBeLessThan(DISTANCIA + 14);
  });

  it('con el dueño quieto se acomoda a su lado y no detrás de él (donde él la taparía)', () => {
    const d = dueno(3 * 32 + 16, 3 * 32 + 24);
    const sim = new MascotaSim(d.x, d.y, 's');
    sim.aparecerCerca(d, g);
    // Llega caminando hacia abajo: la mascota queda justo arriba de él.
    caminar(sim, d, { x: d.x, y: d.y + 70 });
    for (let i = 0; i < 60 * 2; i++) sim.actualizar(DT, d, g);
    expect(Math.abs(sim.x - d.x)).toBeGreaterThanOrEqual(16);
    expect(Math.abs(sim.y - d.y)).toBeLessThanOrEqual(16);
    expect(chocaEn(g, sim.x, sim.y)).toBe(false);
  });

  it('si el dueño la deja al otro lado de un muro, rodea por la puerta', () => {
    const d = dueno(2 * 32 + 16, 2 * 32 + 24);
    const sim = new MascotaSim(10 * 32 + 16, 2 * 32 + 24, 's');
    let choques = 0;
    for (let i = 0; i < 60 * 12; i++) {
      sim.actualizar(DT, d, g);
      if (chocaEn(g, sim.x, sim.y)) choques++;
    }
    expect(choques).toBe(0);
    expect(sim.x).toBeLessThan(7 * 32);
    expect(Math.hypot(sim.x - d.x, sim.y - d.y)).toBeLessThan(DISTANCIA + 14);
  });

  it('se sienta si el dueño se queda quieto unos segundos y luego se duerme; al moverse despierta', () => {
    const d = dueno(3 * 32 + 16, 3 * 32 + 24);
    const sim = new MascotaSim(d.x, d.y, 's');
    sim.aparecerCerca(d, g);
    const hasta = (s: number) => {
      for (let i = 0; i < s * 60; i++) sim.actualizar(DT, d, g);
    };
    hasta(T_SENTARSE - 1);
    expect(sim.postura).toBe('quieta');
    hasta(2);
    expect(sim.postura).toBe('sentada');
    hasta(T_DORMIRSE);
    expect(sim.postura).toBe('dormida');
    caminar(sim, d, { x: d.x + 90, y: d.y });
    expect(['camina', 'quieta']).toContain(sim.postura);
    expect(sim.tQuieta).toBeLessThan(T_SENTARSE + 5);
  });

  it('si el dueño se sienta, ella se coloca junto a la silla en una casilla libre y se sienta', () => {
    const silla = centroDeCelda({ x: 4, y: 4 });
    const d = dueno(2 * 32 + 16, 4 * 32 + 24);
    const sim = new MascotaSim(d.x, d.y, 's');
    sim.aparecerCerca(d, g);
    d.x = silla.x;
    d.y = silla.y;
    d.anim = 'sentado';
    for (let i = 0; i < 60 * 4; i++) sim.actualizar(DT, d, g);
    const c = celdaDePies(sim.x, sim.y);
    expect(Math.max(Math.abs(c.x - 4), Math.abs(c.y - 4))).toBe(1);
    expect(g.bloqueo[c.y * g.ancho + c.x]).toBe(0);
    expect(sim.postura).toBe('sentada');
  });

  it('aparece junto al dueño al cambiar de sala o si queda lejísimos', () => {
    const d = dueno(2 * 32 + 16, 2 * 32 + 24);
    const sim = new MascotaSim(13 * 32 + 16, 8 * 32, 's');
    sim.actualizar(DT, d, g);
    expect(Math.hypot(sim.x - d.x, sim.y - d.y)).toBeLessThan(80);
    sim.actualizar(DT, { ...d, x: 3 * 32, y: 3 * 32 + 24, sala: 'otra' }, g);
    expect(Math.hypot(sim.x - 3 * 32, sim.y - (3 * 32 + 24))).toBeLessThan(80);
    expect(chocaEn(g, sim.x, sim.y)).toBe(false);
  });

  it('50 mascotas durante 20 segundos cuestan poco (las migas no crecen sin límite)', () => {
    const t0 = performance.now();
    const sims = Array.from({ length: 50 }, (_, i) => {
      const d = dueno((1 + (i % 5)) * 32 + 16, (1 + Math.floor(i / 10)) * 32 + 24);
      const s = new MascotaSim(d.x, d.y, 's');
      s.aparecerCerca(d, g);
      return { s, d };
    });
    for (let f = 0; f < 60 * 20; f++) {
      for (const { s, d } of sims) {
        d.x = Math.min(6 * 32, Math.max(32 + 16, 3 * 32 + 90 * Math.sin(f / 60 + s.x)));
        d.y = 4 * 32 + 24;
        s.actualizar(DT, d, g);
        expect(s.cantidadMigas).toBeLessThan(80);
      }
    }
    expect(performance.now() - t0).toBeLessThan(2500);
  });

  it('el cuadro de animación sigue el ciclo de las personas y la postura', () => {
    expect(cuadroDeMascota('quieta', 0, 0)).toBe(0);
    expect(cuadroDeMascota('sentada', 0, 0)).toBe(3);
    expect(cuadroDeMascota('dormida', 999, 0.5)).toBe(3);
    const vistos = new Set([0, 125, 250, 375].map((t) => cuadroDeMascota('camina', t, 0)));
    expect([...vistos].sort()).toEqual([0, 1, 2]);
  });
});
