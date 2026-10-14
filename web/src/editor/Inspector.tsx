import { Armchair, Copy, RotateCw, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { INVENTARIO, SILLA_POR_DEFECTO, esAsientoParaMesa, esMesaParaSillas, esRedonda, huellaColocada, objetoPorId, type Colocacion, type LadosSillas, type TipoZona, type Zona } from '@ol/shared';
import { Campo, CampoSeleccion, CampoTexto } from '../componentes/Campo';
import { MiniaturaObjeto } from './MiniaturaObjeto';
import { useEditor, useEstado } from './contexto';
import { ETIQUETA_ZONA } from './etiquetas';

const COLORES_ZONA = ['#6b8cff', '#34c759', '#a855f7', '#ef3b3a', '#f2b84b', '#00b8d9', '#ff7a45', '#8e8e93'];

/** Campo de texto que cambia el mapa solo al terminar de escribir: así deshacer deshace «todo lo escrito», no letra por letra. */
function CampoConfirmado({ etiqueta, valor, alConfirmar, ayuda, area, placeholder, tipo }: { etiqueta: string; valor: string; alConfirmar: (v: string) => void; ayuda?: string; area?: boolean; placeholder?: string; tipo?: 'url' | 'text' }) {
  const [v, setV] = useState(valor);
  useEffect(() => setV(valor), [valor]);
  const fin = () => v !== valor && alConfirmar(v);
  if (area) return <CampoTexto etiqueta={etiqueta} value={v} rows={3} maxLength={1000} placeholder={placeholder} ayuda={ayuda} onChange={(e) => setV(e.target.value)} onBlur={fin} />;
  return (
    <Campo
      etiqueta={etiqueta}
      value={v}
      type={tipo === 'url' ? 'url' : 'text'}
      placeholder={placeholder}
      ayuda={ayuda}
      autoComplete="off"
      spellCheck={false}
      onChange={(e) => setV(e.target.value)}
      onBlur={fin}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          fin();
          (e.target as HTMLElement).blur();
        }
      }}
    />
  );
}

const OPCIONES_LADOS: { id: LadosSillas; nombre: string }[] = [
  { id: 'todos', nombre: 'Todos los lados' },
  { id: 'largos', nombre: 'Solo los lados largos' },
  { id: 'uno', nombre: 'Una por lado (centrada)' },
];
const SILLAS_OFRECIDAS = INVENTARIO.filter(esAsientoParaMesa).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

/** «Poner sillas alrededor»: lados, tipo y color de silla. Las sillas de la mesa se hallan por cercanía (no hay grupos guardados). */
function SeccionSillas({ c }: { c: Colocacion }) {
  const { ctl } = useEditor();
  useEstado((e) => e.sala);
  const o = objetoPorId(c.objeto);
  const [lados, setLados] = useState<LadosSillas>(o && esRedonda(o) ? 'uno' : 'todos');
  const [silla, setSilla] = useState(SILLA_POR_DEFECTO);
  const [variante, setVariante] = useState('base');
  const objetoSilla = objetoPorId(silla);
  const suyas = ctl.sillasDe(c.id);
  return (
    <div className="ed-sillas">
      <p className="ed-etiqueta">Sillas</p>
      <CampoSeleccion etiqueta="Dónde" value={lados} onChange={(e) => setLados(e.target.value as LadosSillas)} ayuda="Quedan pegadas a la mesa, mirando hacia ella, centradas y simétricas.">
        {OPCIONES_LADOS.map((l) => (
          <option key={l.id} value={l.id}>
            {l.nombre}
          </option>
        ))}
      </CampoSeleccion>
      <CampoSeleccion
        etiqueta="Tipo de silla"
        value={silla}
        onChange={(e) => {
          setSilla(e.target.value);
          setVariante('base');
        }}
      >
        {SILLAS_OFRECIDAS.map((s) => (
          <option key={s.id} value={s.id}>
            {s.nombre}
          </option>
        ))}
      </CampoSeleccion>
      {objetoSilla && objetoSilla.variantes.length > 1 && (
        <div className="ed-colores" role="radiogroup" aria-label="Color de la silla">
          {objetoSilla.variantes.map((v) => (
            <button key={v.id} type="button" role="radio" aria-checked={variante === v.id} className="ed-color" style={{ ['--c' as string]: v.muestra ?? '#8e8e93' }} onClick={() => setVariante(v.id)} title={v.nombre} aria-label={v.nombre} />
          ))}
        </div>
      )}
      <div className="ed-acciones">
        <button type="button" className="btn btn--secundario btn--chico" onClick={() => ctl.ponerSillas(c.id, { lados, silla, variante })}>
          <Armchair aria-hidden="true" />
          Poner sillas alrededor
        </button>
      </div>
      {suyas.length > 0 && (
        <>
          <p className="ed-ayuda">
            Esta mesa tiene {suyas.length} {suyas.length === 1 ? 'silla pegada' : 'sillas pegadas'}.
          </p>
          <div className="ed-acciones">
            <button type="button" className="btn btn--secundario btn--chico" onClick={() => ctl.seleccionarConSillas(c.id)}>
              Mover con sus sillas
            </button>
            <button type="button" className="btn btn--peligro btn--chico" onClick={() => ctl.quitarConSillas(c.id)}>
              <Trash2 aria-hidden="true" />
              Quitar con sus sillas
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function InspectorColocacion({ c }: { c: Colocacion }) {
  const { ctl } = useEditor();
  const o = objetoPorId(c.objeto);
  if (!o) return <p className="ed-ayuda">Este objeto ya no existe en el inventario.</p>;
  const h = huellaColocada(o, c.x, c.y, c.orientacion);
  const props = c.props ?? {};
  const cambiar = (clave: 'enlace' | 'texto' | 'imagen' | 'titulo', valor: string) => ctl.cambiarPropsColocacion(c.id, { ...props, [clave]: valor });
  return (
    <>
      <div className="ed-pincel__cab">
        <MiniaturaObjeto objeto={o} variante={c.variante} orientacion={c.orientacion} lado={48} />
        <div>
          <strong>{o.nombre}</strong>
          <span>
            {h.ancho}×{h.alto} casillas · en {c.x}, {c.y}
          </span>
        </div>
      </div>
      <div className="ed-acciones">
        {o.orientaciones.length > 1 && !o.autotile && (
          <button type="button" className="btn btn--secundario btn--chico" onClick={() => ctl.girarEn(c.id)}>
            <RotateCw aria-hidden="true" />
            Girar
          </button>
        )}
        <button type="button" className="btn btn--secundario btn--chico" onClick={() => ctl.duplicarSeleccion()}>
          <Copy aria-hidden="true" />
          Copiar
        </button>
        <button type="button" className="btn btn--peligro btn--chico" onClick={() => ctl.borrarSeleccion()}>
          <Trash2 aria-hidden="true" />
          Quitar
        </button>
      </div>
      {o.variantes.length > 1 && (
        <div>
          <p className="ed-etiqueta">Color</p>
          <div className="ed-colores" role="radiogroup" aria-label="Color">
            {o.variantes.map((v) => (
              <button key={v.id} type="button" role="radio" aria-checked={c.variante === v.id} className="ed-color" style={{ ['--c' as string]: v.muestra ?? '#8e8e93' }} onClick={() => ctl.cambiarVarianteSeleccion(v.id)} title={v.nombre} aria-label={v.nombre} />
            ))}
          </div>
        </div>
      )}
      {esMesaParaSillas(o) && <SeccionSillas c={c} />}
      {(o.interaccion === 'enlace' || o.interaccion === 'teams' || o.interaccion === 'incrustado') && (
        <>
          <CampoConfirmado etiqueta={o.interaccion === 'teams' ? 'Enlace de la reunión de Teams' : o.interaccion === 'incrustado' ? 'Página que se muestra' : 'Enlace'} valor={props.enlace ?? ''} placeholder="https://" tipo="url" alConfirmar={(v) => cambiar('enlace', v)} ayuda={o.interaccion === 'teams' ? 'Cópialo desde Teams: Calendario, reunión, Copiar enlace.' : 'Debe empezar por https://'} />
          <CampoConfirmado etiqueta="Título" valor={props.titulo ?? ''} alConfirmar={(v) => cambiar('titulo', v)} />
        </>
      )}
      {o.interaccion === 'nota' && (
        <>
          <CampoConfirmado etiqueta="Título" valor={props.titulo ?? ''} alConfirmar={(v) => cambiar('titulo', v)} />
          <CampoConfirmado etiqueta="Texto" valor={props.texto ?? ''} alConfirmar={(v) => cambiar('texto', v)} area ayuda="Lo lee quien se acerque y lo abra." />
        </>
      )}
      {o.interaccion === 'imagen' && <CampoConfirmado etiqueta="Dirección de la imagen" valor={props.imagen ?? ''} placeholder="https://" tipo="url" alConfirmar={(v) => cambiar('imagen', v)} />}
    </>
  );
}

function InspectorZona({ z }: { z: Zona }) {
  const { ctl } = useEditor();
  const cambiar = (c: Partial<Omit<Zona, 'id'>>) => ctl.actualizarZonaPorId(z.id, c);
  const numero = (clave: 'x' | 'y' | 'w' | 'h', v: string) => {
    const n = Number.parseInt(v, 10);
    if (Number.isFinite(n)) cambiar({ rect: { ...z.rect, [clave]: n } });
  };
  return (
    <>
      <CampoConfirmado etiqueta="Nombre" valor={z.nombre} alConfirmar={(v) => cambiar({ nombre: v })} />
      <CampoSeleccion etiqueta="Tipo" value={z.tipo} onChange={(e) => cambiar({ tipo: e.target.value as TipoZona })} ayuda={ETIQUETA_ZONA[z.tipo].ayuda}>
        {(Object.keys(ETIQUETA_ZONA) as TipoZona[]).map((t) => (
          <option key={t} value={t}>
            {ETIQUETA_ZONA[t].nombre}
          </option>
        ))}
      </CampoSeleccion>
      {z.tipo === 'sala' && <CampoConfirmado etiqueta="Enlace de Teams de la sala" valor={z.enlaceTeams ?? ''} placeholder="https://teams.microsoft.com/…" tipo="url" alConfirmar={(v) => cambiar({ enlaceTeams: v })} ayuda="Quien entre a la sala verá el botón para unirse. Sin enlace, el botón abre una llamada de Teams con quienes están dentro." />}
      <CampoConfirmado etiqueta="Descripción corta" valor={z.descripcion ?? ''} placeholder="Opcional, se ve bajo el nombre del lugar" alConfirmar={(v) => cambiar({ descripcion: v.trim() === '' ? undefined : v.trim().slice(0, 120) })} ayuda="Aparece en la píldora de arriba a la izquierda cuando estás dentro de esta zona." />
      <div>
        <p className="ed-etiqueta">Color</p>
        <div className="ed-colores" role="radiogroup" aria-label="Color de la zona">
          {COLORES_ZONA.map((c) => (
            <button key={c} type="button" role="radio" aria-checked={z.color === c} className="ed-color" style={{ ['--c' as string]: c }} onClick={() => cambiar({ color: c })} aria-label={`Color ${c}`} />
          ))}
        </div>
      </div>
      <div className="ed-numeros">
        {(['x', 'y', 'w', 'h'] as const).map((k) => (
          <label key={k}>
            <span>{k === 'x' ? 'Izquierda' : k === 'y' ? 'Arriba' : k === 'w' ? 'Ancho' : 'Alto'}</span>
            <input type="number" className="entrada" value={z.rect[k]} min={k === 'w' || k === 'h' ? 1 : 0} onChange={(e) => numero(k, e.target.value)} />
          </label>
        ))}
      </div>
      <div className="ed-acciones">
        <button type="button" className="btn btn--peligro btn--chico" onClick={() => ctl.quitarZonaPorId(z.id)}>
          <Trash2 aria-hidden="true" />
          Quitar zona
        </button>
      </div>
    </>
  );
}

/** Lo que se puede cambiar de lo que está seleccionado. */
export function Inspector() {
  const { ctl } = useEditor();
  const sala = useEstado((e) => e.sala);
  const seleccion = useEstado((e) => e.seleccion);
  if (!sala || seleccion.length === 0) return null;

  const unico = seleccion.length === 1 ? seleccion[0] : undefined;
  let contenido: React.ReactNode;
  let titulo = 'Selección';
  if (unico?.tipo === 'colocacion') {
    const c = sala.colocaciones.find((p) => p.id === unico.id);
    if (!c) return null;
    contenido = <InspectorColocacion c={c} />;
    titulo = 'Objeto';
  } else if (unico?.tipo === 'zona') {
    const z = sala.zonas.find((p) => p.id === unico.id);
    if (!z) return null;
    contenido = <InspectorZona z={z} />;
    titulo = 'Zona';
  } else if (unico?.tipo === 'llegada') {
    contenido = (
      <>
        <p className="ed-ayuda">
          Punto de llegada en la casilla {unico.x}, {unico.y}.
        </p>
        <div className="ed-acciones">
          <button type="button" className="btn btn--peligro btn--chico" onClick={() => ctl.borrarSeleccion()}>
            <Trash2 aria-hidden="true" />
            Quitar punto
          </button>
        </div>
      </>
    );
    titulo = 'Llegada';
  } else {
    contenido = (
      <>
        <p className="ed-ayuda">{seleccion.length} elementos seleccionados. Arrástralos para moverlos juntos, o usa las flechas.</p>
        <div className="ed-acciones">
          <button type="button" className="btn btn--secundario btn--chico" onClick={() => ctl.girar()}>
            <RotateCw aria-hidden="true" />
            Girar
          </button>
          <button type="button" className="btn btn--peligro btn--chico" onClick={() => ctl.borrarSeleccion()}>
            <Trash2 aria-hidden="true" />
            Quitar
          </button>
        </div>
      </>
    );
    titulo = 'Varios';
  }

  return (
    <aside className="ed-inspector" aria-label={`Propiedades: ${titulo}`}>
      <div className="ed-inspector__cab">
        <h2 className="ed-titulo">{titulo}</h2>
        <button type="button" className="ed-btn" onClick={() => ctl.seleccionar([])} aria-label="Cerrar propiedades" title="Cerrar (Esc)">
          <X aria-hidden="true" />
        </button>
      </div>
      <div className="ed-contenido">{contenido}</div>
    </aside>
  );
}
