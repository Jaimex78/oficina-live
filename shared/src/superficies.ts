/**
 * Superficies: la tapa de cada mueble que sirve de apoyo (escritorios, mesas, mesones, cajoneras, aparadores) y las reglas
 * geométricas para apoyar objetos encima. Es solo geometría y datos: no mira ninguna sala (eso vive en `apoyos.ts`).
 *
 * Coordenadas de la tapa: píxeles relativos a la esquina superior izquierda de la huella del mueble (la huella es la parte
 * de abajo del dibujo; el dibujo sube `sobresale` px por encima, así que `y` puede ser negativa).
 *
 * De dónde salen los valores, en este orden de prioridad:
 *  1. `EXCEPCIONES`: a mano, para lo que el medidor no acierta (escritorio en L, mesas redondas, cajonera).
 *  2. `TAPAS_MEDIDAS` (generado por `arte/herramientas/medir-superficies.ts` sobre los dibujos publicados).
 *  3. `FAMILIAS`: márgenes por familia, para muebles nuevos o que el medidor no pudo leer (tapas oscuras con vetas).
 * Las demás orientaciones se derivan por márgenes (la vista siempre es desde el sur: el labio delantero queda abajo en
 * todas las orientaciones) salvo las que el medidor encontró distintas (`TAPAS_MEDIDAS_ORIENTACION`).
 */

import type { ObjetoCatalogo, Orientacion } from './arte';
import { CASILLA } from './arte';
import { huellaDe } from './inventario';
import { CAJAS_APOYADOS } from './superficies-cajas';
import { TAPAS_MEDIDAS, TAPAS_MEDIDAS_ORIENTACION } from './superficies-medidas';

export interface Tapa {
  x: number;
  y: number;
  w: number;
  h: number;
  /** Mesas redondas: solo el rectángulo inscrito en la elipse sirve de apoyo. */
  forma?: 'elipse';
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Cuánto puede sobresalir un objeto apoyado por detrás del borde de la tapa (el reborde y la perspectiva), en píxeles. */
export const TOLERANCIA_ARRIBA = 4;
/** Lo apoyado no llega al borde delantero de la tapa: se queda a esta distancia del labio (px). */
export const FRENTE_LIBRE = 3;
/** Cuánto pueden pasarse por cada lado las pantallas y los computadores (`esDeFondo`), en píxeles. */
export const TOLERANCIA_LADOS = 4;
/** Una casilla cuenta como cubierta cuando la tapa tapa al menos esta parte de ella. */
export const CUBIERTA_MINIMA = 0.15;

const margen = (izq: number, der: number, atras: number, frente: number) => ({ izq, der, atras, frente });

/** Márgenes por familia (px desde cada borde de la huella; `atras` negativo = la tapa sube por encima de la huella). */
export const FAMILIAS: ReadonlyArray<{ patron: RegExp; nombre: string; margenes: (sobresale: number) => ReturnType<typeof margen> }> = [
  // Mesas y escritorios de los lotes 9 y 13: tapa clara arriba, patas debajo, labio de 16 px.
  { patron: /^(mesa|escritorio|mesa-de-dibujo)-/, nombre: 'mesa o escritorio', margenes: (s) => margen(3, 3, -(Math.max(s, 3) - 3), 16) },
  // Mesones, barras, cómodas y gabinetes bajos: tapa fina y frente alto.
  { patron: /^(meson|barra|comoda|aparador|gabinete|mueble|baul|taquillas)/, nombre: 'mueble bajo', margenes: (s) => margen(2, 2, -(Math.max(s, 2) - 2), 20) },
];

export const EXCEPCIONES: Readonly<Record<string, Tapa>> = {
  // Escritorio en L: solo la barra de arriba sirve de apoyo.
  'escritorio-l': { x: 4, y: 2, w: 58, h: 14 },
  // Cajonera: la tapa es una franja chica.
  cajonera: { x: 4, y: 3, w: 24, h: 6 },
  // Mesas redondas y ovaladas: el medidor da la elipse completa, aquí se marca como elipse.
  'mesa-redonda': { x: 4, y: 7, w: 58, h: 42, forma: 'elipse' },
  'mesa-redonda-grande': { x: 4, y: -6, w: 90, h: 85, forma: 'elipse' },
  'mesa-centro-redonda': { x: 3, y: -5, w: 58, h: 46, forma: 'elipse' },
  'mesa-centro': { x: 6, y: 7, w: 54, h: 16, forma: 'elipse' },
  'mesa-alta': { x: 5, y: 2, w: 22, h: 14, forma: 'elipse' },
  'mesa-lateral-moderna': { x: 5, y: -4, w: 22, h: 14, forma: 'elipse' },
  'mesa-elegante-marmol': { x: 5, y: -4, w: 22, h: 14, forma: 'elipse' },
  'mesa-elegante-redonda': { x: 5, y: -4, w: 22, h: 14, forma: 'elipse' },
};

/** Los nombres de objeto que sirven de apoyo pero no tienen medida ni familia: ninguno por ahora. */
function desdeFamilia(o: ObjetoCatalogo): Tapa | null {
  const fam = FAMILIAS.find((f) => f.patron.test(o.id));
  if (!fam) return null;
  const h = huellaDe(o, 'S');
  const m = fam.margenes(o.sobresale);
  return { x: m.izq, y: m.atras, w: h.ancho * CASILLA - m.izq - m.der, h: h.alto * CASILLA - m.atras - m.frente };
}

/** La tapa en orientación «S», o null si el objeto no sirve de apoyo. */
export function tapaS(o: Pick<ObjetoCatalogo, 'id' | 'ancho' | 'alto' | 'bloquea' | 'autotile' | 'sobresale'>): Tapa | null {
  return EXCEPCIONES[o.id] ?? TAPAS_MEDIDAS[o.id] ?? desdeFamilia(o as ObjetoCatalogo);
}

/** ¿Este objeto sirve de apoyo? */
export function tieneSuperficie(o: Pick<ObjetoCatalogo, 'id' | 'ancho' | 'alto' | 'bloquea' | 'autotile' | 'sobresale'>): boolean {
  return tapaS(o) !== null;
}

/** La tapa de un mueble en la orientación dada (huella de esa orientación). */
export function tapaDe(o: ObjetoCatalogo, orientacion: Orientacion): Tapa | null {
  const s = tapaS(o);
  if (!s) return null;
  if (orientacion === 'S' || orientacion === 'U' || o.autotile) return s;
  const medida = TAPAS_MEDIDAS_ORIENTACION[o.id]?.[orientacion];
  if (medida && !EXCEPCIONES[o.id]) return { ...medida, ...(s.forma ? { forma: s.forma } : {}) };
  const hs = huellaDe(o, 'S');
  const hn = huellaDe(o, orientacion);
  const izq = s.x;
  const der = hs.ancho * CASILLA - (s.x + s.w);
  const atras = s.y;
  const frente = hs.alto * CASILLA - (s.y + s.h);
  return { x: izq, y: atras, w: hn.ancho * CASILLA - izq - der, h: hn.alto * CASILLA - atras - frente, ...(s.forma ? { forma: s.forma } : {}) };
}

/** La parte de la tapa donde cabe un objeto: en las mesas redondas, el rectángulo inscrito en la elipse. */
export function zonaUtil(t: Tapa): Rect {
  if (t.forma !== 'elipse') return { x: t.x, y: t.y, w: t.w, h: t.h };
  const k = (1 - Math.SQRT1_2) / 2;
  return { x: t.x + t.w * k, y: t.y + t.h * k, w: t.w * Math.SQRT1_2, h: t.h * Math.SQRT1_2 };
}

// ---------- objetos apoyados ----------

/** Objetos que se dibujaron para el fondo del escritorio (pantallas y computadores): conservan su ancla vertical. */
export function esDeFondo(o: Pick<ObjetoCatalogo, 'id' | 'categoria' | 'sobresale'>): boolean {
  return /^(computador-|pc-|portatil|monitor|todo-en-uno|laptop-dock|tableta|impresora-3d|consola-portatil|telefono-conferencia)/.test(o.id) || (o.categoria === 'tecnologia' && o.sobresale >= 16);
}

/** Muebles que van contra la pared (mesones, cómodas, gabinetes): lo apoyado encima puede subir por detrás de la tapa. */
export function contraPared(o: Pick<ObjetoCatalogo, 'id'>): boolean {
  return /^(meson|barra|comoda|aparador|gabinete|mueble|baul|taquillas|cajonera)/.test(o.id);
}

/** La caja visible del dibujo de un objeto apoyado: [x, y, ancho, alto] en píxeles del dibujo. Sin medida, el dibujo entero. */
export function cajaDe(o: Pick<ObjetoCatalogo, 'id' | 'ancho' | 'alto' | 'sobresale'>, orientacion: Orientacion): Rect {
  const m = CAJAS_APOYADOS[o.id];
  const c = m ? (m[orientacion] ?? Object.values(m)[0]) : undefined;
  if (c) return { x: c[0], y: c[1], w: c[2], h: c[3] };
  return { x: 0, y: 0, w: o.ancho * CASILLA, h: o.alto * CASILLA + o.sobresale };
}

export interface MuebleBajo {
  objeto: ObjetoCatalogo;
  x: number;
  y: number;
  orientacion: Orientacion;
}

export type ResultadoApoyo = { ok: true; dx: number; dy: number } | { ok: false; motivo: string };

/** ¿La tapa cubre esta casilla (x, y de la sala)? */
export function tapaCubreCasilla(m: MuebleBajo, cx: number, cy: number): boolean {
  const t = tapaDe(m.objeto, m.orientacion);
  if (!t) return false;
  const h = huellaDe(m.objeto, m.orientacion);
  if (cx < m.x || cy < m.y || cx >= m.x + h.ancho || cy >= m.y + h.alto) return false;
  // Para saber qué casillas cubre se usa la tapa entera (en las redondas, la elipse completa); para ver si algo cabe, la zona útil.
  const ox = Math.min((cx + 1) * CASILLA, m.x * CASILLA + t.x + t.w) - Math.max(cx * CASILLA, m.x * CASILLA + t.x);
  const oy = Math.min((cy + 1) * CASILLA, m.y * CASILLA + t.y + t.h) - Math.max(cy * CASILLA, m.y * CASILLA + t.y);
  return ox > 0 && oy > 0 && (ox * oy) / (CASILLA * CASILLA) >= CUBIERTA_MINIMA;
}

/**
 * Dónde queda un objeto apoyado sobre un mueble. Devuelve el desplazamiento en píxeles respecto de su posición normal
 * (esquina inferior izquierda del dibujo en la esquina inferior izquierda de su huella), o por qué no cabe.
 * Es determinista: depende solo del objeto, de su casilla y del mueble.
 *
 * Normal: el centro de su caja visible va al centro de su casilla y se corre lo justo para que la caja entera quede dentro de la
 * tapa (con `TOLERANCIA_ARRIBA` de holgura por detrás). Pantallas y computadores (`esDeFondo`) conservan su ancla vertical:
 * solo se centran y se revisa que su base quede dentro de la tapa.
 */
export function apoyarSobre(o: ObjetoCatalogo, x: number, y: number, orientacion: Orientacion, mueble: MuebleBajo): ResultadoApoyo {
  const t = tapaDe(mueble.objeto, mueble.orientacion);
  if (!t) return { ok: false, motivo: 'Ponlo sobre una mesa o un escritorio.' };
  const u = zonaUtil(t);
  const tapa = { x: mueble.x * CASILLA + u.x, y: mueble.y * CASILLA + u.y, w: u.w, h: u.h };
  const dibujada: Orientacion = o.categoria === 'tecnologia' && o.orientaciones.includes('S') ? 'S' : orientacion;
  const h = huellaDe(o, orientacion);
  const hd = huellaDe(o, dibujada);
  const caja = cajaDe(o, dibujada);
  const altoMarco = hd.alto * CASILLA + o.sobresale;
  // Caja visible en la posición normal, en píxeles de la sala.
  const bx = x * CASILLA + caja.x;
  const by = (y + h.alto) * CASILLA - altoMarco + caja.y;
  const centroX = x * CASILLA + (h.ancho * CASILLA) / 2;
  const centroY = y * CASILLA + (h.alto * CASILLA) / 2;
  const no = (motivo: string): ResultadoApoyo => ({ ok: false, motivo });

  // Pantallas y computadores pueden pasarse unos píxeles por los lados (su dibujo es tan ancho como el escritorio).
  const holgura = esDeFondo(o) ? TOLERANCIA_LADOS : 0;
  if (caja.w > tapa.w + 2 * holgura) return no('No cabe sobre esta mesa.');
  let nx = Math.round(centroX - caja.w / 2);
  nx = Math.max(Math.ceil(tapa.x - holgura), Math.min(Math.floor(tapa.x + tapa.w - caja.w + holgura), nx));
  let ny: number;
  if (contraPared(mueble.objeto)) {
    // Sobre un mueble contra la pared: la base se apoya cerca del frente de la tapa y el cuerpo puede subir por detrás.
    ny = Math.round(tapa.y + tapa.h - 2 - caja.h);
  } else if (esDeFondo(o)) {
    ny = by;
    if (ny + caja.h > tapa.y + tapa.h + 1 || ny + caja.h < tapa.y + 2) return no('No cabe sobre esta mesa.');
  } else {
    if (caja.h > tapa.h - FRENTE_LIBRE + TOLERANCIA_ARRIBA) return no('No cabe sobre esta mesa.');
    ny = Math.round(centroY - caja.h / 2);
    ny = Math.max(Math.ceil(tapa.y - TOLERANCIA_ARRIBA), Math.min(Math.floor(tapa.y + tapa.h - FRENTE_LIBRE - caja.h), ny));
  }
  return { ok: true, dx: nx - bx, dy: ny - by };
}
