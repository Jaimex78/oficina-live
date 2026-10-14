import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  FORMULA_MARCADORES,
  Lienzo,
  MARCADORES,
  NOMBRES_TONO,
  PALETA,
  PREVISUALIZACION_MARCADORES,
  SLOTS,
  TONOS_POR_SLOT,
  colorMarcador,
  contarMarcadores,
  distanciaRgb,
  esColorDePaleta,
  esMarcador,
  hexARgb,
  infoMarcador,
  marcadoresJson,
  rampa5,
  recolorearConRampas,
  rutaArte,
  validarLienzo,
} from '../src/nucleo';
import type { Slot } from '../src/nucleo';

describe('tabla de marcadores', () => {
  it('tiene 8 slots con 5 tonos cada uno, en el orden pedido', () => {
    expect([...SLOTS]).toEqual(['piel', 'cabello', 'ropaA', 'ropaB', 'pantalon', 'zapatos', 'accA', 'accB']);
    expect(TONOS_POR_SLOT).toBe(5);
    expect(NOMBRES_TONO).toHaveLength(5);
    for (const slot of SLOTS) expect(MARCADORES[slot], slot).toHaveLength(5);
  });

  it('sigue la fórmula: R = 250, G = 8 x slot, B = 200 + 12 x tono', () => {
    SLOTS.forEach((slot, indiceSlot) => {
      MARCADORES[slot].forEach((hex, tono) => {
        expect(hexARgb(hex)).toEqual([250, 8 * indiceSlot, 200 + 12 * tono]);
      });
    });
  });

  it('los 40 colores son únicos y exactos (mayúsculas)', () => {
    const todos = SLOTS.flatMap((slot) => [...MARCADORES[slot]]);
    expect(todos).toHaveLength(40);
    expect(new Set(todos).size).toBe(40);
    for (const hex of todos) expect(hex).toMatch(/^#[0-9A-F]{6}$/);
  });

  it('ningún marcador se parece a un color de la paleta (distancia RGB mayor a 100)', () => {
    let minima = Infinity;
    for (const slot of SLOTS) {
      for (const marcador of MARCADORES[slot]) {
        expect(esColorDePaleta(marcador)).toBe(false);
        for (const hex of Object.values(PALETA)) minima = Math.min(minima, distanciaRgb(marcador, hex));
      }
    }
    expect(minima).toBeGreaterThan(100);
  });

  it('colorMarcador, esMarcador e infoMarcador se corresponden', () => {
    expect(colorMarcador('piel', 0)).toBe('#FA00C8');
    expect(colorMarcador('accB', 4)).toBe('#FA38F8');
    expect(colorMarcador('ropaA', 2)).toBe('#FA10E0');
    for (const slot of SLOTS) {
      for (let tono = 0; tono < 5; tono++) {
        const hex = colorMarcador(slot, tono);
        expect(esMarcador(hex)).toBe(true);
        expect(infoMarcador(hex)).toEqual({ slot, tono });
      }
    }
    expect(esMarcador('#fa00c8')).toBe(true);
    expect(esMarcador('#EF3B3A')).toBe(false);
    expect(infoMarcador('#123456')).toBeNull();
  });

  it('colorMarcador rechaza slots y tonos que no existen', () => {
    expect(() => colorMarcador('piel', 5)).toThrow(/Tono fuera de rango/);
    expect(() => colorMarcador('piel', -1)).toThrow(/Tono fuera de rango/);
    expect(() => colorMarcador('piel', 1.5)).toThrow(/Tono fuera de rango/);
    expect(() => colorMarcador('bota' as Slot, 0)).toThrow(/Slot desconocido/);
  });

  it('el README documenta la tabla exacta, sin errores de copia', () => {
    const readme = readFileSync(join(rutaArte(), 'README.md'), 'utf8');
    for (const slot of SLOTS) {
      for (const hex of MARCADORES[slot]) expect(readme, `${slot} ${hex}`).toContain(hex);
    }
  });

  it('marcadoresJson entrega la tabla slot a 5 colores, con la forma del contrato de shared', () => {
    const json = marcadoresJson();
    expect(Object.keys(json)).toEqual([...SLOTS]);
    for (const slot of SLOTS) expect(json[slot]).toEqual([...MARCADORES[slot]]);
    // Es JSON puro y un objeto aparte: cambiarlo no altera la tabla original.
    expect(JSON.parse(JSON.stringify(json))).toEqual(json);
    json.piel.push('#000000');
    expect(MARCADORES.piel).toHaveLength(5);
    expect(FORMULA_MARCADORES).toEqual({ r: 250, gPorSlot: 8, bBase: 200, bPorTono: 12 });
  });
});

describe('recolorearConRampas', () => {
  /** Un muñeco mínimo con marcadores de varios slots y un detalle que no se recolorea. */
  function muneco(): Lienzo {
    const l = new Lienzo(8, 8);
    l.rect(1, 0, 6, 2, MARCADORES.cabello[2]);
    l.rect(1, 2, 6, 3, MARCADORES.piel[2]);
    l.px(2, 3, 'tinta'); // un ojo, no se recolorea
    l.rect(1, 5, 6, 2, MARCADORES.ropaA[3]);
    l.px(1, 5, MARCADORES.ropaA[0]);
    l.rect(1, 7, 6, 1, MARCADORES.zapatos[1]);
    return l;
  }

  it('cambia cada marcador por el tono correspondiente de la rampa de su slot', () => {
    const piel = rampa5('#C68642');
    const cabello = rampa5('#3B2519');
    const ropa = rampa5('#4F7AC6');
    const l = recolorearConRampas(muneco(), { piel, cabello, ropaA: ropa });
    expect(l.leerHex(3, 0)).toBe(cabello[2]);
    expect(l.leerHex(3, 2)).toBe(piel[2]);
    expect(l.leerHex(3, 5)).toBe(ropa[3]);
    expect(l.leerHex(1, 5)).toBe(ropa[0]);
  });

  it('deja intactos los colores que no son marcadores y los slots sin rampa', () => {
    const l = recolorearConRampas(muneco(), { piel: rampa5('#C68642') });
    expect(l.leerHex(2, 3)).toBe('#0A0A0A');
    expect(l.leerHex(3, 0)).toBe(MARCADORES.cabello[2]);
    expect(l.leerHex(3, 7)).toBe(MARCADORES.zapatos[1]);
    expect(contarMarcadores(l)).toBeGreaterThan(0);
  });

  it('con todas las rampas no queda ningún marcador y el resultado pasa la validación de paleta', () => {
    const todas = Object.fromEntries(SLOTS.map((slot) => [slot, rampa5('#7A4B33')])) as Record<Slot, ReturnType<typeof rampa5>>;
    const l = recolorearConRampas(muneco(), todas);
    expect(contarMarcadores(l)).toBe(0);
    const permitidos = [...Object.values(PALETA), ...SLOTS.flatMap(() => [...rampa5('#7A4B33')])];
    expect(validarLienzo(l, { paleta: permitidos })).toEqual([]);
  });

  it('no modifica el lienzo original y conserva la forma exacta', () => {
    const original = muneco();
    const huella = original.huella();
    const l = recolorearConRampas(original, { piel: rampa5('#F1C27D') });
    expect(original.huella()).toBe(huella);
    expect(l.cajaOpaca()).toEqual(original.cajaOpaca());
    expect(l.contarOpacos()).toBe(original.contarOpacos());
  });

  it('el mismo arte con distintas rampas da personajes distintos de la misma silueta', () => {
    const a = recolorearConRampas(muneco(), { piel: rampa5('#F1C27D'), cabello: rampa5('#1F1410') });
    const b = recolorearConRampas(muneco(), { piel: rampa5('#8D5524'), cabello: rampa5('#C9A24B') });
    expect(a.huella()).not.toBe(b.huella());
    expect(a.cajaOpaca()).toEqual(b.cajaOpaca());
  });

  it('valida las rampas: deben tener 5 tonos y el slot debe existir', () => {
    expect(() => recolorearConRampas(muneco(), { piel: ['#112233', '#445566'] })).toThrow(/5 tonos/);
    expect(() => recolorearConRampas(muneco(), { bota: rampa5('#112233') } as never)).toThrow(/Slot desconocido/);
    expect(() => recolorearConRampas(muneco(), { piel: ['#1', '#2', '#3', '#4', '#5'] })).toThrow(/inválido/);
  });

  it('contarMarcadores cuenta píxeles marcador y la vista previa los hace reconocibles', () => {
    // 12 de cabello, 17 de piel (un píxel es el ojo), 12 de ropa y 6 de zapatos.
    expect(contarMarcadores(muneco())).toBe(12 + 17 + 12 + 6);
    const vista = recolorearConRampas(muneco(), PREVISUALIZACION_MARCADORES);
    expect(contarMarcadores(vista)).toBe(0);
    for (const slot of SLOTS) expect(PREVISUALIZACION_MARCADORES[slot]).toHaveLength(5);
  });
});
