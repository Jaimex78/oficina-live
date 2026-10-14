import { describe, expect, it } from 'vitest';
import { ConstructorSala, asignarPuesto, esFallo, type SalaMapa } from '@ol/shared';
import { buscarMiEscritorio, coincideNombre, escritorioEnCasilla, escritorioLibreMasCercano, esMiArea, nombreDeEtiqueta, sillaDeEscritorio, tieneEscritorioAlLado } from './escritorios';

/** Tres escritorios con silla (en x = 3, 7 y 11) y una silla de comedor suelta. */
function sala(): SalaMapa {
  const c = new ConstructorSala('s', 'Sala', 20, 10).piso(0, 0, 20, 10, 'piso-madera-clara');
  c.poner('escritorio-individual', 3, 3, 'S').poner('silla-oficina', 3, 4, 'N');
  const a = c.ultima().id;
  c.poner('escritorio-individual', 7, 3, 'S').poner('silla-oficina', 7, 4, 'N');
  const b = c.ultima().id;
  c.poner('escritorio-individual', 11, 3, 'S').poner('silla-oficina', 11, 4, 'N');
  c.poner('silla-comedor', 15, 8, 'N');
  c.puesto(a, 'Ana Ruiz · Data Entry').puesto(b, 'Camila Torres · Backend');
  return c.construir();
}

describe('nombres', () => {
  it('toma el nombre antes del punto medio, sin tildes ni mayúsculas', () => {
    expect(nombreDeEtiqueta('María José · Diseño')).toBe('maria jose');
  });
  it('coincide con el nombre completo, el apodo o el inicio del nombre', () => {
    const q = { nombre: 'Camila Torres', apodo: 'Cami' };
    expect(coincideNombre('camila', q)).toBe(true);
    expect(coincideNombre('cami', q)).toBe(true);
    expect(coincideNombre('camila torres', q)).toBe(true);
    expect(coincideNombre('carlos', q)).toBe(false);
    expect(coincideNombre('', q)).toBe(false);
    expect(coincideNombre('cami', { nombre: 'Camila Torres', apodo: '' })).toBe(false); // «cami» no es inicio de una palabra completa
  });
});

describe('tieneEscritorioAlLado', () => {
  it('distingue la silla de escritorio de la de comedor', () => {
    const s = sala();
    const sillas = s.colocaciones.filter((c) => c.objeto.startsWith('silla'));
    const flags = sillas.map((c) => tieneEscritorioAlLado(s, { colocacion: c.id, x: c.x, y: c.y, mira: 'N' }));
    expect(flags).toEqual([true, true, true, false]);
  });
});

describe('buscarMiEscritorio', () => {
  const s = sala();
  const desde = { x: 5 * 32, y: 8 * 32 };

  it('usa el puesto asignado a tu cuenta antes que cualquier otro', () => {
    const silla = s.colocaciones.find((c) => c.x === 7 && c.objeto === 'silla-oficina')!;
    const r = asignarPuesto(s, silla.id, 42, 'Otra persona');
    if (esFallo(r)) throw new Error(r.error);
    const h = buscarMiEscritorio(r, { id: 42, nombre: 'Ana Ruiz', apodo: '' }, desde);
    expect(h).toMatchObject({ origen: 'cuenta', asiento: { x: 7, y: 4 } });
  });

  it('si no, el puesto que lleva tu nombre', () => {
    const h = buscarMiEscritorio(s, { id: 9, nombre: 'Ana Ruiz', apodo: '' }, desde);
    expect(h).toMatchObject({ origen: 'nombre', asiento: { x: 3, y: 4 }, etiqueta: 'Ana Ruiz · Data Entry' });
  });

  it('si no hay nada tuyo, el escritorio libre más cercano a donde llegaste', () => {
    const h = buscarMiEscritorio(s, { id: 9, nombre: 'Alguien Más', apodo: '' }, desde);
    expect(h).toMatchObject({ origen: 'libre', asiento: { x: 11, y: 4 } });
  });

  it('el escritorio libre no cuenta si alguien ya está sentado, ni la silla de comedor', () => {
    expect(escritorioLibreMasCercano(s, desde, (a) => a.x === 11)).toBeNull();
  });
});

describe('sillaDeEscritorio', () => {
  it('da la silla libre pegada al escritorio que se tocó', () => {
    const s = sala();
    expect(sillaDeEscritorio(s, { x: 7, y: 3, ancho: 2, alto: 1 })).toMatchObject({ x: 7, y: 4 });
    expect(sillaDeEscritorio(s, { x: 7, y: 3, ancho: 2, alto: 1 }, () => true)).toBeNull();
  });
});

describe('áreas propias y escritorio bajo una casilla', () => {
  it('un área es tuya si eres dueño o si lleva tu nombre', () => {
    const yo = { id: 5, nombre: 'Ana Ruiz', apodo: '' };
    expect(esMiArea({ nombre: 'Lo que sea', duenos: [5] }, yo)).toBe(true);
    expect(esMiArea({ nombre: 'Escritorio de Ana Ruiz', duenos: [] }, yo)).toBe(true);
    expect(esMiArea({ nombre: 'Oficina de Ana Ruiz', duenos: [] }, yo)).toBe(true);
    expect(esMiArea({ nombre: 'Escritorio de Marta Díaz', duenos: [] }, yo)).toBe(false);
    expect(esMiArea({ nombre: 'Escritorio libre', duenos: [] }, yo)).toBe(false);
  });
  it('encuentra el escritorio que cubre una casilla, también la segunda de un escritorio doble', () => {
    const s = sala();
    expect(escritorioEnCasilla(s, 8, 3)).toEqual({ x: 7, y: 3, ancho: 2, alto: 1 });
    expect(escritorioEnCasilla(s, 7, 4)).toBeNull(); // ahí está la silla, no el escritorio
  });
});
