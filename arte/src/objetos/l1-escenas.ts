/**
 * Escenas de prueba del lote 1: salas armadas con las mismas reglas del motor para revisar el arte EN CONTEXTO
 * (paredes unidas, sillas junto a escritorios, lo colgado sobre su pared). Se dibujan con los cuadros en memoria,
 * sin tocar lo publicado.
 */

import { ConstructorSala, type SalaMapa } from '@ol/shared';
import { Lienzo } from '../nucleo';
import { componerSala } from './compositor';
import type { Cuadros } from './l1-comun';

/**
 * Sala de prueba de paredes: un rectángulo cerrado con puerta, ventanas y puertas laterales; una sala de vidrio;
 * una T, un cruce, un pilar suelto, extremos libres, una L, un pasillo y las tres variantes de color.
 */
export function salaPruebaParedes(): SalaMapa {
  const b = new ConstructorSala('prueba-paredes', 'Prueba de paredes', 38, 25);
  b.piso(0, 2, 38, 23, 'piso-madera-clara');

  // 1. Rectángulo cerrado de pared lisa con puerta al sur, ventanas al norte y aberturas laterales.
  b.muro(1, 4, 11, 4).muro(1, 10, 11, 10).muro(1, 5, 1, 9).muro(11, 5, 11, 9);
  b.poner('puerta-simple', 6, 10, 'S');
  b.poner('pared-ventana', 3, 4, 'S').poner('pared-ventana', 9, 4, 'S');
  b.poner('pared-ventana', 1, 7, 'E').poner('puerta-simple', 11, 7, 'E');

  // 2. Sala de vidrio con puerta simple al sur y puerta lateral.
  b.muro(14, 4, 23, 4, 'vidrio').muro(14, 10, 23, 10, 'vidrio').muro(14, 5, 14, 9, 'vidrio').muro(23, 5, 23, 9, 'vidrio');
  b.poner('puerta-simple', 18, 10, 'S').poner('puerta-simple', 14, 7, 'E');

  // 3. Variantes de color: gris y rojo, con una puerta doble entre ellas.
  b.muro(26, 4, 30, 4, 'pared-lisa', 'gris').muro(33, 4, 36, 4, 'pared-lisa', 'rojo');
  b.poner('puerta-doble', 31, 4, 'S');
  b.muro(26, 5, 26, 7, 'pared-lisa', 'gris').muro(36, 5, 36, 7, 'pared-lisa', 'rojo');

  // 4. T y cruce: una línea larga con un tallo que baja y cruza otra línea.
  b.muro(1, 14, 13, 14).muro(7, 14, 7, 23).muro(1, 19, 13, 19);

  // 5. Pilar suelto, columna, extremos libres y una L.
  b.muro(16, 15, 16, 15);
  b.poner('columna', 18, 15);
  b.muro(20, 15, 24, 15);
  b.muro(27, 14, 27, 18);
  b.muro(16, 20, 22, 20).muro(22, 20, 22, 23);

  // 6. Pasillo de pared de vidrio con una ventana en el muro del fondo.
  b.muro(29, 15, 36, 15, 'vidrio').muro(29, 18, 36, 18, 'vidrio');
  b.muro(30, 21, 37, 21);
  b.poner('pared-ventana', 33, 21, 'S');
  return b.construir();
}

/** Compone una sala con los cuadros en memoria (el magenta marca lo que todavía no existe). */
export function componerConCuadros(sala: SalaMapa, cuadros: Cuadros): Lienzo {
  return componerSala(sala, (id) => cuadros.get(id));
}
