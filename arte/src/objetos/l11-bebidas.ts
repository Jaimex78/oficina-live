/**
 * Lote 11, bebidas (21 objetos): latas, botellas, copas, vasos, cócteles, tazas calientes y el tinto colombiano.
 */

import { Lienzo } from '../nucleo';
import type { Hacer, Fila } from './l11-comun';
import { dib, hex, registrarTabla, spr, taza, tonosDe } from './l11-comun';
import type { Cuadros } from './l11-comun';

const gaseosaLata: Hacer = () =>
  spr('gaseosa-lata', [
    '.AAAAAA.',
    '.ABBBBC.',
    '.122227.',
    '.122227.',
    '.12ww27.',
    '.1ww227.',
    '.1w2227.',
    '.12ww27.',
    '.122227.',
    '.122227.',
    '.CBBBBC.',
    '..CCCC..',
  ]);

const energizanteLata: Hacer = () =>
  spr('energizante-lata', [
    '.AAAAAA.',
    '.ABBBBC.',
    '.GhhhHF.',
    '.GhhYHF.',
    '.GhYYhF.',
    '.GhhYYHF'.slice(0, 8),
    '.GhYYhF.',
    '.GhhYhF.',
    '.GhhhHF.',
    '.GhhhHF.',
    '.CBBBBC.',
    '..CCCC..',
  ]);

const cervezaLata: Hacer = () =>
  spr('cerveza-lata', [
    '.AAAAAA.',
    '.ABBBBC.',
    '.Yyyyjj.',
    '.Yyyyjj.',
    '.YwwwwJ.'.replace('J', 'j'),
    '.Ywrrwj.',
    '.Ywwwwj.',
    '.Yyyyjj.',
    '.Yyyyjj.',
    '.Yyyyjj.',
    '.CBBBBC.',
    '..CCCC..',
  ]);

const cervezaBotella: Hacer = () =>
  spr('cerveza-botella', [
    '...AA...',
    '...OQ...',
    '...OQ...',
    '...OQ...',
    '..oOqQ..',
    '.oOqqqQ.',
    '.oOWWqQ.',
    '.oOWVqQ.',
    '.oOWWqQ.',
    '.oOqqqQ.',
    '.oOqqqQ.',
    '.XQQQQX.',
  ]);

const cervezaPinta: Hacer = () =>
  spr('cerveza-pinta', [
    '.wwwwwww.',
    'ewlwwlwwv',
    'eyyyyyyjv',
    'eYyyyyyjv',
    'eYyyyyyjv',
    '.eYyyyjv.',
    '.eYyyyjv.',
    '.eyyyyjv.',
    '..uyyyjv.'.slice(0, 9),
    '..uuuuuu.',
  ]);

const vinoCopa: Hacer = () =>
  spr('vino-copa', [
    '.evvvvv.',
    '.e33227.',
    '.e32227.',
    '..e3227.',
    '...e27..',
    '....v...',
    '....v...',
    '....v...',
    '..vvvvv.',
  ]);

const vinoBotella: Hacer = () =>
  spr('vino-botella', [
    '...77...',
    '...77...',
    '...HF...',
    '...HF...',
    '...HF...',
    '..hHHF..',
    '.hHHHHF.',
    '.hHWWHF.',
    '.hHWVHF.',
    '.hHWWHF.',
    '.hHHHHF.',
    '.EFFFFE.',
  ]);

const champana: Hacer = () =>
  spr('champana', [
    '....Yy....',
    '....Yy....',
    '....HF....',
    '....HF....',
    '...hHHF...',
    '...hHHF...',
    '.ABBBBBBC.',
    '.ABwlwlBC.',
    '.ABBBBBBC.',
    '..ABBBBC..',
    '..ABBBBC..',
    '..CCCCCC..',
  ]);

const jugo: Hacer = () =>
  spr('jugo', [
    '......ck.',
    '.....ck..',
    '.evvvvvu.',
    '.eaacffu.',
    '.eacccfu.',
    '.ecccffu.',
    '.ecccffu.',
    '..ecffiu.',
    '..eciffu.',
    '..uuuuuu.',
  ]);

const limonada: Hacer = () =>
  spr('limonada', [
    '..hh..rk.',
    '.hHhhrk..',
    '.ewwwwwu.',
    '.eYYYYYu.',
    '.eYwYYwu.',
    '.eYYYwYu.',
    '.eYwYYYu.',
    '.eYYYYYu.',
    '.eYYwYYu.',
    '.eYYYYYu.',
    '..uuuuuu.',
  ]);

const bebidaCoco: Hacer = () =>
  dib('bebida-coco', (l, fb) => {
    // Pajilla roja y blanca, y el coco con su carne blanca arriba.
    l.linea(19, fb - 12, 16, fb - 8, 'rojo-suave-3');
    l.linea(20, fb - 12, 17, fb - 8, 'neutro-7');
    l.elipseSombreada(15, fb - 4, 7, 5, tonosDe('madera-oscura', 0, 3));
    l.elipse(15, fb - 8, 5, 2, 'crema-4');
    l.elipse(15, fb - 8, 4, 1, 'madera-clara-4');
    l.px(10, fb - 3, 'madera-oscura-3');
    l.px(20, fb - 5, 'madera-oscura-1');
    // Flor roja de adorno.
    l.px(9, fb - 8, 'rojo-suave-3');
    l.px(8, fb - 8, 'rojo-suave-4');
    l.px(9, fb - 9, 'rojo-suave-4');
  });

const coctelTiki: Hacer = () =>
  dib('coctel-tiki', (l, fb) => {
    // Vaso tiki de cerámica con un cóctel anaranjado, hoja de menta y rodaja de naranja.
    taza(l, 11, fb, 9, 11, ['madera-oscura-3', 'madera-oscura-2', 'madera-oscura-1', 'madera-oscura-0'], false);
    l.rect(11, fb - 10, 9, 2, 'naranja-3');
    l.rect(12, fb - 10, 3, 1, 'naranja-4');
    l.rect(11, fb - 6, 9, 1, 'tela-calida-2');
    l.rect(11, fb - 3, 9, 1, 'tela-calida-2');
    l.px(12, fb - 6, 'tela-calida-3');
    l.px(12, fb - 3, 'tela-calida-3');
    l.hoja([13, fb - 11], [11, fb - 15], 3, ['planta-2', 'planta-3', 'planta-4']);
    l.hoja([14, fb - 11], [16, fb - 15], 3, ['planta-2', 'planta-3', 'planta-4']);
    l.rect(18, fb - 12, 3, 3, 'naranja-2');
    l.px(18, fb - 12, 'naranja-4');
    l.px(19, fb - 11, 'naranja-3');
  });

const teBoba: Hacer = () =>
  spr('te-boba', [
    '......zr..',
    '......zr..',
    '.eeeeezeu.',
    '.eWWWVVVu.',
    '.eWVVVSSu.',
    '.eVVVSSsu.',
    '.eVVSSssu.',
    '..eVSSssu.',
    '..eSSssSu.',
    '..eXkXkXu.',
    '..uXXkXXu.',
  ]);

const cafeHelado: Hacer = () =>
  spr('cafe-helado', [
    '......fk.',
    '.....fk..',
    '.eeeeeeeu',
    '.eWwWWwWu',
    '.eWWwWWWu',
    '.eqqqqqqu'.slice(0, 9),
    '.eqOqqwqu'.slice(0, 9),
    '.eqqqqqqu'.slice(0, 9),
    '..uQqqqqu'.slice(0, 9),
    '..uuuuuuu',
  ]);

const mate: Hacer = () =>
  dib('mate', (l, fb) => {
    // Calabaza de mate con yerba arriba y la bombilla metálica inclinada.
    l.linea(19, fb - 14, 16, fb - 9, 'metal-2');
    l.linea(20, fb - 14, 17, fb - 9, 'metal-3');
    l.rect(19, fb - 15, 3, 2, 'metal-3');
    l.elipseSombreada(15, fb - 4, 6, 5, tonosDe('madera-clara', 0, 3));
    l.rect(13, fb - 2, 4, 1, 'madera-clara-1');
    l.rect(14, fb - 1, 3, 1, 'madera-clara-0');
    l.elipse(15, fb - 8, 4, 2, 'planta-2');
    l.elipse(15, fb - 8, 3, 1, 'planta-3');
    l.px(14, fb - 9, 'planta-4');
    l.rect(10, fb - 9, 1, 2, 'madera-clara-4');
    l.rect(20, fb - 9, 1, 1, 'madera-clara-1');
    // Banda de cuero y metal.
    l.rect(10, fb - 6, 11, 1, 'cuero-1');
  });

const chocolateCaliente: Hacer = () =>
  dib('chocolate-caliente', (l, fb) => {
    taza(l, 10, fb, 10, 9, ['rojo-suave-3', 'rojo-suave-2', 'rojo-suave-1', 'rojo-suave-0']);
    l.rect(11, fb - 9, 8, 2, 'madera-oscura-1');
    l.rect(11, fb - 9, 8, 1, 'madera-oscura-2');
    // Malvaviscos encima.
    for (const [x, y] of [[11, fb - 11], [14, fb - 12], [17, fb - 11]] as const) {
      l.rect(x, y, 3, 3, 'neutro-7');
      l.rect(x + 2, y, 1, 3, 'neutro-5');
      l.rect(x, y + 2, 3, 1, 'neutro-5');
    }
  });

const setWhisky: Hacer = () =>
  spr('set-whisky', [
    '...BB...........',
    '...BB...........',
    '...eu...........',
    '..euvu..........',
    '.ejyyyjv........',
    '.eYyyyjjv.......',
    '.eYyyyjjv.eeee..',
    '.eYyyyjjv.eyyv..',
    '.ejjyyjjv.ejjv..',
    '.eujjjjvv.eyyv..',
    '..uuuuuu..uuuu..',
  ].map((r) => r.padEnd(16, '.')));

const sidraCaliente: Hacer = () =>
  dib('sidra-caliente', (l, fb) => {
    taza(l, 10, fb, 10, 9, ['neutro-6', 'neutro-5', 'neutro-3', 'neutro-2']);
    l.rect(11, fb - 8, 8, 2, 'naranja-1');
    l.rect(11, fb - 8, 8, 1, 'naranja-2');
    // Palo de canela y rodaja de manzana.
    l.linea(17, fb - 9, 21, fb - 14, 'madera-clara-1');
    l.linea(18, fb - 9, 22, fb - 14, 'madera-clara-2');
    l.rect(11, fb - 10, 4, 3, 'rojo-suave-3');
    l.px(11, fb - 10, 'rojo-suave-4');
    l.px(12, fb - 9, 'crema-4');
    l.px(13, fb - 9, 'crema-4');
  });

const latteEspeciado: Hacer = () =>
  dib('latte-especiado', (l, fb) => {
    taza(l, 9, fb, 11, 8, ['naranja-4', 'naranja-3', 'naranja-2', 'naranja-1']);
    l.rect(10, fb - 8, 9, 2, 'madera-clara-3');
    l.rect(10, fb - 9, 9, 2, 'neutro-7');
    l.rect(12, fb - 11, 5, 2, 'neutro-7');
    l.rect(13, fb - 12, 3, 1, 'neutro-6');
    l.px(11, fb - 9, 'neutro-5');
    l.px(17, fb - 9, 'neutro-5');
    l.px(14, fb - 11, 'naranja-1');
    l.px(15, fb - 10, 'naranja-1');
    l.px(12, fb - 10, 'naranja-1');
  });

const chaiBarro: Hacer = () =>
  spr('chai-barro', [
    '.cccccccc.',
    '.cWWWWWWc.',
    '..fWSSSf..',
    '..fffffi..',
    '..fffffi..',
    '..cffffi..',
    '...fffi...',
    '...iiii...',
  ].map((r) => r.padEnd(10, '.')), { c: 'naranja-3', f: 'naranja-2', i: 'naranja-1' });

const tintoTacita: Hacer = () =>
  dib('tinto-tacita', (l, fb) => {
    // Plato y tacita blanca con tinto oscuro y su vapor.
    l.elipseSombreada(15, fb - 1, 9, 2, tonosDe('neutro', 4, 7));
    taza(l, 11, fb - 3, 8, 6, ['neutro-7', 'neutro-6', 'neutro-5', 'neutro-4']);
    l.rect(12, fb - 8, 6, 1, 'madera-oscura-1');
    l.rect(12, fb - 8, 2, 1, 'madera-oscura-3');
    l.rect(11, fb - 9, 8, 1, 'neutro-7');
    l.px(14, fb - 11, 'neutro-5');
    l.px(15, fb - 12, 'neutro-5');
    l.px(14, fb - 13, 'neutro-5');
  });

const TABLA: readonly Fila[] = [
  ['gaseosa-lata', gaseosaLata, hex('rojo')],
  ['energizante-lata', energizanteLata, hex('planta')],
  ['cerveza-lata', cervezaLata, hex('tela-calida')],
  ['cerveza-botella', cervezaBotella, hex('madera-oscura')],
  ['cerveza-pinta', cervezaPinta, hex('tela-calida')],
  ['vino-copa', vinoCopa, hex('rojo')],
  ['vino-botella', vinoBotella, hex('planta')],
  ['champana', champana],
  ['jugo', jugo, hex('naranja')],
  ['limonada', limonada],
  ['bebida-coco', bebidaCoco],
  ['coctel-tiki', coctelTiki],
  ['te-boba', teBoba, hex('crema')],
  ['cafe-helado', cafeHelado],
  ['mate', mate],
  ['chocolate-caliente', chocolateCaliente],
  ['set-whisky', setWhisky],
  ['sidra-caliente', sidraCaliente],
  ['latte-especiado', latteEspeciado],
  ['chai-barro', chaiBarro],
  ['tinto-tacita', tintoTacita],
];

export function cuadrosBebidas11(): Cuadros {
  void Lienzo;
  return registrarTabla(new Map(), TABLA);
}
