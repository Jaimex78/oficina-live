/**
 * Salas de prueba del lote 3B: sirven para revisar cada objeto EN CONTEXTO (sombras sobre el piso, lo colgado sobre su
 * pared, los árboles junto al césped). Se componen con las mismas reglas de orden del motor (`componerSala`), con los
 * cuadros en memoria del lote y lo publicado por los demás lotes.
 *
 * Salas: estar (chimenea, silla tallada, cómoda, cuadro, estantes), recreo (arcade, balón, nevera, cámara, acuario),
 * jardín (pino, abedul, espantapájaros, ave del paraíso) y lados (todas las orientaciones `E` y `O`).
 */

import { ConstructorSala, type SalaMapa } from '@ol/shared';
import { Lienzo } from '../nucleo';
import { componerSala, resolverCombinado, resolverDesdePublicados, type ResolverCuadro } from './compositor';
import type { Cuadros } from './l3b-comun';

/** Pisos sencillos de 32 x 32 para las salas de prueba cuando otro lote todavía no publica el suyo. */
function pisoDePrueba(id: string): Lienzo | undefined {
  const l = new Lienzo(32, 32);
  if (id === 'piso-cesped') {
    l.rect(0, 0, 32, 32, 'cesped-1');
    for (const [x, y] of [[3, 4], [14, 9], [25, 6], [8, 20], [20, 17], [29, 27], [12, 28], [5, 12]] as const) {
      l.rect(x, y, 2, 1, 'cesped-2');
      l.px(x, y - 1, 'cesped-2');
    }
    return l;
  }
  if (id === 'piso-madera-clara') {
    for (let f = 0; f < 4; f++) {
      l.rect(0, f * 8, 32, 7, 'madera-clara-3');
      l.rect(0, f * 8 + 7, 32, 1, 'madera-clara-2');
      l.rect([9, 25, 3, 17][f] ?? 0, f * 8, 1, 7, 'madera-clara-2');
    }
    return l;
  }
  if (id === 'piso-ladrillo-crema' || id === 'piso-baldosa') {
    for (let y = 0; y < 32; y += 16) for (let x = 0; x < 32; x += 16) l.rect(x, y, 16, 16, (x + y) % 32 === 0 ? 'ladrillo-crema-3' : 'ladrillo-crema-2');
    return l;
  }
  return undefined;
}

function resolverDeSalas(cuadros: Cuadros): ResolverCuadro {
  return resolverCombinado((id) => cuadros.get(id), resolverDesdePublicados(), pisoDePrueba);
}

/** Sala de estar: chimenea con repisa, silla tallada, cómoda con cuadro, estantes, perchero y acuario. */
export function salaEstar(): SalaMapa {
  const b = new ConstructorSala('estar', 'Sala de estar de prueba', 16, 11);
  b.piso(0, 2, 16, 9, 'piso-madera-clara');
  b.muro(0, 2, 15, 2).muro(0, 3, 0, 9).muro(15, 3, 15, 9).muro(0, 10, 15, 10);
  b.poner('chimenea', 6, 3, 'U');
  b.poner('cuadro-mariposas', 1, 2, 'S').poner('cuadro-mariposas', 11, 2, 'S');
  b.poner('comoda', 1, 3, 'S').poner('comoda', 12, 3, 'S', 'madera');
  b.poner('estante-plantas', 3, 3, 'S').poner('acuario', 10, 3, 'S').poner('perchero', 5, 3);
  b.poner('silla-tallada', 6, 4, 'N').poner('silla-tallada', 8, 4, 'N', 'rojo');
  b.poner('silla-tallada', 5, 6, 'E', 'azul').poner('silla-tallada', 9, 6, 'O', 'verde').poner('silla-tallada', 7, 7, 'S');
  b.poner('estante-frascos', 1, 8, 'S').poner('mini-nevera', 4, 8).poner('ave-del-paraiso', 13, 8);
  b.poner('comoda', 14, 5, 'E', 'negro').poner('cuadro-mariposas', 15, 4, 'O').poner('cuadro-mariposas', 0, 4, 'E');
  return b.construir();
}

/** Recreo: arcades, balón, mini nevera, estantes de frascos, cámara y el acuario de lado. */
export function salaRecreo(): SalaMapa {
  const b = new ConstructorSala('recreo', 'Recreo de prueba', 16, 10);
  b.piso(0, 2, 16, 8, 'piso-ladrillo-crema');
  b.muro(0, 2, 15, 2);
  b.poner('maquina-arcade', 2, 3, 'S').poner('maquina-arcade', 3, 3, 'S', 'azul').poner('maquina-arcade', 4, 3, 'S', 'rojo');
  b.poner('maquina-arcade', 7, 3, 'E').poner('maquina-arcade', 7, 4, 'E', 'azul');
  b.poner('estante-frascos', 10, 3, 'S').poner('mini-nevera', 13, 3).poner('cuadro-mariposas', 8, 2, 'S');
  b.poner('balon-futbol', 3, 6).poner('balon-futbol', 5, 7).poner('camara-tripode', 9, 6).poner('acuario', 11, 6, 'E');
  b.poner('estante-frascos', 13, 6, 'E').poner('perchero', 1, 7).poner('silla-tallada', 6, 6, 'S');
  return b.construir();
}

/** Jardín: pinos y abedules sobre césped, espantapájaros y ave del paraíso. */
export function salaJardin(): SalaMapa {
  const b = new ConstructorSala('jardin', 'Jardín de prueba', 18, 11);
  b.piso(0, 2, 18, 9, 'piso-cesped');
  b.poner('pino', 1, 3).poner('abedul', 4, 3).poner('pino', 7, 4).poner('abedul', 10, 3).poner('pino', 13, 3).poner('abedul', 15, 4);
  b.poner('espantapajaros', 6, 8).poner('ave-del-paraiso', 9, 8).poner('balon-futbol', 11, 9).poner('silla-tallada', 13, 8, 'O');
  b.poner('pino', 1, 7).poner('abedul', 3, 8);
  return b.construir();
}

export interface EscenaDelLote {
  nombre: string;
  imagen: Lienzo;
}

/** Compone todas las salas de prueba a escala 2 con los cuadros del lote y lo publicado por los demás. */
export function escenasDelLote3B(cuadros: Cuadros): EscenaDelLote[] {
  const resolver = resolverDeSalas(cuadros);
  const hacer = (nombre: string, sala: SalaMapa): EscenaDelLote => ({ nombre, imagen: componerSala(sala, resolver).escalar(2) });
  return [hacer('estar', salaEstar()), hacer('recreo', salaRecreo()), hacer('jardin', salaJardin())];
}
