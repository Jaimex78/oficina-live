import type { Orientacion } from './arte';

/**
 * Formato de la oficina que arma el editor y que dibuja el mundo. Es un archivo de datos:
 * el mundo se dibuja desde aquí, no desde código. Las coordenadas son casillas (0,0 arriba a la izquierda).
 */

export interface Colocacion {
  /** Único dentro del mapa. */
  id: string;
  objeto: string;
  x: number;
  y: number;
  orientacion: Orientacion;
  variante: string;
  /** Datos de la interacción: enlace, texto de una nota, imagen, sitio incrustado, enlace de reunión de Teams. */
  props?: {
    enlace?: string;
    texto?: string;
    imagen?: string;
    titulo?: string;
  };
}

/**
 * `sala`: sala de reuniones (al entrar, el resto del mundo se atenúa y arriba aparece la barra con «Unirse en Teams»).
 * `coworking`: zona de sofás o mesas donde al sentarte puedes iniciar una sesión de enfoque.
 */
export type TipoZona = 'abierta' | 'silenciosa' | 'privada' | 'sala' | 'coworking';

export interface Zona {
  id: string;
  nombre: string;
  tipo: TipoZona;
  rect: { x: number; y: number; w: number; h: number };
  /** Enlace de la reunión de Teams de la sala (https). */
  enlaceTeams?: string;
  color?: string;
  /** Descripción corta (hasta 120 letras): la píldora del lugar, arriba a la izquierda, la muestra como segunda línea tenue. */
  descripcion?: string;
}

export interface PuestoNombrado {
  id: string;
  /** Colocación (escritorio) a la que pertenece. */
  colocacion: string;
  /** Cuenta a la que se asigna. */
  usuarioId: number | null;
  etiqueta: string;
}

export interface PuntoLlegada {
  x: number;
  y: number;
}

export interface Portal {
  id: string;
  /** Casilla de entrada en esta sala. */
  x: number;
  y: number;
  destinoSala: string;
  destinoX: number;
  destinoY: number;
  etiqueta: string;
}

/**
 * Un área que el administrador le da a una o más personas: ahí pueden poner y quitar objetos (otro computador, una planta)
 * y en ningún otro sitio. El servidor lo exige; la interfaz solo lo refleja.
 */
export interface AreaPersonal {
  id: string;
  nombre: string;
  rect: { x: number; y: number; w: number; h: number };
  /** Ids de las cuentas que pueden editar esta área. */
  duenos: number[];
}

export interface SalaMapa {
  id: string;
  nombre: string;
  ancho: number;
  alto: number;
  /** Matriz alto x ancho con el id de objeto de piso de cada casilla. Cadena vacía = sin piso (vacío). */
  piso: string[][];
  colocaciones: Colocacion[];
  zonas: Zona[];
  puestos: PuestoNombrado[];
  llegadas: PuntoLlegada[];
  portales: Portal[];
  /** Áreas personales con dueños. Si falta, la sala no tiene ninguna. */
  areas?: AreaPersonal[];
}

export interface MapaOficina {
  version: 1;
  nombre: string;
  /** Sala por la que se entra. */
  salaInicial: string;
  salas: SalaMapa[];
}

export const LIMITES_MAPA = { ancho: 120, alto: 120, colocaciones: 4000, salas: 24 } as const;
