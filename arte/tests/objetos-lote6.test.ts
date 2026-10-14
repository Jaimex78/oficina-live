import { describe, expect, it } from 'vitest';
import { INVENTARIO, objetoPorId } from '@ol/shared';
import { framesEsperados, itemsDe, verificarObjeto } from '../src/objetos/comunes';
import { IDS_LOTE_6, construirLote6, idsDe, objetosDelLote6 } from '../src/objetos/l6-todo';
import { escenasDelLote6 } from '../src/objetos/l6-escenas';
import { Lienzo, empaquetar, validarAtlas, validarLienzo } from '../src/nucleo';

const lote = construirLote6();
const objetos = objetosDelLote6();

const AZUL_OFICINA_0 = '#141828';
const SOMBRA_CERCA = '#46557A'; // azul-oficina-2
const SOMBRA_LEJOS = '#6677A0'; // azul-oficina-3

const COLECCIONES = ['halloween', 'navidad', 'amor-amistad', 'ano-nuevo', 'colombia', 'pascua', 'cumpleanos'];
/** Colgado de una pared: sombra de 1 px sobre ella. */
const COLGADOS = objetos.filter((o) => o.montado === true).map((o) => o.id);
/** Apoyado en una mesa: reborde de 1 px. */
const APOYADOS = objetos.filter((o) => o.apoyado === true).map((o) => o.id);
/** En el aire: sin sombra proyectada. */
const EN_EL_AIRE = objetos.filter((o) => o.capa === 'sobre').map((o) => o.id);
/** De piso: lo que no es apoyado, colgado ni va en el aire. */
const DE_PISO = objetos.filter((o) => o.apoyado !== true && o.montado !== true && o.capa !== 'sobre').map((o) => o.id);

function cuadro(id: string): Lienzo {
  return lote.cuadros.get(id) as Lienzo;
}

function cuadroBase(id: string): Lienzo {
  const o = objetoPorId(id);
  const clave = Object.keys(o?.frames ?? {})[0] as string;
  return cuadro((o?.frames[clave] as Record<string, string>)['base'] as string);
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

describe('lote 6: lista y cuadros', () => {
  it('trae las 7 colecciones con 32 objetos, todos del lote 6 en el inventario y con su colección', () => {
    expect(Object.keys(IDS_LOTE_6)).toEqual(COLECCIONES);
    expect(idsDe()).toHaveLength(32);
    expect(objetos).toHaveLength(32);
    expect(INVENTARIO.filter((o) => o.lote === 6)).toHaveLength(32);
    for (const [coleccion, ids] of Object.entries(IDS_LOTE_6)) {
      for (const id of ids) {
        const o = objetoPorId(id);
        expect(o?.lote, id).toBe(6);
        expect(o?.coleccion, id).toBe(coleccion);
      }
    }
  });

  it('tiene el tamaño de cada colección', () => {
    expect(Object.fromEntries(Object.entries(IDS_LOTE_6).map(([c, ids]) => [c, ids.length]))).toEqual({
      halloween: 10,
      navidad: 6,
      'amor-amistad': 4,
      'ano-nuevo': 4,
      colombia: 4,
      pascua: 2,
      cumpleanos: 2,
    });
  });

  it('dibuja exactamente los cuadros que promete el inventario, ni uno más ni uno menos', () => {
    const esperados = objetos.flatMap((o) => framesEsperados(o).map((f) => f.id));
    expect(esperados).toHaveLength(47);
    expect(lote.cuadros.size).toBe(47);
    expect([...lote.cuadros.keys()].sort()).toEqual([...esperados].sort());
    expect(lote.terminados).toHaveLength(32);
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

  it('las medidas pedidas: telaraña y cuenta regresiva de 2 casillas, árbol seco de 2 x 2 que sube 64 px, lo demás de 1 casilla', () => {
    expect([cuadro('telarana@S').ancho, cuadro('telarana@S').alto]).toEqual([64, 32]);
    expect([cuadro('telarana@E').ancho, cuadro('telarana@E').alto]).toEqual([32, 64]);
    expect([cuadro('cuenta-regresiva@S').ancho, cuadro('cuenta-regresiva@S').alto]).toEqual([64, 32]);
    expect([cuadro('arbol-seco').ancho, cuadro('arbol-seco').alto]).toEqual([64, 128]);
    expect([cuadro('pesebre').ancho, cuadro('pesebre').alto]).toEqual([64, 40]);
    expect([cuadro('serpentinas').ancho, cuadro('serpentinas').alto]).toEqual([64, 32]);
    expect([cuadro('bandera-colombia').ancho, cuadro('bandera-colombia').alto]).toEqual([32, 64]);
  });

  it('las variantes pedidas existen: solo los globos de corazón (base y rojo)', () => {
    expect(Object.keys(objetoPorId('globos-corazon')?.frames['U'] ?? {})).toEqual(['base', 'rojo']);
    for (const o of objetos) if (o.id !== 'globos-corazon') expect(Object.keys(o.frames[Object.keys(o.frames)[0] as string] ?? {}), o.id).toEqual(['base']);
  });
});

describe('lote 6: calidad de cada cuadro', () => {
  const todos = objetos.flatMap((o) => framesEsperados(o).map((f) => ({ objeto: o.id, id: f.id })));

  it('solo usa colores de la paleta cerrada y alfa 0 o 255', () => {
    for (const { id } of todos) expect(validarLienzo(cuadro(id), { noVacio: true }), id).toEqual([]);
  });

  it('las medidas son múltiplos de 8 y el ancho múltiplo de la casilla', () => {
    for (const { id } of todos) {
      const l = cuadro(id);
      expect(l.ancho % 32, `${id} ancho`).toBe(0);
      expect(l.alto % 8, `${id} alto`).toBe(0);
    }
  });

  it('no deja píxeles sueltos', () => {
    for (const { id } of todos) expect(pixelesSueltos(cuadro(id)), id).toEqual([]);
  });

  it('usa pocos colores por cuadro', () => {
    for (const { id } of todos) expect(cuadro(id).colores().size, id).toBeLessThanOrEqual(46);
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

  it('el atlas se empaqueta y valida (sin solapes, con relleno de 2)', () => {
    const items = itemsDe(objetos, lote.cuadros);
    const { atlas, frames } = empaquetar(items, { anchoMax: 1024, relleno: 2 });
    expect(validarAtlas(atlas, frames, { relleno: 2 })).toEqual([]);
    expect(Object.keys(frames)).toHaveLength(47);
  });

  it('todo objeto usa el contorno azul marino (no negro puro)', () => {
    for (const { id } of todos) {
      expect(cuadro(id).colores().has(AZUL_OFICINA_0), id).toBe(true);
      expect(cuadro(id).colores().has('#0A0A0A') && !cuadro(id).colores().has(AZUL_OFICINA_0), id).toBe(false);
    }
  });
});

describe('lote 6: sombras bien hechas', () => {
  it('lo de piso lleva sombra proyectada en dos tonos escalonados de azul-oficina (nunca negro duro)', () => {
    expect(DE_PISO).toEqual(['calabaza-grande', 'esqueleto', 'tumba', 'caldero', 'escoba', 'arbol-seco', 'pesebre', 'muneco-nieve', 'reno', 'oso-peluche', 'bandera-colombia', 'conejo-pascua']);
    for (const id of DE_PISO) {
      const l = cuadroBase(id);
      expect(l.colores().has(SOMBRA_CERCA), `${id} sombra cerca`).toBe(true);
      expect(l.colores().has(SOMBRA_LEJOS), `${id} sombra lejos`).toBe(true);
    }
  });

  it('la sombra de piso cae a la derecha o abajo del objeto, nunca arriba o a la izquierda', () => {
    for (const id of DE_PISO) {
      const l = cuadroBase(id);
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
  });

  it('lo apoyado lleva un reborde de sombra de 1 px (azul-oficina-2) y baja hasta la fila 15 de su casilla', () => {
    expect(APOYADOS).toEqual(['bowl-dulces', 'ramo-rosas', 'caja-chocolates', 'copas-champan', 'sombrero-vueltiao', 'mochila-wayuu', 'huevos-pascua', 'torta-cumpleanos', 'sombreros-fiesta']);
    for (const id of APOYADOS) {
      const l = cuadroBase(id);
      expect(l.colores().has(SOMBRA_CERCA), id).toBe(true);
      expect(l.colores().has(SOMBRA_LEJOS), `${id} sin sombra lejana`).toBe(false);
      let ultima = -1;
      for (let y = 0; y < l.alto; y++) for (let x = 0; x < l.ancho; x++) if (l.esOpaco(x, y)) ultima = Math.max(ultima, y);
      expect(ultima, `${id} última fila`).toBeLessThanOrEqual(17);
      expect(ultima, `${id} última fila`).toBeGreaterThanOrEqual(16);
      for (let x = 0; x < l.ancho; x++) if (l.esOpaco(x, 0)) expect(l.leerHex(x, 0), `${id} fila 0`).toBe(AZUL_OFICINA_0);
    }
  });

  it('lo colgado lleva una sombra de 1 px sobre la pared y respeta la franja de la tapa en las paredes verticales', () => {
    expect(COLGADOS).toEqual(['telarana', 'murcielagos', 'corona-navidena', 'guirnalda', 'calcetin-chimenea', 'cuenta-regresiva', 'mascara-carnaval']);
    for (const id of COLGADOS) {
      const o = objetoPorId(id);
      for (const clave of ['S', 'E', 'O']) {
        const l = cuadro(o?.frames[clave]?.['base'] as string);
        expect(l.colores().has(SOMBRA_CERCA), `${id}@${clave}`).toBe(true);
        expect(l.colores().has(SOMBRA_LEJOS), `${id}@${clave} sin sombra lejana`).toBe(false);
        // La cara del sur llega hasta la fila 23 de su casilla; el zócalo empieza en la 24 (y en la 56 de un cuadro de 64).
        const zocalo = l.alto - 7;
        for (let y = zocalo; y < l.alto; y++) for (let x = 0; x < l.ancho; x++) expect(l.esOpaco(x, y), `${id}@${clave} zócalo en (${x}, ${y})`).toBe(false);
      }
      for (const clave of ['E', 'O']) {
        // En las paredes verticales solo se ve la franja de la tapa: nada se dibuja encima de ella (columnas 11 a 20), salvo la sombra de 1 px.
        const l = cuadro(o?.frames[clave]?.['base'] as string);
        for (let y = 0; y < l.alto; y++) for (let x = 12; x <= 19; x++) if (l.leerHex(x, y) !== SOMBRA_CERCA) expect(l.esOpaco(x, y), `${id}@${clave} sobre la tapa en (${x}, ${y})`).toBe(false);
      }
    }
  });

  it('lo que va en el aire no lleva sombra proyectada: no hay tonos de sombra pasando el contorno por abajo ni por la derecha', () => {
    expect(EN_EL_AIRE).toEqual(['fantasma-colgante', 'globos-corazon', 'globos-ano-nuevo', 'serpentinas']);
    for (const id of EN_EL_AIRE) {
      for (const f of framesEsperados(objetoPorId(id) as NonNullable<ReturnType<typeof objetoPorId>>)) {
        const l = cuadro(f.id);
        // Una sombra proyectada queda fuera del contorno: a su izquierda o arriba hay un píxel de contorno y a su derecha o abajo, nada.
        let sombras = 0;
        for (let y = 0; y < l.alto; y++) {
          for (let x = 0; x < l.ancho; x++) {
            const hex = l.leerHex(x, y);
            if (hex !== SOMBRA_CERCA && hex !== SOMBRA_LEJOS) continue;
            const fuera = (l.leerHex(x - 1, y) === AZUL_OFICINA_0 && !l.esOpaco(x + 1, y)) || (l.leerHex(x, y - 1) === AZUL_OFICINA_0 && !l.esOpaco(x, y + 1));
            if (fuera) sombras++;
          }
        }
        expect(sombras, f.id).toBe(0);
      }
    }
  });

  it('lo de piso no queda cortado por el marco: en la última fila y la última columna solo puede haber sombra', () => {
    for (const id of DE_PISO) {
      const l = cuadroBase(id);
      for (let x = 0; x < l.ancho; x++) {
        const hex = l.leerHex(x, l.alto - 1);
        if (hex !== null) expect([SOMBRA_CERCA, SOMBRA_LEJOS], `${id} fila final (${x})`).toContain(hex);
      }
      for (let y = 0; y < l.alto; y++) {
        const hex = l.leerHex(l.ancho - 1, y);
        if (hex !== null) expect([SOMBRA_CERCA, SOMBRA_LEJOS], `${id} columna final (${y})`).toContain(hex);
      }
    }
  });
});

describe('lote 6: luz, escenas y determinismo', () => {
  it('lo que emite luz lleva tonos muy claros y saturados en sus partes encendidas', () => {
    expect(objetoPorId('calabaza-grande')?.emisor?.color).toBe('#FF9A3C');
    expect(objetoPorId('caldero')?.emisor?.color).toBe('#7CFF6B');
    expect(cuadroBase('calabaza-grande').colores().has('#F8DB84'), 'calabaza: hueco tela-calida-3').toBe(true);
    expect(cuadroBase('calabaza-grande').colores().has('#FFFFFF'), 'calabaza: centro blanco').toBe(true);
    expect(cuadroBase('caldero').colores().has('#A5E07B'), 'caldero: brebaje planta-4').toBe(true);
    expect(cuadro('cuenta-regresiva@S').colores().has('#FFFFFF'), 'cuenta regresiva: carátula blanca').toBe(true);
    expect(cuadro('cuenta-regresiva@S').colores().has('#F8DB84'), 'cuenta regresiva: aro dorado claro').toBe(true);
    expect(cuadroBase('torta-cumpleanos').colores().has('#F8DB84'), 'torta: llama tela-calida-3').toBe(true);
  });

  it('la bandera de Colombia lleva amarillo, azul y rojo', () => {
    const colores = cuadroBase('bandera-colombia').colores();
    expect(colores.has('#F8DB84') || colores.has('#E6B445'), 'amarillo').toBe(true);
    expect(colores.has('#2E5E9A') || colores.has('#4F96CB'), 'azul').toBe(true);
    expect(colores.has('#D42E2D') || colores.has('#EF3B3A'), 'rojo').toBe(true);
  });

  it('la mochila wayuu y la máscara de carnaval son de colores vivos (al menos 8 colores distintos)', () => {
    expect(cuadroBase('mochila-wayuu').colores().size).toBeGreaterThanOrEqual(8);
    expect(cuadro('mascara-carnaval@S').colores().size).toBeGreaterThanOrEqual(8);
  });

  it('las salas de prueba se componen sin errores, una por colección (pascua y cumpleaños comparten sala)', () => {
    const escenas = escenasDelLote6(lote.cuadros);
    expect(escenas.map((e) => e.nombre)).toEqual(['halloween', 'navidad', 'amor-amistad', 'ano-nuevo', 'colombia', 'pascua-y-cumpleanos']);
    for (const e of escenas) expect(e.imagen.contarOpacos(), e.nombre).toBeGreaterThan(1000);
  });

  it('es determinista: dos construcciones dan los mismos bytes', () => {
    const otro = construirLote6();
    expect([...otro.cuadros.keys()].sort()).toEqual([...lote.cuadros.keys()].sort());
    for (const [id, l] of lote.cuadros) expect((otro.cuadros.get(id) as Lienzo).huella(), id).toBe(l.huella());
  });
});
