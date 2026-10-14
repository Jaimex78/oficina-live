import { Archive, Armchair, Bath, ChevronLeft, ChevronRight, Coffee, Flower2, Frame, Gamepad2, Lock, Monitor, PartyPopper, RotateCw, Search, Table2, TreePine, Zap } from 'lucide-react';
import { memo, useCallback, useDeferredValue, useMemo, useRef, useState, type ComponentType } from 'react';
import { COLECCIONES, GRUPOS_OBJETO, INVENTARIO, grupoDe, huellaDe, objetoDisponible, objetoPermitidoEnArea, objetoPorId, type ColeccionId, type GrupoId, type ObjetoCatalogo } from '@ol/shared';
import { MiniaturaObjeto } from './MiniaturaObjeto';
import { MiniaturaPerezosa } from './MiniaturaPerezosa';
import { useEditor, useEstado } from './contexto';

const ICONOS: Record<GrupoId, ComponentType<{ 'aria-hidden'?: boolean }>> = {
  tecnologia: Monitor,
  decoracion: Flower2,
  comida: Coffee,
  exterior: TreePine,
  pared: Frame,
  almacenaje: Archive,
  mesas: Table2,
  asientos: Armchair,
  juegos: Gamepad2,
  temporada: PartyPopper,
  banos: Bath,
};

/** Lo que el editor ofrece: sin pisos (tienen su pestaña) y sin lo obsoleto. */
const OBJETOS = INVENTARIO.filter((o) => o.capa !== 'piso' && !o.obsoleto).map((o) => ({ o, grupo: grupoDe(o) }));

const sinTildes = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const Celda = memo(function Celda({ o, activo, bloqueado, alElegir }: { o: ObjetoCatalogo; activo: boolean; bloqueado: boolean; alElegir: (id: string) => void }) {
  const h = huellaDe(o, 'S');
  const animado = Boolean(o.emisor);
  return (
    <button
      type="button"
      role="listitem"
      className={`ed-objeto${bloqueado ? ' ed-objeto--bloqueado' : ''}`}
      aria-pressed={activo}
      aria-disabled={bloqueado || undefined}
      aria-label={`${o.nombre}, ${h.ancho} por ${h.alto}${animado ? ', animado' : ''}${bloqueado ? ', bloqueado' : ''}`}
      data-nombre={o.nombre}
      onClick={() => !bloqueado && alElegir(o.id)}
    >
      <MiniaturaPerezosa objeto={o} />
      {animado && (
        <i className="ed-insignia ed-insignia--luz" title="Animado: tiene luz">
          <Zap aria-hidden="true" />
        </i>
      )}
      {bloqueado && (
        <i className="ed-insignia ed-insignia--candado" title="Tu permiso no incluye este objeto">
          <Lock aria-hidden="true" />
        </i>
      )}
    </button>
  );
});

/** El inventario como el de Gather Studio: buscador, pestañas por categoría y cuadrícula de miniaturas. */
export function PanelObjetos() {
  const { ctl, arte, areaPropia, paquetes } = useEditor();
  const [texto, setTexto] = useState('');
  const [grupo, setGrupo] = useState<GrupoId>('tecnologia');
  const [fiesta, setFiesta] = useState<ColeccionId | 'todas'>('todas');
  const buscado = useDeferredValue(texto);
  const fila = useRef<HTMLDivElement>(null);
  const elegido = useEstado((e) => (e.herramienta === 'objeto' ? e.pincel.objeto : null));
  const variante = useEstado((e) => e.pincel.variante);
  const orientacion = useEstado((e) => e.pincel.orientacion);

  // Quien edita solo su área no ve nada de lo estructural (paredes, ventanas, puertas, portales).
  const visibles = useMemo(() => OBJETOS.filter(({ o }) => !areaPropia || objetoPermitidoEnArea(o)), [areaPropia]);
  const grupos = useMemo(() => {
    const cuenta = new Map<GrupoId, number>();
    for (const { grupo: g } of visibles) cuenta.set(g, (cuenta.get(g) ?? 0) + 1);
    return GRUPOS_OBJETO.filter((g) => (cuenta.get(g.id) ?? 0) > 0).map((g) => ({ ...g, total: cuenta.get(g.id) ?? 0 }));
  }, [visibles]);
  const grupoActual = grupos.find((g) => g.id === grupo) ?? grupos[0];

  const q = sinTildes(buscado.trim());
  const lista = useMemo(
    () =>
      visibles
        .filter(({ o, grupo: g }) => (q ? sinTildes(o.nombre).includes(q) || o.etiquetas.some((t) => sinTildes(t).includes(q)) : g === grupoActual?.id && (g !== 'temporada' || fiesta === 'todas' || o.coleccion === fiesta)))
        .map(({ o }) => o),
    [visibles, q, grupoActual, fiesta],
  );
  const bloqueadoDe = (o: ObjetoCatalogo) => Boolean(paquetes && !objetoDisponible(o, paquetes));
  const obj = elegido ? objetoPorId(elegido) : undefined;
  const elegir = useCallback((id: string) => ctl.elegirObjeto(id), [ctl]);
  const mover = (d: number) => fila.current?.scrollBy({ left: d * 150, behavior: 'smooth' });

  return (
    <div className="ed-contenido">
      <div className="ed-busca">
        <Search aria-hidden="true" />
        <input type="search" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Buscar una decoración" aria-label="Buscar en el inventario" autoComplete="off" />
      </div>

      <div className="ed-pestanas">
        <button type="button" className="ed-pestanas__flecha" onClick={() => mover(-1)} aria-label="Categorías anteriores">
          <ChevronLeft aria-hidden="true" />
        </button>
        <div className="ed-pestanas__fila" ref={fila} role="tablist" aria-label="Categorías de objetos">
          {grupos.map((g) => {
            const Icono = ICONOS[g.id];
            const sel = !q && g.id === grupoActual?.id;
            return (
              <button
                key={g.id}
                type="button"
                role="tab"
                aria-selected={sel}
                className="ed-pestanas__tab"
                title={`${g.nombre} (${g.total})`}
                aria-label={g.nombre}
                onClick={() => {
                  setGrupo(g.id);
                  setTexto('');
                  setFiesta('todas');
                }}
              >
                <Icono aria-hidden={true} />
              </button>
            );
          })}
        </div>
        <button type="button" className="ed-pestanas__flecha" onClick={() => mover(1)} aria-label="Categorías siguientes">
          <ChevronRight aria-hidden="true" />
        </button>
      </div>
      <p className="ed-grupo-nombre">{q ? `Resultados para «${buscado.trim()}»` : grupoActual?.nombre} <span>{lista.length}</span></p>

      {!q && grupoActual?.id === 'temporada' && (
        <div className="ed-chips" role="radiogroup" aria-label="Fiesta">
          <button type="button" role="radio" aria-checked={fiesta === 'todas'} className="ed-chip" onClick={() => setFiesta('todas')}>
            Todas
          </button>
          {COLECCIONES.map((c) => (
            <button key={c.id} type="button" role="radio" aria-checked={fiesta === c.id} className="ed-chip" onClick={() => setFiesta(c.id)}>
              {c.nombre}
            </button>
          ))}
        </div>
      )}
      {areaPropia && paquetes && <p className="ed-nota">Los objetos con candado necesitan un permiso extra. Pídele a quien administra la oficina que te lo asigne.</p>}
      {arte.pintados === 0 && <p className="ed-nota">Los dibujos son provisionales: el arte final se está pintando y reemplaza a estos bloques solo.</p>}

      <div className="ed-rejilla-objetos" role="list">
        {lista.map((o) => (
          <Celda key={o.id} o={o} activo={elegido === o.id} bloqueado={bloqueadoDe(o)} alElegir={elegir} />
        ))}
        {lista.length === 0 && <p className="ed-vacio">Nada coincide con «{buscado}».</p>}
      </div>

      {obj && (
        <div className="ed-pincel">
          <div className="ed-pincel__cab">
            <MiniaturaObjeto objeto={obj} variante={variante} orientacion={orientacion} lado={40} />
            <div>
              <strong>{obj.nombre}</strong>
              <span>
                {huellaDe(obj, orientacion).ancho}×{huellaDe(obj, orientacion).alto} casillas
              </span>
            </div>
            {obj.orientaciones.length > 1 && !obj.autotile && (
              <button type="button" className="ed-btn" onClick={() => ctl.girar()} title="Girar (R)" aria-label="Girar el objeto">
                <RotateCw aria-hidden="true" />
              </button>
            )}
          </div>
          {obj.variantes.length > 1 && (
            <div className="ed-colores" role="radiogroup" aria-label="Color">
              {obj.variantes.map((v) => (
                <button key={v.id} type="button" role="radio" aria-checked={variante === v.id} className="ed-color" style={{ ['--c' as string]: v.muestra ?? '#8e8e93' }} onClick={() => ctl.elegirVariante(v.id)} title={v.nombre} aria-label={v.nombre} />
              ))}
            </div>
          )}
          <p className="ed-ayuda">Haz clic para colocarlo. Arrastra para repetir los de una casilla. R gira, Esc termina.</p>
        </div>
      )}
    </div>
  );
}
