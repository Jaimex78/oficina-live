import { describe, expect, it } from 'vitest';
import { resolverTraslapes, type Caja } from './colocacion';

const nombre = (id: string, x: number, y: number, prioridad = 0): Caja => ({ id, x, y, w: 60, h: 18, prioridad, tipo: 'nombre' });
const zona = (id: string, x: number, y: number): Caja => ({ id, x, y, w: 60, h: 18, prioridad: -10, tipo: 'zona' });

describe('resolverTraslapes', () => {
  it('lo que no se toca queda donde está', () => {
    const r = resolverTraslapes([nombre('a', 0, 100), nombre('b', 200, 100)]);
    expect(r).toEqual([
      { id: 'a', x: 0, y: 100, visible: true },
      { id: 'b', x: 200, y: 100, visible: true },
    ]);
  });
  it('si dos nombres se encimarían, el de menor prioridad sube', () => {
    const r = resolverTraslapes([nombre('a', 0, 100), nombre('yo', 20, 100, 5)]);
    expect(r.find((c) => c.id === 'yo')?.y).toBe(100); // el mío no se mueve
    expect(r.find((c) => c.id === 'a')?.y).toBe(80); // 100 - (18 + 2)
  });
  it('un grupo de cuatro personas juntas queda en pila, sin que ninguna pise a otra', () => {
    const cajas = [0, 1, 2, 3].map((i) => nombre(`p${i}`, i * 5, 100, 4 - i));
    const r = resolverTraslapes(cajas);
    const ys = r.map((c) => c.y).sort((a, b) => a - b);
    expect(ys).toEqual([40, 60, 80, 100]);
  });
  it('una zona que choca con un nombre se esconde; sin choque se ve', () => {
    const r = resolverTraslapes([nombre('a', 0, 100, 1), zona('z1', 30, 105), zona('z2', 300, 105)]);
    expect(r.find((c) => c.id === 'z1')?.visible).toBe(false);
    expect(r.find((c) => c.id === 'z2')?.visible).toBe(true);
  });
  it('las cajas fijas nunca se mueven ni se esconden', () => {
    const r = resolverTraslapes([{ id: 't', x: 0, y: 0, w: 100, h: 20, prioridad: 9, tipo: 'fija' }, nombre('a', 10, 0)]);
    expect(r.find((c) => c.id === 't')).toEqual({ id: 't', x: 0, y: 0, visible: true });
  });
  it('devuelve el resultado en el mismo orden de entrada', () => {
    const r = resolverTraslapes([nombre('b', 0, 0, 1), nombre('a', 500, 0, 9)]);
    expect(r.map((c) => c.id)).toEqual(['b', 'a']);
  });
});
