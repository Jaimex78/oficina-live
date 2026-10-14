import type { SalaMapa } from '@ol/shared';

/** Rectángulo en casillas con fin exclusivo. */
export interface Rect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/** Dónde está el edificio dentro de la sala (la sala trae además casillas vacías alrededor). */
export interface Geometria {
  ancho: number;
  alto: number;
  /** Cuerpo del edificio sin el balcón: de pared exterior a pared exterior. */
  ed: Rect;
  /** Balcón o terraza que sale del edificio (la esquina sureste del piso 4). */
  balcon: Rect | null;
}

/** Tipos de suelo en el mapa de zonas. También sirven para dibujar la vista esquemática. */
export const Z = { PASTO: 0, CALLE: 1, ANDEN: 2, TECHO: 3, FACHADA: 4, PLAZA: 5, CALLEJON: 6, EDIFICIO: 7, LOTE: 8, VIA: 9 } as const;

export type ModeloArbol = 'g' | 'm' | 'p' | 'jac';

/** Un árbol: su base en píxeles del mundo, el modelo de copa y la fase del viento. */
export interface Arbol {
  modelo: ModeloArbol;
  x: number;
  y: number;
  /** Con alcorque (los del andén). */
  alcorque: boolean;
  fase: number;
  espejo: boolean;
}

/** Un objeto fijo (poste, caneca, cono, equipo de azotea...). `x`, `y` son el punto de apoyo en píxeles del mundo. */
export interface Prop {
  frame: string;
  x: number;
  y: number;
  /** Cuadro de sombra y su desplazamiento. */
  sombra?: { frame: string; dx: number; dy: number };
  espejo?: boolean;
}

/** Un foco de luz que se enciende de noche. */
export interface Foco {
  x: number;
  y: number;
  /** Radio en píxeles. */
  radio: number;
  color: number;
  intensidad: number;
  /** `parpadeo` para las luces de obra. */
  parpadeo?: boolean;
}

/** Señal que obedece una línea de pare: `h` la Ak 9 en el cruce, `v` la calle 102 y `pc` el paso de peatones de la avenida. */
export type SenalPare = 'h' | 'v' | 'pc';

/** Línea de pare: el frente del carro no la pasa si la señal no está en verde. */
export interface LineaPare {
  /** Posición sobre el eje del carril, en píxeles del mundo. */
  pos: number;
  senal: SenalPare;
}

/** Cambio de carril al llegar a un punto: el carro de la calle 102 que gira hacia la avenida y al revés. */
export interface Empalme {
  destino: string;
  /** Posición sobre el eje de este carril donde el carro cambia al otro. */
  en: number;
  /** Probabilidad de que un carro tome el giro (1 si siempre). */
  probabilidad: number;
  /** Posición sobre el eje de este carril desde donde se revisa que el carril de destino esté libre. */
  desde: number;
}

/** Un carril: los carros avanzan por `fijo` (la coordenada que no cambia) en sentido `dir`. */
export interface Carril {
  id: string;
  eje: 'h' | 'v';
  /** `y` del carril si es horizontal, `x` si es vertical (píxeles del mundo). */
  fijo: number;
  /** +1 hacia el este o el sur, -1 hacia el oeste o el norte. */
  dir: 1 | -1;
  /** Dónde nacen y mueren los carros (píxeles sobre el eje del carril). */
  inicio: number;
  fin: number;
  pares: LineaPare[];
  /** Cuántos carros hay al principio en este carril. */
  cantidad: number;
  /** Donde para el bus (centro del bus). */
  parada?: number;
  empalme?: Empalme;
  /** Carril por el que reaparece un carro que sale por el extremo (por defecto, el mismo). */
  reaparece?: string;
  /** Tipos de vehículo que arrancan en este carril, uno por carro, en orden (el resto son carros). */
  especiales?: ('bus' | 'moto')[];
}

export interface Semaforo {
  x: number;
  y: number;
  eje: SenalPare;
}

/** Un peatón que va y viene entre dos puntos. */
export interface RutaPeaton {
  ax: number;
  ay: number;
  bx: number;
  by: number;
  /** Píxeles por segundo. */
  velocidad: number;
  variante: number;
  /** Desfase inicial entre 0 y 1 a lo largo del recorrido. */
  fase: number;
  /** Si cruza una calle: espera su turno de peatones. `v` la calle 102 y `ave` la avenida entera con la vía del tren. */
  cruce?: 'v' | 'ave';
}

/** Gente parada (esperando el bus). */
export interface PeatonQuieto {
  x: number;
  y: number;
  variante: number;
}

/** Plano del exterior: qué tile va en cada casilla de cada capa y qué objetos se ponen encima. Es puro: no usa Phaser. */
export interface Plano {
  geo: Geometria;
  /** Esquina superior izquierda y tamaño, en casillas. */
  x0: number;
  y0: number;
  ancho: number;
  alto: number;
  /** Id de tile por casilla (fila por fila), o `null`. */
  suelo: (string | null)[];
  detalle: (string | null)[];
  sombra: (string | null)[];
  /** Máscaras de luz de las ventanas encendidas de noche. */
  luz: (string | null)[];
  zona: Uint8Array;
  arboles: Arbol[];
  props: Prop[];
  focos: Foco[];
  carriles: Carril[];
  semaforos: Semaforo[];
  rutas: RutaPeaton[];
  quietos: PeatonQuieto[];
  /** Cruce de las dos calles, en píxeles. */
  cruce: { x0: number; y0: number; x1: number; y1: number };
  /** Paraderos de bus (centro, en píxeles). */
  paraderos: { x: number; y: number }[];
  /** La vía del tren: franja de rieles entre las dos calzadas y el paso peatonal que la cruza. */
  via: { y0: number; y1: number; xPaso: number; xMin: number; xMax: number };
}

export type { SalaMapa };
