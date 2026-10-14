import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { useFotoUrl } from '../hooks/useFotoUrl';
import { pastel } from '../hud/estados';
import { inicialDeNombre } from '../util/foto';

export interface PropsFotoPersona {
  id: number;
  nombre: string;
  /** Versión de su foto de perfil. 0 o ausente: no tiene. */
  foto?: number | null | undefined;
  /** Lado del círculo en píxeles. Si no se da, lo decide la clase que se pase. */
  tam?: number;
  className?: string;
  style?: CSSProperties;
  /**
   * Lo que se ve cuando no hay foto o no cargó. Por defecto, la inicial sobre un color estable de la persona.
   * Los lugares que ya mostraban el rostro de su personaje pasan aquí ese rostro: foto > rostro > inicial.
   */
  alternativa?: ReactNode;
  /** Un punto u otra marca que se pinta encima (por ejemplo, el estado). */
  children?: ReactNode;
  /** Si es true, el círculo es decorativo (el nombre ya está escrito al lado). */
  decorativa?: boolean;
  /** Texto que aparece al pasar el cursor. */
  titulo?: string;
  /** false: no pinta el color de fondo de la persona (lo pone la clase que se pase). */
  colorFondo?: boolean;
}

/**
 * El ícono de una persona: su foto de perfil si la tiene; si no, lo que se pida (el rostro de su personaje) o su inicial.
 * La foto es solo un ícono de las listas, tarjetas y menús. No se usa dentro del mundo (Phaser).
 */
export function FotoPersona({ id, nombre, foto, tam, className, style, alternativa, children, decorativa = false, colorFondo = true, titulo }: PropsFotoPersona) {
  const url = useFotoUrl(id, foto);
  const [falla, setFalla] = useState(false);
  useEffect(() => setFalla(false), [url]);
  const hayFoto = url !== null && !falla;

  const medidas: CSSProperties = tam ? { width: tam, height: tam, fontSize: Math.max(10, Math.round(tam * 0.4)) } : {};
  return (
    <span
      className={`foto-persona${hayFoto ? ' foto-persona--con-foto' : ''}${className ? ` ${className}` : ''}`}
      style={{ ...(colorFondo ? { background: pastel(id) } : {}), ...medidas, ...style }}
      {...(titulo ? { title: titulo } : {})}
      {...(decorativa ? { 'aria-hidden': true } : { role: 'img', 'aria-label': nombre })}
    >
      {alternativa ?? <span className="foto-persona__inicial">{inicialDeNombre(nombre)}</span>}
      {hayFoto && <img className="foto-persona__img" src={url} alt="" loading="lazy" decoding="async" draggable={false} onError={() => setFalla(true)} />}
      {children}
    </span>
  );
}
