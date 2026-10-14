/**
 * Mobiliario de calle, obra y azoteas: postes, semáforos, paradero, canecas, bicicletas, conos, barricadas, valla azul
 * y cinta de obra (como en una obra de la zona), y los equipos de las azoteas vecinas.
 */

import { Lienzo } from '../nucleo';
import { pk, rk } from './comun';
import { k } from './paleta';
import type { SpriteConAncla } from './sprites-vegetacion';

/** Poste de alumbrado con brazo a la derecha y luminaria. Mide 28 x 60; la base apoya en (13, 58). */
export function spritePoste(): SpriteConAncla {
  const l = new Lienzo(28, 60);
  rk(l, 9, 55, 8, 3, 'ac1');
  rk(l, 9, 55, 8, 1, 'ac3');
  rk(l, 12, 10, 3, 46, 'ac1');
  rk(l, 12, 10, 1, 46, 'ac3');
  // Brazo curvo hacia la derecha.
  for (let i = 0; i < 11; i++) {
    const dy = i < 3 ? 2 - i : 0;
    rk(l, 13 + i, 8 + dy, 1, 2, 'ac1');
    pk(l, 13 + i, 8 + dy, 'ac3');
  }
  // Luminaria.
  rk(l, 20, 9, 7, 3, 'ac2');
  rk(l, 20, 9, 7, 1, 'ac3');
  rk(l, 21, 12, 5, 1, 'bombilla');
  l.contorno(k('ol'));
  return { id: 'poste-luz', lienzo: l, ancla: { x: 13, y: 58 } };
}

/** Semáforo con tres luces: `estado` es la que está encendida. Mide 16 x 46. */
export function spriteSemaforo(estado: 'r' | 'a' | 'v'): SpriteConAncla {
  const l = new Lienzo(16, 46);
  rk(l, 6, 22, 3, 22, 'ac1');
  rk(l, 6, 22, 1, 22, 'ac3');
  rk(l, 4, 42, 7, 2, 'ac2');
  // Caja con tres lentes.
  rk(l, 3, 2, 9, 22, 'ac0');
  rk(l, 3, 2, 1, 22, 'ac2');
  const lente = (y: number, apagado: 'ac1', encendido: 'ro2' | 'ama1' | 'v4', activo: boolean): void => {
    rk(l, 5, y, 5, 5, activo ? encendido : apagado);
    if (activo) {
      pk(l, 5, y, 'bombilla');
      rk(l, 5, y + 4, 5, 1, encendido === 'ro2' ? 'ro1' : encendido === 'ama1' ? 'ama0' : 'v3');
    }
  };
  lente(4, 'ac1', 'ro2', estado === 'r');
  lente(10, 'ac1', 'ama1', estado === 'a');
  lente(16, 'ac1', 'v4', estado === 'v');
  l.contorno(k('ol'));
  return { id: `semaforo-${estado}`, lienzo: l, ancla: { x: 8, y: 44 } };
}

/** Paradero con techo de vidrio y banca. Mide 72 x 32. */
export function spriteParadero(): SpriteConAncla {
  const l = new Lienzo(72, 32);
  // Techo visto desde arriba: vidrio con marco de aluminio.
  rk(l, 3, 2, 66, 18, 'ac2');
  rk(l, 5, 4, 62, 14, 'vg2');
  for (let x = 5; x < 67; x++) {
    const t = (x - 5) / 62;
    for (let y = 4; y < 18; y++) if (((x + y) & 1) === 0 && t > 0.15 && y < 8) pk(l, x, y, 'vg3');
  }
  for (const x of [20, 36, 52]) rk(l, x, 4, 1, 14, 'ac2');
  rk(l, 3, 2, 66, 1, 'ac3');
  // Frente del techo (la cara que mira al sur) y los apoyos.
  rk(l, 3, 20, 66, 2, 'ac1');
  rk(l, 5, 22, 2, 8, 'ac1');
  rk(l, 65, 22, 2, 8, 'ac1');
  // Banca de madera debajo.
  rk(l, 14, 23, 44, 3, 'tr2');
  rk(l, 14, 26, 44, 1, 'tr0');
  rk(l, 16, 26, 2, 3, 'ac1');
  rk(l, 54, 26, 2, 3, 'ac1');
  // Rótulo azul de la parada.
  rk(l, 30, 24, 12, 1, 'vg2');
  l.contorno(k('ol'));
  return { id: 'paradero', lienzo: l, ancla: { x: 36, y: 30 } };
}

/** Caneca de basura verde con tapa. Mide 14 x 18. */
export function spriteCaneca(): SpriteConAncla {
  const l = new Lienzo(14, 18);
  rk(l, 3, 4, 8, 11, 'v1');
  rk(l, 3, 4, 2, 11, 'v2');
  rk(l, 10, 4, 1, 11, 'v0');
  rk(l, 2, 2, 10, 3, 'ac2');
  rk(l, 2, 2, 10, 1, 'ac3');
  rk(l, 5, 8, 4, 1, 'c3');
  l.contorno(k('ol'));
  return { id: 'caneca', lienzo: l, ancla: { x: 7, y: 16 } };
}

/** Bicicleta de lado. Mide 28 x 16; `a` roja y `b` azul. */
export function spriteBici(v: 'a' | 'b'): SpriteConAncla {
  const l = new Lienzo(28, 16);
  const marco = v === 'a' ? 'ro1' : 'vg2';
  for (const x of [6, 21]) {
    l.elipse(x, 10, 5, 4, k('ac0'), { relleno: false });
    l.elipse(x, 10, 4, 3, k('ac0'), { relleno: false });
    pk(l, x, 10, 'c2');
  }
  // Cuadro: triángulo, tija, manubrio y sillín.
  l.linea(6, 10, 12, 4, k(marco));
  l.linea(12, 4, 20, 4, k(marco));
  l.linea(20, 4, 21, 10, k(marco));
  l.linea(12, 4, 14, 10, k(marco));
  l.linea(14, 10, 6, 10, k(marco));
  l.linea(20, 4, 22, 1, k('ac2'));
  rk(l, 10, 2, 5, 1, 'ac1');
  l.contorno(k('ol'));
  return { id: `bici-${v}`, lienzo: l, ancla: { x: 14, y: 14 } };
}

/** Cono de obra naranja con banda blanca. Mide 11 x 14. */
export function spriteCono(): SpriteConAncla {
  const l = new Lienzo(11, 14);
  rk(l, 1, 11, 9, 2, 'co4');
  rk(l, 1, 11, 9, 1, 'ac2');
  for (let i = 0; i < 10; i++) {
    const y = 10 - i;
    const mitad = Math.min(3, 1 + Math.floor((9 - i) / 3));
    const banda = i === 3 || i === 4;
    rk(l, 5 - mitad, y, mitad * 2 + 1, 1, banda ? 'co3' : 'co1');
    pk(l, 5 - mitad, y, banda ? 'co3' : 'co2');
    pk(l, 5 + mitad, y, 'co0');
  }
  l.contorno(k('co4'));
  return { id: 'cono', lienzo: l, ancla: { x: 5, y: 12 } };
}

/** Barricada de obra naranja y blanca sobre dos patas. Mide 34 x 16. */
export function spriteBarricada(): SpriteConAncla {
  const l = new Lienzo(34, 16);
  rk(l, 5, 8, 3, 6, 'ac1');
  rk(l, 26, 8, 3, 6, 'ac1');
  for (const y of [2, 7]) {
    rk(l, 2, y, 30, 4, 'co3');
    for (let x = 2; x < 32; x += 8) rk(l, x, y, 4, 4, 'co1');
    rk(l, 2, y, 30, 1, 'co2');
    rk(l, 2, y + 3, 30, 1, 'co0');
  }
  l.contorno(k('co4'));
  return { id: 'barricada', lienzo: l, ancla: { x: 17, y: 14 } };
}

/** Panel de valla de obra azul, de un tile de ancho: lámina con nervaduras y poste a cada lado. Mide 32 x 26. */
export function spriteValla(v: 'a' | 'b'): SpriteConAncla {
  const l = new Lienzo(32, 26);
  rk(l, 0, 6, 32, 16, 'vb1');
  rk(l, 0, 4, 32, 2, 'vb2');
  rk(l, 0, 22, 32, 2, 'vb0');
  for (let x = 4; x < 32; x += 6) rk(l, x, 6, 1, 16, 'vb0');
  rk(l, 0, 4, 1, 20, 'ac1');
  rk(l, 31, 4, 1, 20, 'ac1');
  if (v === 'b') {
    // Letrero blanco con borde rojo, como los avisos de obra.
    rk(l, 10, 9, 12, 8, 'c4');
    rk(l, 10, 9, 12, 1, 'ro1');
    rk(l, 12, 12, 8, 1, 'ac2');
    rk(l, 12, 14, 6, 1, 'ac2');
  }
  l.contorno(k('ol'));
  return { id: `valla-${v}`, lienzo: l, ancla: { x: 16, y: 24 } };
}

/** Poste de cinta de obra. Mide 6 x 18. */
export function spriteCintaPoste(): SpriteConAncla {
  const l = new Lienzo(6, 18);
  rk(l, 2, 2, 2, 14, 'ac1');
  rk(l, 1, 14, 4, 2, 'ac2');
  rk(l, 1, 0, 4, 3, 'cin0');
  l.contorno(k('ol'));
  return { id: 'cinta-poste', lienzo: l, ancla: { x: 3, y: 16 } };
}

/** Tramo de cinta amarilla y negra que cuelga entre dos postes. Mide 32 x 7. */
export function spriteCinta(): SpriteConAncla {
  const l = new Lienzo(32, 7);
  for (let x = 0; x < 32; x++) {
    const t = x / 31;
    const caida = Math.round(Math.sin(t * Math.PI) * 3);
    const amarillo = Math.floor(x / 3) % 2 === 0;
    for (const dy of [0, 1]) l.px(x, 1 + caida + dy, k(amarillo ? 'cin0' : 'co4'));
  }
  return { id: 'cinta', lienzo: l, ancla: { x: 16, y: 5 } };
}

/** Contenedor de basura grande con tapa, de los que quedan en los callejones. Mide 40 x 24. */
export function spriteContenedor(): SpriteConAncla {
  const l = new Lienzo(40, 24);
  rk(l, 2, 6, 36, 14, 'v1');
  rk(l, 2, 6, 36, 2, 'v2');
  rk(l, 2, 18, 36, 2, 'v0');
  for (const x of [8, 20, 31]) rk(l, x, 8, 1, 10, 'v0');
  rk(l, 1, 3, 38, 4, 'ac2');
  rk(l, 1, 3, 38, 1, 'ac3');
  rk(l, 1, 6, 38, 1, 'ac1');
  rk(l, 4, 20, 4, 3, 'ac0');
  rk(l, 32, 20, 4, 3, 'ac0');
  l.contorno(k('ol'));
  return { id: 'contenedor', lienzo: l, ancla: { x: 20, y: 21 } };
}

/** Banca de parque. Mide 30 x 14. */
export function spriteBanca(): SpriteConAncla {
  const l = new Lienzo(30, 14);
  rk(l, 2, 3, 26, 3, 'tr2');
  rk(l, 2, 6, 26, 1, 'tr0');
  rk(l, 2, 7, 26, 3, 'tr1');
  rk(l, 2, 10, 26, 1, 'tr0');
  rk(l, 3, 11, 2, 2, 'ac1');
  rk(l, 25, 11, 2, 2, 'ac1');
  l.contorno(k('ol'));
  return { id: 'banca', lienzo: l, ancla: { x: 15, y: 12 } };
}

// ---------------------------------------------------------------------------
// Azoteas
// ---------------------------------------------------------------------------

/** Condensador de aire acondicionado con su ventilador. */
export function spriteAire(id: string, ancho: number, alto: number): SpriteConAncla {
  const l = new Lienzo(ancho, alto);
  // Cara de arriba clara con la rejilla redonda y cara frontal oscura.
  const arriba = alto - 8;
  rk(l, 1, 1, ancho - 2, arriba, 'c3');
  rk(l, 1, 1, ancho - 2, 1, 'c4');
  rk(l, 1, 1 + arriba, ancho - 2, 6, 'c1');
  rk(l, 1, 1 + arriba, ancho - 2, 1, 'c2');
  rk(l, 1, alto - 2, ancho - 2, 1, 'c0');
  const r = Math.max(3, Math.floor(Math.min(ancho, arriba) / 2) - 2);
  const cx = Math.floor(ancho / 2);
  const cy = 1 + Math.floor(arriba / 2);
  l.elipse(cx, cy, r, Math.max(2, r - 1), k('ac1'));
  l.elipse(cx, cy, Math.max(1, r - 2), Math.max(1, r - 3), k('ac0'));
  l.linea(cx - r + 1, cy, cx + r - 1, cy, k('ac2'));
  l.linea(cx, cy - r + 2, cx, cy + r - 2, k('ac2'));
  l.contorno(k('ol'));
  return { id, lienzo: l, ancla: { x: cx, y: alto - 2 } };
}

/** Tanque de agua cilíndrico: tapa elíptica y cuerpo con aros. */
export function spriteTanque(): SpriteConAncla {
  const l = new Lienzo(30, 36);
  rk(l, 3, 12, 24, 20, 'tk1');
  rk(l, 3, 12, 6, 20, 'tk2');
  rk(l, 21, 12, 6, 20, 'tk0');
  l.elipse(15, 31, 12, 4, k('tk0'));
  rk(l, 3, 18, 24, 1, 'tk0');
  rk(l, 3, 25, 24, 1, 'tk0');
  l.elipse(15, 12, 12, 5, k('tk2'));
  l.elipse(15, 12, 8, 3, k('tk1'));
  rk(l, 13, 10, 4, 2, 'tk0');
  l.contorno(k('ol'));
  return { id: 'tanque', lienzo: l, ancla: { x: 15, y: 33 } };
}

/** Claraboya de vidrio con marco. */
export function spriteClaraboya(): SpriteConAncla {
  const l = new Lienzo(38, 24);
  rk(l, 2, 4, 34, 16, 'c1');
  rk(l, 4, 6, 30, 12, 'vg2');
  for (let x = 4; x < 34; x++) for (let y = 6; y < 10; y++) if (((x + y) & 1) === 0) pk(l, x, y, 'vg3');
  for (const x of [13, 23]) rk(l, x, 6, 1, 12, 'c2');
  rk(l, 2, 20, 34, 2, 'c0');
  rk(l, 2, 4, 34, 1, 'c3');
  l.contorno(k('ol'));
  return { id: 'claraboya', lienzo: l, ancla: { x: 19, y: 22 } };
}

/** Cuarto de la escalera y del ascensor: una caja con puerta y techo plano. */
export function spriteCuarto(): SpriteConAncla {
  const l = new Lienzo(56, 44);
  rk(l, 2, 2, 52, 20, 'c3');
  rk(l, 2, 2, 52, 1, 'c4');
  salpicarCuarto(l);
  rk(l, 2, 22, 52, 18, 'c1');
  rk(l, 2, 22, 52, 1, 'c2');
  rk(l, 2, 38, 52, 2, 'c0');
  rk(l, 22, 26, 12, 14, 'ac1');
  rk(l, 23, 27, 10, 13, 'ac2');
  rk(l, 27, 27, 2, 13, 'ac1');
  for (const x of [8, 40]) rk(l, x, 27, 6, 5, 'vg1');
  l.contorno(k('ol'));
  return { id: 'cuarto', lienzo: l, ancla: { x: 28, y: 40 } };
}

function salpicarCuarto(l: Lienzo): void {
  for (let x = 6; x < 50; x += 12) rk(l, x, 6, 6, 1, 'c2');
  rk(l, 2, 21, 52, 1, 'c2');
}

/** Antena con parabólica. */
export function spriteAntena(): SpriteConAncla {
  const l = new Lienzo(14, 40);
  rk(l, 6, 10, 2, 28, 'ac2');
  rk(l, 6, 10, 1, 28, 'ac3');
  rk(l, 4, 36, 6, 2, 'ac1');
  l.elipse(7, 8, 5, 4, k('c3'));
  l.elipse(7, 8, 3, 2, k('c1'));
  pk(l, 7, 8, 'ac0');
  rk(l, 6, 0, 2, 5, 'ac2');
  l.contorno(k('ol'));
  return { id: 'antena', lienzo: l, ancla: { x: 7, y: 38 } };
}

/** Paneles solares: una hilera inclinada vista desde arriba. */
export function spriteSolar(): SpriteConAncla {
  const l = new Lienzo(40, 24);
  rk(l, 2, 2, 36, 18, 'c1');
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 2; j++) {
      const x = 3 + i * 12;
      const y = 3 + j * 9;
      rk(l, x, y, 11, 8, 'vg0');
      rk(l, x, y, 11, 1, 'vg2');
      rk(l, x + 5, y, 1, 8, 'vg1');
      rk(l, x, y + 4, 11, 1, 'vg1');
    }
  }
  l.contorno(k('ol'));
  return { id: 'solar', lienzo: l, ancla: { x: 20, y: 22 } };
}

/** Todo el mobiliario. */
export function spritesMobiliario(): SpriteConAncla[] {
  return [
    spritePoste(),
    spriteSemaforo('r'),
    spriteSemaforo('a'),
    spriteSemaforo('v'),
    spriteParadero(),
    spriteCaneca(),
    spriteBici('a'),
    spriteBici('b'),
    spriteCono(),
    spriteBarricada(),
    spriteValla('a'),
    spriteValla('b'),
    spriteCintaPoste(),
    spriteCinta(),
    spriteBanca(),
    spriteAire('aire-g', 32, 24),
    spriteAire('aire-p', 20, 16),
    spriteTanque(),
  ];
}
