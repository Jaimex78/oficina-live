/**
 * Decoración del lote 2B: planta chica, planta colgante, palmera, cuadro chico, reloj de pared, lámpara de mesa,
 * lámpara colgante, trofeos, bandera, cojín, pecera, cortinas, espejo y alfombra redonda.
 *
 * Estilo Gather: plantas grandes y frondosas en macetas blancas o grises, objetos de escritorio con gracia (lámpara
 * negra articulada, patito, copa), telas suaves (`lavanda` de base, variantes por cambio de rampa) y contorno azul
 * marino. Lo que emite luz (lámparas, pecera) lleva los tonos más claros y saturados de su rampa.
 */

import { Lienzo, rampa } from '../nucleo';
import { FILA_APOYO, azar, construirCategoria, cuerpoBlando, dentroElipse, entre, poligono, registrar, registrarVariantes, terminar, variantesPorRampa } from './l2b-comun';
import type { Constructores, Cuadros } from './l2b-comun';

const B = FILA_APOYO;
const HOJAS = ['planta-1', 'planta-2', 'planta-3', 'planta-4'] as const;
const HOJAS_OSCURAS = ['planta-0', 'planta-1', 'planta-2', 'planta-3'] as const;

// ---------------------------------------------------------------------------
// Plantas
// ---------------------------------------------------------------------------

/** Maceta blanca redondeada con luz a la izquierda, sombra a la derecha y una banda de color. `banda` es el tono de la franja. */
function macetaBlanca(l: Lienzo, x: number, y: number, ancho: number, alto: number, banda: string): void {
  cuerpoBlando(l, x, y, ancho, alto, 3, ['baldosa-gris-3', 'baldosa-gris-4', 'neutro-7']);
  l.rect(x + 1, y + 2, ancho - 3, 1, banda);
  l.rect(x + 1, y + 3, ancho - 3, 1, 'baldosa-gris-3');
}

/** Planta colgante: maceta blanca con franja y enredaderas que cuelgan por los lados. Va sobre las personas. */
export function dibujarPlantaColgante(): Lienzo {
  const l = new Lienzo(32, 48);
  const r = azar(2401);
  // Maceta colgante.
  macetaBlanca(l, 7, 15, 18, 11, 'lavanda-3');
  l.elipse(15.5, 16, 7, 1, 'madera-oscura-1');
  // Follaje sobre la boca.
  l.elipseSombreada(9, 13, 4, 3, HOJAS);
  l.elipseSombreada(23, 13, 4, 3, HOJAS);
  l.elipseSombreada(16, 11, 6, 4, HOJAS);
  l.elipseSombreada(12, 15, 4, 2, HOJAS);
  l.elipseSombreada(20, 15, 4, 2, HOJAS);
  // Enredaderas: cadenas de hojas que cuelgan por los lados de la maceta.
  const cadenas: Array<[number, number, number]> = [[5, 17, 12], [9, 19, 8], [23, 19, 9], [27, 17, 12]];
  for (const [x0, y0, hojas] of cadenas) {
    let x = x0;
    for (let i = 0; i < hojas; i++) {
      const y = y0 + i * 2;
      x += entre(r, -1, 1) === 0 ? 0 : i % 2 === 0 ? 1 : -1;
      x = Math.max(3, Math.min(28, x));
      l.elipseSombreada(x, y, 1.5, 2, ['planta-2', 'planta-3', 'planta-4']);
    }
  }
  terminar(l, { sombra: false });
  // Gancho y cuerdas, finos y sin contorno.
  l.rect(13, 0, 6, 2, 'baldosa-gris-3');
  l.rect(13, 0, 6, 1, 'neutro-7');
  for (const x of [9, 16, 23]) l.linea(16, 2, x, 14, 'crema-1');
  return l;
}

/**
 * Una fronda de palmera: costilla curva y hojuelas anchas a ambos lados que cuelgan un poco y se acortan hacia la
 * punta. `p0` es la base, `c` el punto de control de la curva y `p1` la punta. `oscura` pinta las de atrás.
 */
function fronda(l: Lienzo, p0: readonly [number, number], c: readonly [number, number], p1: readonly [number, number], hojuelas: number, largo: number, oscura = false): void {
  const punto = (t: number): [number, number] => [
    (1 - t) * (1 - t) * p0[0] + 2 * (1 - t) * t * c[0] + t * t * p1[0],
    (1 - t) * (1 - t) * p0[1] + 2 * (1 - t) * t * c[1] + t * t * p1[1],
  ];
  const tangente = (t: number): [number, number] => {
    const dx = 2 * (1 - t) * (c[0] - p0[0]) + 2 * t * (p1[0] - c[0]);
    const dy = 2 * (1 - t) * (c[1] - p0[1]) + 2 * t * (p1[1] - c[1]);
    const n = Math.hypot(dx, dy) || 1;
    return [dx / n, dy / n];
  };
  const tonos = oscura ? HOJAS_OSCURAS : HOJAS;
  for (let i = 1; i <= hojuelas; i++) {
    const t = 0.12 + (0.88 * i) / hojuelas;
    const [px, py] = punto(Math.min(1, t));
    const [tx, ty] = tangente(Math.min(1, t));
    const long = largo * (1 - 0.5 * t * t);
    for (const lado of [1, -1] as const) {
      const ang = (lado * 60 * Math.PI) / 180;
      let dx = tx * Math.cos(ang) - ty * Math.sin(ang);
      let dy = tx * Math.sin(ang) + ty * Math.cos(ang);
      dy += 0.5;
      const n = Math.hypot(dx, dy) || 1;
      dx /= n;
      dy /= n;
      l.hoja([px, py], [px + dx * long, py + dy * long], 4.2, tonos);
    }
  }
  for (let i = 0; i < 24; i++) {
    const [ax, ay] = punto(i / 24);
    const [bx, by] = punto((i + 1) / 24);
    l.linea(ax, ay, bx, by, oscura ? 'planta-0' : 'planta-1');
  }
}

/** Palmera de interior: tres tallos finos, siete frondas anchas que se abren en arco y una maceta grande blanca y gris. */
export function dibujarPalmera(): Lienzo {
  const l = new Lienzo(64, 112);
  fronda(l, [24, 58], [11, 42], [12, 72], 9, 11, true);
  fronda(l, [40, 58], [53, 42], [52, 72], 9, 11, true);
  fronda(l, [27, 52], [13, 18], [13, 42], 10, 11);
  fronda(l, [37, 52], [51, 18], [51, 42], 10, 11);
  fronda(l, [30, 48], [20, 14], [19, 30], 9, 10);
  fronda(l, [34, 48], [44, 14], [45, 30], 9, 10);
  fronda(l, [32, 46], [31, 20], [36, 13], 9, 9);
  for (const [x0, y0, x1, y1] of [[30, 91, 22, 58], [32, 91, 32, 46], [34, 91, 42, 58]] as const) {
    l.linea(x0, y0, x1, y1, 'planta-1');
    l.linea(x0 - 1, y0, x1 - 1, y1, 'planta-2');
  }
  // Maceta grande: blanca con una banda lavanda y el borde de la tierra.
  cuerpoBlando(l, 17, 88, 30, 21, 5, ['baldosa-gris-3', 'baldosa-gris-4', 'neutro-7']);
  l.rect(19, 93, 26, 2, 'lavanda-3');
  l.rect(19, 95, 26, 1, 'lavanda-2');
  l.rect(19, 96, 26, 1, 'baldosa-gris-3');
  l.elipse(31.5, 89.5, 12, 1.5, 'madera-oscura-1');
  l.rect(22, 89, 8, 1, 'madera-oscura-2');
  return terminar(l);
}

// ---------------------------------------------------------------------------
// Lámparas
// ---------------------------------------------------------------------------

/** Lámpara de escritorio negra articulada con la bombilla encendida (los tonos más claros de la rampa) bajo la cabeza. */
export function dibujarLamparaMesa(): Lienzo {
  const l = new Lienzo(32, 32);
  // Base y brazos.
  cuerpoBlando(l, 8, B - 2, 10, 3, 1, ['azul-oficina-1', 'azul-oficina-2', 'azul-oficina-3']);
  for (const [x0, y0, x1, y1] of [[11, B - 2, 10, B - 8], [10, B - 8, 15, B - 11], [14, B - 11, 18, B - 11]] as const) {
    l.linea(x0, y0, x1, y1, 'azul-oficina-2');
    l.linea(x0 + 1, y0, x1 + 1, y1, 'azul-oficina-3');
  }
  // Cabeza en forma de campana y bombilla encendida debajo.
  cuerpoBlando(l, 15, B - 14, 11, 5, 2, ['azul-oficina-1', 'azul-oficina-2', 'azul-oficina-3']);
  l.rect(16, B - 9, 9, 1, 'tela-calida-2');
  l.elipse(20.5, B - 8, 2.5, 1, 'tela-calida-3');
  l.px(20, B - 8, 'neutro-7');
  l.px(21, B - 8, 'neutro-7');
  return terminar(l);
}

/** Lámpara colgante: cable, cúpula naranja suave y bombilla encendida debajo. Va sobre las personas. */
export function dibujarLamparaColgante(): Lienzo {
  const l = new Lienzo(32, 48);
  // Cúpula: semielipse con luz a la izquierda y arriba.
  for (let y = 0; y < 12; y++) {
    const w = Math.round(11 * Math.sqrt(1 - ((11 - y) / 12) ** 2) + 1);
    const yy = 15 + y;
    l.rect(16 - w, yy, 2 * w, 1, 'naranja-2');
    l.rect(16 - w, yy, Math.max(2, Math.floor(w / 2)), 1, 'naranja-3');
    l.rect(16 + w - Math.max(2, Math.floor(w / 2)), yy, Math.max(2, Math.floor(w / 2)), 1, 'naranja-1');
  }
  l.rect(5, 27, 22, 2, 'naranja-1');
  l.rect(5, 27, 22, 1, 'naranja-2');
  l.rect(9, 18, 4, 1, 'naranja-4');
  // Interior encendido y bombilla.
  l.rect(6, 29, 20, 1, 'tela-calida-3');
  l.elipse(15.5, 33, 5, 4, 'tela-calida-2');
  l.elipse(15.5, 33, 3.5, 3, 'tela-calida-3');
  l.elipse(15, 32, 1.5, 1.5, 'neutro-7');
  terminar(l, { sombra: false });
  // Cable y florón, finos y sin contorno.
  l.rect(13, 0, 6, 2, 'azul-oficina-3');
  l.rect(13, 0, 6, 1, 'azul-oficina-4');
  l.rect(15, 2, 2, 13, 'azul-oficina-3');
  l.rect(15, 2, 1, 13, 'azul-oficina-4');
  return l;
}

// ---------------------------------------------------------------------------
// Trofeos
// ---------------------------------------------------------------------------

/** Una copa dorada redondeada: asas, vaso, tallo y plato sobre una peana azul. `x` es el eje y `yBase` la fila de la base. */
function copa(l: Lienzo, x: number, yBase: number, alto: number, ancho: number): void {
  const semi = Math.floor(ancho / 2);
  const yCopa = yBase - alto;
  // Asas.
  for (const lado of [-1, 1] as const) {
    const xa = x + lado * (semi + 1);
    l.rect(lado < 0 ? xa - 1 : xa, yCopa + 1, 2, 1, 'tela-calida-2');
    l.rect(xa, yCopa + 2, 1, 2, 'tela-calida-2');
    l.rect(lado < 0 ? xa : xa - 1, yCopa + 4, 2, 1, 'tela-calida-2');
  }
  // Vaso.
  const filas = Math.floor(alto * 0.55);
  for (let i = 0; i < filas; i++) {
    const w = Math.max(1, Math.round(semi - ((i * (semi - 1)) / filas) * 0.7));
    l.rect(x - w, yCopa + i, 2 * w + 1, 1, 'tela-calida-2');
    l.rect(x - w, yCopa + i, Math.max(1, Math.floor(w / 2)), 1, 'tela-calida-3');
    l.rect(x + w - Math.max(0, Math.floor(w / 2)), yCopa + i, Math.max(1, Math.floor(w / 2) + 1), 1, 'tela-calida-1');
  }
  l.rect(x - semi, yCopa, 2 * semi + 1, 1, 'tela-calida-3');
  // Tallo y peana.
  l.rect(x - 1, yCopa + filas, 3, alto - filas - 3, 'tela-calida-2');
  l.rect(x - 1, yCopa + filas, 1, alto - filas - 3, 'tela-calida-3');
  l.rect(x - semi, yBase - 3, 2 * semi + 1, 1, 'tela-calida-3');
  l.rect(x - semi, yBase - 2, 2 * semi + 1, 3, 'azul-oficina-3');
  l.rect(x - semi, yBase - 2, 2 * semi + 1, 1, 'azul-oficina-4');
  l.rect(x - 1, yBase - 1, 3, 1, 'tela-calida-2');
}

/** Trofeos: un patito de goma amarillo, una copa dorada al centro y una estrella dorada sobre una peana. */
export function dibujarTrofeos(): Lienzo {
  const l = new Lienzo(32, 32);
  // Patito de goma.
  l.elipseSombreada(7, B - 3, 4, 3, ['tela-calida-1', 'tela-calida-2', 'tela-calida-3']);
  l.elipseSombreada(9, B - 8, 3, 3, ['tela-calida-1', 'tela-calida-2', 'tela-calida-3']);
  l.rect(12, B - 8, 3, 1, 'naranja-3');
  l.rect(12, B - 7, 2, 1, 'naranja-2');
  l.px(9, B - 9, 'azul-oficina-0');
  l.rect(2, B - 4, 3, 2, 'tela-calida-2');
  // Copa.
  copa(l, 18, B, 13, 9);
  // Estrella dorada sobre una peana.
  poligono(l, [[27, 2], [28.5, 5.5], [32, 5.5], [29.3, 7.8], [30.3, 11.2], [27, 9.2], [23.7, 11.2], [24.7, 7.8], [22, 5.5], [25.5, 5.5]], 'tela-calida-3');
  l.rect(26, 7, 1, 3, 'tela-calida-2');
  l.rect(24, B - 3, 6, 4, 'azul-oficina-3');
  l.rect(24, B - 3, 6, 1, 'azul-oficina-4');
  l.rect(26, B - 6, 2, 3, 'tela-calida-2');
  return terminar(l);
}

// ---------------------------------------------------------------------------
// Cojín
// ---------------------------------------------------------------------------

const LAVANDA = rampa('lavanda');
const DESTINOS_TELA: Record<string, readonly string[]> = {
  rojo: rampa('rojo-suave'),
  azul: rampa('azul-oficina'),
  verde: rampa('hoja-pastel'),
  amarillo: [...rampa('tela-calida'), rampa('crema')[4] as string],
  negro: rampa('neutro').slice(0, 5),
};

/** Cojín mullido de `lavanda`: esquinas con un píxel de más, ribete, botón al centro y pliegues cortos. */
export function dibujarCojin(): Lienzo {
  const l = new Lienzo(32, 32);
  const y0 = 3;
  const h = 14;
  cuerpoBlando(l, 7, y0, 18, h, 4, ['lavanda-1', 'lavanda-2', 'lavanda-4']);
  for (const [x, y] of [[7, y0], [24, y0], [7, y0 + h - 1], [24, y0 + h - 1]] as const) l.px(x, y, 'lavanda-2');
  // Ribete y sombra abajo y a la derecha.
  l.rect(10, y0 + h - 3, 13, 1, 'lavanda-1');
  l.rect(22, y0 + 4, 1, 8, 'lavanda-1');
  l.rect(10, y0 + 2, 12, 1, 'lavanda-3');
  l.rect(9, y0 + 3, 1, 7, 'lavanda-3');
  // Botón con pliegues cortos a cada lado.
  l.rect(15, y0 + 6, 2, 2, 'lavanda-0');
  l.px(15, y0 + 6, 'lavanda-4');
  l.rect(12, y0 + 6, 2, 1, 'lavanda-1');
  l.rect(18, y0 + 7, 2, 1, 'lavanda-1');
  l.rect(15, y0 + 3, 1, 2, 'lavanda-3');
  l.rect(16, y0 + 9, 1, 2, 'lavanda-1');
  return terminar(l);
}

// ---------------------------------------------------------------------------
// Bandera
// ---------------------------------------------------------------------------

/** Bandera ondeando en un asta con base redonda. La tela es `lavanda` (recoloreable) con una banda blanca en diagonal. */
export function dibujarBandera(): Lienzo {
  const l = new Lienzo(32, 64);
  // Base y asta.
  l.elipse(8.5, 59, 7, 2, 'baldosa-gris-3');
  l.rect(2, 58, 14, 2, 'baldosa-gris-3');
  l.rect(2, 58, 14, 1, 'baldosa-gris-4');
  l.rect(7, 4, 3, 55, 'baldosa-gris-4');
  l.rect(7, 4, 1, 55, 'neutro-7');
  l.rect(9, 4, 1, 55, 'baldosa-gris-2');
  l.elipse(8, 3, 1.5, 1.5, 'tela-calida-2');
  l.px(7, 2, 'tela-calida-3');
  // Tela: columnas con una onda vertical y tono según la fase de la onda.
  const x0 = 10;
  const ancho = 19;
  for (let i = 0; i < ancho; i++) {
    const fase = (i / ancho) * Math.PI * 2.2;
    const dy = Math.round(Math.sin(fase) * 2.2);
    const tono = Math.cos(fase) > 0.35 ? 'lavanda-3' : Math.cos(fase) < -0.35 ? 'lavanda-1' : 'lavanda-2';
    const y = 7 + dy;
    l.rect(x0 + i, y, 1, 17, tono);
    const yb = y + 2 + Math.round((i * 11) / ancho);
    l.rect(x0 + i, yb, 1, 4, tono === 'lavanda-1' ? 'neutro-5' : 'neutro-7');
  }
  return terminar(l);
}

// ---------------------------------------------------------------------------
// Pecera
// ---------------------------------------------------------------------------

/** Acuario sobre un mueble azul grisáceo: agua clara, arena, plantas, tres peces, burbujas y la luz LED de la tapa. */
export function dibujarPecera(): Lienzo {
  const l = new Lienzo(32, 40);
  // Mueble azul grisáceo con dos puertas.
  cuerpoBlando(l, 3, 25, 26, 12, 2, ['azul-oficina-2', 'azul-oficina-3', 'azul-oficina-4']);
  l.rect(15, 27, 1, 8, 'azul-oficina-2');
  l.rect(16, 27, 1, 8, 'azul-oficina-4');
  l.rect(12, 29, 1, 3, 'neutro-6');
  l.rect(19, 29, 1, 3, 'neutro-6');
  // Vidrio y agua.
  l.rect(3, 6, 26, 18, 'azul-oficina-3');
  l.rect(4, 7, 24, 16, 'vidrio-1');
  l.rect(4, 7, 24, 5, 'vidrio-2');
  l.rect(4, 12, 24, 3, 'vidrio-1');
  l.rect(4, 7, 1, 16, 'vidrio-3');
  // Arena y piedras.
  l.rect(4, 20, 24, 3, 'crema-3');
  l.rect(4, 20, 24, 1, 'crema-4');
  l.rect(4, 22, 24, 1, 'crema-2');
  l.elipse(21.5, 20, 3, 1.5, 'baldosa-gris-3');
  l.elipse(21, 19.5, 1.5, 0.5, 'neutro-6');
  // Algas.
  for (const [x, alto] of [[7, 9], [9, 6], [24, 8], [26, 5]] as const) {
    l.rect(x, 20 - alto, 1, alto, 'planta-3');
    l.rect(x + 1, 20 - alto + 2, 1, alto - 2, 'planta-2');
  }
  // Peces: naranja, rosa y amarillo, con cola.
  const pez = (x: number, y: number, c1: string, c2: string, mira: 1 | -1): void => {
    l.rect(x, y, 5, 3, c1);
    l.rect(x + (mira === 1 ? 1 : 0), y, 4, 1, c2);
    l.rect(mira === 1 ? x - 2 : x + 5, y, 2, 3, c2);
    l.px(mira === 1 ? x + 4 : x, y + 1, 'azul-oficina-0');
  };
  pez(12, 10, 'naranja-2', 'naranja-3', 1);
  pez(18, 15, 'rojo-suave-3', 'rojo-suave-4', -1);
  pez(9, 16, 'tela-calida-2', 'tela-calida-3', 1);
  for (const [x, y] of [[14, 8], [15, 12], [27, 11]] as const) l.rect(x, y, 2, 2, 'vidrio-3');
  // Tapa con la luz.
  cuerpoBlando(l, 2, 2, 28, 5, 2, ['baldosa-gris-3', 'baldosa-gris-4', 'neutro-7']);
  l.rect(6, 4, 20, 1, 'neutro-7');
  l.rect(5, 8, 1, 5, 'neutro-7');
  return terminar(l);
}

// ---------------------------------------------------------------------------
// Alfombra redonda
// ---------------------------------------------------------------------------

/**
 * Alfombra redonda de 2 x 2 en `lavanda`: ribete oscuro, una franja con zigzag, el campo, un aro y un medallón claro.
 * Es plana: sin sombra proyectada y sin contorno exterior propio, solo un canto un poco más oscuro abajo y a la derecha.
 */
export function dibujarAlfombraRedonda(): Lienzo {
  const l = new Lienzo(64, 64);
  const cx = 31.5;
  const cy = 31.5;
  const rx = 29;
  const ry = 27;
  const radio = (x: number, y: number): number => Math.hypot((x + 0.5 - cx - 0.5) / (rx + 0.5), (y + 0.5 - cy - 0.5) / (ry + 0.5));
  for (let y = 0; y < 64; y++) {
    for (let x = 0; x < 64; x++) {
      const d = radio(x, y);
      if (d > 1) continue;
      let color: string;
      if (d > 0.93) color = 'lavanda-0';
      else if (d > 0.62) {
        // Franja con zigzag: el color depende de la posición a lo largo del arco y del ancho de la franja.
        const ang = Math.atan2((y - cy) / ry, (x - cx) / rx);
        const u = ((ang + Math.PI) / (2 * Math.PI)) * 96;
        const v = (d - 0.62) / 0.31 * 9;
        const tri = Math.abs((u % 6) - 3);
        color = Math.floor((v + tri) / 3) % 2 === 0 ? 'lavanda-1' : 'lavanda-3';
      } else if (d > 0.55) color = 'lavanda-4';
      else if (d > 0.3) color = 'lavanda-2';
      else if (d > 0.24) color = 'lavanda-1';
      else color = 'lavanda-4';
      l.px(x, y, color);
    }
  }
  l.elipse(cx, cy, 3, 3, 'lavanda-2');
  l.elipse(cx, cy, 1, 1, 'lavanda-0');
  // Canto en sombra, solo abajo y a la derecha.
  for (let y = 0; y < l.alto - 1; y++) {
    for (let x = 0; x < l.ancho - 1; x++) {
      if (!l.esOpaco(x, y)) continue;
      if (!l.esOpaco(x + 1, y + 1) && (x > cx || y > cy)) l.px(x, y, 'azul-oficina-1');
    }
  }
  return l;
}

// ---------------------------------------------------------------------------
// Registro
// ---------------------------------------------------------------------------

/** Variantes de una tela de `lavanda` (5 tonos) a las demás (`rojo`, `azul`, `verde`, `amarillo`, `negro`) y a un subconjunto de ellas. */
function variantesDeTela(base: Lienzo, nombres: readonly string[]): Record<string, Lienzo> {
  const destinos: Record<string, readonly string[]> = {};
  for (const n of nombres) if (n !== 'base') destinos[n] = DESTINOS_TELA[n] ?? LAVANDA;
  return variantesPorRampa(base, LAVANDA, destinos);
}

const CONSTRUCTORES: Constructores = {
  'planta-colgante': (c) => registrar(c, 'planta-colgante', 'U', dibujarPlantaColgante()),
  palmera: (c) => registrar(c, 'palmera', 'U', dibujarPalmera()),
  'lampara-mesa': (c) => registrar(c, 'lampara-mesa', 'U', dibujarLamparaMesa()),
  'lampara-colgante': (c) => registrar(c, 'lampara-colgante', 'U', dibujarLamparaColgante()),
  trofeos: (c) => registrar(c, 'trofeos', 'U', dibujarTrofeos()),
  bandera: (c) => registrarVariantes(c, 'bandera', 'U', variantesDeTela(dibujarBandera(), ['base', 'rojo', 'negro'])),
  cojin: (c) => registrarVariantes(c, 'cojin', 'U', variantesDeTela(dibujarCojin(), ['base', 'rojo', 'azul', 'verde', 'amarillo', 'negro'])),
  pecera: (c) => registrar(c, 'pecera', 'U', dibujarPecera()),
  'alfombra-redonda': (c) => registrarVariantes(c, 'alfombra-redonda', 'U', variantesDeTela(dibujarAlfombraRedonda(), ['base', 'rojo', 'azul', 'verde', 'negro'])),
};

/** Todos los cuadros de la categoría decoración que ya están dibujados (cuadro, reloj, espejo y cortinas están en `l2b-paredes.ts`). */
export function cuadrosDecoracion(): Cuadros {
  return construirCategoria(CONSTRUCTORES);
}
void dentroElipse;
