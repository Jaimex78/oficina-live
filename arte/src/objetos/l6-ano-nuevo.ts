/**
 * Año Nuevo (lote 6): copas de champán, globos, cuenta regresiva y serpentinas. 6 cuadros.
 *
 * Luz: la cuenta regresiva emite siempre, así que su carátula y su aro llevan los tonos más claros (blanco y dorado
 * alto). Sombras: las copas van sobre una mesa (reborde de 1 px); la cuenta regresiva cuelga de la pared (1 px sobre
 * ella; en las paredes verticales es una placa delgada); globos y serpentinas van en el aire y no llevan sombra.
 */

import { Lienzo } from '../nucleo';
import type { ColorEntrada } from '../nucleo';
import { azar, cerrarApoyado, cerrarColgante, cerrarSinSombra, entre, placaLateral, poligono, pxSobre, quitar, registrar, volumen, enElipse } from './l6-comun';
import type { Cuadros } from './l6-comun';

/** Destello de cuatro puntas, de 3 x 3 px con el centro más claro. */
function destello(l: Lienzo, x: number, y: number, color: ColorEntrada, centro: ColorEntrada = 'neutro-7'): void {
  l.px(x, y - 1, color);
  l.px(x - 1, y, color);
  l.px(x + 1, y, color);
  l.px(x, y + 1, color);
  l.px(x, y, centro);
}

// ---------------------------------------------------------------------------
// Copas de champán
// ---------------------------------------------------------------------------

/** Una copa flauta de pie: copa de vidrio con vino dorado, tallo fino y base. `x` es el borde izquierdo de la copa (5 px). */
function flauta(l: Lienzo, x: number): void {
  // Copa: borde de vidrio claro a la izquierda y más azul a la derecha; boca arriba.
  l.rect(x, 2, 5, 7, 'neutro-7');
  l.rect(x + 4, 2, 1, 7, 'vidrio-2');
  l.rect(x + 1, 9, 3, 1, 'vidrio-3');
  l.px(x, 8, null);
  l.px(x + 4, 8, null);
  // Vino dorado con burbujas.
  l.rect(x + 1, 4, 3, 5, 'tela-calida-3');
  l.rect(x + 3, 4, 1, 5, 'tela-calida-2');
  l.rect(x + 1, 4, 3, 1, 'tela-calida-2');
  l.px(x + 1, 6, 'neutro-7');
  l.px(x + 2, 8, 'neutro-7');
  l.px(x + 2, 5, 'neutro-7');
  // Tallo y base.
  l.rect(x + 2, 10, 1, 4, 'vidrio-3');
  l.rect(x - 1, 14, 7, 1, 'vidrio-3');
  l.rect(x, 15, 5, 1, 'vidrio-2');
}

/** Dos copas de champán con la botella en medio, burbujas, destellos y confeti sobre la mesa. Base en la fila 15. */
export function dibujarCopasChampan(): Lienzo {
  const l = new Lienzo(32, 32);
  // Botella verde con papel dorado y etiqueta.
  l.rect(13, 7, 7, 9, 'planta-1');
  l.rect(13, 7, 2, 9, 'planta-2');
  l.rect(18, 7, 2, 9, 'planta-0');
  l.rect(14, 5, 5, 2, 'planta-1');
  l.rect(15, 2, 3, 3, 'planta-1');
  l.px(15, 3, 'planta-2');
  l.rect(15, 1, 3, 3, 'tela-calida-3');
  l.rect(17, 1, 1, 3, 'tela-calida-2');
  l.rect(14, 5, 5, 1, 'tela-calida-2');
  l.rect(14, 10, 5, 4, 'crema-4');
  l.rect(14, 12, 5, 1, 'tela-calida-2');
  l.px(14, 11, 'neutro-7');
  l.px(13, 8, 'planta-3');
  l.px(13, 9, 'planta-3');
  quitar(l, [13, 15], [19, 15]);
  flauta(l, 5);
  flauta(l, 22);
  l.contorno('azul-oficina-0');
  // Destellos y burbujas que suben, fuera del contorno.
  destello(l, 2, 4, 'tela-calida-3');
  l.px(28, 3, 'neutro-7');
  l.px(29, 2, 'tela-calida-3');
  // Confeti sobre la mesa.
  for (const [x, y, c] of [[2, 14, 'rojo-3'], [3, 14, 'rojo-3'], [29, 13, 'vidrio-1'], [30, 13, 'vidrio-1'], [11, 15, 'tela-calida-3'], [12, 15, 'tela-calida-3'], [20, 15, 'planta-3'], [21, 15, 'planta-3']] as const) l.px(x, y, c);
  return l.sombraProyectada('azul-oficina-2', 1, 1);
}

// ---------------------------------------------------------------------------
// Globos de Año Nuevo
// ---------------------------------------------------------------------------

const ORO = ['tela-calida-0', 'tela-calida-1', 'tela-calida-2', 'tela-calida-3'] as const;
const PLATA = ['neutro-3', 'neutro-5', 'neutro-6', 'neutro-7'] as const;
const NOCHE = ['azul-oficina-1', 'azul-oficina-2', 'azul-oficina-3', 'azul-oficina-4'] as const;

/** Un globo ovalado con volumen, brillo y nudo. */
function globo(l: Lienzo, cx: number, cy: number, rx: number, ry: number, tonos: readonly ColorEntrada[]): void {
  volumen(l, cx, cy, rx + 0.5, ry + 0.5, (x, y) => enElipse(x, y, cx, cy, rx, ry), tonos, [0.34, 0.62, 0.9]);
  l.px(Math.round(cx - rx * 0.45), Math.round(cy - ry * 0.5), 'neutro-7');
  l.px(Math.round(cx - rx * 0.45), Math.round(cy - ry * 0.5) + 1, 'neutro-7');
  l.px(Math.round(cx - rx * 0.45) + 1, Math.round(cy - ry * 0.5) - 1, 'neutro-7');
  l.rect(Math.round(cx) - 1, Math.round(cy + ry) + 1, 3, 1, tonos[1] as ColorEntrada);
  l.px(Math.round(cx), Math.round(cy + ry) + 2, tonos[0] as ColorEntrada);
}

/** Ramo de globos dorado, plateado y azul noche con una estrella dorada arriba, atado a un peso. Va en el aire. 32 x 48. */
export function dibujarGlobosAnoNuevo(): Lienzo {
  const l = new Lienzo(32, 48);
  // Hilos hacia el peso, debajo de los globos.
  for (const [x, y] of [[9, 28], [23, 28], [16, 31]] as const) l.linea(x, y, 16, 40, 'neutro-5');
  l.linea(16, 15, 16, 22, 'neutro-5');
  // Globos de atrás hacia adelante.
  globo(l, 9, 22, 5, 6.5, ORO);
  globo(l, 23, 22, 5, 6.5, PLATA);
  globo(l, 16, 25, 5.5, 7, NOCHE);
  // Estrella dorada de aluminio arriba.
  const estrella = new Lienzo(32, 48);
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < 10; i++) {
    const ang = (-90 + i * 36) * (Math.PI / 180);
    const r = i % 2 === 0 ? 8 : 3.7;
    pts.push([16 + Math.cos(ang) * r, 9 + Math.sin(ang) * r]);
  }
  poligono(estrella, pts, 'tela-calida-2');
  for (let y = 0; y < 20; y++) for (let x = 0; x < 32; x++) {
    if (!estrella.esOpaco(x, y)) continue;
    estrella.px(x, y, x < 14 ? 'tela-calida-3' : x > 18 ? 'tela-calida-1' : 'tela-calida-2');
  }
  estrella.px(11, 6, 'neutro-7');
  estrella.px(12, 6, 'neutro-7');
  estrella.px(14, 3, 'neutro-7');
  estrella.px(13, 9, 'tela-calida-3');
  l.pegar(estrella, 0, 0);
  // Peso.
  l.rect(14, 40, 5, 4, 'metal-2');
  l.rect(14, 40, 5, 1, 'metal-3');
  l.rect(14, 43, 5, 1, 'metal-1');
  return cerrarSinSombra(l);
}

// ---------------------------------------------------------------------------
// Cuenta regresiva
// ---------------------------------------------------------------------------

/** Reloj grande de pared casi a medianoche, con aro dorado, carátula blanca y confeti a los lados. Brilla. 64 x 32. */
export function dibujarCuentaRegresivaS(): Lienzo {
  const l = new Lienzo(64, 32);
  const cx = 31.5;
  const cy = 11.5;
  // Aro dorado con volumen y carátula encendida.
  l.elipseSombreada(cx, cy, 10.5, 10.5, ['tela-calida-0', 'tela-calida-1', 'tela-calida-2', 'tela-calida-3'], { umbrales: [0.3, 0.6, 0.88] });
  l.elipse(cx, cy, 8.5, 8.5, 'neutro-7');
  // Sombra interior de la carátula, arriba a la izquierda.
  for (let a = 200; a <= 290; a += 4) {
    const r = (a * Math.PI) / 180;
    l.px(Math.round(cx + Math.cos(r) * 8.2), Math.round(cy + Math.sin(r) * 8.2), 'tela-calida-3');
  }
  // Marcas: gruesas en 12, 3, 6 y 9; puntos en las demás.
  for (let h = 0; h < 12; h++) {
    const ang = (h * 30 * Math.PI) / 180;
    const sx = Math.sin(ang);
    const sy = -Math.cos(ang);
    if (h % 3 === 0) {
      for (const r of [7, 6, 5]) l.px(Math.round(cx + sx * r), Math.round(cy + sy * r), 'azul-oficina-1');
      if (h === 0) {
        l.px(Math.round(cx - 1), Math.round(cy - 7), 'rojo-3');
        l.px(Math.round(cx + 1), Math.round(cy - 7), 'rojo-3');
      }
    } else {
      l.px(Math.round(cx + sx * 7), Math.round(cy + sy * 7), 'neutro-4');
    }
  }
  // Manecillas casi en las 12: la del minuto apenas antes, la del segundero rojo.
  const mano = (largo: number, grados: number, color: ColorEntrada, grueso = false): void => {
    const r = (grados * Math.PI) / 180;
    const x1 = cx + Math.sin(r) * largo;
    const y1 = cy - Math.cos(r) * largo;
    l.linea(Math.round(cx), Math.round(cy), Math.round(x1), Math.round(y1), color);
    if (grueso) l.linea(Math.round(cx) + 1, Math.round(cy), Math.round(x1) + 1, Math.round(y1), color);
  };
  mano(4.5, -3, 'azul-oficina-1', true);
  mano(7, -11, 'azul-oficina-1');
  mano(7.5, -34, 'rojo-3');
  l.rect(Math.round(cx), Math.round(cy), 2, 2, 'rojo-3');
  l.px(Math.round(cx), Math.round(cy), 'rojo-4');
  // Serpentinas a los lados.
  for (const [x0, c1, c2, largo] of [[3, 'rojo-3', 'rojo-2', 17], [59, 'vidrio-1', 'vidrio-0', 19]] as const) {
    for (let t = 0; t < largo; t++) {
      const x = Math.round(x0 + 1.2 * Math.sin(t * 0.38));
      l.px(x, 2 + t, c1);
      l.px(x + 1, 2 + t, c2);
    }
  }
  cerrarColgante(l);
  // Destellos del brindis: van en el aire, fuera del contorno.
  destello(l, 14, 8, 'tela-calida-3');
  destello(l, 5, 21, 'neutro-7', 'tela-calida-3');
  destello(l, 49, 7, 'tela-calida-3');
  destello(l, 55, 21, 'neutro-7', 'tela-calida-3');
  destello(l, 18, 19, 'neutro-7', 'tela-calida-3');
  destello(l, 44, 19, 'tela-calida-3');
  return l;
}

/** El reloj visto de canto sobre la tapa de una pared vertical: aro dorado grueso con la carátula encendida. 32 x 64. */
export function dibujarCuentaRegresivaLado(lado: 'E' | 'O'): Lienzo {
  const l = new Lienzo(32, 64);
  placaLateral(l, lado, 21, 22, 5, (i, j) => {
    const mitad = 11 - Math.abs(j - 10.5);
    const forma = Math.max(1, Math.round(5 * Math.sqrt(Math.max(0, 1 - ((j - 10.5) / 11) ** 2))));
    if (i >= forma) return null;
    if (j < 2 || j > 19) return 'tela-calida-2';
    if (i === 0) return 'tela-calida-3';
    if (i === 1 && mitad > 3) return 'neutro-7';
    return i >= forma - 1 ? 'tela-calida-1' : 'tela-calida-2';
  });
  // Serpentinas colgando arriba y abajo.
  placaLateral(l, lado, 4, 14, 2, (i, j) => (j % 4 < 2 ? (i === 0 ? 'rojo-3' : 'rojo-2') : i === 0 ? 'rojo-2' : null));
  placaLateral(l, lado, 44, 10, 2, (i, j) => (j % 4 < 2 ? (i === 0 ? 'vidrio-1' : 'vidrio-0') : i === 1 ? 'vidrio-0' : null));
  return cerrarColgante(l);
}

// ---------------------------------------------------------------------------
// Serpentinas
// ---------------------------------------------------------------------------

/** Seis cintas de colores que cuelgan del techo en ondas y rematan en rizo, con confeti. Van en el aire. 64 x 32. */
export function dibujarSerpentinas(): Lienzo {
  const l = new Lienzo(64, 32);
  const r = azar(5);
  const cintas: Array<[number, string, string, number, number]> = [
    [6, 'rojo-3', 'rojo-2', 20, 0.3],
    [16, 'vidrio-1', 'vidrio-0', 26, 1.9],
    [27, 'tela-calida-2', 'tela-calida-1', 17, 3.2],
    [38, 'planta-3', 'planta-2', 24, 0.7],
    [48, 'morado-2', 'morado-1', 19, 2.4],
    [58, 'naranja-3', 'naranja-2', 25, 4.1],
  ];
  for (const [x0, c1, c2, largo, fase] of cintas) {
    // Cinta del techo con una onda.
    for (let t = 0; t < largo; t++) {
      const x = Math.round(x0 + 2.4 * Math.sin(t * 0.42 + fase));
      l.px(x, 2 + t, c1);
      l.px(x + 1, 2 + t, c2);
    }
    // Rizo del final.
    const xf = Math.round(x0 + 2.4 * Math.sin((largo - 1) * 0.42 + fase));
    const yf = 2 + largo;
    l.elipse(xf + 2, yf + 1, 2, 2, c1, { relleno: false });
    l.px(xf + 1, yf + 1, null);
    l.px(xf + 4, yf + 1, c2);
    // Cinta adhesiva en el techo.
    l.rect(xf - 1, 0, 4, 2, 'neutro-6');
  }
  l.contorno('azul-oficina-0');
  // Confeti suelto: piezas de 2 px, sin contorno.
  for (let i = 0; i < 14; i++) {
    const x = entre(r, 1, 61);
    const y = entre(r, 4, 28);
    if (l.esOpaco(x, y) || l.esOpaco(x + 1, y) || l.esOpaco(x - 1, y) || l.esOpaco(x + 2, y) || l.esOpaco(x, y - 1) || l.esOpaco(x, y + 1)) continue;
    const c = ['rojo-3', 'tela-calida-3', 'vidrio-2', 'planta-4', 'morado-3', 'naranja-3'][i % 6] as ColorEntrada;
    l.px(x, y, c);
    l.px(x + 1, y + (i % 2), c);
  }
  void pxSobre;
  return l;
}

// ---------------------------------------------------------------------------
// Registro
// ---------------------------------------------------------------------------

export function cuadrosAnoNuevo(): Cuadros {
  const c: Cuadros = new Map();
  registrar(c, 'copas-champan', 'U', dibujarCopasChampan());
  registrar(c, 'globos-ano-nuevo', 'U', dibujarGlobosAnoNuevo());
  registrar(c, 'cuenta-regresiva', 'S', dibujarCuentaRegresivaS());
  registrar(c, 'cuenta-regresiva', 'E', dibujarCuentaRegresivaLado('E'));
  registrar(c, 'cuenta-regresiva', 'O', dibujarCuentaRegresivaLado('O'));
  registrar(c, 'serpentinas', 'U', dibujarSerpentinas());
  return c;
}

void cerrarApoyado;
