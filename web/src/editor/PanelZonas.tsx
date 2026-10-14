import { BoxSelect } from 'lucide-react';
import { ETIQUETA_ZONA } from './etiquetas';
import { useEditor, useEstado } from './contexto';
import type { TipoZona } from '@ol/shared';

const TIPOS: TipoZona[] = ['abierta', 'silenciosa', 'privada', 'sala', 'coworking'];
const COLOR: Record<TipoZona, string> = { abierta: '#6b8cff', silenciosa: '#34c759', privada: '#a855f7', sala: '#ef3b3a', coworking: '#2dd4bf' };

export function PanelZonas() {
  const { ctl, almacen } = useEditor();
  const sala = useEstado((e) => e.sala);
  const herramienta = useEstado((e) => e.herramienta);
  const tipo = useEstado((e) => e.pincel.zonaTipo);
  const seleccion = useEstado((e) => e.seleccion);
  if (!sala) return null;

  return (
    <div className="ed-contenido">
      <p className="ed-ayuda">Una zona es un área con nombre: una sala de reuniones, un rincón silencioso, un equipo. Dibújala arrastrando sobre el mapa.</p>
      <div className="ed-segmentos ed-segmentos--zonas" role="radiogroup" aria-label="Tipo de zona nueva">
        {TIPOS.map((t) => (
          <button key={t} type="button" role="radio" aria-checked={tipo === t} className="ed-segmento" onClick={() => ctl.elegirTipoZona(t)}>
            <span className="ed-punto" style={{ background: COLOR[t] }} aria-hidden="true" />
            <span>{ETIQUETA_ZONA[t].nombre}</span>
          </button>
        ))}
      </div>
      <button type="button" className={`btn ${herramienta === 'zona' ? 'btn--primario' : 'btn--secundario'} btn--bloque`} onClick={() => ctl.elegirHerramienta('zona')}>
        <BoxSelect aria-hidden="true" />
        {herramienta === 'zona' ? 'Dibujando: arrastra en el mapa' : 'Dibujar una zona'}
      </button>

      <ul className="ed-lista">
        {sala.zonas.map((z) => {
          const activa = seleccion.some((s) => s.tipo === 'zona' && s.id === z.id);
          return (
            <li key={z.id}>
              <button
                type="button"
                className="ed-fila"
                aria-pressed={activa}
                onClick={() => {
                  ctl.elegirHerramienta('seleccionar');
                  ctl.seleccionar([{ tipo: 'zona', id: z.id }]);
                  almacen.set({ centrar: { x: (z.rect.x + z.rect.w / 2) * 32, y: (z.rect.y + z.rect.h / 2) * 32, n: Date.now() } });
                }}
              >
                <span className="ed-punto" style={{ background: z.color ?? COLOR[z.tipo] }} aria-hidden="true" />
                <span className="ed-fila__texto">
                  <strong>{z.nombre}</strong>
                  <small>
                    {ETIQUETA_ZONA[z.tipo].nombre} · {z.rect.w}×{z.rect.h}
                  </small>
                </span>
              </button>
            </li>
          );
        })}
        {sala.zonas.length === 0 && <li className="ed-vacio">Aún no hay zonas.</li>}
      </ul>
    </div>
  );
}
