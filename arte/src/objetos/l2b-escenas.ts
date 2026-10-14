/**
 * Salas de prueba del lote 2B: sirven para revisar cada objeto EN CONTEXTO. Se componen con las mismas reglas de
 * orden del motor (`componerSala`), con los cuadros en memoria del lote y lo publicado por los demás lotes.
 * Lo que otro lote todavía no haya publicado sale como un cuadro magenta con una X, y los pisos que falten se
 * reemplazan por unos de prueba sencillos.
 *
 * Salas: cocina (barra, lavaplatos, nevera y apoyados), terraza (deck, árbol, banca y fuente), sala navideña,
 * escritorios (lo apoyado sobre las tapas), paredes (lo colgado, de frente y de lado) y cerca.
 */

import { ConstructorSala, type SalaMapa } from '@ol/shared';
import { Lienzo } from '../nucleo';
import { componerSala, resolverCombinado, resolverDesdePublicados, type ResolverCuadro } from './compositor';
import type { Cuadros } from './l2b-comun';

/** Piso sencillo de 32 x 32 para las salas de prueba cuando el lote 2A todavía no publica el suyo. */
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
  if (id === 'piso-deck') {
    for (let f = 0; f < 4; f++) {
      l.rect(0, f * 8, 32, 7, 'madera-clara-2');
      l.rect(0, f * 8 + 7, 32, 1, 'madera-clara-1');
      l.rect([9, 25, 3, 17][f] ?? 0, f * 8, 1, 7, 'madera-clara-1');
    }
    return l;
  }
  if (id === 'piso-cocina') {
    for (let y = 0; y < 32; y += 16) for (let x = 0; x < 32; x += 16) l.rect(x, y, 16, 16, (x + y) % 32 === 0 ? 'baldosa-3' : 'baldosa-2');
    return l;
  }
  return undefined;
}

function resolverDeSalas(cuadros: Cuadros): ResolverCuadro {
  return resolverCombinado((id) => cuadros.get(id), resolverDesdePublicados(), pisoDePrueba);
}

// ---------------------------------------------------------------------------
// Salas
// ---------------------------------------------------------------------------

/** Cocina completa: fila de aparatos junto a la pared, barra con apoyados, lavaplatos, isla con taburetes y colgantes. */
export function salaCocina(): SalaMapa {
  const b = new ConstructorSala('cocina', 'Cocina de prueba', 18, 12);
  b.piso(0, 2, 18, 10, 'piso-cocina');
  b.muro(0, 2, 17, 2).muro(0, 11, 17, 11).muro(0, 3, 0, 10).muro(17, 3, 17, 10);
  // Pared del fondo: ventanas con cortinas, reloj, cuadro y corcho.
  b.poner('pared-ventana', 12, 2, 'S').poner('cortinas', 12, 2, 'S', 'amarillo');
  b.poner('pared-ventana', 15, 2, 'S').poner('cortinas', 15, 2, 'S', 'verde');
  b.poner('reloj-pared', 9, 2, 'S').poner('cuadro-chico', 6, 2, 'S').poner('corcho', 3, 2, 'S');
  // Fila de aparatos y mostradores.
  b.poner('nevera', 1, 3).poner('maquina-cafe', 2, 3);
  b.poner('lavaplatos', 3, 3, 'S');
  b.poner('barra', 5, 3, 'S').poner('cafetera', 5, 3).poner('tostadora', 6, 3).poner('microondas', 7, 3);
  b.poner('dispensador-agua', 8, 3).poner('maquina-expendedora', 9, 3).poner('nevera-bebidas', 10, 3);
  b.poner('barra', 11, 3, 'S').poner('frutero', 11, 3).poner('planta-chica', 12, 3).poner('lampara-mesa', 13, 3);
  b.poner('palmera', 15, 3);
  // Isla con taburetes.
  b.poner('barra', 6, 7, 'S').poner('frutero', 7, 7).poner('parlante', 8, 7);
  for (const x of [6, 7, 8]) b.poner('taburete', x, 8);
  // Lado izquierdo y derecho.
  b.poner('lavaplatos', 1, 5, 'E').poner('planta-grande', 1, 9);
  b.poner('cuadro-chico', 17, 5, 'O').poner('reloj-pared', 17, 6, 'O').poner('espejo', 17, 7, 'O');
  b.zona('Cocina', 'abierta', 1, 3, 16, 8);
  return b.construir();
}

/** Terraza: deck y césped, árbol, banca, fuente, mesas con sombrillas, jardineras, bicicletero y cerca. */
export function salaTerraza(): SalaMapa {
  const b = new ConstructorSala('terraza', 'Terraza de prueba', 20, 14);
  b.piso(0, 2, 20, 12, 'piso-cesped');
  b.piso(1, 2, 18, 7, 'piso-deck');
  b.muro(0, 2, 19, 2);
  // Pared del edificio: banca, jardineras y cuadros.
  b.poner('jardinera', 1, 3, 'S').poner('banca-exterior', 4, 3, 'S').poner('banca-exterior', 13, 3, 'S').poner('jardinera', 16, 3, 'S');
  b.poner('cuadro-chico', 8, 2, 'S').poner('reloj-pared', 11, 2, 'S');
  // Dos mesas de terraza con sombrilla.
  for (const [x, v] of [[7, 'base'], [11, 'blanco']] as const) {
    b.poner('mesa-terraza', x, 5, 'U', v === 'blanco' ? 'blanco' : 'base');
    b.poner('sombrilla', x - 1, 4, 'U', v === 'blanco' ? 'rojo' : 'base');
  }
  b.poner('bicicletero', 16, 7, 'S').poner('palmera', 18, 3);
  // Césped: fuente, árboles, banca de lado y cerca.
  b.poner('fuente', 8, 9).poner('arbol', 2, 9).poner('arbol', 15, 9);
  b.poner('banca-exterior', 5, 9, 'E').poner('jardinera', 12, 9, 'S');
  b.muro(0, 13, 19, 13, 'cerca').muro(0, 9, 0, 12, 'cerca').muro(19, 9, 19, 12, 'cerca');
  return b.construir();
}

/** Sala navideña y de fiesta: árboles, regalos, luces, banderines, globos, piñata, cartel y una alfombra roja. */
export function salaNavidad(): SalaMapa {
  const b = new ConstructorSala('navidad', 'Sala navideña de prueba', 16, 11);
  b.piso(0, 2, 16, 9, 'piso-madera-clara');
  b.muro(0, 2, 15, 2).muro(0, 3, 0, 9).muro(15, 3, 15, 9).muro(0, 10, 15, 10);
  b.poner('cartel-cumpleanos', 6, 2, 'S').poner('reloj-pared', 3, 2, 'S').poner('cuadro-chico', 11, 2, 'S');
  b.poner('luces-navidad', 2, 3).poner('luces-navidad', 12, 3).poner('banderines', 6, 3);
  b.poner('pinata', 8, 5).poner('globos', 1, 4).poner('globos', 14, 4, 'U', 'rojo').poner('globos', 6, 4, 'U', 'azul').poner('globos', 9, 4, 'U', 'amarillo');
  b.poner('arbol-navidad', 3, 6).poner('arbol-navidad', 12, 6);
  b.poner('regalos', 2, 7).poner('regalos', 4, 7, 'U', 'rojo').poner('regalos', 11, 7, 'U', 'azul').poner('regalos', 13, 7, 'U', 'verde');
  b.poner('alfombra-redonda', 7, 6, 'U', 'rojo');
  b.poner('mesa-centro', 7, 8, 'S').poner('calabazas', 7, 8).poner('regalos', 8, 8, 'U', 'verde');
  b.poner('planta-colgante', 5, 5).poner('lampara-colgante', 10, 5);
  b.poner('sofa-3', 6, 9, 'N', 'rojo').poner('cojin', 6, 9, 'U', 'amarillo').poner('cojin', 8, 9, 'U', 'azul');
  return b.construir();
}

/** Escritorios con lo apoyado encima y un mesón con aparatos de cocina. */
export function salaEscritorios(): SalaMapa {
  const b = new ConstructorSala('escritorios', 'Escritorios de prueba', 20, 14);
  b.piso(0, 0, 20, 14, 'piso-madera-clara');
  b.poner('escritorio-individual', 2, 3, 'S').poner('pc-doble', 2, 3, 'S').poner('silla-oficina', 2, 2, 'S');
  b.poner('escritorio-individual', 6, 3, 'S').poner('portatil', 6, 3, 'N').poner('planta-chica', 7, 3).poner('silla-oficina', 6, 2, 'S');
  b.poner('escritorio-individual', 10, 3, 'S').poner('lampara-mesa', 10, 3).poner('trofeos', 11, 3);
  b.poner('escritorio-individual', 14, 3, 'S').poner('pc-doble', 14, 3, 'S').poner('silla-oficina', 14, 4, 'N');
  b.poner('escritorio-individual', 2, 8, 'S').poner('portatil', 2, 8, 'S').poner('silla-oficina', 2, 9, 'N');
  b.poner('meson', 6, 8, 'S').poner('cafetera', 6, 8).poner('tostadora', 7, 8).poner('microondas', 8, 8);
  b.poner('meson', 11, 8, 'S').poner('frutero', 11, 8).poner('planta-chica', 12, 8).poner('parlante', 13, 8);
  b.poner('escritorio-individual', 16, 8, 'S').poner('pc-doble', 16, 8, 'S').poner('silla-oficina', 16, 7, 'S');
  b.poner('sofa-3', 6, 12, 'N').poner('cojin', 6, 12, 'U', 'rojo').poner('cojin', 8, 12, 'U', 'verde');
  return b.construir();
}

/** Paredes con lo colgado de frente (arriba) y de lado (a los costados): cuadro, reloj, cámara, espejo, cortinas, corcho, post-its y cartel. */
export function salaParedes(): SalaMapa {
  const b = new ConstructorSala('paredes', 'Colgados de prueba', 16, 16);
  b.piso(0, 1, 16, 15, 'piso-madera-clara');
  b.muro(1, 2, 14, 2);
  b.poner('cuadro-chico', 1, 2, 'S').poner('reloj-pared', 2, 2, 'S').poner('camara-sala', 3, 2, 'S').poner('espejo', 4, 2, 'S');
  b.poner('pared-ventana', 5, 2, 'S').poner('cortinas', 5, 2, 'S');
  b.poner('pared-ventana', 7, 2, 'S').poner('cortinas', 7, 2, 'S', 'rojo');
  b.poner('corcho', 9, 2, 'S').poner('pared-postits', 10, 2, 'S').poner('cartel-cumpleanos', 12, 2, 'S');
  b.muro(1, 4, 1, 14).muro(14, 4, 14, 14);
  for (const [objeto, y] of [['cuadro-chico', 4], ['reloj-pared', 5], ['camara-sala', 6], ['espejo', 7], ['corcho', 8], ['cortinas', 9]] as const) {
    b.poner(objeto, 1, y, 'E');
    b.poner(objeto, 14, y, 'O');
  }
  b.poner('pared-postits', 1, 10, 'E').poner('pared-postits', 14, 10, 'O');
  b.poner('cartel-cumpleanos', 1, 12, 'E').poner('cartel-cumpleanos', 14, 12, 'O');
  return b.construir();
}

/** Cerca en las tres variantes: corral cerrado, T, cruce, pilar suelto, extremos libres y tramos con esquina. */
export function salaCerca(): SalaMapa {
  const b = new ConstructorSala('cerca', 'Cercas de prueba', 20, 14);
  b.piso(0, 0, 20, 14, 'piso-cesped');
  b.muro(1, 1, 8, 1, 'cerca').muro(1, 6, 8, 6, 'cerca').muro(1, 2, 1, 5, 'cerca').muro(8, 2, 8, 5, 'cerca');
  b.muro(11, 1, 18, 1, 'cerca', 'blanco').muro(14, 1, 14, 6, 'cerca', 'blanco').muro(11, 4, 18, 4, 'cerca', 'blanco');
  b.muro(1, 9, 8, 9, 'cerca', 'negro').muro(4, 9, 4, 12, 'cerca', 'negro');
  b.muro(11, 8, 11, 8, 'cerca').muro(13, 8, 15, 8, 'cerca').muro(17, 8, 17, 11, 'cerca', 'negro').muro(11, 11, 15, 11, 'cerca').muro(15, 11, 15, 13, 'cerca');
  return b.construir();
}

// ---------------------------------------------------------------------------
// Imágenes
// ---------------------------------------------------------------------------

export interface EscenaDelLote {
  nombre: string;
  imagen: Lienzo;
}

/** Compone todas las salas de prueba a escala 2 con los cuadros del lote y lo publicado por los demás. */
export function escenasDelLote2B(cuadros: Cuadros): EscenaDelLote[] {
  const resolver = resolverDeSalas(cuadros);
  const hacer = (nombre: string, sala: SalaMapa, region?: { x: number; y: number; w: number; h: number }): EscenaDelLote => ({
    nombre,
    imagen: componerSala(sala, resolver, region ? { region } : {}).escalar(2),
  });
  return [
    hacer('cocina', salaCocina()),
    hacer('terraza', salaTerraza()),
    hacer('navidad', salaNavidad()),
    hacer('escritorios', salaEscritorios()),
    hacer('paredes', salaParedes(), { x: 0, y: 1, w: 16, h: 15 }),
    hacer('cerca', salaCerca()),
  ];
}
