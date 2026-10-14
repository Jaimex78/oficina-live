import { afterEach, describe, expect, it } from 'vitest';
import { esFallo, plantillaNaos, pintarPiso, salaVacia, type MapaOficina } from '@ol/shared';
import { crearAlmacen } from '../mundo/almacen';
import type { EventoPuntero } from '../mundo/puente';
import { ESTADO_INICIAL, type EstadoMundo } from '../mundo/tipos';
import { ControladorEditor, anclar, colocacionEn } from './controlador';

const base = (): MapaOficina => {
  const vacia = salaVacia('principal', 'Prueba', 24, 16);
  const celdas: [number, number][] = [];
  for (let y = 0; y < 16; y++) for (let x = 0; x < 24; x++) celdas.push([x, y]);
  const r = pintarPiso(vacia, celdas, 'piso-madera-clara');
  if (esFallo(r)) throw new Error(r.error);
  return { version: 1, nombre: 'Prueba', salaInicial: 'principal', salas: [{ ...r, llegadas: [{ x: 2, y: 2 }] }] };
};

const ev = (tipo: EventoPuntero['tipo'], x: number, y: number, extra: Partial<EventoPuntero> = {}): EventoPuntero => ({ tipo, x, y, px: x * 32 + 16, py: y * 32 + 16, boton: 0, shift: false, ctrl: false, alt: false, ...extra });

function crear(mapa: MapaOficina = base()) {
  const almacen = crearAlmacen<EstadoMundo>({ ...ESTADO_INICIAL });
  const avisos: { texto: string; tipo: string }[] = [];
  const cambios: MapaOficina[] = [];
  const ctl = new ControladorEditor({ almacen, mapa, aviso: (texto, tipo) => avisos.push({ texto, tipo }), alCambiar: (m) => cambios.push(m), esperaRevision: 5 });
  const click = (x: number, y: number, extra: Partial<EventoPuntero> = {}) => {
    ctl.puntero(ev('mover', x, y, extra));
    ctl.puntero(ev('abajo', x, y, extra));
    ctl.puntero(ev('arriba', x, y, extra));
  };
  const arrastrar = (de: [number, number], a: [number, number], pasos: [number, number][] = []) => {
    ctl.puntero(ev('mover', de[0], de[1]));
    ctl.puntero(ev('abajo', de[0], de[1]));
    for (const [x, y] of pasos) ctl.puntero(ev('mover', x, y));
    ctl.puntero(ev('mover', a[0], a[1]));
    ctl.puntero(ev('arriba', a[0], a[1]));
  };
  return { ctl, almacen, avisos, cambios, click, arrastrar };
}

const controladores: ControladorEditor[] = [];
afterEach(() => {
  for (const c of controladores.splice(0)) c.destruir();
});
const nuevo = (mapa?: MapaOficina) => {
  const t = crear(mapa);
  controladores.push(t.ctl);
  return t;
};

describe('anclar', () => {
  it('centra las huellas impares y deja las pares a la izquierda y arriba', () => {
    expect(anclar(1, 1, 5, 5)).toEqual({ x: 5, y: 5 });
    expect(anclar(3, 2, 5, 5)).toEqual({ x: 4, y: 5 });
    expect(anclar(2, 2, 5, 5)).toEqual({ x: 5, y: 5 });
    expect(anclar(4, 2, 5, 5)).toEqual({ x: 4, y: 5 });
  });
});

describe('colocar objetos', () => {
  it('muestra la sombra, coloca y se puede deshacer y rehacer', () => {
    const { ctl, almacen, click } = nuevo();
    ctl.elegirObjeto('silla-oficina');
    ctl.puntero(ev('mover', 5, 5));
    expect(almacen.get().fantasma).toMatchObject({ x: 5, y: 5, valido: true });
    click(5, 5);
    expect(ctl.sala.colocaciones).toHaveLength(1);
    expect(almacen.get().puedeDeshacer).toBe(true);
    ctl.deshacer();
    expect(ctl.sala.colocaciones).toHaveLength(0);
    expect(almacen.get().puedeRehacer).toBe(true);
    ctl.rehacer();
    expect(ctl.sala.colocaciones).toHaveLength(1);
  });

  it('avisa por qué no cabe un objeto', () => {
    const { ctl, almacen, avisos, click } = nuevo();
    ctl.elegirObjeto('mesa-reunion-6');
    ctl.puntero(ev('mover', 1, 0));
    expect(almacen.get().fantasma?.valido).toBe(true);
    click(23, 15);
    expect(ctl.sala.colocaciones).toHaveLength(0);
    expect(avisos.at(-1)?.tipo).toBe('error');
    expect(almacen.get().fantasma?.valido).toBe(false);
  });

  it('arrastrar repite objetos de una casilla en un solo paso del historial', () => {
    const { ctl, arrastrar } = nuevo();
    ctl.elegirObjeto('planta-grande');
    arrastrar([3, 3], [8, 3], [[4, 3], [5, 3], [6, 3], [7, 3]]);
    expect(ctl.sala.colocaciones).toHaveLength(6);
    ctl.deshacer();
    expect(ctl.sala.colocaciones).toHaveLength(0);
  });

  it('un objeto grande se coloca una vez por clic y no al arrastrar', () => {
    const { ctl, arrastrar } = nuevo();
    ctl.elegirObjeto('mesa-reunion-4');
    arrastrar([4, 4], [10, 4], [[5, 4], [6, 4], [7, 4], [8, 4], [9, 4]]);
    expect(ctl.sala.colocaciones).toHaveLength(1);
  });

  it('girar con R cambia la orientación y la huella de lo que se va a colocar', () => {
    const { ctl, almacen } = nuevo();
    ctl.elegirObjeto('mesa-reunion-6');
    ctl.girar();
    expect(almacen.get().pincel.orientacion).toBe('E');
    ctl.puntero(ev('mover', 5, 5));
    expect(almacen.get().fantasma).toMatchObject({ ancho: 2, alto: 3, orientacion: 'E' });
  });

  it('el clic derecho cancela la herramienta', () => {
    const { ctl, almacen } = nuevo();
    ctl.elegirObjeto('silla-oficina');
    ctl.puntero(ev('abajo', 5, 5, { boton: 2 }));
    expect(almacen.get().herramienta).toBe('seleccionar');
    expect(almacen.get().fantasma).toBeNull();
  });
});

describe('paredes', () => {
  it('dibuja una línea recta de muros y se deshace de una vez', () => {
    const { ctl, almacen, arrastrar } = nuevo();
    ctl.elegirObjeto('pared-lisa');
    ctl.puntero(ev('mover', 3, 5));
    ctl.puntero(ev('abajo', 3, 5));
    ctl.puntero(ev('mover', 8, 6));
    expect(almacen.get().vistaPrevia?.celdas).toHaveLength(6);
    ctl.puntero(ev('arriba', 8, 6));
    expect(ctl.sala.colocaciones).toHaveLength(6);
    expect(ctl.sala.colocaciones.every((c) => c.y === 5)).toBe(true);
    ctl.deshacer();
    expect(ctl.sala.colocaciones).toHaveLength(0);
    void arrastrar;
  });

  it('una puerta reemplaza al muro y toma la orientación de la pared', () => {
    const { ctl, almacen, click, arrastrar } = nuevo();
    ctl.elegirObjeto('pared-lisa');
    arrastrar([3, 5], [9, 5]);
    ctl.elegirObjeto('puerta-simple');
    ctl.puntero(ev('mover', 6, 5));
    expect(almacen.get().fantasma?.orientacion).toBe('S');
    click(6, 5);
    expect(ctl.sala.colocaciones.filter((c) => c.x === 6 && c.y === 5)).toHaveLength(1);
    expect(ctl.sala.colocaciones.find((c) => c.x === 6 && c.y === 5)?.objeto).toBe('puerta-simple');

    ctl.elegirObjeto('pared-lisa');
    arrastrar([12, 3], [12, 9]);
    ctl.elegirObjeto('puerta-simple');
    ctl.puntero(ev('mover', 12, 6));
    expect(almacen.get().fantasma?.orientacion).toBe('E');
  });

  it('lo colgado exige una pared', () => {
    const { ctl, click, avisos } = nuevo();
    ctl.elegirObjeto('cuadro-grande');
    click(6, 6);
    expect(ctl.sala.colocaciones).toHaveLength(0);
    expect(avisos.at(-1)?.texto).toMatch(/pared/i);
  });
});

describe('pisos', () => {
  it('pinta un rectángulo de una vez', () => {
    const { ctl, arrastrar } = nuevo();
    ctl.elegirPiso('piso-baldosa', 'rectangulo');
    arrastrar([2, 2], [5, 4]);
    expect(ctl.sala.piso[3]?.[3]).toBe('piso-baldosa');
    expect(ctl.sala.piso[5]?.[3]).toBe('piso-madera-clara');
    ctl.deshacer();
    expect(ctl.sala.piso[3]?.[3]).toBe('piso-madera-clara');
  });

  it('el pincel pinta sin dejar huecos aunque el puntero salte', () => {
    const { ctl } = nuevo();
    ctl.elegirPiso('piso-cemento', 'pincel');
    ctl.puntero(ev('abajo', 2, 2));
    ctl.puntero(ev('mover', 7, 2));
    ctl.puntero(ev('mover', 7, 6));
    ctl.puntero(ev('arriba', 7, 6));
    for (let x = 2; x <= 7; x++) expect(ctl.sala.piso[2]?.[x]).toBe('piso-cemento');
    for (let y = 2; y <= 6; y++) expect(ctl.sala.piso[y]?.[7]).toBe('piso-cemento');
    ctl.deshacer();
    expect(ctl.sala.piso[2]?.[4]).toBe('piso-madera-clara');
  });

  it('el bote rellena la región conectada', () => {
    const { ctl, click } = nuevo();
    ctl.elegirPiso('piso-baldosa', 'bote');
    click(10, 10);
    expect(ctl.sala.piso.flat().every((p) => p === 'piso-baldosa')).toBe(true);
  });

  it('el borrador quita el piso pero respeta lo que hay encima', () => {
    const { ctl, click, avisos } = nuevo();
    ctl.elegirObjeto('mesa-redonda');
    click(6, 6);
    ctl.elegirPiso(null);
    click(6, 6);
    expect(ctl.sala.piso[6]?.[6]).toBe('piso-madera-clara');
    expect(avisos.at(-1)?.texto).toMatch(/encima/i);
    click(12, 12);
    expect(ctl.sala.piso[12]?.[12]).toBe('');
  });
});

describe('seleccionar y mover', () => {
  it('selecciona al hacer clic y mueve arrastrando', () => {
    const { ctl, almacen, arrastrar } = nuevo();
    ctl.elegirObjeto('mesa-reunion-4');
    ctl.puntero(ev('abajo', 5, 5));
    ctl.puntero(ev('arriba', 5, 5));
    ctl.elegirHerramienta('seleccionar');
    arrastrar([5, 5], [9, 7], [[6, 5], [7, 6], [8, 6]]);
    const c = ctl.sala.colocaciones[0];
    expect(c).toMatchObject({ x: 9, y: 7 });
    expect(almacen.get().seleccion).toEqual([{ tipo: 'colocacion', id: c?.id }]);
    ctl.deshacer();
    expect(ctl.sala.colocaciones[0]).toMatchObject({ x: 5, y: 5 });
  });

  it('un movimiento inválido no cambia nada', () => {
    const { ctl, arrastrar, avisos } = nuevo();
    ctl.elegirObjeto('columna');
    ctl.puntero(ev('abajo', 5, 5));
    ctl.puntero(ev('arriba', 5, 5));
    ctl.puntero(ev('abajo', 9, 9));
    ctl.puntero(ev('arriba', 9, 9));
    ctl.elegirHerramienta('seleccionar');
    arrastrar([5, 5], [9, 9]);
    expect(ctl.sala.colocaciones.map((c) => [c.x, c.y]).sort()).toEqual([[5, 5], [9, 9]]);
    expect(avisos.at(-1)?.tipo).toBe('error');
  });

  it('el cuadro de selección toma todo lo que toca', () => {
    const { ctl, almacen } = nuevo();
    ctl.elegirObjeto('planta-grande');
    for (const [x, y] of [[3, 3], [5, 3], [14, 10]] as const) {
      ctl.puntero(ev('abajo', x, y));
      ctl.puntero(ev('arriba', x, y));
    }
    ctl.elegirHerramienta('seleccionar');
    ctl.puntero(ev('abajo', 1, 1, { px: 20, py: 20 }));
    ctl.puntero(ev('mover', 8, 5, { px: 8 * 32, py: 5 * 32 }));
    expect(almacen.get().marquesina).not.toBeNull();
    ctl.puntero(ev('arriba', 8, 5, { px: 8 * 32, py: 5 * 32 }));
    expect(almacen.get().seleccion).toHaveLength(2);
  });

  it('borra la selección y quita lo que colgaba de una pared', () => {
    const { ctl, almacen, arrastrar, click } = nuevo();
    ctl.elegirObjeto('pared-lisa');
    arrastrar([3, 5], [8, 5]);
    ctl.elegirObjeto('cuadro-grande');
    ctl.puntero(ev('mover', 4, 5));
    click(4, 5);
    expect(ctl.sala.colocaciones.some((c) => c.objeto === 'cuadro-grande')).toBe(true);
    ctl.elegirHerramienta('seleccionar');
    const muro = ctl.sala.colocaciones.find((c) => c.objeto === 'pared-lisa' && c.x === 4)!;
    ctl.seleccionar([{ tipo: 'colocacion', id: muro.id }]);
    ctl.borrarSeleccion();
    expect(ctl.sala.colocaciones.some((c) => c.objeto === 'cuadro-grande')).toBe(false);
    expect(almacen.get().seleccion).toEqual([]);
  });

  it('las flechas empujan la selección y gira con R', () => {
    const { ctl } = nuevo();
    ctl.elegirObjeto('mesa-reunion-6');
    ctl.puntero(ev('abajo', 6, 6));
    ctl.puntero(ev('arriba', 6, 6));
    ctl.elegirHerramienta('seleccionar');
    const c = ctl.sala.colocaciones[0]!;
    ctl.seleccionar([{ tipo: 'colocacion', id: c.id }]);
    ctl.empujar(1, 0);
    expect(ctl.sala.colocaciones[0]?.x).toBe(c.x + 1);
    ctl.girar();
    expect(ctl.sala.colocaciones[0]?.orientacion).toBe('E');
  });

  it('colocacionEn halla lo que está al frente en una casilla', () => {
    const { ctl } = nuevo();
    ctl.elegirObjeto('mesa-reunion-4');
    ctl.puntero(ev('abajo', 5, 5));
    ctl.puntero(ev('arriba', 5, 5));
    ctl.elegirObjeto('monitor');
    ctl.puntero(ev('mover', 5, 5));
    ctl.puntero(ev('abajo', 5, 5));
    ctl.puntero(ev('arriba', 5, 5));
    expect(colocacionEn(ctl.sala, 5, 5)?.objeto).toBe('monitor');
  });
});

describe('zonas y llegadas', () => {
  it('dibuja una zona arrastrando y al hacer clic dentro de otra la selecciona', () => {
    const { ctl, almacen, arrastrar } = nuevo();
    ctl.elegirHerramienta('zona');
    arrastrar([2, 2], [7, 5]);
    expect(ctl.sala.zonas).toHaveLength(1);
    expect(ctl.sala.zonas[0]?.rect).toEqual({ x: 2, y: 2, w: 6, h: 4 });
    expect(almacen.get().seleccion).toEqual([{ tipo: 'zona', id: ctl.sala.zonas[0]?.id }]);
    almacen.set({ seleccion: [] });
    arrastrar([4, 3], [4, 3]);
    expect(ctl.sala.zonas).toHaveLength(1);
    expect(almacen.get().seleccion[0]?.tipo).toBe('zona');
  });

  it('edita y borra una zona', () => {
    const { ctl, arrastrar } = nuevo();
    ctl.elegirHerramienta('zona');
    arrastrar([2, 2], [5, 5]);
    const id = ctl.sala.zonas[0]!.id;
    ctl.actualizarZonaPorId(id, { nombre: 'Sala Naos', tipo: 'sala' });
    expect(ctl.sala.zonas[0]).toMatchObject({ nombre: 'Sala Naos', tipo: 'sala' });
    ctl.quitarZonaPorId(id);
    expect(ctl.sala.zonas).toHaveLength(0);
  });

  it('pone y quita puntos de llegada', () => {
    const { ctl, click, avisos } = nuevo();
    ctl.elegirHerramienta('llegada');
    click(6, 6);
    expect(ctl.sala.llegadas).toHaveLength(2);
    click(6, 6);
    expect(ctl.sala.llegadas).toHaveLength(1);
    ctl.elegirObjeto('columna');
    ctl.puntero(ev('abajo', 8, 8));
    ctl.puntero(ev('arriba', 8, 8));
    ctl.elegirHerramienta('llegada');
    click(8, 8);
    expect(ctl.sala.llegadas).toHaveLength(1);
    expect(avisos.at(-1)?.tipo).toBe('error');
  });
});

describe('revisión y guardado', () => {
  it('avisa al cambiar el mapa y revisa los problemas', async () => {
    const { ctl, almacen, click, cambios } = nuevo();
    ctl.elegirObjeto('pizarron');
    click(8, 8);
    expect(cambios.length).toBeGreaterThan(0);
    await new Promise((r) => setTimeout(r, 30));
    expect(almacen.get().problemas.some((p) => p.codigo === 'nota_vacia')).toBe(true);
  });

  it('cargar un mapa nuevo limpia el historial y la selección', () => {
    const { ctl, almacen, click } = nuevo();
    ctl.elegirObjeto('silla-oficina');
    click(5, 5);
    ctl.cargarMapa(base());
    expect(almacen.get().puedeDeshacer).toBe(false);
    expect(ctl.sala.colocaciones).toHaveLength(0);
  });

  it('trabaja con el mapa de ejemplo completo', () => {
    const { ctl, click } = nuevo(plantillaNaos());
    ctl.elegirObjeto('planta-chica');
    click(8, 16); // una casilla libre de la mesa de reuniones de la oficina de dirección A
    expect(ctl.sala.colocaciones.some((c) => c.objeto === 'planta-chica')).toBe(true);
    expect(ctl.hayErrores).toBe(false);
  });
});

describe('habitaciones rápidas', () => {
  it('arrastrar arma piso, paredes, puerta y zona, y se deshace de una vez', () => {
    const { ctl, almacen, arrastrar } = nuevo();
    ctl.configurarHabitacion({ zona: 'privada', puerta: true, muro: 'pared-lisa', tam: null });
    arrastrar([4, 3], [10, 8]);
    const s = ctl.sala;
    const paredes = s.colocaciones.filter((c) => c.objeto === 'pared-lisa');
    const puertas = s.colocaciones.filter((c) => c.objeto === 'puerta-simple');
    // Contorno de 7 x 6 casillas = 22, menos la casilla de la puerta.
    expect(paredes).toHaveLength(21);
    expect(puertas).toHaveLength(1);
    expect(puertas[0]).toMatchObject({ x: 7, y: 8 });
    expect(s.zonas).toHaveLength(1);
    expect(s.zonas[0]).toMatchObject({ tipo: 'privada', rect: { x: 5, y: 4, w: 5, h: 4 } });
    expect(almacen.get().puedeDeshacer).toBe(true);
    ctl.deshacer();
    expect(ctl.sala.colocaciones).toHaveLength(0);
    expect(ctl.sala.zonas).toHaveLength(0);
  });

  it('una plantilla se estampa con un clic y se centra en el puntero', () => {
    const { ctl, click } = nuevo();
    ctl.configurarHabitacion({ tam: { w: 6, h: 5 }, zona: 'ninguna', puerta: false });
    click(10, 8);
    const s = ctl.sala;
    expect(s.colocaciones.filter((c) => c.objeto === 'pared-lisa')).toHaveLength(6 * 2 + 3 * 2);
    expect(s.zonas).toHaveLength(0);
  });

  it('no arma habitaciones menores de 3 x 3', () => {
    const { ctl, avisos, arrastrar } = nuevo();
    ctl.configurarHabitacion({ tam: null });
    arrastrar([4, 3], [5, 4]);
    expect(ctl.sala.colocaciones).toHaveLength(0);
    expect(avisos.at(-1)?.tipo).toBe('error');
  });
});

describe('salas del mapa', () => {
  it('crea, renombra, cambia de sala y borra, con historial', () => {
    const { ctl, almacen } = nuevo();
    ctl.nuevaSala('Terraza', 24, 16);
    expect(ctl.salas.map((s) => s.nombre)).toEqual(['Prueba', 'Terraza']);
    expect(ctl.sala.nombre).toBe('Terraza');
    expect(almacen.get().sala?.nombre).toBe('Terraza');
    ctl.renombrarSala('sala-2', 'Azotea');
    expect(ctl.salas[1]?.nombre).toBe('Azotea');
    ctl.borrarSala('principal');
    expect(ctl.salas).toHaveLength(2);
    ctl.definirSalaInicial('sala-2');
    ctl.borrarSala('principal');
    expect(ctl.salas.map((s) => s.id)).toEqual(['sala-2']);
    ctl.borrarSala('sala-2');
    expect(ctl.salas).toHaveLength(1);
    ctl.deshacer();
    expect(ctl.salas).toHaveLength(2);
  });
});

describe('editar solo mi área', () => {
  const conArea = (): { mapa: MapaOficina; area: import('@ol/shared').AreaPersonal } => {
    const m = base();
    const sala = m.salas[0]!;
    const area = { id: 'a1', nombre: 'Escritorio de Ana', rect: { x: 4, y: 4, w: 4, h: 3 }, duenos: [7] };
    return { mapa: { ...m, salas: [{ ...sala, areas: [area] }] }, area };
  };
  const limitado = () => {
    const { mapa, area } = conArea();
    const almacen = crearAlmacen<EstadoMundo>({ ...ESTADO_INICIAL });
    const avisos: { texto: string; tipo: string }[] = [];
    const ctl = new ControladorEditor({ almacen, mapa, area: { sala: 'principal', area }, aviso: (texto, tipo) => avisos.push({ texto, tipo }), esperaRevision: 5 });
    controladores.push(ctl);
    const click = (x: number, y: number) => {
      ctl.puntero(ev('mover', x, y));
      ctl.puntero(ev('abajo', x, y));
      ctl.puntero(ev('arriba', x, y));
    };
    return { ctl, almacen, avisos, click };
  };

  it('deja poner objetos dentro del área y rechaza los de afuera', () => {
    const { ctl, avisos, click } = limitado();
    ctl.elegirObjeto('planta-grande');
    click(5, 5);
    expect(ctl.sala.colocaciones.map((c) => c.objeto)).toEqual(['planta-grande']);
    click(15, 12);
    expect(ctl.sala.colocaciones).toHaveLength(1);
    expect(avisos.at(-1)?.tipo).toBe('error');
  });

  it('no deja usar herramientas de quien administra', () => {
    const { ctl, almacen } = limitado();
    ctl.elegirHerramienta('habitacion');
    expect(almacen.get().herramienta).not.toBe('habitacion');
    ctl.elegirHerramienta('zona');
    expect(almacen.get().herramienta).not.toBe('zona');
    ctl.elegirHerramienta('borrar');
    expect(almacen.get().herramienta).toBe('borrar');
  });

  it('la sombra se ve roja fuera del área', () => {
    const { ctl, almacen } = limitado();
    ctl.elegirObjeto('planta-grande');
    ctl.puntero(ev('mover', 12, 10));
    expect(almacen.get().fantasma?.valido).toBe(false);
    ctl.puntero(ev('mover', 5, 5));
    expect(almacen.get().fantasma?.valido).toBe(true);
  });

  it('no deja crear salas ni cambiar áreas', () => {
    const { ctl } = limitado();
    ctl.nuevaSala('Otra', 24, 16);
    expect(ctl.salas).toHaveLength(1);
    ctl.quitarAreaPorId('a1');
    expect(ctl.areas).toHaveLength(1);
  });
});

describe('áreas desde el editor de quien administra', () => {
  it('dibuja un área, le asigna dueños y la quita', () => {
    const { ctl, arrastrar } = nuevo();
    ctl.elegirHerramienta('area');
    arrastrar([3, 3], [6, 5]);
    expect(ctl.areas).toHaveLength(1);
    expect(ctl.areas[0]).toMatchObject({ rect: { x: 3, y: 3, w: 4, h: 3 }, duenos: [] });
    const id = ctl.areas[0]!.id;
    ctl.actualizarAreaPorId(id, { duenos: [5, 5, 9], nombre: 'Escritorio de Ana' });
    expect(ctl.areas[0]).toMatchObject({ nombre: 'Escritorio de Ana', duenos: [5, 9] });
    ctl.quitarAreaPorId(id);
    expect(ctl.areas).toHaveLength(0);
  });

  it('crea un área por cada puesto con nombre y respeta las que ya existen', () => {
    const { ctl, click } = nuevo();
    ctl.elegirObjeto('silla-oficina');
    click(5, 5);
    const silla = ctl.sala.colocaciones[0]!;
    ctl.reemplazarSala({ ...ctl.sala, puestos: [{ id: 'u1', colocacion: silla.id, usuarioId: 12, etiqueta: 'Ana Pérez · Datos' }] });
    ctl.crearAreasDePuestos();
    expect(ctl.areas).toHaveLength(1);
    expect(ctl.areas[0]).toMatchObject({ nombre: 'Escritorio de Ana Pérez', duenos: [12] });
    ctl.crearAreasDePuestos();
    expect(ctl.areas).toHaveLength(1);
  });
});
