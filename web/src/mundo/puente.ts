import type { AjustesPresencia, Animacion, Colocacion, Direccion, EstadoPresencia, Lugar, ObjetoCatalogo, PedidoEnfoque, Zona } from '@ol/shared';
import type { Almacen } from './almacen';
import type { FuenteAvatares } from './avatar';
import type { FuenteMascotas } from './mascotas';
import type { Arte } from './arte';
import type { EstadoRed, InfoRed, MensajeChat } from './red';
import type { EstadoMundo } from './tipos';
import type { VivoMundo } from './vivo';

/** Lo que el motor le avisa al controlador de edición: dónde está el puntero, en píxeles del mundo y en casillas. */
export interface EventoPuntero {
  tipo: 'abajo' | 'mover' | 'arriba';
  /** Casilla (puede quedar fuera de la sala: el controlador lo decide). */
  x: number;
  y: number;
  px: number;
  py: number;
  /** 0 izquierdo, 1 medio, 2 derecho. */
  boton: number;
  shift: boolean;
  ctrl: boolean;
  alt: boolean;
  /** Id de la colocación que se ve bajo el puntero (por el dibujo, no por la casilla), si la hay. */
  bajo?: string | null;
}

export interface Interaccion {
  colocacion: Colocacion;
  objeto: ObjetoCatalogo;
}

/** Órdenes que la interfaz le puede dar al motor. */
export interface OrdenesEscena {
  usarCercano(): void;
  irAMi(): void;
  levantarseAhora(): void;
  readonly estaSentado: boolean;
  /** Camina hasta un punto del mundo (píxeles). Como el doble clic. */
  irAPunto(x: number, y: number): void;
  /** Camina hasta quedar junto a una persona de la sala. */
  irAPersona(id: number): void;
  /** Camina hasta tu escritorio y se sienta. Si no tienes puesto, va al escritorio libre más cercano a tu llegada. */
  irAMiEscritorio(): void;
  /** Camina hasta una zona o un área de la sala (por su id). */
  irAArea(id: string): void;
  /** Elige una zona o un área por su id (se abre su tarjeta) y centra la cámara en ella, sin mover tu personaje. */
  seleccionarArea(id: string): void;
  /** Dónde está tu personaje en la pantalla del mundo (píxeles del lienzo) y el tamaño del lienzo. null: todavía no hay cámara. */
  miPuntoEnPantalla(): { x: number; y: number; ancho: number; alto: number } | null;
  /** Detiene el camino en curso (cualquier tecla de movimiento hace lo mismo). */
  cancelarRuta(): void;
  /** Muestra una reacción con emoji sobre tu personaje y la manda a los demás. */
  reaccionar(emoji: string): void;
  /** Centra la cámara en tu personaje. */
  centrarEnMi(): void;
  /** Quita la selección (el contorno y la etiqueta de la sala o la persona tocada). */
  deseleccionar(): void;
  /** «Enviar cerca»: mensaje de cercanía por la conexión de presencia. */
  enviarCerca(texto: string): void;
  /** Cambia tu estado o tu lugar por la conexión de presencia. Lo tuyo se refleja al instante. */
  cambiarEstado(c: { estado?: EstadoPresencia; lugar?: Lugar; invisible?: boolean }): void;
  /** Calidad del dibujo: en «eficiente» el motor baja a 30 cuadros por segundo. */
  fijarRendimiento(modo: ModoRendimiento): void;
}

export type ModoRendimiento = 'calidad' | 'equilibrado' | 'eficiente';

/** Lo que se ve al pasar el puntero o tocar una sala o un área. `clase` ya viene en texto para mostrar («Sala de reuniones»). */
export interface AreaTocada {
  id: string;
  nombre: string;
  clase: string;
  /** Clave de la clase, por si la interfaz quiere un icono o un color: reunion, descanso, escritorios, privada, abierta, silenciosa o escritorio. */
  claseId?: string;
}

export type Seleccion = { tipo: 'persona'; id: number } | { tipo: 'area'; id: string; nombre: string; clase: string; claseId?: string } | null;

/** El camino que está siguiendo tu personaje (doble clic, «Ir a mi escritorio», «ir hacia una persona»). */
export interface EventoRuta {
  activa: boolean;
  tipo: 'punto' | 'escritorio' | 'persona';
  etiqueta?: string;
}

/** Lo que la interfaz le puede pedir a la conexión con el servidor. */
export interface OrdenesRed {
  readonly estado: EstadoRed;
  /** Cambia tu estado, tu lugar o si te ves o no. Lo tuyo se refleja al instante. */
  cambiarEstado(c: { estado?: EstadoPresencia; invisible?: boolean; lugar?: Lugar }): void;
  /** Mensaje de cercanía («Enviar cerca»): lo oye quien esté dentro de tu radio. */
  chat(texto: string): void;
  /** Saluda a distancia a otra persona (id). El resultado llega por `Puente.alResultadoSaludo`. */
  saludar(a: number): void;
  /** Empieza (con el pedido) o termina (null) tu sesión de enfoque en una zona de coworking. */
  enfocar(pedido: PedidoEnfoque | null): void;
  /** Bloquea o desbloquea la sala de reuniones donde estás. */
  bloquearSala(zona: string, bloqueada: boolean): void;
  /** Vuelve a intentar cuando la conexión se cerró por una causa que se puede arreglar (por ejemplo, oficina llena). */
  reintentar(): void;
}

/** El puente entre React y el motor: datos que entran, avisos que salen. */
export interface Puente {
  arte: Arte;
  almacen: Almacen<EstadoMundo>;
  avatares: FuenteAvatares;
  /** Hojas de las mascotas (`null` si el atlas no está publicado). */
  mascotas?: FuenteMascotas | null;
  vivo: VivoMundo;
  /** Lo llena el motor al arrancar. */
  ordenes?: OrdenesEscena;
  /** Lo que pasa con el puntero en modo edición. */
  puntero?: (e: EventoPuntero) => void;
  /** Conexión con el servidor de presencia (la crea `useRed`). */
  red?: OrdenesRed;
  /** Ajustes de presencia que llegaron con la bienvenida (distancia de cercanía, chat...). */
  ajustes?: AjustesPresencia;
  /** Tu personaje se movió (el motor lo manda a la red cada pocos milisegundos). */
  alMover?: (x: number, y: number, dir: Direccion, anim: Animacion) => void;
  /** Tú reaccionaste con un emoji (el motor ya lo dibujó; la red lo manda a los demás). */
  alReaccion?: (emoji: string) => void;
  /** La conexión cambió: conectando, conectado, reconectando o cerrado (con el motivo). También queda en `almacen.red`. */
  alRed?: (e: InfoRed) => void;
  /** Llegó un mensaje de cercanía. */
  alChat?: (m: MensajeChat) => void;
  /** Alguien te saludó a distancia. */
  alSaludo?: (m: { de: number; nombre: string }) => void;
  /** Qué pasó con el saludo que enviaste: llegó, esa persona no está en línea o fue muy pronto. */
  alResultadoSaludo?: (m: { a: number; estado: 'entregado' | 'sin-conexion' | 'limite' }) => void;
  /** El servidor mandó un aviso de error (por ejemplo «Vas muy rápido»). */
  alErrorRed?: (mensaje: string) => void;
  /** Llegaron los ajustes de presencia (distancia de cercanía, chat, etc.). También quedan en `vivo.ajustes`. */
  alAjustes?: (a: AjustesPresencia) => void;
  /** Tu personaje empezó o terminó de seguir un camino. */
  alRuta?: (r: EventoRuta) => void;
  /** El puntero pasa por una sala o un área (null: ya no). `px` y `py` son píxeles de pantalla dentro del lienzo. */
  alAreaHover?: (a: AreaTocada | null, px: number, py: number) => void;
  /** Tocaste una persona, una sala o un área (null: tocaste el vacío). */
  alSeleccion?: (s: Seleccion) => void;
  /** Tocaste o llegaste a un objeto con el que se puede hacer algo. */
  alInteractuar?: (i: Interaccion) => void;
  /** Cambiaste de zona (o saliste de todas). */
  alCambiarZona?: (z: Zona | null) => void;
  /** Hay un objeto interactivo a tu alcance (o ya no). */
  alCerca?: (i: Interaccion | null) => void;
  /** Estás en un puesto con nombre (o ya no): se muestra «Escritorio de ...» arriba al centro. */
  alPuesto?: (etiqueta: string | null) => void;
  /** Te sentaste o te levantaste. */
  alSentarse?: (sentado: boolean) => void;
}
