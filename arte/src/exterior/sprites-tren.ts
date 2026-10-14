/**
 * El tren que pasa por el corredor de la Av. Carrera 9: una locomotora roja con nariz amarilla y vagones crema de
 * pasajeros, vistos de lado y desde arriba. Mira al este (el motor lo voltea para ir al oeste). También la baliza
 * del paso peatonal sobre la vía y el pitido visual.
 */

import { Lienzo } from '../nucleo';
import { pk, rk } from './comun';
import { k, type Token } from './paleta';
import type { SpriteConAncla } from './sprites-vegetacion';

function ruedas(l: Lienzo, xs: readonly number[], y: number): void {
  for (const x of xs) {
    rk(l, x - 4, y, 9, 3, 'ac0');
    rk(l, x - 3, y, 7, 1, 'ac2');
  }
}

/** Locomotora de 66 x 32, mirando al este. */
export function spriteLocomotora(): SpriteConAncla {
  const l = new Lienzo(66, 32);
  ruedas(l, [14, 26, 42, 54], 26);
  l.rectRedondeado(2, 5, 62, 21, 4, k('ro1'));
  for (let y = 5; y < 26; y++) {
    for (let x = 2; x < 64; x++) {
      if (!l.esOpaco(x, y)) continue;
      if (y < 10) pk(l, x, y, 'ro2');
      else if (y >= 21) pk(l, x, y, 'ro0');
    }
  }
  // Nariz amarilla y faro.
  rk(l, 50, 8, 13, 16, 'ama1');
  rk(l, 50, 8, 13, 2, 'cin0');
  rk(l, 50, 22, 13, 2, 'ama0');
  rk(l, 61, 13, 3, 4, 'bombilla');
  // Cabina con vidrios, a la izquierda.
  rk(l, 6, 12, 20, 6, 'cr1');
  rk(l, 6, 12, 20, 1, 'cr2');
  for (const x of [12, 19]) rk(l, x, 12, 1, 6, 'ro1');
  // Equipos del techo y la bocina.
  rk(l, 30, 6, 16, 3, 'ac2');
  rk(l, 30, 6, 16, 1, 'ac3');
  rk(l, 33, 4, 3, 2, 'c3');
  // Franja blanca.
  rk(l, 6, 20, 42, 1, 'c4');
  l.contorno(k('ol'));
  return { id: 'tren-loco-e', lienzo: l, ancla: { x: 33, y: 26 } };
}

/** Vagón de pasajeros de 50 x 30; `a` con franja roja y `b` con franja azul. */
export function spriteVagon(v: 'a' | 'b'): SpriteConAncla {
  const franja: Token = v === 'a' ? 'ro1' : 'vg1';
  const l = new Lienzo(50, 30);
  ruedas(l, [10, 40], 24);
  l.rectRedondeado(1, 4, 48, 21, 3, k('c3'));
  for (let y = 4; y < 25; y++) {
    for (let x = 1; x < 49; x++) {
      if (!l.esOpaco(x, y)) continue;
      if (y < 8) pk(l, x, y, 'c4');
      else if (y >= 22) pk(l, x, y, 'c1');
    }
  }
  // Ventanas con parantes y una puerta.
  rk(l, 4, 11, 42, 6, 'cr1');
  rk(l, 4, 11, 42, 1, 'cr2');
  for (let x = 10; x < 44; x += 8) rk(l, x, 11, 1, 6, 'c3');
  rk(l, 22, 10, 6, 11, 'c2');
  rk(l, 24, 11, 2, 9, 'cr0');
  rk(l, 1, 19, 48, 2, franja);
  // Acople.
  rk(l, 0, 21, 1, 2, 'ac1');
  rk(l, 49, 21, 1, 2, 'ac1');
  l.contorno(k('ol'));
  return { id: `tren-vagon-${v}`, lienzo: l, ancla: { x: 25, y: 24 } };
}

/** Baliza del paso peatonal sobre la vía: cruz de aviso y dos luces rojas. `a` enciende la izquierda, `b` la derecha y `c` ninguna (sin tren). */
export function spriteBaliza(v: 'a' | 'b' | 'c'): SpriteConAncla {
  const l = new Lienzo(18, 40);
  rk(l, 8, 14, 2, 24, 'ac1');
  rk(l, 5, 36, 8, 2, 'ac2');
  // Cruz de San Andrés: dos tablillas blancas con borde rojo.
  l.linea(2, 2, 15, 12, k('c4'));
  l.linea(3, 2, 16, 12, k('c4'));
  l.linea(15, 2, 2, 12, k('c4'));
  l.linea(14, 2, 1, 12, k('c4'));
  l.linea(2, 3, 15, 13, k('ro1'));
  l.linea(15, 3, 2, 13, k('ro1'));
  // Las dos luces.
  const luz = (x: number, on: boolean): void => {
    rk(l, x, 16, 4, 4, on ? 'ro2' : 'ro0');
    if (on) pk(l, x, 16, 'bombilla');
  };
  rk(l, 3, 15, 12, 6, 'ac0');
  luz(4, v === 'a');
  luz(10, v === 'b');
  l.contorno(k('ol'));
  return { id: `baliza-${v}`, lienzo: l, ancla: { x: 9, y: 38 } };
}

/** Pitido: tres arcos blancos que salen de la bocina. */
export function spritePitido(): SpriteConAncla {
  const l = new Lienzo(18, 14);
  for (let i = 0; i < 3; i++) {
    const x = 2 + i * 5;
    const alto = 4 + i * 3;
    const y0 = 7 - Math.floor(alto / 2);
    rk(l, x, y0, 1, alto, 'c4');
    rk(l, x + 1, y0 + 1, 1, alto - 2, 'c4');
  }
  return { id: 'pitido', lienzo: l, ancla: { x: 0, y: 7 } };
}

export function spritesTren(): SpriteConAncla[] {
  return [spriteLocomotora(), spriteVagon('a'), spriteVagon('b'), spriteBaliza('a'), spriteBaliza('b'), spriteBaliza('c'), spritePitido()];
}
