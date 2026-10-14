import { describe, expect, it } from 'vitest';
import { colocar, crearZona, esFallo, hayErrores, objetoPorId, pintarPiso, reubicarApoyado, salaVacia, validarMapa, type MapaOficina, type SalaMapa } from '../src';

function base(): SalaMapa {
  const celdas: [number, number][] = [];
  for (let y = 0; y < 16; y++) for (let x = 0; x < 20; x++) celdas.push([x, y]);
  const r = pintarPiso(salaVacia('s', 'Sala', 20, 16), celdas, 'piso-madera-clara');
  if (esFallo(r)) throw new Error(r.error);
  return { ...r, llegadas: [{ x: 1, y: 1 }] };
}
const poner = (s: SalaMapa, objeto: string, x: number, y: number, orientacion?: 'S' | 'E' | 'N' | 'O' | 'U'): SalaMapa => {
  const r = colocar(s, { objeto, x, y, ...(orientacion ? { orientacion } : {}), sinApoyo: true });
  if (esFallo(r)) throw new Error(`${objeto}: ${r.error}`);
  return r.sala;
};
/** Un corcho colgado cuya pared ya no está (un mapa viejo o editado a mano). */
const conCorchoSinPared = (s: SalaMapa): SalaMapa => {
  const c = poner(poner(s, 'pared-lisa', 6, 6, 'U'), 'corcho', 6, 6, 'S');
  return { ...c, colocaciones: c.colocaciones.filter((q) => q.objeto !== 'pared-lisa') };
};
const mapaDe = (s: SalaMapa): MapaOficina => ({ version: 1, nombre: 'P', salaInicial: 's', salas: [s] });
const codigos = (s: SalaMapa) => validarMapa(mapaDe(s)).map((p) => p.codigo);

describe('revisión de realismo', () => {
  it('un mapa bien armado no trae avisos de realismo', () => {
    let s = poner(base(), 'escritorio-oficina', 5, 5, 'S');
    s = poner(s, 'taza-regular', 6, 5);
    s = poner(s, 'silla-oficina', 6, 6, 'N');
    const p = validarMapa(mapaDe(s));
    expect(p.filter((q) => /apoyado|silla|montado|sanitario|encerrada/.test(q.codigo))).toEqual([]);
  });

  it('apoyado sin mueble debajo: aviso con «Arreglar» si hay una mesa donde ponerlo', () => {
    let s = poner(base(), 'escritorio-oficina', 5, 5, 'S');
    s = poner(s, 'taza-regular', 12, 9);
    const p = validarMapa(mapaDe(s)).find((q) => q.codigo === 'apoyado_sin_mueble');
    expect(p?.nivel).toBe('aviso');
    expect(p?.arreglo).toBe('apoyado');
    const taza = s.colocaciones.find((c) => c.objeto === 'taza-regular')!;
    const dest = reubicarApoyado(s, taza)!;
    expect(dest).not.toBeNull();
    const r = colocar({ ...s, colocaciones: s.colocaciones.filter((c) => c.id !== taza.id) }, { objeto: 'taza-regular', x: dest.x, y: dest.y });
    expect(esFallo(r)).toBe(false);
  });

  it('apoyado sin mueble y sin mesa en la sala: aviso sin «Arreglar»', () => {
    const s = poner(base(), 'taza-regular', 12, 9);
    const p = validarMapa(mapaDe(s)).find((q) => q.codigo === 'apoyado_sin_mueble');
    expect(p?.arreglo).toBeUndefined();
  });

  it('apoyado que no cabe en la tapa', () => {
    let s = poner(base(), 'escritorio-oficina', 5, 5, 'S');
    s = poner(s, 'jarron-meiji', 6, 5);
    const p = validarMapa(mapaDe(s)).find((q) => q.codigo === 'apoyado_no_cabe');
    expect(p?.mensaje).toMatch(/no cabe/);
  });

  it('silla de mesa suelta: aviso y arreglo; las butacas, sofás y puffs no avisan', () => {
    let s = poner(base(), 'escritorio-oficina', 5, 5, 'S');
    s = poner(s, 'silla-comedor', 12, 9, 'S');
    s = poner(s, 'butaca', 14, 9, 'S');
    s = poner(s, 'sofa-2', 8, 12, 'S');
    s = poner(s, 'puff', 16, 12);
    const sueltas = validarMapa(mapaDe(s)).filter((q) => q.codigo === 'silla_suelta');
    expect(sueltas).toHaveLength(1);
    expect(sueltas[0]?.arreglo).toBe('silla');
    // Pegada al escritorio ya no avisa.
    const ok = poner(base(), 'escritorio-oficina', 5, 5, 'S');
    const con = poner(ok, 'silla-comedor', 6, 6, 'N');
    expect(codigos(con)).not.toContain('silla_suelta');
  });

  it('objeto de pared sin pared detrás', () => {
    const s = conCorchoSinPared(base());
    expect(codigos(s)).toContain('montado_sin_pared');
  });

  it('sanitario fuera de una zona de baño; dentro de una zona «Baño» no avisa', () => {
    const s = poner(base(), 'sanitario', 10, 10, 'S');
    expect(codigos(s)).toContain('sanitario_fuera_de_bano');
    const z = crearZona(s, { nombre: 'Baño de mujeres', tipo: 'privada', rect: { x: 8, y: 8, w: 4, h: 4 } });
    if (esFallo(z)) throw new Error(z.error);
    expect(codigos(z.sala)).not.toContain('sanitario_fuera_de_bano');
  });

  it('sanitario sin cubículo: avisa sin pared o divisor a los lados y se calla con cubículo', () => {
    const zona = (s: SalaMapa) => {
      const z = crearZona(s, { nombre: 'Baño de hombres', tipo: 'privada', rect: { x: 6, y: 6, w: 8, h: 6 } });
      if (esFallo(z)) throw new Error(z.error);
      return z.sala;
    };
    // Suelto en medio de un baño: avisa.
    const suelto = zona(poner(base(), 'sanitario', 10, 8, 'S'));
    expect(codigos(suelto)).toContain('sanitario_sin_cubiculo');
    expect(validarMapa(mapaDe(suelto)).find((q) => q.codigo === 'sanitario_sin_cubiculo')?.nivel).toBe('aviso');
    // Con divisor a la izquierda y pared a la derecha: no avisa.
    let con = poner(base(), 'sanitario', 10, 8, 'S');
    con = poner(con, 'divisor-cubiculo', 9, 8, 'U');
    con = poner(con, 'pared-lisa', 11, 8, 'U');
    expect(codigos(zona(con))).not.toContain('sanitario_sin_cubiculo');
    // Con un solo lado cerrado sigue avisando.
    const uno = zona(poner(poner(base(), 'sanitario', 10, 8, 'S'), 'divisor-cubiculo', 9, 8, 'U'));
    expect(codigos(uno)).toContain('sanitario_sin_cubiculo');
    // De lado (mira al este): los lados son arriba y abajo.
    let lado = poner(base(), 'sanitario', 10, 8, 'E');
    lado = poner(lado, 'divisor-cubiculo', 10, 7, 'U');
    lado = poner(lado, 'divisor-cubiculo', 10, 9, 'U');
    expect(codigos(zona(lado))).not.toContain('sanitario_sin_cubiculo');
    // El urinario no lleva cubículo.
    expect(codigos(zona(poner(poner(base(), 'pared-lisa', 10, 7, 'U'), 'urinario', 10, 7, 'S')))).not.toContain('sanitario_sin_cubiculo');
  });

  it('casilla libre encerrada: las que nadie alcanzaría caminando', () => {
    let s = base();
    for (const [x, y] of [[8, 8], [9, 8], [10, 8], [8, 9], [10, 9], [8, 10], [9, 10], [10, 10]] as const) s = poner(s, 'pared-lisa', x, y, 'U');
    const p = validarMapa(mapaDe(s)).find((q) => q.codigo === 'casilla_encerrada');
    expect(p?.nivel).toBe('aviso');
    expect(p?.x).toBe(9);
    expect(p?.y).toBe(9);
  });

  it('los avisos de realismo nunca son errores: el mapa se puede publicar', () => {
    let s = poner(base(), 'taza-regular', 12, 9);
    s = poner(s, 'silla-comedor', 3, 12, 'S');
    s = conCorchoSinPared(s);
    s = poner(s, 'sanitario', 10, 2, 'S');
    expect(hayErrores(validarMapa(mapaDe(s)))).toBe(false);
    expect(objetoPorId('corcho')).toBeDefined();
  });
});
