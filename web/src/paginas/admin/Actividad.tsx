import { ChevronLeft, ChevronRight, Download, History } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ETIQUETA_ACCION, etiquetaAccion, type PaginaActividad } from '@ol/shared';
import { ErrorApi, api, descargar } from '../../api';
import { useAvisos } from '../../componentes/Avisos';
import { Campo, CampoSeleccion } from '../../componentes/Campo';
import { CajaError, Cargando, Insignia, Vacio } from '../../componentes/Estados';
import { useCarga, useRetardo } from '../../hooks/useCarga';
import { formatoFechaHora } from '../../util/formato';

const POR_PAGINA = 50;
const TONO_FALLO = new Set(['login_fallido', 'bloqueo_cuenta']);

function inicioDelDia(fecha: string): string | undefined {
  return fecha ? new Date(`${fecha}T00:00:00`).toISOString() : undefined;
}
function finDelDia(fecha: string): string | undefined {
  return fecha ? new Date(`${fecha}T23:59:59.999`).toISOString() : undefined;
}

export default function Actividad() {
  const avisos = useAvisos();
  const [q, setQ] = useState('');
  const [accion, setAccion] = useState('');
  const [usuario, setUsuario] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [pagina, setPagina] = useState(1);
  const [exportando, setExportando] = useState(false);
  const qr = useRetardo(q);
  const ur = useRetardo(usuario);

  const filtros = { q: qr, accion, usuario: ur, desde: inicioDelDia(desde), hasta: finDelDia(hasta) };

  useEffect(() => setPagina(1), [qr, accion, ur, desde, hasta]);

  const { datos, error, cargando, recargar } = useCarga(
    () => api<PaginaActividad>('/admin/actividad', { consulta: { ...filtros, pagina, porPagina: POR_PAGINA } }),
    [qr, accion, ur, desde, hasta, pagina],
  );

  const exportar = async () => {
    setExportando(true);
    try {
      await descargar('/admin/actividad/csv', `actividad-${new Date().toISOString().slice(0, 10)}.csv`, filtros);
    } catch (x) {
      avisos.error(x instanceof ErrorApi ? x.message : 'No se pudo exportar la actividad.');
    } finally {
      setExportando(false);
    }
  };

  const totalPaginas = datos ? Math.max(1, Math.ceil(datos.total / datos.porPagina)) : 1;
  const hayFiltros = Boolean(qr || accion || ur || desde || hasta);

  return (
    <>
      <header className="pagina-cab">
        <div>
          <h1 className="titulo">Actividad</h1>
          <p>Quién hizo qué y cuándo. Incluye ingresos, intentos fallidos y cambios de administración. No guarda por dónde camina nadie.</p>
        </div>
        <div className="pagina-cab__acciones">
          <button type="button" className={`btn btn--secundario${exportando ? ' btn--cargando' : ''}`} onClick={() => void exportar()} disabled={exportando}>
            <Download aria-hidden="true" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </header>

      <section className="panel" aria-label="Registro de actividad">
        <div className="filtros">
          <div className="campo--buscar">
            <Campo etiqueta="Buscar" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Persona, objeto, detalle o IP" autoComplete="off" />
          </div>
          <CampoSeleccion etiqueta="Acción" value={accion} onChange={(e) => setAccion(e.target.value)}>
            <option value="">Todas</option>
            {Object.entries(ETIQUETA_ACCION).map(([clave, texto]) => (
              <option key={clave} value={clave}>
                {texto}
              </option>
            ))}
          </CampoSeleccion>
          <Campo etiqueta="Usuario" value={usuario} onChange={(e) => setUsuario(e.target.value)} autoComplete="off" autoCapitalize="none" />
          <Campo etiqueta="Desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} max={hasta || undefined} />
          <Campo etiqueta="Hasta" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} min={desde || undefined} />
        </div>

        {cargando && !datos ? (
          <Cargando texto="Cargando actividad…" />
        ) : error ? (
          <CajaError mensaje={error} onReintentar={recargar} />
        ) : !datos || datos.registros.length === 0 ? (
          <Vacio Icono={History} titulo={hayFiltros ? 'Ningún registro coincide' : 'Aún no hay actividad'} texto={hayFiltros ? 'Prueba con otro rango de fechas o quita los filtros.' : undefined} />
        ) : (
          <>
            <div className="tabla-caja">
              <table className="tabla tabla--apilada tabla--actividad">
                <caption className="sr-only">Registro de actividad</caption>
                <thead>
                  <tr>
                    <th scope="col">Fecha</th>
                    <th scope="col">Persona</th>
                    <th scope="col">Acción</th>
                    <th scope="col">Detalle</th>
                    <th scope="col">IP</th>
                  </tr>
                </thead>
                <tbody>
                  {datos.registros.map((r) => (
                    <tr key={r.id}>
                      <td className="dato">
                        {formatoFechaHora(r.fecha)}
                      </td>
                      <td>{r.usuario || 'Sistema'}</td>
                      <td>
                        <Insignia tono={TONO_FALLO.has(r.accion) ? 'peligro' : undefined}>{etiquetaAccion(r.accion)}</Insignia>
                      </td>
                      <td>
                        {r.objeto}
                        {r.objeto && r.detalle ? ' · ' : ''}
                        <span className="tabla__sec">{r.detalle}</span>
                      </td>
                      <td className="mono">
                        {r.ip || ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <nav className="paginacion" aria-label="Paginación">
              <span>
                {datos.total} {datos.total === 1 ? 'registro' : 'registros'} · página {datos.pagina} de {totalPaginas}
              </span>
              <div>
                <button type="button" className="btn btn--secundario btn--chico" onClick={() => setPagina((p) => p - 1)} disabled={pagina <= 1}>
                  <ChevronLeft aria-hidden="true" />
                  Anterior
                </button>
                <button type="button" className="btn btn--secundario btn--chico" onClick={() => setPagina((p) => p + 1)} disabled={pagina >= totalPaginas}>
                  Siguiente
                  <ChevronRight aria-hidden="true" />
                </button>
              </div>
            </nav>
          </>
        )}
      </section>
    </>
  );
}
