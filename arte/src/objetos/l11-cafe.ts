/**
 * Lote 11, cafetería (17 objetos): máquinas, teteras, tazas, termos y la estación de espresso de piso.
 * Cada dibujo es una cuadrícula de texto (ver `l11-comun.ts`); la luz viene de arriba a la izquierda.
 */

import type { Hacer, Fila } from './l11-comun';
import { hex, registrarTabla, spr } from './l11-comun';
import type { Cuadros } from './l11-comun';

const maquinaEspresso: Hacer = () =>
  spr('maquina-espresso', [
    '...AAAAAAAAAAAA...',
    '..ABBBBBBBBBBBBC..',
    '.ABBBBBBBBBBBBBBC.',
    'ABBBBBBBBBBBBBBBBC',
    'ABkkkkkkkBBBrhBBBC',
    'ABkhhkkkkBBBBBBBBC',
    'ABkkkkkkkBBBBBBBBC',
    'ACCCCCCCCCCCCCCCCC',
    'ABBBBBBBBBBBBBBBBC',
    'ABBBBBBBCCCCBBBBBC',
    'ABBBBBBkkkkkkkkkBC',
    'ABBBBBBBwwBBBBBBBC',
    'ABBBBBBBwgBBBBBBBC',
    'AKKKKKKKKKKKKKKKKC',
    '.CCCCCCCCCCCCCCCC.',
  ]);

const cafeteraIndividual: Hacer = () =>
  spr('cafetera-individual', [
    '.%%%%%%%%%%%.',
    '%&&&&&&&&eev/',
    '%&&&&&&&&evv/',
    '%&&&&&&&&evv/',
    '%&&&##&&&evv/',
    '%&&&&&&&&evv/',
    '%&&&&&&&&euv/',
    '%&&&&&&&&&&/',
    '%&//////&&&&/',
    '%&/&&&&/&&&&/',
    '%&/&&&&/&&&&/',
    '%&&&www&&&&&/',
    '%&&&wgg&&&&&/',
    '%/////////// ',
    '.###########.',
  ].map((r) => r.padEnd(13, '.')));

const molinillo: Hacer = () =>
  spr('molinillo-cafe', [
    '..nnnnnnnn..',
    '..NnnnnnnN..',
    '...NnnnnN...',
    '...NoooON...',
    '..AAAAAAAA..',
    '.ABBBBBBBBC.',
    '.ABBBBBBBBC.',
    '.ABBkkkkBBC.',
    '.ABBkkkkBBC.',
    '.ABBBBBBBBC.',
    '.ABBBBBBrBC.',
    '.ACCCCCCCCC.',
    '.CkkkkkkkkC.',
  ]);

const prensaFrancesa: Hacer = () =>
  spr('prensa-francesa', [
    '....kk....',
    '....kk....',
    '..kkkkkk..',
    '.CCCCCCCC.',
    '.eveeeeevC',
    '.eOOOOOOvC',
    'keOOOOOOvC',
    'k.eOOOOOvC',
    'k.eOOOOOvC',
    'k.eOOOOOvC',
    '..uUUUUUUC',
    '.CCCCCCCCC',
  ]);

const cafeteraFiltro: Hacer = () =>
  spr('cafetera-filtro', [
    '.kkkkkkkkkk.',
    'kKKKKKKKKKKk',
    'kkkkkkkkkkkk',
    '.kKwKKKKKKk.',
    '.kKwKKKKKKk.',
    '.kKwKKrKKKk.',
    '.kkkkkkkkkk.',
    '.keeeeeeeKk.',
    '.keOOOOOOvk.',
    '.keOOOOOOvk.',
    'kkkvOOOOOvkk',
    'kKKkvvvvvkKk',
    'kkkkkkkkkkkk',
  ]);

const percolador: Hacer = () =>
  spr('percolador', [
    '.....eee.....',
    '....evvvu....',
    '..AAAAAAAAA..',
    '.ABBBBBBBBBC.',
    '.ABBBBBBBBBCk',
    '.ABBBBBBBBBCk',
    'kABBBBBBBBBCk',
    'kABBBBBBBBBC.',
    '.ABBBBBBBBBC.',
    '.ABBBBBBBBBC.',
    '.ABBBBBBBBBC.',
    '.ACCCCCCCCCC.',
    '..kk.....kk..',
  ]);

const urnaCafe: Hacer = () =>
  spr('urna-cafe', [
    '.....kkk.....',
    '....kkkkk....',
    '..AAAAAAAAA..',
    '.ABBBBBBBBBC.',
    'AABBBBBBBBBCC',
    'AABBBBBBBBBCC',
    '.AeBBBBBBBBC.',
    '.AeBBBBBBBBC.',
    '.AvBBBBBBBBC.',
    '.AvBBBBBBBBC.',
    '.AuBBBBBBBBC.',
    '.AuBBBBBBBBC.',
    '.ABBBBBBBBBC.',
    '.ABBBBBkBBBC.',
    '.ABBBBBkkrBC.',
    '.ACCCCCCCCCC.',
    '..CC.....CC..',
    '..CCCCCCCCC..',
  ]);

const cafeFiltrado: Hacer = () =>
  spr('cafe-filtrado', [
    '.wwwwwwwwww.',
    '..wllllllw..',
    '...wllllw...',
    '....wooW....',
    '.....ww.....',
    '..eeeeeeee..',
    '.ev......vC.',
    '.ev.OOOO.vC.',
    '.ev.OOOO.vC.',
    '.eOOOOOOOvC.',
    '.eOOOOOOOvC.',
    '..uuuuuuuC..',
  ].map((r) => r.padEnd(12, '.')));

const teteraClasica: Hacer = () =>
  spr('tetera-clasica', [
    '.....ee.....',
    '....eueC....',
    '..kkuuuukk..',
    '.eeeeeeeeeC.',
    'eeeeeeeeeeeC',
    'eveeeeeeeevC',
    'eveeeeeeeevC',
    'eveeeeeeeevC',
    '.uvvvvvvvvC.',
    '..CCCCCCCC..',
  ].map((r) => r.padEnd(12, '.')), {}, 0, (l, fb, x0) => {
    // Pico a la izquierda y asa a la derecha.
    l.px(x0 - 1, fb - 6, 'vidrio-2');
    l.px(x0 - 2, fb - 7, 'vidrio-2');
    l.px(x0 - 3, fb - 8, 'vidrio-3');
    l.px(x0 + 12, fb - 6, 'vidrio-1');
    l.px(x0 + 13, fb - 5, 'vidrio-1');
    l.px(x0 + 13, fb - 4, 'vidrio-1');
    l.px(x0 + 12, fb - 3, 'vidrio-1');
  });

const teteraZen: Hacer = () =>
  spr('tetera-zen', [
    '.....kk.....',
    '....kKKk....',
    '..kkKKKKkk..',
    '.kKKKKKKKKk.',
    'kKKKKKKKKKKk',
    'kKKKKKKKKKKk',
    'kKKKKKKKKKKk',
    '.kKKKKKKKKk.',
    '..kkkkkkkk..',
  ].map((r) => r.padEnd(12, '.')), { K: 'neutro-2', k: 'neutro-1' }, 0, (l, fb, x0) => {
    // Asa de bambú arriba y pico corto.
    for (let i = 0; i < 8; i++) l.px(x0 + 2 + i, fb - 9 - (i === 0 || i === 7 ? 0 : 1), i % 2 ? 'madera-clara-3' : 'madera-clara-2');
    l.px(x0 - 1, fb - 5, 'neutro-2');
    l.px(x0 - 2, fb - 6, 'neutro-2');
    l.px(x0 + 12, fb - 5, 'neutro-1');
  });

const filtroVietnamita: Hacer = () =>
  spr('filtro-vietnamita', [
    '..AAAAAA..',
    '..ABBBBC..',
    '..AAAAAA..',
    '...ACCC...',
    '..eeeeee..',
    '.eveeeeeC.',
    '.evOOOOOC.',
    '.evOOOOOC.',
    '.evOOOOOC.',
    '.evOOOOOC.',
    '..uuuuuC..',
  ].map((r) => r.padEnd(10, '.')));

const tazaTe: Hacer = () =>
  spr('taza-te', [
    '...wwwww..',
    '..wlllllw.',
    '..wYYYYYwl',
    '..wYYYYYww',
    '..wlllllwl',
    '...wllllw.',
    'ggggggggggg',
  ].map((r) => r.padEnd(11, '.')), {}, 0, (l, fb, x0) => {
    // Hilo y etiqueta de la bolsita.
    l.px(x0 + 8, fb - 6, 'neutro-5');
    l.px(x0 + 9, fb - 5, 'neutro-5');
    l.rect(x0 + 8, fb - 4, 2, 2, 'rojo-suave-3');
  });

const tazonTe: Hacer = () =>
  spr('tazon-te', [
    '..hhhhhhhhh..',
    '.hGGGGGGGGGh.',
    'HhGGGGGGGGGhH',
    'wwwwwwwwwwwww',
    '.wlllllllllw.',
    '..wlllllllw..',
    '...wllllwww..',
    '....gwwwg....',
  ].map((r) => r.padEnd(13, '.')));

const vasoTermico: Hacer = () =>
  spr('vaso-termico', [
    '...kk.....',
    '..kkkk....',
    '.AAAAAAAA.',
    '.vevvvvvu.',
    '..evvvvvu.',
    '..evvvvvu.',
    '..evvvvvu.',
    '..evvvvvu.',
    '..evvvvvu.',
    '..evvvvvu.',
    '..evvvvvu.',
    '...uuuuuu.',
  ].map((r) => r.padEnd(10, '.')), {}, 0, (l, fb, x0) => {
    // Asa del lado derecho.
    l.px(x0 + 9, fb - 9, 'vidrio-1');
    l.px(x0 + 10, fb - 8, 'vidrio-1');
    l.px(x0 + 10, fb - 7, 'vidrio-1');
    l.px(x0 + 9, fb - 6, 'vidrio-1');
  });

const termo: Hacer = () =>
  spr('termo', [
    '..kkkkkk..',
    '..kKKKKk..',
    '...AAAA...',
    '..GhhhhH..',
    '.GhhhhhhH.',
    '.GhhhhhhH.',
    '.GhhhhhhH.',
    '.GhhhhhhH.',
    '.GhhhhhhH.',
    '.GhhhhhhH.',
    '.GhhhhhhH.',
    '.GhhhhhhH.',
    '..FFFFFF..',
  ]);

const botellaAgua: Hacer = () =>
  spr('botella-agua', [
    '...uuu...',
    '...uuu...',
    '...eee...',
    '..eeeee..',
    '.eveevvv.',
    '.evvvvvvC',
    '.evvvvvvC',
    '.eeeeeeeC',
    '.evvvvvvC',
    '.evvvvvvC',
    '.evvvvvvC',
    '.evvvvvvC',
    '..uuuuuC.',
  ], { e: 'neutro-7', v: 'vidrio-3', u: 'vidrio-1', C: 'vidrio-2' });

const estacionEspresso: Hacer = () =>
  spr('estacion-espresso', [
    '...AAAAAAAAAAAA...',
    '..ABBBBBBBBBBBBC..',
    '.ABBBBBBBBBBBBBBC.',
    'ABBBBBBBBBBBBBBBBC',
    'ABkkkkkkkBBBrhBBBC',
    'ABkhhkkkkBBBBBBBBC',
    'ABkkkkkkkBBBBBBBBC',
    'ACCCCCCCCCCCCCCCCC',
    'ABBBBBBBBBBBBBBBBC',
    'ABBBBBBBCCCCBBBBBC',
    'ABBBBBBkkkkkkkkkBC',
    'ABBBBBBBwwBBBBBBBC',
    'ABBBBBBBwgBBBBBBBC',
    'AKKKKKKKKKKKKKKKKC',
    'ABBBBBBBBBBBBBBBBC',
    'ABBBBBBBBBBBBBBBBC',
    'ABBBCCCCCCCCCCBBBC',
    'ABBBCBBBBBBBBCBBBC',
    'ABBBCBBBBBBBBCBBBC',
    'ABBBCCCCCCCCCCBBBC',
    'ACCCCCCCCCCCCCCCCC',
    '.CCCCCCCCCCCCCCCC.',
  ]);

const TABLA: readonly Fila[] = [
  ['maquina-espresso', maquinaEspresso, hex('metal')],
  ['cafetera-individual', cafeteraIndividual, hex('tela-gris')],
  ['molinillo-cafe', molinillo],
  ['prensa-francesa', prensaFrancesa],
  ['cafetera-filtro', cafeteraFiltro],
  ['percolador', percolador],
  ['urna-cafe', urnaCafe],
  ['cafe-filtrado', cafeFiltrado],
  ['tetera-clasica', teteraClasica, hex('vidrio')],
  ['tetera-zen', teteraZen],
  ['filtro-vietnamita', filtroVietnamita],
  ['taza-te', tazaTe, hex('neutro', 3, 8)],
  ['tazon-te', tazonTe],
  ['vaso-termico', vasoTermico, hex('vidrio')],
  ['termo', termo, hex('planta')],
  ['botella-agua', botellaAgua],
  ['estacion-espresso', estacionEspresso],
];

export function cuadrosCafe11(): Cuadros {
  return registrarTabla(new Map(), TABLA);
}
