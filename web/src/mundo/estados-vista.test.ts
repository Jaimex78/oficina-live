import { describe, expect, it } from 'vitest';
import { ESTADOS_PRESENCIA } from '@ol/shared';
import { COLOR_PUNTO, aNumero, colorDePersona, esPildoraDestacada, inicialDe, recortar, textoDePildora } from './estados-vista';

describe('estados de la píldora', () => {
  it('cada estado tiene un color distinto en formato hexadecimal', () => {
    const colores = ESTADOS_PRESENCIA.map((e) => COLOR_PUNTO[e]);
    expect(new Set(colores).size).toBe(ESTADOS_PRESENCIA.length);
    for (const c of colores) expect(c).toMatch(/^#[0-9A-F]{6}$/);
    expect(COLOR_PUNTO.disponible).toBe('#22C55E'); // verde
    expect(COLOR_PUNTO.ausente).toBe('#F59E0B'); // naranja
  });
  it('solo tú y quien tienes seleccionado van destacados', () => {
    expect(esPildoraDestacada('yo')).toBe(true);
    expect(esPildoraDestacada('seleccionada')).toBe(true);
    expect(esPildoraDestacada('otra')).toBe(false);
  });
});

describe('texto de la píldora', () => {
  it('usa el apodo si hay, y si no el nombre completo', () => {
    expect(textoDePildora({ nombre: 'Ana Ruiz', apodo: '' })).toBe('Ana Ruiz');
    expect(textoDePildora({ nombre: 'Ana Ruiz', apodo: 'Ani' })).toBe('Ani');
  });
  it('recorta los nombres largos con puntos suspensivos y no parte letras', () => {
    expect(recortar('María Fernanda Ospina Valencia')).toBe('María Fernanda Ospina…');
    expect(recortar('  Ana   Ruiz ')).toBe('Ana Ruiz');
    expect([...recortar('😀'.repeat(30))]).toHaveLength(22);
  });
  it('la inicial es la primera letra en mayúscula', () => {
    expect(inicialDe({ nombre: 'ángela Ruiz', apodo: '' })).toBe('Á');
    expect(inicialDe({ nombre: 'Ana', apodo: '·x' })).toBe('X');
    expect(inicialDe({ nombre: '', apodo: '' })).toBe('?');
  });
});

describe('colores', () => {
  it('el color de una persona no cambia entre llamadas', () => {
    expect(colorDePersona(7)).toBe(colorDePersona(7));
    expect(colorDePersona(-3)).toMatch(/^#/);
  });
  it('convierte a número', () => {
    expect(aNumero('#5B4BDB')).toBe(0x5b4bdb);
  });
});
