/**
 * Exterior del lote 2B: banca de parque, mesa de terraza, sombrilla, jardinera, árbol, fuente, bicicletero y cerca.
 *
 * Madera clara para lo que está a la intemperie (bancas, mesas, cercas), hierro oscuro en los herrajes, piedra de
 * `cemento` en la fuente y hojas de `planta`. La sombrilla va sobre las personas, sin sombra proyectada.
 */

import { Lienzo, rampa } from '../nucleo';
import { azar, construirCategoria, dentroElipse, entre, oscuridadBajo, poste, registrar, registrarVariantes, terminar, vetas } from './l2b-comun';
import type { Constructores, Cuadros } from './l2b-comun';

const HOJAS = ['planta-1', 'planta-2', 'planta-3', 'planta-4'] as const;
const HIERRO = ['azul-oficina-3', 'azul-oficina-2', 'azul-oficina-1'] as const;
const COPA = ['hoja-pastel-1', 'hoja-pastel-2', 'cesped-2', 'cesped-3'] as const;

// ---------------------------------------------------------------------------
// Banca de parque
// ---------------------------------------------------------------------------

/** Listón de madera clara visto de frente: brillo arriba, medio, sombra abajo y una veta corta. */
function liston(l: Lienzo, x: number, y: number, ancho: number, alto: number, semilla: number): void {
  l.rect(x, y, ancho, alto, 'madera-clara-3');
  l.rect(x, y, ancho, 1, 'madera-clara-4');
  l.rect(x, y + alto - 1, ancho, 1, 'madera-clara-2');
  l.rect(x, y + 1, 1, alto - 1, 'madera-clara-4');
  vetas(l, x + 2, y + 1, ancho - 4, Math.max(1, alto - 2), semilla, 'madera-clara-2', 'madera-clara-4', Math.max(2, Math.round(ancho / 14)));
}

/** Extremo de hierro fundido de una banca, de frente: poste del respaldo, brazo con voluta y pata hasta el suelo. `x` es su borde izquierdo. */
function extremoBanca(l: Lienzo, x: number, izquierdo: boolean): void {
  // Poste del respaldo hasta la altura del brazo y pata delantera hasta el suelo.
  poste(l, x, 2, 24, 4, HIERRO);
  poste(l, x, 24, 5, 4, HIERRO);
  // Brazo: barra horizontal con voluta que sobresale hacia afuera.
  const xb = izquierdo ? x - 2 : x;
  l.rect(xb, 13, 6, 2, 'neutro-2');
  l.rect(xb, 13, 6, 1, 'neutro-3');
  l.rect(izquierdo ? x - 2 : x + 4, 12, 2, 4, 'neutro-2');
  l.px(izquierdo ? x - 2 : x + 5, 12, 'neutro-3');
  // Pie.
  l.rect(x - 1, 28, 6, 1, 'neutro-1');
}

/** Banca de parque vista de frente: respaldo vertical de tres listones, asiento de dos y extremos de hierro fundido. */
export function dibujarBancaExteriorS(): Lienzo {
  const l = new Lienzo(64, 32);
  // Respaldo: plano vertical, un tono más oscuro que el asiento, con tres listones y su separación.
  for (const [y, semilla] of [[2, 7001], [6, 7002], [10, 7003]] as const) {
    l.rect(8, y, 48, 3, 'madera-clara-2');
    l.rect(8, y, 48, 1, 'madera-clara-3');
    l.rect(8, y + 2, 48, 1, 'madera-clara-1');
    vetas(l, 10, y + 1, 44, 1, semilla, 'madera-clara-1', 'madera-clara-3', 4);
  }
  // Hueco oscuro entre el respaldo y el asiento: lo que tapa el respaldo.
  l.rect(8, 13, 48, 3, 'madera-clara-0');
  // Asiento: dos listones vistos desde arriba, claros, y el canto del delantero.
  liston(l, 8, 15, 48, 4, 7004);
  liston(l, 8, 20, 48, 3, 7005);
  l.rect(8, 19, 48, 1, 'madera-clara-1');
  l.rect(8, 23, 48, 2, 'madera-clara-2');
  l.rect(8, 24, 48, 1, 'madera-clara-1');
  extremoBanca(l, 4, true);
  extremoBanca(l, 56, false);
  l.contorno('azul-oficina-0');
  oscuridadBajo(l, 12, 26, 40, 3);
  return l.sombraProyectada('azul-oficina-2', 2, 2, { patron: 'degradado' });
}

/** Banca girada: el respaldo queda al oeste, el asiento al este y los extremos de hierro a norte y sur. */
export function dibujarBancaExteriorLado(lado: 'E' | 'O'): Lienzo {
  const l = new Lienzo(32, 64);
  const este = lado === 'E';
  const xr = este ? 4 : 19;
  const xa = este ? 10 : 6;
  // Respaldo: tres listones largos de canto.
  for (const [dx, semilla] of [[0, 7101], [2, 7102]] as const) {
    l.rect(xr + dx, 5, 2, 50, 'madera-clara-3');
    l.rect(xr + dx, 5, 1, 50, 'madera-clara-4');
    vetas(l, xr + dx, 8, 2, 44, semilla, 'madera-clara-2', 'madera-clara-4', 5);
  }
  l.rect(xr + 4, 5, 3, 50, 'madera-clara-2');
  l.rect(xr + 4, 5, 1, 50, 'madera-clara-3');
  l.rect(xr + 6, 5, 1, 50, 'madera-clara-1');
  // Asiento: listones largos vistos desde arriba.
  for (const [dx, semilla] of [[0, 7103], [5, 7104], [10, 7105]] as const) {
    l.rect(xa + dx, 5, 4, 50, 'madera-clara-3');
    l.rect(xa + dx, 5, 1, 50, 'madera-clara-4');
    l.rect(xa + dx + 3, 6, 1, 49, 'madera-clara-2');
    vetas(l, xa + dx + 1, 8, 2, 44, semilla, 'madera-clara-2', 'madera-clara-4', 5);
  }
  // Extremos de hierro: brazos arriba y abajo, y el frente de la pata al sur.
  for (const y of [2, 52]) {
    l.rect(3, y, 25, 3, 'neutro-2');
    l.rect(3, y, 25, 1, 'neutro-3');
    l.rect(3, y + 2, 25, 1, 'neutro-1');
  }
  for (const x of [4, 22]) poste(l, x, 55, 6, 4, HIERRO);
  l.rect(3, 61, 6, 1, 'neutro-1');
  l.rect(21, 61, 6, 1, 'neutro-1');
  l.contorno('azul-oficina-0');
  oscuridadBajo(l, 8, 62, 16, 1);
  return l.sombraProyectada('azul-oficina-2', 2, 2, { patron: 'degradado' });
}

// ---------------------------------------------------------------------------
// Mesa de terraza
// ---------------------------------------------------------------------------

/** Mesa redonda de bistró: tapa de listones de madera clara, canto grueso, pie de hierro y base redonda. */
export function dibujarMesaTerraza(): Lienzo {
  const l = new Lienzo(32, 32);
  // Base redonda y pie.
  l.elipse(15.5, 27, 8, 2, 'metal-2');
  l.elipse(15.5, 26, 7, 1, 'metal-3');
  l.rect(14, 18, 4, 9, 'metal-2');
  l.rect(14, 18, 1, 9, 'metal-3');
  l.rect(17, 18, 1, 9, 'metal-1');
  // Tapa: canto y cara superior.
  l.elipse(15.5, 13, 12, 5, 'madera-clara-2');
  l.elipse(15.5, 11, 12, 5, 'madera-clara-3');
  for (const y of [8, 10, 12, 14]) {
    for (let x = 3; x < 29; x++) if (dentroElipse(x, y, 15.5, 11, 11, 4)) l.px(x, y, 'madera-clara-2');
  }
  for (let x = 4; x < 28; x++) {
    if (dentroElipse(x, 7, 15.5, 11, 11, 4) && x < 16) l.px(x, 7, 'madera-clara-4');
  }
  l.rect(7, 9, 5, 1, 'madera-clara-4');
  l.rect(15, 13, 6, 1, 'madera-clara-4');
  // Aro del canto, más oscuro abajo.
  for (let x = 4; x < 28; x++) {
    for (let y = 12; y < 17; y++) {
      if (dentroElipse(x, y, 15.5, 13, 12, 5) && !dentroElipse(x, y, 15.5, 11, 12, 5)) l.px(x, y, x < 12 ? 'madera-clara-2' : 'madera-clara-1');
    }
  }
  return terminar(l);
}

// ---------------------------------------------------------------------------
// Sombrilla
// ---------------------------------------------------------------------------

const GAJOS = 6;

/**
 * Sombrilla de terraza vista desde arriba y de frente: un cono achatado de seis gajos que alternan dos telas, con
 * un volado de picos en el borde, el asta y una base de piedra. Va sobre las personas, sin sombra proyectada.
 * El color A es `tela-calida` y el B `pared-calida`: las variantes cambian el A.
 */
export function dibujarSombrilla(): Lienzo {
  const l = new Lienzo(64, 80);
  const cx = 31.5;
  const cy = 28;
  const rx = 30;
  const ry = 10;
  const ax = cx;
  const ay = 6;
  // Asta y base de piedra.
  l.elipse(31.5, 66, 10, 3, 'cemento-2');
  l.elipse(31.5, 65, 9, 2, 'cemento-3');
  l.rect(27, 64, 9, 1, 'cemento-1');
  poste(l, 30, 36, 28, 3, ['metal-3', 'metal-2', 'metal-1']);
  // Tonos por gajo: los de la derecha (k bajo) en sombra y los de la izquierda iluminados.
  const tono = (k: number): number => (k <= 1 ? 1 : k <= 3 ? 2 : 3);
  const telaA = rampa('tela-calida');
  const telaB = rampa('pared-calida');
  const colorGajo = (k: number, delta = 0): string => {
    const t = Math.max(0, tono(k) + delta);
    return (k % 2 === 0 ? telaA : telaB)[t] ?? '#000000';
  };
  const rim = (phi: number): [number, number] => [cx + rx * Math.cos(phi), cy + ry * Math.sin(phi)];
  // Volado: un festón por gajo bajo el borde, con el tono del gajo un paso más oscuro.
  for (let k = 0; k < GAJOS; k++) {
    const [x0] = rim((k * Math.PI) / GAJOS);
    const [x1] = rim(((k + 1) * Math.PI) / GAJOS);
    const [xm, ym] = rim(((k + 0.5) * Math.PI) / GAJOS);
    l.elipse(xm, ym + 1, Math.max(3, Math.abs(x0 - x1) / 2), 3, colorGajo(k, -1));
  }
  // Cono: cada píxel toma el gajo del rayo que va del vértice al borde.
  for (let y = 0; y < 48; y++) {
    for (let x = 0; x < 64; x++) {
      const px = x + 0.5;
      const py = y + 0.5;
      const triangulo = py >= ay && py <= cy && Math.abs(px - ax) <= ((py - ay) / (cy - ay)) * rx;
      const abajo = py > cy && dentroElipse(x, y, cx, cy, rx, ry);
      if (!triangulo && !abajo) continue;
      const dx = px - ax;
      const dy = py - ay;
      const a = (dx / rx) ** 2 + (dy / ry) ** 2;
      const b = 2 * (((ax - cx) * dx) / (rx * rx) + ((ay - cy) * dy) / (ry * ry));
      const c = ((ax - cx) / rx) ** 2 + ((ay - cy) / ry) ** 2 - 1;
      const disc = b * b - 4 * a * c;
      if (disc < 0) continue;
      const t = (-b + Math.sqrt(disc)) / (2 * a);
      const phi = Math.atan2((ay + t * dy - cy) / ry, (ax + t * dx - cx) / rx);
      const k = Math.min(GAJOS - 1, Math.max(0, Math.floor((phi / Math.PI) * GAJOS)));
      l.px(x, y, colorGajo(k));
    }
  }
  // Remate y varillas.
  l.rect(30, 1, 3, 5, 'metal-3');
  l.rect(31, 0, 1, 2, 'metal-2');
  l.rect(32, 2, 1, 4, 'metal-1');
  for (let k = 1; k < GAJOS; k++) {
    const [rx2, ry2] = rim((k * Math.PI) / GAJOS);
    l.linea(ax, ay + 1, Math.round(rx2), Math.round(ry2), colorGajo(k, -1));
  }
  return terminar(l, { sombra: false });
}

// ---------------------------------------------------------------------------
// Jardinera
// ---------------------------------------------------------------------------

/** Una mata frondosa: tres elipses de hojas con luz arriba a la izquierda. */
function mata(l: Lienzo, x: number, y: number, rx: number, ry: number): void {
  l.elipseSombreada(x, y, rx, ry, HOJAS);
  l.elipseSombreada(x - Math.round(rx * 0.5), y + 1, Math.round(rx * 0.6), Math.round(ry * 0.7), HOJAS);
  l.elipseSombreada(x + Math.round(rx * 0.5), y + 2, Math.round(rx * 0.55), Math.round(ry * 0.65), HOJAS);
}

/** Flores de 2 x 2 repartidas sobre el follaje. */
function flores(l: Lienzo, semilla: number, x0: number, y0: number, ancho: number, alto: number, cantidad: number): void {
  const r = azar(semilla);
  const colores: Array<[string, string]> = [['rojo-3', 'rojo-4'], ['tela-calida-2', 'tela-calida-3'], ['neutro-6', 'neutro-7']];
  for (let i = 0; i < cantidad; i++) {
    const x = x0 + entre(r, 0, ancho - 2);
    const y = y0 + entre(r, 0, alto - 2);
    if (!l.esOpaco(x, y) || !l.esOpaco(x + 1, y + 1)) continue;
    const [c, claro] = colores[i % colores.length] ?? colores[0]!;
    l.rect(x, y, 2, 2, c);
    l.px(x, y, claro);
  }
}

/** Jardinera larga de madera con tres capas de tablas, arbustos frondosos y flores rojas, amarillas y blancas. */
export function dibujarJardineraS(): Lienzo {
  const l = new Lienzo(64, 40);
  // Follaje, de atrás hacia adelante.
  for (const [x, y, rx, ry] of [[10, 14, 9, 7], [31, 11, 11, 8], [53, 14, 9, 7], [21, 16, 8, 6], [43, 16, 8, 6]] as const) mata(l, x, y, rx, ry);
  flores(l, 7201, 4, 4, 56, 16, 14);
  // Caja de tablas: labio, tres tablas y zócalo.
  l.rect(2, 19, 60, 3, 'cuero-3');
  l.rect(2, 19, 60, 1, 'cuero-4');
  l.rect(2, 21, 60, 1, 'cuero-2');
  for (const y of [22, 26, 30]) {
    l.rect(2, y, 60, 4, 'cuero-2');
    l.rect(2, y, 60, 1, 'cuero-3');
    l.rect(2, y + 3, 60, 1, 'cuero-1');
    vetas(l, 5, y + 1, 54, 2, 7210 + y, 'cuero-1', 'cuero-3', 5);
  }
  l.rect(2, 22, 3, 12, 'cuero-3');
  l.rect(59, 22, 3, 12, 'cuero-1');
  l.rect(2, 34, 60, 2, 'cuero-1');
  return terminar(l);
}

/** Jardinera girada: desde arriba se ven el follaje a lo largo de la caja y, al sur, el frente de las tablas. */
export function dibujarJardineraLado(lado: 'E' | 'O'): Lienzo {
  const l = new Lienzo(32, 72);
  const este = lado === 'E';
  // Tierra y follaje a lo largo.
  l.rect(3, 8, 26, 50, 'cuero-1');
  for (const [x, y, rx, ry] of [[16, 14, 9, 7], [14, 30, 10, 8], [17, 46, 10, 8], [10, 22, 7, 6], [22, 38, 7, 6]] as const) mata(l, x, y, rx, ry);
  flores(l, 7301, 5, 8, 22, 50, 12);
  // Costados de madera: el del lado iluminado (oeste) más claro.
  l.rect(3, 8, 3, 50, este ? 'cuero-3' : 'cuero-3');
  l.rect(26, 8, 3, 50, 'cuero-1');
  l.rect(3, 8, 1, 50, 'cuero-4');
  // Frente (extremo sur) con sus tres tablas.
  const y0 = 56;
  l.rect(2, y0, 28, 3, 'cuero-3');
  l.rect(2, y0, 28, 1, 'cuero-4');
  for (const y of [y0 + 3, y0 + 7]) {
    l.rect(2, y, 28, 4, 'cuero-2');
    l.rect(2, y, 28, 1, 'cuero-3');
    l.rect(2, y + 3, 28, 1, 'cuero-1');
  }
  l.rect(2, y0 + 3, 3, 8, 'cuero-3');
  l.rect(27, y0 + 3, 3, 8, 'cuero-1');
  l.rect(2, y0 + 11, 28, 2, 'cuero-1');
  return terminar(l);
}

// ---------------------------------------------------------------------------
// Árbol
// ---------------------------------------------------------------------------

/** Árbol grande: tronco con raíces, copa de nueve masas de hojas con luz arriba a la izquierda y sombra en el suelo. */
export function dibujarArbol(): Lienzo {
  const l = new Lienzo(64, 128);
  const r = azar(7401);
  // Tronco: más ancho en la base, con corteza y raíces.
  for (let y = 70; y < 122; y++) {
    const w = 5 + Math.round(Math.max(0, y - 100) / 5);
    l.rect(32 - w, y, 2 * w, 1, 'cuero-2');
    l.rect(32 - w, y, Math.max(2, Math.floor(w / 2)), 1, 'cuero-3');
    l.rect(32 + w - Math.max(2, Math.floor(w * 0.6)), y, Math.max(2, Math.floor(w * 0.6)), 1, 'cuero-1');
  }
  l.rect(22, 118, 6, 5, 'cuero-2');
  l.rect(36, 118, 7, 5, 'cuero-1');
  l.rect(21, 122, 8, 2, 'cuero-1');
  l.rect(35, 122, 9, 2, 'cuero-1');
  for (let i = 0; i < 16; i++) {
    const x = 27 + entre(r, 0, 9);
    const y = 90 + entre(r, 0, 28);
    l.rect(x, y, 1, entre(r, 3, 6), i % 3 === 0 ? 'cuero-3' : 'cuero-1');
  }
  // Copa: masas de hojas de atrás hacia adelante.
  const masas: Array<[number, number, number, number]> = [
    [32, 42, 26, 22], [14, 46, 11, 10], [51, 46, 11, 10], [22, 32, 15, 13], [43, 30, 16, 14],
    [32, 20, 15, 12], [32, 52, 27, 17], [14, 62, 12, 10], [50, 63, 13, 10], [32, 66, 20, 11],
  ];
  l.elipse(32, 52, 29, 23, 'hoja-pastel-1');
  for (const [x, y, rx, ry] of masas) {
    l.elipseSombreada(x, y, rx, ry, COPA, { umbrales: [0.34, 0.6, 0.82] });
    // Hojas sueltas: trazos claros arriba a la izquierda y oscuros abajo a la derecha de cada masa.
    for (let i = 0; i < 9; i++) {
      const a = r() * Math.PI * 2;
      const d = 0.35 + r() * 0.55;
      const px = Math.round(x + Math.cos(a) * rx * d);
      const py = Math.round(y + Math.sin(a) * ry * d);
      const claro = Math.cos(a) + Math.sin(a) < -0.2;
      if (!l.esOpaco(px, py)) continue;
      l.rect(px, py, 2, 1, claro ? 'cesped-3' : 'hoja-pastel-0');
    }
  }
  l.contorno('azul-oficina-0');
  // Sombra en el suelo, hacia la derecha del tronco (la única sombra del árbol).
  const capa = new Lienzo(64, 128);
  capa.elipse(38, 124, 22, 3.5, 'neutro-2');
  const ruido = new Lienzo(64, 128);
  ruido.trama(0, 118, 64, 10, null, 'neutro-2', 'bayer50');
  ruido.pegar(capa, 0, 0, { modo: 'borrar' });
  l.pegar(capa, 0, 0, { modo: 'debajo' });
  return l;
}

// ---------------------------------------------------------------------------
// Fuente
// ---------------------------------------------------------------------------

/** Fuente de piedra de dos tazas: cuenco redondo con agua, columna central, taza alta y chorros que caen. */
export function dibujarFuente(): Lienzo {
  const l = new Lienzo(64, 72);
  const cx = 31.5;
  // Pared exterior del cuenco, con luz a la izquierda y sombra a la derecha.
  l.elipse(cx, 55, 30, 13, 'cemento-1');
  for (let y = 50; y < 69; y++) {
    for (let x = 1; x < 63; x++) {
      if (!dentroElipse(x, y, cx, 55, 30, 13) || dentroElipse(x, y, cx, 50, 30, 13)) continue;
      l.px(x, y, x < 16 ? 'cemento-2' : x > 48 ? 'cemento-0' : 'cemento-1');
    }
  }
  // Borde superior y agua.
  l.elipse(cx, 50, 30, 13, 'cemento-3');
  l.elipse(cx, 50, 25, 10, 'cemento-2');
  l.elipse(cx, 51, 24, 9, 'vidrio-1');
  l.elipse(cx, 50, 19, 6, 'vidrio-2');
  l.elipse(cx, 50, 19, 6, 'vidrio-1', { relleno: false });
  l.elipse(cx, 50, 12, 3, 'vidrio-1', { relleno: false });
  l.rect(12, 52, 6, 1, 'vidrio-3');
  l.rect(42, 49, 7, 1, 'vidrio-3');
  // Columna central y taza alta.
  poste(l, 28, 33, 17, 8, ['cemento-3', 'cemento-2', 'cemento-1']);
  l.elipse(cx, 46, 8, 3, 'cemento-2');
  l.elipse(cx, 45, 8, 2, 'cemento-3');
  l.elipse(cx, 32, 13, 4, 'cemento-1');
  for (let y = 32; y < 39; y++) {
    const w = Math.round(13 - (y - 32) * 1.3);
    l.rect(cx - w, y, 2 * w + 1, 1, y < 35 ? 'cemento-2' : 'cemento-1');
    l.rect(cx - w, y, Math.max(2, Math.floor(w / 3)), 1, 'cemento-3');
  }
  l.elipse(cx, 31, 13, 4, 'cemento-3');
  l.elipse(cx, 31.5, 11, 3, 'vidrio-2');
  l.elipse(cx, 31.5, 8, 1.5, 'vidrio-3');
  // Remate y chorros: uno que sube y cuatro cortinas de agua que caen al cuenco.
  l.rect(30, 22, 3, 8, 'cemento-2');
  l.rect(30, 22, 1, 8, 'cemento-3');
  l.rect(32, 22, 1, 8, 'cemento-1');
  l.elipse(cx, 21, 2, 2, 'cemento-3');
  l.rect(31, 10, 2, 11, 'vidrio-3');
  l.px(31, 10, 'neutro-7');
  l.linea(31, 13, 24, 29, 'vidrio-3');
  l.linea(32, 13, 39, 29, 'vidrio-3');
  l.linea(31, 16, 28, 29, 'neutro-7');
  l.linea(32, 16, 35, 29, 'neutro-7');
  for (const x of [20, 24, 39, 43]) {
    l.rect(x, 34, 2, 15, 'vidrio-2');
    l.rect(x, 34, 1, 15, 'vidrio-3');
    l.rect(x - 1, 48, 4, 2, 'neutro-7');
  }
  for (const [x, y] of [[26, 14], [37, 15], [22, 24], [41, 25]] as const) l.rect(x, y, 2, 2, 'neutro-7');
  return terminar(l);
}

// ---------------------------------------------------------------------------
// Bicicletero
// ---------------------------------------------------------------------------

/** Rueda de perfil: neumático oscuro de 2 px, llanta clara, dos radios cruzados y el cubo. */
function rueda(l: Lienzo, cx: number, cy: number): void {
  l.elipse(cx, cy, 5, 5, 'neutro-2');
  l.elipse(cx, cy, 3, 3, null);
  l.elipse(cx, cy, 3, 3, 'neutro-5', { relleno: false });
  l.linea(cx - 2, cy - 2, cx + 2, cy + 2, 'neutro-4');
  l.linea(cx + 2, cy - 2, cx - 2, cy + 2, 'neutro-4');
  l.rect(cx - 1, cy - 1, 2, 2, 'metal-3');
}

/** Bicicleta de perfil que mira a la derecha. `x0` es el borde izquierdo y `yg` la fila del suelo; `tonos` son sombra y luz del cuadro. */
function bicicleta(l: Lienzo, x0: number, yg: number, sombra: string, luz: string): void {
  rueda(l, x0 + 6, yg - 5);
  rueda(l, x0 + 22, yg - 5);
  const tubo = (xa: number, ya: number, xb: number, yb: number, c: string): void => void l.linea(x0 + xa, yg - ya, x0 + xb, yg - yb, c);
  tubo(12, 4, 9, 13, sombra);
  tubo(9, 13, 19, 12, luz);
  tubo(19, 11, 12, 4, sombra);
  tubo(12, 4, 6, 5, sombra);
  tubo(9, 13, 6, 5, luz);
  tubo(19, 12, 22, 5, 'metal-2');
  // Manillar, sillín y pedal.
  tubo(19, 12, 19, 15, 'neutro-3');
  l.rect(x0 + 19, yg - 16, 4, 1, 'neutro-1');
  l.rect(x0 + 7, yg - 15, 5, 2, 'neutro-1');
  l.rect(x0 + 7, yg - 15, 5, 1, 'neutro-3');
  l.rect(x0 + 11, yg - 4, 3, 1, 'neutro-2');
}

/** Bicicletero: riel bajo de metal con dos bicicletas de perfil, una roja y otra azul. */
export function dibujarBicicleteroS(): Lienzo {
  const l = new Lienzo(64, 32);
  bicicleta(l, 3, 26, 'rojo-2', 'rojo-3');
  bicicleta(l, 34, 26, 'vidrio-0', 'vidrio-1');
  // Riel con sus soportes entre las ruedas.
  l.rect(2, 27, 58, 2, 'metal-2');
  l.rect(2, 27, 58, 1, 'metal-3');
  l.rect(2, 28, 58, 1, 'metal-1');
  for (const x of [14, 31, 46]) l.rect(x, 24, 2, 3, 'metal-2');
  return terminar(l);
}

/** Bicicleta vista de frente: manillar, horquilla, rueda delgada, cuadro y el sillín que asoma por detrás. */
function biciDeFrente(l: Lienzo, cx: number, yg: number, sombra: string, luz: string): void {
  // Sillín detrás del cuadro y rueda trasera asomando.
  l.rect(cx - 3, yg - 19, 6, 2, 'neutro-1');
  l.rect(cx - 3, yg - 19, 6, 1, 'neutro-3');
  l.elipse(cx, yg - 6, 2, 6, 'neutro-4');
  // Rueda delantera: neumático oscuro y llanta clara.
  l.elipse(cx, yg - 6, 2, 6, 'neutro-2');
  l.rect(cx, yg - 10, 1, 9, 'neutro-5');
  l.px(cx - 1, yg - 7, 'neutro-4');
  l.px(cx + 1, yg - 5, 'neutro-4');
  // Horquilla, tubo de dirección y manillar con puños.
  l.rect(cx - 2, yg - 13, 1, 7, 'metal-2');
  l.rect(cx + 2, yg - 13, 1, 7, 'metal-1');
  l.rect(cx - 1, yg - 17, 3, 6, luz);
  l.rect(cx + 1, yg - 17, 1, 6, sombra);
  l.rect(cx - 7, yg - 18, 14, 1, 'neutro-1');
  l.rect(cx - 8, yg - 19, 2, 3, 'neutro-2');
  l.rect(cx + 6, yg - 19, 2, 3, 'neutro-2');
  l.rect(cx - 1, yg - 1, 3, 1, 'metal-3');
}

/** Bicicletero girado: dos bicicletas de frente, una detrás de otra, sobre un riel bajo. */
export function dibujarBicicleteroLado(lado: 'E' | 'O'): Lienzo {
  const l = new Lienzo(32, 64);
  const dx = lado === 'E' ? 0 : 1;
  biciDeFrente(l, 15 + dx, 30, 'rojo-2', 'rojo-3');
  biciDeFrente(l, 15 + dx, 62, 'vidrio-0', 'vidrio-1');
  l.rect(4, 4, 2, 56, 'metal-2');
  l.rect(4, 4, 1, 56, 'metal-3');
  l.rect(25, 4, 2, 56, 'metal-2');
  l.rect(26, 4, 1, 56, 'metal-1');
  return terminar(l);
}

// ---------------------------------------------------------------------------
// Registro
// ---------------------------------------------------------------------------

function variantesSombrilla(base: Lienzo): Record<string, Lienzo> {
  const a = rampa('tela-calida');
  const mapa = (destino: readonly string[]): Record<string, string> => Object.fromEntries(a.map((hex, i) => [hex, destino[i] ?? hex]));
  return {
    base,
    rojo: base.recolorear(mapa(rampa('rojo-suave').slice(0, 4))),
    blanco: base.recolorear(mapa(rampa('neutro').slice(4, 8))),
  };
}

const CONSTRUCTORES: Constructores = {
  'banca-exterior': (c) => {
    registrar(c, 'banca-exterior', 'S', dibujarBancaExteriorS());
    registrar(c, 'banca-exterior', 'E', dibujarBancaExteriorLado('E'));
  },
  'mesa-terraza': (c) => registrar(c, 'mesa-terraza', 'U', dibujarMesaTerraza(), 'madera-clara'),
  sombrilla: (c) => registrarVariantes(c, 'sombrilla', 'U', variantesSombrilla(dibujarSombrilla())),
  jardinera: (c) => {
    registrar(c, 'jardinera', 'S', dibujarJardineraS());
    registrar(c, 'jardinera', 'E', dibujarJardineraLado('E'));
  },
  arbol: (c) => registrar(c, 'arbol', 'U', dibujarArbol()),
  fuente: (c) => registrar(c, 'fuente', 'U', dibujarFuente()),
  bicicletero: (c) => {
    registrar(c, 'bicicletero', 'S', dibujarBicicleteroS());
    registrar(c, 'bicicletero', 'E', dibujarBicicleteroLado('E'));
  },
};

/** Todos los cuadros de la categoría exterior que ya están dibujados. */
export function cuadrosExterior(): Cuadros {
  return construirCategoria(CONSTRUCTORES);
}
