import { zonaEn, type SesionEnfoquePublica, type VisibilidadEnfoque, type Zona } from '@ol/shared';

/**
 * Textos y reglas de las áreas de coworking, como en Gather. Nada de esto reproduce audio: el Jam de Spotify es solo un enlace
 * que se abre en una pestaña nueva, y cada persona lo escucha en su propia app de Spotify.
 */

export const NOMBRE_SESION_POR_DEFECTO = 'Trabajo compartido enfocado';

export const AYUDA_SPOTIFY =
  'Spotify se reproduce en la app de Spotify de cada persona. Oficina Live no reproduce el audio: el botón solo abre el enlace del Jam y cada quien debe unirse con su propia cuenta de Spotify.';

export const AYUDA_COMO_FUNCIONA = [
  'Siéntate en un área de coworking e inicia una sesión: quienes estén cerca saben que estás trabajando y pueden acompañarte.',
  'No hay paredes: cualquiera que esté cerca puede verte. Si necesitas privacidad, ve a una sala de reuniones.',
  AYUDA_SPOTIFY,
];

export const AVISO_COWORKING = {
  titulo: 'Cowork en áreas de coworking',
  texto: 'Las áreas de coworking son para conversaciones informales, actualizaciones rápidas o colaboración espontánea. No hay paredes, así que cualquiera que esté cerca puede verte y unirse.',
  privacidad: '¿Necesitas privacidad? Solo ve a una sala de reuniones.',
} as const;

/** El nombre que se muestra de una sesión: el tema o, sin tema, «Trabajo compartido enfocado». */
export const nombreDeSesion = (tema: string | undefined): string => tema?.trim() || NOMBRE_SESION_POR_DEFECTO;

/** «Queda 59m», «Queda 1h 05m», «Queda menos de 1m». */
export function textoQueda(restanteMs: number): string {
  const min = Math.floor(Math.max(0, restanteMs) / 60_000);
  if (min < 1) return 'Queda menos de 1m';
  if (min < 60) return `Queda ${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `Queda ${h}h` : `Queda ${h}h ${String(m).padStart(2, '0')}m`;
}

/** Cuánto va de la sesión, de 0 a 1 (para la barra de tiempo). */
export function avanceDeSesion(s: Pick<SesionEnfoquePublica, 'inicio' | 'fin'>, ahora: number): number {
  const total = s.fin - s.inicio;
  if (total <= 0) return 1;
  return Math.min(1, Math.max(0, (ahora - s.inicio) / total));
}

export function textoVisibilidadSesion(v: VisibilidadEnfoque | undefined): string {
  if (v === 'nadie') return 'Solo visible para ti';
  if (v === 'estado') return 'Solo se ve que estás concentrado';
  return 'Visible para todos';
}

/** La zona de coworking donde está alguien (o la zona más pequeña que lo contiene, si no es de coworking). */
export function zonaDeCoworking(sala: { zonas: Zona[] } | null | undefined, x: number, y: number, casilla = 32): Zona | undefined {
  if (!sala) return undefined;
  return zonaEn(sala, Math.floor(x / casilla), Math.floor(y / casilla));
}

// ---------- el aviso de la primera vez ----------

export const CLAVE_AVISO_COWORKING = 'ol-aviso-coworking-visto';

export function avisoCoworkingVisto(): boolean {
  try {
    return window.localStorage.getItem(CLAVE_AVISO_COWORKING) === '1';
  } catch {
    return false;
  }
}

export function marcarAvisoCoworkingVisto(): void {
  try {
    window.localStorage.setItem(CLAVE_AVISO_COWORKING, '1');
  } catch {
    /* sin almacenamiento: el aviso saldrá otra vez */
  }
}
