/**
 * Halloween (lote 6): calabaza tallada, telaraña, esqueleto, lápida, caldero, fantasma colgante, murciélagos, escoba,
 * árbol seco y bowl de dulces. 14 cuadros.
 *
 * Luces: la calabaza (naranja, parpadea) y el caldero (verde, burbujea) emiten luz de noche, así que sus partes
 * encendidas llevan los tonos más claros y saturados. El resto se queda en tonos apagados para que ellos brillen.
 * Sombras: calabaza, esqueleto, lápida, caldero, escoba y árbol van sobre el piso (dos tonos y mancha de contacto);
 * el bowl va sobre una mesa (reborde de 1 px); telaraña y murciélagos cuelgan de la pared (1 px); el fantasma va en el
 * aire y no lleva sombra.
 */

import { Lienzo } from '../nucleo';
import type { ColorEntrada } from '../nucleo';
import { B, HUESO, azar, cerrarApoyado, cerrarColgante, cerrarSinSombra, cerrarSuelo, conBorde, cuadricula, enElipse, entre, huecoLuminoso, placaLateral, poligono, pxSobre, quitar, registrar, sombrearBordes, tonos, trazo, volumen } from './l6-comun';
import type { Corrida, Cuadros } from './l6-comun';

// ---------------------------------------------------------------------------
// Calabaza grande tallada
// ---------------------------------------------------------------------------

/** Calabaza grande de tres gajos con cara tallada que brilla por dentro. 32 x 40, apoya en la fila 35. */
export function dibujarCalabazaGrande(): Lienzo {
  const l = new Lienzo(32, 40);
  const cy = 25;
  const dentro = (x: number, y: number): boolean => enElipse(x, y, 9.5, cy, 6.5, 10) || enElipse(x, y, 22.5, cy, 6.5, 10) || enElipse(x, y, 16, cy, 8, 11);
  volumen(l, 16, cy, 13.5, 11.5, dentro, ['naranja-1', 'naranja-2', 'naranja-3', 'naranja-4'], [0.34, 0.62, 0.88]);
  // Costillas: dos curvas oscuras que separan los gajos, con luz al lado derecho de cada una.
  for (const k of [-0.46, 0.46]) {
    for (let y = cy - 10; y <= cy + 10; y++) {
      const v = (y - cy) / 11.5;
      const x = Math.round(16 + k * 13 * Math.sqrt(Math.max(0, 1 - v * v)));
      if (l.esOpaco(x, y)) l.px(x, y, 'naranja-1');
      if (l.esOpaco(x + 1, y) && k < 0) l.px(x + 1, y, 'naranja-3');
    }
  }
  // Tallo y zarcillo.
  l.rect(14, 10, 5, 5, 'planta-2');
  l.rect(14, 10, 2, 5, 'planta-3');
  l.rect(18, 10, 1, 5, 'planta-1');
  l.rect(14, 10, 5, 1, 'planta-3');
  l.px(19, 11, 'planta-1');
  l.px(20, 10, 'planta-2');
  l.px(21, 11, 'planta-2');
  l.px(22, 12, 'planta-2');
  l.px(22, 13, 'planta-3');
  l.px(21, 13, 'planta-3');
  // Ojos triangulares, nariz y sonrisa de dientes: huecos que brillan.
  const ojoI: Corrida[] = [[18, 11, 11], [19, 10, 12], [20, 9, 13], [21, 8, 14], [22, 8, 14]];
  const ojoD: Corrida[] = [[18, 21, 21], [19, 20, 22], [20, 19, 23], [21, 18, 24], [22, 18, 24]];
  const nariz: Corrida[] = [[24, 16, 16], [25, 15, 17], [26, 15, 17]];
  const boca: Corrida[] = [
    [28, 7, 10], [28, 13, 14], [28, 17, 18], [28, 21, 24],
    [29, 8, 24],
    [30, 8, 14], [30, 17, 24],
    [31, 10, 14], [31, 17, 22],
    [32, 12, 13], [32, 19, 20],
  ];
  const colores = { reborde: 'naranja-0', anillo: 'tela-calida-2', interior: 'tela-calida-3', centro: 'neutro-7' } as const;
  for (const hueco of [ojoI, ojoD, nariz, boca]) huecoLuminoso(l, hueco, colores);
  l.rect(10, 21, 3, 1, 'neutro-7');
  l.rect(20, 21, 3, 1, 'neutro-7');
  // Brillo de la cáscara.
  l.rect(6, 19, 2, 1, 'neutro-7');
  l.px(5, 21, 'neutro-7');
  l.px(5, 22, 'naranja-4');
  return cerrarSuelo(l, { contacto: [17, 35, 11, 1], diagonales: true });
}

// ---------------------------------------------------------------------------
// Telaraña
// ---------------------------------------------------------------------------

/** Sombra de 1 px de lo colgado sin contorno (la seda es un hilo: un borde oscuro la volvería una reja). */
function sombraDeSeda(l: Lienzo): Lienzo {
  return l.sombraProyectada('azul-oficina-2', 1, 1);
}

/** Telaraña de esquina: cinco radios de seda blanca, tres arcos combados y una araña colgando. 64 x 32. */
export function dibujarTelaranaS(): Lienzo {
  const l = new Lienzo(64, 32);
  const radios: Array<[number, number]> = [[46, 1], [41, 9], [31, 16], [19, 20], [1, 22]];
  const arcos: Array<[number, 'neutro-7' | 'neutro-6']> = [[0.36, 'neutro-7'], [0.68, 'neutro-7'], [1, 'neutro-7']];
  for (const [x, y] of radios) l.linea(1, 1, x, y, 'neutro-7');
  arcos.forEach(([f, color], i) => {
    for (let k = 0; k + 1 < radios.length; k++) {
      const [ax, ay] = radios[k] as [number, number];
      const [bx, by] = radios[k + 1] as [number, number];
      const x0 = Math.round(1 + (ax - 1) * f);
      const y0 = Math.round(1 + (ay - 1) * f);
      const x1 = Math.round(1 + (bx - 1) * f);
      const y1 = Math.round(1 + (by - 1) * f);
      // El punto medio se jala hacia la esquina: la seda se comba.
      const mx = Math.round((x0 + x1) / 2 + (1 - (x0 + x1) / 2) * (i === 2 ? 0.04 : 0.14));
      const my = Math.round((y0 + y1) / 2 + (1 - (y0 + y1) / 2) * (i === 2 ? 0.04 : 0.14));
      l.linea(x0, y0, mx, my, color);
      l.linea(mx, my, x1, y1, color);
    }
  });
  // Un par de hilos sueltos que cuelgan del último arco, y una gota de rocío.
  l.linea(31, 16, 31, 20, 'neutro-6');
  l.linea(46, 1, 49, 4, 'neutro-6');
  l.px(24, 8, 'vidrio-3');
  l.px(24, 9, 'vidrio-2');
  const hilos = l.copiar();
  sombraDeSeda(l);
  // La araña lleva su propio contorno, así se despega de la seda.
  const arana = new Lienzo(64, 32);
  dibujarArana(arana, 37, 11);
  arana.contorno('azul-oficina-0');
  void hilos;
  return l.pegar(arana, 0, 0);
}

/** Una araña colgando de su hilo desde la fila 0: cuerpo redondo, ocho patas y dos ojitos rojos. */
function dibujarArana(l: Lienzo, x: number, y: number): void {
  l.linea(x, 2, x, y - 1, 'neutro-6');
  l.rect(x - 2, y, 5, 4, 'azul-oficina-1');
  l.rect(x - 1, y - 1, 3, 1, 'azul-oficina-1');
  l.px(x - 1, y, 'azul-oficina-4');
  l.px(x - 2, y + 1, 'morado-1');
  l.px(x - 1, y + 1, 'rojo-3');
  l.px(x + 1, y + 1, 'rojo-3');
  for (const dx of [-1, 1]) {
    l.px(x + dx * 3, y - 1, 'azul-oficina-1');
    l.px(x + dx * 4, y - 2, 'azul-oficina-1');
    l.px(x + dx * 3, y + 1, 'azul-oficina-1');
    l.px(x + dx * 4, y + 1, 'azul-oficina-1');
    l.px(x + dx * 3, y + 3, 'azul-oficina-1');
    l.px(x + dx * 4, y + 4, 'azul-oficina-1');
  }
}

/** Telaraña vista de canto sobre la tapa de una pared vertical: seda en zigzag y una araña colgando. 32 x 64. */
export function dibujarTelaranaLado(lado: 'E' | 'O'): Lienzo {
  const l = new Lienzo(32, 64);
  // Seda: un hilo junto a la pared y diagonales que lo cruzan cada seis filas, cada vez más cortas hacia abajo.
  placaLateral(l, lado, 3, 40, 4, (i, j) => {
    const t = j % 8;
    const largo = j < 16 ? 4 : j < 28 ? 3 : 2;
    if (i === 0) return j % 2 === 0 || j < 22 ? 'neutro-7' : 'neutro-6';
    if (i < largo && (t === i || t === 7 - i)) return 'neutro-7';
    return null;
  });
  sombraDeSeda(l);
  const araña = new Lienzo(32, 64);
  const x = lado === 'E' ? 24 : 7;
  araña.rect(x, 46, 1, 1, 'neutro-6');
  araña.linea(x, 43, x, 47, 'neutro-6');
  araña.rect(x - 1, 48, 3, 3, 'azul-oficina-1');
  araña.px(x, 49, 'rojo-3');
  araña.px(x - 2, 47, 'azul-oficina-1');
  araña.px(x + 2, 47, 'azul-oficina-1');
  araña.px(x - 2, 51, 'azul-oficina-1');
  araña.px(x + 2, 51, 'azul-oficina-1');
  araña.contorno('azul-oficina-0');
  return l.pegar(araña, 0, 0);
}

// ---------------------------------------------------------------------------
// Esqueleto
// ---------------------------------------------------------------------------

/** Esqueleto de pie, de frente, con calavera grande y simpática. 32 x 56, pies en la fila 50. */
export function dibujarEsqueleto(): Lienzo {
  const l = new Lienzo(32, 56);
  const o = 1;
  const y = (n: number): number => n + o;
  // Piernas y pies: más cortas que el torso, como en los muñecos de Gather.
  for (const x of [12, 18]) {
    l.rect(x, y(40), 2, 8, HUESO[1]);
    l.rect(x, y(40), 1, 8, HUESO[3]);
    l.rect(x - 1, y(43), 4, 2, HUESO[2]);
    l.px(x - 1, y(43), HUESO[3]);
    l.rect(x - 2, y(48), 6, 2, HUESO[2]);
    l.rect(x - 2, y(48), 6, 1, HUESO[3]);
    l.px(x + 3, y(49), HUESO[0]);
  }
  // Pelvis.
  l.rect(10, y(36), 12, 1, HUESO[2]);
  l.rect(11, y(37), 10, 2, HUESO[1]);
  l.rect(13, y(39), 6, 1, HUESO[1]);
  l.rect(10, y(36), 12, 1, HUESO[3]);
  l.px(13, y(37), 'azul-oficina-2');
  l.px(18, y(37), 'azul-oficina-2');
  // Columna y costillas: las barras de hueso con aire entre ellas.
  l.rect(15, y(21), 2, 15, HUESO[1]);
  l.rect(15, y(21), 1, 15, HUESO[3]);
  [[23, 6], [26, 6], [29, 5], [32, 4]].forEach(([fy, mitad]) => {
    l.rect(16 - (mitad as number), y(fy as number), 2 * (mitad as number), 2, HUESO[2]);
    l.rect(16 - (mitad as number), y(fy as number), 2 * (mitad as number), 1, HUESO[3]);
    l.rect(16 - (mitad as number), y(fy as number), 2, 2, HUESO[3]);
    l.rect(14 + (mitad as number), y(fy as number), 2, 2, HUESO[1]);
  });
  // Clavículas.
  l.rect(9, y(21), 14, 2, HUESO[2]);
  l.rect(9, y(21), 14, 1, HUESO[3]);
  l.rect(21, y(22), 2, 1, HUESO[1]);
  // Brazos: hueso del hombro al codo, antebrazo y mano.
  for (const lado of [-1, 1]) {
    const x0 = lado < 0 ? 7 : 23;
    const luz = lado < 0 ? HUESO[3] : HUESO[2];
    const med = lado < 0 ? HUESO[2] : HUESO[1];
    l.rect(x0, y(22), 3, 3, med);
    l.rect(x0, y(22), 1, 3, luz);
    l.rect(x0 + 1, y(25), 1, 6, med);
    l.rect(x0, y(25), 1, 6, luz);
    l.rect(x0 - 1, y(30), 4, 2, med);
    l.rect(x0 - 1, y(30), 4, 1, luz);
    l.rect(x0 + (lado < 0 ? 0 : 1), y(32), 1, 6, med);
    l.rect(x0 + (lado < 0 ? -1 : 0), y(32), 1, 6, luz);
    // Mano con tres dedos.
    l.rect(x0 - 1, y(38), 4, 2, med);
    l.rect(x0 - 1, y(38), 4, 1, luz);
    l.px(x0 - 1, y(40), med);
    l.px(x0 + 1, y(40), med);
  }
  // Calavera: cráneo redondo, mandíbula ancha con dientes, cuencas, nariz.
  const craneo = (px: number, py: number): boolean => enElipse(px, py, 15.5, y(10), 8, 7);
  volumen(l, 15.5, y(10), 8.5, 7.5, craneo, [HUESO[0], HUESO[1], HUESO[2], HUESO[3]], [0.4, 0.66, 0.9]);
  l.rect(10, y(16), 12, 4, HUESO[2]);
  l.rect(10, y(16), 2, 4, HUESO[3]);
  l.rect(20, y(16), 2, 4, HUESO[1]);
  l.rect(11, y(19), 10, 1, HUESO[1]);
  for (const x of [12, 15, 18]) l.px(x, y(18), 'azul-oficina-2');
  l.px(10, y(16), null);
  l.px(21, y(16), null);
  // Cuencas de los ojos y nariz.
  for (const x of [11, 17]) {
    l.rect(x, y(8), 4, 4, 'azul-oficina-0');
    l.rect(x + 1, y(12), 2, 1, 'azul-oficina-0');
    l.px(x, y(8), HUESO[2]);
    l.px(x + 3, y(8), HUESO[1]);
    l.px(x + 1, y(9), 'azul-oficina-3');
  }
  l.rect(15, y(13), 2, 2, 'azul-oficina-1');
  l.px(15, y(15), 'azul-oficina-1');
  l.px(16, y(15), 'azul-oficina-1');
  l.px(12, y(5), HUESO[3]);
  l.px(11, y(6), HUESO[3]);
  return cerrarSuelo(l, { contacto: [16, y(50), 10, 1], diagonales: true });
}

// ---------------------------------------------------------------------------
// Lápida
// ---------------------------------------------------------------------------

/** Lápida de piedra con cruz grabada, musgo y un montículo de tierra con pasto. 32 x 48, base en la fila 41. */
export function dibujarTumba(): Lienzo {
  const l = new Lienzo(32, 48);
  // Piedra: arco arriba y cuerpo recto hasta la base.
  const piedra = (x: number, y: number): boolean => (y >= 16 && x >= 7 && x <= 24 && y <= 38) || enElipse(x, y, 15.5, 16, 9, 8);
  for (let py = 6; py <= 38; py++) for (let px = 5; px <= 26; px++) if (piedra(px, py)) l.px(px, py, 'cemento-2');
  sombrearBordes(l, 'cemento-2', 'cemento-3', 'cemento-1', 0, 47, 2);
  // Sombra inferior de la piedra y lascas.
  l.rect(7, 36, 18, 3, 'cemento-1');
  l.rect(7, 36, 2, 3, 'cemento-2');
  // Cruz grabada: hundida, con la luz en el borde de abajo y a la derecha.
  l.rect(14, 13, 3, 14, 'cemento-0');
  l.rect(10, 17, 11, 3, 'cemento-0');
  l.rect(17, 14, 1, 13, 'cemento-3');
  l.rect(21, 18, 1, 3, 'cemento-3');
  l.rect(11, 20, 10, 1, 'cemento-3');
  l.rect(15, 27, 3, 1, 'cemento-3');
  // Grietas.
  for (const [x, y] of [[20, 26], [21, 27], [21, 28], [22, 29], [9, 29], [10, 30], [10, 31]] as const) pxSobre(l, x, y, 'cemento-0');
  // Musgo.
  for (const [x, y, w] of [[7, 11, 3], [8, 12, 4], [9, 13, 2], [20, 8, 3], [21, 9, 3], [8, 33, 5], [9, 34, 3]] as const) {
    l.rect(x, y, w, 1, 'planta-2');
    pxSobre(l, x, y, 'planta-3');
  }
  // Montículo de tierra delante de la base.
  l.elipseSombreada(16, 40, 13, 4, ['madera-oscura-1', 'madera-oscura-2', 'madera-oscura-3'], { umbrales: [0.34, 0.74] });
  for (const [x, y] of [[8, 38], [24, 39], [12, 43], [20, 43]] as const) pxSobre(l, x, y, 'madera-oscura-1');
  // Pasto sobre la tierra.
  for (const [x, y, h] of [[6, 39, 3], [8, 38, 2], [23, 38, 3], [25, 39, 2], [14, 43, 2], [19, 42, 2], [27, 41, 2]] as const) {
    l.rect(x, y - h + 1, 1, h, 'planta-3');
    l.px(x, y - h + 1, 'planta-4');
    l.px(x + 1, y, 'planta-2');
  }
  return cerrarSuelo(l, { contacto: [17, 41, 14, 2], diagonales: true });
}

// ---------------------------------------------------------------------------
// Caldero de bruja
// ---------------------------------------------------------------------------

/** Caldero negro de tres patas con brebaje verde que burbujea y gotea por el borde. 32 x 40, patas en la fila 36. */
export function dibujarCaldero(): Lienzo {
  const l = new Lienzo(32, 40);
  // Patas cortas.
  for (const [x, w] of [[6, 4], [22, 4], [14, 4]] as const) {
    l.rect(x, 33, w, 4, 'neutro-1');
    l.rect(x, 33, 1, 4, 'neutro-3');
    l.rect(x + w - 1, 33, 1, 4, 'neutro-0');
  }
  // Panza: esfera de hierro con luz arriba a la izquierda.
  l.elipseSombreada(16, 26, 12, 9, ['neutro-1', 'neutro-2', 'neutro-3', 'neutro-4'], { umbrales: [0.34, 0.66, 0.92] });
  // Asas laterales.
  for (const x of [2, 27]) {
    l.rect(x, 22, 3, 5, 'neutro-2');
    l.rect(x + 1, 23, 1, 3, null);
    l.px(x, 22, 'neutro-4');
  }
  // Borde y brebaje.
  l.elipse(16, 18, 12, 4, 'neutro-3');
  l.elipse(16, 18, 12, 4, 'neutro-4', { relleno: false });
  l.elipse(16, 19, 10, 3, 'planta-2');
  l.elipse(15, 18, 8, 2, 'planta-3');
  l.rect(9, 18, 7, 1, 'planta-4');
  l.rect(19, 19, 4, 1, 'planta-4');
  // Remolino y brillos del brebaje.
  for (const [x, y] of [[12, 17], [20, 17], [16, 20], [10, 19]] as const) l.px(x, y, 'neutro-7');
  // Gotas que se salen por el frente.
  for (const [x, y, h] of [[9, 22, 5], [21, 22, 7], [16, 23, 3]] as const) {
    l.rect(x, y, 2, h, 'planta-3');
    l.px(x, y, 'planta-4');
    l.rect(x, y + h - 1, 2, 1, 'planta-2');
  }
  // Remaches del casco.
  for (const [x, y] of [[8, 29], [13, 31], [19, 31], [24, 29]] as const) l.px(x, y, 'neutro-4');
  // Burbujas que suben.
  for (const [x, y, r] of [[12, 11, 2], [20, 7, 2], [17, 13, 1], [24, 12, 1], [9, 6, 1]] as const) {
    l.elipse(x, y, r, r, 'planta-4');
    l.px(x - 1, y - 1, 'neutro-7');
    if (r > 1) l.px(x + 1, y + 1, 'planta-3');
  }
  return cerrarSuelo(l, { contacto: [17, 36, 12, 1], diagonales: true });
}

// ---------------------------------------------------------------------------
// Fantasma colgante
// ---------------------------------------------------------------------------

/** Fantasma blanco colgado de un hilo, con ojos grandes, boca redonda y mejillas. Va en el aire. 32 x 48. */
export function dibujarFantasmaColgante(): Lienzo {
  const l = new Lienzo(32, 48);
  // Tres picos en el borde de abajo.
  const ondulado = (x: number): number => {
    const t = (x - 7) % 6;
    return 41 + (t === 2 || t === 3 ? 2 : t === 1 || t === 4 ? 1 : 0) - (x === 7 || x === 25 ? 1 : 0);
  };
  const cuerpo = (x: number, y: number): boolean => (y < 21 ? enElipse(x, y, 16, 21, 9, 7) : x >= 7 && x <= 25 && y <= ondulado(x));
  volumen(l, 15, 24, 11, 14, cuerpo, ['baldosa-gris-3', 'baldosa-gris-4', 'neutro-6', 'neutro-7'], [0.28, 0.5, 0.74]);
  // Brazos chicos.
  l.rect(4, 26, 4, 3, 'neutro-6');
  l.px(4, 26, 'neutro-7');
  l.rect(25, 24, 4, 3, 'baldosa-gris-4');
  l.px(28, 26, 'baldosa-gris-3');
  // Cara.
  for (const x of [11, 19]) {
    l.rect(x, 21, 3, 5, 'azul-oficina-0');
    l.px(x, 21, 'azul-oficina-2');
    l.px(x + 1, 22, 'neutro-7');
  }
  l.rect(15, 28, 3, 4, 'azul-oficina-0');
  l.px(15, 28, 'azul-oficina-2');
  l.px(9, 28, 'rojo-suave-4');
  l.px(10, 28, 'rojo-suave-4');
  l.px(22, 28, 'rojo-suave-3');
  l.px(23, 28, 'rojo-suave-3');
  // Hilo y gancho.
  l.rect(16, 0, 1, 14, 'neutro-5');
  l.rect(15, 12, 3, 2, 'neutro-4');
  l.px(16, 0, 'neutro-6');
  return cerrarSinSombra(l);
}

// ---------------------------------------------------------------------------
// Murciélagos
// ---------------------------------------------------------------------------

/** Un murciélago de frente con las alas abiertas: membrana morada con borde en festón, huesos claros y ojos amarillos. */
function murcielago(l: Lienzo, cx: number, cy: number, span: number): void {
  const f = span / 10;
  const p = (dx: number, dy: number, lado: -1 | 1): [number, number] => [Math.round(cx + lado * dx * f), Math.round(cy + dy * Math.max(0.7, f))];
  for (const lado of [-1, 1] as const) {
    const ala: Array<[number, number]> = [p(2, -1, lado), p(10, -4, lado), p(9.5, 2, lado), p(7.5, 0, lado), p(6.5, 4, lado), p(4.2, 1, lado), p(2.5, 4, lado)];
    poligono(l, ala, 'morado-0');
    // Huesos de los dedos, claros hacia la izquierda.
    const [hx, hy] = p(2, -1, lado);
    for (const [dx, dy] of [[10, -4], [9.5, 2], [6.5, 4]] as const) {
      const [ex, ey] = p(dx, dy, lado);
      l.linea(hx, hy, ex, ey, lado < 0 ? 'morado-2' : 'morado-1');
    }
  }
  // Cuerpo, cabeza y orejas.
  l.elipse(cx, cy + 1, 2, 3, 'azul-oficina-1');
  l.rect(cx - 2, cy - 4, 5, 4, 'azul-oficina-1');
  l.rect(cx - 2, cy - 4, 1, 4, 'morado-1');
  l.px(cx - 2, cy - 6, 'azul-oficina-1');
  l.px(cx - 2, cy - 5, 'azul-oficina-1');
  l.px(cx + 2, cy - 6, 'azul-oficina-1');
  l.px(cx + 2, cy - 5, 'azul-oficina-1');
  l.px(cx - 1, cy - 3, 'tela-calida-3');
  l.px(cx + 1, cy - 3, 'tela-calida-3');
}

/** Tres murciélagos volando por la pared: uno grande, uno mediano y uno chico. 64 x 32. */
export function dibujarMurcielagosS(): Lienzo {
  const l = new Lienzo(64, 32);
  murcielago(l, 17, 11, 12);
  murcielago(l, 44, 7, 9);
  murcielago(l, 54, 16, 6);
  return cerrarColgante(l);
}

/** Tres murciélagos pegados de canto a la tapa de una pared vertical. 32 x 64. */
export function dibujarMurcielagosLado(lado: 'E' | 'O'): Lienzo {
  const l = new Lienzo(32, 64);
  for (const y0 of [6, 26, 46]) {
    placaLateral(l, lado, y0, 8, 4, (i, j) => {
      if (j === 0) return i === 0 || i === 2 ? 'azul-oficina-1' : null;
      if (j === 1 || j === 2) return i <= 2 ? (j === 2 && i === 1 ? 'tela-calida-3' : 'azul-oficina-1') : null;
      if (j >= 3 && j <= 5) return j === 3 ? 'morado-1' : i === 3 ? 'morado-0' : 'morado-1';
      if (j === 6) return i === 0 || i === 3 ? 'morado-0' : null;
      return null;
    });
  }
  return cerrarColgante(l);
}

// ---------------------------------------------------------------------------
// Escoba de bruja
// ---------------------------------------------------------------------------

/** Escoba de bruja de pie: mango de madera con cinta morada y cerdas de paja atadas. 32 x 48, base en la fila 44. */
export function dibujarEscoba(): Lienzo {
  const l = new Lienzo(32, 48);
  const r = azar(61);
  // Cerdas: abanico de paja que se abre hacia abajo.
  for (let y = 28; y <= 44; y++) {
    const t = (y - 28) / 16;
    const mitad = 4 + Math.round(t * 7);
    for (let x = 16 - mitad; x < 16 + mitad; x++) {
      const u = (x - (16 - mitad)) / (2 * mitad);
      l.px(x, y, u < 0.3 ? 'tela-calida-3' : u < 0.72 ? 'tela-calida-2' : 'tela-calida-1');
    }
  }
  // Mechones: rayas oscuras y puntas desiguales abajo.
  for (const x of [11, 14, 17, 20]) {
    const y0 = 34 + entre(r, 0, 2);
    l.rect(x, y0, 1, 10 - (y0 - 34), 'tela-calida-0');
  }
  for (let x = 5; x <= 26; x += 3) {
    l.rect(x, 44, 2, 1 + entre(r, 0, 1), 'tela-calida-1');
  }
  // Mango.
  l.rect(15, 3, 3, 27, 'madera-clara-2');
  l.rect(15, 3, 1, 27, 'madera-clara-3');
  l.rect(17, 3, 1, 27, 'madera-clara-1');
  l.px(15, 3, null);
  l.px(17, 3, null);
  l.px(16, 8, 'madera-clara-1');
  l.px(16, 16, 'madera-clara-1');
  // Cintas: dos vueltas de atadura y un moño morado.
  l.rect(12, 28, 9, 2, 'madera-oscura-2');
  l.rect(12, 28, 9, 1, 'madera-oscura-3');
  l.rect(13, 31, 7, 1, 'madera-oscura-1');
  l.rect(14, 20, 5, 2, 'morado-2');
  l.rect(14, 20, 5, 1, 'morado-3');
  l.px(18, 21, 'morado-1');
  return cerrarSuelo(l, { contacto: [17, 44, 11, 1] });
}

// ---------------------------------------------------------------------------
// Árbol seco
// ---------------------------------------------------------------------------

/** Una rama: trazo cónico de `[x0, y0]` a `[x1, y1]`. */
function rama(l: Lienzo, x0: number, y0: number, x1: number, y1: number, w0: number, w1: number): void {
  trazo(l, x0, y0, x1, y1, w0, w1, 'madera-oscura-2');
}

/** Árbol seco y retorcido con un hueco que mira con dos ojos y un cuervo en una rama. 64 x 128, raíces en la fila 121. */
export function dibujarArbolSeco(): Lienzo {
  const l = new Lienzo(64, 128);
  // Raíces y tronco, curvado.
  rama(l, 22, 116, 28, 108, 5, 7);
  rama(l, 42, 116, 36, 108, 5, 7);
  rama(l, 32, 117, 32, 106, 9, 13);
  rama(l, 32, 112, 30, 96, 14, 12);
  rama(l, 30, 96, 31, 82, 12, 10);
  rama(l, 31, 82, 29, 70, 10, 9);
  // Ramas principales.
  rama(l, 30, 88, 15, 71, 7, 4);
  rama(l, 15, 71, 8, 56, 4, 2);
  rama(l, 15, 71, 20, 53, 4, 2);
  rama(l, 8, 56, 4, 46, 2, 2);
  rama(l, 8, 59, 2, 58, 2, 2);
  rama(l, 20, 53, 14, 40, 3, 2);
  rama(l, 20, 53, 27, 46, 3, 2);
  rama(l, 31, 80, 48, 64, 7, 4);
  rama(l, 48, 64, 56, 50, 4, 2);
  rama(l, 48, 64, 44, 46, 4, 2);
  rama(l, 56, 50, 59, 43, 2, 2);
  rama(l, 56, 55, 60, 56, 2, 2);
  rama(l, 44, 46, 38, 34, 3, 2);
  rama(l, 44, 46, 51, 38, 3, 2);
  rama(l, 29, 70, 26, 50, 8, 5);
  rama(l, 26, 50, 31, 32, 5, 3);
  rama(l, 31, 32, 28, 14, 3, 2);
  rama(l, 31, 32, 38, 20, 3, 2);
  rama(l, 38, 20, 40, 8, 2, 2);
  rama(l, 38, 20, 47, 14, 2, 2);
  rama(l, 28, 14, 22, 4, 2, 2);
  rama(l, 26, 50, 18, 34, 3, 2);
  rama(l, 18, 34, 12, 26, 2, 2);
  rama(l, 18, 34, 22, 22, 2, 2);
  sombrearBordes(l, 'madera-oscura-2', 'madera-oscura-3', 'madera-oscura-1', 0, 127, 1);
  // Corteza: grietas verticales del tronco.
  const r = azar(7);
  for (let i = 0; i < 16; i++) {
    const x = 26 + entre(r, 0, 12);
    const y = 76 + entre(r, 0, 38);
    for (let k = 0; k < entre(r, 3, 7); k++) pxSobre(l, x, y + k, 'madera-oscura-1');
  }
  for (const [x, y] of [[27, 100], [28, 101], [27, 88], [28, 89], [27, 78]] as const) pxSobre(l, x, y, 'madera-oscura-3');
  // Hueco con ojos que brillan.
  l.elipse(31, 98, 3, 5, 'azul-oficina-0');
  l.px(29, 96, 'tela-calida-3');
  l.px(29, 97, 'tela-calida-2');
  l.px(33, 96, 'tela-calida-3');
  l.px(33, 97, 'tela-calida-2');
  // Cuervo posado en la rama derecha.
  const cx = 52;
  const cy = 55;
  l.elipse(cx, cy, 4, 3, 'azul-oficina-1');
  l.elipse(cx - 4, cy - 3, 2, 2, 'azul-oficina-1');
  l.px(cx - 7, cy - 3, 'tela-calida-2');
  l.px(cx - 6, cy - 3, 'tela-calida-3');
  l.px(cx - 5, cy - 4, 'neutro-7');
  l.rect(cx + 3, cy + 1, 4, 2, 'azul-oficina-1');
  l.px(cx - 3, cy - 1, 'azul-oficina-3');
  l.px(cx - 1, cy - 1, 'azul-oficina-2');
  l.rect(cx - 1, cy + 3, 1, 2, 'tela-calida-1');
  l.rect(cx + 1, cy + 3, 1, 2, 'tela-calida-1');
  // Hojas secas que quedan en las puntas.
  for (const [x, y] of [[4, 47], [14, 40], [40, 9], [58, 43], [47, 15], [22, 5]] as const) {
    l.rect(x, y, 2, 2, 'naranja-2');
    l.px(x, y, 'naranja-3');
  }
  return cerrarSuelo(l, { contacto: [33, 118, 16, 3], diagonales: true });
}

// ---------------------------------------------------------------------------
// Bowl de dulces
// ---------------------------------------------------------------------------

/** Un dulce envuelto con las puntas torcidas, horizontal. */
function dulce(l: Lienzo, x: number, y: number, c: string, claro: string, oscuro: string): void {
  conBorde(l, oscuro, (p) => {
    p.rect(x + 1, y, 3, 3, c);
    p.px(x + 1, y, claro);
    p.px(x, y, claro);
    p.px(x, y + 2, claro);
    p.px(x + 4, y, c);
    p.px(x + 4, y + 2, c);
    p.px(x + 3, y + 2, oscuro);
  });
}

/** Bowl con forma de calabaza lleno de dulces envueltos de colores. Va sobre una mesa: base en la fila 15. */
export function dibujarBowlDulces(): Lienzo {
  const l = new Lienzo(32, 32);
  // Dulces amontonados detrás del borde.
  const dulces: Array<[number, number, string, string, string]> = [
    [8, 5, 'rojo-3', 'rojo-4', 'rojo-1'],
    [14, 2, 'tela-calida-2', 'tela-calida-3', 'tela-calida-0'],
    [20, 5, 'vidrio-1', 'vidrio-2', 'vidrio-0'],
    [11, 6, 'morado-2', 'morado-3', 'morado-0'],
    [17, 6, 'planta-3', 'planta-4', 'planta-1'],
    [6, 8, 'vidrio-1', 'vidrio-2', 'vidrio-0'],
    [22, 8, 'rojo-3', 'rojo-4', 'rojo-1'],
  ];
  for (const [x, y, c, claro, oscuro] of dulces) dulce(l, x, y, c, claro, oscuro);
  // Cuerpo del bowl: calabaza baja con luz a la izquierda.
  const cuerpo = (x: number, y: number): boolean => y >= 9 && y <= B && enElipse(x, y, 15.5, 9, 10, 6.5);
  volumen(l, 15.5, 9, 10.5, 7, cuerpo, ['naranja-1', 'naranja-2', 'naranja-3', 'naranja-4'], [0.3, 0.58, 0.86]);
  l.rect(6, 9, 20, 1, 'naranja-3');
  l.rect(7, 9, 4, 1, 'naranja-4');
  l.rect(15, 10, 1, 5, 'naranja-1');
  l.rect(20, 10, 1, 4, 'naranja-1');
  l.rect(10, 11, 1, 3, 'naranja-1');
  // Sonrisa tallada.
  l.rect(11, 12, 10, 1, 'naranja-0');
  l.rect(12, 13, 8, 1, 'naranja-0');
  l.px(10, 11, 'naranja-0');
  l.px(21, 11, 'naranja-0');
  l.px(14, 12, 'tela-calida-3');
  l.px(17, 12, 'tela-calida-3');
  quitar(l, [6, B], [25, B]);
  return cerrarApoyado(l, { diagonales: true });
}

// ---------------------------------------------------------------------------
// Registro
// ---------------------------------------------------------------------------

export function cuadrosHalloween(): Cuadros {
  const c: Cuadros = new Map();
  registrar(c, 'calabaza-grande', 'U', dibujarCalabazaGrande());
  registrar(c, 'telarana', 'S', dibujarTelaranaS());
  registrar(c, 'telarana', 'E', dibujarTelaranaLado('E'));
  registrar(c, 'telarana', 'O', dibujarTelaranaLado('O'));
  registrar(c, 'esqueleto', 'U', dibujarEsqueleto());
  registrar(c, 'tumba', 'U', dibujarTumba());
  registrar(c, 'caldero', 'U', dibujarCaldero());
  registrar(c, 'fantasma-colgante', 'U', dibujarFantasmaColgante());
  registrar(c, 'murcielagos', 'S', dibujarMurcielagosS());
  registrar(c, 'murcielagos', 'E', dibujarMurcielagosLado('E'));
  registrar(c, 'murcielagos', 'O', dibujarMurcielagosLado('O'));
  registrar(c, 'escoba', 'U', dibujarEscoba());
  registrar(c, 'arbol-seco', 'U', dibujarArbolSeco());
  registrar(c, 'bowl-dulces', 'U', dibujarBowlDulces());
  return c;
}

// Evita avisos de importaciones que solo se usan en otras colecciones.
void tonos;
void cuadricula;
