import { describe, expect, it } from 'vitest';
import { ConstructorSala, INVENTARIO, banoHombres, banoMujeres, hayErrores, objetoPorId, validarMapa } from '@ol/shared';
import { LOTE_14, LOTE_14_ABERTURAS, LOTE_14_COLGADOS, LOTE_14_DIVISORES } from '../../shared/src/inventario-lotes/l14';
import { framesEsperados, itemsDe, verificarObjeto } from '../src/objetos/comunes';
import { FAMILIAS_LOTE_14, GRUPOS_LOTE_14, construirLote14, familiaDeRevision14, objetosDelLote14 } from '../src/objetos/l14-todo';
import { escenasDelLote14, salaDeBanos } from '../src/objetos/l14-escenas';
import { Lienzo, empaquetar, validarAtlas, validarLienzo } from '../src/nucleo';
import { soloAlfaBinario } from './ayudas';

const lote = construirLote14();
const objetos = objetosDelLote14();
const AZUL_OFICINA_0 = '#141828';

const cuadro = (id: string): Lienzo => lote.cuadros.get(id) as Lienzo;

function pixelesSueltos(l: Lienzo): number {
  let n = 0;
  for (let y = 0; y < l.alto; y++) {
    for (let x = 0; x < l.ancho; x++) {
      if (!l.esOpaco(x, y)) continue;
      let vecinos = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx !== 0 || dy !== 0) && l.esOpaco(x + dx, y + dy)) vecinos++;
      if (vecinos === 0) n++;
    }
  }
  return n;
}

describe('lote 14: lista y cuadros', () => {
  it('son 9 objetos de baño: 2 divisores, 1 puerta, 4 colgados, la papelera y el mesón', () => {
    expect(objetos).toHaveLength(LOTE_14.length);
    expect(objetos).toHaveLength(9);
    expect(LOTE_14_DIVISORES.map((o) => o.id)).toEqual(['divisor-cubiculo', 'divisor-urinario']);
    expect(LOTE_14_ABERTURAS.map((o) => o.id)).toEqual(['puerta-cubiculo']);
    expect(LOTE_14_COLGADOS.map((o) => o.id).sort()).toEqual(['dispensador-jabon', 'dispensador-papel', 'espejo-bano', 'secador-manos']);
    for (const o of objetos) expect(objetoPorId(o.id)?.grupo, o.id).toBe('banos');
  });

  it('todos los objetos están terminados: dibuja exactamente los cuadros que promete el inventario', () => {
    expect(lote.pendientes.map((o) => o.id)).toEqual([]);
    const esperados = objetos.flatMap((o) => framesEsperados(o).map((f) => f.id));
    expect([...lote.cuadros.keys()].sort()).toEqual([...esperados].sort());
    for (const o of objetos) expect(verificarObjeto(o, lote.cuadros), o.id).toEqual([]);
  });

  it('ningún id ni cuadro del lote se repite en los demás lotes ni dentro del inventario', () => {
    const ids = INVENTARIO.map((o) => o.id);
    expect(new Set(ids).size).toBe(ids.length);
    const todos = INVENTARIO.flatMap((o) => Object.values(o.frames).flatMap((m) => Object.values(m)));
    expect(new Set(todos).size).toBe(todos.length);
    expect(Object.keys(GRUPOS_LOTE_14)).toHaveLength(2);
  });

  it('cada objeto cae en una hoja de revisión y todas las hojas tienen objetos', () => {
    for (const f of FAMILIAS_LOTE_14) expect(objetos.filter((o) => familiaDeRevision14(o) === f).length, f).toBeGreaterThan(0);
  });

  it('los divisores se unen como paredes (16 máscaras, tres materiales) y la puerta es una abertura que se abre al cruzar', () => {
    for (const id of ['divisor-cubiculo', 'divisor-urinario']) {
      const o = objetoPorId(id);
      expect([o?.pared, o?.autotile, o?.categoria], id).toEqual(['muro', 'paredes4', 'paredes']);
      expect(o?.variantes.map((v) => v.id), id).toEqual(['base', 'azul', 'madera']);
      expect(Object.keys(o?.frames ?? {}), id).toHaveLength(16);
    }
    expect(objetoPorId('divisor-cubiculo')?.sobresale).toBe(16);
    const puerta = objetoPorId('puerta-cubiculo');
    expect([puerta?.pared, puerta?.interaccion, puerta?.bloquea, puerta?.orientaciones]).toEqual(['abertura', 'puerta', [], ['S']]);
    expect([cuadro(puerta?.frames['S']?.['base'] as string).ancho, cuadro(puerta?.frames['S']?.['base'] as string).alto]).toEqual([32, 48]);
  });

  it('el mesón deja libre el hueco del espejo: los cuadros miden 34 de alto y no traen el cristal del lavamanos', () => {
    const meson = objetoPorId('lavabo-meson');
    expect([meson?.ancho, meson?.alto, meson?.sobresale]).toEqual([2, 1, 2]);
    expect(cuadro(meson?.frames['S']?.['base'] as string).alto).toBe(34);
    expect(cuadro(meson?.frames['S']?.['base'] as string).colores().has('#D6F1FA')).toBe(false);
    expect(objetoPorId('lavamanos')?.lote).toBe(4);
  });

  it('todo el lote cabe en un solo atlas de 4096 px de alto o menos', () => {
    const { atlas, frames } = empaquetar(itemsDe(lote.terminados, lote.cuadros), { anchoMax: 1024, relleno: 2 });
    expect(validarAtlas(atlas, frames, { relleno: 2 })).toEqual([]);
    expect(atlas.alto).toBeLessThanOrEqual(4096);
  });

  it('la escena de revisión arma los dos baños sin avisos de cubículo', () => {
    const escenas = escenasDelLote14(lote.cuadros);
    expect(escenas.map((e) => e.nombre)).toEqual(['banos', 'comparacion']);
    const sala = salaDeBanos();
    expect(sala.colocaciones.filter((c) => c.objeto === 'sanitario')).toHaveLength(7);
    expect(sala.colocaciones.filter((c) => c.objeto === 'puerta-cubiculo')).toHaveLength(7);
  });
});

describe('lote 14: baños armados', () => {
  const armar = (): ReturnType<ConstructorSala['construir']> => {
    const b = new ConstructorSala('b', 'Baños', 14, 13).estricto();
    b.piso(0, 0, 14, 13, 'piso-cocina');
    b.muro(1, 1, 12, 1).muro(1, 6, 12, 6).muro(1, 11, 12, 11).muro(1, 1, 1, 11).muro(12, 1, 12, 11);
    b.poner('puerta-simple', 1, 5, 'E').poner('puerta-simple', 1, 10, 'E');
    banoHombres(b, 2, 2);
    banoMujeres(b, 2, 7);
    b.zona('Baño de hombres', 'privada', 2, 2, 10, 4).zona('Baño de mujeres', 'privada', 2, 7, 10, 4).llegadas({ x: 2, y: 5 });
    return b.construir();
  };

  it('hombres: 3 cubículos, 2 urinarios y 1 mesón de 2 lavabos; mujeres: 4 cubículos y 2 lavabos; sin avisos', () => {
    const sala = armar();
    const n = (id: string, y0: number, y1: number): number => sala.colocaciones.filter((c) => c.objeto === id && c.y >= y0 && c.y <= y1).length;
    expect([n('sanitario', 2, 5), n('urinario', 1, 5), n('lavabo-meson', 2, 5), n('puerta-cubiculo', 2, 5)]).toEqual([3, 2, 1, 3]);
    expect([n('sanitario', 7, 10), n('lavabo-meson', 7, 10), n('puerta-cubiculo', 7, 10)]).toEqual([4, 1, 4]);
    const p = validarMapa({ version: 1, nombre: 'P', salaInicial: 'b', salas: [sala] });
    expect(hayErrores(p)).toBe(false);
    expect(p.map((q) => `${q.codigo} ${q.mensaje}`)).toEqual([]);
  });
});

describe('lote 14: calidad de cada cuadro', () => {
  it('solo usa colores de la paleta y alfa 0 o 255', () => {
    for (const [id, l] of lote.cuadros) {
      expect(validarLienzo(l, { noVacio: true }), id).toEqual([]);
      expect(soloAlfaBinario(l), id).toBe(true);
    }
  });

  it('no deja píxeles sueltos', () => {
    for (const [id, l] of lote.cuadros) expect(pixelesSueltos(l), id).toBe(0);
  });

  it('todo objeto lleva el contorno azul marino de Gather', () => {
    for (const [id, l] of lote.cuadros) expect(l.colores().has(AZUL_OFICINA_0), id).toBe(true);
  });

  it('las variantes de color no son idénticas a la base', () => {
    for (const o of objetos) {
      if (o.variantes.length < 2) continue;
      for (const [clave, porVariante] of Object.entries(o.frames)) {
        const base = cuadro(porVariante['base'] as string);
        for (const [v, id] of Object.entries(porVariante)) if (v !== 'base') expect(cuadro(id).huella(), `${o.id} ${clave} ${v}`).not.toBe(base.huella());
      }
    }
  });

  it('las tres orientaciones de los colgantes son distintas entre sí', () => {
    for (const o of LOTE_14_COLGADOS) {
      const hu = ['S', 'E', 'O'].map((k) => cuadro(o.frames[k]?.['base'] as string).huella());
      expect(new Set(hu).size, o.id).toBe(3);
    }
  });

  it('construir dos veces da exactamente los mismos píxeles', () => {
    const otra = construirLote14();
    for (const [id, l] of lote.cuadros) expect(otra.cuadros.get(id)?.huella(), id).toBe(l.huella());
  });
});
