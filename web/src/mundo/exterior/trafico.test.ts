import { describe, expect, it } from 'vitest';
import { plantillaNaos } from '@ol/shared';
import { geometriaDeSala } from './geometria';
import { construirPlano } from './plano';
import { DURACION_CICLO, Gente, TREN, Tren, Trafico, estadoSemaforos } from './trafico';

const plano = construirPlano(geometriaDeSala(plantillaNaos().salas[0]!));

describe('semáforos', () => {
  it('nunca dan verde a las dos calles a la vez y el ciclo se repite', () => {
    for (let t = 0; t < DURACION_CICLO * 2; t += 0.1) {
      const e = estadoSemaforos(t);
      expect(e.h === 'verde' && e.v === 'verde').toBe(false);
      const otra = estadoSemaforos(t + DURACION_CICLO);
      expect([otra.h, otra.v, otra.pc, otra.peatones]).toEqual([e.h, e.v, e.pc, e.peatones]);
    }
  });

  it('los peatones solo tienen turno cuando todos los carros están en rojo', () => {
    let hubo = false;
    for (let t = 0; t < DURACION_CICLO; t += 0.1) {
      const e = estadoSemaforos(t);
      if (!e.peatones) continue;
      hubo = true;
      expect(e.h).toBe('rojo');
      expect(e.v).toBe('rojo');
      expect(e.pc).toBe('rojo');
    }
    expect(hubo).toBe(true);
  });
});

describe('tránsito', () => {
  it('ningún carro se monta sobre el de adelante ni pierde su posición', () => {
    const tr = new Trafico(plano.carriles, 3);
    let t = 0;
    for (let i = 0; i < 60 * 150; i++) {
      t += 1 / 60;
      tr.avanzar(1 / 60, t);
      for (const v of tr.vehiculos) expect(Number.isFinite(v.u)).toBe(true);
      for (const c of plano.carriles) {
        const lista = tr.vehiculos.filter((v) => v.carril === c).sort((a, b) => b.u - a.u);
        for (let k = 1; k < lista.length; k++) {
          const delante = lista[k - 1]!;
          const atras = lista[k]!;
          // Solo se compara si el de atrás ya entró: los que reaparecen o se unen empiezan sobre el borde del carril.
          if (atras.u > 8 && delante.u > 8) expect(delante.u - delante.largo / 2).toBeGreaterThanOrEqual(atras.u + atras.largo / 2 - 12);
        }
      }
    }
  });

  it('con luz roja el primero de la fila se detiene antes de la línea', () => {
    const tr = new Trafico(plano.carriles, 5);
    let t = 0;
    let frenado = false;
    for (let i = 0; i < 60 * 90 && !frenado; i++) {
      t += 1 / 60;
      tr.avanzar(1 / 60, t);
      const e = estadoSemaforos(t);
      for (const v of tr.vehiculos) {
        for (const l of v.carril.pares) {
          const uPare = (l.pos - v.carril.inicio) * v.carril.dir;
          if (e[l.senal] === 'rojo' && v.v < 0.5 && Math.abs(v.u + v.largo / 2 - uPare) < 15) frenado = true;
        }
      }
    }
    expect(frenado).toBe(true);
  });

  it('los carros de la calle 102 giran a la avenida y todos los carros siguen existiendo', () => {
    const tr = new Trafico(plano.carriles, 9);
    const total = tr.vehiculos.length;
    let t = 0;
    const lleno = new Set<string>();
    for (let i = 0; i < 60 * 240; i++) {
      t += 1 / 60;
      tr.avanzar(1 / 60, t);
      for (const v of tr.vehiculos) lleno.add(`${v.id}:${v.carril.id}`);
    }
    expect(tr.vehiculos).toHaveLength(total);
    // Algún carro pasó de la calle 102 a la calzada norte.
    const ids = [...lleno];
    const pasaron = tr.vehiculos.filter((v) => ids.includes(`${v.id}:v-sur`) && ids.includes(`${v.id}:h-oeste-ext`));
    expect(pasaron.length).toBeGreaterThan(0);
  });

  it('hay buses y motos en las dos calzadas', () => {
    const tr = new Trafico(plano.carriles, 1);
    for (const tipo of ['bus', 'moto'] as const) {
      const lados = new Set(tr.vehiculos.filter((v) => v.tipo === tipo).map((v) => v.carril.dir));
      expect(lados.has(1) && lados.has(-1)).toBe(true);
    }
  });
});

describe('tren', () => {
  const tren = new Tren(plano.via.xMin, plano.via.xMax);

  it('pasa de vez en cuando y entre pasos la vía queda vacía', () => {
    let presente = 0;
    let vacio = 0;
    for (let t = 0; t < TREN.periodo * 2; t += 1) tren.estado(t).presente ? presente++ : vacio++;
    expect(presente).toBeGreaterThan(20);
    expect(vacio).toBeGreaterThan(40);
    expect(tren.estado(TREN.periodo - 1).presente).toBe(false);
  });

  it('lleva locomotora y 4 vagones, cruza de lado a lado y cada paso va al revés del anterior', () => {
    const a = tren.estado(TREN.inicio + 1);
    expect(a.presente).toBe(true);
    expect(a.unidades).toHaveLength(5);
    expect(a.unidades[0]!.tipo).toBe('loco');
    const b = tren.estado(TREN.periodo + TREN.inicio + 1);
    expect(b.dir).toBe(-a.dir);
    // Al final del paso ya salió del otro lado.
    const f = tren.estado(TREN.inicio + tren.duracion - 0.5);
    expect(f.presente).toBe(true);
    expect(tren.estado(TREN.inicio + tren.duracion + 1).presente).toBe(false);
  });

  it('avisa cuando está cerca de un punto', () => {
    const x = plano.via.xPaso;
    let cerca = false;
    for (let t = 0; t < TREN.periodo; t += 0.5) if (tren.cerca(t, x, 300)) cerca = true;
    expect(cerca).toBe(true);
    expect(tren.cerca(TREN.periodo - 1, x, 300)).toBe(false);
  });
});

describe('peatones', () => {
  it('van y vienen entre sus dos puntos sin salirse', () => {
    const g = new Gente(plano.rutas, 2);
    let t = 0;
    for (let i = 0; i < 60 * 200; i++) {
      t += 1 / 60;
      g.avanzar(1 / 60, { senales: estadoSemaforos(t), trenCerca: false });
    }
    for (const p of g.peatones) {
      expect(p.p).toBeGreaterThanOrEqual(0);
      expect(p.p).toBeLessThanOrEqual(1);
    }
  });

  it('los que cruzan una calle solo salen en el turno de los peatones, con la vía libre', () => {
    const g = new Gente(plano.rutas, 4);
    let t = 0;
    const enCalle = (p: (typeof g.peatones)[number]): boolean => p.p > 0.02 && p.p < 0.98 && Boolean(p.ruta.cruce);
    let cruzaron = 0;
    for (let i = 0; i < 60 * 200; i++) {
      t += 1 / 60;
      const e = estadoSemaforos(t);
      g.avanzar(1 / 60, { senales: e, trenCerca: false });
      for (const p of g.peatones) {
        if (!enCalle(p)) continue;
        cruzaron++;
        // Mientras están a mitad de calle, los carros de esa calle siguen detenidos.
        expect(e.v).toBe('rojo');
        if (p.ruta.cruce === 'ave') expect(e.h).toBe('rojo');
      }
    }
    expect(cruzaron).toBeGreaterThan(0);
  });

  it('no cruzan la avenida si hay un tren cerca del paso', () => {
    const g = new Gente(plano.rutas, 6);
    let t = 0;
    for (let i = 0; i < 60 * 120; i++) {
      t += 1 / 60;
      g.avanzar(1 / 60, { senales: estadoSemaforos(t), trenCerca: true });
    }
    const quietos = g.peatones.filter((p) => p.ruta.cruce === 'ave');
    // Se quedaron en el extremo donde empezaron.
    for (const p of quietos) expect(p.p === 0 || p.p === 1).toBe(true);
  });
});
