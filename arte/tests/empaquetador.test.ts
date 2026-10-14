import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { Lienzo, codificarPng, empaquetar, validarAtlas } from '../src/nucleo';
import type { ItemSprite, Marco } from '../src/nucleo';
import { aleatorio, bloque } from './ayudas';

function sprites(): ItemSprite[] {
  const medidas: Array<[string, number, number, string]> = [
    ['silla', 32, 32, 'tela-gris-2'],
    ['escritorio', 64, 32, 'madera-oscura-2'],
    ['planta', 32, 64, 'planta-2'],
    ['monitor', 32, 32, 'vidrio-1'],
    ['piso', 32, 32, 'madera-clara-3'],
    ['pared', 32, 32, 'pared-calida-2'],
    ['sofa', 96, 48, 'rojo-2'],
    ['mesa', 64, 32, 'madera-clara-2'],
    ['arbol', 64, 96, 'cesped-2'],
    ['lampara', 32, 64, 'tela-calida-2'],
  ];
  return medidas.map(([id, w, h, c]) => ({ id, lienzo: bloque(w, h, c) }));
}

function seCruzan(a: Marco, b: Marco): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

describe('empaquetar', () => {
  it('coloca cada sprite sin solapes y dentro del atlas', () => {
    const { atlas, frames } = empaquetar(sprites());
    const ids = Object.keys(frames);
    expect(ids.sort()).toEqual(sprites().map((s) => s.id).sort());
    for (const id of ids) {
      const m = frames[id] as Marco;
      expect(m.x).toBeGreaterThanOrEqual(0);
      expect(m.y).toBeGreaterThanOrEqual(0);
      expect(m.x + m.w).toBeLessThanOrEqual(atlas.ancho);
      expect(m.y + m.h).toBeLessThanOrEqual(atlas.alto);
    }
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        expect(seCruzan(frames[ids[i] as string] as Marco, frames[ids[j] as string] as Marco), `${ids[i]} y ${ids[j]}`).toBe(false);
      }
    }
  });

  it('el contenido de cada marco es exactamente su sprite', () => {
    const items = sprites();
    const { atlas, frames } = empaquetar(items);
    for (const item of items) {
      const m = frames[item.id] as Marco;
      expect(m.w).toBe(item.lienzo.ancho);
      expect(m.h).toBe(item.lienzo.alto);
      expect(atlas.recortar(m.x, m.y, m.w, m.h).igual(item.lienzo), item.id).toBe(true);
    }
  });

  it('deja relleno transparente alrededor y entre sprites (por defecto 2 px)', () => {
    const { atlas, frames } = empaquetar(sprites());
    expect(validarAtlas(atlas, frames, { relleno: 2 })).toEqual([]);
    // Ningún píxel visible fuera de los marcos.
    const opacosEnMarcos = Object.values(frames).reduce((suma, m) => suma + m.w * m.h, 0);
    expect(atlas.contarOpacos()).toBe(opacosEnMarcos);
  });

  it('con relleno 0 los sprites quedan pegados pero siguen sin solaparse', () => {
    const { atlas, frames } = empaquetar(sprites(), { relleno: 0 });
    expect(validarAtlas(atlas, frames)).toEqual([]);
    const conRelleno = empaquetar(sprites(), { relleno: 4 });
    expect(conRelleno.atlas.ancho * conRelleno.atlas.alto).toBeGreaterThan(atlas.ancho * atlas.alto);
  });

  it('respeta el ancho máximo y abre estantes nuevos cuando hace falta', () => {
    const { atlas, frames } = empaquetar(sprites(), { anchoMax: 160 });
    expect(atlas.ancho).toBeLessThanOrEqual(160);
    const filas = new Set(Object.values(frames).map((m) => m.y));
    expect(filas.size).toBeGreaterThan(1);
    expect(empaquetar(sprites()).atlas.ancho).toBeLessThanOrEqual(1024);
  });

  it('ordena por alto (mayor primero) y luego por id', () => {
    const { frames } = empaquetar(
      [
        { id: 'b', lienzo: bloque(8, 8, '#112233') },
        { id: 'a', lienzo: bloque(8, 8, '#112233') },
        { id: 'z', lienzo: bloque(8, 20, '#112233') },
      ],
      { relleno: 1 },
    );
    expect(frames['z']).toEqual({ x: 1, y: 1, w: 8, h: 20 });
    expect(frames['a']).toEqual({ x: 10, y: 1, w: 8, h: 8 });
    expect(frames['b']).toEqual({ x: 19, y: 1, w: 8, h: 8 });
  });

  it('el orden de entrada no cambia el resultado: mismo atlas, mismos bytes', () => {
    const rnd = aleatorio(42);
    const base = sprites();
    const referencia = empaquetar(base);
    const huella = (a: Lienzo): string => createHash('sha1').update(codificarPng(a)).digest('hex');
    for (let intento = 0; intento < 5; intento++) {
      const mezclados = [...base].sort(() => rnd() - 0.5);
      const otro = empaquetar(mezclados);
      expect(huella(otro.atlas)).toBe(huella(referencia.atlas));
      expect(JSON.stringify(otro.frames)).toBe(JSON.stringify(referencia.frames));
    }
  });

  it('lanza errores claros con ids repetidos o vacíos, sprites que no caben o listas vacías', () => {
    expect(() => empaquetar([])).toThrow(/No hay sprites/);
    expect(() => empaquetar([{ id: 'x', lienzo: bloque(4, 4, '#112233') }, { id: 'x', lienzo: bloque(4, 4, '#112233') }])).toThrow(/repetido/);
    expect(() => empaquetar([{ id: '', lienzo: bloque(4, 4, '#112233') }])).toThrow(/vacío/);
    expect(() => empaquetar([{ id: 'ancho', lienzo: bloque(100, 4, '#112233') }], { anchoMax: 64 })).toThrow(/no cabe/);
    expect(() => empaquetar(sprites(), { relleno: -1 })).toThrow(RangeError);
    expect(() => empaquetar(sprites(), { anchoMax: 0 })).toThrow(RangeError);
  });

  it('un solo sprite da un atlas del tamaño del sprite más el relleno', () => {
    const { atlas, frames } = empaquetar([{ id: 'solo', lienzo: bloque(32, 32, '#112233') }]);
    expect(frames['solo']).toEqual({ x: 2, y: 2, w: 32, h: 32 });
    expect(atlas.ancho).toBe(36);
    expect(atlas.alto).toBe(36);
  });
});
