import { describe, expect, it } from 'vitest';
import { aMundo, aPantalla, crearProyeccion, enPantalla } from './proyeccion';

describe('proyección del mundo a la pantalla', () => {
  it('el centro del lienzo muestra el punto donde mira la cámara', () => {
    // cámara centrada en (500, 300) con un lienzo de 800 x 600: scroll = centro - mitad
    const p = crearProyeccion(500 - 400, 300 - 300, 800, 600, 2);
    const c = aPantalla(p, 500, 300);
    expect(c).toEqual({ x: 400, y: 300 });
  });
  it('un píxel del mundo son `zoom` píxeles de pantalla', () => {
    const p = crearProyeccion(100, 100, 800, 600, 3);
    const a = aPantalla(p, 500, 300);
    const b = aPantalla(p, 501, 301);
    expect(b.x - a.x).toBe(3);
    expect(b.y - a.y).toBe(3);
  });
  it('de ida y vuelta vuelve al mismo punto, incluso con zoom fraccionario y lienzo impar', () => {
    const p = crearProyeccion(123.7, 45.2, 801, 599, 0.35);
    const w = aMundo(p, 250, 120);
    const s = aPantalla(p, w.x, w.y);
    expect(s.x).toBeCloseTo(250, 6);
    expect(s.y).toBeCloseTo(120, 6);
  });
  it('el desplazamiento se redondea hacia abajo, como lo hace la cámara con roundPixels', () => {
    const a = crearProyeccion(10.9, 0, 800, 600, 1);
    const b = crearProyeccion(10, 0, 800, 600, 1);
    expect(aPantalla(a, 50, 0).x).toBe(aPantalla(b, 50, 0).x);
  });
  it('detecta si algo está a la vista', () => {
    const p = crearProyeccion(0, 0, 800, 600, 1);
    expect(enPantalla(p, 10, 10, 50, 20)).toBe(true);
    expect(enPantalla(p, 900, 10, 50, 20)).toBe(false);
    expect(enPantalla(p, 810, 10, 50, 20, 20)).toBe(true);
  });
});
