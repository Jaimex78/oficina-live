import type { Orientacion, Problema, SalaMapa, TipoZona } from '@ol/shared';
import type { EstadoRed } from './red';

export type Herramienta = 'seleccionar' | 'objeto' | 'borrar' | 'piso' | 'zona' | 'llegada' | 'habitacion' | 'area' | 'mano';
export type ModoPiso = 'pincel' | 'rectangulo' | 'bote' | 'borrador';

/** Cómo se arma una habitación rápida: piso, paredes, puerta y zona. `tam` es una plantilla que se estampa de un clic. */
export interface AjusteHabitacion {
  piso: string;
  muro: 'pared-lisa' | 'vidrio';
  zona: TipoZona | 'ninguna';
  puerta: boolean;
  tam: { w: number; h: number } | null;
}

export interface Pincel {
  habitacion: AjusteHabitacion;
  objeto: string | null;
  orientacion: Orientacion;
  variante: string;
  piso: string | null;
  modoPiso: ModoPiso;
  zonaTipo: TipoZona;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Sombra del objeto que se va a colocar o mover: verde si cabe, roja si no. */
export interface Fantasma {
  id: string;
  /** Casilla de la esquina superior izquierda de la huella. */
  x: number;
  y: number;
  ancho: number;
  alto: number;
  valido: boolean;
  motivo?: string;
  objeto: string;
  orientacion: Orientacion;
  variante: string;
  /** Objetos apoyados: cuánto se corre el dibujo para quedar sobre la tapa del mueble (píxeles). */
  dx?: number;
  dy?: number;
}

export type ElementoSeleccion = { tipo: 'colocacion'; id: string } | { tipo: 'zona'; id: string } | { tipo: 'llegada'; x: number; y: number };

/** Casillas que una acción en curso va a tocar (pincel de piso, rectángulo, línea de pared, borrador). */
export interface VistaPrevia {
  celdas: ReadonlyArray<readonly [number, number]>;
  tono: 'bien' | 'mal' | 'borrar';
}

/** Cuándo se dibuja el esquema de lejos: solo al alejar bastante (auto), siempre (forzada, modo «Simplificado») o nunca (apagada). */
export type VistaEsquema = 'auto' | 'forzada' | 'apagada';

export type EstadoGuardado = 'limpio' | 'pendiente' | 'guardando' | 'guardado' | 'error' | 'conflicto';

export interface EstadoMundo {
  sala: SalaMapa | null;
  modo: 'mundo' | 'edicion';
  luz: 'claro' | 'oscuro';
  /** Zoom entero: la imagen se escala sin deformar los píxeles. */
  zoom: number;
  /** Vista esquemática: salas como rectángulos de colores y personas como círculos. */
  vistaEsquema: VistaEsquema;
  /** Lo escribe el motor: true cuando el esquema está a la vista (por el zoom o porque se forzó). */
  enEsquema: boolean;
  /** Lo escribe el motor: el zoom más lejano útil (el de la sala entera en pantalla). Los botones no deben bajar de aquí. */
  zoomMin: number;
  /** Lo escribe la red: estado de la conexión con el servidor de presencia y, si hay, por qué. */
  red: EstadoRed;
  redMotivo: string | null;
  /** Orden de centrar la cámara en un punto (en píxeles del mundo). El número cambia para repetir la orden. */
  centrar: { x: number; y: number; n: number } | null;

  herramienta: Herramienta;
  pincel: Pincel;
  fantasma: Fantasma | null;
  vistaPrevia: VistaPrevia | null;
  seleccion: ElementoSeleccion[];
  marquesina: Rect | null;
  zonaEnCurso: Rect | null;
  /** Mientras alguien edita solo su área: el rectángulo donde sí puede cambiar cosas. */
  areaPermitida: Rect | null;
  problemas: Problema[];
  /** Casilla que parpadea para mostrar un problema. */
  ping: { x: number; y: number; n: number } | null;
  rejilla: boolean;
  /** Zonas, llegadas y problemas dibujados encima (solo edición). */
  capas: boolean;
  guardado: EstadoGuardado;
  puedeDeshacer: boolean;
  puedeRehacer: boolean;
  /** Mensaje corto del editor (por qué no cabe algo, qué se hizo). */
  aviso: { texto: string; tipo: 'info' | 'error'; n: number } | null;
}

export const PINCEL_INICIAL: Pincel = {
  habitacion: { piso: 'piso-madera-clara', muro: 'pared-lisa', zona: 'abierta', puerta: true, tam: null },
  objeto: null,
  orientacion: 'S',
  variante: 'base',
  piso: null,
  modoPiso: 'pincel',
  zonaTipo: 'abierta',
};

export const ESTADO_INICIAL: EstadoMundo = {
  sala: null,
  modo: 'mundo',
  luz: 'claro',
  zoom: 1,
  vistaEsquema: 'auto',
  enEsquema: false,
  zoomMin: 0.15,
  red: 'conectando',
  redMotivo: null,
  centrar: null,
  herramienta: 'seleccionar',
  pincel: PINCEL_INICIAL,
  fantasma: null,
  vistaPrevia: null,
  seleccion: [],
  marquesina: null,
  zonaEnCurso: null,
  areaPermitida: null,
  problemas: [],
  ping: null,
  rejilla: true,
  capas: true,
  guardado: 'limpio',
  puedeDeshacer: false,
  puedeRehacer: false,
  aviso: null,
};
