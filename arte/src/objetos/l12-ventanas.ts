/**
 * Ventanas del lote 12 (aberturas de la pared, 1 casilla, cuadros de 32 x 64 como `pared-ventana`).
 *
 * Cada ventana parte de la pared lisa (`muroLiso`) para encajar con los muros vecinos: la tapa (filas 0 a 15) no se toca y
 * todo se pinta sobre la cara (filas 16 a 55). De frente (`S`) se ve la ventana entera; en los tramos verticales (`E` y `O`)
 * solo se ve la franja de la tapa, con un marco de cristal dentro y el alféizar asomando hacia el lado al que mira.
 */

import { Lienzo } from '../nucleo';
import { poligono } from './l2b-comun';
import { muroLiso } from './l1-paredes';
import { BLANCO, NEGRO, NOGAL, ROBLE, marco, registrarR } from './l12-comun';
import type { Cuadros, Marco3 } from './l12-comun';

type Forma = (x: number, y: number) => boolean;

/** Cristal con cielo claro arriba, sombra del hueco en el borde y un destello en diagonal. */
function cristal(l: Lienzo, x: number, y: number, w: number, h: number, dentro?: Forma, destello = true): void {
  for (let py = y; py < y + h; py++) {
    for (let px = x; px < x + w; px++) {
      if (dentro !== undefined && !dentro(px, py)) continue;
      const sombra = dentro === undefined ? py === y || px === x : !dentro(px, py - 1) || !dentro(px - 1, py);
      l.px(px, py, sombra ? 'vidrio-1' : py - y < h * 0.42 ? 'vidrio-3' : 'vidrio-2');
    }
  }
  if (!destello || w < 6 || h < 8) return;
  const gx = x + 2;
  const gy = y + Math.floor(h * 0.55);
  const ok = (px: number, py: number): boolean => dentro === undefined || dentro(px, py);
  for (let i = 0; i < 4; i++) if (ok(gx + i, gy - i)) l.px(gx + i, gy - i, 'blanco');
  for (let i = 0; i < 3; i++) if (ok(gx + 2 + i, gy + 1 - i)) l.px(gx + 2 + i, gy + 1 - i, 'vidrio-3');
}

/** Marco y cristal de una forma cualquiera: el marco es lo que sobra al erosionar la forma `g` píxeles. */
function ventanaForma(l: Lienzo, forma: Forma, caja: [number, number, number, number], m: Marco3, g: number): Forma {
  const [x0, y0, x1, y1] = caja;
  const interior: Forma = (x, y) => forma(x, y) && forma(x - g, y) && forma(x + g, y) && forma(x, y - g) && forma(x, y + g);
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      if (!forma(x, y)) continue;
      const luzBorde = !forma(x - 1, y) || !forma(x, y - 1);
      const sombraBorde = !forma(x + 1, y) || !forma(x, y + 1);
      l.px(x, y, luzBorde ? m.luz : sombraBorde ? m.sombra : m.medio);
    }
  }
  cristal(l, x0, y0, x1 - x0 + 1, y1 - y0 + 1, interior);
  return interior;
}

/** Alféizar de piedra o madera bajo la ventana, con su sombra sobre la pared. */
function alfeizar(l: Lienzo, x: number, ancho: number, m: Marco3 = BLANCO): void {
  l.rect(x, 50, ancho, 1, m.luz);
  l.rect(x, 51, ancho, 1, m.sombra);
  l.rect(x + 1, 52, ancho - 2, 1, 'lavanda-1');
}

/** Contorno suave del marco sobre la pared. */
const halo = (l: Lienzo, x: number, y: number, w: number, h: number): void => void l.rectBorde(x - 1, y - 1, w + 2, h + 2, 'lavanda-1');

const disco = (cx: number, cy: number, r: number): Forma => (x, y) => Math.hypot(x - cx, y - cy) <= r;

// ---------------------------------------------------------------------------
// De frente (S)
// ---------------------------------------------------------------------------

function batiente(): Lienzo {
  const l = muroLiso('0101');
  halo(l, 2, 19, 28, 32);
  marco(l, 2, 19, 28, 32, BLANCO, 2);
  cristal(l, 5, 22, 9, 26);
  cristal(l, 18, 22, 9, 26);
  l.rect(14, 22, 4, 26, 'neutro-6');
  l.rect(14, 22, 1, 26, 'blanco');
  l.rect(17, 22, 1, 26, 'neutro-5');
  l.rect(14, 36, 2, 4, 'metal-3');
  l.rect(16, 36, 1, 4, 'metal-1');
  alfeizar(l, 1, 30);
  return l;
}

function guillotina(): Lienzo {
  const l = muroLiso('0101');
  halo(l, 3, 19, 26, 32);
  marco(l, 3, 19, 26, 32, BLANCO, 2);
  cristal(l, 6, 22, 20, 12);
  cristal(l, 6, 38, 20, 10);
  for (const [y, h] of [[22, 12], [38, 10]] as const) {
    l.rect(12, y, 1, h, 'neutro-6');
    l.rect(19, y, 1, h, 'neutro-6');
    l.rect(6, y + Math.floor(h / 2), 20, 1, 'neutro-6');
  }
  l.rect(5, 34, 22, 4, 'neutro-6');
  l.rect(5, 34, 22, 1, 'blanco');
  l.rect(5, 37, 22, 1, 'neutro-5');
  l.rect(14, 35, 4, 2, 'metal-3');
  l.rect(14, 36, 4, 1, 'metal-1');
  alfeizar(l, 2, 28);
  return l;
}

function guillotinaAbierta(): Lienzo {
  const l = muroLiso('0101');
  halo(l, 3, 19, 26, 32);
  marco(l, 3, 19, 26, 32, BLANCO, 2);
  // Hoja de arriba (cerrada, queda la parte de arriba) y hoja de abajo levantada.
  cristal(l, 6, 22, 20, 9);
  l.rect(12, 22, 1, 9, 'neutro-6');
  l.rect(19, 22, 1, 9, 'neutro-6');
  l.rect(5, 31, 22, 3, 'neutro-6');
  l.rect(5, 31, 22, 1, 'blanco');
  cristal(l, 6, 34, 20, 7);
  l.rect(12, 34, 1, 7, 'neutro-6');
  l.rect(19, 34, 1, 7, 'neutro-6');
  l.rect(5, 41, 22, 3, 'neutro-6');
  l.rect(5, 41, 22, 1, 'blanco');
  l.rect(5, 43, 22, 1, 'neutro-5');
  // Hueco abierto: cielo y un poco de jardín.
  l.rect(6, 44, 20, 4, 'vidrio-3');
  l.rect(6, 47, 20, 1, 'planta-3');
  l.rect(6, 44, 20, 1, 'vidrio-2');
  for (const x of [8, 9, 13, 19, 22]) l.px(x, 46, 'planta-4');
  alfeizar(l, 2, 28);
  return l;
}

function cortinas(): Lienzo {
  const l = muroLiso('0101');
  halo(l, 6, 20, 20, 30);
  marco(l, 6, 20, 20, 30, BLANCO, 2);
  cristal(l, 8, 22, 16, 26);
  l.rect(15, 22, 2, 26, 'neutro-6');
  l.rect(8, 34, 16, 2, 'neutro-6');
  alfeizar(l, 4, 24);
  // Barra y remates.
  l.rect(0, 17, 32, 1, 'metal-3');
  l.rect(0, 18, 32, 1, 'metal-1');
  for (const x of [0, 30]) l.rect(x, 16, 2, 4, 'tela-calida-2');
  // Cortinas recogidas con un lazo a media altura.
  for (const izq of [true, false]) {
    for (let y = 19; y <= 54; y++) {
      const media = Math.abs(y - 37) <= 1;
      const ancho = y < 35 ? 9 - Math.floor((y - 19) / 9) : y > 39 ? 6 + Math.floor((y - 39) / 6) : 5;
      const x0 = izq ? 1 : 31 - ancho;
      for (let i = 0; i < ancho; i++) {
        const pliegue = (i + (izq ? 0 : 1)) % 3;
        l.px(x0 + i, y, media ? 'rojo-suave-1' : pliegue === 0 ? 'rojo-suave-4' : pliegue === 1 ? 'rojo-suave-3' : 'rojo-suave-2');
      }
      if (y === 54) for (let i = 0; i < ancho; i++) l.px(x0 + i, y, 'rojo-suave-1');
    }
  }
  return l;
}

function escalonada(): Lienzo {
  const l = muroLiso('0101');
  const tops = [21, 28, 35];
  tops.forEach((t, i) => {
    const x = 3 + i * 9;
    halo(l, x, t, 9, 49 - t);
    marco(l, x, t, 9, 49 - t, NEGRO, 1);
    cristal(l, x + 1, t + 1, 7, 47 - t, undefined, i === 0);
  });
  l.rect(2, 50, 28, 1, 'metal-3');
  l.rect(3, 51, 26, 1, 'metal-1');
  l.rect(4, 52, 24, 1, 'lavanda-1');
  return l;
}

function curva(): Lienzo {
  const l = muroLiso('0101');
  const forma: Forma = (x, y) => (y >= 30 && x >= 6 && x <= 25 && y <= 49) || (y < 30 && Math.hypot(x - 15.5, y - 30) <= 10);
  const interior = ventanaForma(l, forma, [5, 19, 26, 49], ROBLE, 2);
  l.rect(15, 22, 2, 26, 'madera-clara-2');
  l.rect(8, 37, 16, 2, 'madera-clara-2');
  for (let y = 22; y <= 48; y++) for (const x of [15, 16]) if (!interior(x, y)) l.px(x, y, 'madera-clara-2');
  alfeizar(l, 3, 26, ROBLE);
  return l;
}

function redonda(hiedra: boolean): Lienzo {
  const l = muroLiso('0101');
  ventanaForma(l, disco(15.5, 35.5, 12.5), [3, 23, 28, 48], NEGRO, 2);
  l.rect(15, 25, 2, 21, 'neutro-2');
  l.rect(5, 35, 22, 2, 'neutro-2');
  if (hiedra) {
    // Hiedra que sube por el lado izquierdo y cuelga del borde de arriba.
    const hojas: Array<[number, number]> = [[3, 49], [5, 51], [2, 45], [4, 42], [3, 38], [5, 35], [4, 31], [6, 28], [9, 25], [12, 23], [3, 33], [8, 49], [12, 51], [26, 49], [28, 45], [24, 24], [20, 22]];
    for (const [x, y] of hojas) {
      l.rect(x, y, 2, 2, 'planta-3');
      l.px(x, y, 'planta-4');
      l.px(x + 1, y + 1, 'planta-2');
    }
    for (const [x, y] of [[2, 47], [3, 40], [4, 36], [5, 30], [7, 26], [10, 24], [7, 50], [10, 51], [27, 47]] as Array<[number, number]>) l.px(x, y, 'planta-1');
  } else {
    l.rect(5, 52, 22, 1, 'lavanda-1');
  }
  return l;
}

function hexagonal(): Lienzo {
  const l = muroLiso('0101');
  const pts: Array<[number, number]> = [[8, 21], [23, 21], [30, 35], [23, 49], [8, 49], [1, 35]];
  const sombra = pts.map(([x, y]) => [x + 0.5, y + 0.5] as [number, number]);
  poligono(l, sombra, 'madera-oscura-2');
  // Marco con luz arriba y a la izquierda; el cristal es el polígono achicado.
  const dentro = (x: number, y: number): boolean => {
    let c = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i] as [number, number];
      const [xj, yj] = pts[j] as [number, number];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
    }
    return c;
  };
  ventanaForma(l, dentro, [1, 21, 30, 49], NOGAL, 3);
  // Travesaños en Y.
  l.linea(15, 35, 15, 47, 'madera-oscura-2');
  l.linea(16, 35, 16, 47, 'madera-oscura-2');
  l.linea(15, 35, 6, 28, 'madera-oscura-2');
  l.linea(16, 35, 25, 28, 'madera-oscura-2');
  return l;
}

function moderna(): Lienzo {
  const l = muroLiso('0101');
  halo(l, 2, 19, 28, 31);
  l.rect(2, 19, 28, 31, 'neutro-2');
  l.rect(2, 19, 28, 1, 'neutro-4');
  l.rect(2, 19, 1, 31, 'neutro-4');
  cristal(l, 4, 21, 24, 27, undefined, false);
  // Dos destellos anchos y un parante descentrado.
  for (let i = 0; i < 10; i++) {
    l.px(8 + i, 40 - i, 'vidrio-3');
    l.px(9 + i, 40 - i, 'blanco');
    l.px(15 + i, 44 - i, 'vidrio-3');
  }
  l.rect(21, 21, 1, 27, 'neutro-2');
  l.rect(2, 50, 28, 1, 'metal-3');
  l.rect(3, 51, 26, 1, 'neutro-2');
  l.rect(4, 52, 24, 1, 'lavanda-1');
  return l;
}

function antigua(): Lienzo {
  const l = muroLiso('0101');
  // Dintel de piedra con clave y alféizar con ménsulas.
  l.rect(1, 17, 30, 3, 'cemento-3');
  l.rect(1, 17, 30, 1, 'neutro-7');
  l.rect(1, 19, 30, 1, 'cemento-1');
  l.rect(13, 17, 6, 4, 'cemento-2');
  l.rect(13, 17, 6, 1, 'cemento-3');
  halo(l, 3, 20, 26, 29);
  marco(l, 3, 20, 26, 29, NOGAL, 3);
  for (const x of [7, 17]) for (const y of [23, 31, 39]) cristal(l, x, y, 8, 7, undefined, false);
  l.rect(15, 23, 2, 23, 'madera-oscura-2');
  for (const y of [30, 38]) l.rect(6, y, 20, 1, 'madera-oscura-2');
  l.px(8, 24, 'blanco');
  l.px(18, 24, 'blanco');
  l.rect(1, 49, 30, 2, 'cemento-3');
  l.rect(1, 49, 30, 1, 'neutro-7');
  l.rect(1, 50, 30, 1, 'cemento-1');
  l.rect(4, 51, 3, 2, 'cemento-2');
  l.rect(25, 51, 3, 2, 'cemento-1');
  l.rect(2, 53, 28, 1, 'lavanda-1');
  return l;
}

function aireAcondicionado(): Lienzo {
  const l = muroLiso('0101');
  halo(l, 3, 19, 26, 32);
  marco(l, 3, 19, 26, 32, BLANCO, 2);
  cristal(l, 5, 21, 22, 9, undefined, false);
  // Equipo de ventana: cuerpo crema, rejilla, panel de mando y laterales plegables.
  l.rect(5, 30, 22, 18, 'neutro-6');
  l.rect(5, 30, 22, 1, 'blanco');
  l.rect(5, 30, 1, 18, 'blanco');
  l.rect(26, 31, 1, 17, 'neutro-4');
  l.rect(6, 47, 21, 1, 'neutro-4');
  for (let y = 33; y <= 41; y += 2) l.rect(8, y, 12, 1, 'neutro-4');
  l.rect(8, 32, 12, 1, 'neutro-5');
  l.rect(22, 33, 3, 8, 'neutro-5');
  l.px(23, 35, 'planta-4');
  l.px(23, 38, 'rojo-3');
  l.rect(8, 44, 12, 2, 'neutro-5');
  l.rect(8, 44, 12, 1, 'neutro-4');
  alfeizar(l, 2, 28);
  return l;
}

// ---------------------------------------------------------------------------
// De lado (E y O): la ventana se lee dentro de la franja de la tapa
// ---------------------------------------------------------------------------

interface Lado {
  marco: Marco3;
  /** Remate extra sobre el cristal. */
  extra?: 'cortina' | 'equipo' | 'hiedra' | 'arco' | 'jardin';
}

function lateral(mira: 'E' | 'O', o: Lado): Lienzo {
  const l = muroLiso('1010');
  const m = o.marco;
  l.rect(13, 3, 6, 26, m.medio);
  l.rect(13, 3, 6, 1, m.luz);
  l.rect(13, 3, 1, 26, m.luz);
  l.rect(18, 4, 1, 25, m.sombra);
  l.rect(14, 28, 4, 1, m.sombra);
  l.rect(14, 4, 4, 24, 'vidrio-2');
  l.rect(14, 4, 4, 8, 'vidrio-3');
  l.rect(14, 4, 1, 24, 'vidrio-1');
  l.linea(15, 14, 17, 10, 'blanco');
  l.linea(15, 22, 17, 18, 'vidrio-3');
  if (o.extra === 'cortina') {
    for (const y of [4, 21]) {
      l.rect(14, y, 4, 7, 'rojo-suave-3');
      l.rect(14, y, 1, 7, 'rojo-suave-4');
      l.rect(17, y, 1, 7, 'rojo-suave-2');
    }
  }
  if (o.extra === 'equipo') {
    l.rect(14, 12, 4, 14, 'neutro-6');
    l.rect(14, 12, 4, 1, 'blanco');
    for (const y of [15, 18, 21]) l.rect(15, y, 3, 1, 'neutro-4');
  }
  if (o.extra === 'hiedra' || o.extra === 'jardin') {
    for (const [x, y] of [[14, 6], [16, 9], [14, 14], [17, 18], [15, 23], [17, 26]] as Array<[number, number]>) {
      l.rect(x, y, 2, 2, 'planta-3');
      l.px(x, y, 'planta-4');
    }
  }
  if (o.extra === 'arco') {
    l.rect(14, 4, 4, 2, m.medio);
    l.rect(14, 4, 1, 2, m.luz);
  }
  // Alféizar: asoma 2 px hacia el lado al que mira, con la luz a la izquierda.
  if (mira === 'E') {
    l.rect(21, 6, 1, 20, m.luz);
    l.rect(22, 7, 1, 19, m.sombra);
    l.rect(21, 26, 2, 1, 'neutro-4');
  } else {
    l.rect(10, 6, 1, 20, m.luz);
    l.rect(9, 7, 1, 19, m.medio);
    l.rect(9, 26, 2, 1, 'neutro-4');
  }
  return l;
}

const LADOS: Record<string, Lado> = {
  'ventana-batiente': { marco: BLANCO },
  'ventana-guillotina': { marco: BLANCO },
  'ventana-guillotina-abierta': { marco: BLANCO },
  'ventana-cortinas': { marco: BLANCO, extra: 'cortina' },
  'ventana-escalonada': { marco: NEGRO },
  'ventana-curva': { marco: ROBLE, extra: 'arco' },
  'ventana-redonda': { marco: NEGRO },
  'ventana-redonda-hiedra': { marco: NEGRO, extra: 'hiedra' },
  'ventana-hexagonal': { marco: NOGAL },
  'ventana-moderna': { marco: { luz: 'neutro-4', medio: 'neutro-2', sombra: 'neutro-1' } },
  'ventana-antigua': { marco: NOGAL },
  'ventana-aire-acondicionado': { marco: BLANCO, extra: 'equipo' },
};

const FRENTES: Record<string, () => Lienzo> = {
  'ventana-batiente': batiente,
  'ventana-guillotina': guillotina,
  'ventana-guillotina-abierta': guillotinaAbierta,
  'ventana-cortinas': cortinas,
  'ventana-escalonada': escalonada,
  'ventana-curva': curva,
  'ventana-redonda': () => redonda(false),
  'ventana-redonda-hiedra': () => redonda(true),
  'ventana-hexagonal': hexagonal,
  'ventana-moderna': moderna,
  'ventana-antigua': antigua,
  'ventana-aire-acondicionado': aireAcondicionado,
};

/** Frente de una ventana del lote por id (para las pruebas). */
export const frenteDeVentana = (id: string): Lienzo => (FRENTES[id] as () => Lienzo)();
export const lateralDeVentana = (id: string, mira: 'E' | 'O'): Lienzo => lateral(mira, LADOS[id] as Lado);
export const IDS_VENTANAS = Object.keys(FRENTES);

export function cuadrosVentanas12(): Cuadros {
  const c: Cuadros = new Map();
  for (const id of IDS_VENTANAS) {
    registrarR(c, id, 'S', frenteDeVentana(id));
    registrarR(c, id, 'E', lateralDeVentana(id, 'E'));
    registrarR(c, id, 'O', lateralDeVentana(id, 'O'));
  }
  return c;
}

