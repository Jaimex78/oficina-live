import { CASILLA, girar, idFrame, type Direccion, type ObjetoCatalogo, type Orientacion } from './arte';
import { reubicarApoyado, soporteDe } from './apoyos';
import { arreglarSilla, esMesaParaSillas, esSillaDeMesa, ladoPegado, sillasAlrededor as sillasAlrededorDe, type OpcionesSillas } from './sillas';
import { huellaDe, objetoPorId } from './inventario';
import { LIMITES_MAPA, type AreaPersonal, type Colocacion, type MapaOficina, type Portal, type PuestoNombrado, type PuntoLlegada, type SalaMapa, type TipoZona, type Zona } from './mapa';

/**
 * Lógica de la oficina que comparten el editor, el mundo y el servidor: dónde cabe cada objeto, qué bloquea el paso,
 * cómo se unen las paredes y qué le falta a un mapa para publicarse. Todo son funciones puras sobre `SalaMapa`:
 * cada edición devuelve una sala nueva (la anterior no se toca), lo que da deshacer y rehacer gratis.
 */

export type BuscarObjeto = (id: string) => ObjetoCatalogo | undefined;
export interface Fallo {
  error: string;
}
export const esFallo = (r: unknown): r is Fallo => typeof r === 'object' && r !== null && 'error' in r;

// ---------- huellas ----------

export interface HuellaColocada {
  x: number;
  y: number;
  ancho: number;
  alto: number;
  /** Casillas que bloquean, ya en coordenadas de la sala. */
  bloquea: [number, number][];
}

export function huellaColocada(o: ObjetoCatalogo, x: number, y: number, orientacion: Orientacion): HuellaColocada {
  const h = huellaDe(o, orientacion);
  return { x, y, ancho: h.ancho, alto: h.alto, bloquea: h.bloquea.map(([dx, dy]) => [x + dx, y + dy]) };
}

export function celdasDe(h: Pick<HuellaColocada, 'x' | 'y' | 'ancho' | 'alto'>): [number, number][] {
  const r: [number, number][] = [];
  for (let j = 0; j < h.alto; j++) for (let i = 0; i < h.ancho; i++) r.push([h.x + i, h.y + j]);
  return r;
}

export const indiceCelda = (sala: Pick<SalaMapa, 'ancho'>, x: number, y: number): number => y * sala.ancho + x;
export const dentro = (sala: Pick<SalaMapa, 'ancho' | 'alto'>, x: number, y: number): boolean => x >= 0 && y >= 0 && x < sala.ancho && y < sala.alto;

/** Orientación con la que se coloca un objeto si no se pide otra. */
export function orientacionInicial(o: ObjetoCatalogo): Orientacion {
  if (o.autotile) return 'U';
  if (o.orientaciones.includes('S')) return 'S';
  return o.orientaciones[0] ?? 'U';
}

/** La siguiente orientación permitida, girando en sentido horario (N, E, S, O). */
export function siguienteOrientacion(o: ObjetoCatalogo, actual: Orientacion): Orientacion {
  if (o.autotile || o.orientaciones.length <= 1 || actual === 'U') return actual;
  let d: Direccion = girar(actual);
  for (let i = 0; i < 4; i++) {
    if (o.orientaciones.includes(d)) return d;
    d = girar(d);
  }
  return actual;
}

export function orientacionValida(o: ObjetoCatalogo, orientacion: Orientacion): boolean {
  if (o.autotile) return orientacion === 'U';
  return o.orientaciones.includes(orientacion);
}

// ---------- índice por sala ----------

export interface IndiceSala {
  ancho: number;
  alto: number;
  hayPiso: Uint8Array;
  /** Posición (en `sala.colocaciones`) de la pieza de pared de cada casilla, o -1. */
  pared: Int32Array;
  /** Objetos de la capa «objeto» que ocupan la casilla con su huella completa. */
  ocupa: Map<number, number[]>;
  apoyados: Map<number, number[]>;
  montados: Map<number, number[]>;
  suelo: Map<number, number[]>;
  /** 1 = no se puede pisar (sin piso o con algo sólido). Los asientos NO bloquean: se cruzan caminando y solo se sienta quien se detiene en ellos. */
  bloqueo: Uint8Array;
}

const cache = new WeakMap<SalaMapa, IndiceSala>();

function sumar(m: Map<number, number[]>, clave: number, valor: number): void {
  const l = m.get(clave);
  if (l) l.push(valor);
  else m.set(clave, [valor]);
}

export function indiceDe(sala: SalaMapa, buscar: BuscarObjeto = objetoPorId): IndiceSala {
  const usable = buscar === objetoPorId;
  if (usable) {
    const previo = cache.get(sala);
    if (previo) return previo;
  }
  const n = sala.ancho * sala.alto;
  const ix: IndiceSala = {
    ancho: sala.ancho,
    alto: sala.alto,
    hayPiso: new Uint8Array(n),
    pared: new Int32Array(n).fill(-1),
    ocupa: new Map(),
    apoyados: new Map(),
    montados: new Map(),
    suelo: new Map(),
    bloqueo: new Uint8Array(n),
  };
  for (let y = 0; y < sala.alto; y++) {
    const fila = sala.piso[y];
    if (!fila) continue;
    for (let x = 0; x < sala.ancho; x++) if (fila[x]) ix.hayPiso[y * sala.ancho + x] = 1;
  }
  sala.colocaciones.forEach((c, i) => {
    const o = buscar(c.objeto);
    if (!o) return;
    const h = huellaColocada(o, c.x, c.y, c.orientacion);
    for (const [x, y] of celdasDe(h)) {
      if (!dentro(sala, x, y)) continue;
      const k = y * sala.ancho + x;
      if (o.pared) ix.pared[k] = i;
      else if (o.montado) sumar(ix.montados, k, i);
      else if (o.apoyado) sumar(ix.apoyados, k, i);
      else if (o.capa === 'suelo') sumar(ix.suelo, k, i);
      else if (o.capa === 'objeto') sumar(ix.ocupa, k, i);
    }
    if (!o.apoyado) {
      // Los asientos se pueden cruzar caminando (como en Gather): solo se sienta quien se detiene justo en la casilla del asiento.
      // Lo que no es casilla de asiento (el brazo de un sofá grande, por ejemplo) sigue siendo sólido.
      const deAsiento = new Set(celdasDeAsiento(o, c, h).map(([x, y]) => y * sala.ancho + x));
      for (const [x, y] of h.bloquea) if (dentro(sala, x, y) && !deAsiento.has(y * sala.ancho + x)) ix.bloqueo[y * sala.ancho + x] = 1;
    }
  });
  for (let k = 0; k < n; k++) if (!ix.hayPiso[k]) ix.bloqueo[k] = 1;
  if (usable) cache.set(sala, ix);
  return ix;
}

/** Cuadrícula de paso: 1 = bloqueada. */
export function calcularBloqueo(sala: SalaMapa, buscar: BuscarObjeto = objetoPorId): Uint8Array {
  return indiceDe(sala, buscar).bloqueo;
}

/** Máscara de vecinos N, E, S, O de una pared: 1 si en esa dirección hay otra pieza de pared. */
export function mascaraPared(sala: SalaMapa, x: number, y: number, buscar: BuscarObjeto = objetoPorId): string {
  const ix = indiceDe(sala, buscar);
  const hay = (cx: number, cy: number) => (dentro(sala, cx, cy) && ix.pared[cy * sala.ancho + cx]! >= 0 ? 1 : 0);
  return `${hay(x, y - 1)}${hay(x + 1, y)}${hay(x, y + 1)}${hay(x - 1, y)}`;
}

/** Id de frame que se dibuja para una colocación. Si falta la versión pedida, cae a la primera que exista. */
export function frameDeColocacion(o: ObjetoCatalogo, orientacion: Orientacion, variante: string, mascara?: string): string {
  // Las pantallas sobre un escritorio se dibujan siempre de frente, para que todos las vean sin importar hacia dónde se sientan.
  if (o.apoyado && o.categoria === 'tecnologia' && o.orientaciones.includes('S')) orientacion = 'S';
  const clave = o.autotile ? (mascara ?? '0000') : orientacion;
  const porVariante = o.frames[clave] ?? o.frames[o.autotile ? '0000' : (o.orientaciones[0] ?? 'U')] ?? Object.values(o.frames)[0];
  if (!porVariante) return idFrame(o.id, orientacion, variante);
  return porVariante[variante] ?? porVariante.base ?? Object.values(porVariante)[0] ?? idFrame(o.id, orientacion, variante);
}

// ---------- reglas de colocación ----------

export interface OpcionesColocar {
  /** Colocaciones que se ignoran al revisar choques (la que se está moviendo o girando). */
  ignorar?: ReadonlySet<string>;
  buscar?: BuscarObjeto;
  /** No exige mueble debajo ni que quepa en la tapa (mapas viejos y plantillas heredadas). El editor nunca lo usa. */
  sinApoyo?: boolean;
}

export type EvaluacionColocar = { ok: true; reemplaza: string[] } | { ok: false; motivo: string };

const no = (motivo: string): EvaluacionColocar => ({ ok: false, motivo });

export function evaluarColocacion(sala: SalaMapa, o: ObjetoCatalogo, x: number, y: number, orientacion: Orientacion, opciones: OpcionesColocar = {}): EvaluacionColocar {
  const ignorar = opciones.ignorar ?? new Set<string>();
  const buscar = opciones.buscar ?? objetoPorId;
  if (o.capa === 'piso') return no('Los pisos se pintan, no se colocan.');
  if (!orientacionValida(o, orientacion)) return no('Ese objeto no se puede girar así.');
  const h = huellaColocada(o, x, y, orientacion);
  if (x < 0 || y < 0 || x + h.ancho > sala.ancho || y + h.alto > sala.alto) return no('Queda fuera de la oficina.');
  if (sala.colocaciones.length - ignorar.size >= LIMITES_MAPA.colocaciones) return no('La oficina llegó al máximo de objetos.');

  const ix = indiceDe(sala, buscar);
  const celdas = celdasDe(h).map(([cx, cy]) => cy * sala.ancho + cx);
  const idDe = (i: number) => sala.colocaciones[i]?.id ?? '';
  const libre = (m: Map<number, number[]>, k: number) => !(m.get(k) ?? []).some((i) => !ignorar.has(idDe(i)));
  const hayPared = (k: number) => ix.pared[k]! >= 0 && !ignorar.has(idDe(ix.pared[k]!));

  if (!celdas.every((k) => ix.hayPiso[k])) return no('Falta piso aquí. Pinta el piso primero.');

  if (o.montado) {
    if (!celdas.every(hayPared)) return no('Este objeto va sobre una pared.');
    if (!celdas.every((k) => libre(ix.montados, k))) return no('Ya hay algo colgado ahí.');
    return { ok: true, reemplaza: [] };
  }
  if (o.pared) {
    const reemplaza = new Set<string>();
    for (const k of celdas) {
      if (hayPared(k)) reemplaza.add(idDe(ix.pared[k]!));
      if (!libre(ix.ocupa, k)) return no('Hay un objeto en esa casilla. Quítalo primero.');
      if (o.pared === 'abertura' && !libre(ix.montados, k)) return no('Hay algo colgado de esa pared. Quítalo primero.');
    }
    return { ok: true, reemplaza: [...reemplaza] };
  }
  if (o.apoyado) {
    if (celdas.some((k) => hayPared(k))) return no('No se puede apoyar sobre una pared.');
    if (!celdas.every((k) => libre(ix.apoyados, k))) return no('Ya hay algo apoyado ahí.');
    if (!opciones.sinApoyo) {
      const s = soporteDe(sala, o, x, y, orientacion, ignorar, buscar);
      if (!s.ok) return no(s.motivo);
    }
    return { ok: true, reemplaza: [] };
  }
  if (o.capa === 'suelo') {
    if (!celdas.every((k) => libre(ix.suelo, k))) return no('Ya hay una alfombra o una marca ahí.');
    return { ok: true, reemplaza: [] };
  }
  if (o.capa === 'sobre') return { ok: true, reemplaza: [] };

  if (celdas.some((k) => hayPared(k))) return no('Hay una pared en esa casilla.');
  if (!celdas.every((k) => libre(ix.ocupa, k))) return no('Esa casilla ya está ocupada.');
  return { ok: true, reemplaza: [] };
}

// ---------- ediciones ----------

function idNuevo(prefijo: string, existentes: ReadonlySet<string>): string {
  for (;;) {
    const id = prefijo + Math.floor(Math.random() * 36 ** 6).toString(36).padStart(6, '0');
    if (!existentes.has(id)) return id;
  }
}

const textoCorto = (v: unknown, max: number): string | undefined => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : undefined);

export function limpiarProps(props: Colocacion['props'] | undefined): Colocacion['props'] | undefined {
  if (!props) return undefined;
  const r: NonNullable<Colocacion['props']> = {};
  const enlace = textoCorto(props.enlace, 500);
  const texto = textoCorto(props.texto, 1000);
  const imagen = textoCorto(props.imagen, 500);
  const titulo = textoCorto(props.titulo, 80);
  if (enlace) r.enlace = enlace;
  if (texto) r.texto = texto;
  if (imagen) r.imagen = imagen;
  if (titulo) r.titulo = titulo;
  return Object.keys(r).length > 0 ? r : undefined;
}

export interface EspecColocacion {
  objeto: string;
  x: number;
  y: number;
  orientacion?: Orientacion;
  variante?: string;
  props?: Colocacion['props'];
  id?: string;
  /** Salta la regla de apoyo (mueble debajo y que quepa). Solo para mapas viejos y plantillas heredadas. */
  sinApoyo?: boolean;
}

export function colocar(sala: SalaMapa, spec: EspecColocacion, buscar: BuscarObjeto = objetoPorId): { sala: SalaMapa; colocacion: Colocacion } | Fallo {
  const o = buscar(spec.objeto);
  if (!o) return { error: 'Ese objeto no existe en el inventario.' };
  const orientacion = spec.orientacion ?? orientacionInicial(o);
  const variante = spec.variante ?? 'base';
  if (!o.variantes.some((v) => v.id === variante)) return { error: 'Ese color no existe para este objeto.' };
  const ev = evaluarColocacion(sala, o, spec.x, spec.y, orientacion, { buscar, ...(spec.sinApoyo ? { sinApoyo: true } : {}) });
  if (!ev.ok) return { error: ev.motivo };
  const existentes = new Set(sala.colocaciones.map((c) => c.id));
  if (spec.id && existentes.has(spec.id)) return { error: 'Ya existe una colocación con ese id.' };
  const c: Colocacion = { id: spec.id ?? idNuevo('c', existentes), objeto: o.id, x: spec.x, y: spec.y, orientacion, variante };
  const props = limpiarProps(spec.props);
  if (props) c.props = props;
  const quitar = new Set(ev.reemplaza);
  const colocaciones = [...sala.colocaciones.filter((p) => !quitar.has(p.id)), c];
  const puestos = quitar.size > 0 ? sala.puestos.filter((p) => !quitar.has(p.colocacion)) : sala.puestos;
  return { sala: { ...sala, colocaciones, puestos }, colocacion: c };
}

/** Quita colocaciones y lo que dependía de ellas: lo colgado de una pared que desaparece y los puestos de los asientos quitados. */
export function quitar(sala: SalaMapa, ids: readonly string[], buscar: BuscarObjeto = objetoPorId): { sala: SalaMapa; quitados: string[] } {
  const fuera = new Set(ids);
  if (fuera.size === 0) return { sala, quitados: [] };
  let actual: SalaMapa = { ...sala, colocaciones: sala.colocaciones.filter((c) => !fuera.has(c.id)) };
  if (actual.colocaciones.length === sala.colocaciones.length) return { sala, quitados: [] };
  // Lo colgado cuya pared ya no existe se va también.
  const ix = indiceDe(actual, buscar);
  const huerfanos: string[] = [];
  for (const c of actual.colocaciones) {
    const o = buscar(c.objeto);
    if (!o?.montado) continue;
    const celdas = celdasDe(huellaColocada(o, c.x, c.y, c.orientacion));
    if (!celdas.every(([x, y]) => dentro(actual, x, y) && ix.pared[y * actual.ancho + x]! >= 0)) huerfanos.push(c.id);
  }
  for (const id of huerfanos) fuera.add(id);
  if (huerfanos.length > 0) actual = { ...actual, colocaciones: actual.colocaciones.filter((c) => !fuera.has(c.id)) };
  actual = { ...actual, puestos: actual.puestos.filter((p) => !fuera.has(p.colocacion)) };
  return { sala: actual, quitados: [...fuera] };
}

/** Cambia posición y orientación de una colocación. El resto de sus datos se conserva. */
export function reubicar(sala: SalaMapa, id: string, x: number, y: number, orientacion?: Orientacion, buscar: BuscarObjeto = objetoPorId): { sala: SalaMapa; colocacion: Colocacion } | Fallo {
  const previa = sala.colocaciones.find((c) => c.id === id);
  if (!previa) return { error: 'Ese objeto ya no está.' };
  const o = buscar(previa.objeto);
  if (!o) return { error: 'Ese objeto no existe en el inventario.' };
  const nueva = orientacion ?? previa.orientacion;
  const ev = evaluarColocacion(sala, o, x, y, nueva, { ignorar: new Set([id]), buscar });
  if (!ev.ok) return { error: ev.motivo };
  const c: Colocacion = { ...previa, x, y, orientacion: nueva };
  const fuera = new Set(ev.reemplaza);
  const colocaciones = sala.colocaciones.filter((p) => !fuera.has(p.id)).map((p) => (p.id === id ? c : p));
  return { sala: { ...sala, colocaciones }, colocacion: c };
}

export function girarColocacion(sala: SalaMapa, id: string, buscar: BuscarObjeto = objetoPorId): { sala: SalaMapa; colocacion: Colocacion } | Fallo {
  const c = sala.colocaciones.find((p) => p.id === id);
  const o = c ? buscar(c.objeto) : undefined;
  if (!c || !o) return { error: 'Ese objeto ya no está.' };
  const siguiente = siguienteOrientacion(o, c.orientacion);
  if (siguiente === c.orientacion) return { error: 'Este objeto no tiene otra orientación.' };
  const r = reubicar(sala, id, c.x, c.y, siguiente, buscar);
  return esFallo(r) ? { error: 'Girado no cabe en ese lugar.' } : r;
}

export function cambiarVariante(sala: SalaMapa, id: string, variante: string, buscar: BuscarObjeto = objetoPorId): SalaMapa | Fallo {
  const c = sala.colocaciones.find((p) => p.id === id);
  const o = c ? buscar(c.objeto) : undefined;
  if (!c || !o) return { error: 'Ese objeto ya no está.' };
  if (!o.variantes.some((v) => v.id === variante)) return { error: 'Ese color no existe para este objeto.' };
  return { ...sala, colocaciones: sala.colocaciones.map((p) => (p.id === id ? { ...p, variante } : p)) };
}

export function cambiarProps(sala: SalaMapa, id: string, props: Colocacion['props']): SalaMapa | Fallo {
  if (!sala.colocaciones.some((p) => p.id === id)) return { error: 'Ese objeto ya no está.' };
  const limpio = limpiarProps(props);
  return {
    ...sala,
    colocaciones: sala.colocaciones.map((p) => {
      if (p.id !== id) return p;
      const { props: _viejo, ...resto } = p;
      return limpio ? { ...resto, props: limpio } : resto;
    }),
  };
}

// ---------- pisos ----------

export function esPiso(id: string, buscar: BuscarObjeto = objetoPorId): boolean {
  return buscar(id)?.capa === 'piso';
}

/** Pinta casillas con un piso. Con `''` las borra (queda el vacío). */
export function pintarPiso(sala: SalaMapa, celdas: ReadonlyArray<readonly [number, number]>, piso: string, buscar: BuscarObjeto = objetoPorId): SalaMapa | Fallo {
  if (piso !== '' && !esPiso(piso, buscar)) return { error: 'Ese piso no existe.' };
  const nuevas = new Map<number, string[]>();
  let cambio = false;
  for (const [x, y] of celdas) {
    if (!dentro(sala, x, y)) continue;
    const fila = nuevas.get(y) ?? [...(sala.piso[y] ?? new Array<string>(sala.ancho).fill(''))];
    if (fila[x] !== piso) {
      fila[x] = piso;
      cambio = true;
    }
    nuevas.set(y, fila);
  }
  if (!cambio) return sala;
  const filas = sala.piso.map((f, y) => nuevas.get(y) ?? f);
  return { ...sala, piso: filas };
}

export function celdasRectangulo(x1: number, y1: number, x2: number, y2: number): [number, number][] {
  const r: [number, number][] = [];
  for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) r.push([x, y]);
  return r;
}

/** Casillas conectadas (4 vecinos) que tienen el mismo piso que la de partida. Es el «bote de pintura». */
export function regionDePiso(sala: SalaMapa, x: number, y: number, max = LIMITES_MAPA.ancho * LIMITES_MAPA.alto): [number, number][] {
  if (!dentro(sala, x, y)) return [];
  const objetivo = sala.piso[y]?.[x] ?? '';
  const visto = new Uint8Array(sala.ancho * sala.alto);
  const pila: [number, number][] = [[x, y]];
  const r: [number, number][] = [];
  visto[y * sala.ancho + x] = 1;
  while (pila.length > 0 && r.length < max) {
    const [cx, cy] = pila.pop() as [number, number];
    r.push([cx, cy]);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (!dentro(sala, nx, ny)) continue;
      const k = ny * sala.ancho + nx;
      if (visto[k] || (sala.piso[ny]?.[nx] ?? '') !== objetivo) continue;
      visto[k] = 1;
      pila.push([nx, ny]);
    }
  }
  return r;
}

// ---------- líneas ----------

/** Casillas de una línea recta horizontal o vertical (la más larga de las dos manda). */
export function celdasLinea(x1: number, y1: number, x2: number, y2: number): [number, number][] {
  if (Math.abs(x2 - x1) >= Math.abs(y2 - y1)) return celdasRectangulo(x1, y1, x2, y1);
  return celdasRectangulo(x1, y1, x1, y2);
}

// ---------- zonas, llegadas, portales y puestos ----------

export function crearZona(sala: SalaMapa, datos: { nombre: string; tipo: TipoZona; rect: Zona['rect']; color?: string; enlaceTeams?: string }): { sala: SalaMapa; zona: Zona } | Fallo {
  const { x, y, w, h } = datos.rect;
  if (w < 1 || h < 1 || x < 0 || y < 0 || x + w > sala.ancho || y + h > sala.alto) return { error: 'La zona queda fuera de la oficina.' };
  const nombre = datos.nombre.trim().slice(0, 60) || 'Zona sin nombre';
  const existentes = new Set(sala.zonas.map((z) => z.id));
  const zona: Zona = { id: idNuevo('z', existentes), nombre, tipo: datos.tipo, rect: { x, y, w, h } };
  if (datos.color) zona.color = datos.color;
  if (datos.enlaceTeams?.trim()) zona.enlaceTeams = datos.enlaceTeams.trim().slice(0, 500);
  return { sala: { ...sala, zonas: [...sala.zonas, zona] }, zona };
}

export function actualizarZona(sala: SalaMapa, id: string, cambios: Partial<Omit<Zona, 'id'>>): SalaMapa | Fallo {
  const z = sala.zonas.find((p) => p.id === id);
  if (!z) return { error: 'Esa zona ya no está.' };
  const nueva: Zona = { ...z, ...cambios, nombre: (cambios.nombre ?? z.nombre).trim().slice(0, 60) || z.nombre };
  const { x, y, w, h } = nueva.rect;
  if (w < 1 || h < 1 || x < 0 || y < 0 || x + w > sala.ancho || y + h > sala.alto) return { error: 'La zona queda fuera de la oficina.' };
  if (nueva.enlaceTeams !== undefined && !nueva.enlaceTeams.trim()) delete nueva.enlaceTeams;
  return { ...sala, zonas: sala.zonas.map((p) => (p.id === id ? nueva : p)) };
}

export function quitarZona(sala: SalaMapa, id: string): SalaMapa {
  return { ...sala, zonas: sala.zonas.filter((z) => z.id !== id) };
}

/** La zona que contiene la casilla. Si hay varias, la más pequeña (la más específica). */
export function zonaEn(sala: Pick<SalaMapa, 'zonas'>, x: number, y: number): Zona | undefined {
  let mejor: Zona | undefined;
  for (const z of sala.zonas) {
    if (x < z.rect.x || y < z.rect.y || x >= z.rect.x + z.rect.w || y >= z.rect.y + z.rect.h) continue;
    if (!mejor || z.rect.w * z.rect.h < mejor.rect.w * mejor.rect.h) mejor = z;
  }
  return mejor;
}

export function alternarLlegada(sala: SalaMapa, x: number, y: number): SalaMapa | Fallo {
  if (!dentro(sala, x, y)) return { error: 'Queda fuera de la oficina.' };
  const hay = sala.llegadas.some((l) => l.x === x && l.y === y);
  if (hay) return { ...sala, llegadas: sala.llegadas.filter((l) => !(l.x === x && l.y === y)) };
  if (indiceDe(sala).bloqueo[y * sala.ancho + x]) return { error: 'Ahí no se puede aparecer: está bloqueado.' };
  if (sala.llegadas.length >= 64) return { error: 'Son demasiados puntos de llegada.' };
  return { ...sala, llegadas: [...sala.llegadas, { x, y }] };
}

export function crearPortal(sala: SalaMapa, datos: Omit<Portal, 'id'>): { sala: SalaMapa; portal: Portal } | Fallo {
  if (!dentro(sala, datos.x, datos.y)) return { error: 'Queda fuera de la oficina.' };
  const portal: Portal = { ...datos, id: idNuevo('p', new Set(sala.portales.map((p) => p.id))), etiqueta: datos.etiqueta.trim().slice(0, 60) || 'Portal' };
  return { sala: { ...sala, portales: [...sala.portales.filter((p) => !(p.x === datos.x && p.y === datos.y)), portal] }, portal };
}

export function quitarPortal(sala: SalaMapa, id: string): SalaMapa {
  return { ...sala, portales: sala.portales.filter((p) => p.id !== id) };
}

/** Asigna (o libera con `null`) el puesto de una persona en un asiento o escritorio. */
export function asignarPuesto(sala: SalaMapa, colocacion: string, usuarioId: number | null, etiqueta: string): SalaMapa | Fallo {
  if (!sala.colocaciones.some((c) => c.id === colocacion)) return { error: 'Ese lugar ya no está.' };
  const sinOtro = usuarioId === null ? sala.puestos : sala.puestos.filter((p) => p.usuarioId !== usuarioId || p.colocacion === colocacion);
  const previo = sinOtro.find((p) => p.colocacion === colocacion);
  const texto = etiqueta.trim().slice(0, 40);
  if (!previo && usuarioId === null && !texto) return sala;
  const puesto: PuestoNombrado = { id: previo?.id ?? idNuevo('u', new Set(sala.puestos.map((p) => p.id))), colocacion, usuarioId, etiqueta: texto };
  return { ...sala, puestos: [...sinOtro.filter((p) => p.colocacion !== colocacion), puesto] };
}


// ---------- áreas personales ----------

export const MAX_OBJETOS_AREA = 60;

type RectArea = AreaPersonal['rect'];

/** La huella completa del objeto cabe dentro del rectángulo del área. */
export function huellaDentroDe(h: Pick<HuellaColocada, 'x' | 'y' | 'ancho' | 'alto'>, r: RectArea): boolean {
  return h.x >= r.x && h.y >= r.y && h.x + h.ancho <= r.x + r.w && h.y + h.alto <= r.y + r.h;
}

/**
 * Lo que una persona con un área puede poner o quitar: muebles, tecnología, plantas y decoración.
 * Paredes, puertas, ventanas, pisos y portales siguen siendo de quien administra la oficina.
 */
export function objetoPermitidoEnArea(o: ObjetoCatalogo): boolean {
  return o.categoria !== 'paredes' && o.categoria !== 'pisos' && o.capa !== 'piso' && !o.autotile && !o.pared && !o.montado && o.interaccion !== 'portal' && o.interaccion !== 'puerta';
}

/** Las áreas (con su sala) que una cuenta puede editar. */
export function areasDeUsuario(mapa: MapaOficina, usuarioId: number): { sala: SalaMapa; area: AreaPersonal }[] {
  const r: { sala: SalaMapa; area: AreaPersonal }[] = [];
  for (const sala of mapa.salas) for (const area of sala.areas ?? []) if (area.duenos.includes(usuarioId)) r.push({ sala, area });
  return r;
}

/** Objetos que la persona puede cambiar: están enteros dentro del área, son de los permitidos y no son su puesto asignado. */
export function colocacionesEditablesDeArea(sala: SalaMapa, area: AreaPersonal, buscar: BuscarObjeto = objetoPorId): Colocacion[] {
  const fijas = new Set(sala.puestos.map((p) => p.colocacion));
  return sala.colocaciones.filter((c) => {
    const o = buscar(c.objeto);
    return Boolean(o && objetoPermitidoEnArea(o) && !fijas.has(c.id) && huellaDentroDe(huellaColocada(o, c.x, c.y, c.orientacion), area.rect));
  });
}

/**
 * Reemplaza lo editable del área por la lista nueva y deja todo lo demás igual. Falla con un mensaje claro si algo
 * no está permitido, queda fuera del área o no cabe.
 */
export function aplicarEdicionDeArea(
  sala: SalaMapa,
  area: AreaPersonal,
  nuevas: ReadonlyArray<{ id?: string; objeto: string; x: number; y: number; orientacion: Orientacion; variante: string; props?: Colocacion['props'] }>,
  buscar: BuscarObjeto = objetoPorId,
): { sala: SalaMapa } | Fallo {
  if (nuevas.length > MAX_OBJETOS_AREA) return { error: `Un área admite hasta ${MAX_OBJETOS_AREA} objetos.` };
  const quitar = new Set(colocacionesEditablesDeArea(sala, area, buscar).map((c) => c.id));
  let actual: SalaMapa = { ...sala, colocaciones: sala.colocaciones.filter((c) => !quitar.has(c.id)) };
  const prueba = nuevas.map((n) => ({ n, o: buscar(n.objeto) }));
  // Lo apoyado va al final: necesita que el escritorio ya esté.
  prueba.sort((a, b) => Number(Boolean(a.o?.apoyado)) - Number(Boolean(b.o?.apoyado)));
  for (const { n, o } of prueba) {
    if (!o) return { error: `El objeto «${n.objeto}» no existe.` };
    if (!objetoPermitidoEnArea(o)) return { error: `${o.nombre} no se puede poner en un área personal.` };
    if (!orientacionValida(o, n.orientacion)) return { error: `${o.nombre} no admite esa orientación.` };
    if (!huellaDentroDe(huellaColocada(o, n.x, n.y, n.orientacion), area.rect)) return { error: `${o.nombre} queda fuera de tu área.` };
    const r = colocar(actual, { ...(n.id ? { id: n.id } : {}), objeto: n.objeto, x: n.x, y: n.y, orientacion: n.orientacion, variante: n.variante, ...(n.props ? { props: n.props } : {}) }, buscar);
    if (esFallo(r)) return { error: `${o.nombre}: ${r.error}` };
    actual = r.sala;
  }
  return { sala: actual };
}

const igual = (a: unknown, b: unknown): boolean => a === b || JSON.stringify(a) === JSON.stringify(b);

/**
 * Revisa que el paso de `antes` a `despues` solo toque objetos permitidos dentro del área. Devuelve el motivo si no.
 * Sirve para la interfaz (rechaza el gesto en el acto) y como segunda barrera.
 */
export function cambioSoloDentroDelArea(antes: SalaMapa, despues: SalaMapa, area: AreaPersonal, buscar: BuscarObjeto = objetoPorId): string | null {
  const fuera = 'Solo puedes cambiar tu área.';
  if (!igual(antes.piso, despues.piso) || !igual(antes.zonas, despues.zonas) || !igual(antes.llegadas, despues.llegadas) || !igual(antes.portales, despues.portales) || !igual(antes.puestos, despues.puestos) || !igual(antes.areas, despues.areas)) return fuera;
  if (antes.ancho !== despues.ancho || antes.alto !== despues.alto) return fuera;
  const fijas = new Set(antes.puestos.map((p) => p.colocacion));
  const editable = (c: Colocacion, esAntes: boolean): boolean => {
    const o = buscar(c.objeto);
    if (!o || !objetoPermitidoEnArea(o)) return false;
    if (esAntes && fijas.has(c.id)) return false;
    return huellaDentroDe(huellaColocada(o, c.x, c.y, c.orientacion), area.rect);
  };
  const previas = new Map(antes.colocaciones.map((c) => [c.id, c]));
  const nuevas = new Map(despues.colocaciones.map((c) => [c.id, c]));
  for (const [id, c] of previas) {
    const n = nuevas.get(id);
    if (n && igual(c, n)) continue;
    if (!editable(c, true)) return fuera;
    if (n && !editable(n, false)) return fuera;
  }
  for (const [id, c] of nuevas) if (!previas.has(id) && !editable(c, false)) return fuera;
  return null;
}

export function crearArea(sala: SalaMapa, datos: { nombre: string; rect: RectArea; duenos?: number[] }): { sala: SalaMapa; area: AreaPersonal } | Fallo {
  const { x, y, w, h } = datos.rect;
  if (w < 1 || h < 1 || x < 0 || y < 0 || x + w > sala.ancho || y + h > sala.alto) return { error: 'El área queda fuera de la sala.' };
  const nombre = datos.nombre.trim().slice(0, 60);
  if (!nombre) return { error: 'El área necesita un nombre.' };
  const areas = sala.areas ?? [];
  if (areas.length >= 300) return { error: 'La sala llegó al máximo de áreas.' };
  const area: AreaPersonal = { id: idNuevo('a', new Set(areas.map((a) => a.id))), nombre, rect: { x, y, w, h }, duenos: [...new Set(datos.duenos ?? [])] };
  return { sala: { ...sala, areas: [...areas, area] }, area };
}

export function actualizarArea(sala: SalaMapa, id: string, cambios: Partial<Omit<AreaPersonal, 'id'>>): SalaMapa | Fallo {
  const areas = sala.areas ?? [];
  const previa = areas.find((a) => a.id === id);
  if (!previa) return { error: 'Esa área ya no existe.' };
  const nueva: AreaPersonal = { ...previa, ...cambios, id };
  nueva.nombre = nueva.nombre.trim().slice(0, 60) || previa.nombre;
  nueva.duenos = [...new Set(nueva.duenos)];
  const { x, y, w, h } = nueva.rect;
  if (w < 1 || h < 1 || x < 0 || y < 0 || x + w > sala.ancho || y + h > sala.alto) return { error: 'El área queda fuera de la sala.' };
  return { ...sala, areas: areas.map((a) => (a.id === id ? nueva : a)) };
}

export function quitarArea(sala: SalaMapa, id: string): SalaMapa {
  return { ...sala, areas: (sala.areas ?? []).filter((a) => a.id !== id) };
}

// ---------- asientos ----------

export interface Asiento {
  colocacion: string;
  x: number;
  y: number;
  mira: Direccion;
  /** Asiento sin frente (puff, taburete, banco redondo, sillón sin orientación): se usa entrando desde cualquier lado. */
  sinFrente?: boolean;
}

/** Las casillas (en coordenadas de la sala) donde alguien puede sentarse en un objeto «sentarse». */
export function celdasDeAsiento(o: ObjetoCatalogo, c: { x: number; y: number }, h: ReturnType<typeof huellaColocada>): [number, number][] {
  if (o.interaccion !== 'sentarse') return [];
  if (o.asiento) return [[c.x + o.asiento.dx, c.y + o.asiento.dy]];
  return celdasDe(h);
}

/** Todos los asientos de la sala. Cada casilla de un objeto «sentarse» es un asiento y mira hacia su orientación. */
export function asientosDe(sala: SalaMapa, buscar: BuscarObjeto = objetoPorId): Asiento[] {
  const r: Asiento[] = [];
  for (const c of sala.colocaciones) {
    const o = buscar(c.objeto);
    if (!o || o.interaccion !== 'sentarse') continue;
    const h = huellaColocada(o, c.x, c.y, c.orientacion);
    const mira: Direccion = c.orientacion === 'U' ? 'S' : c.orientacion;
    // Sin orientaciones que elegir (solo 'U') no hay frente: se usa desde cualquier lado.
    const sinFrente = o.orientaciones.length <= 1 && !o.asiento;
    if (o.asiento) {
      r.push({ colocacion: c.id, x: c.x + o.asiento.dx, y: c.y + o.asiento.dy, mira: o.asiento.mira });
      continue;
    }
    for (const [x, y] of celdasDe(h)) r.push(sinFrente ? { colocacion: c.id, x, y, mira, sinFrente: true } : { colocacion: c.id, x, y, mira });
  }
  return r;
}

const VECINOS: ReadonlyArray<readonly [number, number]> = [[0, -1], [1, 0], [0, 1], [-1, 0]];

/** Casillas libres junto al asiento desde las que alguien puede sentarse o a las que se levanta. */
export function accesosDeAsiento(sala: SalaMapa, x: number, y: number): [number, number][] {
  const ix = indiceDe(sala);
  const r: [number, number][] = [];
  for (const [dx, dy] of VECINOS) {
    const nx = x + dx;
    const ny = y + dy;
    if (dentro(sala, nx, ny) && !ix.bloqueo[ny * sala.ancho + nx]) r.push([nx, ny]);
  }
  return r;
}

// ---------- conectividad ----------

/** Casillas que se alcanzan caminando desde un punto. */
export function alcanzables(sala: SalaMapa, desde: ReadonlyArray<{ x: number; y: number }>): Uint8Array {
  const ix = indiceDe(sala);
  const visto = new Uint8Array(sala.ancho * sala.alto);
  const pila: number[] = [];
  for (const p of desde) {
    if (!dentro(sala, p.x, p.y)) continue;
    const k = p.y * sala.ancho + p.x;
    if (!ix.bloqueo[k] && !visto[k]) {
      visto[k] = 1;
      pila.push(k);
    }
  }
  while (pila.length > 0) {
    const k = pila.pop() as number;
    const x = k % sala.ancho;
    const y = (k - x) / sala.ancho;
    for (const [dx, dy] of VECINOS) {
      const nx = x + dx;
      const ny = y + dy;
      if (!dentro(sala, nx, ny)) continue;
      const nk = ny * sala.ancho + nx;
      if (ix.bloqueo[nk] || visto[nk]) continue;
      visto[nk] = 1;
      pila.push(nk);
    }
  }
  return visto;
}

// ---------- validación ----------

export interface Problema {
  nivel: 'error' | 'aviso';
  codigo: string;
  mensaje: string;
  sala?: string;
  x?: number;
  y?: number;
  colocacion?: string;
  /** El panel Revisión ofrece «Arreglar» cuando esto viene: `apoyado` lo vuelve a poner sobre una mesa, `silla` la acerca a la mesa más cercana. */
  arreglo?: 'apoyado' | 'silla';
}

const ENLACE_OK = /^https:\/\/[^\s]+$/i;

export function validarMapa(mapa: MapaOficina, buscar: BuscarObjeto = objetoPorId): Problema[] {
  const p: Problema[] = [];
  const err = (codigo: string, mensaje: string, extra: Partial<Problema> = {}) => p.push({ nivel: 'error', codigo, mensaje, ...extra });
  const avi = (codigo: string, mensaje: string, extra: Partial<Problema> = {}) => p.push({ nivel: 'aviso', codigo, mensaje, ...extra });

  if (mapa.salas.length === 0) {
    err('sin_salas', 'La oficina no tiene ninguna sala.');
    return p;
  }
  if (mapa.salas.length > LIMITES_MAPA.salas) err('demasiadas_salas', `Máximo ${LIMITES_MAPA.salas} salas.`);
  const idsSala = new Set<string>();
  for (const s of mapa.salas) {
    if (idsSala.has(s.id)) err('sala_repetida', `Hay dos salas con el id «${s.id}».`, { sala: s.id });
    idsSala.add(s.id);
  }
  if (!idsSala.has(mapa.salaInicial)) err('sala_inicial', 'La sala de entrada no existe.');

  for (const s of mapa.salas) {
    const en = { sala: s.id };
    if (s.ancho < 4 || s.alto < 4 || s.ancho > LIMITES_MAPA.ancho || s.alto > LIMITES_MAPA.alto) {
      err('medidas', `«${s.nombre}» mide ${s.ancho}x${s.alto}: debe estar entre 4 y ${LIMITES_MAPA.ancho} casillas por lado.`, en);
      continue;
    }
    if (s.piso.length !== s.alto || s.piso.some((f) => f.length !== s.ancho)) {
      err('piso_medidas', `El piso de «${s.nombre}» no coincide con sus medidas.`, en);
      continue;
    }
    if (s.colocaciones.length > LIMITES_MAPA.colocaciones) err('demasiados_objetos', `«${s.nombre}» pasa del máximo de ${LIMITES_MAPA.colocaciones} objetos.`, en);

    for (let y = 0; y < s.alto; y++) {
      for (let x = 0; x < s.ancho; x++) {
        const id = s.piso[y]![x]!;
        if (id && !esPiso(id, buscar)) err('piso_desconocido', `Piso desconocido «${id}».`, { ...en, x, y });
      }
    }

    const ids = new Set<string>();
    for (const c of s.colocaciones) {
      const donde = { ...en, x: c.x, y: c.y, colocacion: c.id };
      if (ids.has(c.id)) err('id_repetido', `Dos objetos comparten el id «${c.id}».`, donde);
      ids.add(c.id);
      const o = buscar(c.objeto);
      if (!o) {
        err('objeto_desconocido', `El objeto «${c.objeto}» ya no existe en el inventario.`, donde);
        continue;
      }
      if (!orientacionValida(o, c.orientacion)) err('orientacion', `${o.nombre} tiene una orientación que no admite.`, donde);
      if (!o.variantes.some((v) => v.id === c.variante)) err('variante', `${o.nombre} tiene un color que no existe.`, donde);
      const h = huellaColocada(o, c.x, c.y, c.orientacion);
      if (c.x < 0 || c.y < 0 || c.x + h.ancho > s.ancho || c.y + h.alto > s.alto) err('fuera', `${o.nombre} queda fuera de la oficina.`, donde);
      if (c.props?.enlace && !ENLACE_OK.test(c.props.enlace)) err('enlace', `${o.nombre} tiene un enlace que no empieza por https://.`, donde);
      if (c.props?.imagen && !ENLACE_OK.test(c.props.imagen)) err('imagen', `${o.nombre} tiene una imagen que no empieza por https://.`, donde);
      if (o.interaccion === 'enlace' && !c.props?.enlace) avi('enlace_vacio', `${o.nombre} no tiene enlace todavía.`, donde);
      if (o.interaccion === 'nota' && !c.props?.texto) avi('nota_vacia', `${o.nombre} no tiene texto todavía.`, donde);
      if (o.interaccion === 'teams' && !c.props?.enlace) avi('teams_vacio', `${o.nombre} no tiene enlace de reunión de Teams todavía.`, donde);
    }
    const ix = indiceDe(s, buscar);
    // Objetos sobre casillas sin piso.
    for (const c of s.colocaciones) {
      const o = buscar(c.objeto);
      if (!o) continue;
      const sinPiso = celdasDe(huellaColocada(o, c.x, c.y, c.orientacion)).some(([x, y]) => dentro(s, x, y) && !ix.hayPiso[y * s.ancho + x]);
      if (sinPiso) avi('sin_piso', `${o.nombre} está sobre una casilla sin piso.`, { ...en, x: c.x, y: c.y, colocacion: c.id });
    }

    avisosDeRealismo(s, ix, buscar, avi);

    const idsZona = new Set<string>();
    for (const z of s.zonas) {
      if (idsZona.has(z.id)) err('zona_repetida', `Dos zonas comparten el id «${z.id}».`, en);
      idsZona.add(z.id);
      const { x, y, w, h } = z.rect;
      if (w < 1 || h < 1 || x < 0 || y < 0 || x + w > s.ancho || y + h > s.alto) err('zona_fuera', `La zona «${z.nombre}» queda fuera de la oficina.`, { ...en, x, y });
      if (z.enlaceTeams && !ENLACE_OK.test(z.enlaceTeams)) err('zona_enlace', `La zona «${z.nombre}» tiene un enlace de Teams que no empieza por https://.`, { ...en, x, y });
      // Una sala sin enlace de Teams es válida: la barra de la sala cae en el mismo flujo del botón de Teams (llamar a quienes están dentro).
    }

    const idsArea = new Set<string>();
    const areas = s.areas ?? [];
    for (const a of areas) {
      if (idsArea.has(a.id)) err('area_repetida', `Dos áreas comparten el id «${a.id}».`, en);
      idsArea.add(a.id);
      const { x, y, w, h } = a.rect;
      if (w < 1 || h < 1 || x < 0 || y < 0 || x + w > s.ancho || y + h > s.alto) err('area_fuera', `El área «${a.nombre}» queda fuera de la sala.`, { ...en, x, y });
      if (a.duenos.some((d) => !Number.isInteger(d) || d < 1)) err('area_duenos', `El área «${a.nombre}» tiene un dueño que no es válido.`, { ...en, x, y });
    }
    for (let i = 0; i < areas.length; i++) {
      for (let j = i + 1; j < areas.length; j++) {
        const a = areas[i]!;
        const b = areas[j]!;
        const cruza = a.rect.x < b.rect.x + b.rect.w && b.rect.x < a.rect.x + a.rect.w && a.rect.y < b.rect.y + b.rect.h && b.rect.y < a.rect.y + a.rect.h;
        if (cruza && a.duenos.length > 0 && b.duenos.length > 0) avi('areas_cruzadas', `Las áreas «${a.nombre}» y «${b.nombre}» se cruzan: en lo que comparten pueden editar las dos personas.`, { ...en, x: a.rect.x, y: a.rect.y });
      }
    }

    for (const l of s.llegadas) {
      if (!dentro(s, l.x, l.y) || ix.bloqueo[l.y * s.ancho + l.x]) err('llegada_bloqueada', `Un punto de llegada está en una casilla bloqueada (${l.x}, ${l.y}).`, { ...en, x: l.x, y: l.y });
    }
    if (s.llegadas.length === 0) {
      if (s.id === mapa.salaInicial) err('sin_llegadas', `«${s.nombre}» es la sala de entrada y no tiene puntos de llegada.`, en);
      else avi('sin_llegadas', `«${s.nombre}» no tiene puntos de llegada.`, en);
    }

    for (const portal of s.portales) {
      const destino = mapa.salas.find((o) => o.id === portal.destinoSala);
      if (!destino) {
        err('portal_destino', `El portal «${portal.etiqueta}» lleva a una sala que no existe.`, { ...en, x: portal.x, y: portal.y });
        continue;
      }
      if (!dentro(destino, portal.destinoX, portal.destinoY)) err('portal_fuera', `El portal «${portal.etiqueta}» llega fuera de «${destino.nombre}».`, { ...en, x: portal.x, y: portal.y });
    }

    for (const pu of s.puestos) {
      if (!ids.has(pu.colocacion)) err('puesto_huerfano', `El puesto «${pu.etiqueta}» apunta a un objeto que ya no está.`, en);
    }

    // Lugares a los que nadie podría llegar caminando desde la entrada.
    if (s.llegadas.length > 0 && p.every((q) => q.sala !== s.id || q.nivel !== 'error')) {
      const alc = alcanzables(s, s.llegadas);
      const aislados = asientosDe(s, buscar).filter((a) => !alc[a.y * s.ancho + a.x]);
      const primero = aislados[0];
      if (primero) {
        const cuantos = new Set(aislados.map((a) => a.colocacion)).size;
        avi('asiento_inalcanzable', cuantos === 1 ? 'Hay un asiento al que no se puede llegar caminando.' : `Hay ${cuantos} asientos a los que no se puede llegar caminando.`, { ...en, x: primero.x, y: primero.y, colocacion: primero.colocacion });
      }
    }
  }
  return p;
}

const ES_BANO = /ba[ñn]o|sanitari|\bwc\b/i;
const ES_SANITARIO = /^(sanitario|urinario|inodoro|retrete)/;
/** Los sanitarios que van en cubículo (el urinario no). */
const ES_SANITARIO_CERRADO = /^(sanitario|inodoro|retrete)/;

/** Revisión de realismo: todo son avisos (no impiden publicar). Mapas viejos con cosas mal armadas siguen abriendo. */
function avisosDeRealismo(s: SalaMapa, ix: IndiceSala, buscar: BuscarObjeto, avi: (codigo: string, mensaje: string, extra?: Partial<Problema>) => void): void {
  const en = { sala: s.id };
  const mesas = s.colocaciones.flatMap((c) => {
    const o = buscar(c.objeto);
    return o && esMesaParaSillas(o) ? [huellaColocada(o, c.x, c.y, c.orientacion)] : [];
  });
  for (const c of s.colocaciones) {
    const o = buscar(c.objeto);
    if (!o) continue;
    const donde = { ...en, x: c.x, y: c.y, colocacion: c.id };
    const h = huellaColocada(o, c.x, c.y, c.orientacion);
    if (o.apoyado && !o.montado) {
      const r = soporteDe(s, o, c.x, c.y, c.orientacion, new Set([c.id]), buscar);
      if (!r.ok) {
        const arreglable = reubicarApoyado(s, c, buscar) !== null;
        const base = r.sinMueble ? `${o.nombre} no tiene ninguna mesa debajo.` : `${o.nombre} no cabe sobre esta mesa.`;
        avi(r.sinMueble ? 'apoyado_sin_mueble' : 'apoyado_no_cabe', base, { ...donde, ...(arreglable ? { arreglo: 'apoyado' as const } : {}) });
      }
    }
    if (esSillaDeMesa(o) && !mesas.some((m) => ladoPegado(m, c.x, c.y) !== null)) {
      const arreglable = arreglarSilla(s, c, buscar) !== null;
      avi('silla_suelta', `${o.nombre} está suelta: no hay una mesa o un escritorio pegado.`, { ...donde, ...(arreglable ? { arreglo: 'silla' as const } : {}) });
    }
    if (o.montado && !o.apoyado) {
      const sinPared = celdasDe(h).some(([x, y]) => !dentro(s, x, y) || ix.pared[y * s.ancho + x]! < 0);
      if (sinPared) avi('montado_sin_pared', `${o.nombre} va sobre una pared y no tiene pared detrás.`, donde);
    }
    if (ES_SANITARIO.test(o.id)) {
      // Lo colgado (el urinario) está en la casilla de la pared: se mira la casilla de piso que tiene delante.
      const px = o.montado ? c.x + (c.orientacion === 'E' ? 1 : c.orientacion === 'O' ? -1 : 0) : c.x;
      const py = o.montado ? c.y + (c.orientacion === 'S' ? 1 : 0) : c.y;
      const enBano = s.zonas.some((z) => ES_BANO.test(z.nombre) && px >= z.rect.x && py >= z.rect.y && px < z.rect.x + z.rect.w && py < z.rect.y + z.rect.h);
      if (!enBano) avi('sanitario_fuera_de_bano', `${o.nombre} está fuera de una zona de baño. Crea una zona llamada «Baño» alrededor.`, donde);
      else if (ES_SANITARIO_CERRADO.test(o.id)) {
        // Cubículo: pared o divisor a los dos lados del sanitario (a izquierda y derecha si mira al sur o al norte; arriba y abajo si mira al este u oeste).
        const lados: [number, number][] = c.orientacion === 'E' || c.orientacion === 'O' ? [[c.x, c.y - 1], [c.x, c.y + 1]] : [[c.x - 1, c.y], [c.x + 1, c.y]];
        const cerrado = lados.every(([x, y]) => dentro(s, x, y) && ix.pared[y * s.ancho + x]! >= 0);
        if (!cerrado) avi('sanitario_sin_cubiculo', `${o.nombre} no tiene cubículo: pon un divisor o una pared a cada lado.`, donde);
      }
    }
  }
  // Casillas libres a las que nadie llegaría caminando desde un punto de llegada.
  if (s.llegadas.length > 0) {
    const alc = alcanzables(s, s.llegadas);
    let n = 0;
    let primera: [number, number] | null = null;
    for (let y = 0; y < s.alto; y++) {
      for (let x = 0; x < s.ancho; x++) {
        const k = y * s.ancho + x;
        if (ix.bloqueo[k] || alc[k]) continue;
        n++;
        primera ??= [x, y];
      }
    }
    if (primera) avi('casilla_encerrada', n === 1 ? 'Hay una casilla libre encerrada: nadie puede llegar a ella caminando.' : `Hay ${n} casillas libres encerradas: nadie puede llegar a ellas caminando.`, { ...en, x: primera[0], y: primera[1] });
  }
}

export const hayErrores = (problemas: readonly Problema[]): boolean => problemas.some((q) => q.nivel === 'error');

// ---------- creación ----------

export function salaVacia(id: string, nombre: string, ancho: number, alto: number): SalaMapa {
  return {
    id,
    nombre,
    ancho,
    alto,
    piso: Array.from({ length: alto }, () => new Array<string>(ancho).fill('')),
    colocaciones: [],
    zonas: [],
    puestos: [],
    llegadas: [],
    portales: [],
  };
}

export function mapaVacio(nombre = 'Oficina'): MapaOficina {
  return { version: 1, nombre, salaInicial: 'principal', salas: [salaVacia('principal', 'Planta principal', 40, 28)] };
}

/** Construye salas con instrucciones cortas. Lanza si algo no cabe: sirve para el mapa de ejemplo y para las pruebas. */
export class ConstructorSala {
  private sala: SalaMapa;
  private contador = 0;
  private apoyoEstricto = false;

  constructor(id: string, nombre: string, ancho: number, alto: number) {
    this.sala = salaVacia(id, nombre, ancho, alto);
  }

  /**
   * Activa la regla de apoyo: lo apoyado exige un mueble con tapa debajo y que quepa en ella (lanza si no). Las plantillas
   * viejas se construyeron sin esta regla y siguen sin ella; las nuevas deben llamarlo antes de poner objetos.
   */
  estricto(activo = true): this {
    this.apoyoEstricto = activo;
    return this;
  }

  piso(x: number, y: number, w: number, h: number, piso: string): this {
    const r = pintarPiso(this.sala, celdasRectangulo(x, y, x + w - 1, y + h - 1), piso);
    if (esFallo(r)) throw new Error(`piso(${x},${y}): ${r.error}`);
    this.sala = r;
    return this;
  }

  /** Línea recta de muros (o de otra pieza de pared) entre dos casillas, ambas incluidas. */
  muro(x1: number, y1: number, x2: number, y2: number, objeto = 'pared-lisa', variante = 'base'): this {
    for (const [x, y] of celdasLinea(x1, y1, x2, y2)) this.poner(objeto, x, y, 'U', variante);
    return this;
  }

  poner(objeto: string, x: number, y: number, orientacion?: Orientacion, variante = 'base', props?: Colocacion['props']): this {
    const r = colocar(this.sala, { objeto, x, y, orientacion, variante, props, id: `i${++this.contador}`, ...(this.apoyoEstricto ? {} : { sinApoyo: true }) });
    if (esFallo(r)) throw new Error(`${objeto} en (${x},${y}): ${r.error}`);
    this.sala = r.sala;
    return this;
  }

  /** Última colocación puesta: para asignarle algo después. */
  ultima(): Colocacion {
    return this.sala.colocaciones[this.sala.colocaciones.length - 1] as Colocacion;
  }

  zona(nombre: string, tipo: TipoZona, x: number, y: number, w: number, h: number, extra: { color?: string; enlaceTeams?: string } = {}): this {
    const r = crearZona(this.sala, { nombre, tipo, rect: { x, y, w, h }, ...extra });
    if (esFallo(r)) throw new Error(`zona ${nombre}: ${r.error}`);
    this.sala = r.sala;
    return this;
  }

  /** Un área personal. Los dueños se asignan después desde el editor, con las cuentas reales. */
  area(nombre: string, x: number, y: number, w: number, h: number, duenos: number[] = []): this {
    const r = crearArea(this.sala, { nombre, rect: { x, y, w, h }, duenos });
    if (esFallo(r)) throw new Error(`área ${nombre}: ${r.error}`);
    this.sala = r.sala;
    return this;
  }

  llegadas(...puntos: PuntoLlegada[]): this {
    for (const pt of puntos) {
      const r = alternarLlegada(this.sala, pt.x, pt.y);
      if (esFallo(r)) throw new Error(`llegada (${pt.x},${pt.y}): ${r.error}`);
      this.sala = r;
    }
    return this;
  }

  puesto(colocacion: string, etiqueta: string): this {
    const r = asignarPuesto(this.sala, colocacion, null, etiqueta);
    if (esFallo(r)) throw new Error(`puesto: ${r.error}`);
    this.sala = r;
    return this;
  }

  /**
   * «Poner sillas alrededor»: sillas pegadas a la mesa, orientadas hacia ella, centradas y simétricas (ver `sillas.ts`).
   * Sin `mesa`, usa la última colocación puesta. Las casillas con pared, puerta u otro objeto se omiten sin error.
   */
  sillasAlrededor(opciones: OpcionesSillas = {}, mesa?: string): this {
    const id = mesa ?? this.ultima().id;
    const r = sillasAlrededorDe(this.sala, id, { ids: () => `i${++this.contador}`, ...opciones });
    if (esFallo(r)) throw new Error(`sillasAlrededor(${id}): ${r.error}`);
    this.sala = r.sala;
    return this;
  }

  construir(): SalaMapa {
    return this.sala;
  }
}

// ---------- formato compacto para guardar y enviar ----------

const ALFABETO = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

export interface SalaGuardada extends Omit<SalaMapa, 'piso'> {
  /** Índice 0 es siempre «sin piso». */
  paleta: string[];
  /** Una cadena por fila: un carácter por casilla, el índice en la paleta. */
  filas: string[];
}

export interface MapaGuardado extends Omit<MapaOficina, 'salas'> {
  salas: SalaGuardada[];
}

export function comprimirMapa(m: MapaOficina): MapaGuardado {
  return {
    ...m,
    salas: m.salas.map((s) => {
      const { piso, ...resto } = s;
      const paleta = [''];
      const filas = piso.map((fila) =>
        fila
          .map((id) => {
            let i = paleta.indexOf(id);
            if (i < 0) {
              i = paleta.length;
              paleta.push(id);
            }
            return ALFABETO[Math.min(i, ALFABETO.length - 1)] ?? '0';
          })
          .join(''),
      );
      return { ...resto, paleta, filas };
    }),
  };
}

export function descomprimirMapa(g: MapaGuardado): MapaOficina {
  return {
    ...g,
    salas: g.salas.map((s) => {
      const { paleta, filas, ...resto } = s;
      const piso = filas.map((f) => [...f].map((ch) => paleta[ALFABETO.indexOf(ch)] ?? ''));
      return { ...resto, piso };
    }),
  };
}

export const PIXELES_SALA = (s: Pick<SalaMapa, 'ancho' | 'alto'>) => ({ ancho: s.ancho * CASILLA, alto: s.alto * CASILLA });
