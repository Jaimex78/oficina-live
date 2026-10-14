/**
 * Peatones diminutos (unos 24 px de alto: se ven desde cuatro pisos arriba). Seis personas distintas, cada una con
 * cuadros para caminar al este (el motor los voltea para ir al oeste), al sur (de frente) y al norte (de espaldas),
 * con dos pasos por dirección.
 */

import { Lienzo } from '../nucleo';
import { k, type Token } from './paleta';
import type { SpriteConAncla } from './sprites-vegetacion';

interface Persona {
  piel: Token;
  pelo: Token;
  camisa: readonly [Token, Token];
  pantalon: Token;
  /** Bolso de mano o mochila, pequeños y propios. */
  acc: 'bolso' | 'mochila' | null;
  accColor: Token;
}

export const PERSONAS: readonly Persona[] = [
  { piel: 'pe0', pelo: 'tr0', camisa: ['ro1', 'ro2'], pantalon: 'je0', acc: 'bolso', accColor: 'tr1' },
  { piel: 'pe2', pelo: 'ac0', camisa: ['vg1', 'vg2'], pantalon: 'ac1', acc: 'mochila', accColor: 'ro1' },
  { piel: 'pe1', pelo: 'tr2', camisa: ['co1', 'co2'], pantalon: 'je1', acc: null, accColor: 'tr1' },
  { piel: 'pe3', pelo: 'ac0', camisa: ['v2', 'v3'], pantalon: 'c1', acc: 'bolso', accColor: 'ro0' },
  { piel: 'pe0', pelo: 'cin0', camisa: ['mo1', 'mo2'], pantalon: 'ac2', acc: 'mochila', accColor: 'vg0' },
  { piel: 'pe1', pelo: 'ac1', camisa: ['c3', 'c4'], pantalon: 'vg0', acc: 'mochila', accColor: 'mo0' },
];

const W = 14;
const H = 26;

type Dir = 'e' | 's' | 'n';

/** Una persona dibujada en un lienzo de 12 x 24 que luego se rodea de contorno. */
function dibujarPersona(p: Persona, dir: Dir, paso: 0 | 1): Lienzo {
  const l = new Lienzo(W, H);
  const o = 1; // margen para el contorno
  const rc = (x: number, y: number, w: number, h: number, t: Token): void => {
    l.rect(x + o, y + o, w, h, k(t));
  };
  const pc = (x: number, y: number, t: Token): void => {
    l.px(x + o, y + o, k(t));
  };
  const [c1, c2] = p.camisa;
  if (dir === 's' || dir === 'n') {
    const largo0 = paso === 0 ? 5 : 4;
    const largo1 = paso === 0 ? 4 : 5;
    // Piernas y zapatos.
    rc(3, 16, 3, largo0, p.pantalon);
    rc(6, 16, 3, largo1, p.pantalon);
    rc(3, 16 + largo0, 3, 1, 'ac0');
    rc(6, 16 + largo1, 3, 1, 'ac0');
    // Torso y brazos.
    rc(3, 10, 6, 7, c1);
    rc(3, 10, 6, 1, c2);
    rc(2, 11, 1, 5, c1);
    rc(9, 11, 1, 5, c1);
    pc(2, 15, p.piel);
    pc(9, 15, p.piel);
    // Cabeza.
    rc(2, 1, 8, 9, p.piel);
    if (dir === 's') {
      rc(2, 0, 8, 4, p.pelo);
      rc(2, 4, 1, 2, p.pelo);
      rc(9, 4, 1, 2, p.pelo);
      pc(4, 6, 'ac0');
      pc(7, 6, 'ac0');
    } else {
      // De espaldas: todo es pelo.
      rc(2, 0, 8, 9, p.pelo);
      rc(3, 9, 6, 1, p.pelo);
    }
  } else {
    // De lado, mirando al este: las piernas se abren y se cierran al caminar.
    if (paso === 0) {
      rc(3, 16, 3, 5, p.pantalon);
      rc(7, 16, 3, 5, p.pantalon);
      rc(3, 21, 3, 1, 'ac0');
      rc(8, 21, 3, 1, 'ac0');
    } else {
      rc(5, 16, 4, 5, p.pantalon);
      rc(5, 21, 5, 1, 'ac0');
    }
    rc(4, 10, 5, 7, c1);
    rc(4, 10, 5, 1, c2);
    // Brazo que balancea.
    rc(paso === 0 ? 5 : 6, 11, 2, 5, c2);
    pc(paso === 0 ? 5 : 6, 15, p.piel);
    rc(3, 1, 7, 9, p.piel);
    rc(2, 0, 6, 5, p.pelo);
    rc(2, 4, 2, 4, p.pelo);
    pc(8, 5, 'ac0');
    pc(10, 6, p.piel);
  }
  if (p.acc === 'bolso') {
    // Bolso de mano colgado de la mano que queda del lado de la cámara.
    const x = dir === 'e' ? 7 : 9;
    rc(x, 15, 3, 3, p.accColor);
    pc(x + 1, 14, 'ac1');
    pc(x, 15, 'c3');
  } else if (p.acc === 'mochila') {
    if (dir === 'n') {
      rc(3, 10, 6, 7, p.accColor);
      rc(3, 10, 6, 1, 'c2');
      rc(4, 14, 4, 1, 'ac1');
    } else if (dir === 's') {
      // De frente solo se ven las correas.
      rc(4, 10, 1, 5, 'ac1');
      rc(7, 10, 1, 5, 'ac1');
    } else {
      rc(2, 10, 3, 7, p.accColor);
      rc(2, 10, 3, 1, 'c2');
    }
  }
  return l.contorno(k('ol'));
}

/** Los 36 cuadros: 6 personas x 3 direcciones x 2 pasos. Los pies quedan en el centro de la base. */
export function spritesGente(): SpriteConAncla[] {
  const salida: SpriteConAncla[] = [];
  PERSONAS.forEach((p, i) => {
    for (const dir of ['e', 's', 'n'] as const) {
      for (const paso of [0, 1] as const) {
        salida.push({ id: `pers-${i + 1}-${dir}-${paso}`, lienzo: dibujarPersona(p, dir, paso), ancla: { x: 7, y: 23 } });
      }
    }
  });
  return salida;
}
