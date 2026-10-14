/**
 * Aparatos altos del lote 5: rack de servidores, nevera de vinos y cabina de fotos.
 *
 * Los tres son de suelo: sombra proyectada en dos tonos (la del lote 4) y una mancha de contacto bajo la base. Lo que
 * emite luz va en los tonos más claros de su rampa para que se lea encendido de noche: los LED verdes del rack
 * (`planta-4`), el interior frío de la nevera (`vidrio-3`) y el rótulo y el flash de la cabina (`tela-calida-3` y blanco).
 * Las orientaciones `E` muestran el costado y dejan asomar el frente como una franja a la derecha.
 */

import { Lienzo } from '../nucleo';
import type { ColorEntrada } from '../nucleo';
import { cerrarSuelo, registrar, tonosDe } from './l5-comun';
import type { Cuadros } from './l5-comun';

// ---------------------------------------------------------------------------
// Rack de servidores (1 x 1, sobresale 24: mide 32 x 56)
// ---------------------------------------------------------------------------

const LEDS: readonly (readonly [ColorEntrada, ColorEntrada])[] = [
  ['planta-4', 'planta-3'],
  ['planta-4', 'tela-calida-3'],
  ['planta-3', 'planta-4'],
  ['planta-4', 'rojo-4'],
  ['planta-4', 'planta-4'],
  ['planta-3', 'tela-calida-3'],
  ['planta-4', 'planta-3'],
];

/** Un servidor de 5 filas: placa oscura con biselado, dos LED y la rejilla de ventilación. */
function servidor(l: Lienzo, x: number, y: number, ancho: number, k: number, ranuras: boolean): void {
  l.rect(x, y, ancho, 5, 'neutro-2');
  l.rect(x, y, ancho, 1, 'neutro-3');
  l.rect(x, y + 4, ancho, 1, 'neutro-0');
  l.rect(x + ancho - 1, y + 1, 1, 3, 'neutro-1');
  const [a, b] = LEDS[k % LEDS.length] as readonly [ColorEntrada, ColorEntrada];
  l.px(x + 2, y + 2, a);
  if (ancho > 6) l.px(x + 4, y + 2, b);
  if (ranuras && ancho > 12) {
    for (let i = 0; i < 4; i++) l.rect(x + ancho - 11 + i * 3, y + 1, 2, 1, 'neutro-0').rect(x + ancho - 11 + i * 3, y + 3, 2, 1, 'neutro-0');
  }
}

export function dibujarRackS(): Lienzo {
  const l = new Lienzo(32, 56);
  // Cara superior y cuerpo.
  l.rect(4, 1, 24, 6, 'neutro-3');
  l.rect(4, 1, 24, 1, 'neutro-5');
  l.rect(4, 1, 1, 6, 'neutro-5');
  l.rect(27, 2, 1, 5, 'neutro-2');
  l.rect(4, 7, 24, 44, 'neutro-1');
  l.rect(4, 7, 1, 44, 'neutro-3');
  l.rect(27, 7, 1, 44, 'neutro-0');
  // Siete servidores en el bastidor, con los rieles a los lados.
  for (let k = 0; k < 7; k++) servidor(l, 7, 9 + k * 6, 18, k, true);
  l.rect(5, 9, 2, 41, 'neutro-2');
  l.rect(25, 9, 2, 41, 'neutro-2');
  for (let y = 11; y < 49; y += 6) l.px(5, y, 'metal-3').px(26, y, 'metal-3');
  // Cables de red que cuelgan de un servidor.
  l.rect(12, 28, 1, 3, 'vidrio-2');
  l.rect(15, 28, 1, 4, 'tela-calida-3');
  l.rect(18, 28, 1, 3, 'vidrio-1');
  // Zócalo ventilado con un ventilador.
  l.rect(7, 45, 18, 5, 'neutro-0');
  l.elipse(15.5, 47.5, 3, 2, 'neutro-2');
  l.elipse(15.5, 47.5, 1, 1, 'neutro-0');
  l.px(14, 46, 'neutro-4');
  // Patas.
  l.rect(6, 51, 3, 2, 'neutro-2');
  l.rect(23, 51, 3, 2, 'neutro-2');
  return cerrarSuelo(l, { contacto: [16, 53, 11, 1] });
}

export function dibujarRackE(): Lienzo {
  const l = new Lienzo(32, 56);
  // Cara superior y costado largo con rejillas de ventilación.
  l.rect(3, 1, 20, 6, 'neutro-3');
  l.rect(3, 1, 20, 1, 'neutro-5');
  l.rect(3, 1, 1, 6, 'neutro-5');
  l.rect(22, 2, 1, 5, 'neutro-2');
  l.rect(3, 7, 20, 44, 'neutro-2');
  l.rect(3, 7, 1, 44, 'neutro-3');
  l.rect(22, 7, 1, 44, 'neutro-1');
  l.rect(6, 10, 14, 34, 'neutro-1');
  for (let y = 12; y < 43; y += 2) l.rect(7, y, 12, 1, 'neutro-0');
  l.rect(6, 10, 14, 1, 'neutro-3');
  l.rect(6, 10, 1, 34, 'neutro-2');
  // Haz de cables que sube por el costado.
  l.rect(18, 8, 2, 8, 'neutro-0');
  l.rect(18, 8, 1, 8, 'vidrio-1');
  // Frente que asoma: servidores vistos de canto con sus LED.
  l.rect(23, 7, 5, 44, 'neutro-1');
  for (let k = 0; k < 7; k++) {
    const y = 9 + k * 6;
    l.rect(23, y, 5, 5, 'neutro-2');
    l.rect(23, y, 5, 1, 'neutro-3');
    l.rect(23, y + 4, 5, 1, 'neutro-0');
    l.px(24, y + 2, (LEDS[k % LEDS.length] as readonly [ColorEntrada, ColorEntrada])[0]);
    l.px(26, y + 2, (LEDS[k % LEDS.length] as readonly [ColorEntrada, ColorEntrada])[1]);
  }
  l.rect(23, 45, 5, 5, 'neutro-0');
  l.px(25, 47, 'neutro-3');
  // Patas.
  l.rect(5, 51, 3, 2, 'neutro-2');
  l.rect(23, 51, 3, 2, 'neutro-2');
  return cerrarSuelo(l, { contacto: [16, 53, 11, 1] });
}

// ---------------------------------------------------------------------------
// Nevera de vinos (1 x 1, sobresale 16: mide 32 x 48)
// ---------------------------------------------------------------------------

/** Botella de 3 x 8: cuello fino con corcho, hombros y cuerpo con un brillo. `base` y `luz` son los tonos del vidrio. */
function botella(l: Lienzo, x: number, yBase: number, base: ColorEntrada, luz: ColorEntrada, etiqueta: boolean): void {
  l.rect(x, yBase - 5, 3, 5, base);
  l.rect(x + 1, yBase - 8, 1, 3, base);
  l.px(x + 1, yBase - 8, 'tela-calida-2');
  l.px(x, yBase - 4, luz);
  l.px(x, yBase - 3, luz);
  if (etiqueta) l.rect(x, yBase - 2, 3, 1, 'crema-4');
}

export function dibujarNeveraVinos(): Lienzo {
  const l = new Lienzo(32, 48);
  // Cara superior y carcasa de metal oscuro.
  l.rect(4, 1, 24, 5, 'neutro-3');
  l.rect(4, 1, 24, 1, 'neutro-5');
  l.rect(4, 1, 1, 5, 'neutro-5');
  l.rect(4, 6, 24, 38, 'neutro-2');
  l.rect(4, 6, 1, 38, 'neutro-3');
  l.rect(27, 6, 1, 38, 'neutro-1');
  l.rect(4, 43, 24, 1, 'neutro-1');
  // Interior iluminado, visto a través de la puerta de vidrio.
  l.rect(7, 8, 18, 30, 'azul-oficina-2');
  l.rect(7, 8, 18, 1, 'azul-oficina-1');
  l.rect(7, 8, 1, 30, 'azul-oficina-1');
  const verde: [ColorEntrada, ColorEntrada] = ['planta-1', 'planta-3'];
  const tinto: [ColorEntrada, ColorEntrada] = ['rojo-1', 'rojo-3'];
  const negro: [ColorEntrada, ColorEntrada] = ['neutro-1', 'neutro-4'];
  const estantes: Array<Array<[ColorEntrada, ColorEntrada]>> = [
    [tinto, verde, tinto, negro],
    [verde, negro, tinto, verde],
    [tinto, tinto, verde, negro],
  ];
  estantes.forEach((fila, i) => {
    const y = 18 + i * 10;
    fila.forEach(([b, h], j) => botella(l, 9 + j * 4, y, b, h, (i + j) % 2 === 0));
    // Estante de vidrio: línea fría y brillante con su sombra.
    l.rect(8, y, 16, 1, 'vidrio-3');
    l.rect(8, y + 1, 16, 1, 'vidrio-1');
  });
  // Reflejo diagonal en el cristal y marco de la puerta.
  for (let i = 0; i < 4; i++) l.px(9 + i, 12 - i, 'neutro-7');
  l.px(10, 12, 'vidrio-3').px(11, 13, 'vidrio-3');
  l.rect(6, 7, 20, 1, 'neutro-4');
  l.rect(6, 7, 1, 32, 'neutro-4');
  l.rect(25, 8, 1, 31, 'neutro-1');
  l.rect(7, 38, 18, 1, 'neutro-1');
  // Asa vertical y pantalla de temperatura.
  l.rect(24, 12, 1, 16, 'metal-3');
  l.rect(24, 12, 1, 1, 'neutro-7');
  l.rect(9, 40, 12, 3, 'neutro-0');
  l.rect(10, 41, 2, 1, 'planta-4').rect(13, 41, 2, 1, 'planta-4').rect(16, 41, 1, 1, 'planta-4');
  l.rect(22, 41, 3, 1, 'metal-2');
  // Patas.
  l.rect(6, 44, 3, 2, 'neutro-1');
  l.rect(23, 44, 3, 2, 'neutro-1');
  return cerrarSuelo(l, { contacto: [16, 46, 11, 1] });
}

// ---------------------------------------------------------------------------
// Cabina de fotos (2 x 1, sobresale 32: mide 64 x 64 en S y 32 x 96 en E)
// ---------------------------------------------------------------------------

const CARCASA = tonosDe('azul-oficina', 1, 2, 3);
const CORTINA: readonly ColorEntrada[] = ['rojo-1', 'rojo-2', 'rojo-3', 'rojo-2'];

/** Rayas de las bombillas del rótulo: bombillas amarillas y blancas a intervalos. */
function bombillas(l: Lienzo, x: number, y: number, ancho: number): void {
  for (let i = 0; i < ancho; i += 4) l.rect(x + i, y, 2, 2, (i / 4) % 2 === 0 ? 'tela-calida-3' : 'neutro-7');
}

export function dibujarCabinaS(): Lienzo {
  const l = new Lienzo(64, 64);
  // Techo: cara superior roja con su brillo.
  l.rect(2, 1, 60, 9, 'rojo-2');
  l.rect(2, 1, 60, 1, 'rojo-4');
  l.rect(2, 1, 1, 9, 'rojo-4');
  l.rect(61, 2, 1, 8, 'rojo-1');
  l.rect(3, 9, 59, 1, 'rojo-1');
  // Rótulo iluminado.
  l.rect(2, 10, 60, 8, 'neutro-1');
  l.rect(2, 10, 60, 1, 'neutro-3');
  bombillas(l, 4, 11, 56);
  l.rect(16, 14, 32, 2, 'tela-calida-3');
  l.rect(16, 14, 32, 1, 'neutro-7');
  l.rect(2, 17, 60, 1, 'neutro-0');
  // Carcasa azul con el frente: cortina a la izquierda y panel a la derecha.
  l.rect(2, 18, 60, 38, CARCASA.medio);
  l.rect(2, 18, 1, 38, CARCASA.luz);
  l.rect(61, 18, 1, 38, CARCASA.sombra);
  // Cortina de pliegues con su barra.
  l.rect(5, 19, 36, 2, 'metal-2');
  l.rect(5, 19, 36, 1, 'metal-3');
  l.rect(6, 21, 34, 27, 'rojo-2');
  for (let x = 6; x < 40; x += 4) {
    l.rect(x, 21, 1, 27, CORTINA[2] as ColorEntrada);
    l.rect(x + 2, 21, 1, 27, CORTINA[0] as ColorEntrada);
  }
  l.rect(6, 47, 34, 1, 'rojo-1');
  // Abajo la cortina deja ver el interior: banquillo y el piso oscuro.
  l.rect(6, 48, 34, 7, 'azul-oficina-0');
  l.rect(16, 50, 10, 2, 'neutro-3');
  l.rect(16, 50, 10, 1, 'neutro-5');
  l.rect(17, 52, 2, 3, 'neutro-2');
  l.rect(23, 52, 2, 3, 'neutro-1');
  // Panel derecho: flash, lente, instrucciones, ranura y tira de fotos.
  l.rect(43, 20, 17, 35, 'azul-oficina-1');
  l.rect(43, 20, 17, 1, 'azul-oficina-2');
  l.rect(43, 20, 1, 35, 'azul-oficina-2');
  l.elipse(51, 26, 5, 4, 'neutro-5');
  l.elipse(51, 26, 4, 3, 'neutro-7');
  l.elipse(51, 26, 2, 2, 'tela-calida-3');
  l.px(49, 25, 'neutro-7');
  l.elipse(51, 36, 3, 3, 'neutro-1');
  l.elipse(51, 36, 2, 2, 'azul-oficina-2');
  l.px(50, 35, 'vidrio-3');
  l.rect(45, 42, 13, 5, 'crema-4');
  l.rect(45, 42, 13, 1, 'crema-3');
  for (const y of [43, 45]) l.rect(46, y, 10, 1, 'neutro-4');
  l.rect(47, 49, 6, 2, 'metal-2');
  l.px(47, 49, 'metal-3');
  l.rect(45, 52, 13, 2, 'neutro-0');
  l.rect(55, 49, 4, 6, 'neutro-7');
  l.rect(56, 50, 2, 1, 'vidrio-1').rect(56, 52, 2, 1, 'tela-calida-3').rect(56, 54, 2, 1, 'rojo-3');
  // Zócalo y patas.
  l.rect(2, 56, 60, 3, 'azul-oficina-0');
  l.rect(2, 56, 60, 1, CARCASA.sombra);
  return cerrarSuelo(l, { contacto: [32, 60, 28, 1] });
}

export function dibujarCabinaE(): Lienzo {
  const l = new Lienzo(32, 96);
  // Techo largo, rojo, con el rótulo en el borde de la derecha.
  l.rect(2, 1, 20, 58, 'rojo-2');
  l.rect(2, 1, 20, 1, 'rojo-4');
  l.rect(2, 1, 1, 58, 'rojo-4');
  l.rect(21, 2, 1, 57, 'rojo-1');
  l.rect(3, 58, 19, 1, 'rojo-1');
  // Costado sur: carcasa azul con un cartel de tiras de fotos.
  l.rect(2, 59, 20, 32, CARCASA.medio);
  l.rect(2, 59, 20, 1, 'azul-oficina-0');
  l.rect(2, 60, 1, 31, CARCASA.luz);
  l.rect(21, 60, 1, 31, CARCASA.sombra);
  l.rect(5, 63, 14, 22, 'neutro-6');
  l.rect(5, 63, 14, 1, 'neutro-7');
  l.rect(5, 63, 1, 22, 'neutro-7');
  l.rect(18, 64, 1, 21, 'neutro-4');
  l.rect(5, 84, 14, 1, 'neutro-4');
  for (let i = 0; i < 3; i++) {
    const x = 7 + i * 4;
    l.rect(x, 65, 3, 17, 'neutro-7');
    for (let j = 0; j < 4; j++) l.rect(x, 66 + j * 4, 3, 3, (['vidrio-1', 'tela-calida-3', 'rojo-3', 'planta-3'] as const)[(i + j) % 4] as ColorEntrada);
  }
  l.rect(2, 91, 20, 2, 'azul-oficina-0');
  // Frente que asoma a la derecha: rótulo, cortina, panel y zócalo.
  l.rect(22, 6, 8, 8, 'neutro-1');
  l.rect(22, 6, 8, 1, 'neutro-3');
  l.rect(23, 9, 6, 2, 'tela-calida-3');
  l.rect(23, 9, 6, 1, 'neutro-7');
  l.rect(22, 14, 8, 40, CARCASA.medio);
  l.rect(22, 14, 1, 40, CARCASA.luz);
  l.rect(23, 15, 6, 34, 'rojo-2');
  for (let y = 16; y < 48; y += 4) {
    l.rect(23, y, 6, 1, 'rojo-3');
    l.rect(23, y + 2, 6, 1, 'rojo-1');
  }
  l.rect(23, 49, 6, 1, 'rojo-1');
  l.rect(22, 54, 8, 30, 'azul-oficina-1');
  l.rect(22, 54, 1, 30, 'azul-oficina-2');
  l.elipse(26, 60, 3, 3, 'neutro-5');
  l.elipse(26, 60, 2, 2, 'neutro-7');
  l.px(26, 60, 'tela-calida-3');
  l.elipse(26, 68, 2, 2, 'neutro-1');
  l.px(25, 67, 'vidrio-3');
  l.rect(23, 74, 6, 4, 'crema-4');
  l.rect(24, 80, 4, 2, 'metal-2');
  l.rect(22, 84, 8, 6, 'azul-oficina-0');
  l.rect(22, 90, 8, 2, 'azul-oficina-0');
  return cerrarSuelo(l, { contacto: [14, 93, 10, 1] });
}

// ---------------------------------------------------------------------------
// Registro
// ---------------------------------------------------------------------------

export function cuadrosEquipos(): Cuadros {
  const c: Cuadros = new Map();
  registrar(c, 'rack-servidores', 'S', dibujarRackS());
  registrar(c, 'rack-servidores', 'E', dibujarRackE());
  registrar(c, 'nevera-vinos', 'U', dibujarNeveraVinos());
  registrar(c, 'cabina-fotos', 'S', dibujarCabinaS());
  registrar(c, 'cabina-fotos', 'E', dibujarCabinaE());
  return c;
}
