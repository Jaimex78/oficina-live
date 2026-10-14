import { describe, expect, it } from 'vitest';
import { escalaDeAparicion, opacidadDeReaccion } from './animacion-reaccion';

describe('animación de las reacciones', () => {
  it('salta al aparecer: empieza chica, pasa de su tamaño y se asienta en 1', () => {
    expect(escalaDeAparicion(0)).toBeCloseTo(0.5);
    expect(escalaDeAparicion(0.15)).toBeCloseTo(1.2);
    expect(escalaDeAparicion(0.3)).toBeCloseTo(1);
    expect(escalaDeAparicion(0.9)).toBe(1);
  });
  it('se ve entera hasta casi el final y se apaga sin saltos', () => {
    expect(opacidadDeReaccion(0)).toBe(1);
    expect(opacidadDeReaccion(0.65)).toBe(1);
    expect(opacidadDeReaccion(0.825)).toBeCloseTo(0.5);
    expect(opacidadDeReaccion(1)).toBe(0);
    expect(opacidadDeReaccion(2)).toBe(0);
  });
});
