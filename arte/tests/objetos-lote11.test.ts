import { describe, expect, it } from 'vitest';
import { INVENTARIO, objetoPorId } from '@ol/shared';
import { LOTE_11, LOTE_11_ALMUERZO, LOTE_11_BEBIDAS, LOTE_11_CAFETERIA, LOTE_11_DULCES } from '../../shared/src/inventario-lotes/l11';
import { framesEsperados, itemsDe, verificarObjeto } from '../src/objetos/comunes';
import { FAMILIAS_LOTE_11, GRUPOS_LOTE_11, construirLote11, familiaDeRevision, objetosDelLote11 } from '../src/objetos/l11-todo';
import { OMITIDAS, escenasDelLote11 } from '../src/objetos/l11-escenas';
import { Lienzo, empaquetar, validarAtlas, validarLienzo } from '../src/nucleo';
import { soloAlfaBinario } from './ayudas';

const lote = construirLote11();
const objetos = objetosDelLote11();
const AZUL_OFICINA_0 = '#141828';
const SOMBRA_CERCA = '#46557A'; // azul-oficina-2

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

describe('lote 11: lista y cuadros', () => {
  it('cubre la comida y bebida de Gather por familias: 17 de cafetería, 21 bebidas, 26 de almuerzo, 14 de frutas, postres y platos colombianos', () => {
    expect(LOTE_11_CAFETERIA).toHaveLength(17);
    expect(LOTE_11_BEBIDAS).toHaveLength(21);
    expect(LOTE_11_ALMUERZO).toHaveLength(26);
    expect(LOTE_11_DULCES).toHaveLength(14);
    expect(objetos).toHaveLength(LOTE_11.length);
    expect(objetos).toHaveLength(78);
  });

  it('todos los objetos están terminados: dibuja exactamente los cuadros que promete el inventario', () => {
    expect(lote.pendientes.map((o) => o.id)).toEqual([]);
    const esperados = objetos.flatMap((o) => framesEsperados(o).map((f) => f.id));
    expect([...lote.cuadros.keys()].sort()).toEqual([...esperados].sort());
    for (const o of objetos) expect(verificarObjeto(o, lote.cuadros), o.id).toEqual([]);
  });

  it('ningún cuadro del lote se repite en los demás lotes ni dentro del inventario', () => {
    const todos = INVENTARIO.flatMap((o) => Object.values(o.frames).flatMap((m) => Object.values(m)));
    expect(new Set(todos).size).toBe(todos.length);
    expect(Object.keys(GRUPOS_LOTE_11)).toHaveLength(4);
  });

  it('cada objeto cae en una hoja de revisión y todas las hojas tienen objetos', () => {
    for (const f of FAMILIAS_LOTE_11) expect(objetos.filter((o) => familiaDeRevision(o) === f).length, f).toBeGreaterThan(0);
  });

  it('todo el lote es de orientación única, de la categoría cocina, de 1 x 1 y no repite lo que ya existía', () => {
    for (const o of objetos) {
      expect(o.orientaciones, o.id).toEqual(['U']);
      expect(o.categoria, o.id).toBe('cocina');
      expect([o.ancho, o.alto], o.id).toEqual([1, 1]);
    }
    for (const id of ['taza-regular', 'taza-ancha', 'taza-alta', 'vaso-para-llevar', 'manzana', 'cafetera', 'frutero', 'bowl-comida', 'caja-chocolates']) expect(objetoPorId(id)?.lote, id).toBeLessThan(11);
  });

  it('todo va apoyado y no bloquea, salvo la estación de espresso (de piso); la estación emite luz', () => {
    for (const o of objetos.filter((x) => x.id !== 'estacion-espresso')) {
      expect(o.apoyado, o.id).toBe(true);
      expect(o.bloquea, o.id).toEqual([]);
    }
    const estacion = objetoPorId('estacion-espresso');
    expect(estacion?.apoyado).toBeUndefined();
    expect(estacion?.bloquea).toEqual([[0, 0]]);
    expect(estacion?.emisor).toBeDefined();
  });

  it('no hay platos de festividades religiosas ni de otros países', () => {
    const ids = objetos.map((o) => o.id).join(' ');
    for (const prohibido of ['jala', 'challah', 'sufganiyot', 'seder', 'matza', 'latke', 'kiddush', 'kidush', 'unidad', 'banh', 'luna', 'cruz', 'conejo', 'arce', 'canada', 'knafeh']) expect(ids).not.toContain(prohibido);
  });

  it('todo el lote cabe en un solo atlas de 4096 px de alto o menos', () => {
    const { atlas, frames } = empaquetar(itemsDe(lote.terminados, lote.cuadros), { anchoMax: 1024, relleno: 2 });
    expect(validarAtlas(atlas, frames, { relleno: 2 })).toEqual([]);
    expect(atlas.alto).toBeLessThanOrEqual(4096);
  });

  it('la escena de revisión coloca todas las piezas', () => {
    const escenas = escenasDelLote11(lote.cuadros);
    expect(OMITIDAS).toEqual([]);
    expect(escenas.map((e) => e.nombre)).toEqual(['sala', 'comparacion']);
  });
});

describe('lote 11: calidad de cada cuadro', () => {
  it('solo usa colores de la paleta y alfa 0 o 255', () => {
    for (const [id, l] of lote.cuadros) {
      expect(validarLienzo(l, { noVacio: true }), id).toEqual([]);
      expect(soloAlfaBinario(l), id).toBe(true);
    }
  });

  it('no deja píxeles sueltos', () => {
    for (const [id, l] of lote.cuadros) expect(pixelesSueltos(l), id).toBe(0);
  });

  it('usa pocos colores por cuadro', () => {
    for (const [id, l] of lote.cuadros) expect(l.colores().size, id).toBeLessThanOrEqual(45);
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

  it('el objeto de piso lleva sombra proyectada hacia la derecha y abajo', () => {
    for (const id of ['estacion-espresso']) {
      const l = cuadro(id);
      let derechaOAbajo = 0;
      let izquierdaOArriba = 0;
      for (let y = 0; y < l.alto; y++) {
        for (let x = 0; x < l.ancho; x++) {
          const hex = l.leerHex(x, y);
          if (hex !== SOMBRA_CERCA && hex !== '#6677A0') continue;
          if (l.leerHex(x - 1, y) === AZUL_OFICINA_0 || l.leerHex(x, y - 1) === AZUL_OFICINA_0) derechaOAbajo++;
          if (l.leerHex(x + 1, y) === AZUL_OFICINA_0 || l.leerHex(x, y + 1) === AZUL_OFICINA_0) izquierdaOArriba++;
        }
      }
      expect(derechaOAbajo, id).toBeGreaterThan(izquierdaOArriba);
    }
  });

  it('construir dos veces da exactamente los mismos píxeles', () => {
    const otra = construirLote11();
    for (const [id, l] of lote.cuadros) expect(otra.cuadros.get(id)?.huella(), id).toBe(l.huella());
  });
});
