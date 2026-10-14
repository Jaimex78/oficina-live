import { DoorOpen, Home, LayoutTemplate, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { INVENTARIO, PLANTILLAS_MAPA, plantillaDeMapa, type IdPlantillaMapa, type TipoZona } from '@ol/shared';
import { Confirmar } from '../componentes/Confirmar';
import { ETIQUETA_ZONA } from './etiquetas';
import { MiniaturaObjeto } from './MiniaturaObjeto';
import { MiniaturaPlantilla } from './MiniaturaPlantilla';
import { useEditor, useEstado } from './contexto';

/** Las plantillas para cargar (la «Vacía» es la de arranque y no se ofrece aquí). */
const PLANTILLAS_CARGABLES = PLANTILLAS_MAPA.filter((p) => p.id !== 'vacia');
const PISOS = INVENTARIO.filter((o) => o.capa === 'piso');
const PLANTILLAS: { nombre: string; tam: { w: number; h: number } | null }[] = [
  { nombre: 'Arrastrar', tam: null },
  { nombre: 'Pequeña', tam: { w: 6, h: 5 } },
  { nombre: 'Mediana', tam: { w: 9, h: 7 } },
  { nombre: 'Grande', tam: { w: 13, h: 9 } },
];
const TIPOS: (TipoZona | 'ninguna')[] = ['ninguna', 'abierta', 'silenciosa', 'privada', 'sala', 'coworking'];
const TAMANOS_SALA = [
  { nombre: 'Pequeña', w: 24, h: 16 },
  { nombre: 'Mediana', w: 34, h: 22 },
  { nombre: 'Grande', w: 46, h: 30 },
];

/**
 * Crear salas sin complicarse, como en Gather: se dibuja (o se estampa) una habitación entera de un golpe, con piso,
 * paredes, puerta y zona, y arriba se elige entre las salas del mapa o se crea una nueva.
 */
export function PanelSalas() {
  const { ctl } = useEditor();
  const herramienta = useEstado((e) => e.herramienta);
  const aj = useEstado((e) => e.pincel.habitacion);
  useEstado((e) => e.sala);
  const [version, setVersion] = useState(0);
  const [nombreNueva, setNombreNueva] = useState('');
  const [tamNueva, setTamNueva] = useState(1);
  const [editando, setEditando] = useState<string | null>(null);
  const [pidePlantilla, setPidePlantilla] = useState<IdPlantillaMapa | null>(null);
  const plantillaElegida = PLANTILLAS_MAPA.find((p) => p.id === pidePlantilla);
  const [textoEdicion, setTextoEdicion] = useState('');
  const activo = herramienta === 'habitacion';
  const refrescar = () => setVersion((n) => n + 1);
  void version;
  const salas = ctl.salas;

  return (
    <div className="ed-contenido">
      <p className="ed-ayuda">Elige cómo y arrastra sobre el mapa: la habitación sale completa, con piso, paredes, puerta y zona. Se deshace de una sola vez.</p>

      <div className="ed-segmentos ed-segmentos--zonas" role="radiogroup" aria-label="Tamaño de la habitación">
        {PLANTILLAS.map((p) => (
          <button key={p.nombre} type="button" role="radio" aria-checked={activo && (aj.tam?.w ?? 0) === (p.tam?.w ?? 0)} className="ed-segmento" onClick={() => ctl.configurarHabitacion({ tam: p.tam })} title={p.tam ? `${p.tam.w} × ${p.tam.h} casillas: un clic la coloca` : 'Dibuja el tamaño que quieras arrastrando'}>
            <span>{p.tam ? `${p.nombre} ${p.tam.w}×${p.tam.h}` : p.nombre}</span>
          </button>
        ))}
      </div>

      <h3 className="ed-subtitulo">Piso</h3>
      <div className="ed-rejilla-objetos ed-rejilla-pisos" role="list">
        {PISOS.map((o) => (
          <button key={o.id} type="button" role="listitem" className="ed-objeto" aria-pressed={aj.piso === o.id} onClick={() => ctl.configurarHabitacion({ piso: o.id })}>
            <MiniaturaObjeto objeto={o} />
            <span className="ed-objeto__nombre">{o.nombre}</span>
          </button>
        ))}
      </div>

      <h3 className="ed-subtitulo">Paredes</h3>
      <div className="ed-segmentos" role="radiogroup" aria-label="Tipo de pared">
        {(['pared-lisa', 'vidrio'] as const).map((m) => (
          <button key={m} type="button" role="radio" aria-checked={aj.muro === m} className="ed-segmento" onClick={() => ctl.configurarHabitacion({ muro: m })}>
            <span>{m === 'vidrio' ? 'Vidrio' : 'Lisa'}</span>
          </button>
        ))}
      </div>

      <h3 className="ed-subtitulo">Zona de la habitación</h3>
      <div className="ed-segmentos ed-segmentos--zonas" role="radiogroup" aria-label="Zona de la habitación">
        {TIPOS.map((t) => (
          <button key={t} type="button" role="radio" aria-checked={aj.zona === t} className="ed-segmento" onClick={() => ctl.configurarHabitacion({ zona: t })}>
            <span>{t === 'ninguna' ? 'Ninguna' : ETIQUETA_ZONA[t].nombre}</span>
          </button>
        ))}
      </div>
      <label className="ed-check">
        <input type="checkbox" checked={aj.puerta} onChange={(e) => ctl.configurarHabitacion({ puerta: e.target.checked })} />
        <span>Con puerta</span>
      </label>

      <button type="button" className={`btn ${activo ? 'btn--primario' : 'btn--secundario'} btn--bloque`} onClick={() => ctl.elegirHerramienta(activo ? 'seleccionar' : 'habitacion')}>
        <Home aria-hidden="true" />
        {activo ? (aj.tam ? 'Haz clic en el mapa para colocarla' : 'Arrastra en el mapa') : 'Dibujar una habitación'}
      </button>

      <h3 className="ed-subtitulo">Salas del mapa</h3>
      <ul className="ed-lista">
        {salas.map((s) => (
          <li key={s.id}>
            <div className={`ed-fila ed-fila--sala${s.activa ? ' ed-fila--activa' : ''}`}>
              {editando === s.id ? (
                <form
                  className="ed-fila__texto"
                  onSubmit={(e) => {
                    e.preventDefault();
                    ctl.renombrarSala(s.id, textoEdicion);
                    setEditando(null);
                    refrescar();
                  }}
                >
                  <input className="entrada" value={textoEdicion} onChange={(e) => setTextoEdicion(e.target.value)} autoFocus maxLength={40} aria-label="Nombre de la sala" onBlur={() => setEditando(null)} />
                </form>
              ) : (
                <button
                  type="button"
                  className="ed-fila__texto ed-fila__boton"
                  onClick={() => {
                    ctl.irASala(s.id);
                    refrescar();
                  }}
                  aria-pressed={s.activa}
                >
                  <strong>{s.nombre}</strong>
                  <small>
                    {s.ancho}×{s.alto}
                    {s.inicial ? ' · entrada' : ''}
                  </small>
                </button>
              )}
              <span className="ed-fila__acciones">
                <button
                  type="button"
                  className="ed-btn"
                  title="Cambiar el nombre"
                  aria-label={`Cambiar el nombre de ${s.nombre}`}
                  onClick={() => {
                    setEditando(s.id);
                    setTextoEdicion(s.nombre);
                  }}
                >
                  <Pencil aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="ed-btn"
                  aria-pressed={s.inicial}
                  title={s.inicial ? 'Es la sala por la que se entra' : 'Usar como sala de entrada'}
                  aria-label={`Usar ${s.nombre} como sala de entrada`}
                  onClick={() => {
                    ctl.definirSalaInicial(s.id);
                    refrescar();
                  }}
                >
                  <Star aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="ed-btn"
                  title="Borrar la sala"
                  aria-label={`Borrar ${s.nombre}`}
                  onClick={() => {
                    ctl.borrarSala(s.id);
                    refrescar();
                  }}
                >
                  <Trash2 aria-hidden="true" />
                </button>
              </span>
            </div>
          </li>
        ))}
      </ul>

      <form
        className="ed-nueva-sala"
        onSubmit={(e) => {
          e.preventDefault();
          const t = TAMANOS_SALA[tamNueva] ?? TAMANOS_SALA[1];
          ctl.nuevaSala(nombreNueva, t?.w ?? 34, t?.h ?? 22);
          setNombreNueva('');
          refrescar();
        }}
      >
        <input className="entrada" value={nombreNueva} onChange={(e) => setNombreNueva(e.target.value)} placeholder="Nombre de la sala nueva" maxLength={40} aria-label="Nombre de la sala nueva" />
        <div className="ed-segmentos" role="radiogroup" aria-label="Tamaño de la sala nueva">
          {TAMANOS_SALA.map((t, i) => (
            <button key={t.nombre} type="button" role="radio" aria-checked={tamNueva === i} className="ed-segmento" onClick={() => setTamNueva(i)} title={`${t.w} × ${t.h} casillas`}>
              <span>{t.nombre}</span>
            </button>
          ))}
        </div>
        <button type="submit" className="btn btn--secundario btn--bloque">
          <Plus aria-hidden="true" />
          Crear sala
        </button>
      </form>
      <p className="ed-ayuda">
        <DoorOpen aria-hidden="true" /> La sala marcada con la estrella es la de entrada.
      </p>

      <h3 className="ed-subtitulo">Plantillas</h3>
      <p className="ed-ayuda">La oficina empieza vacía. Si quieres partir de una planta lista, elige una y edítala: la calle de afuera encaja con todas.</p>
      <ul className="ed-plantillas" aria-label="Plantillas del mapa">
        {PLANTILLAS_CARGABLES.map((p) => (
          <li key={p.id}>
            <button type="button" className="ed-plantilla" onClick={() => setPidePlantilla(p.id)} aria-label={`Cargar plantilla: ${p.nombre}`}>
              <MiniaturaPlantilla id={p.id} />
              <span className="ed-plantilla__texto">
                <strong>
                  <LayoutTemplate aria-hidden="true" />
                  {p.nombre}
                </strong>
                <span>{p.descripcion}</span>
                <small>{p.tamano}</small>
              </span>
            </button>
          </li>
        ))}
      </ul>
      {plantillaElegida &&
        createPortal(
          <Confirmar
            titulo={`Cargar plantilla: ${plantillaElegida.nombre}`}
            mensaje={<p>Esto reemplaza todo lo que hay en el borrador por la planta «{plantillaElegida.nombre}». No cambia lo publicado hasta que publiques, y puedes deshacerlo con Ctrl+Z.</p>}
            textoConfirmar="Reemplazar el borrador"
            peligro
            onCerrar={() => setPidePlantilla(null)}
            onConfirmar={async () => {
              ctl.cargarPlantilla(plantillaDeMapa(plantillaElegida.id), plantillaElegida.nombre);
              refrescar();
            }}
          />,
          document.body,
        )}
    </div>
  );
}
