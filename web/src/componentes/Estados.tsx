import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react';
import type { ComponentType, ReactNode } from 'react';
import { iniciales } from '../util/formato';
import { FotoPersona } from './FotoPersona';

export function Cargando({ texto = 'Cargando…' }: { texto?: string }) {
  return (
    <div className="estado" role="status" aria-live="polite">
      <div className="giro" aria-hidden="true" />
      <p>{texto}</p>
    </div>
  );
}

export function Vacio({ Icono, titulo, texto, accion }: { Icono: ComponentType<{ 'aria-hidden'?: boolean }>; titulo: string; texto?: string; accion?: ReactNode }) {
  return (
    <div className="estado">
      <Icono aria-hidden={true} />
      <p className="estado__titulo">{titulo}</p>
      {texto && <p>{texto}</p>}
      {accion}
    </div>
  );
}

/** Error con salida: dice qué pasó y deja reintentar. */
export function CajaError({ mensaje, onReintentar }: { mensaje: string; onReintentar?: () => void }) {
  return (
    <div className="estado" role="alert">
      <CircleAlert aria-hidden="true" />
      <p className="estado__titulo">No se pudo cargar</p>
      <p>{mensaje}</p>
      {onReintentar && (
        <button type="button" className="btn btn--secundario" onClick={onReintentar}>
          Intentar de nuevo
        </button>
      )}
    </div>
  );
}

const ICONOS_CAJA = { error: CircleAlert, aviso: TriangleAlert, ok: CircleCheck, info: Info } as const;

export function Caja({ tono, children }: { tono: keyof typeof ICONOS_CAJA; children: ReactNode }) {
  const Icono = ICONOS_CAJA[tono];
  return (
    <div className={`caja caja--${tono}`} role={tono === 'error' ? 'alert' : 'status'}>
      <Icono aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}

export function Insignia({ tono, children }: { tono?: 'ok' | 'aviso' | 'peligro' | 'info' | 'acento' | 'oscura'; children: ReactNode }) {
  return <span className={`insignia${tono ? ` insignia--${tono}` : ''}`}>{children}</span>;
}

/**
 * El círculo de una persona. Con `id`, muestra su foto de perfil si la tiene (`foto` es su versión);
 * sin foto, o sin `id`, muestra sus iniciales.
 */
export function Iniciales({ nombre, grande, id, foto }: { nombre: string; grande?: boolean; id?: number; foto?: number | undefined }) {
  if (id !== undefined) {
    return <FotoPersona id={id} nombre={nombre} foto={foto} className={`iniciales${grande ? ' iniciales--grande' : ''}`} colorFondo={false} alternativa={iniciales(nombre)} decorativa />;
  }
  return (
    <span className={`iniciales${grande ? ' iniciales--grande' : ''}`} aria-hidden="true">
      {iniciales(nombre)}
    </span>
  );
}
