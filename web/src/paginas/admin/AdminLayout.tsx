import { useCallback, useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import type { InfoSistema } from '@ol/shared';
import { api } from '../../api';
import { Insignia } from '../../componentes/Estados';

export interface ContextoAdmin {
  pendientes: number;
  refrescarPendientes(): void;
}

export default function AdminLayout() {
  const [pendientes, setPendientes] = useState(0);

  const refrescar = useCallback(() => {
    api<InfoSistema>('/admin/sistema')
      .then((s) => setPendientes(s.solicitudesPendientes))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    refrescar();
  }, [refrescar]);

  const contexto: ContextoAdmin = { pendientes, refrescarPendientes: refrescar };

  return (
    <>
      <nav className="admin-nav" aria-label="Administración">
        <NavLink to="/admin" end>
          Resumen
        </NavLink>
        <NavLink to="/admin/cuentas">Cuentas</NavLink>
        <NavLink to="/admin/solicitudes">
          Solicitudes
          {pendientes > 0 && <Insignia tono="acento">{pendientes}</Insignia>}
        </NavLink>
        <NavLink to="/admin/actividad">Actividad</NavLink>
        <NavLink to="/admin/configuracion">Configuración</NavLink>
      </nav>
      <Outlet context={contexto} />
    </>
  );
}
