/**
 * Lote 8, computadores del puesto (segunda parte): artista digital, diseño gráfico, hardware, músico, audiófilo,
 * computador de escritorio clásico, moderno y retro de los años 90. Todos son 2 x 1 apoyados con `sobresale: 24`
 * (cuadro de 64 x 56) y solo llevan la orientación `S`.
 *
 * Mismas reglas del molde (ver `l8-comun.ts` y `GUIA-ESTILO-GATHER-V2.md`): el borde de abajo del teclado queda en la fila
 * `pie(24)` (34), pantallas de frente y encendidas con contenido distinto, contorno azul marino de 1 px y luz arriba a la
 * izquierda. Cada equipo cambia la silueta, los colores de pantalla y los accesorios para que no se parezcan entre sí.
 */

import { Lienzo } from '../nucleo';
import type { ColorEntrada } from '../nucleo';
import {
  AZ,
  MT,
  NE,
  VI,
  alfombrilla,
  cerrarApoyado,
  monitor,
  monitorAngulado,
  pantallaDatos,
  pie,
  pieDeMonitor,
  registrar,
  tazaChica,
} from './l8-comun';
import type { Cuadros, Region } from './l8-comun';

// ---------------------------------------------------------------------------
// Rampas locales
// ---------------------------------------------------------------------------

/** Beige de los equipos de los años 90 (rampa `ladrillo-crema`: 0 sombra, 4 luz). */
const BE = (n: 0 | 1 | 2 | 3 | 4): ColorEntrada => `ladrillo-crema-${n}`;
const PL = (n: 0 | 1 | 2 | 3 | 4): ColorEntrada => `planta-${n}`;
const TC = (n: 0 | 1 | 2 | 3): ColorEntrada => `tela-calida-${n}`;
const RS = (n: 0 | 1 | 2 | 3 | 4): ColorEntrada => `rojo-suave-${n}`;
const NA = (n: 0 | 1 | 2 | 3 | 4): ColorEntrada => `naranja-${n}`;
const MO = (n: 0 | 1 | 2 | 3 | 4): ColorEntrada => `morado-${n}`;
const MD = (n: 0 | 1 | 2 | 3 | 4): ColorEntrada => `madera-oscura-${n}`;
const MC = (n: 0 | 1 | 2 | 3 | 4): ColorEntrada => `madera-clara-${n}`;

/** Colores que cambian entre los equipos: cuerpo, luz arriba a la izquierda y sombra abajo a la derecha. */
interface Tono {
  medio: ColorEntrada;
  luz: ColorEntrada;
  sombra: ColorEntrada;
  hondo: ColorEntrada;
}

const GRIS: Tono = { medio: NE(5), luz: NE(7), sombra: NE(3), hondo: NE(2) };
const CREMA: Tono = { medio: BE(2), luz: BE(4), sombra: BE(1), hondo: BE(0) };

/** Cuerpo con arista de luz arriba y a la izquierda, sombra a la derecha y abajo. */
function caja(l: Lienzo, x: number, y: number, w: number, h: number, t: Tono): void {
  l.rect(x, y, w, h, t.medio);
  l.rect(x, y, w, 1, t.luz);
  l.rect(x, y + 1, 1, h - 1, t.luz);
  l.rect(x + w - 1, y + 1, 1, h - 1, t.sombra);
  l.rect(x + 1, y + h - 1, w - 2, 1, t.sombra);
}

/** Repinta las cuatro esquinas de un rectángulo con `color`: redondea una pantalla de tubo. */
function esquinas(l: Lienzo, x: number, y: number, w: number, h: number, color: ColorEntrada): void {
  for (const [cx, cy, sx, sy] of [[x, y, 1, 1], [x + w - 1, y, -1, 1], [x, y + h - 1, 1, -1], [x + w - 1, y + h - 1, -1, -1]] as const) {
    l.px(cx, cy, color).px(cx + sx, cy, color).px(cx, cy + sy, color);
  }
}

/** Teclado grueso con los colores que se pidan (el de `l8-comun` fija los azules). */
function tecladoTono(l: Lienzo, x: number, y: number, ancho: number, t: Tono, tecla: ColorEntrada): void {
  l.rect(x, y, ancho, 9, t.medio);
  l.rect(x, y, ancho, 1, t.luz);
  l.rect(x, y + 1, 1, 7, t.luz);
  l.rect(x + ancho - 1, y + 1, 1, 8, t.sombra);
  l.rect(x, y + 8, ancho, 1, t.sombra);
  for (let fila = 0; fila < 3; fila++) {
    for (let i = 2; i < ancho - 2; i += 3) {
      l.rect(x + i, y + 1 + fila * 2, 2, 1, tecla);
      l.px(x + i, y + 2 + fila * 2, t.hondo);
    }
  }
  l.rect(x + 4, y + 7, ancho - 8, 1, tecla);
}

/** Ratón de 5 x 7 en el tono pedido, con el cable que sube hacia el computador. */
function ratonTono(l: Lienzo, x: number, y: number, t: Tono, cable: ColorEntrada = t.hondo): void {
  l.rect(x + 1, y, 3, 7, t.medio);
  l.rect(x, y + 1, 5, 5, t.medio);
  l.rect(x + 1, y, 3, 1, t.luz);
  l.px(x, y + 1, t.luz);
  l.rect(x + 2, y, 1, 3, t.sombra);
  l.rect(x + 4, y + 2, 1, 4, t.sombra);
  l.rect(x + 1, y + 6, 3, 1, t.sombra);
  l.px(x + 2, y - 1, cable);
  l.px(x + 2, y - 2, cable);
}

// ---------------------------------------------------------------------------
// Contenidos de pantalla propios
// ---------------------------------------------------------------------------

/** Lienzo de ilustración: barra de herramientas y un paisaje al atardecer. */
function pantallaIlustracion(l: Lienzo, r: Region): void {
  l.rect(r.x, r.y, r.ancho, r.alto, NE(7));
  l.rect(r.x, r.y, 3, r.alto, NE(6));
  const herramientas: readonly ColorEntrada[] = [RS(3), VI(2), TC(3), PL(3), MO(3)];
  herramientas.forEach((c, i) => l.px(r.x + 1, r.y + 1 + i * 3, c));
  const ax = r.x + 4;
  const ay = r.y + 1;
  const aw = r.ancho - 5;
  const ah = r.alto - 2;
  l.rect(ax, ay, aw, ah, VI(3));
  l.rect(ax, ay + 4, aw, 3, RS(4));
  l.rect(ax, ay + 7, aw, 3, NA(4));
  l.elipse(ax + aw - 7, ay + 7, 3, 3, TC(3));
  const base = ay + ah - 3;
  for (let i = 0; i < aw; i++) {
    const h = Math.max(0, 7 - Math.abs(i - 5), 5 - Math.abs(i - 14));
    if (h === 0) continue;
    l.rect(ax + i, base - h, 1, h + 3, MO(2));
    l.px(ax + i, base - h, MO(3));
  }
  l.rect(ax, base, aw, 3, PL(3));
  l.rect(ax, base, aw, 1, PL(4));
  // Cursor del pincel.
  l.px(ax + 9, ay + 2, NE(0)).px(ax + 10, ay + 3, NE(0));
}

/** Paneles del programa de ilustración: rueda de color, muestras y capas. */
function pantallaCapas(l: Lienzo, r: Region): void {
  l.rect(r.x, r.y, r.ancho, r.alto, NE(6));
  const rueda: readonly ColorEntrada[] = [RS(3), NA(3), TC(3), PL(3), VI(2), MO(3)];
  const cx = r.x + Math.floor(r.ancho / 2);
  const cy = r.y + 4;
  for (let dy = -3; dy <= 3; dy++) {
    for (let dx = -3; dx <= 3; dx++) {
      if (dx * dx + dy * dy > 10) continue;
      const giro = (Math.atan2(dy, dx) + Math.PI) / (2 * Math.PI);
      l.px(cx + dx, cy + dy, rueda[Math.min(5, Math.floor(giro * 6))] as ColorEntrada);
    }
  }
  l.px(cx, cy, NE(7));
  const muestras: readonly ColorEntrada[] = [RS(3), TC(3), PL(3), VI(2)];
  muestras.forEach((c, i) => l.rect(r.x + 1 + i * 3, r.y + 9, 2, 2, c));
  for (let k = 0; k < 2; k++) {
    const y = r.y + 12 + k * 2;
    l.rect(r.x + 1, y, r.ancho - 2, 2, k === 0 ? VI(1) : NE(7));
    l.px(r.x + 1, y, k === 0 ? NE(7) : MO(3));
    l.rect(r.x + 4, y, r.ancho - 6, 1, k === 0 ? VI(3) : NE(4));
  }
}

/** Composición de diseño: barra de herramientas, un cartel sobre la mesa de trabajo y paleta de color a la derecha. */
function pantallaComposicion(l: Lienzo, r: Region): void {
  l.rect(r.x, r.y, r.ancho, r.alto, NE(6));
  l.rect(r.x, r.y, 3, r.alto, NE(5));
  for (let i = 0; i < 5; i++) l.px(r.x + 1, r.y + 2 + i * 3, i % 2 === 0 ? AZ(2) : VI(1));
  const px = r.x + r.ancho - 9;
  l.rect(px, r.y, 9, r.alto, NE(5));
  const colores: readonly ColorEntrada[] = [RS(3), NA(3), TC(3), PL(3), VI(2), MO(3), RS(1), VI(0)];
  colores.forEach((c, i) => l.rect(px + 1 + (i % 2) * 4, r.y + 1 + Math.floor(i / 2) * 3, 3, 2, c));
  l.rect(px + 1, r.y + 13, 7, 2, NE(7));
  // Cartel: bloque de color, círculo, titular y foto.
  const ax = r.x + 5;
  const aw = px - ax - 2;
  l.rect(ax, r.y + 1, aw, r.alto - 2, NE(7));
  l.rect(ax, r.y + 1, aw, 7, VI(2));
  l.elipse(ax + aw - 5, r.y + 5, 3, 3, TC(3));
  l.rect(ax + 1, r.y + 3, 8, 3, RS(3));
  l.rect(ax + 1, r.y + 9, 11, 1, AZ(2));
  l.rect(ax + 1, r.y + 11, 7, 1, NE(4));
  l.rect(ax + 1, r.y + 13, 5, 1, NE(4));
  l.rect(ax + aw - 8, r.y + 10, 7, 4, PL(3));
  l.rect(ax + aw - 8, r.y + 10, 7, 1, PL(4));
  // Selección con sus tiradores.
  for (const [sx, sy] of [[ax, r.y + 1], [ax + 9, r.y + 1], [ax, r.y + 6], [ax + 9, r.y + 6]] as const) l.px(sx, sy, VI(1));
}

/** Forma de onda arriba y un esquema eléctrico abajo, sobre cuadrícula oscura. */
function pantallaEsquema(l: Lienzo, r: Region): void {
  l.rect(r.x, r.y, r.ancho, r.alto, AZ(0));
  for (let y = r.y + 2; y < r.y + r.alto; y += 4) for (let x = r.x + 2; x < r.x + r.ancho; x += 4) l.px(x, y, AZ(2));
  // Onda senoidal y una segunda onda cuadrada.
  const seno = (i: number): number => r.y + 4 + Math.round(Math.sin((i / (r.ancho - 2)) * Math.PI * 4) * 2.5);
  for (let i = 2; i < r.ancho - 1; i++) l.linea(r.x + i - 1, seno(i - 1), r.x + i, seno(i), PL(4));
  // Onda cuadrada debajo.
  for (let i = 1; i < r.ancho - 1; i++) {
    const alta = Math.floor(i / 5) % 2 === 0;
    l.px(r.x + i, r.y + (alta ? 8 : 10), TC(3));
    if (i % 5 === 0 && i > 1) l.px(r.x + i, r.y + 9, TC(3));
  }
  // Esquema: cable con resistencia en zigzag, condensador y una luz.
  const y = r.y + 12;
  l.rect(r.x + 1, y, r.ancho - 2, 1, VI(2));
  const zig = [0, -1, 1, -1, 1, 0];
  zig.forEach((d, i) => l.px(r.x + 4 + i, y + d, NA(3)));
  l.rect(r.x + 14, y - 2, 1, 5, NE(6));
  l.rect(r.x + 16, y - 2, 1, 5, NE(6));
  l.px(r.x + 15, y, AZ(0)).px(r.x + 20, y, RS(3)).px(r.x + 21, y, RS(3));
  l.px(r.x + 4, r.y + 14, VI(2)).px(r.x + 14, r.y + 14, VI(2));
}

/** Editor de audio: regla, una forma de onda grande y dos clips en pistas, con el cabezal de reproducción. */
function pantallaEditorAudio(l: Lienzo, r: Region): void {
  l.rect(r.x, r.y, r.ancho, r.alto, AZ(0));
  l.rect(r.x, r.y, r.ancho, 2, AZ(2));
  for (let i = 1; i < r.ancho; i += 3) l.px(r.x + i, r.y + 1, NE(5));
  // Onda grande en la pista de arriba.
  const alturas = [1, 2, 3, 2, 4, 5, 3, 2, 3, 4, 2, 1, 3, 5, 4, 2, 3, 2, 1, 2, 4, 3, 2, 1];
  for (let i = 0; i < r.ancho - 2; i++) {
    const h = alturas[i % alturas.length] as number;
    l.rect(r.x + 1 + i, r.y + 6 - h + 1, 1, h * 2 - 1, i % 7 === 3 ? TC(3) : VI(2));
  }
  // Dos pistas de clips.
  const clips: ReadonlyArray<readonly [number, number, number, ColorEntrada]> = [
    [1, 11, 10, MO(3)],
    [13, 11, 9, RS(3)],
    [1, 14, 7, PL(3)],
    [10, 14, 12, NA(3)],
  ];
  for (const [cx, cy, cw, color] of clips) {
    if (cx + cw > r.ancho) continue;
    l.rect(r.x + cx, r.y + cy, cw, 2, color);
    l.rect(r.x + cx, r.y + cy, cw, 1, NE(7));
  }
  // Cabezal.
  l.rect(r.x + 9, r.y + 2, 1, r.alto - 2, NE(7));
}

/** Reproductor de música: carátula de disco, título y barra de progreso, en tonos cálidos. */
function pantallaReproductor(l: Lienzo, r: Region): void {
  l.rect(r.x, r.y, r.ancho, r.alto, AZ(0));
  l.rect(r.x + 1, r.y + 1, 8, 8, NE(2));
  l.elipse(r.x + 4.5, r.y + 4.5, 3.5, 3.5, NE(0));
  l.elipse(r.x + 4.5, r.y + 4.5, 1.5, 1.5, TC(3));
  l.px(r.x + 1, r.y + 1, NE(4));
  l.rect(r.x + 11, r.y + 2, r.ancho - 13, 1, NE(6));
  l.rect(r.x + 11, r.y + 4, r.ancho - 16, 1, NE(4));
  l.rect(r.x + 1, r.y + r.alto - 3, r.ancho - 2, 1, NE(2));
  l.rect(r.x + 1, r.y + r.alto - 3, Math.floor(r.ancho * 0.55), 1, TC(3));
  for (let i = 0; i < 4; i++) l.rect(r.x + 11 + i * 2, r.y + 8 - ((i * 5) % 4), 1, 1 + ((i * 5) % 4), TC(2));
}

/** Fondo de pantalla abstracto: cielo claro con tres olas de color. */
function pantallaFondo(l: Lienzo, r: Region): void {
  l.rect(r.x, r.y, r.ancho, r.alto, VI(3));
  for (let i = 0; i < r.ancho; i++) {
    const a = r.y + 8 + Math.round(Math.sin(i / 4) * 2);
    const b = r.y + 11 + Math.round(Math.sin(i / 5 + 1.5) * 2);
    const c = r.y + 13 + Math.round(Math.sin(i / 6 + 3) * 1.5);
    l.rect(r.x + i, a, 1, r.alto - (a - r.y), VI(2));
    l.rect(r.x + i, b, 1, r.alto - (b - r.y), MO(3));
    l.rect(r.x + i, c, 1, r.alto - (c - r.y), RS(3));
  }
  l.elipse(r.x + 6, r.y + 4, 2, 2, TC(3));
}

/** Escritorio de ventanas de los años 90: fondo verde azulado, una ventana con título y un par de iconos. */
function pantallaVentanas(l: Lienzo, r: Region): void {
  l.rect(r.x, r.y, r.ancho, r.alto, 'hoja-pastel-1');
  l.rect(r.x + 1, r.y + 1, 2, 2, NE(7));
  l.rect(r.x + 1, r.y + 5, 2, 2, TC(3));
  l.rect(r.x + 6, r.y + 2, r.ancho - 8, r.alto - 6, NE(6));
  l.rect(r.x + 6, r.y + 2, r.ancho - 8, 2, VI(0));
  l.px(r.x + r.ancho - 3, r.y + 2, NE(7));
  l.rect(r.x + 7, r.y + 5, r.ancho - 10, 1, NE(4));
  l.rect(r.x + 7, r.y + 7, r.ancho - 13, 1, NE(4));
  l.rect(r.x + 7, r.y + 9, r.ancho - 11, 1, NE(4));
  // Barra de tareas con el botón de inicio.
  l.rect(r.x, r.y + r.alto - 2, r.ancho, 2, NE(5));
  l.rect(r.x + 1, r.y + r.alto - 2, 4, 1, PL(3));
}

// ---------------------------------------------------------------------------
// Piezas sueltas
// ---------------------------------------------------------------------------

/** Tableta gráfica con teclas laterales, zona activa y un lápiz óptico encima. */
function tableta(l: Lienzo, x: number, y: number, w: number, h: number): void {
  caja(l, x, y, w, h, { medio: NE(3), luz: NE(5), sombra: NE(1), hondo: NE(1) });
  l.rect(x + 3, y + 2, w - 5, h - 4, NE(2));
  l.rect(x + 3, y + 2, w - 5, 1, NE(1));
  l.px(x + 1, y + 2, VI(2)).px(x + 1, y + 4, VI(2));
  // Lápiz óptico.
  l.linea(x + w - 5, y + 2, x + w - 10, y + h - 3, NE(7));
  l.px(x + w - 5, y + 2, VI(2)).px(x + w - 10, y + h - 3, RS(3));
}

/** Portalápiz con tres lápices de colores. */
function portalapiz(l: Lienzo, x: number, y: number): void {
  l.rect(x + 1, y - 5, 1, 5, RS(3));
  l.rect(x + 2, y - 4, 1, 4, TC(3));
  l.rect(x + 3, y - 6, 1, 6, VI(2));
  l.rect(x + 4, y - 3, 1, 3, PL(3));
  for (const [px, py] of [[1, -5], [2, -4], [3, -6], [4, -3]] as const) l.px(x + px, y + py, MC(4));
  l.rect(x, y, 6, 6, MO(2));
  l.rect(x, y, 6, 1, MO(3));
  l.rect(x, y + 1, 1, 5, MO(3));
  l.rect(x + 5, y + 1, 1, 5, MO(1));
  l.rect(x + 1, y + 5, 4, 1, MO(1));
}

/** Abanico de tarjetas de muestra de color: cuatro tarjetas que giran desde un mismo remache, con la punta de color. */
function abanico(l: Lienzo, x: number, y: number, largo = 11): void {
  const px = x + 2;
  const py = y + largo;
  const colores: readonly ColorEntrada[] = [VI(2), PL(3), TC(3), RS(3)];
  [78, 58, 38, 18].forEach((grados, i) => {
    const a = (grados * Math.PI) / 180;
    for (let yy = py - largo - 3; yy <= py + 3; yy++) {
      for (let xx = px - 3; xx <= px + largo + 3; xx++) {
        const rx = xx - px;
        const ry = yy - py;
        const u = rx * Math.cos(a) - ry * Math.sin(a);
        const v = rx * Math.sin(a) + ry * Math.cos(a);
        if (u < -1 || u > largo || v < -2 || v >= 2) continue;
        l.px(xx, yy, u > 4 ? (colores[i] as ColorEntrada) : NE(7));
      }
    }
  });
  l.px(px, py - 1, NE(3));
}

/** Osciloscopio pequeño: pantalla verde con onda, tres perillas y entrada BNC. */
function osciloscopio(l: Lienzo, x: number, y: number, w: number, h: number): void {
  caja(l, x, y, w, h, { medio: MT(2), luz: MT(3), sombra: MT(1), hondo: MT(0) });
  // Asa superior.
  l.rect(x + 3, y - 1, w - 6, 1, MT(1));
  // Pantalla.
  const sw = w - 9;
  const sh = h - 8;
  l.rect(x + 1, y + 1, sw + 2, sh + 2, MT(0));
  l.rect(x + 2, y + 2, sw, sh, AZ(0));
  for (let gy = y + 3; gy < y + 2 + sh; gy += 3) for (let gx = x + 3; gx < x + 2 + sw; gx += 3) l.px(gx, gy, PL(1));
  const onda = (i: number): number => y + 2 + Math.floor(sh / 2) + Math.round(Math.sin((i / sw) * Math.PI * 3) * (sh / 2 - 1));
  for (let i = 1; i < sw; i++) l.linea(x + 1 + i, onda(i - 1), x + 2 + i, onda(i), PL(4));
  // Perillas.
  for (let k = 0; k < 3; k++) {
    const kx = x + w - 5;
    const ky = y + 2 + k * 3;
    l.rect(kx, ky, 2, 2, k === 0 ? NA(3) : NE(6));
    l.px(kx, ky, NE(7));
    l.px(kx + 1, ky + 1, NE(3));
  }
  // Fila de abajo: entradas y botones.
  l.px(x + 3, y + h - 3, AZ(0)).px(x + 4, y + h - 3, AZ(0));
  l.px(x + 3, y + h - 4, NE(7));
  l.rect(x + 7, y + h - 3, 5, 1, MT(1));
  l.px(x + 14, y + h - 3, PL(4));
}

/** Placa de circuitos: tarjeta verde con un chip, componentes de colores, pistas doradas y una luz. */
function placa(l: Lienzo, x: number, y: number, w: number, h: number): void {
  caja(l, x, y, w, h, { medio: PL(2), luz: PL(3), sombra: PL(1), hondo: PL(0) });
  // Pistas doradas.
  l.rect(x + 2, y + 5, 4, 1, TC(1));
  l.rect(x + w - 6, y + 2, 1, 4, TC(1));
  // Chip con patas.
  l.rect(x + 5, y + 2, 5, 3, AZ(0));
  l.px(x + 5, y + 2, NE(3));
  for (let i = 0; i < 3; i++) {
    l.px(x + 4, y + 2 + i, NE(5));
    l.px(x + 10, y + 2 + i, NE(5));
  }
  // Condensadores, resistencia y luces.
  l.rect(x + 1, y + 1, 2, 2, VI(2));
  l.px(x + 1, y + 1, VI(3));
  l.rect(x + w - 4, y + 1, 2, 2, NA(3));
  l.rect(x + 7, y + 6, 3, 1, TC(3));
  l.px(x + w - 3, y + 5, RS(3));
  l.px(x + w - 5, y + 5, PL(4));
  l.px(x + 1, y + h - 3, NE(7));
}

/** Multímetro amarillo con pantalla, selector redondo, botones y dos puntas de cable. */
function multimetro(l: Lienzo, x: number, y: number): void {
  caja(l, x, y, 9, 15, { medio: TC(2), luz: TC(3), sombra: TC(1), hondo: TC(0) });
  l.rect(x + 2, y + 2, 5, 3, NE(6));
  l.rect(x + 2, y + 2, 5, 1, NE(7));
  for (const [dx, dy] of [[3, 3], [3, 4], [4, 3], [5, 3], [5, 4], [6, 4]] as const) l.px(x + dx, y + dy, AZ(0));
  l.px(x + 2, y + 3, AZ(0));
  l.elipse(x + 4, y + 9, 2, 2, NE(1));
  l.px(x + 4, y + 7, NE(7));
  l.px(x + 4, y + 9, NE(3));
  l.px(x + 2, y + 6, RS(3)).px(x + 6, y + 6, VI(2));
  l.px(x + 2, y + 13, RS(3)).px(x + 6, y + 13, NE(1));
}

/** Parlante pequeño de cajón con woofer y tweeter. `aro` y `cono` dan el color propio de cada familia. */
function parlante(l: Lienzo, x: number, y: number, w: number, h: number, t: Tono, aro: ColorEntrada, cono: ColorEntrada): void {
  caja(l, x, y, w, h, t);
  const cx = x + Math.floor(w / 2);
  // Tweeter.
  l.elipse(cx, y + 4, 1, 1, aro);
  l.px(cx, y + 4, cono);
  // Woofer.
  const ry = y + h - 6;
  const rr = w >= 11 ? 4 : 3;
  l.elipse(cx, ry, rr, rr, aro);
  l.elipse(cx, ry, rr - 1, rr - 1, cono);
  l.elipse(cx, ry, 1, 1, aro);
  l.px(cx - rr + 1, ry - rr + 1, NE(7));
  // Luz de encendido.
  l.px(x + w - 3, y + 2, VI(2));
}

/** Audífonos vistos de frente sobre un soporte: diadema curva, dos copas con almohadilla y el poste. */
function audifonos(l: Lienzo, x: number, y: number, w: number, h: number, diadema: ColorEntrada, copa: ColorEntrada, almohadilla: ColorEntrada): void {
  const cupAlto = Math.floor(h * 0.55);
  const cupAncho = w >= 12 ? 4 : 3;
  // Poste y base del soporte.
  const cx = x + Math.floor(w / 2);
  l.rect(cx, y + 1, 1, h - 1, MT(2));
  l.rect(cx - 2, y + h - 1, 5, 1, MT(2));
  l.rect(cx - 2, y + h - 1, 5, 1, MT(2)).px(cx - 2, y + h - 1, MT(3));
  // Diadema: rectángulo redondeado abierto abajo.
  l.rect(x + 2, y, w - 4, 1, diadema);
  l.rect(x + 1, y + 1, 1, h - cupAlto - 1, diadema);
  l.rect(x + w - 2, y + 1, 1, h - cupAlto - 1, diadema);
  l.px(x + 2, y, NE(7));
  // Copas.
  const cy = y + h - cupAlto - 1;
  for (const lado of [0, 1]) {
    const px = lado === 0 ? x : x + w - cupAncho;
    l.rect(px, cy, cupAncho, cupAlto, copa);
    l.rect(px, cy, cupAncho, 1, NE(7));
    l.rect(lado === 0 ? px + cupAncho - 1 : px, cy + 1, 1, cupAlto - 1, almohadilla);
    l.rect(lado === 0 ? px : px + cupAncho - 1, cy + 1, 1, cupAlto - 1, MT(1));
  }
}

/** Teclado MIDI de dos octavas (14 teclas blancas de 3 px) con perillas y pads arriba. Mide 42 x 9. */
function tecladoMidi(l: Lienzo, x: number, y: number): void {
  l.rect(x, y, 42, 9, AZ(1));
  l.rect(x, y, 42, 1, AZ(3));
  l.rect(x, y + 1, 1, 8, AZ(2));
  // Perillas, pantallita y pads de colores en la franja de arriba.
  const perillas: readonly ColorEntrada[] = [NE(6), NE(6), NE(6), NE(6)];
  perillas.forEach((c, i) => {
    l.px(x + 3 + i * 3, y + 1, c);
    l.px(x + 3 + i * 3, y + 2, NE(3));
  });
  l.rect(x + 17, y + 1, 5, 2, AZ(0));
  l.rect(x + 18, y + 1, 3, 1, PL(4));
  const pads: readonly ColorEntrada[] = [RS(3), TC(3), PL(4), VI(2), MO(3), NA(3)];
  pads.forEach((c, i) => l.rect(x + 25 + i * 3, y + 1, 2, 2, c));
  // Teclas blancas.
  l.rect(x + 1, y + 3, 41, 6, NE(7));
  for (let i = 0; i < 14; i++) l.rect(x + 3 + i * 3 - 1 - (i === 0 ? 0 : 0), y + 3, 1, 6, NE(4));
  l.rect(x + 1, y + 8, 41, 1, NE(5));
  l.rect(x + 41, y + 3, 1, 6, NE(4));
  // Teclas negras (no hay entre mi-fa ni entre si-do).
  for (let i = 0; i < 13; i++) {
    if ([2, 6].includes(i % 7)) continue;
    const bx = x + 3 + i * 3;
    l.rect(bx, y + 3, 2, 3, NE(1));
    l.px(bx, y + 3, NE(3));
  }
}

/** Planta suculenta en maceta de barro: la nota verde de un puesto moderno. */
function suculenta(l: Lienzo, x: number, y: number): void {
  l.linea(x + 3, y + 4, x + 3, y, PL(4));
  l.linea(x + 3, y + 4, x + 1, y + 1, PL(3));
  l.linea(x + 3, y + 4, x + 5, y + 1, PL(3));
  l.px(x + 2, y + 3, PL(2)).px(x + 4, y + 3, PL(2));
  l.rect(x, y + 4, 7, 4, 'maceta-terracota-2');
  l.rect(x, y + 4, 7, 1, 'maceta-terracota-3');
  l.rect(x + 6, y + 5, 1, 3, 'maceta-terracota-1');
  l.rect(x + 1, y + 7, 5, 1, 'maceta-terracota-1');
}

/** Disquete de 3,5 pulgadas de 6 x 6 con persiana metálica y etiqueta. */
function disquete(l: Lienzo, x: number, y: number, color: ColorEntrada): void {
  l.rect(x, y, 6, 6, color);
  l.rect(x + 2, y, 3, 2, NE(5));
  l.px(x + 4, y + 1, AZ(0));
  l.rect(x + 1, y + 3, 4, 3, NE(7));
  l.px(x + 2, y + 4, NE(4));
}

// ---------------------------------------------------------------------------
// Los ocho equipos (todos 64 x 56, el borde de abajo del teclado en la fila 34)
// ---------------------------------------------------------------------------

/** Artista digital: monitor con ilustración, panel de capas en ángulo, tableta con lápiz y portalápiz. */
function pcArtistaDigital(): Lienzo {
  const l = new Lienzo(64, 56);
  const fb = pie(24);
  portalapiz(l, 3, fb - 14);
  monitor(l, 17, 2, 28, 20, pantallaIlustracion);
  pieDeMonitor(l, 31, 22, fb - 8, 12);
  monitorAngulado(l, 46, 4, 16, 20, 'D', pantallaCapas, 3);
  l.rect(53, 24, 3, 3, AZ(2));
  tableta(l, 2, fb - 8, 18, 9);
  // Teclado azul y ratón.
  l.rect(21, fb - 8, 21, 9, AZ(2));
  l.rect(21, fb - 8, 21, 1, AZ(3));
  l.rect(21, fb - 7, 1, 7, AZ(3));
  l.rect(41, fb - 7, 1, 8, AZ(1));
  l.rect(21, fb, 21, 1, AZ(1));
  for (let fila = 0; fila < 3; fila++) {
    for (let i = 2; i < 19; i += 3) {
      l.rect(21 + i, fb - 7 + fila * 2, 2, 1, VI(1));
      l.px(21 + i, fb - 6 + fila * 2, AZ(1));
    }
  }
  l.rect(25, fb - 1, 13, 1, VI(1));
  ratonTono(l, 46, fb - 6, { medio: NE(6), luz: NE(7), sombra: NE(4), hondo: NE(3) });
  return cerrarApoyado(l);
}

/** Diseño gráfico: monitor ancho con una composición, abanico de muestras, tableta chica, teclado claro y ratón. */
function pcDisenoGrafico(): Lienzo {
  const l = new Lienzo(64, 56);
  const fb = pie(24);
  monitor(l, 14, 2, 36, 20, pantallaComposicion);
  pieDeMonitor(l, 32, 22, fb - 8, 14);
  abanico(l, 2, fb - 11);
  tecladoTono(l, 20, fb - 8, 23, { medio: NE(6), luz: NE(7), sombra: NE(4), hondo: NE(4) }, NE(7));
  ratonTono(l, 46, fb - 6, { medio: NE(7), luz: NE(7), sombra: NE(5), hondo: NE(4) });
  // Tableta chica con lápiz.
  tableta(l, 52, fb - 8, 10, 9);
  return cerrarApoyado(l);
}

/** Hardware: monitor con onda y esquema, osciloscopio con pantalla verde, placa con componentes y multímetro. */
function pcHardware(): Lienzo {
  const l = new Lienzo(64, 56);
  const fb = pie(24);
  monitor(l, 2, 3, 28, 20, pantallaEsquema);
  pieDeMonitor(l, 16, 23, fb - 8, 12);
  osciloscopio(l, 33, 9, 19, 16);
  multimetro(l, 54, fb - 17);
  // Cables del multímetro hacia la placa.
  l.linea(55, fb - 3, 51, fb - 5, RS(3));
  l.linea(59, fb - 3, 51, fb - 1, NE(2));
  placa(l, 36, fb - 7, 15, 8);
  // Teclado azul con las teclas en celeste y ratón.
  l.rect(5, fb - 8, 21, 9, AZ(2));
  l.rect(5, fb - 8, 21, 1, AZ(3));
  l.rect(5, fb - 7, 1, 7, AZ(3));
  l.rect(25, fb - 7, 1, 8, AZ(1));
  l.rect(5, fb, 21, 1, AZ(1));
  for (let fila = 0; fila < 3; fila++) {
    for (let i = 2; i < 19; i += 3) {
      l.rect(5 + i, fb - 7 + fila * 2, 2, 1, AZ(4));
      l.px(5 + i, fb - 6 + fila * 2, AZ(1));
    }
  }
  l.rect(9, fb - 1, 13, 1, AZ(4));
  ratonTono(l, 28, fb - 6, { medio: AZ(4), luz: NE(7), sombra: AZ(3), hondo: AZ(3) });
  return cerrarApoyado(l);
}

/** Músico: monitor con editor de audio, dos parlantes, teclado MIDI de dos octavas y audífonos en su soporte. */
function pcMusico(): Lienzo {
  const l = new Lienzo(64, 56);
  const fb = pie(24);
  const negro: Tono = { medio: NE(1), luz: NE(3), sombra: NE(0), hondo: NE(0) };
  parlante(l, 2, fb - 25, 9, 16, negro, NA(3), NE(2));
  parlante(l, 43, fb - 25, 9, 16, negro, NA(3), NE(2));
  monitor(l, 13, 2, 28, 20, pantallaEditorAudio);
  pieDeMonitor(l, 27, 22, fb - 8, 12);
  tecladoMidi(l, 6, fb - 8);
  audifonos(l, 53, fb - 12, 10, 13, MT(2), RS(2), RS(4));
  return cerrarApoyado(l);
}

/** Audiófilo: monitor discreto, amplificador con medidores de aguja y luz cálida, parlantes de madera y audífonos grandes. */
function pcAudiofilo(): Lienzo {
  const l = new Lienzo(64, 56);
  const fb = pie(24);
  const madera: Tono = { medio: MD(3), luz: MD(4), sombra: MD(1), hondo: MD(0) };
  parlante(l, 2, 2, 13, 19, madera, TC(2), MT(1));
  parlante(l, 49, 2, 13, 19, madera, TC(2), MT(1));
  monitor(l, 20, 7, 24, 17, pantallaReproductor);
  pieDeMonitor(l, 32, 24, fb - 8, 12);
  // Amplificador: frente de aluminio con cachetes de madera.
  l.rect(19, fb - 8, 28, 9, MT(3));
  l.rect(19, fb - 8, 28, 1, NE(7));
  l.rect(19, fb, 28, 1, MT(1));
  l.rect(19, fb - 7, 2, 8, MD(3));
  l.rect(45, fb - 7, 2, 8, MD(2));
  l.rect(19, fb - 7, 1, 8, MD(4));
  for (const mx of [23, 36]) {
    l.rect(mx - 1, fb - 7, 9, 7, MT(1));
    l.rect(mx, fb - 6, 7, 5, TC(3));
    l.rect(mx, fb - 6, 7, 1, TC(2));
    l.px(mx + 1, fb - 2, TC(1)).px(mx + 3, fb - 2, TC(1)).px(mx + 5, fb - 2, TC(1));
    l.linea(mx + 3, fb - 2, mx + 5, fb - 5, AZ(0));
  }
  // Perilla central y luces.
  l.elipse(33, fb - 4, 2, 2, MT(1));
  l.elipse(33, fb - 4, 1, 1, NE(6));
  l.px(33, fb - 6, NE(7));
  l.px(44, fb - 6, NA(3)).px(44, fb - 4, TC(3));
  // Audífonos grandes en su soporte, delante del parlante de la izquierda.
  audifonos(l, 2, fb - 12, 14, 13, MT(2), MD(3), 'cuero-3');
  tazaChica(l, 53, fb - 5, 'naranja');
  return cerrarApoyado(l);
}

/** Computador de escritorio clásico: torre grande de plástico gris con unidades, monitor plano gris, teclado, ratón y taza. */
function computadorEscritorio(): Lienzo {
  const l = new Lienzo(64, 56);
  const fb = pie(24);
  // Torre.
  caja(l, 3, 3, 13, 26, GRIS);
  for (const by of [6, 11]) {
    l.rect(5, by, 9, 4, NE(4));
    l.rect(5, by, 9, 1, NE(7));
    l.rect(6, by + 2, 7, 1, NE(1));
    l.px(12, by + 3, NE(2));
  }
  l.rect(5, 17, 9, 2, NE(4));
  l.rect(6, 18, 5, 1, NE(1));
  l.px(12, 18, NE(2));
  l.elipse(7, 23, 1, 1, NE(2));
  l.px(6, 22, NE(7));
  l.px(12, 22, PL(4)).px(12, 24, NA(3));
  for (let k = 0; k < 3; k++) l.rect(5, 26 + k, 9, 1, k === 1 ? NE(2) : NE(3));
  // Monitor plano gris.
  l.rect(20, 2, 28, 20, NE(5));
  l.rect(20, 2, 28, 1, NE(7));
  l.rect(20, 3, 1, 19, NE(6));
  l.rect(47, 3, 1, 19, NE(3));
  l.rect(21, 21, 26, 1, NE(3));
  l.rect(21, 3, 26, 1, NE(3));
  l.rect(21, 3, 1, 16, NE(3));
  l.rect(22, 4, 24, 14, AZ(0));
  pantallaDatos(l, { x: 22, y: 4, ancho: 24, alto: 14 });
  l.px(22, 4, NE(7)).px(23, 4, NE(7)).px(22, 5, NE(7));
  l.px(32, 20, PL(4));
  l.rect(36, 19, 3, 2, NE(3));
  pieDeMonitor(l, 33, 22, fb - 8, 12);
  // Teclado y ratón grises.
  tecladoTono(l, 22, fb - 8, 22, GRIS, NE(7));
  ratonTono(l, 48, fb - 6, GRIS);
  tazaChica(l, 56, fb - 11, 'naranja');
  return cerrarApoyado(l);
}

/** Computador moderno: monitor muy delgado, mini PC cuadrado, teclado delgado claro, ratón táctil y una suculenta. */
function computadorModerno(): Lienzo {
  const l = new Lienzo(64, 56);
  const fb = pie(24);
  suculenta(l, 2, fb - 15);
  // Monitor de bisel fino: marco de aluminio de 1 px y barbilla de 2.
  const mx = 11;
  l.rect(mx, 2, 36, 20, NE(6));
  l.rect(mx, 2, 36, 1, NE(7));
  l.rect(mx, 3, 1, 19, NE(7));
  l.rect(mx + 35, 3, 1, 19, NE(4));
  l.rect(mx + 1, 21, 34, 1, NE(4));
  pantallaFondo(l, { x: mx + 1, y: 3, ancho: 34, alto: 17 });
  l.px(mx + 1, 3, NE(7)).px(mx + 2, 3, NE(7)).px(mx + 1, 4, NE(7));
  // Pie: cuello plano y base ovalada.
  l.rect(mx + 16, 22, 4, 2, MT(2));
  l.rect(mx + 16, 22, 1, 2, MT(3));
  l.rect(mx + 9, fb - 9, 18, 2, MT(2));
  l.rect(mx + 9, fb - 9, 18, 1, MT(3));
  // Mini PC cuadrado.
  l.rect(50, fb - 15, 12, 12, MT(3));
  l.rect(50, fb - 15, 12, 3, NE(7));
  l.rect(50, fb - 12, 1, 9, NE(7));
  l.rect(61, fb - 12, 1, 9, MT(2));
  l.rect(51, fb - 4, 11, 1, MT(2));
  l.px(53, fb - 10, VI(2)).px(54, fb - 10, VI(2));
  l.rect(53, fb - 7, 2, 1, AZ(2)).rect(56, fb - 7, 2, 1, AZ(2));
  l.rect(58, fb - 10, 2, 2, MT(1));
  l.px(58, fb - 10, MT(3));
  // Teclado delgado claro (6 filas) y ratón táctil.
  l.rect(18, fb - 5, 24, 6, NE(7));
  l.rect(18, fb, 24, 1, NE(4));
  l.rect(41, fb - 4, 1, 5, NE(5));
  for (let fila = 0; fila < 2; fila++) for (let i = 2; i < 22; i += 3) l.rect(18 + i, fb - 4 + fila * 2, 2, 1, NE(5));
  l.rect(22, fb - 1, 15, 1, NE(5));
  l.rect(45, fb - 6, 4, 7, NE(7));
  l.rect(45, fb - 6, 1, 7, NE(7));
  l.rect(48, fb - 5, 1, 6, NE(5));
  l.rect(46, fb, 2, 1, NE(4));
  l.px(46, fb - 4, NE(5));
  return cerrarApoyado(l);
}

/** Retro de los años 90: monitor de tubo beige sobre una caja horizontal con disquetera, teclado grueso y ratón de bola. */
function computadorRetro90s(): Lienzo {
  const l = new Lienzo(64, 56);
  const fb = pie(24);
  // Caja de escritorio horizontal con disquetera, unidad de CD y luces.
  caja(l, 3, 21, 31, 7, CREMA);
  l.rect(5, 24, 9, 1, BE(0));
  l.rect(6, 24, 7, 1, AZ(0));
  l.px(14, 24, BE(0)).px(15, 24, PL(4));
  l.rect(18, 23, 11, 3, BE(1));
  l.rect(19, 24, 9, 1, BE(0));
  l.px(30, 24, NA(3)).px(31, 24, PL(4));
  // Tubo de imagen: lomo trasero, frente con bisel hundido y pantalla de esquinas redondeadas.
  l.rect(8, 1, 20, 2, BE(3));
  l.rect(8, 1, 20, 1, BE(4));
  caja(l, 5, 3, 26, 18, CREMA);
  l.rect(7, 5, 22, 13, BE(1));
  l.rect(7, 5, 22, 1, BE(0));
  l.rect(7, 5, 1, 13, BE(0));
  l.rect(8, 6, 20, 11, AZ(0));
  pantallaVentanas(l, { x: 8, y: 6, ancho: 20, alto: 11 });
  esquinas(l, 8, 6, 20, 11, BE(1));
  l.px(9, 7, NE(7)).px(10, 7, NE(7));
  // Mentón: logotipo de franjas de colores, botón de encendido y rejilla.
  l.rect(8, 19, 1, 1, RS(3)).rect(9, 19, 1, 1, NA(3)).rect(10, 19, 1, 1, TC(3)).rect(11, 19, 1, 1, PL(3)).rect(12, 19, 1, 1, VI(2));
  l.rect(24, 19, 3, 1, BE(0));
  l.px(28, 19, PL(4));
  // Teclado grueso beige.
  tecladoTono(l, 6, fb - 8, 24, CREMA, BE(4));
  // Alfombrilla y ratón de bola.
  alfombrilla(l, 36, fb - 7, 13, 8, RS(1), RS(2));
  ratonTono(l, 40, fb - 5, CREMA, NE(2));
  l.px(42, fb - 2, NE(2));
  // Pila de disquetes.
  disquete(l, 52, fb - 10, VI(1));
  disquete(l, 56, fb - 7, TC(2));
  return cerrarApoyado(l);
}

export function cuadrosPcsB(): Cuadros {
  const c: Cuadros = new Map();
  registrar(c, 'pc-artista-digital', 'S', pcArtistaDigital());
  registrar(c, 'pc-diseno-grafico', 'S', pcDisenoGrafico());
  registrar(c, 'pc-hardware', 'S', pcHardware());
  registrar(c, 'pc-musico', 'S', pcMusico());
  registrar(c, 'pc-audiofilo', 'S', pcAudiofilo());
  registrar(c, 'computador-escritorio', 'S', computadorEscritorio());
  registrar(c, 'computador-moderno', 'S', computadorModerno());
  registrar(c, 'computador-retro-90s', 'S', computadorRetro90s());
  return c;
}
