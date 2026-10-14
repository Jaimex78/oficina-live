/**
 * Salas de prueba del lote 4 y de la primera mitad del lote 3: sirven para ver cada objeto EN CONTEXTO, con las mismas
 * reglas de orden del motor (`componerSala`), con los cuadros en memoria del lote y lo publicado por los demás lotes.
 * Lo que otro lote todavía no haya publicado sale como un cuadro magenta con una X.
 *
 * Salas: pisos (los cuatro tiles con cono, reloj, planta globo y sillones), escritorios gamer (lo apoyado sobre las
 * tapas), baños (urinarios, sanitarios, lavamanos de frente y de lado) y orientaciones (sanitarios y sillones en
 * las cuatro direcciones).
 */

import { ConstructorSala, type SalaMapa } from '@ol/shared';
import type { Lienzo } from '../nucleo';
import { componerSala, resolverCombinado, resolverDesdePublicados, type ResolverCuadro } from './compositor';
import type { Cuadros } from './l4-comun';

function resolverDeSalas(cuadros: Cuadros): ResolverCuadro {
  return resolverCombinado((id) => cuadros.get(id), resolverDesdePublicados());
}

/** Los cuatro pisos lado a lado con lo de suelo: cono, reloj de pie, planta globo y sillones. */
export function salaPisos(): SalaMapa {
  const b = new ConstructorSala('pisos', 'Pisos de prueba', 20, 12);
  b.piso(0, 2, 5, 10, 'piso-ladrillo-crema');
  b.piso(5, 2, 5, 10, 'piso-alfombra-lavanda');
  b.piso(10, 2, 5, 10, 'piso-baldosa-ajedrez');
  b.piso(15, 2, 5, 10, 'piso-losa-rombos');
  b.muro(0, 2, 19, 2);
  // Pasillo de ladrillo: cono y reloj de pie.
  b.poner('reloj-de-pie', 1, 3).poner('cono-naranja', 3, 5).poner('cono-naranja', 3, 9).poner('planta-globo', 1, 9);
  // Sala de alfombra lavanda: cuatro sillones alrededor de una mesa de centro.
  b.poner('sillon-rojo', 6, 5, 'E').poner('sillon-rojo', 8, 5, 'O', 'azul');
  b.poner('mesa-centro', 6, 6, 'S');
  b.poner('sillon-rojo', 6, 8, 'N', 'verde').poner('sillon-rojo', 8, 8, 'S', 'morado');
  // Área de equipo de baldosa en damero: escritorios y sillas.
  b.poner('escritorio-individual', 11, 4, 'S').poner('silla-oficina', 11, 3, 'S');
  b.poner('escritorio-individual', 11, 8, 'S').poner('silla-oficina', 11, 9, 'N');
  b.poner('planta-globo', 14, 4).poner('cono-naranja', 14, 10);
  // Descanso de losa con rombos.
  b.poner('sillon-rojo', 16, 4, 'S', 'amarillo').poner('sillon-rojo', 18, 4, 'S', 'negro');
  b.poner('mesa-centro', 16, 7, 'S').poner('reloj-de-pie', 18, 9);
  return b.construir();
}

/** Escritorios gamer y de oficina con todo lo apoyado encima: computadores, consolas, lámpara, plantas y objetos pequeños. */
export function salaEscritoriosGamer(): SalaMapa {
  const b = new ConstructorSala('gamer', 'Escritorios gamer de prueba', 20, 12);
  b.piso(0, 0, 20, 12, 'piso-baldosa-ajedrez');
  const variantes = ['base', 'azul', 'rojo', 'morado'] as const;
  variantes.forEach((v, i) => {
    const x = 1 + i * 5;
    b.poner('escritorio-individual', x, 3, 'S').poner('pc-gamer', x, 3, 'S', v).poner('silla-oficina', x + 1, 4, 'N');
  });
  // Escritorio con consola, lámpara y objetos pequeños.
  b.poner('escritorio-individual', 1, 8, 'S').poner('ps5', 1, 8).poner('consola-juegos', 2, 8).poner('silla-oficina', 1, 9, 'N');
  b.poner('escritorio-individual', 5, 8, 'S').poner('lampara-escritorio', 5, 8).poner('figuritas', 6, 8).poner('silla-oficina', 6, 9, 'N');
  b.poner('escritorio-individual', 9, 8, 'S').poner('manzana', 9, 8).poner('pato-de-goma', 10, 8).poner('silla-oficina', 9, 9, 'N');
  b.poner('escritorio-individual', 13, 8, 'S').poner('taza-postre', 13, 8).poner('bowl-comida', 14, 8).poner('silla-oficina', 14, 9, 'N');
  b.poner('escritorio-individual', 17, 8, 'S').poner('planta-helecho', 17, 8).poner('suculenta', 18, 8).poner('silla-oficina', 17, 9, 'N');
  return b.construir();
}

/** Baño: urinarios en la pared del fondo, sanitarios de frente y de lado, lavamanos de frente y de lado. */
export function salaBanos(): SalaMapa {
  const b = new ConstructorSala('banos', 'Baños de prueba', 16, 12);
  b.piso(0, 0, 16, 12, 'piso-losa-rombos');
  b.muro(0, 2, 15, 2).muro(0, 3, 0, 11).muro(15, 3, 15, 11);
  // Pared del fondo: tres urinarios y, a la derecha, un lavamanos doble.
  b.poner('urinario', 2, 2, 'S').poner('urinario', 3, 2, 'S').poner('urinario', 4, 2, 'S');
  b.poner('sanitario', 7, 3, 'S').poner('sanitario', 9, 3, 'S');
  b.poner('lavamanos', 11, 3, 'S');
  // Paredes laterales: urinarios, lavamanos y sanitarios de lado.
  b.poner('urinario', 0, 5, 'E').poner('urinario', 15, 5, 'O');
  b.poner('lavamanos', 1, 7, 'E');
  b.poner('sanitario', 13, 8, 'O');
  b.poner('sanitario', 1, 10, 'E');
  // Un sanitario mirando al norte, en el centro.
  b.poner('sanitario', 7, 8, 'N');
  return b.construir();
}

export interface EscenaDelLote {
  nombre: string;
  imagen: Lienzo;
}

/** Compone las salas a escala 2 con los cuadros del lote y lo publicado por los demás. */
export function escenasDelLote4(cuadros: Cuadros): EscenaDelLote[] {
  const resolver = resolverDeSalas(cuadros);
  const hacer = (nombre: string, sala: SalaMapa): EscenaDelLote => ({ nombre, imagen: componerSala(sala, resolver).escalar(2) });
  return [hacer('pisos', salaPisos()), hacer('escritorios-gamer', salaEscritoriosGamer()), hacer('banos', salaBanos())];
}
