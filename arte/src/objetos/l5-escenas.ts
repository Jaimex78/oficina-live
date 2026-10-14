/**
 * Salas de prueba del lote 5: cada objeto EN CONTEXTO, con las mismas reglas de orden del motor (`componerSala`), con
 * los cuadros en memoria del lote y lo publicado por los demás lotes.
 *
 * Salas: sala de juegos (mesas en `S` y `E`, ajedrez, sillas gamer), paredes (diana y aro en las tres paredes),
 * música (rockola, piano, guitarra y vinilo), pista de karts y sala de equipos (racks, nevera, cabina).
 */

import { ConstructorSala, type SalaMapa } from '@ol/shared';
import type { Lienzo } from '../nucleo';
import { componerSala, resolverCombinado, resolverDesdePublicados, type ResolverCuadro } from './compositor';
import type { Cuadros } from './l5-comun';

function resolverDeSalas(cuadros: Cuadros): ResolverCuadro {
  return resolverCombinado((id) => cuadros.get(id), resolverDesdePublicados());
}

/** Sala de juegos: las tres mesas grandes de frente y de lado, dos mesas de ajedrez y sillas gamer alrededor. */
export function salaJuegos(): SalaMapa {
  const b = new ConstructorSala('juegos', 'Sala de juegos de prueba', 22, 14);
  b.piso(0, 2, 22, 12, 'piso-baldosa-ajedrez');
  b.muro(0, 2, 21, 2);
  b.poner('mesa-billar', 1, 4, 'S').poner('mesa-air-hockey', 5, 4, 'S').poner('mesa-poker', 9, 4, 'S');
  b.poner('mesa-billar', 13, 4, 'E').poner('mesa-air-hockey', 16, 4, 'E').poner('mesa-poker', 19, 4, 'E');
  b.poner('mesa-ajedrez', 1, 9, 'S').poner('sillon-gamer', 0, 9, 'E', 'rojo').poner('sillon-gamer', 2, 9, 'O', 'azul');
  b.poner('mesa-ajedrez', 5, 9, 'E').poner('sillon-gamer', 5, 10, 'N', 'morado').poner('sillon-gamer', 5, 8, 'S');
  b.poner('diana-dardos', 12, 2, 'S').poner('aro-baloncesto', 16, 2, 'S');
  return b.construir();
}

/** Diana y aro en la pared del fondo y en las dos paredes laterales. */
export function salaParedes(): SalaMapa {
  const b = new ConstructorSala('paredes', 'Colgantes de prueba', 12, 9);
  b.piso(0, 2, 12, 7, 'piso-madera-clara');
  b.muro(0, 2, 11, 2).muro(0, 3, 0, 8).muro(11, 3, 11, 8);
  b.poner('diana-dardos', 3, 2, 'S').poner('aro-baloncesto', 7, 2, 'S');
  b.poner('diana-dardos', 0, 4, 'E').poner('aro-baloncesto', 0, 6, 'E');
  b.poner('diana-dardos', 11, 4, 'O').poner('aro-baloncesto', 11, 6, 'O');
  return b.construir();
}

/** Rincón de música: rockola, piano, guitarra y el vinilo gigante en el piso. */
export function salaMusica(): SalaMapa {
  const b = new ConstructorSala('musica', 'Música de prueba', 16, 11);
  b.piso(0, 2, 16, 9, 'piso-alfombra-lavanda');
  b.muro(0, 2, 15, 2);
  b.poner('vinilo-alfombra', 6, 5);
  b.poner('jukebox', 1, 3, 'S').poner('piano', 3, 3, 'S').poner('guitarra', 6, 3).poner('jukebox', 14, 3, 'S');
  b.poner('piano', 1, 6, 'E').poner('jukebox', 3, 7, 'E').poner('guitarra', 9, 7);
  b.poner('sillon-rojo', 11, 5, 'O', 'azul').poner('sillon-rojo', 11, 8, 'O', 'morado');
  return b.construir();
}

/** Pista de prueba: karts en las cuatro direcciones y los tres colores, con sillas gamer en la meta. */
export function salaKarts(): SalaMapa {
  const b = new ConstructorSala('karts', 'Karts y sillas de prueba', 16, 10);
  b.piso(0, 0, 16, 10, 'piso-cemento');
  const dirs = ['S', 'E', 'N', 'O'] as const;
  const vars = ['base', 'azul', 'rojo'] as const;
  vars.forEach((v, i) => dirs.forEach((d, j) => b.poner('kart', 1 + j * 2, 1 + i * 2, d, v)));
  const colores = ['base', 'rojo', 'azul', 'morado'] as const;
  colores.forEach((v, i) => dirs.forEach((d, j) => b.poner('sillon-gamer', 10 + j, 1 + i * 2, d, v)));
  return b.construir();
}

/** Sala de equipos: racks en hilera, nevera de vinos y cabina de fotos de frente y de lado. */
export function salaEquipos(): SalaMapa {
  const b = new ConstructorSala('equipos', 'Equipos de prueba', 16, 10);
  b.piso(0, 2, 16, 8, 'piso-baldosa');
  b.muro(0, 2, 15, 2);
  b.poner('rack-servidores', 1, 3, 'S').poner('rack-servidores', 2, 3, 'S').poner('rack-servidores', 3, 3, 'S');
  b.poner('nevera-vinos', 5, 3).poner('cabina-fotos', 7, 3, 'S').poner('rack-servidores', 10, 3, 'E');
  b.poner('cabina-fotos', 13, 5, 'E').poner('rack-servidores', 1, 7, 'E').poner('nevera-vinos', 4, 8);
  return b.construir();
}

export interface EscenaDelLote {
  nombre: string;
  imagen: Lienzo;
}

/** Compone las salas a escala 2 con los cuadros del lote y lo publicado por los demás. */
export function escenasDelLote5(cuadros: Cuadros): EscenaDelLote[] {
  const resolver = resolverDeSalas(cuadros);
  const hacer = (nombre: string, sala: SalaMapa): EscenaDelLote => ({ nombre, imagen: componerSala(sala, resolver).escalar(2) });
  return [
    hacer('juegos', salaJuegos()),
    hacer('paredes', salaParedes()),
    hacer('musica', salaMusica()),
    hacer('karts', salaKarts()),
    hacer('equipos', salaEquipos()),
  ];
}
