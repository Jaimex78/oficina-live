/**
 * Lote 11, comida de almuerzo (26 objetos): pizza, hamburguesa, sushi, sopas, carnes, panes y platos para llevar.
 * Todo va servido sobre un plato, un cuenco o una tabla y se apoya en la fila `pieA(0)` = 14.
 */

import type { Lienzo } from '../nucleo';
import type { Hacer, Fila } from './l11-comun';
import { dib, hex, pintar, plato, registrarTabla, tonosDe } from './l11-comun';
import type { Cuadros } from './l11-comun';

type L = Lienzo;
const bola = (l: L, cx: number, cy: number, rx: number, ry: number, rampa: string, a = 1, b = 4): void => {
  l.elipseSombreada(cx, cy, rx, ry, tonosDe(rampa, a, b));
};

/** Cuenco blanco o de color visto de frente y un poco desde arriba. `dentro` es el relleno de la boca. */
function bowl(l: L, fb: number, rx: number, h: number, fuera: readonly string[], dentro: string, cx = 15): number {
  for (let j = 0; j < h; j++) {
    const ancho = Math.round(rx * (1 - 0.3 * (j / Math.max(1, h - 1))));
    const y = fb - h + 1 + j;
    l.rect(cx - ancho, y, ancho * 2 + 1, 1, fuera[1] as string);
    l.px(cx - ancho, y, fuera[2] as string);
    l.px(cx + ancho, y, fuera[0] as string);
    if (j === h - 1) l.rect(cx - ancho, y, ancho * 2 + 1, 1, fuera[0] as string);
  }
  const ry = Math.max(2, Math.round(rx / 3));
  const yb = fb - h + 1;
  l.elipse(cx, yb, rx, ry, fuera[2] as string);
  l.elipse(cx, yb, rx - 1, ry - 1, dentro);
  return yb;
}
const BLANCO = ['neutro-4', 'neutro-6', 'neutro-7'];

const pizza: Hacer = () =>
  dib('pizza', (l, fb) => {
    // Tabla redonda, masa con borde, queso, pepperoni y albahaca.
    l.elipseSombreada(15, fb - 5, 13, 7, tonosDe('madera-oscura', 1, 4));
    l.elipseSombreada(15, fb - 6, 11, 6, tonosDe('madera-clara', 1, 4));
    l.elipse(15, fb - 6, 9, 4, 'tela-calida-2');
    l.elipse(15, fb - 6, 8, 3, 'tela-calida-3');
    for (const [x, y] of [[11, fb - 7], [16, fb - 9], [19, fb - 6], [13, fb - 4], [17, fb - 4], [22, fb - 8]] as const) {
      l.rect(x, y, 3, 2, 'rojo-suave-2');
      l.px(x, y, 'rojo-suave-3');
    }
    for (const [x, y] of [[14, fb - 7], [20, fb - 8], [10, fb - 5]] as const) l.px(x, y, 'planta-3');
    // Un corte de rebanada.
    l.linea(15, fb - 6, 25, fb - 8, 'madera-clara-2');
    l.linea(15, fb - 6, 22, fb - 2, 'madera-clara-2');
  });

const hamburguesaPapas: Hacer = () =>
  dib('hamburguesa-papas', (l, fb) => {
    // Bandeja, hamburguesa de pan con ajonjolí y cajita de papas.
    l.rect(2, fb - 2, 28, 3, 'rojo-suave-2');
    l.rect(2, fb - 2, 28, 1, 'rojo-suave-3');
    l.rect(2, fb, 28, 1, 'rojo-suave-1');
    pintar(l, 4, fb - 12, [
      '..nbbbbbn..',
      '.nbpbbpbbn.',
      'nbbbbbbbbbN',
      'NNNNNNNNNNN',
      '.hGhGhGhGh.',
      'YYYYYYYYYYY',
      'OOOOOOOOOOO',
      'QQQQQQQQQQQ',
      'nnnnnnnnnnn',
      '.NNNNNNNNN.',
    ]);
    pintar(l, 19, fb - 12, [
      'Y.Yy.Y.Yy',
      'YyYYyYyYy',
      'YyYYyYyYy',
      '.2222222.',
      '.2w222w2.',
      '.2222222.',
      '..22222..',
    ]);
  });

const ensalada: Hacer = () =>
  dib('ensalada', (l, fb) => {
    const yb = bowl(l, fb, 11, 6, BLANCO, 'planta-1');
    // Montículo de hojas con tomate, pepino y zanahoria.
    bola(l, 11, yb - 1, 5, 4, 'hoja-pastel', 1, 4);
    bola(l, 19, yb - 1, 5, 4, 'planta', 1, 4);
    bola(l, 15, yb - 3, 6, 4, 'planta', 2, 4);
    for (const [x, y] of [[11, yb - 3], [18, yb - 2], [14, yb - 6]] as const) {
      l.rect(x, y, 2, 2, 'rojo-suave-3');
      l.px(x, y, 'rojo-suave-4');
    }
    l.px(20, yb - 5, 'naranja-3');
    l.px(9, yb - 1, 'naranja-3');
    l.px(16, yb - 1, 'hoja-pastel-4');
  });

const bandejaSushi: Hacer = () =>
  dib('bandeja-sushi', (l, fb) => {
    // Bandeja de madera con tres makis, dos nigiri, wasabi y jengibre.
    l.rect(3, fb - 9, 26, 10, 'madera-oscura-2');
    l.rect(3, fb - 9, 26, 1, 'madera-oscura-3');
    l.rect(3, fb - 9, 1, 10, 'madera-oscura-3');
    l.rect(3, fb, 26, 1, 'madera-oscura-1');
    l.rect(28, fb - 9, 1, 10, 'madera-oscura-1');
    for (const [x, c] of [[9, 'naranja-3'], [15, 'rojo-suave-3'], [21, 'planta-3']] as const) {
      l.elipseSombreada(x, fb - 6, 3, 3, ['neutro-1', 'neutro-2', 'neutro-3']);
      l.elipse(x, fb - 6, 2, 2, 'neutro-7');
      l.px(x, fb - 6, c);
      l.px(x - 1, fb - 7, c);
    }
    for (const [x, c] of [[10, 'rojo-suave-3'], [19, 'naranja-3']] as const) {
      l.rect(x - 2, fb - 3, 6, 3, 'neutro-7');
      l.rect(x - 2, fb - 4, 6, 2, c);
      l.rect(x - 2, fb - 4, 6, 1, c === 'rojo-suave-3' ? 'rojo-suave-4' : 'naranja-4');
      l.px(x + 3, fb - 1, 'neutro-5');
    }
    l.rect(25, fb - 5, 3, 3, 'planta-3');
    l.px(25, fb - 5, 'planta-4');
    l.rect(24, fb - 2, 4, 1, 'rojo-suave-4');
  });

const ramen: Hacer = () =>
  dib('ramen', (l, fb) => {
    const yb = bowl(l, fb, 11, 7, ['rojo-suave-1', 'rojo-suave-2', 'rojo-suave-3'], 'naranja-2');
    // Caldo, fideos, huevo, alga y cebollín.
    l.elipse(15, yb, 9, 3, 'naranja-3');
    for (let i = 0; i < 6; i++) l.linea(8 + i * 2, yb - 1, 9 + i * 2, yb + 1, 'tela-calida-3');
    l.elipseSombreada(18, yb - 1, 3, 2, tonosDe('neutro', 4, 7));
    l.px(18, yb - 1, 'tela-calida-2');
    l.rect(11, yb - 4, 3, 5, 'neutro-1');
    l.rect(11, yb - 4, 1, 5, 'neutro-3');
    for (const [x, y] of [[14, yb - 1], [21, yb], [13, yb + 1]] as const) l.px(x, y, 'planta-3');
    // Palillos apoyados en el borde.
    l.linea(21, yb - 8, 25, yb - 2, 'madera-clara-3');
    l.linea(23, yb - 8, 27, yb - 2, 'madera-clara-2');
  });

const fideosLlevar: Hacer = () =>
  dib('fideos-llevar', (l, fb) => {
    pintar(l, 9, fb - 12, [
      '.YyYYyYyYy.',
      'yYyYyYyYyYy',
      'YyYYyYYyYYy',
      'wwwwwwwwwww',
      '.wwwwwwwwwl.'.slice(0, 11),
      '.wwwrrwwwl.',
      '.wwwrrwwwl.',
      '..wwrrwwl..',
      '..wwwwwgl..',
      '...gggggg..'.slice(0, 11),
    ]);
    l.linea(21, fb - 14, 18, fb - 8, 'madera-clara-3');
    l.linea(23, fb - 14, 20, fb - 8, 'madera-clara-2');
    l.linea(10, fb - 9, 18, fb - 9, 'metal-2');
  });

const dumplings: Hacer = () =>
  dib('dumplings', (l, fb) => {
    // Vaporera de bambú con tres empanadillas asomando.
    l.rect(5, fb - 8, 21, 9, 'madera-clara-2');
    for (let x = 7; x < 25; x += 4) l.rect(x, fb - 7, 1, 8, 'madera-clara-1');
    l.rect(5, fb - 8, 21, 1, 'madera-clara-4');
    l.rect(5, fb - 4, 21, 1, 'madera-clara-1');
    l.rect(25, fb - 8, 1, 9, 'madera-clara-1');
    l.rect(5, fb, 21, 1, 'madera-clara-0');
    l.elipseSombreada(15, fb - 9, 11, 3, tonosDe('madera-clara', 1, 4));
    l.elipse(15, fb - 9, 9, 2, 'madera-clara-1');
    for (const x of [9, 15, 21]) {
      l.elipseSombreada(x, fb - 10, 3, 3, tonosDe('neutro', 4, 7));
      l.px(x - 1, fb - 12, 'neutro-5');
      l.px(x + 1, fb - 12, 'neutro-5');
      l.px(x, fb - 12, 'neutro-5');
    }
  });

const kebab: Hacer = () =>
  dib('kebab', (l, fb) => {
    plato(l, 15, fb, 14, 3);
    // Brocheta de pimentón, carne, cebolla y tomate sobre el plato.
    l.rect(2, fb - 6, 28, 1, 'madera-clara-3');
    l.rect(2, fb - 7, 28, 1, 'madera-clara-4');
    l.rect(2, fb - 5, 2, 1, 'madera-clara-2');
    const bloques: [number, string[]][] = [
      [5, ['planta-2', 'planta-3', 'planta-4']],
      [10, ['madera-oscura-1', 'madera-oscura-2', 'madera-oscura-4']],
      [15, ['rojo-suave-1', 'rojo-suave-2', 'rojo-suave-4']],
      [20, ['morado-1', 'morado-2', 'morado-4']],
      [25, ['madera-oscura-1', 'madera-oscura-2', 'madera-oscura-4']],
    ];
    for (const [x, t] of bloques) {
      l.rect(x, fb - 10, 4, 7, t[1] as string);
      l.rect(x, fb - 10, 1, 7, t[2] as string);
      l.rect(x + 3, fb - 10, 1, 7, t[0] as string);
      l.rect(x, fb - 4, 4, 1, t[0] as string);
    }
  });

const panini: Hacer = () =>
  dib('panini', (l, fb) => {
    plato(l, 15, fb, 13, 3);
    pintar(l, 7, fb - 10, [
      '..bbbbbbbbbbbb..',
      '.bNbnNbnNbnNbnb.',
      'nbbbbbbbbbbbbbbn',
      'nGhGhGhGhGhGhGhn',
      'nYYYYYYYYYYYYYYn',
      'nrrrrrrrrrrrrrrn',
      'nbbbbbbbbbbbbbbn',
      '.nnnnnnnnnnnnnn.',
    ]);
  });

const tablaQuesos: Hacer = () =>
  dib('tabla-quesos', (l, fb) => {
    l.rectRedondeado(2, fb - 11, 28, 12, 3, 'madera-oscura-2');
    l.rect(4, fb - 11, 22, 1, 'madera-oscura-3');
    l.rect(4, fb, 24, 1, 'madera-oscura-1');
    // Cuña de queso con agujeros, salame, uvas, galletas y albahaca.
    pintar(l, 5, fb - 9, [
      '...YYYYY',
      '..YYjYYY',
      '.YYYYYjY',
      'YjYYYYYY',
      'jjjjjjjj',
    ]);
    l.px(7, fb - 6, 'tela-calida-0');
    l.px(10, fb - 8, 'tela-calida-0');
    for (const [x, y] of [[16, fb - 8], [18, fb - 6], [21, fb - 8]] as const) {
      l.elipseSombreada(x, y, 3, 3, tonosDe('rojo-suave', 0, 3));
      l.px(x - 1, y, 'neutro-5');
      l.px(x + 1, y - 1, 'neutro-5');
    }
    for (const [x, y] of [[8, fb - 3], [10, fb - 2], [9, fb - 4], [11, fb - 4], [12, fb - 3]] as const) l.rect(x, y, 2, 2, 'morado-2');
    for (const [x, y] of [[8, fb - 3], [10, fb - 4], [12, fb - 3]] as const) l.px(x, y, 'morado-4');
    l.rect(16, fb - 3, 3, 3, 'madera-clara-3');
    l.rect(20, fb - 3, 3, 3, 'madera-clara-3');
    l.rect(24, fb - 5, 3, 3, 'madera-clara-3');
    l.px(16, fb - 3, 'madera-clara-4');
    l.px(20, fb - 3, 'madera-clara-4');
    l.px(24, fb - 5, 'madera-clara-4');
    l.hoja([25, fb - 8], [27, fb - 10], 2, ['planta-2', 'planta-3', 'planta-4']);
  });

const panRustico: Hacer = () =>
  dib('pan-rustico', (l, fb) => {
    l.elipseSombreada(15, fb - 5, 12, 6, tonosDe('madera-clara', 0, 4));
    // Cortes de la masa y harina por encima.
    for (const [x, y] of [[9, fb - 9], [14, fb - 10], [19, fb - 9]] as const) {
      l.linea(x, y, x + 3, y + 5, 'madera-clara-4');
      l.linea(x + 1, y, x + 4, y + 5, 'madera-clara-1');
    }
    for (const [x, y] of [[8, fb - 6], [12, fb - 7], [17, fb - 5], [22, fb - 7], [20, fb - 3]] as const) l.px(x, y, 'neutro-7');
  });

const bolsaAlmuerzo: Hacer = () =>
  dib('bolsa-almuerzo', (l, fb) => {
    pintar(l, 9, fb - 13, [
      '..nNnNnNnNn.',
      '.nNnNnNnNnN.',
      '.nbbbbbbbbN.',
      '.bpbbbbbbbN.',
      '.bpbbbbbbbN.',
      '.bpbbbbbbbN.',
      '.bpbbbbbbbN.',
      '.bpbbrbrbbN.',
      '.bpbbrrrbbN.',
      '.bpbbbrbbbN.',
      '.bpbbbbbbbN.',
      '.nbbbbbbbbN.',
      '.NNNNNNNNNN.',
    ]);
  });

const macarronesQueso: Hacer = () =>
  dib('macarrones-queso', (l, fb) => {
    const yb = bowl(l, fb, 11, 6, ['azul-oficina-1', 'azul-oficina-2', 'azul-oficina-3'], 'naranja-2');
    l.elipseSombreada(15, yb - 1, 9, 4, tonosDe('naranja', 1, 4));
    for (const [x, y] of [[10, yb - 1], [13, yb - 3], [17, yb - 2], [20, yb], [15, yb + 1], [12, yb + 1]] as const) {
      l.px(x, y, 'naranja-1');
      l.px(x + 1, y, 'naranja-1');
      l.px(x, y + 1, 'naranja-4');
    }
    l.rect(12, yb - 4, 6, 1, 'madera-clara-3');
    l.px(14, yb - 5, 'madera-clara-3');
    l.px(16, yb - 5, 'madera-clara-2');
  });

const bowlAcai: Hacer = () =>
  dib('bowl-acai', (l, fb) => {
    const yb = bowl(l, fb, 11, 6, BLANCO, 'morado-1');
    l.elipseSombreada(15, yb - 1, 9, 4, tonosDe('morado', 0, 3));
    // Plátano, fresa, granola y arándanos.
    for (const x of [9, 11, 13]) {
      l.rect(x, yb - 3, 2, 3, 'tela-calida-3');
      l.px(x, yb - 3, 'neutro-7');
    }
    l.elipseSombreada(18, yb - 2, 2, 2, tonosDe('rojo-suave', 1, 4));
    l.elipseSombreada(21, yb - 1, 2, 2, tonosDe('rojo-suave', 1, 4));
    for (const [x, y] of [[15, yb - 3], [16, yb - 2], [14, yb - 1], [17, yb]] as const) l.rect(x, y, 2, 1, 'madera-clara-3');
    for (const [x, y] of [[12, yb + 1], [19, yb + 1], [15, yb + 1]] as const) l.px(x, y, 'vidrio-1');
  });

const sopa = (id: string, fuera: readonly string[], caldo: readonly string[], extra: (l: L, yb: number) => void): Hacer => () =>
  dib(id, (l, fb) => {
    const yb = bowl(l, fb, 11, 6, fuera, caldo[0] as string);
    l.elipse(15, yb, 9, 3, caldo[1] as string);
    l.elipse(14, yb - 1, 5, 1, caldo[2] as string);
    extra(l, yb);
  });

const sopaAlmejas = sopa('sopa-almejas', ['neutro-4', 'neutro-6', 'neutro-7'], ['crema-1', 'crema-3', 'crema-4'], (l, yb) => {
  for (const [x, y] of [[11, yb], [18, yb - 1], [14, yb + 1], [20, yb + 1]] as const) {
    l.rect(x, y, 2, 1, 'crema-1');
    l.px(x, y, 'crema-2');
  }
  for (const [x, y] of [[13, yb - 1], [16, yb + 1], [21, yb]] as const) l.px(x, y, 'planta-3');
  l.rect(9, yb - 3, 3, 2, 'madera-clara-3');
  l.rect(22, yb - 3, 3, 2, 'madera-clara-3');
});

const sopaTomate = sopa('sopa-tomate', ['azul-oficina-1', 'azul-oficina-2', 'azul-oficina-3'], ['rojo-suave-1', 'rojo-suave-2', 'rojo-suave-3'], (l, yb) => {
  l.linea(11, yb, 19, yb - 1, 'neutro-7');
  l.linea(12, yb + 1, 18, yb, 'neutro-6');
  l.hoja([18, yb], [22, yb - 4], 3, ['planta-2', 'planta-3', 'planta-4']);
  l.px(13, yb - 1, 'rojo-suave-4');
});

const coxinha: Hacer = () =>
  dib('coxinha', (l, fb) => {
    plato(l, 15, fb, 11, 3);
    // Gota de masa dorada y frita.
    const anchos = [2, 4, 6, 8, 10, 10, 10, 8, 6];
    anchos.forEach((a, j) => {
      const y = fb - 12 + j;
      l.rect(15 - Math.floor(a / 2), y, a, 1, 'madera-clara-2');
      l.px(15 - Math.floor(a / 2), y, 'madera-clara-3');
      l.px(15 - Math.floor(a / 2) + a - 1, y, 'madera-clara-1');
      if (a > 6) l.px(15 - Math.floor(a / 2) + a - 2, y, 'madera-clara-1');
    });
    l.rect(13, fb - 10, 2, 1, 'madera-clara-4');
    l.rect(11, fb - 8, 2, 1, 'madera-clara-4');
    l.px(14, fb - 6, 'madera-clara-4');
  });

const tabule: Hacer = () =>
  dib('tabule', (l, fb) => {
    const yb = bowl(l, fb, 11, 6, ['madera-oscura-1', 'madera-oscura-2', 'madera-oscura-3'], 'planta-1');
    bola(l, 15, yb - 1, 9, 4, 'planta', 1, 4);
    for (const [x, y] of [[10, yb - 2], [14, yb - 4], [18, yb - 2], [20, yb], [13, yb]] as const) l.px(x, y, 'rojo-suave-3');
    for (const [x, y] of [[12, yb - 3], [16, yb - 3], [11, yb]] as const) l.px(x, y, 'neutro-7');
    l.rect(21, yb - 5, 4, 3, 'tela-calida-3');
    l.px(21, yb - 5, 'neutro-7');
    l.px(24, yb - 3, 'tela-calida-1');
  });

const jamonHorneado: Hacer = () =>
  dib('jamon-horneado', (l, fb) => {
    plato(l, 15, fb, 14, 3);
    l.elipseSombreada(14, fb - 6, 10, 6, tonosDe('cuero', 1, 4));
    // Rombos del corte y clavos.
    for (let i = 0; i < 4; i++) {
      l.linea(7 + i * 4, fb - 11, 11 + i * 4, fb - 3, 'cuero-1');
      l.linea(21 - i * 4, fb - 11, 17 - i * 4, fb - 3, 'cuero-1');
    }
    for (const [x, y] of [[10, fb - 7], [15, fb - 8], [19, fb - 6], [13, fb - 4]] as const) l.px(x, y, 'cuero-4');
    // Rebanada cortada al frente.
    l.elipseSombreada(24, fb - 3, 4, 3, tonosDe('rojo-suave', 2, 4));
  });

const costillarCordero: Hacer = () =>
  dib('costillar-cordero', (l, fb) => {
    plato(l, 15, fb, 13, 3);
    // Huesos limpios en corona y carne con costra de hierbas.
    for (let i = 0; i < 6; i++) {
      const x = 7 + i * 3;
      l.rect(x, fb - 13, 2, 7, 'crema-4');
      l.px(x + 1, fb - 13, 'neutro-6');
      l.rect(x + 1, fb - 12, 1, 6, 'crema-2');
    }
    l.rectRedondeado(5, fb - 8, 21, 6, 2, 'madera-oscura-2');
    l.rect(6, fb - 8, 19, 1, 'madera-oscura-4');
    l.rect(6, fb - 3, 19, 1, 'madera-oscura-1');
    for (const [x, y] of [[8, fb - 6], [12, fb - 5], [16, fb - 7], [20, fb - 5], [23, fb - 6]] as const) l.px(x, y, 'planta-3');
  });

const carneAhumada: Hacer = () =>
  dib('carne-ahumada', (l, fb) => {
    plato(l, 15, fb, 14, 3);
    // Rodajas en abanico, de derecha a izquierda: costra oscura y anillo rosado.
    for (const [x, y] of [[22, fb - 7], [16, fb - 7], [10, fb - 7]] as const) {
      l.elipse(x, y, 5, 5, 'madera-oscura-1');
      l.elipse(x, y, 4, 4, 'madera-oscura-3');
      l.elipse(x, y, 3, 3, 'rojo-suave-2');
      l.elipse(x, y, 2, 2, 'rojo-suave-3');
      l.px(x - 1, y - 1, 'rojo-suave-4');
      l.px(x + 1, y, 'rojo-suave-4');
    }
  });

const pavoAsado: Hacer = () =>
  dib('pavo-asado', (l, fb) => {
    plato(l, 15, fb, 14, 4);
    l.elipseSombreada(15, fb - 8, 9, 7, tonosDe('naranja', 0, 3));
    l.elipse(15, fb - 12, 4, 1, 'naranja-3');
    for (const [x, y] of [[11, fb - 9], [16, fb - 11], [19, fb - 7]] as const) l.rect(x, y, 3, 1, 'naranja-4');
    // Muslos con hueso al frente.
    for (const x of [6, 24]) {
      l.elipseSombreada(x + 1, fb - 5, 3, 3, tonosDe('naranja', 0, 3));
      l.rect(x, fb - 3, 3, 2, 'neutro-7');
      l.px(x + 2, fb - 2, 'neutro-5');
    }
    // Guarnición: arándanos y ramitas.
    for (const [x, y] of [[11, fb - 2], [14, fb - 1], [17, fb - 2], [20, fb - 1]] as const) l.rect(x, y, 2, 2, 'rojo-suave-2');
    l.hoja([13, fb - 3], [11, fb - 5], 2, ['planta-2', 'planta-3', 'planta-4']);
    l.hoja([18, fb - 3], [20, fb - 5], 2, ['planta-2', 'planta-3', 'planta-4']);
  });

/** Sartén de hierro vista de frente con un asa a la derecha. */
function sarten(l: L, fb: number): number {
  l.rect(24, fb - 4, 7, 2, 'neutro-1');
  l.rect(24, fb - 4, 7, 1, 'neutro-3');
  l.elipseSombreada(14, fb - 4, 11, 6, tonosDe('neutro', 0, 3));
  l.elipse(14, fb - 6, 9, 3, 'neutro-1');
  return fb - 6;
}

const panDeMaiz: Hacer = () =>
  dib('pan-de-maiz', (l, fb) => {
    const y = sarten(l, fb);
    l.elipseSombreada(14, y, 8, 3, tonosDe('tela-calida', 0, 3));
    l.linea(8, y, 20, y, 'tela-calida-1');
    l.linea(14, y - 2, 14, y + 2, 'tela-calida-1');
    l.rect(15, y - 3, 3, 2, 'tela-calida-3');
    l.px(16, y - 3, 'neutro-7');
  });

const verdurasSalteadas: Hacer = () =>
  dib('verduras-salteadas', (l, fb) => {
    const y = sarten(l, fb);
    bola(l, 10, y - 1, 5, 3, 'planta', 1, 4);
    bola(l, 18, y - 1, 5, 3, 'planta', 1, 4);
    bola(l, 14, y - 3, 6, 3, 'planta', 1, 4);
    l.linea(12, y - 4, 16, y - 2, 'planta-4');
    for (const [x, yy] of [[9, y], [20, y], [14, y + 1]] as const) l.px(x, yy, 'rojo-suave-3');
  });

const TABLA: readonly Fila[] = [
  ['dona', () => dona(), hex('rojo-suave')],
  ['caja-donas', () => cajaDonas()],
  ['pizza', pizza],
  ['hamburguesa-papas', hamburguesaPapas],
  ['ensalada', ensalada],
  ['bandeja-sushi', bandejaSushi],
  ['ramen', ramen],
  ['fideos-llevar', fideosLlevar],
  ['dumplings', dumplings],
  ['kebab', kebab],
  ['panini', panini],
  ['tabla-quesos', tablaQuesos],
  ['pan-rustico', panRustico],
  ['bolsa-almuerzo', bolsaAlmuerzo],
  ['macarrones-queso', macarronesQueso],
  ['bowl-acai', bowlAcai],
  ['sopa-almejas', sopaAlmejas],
  ['sopa-tomate', sopaTomate],
  ['coxinha', coxinha],
  ['tabule', tabule],
  ['jamon-horneado', jamonHorneado],
  ['costillar-cordero', costillarCordero],
  ['carne-ahumada', carneAhumada],
  ['pavo-asado', pavoAsado],
  ['pan-de-maiz', panDeMaiz],
  ['verduras-salteadas', verdurasSalteadas],
];

// La dona y la caja de donas van al final porque comparten la misma dona.
function donaEn(l: L, cx: number, cy: number, rx: number, ry: number, glaseado: string): void {
  const g = glaseado === 'tela-calida' ? tonosDe(glaseado, 0, 3) : tonosDe(glaseado, 1, 4);
  l.elipseSombreada(cx, cy + 1, rx, ry, tonosDe('madera-clara', 1, 4));
  l.elipseSombreada(cx, cy, rx, ry - 1, g);
  l.elipse(cx, cy, Math.max(1, Math.floor(rx / 3)), Math.max(1, Math.floor(ry / 3)), 'madera-clara-1');
}

function dona(): Lienzo {
  return dib('dona', (l, fb) => {
    donaEn(l, 15, fb - 6, 9, 6, 'rojo-suave');
    for (const [x, y, c] of [[9, fb - 7, 'neutro-7'], [12, fb - 10, 'planta-4'], [18, fb - 11, 'neutro-7'], [21, fb - 7, 'morado-3'], [20, fb - 4, 'neutro-7'], [10, fb - 4, 'morado-3'], [14, fb - 3, 'neutro-7']] as const) l.rect(x, y, 2, 1, c);
  });
}

function cajaDonas(): Lienzo {
  return dib('caja-donas', (l, fb) => {
    l.rect(3, fb - 11, 26, 12, 'rojo-suave-3');
    l.rect(3, fb - 11, 26, 2, 'crema-4');
    l.rect(4, fb - 9, 24, 7, 'madera-clara-1');
    donaEn(l, 9, fb - 6, 5, 4, 'rojo-suave');
    donaEn(l, 16, fb - 6, 5, 4, 'madera-oscura');
    donaEn(l, 23, fb - 6, 5, 4, 'tela-calida');
    l.rect(3, fb - 2, 26, 3, 'rojo-suave-3');
    l.rect(3, fb - 2, 26, 1, 'rojo-suave-4');
    l.rect(3, fb, 26, 1, 'rojo-suave-1');
    l.rect(13, fb - 1, 6, 1, 'neutro-7');
  });
}

export function cuadrosAlmuerzo11(): Cuadros {
  return registrarTabla(new Map(), TABLA);
}
