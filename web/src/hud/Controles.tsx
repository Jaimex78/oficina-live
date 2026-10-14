import { Check, Ellipsis, LocateFixed, Map as IconoMapa, Minus, Plus, Send } from 'lucide-react';
import { useRef, useState } from 'react';
import { useMenu } from './menu';
import type { ModoVista } from './tipos';

const MINIATURA: Record<ModoVista, React.ReactNode> = {
  simplificado: (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <rect width="48" height="48" fill="#cfeed8" />
      <rect x="6" y="14" width="36" height="22" fill="#fff" />
      <rect x="6" y="6" width="10" height="8" fill="#dfe3ea" />
      <rect x="18" y="6" width="10" height="8" fill="#dfe3ea" />
      <rect x="30" y="6" width="12" height="8" fill="#dfe3ea" />
      <rect x="10" y="19" width="12" height="9" fill="#eef0f5" />
      <rect x="26" y="19" width="12" height="9" fill="#fbe4ef" />
      <rect x="6" y="36" width="12" height="6" fill="#dde3ff" />
      <rect x="30" y="36" width="12" height="6" fill="#dde3ff" />
    </svg>
  ),
  inmersivo: (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <rect width="48" height="48" fill="#cfe3b8" />
      <rect x="4" y="10" width="40" height="30" fill="#e8c99a" />
      <rect x="8" y="14" width="14" height="10" fill="#8a82d6" />
      <rect x="10" y="16" width="4" height="3" fill="#fff" />
      <rect x="16" y="16" width="4" height="3" fill="#fff" />
      <rect x="28" y="14" width="12" height="8" fill="#5f7a8f" />
      <rect x="10" y="30" width="10" height="6" fill="#d77a61" />
      <rect x="30" y="28" width="8" height="8" fill="#3f8f5a" />
      <rect x="4" y="10" width="40" height="3" fill="#43506a" />
    </svg>
  ),
  automatico: (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <rect width="48" height="48" fill="#cfe3b8" />
      <rect x="4" y="10" width="40" height="30" fill="#e8c99a" />
      <rect x="8" y="14" width="14" height="10" fill="#8a82d6" />
      <rect x="28" y="14" width="12" height="8" fill="#5f7a8f" />
      <rect x="10" y="30" width="10" height="6" fill="#d77a61" />
      <rect x="4" y="10" width="40" height="3" fill="#43506a" />
    </svg>
  ),
};

const MODOS: { valor: ModoVista; nombre: string }[] = [
  { valor: 'simplificado', nombre: 'Simplificado' },
  { valor: 'inmersivo', nombre: 'Inmersivo' },
  { valor: 'automatico', nombre: 'Automático' },
];

export interface PropsControles {
  zoom: number;
  /** El zoom más lejano útil (lo calcula el motor según la sala y la pantalla) y el más cercano. */
  zoomMin: number;
  zoomMax: number;
  alZoom: (paso: 1 | -1) => void;
  alMiEscritorio: () => void;
  alCentrar: () => void;
  /** Con algo seleccionado va hacia allá; si no, abre la búsqueda en «Ir a...». */
  etiquetaIr: string;
  alIr: () => void;
  minimapa: boolean;
  alMinimapa: () => void;
  vista: ModoVista;
  alVista: (v: ModoVista) => void;
}

/** Los controles sueltos de la derecha: mi escritorio, ir a, y la píldora oscura de zoom, mapa pequeño y vista. */
export function Controles(p: PropsControles) {
  const [menu, setMenu] = useState(false);
  const boton = useRef<HTMLButtonElement>(null);
  const lista = useMenu<HTMLDivElement>(menu, () => setMenu(false), { disparador: boton });

  return (
    <div className="hd-controles">
      <button type="button" className="hd-suelto" onClick={p.alMiEscritorio} aria-label="Ir a mi escritorio" title="Ir a mi escritorio">
        <EscritorioIcono />
      </button>
      <button type="button" className="hd-suelto" onClick={p.alCentrar} aria-label="Centrar en mi personaje" title="Centrar en mi personaje">
        <LocateFixed aria-hidden="true" />
      </button>
      <button type="button" className="hd-suelto" onClick={p.alIr} aria-label={p.etiquetaIr} title={p.etiquetaIr}>
        <Send aria-hidden="true" />
      </button>
      <div className="hd-pildora" role="group" aria-label="Zoom y vista">
        <button type="button" onClick={() => p.alZoom(1)} disabled={p.zoom >= p.zoomMax - 1e-9} aria-label="Acercar" title="Acercar">
          <Plus aria-hidden="true" />
        </button>
        <button type="button" onClick={() => p.alZoom(-1)} disabled={p.zoom <= p.zoomMin + 1e-9} aria-label="Alejar" title="Alejar">
          <Minus aria-hidden="true" />
        </button>
        <button type="button" className="hd-pildora__mapa" onClick={p.alMinimapa} aria-pressed={p.minimapa} aria-label="Mapa pequeño" title="Mapa pequeño">
          <IconoMapa aria-hidden="true" />
        </button>
        <button ref={boton} type="button" onClick={() => setMenu((m) => !m)} aria-haspopup="menu" aria-expanded={menu} aria-label="Vista del mundo" title="Vista del mundo">
          <Ellipsis aria-hidden="true" />
        </button>
        {menu && (
          <div ref={lista} className="hd-menu hd-menu--vista" role="menu" aria-label="Vista del mundo">
            {MODOS.map((m) => (
              <button
                key={m.valor}
                type="button"
                role="menuitemradio"
                aria-checked={p.vista === m.valor}
                className="hd-vista"
                onClick={() => {
                  p.alVista(m.valor);
                  setMenu(false);
                }}
              >
                <span className="hd-vista__img">
                  {MINIATURA[m.valor]}
                  {m.valor === 'automatico' && (
                    <span className="hd-vista__marca" aria-hidden="true">
                      <Check />
                    </span>
                  )}
                </span>
                {m.nombre}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EscritorioIcono() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="7" rx="1.5" />
      <path d="M5 11v8M19 11v8M9 15h6" />
    </svg>
  );
}
