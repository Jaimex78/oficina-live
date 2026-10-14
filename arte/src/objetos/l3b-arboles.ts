/**
 * Árboles de exterior del lote 3B: pino y abedul. Miden 64 x 128 y se anclan en la huella de 2 x 2: bloquean solo la
 * fila de abajo (el tronco) y la copa sube por las 96 filas de arriba. Copas grandes y claras (`hoja-pastel` y
 * `cesped`) con luz arriba a la izquierda.
 *
 * Sombra: una elipse suave en el suelo al pie del tronco, que cae a la derecha. La copa lleva contorno propio por piso
 * o por mata para que se lean los volúmenes, y todo el árbol un contorno azul marino al final.
 */

import { Lienzo } from '../nucleo';
import type { ColorEntrada } from '../nucleo';
import { poligono } from './l2b-comun';
import { AZ, CE, HP, NE, W, azar, entre, registrar, sombraSuelo, terminar } from './l3b-comun';
import type { Cuadros } from './l3b-comun';

// ---------------------------------------------------------------------------
// Pino
// ---------------------------------------------------------------------------

/**
 * Un piso del pino: triángulo con la base festoneada, sombreado por columnas (luz a la izquierda, sombra a la
 * derecha) y una banda oscura bajo el vuelo de las ramas. Se dibuja aparte, con su contorno, y se pega.
 */
function pisoDePino(l: Lienzo, cx: number, yTope: number, yBase: number, mitad: number, semilla: number): void {
  const p = new Lienzo(l.ancho, l.alto);
  poligono(p, [[cx, yTope], [cx + mitad, yBase - 2], [cx - mitad, yBase - 2]], HP(2));
  // Base festoneada: bolitas de rama a lo largo del borde inferior.
  const paso = 6;
  for (let x = cx - mitad + 2; x <= cx + mitad - 2; x += paso) p.elipse(x, yBase - 3, 3, 3, HP(2));
  p.rect(Math.round(cx - mitad + 2), yBase - 4, Math.round(mitad * 2 - 3), 2, HP(2));
  const r = azar(semilla);
  const alto = yBase - yTope;
  const copia = p.copiar();
  for (let y = yTope; y <= yBase; y++) {
    for (let x = 0; x < l.ancho; x++) {
      if (!copia.esOpaco(x, y)) continue;
      const ancho = Math.max(2, ((y - yTope) / alto) * mitad + 1);
      const u = (x - cx) / ancho;
      const v = (y - yTope) / alto;
      let c: ColorEntrada = HP(2);
      // Frontera de luz inclinada y con una franja tramada, para que la transición no sea un corte recto.
      const u2 = u + 0.2 * (v - 0.5);
      const damero = (x + y) % 2 === 0;
      if (u2 < -0.46 || (u2 < -0.34 && damero)) c = HP(3);
      if (u2 > 0.34 || (u2 > 0.22 && damero)) c = HP(1);
      if (u2 < -0.72 && v < 0.75 && y % 3 === 0) c = HP(4);
      // Ramas: rayitas oscuras escalonadas dentro de cada piso.
      if ((y - yTope) % 7 === 5 && (x + y * 3) % 5 < 3 && v > 0.15 && v < 0.85) c = u > 0.2 ? HP(0) : HP(1);
      // Banda de sombra bajo el vuelo.
      if (y >= yBase - 4) c = u > 0.3 || (u > 0.15 && damero) ? HP(0) : HP(1);
      p.px(x, y, c);
    }
  }
  // Un par de puntos de luz en las ramas.
  for (let i = 0; i < 3; i++) {
    const y = yTope + entre(r, Math.floor(alto * 0.3), Math.floor(alto * 0.7));
    const x = Math.round(cx - ((y - yTope) / alto) * mitad * 0.55) + entre(r, -2, 1);
    if (p.esOpaco(x, y)) p.px(x, y, HP(4));
  }
  p.contorno(HP(0));
  l.pegar(p, 0, 0);
}

/** Pino de cuatro pisos, tronco recto de nogal y un puñado de pasto en la base. */
export function dibujarPino(): Lienzo {
  const l = new Lienzo(64, 128);
  const cx = 31.5;
  // Tronco con luz a la izquierda, raíces al pie.
  l.rect(28, 84, 8, 38, W(2));
  l.rect(28, 84, 2, 38, W(3));
  l.rect(34, 84, 2, 38, W(1));
  for (const [y, w] of [[92, 3], [101, 2], [108, 3], [114, 2]] as const) l.rect(29, y, w, 1, W(1));
  l.rect(30, 96, 1, 2, W(4));
  l.rect(26, 119, 3, 3, W(2));
  l.rect(35, 119, 3, 3, W(1));
  l.px(26, 119, null).px(37, 119, null);
  // Pasto en la base.
  for (const [x, y] of [[22, 120], [24, 121], [39, 121], [41, 120], [44, 121]] as const) {
    l.rect(x, y - 1, 1, 2, CE(2));
    l.px(x + 1, y, CE(3));
  }
  // Pisos, de abajo hacia arriba: cada uno tapa el borde bajo del siguiente.
  pisoDePino(l, cx, 52, 90, 29, 1);
  pisoDePino(l, cx, 34, 68, 24, 2);
  pisoDePino(l, cx, 18, 48, 18, 3);
  pisoDePino(l, cx, 3, 28, 12, 4);
  terminar(l, { sombra: false });
  return sombraSuelo(l, 37, 121, 19, 3, 3);
}

// ---------------------------------------------------------------------------
// Abedul
// ---------------------------------------------------------------------------

/** Una mata de hojas: elipse sombreada con contorno verde oscuro propio, pegada sobre las demás. */
function mata(l: Lienzo, cx: number, cy: number, rx: number, ry: number, semilla: number): void {
  const p = new Lienzo(l.ancho, l.alto);
  p.elipseSombreada(cx, cy, rx, ry, [CE(1), CE(2), CE(3), HP(4)], { relieve: 0.85 });
  const r = azar(semilla);
  // Motas de hojas: grupitos de luz y de sombra dentro de la mata.
  for (let i = 0; i < Math.round(rx * ry / 24); i++) {
    const x = Math.round(cx + (r() * 2 - 1) * rx * 0.7);
    const y = Math.round(cy + (r() * 2 - 1) * ry * 0.7);
    const luz = x < cx;
    if (p.esOpaco(x, y) && p.esOpaco(x + 1, y)) {
      p.rect(x, y, 2, 1, luz ? HP(3) : CE(1));
      if (luz && p.esOpaco(x, y - 1)) p.px(x, y - 1, HP(4));
    }
  }
  p.contorno(CE(0));
  l.pegar(p, 0, 0);
}

/** Abedul: tronco blanco con marcas oscuras que se bifurca, y una copa redonda de matas verdes claras. */
export function dibujarAbedul(): Lienzo {
  const l = new Lienzo(64, 128);
  // Tronco principal y rama que sale a la izquierda.
  const tronco = (x0: number, x1: number, y0: number, y1: number): void => {
    for (let y = y0; y <= y1; y++) {
      const t = (y - y0) / Math.max(1, y1 - y0);
      const x = Math.round(x0 + (x1 - x0) * t);
      l.rect(x, y, 6, 1, NE(6));
      l.px(x, y, NE(7));
      l.px(x + 1, y, NE(7));
      l.px(x + 5, y, NE(5));
      l.px(x + 4, y, NE(5));
    }
  };
  tronco(30, 29, 60, 121);
  for (let i = 0; i < 4; i++) l.rect(21 + i * 2 + (i > 1 ? 1 : 0), 62 - i * 3, 2, 1, NE(7));
  l.linea(28, 76, 20, 58, NE(6));
  l.linea(29, 76, 21, 58, NE(7));
  l.linea(34, 72, 42, 56, NE(5));
  l.linea(35, 72, 43, 56, NE(6));
  // Marcas oscuras del abedul.
  const r = azar(77);
  for (let y = 66; y < 118; y += 5 + entre(r, 0, 3)) {
    const x = 29 + entre(r, 0, 2);
    l.rect(x, y, entre(r, 3, 4), 1, AZ(1));
    if (r() > 0.5) l.rect(x + 1, y + 1, 2, 1, NE(3));
  }
  l.rect(33, 70, 1, 2, AZ(1));
  // Raíces y pasto.
  l.rect(26, 120, 4, 2, NE(5));
  l.rect(34, 120, 4, 2, NE(4));
  l.px(26, 121, null).px(37, 121, null);
  for (const [x, y] of [[22, 121], [24, 122], [39, 122], [41, 121], [45, 122]] as const) {
    l.rect(x, y - 1, 1, 2, CE(2));
    l.px(x + 1, y, CE(3));
  }
  // Copa: matas de atrás hacia adelante.
  mata(l, 22, 22, 13, 12, 11);
  mata(l, 42, 21, 14, 12, 12);
  mata(l, 32, 32, 17, 15, 13);
  mata(l, 14, 42, 12, 11, 14);
  mata(l, 49, 42, 13, 11, 15);
  mata(l, 31, 50, 20, 11, 16);
  mata(l, 8, 53, 7, 6, 17);
  mata(l, 54, 54, 7, 6, 18);
  terminar(l, { sombra: false });
  return sombraSuelo(l, 36, 121, 19, 3, 3);
}

export function cuadrosArboles(): Cuadros {
  const c: Cuadros = new Map();
  registrar(c, 'pino', 'U', dibujarPino());
  registrar(c, 'abedul', 'U', dibujarAbedul());
  return c;
}
