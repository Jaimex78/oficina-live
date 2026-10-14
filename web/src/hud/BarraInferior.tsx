import { ChevronUp, Copy, ExternalLink, LogOut, MessageSquare, PhoneCall, Smile, SquareDashed, UserPen, Users, Video, X } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState, type RefObject } from 'react';
import type { EstadoPresencia, Lugar, SesionEnfoquePublica, Zona } from '@ol/shared';
import { FotoPersona } from '../componentes/FotoPersona';
import type { PersonaVista } from '../mundo/vivo';
import { CronometroEnfoque } from './Enfoque';
import { FICHAS_ESTADO, TEXTO_ESTADO, TEXTO_LUGAR, pastel } from './estados';
import { useMenu } from './menu';
import { copiarTexto, esHttps } from './teams';
import { contextoTeams, pedidoDe } from './teams-contexto';
import type { AccionesTeams } from './useTeams';

export const REACCIONES: { grupo: { emoji: string; nombre: string }[] }[] = [
  {
    grupo: [
      { emoji: '👋', nombre: 'Saludar con la mano' },
      { emoji: '❤️', nombre: 'Corazón' },
      { emoji: '🎉', nombre: 'Fiesta' },
      { emoji: '🤣', nombre: 'Risa' },
      { emoji: '👏', nombre: 'Aplausos' },
    ],
  },
  {
    grupo: [
      { emoji: '👍', nombre: 'Pulgar arriba' },
      { emoji: '💯', nombre: 'Cien' },
      { emoji: '🔥', nombre: 'Fuego' },
    ],
  },
];

type Abierto = 'estado' | 'teams' | 'reacciones' | 'cerca' | null;

export interface PropsBarra {
  yo: PersonaVista | null;
  cercanos: PersonaVista[];
  zona: Zona | null;
  /** Quienes están dentro de la zona donde estás (tú incluido): sirve para saber si estás solo en una sala. */
  enZona: PersonaVista[];
  /** Las acciones de Teams: el servidor arma los enlaces con los correos. */
  teams: AccionesTeams;
  chatMax: number;
  alCambiarEstado: (cambio: { estado?: EstadoPresencia; lugar?: Lugar }) => void;
  alReaccionar: (emoji: string) => void;
  alEnviarCerca: (texto: string) => void;
  alEditarPerfil: () => void;
  alSalir: () => void;
  alAviso: (texto: string) => void;
  /** Tu sesión de enfoque, si tienes una: se muestra el cronómetro a la izquierda de la barra. */
  enfoque?: SesionEnfoquePublica | null;
  alTerminarEnfoque?: () => void;
}

/** La barra oscura de abajo, como la de Gather. El micrófono y la cámara se reemplazan por Teams, donde ocurre el audio y el video. */
export function BarraInferior(p: PropsBarra) {
  const [abierto, setAbierto] = useState<Abierto>(null);
  const refEstado = useRef<HTMLButtonElement>(null);
  const refReacciones = useRef<HTMLButtonElement>(null);
  const refCerca = useRef<HTMLButtonElement>(null);
  const alternar = (que: Exclude<Abierto, null>) => setAbierto((a) => (a === que ? null : que));
  const cerrar = () => setAbierto(null);

  const nombre = p.yo?.nombre ?? '';
  const estado = p.yo?.estado ?? 'disponible';

  return (
    <div className="hd-dock-zona">
      {abierto === 'estado' && <MenuEstado {...p} cerrar={cerrar} disparador={refEstado} />}
      {abierto === 'reacciones' && <BarraReacciones alReaccionar={p.alReaccionar} cerrar={cerrar} disparador={refReacciones} />}
      {abierto === 'cerca' && <EnviarCerca cercanos={p.cercanos} chatMax={p.chatMax} alEnviar={p.alEnviarCerca} cerrar={cerrar} disparador={refCerca} />}

      <div className="hd-dock" role="toolbar" aria-label="Barra de la oficina">
        {p.enfoque && p.alTerminarEnfoque && (
          <>
            <CronometroEnfoque sesion={p.enfoque} alTerminar={p.alTerminarEnfoque} alAviso={p.alAviso} />
            <span className="hd-dock__sep" aria-hidden="true" />
          </>
        )}
        <BotonEstado refBoton={refEstado} id={p.yo?.id ?? 0} nombre={nombre} foto={p.yo?.foto} estado={estado} abierto={abierto === 'estado'} alClic={() => alternar('estado')} />
        <span className="hd-dock__sep" aria-hidden="true" />
        <BotonTeams {...p} abierto={abierto === 'teams'} alAbrirMenu={() => alternar('teams')} cerrar={cerrar} />
        <span className="hd-dock__sep" aria-hidden="true" />
        <button ref={refReacciones} type="button" className="hd-dock__btn" aria-label="Reacciones" aria-haspopup="true" aria-expanded={abierto === 'reacciones'} data-activo={abierto === 'reacciones' ? '1' : undefined} onClick={() => alternar('reacciones')} title="Reacciones">
          <Smile aria-hidden="true" />
        </button>
        <button ref={refCerca} type="button" className="hd-dock__btn" aria-label="Enviar cerca" aria-haspopup="dialog" aria-expanded={abierto === 'cerca'} data-activo={abierto === 'cerca' ? '1' : undefined} onClick={() => alternar('cerca')} title="Enviar cerca">
          <SquareDashed aria-hidden="true" />
        </button>
        <span className="hd-dock__sep" aria-hidden="true" />
        <button type="button" className="hd-dock__btn hd-dock__btn--salir" onClick={p.alSalir} aria-label="Salir de la oficina" title="Salir de la oficina">
          <LogOut aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function BotonEstado({ refBoton, id, nombre, foto, estado, abierto, alClic }: { refBoton: RefObject<HTMLButtonElement | null>; id: number; nombre: string; foto: number | undefined; estado: EstadoPresencia; abierto: boolean; alClic: () => void }) {
  return (
    <button ref={refBoton} type="button" className="hd-dock__estado" style={{ background: pastel(id) }} onClick={alClic} aria-haspopup="menu" aria-expanded={abierto} aria-label={`Tu estado: ${TEXTO_ESTADO[estado]}. Cambiar estado`} title="Tu estado">
      {/* Foto de perfil si la tiene; si no, la inicial. */}
      <FotoPersona id={id} nombre={nombre} foto={foto} className="hd-dock__foto" colorFondo={false} decorativa />
      <span className="hd-punto hd-dock__punto" data-estado={estado} aria-hidden="true" />
    </button>
  );
}

// ---------- menú de estado ----------

function MenuEstado({ yo, alCambiarEstado, alEditarPerfil, cerrar, disparador }: PropsBarra & { cerrar: () => void; disparador: RefObject<HTMLElement | null> }) {
  const raiz = useMenu<HTMLDivElement>(true, cerrar, { disparador });
  if (!yo) return null;
  const cambiarLugar = (l: Exclude<Lugar, ''>) => alCambiarEstado({ lugar: yo.lugar === l ? '' : l });
  return (
    <div ref={raiz} className="hd-pop hd-pop--estado" role="menu" aria-label="Tu estado">
      <div className="hd-estado__cab">
        <FotoPersona id={yo.id} nombre={yo.nombre} foto={yo.foto} tam={36} decorativa />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p className="hd-estado__nombre">{yo.nombre}</p>
          <p className="hd-estado__sub">{yo.enfoque?.tema ? `${TEXTO_ESTADO[yo.estado]} · ${yo.enfoque.tema}` : TEXTO_ESTADO[yo.estado]}</p>
        </div>
        <button type="button" role="menuitem" className="hd-dock__mini" onClick={() => (cerrar(), alEditarPerfil())} aria-label="Editar perfil" title="Editar perfil">
          <UserPen aria-hidden="true" />
        </button>
      </div>
      <div className="hd-fichas" role="group" aria-label="Estado">
        {FICHAS_ESTADO.map((f) => (
          <button key={f.estado} type="button" role="menuitemradio" aria-checked={yo.estado === f.estado} className="hd-ficha" onClick={() => alCambiarEstado({ estado: f.estado })}>
            <span className="hd-punto" data-estado={f.estado} aria-hidden="true" />
            {f.texto}
          </button>
        ))}
      </div>
      <p className="hd-estado__etiqueta">Dónde estás</p>
      <div className="hd-fichas hd-fichas--dos" role="group" aria-label="Dónde estás">
        {(['naos', 'remoto'] as const).map((l) => (
          <button key={l} type="button" role="menuitemradio" aria-checked={yo.lugar === l} className="hd-ficha" onClick={() => cambiarLugar(l)}>
            {TEXTO_LUGAR[l]}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------- Teams ----------

/**
 * El botón de Teams cambia según dónde estás: en una sala de reuniones abre el chat de la sala (con quienes están dentro);
 * cerca de una persona, el chat con ella; cerca de varias, una conversación en el lugar; sin nadie cerca, tu chat general.
 * El servidor arma el enlace con los correos, así que el navegador nunca los ve. La flecha ofrece las alternativas.
 */
function BotonTeams({ cercanos, enZona, zona, yo, teams, abierto, alAbrirMenu, cerrar, alAviso }: PropsBarra & { abierto: boolean; alAbrirMenu: () => void; cerrar: () => void }) {
  const flecha = useRef<HTMLButtonElement>(null);
  const lista = useMenu<HTMLDivElement>(abierto, cerrar, { disparador: flecha });
  const enlaceSala = esHttps(zona?.enlaceTeams) ? zona.enlaceTeams : null;
  const ctx = useMemo(() => contextoTeams(zona, enZona, cercanos, yo?.id ?? 0), [zona, enZona, cercanos, yo?.id]);
  const solo = ctx.tipo === 'sala' && !ctx.hayOtros;

  const chat = () => {
    if (solo) return alAviso('Estás solo en la sala. Invita a alguien o copia el enlace.');
    const pedido = pedidoDe(ctx, 'chat');
    if (pedido) void teams.abrir(pedido);
    else teams.abrirGeneral();
  };
  const llamar = () => {
    if (solo) return alAviso('Estás solo en la sala. Invita a alguien o copia el enlace.');
    const pedido = pedidoDe(ctx, 'llamada');
    if (pedido) void teams.abrir(pedido);
  };
  const copiar = () => {
    if (enlaceSala) return void copiarTexto(enlaceSala).then((ok) => alAviso(ok ? 'Copié el enlace de la reunión de la sala.' : 'No pude copiar el enlace. Cópialo a mano desde Teams.'));
    const pedido = pedidoDe(ctx, 'chat');
    if (pedido) void teams.copiar(pedido);
  };
  const puedeCopiar = Boolean(enlaceSala) || (ctx.tipo !== 'ninguno' && !solo);

  const Icono = ctx.tipo === 'ninguno' ? MessageSquare : ctx.tipo === 'sala' ? Users : MessageSquare;
  const elegir = (f: () => void) => () => {
    cerrar();
    f();
  };

  return (
    <div className="hd-dock__par">
      <button type="button" className="hd-dock__btn hd-dock__btn--teams" onClick={chat} aria-label={ctx.etiqueta} title={ctx.etiqueta} data-contexto={ctx.tipo}>
        <Icono aria-hidden={true} />
        <span className="hd-dock__texto">{ctx.tipo === 'ninguno' ? 'Teams' : ctx.etiqueta}</span>
      </button>
      <button ref={flecha} type="button" className="hd-dock__flecha" onClick={alAbrirMenu} aria-haspopup="menu" aria-expanded={abierto} aria-label="Opciones de Teams" title="Opciones de Teams">
        <ChevronUp aria-hidden="true" />
      </button>
      {abierto && (
        <div ref={lista} className="hd-pop hd-pop--teams" role="menu" aria-label="Teams">
          <button type="button" role="menuitem" className="hd-pop__item" onClick={elegir(llamar)} disabled={ctx.tipo === 'ninguno'}>
            <PhoneCall aria-hidden="true" />
            <span>
              {ctx.etiquetaLlamada}
              <small>{ctx.tipo === 'ninguno' ? 'No hay nadie cerca ahora' : solo ? 'Estás solo en la sala' : 'Llamada de Teams'}</small>
            </span>
          </button>
          {enlaceSala && (
            <button type="button" role="menuitem" className="hd-pop__item" onClick={elegir(() => teams.abrirReunion(enlaceSala))}>
              <Video aria-hidden="true" />
              <span>
                Unirse a la reunión
                <small>{zona?.nombre}</small>
              </span>
            </button>
          )}
          {puedeCopiar && (
            <button type="button" role="menuitem" className="hd-pop__item" onClick={elegir(copiar)}>
              <Copy aria-hidden="true" />
              <span>
                Copiar enlace
                <small>{enlaceSala ? 'De la reunión de la sala' : 'Del chat de Teams'}</small>
              </span>
            </button>
          )}
          <button type="button" role="menuitem" className="hd-pop__item" onClick={elegir(teams.abrirGeneral)}>
            <ExternalLink aria-hidden="true" />
            Abrir Teams
          </button>
        </div>
      )}
    </div>
  );
}

// ---------- reacciones ----------

function BarraReacciones({ alReaccionar, cerrar, disparador }: { alReaccionar: (e: string) => void; cerrar: () => void; disparador: RefObject<HTMLElement | null> }) {
  const raiz = useMenu<HTMLDivElement>(true, cerrar, { disparador });
  return (
    <div ref={raiz} className="hd-pop hd-pop--reacciones" role="toolbar" aria-label="Reacciones">
      {REACCIONES.map((g, i) => (
        <div key={i} className="hd-reacciones__grupo" role="group">
          {g.grupo.map((r) => (
            <button key={r.emoji} type="button" data-menu-item className="hd-reaccion" onClick={() => alReaccionar(r.emoji)} aria-label={r.nombre} title={r.nombre}>
              <span aria-hidden="true">{r.emoji}</span>
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

// ---------- enviar cerca ----------

function EnviarCerca({ cercanos, chatMax, alEnviar, cerrar, disparador }: { cercanos: PersonaVista[]; chatMax: number; alEnviar: (t: string) => void; cerrar: () => void; disparador: RefObject<HTMLElement | null> }) {
  const [texto, setTexto] = useState('');
  const id = useId();
  const raiz = useMenu<HTMLDivElement>(true, cerrar, { disparador, enfocar: false });
  const campo = useRef<HTMLInputElement>(null);
  useEffect(() => campo.current?.focus(), []);

  const enviar = () => {
    const t = texto.trim();
    if (!t) return;
    alEnviar(t);
    setTexto('');
  };
  const quienes = cercanos.length === 0 ? 'No hay nadie cerca ahora.' : cercanos.length === 1 ? 'Lo lee 1 persona cerca.' : `Lo leen ${cercanos.length} personas cerca.`;

  return (
    <div ref={raiz} className="hd-pop hd-pop--cerca" role="dialog" aria-label="Enviar cerca">
      <header className="hd-cerca__cab">
        <h3>Enviar cerca</h3>
        <button type="button" className="hd-dock__mini" onClick={cerrar} aria-label="Cerrar">
          <X aria-hidden="true" />
        </button>
      </header>
      <form
        className="hd-cerca__campo"
        onSubmit={(e) => {
          e.preventDefault();
          enviar();
        }}
      >
        <SquareDashed aria-hidden="true" />
        <input ref={campo} id={id} type="text" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Mensaje..." maxLength={chatMax} aria-label="Mensaje para quienes están cerca" aria-describedby={`${id}-nota`} autoComplete="off" />
      </form>
      <p id={`${id}-nota`} className="hd-cerca__nota">
        {quienes} Los mensajes aquí no se guardan.
      </p>
    </div>
  );
}

