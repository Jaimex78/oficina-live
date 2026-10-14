import { Eraser, PaintBucket, Pencil, Square } from 'lucide-react';
import { INVENTARIO } from '@ol/shared';
import { MiniaturaObjeto } from './MiniaturaObjeto';
import { useEditor, useEstado } from './contexto';
import type { ModoPiso } from '../mundo/tipos';

const PISOS = INVENTARIO.filter((o) => o.capa === 'piso');
const MODOS: { id: ModoPiso; nombre: string; Icono: typeof Pencil; tecla: string }[] = [
  { id: 'pincel', nombre: 'Pincel', Icono: Pencil, tecla: 'Pinta casilla por casilla arrastrando' },
  { id: 'rectangulo', nombre: 'Rectángulo', Icono: Square, tecla: 'Pinta un área de una vez' },
  { id: 'bote', nombre: 'Rellenar', Icono: PaintBucket, tecla: 'Rellena toda la zona conectada' },
  { id: 'borrador', nombre: 'Borrar', Icono: Eraser, tecla: 'Quita el piso' },
];

export function PanelPisos() {
  const { ctl } = useEditor();
  const herramienta = useEstado((e) => e.herramienta);
  const piso = useEstado((e) => e.pincel.piso);
  const modo = useEstado((e) => e.pincel.modoPiso);
  const activo = herramienta === 'piso';

  return (
    <div className="ed-contenido">
      <div className="ed-segmentos" role="radiogroup" aria-label="Cómo pintar">
        {MODOS.map(({ id, nombre, Icono, tecla }) => (
          <button key={id} type="button" role="radio" aria-checked={activo && modo === id} className="ed-segmento" onClick={() => ctl.elegirModoPiso(id)} title={tecla}>
            <Icono aria-hidden="true" />
            <span>{nombre}</span>
          </button>
        ))}
      </div>
      <div className="ed-rejilla-objetos ed-rejilla-pisos" role="list">
        {PISOS.map((o) => (
          <button key={o.id} type="button" role="listitem" className="ed-objeto" aria-pressed={activo && piso === o.id} onClick={() => ctl.elegirPiso(o.id)}>
            <MiniaturaObjeto objeto={o} />
            <span className="ed-objeto__nombre">{o.nombre}</span>
          </button>
        ))}
      </div>
      <p className="ed-ayuda">Los objetos van sobre el piso: pinta primero el piso de una sala y después las paredes y los muebles.</p>
    </div>
  );
}
