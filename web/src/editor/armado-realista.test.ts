import { afterEach, describe, expect, it } from 'vitest';
import { esFallo, pintarPiso, salaVacia, validarMapa, type MapaOficina } from '@ol/shared';
import { crearAlmacen } from '../mundo/almacen';
import type { EventoPuntero } from '../mundo/puente';
import { ESTADO_INICIAL, type EstadoMundo } from '../mundo/tipos';
import { ControladorEditor } from './controlador';

const base = (): MapaOficina => {
  const vacia = salaVacia('principal', 'Prueba', 24, 16);
  const celdas: [number, number][] = [];
  for (let y = 0; y < 16; y++) for (let x = 0; x < 24; x++) celdas.push([x, y]);
  const r = pintarPiso(vacia, celdas, 'piso-madera-clara');
  if (esFallo(r)) throw new Error(r.error);
  return { version: 1, nombre: 'Prueba', salaInicial: 'principal', salas: [{ ...r, llegadas: [{ x: 2, y: 2 }] }] };
};
const ev = (tipo: EventoPuntero['tipo'], x: number, y: number): EventoPuntero => ({ tipo, x, y, px: x * 32 + 16, py: y * 32 + 16, boton: 0, shift: false, ctrl: false, alt: false });

const controladores: ControladorEditor[] = [];
afterEach(() => {
  for (const c of controladores.splice(0)) c.destruir();
});
function nuevo() {
  const almacen = crearAlmacen<EstadoMundo>({ ...ESTADO_INICIAL });
  const avisos: { texto: string; tipo: string }[] = [];
  const ctl = new ControladorEditor({ almacen, mapa: base(), aviso: (texto, tipo) => avisos.push({ texto, tipo }), esperaRevision: 1 });
  controladores.push(ctl);
  const click = (x: number, y: number) => {
    ctl.puntero(ev('mover', x, y));
    ctl.puntero(ev('abajo', x, y));
    ctl.puntero(ev('arriba', x, y));
  };
  return { ctl, almacen, avisos, click };
}

describe('objetos apoyados en el editor', () => {
  it('el fantasma de un apoyado se pega a la tapa (dx y dy) y es verde sobre la mesa', () => {
    const { ctl, almacen, click } = nuevo();
    ctl.elegirObjeto('mesa-comedor');
    click(6, 6);
    ctl.elegirObjeto('tabla-quesos');
    ctl.puntero(ev('mover', 6, 6));
    const f = almacen.get().fantasma!;
    expect(f.valido).toBe(true);
    expect(typeof f.dx).toBe('number');
    expect(typeof f.dy).toBe('number');
  });

  it('sobre el suelo el fantasma es rojo con el motivo, y no se coloca', () => {
    const { ctl, almacen, click, avisos } = nuevo();
    ctl.elegirObjeto('taza-regular');
    ctl.puntero(ev('mover', 10, 10));
    expect(almacen.get().fantasma).toMatchObject({ valido: false, motivo: 'Ponlo sobre una mesa o un escritorio.' });
    click(10, 10);
    expect(ctl.sala.colocaciones).toHaveLength(0);
    expect(avisos.at(-1)?.tipo).toBe('error');
  });

  it('un jarrón enorme no cabe en un escritorio angosto: rojo con «No cabe sobre esta mesa.»', () => {
    const { ctl, almacen, click } = nuevo();
    ctl.elegirObjeto('escritorio-oficina');
    click(6, 6);
    ctl.elegirObjeto('jarron-meiji');
    ctl.puntero(ev('mover', 6, 6));
    expect(almacen.get().fantasma).toMatchObject({ valido: false, motivo: 'No cabe sobre esta mesa.' });
  });

  it('mover una mesa con su apoyado juntos funciona (el apoyado se coloca después de la mesa)', () => {
    const { ctl, click } = nuevo();
    ctl.elegirObjeto('escritorio-oficina');
    click(6, 6);
    ctl.elegirObjeto('taza-regular');
    click(7, 6);
    ctl.elegirHerramienta('seleccionar');
    ctl.seleccionar(ctl.sala.colocaciones.map((c) => ({ tipo: 'colocacion' as const, id: c.id })));
    ctl.empujar(0, 3);
    expect(ctl.sala.colocaciones.map((c) => c.y).sort()).toEqual([9, 9]);
  });
});

describe('sillas automáticas en el editor', () => {
  it('Poner sillas alrededor es un solo paso del historial y se puede deshacer', () => {
    const { ctl, click } = nuevo();
    ctl.elegirObjeto('mesa-reunion-6');
    click(8, 8);
    const mesa = ctl.sala.colocaciones[0]!;
    ctl.ponerSillas(mesa.id, { lados: 'todos', silla: 'silla-reunion' });
    expect(ctl.sala.colocaciones).toHaveLength(1 + 10);
    expect(ctl.sillasDe(mesa.id)).toHaveLength(10);
    ctl.deshacer();
    expect(ctl.sala.colocaciones).toHaveLength(1);
  });

  it('«Mover con sus sillas» las selecciona juntas y «Quitar con sus sillas» las borra juntas', () => {
    const { ctl, almacen, click } = nuevo();
    ctl.elegirObjeto('mesa-comedor');
    click(8, 8);
    const mesa = ctl.sala.colocaciones[0]!;
    ctl.ponerSillas(mesa.id, { lados: 'uno' });
    ctl.seleccionarConSillas(mesa.id);
    expect(almacen.get().seleccion).toHaveLength(1 + ctl.sillasDe(mesa.id).length);
    const n = ctl.sillasDe(mesa.id).length;
    ctl.empujar(2, 0);
    const movida = ctl.sala.colocaciones.find((c) => c.id === mesa.id)!;
    expect(movida.x).toBe(mesa.x + 2);
    expect(ctl.sillasDe(mesa.id)).toHaveLength(n);
    ctl.quitarConSillas(mesa.id);
    expect(ctl.sala.colocaciones).toHaveLength(0);
  });

  it('una mesa sin sillas posibles avisa y no cambia nada', () => {
    const { ctl, avisos } = nuevo();
    const antes = ctl.sala;
    ctl.ponerSillas('no-existe', {});
    expect(ctl.sala).toBe(antes);
    expect(avisos).toHaveLength(0);
  });
});

describe('Revisión: «Arreglar»', () => {
  it('acerca una silla suelta a la mesa más cercana', () => {
    const { ctl, click } = nuevo();
    ctl.elegirObjeto('mesa-comedor');
    click(8, 8);
    ctl.elegirObjeto('silla-comedor');
    click(14, 12);
    ctl.revisar();
    const p = validarMapa(ctl.mapaActual).find((q) => q.codigo === 'silla_suelta')!;
    expect(p.arreglo).toBe('silla');
    ctl.arreglar(p);
    ctl.revisar();
    expect(validarMapa(ctl.mapaActual).some((q) => q.codigo === 'silla_suelta')).toBe(false);
  });
});
