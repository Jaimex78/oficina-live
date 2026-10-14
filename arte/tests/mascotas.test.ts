import { describe, expect, it } from 'vitest';
import { DIRECCIONES_PERSONAJE, validarMascota } from '@ol/shared';
import type { CatalogoMascotas } from '@ol/shared';
import { empaquetar, infoMarcador, validarAtlas } from '../src/nucleo';
import type { Lienzo } from '../src/nucleo';
import { construirMascotas, idCuadro, recolorear } from '../src/mascota/index';
import { VARIANTES } from '../src/mascota/colores';

const m = construirMascotas();

const cajaDe = (l: Lienzo): { x0: number; y0: number; x1: number; y1: number } => {
  const c = l.cajaOpaca();
  if (!c) throw new Error('cuadro vacío');
  return { x0: c.x, y0: c.y, x1: c.x + c.w - 1, y1: c.y + c.h - 1 };
};

describe('mascotas v1', () => {
  it('son 12 criaturas con 4 direcciones por 4 cuadros y 3 colores', () => {
    expect(m.mascotas).toHaveLength(12);
    expect(new Set(m.mascotas.map((x) => x.id)).size).toBe(12);
    for (const d of m.mascotas) {
      expect(d.variantes).toHaveLength(3);
      for (const dir of DIRECCIONES_PERSONAJE) expect(d.frames[dir]).toHaveLength(4);
    }
    expect(m.items).toHaveLength(12 * 16);
  });

  it('el atlas pasa la validación: paleta y marcadores, alfa 0 o 255, cuadros de 32x32', () => {
    const { atlas, frames } = empaquetar(m.items, { anchoMax: 1024, relleno: 2 });
    expect(validarAtlas(atlas, frames, { permitirMarcadores: true, multiplo: { ancho: 32, alto: 32 }, relleno: 2 })).toEqual([]);
  });

  it('cada cuadro cabe en 24x24 centrado y los pies quedan abajo (las flotantes, a lo sumo 4 filas arriba)', () => {
    for (const [id, l] of m.lienzos) {
      const c = cajaDe(l);
      expect(c.x0, id).toBeGreaterThanOrEqual(4);
      expect(c.x1, id).toBeLessThanOrEqual(27);
      expect(c.y0, id).toBeGreaterThanOrEqual(8);
      expect(c.y1, id).toBeLessThanOrEqual(31);
      const flota = /^(nube|fantasmita)@/.test(id);
      expect(c.y1, id).toBeGreaterThanOrEqual(flota ? 27 : 31);
    }
  });

  it('el contorno es casi negro: el borde de cada figura usa el tono 0 o un color fijo', () => {
    for (const [id, l] of m.lienzos) {
      const c = cajaDe(l);
      // La primera fila de la figura (arriba) es contorno: marcador de tono 0 o un color fijo.
      for (let x = c.x0; x <= c.x1; x++) {
        const hex = l.leerHex(x, c.y0);
        if (hex === null) continue;
        const info = infoMarcador(hex);
        expect(info === null || info.tono === 0, `${id} ${x},${c.y0} ${hex}`).toBe(true);
      }
    }
  });

  it('O es el espejo exacto de E', () => {
    for (const d of m.mascotas) {
      for (const c of [0, 1, 2, 3]) {
        const e = m.lienzos.get(idCuadro(d.id, 'E', c)) as Lienzo;
        const o = m.lienzos.get(idCuadro(d.id, 'O', c)) as Lienzo;
        expect(o.igual(e.voltearH())).toBe(true);
      }
    }
  });

  it('caminar se mueve (cuadros 1 y 2 distintos del quieto) y sentada es otra postura', () => {
    for (const d of m.mascotas) {
      for (const dir of ['S', 'E'] as const) {
        const q = m.lienzos.get(idCuadro(d.id, dir, 0)) as Lienzo;
        for (const c of [1, 2, 3]) expect((m.lienzos.get(idCuadro(d.id, dir, c)) as Lienzo).igual(q), `${d.id} ${dir}${c}`).toBe(false);
      }
    }
  });

  it('los colores recolorean sin dejar marcadores ni cambiar la silueta', () => {
    for (const d of m.mascotas) {
      const base = m.lienzos.get(idCuadro(d.id, 'S', 0)) as Lienzo;
      const huellas = new Set<string>();
      for (const v of d.variantes) {
        const r = recolorear(base, v);
        for (const [hex] of r.colores()) expect(infoMarcador(hex), `${d.id}/${v.id} ${hex}`).toBeNull();
        expect(r.contarOpacos()).toBe(base.contarOpacos());
        huellas.add(r.huella());
      }
      expect(huellas.size, d.id).toBe(3);
    }
  });

  it('cada especie tiene sus variantes definidas y no hay colores sin especie', () => {
    expect(Object.keys(VARIANTES).sort()).toEqual(m.mascotas.map((x) => x.id).sort());
  });

  it('es determinista', () => {
    const otra = construirMascotas();
    for (const [id, l] of m.lienzos) expect((otra.lienzos.get(id) as Lienzo).igual(l)).toBe(true);
  });

  it('validarMascota acepta las del catálogo y rechaza lo demás', () => {
    const cat = { mascotas: m.mascotas } as unknown as CatalogoMascotas;
    expect(validarMascota({ id: 'gato', color: 'naranja' }, cat)).toBeNull();
    expect(validarMascota({ id: 'gato', color: 'naranja', nombre: 'Michi' }, cat)).toBeNull();
    expect(validarMascota({ id: 'dragon', color: 'verde' }, cat)).not.toBeNull();
    expect(validarMascota({ id: 'gato', color: 'azul' }, cat)).not.toBeNull();
    expect(validarMascota({ id: 'gato', color: 'naranja', nombre: 'x'.repeat(40) }, cat)).not.toBeNull();
  });
});
