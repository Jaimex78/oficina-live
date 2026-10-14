import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import type { Permiso } from '@ol/shared';
import { Cargando, Vacio } from './componentes/Estados';
import { SoloComputador } from './componentes/SoloComputador';
import { Lock } from 'lucide-react';
import { useSesion } from './estado/sesion';
import Shell from './layout/Shell';
import Activar from './paginas/Activar';
import CambiarClave from './paginas/CambiarClave';
import Ingreso from './paginas/Ingreso';
import Inicio from './paginas/Inicio';

const Oficina = lazy(() => import('./paginas/Oficina'));
const MiCuenta = lazy(() => import('./paginas/MiCuenta'));
const Planner = lazy(() => import('./paginas/Planner'));
const Creador = lazy(() => import('./personaje/Creador'));
const AdminLayout = lazy(() => import('./paginas/admin/AdminLayout'));
const Resumen = lazy(() => import('./paginas/admin/Resumen'));
const Cuentas = lazy(() => import('./paginas/admin/Cuentas'));
const Solicitudes = lazy(() => import('./paginas/admin/Solicitudes'));
const Actividad = lazy(() => import('./paginas/admin/Actividad'));
const Configuracion = lazy(() => import('./paginas/admin/Configuracion'));

function PantallaCarga() {
  return (
    <div style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center' }}>
      <Cargando texto="Entrando…" />
    </div>
  );
}

/** Solo con sesión y con la clave ya elegida. */
function RutaPrivada() {
  const { usuario, cargando } = useSesion();
  const ubicacion = useLocation();
  if (cargando) return <PantallaCarga />;
  if (!usuario) return <Navigate to="/ingreso" replace state={{ desde: ubicacion.pathname }} />;
  if (usuario.debeCambiarClave) return <Navigate to="/cambiar-clave" replace />;
  // La primera vez que entra, la persona crea (o confirma) su personaje antes de ver la oficina.
  if (!usuario.personajeListo && ubicacion.pathname !== '/personaje') return <Navigate to="/personaje" replace />;
  return <Outlet />;
}

function RutaPermiso({ permiso }: { permiso: Permiso }) {
  const { tiene } = useSesion();
  if (tiene(permiso)) return <Outlet />;
  return (
    <section className="panel">
      <Vacio Icono={Lock} titulo="No tienes permiso para ver esto" texto="Si crees que deberías, pídele a una persona administradora que revise tu rol." />
    </section>
  );
}

export default function App() {
  return (
    <SoloComputador>
      <BrowserRouter>
        <Suspense fallback={<Cargando />}>
          <Routes>
            <Route path="/ingreso" element={<Ingreso />} />
            <Route path="/activar" element={<Activar />} />
            <Route path="/cambiar-clave" element={<CambiarClave />} />
            <Route element={<RutaPrivada />}>
              <Route path="oficina" element={<Oficina />} />
              <Route path="personaje" element={<Creador />} />
              <Route element={<Shell />}>
                <Route index element={<Inicio />} />
                <Route path="planner" element={<Planner />} />
                <Route path="cuenta" element={<MiCuenta />} />
                <Route path="admin" element={<RutaPermiso permiso="administrar" />}>
                  <Route element={<AdminLayout />}>
                    <Route index element={<Resumen />} />
                    <Route path="cuentas" element={<Cuentas />} />
                    <Route path="solicitudes" element={<Solicitudes />} />
                    <Route path="actividad" element={<Actividad />} />
                    <Route path="configuracion" element={<Configuracion />} />
                  </Route>
                </Route>
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </SoloComputador>
  );
}
