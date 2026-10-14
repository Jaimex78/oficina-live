import { ListChecks, Plus, Search, Settings2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { TareaPlanner } from '@ol/shared';
import { useAvisos } from '../componentes/Avisos';
import { Modal } from '../componentes/Modal';
import { Campo } from '../componentes/Campo';
import { CajaError, Cargando } from '../componentes/Estados';
import { useSesion } from '../estado/sesion';
import { ModalConfig } from '../planner/ModalConfig';
import { ModalTarea } from '../planner/ModalTarea';
import { Tablero } from '../planner/Tablero';
import { usePlanner } from '../planner/usePlanner';

type Edicion = { tipo: 'nueva'; columna?: number } | { tipo: 'editar'; tarea: TareaPlanner } | { tipo: 'config' } | null;

/** El Planner del equipo: tareas en columnas, con filtros por marca, cliente, semáforo y responsable. */
export default function Planner() {
  const { usuario, tiene } = useSesion();
  const avisos = useAvisos();
  const [params, setParams] = useSearchParams();
  const tableroPedido = Number(params.get('tablero')) || undefined;
  const planner = usePlanner(tableroPedido);
  const [nuevoTablero, setNuevoTablero] = useState<string | null>(null);
  const [verArchivadas, setVerArchivadas] = useState(false);
  const [edicion, setEdicion] = useState<Edicion>(null);
  const [texto, setTexto] = useState('');
  const [filtros, setFiltros] = useState<Record<string, string>>({});
  const [responsable, setResponsable] = useState('');
  const [soloMias, setSoloMias] = useState(false);
  const datos = planner.datos;

  // Un aviso de la campana trae `?tarea=ID`: se abre esa tarea apenas llega el tablero.
  const tareaPedida = Number(params.get('tarea')) || undefined;
  useEffect(() => {
    if (!tareaPedida || !datos) return;
    const t = datos.tareas.find((x) => x.id === tareaPedida);
    if (t) {
      setEdicion({ tipo: 'editar', tarea: t });
      const p = new URLSearchParams(params);
      p.delete('tarea');
      setParams(p, { replace: true });
    }
    // Solo cuando llegan los datos o cambia la tarea pedida.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tareaPedida, datos]);

  const visible = useMemo(() => {
    const q = texto.trim().toLowerCase();
    return (t: TareaPlanner): boolean => {
      if (t.archivada && !verArchivadas) return false;
      if (q && !`${t.titulo} ${t.descripcion}`.toLowerCase().includes(q)) return false;
      for (const [campo, valor] of Object.entries(filtros)) if (valor && String(t.valores[campo] ?? '') !== valor) return false;
      if (responsable && String(t.responsableId ?? '') !== responsable) return false;
      if (soloMias && t.responsableId !== usuario?.id) return false;
      return true;
    };
  }, [texto, filtros, responsable, soloMias, verArchivadas, usuario?.id]);

  if (planner.error && !datos) {
    return (
      <section className="panel">
        <CajaError mensaje={planner.error} onReintentar={() => void planner.recargar()} />
      </section>
    );
  }
  if (!datos || !usuario) return <Cargando texto="Cargando el Planner…" />;

  const hayFiltros = Boolean(texto || responsable || soloMias || Object.values(filtros).some(Boolean));
  const total = datos.tareas.length;
  const hechas = datos.tareas.filter((t) => t.completadaEn).length;

  return (
    <section className="pl-pagina">
      <header className="pl-cab">
        <div>
          <h1 className="pl-cab__titulo">Planner</h1>
          <p className="pl-cab__sub">
            {total} {total === 1 ? 'tarea' : 'tareas'} · {hechas} terminadas
          </p>
        </div>
        <div className="pl-cab__acciones">
          {tiene('administrar') && (
            <button type="button" className="btn btn--secundario" onClick={() => setEdicion({ tipo: 'config' })}>
              <Settings2 aria-hidden="true" />
              <span>Configurar</span>
            </button>
          )}
          <button type="button" className="btn btn--primario" onClick={() => setEdicion({ tipo: 'nueva' })}>
            <Plus aria-hidden="true" />
            <span>Nueva tarea</span>
          </button>
        </div>
      </header>

      {datos.tableros.length > 1 || tiene('administrar') ? (
        <div className="pl-tableros" role="tablist" aria-label="Tableros">
          {datos.tableros.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={t.id === datos.tablero.id}
              className="pl-tablero-tab"
              onClick={() => {
                const p = new URLSearchParams(params);
                p.set('tablero', String(t.id));
                p.delete('tarea');
                setParams(p);
              }}
            >
              <i style={{ background: t.color }} aria-hidden="true" />
              {t.nombre}
            </button>
          ))}
          {tiene('administrar') && (
            <button type="button" className="btn btn--secundario btn--chico" onClick={() => setNuevoTablero('')}>
              <Plus aria-hidden="true" />
              <span>Nuevo tablero</span>
            </button>
          )}
        </div>
      ) : null}

      <div className="pl-filtros" role="search" aria-label="Filtrar tareas">
        <label className="pl-buscar">
          <Search aria-hidden="true" />
          <input type="search" className="entrada" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Buscar una tarea" aria-label="Buscar una tarea" autoComplete="off" />
        </label>
        {datos.campos
          .filter((c) => c.tipo === 'lista' && c.opciones.length > 0)
          .map((c) => (
            <select key={c.id} className="entrada" value={filtros[String(c.id)] ?? ''} onChange={(e) => setFiltros((f) => ({ ...f, [String(c.id)]: e.target.value }))} aria-label={`Filtrar por ${c.nombre}`}>
              <option value="">{c.nombre}: todas</option>
              {c.opciones.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.nombre}
                </option>
              ))}
            </select>
          ))}
        <select className="entrada" value={responsable} onChange={(e) => setResponsable(e.target.value)} aria-label="Filtrar por responsable">
          <option value="">Responsable: todos</option>
          {datos.personas.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>
        <label className="ed-check">
          <input type="checkbox" checked={soloMias} onChange={(e) => setSoloMias(e.target.checked)} />
          <span>Solo las mías</span>
        </label>
        <label className="ed-check">
          <input type="checkbox" checked={verArchivadas} onChange={(e) => setVerArchivadas(e.target.checked)} />
          <span>Ver archivadas</span>
        </label>
        {hayFiltros && (
          <button
            type="button"
            className="btn btn--secundario btn--chico"
            onClick={() => {
              setTexto('');
              setFiltros({});
              setResponsable('');
              setSoloMias(false);
            }}
          >
            Quitar filtros
          </button>
        )}
      </div>

      {total === 0 ? (
        <div className="pl-vacio">
          <ListChecks aria-hidden="true" />
          <h2>Todavía no hay tareas</h2>
          <p>Crea la primera y asígnala a alguien del equipo.</p>
          <button type="button" className="btn btn--primario" onClick={() => setEdicion({ tipo: 'nueva' })}>
            <Plus aria-hidden="true" />
            <span>Nueva tarea</span>
          </button>
        </div>
      ) : (
        <Tablero planner={planner} visible={visible} alAbrir={(t) => setEdicion({ tipo: 'editar', tarea: t })} alNueva={(columna) => setEdicion({ tipo: 'nueva', columna })} alError={(m) => avisos.error(m)} />
      )}

      {edicion?.tipo === 'nueva' && <ModalTarea columnaInicial={edicion.columna} planner={planner} puedeBorrar={false} alCerrar={() => setEdicion(null)} />}
      {edicion?.tipo === 'editar' && <ModalTarea tarea={edicion.tarea} planner={planner} puedeBorrar={tiene('administrar') || edicion.tarea.creadaPorId === usuario.id} alCerrar={() => setEdicion(null)} />}
      {edicion?.tipo === 'config' && <ModalConfig planner={planner} alCerrar={() => setEdicion(null)} />}
      {nuevoTablero !== null && (
        <Modal
          titulo="Nuevo tablero"
          descripcion="Cada marca, cliente o equipo puede tener el suyo, con sus propias columnas y campos. Empieza copiando las del tablero actual."
          onCerrar={() => setNuevoTablero(null)}
          pie={
            <>
              <button type="button" className="btn btn--secundario" onClick={() => setNuevoTablero(null)}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn--primario"
                disabled={!nuevoTablero.trim()}
                onClick={() =>
                  void planner
                    .crearTablero({ nombre: nuevoTablero, copiarDe: datos.tablero.id })
                    .then((d) => {
                      setNuevoTablero(null);
                      setParams(new URLSearchParams({ tablero: String(d.tablero.id) }));
                    })
                    .catch((x: unknown) => avisos.error(x instanceof Error ? x.message : 'No se pudo crear el tablero.'))
                }
              >
                Crear tablero
              </button>
            </>
          }
        >
          <Campo etiqueta="Nombre del tablero" value={nuevoTablero} onChange={(e) => setNuevoTablero(e.target.value)} maxLength={40} autoComplete="off" data-autofoco />
        </Modal>
      )}
    </section>
  );
}
