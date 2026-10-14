import { describe, expect, it } from 'vitest';
import { construirCatalogo } from '../src/personaje/catalogo';
import { PREMIUM } from '../src/personaje/premium';

const { meta } = construirCatalogo();
const acc = (carpeta: string) => meta.accesorios.filter((a) => a.carpeta === carpeta);
const libres = (l: { premium?: boolean }[]): number => l.filter((p) => p.premium !== true).length / l.length;

describe('ropa premium', () => {
  it('lo básico es libre: cabello, vello, arriba, abajo y zapatos no llevan marca', () => {
    for (const lista of [meta.peinados, meta.barbas, meta.arriba, meta.abajo, meta.zapatos, meta.cuerpos]) for (const p of lista) expect(p.premium, p.id).toBeUndefined();
  });

  it('cerca del 60 % de chaquetas, sombreros, gafas y «Otro» es libre (50 a 60 % con 4 o 5 piezas)', () => {
    for (const lista of [meta.chaquetas, acc('sombrero'), acc('gafas'), acc('otro')]) {
      expect(libres(lista)).toBeGreaterThanOrEqual(0.5);
      expect(libres(lista)).toBeLessThanOrEqual(0.65);
    }
  });

  it('capas, alas y lo llamativo es premium, y todos los ids de la lista existen', () => {
    const premium = new Set([...meta.chaquetas, ...meta.accesorios].filter((p) => p.premium).map((p) => p.id));
    for (const id of ['acc-capa', 'chaqueta-abrigo', 'acc-gafas-sin-marco']) expect(premium.has(id), id).toBe(true);
    expect([...PREMIUM].filter((id) => !premium.has(id))).toEqual([]);
    expect(premium.size).toBe(PREMIUM.size);
  });
});
