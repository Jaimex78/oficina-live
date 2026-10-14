import { describe, expect, it } from 'vitest';
import { ConstructorSala, asientosDe, type SalaMapa } from '@ol/shared';
import { celdaDePies, centroDeCelda, cuadriculaDe, largoDeRuta, rutaAAsiento, rutaAArea, rutaAlLado, rutaAPunto } from './ruta';

/** Una sala de 16 x 10 con un muro vertical que deja un hueco, un escritorio con su silla y un sofá. */
function sala(): SalaMapa {
  return new ConstructorSala('s', 'Sala', 16, 10)
    .piso(0, 0, 16, 10, 'piso-madera-clara')
    .muro(8, 0, 8, 6) // muro de arriba a abajo, con paso libre en las filas 7 a 9
    .poner('escritorio-individual', 2, 2, 'S')
    .poner('silla-oficina', 2, 3, 'N')
    .poner('sofa-3', 11, 8, 'S')
    .llegadas({ x: 1, y: 8 })
    .construir();
}

describe('casilla de los pies', () => {
  it('es la misma que usa el motor y vuelve al centro de la casilla', () => {
    expect(celdaDePies(48, 56)).toEqual({ x: 1, y: 1 });
    const c = centroDeCelda({ x: 5, y: 7 });
    expect(celdaDePies(c.x, c.y)).toEqual({ x: 5, y: 7 });
  });
});

describe('rutaAPunto', () => {
  const s = sala();
  const g = cuadriculaDe(s);

  it('rodea el muro por el paso libre y nunca pisa una casilla bloqueada', () => {
    const r = rutaAPunto(g, { x: 5, y: 2 }, { x: 12, y: 2 });
    expect(r).not.toBeNull();
    for (const c of r ?? []) expect(g.bloqueo[c.y * g.ancho + c.x]).toBe(0);
    expect(r?.some((c) => c.y >= 7)).toBe(true); // tuvo que bajar al hueco del muro
    expect(r?.[r.length - 1]).toEqual({ x: 12, y: 2 });
  });

  it('si el destino es sólido, va a la casilla libre más cercana', () => {
    const r = rutaAPunto(g, { x: 5, y: 6 }, { x: 2, y: 2 }); // encima del escritorio
    expect(r).not.toBeNull();
    const fin = r?.[r.length - 1];
    expect(fin && g.bloqueo[fin.y * g.ancho + fin.x]).toBe(0);
    expect(Math.hypot((fin?.x ?? 0) - 2, (fin?.y ?? 0) - 2)).toBeLessThan(2.5);
  });

  it('un destino fuera de la sala se acota al borde', () => {
    const r = rutaAPunto(g, { x: 5, y: 5 }, { x: 99, y: 99 });
    expect(r?.[r.length - 1]).toEqual({ x: 15, y: 9 });
  });

  it('si el destino está al otro lado de un muro sin paso, se acerca lo más posible; y si ya estás ahí, no camina', () => {
    const encerrado = new ConstructorSala('e', 'E', 6, 6).piso(0, 0, 6, 6, 'piso-madera-clara').muro(2, 0, 2, 5).construir();
    const ge = cuadriculaDe(encerrado);
    const r = rutaAPunto(ge, { x: 0, y: 0 }, { x: 4, y: 4 });
    expect(r?.length ?? 0).toBeGreaterThan(0);
    expect(r?.every((c) => c.x <= 1)).toBe(true); // nunca cruza el muro
    expect(rutaAPunto(ge, { x: 0, y: 0 }, { x: 0, y: 0 })).toEqual([]);
  });
});

describe('rutaAlLado (ir hacia una persona)', () => {
  const g = cuadriculaDe(sala());
  it('queda pegado a la persona, no encima', () => {
    const r = rutaAlLado(g, { x: 4, y: 8 }, { x: 13, y: 5 });
    const fin = r?.[r.length - 1] ?? { x: 4, y: 8 };
    expect(Math.max(Math.abs(fin.x - 13), Math.abs(fin.y - 5))).toBe(1);
  });
  it('si ya estás pegado, no camina', () => {
    expect(rutaAlLado(g, { x: 5, y: 5 }, { x: 6, y: 6 })).toEqual([]);
  });
});

describe('rutaAAsiento', () => {
  const s = sala();
  const g = cuadriculaDe(s);
  const silla = asientosDe(s).find((a) => a.x === 2 && a.y === 3);

  it('camina hasta el centro del asiento y se sienta al llegar', () => {
    expect(silla).toBeDefined();
    const p = rutaAAsiento(g, { x: 6, y: 5 }, silla!);
    expect(p?.llegaSentado).toBe(true);
    expect(p?.ruta.at(-1)).toEqual({ x: 2, y: 3 });
  });

  it('si ya estás en la casilla del asiento, se sienta sin caminar', () => {
    expect(rutaAAsiento(g, { x: 2, y: 3 }, silla!)?.ruta).toEqual([]);
  });

  it('desde cualquier lado se llega: ya no hay lado correcto', () => {
    expect(rutaAAsiento(g, { x: 3, y: 3 }, silla!)?.ruta.at(-1)).toEqual({ x: 2, y: 3 });
  });

  it('el sofá de tres puestos tiene tres asientos y a cada uno se llega', () => {
    const sofas = asientosDe(s).filter((a) => a.y === 8 && a.x >= 11);
    expect(sofas).toHaveLength(3);
    for (const a of sofas) expect(rutaAAsiento(g, { x: 1, y: 8 }, a)?.llegaSentado).toBe(true);
  });

  it('un asiento ocupado (bloqueado en la cuadrícula) o tapado no rompe nada: no se sienta', () => {
    const g2 = { ...g, bloqueo: g.bloqueo.slice() };
    g2.bloqueo[3 * g2.ancho + 2] = 1;
    const p = rutaAAsiento(g2, { x: 6, y: 5 }, silla!);
    expect(p === null || p.llegaSentado === false).toBe(true);
  });
});

describe('rutaAArea', () => {
  const s = sala();
  const g = cuadriculaDe(s);
  it('va al centro libre del área, aunque haya un escritorio adentro', () => {
    const r = rutaAArea(s, g, { x: 1, y: 8 }, { x: 1, y: 1, w: 5, h: 4 });
    const fin = r?.[r.length - 1];
    expect(fin).toBeDefined();
    expect(g.bloqueo[(fin?.y ?? 0) * g.ancho + (fin?.x ?? 0)]).toBe(0);
    expect((fin?.x ?? 0) >= 1 && (fin?.x ?? 0) <= 5 && (fin?.y ?? 0) >= 1 && (fin?.y ?? 0) <= 4).toBe(true);
  });
  it('un área sin casillas libres alcanzables devuelve null', () => {
    expect(rutaAArea(s, g, { x: 1, y: 8 }, { x: 8, y: 0, w: 1, h: 3 })).toBeNull(); // todo muro
  });
});

describe('largoDeRuta', () => {
  it('cuenta la diagonal como 1,4', () => {
    expect(largoDeRuta({ x: 0, y: 0 }, [{ x: 1, y: 0 }, { x: 2, y: 1 }])).toBeCloseTo(2.4142, 3);
  });
});
