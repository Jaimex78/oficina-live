import { describe, expect, it, vi } from 'vitest';
import { mapaVacio, type MapaOficina } from '@ol/shared';
import { crearAlmacen } from '../mundo/almacen';
import { ESTADO_INICIAL, type EstadoMundo } from '../mundo/tipos';
import { Autoguardado } from './autoguardado';

const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));

function montar(guardar: (rev: number | null, mapa: MapaOficina) => Promise<{ revision: number }>, revisionInicial: number | null = null) {
  const almacen = crearAlmacen<EstadoMundo>({ ...ESTADO_INICIAL });
  const g = vi.fn(guardar);
  const auto = new Autoguardado({ almacen, revisionInicial, guardar: g, espera: 10, reintento: 20 });
  return { almacen, g, auto };
}

describe('Autoguardado', () => {
  it('junta varios cambios seguidos en un solo guardado', async () => {
    const { auto, g, almacen } = montar(async (rev) => ({ revision: (rev ?? 0) + 1 }));
    auto.programar(mapaVacio('a'));
    auto.programar(mapaVacio('b'));
    auto.programar(mapaVacio('c'));
    expect(almacen.get().guardado).toBe('pendiente');
    await espera(40);
    expect(g).toHaveBeenCalledTimes(1);
    expect(g.mock.calls[0]?.[1]).toMatchObject({ nombre: 'c' });
    expect(almacen.get().guardado).toBe('guardado');
    expect(auto.revisionActual).toBe(1);
  });

  it('un cambio durante un guardado se guarda después, sin perderse y sin guardar a la vez', async () => {
    let enCurso = 0;
    let maximo = 0;
    const { auto, g } = montar(async (rev) => {
      enCurso++;
      maximo = Math.max(maximo, enCurso);
      await espera(30);
      enCurso--;
      return { revision: (rev ?? 0) + 1 };
    });
    auto.programar(mapaVacio('uno'));
    await espera(25);
    auto.programar(mapaVacio('dos'));
    await espera(150);
    expect(g).toHaveBeenCalledTimes(2);
    expect(maximo).toBe(1);
    expect(g.mock.calls[1]?.[0]).toBe(1);
    expect(g.mock.calls[1]?.[1]).toMatchObject({ nombre: 'dos' });
  });

  it('ahora() espera a que termine el guardado', async () => {
    const { auto, almacen } = montar(async () => {
      await espera(20);
      return { revision: 7 };
    });
    auto.programar(mapaVacio());
    await auto.ahora();
    expect(almacen.get().guardado).toBe('guardado');
    expect(auto.hayPendiente).toBe(false);
  });

  it('un choque de revisiones detiene el guardado y lo avisa', async () => {
    const { auto, g, almacen } = montar(async () => {
      throw Object.assign(new Error('choque'), { estado: 409 });
    }, 3);
    auto.programar(mapaVacio());
    await espera(40);
    expect(almacen.get().guardado).toBe('conflicto');
    auto.programar(mapaVacio('otro'));
    await espera(40);
    expect(g).toHaveBeenCalledTimes(1);
  });

  it('si falla la conexión reintenta con lo último', async () => {
    let n = 0;
    const { auto, g, almacen } = montar(async () => {
      n++;
      if (n === 1) throw new Error('sin red');
      return { revision: 1 };
    });
    auto.programar(mapaVacio('x'));
    await espera(20);
    expect(almacen.get().guardado).toBe('error');
    await espera(60);
    expect(g.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(almacen.get().guardado).toBe('guardado');
  });
});
