/**
 * Enlaces profundos de Teams armados en el servidor. Aquí se conocen los correos de la gente; el navegador solo recibe
 * el enlace ya armado, nunca la lista de correos.
 *
 * Límite honesto de los enlaces profundos: Teams aplica `topicName` solo al CREAR un chat grupal nuevo. Si ya existe un chat con
 * los mismos integrantes, lo reabre con el nombre que tenía.
 */

const BASE = 'l';
export const TITULO_MAX = 50;
export const INVITADOS_MAX = 20;

const CORREO = /^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/;
export const esCorreo = (t: string | null | undefined): t is string => Boolean(t && t.length <= 254 && CORREO.test(t));

const CONTROL = new RegExp('[\\u0000-\\u001f\\u007f-\\u009f\\u2028\\u2029\\u200b-\\u200f\\u202a-\\u202e\\u2066-\\u2069]', 'g');

/** Texto de título limpio: sin caracteres de control ni saltos de línea, espacios simples y como mucho 50 caracteres (sin partir emojis). */
export function limpiarTitulo(bruto: string): string {
  const limpio = bruto
    .replace(CONTROL, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const letras = Array.from(limpio);
  return letras.length <= TITULO_MAX ? limpio : letras.slice(0, TITULO_MAX).join('').trimEnd();
}

export interface EnlaceTeams {
  /** Enlace https: abre Teams en el navegador (o en la aplicación, si el sistema la tiene asociada). */
  url: string;
  /** El mismo enlace con el esquema `msteams://`, que abre directo la aplicación de escritorio. */
  urlApp: string;
}

/** Arma el enlace de chat o de llamada con los correos válidos. `titulo` solo cuenta en chats con más de una persona. */
export function armarEnlace(tipo: 'chat' | 'llamada', correos: readonly string[], titulo = ''): EnlaceTeams {
  const users = correos.filter(esCorreo).map(encodeURIComponent).join(',');
  const partes: string[] = [];
  if (users) partes.push(`users=${users}`);
  const t = limpiarTitulo(titulo);
  if (tipo === 'chat' && t && correos.length > 1) partes.push(`topicName=${encodeURIComponent(t)}`);
  const ruta = `teams.microsoft.com/${BASE}/${tipo === 'chat' ? 'chat' : 'call'}/0/0${partes.length ? `?${partes.join('&')}` : ''}`;
  return { url: `https://${ruta}`, urlApp: `msteams://${ruta}` };
}

/** Límite de intentos por persona: `max` en `ventanaMs`. Vive en memoria. */
export class LimiteIntentos {
  private readonly marcas = new Map<number, number[]>();
  constructor(
    private readonly max = 30,
    private readonly ventanaMs = 60_000,
  ) {}

  permitir(id: number, ahora = Date.now()): boolean {
    const vivas = (this.marcas.get(id) ?? []).filter((t) => ahora - t < this.ventanaMs);
    if (vivas.length >= this.max) {
      this.marcas.set(id, vivas);
      return false;
    }
    vivas.push(ahora);
    this.marcas.set(id, vivas);
    if (this.marcas.size > 2000) for (const [k, v] of this.marcas) if (!v.some((t) => ahora - t < this.ventanaMs)) this.marcas.delete(k);
    return true;
  }
}
