import { Bell, CheckCheck, ChevronDown, Clock, Footprints, Hand, ListChecks, MessageSquare, MessageSquareText, PanelLeftClose, Search, Users } from 'lucide-react';
import { useMemo, useState, type ComponentType, type RefObject } from 'react';
import type { NotificacionPlanner, SalaMapa } from '@ol/shared';
import { Interruptor } from '../componentes/Interruptor';
import { hace } from '../util/formato';
import type { Puente } from '../mundo/puente';
import type { PersonaVista } from '../mundo/vivo';
import { AvatarPixel } from './AvatarPixel';
import { avanceDeSesion, nombreDeSesion, textoQueda, zonaDeCoworking } from './coworking';
import { useAhora } from './Enfoque';
import { lineaEstado } from './estados';
import { TECLA_MODIFICADORA } from './menu';
import { repartirMiembros } from './miembros';
import type { Presencia, Miembro } from './usePresencia';

const sinTildes = (t: string): string => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export interface AccionesPersona {
  alSeleccionar: (id: number) => void;
  alIrA: (id: number) => void;
  alSaludar: (id: number) => void;
  /** Abre un chat de Teams con la persona (esté o no en línea). */
  alChat: (id: number) => void;
}

function Cabecera({ titulo, alPlegar, extra }: { titulo: string; alPlegar: () => void; extra?: React.ReactNode }) {
  return (
    <header className="hd-panel__cab">
      <h2>{titulo}</h2>
      {extra}
      <button type="button" className="hd-icono" onClick={alPlegar} aria-label="Ocultar el panel" title="Ocultar el panel">
        <PanelLeftClose aria-hidden="true" />
      </button>
    </header>
  );
}

// ---------- Mapa: personas ----------

function Fila({ puente, p, esYo, acciones, lugarCowork }: { puente: Puente; p: PersonaVista; esYo: boolean; acciones: AccionesPersona; lugarCowork?: string }) {
  return (
    <li className="hd-fila">
      <button type="button" className="hd-fila__main" onClick={() => acciones.alSeleccionar(p.id)} aria-label={`${p.nombre}${esYo ? ' (tú)' : ''}, ${lineaEstado(p.estado, p.lugar)}. Ver tarjeta`}>
        <AvatarPixel avatares={puente.avatares} persona={p} estado={p.estado} />
        <span className="hd-fila__texto">
          <span className="hd-fila__nombre">
            {p.nombre}
            {esYo && <span className="hd-fila__yo"> (tú)</span>}
          </span>
          <span className="hd-fila__sub">{lugarCowork ? `Coworking en ${lugarCowork}` : lineaEstado(p.estado, p.lugar)}</span>
        </span>
      </button>
      {!esYo && (
        <div className="hd-fila__acciones">
          <button type="button" className="hd-icono" onClick={() => acciones.alIrA(p.id)} aria-label={`Ir hacia ${p.nombre}`} title="Ir hacia">
            <Footprints aria-hidden="true" />
          </button>
          <button type="button" className="hd-icono" onClick={() => acciones.alSaludar(p.id)} aria-label={`Saludar a ${p.nombre}`} title="Saludar">
            <Hand aria-hidden="true" />
          </button>
          <button type="button" className="hd-icono" onClick={() => acciones.alChat(p.id)} aria-label={`Chat de Teams con ${p.nombre}`} title="Chat de Teams">
            <MessageSquare aria-hidden="true" />
          </button>
        </div>
      )}
    </li>
  );
}

function FilaSinConexion({ puente, m, acciones, enOtraSala = false }: { puente: Puente; m: Miembro; acciones: AccionesPersona; enOtraSala?: boolean }) {
  const nombre = m.apodo ? `${m.nombre} (${m.apodo})` : m.nombre;
  return (
    <li className={`hd-fila${enOtraSala ? '' : ' hd-fila--apagada'}`}>
      <div className="hd-fila__main hd-fila__main--quieta">
        <AvatarPixel avatares={puente.avatares} persona={m} />
        <span className="hd-fila__texto">
          <span className="hd-fila__nombre">{nombre}</span>
          <span className="hd-fila__sub">{enOtraSala ? 'En línea en otra sala' : m.cargo || 'Sin conexión'}</span>
        </span>
      </div>
      <div className="hd-fila__acciones">
        <button type="button" className="hd-icono" onClick={() => acciones.alSaludar(m.id)} aria-label={`Saludar a ${m.nombre}`} title={enOtraSala ? 'Saludar' : 'Saludar (si no está en línea, te ofrezco abrir un chat)'}>
          <Hand aria-hidden="true" />
        </button>
        <button type="button" className="hd-icono" onClick={() => acciones.alChat(m.id)} aria-label={`Chat de Teams con ${m.nombre}`} title="Chat de Teams">
          <MessageSquare aria-hidden="true" />
        </button>
      </div>
    </li>
  );
}

function Grupo({ titulo, cuenta, abiertoInicial = true, children }: { titulo: string; cuenta: number; abiertoInicial?: boolean; children: React.ReactNode }) {
  const [abierto, setAbierto] = useState(abiertoInicial);
  return (
    <section className="hd-grupo">
      <button type="button" className="hd-grupo__cab" onClick={() => setAbierto((a) => !a)} aria-expanded={abierto}>
        {titulo} ({cuenta})
        <ChevronDown aria-hidden="true" data-cerrado={abierto ? undefined : '1'} />
      </button>
      {abierto && children}
    </section>
  );
}

/** Una tarjeta por sesión de coworking en marcha: el tema, el lugar, la barra de tiempo y quién la hace. */
function SesionesCoworking({ puente, sesiones, ahora, alSeleccionar }: { puente: Puente; sesiones: { p: PersonaVista; lugar: string }[]; ahora: number; alSeleccionar: (id: number) => void }) {
  return (
    <ul className="hd-cowork-lista">
      {sesiones.map(({ p, lugar }) => {
        const s = p.enfoque!;
        return (
          <li key={p.id}>
            <button type="button" className="hd-cowork-tarjeta" onClick={() => alSeleccionar(p.id)} aria-label={`${nombreDeSesion(s.tema)}, ${p.nombre}, ${lugar}. ${textoQueda(s.fin - ahora)}. Ver tarjeta`}>
              <AvatarPixel avatares={puente.avatares} persona={p} estado={p.estado} />
              <span className="hd-cowork-tarjeta__texto">
                <span className="hd-cowork-tarjeta__tema">{nombreDeSesion(s.tema)}</span>
                <span className="hd-cowork-tarjeta__sub">
                  {p.nombre} · {lugar}
                </span>
                <span className="hd-barra" aria-hidden="true">
                  <span style={{ width: `${Math.round(avanceDeSesion(s, ahora) * 100)}%` }} />
                </span>
                <span className="hd-cowork-tarjeta__sub">{textoQueda(s.fin - ahora)}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function PanelMapa({
  puente,
  sala,
  titulo,
  presencia,
  miembros,
  alPlegar,
  campoBuscar,
  acciones,
}: {
  puente: Puente;
  /** La sala del mundo, para saber en qué zona está cada sesión de coworking. */
  sala?: Pick<SalaMapa, 'zonas'> | null;
  titulo: string;
  presencia: Presencia;
  miembros: Miembro[];
  alPlegar: () => void;
  campoBuscar: RefObject<HTMLInputElement | null>;
  acciones: AccionesPersona;
}) {
  const [consulta, setConsulta] = useState('');
  const q = sinTildes(consulta.trim());
  // Sesiones de coworking: las tuyas y las de quienes las comparten con todos.
  const conSesion = useMemo(() => {
    const todos = [...(presencia.yo ? [presencia.yo] : []), ...presencia.otros];
    return todos.filter((p) => p.enfoque).map((p) => ({ p, lugar: zonaDeCoworking(sala, p.x, p.y)?.nombre ?? 'la oficina' }));
  }, [presencia, sala]);
  const lugarCowork = useMemo(() => new Map(conSesion.map((c) => [c.p.id, c.lugar])), [conSesion]);
  const ahora = useAhora(conSesion.length > 0, 15_000);
  const enLinea = useMemo(() => {
    const todos = [...(presencia.yo ? [presencia.yo] : []), ...presencia.otros];
    return q ? todos.filter((p) => sinTildes(`${p.nombre} ${p.apodo} ${p.cargo}`).includes(q)) : todos;
  }, [presencia, q]);
  const { sinConexion, enOtraSala } = useMemo(() => repartirMiembros(miembros, new Set([presencia.yo?.id, ...presencia.otros.map((p) => p.id)]), q), [miembros, presencia, q]);

  return (
    <>
      <Cabecera titulo={titulo} alPlegar={alPlegar} />
      <div className="hd-panel__cuerpo">
        <label className="hd-buscar">
          <Search aria-hidden="true" />
          <input ref={campoBuscar} type="search" value={consulta} onChange={(e) => setConsulta(e.target.value)} placeholder="Buscar personas" aria-label="Buscar personas" autoComplete="off" onKeyDown={(e) => e.key === 'Escape' && (setConsulta(''), e.currentTarget.blur())} />
          <kbd aria-hidden="true">{TECLA_MODIFICADORA} F</kbd>
        </label>

        {conSesion.length > 0 && (
          <Grupo titulo="Coworking" cuenta={conSesion.length}>
            <SesionesCoworking puente={puente} sesiones={conSesion} ahora={ahora} alSeleccionar={acciones.alSeleccionar} />
          </Grupo>
        )}

        <Grupo titulo="En línea" cuenta={enLinea.length}>
          {enLinea.length === 0 ? (
            <p className="hd-vacio">{q ? 'Nadie en línea coincide con tu búsqueda.' : 'No hay nadie en línea.'}</p>
          ) : (
            <ul className="hd-lista">
              {enLinea.map((p) => (
                <Fila key={p.id} puente={puente} p={p} esYo={p.id === presencia.yo?.id} acciones={acciones} lugarCowork={lugarCowork.get(p.id)} />
              ))}
            </ul>
          )}
          {!q && presencia.otros.length === 0 && (
            <p className="hd-vacio">
              <Users aria-hidden="true" />
              Eres la única persona en línea. Cuando alguien entre, aparece aquí.
            </p>
          )}
        </Grupo>

        {enOtraSala.length > 0 && (
          <Grupo titulo="En otra sala" cuenta={enOtraSala.length}>
            <ul className="hd-lista">
              {enOtraSala.map((m) => (
                <FilaSinConexion key={m.id} puente={puente} m={m} acciones={acciones} enOtraSala />
              ))}
            </ul>
          </Grupo>
        )}

        {sinConexion.length > 0 && (
          <Grupo titulo="Sin conexión" cuenta={sinConexion.length} abiertoInicial={false}>
            <ul className="hd-lista">
              {sinConexion.map((m) => (
                <FilaSinConexion key={m.id} puente={puente} m={m} acciones={acciones} />
              ))}
            </ul>
          </Grupo>
        )}
      </div>
    </>
  );
}

// ---------- Actividad ----------

const ICONO_AVISO: Record<NotificacionPlanner['tipo'], ComponentType<{ 'aria-hidden'?: boolean }>> = {
  tarea_asignada: ListChecks,
  tarea_miembro: Users,
  tarea_comentario: MessageSquareText,
  tarea_terminada: CheckCheck,
  tarea_vence: Clock,
};

export function PanelActividad({
  lista,
  sinLeer,
  alAbrir,
  alLeerTodas,
  alPlegar,
}: {
  lista: NotificacionPlanner[];
  sinLeer: number;
  alAbrir: (a: NotificacionPlanner) => void;
  alLeerTodas: () => void;
  alPlegar: () => void;
}) {
  const [soloNoLeidos, setSoloNoLeidos] = useState(false);
  const visibles = soloNoLeidos ? lista.filter((a) => !a.leida) : lista;
  return (
    <>
      <Cabecera titulo="Actividad" alPlegar={alPlegar} />
      <div className="hd-panel__filtros">
        <span className="hd-filtro">
          No leídos
          <Interruptor marcado={soloNoLeidos} onCambio={setSoloNoLeidos} etiqueta="Mostrar solo los no leídos" />
        </span>
        <button type="button" className="hd-icono" onClick={alLeerTodas} disabled={sinLeer === 0} aria-label="Marcar todo como leído" title="Marcar todo como leído">
          <CheckCheck aria-hidden="true" />
        </button>
      </div>
      <div className="hd-panel__cuerpo">
        {visibles.length === 0 ? (
          <div className="hd-vacio hd-vacio--grande">
            <Bell aria-hidden="true" />
            <p>{soloNoLeidos ? 'No tienes avisos sin leer.' : 'Todavía no tienes avisos.'}</p>
            <p>Aquí aparecen las tareas del Planner que te asignan, comentan o están por vencer.</p>
          </div>
        ) : (
          <ul className="hd-avisos">
            {visibles.map((a) => {
              const Icono = ICONO_AVISO[a.tipo] ?? Bell;
              return (
                <li key={a.id}>
                  <button type="button" className="hd-aviso" data-nuevo={a.leida ? undefined : '1'} onClick={() => alAbrir(a)}>
                    <span className="hd-aviso__icono" aria-hidden="true">
                      <Icono aria-hidden={true} />
                    </span>
                    <span className="hd-aviso__texto">
                      <strong>{a.titulo}</strong>
                      {a.texto && <span>{a.texto}</span>}
                      <small>{hace(a.creadaEn)}</small>
                    </span>
                    {!a.leida && <span className="hd-aviso__punto" aria-label="Sin leer" />}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}

