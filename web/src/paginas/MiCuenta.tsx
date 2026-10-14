import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { DESCRIPCION_ROL, ETIQUETA_ROL, type RespuestaSesion } from '@ol/shared';
import { ErrorApi, api } from '../api';
import { useAvisos } from '../componentes/Avisos';
import { CampoClave } from '../componentes/CampoClave';
import { EditorFotoPerfil } from '../componentes/EditorFotoPerfil';
import { Caja, Iniciales, Insignia } from '../componentes/Estados';
import { InterruptorLuces, descripcionLuces } from '../componentes/InterruptorLuces';
import { useSesion } from '../estado/sesion';
import { useTema } from '../estado/tema';
import { formatoFechaHora } from '../util/formato';

export default function MiCuenta() {
  const { usuario, reemplazarSesion, salir } = useSesion();
  const { preferencia } = useTema();
  const avisos = useAvisos();
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [repite, setRepite] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  if (!usuario) return null;

  const cambiar = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (nueva !== repite) {
      setError('Las contraseñas nuevas no coinciden.');
      return;
    }
    setEnviando(true);
    try {
      const r = await api<RespuestaSesion>('/auth/cambiar-clave', { metodo: 'POST', cuerpo: { actual, nueva } });
      reemplazarSesion(r);
      setActual('');
      setNueva('');
      setRepite('');
      avisos.ok('Cambiaste tu contraseña. Se cerraron tus otras sesiones.');
    } catch (x) {
      setError(x instanceof ErrorApi ? x.message : 'No se pudo cambiar la contraseña. Intenta de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      <header className="pagina-cab">
        <h1 className="titulo">Mi cuenta</h1>
      </header>

      <section className="panel" aria-labelledby="t-perfil">
        <div className="panel__cab">
          <div style={{ display: 'flex', gap: 'var(--s4)', alignItems: 'center' }}>
            <Iniciales nombre={usuario.nombre} grande id={usuario.id} foto={usuario.foto} />
            <div>
              <h2 id="t-perfil" className="sub">
                {usuario.nombre}
              </h2>
              <p>{usuario.cargo || 'Sin cargo registrado'}</p>
            </div>
          </div>
          <Insignia tono="acento">{ETIQUETA_ROL[usuario.rol]}</Insignia>
        </div>
        <dl className="datos">
          <dt>Usuario</dt>
          <dd>{usuario.usuario}</dd>
          <dt>Correo</dt>
          <dd>{usuario.correo || 'Sin correo. Pídele a la administración que lo agregue para usar Teams.'}</dd>
          <dt>Rol</dt>
          <dd>{DESCRIPCION_ROL[usuario.rol]}</dd>
          <dt>Último ingreso</dt>
          <dd>{formatoFechaHora(usuario.ultimoIngreso)}</dd>
          <dt>Cuenta creada</dt>
          <dd>{formatoFechaHora(usuario.creadoEn)}</dd>
        </dl>
        <p className="campo__ayuda" style={{ marginTop: 'var(--s4)' }}>
          Tu nombre, cargo y correo los cambia la administración.
        </p>
      </section>

      <section className="panel" aria-labelledby="t-foto">
        <div className="panel__cab">
          <div>
            <h2 id="t-foto" className="sub">
              Foto de perfil
            </h2>
            <p>Tu foto aparece como ícono tuyo en la lista de personas, tu tarjeta, las búsquedas y el Planner.</p>
          </div>
        </div>
        <EditorFotoPerfil />
      </section>

      <section className="panel" aria-labelledby="t-personaje">
        <div className="panel__cab">
          <div>
            <h2 id="t-personaje" className="sub">
              Tu personaje
            </h2>
            <p>Cambia tu pelo, tu ropa y tus accesorios. Los disfraces se activan en las fechas de cada fiesta.</p>
          </div>
          <Link className="btn btn--secundario" to="/personaje">
            Cambiar mi personaje
          </Link>
        </div>
      </section>

      <section className="panel" aria-labelledby="t-luces">
        <div className="panel__cab">
          <div>
            <h2 id="t-luces" className="sub">
              Luces
            </h2>
            <p>{descripcionLuces(preferencia)}</p>
          </div>
          <InterruptorLuces />
        </div>
        <p className="campo__ayuda">Solo cambia cómo ves la plataforma en este navegador.</p>
      </section>

      <section className="panel" aria-labelledby="t-clave">
        <div className="panel__cab">
          <div>
            <h2 id="t-clave" className="sub">
              Contraseña
            </h2>
            <p>Mayúsculas, minúsculas y al menos un número. Al cambiarla se cierran tus otras sesiones.</p>
          </div>
        </div>
        <form onSubmit={cambiar} noValidate style={{ maxWidth: 420 }}>
          <CampoClave etiqueta="Contraseña actual" value={actual} onChange={(e) => setActual(e.target.value)} autoComplete="current-password" />
          <CampoClave etiqueta="Contraseña nueva" value={nueva} onChange={(e) => setNueva(e.target.value)} autoComplete="new-password" />
          <CampoClave etiqueta="Repite la contraseña nueva" value={repite} onChange={(e) => setRepite(e.target.value)} autoComplete="new-password" />
          {error && <Caja tono="error">{error}</Caja>}
          <div style={{ marginTop: 'var(--s4)' }}>
            <button type="submit" className={`btn btn--primario${enviando ? ' btn--cargando' : ''}`} disabled={enviando || !actual || !nueva || !repite}>
              <span>Cambiar contraseña</span>
            </button>
          </div>
        </form>
      </section>

      <section className="panel" aria-labelledby="t-sesion">
        <div className="panel__cab">
          <div>
            <h2 id="t-sesion" className="sub">
              Sesión
            </h2>
            <p>Cierra tu sesión en este dispositivo.</p>
          </div>
          <button type="button" className="btn btn--secundario" onClick={() => void salir()}>
            Cerrar sesión
          </button>
        </div>
      </section>
    </>
  );
}
