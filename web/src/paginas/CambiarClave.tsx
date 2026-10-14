import { useRef, useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import type { RespuestaSesion } from '@ol/shared';
import { ErrorApi, api } from '../api';
import { CampoClave } from '../componentes/CampoClave';
import { Caja } from '../componentes/Estados';
import { BotonLuces } from '../componentes/InterruptorLuces';
import { MarcaLive } from '../componentes/MarcaLive';
import { useMarca } from '../estado/marca';
import { useSesion } from '../estado/sesion';
import { useLucesInteractivas } from '../hooks/useLucesInteractivas';

/** Primer ingreso o clave restablecida: hay que elegir una contraseña propia antes de entrar. */
export default function CambiarClave() {
  const { usuario, cargando, reemplazarSesion, salir } = useSesion();
  const { paletaLuces } = useMarca();
  const navigate = useNavigate();
  const panel = useRef<HTMLDivElement>(null);
  useLucesInteractivas(panel, paletaLuces);

  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [repite, setRepite] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  if (cargando) return null;
  if (!usuario) return <Navigate to="/ingreso" replace />;

  const guardar = async (e: FormEvent) => {
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
      navigate('/', { replace: true });
    } catch (x) {
      setError(x instanceof ErrorApi ? x.message : 'No se pudo cambiar la contraseña. Intenta de nuevo.');
      setEnviando(false);
    }
  };

  return (
    <div className="ingreso">
      <div className="ingreso__luces">
        <BotonLuces />
      </div>
      <div className="ing-caja">
        <form className="ing-form entrar" onSubmit={guardar} noValidate>
          <h1>Elige tu contraseña</h1>
          <p className="ing-form__sub">
            {usuario.nombre.split(' ')[0]}, es tu primer ingreso o una persona administradora restableció tu clave. Usa mayúsculas, minúsculas y al menos un número.
          </p>
          <CampoClave etiqueta="Contraseña actual (la temporal)" value={actual} onChange={(e) => setActual(e.target.value)} autoComplete="current-password" data-autofoco="" />
          <CampoClave etiqueta="Contraseña nueva" value={nueva} onChange={(e) => setNueva(e.target.value)} autoComplete="new-password" />
          <CampoClave etiqueta="Repite la contraseña nueva" value={repite} onChange={(e) => setRepite(e.target.value)} autoComplete="new-password" />
          <div className="ing-form__error">{error && <Caja tono="error">{error}</Caja>}</div>
          <button type="submit" className={`btn btn--primario btn--bloque${enviando ? ' btn--cargando' : ''}`} disabled={enviando}>
            <span>Guardar y entrar</span>
          </button>
          <p className="ing-form__ayuda">
            ¿No eres {usuario.nombre.split(' ')[0]}?{' '}
            <button type="button" className="btn btn--texto btn--chico" onClick={() => void salir()}>
              Cerrar sesión
            </button>
          </p>
        </form>
        <div className="ing-panel" ref={panel} style={{ left: '50%' }}>
          <span className="ing-panel__luz" aria-hidden="true" />
          <div className="ing-panel__logo">
            <MarcaLive altura={34} sobreOscuro />
          </div>
          <div className="par-a">
            <h2>Una contraseña solo tuya</h2>
            <p>Nadie más la conoce. Cada ingreso queda registrado.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
