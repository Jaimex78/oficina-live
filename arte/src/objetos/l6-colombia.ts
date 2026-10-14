/**
 * Fiestas de Colombia (lote 6): bandera, sombrero vueltiao, mochila wayuu y máscara de carnaval. 6 cuadros.
 *
 * Colores vivos: la bandera usa amarillo (`tela-calida`), azul (`vidrio` y `azul-oficina`) y rojo (`rojo`); la mochila
 * lleva trama geométrica de rombos en colores saturados sobre negro; la máscara mezcla las cuatro rampas más vivas.
 * Sombras: la bandera va sobre el piso (dos tonos y mancha de contacto); sombrero y mochila van sobre una mesa (reborde
 * de 1 px); la máscara cuelga de la pared (1 px sobre ella; en las paredes verticales es una placa delgada).
 */

import { Lienzo, oscurecerEnRampa } from '../nucleo';
import type { ColorEntrada } from '../nucleo';
import { B, cerrarApoyado, cerrarColgante, cerrarSuelo, enElipse, placaLateral, pxSobre, quitar, registrar, volumen } from './l6-comun';
import type { Cuadros } from './l6-comun';

// ---------------------------------------------------------------------------
// Bandera de Colombia
// ---------------------------------------------------------------------------

/** Bandera de Colombia ondeando en su asta: amarillo arriba (la mitad), azul y rojo (un cuarto cada uno). 32 x 64, base en la fila 59. */
export function dibujarBanderaColombia(): Lienzo {
  const l = new Lienzo(32, 64);
  const x0 = 10;
  const ancho = 18;
  const alto = 16;
  const arriba = 7;
  // Paño: cada columna sube y baja según la onda, que crece lejos del asta.
  for (let i = 0; i < ancho; i++) {
    const amp = 0.4 + (i / ancho) * 1.7;
    const onda = Math.sin(i * 0.55);
    const dy = Math.round(onda * amp);
    const pliegue = Math.cos(i * 0.55);
    const luz = pliegue > 0.45 ? 0 : pliegue < -0.45 ? 2 : 1;
    for (let j = 0; j < alto; j++) {
      const franja = j < alto / 2 ? 'a' : j < alto * 0.75 ? 'b' : 'r';
      const tono: Record<string, readonly ColorEntrada[]> = {
        a: ['tela-calida-3', 'tela-calida-3', 'tela-calida-2'],
        b: ['vidrio-1', 'vidrio-0', 'azul-oficina-1'],
        r: ['rojo-3', 'rojo-2', 'rojo-1'],
      };
      l.px(x0 + i, arriba + j + dy, (tono[franja] as readonly ColorEntrada[])[luz] as ColorEntrada);
    }
    // Borde inferior del paño en sombra, para que el ondeo se lea.
    if (i > 0 && dy > Math.round(Math.sin((i - 1) * 0.55) * (0.4 + ((i - 1) / ancho) * 1.7))) l.px(x0 + i, arriba + alto + dy - 1, 'rojo-1');
  }
  // Asta de metal con remate dorado.
  l.rect(8, 6, 2, 53, 'metal-2');
  l.rect(8, 6, 1, 53, 'metal-3');
  l.rect(9, 6, 1, 53, 'metal-1');
  l.elipseSombreada(8.5, 4, 2, 2, ['tela-calida-1', 'tela-calida-2', 'tela-calida-3']);
  l.rect(8, 6, 2, 1, 'tela-calida-2');
  // Anillas del paño.
  for (const y of [8, 21]) {
    l.rect(10, y, 1, 2, 'metal-3');
    l.px(9, y, 'metal-1');
  }
  // Base redonda de metal.
  l.elipseSombreada(9, 59, 7, 2, ['metal-1', 'metal-2', 'metal-3'], { umbrales: [0.34, 0.74] });
  l.rect(5, 58, 8, 1, 'metal-3');
  return cerrarSuelo(l, { contacto: [10, 59, 8, 2], diagonales: true });
}

// ---------------------------------------------------------------------------
// Sombrero vueltiao
// ---------------------------------------------------------------------------

/** Sombrero vueltiao: copa de domo y ala de trenza crema con vueltas negras. Va sobre una mesa. 32 x 32. */
export function dibujarSombreroVueltiao(): Lienzo {
  const l = new Lienzo(32, 32);
  const cx = 15.5;
  // Ala: elipse achatada, borde negro y una vuelta negra más adentro.
  const cyAla = 12.3;
  for (let y = 8; y < 17; y++) {
    for (let x = 0; x < 32; x++) {
      const dx = (x + 0.5 - cx) / 14.5;
      const dy = (y + 0.5 - cyAla) / 3.3;
      const d = Math.hypot(dx, dy);
      if (d > 1) continue;
      let c: ColorEntrada = x < cx ? 'crema-4' : 'crema-3';
      if (d > 0.86) c = 'neutro-1';
      else if (d > 0.62 && d < 0.72) c = 'neutro-1';
      l.px(x, y, c);
    }
  }
  // Copa: domo con vueltas negras que se curvan siguiendo la forma.
  for (let y = 1; y <= 12; y++) {
    const t = (y - 1) / 11;
    const mitad = 7.6 * Math.sqrt(Math.max(0, 1 - (1 - Math.min(1, t * 1.12)) ** 2));
    const x0 = Math.round(cx - mitad);
    const x1 = Math.round(cx + mitad) - 1;
    for (let x = x0; x <= x1; x++) {
      const u = (x - x0) / Math.max(1, x1 - x0);
      const negro = y === 4 || y === 7 || y === 10;
      if (negro) l.px(x, y, 'neutro-1');
      else l.px(x, y, u < 0.28 ? 'crema-4' : u < 0.7 ? 'crema-3' : 'crema-2');
    }
  }
  // Greca: puntos negros en zigzag entre las vueltas.
  for (const [y, desde] of [[5, 11], [6, 13], [8, 11], [9, 13]] as const) for (let x = desde; x < 20; x += 4) pxSobre(l, x, y, 'neutro-1');
  l.rect(12, 2, 3, 1, 'neutro-7');
  // La copa nace del ala: una línea negra en la base.
  for (let x = 9; x <= 22; x++) l.px(x, 12 + (x < 11 || x > 20 ? 0 : 1), 'neutro-1');
  return cerrarApoyado(l, { diagonales: true });
}

// ---------------------------------------------------------------------------
// Mochila wayuu
// ---------------------------------------------------------------------------

/** Pasa a un tono más oscuro de su rampa los píxeles de una zona (la sombra de la derecha). */
function oscurecerZona(l: Lienzo, x0: number, y0: number, x1: number, y1: number): void {
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const hex = l.leerHex(x, y);
    if (hex !== null) l.px(x, y, oscurecerEnRampa(hex));
  }
}

/** Mochila wayuu: tejido de rombos en colores vivos sobre fondo negro, con asa trenzada y flecos. Va sobre una mesa. 32 x 32. */
export function dibujarMochilaWayuu(): Lienzo {
  const l = new Lienzo(32, 32);
  // Asa trenzada: un arco ancho que sale de la boca.
  l.elipse(15.5, 5.5, 5, 4, 'tela-calida-2', { relleno: false });
  l.elipse(15.5, 5.5, 4, 3, 'rojo-3', { relleno: false });
  for (const [x, y] of [[13, 1], [15, 1], [18, 1], [11, 2], [20, 2]] as const) pxSobre(l, x, y, 'tela-calida-3');
  // Cuerpo: boca de tejido blanco y negro, dos hileras de rombos y una cenefa de zigzag.
  const colores = ['tela-calida-3', 'vidrio-1', 'planta-3', 'rojo-3'] as const;
  for (let y = 5; y <= 13; y++) {
    const x0 = y === 13 ? 10 : 8;
    const x1 = y === 13 ? 21 : 23;
    for (let x = x0; x <= x1; x++) {
      if (y === 5) {
        l.px(x, y, x % 4 < 2 ? 'neutro-1' : 'neutro-7');
      } else if (y === 13) {
        l.px(x, y, x % 2 === 0 ? 'naranja-3' : 'morado-2');
      } else {
        const u = ((x - 8) % 8) - 3.5;
        const v = y - 9;
        const d = Math.abs(u) * 0.9 + Math.abs(v);
        l.px(x, y, d <= 1 ? colores[0] : d <= 2.1 ? colores[1] : d <= 3.2 ? colores[2] : colores[3]);
      }
    }
  }
  for (let x = 8; x <= 23; x++) {
    pxSobre(l, x, 6, 'neutro-1');
    pxSobre(l, x, 12, 'neutro-1');
  }
  oscurecerZona(l, 21, 6, 23, 13);
  oscurecerZona(l, 10, 13, 21, 13);
  // Flecos de colores colgando al centro.
  for (const [x, c] of [[13, 'rojo-3'], [14, 'tela-calida-3'], [15, 'vidrio-1'], [16, 'planta-3'], [17, 'rojo-3'], [18, 'tela-calida-3']] as const) l.rect(x, 14, 1, 2, c);
  return cerrarApoyado(l, { diagonales: true });
}

// ---------------------------------------------------------------------------
// Máscara de carnaval
// ---------------------------------------------------------------------------

/** Una pluma alta con su raquis, sombreada. */
function pluma(l: Lienzo, base: readonly [number, number], punta: readonly [number, number], tonos: readonly [ColorEntrada, ColorEntrada, ColorEntrada, ColorEntrada]): void {
  l.hoja(base, punta, 4, tonos);
}

/** Máscara de Carnaval de Barranquilla: cara amarilla con antifaz azul y morado, mejillas verdes, boca roja y tres plumas. 32 x 32. */
export function dibujarMascaraCarnavalS(): Lienzo {
  const l = new Lienzo(32, 32);
  // Plumas detrás de la cara.
  pluma(l, [12, 9], [5, 1], ['rojo-1', 'rojo-2', 'rojo-3', 'rojo-4']);
  pluma(l, [16, 8], [16, 1], ['tela-calida-1', 'tela-calida-2', 'tela-calida-3', 'neutro-7']);
  pluma(l, [20, 9], [27, 1], ['vidrio-0', 'vidrio-1', 'vidrio-2', 'vidrio-3']);
  // Cara: óvalo amarillo con luz a la izquierda.
  volumen(l, 15.5, 14, 10, 9, (x, y) => enElipse(x, y, 15.5, 14, 8.5, 7.5), ['tela-calida-1', 'tela-calida-2', 'tela-calida-3', 'tela-calida-3'], [0.34, 0.62, 0.9]);
  // Corona de rombos en la frente.
  for (const [x, c] of [[9, 'rojo-3'], [12, 'vidrio-1'], [15, 'rojo-3'], [18, 'vidrio-1'], [21, 'rojo-3']] as const) {
    l.px(x + 1, 8, c);
    l.rect(x, 9, 3, 1, c);
    l.px(x + 1, 10, c);
  }
  // Antifaz: dos alas de mariposa alrededor de los ojos, morado con borde azul.
  for (const lado of [-1, 1]) {
    const cx = 15.5 + lado * 5;
    l.elipse(cx, 13, 4, 3, 'morado-2');
    l.elipse(cx, 13, 4, 3, 'morado-0', { relleno: false });
    l.elipse(cx, 13, 3, 2, 'azul-oficina-0');
    l.px(Math.round(cx) - 1, 12, 'neutro-7');
    l.px(Math.round(cx + lado * 4), 11, 'vidrio-2');
    l.px(Math.round(cx + lado * 4), 15, 'vidrio-2');
  }
  // Nariz y mejillas.
  l.rect(15, 15, 2, 3, 'rojo-2');
  l.px(15, 15, 'rojo-3');
  for (const x of [8, 22]) l.elipse(x + 1, 17, 1, 1, 'planta-3');
  // Boca roja con dientes.
  l.rect(12, 19, 8, 2, 'rojo-2');
  l.rect(13, 21, 6, 1, 'rojo-1');
  l.rect(12, 19, 8, 1, 'rojo-3');
  for (const x of [14, 16, 18]) l.px(x, 20, 'neutro-7');
  // Lentejuelas.
  for (const [x, y] of [[11, 17], [20, 18], [14, 8]] as const) pxSobre(l, x, y, 'neutro-7');
  return cerrarColgante(l);
}

/** La máscara vista de canto sobre la tapa de una pared vertical: tira de franjas de colores y dos plumas. 32 x 32. */
export function dibujarMascaraCarnavalLado(lado: 'E' | 'O'): Lienzo {
  const l = new Lienzo(32, 32);
  const franjas: ColorEntrada[] = ['rojo-3', 'tela-calida-3', 'vidrio-1', 'planta-3', 'morado-2'];
  placaLateral(l, lado, 6, 16, 4, (i, j) => {
    const c = franjas[Math.floor(j / 3) % franjas.length] as ColorEntrada;
    return i === 0 ? c : i === 3 ? oscurecerEnRampa(new Lienzo(1, 1).px(0, 0, c).leerHex(0, 0) as string) : c;
  });
  placaLateral(l, lado, 1, 6, 2, (i, j) => (j < 3 ? 'rojo-3' : 'tela-calida-3'));
  return cerrarColgante(l);
}

// ---------------------------------------------------------------------------
// Registro
// ---------------------------------------------------------------------------

export function cuadrosColombia(): Cuadros {
  const c: Cuadros = new Map();
  registrar(c, 'bandera-colombia', 'U', dibujarBanderaColombia());
  registrar(c, 'sombrero-vueltiao', 'U', dibujarSombreroVueltiao());
  registrar(c, 'mochila-wayuu', 'U', dibujarMochilaWayuu());
  registrar(c, 'mascara-carnaval', 'S', dibujarMascaraCarnavalS());
  registrar(c, 'mascara-carnaval', 'E', dibujarMascaraCarnavalLado('E'));
  registrar(c, 'mascara-carnaval', 'O', dibujarMascaraCarnavalLado('O'));
  return c;
}

void B;
