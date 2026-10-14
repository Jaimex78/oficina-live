import { AlmacenAjustesSonido } from './sonido';
import { MotorSonido } from './sonido-audio';

/** El sonido de la oficina es uno solo por pestaña: el mundo (Phaser) y la interfaz (React) comparten el mismo motor y los mismos ajustes. */
const almacenNavegador = (): Storage | null => {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
};

export const ajustesSonido = new AlmacenAjustesSonido(almacenNavegador());
export const sonido = new MotorSonido(ajustesSonido);

let desenganchar: (() => void) | null = null;
/** Prepara el audio: se crea y se reanuda en el primer gesto (tecla, clic o toque). Es seguro llamarla varias veces. */
export function iniciarSonido(): void {
  if (desenganchar || typeof document === 'undefined') return;
  desenganchar = sonido.engancharGesto(document);
  (window as unknown as { __sonido?: MotorSonido }).__sonido = sonido;
}
