/**
 * Temporada y eventos del lote 2B: luces de Navidad, árbol de Navidad, calabazas, globos, banderines, regalos,
 * cartel de cumpleaños y piñata.
 *
 * Lo que va en el aire (luces, globos, banderines, piñata) está en la capa `sobre`: sin sombra proyectada.
 * Los dibujos de varios colores (globos, banderines, regalos) tienen una variante base multicolor y variantes de un
 * solo color que salen de cambiar cada rampa de origen por una sola de destino.
 */

import { Lienzo, rampa } from '../nucleo';
import { FILA_APOYO, aUnSoloColor, construirCategoria, poligono, registrar, registrarVariantes, terminar } from './l2b-comun';
import type { Constructores, Cuadros } from './l2b-comun';

const B = FILA_APOYO;

// ---------------------------------------------------------------------------
// Luces de Navidad
// ---------------------------------------------------------------------------

/** Dos guirnaldas de luces: cable verde en curva con bombillas de colores colgando. Va sobre las personas. */
export function dibujarLucesNavidad(): Lienzo {
  const l = new Lienzo(64, 40);
  const colores: Array<[string, string]> = [['rojo-suave-3', 'rojo-suave-4'], ['tela-calida-2', 'tela-calida-3'], ['planta-3', 'planta-4'], ['vidrio-1', 'vidrio-2']];
  const tramos: Array<[number, number]> = [[2, 32], [32, 62]];
  const alto = (x: number, xa: number, xb: number): number => {
    const u = (x - xa) / (xb - xa);
    return 5 + Math.round(11 * 4 * u * (1 - u));
  };
  // Bombillas primero (con su contorno tonal) y el cable encima, fino y sin contorno.
  let n = 0;
  for (const [xa, xb] of tramos) {
    for (const x of [xa + 5, xa + 11, xa + 17, xa + 23]) {
      const y = alto(x, xa, xb);
      const [c, claro] = colores[n % colores.length] ?? colores[0]!;
      l.rect(x, y + 1, 2, 2, 'neutro-3');
      l.rect(x - 1, y + 3, 4, 4, c);
      l.rect(x - 1, y + 3, 2, 2, claro);
      l.px(x - 1, y + 3, 'neutro-7');
      n++;
    }
  }
  l.contorno('azul-oficina-0');
  for (const [xa, xb] of tramos) {
    for (let x = xa; x <= xb; x++) l.px(x, alto(x, xa, xb), 'planta-1');
    for (let x = xa; x < xb; x++) {
      const y0 = alto(x, xa, xb);
      const y1 = alto(x + 1, xa, xb);
      for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) l.px(x, y, 'planta-1');
    }
  }
  for (const x of [2, 32, 62]) {
    l.rect(x - 1, 3, 3, 2, 'metal-2');
    l.rect(x - 1, 3, 3, 1, 'metal-3');
  }
  return l;
}

// ---------------------------------------------------------------------------
// Árbol de Navidad
// ---------------------------------------------------------------------------

/** Una capa del árbol: triángulo de ramas con luz a la izquierda y borde inferior en picos. */
function capaArbol(l: Lienzo, cx: number, yTop: number, yBase: number, mitad: number): void {
  const alto = yBase - yTop;
  for (let y = yTop; y <= yBase; y++) {
    const w = Math.round((mitad * (y - yTop + 1)) / (alto + 1)) + 1;
    l.rect(cx - w, y, 2 * w, 1, 'planta-2');
    l.rect(cx - w, y, Math.max(2, Math.floor(w * 0.45)), 1, 'planta-3');
    l.rect(cx + w - Math.max(2, Math.floor(w * 0.4)), y, Math.max(2, Math.floor(w * 0.4)), 1, 'planta-1');
  }
  // Borde inferior en picos y ramas más oscuras.
  for (let x = cx - mitad - 1; x <= cx + mitad; x += 4) {
    l.rect(x, yBase, 3, 2, 'planta-2');
    l.px(x, yBase + 1, 'planta-1');
  }
  l.rect(cx - mitad, yBase - 1, 2 * mitad, 1, 'planta-1');
}

/** Árbol de Navidad de cuatro capas con estrella, bolas, guirnalda y luces, en una maceta roja. */
export function dibujarArbolNavidad(): Lienzo {
  const l = new Lienzo(32, 64);
  // Maceta roja con una banda dorada.
  l.rect(9, 54, 14, 7, 'rojo-suave-2');
  l.rect(9, 54, 14, 1, 'rojo-suave-3');
  l.rect(9, 54, 2, 7, 'rojo-suave-3');
  l.rect(21, 54, 2, 7, 'rojo-suave-1');
  l.rect(9, 57, 14, 1, 'tela-calida-2');
  l.rect(9, 58, 14, 1, 'tela-calida-1');
  // Tronco y capas.
  l.rect(14, 50, 4, 5, 'madera-oscura-2');
  capaArbol(l, 16, 34, 52, 13);
  capaArbol(l, 16, 22, 40, 10);
  capaArbol(l, 16, 12, 28, 8);
  capaArbol(l, 16, 5, 18, 5);
  // Estrella.
  l.rect(15, 1, 2, 5, 'tela-calida-3');
  l.rect(13, 3, 6, 2, 'tela-calida-3');
  l.rect(14, 2, 4, 4, 'tela-calida-2');
  l.px(15, 3, 'neutro-7');
  // Guirnalda dorada en zigzag.
  for (const [x0, y0, x1, y1] of [[6, 46, 25, 40], [9, 33, 23, 29], [11, 22, 21, 18]] as const) l.linea(x0, y0, x1, y1, 'tela-calida-3');
  // Bolas y luces.
  const bolas: Array<[number, number, string, string]> = [
    [7, 49, 'rojo-suave-3', 'rojo-suave-4'], [24, 47, 'vidrio-1', 'vidrio-2'], [15, 44, 'tela-calida-2', 'tela-calida-3'], [11, 38, 'rojo-suave-3', 'rojo-suave-4'],
    [21, 36, 'tela-calida-2', 'tela-calida-3'], [16, 30, 'vidrio-1', 'vidrio-2'], [11, 26, 'tela-calida-2', 'tela-calida-3'], [20, 24, 'rojo-suave-3', 'rojo-suave-4'],
    [14, 16, 'rojo-suave-3', 'rojo-suave-4'], [18, 12, 'vidrio-1', 'vidrio-2'], [16, 8, 'tela-calida-2', 'tela-calida-3'],
  ];
  for (const [x, y, c, claro] of bolas) {
    l.rect(x, y, 3, 3, c);
    l.px(x, y, claro);
  }
  for (const [x, y, c] of [[5, 51, 'tela-calida-3'], [27, 50, 'rojo-suave-4'], [10, 42, 'rojo-suave-4'], [24, 40, 'tela-calida-3'], [13, 33, 'tela-calida-3'], [19, 28, 'rojo-suave-4'], [14, 20, 'tela-calida-3'], [19, 17, 'tela-calida-3']] as const) l.px(x, y, c);
  return terminar(l);
}

// ---------------------------------------------------------------------------
// Calabazas
// ---------------------------------------------------------------------------

/** Una calabaza con costillas verticales: cuerpo ancho que pasa del rojizo al ámbar, luz a la izquierda y tallo con vena. */
function calabaza(l: Lienzo, cx: number, cy: number, rx: number, ry: number): void {
  l.elipseSombreada(cx, cy, rx, ry, ['naranja-1', 'naranja-2', 'naranja-3', 'naranja-4'], { umbrales: [0.3, 0.6, 0.86] });
  // Costillas: curvas oscuras de arriba abajo.
  for (const k of [-0.55, 0.05, 0.6]) {
    for (let y = Math.round(cy - ry + 1); y <= Math.round(cy + ry - 1); y++) {
      const v = (y - cy) / (ry + 0.5);
      const x = Math.round(cx + k * rx * Math.sqrt(Math.max(0, 1 - v * v)));
      l.px(x, y, 'naranja-1');
    }
  }
  // Tallo.
  const xt = Math.round(cx);
  const yt = Math.round(cy - ry);
  l.rect(xt - 1, yt - 3, 3, 4, 'planta-1');
  l.px(xt - 1, yt - 3, 'planta-2');
  l.px(xt, yt - 3, 'planta-2');
}

/** Dos calabazas: la grande tallada, con la vela encendida (brillo cálido bajo cada hueco), y una chica lisa. */
export function dibujarCalabazas(): Lienzo {
  const l = new Lienzo(32, 32);
  calabaza(l, 24, B - 4, 5, 4);
  calabaza(l, 12, B - 5, 10, 6);
  // Huecos tallados: oscuros, con un resplandor de vela en el borde de abajo.
  const cx = 12;
  const cy = B - 5;
  for (const x of [cx - 6, cx + 2]) {
    l.rect(x, cy - 3, 5, 1, 'azul-oficina-0');
    l.rect(x + 1, cy - 2, 3, 2, 'azul-oficina-0');
    l.rect(x + 2, cy, 1, 1, 'azul-oficina-0');
    l.rect(x + 1, cy - 1, 3, 1, 'tela-calida-3');
  }
  l.rect(cx - 6, cy + 2, 13, 1, 'azul-oficina-0');
  l.rect(cx - 5, cy + 3, 11, 1, 'azul-oficina-0');
  l.rect(cx - 3, cy + 4, 7, 1, 'tela-calida-3');
  for (const x of [cx - 4, cx - 1, cx + 2]) l.rect(x, cy + 2, 2, 1, 'tela-calida-2');
  return terminar(l);
}

// ---------------------------------------------------------------------------
// Globos
// ---------------------------------------------------------------------------

const ROJOS = rampa('rojo-suave').slice(1, 5);
const AMARILLOS = rampa('tela-calida');
const AZULES = rampa('vidrio');

/** Ramo de tres globos atados a un peso: rojo, amarillo y azul. Va sobre las personas. */
export function dibujarGlobos(): Lienzo {
  const l = new Lienzo(32, 48);
  const globos: Array<[number, number, number, number, readonly string[]]> = [
    [9, 16, 5, 7, ROJOS],
    [23, 17, 5, 7, AZULES],
    [16, 9, 6, 8, AMARILLOS],
  ];
  // Hilos hacia el peso, debajo de los globos.
  for (const [x, y, , ry] of globos) l.linea(x, y + ry + 2, 16, 40, 'neutro-5');
  for (const [x, y, rx, ry, tonos] of globos) {
    l.elipseSombreada(x, y, rx, ry, tonos);
    l.elipse(x, y, rx, ry, tonos[0] ?? 'rojo-suave-1', { relleno: false });
    l.px(x - 2, y - ry + 2, 'neutro-7');
    l.px(x - 3, y - ry + 3, 'neutro-7');
    // Nudo.
    l.rect(x - 1, y + ry + 1, 3, 1, tonos[1] ?? 'rojo-suave-2');
    l.px(x, y + ry + 2, tonos[0] ?? 'rojo-suave-1');
  }
  // Peso.
  l.rect(14, 40, 5, 4, 'metal-2');
  l.rect(14, 40, 5, 1, 'metal-3');
  l.rect(14, 43, 5, 1, 'metal-1');
  return terminar(l, { sombra: false });
}

// ---------------------------------------------------------------------------
// Banderines
// ---------------------------------------------------------------------------

const TRIOS = {
  rojo: ['rojo-suave-1', 'rojo-suave-2', 'rojo-suave-3'],
  amarillo: ['tela-calida-1', 'tela-calida-2', 'tela-calida-3'],
  azul: ['vidrio-0', 'vidrio-1', 'vidrio-2'],
  verde: ['planta-1', 'planta-2', 'planta-3'],
} as const;

/** Contorno, sombra, medio y luz de cada banderín: el contorno tonal de la sombra es el tono anterior de su rampa. */
const CUARTETOS = {
  rojo: ['rojo-suave-0', 'rojo-suave-1', 'rojo-suave-2', 'rojo-suave-3'],
  amarillo: ['tela-calida-0', 'tela-calida-1', 'tela-calida-2', 'tela-calida-3'],
  azul: ['vidrio-0', 'vidrio-0', 'vidrio-1', 'vidrio-2'],
  verde: ['planta-0', 'planta-1', 'planta-2', 'planta-3'],
} as const;

/** Guirnalda de banderines triangulares colgando de una cuerda en curva. Va sobre las personas. */
export function dibujarBanderines(): Lienzo {
  const l = new Lienzo(96, 32);
  const orden = [TRIOS.rojo, TRIOS.amarillo, TRIOS.azul, TRIOS.verde] as const;
  const y = (x: number): number => 3 + Math.round(8 * 4 * (x / 93) * (1 - x / 93));
  const n = 10;
  for (let i = 0; i < n; i++) {
    const xc = 8 + Math.round((i * 80) / (n - 1));
    const [oscuro, medio, claro] = orden[i % orden.length] ?? TRIOS.rojo;
    // Triángulo invertido de 8 de ancho: su borde de arriba sigue la cuerda. Luz a la izquierda y sombra a la derecha.
    for (let dx = -4; dx < 4; dx++) {
      const x = xc + dx;
      const prof = Math.round(10 * (1 - Math.abs(dx + 0.5) / 4.2));
      const color = dx < -2 ? claro : dx > 1 ? oscuro : medio;
      l.rect(x, y(x) + 1, 1, prof, color);
    }
  }
  l.contorno('azul-oficina-0');
  // Cuerda fina encima, sin contorno.
  for (let x = 1; x < 95; x++) {
    const a = y(x);
    const b = y(x + 1);
    for (let yy = Math.min(a, b); yy <= Math.max(a, b); yy++) l.px(x, yy, 'neutro-4');
  }
  for (const x of [1, 94]) l.rect(x - 1, 2, 3, 2, 'metal-2');
  return l;
}

/** Hex de un color de la paleta por su nombre (`rojo-1`). */
function colorHex(nombre: string): string {
  const corte = nombre.lastIndexOf('-');
  return rampa(nombre.slice(0, corte))[Number(nombre.slice(corte + 1))] ?? '#000000';
}

/** Variante de dos colores de los banderines: unos con `destino` (contorno, sombra, medio, luz) y los otros blancos. */
function banderinesBicolor(base: Lienzo, destino: readonly [string, string, string, string]): Lienzo {
  const blanco = ['neutro-4', 'neutro-5', 'neutro-6', 'neutro-7'] as const;
  const mapa: Record<string, string> = {};
  const poner = (origen: readonly string[], dest: readonly string[]): void => {
    origen.forEach((c, i) => {
      mapa[colorHex(c)] = colorHex(dest[i] ?? c);
    });
  };
  poner(CUARTETOS.rojo, destino);
  poner(CUARTETOS.azul, destino);
  poner(CUARTETOS.amarillo, blanco);
  poner(CUARTETOS.verde, blanco);
  return base.recolorear(mapa);
}

// ---------------------------------------------------------------------------
// Regalos
// ---------------------------------------------------------------------------

/** Una caja de regalo con cinta blanca en cruz y moño opcional. `piel` son los tres tonos de la caja (oscuro, medio, claro). */
function regalo(l: Lienzo, x: number, y: number, ancho: number, fondo: number, alto: number, piel: readonly [string, string, string], moño: boolean): void {
  l.rect(x, y, ancho, fondo, piel[2]);
  l.rect(x, y + fondo, ancho, alto, piel[1]);
  l.rect(x, y + fondo, 1, alto, piel[2]);
  l.rect(x + ancho - 1, y + fondo, 1, alto, piel[0]);
  l.rect(x, y + fondo + alto - 1, ancho, 1, piel[0]);
  l.rect(x + ancho - 1, y + 1, 1, fondo - 1, piel[1]);
  // Cinta vertical y horizontal.
  const cx = x + Math.floor(ancho / 2) - 1;
  l.rect(cx, y, 2, fondo + alto, 'neutro-7');
  l.rect(cx + 1, y, 1, fondo + alto, 'neutro-6');
  l.rect(x, y + fondo, ancho, 1, 'neutro-6');
  if (moño) {
    l.rect(cx - 3, y - 2, 3, 2, 'neutro-7');
    l.rect(cx + 2, y - 2, 3, 2, 'neutro-6');
    l.rect(cx - 1, y - 1, 4, 2, 'neutro-7');
  }
}

/** Tres cajas de regalo apiladas: roja, azul y verde, con cinta blanca. */
export function dibujarRegalos(): Lienzo {
  const l = new Lienzo(32, 32);
  regalo(l, 3, B - 7, 14, 3, 5, ['rojo-suave-1', 'rojo-suave-2', 'rojo-suave-3'], false);
  regalo(l, 19, B - 6, 10, 3, 3, ['vidrio-0', 'vidrio-1', 'vidrio-2'], true);
  regalo(l, 6, B - 12, 8, 2, 3, ['planta-1', 'planta-2', 'planta-3'], true);
  return terminar(l);
}

// ---------------------------------------------------------------------------
// Piñata
// ---------------------------------------------------------------------------

/** Piñata de estrella de cinco puntas de colores, colgada de una cuerda, con un centro de papel claro. Va sobre las personas. */
export function dibujarPinata(): Lienzo {
  const l = new Lienzo(32, 48);
  const cx = 15.5;
  const cy = 27;
  const re = 15.5;
  const ri = 8.5;
  const puntas = [TRIOS.rojo, TRIOS.amarillo, TRIOS.verde, TRIOS.azul, ['naranja-1', 'naranja-2', 'naranja-3']] as const;
  const angulo = (i: number): number => -Math.PI / 2 + (i * Math.PI) / 5;
  const vertice = (i: number): [number, number] => {
    const r = i % 2 === 0 ? re : ri;
    return [cx + Math.cos(angulo(i)) * r, cy + Math.sin(angulo(i)) * r];
  };
  // Cada punta es un rombo entre sus dos vértices interiores, el centro y su vértice exterior: mitad iluminada y mitad en sombra.
  puntas.forEach((tonos, k) => {
    const prev = vertice((2 * k + 9) % 10);
    const punta = vertice(2 * k);
    const sig = vertice(2 * k + 1);
    poligono(l, [prev, punta, sig, [cx, cy]], tonos[1]);
    poligono(l, [prev, punta, [cx, cy]], tonos[2]);
    poligono(l, [sig, punta, [cx, cy]], tonos[0]);
  });
  // Flecos de papel: pequeñas muescas en el borde de cada punta.
  for (let k = 0; k < 5; k++) {
    const [px, py] = vertice(2 * k);
    const [ax, ay] = vertice((2 * k + 9) % 10);
    const [bx, by] = vertice(2 * k + 1);
    for (const [ex, ey] of [[ax, ay], [bx, by]] as const) {
      for (let t = 0.25; t < 0.9; t += 0.25) l.px(Math.round(ex + (px - ex) * t), Math.round(ey + (py - ey) * t), 'neutro-7');
    }
  }
  // Centro de papel crepé claro y cuerda.
  l.elipse(cx, cy, 4, 4, 'neutro-6');
  l.elipse(cx, cy, 2.5, 2.5, 'neutro-7');
  l.px(13, 24, 'neutro-5');
  l.rect(15, 0, 2, 11, 'madera-clara-3');
  l.rect(15, 0, 1, 11, 'madera-clara-4');
  return terminar(l, { sombra: false });
}

/**
 * Pasa un dibujo de varios colores a uno solo. Además de las rampas de origen cambia los contornos tonales
 * (el tono 0 de `rojo` y de `planta`, que no está en las rampas usadas) por el contorno del color de destino.
 */
function aUnColor(base: Lienzo, origenes: readonly (readonly string[])[], destino: readonly string[], contorno: string): Lienzo {
  const extra = [rampa('rojo-suave')[0] as string, rampa('hoja-pastel')[0] as string];
  const mapa: Record<string, string> = {};
  for (const hex of extra) mapa[hex] = contorno;
  return aUnSoloColor(base, origenes, destino).recolorear(mapa);
}

// ---------------------------------------------------------------------------
// Registro
// ---------------------------------------------------------------------------

const CONSTRUCTORES: Constructores = {
  'luces-navidad': (c) => registrar(c, 'luces-navidad', 'U', dibujarLucesNavidad()),
  'arbol-navidad': (c) => registrar(c, 'arbol-navidad', 'U', dibujarArbolNavidad()),
  calabazas: (c) => registrar(c, 'calabazas', 'U', dibujarCalabazas()),
  globos: (c) => {
    const base = dibujarGlobos();
    const origenes = [ROJOS, AMARILLOS, AZULES];
    registrarVariantes(c, 'globos', 'U', {
      base,
      rojo: aUnColor(base, origenes, rampa('rojo-suave').slice(1, 5), rampa('rojo-suave')[0] as string),
      azul: aUnColor(base, origenes, AZULES, AZULES[0] as string),
      amarillo: aUnColor(base, origenes, AMARILLOS, AMARILLOS[0] as string),
    });
  },
  banderines: (c) => {
    const base = dibujarBanderines();
    registrarVariantes(c, 'banderines', 'U', {
      base,
      rojo: banderinesBicolor(base, CUARTETOS.rojo),
      azul: banderinesBicolor(base, CUARTETOS.azul),
    });
  },
  regalos: (c) => {
    const base = dibujarRegalos();
    const origenes = [rampa('rojo-suave').slice(1, 4), rampa('vidrio').slice(0, 3), rampa('hoja-pastel').slice(1, 4)];
    registrarVariantes(c, 'regalos', 'U', {
      base,
      rojo: aUnColor(base, origenes, rampa('rojo-suave').slice(1, 4), rampa('rojo-suave')[0] as string),
      azul: aUnColor(base, origenes, rampa('vidrio').slice(0, 3), rampa('vidrio')[0] as string),
      verde: aUnColor(base, origenes, rampa('hoja-pastel').slice(1, 4), rampa('hoja-pastel')[0] as string),
    });
  },
  pinata: (c) => registrar(c, 'pinata', 'U', dibujarPinata()),
};

/** Todos los cuadros de la categoría temporada que ya están dibujados. */
export function cuadrosTemporada(): Cuadros {
  return construirCategoria(CONSTRUCTORES);
}
