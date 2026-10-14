import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { Wrench } from 'lucide-react';
import { useEditor, useEstado } from './contexto';

export function PanelRevision() {
  const { almacen, ctl } = useEditor();
  const problemas = useEstado((e) => e.problemas);
  const errores = problemas.filter((p) => p.nivel === 'error');
  const avisos = problemas.filter((p) => p.nivel === 'aviso');
  const ir = (x?: number, y?: number) => {
    if (x === undefined || y === undefined) return;
    almacen.set({ centrar: { x: (x + 0.5) * 32, y: (y + 0.5) * 32, n: Date.now() }, ping: { x, y, n: Date.now() } });
  };
  return (
    <div className="ed-contenido">
      {problemas.length === 0 ? (
        <div className="ed-ok">
          <CheckCircle2 aria-hidden="true" />
          <div>
            <strong>Todo en orden</strong>
            <span>No hay nada que impida publicar.</span>
          </div>
        </div>
      ) : (
        <>
          <p className="ed-ayuda">
            {errores.length > 0 ? `${errores.length} ${errores.length === 1 ? 'error impide' : 'errores impiden'} publicar. ` : 'Nada impide publicar. '}
            {avisos.length > 0 ? `${avisos.length} ${avisos.length === 1 ? 'aviso' : 'avisos'} para revisar.` : ''}
          </p>
          <ul className="ed-lista">
            {[...errores, ...avisos].map((p, i) => (
              <li key={`${p.codigo}-${i}`} className="ed-problema">
                <button type="button" className="ed-fila ed-fila--problema" onClick={() => ir(p.x, p.y)} disabled={p.x === undefined}>
                  {p.nivel === 'error' ? <XCircle className="ed-icono-error" aria-label="Error" /> : <AlertTriangle className="ed-icono-aviso" aria-label="Aviso" />}
                  <span className="ed-fila__texto">
                    <strong>{p.mensaje}</strong>
                    {p.x !== undefined && (
                      <small>
                        Casilla {p.x}, {p.y}
                      </small>
                    )}
                  </span>
                </button>
                {p.arreglo && (
                  <button type="button" className="btn btn--secundario btn--chico" onClick={() => ctl.arreglar(p)}>
                    <Wrench aria-hidden="true" />
                    Arreglar
                  </button>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
