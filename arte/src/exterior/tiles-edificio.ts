/**
 * Tiles de edificio de 32 x 32: techos, parapetos y fachadas por piso.
 *
 * Una fachada se arma con un tile por piso (vista de frente, desde arriba): un tile `tope` con la cornisa, los `medio`
 * que hagan falta y un `base` con el zócalo. Cada fachada trae sus máscaras de luz: tiles con SOLO las ventanas
 * encendidas (el resto transparente). El motor las pone encima de noche, sin tocar la fachada de día.
 */

import type { Lienzo } from '../nucleo';
import { LADO, azar, pk, rk, salpicar, tileNuevo } from './comun';
import type { Token } from './paleta';

export type EstiloFachada = 'naos';
export type PosFachada = 'tope' | 'medio' | 'base';

export const ESTILOS_FACHADA: readonly EstiloFachada[] = ['naos'];

export const nombreFachada = (estilo: EstiloFachada, pos: PosFachada, variante: string): string => `fac-${estilo}-${pos}-${variante}`;
/** Máscara de luz: `1` ventana izquierda, `2` derecha, `3` las dos. */
export const nombreLuz = (estilo: EstiloFachada, pos: PosFachada, patron: string): string => `luz-${estilo}-${pos}-${patron}`;

// ---------------------------------------------------------------------------
// Techos
// ---------------------------------------------------------------------------

export type EstiloTecho = 'grava' | 'terraza';
export const ESTILOS_TECHO: readonly EstiloTecho[] = ['grava', 'terraza'];
export const nombreTecho = (estilo: EstiloTecho, variante: string): string => `techo-${estilo}-${variante}`;

export function tileTecho(estilo: EstiloTecho, variante: number): Lienzo {
  const l = tileNuevo();
  switch (estilo) {
    case 'grava': {
      rk(l, 0, 0, LADO, LADO, 'gr1');
      salpicar(l, 0, 0, LADO, LADO, 'gr0', 0.22, 120 + variante);
      salpicar(l, 0, 0, LADO, LADO, 'gr2', 0.16, 130 + variante);
      break;
    }
    case 'terraza': {
      // Terraza de concreto con juntas cada 8 px y manchas.
      rk(l, 0, 0, LADO, LADO, 'c2');
      salpicar(l, 0, 0, LADO, LADO, 'c3', 0.08, 190 + variante);
      salpicar(l, 0, 0, LADO, LADO, 'c1', 0.06, 200 + variante);
      for (let i = 0; i < LADO; i += 8) {
        rk(l, i, 0, 1, LADO, 'c1');
        rk(l, 0, i, LADO, 1, 'c1');
      }
      break;
    }
  }
  return l;
}

/** Parapetos: se dibujan encima del techo, en la capa de detalle. */
export type LadoParapeto = 'n' | 'e' | 'o' | 'ne' | 'no';
export const LADOS_PARAPETO: readonly LadoParapeto[] = ['n', 'e', 'o', 'ne', 'no'];
export const nombreParapeto = (lado: LadoParapeto): string => `par-${lado}`;

export function tileParapeto(lado: LadoParapeto): Lienzo {
  const l = tileNuevo();
  const norte = lado === 'n' || lado === 'ne' || lado === 'no';
  const este = lado === 'e' || lado === 'ne';
  const oeste = lado === 'o' || lado === 'no';
  if (norte) {
    // Borde de arriba y la cara interior, que mira al sur y se ve de frente.
    rk(l, 0, 0, LADO, 1, 'c4');
    rk(l, 0, 1, LADO, 3, 'c3');
    rk(l, 0, 4, LADO, 4, 'c2');
    rk(l, 0, 8, LADO, 1, 'c1');
    rk(l, 0, 9, LADO, 1, 'c0');
  }
  if (este) {
    rk(l, 28, 0, 4, LADO, 'c3');
    rk(l, 31, 0, 1, LADO, 'c4');
    rk(l, 27, 0, 1, LADO, 'c1');
  }
  if (oeste) {
    rk(l, 0, 0, 4, LADO, 'c3');
    rk(l, 0, 0, 1, LADO, 'c4');
    rk(l, 4, 0, 1, LADO, 'c1');
  }
  if (norte) {
    // La esquina cierra el borde de arriba por encima de los laterales.
    if (este) rk(l, 28, 0, 4, 10, 'c3');
    if (oeste) rk(l, 0, 0, 4, 10, 'c3');
    rk(l, 0, 0, LADO, 1, 'c4');
  }
  return l;
}

// ---------------------------------------------------------------------------
// Fachadas
// ---------------------------------------------------------------------------

/** Zonas de vidrio de un tile (filas), para dibujarlas y para armar la máscara de luz. */
interface Ventana {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Fachada {
  tile: Lienzo;
  /** Ventanas del tile en dos mitades (izquierda y derecha), para las máscaras de luz. */
  izq: Ventana[];
  der: Ventana[];
}

/** Un tile de fachada y sus ventanas. */
function nuevaFachada(): Fachada {
  return { tile: tileNuevo(), izq: [], der: [] };
}

function mascaraDeLuz(f: Fachada, patron: '1' | '2' | '3', semilla: number): Lienzo {
  const l = tileNuevo();
  const zonas = [...(patron === '1' || patron === '3' ? f.izq : []), ...(patron === '2' || patron === '3' ? f.der : [])];
  for (const v of zonas) {
    for (let y = v.y; y < v.y + v.h; y++) {
      for (let x = v.x; x < v.x + v.w; x++) {
        const rel = (y - v.y) / Math.max(1, v.h - 1);
        // Más claro arriba, más cálido abajo, con algunas motas como si hubiera gente y muebles.
        let t: Token = rel < 0.25 ? 'lw2' : rel < 0.8 ? 'lw1' : 'lw0';
        const r = azar(x, y, semilla);
        if (r < 0.04) t = 'lw3';
        else if (r > 0.97) t = 'lw0';
        pk(l, x, y, t);
      }
    }
  }
  return l;
}

// ---- Naos: vidrio azul con celosías de acero (la fachada real del edificio) ----

/** Cornisa de concreto con su sombra. Ocupa las filas 0 a 5. */
function cornisa(l: Lienzo): void {
  rk(l, 0, 0, LADO, 1, 'c4');
  rk(l, 0, 1, LADO, 2, 'c3');
  rk(l, 0, 3, LADO, 1, 'c2');
  rk(l, 0, 4, LADO, 1, 'c1');
  rk(l, 0, 5, LADO, 1, 'ac1');
}

/** Un piso de Naos entre las filas `y0` y `y1` (la última exclusiva). */
function pisoNaos(f: Fachada, y0: number, y1: number, variante: number, conLosa: boolean): void {
  const l = f.tile;
  const vTop = conLosa ? y0 + 4 : y0;
  if (conLosa) {
    rk(l, 0, y0, LADO, 1, 'c3');
    rk(l, 0, y0 + 1, LADO, 1, 'c2');
    rk(l, 0, y0 + 2, LADO, 1, 'c1');
    rk(l, 0, y0 + 3, LADO, 1, 'ac1');
  }
  const vBot = y1 - 3;
  // Aleta inferior de la celosía.
  rk(l, 0, vBot, LADO, 1, 'ac2');
  rk(l, 0, vBot + 1, LADO, 1, 'ac1');
  rk(l, 0, vBot + 2, LADO, 1, 'ac0');
  const alto = vBot - vTop;
  // Dos aletas intermedias dividen el vidrio en tres franjas.
  const b1 = vTop + Math.floor(alto / 3);
  const b2 = vTop + Math.floor((alto * 2) / 3);
  const franjas: Array<{ y0: number; y1: number }> = [
    { y0: vTop, y1: b1 },
    { y0: b1 + 2, y1: b2 },
    { y0: b2 + 2, y1: vBot },
  ];
  for (const b of [b1, b2]) {
    rk(l, 0, b, LADO, 1, 'ac2');
    rk(l, 0, b + 1, LADO, 1, 'ac1');
  }
  for (let m = 0; m < 2; m++) {
    const x0 = m * 16;
    const purpura = azar(m, variante, 210) < 0.3;
    franjas.forEach((fr, i) => {
      const claro: Token = purpura ? 'vv1' : i === 0 ? 'vg3' : i === 1 ? 'vg2' : 'vg1';
      const oscuro: Token = purpura ? 'vv0' : i === 0 ? 'vg2' : i === 1 ? 'vg1' : 'vg0';
      for (let y = fr.y0; y < fr.y1; y++) {
        const t = (y - fr.y0) / Math.max(1, fr.y1 - fr.y0 - 1);
        for (let x = x0; x < x0 + 16; x++) {
          // Degradado de arriba a abajo con una trama de dos filas en medio.
          const sube = t < 0.4 || (t < 0.6 && (x + y) % 2 === 0);
          pk(l, x, y, sube ? claro : oscuro);
        }
      }
      // Reflejo diagonal del cielo en algunos paneles.
      if (azar(m, i + variante * 3, 211) < 0.45) {
        for (let j = 0; j < Math.min(5, fr.y1 - fr.y0); j++) pk(l, x0 + 4 + j, fr.y0 + j, purpura ? 'vv1' : 'vg3');
      }
    });
    // Parteluz.
    rk(l, x0, vTop, 1, alto, 'ac1');
    rk(l, x0 + 1, vTop, 1, alto, 'ac2');
    const ventana = (y: number, h: number): Ventana => ({ x: x0 + 2, y, w: 14, h });
    const destino = m === 0 ? f.izq : f.der;
    for (const fr of franjas) destino.push(ventana(fr.y0, fr.y1 - fr.y0));
  }
}

function fachadaNaos(pos: PosFachada, variante: number): Fachada {
  const f = nuevaFachada();
  if (pos === 'medio') {
    pisoNaos(f, 0, LADO, variante, true);
  } else if (pos === 'tope') {
    cornisa(f.tile);
    pisoNaos(f, 6, LADO, variante, false);
  } else {
    // Planta baja: vidrio más corto y zócalo de concreto con la sombra de contacto.
    pisoNaos(f, 0, 24, variante, true);
    rk(f.tile, 0, 24, LADO, 1, 'c3');
    rk(f.tile, 0, 25, LADO, 5, 'c2');
    rk(f.tile, 0, 30, LADO, 1, 'c1');
    rk(f.tile, 0, 31, LADO, 1, 'c0');
    for (let x = 7; x < LADO; x += 16) rk(f.tile, x, 25, 1, 5, 'c1');
  }
  return f;
}

/** Vestíbulo de Naos: dos tiles, a la izquierda el vidrio con la luz cálida de adentro y a la derecha la puerta. */
function vestibulo(lado: 'i' | 'd'): Fachada {
  const f = nuevaFachada();
  const l = f.tile;
  // Marquesina de acero arriba.
  rk(l, 0, 0, LADO, 1, 'ac3');
  rk(l, 0, 1, LADO, 3, 'ac2');
  rk(l, 0, 4, LADO, 1, 'ac1');
  rk(l, 0, 5, LADO, 1, 'ac0');
  // Vidrio de abajo hacia arriba: interior cálido (pl) en la mitad izquierda, azul en las puertas.
  const yTop = 6;
  const yBot = 26;
  for (let y = yTop; y < yBot; y++) {
    const t = (y - yTop) / (yBot - yTop - 1);
    for (let x = 0; x < LADO; x++) {
      if (lado === 'i') {
        const calido: Token = t < 0.3 ? 'pl2' : t < 0.7 ? 'pl1' : 'pl0';
        pk(l, x, y, calido);
      } else {
        const azul: Token = t < 0.4 ? 'vg3' : t < 0.7 ? 'vg2' : 'vg1';
        pk(l, x, y, azul);
      }
    }
  }
  // Marcos.
  const partes = lado === 'i' ? [0, 10, 21, 31] : [0, 15, 16, 31];
  for (const x of partes) rk(l, x, yTop, 1, yBot - yTop, 'ac1');
  rk(l, 0, yBot - 1, LADO, 1, 'ac1');
  if (lado === 'i') {
    // Una planta dentro del vestíbulo.
    rk(l, 22, 14, 6, 10, 'v1');
    rk(l, 23, 12, 4, 4, 'v2');
    rk(l, 21, 16, 2, 4, 'v3');
    rk(l, 25, 22, 3, 4, 'tr1');
  } else {
    // Manijas de la puerta doble.
    rk(l, 13, 16, 1, 4, 'c3');
    rk(l, 18, 16, 1, 4, 'c3');
  }
  // Zócalo.
  rk(l, 0, 26, LADO, 4, 'c2');
  rk(l, 0, 26, LADO, 1, 'c3');
  rk(l, 0, 30, LADO, 1, 'c1');
  rk(l, 0, 31, LADO, 1, 'c0');
  const zona: Ventana = { x: 1, y: yTop, w: 30, h: yBot - yTop - 1 };
  f.izq.push(zona);
  f.der.push(zona);
  return f;
}

function construirFachada(_estilo: EstiloFachada, pos: PosFachada, variante: number): Fachada {
  return fachadaNaos(pos, variante);
}

/** Variantes de cada posición: los `medio` tienen tres para que la fachada no se repita en bloque. */
export const VARIANTES_FACHADA: Readonly<Record<PosFachada, readonly string[]>> = {
  tope: ['a', 'b'],
  medio: ['a', 'b', 'c'],
  base: ['a', 'b'],
};

export interface TileConNombre {
  id: string;
  lienzo: Lienzo;
}

/** Todas las fachadas (con sus máscaras de luz) de los cuatro estilos, más el vestíbulo de Naos. */
export function tilesFachada(): TileConNombre[] {
  const salida: TileConNombre[] = [];
  const letras = 'abc';
  for (const estilo of ESTILOS_FACHADA) {
    for (const pos of ['tope', 'medio', 'base'] as const) {
      VARIANTES_FACHADA[pos].forEach((v, vi) => {
        const f = construirFachada(estilo, pos, letras.indexOf(v) + vi * 0);
        salida.push({ id: nombreFachada(estilo, pos, v), lienzo: f.tile });
        // Las máscaras de luz salen de la primera variante: la geometría de las ventanas es la misma en las tres.
        if (vi === 0) {
          for (const p of ['1', '2', '3'] as const) salida.push({ id: nombreLuz(estilo, pos, p), lienzo: mascaraDeLuz(f, p, 260 + letras.length) });
        }
      });
    }
  }
  const vi = vestibulo('i');
  const vd = vestibulo('d');
  salida.push({ id: 'fac-naos-lobby-i', lienzo: vi.tile }, { id: 'fac-naos-lobby-d', lienzo: vd.tile });
  salida.push({ id: 'luz-naos-lobby-i', lienzo: mascaraDeLuz(vi, '3', 270) }, { id: 'luz-naos-lobby-d', lienzo: mascaraDeLuz(vd, '3', 271) });
  salida.push({ id: 'balcon-losa', lienzo: tileLosaBalcon() });
  return salida;
}

/** Cara de la losa del balcón (voladizo). Solo ocupa la parte de arriba del tile; la sombra va en la capa de sombras. */
function tileLosaBalcon(): Lienzo {
  const l = tileNuevo();
  rk(l, 0, 0, LADO, 1, 'c4');
  rk(l, 0, 1, LADO, 3, 'c3');
  rk(l, 0, 4, LADO, 4, 'c2');
  rk(l, 0, 8, LADO, 2, 'c1');
  rk(l, 0, 10, LADO, 1, 'c0');
  // Juntas de los tableros del encofrado.
  for (let x = 7; x < LADO; x += 16) rk(l, x, 4, 1, 4, 'c1');
  return l;
}

// ---------------------------------------------------------------------------
// Bloques de los vecinos: casi sin detalle, en tonos apagados
// ---------------------------------------------------------------------------

/** Tres tonos de bloque para que dos vecinos pegados se distingan sin dibujar nada más. */
export const TONOS_BLOQUE = ['a', 'b', 'c'] as const;
export type TonoBloque = (typeof TONOS_BLOQUE)[number];

const TECHO_BLOQUE: Readonly<Record<TonoBloque, readonly [Token, Token, Token]>> = {
  a: ['mu0', 'mu1', 'mu2'],
  b: ['mu1', 'mu2', 'mu3'],
  c: ['mu2', 'mu3', 'mu4'],
};
const FACHADA_BLOQUE: Readonly<Record<TonoBloque, readonly [Token, Token, Token]>> = {
  a: ['mf0', 'mf1', 'mf2'],
  b: ['mf1', 'mf2', 'mu1'],
  c: ['mf0', 'mf0', 'mf1'],
};

/** Azotea lisa de un bloque: un solo tono con una trama muy leve. */
export function tileTechoBloque(tono: TonoBloque): Lienzo {
  const [oscuro, medio, claro] = TECHO_BLOQUE[tono];
  const l = tileNuevo();
  rk(l, 0, 0, LADO, LADO, medio);
  salpicar(l, 0, 0, LADO, LADO, oscuro, 0.03, 300);
  salpicar(l, 0, 0, LADO, LADO, claro, 0.03, 310);
  return l;
}

/** Fachada lisa de un bloque, de un piso: solo una banda de piso, sin ventanas. */
export function tileFachadaBloque(pos: PosFachada, tono: TonoBloque): Lienzo {
  const [oscuro, medio, claro] = FACHADA_BLOQUE[tono];
  const l = tileNuevo();
  rk(l, 0, 0, LADO, LADO, medio);
  if (pos === 'tope') {
    rk(l, 0, 0, LADO, 2, claro);
    rk(l, 0, 2, LADO, 1, oscuro);
  } else if (pos === 'medio') {
    rk(l, 0, 15, LADO, 1, claro);
    rk(l, 0, 16, LADO, 1, oscuro);
  } else {
    rk(l, 0, 26, LADO, 6, oscuro);
  }
  return l;
}

/** Lote sin edificar visto de lejos: verde grisáceo liso. */
export function tileLote(variante: number): Lienzo {
  const l = tileNuevo();
  rk(l, 0, 0, LADO, LADO, 'ml1');
  salpicar(l, 0, 0, LADO, LADO, 'ml0', 0.04, 320 + variante);
  salpicar(l, 0, 0, LADO, LADO, 'ml2', 0.04, 330 + variante);
  return l;
}
