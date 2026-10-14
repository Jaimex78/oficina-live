/**
 * Otros colgantes del lote 12: tablero de corcho, seguridad, muebles de pared, chimenea, aire acondicionado, tuberías, ladrillo,
 * espejo, timón, trofeo, letrero de la marca, banderas y piezas de fiesta (Halloween, Navidad y Colombia).
 */

import { Lienzo, anchoTexto, dibujarTexto, rampa } from '../nucleo';
import type { ColorEntrada } from '../nucleo';
import { azar, entre, poligono } from './l2b-comun';
import { DORADO, ROBLE, centrar, marco, registrarTabla } from './l12-comun';
import type { Cuadros, Dibujo, Fila } from './l12-comun';

const dibCorcho: Dibujo = (l, W, H) => {
  const [x, y] = centrar(W, H, 58, 28);
  const i = marco(l, x, y, 58, 28, ROBLE, 2);
  l.rect(i.x, i.y, i.w, i.h, 'madera-clara-2');
  const r = azar(5);
  for (let k = 0; k < 60; k++) l.px(i.x + entre(r, 0, i.w - 1), i.y + entre(r, 0, i.h - 1), k % 3 === 0 ? 'madera-clara-1' : 'madera-clara-3');
  const notas: Array<[number, number, number, number, ColorEntrada]> = [
    [3, 3, 9, 8, 'tela-calida-3'], [16, 4, 8, 9, 'rojo-suave-4'], [28, 2, 10, 7, 'neutro-7'], [42, 5, 9, 9, 'vidrio-3'],
    [8, 14, 9, 8, 'planta-4'], [24, 16, 11, 7, 'neutro-6'], [38, 16, 8, 7, 'tela-calida-3'],
  ];
  for (const [nx, ny, nw, nh, c] of notas) {
    l.rect(i.x + nx, i.y + ny, nw, nh, c);
    l.rect(i.x + nx + nw - 1, i.y + ny + 1, 1, nh - 1, 'neutro-4');
    l.rect(i.x + nx + 1, i.y + ny + nh - 1, nw - 1, 1, 'neutro-4');
    for (let k = 3; k < nh - 2; k += 2) l.rect(i.x + nx + 1, i.y + ny + k, nw - 4, 1, 'neutro-3');
    l.px(i.x + nx + Math.floor(nw / 2), i.y + ny, 'rojo-3');
  }
};

const dibExtintor: Dibujo = (l) => {
  l.rect(9, 12, 14, 1, 'metal-1');
  l.rect(9, 22, 14, 1, 'metal-1');
  // Cuerpo rojo con luz a la izquierda, etiqueta y cabezal.
  l.rect(12, 10, 8, 18, 'rojo-3');
  l.rect(12, 10, 2, 18, 'rojo-4');
  l.rect(19, 11, 1, 17, 'rojo-2');
  l.rect(13, 27, 6, 1, 'rojo-1');
  l.rect(13, 3, 6, 3, 'neutro-2');
  l.rect(13, 3, 6, 1, 'neutro-4');
  l.rect(14, 6, 4, 4, 'metal-2');
  l.rect(14, 6, 1, 4, 'metal-3');
  l.rect(10, 3, 4, 2, 'neutro-1');
  l.rect(18, 4, 5, 1, 'neutro-1');
  l.linea(22, 5, 24, 9, 'neutro-1');
  l.linea(24, 9, 23, 15, 'neutro-1');
  l.rect(13, 15, 6, 6, 'neutro-7');
  l.rect(14, 16, 4, 1, 'rojo-3');
  l.rect(14, 18, 4, 1, 'neutro-4');
  l.rect(14, 20, 3, 1, 'neutro-4');
};

const dibEmergencia: Dibujo = (l) => {
  l.rect(9, 2, 14, 19, 'tela-calida-3');
  l.rect(9, 2, 14, 1, 'neutro-7');
  l.rect(9, 2, 1, 19, 'tela-calida-3');
  l.rect(22, 3, 1, 18, 'tela-calida-1');
  l.rect(10, 20, 13, 1, 'tela-calida-1');
  l.rect(11, 4, 10, 4, 'neutro-7');
  l.rect(12, 5, 8, 1, 'rojo-3');
  l.rect(12, 7, 5, 1, 'neutro-4');
  l.elipseSombreada(15.5, 14, 5, 5, ['rojo-1', 'rojo-2', 'rojo-3', 'rojo-4']);
  l.px(13, 12, 'neutro-7');
};

const dibArmario: Dibujo = (l) => {
  l.rect(3, 2, 58, 27, 'madera-oscura-2');
  l.rect(3, 2, 58, 1, 'madera-oscura-4');
  l.rect(3, 2, 1, 27, 'madera-oscura-3');
  l.rect(60, 3, 1, 26, 'madera-oscura-1');
  l.rect(4, 28, 57, 1, 'madera-oscura-1');
  for (const x of [6, 34]) {
    l.rect(x, 5, 24, 21, 'madera-oscura-1');
    l.rect(x + 1, 6, 22, 19, 'madera-oscura-2');
    l.rect(x + 1, 6, 22, 1, 'madera-oscura-3');
    l.rect(x + 1, 6, 1, 19, 'madera-oscura-3');
    l.rect(x + 3, 9, 18, 13, 'madera-oscura-1');
    l.rect(x + 4, 10, 16, 11, 'madera-oscura-2');
    l.rect(x + 4, 10, 16, 1, 'madera-oscura-1');
  }
  l.rect(28, 12, 2, 5, 'metal-3');
  l.rect(34, 12, 2, 5, 'metal-3');
  l.rect(29, 12, 1, 5, 'metal-1');
  l.rect(35, 12, 1, 5, 'metal-1');
  l.rect(31, 2, 2, 27, 'madera-oscura-0');
};

const LIBROS: ReadonlyArray<readonly [number, number, ColorEntrada, ColorEntrada]> = [
  [4, 9, 'rojo-suave-3', 'rojo-suave-4'], [3, 11, 'vidrio-1', 'vidrio-2'], [3, 8, 'planta-2', 'planta-3'], [4, 10, 'tela-calida-2', 'tela-calida-3'],
  [3, 12, 'morado-2', 'morado-3'], [3, 9, 'naranja-2', 'naranja-3'], [4, 11, 'neutro-3', 'neutro-5'], [3, 8, 'rojo-3', 'rojo-4'],
];
const dibRepisa: Dibujo = (l) => {
  let x = 4;
  for (const [w, h, c, luz] of LIBROS) {
    l.rect(x, 15 - h, w, h, c);
    l.rect(x, 15 - h, 1, h, luz);
    l.rect(x + 1, 15 - h + 2, w - 2, 1, luz);
    x += w;
  }
  // Libro recostado y una planta chica a la derecha.
  poligono(l, [[x + 1, 14], [x + 12, 11], [x + 12, 14]], 'vidrio-2');
  l.rect(x + 1, 13, 11, 1, 'neutro-6');
  l.rect(46, 8, 8, 7, 'maceta-terracota-2');
  l.rect(46, 8, 8, 1, 'maceta-terracota-3');
  l.hoja([50, 8], [46, 2], 4, rampa('planta').slice(1, 5));
  l.hoja([50, 8], [54, 2], 4, rampa('planta').slice(1, 5));
  l.hoja([50, 8], [50, 0.5], 4, rampa('hoja-pastel').slice(1, 5));
  // Tabla de la repisa.
  l.rect(2, 15, 60, 3, 'madera-clara-3');
  l.rect(2, 15, 60, 1, 'madera-clara-4');
  l.rect(3, 18, 58, 1, 'madera-clara-1');
  l.rect(61, 16, 1, 2, 'madera-clara-1');
};

const dibChimenea: Dibujo = (l, W, H) => {
  const pie = H - 3;
  // Repisa de mármol, cuerpo de piedra, abertura en arco con fuego y hogar.
  l.rect(2, 2, 60, 5, 'neutro-6');
  l.rect(2, 2, 60, 1, 'neutro-7');
  l.rect(2, 6, 60, 1, 'neutro-4');
  l.rect(5, 7, 54, pie - 8, 'cemento-3');
  l.rect(5, 7, 54, 1, 'cemento-2');
  l.rect(5, 7, 1, pie - 8, 'neutro-7');
  l.rect(58, 8, 1, pie - 9, 'cemento-1');
  for (const x of [8, 49]) {
    l.rect(x, 9, 7, pie - 11, 'cemento-2');
    l.rect(x, 9, 1, pie - 11, 'neutro-7');
    l.rect(x + 6, 10, 1, pie - 12, 'cemento-0');
    for (let k = 12; k < pie - 4; k += 4) l.rect(x + 2, k, 3, 1, 'cemento-1');
  }
  const abertura = (x: number, y: number): boolean => (y >= 24 && x >= 17 && x <= 46) || (y < 24 && Math.hypot(x - 31.5, y - 24) <= 15);
  for (let y = 9; y < pie - 1; y++) for (let x = 15; x <= 48; x++) if (abertura(x, y)) l.px(x, y, !abertura(x - 1, y) || !abertura(x, y - 1) ? 'neutro-3' : 'neutro-0');
  l.rect(19, pie - 6, 26, 5, 'maceta-terracota-1');
  l.rect(19, pie - 6, 26, 1, 'maceta-terracota-2');
  // Troncos y llamas.
  l.rect(21, pie - 8, 22, 3, 'madera-oscura-2');
  l.rect(21, pie - 8, 22, 1, 'madera-oscura-3');
  l.rect(21, pie - 6, 4, 1, 'madera-oscura-0');
  poligono(l, [[24, pie - 8], [28, pie - 22], [31, pie - 14], [34, pie - 26], [38, pie - 14], [41, pie - 20], [40, pie - 8]], 'rojo-3');
  poligono(l, [[27, pie - 8], [30, pie - 18], [32, pie - 13], [34, pie - 21], [37, pie - 12], [38, pie - 8]], 'naranja-3');
  poligono(l, [[30, pie - 8], [32, pie - 14], [34, pie - 17], [35, pie - 8]], 'tela-calida-3');
  l.rect(32, pie - 11, 2, 3, 'blanco');
  // Hogar de piedra al frente.
  l.rect(3, pie, 58, 2, 'cemento-3');
  l.rect(3, pie, 58, 1, 'neutro-7');
};

const dibAireAcond: Dibujo = (l) => {
  l.rect(3, 4, 58, 14, 'neutro-6');
  l.rect(3, 4, 58, 2, 'neutro-7');
  l.rect(3, 4, 1, 14, 'neutro-7');
  l.rect(60, 5, 1, 13, 'neutro-4');
  l.rect(4, 17, 57, 1, 'neutro-4');
  l.rect(5, 14, 54, 3, 'neutro-3');
  for (let x = 6; x < 58; x += 3) l.rect(x, 14, 2, 2, 'neutro-2');
  for (const y of [8, 10]) l.rect(6, y, 40, 1, 'neutro-5');
  l.rect(50, 7, 8, 4, 'neutro-2');
  l.rect(51, 8, 3, 1, 'planta-4');
  l.px(56, 8, 'rojo-3');
  l.rect(50, 10, 8, 1, 'neutro-3');
};

const dibTuberias: Dibujo = (l) => {
  const tubo = (x: number, y: number, w: number, h: number, tonos: readonly [ColorEntrada, ColorEntrada, ColorEntrada]): void => {
    l.rect(x, y, w, h, tonos[1]);
    if (w >= h) {
      l.rect(x, y, w, 1, tonos[2]);
      l.rect(x, y + h - 1, w, 1, tonos[0]);
    } else {
      l.rect(x, y, 1, h, tonos[2]);
      l.rect(x + w - 1, y, 1, h, tonos[0]);
    }
  };
  const ACERO: [ColorEntrada, ColorEntrada, ColorEntrada] = ['metal-1', 'metal-2', 'metal-3'];
  const COBRE: [ColorEntrada, ColorEntrada, ColorEntrada] = ['naranja-0', 'naranja-2', 'naranja-4'];
  tubo(0, 7, 58, 6, ACERO);
  tubo(52, 7, 6, 22, ACERO);
  tubo(0, 20, 52, 4, COBRE);
  tubo(26, 12, 4, 8, ACERO);
  for (const x of [8, 22, 42]) {
    l.rect(x, 5, 3, 10, 'neutro-2');
    l.rect(x, 5, 1, 10, 'neutro-4');
  }
  for (const x of [8, 34]) l.rect(x, 18, 3, 8, 'neutro-2');
  // Válvula roja y brida del codo.
  l.elipse(28, 16, 3, 1.5, 'rojo-3');
  l.rect(27, 13, 2, 3, 'metal-3');
  l.rect(51, 12, 8, 2, 'metal-3');
  l.rect(51, 5, 8, 2, 'metal-3');
  l.rect(51, 28, 8, 2, 'metal-3');
  l.px(1, 21, 'naranja-4');
};

const dibLadrillo: Dibujo = (l, W, H) => {
  const alto = H - 12;
  const r = azar(41);
  l.rect(1, 1, 62, alto, 'cemento-2');
  const tonos: ColorEntrada[] = ['maceta-terracota-1', 'maceta-terracota-2', 'maceta-terracota-2', 'maceta-terracota-3'];
  for (let fila = 0, y = 2; y + 3 <= alto; fila++, y += 4) {
    for (let x = fila % 2 === 0 ? 1 : -3; x < 63; x += 9) {
      const a = Math.max(1, x);
      const b = Math.min(62, x + 7);
      if (b <= a) continue;
      const c = tonos[entre(r, 0, tonos.length - 1)] as ColorEntrada;
      l.rect(a, y, b - a + 1, 3, c);
      l.rect(a, y, b - a + 1, 1, 'maceta-terracota-3');
      l.rect(a, y + 2, b - a + 1, 1, 'maceta-terracota-1');
    }
  }
  // Borde de arriba irregular: el revoque se cayó y deja ver el ladrillo en trozos.
  for (let x = 1; x < 63; x++) {
    const corte = 1 + ((x * 7 + (x >> 2)) % 4);
    l.rect(x, 1, 1, corte, null);
  }
  l.rect(1, alto, 62, 1, 'maceta-terracota-1');
};

const dibEspejo: Dibujo = (l) => {
  // Marco dorado con remate calado arriba y gota abajo; luna con destellos.
  const i = marco(l, 7, 5, 18, 31, DORADO, 3);
  for (let y = i.y; y < i.y + i.h; y++) {
    for (let x = i.x; x < i.x + i.w; x++) {
      const borde = x === i.x || y === i.y;
      l.px(x, y, borde ? 'vidrio-1' : y - i.y < i.h * 0.4 ? 'vidrio-3' : 'neutro-6');
    }
  }
  for (let k = 0; k < 6; k++) {
    l.px(i.x + 2 + k, i.y + 11 - k, 'blanco');
    l.px(i.x + 5 + k, i.y + 17 - k, 'neutro-7');
  }
  l.elipse(15.5, 4, 5, 2.5, 'tela-calida-2');
  l.elipse(15.5, 3, 3, 1.5, 'tela-calida-3');
  l.rect(14, 1, 4, 3, 'tela-calida-3');
  l.px(15, 1, 'blanco');
  poligono(l, [[12, 36], [20, 36], [17, 39], [15, 39]], 'tela-calida-2');
  l.rect(9, 6, 2, 2, 'tela-calida-3');
  l.rect(21, 6, 2, 2, 'tela-calida-3');
};

const dibTimon: Dibujo = (l) => {
  const cx = 15.5;
  const cy = 14.5;
  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI) / 4;
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    l.linea(Math.round(cx + dx * 2), Math.round(cy + dy * 2), Math.round(cx + dx * 9), Math.round(cy + dy * 9), 'madera-oscura-2');
    l.rect(Math.round(cx + dx * 11.5) - 1, Math.round(cy + dy * 11.5) - 1, 2, 2, 'tela-calida-2');
    l.px(Math.round(cx + dx * 11.5) - 1, Math.round(cy + dy * 11.5) - 1, 'tela-calida-3');
  }
  l.elipse(cx, cy, 9, 9, 'madera-oscura-1');
  l.elipse(cx, cy, 8, 8, 'madera-oscura-2');
  l.elipse(cx - 0.5, cy - 0.5, 7, 7, 'madera-oscura-3');
  l.elipse(cx, cy, 5.5, 5.5, 'madera-oscura-1');
  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI) / 4;
    l.linea(Math.round(cx + Math.cos(a) * 3), Math.round(cy + Math.sin(a) * 3), Math.round(cx + Math.cos(a) * 6), Math.round(cy + Math.sin(a) * 6), 'madera-oscura-2');
  }
  l.elipseSombreada(cx, cy, 2.5, 2.5, ['tela-calida-1', 'tela-calida-2', 'tela-calida-3']);
};

const dibTrofeo: Dibujo = (l) => {
  poligono(l, [[6, 2], [25, 2], [25, 18], [15.5, 28], [6, 18]], 'madera-oscura-2');
  poligono(l, [[8, 4], [23, 4], [23, 17], [15.5, 25], [8, 17]], 'madera-oscura-3');
  l.rect(6, 2, 20, 1, 'madera-oscura-4');
  // Copa dorada.
  l.rect(10, 6, 12, 1, 'tela-calida-3');
  l.rect(11, 7, 10, 5, 'tela-calida-2');
  l.rect(11, 7, 3, 5, 'tela-calida-3');
  l.rect(20, 8, 1, 4, 'tela-calida-1');
  l.rect(12, 12, 8, 1, 'tela-calida-1');
  l.rect(15, 13, 2, 4, 'tela-calida-2');
  l.rect(12, 17, 8, 2, 'tela-calida-2');
  l.rect(12, 17, 8, 1, 'tela-calida-3');
  l.linea(10, 7, 8, 8, 'tela-calida-2');
  l.px(8, 9, 'tela-calida-2');
  l.px(9, 10, 'tela-calida-2');
  l.linea(21, 7, 23, 8, 'tela-calida-2');
  l.px(23, 9, 'tela-calida-2');
  l.px(22, 10, 'tela-calida-2');
  l.rect(11, 20, 9, 2, 'tela-calida-2');
  l.rect(11, 20, 9, 1, 'tela-calida-3');
  l.px(13, 8, 'blanco');
};

const dibLetrero: Dibujo = (l) => {
  l.rect(2, 4, 92, 19, 'neutro-1');
  l.rect(2, 4, 92, 1, 'neutro-4');
  l.rect(2, 4, 1, 19, 'neutro-4');
  l.rect(93, 5, 1, 18, 'neutro-0');
  l.rect(3, 22, 91, 1, 'neutro-0');
  l.rectBorde(4, 6, 88, 15, 'neutro-3');
  // Marca de la plataforma (la casita de 3 x 3, de 11 x 11) y el nombre en dos líneas, centrados juntos.
  const nombre = anchoTexto('OFICINA');
  const total = 11 + 5 + nombre;
  const x0 = 4 + Math.floor((88 - total) / 2);
  for (const [i, j] of [[1, 0], [0, 1], [1, 1], [2, 1], [0, 2], [2, 2]] as const) l.rect(x0 + i * 4, 8 + j * 4, 3, 3, 'rojo-3');
  dibujarTexto(l, 'OFICINA', x0 + 16, 8, 'neutro-7');
  dibujarTexto(l, 'LIVE', x0 + 16, 14, 'rojo-3');
};

/** Bandera de pared de 24 x 17 colgada de una varilla con remates. */
function bandera(l: Lienzo, pintar: (l: Lienzo, x: number, y: number, w: number, h: number) => void): void {
  l.rect(2, 3, 28, 2, 'madera-clara-2');
  l.rect(2, 3, 28, 1, 'madera-clara-4');
  l.rect(1, 2, 2, 4, 'tela-calida-2');
  l.rect(29, 2, 2, 4, 'tela-calida-2');
  pintar(l, 4, 5, 24, 18);
  // Borde de abajo con una sombra suave.
  l.rect(4, 22, 24, 1, 'neutro-4');
}
const franjas = (l: Lienzo, x: number, y: number, w: number, h: number, c: readonly ColorEntrada[]): void => c.forEach((col, i) => l.rect(x, y + Math.round((i * h) / c.length), w, Math.round(((i + 1) * h) / c.length) - Math.round((i * h) / c.length), col));
const dibOrgullo: Dibujo = (l) => bandera(l, (l2, x, y, w, h) => franjas(l2, x, y, w, h, ['rojo-3', 'naranja-3', 'tela-calida-3', 'planta-3', 'vidrio-1', 'morado-2']));
const dibProgreso: Dibujo = (l) =>
  bandera(l, (l2, x, y, w, h) => {
    franjas(l2, x, y, w, h, ['rojo-3', 'naranja-3', 'tela-calida-3', 'planta-3', 'vidrio-1', 'morado-2']);
    const flecha = (k: number, c: ColorEntrada): void => void poligono(l2, [[x, y], [x + k, y + h / 2], [x, y + h]], c);
    flecha(11, 'neutro-1');
    flecha(9, 'madera-oscura-2');
    flecha(7.5, 'vidrio-3');
    flecha(6, 'rojo-suave-4');
    flecha(4, 'neutro-7');
  });
const dibPiratas: Dibujo = (l) =>
  bandera(l, (l2, x, y, w, h) => {
    l2.rect(x, y, w, h, 'neutro-1');
    l2.elipse(x + w / 2 - 0.5, y + 6, 4, 4, 'neutro-7');
    l2.rect(x + 9, y + 9, 6, 3, 'neutro-7');
    l2.rect(x + 9, y + 5, 2, 2, 'neutro-1');
    l2.rect(x + 13, y + 5, 2, 2, 'neutro-1');
    l2.px(x + 11, y + 8, 'neutro-1');
    for (const dx of [10, 12, 14]) l2.px(x + dx - 1, y + 11, 'neutro-1');
    l2.linea(x + 4, y + 12, x + w - 5, y + 17, 'neutro-6');
    l2.linea(x + 4, y + 17, x + w - 5, y + 12, 'neutro-6');
    for (const [a, b] of [[4, 12], [w - 5, 17], [4, 17], [w - 5, 12]] as const) l2.rect(x + a - 1, y + b - 1, 2, 2, 'neutro-6');
  });
const dibColombia: Dibujo = (l) =>
  bandera(l, (l2, x, y, w, h) => {
    l2.rect(x, y, w, Math.round(h / 2), 'tela-calida-3');
    l2.rect(x, y + Math.round(h / 2), w, Math.round(h / 4), 'vidrio-1');
    l2.rect(x, y + Math.round((h * 3) / 4), w, h - Math.round((h * 3) / 4), 'rojo-3');
  });

const SWAG = (x: number): number => 2 + Math.round(6 * Math.sin((Math.PI * (((x - 2) % 30) + 0.5)) / 30));
const dibBanderinesHalloween: Dibujo = (l) => {
  for (let x = 2; x < 62; x++) l.px(x, SWAG(x), 'neutro-3');
  const col: ColorEntrada[] = ['naranja-3', 'morado-2', 'neutro-2', 'naranja-3', 'morado-2', 'neutro-2', 'naranja-3'];
  for (let k = 0; k < 7; k++) {
    const x = 4 + k * 8;
    const y = SWAG(x + 3) + 1;
    poligono(l, [[x, y], [x + 7, y], [x + 3.5, y + 9]], col[k] as ColorEntrada);
    l.rect(x, y, 7, 1, k % 3 === 0 ? 'naranja-4' : k % 3 === 1 ? 'morado-3' : 'neutro-4');
    // Cara de calabaza, murciélago o fantasma, de 3 px.
    const cx = x + 3;
    if (k % 3 === 0) {
      l.px(cx - 1, y + 3, 'neutro-1');
      l.px(cx + 1, y + 3, 'neutro-1');
      l.px(cx, y + 5, 'neutro-1');
    } else if (k % 3 === 1) {
      l.rect(cx - 2, y + 3, 5, 1, 'neutro-1');
      l.px(cx - 1, y + 4, 'neutro-1');
      l.px(cx + 1, y + 4, 'neutro-1');
    } else {
      l.rect(cx - 1, y + 2, 3, 3, 'neutro-7');
      l.px(cx - 1, y + 3, 'neutro-1');
      l.px(cx + 1, y + 3, 'neutro-1');
    }
  }
};

const dibTrenzaAjo: Dibujo = (l) => {
  l.rect(14, 1, 4, 3, 'rojo-3');
  l.rect(14, 1, 4, 1, 'rojo-4');
  l.rect(13, 3, 6, 1, 'madera-clara-3');
  // Tallo trenzado y bulbos que alternan a cada lado.
  for (let y = 4; y < 22; y++) l.px(15 + (y % 4 < 2 ? 0 : 1), y, y % 2 === 0 ? 'madera-clara-3' : 'madera-clara-2');
  for (let k = 0; k < 6; k++) {
    const y = 6 + k * 4;
    const x = k % 2 === 0 ? 8 : 17;
    l.elipseSombreada(x + 3, y + 2, 3.5, 3, ['crema-1', 'crema-3', 'crema-4', 'neutro-7']);
    l.px(x + 4, y + 4, 'morado-4');
    l.px(x + 3, y - 1, 'madera-clara-3');
  }
  l.elipseSombreada(15.5, 25, 4, 3.5, ['crema-1', 'crema-3', 'crema-4', 'neutro-7']);
  l.px(15, 27, 'morado-4');
  l.linea(15, 27, 14, 29, 'madera-clara-2');
  l.linea(16, 27, 17, 29, 'madera-clara-2');
};

const dibCopos: Dibujo = (l) => {
  const cx = 15.5;
  const cy = 15.5;
  for (let k = 0; k < 6; k++) {
    const a = (k * Math.PI) / 3 - Math.PI / 2;
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    l.linea(Math.round(cx), Math.round(cy), Math.round(cx + dx * 13), Math.round(cy + dy * 13), 'neutro-7');
    for (const t of [6, 9]) {
      const bx = cx + dx * t;
      const by = cy + dy * t;
      for (const s of [-1, 1]) {
        const b = a + s * (Math.PI / 3);
        l.linea(Math.round(bx), Math.round(by), Math.round(bx + Math.cos(b) * 3.5), Math.round(by + Math.sin(b) * 3.5), 'vidrio-3');
      }
    }
    l.px(Math.round(cx + dx * 14), Math.round(cy + dy * 14), 'neutro-7');
  }
  l.elipse(cx, cy, 1.5, 1.5, 'neutro-7');
  l.px(Math.round(cx), Math.round(cy), 'vidrio-2');
};

export const TABLA_OTROS: readonly Fila[] = [
  ['tablero-corcho-grande', dibCorcho],
  ['extintor', dibExtintor],
  ['boton-emergencia', dibEmergencia],
  ['armario-pared', dibArmario, rampa('madera-oscura')],
  ['repisa-flotante', dibRepisa],
  ['chimenea-antigua', dibChimenea],
  ['aire-acondicionado-pared', dibAireAcond],
  ['tuberias', dibTuberias],
  ['pared-ladrillo', dibLadrillo],
  ['espejo-chippendale', dibEspejo],
  ['timon-barco', dibTimon],
  ['placa-trofeo', dibTrofeo],
  ['letrero-oficina-live', dibLetrero],
  ['bandera-orgullo', dibOrgullo],
  ['bandera-progreso', dibProgreso],
  ['bandera-piratas', dibPiratas],
  ['bandera-colombia-pared', dibColombia],
  ['banderines-halloween', dibBanderinesHalloween],
  ['trenza-ajo', dibTrenzaAjo],
  ['copos-pared', dibCopos],
];

export function cuadrosOtros12(): Cuadros {
  return registrarTabla(new Map(), TABLA_OTROS);
}

