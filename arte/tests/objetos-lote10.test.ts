import { describe, expect, it } from 'vitest';
import { INVENTARIO, objetoPorId } from '@ol/shared';
import { LOTE_10, LOTE_10_ARTE, LOTE_10_DEPORTES, LOTE_10_LAMPARAS, LOTE_10_PIEZAS, LOTE_10_PLANTAS, LOTE_10_TEMPORADA } from '../../shared/src/inventario-lotes/l10';
import { framesEsperados, itemsDe, verificarObjeto } from '../src/objetos/comunes';
import { FAMILIAS_LOTE_10, GRUPOS_LOTE_10, construirLote10, familiaDeRevision, objetosDelLote10 } from '../src/objetos/l10-todo';
import { OMITIDAS, escenasDelLote10 } from '../src/objetos/l10-escenas';
import { Lienzo, empaquetar, validarAtlas, validarLienzo } from '../src/nucleo';
import { soloAlfaBinario } from './ayudas';

const lote = construirLote10();
const objetos = objetosDelLote10();
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

describe('lote 10: lista y cuadros', () => {
  it('cubre la decoración de Gather por familias: 35 plantas, 15 lámparas, 18 de arte, 33 de aparatos y hogar, 16 deportes, 10 de temporada', () => {
    expect(LOTE_10_PLANTAS).toHaveLength(35);
    expect(LOTE_10_LAMPARAS).toHaveLength(15);
    expect(LOTE_10_ARTE).toHaveLength(18);
    expect(LOTE_10_PIEZAS).toHaveLength(33);
    expect(LOTE_10_DEPORTES).toHaveLength(16);
    expect(LOTE_10_TEMPORADA).toHaveLength(10);
    expect(objetos).toHaveLength(LOTE_10.length);
    expect(objetos).toHaveLength(127);
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
    expect(Object.keys(GRUPOS_LOTE_10)).toHaveLength(4);
  });

  it('cada objeto cae en una hoja de revisión y todas las hojas tienen objetos', () => {
    for (const f of FAMILIAS_LOTE_10) expect(objetos.filter((o) => familiaDeRevision(o) === f).length, f).toBeGreaterThan(0);
  });

  it('todo el lote es de orientación única y no repite lo que ya existía (mesa de ping pong y futbolín)', () => {
    for (const o of objetos) expect(o.orientaciones, o.id).toEqual(['U']);
    expect(objetoPorId('mesa-pingpong')?.lote).toBeLessThan(10);
    expect(objetoPorId('futbolin')?.lote).toBeLessThan(10);
  });

  it('lo pequeño va apoyado y no bloquea; lo que emite luz lleva emisor', () => {
    for (const o of objetos.filter((x) => x.apoyado === true)) expect(o.bloquea, o.id).toEqual([]);
    for (const id of ['lampara-arco', 'lampara-lava', 'candelabro-pie', 'farol-marroqui', 'calefactor']) expect(objetoPorId(id)?.emisor, id).toBeDefined();
    expect(objetoPorId('flecha-piso')?.capa).toBe('suelo');
  });

  it('las piezas de temporada llevan colección y las religiosas o de otros países no están', () => {
    for (const o of LOTE_10_TEMPORADA) expect(o.coleccion, o.id).toMatch(/^(halloween|navidad|pascua)$/);
    const ids = objetos.map((o) => o.id).join(' ');
    for (const prohibido of ['hanukkah', 'menorah', 'kwanzaa', 'kinara', 'eid', 'shofar', 'ofrenda', 'tzedaka', 'hagada', 'vuvuzela']) expect(ids).not.toContain(prohibido);
  });

  it('todo el lote cabe en un solo atlas de 4096 px de alto o menos', () => {
    const { atlas, frames } = empaquetar(itemsDe(lote.terminados, lote.cuadros), { anchoMax: 1024, relleno: 2 });
    expect(validarAtlas(atlas, frames, { relleno: 2 })).toEqual([]);
    expect(atlas.alto).toBeLessThanOrEqual(4096);
  });

  it('la escena de revisión coloca todas las piezas', () => {
    const escenas = escenasDelLote10(lote.cuadros);
    expect(OMITIDAS).toEqual([]);
    expect(escenas.map((e) => e.nombre)).toEqual(['sala', 'comparacion']);
  });
});

describe('lote 10: calidad de cada cuadro', () => {
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

  it('los objetos de piso llevan sombra proyectada hacia la derecha y abajo', () => {
    for (const id of ['monstera', 'ficus', 'busto-mujer', 'barril-grande', 'cascanueces-gigante', 'caballete-cartel']) {
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
    const otra = construirLote10();
    for (const [id, l] of lote.cuadros) expect(otra.cuadros.get(id)?.huella(), id).toBe(l.huella());
  });
});
