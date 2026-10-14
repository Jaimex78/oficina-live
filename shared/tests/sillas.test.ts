import { describe, expect, it } from 'vitest';
import { ConstructorSala, INVENTARIO, colocar, esFallo, esMesaParaSillas, esRedonda, huellaColocada, ladoPegado, objetoPorId, orientacionInicial, pintarPiso, planSillas, salaVacia, sillasAlrededor, sillasDeMesa, arreglarSilla, type LadosSillas, type SalaMapa } from '../src';

function sala(): SalaMapa {
  const celdas: [number, number][] = [];
  for (let y = 0; y < 20; y++) for (let x = 0; x < 24; x++) celdas.push([x, y]);
  const r = pintarPiso(salaVacia('s', 'Sala', 24, 20), celdas, 'piso-madera-clara');
  if (esFallo(r)) throw new Error(r.error);
  return r;
}
const FRENTE = { arriba: 'S', abajo: 'N', izquierda: 'E', derecha: 'O' } as const;
const mesas = INVENTARIO.filter((o) => !o.obsoleto && esMesaParaSillas(o));

describe('sillas alrededor', () => {
  it('hay mesas de los lotes 9 y 10 en las pruebas, con huellas 1x3, 2x3, 3x3 y redondas', () => {
    expect(mesas.length).toBeGreaterThan(40);
    for (const id of ['mesa-simple-3x1', 'mesa-tronco-3x2', 'mesa-conferencia-3x3', 'mesa-redonda-grande', 'mesa-redonda', 'mesa-comedor', 'mesa-reunion-12']) expect(mesas.some((m) => m.id === id), id).toBe(true);
  });

  for (const lados of ['todos', 'largos', 'uno'] as LadosSillas[]) {
    it(`con «${lados}» las sillas quedan pegadas, mirando a la mesa, sin esquinas y simétricas (todas las mesas y orientaciones)`, () => {
      for (const o of mesas) {
        for (const or of o.orientaciones) {
          const base = colocar(sala(), { objeto: o.id, x: 8, y: 8, orientacion: or, sinApoyo: true });
          if (esFallo(base)) throw new Error(`${o.id}@${or}: ${base.error}`);
          const mesa = base.colocacion;
          const r = sillasAlrededor(base.sala, mesa.id, { lados });
          if (esFallo(r)) throw new Error(`${o.id}@${or}: ${r.error}`);
          const h = huellaColocada(o, mesa.x, mesa.y, mesa.orientacion);
          const etiqueta = `${o.id}@${or} ${lados}`;
          expect(r.omitidas, etiqueta).toEqual([]);
          const cx = h.x + h.ancho / 2;
          const cy = h.y + h.alto / 2;
          const claves = new Set(r.puestas.map((c) => `${c.x},${c.y},${c.orientacion}`));
          for (const c of r.puestas) {
            const lado = ladoPegado(h, c.x, c.y);
            expect(lado, `${etiqueta} (${c.x},${c.y}) pegada`).not.toBeNull();
            expect(c.orientacion, `${etiqueta} (${c.x},${c.y}) mira a la mesa`).toBe(FRENTE[lado!]);
          }
          if (lados === 'ninguno') continue;
          // Simetría: la mesa redonda de huella par con «uno» es un molinete (se repite al girar 90 grados); el resto es un espejo.
          const molinete = lados === 'uno' && esRedonda(o) && h.ancho % 2 === 0 && h.alto % 2 === 0;
          for (const c of r.puestas) {
            if (molinete) {
              // Girar 90° (horario) alrededor del centro: (dx, dy) -> (-dy, dx), con el centro de la casilla.
              const dx = c.x + 0.5 - cx;
              const dy = c.y + 0.5 - cy;
              const g = { x: Math.round(cx - dy - 0.5), y: Math.round(cy + dx - 0.5) };
              const dir = { S: 'O', O: 'N', N: 'E', E: 'S' } as const;
              expect(claves.has(`${g.x},${g.y},${dir[c.orientacion as 'S' | 'O' | 'N' | 'E']}`), `${etiqueta} molinete (${c.x},${c.y})`).toBe(true);
            } else if (c.orientacion === 'S' || c.orientacion === 'N') {
              const espejo = Math.round(2 * cx - 1 - c.x);
              expect(claves.has(`${espejo},${c.y},${c.orientacion}`), `${etiqueta} espejo horizontal (${c.x},${c.y})`).toBe(true);
            } else {
              const espejo = Math.round(2 * cy - 1 - c.y);
              expect(claves.has(`${c.x},${espejo},${c.orientacion}`), `${etiqueta} espejo vertical (${c.x},${c.y})`).toBe(true);
            }
          }
        }
      }
    });
  }

  it('«uno»: lado impar una silla al centro; lado par el par central', () => {
    const s = colocar(sala(), { objeto: 'mesa-simple-3x2', x: 8, y: 8, orientacion: 'S', sinApoyo: true });
    if (esFallo(s)) throw new Error(s.error);
    const r = sillasAlrededor(s.sala, s.colocacion.id, { lados: 'uno' });
    if (esFallo(r)) throw new Error(r.error);
    const arriba = r.puestas.filter((c) => c.y === 7);
    expect(arriba.map((c) => c.x)).toEqual([9]);
    const izq = r.puestas.filter((c) => c.x === 7).map((c) => c.y).sort();
    expect(izq).toEqual([8, 9]);
  });

  it('«largos» solo pone sillas en los lados largos', () => {
    const s = colocar(sala(), { objeto: 'mesa-reunion-12', x: 6, y: 8, orientacion: 'S', sinApoyo: true });
    if (esFallo(s)) throw new Error(s.error);
    const r = sillasAlrededor(s.sala, s.colocacion.id, { lados: 'largos' });
    if (esFallo(r)) throw new Error(r.error);
    expect(r.puestas).toHaveLength(12);
    expect(r.puestas.every((c) => c.y === 7 || c.y === 10)).toBe(true);
    expect(esFallo(sillasAlrededor(s.sala, s.colocacion.id, { lados: 'ninguno' }))).toBe(false);
  });

  it('la silla y su color se respetan, y una silla que no existe falla', () => {
    const s = colocar(sala(), { objeto: 'escritorio-3x1', x: 8, y: 8, orientacion: 'S', sinApoyo: true });
    if (esFallo(s)) throw new Error(s.error);
    const r = sillasAlrededor(s.sala, s.colocacion.id, { lados: 'uno', silla: 'silla-ejecutiva', variante: 'negro' });
    if (esFallo(r)) throw new Error(r.error);
    expect(r.puestas.length).toBeGreaterThan(0);
    expect(r.puestas.every((c) => c.objeto === 'silla-ejecutiva' && c.variante === 'negro')).toBe(true);
    expect(esFallo(sillasAlrededor(s.sala, s.colocacion.id, { silla: 'no-existe' }))).toBe(true);
  });

  it('omite casillas con pared, puerta, otro objeto o sin piso, y dice por qué', () => {
    let s = sala();
    const m = colocar(s, { objeto: 'mesa-simple-3x1', x: 8, y: 8, orientacion: 'S', sinApoyo: true });
    if (esFallo(m)) throw new Error(m.error);
    s = m.sala;
    for (const [obj, x, y] of [['pared-lisa', 9, 7], ['planta-grande', 10, 9]] as const) {
      const r = colocar(s, { objeto: obj, x, y, orientacion: orientacionInicial(objetoPorId(obj)!) });
      if (esFallo(r)) throw new Error(`${obj}: ${r.error}`);
      s = r.sala;
    }
    const puerta = colocar(s, { objeto: 'pared-lisa', x: 9, y: 9 });
    if (esFallo(puerta)) throw new Error(puerta.error);
    const plan = planSillas(puerta.sala, m.colocacion);
    if (esFallo(plan)) throw new Error(plan.error);
    // Hay una pared sobre la casilla central de arriba, una planta a la derecha y una pared abajo en el centro.
    expect(plan.omitidas.length).toBeGreaterThanOrEqual(2);
    expect(plan.omitidas.every((o) => o.motivo.length > 5)).toBe(true);
    const puestas = plan.sillas.map((c) => `${c.x},${c.y}`);
    expect(puestas).not.toContain('9,7');
    expect(puestas).not.toContain('9,9');
  });

  it('ConstructorSala.sillasAlrededor deja ids estables y respeta las reglas', () => {
    const b = new ConstructorSala('c', 'C', 14, 10).piso(0, 0, 14, 10, 'piso-madera-clara').poner('mesa-conferencia-3x2', 4, 4, 'S').sillasAlrededor({ lados: 'todos', silla: 'silla-reunion' });
    const sl = b.construir();
    expect(sl.colocaciones.filter((c) => c.objeto === 'silla-reunion')).toHaveLength(10);
    expect(sl.colocaciones.every((c) => /^i\d+$/.test(c.id))).toBe(true);
  });

  it('«sus» sillas se hallan por cercanía y una silla suelta se acerca a la mesa más cercana', () => {
    const m = colocar(sala(), { objeto: 'mesa-comedor', x: 8, y: 8, orientacion: 'S', sinApoyo: true });
    if (esFallo(m)) throw new Error(m.error);
    const r = sillasAlrededor(m.sala, m.colocacion.id, { lados: 'uno' });
    if (esFallo(r)) throw new Error(r.error);
    expect(sillasDeMesa(r.sala, m.colocacion)).toHaveLength(r.puestas.length);
    const lejos = colocar(r.sala, { objeto: 'silla-comedor', x: 14, y: 8, orientacion: 'S' });
    if (esFallo(lejos)) throw new Error(lejos.error);
    expect(sillasDeMesa(lejos.sala, m.colocacion)).toHaveLength(r.puestas.length);
    const fix = arreglarSilla(lejos.sala, lejos.colocacion);
    expect(fix).not.toBeNull();
    const h = huellaColocada(objetoPorId('mesa-comedor')!, 8, 8, 'S');
    expect(ladoPegado(h, fix!.x, fix!.y)).not.toBeNull();
  });
});
