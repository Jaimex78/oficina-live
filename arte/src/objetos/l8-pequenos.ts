/**
 * Lote 8, equipos pequeños del puesto: portátil con base de conexión, portátil resistente, consola portátil, teléfono de
 * conferencia, tableta con soporte, tableta y teléfono, computador todo en uno y computador retro compacto.
 *
 * Reglas (ver `l8-comun.ts` y `GUIA-ESTILO-GATHER-V2.md`):
 *  - Cada cuadro mide `ancho * 32` por `32 + sobresale`; el borde de abajo del objeto queda en la fila `pie(sobresale)`.
 *  - Pantallas de frente, encendidas y con contenido propio. Luz arriba a la izquierda.
 *  - Contorno azul marino de 1 px (`cerrarApoyado`) y solo colores de la paleta.
 */

import { Lienzo } from '../nucleo';
import type { ColorEntrada } from '../nucleo';
import { AZ, MT, NE, TG, VI, cerrarApoyado, pantallaCodigo, pantallaTerminal, pie, registrar } from './l8-comun';
import type { Cuadros, Region } from './l8-comun';

/** Rectángulo con volumen de 1 px: luz arriba y a la izquierda, sombra abajo y a la derecha. */
function bisel(l: Lienzo, x: number, y: number, w: number, h: number, medio: ColorEntrada, luz: ColorEntrada, sombra: ColorEntrada): void {
  l.rect(x, y, w, h, medio);
  l.rect(x, y, w, 1, luz);
  l.rect(x, y + 1, 1, h - 1, luz);
  l.rect(x + w - 1, y + 1, 1, h - 1, sombra);
  l.rect(x + 1, y + h - 1, w - 1, 1, sombra);
}

/** Reflejo del vidrio: tres píxeles blancos en la esquina de la pantalla. */
function reflejo(l: Lienzo, r: Region): void {
  l.px(r.x, r.y, NE(7)).px(r.x + 1, r.y, NE(7)).px(r.x, r.y + 1, NE(7));
}

// ---------------------------------------------------------------------------
// Contenidos de pantalla chicos
// ---------------------------------------------------------------------------

/** Mapa de campo: tierra, un río, una ruta punteada y un marcador naranja. */
function pantallaMapa(l: Lienzo, r: Region): void {
  l.rect(r.x, r.y, r.ancho, r.alto, 'planta-3');
  l.rect(r.x, r.y + r.alto - 2, r.ancho, 2, 'planta-2');
  for (let i = 0; i < r.ancho; i++) l.px(r.x + i, r.y + 2 + Math.round(Math.sin(i / 2.2) * 1.2), VI(2));
  for (let i = 3; i < r.ancho - 3; i += 2) l.px(r.x + i, r.y + r.alto - 3 - (i % 4 === 1 ? 0 : 1), NE(7));
  l.rect(r.x + r.ancho - 6, r.y + 1, 2, 2, 'naranja-2');
  l.px(r.x + r.ancho - 6, r.y + 1, 'naranja-4');
  l.px(r.x + r.ancho - 6, r.y + 3, 'naranja-1');
}

/** Juego de plataformas en miniatura: cielo, nubes, suelo, un bloque y una moneda. */
function pantallaJuego(l: Lienzo, r: Region): void {
  l.rect(r.x, r.y, r.ancho, r.alto, VI(2));
  l.rect(r.x + 1, r.y + 1, 3, 1, NE(7));
  l.rect(r.x + 7, r.y, 3, 1, NE(7));
  l.rect(r.x, r.y + r.alto - 2, r.ancho, 2, 'planta-3');
  l.rect(r.x, r.y + r.alto - 1, r.ancho, 1, 'madera-oscura-3');
  l.rect(r.x + 7, r.y + 1, 2, 2, 'tela-calida-3');
  l.px(r.x + 7, r.y + 1, 'tela-calida-3');
  l.rect(r.x + 2, r.y + r.alto - 4, 2, 2, 'rojo-suave-3');
  l.px(r.x + 2, r.y + r.alto - 5, 'rojo-suave-4');
  l.rect(r.x + r.ancho - 4, r.y + r.alto - 4, 2, 2, 'naranja-2');
}

/** Calendario y tareas para la tableta vertical. */
function pantallaCalendario(l: Lienzo, r: Region): void {
  l.rect(r.x, r.y, r.ancho, r.alto, NE(7));
  l.rect(r.x, r.y, r.ancho, 2, 'rojo-suave-3');
  for (let j = 0; j < 3; j++) {
    for (let i = 0; i < 4; i++) {
      const hoy = i === 2 && j === 1;
      l.rect(r.x + 1 + i * 3, r.y + 3 + j * 2, 2, 1, hoy ? 'naranja-2' : NE(5));
    }
  }
  l.rect(r.x + 1, r.y + r.alto - 3, r.ancho - 2, 1, VI(2));
  l.rect(r.x + 1, r.y + r.alto - 1, r.ancho - 5, 1, NE(5));
}

/** Paisaje para la tableta recostada: cielo, sol, colinas. */
function pantallaPaisaje(l: Lienzo, r: Region): void {
  l.rect(r.x, r.y, r.ancho, r.alto, VI(2));
  l.rect(r.x, r.y, r.ancho, 2, VI(1));
  l.rect(r.x + 3, r.y + 1, 2, 2, 'tela-calida-3');
  l.rect(r.x + r.ancho - 6, r.y + 1, 4, 1, NE(7));
  l.rect(r.x, r.y + r.alto - 3, r.ancho, 3, 'planta-3');
  l.rect(r.x + 5, r.y + r.alto - 4, 6, 1, 'planta-3');
  l.rect(r.x + 7, r.y + r.alto - 5, 2, 1, 'planta-3');
  l.rect(r.x, r.y + r.alto - 1, r.ancho, 1, 'planta-2');
}

/** Chat: burbujas verdes y blancas alternadas. */
function pantallaChat(l: Lienzo, r: Region): void {
  l.rect(r.x, r.y, r.ancho, r.alto, NE(6));
  l.rect(r.x, r.y, r.ancho, 1, VI(1));
  for (let k = 0; k < 3; k++) {
    const derecha = k % 2 === 0;
    l.rect(r.x + (derecha ? 1 : 0), r.y + 2 + k * 2, r.ancho - 1, 1, derecha ? 'planta-3' : NE(7));
  }
}

/** Escritorio de un computador retro: ventana, carpeta y barra de menú en verde de fósforo. */
function pantallaFosforo(l: Lienzo, r: Region): void {
  l.rect(r.x, r.y, r.ancho, r.alto, 'planta-4');
  l.rect(r.x, r.y, r.ancho, 1, 'planta-2');
  l.rect(r.x + 1, r.y + 2, 5, 3, 'planta-2');
  l.rect(r.x + 2, r.y + 3, 3, 1, 'planta-4');
  l.rect(r.x + r.ancho - 3, r.y + r.alto - 3, 2, 2, 'planta-2');
  l.px(r.x + r.ancho - 3, r.y + r.alto - 3, 'planta-3');
  l.rect(r.x + 1, r.y + r.alto - 1, r.ancho - 2, 1, 'planta-3');
  // Esquinas redondeadas del tubo.
  l.px(r.x, r.y + r.alto - 1, 'planta-3');
}

// ---------------------------------------------------------------------------
// 1. Portátil con base de conexión (1 x 1, sobresale 8): 32 x 40, el pie en la fila 18
// ---------------------------------------------------------------------------

function laptopDock(): Lienzo {
  const l = new Lienzo(32, 40);
  const fb = pie(8);
  // Tapa con pantalla de código.
  bisel(l, 3, 1, 24, 11, 'metal-1', 'metal-3', 'metal-0');
  l.rect(4, 2, 22, 9, AZ(0));
  pantallaCodigo(l, { x: 5, y: 3, ancho: 20, alto: 7 }, 3);
  reflejo(l, { x: 5, y: 3, ancho: 20, alto: 7 });
  // Base del portátil con teclas.
  l.rect(2, 12, 26, 3, 'metal-3');
  l.rect(2, 12, 26, 1, NE(7));
  for (let i = 0; i < 12; i++) l.px(4 + i * 2, 13, MT(1));
  l.rect(2, 14, 26, 1, MT(2));
  // Base de conexión: bloque oscuro con puertos y una luz.
  bisel(l, 1, fb - 3, 28, 4, AZ(1), AZ(3), AZ(0));
  l.rect(2, fb - 3, 26, 1, AZ(3));
  l.rect(4, fb - 1, 3, 1, AZ(0));
  l.px(5, fb - 2, VI(2));
  l.rect(9, fb - 1, 5, 1, AZ(0));
  l.rect(9, fb - 2, 5, 1, 'naranja-3');
  l.rect(16, fb - 1, 2, 1, AZ(0));
  l.px(16, fb - 2, 'rojo-suave-3');
  l.px(17, fb - 2, 'tela-calida-3');
  l.rect(25, fb - 2, 2, 1, 'planta-4');
  // Cable que sale por la derecha y cae sobre el escritorio.
  l.px(29, fb - 1, TG(2));
  l.px(30, fb - 1, TG(2));
  l.rect(30, fb, 1, 3, TG(2));
  return cerrarApoyado(l);
}

// ---------------------------------------------------------------------------
// 2. Portátil resistente (1 x 1, sobresale 8): 32 x 40, el pie en la fila 18
// ---------------------------------------------------------------------------

function portatilResistente(): Lienzo {
  const l = new Lienzo(32, 40);
  const fb = pie(8);
  // Asa naranja.
  l.rect(10, 1, 12, 1, 'naranja-3');
  l.px(10, 2, 'naranja-2');
  l.px(21, 2, 'naranja-1');
  // Tapa gruesa, gris oscuro, con pantalla de mapa.
  bisel(l, 2, 3, 28, 9, 'metal-1', 'metal-2', 'metal-0');
  l.rect(5, 4, 22, 7, AZ(0));
  pantallaMapa(l, { x: 6, y: 5, ancho: 20, alto: 5 });
  reflejo(l, { x: 6, y: 5, ancho: 20, alto: 5 });
  // Esquinas de goma naranja de la tapa.
  for (const [x, y] of [[2, 3], [27, 3]] as const) {
    bisel(l, x, y, 3, 4, 'naranja-2', 'naranja-4', 'naranja-1');
  }
  // Base: gris oscuro con teclas grandes y un seguro naranja.
  bisel(l, 2, 12, 28, fb - 11, 'metal-1', 'metal-2', 'metal-0');
  l.rect(7, 13, 18, 3, AZ(0));
  for (let j = 0; j < 2; j++) for (let i = 0; i < 8; i++) l.rect(8 + i * 2, 13 + j * 2 - (j === 1 ? 0 : 0), 1, 1, TG(2));
  l.rect(14, 16, 4, 1, 'naranja-2');
  for (const x of [2, 27]) bisel(l, x, 12, 3, fb - 11, 'naranja-2', 'naranja-4', 'naranja-1');
  // Tornillos.
  l.px(6, fb - 1, MT(3));
  l.px(25, fb - 1, MT(3));
  return cerrarApoyado(l);
}

// ---------------------------------------------------------------------------
// 3. Consola portátil (1 x 1, sobresale 0): 32 x 32, el pie en la fila 10
// ---------------------------------------------------------------------------

function consolaPortatil(): Lienzo {
  const l = new Lienzo(32, 32);
  const fb = pie(0);
  // Soporte pequeño debajo.
  bisel(l, 8, fb - 1, 16, 2, AZ(2), AZ(4), AZ(0));
  // Mando izquierdo, azul.
  bisel(l, 2, 1, 7, 8, VI(1), VI(3), VI(0));
  l.rect(4, 3, 3, 3, AZ(0));
  l.px(5, 4, NE(5));
  l.px(4, 7, VI(3));
  l.px(6, 7, VI(3));
  // Mando derecho, rojo.
  bisel(l, 23, 1, 7, 8, 'rojo-suave-3', 'rojo-suave-4', 'rojo-suave-1');
  l.px(26, 2, NE(7));
  l.px(25, 3, 'tela-calida-3');
  l.px(27, 3, VI(2));
  l.px(26, 4, 'planta-4');
  l.rect(25, 6, 3, 2, AZ(0));
  l.px(26, 6, NE(5));
  // Cuerpo central con pantalla de juego.
  bisel(l, 9, 1, 14, 8, AZ(1), AZ(3), AZ(0));
  const r: Region = { x: 10, y: 2, ancho: 12, alto: 6 };
  pantallaJuego(l, r);
  reflejo(l, r);
  return cerrarApoyado(l);
}

// ---------------------------------------------------------------------------
// 4. Teléfono de conferencia (1 x 1, sobresale 0): 32 x 32, estrella de tres brazos
// ---------------------------------------------------------------------------

function telefonoConferencia(): Lienzo {
  const l = new Lienzo(32, 32);
  const cx = 16;
  const cy = 4;
  /** Brazo: una pastilla de 4 x 2 que avanza desde el centro hasta la punta. */
  const brazo = (tx: number, ty: number, dy: number, color: ColorEntrada): void => {
    const pasos = 14;
    for (let t = 0; t <= pasos; t++) {
      const x = Math.round(cx + ((tx - cx) * t) / pasos);
      const y = Math.round(cy + ((ty - cy) * t) / pasos);
      l.rect(x - 1, y + dy, 4, 2, color);
    }
  };
  const forma = (dy: number, color: ColorEntrada): void => {
    brazo(3, 1, dy, color);
    brazo(27, 1, dy, color);
    brazo(15, 8, dy, color);
    l.elipse(cx, cy + 1 + dy, 4, 2, color);
  };
  forma(2, AZ(0));
  forma(1, AZ(1));
  forma(0, AZ(2));
  // Luz de arista en la cara de arriba.
  l.rect(2, 1, 4, 1, AZ(3));
  l.rect(26, 1, 4, 1, AZ(3));
  // Anillo de luz verde alrededor del centro.
  l.elipse(cx, cy + 1, 3, 2, 'planta-4', { relleno: false });
  l.px(cx, cy + 1, AZ(0));
  // Botones: silencio rojo, volumen y llamada.
  l.rect(8, 3, 2, 1, 'rojo-suave-3');
  l.px(22, 3, NE(5));
  l.px(24, 3, NE(5));
  l.px(14, 8, 'planta-3');
  l.px(16, 8, NE(5));
  return cerrarApoyado(l);
}

// ---------------------------------------------------------------------------
// 5. Tableta con soporte (1 x 1, sobresale 8): 32 x 40, el pie en la fila 18
// ---------------------------------------------------------------------------

function tabletaSoporte(): Lienzo {
  const l = new Lienzo(32, 40);
  const fb = pie(8);
  // Soporte plegable: base, bisagra y pata.
  bisel(l, 6, fb - 1, 20, 2, MT(1), MT(2), MT(0));
  l.rect(12, fb - 3, 8, 2, MT(2));
  l.rect(12, fb - 3, 8, 1, MT(3));
  l.rect(15, fb - 3, 2, 3, MT(1));
  // Tableta vertical.
  bisel(l, 8, 1, 15, 14, MT(3), NE(7), MT(1));
  l.rect(9, 2, 13, 11, AZ(0));
  const r: Region = { x: 10, y: 3, ancho: 11, alto: 9 };
  pantallaCalendario(l, r);
  reflejo(l, r);
  l.px(15, 13, MT(1));
  l.px(15, 1, 'planta-4');
  // Lápiz pegado al costado.
  l.rect(25, 3, 2, 10, NE(7));
  l.rect(25, 3, 2, 1, 'naranja-2');
  l.rect(26, 4, 1, 9, NE(5));
  l.px(25, 13, NE(3));
  return cerrarApoyado(l);
}

// ---------------------------------------------------------------------------
// 6. Tableta y teléfono (1 x 1, sobresale 0): 32 x 32, el pie en la fila 10
// ---------------------------------------------------------------------------

function tabletaYTelefono(): Lienzo {
  const l = new Lienzo(32, 32);
  const fb = pie(0);
  // Tableta recostada.
  bisel(l, 1, 2, 21, fb - 1, MT(3), NE(7), MT(1));
  l.rect(2, 3, 19, fb - 4, AZ(0));
  const r: Region = { x: 3, y: 4, ancho: 17, alto: 5 };
  pantallaPaisaje(l, r);
  reflejo(l, r);
  l.rect(3, fb, 17, 1, MT(0));
  // Teléfono con funda roja.
  bisel(l, 24, 1, 6, fb, 'rojo-suave-2', 'rojo-suave-4', 'rojo-suave-1');
  l.rect(25, 2, 4, 7, AZ(0));
  pantallaChat(l, { x: 25, y: 3, ancho: 4, alto: 5 });
  l.px(26, 2, NE(3));
  return cerrarApoyado(l);
}

// ---------------------------------------------------------------------------
// 7. Computador todo en uno (1 x 1, sobresale 16): 32 x 48, el pie en la fila 26
// ---------------------------------------------------------------------------

function todoEnUno(): Lienzo {
  const l = new Lienzo(32, 48);
  const fb = pie(16);
  // Pie en arco con base plana.
  l.rect(12, 19, 8, 3, MT(2));
  l.rect(12, 19, 8, 1, MT(3));
  l.rect(12, 20, 2, 5, MT(2));
  l.rect(18, 20, 2, 5, MT(1));
  l.rect(8, fb - 3, 16, 2, MT(2));
  l.rect(8, fb - 3, 16, 1, MT(3));
  l.rect(23, fb - 2, 1, 1, MT(1));
  // Cuerpo de aluminio con barbilla ancha.
  bisel(l, 3, 1, 26, 18, MT(3), NE(7), MT(1));
  l.rect(5, 3, 22, 12, AZ(0));
  const r: Region = { x: 6, y: 4, ancho: 20, alto: 10 };
  l.rect(r.x, r.y, r.ancho, r.alto, VI(2));
  pantallaPaisajeGrande(l, r);
  reflejo(l, r);
  l.rect(4, 17, 24, 1, MT(2));
  l.px(15, 16, MT(1));
  l.px(16, 16, MT(1));
  l.px(25, 16, 'planta-4');
  // Teclado delgado claro.
  bisel(l, 4, fb - 4, 17, 5, NE(6), NE(7), NE(3));
  for (let i = 0; i < 6; i++) {
    l.rect(6 + i * 2 + (i > 2 ? 2 : 0), fb - 3, 1, 1, NE(4));
    l.rect(6 + i * 2, fb - 2, 1, 1, NE(4));
  }
  l.rect(8, fb - 1, 8, 1, NE(4));
  // Ratón.
  bisel(l, 24, fb - 5, 4, 6, NE(7), NE(7), NE(4));
  l.px(25, fb - 4, NE(5));
  l.px(26, fb - 4, NE(5));
  return cerrarApoyado(l);
}

/** Escritorio de colores del todo en uno: ondas azules y un par de ventanas. */
function pantallaPaisajeGrande(l: Lienzo, r: Region): void {
  l.rect(r.x, r.y, r.ancho, r.alto, VI(1));
  // Ola de fondo.
  for (let i = 0; i < r.ancho; i++) {
    const h = 3 + Math.round(Math.sin(i / 3) * 1.4);
    l.rect(r.x + i, r.y + r.alto - h, 1, h, i % 7 < 3 ? 'morado-2' : VI(0));
  }
  // Dos ventanas.
  l.rect(r.x + 2, r.y + 2, 7, 4, NE(7));
  l.rect(r.x + 2, r.y + 2, 7, 1, NE(5));
  l.rect(r.x + 3, r.y + 4, 4, 1, NE(4));
  l.rect(r.x + 11, r.y + 3, 6, 4, NE(6));
  l.rect(r.x + 11, r.y + 3, 6, 1, 'rojo-suave-3');
  // Barra inferior.
  l.rect(r.x, r.y + r.alto - 1, r.ancho, 1, NE(5));
}

// ---------------------------------------------------------------------------
// 8. Computador retro compacto (1 x 1, sobresale 16): 32 x 48, el pie en la fila 26
// ---------------------------------------------------------------------------

const BG = (n: 0 | 1 | 2 | 3 | 4): ColorEntrada => `ladrillo-crema-${n}`;

function retroCompacto(): Lienzo {
  const l = new Lienzo(32, 48);
  const fb = pie(16);
  // Pie del cuerpo.
  bisel(l, 9, 21, 14, 3, BG(1), BG(2), BG(0));
  // Cuerpo beige de una pieza.
  bisel(l, 7, 1, 18, 21, BG(3), BG(4), BG(1));
  l.rect(12, 2, 8, 1, BG(1));
  // Marco hundido de la pantalla y tubo de fósforo.
  l.rect(9, 4, 14, 12, BG(1));
  l.rect(9, 4, 14, 1, BG(0));
  l.rect(9, 5, 1, 11, BG(0));
  l.rect(22, 5, 1, 11, BG(4));
  l.rect(10, 15, 12, 1, BG(4));
  l.rect(10, 5, 12, 10, AZ(0));
  const r: Region = { x: 11, y: 6, ancho: 10, alto: 8 };
  pantallaFosforo(l, r);
  reflejo(l, r);
  // Ranura del disquete y botón.
  l.rect(11, 18, 9, 1, AZ(0));
  l.rect(11, 19, 9, 1, BG(1));
  l.rect(21, 18, 1, 2, BG(0));
  // Calcomanía de tres franjas en la esquina.
  l.px(9, 19, 'rojo-suave-3');
  l.px(9, 20, 'tela-calida-3');
  l.px(10, 20, 'planta-3');
  // Rejillas laterales.
  for (let k = 0; k < 3; k++) l.px(23, 8 + k * 2, BG(1));
  // Teclado retro.
  bisel(l, 3, fb - 4, 20, 5, BG(3), BG(4), BG(1));
  for (let j = 0; j < 2; j++) for (let i = 0; i < 8; i++) l.rect(5 + i * 2, fb - 3 + j * 2 - (j === 0 ? 0 : 1) + (j === 0 ? 0 : 0), 1, 1, BG(4));
  l.rect(8, fb - 1, 12, 1, BG(4));
  // Ratón de un botón con cable.
  bisel(l, 25, fb - 5, 4, 6, BG(3), BG(4), BG(1));
  l.px(26, fb - 4, BG(0));
  l.rect(27, fb - 8, 1, 3, BG(0));
  l.px(26, fb - 8, BG(0));
  l.px(25, fb - 8, BG(0));
  return cerrarApoyado(l);
}

export function cuadrosPequenos(): Cuadros {
  const c: Cuadros = new Map();
  registrar(c, 'laptop-dock', 'S', laptopDock());
  registrar(c, 'portatil-resistente', 'S', portatilResistente());
  registrar(c, 'consola-portatil', 'S', consolaPortatil());
  registrar(c, 'telefono-conferencia', 'S', telefonoConferencia());
  registrar(c, 'tableta-soporte', 'S', tabletaSoporte());
  registrar(c, 'tableta-y-telefono', 'S', tabletaYTelefono());
  registrar(c, 'todo-en-uno', 'S', todoEnUno());
  registrar(c, 'computador-retro-compacto', 'S', retroCompacto());
  return c;
}
