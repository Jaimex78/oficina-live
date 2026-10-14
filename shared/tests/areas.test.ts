import { describe, expect, it } from 'vitest';
import {
  actualizarArea,
  aplicarEdicionDeArea,
  areasDeUsuario,
  cambioSoloDentroDelArea,
  colocacionesEditablesDeArea,
  colocar,
  crearArea,
  esFallo,
  plantillaNaos,
  objetoPorId,
  pintarPiso,
  quitarArea,
  salaVacia,
  validarMapa,
  type AreaPersonal,
  type SalaMapa,
} from '../src';

function salaBase(): SalaMapa {
  const celdas: [number, number][] = [];
  for (let y = 0; y < 12; y++) for (let x = 0; x < 16; x++) celdas.push([x, y]);
  const r = pintarPiso(salaVacia('s', 'Sala', 16, 12), celdas, 'piso-madera-clara');
  if (esFallo(r)) throw new Error(r.error);
  return { ...r, llegadas: [{ x: 1, y: 1 }] };
}
const poner = (s: SalaMapa, objeto: string, x: number, y: number, orientacion = objetoPorId(objeto)?.orientaciones[0] ?? 'U', variante = 'base'): SalaMapa => {
  const r = colocar(s, { objeto, x, y, orientacion, variante });
  if (esFallo(r)) throw new Error(`${objeto}: ${r.error}`);
  return r.sala;
};
const conArea = (s: SalaMapa, duenos: number[] = [7]): { sala: SalaMapa; area: AreaPersonal } => {
  const r = crearArea(s, { nombre: 'Escritorio de Ana', rect: { x: 4, y: 4, w: 4, h: 3 }, duenos });
  if (esFallo(r)) throw new Error(r.error);
  return r;
};

describe('áreas personales', () => {
  it('crea, actualiza y quita áreas, y valida que quepan en la sala', () => {
    const { sala, area } = conArea(salaBase());
    expect(sala.areas).toHaveLength(1);
    expect(esFallo(crearArea(sala, { nombre: 'Fuera', rect: { x: 14, y: 10, w: 5, h: 5 } }))).toBe(true);
    expect(esFallo(crearArea(sala, { nombre: '  ', rect: { x: 0, y: 0, w: 2, h: 2 } }))).toBe(true);
    const cambiada = actualizarArea(sala, area.id, { duenos: [7, 7, 9] });
    expect(esFallo(cambiada) ? [] : cambiada.areas?.[0]?.duenos).toEqual([7, 9]);
    expect(quitarArea(sala, area.id).areas).toEqual([]);
  });

  it('areasDeUsuario devuelve solo las áreas de esa cuenta', () => {
    const { sala } = conArea(salaBase());
    const mapa = { version: 1 as const, nombre: 'M', salaInicial: 's', salas: [sala] };
    expect(areasDeUsuario(mapa, 7)).toHaveLength(1);
    expect(areasDeUsuario(mapa, 8)).toHaveLength(0);
  });

  it('solo se pueden editar objetos permitidos, enteros dentro del área y que no sean el puesto asignado', () => {
    let { sala, area } = conArea(salaBase());
    sala = poner(sala, 'escritorio-individual', 4, 5);
    sala = poner(sala, 'silla-oficina', 4, 4);
    const silla = sala.colocaciones.find((c) => c.objeto === 'silla-oficina')!;
    sala = { ...sala, puestos: [{ id: 'u1', colocacion: silla.id, usuarioId: 7, etiqueta: 'Ana' }] };
    sala = poner(sala, 'planta-grande', 12, 2); // fuera del área
    sala = poner(sala, 'pared-lisa', 5, 6); // pared: del administrador
    const editables = colocacionesEditablesDeArea(sala, area).map((c) => c.objeto);
    expect(editables).toEqual(['escritorio-individual']);
  });

  it('aplicarEdicionDeArea cambia lo editable y deja lo demás igual', () => {
    let { sala, area } = conArea(salaBase());
    sala = poner(sala, 'escritorio-individual', 4, 5);
    sala = poner(sala, 'planta-grande', 12, 2);
    const r = aplicarEdicionDeArea(sala, area, [
      { objeto: 'escritorio-individual', x: 4, y: 5, orientacion: 'S', variante: 'base' },
      { objeto: 'pc-gamer', x: 4, y: 5, orientacion: 'S', variante: 'rojo' },
      { objeto: 'planta-mediana', x: 7, y: 5, orientacion: 'U', variante: 'base' },
    ]);
    expect(esFallo(r)).toBe(false);
    if (esFallo(r)) return;
    expect(r.sala.colocaciones.map((c) => c.objeto).sort()).toEqual(['escritorio-individual', 'pc-gamer', 'planta-grande', 'planta-mediana']);
    expect(cambioSoloDentroDelArea(sala, r.sala, area)).toBeNull();
  });

  it('rechaza objetos fuera del área, paredes, portales y demasiados objetos', () => {
    const { sala, area } = conArea(salaBase());
    const intento = (objeto: string, x: number, y: number) => aplicarEdicionDeArea(sala, area, [{ objeto, x, y, orientacion: objetoPorId(objeto)?.orientaciones[0] ?? 'U', variante: 'base' }]);
    expect(esFallo(intento('planta-grande', 12, 2))).toBe(true);
    expect(esFallo(intento('pared-lisa', 5, 5))).toBe(true);
    expect(esFallo(intento('portal', 5, 5))).toBe(true);
    expect(esFallo(intento('objeto-que-no-existe', 5, 5))).toBe(true);
    const muchos = Array.from({ length: 61 }, () => ({ objeto: 'planta-chica', x: 5, y: 5, orientacion: 'U' as const, variante: 'base' }));
    expect(esFallo(aplicarEdicionDeArea(sala, area, muchos))).toBe(true);
  });

  it('cambioSoloDentroDelArea detecta cualquier cambio que se salga', () => {
    let { sala, area } = conArea(salaBase());
    sala = poner(sala, 'planta-grande', 12, 2);
    const fuera = { ...sala, colocaciones: sala.colocaciones.filter((c) => c.x !== 12) };
    expect(cambioSoloDentroDelArea(sala, fuera, area)).not.toBeNull();
    const otroPiso = pintarPiso(sala, [[0, 0]], 'piso-baldosa');
    expect(esFallo(otroPiso) ? 'x' : cambioSoloDentroDelArea(sala, otroPiso, area)).not.toBeNull();
    const nuevaZona = { ...sala, zonas: [{ id: 'z', nombre: 'Z', tipo: 'abierta' as const, rect: { x: 0, y: 0, w: 2, h: 2 } }] };
    expect(cambioSoloDentroDelArea(sala, nuevaZona, area)).not.toBeNull();
    const dentro = poner(sala, 'planta-mediana', 5, 5);
    expect(cambioSoloDentroDelArea(sala, dentro, area)).toBeNull();
    const sinDuenos = { ...dentro, areas: [{ ...area, duenos: [] }] };
    expect(cambioSoloDentroDelArea(sala, sinDuenos, area)).not.toBeNull();
  });

  it('el mapa inicial trae un área por escritorio de Digital y es válido', () => {
    const mapa = plantillaNaos();
    expect(mapa.salas[0]?.areas?.length).toBe(8);
    expect(validarMapa(mapa).filter((p) => p.nivel === 'error')).toEqual([]);
  });

  it('validarMapa avisa de áreas que se cruzan y marca las que se salen', () => {
    const base = salaBase();
    const a = crearArea(base, { nombre: 'A', rect: { x: 2, y: 2, w: 4, h: 4 }, duenos: [1] });
    if (esFallo(a)) throw new Error(a.error);
    const b = crearArea(a.sala, { nombre: 'B', rect: { x: 4, y: 4, w: 4, h: 4 }, duenos: [2] });
    if (esFallo(b)) throw new Error(b.error);
    const problemas = validarMapa({ version: 1, nombre: 'M', salaInicial: 's', salas: [b.sala] });
    expect(problemas.some((p) => p.codigo === 'areas_cruzadas')).toBe(true);
    const rota = { ...b.sala, areas: [{ id: 'x', nombre: 'Rota', rect: { x: 14, y: 10, w: 9, h: 9 }, duenos: [1] }] };
    expect(validarMapa({ version: 1, nombre: 'M', salaInicial: 's', salas: [rota] }).some((p) => p.codigo === 'area_fuera')).toBe(true);
  });
});
