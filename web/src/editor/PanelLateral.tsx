import { ChevronLeft, ChevronRight, Grid3x3, Home, ListChecks, MapPin, Sofa, SquareDashed, UserRoundCheck } from 'lucide-react';
import { useEffect, useRef, useState, type ComponentType } from 'react';
import { PanelAreas } from './PanelAreas';
import { PanelLlegadas } from './PanelLlegadas';
import { PanelObjetos } from './PanelObjetos';
import { PanelPisos } from './PanelPisos';
import { PanelSalas } from './PanelSalas';
import { PanelRevision } from './PanelRevision';
import { PanelZonas } from './PanelZonas';
import { useEditor, useEstado } from './contexto';

import { PESTANA_DE_HERRAMIENTA, prepararCambioDePestana, type Pestana } from './pestanas';

export type { Pestana };

const PESTANAS: { id: Pestana; nombre: string; Icono: ComponentType<{ 'aria-hidden'?: boolean }>; Panel: ComponentType }[] = [
  { id: 'salas', nombre: 'Salas', Icono: Home, Panel: PanelSalas },
  { id: 'objetos', nombre: 'Objetos', Icono: Sofa, Panel: PanelObjetos },
  { id: 'pisos', nombre: 'Pisos', Icono: Grid3x3, Panel: PanelPisos },
  { id: 'zonas', nombre: 'Zonas', Icono: SquareDashed, Panel: PanelZonas },
  { id: 'areas', nombre: 'Áreas', Icono: UserRoundCheck, Panel: PanelAreas },
  { id: 'llegadas', nombre: 'Llegadas', Icono: MapPin, Panel: PanelLlegadas },
  { id: 'revision', nombre: 'Revisión', Icono: ListChecks, Panel: PanelRevision },
];

/** Panel de la izquierda: el inventario y las herramientas de la oficina, con una barra de pestañas a un lado. */
export function PanelLateral({ pestana, alCambiar }: { pestana: Pestana; alCambiar: (p: Pestana) => void }) {
  const { ctl, areaPropia } = useEditor();
  const [abierto, setAbierto] = useState(true);
  const errores = useEstado((e) => e.problemas.filter((p) => p.nivel === 'error').length);
  const avisos = useEstado((e) => e.problemas.filter((p) => p.nivel === 'aviso').length);
  const herramienta = useEstado((e) => e.herramienta);

  // Elegir una herramienta (con el atajo, la barra o un panel) lleva a su pestaña. Solo se reacciona cuando cambia la
  // herramienta: si dependiera también de la pestaña, al tocar otra pestaña esto la devolvería a la anterior.
  const pestanaRef = useRef(pestana);
  pestanaRef.current = pestana;
  useEffect(() => {
    const destino = PESTANA_DE_HERRAMIENTA[herramienta];
    if (destino && destino !== pestanaRef.current) alCambiar(destino);
  }, [herramienta, alCambiar]);

  // Quien edita solo su área ve únicamente los objetos.
  const visibles = areaPropia ? PESTANAS.filter((p) => p.id === 'objetos') : PESTANAS;
  const actual = visibles.find((p) => p.id === pestana) ?? (visibles[0] as (typeof PESTANAS)[number]);
  const { Panel } = actual;

  return (
    <aside className={`ed-panel${abierto ? '' : ' ed-panel--cerrado'}`} aria-label="Herramientas de construcción">
      <div className="ed-riel" role="tablist" aria-orientation="vertical" aria-label="Secciones">
        {visibles.map(({ id, nombre, Icono }) => {
          const marca = id === 'revision' ? (errores > 0 ? { n: errores, tono: 'error' } : avisos > 0 ? { n: avisos, tono: 'aviso' } : null) : null;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={abierto && actual.id === id}
              className="ed-riel__boton"
              title={nombre}
              onClick={() => {
                // Cambiar de pestaña siempre funciona: lo que esté a medias se cierra y la herramienta de otra pestaña se suelta.
                prepararCambioDePestana(ctl, id);
                alCambiar(id);
                setAbierto(true);
              }}
            >
              <Icono aria-hidden={true} />
              <span>{nombre}</span>
              {marca && <i className={`ed-marca ed-marca--${marca.tono}`}>{marca.n}</i>}
            </button>
          );
        })}
        <button type="button" className="ed-riel__boton ed-riel__plegar" onClick={() => setAbierto((a) => !a)} aria-label={abierto ? 'Ocultar el panel' : 'Mostrar el panel'} aria-expanded={abierto} title={abierto ? 'Ocultar' : 'Mostrar'}>
          {abierto ? <ChevronLeft aria-hidden={true} /> : <ChevronRight aria-hidden={true} />}
        </button>
      </div>
      {abierto && (
        <section className="ed-cuerpo" role="tabpanel" aria-label={actual.nombre}>
          <h2 className="ed-titulo">{actual.nombre}</h2>
          <Panel />
        </section>
      )}
    </aside>
  );
}
