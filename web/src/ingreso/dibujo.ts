/**
 * Utilidades de dibujo en pixel art para el ingreso animado. Todo se pinta sobre un lienzo lógico de 640x360
 * con coordenadas enteras; la imagen final se amplía con vecino más cercano para que los píxeles se vean enteros.
 */

export const ANCHO = 640;
export const ALTO = 360;

export type Ctx = CanvasRenderingContext2D;

export const rect = (c: Ctx, color: string, x: number, y: number, w: number, h: number): void => {
  c.fillStyle = color;
  c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
};

export function rectRedondo(c: Ctx, color: string, x: number, y: number, w: number, h: number, r = 2): void {
  const X = Math.round(x);
  const Y = Math.round(y);
  const W = Math.round(w);
  const H = Math.round(h);
  c.fillStyle = color;
  c.fillRect(X + r, Y, W - 2 * r, H);
  c.fillRect(X, Y + r, W, H - 2 * r);
  if (r > 1) {
    c.fillRect(X + 1, Y + 1, W - 2, H - 2);
  }
}

/** Contorno de un píxel alrededor de un rectángulo. */
export const marco = (c: Ctx, color: string, x: number, y: number, w: number, h: number): void => {
  rect(c, color, x, y, w, 1);
  rect(c, color, x, y + h - 1, w, 1);
  rect(c, color, x, y, 1, h);
  rect(c, color, x + w - 1, y, 1, h);
};

export function elipse(c: Ctx, color: string, cx: number, cy: number, rx: number, ry: number): void {
  c.fillStyle = color;
  for (let y = -ry; y <= ry; y++) {
    const ancho = Math.round(rx * Math.sqrt(1 - (y * y) / (ry * ry + 0.0001)));
    c.fillRect(Math.round(cx - ancho), Math.round(cy + y), ancho * 2 + 1, 1);
  }
}

export const mezcla = (a: string, b: string, t: number): string => {
  const pa = Number.parseInt(a.slice(1), 16);
  const pb = Number.parseInt(b.slice(1), 16);
  const m = (s: number) => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t);
  return `#${((m(16) << 16) | (m(8) << 8) | m(0)).toString(16).padStart(6, '0')}`;
};

/** Aleatorio determinista: mismo semilla, mismo valor. Sirve para que las ventanas encendidas no parpadeen entre cuadros. */
export function azar(semilla: number): () => number {
  let s = semilla >>> 0 || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export const suavizar = (t: number): number => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
export const acotar = (t: number): number => (t <= 0 ? 0 : t >= 1 ? 1 : t);
export const entre = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Tramos de tiempo: devuelve 0 antes de `ini`, 1 después de `fin` y el avance entre los dos. */
export const tramo = (t: number, ini: number, fin: number): number => acotar((t - ini) / (fin - ini));
