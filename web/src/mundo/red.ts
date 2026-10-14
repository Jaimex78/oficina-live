import {
  CODIGO_CIERRE,
  TICK_MOVIMIENTO_MS,
  type Animacion,
  type AjustesPresencia,
  type Direccion,
  type EstadoPresencia,
  type Lugar,
  type MensajeCliente,
  type MensajeServidor,
  type MotivoCierre,
  type PedidoEnfoque,
  type PersonaPresente,
  type SesionEnfoquePublica,
} from '@ol/shared';
import type { VivoMundo } from './vivo';

/**
 * Cliente de presencia: habla con el WebSocket del servidor (`/ws`) y alimenta a `VivoMundo`.
 * No sabe de Phaser ni de React: el motor lo lee a través de `VivoMundo` y la interfaz se entera por `alEstado`.
 */

export type EstadoRed = 'conectando' | 'conectado' | 'reconectando' | 'cerrado';

export interface InfoRed {
  estado: EstadoRed;
  /** Por qué se cerró o se está reconectando, en una frase para mostrar. */
  motivo?: string;
  /** Si está reconectando: en cuántos milisegundos vuelve a intentar. */
  reintentoEnMs?: number;
  /** Número del intento de reconexión (1, 2, 3...). */
  intento?: number;
}

/**
 * Lleva las horas de una sesión de enfoque del reloj del servidor al de este navegador (el servidor manda su hora al enviarla),
 * para que «quedan 42 min» no dependa de que los dos relojes coincidan.
 */
export function aRelojLocal(s: SesionEnfoquePublica, ahoraLocal: number): SesionEnfoquePublica {
  if (s.ahora === undefined) return s;
  const d = ahoraLocal - s.ahora;
  const { ahora: _servidor, ...resto } = s;
  return { ...resto, inicio: s.inicio + d, fin: s.fin + d };
}

const conRelojLocal = (p: PersonaPresente, ahora: number): PersonaPresente => (p.enfoque ? { ...p, enfoque: aRelojLocal(p.enfoque, ahora) } : p);

export interface MensajeChat {
  de: number;
  nombre: string;
  texto: string;
  ts: number;
}

/** Lo mínimo que se usa de un WebSocket: así las pruebas pueden poner uno falso. */
export interface SocketMinimo {
  readyState: number;
  send(datos: string): void;
  close(codigo?: number, razon?: string): void;
  onopen: ((e: unknown) => void) | null;
  onmessage: ((e: { data: unknown }) => void) | null;
  onclose: ((e: { code: number; reason: string }) => void) | null;
  onerror: ((e: unknown) => void) | null;
}

export interface Reloj {
  ahora(): number;
  programar(f: () => void, ms: number): unknown;
  cancelar(id: unknown): void;
}

const RELOJ_REAL: Reloj = {
  ahora: () => Date.now(),
  programar: (f, ms) => setTimeout(f, ms),
  cancelar: (id) => clearTimeout(id as ReturnType<typeof setTimeout>),
};

const ABIERTO = 1;

// ---------- lógica pura ----------

const ESPERA_BASE_MS = 1000;
const ESPERA_MAX_MS = 15_000;

/**
 * Cuánto esperar antes del intento número `intento` (1, 2, 3...): 1 s, 2 s, 4 s, 8 s y luego 15 s,
 * con un poco de azar (±20 %) para que, si el servidor se reinicia, todo el mundo no vuelva a la vez.
 */
export function esperaReconexion(intento: number, azar = 0.5, minimoMs = 0): number {
  const n = Math.max(1, Math.floor(intento));
  const base = Math.min(ESPERA_MAX_MS, ESPERA_BASE_MS * 2 ** (n - 1));
  return Math.round(Math.max(minimoMs, base * (0.8 + 0.4 * Math.min(1, Math.max(0, azar)))));
}

/** Qué hacer según el motivo con el que el servidor cerró la conexión. */
export interface PoliticaCierre {
  /** true: no se vuelve a intentar. */
  definitivo: boolean;
  /** Espera mínima antes de reintentar (la oficina llena pide más calma). */
  minimoMs: number;
  /** Frase por defecto si el servidor no mandó una. */
  mensaje: string;
}

export function politicaDeCierre(motivo: MotivoCierre | null): PoliticaCierre {
  switch (motivo) {
    case 'otra_sesion':
      return { definitivo: true, minimoMs: 0, mensaje: 'Abriste la oficina en otro lugar.' };
    case 'sin_permiso':
      return { definitivo: true, minimoMs: 0, mensaje: 'No tienes permiso para entrar a la oficina.' };
    case 'sesion_terminada':
      return { definitivo: true, minimoMs: 0, mensaje: 'Tu sesión terminó. Ingresa de nuevo.' };
    case 'cerrada':
      return { definitivo: true, minimoMs: 0, mensaje: 'La oficina está cerrada por ahora.' };
    case 'llena':
      return { definitivo: false, minimoMs: 10_000, mensaje: 'La oficina está llena por ahora. Intento de nuevo en unos segundos.' };
    default:
      return { definitivo: false, minimoMs: 0, mensaje: 'Se perdió la conexión.' };
  }
}

/** Convierte el código de cierre del WebSocket en el motivo de la aplicación (si lo es). */
export function motivoDeCodigo(codigo: number): MotivoCierre | null {
  for (const [motivo, c] of Object.entries(CODIGO_CIERRE)) if (c === codigo) return motivo as MotivoCierre;
  return null;
}

type Muestra = { x: number; y: number; dir: Direccion; anim: Animacion };

/**
 * Deja pasar como máximo un movimiento por intervalo (el servidor reparte cada `TICK_MOVIMIENTO_MS`): el primero sale
 * al instante y, si llegan más mientras se espera, sale solo el último justo al vencer el intervalo.
 */
export class LimitadorMovimiento {
  private ultimo = -Infinity;
  private pendiente: Muestra | null = null;
  private temporizador: unknown = null;

  constructor(
    private readonly enviar: (m: Muestra) => void,
    private readonly intervaloMs: number = TICK_MOVIMIENTO_MS,
    private readonly reloj: Reloj = RELOJ_REAL,
  ) {}

  empujar(m: Muestra): void {
    const ahora = this.reloj.ahora();
    const falta = this.ultimo + this.intervaloMs - ahora;
    if (falta <= 0) {
      this.salir(m, ahora);
      return;
    }
    this.pendiente = m;
    if (this.temporizador === null) {
      this.temporizador = this.reloj.programar(() => {
        this.temporizador = null;
        const p = this.pendiente;
        this.pendiente = null;
        if (p) this.salir(p, this.reloj.ahora());
      }, falta);
    }
  }

  private salir(m: Muestra, ahora: number): void {
    this.ultimo = ahora;
    this.pendiente = null;
    this.enviar(m);
  }

  /** Descarta lo pendiente (por ejemplo, al perder la conexión). */
  vaciar(): void {
    this.pendiente = null;
    if (this.temporizador !== null) {
      this.reloj.cancelar(this.temporizador);
      this.temporizador = null;
    }
  }
}

// ---------- el cliente ----------

export interface OpcionesCliente {
  vivo: VivoMundo;
  /** El token de la sesión. Si no hay, no se conecta. */
  token: () => string | null;
  url: string;
  alEstado: (i: InfoRed) => void;
  /** Se publicó otra versión del mapa (o la bienvenida trae una distinta de la que tienes). Número 0: sin versión. */
  alMapa?: (numero: number) => void;
  alChat?: (m: MensajeChat) => void;
  /** Alguien te saludó a distancia. */
  alSaludo?: (m: { de: number; nombre: string }) => void;
  /** Qué pasó con el saludo que enviaste. */
  alResultadoSaludo?: (m: { a: number; estado: 'entregado' | 'sin-conexion' | 'limite' }) => void;
  /** Mensaje de error del servidor (por ejemplo «Vas muy rápido»). */
  alError?: (mensaje: string) => void;
  /** Llegó la bienvenida (la primera o tras reconectar): el motor debe recentrar la cámara. */
  alBienvenida?: (sala: string, ajustes: AjustesPresencia) => void;
  /** El servidor dijo que la sesión terminó: la aplicación debe volver al ingreso. */
  alSesionTerminada?: () => void;
  crearSocket?: (url: string) => SocketMinimo;
  reloj?: Reloj;
  azar?: () => number;
}

const PING_CADA_MS = 20_000;
const SIN_NOTICIAS_MS = 70_000;

export class ClienteRed {
  private socket: SocketMinimo | null = null;
  private estadoActual: EstadoRed = 'conectando';
  private intento = 0;
  private parado = false;
  private cierreDefinitivo = false;
  private motivoServidor: { motivo: MotivoCierre | null; mensaje: string } | null = null;
  private tReintento: unknown = null;
  private tPing: unknown = null;
  private ultimaNoticia = 0;
  private readonly reloj: Reloj;
  private readonly limitador: LimitadorMovimiento;

  constructor(private readonly o: OpcionesCliente) {
    this.reloj = o.reloj ?? RELOJ_REAL;
    this.limitador = new LimitadorMovimiento((m) => this.enviar({ t: 'mover', ...m }), TICK_MOVIMIENTO_MS, this.reloj);
  }

  get estado(): EstadoRed {
    return this.estadoActual;
  }

  // ----- ciclo de vida -----

  iniciar(): void {
    this.parado = false;
    this.cierreDefinitivo = false;
    this.intento = 0;
    this.conectar();
  }

  /** Cierra y no vuelve a intentar (al salir de la oficina). */
  detener(): void {
    this.parado = true;
    this.limpiarTemporizadores();
    this.limitador.vaciar();
    const s = this.socket;
    this.socket = null;
    if (s) {
      s.onopen = s.onmessage = s.onclose = s.onerror = null;
      try {
        s.close(1000, 'salida');
      } catch {
        /* ya estaba cerrado */
      }
    }
  }

  /** Para el botón «Reintentar» cuando la conexión se cerró por una causa que se puede arreglar (por ejemplo, oficina llena). */
  reintentar(): void {
    if (this.estadoActual === 'conectado' || this.estadoActual === 'conectando') return;
    this.limpiarTemporizadores();
    this.parado = false;
    this.cierreDefinitivo = false;
    this.conectar();
  }

  private emitir(estado: EstadoRed, extra: Partial<InfoRed> = {}): void {
    this.estadoActual = estado;
    this.o.alEstado({ estado, ...extra });
  }

  private conectar(): void {
    const tk = this.o.token();
    if (!tk) {
      this.cierreDefinitivo = true;
      this.emitir('cerrado', { motivo: 'No hay una sesión iniciada.' });
      return;
    }
    this.motivoServidor = null;
    this.emitir(this.intento === 0 ? 'conectando' : 'reconectando', this.intento === 0 ? {} : { intento: this.intento });
    let s: SocketMinimo;
    try {
      s = (this.o.crearSocket ?? ((u) => new WebSocket(u) as unknown as SocketMinimo))(this.o.url);
    } catch {
      this.alPerder(null);
      return;
    }
    this.socket = s;
    s.onopen = () => {
      if (this.socket !== s) return;
      this.ultimaNoticia = this.reloj.ahora();
      // El servidor procesa en orden: «hola» identifica y «entrar» deja a la persona en la sala de entrada.
      this.enviar({ t: 'hola', token: tk });
      this.enviar({ t: 'entrar' });
      this.armarPing();
    };
    s.onmessage = (e) => {
      if (this.socket !== s) return;
      this.ultimaNoticia = this.reloj.ahora();
      this.alMensaje(e.data);
    };
    s.onerror = () => undefined; // el cierre llega justo después
    s.onclose = (e) => {
      if (this.socket !== s) return;
      this.socket = null;
      this.alPerder(e.code);
    };
  }

  private armarPing(): void {
    if (this.tPing !== null) this.reloj.cancelar(this.tPing);
    const latido = () => {
      this.tPing = null;
      const s = this.socket;
      if (!s || s.readyState !== ABIERTO) return;
      if (this.reloj.ahora() - this.ultimaNoticia > SIN_NOTICIAS_MS) {
        // Hace rato que no llega nada: la conexión murió sin avisar.
        try {
          s.close(4000, 'sin respuesta');
        } catch {
          /* nada */
        }
        return;
      }
      this.enviar({ t: 'ping' });
      this.tPing = this.reloj.programar(latido, PING_CADA_MS);
    };
    this.tPing = this.reloj.programar(latido, PING_CADA_MS);
  }

  private limpiarTemporizadores(): void {
    if (this.tReintento !== null) this.reloj.cancelar(this.tReintento);
    if (this.tPing !== null) this.reloj.cancelar(this.tPing);
    this.tReintento = this.tPing = null;
  }

  /** Se cayó la conexión: o se cierra para siempre o se programa otro intento con espera creciente. */
  private alPerder(codigo: number | null): void {
    this.limpiarTemporizadores();
    this.limitador.vaciar();
    if (this.parado) return;
    const motivo = this.motivoServidor?.motivo ?? (codigo !== null ? motivoDeCodigo(codigo) : null);
    const pol = politicaDeCierre(motivo);
    const mensaje = this.motivoServidor?.mensaje || pol.mensaje;
    // Quien queda sin conexión no debe ver a los demás congelados: el servidor los vuelve a mandar en la bienvenida.
    this.o.vivo.reiniciar([]);
    if (pol.definitivo) {
      this.cierreDefinitivo = true;
      this.emitir('cerrado', { motivo: mensaje });
      if (motivo === 'sesion_terminada') this.o.alSesionTerminada?.();
      return;
    }
    this.intento++;
    const espera = esperaReconexion(this.intento, (this.o.azar ?? Math.random)(), pol.minimoMs);
    this.emitir('reconectando', { motivo: mensaje, intento: this.intento, reintentoEnMs: espera });
    this.tReintento = this.reloj.programar(() => {
      this.tReintento = null;
      if (!this.parado) this.conectar();
    }, espera);
  }

  // ----- lo que llega -----

  private alMensaje(bruto: unknown): void {
    if (typeof bruto !== 'string') return;
    let m: MensajeServidor;
    try {
      m = JSON.parse(bruto) as MensajeServidor;
    } catch {
      return;
    }
    const v = this.o.vivo;
    switch (m.t) {
      case 'bienvenida':
        this.intento = 0;
        v.establecerYo(m.yo);
        v.reiniciar(m.personas.map((p) => conRelojLocal(p, this.reloj.ahora())));
        v.fijarBloqueos(m.bloqueos ?? []);
        this.o.alBienvenida?.(m.sala, m.ajustes);
        v.fijarAjustes(m.ajustes, m.invisible);
        this.emitir('conectado');
        this.o.alMapa?.(m.mapa);
        break;
      case 'entra':
        v.entra(conRelojLocal(m.persona, this.reloj.ahora()));
        break;
      case 'sale':
        v.sale(m.id);
        break;
      case 'movimientos':
        v.mover(m.lista);
        break;
      case 'estado':
        v.estado(m.id, m.estado, m.lugar);
        break;
      case 'avatar':
        v.perfil(m.id, m.avatar, m.apodo, m.foto);
        break;
      case 'corregir':
        v.corregirYo(m.x, m.y);
        break;
      case 'mapa':
        this.o.alMapa?.(m.numero);
        break;
      case 'chat':
        this.o.alChat?.({ de: m.de, nombre: m.nombre, texto: m.texto, ts: m.ts });
        break;
      case 'reaccion':
        v.reaccion(m.id, m.emoji);
        break;
      case 'saludo':
        this.o.alSaludo?.({ de: m.de, nombre: m.nombre });
        break;
      case 'saludo-resultado':
        this.o.alResultadoSaludo?.({ a: m.a, estado: m.estado });
        break;
      case 'enfoque':
        v.enfoque(m.id, m.sesion ? aRelojLocal(m.sesion, this.reloj.ahora()) : null);
        break;
      case 'sala-bloqueada':
        v.bloqueo(m.zona, m.bloqueada, m.por);
        break;
      case 'cerrada':
        this.motivoServidor = { motivo: 'cerrada', mensaje: m.mensaje };
        break;
      case 'cerrar':
        this.motivoServidor = { motivo: m.motivo, mensaje: m.mensaje };
        break;
      case 'error':
        this.o.alError?.(m.mensaje);
        break;
      case 'pong':
        break;
    }
  }

  // ----- lo que sale -----

  private enviar(m: MensajeCliente): void {
    const s = this.socket;
    if (s && s.readyState === ABIERTO) s.send(JSON.stringify(m));
  }

  /** Tu movimiento: el límite de frecuencia es de este cliente, el servidor además tiene el suyo. */
  mover(x: number, y: number, dir: Direccion, anim: Animacion): void {
    if (this.estadoActual !== 'conectado') return;
    this.limitador.empujar({ x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10, dir, anim });
  }

  /** Cambia tu estado, tu lugar o si te ves o no. Lo tuyo se actualiza al instante; los demás lo reciben del servidor. */
  cambiarEstado(c: { estado?: EstadoPresencia; invisible?: boolean; lugar?: Lugar }): void {
    const yo = this.o.vivo.yo;
    if (yo) this.o.vivo.estado(yo.id, c.estado ?? yo.estado, c.lugar ?? yo.lugar);
    if (c.invisible !== undefined) this.o.vivo.invisible = c.invisible;
    this.enviar({ t: 'estado', ...c });
  }

  chat(texto: string): void {
    this.enviar({ t: 'chat', texto });
  }

  reaccionar(emoji: string): void {
    this.enviar({ t: 'reaccion', emoji });
  }

  /** Saluda a distancia a otra persona (por su id). Llega solo si está en línea; el resultado vuelve en `alResultadoSaludo`. */
  saludar(a: number): void {
    this.enviar({ t: 'saludo', a });
  }

  /** Empieza (con el pedido) o termina (null) tu sesión de enfoque. Tu sesión aparece cuando el servidor la confirma. */
  enfocar(pedido: PedidoEnfoque | null): void {
    this.enviar({ t: 'enfoque', sesion: pedido });
  }

  /** Bloquea o desbloquea la sala de reuniones donde estás. El candado cambia cuando el servidor lo confirma. */
  bloquearSala(zona: string, bloqueada: boolean): void {
    this.enviar({ t: 'bloquear-sala', zona, bloqueada });
  }
}

/** La dirección del WebSocket de presencia, igual que la de la página (http → ws, https → wss). */
export function urlDePresencia(loc: Pick<Location, 'protocol' | 'host'> = window.location): string {
  return `${loc.protocol === 'https:' ? 'wss' : 'ws'}://${loc.host}/ws`;
}
