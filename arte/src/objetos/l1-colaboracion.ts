/**
 * Colaboración del lote 1: pizarrón, muro Kanban, mesa de Teams y cartel de zona.
 *
 * Nada de texto legible: los rótulos son rayas y los garabatos son flechas y cajas hechas con líneas
 * (el texto de los carteles y las notas lo pone el motor). Los objetos colgados (muro Kanban y cartel)
 * llenan la cara de la pared: el cuadro cubre las filas 16 a 63 de la pared. De lado (E y O) se ven de
 * canto, como una franja pegada a la tapa de la pared vertical.
 */

import { Lienzo } from '../nucleo';
import { cerrar, registrarObjeto, type Cuadros } from './l1-comun';
import { laminaLateral } from './l1-tecnologia';

const AZ = (n: 0 | 1 | 2 | 3 | 4) => `azul-oficina-${n}` as const;
const ME = (n: 0 | 1 | 2 | 3) => AZ((n + 1) as 1 | 2 | 3 | 4);
const NE = (n: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7) => `neutro-${n}` as const;
const VI = (n: 0 | 1 | 2 | 3) => `vidrio-${n}` as const;

// ---------------------------------------------------------------------------
// Pizarrón blanco (2 x 1, sobresale 16): tablero con bandeja sobre dos patas con ruedas
// ---------------------------------------------------------------------------

/** Nota adhesiva de 6 x 6 con el borde de abajo más oscuro. */
function notaAdhesiva(l: Lienzo, x: number, y: number, claro: string, oscuro: string): void {
  l.rect(x, y, 6, 6, claro);
  l.rect(x, y + 5, 6, 1, oscuro);
  l.rect(x + 5, y, 1, 6, oscuro);
  l.rect(x + 1, y + 2, 3, 1, oscuro);
}

function pizarronS(): Lienzo {
  const l = new Lienzo(64, 48);
  // Patas con ruedas y travesaño.
  for (const x of [9, 51]) {
    l.rect(x, 35, 3, 9, ME(3));
    l.rect(x + 1, 35, 1, 9, ME(2));
    l.rect(x + 2, 35, 1, 9, ME(1));
    l.rect(x - 1, 44, 5, 2, AZ(2));
  }
  l.rect(12, 40, 39, 2, ME(1));
  l.rect(12, 40, 39, 1, ME(2));
  // Bandeja para marcadores, con tres marcadores de colores.
  l.rect(5, 32, 54, 3, ME(2));
  l.rect(5, 32, 54, 1, ME(3));
  l.rect(5, 34, 54, 1, ME(1));
  l.rect(12, 31, 5, 1, 'rojo-3');
  l.rect(19, 31, 5, 1, VI(1));
  l.rect(26, 31, 5, 1, 'planta-3');
  // Tablero: marco de aluminio y superficie blanca.
  l.rect(3, 2, 58, 30, ME(3));
  l.rect(3, 2, 58, 1, 'blanco');
  l.rect(60, 3, 1, 29, ME(1));
  l.rect(4, 31, 56, 1, ME(2));
  l.rect(5, 4, 54, 26, NE(7));
  l.rect(5, 4, 54, 1, NE(6));
  l.rect(58, 5, 1, 25, NE(6));
  l.rect(5, 29, 54, 1, NE(6));
  // Un diagrama: dos cajas unidas por una flecha, notas adhesivas y renglones.
  l.rectBorde(9, 8, 14, 9, VI(1));
  l.rectBorde(31, 8, 14, 9, 'rojo-3');
  l.rect(23, 12, 8, 1, NE(4));
  l.rect(28, 11, 1, 3, NE(4));
  l.rect(12, 11, 8, 1, NE(5));
  l.rect(12, 13, 5, 1, NE(5));
  l.rect(34, 11, 8, 1, NE(5));
  l.rect(34, 13, 5, 1, NE(5));
  notaAdhesiva(l, 9, 21, 'tela-calida-3', 'tela-calida-1');
  notaAdhesiva(l, 17, 21, 'rojo-4', 'rojo-3');
  notaAdhesiva(l, 25, 21, 'planta-4', 'planta-3');
  l.linea(36, 25, 52, 20, VI(1));
  l.rect(48, 8, 7, 1, NE(5));
  l.rect(48, 10, 5, 1, NE(5));
  return cerrar(l);
}

function pizarronE(): Lienzo {
  const l = new Lienzo(32, 80);
  // Patas en A vistas de lado, con ruedas.
  l.linea(14, 52, 8, 72, ME(2));
  l.linea(15, 52, 9, 72, ME(1));
  l.linea(17, 52, 23, 72, ME(2));
  l.linea(18, 52, 24, 72, ME(1));
  for (const x of [6, 22]) l.rect(x, 72, 5, 2, AZ(2));
  l.rect(9, 62, 15, 1, ME(1));
  // Tablero de canto y bandeja que asoma al frente (hacia el este).
  l.rect(12, 8, 8, 44, ME(3));
  l.rect(12, 8, 1, 44, 'blanco');
  l.rect(19, 9, 1, 43, ME(1));
  l.rect(14, 10, 3, 40, NE(7));
  l.rect(14, 10, 1, 40, NE(6));
  l.rect(20, 46, 5, 3, ME(2));
  l.rect(20, 46, 5, 1, ME(3));
  l.rect(20, 48, 5, 1, ME(1));
  return cerrar(l);
}

// ---------------------------------------------------------------------------
// Muro Kanban (3 x 1, sobresale 16, montado, luz siempre): tablero digital con tres columnas
// ---------------------------------------------------------------------------

function tarjeta(l: Lienzo, x: number, y: number, ancho: number, etiqueta: string): void {
  l.rect(x, y, ancho, 5, 'blanco');
  l.rect(x, y + 4, ancho, 1, NE(6));
  l.rect(x, y, 2, 5, etiqueta);
  l.rect(x + 4, y + 2, Math.max(4, ancho - 9), 1, VI(1));
}

function kanbanS(): Lienzo {
  const l = new Lienzo(96, 48);
  l.rect(3, 3, 90, 31, AZ(1));
  l.rect(3, 3, 90, 1, AZ(2));
  l.rect(3, 3, 1, 31, AZ(2));
  l.rect(92, 4, 1, 30, AZ(0));
  l.rect(4, 33, 88, 1, AZ(0));
  l.rect(5, 5, 86, 27, VI(3));
  // Tres columnas con encabezado de color y tarjetas.
  const columnas: Array<[number, string, number[]]> = [
    [7, 'rojo-3', [11, 17, 23]],
    [36, 'tela-calida-2', [11, 17]],
    [65, 'planta-3', [11, 17, 23]],
  ];
  for (const [x, color, ys] of columnas) {
    l.rect(x, 6, 26, 4, color);
    l.rect(x, 9, 26, 1, color === 'rojo-3' ? 'rojo-2' : color === 'planta-3' ? 'planta-2' : 'tela-calida-1');
    l.rect(x + 2, 7, 10, 1, 'blanco');
    for (const y of ys) tarjeta(l, x, y, 26, color);
    // Hueco para la próxima tarjeta.
    l.rectBorde(x, (ys[ys.length - 1] ?? 11) + 6, 26, 5, VI(2));
  }
  return cerrar(l);
}

function kanbanLateral(mira: 'E' | 'O'): Lienzo {
  const l = new Lienzo(32, 112);
  laminaLateral(l, mira, 6, 78, 6, { luz: AZ(2), medio: AZ(1), oscuro: AZ(0), borde: VI(3) });
  return cerrar(l);
}

// ---------------------------------------------------------------------------
// Mesa de Teams (2 x 1, luz siempre): mesa con una consola táctil en el centro
// ---------------------------------------------------------------------------

/** Glifo de videollamada genérico: una cámara blanca sobre azul. No imita ningún logo. */
function glifoLlamada(l: Lienzo, x: number, y: number): void {
  l.rect(x, y, 10, 7, VI(1));
  l.rect(x, y, 10, 1, VI(2));
  l.rect(x + 1, y + 2, 5, 4, 'blanco');
  l.rect(x + 1, y + 5, 5, 1, NE(6));
  l.rect(x + 6, y + 3, 1, 2, 'blanco');
  l.rect(x + 7, y + 2, 2, 4, 'blanco');
  l.px(x + 9, y + 2, VI(1));
  l.px(x + 9, y + 5, VI(1));
}

/** Mesa de laminado claro con dos parlantes y una consola de pantalla azul. Sirve de frente y de lado. */
function mesaTeams(orientacion: 'S' | 'E'): Lienzo {
  const ancho = orientacion === 'S' ? 64 : 32;
  const alto = orientacion === 'S' ? 32 : 64;
  const l = new Lienzo(ancho, alto);
  const fondo = alto - 16;
  l.caja({ x: 3, y: 2, ancho: ancho - 6, fondo, alto: 3, superior: NE(6), frontal: NE(4), luz: NE(7), filo: NE(5), sombra: NE(3) });
  l.rect(ancho - 4, 3, 1, fondo - 1, NE(5));
  // Patas de metal en las dos esquinas del frente.
  for (const x of [5, ancho - 8]) {
    l.rect(x, alto - 11, 1, 8, ME(3));
    l.rect(x + 1, alto - 11, 1, 8, ME(2));
    l.rect(x + 2, alto - 11, 1, 8, ME(1));
    l.rect(x, alto - 4, 3, 1, ME(0));
  }
  // Consola: bisel oscuro, pantalla azul profundo y glifo.
  const cx = Math.floor(ancho / 2);
  const cy = 2 + Math.floor(fondo / 2);
  l.rect(cx - 12, cy - 6, 24, 12, AZ(1));
  l.rect(cx - 12, cy - 6, 24, 1, AZ(2));
  l.rect(cx - 12, cy - 6, 1, 12, AZ(2));
  l.rect(cx - 11, cy - 5, 22, 10, VI(0));
  l.rect(cx - 11, cy - 5, 22, 1, VI(1));
  glifoLlamada(l, cx - 5, cy - 3);
  l.rect(cx - 10, cy + 3, 6, 1, VI(2));
  l.rect(cx + 4, cy + 3, 6, 1, VI(2));
  // Dos parlantes redondos junto a la consola.
  const parlantes = orientacion === 'S' ? [[9, cy - 2], [ancho - 14, cy - 2]] : [[cx - 2, 6], [cx - 2, alto - 24]];
  for (const [px, py] of parlantes) {
    l.elipse((px ?? 0) + 2, (py ?? 0) + 2, 2.5, 2.5, NE(3));
    l.rect((px ?? 0) + 1, (py ?? 0) + 1, 2, 1, NE(4));
  }
  // Franja de luz azul en el borde del frente.
  l.rect(8, 2 + fondo - 1, ancho - 16, 1, VI(3));
  return cerrar(l);
}

// ---------------------------------------------------------------------------
// Cartel de zona (1 x 1, sobresale 16, montado): una placa con rayas en lugar de texto
// ---------------------------------------------------------------------------

function cartelS(): Lienzo {
  const l = new Lienzo(32, 48);
  // Placa oscura con dos renglones de rayas y un cuadrado rojo (el sitio del logo).
  l.rect(3, 12, 26, 18, AZ(1));
  l.rect(3, 12, 26, 1, AZ(2));
  l.rect(3, 12, 1, 18, AZ(2));
  l.rect(28, 13, 1, 17, AZ(0));
  l.rect(4, 29, 24, 1, AZ(0));
  l.rect(6, 15, 5, 5, 'rojo-3');
  l.rect(6, 15, 5, 1, 'rojo-4');
  l.rect(6, 19, 5, 1, 'rojo-2');
  l.rect(13, 16, 12, 2, 'blanco');
  l.rect(13, 20, 8, 1, NE(5));
  l.rect(6, 24, 19, 1, NE(4));
  l.rect(6, 26, 13, 1, NE(4));
  // Dos tornillos de metal en las esquinas de arriba.
  l.px(5, 14, ME(3));
  l.px(26, 14, ME(3));
  return cerrar(l);
}

function cartelLateral(mira: 'E' | 'O'): Lienzo {
  const l = new Lienzo(32, 48);
  laminaLateral(l, mira, 10, 34, 5, { luz: AZ(2), medio: AZ(1), oscuro: AZ(0), borde: 'rojo-3' });
  return cerrar(l);
}

export function dibujarColaboracion(salida: Cuadros): void {
  registrarObjeto(salida, 'pizarron', (clave) => (clave === 'S' ? pizarronS() : pizarronE()));
  registrarObjeto(salida, 'muro-kanban', (clave) => (clave === 'S' ? kanbanS() : kanbanLateral(clave === 'E' ? 'E' : 'O')));
  registrarObjeto(salida, 'mesa-teams', (clave) => mesaTeams(clave === 'S' ? 'S' : 'E'));
  registrarObjeto(salida, 'cartel-zona', (clave) => (clave === 'S' ? cartelS() : cartelLateral(clave === 'E' ? 'E' : 'O')));
}
