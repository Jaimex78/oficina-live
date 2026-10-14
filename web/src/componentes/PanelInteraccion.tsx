import { ExternalLink, Video, X } from 'lucide-react';
import { Link2 } from 'lucide-react';
import { zonaEn, type SalaMapa } from '@ol/shared';
import type { Interaccion } from '../mundo/puente';
import { TableroPlanner } from './TableroPlanner';

const esHttps = (t: string | undefined): t is string => Boolean(t && /^https:\/\/\S+$/i.test(t));

function abrir(url: string): void {
  window.open(url, '_blank', 'noopener,noreferrer');
}

/** Lo que aparece al usar un objeto: una nota, un enlace o la reunión de Teams de la sala. */
export function PanelInteraccion({ i, sala, alCerrar }: { i: Interaccion; sala: SalaMapa | null; alCerrar: () => void }) {
  const { colocacion: c, objeto: o } = i;
  const zona = sala ? zonaEn(sala, c.x, c.y) : undefined;
  const titulo = c.props?.titulo || o.nombre;
  const enlace = c.props?.enlace ?? (o.interaccion === 'teams' ? zona?.enlaceTeams : undefined);

  if (o.id === 'muro-kanban') return <TableroPlanner titulo={titulo} alCerrar={alCerrar} />;

  return (
    <aside className="mundo-tarjeta" role="dialog" aria-label={titulo}>
      <div className="mundo-tarjeta__cab">
        <div>
          <h2>{titulo}</h2>
          {zona && <span>{zona.nombre}</span>}
        </div>
        <button type="button" className="ed-btn" onClick={alCerrar} aria-label="Cerrar">
          <X aria-hidden="true" />
        </button>
      </div>

      {o.interaccion === 'nota' && <p className="mundo-tarjeta__texto">{c.props?.texto || 'Esta nota todavía está vacía.'}</p>}

      {o.interaccion === 'teams' && (
        <>
          <p className="mundo-tarjeta__texto">{esHttps(enlace) ? 'Entra a la reunión de esta sala en Microsoft Teams.' : 'Esta mesa todavía no tiene enlace de Teams. Pídele a quien construye la oficina que lo agregue.'}</p>
          {esHttps(enlace) && (
            <button type="button" className="btn btn--primario" onClick={() => abrir(enlace)}>
              <Video aria-hidden="true" />
              Unirme en Teams
            </button>
          )}
        </>
      )}

      {(o.interaccion === 'enlace' || o.interaccion === 'incrustado') && (
        <>
          <p className="mundo-tarjeta__texto">{esHttps(c.props?.enlace) ? 'Se abre en una pestaña nueva.' : 'Este objeto todavía no tiene enlace.'}</p>
          {esHttps(c.props?.enlace) && (
            <button type="button" className="btn btn--primario" onClick={() => abrir(c.props?.enlace as string)}>
              <ExternalLink aria-hidden="true" />
              Abrir
            </button>
          )}
        </>
      )}

      {o.interaccion === 'imagen' && (
        <>
          <p className="mundo-tarjeta__texto">{esHttps(c.props?.imagen) ? 'La imagen se abre en una pestaña nueva.' : 'Todavía no tiene imagen.'}</p>
          {esHttps(c.props?.imagen) && (
            <button type="button" className="btn btn--secundario" onClick={() => abrir(c.props?.imagen as string)}>
              <Link2 aria-hidden="true" />
              Ver imagen
            </button>
          )}
        </>
      )}

      {o.interaccion === 'portal' && <p className="mundo-tarjeta__texto">Este paso lleva a otra parte de la oficina. Todavía no hay otra sala conectada.</p>}
    </aside>
  );
}
