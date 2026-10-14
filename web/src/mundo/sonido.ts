import { CASILLA, CICLO_CAMINAR } from '@ol/shared';

/**
 * Lógica pura del sonido de la oficina (sin Web Audio ni Phaser, para probarla): qué efectos hay, en qué ajuste cae cada uno, el material
 * de los pasos según el piso, la cadencia de los pasos con el ciclo de caminar de 4 cuadros, el volumen y el paneo de las demás personas,
 * el límite de voces y los ajustes guardados en el navegador. El motor de audio sintetizado está en `sonido-audio.ts`.
 */

// ---------- efectos y ajustes ----------

export type Efecto =
  | 'paso'
  | 'sentar-blando'
  | 'sentar-duro'
  | 'levantar-blando'
  | 'levantar-duro'
  | 'puerta-abre'
  | 'puerta-cierra'
  | 'reaccion'
  | 'mensaje'
  | 'aviso'
  | 'entra'
  | 'sale'
  | 'enfoque-fin'
  | 'sala-entra'
  | 'sala-sale';

/** Los tres interruptores de Configuración. */
export type CategoriaSonido = 'pasos' | 'asientos' | 'avisos';

export const CATEGORIA_DE_EFECTO: Record<Efecto, CategoriaSonido> = {
  paso: 'pasos',
  'sentar-blando': 'asientos',
  'sentar-duro': 'asientos',
  'levantar-blando': 'asientos',
  'levantar-duro': 'asientos',
  'puerta-abre': 'asientos',
  'puerta-cierra': 'asientos',
  reaccion: 'avisos',
  mensaje: 'avisos',
  aviso: 'avisos',
  entra: 'avisos',
  sale: 'avisos',
  'enfoque-fin': 'avisos',
  'sala-entra': 'avisos',
  'sala-sale': 'avisos',
};

export interface AjustesSonido {
  /** 0 a 100. */
  volumen: number;
  pasos: boolean;
  asientos: boolean;
  avisos: boolean;
}

export const AJUSTES_POR_DEFECTO: AjustesSonido = { volumen: 50, pasos: true, asientos: true, avisos: true };
export const CLAVE_AJUSTES_SONIDO = 'ol_sonido';

const acotar = (n: number, a: number, b: number): number => Math.min(b, Math.max(a, n));

/** Lee los ajustes guardados; lo que falte o venga raro vuelve a su valor por defecto. */
export function leerAjustesSonido(almacen: Pick<Storage, 'getItem'> | null): AjustesSonido {
  try {
    const crudo = almacen?.getItem(CLAVE_AJUSTES_SONIDO);
    if (!crudo) return { ...AJUSTES_POR_DEFECTO };
    const o = JSON.parse(crudo) as Partial<Record<keyof AjustesSonido, unknown>>;
    const b = (v: unknown, d: boolean): boolean => (typeof v === 'boolean' ? v : d);
    const v = typeof o.volumen === 'number' && Number.isFinite(o.volumen) ? Math.round(acotar(o.volumen, 0, 100)) : AJUSTES_POR_DEFECTO.volumen;
    return { volumen: v, pasos: b(o.pasos, true), asientos: b(o.asientos, true), avisos: b(o.avisos, true) };
  } catch {
    return { ...AJUSTES_POR_DEFECTO };
  }
}

export function guardarAjustesSonido(almacen: Pick<Storage, 'setItem'> | null, a: AjustesSonido): void {
  try {
    almacen?.setItem(CLAVE_AJUSTES_SONIDO, JSON.stringify(a));
  } catch {
    /* sin almacenamiento: dura hasta recargar */
  }
}

/** Ganancia final (0 a 1) de un efecto: volumen general (curva cuadrática, más natural al oído) si su interruptor está activo; si no, 0. */
export function gananciaDe(a: AjustesSonido, e: Efecto): number {
  if (!a[CATEGORIA_DE_EFECTO[e]]) return 0;
  const v = acotar(a.volumen, 0, 100) / 100;
  return v * v;
}

/** Almacén de los ajustes con suscripción (para `useSyncExternalStore` y para el motor). */
export class AlmacenAjustesSonido {
  private actual: AjustesSonido;
  private readonly oyentes = new Set<() => void>();
  constructor(private readonly almacen: (Pick<Storage, 'getItem' | 'setItem'>) | null) {
    this.actual = leerAjustesSonido(almacen);
  }
  leer = (): AjustesSonido => this.actual;
  fijar(parcial: Partial<AjustesSonido>): void {
    const sig = { ...this.actual, ...parcial };
    if (typeof parcial.volumen === 'number') sig.volumen = Math.round(acotar(parcial.volumen, 0, 100));
    this.actual = sig;
    guardarAjustesSonido(this.almacen, sig);
    for (const o of this.oyentes) o();
  }
  suscribir = (f: () => void): (() => void) => {
    this.oyentes.add(f);
    return () => this.oyentes.delete(f);
  };
}

// ---------- cuándo puede sonar ----------

export interface ContextoSonido {
  /** `document.visibilityState === 'visible'`. */
  paginaVisible: boolean;
  /** Modo de rendimiento de Configuración. */
  rendimiento: 'calidad' | 'equilibrado' | 'eficiente' | string;
  /** La vista esquemática está a la vista (círculos en lugar de personajes): en silencio. */
  esquema: boolean;
}

/** Sin sonido con la pestaña oculta, en el modo Eficiente ni en la vista esquemática. */
export const puedeSonar = (c: ContextoSonido): boolean => c.paginaVisible && c.rendimiento !== 'eficiente' && !c.esquema;

// ---------- pasos ----------

export type Material = 'madera' | 'baldosa' | 'alfombra' | 'cemento' | 'deck' | 'pasto';

/** El material de los pasos según el id del piso (`piso-*`). Lo desconocido suena a baldosa. */
export function materialDePiso(id: string | null | undefined): Material {
  const n = id ?? '';
  if (/madera|parquet/.test(n)) return 'madera';
  if (/alfombra/.test(n)) return 'alfombra';
  if (/cemento/.test(n)) return 'cemento';
  if (/deck/.test(n)) return 'deck';
  if (/cesped|pasto/.test(n)) return 'pasto';
  return 'baldosa';
}

/** Los cuadros de la hoja en los que el pie toca el suelo: los de contacto (índices 0 y 2 del ciclo de 4 cuadros). */
export const CUADROS_DE_CONTACTO: readonly number[] = [CICLO_CAMINAR[0] as number, CICLO_CAMINAR[2] as number];

export interface PasoSonoro {
  /** 0 o 1: se alternan las dos variantes (pie izquierdo y pie derecho). */
  variante: 0 | 1;
  /** Variación aleatoria de tono, ±6 %. */
  tono: number;
}

/**
 * Convierte el cuadro de caminar que se está mostrando en pasos: uno cada vez que el cuadro ENTRA en uno de contacto, alternando las dos
 * variantes. Quieto o sentado no suena; si arranca ya en un contacto suena de una.
 */
export class CadenciaPasos {
  private previo = -1;
  private alterna: 0 | 1 = 0;
  constructor(private readonly azar: () => number = Math.random) {}

  /** `cuadro`: cuadro de la hoja que se muestra; `caminando`: si va caminando. Devuelve el paso a sonar o null. */
  cuadro(cuadro: number, caminando: boolean): PasoSonoro | null {
    const anterior = this.previo;
    this.previo = caminando ? cuadro : -1;
    if (!caminando || cuadro === anterior) return null;
    if (!CUADROS_DE_CONTACTO.includes(cuadro)) return null;
    const variante = CUADROS_DE_CONTACTO.indexOf(cuadro) === 0 ? 0 : 1;
    this.alterna = variante;
    return { variante, tono: 1 + (this.azar() - 0.5) * 0.12 };
  }
}

// ---------- las demás personas ----------

/** Hasta dónde se oye a otra persona: 8 casillas. */
export const RADIO_OIDO = 8 * CASILLA;
export const MAX_VOCES_AJENAS = 4;

/** Volumen relativo (1 a tu lado, 0 al llegar al radio) con caída suave. */
export function volumenPorDistancia(distanciaPx: number, radio: number = RADIO_OIDO): number {
  if (!(distanciaPx < radio)) return 0;
  const k = 1 - Math.max(0, distanciaPx) / radio;
  return k * k;
}

/** Paneo estéreo de -1 (izquierda) a 1 (derecha) según dónde está la fuente respecto del centro de la cámara. */
export function panoramaEstereo(dxPx: number, mitadAnchoVisiblePx: number): number {
  if (!(mitadAnchoVisiblePx > 0)) return 0;
  return acotar(dxPx / mitadAnchoVisiblePx, -1, 1) * 0.8;
}

/** Volumen y paneo con que suena alguien que está en (px, py) para quien mira el centro (cx, cy); null si está fuera del alcance. */
export function sonidoDeOtro(px: number, py: number, cx: number, cy: number, mitadAnchoVisiblePx: number): { volumen: number; pan: number } | null {
  const d = Math.hypot(px - cx, py - cy);
  const volumen = volumenPorDistancia(d);
  if (volumen <= 0.001) return null;
  return { volumen, pan: panoramaEstereo(px - cx, mitadAnchoVisiblePx) };
}

/** Límite de voces simultáneas de las demás personas: cada sonido ocupa una voz hasta que termina. */
export class LimiteVoces {
  private fines: number[] = [];
  constructor(private readonly max: number = MAX_VOCES_AJENAS) {}

  /** ¿Cabe otra voz que dura `duracionMs`? Si cabe, la registra. */
  pedir(ahoraMs: number, duracionMs: number): boolean {
    this.fines = this.fines.filter((f) => f > ahoraMs);
    if (this.fines.length >= this.max) return false;
    this.fines.push(ahoraMs + duracionMs);
    return true;
  }
  get activas(): number {
    return this.fines.length;
  }
}
