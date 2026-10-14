import { describe, expect, it } from 'vitest';
import { INVENTARIO, objetoPorId } from '@ol/shared';
import { framesEsperados, itemsDe, verificarObjeto } from '../src/objetos/comunes';
import { MATERIALES_ESCRITORIO } from '../src/objetos/l8-escritorio';
import { GRUPOS_LOTE_8, construirLote8, objetosDelLote8 } from '../src/objetos/l8-todo';
import { Lienzo, empaquetar, validarAtlas, validarLienzo } from '../src/nucleo';
import { soloAlfaBinario } from './ayudas';

const lote = construirLote8();
const objetos = objetosDelLote8();
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

function filaMasBajaOpaca(l: Lienzo): number {
  for (let y = l.alto - 1; y >= 0; y--) for (let x = 0; x < l.ancho; x++) if (l.esOpaco(x, y)) return y;
  return -1;
}

describe('lote 8: lista y cuadros', () => {
  it('el lote tiene los objetos del molde: 3 de puestos, los 29 de Gather y los accesorios', () => {
    expect(objetos.length).toBeGreaterThanOrEqual(46);
    const ids = objetos.map((o) => o.id);
    for (const id of ['escritorio-3x1', 'escritorio-3x2', 'silla-oficina', 'laptop-dock', 'portatil', 'monitor', 'pc-doble', 'pc-gamer', 'maquina-cnc', 'robot-garra', 'taza-regular', 'mochila']) {
      expect(ids, id).toContain(id);
    }
  });

  it('los 29 equipos de la categoría «Computadores y tecnología» de Gather tienen su equivalente', () => {
    const equivalentes = [
      'laptop-dock', 'portatil', 'consola-portatil', 'telefono-conferencia', 'impresora-3d-cerrada', 'maquina-pick-and-place', 'portatil-resistente',
      'pc-diseno-grafico', 'todo-en-uno', 'pc-hardware', 'impresora-oficina', 'robot-garra', 'tableta-soporte', 'maquina-cnc', 'pc-doble',
      'impresora-gran-formato', 'monitor', 'impresora-3d-abierta', 'pc-musico', 'computador-moderno', 'computador-escritorio', 'pc-audiofilo',
      'robot-herramienta', 'computador-retro-90s', 'pc-gamer', 'pc-desarrollador', 'pc-artista-digital', 'computador-retro-compacto', 'tableta-y-telefono',
    ];
    expect(new Set(equivalentes).size).toBe(29);
    for (const id of equivalentes) expect(objetoPorId(id)?.lote, id).toBe(8);
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
    expect(Object.keys(GRUPOS_LOTE_8).length).toBeGreaterThanOrEqual(6);
  });

  it('lo apoyado tiene solo la orientación S (menos monitor y portátil, que ya tenían cuatro) y no bloquea', () => {
    for (const o of objetos.filter((x) => x.apoyado === true)) {
      expect(o.bloquea, o.id).toEqual([]);
      if (o.id === 'monitor' || o.id === 'portatil') expect(o.orientaciones, o.id).toEqual(['S', 'E', 'N', 'O']);
      else if (o.categoria === 'tecnologia') expect(o.orientaciones, o.id).toEqual(['S']);
    }
  });

  it('las pantallas y las luces del lote tienen emisor en modo siempre', () => {
    for (const id of ['monitor', 'portatil', 'pc-doble', 'pc-gamer', 'pc-desarrollador', 'pc-artista-digital', 'todo-en-uno']) {
      expect(objetoPorId(id)?.emisor?.modo, id).toBe('siempre');
    }
    for (const id of ['lampara-escritorio', 'lampara-pantalla']) expect(objetoPorId(id)?.emisor?.modo, id).toBe('noche');
  });
});

describe('lote 8: calidad de cada cuadro', () => {
  it('solo usa colores de la paleta y alfa 0 o 255', () => {
    for (const [id, l] of lote.cuadros) {
      expect(validarLienzo(l, { noVacio: true }), id).toEqual([]);
      expect(soloAlfaBinario(l), id).toBe(true);
    }
  });

  it('no deja píxeles sueltos', () => {
    for (const [id, l] of lote.cuadros) expect(pixelesSueltos(l), id).toBe(0);
  });

  it('usa pocos colores por cuadro (las pantallas y los escritorios grandes, algo más)', () => {
    for (const [id, l] of lote.cuadros) {
      const limite = /^(pc-|escritorio-3x2|escritorio-3x1)/.test(id) ? 40 : 30;
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

  it('los objetos de varias orientaciones tienen una vista distinta por cada una', () => {
    for (const o of objetos.filter((x) => x.orientaciones.length > 1)) {
      const huellas = o.orientaciones.map((d) => cuadro(o.frames[d]!['base']!).huella());
      expect(new Set(huellas).size, o.id).toBe(huellas.length);
    }
  });

  it('lo apoyado lleva el reborde de sombra de 1 px y deja libre la parte de abajo de la casilla', () => {
    for (const o of objetos.filter((x) => x.apoyado === true)) {
      for (const f of framesEsperados(o)) {
        const l = cuadro(f.id);
        expect(l.colores().has(SOMBRA_CERCA), f.id).toBe(true);
        // El cuerpo apoya hacia el fondo de la tapa: nada se dibuja en las últimas 14 filas de la casilla.
        expect(filaMasBajaOpaca(l), f.id).toBeLessThanOrEqual(o.sobresale + 17);
      }
    }
  });

  it('lo de piso lleva sombra proyectada hacia la derecha y abajo', () => {
    for (const id of ['silla-oficina@N', 'silla-oficina@S', 'escritorio-3x1@S', 'mochila', 'torre-pc@S']) {
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
    const otra = construirLote8();
    for (const [id, l] of lote.cuadros) expect(otra.cuadros.get(id)?.huella(), id).toBe(l.huella());
  });
});

describe('lote 8: las medidas medidas de Gather', () => {
  it('el escritorio de 3 casillas mide 96 x 42: tapa de 26 filas, labio de 3 y frente de 9', () => {
    const l = cuadro('escritorio-3x1@S');
    expect([l.ancho, l.alto]).toEqual([96, 42]);
    const m = MATERIALES_ESCRITORIO.base;
    expect(m.tapa).toBe('neutro-7');
    // Columna fuera de las patas y de la cajonera: x = 60.
    const columna = Array.from({ length: l.alto }, (_, y) => l.leerHex(60, y));
    expect(columna[0]).toBe(AZUL_OFICINA_0);
    expect(columna.slice(2, 27).every((c) => c === '#FFFFFF')).toBe(true);
    expect(columna[27]).toBe('#CFD7E5');
    expect(columna.slice(28, 30)).toEqual(['#B4C0CC', '#B4C0CC']);
    expect(columna[30]).toBe('#7E8A97');
    expect(columna.slice(31, 38).every((c) => c === '#636D77')).toBe(true);
    expect(columna[38]).toBe('#414A56');
    expect(columna[39]).toBe(AZUL_OFICINA_0);
  });

  it('el escritorio de 3 x 2 crece 32 filas y el de lado queda de 32 de ancho', () => {
    expect([cuadro('escritorio-3x2@S').ancho, cuadro('escritorio-3x2@S').alto]).toEqual([96, 74]);
    expect([cuadro('escritorio-3x1@E').ancho, cuadro('escritorio-3x1@E').alto]).toEqual([32, 106]);
    expect([cuadro('escritorio-3x2@E').ancho, cuadro('escritorio-3x2@E').alto]).toEqual([64, 106]);
  });

  it('la silla mide 24 x 22 como la de Gather (columnas 4 a 27, filas 5 a 26 más la sombra)', () => {
    for (const d of ['N', 'S']) {
      const l = cuadro(`silla-oficina@${d}`);
      const caja = l.cajaOpaca() as { x: number; y: number; w: number; h: number };
      expect(caja.w, d).toBeLessThanOrEqual(28);
      expect(caja.h, d).toBeLessThanOrEqual(28);
      expect(caja.x, d).toBeGreaterThanOrEqual(2);
    }
  });

  it('los equipos de 2 casillas miden 64 x 56 y el teclado queda a 6 filas del labio del escritorio', () => {
    for (const id of ['pc-doble', 'pc-gamer', 'pc-desarrollador']) {
      const l = cuadro(`${id}@S`);
      expect([l.ancho, l.alto], id).toEqual([64, 56]);
    }
  });

  it('el atlas del lote se empaqueta y valida', () => {
    const items = itemsDe(lote.terminados, lote.cuadros);
    const { atlas, frames } = empaquetar(items, { anchoMax: 1024, relleno: 2 });
    expect(validarAtlas(atlas, frames, { relleno: 2 })).toEqual([]);
    expect(Object.keys(frames)).toHaveLength(items.length);
  });
});
