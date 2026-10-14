/**
 * Enlaces profundos de Teams (nivel 0 de la integración: sin permisos de TI).
 * Siempre `https://teams.microsoft.com/l/...`: una dirección copiada de la barra del navegador no sirve.
 */

const BASE = 'https://teams.microsoft.com/l';
const CORREO = /^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/;

export const esCorreo = (t: string | undefined | null): t is string => Boolean(t && CORREO.test(t));
export const esHttps = (t: string | undefined | null): t is string => Boolean(t && /^https:\/\/\S+$/i.test(t));

const lista = (correos: readonly string[]): string => correos.filter(esCorreo).map(encodeURIComponent).join(',');

/** Llamada con quienes tengan correo conocido. Sin correos, Teams abre la pantalla de llamada para elegir a quién. */
export function enlaceLlamada(correos: readonly string[], conVideo = false): string {
  const u = lista(correos);
  const partes = [u ? `users=${u}` : '', conVideo ? 'withVideo=true' : ''].filter(Boolean);
  return `${BASE}/call/0/0${partes.length ? `?${partes.join('&')}` : ''}`;
}

/** Chat nuevo, o con quienes tengan correo conocido. */
export function enlaceChat(correos: readonly string[] = [], mensaje = ''): string {
  const u = lista(correos);
  const partes = [u ? `users=${u}` : '', mensaje ? `message=${encodeURIComponent(mensaje)}` : ''].filter(Boolean);
  return `${BASE}/chat/0/0${partes.length ? `?${partes.join('&')}` : ''}`;
}

export function abrirEnPestana(url: string): void {
  window.open(url, '_blank', 'noopener,noreferrer');
}

export async function copiarTexto(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    try {
      const t = document.createElement('textarea');
      t.value = texto;
      t.setAttribute('readonly', '');
      t.style.position = 'fixed';
      t.style.opacity = '0';
      document.body.appendChild(t);
      t.select();
      const ok = document.execCommand('copy');
      t.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

// ---------- esquema de la aplicación y chat general ----------

/** Un enlace de Teams con el esquema de la aplicación de escritorio (`msteams://`). Otros dominios quedan como están. */
export function aEnlaceApp(url: string): string {
  return /^https:\/\/teams\.microsoft\.com\//i.test(url) ? url.replace(/^https:/i, 'msteams:') : url;
}

/** El chat general de Teams (sin invitados): lo que se abre cuando no hay nadie cerca. */
export const CHAT_GENERAL = { url: 'https://teams.microsoft.com/l/chat/0/0', urlApp: 'msteams://teams.microsoft.com/l/chat/0/0' } as const;
