import { KeyRound, Link2, ListPlus, LockOpen, Mail, Pencil, Plus, Trash2, UserCheck, UserRound, UserX } from 'lucide-react';
import { useState } from 'react';
import { ETIQUETA_ROL, ROLES, type EnlaceActivacion, type UsuarioAdmin } from '@ol/shared';
import { ErrorApi, api } from '../../api';
import { useAvisos } from '../../componentes/Avisos';
import { Campo, CampoSeleccion } from '../../componentes/Campo';
import { Confirmar } from '../../componentes/Confirmar';
import { ModalClaveTemporal, ModalEditarCuenta } from '../../componentes/CuentaModales';
import { CajaError, Cargando, Iniciales, Insignia, Vacio } from '../../componentes/Estados';
import { MenuAcciones, type ItemMenu } from '../../componentes/MenuAcciones';
import { ModalEnlace, ModalLote, ModalNuevoPerfil, TEXTO_CORREO_NO_DISPONIBLE } from '../../componentes/PerfilModales';
import { useSesion } from '../../estado/sesion';
import { useCarga, useRetardo } from '../../hooks/useCarga';
import { formatoFecha, hace } from '../../util/formato';

type Ventana =
  | { tipo: 'perfil' }
  | { tipo: 'lote' }
  | { tipo: 'enlace'; cuenta: UsuarioAdmin; enlace: EnlaceActivacion }
  | { tipo: 'editar'; cuenta: UsuarioAdmin }
  | { tipo: 'restablecer'; cuenta: UsuarioAdmin }
  | { tipo: 'desactivar'; cuenta: UsuarioAdmin }
  | { tipo: 'eliminar'; cuenta: UsuarioAdmin }
  | { tipo: 'clave'; usuario: string; clave: string; motivo: 'creada' | 'restablecida' }
  | null;

function estadoDe(u: UsuarioAdmin) {
  if (!u.activo) return <Insignia>Inactiva</Insignia>;
  if (u.pendiente) {
    const vencido = u.enlaceVence !== null && new Date(u.enlaceVence).getTime() <= Date.now();
    return (
      <>
        <Insignia tono="aviso">Pendiente de activación</Insignia>
        <div className="tabla__sec">{u.enlaceVence ? (vencido ? 'Enlace vencido' : `Vence el ${formatoFecha(u.enlaceVence)}`) : 'Sin enlace vigente'}</div>
      </>
    );
  }
  if (u.bloqueadaHasta) return <Insignia tono="peligro">Bloqueada</Insignia>;
  if (u.debeCambiarClave) return <Insignia tono="aviso">Clave temporal</Insignia>;
  return <Insignia tono="ok">Activa</Insignia>;
}

export default function Cuentas() {
  const { usuario: yo } = useSesion();
  const avisos = useAvisos();
  const [q, setQ] = useState('');
  const [rol, setRol] = useState('');
  const [activo, setActivo] = useState('');
  const buscada = useRetardo(q);
  const { datos, error, cargando, recargar } = useCarga(() => api<{ usuarios: UsuarioAdmin[] }>('/admin/usuarios', { consulta: { q: buscada, rol, activo } }), [buscada, rol, activo]);
  const [ventana, setVentana] = useState<Ventana>(null);

  const fallo = (x: unknown, porDefecto: string) => avisos.error(x instanceof ErrorApi ? x.message : porDefecto);

  const desbloquear = async (c: UsuarioAdmin) => {
    try {
      await api(`/admin/usuarios/${c.id}/desbloquear`, { metodo: 'POST' });
      avisos.ok(`Desbloqueaste la cuenta de ${c.nombre}.`);
      recargar();
    } catch (x) {
      fallo(x, 'No se pudo desbloquear la cuenta.');
    }
  };

  const activar = async (c: UsuarioAdmin) => {
    try {
      await api(`/admin/usuarios/${c.id}`, { metodo: 'PATCH', cuerpo: { activo: true } });
      avisos.ok(`${c.nombre} puede ingresar de nuevo.`);
      recargar();
    } catch (x) {
      fallo(x, 'No se pudo activar la cuenta.');
    }
  };

  const generarEnlace = async (c: UsuarioAdmin) => {
    try {
      const r = await api<{ usuario: UsuarioAdmin; enlace: EnlaceActivacion }>(`/admin/usuarios/${c.id}/enlace`, { metodo: 'POST' });
      setVentana({ tipo: 'enlace', cuenta: r.usuario, enlace: r.enlace });
      recargar();
    } catch (x) {
      fallo(x, 'No se pudo generar el enlace.');
    }
  };

  const itemsDe = (c: UsuarioAdmin): ItemMenu[] => {
    const esYo = c.id === yo?.id;
    const items: ItemMenu[] = [{ clave: 'editar', etiqueta: 'Editar datos y rol', Icono: Pencil, onElegir: () => setVentana({ tipo: 'editar', cuenta: c }) }];
    if (c.pendiente) {
      items.push(
        { clave: 'enlace', etiqueta: 'Generar enlace nuevo', Icono: Link2, onElegir: () => void generarEnlace(c) },
        { clave: 'correo', etiqueta: `Enviar por correo. ${TEXTO_CORREO_NO_DISPONIBLE}`, Icono: Mail, onElegir: () => undefined, deshabilitado: true },
      );
    } else {
      items.push({ clave: 'clave', etiqueta: 'Restablecer contraseña', Icono: KeyRound, onElegir: () => setVentana({ tipo: 'restablecer', cuenta: c }), deshabilitado: esYo });
    }
    if (c.bloqueadaHasta) items.push({ clave: 'desbloquear', etiqueta: 'Desbloquear cuenta', Icono: LockOpen, onElegir: () => void desbloquear(c) });
    items.push(
      c.activo
        ? { clave: 'desactivar', etiqueta: 'Desactivar cuenta', Icono: UserX, onElegir: () => setVentana({ tipo: 'desactivar', cuenta: c }), deshabilitado: esYo }
        : { clave: 'activar', etiqueta: 'Activar cuenta', Icono: UserCheck, onElegir: () => void activar(c) },
      { clave: 'eliminar', etiqueta: 'Eliminar cuenta', Icono: Trash2, peligro: true, onElegir: () => setVentana({ tipo: 'eliminar', cuenta: c }), deshabilitado: esYo },
    );
    return items;
  };

  const lista = datos?.usuarios ?? [];
  const hayFiltros = Boolean(buscada || rol || activo);

  return (
    <>
      <header className="pagina-cab">
        <div>
          <h1 className="titulo">Cuentas</h1>
          <p>Quién puede entrar a la oficina y qué puede hacer. Cada persona crea su contraseña con un enlace de un solo uso, que se muestra una sola vez.</p>
        </div>
        <div className="pagina-cab__acciones">
          <button type="button" className="btn btn--secundario" onClick={() => setVentana({ tipo: 'lote' })}>
            <ListPlus aria-hidden="true" />
            Crear varios
          </button>
          <button type="button" className="btn btn--primario" onClick={() => setVentana({ tipo: 'perfil' })}>
            <Plus aria-hidden="true" />
            Crear perfil
          </button>
        </div>
      </header>

      <section className="panel" aria-label="Lista de cuentas">
        <div className="filtros">
          <div className="campo--buscar">
            <Campo etiqueta="Buscar" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nombre, usuario, correo o cargo" autoComplete="off" />
          </div>
          <CampoSeleccion etiqueta="Rol" value={rol} onChange={(e) => setRol(e.target.value)}>
            <option value="">Todos</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ETIQUETA_ROL[r]}
              </option>
            ))}
          </CampoSeleccion>
          <CampoSeleccion etiqueta="Estado" value={activo} onChange={(e) => setActivo(e.target.value)}>
            <option value="">Todas</option>
            <option value="1">Activas (incluye pendientes)</option>
            <option value="0">Inactivas</option>
          </CampoSeleccion>
        </div>

        {cargando && !datos ? (
          <Cargando texto="Cargando cuentas…" />
        ) : error ? (
          <CajaError mensaje={error} onReintentar={recargar} />
        ) : lista.length === 0 ? (
          <Vacio
            Icono={UserRound}
            titulo={hayFiltros ? 'Ninguna cuenta coincide' : 'Aún no hay cuentas'}
            texto={hayFiltros ? 'Prueba con otra búsqueda o quita los filtros.' : 'Crea un perfil para que alguien pueda entrar.'}
            accion={
              hayFiltros ? (
                <button
                  type="button"
                  className="btn btn--secundario"
                  onClick={() => {
                    setQ('');
                    setRol('');
                    setActivo('');
                  }}
                >
                  Quitar filtros
                </button>
              ) : undefined
            }
          />
        ) : (
          <div className="tabla-caja" style={{ minHeight: 300 }}>
            <table className="tabla tabla--apilada">
              <caption className="sr-only">Cuentas de la plataforma</caption>
              <thead>
                <tr>
                  <th scope="col">Persona</th>
                  <th scope="col">Rol</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Último ingreso</th>
                  <th scope="col" className="tabla__acciones">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {lista.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="tabla__persona">
                        <Iniciales nombre={u.nombre} id={u.id} foto={u.foto} />
                        <div>
                          <div className="tabla__nombre">
                            {u.nombre} {u.id === yo?.id && <Insignia tono="acento">Tú</Insignia>}
                          </div>
                          <div className="tabla__sec">{u.cargo || 'Sin cargo'}</div>
                          <div className="tabla__sec">
                            {u.usuario} · {u.correo || 'sin correo'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <Insignia tono={u.rol === 'admin' ? 'acento' : undefined}>{ETIQUETA_ROL[u.rol]}</Insignia>
                    </td>
                    <td>{estadoDe(u)}</td>
                    <td data-prefijo="Último ingreso" className="dato">
                      {hace(u.ultimoIngreso)}
                    </td>
                    <td className="tabla__acciones">
                      <MenuAcciones etiqueta={`Acciones para ${u.nombre}`} items={itemsDe(u)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {ventana?.tipo === 'perfil' && (
        <ModalNuevoPerfil
          onCerrar={() => setVentana(null)}
          onCreado={(c, enlace) => {
            setVentana({ tipo: 'enlace', cuenta: c, enlace });
            recargar();
          }}
        />
      )}
      {ventana?.tipo === 'lote' && <ModalLote onCerrar={() => setVentana(null)} onCreadas={recargar} />}
      {ventana?.tipo === 'enlace' && <ModalEnlace cuenta={ventana.cuenta} enlace={ventana.enlace} onCerrar={() => setVentana(null)} />}
      {ventana?.tipo === 'editar' && (
        <ModalEditarCuenta
          cuenta={ventana.cuenta}
          esYo={ventana.cuenta.id === yo?.id}
          onCerrar={() => setVentana(null)}
          onGuardada={(c) => {
            setVentana(null);
            avisos.ok(`Guardaste los cambios de ${c.nombre}.`);
            recargar();
          }}
        />
      )}
      {ventana?.tipo === 'restablecer' && (
        <Confirmar
          titulo="Restablecer contraseña"
          mensaje={<p>Se genera una contraseña temporal para {ventana.cuenta.nombre} y se cierran sus sesiones abiertas. Tendrá que elegir una nueva al entrar.</p>}
          textoConfirmar="Restablecer"
          onCerrar={() => setVentana(null)}
          onConfirmar={async () => {
            const r = await api<{ claveTemporal: string }>(`/admin/usuarios/${ventana.cuenta.id}/restablecer-clave`, { metodo: 'POST' });
            setVentana({ tipo: 'clave', usuario: ventana.cuenta.usuario, clave: r.claveTemporal, motivo: 'restablecida' });
            recargar();
          }}
        />
      )}
      {ventana?.tipo === 'desactivar' && (
        <Confirmar
          titulo="Desactivar cuenta"
          mensaje={<p>{ventana.cuenta.nombre} no podrá ingresar y se cierran sus sesiones abiertas. Sus datos se conservan y puedes activarla de nuevo cuando quieras.</p>}
          textoConfirmar="Desactivar"
          peligro
          onCerrar={() => setVentana(null)}
          onConfirmar={async () => {
            await api(`/admin/usuarios/${ventana.cuenta.id}`, { metodo: 'PATCH', cuerpo: { activo: false } });
            avisos.ok(`Desactivaste la cuenta de ${ventana.cuenta.nombre}.`);
            recargar();
          }}
        />
      )}
      {ventana?.tipo === 'eliminar' && (
        <Confirmar
          titulo="Eliminar cuenta"
          mensaje={<p>Vas a eliminar la cuenta de {ventana.cuenta.nombre} ({ventana.cuenta.usuario}). No se puede deshacer. Si solo quieres que no entre, mejor desactívala.</p>}
          textoConfirmar="Eliminar cuenta"
          peligro
          onCerrar={() => setVentana(null)}
          onConfirmar={async () => {
            await api(`/admin/usuarios/${ventana.cuenta.id}`, { metodo: 'DELETE' });
            avisos.ok(`Eliminaste la cuenta de ${ventana.cuenta.nombre}.`);
            recargar();
          }}
        />
      )}
      {ventana?.tipo === 'clave' && <ModalClaveTemporal usuario={ventana.usuario} clave={ventana.clave} motivo={ventana.motivo} onCerrar={() => setVentana(null)} />}
    </>
  );
}
