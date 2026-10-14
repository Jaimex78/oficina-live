import { CASILLA } from '@ol/shared';
import { MARGEN_EXTERIOR } from './geometria';
import {
  Z,
  type Arbol,
  type Carril,
  type Foco,
  type Geometria,
  type ModeloArbol,
  type PeatonQuieto,
  type Plano,
  type Prop,
  type RutaPeaton,
  type Semaforo,
} from './tipos';
import { azar } from './util';

/**
 * El plano del exterior, hecho mirando el mapa real: la Avenida Carrera 9 bordea el predio por el sur con dos calzadas,
 * una por sentido y de dos carriles cada una, y un corredor de tren con rieles en medio. La calle 102 llega por el
 * lado de la esquina y se une a la calzada norte, junto al balcón.
 *
 *   sur   la fachada larga: caída de 4 pisos, andén ancho, calzada norte (hacia el oeste), vía del tren,
 *         calzada sur (hacia el este) y andén de enfrente
 *   este  la calle 102: dos carriles, con cebra y semáforo, que se une a la avenida
 *   resto los vecinos (norte, oeste, este y sur) son bloques apagados y sin detalle: el ojo se queda en la avenida
 *
 * Se mira desde el piso 4: lo que está a nivel de calle queda 4 casillas más abajo que el borde de la losa (la caída).
 */

/** Pisos que se ven por debajo de la losa del piso 4 (piso 3, 2, 1 y planta baja). */
export const CAIDA = 4;
export const ANCHO_ANDEN = 4;
/** Cada calzada de la avenida: dos carriles de 1,5 casillas. */
export const ANCHO_CALZADA = 3;
/** El corredor del tren: dos filas con los dos rieles. */
export const ANCHO_VIA = 2;
export const ANCHO_ANDEN_LEJANO = 3;
export const ANCHO_ANDEN_ESTE = 4;
/** La calle 102 tiene dos carriles: tres columnas. */
export const ANCHO_CALLE_102 = 3;

type TonoBloque = 'a' | 'b' | 'c';

interface Bloque {
  x0: number;
  x1: number;
  /** Fila donde la fachada toca el suelo. */
  base: number;
  /** Pisos de fachada visibles (0 si solo se ve la azotea). */
  h: number;
  /** Primera fila de la azotea. La azotea termina donde empieza la fachada. */
  techoY0: number;
  /** `naos` es el edificio propio, con su arte completo; los demás son bloques lisos de un tono. */
  tipo: 'naos' | 'azotea-baja' | TonoBloque;
  /** Equipos de azotea (solo la azotea baja del edificio). */
  equipos?: number;
}

const HEX = { calido: 0xffd890, frio: 0xbfd9ff, rojo: 0xff5a4a, ambar: 0xffb347 } as const;

/** Qué lados de calle tiene un andén, en los nombres de tile que publica el arte (N, S, E, O en ese orden). */
function nombreAnden(variante: string, n: boolean, s: boolean, e: boolean, o: boolean): string {
  let lados = '';
  if (n) lados += 'N';
  if (s) lados += 'S';
  if (e) lados += 'E';
  if (o) lados += 'O';
  // El arte publica un lado o una esquina de dos lados. Con tres o cuatro se queda con los primeros dos.
  if (lados.length > 2) lados = lados.slice(0, 2);
  return lados === '' ? `anden-${variante}` : `anden-${variante}-${lados}`;
}

export function construirPlano(geo: Geometria): Plano {
  const X0 = -MARGEN_EXTERIOR;
  const Y0 = -MARGEN_EXTERIOR;
  const W = geo.ancho + 2 * MARGEN_EXTERIOR;
  const H = geo.alto + 2 * MARGEN_EXTERIOR;
  const X1 = X0 + W;
  const Y1 = Y0 + H;
  const N = W * H;
  const idx = (cx: number, cy: number): number => (cy - Y0) * W + (cx - X0);
  const dentro = (cx: number, cy: number): boolean => cx >= X0 && cx < X1 && cy >= Y0 && cy < Y1;

  const zona = new Uint8Array(N).fill(Z.LOTE);
  const directo: (string | null)[] = new Array<string | null>(N).fill(null);
  const detalle: (string | null)[] = new Array<string | null>(N).fill(null);
  const sombra: (string | null)[] = new Array<string | null>(N).fill(null);
  const luz: (string | null)[] = new Array<string | null>(N).fill(null);
  const arboles: Arbol[] = [];
  const props: Prop[] = [];
  const focos: Foco[] = [];

  // ---------- Líneas clave ----------
  const { x0: L, y0: T, x1: R, y1: B } = geo.ed;
  const BX = geo.balcon ? geo.balcon.x1 : R;
  const BY = geo.balcon ? geo.balcon.y1 : B;
  const baseSur = B + CAIDA; // pie de las fachadas sobre la avenida
  const yAk0 = baseSur + ANCHO_ANDEN; // primera fila de la calzada norte
  const yVia = yAk0 + ANCHO_CALZADA; // primera fila del corredor del tren
  const ySur0 = yVia + ANCHO_VIA; // primera fila de la calzada sur
  const yAk1 = ySur0 + ANCHO_CALZADA;
  const yFar1 = yAk1 + ANCHO_ANDEN_LEJANO;
  const xC0 = Math.max(R, BX) + 1; // primera columna de la calle 102
  const xC1 = xC0 + ANCHO_CALLE_102;
  const xEs1 = xC1 + ANCHO_ANDEN_ESTE;
  const xPaso = xC0 - 2; // columna del paso peatonal que cruza la avenida y la vía
  const yCebra102 = yAk0 - 2; // fila de la cebra que cruza la calle 102
  const yAl1 = T - 3; // el callejón termina donde empieza la azotea baja
  const yAl0 = yAl1 - 3;

  const rect = (x0: number, y0: number, x1: number, y1: number, f: (cx: number, cy: number) => void): void => {
    for (let cy = Math.max(y0, Y0); cy < Math.min(y1, Y1); cy++) for (let cx = Math.max(x0, X0); cx < Math.min(x1, X1); cx++) f(cx, cy);
  };
  const zonar = (x0: number, y0: number, x1: number, y1: number, z: number): void => rect(x0, y0, x1, y1, (cx, cy) => (zona[idx(cx, cy)] = z));

  // ---------- Zonas: calles, vía, andenes y explanada ----------
  zonar(X0, yAl0, X1, yAl1, Z.CALLEJON);
  zonar(X0, yAk0, X1, yVia, Z.CALLE);
  zonar(X0, yVia, X1, ySur0, Z.VIA);
  zonar(X0, ySur0, X1, yAk1, Z.CALLE);
  zonar(xC0, Y0, xC1, yAk0, Z.CALLE);
  // Andén largo de la fachada sur y su continuación al este de la calle 102.
  zonar(X0, baseSur, xC0, yAk0, Z.ANDEN);
  zonar(xC1, baseSur, X1, yAk0, Z.ANDEN);
  // Andén de enfrente.
  zonar(X0, yAk1, X1, yFar1, Z.ANDEN);
  // Explanada al este del edificio y andenes de la calle 102.
  zonar(R, yAl1, xC0 - 3, baseSur, Z.PLAZA);
  zonar(R, baseSur, xC0 - 3, yAk0, Z.PLAZA);
  zonar(xC0 - 3, yAl1, xC0, baseSur, Z.ANDEN);
  zonar(xC1, yAl1, xEs1, baseSur, Z.ANDEN);
  // Jardín de la esquina, bajo el balcón.
  const jx0 = R + 1;
  const jx1 = xC0 - 2;
  const jy0 = BY + 1;
  const jy1 = yAk0 - 1;
  zonar(jx0, jy0, jx1, jy1, Z.PASTO);

  // ---------- Bloques: el edificio propio y los vecinos ----------
  const bloques: Bloque[] = [
    // El edificio propio: su azotea queda tapada por la sala y se ven los 4 pisos de abajo.
    { x0: L, x1: R, base: baseSur, h: CAIDA, techoY0: T, tipo: 'naos' },
    // Azotea baja del mismo edificio, pegada a la pared norte.
    { x0: L, x1: R, base: T, h: 0, techoY0: yAl1, tipo: 'azotea-baja', equipos: 5 },
    // Norte, al otro lado del callejón (pie de fachada en la fila del callejón).
    { x0: X0, x1: L - 9, base: yAl0, h: 6, techoY0: Y0, tipo: 'a' },
    { x0: L - 9, x1: R - 7, base: yAl0, h: 9, techoY0: Y0, tipo: 'c' },
    { x0: R - 7, x1: xC0, base: yAl0, h: 5, techoY0: Y0, tipo: 'b' },
    { x0: xC1, x1: X1, base: yAl0, h: 7, techoY0: Y0, tipo: 'a' },
    // Oeste, sobre la avenida: uno más bajo que el piso 4 y uno más alto, con casas atrás.
    { x0: L - 11, x1: L, base: baseSur, h: 3, techoY0: baseSur - 3 - 14, tipo: 'b' },
    { x0: X0, x1: L - 11, base: baseSur, h: 7, techoY0: baseSur - 7 - 14, tipo: 'c' },
    { x0: L - 11, x1: L, base: yAl1 + 10, h: 2, techoY0: yAl1 + 3, tipo: 'a' },
    { x0: X0, x1: L - 11, base: yAl1 + 6, h: 4, techoY0: yAl1, tipo: 'b' },
    // Este, sobre la avenida, tras la calle 102.
    { x0: xEs1, x1: xEs1 + 8, base: baseSur, h: 8, techoY0: baseSur - 8 - 15, tipo: 'c' },
    { x0: xEs1 + 8, x1: X1, base: baseSur, h: 5, techoY0: baseSur - 5 - 13, tipo: 'a' },
    { x0: xEs1, x1: X1, base: yAl1 + 6, h: 4, techoY0: yAl1, tipo: 'b' },
    // Sur, al otro lado de la avenida: azoteas a media altura.
    { x0: X0, x1: L - 4, base: Y1, h: 2, techoY0: yFar1 + 1, tipo: 'b' },
    { x0: L - 3, x1: R - 12, base: Y1, h: 2, techoY0: yFar1 + 1, tipo: 'c' },
    { x0: R - 11, x1: xC0 - 3, base: Y1, h: 2, techoY0: yFar1 + 1, tipo: 'a' },
    { x0: xC0 - 2, x1: xC1 + 3, base: Y1, h: 2, techoY0: yFar1 + 1, tipo: 'b' },
    { x0: xC1 + 4, x1: X1, base: Y1, h: 2, techoY0: yFar1 + 1, tipo: 'c' },
  ];

  const pintarBloque = (b: Bloque): void => {
    const yTecho1 = b.base - b.h;
    const propio = b.tipo === 'naos' || b.tipo === 'azotea-baja';
    const tono = (b.tipo === 'naos' || b.tipo === 'azotea-baja' ? 'a' : b.tipo) as TonoBloque;
    // Azotea.
    rect(b.x0, b.techoY0, b.x1, yTecho1, (cx, cy) => {
      const i = idx(cx, cy);
      zona[i] = Z.TECHO;
      if (b.tipo === 'naos') directo[i] = `techo-terraza-${azar(cx, cy, 7) < 0.7 ? 'a' : 'b'}`;
      else if (b.tipo === 'azotea-baja') {
        directo[i] = `techo-grava-${azar(cx, cy, 7) < 0.7 ? 'a' : 'b'}`;
        const norte = cy === b.techoY0;
        const oeste = cx === b.x0;
        const este = cx === b.x1 - 1;
        if (norte) detalle[i] = oeste ? 'par-no' : este ? 'par-ne' : 'par-n';
        else if (oeste) detalle[i] = 'par-o';
        else if (este) detalle[i] = 'par-e';
      } else directo[i] = `bloque-techo-${tono}`;
    });
    // Fachada, un tile por piso.
    for (let r = 0; r < b.h; r++) {
      const cy = yTecho1 + r;
      const pos = b.h === 1 ? 'base' : r === 0 ? 'tope' : r === b.h - 1 ? 'base' : 'medio';
      rect(b.x0, cy, b.x1, cy + 1, (cx) => {
        const i = idx(cx, cy);
        zona[i] = propio ? Z.EDIFICIO : Z.FACHADA;
        if (!propio) {
          directo[i] = `bloque-fac-${pos}-${tono}`;
          return;
        }
        const variante = pos === 'medio' ? 'abc'[Math.floor(azar(cx, cy, 11) * 3)] : 'ab'[Math.floor(azar(cx, cy, 12) * 2)];
        directo[i] = `fac-naos-${pos}-${variante}`;
        const prob = pos === 'base' ? 0.08 : 0.2;
        if (azar(cx, cy, 13) < prob) luz[i] = `luz-naos-${pos}-${'123'[Math.floor(azar(cx, cy, 14) * 3)]}`;
      });
    }
    // Sombra del edificio sobre el suelo de enfrente.
    if (b.h > 0) {
      rect(b.x0, b.base, b.x1, b.base + 1, (cx, cy) => {
        const z = zona[idx(cx, cy)];
        if (z === Z.ANDEN || z === Z.PLAZA || z === Z.PASTO || z === Z.CALLEJON || z === Z.LOTE) sombra[idx(cx, cy)] = 'sombra-sur';
      });
    }
  };

  // Los más lejanos primero: los de la fila de pie más alta se pintan antes y los de abajo los tapan.
  [...bloques].sort((a, b) => a.base - b.base).forEach(pintarBloque);

  // Vestíbulo de Naos en la planta baja, con su luz encendida de noche.
  const lobbyX = L + 22;
  if (lobbyX + 1 < R) {
    directo[idx(lobbyX, baseSur - 1)] = 'fac-naos-lobby-i';
    directo[idx(lobbyX + 1, baseSur - 1)] = 'fac-naos-lobby-d';
    luz[idx(lobbyX, baseSur - 1)] = 'luz-naos-lobby-i';
    luz[idx(lobbyX + 1, baseSur - 1)] = 'luz-naos-lobby-d';
    focos.push({ x: (lobbyX + 1) * CASILLA, y: (baseSur + 0.9) * CASILLA, radio: 3 * CASILLA, color: HEX.calido, intensidad: 0.6 });
  }

  // Esquina del edificio: sombra al este y sombra bajo el balcón.
  rect(R, T, R + 1, geo.balcon ? geo.balcon.y0 : B, (cx, cy) => {
    sombra[idx(cx, cy)] = 'sombra-este';
  });
  sombra[idx(R, baseSur)] = 'sombra-esquina';
  if (geo.balcon) {
    rect(geo.balcon.x0, BY, BX, BY + 1, (cx, cy) => {
      detalle[idx(cx, cy)] = 'balcon-losa';
    });
    rect(R, BY + 1, BX, BY + 2, (cx, cy) => {
      sombra[idx(cx, cy)] = 'sombra-llena';
    });
    rect(R, BY + 2, BX, BY + 3, (cx, cy) => {
      sombra[idx(cx, cy)] = 'sombra-sur';
    });
  }

  // ---------- Obra sobre el andén, como en la foto ----------
  const obraX0 = L + 7;
  const obraX1 = L + 18;
  rect(obraX0, baseSur, obraX1, baseSur + 2, (cx, cy) => {
    directo[idx(cx, cy)] = `tierra-${azar(cx, cy, 21) < 0.5 ? 'a' : 'b'}`;
  });
  for (let x = obraX0; x < obraX1; x++) {
    props.push({ frame: azar(x, 1, 22) < 0.3 ? 'valla-b' : 'valla-a', x: x * CASILLA + 16, y: (baseSur + 2) * CASILLA - 2 });
  }
  for (const [cx, cy] of [[obraX0 - 0.5, baseSur + 2.7], [obraX0 + 3.5, baseSur + 2.9], [obraX1 - 4.5, baseSur + 2.8], [obraX1 + 0.5, baseSur + 2.7], [obraX1 + 1.5, baseSur + 3.0]] as const) {
    props.push({ frame: 'cono', x: cx * CASILLA, y: cy * CASILLA });
  }
  props.push({ frame: 'barricada', x: (obraX0 + 6) * CASILLA, y: (baseSur + 3.4) * CASILLA });
  props.push({ frame: 'barricada', x: (obraX1 - 1) * CASILLA, y: (baseSur + 3.3) * CASILLA });
  const cintaX = obraX1 + 3;
  props.push({ frame: 'cinta-poste', x: cintaX * CASILLA, y: (baseSur + 2.9) * CASILLA });
  props.push({ frame: 'cinta-poste', x: (cintaX + 2) * CASILLA, y: (baseSur + 2.9) * CASILLA });
  props.push({ frame: 'cinta', x: (cintaX + 1) * CASILLA, y: (baseSur + 2.9) * CASILLA - 11 });
  focos.push({ x: obraX1 * CASILLA, y: (baseSur + 2.6) * CASILLA - 10, radio: 28, color: HEX.ambar, intensidad: 0.9, parpadeo: true });
  focos.push({ x: obraX0 * CASILLA - 16, y: (baseSur + 2.6) * CASILLA - 10, radio: 28, color: HEX.ambar, intensidad: 0.9, parpadeo: true });

  // ---------- Tiles de las zonas de suelo ----------
  const esCalle = (cx: number, cy: number): boolean => dentro(cx, cy) && zona[idx(cx, cy)] === Z.CALLE;
  const suelo: (string | null)[] = new Array<string | null>(N).fill(null);
  // Flechas de sentido, repartidas por los carriles lejos del cruce y del paso.
  const flecha = (cx: number): boolean => (cx - X0) % 11 === 5 && (cx < xPaso - 2 || cx > xC1 + 2);
  for (let cy = Y0; cy < Y1; cy++) {
    for (let cx = X0; cx < X1; cx++) {
      const i = idx(cx, cy);
      if (directo[i]) {
        suelo[i] = directo[i];
        continue;
      }
      const v = 'abcd'[Math.floor(azar(cx, cy, 31) * 4)] as string;
      switch (zona[i]) {
        case Z.PASTO:
          suelo[i] = `pasto-${v}`;
          break;
        case Z.LOTE:
          suelo[i] = `lote-${azar(cx, cy, 35) < 0.5 ? 'a' : 'b'}`;
          break;
        case Z.ANDEN:
          suelo[i] = nombreAnden(v, esCalle(cx, cy - 1), esCalle(cx, cy + 1), esCalle(cx + 1, cy), esCalle(cx - 1, cy));
          break;
        case Z.PLAZA:
          suelo[i] = `plaza-${azar(cx, cy, 32) < 0.5 ? 'a' : 'b'}`;
          break;
        case Z.CALLEJON:
          suelo[i] = `asf-${'abc'[Math.floor(azar(cx, cy, 33) * 3)]}`;
          break;
        case Z.VIA:
          suelo[i] = `via-${cy === yVia ? 'n' : 's'}`;
          if (cx === xPaso) suelo[i] = `via-paso-${cy === yVia ? 'n' : 's'}`;
          break;
        case Z.CALLE: {
          const enAvenida = cy >= yAk0 && cy < yAk1;
          if (!enAvenida) {
            // Calle 102: dos carriles, doble línea amarilla al centro y cebra antes del cruce.
            const c = cx - xC0;
            if (cy === yCebra102) suelo[i] = c === 0 ? 'asf-cebra-v-o' : c === ANCHO_CALLE_102 - 1 ? 'asf-cebra-v-e' : 'asf-cebra-v';
            else suelo[i] = c === 0 ? 'asf-cuneta-o' : c === ANCHO_CALLE_102 - 1 ? 'asf-cuneta-e' : 'asf-doble-v-c';
            break;
          }
          const norte = cy < yVia;
          const r = norte ? cy - yAk0 : cy - ySur0;
          const enCruce = cx >= xC0 && cx < xC1 && norte;
          if (enCruce) {
            suelo[i] = `asf-${azar(cx, cy, 34) < 0.8 ? 'a' : 'b'}`;
          } else if (cx === xPaso) {
            suelo[i] = r === 0 ? 'asf-cebra-h-n' : r === ANCHO_CALZADA - 1 ? 'asf-cebra-h-s' : 'asf-cebra-h';
          } else if (r === 1) {
            suelo[i] = 'asf-guion-h';
          } else if (flecha(cx)) {
            suelo[i] = norte ? (r === 0 ? 'asf-flecha-o-24-n' : 'asf-flecha-o-8-s') : r === 0 ? 'asf-flecha-e-24-n' : 'asf-flecha-e-8-s';
          } else suelo[i] = r === 0 ? 'asf-cuneta-n' : 'asf-cuneta-s';
          break;
        }
        default:
          suelo[i] = `lote-${v === 'a' ? 'a' : 'b'}`;
      }
    }
  }

  // ---------- Árboles: solo los del andén y la explanada, los lejanos se quitaron ----------
  const arbol = (modelo: ModeloArbol, tx: number, ty: number, alcorque = true): void => {
    const x = Math.round(tx * CASILLA);
    const y = Math.round(ty * CASILLA);
    arboles.push({ modelo, x, y, alcorque, fase: azar(x, y, 41), espejo: azar(x, y, 42) < 0.5 });
  };
  const yArbolSur = baseSur + ANCHO_ANDEN - 0.55;
  let n = 0;
  for (let tx = L + 4.5; tx < xC0 - 4; tx += 7) {
    arbol(n === 3 ? 'jac' : n % 2 === 0 ? 'g' : 'm', tx, yArbolSur);
    n++;
  }
  arbol('m', xC0 - 1.6, yAk0 - 0.6);
  // Andén de enfrente, copas más chicas (están más lejos).
  for (let tx = X0 + 3; tx < X1 - 1; tx += 6) arbol(azar(tx, 5, 43) < 0.35 ? 'jac' : 'p', tx, yAk1 + 2.5);
  // Explanada y andén de la calle 102.
  for (const ty of [yAl1 + 4.5, yAl1 + 11, yAl1 + 17.5]) arbol(ty < 12 ? 'jac' : 'g', xC0 - 1.5, ty);
  for (const ty of [yAl1 + 4, yAl1 + 12, yAl1 + 20, baseSur - 1]) arbol(azar(ty, 9, 44) < 0.3 ? 'jac' : 'm', xC1 + 2, ty);

  // ---------- Mobiliario de calle ----------
  const poste = (tx: number, ty: number): void => {
    const x = tx * CASILLA;
    const y = ty * CASILLA;
    props.push({ frame: 'poste-luz', x, y, sombra: { frame: 'sombra-poste', dx: 6, dy: -4 } });
    focos.push({ x: x + 10, y: y - 45, radio: 3.2 * CASILLA, color: HEX.calido, intensidad: 0.8 });
  };
  const yPoste = yAk0 - 0.35;
  for (const tx of [L + 8, L + 22.5, R + 1.5, L - 8, L - 22]) poste(tx, yPoste);
  poste(xC0 - 0.6, yAl1 + 8);
  poste(xC0 - 0.6, yAl1 + 20);
  poste(xC1 + 0.7, yAl1 + 6);
  poste(xC1 + 0.7, yAl1 + 19);
  for (const tx of [L + 2, L + 15, L + 28, xC1 + 6, xC1 + 18]) poste(tx, yAk1 + 1.3);

  // Semáforos: la calle 102 antes de su cebra, la avenida en el cruce y el paso de peatones a cada lado de la avenida.
  const semaforos: Semaforo[] = [
    { x: (xC0 - 0.45) * CASILLA, y: (yCebra102 - 0.3) * CASILLA, eje: 'v' },
    { x: (xC1 + 0.5) * CASILLA, y: (yAk0 - 0.1) * CASILLA, eje: 'h' },
    { x: (xPaso + 1.45) * CASILLA, y: (yAk0 - 0.1) * CASILLA, eje: 'pc' },
    { x: (xPaso - 0.4) * CASILLA, y: (yAk1 + 1.2) * CASILLA, eje: 'pc' },
  ];

  // Paraderos de bus, uno en cada andén de la avenida, y su gente.
  const paraderos = [
    { x: (L + 30) * CASILLA, y: (baseSur + 2.3) * CASILLA },
    { x: (L + 18) * CASILLA, y: (yAk1 + 2.4) * CASILLA },
  ];
  for (const p of paraderos) {
    props.push({ frame: 'paradero', x: p.x, y: p.y });
    focos.push({ x: p.x, y: p.y - 18, radio: 2.4 * CASILLA, color: HEX.frio, intensidad: 0.55 });
  }
  const quietos: PeatonQuieto[] = [
    { x: paraderos[0]!.x - 10, y: paraderos[0]!.y + 6, variante: 2 },
    { x: paraderos[0]!.x + 6, y: paraderos[0]!.y + 6, variante: 5 },
    { x: paraderos[1]!.x, y: paraderos[1]!.y + 6, variante: 1 },
  ];
  for (const [tx, ty] of [[L + 5, yAk0 - 0.7], [L + 25, yAk0 - 0.7], [xC0 - 0.9, yAl1 + 12]] as const) props.push({ frame: 'caneca', x: tx * CASILLA, y: ty * CASILLA });
  props.push({ frame: 'bici-a', x: (R - 2) * CASILLA, y: (baseSur + 1.5) * CASILLA });
  props.push({ frame: 'bici-b', x: (R - 3.4) * CASILLA, y: (baseSur + 1.6) * CASILLA });
  props.push({ frame: 'bici-a', x: (R - 4.7) * CASILLA, y: (baseSur + 1.5) * CASILLA });
  for (const ty of [yAl1 + 6.5, yAl1 + 14]) props.push({ frame: 'banca', x: (R + 2) * CASILLA, y: ty * CASILLA });
  for (let tx = jx0 + 0.6; tx < jx1; tx += 1.3) props.push({ frame: tx % 2 < 1 ? 'arbusto-g' : 'arbusto-m', x: tx * CASILLA, y: (jy1 - 0.3) * CASILLA });
  for (let tx = jx0 + 1.2; tx < jx1; tx += 1.6) props.push({ frame: 'arbusto-p', x: tx * CASILLA, y: (jy0 + 1.2) * CASILLA });

  // Equipos de la azotea baja del edificio (los vecinos no llevan nada).
  for (const b of bloques) {
    const equipos = b.equipos ?? 0;
    const yTecho1 = b.base - b.h;
    const ancho = b.x1 - b.x0;
    const hondo = yTecho1 - b.techoY0;
    if (equipos === 0 || ancho < 5 || hondo < 2) continue;
    for (let k = 0; k < equipos; k++) {
      const cx = b.x0 + 3 + Math.floor((k * (ancho - 6)) / Math.max(1, equipos - 1));
      const frame = k % 3 === 2 ? 'tanque' : k % 2 === 0 ? 'aire-g' : 'aire-p';
      props.push({ frame, x: cx * CASILLA + 16, y: (b.techoY0 + 1.9) * CASILLA, espejo: k % 2 === 1 && frame.startsWith('aire') });
    }
  }

  // ---------- Carriles, carros y gente ----------
  const carriles: Carril[] = [];
  const xIni = X0 * CASILLA - 120;
  const xFin = X1 * CASILLA + 120;
  const yIni = Y0 * CASILLA - 120;
  const yFin = Y1 * CASILLA + 120;
  const yN1 = yAk0 * CASILLA + 24; // calzada norte: el carril pegado al andén
  const yN2 = yAk0 * CASILLA + 72;
  const yS1 = ySur0 * CASILLA + 24; // calzada sur: el carril pegado a la vía
  const yS2 = ySur0 * CASILLA + 72;
  const xSB = xC0 * CASILLA + 24; // calle 102 hacia el sur
  const xNB = xC0 * CASILLA + 72; // calle 102 hacia el norte
  const lineaJunction = xC1 * CASILLA + 10;
  const lineaPasoOeste = (xPaso + 1) * CASILLA + 10;
  const lineaPasoEste = xPaso * CASILLA - 10;
  const lineaCebra102 = yCebra102 * CASILLA - 10;
  const parada1 = paraderos[0]!.x;
  const parada2 = paraderos[1]!.x;
  // Calzada norte: los dos carriles van al oeste. Los carros de la calle 102 que giran a la derecha se unen al carril de afuera.
  carriles.push(
    {
      id: 'h-oeste-ext',
      eje: 'h',
      fijo: yN1,
      dir: -1,
      inicio: xFin,
      fin: xIni,
      pares: [{ pos: lineaJunction, senal: 'h' }, { pos: lineaPasoOeste, senal: 'pc' }],
      cantidad: 3,
      parada: parada1,
      especiales: ['bus'],
      empalme: { destino: 'v-norte', en: xNB, desde: xNB + 60, probabilidad: 0.3 },
    },
    {
      id: 'h-oeste-int',
      eje: 'h',
      fijo: yN2,
      dir: -1,
      inicio: xFin,
      fin: xIni,
      pares: [{ pos: lineaJunction, senal: 'h' }, { pos: lineaPasoOeste, senal: 'pc' }],
      cantidad: 3,
      especiales: ['moto'],
    },
    // Calzada sur: los dos carriles van al este.
    { id: 'h-este-int', eje: 'h', fijo: yS1, dir: 1, inicio: xIni, fin: xFin, pares: [{ pos: lineaPasoEste, senal: 'pc' }], cantidad: 3, especiales: ['moto'] },
    { id: 'h-este-ext', eje: 'h', fijo: yS2, dir: 1, inicio: xIni, fin: xFin, pares: [{ pos: lineaPasoEste, senal: 'pc' }], cantidad: 3, parada: parada2, especiales: ['bus'] },
    // Calle 102: baja, gira a la derecha y se une al carril de afuera de la calzada norte.
    {
      id: 'v-sur',
      eje: 'v',
      fijo: xSB,
      dir: 1,
      inicio: yIni,
      fin: yFin,
      pares: [{ pos: lineaCebra102, senal: 'v' }],
      cantidad: 2,
      empalme: { destino: 'h-oeste-ext', en: yN1, desde: yN1 - 30, probabilidad: 1 },
    },
    { id: 'v-norte', eje: 'v', fijo: xNB, dir: -1, inicio: yN1 + 4, fin: yIni, pares: [], cantidad: 1, reaparece: 'v-sur' },
  );

  const rutas: RutaPeaton[] = [];
  const ruta = (ax: number, ay: number, bx: number, by: number, velocidad: number, extra: Partial<RutaPeaton> = {}): void => {
    rutas.push({ ax, ay, bx, by, velocidad, variante: rutas.length % 6, fase: azar(rutas.length, 3, 80), ...extra });
  };
  const ySur = (baseSur + 2.35) * CASILLA;
  // Por el andén de la fachada y el de enfrente.
  ruta((X0 + 2) * CASILLA, ySur, (xC0 - 5) * CASILLA, ySur, 24);
  ruta((xC0 - 5) * CASILLA, ySur + 20, (X0 + 4) * CASILLA, ySur + 20, 20);
  ruta((L + 6) * CASILLA, ySur + 12, (L + 36) * CASILLA, ySur + 12, 27);
  ruta((X0 + 6) * CASILLA, (yAk1 + 1.8) * CASILLA, (xC0 - 4) * CASILLA, (yAk1 + 1.8) * CASILLA, 21);
  ruta((xC0 - 1.4) * CASILLA, (yAl1 + 1) * CASILLA, (xC0 - 1.4) * CASILLA, (baseSur + 2.2) * CASILLA, 22);
  // Cruzan la calle 102 por su cebra, con el turno de los peatones.
  ruta((xC0 - 1.2) * CASILLA, (yCebra102 + 0.5) * CASILLA, (xC1 + 1.2) * CASILLA, (yCebra102 + 0.5) * CASILLA, 26, { cruce: 'v' });
  ruta((xC0 - 1.2) * CASILLA, (yCebra102 + 0.3) * CASILLA, (xC1 + 1.2) * CASILLA, (yCebra102 + 0.7) * CASILLA, 24, { cruce: 'v' });
  // Cruzan la avenida entera (calzada, vía del tren y calzada) por el paso peatonal.
  const yIniCruce = (baseSur + 3.1) * CASILLA;
  const yFinCruce = (yAk1 + 1.1) * CASILLA;
  ruta((xPaso + 0.3) * CASILLA, yIniCruce, (xPaso + 0.3) * CASILLA, yFinCruce, 28, { cruce: 'ave' });
  ruta((xPaso + 0.55) * CASILLA, yIniCruce, (xPaso + 0.55) * CASILLA, yFinCruce, 27, { cruce: 'ave' });
  ruta((xPaso + 0.8) * CASILLA, yIniCruce, (xPaso + 0.8) * CASILLA, yFinCruce, 29, { cruce: 'ave' });

  return {
    geo,
    x0: X0,
    y0: Y0,
    ancho: W,
    alto: H,
    suelo,
    detalle,
    sombra,
    luz,
    zona,
    arboles,
    props,
    focos,
    carriles,
    semaforos,
    rutas,
    quietos,
    cruce: { x0: xC0 * CASILLA, y0: yAk0 * CASILLA, x1: xC1 * CASILLA, y1: yVia * CASILLA },
    paraderos,
    via: { y0: yVia * CASILLA, y1: ySur0 * CASILLA, xPaso: xPaso * CASILLA + CASILLA / 2, xMin: X0 * CASILLA - 300, xMax: X1 * CASILLA + 300 },
  };
}
