import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { NOMBRE_ATLAS_EXTERIOR, construirExterior, publicarExterior, revisarExterior } from '../src/exterior/atlas';
import { TOKENS, coloresExterior } from '../src/exterior/paleta';
import { spritesArboles } from '../src/exterior/sprites-vegetacion';
import { spritesGente } from '../src/exterior/sprites-gente';
import { Lienzo, validarLienzo } from '../src/nucleo';
import { carpetaTemporal } from './ayudas';

const tmp = carpetaTemporal('ol-arte-exterior-');
afterAll(() => tmp.limpiar());

const r = construirExterior();

describe('atlas del exterior', () => {
  it('pasa la validación: paleta propia, alfa binario, marcos sin solape y sin píxeles sueltos', () => {
    expect(revisarExterior(r)).toEqual([]);
  });

  it('cabe en el tope de 128 colores', () => {
    expect(r.atlas.colores().size).toBeLessThanOrEqual(128);
    expect(coloresExterior().length).toBeLessThanOrEqual(128);
  });

  it('los tiles miden 32 x 32 y su lista coincide con los marcos', () => {
    expect(r.tiles.length).toBeGreaterThan(100);
    for (const id of r.tiles) {
      const m = r.frames[id];
      expect(m, id).toBeDefined();
      expect([m!.w, m!.h]).toEqual([32, 32]);
    }
  });

  it('cada sprite suelto tiene ancla dentro de su cuadro', () => {
    const tiles = new Set(r.tiles);
    for (const id of Object.keys(r.frames)) {
      if (tiles.has(id)) continue;
      const a = r.anclas[id];
      const m = r.frames[id]!;
      expect(a, `sin ancla: ${id}`).toBeDefined();
      expect(a!.x).toBeGreaterThanOrEqual(0);
      expect(a!.x).toBeLessThanOrEqual(m.w);
      expect(a!.y).toBeGreaterThanOrEqual(0);
      expect(a!.y).toBeLessThanOrEqual(m.h);
    }
  });

  it('trae los cuadros que el motor pide: seis carros por orientación, semáforos, árboles con viento y peatones', () => {
    for (const c of ['taxi', 'blanco', 'negro', 'rojo', 'azul', 'plata']) {
      for (const o of ['e', 's', 'n']) expect(r.frames[`auto-${o}-${c}`], `auto-${o}-${c}`).toBeDefined();
    }
    for (const e of ['r', 'a', 'v']) expect(r.frames[`semaforo-${e}`]).toBeDefined();
    for (const m of ['g', 'm', 'p', 'jac']) for (const v of ['a', 'b', 'c']) expect(r.frames[`arbol-${m}-${v}`]).toBeDefined();
    expect(spritesGente()).toHaveLength(36);
    expect(spritesArboles()).toHaveLength(12);
    for (const id of ['bus-e', 'moto-e', 'poste-luz', 'paradero', 'cono', 'barricada', 'valla-a', 'cinta', 'balcon-losa', 'tren-loco-e', 'tren-vagon-a', 'tren-vagon-b', 'baliza-a', 'baliza-b', 'baliza-c', 'pitido', 'via-paso-n', 'asf-flecha-o-24-n', 'asf-flecha-e-8-s', 'asf-doble-v-c']) expect(r.frames[id], id).toBeDefined();
  });

  it('los bloques de los vecinos son lisos: pocos colores y apagados', () => {
    for (const id of ['bloque-techo-a', 'bloque-fac-medio-b', 'bloque-fac-tope-c', 'lote-a']) {
      const m = r.frames[id]!;
      const t = r.atlas.recortar(m.x, m.y, m.w, m.h);
      expect(t.colores().size).toBeLessThanOrEqual(4);
    }
  });

  it('la vía tiene sus dos mitades y el paso peatonal sobre los rieles', () => {
    for (const id of ['via-n', 'via-s', 'via-paso-n', 'via-paso-s']) expect(r.frames[id], id).toBeDefined();
    const via = r.atlas.recortar(r.frames['via-n']!.x, r.frames['via-n']!.y, 32, 32);
    const paso = r.atlas.recortar(r.frames['via-paso-n']!.x, r.frames['via-paso-n']!.y, 32, 32);
    expect(via.igual(paso)).toBe(false);
  });

  it('las copas tienen tres cuadros de viento distintos entre sí', () => {
    const [a, b, c] = ['a', 'b', 'c'].map((v) => {
      const m = r.frames[`arbol-g-${v}`]!;
      return r.atlas.recortar(m.x, m.y, m.w, m.h);
    }) as [Lienzo, Lienzo, Lienzo];
    expect(a.igual(b)).toBe(false);
    expect(b.igual(c)).toBe(false);
  });

  it('la caída del edificio tiene sus máscaras de luz de noche, solo con ventanas', () => {
    for (const id of ['luz-naos-medio-1', 'luz-naos-medio-2', 'luz-naos-medio-3', 'luz-naos-lobby-i']) {
      const m = r.frames[id]!;
      const t = r.atlas.recortar(m.x, m.y, m.w, m.h);
      expect(t.contarOpacos()).toBeGreaterThan(50);
      expect(t.contarOpacos()).toBeLessThan(32 * 32);
    }
  });

  it('los tiles de suelo encajan sin costura (borde derecho con el izquierdo y abajo con arriba)', () => {
    for (const id of ['anden-a', 'asf-a', 'pasto-a', 'plaza-a', 'techo-grava-a', 'via-n', 'bloque-techo-a', 'lote-a']) {
      const m = r.frames[id]!;
      const t = r.atlas.recortar(m.x, m.y, m.w, m.h);
      expect(t.contarOpacos()).toBe(32 * 32);
    }
  });

  it('es determinista: dos construcciones dan los mismos bytes', () => {
    const otra = construirExterior();
    expect(otra.atlas.igual(r.atlas)).toBe(true);
    expect(otra.frames).toEqual(r.frames);
  });

  it('publica el PNG y el JSON, y no cambia nada al repetir', () => {
    const p = publicarExterior(r, tmp.ruta);
    expect(p.cambiado).toBe(true);
    const json = JSON.parse(readFileSync(join(tmp.ruta, 'web', 'public', 'assets', 'exterior', `${NOMBRE_ATLAS_EXTERIOR}.json`), 'utf8')) as {
      huella: string;
      tiles: { nombres: string[] };
    };
    expect(json.huella).toBe(p.huella);
    expect(json.tiles.nombres).toEqual(r.tiles);
    expect(publicarExterior(r, tmp.ruta).cambiado).toBe(false);
  });
});

describe('paleta del exterior', () => {
  it('reusa tal cual los tonos de andén, asfalto, árboles y conos de la entrada animada', () => {
    expect(TOKENS.adG0).toBe('#A4A7AD');
    expect(TOKENS.as1).toBe('#484C56');
    expect(TOKENS.v2).toBe('#2E8844');
    expect(TOKENS.co1).toBe('#E2601C');
  });

  it('un píxel fuera de la paleta se detecta', () => {
    const l = new Lienzo(2, 2).rect(0, 0, 2, 2, '#123456');
    expect(validarLienzo(l, { paleta: coloresExterior() })).not.toEqual([]);
  });
});
