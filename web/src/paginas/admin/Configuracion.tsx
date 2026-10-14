import { DatabaseBackup, Download, RotateCcw } from 'lucide-react';
import { useState, type CSSProperties } from 'react';
import type { AjusteInfo, GrupoAjustes, InfoRespaldo, InfoSistema } from '@ol/shared';
import { ErrorApi, api, descargar } from '../../api';
import { useAvisos } from '../../componentes/Avisos';
import { CampoSeleccion } from '../../componentes/Campo';
import { Caja, CajaError, Cargando } from '../../componentes/Estados';
import { Interruptor } from '../../componentes/Interruptor';
import { useMarca } from '../../estado/marca';
import { useCarga } from '../../hooks/useCarga';
import { bytesLegibles, duracionLegible, formatoFechaHora, hace } from '../../util/formato';

const DIAS = [
  { n: 1, corto: 'L', largo: 'Lunes' },
  { n: 2, corto: 'M', largo: 'Martes' },
  { n: 3, corto: 'X', largo: 'Miércoles' },
  { n: 4, corto: 'J', largo: 'Jueves' },
  { n: 5, corto: 'V', largo: 'Viernes' },
  { n: 6, corto: 'S', largo: 'Sábado' },
  { n: 7, corto: 'D', largo: 'Domingo' },
];

const SISTEMA = 'sistema';

function Control({ a, id, valor, onCambio }: { a: AjusteInfo; id: string; valor: unknown; onCambio: (v: unknown) => void }) {
  switch (a.tipo) {
    case 'entero':
      return <input id={id} className="entrada entrada--numero" type="number" inputMode="numeric" min={a.min} max={a.max} step={1} value={String(valor ?? '')} onChange={(e) => onCambio(e.target.value === '' ? '' : Number(e.target.value))} />;
    case 'booleano':
      return <Interruptor id={id} marcado={valor === true} onCambio={onCambio} etiqueta={a.etiqueta} />;
    case 'texto':
      return <input id={id} className="entrada" type="text" maxLength={a.maxLargo} value={String(valor ?? '')} onChange={(e) => onCambio(e.target.value)} />;
    case 'color':
      return (
        <div className="color-control">
          <input type="color" aria-label={`${a.etiqueta}: selector de color`} value={String(valor ?? '#000000').slice(0, 7)} onChange={(e) => onCambio(e.target.value.toUpperCase())} />
          <input id={id} className="entrada mono" type="text" maxLength={7} value={String(valor ?? '')} onChange={(e) => onCambio(e.target.value)} spellCheck={false} />
        </div>
      );
    case 'hora':
      return <input id={id} className="entrada" type="time" value={String(valor ?? '')} onChange={(e) => onCambio(e.target.value)} />;
    case 'dias': {
      const activos = new Set(
        String(valor ?? '')
          .split(',')
          .filter(Boolean)
          .map(Number),
      );
      const alternar = (n: number) => {
        const nuevos = new Set(activos);
        if (nuevos.has(n)) nuevos.delete(n);
        else nuevos.add(n);
        onCambio([...nuevos].sort((x, y) => x - y).join(','));
      };
      return (
        <div className="dias" role="group" aria-label={a.etiqueta}>
          {DIAS.map((d) => (
            <button key={d.n} type="button" aria-pressed={activos.has(d.n)} aria-label={d.largo} title={d.largo} onClick={() => alternar(d.n)}>
              {d.corto}
            </button>
          ))}
        </div>
      );
    }
    case 'seleccion':
      return (
        <select id={id} className="entrada" value={String(valor ?? '')} onChange={(e) => onCambio(e.target.value)}>
          {a.opciones?.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.etiqueta}
            </option>
          ))}
        </select>
      );
  }
}

function VistaPrevia({ color, secundario }: { color: string; secundario: string }) {
  const estilo = { '--primario': /^#[0-9a-fA-F]{6}$/.test(color) ? color : '#EF3B3A', '--secundario': /^#[0-9a-fA-F]{6}$/.test(secundario) ? secundario : '#1C1C1E' } as CSSProperties;
  return (
    <div className="vista-previa" style={estilo} aria-label="Vista previa de los colores">
      <button type="button" className="btn btn--primario btn--chico" tabIndex={-1}>
        Botón principal
      </button>
      <button type="button" className="btn btn--secundario btn--chico" tabIndex={-1}>
        Botón secundario
      </button>
      <span className="insignia insignia--acento">Etiqueta</span>
      <span className="vista-previa__oscuro">Fondo oscuro</span>
    </div>
  );
}

function PanelRespaldos() {
  const avisos = useAvisos();
  const { datos, error, cargando, recargar } = useCarga(() => api<{ respaldos: InfoRespaldo[] }>('/admin/respaldos'), []);
  const [creando, setCreando] = useState(false);
  const [bajando, setBajando] = useState<string | null>(null);

  const crear = async () => {
    setCreando(true);
    try {
      await api('/admin/respaldos', { metodo: 'POST' });
      avisos.ok('Respaldo creado.');
      recargar();
    } catch (x) {
      avisos.error(x instanceof ErrorApi ? x.message : 'No se pudo crear el respaldo.');
    } finally {
      setCreando(false);
    }
  };

  const bajar = async (nombre: string) => {
    setBajando(nombre);
    try {
      await descargar(`/admin/respaldos/${nombre}`, nombre);
    } catch (x) {
      avisos.error(x instanceof ErrorApi ? x.message : 'No se pudo descargar el respaldo.');
    } finally {
      setBajando(null);
    }
  };

  return (
    <section className="panel" aria-labelledby="t-resp">
      <div className="panel__cab">
        <div>
          <h2 id="t-resp" className="sub">
            Copias guardadas
          </h2>
          <p>Están en la carpeta de datos del servidor. Descárgalas para guardarlas también en otro lugar.</p>
        </div>
        <button type="button" className={`btn btn--primario${creando ? ' btn--cargando' : ''}`} onClick={() => void crear()} disabled={creando}>
          <DatabaseBackup aria-hidden="true" />
          <span>Respaldar ahora</span>
        </button>
      </div>
      {cargando && !datos ? (
        <Cargando />
      ) : error ? (
        <CajaError mensaje={error} onReintentar={recargar} />
      ) : datos && datos.respaldos.length > 0 ? (
        <ul>
          {datos.respaldos.map((r) => (
            <li key={r.nombre} className="respaldo">
              <div>
                <strong>{formatoFechaHora(r.creadoEn)}</strong>
                <span>
                  {r.motivo === 'manual' ? 'Manual' : r.motivo === 'auto' ? 'Automático' : 'Previo a una migración'} · {bytesLegibles(r.bytes)}
                </span>
              </div>
              <button type="button" className={`btn btn--secundario btn--chico${bajando === r.nombre ? ' btn--cargando' : ''}`} onClick={() => void bajar(r.nombre)} disabled={bajando !== null}>
                <Download aria-hidden="true" />
                <span>Descargar</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="texto-2">Todavía no hay respaldos. Pulsa «Respaldar ahora» para crear el primero.</p>
      )}
    </section>
  );
}

function PanelSistema() {
  const { datos, error, cargando, recargar } = useCarga(() => api<InfoSistema>('/admin/sistema'), []);
  if (cargando && !datos) return <Cargando />;
  if (error || !datos) return <CajaError mensaje={error ?? 'No se pudo cargar.'} onReintentar={recargar} />;
  return (
    <section className="panel" aria-labelledby="t-sistema">
      <div className="panel__cab">
        <div>
          <h2 id="t-sistema" className="sub">
            Estado del sistema
          </h2>
          <p>Solo lectura.</p>
        </div>
      </div>
      <dl className="datos">
        <dt>Versión</dt>
        <dd>{datos.version}</dd>
        <dt>Node</dt>
        <dd>{datos.node}</dd>
        <dt>Activo desde</dt>
        <dd>
          {formatoFechaHora(datos.iniciadoEn)} ({duracionLegible(datos.segundosActivo)})
        </dd>
        <dt>Base de datos</dt>
        <dd>{bytesLegibles(datos.baseBytes)}</dd>
        <dt>Cuentas</dt>
        <dd>
          {datos.usuariosActivos} activas de {datos.usuarios}
        </dd>
        <dt>Solicitudes pendientes</dt>
        <dd>{datos.solicitudesPendientes}</dd>
        <dt>Último respaldo</dt>
        <dd>{datos.ultimoRespaldo ? `${hace(datos.ultimoRespaldo.creadoEn)} (${formatoFechaHora(datos.ultimoRespaldo.creadoEn)})` : 'Ninguno'}</dd>
        <dt>Carpeta de datos</dt>
        <dd className="mono">{datos.carpetaDatos}</dd>
        {datos.modoDemo && (
          <>
            <dt>Modo</dt>
            <dd>Demostración (datos de ejemplo)</dd>
          </>
        )}
      </dl>
    </section>
  );
}

export default function Configuracion() {
  const avisos = useAvisos();
  const { refrescar: refrescarMarca } = useMarca();
  const { datos, error, cargando, recargar, poner } = useCarga(() => api<{ grupos: GrupoAjustes[] }>('/admin/ajustes'), []);
  const [grupoId, setGrupoId] = useState('seguridad');
  const [cambios, setCambios] = useState<Record<string, unknown>>({});
  const [guardando, setGuardando] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null);

  if (cargando && !datos) return <Cargando texto="Cargando configuración…" />;
  if (error || !datos) return <CajaError mensaje={error ?? 'No se pudo cargar la configuración.'} onReintentar={recargar} />;

  const grupos = datos.grupos;
  const grupo = grupos.find((g) => g.id === grupoId);
  const valorDe = (a: AjusteInfo): unknown => (a.clave in cambios ? cambios[a.clave] : a.valor);
  const cambiado = (a: AjusteInfo): boolean => a.clave in cambios && String(cambios[a.clave]) !== String(a.valor);
  const numeroDeCambios = grupos.flatMap((g) => g.ajustes).filter(cambiado).length;
  const hayCambiosEn = (g: GrupoAjustes): boolean => g.ajustes.some(cambiado);

  const poner1 = (a: AjusteInfo, v: unknown) => {
    setErrorGuardar(null);
    setCambios((c) => {
      const siguiente = { ...c };
      if (String(v) === String(a.valor)) delete siguiente[a.clave];
      else siguiente[a.clave] = v;
      return siguiente;
    });
  };

  const restablecerGrupo = (g: GrupoAjustes) => {
    setErrorGuardar(null);
    setCambios((c) => {
      const siguiente = { ...c };
      for (const a of g.ajustes) {
        if (String(a.defecto) === String(a.valor)) delete siguiente[a.clave];
        else siguiente[a.clave] = a.defecto;
      }
      return siguiente;
    });
  };

  const guardar = async () => {
    setGuardando(true);
    setErrorGuardar(null);
    try {
      const efectivos = Object.fromEntries(Object.entries(cambios).filter(([clave]) => grupos.flatMap((g) => g.ajustes).some((a) => a.clave === clave && cambiado(a))));
      const r = await api<{ grupos: GrupoAjustes[]; cambiados: string[] }>('/admin/ajustes', { metodo: 'PUT', cuerpo: { cambios: efectivos } });
      poner({ grupos: r.grupos });
      setCambios({});
      avisos.ok(r.cambiados.length === 1 ? 'Guardaste 1 cambio.' : `Guardaste ${r.cambiados.length} cambios.`);
      if (r.cambiados.some((c) => c.startsWith('color_') || c === 'nombre_plataforma' || c === 'solicitudes_activas')) await refrescarMarca();
    } catch (x) {
      setErrorGuardar(x instanceof ErrorApi ? x.message : 'No se pudo guardar. Intenta de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  const colorP = String(grupos.flatMap((g) => g.ajustes).find((a) => a.clave === 'color_primario') ? valorDe(grupos.flatMap((g) => g.ajustes).find((a) => a.clave === 'color_primario') as AjusteInfo) : '#EF3B3A');
  const colorS = String(grupos.flatMap((g) => g.ajustes).find((a) => a.clave === 'color_secundario') ? valorDe(grupos.flatMap((g) => g.ajustes).find((a) => a.clave === 'color_secundario') as AjusteInfo) : '#1C1C1E');

  return (
    <>
      <header className="pagina-cab">
        <div>
          <h1 className="titulo">Configuración</h1>
          <p>Todo lo que antes estaba escondido en el código. Los cambios se aplican al guardar y quedan en la actividad.</p>
        </div>
      </header>

      <div className="config">
        <nav className="config__nav" aria-label="Secciones de configuración">
          {grupos.map((g) => (
            <button key={g.id} type="button" aria-current={g.id === grupoId} onClick={() => setGrupoId(g.id)}>
              {g.titulo}
              {hayCambiosEn(g) && <span className="config__punto" title="Hay cambios sin guardar" />}
            </button>
          ))}
          <button type="button" aria-current={grupoId === SISTEMA} onClick={() => setGrupoId(SISTEMA)}>
            Sistema
          </button>
        </nav>

        <div>
          <div className="config__select">
            <CampoSeleccion etiqueta="Sección" value={grupoId} onChange={(e) => setGrupoId(e.target.value)}>
              {grupos.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.titulo}
                  {hayCambiosEn(g) ? ' (sin guardar)' : ''}
                </option>
              ))}
              <option value={SISTEMA}>Sistema</option>
            </CampoSeleccion>
          </div>

          {grupoId === SISTEMA ? (
            <PanelSistema />
          ) : (
            grupo && (
              <>
                <section className="panel" aria-labelledby="t-grupo">
                  <div className="panel__cab">
                    <div>
                      <h2 id="t-grupo" className="sub">
                        {grupo.titulo}
                      </h2>
                      {grupo.descripcion && <p>{grupo.descripcion}</p>}
                    </div>
                    <button type="button" className="btn btn--texto btn--chico" onClick={() => restablecerGrupo(grupo)}>
                      <RotateCcw aria-hidden="true" />
                      Valores por defecto
                    </button>
                  </div>
                  {grupo.id === 'apariencia' && <VistaPrevia color={colorP} secundario={colorS} />}
                  {grupo.ajustes.map((a) => {
                    const id = `aj-${a.clave}`;
                    return (
                      <div key={a.clave} className={`ajuste${cambiado(a) ? ' ajuste--cambiado' : ''}`}>
                        <div className="ajuste__texto">
                          <label htmlFor={id}>
                            <strong>{a.etiqueta}</strong>
                          </label>
                          {(a.ayuda || a.tipo === 'entero') && (
                            <p>
                              {a.ayuda}
                              {a.tipo === 'entero' && a.min !== undefined && a.max !== undefined ? ` ${a.ayuda ? '' : ''}De ${a.min} a ${a.max}.` : ''}
                            </p>
                          )}
                        </div>
                        <div className="ajuste__control">
                          <Control a={a} id={id} valor={valorDe(a)} onCambio={(v) => poner1(a, v)} />
                        </div>
                      </div>
                    );
                  })}
                </section>
                {grupo.id === 'respaldos' && <PanelRespaldos />}
              </>
            )
          )}

          {errorGuardar && (
            <div style={{ marginTop: 'var(--s4)' }}>
              <Caja tono="error">{errorGuardar}</Caja>
            </div>
          )}

          {numeroDeCambios > 0 && (
            <div className="barra-guardar" role="region" aria-label="Cambios sin guardar">
              <span>{numeroDeCambios === 1 ? 'Tienes 1 cambio sin guardar.' : `Tienes ${numeroDeCambios} cambios sin guardar.`}</span>
              <div>
                <button type="button" className="btn btn--secundario btn--chico" onClick={() => setCambios({})} disabled={guardando}>
                  Descartar
                </button>
                <button type="button" className={`btn btn--primario btn--chico${guardando ? ' btn--cargando' : ''}`} onClick={() => void guardar()} disabled={guardando}>
                  <span>Guardar cambios</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
