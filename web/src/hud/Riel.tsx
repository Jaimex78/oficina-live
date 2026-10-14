import { Bell, ChevronDown, Hammer, House, LayoutGrid, ListChecks, LogOut, Map as IconoMapa, Moon, Search, Settings, ShieldCheck, Sun } from 'lucide-react';
import { useRef, useState, type ComponentType, type MouseEvent } from 'react';
import { MarcaIcono } from '../componentes/MarcaLive';
import { useTema } from '../estado/tema';
import { useMenu, TECLA_MODIFICADORA } from './menu';

export type Pestana = 'mapa' | 'actividad';

export interface AccionesMenuPrincipal {
  puedeConstruir: boolean;
  puedeAdministrar: boolean;
  tieneArea: boolean;
  construyendo: boolean;
  alConfiguracion: () => void;
  alInicio: () => void;
  alMiArea: () => void;
  alConstruir: () => void;
  alAdministrar: () => void;
  alCerrarSesion: () => void;
}

interface Props extends AccionesMenuPrincipal {
  pestana: Pestana;
  panelAbierto: boolean;
  plannerAbierto: boolean;
  sinLeer: number;
  alMapa: () => void;
  alActividad: () => void;
  alPlanner: () => void;
  alBuscar: () => void;
}

function Boton({ Icono, etiqueta, activo, alClic, insignia, pie, pulsado }: { Icono: ComponentType<{ 'aria-hidden'?: boolean }>; etiqueta: string; activo?: boolean; alClic: () => void; insignia?: number; pie?: string; pulsado?: boolean }) {
  return (
    <div className="hd-riel__item">
      <button type="button" className="hd-riel__btn" data-activo={activo ? '1' : undefined} onClick={alClic} aria-label={insignia ? `${etiqueta}, ${insignia} sin leer` : etiqueta} aria-pressed={pulsado} aria-current={activo && pulsado === undefined ? 'page' : undefined} title={etiqueta}>
        <Icono aria-hidden={true} />
        {insignia ? <span className="hd-riel__cuenta">{insignia > 9 ? '9+' : insignia}</span> : null}
      </button>
      {pie && <span className="hd-riel__pie" aria-hidden="true">{pie}</span>}
    </div>
  );
}

/** El logo de la plataforma con su menú principal, como en Gather: arriba de todo. */
function LogoMenu(p: AccionesMenuPrincipal) {
  const [abierto, setAbierto] = useState(false);
  const boton = useRef<HTMLButtonElement>(null);
  const lista = useMenu<HTMLDivElement>(abierto, () => setAbierto(false), { disparador: boton });
  const elegir = (f: () => void) => () => {
    setAbierto(false);
    f();
  };
  const hayAdmin = p.puedeConstruir || p.puedeAdministrar;

  return (
    <div className="hd-logo">
      <button ref={boton} type="button" className="hd-logo__btn" onClick={() => setAbierto((a) => !a)} aria-haspopup="menu" aria-expanded={abierto} aria-label="Menú principal" title="Menú principal">
        <MarcaIcono className="hd-logo__marca" />
        <span className="hd-logo__flecha" aria-hidden="true">
          <ChevronDown />
        </span>
      </button>
      {abierto && (
        <div ref={lista} className="hd-menu hd-menu--principal" role="menu" aria-label="Menú principal">
          <button type="button" role="menuitem" className="hd-menu__item" onClick={elegir(p.alConfiguracion)}>
            <Settings aria-hidden="true" />
            Configuración
          </button>
          <button type="button" role="menuitem" className="hd-menu__item" onClick={elegir(p.alInicio)}>
            <House aria-hidden="true" />
            Ir al inicio
          </button>
          {p.tieneArea && (
            <button type="button" role="menuitem" className="hd-menu__item" onClick={elegir(p.alMiArea)}>
              <LayoutGrid aria-hidden="true" />
              Decorar mi área
            </button>
          )}
          {hayAdmin && (
            <>
              <p className="hd-menu__grupo">Admin</p>
              {p.puedeConstruir && (
                <button type="button" role="menuitem" className="hd-menu__item" onClick={elegir(p.alConstruir)} disabled={p.construyendo}>
                  <Hammer aria-hidden="true" />
                  Editar la oficina
                </button>
              )}
              {p.puedeAdministrar && (
                <button type="button" role="menuitem" className="hd-menu__item" onClick={elegir(p.alAdministrar)}>
                  <ShieldCheck aria-hidden="true" />
                  Administración
                </button>
              )}
            </>
          )}
          <div className="hd-menu__sep" role="separator" />
          <button type="button" role="menuitem" className="hd-menu__item" onClick={elegir(p.alCerrarSesion)}>
            <LogOut aria-hidden="true" />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}

/** Luces de la oficina: un solo botón que alterna claro y oscuro, con la transición desde el botón. */
function BotonLucesRiel() {
  const { tema, alternar } = useTema();
  const apagar = tema === 'claro';
  const clic = (e: MouseEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    alternar({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
  };
  return (
    <div className="hd-riel__item">
      <button type="button" className="hd-riel__btn" onClick={clic} aria-label={apagar ? 'Apagar las luces' : 'Prender las luces'} title={apagar ? 'Apagar las luces' : 'Prender las luces'}>
        {apagar ? <Moon aria-hidden="true" /> : <Sun aria-hidden="true" />}
      </button>
    </div>
  );
}

/** El riel de la izquierda: logo, búsqueda y pestañas; abajo, luces y configuración. */
export function Riel(p: Props) {
  return (
    <nav className="hd-riel" aria-label="Navegación de la oficina">
      <div className="hd-riel__grupo">
        <LogoMenu {...p} />
        <Boton Icono={Search} etiqueta="Buscar" alClic={p.alBuscar} pie={`${TECLA_MODIFICADORA} K`} />
        <Boton Icono={IconoMapa} etiqueta={p.pestana === 'mapa' && p.panelAbierto ? 'Mapa, ocultar el panel' : 'Mapa'} activo={p.pestana === 'mapa' && !p.plannerAbierto} alClic={p.alMapa} />
        <Boton Icono={ListChecks} etiqueta="Planner" activo={p.plannerAbierto} pulsado={p.plannerAbierto} alClic={p.alPlanner} />
        <Boton Icono={Bell} etiqueta="Actividad" activo={p.pestana === 'actividad' && !p.plannerAbierto} alClic={p.alActividad} insignia={p.sinLeer} />
      </div>
      <div className="hd-riel__grupo hd-riel__grupo--abajo">
        <BotonLucesRiel />
        <Boton Icono={Settings} etiqueta="Configuración" alClic={p.alConfiguracion} />
      </div>
    </nav>
  );
}
