import type { MapaOficina } from '../mapa';
import { ConstructorSala } from '../oficina';
import { banoHombres, banoMujeres } from './banos';
import { colgar, mesaConSillas, sobreMesa } from './comun';
import { cascaron } from './edificio';

/**
 * «Sede con salas de reunión»: una planta pensada para recibir y reunirse, sobre el mismo edificio de 46x30 casillas. Recibidor amplio
 * con recepción, cafetería y baños con cubículos arriba; en el medio cuatro salas de reunión con pared de vidrio (una de 12 personas,
 * dos de 6 y una de 4, todas con TV); el pasillo hasta la puerta de la terraza; y abajo una sala creativa (war room) con mesa grande
 * y notas, y una biblioteca con zona de descanso. Se arma con `.estricto()`.
 *
 * Un pasillo de 2 casillas (x 12..13) baja del recibidor al pasillo de y 20..21, entre la sala grande y las dos medianas.
 */

function pisoDe(x: number, y: number): string {
  if (x >= 25 && y <= 12) return 'piso-cocina'; // baños
  if (x >= 16 && y <= 12) return 'piso-baldosa'; // cafetería
  if (y <= 12) return 'piso-madera-clara'; // recibidor
  if (y >= 20 && y <= 21) return 'piso-madera-clara'; // pasillo
  if (y >= 14 && y <= 19 && (x < 12 || x > 13)) return 'piso-alfombra-gris'; // salas de reunión
  if (y >= 21 && x <= 10) return 'piso-madera-oscura'; // sala creativa
  if (y >= 22 && x >= 15) return 'piso-parquet'; // biblioteca
  return 'piso-madera-clara';
}

export function plantillaSede(): MapaOficina {
  const b = new ConstructorSala('piso-4', 'Piso 4', 46, 30).estricto();
  cascaron(b, pisoDe);

  // ---------- muros ----------
  b.muro(25, 4, 25, 12, 'pared-lisa').muro(26, 8, 35, 8, 'pared-lisa');
  b.poner('puerta-simple', 25, 7, 'E').poner('puerta-simple', 25, 12, 'E');
  // Salas de reunión: muro norte liso (para la TV), paredes de vidrio a los lados y al pasillo, una puerta cada una al sur.
  b.muro(2, 13, 11, 13, 'pared-lisa').muro(14, 13, 35, 13, 'pared-lisa');
  for (const x of [11, 14, 22, 30]) b.muro(x, 14, x, 19, 'vidrio');
  b.muro(2, 19, 11, 19, 'vidrio').muro(14, 19, 35, 19, 'vidrio');
  for (const x of [6, 18, 26, 33]) b.poner('puerta-vidrio', x, 19, 'S');
  // Abajo: la sala creativa (con pared de vidrio al este) y la biblioteca, abiertas al pasillo. La fila de y 25 queda detrás del muro de
  // afuera, así que ahí solo van muebles altos.
  b.muro(11, 21, 11, 25, 'vidrio');
  b.poner('puerta-simple', 36, 20, 'E');

  // ---------- fachada ----------
  colgar(b, 3, [['ventana-moderna', 2], ['ventana-moderna', 4], ['ventana-moderna', 10], ['ventana-moderna', 12], ['cuadro-cubista', 14], ['extintor', 15], ['ventana-batiente', 17], ['reloj-estandar', 19], ['ventana-batiente', 21], ['cuadro-chico', 23]]);
  b.poner('letrero-oficina-live', 6, 3, 'S');
  b.poner('cartel-zona', 16, 3, 'S', 'base', { titulo: 'Cafetería', texto: 'Café, almuerzo y mesas para conversar.' });
  b.poner('cartel-zona', 27, 3, 'S', 'base', { titulo: 'Baños', texto: 'Hombres arriba, mujeres abajo.' });

  // ---------- recibidor amplio ----------
  b.poner('recepcion', 6, 5, 'S').poner('taburete', 7, 4);
  b.poner('totem-bienvenida', 10, 5, 'U', 'base', { titulo: 'Bienvenida', texto: 'Bienvenido a la sede. Las salas de reunión están en el piso, siguiendo el pasillo.' });
  b.poner('hosta-grande', 2, 4).poner('palma-maceta', 14, 4).poner('perchero', 3, 5);
  b.poner('alfombra-grande', 3, 9, 'U', 'azul').poner('alfombra-grande', 8, 9, 'U', 'rojo');
  b.poner('sofa-lecorbusier', 3, 8, 'S', 'negro').poner('mesa-centro-tronco', 4, 9, 'S');
  sobreMesa(b, 4, 9, [['bonsai', 0], ['libro-abierto', 1]]);
  b.poner('butaca-lecorbusier', 3, 10, 'N', 'azul').poner('butaca-lecorbusier', 5, 10, 'N', 'azul');
  b.poner('sofa-3', 8, 8, 'S', 'verde').poner('mesa-centro', 9, 9, 'S', 'madera');
  sobreMesa(b, 9, 9, [['taza-regular', 0], ['taza-te', 1]]);
  b.poner('puf-saco', 8, 10, 'U', 'verde').poner('puf-saco', 10, 10, 'U', 'azul');
  b.poner('ficus', 2, 8).poner('lampara-pie', 11, 8).poner('planta-grande', 2, 12);
  b.llegadas({ x: 6, y: 8 }, { x: 7, y: 7 }, { x: 8, y: 6 }, { x: 11, y: 7 }, { x: 12, y: 8 }, { x: 12, y: 10 });

  // ---------- cafetería ----------
  b.poner('barra', 16, 4, 'S');
  sobreMesa(b, 16, 4, [['cafetera-filtro', 0], ['tostadora', 1], ['frutero', 2]]);
  b.poner('maquina-cafe', 19, 4).poner('nevera', 20, 4).poner('dispensador-agua', 21, 4);
  b.poner('barra', 22, 4, 'S');
  sobreMesa(b, 22, 4, [['maquina-espresso', 0], ['taza-regular', 1], ['taza-ancha', 2, 0, 'verde']]);
  mesaConSillas(b, { mesa: 'mesa-redonda', x: 17, y: 6, silla: 'silla-cafe', colorSilla: 'rojo', sobre: [['taza-regular', 0], ['dona', 1, 1]] });
  mesaConSillas(b, { mesa: 'mesa-redonda', x: 22, y: 6, variante: 'blanco', silla: 'silla-cafe', colorSilla: 'blanco', sobre: [['taza-te', 0], ['pandebono', 1, 1]] });
  mesaConSillas(b, { mesa: 'mesa-comedor', x: 19, y: 10, orientacion: 'S', silla: 'silla-cafe', colorSilla: 'negro', lados: 'largos', sobre: [['ensalada', 0], ['botella-agua', 1], ['bowl-comida', 2, 1]] });
  b.poner('palma-maceta', 16, 12).poner('planta-grande', 24, 5);

  // ---------- baños ----------
  banoHombres(b, 26, 4);
  banoMujeres(b, 26, 9);

  // ---------- cuatro salas de reunión ----------
  // Sala grande, de 12 personas.
  mesaConSillas(b, { mesa: 'mesa-reunion-12', x: 3, y: 15, orientacion: 'S', silla: 'silla-reunion', colorSilla: 'negro', lados: 'largos', sobre: [['portatil', 0], ['taza-regular', 1, 1], ['documentos-pila', 2], ['taza-ancha', 3, 1, 'azul'], ['cuaderno-abierto', 4], ['documentos-pila', 5, 1]] });
  b.poner('tv-pared', 5, 13, 'S').poner('reloj-minimalista', 3, 13, 'S').poner('cuadro-grande', 8, 13, 'S').poner('planta-grande', 2, 14).poner('lampara-pie', 10, 14);
  // Dos salas de 6.
  for (const [x, tv] of [[17, 17], [25, 25]] as const) {
    mesaConSillas(b, { mesa: 'mesa-reunion-6', x, y: 15, orientacion: 'S', silla: 'silla-reunion', colorSilla: x === 17 ? 'rojo' : 'base', lados: 'largos', sobre: [['portatil', 1], ['taza-regular', 0, 1], ['cuaderno-cerrado', 2, 1]] });
    b.poner('tv-pared', tv, 13, 'S').poner('planta-grande', x - 2, 14).poner('lampara-pie', x + 4, 14);
  }
  b.poner('reloj-estandar', 16, 13, 'S').poner('cuadro-chico', 20, 13, 'S').poner('cuadro-mondrian', 24, 13, 'S').poner('reloj-minimalista', 28, 13, 'S');
  // Sala de 4.
  mesaConSillas(b, { mesa: 'mesa-reunion-4', x: 32, y: 15, orientacion: 'S', silla: 'silla-reunion', colorSilla: 'negro', lados: 'largos', sobre: [['portatil', 0], ['taza-te', 1, 1]] });
  b.poner('tv-pared', 32, 13, 'S').poner('planta-grande', 31, 14).poner('lampara-pie', 35, 14);
  // El pasillo de 2 casillas que baja del recibidor.
  b.poner('planta-grande', 12, 14).poner('lampara-pie', 13, 18);

  // ---------- sala creativa (war room): mesa grande con sillas a los dos lados y pizarras a los extremos ----------
  mesaConSillas(b, { mesa: 'mesa-reunion-8', x: 4, y: 22, orientacion: 'S', silla: 'silla-oficina', colorSilla: 'rojo', lados: 'largos', sobre: [['cuaderno-abierto', 0], ['taza-regular', 1, 1], ['documentos-pila', 2], ['documentos-pila', 3, 1], ['taza-alta', 3, 0, 'verde']] });
  b.poner('pizarra-pie', 2, 22, 'U', 'base', { enlace: 'https://whiteboard.office.com', titulo: 'Pizarra de ideas' }).poner('pizarra-pie', 9, 22, 'U', 'base', { enlace: 'https://whiteboard.office.com', titulo: 'Pizarra de la semana' });
  b.poner('planta-grande', 2, 25).poner('planta-grande', 10, 25).poner('lampara-pie', 2, 20);

  // ---------- biblioteca y zona de descanso ----------
  for (const x of [15, 17, 19, 21, 25, 27, 29, 31]) b.poner('estanteria-libros', x, 25, 'S');
  b.poner('planta-grande', 33, 25).poner('planta-serpiente', 35, 25).poner('planta-grande', 23, 25);
  b.poner('alfombra-grande', 16, 22, 'U', 'verde').poner('alfombra-grande', 29, 22, 'U', 'azul');
  b.poner('mesa-centro', 17, 22, 'S', 'madera').poner('sofa-3', 16, 23, 'N', 'amarillo').poner('butaca-nube', 20, 22, 'O').poner('lampara-pie', 20, 24);
  sobreMesa(b, 17, 22, [['taza-regular', 0], ['taza-te', 1]]);
  b.poner('mesa-centro', 30, 22, 'S', 'madera').poner('sofa-3', 29, 23, 'N', 'azul').poner('butaca-nube', 33, 22, 'O').poner('lampara-pie', 35, 24);
  sobreMesa(b, 30, 22, [['taza-ancha', 0, 0, 'azul'], ['taza-te', 1]]);

  // ---------- terraza ----------
  b.poner('planta-grande', 38, 21).poner('planta-grande', 41, 21);
  mesaConSillas(b, { mesa: 'mesa-terraza', x: 39, y: 23, silla: 'silla-comedor', lados: 'uno' });
  b.poner('banca-exterior', 37, 27, 'S').poner('jardinera', 39, 26, 'S').poner('planta-mediana', 41, 25);

  // ---------- zonas ----------
  b.zona('Recibidor', 'abierta', 2, 4, 13, 9);
  b.zona('Cafetería', 'abierta', 16, 4, 9, 9);
  b.zona('Baño de hombres', 'privada', 26, 4, 10, 4);
  b.zona('Baño de mujeres', 'privada', 26, 9, 10, 4);
  b.zona('Sala grande (12 personas)', 'sala', 2, 14, 9, 5);
  b.zona('Sala mediana 1 (6 personas)', 'sala', 15, 14, 7, 5);
  b.zona('Sala mediana 2 (6 personas)', 'sala', 23, 14, 7, 5);
  b.zona('Sala pequeña (4 personas)', 'sala', 31, 14, 5, 5);
  b.zona('Sala creativa (war room)', 'sala', 2, 21, 9, 4);
  b.zona('Biblioteca y descanso', 'silenciosa', 15, 22, 21, 4);
  b.zona('Terraza', 'abierta', 37, 20, 5, 8);

  return { version: 1, nombre: 'Oficina Live', salaInicial: 'piso-4', salas: [b.construir()] };
}
