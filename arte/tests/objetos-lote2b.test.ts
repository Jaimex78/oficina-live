import { describe, expect, it } from 'vitest';
import { framesEsperados, verificarObjeto } from '../src/objetos/comunes';
import { IDS_LOTE_2B, construirLote2B, objetosDelLote2B } from '../src/objetos/l2b-todo';
import { Lienzo, validarLienzo } from '../src/nucleo';

const lote = construirLote2B();

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

describe('lote 2B: lista y cuadros', () => {
  it('trae los 48 objetos del lote y 176 cuadros, ni uno más ni uno menos (monitor doble, portátil, impresora y planta chica pasaron al lote 8)', () => {
    expect(Object.values(IDS_LOTE_2B).flat()).toHaveLength(48);
    expect(objetosDelLote2B()).toHaveLength(48);
    expect(lote.cuadros.size).toBe(176);
    expect(lote.terminados).toHaveLength(48);
  });

  it('cada objeto tiene todos los cuadros que promete el inventario, con su medida exacta', () => {
    for (const o of objetosDelLote2B()) expect(verificarObjeto(o, lote.cuadros), o.id).toEqual([]);
  });

  it('las categorías del lote coinciden con las del inventario', () => {
    for (const [categoria, ids] of Object.entries(IDS_LOTE_2B)) {
      for (const id of ids) expect(objetosDelLote2B().find((o) => o.id === id)?.categoria, id).toBe(categoria);
    }
  });
});

describe('lote 2B: calidad de cada cuadro', () => {
  const todos = objetosDelLote2B().flatMap((o) => framesEsperados(o).map((f) => ({ objeto: o.id, id: f.id })));

  it('solo usa colores de la paleta y alfa 0 o 255', () => {
    for (const { id } of todos) expect(validarLienzo(lote.cuadros.get(id) as Lienzo, { noVacio: true }), id).toEqual([]);
  });

  it('no deja píxeles sueltos', () => {
    for (const { id } of todos) expect(pixelesSueltos(lote.cuadros.get(id) as Lienzo), id).toEqual([]);
  });

  it('usa pocos colores por cuadro', () => {
    for (const { id } of todos) {
      const l = lote.cuadros.get(id) as Lienzo;
      expect(l.colores().size, id).toBeLessThanOrEqual(40);
    }
  });

  it('las variantes de color no son idénticas a la base', () => {
    for (const o of objetosDelLote2B()) {
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
    for (const o of objetosDelLote2B()) {
      const claves = Object.keys(o.frames);
      if (o.autotile || claves.length < 2) continue;
      const huellas = new Set(claves.map((k) => (lote.cuadros.get((o.frames[k] as Record<string, string>)['base'] as string) as Lienzo).huella()));
      expect(huellas.size, o.id).toBe(claves.length);
    }
  });

  it('las 16 máscaras de la cerca son todas distintas', () => {
    const cerca = objetosDelLote2B().find((o) => o.id === 'cerca');
    const huellas = new Set(Object.values(cerca?.frames ?? {}).map((v) => (lote.cuadros.get(v['base'] as string) as Lienzo).huella()));
    expect(huellas.size).toBe(16);
  });
});

describe('lote 2B: determinismo y luz', () => {
  it('construir dos veces da exactamente los mismos píxeles', () => {
    const otra = construirLote2B();
    for (const [id, l] of lote.cuadros) expect(otra.cuadros.get(id)?.huella(), id).toBe(l.huella());
  });

  it('el estilo Gather: contorno azul marino en los objetos de suelo', () => {
    for (const id of ['microondas', 'dispensador-agua', 'arbol', 'palmera', 'frutero']) {
      expect((lote.cuadros.get(id) as Lienzo).colores().has('#141828'), id).toBe(true);
    }
  });

  it('lo que va sobre las personas no proyecta sombra y lo apoyado sí', () => {
    const sombra = '#46557A';
    for (const id of ['proyector', 'planta-colgante', 'lampara-colgante', 'globos', 'banderines', 'pinata', 'sombrilla']) {
      expect((lote.cuadros.get(id) as Lienzo).colores().has(sombra), id).toBe(false);
    }
    for (const id of ['microondas', 'cafetera', 'tostadora', 'frutero', 'parlante', 'regalos']) {
      expect((lote.cuadros.get(id) as Lienzo).colores().has(sombra), id).toBe(true);
    }
  });

  it('los apoyados dejan la fila 0 solo para el contorno azul marino', () => {
    for (const id of ['microondas', 'cafetera', 'tostadora', 'frutero', 'lampara-mesa', 'parlante', 'cojin', 'calabazas', 'regalos']) {
      const l = lote.cuadros.get(id) as Lienzo;
      for (let x = 0; x < l.ancho; x++) if (l.esOpaco(x, 0)) expect(l.leerHex(x, 0), `${id} fila 0`).toBe('#141828');
    }
  });
});
