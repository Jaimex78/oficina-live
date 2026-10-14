/**
 * Tiles de suelo de 32 x 32: andén de adoquines, bordillos, asfalto con sus líneas, cebras, pasto, tierra y patios.
 * Todos son tileables: el borde derecho encaja con el izquierdo y el de abajo con el de arriba.
 */

import type { Lienzo } from '../nucleo';
import { LADO, azar, pk, rk, salpicar, tileNuevo } from './comun';
import type { Token } from './paleta';

/** Lados donde un tile de andén toca la calle (el bordillo se dibuja de ese lado). */
export type LadoBordillo = 'N' | 'S' | 'E' | 'O';

const ORDEN_LADOS: readonly LadoBordillo[] = ['N', 'S', 'E', 'O'];

/** Nombre del tile de andén: `anden-<variante>` y, si toca la calle, `-<lados>` en el orden N S E O. */
export function nombreAnden(variante: string, lados: readonly LadoBordillo[] = []): string {
  const l = ORDEN_LADOS.filter((x) => lados.includes(x)).join('');
  return l === '' ? `anden-${variante}` : `anden-${variante}-${l}`;
}

/** Adoquines de 8 x 4 en hiladas desfasadas. Algunos son rosados, como en la entrada animada. */
function adoquines(variante: number): Lienzo {
  const l = tileNuevo();
  for (let y = 0; y < LADO; y++) {
    const fila = Math.floor(y / 4);
    const desfase = (fila % 2) * 4;
    for (let x = 0; x < LADO; x++) {
      const xx = (x + desfase) % LADO;
      const col = Math.floor(xx / 8);
      const junta = y % 4 === 3 || xx % 8 === 7;
      if (junta) {
        pk(l, x, y, 'adJ');
        continue;
      }
      const rosa = (col + fila * 2 + variante * 3) % 7 === 0;
      const claro = azar(col, fila, 4 + variante) > 0.5;
      const t: Token = rosa ? (claro ? 'adP1' : 'adP0') : claro ? 'adG1' : 'adG0';
      pk(l, x, y, t);
    }
  }
  return l;
}

/** Bordillo de un andén: la franja de concreto entre el adoquín y el asfalto. */
function bordillo(l: Lienzo, lado: LadoBordillo): void {
  switch (lado) {
    case 'S':
      // La calle queda al sur (hacia quien mira): se ve la cara frontal del bordillo.
      rk(l, 0, 23, LADO, 1, 'bo1');
      rk(l, 0, 24, LADO, 3, 'bo2');
      rk(l, 0, 27, LADO, 4, 'bo1');
      rk(l, 0, 31, LADO, 1, 'bo0');
      break;
    case 'N':
      // La calle queda al norte: solo se ve la cara de arriba del bordillo.
      rk(l, 0, 0, LADO, 1, 'bo0');
      rk(l, 0, 1, LADO, 3, 'bo2');
      rk(l, 0, 4, LADO, 1, 'bo1');
      break;
    case 'E':
      rk(l, 31, 0, 1, LADO, 'bo0');
      rk(l, 28, 0, 3, LADO, 'bo2');
      rk(l, 27, 0, 1, LADO, 'bo1');
      break;
    case 'O':
      rk(l, 0, 0, 1, LADO, 'bo0');
      rk(l, 1, 0, 3, LADO, 'bo2');
      rk(l, 4, 0, 1, LADO, 'bo1');
      break;
  }
}

export function tileAnden(variante: number, lados: readonly LadoBordillo[] = []): Lienzo {
  const l = adoquines(variante);
  for (const lado of ORDEN_LADOS) if (lados.includes(lado)) bordillo(l, lado);
  return l;
}

/** Plaza de losas grandes (16 x 16) para la explanada de la esquina. */
export function tilePlaza(variante: number): Lienzo {
  const l = tileNuevo();
  for (let y = 0; y < LADO; y++) {
    for (let x = 0; x < LADO; x++) {
      const gx = Math.floor(x / 16);
      const gy = Math.floor(y / 16);
      const junta = x % 16 === 15 || y % 16 === 15;
      if (junta) {
        pk(l, x, y, 'c1');
        continue;
      }
      const claro = azar(gx + variante * 7, gy, 11) > 0.45;
      pk(l, x, y, claro ? 'c3' : 'c2');
      if (azar(x, y, 12 + variante) < 0.03) pk(l, x, y, 'c4');
    }
  }
  return l;
}

/** Concreto liso de patios y callejones. */
export function tileConcreto(variante: number): Lienzo {
  const l = tileNuevo();
  rk(l, 0, 0, LADO, LADO, 'c2');
  salpicar(l, 0, 0, LADO, LADO, 'c1', 0.05, 20 + variante);
  salpicar(l, 0, 0, LADO, LADO, 'c3', 0.07, 30 + variante);
  // Juntas de dilatación.
  const jx = variante === 0 ? 0 : 16;
  rk(l, jx, 0, 1, LADO, 'c1');
  rk(l, 0, 15, LADO, 1, 'c1');
  return l;
}

export type TipoAsfalto = 'a' | 'b' | 'c';

export interface OpcionesAsfalto {
  /** Franja oscura junto al bordillo (la cuneta). */
  cuneta?: LadoBordillo;
  /** Línea discontinua de carril. */
  guion?: 'h' | 'v';
  /** Mitad de una doble línea amarilla continua. */
  doble?: 'h-sup' | 'h-inf' | 'v-izq' | 'v-der';
  /** Cebra peatonal: barras largas en el sentido del tránsito. */
  cebra?: 'h' | 'v';
}

export function tileAsfalto(tipo: TipoAsfalto, o: OpcionesAsfalto = {}): Lienzo {
  const l = tileNuevo();
  const semilla = tipo === 'a' ? 21 : tipo === 'b' ? 22 : 23;
  for (let y = 0; y < LADO; y++) {
    for (let x = 0; x < LADO; x++) {
      const r = azar(x, y, semilla);
      pk(l, x, y, r < 0.05 ? 'as0' : r > 0.95 ? 'as2' : 'as1');
    }
  }
  if (tipo === 'b') {
    // Parche de reparación.
    rk(l, 6, 9, 14, 9, 'as0');
    for (let x = 6; x < 20; x++) pk(l, x, 9, 'as1');
    salpicar(l, 6, 9, 14, 9, 'as1', 0.25, 40);
  }
  if (tipo === 'c') {
    // Una grieta que serpentea.
    let y = 6;
    for (let x = 2; x < 30; x++) {
      if (azar(x, 3, 41) > 0.6) y += azar(x, 4, 42) > 0.5 ? 1 : -1;
      pk(l, x, y, 'as0');
    }
  }
  if (o.cuneta) {
    switch (o.cuneta) {
      case 'N':
        rk(l, 0, 0, LADO, 3, 'as0');
        break;
      case 'S':
        rk(l, 0, 29, LADO, 3, 'as0');
        break;
      case 'E':
        rk(l, 29, 0, 3, LADO, 'as0');
        break;
      case 'O':
        rk(l, 0, 0, 3, LADO, 'as0');
        break;
    }
  }
  if (o.guion === 'h') for (const y of [15, 16]) rk(l, 8, y, 16, 1, 'pi0');
  if (o.guion === 'v') for (const x of [15, 16]) rk(l, x, 8, 1, 16, 'pi0');
  switch (o.doble) {
    case 'h-sup':
      rk(l, 0, 29, LADO, 2, 'ama1');
      break;
    case 'h-inf':
      rk(l, 0, 1, LADO, 2, 'ama1');
      break;
    case 'v-izq':
      rk(l, 29, 0, 2, LADO, 'ama1');
      break;
    case 'v-der':
      rk(l, 1, 0, 2, LADO, 'ama1');
      break;
  }
  if (o.cebra === 'h') {
    for (const y of [1, 9, 17, 25]) {
      rk(l, 3, y, 26, 4, 'pi0');
      rk(l, 3, y + 3, 26, 1, 'pi1');
    }
  }
  if (o.cebra === 'v') {
    for (const x of [1, 9, 17, 25]) {
      rk(l, x, 3, 4, 26, 'pi0');
      rk(l, x + 3, 3, 1, 26, 'pi1');
    }
  }
  return l;
}

/** Pasto con motas claras y matas oscuras. */
export function tilePasto(variante: number): Lienzo {
  const l = tileNuevo();
  rk(l, 0, 0, LADO, LADO, 'pasto0');
  salpicar(l, 0, 0, LADO, LADO, 'pasto1', 0.12, 50 + variante);
  salpicar(l, 0, 0, LADO, LADO, 'pasto2', 0.035, 60 + variante);
  for (let i = 0; i < 5; i++) {
    const x = Math.floor(azar(i, variante, 70) * 28) + 1;
    const y = Math.floor(azar(i, variante, 71) * 28) + 2;
    // Una mata: tres píxeles oscuros en V.
    pk(l, x, y, 'pasto3');
    pk(l, x + 1, y - 1, 'pasto3');
    pk(l, x + 2, y, 'pasto3');
  }
  return l;
}

/** Tierra apisonada de la obra. */
export function tileTierra(variante: number): Lienzo {
  const l = tileNuevo();
  rk(l, 0, 0, LADO, LADO, 'tie1');
  salpicar(l, 0, 0, LADO, LADO, 'tie0', 0.1, 80 + variante);
  salpicar(l, 0, 0, LADO, LADO, 'tie2', 0.1, 90 + variante);
  // Huellas de llanta.
  const y0 = variante === 0 ? 8 : 20;
  for (let x = 0; x < LADO; x++) {
    if (azar(x, variante, 95) > 0.15) pk(l, x, y0, 'tie0');
    if (azar(x, variante, 96) > 0.15) pk(l, x, y0 + 5, 'tie0');
  }
  return l;
}

/** Franja de sombra que el edificio deja sobre el andén. Es opaca: el motor la dibuja con transparencia. */
export function tileSombra(tipo: 'sur' | 'este' | 'esquina' | 'llena'): Lienzo {
  const l = tileNuevo();
  const sur = (x: number, y: number): boolean => y < 12 || (y < 18 && (x + y) % 2 === 0) || (y < 22 && x % 2 === 0 && y % 2 === 0);
  const este = (x: number, y: number): boolean => x < 10 || (x < 15 && (x + y) % 2 === 0) || (x < 19 && x % 2 === 0 && y % 2 === 0);
  for (let y = 0; y < LADO; y++) {
    for (let x = 0; x < LADO; x++) {
      const s = tipo === 'sur' ? sur(x, y) : tipo === 'este' ? este(x, y) : tipo === 'esquina' ? sur(x, y) || este(x, y) : true;
      if (s) pk(l, x, y, 'sh');
    }
  }
  return l;
}

/** Una mitad (32 px) de la vía del tren, que mide 64 px de alto: dos rieles sobre durmientes y balasto, entre dos bordillos. */
export function tileVia(mitad: 'n' | 's', paso = false): Lienzo {
  const l = tileNuevo();
  const off = mitad === 's' ? 32 : 0;
  const RIEL1 = 21;
  const RIEL2 = 41;
  for (let y = 0; y < LADO; y++) {
    const yy = y + off;
    for (let x = 0; x < LADO; x++) {
      let t: Token;
      if (yy === 0 || yy === 63) t = 'bo0';
      else if (yy <= 3 || yy >= 60) t = 'bo2';
      else if (yy <= 5 || yy >= 58) t = 'bo1';
      else if (paso) {
        // Paso peatonal sobre la vía: losas de concreto a ras de los rieles, con barras de cebra.
        const junta = (x % 16 === 15) || yy % 16 === 15;
        t = junta ? 'c1' : 'c2';
        if (x % 8 < 4 && yy > 7 && yy < 56) t = 'pi0';
      } else {
        const r = azar(x, yy, 400);
        t = r < 0.08 ? 'gr0' : r > 0.9 ? 'gr2' : 'gr1';
        // Durmientes de madera entre los rieles y un poco hacia afuera.
        if (yy >= 16 && yy <= 47 && x % 8 >= 2 && x % 8 <= 4) t = x % 8 === 2 ? 'tr2' : x % 8 === 4 ? 'tr0' : 'tr1';
      }
      pk(l, x, y, t);
    }
  }
  for (const r of [RIEL1, RIEL2]) {
    for (const [dy, t] of [[-1, 'gr0'], [0, 'c4'], [1, 'ac3'], [2, 'ac1']] as const) {
      const y = r + dy - off;
      if (y >= 0 && y < LADO) rk(l, 0, y, LADO, 1, t);
    }
  }
  return l;
}

/** Flecha de sentido pintada en un carril: `centro` es la fila del centro del carril dentro del tile. */
export function tileFlecha(sentido: 'o' | 'e', centro: 8 | 24, cuneta: LadoBordillo): Lienzo {
  const l = tileAsfalto('a', { cuneta });
  const [x0, x1] = [6, 25];
  rk(l, x0 + 4, centro - 1, x1 - x0 - 3, 3, 'pi0');
  for (let i = 0; i <= 6; i++) {
    const h = Math.floor(i * 0.85);
    const x = sentido === 'o' ? x0 + i : x1 - i;
    rk(l, x, centro - h, 1, h * 2 + 1, 'pi0');
  }
  return l;
}

/** Doble línea amarilla vertical que cruza el tile por el centro (calle de dos carriles). */
export function tileDobleCentro(): Lienzo {
  const l = tileAsfalto('a');
  for (const x of [13, 14, 17, 18]) rk(l, x, 0, 1, LADO, 'ama1');
  return l;
}
