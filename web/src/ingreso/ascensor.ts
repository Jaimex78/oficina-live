import type { Direccion } from '@ol/shared';
import { ALTO, ANCHO, entre, rect, suavizar, tramo, type Ctx } from './dibujo';
import { cono, enCuadricula, halo, marcaPixel, paso, parpadeo, personajeG, sombraPies, texto, texto3x5, velo, type ImagenesAscensor, type RecursosIngreso } from './piezas';

/**
 * Escenas 2, 3 y 4 del ingreso: el lobby, la cabina del ascensor y la llegada al piso 4.
 * El arte sale de `arte/src/ingreso/ascensor.ts` (cuadrícula de 320 x 180, ampliada 2x) y las luces se animan aquí.
 * Las medidas de abajo repiten las de `GEO` en ese archivo.
 */

const MARCO = { ancho: 56, alto: 70, abertura: { x: 10, y: 22, ancho: 36, alto: 46 }, indicador: { x: 18, y: 7 } } as const;
const HOJA_ANCHO = 18;
const LOBBY = { sueloY: 104, marcoX: 200, marcoY: 34, llamadaX: 187, llamadaY: 72, lamparas: [60, 150, 255] } as const;
const CABINA = {
  ox: 80,
  lampara: { x: 80, y: 4 },
  indicador: { x: 52, y: 17, ancho: 56, alto: 8 },
  botones: { x: [147, 153], y: [97, 87, 77, 67] },
  personaje: { x: 80, y: 138 },
} as const;
const PASILLO = {
  sueloY: 120,
  marcoX: 14,
  marcoY: 50,
  placa: { x: 96, y: 46, ancho: 80, alto: 20 },
  puerta: { x: 232, y: 66, ancho: 30, alto: 54 },
  pantalla: { x: 195, y: 82, ancho: 18, alto: 14 },
  fluorescentes: [60, 150, 240],
  yPies: 148,
} as const;

export const DURACION_LOBBY = 5.0;
export const DURACION_CABINA = 3.3;
export const DURACION_PASILLO = 4.6;
/** En la cabina, desde este instante (local) la animación espera si la oficina aún no está lista. */
export const ESPERA_CABINA = 3.2;

/** Estado de las puertas en tres pasos: cerrada, abriéndose y abierta (0, 9 y 18 px de separación por hoja). */
const pasos3 = (t: number, a1: number, a2: number): number => (t < a1 ? 0 : t < a2 ? 9 : HOJA_ANCHO);

const NEGRO_LUZ = '#0E0D12';
const AMBAR = ['#7A4A08', '#C98410', '#FFC21A', '#FFE27A'] as const;

function arrancar(A: ImagenesAscensor | null, g: Ctx): A is ImagenesAscensor {
  if (A) return true;
  rect(g, '#141828', 0, 0, 320, 180);
  return false;
}

interface OpcionesUnidad {
  /** Separación de cada hoja respecto al centro (0 a 18). */
  gap: number;
  /** 0 = cabina apagada, 1 = encendida. */
  luz: number;
  /** Número del indicador de piso. */
  piso: string;
  flecha: boolean;
  /** Lo que ocurre dentro de la cabina (el personaje que entra o espera). */
  dentro?: () => void;
}

/** El ascensor visto de frente: interior, personaje, hojas y marco, en ese orden, más el indicador de piso. */
function unidad(g: Ctx, A: ImagenesAscensor, x: number, y: number, o: OpcionesUnidad): void {
  const a = MARCO.abertura;
  const ax = x + a.x;
  const ay = y + a.y;
  g.save();
  g.beginPath();
  g.rect(ax, ay, a.ancho, a.alto);
  g.clip();
  g.drawImage(A.interior, ax, ay);
  o.dentro?.();
  if (o.luz < 1) {
    g.globalAlpha = (1 - o.luz) * 0.9;
    rect(g, NEGRO_LUZ, ax, ay, a.ancho, a.alto);
    g.globalAlpha = 1;
  }
  if (o.luz > 0) halo(g, ax + 18, ay + 4, 18, 12, '#FFE9A8', 0.22 * o.luz);
  if (o.gap < HOJA_ANCHO) {
    g.drawImage(A.hojaIzq, ax - o.gap, ay);
    g.drawImage(A.hojaDer, ax + HOJA_ANCHO + o.gap, ay);
  }
  g.restore();
  g.drawImage(A.marco, x, y);
  // Indicador de piso: flecha y número en ámbar.
  const ix = x + MARCO.indicador.x;
  const iy = y + MARCO.indicador.y;
  if (o.flecha) {
    rect(g, AMBAR[2], ix + 4, iy + 1, 1, 1);
    rect(g, AMBAR[2], ix + 3, iy + 2, 3, 1);
    rect(g, AMBAR[3], ix + 2, iy + 3, 5, 1);
    halo(g, ix + 4, iy + 2, 9, 5, AMBAR[2], 0.14);
  }
  texto3x5(g, o.piso, ix + 12, iy, AMBAR[3]);
  halo(g, ix + 13, iy + 2, 8, 5, AMBAR[2], 0.1);
}

// ---------- escena 2: el lobby ----------

export function lobby(c: Ctx, r: RecursosIngreso, t: number): void {
  enCuadricula(c, (g) => {
    const A = r.asc;
    if (!arrancar(A, g) || !A) return;
    g.drawImage(A.lobby, 0, 0);
    // Luz del lobby: de noche el ambiente baja y los focos cálidos mandan.
    velo(g, '#0A1030', r.noche ? 0.3 : 0.04);
    for (const cx of LOBBY.lamparas) {
      halo(g, cx, 16, 34, 18, '#FFE9A8', r.noche ? 0.3 : 0.14);
      cono(g, cx, 12, 36, 80, 30, '#FFE9A8', r.noche ? 0.1 : 0.05);
      halo(g, cx, 140, 44, 7, '#FFE9A8', r.noche ? 0.14 : 0.07);
    }
    const mx = LOBBY.marcoX;
    const my = LOBBY.marcoY;
    const centro = mx + MARCO.ancho / 2;
    const llama = t >= 2.45;
    // Puertas: cerrada, abriéndose y abierta; adentro está oscuro y la luz sube después.
    const gap = t < 4.45 ? pasos3(t, 2.7, 2.95) : t < 4.7 ? 9 : 0;
    const luz = suavizar(tramo(t, 3.0, 3.55));
    // Personaje: llega desde la izquierda, se para frente al ascensor, entra de espaldas y se gira de frente.
    const camina = tramo(t, 0.1, 2.2);
    const entra = tramo(t, 3.35, 4.0);
    const xP = entre(-10, centro, camina);
    const yP = entre(LOBBY.sueloY + 14, LOBBY.sueloY - 6, entra);
    const dir: Direccion = t < 0.1 ? 'E' : camina < 1 ? 'E' : t < 4.05 ? 'N' : 'S';
    const moviendo = (camina > 0 && camina < 1) || (entra > 0 && entra < 1);
    const cuadro = moviendo ? paso(t) : 0;
    const dibujaPersona = () => personajeG(g, r, dir, cuadro, xP, yP);
    const adentro = yP < LOBBY.sueloY;
    // Luz que sale por las puertas al piso.
    if (gap >= 9 && luz > 0) cono(g, centro, LOBBY.sueloY, 34, 64, 30, '#FFE0A0', 0.14 * luz);
    unidad(g, A, mx, my, { gap, luz, piso: '1', flecha: llama && t < 3.1, ...(adentro ? { dentro: dibujaPersona } : {}) });
    // Botonera de llamada.
    g.drawImage(A.llamada, LOBBY.llamadaX, LOBBY.llamadaY);
    if (llama) {
      rect(g, AMBAR[2], LOBBY.llamadaX + 2, LOBBY.llamadaY + 3, 4, 3);
      rect(g, AMBAR[3], LOBBY.llamadaX + 3, LOBBY.llamadaY + 3, 2, 1);
      halo(g, LOBBY.llamadaX + 4, LOBBY.llamadaY + 4, 9, 7, AMBAR[2], 0.22);
    }
    if (!adentro) {
      sombraPies(g, xP, yP, 0.28, 7);
      dibujaPersona();
    }
  });
}

// ---------- escena 3: dentro de la cabina ----------

/** Luz de la cabina: encendida al entrar, baja al arrancar y de vuelta al llegar. */
function luzCabina(t: number): number {
  if (t < 0.95) return 1;
  if (t < 1.25) return entre(1, 0.26, suavizar(tramo(t, 0.95, 1.1))) * (Math.floor(t * 30) % 3 === 0 ? 0.8 : 1);
  if (t < 2.45) return 0.26;
  return entre(0.26, 1, suavizar(tramo(t, 2.45, 2.85)));
}

const pisoCabina = (t: number): number => (t < 1.25 ? 1 : t < 1.85 ? 2 : t < 2.45 ? 3 : 4);

export function cabina(c: Ctx, r: RecursosIngreso, t: number, esperando: boolean, reloj: number): void {
  enCuadricula(c, (g) => {
    const A = r.asc;
    rect(g, '#050408', 0, 0, 320, 180);
    if (!arrancar(A, g) || !A) return;
    // Balanceo: un pequeño vaivén al subir, un tirón al arrancar y otro al frenar.
    const viaja = t > 1.0 && t < 2.45;
    let dy = viaja ? Math.round(Math.sin(t * 17) * 0.7) : 0;
    if (t >= 0.95 && t < 1.08) dy = 1;
    if (t >= 2.45 && t < 2.58) dy = -1;
    const dx = viaja ? Math.round(Math.sin(t * 9 + 1) * 0.55) : 0;
    const luz = luzCabina(t);
    const ox = CABINA.ox + dx;
    g.drawImage(A.cabina, ox, dy);
    // Ambiente y luz del techo (más contraste de noche).
    velo(g, '#0A0508', (1 - luz) * 0.8 + (r.noche ? 0.07 : 0));
    const lx = ox + CABINA.lampara.x;
    halo(g, lx, dy + 8, 50, 26, '#FFD890', 0.24 * luz);
    cono(g, lx, dy + 10, 36, 150, 120, '#FFD890', 0.1 * luz);
    halo(g, lx, dy + 3, 14, 5, '#FFF4C8', 0.5 * luz);
    // Indicador de piso: cuatro números, el actual en ámbar y brillante.
    const I = CABINA.indicador;
    const piso = pisoCabina(t);
    const apagado = esperando ? Math.floor(reloj * 3) % 2 === 0 : t >= 2.45 && t < 3.05 && Math.floor(t * 8) % 2 === 0;
    for (let i = 1; i <= 4; i++) {
      const activo = i === piso && !(i === 4 && apagado);
      const nx = ox + I.x + 5 + (i - 1) * 13;
      texto3x5(g, String(i), nx, dy + I.y + 1, activo ? AMBAR[3] : '#A06A12');
      if (activo) halo(g, nx + 1, dy + I.y + 3, 10, 6, AMBAR[2], 0.3);
    }
    // Botonera: todos los botones con luz ámbar; el 4 se enciende en rojo.
    const roja = t >= 0.55;
    CABINA.botones.y.forEach((by, fila) => {
      CABINA.botones.x.forEach((bx, col) => {
        const es4 = fila === 1 && col === 1;
        const rojo = es4 && roja;
        rect(g, rojo ? '#D8262C' : AMBAR[1], ox + bx - 1, dy + by - 1, 3, 3);
        rect(g, rojo ? '#FF5A52' : AMBAR[3], ox + bx, dy + by - 1, 1, 1);
        halo(g, ox + bx, dy + by, rojo ? 9 : 5, rojo ? 9 : 5, rojo ? '#FF5A52' : AMBAR[2], rojo ? 0.4 : 0.14);
      });
    });
    // Personaje de espaldas, mirando las puertas.
    const px = ox + CABINA.personaje.x;
    sombraPies(g, px, CABINA.personaje.y + dy, 0.35, 8);
    personajeG(g, r, 'N', 0, px, CABINA.personaje.y + dy);
  });
}

// ---------- escena 4: llegada al piso 4 ----------

export function pasillo(c: Ctx, r: RecursosIngreso, t: number, reloj: number): void {
  enCuadricula(c, (g) => {
    const A = r.asc;
    if (!arrancar(A, g) || !A) return;
    g.drawImage(A.pasillo, 0, 0);
    // Ambiente oscuro; los fluorescentes y la pantalla ponen la luz encima.
    velo(g, '#10142A', r.noche ? 0.3 : 0.18);
    const f = PASILLO.fluorescentes.map((_cx, i) => parpadeo(reloj, i * 2.1 + 0.4));
    PASILLO.fluorescentes.forEach((cx, i) => {
      const v = f[i] ?? 1;
      g.globalAlpha = Math.min(1, 0.95 * v);
      rect(g, '#FBFFE2', cx - 22, 15, 44, 2);
      g.globalAlpha = 0.5 * v;
      rect(g, '#F4F6C8', cx - 24, 14, 48, 4);
      g.globalAlpha = 1;
      cono(g, cx, 19, 48, 96, 78, '#F4F6C8', 0.1 * v);
      halo(g, cx, 17, 36, 7, '#F4F6C8', 0.22 * v);
    });
    // Pantalla del mostrador: luz azulada sobre la pared y el piso.
    const P = PASILLO.pantalla;
    rect(g, '#3A78D0', P.x, P.y, P.ancho, P.alto);
    rect(g, '#7CB4F2', P.x, P.y, P.ancho, 2);
    rect(g, '#CDE6FF', P.x + 2, P.y + 5, 10, 1);
    rect(g, '#7CB4F2', P.x + 2, P.y + 8, 7, 1);
    rect(g, '#CDE6FF', P.x + 2, P.y + 2 + (Math.floor(reloj * 5) % 10), 5, 1);
    halo(g, P.x + 9, P.y + 6, 34, 24, '#7CB4F2', 0.2);
    halo(g, P.x + 9, PASILLO.sueloY + 8, 40, 7, '#7CB4F2', 0.14);

    // Ascensor: puertas cerradas, abriéndose y abiertas, con la cabina encendida y el 4 en el indicador.
    const gap = pasos3(t, 0.35, 0.65);
    const camS = tramo(t, 0.95, 1.85);
    const cx0 = PASILLO.marcoX + MARCO.ancho / 2;
    const sale = tramo(t, 1.95, 4.2);
    const xP = entre(cx0, 340, sale);
    const yP: number = entre(PASILLO.marcoY + 64, PASILLO.yPies, camS);
    // Al salir camina hacia la derecha por el pasillo hasta salir de cuadro (la cuadrícula mide 320 de ancho).
    const dir: Direccion = sale > 0 ? 'E' : 'S';
    const moviendo = (camS > 0 && camS < 1) || (sale > 0 && sale < 1);
    const cuadro = moviendo ? paso(t) : 0;
    const adentro = yP < PASILLO.sueloY - 1 && sale === 0;
    const alfa = 1;
    const persona = () => personajeG(g, r, dir, cuadro, xP, yP, alfa);
    unidad(g, A, PASILLO.marcoX, PASILLO.marcoY, { gap, luz: 1, piso: '4', flecha: t < 1.3, ...(adentro ? { dentro: persona } : {}) });
    if (gap >= 9) cono(g, cx0, PASILLO.sueloY, 34, 70, 34, '#FFE0A0', 0.14);
    if (!adentro) {
      if (alfa > 0.05) sombraPies(g, xP, yP, 0.3 * alfa, 7);
      persona();
    }
  });
  // Placa de la pared: la marca pixel art y el nombre, en pantalla completa para que se vean nítidos.
  const pl = PASILLO.placa;
  const alto = 20;
  const tam = 17;
  c.font = `700 ${tam}px "Inter Variable", sans-serif`;
  const anchoNombre = c.measureText('Oficina Live').width;
  const total = alto + 8 + anchoNombre;
  const ix = Math.round(pl.x * 2 + (pl.ancho * 2 - total) / 2);
  const ly = pl.y * 2 + (pl.alto * 2 - alto) / 2;
  marcaPixel(c, ix, ly, alto);
  texto(c, 'Oficina Live', ix + alto + 8, ly + alto - 3, tam, '#FFFFFF');
  // Cuando el personaje sale de cuadro, un destello cálido se disuelve en la oficina.
  const flash = suavizar(tramo(t, 4.2, 4.6));
  if (flash > 0) {
    c.globalAlpha = flash;
    rect(c, '#FFF3CF', 0, 0, ANCHO, ALTO);
    c.globalAlpha = 1;
  }
}
