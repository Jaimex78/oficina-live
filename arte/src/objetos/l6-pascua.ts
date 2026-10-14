/**
 * Pascua (lote 6): huevos en una canasta y conejo. 2 cuadros.
 *
 * Colores pastel con acentos vivos: rosado (`rojo-suave`), azul (`vidrio`), amarillo (`tela-calida`), morado y verde.
 * Sombras: la canasta va sobre una mesa (reborde de 1 px); el conejo va sobre el piso (dos tonos y mancha de contacto).
 */

import { Lienzo } from '../nucleo';
import type { ColorEntrada } from '../nucleo';
import { B, cerrarApoyado, cerrarSuelo, conBorde, pxSobre, registrar, volumen } from './l6-comun';
import type { Cuadros } from './l6-comun';

type TonosHuevo = readonly [ColorEntrada, ColorEntrada, ColorEntrada, ColorEntrada];

/** Forma de huevo: más angosta arriba que abajo. */
function enHuevo(x: number, y: number, cx: number, cy: number, rx: number, ry: number): boolean {
  const t = (y + 0.5 - cy) / (ry + 0.5);
  const ancho = rx + 0.5 - (t < 0 ? -t * rx * 0.28 : 0);
  return Math.abs(x + 0.5 - cx) <= ancho * Math.sqrt(Math.max(0, 1 - t * t));
}

/** Un huevo de colores con volumen: `adorno` marca rayas, puntos o zigzag. `borde` es su contorno propio. */
function huevo(l: Lienzo, cx: number, cy: number, rx: number, ry: number, tonos: TonosHuevo, borde: ColorEntrada, adorno: 'rayas' | 'puntos' | 'zigzag' | 'liso'): void {
  conBorde(l, borde, (p) => {
    volumen(p, cx, cy, rx + 0.5, ry + 0.5, (x, y) => enHuevo(x, y, cx, cy, rx, ry), [tonos[0], tonos[1], tonos[2]], [0.36, 0.74]);
    const y0 = Math.round(cy);
    if (adorno === 'rayas') {
      for (let x = Math.round(cx - rx); x <= Math.round(cx + rx); x++) {
        pxSobre(p, x, y0, 'neutro-7');
        pxSobre(p, x, y0 + 1, tonos[3]);
      }
    } else if (adorno === 'puntos') {
      for (const [dx, dy] of [[-1, -2], [1, -1], [-1, 1], [1, 2]] as const) pxSobre(p, Math.round(cx) + dx, y0 + dy, 'neutro-7');
    } else if (adorno === 'zigzag') {
      for (let x = Math.round(cx - rx); x <= Math.round(cx + rx); x++) pxSobre(p, x, y0 + (x % 2), 'neutro-7');
    }
    pxSobre(p, Math.round(cx - rx * 0.5), Math.round(cy - ry * 0.55), tonos[3]);
  }, { diagonales: true });
}

/** Canasta de mimbre con cinco huevos de colores entre pasto verde y asa alta. Va sobre una mesa. 32 x 32. */
export function dibujarHuevosPascua(): Lienzo {
  const l = new Lienzo(32, 32);
  // Asa: dos arcos de mimbre.
  l.elipse(15.5, 9, 10, 8, 'madera-clara-2', { relleno: false });
  l.elipse(15.5, 9, 9, 7, 'madera-clara-3', { relleno: false });
  for (let y = 10; y < 32; y++) for (let x = 0; x < 32; x++) l.px(x, y, null);
  // Pasto.
  for (let x = 6; x <= 25; x++) {
    const h = 3 + ((x * 7) % 3);
    l.rect(x, 9 - h + 1, 1, h, x % 3 === 0 ? 'planta-4' : x % 3 === 1 ? 'planta-3' : 'planta-2');
  }
  // Huevos que asoman por encima del borde.
  huevo(l, 9, 8, 3, 4, ['rojo-suave-2', 'rojo-suave-3', 'rojo-suave-4', 'neutro-7'], 'rojo-suave-0', 'rayas');
  huevo(l, 16, 6, 3, 4, ['vidrio-0', 'vidrio-1', 'vidrio-2', 'neutro-7'], 'azul-oficina-1', 'puntos');
  huevo(l, 22, 8, 3, 4, ['tela-calida-1', 'tela-calida-2', 'tela-calida-3', 'neutro-7'], 'tela-calida-0', 'zigzag');
  huevo(l, 12, 10, 3, 4, ['morado-1', 'morado-2', 'morado-3', 'neutro-7'], 'morado-0', 'liso');
  huevo(l, 19, 10, 3, 4, ['planta-1', 'planta-2', 'planta-3', 'neutro-7'], 'planta-0', 'rayas');
  // Mechones de pasto delante de los huevos.
  for (let x = 6; x <= 25; x += 2) {
    l.rect(x, 8 + (x % 3 === 0 ? 0 : 1), 1, 2 + (x % 3 === 0 ? 1 : 0), x % 4 === 0 ? 'planta-4' : 'planta-3');
    l.px(x + 1, 9, 'planta-2');
  }
  // Canasta de mimbre: trapecio con trenzado.
  for (let y = 10; y <= B; y++) {
    const t = (y - 10) / (B - 10);
    const x0 = Math.round(4 + t * 3);
    const x1 = Math.round(27 - t * 3);
    for (let x = x0; x <= x1; x++) {
      const claro = (x + (y % 2) * 2) % 4 < 2;
      const u = (x - x0) / (x1 - x0);
      let c: ColorEntrada = claro ? 'madera-clara-3' : 'madera-clara-2';
      if (u > 0.82) c = claro ? 'madera-clara-2' : 'madera-clara-1';
      l.px(x, y, c);
    }
  }
  l.rect(4, 10, 24, 1, 'madera-clara-4');
  l.rect(4, 11, 24, 1, 'madera-clara-3');
  l.rect(7, B, 18, 1, 'madera-clara-1');
  // Moño amarillo en el asa.
  l.rect(14, 9, 4, 2, 'tela-calida-3');
  l.px(13, 9, 'tela-calida-2');
  l.px(18, 9, 'tela-calida-2');
  return cerrarApoyado(l, { diagonales: true });
}

/** Conejo de Pascua sentado, de frente, con orejas largas, moño azul y un huevo entre las patas. 32 x 40, patas en la fila 36. */
export function dibujarConejoPascua(): Lienzo {
  const l = new Lienzo(32, 40);
  const pelo = ['baldosa-gris-3', 'baldosa-gris-4', 'neutro-6', 'neutro-7'] as const;
  const bola = (cx: number, cy: number, rx: number, ry: number, angulo = 0): void => {
    const c = Math.cos((angulo * Math.PI) / 180);
    const s = Math.sin((angulo * Math.PI) / 180);
    volumen(l, cx, cy, rx + 1, ry + 1, (x, y) => {
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      const u = (dx * c + dy * s) / (rx + 0.5);
      const v = (-dx * s + dy * c) / (ry + 0.5);
      return u * u + v * v <= 1;
    }, pelo, [0.36, 0.64, 0.9]);
  };
  // Orejas largas con el interior rosado.
  bola(10.5, 8, 3.2, 7.5, -8);
  bola(21.5, 8, 3.2, 7.5, 8);
  l.elipse(10, 9, 1, 5, 'rojo-suave-4', { angulo: -8 });
  l.elipse(22, 9, 1, 5, 'rojo-suave-3', { angulo: 8 });
  // Patas de atrás y cuerpo.
  bola(9.5, 35, 5, 2.8);
  bola(22.5, 35, 5, 2.8);
  bola(16, 30, 8.5, 7);
  // Cabeza.
  bola(16, 19, 9.5, 7.5);
  // Cara: ojos, nariz rosada, bigotes y mejillas.
  for (const x of [11, 20]) {
    l.rect(x, 17, 2, 3, 'azul-oficina-0');
    l.px(x, 17, 'neutro-7');
  }
  l.rect(15, 21, 3, 2, 'rojo-suave-3');
  l.px(15, 21, 'rojo-suave-4');
  l.px(16, 23, 'azul-oficina-2');
  l.px(15, 24, 'azul-oficina-2');
  l.px(17, 24, 'azul-oficina-2');
  l.px(16, 24, 'neutro-7');
  l.px(9, 22, 'rojo-suave-4');
  l.px(10, 22, 'rojo-suave-4');
  l.px(22, 22, 'rojo-suave-3');
  l.px(23, 22, 'rojo-suave-3');
  for (const [x, y] of [[6, 21], [5, 22], [26, 21], [27, 22]] as const) l.px(x, y, 'baldosa-gris-2');
  // Moño azul bajo la cabeza.
  l.rect(11, 25, 4, 3, 'vidrio-1');
  l.rect(18, 25, 4, 3, 'vidrio-0');
  l.rect(11, 25, 4, 1, 'vidrio-2');
  l.px(11, 27, null);
  l.px(21, 27, null);
  l.rect(15, 25, 3, 3, 'vidrio-0');
  l.rect(15, 25, 1, 3, 'vidrio-1');
  // Huevo de Pascua entre las patas delanteras, con las manos encima.
  huevo(l, 16, 31, 4.2, 4.6, ['rojo-suave-2', 'rojo-suave-3', 'rojo-suave-4', 'neutro-7'], 'rojo-suave-0', 'zigzag');
  bola(10.5, 32, 2.4, 3);
  bola(21.5, 32, 2.4, 3);
  // Planta clara de las patas traseras.
  l.elipse(9.5, 36, 2, 1, 'rojo-suave-4');
  l.elipse(22.5, 36, 2, 1, 'rojo-suave-4');
  return cerrarSuelo(l, { contacto: [17, 37, 12, 1], diagonales: true });
}

export function cuadrosPascua(): Cuadros {
  const c: Cuadros = new Map();
  registrar(c, 'huevos-pascua', 'U', dibujarHuevosPascua());
  registrar(c, 'conejo-pascua', 'U', dibujarConejoPascua());
  return c;
}

