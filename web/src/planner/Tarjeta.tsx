import { CalendarDays, CheckSquare, MessageSquare } from 'lucide-react';
import { estaVencida, progresoSubtareas, type CampoPlanner, type PersonaPlanner, type TareaPlanner } from '@ol/shared';
import { FotoPersona } from '../componentes/FotoPersona';
import { chipsDe, formatoFecha, iniciales, suave } from './util';

interface Props {
  tarea: TareaPlanner;
  campos: readonly CampoPlanner[];
  personas: readonly PersonaPlanner[];
  alAbrir: () => void;
  arrastrable?: boolean;
  alArrastrar?: (e: React.DragEvent) => void;
  alSoltarSobre?: (e: React.DragEvent) => void;
  arrastrandoEncima?: boolean;
}

/** Una tarea en el tablero: título, etiquetas (marca, cliente, semáforo), fecha y responsable. */
export function Tarjeta({ tarea, campos, personas, alAbrir, arrastrable, alArrastrar, alSoltarSobre, arrastrandoEncima }: Props) {
  const chips = chipsDe(tarea, campos);
  const responsable = personas.find((p) => p.id === tarea.responsableId);
  const vencida = estaVencida(tarea);
  const progreso = progresoSubtareas(tarea);
  const semaforo = chips.find((c) => c.semaforo);
  return (
    <li
      className={`pl-tarjeta${tarea.completadaEn ? ' pl-tarjeta--hecha' : ''}${arrastrandoEncima ? ' pl-tarjeta--encima' : ''}`}
      draggable={arrastrable}
      onDragStart={alArrastrar}
      onDragOver={alSoltarSobre}
      onDrop={alSoltarSobre}
    >
      <button type="button" className="pl-tarjeta__boton" onClick={alAbrir} aria-label={`Abrir la tarea ${tarea.titulo}`}>
        <span className="pl-tarjeta__titulo">
          {semaforo?.color && <span className="pl-semaforo" style={{ background: semaforo.color }} title={`${semaforo.campo}: ${semaforo.texto}`} aria-label={`${semaforo.campo}: ${semaforo.texto}`} role="img" />}
          {tarea.titulo}
        </span>
        {chips.filter((c) => !c.semaforo).length > 0 && (
          <span className="pl-chips">
            {chips
              .filter((c) => !c.semaforo)
              .map((c) => (
                <span key={c.campo} className="pl-chip" style={c.color ? { background: suave(c.color), color: 'var(--tinta)' } : undefined} title={c.campo}>
                  {c.color && <i style={{ background: c.color }} aria-hidden="true" />}
                  {c.texto}
                </span>
              ))}
          </span>
        )}
        {(tarea.fechaLimite || responsable || progreso || tarea.comentarios > 0) && (
          <span className="pl-tarjeta__pie">
            <span className="pl-datos">
              {tarea.fechaLimite && (
                <span className={`pl-fecha${vencida ? ' pl-fecha--vencida' : ''}`}>
                  <CalendarDays aria-hidden="true" />
                  {formatoFecha(tarea.fechaLimite)}
                  {vencida && ' · vencida'}
                </span>
              )}
              {progreso && (
                <span className="pl-fecha" title="Subtareas hechas">
                  <CheckSquare aria-hidden="true" />
                  {progreso.hechas}/{progreso.total}
                </span>
              )}
              {tarea.comentarios > 0 && (
                <span className="pl-fecha" title="Comentarios">
                  <MessageSquare aria-hidden="true" />
                  {tarea.comentarios}
                </span>
              )}
            </span>
            {responsable && (
              <FotoPersona id={responsable.id} nombre={responsable.nombre} foto={responsable.foto} className="pl-avatar" colorFondo={false} alternativa={iniciales(responsable.nombre)} titulo={responsable.nombre} />
            )}
          </span>
        )}
      </button>
    </li>
  );
}
