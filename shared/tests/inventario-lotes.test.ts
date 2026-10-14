import { describe, expect, it } from 'vitest';
import { CASILLA, INVENTARIO, LOTES_EXTRA_PARA_PRUEBAS, framesDe, huellaDe, objetoPorId } from '../src';

describe('inventario por lotes (lote 8 en adelante)', () => {
  it('cada lote extra vive en su propio archivo, solo tiene objetos de su número y aparece en INVENTARIO', () => {
    expect(LOTES_EXTRA_PARA_PRUEBAS.length).toBeGreaterThanOrEqual(1);
    LOTES_EXTRA_PARA_PRUEBAS.forEach((lote) => {
      const numeros = new Set(lote.map((o) => o.lote));
      expect(numeros.size).toBe(1);
      expect([...numeros][0]).toBeGreaterThanOrEqual(8);
      for (const o of lote) expect(objetoPorId(o.id)).toBe(INVENTARIO.find((x) => x.id === o.id));
    });
  });

  it('los objetos del lote 8 prometen los cuadros de su inventario y miden lo que dice su huella', () => {
    for (const o of INVENTARIO.filter((x) => x.lote === 8)) {
      expect(Object.keys(framesDe(o)).length, o.id).toBeGreaterThan(0);
      const h = huellaDe(o, o.orientaciones[0] ?? 'U');
      expect(h.ancho * CASILLA, o.id).toBeGreaterThan(0);
      if (o.apoyado) expect(o.bloquea, o.id).toEqual([]);
    }
  });

  it('los escritorios nuevos son de 3 casillas y los sustituidos quedan obsoletos con su reemplazo', () => {
    expect(objetoPorId('escritorio-3x1')).toMatchObject({ ancho: 3, alto: 1, categoria: 'puestos', sobresale: 10 });
    expect(objetoPorId('escritorio-3x2')).toMatchObject({ ancho: 3, alto: 2, categoria: 'puestos' });
    expect(objetoPorId('escritorio-individual')).toMatchObject({ obsoleto: true, reemplazadoPor: 'escritorio-3x1' });
    expect(objetoPorId('silla-oficina')).toMatchObject({ lote: 8, interaccion: 'sentarse' });
  });
});
