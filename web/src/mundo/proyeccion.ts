/**
 * Cómo Phaser pasa un punto del mundo a la pantalla (con `roundPixels` en la cámara): el desplazamiento se redondea hacia abajo
 * y el centro del lienzo se redondea al entero más cercano. Con esto las etiquetas caen justo en un píxel entero y el texto sale nítido.
 */
export interface Proyeccion {
  /** `Math.floor(scrollX)` y `Math.floor(scrollY)` de la cámara. */
  sx0: number;
  sy0: number;
  /** Mitad del lienzo (sin redondear) y su versión redondeada. */
  hw: number;
  hh: number;
  cx: number;
  cy: number;
  zoom: number;
  ancho: number;
  alto: number;
}

export function crearProyeccion(scrollX: number, scrollY: number, ancho: number, alto: number, zoom: number): Proyeccion {
  return {
    sx0: Math.floor(scrollX),
    sy0: Math.floor(scrollY),
    hw: ancho / 2,
    hh: alto / 2,
    cx: Math.floor(ancho / 2 + 0.5),
    cy: Math.floor(alto / 2 + 0.5),
    zoom,
    ancho,
    alto,
  };
}

/** Del mundo (píxeles) a la pantalla (píxeles del lienzo). */
export function aPantalla(p: Proyeccion, wx: number, wy: number): { x: number; y: number } {
  return { x: p.cx + p.zoom * (wx - p.sx0 - p.hw), y: p.cy + p.zoom * (wy - p.sy0 - p.hh) };
}

/** De la pantalla al mundo. */
export function aMundo(p: Proyeccion, sx: number, sy: number): { x: number; y: number } {
  return { x: p.sx0 + p.hw + (sx - p.cx) / p.zoom, y: p.sy0 + p.hh + (sy - p.cy) / p.zoom };
}

/** ¿Un rectángulo en pantalla toca el lienzo (con un margen)? */
export function enPantalla(p: Proyeccion, x: number, y: number, w: number, h: number, margen = 0): boolean {
  return x + w >= -margen && y + h >= -margen && x <= p.ancho + margen && y <= p.alto + margen;
}
