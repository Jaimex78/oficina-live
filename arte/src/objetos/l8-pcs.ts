/**
 * Lote 8, computadores del puesto (primera parte): monitor, portátil, computador con dos monitores, computador gamer,
 * computador de desarrollo de software y la torre de piso. Son el molde de los demás equipos.
 *
 * Reglas (ver `l8-comun.ts` y `GUIA-ESTILO-GATHER-V2.md`):
 *  - Cada cuadro mide `ancho * 32` por `32 + sobresale`; el borde de abajo del teclado queda en la fila `pie(sobresale)`
 *    (la fila 15 de la casilla) y la sombra de 1 px cae sobre la tapa blanca del escritorio.
 *  - Pantallas siempre de frente y encendidas, con contenido distinto en cada una.
 *  - Los monitores laterales van en ángulo (`monitorAngulado`) como en los puestos de Gather.
 */

import { Lienzo } from '../nucleo';
import type { ColorEntrada } from '../nucleo';
import {
  AZ,
  MT,
  NE,
  VI,
  alfombrilla,
  cerrarApoyado,
  cerrarSuelo,
  ciclo,
  controlJuego,
  monitor,
  monitorAngulado,
  pantallaCiudad,
  pantallaCodigo,
  pantallaDocumento,
  pantallaGraficos,
  pantallaTerminal,
  pie,
  pieDeMonitor,
  raton,
  registrar,
  registrarVariantes,
  teclado,
  torre,
} from './l8-comun';
import type { Cuadros } from './l8-comun';

// ---------------------------------------------------------------------------
// Monitor extra (1 x 1, sobresale 16): 32 x 48, el pie en la fila 26
// ---------------------------------------------------------------------------

/** Monitor visto de frente, con su cuello y su pie. */
function monitorS(): Lienzo {
  const l = new Lienzo(32, 48);
  monitor(l, 2, 1, 28, 20, (c, r) => pantallaGraficos(c, r));
  pieDeMonitor(l, 16, 21, pie(16), 12);
  return cerrarApoyado(l);
}

/** Monitor visto por detrás: la carcasa lisa con rejillas, el cuello y un cable. */
function monitorN(): Lienzo {
  const l = new Lienzo(32, 48);
  l.rect(2, 1, 28, 20, AZ(2));
  l.rect(2, 1, 28, 1, AZ(3));
  l.rect(2, 2, 1, 19, AZ(3));
  l.rect(29, 2, 1, 19, AZ(1));
  l.rect(3, 20, 26, 1, AZ(1));
  for (let k = 0; k < 4; k++) l.rect(8, 6 + k * 2, 16, 1, AZ(1));
  l.rect(14, 12, 4, 4, AZ(3));
  pieDeMonitor(l, 16, 21, pie(16), 12);
  return cerrarApoyado(l);
}

/** Monitor de lado: una losa delgada, el cuello y la base. */
function monitorLado(lado: 'E' | 'O'): Lienzo {
  const l = new Lienzo(32, 48);
  const x = lado === 'E' ? 12 : 14;
  l.rect(x, 2, 6, 19, AZ(1));
  l.rect(x, 2, 6, 1, AZ(3));
  l.rect(x, 3, 1, 18, AZ(2));
  l.rect(x + 5, 3, 1, 18, AZ(0));
  l.rect(lado === 'E' ? x + 4 : x + 1, 4, 1, 13, VI(2));
  l.rect(x + 1, 21, 4, 3, AZ(2));
  l.rect(9, pie(16) - 1, 14, 2, AZ(2));
  l.rect(9, pie(16) - 1, 14, 1, AZ(3));
  l.px(22, pie(16), AZ(1));
  return cerrarApoyado(l);
}

// ---------------------------------------------------------------------------
// Portátil (1 x 1, sobresale 10): 32 x 42, el borde de adelante en la fila 20
// ---------------------------------------------------------------------------

/** Portátil abierto visto de frente: tapa con pantalla y base de aluminio con teclas y panel táctil. */
function portatilS(): Lienzo {
  const l = new Lienzo(32, 42);
  l.rect(3, 1, 26, 13, 'metal-1');
  l.rect(3, 1, 26, 1, 'metal-3');
  l.rect(3, 2, 1, 12, 'metal-2');
  l.rect(28, 2, 1, 12, 'metal-0');
  l.rect(4, 2, 24, 11, AZ(0));
  pantallaDocumento(l, { x: 5, y: 3, ancho: 22, alto: 9 });
  l.px(15, 2, 'planta-4');
  l.rect(1, 14, 30, 7, MT(3));
  l.rect(1, 14, 30, 1, NE(7));
  l.rect(1, 20, 30, 1, MT(1));
  l.rect(2, 21, 28, 1, MT(0));
  for (let j = 0; j < 3; j++) for (let i = 0; i < 12; i++) l.rect(4 + i * 2 + (j === 1 ? 1 : 0), 15 + j, 1, 1, MT(1));
  l.rect(11, 19, 10, 1, MT(2));
  return cerrarApoyado(l);
}

function portatilN(): Lienzo {
  const l = new Lienzo(32, 42);
  l.rect(3, 1, 26, 17, 'metal-2');
  l.rect(3, 1, 26, 1, 'metal-3');
  l.rect(3, 2, 1, 16, 'metal-3');
  l.rect(28, 2, 1, 16, 'metal-1');
  l.rect(4, 17, 24, 1, 'metal-1');
  l.rect(13, 7, 6, 6, 'metal-3');
  l.rect(1, 18, 30, 3, 'metal-1');
  l.rect(1, 18, 30, 1, 'metal-2');
  l.rect(2, 21, 28, 1, MT(0));
  return cerrarApoyado(l);
}

function portatilLado(lado: 'E' | 'O'): Lienzo {
  const l = new Lienzo(32, 42);
  const x = lado === 'E' ? 5 : 7;
  l.rect(x, 16, 20, 5, MT(3));
  l.rect(x, 16, 20, 1, NE(7));
  l.rect(x, 20, 20, 1, MT(1));
  const tx = lado === 'E' ? x : x + 16;
  l.rect(tx, 2, 4, 15, 'metal-2');
  l.rect(tx, 2, 1, 15, 'metal-3');
  l.rect(tx + 3, 3, 1, 14, 'metal-0');
  l.rect(x + 5, 15, 10, 1, MT(2));
  return cerrarApoyado(l);
}

// ---------------------------------------------------------------------------
// Dos monitores sobre brazos (2 x 1, sobresale 24): 64 x 56, el borde del teclado en la fila 34
// ---------------------------------------------------------------------------

function brazoDoble(l: Lienzo, centro: number, fb: number): void {
  l.rect(centro - 1, 9, 3, fb - 9 - 8, 'metal-2');
  l.rect(centro - 1, 9, 1, fb - 17, 'metal-3');
  l.rect(centro + 1, 10, 1, fb - 18, 'metal-1');
  l.rect(centro - 14, 10, 29, 2, 'metal-2');
  l.rect(centro - 14, 10, 29, 1, 'metal-3');
  l.rect(centro - 5, fb - 10, 11, 2, 'metal-2');
  l.rect(centro - 5, fb - 10, 11, 1, 'metal-3');
  l.px(centro + 5, fb - 9, 'metal-1');
}

function pcDoble(): Lienzo {
  const l = new Lienzo(64, 56);
  const fb = pie(24);
  brazoDoble(l, 32, fb);
  monitor(l, 3, 2, 27, 20, (c, r) => pantallaCodigo(c, r, 1));
  monitor(l, 34, 2, 27, 20, (c, r) => pantallaGraficos(c, r));
  teclado(l, 19, fb - 8, 22);
  alfombrilla(l, 46, fb - 8, 14, 9);
  raton(l, 51, fb - 7);
  return cerrarApoyado(l);
}

// ---------------------------------------------------------------------------
// Computador gamer (2 x 1) con luces RGB y cuatro colores
// ---------------------------------------------------------------------------

interface Tema {
  luces: readonly ColorEntrada[];
  cielo: readonly [ColorEntrada, ColorEntrada, ColorEntrada];
  sol: ColorEntrada;
}

const TEMAS: Readonly<Record<string, Tema>> = {
  base: { luces: ['rojo-suave-3', 'naranja-3', 'tela-calida-3', 'planta-4', 'vidrio-2', 'morado-3'], cielo: ['morado-1', 'morado-2', 'rojo-suave-3'], sol: 'tela-calida-3' },
  azul: { luces: ['vidrio-1', 'vidrio-2', 'vidrio-3'], cielo: ['azul-oficina-1', 'vidrio-0', 'vidrio-1'], sol: 'vidrio-3' },
  rojo: { luces: ['rojo-2', 'rojo-3', 'rojo-4'], cielo: ['rojo-0', 'rojo-1', 'rojo-2'], sol: 'rojo-4' },
  morado: { luces: ['morado-2', 'morado-3', 'morado-4'], cielo: ['azul-oficina-1', 'morado-0', 'morado-1'], sol: 'morado-4' },
};

/** Monitor curvo ultra ancho: el centro queda atrás y los extremos adelante, con una franja de luz en la barbilla. */
function monitorCurvo(t: Tema, ancho: number, alto: number): Lienzo {
  const plano = new Lienzo(ancho, alto);
  monitor(plano, 0, 0, ancho, alto, (c, r) => pantallaCiudad(c, r, t.cielo, t.sol));
  for (let x = 3; x < ancho - 3; x++) plano.px(x, alto - 2, ciclo(t.luces, Math.floor(x / 2)));
  const salida = new Lienzo(ancho, alto + 2);
  for (let x = 0; x < ancho; x++) {
    const m = (x - (ancho - 1) / 2) / ((ancho - 1) / 2);
    salida.pegar(plano.recortar(x, 0, 1, alto), x, Math.round(2 * m * m));
  }
  return salida;
}

function pcGamer(variante: string): Lienzo {
  const t = TEMAS[variante];
  if (t === undefined) throw new RangeError(`pc-gamer: la variante "${variante}" no tiene tema.`);
  const l = new Lienzo(64, 56);
  const fb = pie(24);
  // Torre con ventana de vidrio: carcasa oscura, dos ventiladores con aro de luz y una franja RGB.
  l.rect(2, 3, 12, 26, AZ(1));
  l.rect(2, 3, 12, 1, AZ(3));
  l.rect(2, 4, 1, 25, AZ(2));
  l.rect(13, 4, 1, 25, AZ(0));
  l.rect(4, 6, 8, 17, AZ(0));
  for (const y of [8, 15]) {
    l.elipse(8, y + 2, 3, 3, ciclo(t.luces, y));
    l.elipse(8, y + 2, 1, 1, AZ(0));
    l.px(8, y + 2, NE(7));
  }
  l.rect(11, 6, 1, 17, ciclo(t.luces, 2));
  l.rect(4, 25, 8, 1, AZ(2));
  l.px(5, 27, 'planta-4');
  // Monitor curvo y pie.
  l.pegar(monitorCurvo(t, 34, 19), 15, 2);
  pieDeMonitor(l, 32, 23, fb - 8, 14);
  // Teclado mecánico con luz por tecla.
  teclado(l, 18, fb - 8, 25, NE(1), NE(3), NE(3));
  for (let fila = 0; fila < 3; fila++) for (let i = 2; i < 23; i += 3) l.rect(18 + i, fb - 7 + fila * 2, 2, 1, ciclo(t.luces, i + fila * 2));
  l.rect(22, fb - 1, 17, 1, ciclo(t.luces, 4));
  // Alfombrilla grande con borde luminoso y ratón.
  alfombrilla(l, 47, fb - 8, 15, 9, AZ(1), AZ(2));
  for (let x = 47; x < 62; x++) l.px(x, fb, ciclo(t.luces, Math.floor((x - 47) / 2)));
  raton(l, 52, fb - 7, NE(3));
  l.px(53, fb - 7, ciclo(t.luces, 0));
  // Control de videojuego a los pies de la torre.
  controlJuego(l, 1, fb - 8);
  return cerrarApoyado(l, { diagonales: true });
}

// ---------------------------------------------------------------------------
// Computador de desarrollo de software (2 x 1): tres pantallas
// ---------------------------------------------------------------------------

function pcDesarrollador(): Lienzo {
  const l = new Lienzo(64, 56);
  const fb = pie(24);
  // Torre pequeña a la izquierda con una luz azul.
  torre(l, 2, 5, 10, 24, VI(2));
  // Monitor central con código.
  monitor(l, 14, 2, 28, 20, (c, r) => pantallaCodigo(c, r, 2));
  pieDeMonitor(l, 28, 22, fb - 8, 12);
  // Lateral en ángulo con terminal.
  monitorAngulado(l, 45, 4, 17, 20, 'D', (c, r) => pantallaTerminal(c, r), 3);
  l.rect(52, 24, 3, 3, AZ(2));
  // Teclado, ratón y alfombrilla.
  teclado(l, 15, fb - 8, 22);
  alfombrilla(l, 41, fb - 8, 14, 9);
  raton(l, 46, fb - 7);
  return cerrarApoyado(l);
}

// ---------------------------------------------------------------------------
// Torre de piso (1 x 1, sobresale 16): la del lote 7 rehecha con el molde
// ---------------------------------------------------------------------------

function torrePiso(variante: string): Lienzo {
  const t = TEMAS[variante];
  if (t === undefined) throw new RangeError(`torre-pc: la variante "${variante}" no tiene tema.`);
  const l = new Lienzo(32, 48);
  torre(l, 8, 2, 16, 40, ciclo(t.luces, 0), [ciclo(t.luces, 1), ciclo(t.luces, 2)]);
  // Ventana lateral con ventilador de luces.
  l.rect(11, 14, 10, 14, AZ(0));
  l.elipse(16, 21, 4, 4, ciclo(t.luces, 3));
  l.elipse(16, 21, 2, 2, AZ(0));
  l.px(16, 21, NE(7));
  // Patas.
  l.rect(9, 42, 3, 2, AZ(0));
  l.rect(20, 42, 3, 2, AZ(0));
  return cerrarSuelo(l);
}

export function cuadrosPcsA(): Cuadros {
  const c: Cuadros = new Map();
  registrar(c, 'monitor', 'S', monitorS());
  registrar(c, 'monitor', 'N', monitorN());
  registrar(c, 'monitor', 'E', monitorLado('E'));
  registrar(c, 'monitor', 'O', monitorLado('O'));
  registrar(c, 'portatil', 'S', portatilS());
  registrar(c, 'portatil', 'N', portatilN());
  registrar(c, 'portatil', 'E', portatilLado('E'));
  registrar(c, 'portatil', 'O', portatilLado('O'));
  registrar(c, 'pc-doble', 'S', pcDoble());
  registrarVariantes(c, 'pc-gamer', 'S', { base: pcGamer('base'), azul: pcGamer('azul'), rojo: pcGamer('rojo'), morado: pcGamer('morado') });
  registrar(c, 'pc-desarrollador', 'S', pcDesarrollador());
  registrarVariantes(c, 'torre-pc', 'S', { base: torrePiso('base'), azul: torrePiso('azul'), rojo: torrePiso('rojo'), morado: torrePiso('morado') });
  return c;
}
