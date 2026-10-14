import type { ObjetoCatalogo } from './arte';

/**
 * Pestañas del panel de objetos del editor (como el Studio de Gather). Son una vista del inventario: no cambian
 * `categoria` ni los ids. Si un objeto no encaja con la regla por categoría, se fija con el campo `grupo` en su definición.
 */
export const GRUPOS_OBJETO = [
  { id: 'tecnologia', nombre: 'Computadores y tecnología' },
  { id: 'decoracion', nombre: 'Decoración' },
  { id: 'comida', nombre: 'Comida y bebida' },
  { id: 'exterior', nombre: 'Exterior' },
  { id: 'pared', nombre: 'Pared' },
  { id: 'almacenaje', nombre: 'Almacenaje' },
  { id: 'mesas', nombre: 'Mesas y escritorios' },
  { id: 'asientos', nombre: 'Asientos' },
  { id: 'juegos', nombre: 'Juegos e interactivos' },
  { id: 'temporada', nombre: 'Temporada' },
  { id: 'banos', nombre: 'Baños' },
] as const;
export type GrupoId = (typeof GRUPOS_OBJETO)[number]['id'];

/** Muebles de guardar que viven en `decoracion` o `puestos`. */
const ALMACENAJE = /^(estanteria|estante|librero|comoda|aparador|baul|gabinete|taquillas|fichero|andamio|carrito-herramientas|mueble-planos|archivador|cajonera|locker|perchero|armario|repisa)/;

/** Pestaña del panel a la que pertenece un objeto. */
export function grupoDe(o: Pick<ObjetoCatalogo, 'id' | 'categoria' | 'coleccion' | 'montado' | 'pared'> & { grupo?: GrupoId }): GrupoId {
  if (o.grupo) return o.grupo;
  if (o.coleccion || o.categoria === 'temporada') return 'temporada';
  if (o.montado || o.pared || o.categoria === 'paredes') return 'pared';
  switch (o.categoria) {
    case 'tecnologia':
      return 'tecnologia';
    case 'cocina':
      return 'comida';
    case 'exterior':
      return 'exterior';
    case 'asientos':
      return 'asientos';
    case 'banos':
      return 'banos';
    case 'juegos':
    case 'colaboracion':
      return 'juegos';
    case 'mesas':
      return o.id === 'mesa-pingpong' || o.id === 'futbolin' ? 'juegos' : o.id === 'soporte-plantas' ? 'decoracion' : 'mesas';
    case 'puestos':
      return ALMACENAJE.test(o.id) ? 'almacenaje' : o.id === 'papelera' || o.id === 'panel-divisor' ? 'decoracion' : 'mesas';
    default:
      return ALMACENAJE.test(o.id) ? 'almacenaje' : 'decoracion';
  }
}
