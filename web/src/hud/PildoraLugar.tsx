import { Lock, LockOpen, Users } from 'lucide-react';
import type { Zona } from '@ol/shared';

/**
 * Arriba a la izquierda del mundo, como en Gather: una píldora tenue con el nombre del lugar donde estás (la zona más pequeña que
 * contiene tu centro). En salas de reuniones lleva el candado que bloquea la sala; en zonas privadas, un candado fijo.
 * Los nombres de las zonas ya no se pintan sobre el piso.
 */
export function PildoraLugar({
  zona,
  personas,
  bloqueada,
  puedeAlternar,
  bloqueadaPor,
  alAlternar,
}: {
  zona: Zona;
  personas: number;
  bloqueada: boolean;
  /** Eres quien la bloqueó, o la sala está libre: puedes cambiar el candado. */
  puedeAlternar: boolean;
  /** Nombre de quien bloqueó la sala, si se sabe (para la ayuda del candado). */
  bloqueadaPor?: string;
  alAlternar: () => void;
}) {
  const esSala = zona.tipo === 'sala';
  const descripcion = zona.descripcion?.trim() || undefined;
  const esPrivada = zona.tipo === 'privada';
  const Candado = bloqueada ? Lock : LockOpen;
  const ayuda = !bloqueada ? 'Bloquear sala' : puedeAlternar ? 'Desbloquear sala' : `Sala bloqueada${bloqueadaPor ? ` por ${bloqueadaPor}` : ''}`;
  return (
    <div className="hd-lugar" role="status" aria-label={`Estás en ${zona.nombre}`} data-tipo={zona.tipo} data-bloqueada={bloqueada || undefined} data-descripcion={descripcion ? '' : undefined}>
      <Users aria-hidden="true" className="hd-lugar__personas" />
      <span className="hd-lugar__texto">
        <span className="hd-lugar__nombre" title={personas > 0 ? (personas === 1 ? '1 persona' : `${personas} personas`) : undefined}>
          {zona.nombre}
        </span>
        {descripcion && <span className="hd-lugar__descripcion">{descripcion}</span>}
      </span>
      {esSala && (
        <button type="button" className="hd-lugar__candado" onClick={alAlternar} disabled={!puedeAlternar} aria-pressed={bloqueada} aria-label={ayuda} title={ayuda}>
          <Candado aria-hidden="true" />
        </button>
      )}
      {esPrivada && <Lock aria-label="Zona privada" className="hd-lugar__fijo" role="img" />}
    </div>
  );
}
