import { describe, expect, it } from 'vitest';
import { ConstructorSala, type SalaMapa } from '@ol/shared';
import { ETIQUETA_CLASE, areaBajo, areasDeSala, claseDeZona, zonasRotuladas } from './areas';

function sala(): SalaMapa {
  const c = new ConstructorSala('s', 'Sala', 40, 20).piso(0, 0, 40, 20, 'piso-madera-clara');
  // Equipo: cuatro escritorios con su silla.
  for (const x of [2, 5, 8, 11]) c.poner('escritorio-individual', x, 3, 'S').poner('silla-oficina', x, 4, 'N');
  // Descanso: sofá y puff.
  c.poner('sofa-3', 20, 12, 'S').poner('puff', 24, 12);
  c.zona('Team', 'abierta', 1, 2, 14, 5);
  c.zona('Rincón', 'abierta', 19, 10, 8, 6);
  c.zona('Fishtank', 'sala', 30, 2, 6, 6);
  c.zona('Baños', 'privada', 30, 10, 6, 6);
  c.zona('Biblioteca', 'silenciosa', 1, 10, 6, 6);
  c.zona('Sala de juntas', 'abierta', 1, 16, 6, 3);
  c.zona('Pasillo', 'abierta', 10, 17, 6, 2);
  c.area('Escritorio de Ana', 2, 3, 3, 3);
  return c.construir();
}

describe('clase de cada zona', () => {
  const s = sala();
  const clase = (n: string) => claseDeZona(s.zonas.find((z) => z.nombre === n)!, s);
  it('el tipo del editor manda cuando dice algo concreto', () => {
    expect(clase('Fishtank')).toBe('reunion');
    expect(clase('Baños')).toBe('privada');
    expect(clase('Biblioteca')).toBe('silenciosa');
  });
  it('en una zona abierta se mira qué hay adentro', () => {
    expect(clase('Team')).toBe('escritorios');
    expect(clase('Rincón')).toBe('descanso');
  });
  it('un equipo con un puff de adorno en cada oficina sigue siendo un equipo, no una zona de descanso', () => {
    const c = new ConstructorSala('s', 'S', 30, 12).piso(0, 0, 30, 12, 'piso-madera-clara');
    for (const x of [2, 7, 12, 17]) c.poner('escritorio-individual', x, 3, 'S').poner('silla-oficina', x, 4, 'N').poner('puff', x + 2, 6);
    const sala = c.zona('Equipo', 'abierta', 1, 2, 20, 8).construir();
    expect(claseDeZona(sala.zonas[0] as never, sala)).toBe('escritorios');
  });
  it('si adentro no hay nada que lo diga, se mira el nombre; y si tampoco, es un área abierta', () => {
    expect(clase('Sala de juntas')).toBe('reunion');
    expect(clase('Pasillo')).toBe('abierta');
  });
});

describe('areasDeSala y areaBajo', () => {
  const s = sala();
  const areas = areasDeSala(s);
  it('las áreas personales se prueban antes que las zonas', () => {
    expect(areas[0]).toMatchObject({ id: s.areas?.[0]?.id, origen: 'area', clase: ETIQUETA_CLASE.escritorio });
    expect(areaBajo(areas, 3.5, 4.2)?.nombre).toBe('Escritorio de Ana');
    expect(areaBajo(areas, 9.5, 4.2)?.nombre).toBe('Team'); // dentro de la zona pero fuera del escritorio de Ana
  });
  it('devuelve null en el pasillo vacío y respeta el borde de cada rectángulo', () => {
    expect(areaBajo(areas, 25, 1)).toBeNull();
    expect(areaBajo(areas, 30, 2)?.nombre).toBe('Fishtank');
    expect(areaBajo(areas, 36, 2)).toBeNull(); // x = 36 ya es fuera (30 + 6)
  });
  it('solo las zonas se rotulan con píldora', () => {
    const r = zonasRotuladas(areas);
    expect(r.every((a) => a.origen === 'zona')).toBe(true);
    expect(r).toHaveLength(7);
  });
  it('una zona dentro de otra gana la de adentro', () => {
    const c = new ConstructorSala('s', 'S', 20, 20).piso(0, 0, 20, 20, 'piso-madera-clara').zona('Grande', 'abierta', 0, 0, 12, 12).zona('Chica', 'sala', 2, 2, 4, 4).construir();
    expect(areaBajo(areasDeSala(c), 3, 3)?.nombre).toBe('Chica');
    expect(areaBajo(areasDeSala(c), 9, 9)?.nombre).toBe('Grande');
  });
});
