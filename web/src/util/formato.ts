const ZONA = 'America/Bogota';

const fechaHora = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short', timeZone: ZONA });
const soloFecha = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeZone: ZONA });
const relativo = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });

export function formatoFechaHora(iso: string | null | undefined, vacio = 'Nunca'): string {
  return iso ? fechaHora.format(new Date(iso)) : vacio;
}

export function formatoFecha(iso: string | null | undefined, vacio = 'Nunca'): string {
  return iso ? soloFecha.format(new Date(iso)) : vacio;
}

/** «hace 3 horas», «ayer», «hace 2 días». */
export function hace(iso: string | null | undefined, vacio = 'Nunca'): string {
  if (!iso) return vacio;
  const seg = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
  const abs = Math.abs(seg);
  if (abs < 45) return 'hace un momento';
  if (abs < 3600) return relativo.format(Math.round(seg / 60), 'minute');
  if (abs < 86_400) return relativo.format(Math.round(seg / 3600), 'hour');
  if (abs < 86_400 * 30) return relativo.format(Math.round(seg / 86_400), 'day');
  return formatoFecha(iso);
}

export function bytesLegibles(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function duracionLegible(segundos: number): string {
  const d = Math.floor(segundos / 86_400);
  const h = Math.floor((segundos % 86_400) / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  if (d > 0) return `${d} d ${h} h`;
  if (h > 0) return `${h} h ${m} min`;
  if (m > 0) return `${m} min`;
  return `${segundos} s`;
}

export function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  const a = partes[0]?.[0] ?? '?';
  const b = partes.length > 1 ? (partes[partes.length - 1]?.[0] ?? '') : '';
  return (a + b).toUpperCase();
}

/** Convierte «#EF3B3A» en [239, 59, 58]. Si no es válido, devuelve el rojo coral. */
export function hexARgb(hex: string): [number, number, number] {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex.trim());
  if (!m) return [239, 59, 58];
  return [parseInt(m[1] as string, 16), parseInt(m[2] as string, 16), parseInt(m[3] as string, 16)];
}

export function mezclar(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  return [Math.round(a[0] + (b[0] - a[0]) * t), Math.round(a[1] + (b[1] - a[1]) * t), Math.round(a[2] + (b[2] - a[2]) * t)];
}

/** Usuario sugerido a partir de un correo o un nombre: minúsculas, sin tildes, con punto. */
export function sugerirUsuario(texto: string): string {
  const base = texto.split('@')[0] ?? texto;
  return base
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '.')
    .replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, '')
    .slice(0, 32);
}
