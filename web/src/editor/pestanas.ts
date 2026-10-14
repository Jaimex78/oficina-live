import type { Herramienta } from '../mundo/tipos';
import type { ControladorEditor } from './controlador';

export type Pestana = 'salas' | 'objetos' | 'pisos' | 'zonas' | 'areas' | 'llegadas' | 'revision';

/** La pestaña que le corresponde a cada herramienta (las demás, como seleccionar o borrar, valen en cualquier pestaña). */
export const PESTANA_DE_HERRAMIENTA: Partial<Record<Herramienta, Pestana>> = {
  objeto: 'objetos',
  piso: 'pisos',
  zona: 'zonas',
  area: 'areas',
  habitacion: 'salas',
  llegada: 'llegadas',
};

/**
 * Se llama antes de mostrar otra pestaña. Cambiar de pestaña siempre funciona: lo que esté a medias se cierra
 * (lo ya pintado o movido se queda) y la herramienta que pertenece a otra pestaña se suelta.
 */
export function prepararCambioDePestana(ctl: ControladorEditor, destino: Pestana): void {
  const propia = PESTANA_DE_HERRAMIENTA[ctl.estado.herramienta];
  if (propia && propia !== destino) ctl.elegirHerramienta('seleccionar');
  else ctl.cerrarEnCurso();
}
