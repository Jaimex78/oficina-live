import { Inbox } from 'lucide-react';
import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { EnlaceActivacion, SolicitudAcceso, UsuarioAdmin } from '@ol/shared';
import { ErrorApi, api } from '../../api';
import { useAvisos } from '../../componentes/Avisos';
import { Confirmar } from '../../componentes/Confirmar';
import { ModalEnlace, ModalNuevoPerfil } from '../../componentes/PerfilModales';
import { CajaError, Cargando, Vacio } from '../../componentes/Estados';
import { useCarga } from '../../hooks/useCarga';
import { hace } from '../../util/formato';
import type { ContextoAdmin } from './AdminLayout';

type Estado = SolicitudAcceso['estado'];
type Ventana =
  | { tipo: 'crear'; solicitud: SolicitudAcceso }
  | { tipo: 'rechazar'; solicitud: SolicitudAcceso }
  | { tipo: 'enlace'; cuenta: UsuarioAdmin; enlace: EnlaceActivacion }
  | null;

const TEXTO_ESTADO: Record<Estado, string> = { pendiente: 'Pendientes', atendida: 'Atendidas', rechazada: 'Rechazadas' };

export default function Solicitudes() {
  const { refrescarPendientes } = useOutletContext<ContextoAdmin>();
  const avisos = useAvisos();
  const [filtro, setFiltro] = useState<Estado>('pendiente');
  const { datos, error, cargando, recargar } = useCarga(() => api<{ solicitudes: SolicitudAcceso[] }>('/admin/solicitudes', { consulta: { estado: filtro } }), [filtro]);
  const [ventana, setVentana] = useState<Ventana>(null);

  const atender = async (s: SolicitudAcceso, estado: 'atendida' | 'rechazada') => {
    await api(`/admin/solicitudes/${s.id}/atender`, { metodo: 'POST', cuerpo: { estado } });
    refrescarPendientes();
    recargar();
  };

  const marcarAtendida = async (s: SolicitudAcceso) => {
    try {
      await atender(s, 'atendida');
      avisos.ok('Marcaste la solicitud como atendida.');
    } catch (x) {
      avisos.error(x instanceof ErrorApi ? x.message : 'No se pudo marcar la solicitud.');
    }
  };

  const lista = datos?.solicitudes ?? [];

  return (
    <>
      <header className="pagina-cab">
        <div>
          <h1 className="titulo">Solicitudes de acceso</h1>
          <p>Personas que pidieron entrar desde la pantalla de ingreso. Al crear el perfil, la solicitud queda atendida.</p>
        </div>
        <div className="segmentado" role="group" aria-label="Filtrar por estado">
          {(Object.keys(TEXTO_ESTADO) as Estado[]).map((e) => (
            <button key={e} type="button" aria-pressed={filtro === e} onClick={() => setFiltro(e)}>
              {TEXTO_ESTADO[e]}
            </button>
          ))}
        </div>
      </header>

      <section className="panel" aria-label={TEXTO_ESTADO[filtro]}>
        {cargando && !datos ? (
          <Cargando texto="Cargando solicitudes…" />
        ) : error ? (
          <CajaError mensaje={error} onReintentar={recargar} />
        ) : lista.length === 0 ? (
          <Vacio Icono={Inbox} titulo={filtro === 'pendiente' ? 'No hay solicitudes pendientes' : 'Nada por aquí todavía'} texto={filtro === 'pendiente' ? 'Cuando alguien pida acceso aparecerá aquí.' : undefined} />
        ) : (
          <ul>
            {lista.map((s) => (
              <li key={s.id} className="solicitud">
                <div className="solicitud__datos">
                  <h3>{s.nombre}</h3>
                  <p className="solicitud__meta">
                    {s.correo}
                    {s.cargo ? ` · ${s.cargo}` : ''} · {hace(s.creadaEn)}
                    {s.estado !== 'pendiente' && s.atendidaPor ? ` · ${s.estado === 'atendida' ? 'atendida' : 'rechazada'} por ${s.atendidaPor}` : ''}
                  </p>
                  {s.mensaje && <p className="solicitud__mensaje">{s.mensaje}</p>}
                </div>
                {s.estado === 'pendiente' && (
                  <div className="solicitud__acciones">
                    <button type="button" className="btn btn--primario btn--chico" onClick={() => setVentana({ tipo: 'crear', solicitud: s })}>
                      Crear perfil
                    </button>
                    <button type="button" className="btn btn--secundario btn--chico" onClick={() => void marcarAtendida(s)}>
                      Ya la atendí
                    </button>
                    <button type="button" className="btn btn--peligro btn--chico" onClick={() => setVentana({ tipo: 'rechazar', solicitud: s })}>
                      Rechazar
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {ventana?.tipo === 'crear' && (
        <ModalNuevoPerfil
          inicial={{ nombre: ventana.solicitud.nombre, correo: ventana.solicitud.correo, cargo: ventana.solicitud.cargo }}
          onCerrar={() => setVentana(null)}
          onCreado={async (cuenta, enlace) => {
            const solicitud = ventana.solicitud;
            setVentana({ tipo: 'enlace', cuenta, enlace });
            try {
              await atender(solicitud, 'atendida');
            } catch {
              avisos.error('El perfil se creó, pero no se pudo marcar la solicitud como atendida.');
            }
          }}
        />
      )}
      {ventana?.tipo === 'rechazar' && (
        <Confirmar
          titulo="Rechazar solicitud"
          mensaje={<p>Vas a rechazar la solicitud de {ventana.solicitud.nombre}. No se le envía ningún aviso: si quieres explicarle por qué, escríbele a {ventana.solicitud.correo}.</p>}
          textoConfirmar="Rechazar"
          peligro
          onCerrar={() => setVentana(null)}
          onConfirmar={async () => {
            await atender(ventana.solicitud, 'rechazada');
            avisos.ok('Rechazaste la solicitud.');
          }}
        />
      )}
      {ventana?.tipo === 'enlace' && <ModalEnlace cuenta={ventana.cuenta} enlace={ventana.enlace} onCerrar={() => setVentana(null)} />}
    </>
  );
}
