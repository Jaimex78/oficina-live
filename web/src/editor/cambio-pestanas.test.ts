import { afterEach, describe, expect, it } from 'vitest';
import { esFallo, pintarPiso, salaVacia, type MapaOficina } from '@ol/shared';
import { crearAlmacen } from '../mundo/almacen';
import type { EventoPuntero } from '../mundo/puente';
import { ESTADO_INICIAL, type EstadoMundo } from '../mundo/tipos';
import { ControladorEditor } from './controlador';
import { PESTANA_DE_HERRAMIENTA, prepararCambioDePestana, type Pestana } from './pestanas';

const base = (): MapaOficina => {
  const vacia = salaVacia('principal', 'Prueba', 24, 16);
  const celdas: [number, number][] = [];
  for (let y = 0; y < 12; y++) for (let x = 0; x < 20; x++) celdas.push([x, y]);
  const r = pintarPiso(vacia, celdas, 'piso-madera-clara');
  if (esFallo(r)) throw new Error(r.error);
  return { version: 1, nombre: 'Prueba', salaInicial: 'principal', salas: [{ ...r, llegadas: [{ x: 2, y: 2 }] }] };
};
const ev = (tipo: EventoPuntero['tipo'], x: number, y: number): EventoPuntero => ({ tipo, x, y, px: x * 32 + 16, py: y * 32 + 16, boton: 0, shift: false, ctrl: false, alt: false });

const PESTANAS: Pestana[] = ['salas', 'objetos', 'pisos', 'zonas', 'areas', 'llegadas', 'revision'];
/** Cómo se llega a cada pestaña con su herramienta y se deja algo a medias. */
const EMPEZAR: Record<string, (c: ControladorEditor) => void> = {
  objetos: (c) => {
    c.elegirObjeto('mesa-reunion-4');
    c.puntero(ev('mover', 5, 5));
  },
  pisos: (c) => {
    c.elegirPiso('piso-baldosa');
    c.puntero(ev('mover', 3, 3));
    c.puntero(ev('abajo', 3, 3));
    c.puntero(ev('mover', 6, 3));
  },
  zonas: (c) => {
    c.elegirHerramienta('zona');
    c.puntero(ev('abajo', 3, 3));
    c.puntero(ev('mover', 6, 6));
  },
  areas: (c) => {
    c.elegirHerramienta('area');
    c.puntero(ev('abajo', 3, 3));
    c.puntero(ev('mover', 6, 6));
  },
  llegadas: (c) => {
    c.elegirHerramienta('llegada');
    c.puntero(ev('mover', 4, 4));
  },
  salas: (c) => {
    c.elegirHerramienta('habitacion');
    c.puntero(ev('abajo', 3, 3));
    c.puntero(ev('mover', 8, 8));
  },
  revision: () => {},
};

const controladores: ControladorEditor[] = [];
afterEach(() => {
  for (const c of controladores.splice(0)) c.destruir();
});
const nuevo = () => {
  const almacen = crearAlmacen<EstadoMundo>({ ...ESTADO_INICIAL });
  const ctl = new ControladorEditor({ almacen, mapa: base(), esperaRevision: 5 });
  controladores.push(ctl);
  return { ctl, almacen };
};

describe('cambiar de pestaña con algo a medias', () => {
  for (const de of PESTANAS) {
    for (const a of PESTANAS) {
      if (de === a) continue;
      it(`de ${de} a ${a} siempre se puede y no deja nada colgado`, () => {
        const { ctl, almacen } = nuevo();
        EMPEZAR[de]?.(ctl);
        prepararCambioDePestana(ctl, a);
        const e = almacen.get();
        expect(ctl.hayAccionEnCurso).toBe(false);
        expect(e.zonaEnCurso).toBeNull();
        expect(e.fantasma).toBeNull();
        expect(e.vistaPrevia).toBeNull();
        const propia = PESTANA_DE_HERRAMIENTA[e.herramienta];
        expect(propia === undefined || propia === a).toBe(true);
        // El puntero ya no arrastra nada de lo anterior.
        const antes = JSON.stringify(ctl.sala);
        ctl.puntero(ev('mover', 9, 9));
        ctl.puntero(ev('arriba', 9, 9));
        expect(JSON.stringify(ctl.sala)).toBe(antes);
      });
    }
  }

  it('lo pintado antes de cambiar de pestaña se queda y se deshace de una vez', () => {
    const { ctl } = nuevo();
    EMPEZAR.pisos?.(ctl);
    const pintada = JSON.stringify(ctl.sala.piso);
    prepararCambioDePestana(ctl, 'zonas');
    expect(JSON.stringify(ctl.sala.piso)).toBe(pintada);
    ctl.deshacer();
    expect(JSON.stringify(ctl.sala.piso)).not.toBe(pintada);
  });

  it('un rectángulo de zona sin terminar no crea nada', () => {
    const { ctl } = nuevo();
    EMPEZAR.zonas?.(ctl);
    prepararCambioDePestana(ctl, 'pisos');
    expect(ctl.sala.zonas).toHaveLength(0);
  });
});

describe('Esc', () => {
  it('cancela el rectángulo en curso y deja la herramienta; un segundo Esc la suelta', () => {
    const { ctl, almacen } = nuevo();
    EMPEZAR.zonas?.(ctl);
    expect(almacen.get().zonaEnCurso).not.toBeNull();
    ctl.cancelar();
    expect(almacen.get().zonaEnCurso).toBeNull();
    expect(almacen.get().herramienta).toBe('zona');
    ctl.puntero(ev('arriba', 6, 6));
    expect(ctl.sala.zonas).toHaveLength(0);
    ctl.cancelar();
    expect(almacen.get().herramienta).toBe('seleccionar');
  });

  it('cancela un trazo de piso a medias y devuelve el piso de antes', () => {
    const { ctl } = nuevo();
    const antes = JSON.stringify(ctl.sala);
    EMPEZAR.pisos?.(ctl);
    expect(JSON.stringify(ctl.sala)).not.toBe(antes);
    ctl.cancelar();
    expect(JSON.stringify(ctl.sala)).toBe(antes);
    expect(ctl.hayAccionEnCurso).toBe(false);
  });
});

describe('puntero soltado fuera', () => {
  it('soltarPuntero cierra el gesto como si se soltara', () => {
    const { ctl, almacen } = nuevo();
    EMPEZAR.zonas?.(ctl);
    ctl.soltarPuntero();
    expect(ctl.hayAccionEnCurso).toBe(false);
    expect(almacen.get().zonaEnCurso).toBeNull();
  });
});
