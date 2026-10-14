import type { Zona } from '@ol/shared';
import { primerNombre } from './estados';

interface PersonaMinima {
  id: number;
  nombre: string;
  apodo: string;
}

/** Lo que el botón de Teams de la barra hace según dónde estás: en una sala, cerca de una persona, cerca de varias o en ningún lado. */
export type ContextoTeams =
  | { tipo: 'sala'; zonaId: string; nombre: string; hayOtros: boolean; etiqueta: string; etiquetaLlamada: string }
  | { tipo: 'persona'; persona: PersonaMinima; etiqueta: string; etiquetaLlamada: string }
  | { tipo: 'grupo'; personas: PersonaMinima[]; lugar: string; etiqueta: string; etiquetaLlamada: string }
  | { tipo: 'ninguno'; etiqueta: string; etiquetaLlamada: string };

/** «Ana», «Ana y Luis», «Ana, Luis y Sofía». */
export function listaDeNombres(n: readonly string[]): string {
  if (n.length <= 1) return n[0] ?? '';
  return `${n.slice(0, -1).join(', ')} y ${n[n.length - 1]}`;
}

/**
 * Decide el contexto de Teams. `enZona` son quienes están dentro de la zona donde estás (tú incluido); `cercanos`, quienes están
 * dentro de tu radio de cercanía (sin ti). Una sala de reuniones manda sobre la cercanía.
 */
export function contextoTeams(zona: Pick<Zona, 'id' | 'nombre' | 'tipo'> | null, enZona: readonly PersonaMinima[], cercanos: readonly PersonaMinima[], yoId: number): ContextoTeams {
  if (zona?.tipo === 'sala') {
    const hayOtros = enZona.some((p) => p.id !== yoId);
    return { tipo: 'sala', zonaId: zona.id, nombre: zona.nombre, hayOtros, etiqueta: `Chat de ${zona.nombre}`, etiquetaLlamada: 'Llamar a la sala' };
  }
  const otros = cercanos.filter((p) => p.id !== yoId);
  if (otros.length === 1) {
    const p = otros[0] as PersonaMinima;
    return { tipo: 'persona', persona: p, etiqueta: `Chat con ${primerNombre(p)}`, etiquetaLlamada: `Llamar a ${primerNombre(p)}` };
  }
  if (otros.length > 1) {
    const lugar = zona?.nombre || 'la oficina';
    return { tipo: 'grupo', personas: otros, lugar, etiqueta: `Conversación en ${lugar}`, etiquetaLlamada: `Llamar a ${listaDeNombres(otros.map(primerNombre))}` };
  }
  return { tipo: 'ninguno', etiqueta: 'Abrir Teams', etiquetaLlamada: 'Llamar' };
}

export interface PedidoTeams {
  tipo: 'chat' | 'llamada';
  personas?: number[];
  sala?: string;
  /** Pista del nombre del lugar para titular un chat grupal. */
  lugar?: string;
}

/** El pedido al servidor para el contexto, o null si no hay a quién (se abre el chat general de Teams). */
export function pedidoDe(c: ContextoTeams, tipo: 'chat' | 'llamada'): PedidoTeams | null {
  switch (c.tipo) {
    case 'sala':
      return { tipo, sala: c.zonaId };
    case 'persona':
      return { tipo, personas: [c.persona.id] };
    case 'grupo':
      return { tipo, personas: c.personas.map((p) => p.id), lugar: c.lugar };
    default:
      return null;
  }
}
