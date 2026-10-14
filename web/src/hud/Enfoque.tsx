import { sonido } from '../mundo/sonido-global';
import { Coffee, Copy, ExternalLink, Link2, MapPin, Music2, Timer, X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import {
  DURACIONES_ENFOQUE,
  DURACION_ENFOQUE_POR_DEFECTO,
  ETIQUETA_MODO_ENFOQUE,
  ETIQUETA_VISIBILIDAD_ENFOQUE,
  MODOS_ENFOQUE,
  POMODORO_DESCANSO_MIN,
  POMODORO_TRABAJO_MIN,
  TEMA_ENFOQUE_MAX,
  VISIBILIDADES_ENFOQUE,
  esEnlaceSpotify,
  fasePomodoro,
  limpiarTema,
  minutosRestantes,
  restanteMs,
  textoCronometro,
  type ModoEnfoque,
  type PedidoEnfoque,
  type SesionEnfoque,
  type SesionEnfoquePublica,
  type VisibilidadEnfoque,
  type Zona,
} from '@ol/shared';
import { Modal } from '../componentes/Modal';
import type { PersonaVista } from '../mundo/vivo';
import { AVISO_COWORKING, AYUDA_COMO_FUNCIONA, AYUDA_SPOTIFY, avanceDeSesion, nombreDeSesion, textoQueda, textoVisibilidadSesion } from './coworking';
import { primerNombre } from './estados';
import { abrirEnPestana, copiarTexto } from './teams';

/** La hora actual, que se actualiza cada `cada` milisegundos mientras `activo` sea verdadero (para cronómetros y «quedan 42 min»). */
export function useAhora(activo = true, cada = 1000): number {
  const [ahora, setAhora] = useState(() => Date.now());
  useEffect(() => {
    if (!activo) return;
    setAhora(Date.now());
    const t = window.setInterval(() => setAhora(Date.now()), cada);
    return () => window.clearInterval(t);
  }, [activo, cada]);
  return ahora;
}

/** «Sesión de enfoque de Ana: informe, quedan 42 min» y, si hay Jam, el botón para abrirlo en una pestaña nueva. */
export function SesionesDeLaZona({ personas, yoId }: { personas: readonly PersonaVista[]; yoId: number }) {
  const conSesion = personas.filter((p) => p.enfoque);
  const ahora = useAhora(conSesion.length > 0, 5000);
  if (conSesion.length === 0) return null;
  return (
    <ul className="hd-sesiones" aria-label="Sesiones de enfoque en esta zona">
      {conSesion.map((p) => {
        const s = p.enfoque!;
        const quedan = minutosRestantes(s, ahora);
        const de = p.id === yoId ? 'tuya' : `de ${primerNombre(p)}`;
        return (
          <li key={p.id} className="hd-sesion">
            <Timer aria-hidden="true" />
            <div>
              <p>
                Sesión de enfoque {de}
                {s.tema ? `: ${s.tema}` : ''}, {quedan <= 0 ? 'terminando' : `quedan ${quedan} min`}
              </p>
              {s.spotify && p.id !== yoId && (
                <button type="button" className="hd-sesion__jam" onClick={() => abrirEnPestana(s.spotify as string)}>
                  <Music2 aria-hidden="true" />
                  Abrir Spotify Jam
                  <ExternalLink aria-hidden="true" />
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

// ---------- el panel de la derecha al sentarte en una zona de coworking ----------

const AYUDA_MODO: Record<ModoEnfoque, string> = {
  enfoque: 'Un bloque de tiempo sin interrupciones, con cronómetro.',
  pomodoro: `Ciclos de ${POMODORO_TRABAJO_MIN} minutos de trabajo y ${POMODORO_DESCANSO_MIN} de descanso.`,
  libre: 'Sin estructura: solo avisas que estás concentrado.',
};

/**
 * Como el panel «Coworking de Focused» de Gather: modo, tema, duración, un Jam de Spotify opcional y quién se entera.
 * Se abre al sentarte en una zona de coworking. El Jam es solo un enlace: se abre en una pestaña nueva, sin cuentas ni permisos de Spotify.
 */
export function PanelCoworking({ zona, alIniciar, alCerrar }: { zona: Zona; alIniciar: (p: PedidoEnfoque) => void; alCerrar: () => void }) {
  const id = useId();
  const [modo, setModo] = useState<ModoEnfoque>('enfoque');
  const [tema, setTema] = useState('');
  const [minutos, setMinutos] = useState<number>(DURACION_ENFOQUE_POR_DEFECTO);
  const [jam, setJam] = useState('');
  const [visibilidad, setVisibilidad] = useState<VisibilidadEnfoque>('todos');
  const [intento, setIntento] = useState(false);
  const jamLimpio = jam.trim();
  const jamMal = jamLimpio !== '' && !esEnlaceSpotify(jamLimpio);

  const iniciar = () => {
    setIntento(true);
    if (jamMal) return;
    alIniciar({ modo, tema: limpiarTema(tema), minutos, ...(jamLimpio ? { spotify: jamLimpio } : {}), visibilidad });
  };

  return (
    <aside className="hd-panel-coworking" role="dialog" aria-label={`Coworking de ${zona.nombre}`}>
      <div className="hd-panel-coworking__cab">
        <h2>Coworking de {zona.nombre}</h2>
        <button type="button" className="hd-tarjeta__btn" onClick={alCerrar} aria-label="Cerrar el panel" title="Cerrar">
          <X aria-hidden="true" />
        </button>
      </div>
      <p className="hd-panel-coworking__texto">Hecho para el trabajo profundo. Elige cómo quieres concentrarte y quienes estén cerca lo sabrán, si tú quieres.</p>

      <div className="hd-segmentos" role="radiogroup" aria-label="Modo de la sesión">
        {MODOS_ENFOQUE.map((m) => (
          <button key={m} type="button" role="radio" aria-checked={modo === m} className="hd-segmento" onClick={() => setModo(m)}>
            {ETIQUETA_MODO_ENFOQUE[m]}
          </button>
        ))}
      </div>
      <p className="hd-panel-coworking__ayuda">{AYUDA_MODO[modo]}</p>

      <label className="hd-campo" htmlFor={`${id}-tema`}>
        Tema <span>(opcional)</span>
      </label>
      <input id={`${id}-tema`} className="hd-entrada" type="text" value={tema} maxLength={TEMA_ENFOQUE_MAX} onChange={(e) => setTema(e.target.value)} placeholder="Escribe el tema" autoComplete="off" />

      <label className="hd-campo" htmlFor={`${id}-min`}>
        Duración
      </label>
      <select id={`${id}-min`} className="hd-entrada" value={minutos} onChange={(e) => setMinutos(Number(e.target.value))}>
        {DURACIONES_ENFOQUE.map((n) => (
          <option key={n} value={n}>
            {n} minutos
          </option>
        ))}
      </select>

      <label className="hd-campo" htmlFor={`${id}-jam`}>
        Enlace de Spotify Jam <span>(opcional)</span>
      </label>
      <input id={`${id}-jam`} className="hd-entrada" type="url" value={jam} onChange={(e) => setJam(e.target.value)} placeholder="https://open.spotify.com/..." autoComplete="off" aria-invalid={jamMal && intento} aria-describedby={jamMal ? `${id}-jam-error` : undefined} />
      {jamMal && (
        <p id={`${id}-jam-error`} className="hd-panel-coworking__error" role="alert">
          Tiene que ser un enlace de Spotify: open.spotify.com o spotify.link.
        </p>
      )}
      <p className="hd-panel-coworking__ayuda hd-panel-coworking__ayuda--spotify">{AYUDA_SPOTIFY}</p>

      <label className="hd-campo" htmlFor={`${id}-vis`}>
        ¿Quieres que los demás lo sepan?
      </label>
      <select id={`${id}-vis`} className="hd-entrada" value={visibilidad} onChange={(e) => setVisibilidad(e.target.value as VisibilidadEnfoque)}>
        {VISIBILIDADES_ENFOQUE.map((v) => (
          <option key={v} value={v}>
            {ETIQUETA_VISIBILIDAD_ENFOQUE[v]}
          </option>
        ))}
      </select>

      <button type="button" className="hd-tarjeta__reunion hd-panel-coworking__iniciar" onClick={iniciar}>
        Iniciar sesión
      </button>
    </aside>
  );
}

// ---------- el cronómetro en la barra ----------

/** El cronómetro de tu sesión: tiempo que queda (en Pomodoro, el de la fase), el tema y un botón para terminarla. Avisa al cambiar de fase. */
export function CronometroEnfoque({ sesion, alTerminar, alAviso }: { sesion: SesionEnfoquePublica; alTerminar: () => void; alAviso: (t: string) => void }) {
  const ahora = useAhora(true, 1000);
  const total = restanteMs(sesion, ahora);
  const fase = sesion.modo === 'pomodoro' ? fasePomodoro(sesion, ahora) : null;
  const faseActual = fase?.fase ?? null;
  const ultimaFase = useRef(faseActual);
  const terminada = useRef(false);

  useEffect(() => {
    if (faseActual && ultimaFase.current && faseActual !== ultimaFase.current && total > 0) {
      alAviso(faseActual === 'descanso' ? `Descansa ${POMODORO_DESCANSO_MIN} minutos. Te lo ganaste.` : `Vuelve al trabajo: ${POMODORO_TRABAJO_MIN} minutos.`);
    }
    ultimaFase.current = faseActual;
  }, [faseActual, total, alAviso]);

  useEffect(() => {
    if (total <= 0 && !terminada.current) {
      terminada.current = true;
      alAviso('Terminó tu sesión de enfoque.');
      sonido.reproducir('enfoque-fin');
      alTerminar();
    }
  }, [total, alTerminar, alAviso]);

  const mostrado = fase ? fase.restanteMs : total;
  const etiqueta = fase ? (fase.fase === 'descanso' ? 'Descanso' : 'Trabajo') : sesion.modo === 'libre' ? 'Libre' : 'Enfoque';
  const Icono = fase?.fase === 'descanso' ? Coffee : Timer;
  return (
    <div className="hd-cronometro" role="timer" aria-label={`Sesión de enfoque, ${etiqueta}, quedan ${textoCronometro(mostrado)}`} data-fase={fase?.fase}>
      <Icono aria-hidden="true" />
      <span className="hd-cronometro__tiempo">{textoCronometro(mostrado)}</span>
      <span className="hd-cronometro__texto">{sesion.tema ? `${etiqueta} · ${sesion.tema}` : etiqueta}</span>
      <button type="button" className="hd-dock__mini" onClick={alTerminar} aria-label="Terminar la sesión de enfoque" title="Terminar la sesión">
        <X aria-hidden="true" />
      </button>
    </div>
  );
}

// ---------- el aviso de la primera vez ----------

/** «Cowork en áreas de coworking»: sale la primera vez que alguien usa «Ir a» o entra a un área de coworking. */
export function AvisoCoworking({ alCancelar, alAceptar }: { alCancelar: () => void; alAceptar: () => void }) {
  return (
    <Modal
      titulo={AVISO_COWORKING.titulo}
      onCerrar={alCancelar}
      pie={
        <>
          <button type="button" className="btn btn--secundario" onClick={alCancelar}>
            Cancelar
          </button>
          <button type="button" className="btn btn--primario" onClick={alAceptar} data-autofoco="">
            Cowork
          </button>
        </>
      }
    >
      <p className="hd-aviso-cowork__texto">{AVISO_COWORKING.texto}</p>
      <p className="hd-aviso-cowork__texto">{AVISO_COWORKING.privacidad}</p>
    </Modal>
  );
}

// ---------- la tarjeta de tu sesión en marcha ----------

/**
 * Lo que ves al iniciar tu sesión de coworking: el nombre, el lugar, el Jam de Spotify (solo un enlace), cómo funciona, la barra
 * de tiempo, el enlace del área, quién la ve y el botón para terminarla.
 */
export function TarjetaSesion({
  sesion,
  lugar,
  enlaceArea,
  alTerminar,
  alAviso,
}: {
  sesion: SesionEnfoquePublica | SesionEnfoque;
  lugar: string;
  enlaceArea: string;
  alTerminar: () => void;
  alAviso: (t: string) => void;
}) {
  const ahora = useAhora(true, 5000);
  const [ayuda, setAyuda] = useState(false);
  const avance = avanceDeSesion(sesion, ahora);
  const visibilidad = 'visibilidad' in sesion ? sesion.visibilidad : undefined;
  const copiar = async () => alAviso((await copiarTexto(enlaceArea)) ? 'Copié el enlace del área de coworking.' : 'No pude copiar el enlace. Cópialo a mano.');
  return (
    <aside className="hd-tarjeta hd-sesion-propia" role="complementary" aria-label="Tu sesión de coworking">
      <div className="hd-tarjeta__cab">
        <span className="hd-tarjeta__icono" aria-hidden="true">
          <Timer aria-hidden={true} />
        </span>
        <div className="hd-tarjeta__titulo">
          <h2>{nombreDeSesion(sesion.tema)}</h2>
          <p className="hd-tarjeta__sub hd-sesion-propia__lugar">
            <MapPin aria-hidden="true" />
            {lugar}
          </p>
        </div>
      </div>

      {sesion.spotify && (
        <button type="button" className="hd-sesion-propia__jam" onClick={() => abrirEnPestana(sesion.spotify as string)} title="Abre el Jam en una pestaña nueva. El audio suena en tu app de Spotify.">
          <Music2 aria-hidden="true" />
          Unirse a Spotify Jam
          <ExternalLink aria-hidden="true" />
        </button>
      )}

      <button type="button" className="hd-sesion-propia__ayuda-btn" onClick={() => setAyuda((a) => !a)} aria-expanded={ayuda}>
        Cómo funciona
      </button>
      {ayuda && (
        <ul className="hd-sesion-propia__ayuda">
          {AYUDA_COMO_FUNCIONA.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      )}

      <div className="hd-sesion-propia__tiempo">
        <div className="hd-barra" role="progressbar" aria-label="Tiempo de la sesión" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(avance * 100)}>
          <span style={{ width: `${Math.round(avance * 100)}%` }} />
        </div>
        <p>{textoQueda(restanteMs(sesion, ahora))}</p>
      </div>

      <div className="hd-enlace">
        <Link2 aria-hidden="true" />
        <span>Enlace del área de coworking</span>
        <button type="button" className="hd-tarjeta__btn" onClick={() => void copiar()} aria-label="Copiar el enlace del área de coworking" title="Copiar el enlace">
          <Copy aria-hidden="true" />
        </button>
      </div>

      <p className="hd-sesion-propia__visible">{textoVisibilidadSesion(visibilidad)}</p>

      <div className="hd-tarjeta__acciones">
        <button type="button" className="hd-sesion-propia__terminar" onClick={alTerminar}>
          Terminar sesión
        </button>
      </div>
    </aside>
  );
}
