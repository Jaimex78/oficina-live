import type { Direccion } from './arte';
import type { PedidoEnfoque, SesionEnfoquePublica } from './enfoque';
import type { AvatarSpec } from './personaje';

/**
 * Mensajes entre el navegador y el servidor de presencia (WebSocket en /ws).
 * La presencia vive en memoria: no se guarda por dónde camina nadie.
 */

/** Velocidad al caminar, en píxeles del mundo por segundo. */
export const VELOCIDAD_PX_S = 160;
/** El servidor acepta hasta esta fracción más de velocidad para absorber la irregularidad de la red. */
export const TOLERANCIA_VELOCIDAD = 1.7;
/** Cada cuántos milisegundos el servidor agrupa y difunde los movimientos. */
export const TICK_MOVIMIENTO_MS = 100;
/** Máximo de mensajes «mover» por segundo y por conexión. */
export const MOVER_MAX_POR_S = 30;
/** Largo máximo (en caracteres UTF-16) de una reacción: cubre emojis con tono de piel o secuencias unidas. */
export const REACCION_MAX_CARACTERES = 16;
/** Reacciones que ofrece la barra de la interfaz. El servidor acepta cualquier emoji, no solo estas. */
export const REACCIONES_RAPIDAS = ['👋', '❤️', '🎉', '🤣', '👏', '👍', '💯', '🔥'] as const;

export const ESTADOS_PRESENCIA = ['disponible', 'concentrado', 'reunion', 'ausente'] as const;
export type EstadoPresencia = (typeof ESTADOS_PRESENCIA)[number];

export const ETIQUETA_ESTADO: Record<EstadoPresencia, string> = {
  disponible: 'Disponible',
  concentrado: 'Concentrado',
  reunion: 'En reunión',
  ausente: 'Ausente',
};

/** «naos»: en la oficina física. «remoto»: trabajando desde afuera. */
export type Lugar = '' | 'naos' | 'remoto';
export const ETIQUETA_LUGAR: Record<Lugar, string> = { '': 'Sin indicar', naos: 'En el Naos', remoto: 'Remoto' };

export type Animacion = 'quieto' | 'caminar' | 'sentado';

export interface PersonaPresente {
  id: number;
  nombre: string;
  cargo: string;
  apodo: string;
  avatar: AvatarSpec | null;
  /** Versión de su foto de perfil (0 o ausente: sin foto). Es solo el ícono de la persona; en el mapa se ve su personaje. */
  foto?: number;
  sala: string;
  /** Posición en píxeles del mundo (los pies del personaje). */
  x: number;
  y: number;
  dir: Direccion;
  anim: Animacion;
  estado: EstadoPresencia;
  lugar: Lugar;
  /** Su sesión de enfoque en una zona de coworking, si la comparte con todos. */
  enfoque?: SesionEnfoquePublica;
}

export interface AjustesPresencia {
  /** En casillas. */
  distanciaCercania: number;
  chatActivo: boolean;
  chatMax: number;
  teamsActivo: boolean;
  ausenciaMin: number;
  invisiblesPermitido: boolean;
}

export type MensajeCliente =
  | { t: 'hola'; token: string }
  | { t: 'entrar'; sala?: string }
  | { t: 'mover'; x: number; y: number; dir: Direccion; anim: Animacion }
  | { t: 'estado'; estado?: EstadoPresencia; invisible?: boolean; lugar?: Lugar }
  | { t: 'chat'; texto: string }
  /** Una reacción con emoji (👋, 🎉...) que flota sobre tu personaje y la ven quienes están en tu sala. */
  | { t: 'reaccion'; emoji: string }
  /** Empezar (con el pedido) o terminar (null) tu sesión de enfoque. Es una sola por persona y se cierra sola al terminar el tiempo. */
  | { t: 'enfoque'; sesion: PedidoEnfoque | null }
  /** Bloquear o desbloquear la sala de reuniones donde estás (el candado de la píldora de arriba a la izquierda). */
  | { t: 'bloquear-sala'; zona: string; bloqueada: boolean }
  /** Saludar a distancia a otra persona (id). Llega solo si está en línea; máximo un saludo cada 10 s por persona. */
  | { t: 'saludo'; a: number }
  | { t: 'ping' };

/** Una sala de reuniones bloqueada: `por` es quien la bloqueó (solo esa persona puede desbloquearla). */
export interface SalaBloqueada {
  zona: string;
  por: number;
}

export type MotivoCierre = 'otra_sesion' | 'llena' | 'sin_permiso' | 'sesion_terminada' | 'cerrada' | 'sin_hola';

export type MensajeServidor =
  | { t: 'bienvenida'; yo: PersonaPresente; sala: string; personas: PersonaPresente[]; ajustes: AjustesPresencia; invisible: boolean; mapa: number; bloqueos: SalaBloqueada[] }
  | { t: 'entra'; persona: PersonaPresente }
  | { t: 'sale'; id: number }
  | { t: 'movimientos'; lista: { id: number; x: number; y: number; dir: Direccion; anim: Animacion }[] }
  | { t: 'estado'; id: number; estado: EstadoPresencia; lugar: Lugar }
  /** Alguien cambió su personaje o su apodo mientras está en la sala. */
  | { t: 'avatar'; id: number; avatar: AvatarSpec | null; apodo: string; foto?: number }
  | { t: 'corregir'; x: number; y: number }
  /** Se publicó una versión nueva de la oficina: hay que volver a pedir el mapa. */
  | { t: 'mapa'; numero: number }
  | { t: 'chat'; de: number; nombre: string; texto: string; ts: number }
  | { t: 'reaccion'; id: number; emoji: string }
  /** Cambió la sesión de enfoque de alguien (null: terminó). A los demás solo les llega si la comparte con todos; a ti siempre. */
  | { t: 'enfoque'; id: number; sesion: SesionEnfoquePublica | null }
  /** Se bloqueó o desbloqueó una sala de reuniones. Caminar adentro no se impide: solo cambia el candado y el botón de Teams. */
  | { t: 'sala-bloqueada'; zona: string; bloqueada: boolean; por: number }
  /** Alguien te saludó a distancia. `nombre` es su apodo o su nombre. */
  | { t: 'saludo'; de: number; nombre: string }
  /** Qué pasó con el saludo que enviaste: llegó, la persona no está en línea (ofrece un chat de Teams) o fue muy pronto. */
  | { t: 'saludo-resultado'; a: number; estado: 'entregado' | 'sin-conexion' | 'limite' }
  | { t: 'cerrada'; mensaje: string }
  | { t: 'cerrar'; motivo: MotivoCierre; mensaje: string }
  | { t: 'error'; mensaje: string }
  | { t: 'pong' };

/** Códigos de cierre del WebSocket (4000 en adelante son de la aplicación). */
export const CODIGO_CIERRE: Record<MotivoCierre, number> = {
  otra_sesion: 4001,
  llena: 4002,
  sin_permiso: 4003,
  sesion_terminada: 4004,
  cerrada: 4006,
  sin_hola: 4005,
};
