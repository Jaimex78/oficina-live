import { describe, expect, it } from 'vitest';
import { INVENTARIO, objetoPorId } from '@ol/shared';
import { LOTE_13, LOTE_13_ARBOLES, LOTE_13_EXTERIOR, LOTE_13_INTELIGENTES, LOTE_13_JARDIN, LOTE_13_JUEGOS } from '../../shared/src/inventario-lotes/l13';
import { framesEsperados, itemsDe, verificarObjeto } from '../src/objetos/comunes';
import { FAMILIAS_LOTE_13, GRUPOS_LOTE_13, construirLote13, familiaDeRevision, objetosDelLote13 } from '../src/objetos/l13-todo';
import { OMITIDAS, escenasDelLote13 } from '../src/objetos/l13-escenas';
import { Lienzo, empaquetar, validarAtlas, validarLienzo } from '../src/nucleo';
import { soloAlfaBinario } from './ayudas';

const lote = construirLote13();
const objetos = objetosDelLote13();
const AZUL_OFICINA_0 = '#141828';
const SOMBRA_CERCA = '#46557A'; // azul-oficina-2

const cuadro = (id: string): Lienzo => lote.cuadros.get(id) as Lienzo;
/** El cuadro de la variante base de un objeto de orientación única. */
const base = (id: string): Lienzo => cuadro(objetoPorId(id)?.frames['U']?.['base'] as string);

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

describe('lote 13: lista y cuadros', () => {
  it('cubre el exterior y los juegos de Gather por familias: 8 árboles, 11 de agua y plantas, 22 de exterior, 13 juegos y 3 inteligentes', () => {
    expect(LOTE_13_ARBOLES).toHaveLength(8);
    expect(LOTE_13_JARDIN).toHaveLength(11);
    expect(LOTE_13_EXTERIOR).toHaveLength(22);
    expect(LOTE_13_JUEGOS).toHaveLength(13);
    expect(LOTE_13_INTELIGENTES).toHaveLength(3);
    expect(objetos).toHaveLength(LOTE_13.length);
    expect(objetos).toHaveLength(57);
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
    expect(Object.keys(GRUPOS_LOTE_13)).toHaveLength(4);
  });

  it('cada objeto cae en una hoja de revisión y todas las hojas tienen objetos', () => {
    for (const f of FAMILIAS_LOTE_13) expect(objetos.filter((o) => familiaDeRevision(o) === f).length, f).toBeGreaterThan(0);
  });

  it('los árboles grandes son de 2 x 2 con 64 de alto y bloquean solo el tronco; los pequeños, de 1 x 1', () => {
    for (const id of ['arce', 'sauce-lloron', 'cerezo', 'palmera-coco', 'arbol-invierno', 'pino-nevado']) {
      const o = objetoPorId(id);
      expect([o?.ancho, o?.alto, o?.sobresale], id).toEqual([2, 2, 64]);
      expect(o?.bloquea, id).toEqual([[0, 1], [1, 1]]);
      expect([base(id).ancho, base(id).alto], id).toEqual([64, 128]);
    }
    for (const id of ['pino-chico', 'pino-chico-nevado']) expect([objetoPorId(id)?.ancho, objetoPorId(id)?.alto, objetoPorId(id)?.sobresale], id).toEqual([1, 1, 64]);
  });

  it('los juegos abren un enlace, tienen nombre en español y son genéricos (sin marcas)', () => {
    for (const o of LOTE_13_JUEGOS) {
      expect(o.categoria, o.id).toBe('juegos');
      expect(o.interaccion, o.id).toBe('enlace');
    }
    const texto = LOTE_13_JUEGOS.map((o) => `${o.id} ${o.nombre}`).join(' ').toLowerCase();
    for (const marca of ['tetris', 'codenames', 'github', 'dominion', 'werewolf', 'draw battle', 'top 4', 'guess me', 'set ']) expect(texto).not.toContain(marca);
    const pared = objetoPorId('pizarra-pared');
    expect(pared?.montado).toBe(true);
    expect(pared?.orientaciones).toEqual(['S', 'E', 'O']);
    expect(objetoPorId('pizarra-pie')?.montado).toBeUndefined();
  });

  it('los objetos inteligentes de adorno son apoyados, no bloquean y no abren nada todavía', () => {
    for (const o of LOTE_13_INTELIGENTES) {
      expect(o.categoria, o.id).toBe('colaboracion');
      expect(o.apoyado, o.id).toBe(true);
      expect(o.bloquea, o.id).toEqual([]);
      expect(o.interaccion, o.id).toBe('ninguna');
    }
  });

  it('lo que da luz lleva emisor y los fuegos artificiales llevan su colección', () => {
    for (const id of ['fogata-pozo', 'fogata-abierta', 'antorcha-tiki', 'linterna-piedra']) expect(objetoPorId(id)?.emisor, id).toBeDefined();
    expect(objetoPorId('caja-fuegos')?.coleccion).toBe('ano-nuevo');
    expect(objetoPorId('cohete-fuegos')?.coleccion).toBe('ano-nuevo');
  });

  it('no repite lo que ya existía ni trae piezas religiosas', () => {
    for (const id of ['abedul', 'pino', 'fuente', 'calabaza-grande', 'calabazas', 'tumba', 'muneco-nieve', 'espantapajaros', 'cerca', 'arbol-seco']) expect(objetoPorId(id)?.lote, id).not.toBe(13);
    const ids = objetos.map((o) => o.id).join(' ');
    for (const prohibido of ['menora', 'menorah', 'hanukkah', 'cruz']) expect(ids).not.toContain(prohibido);
  });

  it('todo el lote cabe en un solo atlas de 4096 px de alto o menos', () => {
    const { atlas, frames } = empaquetar(itemsDe(lote.terminados, lote.cuadros), { anchoMax: 1024, relleno: 2 });
    expect(validarAtlas(atlas, frames, { relleno: 2 })).toEqual([]);
    expect(atlas.alto).toBeLessThanOrEqual(4096);
  });

  it('la escena de revisión coloca todas las piezas', () => {
    const escenas = escenasDelLote13(lote.cuadros);
    expect(OMITIDAS).toEqual([]);
    expect(escenas.map((e) => e.nombre)).toEqual(['sala', 'comparacion']);
  });
});

describe('lote 13: calidad de cada cuadro', () => {
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

  it('las tres orientaciones de la pizarra de pared son distintas entre sí', () => {
    const o = objetoPorId('pizarra-pared');
    const hu = ['S', 'E', 'O'].map((k) => cuadro(o?.frames[k]?.['base'] as string).huella());
    expect(new Set(hu).size).toBe(3);
  });

  it('los objetos de piso llevan sombra proyectada hacia la derecha y abajo', () => {
    for (const id of ['arce', 'estanque-koi', 'parrilla-bola', 'carro-hot-dogs', 'juego-bloques', 'gong', 'mesa-palabras']) {
      const l = base(id);
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
    const otra = construirLote13();
    for (const [id, l] of lote.cuadros) expect(otra.cuadros.get(id)?.huella(), id).toBe(l.huella());
  });
});
