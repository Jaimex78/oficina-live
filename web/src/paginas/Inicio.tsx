import { Building2, ShieldCheck, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSesion } from '../estado/sesion';

/** Inicio: un saludo y la puerta a la oficina. Entrar a la oficina reproduce el ingreso animado. */
export default function Inicio() {
  const { usuario, tiene } = useSesion();
  if (!usuario) return null;
  const primerNombre = (usuario.apodo || usuario.nombre).split(' ')[0];

  return (
    <section className="inicio">
      <div className="inicio__cuerpo">
        <p className="inicio__saludo">Hola, {primerNombre}</p>
        <h1 className="inicio__titulo">Tu equipo ya está en la oficina</h1>
        <p className="inicio__texto">Entra, camina hasta quien necesitas y habla con voz y video por Teams. Tu personaje te espera en la oficina.</p>
        <Link className="btn btn--primario inicio__entrar" to="/oficina">
          <Building2 aria-hidden="true" />
          <span>Ingresar a la oficina</span>
        </Link>
        <div className="inicio__atajos">
          <Link className="btn btn--secundario btn--chico" to="/cuenta">
            <UserRound aria-hidden="true" />
            <span>Mi cuenta</span>
          </Link>
          {tiene('administrar') && (
            <Link className="btn btn--secundario btn--chico" to="/admin">
              <ShieldCheck aria-hidden="true" />
              <span>Administración</span>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
