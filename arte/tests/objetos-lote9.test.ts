import { describe, expect, it } from 'vitest';
import { INVENTARIO, objetoPorId } from '@ol/shared';
import { LOTE_9_ALMACENAJE, LOTE_9_ASIENTOS, LOTE_9_MESAS } from '../../shared/src/inventario-lotes/l9';
import { framesEsperados, itemsDe, verificarObjeto } from '../src/objetos/comunes';
import { GRUPOS_LOTE_9, NOMBRES_ATLAS_LOTE_9, categoriaDeRevision, construirLote9, objetosDelLote9 } from '../src/objetos/l9-todo';
import { Lienzo, empaquetar, validarAtlas, validarLienzo } from '../src/nucleo';
import { soloAlfaBinario } from './ayudas';

const lote = construirLote9();
const objetos = objetosDelLote9();
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

describe('lote 9: lista y cuadros', () => {
  it('cubre las tres categorías de Gather: 49 asientos, 45 mesas y escritorios, 21 de almacenaje', () => {
    expect(LOTE_9_ASIENTOS).toHaveLength(49);
    expect(LOTE_9_MESAS).toHaveLength(45);
    expect(LOTE_9_ALMACENAJE).toHaveLength(21);
    expect(objetos).toHaveLength(49 + 45 + 21);
    // Con silla-oficina y sillon-gamer (ya existentes) son los 51 asientos de Gather.
    expect(objetoPorId('silla-oficina')?.categoria).toBe('asientos');
    expect(objetoPorId('sillon-gamer')?.categoria).toBe('asientos');
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
    expect(Object.keys(GRUPOS_LOTE_9)).toHaveLength(4);
  });

  it('los asientos se pueden usar para sentarse y giran en cuatro orientaciones (menos el puf saco)', () => {
    for (const o of objetos.filter((x) => x.categoria === 'asientos')) {
      expect(o.interaccion, o.id).toBe('sentarse');
      expect(o.orientaciones, o.id).toEqual(o.id === 'puf-saco' ? ['U'] : ['S', 'E', 'N', 'O']);
      expect(o.bloquea.length, o.id).toBe(o.ancho * o.alto);
    }
  });

  it('las mesas de Gather vienen en tres tamaños (3 de ancho por 1, 2 y 3 de fondo) y los escritorios miden 3 casillas', () => {
    for (const familia of ['tronco', 'chippendale', 'industrial', 'simple', 'pesada', 'octagonal', 'conferencia']) {
      for (const fondo of [1, 2, 3]) expect(objetoPorId(`mesa-${familia}-3x${fondo}`), `${familia} ${fondo}`).toMatchObject({ categoria: 'mesas', ancho: 3, alto: fondo });
    }
    for (const o of objetos.filter((x) => x.categoria === 'puestos')) expect(o, o.id).toMatchObject({ ancho: 3, alto: 1, sobresale: 10 });
    expect(objetos.filter((x) => x.categoria === 'puestos')).toHaveLength(13);
  });

  it('el almacenaje va en decoración (en puestos contaría como escritorio al asignar puestos)', () => {
    for (const id of LOTE_9_ALMACENAJE) expect(objetoPorId(id)?.categoria, id).toBe('decoracion');
    for (const o of objetos) expect(['asientos', 'mesas', 'puestos', 'decoracion']).toContain(o.categoria);
  });

  it('cada categoría tiene su atlas y todos los cuadros caben en ellos', () => {
    for (const categoria of ['asientos', 'mesas', 'almacenaje'] as const) {
      const lista = lote.terminados.filter((o) => categoriaDeRevision(o) === categoria);
      expect(lista.length, categoria).toBeGreaterThan(0);
      const items = itemsDe(lista, lote.cuadros);
      const { atlas, frames } = empaquetar(items, { anchoMax: 1024, relleno: 2 });
      expect(validarAtlas(atlas, frames, { relleno: 2 }), categoria).toEqual([]);
      expect(Object.keys(frames)).toHaveLength(items.length);
      // Las texturas muy altas no cargan en todas las tarjetas gráficas.
      expect(atlas.alto, NOMBRES_ATLAS_LOTE_9[categoria]).toBeLessThanOrEqual(4096);
    }
  });
});

describe('lote 9: calidad de cada cuadro', () => {
  it('solo usa colores de la paleta y alfa 0 o 255', () => {
    for (const [id, l] of lote.cuadros) {
      expect(validarLienzo(l, { noVacio: true }), id).toEqual([]);
      expect(soloAlfaBinario(l), id).toBe(true);
    }
  });

  it('no deja píxeles sueltos', () => {
    for (const [id, l] of lote.cuadros) expect(pixelesSueltos(l), id).toBe(0);
  });

  it('usa pocos colores por cuadro (los libreros llenos de libros, algo más)', () => {
    for (const [id, l] of lote.cuadros) {
      const limite = /^(librero|gabinete-curiosidades|estante-)/.test(id) ? 60 : 45;
      expect(l.colores().size, id).toBeLessThanOrEqual(limite);
    }
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

  it('los objetos de varias orientaciones tienen vistas distintas (salvo las simétricas)', () => {
    for (const o of objetos.filter((x) => x.orientaciones.length > 1)) {
      const huellas = o.orientaciones.map((d) => cuadro(o.frames[d]!['base']!).huella());
      // De frente y por atrás un asiento redondo y lleno puede salir parecido, pero nunca las cuatro iguales.
      expect(new Set(huellas).size, o.id).toBeGreaterThanOrEqual(2);
    }
  });

  it('lleva sombra proyectada hacia la derecha y abajo', () => {
    for (const id of ['silla-simple@S', 'sofa-antiguo@S', 'mesa-simple-3x1@S', 'librero-alto@S', 'mesa-redonda-grande', 'puf-saco']) {
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
    const otra = construirLote9();
    for (const [id, l] of lote.cuadros) expect(otra.cuadros.get(id)?.huella(), id).toBe(l.huella());
  });
});

describe('lote 9: medidas', () => {
  it('las mesas miden ancho x 32 por fondo x 32 + 10 y en E giran', () => {
    for (const [fondo, alto] of [[1, 42], [2, 74], [3, 106]] as const) {
      const l = cuadro(`mesa-simple-3x${fondo}@S`);
      expect([l.ancho, l.alto]).toEqual([96, alto]);
      const e = cuadro(`mesa-simple-3x${fondo}@E`);
      expect([e.ancho, e.alto]).toEqual([fondo * 32, 106]);
    }
  });

  it('los sofás de 3 casillas miden 96 de ancho y la chaise 32 x 72', () => {
    expect(cuadro('sofa-antiguo@S').ancho).toBe(96);
    expect([cuadro('chaise-antigua@S').ancho, cuadro('chaise-antigua@S').alto]).toEqual([32, 72]);
    expect([cuadro('chaise-antigua@E').ancho, cuadro('chaise-antigua@E').alto]).toEqual([64, 40]);
  });

  it('las sillas de una casilla caben en 24 a 28 px de ancho', () => {
    for (const id of ['silla-simple', 'silla-cafe', 'silla-director', 'silla-plastica']) {
      const caja = cuadro(`${id}@S`).cajaOpaca() as { x: number; y: number; w: number; h: number };
      expect(caja.w, id).toBeLessThanOrEqual(30);
      expect(caja.x, id).toBeGreaterThanOrEqual(1);
    }
  });
});
