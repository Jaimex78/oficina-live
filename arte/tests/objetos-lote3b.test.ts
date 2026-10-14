import { describe, expect, it } from 'vitest';
import { framesEsperados, verificarObjeto } from '../src/objetos/comunes';
import { IDS_LOTE_3B, ORDEN_LOTE_3B, construirLote3B, objetosDelLote3B } from '../src/objetos/l3b-todo';
import { Lienzo, validarLienzo } from '../src/nucleo';
import { CASILLA, objetoPorId } from '@ol/shared';

const lote = construirLote3B();
const objetos = objetosDelLote3B();
const todos = objetos.flatMap((o) => framesEsperados(o).map((f) => ({ objeto: o.id, ...f })));

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

describe('lote 3B: lista y cuadros', () => {
  it('trae los 16 objetos pedidos y 48 cuadros, ni uno más ni uno menos', () => {
    expect(ORDEN_LOTE_3B).toHaveLength(16);
    expect(Object.values(IDS_LOTE_3B).flat().sort()).toEqual([...ORDEN_LOTE_3B].sort());
    expect(objetos).toHaveLength(16);
    expect(todos).toHaveLength(48);
    expect(lote.cuadros.size).toBe(48);
  });

  it('cada objeto existe en el inventario como lote 3', () => {
    for (const id of ORDEN_LOTE_3B) expect(objetoPorId(id)?.lote, id).toBe(3);
  });

  it('cada objeto tiene todos los ids de cuadro del inventario, con su medida exacta', () => {
    for (const o of objetos) expect(verificarObjeto(o, lote.cuadros), o.id).toEqual([]);
    for (const { id, ancho, alto } of todos) {
      const l = lote.cuadros.get(id);
      expect(l, id).toBeDefined();
      expect([l?.ancho, l?.alto], id).toEqual([ancho, alto]);
    }
  });

  it('los cuadros miden múltiplos de 8 y de ancho múltiplo de la casilla', () => {
    for (const { id } of todos) {
      const l = lote.cuadros.get(id) as Lienzo;
      expect(l.ancho % CASILLA, id).toBe(0);
      expect(l.alto % 8, id).toBe(0);
    }
  });

  it('los árboles tienen huella de 2x2 con bloqueo solo en la fila de abajo y suben 64 px', () => {
    for (const id of ['pino', 'abedul']) {
      const o = objetoPorId(id);
      expect([o?.ancho, o?.alto, o?.sobresale], id).toEqual([2, 2, 64]);
      expect(o?.bloquea, id).toEqual([[0, 1], [1, 1]]);
      const l = lote.cuadros.get(id) as Lienzo;
      expect([l.ancho, l.alto], id).toEqual([64, 128]);
    }
  });
});

describe('lote 3B: calidad de cada cuadro', () => {
  it('solo usa colores de la paleta cerrada y alfa 0 o 255', () => {
    for (const { id } of todos) expect(validarLienzo(lote.cuadros.get(id) as Lienzo, { noVacio: true }), id).toEqual([]);
  });

  it('no deja píxeles sueltos', () => {
    for (const { id } of todos) expect(pixelesSueltos(lote.cuadros.get(id) as Lienzo), id).toEqual([]);
  });

  it('usa pocos colores por cuadro', () => {
    for (const { id } of todos) expect((lote.cuadros.get(id) as Lienzo).colores().size, id).toBeLessThanOrEqual(48);
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

  it('todo lo que se levanta del piso lleva contorno azul marino', () => {
    for (const { id, objeto } of todos) {
      if (objetoPorId(objeto)?.montado) continue;
      expect((lote.cuadros.get(id) as Lienzo).colores().has('#141828'), id).toBe(true);
    }
  });
});

describe('lote 3B: sombras', () => {
  const sombra = '#46557A';

  it('lo que está en el piso proyecta una sombra azul grisácea, nunca negra', () => {
    for (const id of ORDEN_LOTE_3B) {
      const l = lote.cuadros.get(Object.values(objetoPorId(id)?.frames ?? {})[0]?.['base'] as string) as Lienzo;
      if (objetoPorId(id)?.montado) continue;
      expect(l.colores().has(sombra), id).toBe(true);
    }
  });

  it('la sombra queda a la derecha y abajo de lo dibujado (luz arriba a la izquierda)', () => {
    for (const id of ORDEN_LOTE_3B) {
      const o = objetoPorId(id);
      if (!o || o.montado) continue;
      const l = lote.cuadros.get(Object.values(o.frames)[0]?.['base'] as string) as Lienzo;
      let sx = 0;
      let sy = 0;
      let n = 0;
      let ox = 0;
      let oy = 0;
      let m = 0;
      for (let y = 0; y < l.alto; y++) {
        for (let x = 0; x < l.ancho; x++) {
          const h = l.leerHex(x, y);
          if (h === sombra) { sx += x; sy += y; n++; } else if (h !== null) { ox += x; oy += y; m++; }
        }
      }
      expect(n, id).toBeGreaterThan(0);
      // El centro de la sombra queda más abajo que el del objeto.
      expect(sy / n, id).toBeGreaterThan(oy / m);
      // Y el balón y los árboles proyectan hacia la derecha del centro de masa de la figura.
      if (['balon-futbol', 'pino', 'abedul'].includes(id)) expect(sx / n, id).toBeGreaterThan(ox / m - 4);
    }
  });

  it('el cuadro de mariposas lleva una sombra de 1 px sobre la pared, no de 2', () => {
    const l = lote.cuadros.get('cuadro-mariposas@S') as Lienzo;
    // Última fila del marco (y=17), contorno (18) y sombra (19): nada por debajo.
    let ultima = -1;
    for (let y = 0; y < l.alto; y++) for (let x = 0; x < l.ancho; x++) if (l.esOpaco(x, y)) ultima = y;
    expect(ultima).toBe(19);
    expect(l.leerHex(30, 19)).toBe(sombra);
  });

  it('lo colgado se queda sobre la cara de la pared: nada pasa de la fila 23 del cuadro', () => {
    for (const id of ['cuadro-mariposas@S', 'cuadro-mariposas@E', 'cuadro-mariposas@O']) {
      const l = lote.cuadros.get(id) as Lienzo;
      const filas = id.endsWith('@S') ? 24 : 52;
      for (let y = filas; y < l.alto; y++) for (let x = 0; x < l.ancho; x++) expect(l.esOpaco(x, y), `${id} (${x},${y})`).toBe(false);
    }
  });
});

describe('lote 3B: determinismo y luz', () => {
  it('construir dos veces da exactamente los mismos píxeles', () => {
    const otra = construirLote3B();
    for (const [id, l] of lote.cuadros) expect(otra.cuadros.get(id)?.huella(), id).toBe(l.huella());
  });

  it('lo que emite luz usa tonos claros en la parte que emite', () => {
    // Bombillas del perchero, pantalla del arcade, llamas de la chimenea y agua del acuario.
    expect((lote.cuadros.get('perchero') as Lienzo).colores().has('#F8DB84'), 'perchero').toBe(true);
    expect((lote.cuadros.get('maquina-arcade@S') as Lienzo).colores().has('#A5E07B'), 'arcade').toBe(true);
    expect((lote.cuadros.get('chimenea') as Lienzo).colores().has('#F8DB84'), 'chimenea').toBe(true);
    expect((lote.cuadros.get('acuario@S') as Lienzo).colores().has('#D6F1FA'), 'acuario').toBe(true);
  });

  it('la luz viene de la izquierda: el borde izquierdo de la silla es más claro que el derecho', () => {
    const l = lote.cuadros.get('silla-tallada@S') as Lienzo;
    const brillo = (hex: string | null): number => (hex === null ? 0 : Number.parseInt(hex.slice(1, 3), 16) + Number.parseInt(hex.slice(3, 5), 16) + Number.parseInt(hex.slice(5, 7), 16));
    // Postes del respaldo: columna 8 (luz) contra columna 10 (sombra), a la altura 12.
    expect(brillo(l.leerHex(8, 12))).toBeGreaterThan(brillo(l.leerHex(10, 12)));
    expect(brillo(l.leerHex(21, 12))).toBeGreaterThan(brillo(l.leerHex(23, 12)));
  });
});
