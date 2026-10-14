import { describe, expect, it } from 'vitest';
import { Lienzo, MARCADORES, PALETA, empaquetar, validarAtlas, validarLienzo } from '../src/nucleo';
import { bloque } from './ayudas';

describe('validarLienzo', () => {
  it('un lienzo hecho solo con colores de la paleta no tiene errores', () => {
    const l = new Lienzo(32, 32).rect(0, 0, 32, 16, 'madera-clara-3').rect(0, 16, 32, 16, 'rojo-3');
    expect(validarLienzo(l)).toEqual([]);
    expect(validarLienzo(new Lienzo(32, 32))).toEqual([]);
  });

  it('detecta colores fuera de la paleta, con cantidad y primera posición', () => {
    const l = new Lienzo(8, 8).rect(0, 0, 4, 4, 'rojo-3').px(5, 2, '#123456').px(6, 3, '#123456').px(1, 6, '#ABCDEF');
    const errores = validarLienzo(l);
    expect(errores).toHaveLength(2);
    expect(errores[0]).toContain('#123456');
    expect(errores[0]).toContain('2 píxeles');
    expect(errores[0]).toContain('x=5, y=2');
    expect(errores[1]).toContain('#ABCDEF');
    expect(errores[1]).toContain('1 píxel,');
  });

  it('detecta alfa parcial', () => {
    const l = Lienzo.desdeDatos(2, 1, new Uint8ClampedArray([239, 59, 58, 128, 239, 59, 58, 255]));
    const errores = validarLienzo(l);
    expect(errores).toHaveLength(1);
    expect(errores[0]).toMatch(/Alfa parcial 128/);
    expect(errores[0]).toContain('x=0, y=0');
  });

  it('exige que el tamaño sea múltiplo de lo pedido', () => {
    expect(validarLienzo(new Lienzo(64, 32), { multiplo: { ancho: 32, alto: 32 } })).toEqual([]);
    expect(validarLienzo(new Lienzo(32, 64), { multiplo: { ancho: 32, alto: 32 } })).toEqual([]);
    const mal = validarLienzo(new Lienzo(30, 32), { multiplo: { ancho: 32, alto: 32 } });
    expect(mal).toHaveLength(1);
    expect(mal[0]).toMatch(/30x32.*32x32/);
    expect(validarLienzo(new Lienzo(32, 50), { multiplo: { ancho: 32, alto: 32 } })).toHaveLength(1);
  });

  it('acepta marcadores solo si se pide', () => {
    const l = new Lienzo(4, 4).rect(0, 0, 2, 2, MARCADORES.piel[2]).rect(2, 2, 2, 2, 'rojo-3');
    expect(validarLienzo(l)).toHaveLength(1);
    expect(validarLienzo(l, { permitirMarcadores: true })).toEqual([]);
    // Un color casi marcador sigue siendo un error.
    const casi = new Lienzo(2, 2).px(0, 0, '#FA00C9');
    expect(validarLienzo(casi, { permitirMarcadores: true })).toHaveLength(1);
  });

  it('acepta una paleta propia, sin importar mayúsculas', () => {
    const l = new Lienzo(4, 4).rect(0, 0, 4, 4, '#112233');
    expect(validarLienzo(l)).toHaveLength(1);
    expect(validarLienzo(l, { paleta: ['#112233'] })).toEqual([]);
    expect(validarLienzo(new Lienzo(1, 1).px(0, 0, '#aabbcc'), { paleta: ['#AABBCC'] })).toEqual([]);
    expect(validarLienzo(new Lienzo(1, 1).px(0, 0, 'rojo-3'), { paleta: Object.values(PALETA) })).toEqual([]);
  });

  it('noVacio marca los lienzos sin ningún píxel visible', () => {
    expect(validarLienzo(new Lienzo(4, 4), { noVacio: true })).toEqual(['El lienzo está vacío: no tiene ningún píxel visible.']);
    expect(validarLienzo(new Lienzo(4, 4).px(0, 0, 'rojo-3'), { noVacio: true })).toEqual([]);
  });

  it('junta varios problemas a la vez', () => {
    const l = Lienzo.desdeDatos(3, 1, new Uint8ClampedArray([1, 2, 3, 255, 9, 9, 9, 100, 0, 0, 0, 0]));
    expect(validarLienzo(l, { multiplo: { ancho: 32, alto: 32 } })).toHaveLength(3);
  });
});

describe('validarAtlas', () => {
  const items = [
    { id: 'a', lienzo: bloque(32, 32, 'madera-clara-3') },
    { id: 'b', lienzo: bloque(64, 32, 'planta-2') },
    { id: 'c', lienzo: bloque(32, 64, 'rojo-2') },
  ];

  it('un atlas bien empaquetado pasa, incluso con relleno y múltiplos', () => {
    const { atlas, frames } = empaquetar(items);
    expect(validarAtlas(atlas, frames, { relleno: 2, multiplo: { ancho: 32, alto: 32 } })).toEqual([]);
  });

  it('reporta el id del sprite con el problema', () => {
    const { atlas, frames } = empaquetar(items);
    const m = frames['b'] as { x: number; y: number };
    atlas.px(m.x + 3, m.y + 3, '#123456');
    const errores = validarAtlas(atlas, frames);
    expect(errores).toHaveLength(1);
    expect(errores[0]).toMatch(/^\[b\] Color fuera de la paleta: #123456/);
  });

  it('detecta marcos fuera del atlas, solapes y falta de relleno', () => {
    const atlas = new Lienzo(100, 100);
    const fuera = validarAtlas(atlas, { x: { x: 90, y: 0, w: 32, h: 32 } });
    expect(fuera[0]).toMatch(/\[x\].*fuera del atlas/);
    const solapes = validarAtlas(atlas, { p: { x: 0, y: 0, w: 32, h: 32 }, q: { x: 31, y: 10, w: 32, h: 32 } });
    expect(solapes.join('\n')).toMatch(/\[p\] y \[q\] se solapan/);
    const pegados = validarAtlas(atlas, { p: { x: 2, y: 2, w: 32, h: 32 }, q: { x: 34, y: 2, w: 32, h: 32 } }, { relleno: 2 });
    expect(pegados.join('\n')).toMatch(/\[p\] y \[q\] quedan a menos de 2 px/);
    const bordes = validarAtlas(atlas, { p: { x: 0, y: 0, w: 32, h: 32 } }, { relleno: 2 });
    expect(bordes.join('\n')).toMatch(/\[p\] Queda a menos de 2 px del borde/);
  });

  it('detecta píxeles sueltos fuera de los marcos (sangrado)', () => {
    const { atlas, frames } = empaquetar(items);
    atlas.px(0, 0, 'rojo-3');
    const errores = validarAtlas(atlas, frames);
    expect(errores).toHaveLength(1);
    expect(errores[0]).toMatch(/1 píxel visible fuera de los marcos.*x=0, y=0/);
  });

  it('valida el tamaño de cada marco, no el del atlas completo', () => {
    const { atlas, frames } = empaquetar([{ id: 'raro', lienzo: bloque(30, 32, 'rojo-2') }]);
    const errores = validarAtlas(atlas, frames, { multiplo: { ancho: 32, alto: 32 } });
    expect(errores).toHaveLength(1);
    expect(errores[0]).toMatch(/^\[raro\] Tamaño 30x32/);
  });
});
