import type { MapaOficina } from '../mapa';
import { ConstructorSala } from '../oficina';
import { banoHombres, banoMujeres } from './banos';
import { colgar, mesaConSillas, sobreMesa, type Sobre } from './comun';
import { cascaron } from './edificio';

/**
 * «Oficina abierta»: una planta de espacio compartido sobre el mismo edificio de 46x30 casillas. Equipos de seis en escritorios de
 * 3x2 con tres sillas por lado, dos salas de reuniones con pared de vidrio, una zona grande de coworking con sofás y puffs, una
 * cocineta con barra, baños con cubículos, tres cabinas telefónicas, recibidor y la terraza del balcón. Se arma con `.estricto()`.
 *
 * Arriba (y 4..12): recibidor, cocineta y baños. Abajo (y 14..25): salas de reuniones a la izquierda, el espacio de equipos en el
 * centro y, a la derecha, el coworking y las cabinas. El pasillo de y 18..20 cruza todo hasta la puerta de la terraza.
 */

function pisoDe(x: number, y: number): string {
  if (x >= 25 && y <= 12) return 'piso-cocina'; // baños
  if (x >= 12 && y <= 12) return 'piso-baldosa'; // cocineta
  if (y <= 12) return 'piso-madera-clara'; // recibidor
  if (x <= 11) return 'piso-alfombra-gris'; // salas de reuniones
  if (x >= 28 && y <= 17) return 'piso-parquet'; // coworking
  if (y >= 18 && y <= 20) return 'piso-madera-clara'; // pasillo
  return 'piso-alfombra-gris'; // equipos y cabinas
}

const EQUIPOS: { x: number; y: number; desk: string; silla: string; colorSilla: string; sobre: Sobre[] }[] = [
  { x: 14, y: 15, desk: 'escritorio-3x2', silla: 'silla-oficina', colorSilla: 'base', sobre: [['portatil', 0], ['taza-regular', 1, 1, 'azul'], ['cuaderno-abierto', 2, 1]] },
  { x: 19, y: 15, desk: 'escritorio-3x2', silla: 'silla-oficina', colorSilla: 'negro', sobre: [['monitor', 0], ['planta-chica', 2], ['taza-ancha', 1, 1, 'rojo']] },
  { x: 24, y: 15, desk: 'escritorio-3x2', silla: 'silla-oficina', colorSilla: 'rojo', sobre: [['portatil', 1], ['lampara-escritorio', 0, 1], ['cuaderno-cerrado', 2, 1]] },
  { x: 14, y: 22, desk: 'escritorio-3x2', silla: 'silla-oficina', colorSilla: 'negro', sobre: [['monitor', 1], ['documentos-pila', 0, 1], ['taza-alta', 2, 1, 'verde']] },
  { x: 19, y: 22, desk: 'escritorio-3x2', silla: 'silla-oficina', colorSilla: 'base', sobre: [['portatil', 0], ['planta-chica', 1], ['taza-regular', 2, 1]] },
  { x: 24, y: 22, desk: 'escritorio-3x2', silla: 'silla-oficina', colorSilla: 'rojo', sobre: [['monitor', 2], ['cuaderno-abierto', 0, 1], ['pato-de-goma', 1, 1]] },
];

export function plantillaOficinaAbierta(): MapaOficina {
  const b = new ConstructorSala('piso-4', 'Piso 4', 46, 30).estricto();
  cascaron(b, pisoDe);

  // ---------- muros ----------
  b.muro(25, 4, 25, 12, 'pared-lisa').muro(26, 8, 35, 8, 'pared-lisa').muro(25, 13, 35, 13, 'pared-lisa');
  b.poner('puerta-simple', 25, 7, 'E').poner('puerta-simple', 25, 12, 'E');
  // Salas de reuniones: muro norte liso (para colgar la TV) y pared de vidrio hacia el espacio de equipos.
  b.muro(2, 13, 11, 13, 'pared-lisa').muro(2, 19, 10, 19, 'pared-lisa').muro(11, 14, 11, 25, 'vidrio');
  b.poner('puerta-vidrio', 11, 16, 'E').poner('puerta-vidrio', 11, 22, 'E');
  // Cabinas telefónicas: tres cabinas de 2x4 con paredes de vidrio y una puerta al pasillo.
  b.muro(28, 21, 35, 21, 'vidrio').muro(27, 21, 27, 25, 'vidrio').muro(30, 21, 30, 25, 'vidrio').muro(33, 21, 33, 25, 'vidrio');
  for (const x of [28, 31, 34]) b.poner('puerta-vidrio', x, 21, 'S');
  b.poner('puerta-simple', 36, 20, 'E');

  // ---------- fachada ----------
  colgar(b, 3, [['ventana-moderna', 2], ['ventana-moderna', 4], ['ventana-moderna', 8], ['ventana-moderna', 10], ['ventana-batiente', 14], ['reloj-estandar', 16], ['ventana-batiente', 18], ['ventana-batiente', 21], ['cuadro-chico', 23]]);
  b.poner('letrero-oficina-live', 5, 3, 'S');
  b.poner('cartel-zona', 12, 3, 'S', 'base', { titulo: 'Cocineta', texto: 'Café, almuerzo y mesas para conversar.' });
  b.poner('cartel-zona', 27, 3, 'S', 'base', { titulo: 'Baños', texto: 'Hombres arriba, mujeres abajo.' });

  // ---------- recibidor ----------
  b.poner('recepcion', 3, 5, 'S').poner('taburete', 4, 4);
  b.poner('totem-bienvenida', 7, 5, 'U', 'base', { titulo: 'Bienvenida', texto: 'Bienvenido a la oficina abierta del piso 4.' });
  b.poner('perchero', 10, 4).poner('hosta-grande', 2, 4);
  b.poner('alfombra-grande', 3, 9, 'U', 'azul');
  b.poner('sofa-3', 3, 10, 'N', 'azul').poner('mesa-centro', 4, 9, 'S');
  sobreMesa(b, 4, 9, [['taza-regular', 0], ['taza-te', 1]]);
  b.poner('butaca-knoll', 7, 9, 'O', 'negro').poner('lampara-pie', 7, 11).poner('ficus', 10, 11).poner('planta-grande', 10, 7);
  b.llegadas({ x: 6, y: 7 }, { x: 7, y: 7 }, { x: 8, y: 7 }, { x: 6, y: 8 }, { x: 7, y: 8 }, { x: 8, y: 8 });

  // ---------- cocineta ----------
  b.poner('barra', 13, 4, 'S');
  sobreMesa(b, 13, 4, [['cafetera-filtro', 0], ['microondas', 1], ['frutero', 2]]);
  b.poner('nevera', 16, 4).poner('maquina-cafe', 17, 4).poner('dispensador-agua', 18, 4);
  b.poner('barra', 19, 4, 'S');
  sobreMesa(b, 19, 4, [['tostadora', 0], ['taza-regular', 1], ['caja-donas', 2]]);
  b.poner('estante-cocina', 22, 4, 'S');
  mesaConSillas(b, { mesa: 'mesa-comedor', x: 14, y: 7, silla: 'silla-cafe', colorSilla: 'rojo', sobre: [['tabla-quesos', 0], ['botella-agua', 1], ['ensalada', 2, 1]] });
  mesaConSillas(b, { mesa: 'mesa-redonda', x: 21, y: 8, variante: 'madera', silla: 'silla-cafe', colorSilla: 'negro', sobre: [['taza-te', 0], ['dona', 1, 1]] });
  b.poner('planta-grande', 13, 12).poner('palma-maceta', 23, 12);

  // ---------- baños ----------
  banoHombres(b, 26, 4);
  banoMujeres(b, 26, 9);

  // ---------- salas de reuniones (pared de vidrio) ----------
  b.poner('tv-pared', 5, 13, 'S').poner('cuadro-grande', 8, 13, 'S').poner('reloj-minimalista', 3, 13, 'S');
  mesaConSillas(b, { mesa: 'mesa-reunion-8', x: 4, y: 15, orientacion: 'S', silla: 'silla-reunion', colorSilla: 'negro', sobre: [['portatil', 0], ['taza-regular', 1, 1], ['documentos-pila', 2]] });
  b.poner('planta-grande', 2, 14).poner('lampara-pie', 10, 14); // la última fila (y 18) queda detrás del muro de abajo: sin nada
  b.poner('pared-postits', 4, 19, 'S', 'base', { texto: 'Ideas de la sesión: pega aquí tus notas.' });
  colgar(b, 19, [['reloj-pared', 7]]);
  mesaConSillas(b, { mesa: 'mesa-reunion-6', x: 4, y: 22, orientacion: 'S', silla: 'silla-reunion', colorSilla: 'rojo', sobre: [['portatil', 1], ['cuaderno-abierto', 0, 1], ['taza-ancha', 2, 1, 'azul']] });
  b.poner('planta-grande', 2, 20).poner('planta-grande', 10, 25);

  // ---------- espacio de equipos: seis escritorios de 3x2, tres sillas por lado ----------
  for (const e of EQUIPOS) mesaConSillas(b, { mesa: e.desk, x: e.x, y: e.y, orientacion: 'S', silla: e.silla, colorSilla: e.colorSilla, lados: 'largos', sobre: e.sobre });
  b.poner('planta-grande', 12, 14).poner('palma-maceta', 12, 25).poner('lampara-flecos', 27, 14);
  b.poner('impresora-oficina', 12, 18, 'S');
  b.poner('locker', 15, 25, 'S').poner('locker', 16, 25, 'S').poner('locker', 17, 25, 'S').poner('estanteria-libros', 20, 25, 'S');
  b.poner('planta-serpiente', 28, 19);

  // ---------- coworking: sofás y puffs sobre alfombras ----------
  b.poner('alfombra-grande', 28, 15, 'U', 'verde').poner('alfombra-grande', 32, 15, 'U', 'azul');
  b.poner('sofa-3', 28, 14, 'S', 'negro').poner('sofa-2', 33, 14, 'S', 'amarillo');
  b.poner('mesa-centro', 29, 16, 'S', 'madera').poner('mesa-centro', 33, 16, 'S', 'madera');
  sobreMesa(b, 29, 16, [['taza-ancha', 0, 0, 'verde'], ['portatil', 1]]);
  sobreMesa(b, 33, 16, [['taza-te', 0], ['taza-regular', 1]]);
  b.poner('puf-saco', 31, 15, 'U', 'rojo').poner('puf-saco', 31, 16, 'U', 'azul').poner('puff', 35, 16, 'U', 'verde').poner('butaca-nube', 28, 17, 'N').poner('sillon-lounger', 35, 14, 'O', 'negro');
  b.poner('ficus', 31, 14).poner('lampara-arco', 35, 17);
  colgar(b, 13, [['mapa-mundi', 29], ['cuadro-abstracto-circulos', 32], ['reloj-minimalista', 35]]);

  // ---------- cabinas telefónicas ----------
  for (const x of [28, 31, 34]) {
    b.poner('mesa-centro', x, 25, 'S');
    sobreMesa(b, x, 25, [['portatil', 0], ['taza-te', 1]]);
    b.poner('silla-simple', x, 24, 'S').poner('lampara-pie', x + 1, 22);
  }

  // ---------- terraza ----------
  b.poner('planta-grande', 38, 21).poner('planta-grande', 41, 21);
  mesaConSillas(b, { mesa: 'mesa-terraza', x: 39, y: 23, silla: 'silla-comedor', lados: 'uno' });
  b.poner('banca-exterior', 37, 27, 'S').poner('jardinera', 39, 26, 'S').poner('planta-mediana', 41, 25);

  // ---------- zonas ----------
  b.zona('Recibidor', 'abierta', 2, 4, 10, 9);
  b.zona('Cocineta', 'abierta', 12, 4, 13, 9);
  b.zona('Baño de hombres', 'privada', 26, 4, 10, 4);
  b.zona('Baño de mujeres', 'privada', 26, 9, 10, 4);
  b.zona('Espacio de equipos', 'abierta', 12, 14, 15, 12);
  b.zona('Sala de reuniones 1', 'sala', 2, 14, 9, 5);
  b.zona('Sala de reuniones 2', 'sala', 2, 20, 9, 6);
  b.zona('Coworking', 'coworking', 28, 14, 8, 4);
  b.zona('Cabina telefónica 1', 'privada', 28, 22, 2, 4);
  b.zona('Cabina telefónica 2', 'privada', 31, 22, 2, 4);
  b.zona('Cabina telefónica 3', 'privada', 34, 22, 2, 4);
  b.zona('Terraza', 'abierta', 37, 20, 5, 8);

  return { version: 1, nombre: 'Oficina Live', salaInicial: 'piso-4', salas: [b.construir()] };
}
