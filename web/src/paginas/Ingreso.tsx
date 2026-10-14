import { Check } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ErrorApi, api } from '../api';
import { Campo, CampoTexto } from '../componentes/Campo';
import { CampoClave } from '../componentes/CampoClave';
import { Caja } from '../componentes/Estados';
import { BotonLuces } from '../componentes/InterruptorLuces';
import { MarcaLive } from '../componentes/MarcaLive';
import { useMarca } from '../estado/marca';
import { useSesion } from '../estado/sesion';
import { useLucesInteractivas } from '../hooks/useLucesInteractivas';

/** Ingreso Cristal: panel oscuro con luces que siguen el puntero y que desliza entre «ingresar» y «solicitar acceso». */
export default function Ingreso() {
  const { usuario, cargando, ingresar, aviso, limpiarAviso } = useSesion();
  const { marca, paletaLuces } = useMarca();
  const navigate = useNavigate();
  const [pide, setPide] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  useLucesInteractivas(panel, paletaLuces);

  const [nombre, setNombre] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const campoClave = useRef<HTMLInputElement>(null);

  const [sol, setSol] = useState({ nombre: '', correo: '', cargo: '', mensaje: '' });
  const [solError, setSolError] = useState<string | null>(null);
  const [solEnviando, setSolEnviando] = useState(false);
  const [solHecha, setSolHecha] = useState(false);

  useEffect(() => {
    if (cargando) return;
    document.getElementById(pide ? 'sol-nombre' : 'ing-usuario')?.focus({ preventScroll: true });
  }, [pide, cargando]);

  if (!cargando && usuario) return <Navigate to={usuario.debeCambiarClave ? '/cambiar-clave' : '/'} replace />;

  const alIngresar = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!nombre.trim() || !clave) {
      setError(!nombre.trim() ? 'Escribe tu correo o usuario.' : 'Escribe tu contraseña.');
      return;
    }
    setEnviando(true);
    limpiarAviso();
    try {
      const u = await ingresar(nombre, clave);
      navigate(u.debeCambiarClave ? '/cambiar-clave' : '/', { replace: true });
    } catch (x) {
      setError(x instanceof ErrorApi ? x.message : 'No se pudo ingresar. Intenta de nuevo.');
      setClave('');
      campoClave.current?.focus();
      setEnviando(false);
    }
  };

  const alSolicitar = async (e: FormEvent) => {
    e.preventDefault();
    setSolError(null);
    setSolEnviando(true);
    try {
      await api('/solicitudes', { metodo: 'POST', cuerpo: sol, sinCierreDeSesion: true });
      setSolHecha(true);
    } catch (x) {
      setSolError(x instanceof ErrorApi ? x.message : 'No se pudo enviar la solicitud. Intenta de nuevo.');
    } finally {
      setSolEnviando(false);
    }
  };

  const puedePedir = marca.solicitudesActivas;

  return (
    <div className="ingreso">
      <div className="ingreso__luces">
        <BotonLuces />
      </div>
      <div className={`ing-caja${pide ? ' pide' : ''}`}>
        <form className="ing-form entrar" onSubmit={alIngresar} noValidate inert={pide} aria-label="Ingresar">
          <h1>Ingresa a {marca.nombre}</h1>
          <p className="ing-form__sub">Usa tu correo de la organización y tu contraseña. ¿Primera vez? Abre el enlace que te dio la administración. Cada ingreso queda registrado.</p>
          {aviso && (
            <div className="ing-aviso">
              <Caja tono="aviso">{aviso}</Caja>
            </div>
          )}
          <Campo id="ing-usuario" etiqueta="Correo o usuario" value={nombre} onChange={(e) => setNombre(e.target.value)} autoComplete="username" autoCapitalize="none" spellCheck={false} />
          <CampoClave id="ing-clave" ref={campoClave} etiqueta="Contraseña" value={clave} onChange={(e) => setClave(e.target.value)} autoComplete="current-password" />
          <div className="ing-form__error">{error && <Caja tono="error">{error}</Caja>}</div>
          <button type="submit" className={`btn btn--primario btn--bloque${enviando ? ' btn--cargando' : ''}`} disabled={enviando}>
            <span>Iniciar sesión</span>
          </button>
          <p className="ing-form__ayuda">¿Olvidaste la contraseña? Pídele a una persona administradora que la restablezca.</p>
        </form>

        <form className="ing-form pedir" onSubmit={alSolicitar} noValidate inert={!pide} aria-label="Solicitar acceso">
          {solHecha ? (
            <div className="ing-hecho">
              <div className="ing-hecho__marca">
                <Check aria-hidden="true" />
              </div>
              <h1>Solicitud enviada</h1>
              <p className="ing-form__sub">Una persona administradora la revisará y te escribirá a tu correo cuando tu acceso esté listo.</p>
              <button type="button" className="btn btn--secundario" onClick={() => setPide(false)}>
                Volver a ingresar
              </button>
            </div>
          ) : (
            <>
              <h1>Solicita acceso</h1>
              <p className="ing-form__sub">Cuéntanos quién eres. Una persona administradora te responde por correo.</p>
              <Campo id="sol-nombre" etiqueta="Nombre completo" value={sol.nombre} onChange={(e) => setSol({ ...sol, nombre: e.target.value })} autoComplete="name" />
              <Campo etiqueta="Correo de trabajo" type="email" value={sol.correo} onChange={(e) => setSol({ ...sol, correo: e.target.value })} autoComplete="email" ayuda="Es el mismo que usas en Teams." />
              <Campo etiqueta="Cargo o equipo (opcional)" value={sol.cargo} onChange={(e) => setSol({ ...sol, cargo: e.target.value })} autoComplete="organization-title" />
              <CampoTexto etiqueta="¿Algo que debamos saber? (opcional)" rows={2} value={sol.mensaje} onChange={(e) => setSol({ ...sol, mensaje: e.target.value })} />
              <div className="ing-form__error">{solError && <Caja tono="error">{solError}</Caja>}</div>
              <button type="submit" className={`btn btn--primario btn--bloque${solEnviando ? ' btn--cargando' : ''}`} disabled={solEnviando}>
                <span>Enviar solicitud</span>
              </button>
            </>
          )}
        </form>

        <div className="ing-panel" ref={panel}>
          <img className="ing-panel__edificio" src="/assets/ingreso/fachada-naos-solo-edificio-noche.png" alt="" aria-hidden="true" draggable={false} />
          <span className="ing-panel__luz" aria-hidden="true" />
          <div className="ing-panel__logo">
            <MarcaLive altura={34} sobreOscuro />
          </div>
          <div className="par-a">
            <h2>Hola de nuevo</h2>
            <p>Tu oficina, estés donde estés.</p>
            {puedePedir && (
              <button type="button" className="btn" onClick={() => setPide(true)}>
                Solicitar acceso
              </button>
            )}
          </div>
          <div className="par-b">
            <h2>¿Ya tienes cuenta?</h2>
            <p>Entra con tu usuario y contraseña.</p>
            <button type="button" className="btn" onClick={() => setPide(false)}>
              Ingresar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
