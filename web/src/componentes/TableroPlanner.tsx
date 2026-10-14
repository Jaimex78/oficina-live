import { ExternalLink, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { TareaPlanner } from '@ol/shared';
import { useSesion } from '../estado/sesion';
import { ModalTarea } from '../planner/ModalTarea';
import { Tablero } from '../planner/Tablero';
import { usePlanner } from '../planner/usePlanner';
import { useAvisos } from './Avisos';

type Edicion = { tipo: 'nueva'; columna?: number } | { tipo: 'editar'; tarea: TareaPlanner } | null;

/**
 * El muro Kanban de la oficina de Digital: al tocarlo se ve el Planner del equipo, con las mismas tareas de la página
 * del Planner. Desde aquí se pueden mover, abrir y crear tareas sin salir de la oficina.
 */
export function TableroPlanner({ titulo, alCerrar }: { titulo: string; alCerrar: () => void }) {
  const planner = usePlanner();
  const { usuario, tiene } = useSesion();
  const avisos = useAvisos();
  const navegar = useNavigate();
  const [edicion, setEdicion] = useState<Edicion>(null);
  const datos = planner.datos;

  return (
    <aside className="planner" role="dialog" aria-label={titulo}>
      <header className="planner__cab">
        <div>
          <h2>{titulo}</h2>
          <p>{datos ? `Planner del equipo · ${datos.tareas.length} ${datos.tareas.length === 1 ? 'tarea' : 'tareas'}` : 'Planner del equipo'}</p>
        </div>
        <div className="planner__acciones">
          <button type="button" className="btn btn--secundario btn--chico" onClick={() => setEdicion({ tipo: 'nueva' })} disabled={!datos}>
            <Plus aria-hidden="true" />
            <span>Nueva tarea</span>
          </button>
          <button type="button" className="btn btn--primario btn--chico" onClick={() => navegar('/planner')}>
            <ExternalLink aria-hidden="true" />
            <span>Abrir el Planner</span>
          </button>
          <button type="button" className="ed-btn" onClick={alCerrar} aria-label="Cerrar">
            <X aria-hidden="true" />
          </button>
        </div>
      </header>
      {planner.error && !datos && <p className="planner__pie">{planner.error}</p>}
      {!datos && !planner.error && <p className="planner__pie">Cargando las tareas…</p>}
      {datos && <Tablero planner={planner} alAbrir={(t) => setEdicion({ tipo: 'editar', tarea: t })} alNueva={(columna) => setEdicion({ tipo: 'nueva', columna })} alError={(m) => avisos.error(m)} />}
      {edicion?.tipo === 'nueva' && <ModalTarea columnaInicial={edicion.columna} planner={planner} puedeBorrar={false} alCerrar={() => setEdicion(null)} />}
      {edicion?.tipo === 'editar' && usuario && <ModalTarea tarea={edicion.tarea} planner={planner} puedeBorrar={tiene('administrar') || edicion.tarea.creadaPorId === usuario.id} alCerrar={() => setEdicion(null)} />}
    </aside>
  );
}
