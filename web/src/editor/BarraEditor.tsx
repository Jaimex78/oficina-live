import { ArrowLeft, Check, CloudOff, Save, Eraser, Grid2x2, Hand, Layers, Loader2, MousePointer2, Redo2, Undo2, Upload, ZoomIn, ZoomOut } from 'lucide-react';
import { useEditor, useEstado } from './contexto';
import { ZOOMS } from '../mundo/escena';
import type { EstadoGuardado, Herramienta } from '../mundo/tipos';

const TEXTO_GUARDADO: Record<EstadoGuardado, string> = {
  limpio: 'Sin cambios nuevos',
  pendiente: 'Cambios sin guardar',
  guardando: 'Guardando…',
  guardado: 'Borrador guardado',
  error: 'No se pudo guardar',
  conflicto: 'Otra persona guardó cambios',
};

const HERRAMIENTAS: { id: Herramienta; nombre: string; atajo: string; Icono: typeof Hand }[] = [
  { id: 'seleccionar', nombre: 'Seleccionar', atajo: 'V', Icono: MousePointer2 },
  { id: 'mano', nombre: 'Mover la vista', atajo: 'H', Icono: Hand },
  { id: 'borrar', nombre: 'Borrar', atajo: 'E', Icono: Eraser },
];
const SOLO_AREA = ['seleccionar', 'mano', 'borrar'];

export function BarraEditor({ alRevision }: { alRevision: () => void }) {
  const { ctl, almacen, salir, publicar, areaPropia, guardarArea } = useEditor();
  const herramienta = useEstado((e) => e.herramienta);
  const puedeDeshacer = useEstado((e) => e.puedeDeshacer);
  const puedeRehacer = useEstado((e) => e.puedeRehacer);
  const rejilla = useEstado((e) => e.rejilla);
  const capas = useEstado((e) => e.capas);
  const zoom = useEstado((e) => e.zoom);
  const guardado = useEstado((e) => e.guardado);
  const errores = useEstado((e) => e.problemas.filter((p) => p.nivel === 'error').length);
  const avisos = useEstado((e) => e.problemas.filter((p) => p.nivel === 'aviso').length);

  const cambiarZoom = (paso: 1 | -1) => {
    const i = ZOOMS.findIndex((z) => z === zoom);
    const z = ZOOMS[Math.max(0, Math.min(ZOOMS.length - 1, (i < 0 ? 1 : i) + paso))];
    if (z !== undefined) almacen.set({ zoom: z });
  };

  return (
    <header className="ed-barra" role="toolbar" aria-label="Barra de construcción">
      <button type="button" className="btn btn--secundario btn--chico ed-salir" onClick={salir}>
        <ArrowLeft aria-hidden="true" />
        <span>Salir</span>
      </button>

      <div className={`ed-estado ed-estado--${guardado}`} role="status" aria-live="polite">
        {guardado === 'guardando' ? <Loader2 className="ed-giro" aria-hidden="true" /> : guardado === 'error' || guardado === 'conflicto' ? <CloudOff aria-hidden="true" /> : <Check aria-hidden="true" />}
        <span>{TEXTO_GUARDADO[guardado]}</span>
      </div>

      <span className="ed-sep" aria-hidden="true" />
      <div className="ed-grupo" role="group" aria-label="Herramientas">
        {HERRAMIENTAS.filter((h) => !areaPropia || SOLO_AREA.includes(h.id)).map(({ id, nombre, atajo, Icono }) => (
          <button key={id} type="button" className="ed-btn" aria-pressed={herramienta === id} onClick={() => ctl.elegirHerramienta(id)} title={`${nombre} (${atajo})`} aria-label={nombre}>
            <Icono aria-hidden="true" />
          </button>
        ))}
      </div>
      <span className="ed-sep" aria-hidden="true" />
      <div className="ed-grupo" role="group" aria-label="Historial">
        <button type="button" className="ed-btn" onClick={() => ctl.deshacer()} disabled={!puedeDeshacer} title="Deshacer (Ctrl+Z)" aria-label="Deshacer">
          <Undo2 aria-hidden="true" />
        </button>
        <button type="button" className="ed-btn" onClick={() => ctl.rehacer()} disabled={!puedeRehacer} title="Rehacer (Ctrl+Mayús+Z)" aria-label="Rehacer">
          <Redo2 aria-hidden="true" />
        </button>
      </div>
      <span className="ed-sep ed-sep--ocultar" aria-hidden="true" />
      <div className="ed-grupo ed-grupo--ocultar" role="group" aria-label="Vista">
        <button type="button" className="ed-btn" aria-pressed={rejilla} onClick={() => almacen.set({ rejilla: !rejilla })} title="Rejilla (G)" aria-label="Mostrar la rejilla">
          <Grid2x2 aria-hidden="true" />
        </button>
        <button type="button" className="ed-btn" aria-pressed={capas} onClick={() => almacen.set({ capas: !capas })} title="Zonas, llegadas y avisos" aria-label="Mostrar zonas, llegadas y avisos">
          <Layers aria-hidden="true" />
        </button>
        <button type="button" className="ed-btn" onClick={() => cambiarZoom(-1)} disabled={zoom <= (ZOOMS[0] ?? 0.5)} title="Alejar" aria-label="Alejar">
          <ZoomOut aria-hidden="true" />
        </button>
        <span className="ed-zoom" aria-live="polite">
          {Math.round(zoom * 100)}%
        </span>
        <button type="button" className="ed-btn" onClick={() => cambiarZoom(1)} disabled={zoom >= (ZOOMS[ZOOMS.length - 1] ?? 4)} title="Acercar" aria-label="Acercar">
          <ZoomIn aria-hidden="true" />
        </button>
      </div>

      <span className="ed-espacio" />
      {areaPropia && <span className="ed-area-nombre">{areaPropia.nombre}</span>}
      <button type="button" hidden={Boolean(areaPropia)} className={`ed-revision${errores > 0 ? ' ed-revision--error' : avisos > 0 ? ' ed-revision--aviso' : ''}`} onClick={alRevision} title="Ver la revisión del mapa">
        {errores > 0 ? `${errores} ${errores === 1 ? 'error' : 'errores'}` : avisos > 0 ? `${avisos} ${avisos === 1 ? 'aviso' : 'avisos'}` : 'Todo en orden'}
      </button>
      {areaPropia ? (
        <button type="button" className="btn btn--primario btn--chico" onClick={guardarArea}>
          <Save aria-hidden="true" />
          <span>Guardar mi área</span>
        </button>
      ) : (
        <button type="button" className="btn btn--primario btn--chico" onClick={publicar}>
          <Upload aria-hidden="true" />
          <span>Publicar</span>
        </button>
      )}
    </header>
  );
}
