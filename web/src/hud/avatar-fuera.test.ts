import { describe, expect, it } from 'vitest';
import { burbujaFuera, estaFuera } from './avatar-fuera';

const M = { izq: 40, der: 40, arriba: 56, abajo: 90 };
const lienzo = { ancho: 1000, alto: 600 };

describe('burbuja del avatar fuera de pantalla', () => {
  it('no sale si estás a la vista', () => {
    expect(estaFuera({ x: 500, y: 300, ...lienzo })).toBe(false);
    expect(burbujaFuera({ x: 20, y: 20, ...lienzo }, M)).toBeNull();
  });

  it('a la derecha: queda en el borde derecho y apunta a la derecha', () => {
    const b = burbujaFuera({ x: 1800, y: 300, ...lienzo }, M);
    expect(b).not.toBeNull();
    expect(b?.x).toBeCloseTo(960);
    expect(b?.y).toBeCloseTo(300);
    expect(b?.grados).toBeCloseTo(0);
  });

  it('arriba: respeta el margen de arriba y apunta hacia arriba', () => {
    const b = burbujaFuera({ x: 500, y: -900, ...lienzo }, M);
    expect(b?.y).toBeCloseTo(56);
    expect(b?.x).toBeCloseTo(500);
    expect(b?.grados).toBeCloseTo(-90);
  });

  it('abajo: respeta el margen de abajo, sobre la barra', () => {
    const b = burbujaFuera({ x: 500, y: 2000, ...lienzo }, M);
    expect(b?.y).toBeCloseTo(510);
  });

  it('en diagonal queda dentro del rectángulo interior', () => {
    const b = burbujaFuera({ x: -3000, y: -3000, ...lienzo }, M);
    expect(b?.x).toBeGreaterThanOrEqual(40);
    expect(b?.y).toBeGreaterThanOrEqual(56);
    expect(b?.grados).toBeLessThan(-90);
  });
});
