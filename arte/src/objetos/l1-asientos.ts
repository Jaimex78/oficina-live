/**
 * Asientos del lote 1: silla de reunión, puff, butaca y sofá de 3 (la silla de oficina pasó al lote 8, `l8-silla.ts`).
 *
 * Estilo Gather: formas redondeadas y blandas, contorno azul marino de 1 px, dos o tres tonos por superficie.
 *  - Silla de reunión: armazón de madera clara con cojín de asiento y respaldo azul.
 *  - Puff: morado (`morado`), blando, con un destello en espiral.
 *  - Butaca y sofá: tapizado arena (`crema`) con botones, patas de madera.
 *
 * La orientación es hacia donde mira QUIEN SE SIENTA:
 *   S  mira hacia abajo: el respaldo queda arriba, detrás del asiento (se ve el frente de la silla).
 *   N  mira hacia arriba: el respaldo queda delante (se ve la espalda de la silla).
 *   E  mira a la derecha: el respaldo queda a la izquierda y se ve la silla de lado.
 *   O  mira a la izquierda: el respaldo queda a la derecha.
 * La luz viene de arriba a la izquierda en todos: en E y O el brillo y la sombra se reparten por posición
 * en pantalla, no por el lado del frente, así que O no es un espejo de E sino un dibujo propio.
 *
 * Variantes: cada objeto dibuja su base con una rampa de 5 tonos (el tono 0 es el contorno y no se recolorea)
 * y las variantes de color salen de cambiar esa rampa tono a tono.
 */

import { Lienzo } from '../nucleo';
import { cerrar, recolorTonos, registrarObjeto, type Cuadros, type OpcionesRegistro } from './l1-comun';

const AZ = (n: 0 | 1 | 2 | 3 | 4) => `azul-oficina-${n}` as const;
const CR = (n: 0 | 1 | 2 | 3 | 4) => `crema-${n}` as const;
const MC = (n: 0 | 1 | 2 | 3 | 4) => `madera-clara-${n}` as const;
const MR = (n: 0 | 1 | 2 | 3 | 4) => `morado-${n}` as const;

type Tonos5 = readonly [string, string, string, string, string];

// ---------------------------------------------------------------------------
// Variantes de color de las telas: de una rampa de 5 tonos a otra, tono a tono
// ---------------------------------------------------------------------------

const RAMPA_AZUL: Tonos5 = [AZ(0), AZ(1), AZ(2), AZ(3), AZ(4)];
const RAMPA_CREMA: Tonos5 = [CR(0), CR(1), CR(2), CR(3), CR(4)];
const RAMPA_MORADO: Tonos5 = [MR(0), MR(1), MR(2), MR(3), MR(4)];

/** Rampas de destino de cada variante, de 5 tonos (0 es la sombra más profunda y 4 el brillo). */
const DESTINOS_TELA: Record<string, Tonos5> = {
  rojo: ['rojo-suave-0', 'rojo-suave-1', 'rojo-suave-2', 'rojo-suave-3', 'rojo-suave-4'],
  azul: ['vidrio-0', 'vidrio-0', 'vidrio-1', 'vidrio-2', 'vidrio-3'],
  verde: ['planta-0', 'planta-1', 'planta-2', 'planta-3', 'planta-4'],
  amarillo: ['tela-calida-0', 'tela-calida-1', 'tela-calida-2', 'tela-calida-3', 'tela-calida-3'],
  negro: ['neutro-0', 'neutro-1', 'neutro-2', 'neutro-3', 'neutro-4'],
  blanco: ['neutro-4', 'neutro-5', 'neutro-6', 'neutro-7', 'neutro-7'],
  morado: ['morado-0', 'morado-1', 'morado-2', 'morado-3', 'morado-4'],
};

/** Opciones de registro: las variantes cambian solo los tonos 1 a 4 de la rampa base; el contorno azul marino queda. */
function variantesDe(base: Tonos5, destinos: Record<string, Tonos5> = DESTINOS_TELA): OpcionesRegistro {
  return {
    variante: (lienzo, variante) => {
      const destino = destinos[variante];
      if (!destino) return undefined;
      // El tono 0 es el del contorno azul marino y no cambia de color entre variantes.
      return recolorTonos(lienzo, base.slice(1), destino.slice(1));
    },
  };
}

// ---------------------------------------------------------------------------
// Piezas comunes
// ---------------------------------------------------------------------------

/** Cojín en tres capas: sombra (abajo), cuerpo y cara superior con brillo. `t` es la rampa: [sombra, cuerpo, luz]. */
function cojin(l: Lienzo, x: number, y: number, w: number, h: number, radio: number, t: readonly [string, string, string]): void {
  l.rectRedondeado(x, y, w, h, radio, t[0]);
  l.rectRedondeado(x, y, w, h - 2, radio, t[1]);
  l.rectRedondeado(x + 1, y, w - 2, Math.max(2, h - 5), Math.max(1, radio - 1), t[2]);
}

/** Un bloque con luz a la izquierda y sombra a la derecha (por posición en pantalla). */
function bloque(l: Lienzo, x: number, y: number, w: number, h: number, luz: string, medio: string, oscuro: string): void {
  l.rect(x, y, w, h, medio);
  l.rect(x, y, 1, h, luz);
  if (w > 2) l.rect(x + w - 1, y, 1, h, oscuro);
}

// ---------------------------------------------------------------------------
// Silla de reunión (armazón de madera clara con cojín azul)
// ---------------------------------------------------------------------------

function patasDeMadera(l: Lienzo, atras: number, frente: number): void {
  for (const x of [11, 20]) bloque(l, x, 22, 2, atras - 22, MC(3), MC(2), MC(1));
  for (const x of [8, 22]) bloque(l, x, 22, 3, frente - 22, MC(3), MC(2), MC(1));
}

function sillaReunionS(): Lienzo {
  const l = new Lienzo(32, 32);
  patasDeMadera(l, 26, 30);
  // Armazón del asiento y respaldo de madera con cojín azul.
  l.rect(7, 20, 18, 3, MC(2));
  l.rect(7, 20, 18, 1, MC(3));
  l.rect(7, 22, 18, 1, MC(1));
  l.rect(9, 2, 14, 13, MC(2));
  l.rect(9, 2, 14, 2, MC(3));
  l.rect(9, 2, 1, 13, MC(3));
  l.rect(22, 3, 1, 12, MC(1));
  l.rect(11, 5, 10, 8, AZ(2));
  l.rect(11, 5, 10, 1, AZ(3));
  l.rect(11, 5, 1, 8, AZ(3));
  l.rect(20, 6, 1, 7, AZ(1));
  cojin(l, 8, 14, 16, 8, 3, [AZ(1), AZ(2), AZ(3)]);
  return cerrar(l);
}

function sillaReunionN(): Lienzo {
  const l = new Lienzo(32, 32);
  patasDeMadera(l, 26, 30);
  cojin(l, 8, 14, 16, 9, 3, [AZ(1), AZ(2), AZ(3)]);
  l.rect(7, 21, 18, 2, MC(2));
  l.rect(7, 22, 18, 1, MC(1));
  // El respaldo por detrás: madera lisa con travesaño.
  l.rect(9, 4, 14, 17, MC(2));
  l.rect(9, 4, 14, 2, MC(3));
  l.rect(9, 4, 1, 17, MC(3));
  l.rect(22, 5, 1, 16, MC(1));
  l.rect(11, 9, 10, 1, MC(1));
  l.rect(11, 15, 10, 1, MC(1));
  return cerrar(l);
}

function sillaReunionLateral(frente: 'E' | 'O'): Lienzo {
  const l = new Lienzo(32, 32);
  const dx = (x: number, ancho: number) => (frente === 'E' ? x : 32 - x - ancho);
  for (const x of [9, 21]) bloque(l, dx(x, 2), 22, 2, 8, MC(3), MC(2), MC(1));
  l.rect(dx(10, 13), 26, 13, 1, MC(1));
  // Armazón del asiento y cojín.
  l.rect(dx(8, 18), 20, 18, 3, MC(2));
  l.rect(dx(8, 18), 20, 18, 1, MC(3));
  l.rect(dx(8, 18), 22, 18, 1, MC(1));
  cojin(l, dx(9, 16), 15, 16, 7, 3, [AZ(1), AZ(2), AZ(3)]);
  // Respaldo: listón de madera con un cojín azul.
  const xr = dx(8, 5);
  bloque(l, xr, 3, 5, 18, MC(3), MC(2), MC(1));
  l.rect(xr + 1, 5, 3, 9, AZ(2));
  l.rect(xr + 1, 5, 1, 9, AZ(3));
  return cerrar(l);
}

// ---------------------------------------------------------------------------
// Puff (morado, blando, con un destello en espiral)
// ---------------------------------------------------------------------------

function puff(): Lienzo {
  const l = new Lienzo(32, 32);
  // Cuerpo: una cúpula achatada con luz arriba a la izquierda.
  l.elipse(15.5, 21, 12.5, 7, MR(1));
  l.elipseSombreada(15.5, 17, 12.5, 11, [MR(1), MR(2), MR(3), MR(4)], { relieve: 0.7 });
  // Costado más oscuro abajo, para dar peso.
  l.rect(5, 23, 22, 3, MR(1));
  l.elipse(15.5, 25, 10.5, 3, MR(1));
  // Destello en espiral y un botón arriba.
  l.linea(9, 12, 12, 9, MR(4));
  l.linea(10, 13, 14, 9, MR(4));
  l.linea(12, 14, 17, 10, MR(3));
  l.rect(15, 15, 2, 2, MR(1));
  l.px(15, 15, MR(2));
  return cerrar(l);
}

// ---------------------------------------------------------------------------
// Butaca (1 x 1, sobresale 8): sillón bajo de brazos gruesos, tapizado arena con botones
// ---------------------------------------------------------------------------

/** Patas de madera torneada: un taco ancho arriba y una punta más fina. */
function pata(l: Lienzo, x: number, y: number, alto: number): void {
  bloque(l, x, y, 3, alto, MC(3), MC(2), MC(1));
}

/** Botón de tapizado: una cruz de 3 x 3 en el tono oscuro de la tela. */
function boton(l: Lienzo, x: number, y: number, tono: string = CR(1)): void {
  l.px(x, y, tono);
  l.px(x - 1, y, tono);
  l.px(x + 1, y, tono);
  l.px(x, y - 1, tono);
  l.px(x, y + 1, tono);
}

/** Brazo de sillón visto de frente: una columna redondeada con la cara superior clara y el frente en el tono medio. */
function brazoFrente(l: Lienzo, x: number, y: number, ancho: number, alto: number): void {
  l.rectRedondeado(x, y, ancho, alto, 4, CR(1));
  l.rectRedondeado(x, y, ancho, alto - 2, 4, CR(2));
  l.rectRedondeado(x, y, ancho, 7, 4, CR(3));
  l.rect(x + 2, y + 1, ancho - 4, 1, CR(4));
  l.rect(x + 1, y + 7, 1, alto - 11, CR(3));
}

function butacaS(): Lienzo {
  const l = new Lienzo(32, 40);
  pata(l, 5, 35, 3);
  pata(l, 24, 35, 3);
  // Respaldo alto con botones.
  l.rectRedondeado(5, 2, 22, 26, 7, CR(1));
  l.rectRedondeado(5, 2, 22, 24, 7, CR(2));
  l.rect(9, 3, 14, 1, CR(3));
  l.rect(6, 7, 1, 12, CR(3));
  l.rect(25, 8, 1, 14, CR(1));
  boton(l, 12, 11);
  boton(l, 20, 11);
  boton(l, 16, 17);
  // Faldón y asiento entre los brazos.
  l.rectRedondeado(4, 26, 24, 10, 3, CR(1));
  cojin(l, 9, 20, 14, 13, 3, [CR(1), CR(2), CR(3)]);
  l.rect(11, 21, 10, 1, CR(4));
  brazoFrente(l, 2, 13, 9, 24);
  brazoFrente(l, 21, 13, 9, 24);
  return cerrar(l);
}

function butacaN(): Lienzo {
  const l = new Lienzo(32, 40);
  pata(l, 5, 35, 3);
  pata(l, 24, 35, 3);
  l.rectRedondeado(2, 15, 9, 21, 4, CR(1));
  l.rectRedondeado(21, 15, 9, 21, 4, CR(1));
  l.rectRedondeado(2, 15, 9, 19, 4, CR(2));
  l.rectRedondeado(21, 15, 9, 19, 4, CR(2));
  l.rectRedondeado(5, 4, 22, 32, 7, CR(1));
  l.rectRedondeado(5, 4, 22, 30, 7, CR(2));
  l.rect(9, 5, 14, 1, CR(3));
  l.rect(6, 9, 1, 14, CR(3));
  l.rect(25, 10, 1, 22, CR(1));
  l.rect(15, 9, 2, 24, CR(1));
  return cerrar(l);
}

function butacaLateral(frente: 'E' | 'O'): Lienzo {
  const l = new Lienzo(32, 40);
  const dx = (x: number, ancho: number) => (frente === 'E' ? x : 32 - x - ancho);
  pata(l, dx(6, 3), 35, 3);
  pata(l, dx(23, 3), 35, 3);
  // Respaldo: lámina gruesa al fondo.
  const xr = dx(3, 11);
  l.rectRedondeado(xr, 2, 11, 33, 5, CR(1));
  l.rectRedondeado(xr, 2, 11, 31, 5, CR(2));
  l.rect(xr + 1, 3, 9, 1, CR(3));
  l.rect(xr, 6, 1, 21, CR(3));
  // Asiento: cara superior y brazo cercano delante.
  const xa = dx(9, 21);
  l.rectRedondeado(xa, 14, 21, 10, 4, CR(3));
  l.rectRedondeado(xa, 18, 21, 18, 5, CR(1));
  l.rectRedondeado(xa, 18, 21, 16, 5, CR(2));
  l.rectRedondeado(xa, 18, 21, 6, 4, CR(3));
  l.rect(xa, 23, 1, 11, CR(3));
  boton(l, dx(19, 1) + 0, 28);
  return cerrar(l);
}

// ---------------------------------------------------------------------------
// Sofá de 3 (3 x 1, sobresale 8): tapizado arena con botones, tres asientos
// ---------------------------------------------------------------------------

function sofa3S(): Lienzo {
  const l = new Lienzo(96, 40);
  for (const x of [6, 87]) pata(l, x, 36, 3);
  l.rectRedondeado(11, 25, 74, 12, 3, CR(1));
  // Tres cojines de respaldo y tres de asiento entre dos brazos, cada uno con sus botones.
  for (let i = 0; i < 3; i++) {
    const x = 12 + i * 24;
    l.rectRedondeado(x, 3, 24, 20, 5, CR(1));
    l.rectRedondeado(x, 3, 24, 18, 5, CR(2));
    l.rect(x + 3, 4, 18, 1, CR(4));
    l.rect(x + 1, 7, 1, 9, CR(3));
    l.rect(x + 22, 8, 1, 11, CR(1));
    for (const bx of [x + 7, x + 17]) for (const by of [9, 15]) boton(l, bx, by);
  }
  for (let i = 0; i < 3; i++) {
    const x = 12 + i * 24;
    cojin(l, x, 19, 24, 14, 3, [CR(1), CR(2), CR(3)]);
    l.rect(x + 2, 20, 20, 1, CR(4));
    for (const bx of [x + 7, x + 17]) boton(l, bx, 26);
  }
  brazoFrente(l, 1, 11, 11, 26);
  brazoFrente(l, 84, 11, 11, 26);
  return cerrar(l);
}

function sofa3N(): Lienzo {
  const l = new Lienzo(96, 40);
  for (const x of [6, 87]) pata(l, x, 36, 3);
  l.rectRedondeado(1, 14, 11, 23, 4, CR(1));
  l.rectRedondeado(84, 14, 11, 23, 4, CR(1));
  l.rectRedondeado(1, 14, 11, 21, 4, CR(2));
  l.rectRedondeado(84, 14, 11, 21, 4, CR(2));
  l.rectRedondeado(3, 4, 90, 33, 7, CR(1));
  l.rectRedondeado(3, 4, 90, 31, 7, CR(2));
  l.rect(9, 5, 78, 1, CR(3));
  l.rect(4, 9, 1, 14, CR(3));
  l.rect(91, 10, 1, 22, CR(1));
  for (const x of [35, 59]) l.rect(x, 8, 2, 26, CR(1));
  return cerrar(l);
}

/** De lado el sofá se estira hacia abajo: 32 de ancho por 104 de alto, con el respaldo a un costado. */
function sofa3Lateral(frente: 'E' | 'O'): Lienzo {
  const l = new Lienzo(32, 104);
  const dx = (x: number, ancho: number) => (frente === 'E' ? x : 32 - x - ancho);
  for (const y of [18, 98]) {
    pata(l, dx(6, 3), y, 3);
    pata(l, dx(23, 3), y, 3);
  }
  // Brazo del fondo (norte): se ve su cara superior.
  const xb = dx(3, 26);
  l.rectRedondeado(xb, 5, 26, 14, 5, CR(1));
  l.rectRedondeado(xb, 5, 26, 12, 5, CR(3));
  // Respaldo corrido: una banda alta a un costado.
  const xr = dx(3, 10);
  l.rectRedondeado(xr, 10, 10, 86, 5, CR(1));
  l.rectRedondeado(xr, 10, 10, 84, 5, CR(2));
  l.rect(xr, 14, 1, 76, CR(3));
  l.rect(xr + 1, 10, 8, 1, CR(3));
  // Tres cojines de asiento, vistos desde arriba, con botones.
  const xa = dx(11, 17);
  for (let i = 0; i < 3; i++) {
    const y = 17 + i * 25;
    l.rectRedondeado(xa, y, 17, 25, 4, CR(1));
    l.rectRedondeado(xa, y, 17, 23, 4, CR(3));
    l.rect(xa + 1, y + 1, 15, 1, CR(4));
    l.rect(xa + (frente === 'E' ? 16 : 0), y + 3, 1, 19, CR(2));
    boton(l, xa + 8, y + 12);
  }
  // Brazo cercano (sur): se ve el frente completo.
  l.rectRedondeado(xb, 86, 26, 16, 5, CR(1));
  l.rectRedondeado(xb, 86, 26, 14, 5, CR(2));
  l.rectRedondeado(xb, 86, 26, 6, 5, CR(3));
  l.rect(xb + 1, 92, 1, 7, CR(3));
  return cerrar(l);
}

export function dibujarAsientos(salida: Cuadros): void {
  const lateral = (clave: string): 'E' | 'O' => (clave === 'E' ? 'E' : 'O');
  const destinosSilla: Record<string, Tonos5> = {
    rojo: ['rojo-0', 'rojo-1', 'rojo-2', 'rojo-3', 'rojo-4'],
    negro: DESTINOS_TELA.negro as Tonos5,
    blanco: DESTINOS_TELA.blanco as Tonos5,
  };
  registrarObjeto(salida, 'silla-reunion', (clave) => (clave === 'S' ? sillaReunionS() : clave === 'N' ? sillaReunionN() : sillaReunionLateral(lateral(clave))), variantesDe(RAMPA_AZUL, destinosSilla));
  registrarObjeto(salida, 'puff', () => puff(), variantesDe(RAMPA_MORADO));
  registrarObjeto(salida, 'butaca', (clave) => (clave === 'S' ? butacaS() : clave === 'N' ? butacaN() : butacaLateral(lateral(clave))), variantesDe(RAMPA_CREMA));
  registrarObjeto(salida, 'sofa-3', (clave) => (clave === 'S' ? sofa3S() : clave === 'N' ? sofa3N() : sofa3Lateral(lateral(clave))), variantesDe(RAMPA_CREMA));
}

/** Variantes de tela para otros archivos del lote (alfombra grande): de la rampa lavanda a las demás. */
export const VARIANTES_TELA: OpcionesRegistro = variantesDe(RAMPA_CREMA);
