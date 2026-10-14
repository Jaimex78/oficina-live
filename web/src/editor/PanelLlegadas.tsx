import { MapPin } from 'lucide-react';
import { useEditor, useEstado } from './contexto';

export function PanelLlegadas() {
  const { ctl, almacen } = useEditor();
  const sala = useEstado((e) => e.sala);
  const herramienta = useEstado((e) => e.herramienta);
  if (!sala) return null;
  return (
    <div className="ed-contenido">
      <p className="ed-ayuda">Los puntos de llegada son las casillas donde aparece la gente al entrar. Pon varios para que no lleguen todos encimados.</p>
      <button type="button" className={`btn ${herramienta === 'llegada' ? 'btn--primario' : 'btn--secundario'} btn--bloque`} onClick={() => ctl.elegirHerramienta('llegada')}>
        <MapPin aria-hidden="true" />
        {herramienta === 'llegada' ? 'Haz clic en el mapa' : 'Poner puntos de llegada'}
      </button>
      <p className="ed-dato">
        <strong>{sala.llegadas.length}</strong> {sala.llegadas.length === 1 ? 'punto' : 'puntos'} en esta sala
      </p>
      <ul className="ed-lista">
        {sala.llegadas.map((l) => (
          <li key={`${l.x},${l.y}`}>
            <button type="button" className="ed-fila" onClick={() => almacen.set({ centrar: { x: (l.x + 0.5) * 32, y: (l.y + 0.5) * 32, n: Date.now() } })}>
              <span className="ed-punto" style={{ background: '#34c759' }} aria-hidden="true" />
              <span className="ed-fila__texto">
                <strong>
                  Casilla {l.x}, {l.y}
                </strong>
              </span>
            </button>
          </li>
        ))}
      </ul>
      {sala.llegadas.length > 0 && (
        <button type="button" className="btn btn--texto btn--chico" onClick={() => ctl.quitarTodasLasLlegadas()}>
          Quitar todos
        </button>
      )}
    </div>
  );
}
