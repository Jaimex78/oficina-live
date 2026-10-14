import { Check, Copy } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { DESCRIPCION_ROL, ETIQUETA_ROL, PAQUETES_ACCESO, ROLES, type Rol, type UsuarioAdmin } from '@ol/shared';
import { ErrorApi, api } from '../api';
import { Campo, CampoSeleccion } from './Campo';
import { Caja } from './Estados';
import { Modal } from './Modal';

interface PropsEditar {
  cuenta: UsuarioAdmin;
  esYo: boolean;
  onGuardada: (cuenta: UsuarioAdmin) => void;
  onCerrar: () => void;
}

export const GRUPOS_PAQUETES = [
  { grupo: 'objetos', titulo: 'Objetos' },
  { grupo: 'fiestas', titulo: 'Fiestas del año' },
  { grupo: 'personaje', titulo: 'Personaje' },
] as const;

export function ModalEditarCuenta({ cuenta, esYo, onGuardada, onCerrar }: PropsEditar) {
  const [v, setV] = useState({ nombre: cuenta.nombre, cargo: cuenta.cargo, correo: cuenta.correo, rol: cuenta.rol, acceso: cuenta.acceso });
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      const r = await api<{ usuario: UsuarioAdmin }>(`/admin/usuarios/${cuenta.id}`, { metodo: 'PATCH', cuerpo: v });
      onGuardada(r.usuario);
    } catch (x) {
      setError(x instanceof ErrorApi ? x.message : 'No se pudo guardar. Intenta de nuevo.');
      setEnviando(false);
    }
  };

  return (
    <Modal titulo={`Editar a ${cuenta.nombre}`} descripcion={`Usuario: ${cuenta.usuario}`} onCerrar={onCerrar} bloqueante={enviando}>
      <form onSubmit={guardar} noValidate>
        <Campo etiqueta="Nombre completo" value={v.nombre} onChange={(e) => setV({ ...v, nombre: e.target.value })} autoComplete="off" />
        <div className="campo-fila">
          <Campo etiqueta="Cargo" value={v.cargo} onChange={(e) => setV({ ...v, cargo: e.target.value })} autoComplete="off" />
          <Campo etiqueta="Correo de trabajo" type="email" value={v.correo} onChange={(e) => setV({ ...v, correo: e.target.value })} autoComplete="off" />
        </div>
        <CampoSeleccion
          etiqueta="Rol"
          value={v.rol}
          onChange={(e) => setV({ ...v, rol: e.target.value as Rol })}
          disabled={esYo}
          ayuda={esYo ? 'No puedes cambiar tu propio rol: así siempre queda alguien con administración.' : DESCRIPCION_ROL[v.rol]}
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {ETIQUETA_ROL[r]}
            </option>
          ))}
        </CampoSeleccion>
        <fieldset className="acceso">
          <legend>Qué puede usar de la oficina</legend>
          <p className="campo__ayuda">Todos pueden usar lo básico. Marca lo que quieres darle además: objetos para su área, fiestas, y para su personaje ropa premium, mascotas o disfraces. Se aplica en el acto, también si está conectada.</p>
          {GRUPOS_PAQUETES.map(({ grupo, titulo }) => (
            <div key={grupo} className="acceso__grupo">
              <h4>{titulo}</h4>
              {PAQUETES_ACCESO.filter((p) => p.grupo === grupo).map((p) => (
                <label key={p.id} className="ed-check" title={p.descripcion}>
                  <input type="checkbox" checked={v.acceso.includes(p.id)} onChange={(e) => setV({ ...v, acceso: e.target.checked ? [...v.acceso, p.id] : v.acceso.filter((x) => x !== p.id) })} />
                  <span>
                    {p.nombre}
                    {grupo === 'personaje' && <small className="campo__ayuda acceso__nota">{p.descripcion}</small>}
                  </span>
                </label>
              ))}
            </div>
          ))}
        </fieldset>
        {error && <Caja tono="error">{error}</Caja>}
        <div className="modal__pie">
          <button type="button" className="btn btn--secundario" onClick={onCerrar} disabled={enviando}>
            Cancelar
          </button>
          <button type="submit" className={`btn btn--primario${enviando ? ' btn--cargando' : ''}`} disabled={enviando}>
            <span>Guardar cambios</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}

interface PropsClave {
  usuario: string;
  clave: string;
  motivo: 'creada' | 'restablecida';
  onCerrar: () => void;
}

/** La contraseña temporal se ve una sola vez. Por eso este diálogo no se cierra por accidente. */
export function ModalClaveTemporal({ usuario, clave, motivo, onCerrar }: PropsClave) {
  const [copiada, setCopiada] = useState(false);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(clave);
      setCopiada(true);
      setTimeout(() => setCopiada(false), 2500);
    } catch {
      /* si el navegador no deja copiar, la clave está seleccionable en pantalla */
    }
  };

  return (
    <Modal
      titulo={motivo === 'creada' ? 'Cuenta creada' : 'Contraseña restablecida'}
      descripcion={`Usuario: ${usuario}`}
      onCerrar={onCerrar}
      bloqueante
      pie={
        <button type="button" className="btn btn--primario" onClick={onCerrar} data-autofoco="">
          Listo, ya la guardé
        </button>
      }
    >
      <p className="texto-2" style={{ marginBottom: 'var(--s3)' }}>
        Contraseña temporal. La persona debe cambiarla al entrar.
      </p>
      <div className="clave-temporal">
        <code>{clave}</code>
        <button type="button" className="btn btn--secundario btn--chico" onClick={() => void copiar()}>
          {copiada ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
          {copiada ? 'Copiada' : 'Copiar'}
        </button>
      </div>
      <div style={{ marginTop: 'var(--s4)' }}>
        <Caja tono="aviso">Se muestra una sola vez. Compártela por un canal privado, no por un chat grupal. Si se pierde, restablece la contraseña de nuevo.</Caja>
      </div>
    </Modal>
  );
}
