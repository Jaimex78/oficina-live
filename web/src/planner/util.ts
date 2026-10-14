import type { CampoPlanner, TareaPlanner } from '@ol/shared';

export interface Chip {
  campo: string;
  texto: string;
  color: string | null;
  semaforo: boolean;
}

/** Lo que se ve de una tarea para cada campo que tiene valor: una opción con su color, un texto o una fecha. */
export function chipsDe(t: TareaPlanner, campos: readonly CampoPlanner[]): Chip[] {
  const r: Chip[] = [];
  for (const c of campos) {
    const v = t.valores[String(c.id)];
    if (v === undefined || v === null || v === '') continue;
    if (c.tipo === 'lista') {
      const o = c.opciones.find((x) => x.id === Number(v));
      if (o) r.push({ campo: c.nombre, texto: o.nombre, color: o.color, semaforo: c.semaforo });
    } else r.push({ campo: c.nombre, texto: c.tipo === 'fecha' ? formatoFecha(String(v)) : String(v), color: null, semaforo: false });
  }
  return r;
}

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** «2026-10-15» pasa a «15 oct». */
export function formatoFecha(f: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(f);
  if (!m) return f;
  return `${Number(m[3])} ${MESES[Number(m[2]) - 1] ?? ''}`;
}

/** «hace 5 min», «hace 2 h», «ayer» o la fecha. */
export function hace(iso: string, ahora: Date = new Date()): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return '';
  const min = Math.floor((ahora.getTime() - t) / 60_000);
  if (min < 1) return 'ahora';
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'ayer';
  if (d < 7) return `hace ${d} días`;
  return formatoFecha(iso.slice(0, 10));
}

export const iniciales = (nombre: string): string =>
  nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');

/** El color con transparencia, para el fondo de las etiquetas. */
export const suave = (hex: string, alfa = 0.16): string => {
  const n = Number.parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alfa})`;
};
