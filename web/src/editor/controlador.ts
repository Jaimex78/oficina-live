import {
  alternarLlegada,
  actualizarArea,
  actualizarZona,
  cambiarProps,
  cambiarVariante,
  cambioSoloDentroDelArea,
  celdasDe,
  celdasLinea,
  celdasRectangulo,
  colocar,
  crearArea,
  crearZona,
  dentro,
  esFallo,
  evaluarColocacion,
  soporteDe,
  arreglarSilla,
  reubicarApoyado,
  sillasAlrededor,
  sillasDeMesa,
  esMesaParaSillas,
  type OpcionesSillas,
  type Problema,
  girarColocacion,
  hayErrores,
  huellaColocada,
  huellaDe,
  huellaDentroDe,
  indiceDe,
  objetoPorId,
  orientacionInicial,
  pintarPiso,
  profundidades,
  quitar,
  quitarArea,
  quitarZona,
  regionDePiso,
  reubicar,
  salaVacia,
  siguienteOrientacion,
  validarMapa,
  type AreaPersonal,
  type Colocacion,
  type MapaOficina,
  type ObjetoCatalogo,
  type Orientacion,
  type SalaMapa,
  type TipoZona,
  type Zona,
} from '@ol/shared';
import type { Almacen } from '../mundo/almacen';
import type { EventoPuntero } from '../mundo/puente';
import type { AjusteHabitacion, ElementoSeleccion, EstadoMundo, Fantasma, Herramienta, ModoPiso, Pincel, VistaPrevia } from '../mundo/tipos';

export interface OpcionesControlador {
  almacen: Almacen<EstadoMundo>;
  mapa: MapaOficina;
  /**
   * Si se da, la persona solo edita esta área: el controlador rechaza cualquier cambio que toque otra cosa. El servidor
   * vuelve a comprobarlo al guardar; esto solo evita que alguien trabaje en algo que no se le va a guardar.
   */
  area?: { sala: string; area: AreaPersonal };
  /** Se llama cada vez que el mapa cambia: ahí se programa el guardado del borrador. */
  alCambiar?: (mapa: MapaOficina) => void;
  /** Mensajes cortos: por qué algo no cabe, qué se hizo. */
  aviso?: (texto: string, tipo: 'info' | 'error') => void;
  /** Espera antes de volver a revisar el mapa (milisegundos). */
  esperaRevision?: number;
}

type Arrastre =
  | { tipo: 'colocar' }
  | { tipo: 'linea'; desde: { x: number; y: number } }
  | { tipo: 'piso'; desde: { x: number; y: number }; ultima: { x: number; y: number } }
  | { tipo: 'borrar' }
  | { tipo: 'mover'; origen: { x: number; y: number }; ids: string[]; movido: boolean }
  | { tipo: 'marquesina'; origen: { px: number; py: number }; sumar: boolean }
  | { tipo: 'zona'; desde: { x: number; y: number } }
  | { tipo: 'habitacion'; desde: { x: number; y: number } }
  | { tipo: 'area'; desde: { x: number; y: number } }
  | { tipo: 'llegada' };

const LIMITE_HISTORIAL = 200;

const reemplazarSala = (mapa: MapaOficina, sala: SalaMapa): MapaOficina => ({ ...mapa, salas: mapa.salas.map((s) => (s.id === sala.id ? sala : s)) });

/** Casilla de la esquina superior izquierda para que el puntero quede en el centro de la huella (a la izquierda o arriba si es par). */
export function anclar(ancho: number, alto: number, cx: number, cy: number): { x: number; y: number } {
  return { x: cx - Math.floor((ancho - 1) / 2), y: cy - Math.floor((alto - 1) / 2) };
}

const cacheProf = new WeakMap<SalaMapa, number[]>();
function profDe(sala: SalaMapa): number[] {
  let p = cacheProf.get(sala);
  if (!p) {
    p = profundidades(sala);
    cacheProf.set(sala, p);
  }
  return p;
}

/** La colocación de más al frente cuya huella cubre la casilla. */
export function colocacionEn(sala: SalaMapa, cx: number, cy: number): Colocacion | null {
  const prof = profDe(sala);
  let mejor: { c: Colocacion; p: number } | null = null;
  sala.colocaciones.forEach((c, i) => {
    const o = objetoPorId(c.objeto);
    if (!o) return;
    const h = huellaColocada(o, c.x, c.y, c.orientacion);
    if (cx < h.x || cy < h.y || cx >= h.x + h.ancho || cy >= h.y + h.alto) return;
    const p = prof[i] ?? 0;
    if (!mejor || p > mejor.p) mejor = { c, p };
  });
  return mejor ? (mejor as { c: Colocacion }).c : null;
}

/** Orientación que le toca a una abertura o a algo colgado según las paredes que tiene al lado. */
export function orientacionAutomatica(sala: SalaMapa, o: ObjetoCatalogo, cx: number, cy: number, actual: Orientacion): Orientacion {
  if (!o.pared && !o.montado) return actual;
  const ix = indiceDe(sala);
  const pared = (x: number, y: number) => dentro(sala, x, y) && ix.pared[y * sala.ancho + x]! >= 0;
  const horizontal = pared(cx - 1, cy) || pared(cx + 1, cy);
  const vertical = pared(cx, cy - 1) || pared(cx, cy + 1);
  let r: Orientacion = actual;
  if (horizontal && !vertical) r = 'S';
  else if (vertical && !horizontal) {
    const pisoEste = dentro(sala, cx + 1, cy) && ix.hayPiso[cy * sala.ancho + cx + 1] === 1 && !pared(cx + 1, cy);
    r = pisoEste ? 'E' : 'O';
  }
  return o.orientaciones.includes(r) ? r : o.orientaciones.includes('S') && (r === 'O' || r === 'E') ? (o.orientaciones.includes('E') ? 'E' : 'S') : actual;
}

export class ControladorEditor {
  private mapa: MapaOficina;
  private salaId: string;
  private pasado: MapaOficina[] = [];
  private futuro: MapaOficina[] = [];
  private gesto: { base: MapaOficina } | null = null;
  private arrastre: Arrastre | null = null;
  private orientacionManual = false;
  private temporizador: ReturnType<typeof setTimeout> | null = null;
  private contadorZona = 1;

  constructor(private readonly o: OpcionesControlador) {
    this.mapa = o.mapa;
    this.salaId = o.area?.sala ?? o.mapa.salaInicial;
    this.contadorZona = o.mapa.salas.reduce((n, s) => n + s.zonas.length, 0) + 1;
    this.publicar(true);
  }

  // ---------- estado ----------

  get almacen(): Almacen<EstadoMundo> {
    return this.o.almacen;
  }
  get estado(): EstadoMundo {
    return this.o.almacen.get();
  }
  get mapaActual(): MapaOficina {
    return this.mapa;
  }
  get sala(): SalaMapa {
    return this.mapa.salas.find((s) => s.id === this.salaId) ?? (this.mapa.salas[0] as SalaMapa);
  }

  private aviso(texto: string, tipo: 'info' | 'error' = 'info'): void {
    this.o.aviso?.(texto, tipo);
  }

  /** Reemplaza el mapa completo (por ejemplo al restaurar una versión). Limpia el historial. */
  cargarMapa(mapa: MapaOficina): void {
    this.mapa = mapa;
    this.salaId = mapa.salas.some((s) => s.id === this.salaId) ? this.salaId : mapa.salaInicial;
    this.pasado = [];
    this.futuro = [];
    this.gesto = null;
    this.arrastre = null;
    this.o.almacen.set({ seleccion: [], fantasma: null, vistaPrevia: null, marquesina: null, zonaEnCurso: null });
    this.publicar(true);
  }

  private publicar(sinAvisar = false): void {
    const sala = this.sala;
    const seleccion = this.estado.seleccion.filter((s) => {
      if (s.tipo === 'colocacion') return sala.colocaciones.some((c) => c.id === s.id);
      if (s.tipo === 'zona') return sala.zonas.some((z) => z.id === s.id);
      return sala.llegadas.some((l) => l.x === s.x && l.y === s.y);
    });
    this.o.almacen.set({
      sala,
      seleccion: seleccion.length === this.estado.seleccion.length ? this.estado.seleccion : seleccion,
      puedeDeshacer: this.pasado.length > 0,
      puedeRehacer: this.futuro.length > 0,
    });
    this.programarRevision();
    if (!sinAvisar) this.o.alCambiar?.(this.mapa);
  }

  private programarRevision(): void {
    if (this.temporizador) clearTimeout(this.temporizador);
    this.temporizador = setTimeout(() => this.revisar(), this.o.esperaRevision ?? 250);
  }

  /** Vuelve a revisar el mapa y deja los problemas en el estado. */
  revisar(): void {
    this.temporizador = null;
    const problemas = validarMapa(this.mapa);
    this.o.almacen.set({ problemas });
  }

  get hayErrores(): boolean {
    return hayErrores(validarMapa(this.mapa));
  }

  destruir(): void {
    if (this.temporizador) clearTimeout(this.temporizador);
    this.temporizador = null;
  }

  // ---------- historial ----------

  private aplicarSala(sala: SalaMapa): boolean {
    if (sala === this.sala) return false;
    const limite = this.o.area;
    if (limite) {
      const motivo = cambioSoloDentroDelArea(this.sala, sala, limite.area);
      if (motivo) {
        this.aviso(motivo, 'error');
        return false;
      }
    }
    if (!this.gesto) {
      this.pasado.push(this.mapa);
      if (this.pasado.length > LIMITE_HISTORIAL) this.pasado.shift();
      this.futuro = [];
    }
    this.mapa = reemplazarSala(this.mapa, sala);
    this.publicar();
    return true;
  }

  private comenzarGesto(): void {
    if (!this.gesto) this.gesto = { base: this.mapa };
  }

  private terminarGesto(): void {
    const g = this.gesto;
    this.gesto = null;
    if (!g || g.base === this.mapa) return;
    this.pasado.push(g.base);
    if (this.pasado.length > LIMITE_HISTORIAL) this.pasado.shift();
    this.futuro = [];
    this.publicar(true);
  }

  deshacer(): void {
    const previo = this.pasado.pop();
    if (!previo) return;
    this.futuro.push(this.mapa);
    this.mapa = previo;
    this.publicar();
  }

  rehacer(): void {
    const siguiente = this.futuro.pop();
    if (!siguiente) return;
    this.pasado.push(this.mapa);
    this.mapa = siguiente;
    this.publicar();
  }

  // ---------- herramientas ----------

  /** Hay algo a medias: un trazo, un rectángulo, un movimiento o una línea de paredes. */
  get hayAccionEnCurso(): boolean {
    return this.arrastre !== null || this.gesto !== null;
  }

  /**
   * Cierra lo que esté a medias sin perder lo ya confirmado: lo pintado o movido hasta ahora se queda (y se puede
   * deshacer como un solo paso); un rectángulo o una línea sin soltar se descartan.
   */
  cerrarEnCurso(): void {
    this.arrastre = null;
    this.terminarGesto();
    this.o.almacen.set({ fantasma: null, vistaPrevia: null, marquesina: null, zonaEnCurso: null });
  }

  /** El puntero se soltó donde la escena no lo vio (otra ventana, otra pestaña): se cierra el gesto como si se soltara. */
  soltarPuntero(): void {
    if (this.hayAccionEnCurso) this.cerrarEnCurso();
  }

  elegirHerramienta(h: Herramienta): void {
    if (this.o.area && h !== 'seleccionar' && h !== 'objeto' && h !== 'borrar' && h !== 'mano') return;
    this.cerrarEnCurso();
    this.o.almacen.set({ herramienta: h, fantasma: null, vistaPrevia: null, marquesina: null, zonaEnCurso: null, ...(h === 'seleccionar' || h === 'mano' ? {} : { seleccion: [] }) });
  }

  private pincel(cambio: Partial<Pincel>): void {
    this.o.almacen.set({ pincel: { ...this.estado.pincel, ...cambio } });
  }

  /** Toma un objeto del inventario para colocarlo. */
  elegirObjeto(id: string, opciones: { variante?: string; orientacion?: Orientacion } = {}): void {
    const o = objetoPorId(id);
    if (!o) return;
    if (o.capa === 'piso') {
      this.elegirPiso(id);
      return;
    }
    this.cerrarEnCurso();
    this.orientacionManual = opciones.orientacion !== undefined;
    this.o.almacen.set({
      herramienta: 'objeto',
      pincel: { ...this.estado.pincel, objeto: id, orientacion: opciones.orientacion ?? orientacionInicial(o), variante: opciones.variante ?? 'base' },
      seleccion: [],
      fantasma: null,
      vistaPrevia: null,
    });
  }

  elegirPiso(id: string | null, modo?: ModoPiso): void {
    this.cerrarEnCurso();
    this.o.almacen.set({
      herramienta: 'piso',
      pincel: { ...this.estado.pincel, piso: id, modoPiso: modo ?? (id === null ? 'borrador' : this.estado.pincel.modoPiso === 'borrador' ? 'pincel' : this.estado.pincel.modoPiso) },
      seleccion: [],
      fantasma: null,
      vistaPrevia: null,
    });
  }

  elegirModoPiso(modo: ModoPiso): void {
    this.pincel({ modoPiso: modo });
    if (this.estado.herramienta !== 'piso') {
      this.cerrarEnCurso();
      this.o.almacen.set({ herramienta: 'piso', fantasma: null, seleccion: [] });
    }
  }

  elegirVariante(variante: string): void {
    this.pincel({ variante });
  }

  elegirTipoZona(tipo: TipoZona): void {
    this.pincel({ zonaTipo: tipo });
  }

  /** Gira lo que se va a colocar o, si hay algo seleccionado, lo seleccionado. */
  girar(): void {
    const e = this.estado;
    if (e.herramienta === 'objeto' && e.pincel.objeto) {
      const o = objetoPorId(e.pincel.objeto);
      if (!o) return;
      this.orientacionManual = true;
      this.pincel({ orientacion: siguienteOrientacion(o, e.pincel.orientacion) });
      return;
    }
    const ids = e.seleccion.filter((s): s is Extract<ElementoSeleccion, { tipo: 'colocacion' }> => s.tipo === 'colocacion').map((s) => s.id);
    if (ids.length === 0) return;
    let sala = this.sala;
    this.comenzarGesto();
    let falloUno = '';
    for (const id of ids) {
      const r = girarColocacion(sala, id);
      if (esFallo(r)) falloUno = r.error;
      else sala = r.sala;
    }
    this.aplicarSala(sala);
    this.terminarGesto();
    if (falloUno) this.aviso(falloUno, 'error');
  }

  /**
   * Esc o clic derecho. Si hay algo a medias, lo deshace (vuelve al mapa de antes del gesto) y deja la herramienta
   * activa; si no hay nada en curso, suelta la herramienta y vuelve a seleccionar.
   */
  cancelar(): void {
    const e = this.estado;
    if (this.hayAccionEnCurso) {
      const g = this.gesto;
      this.arrastre = null;
      this.gesto = null;
      if (g && g.base !== this.mapa) {
        this.mapa = g.base;
        this.publicar();
      }
      this.o.almacen.set({ fantasma: null, vistaPrevia: null, marquesina: null, zonaEnCurso: null });
      return;
    }
    if (e.herramienta !== 'seleccionar' && e.herramienta !== 'mano') {
      this.o.almacen.set({ herramienta: 'seleccionar', fantasma: null, vistaPrevia: null, marquesina: null, zonaEnCurso: null });
    } else {
      this.o.almacen.set({ seleccion: [], fantasma: null, vistaPrevia: null, marquesina: null });
    }
  }

  // ---------- selección ----------

  seleccionar(elementos: ElementoSeleccion[]): void {
    this.o.almacen.set({ seleccion: elementos });
  }

  borrarSeleccion(): void {
    const sel = this.estado.seleccion;
    if (sel.length === 0) return;
    let sala = this.sala;
    const ids = sel.filter((s): s is Extract<ElementoSeleccion, { tipo: 'colocacion' }> => s.tipo === 'colocacion').map((s) => s.id);
    if (ids.length > 0) sala = quitar(sala, ids).sala;
    for (const s of sel) {
      if (s.tipo === 'zona') sala = quitarZona(sala, s.id);
      else if (s.tipo === 'llegada') sala = { ...sala, llegadas: sala.llegadas.filter((l) => !(l.x === s.x && l.y === s.y)) };
    }
    this.o.almacen.set({ seleccion: [] });
    this.aplicarSala(sala);
  }

  /** Toma lo seleccionado como pincel para poner otra copia. */
  duplicarSeleccion(): void {
    const sel = this.estado.seleccion.find((s) => s.tipo === 'colocacion');
    if (!sel || sel.tipo !== 'colocacion') return;
    const c = this.sala.colocaciones.find((p) => p.id === sel.id);
    if (c) this.elegirObjeto(c.objeto, { variante: c.variante, orientacion: c.orientacion });
  }

  /** Mueve lo seleccionado una casilla con las flechas. */
  empujar(dx: number, dy: number): void {
    const ids = this.estado.seleccion.filter((s): s is Extract<ElementoSeleccion, { tipo: 'colocacion' }> => s.tipo === 'colocacion').map((s) => s.id);
    if (ids.length === 0) return;
    const r = this.moverVarios(ids, dx, dy);
    if (r.error) this.aviso(r.error, 'error');
    else if (r.sala) this.aplicarSala(r.sala);
  }

  /** Mueve varias colocaciones a la vez (todas o ninguna). Las que se mueven juntas no se estorban entre sí. */
  private moverVarios(ids: readonly string[], dx: number, dy: number): { sala?: SalaMapa; error?: string } {
    const base = this.sala;
    const mover = new Set(ids);
    const elegidas = base.colocaciones.filter((c) => mover.has(c.id));
    let sala: SalaMapa = { ...base, colocaciones: base.colocaciones.filter((c) => !mover.has(c.id)) };
    // Primero lo que se mueve y no es de pared ni colgado (para que lo colgado encuentre su pared).
    const orden = [...elegidas].sort((a, b) => Number(Boolean(objetoPorId(b.objeto)?.pared)) - Number(Boolean(objetoPorId(a.objeto)?.pared)));
    // Lo apoyado va al final: necesita que su mueble ya esté en su nuevo lugar.
    orden.sort((a, b) => Number(Boolean(objetoPorId(a.objeto)?.apoyado)) - Number(Boolean(objetoPorId(b.objeto)?.apoyado)));
    for (const c of orden) {
      const o = objetoPorId(c.objeto);
      if (!o) return { error: 'Ese objeto ya no existe.' };
      const r = colocar(sala, { id: c.id, objeto: c.objeto, x: c.x + dx, y: c.y + dy, orientacion: c.orientacion, variante: c.variante, ...(c.props ? { props: c.props } : {}) });
      if (esFallo(r)) return { error: r.error };
      sala = r.sala;
    }
    // Los puestos de lo movido se conservan.
    return { sala: { ...sala, puestos: base.puestos } };
  }

  // ---------- puntero ----------

  puntero(e: EventoPuntero & { bajo?: string | null }): void {
    const h = this.estado.herramienta;
    if (e.tipo === 'abajo' && e.boton === 2) {
      this.cancelar();
      return;
    }
    if (e.tipo === 'abajo' && e.boton !== 0) return;
    switch (h) {
      case 'objeto':
        this.punteroObjeto(e);
        break;
      case 'piso':
        this.punteroPiso(e);
        break;
      case 'borrar':
        this.punteroBorrar(e);
        break;
      case 'seleccionar':
        this.punteroSeleccion(e);
        break;
      case 'zona':
        this.punteroZona(e);
        break;
      case 'llegada':
        this.punteroLlegada(e);
        break;
      case 'habitacion':
        this.punteroHabitacion(e);
        break;
      case 'area':
        this.punteroArea(e);
        break;
      default:
        break;
    }
  }

  private fantasmaEn(cx: number, cy: number): { fantasma: Fantasma | null; ev: ReturnType<typeof evaluarColocacion> | null; ancla: { x: number; y: number } | null } {
    const p = this.estado.pincel;
    const o = p.objeto ? objetoPorId(p.objeto) : undefined;
    if (!o) return { fantasma: null, ev: null, ancla: null };
    const sala = this.sala;
    let orientacion = p.orientacion;
    if (!this.orientacionManual) orientacion = orientacionAutomatica(sala, o, cx, cy, orientacion);
    if (!o.orientaciones.includes(orientacion) && !o.autotile) orientacion = orientacionInicial(o);
    if (o.autotile) orientacion = 'U';
    const h = huellaDe(o, orientacion);
    const ancla = anclar(h.ancho, h.alto, cx, cy);
    let ev = evaluarColocacion(sala, o, ancla.x, ancla.y, orientacion);
    if (this.o.area && ev.ok && !huellaDentroDe(huellaColocada(o, ancla.x, ancla.y, orientacion), this.o.area.area.rect)) ev = { ok: false, motivo: 'Eso queda fuera de tu área.' };
    // Lo apoyado se pega solo a la tapa del mueble: el fantasma se dibuja ahí.
    const apoyo = o.apoyado && ev.ok ? soporteDe(sala, o, ancla.x, ancla.y, orientacion) : null;
    return {
      fantasma: {
        id: o.id,
        ...(apoyo?.ok ? { dx: apoyo.dx, dy: apoyo.dy } : {}),
        objeto: o.id,
        x: ancla.x,
        y: ancla.y,
        ancho: h.ancho,
        alto: h.alto,
        valido: ev.ok,
        ...(ev.ok ? {} : { motivo: ev.motivo }),
        orientacion,
        variante: p.variante,
      },
      ev,
      ancla,
    };
  }

  private punteroObjeto(e: EventoPuntero): void {
    const p = this.estado.pincel;
    const o = p.objeto ? objetoPorId(p.objeto) : undefined;
    if (!o) return;
    const sala = this.sala;
    const fuera = !dentro(sala, e.x, e.y);

    if (o.pared === 'muro') {
      // Líneas rectas de pared: arrastras de una casilla a otra.
      if (e.tipo === 'abajo' && !fuera) this.arrastre = { tipo: 'linea', desde: { x: e.x, y: e.y } };
      const a = this.arrastre;
      if (a?.tipo === 'linea') {
        const celdas = celdasLinea(a.desde.x, a.desde.y, e.x, e.y).filter(([x, y]) => dentro(sala, x, y));
        const validas = celdas.filter(([x, y]) => evaluarColocacion(sala, o, x, y, 'U').ok);
        if (e.tipo === 'arriba') {
          this.comenzarGesto();
          let s = sala;
          for (const [x, y] of validas) {
            const r = colocar(s, { objeto: o.id, x, y, orientacion: 'U', variante: p.variante });
            if (!esFallo(r)) s = r.sala;
          }
          this.aplicarSala(s);
          this.terminarGesto();
          if (validas.length < celdas.length) this.aviso(validas.length === 0 ? 'Ahí no se puede poner pared.' : `Se pusieron ${validas.length} de ${celdas.length}: el resto estaba ocupado o sin piso.`, validas.length === 0 ? 'error' : 'info');
          this.arrastre = null;
          this.o.almacen.set({ vistaPrevia: null });
          return;
        }
        this.o.almacen.set({ vistaPrevia: { celdas: celdas, tono: validas.length === celdas.length ? 'bien' : 'mal' }, fantasma: null });
        return;
      }
      if (e.tipo === 'mover') {
        const { fantasma } = fuera ? { fantasma: null } : this.fantasmaEn(e.x, e.y);
        this.o.almacen.set({ fantasma, vistaPrevia: null });
      }
      return;
    }

    if (e.tipo === 'arriba') {
      this.terminarGesto();
      this.arrastre = null;
      return;
    }
    if (fuera) {
      this.o.almacen.set({ fantasma: null });
      return;
    }
    const { fantasma, ev, ancla } = this.fantasmaEn(e.x, e.y);
    this.o.almacen.set({ fantasma });
    if (e.tipo === 'mover' && this.arrastre?.tipo !== 'colocar') return;
    if (e.tipo === 'abajo' || (e.tipo === 'mover' && this.arrastre?.tipo === 'colocar')) {
      if (!fantasma || !ev || !ancla) return;
      if (!ev.ok) {
        if (e.tipo === 'abajo') this.aviso(ev.motivo, 'error');
        return;
      }
      // Se puede arrastrar para repetir solo con objetos de una casilla.
      const h = huellaDe(o, fantasma.orientacion);
      const unico = h.ancho === 1 && h.alto === 1;
      if (e.tipo === 'abajo' && unico) {
        this.arrastre = { tipo: 'colocar' };
        this.comenzarGesto();
      }
      const r = colocar(this.sala, { objeto: o.id, x: ancla.x, y: ancla.y, orientacion: fantasma.orientacion, variante: p.variante });
      if (!esFallo(r)) {
        this.aplicarSala(r.sala);
        if (!unico) this.terminarGesto();
        const nuevo = this.fantasmaEn(e.x, e.y).fantasma;
        this.o.almacen.set({ fantasma: nuevo });
      }
    }
  }

  private punteroPiso(e: EventoPuntero): void {
    const sala = this.sala;
    const p = this.estado.pincel;
    const borrar = p.modoPiso === 'borrador' || p.piso === null;
    const piso = borrar ? '' : (p.piso as string);
    const fuera = !dentro(sala, e.x, e.y);
    const celdaUnica: VistaPrevia = { celdas: fuera ? [] : [[e.x, e.y]], tono: borrar ? 'borrar' : 'bien' };

    const pintar = (celdas: ReadonlyArray<readonly [number, number]>): void => {
      let permitidas = celdas;
      if (piso === '') {
        const ix = indiceDe(this.sala);
        permitidas = celdas.filter(([x, y]) => {
          if (!dentro(this.sala, x, y)) return false;
          const k = y * this.sala.ancho + x;
          return !(ix.pared[k]! >= 0 || ix.ocupa.has(k) || ix.apoyados.has(k) || ix.montados.has(k));
        });
        if (permitidas.length < celdas.length && celdas.length > 0 && permitidas.length === 0) this.aviso('Quita primero lo que hay encima de ese piso.', 'error');
      }
      const r = pintarPiso(this.sala, permitidas, piso);
      if (!esFallo(r)) this.aplicarSala(r);
    };

    if (p.modoPiso === 'bote' && !borrar) {
      if (e.tipo === 'mover') this.o.almacen.set({ vistaPrevia: celdaUnica });
      if (e.tipo === 'abajo' && !fuera) {
        const region = regionDePiso(sala, e.x, e.y, 6000);
        if (region.length >= 6000) this.aviso('La región es muy grande para rellenarla de una vez.', 'error');
        else pintar(region);
      }
      return;
    }

    if (p.modoPiso === 'rectangulo' && !borrar) {
      if (e.tipo === 'abajo' && !fuera) this.arrastre = { tipo: 'piso', desde: { x: e.x, y: e.y }, ultima: { x: e.x, y: e.y } };
      const a = this.arrastre;
      if (a?.tipo === 'piso') {
        const x2 = Math.max(0, Math.min(sala.ancho - 1, e.x));
        const y2 = Math.max(0, Math.min(sala.alto - 1, e.y));
        const celdas = celdasRectangulo(a.desde.x, a.desde.y, x2, y2);
        if (e.tipo === 'arriba') {
          pintar(celdas);
          this.arrastre = null;
          this.o.almacen.set({ vistaPrevia: celdaUnica });
        } else this.o.almacen.set({ vistaPrevia: { celdas, tono: 'bien' } });
      } else if (e.tipo === 'mover') this.o.almacen.set({ vistaPrevia: celdaUnica });
      return;
    }

    // Pincel y borrador: se pinta por donde pasa el puntero, sin dejar huecos.
    if (e.tipo === 'abajo' && !fuera) {
      this.comenzarGesto();
      this.arrastre = { tipo: 'piso', desde: { x: e.x, y: e.y }, ultima: { x: e.x, y: e.y } };
      pintar([[e.x, e.y]]);
    } else if (e.tipo === 'mover') {
      const a = this.arrastre;
      if (a?.tipo === 'piso' && !fuera) {
        const tramo = celdasLinea(a.ultima.x, a.ultima.y, e.x, e.y);
        const diagonal = Math.abs(e.x - a.ultima.x) > 0 && Math.abs(e.y - a.ultima.y) > 0;
        const celdas = diagonal ? [...celdasRectangulo(a.ultima.x, a.ultima.y, e.x, a.ultima.y), ...celdasRectangulo(e.x, a.ultima.y, e.x, e.y)] : tramo;
        pintar(celdas);
        this.arrastre = { ...a, ultima: { x: e.x, y: e.y } };
      }
      this.o.almacen.set({ vistaPrevia: celdaUnica });
    } else if (e.tipo === 'arriba') {
      this.terminarGesto();
      this.arrastre = null;
    }
  }

  private punteroBorrar(e: EventoPuntero & { bajo?: string | null }): void {
    const sala = this.sala;
    const fuera = !dentro(sala, e.x, e.y);
    if (e.tipo === 'mover' || e.tipo === 'abajo') this.o.almacen.set({ vistaPrevia: fuera ? null : { celdas: [[e.x, e.y]], tono: 'borrar' } });
    const borrarAqui = (): void => {
      if (fuera) return;
      const c = (e.bajo ? this.sala.colocaciones.find((p) => p.id === e.bajo) : null) ?? colocacionEn(this.sala, e.x, e.y);
      if (!c) return;
      this.aplicarSala(quitar(this.sala, [c.id]).sala);
    };
    if (e.tipo === 'abajo') {
      this.arrastre = { tipo: 'borrar' };
      this.comenzarGesto();
      borrarAqui();
    } else if (e.tipo === 'mover' && this.arrastre?.tipo === 'borrar') borrarAqui();
    else if (e.tipo === 'arriba') {
      this.terminarGesto();
      this.arrastre = null;
    }
  }

  private objetivoDe(e: EventoPuntero & { bajo?: string | null }): string | null {
    const sala = this.sala;
    if (e.bajo && sala.colocaciones.some((c) => c.id === e.bajo)) return e.bajo;
    return colocacionEn(sala, e.x, e.y)?.id ?? null;
  }

  private punteroSeleccion(e: EventoPuntero & { bajo?: string | null }): void {
    const sala = this.sala;
    const sel = this.estado.seleccion;
    if (e.tipo === 'abajo') {
      const id = this.objetivoDe(e);
      if (e.alt && id) {
        const c = sala.colocaciones.find((p) => p.id === id);
        if (c) this.elegirObjeto(c.objeto, { variante: c.variante, orientacion: c.orientacion });
        return;
      }
      if (id) {
        const ya = sel.some((s) => s.tipo === 'colocacion' && s.id === id);
        let nueva: ElementoSeleccion[];
        if (e.shift) nueva = ya ? sel.filter((s) => !(s.tipo === 'colocacion' && s.id === id)) : [...sel, { tipo: 'colocacion', id }];
        else nueva = ya ? sel : [{ tipo: 'colocacion', id }];
        this.o.almacen.set({ seleccion: nueva });
        const ids = nueva.filter((s): s is Extract<ElementoSeleccion, { tipo: 'colocacion' }> => s.tipo === 'colocacion').map((s) => s.id);
        this.arrastre = { tipo: 'mover', origen: { x: e.x, y: e.y }, ids, movido: false };
        return;
      }
      const llegada = sala.llegadas.find((l) => l.x === e.x && l.y === e.y);
      if (llegada) {
        this.o.almacen.set({ seleccion: [{ tipo: 'llegada', x: llegada.x, y: llegada.y }] });
        return;
      }
      this.arrastre = { tipo: 'marquesina', origen: { px: e.px, py: e.py }, sumar: e.shift };
      if (!e.shift) this.o.almacen.set({ seleccion: [] });
      return;
    }
    const a = this.arrastre;
    if (!a) return;
    if (e.tipo === 'mover' && a.tipo === 'mover') {
      const dx = e.x - a.origen.x;
      const dy = e.y - a.origen.y;
      if (dx === 0 && dy === 0 && !a.movido) return;
      this.arrastre = { ...a, movido: true };
      const r = this.moverVarios(a.ids, dx, dy);
      const primero = sala.colocaciones.find((c) => c.id === a.ids[0]);
      const o = primero ? objetoPorId(primero.objeto) : undefined;
      if (primero && o) {
        const h = huellaDe(o, primero.orientacion);
        this.o.almacen.set({
          fantasma: { id: primero.id, objeto: primero.objeto, x: primero.x + dx, y: primero.y + dy, ancho: h.ancho, alto: h.alto, valido: !r.error, ...(r.error ? { motivo: r.error } : {}), orientacion: primero.orientacion, variante: primero.variante },
        });
      }
    } else if (e.tipo === 'mover' && a.tipo === 'marquesina') {
      const x = Math.min(a.origen.px, e.px);
      const y = Math.min(a.origen.py, e.py);
      this.o.almacen.set({ marquesina: { x, y, w: Math.abs(e.px - a.origen.px), h: Math.abs(e.py - a.origen.py) } });
    } else if (e.tipo === 'arriba') {
      if (a.tipo === 'mover' && a.movido) {
        const dx = e.x - a.origen.x;
        const dy = e.y - a.origen.y;
        const r = this.moverVarios(a.ids, dx, dy);
        if (r.error) this.aviso(r.error, 'error');
        else if (r.sala) this.aplicarSala(r.sala);
      } else if (a.tipo === 'marquesina') {
        const m = this.estado.marquesina;
        if (m && (m.w > 6 || m.h > 6)) {
          const x1 = Math.floor(m.x / 32);
          const y1 = Math.floor(m.y / 32);
          const x2 = Math.floor((m.x + m.w) / 32);
          const y2 = Math.floor((m.y + m.h) / 32);
          const dentroDelCuadro = sala.colocaciones.filter((c) => {
            const o = objetoPorId(c.objeto);
            if (!o) return false;
            return celdasDe(huellaColocada(o, c.x, c.y, c.orientacion)).some(([x, y]) => x >= x1 && x <= x2 && y >= y1 && y <= y2);
          });
          const nuevos: ElementoSeleccion[] = dentroDelCuadro.map((c) => ({ tipo: 'colocacion', id: c.id }));
          const previos = a.sumar ? this.estado.seleccion : [];
          const sinRepetir = nuevos.filter((n) => !previos.some((p) => p.tipo === 'colocacion' && n.tipo === 'colocacion' && p.id === n.id));
          this.o.almacen.set({ seleccion: [...previos, ...sinRepetir] });
        }
      }
      this.arrastre = null;
      this.o.almacen.set({ fantasma: null, marquesina: null });
    }
  }

  private punteroZona(e: EventoPuntero): void {
    const sala = this.sala;
    if (e.tipo === 'abajo') {
      if (!dentro(sala, e.x, e.y)) return;
      this.arrastre = { tipo: 'zona', desde: { x: e.x, y: e.y } };
      this.o.almacen.set({ zonaEnCurso: { x: e.x, y: e.y, w: 1, h: 1 } });
      return;
    }
    const a = this.arrastre;
    if (a?.tipo !== 'zona') return;
    const x2 = Math.max(0, Math.min(sala.ancho - 1, e.x));
    const y2 = Math.max(0, Math.min(sala.alto - 1, e.y));
    const rect = { x: Math.min(a.desde.x, x2), y: Math.min(a.desde.y, y2), w: Math.abs(x2 - a.desde.x) + 1, h: Math.abs(y2 - a.desde.y) + 1 };
    if (e.tipo === 'mover') {
      this.o.almacen.set({ zonaEnCurso: rect });
      return;
    }
    if (e.tipo === 'arriba') {
      this.arrastre = null;
      this.o.almacen.set({ zonaEnCurso: null });
      if (rect.w === 1 && rect.h === 1) {
        const existente = sala.zonas.find((z) => rect.x >= z.rect.x && rect.y >= z.rect.y && rect.x < z.rect.x + z.rect.w && rect.y < z.rect.y + z.rect.h);
        if (existente) {
          this.o.almacen.set({ seleccion: [{ tipo: 'zona', id: existente.id }] });
          return;
        }
      }
      const r = crearZona(sala, { nombre: `Zona ${this.contadorZona}`, tipo: this.estado.pincel.zonaTipo, rect });
      if (esFallo(r)) {
        this.aviso(r.error, 'error');
        return;
      }
      this.contadorZona++;
      this.aplicarSala(r.sala);
      this.o.almacen.set({ seleccion: [{ tipo: 'zona', id: r.zona.id }] });
    }
  }

  private punteroLlegada(e: EventoPuntero): void {
    const sala = this.sala;
    if (e.tipo === 'mover') {
      const ok = dentro(sala, e.x, e.y) && !indiceDe(sala).bloqueo[e.y * sala.ancho + e.x];
      this.o.almacen.set({ vistaPrevia: dentro(sala, e.x, e.y) ? { celdas: [[e.x, e.y]], tono: ok || sala.llegadas.some((l) => l.x === e.x && l.y === e.y) ? 'bien' : 'mal' } : null });
      return;
    }
    if (e.tipo !== 'abajo') return;
    const r = alternarLlegada(sala, e.x, e.y);
    if (esFallo(r)) this.aviso(r.error, 'error');
    else this.aplicarSala(r);
  }

  // ---------- áreas personales (las asigna quien administra) ----------

  get areas(): AreaPersonal[] {
    return this.sala.areas ?? [];
  }

  private punteroArea(e: EventoPuntero): void {
    const sala = this.sala;
    if (e.tipo === 'abajo') {
      if (!dentro(sala, e.x, e.y)) return;
      this.arrastre = { tipo: 'area', desde: { x: e.x, y: e.y } };
      this.o.almacen.set({ zonaEnCurso: { x: e.x, y: e.y, w: 1, h: 1 } });
      return;
    }
    const a = this.arrastre;
    if (a?.tipo !== 'area') return;
    const x2 = Math.max(0, Math.min(sala.ancho - 1, e.x));
    const y2 = Math.max(0, Math.min(sala.alto - 1, e.y));
    const rect = { x: Math.min(a.desde.x, x2), y: Math.min(a.desde.y, y2), w: Math.abs(x2 - a.desde.x) + 1, h: Math.abs(y2 - a.desde.y) + 1 };
    if (e.tipo === 'mover') {
      this.o.almacen.set({ zonaEnCurso: rect });
      return;
    }
    if (e.tipo === 'arriba') {
      this.arrastre = null;
      this.o.almacen.set({ zonaEnCurso: null });
      const r = crearArea(sala, { nombre: `Área ${(sala.areas?.length ?? 0) + 1}`, rect });
      if (esFallo(r)) this.aviso(r.error, 'error');
      else {
        this.aplicarSala(r.sala);
        this.aviso('Área creada. Asígnale una persona en el panel.', 'info');
      }
    }
  }

  actualizarAreaPorId(id: string, cambios: Partial<Omit<AreaPersonal, 'id'>>): void {
    const r = actualizarArea(this.sala, id, cambios);
    if (esFallo(r)) this.aviso(r.error, 'error');
    else this.aplicarSala(r);
  }

  quitarAreaPorId(id: string): void {
    this.aplicarSala(quitarArea(this.sala, id));
  }

  /** Crea un área alrededor de cada puesto con nombre que todavía no tenga una, con su dueño si el puesto ya lo trae. */
  crearAreasDePuestos(): void {
    let sala = this.sala;
    let creadas = 0;
    for (const pu of sala.puestos) {
      const silla = sala.colocaciones.find((c) => c.id === pu.colocacion);
      if (!silla || !pu.etiqueta) continue;
      if ((sala.areas ?? []).some((a) => silla.x >= a.rect.x && silla.x < a.rect.x + a.rect.w && silla.y >= a.rect.y && silla.y < a.rect.y + a.rect.h)) continue;
      const hacia = silla.orientacion === 'N' ? -2 : 0;
      const x = Math.max(0, silla.x - 1);
      const y = Math.max(0, silla.y + hacia);
      const w = Math.min(3, sala.ancho - x);
      const h = Math.min(3, sala.alto - y);
      const r = crearArea(sala, { nombre: `Escritorio de ${pu.etiqueta.split(' · ')[0]}`, rect: { x, y, w, h }, duenos: pu.usuarioId ? [pu.usuarioId] : [] });
      if (esFallo(r)) continue;
      sala = r.sala;
      creadas++;
    }
    if (creadas === 0) {
      this.aviso('Todos los puestos con nombre ya tienen su área.', 'info');
      return;
    }
    this.aplicarSala(sala);
    this.aviso(`${creadas} ${creadas === 1 ? 'área creada' : 'áreas creadas'}. Asígnales sus personas.`, 'info');
  }

  // ---------- habitaciones rápidas ----------

  /** Ajusta cómo se arman las habitaciones (piso, paredes, puerta, zona o plantilla) y activa la herramienta. */
  configurarHabitacion(cambio: Partial<AjusteHabitacion>): void {
    this.pincel({ habitacion: { ...this.estado.pincel.habitacion, ...cambio } });
    if (this.estado.herramienta !== 'habitacion') this.elegirHerramienta('habitacion');
  }

  /** Rectángulo de la habitación que se armaría con el puntero en (cx, cy): una plantilla centrada o el arrastre en curso. */
  private rectHabitacion(desde: { x: number; y: number } | null, cx: number, cy: number): { x1: number; y1: number; x2: number; y2: number } {
    const sala = this.sala;
    const tam = this.estado.pincel.habitacion.tam;
    if (tam && !desde) {
      const x1 = Math.max(0, Math.min(sala.ancho - tam.w, cx - Math.floor(tam.w / 2)));
      const y1 = Math.max(0, Math.min(sala.alto - tam.h, cy - Math.floor(tam.h / 2)));
      return { x1, y1, x2: x1 + tam.w - 1, y2: y1 + tam.h - 1 };
    }
    const a = desde ?? { x: cx, y: cy };
    const x2 = Math.max(0, Math.min(sala.ancho - 1, cx));
    const y2 = Math.max(0, Math.min(sala.alto - 1, cy));
    return { x1: Math.min(a.x, x2), y1: Math.min(a.y, y2), x2: Math.max(a.x, x2), y2: Math.max(a.y, y2) };
  }

  private contornoHabitacion(r: { x1: number; y1: number; x2: number; y2: number }): [number, number][] {
    const celdas: [number, number][] = [];
    for (let y = r.y1; y <= r.y2; y++) for (let x = r.x1; x <= r.x2; x++) if (x === r.x1 || x === r.x2 || y === r.y1 || y === r.y2) celdas.push([x, y]);
    return celdas;
  }

  /** Arma una habitación entera: piso, paredes alrededor, una puerta al sur y su zona, todo en un solo paso del historial. */
  crearHabitacion(r: { x1: number; y1: number; x2: number; y2: number }): void {
    const w = r.x2 - r.x1 + 1;
    const h = r.y2 - r.y1 + 1;
    if (w < 3 || h < 3) {
      this.aviso('Una habitación necesita al menos 3 × 3 casillas.', 'error');
      return;
    }
    const aj = this.estado.pincel.habitacion;
    let sala = this.sala;
    const pisoR = pintarPiso(sala, celdasRectangulo(r.x1, r.y1, r.x2, r.y2), aj.piso);
    if (esFallo(pisoR)) {
      this.aviso(pisoR.error, 'error');
      return;
    }
    sala = pisoR;
    // La puerta va en el centro del lado sur: se pone primero para que las paredes se unan a ella.
    const xPuerta = r.x1 + Math.floor(w / 2);
    let sinPoner = 0;
    if (aj.puerta) {
      const rp = colocar(sala, { objeto: 'puerta-simple', x: xPuerta, y: r.y2, orientacion: 'S', variante: 'base' });
      if (esFallo(rp)) sinPoner++;
      else sala = rp.sala;
    }
    for (const [x, y] of this.contornoHabitacion(r)) {
      if (aj.puerta && x === xPuerta && y === r.y2) continue;
      const rm = colocar(sala, { objeto: aj.muro, x, y, orientacion: 'U', variante: 'base' });
      if (esFallo(rm)) sinPoner++;
      else sala = rm.sala;
    }
    let zonaId: string | null = null;
    if (aj.zona !== 'ninguna') {
      const rz = crearZona(sala, { nombre: `Sala ${this.contadorZona}`, tipo: aj.zona, rect: { x: r.x1 + 1, y: r.y1 + 1, w: w - 2, h: h - 2 } });
      if (!esFallo(rz)) {
        sala = rz.sala;
        zonaId = rz.zona.id;
        this.contadorZona++;
      }
    }
    this.aplicarSala(sala);
    if (zonaId) this.o.almacen.set({ seleccion: [{ tipo: 'zona', id: zonaId }] });
    this.aviso(sinPoner > 0 ? `Habitación lista. ${sinPoner} ${sinPoner === 1 ? 'pared quedó sin poner' : 'paredes quedaron sin poner'} porque había algo encima.` : 'Habitación lista. Arrastra otra o elige un objeto para amoblarla.', 'info');
  }

  private punteroHabitacion(e: EventoPuntero): void {
    const sala = this.sala;
    const tam = this.estado.pincel.habitacion.tam;
    const fuera = !dentro(sala, e.x, e.y);
    if (tam) {
      // Plantilla: la sombra sigue al puntero y un clic la estampa.
      if (fuera && e.tipo !== 'arriba') {
        this.o.almacen.set({ vistaPrevia: null });
        return;
      }
      const r = this.rectHabitacion(null, e.x, e.y);
      if (e.tipo === 'mover') this.o.almacen.set({ vistaPrevia: { celdas: this.contornoHabitacion(r), tono: 'bien' } });
      else if (e.tipo === 'abajo') this.crearHabitacion(r);
      return;
    }
    if (e.tipo === 'abajo') {
      if (fuera) return;
      this.arrastre = { tipo: 'habitacion', desde: { x: e.x, y: e.y } };
      this.o.almacen.set({ vistaPrevia: { celdas: [[e.x, e.y]], tono: 'bien' } });
      return;
    }
    const a = this.arrastre;
    if (a?.tipo !== 'habitacion') {
      if (e.tipo === 'mover') this.o.almacen.set({ vistaPrevia: fuera ? null : { celdas: [[e.x, e.y]], tono: 'bien' } });
      return;
    }
    const r = this.rectHabitacion(a.desde, e.x, e.y);
    const pequena = r.x2 - r.x1 + 1 < 3 || r.y2 - r.y1 + 1 < 3;
    if (e.tipo === 'mover') this.o.almacen.set({ vistaPrevia: { celdas: this.contornoHabitacion(r), tono: pequena ? 'mal' : 'bien' } });
    else if (e.tipo === 'arriba') {
      this.arrastre = null;
      this.o.almacen.set({ vistaPrevia: null });
      this.crearHabitacion(r);
    }
  }

  // ---------- salas del mapa ----------

  get salas(): { id: string; nombre: string; ancho: number; alto: number; inicial: boolean; activa: boolean }[] {
    return this.mapa.salas.map((s) => ({ id: s.id, nombre: s.nombre, ancho: s.ancho, alto: s.alto, inicial: s.id === this.mapa.salaInicial, activa: s.id === this.salaId }));
  }

  private aplicarMapa(mapa: MapaOficina): void {
    if (this.o.area) {
      this.aviso('Solo puedes cambiar tu área.', 'error');
      return;
    }
    this.pasado.push(this.mapa);
    if (this.pasado.length > LIMITE_HISTORIAL) this.pasado.shift();
    this.futuro = [];
    this.mapa = mapa;
    this.publicar();
  }

  /** Reemplaza todo el borrador por una plantilla. Se puede deshacer y se guarda como cualquier otro cambio. */
  cargarPlantilla(plantilla: MapaOficina, nombre: string): void {
    if (this.o.area) {
      this.aviso('Solo puedes cambiar tu área.', 'error');
      return;
    }
    this.salaId = plantilla.salas.some((s) => s.id === this.salaId) ? this.salaId : plantilla.salaInicial;
    this.arrastre = null;
    this.gesto = null;
    this.aplicarMapa({ ...plantilla, nombre: this.mapa.nombre });
    const sala = this.sala;
    this.o.almacen.set({ seleccion: [], fantasma: null, vistaPrevia: null, marquesina: null, zonaEnCurso: null, centrar: { x: (sala.ancho * 32) / 2, y: (sala.alto * 32) / 2, n: Date.now() } });
    this.aviso(`Cargaste la plantilla «${nombre}». Puedes deshacerlo con Ctrl+Z.`, 'info');
  }

  /** Cambia la sala que estás editando. */
  irASala(id: string): void {
    if (this.o.area) return;
    if (!this.mapa.salas.some((s) => s.id === id) || id === this.salaId) return;
    this.salaId = id;
    this.arrastre = null;
    this.gesto = null;
    const sala = this.sala;
    this.o.almacen.set({ seleccion: [], fantasma: null, vistaPrevia: null, marquesina: null, zonaEnCurso: null, centrar: { x: (sala.ancho * 32) / 2, y: (sala.alto * 32) / 2, n: Date.now() } });
    this.publicar(true);
  }

  /** Crea una sala vacía y pasa a ella. */
  nuevaSala(nombre: string, ancho: number, alto: number): void {
    const limpio = nombre.trim().slice(0, 40) || `Sala ${this.mapa.salas.length + 1}`;
    let n = this.mapa.salas.length + 1;
    while (this.mapa.salas.some((s) => s.id === `sala-${n}`)) n++;
    const id = `sala-${n}`;
    this.aplicarMapa({ ...this.mapa, salas: [...this.mapa.salas, salaVacia(id, limpio, ancho, alto)] });
    this.irASala(id);
    this.aviso(`Sala «${limpio}» creada. Dibuja una habitación para empezar.`, 'info');
  }

  renombrarSala(id: string, nombre: string): void {
    const limpio = nombre.trim().slice(0, 40);
    if (!limpio) return;
    this.aplicarMapa({ ...this.mapa, salas: this.mapa.salas.map((s) => (s.id === id ? { ...s, nombre: limpio } : s)) });
  }

  /** Por qué sala se entra al abrir la oficina. */
  definirSalaInicial(id: string): void {
    if (this.mapa.salaInicial === id || !this.mapa.salas.some((s) => s.id === id)) return;
    this.aplicarMapa({ ...this.mapa, salaInicial: id });
  }

  borrarSala(id: string): void {
    if (this.mapa.salas.length <= 1) {
      this.aviso('Tiene que quedar al menos una sala.', 'error');
      return;
    }
    if (id === this.mapa.salaInicial) {
      this.aviso('Esa es la sala por la que se entra. Elige otra como inicial antes de borrarla.', 'error');
      return;
    }
    const activa = id === this.salaId;
    this.aplicarMapa({ ...this.mapa, salas: this.mapa.salas.filter((s) => s.id !== id) });
    if (activa) this.irASala(this.mapa.salaInicial);
  }

  // ---------- cambios desde los paneles ----------

  cambiarVarianteSeleccion(variante: string): void {
    let sala = this.sala;
    this.comenzarGesto();
    for (const s of this.estado.seleccion) {
      if (s.tipo !== 'colocacion') continue;
      const r = cambiarVariante(sala, s.id, variante);
      if (!esFallo(r)) sala = r;
    }
    this.aplicarSala(sala);
    this.terminarGesto();
  }

  cambiarPropsColocacion(id: string, props: Colocacion['props']): void {
    const r = cambiarProps(this.sala, id, props);
    if (esFallo(r)) this.aviso(r.error, 'error');
    else this.aplicarSala(r);
  }

  /** «Poner sillas alrededor» de una mesa: pegadas, mirando a la mesa, centradas y simétricas. Un solo paso del historial. */
  ponerSillas(mesaId: string, opciones: OpcionesSillas): void {
    const base = this.sala;
    const mesa = base.colocaciones.find((c) => c.id === mesaId);
    if (!mesa) return;
    const r = sillasAlrededor(base, mesaId, opciones);
    if (esFallo(r)) {
      this.aviso(r.error, 'error');
      return;
    }
    let sala = r.sala;
    let puestas = r.puestas;
    // Quien edita solo su área no puede poner sillas fuera de ella.
    const area = this.o.area?.area.rect;
    if (area) {
      const fuera = new Set(
        puestas.filter((c) => !huellaDentroDe(huellaColocada(objetoPorId(c.objeto) as ObjetoCatalogo, c.x, c.y, c.orientacion), area)).map((c) => c.id),
      );
      if (fuera.size > 0) {
        sala = quitar(sala, [...fuera]).sala;
        puestas = puestas.filter((c) => !fuera.has(c.id));
      }
    }
    if (puestas.length === 0) {
      this.aviso(r.omitidas[0]?.motivo ?? 'No hay dónde poner sillas alrededor.', 'error');
      return;
    }
    this.aplicarSala(sala);
    const omitidas = r.omitidas.length + (r.puestas.length - puestas.length);
    this.aviso(omitidas > 0 ? `Se pusieron ${puestas.length} sillas. ${omitidas} casillas quedaron sin silla (pared, puerta u otro objeto).` : `Se pusieron ${puestas.length} sillas.`, 'info');
  }

  /** «Sus» sillas: las pegadas a la mesa y mirando hacia ella. Se calcula al momento, no se guarda ningún grupo. */
  sillasDe(mesaId: string): Colocacion[] {
    const mesa = this.sala.colocaciones.find((c) => c.id === mesaId);
    return mesa ? sillasDeMesa(this.sala, mesa) : [];
  }

  /** Suma las sillas de la mesa a la selección: así mover, girar o quitar las afecta a todas juntas. */
  seleccionarConSillas(mesaId: string): void {
    const ids = [mesaId, ...this.sillasDe(mesaId).map((c) => c.id)];
    this.o.almacen.set({ seleccion: ids.map((id) => ({ tipo: 'colocacion' as const, id })) });
  }

  /** Quita la mesa y sus sillas (un solo paso del historial). */
  quitarConSillas(mesaId: string): void {
    const ids = [mesaId, ...this.sillasDe(mesaId).map((c) => c.id)];
    this.o.almacen.set({ seleccion: [] });
    this.aplicarSala(quitar(this.sala, ids).sala);
  }

  /** El botón «Arreglar» de la Revisión: vuelve a poner el apoyado sobre una mesa o acerca la silla a la mesa más cercana. */
  arreglar(p: Problema): void {
    if (!p.colocacion || !p.arreglo) return;
    if (p.sala && p.sala !== this.salaId) this.irASala(p.sala);
    const sala = this.sala;
    const c = sala.colocaciones.find((q) => q.id === p.colocacion);
    if (!c) return;
    const destino = p.arreglo === 'apoyado' ? reubicarApoyado(sala, c) : arreglarSilla(sala, c);
    if (!destino) {
      this.aviso('No encontré un lugar donde ponerlo solo. Muévelo a mano.', 'error');
      return;
    }
    const orientacion: Orientacion = 'orientacion' in destino ? (destino.orientacion as Orientacion) : c.orientacion;
    const r = reubicar(sala, c.id, destino.x, destino.y, orientacion);
    if (esFallo(r)) {
      this.aviso(r.error, 'error');
      return;
    }
    this.aplicarSala(r.sala);
    this.aviso(p.arreglo === 'apoyado' ? 'Quedó sobre la mesa.' : 'La silla quedó junto a la mesa.', 'info');
  }

  /** ¿La colocación es una mesa o un escritorio al que se le ponen sillas? */
  esMesa(id: string): boolean {
    const c = this.sala.colocaciones.find((p) => p.id === id);
    const o = c ? objetoPorId(c.objeto) : undefined;
    return Boolean(o && esMesaParaSillas(o));
  }

  girarEn(id: string): void {
    const r = girarColocacion(this.sala, id);
    if (esFallo(r)) this.aviso(r.error, 'error');
    else this.aplicarSala(r.sala);
  }

  actualizarZonaPorId(id: string, cambios: Partial<Omit<Zona, 'id'>>): void {
    const r = actualizarZona(this.sala, id, cambios);
    if (esFallo(r)) this.aviso(r.error, 'error');
    else this.aplicarSala(r);
  }

  quitarZonaPorId(id: string): void {
    this.o.almacen.set({ seleccion: this.estado.seleccion.filter((s) => !(s.tipo === 'zona' && s.id === id)) });
    this.aplicarSala(quitarZona(this.sala, id));
  }

  quitarTodasLasLlegadas(): void {
    this.aplicarSala({ ...this.sala, llegadas: [] });
  }

  /** Sustituye la sala activa (por ejemplo al asignar un puesto desde un panel). */
  reemplazarSala(sala: SalaMapa): void {
    this.aplicarSala(sala);
  }

  /** Para el inspector: reubica una colocación a una casilla exacta. */
  reubicarEn(id: string, x: number, y: number): void {
    const r = reubicar(this.sala, id, x, y);
    if (esFallo(r)) this.aviso(r.error, 'error');
    else this.aplicarSala(r.sala);
  }
}
