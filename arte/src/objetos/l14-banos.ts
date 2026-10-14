/**
 * Lote 14, accesorios del baño: papelera de piso, dispensadores y secador de pared, espejo ancho y el mesón con dos lavabos.
 *
 * Los colgantes (`dispensador-papel`, `dispensador-jabon`, `secador-manos`, `espejo-bano`) se dibujan SOLO de frente en un cuadro
 * de `ancho * 32` por `32 + sobresale`, entre la fila 1 y la `H - 10` (cara de la pared), y `registrarPared` (lote 12) saca de ahí
 * el frente y los dos laterales. Las variantes recolorean la rampa que cambia (`desde`).
 *
 * El mesón (`lavabo-meson`) sale del `lavamanos` de siempre sin el espejo: el espejo es ahora un objeto de pared que se cuelga
 * encima (`espejo-bano`). Se recorta el cuadro por arriba, así que conserva el contorno y la sombra del original.
 */

import { objetoPorId } from '@ol/shared';
import { Lienzo, rampa } from '../nucleo';
import { cerrarSuelo } from './l4-comun';
import { dibujarLavamanosLado, dibujarLavamanosS } from './l4-banos';
import { PLATA, marco, registrarTabla } from './l12-comun';
import type { Cuadros, Dibujo, Fila } from './l12-comun';

/** Tonos de la rampa `neutro` que usan los dibujos claros (neutro-3 a neutro-7): la variante `negro` los pasa a neutro-0 a neutro-4. */
const NEUTRO_CLARO = rampa('neutro').slice(3, 8);

// ---------------------------------------------------------------------------
// Colgantes
// ---------------------------------------------------------------------------

/** Dispensador de toallas de papel: caja blanca con ventanilla, ranura abajo y la punta de la toalla. */
const dibPapel: Dibujo = (l) => {
  l.rect(9, 3, 14, 16, 'neutro-6');
  l.rect(9, 3, 14, 1, 'neutro-7');
  l.rect(9, 3, 1, 16, 'neutro-7');
  l.rect(22, 4, 1, 15, 'neutro-5');
  l.rect(10, 18, 13, 1, 'neutro-5');
  l.rect(11, 5, 10, 7, 'neutro-4');
  l.rect(12, 6, 8, 5, 'vidrio-3');
  l.px(12, 6, 'neutro-7');
  l.px(13, 6, 'neutro-7');
  l.rect(11, 14, 10, 2, 'neutro-3');
  l.rect(13, 16, 6, 4, 'neutro-7');
  l.rect(18, 16, 1, 4, 'neutro-6');
};

/** Dispensador de jabón de pared: placa, depósito con la ventanilla del jabón y la bomba con su pico. */
const dibJabon: Dibujo = (l) => {
  l.rect(10, 5, 12, 14, 'neutro-5');
  l.rect(10, 5, 12, 1, 'neutro-6');
  l.rect(10, 5, 1, 14, 'neutro-6');
  l.rect(21, 6, 1, 13, 'neutro-4');
  l.rect(12, 8, 8, 9, 'neutro-7');
  l.rect(19, 9, 1, 8, 'neutro-6');
  l.rect(13, 10, 5, 5, 'vidrio-2');
  l.rect(13, 10, 5, 1, 'vidrio-3');
  l.rect(14, 2, 4, 3, 'metal-3');
  l.rect(14, 2, 1, 3, 'neutro-7');
  l.rect(18, 3, 4, 1, 'metal-2');
  l.rect(21, 4, 1, 2, 'metal-1');
};

/** Secador de manos: caja redondeada con rejilla, boquilla debajo y una luz roja. */
const dibSecador: Dibujo = (l) => {
  l.rect(8, 4, 16, 13, 'neutro-6');
  l.rect(9, 3, 14, 1, 'neutro-7');
  l.rect(8, 4, 1, 12, 'neutro-7');
  l.rect(23, 5, 1, 12, 'neutro-5');
  l.rect(9, 17, 14, 1, 'neutro-5');
  for (const y of [8, 10, 12]) l.rect(11, y, 10, 1, 'neutro-4');
  l.rect(19, 5, 3, 2, 'neutro-5');
  l.px(20, 5, 'rojo-3');
  l.rect(12, 18, 8, 2, 'neutro-4');
  l.rect(13, 20, 6, 1, 'neutro-3');
};

/** Espejo ancho de baño: marco metálico, luna con destellos y un reborde bajo la luna. */
const dibEspejoBano: Dibujo = (l, W) => {
  const i = marco(l, 3, 5, W - 6, 31, PLATA, 2);
  l.rect(i.x, i.y, i.w, i.h, 'vidrio-3');
  l.rect(i.x, i.y + i.h - 4, i.w, 3, 'vidrio-2');
  l.rect(i.x, i.y + i.h - 1, i.w, 1, 'vidrio-1');
  l.rect(i.x, i.y, i.w, 1, 'neutro-7');
  for (let k = 0; k < 9; k++) {
    l.px(i.x + 6 + k, i.y + 12 - k, 'neutro-7');
    l.px(i.x + 7 + k, i.y + 12 - k, 'neutro-7');
  }
  for (let k = 0; k < 5; k++) l.px(i.x + 20 + k, i.y + 12 - k, 'neutro-7');
  for (let k = 0; k < 6; k++) l.px(i.x + i.w - 18 + k, i.y + 14 - k, 'neutro-7');
};

const TABLA: readonly Fila[] = [
  ['dispensador-papel', dibPapel, NEUTRO_CLARO],
  ['dispensador-jabon', dibJabon, NEUTRO_CLARO],
  ['secador-manos', dibSecador, NEUTRO_CLARO],
  ['espejo-bano', dibEspejoBano, rampa('metal')],
];

// ---------------------------------------------------------------------------
// Papelera de piso
// ---------------------------------------------------------------------------

interface MaterialPapelera {
  luz: string;
  medio: string;
  sombra: string;
  hueco: string;
}

const PAPELERAS: Readonly<Record<string, MaterialPapelera>> = {
  base: { luz: 'metal-3', medio: 'metal-2', sombra: 'metal-1', hueco: 'metal-0' },
  blanco: { luz: 'neutro-7', medio: 'neutro-6', sombra: 'neutro-5', hueco: 'neutro-3' },
  negro: { luz: 'neutro-4', medio: 'neutro-3', sombra: 'neutro-2', hueco: 'neutro-0' },
};

/** Papelera con tapa de aleta y pedal. 32 x 32, bloquea su casilla. */
function papelera(m: MaterialPapelera): Lienzo {
  const l = new Lienzo(32, 32);
  // Cuerpo: luz a la izquierda, sombra a la derecha.
  l.rect(10, 15, 12, 13, m.medio);
  l.rect(10, 15, 2, 13, m.luz);
  l.rect(20, 15, 2, 13, m.sombra);
  l.rect(10, 27, 12, 1, m.sombra);
  l.rect(13, 20, 6, 1, m.sombra);
  // Tapa de aleta con su ranura.
  l.rect(9, 11, 14, 4, m.luz);
  l.rect(9, 14, 14, 1, m.sombra);
  l.rect(22, 11, 1, 4, m.medio);
  l.rect(12, 12, 8, 1, m.hueco);
  // Pedal.
  l.rect(14, 28, 4, 1, m.sombra);
  return cerrarSuelo(l, { contacto: [16, 28, 8, 1] });
}

// ---------------------------------------------------------------------------
// Mesón con dos lavabos
// ---------------------------------------------------------------------------

export function cuadrosBanos14(): Cuadros {
  const c = registrarTabla(new Map(), TABLA);
  const pap = objetoPorId('papelera-bano');
  if (pap === undefined) throw new Error('[papelera-bano] no existe en el inventario.');
  for (const v of pap.variantes) {
    const id = pap.frames['U']?.[v.id];
    const m = PAPELERAS[v.id];
    if (id === undefined || m === undefined) throw new Error(`[papelera-bano] variante ${v.id} sin cuadro o sin material.`);
    c.set(id, papelera(m));
  }
  const meson = objetoPorId('lavabo-meson');
  if (meson === undefined) throw new Error('[lavabo-meson] no existe en el inventario.');
  const f = (clave: string): string => meson.frames[clave]?.['base'] as string;
  c.set(f('S'), dibujarLavamanosS(false).recortar(0, 22, 64, 34));
  c.set(f('E'), dibujarLavamanosLado('E', false).recortar(0, 22, 32, 66));
  c.set(f('O'), dibujarLavamanosLado('O', false).recortar(0, 22, 32, 66));
  return c;
}
