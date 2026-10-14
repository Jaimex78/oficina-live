import { describe, expect, it } from 'vitest';
import type { MiembroOficina } from '../mundo/api-oficina';
import { repartirMiembros } from './miembros';

const m = (id: number, nombre: string, enLinea: boolean, extra: Partial<MiembroOficina> = {}): MiembroOficina => ({ id, nombre, apodo: '', cargo: '', lugar: '', foto: 0, avatar: null, enLinea, ...extra });

describe('reparto de miembros', () => {
  const todos = [m(1, 'Yo', true), m(2, 'Ana Gómez', true), m(3, 'Luis Pérez', false, { cargo: 'Diseñador' }), m(4, 'Sofía Ríos', false, { apodo: 'Sofi' }), m(5, 'Camilo', true)];

  it('quien no se ve en la sala y no está en línea va a «Sin conexión»; quien sí está en línea en otra sala va aparte', () => {
    const r = repartirMiembros(todos, new Set([1, 2]));
    expect(r.sinConexion.map((x) => x.id)).toEqual([3, 4]);
    expect(r.enOtraSala.map((x) => x.id)).toEqual([5]);
  });
  it('quienes se ven en tu sala no aparecen en ninguno de los dos grupos', () => {
    const r = repartirMiembros(todos, new Set([1, 2, 3, 4, 5]));
    expect(r).toEqual({ sinConexion: [], enOtraSala: [] });
  });
  it('filtra por nombre, apodo y cargo sin tildes', () => {
    const v = new Set([1]);
    expect(repartirMiembros(todos, v, 'sofi').sinConexion.map((x) => x.id)).toEqual([4]);
    expect(repartirMiembros(todos, v, 'diseñador').sinConexion.map((x) => x.id)).toEqual([3]);
    expect(repartirMiembros(todos, v, 'perez').sinConexion.map((x) => x.id)).toEqual([3]);
    expect(repartirMiembros(todos, v, 'nadie')).toEqual({ sinConexion: [], enOtraSala: [] });
  });
});
