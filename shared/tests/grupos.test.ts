import { describe, expect, it } from 'vitest';
import { GRUPOS_OBJETO, INVENTARIO, grupoDe } from '../src';

describe('grupos del panel de objetos', () => {
  const visibles = INVENTARIO.filter((o) => o.capa !== 'piso' && !o.obsoleto);
  it('todo objeto visible cae en una pestaña que existe', () => {
    const ids = new Set<string>(GRUPOS_OBJETO.map((g) => g.id));
    for (const o of visibles) expect(ids.has(grupoDe(o)), o.id).toBe(true);
  });
  it('ninguna pestaña queda vacía', () => {
    for (const g of GRUPOS_OBJETO) expect(visibles.some((o) => grupoDe(o) === g.id), g.id).toBe(true);
  });
  it('las fiestas van en Temporada y los baños en Baños', () => {
    for (const o of visibles.filter((x) => x.coleccion)) expect(grupoDe(o)).toBe('temporada');
    for (const o of visibles.filter((x) => x.categoria === 'banos')) expect(grupoDe(o)).toBe('banos');
  });
});
