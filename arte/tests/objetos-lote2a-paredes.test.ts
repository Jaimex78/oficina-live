import { describe, expect, it } from 'vitest';
import { MASCARAS_PARED } from '@ol/shared';
import type { Lienzo } from '../src/nucleo';
import { muroLiso, muroVidrio, TALLO_X0, TALLO_X1 } from '../src/objetos/l1-paredes';
import { arcoS, arcoVertical, ascensorS, ascensorVertical, divisorBajo, puertaVidrioS, puertaVidrioVertical, DIVISOR_ALTO, DIVISOR_ANCHO, DIVISOR_TALLO_X0, DIVISOR_TALLO_X1 } from '../src/objetos/l2a-paredes';
import { dibujoEscalera } from '../src/objetos/l2a-escalera';
import { diferenciasEntreColumnas } from './ayudas';

/** Filas de `a` y de `b` entre `y0` y `y1` (sin incluir `y1`), desde la columna `xb` de `b`. */
function filasIguales(a: Lienzo, b: Lienzo, xb: number, y0: number, y1: number): boolean {
  for (let y = y0; y < y1; y++) for (let x = 0; x < a.ancho; x++) if (a.leerHex(x, y) !== b.leerHex(x + xb, y)) return false;
  return true;
}

describe('lote 2A: las piezas de pared encajan con las del lote 1', () => {
  it('el arco y el ascensor tienen la misma tapa y cara de arriba que dos paredes lisas contiguas (filas 0 a 15)', () => {
    const liso = muroLiso('0101');
    for (const pieza of [arcoS(), ascensorS()]) {
      expect([pieza.ancho, pieza.alto]).toEqual([64, 64]);
      expect(filasIguales(liso, pieza, 0, 0, 16)).toBe(true);
      expect(filasIguales(liso, pieza, 32, 0, 16)).toBe(true);
    }
  });

  it('la puerta de vidrio tiene la misma tapa que la pared de vidrio (filas 0 a 14: el contorno de la jamba empieza en la 15)', () => {
    expect(filasIguales(muroVidrio('0101'), puertaVidrioS(), 0, 0, 15)).toBe(true);
  });

  it('en tramo vertical, arco, ascensor y puerta de vidrio dibujan la franja en las columnas del tallo del lote 1', () => {
    for (const [pieza, filas] of [[arcoVertical(), 64], [ascensorVertical(), 64], [puertaVidrioVertical(), 32]] as const) {
      const caja = pieza.cajaOpaca();
      expect(caja).not.toBeNull();
      expect(caja?.x).toBeGreaterThanOrEqual(TALLO_X0 - 1);
      expect((caja?.x ?? 0) + (caja?.w ?? 0)).toBeLessThanOrEqual(TALLO_X1 + 1);
      expect(caja?.y).toBe(0);
      expect(caja?.h).toBeLessThanOrEqual(filas + 1); // +1: el contorno de la franja
    }
  });

  it('el hueco del arco deja ver el piso: transparente en el centro, de la clave al suelo', () => {
    const arco = arcoS();
    for (const y of [28, 40, 55, 62]) expect(arco.esOpaco(31, y), `y=${y}`).toBe(false);
    expect(arco.esOpaco(4, 40)).toBe(true); // la pared a los lados sigue
  });

  it('el ascensor tiene sus dos puertas cerradas: opaco de lado a lado dentro del marco', () => {
    const a = ascensorS();
    for (const x of [14, 28, 36, 50]) expect(a.esOpaco(x, 40), `x=${x}`).toBe(true);
  });
});

describe('lote 2A: divisor bajo', () => {
  it('son 16 piezas de 32 x 40 y todas las máscaras salen de las de las paredes', () => {
    expect(MASCARAS_PARED).toHaveLength(16);
    for (const m of MASCARAS_PARED) {
      const l = divisorBajo(m);
      expect([l.ancho, l.alto], m).toEqual([DIVISOR_ANCHO, DIVISOR_ALTO]);
      expect(l.contarOpacos(), m).toBeGreaterThan(0);
    }
  });

  it('un tramo horizontal (0101) repite a lo ancho sin costura: la unión de los bordes opuestos empata como cualquier columna vecina', () => {
    const l = divisorBajo('0101');
    let maximo = 0;
    for (let x = 0; x < DIVISOR_ANCHO - 1; x++) maximo = Math.max(maximo, diferenciasEntreColumnas(l, x, x + 1));
    expect(diferenciasEntreColumnas(l, DIVISOR_ANCHO - 1, 0)).toBeLessThanOrEqual(maximo);
  });

  it('un tramo vertical (1010) es una franja de tapa de 6 px en el centro y llega al borde de arriba y de abajo del tallo', () => {
    const l = divisorBajo('1010');
    expect(l.esOpaco(DIVISOR_TALLO_X0, 0)).toBe(true);
    expect(l.esOpaco(DIVISOR_TALLO_X1 - 1, 31)).toBe(true);
    expect(l.esOpaco(DIVISOR_TALLO_X0 - 3, 20)).toBe(false);
    expect(l.esOpaco(DIVISOR_TALLO_X1 + 3, 20)).toBe(false);
  });

  it('los extremos libres no llegan al borde del cuadro y las uniones sí', () => {
    expect(divisorBajo('0000').esOpaco(0, 25)).toBe(false);
    expect(divisorBajo('0101').esOpaco(0, 25)).toBe(true);
    expect(divisorBajo('0101').esOpaco(DIVISOR_ANCHO - 1, 25)).toBe(true);
  });
});

describe('lote 2A: escalera', () => {
  it('mide 64 x 80, alterna huellas de madera y contrahuellas blancas y deja el piso libre a los lados', () => {
    const l = dibujoEscalera().vistas.U as Lienzo;
    expect([l.ancho, l.alto]).toEqual([64, 80]);
    expect(l.esOpaco(32, 70)).toBe(true);
    expect(l.esOpaco(32, 30)).toBe(true);
    expect(l.esOpaco(0, 40)).toBe(false);
  });
});
