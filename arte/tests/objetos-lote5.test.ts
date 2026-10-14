import { describe, expect, it } from 'vitest';
import { INVENTARIO } from '@ol/shared';
import { framesEsperados, itemsDe, verificarObjeto } from '../src/objetos/comunes';
import { IDS_ATLAS_V6, IDS_LOTE_5, construirLote5, objetosDelAtlasV6 } from '../src/objetos/l5-todo';
import { Lienzo, empaquetar, validarAtlas, validarLienzo } from '../src/nucleo';

const lote = construirLote5();
const objetos = objetosDelAtlasV6();

const AZUL_OFICINA_0 = '#141828';
const SOMBRA_CERCA = '#46557A'; // azul-oficina-2
const SOMBRA_LEJOS = '#6677A0'; // azul-oficina-3

const COLGADOS = objetos.filter((o) => o.montado === true).map((o) => o.id);
/** Lo de suelo con sombra proyectada en dos tonos: todo menos lo colgado y el vinilo (plano en el piso). */
const DE_SUELO = objetos.filter((o) => o.montado !== true && o.capa !== 'suelo').map((o) => o.id);

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

function cuadro(id: string): Lienzo {
  return lote.cuadros.get(id) as Lienzo;
}

describe('lote 5: lista y cuadros', () => {
  it('trae los 15 objetos del lote 5 del inventario, ni uno más ni uno menos', () => {
    const delInventario = INVENTARIO.filter((o) => o.lote === 5).map((o) => o.id).sort();
    expect(delInventario).toHaveLength(15);
    expect([...IDS_ATLAS_V6].sort()).toEqual(delInventario);
    expect(objetos).toHaveLength(15);
    expect(Object.values(IDS_LOTE_5).flat()).toHaveLength(15);
  });

  it('dibuja exactamente los cuadros que promete el inventario', () => {
    const esperados = objetos.flatMap((o) => framesEsperados(o).map((f) => f.id));
    expect(esperados).toHaveLength(53);
    expect(lote.cuadros.size).toBe(53);
    expect([...lote.cuadros.keys()].sort()).toEqual([...esperados].sort());
    expect(lote.terminados).toHaveLength(15);
  });

  it('cada cuadro mide la huella girada más lo que sobresale', () => {
    for (const o of objetos) expect(verificarObjeto(o, lote.cuadros), o.id).toEqual([]);
    expect([cuadro('mesa-billar@S').ancho, cuadro('mesa-billar@S').alto]).toEqual([96, 64]);
    expect([cuadro('mesa-billar@E').ancho, cuadro('mesa-billar@E').alto]).toEqual([64, 96]);
    expect([cuadro('piano@S').ancho, cuadro('piano@S').alto]).toEqual([64, 48]);
    expect([cuadro('piano@E').ancho, cuadro('piano@E').alto]).toEqual([32, 80]);
    expect([cuadro('cabina-fotos@S').ancho, cuadro('cabina-fotos@S').alto]).toEqual([64, 64]);
    expect([cuadro('cabina-fotos@E').ancho, cuadro('cabina-fotos@E').alto]).toEqual([32, 96]);
    expect([cuadro('vinilo-alfombra').ancho, cuadro('vinilo-alfombra').alto]).toEqual([64, 64]);
    expect([cuadro('jukebox@S').ancho, cuadro('jukebox@S').alto]).toEqual([32, 56]);
    expect([cuadro('aro-baloncesto@S').ancho, cuadro('aro-baloncesto@S').alto]).toEqual([32, 40]);
  });

  it('los ids siguen el formato de idFrame: objeto@orientacion~variante', () => {
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

  it('las orientaciones y variantes pedidas existen', () => {
    const claves = (id: string): string[] => Object.keys(INVENTARIO.find((o) => o.id === id)?.frames ?? {}).sort();
    expect(claves('kart')).toEqual(['E', 'N', 'O', 'S']);
    expect(claves('sillon-gamer')).toEqual(['E', 'N', 'O', 'S']);
    expect(Object.keys(INVENTARIO.find((o) => o.id === 'kart')?.frames['S'] ?? {})).toEqual(['base', 'azul', 'rojo']);
    expect(Object.keys(INVENTARIO.find((o) => o.id === 'sillon-gamer')?.frames['S'] ?? {})).toEqual(['base', 'rojo', 'azul', 'morado']);
    expect(claves('diana-dardos')).toEqual(['E', 'O', 'S']);
    expect(claves('rack-servidores')).toEqual(['E', 'S']);
  });
});

describe('lote 5: calidad de cada cuadro', () => {
  const todos = objetos.flatMap((o) => framesEsperados(o).map((f) => ({ objeto: o.id, id: f.id })));

  it('solo usa colores de la paleta cerrada y alfa 0 o 255', () => {
    for (const { id } of todos) expect(validarLienzo(cuadro(id), { noVacio: true }), id).toEqual([]);
  });

  it('no deja píxeles sueltos', () => {
    for (const { id } of todos) expect(pixelesSueltos(cuadro(id)), id).toEqual([]);
  });

  it('usa pocos colores por cuadro', () => {
    for (const { id } of todos) expect(cuadro(id).colores().size, id).toBeLessThanOrEqual(42);
  });

  it('todo cuadro lleva el contorno azul marino', () => {
    for (const { id } of todos) expect(cuadro(id).colores().has(AZUL_OFICINA_0), id).toBe(true);
  });

  it('las variantes de color no son idénticas a la base', () => {
    for (const o of objetos) {
      for (const [clave, porVariante] of Object.entries(o.frames)) {
        const base = cuadro(porVariante['base'] as string);
        for (const [variante, id] of Object.entries(porVariante)) {
          if (variante === 'base') continue;
          expect(cuadro(id).igual(base), `${o.id}@${clave}~${variante}`).toBe(false);
        }
      }
    }
  });

  it('los objetos de varias orientaciones tienen una vista distinta por cada una', () => {
    for (const o of objetos) {
      const claves = Object.keys(o.frames);
      if (claves.length < 2) continue;
      const huellas = new Set(claves.map((k) => cuadro((o.frames[k] as Record<string, string>)['base'] as string).huella()));
      expect(huellas.size, o.id).toBe(claves.length);
    }
  });

  it('el atlas se empaqueta y valida (sin solapes y con relleno de 2)', () => {
    const items = itemsDe(objetos, lote.cuadros);
    const { atlas, frames } = empaquetar(items, { anchoMax: 1024, relleno: 2 });
    expect(validarAtlas(atlas, frames, { relleno: 2 })).toEqual([]);
    expect(Object.keys(frames)).toHaveLength(53);
  });
});

describe('lote 5: sombras', () => {
  it('lo de suelo lleva sombra proyectada en dos tonos escalonados de azul-oficina (nunca negro duro)', () => {
    expect(DE_SUELO).toHaveLength(12);
    for (const id of DE_SUELO) {
      const o = objetos.find((x) => x.id === id);
      for (const [clave, porVariante] of Object.entries(o?.frames ?? {})) {
        const l = cuadro((porVariante as Record<string, string>)['base'] as string);
        expect(l.colores().has(SOMBRA_CERCA), `${id}@${clave} sombra cerca`).toBe(true);
        expect(l.colores().has(SOMBRA_LEJOS), `${id}@${clave} sombra lejos`).toBe(true);
      }
    }
  });

  it('la sombra de suelo cae a la derecha o abajo del objeto, nunca arriba o a la izquierda', () => {
    for (const id of DE_SUELO) {
      const o = objetos.find((x) => x.id === id);
      for (const porVariante of Object.values(o?.frames ?? {})) {
        const l = cuadro((porVariante as Record<string, string>)['base'] as string);
        let izquierdaOArriba = 0;
        let derechaOAbajo = 0;
        for (let y = 0; y < l.alto; y++) {
          for (let x = 0; x < l.ancho; x++) {
            const hex = l.leerHex(x, y);
            if (hex !== SOMBRA_CERCA && hex !== SOMBRA_LEJOS) continue;
            if (l.leerHex(x - 1, y) === AZUL_OFICINA_0 || l.leerHex(x, y - 1) === AZUL_OFICINA_0) derechaOAbajo++;
            if (l.leerHex(x + 1, y) === AZUL_OFICINA_0 || l.leerHex(x, y + 1) === AZUL_OFICINA_0) izquierdaOArriba++;
          }
        }
        expect(derechaOAbajo, id).toBeGreaterThan(izquierdaOArriba);
      }
    }
  });

  it('lo colgado lleva sombra de 1 px sobre la pared (un solo tono) y no baja al zócalo', () => {
    expect(COLGADOS.sort()).toEqual(['aro-baloncesto', 'diana-dardos']);
    for (const id of COLGADOS) {
      const o = objetos.find((x) => x.id === id);
      for (const [clave, porVariante] of Object.entries(o?.frames ?? {})) {
        const l = cuadro((porVariante as Record<string, string>)['base'] as string);
        expect(l.colores().has(SOMBRA_CERCA), `${id}@${clave}`).toBe(true);
        expect(l.colores().has(SOMBRA_LEJOS), `${id}@${clave} sin sombra lejana`).toBe(false);
        // La cara de la pared llega hasta la fila 23 (más lo que sobresale); abajo está el zócalo.
        const limite = 24 + (o?.sobresale ?? 0);
        for (let y = limite; y < l.alto; y++) for (let x = 0; x < l.ancho; x++) expect(l.esOpaco(x, y), `${id}@${clave} zócalo en (${x}, ${y})`).toBe(false);
      }
    }
  });

  it('en las paredes verticales lo colgado queda pegado a la franja de la tapa (columnas 11 a 20) sin taparla, salvo el contorno y la sombra de su borde', () => {
    for (const id of COLGADOS) {
      for (const clave of ['E', 'O']) {
        const l = cuadro(`${id}@${clave}`);
        for (let y = 0; y < l.alto; y++) for (let x = 12; x <= 19; x++) expect(l.esOpaco(x, y), `${id}@${clave} (${x}, ${y})`).toBe(false);
      }
    }
  });

  it('el vinilo va plano en el suelo: solo contorno, sin sombra proyectada', () => {
    const l = cuadro('vinilo-alfombra');
    expect(l.colores().has(AZUL_OFICINA_0)).toBe(true);
    expect(l.colores().has(SOMBRA_CERCA)).toBe(false);
    expect(l.colores().has(SOMBRA_LEJOS)).toBe(false);
  });
});

describe('lote 5: luz y determinismo', () => {
  it('lo que emite luz lleva tonos claros y saturados en sus partes encendidas', () => {
    expect(cuadro('rack-servidores@S').colores().has('#A5E07B'), 'LED verde del rack').toBe(true);
    expect(cuadro('rack-servidores@E').colores().has('#A5E07B'), 'LED verde del rack de lado').toBe(true);
    expect(cuadro('jukebox@S').colores().has('#F4A09C'), 'neón rosado de la rockola').toBe(true);
    expect(cuadro('nevera-vinos').colores().has('#D6F1FA'), 'interior frío de la nevera').toBe(true);
    expect(cuadro('cabina-fotos@S').colores().has('#F8DB84'), 'rótulo de la cabina').toBe(true);
  });

  it('las tres mesas de juego y el ajedrez cambian entre S y E sin repetir cuadro', () => {
    for (const id of ['mesa-billar', 'mesa-air-hockey', 'mesa-poker', 'mesa-ajedrez']) {
      expect(cuadro(`${id}@S`).igual(cuadro(`${id}@E`)), id).toBe(false);
    }
  });

  it('construir dos veces da exactamente los mismos píxeles', () => {
    const otra = construirLote5();
    for (const [id, l] of lote.cuadros) expect(otra.cuadros.get(id)?.huella(), id).toBe(l.huella());
  });
});
