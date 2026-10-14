import { useState, type ReactNode } from 'react';
import { Modal } from './Modal';

interface Props {
  titulo: string;
  mensaje: ReactNode;
  textoConfirmar: string;
  /** Acción destructiva: el botón sale en rojo y el foco cae en «Cancelar». */
  peligro?: boolean;
  onConfirmar: () => Promise<void>;
  onCerrar: () => void;
}

/** Confirmación solo para lo que no se puede deshacer o cierra sesiones ajenas. */
export function Confirmar({ titulo, mensaje, textoConfirmar, peligro, onConfirmar, onCerrar }: Props) {
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirmar = async () => {
    setEnviando(true);
    setError(null);
    try {
      await onConfirmar();
      onCerrar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo completar. Intenta de nuevo.');
      setEnviando(false);
    }
  };

  return (
    <Modal
      titulo={titulo}
      onCerrar={onCerrar}
      bloqueante={enviando}
      pie={
        <>
          <button type="button" className="btn btn--secundario" onClick={onCerrar} disabled={enviando} data-autofoco={peligro ? '' : undefined}>
            Cancelar
          </button>
          <button type="button" className={`btn ${peligro ? 'btn--peligro-solido' : 'btn--primario'}${enviando ? ' btn--cargando' : ''}`} onClick={confirmar} disabled={enviando} data-autofoco={peligro ? undefined : ''}>
            <span>{textoConfirmar}</span>
          </button>
        </>
      }
    >
      <div className="texto-2">{mensaje}</div>
      {error && (
        <p className="campo__error" role="alert" style={{ marginTop: 'var(--s3)' }}>
          {error}
        </p>
      )}
    </Modal>
  );
}
