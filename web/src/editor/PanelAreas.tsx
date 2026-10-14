import { Plus, Trash2, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useEditor, useEstado } from './contexto';
import { pedirPersonas, type PersonaAsignable } from '../mundo/api-oficina';

/**
 * Las áreas personales: cada una es un rectángulo del mapa que una o más personas pueden editar (poner otro computador,
 * quitar una planta) y nada más. Quien administra las dibuja y elige a quién se las da.
 */
export function PanelAreas() {
  const { ctl } = useEditor();
  const herramienta = useEstado((e) => e.herramienta);
  const sala = useEstado((e) => e.sala);
  const [personas, setPersonas] = useState<PersonaAsignable[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [abierta, setAbierta] = useState<string | null>(null);
  const activo = herramienta === 'area';

  useEffect(() => {
    let vigente = true;
    pedirPersonas()
      .then((p) => vigente && setPersonas(p))
      .catch(() => vigente && setError('No se pudo cargar la lista de personas.'));
    return () => {
      vigente = false;
    };
  }, []);

  if (!sala) return null;
  const areas = sala.areas ?? [];
  const nombreDe = (id: number): string => personas?.find((p) => p.id === id)?.nombre ?? `Cuenta ${id}`;

  return (
    <div className="ed-contenido">
      <p className="ed-ayuda">Un área es un espacio que le das a una persona: ahí puede poner o quitar sus cosas (otro computador, una planta) y solo ahí. Paredes, pisos y el resto siguen siendo tuyos.</p>
      <button type="button" className={`btn ${activo ? 'btn--primario' : 'btn--secundario'} btn--bloque`} onClick={() => ctl.elegirHerramienta(activo ? 'seleccionar' : 'area')}>
        <Plus aria-hidden="true" />
        {activo ? 'Arrastra en el mapa para dibujarla' : 'Dibujar un área'}
      </button>
      <button type="button" className="btn btn--secundario btn--bloque" onClick={() => ctl.crearAreasDePuestos()} title="Crea el área de cada puesto con nombre que todavía no tenga una">
        <Users aria-hidden="true" />
        Crear un área por cada puesto
      </button>
      {error && <p className="ed-nota">{error}</p>}

      <ul className="ed-lista">
        {areas.map((a) => {
          const desplegada = abierta === a.id;
          return (
            <li key={a.id} className="ed-area">
              <div className="ed-fila ed-fila--sala">
                <button type="button" className="ed-fila__texto ed-fila__boton" aria-expanded={desplegada} onClick={() => setAbierta(desplegada ? null : a.id)}>
                  <strong>{a.nombre}</strong>
                  <small>{a.duenos.length === 0 ? 'Sin dueño' : a.duenos.map(nombreDe).join(', ')}</small>
                </button>
                <button type="button" className="ed-btn" title="Quitar el área" aria-label={`Quitar el área ${a.nombre}`} onClick={() => ctl.quitarAreaPorId(a.id)}>
                  <Trash2 aria-hidden="true" />
                </button>
              </div>
              {desplegada && (
                <div className="ed-area__detalle">
                  <label className="ed-campo">
                    <span>Nombre</span>
                    <input className="entrada" defaultValue={a.nombre} maxLength={60} onBlur={(e) => e.target.value.trim() && e.target.value !== a.nombre && ctl.actualizarAreaPorId(a.id, { nombre: e.target.value })} />
                  </label>
                  <fieldset className="ed-duenos">
                    <legend>Quién puede editarla</legend>
                    {personas === null && !error && <p className="ed-ayuda">Cargando personas…</p>}
                    {(personas ?? []).map((p) => (
                      <label key={p.id} className="ed-check">
                        <input
                          type="checkbox"
                          checked={a.duenos.includes(p.id)}
                          onChange={(e) => ctl.actualizarAreaPorId(a.id, { duenos: e.target.checked ? [...a.duenos, p.id] : a.duenos.filter((d) => d !== p.id) })}
                        />
                        <span>
                          {p.nombre}
                          <small> · {p.usuario}</small>
                        </span>
                      </label>
                    ))}
                  </fieldset>
                </div>
              )}
            </li>
          );
        })}
        {areas.length === 0 && <li className="ed-vacio">Aún no hay áreas en esta sala.</li>}
      </ul>
      <p className="ed-ayuda">Cuando termines, publica: la persona entra a su área desde el botón «Mi área» de la oficina.</p>
    </div>
  );
}
