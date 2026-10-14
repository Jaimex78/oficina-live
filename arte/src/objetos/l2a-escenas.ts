/**
 * Escenas de prueba del lote 2A: salas armadas con las reglas del motor para revisar el arte EN CONTEXTO
 * (mesas con sillas, sofás en L, escritorios en L con su silla, divisores formando cubículos, arco, ascensor, escalera).
 * Se dibujan con los cuadros en memoria del lote 2A y, para lo que no es mío (paredes, sillas de reunión, mesa de centro),
 * con los cuadros del lote 1. Nada de esto se publica.
 */

import { ConstructorSala, type SalaMapa } from '@ol/shared';
import type { Lienzo } from '../nucleo';
import { componerSala } from './compositor';
import { construirLote1 } from './l1-todo';
import { construirCuadros2a } from './l2a-lote';

/** Un intento que no cabe (por una regla del editor) no tumba la escena: se anota y se sigue. */
function poner(b: ConstructorSala, avisos: string[], ...args: Parameters<ConstructorSala['poner']>): void {
  try {
    b.poner(...args);
  } catch (error) {
    avisos.push(error instanceof Error ? error.message : String(error));
  }
}

export interface EscenaLote2a {
  sala: SalaMapa;
  avisos: string[];
}

/**
 * Cuatro ambientes: sala de reuniones con arco y puerta de vidrio, zona de descanso con sofás en L, comedor con mesa alta,
 * y una zona de trabajo con escritorios en L, cubículos de divisor bajo, lockers, ascensor y escalera. Más una sala de juegos.
 */
export function salaPruebaLote2a(): EscenaLote2a {
  const avisos: string[] = [];
  const b = new ConstructorSala('prueba-2a', 'Prueba del lote 2A', 42, 26);
  const p = (...a: Parameters<ConstructorSala['poner']>) => poner(b, avisos, ...a);

  // Pisos.
  b.piso(0, 2, 42, 24, 'piso-parquet');
  b.piso(1, 3, 16, 9, 'piso-alfombra-gris');
  b.piso(18, 3, 13, 9, 'piso-alfombra-roja');
  b.piso(1, 14, 16, 10, 'piso-cocina');
  b.piso(32, 3, 9, 9, 'piso-deck');
  b.piso(32, 14, 9, 10, 'piso-cesped');

  // Sala de reuniones: paredes lisas, un arco al sur, una puerta de vidrio al este.
  b.muro(1, 3, 16, 3).muro(1, 11, 16, 11).muro(1, 4, 1, 10).muro(16, 4, 16, 10);
  p('arco', 7, 11, 'S');
  p('puerta-vidrio', 16, 6, 'E');
  p('mesa-reunion-12', 5, 6, 'S');
  for (const x of [5, 6, 7, 8, 9, 10]) p('silla-reunion', x, 5, 'S');
  for (const x of [5, 6, 7, 8, 9, 10]) p('silla-reunion', x, 8, 'N');
  p('silla-ejecutiva', 4, 6, 'E', 'rojo');
  p('silla-ejecutiva', 11, 7, 'O');

  // Zona de descanso: sofás en L enfrentados, mesa de centro y puffs.
  b.muro(18, 3, 31, 3, 'pared-lisa', 'gris').muro(18, 11, 31, 11, 'pared-lisa', 'gris').muro(18, 4, 18, 10, 'pared-lisa', 'gris').muro(31, 4, 31, 10, 'pared-lisa', 'gris');
  p('puerta-vidrio', 18, 8, 'E');
  p('sofa-l', 20, 5, 'S');
  p('sofa-l', 27, 9, 'N', 'azul');
  p('sofa-2', 22, 9, 'S', 'verde');
  p('mesa-centro', 23, 6, 'S');
  p('silla-ejecutiva', 26, 5, 'O', 'negro');

  // Comedor.
  b.muro(1, 13, 16, 13).muro(1, 24, 16, 24).muro(1, 14, 1, 23).muro(16, 14, 16, 23);
  p('mesa-comedor', 5, 17, 'S');
  for (const x of [5, 6, 7]) p('silla-comedor', x, 16, 'S');
  for (const x of [5, 6, 7]) p('silla-comedor', x, 19, 'N', 'base');
  p('silla-comedor', 4, 18, 'E', 'madera');
  p('silla-comedor', 8, 17, 'O', 'negro');
  p('mesa-alta', 12, 17);
  p('taburete', 11, 17);
  p('taburete', 13, 17, 'U', 'blanco');
  p('banco', 11, 20);
  p('banca-interior', 3, 22, 'S');
  p('mesa-comedor', 10, 21, 'E');
  p('silla-comedor', 9, 21, 'E');
  p('silla-comedor', 12, 22, 'O');

  // Zona de trabajo: escritorios en L con su silla, de pie, cubículos de divisor bajo, lockers.
  p('escritorio-l', 19, 14, 'S');
  p('silla-ejecutiva', 20, 16, 'N');
  p('escritorio-l', 24, 14, 'E', 'madera');
  p('silla-ejecutiva', 25, 16, 'O', 'rojo');
  p('escritorio-de-pie', 28, 14, 'S');
  b.muro(19, 18, 27, 18, 'divisor-bajo', 'base').muro(19, 19, 19, 21, 'divisor-bajo', 'gris').muro(23, 19, 23, 21, 'divisor-bajo', 'rojo');
  p('escritorio-l', 20, 20, 'N', 'blanco');
  p('silla-ejecutiva', 21, 19, 'S', 'negro');
  p('cajonera', 25, 20);
  p('papelera', 26, 20);
  p('locker', 29, 22, 'S');
  p('locker', 30, 22, 'S', 'gris');
  p('locker', 31, 22, 'S', 'rojo');
  p('archivador', 28, 22);

  // Sala de juegos con ascensor y escalera en la pared norte.
  b.muro(32, 3, 41, 3).muro(32, 11, 41, 11).muro(32, 4, 32, 10).muro(41, 4, 41, 10);
  p('ascensor', 34, 3, 'S');
  p('escalera', 38, 4);
  p('mesa-pingpong', 34, 6, 'S');
  p('futbolin', 34, 9, 'S');
  p('banco', 39, 9);
  p('banca-interior', 37, 7, 'E');

  // Terraza con mesa alta.
  p('mesa-alta', 34, 17);
  p('taburete', 33, 17);
  p('taburete', 35, 17);
  return { sala: b.construir(), avisos };
}

/** Compone la sala de prueba con los cuadros en memoria del lote 2A y del lote 1. */
export function componerEscenaLote2a(): { lienzo: Lienzo; avisos: string[] } {
  const { sala, avisos } = salaPruebaLote2a();
  const mios = construirCuadros2a();
  const lote1 = construirLote1().cuadros;
  const lienzo = componerSala(sala, (id) => mios.get(id) ?? lote1.get(id));
  return { lienzo, avisos };
}
