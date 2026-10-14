import { Archive, ArchiveRestore, Plus, Send, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ComentarioPlanner, EntradaTarea, TareaPlanner, ValorCampo } from '@ol/shared';
import { LIMITES_PLANNER } from '@ol/shared';
import { ErrorApi } from '../api';
import { Campo, CampoSeleccion } from '../componentes/Campo';
import { FotoPersona } from '../componentes/FotoPersona';
import { Modal } from '../componentes/Modal';
import { useSesion } from '../estado/sesion';
import { borrarComentarioPlanner, comentarPlanner, pedirTareaPlanner } from './api';
import { hace } from './util';
import type { ApiPlanner } from './usePlanner';

interface Props {
  /** Tarea que se edita; si falta, se crea una nueva. */
  tarea?: TareaPlanner | undefined;
  columnaInicial?: number | undefined;
  planner: ApiPlanner;
  puedeBorrar: boolean;
  alCerrar: () => void;
}

/** Crear o editar una tarea: título, columna, responsable, fecha y todos los campos que la administración definió. */
export function ModalTarea({ tarea, columnaInicial, planner, puedeBorrar, alCerrar }: Props) {
  const datos = planner.datos;
  const [titulo, setTitulo] = useState(tarea?.titulo ?? '');
  const [descripcion, setDescripcion] = useState(tarea?.descripcion ?? '');
  const [columnaId, setColumnaId] = useState<number>(tarea?.columnaId ?? columnaInicial ?? datos?.columnas[0]?.id ?? 0);
  const [responsableId, setResponsableId] = useState<number | null>(tarea?.responsableId ?? null);
  const [fecha, setFecha] = useState(tarea?.fechaLimite ?? '');
  const [valores, setValores] = useState<Record<string, ValorCampo>>(tarea?.valores ?? {});
  const [miembros, setMiembros] = useState<number[]>(tarea?.miembros ?? []);
  const [subtareas, setSubtareas] = useState<{ id?: number; titulo: string; hecha: boolean }[]>(tarea?.subtareas ?? []);
  const [nuevaSub, setNuevaSub] = useState('');
  const [archivada, setArchivada] = useState(tarea?.archivada ?? false);
  const [comentarios, setComentarios] = useState<ComentarioPlanner[]>([]);
  const [comentario, setComentario] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const { usuario, tiene } = useSesion();

  // Los comentarios se piden al abrir la tarea.
  useEffect(() => {
    if (!tarea) return;
    let vigente = true;
    void pedirTareaPlanner(tarea.id)
      .then((r) => vigente && setComentarios(r.comentarios))
      .catch(() => undefined);
    return () => {
      vigente = false;
    };
  }, [tarea]);

  if (!datos) return null;

  const agregarSub = () => {
    const t = nuevaSub.trim();
    if (!t) return;
    setSubtareas((x) => [...x, { titulo: t, hecha: false }]);
    setNuevaSub('');
  };

  const enviarComentario = async () => {
    if (!tarea || !comentario.trim()) return;
    try {
      const c = await comentarPlanner(tarea.id, comentario);
      setComentarios((x) => [...x, c]);
      setComentario('');
    } catch (x) {
      setError(x instanceof ErrorApi || x instanceof Error ? x.message : 'No se pudo enviar el comentario.');
    }
  };

  const poner = (campoId: number, v: ValorCampo) => setValores((x) => ({ ...x, [String(campoId)]: v }));

  const guardar = async () => {
    if (!titulo.trim()) {
      setError('La tarea necesita un título.');
      return;
    }
    setGuardando(true);
    setError(null);
    const entrada: EntradaTarea = { titulo: titulo.trim(), descripcion, columnaId, responsableId, miembros: miembros.filter((m) => m !== responsableId), fechaLimite: fecha || null, valores, archivada, subtareas };
    try {
      if (tarea) await planner.actualizar(tarea.id, entrada);
      else await planner.crear(entrada);
      alCerrar();
    } catch (x) {
      setError(x instanceof ErrorApi || x instanceof Error ? x.message : 'No se pudo guardar la tarea.');
      setGuardando(false);
    }
  };

  const borrar = async () => {
    if (!tarea) return;
    setGuardando(true);
    try {
      await planner.borrar(tarea.id);
      alCerrar();
    } catch (x) {
      setError(x instanceof ErrorApi || x instanceof Error ? x.message : 'No se pudo borrar la tarea.');
      setGuardando(false);
    }
  };

  return (
    <Modal
      titulo={tarea ? 'Editar tarea' : 'Nueva tarea'}
      onCerrar={alCerrar}
      ancho
      pie={
        <>
          {tarea && puedeBorrar && (
            <button type="button" className="btn btn--peligro btn--chico pl-borrar" onClick={() => void borrar()} disabled={guardando}>
              <Trash2 aria-hidden="true" />
              <span>Borrar</span>
            </button>
          )}
          <button type="button" className="btn btn--secundario" onClick={alCerrar} disabled={guardando}>
            Cancelar
          </button>
          <button type="button" className={`btn btn--primario${guardando ? ' btn--cargando' : ''}`} onClick={() => void guardar()} disabled={guardando}>
            {tarea ? 'Guardar' : 'Crear tarea'}
          </button>
        </>
      }
    >
      <form
        className="pl-form"
        onSubmit={(e) => {
          e.preventDefault();
          void guardar();
        }}
      >
        <Campo etiqueta="Título" value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={LIMITES_PLANNER.titulo} autoComplete="off" data-autofoco />
        <div className="campo">
          <label className="campo__etiqueta" htmlFor="pl-descripcion">
            Descripción
          </label>
          <textarea id="pl-descripcion" className="entrada" rows={3} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} maxLength={LIMITES_PLANNER.descripcion} />
        </div>
        <div className="pl-fila">
          <CampoSeleccion etiqueta="Columna" value={columnaId} onChange={(e) => setColumnaId(Number(e.target.value))}>
            {datos.columnas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </CampoSeleccion>
          <CampoSeleccion etiqueta="Responsable" value={responsableId ?? ''} onChange={(e) => setResponsableId(e.target.value ? Number(e.target.value) : null)}>
            <option value="">Sin responsable</option>
            {datos.personas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </CampoSeleccion>
          <Campo etiqueta="Fecha límite" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </div>

        {datos.campos.map((c) => {
          const actual = valores[String(c.id)];
          if (c.tipo === 'lista') {
            return (
              <fieldset key={c.id} className="pl-opciones">
                <legend>{c.nombre}</legend>
                {c.opciones.length === 0 && <p className="campo__ayuda">Todavía no hay opciones. Quien administra las agrega en «Configurar».</p>}
                <div role="radiogroup" aria-label={c.nombre} className="pl-opciones__fila">
                  {c.opciones.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      role="radio"
                      aria-checked={actual === o.id}
                      className={`pl-opcion${c.semaforo ? ' pl-opcion--semaforo' : ''}`}
                      style={{ ['--c' as string]: o.color }}
                      // Tocar la opción elegida la quita.
                      onClick={() => poner(c.id, actual === o.id ? null : o.id)}
                    >
                      <i aria-hidden="true" />
                      {o.nombre}
                    </button>
                  ))}
                </div>
              </fieldset>
            );
          }
          if (c.tipo === 'fecha') return <Campo key={c.id} etiqueta={c.nombre} type="date" value={typeof actual === 'string' ? actual : ''} onChange={(e) => poner(c.id, e.target.value || null)} />;
          return <Campo key={c.id} etiqueta={c.nombre} value={typeof actual === 'string' ? actual : ''} maxLength={LIMITES_PLANNER.texto} onChange={(e) => poner(c.id, e.target.value || null)} />;
        })}
        <fieldset className="pl-opciones">
          <legend>Miembros</legend>
          <p className="campo__ayuda">Quienes colaboran además del responsable. A todos les llegan los avisos de la tarea.</p>
          <div className="pl-opciones__fila">
            {datos.personas
              .filter((p) => p.id !== responsableId)
              .map((p) => (
                <button key={p.id} type="button" role="checkbox" aria-checked={miembros.includes(p.id)} className="pl-opcion" onClick={() => setMiembros((m) => (m.includes(p.id) ? m.filter((x) => x !== p.id) : [...m, p.id]))}>
                  <FotoPersona id={p.id} nombre={p.nombre} foto={p.foto} tam={20} decorativa />
                  {p.nombre}
                </button>
              ))}
          </div>
        </fieldset>

        <fieldset className="pl-opciones">
          <legend>
            Subtareas{subtareas.length > 0 ? ` (${subtareas.filter((s) => s.hecha).length}/${subtareas.length})` : ''}
          </legend>
          <ul className="pl-subtareas">
            {subtareas.map((s, i) => (
              <li key={s.id ?? `n${i}`}>
                <label className="ed-check">
                  <input type="checkbox" checked={s.hecha} onChange={(e) => setSubtareas((x) => x.map((k, n) => (n === i ? { ...k, hecha: e.target.checked } : k)))} />
                  <span className={s.hecha ? 'pl-hecha' : undefined}>{s.titulo}</span>
                </label>
                <button type="button" className="ed-btn" aria-label={`Quitar la subtarea ${s.titulo}`} onClick={() => setSubtareas((x) => x.filter((_, n) => n !== i))}>
                  <X aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
          <div className="pl-agregar">
            <input
              className="entrada"
              value={nuevaSub}
              onChange={(e) => setNuevaSub(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  agregarSub();
                }
              }}
              placeholder="Agregar una subtarea"
              aria-label="Nueva subtarea"
              maxLength={LIMITES_PLANNER.titulo}
            />
            <button type="button" className="btn btn--secundario btn--chico" onClick={agregarSub} disabled={!nuevaSub.trim()}>
              <Plus aria-hidden="true" />
              <span>Agregar</span>
            </button>
          </div>
        </fieldset>

        {tarea && (
          <section className="pl-comentarios" aria-label="Comentarios">
            <h3>Comentarios{comentarios.length > 0 ? ` (${comentarios.length})` : ''}</h3>
            <ul>
              {comentarios.map((c) => (
                <li key={c.id}>
                  <p>
                    <FotoPersona id={c.autorId ?? 0} nombre={c.autor} foto={datos.personas.find((x) => x.id === c.autorId)?.foto} tam={20} className="pl-comentario__foto" decorativa /> <strong>{c.autor}</strong> <small>{hace(c.creadaEn)}</small>
                  </p>
                  <p>{c.texto}</p>
                  {(tiene('administrar') || c.autorId === usuario?.id) && (
                    <button
                      type="button"
                      className="pl-comentario__borrar"
                      onClick={() =>
                        void borrarComentarioPlanner(tarea.id, c.id)
                          .then(() => setComentarios((x) => x.filter((k) => k.id !== c.id)))
                          .catch(() => undefined)
                      }
                    >
                      Borrar
                    </button>
                  )}
                </li>
              ))}
            </ul>
            <div className="pl-agregar">
              <input className="entrada" value={comentario} onChange={(e) => setComentario(e.target.value)} placeholder="Escribe un comentario" aria-label="Nuevo comentario" maxLength={LIMITES_PLANNER.comentario} />
              <button type="button" className="btn btn--secundario btn--chico" onClick={() => void enviarComentario()} disabled={!comentario.trim()}>
                <Send aria-hidden="true" />
                <span>Enviar</span>
              </button>
            </div>
          </section>
        )}
        {tarea && (
          <button type="button" className="btn btn--secundario btn--chico pl-archivar" onClick={() => setArchivada((a) => !a)}>
            {archivada ? <ArchiveRestore aria-hidden="true" /> : <Archive aria-hidden="true" />}
            <span>{archivada ? 'Sacar del archivo' : 'Archivar la tarea'}</span>
          </button>
        )}
        {error && (
          <p className="campo__error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}
