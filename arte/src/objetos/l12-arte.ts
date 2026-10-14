/**
 * Relojes, cuadros y pinturas del lote 12 (colgados de la pared, cuadros de `ancho * 32` por `32 + sobresale`).
 *
 * Cada función dibuja SOLO el frente, sin contorno ni sombra: `registrarPared` (`l12-comun.ts`) los pone y saca de ahí los
 * laterales `E` y `O`. La cara de la pared dibujable va de la fila 1 a la `H - 10`. Variantes: cada objeto con variantes
 * cambia UNA rampa (`desde`).
 */

import { Lienzo, dibujarTexto, anchoTexto, rampa } from '../nucleo';
import type { ColorEntrada } from '../nucleo';
import { poligono } from './l2b-comun';
import { BLANCO, DORADO, NEGRO, NOGAL, ROBLE, centrar, marco, registrarTabla } from './l12-comun';
import type { Cuadros, Dibujo, Fila, Marco3 } from './l12-comun';

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Cuadro centrado en la cara de la pared, con su marco; devuelve el interior. */
function cuadro(l: Lienzo, W: number, H: number, w: number, h: number, m: Marco3, g = 2, dy = 0): Rect {
  const [x, y] = centrar(W, H, w, h);
  return marco(l, x, y + dy, w, h, m, g);
}

const relleno = (l: Lienzo, r: Rect, color: ColorEntrada): void => void l.rect(r.x, r.y, r.w, r.h, color);

// ---------------------------------------------------------------------------
// Relojes
// ---------------------------------------------------------------------------

/** Esfera de reloj: aro de tres tonos de `aro` (rampa) y cara `cara`. Centro en (15.5, 11.5), radio 10. */
function esfera(l: Lienzo, aro: string, cara: ColorEntrada, cx = 15.5, cy = 11.5, r = 10): void {
  l.elipse(cx, cy, r, r, `${aro}-1`);
  l.elipse(cx, cy, r - 0.8, r - 0.8, `${aro}-2`);
  l.elipse(cx - 0.6, cy - 0.6, r - 1.6, r - 1.6, `${aro}-3`);
  l.elipse(cx, cy, r - 2, r - 2, cara);
}

function relojMinimalista(l: Lienzo): void {
  esfera(l, 'madera-oscura', 'neutro-7');
  for (const [x, y, w, h] of [[15, 4, 2, 2], [22, 11, 2, 2], [15, 18, 2, 2], [8, 11, 2, 2]] as const) l.rect(x, y, w, h, 'neutro-3');
  l.rect(16, 6, 1, 6, 'neutro-1');
  l.linea(15, 12, 12, 9, 'neutro-1');
  l.px(15, 11, 'neutro-1');
  l.px(16, 12, 'rojo-3');
}

function relojEstandar(l: Lienzo): void {
  esfera(l, 'madera-clara', 'neutro-7');
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    const x = Math.round(15.5 + Math.sin(a) * 6.5 - 0.5);
    const y = Math.round(11.5 - Math.cos(a) * 6.5 - 0.5);
    if (i % 3 === 0) l.rect(x, y, 2, 2, 'neutro-1');
    else l.px(x, y, 'neutro-3');
  }
  l.linea(15, 11, 15, 6, 'neutro-1');
  l.linea(16, 12, 20, 14, 'neutro-1');
  l.linea(16, 12, 19, 8, 'rojo-3');
  l.rect(15, 11, 2, 2, 'neutro-2');
}

function relojPendulo(l: Lienzo): void {
  // Corona, cabeza con la esfera, caja larga con cristal y base.
  l.rect(10, 1, 12, 2, 'madera-oscura-3');
  l.rect(10, 1, 12, 1, 'madera-oscura-4');
  l.rect(8, 3, 16, 2, 'madera-oscura-2');
  l.rect(8, 3, 16, 1, 'madera-oscura-3');
  marco(l, 9, 5, 14, 13, NOGAL, 2);
  l.elipse(15.5, 11.5, 4.5, 4.5, 'neutro-7');
  l.elipse(15.5, 11.5, 4.5, 4.5, 'madera-oscura-1', { relleno: false });
  l.px(15, 8, 'neutro-1');
  l.px(16, 15, 'neutro-1');
  l.linea(15, 11, 15, 9, 'neutro-1');
  l.linea(16, 12, 18, 12, 'neutro-1');
  marco(l, 11, 18, 10, 18, NOGAL, 2);
  l.rect(13, 20, 6, 14, 'vidrio-1');
  l.rect(13, 20, 6, 5, 'vidrio-2');
  l.rect(13, 20, 1, 14, 'vidrio-2');
  l.rect(15, 20, 2, 8, 'tela-calida-1');
  l.elipse(15.5, 30.5, 2.5, 2.5, 'tela-calida-3');
  l.px(15, 29, 'neutro-7');
  l.rect(9, 36, 14, 1, 'madera-oscura-3');
  l.rect(9, 36, 14, 1, 'madera-oscura-4');
  l.rect(8, 37, 16, 1, 'madera-oscura-1');
}

// ---------------------------------------------------------------------------
// Pintura abstracta y moderna
// ---------------------------------------------------------------------------

const dibMondrian: Dibujo = (l, W, H) => {
  const i = cuadro(l, W, H, 22, 28, BLANCO, 1);
  relleno(l, i, 'neutro-7');
  const { x, y, w, h } = i;
  l.rect(x, y, 7, 10, 'rojo-3');
  l.rect(x + w - 6, y + h - 8, 6, 8, 'vidrio-1');
  l.rect(x, y + h - 6, 7, 6, 'tela-calida-3');
  l.rect(x + w - 6, y + 4, 6, 3, 'tela-calida-3');
  for (const vx of [7, 8]) l.rect(x + vx, y, 1, h, 'neutro-1');
  l.rect(x + w - 7, y, 1, h, 'neutro-1');
  for (const hy of [10, h - 7]) l.rect(x, y + hy, w, 1, 'neutro-1');
  l.rect(x + 8, y + 15, w - 8, 1, 'neutro-1');
  l.rect(x + w - 7, y + 3, 7, 1, 'neutro-1');
};

const dibAbstractoRect: Dibujo = (l, W, H) => {
  const i = cuadro(l, W, H, 56, 20, NEGRO, 2);
  relleno(l, i, 'crema-4');
  const { x, y } = i;
  l.rect(x + 3, y + 2, 20, 12, 'vidrio-1');
  l.rect(x + 12, y + 5, 22, 10, 'vidrio-2');
  l.rect(x + 28, y + 1, 14, 9, 'vidrio-3');
  l.rect(x + 38, y + 6, 12, 8, 'vidrio-0');
  l.rect(x + 8, y + 7, 12, 1, 'neutro-2');
  l.rect(x + 18, y + 11, 18, 1, 'neutro-2');
  l.rect(x + 43, y + 2, 3, 3, 'naranja-3');
};

const dibAbstractoCirculos: Dibujo = (l, W, H) => {
  const i = cuadro(l, W, H, 56, 20, BLANCO, 2);
  relleno(l, i, 'neutro-6');
  const { x, y } = i;
  l.elipse(x + 14, y + 8, 7, 7, 'morado-1');
  l.elipse(x + 14, y + 8, 5, 5, 'morado-2');
  l.elipse(x + 14, y + 8, 2.5, 2.5, 'morado-4');
  l.elipse(x + 28, y + 9, 8, 8, 'morado-3');
  l.elipse(x + 28, y + 9, 5, 5, 'morado-0');
  l.elipse(x + 28, y + 9, 2.5, 2.5, 'morado-3');
  l.elipse(x + 42, y + 7, 5, 5, 'morado-2');
  l.elipse(x + 42, y + 7, 2.5, 2.5, 'morado-4');
  l.elipse(x + 21, y + 4, 2, 2, 'naranja-3');
  l.elipse(x + 46, y + 13, 2, 2, 'naranja-2');
};

const dibCubista: Dibujo = (l, W, H) => {
  const i = cuadro(l, W, H, 22, 28, DORADO, 2);
  relleno(l, i, 'crema-3');
  const { x, y } = i;
  const P = (pts: Array<[number, number]>, c: ColorEntrada): void => void poligono(l, pts.map(([a, b]) => [x + a, y + b] as [number, number]), c);
  P([[0, 0], [18, 0], [18, 9], [0, 12]], 'vidrio-2');
  P([[9, 3], [17, 5], [15, 20], [7, 22]], 'naranja-3');
  P([[3, 8], [10, 4], [10, 16], [4, 18]], 'crema-4');
  P([[0, 16], [8, 18], [6, 24], [0, 24]], 'planta-2');
  P([[9, 18], [18, 14], [18, 24], [11, 24]], 'rojo-suave-2');
  P([[10, 6], [14, 6], [12, 14]], 'neutro-1');
  l.rect(x + 5, y + 9, 2, 2, 'neutro-1');
  l.rect(x + 12, y + 8, 2, 2, 'neutro-7');
  l.px(x + 13, y + 9, 'neutro-1');
  l.linea(x + 7, y + 15, x + 14, y + 17, 'madera-oscura-1');
};

// ---------------------------------------------------------------------------
// Retratos y paisajes
// ---------------------------------------------------------------------------

function retrato(l: Lienzo, W: number, H: number, dama: boolean): void {
  const i = cuadro(l, W, H, 22, 28, dama ? DORADO : NOGAL, 3);
  const { x, y, w, h } = i;
  relleno(l, i, dama ? 'madera-oscura-1' : 'planta-0');
  const cx = x + w / 2;
  // Hombros y ropa.
  poligono(l, [[x + 1, y + h], [x + 3, y + h - 7], [cx - 2, y + 12], [cx + 2, y + 12], [x + w - 3, y + h - 7], [x + w - 1, y + h]], dama ? 'rojo-suave-1' : 'neutro-2');
  if (dama) {
    l.rect(x + 4, y + h - 6, w - 8, 3, 'rojo-suave-2');
    poligono(l, [[cx - 4, y + 12], [cx + 4, y + 12], [cx + 2, y + 15], [cx - 2, y + 15]], 'neutro-6');
    l.rect(cx - 1, y + 15, 2, 1, 'tela-calida-3');
  } else {
    poligono(l, [[cx - 3, y + 12], [cx + 3, y + 12], [cx, y + h - 3]], 'neutro-7');
    l.rect(cx - 1, y + 14, 2, 3, 'rojo-3');
  }
  // Cuello, cara y cabello.
  l.rect(cx - 1.5, y + 10, 3, 3, 'crema-3');
  l.elipse(cx - 0.5, y + 8, 3.5, 4.5, 'crema-4');
  l.elipse(cx + 0.5, y + 9, 2.5, 3.5, 'crema-3');
  if (dama) {
    l.elipse(cx - 0.5, y + 5, 4.5, 3, 'madera-oscura-0');
    l.rect(cx - 4, y + 5, 2, 4, 'madera-oscura-0');
    l.elipse(cx - 0.5, y + 2, 2, 1.5, 'madera-oscura-0');
  } else {
    l.elipse(cx - 0.5, y + 5, 4.5, 3, 'neutro-5');
    l.rect(cx - 5, y + 6, 2, 5, 'neutro-5');
    l.rect(cx + 3, y + 6, 2, 5, 'neutro-6');
  }
  l.px(cx - 2, y + 8, 'neutro-1');
  l.px(cx + 1, y + 8, 'neutro-1');
  l.px(cx - 1, y + 11, dama ? 'rojo-suave-3' : 'madera-oscura-2');
};

const dibPaisajeRio: Dibujo = (l, W, H) => {
  const i = cuadro(l, W, H, 58, 20, DORADO, 2);
  const { x, y, w, h } = i;
  relleno(l, i, 'vidrio-3');
  l.rect(x, y, w, 3, 'vidrio-2');
  poligono(l, [[x, y + 8], [x + 14, y + 4], [x + 24, y + 8], [x + 36, y + 3], [x + w, y + 8], [x + w, y + 10], [x, y + 10]], 'morado-2');
  poligono(l, [[x, y + 9], [x + 18, y + 7], [x + 32, y + 9], [x + 44, y + 6], [x + w, y + 9], [x + w, y + h], [x, y + h]], 'planta-2');
  // Río que serpentea y se ensancha hacia adelante.
  poligono(l, [[x + 24, y + 9], [x + 30, y + 9], [x + 36, y + 12], [x + 44, y + h], [x + 18, y + h], [x + 26, y + 13]], 'vidrio-2');
  poligono(l, [[x + 26, y + 10], [x + 29, y + 10], [x + 33, y + 13], [x + 36, y + h], [x + 28, y + h]], 'vidrio-3');
  l.rect(x, y + 14, 18, 4, 'planta-1');
  l.rect(x + 46, y + 13, 12, 5, 'planta-1');
  for (const [tx, ty] of [[x + 4, y + 8], [x + 9, y + 10], [x + 50, y + 8], [x + 55, y + 10]] as const) {
    l.rect(tx, ty, 3, 4, 'planta-1');
    l.px(tx + 1, ty - 1, 'planta-3');
    l.rect(tx, ty, 1, 3, 'planta-3');
  }
  l.elipse(x + 10, y + 1.5, 4, 1.5, 'neutro-7');
  l.elipse(x + 42, y + 2.5, 3, 1, 'neutro-7');
};

const dibBarco: Dibujo = (l, W, H) => {
  const i = cuadro(l, W, H, 58, 20, NOGAL, 2);
  const { x, y, w, h } = i;
  relleno(l, i, 'naranja-4');
  l.rect(x, y, w, 4, 'naranja-3');
  l.rect(x, y + 4, w, 3, 'tela-calida-3');
  l.elipse(x + 38, y + 9, 3, 3, 'tela-calida-3');
  // Mar con crestas.
  l.rect(x, y + 9, w, h - 9, 'vidrio-1');
  for (let k = 0; k < 4; k++) l.rect(x, y + 10 + k * 2, w, 1, k % 2 === 0 ? 'vidrio-2' : 'vidrio-0');
  for (const [cx, cy] of [[6, 12], [18, 15], [44, 13], [50, 16], [30, 17]] as const) l.rect(x + cx, y + cy, 4, 1, 'vidrio-3');
  // Barco: casco, mástil y dos velas.
  poligono(l, [[x + 14, y + 11], [x + 38, y + 11], [x + 34, y + 15], [x + 18, y + 15]], 'madera-oscura-1');
  l.rect(x + 14, y + 11, 24, 1, 'madera-oscura-3');
  l.rect(x + 26, y + 1, 1, 10, 'madera-oscura-0');
  poligono(l, [[x + 26, y + 1], [x + 35, y + 9], [x + 27, y + 9]], 'crema-4');
  poligono(l, [[x + 25, y + 3], [x + 17, y + 9], [x + 25, y + 9]], 'crema-3');
  l.rect(x + 26, y + 1, 4, 1, 'rojo-3');
};

const dibNaturalezaMuerta: Dibujo = (l, W, H) => {
  const i = cuadro(l, W, H, 58, 20, DORADO, 2);
  const { x, y, w, h } = i;
  relleno(l, i, 'madera-oscura-0');
  l.rect(x, y, w, 7, 'madera-oscura-1');
  l.rect(x, y + 12, w, h - 12, 'madera-oscura-2');
  l.rect(x, y + 12, w, 1, 'madera-oscura-3');
  // Jarrón azul con flores, y frutas: manzanas, pera y naranja.
  l.rect(x + 8, y + 5, 7, 9, 'vidrio-1');
  l.rect(x + 8, y + 5, 2, 9, 'vidrio-2');
  l.rect(x + 14, y + 5, 1, 9, 'vidrio-0');
  l.rect(x + 7, y + 4, 9, 1, 'vidrio-2');
  for (const [fx, fy, c] of [[9, 1, 'rojo-suave-3'], [13, 2, 'tela-calida-3'], [11, 0, 'neutro-7']] as const) l.rect(x + fx, y + fy, 2, 2, c);
  l.rect(x + 12, y + 3, 1, 2, 'planta-2');
  l.elipseSombreada(x + 25, y + 11, 4, 3.5, ['rojo-suave-1', 'rojo-suave-2', 'rojo-suave-3', 'rojo-suave-4']);
  l.elipseSombreada(x + 33, y + 12, 4, 3, ['rojo-suave-1', 'rojo-suave-2', 'rojo-suave-3', 'rojo-suave-4']);
  l.elipseSombreada(x + 41, y + 12, 3.5, 3.5, ['naranja-1', 'naranja-2', 'naranja-3', 'naranja-4']);
  l.elipseSombreada(x + 48, y + 11.5, 2.5, 4, ['cesped-0', 'cesped-1', 'cesped-2', 'cesped-3']);
  l.px(x + 25, y + 7, 'planta-2');
  l.px(x + 26, y + 6, 'planta-3');
  l.rect(x + 20, y + 14, 36, 1, 'madera-oscura-1');
};

const MARIPOSA = ['.oo.oo.', 'owwbwwo', 'owwbwwo', '.owbwo.', '..o.o..'] as const;
const dibMariposasChico: Dibujo = (l, W, H) => {
  const i = cuadro(l, W, H, 24, 18, NOGAL, 2);
  relleno(l, i, 'crema-4');
  l.pegar(Lienzo.desdeTexto(MARIPOSA, { o: 'naranja-1', w: 'naranja-3', b: 'neutro-1' }), i.x + 2, i.y + 3);
  l.pegar(Lienzo.desdeTexto(MARIPOSA, { o: 'morado-1', w: 'morado-3', b: 'neutro-1' }), i.x + 11, i.y + 6);
  l.px(i.x + 1, i.y, 'neutro-7');
  l.px(i.x + 2, i.y, 'neutro-7');
};

const dibSiluetas: Dibujo = (l, W, H) => {
  const m: Marco3 = BLANCO;
  const [x0, y0] = centrar(W, H, 52, 20);
  const nombres = ['busto', 'figura', 'planta'] as const;
  nombres.forEach((n, k) => {
    const i = marco(l, x0 + k * 18, y0, 16, 20, m, 1);
    relleno(l, i, 'crema-4');
    const cx = i.x + i.w / 2;
    if (n === 'busto') {
      l.elipse(cx, i.y + 6, 3, 4, 'neutro-1');
      l.rect(cx + 2, i.y + 7, 2, 1, 'neutro-1');
      poligono(l, [[i.x + 2, i.y + i.h], [i.x + 3, i.y + 12], [cx + 2, i.y + 11], [i.x + i.w - 2, i.y + 14], [i.x + i.w - 2, i.y + i.h]], 'neutro-1');
    } else if (n === 'figura') {
      l.elipse(cx, i.y + 3, 2, 2, 'neutro-1');
      poligono(l, [[cx - 1, i.y + 5], [cx + 1, i.y + 5], [cx + 5, i.y + 15], [cx - 5, i.y + 15]], 'neutro-1');
      l.rect(cx - 1, i.y + 15, 1, 3, 'neutro-1');
      l.rect(cx + 1, i.y + 15, 1, 3, 'neutro-1');
    } else {
      poligono(l, [[cx - 3, i.y + 11], [cx + 3, i.y + 11], [cx + 2, i.y + 17], [cx - 2, i.y + 17]], 'neutro-1');
      for (const [ax, ay, bx, by] of [[0, 11, -4, 5], [0, 11, 0, 3], [0, 11, 4, 5], [0, 11, -2, 8], [0, 11, 3, 8]] as const) l.linea(cx + ax, i.y + ay, cx + bx, i.y + by, 'neutro-1');
    }
  });
};

const dibBotanica: Dibujo = (l, W, H) => {
  const i = cuadro(l, W, H, 22, 28, ROBLE, 2);
  relleno(l, i, 'crema-4');
  const { x, y, w } = i;
  const cx = x + w / 2;
  l.linea(cx, y + 18, cx, y + 4, 'planta-1');
  l.linea(cx - 1, y + 18, cx - 1, y + 8, 'planta-1');
  l.hoja([cx, y + 15], [cx - 7, y + 10], 5, rampa('planta').slice(1, 5));
  l.hoja([cx, y + 12], [cx + 7, y + 7], 5, rampa('planta').slice(1, 5));
  l.hoja([cx, y + 9], [cx - 6, y + 5], 4, rampa('hoja-pastel').slice(1, 5));
  l.elipseSombreada(cx, y + 3, 2.5, 2.5, ['rojo-suave-1', 'rojo-suave-3', 'rojo-suave-4']);
  l.px(cx, y + 3, 'tela-calida-3');
  l.rect(x + 3, y + 20, w - 6, 1, 'neutro-4');
  l.rect(x + 5, y + 22, w - 10, 1, 'neutro-5');
  l.rect(x + 7, y + 24, w - 14, 1, 'neutro-5');
};

const dibPosterTierra: Dibujo = (l, W, H) => {
  const i = cuadro(l, W, H, 22, 28, NEGRO, 1);
  relleno(l, i, 'azul-oficina-0');
  const { x, y, w } = i;
  const cx = x + w / 2;
  for (const [a, b] of [[2, 2], [16, 4], [4, 12], [17, 14], [9, 1], [18, 9]] as const) l.px(x + a, y + b, 'neutro-6');
  l.elipseSombreada(cx, y + 11, 8, 8, ['vidrio-0', 'vidrio-1', 'vidrio-2', 'vidrio-3']);
  l.elipse(cx - 3, y + 8, 3, 2.5, 'planta-3');
  l.elipse(cx + 2, y + 13, 3, 3.5, 'planta-3');
  l.rect(cx - 1, y + 14, 2, 2, 'cesped-2');
  l.px(cx - 4, y + 7, 'planta-4');
  l.rect(x + 3, y + 21, w - 6, 3, 'neutro-6');
  l.rect(x + 5, y + 22, w - 10, 1, 'azul-oficina-2');
};

const dibPosterParques: Dibujo = (l, W, H) => {
  const i = cuadro(l, W, H, 22, 28, ROBLE, 1);
  const { x, y, w, h } = i;
  relleno(l, i, 'naranja-4');
  l.rect(x, y, w, 3, 'naranja-3');
  l.rect(x, y + 3, w, 3, 'tela-calida-3');
  l.elipse(x + 13, y + 7, 3, 3, 'tela-calida-3');
  poligono(l, [[x, y + 14], [x + 7, y + 5], [x + 12, y + 11], [x + 16, y + 7], [x + w, y + 14]], 'morado-2');
  poligono(l, [[x, y + 16], [x + 5, y + 12], [x + 11, y + 16], [x + 15, y + 13], [x + w, y + 16]], 'morado-1');
  l.rect(x, y + 15, w, 4, 'planta-1');
  for (const [tx, ty] of [[2, 14], [6, 15], [14, 14], [17, 15]] as const) {
    poligono(l, [[x + tx, y + ty], [x + tx + 2, y + ty - 5], [x + tx + 4, y + ty]], 'planta-2');
  }
  l.rect(x, y + 19, w, h - 19, 'crema-4');
  dibujarTexto(l, 'PARK', x + Math.floor((w - anchoTexto('PARK')) / 2), y + 20, 'madera-oscura-1');
};

const dibMotivacional: Dibujo = (l, W, H) => {
  const i = cuadro(l, W, H, 26, 22, NEGRO, 2);
  relleno(l, i, 'neutro-1');
  const { x, y, w } = i;
  l.rect(x + 1, y + 1, w - 2, 8, 'naranja-3');
  l.rect(x + 1, y + 1, w - 2, 3, 'tela-calida-3');
  poligono(l, [[x + 1, y + 9], [x + 7, y + 4], [x + 11, y + 7], [x + 15, y + 3], [x + w - 1, y + 9]], 'neutro-2');
  l.elipse(x + 17, y + 3, 1.5, 1.5, 'neutro-7');
  dibujarTexto(l, 'HAZLO', x + Math.floor((w - anchoTexto('HAZLO')) / 2), y + 12, 'neutro-7');
};

const dibDiploma: Dibujo = (l, W, H) => {
  const i = cuadro(l, W, H, 26, 18, NOGAL, 2);
  relleno(l, i, 'crema-4');
  const { x, y, w, h } = i;
  l.rect(x + 1, y + 1, w - 2, 1, 'neutro-5');
  l.rect(x + 4, y + 3, w - 8, 1, 'neutro-3');
  l.rect(x + 6, y + 5, w - 12, 1, 'neutro-5');
  l.rect(x + 3, y + 7, w - 6, 1, 'neutro-5');
  l.rect(x + 3, y + 9, w - 9, 1, 'neutro-5');
  l.linea(x + 3, y + 12, x + 8, y + 11, 'neutro-2');
  l.linea(x + 8, y + 11, x + 10, y + 13, 'neutro-2');
  l.elipseSombreada(x + w - 6, y + h - 5, 2.5, 2.5, ['rojo-1', 'rojo-3', 'rojo-4']);
  l.rect(x + w - 8, y + h - 3, 2, 3, 'rojo-2');
  l.rect(x + w - 5, y + h - 3, 2, 3, 'rojo-2');
};

const dibPlano: Dibujo = (l, W, H) => {
  const i = cuadro(l, W, H, 22, 28, BLANCO, 1);
  relleno(l, i, 'vidrio-0');
  const { x, y, w, h } = i;
  l.rectBorde(x + 2, y + 2, w - 4, 16, 'vidrio-3');
  l.rect(x + 2, y + 9, 9, 1, 'vidrio-3');
  l.rect(x + 11, y + 2, 1, 8, 'vidrio-3');
  l.rect(x + 11, y + 13, 1, 5, 'vidrio-3');
  l.px(x + 11, y + 11, 'vidrio-0');
  l.px(x + 11, y + 12, 'vidrio-0');
  l.rect(x + 14, y + 6, 3, 1, 'vidrio-0');
  l.elipse(x + 7, y + 14, 2.5, 2.5, 'vidrio-3', { relleno: false });
  l.linea(x + 2, y + 21, x + w - 3, y + 21, 'vidrio-2');
  l.px(x + 2, y + 20, 'vidrio-2');
  l.px(x + w - 3, y + 20, 'vidrio-2');
  l.rect(x + 3, y + 23, 8, 1, 'vidrio-2');
  l.rect(x + 3, y + h - 3, 5, 1, 'vidrio-2');
};

function engranaje(l: Lienzo, cx: number, cy: number, r: number, dientes: number, tonos: readonly [ColorEntrada, ColorEntrada, ColorEntrada], hueco: ColorEntrada): void {
  for (let y = Math.floor(cy - r - 3); y <= Math.ceil(cy + r + 3); y++) {
    for (let x = Math.floor(cx - r - 3); x <= Math.ceil(cx + r + 3); x++) {
      const dx = x - cx;
      const dy = y - cy;
      const d = Math.hypot(dx, dy);
      const ang = Math.atan2(dy, dx);
      const diente = (((ang / (2 * Math.PI)) * dientes) % 1 + 1) % 1 < 0.5;
      const radio = r + (diente ? 1.6 : 0);
      if (d > radio) continue;
      if (d <= r * 0.32) {
        l.px(x, y, hueco);
        continue;
      }
      l.px(x, y, dx + dy < -r * 0.6 ? tonos[2] : dx + dy > r * 0.7 ? tonos[0] : tonos[1]);
    }
  }
}

const dibEngranajes: Dibujo = (l, W, H) => {
  const i = cuadro(l, W, H, 22, 28, NEGRO, 2);
  relleno(l, i, 'neutro-2');
  const { x, y } = i;
  engranaje(l, x + 6, y + 17, 7, 8, ['metal-1', 'metal-2', 'metal-3'], 'neutro-2');
  engranaje(l, x + 11, y + 6, 5, 6, ['tela-calida-0', 'tela-calida-1', 'tela-calida-3'], 'neutro-2');
  engranaje(l, x + 13, y + 20, 4, 6, ['metal-0', 'metal-1', 'metal-2'], 'neutro-2');
};

const dibArteUrbano: Dibujo = (l, W, H) => {
  const i = cuadro(l, W, H, 22, 28, PLATA_NEGRA, 2);
  relleno(l, i, 'neutro-3');
  const { x, y, w } = i;
  l.elipse(x + 7, y + 9, 6, 5, 'naranja-3');
  l.elipse(x + 13, y + 14, 6, 5, 'morado-3');
  l.elipse(x + 6, y + 18, 4, 3, 'vidrio-2');
  l.elipse(x + 9, y + 9, 3, 2, 'tela-calida-3');
  l.elipse(x + 13, y + 14, 2.5, 2, 'neutro-7');
  // Estrella, chorreaduras y trazos.
  for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) l.px(x + 16 + a, y + 4 + b, 'neutro-7');
  l.px(x + 16, y + 4, 'tela-calida-3');
  for (const [a, b, c] of [[4, 13, 4], [7, 14, 6], [12, 19, 5], [15, 19, 3], [3, 20, 3]] as const) l.rect(x + a, y + b, 1, c, a % 2 === 0 ? 'naranja-2' : 'morado-2');
  l.rect(x + 2, y + 2, 8, 1, 'vidrio-3');
  l.rect(x + 3, y + 3, 5, 1, 'vidrio-3');
  l.rect(x + 2, y + 23, w - 4, 1, 'rojo-3');
};

const PLATA_NEGRA: Marco3 = { luz: 'neutro-4', medio: 'neutro-2', sombra: 'neutro-1' };

const dibEstrella: Dibujo = (l, W, H) => {
  const i = cuadro(l, W, H, 24, 18, ROBLE, 2);
  relleno(l, i, 'vidrio-3');
  l.rect(i.x, i.y + i.h - 5, i.w, 5, 'crema-3');
  const cx = i.x + i.w / 2;
  const cy = i.y + i.h / 2 - 0.5;
  const pts: Array<[number, number]> = [];
  for (let k = 0; k < 10; k++) {
    const a = -Math.PI / 2 + (k * Math.PI) / 5;
    const r = k % 2 === 0 ? 7 : 3;
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.95]);
  }
  poligono(l, pts, 'naranja-2');
  for (const [dx, dy] of [[0, -3], [-3, -1], [3, -1], [-2, 2], [2, 2], [0, 0]] as const) l.px(cx + dx, cy + dy, 'naranja-4');
  l.px(cx - 1, cy - 1, 'naranja-1');
};

const dibShibori: Dibujo = (l, W, H) => {
  const x = 5;
  const w = 22;
  l.rect(2, 1, 28, 2, 'madera-clara-2');
  l.rect(2, 1, 28, 1, 'madera-clara-4');
  l.rect(1, 1, 1, 2, 'madera-clara-1');
  l.rect(30, 1, 1, 2, 'madera-clara-1');
  l.rect(x, 3, w, H - 14, 'azul-oficina-2');
  l.rect(x, 3, w, 1, 'azul-oficina-3');
  l.rect(x, 3, 1, H - 14, 'azul-oficina-3');
  l.rect(x + w - 1, 4, 1, H - 15, 'azul-oficina-1');
  l.rect(x, H - 12, w, 1, 'azul-oficina-1');
  // Anillos claros de atado.
  for (const [cx, cy] of [[10, 9], [20, 8], [15, 16], [9, 22], [22, 21], [14, 27], [24, 14]] as const) {
    if (cy > H - 15) continue;
    l.elipse(cx, cy, 3, 3, 'azul-oficina-4', { relleno: false });
    l.elipse(cx, cy, 1, 1, 'neutro-7');
    l.px(cx - 2, cy - 2, 'azul-oficina-4');
  }
  l.rect(x + 2, H - 13, 3, 1, 'azul-oficina-3');
  l.rect(x + 9, H - 13, 3, 1, 'azul-oficina-3');
};

const dibHojas: Dibujo = (l, W, H) => {
  const i = cuadro(l, W, H, 22, 28, BLANCO, 2);
  relleno(l, i, 'crema-4');
  const { x, y, w } = i;
  const cx = x + w / 2;
  const hp = rampa('hoja-pastel').slice(1, 5);
  l.hoja([cx - 4, y + 22], [x + 2, y + 5], 8, hp, { nervadura: true });
  l.hoja([cx + 2, y + 22], [x + w - 3, y + 7], 8, rampa('planta').slice(1, 5), { nervadura: true });
  l.hoja([cx, y + 22], [cx, y + 3], 6, rampa('planta').slice(1, 5), { nervadura: true });
  l.rect(cx - 1, y + 21, 2, 3, 'madera-oscura-3');
};

/** Macramé: barra, hilos en rombos y flecos. `abierto` deja huecos entre los nudos. */
function macrame(l: Lienzo, W: number, H: number, abierto: boolean): void {
  l.rect(3, 1, 26, 2, 'madera-clara-2');
  l.rect(3, 1, 26, 1, 'madera-clara-4');
  l.px(2, 1, 'madera-clara-1');
  l.px(29, 1, 'madera-clara-1');
  const fin = H - 11;
  if (abierto) {
    for (let k = 0; k < 7; k++) {
      const x = 5 + k * 4;
      l.rect(x, 3, 1, 5, 'crema-4');
      l.rect(x, 8 + (k % 2) * 3, 1, fin - 8 - (k % 2) * 3, 'crema-3');
    }
    for (let r = 0; r < 3; r++) {
      for (let k = 0; k < 6; k++) {
        const x = 7 + k * 4;
        const y = 10 + r * 6 + (k % 2) * 3;
        l.rect(x - 1, y, 3, 2, 'crema-4');
        l.px(x - 1, y + 1, 'crema-2');
      }
    }
    l.elipse(15.5, 8, 2.5, 2.5, 'madera-clara-2', { relleno: false });
  } else {
    for (let r = 0; r < 5; r++) {
      for (let k = 0; k < 7; k++) {
        const x = 5 + k * 4 + (r % 2) * 2;
        if (x > 27) continue;
        const y = 4 + r * 4;
        l.rect(x, y, 3, 3, 'crema-4');
        l.rect(x, y + 2, 3, 1, 'crema-2');
        l.px(x + 1, y + 1, 'crema-3');
      }
    }
    for (let x = 5; x < 28; x += 2) l.rect(x, 24, 1, fin - 24, x % 4 === 1 ? 'crema-4' : 'crema-3');
  }
  for (let x = 5; x < 28; x += 3) l.rect(x, fin - 3, 1, 3 + (x % 2), 'crema-2');
};

const dibCanastas: Dibujo = (l, W, H) => {
  const cestas: Array<[number, number, number]> = [[14, 11, 9], [32, 11, 7], [48, 11, 9]];
  for (const [cx, cy, r] of cestas) {
    l.elipse(cx, cy, r, r, 'madera-clara-1');
    for (let k = r - 1; k >= 1; k -= 2) {
      l.elipse(cx, cy, k, k, k % 4 === 1 ? 'madera-clara-3' : 'madera-clara-2');
    }
    l.elipse(cx, cy, 1, 1, 'madera-clara-1');
    // Luz del aro arriba a la izquierda.
    l.px(cx - r + 2, cy - 3, 'madera-clara-4');
    l.px(cx - 3, cy - r + 2, 'madera-clara-4');
  }
};

const dibTelefono: Dibujo = (l) => {
  // Tabla de madera, dos campanas de latón arriba, disco, bocina y auricular colgado.
  l.rect(9, 3, 14, 25, 'madera-oscura-1');
  l.rect(9, 3, 14, 1, 'madera-oscura-3');
  l.rect(9, 3, 1, 25, 'madera-oscura-3');
  l.rect(22, 4, 1, 24, 'madera-oscura-0');
  l.elipseSombreada(12.5, 6, 3, 3, ['tela-calida-0', 'tela-calida-1', 'tela-calida-2', 'tela-calida-3']);
  l.elipseSombreada(19.5, 6, 3, 3, ['tela-calida-0', 'tela-calida-1', 'tela-calida-2', 'tela-calida-3']);
  l.rect(15, 5, 2, 3, 'neutro-2');
  l.elipse(15.5, 17, 5, 5, 'neutro-6');
  l.elipse(15.5, 17, 5, 5, 'neutro-3', { relleno: false });
  for (const [dx, dy] of [[0, -3], [2, -2], [3, 0], [2, 2], [-2, -2], [-3, 0], [-2, 2]] as const) l.px(15 + dx, 17 + dy, 'neutro-2');
  l.elipse(15.5, 17, 1.5, 1.5, 'neutro-3');
  l.rect(12, 25, 8, 2, 'neutro-2');
  // Auricular en su horquilla (a la izquierda) y manivela (a la derecha).
  l.rect(4, 9, 3, 5, 'neutro-2');
  l.rect(4, 16, 3, 5, 'neutro-2');
  l.rect(5, 14, 1, 2, 'neutro-1');
  l.rect(7, 12, 2, 1, 'metal-2');
  l.rect(23, 14, 3, 1, 'metal-2');
  l.rect(26, 12, 1, 5, 'metal-3');
};

// ---------------------------------------------------------------------------

const CAL = rampa('madera-oscura');
export const TABLA_ARTE: readonly Fila[] = [
  ['reloj-minimalista', relojMinimalista, CAL],
  ['reloj-estandar', relojEstandar, rampa('madera-clara')],
  ['reloj-pendulo', relojPendulo],
  ['cuadro-mondrian', dibMondrian],
  ['cuadro-abstracto-rectangulos', dibAbstractoRect, rampa('vidrio')],
  ['cuadro-abstracto-circulos', dibAbstractoCirculos, rampa('morado')],
  ['cuadro-cubista', dibCubista],
  ['retrato-dama', (l, W, H) => retrato(l, W, H, true)],
  ['retrato-caballero', (l, W, H) => retrato(l, W, H, false)],
  ['paisaje-rio', dibPaisajeRio],
  ['cuadro-barco', dibBarco],
  ['naturaleza-muerta', dibNaturalezaMuerta],
  ['mariposas-enmarcadas-chico', dibMariposasChico],
  ['cuadros-siluetas', dibSiluetas],
  ['ilustracion-botanica', dibBotanica],
  ['poster-tierra', dibPosterTierra],
  ['poster-parques', dibPosterParques],
  ['poster-motivacional', dibMotivacional],
  ['diploma-enmarcado', dibDiploma],
  ['plano-enmarcado', dibPlano],
  ['arte-engranajes', dibEngranajes],
  ['arte-urbano', dibArteUrbano],
  ['estrella-mar-enmarcada', dibEstrella],
  ['estampado-shibori', dibShibori],
  ['estampado-hojas', dibHojas],
  ['macrame-cerrado', (l, W, H) => macrame(l, W, H, false)],
  ['macrame-abierto', (l, W, H) => macrame(l, W, H, true)],
  ['canastas-pared', dibCanastas],
  ['telefono-pared-antiguo', dibTelefono],
];

/** Mapa del mundo y foto de ciudad (dibujos más largos, aparte de la tabla). */
const dibMapa: Dibujo = (l, W, H) => {
  const i = cuadro(l, W, H, 58, 20, NOGAL, 2);
  const { x, y, w, h } = i;
  relleno(l, i, 'vidrio-2');
  l.rect(x, y, w, 1, 'vidrio-1');
  const T = (pts: Array<[number, number]>, c: ColorEntrada = 'planta-3'): void => void poligono(l, pts.map(([a, b]) => [x + a, y + b] as [number, number]), c);
  T([[3, 2], [12, 1], [17, 4], [15, 8], [11, 10], [8, 8], [4, 6]]);
  T([[11, 10], [15, 11], [14, 14], [12, 15]], 'planta-2');
  T([[13, 12], [17, 12], [18, 16], [15, 19], [13, 15]], 'cesped-2');
  T([[24, 3], [29, 2], [31, 5], [27, 7], [24, 6]], 'planta-2');
  T([[25, 8], [31, 8], [33, 12], [30, 17], [27, 15], [25, 11]], 'cesped-2');
  T([[31, 2], [42, 1], [48, 4], [46, 8], [40, 9], [35, 7], [32, 5]]);
  T([[44, 13], [50, 12], [52, 15], [47, 17], [44, 16]], 'cesped-3');
  l.rect(x + 4, y + 2, 4, 1, 'planta-4');
  l.rect(x + 33, y + 2, 5, 1, 'planta-4');
  l.rect(x + 26, y + 8, 3, 1, 'cesped-3');
  // Retícula de meridianos.
  for (let k = 8; k < w; k += 10) for (let j = 0; j < h; j += 3) l.px(x + k, y + j, 'vidrio-3');
  l.rect(x, y + 9, w, 1, 'vidrio-3');
};

const dibCiudad: Dibujo = (l, W, H) => {
  const i = cuadro(l, W, H, 58, 20, BLANCO, 2);
  const { x, y, w, h } = i;
  relleno(l, i, 'morado-1');
  l.rect(x, y + 3, w, 4, 'rojo-suave-2');
  l.rect(x, y + 7, w, 3, 'rojo-suave-3');
  l.rect(x, y + 10, w, 2, 'naranja-3');
  l.elipse(x + 40, y + 11, 4, 4, 'tela-calida-3');
  const edificios: Array<[number, number, number]> = [[0, 8, 6], [6, 5, 5], [11, 9, 7], [18, 3, 5], [23, 7, 6], [29, 10, 5], [34, 4, 6], [40, 8, 5], [45, 5, 6], [51, 9, 7]];
  for (const [bx, alto, ancho] of edificios) {
    l.rect(x + bx, y + h - alto - 1, ancho, alto + 1, 'azul-oficina-1');
    l.rect(x + bx, y + h - alto - 1, 1, alto + 1, 'azul-oficina-2');
    for (let wy = y + h - alto + 1; wy < y + h - 2; wy += 3) {
      for (let wx = x + bx + 1; wx < x + bx + ancho - 1; wx += 2) if ((wx * 7 + wy * 3) % 5 < 2) l.px(wx, wy, 'tela-calida-3');
    }
  }
  l.rect(x + 20, y + h - 13, 1, 3, 'azul-oficina-2');
  l.rect(x, y + h - 1, w, 1, 'azul-oficina-0');
};

export const TABLA_ARTE_2: readonly Fila[] = [
  ['mapa-mundi', dibMapa],
  ['foto-ciudad', dibCiudad],
];

export function cuadrosArte12(): Cuadros {
  const c: Cuadros = new Map();
  registrarTabla(c, TABLA_ARTE);
  registrarTabla(c, TABLA_ARTE_2);
  return c;
}

