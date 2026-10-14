import { describe, expect, it } from 'vitest';
import { INVENTARIO } from '@ol/shared';
import { framesEsperados, verificarObjeto } from '../src/objetos/comunes';
import { IDS_ATLAS_V8, construirLote7, objetosDelAtlasV8 } from '../src/objetos/l7-todo';
import { validarLienzo } from '../src/nucleo';
import { soloAlfaBinario } from './ayudas';

const lote = construirLote7();

describe('lote 7 (obsoleto): solo el escritorio largo', () => {
  it('el atlas v8 trae un objeto, marcado obsoleto, y el inventario lo reemplaza por escritorio-3x1', () => {
    expect(IDS_ATLAS_V8).toEqual(['escritorio-largo']);
    expect(objetosDelAtlasV8()).toHaveLength(1);
    const o = INVENTARIO.find((x) => x.id === 'escritorio-largo');
    expect(o?.obsoleto).toBe(true);
    expect(o?.reemplazadoPor).toBe('escritorio-3x1');
    expect(INVENTARIO.filter((x) => x.lote === 7)).toHaveLength(1);
  });

  it('dibuja exactamente los cuadros prometidos y miden lo debido', () => {
    const esperados = objetosDelAtlasV8().flatMap((o) => framesEsperados(o).map((f) => f.id));
    expect([...lote.cuadros.keys()].sort()).toEqual([...esperados].sort());
    for (const o of objetosDelAtlasV8()) expect(verificarObjeto(o, lote.cuadros), o.id).toEqual([]);
    expect(lote.cuadros.get('escritorio-largo@S')?.ancho).toBe(128);
  });

  it('solo usa colores de la paleta y alfa binario', () => {
    for (const [id, l] of lote.cuadros) {
      expect(validarLienzo(l, { noVacio: true }), id).toEqual([]);
      expect(soloAlfaBinario(l), id).toBe(true);
    }
  });
});
