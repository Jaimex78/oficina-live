import { CASILLA } from '@ol/shared';
import { describe, expect, it } from 'vitest';
import { DURACION_PUERTA, avanzarPuerta, hayAlguienCerca } from './puertas-logica';

/** Una puerta de una casilla en el muro vertical x=10, y=5 (muro entre la oficina, al este, y el pasillo, al oeste). */
const puerta = { x: 10, y: 5, ancho: 1, alto: 1 };
const pies = (cx: number, cy: number) => ({ x: cx * CASILLA + 16, y: cy * CASILLA + 24 });

describe('puertas: quién las abre', () => {
  it('abre si alguien está en el umbral o a una casilla, de un lado o del otro', () => {
    expect(hayAlguienCerca(puerta, [pies(10, 5)])).toBe(true);
    expect(hayAlguienCerca(puerta, [pies(9, 5)])).toBe(true);
    expect(hayAlguienCerca(puerta, [pies(11, 5)])).toBe(true);
  });
  it('se cierra cuando la persona ya se alejó dos casillas', () => {
    expect(hayAlguienCerca(puerta, [pies(12, 5)])).toBe(false);
    expect(hayAlguienCerca(puerta, [pies(8, 5)])).toBe(false);
    expect(hayAlguienCerca(puerta, [])).toBe(false);
  });
  it('cuenta a cualquiera de los presentes', () => {
    expect(hayAlguienCerca(puerta, [pies(2, 2), pies(9, 5)])).toBe(true);
  });
  it('en una puerta doble cuenta toda su longitud', () => {
    expect(hayAlguienCerca({ ...puerta, alto: 2 }, [pies(11, 6)])).toBe(true);
    expect(hayAlguienCerca({ ...puerta, alto: 2 }, [pies(11, 8)])).toBe(false);
  });
});

describe('puertas: la animación', () => {
  it('abre y cierra de forma gradual, sin pasarse', () => {
    let p = 0;
    p = avanzarPuerta(p, true, DURACION_PUERTA / 2);
    expect(p).toBeCloseTo(0.5);
    p = avanzarPuerta(p, true, 1);
    expect(p).toBe(1);
    p = avanzarPuerta(p, false, DURACION_PUERTA / 4);
    expect(p).toBeCloseTo(0.75);
    p = avanzarPuerta(p, false, 1);
    expect(p).toBe(0);
  });
});
