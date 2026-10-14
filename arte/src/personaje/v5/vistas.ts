/**
 * Vistas del cuerpo base derivadas de los sprites del diseñador, en el mismo estilo (mismas letras de color, mismo contorno):
 *
 *   S  frente: el sprite exacto 09.
 *   N  espalda: el 09 con la cara quitada y la camiseta cerrada por detrás.
 *   I  perfil izquierdo (mira a la izquierda): el sprite exacto 12.   D  perfil derecho: el 13 (espejo del 12).
 *
 * Y los 4 cuadros de caminar por dirección, hechos por cirugía de píxeles sobre esos sprites: la cabeza sube 1 px en los pasos
 * (el torso se estira una fila), los brazos se alargan o se acortan una fila al balancearse y las piernas se estiran o se
 * acortan repitiendo o quitando su fila central. De perfil, las piernas se redibujan como dos tiras inclinadas con el color del
 * diseñador y los brazos se inclinan sobre la camiseta.
 *
 * Ciclo (igual en las 4 direcciones): 0 contacto A, 1 paso A (el cuerpo sube 1 px y una pierna se levanta), 2 contacto B, 3 paso B.
 */

import { BASE_PERFIL_IZQ, PERFIL_X0, PERFIL_Y0 } from './disenador';
import { PERFIL_IZQUIERDO } from './datos-perfiles';
import { bloque, borrar, copiar, desdeFilas, estirar, pegar, poner, vacia, BASE_S } from './rejilla';
import type { Rejilla } from './rejilla';

export type Dir = 'S' | 'N' | 'I' | 'D';
export type Cuadro = 0 | 1 | 2 | 3;

void BASE_PERFIL_IZQ;

// ---------- espalda ----------
function construirN(): Rejilla {
  const g = copiar(BASE_S);
  // la cara desaparece: ojos, cejas, rubor y pecas
  poner(g, 39, 10, 'bbbbbbbbbbbb');
  poner(g, 41, 10, 'bbbbbbbbbbbb');
  poner(g, 42, 9, 'bbbbbbbbbbbbbb');
  poner(g, 43, 10, 'bbbbbbbbbbbb');
  poner(g, 44, 10, 'bbbbbbbbbbbb');
  poner(g, 45, 9, 'cbbbbbbbbbbbbc');
  poner(g, 46, 11, 'ccbbbbbbbbcc');
  // la camiseta sube hasta el cuello por detrás
  poner(g, 47, 12, 'lffffffl');
  poner(g, 48, 13, 'ffffff');
  return g;
}
export const BASE_N: Rejilla = construirN();

// ---------- caminar de frente y de espaldas ----------
const BRAZO_I = [6, 10] as const;
const BRAZO_D = [21, 25] as const;
const PIERNA_I = [10, 15] as const;
const PIERNA_D = [16, 21] as const;

/** Largos de brazos y piernas por cuadro: [brazoI, brazoD, piernaI, piernaD], +1 alarga y -1 acorta. */
const CICLO_FRONTAL: Record<Cuadro, { rebote: number; brazoI: number; brazoD: number; piernaI: number; piernaD: number }> = {
  0: { rebote: 0, brazoI: 1, brazoD: -1, piernaI: -1, piernaD: 1 },
  1: { rebote: -1, brazoI: 1, brazoD: 1, piernaI: -1, piernaD: 0 },
  2: { rebote: 0, brazoI: -1, brazoD: 1, piernaI: 1, piernaD: -1 },
  3: { rebote: -1, brazoI: 1, brazoD: 1, piernaI: 0, piernaD: -1 },
};

export function reboteCuadro(c: Cuadro): number {
  return CICLO_FRONTAL[c].rebote;
}

/**
 * `espalda`: desde atrás el pie que va adelante se aleja de la cámara y se ve más arriba (y el que va atrás, más abajo). En los cuadros de
 * contacto eso cancela el cambio de lado, y en los cuadros de paso (1 y 3) la pierna que pasa es la del otro lado de la pantalla.
 */
export function caminarFrontal(g: Rejilla, c: Cuadro, espalda = false): Rejilla {
  const k = { ...CICLO_FRONTAL[c] };
  if (espalda && (c === 1 || c === 3)) [k.piernaI, k.piernaD] = [k.piernaD, k.piernaI];
  const b = k.rebote;
  const out = vacia();
  pegar(out, bloque(g, 0, 31, 26, 45), 0, 26 + b);
  // torso entre brazos
  pegar(out, estirar(g, 11, 20, 46, 54, 52, b === -1 ? 1 : 0), 11, 46 + b);
  // brazos: se estiran en la fila 50; la fila 55 solo lleva las manos (las columnas 10 y 21 de esa fila son del pantalón)
  const brazo = (x0: number, x1: number, n: number): void => {
    const bl = estirar(g, x0, x1, 46, 55, 50, n);
    for (const f of bl) { if (x0 === BRAZO_I[0]) f[f.length - 1] = f[f.length - 1]!; }
    // la última fila del brazo izquierdo no debe llevar la columna 10 (es del pantalón) ni la del derecho la 21
    const ult = bl[bl.length - 1]!;
    if (x0 === BRAZO_I[0]) ult[ult.length - 1] = '.';
    else ult[0] = '.';
    pegar(out, bl, x0, 46 + b);
  };
  brazo(BRAZO_I[0], BRAZO_I[1], k.brazoI + (b === -1 ? 0 : 0));
  brazo(BRAZO_D[0], BRAZO_D[1], k.brazoD);
  // piernas desde la fila 55
  pegar(out, estirar(g, PIERNA_I[0], PIERNA_I[1], 55, 61, 58, k.piernaI), PIERNA_I[0], 55);
  pegar(out, estirar(g, PIERNA_D[0], PIERNA_D[1], 55, 61, 58, k.piernaD), PIERNA_D[0], 55);
  return out;
}

// ---------- perfil izquierdo ----------
export const BASE_I: Rejilla = desdeFilas(PERFIL_IZQUIERDO, PERFIL_Y0, PERFIL_X0);

const COL = (c: number): number => c + PERFIL_X0;
const FIL = (r: number): number => r + PERFIL_Y0;

/** Pone una tira de pierna (4 de ancho) con su contorno. `desv[i]` es la columna izquierda en la fila i (desde `yIni`). */
function tiraPierna(g: Rejilla, yIni: number, desv: readonly number[], tipo: 'cerca' | 'lejos'): void {
  const rel = tipo === 'cerca' ? ['e', 'c', 'c', 'c'] : ['m', 'm', 'm', 'e'];
  const fuerte = tipo === 'cerca'; // la pierna cercana dibuja su contorno encima de la lejana
  const poner1 = (x: number, y: number, l: string): void => {
    if (fuerte || g[y]![x] === '.') g[y]![x] = l;
  };
  desv.forEach((x0, i) => {
    const y = yIni + i;
    for (let j = 0; j < 4; j++) g[y]![x0 + j] = rel[j]!;
    poner1(x0 - 1, y, 'a');
    poner1(x0 + 4, y, 'a');
  });
  const yl = yIni + desv.length;
  const xl = desv[desv.length - 1]!;
  for (let j = -1; j <= 4; j++) poner1(xl + j, yl, 'a');
}

export interface LetrasCamiseta { f: string; l: string; k: string }
export const LETRAS_CAMISETA_TIRANTES: LetrasCamiseta = { f: 'f', l: 'l', k: 'k' };

export function caminarPerfilIzquierdo(c: Cuadro, base: Rejilla = BASE_I, cam: LetrasCamiseta = LETRAS_CAMISETA_TIRANTES): Rejilla {
  const g = copiar(base);
  const b = CICLO_FRONTAL[c].rebote;
  // 1. el brazo del sprite exacto sale; atrás queda la camiseta
  const brazoPx: { cc: number; r: number; letra: string }[] = [];
  for (let r = 19; r <= 25; r++) for (let cc = 6; cc <= 10; cc++) {
    const ch = g[FIL(r)]![COL(cc)]!;
    if ('bemci'.includes(ch)) brazoPx.push({ cc, r, letra: ch });
  }
  for (let r = 19; r <= 25; r++) poner(g, FIL(r), COL(6), cam.f.repeat(r === 19 || r === 25 ? 4 : 5));
  // 2. piernas nuevas
  borrar(g, COL(3), COL(12), FIL(28), FIL(32));
  const b0 = COL(6);
  const plan = (d: number[]): number[] => d.map((x) => b0 + x);
  let cerca: number[]; let lejos: number[];
  // contacto: zancada de 2 columnas (antes 3, se veía a horcajadas), la pierna de delante pisa con el talón y las dos tocan el piso
  if (c === 0) { cerca = plan([0, -1, -1, -2]); lejos = plan([0, 1, 1, 2]); }
  else if (c === 2) { lejos = plan([0, -1, -1, -2]); cerca = plan([0, 1, 1, 2]); }
  else if (c === 1) { cerca = plan([0, 0, 0, 0]); lejos = plan([-1, -2, -2]); }
  else { lejos = plan([0, 0, 0, 0]); cerca = plan([-1, -2, -2]); }
  tiraPierna(g, FIL(28), lejos, 'lejos');
  tiraPierna(g, FIL(28), cerca, 'cerca');
  // 3. brazo inclinado: cada fila se desplaza según el giro (+ = hacia delante, la izquierda)
  // el brazo cercano se mueve al revés que la pierna cercana: pierna de delante (contacto 0), brazo atrás; y al revés en el contacto 2
  const giro = c === 0 ? -2 : c === 2 ? 2 : 0;
  const desp = (r: number): number => -Math.round((giro * (r - 19)) / 6);
  const marca = new Set<number>();
  for (const p of brazoPx) {
    const x = COL(p.cc) + desp(p.r);
    g[FIL(p.r)]![x] = p.letra;
    marca.add(FIL(p.r) * 100 + x);
  }
  // contorno del brazo donde queda fuera de la camiseta
  for (const k of [...marca]) {
    const y = Math.floor(k / 100), x = k % 100;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1]] as const) if (g[y + dy]![x + dx] === '.') g[y + dy]![x + dx] = 'a';
  }
  // 4. rebote: la cabeza y el torso suben, el torso se estira una fila
  if (b === -1) {
    const out = vacia();
    pegar(out, bloque(g, 0, 31, FIL(0), FIL(16)), 0, FIL(0) - 1);
    pegar(out, estirar(g, 0, 31, FIL(17), FIL(27), FIL(22), 1), 0, FIL(17) - 1);
    pegar(out, bloque(g, 0, 31, FIL(28), FIL(32)), 0, FIL(28));
    return out;
  }
  return g;
}

export function espejoRejilla(g: Rejilla): Rejilla {
  return g.map((fila) => fila.slice().reverse());
}
