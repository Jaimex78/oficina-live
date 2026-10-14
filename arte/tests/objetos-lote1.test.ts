import { INVENTARIO, idFrame } from '@ol/shared';
import { describe, expect, it } from 'vitest';
import { Lienzo, validarLienzo } from '../src/nucleo';
import { framesEsperados, verificarObjeto } from '../src/objetos/comunes';
import { construirLote1, objetosDelLote1 } from '../src/objetos/l1-todo';
import { soloAlfaBinario } from './ayudas';

const resultado = construirLote1();
const { cuadros, terminados } = resultado;

/** Píxeles visibles sin ningún vecino visible (en las 8 direcciones): ruido. */
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

describe('lote 1: lo que promete el inventario', () => {
  it('el lote 1 son 38 objetos y 263 cuadros (la silla de oficina y el monitor pasaron al lote 8)', () => {
    const lote = objetosDelLote1();
    expect(lote).toHaveLength(38);
    expect(lote.flatMap((o) => framesEsperados(o))).toHaveLength(263);
  });

  it('cada objeto terminado tiene todos sus cuadros con la medida exacta', () => {
    for (const o of terminados) expect(verificarObjeto(o, cuadros), o.id).toEqual([]);
  });

  it('no hay cuadros que el inventario no prometa', () => {
    const permitidos = new Set(objetosDelLote1().flatMap((o) => framesEsperados(o).map((f) => f.id)));
    for (const id of cuadros.keys()) expect(permitidos.has(id), id).toBe(true);
  });

  it('los objetos terminados son los que tienen todos sus cuadros', () => {
    for (const o of objetosDelLote1()) {
      const completo = framesEsperados(o).every((f) => cuadros.has(f.id));
      expect(terminados.includes(o), o.id).toBe(completo);
    }
  });

  it('los ids siguen el contrato de idFrame', () => {
    expect(cuadros.has(idFrame('piso-madera-clara', 'U', 'base'))).toBe(true);
    expect(cuadros.has(idFrame('pared-lisa', 'U', 'base')) || cuadros.has('pared-lisa@0101')).toBe(true);
    expect(cuadros.has('pared-lisa@0101~rojo')).toBe(true);
  });
});

describe('lote 1: calidad de cada cuadro', () => {
  it('todos usan solo la paleta, con alfa 0 o 255 y el ancho en múltiplos de la casilla', () => {
    for (const [id, l] of cuadros) {
      // El ancho es siempre múltiplo de la casilla; el alto suma lo que sobresale (múltiplos de 8).
      expect(validarLienzo(l, { multiplo: { ancho: 32, alto: 8 }, noVacio: true }), id).toEqual([]);
      expect(soloAlfaBinario(l), id).toBe(true);
    }
  });

  it('ningún cuadro tiene píxeles sueltos', () => {
    for (const [id, l] of cuadros) expect(pixelesSueltos(l), id).toEqual([]);
  });

  it('ningún cuadro usa más de 20 colores', () => {
    for (const [id, l] of cuadros) expect(l.colores().size, id).toBeLessThanOrEqual(20);
  });

  it('no usan negro puro', () => {
    for (const [id, l] of cuadros) expect(l.colores().has('#000000'), id).toBe(false);
  });

  it('las variantes de color no son iguales a la base', () => {
    for (const o of terminados) {
      for (const [clave, porVariante] of Object.entries(o.frames)) {
        const base = cuadros.get(porVariante.base ?? '');
        for (const [variante, id] of Object.entries(porVariante)) {
          if (variante === 'base') continue;
          expect(cuadros.get(id)?.igual(base as Lienzo), `${o.id}@${clave}~${variante}`).toBe(false);
        }
      }
    }
  });

  it('es determinista: construir dos veces da los mismos píxeles', () => {
    const otra = construirLote1();
    expect([...otra.cuadros.keys()].sort()).toEqual([...cuadros.keys()].sort());
    for (const [id, l] of cuadros) expect(otra.cuadros.get(id)?.huella(), id).toBe(l.huella());
  });
});

describe('lote 1: coherencia con el inventario', () => {
  it('los objetos del lote 1 siguen siendo los 38 de la lista', () => {
    const ids = objetosDelLote1().map((o) => o.id);
    const esperados = [
      'piso-madera-clara', 'piso-madera-oscura', 'piso-baldosa', 'piso-cemento',
      'pared-lisa', 'pared-ventana', 'vidrio', 'columna', 'puerta-simple', 'puerta-doble', 'portal',
      'escritorio-individual', 'escritorio-doble', 'mesa-compartida-6', 'panel-divisor',
      'silla-reunion', 'puff', 'butaca', 'sofa-3',
      'mesa-reunion-4', 'mesa-reunion-6', 'mesa-redonda', 'mesa-centro',
      'tv-pared', 'pantalla-sala',
      'pizarron', 'muro-kanban', 'mesa-teams', 'cartel-zona',
      'maquina-cafe', 'nevera', 'meson',
      'planta-mediana', 'planta-grande', 'cuadro-grande', 'lampara-pie', 'estanteria-libros', 'alfombra-grande',
    ];
    expect([...ids].sort()).toEqual([...esperados].sort());
    expect(INVENTARIO.filter((o) => o.lote === 1)).toHaveLength(38);
  });
});
