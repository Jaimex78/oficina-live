/**
 * Reparte las etiquetas para que no se pisen. Trabaja en píxeles de pantalla (las etiquetas miden lo mismo con cualquier zoom).
 * Las de nombre suben cuando chocan; las de zona, que valen menos, se esconden.
 */

export interface Caja {
  id: string;
  /** Esquina superior izquierda. */
  x: number;
  y: number;
  w: number;
  h: number;
  /** Se colocan primero las de mayor prioridad. */
  prioridad: number;
  tipo: 'nombre' | 'zona' | 'fija';
}

export interface Colocada {
  id: string;
  x: number;
  y: number;
  visible: boolean;
}

const chocan = (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }, hueco: number): boolean =>
  a.x < b.x + b.w + hueco && a.x + a.w + hueco > b.x && a.y < b.y + b.h + hueco && a.y + a.h + hueco > b.y;

export function resolverTraslapes(cajas: readonly Caja[], hueco = 2, maxSubidas = 5): Colocada[] {
  const orden = cajas.map((c, i) => ({ c, i })).sort((a, b) => b.c.prioridad - a.c.prioridad || a.i - b.i);
  const puestas: { x: number; y: number; w: number; h: number }[] = [];
  const salida = new Map<string, Colocada>();
  for (const { c } of orden) {
    let colocada: Colocada | null = null;
    const intentos = c.tipo === 'nombre' ? maxSubidas : 0;
    for (let k = 0; k <= intentos; k++) {
      const y = c.y - k * (c.h + hueco);
      if (!puestas.some((p) => chocan({ x: c.x, y, w: c.w, h: c.h }, p, hueco))) {
        colocada = { id: c.id, x: c.x, y, visible: true };
        break;
      }
    }
    if (!colocada) {
      // Una zona que choca se esconde; un nombre que no encontró sitio queda donde estaba, aunque se encime.
      colocada = c.tipo === 'zona' ? { id: c.id, x: c.x, y: c.y, visible: false } : { id: c.id, x: c.x, y: c.y, visible: true };
    }
    if (colocada.visible) puestas.push({ x: colocada.x, y: colocada.y, w: c.w, h: c.h });
    salida.set(c.id, colocada);
  }
  return cajas.map((c) => salida.get(c.id) as Colocada);
}
