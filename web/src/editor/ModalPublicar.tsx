import { AlertTriangle, XCircle } from 'lucide-react';
import { useState } from 'react';
import type { Problema, SalaMapa } from '@ol/shared';
import { Modal } from '../componentes/Modal';
import { Campo } from '../componentes/Campo';
import { Caja } from '../componentes/Estados';

export function ModalPublicar({ sala, problemas, alPublicar, alCerrar }: { sala: SalaMapa; problemas: readonly Problema[]; alPublicar: (nota: string) => Promise<void>; alCerrar: () => void }) {
  const [nota, setNota] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const errores = problemas.filter((p) => p.nivel === 'error');
  const avisos = problemas.filter((p) => p.nivel === 'aviso');

  const enviar = async () => {
    setEnviando(true);
    setError(null);
    try {
      await alPublicar(nota.trim());
    } catch (x) {
      setError(x instanceof Error ? x.message : 'No se pudo publicar. Intenta de nuevo.');
      setEnviando(false);
    }
  };

  return (
    <Modal
      titulo="Publicar la oficina"
      descripcion="Todas las personas verán esta versión la próxima vez que entren, y quienes están dentro ahora la verán al instante."
      onCerrar={alCerrar}
      bloqueante={enviando}
      pie={
        <>
          <button type="button" className="btn btn--secundario" onClick={alCerrar} disabled={enviando}>
            Seguir editando
          </button>
          <button type="button" className={`btn btn--primario${enviando ? ' btn--cargando' : ''}`} onClick={() => void enviar()} disabled={enviando || errores.length > 0}>
            <span>Publicar ahora</span>
          </button>
        </>
      }
    >
      <div className="ed-resumen">
        <div>
          <strong>{sala.colocaciones.length}</strong>
          <span>objetos</span>
        </div>
        <div>
          <strong>{sala.zonas.length}</strong>
          <span>zonas</span>
        </div>
        <div>
          <strong>{sala.llegadas.length}</strong>
          <span>llegadas</span>
        </div>
      </div>

      {errores.length > 0 && (
        <div className="ed-problemas">
          <p className="ed-etiqueta">Esto impide publicar</p>
          <ul>
            {errores.map((p, i) => (
              <li key={i}>
                <XCircle className="ed-icono-error" aria-hidden="true" />
                {p.mensaje}
              </li>
            ))}
          </ul>
        </div>
      )}
      {avisos.length > 0 && (
        <div className="ed-problemas">
          <p className="ed-etiqueta">Para revisar (no impiden publicar)</p>
          <ul>
            {avisos.slice(0, 8).map((p, i) => (
              <li key={i}>
                <AlertTriangle className="ed-icono-aviso" aria-hidden="true" />
                {p.mensaje}
              </li>
            ))}
            {avisos.length > 8 && <li className="ed-mas">y {avisos.length - 8} más en la pestaña Revisión</li>}
          </ul>
        </div>
      )}

      <Campo etiqueta="Nota de la versión (opcional)" value={nota} onChange={(e) => setNota(e.target.value)} maxLength={200} placeholder="Qué cambió: nueva sala, escritorios del equipo…" autoComplete="off" />
      {error && <Caja tono="error">{error}</Caja>}
    </Modal>
  );
}
