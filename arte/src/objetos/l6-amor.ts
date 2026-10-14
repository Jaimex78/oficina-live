/**
 * Amor y amistad (lote 6): ramo de rosas, globos de corazón, oso de peluche y caja de chocolates. 5 cuadros.
 *
 * Sombras: el oso va sobre el piso (dos tonos y mancha de contacto); ramo y chocolates van sobre una mesa (reborde de
 * 1 px); los globos van en el aire y no llevan sombra. Variante: `globos-corazon~rojo` pasa los corazones rosados y
 * morados a rojo (la base es multicolor).
 */

import { Lienzo, rampa } from '../nucleo';
import type { ColorEntrada } from '../nucleo';
import { B, aUnSoloColor, cerrarApoyado, cerrarSinSombra, cerrarSuelo, conBorde, enElipse, poligono, pxSobre, registrar, registrarVariantes, volumen } from './l6-comun';
import type { Cuadros } from './l6-comun';

/** ¿El píxel cae dentro de un corazón de centro `(cx, cy)` y escala `(sx, sy)`? Curva implícita clásica del corazón. */
export function enCorazon(x: number, y: number, cx: number, cy: number, sx: number, sy: number = sx): boolean {
  const u = (x + 0.5 - cx) / sx;
  const v = -(y + 0.5 - cy) / sy;
  return (u * u + v * v - 1) ** 3 - u * u * v * v * v <= 0;
}

const ROJOS = rampa('rojo').slice(1, 5);
const CORALES = rampa('rojo-suave').slice(1, 5);
const MORADOS = rampa('morado').slice(1, 5);

/** Un corazón inflado con volumen, brillo en el lóbulo izquierdo y nudo abajo. */
function globoCorazon(l: Lienzo, cx: number, cy: number, s: number, tonos: readonly ColorEntrada[]): void {
  volumen(l, cx, cy, s * 1.1, s * 1.1, (x, y) => enCorazon(x, y, cx, cy, s), tonos, [0.38, 0.66, 0.9]);
  l.px(Math.round(cx - s * 0.55), Math.round(cy - s * 0.55), 'neutro-7');
  l.px(Math.round(cx - s * 0.55), Math.round(cy - s * 0.55) + 1, 'neutro-7');
  l.px(Math.round(cx - s * 0.55) + 1, Math.round(cy - s * 0.55) - 1, 'neutro-7');
  // Nudo en la punta.
  const ny = Math.round(cy + s * 1.0) + 1;
  l.rect(Math.round(cx) - 1, ny, 3, 1, tonos[1] as ColorEntrada);
  l.px(Math.round(cx), ny + 1, tonos[0] as ColorEntrada);
}

/** Ramo de tres globos de corazón atados a un peso: rojo, coral y morado. Va en el aire. 32 x 48. */
export function dibujarGlobosCorazon(): Lienzo {
  const l = new Lienzo(32, 48);
  const globos: Array<[number, number, number, readonly string[]]> = [
    [9.5, 19, 5.2, CORALES],
    [22.5, 20, 5.2, MORADOS],
    [16, 10, 5.8, ROJOS],
  ];
  for (const [x, y, s] of globos) l.linea(Math.round(x), Math.round(y + s * 1.0 + 3), 16, 39, 'neutro-5');
  for (const [x, y, s, tonos] of globos) globoCorazon(l, x, y, s, tonos);
  // Peso.
  l.rect(14, 39, 5, 4, 'metal-2');
  l.rect(14, 39, 5, 1, 'metal-3');
  l.rect(14, 42, 5, 1, 'metal-1');
  return cerrarSinSombra(l);
}

/** La misma, toda roja: cada rampa de origen pasa al rojo. */
export function dibujarGlobosCorazonRojo(base: Lienzo): Lienzo {
  return aUnSoloColor(base, [CORALES, MORADOS], ROJOS);
}

// ---------------------------------------------------------------------------
// Oso de peluche
// ---------------------------------------------------------------------------

/** Oso de peluche sentado, de frente, con moño rojo y un corazón en la barriga. 32 x 40, patas en la fila 36. */
export function dibujarOsoPeluche(): Lienzo {
  const l = new Lienzo(32, 40);
  const pelo = ['cuero-1', 'cuero-2', 'cuero-3'] as const;
  const bola = (cx: number, cy: number, rx: number, ry: number): void => {
    volumen(l, cx, cy, rx + 0.5, ry + 0.5, (x, y) => enElipse(x, y, cx, cy, rx, ry), pelo, [0.4, 0.74]);
  };
  // Orejas con el interior más claro.
  bola(9, 10, 3.5, 3.5);
  bola(23, 10, 3.5, 3.5);
  l.rect(8, 10, 3, 2, 'cuero-4');
  l.rect(22, 10, 3, 2, 'cuero-3');
  // Piernas y pies con planta clara.
  bola(9.5, 35, 5, 3.5);
  bola(22.5, 35, 5, 3.5);
  l.elipse(9.5, 35, 2, 2, 'crema-3');
  l.elipse(22.5, 35, 2, 2, 'crema-3');
  l.rect(8, 34, 2, 1, 'crema-4');
  l.rect(21, 34, 2, 1, 'crema-4');
  // Cuerpo, brazos y barriga.
  bola(16, 29, 8.5, 8);
  bola(6.5, 28, 3.5, 5.5);
  bola(25.5, 28, 3.5, 5.5);
  l.elipse(16, 31, 5, 5, 'crema-2');
  l.elipse(15, 30, 4, 4, 'crema-3');
  l.rect(12, 28, 3, 1, 'crema-4');
  // Corazón en la barriga.
  for (const [x, y] of [[14, 30], [15, 30], [17, 30], [18, 30], [14, 31], [15, 31], [16, 31], [17, 31], [18, 31], [15, 32], [16, 32], [17, 32], [16, 33]] as const) l.px(x, y, 'rojo-3');
  l.px(14, 30, 'rojo-4');
  l.px(15, 30, 'rojo-4');
  // Cabeza.
  bola(16, 17, 9.5, 8);
  // Hocico, nariz y boca.
  l.elipse(16, 20, 4, 3, 'crema-3');
  l.elipse(15.5, 19.5, 3, 2, 'crema-4');
  l.rect(15, 18, 3, 2, 'azul-oficina-0');
  l.px(15, 18, 'azul-oficina-3');
  l.px(16, 20, 'azul-oficina-1');
  l.px(14, 21, 'azul-oficina-1');
  l.px(18, 21, 'azul-oficina-1');
  l.px(15, 22, 'azul-oficina-1');
  l.px(17, 22, 'azul-oficina-1');
  // Ojos.
  for (const x of [11, 20]) {
    l.rect(x, 14, 2, 3, 'azul-oficina-0');
    l.px(x, 14, 'neutro-7');
  }
  l.px(9, 18, 'rojo-suave-4');
  l.px(10, 18, 'rojo-suave-4');
  l.px(22, 18, 'rojo-suave-3');
  l.px(23, 18, 'rojo-suave-3');
  // Moño rojo en el cuello.
  l.rect(11, 24, 4, 4, 'rojo-3');
  l.rect(18, 24, 4, 4, 'rojo-2');
  l.rect(11, 24, 4, 1, 'rojo-4');
  l.px(11, 27, null);
  l.px(21, 27, null);
  l.rect(11, 25, 1, 2, 'rojo-2');
  l.rect(15, 24, 3, 4, 'rojo-2');
  l.rect(15, 24, 1, 4, 'rojo-3');
  l.px(15, 24, 'rojo-4');
  // Todo sube 2 px: así el pie y su sombra caben dentro del cuadro.
  return cerrarSuelo(l.desplazar(0, -2), { contacto: [17, 36, 12, 1], diagonales: true });
}

// ---------------------------------------------------------------------------
// Caja de chocolates
// ---------------------------------------------------------------------------

/** Caja de chocolates en forma de corazón, con cinta dorada en cruz y un moño. Va sobre una mesa: base en la fila 15. */
export function dibujarCajaChocolates(): Lienzo {
  const l = new Lienzo(32, 32);
  const cx = 16;
  const cy = 7.6;
  const sx = 9.0;
  const sy = 5.4;
  const dentro = (x: number, y: number, d = 0): boolean => enCorazon(x, y - d, cx, cy, sx, sy);
  // Canto de la caja: la misma silueta bajada 3 px, en sombra, con una línea de luz.
  for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) if (dentro(x, y, 3)) l.px(x, y, x < 14 ? 'rojo-2' : 'rojo-1');
  for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) if (dentro(x, y, 3) && !dentro(x, y, 2) && x < 15) l.px(x, y, 'rojo-2');
  // Tapa: roja, con un solo brillo en el lóbulo izquierdo y reborde.
  volumen(l, cx, cy, sx * 1.1, sy * 1.2, (x, y) => dentro(x, y), ['rojo-2', 'rojo-3', 'rojo-3', 'rojo-4'], [0.3, 0.62, 0.93]);
  for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
    if (dentro(x, y) && !enCorazon(x, y, cx, cy, sx - 1.2, sy - 0.9)) l.px(x, y, x < 15 && y < 9 ? 'rojo-4' : 'rojo-2');
  }
  // Cinta dorada en cruz.
  for (let y = 0; y < 32; y++) {
    pxSobre(l, 15, y, 'tela-calida-3');
    pxSobre(l, 16, y, 'tela-calida-2');
  }
  for (let x = 0; x < 32; x++) {
    if (l.esOpaco(x, 9) && !(x >= 15 && x <= 16)) {
      pxSobre(l, x, 9, 'tela-calida-3');
      pxSobre(l, x, 10, 'tela-calida-2');
    }
  }
  // Moño sobre el cruce.
  l.elipse(12.5, 7, 3, 2, 'tela-calida-3');
  l.elipse(19.5, 7, 3, 2, 'tela-calida-2');
  l.rect(10, 6, 2, 1, 'neutro-7');
  l.px(12, 7, 'tela-calida-1');
  l.px(20, 7, 'tela-calida-1');
  l.rect(14, 5, 4, 6, 'tela-calida-2');
  l.rect(14, 5, 1, 6, 'tela-calida-3');
  l.px(14, 5, 'neutro-7');
  l.rect(17, 5, 1, 6, 'tela-calida-1');
  // Brillo de la tapa.
  l.rect(7, 3, 2, 1, 'neutro-7');
  l.px(6, 4, 'neutro-7');
  return cerrarApoyado(l, { diagonales: true });
}

// ---------------------------------------------------------------------------
// Ramo de rosas
// ---------------------------------------------------------------------------

/** Una rosa vista de arriba: pétalos en tres tonos, centro en espiral y borde oscuro propio. */
function rosa(l: Lienzo, cx: number, cy: number, r: number): void {
  conBorde(l, 'rojo-0', (p) => {
    p.elipseSombreada(cx, cy, r, r, ['rojo-2', 'rojo-3', 'rojo-4'], { umbrales: [0.35, 0.8] });
    p.px(cx, cy, 'rojo-2');
    p.px(cx + 1, cy, 'rojo-2');
    p.px(cx, cy - 1, 'rojo-1');
    p.px(cx - 1, cy - 1, 'rojo-4');
    if (r > 2) {
      p.px(cx + 1, cy + 1, 'rojo-1');
      p.px(cx - 2, cy, 'rojo-4');
    }
  }, { diagonales: true });
}

/** Ramo de rosas rojas envuelto en papel crema con moño, hojas y florcitas blancas. Va sobre una mesa. 32 x 32. */
export function dibujarRamoRosas(): Lienzo {
  const l = new Lienzo(32, 32);
  const hojas = ['planta-1', 'planta-2', 'planta-3', 'planta-4'] as const;
  // Florcitas blancas en tallos finos, detrás.
  for (const [x, y] of [[4, 5], [7, 2], [25, 2], [28, 5]] as const) {
    l.rect(x - 1, y, 3, 2, 'neutro-7');
    l.px(x, y + 2, 'neutro-6');
    l.linea(x, y + 2, x < 16 ? 11 : 21, 9, 'planta-2');
  }
  // Hojas a los lados.
  l.hoja([11, 9], [2, 8], 5, hojas);
  l.hoja([21, 9], [30, 8], 5, hojas);
  l.hoja([12, 8], [6, 3], 4, hojas.slice(0, 3));
  l.hoja([20, 8], [26, 3], 4, hojas.slice(0, 3));
  // Papel de envolver: cono corto de crema, con pliegues, que se cierra hacia abajo.
  poligono(l, [[6, 10], [25, 10], [20, B], [11, B]], 'crema-3');
  for (let y = 10; y <= B; y++) {
    const t = (y - 10) / (B - 10);
    const izq = Math.round(6 + t * 5);
    const der = Math.round(25 - t * 5);
    l.px(izq, y, 'crema-4');
    l.px(izq + 1, y, 'crema-4');
    l.px(der, y, 'crema-1');
    l.px(der - 1, y, 'crema-2');
  }
  l.linea(12, 10, 14, B, 'crema-2');
  l.linea(19, 10, 17, B, 'crema-2');
  l.rect(12, B, 8, 1, 'crema-1');
  // Rosas: tres grandes en arco y dos chicas arriba.
  rosa(l, 9, 7, 3);
  rosa(l, 23, 7, 3);
  rosa(l, 16, 7, 3);
  rosa(l, 12, 4, 2);
  rosa(l, 20, 4, 2);
  // Cinta con moño sobre el papel.
  l.rect(8, 12, 17, 1, 'rojo-suave-3');
  l.rect(9, 13, 15, 1, 'rojo-suave-2');
  l.rect(11, 11, 4, 3, 'rojo-suave-3');
  l.rect(18, 11, 4, 3, 'rojo-suave-2');
  l.rect(11, 11, 4, 1, 'rojo-suave-4');
  l.rect(15, 11, 3, 4, 'rojo-suave-2');
  l.rect(15, 11, 1, 4, 'rojo-suave-3');
  l.px(15, 11, 'rojo-suave-4');
  l.px(14, 14, 'rojo-suave-2');
  l.px(18, 14, 'rojo-suave-1');
  return cerrarApoyado(l, { diagonales: true });
}

// ---------------------------------------------------------------------------
// Registro
// ---------------------------------------------------------------------------

export function cuadrosAmor(): Cuadros {
  const c: Cuadros = new Map();
  const globos = dibujarGlobosCorazon();
  registrarVariantes(c, 'globos-corazon', 'U', { base: globos, rojo: dibujarGlobosCorazonRojo(globos) });
  registrar(c, 'oso-peluche', 'U', dibujarOsoPeluche());
  registrar(c, 'caja-chocolates', 'U', dibujarCajaChocolates());
  registrar(c, 'ramo-rosas', 'U', dibujarRamoRosas());
  return c;
}
