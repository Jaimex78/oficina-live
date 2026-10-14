import { HudRaiz, type PropsHud } from '../hud/HudRaiz';

/**
 * La interfaz que flota sobre el mundo cuando caminas. Todo vive en `web/src/hud/`: riel y panel de la izquierda,
 * barra oscura de abajo, controles y mapa pequeño, tarjetas y avisos. Este archivo solo la conecta con la página.
 */
export function HudMundo(props: PropsHud) {
  return <HudRaiz {...props} />;
}
