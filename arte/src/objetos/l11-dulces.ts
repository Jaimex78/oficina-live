/**
 * Lote 11, frutas, postres y platos colombianos (14 objetos). Los platos colombianos son extras nuestros: no existen en Gather.
 */

import type { Lienzo } from '../nucleo';
import type { Hacer, Fila } from './l11-comun';
import { dib, pintar, plato, registrarTabla, spr, tonosDe } from './l11-comun';
import type { Cuadros } from './l11-comun';

type L = Lienzo;
const bola = (l: L, cx: number, cy: number, rx: number, ry: number, rampa: string, a = 1, b = 4): void => {
  l.elipseSombreada(cx, cy, rx, ry, tonosDe(rampa, a, b));
};
const HOJAS = ['planta-2', 'planta-3', 'planta-4'];

const naranjas: Hacer = () =>
  dib('naranjas', (l, fb) => {
    // Dos naranjas al frente, una atrás y una mitad cortada.
    bola(l, 15, fb - 8, 5, 5, 'naranja', 0, 3);
    bola(l, 9, fb - 4, 5, 5, 'naranja', 0, 3);
    bola(l, 19, fb - 4, 5, 5, 'naranja', 0, 3);
    l.hoja([15, fb - 12], [18, fb - 14], 3, HOJAS);
    l.hoja([9, fb - 8], [11, fb - 11], 2, HOJAS);
    l.px(14, fb - 10, 'naranja-4');
    l.px(8, fb - 6, 'naranja-4');
    l.px(18, fb - 6, 'naranja-4');
    l.elipse(26, fb - 3, 3, 3, 'naranja-2');
    l.elipse(26, fb - 3, 2, 2, 'naranja-4');
    l.px(26, fb - 3, 'naranja-3');
  });

const pina: Hacer = () =>
  spr('pina', [
    '....h.h.hh.....',
    '...hHhHhHhh....',
    '..hHhHGhHhHh...',
    '...hHhHhHhh....',
    '....hHhHhH.....',
    '.....FHFH......',
    '....yyyyyy.....',
    '...YyjYyjYy....',
    '..YyjYyjYyjy...',
    '..yjYyjYyjYj...',
    '..YyjYyjYyjj...',
    '..yjYyjYyjYj...',
    '..jYyjYyjYjj...',
    '...jyjYyjYj....',
    '....jjjjjjj....',
  ].map((r) => r.padEnd(15, '.')), { H: 'planta-2', h: 'planta-3', G: 'planta-4', F: 'planta-1', j: 'naranja-2', Y: 'tela-calida-3', y: 'tela-calida-2' });

const sandiaBandeja: Hacer = () =>
  dib('sandia-bandeja', (l, fb) => {
    l.rect(2, fb - 2, 28, 3, 'neutro-6');
    l.rect(2, fb - 2, 28, 1, 'neutro-7');
    l.rect(2, fb, 28, 1, 'neutro-4');
    for (const x of [3, 12, 21]) {
      pintar(l, x, fb - 9, [
        'rrrrrrrrrr',
        'rkrrrrkrrr',
        '.rrrrrrrr.',
        '.rrkrrkrr.',
        '..TTTTTT..',
        '..GGGGGG..',
        '...hhhh...',
      ], { k: 'neutro-0', T: 'rojo-suave-1' });
    }
  });

const granada: Hacer = () =>
  dib('granada', (l, fb) => {
    // Granada entera con su corona y una mitad abierta con los granos.
    bola(l, 10, fb - 5, 6, 6, 'rojo', 0, 3);
    l.rect(8, fb - 12, 5, 2, 'rojo-1');
    for (const x of [8, 10, 12]) l.px(x, fb - 13, 'rojo-1');
    l.px(8, fb - 7, 'rojo-4');
    l.px(9, fb - 8, 'rojo-4');
    l.elipse(23, fb - 5, 5, 5, 'rojo-1');
    l.elipse(23, fb - 5, 4, 4, 'crema-4');
    for (const [x, y] of [[21, fb - 7], [24, fb - 8], [26, fb - 5], [22, fb - 4], [25, fb - 3], [23, fb - 6], [20, fb - 5]] as const) {
      l.rect(x, y, 2, 2, 'rojo-suave-2');
      l.px(x, y, 'rojo-suave-4');
    }
  });

const canastaBayas: Hacer = () =>
  dib('canasta-bayas', (l, fb) => {
    // Bayas amontonadas sobre el borde de una canasta de mimbre.
    for (const [x, y, r] of [[9, fb - 9, 'vidrio'], [13, fb - 11, 'rojo-suave'], [18, fb - 10, 'morado'], [22, fb - 8, 'rojo-suave'], [11, fb - 6, 'morado'], [16, fb - 7, 'vidrio'], [21, fb - 5, 'morado']] as const) {
      const t = r === 'vidrio' ? tonosDe(r, 0, 3) : tonosDe(r, 1, 4);
      l.elipseSombreada(x, y, 3, 3, t);
    }
    l.rectRedondeado(4, fb - 6, 24, 7, 2, 'madera-clara-2');
    l.rect(5, fb - 6, 22, 1, 'madera-clara-4');
    for (let x = 5; x < 27; x += 4) l.rect(x, fb - 4, 2, 1, 'madera-clara-3');
    for (let x = 7; x < 27; x += 4) l.rect(x, fb - 2, 2, 1, 'madera-clara-3');
    l.rect(5, fb, 22, 1, 'madera-clara-1');
  });

const manzanaCaramelo: Hacer = () =>
  dib('manzana-caramelo', (l, fb) => {
    l.rect(15, fb - 13, 2, 5, 'madera-clara-3');
    l.px(15, fb - 13, 'madera-clara-4');
    bola(l, 15, fb - 6, 7, 7, 'rojo', 0, 3);
    l.rect(10, fb - 6, 1, 3, 'neutro-7');
    l.rect(11, fb - 9, 2, 1, 'neutro-7');
    l.px(12, fb - 8, 'rojo-4');
    // Gotas de caramelo en la base.
    l.rect(11, fb, 3, 1, 'rojo-1');
    l.rect(17, fb, 4, 1, 'rojo-1');
    l.hoja([16, fb - 12], [19, fb - 14], 2, HOJAS);
  });

const pastelCalabaza: Hacer = () =>
  dib('pastel-calabaza', (l, fb) => {
    l.elipseSombreada(15, fb - 4, 13, 7, tonosDe('metal', 0, 3));
    l.elipseSombreada(15, fb - 5, 12, 6, tonosDe('madera-clara', 1, 4));
    l.elipse(15, fb - 6, 10, 4, 'naranja-1');
    l.elipse(15, fb - 6, 9, 3, 'naranja-2');
    l.elipse(14, fb - 7, 5, 1, 'naranja-3');
    // Borde ondulado y crema batida.
    for (let a = 0; a < 20; a++) {
      const ang = (a / 20) * Math.PI * 2;
      l.px(15 + Math.round(Math.cos(ang) * 11), fb - 6 + Math.round(Math.sin(ang) * 5), 'madera-clara-2');
    }
    l.elipseSombreada(15, fb - 7, 3, 2, tonosDe('neutro', 4, 7));
    l.px(14, fb - 8, 'neutro-7');
  });

const tortaBandeja: Hacer = () =>
  dib('torta-bandeja', (l, fb) => {
    l.rect(2, fb - 2, 28, 3, 'neutro-6');
    l.rect(2, fb - 2, 28, 1, 'neutro-7');
    l.rect(2, fb, 28, 1, 'neutro-4');
    // Torta rectangular: bizcocho, crema y fresas, con una porción cortada.
    l.rect(4, fb - 9, 24, 8, 'madera-clara-3');
    l.rect(4, fb - 9, 24, 4, 'neutro-7');
    l.rect(4, fb - 5, 24, 1, 'rojo-suave-4');
    l.rect(4, fb - 4, 24, 1, 'neutro-7');
    l.rect(27, fb - 9, 1, 8, 'madera-clara-1');
    l.rect(4, fb - 1, 24, 1, 'madera-clara-1');
    for (const x of [7, 12, 17, 22]) {
      l.rect(x, fb - 11, 3, 3, 'rojo-suave-3');
      l.px(x, fb - 11, 'rojo-suave-4');
      l.px(x + 1, fb - 12, 'planta-3');
    }
    l.rect(24, fb - 9, 4, 8, 'neutro-6');
    l.rect(24, fb - 9, 1, 8, 'madera-clara-4');
  });

const arepa: Hacer = () =>
  dib('arepa', (l, fb) => {
    plato(l, 15, fb, 13, 3);
    // Arepa abierta: tapa, queso derretido y base.
    l.elipseSombreada(15, fb - 5, 9, 4, tonosDe('madera-clara', 1, 4));
    l.elipse(15, fb - 6, 8, 3, 'tela-calida-2');
    l.elipse(15, fb - 7, 7, 2, 'tela-calida-3');
    l.elipseSombreada(17, fb - 9, 8, 4, tonosDe('madera-clara', 1, 4));
    for (const [x, y] of [[13, fb - 9], [17, fb - 10], [20, fb - 8]] as const) l.px(x, y, 'madera-clara-1');
    l.rect(8, fb - 5, 2, 2, 'tela-calida-3');
  });

const empanadas: Hacer = () =>
  dib('empanadas', (l, fb) => {
    plato(l, 15, fb, 14, 3);
    // Dos medias lunas doradas con el borde repulgado y una taza de ají.
    for (const [cx, cy] of [[9, fb - 5], [20, fb - 7]] as const) {
      l.elipseSombreada(cx, cy, 6, 4, tonosDe('madera-clara', 1, 4));
      for (let i = -5; i <= 4; i += 2) l.px(cx + i, cy + 3, 'madera-clara-1');
      l.px(cx - 3, cy - 3, 'madera-clara-4');
      l.px(cx - 2, cy - 3, 'madera-clara-4');
    }
    l.rect(25, fb - 5, 4, 3, 'planta-2');
    l.rect(25, fb - 5, 4, 1, 'rojo-suave-3');
  });

const pandebono: Hacer = () =>
  dib('pandebono', (l, fb) => {
    // Tres panecillos de queso en una servilleta de tela.
    l.rect(3, fb - 2, 26, 3, 'neutro-6');
    l.rect(3, fb - 2, 26, 1, 'neutro-7');
    l.rect(3, fb, 26, 1, 'neutro-4');
    bola(l, 8, fb - 6, 4, 4, 'madera-clara', 1, 4);
    bola(l, 22, fb - 6, 4, 4, 'madera-clara', 1, 4);
    bola(l, 15, fb - 8, 5, 5, 'madera-clara', 1, 4);
    l.px(14, fb - 11, 'madera-clara-4');
    l.px(8, fb - 8, 'madera-clara-4');
    l.px(20, fb - 8, 'madera-clara-4');
    l.px(16, fb - 8, 'madera-clara-1');
    l.px(10, fb - 5, 'madera-clara-1');
  });

const ajiaco: Hacer = () =>
  dib('ajiaco', (l, fb) => {
    // Cuenco de barro con caldo, mazorca, papa, alcaparras y crema.
    for (let j = 0; j < 7; j++) {
      const a = 11 - Math.round((3 * j) / 6);
      l.rect(15 - a, fb - 6 + j, a * 2 + 1, 1, 'naranja-2');
      l.px(15 - a, fb - 6 + j, 'naranja-3');
      l.px(15 + a, fb - 6 + j, 'naranja-1');
    }
    l.rect(8, fb, 15, 1, 'naranja-0');
    l.elipse(15, fb - 6, 11, 4, 'naranja-1');
    l.elipse(15, fb - 6, 10, 3, 'tela-calida-2');
    l.elipseSombreada(11, fb - 7, 4, 2, tonosDe('tela-calida', 0, 3));
    for (let x = 8; x < 14; x += 2) l.px(x, fb - 7, 'tela-calida-0');
    l.rect(16, fb - 8, 3, 2, 'crema-3');
    l.rect(20, fb - 6, 2, 2, 'crema-3');
    l.elipseSombreada(18, fb - 5, 2, 1, tonosDe('neutro', 4, 7));
    for (const [x, y] of [[14, fb - 6], [21, fb - 8], [12, fb - 5]] as const) l.px(x, y, 'planta-3');
  });

const bandejaPaisa: Hacer = () =>
  dib('bandeja-paisa', (l, fb) => {
    plato(l, 15, fb, 15, 5);
    // Arroz, frijoles, huevo frito, chorizo, aguacate, patacón y arepita.
    bola(l, 8, fb - 5, 4, 3, 'neutro', 4, 7);
    bola(l, 14, fb - 6, 4, 3, 'madera-oscura', 1, 4);
    l.elipse(21, fb - 7, 4, 2, 'neutro-7');
    l.rect(20, fb - 8, 2, 2, 'tela-calida-3');
    l.px(20, fb - 8, 'tela-calida-2');
    l.rect(6, fb - 9, 9, 2, 'rojo-suave-2');
    l.rect(6, fb - 9, 9, 1, 'rojo-suave-3');
    l.px(5, fb - 8, 'rojo-suave-1');
    l.px(15, fb - 8, 'rojo-suave-1');
    l.elipseSombreada(25, fb - 5, 3, 2, tonosDe('planta', 1, 4));
    l.elipse(17, fb - 3, 3, 1, 'tela-calida-3');
    l.elipse(11, fb - 2, 3, 1, 'madera-clara-3');
    l.elipse(22, fb - 3, 2, 1, 'madera-clara-4');
  });

const bunuelos: Hacer = () =>
  dib('bunuelos', (l, fb) => {
    // Tres buñuelos dorados sobre un papel.
    l.rect(4, fb - 2, 24, 3, 'neutro-5');
    l.rect(4, fb - 2, 24, 1, 'neutro-6');
    l.rect(4, fb, 24, 1, 'neutro-3');
    bola(l, 10, fb - 6, 5, 5, 'naranja', 1, 4);
    bola(l, 20, fb - 6, 5, 5, 'naranja', 1, 4);
    bola(l, 15, fb - 10, 5, 5, 'naranja', 1, 4);
    l.px(14, fb - 13, 'naranja-4');
    l.px(9, fb - 9, 'naranja-4');
    l.px(19, fb - 9, 'naranja-4');
    l.linea(15, fb - 9, 16, fb - 7, 'naranja-0');
    l.linea(12, fb - 5, 13, fb - 3, 'naranja-0');
  });

const TABLA: readonly Fila[] = [
  ['naranjas', naranjas],
  ['pina', pina],
  ['sandia-bandeja', sandiaBandeja],
  ['granada', granada],
  ['canasta-bayas', canastaBayas],
  ['manzana-caramelo', manzanaCaramelo],
  ['pastel-calabaza', pastelCalabaza],
  ['torta-bandeja', tortaBandeja],
  ['arepa', arepa],
  ['empanadas', empanadas],
  ['pandebono', pandebono],
  ['ajiaco', ajiaco],
  ['bandeja-paisa', bandejaPaisa],
  ['bunuelos', bunuelos],
];

export function cuadrosDulces11(): Cuadros {
  return registrarTabla(new Map(), TABLA);
}
