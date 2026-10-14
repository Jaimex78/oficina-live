import { CircleCheck, DatabaseBackup, Inbox, LockKeyhole, UserRoundPlus, type LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { etiquetaAccion, type InfoSistema, type PaginaActividad, type UsuarioAdmin } from '@ol/shared';
import { api, ErrorApi } from '../../api';
import { useAvisos } from '../../componentes/Avisos';
import { Cargando, CajaError } from '../../componentes/Estados';
import { useSesion } from '../../estado/sesion';
import { useCarga } from '../../hooks/useCarga';
import { bytesLegibles, duracionLegible, hace } from '../../util/formato';

interface Pendiente {
  clave: string;
  Icono: LucideIcon;
  tono?: 'ok' | 'peligro';
  titulo: string;
  detalle: string;
  accion: { texto: string; a?: string; alHacer?: () => void };
}

/** Resumen prosa primero: lo que necesita atención hoy, con la acción al lado. Sin tarjetas de cifras sueltas. */
export default function Resumen() {
  const { usuario } = useSesion();
  const avisos = useAvisos();
  const sistema = useCarga(() => api<InfoSistema>('/admin/sistema'), []);
  const cuentas = useCarga(() => api<{ usuarios: UsuarioAdmin[] }>('/admin/usuarios'), []);
  const actividad = useCarga(() => api<PaginaActividad>('/admin/actividad', { consulta: { porPagina: 10 } }), []);
  const [respaldando, setRespaldando] = useState(false);

  const respaldar = async () => {
    setRespaldando(true);
    try {
      await api('/admin/respaldos', { metodo: 'POST' });
      avisos.ok('Respaldo creado.');
      sistema.recargar();
      actividad.recargar();
    } catch (x) {
      avisos.error(x instanceof ErrorApi ? x.message : 'No se pudo crear el respaldo.');
    } finally {
      setRespaldando(false);
    }
  };

  if (sistema.cargando || cuentas.cargando) return <Cargando texto="Preparando el resumen…" />;
  if (sistema.error || cuentas.error || !sistema.datos || !cuentas.datos) {
    return (
      <CajaError
        mensaje={sistema.error ?? cuentas.error ?? 'No se pudo preparar el resumen.'}
        onReintentar={() => {
          sistema.recargar();
          cuentas.recargar();
        }}
      />
    );
  }

  const s = sistema.datos;
  const lista = cuentas.datos.usuarios;
  const bloqueadas = lista.filter((u) => u.bloqueadaHasta);
  const sinEstrenar = lista.filter((u) => u.activo && u.debeCambiarClave && !u.ultimoIngreso);

  const pendientes: Pendiente[] = [];
  if (s.solicitudesPendientes > 0) {
    pendientes.push({
      clave: 'solicitudes',
      Icono: Inbox,
      titulo: s.solicitudesPendientes === 1 ? '1 solicitud de acceso espera respuesta' : `${s.solicitudesPendientes} solicitudes de acceso esperan respuesta`,
      detalle: 'Quien la envió sigue sin poder entrar.',
      accion: { texto: 'Revisar', a: '/admin/solicitudes' },
    });
  }
  if (bloqueadas.length > 0) {
    pendientes.push({
      clave: 'bloqueadas',
      Icono: LockKeyhole,
      tono: 'peligro',
      titulo: bloqueadas.length === 1 ? `La cuenta de ${bloqueadas[0]?.nombre ?? 'una persona'} está bloqueada` : `${bloqueadas.length} cuentas están bloqueadas`,
      detalle: 'Se bloquean solas por intentos fallidos. Puedes desbloquearlas desde Cuentas.',
      accion: { texto: 'Ver cuentas', a: '/admin/cuentas' },
    });
  }
  if (sinEstrenar.length > 0) {
    pendientes.push({
      clave: 'sin-estrenar',
      Icono: UserRoundPlus,
      titulo: sinEstrenar.length === 1 ? `${sinEstrenar[0]?.nombre ?? 'Una cuenta'} aún no ha entrado` : `${sinEstrenar.length} cuentas aún no han entrado`,
      detalle: 'Tienen contraseña temporal. Si pasó mucho tiempo, restablécela y compártela de nuevo.',
      accion: { texto: 'Ver cuentas', a: '/admin/cuentas' },
    });
  }
  if (!s.ultimoRespaldo) {
    pendientes.push({
      clave: 'respaldo',
      Icono: DatabaseBackup,
      titulo: 'Todavía no hay ningún respaldo',
      detalle: 'Haz el primero. Después se harán solos según la configuración.',
      accion: { texto: respaldando ? 'Respaldando…' : 'Respaldar ahora', alHacer: () => void respaldar() },
    });
  }

  return (
    <>
      <header className="pagina-cab">
        <div>
          <h1 className="titulo">Hola, {usuario?.nombre.split(' ')[0]}</h1>
          <p>{pendientes.length === 0 ? 'Todo está al día.' : pendientes.length === 1 ? 'Hay una cosa que necesita tu atención.' : `Hay ${pendientes.length} cosas que necesitan tu atención.`}</p>
        </div>
      </header>

      <div className="rejilla-resumen">
        <div>
          <section className="panel" aria-labelledby="t-pend">
            <div className="panel__cab">
              <h2 id="t-pend" className="sub">
                Pendientes
              </h2>
            </div>
            {pendientes.length === 0 ? (
              <div className="pendiente">
                <span className="pendiente__icono pendiente__icono--ok">
                  <CircleCheck aria-hidden="true" />
                </span>
                <div className="pendiente__texto">
                  <strong>Nada por atender</strong>
                  <span>
                    {s.usuariosActivos} {s.usuariosActivos === 1 ? 'cuenta activa' : 'cuentas activas'}. Último respaldo {hace(s.ultimoRespaldo?.creadoEn)}.
                  </span>
                </div>
              </div>
            ) : (
              <ul className="pendientes">
                {pendientes.map(({ clave, Icono, tono, titulo, detalle, accion }) => (
                  <li key={clave} className="pendiente">
                    <span className={`pendiente__icono${tono ? ` pendiente__icono--${tono}` : ''}`}>
                      <Icono aria-hidden="true" />
                    </span>
                    <div className="pendiente__texto">
                      <strong>{titulo}</strong>
                      <span>{detalle}</span>
                    </div>
                    {accion.a ? (
                      <Link className="btn btn--secundario btn--chico" to={accion.a}>
                        {accion.texto}
                      </Link>
                    ) : (
                      <button type="button" className="btn btn--secundario btn--chico" onClick={accion.alHacer} disabled={respaldando}>
                        {accion.texto}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="panel" aria-labelledby="t-act">
            <div className="panel__cab">
              <h2 id="t-act" className="sub">
                Actividad reciente
              </h2>
              <Link className="btn btn--texto btn--chico" to="/admin/actividad">
                Ver todo
              </Link>
            </div>
            {actividad.cargando ? (
              <Cargando />
            ) : actividad.error || !actividad.datos ? (
              <CajaError mensaje={actividad.error ?? 'No se pudo cargar.'} onReintentar={actividad.recargar} />
            ) : actividad.datos.registros.length === 0 ? (
              <p className="texto-2">Aún no hay actividad registrada.</p>
            ) : (
              <ul className="registro-lista">
                {actividad.datos.registros.map((r) => (
                  <li key={r.id} className="registro">
                    <span>
                      <strong>{r.usuario || 'Sistema'}</strong> · {etiquetaAccion(r.accion)}
                      {r.objeto ? ` · ${r.objeto}` : ''}
                    </span>
                    <time dateTime={r.fecha}>{hace(r.fecha)}</time>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <section className="panel" aria-labelledby="t-sis">
          <div className="panel__cab">
            <h2 id="t-sis" className="sub">
              Sistema
            </h2>
          </div>
          <dl className="datos">
            <dt>Versión</dt>
            <dd>{s.version}</dd>
            <dt>Activo hace</dt>
            <dd>{duracionLegible(s.segundosActivo)}</dd>
            <dt>Cuentas</dt>
            <dd>
              {s.usuariosActivos} activas de {s.usuarios}
            </dd>
            <dt>Base de datos</dt>
            <dd>{bytesLegibles(s.baseBytes)}</dd>
            <dt>Último respaldo</dt>
            <dd>{s.ultimoRespaldo ? hace(s.ultimoRespaldo.creadoEn) : 'Ninguno'}</dd>
            <dt>Node</dt>
            <dd>{s.node}</dd>
            {s.modoDemo && (
              <>
                <dt>Modo</dt>
                <dd>Demostración (datos de ejemplo)</dd>
              </>
            )}
          </dl>
        </section>
      </div>
    </>
  );
}
