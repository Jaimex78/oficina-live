import type { MiembroOficina } from '../mundo/api-oficina';

export interface Reparto {
  /** Las que no están en línea en ninguna parte. */
  sinConexion: MiembroOficina[];
  /** En línea, pero no en tu sala del mapa (no se ven caminar). */
  enOtraSala: MiembroOficina[];
}

const sinTildes = (t: string): string => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/**
 * Reparte a la gente de la organización que NO ves en tu sala: quien tampoco está en línea (según el servidor) va a
 * «Sin conexión»; quien sí lo está, pero en otra sala, va aparte. `visibles` son los ids que ya se ven en tu sala (tú incluido).
 * `consulta` filtra por nombre, apodo y cargo, sin tildes.
 */
export function repartirMiembros(miembros: readonly MiembroOficina[], visibles: ReadonlySet<number | undefined>, consulta = ''): Reparto {
  const q = sinTildes(consulta.trim());
  const sinConexion: MiembroOficina[] = [];
  const enOtraSala: MiembroOficina[] = [];
  for (const m of miembros) {
    if (visibles.has(m.id)) continue;
    if (q && !sinTildes(`${m.nombre} ${m.apodo} ${m.cargo}`).includes(q)) continue;
    (m.enLinea ? enOtraSala : sinConexion).push(m);
  }
  return { sinConexion, enOtraSala };
}
