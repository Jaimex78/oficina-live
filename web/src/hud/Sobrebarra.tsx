import { Timer, Video } from 'lucide-react';
import type { Interaccion } from '../mundo/puente';
import type { EventoRuta } from './tipos';

const ACCION: Record<string, string> = {
  teams: 'Abrir la mesa de Teams',
  enlace: 'Abrir',
  nota: 'Leer',
  imagen: 'Ver',
  incrustado: 'Abrir',
  portal: 'Pasar',
};

export interface BurbujaCerca {
  id: number;
  nombre: string;
  texto: string;
  propio: boolean;
}

export interface EfectoReaccion {
  id: number;
  emoji: string;
  /** Desplazamiento lateral en píxeles, para que varias no se tapen. */
  dx: number;
}

function textoDeRuta(r: EventoRuta): string {
  if (r.tipo === 'escritorio') return 'Yendo a tu escritorio';
  if (r.tipo === 'persona' && r.etiqueta) return `Yendo hacia ${r.etiqueta}`;
  return '¡En camino!';
}

/** Lo que aparece sobre la barra: mensajes cercanos, el aviso de ruta con su Cancelar y la acción de la tecla E (solo para objetos con acción: sentarse es automático). */
export function Sobrebarra({
  ruta,
  alCancelarRuta,
  cerca,
  alUsar,
  burbujas,
  enfoque,
}: {
  ruta: EventoRuta | null;
  alCancelarRuta: () => void;
  cerca: Interaccion | null;
  alUsar: () => void;
  burbujas: BurbujaCerca[];
  /** Sentado en una zona de coworking sin sesión: un atajo para volver a abrir el panel de la sesión de enfoque. */
  enfoque?: { alAbrir: () => void } | null;
}) {
  const hayAccion = Boolean(cerca);
  if (!ruta?.activa && !hayAccion && !enfoque && burbujas.length === 0) return null;
  return (
    <div className="hd-sobrebarra">
      {burbujas.length > 0 && (
        <ul className="hd-burbujas" aria-label="Mensajes de personas cercanas" aria-live="polite">
          {burbujas.map((b) => (
            <li key={b.id} className="hd-burbuja" data-propio={b.propio ? '1' : undefined}>
              <strong>{b.propio ? 'Tú' : b.nombre}</strong>
              <span>{b.texto}</span>
            </li>
          ))}
        </ul>
      )}
      {ruta?.activa && (
        <div className="hd-ruta" role="status">
          <span>{textoDeRuta(ruta)}</span>
          <button type="button" onClick={alCancelarRuta}>
            Cancelar
          </button>
        </div>
      )}
      {enfoque && (
        <button type="button" className="hd-accion" onClick={enfoque.alAbrir}>
          <Timer aria-hidden="true" />
          Iniciar sesión de enfoque
        </button>
      )}
      {hayAccion && (
        <button type="button" className="hd-accion" onClick={alUsar}>
          <kbd>E</kbd>
          <Video aria-hidden="true" />
          {cerca?.objeto.interaccion === 'teams' ? 'Abrir la mesa de Teams' : `${ACCION[cerca?.objeto.interaccion ?? ''] ?? 'Usar'} ${cerca?.colocacion.props?.titulo ?? cerca?.objeto.nombre ?? ''}`.trim()}
        </button>
      )}
    </div>
  );
}

/** Reacciones que suben flotando. Es el efecto local: si el motor ya dibuja el suyo sobre el personaje, no se usa. */
export function CapaReacciones({ efectos }: { efectos: EfectoReaccion[] }) {
  if (efectos.length === 0) return null;
  return (
    <div className="hd-reacciones-capa" aria-hidden="true">
      {efectos.map((e) => (
        <span key={e.id} className="hd-flota" style={{ '--dx': `${e.dx}px` } as React.CSSProperties}>
          {e.emoji}
        </span>
      ))}
    </div>
  );
}
