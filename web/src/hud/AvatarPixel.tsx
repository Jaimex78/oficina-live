import { useEffect, useRef } from 'react';
import { claveAvatar, type AvatarSpec, type EstadoPresencia } from '@ol/shared';
import { FotoPersona } from '../componentes/FotoPersona';
import type { FuenteAvatares } from '../mundo/avatar';

export interface PersonaMin {
  id: number;
  nombre: string;
  avatar: AvatarSpec | null;
  /** Versión de su foto de perfil (0 o ausente: no tiene). */
  foto?: number | undefined;
}

/** Recorte de la hoja del personaje: cabeza y hombros, de frente, en pixel art real (sin suavizar). */
const RECORTE = { x: 4, y: 24, w: 24, h: 24 };
const ESCALA = 3;

/**
 * El ícono de una persona: su foto de perfil si la tiene; si no, el rostro de su personaje del mundo.
 * Con el punto de estado si se pide. La foto solo vive aquí, en el HUD: el personaje del mapa no cambia.
 */
export function AvatarPixel({ avatares, persona, tam = 36, estado }: { avatares: FuenteAvatares; persona: PersonaMin; tam?: number; estado?: EstadoPresencia }) {
  const lienzo = useRef<HTMLCanvasElement>(null);
  const llave = persona.avatar ? claveAvatar(persona.avatar) : `s${persona.id}`;

  useEffect(() => {
    const c = lienzo.current;
    if (!c) return;
    const g = c.getContext('2d');
    if (!g) return;
    g.imageSmoothingEnabled = false;
    g.clearRect(0, 0, c.width, c.height);
    try {
      const hoja = avatares.hoja(persona.avatar, persona.id);
      g.drawImage(hoja, RECORTE.x, RECORTE.y, RECORTE.w, RECORTE.h, 0, 0, RECORTE.w * ESCALA, RECORTE.h * ESCALA);
    } catch {
      /* si la hoja todavía no está, queda el color de fondo */
    }
    // `avatares` y `persona.avatar` cambian de identidad sin cambiar de contenido: `llave` es lo que importa.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [llave, avatares]);

  return (
    <FotoPersona
      id={persona.id}
      nombre={persona.nombre}
      foto={persona.foto}
      className="hd-avatar"
      style={{ width: tam, height: tam }}
      alternativa={<canvas ref={lienzo} width={RECORTE.w * ESCALA} height={RECORTE.h * ESCALA} aria-hidden="true" />}
    >
      {estado && <span className="hd-punto hd-avatar__punto" data-estado={estado} aria-hidden="true" />}
    </FotoPersona>
  );
}
