import { Armchair, Clock, Copy, EllipsisVertical, ExternalLink, Footprints, Hand, LayoutGrid, Link2, Lock, MapPin, MessageSquare, Monitor, PhoneCall, Pencil, Presentation, Users, UserPen, VolumeX, X, type LucideIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Zona } from '@ol/shared';
import type { Puente } from '../mundo/puente';
import type { PersonaVista } from '../mundo/vivo';
import { AvatarPixel } from './AvatarPixel';
import { SesionesDeLaZona } from './Enfoque';
import { TEXTO_ESTADO, TEXTO_LUGAR } from './estados';
import { useMenu } from './menu';
import { copiarTexto, esHttps } from './teams';
import type { AccionesTeams } from './useTeams';

const formatoHora = new Intl.DateTimeFormat('es-CO', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Bogota' });

/** La hora de Bogotá, que se actualiza sola cada medio minuto. */
function useHoraBogota(): string {
  const [hora, setHora] = useState(() => formatoHora.format(new Date()));
  useEffect(() => {
    const t = setInterval(() => setHora(formatoHora.format(new Date())), 30_000);
    return () => clearInterval(t);
  }, []);
  return hora;
}

interface ItemMas {
  clave: string;
  etiqueta: string;
  Icono: LucideIcon;
  alElegir: () => void;
  deshabilitado?: boolean;
}

function MenuMas({ etiqueta, items }: { etiqueta: string; items: ItemMas[] }) {
  const [abierto, setAbierto] = useState(false);
  const boton = useRef<HTMLButtonElement>(null);
  const lista = useMenu<HTMLDivElement>(abierto, () => setAbierto(false), { disparador: boton });
  return (
    <div className="hd-mas">
      <button ref={boton} type="button" className="hd-tarjeta__btn" onClick={() => setAbierto((a) => !a)} aria-haspopup="menu" aria-expanded={abierto} aria-label={etiqueta} title={etiqueta}>
        <EllipsisVertical aria-hidden="true" />
      </button>
      {abierto && (
        <div ref={lista} className="hd-menu hd-menu--tarjeta" role="menu" aria-label={etiqueta}>
          {items.map(({ clave, etiqueta: texto, Icono, alElegir, deshabilitado }) => (
            <button
              key={clave}
              type="button"
              role="menuitem"
              className="hd-menu__item"
              disabled={deshabilitado}
              onClick={() => {
                setAbierto(false);
                alElegir();
              }}
            >
              <Icono aria-hidden="true" />
              {texto}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- persona ----------

export function TarjetaPersona({
  puente,
  persona,
  esYo,
  teams,
  alCerrar,
  alEditarPerfil,
  alIrA,
  alSaludar,
  alAviso,
}: {
  puente: Puente;
  persona: PersonaVista;
  esYo: boolean;
  teams: AccionesTeams;
  alCerrar: () => void;
  alEditarPerfil: () => void;
  alIrA: () => void;
  alSaludar: () => void;
  alAviso: (t: string) => void;
}) {
  const hora = useHoraBogota();
  const detalle = [persona.cargo, TEXTO_ESTADO[persona.estado], persona.enfoque ? (persona.enfoque.tema ? `Enfoque: ${persona.enfoque.tema}` : 'En una sesión de enfoque') : '', TEXTO_LUGAR[persona.lugar]].filter(Boolean).join(' · ');
  const copiarNombre = async () => alAviso((await copiarTexto(persona.nombre)) ? 'Copié el nombre.' : 'No pude copiar el nombre.');
  const items: ItemMas[] = esYo
    ? [{ clave: 'nombre', etiqueta: 'Copiar mi nombre', Icono: Copy, alElegir: () => void copiarNombre() }]
    : [
        { clave: 'copiar-chat', etiqueta: 'Copiar enlace del chat de Teams', Icono: Link2, alElegir: () => void teams.copiar({ tipo: 'chat', personas: [persona.id] }) },
        { clave: 'nombre', etiqueta: 'Copiar nombre', Icono: Copy, alElegir: () => void copiarNombre() },
      ];

  return (
    <aside className="hd-tarjeta" role="complementary" aria-label={`Tarjeta de ${persona.nombre}`}>
      <div className="hd-tarjeta__cab">
        <AvatarPixel avatares={puente.avatares} persona={persona} tam={44} estado={persona.estado} />
        <div className="hd-tarjeta__titulo">
          <h2>{persona.nombre}</h2>
          <p className="hd-tarjeta__hora">
            <Clock aria-hidden="true" />
            {hora} hora de Bogotá
          </p>
        </div>
        <button type="button" className="hd-tarjeta__btn" onClick={alCerrar} aria-label="Cerrar la tarjeta" title="Cerrar">
          <X aria-hidden="true" />
        </button>
      </div>
      {detalle && <p className="hd-tarjeta__detalle">{detalle}</p>}
      <div className="hd-tarjeta__acciones">
        {esYo ? (
          <button type="button" className="hd-tarjeta__primario" onClick={alEditarPerfil}>
            <UserPen aria-hidden="true" />
            Editar perfil
          </button>
        ) : (
          <>
            <button type="button" className="hd-tarjeta__primario" onClick={alIrA}>
              <Footprints aria-hidden="true" />
              Ir hacia
            </button>
            <button type="button" className="hd-tarjeta__btn hd-tarjeta__btn--texto" onClick={alSaludar} aria-label={`Saludar a ${persona.nombre}`} title="Saludar">
              <Hand aria-hidden="true" />
            </button>
          </>
        )}
        <MenuMas etiqueta="Más opciones" items={items} />
      </div>
      {!esYo && (
        <div className="hd-tarjeta__acciones hd-tarjeta__acciones--teams">
          <button type="button" className="hd-tarjeta__teams" onClick={() => void teams.chatCon(persona.id)} aria-label={`Chat en Teams con ${persona.nombre}`}>
            <MessageSquare aria-hidden="true" />
            Chat en Teams
          </button>
          <button type="button" className="hd-tarjeta__teams" onClick={() => void teams.llamarA(persona.id)} aria-label={`Llamar a ${persona.nombre} por Teams`}>
            <PhoneCall aria-hidden="true" />
            Llamar
          </button>
        </div>
      )}
    </aside>
  );
}

// ---------- sala o área ----------

const CLASES: Record<string, { texto: string; Icono: LucideIcon }> = {
  reunion: { texto: 'Sala de reuniones', Icono: Presentation },
  abierta: { texto: 'Zona abierta', Icono: Users },
  silenciosa: { texto: 'Zona silenciosa', Icono: VolumeX },
  privada: { texto: 'Zona privada', Icono: Lock },
  escritorio: { texto: 'Escritorio', Icono: Monitor },
  escritorios: { texto: 'Escritorios del equipo', Icono: LayoutGrid },
  descanso: { texto: 'Zona de descanso', Icono: Armchair },
  coworking: { texto: 'Zona de coworking', Icono: Armchair },
};

/**
 * Como la tarjeta de Gather para una sala de reuniones: «Enlace de la reunión» con copiar y abrir. Sin enlace de reunión,
 * ofrece el chat y la llamada de Teams con quienes están dentro (el servidor arma el enlace).
 */
function EnlaceDeLaReunion({ enlace, zonaId, teams, alAviso }: { enlace: string | null; zonaId: string | undefined; teams: AccionesTeams; alAviso: (t: string) => void }) {
  const copiar = async () => alAviso((await copiarTexto(enlace as string)) ? 'Copié el enlace de la reunión.' : 'No pude copiar el enlace. Cópialo a mano desde Teams.');
  const sala = zonaId ? (
    <>
      <button type="button" className="hd-tarjeta__btn" onClick={() => void teams.abrir({ tipo: 'chat', sala: zonaId })} aria-label="Chat de Teams con quienes están dentro" title="Chat de Teams de la sala">
        <MessageSquare aria-hidden="true" />
      </button>
      <button type="button" className="hd-tarjeta__btn" onClick={() => void teams.abrir({ tipo: 'llamada', sala: zonaId })} aria-label="Llamar por Teams a quienes están dentro" title="Llamar a la sala">
        <PhoneCall aria-hidden="true" />
      </button>
    </>
  ) : null;
  if (!enlace) {
    return (
      <div className="hd-enlace hd-enlace--vacio">
        <Link2 aria-hidden="true" />
        <span>Esta sala no tiene enlace todavía.</span>
        {sala}
      </div>
    );
  }
  return (
    <div className="hd-enlace">
      <Link2 aria-hidden="true" />
      <span>Enlace de la reunión</span>
      <button type="button" className="hd-tarjeta__btn" onClick={() => void copiar()} aria-label="Copiar el enlace de la reunión" title="Copiar el enlace">
        <Copy aria-hidden="true" />
      </button>
      <button type="button" className="hd-tarjeta__btn" onClick={() => teams.abrirReunion(enlace)} aria-label="Abrir la reunión en Teams" title="Abrir en Teams">
        <ExternalLink aria-hidden="true" />
      </button>
      {sala}
    </div>
  );
}

function Participantes({ puente, personas }: { puente: Puente; personas: readonly PersonaVista[] }) {
  return (
    <div className="hd-participantes">
      <p className="hd-participantes__titulo">{personas.length === 0 ? 'Nadie adentro ahora' : personas.length === 1 ? '1 participante' : `${personas.length} participantes`}</p>
      {personas.length > 0 && (
        <ul>
          {personas.map((p) => (
            <li key={p.id}>
              <AvatarPixel avatares={puente.avatares} persona={p} tam={26} estado={p.estado} />
              <span>{p.nombre}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function TarjetaArea({
  nombre,
  clase,
  claseId,
  zona,
  puente,
  participantes,
  yoId,
  teams,
  alAviso,
  puedeEditar,
  etiquetaEditar,
  alCerrar,
  alIrAhi,
  alCopiarEnlace,
  alEditar,
}: {
  nombre: string;
  clase: string;
  claseId?: string;
  zona?: Zona;
  puente: Puente;
  /** Quienes están adentro de la zona (solo se muestran en salas de reuniones y zonas de coworking). */
  participantes: readonly PersonaVista[];
  yoId: number;
  teams: AccionesTeams;
  alAviso: (t: string) => void;
  puedeEditar: boolean;
  etiquetaEditar: string;
  alCerrar: () => void;
  alIrAhi: () => void;
  /** Copia el enlace profundo de la zona (`/oficina?sala=...`). Solo se ofrece en zonas. */
  alCopiarEnlace?: () => void;
  alEditar: () => void;
}) {
  const c = (claseId ? CLASES[claseId] : undefined) ?? { texto: clase, Icono: MapPin };
  const esSala = zona?.tipo === 'sala';
  const esCoworking = zona?.tipo === 'coworking';
  const enlace = esHttps(zona?.enlaceTeams) ? zona.enlaceTeams : null;
  return (
    <aside className="hd-tarjeta" role="complementary" aria-label={`Tarjeta de ${nombre}`}>
      <div className="hd-tarjeta__cab">
        <span className="hd-tarjeta__icono" aria-hidden="true">
          <c.Icono aria-hidden={true} />
        </span>
        <div className="hd-tarjeta__titulo">
          <h2>{nombre}</h2>
          <p className="hd-tarjeta__sub">{c.texto}</p>
        </div>
        <button type="button" className="hd-tarjeta__btn" onClick={alCerrar} aria-label="Cerrar la tarjeta" title="Cerrar">
          <X aria-hidden="true" />
        </button>
      </div>
      {esSala && <EnlaceDeLaReunion enlace={enlace} zonaId={zona?.id} teams={teams} alAviso={alAviso} />}
      {(esSala || esCoworking) && <Participantes puente={puente} personas={participantes} />}
      {esCoworking && <SesionesDeLaZona personas={participantes} yoId={yoId} />}
      {esCoworking && <p className="hd-tarjeta__nota">Dirígete a {nombre} para iniciar una sesión de coworking.</p>}
      <div className="hd-tarjeta__acciones">
        <button type="button" className="hd-tarjeta__primario" onClick={alIrAhi}>
          <Footprints aria-hidden="true" />
          {zona ? 'Ir a' : 'Ir hacia allá'}
        </button>
        {zona && alCopiarEnlace && (
          <button type="button" className="hd-tarjeta__btn hd-tarjeta__btn--texto" onClick={alCopiarEnlace} aria-label="Copiar enlace" title="Copiar enlace">
            <Link2 aria-hidden="true" />
          </button>
        )}
        {puedeEditar && (
          <button type="button" className="hd-tarjeta__btn hd-tarjeta__btn--texto" onClick={alEditar} aria-label={etiquetaEditar} title={etiquetaEditar}>
            <Pencil aria-hidden="true" />
          </button>
        )}
      </div>
    </aside>
  );
}
