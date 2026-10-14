/**
 * Lote 10, deportes y juegos (16 objetos) y piezas de temporada que faltaban (10 objetos): Halloween, Navidad y Pascua.
 * Los balones se sombrean como esferas. La mesa de ping pong y el futbolín ya existían (`mesa-pingpong`, `futbolin`).
 */

import { Lienzo } from '../nucleo';
import type { ColorEntrada } from '../nucleo';
import { CONTORNO } from './l4-comun';
import {
  AZ, CE, CM, CR, CU, ME, MO, NA, NE, PL, RO, RS, TC, VI, WC, WO,
  apoyado, azar, bloque, hex, nuevo, pie, pieA, registrarR, rp, suelo, sueloLibre, tn,
} from './l10-comun';
import type { Cuadros } from './l10-comun';
import { cestaBase } from './l10-piezas';

// ---------------------------------------------------------------------------
// Pelotas y balones
// ---------------------------------------------------------------------------

const esfera = (l: Lienzo, cx: number, cy: number, r: number, tonos: readonly ColorEntrada[]): void => {
  l.elipseSombreada(cx, cy, r, r, tonos);
};

/** Un balón en el piso: cuerpo sombreado y una mancha de contacto. */
function balon(r: number, tonos: readonly ColorEntrada[], marcas: (l: Lienzo, cx: number, cy: number) => void): Lienzo {
  const l = nuevo(0);
  const cy = 28 - r;
  esfera(l, 15, cy, r, tonos);
  marcas(l, 15, cy);
  return suelo(l, 15, 28, r - 1);
}

function pelotaBeisbol(): Lienzo {
  return balon(5, tn('neutro', 4, 7), (l, cx, cy) => {
    for (const dy of [-3, -1, 1, 3]) {
      l.px(cx - 4 + Math.abs(dy) / 2, cy + dy, RS(2));
      l.px(cx + 4 - Math.abs(dy) / 2, cy + dy, RS(1));
    }
    l.px(cx - 3, cy - 2, RS(3));
    l.px(cx + 3, cy + 2, RS(3));
  });
}

function balonBaloncesto(): Lienzo {
  return balon(8, tn('naranja', 0, 3), (l, cx, cy) => {
    l.rect(cx - 7, cy, 15, 1, NE(1));
    l.rect(cx, cy - 7, 1, 15, NE(1));
    l.linea(cx - 5, cy - 5, cx - 2, cy, NE(1));
    l.linea(cx - 2, cy, cx - 5, cy + 5, NE(1));
    l.linea(cx + 5, cy - 5, cx + 2, cy, NE(1));
    l.linea(cx + 2, cy, cx + 5, cy + 5, NE(1));
    l.px(cx - 4, cy - 3, NA(4));
  });
}

function balonVoleibol(): Lienzo {
  return balon(8, tn('neutro', 4, 7), (l, cx, cy) => {
    l.linea(cx - 7, cy - 2, cx, cy - 4, VI(2));
    l.linea(cx, cy - 4, cx + 6, cy + 1, VI(1));
    l.linea(cx - 6, cy + 3, cx, cy + 1, TC(2));
    l.linea(cx, cy + 1, cx + 4, cy + 6, TC(2));
    l.linea(cx - 2, cy - 7, cx - 3, cy + 6, VI(2));
    l.rect(cx - 5, cy - 4, 3, 2, TC(3));
    l.rect(cx + 2, cy + 3, 3, 2, VI(2));
  });
}

function balonAmericano(): Lienzo {
  const l = nuevo(0);
  l.elipseSombreada(15, 20, 10, 6, tn('cuero', 0, 3), { angulo: -18 });
  l.linea(10, 22, 20, 17, NE(7));
  l.linea(10, 24, 20, 19, NE(7));
  l.linea(12, 19, 18, 21, NE(7));
  l.linea(14, 18, 15, 22, NE(7));
  l.linea(16, 17, 17, 21, NE(7));
  l.px(9, 21, NE(5));
  return suelo(l, 15, 28, 8);
}

function pelotaCriquet(): Lienzo {
  return balon(5, tn('rojo', 0, 3), (l, cx, cy) => {
    l.linea(cx - 4, cy - 1, cx + 4, cy - 1, NE(7));
    l.linea(cx - 4, cy + 1, cx + 4, cy + 1, NE(7));
    for (let x = cx - 3; x <= cx + 3; x += 2) l.px(x, cy, NE(5));
  });
}

function pelotaTenis(): Lienzo {
  return balon(5, tn('cesped', 0, 3), (l, cx, cy) => {
    l.linea(cx - 4, cy - 2, cx, cy, NE(7));
    l.linea(cx, cy, cx + 4, cy + 2, NE(7));
    l.px(cx - 3, cy - 3, CE(3));
  });
}

function balonPlaya(): Lienzo {
  const l = nuevo(0);
  const cx = 15;
  const cy = 20;
  const r = 8;
  const fuentes: readonly Lienzo[] = [
    new Lienzo(32, 32).elipseSombreada(cx, cy, r, r, tn('rojo-suave', 0, 3)),
    new Lienzo(32, 32).elipseSombreada(cx, cy, r, r, tn('neutro', 4, 7)),
    new Lienzo(32, 32).elipseSombreada(cx, cy, r, r, tn('tela-calida', 0, 3)),
  ];
  for (let y = cy - r; y <= cy + r; y++) {
    for (let x = cx - r; x <= cx + r; x++) {
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      if (dx * dx + dy * dy > (r + 0.5) ** 2) continue;
      const ancho = Math.sqrt(Math.max(0.2, 1 - (dy / (r + 0.5)) ** 2));
      const lon = Math.asin(Math.max(-1, Math.min(1, dx / ((r + 0.5) * ancho))));
      const banda = Math.floor(((lon / Math.PI) + 0.5) * 6);
      const fuente = fuentes[[0, 1, 2, 0, 1, 2][Math.max(0, Math.min(5, banda))] as number] as Lienzo;
      const hex = fuente.leerHex(x, y);
      if (hex !== null) l.px(x, y, hex);
    }
  }
  l.rect(cx - 1, cy - r, 3, 1, NE(7));
  return suelo(l, 15, 28, 7);
}

// ---------------------------------------------------------------------------
// Palos, raqueta y tablas
// ---------------------------------------------------------------------------

function raquetaTenis(): Lienzo {
  const l = nuevo(8);
  const yb = pie(l);
  // Tirada en el piso: cabeza ovalada con las cuerdas y mango largo hacia abajo a la izquierda.
  l.linea(14, yb - 5, 5, yb - 1, WO(2));
  l.linea(14, yb - 6, 5, yb - 2, WO(3));
  l.rect(3, yb - 3, 4, 3, NE(1));
  l.elipse(20, yb - 11, 9, 7, RS(3), { angulo: -22 });
  l.elipse(20, yb - 11, 8, 6, NE(6), { angulo: -22 });
  l.elipse(20, yb - 11, 7, 5, NE(7), { angulo: -22 });
  for (let x = 14; x <= 26; x += 3) l.linea(x, yb - 17, x - 3, yb - 5, NE(5));
  for (let y = yb - 15; y <= yb - 7; y += 3) l.linea(13, y + 3, 27, y - 4, NE(5));
  l.elipse(20, yb - 11, 9, 7, RS(3), { angulo: -22, relleno: false });
  l.linea(13, yb - 8, 15, yb - 6, RS(2));
  return suelo(l, 15, yb, 9);
}

function boladeGolf(): Lienzo {
  const l = nuevo(24);
  const yb = pie(l);
  // Palos que asoman, bolsa con bolsillos y la correa, y las dos patitas del soporte.
  for (const [x1, y1, cabeza] of [[8, 4, 'hierro'], [14, 2, 'madera'], [20, 5, 'hierro'], [24, 8, 'hierro']] as const) {
    l.linea(15, 20, x1, y1 + 3, ME(3));
    if (cabeza === 'madera') l.elipseSombreada(x1, y1, 3, 2, tn('madera-oscura', 1, 4));
    else l.rect(x1 - 1, y1, 4, 3, ME(2));
  }
  l.rect(10, 18, 11, 2, NE(1));
  bloque(l, 8, 19, 15, yb - 19 - 3, (n) => RS(n), true);
  l.rect(9, 22, 13, 1, NE(7));
  l.rect(10, 30, 11, 8, RS(1));
  l.rect(10, 30, 11, 1, RS(3));
  l.rect(12, 34, 7, 1, NE(7));
  l.linea(8, 22, 6, 36, CU(1));
  l.rect(9, yb - 3, 4, 4, ME(1));
  l.rect(18, yb - 3, 4, 4, ME(0));
  return suelo(l, 15, yb, 8);
}

function paloGolf(): Lienzo {
  const l = nuevo(8);
  const yb = pie(l);
  l.linea(5, yb - 2, 24, yb - 12, ME(3));
  l.linea(5, yb - 3, 24, yb - 13, ME(2));
  l.linea(4, yb - 1, 8, yb - 3, NE(1));
  l.linea(4, yb - 2, 8, yb - 4, NE(2));
  l.rect(24, yb - 15, 5, 5, ME(2));
  l.rect(24, yb - 15, 5, 1, ME(3));
  l.rect(27, yb - 14, 2, 4, ME(1));
  return suelo(l, 15, yb, 9);
}

function paloHockey(): Lienzo {
  const l = nuevo(8);
  const yb = pie(l);
  l.linea(6, yb - 18, 22, yb - 6, WC(3));
  l.linea(6, yb - 19, 22, yb - 7, WC(2));
  l.rect(5, yb - 20, 3, 4, NE(1));
  l.rect(21, yb - 8, 8, 5, WC(2));
  l.rect(21, yb - 8, 8, 1, WC(4));
  l.rect(21, yb - 4, 8, 1, WC(0));
  l.rect(23, yb - 8, 2, 5, NE(7));
  l.rect(27, yb - 8, 2, 5, NE(5));
  return suelo(l, 15, yb, 9);
}

function bateBeisbol(): Lienzo {
  const l = nuevo(8);
  const yb = pie(l);
  // Barril grueso que se afina hacia el mango con cinta.
  l.linea(5, yb - 3, 12, yb - 6, NE(1));
  l.linea(5, yb - 4, 12, yb - 7, NE(2));
  l.linea(12, yb - 6, 18, yb - 9, WC(2));
  l.linea(12, yb - 7, 18, yb - 10, WC(3));
  l.linea(12, yb - 5, 18, yb - 8, WC(1));
  l.linea(18, yb - 9, 27, yb - 15, WC(2));
  l.linea(18, yb - 10, 27, yb - 16, WC(3));
  l.linea(18, yb - 8, 27, yb - 14, WC(2));
  l.linea(19, yb - 7, 26, yb - 12, WC(1));
  l.linea(19, yb - 12, 26, yb - 17, WC(4));
  l.rect(26, yb - 17, 3, 4, WC(2));
  return suelo(l, 15, yb, 9);
}

function tablaSurf(): Lienzo {
  const l = nuevo(32);
  const yb = pie(l);
  // Apoyada en diagonal: casco amarillo con dos rayas y la aleta.
  l.elipseSombreada(16, yb - 25, 7, 26, tn('tela-calida', 0, 3), { angulo: 10 });
  l.linea(20, 8, 12, yb - 8, NE(7));
  l.linea(21, 9, 13, yb - 7, NE(6));
  l.linea(17, 9, 9, yb - 9, VI(2));
  l.rect(10, yb - 3, 4, 3, ME(1));
  l.rect(10, yb - 3, 1, 3, ME(2));
  return suelo(l, 14, yb, 6);
}

function tablaSurfSoporte(): Lienzo {
  const l = nuevo(32);
  const yb = pie(l);
  l.elipseSombreada(15, yb - 26, 6, 25, tn('tela-calida', 0, 3));
  l.rect(13, 8, 1, yb - 20, NE(7));
  l.rect(17, 8, 1, yb - 20, VI(2));
  // Soporte de madera: dos travesaños, base y patas.
  l.rect(5, yb - 33, 21, 2, WC(3));
  l.rect(5, yb - 33, 21, 1, WC(4));
  l.rect(5, yb - 14, 21, 2, WC(3));
  l.rect(5, yb - 14, 21, 1, WC(4));
  for (const x of [5, 24]) l.rect(x, yb - 33, 2, 33, WC(2));
  l.rect(5, yb - 33, 1, 33, WC(3));
  l.rect(4, yb - 2, 24, 3, WC(2));
  l.rect(4, yb - 2, 24, 1, WC(3));
  return suelo(l, 15, yb, 11);
}

// ---------------------------------------------------------------------------
// Pared de escalada y aro de croquet
// ---------------------------------------------------------------------------

function paredEscalada(): Lienzo {
  const l = nuevo(32, 2);
  const yb = pie(l);
  // Tablero con agarres de colores, travesaño de arriba, colchoneta azul abajo.
  l.rect(5, 4, 54, yb - 10, CM(2));
  l.rect(5, 4, 54, 1, CM(3));
  l.rect(5, 4, 1, yb - 10, CM(3));
  l.rect(58, 4, 1, yb - 10, CM(0));
  const az = azar(21);
  const colores: readonly (readonly [ColorEntrada, ColorEntrada])[] = [[RS(3), RS(1)], [VI(2), VI(0)], [TC(3), TC(1)], [PL(3), PL(1)], [NA(3), NA(1)], [MO(3), MO(1)]];
  for (let i = 0; i < 26; i++) {
    const x = 8 + Math.floor(az() * 48);
    const y = 8 + Math.floor(az() * (yb - 22));
    const [claro, oscuro] = colores[i % colores.length] as readonly [ColorEntrada, ColorEntrada];
    l.rect(x, y, 4, 3, claro);
    l.rect(x, y + 2, 4, 1, oscuro);
    l.px(x + 3, y, oscuro);
  }
  l.rect(3, 2, 58, 3, ME(2));
  l.rect(3, 2, 58, 1, ME(3));
  bloque(l, 3, yb - 7, 58, 8, (n) => VI(n), true);
  l.rect(4, yb - 7, 56, 1, VI(3));
  return suelo(l, 32, yb, 26);
}

function aroCroquet(): Lienzo {
  const l = nuevo(0);
  // Aro de metal clavado en el pasto, con franjas de color.
  l.rect(6, 25, 3, 3, ME(1));
  l.rect(22, 25, 3, 3, ME(1));
  l.rect(6, 12, 2, 13, ME(3));
  l.rect(23, 12, 2, 13, ME(2));
  l.rect(9, 7, 13, 2, ME(3));
  l.linea(7, 12, 9, 7, ME(3));
  l.linea(24, 12, 22, 7, ME(2));
  l.rect(6, 19, 2, 4, RS(3));
  l.rect(23, 19, 2, 4, RS(2));
  l.rect(12, 7, 7, 2, RS(3));
  l.elipse(15, 28, 12, 1, CE(1));
  return suelo(l, 15, 28, 10);
}

// ---------------------------------------------------------------------------
// Temporada
// ---------------------------------------------------------------------------

function calavera(): Lienzo {
  const l = nuevo(0);
  const fb = pieA(0);
  l.elipseSombreada(15, fb - 7, 7, 6, tn('neutro', 4, 7));
  l.rect(10, fb - 3, 11, 4, NE(6));
  l.rect(10, fb - 3, 3, 4, NE(7));
  l.rect(20, fb - 3, 1, 4, NE(4));
  l.rect(11, fb - 8, 3, 3, NE(1));
  l.rect(17, fb - 8, 3, 3, NE(1));
  l.px(15, fb - 5, NE(2));
  l.px(14, fb - 4, NE(2));
  l.px(16, fb - 4, NE(2));
  for (const x of [12, 14, 16, 18]) l.px(x, fb - 1, NE(3));
  return apoyado(l);
}

function ataudTenebroso(): Lienzo {
  const l = nuevo(32);
  const yb = pie(l);
  // Ataúd hexagonal de pie, con la tapa entreabierta y una cruz.
  const filas: ReadonlyArray<readonly [number, number]> = [[12, 8], [10, 12], [8, 16], [7, 18], [8, 16], [9, 14], [10, 12], [11, 10]];
  const alto = yb - 4;
  for (let y = 4; y <= yb; y++) {
    const f = filas[Math.min(filas.length - 1, Math.floor(((y - 4) / alto) * filas.length))] as readonly [number, number];
    l.rect(f[0] + 2, y, f[1], 1, WO(2));
    l.px(f[0] + 2, y, WO(3));
    l.px(f[0] + 1 + f[1], y, WO(1));
  }
  l.rect(14, 12, 4, 14, WO(4));
  l.rect(11, 16, 10, 4, WO(4));
  l.rect(15, 13, 2, 12, NE(5));
  l.rect(12, 17, 8, 2, NE(5));
  // Rendija oscura por donde asoma una mano.
  l.rect(22, 30, 3, 14, NE(0));
  l.rect(24, 34, 4, 3, NE(7));
  l.rect(26, 34, 2, 1, NE(5));
  return suelo(l, 15, yb, 8);
}

function mesaBruja(): Lienzo {
  const l = nuevo(16);
  const yb = pie(l);
  // Mesa redonda con mantel morado hasta el piso, y encima caldero, frascos y una vela.
  l.elipseSombreada(15, yb - 8, 12, 12, tn('morado', 0, 3));
  l.rect(5, yb - 12, 21, 1, MO(1));
  l.elipse(15, yb - 17, 11, 4, MO(3));
  l.elipse(15, yb - 18, 9, 2, MO(4));
  l.elipseSombreada(11, yb - 22, 4, 4, tn('neutro', 0, 3));
  l.rect(8, yb - 25, 7, 2, NE(2));
  l.elipse(11, yb - 25, 3, 1, PL(4));
  l.rect(18, yb - 28, 3, 7, PL(3));
  l.rect(18, yb - 28, 1, 7, NE(7));
  l.rect(19, yb - 30, 1, 2, WO(2));
  l.rect(22, yb - 24, 3, 5, MO(3));
  l.rect(23, yb - 26, 1, 2, WO(2));
  l.rect(14, yb - 21, 2, 4, CR(4));
  l.px(14, yb - 23, TC(3));
  l.px(14, yb - 22, TC(2));
  return suelo(l, 15, yb, 11);
}

function cubetaDulces(): Lienzo {
  const l = nuevo(0);
  const fb = pieA(0);
  // Calabaza de plástico con la cara, el asa negra y dulces que asoman.
  l.linea(8, fb - 7, 11, fb - 13, NE(1));
  l.linea(23, fb - 7, 20, fb - 13, NE(1));
  l.linea(11, fb - 13, 20, fb - 13, NE(1));
  for (const [x, c] of [[11, RS(3)], [15, VI(2)], [19, TC(3)]] as const) l.rect(x, fb - 10, 3, 2, c);
  l.elipseSombreada(15, fb - 4, 9, 6, tn('naranja', 0, 3));
  l.rect(9, fb - 10, 13, 1, NA(1));
  l.rect(11, fb - 6, 3, 2, NE(1));
  l.rect(17, fb - 6, 3, 2, NE(1));
  l.rect(12, fb - 2, 7, 1, NE(1));
  l.px(13, fb - 3, NE(1));
  l.px(18, fb - 3, NE(1));
  return apoyado(l);
}

/** Cascanueces: soldado de madera con sombrero alto, barba, casaca roja y botas. `h` es la altura total. */
function cascanueces(l: Lienzo, yb: number, h: number): void {
  const w = h > 50 ? 20 : 14;
  const x0 = 15 - Math.floor(w / 2);
  const f = (p: number): number => Math.round(h * p);
  // Botas y pantalón.
  l.rect(x0 + 1, yb - f(0.1), w - 2, f(0.1) + 1, NE(1));
  l.rect(x0 + 1, yb - f(0.1), w - 2, 1, NE(3));
  l.rect(x0 + 2, yb - f(0.3), w - 4, f(0.2), NE(7));
  l.rect(x0 + 2, yb - f(0.3), 1, f(0.2), NE(6));
  l.rect(15, yb - f(0.28), 1, f(0.18), NE(4));
  // Casaca roja con botones, cinturón y brazos.
  l.rect(x0, yb - f(0.62), w, f(0.32), RO(2));
  l.rect(x0, yb - f(0.62), 2, f(0.32), RO(3));
  l.rect(x0 + w - 2, yb - f(0.62), 2, f(0.32), RO(1));
  l.rect(x0, yb - f(0.4), w, 2, NE(1));
  l.rect(14, yb - f(0.4), 3, 2, TC(3));
  for (let y = yb - f(0.6); y < yb - f(0.42); y += 3) l.px(15, y, TC(3));
  l.rect(x0 - 1, yb - f(0.6), 2, f(0.22), RO(1));
  l.rect(x0 + w - 1, yb - f(0.6), 2, f(0.22), RO(1));
  l.rect(x0, yb - f(0.63), w, 2, TC(3));
  // Cabeza con barba blanca, nariz y mejillas.
  const cy = yb - f(0.74);
  l.rect(x0 + 2, cy - f(0.1), w - 4, f(0.16), CU(4));
  l.rect(x0 + 2, cy - f(0.1), 2, f(0.16), CU(4));
  l.rect(x0 + 3, cy + f(0.03), w - 6, f(0.09), NE(7));
  l.rect(x0 + 3, cy + f(0.03), 1, f(0.09), NE(6));
  l.px(15, cy, CU(3));
  l.px(x0 + 3, cy - 1, NE(1));
  l.px(x0 + w - 4, cy - 1, NE(1));
  l.rect(x0 + 3, cy + 1, 2, 1, RS(3));
  l.rect(x0 + w - 5, cy + 1, 2, 1, RS(3));
  // Sombrero alto con ala dorada.
  l.rect(x0 + 1, cy - f(0.14), w - 2, 2, TC(2));
  l.rect(x0 + 2, yb - h + 1, w - 4, f(0.2), NE(1));
  l.rect(x0 + 2, yb - h + 1, 2, f(0.2), NE(3));
  l.rect(x0 + 2, yb - h + f(0.14), w - 4, 2, TC(3));
  l.rect(14, yb - h - 1, 3, 2, TC(3));
}

function cascanuecesChico(): Lienzo {
  const l = nuevo(16);
  const yb = pie(l);
  cascanueces(l, yb, 38);
  return suelo(l, 15, yb, 7);
}

function cascanuecesGigante(): Lienzo {
  const l = nuevo(48);
  const yb = pie(l);
  cascanueces(l, yb, 70);
  return suelo(l, 15, yb, 10);
}

function cartelPoloNorte(nevado: boolean): Lienzo {
  const l = nuevo(24);
  const yb = pie(l);
  // Poste con rayas de bastón de caramelo, dos tablas con flecha y una estrella arriba.
  for (let y = 6; y <= yb; y++) {
    const c = Math.floor((y - 6) / 3) % 2 === 0 ? RS(3) : NE(7);
    l.rect(14, y, 3, 1, c);
    l.px(16, y, c === NE(7) ? NE(5) : RS(1));
  }
  const tablas: ReadonlyArray<readonly [number, number, number]> = [[3, 8, 1], [6, 18, -1]];
  for (const [x, y, dir] of tablas) {
    l.rect(x, y, 22, 6, WC(2));
    l.rect(x, y, 22, 1, WC(4));
    l.rect(x, y + 5, 22, 1, WC(0));
    if (dir > 0) {
      l.linea(x + 22, y, x + 26, y + 3, WC(2));
      l.linea(x + 22, y + 5, x + 26, y + 3, WC(2));
    } else {
      l.linea(x, y, x - 3, y + 3, WC(2));
      l.linea(x, y + 5, x - 3, y + 3, WC(2));
    }
    l.rect(x + 3, y + 2, 14, 1, NE(7));
    l.rect(x + 5, y + 4, 9, 1, NE(5));
    if (nevado) {
      l.rect(x, y - 1, 22, 2, NE(7));
      l.rect(x + 2, y + 1, 5, 1, NE(7));
      l.rect(x + 14, y + 1, 4, 1, NE(7));
    }
  }
  l.elipse(15, 4, 3, 3, TC(3));
  l.px(15, 3, CR(4));
  if (nevado) {
    l.elipse(15, yb - 1, 9, 3, NE(7));
    l.rect(7, yb - 1, 17, 2, NE(6));
  } else {
    l.rect(12, yb - 2, 8, 3, WC(1));
  }
  return suelo(l, 15, yb, 9);
}

function regaloGigante(): Lienzo {
  const l = nuevo(16);
  const yb = pie(l);
  // Caja con la tapa y el moño de cinta blanca.
  bloque(l, 4, yb - 20, 24, 21, (n) => RO(n), false);
  l.rect(4, yb - 20, 24, 6, RO(3));
  l.rect(4, yb - 20, 24, 1, RO(4));
  l.rect(4, yb - 15, 24, 1, RO(1));
  l.rect(14, yb - 20, 4, 21, NE(7));
  l.rect(14, yb - 20, 1, 21, NE(6));
  l.rect(17, yb - 20, 1, 21, NE(5));
  l.rect(4, yb - 10, 24, 3, NE(7));
  l.rect(4, yb - 8, 24, 1, NE(5));
  l.elipse(10, yb - 24, 5, 4, NE(7));
  l.elipse(22, yb - 24, 5, 4, NE(6));
  l.elipse(10, yb - 24, 2, 2, RO(2));
  l.elipse(22, yb - 24, 2, 2, RO(1));
  l.rect(13, yb - 25, 6, 4, NE(7));
  l.rect(14, yb - 24, 1, 3, NE(5));
  return suelo(l, 15, yb, 13);
}

function canastaPascua(): Lienzo {
  const l = nuevo(0);
  const fb = pieA(0);
  // Pasto, huevos de colores con franjas y el asa.
  for (let x = 8; x < 24; x += 2) l.rect(x, fb - 11 - (x % 4 === 0 ? 1 : 0), 1, 3, CE(3));
  l.elipseSombreada(10, fb - 9, 3, 4, tn('rojo-suave', 0, 3));
  l.elipseSombreada(15, fb - 10, 3, 4, tn('vidrio', 0, 3));
  l.elipseSombreada(21, fb - 9, 3, 4, tn('tela-calida', 0, 3));
  l.rect(8, fb - 9, 5, 1, NE(7));
  l.rect(13, fb - 10, 5, 1, NE(7));
  l.rect(19, fb - 8, 5, 1, MO(3));
  cestaBase(l, fb, 22, true);
  l.rect(6, fb - 8, 20, 2, CE(2));
  return apoyado(l);
}

// ---------------------------------------------------------------------------

type Hacer = () => Lienzo;
const SIN = undefined;

export function cuadrosDeportes10(): Cuadros {
  const c: Cuadros = new Map();
  const u: ReadonlyArray<readonly [string, Hacer, readonly string[] | undefined]> = [
    ['raqueta-tenis', raquetaTenis, SIN],
    ['bolsa-golf', boladeGolf, SIN],
    ['palo-golf', paloGolf, SIN],
    ['palo-hockey', paloHockey, SIN],
    ['bate-beisbol', bateBeisbol, SIN],
    ['pelota-beisbol', pelotaBeisbol, SIN],
    ['balon-baloncesto', balonBaloncesto, SIN],
    ['balon-voleibol', balonVoleibol, SIN],
    ['balon-americano', balonAmericano, SIN],
    ['pelota-criquet', pelotaCriquet, SIN],
    ['pelota-tenis', pelotaTenis, SIN],
    ['balon-playa', balonPlaya, hex('rojo-suave')],
    ['tabla-surf', tablaSurf, hex('tela-calida')],
    ['tabla-surf-soporte', tablaSurfSoporte, hex('tela-calida')],
    ['pared-escalada', paredEscalada, SIN],
    ['aro-croquet', aroCroquet, SIN],
    ['calavera', calavera, SIN],
    ['ataud-tenebroso', ataudTenebroso, SIN],
    ['mesa-de-bruja', mesaBruja, SIN],
    ['cubeta-dulces', cubetaDulces, hex('naranja')],
    ['cascanueces', cascanuecesChico, SIN],
    ['cascanueces-gigante', cascanuecesGigante, SIN],
    ['cartel-polo-norte', () => cartelPoloNorte(false), SIN],
    ['cartel-polo-norte-nevado', () => cartelPoloNorte(true), SIN],
    ['regalo-gigante', regaloGigante, hex('rojo')],
    ['canasta-pascua', canastaPascua, SIN],
  ];
  for (const [id, hacer, desde] of u) registrarR(c, id, 'U', hacer(), desde);
  return c;
}

void AZ; void CM; void CR; void rp; void sueloLibre; void CONTORNO; void WO; void WC;
