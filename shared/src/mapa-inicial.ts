import type { MapaOficina } from './mapa';
import { ConstructorSala } from './oficina';
import { plantillaNaos } from './plantillas/naos';
import { plantillaOficinaAbierta } from './plantillas/oficina-abierta';
import { plantillaSede } from './plantillas/sede';
import { cascaron } from './plantillas/edificio';

/**
 * Oficina de ejemplo con la que arranca la plataforma: una oficina de ejemplo en el piso 4 de Naos Empresarial, Bogotá.
 * Por dentro la planta es un área cuadrada (no la cuña de la fachada). El edificio tiene un balcón en la esquina,
 * que aquí es la terraza. Las plantillas viven en `plantillas/`: cada una arma la misma sala de 46x30 casillas con su cascarón
 * (`plantillas/edificio.ts`) y la administración la personaliza con el editor.
 */

export { plantillaNaos, plantillaOficinaAbierta, plantillaSede };

/**
 * Arranque de la versión final: solo el cascarón del edificio del piso 4. Suelo de oficina, muros exteriores, el balcón de la
 * esquina sureste con su puerta y dos casillas de llegada junto a ella. Sin muros interiores, muebles, zonas ni áreas.
 */
export function edificioVacio(): MapaOficina {
  const b = new ConstructorSala('piso-4', 'Piso 4', 46, 30);
  cascaron(b, () => 'piso-madera-clara');
  b.poner('puerta-simple', 36, 20, 'E');
  b.llegadas({ x: 35, y: 20 }, { x: 35, y: 21 });
  return { version: 1, nombre: 'Oficina Live', salaInicial: 'piso-4', salas: [b.construir()] };
}

/**
 * Plantillas del mapa. La vacía es la de arranque (el cascarón del edificio); las demás arman la misma sala de 46x30 casillas, así
 * que la calle de afuera encaja con todas. `tamano` y `descripcion` salen en la tarjeta del panel de Salas.
 */
export const PLANTILLAS_MAPA = [
  { id: 'vacia', nombre: 'Vacía', descripcion: 'Solo el edificio del piso 4: suelo, muros exteriores y el balcón.', tamano: '46×30 casillas' },
  { id: 'naos', nombre: 'Piso 4 Naos', descripcion: 'La planta de ejemplo del piso 4 de Naos Empresarial: oficinas de dirección, mini oficinas, cafetería, baños y zona de Play 5.', tamano: '46×30 casillas' },
  { id: 'abierta', nombre: 'Oficina abierta', descripcion: 'Equipos de seis en escritorios compartidos, coworking con sofás, cabinas telefónicas, dos salas con vidrio y cocineta.', tamano: '46×30 casillas' },
  { id: 'sede', nombre: 'Sede con salas de reunión', descripcion: 'Recibidor amplio, cuatro salas de reunión con vidrio (12, 6, 6 y 4 personas), sala creativa, biblioteca, cafetería y terraza.', tamano: '46×30 casillas' },
] as const;
export type IdPlantillaMapa = (typeof PLANTILLAS_MAPA)[number]['id'];

export function plantillaDeMapa(id: IdPlantillaMapa): MapaOficina {
  switch (id) {
    case 'naos':
      return plantillaNaos();
    case 'abierta':
      return plantillaOficinaAbierta();
    case 'sede':
      return plantillaSede();
    default:
      return edificioVacio();
  }
}
