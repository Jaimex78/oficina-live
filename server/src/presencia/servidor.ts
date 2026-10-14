import type { IncomingMessage } from 'node:http';
import type { Duplex } from 'node:stream';
import type { Usuario } from '@prisma/client';
import { WebSocket, WebSocketServer, type RawData } from 'ws';
import { z } from 'zod';
import {
  CASILLA,
  CODIGO_CIERRE,
  ESTADOS_PRESENCIA,
  MOVER_MAX_POR_S,
  REACCION_MAX_CARACTERES,
  TICK_MOVIMIENTO_MS,
  TOLERANCIA_VELOCIDAD,
  VELOCIDAD_PX_S,
  DURACIONES_ENFOQUE,
  MODOS_ENFOQUE,
  VISIBILIDADES_ENFOQUE,
  esRol,
  tienePermiso,
  validarPedidoEnfoque,
  type AjustesPresencia,
  type Animacion,
  type AvatarSpec,
  type Direccion,
  type EstadoPresencia,
  type Lugar,
  type MensajeCliente,
  type MensajeServidor,
  type MotivoCierre,
  type PersonaPresente,
  type SesionEnfoque,
  type SesionEnfoquePublica,
} from '@ol/shared';
import { leerAcceso } from '../auth/servicio';
import type { Contexto } from '../contexto';
import { versionFoto } from '../fotos/servicio';
import { personajeVisible } from '../personaje/catalogo';
import { oficinaAbierta, textoHorario, type Horario } from './horario';

export interface DatosSala {
  id: string;
  /** En casillas. */
  ancho: number;
  alto: number;
  llegadas: { x: number; y: number }[];
  /** 1 = casilla que no se puede pisar, con el índice `y * ancho + x`. Si falta, no se revisan colisiones. */
  bloqueo?: Uint8Array;
  /** Casillas de asiento (mismo índice). No bloquean el paso; un asiento ocupado por alguien sentado no se puede cruzar ni compartir. */
  asientos?: ReadonlySet<number>;
  /** Zonas de la sala (en casillas). Solo las de tipo `sala` se pueden bloquear. Si falta, no hay nada que bloquear. */
  zonas?: { id: string; tipo: string; nombre?: string; rect: { x: number; y: number; w: number; h: number } }[];
}

/** De dónde sale la geometría de las salas: del mapa publicado (`ServicioOficina.proveedorSalas`). */
export interface ProveedorSalas {
  sala(id: string): DatosSala | undefined;
  inicial(): string;
  /** Número de la versión publicada. Un proveedor que no viene de un mapa publicado no lo tiene: vale 0. */
  numero?(): number;
}

export const SALAS_POR_DEFECTO: ProveedorSalas = {
  sala: (id) =>
    id === 'principal'
      ? {
          id,
          ancho: 60,
          alto: 40,
          llegadas: [
            { x: 5, y: 5 },
            { x: 6, y: 5 },
            { x: 7, y: 5 },
            { x: 5, y: 6 },
            { x: 6, y: 6 },
            { x: 7, y: 6 },
          ],
        }
      : undefined,
  inicial: () => 'principal',
};

export interface OpcionesPresencia {
  salas?: ProveedorSalas;
  tickMs?: number;
  revisarAusenciaMs?: number;
  plazoHolaMs?: number;
  /** Para pruebas. */
  ahora?: () => Date;
  /** Hosts permitidos en la cabecera Origin. Vacío: solo el mismo sitio. */
  origenesPermitidos?: string[];
}

/** Solo emojis (con sus modificadores de tono y uniones): una reacción nunca debe ser texto libre. */
const SOLO_EMOJI = /^[\p{Extended_Pictographic}\u200d\ufe0f\u{1F3FB}-\u{1F3FF}]+$/u;

const direccion = z.enum(['N', 'E', 'S', 'O']);
const animacion = z.enum(['quieto', 'caminar', 'sentado']);
const esquemaMensaje = z.discriminatedUnion('t', [
  z.object({ t: z.literal('hola'), token: z.string().min(10).max(2000) }),
  z.object({ t: z.literal('entrar'), sala: z.string().max(40).optional() }),
  z.object({ t: z.literal('mover'), x: z.number().finite(), y: z.number().finite(), dir: direccion, anim: animacion }),
  z.object({ t: z.literal('estado'), estado: z.enum(ESTADOS_PRESENCIA).optional(), invisible: z.boolean().optional(), lugar: z.enum(['', 'naos', 'remoto']).optional() }),
  z.object({ t: z.literal('chat'), texto: z.string().min(1).max(4000) }),
  z.object({ t: z.literal('reaccion'), emoji: z.string().min(1).max(REACCION_MAX_CARACTERES).regex(SOLO_EMOJI) }),
  z.object({
    t: z.literal('enfoque'),
    sesion: z
      .object({
        modo: z.enum(MODOS_ENFOQUE),
        tema: z.string().max(400),
        minutos: z.number().refine((n) => (DURACIONES_ENFOQUE as readonly number[]).includes(n)),
        spotify: z.string().max(400).optional(),
        visibilidad: z.enum(VISIBILIDADES_ENFOQUE),
      })
      .nullable(),
  }),
  z.object({ t: z.literal('bloquear-sala'), zona: z.string().min(1).max(60), bloqueada: z.boolean() }),
  z.object({ t: z.literal('saludo'), a: z.number().int().positive() }),
  z.object({ t: z.literal('ping') }),
]);

interface Conexion {
  ws: WebSocket;
  usuario: Usuario | null;
  avatar: AvatarSpec | null;
  sala: string | null;
  x: number;
  y: number;
  dir: Direccion;
  anim: Animacion;
  estadoManual: EstadoPresencia;
  estado: EstadoPresencia;
  invisible: boolean;
  lugar: Lugar;
  /** Distancia en píxeles que todavía puede recorrer sin levantar sospechas (cubeta de fichas). */
  credito: number;
  tCredito: number;
  tActividad: number;
  sucio: boolean;
  ventanaMover: number[];
  ventanaChat: number[];
  ventanaReaccion: number[];
  ventanaEnfoque: number[];
  ventanaBloqueo: number[];
  /** Cuándo saludó por última vez a cada persona (id de destino -> marca de tiempo). */
  saludos: Map<number, number>;
  /** Su sesión de enfoque en una zona de coworking (una sola; se cierra sola al terminar el tiempo o al levantarse). */
  enfoque: SesionEnfoque | null;
  /** Su estado manual de antes de la sesión, para devolvérselo al terminar (null si no lo cambió la sesión o si ya lo cambió a mano). */
  estadoAntesEnfoque: EstadoPresencia | null;
  temporizadorHola: NodeJS.Timeout | null;
  /** Los mensajes de una misma conexión se procesan en orden. */
  cola: Promise<void>;
  llegada: number;
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/** Índice (`y * ancho + x`) de la casilla que contiene un punto en píxeles. Un punto en el borde de la sala cuenta en la última casilla. */
function indiceCasilla(datos: Pick<DatosSala, 'ancho' | 'alto'>, x: number, y: number): number {
  const cx = clamp(Math.floor(x / CASILLA), 0, datos.ancho - 1);
  const cy = clamp(Math.floor(y / CASILLA), 0, datos.alto - 1);
  return cy * datos.ancho + cx;
}

function primeraCasillaLibre(datos: DatosSala): { x: number; y: number } | undefined {
  const bloqueo = datos.bloqueo;
  if (!bloqueo) return undefined;
  for (let k = 0; k < bloqueo.length; k++) {
    if (!bloqueo[k]) return { x: k % datos.ancho, y: Math.floor(k / datos.ancho) };
  }
  return undefined;
}

/** Punto de llegada más cercano a una posición en píxeles. Si la sala no tiene llegadas, la primera casilla libre. */
function llegadaCercana(datos: DatosSala, x: number, y: number): { x: number; y: number } {
  let mejor: { x: number; y: number } | undefined;
  let mejorDistancia = Infinity;
  for (const p of datos.llegadas) {
    const d = Math.hypot((p.x + 0.5) * CASILLA - x, (p.y + 0.5) * CASILLA - y);
    if (d < mejorDistancia) {
      mejorDistancia = d;
      mejor = p;
    }
  }
  return mejor ?? primeraCasillaLibre(datos) ?? { x: 1, y: 1 };
}

/** Presencia en tiempo real: quién está en cada sala, dónde, con qué estado. Todo en memoria, nada de historial. */
export class ServidorPresencia {
  private readonly wss = new WebSocketServer({ noServer: true, maxPayload: 8 * 1024 });
  private readonly conexiones = new Map<number, Conexion>();
  private readonly sinIdentificar = new Set<Conexion>();
  private readonly tick: NodeJS.Timeout;
  private readonly revisor: NodeJS.Timeout;
  private readonly salas: ProveedorSalas;
  private readonly plazoHolaMs: number;
  private readonly ahora: () => Date;
  private llegadas = 0;
  /** Salas de reuniones bloqueadas, por «sala|zona». Viven en memoria, como la presencia. */
  private readonly bloqueos = new Map<string, { sala: string; zona: string; por: number }>();

  constructor(
    private readonly ctx: Contexto,
    private readonly opciones: OpcionesPresencia = {},
  ) {
    this.salas = opciones.salas ?? SALAS_POR_DEFECTO;
    this.plazoHolaMs = opciones.plazoHolaMs ?? 5000;
    this.ahora = opciones.ahora ?? (() => new Date());
    this.tick = setInterval(() => this.difundirMovimientos(), opciones.tickMs ?? TICK_MOVIMIENTO_MS);
    this.revisor = setInterval(() => {
      this.revisarAusencias();
      this.revisarEnfoques();
    }, opciones.revisarAusenciaMs ?? 15_000);
    this.tick.unref();
    this.revisor.unref();
  }

  // ---------- entrada ----------

  /** Devuelve true si la petición era para el WebSocket (la haya aceptado o rechazado). */
  manejarUpgrade(req: IncomingMessage, socket: Duplex, head: Buffer): boolean {
    const url = new URL(req.url ?? '/', 'http://local');
    if (url.pathname !== '/ws') return false;
    if (!this.origenValido(req)) {
      socket.write('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');
      socket.destroy();
      return true;
    }
    this.wss.handleUpgrade(req, socket, head, (ws) => this.nuevaConexion(ws));
    return true;
  }

  /** Defensa en profundidad: aunque el token ya protege, un sitio ajeno no debería poder abrir el socket. */
  private origenValido(req: IncomingMessage): boolean {
    const origen = req.headers.origin;
    if (!origen) return true; // clientes que no son un navegador (el token los sigue protegiendo)
    let hostOrigen: string;
    try {
      hostOrigen = new URL(origen).host;
    } catch {
      return false;
    }
    const permitidos = this.opciones.origenesPermitidos ?? [];
    // Acepta el host solo («localhost:5390») o el origen completo («http://localhost:5390»): los scripts de demostración usan el segundo.
    if (permitidos.length > 0) return permitidos.includes(hostOrigen) || permitidos.includes(origen);
    const reenviado = this.ctx.config.confiarProxy ? req.headers['x-forwarded-host'] : undefined;
    const host = (typeof reenviado === 'string' ? reenviado : req.headers.host) ?? '';
    return hostOrigen === host;
  }

  private nuevaConexion(ws: WebSocket): void {
    const t = Date.now();
    const c: Conexion = {
      ws,
      usuario: null,
      avatar: null,
      sala: null,
      x: 0,
      y: 0,
      dir: 'S',
      anim: 'quieto',
      estadoManual: 'disponible',
      estado: 'disponible',
      invisible: false,
      lugar: '',
      credito: CASILLA * 1.5,
      tCredito: t,
      tActividad: t,
      sucio: false,
      ventanaMover: [],
      ventanaChat: [],
      ventanaReaccion: [],
      ventanaEnfoque: [],
      ventanaBloqueo: [],
      saludos: new Map(),
      enfoque: null,
      estadoAntesEnfoque: null,
      temporizadorHola: null,
      cola: Promise.resolve(),
      llegada: 0,
    };
    this.sinIdentificar.add(c);
    c.temporizadorHola = setTimeout(() => this.cerrar(c, 'sin_hola', 'No se identificó a tiempo.'), this.plazoHolaMs);
    ws.on('message', (datos: RawData) => {
      c.cola = c.cola.then(() => this.alMensaje(c, datos)).catch((e) => console.error('[presencia] error al procesar un mensaje', e));
    });
    ws.on('close', () => this.alCerrar(c));
    ws.on('error', () => undefined);
  }

  private async alMensaje(c: Conexion, datos: RawData): Promise<void> {
    let m: MensajeCliente;
    try {
      const bruto: unknown = JSON.parse(datos.toString());
      const r = esquemaMensaje.safeParse(bruto);
      if (!r.success) return;
      m = r.data as MensajeCliente;
    } catch {
      return;
    }
    if (m.t === 'ping') {
      this.enviar(c, { t: 'pong' });
      return;
    }
    if (m.t === 'hola') {
      if (!c.usuario) await this.identificar(c, m.token);
      return;
    }
    if (!c.usuario) return; // todo lo demás exige haberse identificado
    switch (m.t) {
      case 'entrar':
        await this.entrar(c, m.sala);
        break;
      case 'mover':
        this.mover(c, m);
        break;
      case 'estado':
        await this.cambiarEstado(c, m);
        break;
      case 'chat':
        this.chatear(c, m.texto);
        break;
      case 'reaccion':
        this.reaccionar(c, m.emoji);
        break;
      case 'enfoque':
        if (m.sesion) this.iniciarEnfoque(c, m.sesion);
        else this.terminarEnfoque(c);
        break;
      case 'bloquear-sala':
        this.bloquearSala(c, m.zona, m.bloqueada);
        break;
      case 'saludo':
        this.saludar(c, m.a);
        break;
    }
  }

  // ---------- identificación y entrada a la sala ----------

  private horario(): Horario {
    const a = this.ctx.ajustes;
    return {
      activo: a.obtener<boolean>('horario_activo'),
      dias: a.obtener<string>('horario_dias'),
      desde: a.obtener<string>('horario_desde'),
      hasta: a.obtener<string>('horario_hasta'),
      zona: a.obtener<string>('zona_horaria'),
    };
  }

  private async identificar(c: Conexion, token: string): Promise<void> {
    const datos = await this.ctx.tokens.verificar(token);
    const u = datos ? await this.ctx.prisma.usuario.findUnique({ where: { id: datos.id } }) : null;
    if (!datos || !u || !u.activo || u.versionToken !== datos.tv || u.debeCambiarClave) {
      this.cerrar(c, 'sesion_terminada', 'Tu sesión terminó. Ingresa de nuevo.');
      return;
    }
    if (!esRol(u.rol) || !tienePermiso(u.rol, 'caminar')) {
      this.cerrar(c, 'sin_permiso', 'No tienes permiso para entrar a la oficina.');
      return;
    }
    const construye = tienePermiso(u.rol, 'construir');
    const h = this.horario();
    if (!construye && !oficinaAbierta(h, this.ahora())) {
      const mensaje = `La oficina está cerrada. Abre ${textoHorario(h)}.`;
      this.enviar(c, { t: 'cerrada', mensaje });
      this.cerrar(c, 'cerrada', mensaje);
      return;
    }
    const yaEsta = this.conexiones.get(u.id);
    if (!construye && !yaEsta && this.conexiones.size >= this.ctx.ajustes.obtener<number>('maximo_personas')) {
      this.cerrar(c, 'llena', 'La oficina está llena por ahora. Intenta en unos minutos.');
      return;
    }
    if (yaEsta) this.cerrar(yaEsta, 'otra_sesion', 'Abriste la oficina en otro lugar.');

    if (c.temporizadorHola) clearTimeout(c.temporizadorHola);
    this.sinIdentificar.delete(c);
    c.usuario = u;
    c.avatar = personajeVisible(leerAvatar(u.personaje), leerAcceso(u.acceso));
    c.estadoManual = (ESTADOS_PRESENCIA as readonly string[]).includes(u.estado) && u.estado !== 'ausente' ? (u.estado as EstadoPresencia) : 'disponible';
    c.estado = c.estadoManual;
    c.invisible = u.invisible && this.ctx.ajustes.obtener<boolean>('invisibles_permitido');
    c.lugar = u.etiquetaLugar === 'naos' || u.etiquetaLugar === 'remoto' ? u.etiquetaLugar : '';
    this.conexiones.set(u.id, c);
  }

  private async entrar(c: Conexion, idSala: string | undefined): Promise<void> {
    const u = c.usuario;
    if (!u || c.sala) return;
    const id = idSala ?? this.salas.inicial();
    const datos = this.salas.sala(id);
    if (!datos) {
      this.enviar(c, { t: 'error', mensaje: 'Esa sala no existe.' });
      return;
    }
    const punto = datos.llegadas[this.llegadas++ % Math.max(1, datos.llegadas.length)] ?? { x: 1, y: 1 };
    c.sala = id;
    c.x = (punto.x + 0.5) * CASILLA;
    c.y = (punto.y + 0.5) * CASILLA;
    c.dir = 'S';
    c.anim = 'quieto';
    this.reiniciarCredito(c);
    c.tActividad = Date.now();
    this.anunciarEntrada(c, id, this.numeroMapa());
  }

  /** Le da la bienvenida a quien acaba de quedar en una sala y avisa a quienes ya estaban. */
  private anunciarEntrada(c: Conexion, idSala: string, numeroMapa: number): void {
    const u = c.usuario as Usuario;
    this.enviar(c, {
      t: 'bienvenida',
      yo: this.aPersona(c),
      sala: idSala,
      personas: this.visiblesEnSala(idSala, u.id).map((o) => this.aPersona(o)),
      ajustes: this.ajustesPresencia(),
      invisible: c.invisible,
      mapa: numeroMapa,
      bloqueos: [...this.bloqueos.values()].filter((b) => b.sala === idSala).map((b) => ({ zona: b.zona, por: b.por })),
    });
    if (!c.invisible) this.difundir(idSala, u.id, { t: 'entra', persona: this.aPersona(c) });
  }

  /** Número de la versión publicada del mapa (0 si el proveedor de salas no es de un mapa publicado). */
  private numeroMapa(): number {
    return this.salas.numero?.() ?? 0;
  }

  /** Tras una posición puesta por el servidor, la cubeta de fichas de velocidad vuelve a empezar. */
  private reiniciarCredito(c: Conexion): void {
    c.credito = CASILLA * 1.5;
    c.tCredito = Date.now();
  }

  // ---------- movimiento, estado y chat ----------

  private mover(c: Conexion, m: Extract<MensajeCliente, { t: 'mover' }>): void {
    if (!c.sala) return;
    const ahora = Date.now();
    c.ventanaMover = c.ventanaMover.filter((t) => ahora - t < 1000);
    if (c.ventanaMover.length >= MOVER_MAX_POR_S) return;
    c.ventanaMover.push(ahora);

    const datos = this.salas.sala(c.sala);
    if (!datos) return;
    const x = clamp(m.x, 0, datos.ancho * CASILLA);
    const y = clamp(m.y, 0, datos.alto * CASILLA);

    // Cubeta de fichas: a la larga nadie recorre más que velocidad * tolerancia, aunque mande muchos mensajes.
    c.credito = Math.min(CASILLA * 1.5, c.credito + (VELOCIDAD_PX_S * TOLERANCIA_VELOCIDAD * (ahora - c.tCredito)) / 1000);
    c.tCredito = ahora;
    const distancia = Math.hypot(x - c.x, y - c.y);
    if (distancia > c.credito) {
      this.enviar(c, { t: 'corregir', x: c.x, y: c.y });
      return;
    }
    // Defensa en profundidad: el navegador ya frena en paredes y muebles, pero el servidor no se fía de él.
    // Un movimiento rechazado no gasta fichas de velocidad.
    // Un asiento ocupado por otra persona no se cruza ni se comparte (quien ya está dentro de esa casilla puede moverse en ella).
    if (this.bloqueaPaso(datos, x, y, m.anim) || this.asientoTomado(datos, c, indiceCasilla(datos, x, y))) {
      this.enviar(c, { t: 'corregir', x: c.x, y: c.y });
      return;
    }
    c.credito -= distancia;
    c.x = x;
    c.y = y;
    c.dir = m.dir;
    c.anim = m.anim;
    // Levantarse cierra la sesión de enfoque: el servidor no se fía de que el navegador lo avise.
    if (c.enfoque && m.anim !== 'sentado') this.terminarEnfoque(c);
    if (this.bloqueos.size > 0) this.revisarBloqueos(c.sala);
    c.sucio = !c.invisible;
    this.actividad(c);
  }

  private async cambiarEstado(c: Conexion, m: Extract<MensajeCliente, { t: 'estado' }>): Promise<void> {
    const u = c.usuario;
    if (!u) return;
    if (m.invisible === true && !this.ctx.ajustes.obtener<boolean>('invisibles_permitido')) {
      this.enviar(c, { t: 'error', mensaje: 'La administración no permite verse invisible.' });
      return;
    }
    let cambioVisibilidad = false;
    if (m.estado) {
      c.estadoManual = m.estado;
      c.estado = m.estado;
      c.estadoAntesEnfoque = null; // lo cambió a mano: al terminar la sesión no se le devuelve el de antes
    }
    if (m.lugar !== undefined) c.lugar = m.lugar;
    if (m.invisible !== undefined && m.invisible !== c.invisible) {
      c.invisible = m.invisible;
      cambioVisibilidad = true;
    }
    c.tActividad = Date.now();

    // Las preferencias se recuerdan para la próxima vez; la posición, no.
    void this.ctx.prisma.usuario
      .update({ where: { id: u.id }, data: { estado: c.estadoManual, invisible: c.invisible, etiquetaLugar: c.lugar } })
      .catch((e) => console.error('[presencia] no se pudieron guardar las preferencias', e));

    if (!c.sala) return;
    if (cambioVisibilidad) {
      if (c.invisible) this.difundir(c.sala, u.id, { t: 'sale', id: u.id });
      else this.difundir(c.sala, u.id, { t: 'entra', persona: this.aPersona(c) });
    } else if (!c.invisible) {
      this.difundir(c.sala, u.id, { t: 'estado', id: u.id, estado: c.estado, lugar: c.lugar });
    }
  }

  private chatear(c: Conexion, bruto: string): void {
    const u = c.usuario;
    if (!u || !c.sala) return;
    const a = this.ctx.ajustes;
    if (!a.obtener<boolean>('chat_activo')) {
      this.enviar(c, { t: 'error', mensaje: 'El chat de cercanía está desactivado.' });
      return;
    }
    if (c.invisible) {
      this.enviar(c, { t: 'error', mensaje: 'Para chatear, vuelve a verte en la oficina.' });
      return;
    }
    const texto = bruto.trim();
    if (!texto) return;
    const maximo = a.obtener<number>('chat_max_caracteres');
    if (texto.length > maximo) {
      this.enviar(c, { t: 'error', mensaje: `El mensaje admite hasta ${maximo} caracteres.` });
      return;
    }
    const ahora = Date.now();
    c.ventanaChat = c.ventanaChat.filter((t) => ahora - t < 10_000);
    if (c.ventanaChat.length >= 5) {
      this.enviar(c, { t: 'error', mensaje: 'Vas muy rápido. Espera unos segundos.' });
      return;
    }
    c.ventanaChat.push(ahora);

    // Solo lo oye quien está cerca. No se guarda en ningún lado.
    const alcance = a.obtener<number>('distancia_cercania') * CASILLA;
    const mensaje: MensajeServidor = { t: 'chat', de: u.id, nombre: u.apodo || u.nombre, texto, ts: ahora };
    for (const otro of this.enSala(c.sala)) {
      if (Math.hypot(otro.x - c.x, otro.y - c.y) <= alcance) this.enviar(otro, mensaje);
    }
    this.actividad(c);
  }

  /** Una reacción con emoji: la ven todas las personas de la sala, no se guarda. Máximo 8 cada 10 segundos. */
  private reaccionar(c: Conexion, emoji: string): void {
    const u = c.usuario;
    if (!u || !c.sala || c.invisible) return;
    const ahora = Date.now();
    c.ventanaReaccion = c.ventanaReaccion.filter((t) => ahora - t < 10_000);
    if (c.ventanaReaccion.length >= 8) return;
    c.ventanaReaccion.push(ahora);
    this.difundir(c.sala, u.id, { t: 'reaccion', id: u.id, emoji });
    this.actividad(c);
  }

  // ---------- salas bloqueadas ----------

  /** ¿Esta persona está dentro del rectángulo (en casillas)? */
  private dentroDe(c: Conexion, rect: { x: number; y: number; w: number; h: number }): boolean {
    const cx = Math.floor(c.x / CASILLA);
    const cy = Math.floor(c.y / CASILLA);
    return cx >= rect.x && cy >= rect.y && cx < rect.x + rect.w && cy < rect.y + rect.h;
  }

  /**
   * Bloquea o desbloquea una sala de reuniones. Hay que estar dentro; quien bloquea es la única que puede desbloquear, y la sala se
   * libera sola cuando esa persona sale de ella o se desconecta. Bloquear no impide caminar adentro: solo avisa a los demás.
   */
  private bloquearSala(c: Conexion, idZona: string, bloqueada: boolean): void {
    const u = c.usuario;
    if (!u || !c.sala) return;
    const ahora = Date.now();
    c.ventanaBloqueo = c.ventanaBloqueo.filter((t) => ahora - t < 10_000);
    if (c.ventanaBloqueo.length >= 6) {
      this.enviar(c, { t: 'error', mensaje: 'Vas muy rápido. Espera unos segundos.' });
      return;
    }
    c.ventanaBloqueo.push(ahora);
    const zona = this.salas.sala(c.sala)?.zonas?.find((z) => z.id === idZona);
    if (!zona || zona.tipo !== 'sala') {
      this.enviar(c, { t: 'error', mensaje: 'Esa no es una sala de reuniones.' });
      return;
    }
    if (!this.dentroDe(c, zona.rect)) {
      this.enviar(c, { t: 'error', mensaje: 'Para bloquear una sala tienes que estar adentro.' });
      return;
    }
    const clave = `${c.sala}|${idZona}`;
    const actual = this.bloqueos.get(clave);
    if (bloqueada) {
      if (actual) {
        if (actual.por !== u.id) this.enviar(c, { t: 'error', mensaje: 'Esta sala ya está bloqueada por otra persona.' });
        return;
      }
      this.bloqueos.set(clave, { sala: c.sala, zona: idZona, por: u.id });
      this.difundir(c.sala, -1, { t: 'sala-bloqueada', zona: idZona, bloqueada: true, por: u.id });
    } else {
      if (!actual) return;
      if (actual.por !== u.id) {
        this.enviar(c, { t: 'error', mensaje: 'Solo quien bloqueó la sala puede desbloquearla.' });
        return;
      }
      this.bloqueos.delete(clave);
      this.difundir(c.sala, -1, { t: 'sala-bloqueada', zona: idZona, bloqueada: false, por: u.id });
    }
    this.actividad(c);
  }

  /** Libera las salas cuya dueña ya no está adentro (salió, se fue de la sala del mapa o se desconectó). */
  private revisarBloqueos(salaId: string | null): void {
    for (const [clave, b] of [...this.bloqueos]) {
      if (salaId !== null && b.sala !== salaId) continue;
      const dueno = this.conexiones.get(b.por);
      const zona = this.salas.sala(b.sala)?.zonas?.find((z) => z.id === b.zona);
      if (dueno && dueno.sala === b.sala && zona && this.dentroDe(dueno, zona.rect)) continue;
      this.bloqueos.delete(clave);
      this.difundir(b.sala, -1, { t: 'sala-bloqueada', zona: b.zona, bloqueada: false, por: b.por });
    }
  }

  // ---------- saludo a distancia y consultas para Teams ----------

  /** Segundos mínimos entre dos saludos de la misma persona a la misma persona. */
  static readonly ESPERA_SALUDO_MS = 10_000;

  /**
   * Un saludo a distancia: llega solo si la otra persona está en línea (y visible). Quien saluda recibe el resultado, para que
   * la interfaz confirme o, si no hay nadie, ofrezca abrir un chat de Teams. No se guarda en ningún lado.
   */
  private saludar(c: Conexion, destino: number): void {
    const u = c.usuario;
    if (!u || destino === u.id) return;
    const ahora = Date.now();
    const ultimo = c.saludos.get(destino) ?? 0;
    if (ahora - ultimo < ServidorPresencia.ESPERA_SALUDO_MS) {
      this.enviar(c, { t: 'saludo-resultado', a: destino, estado: 'limite' });
      return;
    }
    c.saludos.set(destino, ahora);
    if (c.saludos.size > 200) for (const [k, t] of c.saludos) if (ahora - t > ServidorPresencia.ESPERA_SALUDO_MS) c.saludos.delete(k);
    const otro = this.conexiones.get(destino);
    if (!otro || !otro.usuario || !otro.sala || otro.invisible) {
      this.enviar(c, { t: 'saludo-resultado', a: destino, estado: 'sin-conexion' });
      return;
    }
    this.enviar(otro, { t: 'saludo', de: u.id, nombre: u.apodo || u.nombre });
    this.enviar(c, { t: 'saludo-resultado', a: destino, estado: 'entregado' });
    this.actividad(c);
  }

  /** Ids de quienes están en línea y visibles en este momento (quien está invisible cuenta como sin conexión). */
  idsEnLinea(): Set<number> {
    const ids = new Set<number>();
    for (const [id, c] of this.conexiones) if (c.sala && !c.invisible) ids.add(id);
    return ids;
  }

  /**
   * Quién está dentro de una zona ahora mismo, según la presencia. Sirve para armar el chat de una sala de Teams.
   * `yoDentro` dice si quien pregunta está adentro. Quienes están invisibles no cuentan. Devuelve null si la zona no existe en su sala.
   */
  ocupantesDeZona(usuarioId: number, idZona: string): { nombre: string; yoDentro: boolean; ids: number[] } | null {
    const yo = this.conexiones.get(usuarioId);
    if (!yo?.sala) return null;
    const zona = this.salas.sala(yo.sala)?.zonas?.find((z) => z.id === idZona);
    if (!zona) return null;
    const ids = this.enSala(yo.sala)
      .filter((o) => o.usuario && o.usuario.id !== usuarioId && !o.invisible && this.dentroDe(o, zona.rect))
      .map((o) => (o.usuario as Usuario).id)
      .sort((a, b) => a - b);
    return { nombre: zona.nombre ?? '', yoDentro: this.dentroDe(yo, zona.rect), ids };
  }

  /** El nombre del lugar más pequeño que contiene a esta persona (por ejemplo «Sala Norte»), o '' si no hay zona con nombre. */
  lugarDe(usuarioId: number): string {
    const c = this.conexiones.get(usuarioId);
    if (!c?.sala) return '';
    let mejor = '';
    let area = Infinity;
    for (const z of this.salas.sala(c.sala)?.zonas ?? []) {
      if (!z.nombre || !this.dentroDe(c, z.rect)) continue;
      const a = z.rect.w * z.rect.h;
      if (a < area) {
        area = a;
        mejor = z.nombre;
      }
    }
    return mejor;
  }

  // ---------- sesiones de enfoque ----------

  /** Lo que ven los demás de una sesión: solo si se comparte con «todos». */
  private enfoquePublico(c: Conexion): SesionEnfoquePublica | undefined {
    const s = c.enfoque;
    if (!s || s.visibilidad !== 'todos') return undefined;
    return { modo: s.modo, tema: s.tema, inicio: s.inicio, fin: s.fin, ...(s.spotify ? { spotify: s.spotify } : {}) };
  }

  /**
   * Empieza la sesión de enfoque de quien está sentado: pasa a «concentrado» (salvo con «No»), los demás ven el tema y el tiempo
   * (solo con «Sí, todos») y quien la inicia recibe su propia sesión con las horas del servidor. Una nueva reemplaza a la anterior.
   */
  private iniciarEnfoque(c: Conexion, bruto: unknown): void {
    const u = c.usuario;
    if (!u || !c.sala) return;
    const ahora = Date.now();
    c.ventanaEnfoque = c.ventanaEnfoque.filter((t) => ahora - t < 10_000);
    if (c.ventanaEnfoque.length >= 6) {
      this.enviar(c, { t: 'error', mensaje: 'Vas muy rápido. Espera unos segundos.' });
      return;
    }
    c.ventanaEnfoque.push(ahora);
    const pedido = validarPedidoEnfoque(bruto);
    if (typeof pedido === 'string') {
      this.enviar(c, { t: 'error', mensaje: pedido });
      return;
    }
    if (c.anim !== 'sentado') {
      this.enviar(c, { t: 'error', mensaje: 'Siéntate en una zona de coworking para iniciar la sesión.' });
      return;
    }
    if (c.enfoque) this.terminarEnfoque(c);
    c.enfoque = { modo: pedido.modo, tema: pedido.tema, inicio: ahora, fin: ahora + pedido.minutos * 60_000, ...(pedido.spotify ? { spotify: pedido.spotify } : {}), visibilidad: pedido.visibilidad };
    if (pedido.visibilidad !== 'nadie' && c.estado !== 'concentrado') {
      c.estadoAntesEnfoque = c.estadoManual;
      c.estadoManual = 'concentrado';
      c.estado = 'concentrado';
      this.enviar(c, { t: 'estado', id: u.id, estado: c.estado, lugar: c.lugar });
      if (!c.invisible) this.difundir(c.sala, u.id, { t: 'estado', id: u.id, estado: c.estado, lugar: c.lugar });
    }
    this.enviar(c, { t: 'enfoque', id: u.id, sesion: { ...c.enfoque, ahora } });
    const publica = this.enfoquePublico(c);
    if (publica && !c.invisible) this.difundir(c.sala, u.id, { t: 'enfoque', id: u.id, sesion: { ...publica, ahora } });
    this.actividad(c);
  }

  /** Termina la sesión (al pedirlo, al acabarse el tiempo o al levantarse) y le devuelve su estado de antes. */
  private terminarEnfoque(c: Conexion, avisar = true): void {
    const u = c.usuario;
    const eraPublica = this.enfoquePublico(c) !== undefined;
    if (!u || !c.enfoque) return;
    c.enfoque = null;
    const previo = c.estadoAntesEnfoque;
    c.estadoAntesEnfoque = null;
    if (!c.sala) return;
    if (previo !== null && c.estadoManual === 'concentrado') {
      c.estadoManual = previo;
      if (c.estado !== 'ausente') c.estado = previo;
      this.enviar(c, { t: 'estado', id: u.id, estado: c.estado, lugar: c.lugar });
      if (!c.invisible) this.difundir(c.sala, u.id, { t: 'estado', id: u.id, estado: c.estado, lugar: c.lugar });
    }
    if (!avisar) return;
    this.enviar(c, { t: 'enfoque', id: u.id, sesion: null });
    if (eraPublica && !c.invisible) this.difundir(c.sala, u.id, { t: 'enfoque', id: u.id, sesion: null });
  }

  /** Cierra las sesiones a las que se les acabó el tiempo. `ahora` se puede fijar en pruebas. */
  revisarEnfoques(ahora: number = Date.now()): void {
    for (const c of this.conexiones.values()) if (c.enfoque && ahora >= c.enfoque.fin) this.terminarEnfoque(c);
  }

  // ---------- colisiones y cambios del mapa ----------

  /** ¿Otra persona está sentada en esa casilla de asiento? Quien ya está en la casilla (por una carrera) no se bloquea a sí mismo. */
  private asientoTomado(datos: DatosSala, c: Conexion, k: number): boolean {
    if (!datos.asientos?.has(k) || indiceCasilla(datos, c.x, c.y) === k) return false;
    for (const o of this.conexiones.values()) {
      if (o === c || o.sala !== c.sala || o.anim !== 'sentado') continue;
      if (indiceCasilla(datos, o.x, o.y) === k) return true;
    }
    return false;
  }

  /** ¿Esa posición (en píxeles) cae en una casilla que no se puede pisar? Los asientos no bloquean: se cruzan y se sienta quien se detiene. */
  private bloqueaPaso(datos: DatosSala, x: number, y: number, anim: Animacion): boolean {
    if (!datos.bloqueo) return false;
    const k = indiceCasilla(datos, x, y);
    if (datos.bloqueo[k] !== 1) return false;
    return !(anim === 'sentado' && datos.asientos?.has(k) === true);
  }

  /**
   * Se publicó una versión nueva de la oficina (el proveedor de salas ya lee el mapa nuevo). A todas las conexiones
   * identificadas les llega el aviso para que vuelvan a pedir el mapa. Después se reubica a quien quedó en un lugar
   * que ya no se puede pisar, o en una sala que ya no existe.
   */
  mapaPublicado(numero: number): void {
    const todas = [...this.conexiones.values()];
    for (const c of todas) this.enviar(c, { t: 'mapa', numero });
    for (const c of todas) this.reubicarTrasCambio(c, numero);
  }

  private reubicarTrasCambio(c: Conexion, numero: number): void {
    const idSala = c.sala;
    if (!c.usuario || !idSala) return;
    const datos = this.salas.sala(idSala);
    if (!datos) {
      this.llevarASalaInicial(c, numero);
      return;
    }
    const fuera = c.x < 0 || c.y < 0 || c.x > datos.ancho * CASILLA || c.y > datos.alto * CASILLA;
    if (fuera || this.bloqueaPaso(datos, c.x, c.y, c.anim)) {
      const llegada = llegadaCercana(datos, c.x, c.y);
      c.x = (llegada.x + 0.5) * CASILLA;
      c.y = (llegada.y + 0.5) * CASILLA;
      c.anim = 'quieto';
    } else if (c.anim === 'sentado' && datos.asientos && !datos.asientos.has(indiceCasilla(datos, c.x, c.y))) {
      c.anim = 'quieto'; // el asiento ya no está, aunque la casilla siga libre: se levanta donde estaba
    } else {
      return;
    }
    this.reiniciarCredito(c);
    c.sucio = !c.invisible; // los demás ven el salto en el siguiente reparto de movimientos
    this.enviar(c, { t: 'corregir', x: c.x, y: c.y });
  }

  /** La sala de esta persona ya no existe: pasa a la sala de entrada con una bienvenida nueva. */
  private llevarASalaInicial(c: Conexion, numero: number): void {
    const u = c.usuario as Usuario;
    const antes = c.sala as string;
    if (!c.invisible) this.difundir(antes, u.id, { t: 'sale', id: u.id });
    const id = this.salas.inicial();
    const datos = this.salas.sala(id);
    if (!datos) {
      c.sala = null;
      this.enviar(c, { t: 'error', mensaje: 'La oficina cambió y no hay un lugar al que llevarte. Vuelve a entrar.' });
      return;
    }
    const llegada = llegadaCercana(datos, c.x, c.y);
    c.sala = id;
    c.x = (llegada.x + 0.5) * CASILLA;
    c.y = (llegada.y + 0.5) * CASILLA;
    c.dir = 'S';
    c.anim = 'quieto';
    this.reiniciarCredito(c);
    if (this.bloqueos.size > 0) this.revisarBloqueos(null);
    this.anunciarEntrada(c, id, numero);
  }

  // ---------- ausencia ----------

  private actividad(c: Conexion): void {
    c.tActividad = Date.now();
    if (c.estado === 'ausente' && c.estadoManual !== 'ausente' && c.sala && c.usuario) {
      c.estado = c.estadoManual;
      if (!c.invisible) this.difundir(c.sala, c.usuario.id, { t: 'estado', id: c.usuario.id, estado: c.estado, lugar: c.lugar });
    }
  }

  /** Pasa a «ausente» a quien lleva más del tiempo configurado sin hacer nada. `ahora` se puede fijar en pruebas. */
  revisarAusencias(ahora: number = Date.now()): void {
    const limite = this.ctx.ajustes.obtener<number>('ausencia_min') * 60_000;
    for (const c of this.conexiones.values()) {
      if (!c.sala || !c.usuario || c.estado === 'ausente') continue;
      if (ahora - c.tActividad > limite) {
        c.estado = 'ausente';
        if (!c.invisible) this.difundir(c.sala, c.usuario.id, { t: 'estado', id: c.usuario.id, estado: 'ausente', lugar: c.lugar });
      }
    }
  }

  // ---------- difusión ----------

  private difundirMovimientos(): void {
    const porSala = new Map<string, Conexion[]>();
    for (const c of this.conexiones.values()) {
      if (c.sala) porSala.set(c.sala, [...(porSala.get(c.sala) ?? []), c]);
    }
    for (const miembros of porSala.values()) {
      const cambios = miembros.filter((c) => c.sucio && !c.invisible);
      if (cambios.length === 0) continue;
      for (const destino of miembros) {
        const lista = cambios.filter((o) => o !== destino).map((o) => ({ id: (o.usuario as Usuario).id, x: o.x, y: o.y, dir: o.dir, anim: o.anim }));
        if (lista.length > 0) this.enviar(destino, { t: 'movimientos', lista });
      }
      for (const c of cambios) c.sucio = false;
    }
  }

  private enSala(sala: string): Conexion[] {
    return [...this.conexiones.values()].filter((c) => c.sala === sala);
  }

  private visiblesEnSala(sala: string, excepto: number): Conexion[] {
    return this.enSala(sala).filter((c) => c.usuario?.id !== excepto && !c.invisible);
  }

  private difundir(sala: string, excepto: number, m: MensajeServidor): void {
    for (const c of this.enSala(sala)) {
      if (c.usuario?.id !== excepto) this.enviar(c, m);
    }
  }

  private enviar(c: Conexion, m: MensajeServidor): void {
    if (c.ws.readyState === WebSocket.OPEN) c.ws.send(JSON.stringify(m));
  }

  private aPersona(c: Conexion): PersonaPresente {
    const u = c.usuario as Usuario;
    const enfoque = this.enfoquePublico(c);
    return { id: u.id, nombre: u.nombre, cargo: u.cargo, apodo: u.apodo, avatar: c.avatar, foto: versionFoto(u), sala: c.sala ?? '', x: c.x, y: c.y, dir: c.dir, anim: c.anim, estado: c.estado, lugar: c.lugar, ...(enfoque ? { enfoque: { ...enfoque, ahora: Date.now() } } : {}) };
  }

  private ajustesPresencia(): AjustesPresencia {
    const a = this.ctx.ajustes;
    return {
      distanciaCercania: a.obtener<number>('distancia_cercania'),
      chatActivo: a.obtener<boolean>('chat_activo'),
      chatMax: a.obtener<number>('chat_max_caracteres'),
      teamsActivo: a.obtener<boolean>('teams_activo'),
      ausenciaMin: a.obtener<number>('ausencia_min'),
      invisiblesPermitido: a.obtener<boolean>('invisibles_permitido'),
    };
  }

  // ---------- cierre ----------

  private cerrar(c: Conexion, motivo: MotivoCierre, mensaje: string): void {
    this.enviar(c, { t: 'cerrar', motivo, mensaje });
    try {
      c.ws.close(CODIGO_CIERRE[motivo], motivo);
    } catch {
      /* ya estaba cerrada */
    }
  }

  private alCerrar(c: Conexion): void {
    if (c.temporizadorHola) clearTimeout(c.temporizadorHola);
    this.sinIdentificar.delete(c);
    const u = c.usuario;
    if (!u) return;
    // Si otra conexión de la misma persona ya la reemplazó, esa es la que manda: avisar «sale» aquí
    // haría desaparecer a la persona para los demás justo después de que su conexión nueva entró.
    if (this.conexiones.get(u.id) !== c) return;
    this.conexiones.delete(u.id);
    if (c.sala && !c.invisible) this.difundir(c.sala, u.id, { t: 'sale', id: u.id });
    if (this.bloqueos.size > 0) this.revisarBloqueos(null);
  }

  /** Cierra la conexión de una persona (cuenta desactivada o eliminada, clave restablecida, cambio de clave). */
  expulsar(usuarioId: number, motivo: MotivoCierre = 'sesion_terminada'): void {
    const c = this.conexiones.get(usuarioId);
    if (c) this.cerrar(c, motivo, 'Tu sesión terminó. Ingresa de nuevo.');
  }

  /** Alguien cambió su apodo o su personaje: lo ven al instante quienes están en su sala. */
  perfilCambiado(u: Usuario): void {
    const c = this.conexiones.get(u.id);
    if (!c) return;
    c.usuario = u;
    c.avatar = personajeVisible(leerAvatar(u.personaje), leerAcceso(u.acceso));
    if (c.sala) {
      const aviso: MensajeServidor = { t: 'avatar', id: u.id, avatar: c.avatar, apodo: u.apodo, foto: versionFoto(u) };
      this.difundir(c.sala, u.id, aviso);
      this.enviar(c, aviso); // a ti también: tu foto nueva se ve en tu lista, tu tarjeta y tu botón de estado
    }
  }

  enLinea(): number {
    return this.conexiones.size;
  }

  async detener(): Promise<void> {
    clearInterval(this.tick);
    clearInterval(this.revisor);
    for (const c of [...this.conexiones.values(), ...this.sinIdentificar]) {
      try {
        c.ws.terminate();
      } catch {
        /* nada que cerrar */
      }
    }
    await new Promise<void>((listo) => this.wss.close(() => listo()));
  }
}

export function leerAvatar(texto: string | null): AvatarSpec | null {
  if (!texto) return null;
  try {
    const v = JSON.parse(texto) as AvatarSpec;
    return v && v.v === 1 ? v : null;
  } catch {
    return null;
  }
}
