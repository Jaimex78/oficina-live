import { Plus } from 'lucide-react';
import { useState } from 'react';
import type { TareaPlanner } from '@ol/shared';
import { Tarjeta } from './Tarjeta';
import type { ApiPlanner } from './usePlanner';

interface Props {
  planner: ApiPlanner;
  /** Qué tareas se muestran (los filtros). */
  visible?: (t: TareaPlanner) => boolean;
  alAbrir: (t: TareaPlanner) => void;
  alNueva: (columnaId: number) => void;
  alError: (mensaje: string) => void;
}

/** Las columnas con sus tarjetas. Se arrastra una tarjeta a otra columna o entre otras tarjetas para moverla. */
export function Tablero({ planner, visible, alAbrir, alNueva, alError }: Props) {
  const datos = planner.datos;
  const [arrastrada, setArrastrada] = useState<number | null>(null);
  const [sobre, setSobre] = useState<{ columna: number; tarjeta: number | null } | null>(null);
  if (!datos) return null;

  const soltar = (columnaId: number, posicion: number) => {
    const id = arrastrada;
    setArrastrada(null);
    setSobre(null);
    if (id === null) return;
    void planner.mover(id, columnaId, posicion).catch((x: unknown) => alError(x instanceof Error ? x.message : 'No se pudo mover la tarea.'));
  };

  return (
    <div className="pl-tablero">
      {datos.columnas.map((col) => {
        const todas = datos.tareas.filter((t) => t.columnaId === col.id).sort((a, b) => a.orden - b.orden);
        const mostradas = visible ? todas.filter(visible) : todas;
        return (
          <section
            key={col.id}
            className={`pl-columna${sobre?.columna === col.id && sobre.tarjeta === null ? ' pl-columna--encima' : ''}`}
            aria-label={`${col.nombre}, ${mostradas.length} ${mostradas.length === 1 ? 'tarea' : 'tareas'}`}
            onDragOver={(e) => {
              if (arrastrada === null) return;
              e.preventDefault();
              if (sobre?.columna !== col.id || sobre.tarjeta !== null) setSobre({ columna: col.id, tarjeta: null });
            }}
            onDrop={(e) => {
              e.preventDefault();
              soltar(col.id, todas.filter((t) => t.id !== arrastrada).length);
            }}
          >
            <header className="pl-columna__cab">
              <span className="pl-columna__punto" style={{ background: col.color }} aria-hidden="true" />
              <h3>{col.nombre}</h3>
              <span className="pl-columna__cuenta">{mostradas.length}</span>
              <button type="button" className="ed-btn pl-columna__mas" onClick={() => alNueva(col.id)} aria-label={`Nueva tarea en ${col.nombre}`} title="Nueva tarea aquí">
                <Plus aria-hidden="true" />
              </button>
            </header>
            <ul className="pl-columna__lista">
              {mostradas.map((t) => (
                <Tarjeta
                  key={t.id}
                  tarea={t}
                  campos={datos.campos}
                  personas={datos.personas}
                  alAbrir={() => alAbrir(t)}
                  arrastrable
                  arrastrandoEncima={sobre?.tarjeta === t.id && arrastrada !== t.id}
                  alArrastrar={(e) => {
                    setArrastrada(t.id);
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', String(t.id));
                  }}
                  alSoltarSobre={(e) => {
                    if (arrastrada === null || arrastrada === t.id) return;
                    e.preventDefault();
                    e.stopPropagation();
                    if (e.type === 'dragover') {
                      if (sobre?.tarjeta !== t.id) setSobre({ columna: col.id, tarjeta: t.id });
                      return;
                    }
                    // Suelta: queda justo antes de la tarjeta sobre la que se soltó.
                    const sinArrastrada = todas.filter((x) => x.id !== arrastrada);
                    soltar(col.id, Math.max(0, sinArrastrada.findIndex((x) => x.id === t.id)));
                  }}
                />
              ))}
              {mostradas.length === 0 && <li className="pl-columna__vacia">Sin tareas</li>}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
