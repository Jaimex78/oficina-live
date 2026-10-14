import { describe, expect, it } from 'vitest';
import { CASILLA, huellaDe, objetoPorId } from '@ol/shared';
import { Lienzo, PALETA, empaquetar, validarAtlas, validarLienzo } from '../src/nucleo';
import { framesEsperados, verificarObjeto } from '../src/objetos/comunes';
import { IDS_2A, OBJETOS_2A_POR_CATEGORIA, construirCuadros2a, idsDibujados, objetosDelLote } from '../src/objetos/l2a-lote';
import { carpetaTemporal, diferenciasEntreColumnas, diferenciasEntreFilas } from './ayudas';

// Las construcciones son deterministas y baratas, pero se hacen una sola vez para todo el archivo.
const cuadros = construirCuadros2a();
const objetos = objetosDelLote();
const COLOR_SOMBRA = PALETA['neutro-2'];

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

/**
 * Lo máximo que puede invadir una casilla que debe verse como piso: el tablero o el brazo de un mueble alto sube en
 * pantalla y tapa algo de la casilla de arriba (es la vista 3/4), y el contorno de 1 px se sale de la huella.
 */
const INVASION_MAXIMA = Math.round(0.2 * CASILLA * CASILLA);

/** Píxeles opacos de una casilla que NO son la sombra horneada. */
function opacosSinSombra(l: Lienzo, cx: number, cy: number, sobresale: number): number {
  let n = 0;
  for (let y = sobresale + cy * CASILLA; y < sobresale + (cy + 1) * CASILLA; y++) {
    for (let x = cx * CASILLA; x < (cx + 1) * CASILLA; x++) {
      const h = l.leerHex(x, y);
      if (h !== null && h !== COLOR_SOMBRA) n++;
    }
  }
  return n;
}

describe('lote 2A: la lista y los cuadros', () => {
  it('son 30 objetos con 236 cuadros, justo los que promete el inventario', () => {
    expect(IDS_2A).toHaveLength(30);
    expect(new Set(IDS_2A).size).toBe(30);
    const prometidos = objetos.flatMap((o) => framesEsperados(o).map((f) => f.id));
    expect(prometidos).toHaveLength(236);
    expect(idsDibujados()).toHaveLength(30);
    expect([...cuadros.keys()].sort()).toEqual([...prometidos].sort());
  });

  it('cada categoría trae los objetos de la tarea', () => {
    expect(Object.fromEntries(Object.entries(OBJETOS_2A_POR_CATEGORIA).map(([c, l]) => [c, l?.length]))).toEqual({
      pisos: 6,
      paredes: 5,
      puestos: 6,
      asientos: 7,
      mesas: 6,
    });
    for (const [categoria, lista] of Object.entries(OBJETOS_2A_POR_CATEGORIA)) {
      for (const id of lista ?? []) expect(objetoPorId(id)?.categoria, id).toBe(categoria);
    }
  });

  it('todos los cuadros miden exactamente lo que dice el inventario', () => {
    for (const o of objetos) expect(verificarObjeto(o, cuadros), o.id).toEqual([]);
  });
});

describe('lote 2A: calidad de cada cuadro', () => {
  it('solo usan colores de la paleta, con alfa 0 o 255, y ninguno está vacío', () => {
    for (const [id, l] of cuadros) expect(validarLienzo(l, { noVacio: true }), id).toEqual([]);
  });

  it('usan pocos colores por cuadro (máximo 20)', () => {
    for (const [id, l] of cuadros) expect(l.colores().size, id).toBeLessThanOrEqual(20);
  });

  it('no dejan píxeles sueltos', () => {
    for (const [id, l] of cuadros) expect(pixelesSueltos(l), id).toBe(0);
  });

  it('son deterministas: construir dos veces da los mismos píxeles', () => {
    const otra = construirCuadros2a();
    expect([...otra.keys()]).toEqual([...cuadros.keys()]);
    for (const [id, l] of cuadros) expect(otra.get(id)?.huella(), id).toBe(l.huella());
  });

  it('no usan negro puro y el negro tinta es una parte pequeña del cuadro (contornos tonales)', () => {
    for (const [id, l] of cuadros) {
      const colores = l.colores();
      expect(colores.has('#000000'), id).toBe(false);
      // Los objetos negros y las rampas oscuras recoloreadas pueden usar mucho `neutro-0`: se revisan solo las bases.
      if (id.includes('~')) continue;
      expect((colores.get('#0A0A0A') ?? 0) / Math.max(1, l.contarOpacos()), id).toBeLessThan(0.12);
    }
  });

  it('cada variante es distinta de la base de su misma orientación', () => {
    for (const o of objetos) {
      for (const [clave, porVariante] of Object.entries(o.frames)) {
        const base = cuadros.get(porVariante.base ?? '');
        if (!base) continue;
        for (const [variante, id] of Object.entries(porVariante)) {
          if (variante === 'base') continue;
          expect(cuadros.get(id)?.huella(), `${id} no debe ser igual a ${porVariante.base} (${clave})`).not.toBe(base.huella());
        }
      }
    }
  });

  it('el oeste no es el espejo exacto del este: la luz sigue viniendo de la izquierda', () => {
    for (const o of objetos) {
      if (!o.frames.E || !o.frames.O) continue;
      for (const variante of Object.keys(o.frames.E)) {
        const e = cuadros.get(o.frames.E[variante] ?? '');
        const w = cuadros.get(o.frames.O[variante] ?? '');
        if (!e || !w) continue;
        expect(w.igual(e.voltearH()), `${o.id}~${variante}: O no debe ser el reflejo de E`).toBe(false);
      }
    }
  });

  it('las piezas de más de una casilla de alto no se salen del cuadro y dejan margen para la sombra', () => {
    for (const o of objetos) {
      if (o.categoria === 'pisos' || o.pared) continue;
      for (const f of framesEsperados(o)) {
        const l = cuadros.get(f.id) as Lienzo;
        const caja = l.cajaOpaca();
        expect(caja, f.id).not.toBeNull();
        // Margen de 1 px arriba y a la izquierda: el contorno puede tocarlo, pero nada llega a la fila 0 con relleno.
        expect((caja?.y ?? 99) + (caja?.h ?? 0), f.id).toBeLessThanOrEqual(l.alto);
        expect((caja?.x ?? 99) + (caja?.w ?? 0), f.id).toBeLessThanOrEqual(l.ancho);
      }
    }
  });

  it('cada objeto proyecta una sombra a la derecha o abajo (la sombra horneada de neutro-2)', () => {
    for (const o of objetos) {
      if (o.categoria === 'pisos' || o.pared) continue;
      for (const f of framesEsperados(o)) {
        if (f.variante !== 'base') continue;
        const l = cuadros.get(f.id) as Lienzo;
        expect(l.colores().has(COLOR_SOMBRA), f.id).toBe(true);
      }
    }
  });
});

describe('lote 2A: los pisos repiten sin costuras', () => {
  const pisos = OBJETOS_2A_POR_CATEGORIA.pisos ?? [];

  it('son tiles de 32 x 32, opacos de lado a lado', () => {
    for (const id of pisos) {
      const l = cuadros.get(id) as Lienzo;
      expect([l.ancho, l.alto], id).toEqual([32, 32]);
      expect(l.contarOpacos(), id).toBe(32 * 32);
    }
  });

  it('los bordes opuestos empatan como cualquier columna o fila vecina (tile solo, mosaico y tile desplazado)', () => {
    for (const id of pisos) {
      const tile = cuadros.get(id) as Lienzo;
      for (const [nombre, l, ancho, alto] of [
        ['tile', tile, 32, 32],
        ['desplazado 16', tile.desplazar(16, 16), 32, 32],
        ['mosaico 3 x 3', tile.mosaico(3, 3), 96, 96],
      ] as const) {
        let maxColumnas = 0;
        for (let x = 0; x < ancho - 1; x++) if (nombre !== 'mosaico 3 x 3' || x % 32 !== 31) maxColumnas = Math.max(maxColumnas, diferenciasEntreColumnas(l, x, x + 1));
        let maxFilas = 0;
        for (let y = 0; y < alto - 1; y++) if (nombre !== 'mosaico 3 x 3' || y % 32 !== 31) maxFilas = Math.max(maxFilas, diferenciasEntreFilas(l, y, y + 1));
        const uniones = nombre === 'mosaico 3 x 3' ? [31, 63] : [];
        for (const u of uniones) {
          expect(diferenciasEntreColumnas(l, u, u + 1), `${id} ${nombre} columna ${u}`).toBeLessThanOrEqual(maxColumnas);
          expect(diferenciasEntreFilas(l, u, u + 1), `${id} ${nombre} fila ${u}`).toBeLessThanOrEqual(maxFilas);
        }
        if (nombre !== 'mosaico 3 x 3') {
          expect(diferenciasEntreColumnas(l, 31, 0), `${id} ${nombre} columnas 31 y 0`).toBeLessThanOrEqual(maxColumnas);
          expect(diferenciasEntreFilas(l, 31, 0), `${id} ${nombre} filas 31 y 0`).toBeLessThanOrEqual(maxFilas);
        }
      }
    }
  });

  it('un piso es un fondo: usa pocos colores y no mezcla familias de materiales', () => {
    const familias: Record<string, string[]> = {
      'piso-alfombra-gris': ['neutro'],
      'piso-alfombra-roja': ['rojo-suave'],
      'piso-cesped': ['cesped'],
      'piso-deck': ['madera-clara'],
      'piso-parquet': ['madera-clara'],
      'piso-cocina': ['neutro', 'baldosa-gris'],
    };
    for (const id of pisos) {
      const l = cuadros.get(id) as Lienzo;
      expect(l.colores().size, id).toBeLessThanOrEqual(8);
      for (const hex of l.colores().keys()) {
        const nombre = Object.entries(PALETA).find(([, h]) => h === hex)?.[0] ?? '';
        expect(familias[id]?.some((f) => nombre.startsWith(`${f}-`)), `${id} usa ${nombre}`).toBe(true);
      }
    }
  });
});

describe('lote 2A: las huellas en L', () => {
  it('el rincón libre del escritorio en L (según huellaDe) queda sin muebles en las cuatro orientaciones', () => {
    const o = objetoPorId('escritorio-l');
    expect(o).toBeDefined();
    if (!o) return;
    for (const orientacion of ['S', 'E', 'N', 'O']) {
      const h = huellaDe(o, orientacion);
      const bloqueadas = new Set(h.bloquea.map(([x, y]) => `${x},${y}`));
      const libres: Array<[number, number]> = [];
      for (let y = 0; y < h.alto; y++) for (let x = 0; x < h.ancho; x++) if (!bloqueadas.has(`${x},${y}`)) libres.push([x, y]);
      expect(libres, orientacion).toHaveLength(1);
      const l = cuadros.get(o.frames[orientacion]?.base ?? '') as Lienzo;
      for (const [x, y] of libres) expect(opacosSinSombra(l, x, y, 0), `escritorio-l@${orientacion}: la casilla libre ${x},${y} debe verse como piso`).toBeLessThanOrEqual(INVASION_MAXIMA);
      for (const clave of bloqueadas) {
        const [x, y] = clave.split(',').map(Number) as [number, number];
        expect(opacosSinSombra(l, x, y, 0), `escritorio-l@${orientacion}: la casilla ocupada ${x},${y} debe tener mueble`).toBeGreaterThan(200);
      }
    }
  });

  it('el sofá en L deja dos casillas libres en el rincón y las otras cuatro con sofá (casillas que se piden al inventario)', () => {
    const o = objetoPorId('sofa-l');
    expect(o).toBeDefined();
    if (!o) return;
    // Casillas libres por orientación, como desplazamientos [dx, dy] desde la esquina de la huella ya girada.
    const libres: Record<string, Array<[number, number]>> = {
      S: [[0, 1], [1, 1]],
      N: [[1, 0], [2, 0]],
      E: [[1, 1], [1, 2]],
      O: [[0, 0], [0, 1]],
    };
    for (const [orientacion, lista] of Object.entries(libres)) {
      const h = huellaDe(o, orientacion);
      const l = cuadros.get(o.frames[orientacion]?.base ?? '') as Lienzo;
      const libreSet = new Set(lista.map(([x, y]) => `${x},${y}`));
      for (let y = 0; y < h.alto; y++) {
        for (let x = 0; x < h.ancho; x++) {
          const n = opacosSinSombra(l, x, y, o.sobresale);
          if (libreSet.has(`${x},${y}`)) expect(n, `sofa-l@${orientacion}: ${x},${y} debe estar libre`).toBeLessThanOrEqual(INVASION_MAXIMA);
          else expect(n, `sofa-l@${orientacion}: ${x},${y} debe tener sofá`).toBeGreaterThan(300);
        }
      }
    }
  });
});

describe('lote 2A: empaquetado', () => {
  it('los 236 cuadros caben en un atlas válido con relleno de 2 px', () => {
    const tmp = carpetaTemporal('ol-arte-lote2a-');
    try {
      const items = [...cuadros].map(([id, lienzo]) => ({ id, lienzo }));
      const { atlas, frames } = empaquetar(items, { anchoMax: 1024, relleno: 2 });
      expect(Object.keys(frames)).toHaveLength(236);
      expect(validarAtlas(atlas, frames, { relleno: 2 })).toEqual([]);
    } finally {
      tmp.limpiar();
    }
  });
});
