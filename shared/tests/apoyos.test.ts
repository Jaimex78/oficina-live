import { describe, expect, it } from 'vitest';
import { CASILLA, INVENTARIO, apoyarSobre, apoyosDe, cajaDe, colocar, esFallo, evaluarColocacion, objetoPorId, pintarPiso, salaVacia, soporteDe, tapaDe, tieneSuperficie, zonaUtil, TOLERANCIA_ARRIBA, esDeFondo, huellaDe, type SalaMapa } from '../src';

function sala(): SalaMapa {
  const celdas: [number, number][] = [];
  for (let y = 0; y < 16; y++) for (let x = 0; x < 24; x++) celdas.push([x, y]);
  const r = pintarPiso(salaVacia('s', 'Sala', 24, 16), celdas, 'piso-madera-clara');
  if (esFallo(r)) throw new Error(r.error);
  return r;
}
const poner = (s: SalaMapa, objeto: string, x: number, y: number, orientacion?: 'S' | 'E' | 'N' | 'O' | 'U', libre = false): SalaMapa => {
  const r = colocar(s, { objeto, x, y, ...(orientacion ? { orientacion } : {}), ...(libre ? { sinApoyo: true } : {}) });
  if (esFallo(r)) throw new Error(`${objeto}: ${r.error}`);
  return r.sala;
};

describe('superficies: tapas', () => {
  const muebles = INVENTARIO.filter((o) => !o.apoyado && !o.montado && !o.pared && tieneSuperficie(o));

  it('hay tapas para escritorios, mesas de los lotes 1 a 13, mesones y cajoneras', () => {
    for (const id of ['escritorio-oficina', 'escritorio-3x1', 'escritorio-3x2', 'mesa-reunion-6', 'mesa-comedor', 'mesa-redonda', 'mesa-conferencia-3x3', 'mesa-tronco-3x2', 'mesa-industrial-3x1', 'meson', 'barra', 'cajonera', 'aparador-moderno', 'comoda', 'gabinete-cocina-grande']) {
      expect(tieneSuperficie(objetoPorId(id)!), id).toBe(true);
    }
    expect(muebles.length).toBeGreaterThan(60);
  });

  it('la tapa de cada orientación cae dentro del dibujo del mueble y tiene tamaño', () => {
    for (const o of muebles) {
      for (const or of o.orientaciones) {
        const t = tapaDe(o, or)!;
        const h = huellaDe(o, or);
        expect(t.w, `${o.id}@${or} ancho`).toBeGreaterThan(8);
        expect(t.h, `${o.id}@${or} alto`).toBeGreaterThan(3);
        expect(t.x, `${o.id}@${or} x`).toBeGreaterThanOrEqual(0);
        expect(t.x + t.w, `${o.id}@${or} derecha`).toBeLessThanOrEqual(h.ancho * CASILLA);
        expect(t.y, `${o.id}@${or} arriba`).toBeGreaterThanOrEqual(-o.sobresale);
        expect(t.y + t.h, `${o.id}@${or} abajo`).toBeLessThanOrEqual(h.alto * CASILLA);
      }
    }
  });

  it('girar un mueble gira su tapa: la huella cambia y el labio sigue abajo', () => {
    const o = objetoPorId('mesa-comedor')!;
    const s = tapaDe(o, 'S')!;
    const e = tapaDe(o, 'E')!;
    expect(s.w).toBeGreaterThan(s.h);
    expect(e.h).toBeGreaterThan(e.w);
    expect(Math.abs(huellaDe(o, 'S').alto * CASILLA - (s.y + s.h) - (huellaDe(o, 'E').alto * CASILLA - (e.y + e.h)))).toBeLessThanOrEqual(3);
  });
});

describe('apoyar objetos', () => {
  it('un apoyado no se puede poner sobre el suelo y explica por qué', () => {
    const s = sala();
    const r = colocar(s, { objeto: 'taza-regular', x: 5, y: 5 });
    expect(esFallo(r) && r.error).toBe('Ponlo sobre una mesa o un escritorio.');
  });

  it('se puede poner sobre una casilla cubierta por la tapa y queda dentro de ella', () => {
    let s = poner(sala(), 'mesa-comedor', 4, 4, 'S');
    s = poner(s, 'pizza', 5, 5);
    const ap = apoyosDe(s).get(s.colocaciones[1]!.id)!;
    const o = objetoPorId('pizza')!;
    const c = cajaDe(o, 'U');
    const t = tapaDe(objetoPorId('mesa-comedor')!, 'S')!;
    const x0 = 5 * CASILLA + c.x + ap.dx;
    const y0 = (5 + 1) * CASILLA - (o.alto * CASILLA + o.sobresale) + c.y + ap.dy;
    expect(x0).toBeGreaterThanOrEqual(4 * CASILLA + t.x);
    expect(x0 + c.w).toBeLessThanOrEqual(4 * CASILLA + t.x + t.w);
    expect(y0).toBeGreaterThanOrEqual(4 * CASILLA + t.y - TOLERANCIA_ARRIBA);
    expect(y0 + c.h).toBeLessThanOrEqual(4 * CASILLA + t.y + t.h);
  });

  it('un jarrón grande no cabe sobre un escritorio angosto pero sí sobre una mesa grande', () => {
    const escritorio = poner(sala(), 'escritorio-oficina', 4, 4, 'S');
    const r = colocar(escritorio, { objeto: 'jarron-meiji', x: 5, y: 4 });
    expect(esFallo(r) && r.error).toBe('No cabe sobre esta mesa.');
    const mesa = poner(sala(), 'mesa-conferencia-3x3', 4, 4, 'S');
    expect(esFallo(colocar(mesa, { objeto: 'jarron-meiji', x: 5, y: 5 }))).toBe(false);
  });

  it('en la casilla vacía junto a la mesa no se puede apoyar nada', () => {
    const s = poner(sala(), 'escritorio-oficina', 4, 4, 'S');
    expect(esFallo(colocar(s, { objeto: 'taza-regular', x: 8, y: 4 }))).toBe(true);
    expect(esFallo(colocar(s, { objeto: 'taza-regular', x: 5, y: 5 }))).toBe(true);
    expect(esFallo(colocar(s, { objeto: 'taza-regular', x: 5, y: 4 }))).toBe(false);
  });

  it('las pantallas y computadores conservan su ancla vertical', () => {
    const s = poner(sala(), 'escritorio-3x1', 4, 4, 'S');
    const o = objetoPorId('monitor')!;
    expect(esDeFondo(o)).toBe(true);
    const r = soporteDe(s, o, 5, 4, 'S');
    expect(r.ok && r.dy).toBe(0);
    const pc = soporteDe(s, objetoPorId('pc-gamer')!, 4, 4, 'S');
    expect(pc.ok).toBe(true);
  });

  it('en un mueble contra la pared, lo apoyado se apoya en el frente y puede subir por detrás', () => {
    const s = poner(sala(), 'meson', 4, 4, 'S');
    expect(esFallo(colocar(s, { objeto: 'cafetera', x: 5, y: 4 }))).toBe(false);
  });

  it('en las mesas redondas se puede apoyar en las casillas de las esquinas, dentro de la elipse', () => {
    const s = poner(sala(), 'mesa-redonda', 4, 4, 'U');
    for (const [x, y] of [[4, 4], [5, 4], [4, 5], [5, 5]] as const) {
      const r = soporteDe(s, objetoPorId('taza-regular')!, x, y, 'U');
      expect(r.ok, `${x},${y}`).toBe(true);
    }
    const t = zonaUtil(tapaDe(objetoPorId('mesa-redonda')!, 'U')!);
    expect(t.w).toBeLessThan(tapaDe(objetoPorId('mesa-redonda')!, 'U')!.w);
  });

  it('todo lo apoyado que cabe queda con su caja entera dentro de la tapa', () => {
    const mesa = objetoPorId('mesa-conferencia-3x3')!;
    const t = zonaUtil(tapaDe(mesa, 'S')!);
    let probados = 0;
    for (const o of INVENTARIO.filter((q) => q.apoyado && !esDeFondo(q))) {
      const or = o.orientaciones[0]!;
      const r = apoyarSobre(o, 4, 4, or, { objeto: mesa, x: 3, y: 3, orientacion: 'S' });
      if (!r.ok) continue;
      probados++;
      const c = cajaDe(o, or);
      const h = huellaDe(o, or);
      const x0 = 4 * CASILLA + c.x + r.dx;
      const y0 = 5 * CASILLA - (h.alto * CASILLA + o.sobresale) + c.y + r.dy;
      expect(x0, o.id).toBeGreaterThanOrEqual(3 * CASILLA + t.x - 1);
      expect(x0 + c.w, o.id).toBeLessThanOrEqual(3 * CASILLA + t.x + t.w + 1);
      expect(y0, o.id).toBeGreaterThanOrEqual(3 * CASILLA + t.y - TOLERANCIA_ARRIBA - 1);
      expect(y0 + c.h, o.id).toBeLessThanOrEqual(3 * CASILLA + t.y + t.h + 1);
    }
    expect(probados).toBeGreaterThan(100);
  });

  it('es determinista y no toca lo guardado: un mapa viejo con apoyados se corrige solo al dibujar', () => {
    let s = poner(sala(), 'mesa-comedor', 4, 4, 'S');
    s = poner(s, 'tabla-quesos', 4, 4, 'U', true);
    s = poner(s, 'taza-regular', 5, 5, 'U', true);
    const antes = JSON.stringify(s.colocaciones);
    const a = apoyosDe(s);
    expect(JSON.stringify(s.colocaciones)).toBe(antes);
    expect([...a.values()].every((v) => typeof v.dx === 'number')).toBe(true);
    const otra = { ...s, colocaciones: [...s.colocaciones] };
    expect(JSON.stringify([...apoyosDe(otra)])).toBe(JSON.stringify([...a]));
  });

  it('un apoyado viejo sin mueble debajo no cambia de lugar (se dibuja donde estaba)', () => {
    const s = poner(sala(), 'taza-regular', 5, 5, 'U', true);
    expect(apoyosDe(s).size).toBe(0);
    expect(evaluarColocacion(s, objetoPorId('taza-regular')!, 7, 7, 'U').ok).toBe(false);
    expect(evaluarColocacion(s, objetoPorId('taza-regular')!, 7, 7, 'U', { sinApoyo: true }).ok).toBe(true);
  });
});
