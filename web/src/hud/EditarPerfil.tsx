import { UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EditorFotoPerfil } from '../componentes/EditorFotoPerfil';
import { Modal } from '../componentes/Modal';
import { useSesion } from '../estado/sesion';

/**
 * «Editar perfil» desde el HUD, como en Gather: la foto de perfil (ícono en listas y tarjetas) y el avatar (tu personaje del mapa)
 * van por separado. El nombre y el cargo los cambia la administración; el resto está en Mi cuenta.
 */
export function EditarPerfil({ alCerrar, alAvatar }: { alCerrar: () => void; alAvatar: () => void }) {
  const { usuario } = useSesion();
  return (
    <Modal titulo="Editar perfil" descripcion={usuario ? `${usuario.nombre}. Tu nombre y tu cargo los cambia la administración.` : undefined} onCerrar={alCerrar} ancho>
      <section className="hd-perfil__seccion" aria-labelledby="hd-perfil-foto">
        <h3 id="hd-perfil-foto" className="sub">
          Foto de perfil
        </h3>
        <p className="campo__ayuda">Es tu ícono en la lista de personas, tu tarjeta, las búsquedas y el Planner. En el mapa sigue viéndose tu personaje.</p>
        <EditorFotoPerfil />
      </section>
      <section className="hd-perfil__seccion" aria-labelledby="hd-perfil-avatar">
        <h3 id="hd-perfil-avatar" className="sub">
          Avatar
        </h3>
        <p className="campo__ayuda">Tu personaje del mapa: pelo, ropa y accesorios.</p>
        <button type="button" className="btn btn--secundario" onClick={alAvatar}>
          <UserRound aria-hidden="true" size={16} />
          <span>Cambiar mi avatar</span>
        </button>
      </section>
      <p className="campo__ayuda">
        Zona horaria, contraseña y demás datos: <Link to="/cuenta" onClick={alCerrar}>Mi cuenta</Link>.
      </p>
    </Modal>
  );
}
