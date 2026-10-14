import Phaser from 'phaser';
import {
  CASILLA,
  OPUESTA,
  VELOCIDAD_PX_S,
  asientosDe,
  huellaDe,
  indiceDe,
  objetoPorId,
  profundidades,
  zonaEn,
  type Animacion,
  type Asiento,
  type Celda,
  type Colocacion,
  type DatosSentado,
  type Direccion,
  type EstadoPresencia,
  type Lugar,
  type ObjetoCatalogo,
  type SalaMapa,
} from '@ol/shared';
import { areaBajo, areasDeSala, zonasRotuladas, type AreaMundo } from './areas';
import { Atenuacion } from './atenuacion';
import { Contornos } from './contornos';
import { buscarMiEscritorio, esMiArea, escritorioEnCasilla, sillaDeEscritorio } from './escritorios';
import { Esquema } from './esquema';
import { crearExterior, llevaCalle, type Exterior } from './exterior';
import { Etiquetas } from './etiquetas';
import { CapaMascotas } from './capa-mascotas';
import { CapaPersonas } from './personas';
import { datosDeAsiento, piesSentado } from './sentado-anclas';
import { LimiteVoces, materialDePiso, sonidoDeOtro, type Efecto } from './sonido';
import { DURACION_EFECTO_MS, type OpcionesEfecto } from './sonido-audio';
import { iniciarSonido, sonido } from './sonido-global';
import { Luces } from './luces';
import { Marcas } from './marcas';
import { avanzarPorRuta, chocaEn as chocaEnPura, pasoConDeslizamiento } from './movimiento';
import { SentarseAlParar } from './sentarse';
import { aMundo, aPantalla, crearProyeccion, type Proyeccion } from './proyeccion';
import type { EventoPuntero, Interaccion, ModoRendimiento, OrdenesEscena, Puente, Seleccion } from './puente';
import { Reacciones } from './reacciones';
import { celdaDePies as celdaDeLosPies, centroDeCelda, rutaAAsiento, rutaAArea, rutaAlLado, rutaAPunto, type Cuadricula } from './ruta';
import type { EstadoMundo } from './tipos';
import { PuertasVista } from './puertas';
import { VistaSala } from './vista-sala';
import type { CambioVivo, PersonaVista } from './vivo';
import { ZOOMS, debeVerEsquema, pasoDeZoom, radioCirculo, suavizar, zoomMinimoPermitido, zoomQueAjusta } from './zoom';

export { ZOOMS };

const MARGEN_CASILLAS = 3;
/** Dos clics seguidos más cerca que esto (en ms y en píxeles de pantalla) cuentan como doble clic. */
const DOBLE_CLIC_MS = 400;
const DOBLE_CLIC_PX = 16;
/** Cuánto hay que mover el ratón con el botón presionado para que cuente como arrastre y no como clic. */
const UMBRAL_ARRASTRE_PX = 5;
/** Si tu personaje no avanza nada durante este tiempo yendo por un camino, se da por trabado y se cancela. */
const TRABADO_MS = 350;
const DESLIZAR_MS = 140;

const VECTOR: Record<Direccion, [number, number]> = { N: [0, -1], S: [0, 1], E: [1, 0], O: [-1, 0] };

const mezclar = (a: number, b: number, t: number): number => {
  const ar = (a >> 16) & 255;
  const ag = (a >> 8) & 255;
  const ab = a & 255;
  const br = (b >> 16) & 255;
  const bg = (b >> 8) & 255;
  const bb = b & 255;
  return (Math.round(ar + (br - ar) * t) << 16) | (Math.round(ag + (bg - ag) * t) << 8) | Math.round(ab + (bb - ab) * t);
};

type Pendiente = { tipo: 'sentarse'; asiento: Asiento } | { tipo: 'interactuar'; i: Interaccion } | null;
type TipoRuta = 'punto' | 'escritorio' | 'persona';

/** La escena de la oficina: dibuja la sala, mueve tu personaje, lleva la cámara y reenvía el puntero al editor. */
export class EscenaOficina extends Phaser.Scene implements OrdenesEscena {
  private puente!: Puente;
  private vista!: VistaSala;
  private puertas!: PuertasVista;
  private luces!: Luces;
  /** La calle y los vecinos que se ven desde el piso 4 (solo la sala principal). */
  private exterior: Exterior | null = null;
  private personas!: CapaPersonas;
  private mascotas!: CapaMascotas;
  private marcas!: Marcas;
  private etiquetas!: Etiquetas;
  private contornos!: Contornos;
  private esquema!: Esquema;
  private reacciones!: Reacciones;
  /** El velo que atenúa lo de afuera al entrar a una sala de reuniones. */
  private atenuacion!: Atenuacion;

  private estadoPrevio: EstadoMundo | null = null;
  private sala: SalaMapa | null = null;
  private bloqueo: Uint8Array = new Uint8Array(0);
  private asientos: Asiento[] = [];
  private profPorColocacion = new Map<string, number>();
  private profAsiento = new Map<number, number>();
  /** Cómo se acomoda quien se sienta en cada casilla de asiento (dx, dy, corte y pose). */
  private datosAsiento = new Map<number, DatosSentado>();
  /** Voces simultáneas de las demás personas (pasos, sentadas, puertas y reacciones ajenas): máximo 4. */
  private readonly voces = new LimiteVoces();
  /** Tipo de la zona donde estás (para el clic al entrar o salir de una sala de reuniones). */
  private zonaTipo: string | null = null;
  private interactivos: { c: Colocacion; o: ObjetoCatalogo }[] = [];

  /** Zonas y áreas personales de la sala: lo que se puede señalar y tocar. */
  private areas: AreaMundo[] = [];
  private zonasRotuladas: AreaMundo[] = [];
  /** Las áreas personales que son tuyas (para el contorno verde azulado al estar en tu escritorio). */
  private misAreas = new Set<string>();
  private hover: AreaMundo | null = null;
  private hoverPos = { x: -1, y: -1 };
  private seleccion: Seleccion = null;
  private cursorActual = '';
  private ultimoClic: { t: number; x: number; y: number } | null = null;
  /** Botón presionado sobre el mundo: si el ratón se mueve más del umbral, se vuelve arrastre de la vista. */
  private presion: { x: number; y: number; ux: number; uy: number; arrastrando: boolean } | null = null;
  /** Último movimiento del puntero sin procesar: el hover se calcula una vez por cuadro, no en cada evento. */
  private hoverPend: { px: number; py: number; sx: number; sy: number } | null = null;
  /** Dónde está el puntero en pantalla (null si salió del lienzo) y desde qué vista se calculó el hover: si la cámara se mueve, se recalcula. */
  private punteroPantalla: { sx: number; sy: number } | null = null;
  private vistaHover = { sx0: 0, sy0: 0, zoom: 0 };
  /** La vista se movió a mano (arrastre o trackpad): la cámara no te sigue hasta que te muevas o pidas centrarla. */
  private panLibre = false;
  private cuad: Cuadricula = { ancho: 0, alto: 0, bloqueo: new Uint8Array(0) };
  /** Arranque suave al caminar: sube de 0 a 1 en una fracción de segundo. */
  private rampa = 0;
  private tTrabado = 0;
  /** Deslizamiento corto al sentarte o levantarte (en vez de saltar de una casilla a la otra). */
  private deslizar: { x0: number; y0: number; x1: number; y1: number; t: number } | null = null;

  private foco = { x: 0, y: 0 };
  /** Zoom que se dibuja ahora (se anima). `zoomBase` es el que eligió la persona con los botones. */
  private zoom = 2;
  private zoomBase = 2;
  private conGente = false;
  private luz = 1;
  /** Qué tanto se ve la vista esquemática: 0 el arte, 1 el esquema. */
  private esquemaT = 0;
  private esquemaVisible = false;
  private alfaArte = 1;
  private vp: Proyeccion = crearProyeccion(0, 0, 1, 1, 1);
  private tAhora = 0;
  private cursor: { x: number; y: number } | null = null;

  private teclas!: Record<'w' | 'a' | 's' | 'd' | 'arriba' | 'abajo' | 'izq' | 'der' | 'e' | 'espacio' | 'enter', Phaser.Input.Keyboard.Key>;
  private arrastrePan: { x: number; y: number } | null = null;
  private tRueda = 0;

  private ruta: Celda[] = [];
  private rutaActiva = false;
  private rutaTipo: TipoRuta = 'punto';
  private rutaEtiqueta = '';
  /** Si vas hacia una persona: a quién y dónde estaba la última vez que se calculó el camino. */
  private seguir: { id: number; celda: Celda; t: number } | null = null;
  private pendiente: Pendiente = null;
  private sentadoEn: Asiento | null = null;
  /** Sentarse al detenerse justo en la casilla de un asiento libre (ver `sentarse.ts`). */
  private parada = new SentarseAlParar();
  /** Cuadrícula base de la sala (compartida, no se modifica) y casillas de asiento ocupadas que hoy bloquean en `cuad`. */
  private bloqueoBase: Uint8Array = new Uint8Array(0);
  private asientosTomados: number[] = [];
  /** Dónde llegaste a la oficina (en píxeles): de ahí se elige el escritorio libre más cercano. */
  private llegada: { x: number; y: number } | null = null;
  /** Lámparas apagadas por esta persona (se recuerda en este navegador). */
  private lamparasApagadas = new Set<string>();
  /** Placas de los puestos: se ven al pasar el puntero, al sentarse o durante unos segundos tras tocar el puesto. */
  private placaHover: string | null = null;
  private placaToque: { id: string; hasta: number } | null = null;
  private puestoActual: string | null = null;
  private ultimoEnvio = { t: 0, x: -1, y: -1, dir: 'S' as Direccion, anim: 'quieto' as Animacion };
  private zonaActual: string | null = null;
  private cercaActual: string | null = null;
  private tCerca = 0;
  private enfoqueEnCampo = false;
  private limpiezas: Array<() => void> = [];

  constructor() {
    super('oficina');
  }

  init(datos: { puente: Puente }): void {
    this.puente = datos.puente;
  }

  create(): void {
    const p = this.puente;
    this.vista = new VistaSala(this, p.arte);
    this.puertas = new PuertasVista(this);
    iniciarSonido();
    this.puertas.alCambiar = (abre, x, y) => this.sonarAjeno(abre ? 'puerta-abre' : 'puerta-cierra', x, y, {});
    this.puente.vivo.alEntraOSale = (tipo) => sonido.reproducir(tipo);
    this.luces = new Luces(this);
    try {
      const guardadas: unknown = JSON.parse(localStorage.getItem('ol_lamparas') ?? '[]');
      if (Array.isArray(guardadas)) this.lamparasApagadas = new Set(guardadas.filter((x): x is string => typeof x === 'string'));
    } catch {
      /* sin almacenamiento: todas encendidas */
    }
    this.luces.apagadas = this.lamparasApagadas;
    this.personas = new CapaPersonas(this, p);
    this.mascotas = new CapaMascotas(this, p);
    this.marcas = new Marcas(this, p.arte);
    this.etiquetas = new Etiquetas(this);
    this.contornos = new Contornos(this);
    this.esquema = new Esquema(this);
    this.reacciones = new Reacciones(this, p.vivo);
    this.atenuacion = new Atenuacion(this);
    this.personas.profAsiento = (cx, cy) => this.profAsiento.get(cy * (this.sala?.ancho ?? 1) + cx) ?? null;
    this.personas.alPaso = (e) => {
      const o: OpcionesEfecto = { material: this.materialEn(e.x, e.y), variante: e.variante, tono: e.tono };
      if (e.esYo) this.sonar('paso', { ...o, volumen: 0.8 });
      else this.sonarAjeno('paso', e.x, e.y, o);
    };
    this.personas.alAsiento = (e) => {
      const blando = e.datos?.blando ?? false;
      const efecto: Efecto = e.sienta ? (blando ? 'sentar-blando' : 'sentar-duro') : blando ? 'levantar-blando' : 'levantar-duro';
      if (e.esYo) this.sonar(efecto, {});
      else this.sonarAjeno(efecto, e.x, e.y, {});
    };
    this.personas.datosAsiento = (cx, cy) => this.datosAsiento.get(cy * (this.sala?.ancho ?? 1) + cx) ?? null;
    this.personas.imagenAsiento = (cx, cy) => {
      const asiento = this.asientos.find((x) => x.x === cx && x.y === cy);
      return asiento ? this.vista.imagenDe(asiento.colocacion) : undefined;
    };

    const cam = this.cameras.main;
    cam.setRoundPixels(true);
    this.input.mouse?.disableContextMenu();

    const k = this.input.keyboard;
    if (k) {
      const KC = Phaser.Input.Keyboard.KeyCodes;
      this.teclas = k.addKeys({ w: KC.W, a: KC.A, s: KC.S, d: KC.D, arriba: KC.UP, abajo: KC.DOWN, izq: KC.LEFT, der: KC.RIGHT, e: KC.E, espacio: KC.SPACE, enter: KC.ENTER }, false) as typeof this.teclas;
      const alEnfocar = (e: FocusEvent) => {
        const t = e.target as HTMLElement | null;
        this.enfoqueEnCampo = Boolean(t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable));
        if (k) k.enabled = !this.enfoqueEnCampo;
        if (this.enfoqueEnCampo) k.resetKeys();
      };
      const alDesenfocar = () => {
        this.enfoqueEnCampo = false;
        k.enabled = true;
      };
      document.addEventListener('focusin', alEnfocar);
      document.addEventListener('focusout', alDesenfocar);
      this.limpiezas.push(() => {
        document.removeEventListener('focusin', alEnfocar);
        document.removeEventListener('focusout', alDesenfocar);
      });
      k.on('keydown-E', () => this.alTeclaInteractuar());
      k.on('keydown-ENTER', () => this.alTeclaInteractuar());
      k.on('keydown-ESC', () => {
        if (this.puente.almacen.get().modo !== 'mundo') return;
        this.cancelarRuta();
        this.deseleccionar();
      });
    }

    this.input.on('pointerdown', (ptr: Phaser.Input.Pointer) => this.alPuntero('abajo', ptr));
    this.input.on('pointermove', (ptr: Phaser.Input.Pointer) => this.alPuntero('mover', ptr));
    this.input.on('pointerup', (ptr: Phaser.Input.Pointer) => this.alPuntero('arriba', ptr));
    this.input.on('pointerupoutside', (ptr: Phaser.Input.Pointer) => this.alPuntero('arriba', ptr));
    this.input.on('wheel', (ptr: Phaser.Input.Pointer, _o: unknown, dx: number, dy: number) => this.alRueda(ptr, dx, dy));

    this.scale.on('resize', () => {
      this.actualizarZoomMinimo();
      this.aplicarCamara(0, true);
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.apagar());

    // La red cambia a las personas: tu bienvenida, una corrección del servidor, las reacciones.
    this.limpiezas.push(p.vivo.suscribir((c) => this.alCambiarVivo(c)));
    const yo0 = p.vivo.yo;
    if (yo0) this.llegada = { x: yo0.x, y: yo0.y };

    p.ordenes = this;
    (window as unknown as { __mundo?: EscenaOficina }).__mundo = this;
    this.alCambiarEstado(null, p.almacen.get());
    this.estadoPrevio = p.almacen.get();
  }

  private apagar(): void {
    for (const f of this.limpiezas) f();
    this.limpiezas = [];
    this.setCursor('');
    this.personas.destruir();
    this.mascotas.destruir();
    this.luces.destruir();
    this.exterior?.destruir();
    this.exterior = null;
    this.marcas.destruir();
    this.etiquetas.destruir();
    this.contornos.destruir();
    this.esquema.destruir();
    this.reacciones.destruir();
    this.atenuacion.destruir();
    this.puertas.destruir();
    this.puertas.alCambiar = null;
    this.puente.vivo.alEntraOSale = undefined;
    this.vista.destruir();
  }

  // ---------- cambios de estado ----------

  private alCambiarEstado(previo: EstadoMundo | null, e: EstadoMundo): void {
    if (e.sala !== (previo?.sala ?? null)) this.cargarSala(e.sala);
    if (e.luz !== previo?.luz) this.exterior?.actualizarLuz(e.luz);
    if (e.modo !== previo?.modo) this.exterior?.modoEdicion(e.modo === 'edicion');
    if (e.zoom !== previo?.zoom) {
      this.zoomBase = e.zoom;
      if (e.modo === 'edicion') this.zoom = e.zoom;
    }
    // Los botones no pueden alejar más de lo que cabe la sala en pantalla.
    if (e.zoom < e.zoomMin - 1e-9) this.puente.almacen.set({ zoom: e.zoomMin });
    if (e.centrar && e.centrar !== previo?.centrar) this.foco = { x: e.centrar.x, y: e.centrar.y };
    if (e.modo !== previo?.modo) {
      this.arrastrePan = null;
      if (e.modo === 'edicion') {
        this.cancelarRuta();
        this.presion = null;
        this.hoverPend = null;
        this.panLibre = false;
        this.personas.yoCaminando = false;
        this.deseleccionar();
        this.avisarHover(null, 0, 0);
      } else this.marcas.limpiar();
    }
  }

  private cargarSala(sala: SalaMapa | null): void {
    const cambioSala = sala?.id !== this.sala?.id;
    this.sala = sala;
    this.vista.sincronizar(sala);
    this.puertas.sincronizar(sala);
    this.sincronizarExterior(sala);
    this.luces.sincronizar(sala);
    this.pintarLamparas();
    this.areas = sala ? areasDeSala(sala) : [];
    this.zonasRotuladas = zonasRotuladas(this.areas);
    this.hover = null;
    if (this.seleccion?.tipo === 'area' && !this.areas.some((a) => this.seleccion?.tipo === 'area' && a.id === this.seleccion.id)) this.deseleccionar();
    this.recalcularMisAreas();
    this.zonaActual = null; // se vuelve a mirar en qué zona estás: el mapa pudo cambiar sus rectángulos
    if (!sala) return;
    const ix = indiceDe(sala);
    this.bloqueo = ix.bloqueo;
    this.bloqueoBase = ix.bloqueo;
    this.cuad = { ancho: sala.ancho, alto: sala.alto, bloqueo: ix.bloqueo.slice() };
    this.asientosTomados = [];
    this.asientos = asientosDe(sala);
    const prof = profundidades(sala);
    this.profPorColocacion.clear();
    this.profAsiento.clear();
    this.datosAsiento.clear();
    sala.colocaciones.forEach((c, i) => this.profPorColocacion.set(c.id, prof[i] ?? 0));
    const colocPorId = new Map(sala.colocaciones.map((c) => [c.id, c]));
    for (const a of this.asientos) {
      this.profAsiento.set(a.y * sala.ancho + a.x, this.profPorColocacion.get(a.colocacion) ?? 0);
      const col = colocPorId.get(a.colocacion);
      this.datosAsiento.set(a.y * sala.ancho + a.x, datosDeAsiento(col ? objetoPorId(col.objeto) : undefined, a));
    }
    this.interactivos = [];
    for (const c of sala.colocaciones) {
      const o = objetoPorId(c.objeto);
      // Los asientos no piden tecla: el personaje se sienta solo al empujar contra ellos (ver `actualizarYo`).
      if (o && o.interaccion !== 'ninguna' && o.interaccion !== 'puerta' && o.interaccion !== 'sentarse') this.interactivos.push({ c, o });
    }
    if (cambioSala) {
      const yo = this.puente.vivo.yo;
      this.foco = yo ? { x: yo.x, y: yo.y - 16 } : { x: (sala.ancho * CASILLA) / 2, y: (sala.alto * CASILLA) / 2 };
    }
    this.actualizarZoomMinimo();
    this.desatascar();
  }

  private recalcularMisAreas(): void {
    this.misAreas.clear();
    const yo = this.puente.vivo.yo;
    if (!yo || !this.sala) return;
    for (const a of this.sala.areas ?? []) if (esMiArea(a, { id: yo.id, nombre: yo.nombre, apodo: yo.apodo })) this.misAreas.add(a.id);
  }

  /** El zoom más lejano que sirve: el que deja la sala entera a la vista. Lo leen los botones del zoom. */
  private actualizarZoomMinimo(): void {
    const s = this.sala;
    const cam = this.cameras.main;
    if (!s) return;
    const min = zoomMinimoPermitido(zoomQueAjusta(cam.width, cam.height, s.ancho * CASILLA, s.alto * CASILLA));
    const e = this.puente.almacen.get();
    if (e.zoomMin !== min) this.puente.almacen.set({ zoomMin: min });
    if (e.zoom < min - 1e-9) this.puente.almacen.set({ zoom: min });
  }

  /** Lo que llega de la red por `vivo`: tu bienvenida, una corrección, un cambio de personas o una reacción. */
  private alCambiarVivo(c: CambioVivo): void {
    if (c === 'yo') this.alNuevoYo();
    else if (c === 'corregido') this.alCorregido();
    else if (c === 'reaccion') {
      const r = this.puente.vivo.ultimaReaccion;
      if (r) {
        this.reacciones.mostrar(r.id, r.emoji, this.tAhora);
        const otro = this.puente.vivo.otros.get(r.id);
        if (otro) this.sonarAjeno('reaccion', otro.vx, otro.vy, {});
      }
    } else if (c === 'personas' && this.seleccion?.tipo === 'persona') {
      const id = this.seleccion.id;
      const v = this.puente.vivo;
      if (v.yo?.id !== id && !v.otros.has(id)) this.deseleccionar();
    }
  }

  /** El servidor te dio un lugar (al entrar o al reconectar): cualquier camino o asiento anterior ya no vale. */
  private alNuevoYo(): void {
    this.cancelarRuta();
    if (this.sentadoEn) {
      this.sentadoEn = null;
      this.puente.alSentarse?.(false);
    }
    const yo = this.puente.vivo.yo;
    this.ultimoEnvio = { t: 0, x: -1, y: -1, dir: 'S', anim: 'quieto' };
    this.zonaActual = null;
    this.cercaActual = null;
    this.recalcularMisAreas();
    this.panLibre = false;
    this.deslizar = null;
    if (!yo) return;
    this.llegada = { x: yo.x, y: yo.y };
    this.foco = { x: yo.x, y: yo.y - 16 };
    this.desatascar();
  }

  /** El servidor rechazó un movimiento y te puso donde estabas: el camino que seguías ya no sirve. */
  private alCorregido(): void {
    this.cancelarRuta();
    if (this.sentadoEn) {
      this.sentadoEn = null;
      this.puente.alSentarse?.(false);
    }
    this.ultimoEnvio.t = 0;
  }

  /** Si el mapa cambió y tu personaje quedó sobre algo sólido, lo mueve a la casilla libre más cercana. */
  private desatascar(): void {
    const yo = this.puente.vivo.yo;
    const sala = this.sala;
    if (!yo || !sala || this.sentadoEn) return;
    if (!this.chocaEn(yo.x, yo.y)) return;
    const [cx, cy] = this.celdaDePies(yo.x, yo.y);
    let destino: { x: number; y: number } | null = null;
    for (let r = 1; r <= 12 && !destino; r++) {
      let mejorD = Infinity;
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r || this.esBloqueada(cx + dx, cy + dy)) continue;
          const d = dx * dx + dy * dy;
          if (d < mejorD) {
            mejorD = d;
            destino = { x: cx + dx, y: cy + dy };
          }
        }
      }
    }
    destino ??= sala.llegadas[0] ?? null;
    if (destino) {
      const c = this.centroPies(destino.x, destino.y);
      yo.x = yo.vx = c.x;
      yo.y = yo.vy = c.y;
    }
  }

  // ---------- coordenadas y colisiones ----------

  private celdaDePies(x: number, y: number): [number, number] {
    const c = celdaDeLosPies(x, y);
    return [c.x, c.y];
  }

  private esBloqueada(cx: number, cy: number): boolean {
    const s = this.sala;
    if (!s || cx < 0 || cy < 0 || cx >= s.ancho || cy >= s.alto) return true;
    return this.bloqueo[cy * s.ancho + cx] === 1;
  }

  private chocaEn(x: number, y: number): boolean {
    return chocaEnPura(this.cuad, x, y);
  }

  private centroPies(cx: number, cy: number): { x: number; y: number } {
    return centroDeCelda({ x: cx, y: cy });
  }

  // ---------- bucle ----------

  override update(tiempo: number, delta: number): void {
    this.tAhora = tiempo;
    const estado = this.puente.almacen.get();
    if (estado !== this.estadoPrevio) {
      this.alCambiarEstado(this.estadoPrevio, estado);
      this.estadoPrevio = estado;
    }
    const dt = Math.min(delta, 100) / 1000;
    const objetivo = estado.luz === 'claro' ? 1 : 0;
    this.luz += (objetivo - this.luz) * (1 - Math.exp(-dt * 6));
    if (Math.abs(objetivo - this.luz) < 0.004) this.luz = objetivo;

    const enMundo = estado.modo === 'mundo';
    if (enMundo) {
      this.actualizarYo(dt, tiempo);
      this.actualizarZoomAutomatico(dt);
    } else {
      this.moverCamaraConTeclas(dt);
      this.zoom = this.zoomBase;
    }

    // Vista esquemática: aparece al alejar (o siempre, si se forzó) y sale con suavidad.
    const quiereEsquema = enMundo && debeVerEsquema(estado.vistaEsquema, this.zoom, this.esquemaVisible);
    sonido.esquema = this.esquemaVisible || quiereEsquema;
    if (quiereEsquema !== this.esquemaVisible) {
      this.esquemaVisible = quiereEsquema;
      this.avisarExterior(quiereEsquema);
    }
    if (estado.enEsquema !== quiereEsquema) this.puente.almacen.set({ enEsquema: quiereEsquema });
    this.esquemaT = suavizar(this.esquemaT, quiereEsquema ? 1 : 0, dt, 7);
    const fondoNormal = mezclar(0x090a0e, 0xe4e5ec, this.luz);
    this.cameras.main.setBackgroundColor(this.esquemaT > 0 ? mezclar(fondoNormal, Esquema.colorDeFondo(this.luz < 0.5), this.esquemaT) : fondoNormal);

    if (enMundo) this.procesarHover();
    this.actualizarPlacas(tiempo, enMundo && this.esquemaT < 0.4);
    this.actualizarPuertas(dt, enMundo);
    this.personas.sincronizar();
    this.personas.actualizar(delta, tiempo, this.zoom, this.sala);
    this.mascotas.actualizar(delta, tiempo, this.sala, this.cuad);
    this.aplicarCamara(dt, false);
    const cam = this.cameras.main;
    this.vp = crearProyeccion(cam.scrollX, cam.scrollY, cam.width, cam.height, this.zoom);

    const alfa = 1 - this.esquemaT;
    if (alfa !== this.alfaArte || this.esquemaT > 0) {
      this.alfaArte = alfa;
      this.vista.setAlfa(alfa);
      this.puertas.setAlfa(alfa);
      this.personas.setAlfa(alfa);
      this.mascotas.setAlfa(alfa);
    }
    this.luces.intensidad = alfa;
    this.luces.actualizar(tiempo, this.luz, this.personas.puntos(), cam.worldView);

    const oscuro = this.luz < 0.5;
    this.esquema.actualizar({ vp: this.vp, sala: this.sala, areas: this.areas, oscuro, t: this.esquemaT, personas: this.personas.anclas, yoId: this.puente.vivo.yo?.id ?? null });
    this.etiquetas.actualizar({
      vp: this.vp,
      oscuro,
      esquemaT: this.esquemaT,
      personas: this.personas.anclas,
      yoId: this.puente.vivo.yo?.id ?? null,
      seleccionPersona: this.seleccion?.tipo === 'persona' ? this.seleccion.id : null,
      zonas: this.zonasRotuladas,
      titulo: this.areaSeleccionada(),
      visible: enMundo,
    });
    this.atenuacion.actualizar(dt, enMundo ? 1 - this.esquemaT : 0);
    this.contornos.actualizar({ zoom: this.zoom, hover: null, seleccion: this.areaSeleccionada(), miArea: this.miAreaActual(), visible: enMundo });
    this.reacciones.actualizar(tiempo, this.vp, (id) => this.personas.yCabezaDe(id));
    // Sin etiqueta de la mascota al pasar el puntero: caminando no aparece nada solo por pasar el ratón.
    this.mascotas.hoverDueno = null;
    this.mascotas.actualizarEtiqueta(this.vp, oscuro, enMundo && this.esquemaT < 0.4);

    if (estado.modo === 'edicion' && this.sala) this.marcas.actualizar(estado, this.sala, tiempo, this.zoom, this.cursor, this.luz > 0.5);
    else this.marcas.limpiar();
  }

  /** Si hay una calle dibujada afuera (agente del exterior), le avisa que pase a bandas simples mientras se ve el esquema. */
  private avisarExterior(activo: boolean): void {
    this.exterior?.modoEsquema(activo);
  }

  /** Solo la sala principal lleva calle y vecinos. Se reconstruye únicamente si cambia la sala o su tamaño, no en cada edición. */
  private claveExterior = '';
  private sincronizarExterior(sala: SalaMapa | null): void {
    const clave = sala && llevaCalle(sala) ? `${sala.id}:${sala.ancho}x${sala.alto}` : '';
    if (clave === this.claveExterior) return;
    this.claveExterior = clave;
    this.exterior?.destruir();
    this.exterior = null;
    if (!sala || clave === '') return;
    this.exterior = crearExterior(this, sala, { luz: this.puente.almacen.get().luz });
    this.exterior.modoEdicion(this.puente.almacen.get().modo === 'edicion');
    if (this.esquemaVisible) this.exterior.modoEsquema(true);
  }

  private areaSeleccionada(): AreaMundo | null {
    const s = this.seleccion;
    if (s?.tipo !== 'area') return null;
    return this.areas.find((a) => a.id === s.id) ?? null;
  }

  /** Tu escritorio, si estás parado en él. */
  private miAreaActual(): AreaMundo | null {
    const yo = this.puente.vivo.yo;
    if (!yo || this.misAreas.size === 0) return null;
    const [cx, cy] = this.celdaDePies(yo.x, yo.y);
    for (const a of this.areas) if (a.origen === 'area' && this.misAreas.has(a.id) && cx >= a.rect.x && cy >= a.rect.y && cx < a.rect.x + a.rect.w && cy < a.rect.y + a.rect.h) return a;
    return null;
  }

  /** Como Gather: al llegar donde hay gente la cámara se acerca sola, y al alejarte vuelve. Con histéresis para que no parpadee. */
  private actualizarZoomAutomatico(dt: number): void {
    const yo = this.puente.vivo.yo;
    if (yo && this.zoomBase >= 1 && !this.esquemaVisible) {
      let masCerca = Infinity;
      for (const o of this.puente.vivo.otros.values()) {
        if (o.sala !== yo.sala) continue;
        masCerca = Math.min(masCerca, Math.hypot(o.x - yo.x, o.y - yo.y));
      }
      const umbral = this.conGente ? CASILLA * 4 : CASILLA * 2.5;
      this.conGente = masCerca <= umbral;
    } else this.conGente = false;
    const mayor = ZOOMS.find((z) => z > this.zoomBase) ?? this.zoomBase;
    const objetivo = this.conGente ? mayor : this.zoomBase;
    this.zoom = suavizar(this.zoom, objetivo, dt, 4);
  }

  // ---------- lámparas ----------

  private esLampara(o: ObjetoCatalogo): boolean {
    return o.id.startsWith('lampara-');
  }

  /** La lámpara apagada se ve un poco más oscura. */
  private pintarLamparas(): void {
    const s = this.sala;
    if (!s) return;
    for (const c of s.colocaciones) {
      const o = objetoPorId(c.objeto);
      if (!o || !this.esLampara(o)) continue;
      const img = this.vista.imagenDe(c.id);
      if (!img) continue;
      if (this.lamparasApagadas.has(c.id)) img.setTint(0x9a9aa8);
      else img.clearTint();
    }
  }

  /** Prende o apaga una lámpara, solo para quien la toca. */
  private alternarLampara(id: string): void {
    if (this.lamparasApagadas.has(id)) this.lamparasApagadas.delete(id);
    else this.lamparasApagadas.add(id);
    this.luces.apagadas = this.lamparasApagadas;
    try {
      localStorage.setItem('ol_lamparas', JSON.stringify([...this.lamparasApagadas]));
    } catch {
      /* se queda solo en esta sesión */
    }
    this.pintarLamparas();
  }

  // ---------- placas de los puestos ----------

  /** El puesto con nombre al que pertenece un objeto: la silla misma, o el escritorio y lo que hay sobre él, delante de la silla. */
  private puestoDe(c: Colocacion | undefined): { id: string; etiqueta: string; silla: Colocacion } | null {
    const s = this.sala;
    if (!c || !s) return null;
    for (const pu of s.puestos) {
      const silla = s.colocaciones.find((x) => x.id === pu.colocacion);
      if (!silla || !pu.etiqueta) continue;
      if (silla.id === c.id) return { id: pu.id, etiqueta: pu.etiqueta, silla };
      const o = objetoPorId(c.objeto);
      if (!o || (o.categoria !== 'puestos' && !o.apoyado)) continue;
      const h = huellaDe(o, c.orientacion);
      if (silla.x >= c.x && silla.x < c.x + h.ancho && Math.abs(silla.y - c.y) <= 1) return { id: pu.id, etiqueta: pu.etiqueta, silla };
    }
    return null;
  }

  /** Las puertas se abren si hay alguien cerca (tú o los demás) y se cierran cuando ya no. Solo cambia lo visual: se atraviesan igual. */
  private actualizarPuertas(dt: number, enMundo: boolean): void {
    this.puertas.setVisible(enMundo);
    if (!enMundo) return;
    const gente: { x: number; y: number }[] = [];
    const yo = this.puente.vivo.yo;
    if (yo) gente.push({ x: yo.x, y: yo.y });
    for (const o of this.puente.vivo.otros.values()) gente.push({ x: o.x, y: o.y });
    this.puertas.actualizar(dt, gente);
  }

  private actualizarPlacas(tiempo: number, mundo: boolean): void {
    if (!mundo) {
      this.vista.mostrarPlaca(null);
      return;
    }
    const s = this.sala;
    const yo = this.puente.vivo.yo;
    let sentadoPuesto: { id: string; etiqueta: string } | null = null;
    let cercaPuesto: { id: string; etiqueta: string } | null = null;
    if (s && yo) {
      if (this.sentadoEn) {
        const silla = s.colocaciones.find((x) => x.id === this.sentadoEn?.colocacion);
        sentadoPuesto = this.puestoDe(silla);
      }
      if (!sentadoPuesto) {
        for (const pu of s.puestos) {
          const silla = s.colocaciones.find((x) => x.id === pu.colocacion);
          if (!silla || !pu.etiqueta) continue;
          if (Math.hypot(silla.x * CASILLA + 16 - yo.x, silla.y * CASILLA + 24 - yo.y) <= CASILLA * 0.9) cercaPuesto = { id: pu.id, etiqueta: pu.etiqueta };
        }
      }
    }
    if (this.placaToque && tiempo > this.placaToque.hasta) this.placaToque = null;
    this.vista.mostrarPlaca(this.placaHover ?? sentadoPuesto?.id ?? this.placaToque?.id ?? null);
    // Como en Gather: arriba al centro dice de quién es el escritorio donde estás.
    const actual = (sentadoPuesto ?? cercaPuesto)?.etiqueta ?? null;
    if (actual !== this.puestoActual) {
      this.puestoActual = actual;
      this.puente.alPuesto?.(actual);
    }
  }

  // ---------- tu personaje ----------

  private actualizarYo(dt: number, tiempo: number): void {
    const yo = this.puente.vivo.yo;
    const sala = this.sala;
    if (!yo || !sala) return;
    const t = this.teclas;
    let ix = 0;
    let iy = 0;
    if (t && !this.enfoqueEnCampo) {
      if (t.a.isDown || t.izq.isDown) ix -= 1;
      if (t.d.isDown || t.der.isDown) ix += 1;
      if (t.w.isDown || t.arriba.isDown) iy -= 1;
      if (t.s.isDown || t.abajo.isDown) iy += 1;
    }
    const hayTecla = ix !== 0 || iy !== 0;

    // Sentándote o levantándote: un deslizamiento corto, sin teclas ni caminos mientras dura.
    const desliza = this.deslizar;
    if (desliza) {
      desliza.t += dt * 1000;
      const k = Math.min(1, desliza.t / DESLIZAR_MS);
      const e = k * k * (3 - 2 * k);
      yo.x = desliza.x0 + (desliza.x1 - desliza.x0) * e;
      yo.y = desliza.y0 + (desliza.y1 - desliza.y0) * e;
      if (k >= 1) this.deslizar = null;
    }

    let vx = 0;
    let vy = 0;
    let quiereMover = false;
    if (!desliza) {
      if (hayTecla) {
        // Cualquier tecla de movimiento cancela el camino y vuelve a seguirte la cámara.
        this.cancelarRuta();
        this.panLibre = false;
        if (this.sentadoEn) this.levantarse(true);
        const n = Math.hypot(ix, iy);
        vx = ix / n;
        vy = iy / n;
        quiereMover = !this.deslizar;
      } else if (this.ruta.length > 0 && !this.sentadoEn) {
        quiereMover = true;
        this.reajustarRutaAPersona(tiempo);
      }
    }

    this.sincronizarAsientosTomados(yo.x, yo.y);

    // Arranque suave: el paso crece de a poco; al soltar, se detiene al instante (el control se siente directo).
    this.rampa = suavizar(this.rampa, quiereMover ? 1 : 0, dt, quiereMover ? 22 : 40);
    const paso = VELOCIDAD_PX_S * dt * (quiereMover ? Math.max(0.3, this.rampa) : 0);

    let camina = false;
    let termino = false;
    if (!this.sentadoEn && quiereMover) {
      let nx = yo.x;
      let ny = yo.y;
      if (hayTecla) {
        const r = pasoConDeslizamiento(this.cuad, yo.x, yo.y, vx, vy, paso);
        nx = r.x;
        ny = r.y;
        camina = r.movio;
      } else {
        const a = avanzarPorRuta(this.cuad, yo.x, yo.y, this.ruta, paso);
        nx = a.x;
        ny = a.y;
        vx = a.vx;
        vy = a.vy;
        camina = a.movio;
        termino = a.termino;
      }
      yo.x = nx;
      yo.y = ny;
      // Giro inmediato: el personaje mira hacia donde apuntan las flechas aunque la pared no lo deje avanzar (como en Gather).
      if (camina || hayTecla) yo.dir = Math.abs(vx) > Math.abs(vy) + 0.01 ? (vx < 0 ? 'O' : 'E') : vy < 0 ? 'N' : 'S';
      // Un camino que no avanza (alguien se atravesó en un cambio de mapa, por ejemplo) se cancela tras un momento.
      if (!hayTecla && this.ruta.length > 0 && !camina) {
        this.tTrabado += dt * 1000;
        if (this.tTrabado > TRABADO_MS) this.cancelarRuta();
      } else this.tTrabado = 0;
      if (termino) this.alTerminarRuta();
    } else this.tTrabado = 0;

    // Sentarse como en Gather: solo si te detienes con el centro dentro de la casilla de un asiento libre.
    if (!this.sentadoEn) {
      const quieto = !desliza && !hayTecla && this.ruta.length === 0 && !camina;
      const dtMs = dt * 1000;
      const a = this.parada.paso(dtMs, quieto, yo.x, yo.y, this.asientos, (x: Asiento) => this.ocupado(x));
      if (a) this.sentarse(a);
    }

    this.personas.yoCaminando = camina;
    const anim: Animacion = this.sentadoEn ? 'sentado' : camina ? 'caminar' : 'quieto';
    yo.anim = anim;
    yo.vx = yo.x;
    yo.vy = yo.y;

    this.enviarSiCambio(tiempo, yo.x, yo.y, yo.dir, anim);
    this.detectarZona(yo.x, yo.y);
    if (tiempo - this.tCerca > 120) {
      this.tCerca = tiempo;
      this.detectarCerca(yo.x, yo.y);
    }
    // La cámara te sigue de cerca al caminar y más tranquila al parar; si moviste la vista a mano, te deja en paz.
    if (!this.panLibre) {
      const k = 1 - Math.exp(-dt * (camina || this.sentadoEn || this.deslizar ? 14 : 6));
      this.foco.x += (yo.x - this.foco.x) * k;
      this.foco.y += (yo.y - 18 - this.foco.y) * k;
    }
  }

  private enviarSiCambio(t: number, x: number, y: number, dir: Direccion, anim: Animacion): void {
    const u = this.ultimoEnvio;
    const cambio = Math.abs(x - u.x) >= 1 || Math.abs(y - u.y) >= 1 || dir !== u.dir || anim !== u.anim;
    if (!cambio || t - u.t < 100) return;
    this.ultimoEnvio = { t, x, y, dir, anim };
    this.puente.alMover?.(x, y, dir, anim);
  }

  private detectarZona(x: number, y: number): void {
    const s = this.sala;
    if (!s) return;
    const [cx, cy] = this.celdaDePies(x, y);
    const z = zonaEn(s, cx, cy);
    const id = z?.id ?? null;
    if (id !== this.zonaActual) {
      this.zonaActual = id;
      this.atenuacion.fijar(z?.tipo === 'sala' ? z.rect : null);
      this.puente.alCambiarZona?.(z ?? null);
      const tipo = z?.tipo ?? null;
      if (tipo === 'sala' && this.zonaTipo !== 'sala') this.sonar('sala-entra', {});
      else if (tipo !== 'sala' && this.zonaTipo === 'sala') this.sonar('sala-sale', {});
      this.zonaTipo = tipo;
    }
  }

  // ---------- sonido ----------

  /** El material de los pasos según el piso bajo (x, y), que son los pies. */
  private materialEn(x: number, y: number) {
    const [cx, cy] = this.celdaDePies(x, y);
    return materialDePiso(this.sala?.piso[cy]?.[cx]);
  }

  /** Un efecto tuyo (sin distancia). */
  private sonar(e: Efecto, o: OpcionesEfecto): void {
    sonido.reproducir(e, o);
  }

  /** Un efecto de alguien más en (x, y): baja con la distancia (8 casillas), se panea según la cámara y cuenta para el límite de 4 voces. */
  private sonarAjeno(e: Efecto, x: number, y: number, o: OpcionesEfecto): void {
    if (sonido.estado !== 'running') return;
    const cam = this.cameras.main;
    const s = sonidoDeOtro(x, y, this.foco.x, this.foco.y, cam.width / this.zoom / 2);
    if (!s) return;
    if (!this.voces.pedir(performance.now(), DURACION_EFECTO_MS[e])) return;
    sonido.reproducir(e, { ...o, volumen: s.volumen * (o.volumen ?? 1), pan: s.pan });
  }

  /** Distancia de tus pies al borde de la huella de un objeto (0 si estás dentro). */
  private distanciaA(c: Colocacion, o: ObjetoCatalogo, x: number, y: number): number {
    const h = huellaDe(o, c.orientacion);
    const px = Math.max(c.x * CASILLA, Math.min(x, (c.x + h.ancho) * CASILLA));
    const py = Math.max(c.y * CASILLA, Math.min(y - 8, (c.y + h.alto) * CASILLA));
    return Math.hypot(x - px, y - 8 - py);
  }

  /**
   * El objeto con el que puedes hacer algo (el aviso «E»). Gana el más cercano, con una ventaja pequeña para el que tienes
   * al frente, y no cambia de uno a otro por una diferencia mínima: así el aviso no parpadea al pasar entre dos sillas.
   */
  private detectarCerca(x: number, y: number): void {
    const yo = this.puente.vivo.yo;
    const mira = yo ? VECTOR[yo.dir] : ([0, 1] as [number, number]);
    let mejor: { c: Colocacion; o: ObjetoCatalogo } | null = null;
    let mejorD = Infinity;
    let dActual = Infinity;
    for (const it of this.interactivos) {
      let d = this.distanciaA(it.c, it.o, x, y);
      if (d >= CASILLA * 1.25) continue;
      const h = huellaDe(it.o, it.c.orientacion);
      const cx = (it.c.x + h.ancho / 2) * CASILLA - x;
      const cy = (it.c.y + h.alto / 2) * CASILLA - (y - 8);
      const n = Math.hypot(cx, cy) || 1;
      if ((cx / n) * mira[0] + (cy / n) * mira[1] < -0.3) d += 8; // detrás de ti cuesta un poco más
      if (it.c.id === this.cercaActual) dActual = d;
      if (d < mejorD) {
        mejorD = d;
        mejor = it;
      }
    }
    if (mejor && this.cercaActual && mejor.c.id !== this.cercaActual && dActual <= mejorD + 6) mejor = this.interactivos.find((p) => p.c.id === this.cercaActual) ?? mejor;
    const id = mejor?.c.id ?? null;
    if (id !== this.cercaActual) {
      this.cercaActual = id;
      this.puente.alCerca?.(mejor ? { colocacion: mejor.c, objeto: mejor.o } : null);
    }
  }

  private alTeclaInteractuar(): void {
    if (this.puente.almacen.get().modo !== 'mundo' || this.enfoqueEnCampo) return;
    this.panLibre = false;
    const id = this.cercaActual;
    const it = this.interactivos.find((p) => p.c.id === id);
    if (it) this.activar({ colocacion: it.c, objeto: it.o });
  }

  /** Abre la interacción de un objeto (un enlace, una nota, la mesa de Teams...). Sentarse no pasa por aquí: es automático. */
  private activar(i: Interaccion): void {
    this.puente.alInteractuar?.(i);
  }

  private ocupado(a: Asiento): boolean {
    for (const p of this.puente.vivo.otros.values()) {
      if (p.anim !== 'sentado') continue;
      if (Math.floor(p.x / CASILLA) === a.x && Math.floor((p.y - 2) / CASILLA) === a.y) return true;
    }
    return false;
  }

  // ---------- caminos ----------

  /** Empieza a seguir un camino y avisa a la interfaz («¡En camino!» con Cancelar). */
  private iniciarRuta(ruta: Celda[], tipo: TipoRuta, etiqueta: string, pendiente: Pendiente): void {
    this.ruta = ruta;
    this.pendiente = pendiente;
    this.panLibre = false;
    this.tTrabado = 0;
    if (ruta.length === 0) {
      // Ya estás ahí: no hay nada que caminar, solo lo que pasa al llegar (sentarse, abrir).
      this.alTerminarRuta();
      return;
    }
    this.rutaTipo = tipo;
    this.rutaEtiqueta = etiqueta;
    this.rutaActiva = true;
    this.puente.alRuta?.({ activa: true, tipo, ...(etiqueta ? { etiqueta } : {}) });
  }

  /** Marca el camino como terminado (llegaste o se canceló) y avisa una sola vez. */
  private finRuta(): void {
    this.ruta = [];
    this.seguir = null;
    if (!this.rutaActiva) return;
    this.rutaActiva = false;
    this.puente.alRuta?.({ activa: false, tipo: this.rutaTipo, ...(this.rutaEtiqueta ? { etiqueta: this.rutaEtiqueta } : {}) });
  }

  private alTerminarRuta(): void {
    const p = this.pendiente;
    this.pendiente = null;
    this.finRuta();
    if (!p) return;
    if (p.tipo === 'sentarse') {
      if (!this.ocupado(p.asiento)) this.sentarse(p.asiento);
    } else this.puente.alInteractuar?.(p.i);
  }

  /** Para el panel: detiene el camino en curso. */
  cancelarRuta(): void {
    this.pendiente = null;
    this.finRuta();
  }

  /** Camina hasta un punto del mundo (píxeles). Como el doble clic en el piso. */
  irAPunto(x: number, y: number): void {
    const yo = this.puente.vivo.yo;
    const s = this.sala;
    if (!yo || !s || this.puente.almacen.get().modo !== 'mundo') return;
    const ruta = rutaAPunto(this.cuad, celdaDeLosPies(yo.x, yo.y), { x: Math.floor(x / CASILLA), y: Math.floor(y / CASILLA) });
    if (!ruta || ruta.length === 0) return;
    if (this.sentadoEn) this.levantarse(false);
    this.iniciarRuta(ruta, 'punto', '', null);
    const meta = ruta[ruta.length - 1];
    if (meta) this.marcarToque(meta.x, meta.y);
  }

  /** Camina hasta quedar junto a una persona. Si ella se mueve, el camino se corrige. */
  irAPersona(id: number): void {
    const yo = this.puente.vivo.yo;
    const s = this.sala;
    const o = this.puente.vivo.otros.get(id);
    if (!yo || !s || !o || this.puente.almacen.get().modo !== 'mundo') return;
    const objetivo = celdaDeLosPies(o.x, o.y);
    const ruta = rutaAlLado(this.cuad, celdaDeLosPies(yo.x, yo.y), objetivo);
    if (!ruta || ruta.length === 0) return;
    if (this.sentadoEn) this.levantarse(false);
    this.iniciarRuta(ruta, 'persona', o.apodo || o.nombre, null);
    this.seguir = { id, celda: objetivo, t: this.tAhora };
  }

  /** Mientras vas hacia alguien que se mueve, cada poco se vuelve a calcular el camino. */
  private reajustarRutaAPersona(tiempo: number): void {
    const sg = this.seguir;
    const yo = this.puente.vivo.yo;
    const s = this.sala;
    if (!sg || !yo || !s || tiempo - sg.t < 450) return;
    const o = this.puente.vivo.otros.get(sg.id);
    if (!o) {
      this.cancelarRuta();
      return;
    }
    sg.t = tiempo;
    const c = celdaDeLosPies(o.x, o.y);
    if (Math.max(Math.abs(c.x - sg.celda.x), Math.abs(c.y - sg.celda.y)) < 2) return;
    const ruta = rutaAlLado(this.cuad, celdaDeLosPies(yo.x, yo.y), c);
    if (!ruta) return;
    sg.celda = c;
    if (ruta.length === 0) {
      this.cancelarRuta();
      return;
    }
    this.ruta = ruta;
  }

  /** Camina hasta tu escritorio y se sienta. Sin puesto, va al escritorio libre más cercano a donde llegaste. */
  irAMiEscritorio(): void {
    const yo = this.puente.vivo.yo;
    const s = this.sala;
    if (!yo || !s || this.puente.almacen.get().modo !== 'mundo') return;
    const h = buscarMiEscritorio(s, { id: yo.id, nombre: yo.nombre, apodo: yo.apodo }, this.llegada ?? { x: yo.x, y: yo.y }, (a) => this.ocupado(a));
    if (!h) return;
    const a = h.asiento;
    if (this.sentadoEn && this.sentadoEn.x === a.x && this.sentadoEn.y === a.y) return;
    if (this.sentadoEn) this.levantarse(false);
    this.pedirSentarse(a, 'escritorio', h.etiqueta);
  }

  /** Camina hasta una zona o un área de la sala. */
  irAArea(id: string): void {
    const yo = this.puente.vivo.yo;
    const s = this.sala;
    const a = this.areas.find((x) => x.id === id);
    if (!yo || !s || !a || this.puente.almacen.get().modo !== 'mundo') return;
    // En una zona de coworking camina hasta el asiento libre más cercano y se sienta (como en Gather).
    if (a.claseId === 'coworking') {
      const dentro = (x: Asiento) => x.x >= a.rect.x && x.y >= a.rect.y && x.x < a.rect.x + a.rect.w && x.y < a.rect.y + a.rect.h;
      const libres = this.asientos.filter((x) => dentro(x) && !this.ocupado(x)).sort((p, q) => Math.hypot(p.x * CASILLA - yo.x, p.y * CASILLA - yo.y) - Math.hypot(q.x * CASILLA - yo.x, q.y * CASILLA - yo.y));
      for (const asiento of libres) {
        const plan = rutaAAsiento(this.cuad, celdaDeLosPies(yo.x, yo.y), asiento);
        if (!plan) continue;
        if (this.sentadoEn) this.levantarse(false);
        this.iniciarRuta(plan.ruta, 'punto', a.nombre, plan.llegaSentado ? { tipo: 'sentarse', asiento } : null);
        return;
      }
    }
    const ruta = rutaAArea(s, this.cuad, celdaDeLosPies(yo.x, yo.y), a.rect);
    if (!ruta || ruta.length === 0) return;
    if (this.sentadoEn) this.levantarse(false);
    this.iniciarRuta(ruta, 'punto', a.nombre, null);
  }

  /** Elige una zona o un área por su id: abre su tarjeta y centra la cámara en ella. */
  seleccionarArea(id: string): void {
    const a = this.areas.find((x) => x.id === id);
    if (!a || this.puente.almacen.get().modo !== 'mundo') return;
    this.seleccionar({ tipo: 'area', id: a.id, nombre: a.nombre, clase: a.clase, claseId: a.claseId });
    this.foco = { x: (a.rect.x + a.rect.w / 2) * CASILLA, y: (a.rect.y + a.rect.h / 2) * CASILLA };
    this.panLibre = true;
  }

  /** Tu personaje en la pantalla del mundo, para la burbuja que te señala cuando quedas fuera del cuadro. */
  miPuntoEnPantalla(): { x: number; y: number; ancho: number; alto: number } | null {
    const yo = this.puente.vivo.yo;
    const vp = this.vp;
    if (!yo || !vp) return null;
    const p = aPantalla(vp, yo.x, yo.y - 16);
    return { x: p.x, y: p.y, ancho: vp.ancho, alto: vp.alto };
  }

  /** Va hasta una casilla pegada al asiento y se sienta al llegar. */
  private pedirSentarse(a: Asiento, tipo: TipoRuta, etiqueta: string): void {
    const yo = this.puente.vivo.yo;
    const s = this.sala;
    if (!yo || !s) return;
    const plan = rutaAAsiento(this.cuad, celdaDeLosPies(yo.x, yo.y), a);
    if (!plan) return;
    this.iniciarRuta(plan.ruta, tipo, etiqueta, plan.llegaSentado ? { tipo: 'sentarse', asiento: a } : null);
  }

  private sentarse(a: Asiento): void {
    const yo = this.puente.vivo.yo;
    if (!yo) return;
    // Los pies de quien se sienta quedan donde dicen los datos de sentado del asiento (`shared/src/sentado.ts`): el respaldo, el borde del
    // cojín o los apoyabrazos se vuelven a dibujar por delante (ver `CapaPersonas`).
    const d = this.datosAsiento.get(a.y * (this.sala?.ancho ?? 1) + a.x);
    const pies = piesSentado(a, d ?? { dx: 0, dy: 2 }, CASILLA);
    this.deslizar = { x0: yo.x, y0: yo.y, x1: pies.x, y1: pies.y, t: 0 };
    yo.dir = a.mira;
    yo.anim = 'sentado';
    this.sentadoEn = a;
    this.parada.reiniciar();
    this.panLibre = false;
    this.cancelarRuta();
    this.ultimoEnvio.t = 0;
    this.puente.alSentarse?.(true);
  }

  /**
   * Te levantas en el centro de la casilla del asiento (ya no hay lado de salida: el asiento no bloquea). Con una flecha apretada
   * sigues caminando en ese mismo cuadro, sin deslizamiento ni espera; sin flecha (botón, clic fuera) hay un deslizamiento corto.
   */
  private levantarse(conTecla: boolean): void {
    const yo = this.puente.vivo.yo;
    const a = this.sentadoEn;
    if (!yo || !a) return;
    const c = this.centroPies(a.x, a.y);
    this.sentadoEn = null;
    this.parada.ignorarHasta(a);
    if (conTecla) {
      yo.x = yo.vx = c.x;
      yo.y = yo.vy = c.y;
    } else this.deslizar = { x0: yo.x, y0: yo.y, x1: c.x, y1: c.y, t: 0 };
    yo.anim = 'quieto';
    this.ultimoEnvio.t = 0;
    this.puente.alSentarse?.(false);
  }

  /** Los asientos con alguien sentado bloquean el paso (no se cruzan ni se comparten); los libres no. Se actualiza cada cuadro. */
  private sincronizarAsientosTomados(x: number, y: number): void {
    const s = this.sala;
    if (!s || this.bloqueoBase.length === 0) return;
    for (const k of this.asientosTomados) this.cuad.bloqueo[k] = this.bloqueoBase[k] ?? 0;
    this.asientosTomados = [];
    const mio = Math.floor(x / CASILLA) + Math.floor((y - 3) / CASILLA) * s.ancho;
    for (const a of this.asientos) {
      const k = a.y * s.ancho + a.x;
      if (k === mio || this.bloqueoBase[k] || !this.ocupado(a)) continue;
      this.cuad.bloqueo[k] = 1;
      this.asientosTomados.push(k);
    }
  }

  private ocupadoPor(cx: number, cy: number): boolean {
    for (const p of this.puente.vivo.otros.values()) if (Math.floor(p.x / CASILLA) === cx && Math.floor((p.y - 4) / CASILLA) === cy) return true;
    return false;
  }

  /** Para el panel de la interfaz: levantarse sin teclado (por ejemplo, con un botón). */
  levantarseAhora(): void {
    if (this.sentadoEn) this.levantarse(false);
  }

  get estaSentado(): boolean {
    return this.sentadoEn !== null;
  }

  /** Para el panel: sentarse o usar el objeto que tienes cerca. */
  usarCercano(): void {
    this.alTeclaInteractuar();
  }

  // ---------- órdenes de la interfaz ----------

  /** Una reacción con emoji: sube sobre tu personaje y se manda a los demás. */
  reaccionar(emoji: string): void {
    const yo = this.puente.vivo.yo;
    if (!yo || !emoji) return;
    this.reacciones.mostrar(yo.id, emoji, this.tAhora);
    this.sonar('reaccion', {});
    this.puente.alReaccion?.(emoji);
  }

  centrarEnMi(): void {
    this.irAMi();
  }

  deseleccionar(): void {
    this.seleccionar(null);
  }

  /** «Enviar cerca»: un mensaje a quienes están dentro de tu radio. */
  enviarCerca(texto: string): void {
    this.puente.red?.chat(texto);
  }

  cambiarEstado(c: { estado?: EstadoPresencia; lugar?: Lugar; invisible?: boolean }): void {
    if (this.puente.red) this.puente.red.cambiarEstado(c);
    else {
      // Sin conexión, al menos se ve en tu pantalla.
      const yo = this.puente.vivo.yo;
      if (yo) this.puente.vivo.estado(yo.id, c.estado ?? yo.estado, c.lugar ?? yo.lugar);
    }
  }

  /** En «eficiente» el motor baja a 30 cuadros por segundo; en los otros modos, 60. */
  fijarRendimiento(modo: ModoRendimiento): void {
    this.game.loop.targetFps = modo === 'eficiente' ? 30 : 60;
  }

  // ---------- puntero ----------

  private elegirObjeto(px: number, py: number, soloInteractivos: boolean): { c: Colocacion; o: ObjetoCatalogo } | null {
    const s = this.sala;
    if (!s) return null;
    let mejor: { c: Colocacion; o: ObjetoCatalogo; p: number } | null = null;
    for (const c of s.colocaciones) {
      const o = objetoPorId(c.objeto);
      if (!o || (soloInteractivos && (o.interaccion === 'ninguna' || o.interaccion === 'puerta'))) continue;
      const img = this.vista.imagenDe(c.id);
      if (!img) continue;
      // Las imágenes tienen origen abajo a la izquierda y no se escalan: el rectángulo sale sin crear objetos nuevos en cada llamada.
      const bx = img.x;
      const by = img.y - img.displayHeight;
      if (px < bx || py < by || px >= bx + img.displayWidth || py >= img.y) continue;
      const lx = Math.floor(px - bx);
      const ly = Math.floor(py - by);
      const alfa = img.texture.manager.getPixelAlpha(lx, ly, img.texture.key, img.frame.name);
      if (alfa < 20) continue;
      const p = this.profPorColocacion.get(c.id) ?? 0;
      if (!mejor || p > mejor.p) mejor = { c, o, p };
    }
    return mejor ? { c: mejor.c, o: mejor.o } : null;
  }

  /** La persona que se ve bajo el puntero (la de más al frente). Con el esquema a la vista, su círculo. */
  private personaBajo(px: number, py: number): PersonaVista | null {
    const v = this.puente.vivo;
    const todos: PersonaVista[] = v.yo ? [v.yo, ...v.otros.values()] : [...v.otros.values()];
    const esquema = this.esquemaT > 0.5;
    const r = radioCirculo(this.zoom);
    let mejor: PersonaVista | null = null;
    for (const p of todos) {
      const dentro = esquema ? Math.hypot(px - p.vx, py - (p.vy - 12)) <= r : Math.abs(px - p.vx) <= 11 && py >= p.vy - 36 && py <= p.vy + 2;
      if (dentro && (!mejor || p.vy > mejor.vy)) mejor = p;
    }
    return mejor;
  }

  private setCursor(c: string): void {
    if (c === this.cursorActual) return;
    this.cursorActual = c;
    const lienzo = this.game?.canvas;
    if (lienzo) lienzo.style.cursor = c;
  }

  private alPuntero(tipo: EventoPuntero['tipo'], ptr: Phaser.Input.Pointer): void {
    const estado = this.puente.almacen.get();
    const ev = ptr.event as MouseEvent | PointerEvent | undefined;
    const sobreLienzo = !ev || (ev.target as HTMLElement | null) === this.game.canvas;
    if (tipo !== 'arriba' && !sobreLienzo) {
      if (tipo === 'mover') {
        this.cursor = null;
        this.punteroPantalla = null;
        this.hoverPend = null;
        this.placaHover = null;
        this.setCursor('');
        this.avisarHover(null, 0, 0);
      }
      return;
    }
    const px = ptr.worldX;
    const py = ptr.worldY;
    const cx = Math.floor(px / CASILLA);
    const cy = Math.floor(py / CASILLA);
    this.cursor = { x: cx, y: cy };
    const mods = ev as { shiftKey?: boolean; ctrlKey?: boolean; metaKey?: boolean; altKey?: boolean } | undefined;

    if (estado.modo === 'edicion') {
      const mover = ptr.button === 1 || this.teclas?.espacio?.isDown || estado.herramienta === 'mano';
      if (mover && (tipo === 'abajo' || this.arrastrePan)) {
        if (tipo === 'abajo') this.arrastrePan = { x: ptr.x, y: ptr.y };
        else if (tipo === 'mover' && this.arrastrePan) {
          this.foco.x -= (ptr.x - this.arrastrePan.x) / this.zoom;
          this.foco.y -= (ptr.y - this.arrastrePan.y) / this.zoom;
          this.arrastrePan = { x: ptr.x, y: ptr.y };
        } else this.arrastrePan = null;
        return;
      }
      if (tipo === 'arriba') this.arrastrePan = null;
      const bajo = tipo === 'arriba' ? null : (this.elegirObjeto(px, py, false)?.c.id ?? null);
      this.puente.puntero?.({ tipo, x: cx, y: cy, px, py, boton: ptr.button, shift: Boolean(mods?.shiftKey), ctrl: Boolean(mods?.ctrlKey || mods?.metaKey), alt: Boolean(mods?.altKey), bajo });
      return;
    }

    // Modo mundo: señalar; con el botón presionado y movimiento, arrastrar la vista; al soltar sin arrastrar, clic o doble clic.
    if (tipo === 'mover') {
      const p = this.presion;
      if (p) {
        if (!p.arrastrando && Math.hypot(ptr.x - p.x, ptr.y - p.y) >= UMBRAL_ARRASTRE_PX) {
          p.arrastrando = true;
          this.hoverPend = null;
          this.avisarHover(null, 0, 0);
          this.setCursor('grabbing');
        }
        if (p.arrastrando) {
          // Se toma el mapa: lo que está bajo el puntero se va con él. Incremental, para que el borde del mundo no acumule desfase.
          this.foco.x -= (ptr.x - p.ux) / this.zoom;
          this.foco.y -= (ptr.y - p.uy) / this.zoom;
          p.ux = ptr.x;
          p.uy = ptr.y;
          this.panLibre = true;
        }
        return;
      }
      this.punteroPantalla = { sx: ptr.x, sy: ptr.y };
      this.hoverPend = { px, py, sx: ptr.x, sy: ptr.y };
      return;
    }
    if (tipo === 'abajo') {
      if (ptr.button === 0) this.presion = { x: ptr.x, y: ptr.y, ux: ptr.x, uy: ptr.y, arrastrando: false };
      return;
    }
    const presion = this.presion;
    this.presion = null;
    if (!presion || ptr.button !== 0) return;
    if (presion.arrastrando) {
      this.setCursor('');
      return;
    }
    const toque = this.puestoDe(this.elegirObjeto(px, py, false)?.c);
    if (toque) this.placaToque = { id: toque.id, hasta: this.time.now + 3500 };
    const ahora = this.time.now;
    const previo = this.ultimoClic;
    const doble = previo !== null && ahora - previo.t < DOBLE_CLIC_MS && Math.hypot(ptr.x - previo.x, ptr.y - previo.y) < DOBLE_CLIC_PX;
    this.ultimoClic = doble ? null : { t: ahora, x: ptr.x, y: ptr.y };
    if (doble) this.dobleClic(px, py);
    else this.clic(px, py);
  }

  /** El hover (pista de sala, placa del puesto, cursor) se calcula una vez por cuadro con el último movimiento del puntero. */
  private procesarHover(): void {
    let h = this.hoverPend;
    this.hoverPend = null;
    const v = this.vp;
    const cambioVista = v.sx0 !== this.vistaHover.sx0 || v.sy0 !== this.vistaHover.sy0 || v.zoom !== this.vistaHover.zoom;
    this.vistaHover = { sx0: v.sx0, sy0: v.sy0, zoom: v.zoom };
    // La cámara se movió con el puntero quieto: lo que hay debajo cambió, así que se vuelve a mirar.
    if (!h && cambioVista && this.punteroPantalla && !this.presion) {
      const m = aMundo(v, this.punteroPantalla.sx, this.punteroPantalla.sy);
      h = { px: m.x, py: m.y, sx: this.punteroPantalla.sx, sy: this.punteroPantalla.sy };
    }
    if (!h || this.presion) return;
    // Caminando no hay efectos al pasar el puntero (sin contorno, pista, placa de escritorio ni etiqueta de mascota): solo el cursor de mano
    // sobre lo interactivo. Los resaltados son de la vista de edición (`marcas.ts`).
    const persona = this.personaBajo(h.px, h.py);
    this.setCursor(persona || this.elegirObjeto(h.px, h.py, true) ? 'pointer' : '');
  }

  /** Dice a la interfaz qué sala o área hay bajo el puntero. Solo avisa si cambió el área o el puntero se movió. */
  private avisarHover(a: AreaMundo | null, sx: number, sy: number): void {
    const cambioArea = a?.id !== this.hover?.id;
    const seMovio = Math.abs(sx - this.hoverPos.x) >= 2 || Math.abs(sy - this.hoverPos.y) >= 2;
    this.hover = a;
    if (!cambioArea && !(a && seMovio)) return;
    this.hoverPos = { x: sx, y: sy };
    this.puente.alAreaHover?.(a ? { id: a.id, nombre: a.nombre, clase: a.clase, claseId: a.claseId } : null, sx, sy);
  }

  private seleccionar(s: Seleccion): void {
    const igual = (a: Seleccion, b: Seleccion) => (a === null || b === null ? a === b : a.tipo === b.tipo && a.id === b.id);
    if (igual(s, this.seleccion)) return;
    this.seleccion = s;
    this.puente.alSeleccion?.(s);
  }

  /** Un clic: elige una persona, usa un objeto interactivo o elige la sala o el área donde hiciste clic. El vacío limpia la elección. */
  private clic(px: number, py: number): void {
    const s = this.sala;
    if (!s) return;
    const persona = this.personaBajo(px, py);
    if (persona) {
      this.seleccionar({ tipo: 'persona', id: persona.id });
      return;
    }
    const hit = this.elegirObjeto(px, py, true);
    if (hit) {
      this.seleccionar(null);
      this.tocarObjeto(hit, px, py);
      return;
    }
    const a = areaBajo(this.areas, px / CASILLA, py / CASILLA);
    this.seleccionar(a ? { tipo: 'area', id: a.id, nombre: a.nombre, clase: a.clase, claseId: a.claseId } : null);
  }

  /** Doble clic: caminar hasta ahí. En una persona, ir hacia ella; en un asiento o un escritorio, caminar y sentarse. */
  private dobleClic(px: number, py: number): void {
    const s = this.sala;
    const yo = this.puente.vivo.yo;
    if (!s || !yo) return;
    const persona = this.personaBajo(px, py);
    if (persona) {
      if (persona.id !== yo.id) this.irAPersona(persona.id);
      return;
    }
    const hit = this.elegirObjeto(px, py, true);
    if (hit) {
      // El primer clic ya hizo lo suyo (prender la lámpara, abrir el objeto): el segundo no lo deshace.
      if (!this.esLampara(hit.o)) this.tocarObjeto(hit, px, py);
      return;
    }
    const cx = Math.floor(px / CASILLA);
    const cy = Math.floor(py / CASILLA);
    // Un asiento libre, o el escritorio de una silla libre: caminar y sentarse.
    const asiento = this.asientos.find((a) => a.x === cx && a.y === cy && !this.ocupado(a));
    const escritorio = asiento ? null : escritorioEnCasilla(s, cx, cy);
    const silla = asiento ?? (escritorio ? sillaDeEscritorio(s, escritorio, (a) => this.ocupado(a)) : null);
    if (silla) {
      if (this.sentadoEn) this.levantarse(false);
      this.pedirSentarse(silla, 'punto', '');
      return;
    }
    this.irAPunto(px, py);
  }

  /** Un objeto con acción: la lámpara se prende o se apaga, el asiento se usa y lo demás se abre (caminando hasta él si hace falta). */
  private tocarObjeto(hit: { c: Colocacion; o: ObjetoCatalogo }, px: number, py: number): void {
    const yo = this.puente.vivo.yo;
    const s = this.sala;
    if (!yo || !s) return;
    if (this.esLampara(hit.o)) {
      this.alternarLampara(hit.c.id);
      return;
    }
    const i: Interaccion = { colocacion: hit.c, objeto: hit.o };
    if (hit.o.interaccion === 'sentarse') {
      const candidatos = this.asientos.filter((a) => a.colocacion === hit.c.id && !this.ocupado(a));
      const cx = Math.floor(px / CASILLA);
      const cy = Math.floor(py / CASILLA);
      candidatos.sort((a, b) => Math.hypot(a.x - cx, a.y - cy) - Math.hypot(b.x - cx, b.y - cy));
      const a = candidatos[0];
      if (a) {
        if (this.sentadoEn) this.levantarse(false);
        this.pedirSentarse(a, 'punto', '');
      }
      return;
    }
    // Objeto con acción: si estás cerca, se abre; si no, caminas hasta él y se abre al llegar.
    if (this.distanciaA(hit.c, hit.o, yo.x, yo.y) <= CASILLA * 1.5) {
      this.puente.alInteractuar?.(i);
      return;
    }
    const ruta = rutaAPunto(this.cuad, celdaDeLosPies(yo.x, yo.y), { x: Math.floor(px / CASILLA), y: Math.floor(py / CASILLA) });
    if (ruta) {
      if (this.sentadoEn) this.levantarse(false);
      this.iniciarRuta(ruta, 'punto', '', { tipo: 'interactuar', i });
    }
  }

  private marcarToque(cx: number, cy: number): void {
    const c = this.centroPies(cx, cy);
    const aro = this.add.circle(c.x, c.y - 4, 5, 0xffffff, 0).setStrokeStyle(2, 0x5b4bdb, 1).setDepth(900_100);
    this.tweens.add({ targets: aro, scale: 3, alpha: 0, duration: 520, ease: 'Cubic.easeOut', onComplete: () => aro.destroy() });
  }

  private alRueda(ptr: Phaser.Input.Pointer, dx: number, dy: number): void {
    const ev = ptr.event as WheelEvent | undefined;
    if (ev && (ev.target as HTMLElement | null) !== this.game.canvas) return;
    if (this.puente.almacen.get().modo === 'mundo') {
      // Al caminar la rueda no hace zoom (es automático): el trackpad de dos dedos, o la rueda, mueven la vista.
      if (ev?.ctrlKey) return; // el pellizco del trackpad llega como rueda con Ctrl: no hace nada
      const factor = ev?.deltaMode === 1 ? 16 : 1;
      this.foco.x += (dx * factor) / this.zoom;
      this.foco.y += (dy * factor) / this.zoom;
      this.panLibre = true;
      return;
    }
    // Al construir sí hay zoom con la rueda.
    const ahora = performance.now();
    if (ahora - this.tRueda < 140) return;
    this.tRueda = ahora;
    this.cambiarZoom(dy < 0 ? 1 : -1, ptr);
  }

  /** Un paso de zoom. En edición mantiene fijo el punto bajo el puntero. */
  private cambiarZoom(paso: 1 | -1, ptr?: Phaser.Input.Pointer): void {
    const e = this.puente.almacen.get();
    const siguiente = pasoDeZoom(e.zoom, paso, e.zoomMin);
    if (siguiente === e.zoom) return;
    if (ptr && e.modo === 'edicion') {
      const cam = this.cameras.main;
      const ox = ptr.x - cam.width / 2;
      const oy = ptr.y - cam.height / 2;
      this.foco.x = ptr.worldX - ox / siguiente;
      this.foco.y = ptr.worldY - oy / siguiente;
    }
    this.puente.almacen.set({ zoom: siguiente });
  }

  // ---------- cámara ----------

  private moverCamaraConTeclas(dt: number): void {
    const t = this.teclas;
    if (!t || this.enfoqueEnCampo) return;
    let ix = 0;
    let iy = 0;
    const flechas = this.puente.almacen.get().seleccion.length === 0;
    if (t.a.isDown || (flechas && t.izq.isDown)) ix -= 1;
    if (t.d.isDown || (flechas && t.der.isDown)) ix += 1;
    if (t.w.isDown || (flechas && t.arriba.isDown)) iy -= 1;
    if (t.s.isDown || (flechas && t.abajo.isDown)) iy += 1;
    if (ix === 0 && iy === 0) return;
    const v = (520 * dt) / this.zoom;
    this.foco.x += ix * v;
    this.foco.y += iy * v;
  }

  private aplicarCamara(_dt: number, _forzar: boolean): void {
    const s = this.sala;
    const cam = this.cameras.main;
    if (!s) return;
    const W = s.ancho * CASILLA;
    const H = s.alto * CASILLA;
    const m = Math.max(MARGEN_CASILLAS * CASILLA, this.exterior?.margenCamara ?? 0);
    const vw = cam.width / this.zoom;
    const vh = cam.height / this.zoom;
    const eje = (f: number, tam: number, vista: number): number => (tam + 2 * m <= vista ? tam / 2 : Math.max(-m + vista / 2, Math.min(tam + m - vista / 2, f)));
    this.foco.x = eje(this.foco.x, W, vw);
    this.foco.y = eje(this.foco.y, H, vh);
    cam.setZoom(this.zoom);
    cam.centerOn(Math.round(this.foco.x * this.zoom) / this.zoom, Math.round(this.foco.y * this.zoom) / this.zoom);
  }

  /** Centra la cámara sobre tu personaje (botón «Ir a mí»). */
  irAMi(): void {
    const yo = this.puente.vivo.yo;
    this.panLibre = false;
    if (yo) this.foco = { x: yo.x, y: yo.y - 16 };
  }
}
