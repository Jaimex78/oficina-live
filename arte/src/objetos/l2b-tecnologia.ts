/**
 * Tecnología del lote 2B: monitor doble, portátil, pizarra digital, proyector, parlante e impresora
 * (la cámara de sala cuelga de la pared y está en `l2b-paredes.ts`).
 *
 * Estilo Gather: bisel azul marino, pantallas con interfaces de colores suaves (atardecer, código, página web,
 * gráficos), plásticos blanco azulados y contorno azul marino. Los apoyados (monitor doble, portátil, parlante) se
 * dibujan ya sobre la tapa de un escritorio: su última fila de cuerpo es `FILA_APOYO`. Las pantallas que emiten luz
 * llevan los tonos más claros y saturados de su rampa.
 */

import { Lienzo } from '../nucleo';
import { FILA_APOYO, METAL, construirCategoria, cuerpoBlando, esquinas, poste, registrar, terminar } from './l2b-comun';
import type { Constructores, Cuadros } from './l2b-comun';

const B = FILA_APOYO;

// ---------------------------------------------------------------------------
// Pantallas
// ---------------------------------------------------------------------------

type Contenido = 'codigo' | 'atardecer' | 'pagina' | 'grafico';

/** Contenido de una pantalla de `ancho` x `alto` en `(x, y)`: interfaces genéricas sin texto, en colores suaves. */
function contenidoPantalla(l: Lienzo, x: number, y: number, ancho: number, alto: number, tipo: Contenido): void {
  const c = new Lienzo(ancho, alto);
  if (tipo === 'codigo') {
    // Ventana oscura con barras de colores que simulan líneas de código.
    c.rect(0, 0, ancho, alto, 'azul-oficina-2');
    c.rect(0, 0, ancho, 2, 'azul-oficina-3');
    c.px(1, 0, 'rojo-suave-3');
    c.px(3, 0, 'naranja-3');
    c.px(5, 0, 'hoja-pastel-3');
    const lineas: Array<[number, number, string]> = [[2, 4, 'lavanda-3'], [4, 7, 'hoja-pastel-3'], [4, 5, 'naranja-3'], [2, 9, 'vidrio-2'], [4, 6, 'rojo-suave-3'], [2, 3, 'lavanda-3']];
    lineas.forEach(([dx, largo, color], i) => {
      if (3 + i < alto) c.rect(dx, 3 + i, Math.min(largo, ancho - dx - 1), 1, color);
    });
    c.rect(ancho - 6, 3, 4, alto - 4, 'azul-oficina-1');
    c.rect(ancho - 5, 4, 2, 2, 'naranja-3');
  } else if (tipo === 'atardecer') {
    // Escena retro: cielo en franjas, sol y montañas.
    c.rect(0, 0, ancho, alto, 'morado-2');
    c.rect(0, Math.floor(alto * 0.35), ancho, Math.ceil(alto * 0.25), 'rojo-suave-3');
    c.rect(0, Math.floor(alto * 0.55), ancho, Math.ceil(alto * 0.25), 'naranja-3');
    c.elipse(ancho / 2, alto * 0.62, 4, 4, 'tela-calida-3');
    c.rect(0, Math.floor(alto * 0.72), ancho, alto, 'morado-1');
    c.linea(0, alto - 1, 3, Math.floor(alto * 0.62), 'morado-1');
    c.rect(2, alto - 2, ancho - 4, 1, 'morado-3');
  } else if (tipo === 'pagina') {
    c.rect(0, 0, ancho, alto, 'neutro-7');
    c.rect(0, 0, ancho, 2, 'lavanda-2');
    c.rect(1, 3, Math.floor(ancho * 0.5), 2, 'azul-oficina-3');
    c.rect(1, 6, Math.floor(ancho * 0.4), 1, 'baldosa-gris-3');
    c.rect(ancho - 8, 3, 7, 5, 'vidrio-2');
    c.rect(ancho - 6, 6, 3, 2, 'naranja-3');
    c.rect(1, 8, ancho - 2, alto - 8, 'lavanda-4');
  } else {
    c.rect(0, 0, ancho, alto, 'azul-oficina-1');
    c.rect(1, alto - 2, ancho - 2, 1, 'azul-oficina-4');
    const barras: Array<[number, number, string]> = [[2, 3, 'vidrio-2'], [5, 5, 'rojo-suave-3'], [8, 4, 'lavanda-3'], [11, 6, 'hoja-pastel-3'], [14, 3, 'naranja-3'], [17, 5, 'vidrio-2']];
    for (const [dx, h, color] of barras) if (dx + 2 < ancho) c.rect(dx, alto - 2 - h, 2, h, color);
  }
  l.pegar(c, x, y);
}

/** Pie de un monitor: cuello y base de plástico gris azulado. `x` es el borde izquierdo del bisel. */
function pieMonitor(l: Lienzo, x: number): void {
  l.rect(x + 9, B - 3, 4, 2, 'baldosa-gris-3');
  l.rect(x + 9, B - 3, 1, 2, 'baldosa-gris-4');
  l.rect(x + 5, B - 1, 12, 2, 'baldosa-gris-4');
  l.rect(x + 5, B - 1, 12, 1, 'neutro-7');
  l.rect(x + 5, B, 12, 1, 'baldosa-gris-2');
}

/** Monitor de frente: bisel azul marino con luz arriba y a la izquierda, pantalla de colores, barbilla con un piloto y pie. */
function monitorDeFrente(l: Lienzo, x: number, tipo: Contenido): void {
  const y = B - 14;
  cuerpoBlando(l, x, y, 22, 12, 2, ['azul-oficina-1', 'azul-oficina-2', 'azul-oficina-3']);
  contenidoPantalla(l, x + 1, y + 1, 20, 9, tipo);
  l.rect(x + 18, y + 10, 2, 1, 'hoja-pastel-4');
  pieMonitor(l, x);
}

/** Monitor visto desde atrás: carcasa azul marino con rejillas, la placa del soporte y el cuello. */
function monitorDeEspaldas(l: Lienzo, x: number): void {
  const y = B - 14;
  cuerpoBlando(l, x, y, 22, 12, 2, ['azul-oficina-1', 'azul-oficina-2', 'azul-oficina-3']);
  for (const dy of [2, 4, 6]) l.rect(x + 14, y + dy, 5, 1, 'azul-oficina-1');
  l.elipse(x + 9.5, y + 7, 3, 2, 'azul-oficina-3');
  l.rect(x + 7, y + 7, 5, 1, 'azul-oficina-4');
  pieMonitor(l, x);
}

/** Teclado blanco con hileras de teclas. `x`, `y` es su esquina superior izquierda; mide 21 x 4. */
function teclado(l: Lienzo, x: number, y: number): void {
  cuerpoBlando(l, x, y, 21, 4, 1, ['baldosa-gris-3', 'baldosa-gris-4', 'neutro-7']);
  for (let k = 0; k < 9; k++) l.px(x + 2 + k * 2, y + 1, 'baldosa-gris-3');
  for (let k = 0; k < 8; k++) l.px(x + 3 + k * 2, y + 2, 'baldosa-gris-3');
}

// ---------------------------------------------------------------------------
// Portátil
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Pizarra digital
// ---------------------------------------------------------------------------

/** Lo que se ve en la pizarra: notas adhesivas, un diagrama de cajas y una flecha, sin texto. */
function lienzoPizarra(ancho: number, alto: number): Lienzo {
  const c = new Lienzo(ancho, alto);
  c.rect(0, 0, ancho, alto, 'neutro-7');
  c.rect(0, 0, ancho, 1, 'baldosa-gris-4');
  // Notas adhesivas con una raya de "texto".
  const notas: Array<[number, number, string, string]> = [
    [3, 3, 'tela-calida-3', 'tela-calida-1'],
    [12, 5, 'rojo-suave-4', 'rojo-suave-2'],
    [6, 12, 'hoja-pastel-4', 'hoja-pastel-2'],
  ];
  for (const [x, y, fondo, raya] of notas) {
    c.rect(x, y, 7, 7, fondo);
    c.rect(x + 1, y + 2, 5, 1, raya);
    c.rect(x + 1, y + 4, 3, 1, raya);
  }
  // Diagrama: cajas unidas por flechas.
  c.rectBorde(22, 4, 12, 8, 'azul-oficina-3');
  c.rect(24, 7, 8, 1, 'vidrio-2');
  c.rectBorde(39, 4, 12, 8, 'lavanda-2');
  c.rect(41, 7, 8, 1, 'lavanda-3');
  c.rect(34, 7, 5, 1, 'azul-oficina-2');
  c.px(37, 6, 'azul-oficina-2');
  c.px(37, 8, 'azul-oficina-2');
  c.rect(44, 12, 1, 5, 'azul-oficina-2');
  c.rectBorde(37, 17, 14, 7, 'naranja-2');
  c.rect(39, 20, 10, 1, 'naranja-3');
  // Garabato morado.
  c.linea(22, 22, 25, 17, 'morado-2');
  c.linea(25, 17, 29, 23, 'morado-2');
  c.linea(29, 23, 33, 17, 'morado-2');
  // Barra de herramientas con los colores de los marcadores.
  c.rect(0, alto - 3, ancho, 3, 'baldosa-gris-4');
  c.rect(0, alto - 3, ancho, 1, 'neutro-6');
  [['rojo-suave-3', 3], ['hoja-pastel-3', 8], ['vidrio-1', 13], ['naranja-3', 18]].forEach(([color, x]) => c.rect(Number(x), alto - 2, 3, 2, String(color)));
  return c;
}

/** Pizarra digital sobre un pie con ruedas: panel grande de 2 casillas, bandeja de marcadores y base en T. */
export function dibujarPizarraDigitalS(): Lienzo {
  const l = new Lienzo(64, 48);
  cuerpoBlando(l, 3, 2, 58, 32, 3, ['azul-oficina-1', 'azul-oficina-2', 'azul-oficina-3']);
  l.pegar(lienzoPizarra(54, 27), 5, 4);
  l.rect(57, 32, 2, 1, 'hoja-pastel-4');
  // Bandeja de marcadores.
  l.rectRedondeado(18, 33, 28, 3, 1, 'baldosa-gris-3');
  l.rect(19, 33, 26, 1, 'neutro-7');
  for (const [x, color] of [[22, 'rojo-suave-3'], [26, 'vidrio-1'], [30, 'hoja-pastel-3']] as const) l.rect(x, 32, 3, 1, color);
  // Columna y base en T con ruedas.
  poste(l, 29, 36, 6, 6, METAL);
  l.rectRedondeado(12, 40, 41, 4, 1, 'baldosa-gris-4');
  l.rect(13, 40, 39, 1, 'neutro-7');
  l.rect(13, 43, 39, 1, 'baldosa-gris-2');
  l.rect(14, 44, 3, 1, 'azul-oficina-1');
  l.rect(48, 44, 3, 1, 'azul-oficina-1');
  return terminar(l);
}

/** Pizarra digital de canto: panel delgado con la cara iluminada hacia el lado indicado y el extremo de la base abajo. */
export function dibujarPizarraDigitalLado(lado: 'E' | 'O'): Lienzo {
  const l = new Lienzo(32, 80);
  const este = lado === 'E';
  const xp = este ? 8 : 18;
  cuerpoBlando(l, xp, 3, 6, 58, 2, ['azul-oficina-1', 'azul-oficina-2', 'azul-oficina-3']);
  const xs = este ? xp + 6 : xp - 4;
  l.rect(xs, 4, 4, 56, 'neutro-7');
  l.rect(xs, 4, 1, 56, 'baldosa-gris-4');
  for (const [y, color] of [[10, 'tela-calida-3'], [18, 'rojo-suave-3'], [27, 'hoja-pastel-3'], [37, 'vidrio-1'], [46, 'lavanda-3']] as const) l.rect(xs + 1, y, 2, 3, color);
  l.rect(xs, 56, 4, 3, 'baldosa-gris-4');
  poste(l, xp, 61, 9, 6, METAL);
  l.rectRedondeado(xp - 8, 70, 22, 5, 1, 'baldosa-gris-4');
  l.rect(xp - 7, 70, 20, 1, 'neutro-7');
  l.rect(xp - 7, 74, 20, 1, 'baldosa-gris-2');
  l.rect(xp - 6, 75, 3, 2, 'azul-oficina-1');
  l.rect(xp + 9, 75, 3, 2, 'azul-oficina-1');
  return terminar(l);
}

// ---------------------------------------------------------------------------
// Proyector, parlante e impresora
// ---------------------------------------------------------------------------

/** Proyector colgado del techo: placa, tubo y carcasa blanca redondeada con el lente a la izquierda y rejillas a la derecha. */
export function dibujarProyector(): Lienzo {
  const l = new Lienzo(32, 32);
  l.rectRedondeado(10, 2, 12, 3, 1, 'baldosa-gris-3');
  l.rect(11, 2, 10, 1, 'neutro-7');
  poste(l, 14, 5, 6, 4, METAL);
  cuerpoBlando(l, 3, 10, 26, 12, 3, ['baldosa-gris-3', 'baldosa-gris-4', 'neutro-7']);
  // Lente: anillo, cristal oscuro y destello.
  l.elipse(10, 16, 5, 4, 'azul-oficina-3');
  l.elipse(10, 16, 4, 3, 'azul-oficina-1');
  l.elipse(10, 16, 2, 2, 'azul-oficina-0');
  l.px(8, 15, 'vidrio-3');
  l.px(9, 15, 'vidrio-2');
  // Rejillas, luz de estado y pie de la caja.
  for (const y of [14, 16, 18]) l.rect(18, y, 8, 1, 'baldosa-gris-3');
  l.rect(26, 13, 2, 1, 'hoja-pastel-4');
  l.rect(5, 20, 22, 1, 'baldosa-gris-3');
  return terminar(l, { sombra: false });
}

/** Parlante inteligente: cuerpo redondeado azul marino con rejilla de tela, anillo de colores arriba y un piloto. */
export function dibujarParlante(): Lienzo {
  const l = new Lienzo(32, 32);
  cuerpoBlando(l, 8, B - 14, 16, 15, 4, ['azul-oficina-1', 'azul-oficina-2', 'azul-oficina-3']);
  // Rejilla de tela con una trama fina.
  l.rect(10, B - 8, 12, 8, 'azul-oficina-1');
  l.trama(10, B - 8, 12, 8, 'azul-oficina-2', 'azul-oficina-1', 'tablero');
  // Anillo de luz y botones arriba.
  l.rect(11, B - 12, 10, 2, 'lavanda-3');
  l.rect(11, B - 12, 10, 1, 'lavanda-4');
  l.px(13, B - 10, 'morado-3');
  l.px(18, B - 10, 'naranja-3');
  l.px(15, B - 10, 'hoja-pastel-4');
  l.px(16, B - 10, 'hoja-pastel-4');
  return terminar(l);
}

// ---------------------------------------------------------------------------
// Registro
// ---------------------------------------------------------------------------

const CONSTRUCTORES: Constructores = {
  'pizarra-digital': (c) => {
    registrar(c, 'pizarra-digital', 'S', dibujarPizarraDigitalS());
    registrar(c, 'pizarra-digital', 'E', dibujarPizarraDigitalLado('E'));
  },
  proyector: (c) => registrar(c, 'proyector', 'U', dibujarProyector()),
  parlante: (c) => registrar(c, 'parlante', 'U', dibujarParlante()),
};

/** Todos los cuadros de la categoría tecnología que ya están dibujados. */
export function cuadrosTecnologia(): Cuadros {
  return construirCategoria(CONSTRUCTORES);
}
