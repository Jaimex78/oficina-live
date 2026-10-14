/**
 * Escenas de revisión del lote 14: los dos baños armados con las funciones de las plantillas (`banoHombres` y `banoMujeres`),
 * a escala 1 y un recorte a escala 3 de los cubículos para juzgar el detalle.
 */

import { ConstructorSala, banoHombres, banoMujeres, type MaterialBano } from '@ol/shared';
import { Lienzo } from '../nucleo';
import { resolverCombinado, resolverDesdePublicados } from './compositor';
import { componerConPersonas } from './l8-personas';
import type { Cuadros } from './l8-comun';

export interface EscenaDelLote {
  nombre: string;
  imagen: Lienzo;
}

/** Los dos baños uno sobre otro, con muros, puerta de entrada y cada material de cubículo en su baño. */
export function salaDeBanos(hombres: MaterialBano = 'base', mujeres: MaterialBano = 'azul'): ReturnType<ConstructorSala['construir']> {
  const b = new ConstructorSala('banos', 'Baños', 14, 13).estricto();
  b.piso(0, 0, 14, 13, 'piso-cocina');
  b.muro(1, 1, 12, 1).muro(1, 6, 12, 6).muro(1, 11, 12, 11).muro(1, 1, 1, 11).muro(12, 1, 12, 11);
  b.poner('puerta-simple', 1, 5, 'E').poner('puerta-simple', 1, 10, 'E');
  banoHombres(b, 2, 2, hombres);
  banoMujeres(b, 2, 7, mujeres);
  return b.construir();
}

export function escenasDelLote14(cuadros: Cuadros): EscenaDelLote[] {
  const resolver = resolverCombinado((id) => cuadros.get(id), resolverDesdePublicados());
  const margen = 40;
  const sala = salaDeBanos();
  const completa = componerConPersonas(sala, resolver, [], null, margen);
  const otra = componerConPersonas(salaDeBanos('madera', 'base'), resolver, [], null, margen);
  const recorte = completa.recortar(32, margen - 8, 10 * 32, 5 * 32 + 8).escalar(3);
  const hoja = new Lienzo(Math.max(completa.ancho * 2 + 12, recorte.ancho + 8), completa.alto + 12 + recorte.alto);
  hoja.rect(0, 0, hoja.ancho, hoja.alto, '#2B2B31');
  hoja.pegar(completa, 4, 4);
  hoja.pegar(otra, completa.ancho + 8, 4);
  hoja.pegar(recorte, 4, completa.alto + 12);
  return [
    { nombre: 'banos', imagen: completa },
    { nombre: 'comparacion', imagen: hoja },
  ];
}
