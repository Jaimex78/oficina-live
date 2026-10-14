/**
 * Puestos de trabajo del lote 2A: escritorio en L, escritorio de pie, locker, archivador, cajonera y papelera.
 *
 * Estilo Gather (ver `GUIA-ESTILO-GATHER.md`): los escritorios llevan la tapa blanca de esquinas redondeadas con un canto
 * gris y el panel frontal azul grisáceo (`azul-oficina`) sobre patas delgadas; locker, archivador y cajonera comparten el
 * azul grisáceo. Todo con contorno de 1 px en `azul-oficina-0`, luz arriba a la izquierda y una sola sombra abajo a la derecha.
 *
 * Variantes: las de los escritorios (`madera`, `blanco`, `negro`) cambian la tapa y el panel (ver `varianteMesaClara`);
 * las del locker (`gris`, `rojo`) recolorean el azul grisáceo. Los herrajes de metal y el contorno no cambian.
 *
 * Los escritorios y el locker se modelan UNA vez como cajas en el plano `S` y de ahí salen las orientaciones (ver `l2a-cajas.ts`).
 */

import { Lienzo } from '../nucleo';
import { caraSuperior, caraSur, dibujarCajas, girarCajas } from './l2a-cajas';
import type { CajaPlano, Giro, Proyeccion, TonosCaja } from './l2a-cajas';
import type { DibujoObjeto, ParColor } from './l2a-comun';
import { contornoGather, oscuridadBajo, paresDeRampa, recolorearPares, sombraEstandar } from './l2a-comun';
import { varianteMesaClara } from './l2a-mesas';

// ---------------------------------------------------------------------------
// Materiales
// ---------------------------------------------------------------------------

/** Tapa de escritorio: blanca, con el canto gris (filo claro arriba y sombra al pie) y el borde derecho un tono más abajo. */
const TAPA: TonosCaja = { superior: 'neutro-7', frente: 'neutro-6', filo: 'neutro-7', sombra: 'neutro-5', sombraLado: 'neutro-6' };
/** Panel frontal azul grisáceo. */
const PANEL: TonosCaja = { superior: 'azul-oficina-4', frente: 'azul-oficina-3', luzFrente: 'azul-oficina-4', sombra: 'azul-oficina-2', sombraLado: 'azul-oficina-2' };
/** Patas delgadas de azul marino. */
const PATA: TonosCaja = { superior: 'azul-oficina-3', frente: 'azul-oficina-2', luzFrente: 'azul-oficina-3', sombra: 'azul-oficina-1', sombraLado: 'azul-oficina-1' };
/** Cuerpo de locker, archivador y cajonera: el mismo azul grisáceo del panel, con el frente un paso más claro. */
const CUERPO: TonosCaja = { superior: 'azul-oficina-4', frente: 'azul-oficina-3', luzFrente: 'azul-oficina-4', sombra: 'azul-oficina-2', sombraLado: 'azul-oficina-2' };

function dibujarModelo(
  modelo: readonly CajaPlano[],
  giro: Giro,
  plano: { ancho: number; fondo: number },
  lienzo: { ancho: number; alto: number },
  proy: (fondo: number) => Proyeccion,
  detalles: (l: Lienzo, cajas: readonly CajaPlano[], p: Proyeccion) => void,
): Lienzo {
  const l = new Lienzo(lienzo.ancho, lienzo.alto);
  const g = girarCajas(modelo, giro, plano.ancho, plano.fondo);
  const p = proy(g.fondo);
  dibujarCajas(l, g.cajas, p);
  detalles(l, g.cajas, p);
  contornoGather(l);
  return sombraEstandar(l);
}

/** Un reborde fino de `neutro-6` a 2 px del borde de cada tapa: el canto laminado de un escritorio de oficina. */
function rebordeDeTapas(l: Lienzo, cajas: readonly CajaPlano[], p: Proyeccion): void {
  for (const c of cajas) {
    if (c.etiqueta !== 'tapa') continue;
    const t = caraSuperior(c, p);
    if (t.w < 12 || t.h < 8) continue;
    l.rect(t.x + 3, t.y + t.h - 3, t.w - 6, 1, 'neutro-6');
  }
}

// ---------------------------------------------------------------------------
// Escritorio en L
// ---------------------------------------------------------------------------

/**
 * Escritorio en L en el plano `S` (64 x 64): brazo largo al norte y brazo corto al oeste; el rincón de la silla queda libre
 * al sureste. Cada brazo lleva su panel azul grisáceo bajo el canto del lado de quien se sienta y patas delgadas en los extremos.
 */
export function modeloEscritorioL(): CajaPlano[] {
  return [
    // Patas: extremo este del brazo norte y extremo sur del brazo oeste.
    { x0: 55, y0: 17, x1: 58, y1: 20, z0: 0, z1: 12, tonos: PATA },
    { x0: 5, y0: 54, x1: 8, y1: 57, z0: 0, z1: 12, tonos: PATA },
    { x0: 19, y0: 54, x1: 22, y1: 57, z0: 0, z1: 12, tonos: PATA },
    // Paneles bajo el canto de los dos lados largos de cada brazo y en los extremos: según la orientación, el que da al sur se ve.
    { x0: 8, y0: 20, x1: 55, y1: 23, z0: 4, z1: 12, tonos: PANEL, etiqueta: 'panel' },
    { x0: 8, y0: 3, x1: 55, y1: 6, z0: 4, z1: 12, tonos: PANEL, etiqueta: 'panel' },
    { x0: 57, y0: 5, x1: 60, y1: 22, z0: 4, z1: 12, tonos: PANEL, etiqueta: 'panel' },
    { x0: 5, y0: 54, x1: 22, y1: 57, z0: 4, z1: 12, tonos: PANEL, etiqueta: 'panel' },
    { x0: 22, y0: 28, x1: 25, y1: 54, z0: 4, z1: 12, tonos: PANEL, etiqueta: 'panel' },
    { x0: 4, y0: 28, x1: 7, y1: 54, z0: 4, z1: 12, tonos: PANEL, etiqueta: 'panel' },
    // Tapas.
    { x0: 3, y0: 2, x1: 61, y1: 24, z0: 12, z1: 15, tonos: TAPA, esquinas: 2, etiqueta: 'tapa' },
    { x0: 3, y0: 24, x1: 25, y1: 60, z0: 12, z1: 15, tonos: TAPA, esquinas: 2, rectas: ['nw', 'ne'], sinLuzArriba: true, etiqueta: 'tapa' },
  ];
}

/**
 * La huella bloqueada que fija `huellaDe` gira el rincón libre así: S al sureste, E al suroeste, N al noroeste y O al noreste.
 * Es un giro horario por cada paso (S, E, N, O), mientras que el modelo gira E y O en sentido contrario: se cruzan.
 * Si algún día se invierte `huellaDe`, basta con intercambiar E y O en esta tabla.
 */
export const GIRO_ESCRITORIO_L: Readonly<Record<'S' | 'E' | 'N' | 'O', Giro>> = { S: 'S', E: 'O', N: 'N', O: 'E' };

function escritorioLEn(orientacion: 'S' | 'E' | 'N' | 'O'): Lienzo {
  const giro = GIRO_ESCRITORIO_L[orientacion];
  return dibujarModelo(
    modeloEscritorioL(),
    giro,
    { ancho: 64, fondo: 64 },
    { ancho: 64, alto: 64 },
    (fondo) => ({ base: 61, fondo, ky: 0.72 }),
    (l, cajas, p) => rebordeDeTapas(l, cajas, p),
  );
}

export function dibujoEscritorioL(): DibujoObjeto {
  return {
    rampaBase: 'neutro',
    vistas: { S: escritorioLEn('S'), E: escritorioLEn('E'), N: escritorioLEn('N'), O: escritorioLEn('O') },
    variante: varianteMesaClara,
  };
}

// ---------------------------------------------------------------------------
// Escritorio de pie
// ---------------------------------------------------------------------------

/**
 * Escritorio de pie de 2 x 1 en el plano `S` (64 x 32): tapa blanca delgada y alta sobre dos columnas de azul marino
 * con travesaño y patines, y el panel de control bajo el canto derecho (el lado de quien se para).
 */
export function modeloEscritorioDePie(): CajaPlano[] {
  const CONTROL: TonosCaja = { superior: 'azul-oficina-3', frente: 'azul-oficina-1', luzFrente: 'azul-oficina-2', sombra: 'azul-oficina-1', sombraLado: 'azul-oficina-1' };
  const VIGA: TonosCaja = { superior: 'azul-oficina-3', frente: 'azul-oficina-2', sombra: 'azul-oficina-1' };
  return [
    { x0: 6, y0: 10, x1: 16, y1: 26, z0: 0, z1: 2, tonos: PATA, esquinas: 1 },
    { x0: 48, y0: 10, x1: 58, y1: 26, z0: 0, z1: 2, tonos: PATA, esquinas: 1 },
    { x0: 9, y0: 14, x1: 13, y1: 18, z0: 2, z1: 16, tonos: PATA },
    { x0: 51, y0: 14, x1: 55, y1: 18, z0: 2, z1: 16, tonos: PATA },
    { x0: 13, y0: 14, x1: 51, y1: 18, z0: 12, z1: 15, tonos: VIGA },
    // Faldón delgado bajo el canto, por delante y por detrás (según la orientación, el que da al sur se ve).
    { x0: 9, y0: 24, x1: 55, y1: 27, z0: 13, z1: 16, tonos: PANEL, etiqueta: 'panel' },
    { x0: 9, y0: 5, x1: 55, y1: 8, z0: 13, z1: 16, tonos: PANEL, etiqueta: 'panel' },
    { x0: 5, y0: 7, x1: 8, y1: 25, z0: 13, z1: 16, tonos: PANEL, etiqueta: 'panel' },
    { x0: 56, y0: 7, x1: 59, y1: 25, z0: 13, z1: 16, tonos: PANEL, etiqueta: 'panel' },
    { x0: 40, y0: 24, x1: 47, y1: 28, z0: 12, z1: 16, tonos: CONTROL, etiqueta: 'control' },
    { x0: 3, y0: 4, x1: 61, y1: 28, z0: 16, z1: 19, tonos: TAPA, esquinas: 2, etiqueta: 'tapa' },
  ];
}

function escritorioDePieEn(giro: Giro): Lienzo {
  const gira90 = giro === 'E' || giro === 'O';
  return dibujarModelo(
    modeloEscritorioDePie(),
    giro,
    { ancho: 64, fondo: 32 },
    gira90 ? { ancho: 32, alto: 64 } : { ancho: 64, alto: 32 },
    (fondo) => (gira90 ? { base: 61, fondo, ky: 0.62 } : { base: 29, fondo, ky: 0.28 }),
    (l, cajas, p) => {
      rebordeDeTapas(l, cajas, p);
      if (giro !== 'S') return;
      for (const c of cajas) {
        if (c.etiqueta !== 'control') continue;
        const f = caraSur(c, p);
        l.rect(f.x + 1, f.y + 1, 3, 1, 'vidrio-2'); // pantallita del control
        l.px(f.x + f.w - 2, f.y + 2, 'rojo-suave-3'); // botón
      }
    },
  );
}

export function dibujoEscritorioDePie(): DibujoObjeto {
  return {
    rampaBase: 'neutro',
    vistas: { S: escritorioDePieEn('S'), E: escritorioDePieEn('E'), N: escritorioDePieEn('N'), O: escritorioDePieEn('O') },
    variante: varianteMesaClara,
  };
}

// ---------------------------------------------------------------------------
// Locker
// ---------------------------------------------------------------------------

const TONOS_AZUL = [1, 2, 3, 4] as const;

/** Variantes de lo que es de `azul-oficina` (locker, archivador): `gris` y `rojo`. El contorno y los herrajes no cambian. */
export function varianteAzulOficina(base: Lienzo, variante: string): Lienzo | undefined {
  const pares: ParColor[] = [];
  if (variante === 'gris') pares.push(...paresDeRampa('azul-oficina', 'neutro', TONOS_AZUL, [2, 3, 4, 5]));
  else if (variante === 'rojo') pares.push(...paresDeRampa('azul-oficina', 'rojo', TONOS_AZUL));
  else return undefined;
  return recolorearPares(base, pares);
}

/** Locker de dos puertas en el plano `S` (32 x 32): una caja alta y angosta, con el frente al sur. */
export function modeloLocker(): CajaPlano[] {
  return [{ x0: 3, y0: 12, x1: 29, y1: 28, z0: 0, z1: 36, tonos: CUERPO, esquinas: 2, etiqueta: 'locker' }];
}

/** Puerta de locker: marco hundido, persianas arriba y abajo, placa con número y manija. */
function puertaLocker(l: Lienzo, x: number, y: number, ancho: number, alto: number, izquierda: boolean): void {
  l.rect(x, y, ancho, alto, 'azul-oficina-3');
  l.rectBorde(x, y, ancho, alto, 'azul-oficina-2'); // marco hundido
  l.rect(x + 1, y + 1, ancho - 2, 1, 'azul-oficina-4'); // brillo del borde de la puerta
  // Persianas: tres ranuras con su reflejo, arriba y abajo.
  for (let i = 0; i < 3; i++) {
    l.rect(x + 3, y + 5 + i * 2, ancho - 6, 1, 'azul-oficina-1');
    l.rect(x + 3, y + alto - 10 + i * 2, ancho - 6, 1, 'azul-oficina-1');
  }
  // Placa con el número.
  l.rect(x + Math.floor(ancho / 2) - 2, y + 3, 4, 2, 'neutro-7');
  // Manija junto al lado de las puertas que se abre.
  const mx = izquierda ? x + ancho - 4 : x + 3;
  l.rect(mx, y + Math.floor(alto / 2) - 3, 1, 6, 'azul-oficina-0');
  l.rect(mx + (izquierda ? -1 : 1), y + Math.floor(alto / 2) - 3, 1, 1, 'azul-oficina-4');
}

function lockerEn(giro: Giro): Lienzo {
  return dibujarModelo(
    modeloLocker(),
    giro,
    { ancho: 32, fondo: 32 },
    { ancho: 32, alto: 48 },
    (fondo) => ({ base: 44, fondo, ky: 0.3 }),
    (l, cajas, p) => {
      const c = cajas.find((b) => b.etiqueta === 'locker');
      if (c === undefined) return;
      const f = caraSur(c, p);
      if (giro === 'S') {
        const mitad = Math.floor(f.w / 2);
        puertaLocker(l, f.x + 1, f.y + 2, mitad - 1, f.h - 4, true);
        puertaLocker(l, f.x + mitad, f.y + 2, f.w - mitad - 1, f.h - 4, false);
      } else if (giro === 'N') {
        // Espalda: chapa lisa con una costura de refuerzo.
        l.rect(f.x + Math.floor(f.w / 2), f.y + 2, 1, f.h - 4, 'azul-oficina-2');
        l.rect(f.x + 1, f.y + f.h - 6, f.w - 2, 1, 'azul-oficina-2');
      } else {
        // De lado: una chapa con dos refuerzos y, en el borde que da al frente, una tira del marco de las puertas.
        const frente = giro === 'E' ? f.x + f.w - 4 : f.x;
        l.rect(frente, f.y, 4, f.h, 'azul-oficina-2');
        l.rect(giro === 'E' ? frente : frente + 3, f.y, 1, f.h, 'azul-oficina-1');
        for (let i = 0; i < 3; i++) l.rect(frente + 1, f.y + 5 + i * 2, 2, 1, 'azul-oficina-1');
        l.rect(f.x + 2, f.y + 6, f.w - 8, 1, 'azul-oficina-2');
        l.rect(f.x + 2, f.y + f.h - 8, f.w - 8, 1, 'azul-oficina-2');
      }
    },
  );
}

export function dibujoLocker(): DibujoObjeto {
  return { rampaBase: 'azul-oficina', vistas: { S: lockerEn('S'), E: lockerEn('E'), N: lockerEn('N'), O: lockerEn('O') }, variante: varianteAzulOficina };
}

// ---------------------------------------------------------------------------
// Archivador, cajonera y papelera
// ---------------------------------------------------------------------------

/** Tirador de cajón: barra de metal con su sombra. */
function tirador(l: Lienzo, x: number, y: number, ancho = 6): void {
  l.rect(x, y, ancho, 1, 'metal-3');
  l.rect(x, y + 1, ancho, 1, 'metal-1');
}

/** Archivador de tres cajones con porta etiquetas. Solo tiene frente. */
export function dibujoArchivador(): DibujoObjeto {
  const l = new Lienzo(32, 40);
  const p: Proyeccion = { base: 36, fondo: 32, ky: 0.3 };
  const cuerpo: CajaPlano = { x0: 6, y0: 10, x1: 26, y1: 28, z0: 0, z1: 28, tonos: CUERPO, esquinas: 2 };
  dibujarCajas(l, [cuerpo], p);
  const f = caraSur(cuerpo, p);
  const alto = Math.floor((f.h - 4) / 3);
  for (let i = 0; i < 3; i++) {
    const y = f.y + 2 + i * (alto + 1);
    l.rect(f.x + 2, y, f.w - 4, alto, 'azul-oficina-3'); // frente del cajón
    l.rect(f.x + 2, y, f.w - 4, 1, 'azul-oficina-4'); // brillo del borde superior
    l.rect(f.x + 2, y + alto, f.w - 4, 1, 'azul-oficina-2'); // junta con el cajón de abajo
    l.rect(f.x + Math.floor(f.w / 2) - 3, y + 2, 6, 3, 'neutro-6'); // portaetiqueta
    l.rect(f.x + Math.floor(f.w / 2) - 3, y + 2, 6, 1, 'neutro-7');
    tirador(l, f.x + Math.floor(f.w / 2) - 3, y + alto - 3);
  }
  contornoGather(l);
  sombraEstandar(l);
  return { rampaBase: 'azul-oficina', vistas: { U: l }, variante: varianteAzulOficina };
}

/** Cajonera móvil con la tapa blanca de los escritorios, tres cajones azul grisáceo y cuatro ruedas. */
export function dibujoCajonera(): DibujoObjeto {
  const l = new Lienzo(32, 32);
  const p: Proyeccion = { base: 29, fondo: 32, ky: 0.35 };
  const RUEDA: TonosCaja = { superior: 'azul-oficina-2', frente: 'azul-oficina-1', sombra: 'azul-oficina-1' };
  const ruedas: CajaPlano[] = [
    { x0: 8, y0: 12, x1: 11, y1: 15, z0: 0, z1: 3, tonos: RUEDA },
    { x0: 21, y0: 12, x1: 24, y1: 15, z0: 0, z1: 3, tonos: RUEDA },
    { x0: 8, y0: 23, x1: 11, y1: 26, z0: 0, z1: 3, tonos: RUEDA },
    { x0: 21, y0: 23, x1: 24, y1: 26, z0: 0, z1: 3, tonos: RUEDA },
  ];
  const cuerpo: CajaPlano = { x0: 6, y0: 11, x1: 26, y1: 26, z0: 3, z1: 21, tonos: { ...PANEL, superior: 'neutro-7' }, esquinas: 2 };
  dibujarCajas(l, [...ruedas, cuerpo], p);
  const f = caraSur(cuerpo, p);
  const alto = Math.floor((f.h - 2) / 3);
  for (let i = 0; i < 3; i++) {
    const y = f.y + 1 + i * (alto + 1);
    l.rect(f.x + 1, y + alto, f.w - 2, 1, 'azul-oficina-2');
    tirador(l, f.x + Math.floor(f.w / 2) - 3, y + Math.floor(alto / 2) - 1);
  }
  contornoGather(l);
  sombraEstandar(l);
  oscuridadBajo(l, 7, 27, 17, 2);
  return { rampaBase: 'neutro', vistas: { U: l }, variante: varianteMesaClara };
}

/** Papelera de malla: cuerpo gris claro que se angosta hacia abajo, aro blanco, boca azul marino y papeles que asoman. */
export function dibujoPapelera(): DibujoObjeto {
  const l = new Lienzo(32, 32);
  // Cuerpo: trapecio de malla con luz a la izquierda y sombra a la derecha.
  for (let y = 12; y < 28; y++) {
    const recorte = Math.floor((y - 12) / 5);
    const x0 = 9 + recorte;
    const x1 = 22 - recorte;
    l.rect(x0, y, x1 - x0 + 1, 1, 'neutro-5');
    l.px(x0, y, 'neutro-7');
    l.px(x0 + 1, y, 'neutro-6');
    l.px(x1, y, 'neutro-4');
    l.px(x1 - 1, y, 'neutro-4');
  }
  // Malla: puntos tramados que dejan ver el fondo oscuro.
  l.trama(11, 15, 9, 11, 'neutro-5', 'neutro-4', 'tablero');
  l.rect(9, 27, 14, 1, 'neutro-4');
  // Borde superior (aro) y boca oscura con papeles.
  l.elipse(15.5, 12, 7.5, 3, 'neutro-7');
  l.elipse(15.5, 12.5, 6.5, 2.5, 'azul-oficina-1');
  l.rect(12, 11, 3, 2, 'neutro-7');
  l.rect(16, 10, 3, 2, 'neutro-6');
  l.px(14, 10, 'neutro-7');
  l.px(18, 12, 'tela-calida-3');
  contornoGather(l);
  sombraEstandar(l);
  return { rampaBase: 'neutro', vistas: { U: l } };
}
