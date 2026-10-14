import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { CASILLA, plantillaNaos } from '@ol/shared';
import { MARGEN_EXTERIOR, geometriaDeSala, llevaCalle } from './geometria';
import { construirPlano, CAIDA } from './plano';
import { Z } from './tipos';

const sala = plantillaNaos().salas[0]!;
const atlas = JSON.parse(readFileSync(fileURLToPath(new URL('../../../public/assets/exterior/exterior-v1.json', import.meta.url)), 'utf8')) as {
  frames: Record<string, unknown>;
  tiles: { nombres: string[] };
  anclas: Record<string, unknown>;
};
const plano = construirPlano(geometriaDeSala(sala));

describe('geometría del exterior', () => {
  it('lee el edificio y el balcón de la sala principal', () => {
    const g = geometriaDeSala(sala);
    expect(g.ed.x1 - g.ed.x0).toBeGreaterThan(30);
    expect(g.balcon).not.toBeNull();
    // El balcón sale por el sureste: pasa del borde este y del borde sur del cuerpo del edificio.
    expect(g.balcon!.x1).toBeGreaterThan(g.ed.x1);
    expect(g.balcon!.y1).toBeGreaterThan(g.ed.y1);
  });

  it('solo la sala principal lleva calle', () => {
    expect(llevaCalle(sala)).toBe(true);
    expect(llevaCalle({ ...sala, id: 'otra' })).toBe(false);
  });

  it('cubre MARGEN_EXTERIOR casillas más allá de cada lado de la sala', () => {
    expect(plano.x0).toBe(-MARGEN_EXTERIOR);
    expect(plano.y0).toBe(-MARGEN_EXTERIOR);
    expect(plano.ancho).toBe(sala.ancho + 2 * MARGEN_EXTERIOR);
    expect(plano.alto).toBe(sala.alto + 2 * MARGEN_EXTERIOR);
  });
});

describe('plano del exterior', () => {
  it('todo tile usado existe en el atlas publicado', () => {
    const tiles = new Set(atlas.tiles.nombres);
    for (const capa of [plano.suelo, plano.detalle, plano.sombra, plano.luz]) {
      for (const id of capa) if (id) expect(tiles.has(id), `falta el tile ${id}`).toBe(true);
    }
  });

  it('todo sprite usado existe en el atlas publicado', () => {
    const usados = new Set<string>(['semaforo-r', 'semaforo-a', 'semaforo-v', 'alcorque', 'bus-e', 'moto-e']);
    for (const p of plano.props) {
      usados.add(p.frame);
      if (p.sombra) usados.add(p.sombra.frame);
    }
    for (const a of plano.arboles) for (const v of ['a', 'b', 'c']) usados.add(`arbol-${a.modelo}-${v}`);
    for (const q of plano.quietos) usados.add(`pers-${q.variante + 1}-s-0`);
    for (const r of plano.rutas) for (const d of ['e', 's', 'n']) for (const p of [0, 1]) usados.add(`pers-${r.variante + 1}-${d}-${p}`);
    for (const id of usados) expect(id in atlas.frames, `falta el cuadro ${id}`).toBe(true);
  });

  it('todas las casillas del suelo tienen tile', () => {
    expect(plano.suelo.every((t) => t !== null)).toBe(true);
  });

  it('las dos calles se cruzan y el andén queda entre el edificio y la Ak 9', () => {
    const g = plano.geo;
    const idx = (cx: number, cy: number) => (cy - plano.y0) * plano.ancho + (cx - plano.x0);
    const baseSur = g.ed.y1 + CAIDA;
    expect(plano.zona[idx(10, baseSur + 1)]).toBe(Z.ANDEN);
    expect(plano.zona[idx(10, g.ed.y1 + 1)]).toBe(Z.EDIFICIO);
    const c = plano.cruce;
    expect(plano.zona[idx(Math.floor((c.x0 + 1) / CASILLA), Math.floor((c.y0 + 1) / CASILLA))]).toBe(Z.CALLE);
    // La calle 102 tiene dos carriles (tres columnas) y se une a la calzada norte, de dos carriles (tres filas).
    expect(c.x1 - c.x0).toBe(3 * CASILLA);
    expect(c.y1 - c.y0).toBe(3 * CASILLA);
  });

  it('la avenida tiene dos calzadas con la vía del tren en medio', () => {
    const idx = (cx: number, cy: number) => (cy - plano.y0) * plano.ancho + (cx - plano.x0);
    const cx = 10;
    const yVia = plano.via.y0 / CASILLA;
    expect(plano.zona[idx(cx, yVia - 1)]).toBe(Z.CALLE);
    expect(plano.zona[idx(cx, yVia)]).toBe(Z.VIA);
    expect(plano.zona[idx(cx, yVia + 1)]).toBe(Z.VIA);
    expect(plano.zona[idx(cx, yVia + 2)]).toBe(Z.CALLE);
    expect(plano.suelo[idx(cx, yVia)]).toBe('via-n');
    expect(plano.suelo[idx(cx, yVia + 1)]).toBe('via-s');
    // El paso peatonal cruza la vía.
    const xPaso = Math.floor(plano.via.xPaso / CASILLA);
    expect(plano.suelo[idx(xPaso, yVia)]).toBe('via-paso-n');
  });

  it('los vecinos son bloques lisos: nada de ventanas encendidas ni equipos fuera del edificio', () => {
    const idx = (cx: number, cy: number) => (cy - plano.y0) * plano.ancho + (cx - plano.x0);
    for (let cy = plano.y0; cy < 0; cy++) for (let cx = plano.x0; cx < plano.x0 + plano.ancho; cx++) expect(plano.luz[idx(cx, cy)]).toBeNull();
    const g = plano.geo;
    for (const p of plano.props) {
      if (!/^(aire|tanque)/.test(p.frame)) continue;
      expect(p.x).toBeGreaterThan(g.ed.x0 * CASILLA);
      expect(p.x).toBeLessThan(g.ed.x1 * CASILLA);
    }
  });

  it('el balcón no cae sobre la calle 102', () => {
    const g = plano.geo;
    expect(plano.cruce.x0).toBeGreaterThan(g.balcon!.x1 * CASILLA);
  });

  it('cada calzada va en su sentido: la norte al oeste y la sur al este', () => {
    const h = plano.carriles.filter((c) => c.eje === 'h');
    expect(h).toHaveLength(4);
    const norte = h.filter((c) => c.fijo < plano.via.y0);
    const sur = h.filter((c) => c.fijo > plano.via.y1);
    expect(norte).toHaveLength(2);
    expect(sur).toHaveLength(2);
    expect(norte.every((c) => c.dir === -1)).toBe(true);
    expect(sur.every((c) => c.dir === 1)).toBe(true);
    // La calle 102 tiene dos carriles, uno por sentido.
    expect(plano.carriles.filter((c) => c.eje === 'v').map((c) => c.dir).sort()).toEqual([-1, 1]);
  });

  it('hay entre 8 y 10 personas que caminan, y unas cruzan por las cebras', () => {
    expect(plano.rutas.length).toBeGreaterThanOrEqual(8);
    expect(plano.rutas.length).toBeLessThanOrEqual(10);
    expect(plano.rutas.filter((r) => r.cruce === 'v').length).toBeGreaterThanOrEqual(1);
    expect(plano.rutas.filter((r) => r.cruce === 'ave').length).toBeGreaterThanOrEqual(1);
    expect(plano.semaforos).toHaveLength(4);
    expect(plano.paraderos).toHaveLength(2);
  });

  it('es determinista: el mismo mapa da el mismo plano', () => {
    const otro = construirPlano(geometriaDeSala(sala));
    expect(otro.suelo).toEqual(plano.suelo);
    expect(otro.props).toEqual(plano.props);
    expect(otro.arboles).toEqual(plano.arboles);
  });

  it('los árboles y objetos quedan dentro del exterior', () => {
    const x0 = plano.x0 * CASILLA;
    const y0 = plano.y0 * CASILLA;
    const x1 = x0 + plano.ancho * CASILLA;
    const y1 = y0 + plano.alto * CASILLA;
    for (const a of plano.arboles) {
      expect(a.x).toBeGreaterThan(x0);
      expect(a.x).toBeLessThan(x1);
      expect(a.y).toBeGreaterThan(y0);
      expect(a.y).toBeLessThan(y1);
    }
  });
});
