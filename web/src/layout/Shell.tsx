import { Building2, ChevronsLeft, House, ListChecks, ChevronsRight, LogOut, Menu, ShieldCheck, UserRound, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Campana } from '../componentes/Campana';
import { Iniciales } from '../componentes/Estados';
import { BotonLuces, InterruptorLuces } from '../componentes/InterruptorLuces';
import { MarcaLive } from '../componentes/MarcaLive';
import { useSesion } from '../estado/sesion';

/** Barra lateral translúcida en escritorio; cajón con botón de menú en celular. */
export default function Shell() {
  const { usuario, salir, tiene } = useSesion();
  const [abierto, setAbierto] = useState(false);
  const { pathname } = useLocation();
  // La barra se encoge a una columna de iconos para dejarle espacio a la oficina. Lo que elijas se recuerda.
  const [compacto, setCompacto] = useState<boolean>(() => {
    try {
      const guardado = localStorage.getItem('ol_menu');
      if (guardado) return guardado === 'compacto';
    } catch {
      /* sin almacenamiento */
    }
    return false;
  });
  const alternarCompacto = () =>
    setCompacto((c) => {
      try {
        localStorage.setItem('ol_menu', c ? 'abierto' : 'compacto');
      } catch {
        /* se queda solo en esta sesión */
      }
      return !c;
    });

  useEffect(() => setAbierto(false), [pathname]);

  useEffect(() => {
    if (!abierto) return;
    const tecla = (e: KeyboardEvent) => e.key === 'Escape' && setAbierto(false);
    document.addEventListener('keydown', tecla);
    return () => document.removeEventListener('keydown', tecla);
  }, [abierto]);

  if (!usuario) return null;
  const completo = false;

  return (
    <div className={`shell${compacto ? ' shell--compacto' : ''}`}>
      <a className="salto" href="#contenido">
        Saltar al contenido
      </a>

      <header className="shell-barra">
        <button type="button" className="shell-barra__boton" onClick={() => setAbierto(true)} aria-label="Abrir el menú" aria-expanded={abierto} aria-controls="menu">
          <Menu aria-hidden="true" />
        </button>
        <MarcaLive altura={20} />
      </header>

      <div className={`shell-velo${abierto ? ' abierto' : ''}`} onClick={() => setAbierto(false)} aria-hidden="true" />

      <aside id="menu" className={`shell-menu${abierto ? ' abierto' : ''}`} aria-label="Menú principal">
        <div className="shell-marca">
          <MarcaLive altura={24} />
          <button type="button" className="shell-plegar" onClick={alternarCompacto} aria-label={compacto ? 'Mostrar el menú completo' : 'Ocultar los nombres del menú'} title={compacto ? 'Mostrar el menú completo' : 'Ocultar los nombres del menú'}>
            {compacto ? <ChevronsRight aria-hidden="true" /> : <ChevronsLeft aria-hidden="true" />}
          </button>
          <button type="button" className="shell-cerrar" onClick={() => setAbierto(false)} aria-label="Cerrar el menú">
            <X aria-hidden="true" />
          </button>
        </div>

        <nav className="shell-nav" aria-label="Secciones">
          <NavLink to="/" end>
            <House aria-hidden="true" />
            <span className="shell-etq">Inicio</span>
          </NavLink>
          <NavLink to="/oficina">
            <Building2 aria-hidden="true" />
            <span className="shell-etq">Oficina</span>
          </NavLink>
          <NavLink to="/planner">
            <ListChecks aria-hidden="true" />
            <span className="shell-etq">Planner</span>
          </NavLink>
          {tiene('administrar') && (
            <NavLink to="/admin">
              <ShieldCheck aria-hidden="true" />
              <span className="shell-etq">Administración</span>
            </NavLink>
          )}
          <NavLink to="/cuenta">
            <UserRound aria-hidden="true" />
            <span className="shell-etq">Mi cuenta</span>
          </NavLink>
        </nav>

        <div className="shell-pie">
          <div className="shell-luces">
            <Campana />
            <span className="etiqueta texto-3 shell-etq">Luces</span>
            {compacto ? <BotonLuces /> : <InterruptorLuces />}
          </div>
          <NavLink to="/cuenta" className="shell-persona">
            <Iniciales nombre={usuario.nombre} id={usuario.id} foto={usuario.foto} />
            <span className="shell-persona__texto shell-etq">
              <span className="shell-persona__nombre">{usuario.nombre}</span>
              <span className="shell-persona__cargo">{usuario.cargo || usuario.usuario}</span>
            </span>
          </NavLink>
          <button type="button" className="shell-salir" onClick={() => void salir()}>
            <LogOut aria-hidden="true" />
            <span className="shell-etq">Cerrar sesión</span>
          </button>
        </div>
      </aside>

      <main id="contenido" className={`shell-contenido${completo ? ' shell-contenido--completo' : ''}`} tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
}
