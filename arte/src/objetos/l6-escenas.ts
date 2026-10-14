/**
 * Salas de prueba del lote 6: cada colección se ve EN CONTEXTO, con las mismas reglas de orden del motor
 * (`componerSala`), con los cuadros en memoria del lote y lo publicado por los demás lotes.
 */

import { ConstructorSala, type SalaMapa } from '@ol/shared';
import type { Lienzo } from '../nucleo';
import { componerSala, resolverCombinado, resolverDesdePublicados, type ResolverCuadro } from './compositor';
import type { Cuadros } from './l6-comun';
import { COLECCIONES_LISTAS } from './l6-todo';

function resolverDeSalas(cuadros: Cuadros): ResolverCuadro {
  return resolverCombinado((id) => cuadros.get(id), resolverDesdePublicados());
}

export interface EscenaDelLote {
  nombre: string;
  imagen: Lienzo;
}

/** Halloween: paredes con telarañas y murciélagos, cementerio con árbol seco, y una mesa con dulces. */
export function salaHalloween(): SalaMapa {
  const b = new ConstructorSala('halloween', 'Halloween de prueba', 20, 12);
  b.piso(0, 0, 20, 12, 'piso-madera-oscura');
  b.muro(0, 2, 19, 2).muro(0, 3, 0, 11).muro(19, 3, 19, 11);
  b.poner('telarana', 1, 2, 'S').poner('murcielagos', 4, 2, 'S').poner('telarana', 9, 2, 'S').poner('murcielagos', 14, 2, 'S');
  b.poner('telarana', 0, 5, 'E').poner('murcielagos', 19, 5, 'O');
  // Cementerio a la izquierda: lápidas, esqueleto y árbol seco.
  b.poner('arbol-seco', 16, 8).poner('tumba', 2, 4).poner('tumba', 4, 5).poner('esqueleto', 6, 4);
  b.poner('escoba', 8, 6).poner('caldero', 12, 5).poner('calabaza-grande', 10, 4).poner('calabaza-grande', 14, 7);
  // Mesa con dulces y un fantasma en el aire.
  b.poner('escritorio-individual', 3, 9, 'S').poner('bowl-dulces', 3, 9).poner('bowl-dulces', 4, 9);
  b.poner('fantasma-colgante', 8, 8).poner('fantasma-colgante', 12, 10);
  return b.construir();
}

/** Navidad: pared con corona, guirnalda y calcetines; pesebre, muñeco, renos y un árbol. */
export function salaNavidad(): SalaMapa {
  const b = new ConstructorSala('navidad', 'Navidad de prueba', 20, 12);
  b.piso(0, 0, 20, 12, 'piso-madera-clara');
  b.muro(0, 2, 19, 2).muro(0, 3, 0, 11).muro(19, 3, 19, 11);
  b.poner('corona-navidena', 2, 2, 'S').poner('guirnalda', 4, 2, 'S').poner('calcetin-chimenea', 7, 2, 'S').poner('guirnalda', 9, 2, 'S').poner('corona-navidena', 12, 2, 'S').poner('calcetin-chimenea', 15, 2, 'S');
  b.poner('guirnalda', 0, 4, 'E').poner('corona-navidena', 0, 8, 'E').poner('calcetin-chimenea', 19, 4, 'O').poner('guirnalda', 19, 7, 'O');
  b.poner('pesebre', 3, 5).poner('muneco-nieve', 7, 5).poner('reno', 9, 5).poner('reno', 11, 5).poner('arbol-navidad', 14, 6);
  b.poner('regalos', 5, 9).poner('regalos', 15, 9).poner('luces-navidad', 6, 7).poner('muneco-nieve', 17, 5);
  return b.construir();
}

/** Amor y amistad: mesa con ramo y chocolates, osos y globos de corazón. */
export function salaAmor(): SalaMapa {
  const b = new ConstructorSala('amor', 'Amor y amistad de prueba', 16, 10);
  b.piso(0, 0, 16, 10, 'piso-alfombra-roja');
  b.muro(0, 2, 15, 2);
  b.poner('escritorio-individual', 2, 4, 'S').poner('ramo-rosas', 2, 4).poner('caja-chocolates', 3, 4);
  b.poner('escritorio-individual', 7, 4, 'S').poner('ramo-rosas', 8, 4).poner('caja-chocolates', 7, 4);
  b.poner('oso-peluche', 12, 4).poner('oso-peluche', 13, 6).poner('oso-peluche', 11, 7);
  b.poner('globos-corazon', 2, 7).poner('globos-corazon', 4, 7, 'U', 'rojo').poner('globos-corazon', 9, 7).poner('sofa-2', 6, 8, 'N');
  return b.construir();
}

/** Año Nuevo: reloj de cuenta regresiva en la pared, brindis, globos y serpentinas. */
export function salaAnoNuevo(): SalaMapa {
  const b = new ConstructorSala('ano-nuevo', 'Año Nuevo de prueba', 18, 10);
  b.piso(0, 0, 18, 10, 'piso-baldosa-ajedrez');
  b.muro(0, 2, 17, 2).muro(0, 3, 0, 9).muro(17, 3, 17, 9);
  b.poner('cuenta-regresiva', 8, 2, 'S').poner('cuenta-regresiva', 0, 4, 'E').poner('cuenta-regresiva', 17, 4, 'O');
  b.poner('escritorio-individual', 4, 5, 'S').poner('copas-champan', 4, 5).poner('copas-champan', 5, 5);
  b.poner('escritorio-individual', 11, 5, 'S').poner('copas-champan', 11, 5).poner('copas-champan', 12, 5);
  b.poner('globos-ano-nuevo', 2, 7).poner('globos-ano-nuevo', 15, 7).poner('globos-ano-nuevo', 8, 7);
  b.poner('serpentinas', 3, 3).poner('serpentinas', 6, 3).poner('serpentinas', 11, 3).poner('serpentinas', 14, 3);
  return b.construir();
}

/** Fiestas de Colombia: banderas, máscaras de carnaval en las paredes, sombrero y mochila sobre la mesa. */
export function salaColombia(): SalaMapa {
  const b = new ConstructorSala('colombia', 'Fiestas de Colombia de prueba', 16, 10);
  b.piso(0, 0, 16, 10, 'piso-deck');
  b.muro(0, 2, 15, 2).muro(0, 3, 0, 9).muro(15, 3, 15, 9);
  b.poner('mascara-carnaval', 3, 2, 'S').poner('mascara-carnaval', 7, 2, 'S').poner('mascara-carnaval', 11, 2, 'S').poner('mascara-carnaval', 0, 5, 'E').poner('mascara-carnaval', 15, 5, 'O');
  b.poner('bandera-colombia', 2, 4).poner('bandera-colombia', 13, 4);
  b.poner('escritorio-individual', 6, 5, 'S').poner('sombrero-vueltiao', 6, 5).poner('mochila-wayuu', 7, 5);
  b.poner('bandera-colombia', 5, 8).poner('bandera-colombia', 10, 8);
  return b.construir();
}

/** Pascua y cumpleaños: huevos, conejos, torta con velas y sombreros de fiesta. */
export function salaPascuaCumple(): SalaMapa {
  const b = new ConstructorSala('pascua-cumple', 'Pascua y cumpleaños de prueba', 18, 10);
  b.piso(0, 0, 9, 10, 'piso-cesped').piso(9, 0, 9, 10, 'piso-madera-clara');
  b.muro(9, 2, 17, 2);
  b.poner('escritorio-individual', 1, 3, 'S').poner('huevos-pascua', 1, 3).poner('huevos-pascua', 2, 3);
  b.poner('conejo-pascua', 4, 5).poner('conejo-pascua', 6, 6).poner('conejo-pascua', 2, 7);
  b.poner('escritorio-doble', 11, 5, 'S').poner('torta-cumpleanos', 12, 5).poner('sombreros-fiesta', 11, 5);
  b.poner('cartel-cumpleanos', 11, 2, 'S').poner('globos', 10, 8).poner('regalos', 14, 8);
  return b.construir();
}

const SALAS: Readonly<Record<string, () => SalaMapa>> = {
  halloween: salaHalloween,
  navidad: salaNavidad,
  'amor-amistad': salaAmor,
  'ano-nuevo': salaAnoNuevo,
  colombia: salaColombia,
  pascua: salaPascuaCumple,
  cumpleanos: salaPascuaCumple,
};

/** Compone las salas de las colecciones listas a escala 2. */
export function escenasDelLote6(cuadros: Cuadros): EscenaDelLote[] {
  const resolver = resolverDeSalas(cuadros);
  const r: EscenaDelLote[] = [];
  const hechas = new Set<() => SalaMapa>();
  for (const coleccion of COLECCIONES_LISTAS) {
    const sala = SALAS[coleccion];
    if (!sala || hechas.has(sala)) continue;
    hechas.add(sala);
    r.push({ nombre: sala === salaPascuaCumple ? 'pascua-y-cumpleanos' : coleccion, imagen: componerSala(sala(), resolver).escalar(2) });
  }
  return r;
}
