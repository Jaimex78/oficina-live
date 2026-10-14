import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import type { RespuestaSesion } from '@ol/shared';
import { ErrorApi, api } from '../api';
import { Campo } from '../componentes/Campo';
import { CampoClave } from '../componentes/CampoClave';
import { Caja, Cargando } from '../componentes/Estados';
import { BotonLuces } from '../componentes/InterruptorLuces';
import { MarcaLive } from '../componentes/MarcaLive';
import { ReglasClave, reglasDeClave } from '../componentes/ReglasClave';
import { useMarca } from '../estado/marca';
import { useSesion } from '../estado/sesion';
import { useLucesInteractivas } from '../hooks/useLucesInteractivas';

type Estado = { fase: 'comprobando' } | { fase: 'listo'; nombre: string; correo: string } | { fase: 'invalido'; mensaje: string };

/** Ingreso en modo «Crea tu contraseña»: se llega con el enlace de activación (un solo uso) que da la administración. */
export default function Activar() {
  const { reemplazarSesion } = useSesion();
  const { marca, paletaLuces } = useMarca();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  // El enlace se lee una vez y se borra de la barra de direcciones: no queda en el historial del navegador.
  const token = useRef(params.get('token') ?? '').current;
  const panel = useRef<HTMLDivElement>(null);
  useLucesInteractivas(panel, paletaLuces);

  const [estado, setEstado] = useState<Estado>({ fase: 'comprobando' });
  const [clave, setClave] = useState('');
  const [repite, setRepite] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    window.history.replaceState(null, '', '/activar');
    if (!token) {
      setEstado({ fase: 'invalido', mensaje: 'Este enlace no es válido o ya venció. Pídele uno nuevo a una persona administradora.' });
      return;
    }
    let vigente = true;
    api<{ nombre: string; correo: string }>('/auth/activacion/consultar', { metodo: 'POST', cuerpo: { token }, sinCierreDeSesion: true })
      .then((r) => vigente && setEstado({ fase: 'listo', ...r }))
      .catch((x) => vigente && setEstado({ fase: 'invalido', mensaje: x instanceof ErrorApi ? x.message : 'No se pudo comprobar el enlace. Intenta de nuevo.' }));
    return () => {
      vigente = false;
    };
  }, [token]);

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!reglasDeClave(clave, marca.claveMin).every((r) => r.cumple)) {
      setError('La contraseña todavía no cumple las reglas.');
      return;
    }
    if (clave !== repite) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setEnviando(true);
    try {
      const r = await api<RespuestaSesion>('/auth/activacion', { metodo: 'POST', cuerpo: { token, clave }, sinCierreDeSesion: true });
      reemplazarSesion(r);
      navigate('/', { replace: true }); // sigue el flujo de siempre: creador de personaje y luego la oficina
    } catch (x) {
      setError(x instanceof ErrorApi ? x.message : 'No se pudo crear la contraseña. Intenta de nuevo.');
      setEnviando(false);
    }
  };

  return (
    <div className="ingreso">
      <div className="ingreso__luces">
        <BotonLuces />
      </div>
      <div className="ing-caja">
        <form className="ing-form entrar" onSubmit={guardar} noValidate aria-label="Crea tu contraseña">
          {estado.fase === 'comprobando' && <Cargando texto="Comprobando tu enlace…" />}
          {estado.fase === 'invalido' && (
            <>
              <h1>Enlace no disponible</h1>
              <div className="ing-form__error">
                <Caja tono="error">{estado.mensaje}</Caja>
              </div>
              <Link to="/ingreso" className="btn btn--secundario btn--bloque">
                Ir a ingresar
              </Link>
            </>
          )}
          {estado.fase === 'listo' && (
            <>
              <h1>Crea tu contraseña</h1>
              <p className="ing-form__sub">
                {estado.nombre.split(' ')[0]}, esta será tu entrada a {marca.nombre}. Después podrás ingresar con tu correo y esta contraseña.
              </p>
              <Campo etiqueta="Correo" value={estado.correo} readOnly autoComplete="username" />
              <CampoClave etiqueta="Contraseña" value={clave} onChange={(e) => setClave(e.target.value)} autoComplete="new-password" data-autofoco="" />
              <ReglasClave clave={clave} minimo={marca.claveMin} />
              <CampoClave etiqueta="Repite la contraseña" value={repite} onChange={(e) => setRepite(e.target.value)} autoComplete="new-password" />
              <div className="ing-form__error">{error && <Caja tono="error">{error}</Caja>}</div>
              <button type="submit" className={`btn btn--primario btn--bloque${enviando ? ' btn--cargando' : ''}`} disabled={enviando}>
                <span>Crear contraseña y entrar</span>
              </button>
              <p className="ing-form__ayuda">El enlace sirve una sola vez. Si algo falla, pídele uno nuevo a una persona administradora.</p>
            </>
          )}
        </form>
        <div className="ing-panel" ref={panel} style={{ left: '50%' }}>
          <span className="ing-panel__luz" aria-hidden="true" />
          <div className="ing-panel__logo">
            <MarcaLive altura={34} sobreOscuro />
          </div>
          <div className="par-a">
            <h2>Bienvenido</h2>
            <p>Tu oficina, estés donde estés.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
