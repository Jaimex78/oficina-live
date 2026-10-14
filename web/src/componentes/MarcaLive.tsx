import type { CSSProperties } from 'react';
import { useMarca } from '../estado/marca';

/**
 * Marca pixel art de la plataforma: una casita hecha con cuadrados (un 3 x 3 con la puerta vacía).
 * Usa el color primario de la plataforma, así que sirve sobre fondo claro y oscuro.
 */
export function MarcaIcono({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 11 11" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
      <g fill="var(--primario)">
        <rect x="4" y="0" width="3" height="3" />
        <rect x="0" y="4" width="3" height="3" />
        <rect x="4" y="4" width="3" height="3" />
        <rect x="8" y="4" width="3" height="3" />
        <rect x="0" y="8" width="3" height="3" />
        <rect x="8" y="8" width="3" height="3" />
      </g>
    </svg>
  );
}

/**
 * Logotipo de la plataforma: la marca pixel art y a su derecha el nombre en Inter Bold.
 * Sobre fondos claros el texto va en tinta; sobre oscuros (`sobreOscuro` o tema oscuro), en blanco.
 */
export function MarcaLive({ altura = 30, sobreOscuro = false }: { altura?: number; sobreOscuro?: boolean }) {
  const { marca } = useMarca();
  const estilo = { '--h': `${altura}px` } as CSSProperties;
  return (
    <span className={`marca${sobreOscuro ? ' marca--sobre-oscuro' : ''}`} style={estilo} role="img" aria-label={marca.nombre}>
      <MarcaIcono className="marca__icono" />
      <span className="marca__nombre" aria-hidden="true">
        {marca.nombre}
      </span>
    </span>
  );
}
