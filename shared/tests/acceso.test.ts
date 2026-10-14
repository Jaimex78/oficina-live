import { describe, expect, it } from 'vitest';
import { parteDisponible, mascotaDisponible, coleccionActiva, coleccionesActivas, disfrazDisponible, domingoDePascua, limpiarPaquetes, movilidadDisponible, objetoDisponible, objetoPorId } from '../src';

const dia = (iso: string): Date => new Date(`${iso}T15:00:00Z`); // mediodía en Colombia

describe('fiestas del año', () => {
  it('calcula el domingo de Pascua', () => {
    expect(domingoDePascua(2026)).toEqual({ mes: 4, dia: 5 });
    expect(domingoDePascua(2027)).toEqual({ mes: 3, dia: 28 });
  });

  it('abre cada fiesta solo en sus fechas', () => {
    expect(coleccionActiva('halloween', dia('2026-10-31'))).toBe(true);
    expect(coleccionActiva('halloween', dia('2026-10-14'))).toBe(false);
    expect(coleccionActiva('halloween', dia('2026-11-03'))).toBe(false);
    expect(coleccionActiva('navidad', dia('2026-12-24'))).toBe(true);
    expect(coleccionActiva('navidad', dia('2027-01-06'))).toBe(true);
    expect(coleccionActiva('navidad', dia('2027-01-07'))).toBe(false);
    expect(coleccionActiva('ano-nuevo', dia('2026-12-31'))).toBe(true);
    expect(coleccionActiva('amor-amistad', dia('2026-09-19'))).toBe(true);
    expect(coleccionActiva('colombia', dia('2026-07-20'))).toBe(true);
    expect(coleccionActiva('colombia', dia('2026-08-07'))).toBe(true);
    expect(coleccionActiva('colombia', dia('2026-08-20'))).toBe(false);
    expect(coleccionActiva('cumpleanos', dia('2026-10-31'))).toBe(false);
  });

  it('Semana Santa sigue a la Pascua de cada año', () => {
    expect(coleccionActiva('pascua', dia('2026-03-29'))).toBe(true); // Domingo de Ramos
    expect(coleccionActiva('pascua', dia('2026-04-05'))).toBe(true);
    expect(coleccionActiva('pascua', dia('2026-04-07'))).toBe(false);
    expect(coleccionActiva('pascua', dia('2027-03-24'))).toBe(true);
    expect(coleccionActiva('pascua', dia('2026-03-20'))).toBe(false);
  });

  it('usa la hora de Colombia: a las 11 pm del 14 de octubre todavía no es Halloween', () => {
    expect(coleccionActiva('halloween', new Date('2026-10-15T03:30:00Z'))).toBe(false); // 10:30 pm del 14
    expect(coleccionActiva('halloween', new Date('2026-10-15T06:00:00Z'))).toBe(true); // 1 am del 15
  });

  it('lista las fiestas abiertas hoy', () => {
    expect(coleccionesActivas(dia('2026-12-28'))).toEqual(['navidad', 'ano-nuevo']);
    expect(coleccionesActivas(dia('2026-05-10'))).toEqual([]);
  });
});

describe('disponibilidad por persona', () => {
  const calabaza = objetoPorId('calabaza-grande')!;
  const billar = objetoPorId('mesa-billar')!;
  const silla = objetoPorId('silla-oficina')!;

  it('lo básico lo usa cualquiera, lo demás pide paquete', () => {
    expect(objetoDisponible(silla, [])).toBe(true);
    expect(objetoDisponible(billar, [], dia('2026-05-10'))).toBe(false);
    expect(objetoDisponible(billar, ['juegos'], dia('2026-05-10'))).toBe(true);
  });

  it('lo de una fiesta se abre solo en sus fechas, o con el paquete', () => {
    expect(objetoDisponible(calabaza, [], dia('2026-05-10'))).toBe(false);
    expect(objetoDisponible(calabaza, [], dia('2026-10-31'))).toBe(true);
    expect(objetoDisponible(calabaza, ['fiesta-halloween'], dia('2026-05-10'))).toBe(true);
    // El billar no es de ninguna fiesta: Halloween no lo abre.
    expect(objetoDisponible(billar, [], dia('2026-10-31'))).toBe(false);
  });

  it('personaje: lo básico es libre, la ropa premium y las mascotas van por paquete, los disfraces por fecha o paquete', () => {
    expect(parteDisponible({}, [])).toBe(true);
    expect(parteDisponible({ premium: true }, [])).toBe(false);
    expect(parteDisponible({ premium: true }, ['ropa-premium'])).toBe(true);
    expect(mascotaDisponible({ grupo: 'animales' }, [])).toBe(false);
    expect(mascotaDisponible({ grupo: 'animales' }, ['mascotas'])).toBe(true);
    expect(mascotaDisponible({ grupo: 'animales' }, ['mascotas-animales'])).toBe(true);
    expect(mascotaDisponible({ grupo: 'fantasticas' }, ['mascotas-animales'])).toBe(false);
    expect(mascotaDisponible({ grupo: 'fantasticas' }, ['mascotas-fantasticas'])).toBe(true);
    expect(disfrazDisponible({ coleccion: 'halloween' }, [], dia('2026-05-10'))).toBe(false);
    expect(disfrazDisponible({ coleccion: 'halloween' }, [], dia('2026-10-31'))).toBe(true);
    expect(disfrazDisponible({ coleccion: 'navidad' }, ['fiesta-navidad'], dia('2026-05-10'))).toBe(true);
    expect(disfrazDisponible({}, ['fiesta-navidad'])).toBe(false);
    expect(movilidadDisponible([])).toBe(false);
    expect(movilidadDisponible(['movilidad'])).toBe(true);
  });

  it('limpia paquetes: quita los que no existen y los repetidos', () => {
    expect(limpiarPaquetes(['gamer', 'gamer', 'no-existe', 'accesorios-sombreros', 7])).toEqual(['gamer']);
    expect(limpiarPaquetes('x')).toEqual([]);
    // El nombre viejo del paquete de accesorios especiales equivale a «Ropa premium».
    expect(limpiarPaquetes(['accesorios-especiales', 'ropa-premium'])).toEqual(['ropa-premium']);
  });
});
