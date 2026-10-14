/**
 * Comprobación de la transcripción: rehace los 5 archivos originales del diseñador desde las capas de código y cuenta los
 * píxeles que difieren del PNG original.
 *   - Frente (09, 10, 11): PNG de 128 x 256, píxel de juego de 4 x 4 pantalla. Se compara color por color (RGB exacto).
 *   - Perfiles (12, 13): PNG con fondo y píxel de 6,67 px, con los colores corridos unos niveles. Se compara el raster
 *     completo asignando cada color del PNG al color equivalente del 09 (tabla `COLORES_PNG`).
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';
import { Lienzo } from '../src/nucleo';
import { ANCHO, ALTO, LEYENDA } from '../src/personaje/v5/datos-disenador';
import { BORDES_X_DERECHO, BORDES_X_IZQUIERDO, BORDES_Y_DERECHO, BORDES_Y_IZQUIERDO, COLORES_PNG, FONDO_PNG, PERFIL_DERECHO, PERFIL_IZQUIERDO } from '../src/personaje/v5/datos-perfiles';
import { BORDES_X_PELO_DERECHO, BORDES_X_PELO_IZQUIERDO, BORDES_Y_PELO_DERECHO, BORDES_Y_PELO_IZQUIERDO, COLORES_PNG_PELO, FONDO_PNG_PELO } from '../src/personaje/v5/datos-perfiles-pelo';
import { CAPAS_COMPLETAS, CAPAS_DISENADOR, LEYENDA_COMPLETA, PERFIL_PELO_X0, PERFIL_PELO_Y0, capaALienzo, perfilExacto, unirCapas } from '../src/personaje/v5/disenador';
import type { Capa } from '../src/personaje/v5/disenador';

const DIR = fileURLToPath(new URL('../referencia/estilo-pixel-gba/', import.meta.url));

export interface Comparacion {
  nombre: string;
  original: Lienzo; // raster original, escala nativa
  transcripcion: Lienzo; // reconstrucción a la misma escala
  diferencia: Lienzo; // rojo donde difiere, gris tenue donde coincide
  pixelesDiferentes: number;
  pixelesTotales: number;
}

function leerPng(n: string): PNG {
  return PNG.sync.read(readFileSync(DIR + n));
}
function aLienzo(p: PNG): Lienzo {
  const l = new Lienzo(p.width, p.height);
  for (let y = 0; y < p.height; y++) for (let x = 0; x < p.width; x++) {
    const i = (y * p.width + x) * 4;
    if (p.data[i + 3] === 0) continue;
    l.px(x, y, '#' + [0, 1, 2].map((k) => p.data[i + k]!.toString(16).padStart(2, '0')).join('').toUpperCase());
  }
  return l;
}

function frente(nombre: string, capa: Capa): Comparacion {
  const orig = aLienzo(leerPng(nombre));
  const rec = capaALienzo(capa).escalar(4);
  let dif = 0;
  const d = new Lienzo(orig.ancho, orig.alto);
  for (let y = 0; y < orig.alto; y++) for (let x = 0; x < orig.ancho; x++) {
    const a = orig.leerHex(x, y), b = rec.leerHex(x, y);
    if (a !== b) { dif++; d.px(x, y, '#FF2040'); } else if (a) d.px(x, y, '#44444C');
  }
  return { nombre, original: orig, transcripcion: rec, diferencia: d, pixelesDiferentes: dif, pixelesTotales: orig.ancho * orig.alto };
}

function perfil(nombre: string, filas: readonly string[], bx: readonly number[], by: readonly number[]): Comparacion {
  const p = leerPng(nombre);
  const orig = aLienzo(p);
  const rec = new Lienzo(p.width, p.height);
  rec.rect(0, 0, p.width, p.height, FONDO_PNG);
  for (let r = 0; r < filas.length; r++) for (let c = 0; c < filas[r]!.length; c++) {
    const ch = filas[r]![c]!;
    if (ch === '.') continue;
    rec.rect(bx[c]!, by[r]!, bx[c + 1]! - bx[c]!, by[r + 1]! - by[r]!, LEYENDA[ch]!);
  }
  let dif = 0;
  const d = new Lienzo(p.width, p.height);
  const clase = (h: string | null): string => (h === FONDO_PNG ? '.' : h ? (COLORES_PNG[h] ?? '?') : '.');
  const claseRec = (h: string | null): string => { if (h === FONDO_PNG || !h) return '.'; for (const [k, v] of Object.entries(LEYENDA)) if (k && v === h) return k; return '?'; };
  for (let y = 0; y < p.height; y++) for (let x = 0; x < p.width; x++) {
    const a = clase(orig.leerHex(x, y)), b = claseRec(rec.leerHex(x, y));
    if (a !== b) { dif++; d.px(x, y, '#FF2040'); } else if (a !== '.') d.px(x, y, '#44444C');
  }
  return { nombre, original: orig, transcripcion: rec, diferencia: d, pixelesDiferentes: dif, pixelesTotales: p.width * p.height };
}

export function comprobarTodo(): Comparacion[] {
  const C = CAPAS_DISENADOR;
  return [
    frente('09-DISENADOR-base-calvo-camiseta.png', C.base),
    frente('10-DISENADOR-base-con-pelo.png', unirCapas(C.base, C.pelo)),
    frente('11-DISENADOR-base-con-chaqueta.png', unirCapas(C.base, C.pelo, C.pantalon, C.chaqueta)),
    perfil('12-DISENADOR-base-perfil-izquierdo.png', PERFIL_IZQUIERDO, BORDES_X_IZQUIERDO, BORDES_Y_IZQUIERDO),
    perfil('13-DISENADOR-base-perfil-derecho.png', PERFIL_DERECHO, BORDES_X_DERECHO, BORDES_Y_DERECHO),
  ];
}

/**
 * Perfiles 15 y 16 (pelo, chaqueta roja y ojo): se rehacen DESDE LAS CAPAS del código (cuerpo base 12 + pelo + ojo + chaqueta, y el espejo
 * para el 16), ya puestas en el lienzo de 32 x 64, no desde la transcripción, y se comparan con el PNG original celda por celda.
 * El píxel mide 5,33 px de pantalla (celdas de 4 y 6 px), la rejilla sale de los cambios de color.
 */
export function comprobarPerfilesPelo(): Comparacion[] {
  const hacer = (nombre: string, lado: 'I' | 'D', ojo: 'abierto' | 'medio', bx: readonly number[], by: readonly number[], x0: number): Comparacion => {
    const p = leerPng(nombre);
    const orig = aLienzo(p);
    const capa = perfilExacto(lado, ojo);
    const rec = new Lienzo(p.width, p.height);
    rec.rect(0, 0, p.width, p.height, FONDO_PNG_PELO);
    for (let r = 0; r < by.length - 1; r++) for (let c = 0; c < bx.length - 1; c++) {
      const hex = capa.get((r + PERFIL_PELO_Y0) * ANCHO + c + x0);
      if (hex) rec.rect(bx[c]!, by[r]!, bx[c + 1]! - bx[c]!, by[r + 1]! - by[r]!, hex);
    }
    const inversa = new Map(Object.entries(LEYENDA_COMPLETA).map(([k, v]) => [v, k]));
    const clase = (h: string | null): string => (h === FONDO_PNG_PELO || !h ? '.' : (COLORES_PNG_PELO[h] ?? '?'));
    const claseRec = (h: string | null): string => (!h || h === FONDO_PNG_PELO ? '.' : (inversa.get(h) ?? '?'));
    let dif = 0;
    const d = new Lienzo(p.width, p.height);
    for (let y = 0; y < p.height; y++) for (let x = 0; x < p.width; x++) {
      const a = clase(orig.leerHex(x, y)), b = claseRec(rec.leerHex(x, y));
      if (a !== b) { dif++; d.px(x, y, '#FF2040'); } else if (a !== '.') d.px(x, y, '#44444C');
    }
    return { nombre, original: orig, transcripcion: rec, diferencia: d, pixelesDiferentes: dif, pixelesTotales: p.width * p.height };
  };
  return [
    hacer('15-DISENADOR-perfil-izquierdo-pelo-chaqueta-roja-ojo-medio-cerrado.png', 'I', 'medio', BORDES_X_PELO_IZQUIERDO, BORDES_Y_PELO_IZQUIERDO, PERFIL_PELO_X0),
    // el 16 mira a la derecha: sus columnas del archivo x caen en la columna x + 7 del lienzo (espejo de x + 4)
    hacer('16-DISENADOR-perfil-derecho-pelo-chaqueta-roja-ojo-abierto.png', 'D', 'abierto', BORDES_X_PELO_DERECHO, BORDES_Y_PELO_DERECHO, 7),
  ];
}

void ANCHO; void ALTO; void CAPAS_COMPLETAS;
if (process.argv[1]?.endsWith('verificar-disenador.ts')) {
  for (const c of [...comprobarTodo(), ...comprobarPerfilesPelo()]) console.log(c.nombre, 'diferencia', c.pixelesDiferentes, 'de', c.pixelesTotales);
}
