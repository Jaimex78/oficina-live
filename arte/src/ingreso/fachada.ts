/**
 * Constructor `fachada-naos`: la fachada de Naos Empresarial para la pantalla
 * de ingreso y la primera escena del video de entrada.
 *
 * Escribe directo en `web/public/assets/ingreso/` (no necesita `--publicar`:
 * son imágenes sueltas, no un atlas):
 *   fachada-naos-dia.png                 escena de 640 x 360, sin personajes
 *   fachada-naos-noche.png               la misma escena de noche (piso 4 con luz cálida)
 *   fachada-naos-solo-edificio-noche.png recorte de 480 x 360 para el panel oscuro
 *   puerta-naos-hoja-izq.png / -der.png  las dos hojas de la puerta (20 x 58)
 *   puerta-naos-interior.png             el lobby detrás de la puerta (40 x 58)
 *   fachada-naos-meta.json               coordenadas para el código del video
 *
 * Y deja hojas de revisión en `arte/salida/`.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { registrarConstructor } from '../construir';
import type { ContextoConstruccion } from '../construir';
import { Lienzo, codificarPng, jsonLegible, rutaRaiz, validarLienzo } from '../nucleo';
import {
  ALTO_ESCENA,
  ANCHO_ESCENA,
  BORDILLO_Y,
  PIES_Y,
  PUERTA,
  SUELO,
  dibujarEscena,
  geometriaPiso4,
} from './escena-naos';
import { coloresNaos } from './paleta-naos';
import { HOJA_ALTO, HOJA_ANCHO, INTERIOR_ALTO, INTERIOR_ANCHO, hojaPuerta, interiorLobby } from './puerta-naos';

/** Carpeta (desde la raíz del repo) donde quedan las imágenes del ingreso. */
export const DIR_INGRESO = join('web', 'public', 'assets', 'ingreso');

/** Recorte del panel oscuro: 480 x 360 tomado de la escena de noche sin calle. */
export const PANEL = { ancho: 480, alto: 360, x: 132, y: 0 } as const;

/** Medidas del personaje del juego (para la meta y la hoja de revisión). */
const PERSONAJE = { ancho: 32, alto: 48 } as const;
/** Centro horizontal con el que empieza a caminar (fuera de la pantalla) y centro de la puerta. */
const X_INICIO = -16;
const X_PUERTA = PUERTA.x + PUERTA.ancho / 2;

export interface ResultadoFachada {
  dia: Lienzo;
  noche: Lienzo;
  panel: Lienzo;
  hojaIzq: Lienzo;
  hojaDer: Lienzo;
  interior: Lienzo;
  meta: Record<string, unknown>;
}

/** Dibuja todas las imágenes (sin escribir nada). */
export function construirFachadaNaos(): ResultadoFachada {
  const dia = dibujarEscena({ noche: false });
  const noche = dibujarEscena({ noche: true });
  const panelCompleto = dibujarEscena({ noche: true, soloEdificio: true });
  const panel = panelCompleto.recortar(PANEL.x, PANEL.y, PANEL.ancho, PANEL.alto);
  const hojaIzq = hojaPuerta('izq');
  const hojaDer = hojaPuerta('der');
  const interior = interiorLobby();

  const marco = (x: number, y: number, ancho: number, alto: number) => ({ x, y, ancho, alto });
  const piso4 = geometriaPiso4();
  const meta = {
    version: 1,
    edificio: 'Naos Empresarial, Ak 9 con calle 102, Bogotá',
    nota: 'Todas las coordenadas son píxeles de la escena de 640 x 360 (1:1). Se amplía con vecino más cercano.',
    escena: { ancho: ANCHO_ESCENA, alto: ALTO_ESCENA },
    archivos: {
      dia: 'fachada-naos-dia.png',
      noche: 'fachada-naos-noche.png',
      soloEdificioNoche: 'fachada-naos-solo-edificio-noche.png',
      hojaIzq: 'puerta-naos-hoja-izq.png',
      hojaDer: 'puerta-naos-hoja-der.png',
      interior: 'puerta-naos-interior.png',
    },
    puerta: {
      ...marco(PUERTA.x, PUERTA.y, PUERTA.ancho, PUERTA.alto),
      centroX: X_PUERTA,
      umbralY: SUELO,
      hojaIzq: marco(PUERTA.x, PUERTA.y, HOJA_ANCHO, HOJA_ALTO),
      hojaDer: marco(PUERTA.x + PUERTA.ancho - HOJA_ANCHO, PUERTA.y, HOJA_ANCHO, HOJA_ALTO),
      interior: marco(PUERTA.x, PUERTA.y, INTERIOR_ANCHO, INTERIOR_ALTO),
    },
    acera: {
      yPared: SUELO,
      yBordillo: BORDILLO_Y,
      yPies: PIES_Y,
      altoLibre: BORDILLO_Y - SUELO,
      franjaPies: { y0: 286, y1: 302 },
      nota: 'Nada ocupa la franja de los pies (y de 286 a 302, de x=0 a la puerta). Los árboles y el poste apoyan en y=282 a 284, detrás de la línea de los pies; los conos y la cinta empiezan en y=302 y quedan delante. El personaje se dibuja encima de la escena.',
    },
    personaje: {
      ...PERSONAJE,
      yPies: PIES_Y,
      yCabeza: PIES_Y - PERSONAJE.alto,
      xInicio: X_INICIO,
      xPuerta: X_PUERTA,
    },
    piso4: {
      nota: 'Franja del piso 4, de la losa de abajo al borde de arriba. En la fachada larga las líneas son rectas (perspectiva); en el tambor son arcos que suben hacia el centro.',
      ...piso4,
    },
    panel: { ...PANEL, archivo: 'fachada-naos-solo-edificio-noche.png' },
  };

  return { dia, noche, panel, hojaIzq, hojaDer, interior, meta };
}

function escribirSiCambio(ruta: string, contenido: Buffer): void {
  if (existsSync(ruta) && readFileSync(ruta).equals(contenido)) return;
  mkdirSync(dirname(ruta), { recursive: true });
  writeFileSync(ruta, contenido);
}

/** Dibuja una silueta de 32 x 48 (solo para revisar la escala; no se publica). */
function siluetaDePrueba(): Lienzo {
  const l = new Lienzo(PERSONAJE.ancho, PERSONAJE.alto);
  l.elipse(16, 20, 9, 11, '#E2B08A');
  l.rect(7, 12, 18, 8, '#3A2A2A');
  l.rect(9, 30, 14, 12, '#7A3A8A');
  l.rect(10, 42, 5, 6, '#25252B');
  l.rect(17, 42, 5, 6, '#25252B');
  return l.contorno('#0A0A0A');
}

function tableroDeAlfa(ancho: number, alto: number): Lienzo {
  const l = new Lienzo(ancho, alto);
  for (let y = 0; y < alto; y += 4) {
    for (let x = 0; x < ancho; x += 4) l.rect(x, y, 4, 4, ((x + y) / 4) % 2 === 0 ? '#2A2A30' : '#3A3A42');
  }
  return l;
}

/** Hoja de revisión de la puerta: la zona ampliada con un personaje y los tres sprites sueltos. */
function hojaRevisionPuerta(r: ResultadoFachada): Lienzo {
  const zona = r.dia.recortar(PUERTA.x - 40, PUERTA.y - 24, PUERTA.ancho + 80, 128);
  const silueta = siluetaDePrueba();
  zona.pegar(silueta, X_PUERTA - 16 - (PUERTA.x - 40), PIES_Y - PERSONAJE.alto - (PUERTA.y - 24) + 0);
  const grande = zona.escalar(5);
  const hoja = new Lienzo(grande.ancho + 20 + 380, Math.max(grande.alto, 340));
  hoja.rect(0, 0, hoja.ancho, hoja.alto, '#14141C');
  hoja.pegar(grande, 0, 0);
  const x0 = grande.ancho + 20;
  const piezas = [r.hojaIzq, r.hojaDer, r.interior];
  let x = x0;
  for (const p of piezas) {
    const e = p.escalar(4);
    hoja.pegar(tableroDeAlfa(e.ancho + 8, e.alto + 8), x - 4, 8);
    hoja.pegar(e, x, 12);
    x += e.ancho + 12;
  }
  return hoja;
}

registrarConstructor('fachada-naos', (ctx: ContextoConstruccion) => {
  const r = construirFachadaNaos();

  // Validación: solo colores de la paleta propia de la escena y alfa 0 o 255.
  const problemas: string[] = [];
  const revisar = (nombre: string, l: Lienzo, noche: boolean): void => {
    for (const p of validarLienzo(l, { paleta: coloresNaos(noche), noVacio: true })) problemas.push(`[${nombre}] ${p}`);
  };
  revisar('dia', r.dia, false);
  revisar('noche', r.noche, true);
  revisar('panel', r.panel, true);
  revisar('hoja-izq', r.hojaIzq, false);
  revisar('hoja-der', r.hojaDer, false);
  revisar('interior', r.interior, false);
  if (problemas.length > 0) throw new Error(`La fachada de Naos no pasa la validación:\n${problemas.join('\n')}`);

  const dir = join(rutaRaiz(), DIR_INGRESO);
  const salida: ReadonlyArray<readonly [string, Lienzo]> = [
    ['fachada-naos-dia.png', r.dia],
    ['fachada-naos-noche.png', r.noche],
    ['fachada-naos-solo-edificio-noche.png', r.panel],
    ['puerta-naos-hoja-izq.png', r.hojaIzq],
    ['puerta-naos-hoja-der.png', r.hojaDer],
    ['puerta-naos-interior.png', r.interior],
  ];
  for (const [nombre, lienzo] of salida) escribirSiCambio(join(dir, nombre), codificarPng(lienzo));
  escribirSiCambio(join(dir, 'fachada-naos-meta.json'), Buffer.from(`${jsonLegible(r.meta)}\n`, 'utf8'));

  // Hojas de revisión.
  ctx.guardarPng('fachada-naos-revision-dia.png', r.dia.escalar(2));
  ctx.guardarPng('fachada-naos-revision-noche.png', r.noche.escalar(2));
  ctx.guardarPng('fachada-naos-revision-panel.png', r.panel.escalar(2));
  ctx.guardarPng('fachada-naos-revision-puerta.png', hojaRevisionPuerta(r));
  ctx.log(`${salida.length} imágenes y la meta escritas en ${DIR_INGRESO}`);
});
