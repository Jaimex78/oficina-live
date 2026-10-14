/**
 * Dónde poner la burbuja que señala a tu personaje cuando queda fuera del cuadro. Es geometría pura: recibe dónde está tu
 * personaje en la pantalla del mundo (puede quedar negativo o más allá del tamaño) y devuelve dónde dibujar la burbuja
 * en el borde, hacia dónde apunta la flecha y si hace falta mostrarla.
 */

export interface PuntoEnPantalla {
  x: number;
  y: number;
  ancho: number;
  alto: number;
}

export interface Margenes {
  izq: number;
  der: number;
  arriba: number;
  abajo: number;
}

export interface BurbujaFuera {
  /** Centro de la burbuja, en píxeles del lienzo. */
  x: number;
  y: number;
  /** Ángulo de la flecha en grados: 0 apunta a la derecha, 90 hacia abajo. */
  grados: number;
}

/** Cuánto del personaje debe verse para no mostrar la burbuja (en píxeles de margen alrededor del punto). */
const MARGEN_VISIBLE = 18;

/** El personaje está fuera del cuadro si su punto cae fuera del lienzo (con un pequeño margen para que no parpadee en el borde). */
export function estaFuera(p: PuntoEnPantalla): boolean {
  return p.x < -MARGEN_VISIBLE || p.y < -MARGEN_VISIBLE || p.x > p.ancho + MARGEN_VISIBLE || p.y > p.alto + MARGEN_VISIBLE;
}

/**
 * Pone la burbuja en el borde del lienzo, sobre la línea que va del centro de la pantalla hasta tu personaje, dentro de unos
 * márgenes (para no quedar bajo la barra de abajo, los controles o las píldoras de arriba). Devuelve null si estás a la vista.
 */
export function burbujaFuera(p: PuntoEnPantalla, m: Margenes): BurbujaFuera | null {
  if (!estaFuera(p)) return null;
  const cx = p.ancho / 2;
  const cy = p.alto / 2;
  const dx = p.x - cx;
  const dy = p.y - cy;
  const grados = (Math.atan2(dy, dx) * 180) / Math.PI;
  // Escala para llegar al borde del rectángulo interior siguiendo la dirección (dx, dy).
  const tx = dx === 0 ? Infinity : (dx > 0 ? p.ancho - m.der - cx : cx - m.izq) / Math.abs(dx);
  const ty = dy === 0 ? Infinity : (dy > 0 ? p.alto - m.abajo - cy : cy - m.arriba) / Math.abs(dy);
  const t = Math.min(tx, ty);
  return { x: cx + dx * t, y: cy + dy * t, grados };
}
