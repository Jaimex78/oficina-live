/**
 * Plantas de pared, jardinera de ventana y paneles acústicos del lote 12.
 */

import { Lienzo, rampa } from '../nucleo';
import type { ColorEntrada } from '../nucleo';
import { azar, entre } from './l2b-comun';
import { NOGAL, centrar, marco, registrarTabla } from './l12-comun';
import type { Cuadros, Dibujo, Fila } from './l12-comun';

const VERDES = rampa('planta').slice(1, 5);
const PASTEL = rampa('hoja-pastel').slice(1, 5);

/** Relleno de follaje: manchas de tres verdes repartidas con una semilla fija. */
function follaje(l: Lienzo, x: number, y: number, w: number, h: number, semilla: number, tonos: readonly ColorEntrada[]): void {
  const r = azar(semilla);
  l.rect(x, y, w, h, tonos[1] as ColorEntrada);
  for (let i = 0; i < (w * h) / 5; i++) {
    const px = x + entre(r, 0, w - 2);
    const py = y + entre(r, 0, h - 2);
    const t = tonos[entre(r, 0, tonos.length - 1)] as ColorEntrada;
    l.rect(px, py, 2, 2, t);
    l.px(px, py, tonos[tonos.length - 1] as ColorEntrada);
  }
}

const dibMusgo: Dibujo = (l, W, H) => {
  const [x, y] = centrar(W, H, 58, 26);
  const i = marco(l, x, y, 58, 26, NOGAL, 2);
  follaje(l, i.x, i.y, i.w, i.h, 11, [rampa('planta')[1] as string, rampa('planta')[2] as string, rampa('cesped')[1] as string, rampa('cesped')[2] as string, rampa('planta')[3] as string]);
  // Un par de hongos y brotes claros que rompen la mancha.
  for (const [px, py] of [[10, 6], [30, 15], [47, 8]] as const) l.px(i.x + px, i.y + py, 'cesped-3');
};

const dibMuroPlantas: Dibujo = (l, W, H) => {
  l.rect(2, 1, 60, 29, 'planta-0');
  l.rect(2, 1, 60, 1, 'planta-1');
  const r = azar(23);
  for (let k = 0; k < 26; k++) {
    const bx = entre(r, 6, 58);
    const by = entre(r, 12, 30);
    const largo = entre(r, 6, 13);
    const ang = (entre(r, 0, 120) - 60) * (Math.PI / 180);
    l.hoja([bx, by], [bx + Math.sin(ang) * largo, by - Math.cos(ang) * largo], entre(r, 4, 6), k % 3 === 0 ? PASTEL : VERDES);
  }
  for (const [fx, fy] of [[10, 8], [28, 5], [44, 10], [54, 6], [20, 16]] as const) {
    l.rect(fx, fy, 2, 2, 'rojo-suave-3');
    l.px(fx, fy, 'rojo-suave-4');
  }
  // Cajón de madera de abajo.
  l.rect(2, 30, 60, 8, 'madera-oscura-2');
  l.rect(2, 30, 60, 1, 'madera-oscura-3');
  l.rect(2, 37, 60, 1, 'madera-oscura-1');
  for (const x of [20, 41]) l.rect(x, 31, 1, 6, 'madera-oscura-1');
  l.rect(2, 31, 1, 7, 'madera-oscura-3');
};

const dibPlantaChica: Dibujo = (l) => {
  // Maceta de barro media luna pegada a la pared, con un abanico de hojas.
  l.linea(15, 1, 15, 8, 'neutro-3');
  l.rect(12, 8, 8, 1, 'metal-2');
  l.hoja([15.5, 20], [8, 11], 5, VERDES);
  l.hoja([15.5, 20], [23, 11], 5, VERDES);
  l.hoja([15.5, 20], [12, 6], 5, PASTEL);
  l.hoja([15.5, 20], [19, 6], 5, PASTEL);
  l.hoja([15.5, 20], [15.5, 4], 5, VERDES);
  l.rect(10, 19, 12, 2, 'maceta-terracota-3');
  l.rect(10, 19, 12, 1, 'maceta-terracota-3');
  l.rect(11, 21, 10, 5, 'maceta-terracota-2');
  l.rect(11, 21, 1, 5, 'maceta-terracota-3');
  l.rect(20, 21, 1, 5, 'maceta-terracota-1');
  l.rect(13, 26, 6, 1, 'maceta-terracota-1');
};

const dibPotos: Dibujo = (l) => {
  l.linea(15, 1, 15, 3, 'neutro-3');
  // Maceta chica arriba y enredaderas que cuelgan con hojas en forma de corazón.
  l.rect(10, 3, 12, 2, 'maceta-terracota-3');
  l.rect(11, 5, 10, 5, 'maceta-terracota-2');
  l.rect(11, 5, 1, 5, 'maceta-terracota-3');
  l.rect(20, 5, 1, 5, 'maceta-terracota-1');
  l.rect(12, 10, 8, 1, 'maceta-terracota-1');
  const hebras: Array<[number, number, number]> = [[11, 11, 22], [14, 11, 30], [17, 11, 26], [20, 11, 33], [9, 10, 16], [22, 10, 19]];
  for (const [x, y0, largo] of hebras) {
    for (let j = 0; j < largo; j++) l.px(x + Math.round(Math.sin(j / 3 + x) * 1), y0 + j, 'planta-1');
    for (let j = 3; j < largo; j += 5) {
      const px = x + Math.round(Math.sin(j / 3 + x) * 1);
      const lado = (j + x) % 2 === 0 ? 1 : -2;
      l.rect(px + lado, y0 + j, 2, 2, j % 10 === 3 ? 'planta-3' : 'planta-2');
      l.px(px + lado, y0 + j, 'planta-4');
    }
  }
  l.rect(8, 9, 3, 2, 'planta-3');
  l.rect(21, 9, 3, 2, 'planta-3');
};

const dibJardineraPared: Dibujo = (l) => {
  // Cajón metálico sobre ménsulas, con tres plantas y flores.
  argolla(l);
  l.rect(5, 18, 22, 8, 'metal-2');
  l.rect(5, 18, 22, 1, 'metal-3');
  l.rect(5, 18, 1, 8, 'metal-3');
  l.rect(26, 19, 1, 7, 'metal-1');
  l.rect(6, 25, 21, 1, 'metal-1');
  l.rect(7, 20, 18, 1, 'metal-1');
  l.rect(8, 26, 2, 3, 'neutro-2');
  l.rect(22, 26, 2, 3, 'neutro-2');
  for (const [cx, h] of [[9, 8], [16, 12], [23, 9]] as const) {
    l.hoja([cx, 18], [cx - 4, 18 - h], 5, VERDES);
    l.hoja([cx, 18], [cx + 4, 18 - h + 1], 5, PASTEL);
    l.hoja([cx, 18], [cx, 17 - h], 4, VERDES);
  }
  for (const [fx, fy] of [[7, 8], [15, 4], [24, 7], [19, 9]] as const) {
    l.rect(fx, fy, 2, 2, 'rojo-suave-3');
    l.px(fx, fy, 'rojo-suave-4');
  }
};
/** Aro de metal con el que se cuelga la jardinera. */
function argolla(l: Lienzo): void {
  l.linea(15, 1, 15, 4, 'neutro-3');
  l.rect(13, 4, 5, 1, 'metal-2');
}

const dibJardineraVentana: Dibujo = (l) => {
  // Cajón de madera con tablones, tierra y flores sobre las hojas.
  l.rect(2, 15, 28, 7, 'madera-clara-2');
  l.rect(2, 15, 28, 1, 'madera-clara-4');
  l.rect(2, 15, 1, 7, 'madera-clara-3');
  l.rect(29, 16, 1, 6, 'madera-clara-1');
  l.rect(3, 21, 27, 1, 'madera-clara-1');
  l.rect(3, 18, 26, 1, 'madera-clara-1');
  l.rect(3, 16, 26, 1, 'madera-oscura-2');
  for (let x = 3; x < 29; x++) {
    const h = 2 + ((x * 5) % 4);
    l.rect(x, 15 - h, 1, h, (x * 3) % 5 === 0 ? 'planta-4' : (x * 3) % 5 === 1 ? 'planta-2' : 'planta-3');
  }
  for (const x of [5, 10, 15, 20, 25]) {
    const y = 8 + ((x * 3) % 4);
    l.rect(x, y, 3, 3, 'rojo-suave-3');
    l.px(x, y, 'rojo-suave-4');
    l.px(x + 1, y + 1, 'tela-calida-3');
    l.px(x + 2, y + 2, 'rojo-suave-2');
  }
};

const dibPaneles: Dibujo = (l) => {
  for (let k = 0; k < 4; k++) {
    for (let fila = 0; fila < 2; fila++) {
      const x = 3 + k * 15;
      const y = 2 + fila * 15;
      l.rect(x, y, 13, 13, 'hoja-pastel-3');
      l.rect(x, y, 13, 1, 'hoja-pastel-4');
      l.rect(x, y, 1, 13, 'hoja-pastel-4');
      l.rect(x + 12, y + 1, 1, 12, 'hoja-pastel-1');
      l.rect(x + 1, y + 12, 12, 1, 'hoja-pastel-1');
      for (let c = 3; c < 12; c += 2) l.rect(x + c, y + 2, 1, 9, 'hoja-pastel-2');
    }
  }
};

export const TABLA_PLANTAS: readonly Fila[] = [
  ['muro-musgo', dibMusgo],
  ['muro-plantas', dibMuroPlantas],
  ['planta-pared-chica', dibPlantaChica],
  ['potos-colgante', dibPotos],
  ['jardinera-pared', dibJardineraPared],
  ['jardinera-ventana', dibJardineraVentana, rampa('rojo-suave')],
  ['paneles-acusticos', dibPaneles, rampa('hoja-pastel')],
];

export function cuadrosPlantas12(): Cuadros {
  return registrarTabla(new Map(), TABLA_PLANTAS);
}
