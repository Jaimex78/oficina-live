import { useState } from 'react';
import { BarraEditor } from './BarraEditor';
import { Inspector } from './Inspector';
import { PanelLateral, type Pestana } from './PanelLateral';
import { useEstado } from './contexto';

const AYUDA: Record<string, string> = {
  seleccionar: 'Haz clic en un objeto para elegirlo. Arrastra para moverlo, o dibuja un cuadro para elegir varios.',
  mano: 'Arrastra para mover la vista.',
  borrar: 'Haz clic o arrastra sobre los objetos para quitarlos.',
  zona: 'Arrastra en el mapa para dibujar la zona.',
  llegada: 'Haz clic en una casilla libre para poner o quitar un punto de llegada.',
  piso: 'Pinta el piso. Arrastra para repetir.',
};

/** Todo lo que se ve encima del mundo mientras se construye. */
export function EditorUI() {
  const [pestana, setPestana] = useState<Pestana>('objetos');
  const herramienta = useEstado((e) => e.herramienta);
  const fantasma = useEstado((e) => e.fantasma);
  const mensaje = useEstado((s) => s.aviso);
  const seleccion = useEstado((s) => s.seleccion.length);
  const aviso = herramienta === 'objeto' && fantasma && !fantasma.valido ? fantasma.motivo : null;

  return (
    <div className={`ed${seleccion > 0 ? ' ed--con-seleccion' : ''}`}>
      <BarraEditor alRevision={() => setPestana('revision')} />
      <PanelLateral pestana={pestana} alCambiar={setPestana} />
      <Inspector />
      <div className="ed-pista" role="status" aria-live="polite">
        {mensaje ? <span className={mensaje.tipo === 'error' ? 'ed-pista__mal' : undefined}>{mensaje.texto}</span> : aviso ? <span className="ed-pista__mal">{aviso}</span> : <span>{herramienta === 'objeto' ? 'Haz clic para colocar. R gira, Esc termina.' : (AYUDA[herramienta] ?? '')}</span>}
      </div>
    </div>
  );
}
