import type { Direccion } from '@ol/shared';
import { cabina, DURACION_CABINA, DURACION_LOBBY, DURACION_PASILLO, ESPERA_CABINA, lobby, pasillo } from './ascensor';
import { ALTO, ANCHO, acotar, azar, elipse, entre, marco, rect, suavizar, tramo, type Ctx } from './dibujo';
import { C, marcaPixel, paso, personaje, sombraPies, texto, type ImagenesNaos, type RecursosIngreso } from './piezas';

export type { ImagenesAscensor, ImagenesNaos, RecursosIngreso } from './piezas';

/**
 * El ingreso animado: tu personaje llega al edificio, entra, sube en el ascensor y sale a la oficina.
 * Cuatro escenas dibujadas con código en pixel art (lienzo lógico de 640x360). La animación espera en el ascensor
 * hasta que la oficina esté lista, así nunca se corta una carga lenta.
 */

/** Medidas de la escena de la fachada (de fachada-naos-meta.json). */
const NAOS = { puerta: { x: 372, y: 194, ancho: 40, alto: 58 }, centroX: 392, yPies: 298, umbralY: 258 } as const;

export const DURACION = { fachada: 3.5, lobby: DURACION_LOBBY, cabina: DURACION_CABINA, pasillo: DURACION_PASILLO } as const;
const INI = {
  fachada: 0,
  lobby: DURACION.fachada,
  cabina: DURACION.fachada + DURACION.lobby,
  pasillo: DURACION.fachada + DURACION.lobby + DURACION.cabina,
} as const;
/** El personaje sale del ascensor, camina por el pasillo hacia la derecha hasta salir de cuadro: ahí empieza el fundido a la oficina. */
export const TOTAL = INI.pasillo + DURACION.pasillo;
/** Instante hasta el que se puede llegar sin tener la oficina lista: la cabina ya llegó al 4 y espera con las puertas cerradas. */
export const PUNTO_DE_ESPERA = INI.cabina + ESPERA_CABINA;
/** Cuadro fijo para quien prefiere menos movimiento: el pasillo, con el personaje caminando hacia la derecha. */
export const T_ESTATICO = INI.pasillo + 2.9;

export interface InfoCuadro {
  texto: string;
  /** 0 a 1 sobre la duración mínima. */
  avance: number;
  fin: boolean;
}

// ---------- piezas ----------

function nube(c: Ctx, x: number, y: number, color: string, escala = 1): void {
  const e = (cx: number, cy: number, rx: number, ry: number) => elipse(c, color, x + cx * escala, y + cy * escala, rx * escala, ry * escala);
  e(0, 0, 22, 7);
  e(-12, -5, 12, 7);
  e(8, -8, 14, 9);
  e(22, -1, 12, 5);
}

function arbol(c: Ctx, x: number, yBase: number, noche: boolean): void {
  rect(c, C.madera[1], x - 3, yBase - 26, 6, 26);
  rect(c, C.madera[0], x + 1, yBase - 26, 2, 26);
  const hojas = noche ? ['#1F4234', '#2F5A4B', '#3E6F58'] : [C.verde[1], C.verde[2], C.verde[3]];
  elipse(c, hojas[0] as string, x, yBase - 44, 24, 21);
  elipse(c, hojas[1] as string, x - 3, yBase - 48, 20, 17);
  elipse(c, hojas[2] as string, x - 7, yBase - 53, 11, 8);
  elipse(c, '#000000', x, yBase, 14, 3);
}

function farola(c: Ctx, x: number, yBase: number, noche: boolean): void {
  rect(c, C.metal[1], x - 1, yBase - 70, 3, 70);
  rect(c, C.metal[0], x + 1, yBase - 70, 1, 70);
  rect(c, C.metal[1], x - 7, yBase - 74, 15, 5);
  rect(c, noche ? C.luz : C.metal[3], x - 5, yBase - 70, 11, 3);
  if (noche) {
    c.globalAlpha = 0.18;
    elipse(c, C.luz, x, yBase - 56, 34, 40);
    c.globalAlpha = 0.14;
    elipse(c, C.luz, x, yBase - 8, 28, 5);
    c.globalAlpha = 1;
  }
}

function bancoPlaya(c: Ctx, x: number, yBase: number): void {
  rect(c, C.madera[2], x, yBase - 14, 46, 5);
  rect(c, C.madera[1], x, yBase - 9, 46, 2);
  rect(c, C.madera[2], x, yBase - 26, 46, 4);
  rect(c, C.madera[2], x, yBase - 21, 46, 4);
  rect(c, C.metal[1], x + 4, yBase - 9, 3, 9);
  rect(c, C.metal[1], x + 39, yBase - 9, 3, 9);
}

function planta(c: Ctx, x: number, yBase: number, escala = 1): void {
  const w = (n: number) => Math.round(n * escala);
  rect(c, '#B8623C', x - w(7), yBase - w(14), w(14), w(14));
  rect(c, '#8E4627', x - w(8), yBase - w(14), w(16), w(3));
  for (const [dx, dy, rx, ry, col] of [
    [0, -26, 13, 15, C.verde[1]],
    [-6, -30, 10, 13, C.verde[2]],
    [6, -34, 9, 12, C.verde[2]],
    [0, -40, 6, 8, C.verde[3]],
  ] as const) elipse(c, col, x + w(dx), yBase + w(dy), w(rx), w(ry));
}

function ventana(c: Ctx, x: number, y: number, w: number, h: number, encendida: boolean, noche: boolean): void {
  rect(c, C.lavanda[0], x - 1, y - 1, w + 2, h + 2);
  if (encendida) {
    rect(c, C.luz, x, y, w, h);
    rect(c, '#FFF6D6', x, y, w, 3);
  } else {
    rect(c, noche ? '#2D3A7A' : C.vidrio[2], x, y, w, h);
    rect(c, noche ? '#3D4C94' : C.vidrio[3], x, y, w, 3);
    rect(c, noche ? '#27336B' : C.vidrio[1], x, y + h - 4, w, 4);
  }
  rect(c, C.lavanda[0], x + Math.round(w / 2), y, 1, h);
}

function ladrillo(c: Ctx, x0: number, y0: number, w: number, h: number, base: string, junta: string): void {
  rect(c, base, x0, y0, w, h);
  for (let y = y0, fila = 0; y < y0 + h; y += 12, fila++) {
    rect(c, junta, x0, y, w, 1);
    const despl = fila % 2 === 0 ? 0 : 20;
    for (let x = x0 - despl; x < x0 + w; x += 40) if (x >= x0) rect(c, junta, x, y, 1, Math.min(12, y0 + h - y));
  }
}

// ---------- escena 1: la fachada ----------

function fachada(c: Ctx, r: RecursosIngreso, t: number): void {
  if (r.naos) fachadaNaos(c, r, r.naos, t);
  else fachadaRespaldo(c, r, t);
}

/** La fachada real: el personaje camina por la acera, la puerta de vidrio se abre y entra. */
function fachadaNaos(c: Ctx, r: RecursosIngreso, im: ImagenesNaos, t: number): void {
  c.drawImage(r.noche ? im.noche : im.dia, 0, 0);
  const { puerta } = NAOS;
  const abre = suavizar(tramo(t, 1.7, 2.15)) * (1 - suavizar(tramo(t, 3.05, 3.4)));
  const g = Math.round(abre * 17);
  c.drawImage(im.interior, puerta.x, puerta.y);
  c.drawImage(im.hojaIzq, puerta.x - g, puerta.y);
  c.drawImage(im.hojaDer, puerta.x + puerta.ancho / 2 + g, puerta.y);
  // Camina por la acera hasta la puerta, se voltea hacia ella y entra.
  const llega = tramo(t, 0.45, 2.3);
  const x = entre(-16, NAOS.centroX, llega);
  const sube = suavizar(tramo(t, 2.5, 3.15));
  const y = entre(NAOS.yPies, NAOS.umbralY, sube);
  const alfa = 1 - suavizar(tramo(sube, 0.45, 1));
  const caminaX = t > 0.45 && llega < 1;
  const dir: Direccion = sube > 0 || llega >= 1 ? 'N' : 'E';
  const cuadro = caminaX || (sube > 0 && sube < 1) ? paso(t) : 0;
  if (alfa > 0.02) {
    sombraPies(c, x, y, 0.28 * alfa, 14);
    personaje(c, r, dir, cuadro, x, y, alfa);
  }
}

function fachadaRespaldo(c: Ctx, r: RecursosIngreso, t: number): void {
  const noche = r.noche;
  // Cielo.
  const bandas = noche ? ['#0E1230', '#141A42', '#1B2250', '#222C60', '#2D3A7A'] : ['#A9CDEE', '#BFD9F2', '#D2E4F6', '#E4EEF9', '#F1F5FB'];
  bandas.forEach((col, i) => rect(c, col, 0, i * 44, ANCHO, 46));
  rect(c, bandas[4] as string, 0, 220, ANCHO, 40);
  if (noche) {
    const az = azar(7);
    for (let i = 0; i < 46; i++) {
      const parp = 0.5 + 0.5 * Math.sin(t * 2 + i);
      c.globalAlpha = 0.45 + parp * 0.5;
      rect(c, '#FFFFFF', Math.floor(az() * ANCHO), Math.floor(az() * 170), 1, 1);
    }
    c.globalAlpha = 1;
    elipse(c, '#F6F1D5', 92, 56, 15, 15);
    elipse(c, '#0E1230', 99, 52, 13, 13);
  } else {
    c.globalAlpha = 0.35;
    elipse(c, '#FFF6C9', 96, 54, 28, 28);
    c.globalAlpha = 1;
    elipse(c, '#FFF1B8', 96, 54, 17, 17);
    nube(c, ((t * 7 + 40) % 760) - 60, 62, '#FFFFFF', 1.1);
    nube(c, ((t * 5 + 300) % 760) - 60, 36, '#F4F8FD', 0.8);
    nube(c, ((t * 9 + 520) % 760) - 60, 96, '#FFFFFF', 0.9);
  }

  // Edificios lejanos.
  const lejos = noche ? '#1B2250' : '#C7D5EC';
  const lejos2 = noche ? '#222C60' : '#B7C8E4';
  const az = azar(11);
  for (let x = -10, i = 0; x < 230; x += 38 + Math.floor(az() * 14), i++) {
    const h = 70 + Math.floor(az() * 90);
    rect(c, i % 2 ? lejos : lejos2, x, 250 - h, 40, h);
    if (noche) for (let k = 0; k < 6; k++) if (az() > 0.55) rect(c, '#FFE9A8', x + 6 + (k % 3) * 11, 250 - h + 10 + Math.floor(k / 3) * 14, 5, 6);
  }

  // Naos Empresarial: cuerpo de vidrio con celosías horizontales y esquina redonda de concreto con terrazas.
  const X0 = 236;
  const X1 = 556;
  const TOPE = 30;
  const BASE = 214;
  const concreto = noche ? ['#4A4D63', '#5E6178', '#767A92'] : ['#9A9DA6', '#B5B8C0', '#D2D4DA'];
  const vid = noche ? ['#1F2A66', '#2D3A7A', '#3D4C94'] : ['#3E5F8E', '#5D86B4', '#8FB5D8'];
  rect(c, vid[1] as string, X0, TOPE, X1 - X0, BASE - TOPE);
  rect(c, vid[0] as string, X0, TOPE, X1 - X0, 6);
  const FILAS = 5;
  const alto = (BASE - TOPE - 8) / FILAS;
  const azv = azar(31);
  for (let f = 0; f < FILAS; f++) {
    const y0 = TOPE + 8 + f * alto;
    const piso4 = f === 2; // contando desde abajo, la tercera franja es el piso 4: el de la oficina
    for (let x = X0 + 6; x < X1 - 6; x += 20) {
      const enc = piso4 || (noche && azv() > 0.55);
      rect(c, enc ? C.luz : (vid[2] as string), x, y0 + 5, 16, alto - 12);
      if (enc && !piso4) c.globalAlpha = 1;
    }
    // Celosías: líneas finas y una losa más gruesa entre pisos.
    for (let y = y0 + 3; y < y0 + alto - 3; y += 4) rect(c, '#2E3644', X0, y, X1 - X0, 1);
    rect(c, '#566274', X0, y0 + alto - 3, X1 - X0, 3);
  }
  rect(c, '#2E3644', X0 - 3, TOPE - 4, X1 - X0 + 6, 5);
  // Esquina redonda: tambor de concreto con losas curvas, celosías en anillos y árboles en las terrazas.
  const TX = X1 - 4;
  const TW = 64;
  rect(c, concreto[1] as string, TX, TOPE + 6, TW, BASE - TOPE - 6);
  elipse(c, concreto[1] as string, TX + TW / 2, TOPE + 6, TW / 2, 9);
  rect(c, concreto[0] as string, TX, TOPE + 6, 8, BASE - TOPE - 6);
  rect(c, concreto[2] as string, TX + TW - 10, TOPE + 6, 10, BASE - TOPE - 6);
  for (let f = 0; f < FILAS; f++) {
    const y0 = TOPE + 8 + f * alto;
    rect(c, '#2E3644', TX, y0 + alto - 4, TW, 2);
    rect(c, concreto[2] as string, TX + 2, y0 + alto - 2, TW - 4, 3);
    for (let y = y0 + 2; y < y0 + alto - 5; y += 4) rect(c, '#566274', TX, y, TW, 1);
    if (f === 1 || f === 3) {
      rect(c, '#6B4A3A', TX + 30, y0 + alto - 14, 2, 11);
      elipse(c, noche ? '#2F5A4B' : '#4E8468', TX + 31, y0 + alto - 18, 6, 5);
      elipse(c, noche ? '#3E6F58' : '#77AA88', TX + 29, y0 + alto - 21, 4, 3);
    }
  }
  rect(c, '#2E3644', TX - 2, TOPE + 1, TW + 4, 3);

  // Base de concreto con el nombre del edificio y la entrada de vidrio.
  rect(c, concreto[1] as string, X0, BASE, X1 + TW - 4 - X0, 250 - BASE);
  rect(c, concreto[2] as string, X0, BASE, X1 + TW - 4 - X0, 2);
  for (let x = X0 + 14; x < X1 + TW - 8; x += 38) for (let y = BASE + 8; y < 248; y += 14) rect(c, concreto[0] as string, x, y, 2, 2);
  texto(c, 'NAOS', 584, 240, 11, noche ? '#C4C9EE' : '#3A3D4C');
  const puertaX = 400;
  const puertaY = 190;
  rect(c, '#566274', puertaX - 6, puertaY - 6, 72, 66);
  rect(c, '#2D3A7A', puertaX, puertaY, 60, 60);
  const avatarX = fachadaX(t);
  const abre = suavizar(tramo(t, 1.55, 1.95)) * (1 - suavizar(tramo(t, 2.65, 3.05)));
  const gap = Math.round(abre * 26);
  for (const lado of [-1, 1] as const) {
    const px = lado === -1 ? puertaX + 0 - gap : puertaX + 30 + gap;
    c.save();
    c.beginPath();
    c.rect(puertaX, puertaY, 60, 60);
    c.clip();
    rect(c, C.vidrio[2], px, puertaY, 30, 60);
    rect(c, C.vidrio[3], px + 4, puertaY + 4, 4, 52);
    rect(c, C.vidrio[1], px, puertaY + 38, 30, 22);
    rect(c, C.metal[3], px, puertaY, 30, 2);
    rect(c, C.metal[3], px + (lado === -1 ? 28 : 0), puertaY, 2, 60);
    c.restore();
  }
  // Letrero de la entrada: nombre del edificio y la marca de la plataforma.
  rect(c, C.navy, 374, 164, 112, 20);
  marco(c, C.navy3, 374, 164, 112, 20);
  texto(c, 'NAOS EMPRESARIAL', 430, 177, 9, '#FFFFFF', 'center', '"Inter Variable", sans-serif');
  rect(c, C.navy, 392, 148, 76, 14);
  marcaPixel(c, 397, 151, 9);
  texto(c, 'Oficina Live', 409, 160, 9, '#FFFFFF');
  if (noche) {
    c.globalAlpha = 0.18;
    elipse(c, C.luz, 430, 236, 70, 16);
    c.globalAlpha = 1;
  }

  // Acera, borde y calle.
  ladrillo(c, 0, 250, ANCHO, 50, C.crema[2], C.crema[1]);
  rect(c, C.crema[3], 0, 250, ANCHO, 2);
  rect(c, C.crema[0], 0, 298, ANCHO, 7);
  rect(c, '#6B7080', 0, 305, ANCHO, 55);
  rect(c, '#585C70', 0, 305, ANCHO, 3);
  for (let x = 14; x < ANCHO; x += 60) rect(c, C.crema[2], x, 336, 32, 3);

  // Decoración de la calle.
  farola(c, 24, 280, noche);
  arbol(c, 92, 282, noche);
  bancoPlaya(c, 150, 276);
  farola(c, 232, 280, noche);
  arbol(c, 520, 284, noche);
  planta(c, 340, 258, 0.9);
  planta(c, 480, 258, 0.9);
  if (noche) {
    c.globalAlpha = 0.18;
    rect(c, '#0E1230', 0, 0, ANCHO, 250);
    c.globalAlpha = 1;
  }

  // El personaje camina por la acera hacia la puerta y entra.
  const yPies = 284;
  const camina = t > 0.45 && avatarX < 430;
  const alfa = 1 - suavizar(tramo(avatarX, 412, 440));
  if (alfa > 0.02) {
    sombraPies(c, avatarX, yPies, 0.28 * alfa, 14);
    personaje(c, r, 'E', camina ? paso(t) : 0, avatarX, yPies, alfa);
  }
}

/** Posición del personaje en la fachada: entra por la izquierda a ritmo constante y se detiene en la puerta. */
function fachadaX(t: number): number {
  return entre(-24, 430, acotar((t - 0.45) / 2.35));
}

// ---------- director ----------

const TEXTO_ESCENA = ['Llegando al edificio…', 'En el lobby…', 'Subiendo al piso 4…', 'Llegaste al piso 4…'] as const;

/** Dibuja el cuadro del instante `t` (segundos de animación). `reloj` es el tiempo real y sirve para los parpadeos. */
export function dibujarCuadro(c: Ctx, r: RecursosIngreso, t: number, reloj: number, listo: boolean): InfoCuadro {
  c.imageSmoothingEnabled = false;
  c.clearRect(0, 0, ANCHO, ALTO);
  let escena: 0 | 1 | 2 | 3;
  if (t < INI.lobby) {
    escena = 0;
    fachada(c, r, t - INI.fachada);
  } else if (t < INI.cabina) {
    escena = 1;
    lobby(c, r, t - INI.lobby);
  } else if (t < INI.pasillo) {
    escena = 2;
    const local = t - INI.cabina;
    cabina(c, r, local, local >= ESPERA_CABINA && !listo, reloj);
  } else {
    escena = 3;
    pasillo(c, r, t - INI.pasillo, reloj);
  }
  // Fundido a negro corto entre escenas.
  for (const corte of [INI.lobby, INI.cabina, INI.pasillo] as const) {
    const d = Math.abs(t - corte);
    if (d < 0.18) {
      c.globalAlpha = 1 - d / 0.18;
      rect(c, '#0B0C14', 0, 0, ANCHO, ALTO);
      c.globalAlpha = 1;
    }
  }
  // Entrada desde negro.
  if (t < 0.4) {
    c.globalAlpha = 1 - t / 0.4;
    rect(c, '#0B0C14', 0, 0, ANCHO, ALTO);
    c.globalAlpha = 1;
  }
  return { texto: TEXTO_ESCENA[escena], avance: acotar(t / TOTAL), fin: t >= TOTAL };
}

/** Segundos en que empieza cada escena, para posicionar la barra de avance y saltar en pruebas. */
export const INICIOS = INI;
