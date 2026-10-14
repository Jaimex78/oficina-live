import { Globe, Hammer, Link2, Video, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Zona } from '@ol/shared';
import type { PersonaVista } from '../mundo/vivo';
import { enlaceDeZona } from './enlaces';
import { copiarTexto, esHttps } from './teams';
import type { AccionesTeams } from './useTeams';

/** Lo que dice la tarjeta de la sala: «1 persona» o «3 personas». */
export const textoPersonas = (n: number): string => (n === 1 ? '1 persona' : `${n} personas`);

/**
 * Como en Gather al entrar a una sala de reuniones: arriba a la derecha, una barra con «Objetos interactivos» (solo quienes
 * construyen), «Copiar enlace de la sala» y «Unirse en Teams». El candado vive en la píldora de arriba a la izquierda.
 * Aquí el audio y el video van por Teams: el botón abre la reunión de la sala (si tiene enlace) o, si no, el chat de la sala con quienes
 * están dentro, nombrado como la sala. Si estás solo, avisa en vez de abrir Teams vacío.
 * No hay botón de música: las pistas necesitan derechos y queda pendiente.
 */
export function BarraSala({
  zona,
  personas,
  yoId,
  teams,
  bloqueadaPorOtro,
  puedeConstruir,
  alConstruir,
  alAviso,
}: {
  zona: Zona;
  personas: readonly PersonaVista[];
  yoId: number;
  teams: AccionesTeams;
  /** Otra persona bloqueó la sala: «Unirse en Teams» queda deshabilitado, pero caminar adentro no se impide. */
  bloqueadaPorOtro: boolean;
  puedeConstruir: boolean;
  alConstruir: () => void;
  alAviso: (t: string) => void;
}) {
  const enlace = esHttps(zona.enlaceTeams) ? zona.enlaceTeams : null;
  const hayOtros = personas.some((p) => p.id !== yoId);
  const [objetos, setObjetos] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);

  // El panel de objetos se cierra al salir de la sala, al tocar afuera o con Escape.
  useEffect(() => setObjetos(false), [zona.id]);
  useEffect(() => {
    if (!objetos) return;
    const fuera = (e: PointerEvent) => {
      if (!raiz.current?.contains(e.target as Node)) setObjetos(false);
    };
    const tecla = (e: KeyboardEvent) => e.key === 'Escape' && setObjetos(false);
    document.addEventListener('pointerdown', fuera);
    document.addEventListener('keydown', tecla);
    return () => {
      document.removeEventListener('pointerdown', fuera);
      document.removeEventListener('keydown', tecla);
    };
  }, [objetos]);

  const copiar = async () => {
    const texto = enlace ?? enlaceDeZona(zona.id);
    alAviso((await copiarTexto(texto)) ? 'Copié el enlace de la sala.' : 'No pude copiar el enlace. Cópialo a mano.');
  };

  const unirse = () => {
    if (bloqueadaPorOtro) return;
    if (enlace) return teams.abrirReunion(enlace);
    if (!hayOtros) return alAviso('Estás solo en la sala. Invita a alguien o copia el enlace.');
    void teams.abrir({ tipo: 'chat', sala: zona.id });
  };

  return (
    <div className="hd-sala" ref={raiz} role="toolbar" aria-label={`Sala ${zona.nombre}`}>
      {puedeConstruir && (
        <div className="hd-sala__objetos">
          <button type="button" className="hd-sala__icono" onClick={() => setObjetos((o) => !o)} aria-expanded={objetos} aria-label="Objetos interactivos" title="Objetos interactivos">
            <Globe aria-hidden="true" />
            <span className="hd-sala__mas" aria-hidden="true">
              +
            </span>
          </button>
          {objetos && (
            <div className="hd-sala__pop" role="dialog" aria-label="Objetos interactivos">
              <div className="hd-sala__pop-cab">
                <h2>Objetos interactivos</h2>
                <button type="button" className="hd-sala__icono hd-sala__icono--chico" onClick={() => setObjetos(false)} aria-label="Cerrar" title="Cerrar">
                  <X aria-hidden="true" />
                </button>
              </div>
              <p>Pon en la sala notas, enlaces, mesas de Teams y otros objetos con los que la gente puede hacer algo.</p>
              <button
                type="button"
                className="hd-sala__agregar"
                onClick={() => {
                  setObjetos(false);
                  alConstruir();
                }}
              >
                <Hammer aria-hidden="true" />
                Agregar nuevo
              </button>
            </div>
          )}
        </div>
      )}
      <button type="button" className="hd-sala__icono" onClick={() => void copiar()} aria-label="Copiar enlace de la sala" title="Copiar enlace de la sala">
        <Link2 aria-hidden="true" />
      </button>
      <button
        type="button"
        className="hd-sala__unirse"
        onClick={unirse}
        disabled={bloqueadaPorOtro}
        title={bloqueadaPorOtro ? 'Otra persona bloqueó esta sala' : enlace ? 'Abre la reunión de esta sala en Teams' : `Abre el chat de Teams «${zona.nombre}» con quienes están en la sala`}
      >
        <Video aria-hidden="true" />
        {bloqueadaPorOtro ? 'Sala bloqueada' : 'Unirse en Teams'}
      </button>
    </div>
  );
}

