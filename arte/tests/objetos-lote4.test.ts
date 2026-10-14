import { describe, expect, it } from 'vitest';
import { INVENTARIO } from '@ol/shared';
import { framesEsperados, itemsDe, verificarObjeto } from '../src/objetos/comunes';
import { IDS_ATLAS_V4, IDS_LOTE_3A, IDS_LOTE_4, construirLote4, objetosDelAtlasV4 } from '../src/objetos/l4-todo';
import { Lienzo, empaquetar, validarAtlas, validarLienzo } from '../src/nucleo';
import { diferenciasEntreColumnas, diferenciasEntreFilas } from './ayudas';

const lote = construirLote4();
const objetos = objetosDelAtlasV4();

const AZUL_OFICINA_0 = '#141828';
const SOMBRA_CERCA = '#46557A'; // azul-oficina-2
const SOMBRA_LEJOS = '#6677A0'; // azul-oficina-3

const PISOS = IDS_LOTE_3A['pisos'] ?? [];
/** Objetos apoyados en una mesa: reborde de sombra de 1 px. */
const APOYADOS = objetos.filter((o) => o.apoyado === true).map((o) => o.id);
/** Objetos de suelo con sombra proyectada en dos tonos: lo que no es piso, apoyado ni colgado. */
const DE_SUELO = objetos.filter((o) => o.categoria !== 'pisos' && o.apoyado !== true && o.montado !== true).map((o) => o.id);

function cuadroBase(id: string): Lienzo {
  const o = objetos.find((x) => x.id === id);
  const clave = Object.keys(o?.frames ?? {})[0] as string;
  return lote.cuadros.get((o?.frames[clave] as Record<string, string>)['base'] as string) as Lienzo;
}

function pixelesSueltos(l: Lienzo): Array<[number, number]> {
  const sueltos: Array<[number, number]> = [];
  for (let y = 0; y < l.alto; y++) {
    for (let x = 0; x < l.ancho; x++) {
      if (!l.esOpaco(x, y)) continue;
      let vecinos = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx !== 0 || dy !== 0) && l.esOpaco(x + dx, y + dy)) vecinos++;
      if (vecinos === 0) sueltos.push([x, y]);
    }
  }
  return sueltos;
}

describe('lote 4 y lote 3A: lista y cuadros', () => {
  it('trae 4 objetos del lote 4 y 16 del lote 3 (el computador gamer y la lámpara de escritorio pasaron al lote 8), todos en el inventario con su lote', () => {
    expect(IDS_LOTE_4).toHaveLength(4);
    expect(Object.values(IDS_LOTE_3A).flat()).toHaveLength(16);
    for (const id of IDS_LOTE_4) expect(INVENTARIO.find((o) => o.id === id)?.lote, id).toBe(4);
    for (const id of Object.values(IDS_LOTE_3A).flat()) expect(INVENTARIO.find((o) => o.id === id)?.lote, id).toBe(3);
    expect(objetos).toHaveLength(IDS_ATLAS_V4.length);
    expect(objetos).toHaveLength(20);
  });

  it('dibuja exactamente los cuadros que promete el inventario, ni uno más ni uno menos', () => {
    const esperados = objetos.flatMap((o) => framesEsperados(o).map((f) => f.id));
    expect(esperados).toHaveLength(53);
    expect(lote.cuadros.size).toBe(53);
    expect([...lote.cuadros.keys()].sort()).toEqual([...esperados].sort());
    expect(lote.terminados).toHaveLength(20);
  });

  it('cada objeto tiene todos sus cuadros con la medida exacta (huella girada más lo que sobresale)', () => {
    for (const o of objetos) expect(verificarObjeto(o, lote.cuadros), o.id).toEqual([]);
  });

  it('los ids de cuadro siguen el formato de idFrame: objeto@orientacion~variante', () => {
    for (const o of objetos) {
      for (const [clave, porVariante] of Object.entries(o.frames)) {
        for (const [variante, id] of Object.entries(porVariante)) {
          const esperado = `${o.id}${clave === 'U' ? '' : `@${clave}`}${variante === 'base' ? '' : `~${variante}`}`;
          expect(id).toBe(esperado);
          expect(lote.cuadros.has(id), id).toBe(true);
        }
      }
    }
  });

  it('las variantes pedidas existen: sillón (7 colores, 4 orientaciones)', () => {
    const sillon = INVENTARIO.find((o) => o.id === 'sillon-rojo');
    expect(Object.keys(sillon?.frames ?? {}).sort()).toEqual(['E', 'N', 'O', 'S']);
    expect(Object.keys(sillon?.frames['S'] ?? {})).toHaveLength(7);
  });
});

describe('lote 4 y lote 3A: calidad de cada cuadro', () => {
  const todos = objetos.flatMap((o) => framesEsperados(o).map((f) => ({ objeto: o.id, id: f.id })));

  it('solo usa colores de la paleta cerrada y alfa 0 o 255', () => {
    for (const { id } of todos) expect(validarLienzo(lote.cuadros.get(id) as Lienzo, { noVacio: true }), id).toEqual([]);
  });

  it('no deja píxeles sueltos', () => {
    for (const { id } of todos) expect(pixelesSueltos(lote.cuadros.get(id) as Lienzo), id).toEqual([]);
  });

  it('usa pocos colores por cuadro (los pisos, bastantes menos)', () => {
    for (const { objeto, id } of todos) {
      const n = (lote.cuadros.get(id) as Lienzo).colores().size;
      expect(n, id).toBeLessThanOrEqual(PISOS.includes(objeto) ? 10 : 40);
    }
  });

  it('las variantes de color no son idénticas a la base', () => {
    for (const o of objetos) {
      for (const [clave, porVariante] of Object.entries(o.frames)) {
        const base = lote.cuadros.get(porVariante['base'] as string) as Lienzo;
        for (const [variante, id] of Object.entries(porVariante)) {
          if (variante === 'base') continue;
          expect((lote.cuadros.get(id) as Lienzo).igual(base), `${o.id}@${clave}~${variante}`).toBe(false);
        }
      }
    }
  });

  it('los objetos de varias orientaciones tienen una vista distinta por cada una', () => {
    for (const o of objetos) {
      const claves = Object.keys(o.frames);
      if (claves.length < 2) continue;
      const huellas = new Set(claves.map((k) => (lote.cuadros.get((o.frames[k] as Record<string, string>)['base'] as string) as Lienzo).huella()));
      expect(huellas.size, o.id).toBe(claves.length);
    }
  });

  it('el atlas se empaqueta y valida (medidas múltiplos de 32 en ancho, sin solapes, con relleno de 2)', () => {
    const items = itemsDe(objetos, lote.cuadros);
    const { atlas, frames } = empaquetar(items, { anchoMax: 1024, relleno: 2 });
    expect(validarAtlas(atlas, frames, { relleno: 2 })).toEqual([]);
    expect(Object.keys(frames)).toHaveLength(53);
  });
});

describe('lote 4 y lote 3A: pisos sin costuras', () => {
  it('son tiles de 32 x 32, opacos de lado a lado y sin contorno ni sombra', () => {
    for (const id of PISOS) {
      const l = cuadroBase(id);
      expect([l.ancho, l.alto], id).toEqual([32, 32]);
      expect(l.contarOpacos(), id).toBe(32 * 32);
      expect(l.colores().has(AZUL_OFICINA_0), id).toBe(false);
    }
  });

  it('los bordes opuestos empatan como cualquier columna o fila vecina (tile solo, desplazado 16 y mosaico 3 x 3)', () => {
    for (const id of PISOS) {
      const tile = cuadroBase(id);
      for (const [nombre, l, ancho, alto] of [
        ['tile', tile, 32, 32],
        ['desplazado 16', tile.desplazar(16, 16), 32, 32],
        ['mosaico 3 x 3', tile.mosaico(3, 3), 96, 96],
      ] as const) {
        let maxColumnas = 0;
        for (let x = 0; x < ancho - 1; x++) if (nombre !== 'mosaico 3 x 3' || x % 32 !== 31) maxColumnas = Math.max(maxColumnas, diferenciasEntreColumnas(l, x, x + 1));
        let maxFilas = 0;
        for (let y = 0; y < alto - 1; y++) if (nombre !== 'mosaico 3 x 3' || y % 32 !== 31) maxFilas = Math.max(maxFilas, diferenciasEntreFilas(l, y, y + 1));
        if (nombre === 'mosaico 3 x 3') {
          for (const u of [31, 63]) {
            expect(diferenciasEntreColumnas(l, u, u + 1), `${id} ${nombre} columna ${u}`).toBeLessThanOrEqual(maxColumnas);
            expect(diferenciasEntreFilas(l, u, u + 1), `${id} ${nombre} fila ${u}`).toBeLessThanOrEqual(maxFilas);
          }
        } else {
          expect(diferenciasEntreColumnas(l, 31, 0), `${id} ${nombre} columnas 31 y 0`).toBeLessThanOrEqual(maxColumnas);
          expect(diferenciasEntreFilas(l, 31, 0), `${id} ${nombre} filas 31 y 0`).toBeLessThanOrEqual(maxFilas);
        }
      }
    }
  });

  it('el mosaico repite exactamente el tile (período de 32 en las dos direcciones)', () => {
    for (const id of PISOS) {
      const tile = cuadroBase(id);
      const m = tile.mosaico(2, 2);
      expect(m.recortar(32, 0, 32, 32).igual(tile), id).toBe(true);
      expect(m.recortar(0, 32, 32, 32).igual(tile), id).toBe(true);
    }
  });

  it('un piso es un fondo: usa pocos tonos de una familia y los cuatro se distinguen entre sí', () => {
    const huellas = new Set(PISOS.map((id) => cuadroBase(id).huella()));
    expect(huellas.size).toBe(4);
  });
});

describe('lote 4 y lote 3A: sombras', () => {
  it('lo de suelo lleva sombra proyectada en dos tonos escalonados de azul-oficina (nunca negro duro)', () => {
    expect(DE_SUELO.length).toBeGreaterThan(0);
    for (const id of DE_SUELO) {
      const o = objetos.find((x) => x.id === id);
      for (const [clave, porVariante] of Object.entries(o?.frames ?? {})) {
        const l = lote.cuadros.get((porVariante as Record<string, string>)['base'] as string) as Lienzo;
        expect(l.colores().has(SOMBRA_CERCA), `${id}@${clave} sombra cerca`).toBe(true);
        expect(l.colores().has(SOMBRA_LEJOS), `${id}@${clave} sombra lejos`).toBe(true);
      }
    }
  });

  it('la sombra de suelo cae a la derecha o abajo del objeto, nunca arriba o a la izquierda', () => {
    for (const id of DE_SUELO) {
      const l = cuadroBase(id);
      let izquierdaOArriba = 0;
      let derechaOAbajo = 0;
      for (let y = 0; y < l.alto; y++) {
        for (let x = 0; x < l.ancho; x++) {
          const hex = l.leerHex(x, y);
          if (hex !== SOMBRA_CERCA && hex !== SOMBRA_LEJOS) continue;
          // Un píxel de sombra tiene un vecino de contorno a su izquierda o arriba, no a su derecha o abajo.
          if (l.leerHex(x - 1, y) === AZUL_OFICINA_0 || l.leerHex(x, y - 1) === AZUL_OFICINA_0) derechaOAbajo++;
          if (l.leerHex(x + 1, y) === AZUL_OFICINA_0 || l.leerHex(x, y + 1) === AZUL_OFICINA_0) izquierdaOArriba++;
        }
      }
      expect(derechaOAbajo, id).toBeGreaterThan(izquierdaOArriba);
    }
  });

  it('lo apoyado lleva un reborde de sombra de 1 px (azul-oficina-2) y las filas de abajo quedan vacías', () => {
    expect(APOYADOS.length).toBe(9);
    for (const id of APOYADOS) {
      const l = cuadroBase(id);
      expect(l.colores().has(SOMBRA_CERCA), id).toBe(true);
      for (let y = 18; y < l.alto; y++) for (let x = 0; x < l.ancho; x++) expect(l.esOpaco(x, y), `${id} (${x}, ${y})`).toBe(false);
    }
  });

  it('lo apoyado baja hasta la fila 15 de su casilla (cuerpo) con contorno en la 16 y sombra en la 17, y deja libre la fila 0 salvo el contorno', () => {
    for (const id of APOYADOS) {
      const l = cuadroBase(id);
      let ultima = -1;
      for (let y = 0; y < l.alto; y++) for (let x = 0; x < l.ancho; x++) if (l.esOpaco(x, y)) ultima = Math.max(ultima, y);
      expect(ultima, `${id} última fila`).toBeLessThanOrEqual(17);
      expect(ultima, `${id} última fila`).toBeGreaterThanOrEqual(16);
      for (let x = 0; x < l.ancho; x++) if (l.esOpaco(x, 0)) expect(l.leerHex(x, 0), `${id} fila 0`).toBe(AZUL_OFICINA_0);
    }
  });

  it('el urinario (de pared) lleva sombra de 1 px sobre la pared y respeta la franja de la tapa en E y O', () => {
    const urinario = objetos.find((o) => o.id === 'urinario');
    for (const clave of ['S', 'E', 'O']) {
      const l = lote.cuadros.get(urinario?.frames[clave]?.['base'] as string) as Lienzo;
      expect(l.colores().has(SOMBRA_CERCA), `urinario@${clave}`).toBe(true);
      expect(l.colores().has(SOMBRA_LEJOS), `urinario@${clave} sin sombra lejana`).toBe(false);
    }
    // En las paredes verticales, lo colgado no ocupa las filas del zócalo (32 a 39 del cuadro de 40).
    for (const clave of ['E', 'O']) {
      const l = lote.cuadros.get(urinario?.frames[clave]?.['base'] as string) as Lienzo;
      for (let y = 33; y < l.alto; y++) for (let x = 0; x < l.ancho; x++) expect(l.esOpaco(x, y), `urinario@${clave} zócalo en (${x}, ${y})`).toBe(false);
    }
  });

  it('todo objeto no plano usa el contorno azul marino y los pisos no', () => {
    for (const o of objetos) {
      if (o.categoria === 'pisos') continue;
      for (const f of framesEsperados(o)) expect((lote.cuadros.get(f.id) as Lienzo).colores().has(AZUL_OFICINA_0), f.id).toBe(true);
    }
  });
});

describe('lote 4 y lote 3A: luz y determinismo', () => {
  it('lo que emite luz lleva tonos muy claros y saturados en sus partes encendidas', () => {
    // Pantalla del computador gamer, piloto de la consola, línea azul de la PS5 y bombilla de la lámpara.
    expect(cuadroBase('ps5').colores().has('#D6F1FA'), 'ps5: línea azul vidrio-3').toBe(true);
    expect(cuadroBase('consola-juegos').colores().has('#D6F1FA'), 'consola: piloto vidrio-3').toBe(true);
  });

  it('construir dos veces da exactamente los mismos píxeles', () => {
    const otra = construirLote4();
    for (const [id, l] of lote.cuadros) expect(otra.cuadros.get(id)?.huella(), id).toBe(l.huella());
  });

  it('el reloj de pie y el sillón sobresalen lo que dice el inventario (64 y 40 de alto)', () => {
    expect((lote.cuadros.get('reloj-de-pie') as Lienzo).alto).toBe(64);
    expect((lote.cuadros.get('sillon-rojo@S') as Lienzo).alto).toBe(40);
    expect((lote.cuadros.get('lavamanos@S') as Lienzo).ancho).toBe(64);
    expect((lote.cuadros.get('lavamanos@S') as Lienzo).alto).toBe(56);
    expect((lote.cuadros.get('lavamanos@E') as Lienzo).alto).toBe(88);
  });
});
