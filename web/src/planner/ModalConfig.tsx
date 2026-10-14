import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { COLORES_PLANNER, LIMITES_PLANNER, type CampoPlanner, type ColumnaPlanner, type ConfigPlanner, type TipoCampoPlanner } from '@ol/shared';
import { ErrorApi } from '../api';
import { Modal } from '../componentes/Modal';
import type { ApiPlanner } from './usePlanner';

type ColumnaEd = { id?: number; nombre: string; color: string; esFinal: boolean };
type OpcionEd = { id?: number; nombre: string; color: string };
type CampoEd = { id?: number; nombre: string; tipo: TipoCampoPlanner; semaforo: boolean; opciones: OpcionEd[] };

const NOMBRE_TIPO: Record<TipoCampoPlanner, string> = { lista: 'Lista de opciones', texto: 'Texto', fecha: 'Fecha' };

function Colores({ valor, alElegir, nombre }: { valor: string; alElegir: (hex: string) => void; nombre: string }) {
  return (
    <span className="pl-colores" role="radiogroup" aria-label={`Color de ${nombre}`}>
      {COLORES_PLANNER.map((c) => (
        <button key={c.id} type="button" role="radio" aria-checked={valor.toLowerCase() === c.hex.toLowerCase()} className="pl-color" style={{ background: c.hex }} title={c.nombre} aria-label={c.nombre} onClick={() => alElegir(c.hex)} />
      ))}
    </span>
  );
}

function mover<T>(lista: T[], i: number, paso: -1 | 1): T[] {
  const j = i + paso;
  if (j < 0 || j >= lista.length) return lista;
  const copia = [...lista];
  [copia[i], copia[j]] = [copia[j] as T, copia[i] as T];
  return copia;
}

/** La configuración del Planner, solo para quien administra: columnas, y campos como Marca, Cliente o el semáforo de prioridad. */
export function ModalConfig({ planner, alCerrar }: { planner: ApiPlanner; alCerrar: () => void }) {
  const datos = planner.datos;
  const [columnas, setColumnas] = useState<ColumnaEd[]>(() => (datos?.columnas ?? []).map((c: ColumnaPlanner) => ({ ...c })));
  const [campos, setCampos] = useState<CampoEd[]>(() => (datos?.campos ?? []).map((c: CampoPlanner) => ({ ...c, opciones: c.opciones.map((o) => ({ ...o })) })));
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  if (!datos) return null;

  const cambiarCampo = (i: number, cambio: Partial<CampoEd>) => setCampos((x) => x.map((c, k) => (k === i ? { ...c, ...cambio } : c)));
  const cambiarOpcion = (i: number, j: number, cambio: Partial<OpcionEd>) => cambiarCampo(i, { opciones: campos[i]!.opciones.map((o, k) => (k === j ? { ...o, ...cambio } : o)) });

  const guardar = async () => {
    setGuardando(true);
    setError(null);
    const config: ConfigPlanner = { columnas, campos };
    try {
      await planner.guardarConfig(config);
      alCerrar();
    } catch (x) {
      setError(x instanceof ErrorApi || x instanceof Error ? x.message : 'No se pudo guardar la configuración.');
      setGuardando(false);
    }
  };

  const tareasEn = (id?: number) => (id === undefined ? 0 : datos.tareas.filter((t) => t.columnaId === id).length);

  return (
    <Modal
      titulo="Configurar el Planner"
      descripcion="Cambia las columnas y los campos de las tareas. Lo que quites se limpia de las tareas que lo usaban."
      onCerrar={alCerrar}
      ancho
      pie={
        <>
          <button type="button" className="btn btn--secundario" onClick={alCerrar} disabled={guardando}>
            Cancelar
          </button>
          <button type="button" className={`btn btn--primario${guardando ? ' btn--cargando' : ''}`} onClick={() => void guardar()} disabled={guardando}>
            Guardar cambios
          </button>
        </>
      }
    >
      <div className="pl-config">
        <section aria-labelledby="pl-cfg-columnas">
          <h3 id="pl-cfg-columnas" className="pl-config__titulo">
            Columnas
          </h3>
          <ul className="pl-config__lista">
            {columnas.map((c, i) => (
              <li key={c.id ?? `n${i}`} className="pl-config__fila">
                <input className="entrada" value={c.nombre} maxLength={LIMITES_PLANNER.nombre} aria-label={`Nombre de la columna ${i + 1}`} onChange={(e) => setColumnas((x) => x.map((k, n) => (n === i ? { ...k, nombre: e.target.value } : k)))} />
                <Colores valor={c.color} nombre={c.nombre || 'la columna'} alElegir={(hex) => setColumnas((x) => x.map((k, n) => (n === i ? { ...k, color: hex } : k)))} />
                <label className="ed-check" title="Las tareas que lleguen aquí cuentan como terminadas">
                  <input type="checkbox" checked={c.esFinal} onChange={(e) => setColumnas((x) => x.map((k, n) => (n === i ? { ...k, esFinal: e.target.checked } : k)))} />
                  <span>Terminadas</span>
                </label>
                <span className="pl-config__acciones">
                  <button type="button" className="ed-btn" aria-label="Subir" onClick={() => setColumnas((x) => mover(x, i, -1))} disabled={i === 0}>
                    <ArrowUp aria-hidden="true" />
                  </button>
                  <button type="button" className="ed-btn" aria-label="Bajar" onClick={() => setColumnas((x) => mover(x, i, 1))} disabled={i === columnas.length - 1}>
                    <ArrowDown aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="ed-btn"
                    aria-label={`Quitar la columna ${c.nombre}`}
                    title={tareasEn(c.id) > 0 ? `Sus ${tareasEn(c.id)} tareas pasan a la primera columna` : 'Quitar'}
                    onClick={() => setColumnas((x) => x.filter((_, n) => n !== i))}
                    disabled={columnas.length <= 1}
                  >
                    <Trash2 aria-hidden="true" />
                  </button>
                </span>
              </li>
            ))}
          </ul>
          <button type="button" className="btn btn--secundario btn--chico" onClick={() => setColumnas((x) => [...x, { nombre: 'Nueva columna', color: '#8E8E93', esFinal: false }])} disabled={columnas.length >= LIMITES_PLANNER.columnas}>
            <Plus aria-hidden="true" />
            <span>Agregar columna</span>
          </button>
        </section>

        <section aria-labelledby="pl-cfg-campos">
          <h3 id="pl-cfg-campos" className="pl-config__titulo">
            Campos de la tarea
          </h3>
          <p className="campo__ayuda">Por ejemplo Marca, Cliente o el semáforo de prioridad. Los de lista tienen opciones con color.</p>
          {campos.map((c, i) => (
            <div key={c.id ?? `n${i}`} className="pl-campo">
              <div className="pl-config__fila">
                <input className="entrada" value={c.nombre} maxLength={LIMITES_PLANNER.nombre} aria-label={`Nombre del campo ${i + 1}`} onChange={(e) => cambiarCampo(i, { nombre: e.target.value })} />
                <select
                  className="entrada"
                  value={c.tipo}
                  aria-label={`Tipo del campo ${c.nombre}`}
                  onChange={(e) => {
                    const tipo = e.target.value as TipoCampoPlanner;
                    cambiarCampo(i, tipo === 'lista' ? { tipo } : { tipo, semaforo: false, opciones: [] });
                  }}
                >
                  {(Object.keys(NOMBRE_TIPO) as TipoCampoPlanner[]).map((t) => (
                    <option key={t} value={t}>
                      {NOMBRE_TIPO[t]}
                    </option>
                  ))}
                </select>
                {c.tipo === 'lista' && (
                  <label className="ed-check" title="Se muestra con sus colores, como un semáforo">
                    <input type="checkbox" checked={c.semaforo} onChange={(e) => cambiarCampo(i, { semaforo: e.target.checked })} />
                    <span>Semáforo</span>
                  </label>
                )}
                <span className="pl-config__acciones">
                  <button type="button" className="ed-btn" aria-label="Subir" onClick={() => setCampos((x) => mover(x, i, -1))} disabled={i === 0}>
                    <ArrowUp aria-hidden="true" />
                  </button>
                  <button type="button" className="ed-btn" aria-label="Bajar" onClick={() => setCampos((x) => mover(x, i, 1))} disabled={i === campos.length - 1}>
                    <ArrowDown aria-hidden="true" />
                  </button>
                  <button type="button" className="ed-btn" aria-label={`Quitar el campo ${c.nombre}`} onClick={() => setCampos((x) => x.filter((_, n) => n !== i))}>
                    <Trash2 aria-hidden="true" />
                  </button>
                </span>
              </div>
              {c.tipo === 'lista' && (
                <div className="pl-opciones-ed">
                  {c.opciones.map((o, j) => (
                    <div key={o.id ?? `n${j}`} className="pl-config__fila pl-config__fila--opcion">
                      <input className="entrada" value={o.nombre} maxLength={LIMITES_PLANNER.nombre} aria-label={`Opción ${j + 1} de ${c.nombre}`} onChange={(e) => cambiarOpcion(i, j, { nombre: e.target.value })} />
                      <Colores valor={o.color} nombre={o.nombre || 'la opción'} alElegir={(hex) => cambiarOpcion(i, j, { color: hex })} />
                      <button type="button" className="ed-btn" aria-label={`Quitar la opción ${o.nombre}`} onClick={() => cambiarCampo(i, { opciones: c.opciones.filter((_, n) => n !== j) })}>
                        <Trash2 aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                  <button type="button" className="btn btn--secundario btn--chico" onClick={() => cambiarCampo(i, { opciones: [...c.opciones, { nombre: '', color: COLORES_PLANNER[c.opciones.length % COLORES_PLANNER.length]!.hex }] })} disabled={c.opciones.length >= LIMITES_PLANNER.opcionesPorCampo}>
                    <Plus aria-hidden="true" />
                    <span>Agregar opción</span>
                  </button>
                </div>
              )}
            </div>
          ))}
          <button type="button" className="btn btn--secundario btn--chico" onClick={() => setCampos((x) => [...x, { nombre: 'Nuevo campo', tipo: 'lista', semaforo: false, opciones: [] }])} disabled={campos.length >= LIMITES_PLANNER.campos}>
            <Plus aria-hidden="true" />
            <span>Agregar campo</span>
          </button>
        </section>
        {error && (
          <p className="campo__error" role="alert">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
