import type { EstadoPresencia, Lugar } from '@ol/shared';

/** Las palabras de Gather para los estados que ya existen en el servidor. Ocupado = concentrado. */
export const TEXTO_ESTADO: Record<EstadoPresencia, string> = {
  disponible: 'Activo',
  concentrado: 'Ocupado',
  reunion: 'En reunión',
  ausente: 'Ausente',
};

/** Fichas del menú de estado, en el orden de Gather. */
export const FICHAS_ESTADO: { estado: EstadoPresencia; texto: string }[] = [
  { estado: 'disponible', texto: 'Activo' },
  { estado: 'concentrado', texto: 'Ocupado' },
  { estado: 'ausente', texto: 'Ausente' },
];

export const TEXTO_LUGAR: Record<Lugar, string> = { '': '', naos: 'En el Naos', remoto: 'Remoto' };

/** «Ana Gómez» + «Data Analyst» → texto de fila: estado y, si lo hay, el lugar. */
export function lineaEstado(estado: EstadoPresencia, lugar: Lugar): string {
  const l = TEXTO_LUGAR[lugar];
  return l ? `${TEXTO_ESTADO[estado]} · ${l}` : TEXTO_ESTADO[estado];
}

export function primerNombre(p: { nombre: string; apodo: string }): string {
  return p.apodo || p.nombre.split(' ')[0] || p.nombre;
}

const PASTELES = [262, 150, 12, 330, 200, 48, 90, 290];

/** Un color pastel estable por persona, como los círculos de Gather. */
export function pastel(id: number): string {
  const h = PASTELES[Math.abs(id) % PASTELES.length] ?? 200;
  return `hsl(${h} 70% 84%)`;
}
