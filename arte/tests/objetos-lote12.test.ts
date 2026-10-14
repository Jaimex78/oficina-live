import { describe, expect, it } from 'vitest';
import { INVENTARIO, objetoPorId } from '@ol/shared';
import { LOTE_12, LOTE_12_ARTE, LOTE_12_LUCES, LOTE_12_OTROS, LOTE_12_PLANTAS, LOTE_12_VENTANAS } from '../../shared/src/inventario-lotes/l12';
import { framesEsperados, itemsDe, verificarObjeto } from '../src/objetos/comunes';
import { FAMILIAS_LOTE_12, GRUPOS_LOTE_12, construirLote12, familiaDeRevision, objetosDelLote12 } from '../src/objetos/l12-todo';
import { OMITIDAS, escenasDelLote12 } from '../src/objetos/l12-escenas';
import { muroLiso } from '../src/objetos/l1-paredes';
import { Lienzo, empaquetar, validarAtlas, validarLienzo } from '../src/nucleo';
import { soloAlfaBinario } from './ayudas';

const lote = construirLote12();
const objetos = objetosDelLote12();
const AZUL_OFICINA_0 = '#141828';

const cuadro = (id: string): Lienzo => lote.cuadros.get(id) as Lienzo;
const esVentana = (id: string): boolean => objetoPorId(id)?.pared === 'abertura';

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

/** Cuántos píxeles de las filas `[y0, y1)` difieren entre dos lienzos de igual ancho. */
function diferenciasEnFilas(a: Lienzo, b: Lienzo, y0: number, y1: number): number {
  let n = 0;
  for (let y = y0; y < y1; y++) for (let x = 0; x < a.ancho; x++) if (a.leerHex(x, y) !== b.leerHex(x, y)) n++;
  return n;
}

describe('lote 12: lista y cuadros', () => {
  it('cubre los objetos de pared de Gather por familias', () => {
    expect(LOTE_12_VENTANAS).toHaveLength(12);
    expect(LOTE_12_ARTE).toHaveLength(31);
    expect(LOTE_12_LUCES).toHaveLength(7);
    expect(LOTE_12_PLANTAS).toHaveLength(7);
    expect(LOTE_12_OTROS).toHaveLength(20);
    expect(objetos).toHaveLength(LOTE_12.length);
    expect(objetos).toHaveLength(77);
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
    expect(Object.keys(GRUPOS_LOTE_12)).toHaveLength(5);
  });

  it('cada objeto cae en una hoja de revisión y todas las hojas tienen objetos', () => {
    for (const f of FAMILIAS_LOTE_12) expect(objetos.filter((o) => familiaDeRevision(o) === f).length, f).toBeGreaterThan(0);
  });

  it('todo lleva las tres orientaciones de pared; lo colgado no bloquea y las ventanas son aberturas', () => {
    for (const o of objetos) {
      expect(o.orientaciones, o.id).toEqual(['S', 'E', 'O']);
      if (esVentana(o.id)) {
        expect(o.categoria, o.id).toBe('paredes');
        expect(o.ventana, o.id).toBeDefined();
        expect([o.ancho, o.alto, o.sobresale], o.id).toEqual([1, 1, 32]);
        expect(o.montado, o.id).toBeUndefined();
      } else {
        expect(o.montado, o.id).toBe(true);
        expect(o.bloquea, o.id).toEqual([]);
      }
    }
  });

  it('las piezas de fiesta tienen su colección y no se repite lo que ya existía', () => {
    expect(objetoPorId('bandera-colombia-pared')?.coleccion).toBe('colombia');
    expect(objetoPorId('banderines-halloween')?.coleccion).toBe('halloween');
    expect(objetoPorId('trenza-ajo')?.coleccion).toBe('halloween');
    expect(objetoPorId('copos-pared')?.coleccion).toBe('navidad');
    for (const id of ['reloj-pared', 'tv-pared', 'corcho', 'cuadro-chico', 'cuadro-grande', 'cuadro-mariposas', 'espejo', 'corona-navidena', 'guirnalda', 'calcetin-chimenea', 'bandera-colombia', 'chimenea']) expect(objetoPorId(id)?.lote, id).not.toBe(12);
  });

  it('no hay animales disecados ni piezas de otros países o de festividades religiosas', () => {
    const ids = objetos.map((o) => o.id).join(' ');
    for (const prohibido of ['ciervo', 'murcielago-diseca', 'canada', 'usa', 'eid', 'cruz', 'japon', 'juneteenth', 'trebol', 'tio-sam', 'caballo', 'prosperidad', 'maple', 'pansexual', 'bisexual', 'lesbiana', 'transgenero', 'asexual', 'labrys', 'no-binaria']) expect(ids).not.toContain(prohibido);
  });

  it('todo el lote cabe en un solo atlas de 4096 px de alto o menos', () => {
    const { atlas, frames } = empaquetar(itemsDe(lote.terminados, lote.cuadros), { anchoMax: 1024, relleno: 2 });
    expect(validarAtlas(atlas, frames, { relleno: 2 })).toEqual([]);
    expect(atlas.alto).toBeLessThanOrEqual(4096);
  });

  it('la escena de revisión coloca todas las piezas', () => {
    const escenas = escenasDelLote12(lote.cuadros);
    expect(OMITIDAS).toEqual([]);
    expect(escenas.map((e) => e.nombre)).toEqual(['sala', 'comparacion']);
  });
});

describe('lote 12: calidad de cada cuadro', () => {
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

  it('todo colgante lleva el contorno azul marino de Gather', () => {
    for (const [id, l] of lote.cuadros) expect(l.colores().has(AZUL_OFICINA_0), id).toBe(true);
  });

  it('las variantes de color no son idénticas a la base, ni de frente ni de lado', () => {
    for (const o of objetos) {
      if (o.variantes.length < 2) continue;
      for (const [clave, porVariante] of Object.entries(o.frames)) {
        const base = cuadro(porVariante['base'] as string);
        for (const [v, id] of Object.entries(porVariante)) if (v !== 'base') expect(cuadro(id).huella(), `${o.id} ${clave} ${v}`).not.toBe(base.huella());
      }
    }
  });

  it('las tres orientaciones de cada objeto son distintas entre sí', () => {
    for (const o of objetos) {
      const s = cuadro(o.frames['S']?.['base'] as string).huella();
      const e = cuadro(o.frames['E']?.['base'] as string).huella();
      const w = cuadro(o.frames['O']?.['base'] as string).huella();
      expect(new Set([s, e, w]).size, o.id).toBe(3);
    }
  });

  it('los colgantes de lado son placas pegadas a la franja de la tapa (columnas 5 a 25) y miran hacia su lado', () => {
    for (const o of objetos.filter((x) => !esVentana(x.id))) {
      for (const [clave, x0, x1] of [['E', 20, 25], ['O', 5, 10]] as const) {
        const l = cuadro(o.frames[clave]?.['base'] as string);
        for (let y = 0; y < l.alto; y++) for (let x = 0; x < l.ancho; x++) if (l.esOpaco(x, y)) expect(x >= 5 && x <= 25, `${o.id} ${clave}`).toBe(true);
        const caja = l.cajaOpaca();
        expect(caja !== null && caja.x >= x0 - 1 && caja.x + caja.w - 1 <= x1 + 1, `${o.id} ${clave}`).toBe(true);
      }
    }
  });

  it('las ventanas encajan con las paredes vecinas: misma tapa de frente y misma mitad de abajo de lado', () => {
    const frente = muroLiso('0101');
    const lado = muroLiso('1010');
    for (const o of LOTE_12_VENTANAS) {
      expect(diferenciasEnFilas(cuadro(o.frames['S']?.['base'] as string), frente, 0, 16), `${o.id} S`).toBe(0);
      for (const c of ['E', 'O']) expect(diferenciasEnFilas(cuadro(o.frames[c]?.['base'] as string), lado, 32, 64), `${o.id} ${c}`).toBe(0);
    }
  });

  it('cada colgante lleva su sombra de 1 px abajo y a la derecha', () => {
    const SOMBRA_CERCA = '#46557A';
    for (const o of objetos.filter((x) => !esVentana(x.id))) {
      const l = cuadro(o.frames['S']?.['base'] as string);
      let abajoDerecha = 0;
      let arribaIzquierda = 0;
      for (let y = 0; y < l.alto; y++) {
        for (let x = 0; x < l.ancho; x++) {
          if (l.leerHex(x, y) !== SOMBRA_CERCA) continue;
          if (l.leerHex(x - 1, y) === AZUL_OFICINA_0 || l.leerHex(x, y - 1) === AZUL_OFICINA_0) abajoDerecha++;
          if (l.leerHex(x + 1, y) === AZUL_OFICINA_0 || l.leerHex(x, y + 1) === AZUL_OFICINA_0) arribaIzquierda++;
        }
      }
      expect(abajoDerecha, o.id).toBeGreaterThanOrEqual(arribaIzquierda);
    }
  });

  it('construir dos veces da exactamente los mismos píxeles', () => {
    const otra = construirLote12();
    for (const [id, l] of lote.cuadros) expect(otra.cuadros.get(id)?.huella(), id).toBe(l.huella());
  });
});
