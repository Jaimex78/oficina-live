import { describe, expect, it } from 'vitest';
import { INVENTARIO, SENTADO_AJUSTES, datosSentado, familiaDeAsiento, type Direccion } from '../src';

const asientos = INVENTARIO.filter((o) => o.interaccion === 'sentarse');
const MIRAS: Direccion[] = ['S', 'N', 'E', 'O'];

describe('datos de sentado por familia y orientación', () => {
  it('hay 60 o más asientos y todos resuelven datos válidos en cada orientación', () => {
    expect(asientos.length).toBeGreaterThanOrEqual(60);
    for (const o of asientos) {
      for (const m of MIRAS) {
        const d = datosSentado(o, m);
        // Con dy entre -4 y 9 los pies siguen dentro de la casilla del asiento (el motor lo busca con `y - 2`).
        expect(d.dy, `${o.id}@${m} dy`).toBeGreaterThanOrEqual(-4);
        expect(d.dy, `${o.id}@${m} dy`).toBeLessThanOrEqual(9);
        expect(Math.abs(d.dx), `${o.id}@${m} dx`).toBeLessThanOrEqual(8);
        if (d.corte) {
          expect(d.corte[1], `${o.id}@${m} corte`).toBeGreaterThanOrEqual(0);
          expect(d.corte[0], `${o.id}@${m} corte`).toBeGreaterThan(d.corte[1]);
        }
        expect(MIRAS).toContain(d.pose);
      }
    }
  });

  it('de espaldas el respaldo se dibuja por delante; de frente, el borde del cojín (salvo puf y taburete, sin corte)', () => {
    for (const o of asientos) {
      const sinFrente = o.orientaciones.length === 1;
      expect(datosSentado(o, 'N').corte !== null, o.id).toBe(!sinFrente);
      if (familiaDeAsiento(o) === 'puf') expect(datosSentado(o, 'S').corte, o.id).toBeNull();
    }
  });

  it('de perfil el personaje usa la pose de perfil de su orientación y los pufs se sientan en el centro', () => {
    for (const o of asientos) {
      if (o.orientaciones.length === 1) {
        expect(datosSentado(o, 'S').dx, o.id).toBe(0);
        continue;
      }
      expect(datosSentado(o, 'E').pose).toBe('E');
      expect(datosSentado(o, 'O').pose).toBe('O');
    }
  });

  it('sofás y butacas son blandos (cojín); sillas de comedor y de oficina no', () => {
    const por = (id: string) => asientos.find((o) => o.id === id)!;
    expect(datosSentado(por('butaca'), 'S').blando).toBe(true);
    expect(datosSentado(por('sofa-3'), 'S').blando).toBe(true);
    expect(datosSentado(por('puff'), 'S').blando).toBe(true);
    expect(datosSentado(por('silla-comedor'), 'E').blando).toBe(false);
    expect(datosSentado(por('silla-oficina'), 'N').blando).toBe(false);
  });

  it('el ajuste de un objeto manda sobre el de su familia, sin tocar el resto', () => {
    const base = asientos.find((o) => o.id === 'butaca')!;
    const ajustado = { ...base, sentado: { S: { dy: 7 } } };
    expect(datosSentado(ajustado, 'S').dy).toBe(7);
    expect(datosSentado(ajustado, 'S').corte).toEqual(datosSentado(base, 'S').corte);
    expect(datosSentado(ajustado, 'N')).toEqual(datosSentado(base, 'N'));
  });

  it('los ajustes por objeto apuntan a ids que existen', () => {
    for (const id of Object.keys(SENTADO_AJUSTES)) expect(INVENTARIO.some((o) => o.id === id), id).toBe(true);
  });
});
