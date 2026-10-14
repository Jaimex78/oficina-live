/**
 * Sofás del lote 2A: sofá de 2 y sofá en L.
 *
 * Estilo Gather (ver `GUIA-ESTILO-GATHER.md`): tapizado arena de la rampa `crema` con botones en cruz en cada cojín, brazos
 * redondeados, base y patas de `azul-oficina` y contorno azul marino. Se modelan UNA vez como cajas en el plano `S`
 * (respaldo al norte, quien se sienta mira al sur) y de ahí salen las cuatro orientaciones (ver `l2a-cajas.ts`).
 *
 * Variantes: la rampa `crema` pasa a rojo, azul, verde, amarillo o negro; la base azul marino, las patas y el contorno no cambian.
 */

import { Lienzo } from '../nucleo';
import { caraSuperior, caraSur, dibujarCaja, girarCajas, ordenDePintado } from './l2a-cajas';
import type { CajaPlano, Giro, Proyeccion, TonosCaja } from './l2a-cajas';
import type { DibujoObjeto, ParColor } from './l2a-comun';
import { contornoGather, recolorearPares, sombraEstandar } from './l2a-comun';

// ---------------------------------------------------------------------------
// Variantes de color
// ---------------------------------------------------------------------------

const TONOS_CREMA = [0, 1, 2, 3, 4] as const;

/** Destino de cada tono de `crema` (del 0 al 4) en las variantes. El 0 y el 1 son las costuras y las sombras. */
const DESTINOS: Readonly<Record<string, readonly string[]>> = {
  rojo: ['rojo-0', 'rojo-1', 'rojo-2', 'rojo-3', 'rojo-4'],
  azul: ['azul-oficina-2', 'vidrio-0', 'vidrio-1', 'vidrio-2', 'vidrio-3'],
  verde: ['planta-0', 'planta-1', 'planta-2', 'planta-3', 'planta-4'],
  amarillo: ['tela-calida-0', 'tela-calida-1', 'tela-calida-2', 'tela-calida-3', 'tela-calida-3'],
  negro: ['neutro-1', 'neutro-2', 'neutro-3', 'neutro-4', 'neutro-5'],
};

export function varianteSofa(base: Lienzo, variante: string): Lienzo | undefined {
  const destino = DESTINOS[variante];
  if (destino === undefined) return undefined;
  const pares: ParColor[] = TONOS_CREMA.map((t) => [`crema-${t}`, destino[t] as string] as const);
  return recolorearPares(base, pares);
}

// ---------------------------------------------------------------------------
// Materiales
// ---------------------------------------------------------------------------

/** Cojín tapizado: cara superior un tono más clara que el frente, brillo arriba y a la izquierda, costura oscura al pie. */
const CREMA_SOFA: TonosCaja = { superior: 'crema-3', frente: 'crema-2', luz: 'crema-4', luzFrente: 'crema-3', sombra: 'crema-1', sombraLado: 'crema-1' };
/** Base del sofá: un zócalo azul marino bajo los cojines. */
const ZOCALO_SOFA: TonosCaja = { superior: 'azul-oficina-1', frente: 'azul-oficina-2', luzFrente: 'azul-oficina-3', sombra: 'azul-oficina-1' };
/** Patas: bloques pequeños de azul marino. */
const PIE_SOFA: TonosCaja = { superior: 'azul-oficina-3', frente: 'azul-oficina-2', sombra: 'azul-oficina-1' };

/** Botón de capitoné: una cruz de 3 x 3 píxeles en el tono de costura. */
function cruz(l: Lienzo, x: number, y: number): void {
  for (const [dx, dy] of [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1]] as const) l.px(x + dx, y + dy, 'crema-1');
}

/** Pone botones en cruz repartidos a lo largo del lado mayor de un rectángulo (uno por cada 12 px, al menos uno). */
function botones(l: Lienzo, r: { x: number; y: number; w: number; h: number }): void {
  if (r.w < 7 || r.h < 5) return;
  const horizontal = r.w >= r.h;
  const n = Math.max(1, Math.round((horizontal ? r.w : r.h) / 13));
  for (let i = 0; i < n; i++) {
    const f = (i + 0.5) / n;
    if (horizontal) cruz(l, r.x + Math.round(r.w * f), r.y + Math.floor(r.h / 2));
    else cruz(l, r.x + Math.floor(r.w / 2), r.y + Math.round(r.h * f));
  }
}

function giroDeSofa(modelo: readonly CajaPlano[], giro: Giro, W: number, D: number, lienzo: { ancho: number; alto: number }, proy: (fondo: number) => Proyeccion, costuras: readonly number[] = []): Lienzo {
  const l = new Lienzo(lienzo.ancho, lienzo.alto);
  const g = girarCajas(modelo, giro, W, D);
  const p = proy(g.fondo);
  // Los botones se pintan justo después de su cojín, así lo que lo tapa (la espalda, un brazo) también tapa los botones.
  for (const c of ordenDePintado(g.cajas, p)) {
    dibujarCaja(l, c, p);
    if (c.etiqueta === 'respaldo') botones(l, caraSur(c, p));
    else if (c.etiqueta === 'asiento') botones(l, caraSuperior(c, p));
    else if (c.etiqueta === 'panel' && giro === 'N') {
      // Vista por detrás: costuras verticales a la altura de cada cojín y un ribete cerca del borde de arriba.
      const f = caraSur(c, p);
      for (const x of costuras) l.rect(W - x, f.y + 3, 1, f.h - 6, 'crema-1');
      l.rect(f.x + 3, f.y + 3, f.w - 6, 1, 'crema-1');
    }
  }
  contornoGather(l);
  return sombraEstandar(l);
}

// ---------------------------------------------------------------------------
// Sofá de 2
// ---------------------------------------------------------------------------

/** Sofá de 2 en el plano `S`: 64 de ancho por 32 de fondo. */
export function modeloSofa2(): CajaPlano[] {
  const cajas: CajaPlano[] = [];
  for (const [x, y] of [[4, 5], [54, 5], [4, 25], [54, 25]] as const) {
    cajas.push({ x0: x, y0: y, x1: x + 5, y1: y + 4, z0: 0, z1: 2, tonos: PIE_SOFA });
  }
  cajas.push({ x0: 2, y0: 2, x1: 60, y1: 30, z0: 2, z1: 5, tonos: ZOCALO_SOFA });
  // Respaldo: panel entre los brazos y dos cojines pegados a su cara sur.
  cajas.push({ x0: 9, y0: 0, x1: 52, y1: 9, z0: 5, z1: 21, tonos: { ...CREMA_SOFA, luzFrente: undefined }, esquinas: 3, etiqueta: 'panel' });
  for (const x of [9, 31]) cajas.push({ x0: x, y0: 9, x1: x + (x === 9 ? 22 : 21), y1: 13, z0: 10, z1: 20, tonos: CREMA_SOFA, esquinas: 2, giros: ['S'], etiqueta: 'respaldo' });
  // Asiento: dos cojines.
  for (const x of [9, 31]) cajas.push({ x0: x, y0: 9, x1: x + (x === 9 ? 22 : 21), y1: 30, z0: 5, z1: 10, tonos: CREMA_SOFA, esquinas: 2, etiqueta: 'asiento' });
  // Brazos: recorren todo el fondo del sofá, redondeados.
  for (const x of [1, 52]) cajas.push({ x0: x, y0: 0, x1: x + 8, y1: 30, z0: 5, z1: 15, tonos: CREMA_SOFA, esquinas: 2 });
  return cajas;
}

export function dibujoSofa2(): DibujoObjeto {
  const modelo = modeloSofa2();
  const de = (giro: Giro): Lienzo => {
    const gira90 = giro === 'E' || giro === 'O';
    return giroDeSofa(modelo, giro, 64, 32, gira90 ? { ancho: 32, alto: 72 } : { ancho: 64, alto: 40 }, (fondo) => (gira90 ? { base: 68, fondo, ky: 0.7 } : { base: 36, fondo, ky: 0.4 }), [31]);
  };
  return { rampaBase: 'crema', vistas: { S: de('S'), N: de('N'), E: de('E'), O: de('O') }, variante: varianteSofa };
}

// ---------------------------------------------------------------------------
// Sofá en L
// ---------------------------------------------------------------------------

/**
 * Sofá en L en el plano `S`: 96 de ancho por 64 de fondo. El brazo largo corre a lo ancho por el norte (3 casillas)
 * y la chaise baja por el extremo este una casilla más (x 64 a 93, dentro de la tercera casilla). El rincón libre
 * (x 0 a 63, y 32 a 64) queda sin dibujar.
 *
 * En cada orientación quien se sienta mira hacia donde dice la orientación, con la espalda contra el respaldo:
 *   S: respaldo al norte, chaise al este · E: respaldo al oeste, chaise al norte
 *   N: respaldo al sur, chaise al oeste  · O: respaldo al este, chaise al sur
 * Casillas ocupadas (dx, dy desde la esquina superior izquierda de la huella ya girada):
 *   S [[0,0],[1,0],[2,0],[2,1]] · N [[0,0],[0,1],[1,1],[2,1]] · E [[0,0],[0,1],[0,2],[1,0]] · O [[0,2],[1,0],[1,1],[1,2]]
 */
export function modeloSofaL(): CajaPlano[] {
  const cajas: CajaPlano[] = [];
  for (const [x, y] of [[4, 25], [50, 25], [66, 57], [86, 57]] as const) {
    cajas.push({ x0: x, y0: y, x1: x + 5, y1: y + 4, z0: 0, z1: 2, tonos: PIE_SOFA });
  }
  for (const [x, y] of [[4, 5], [86, 5]] as const) cajas.push({ x0: x, y0: y, x1: x + 5, y1: y + 4, z0: 0, z1: 2, tonos: PIE_SOFA });
  // Zócalo bajo el brazo largo y bajo la chaise.
  cajas.push({ x0: 2, y0: 2, x1: 92, y1: 30, z0: 2, z1: 5, tonos: ZOCALO_SOFA });
  cajas.push({ x0: 64, y0: 30, x1: 92, y1: 62, z0: 2, z1: 5, tonos: ZOCALO_SOFA });
  // Respaldo: un panel entre los brazos y tres cojines pegados a su cara sur.
  cajas.push({ x0: 9, y0: 0, x1: 85, y1: 9, z0: 5, z1: 21, tonos: { ...CREMA_SOFA, luzFrente: undefined }, esquinas: 3, etiqueta: 'panel' });
  for (const [x0, x1] of [[9, 34], [34, 60], [60, 85]] as const) {
    cajas.push({ x0, y0: 9, x1, y1: 13, z0: 10, z1: 20, tonos: CREMA_SOFA, esquinas: 2, giros: ['S'], etiqueta: 'respaldo' });
  }
  // Asiento: tres cojines en el brazo largo (el último es el de la esquina) y la chaise.
  for (const [x0, x1] of [[9, 34], [34, 60], [60, 85]] as const) {
    cajas.push({ x0, y0: 9, x1, y1: 30, z0: 5, z1: 10, tonos: CREMA_SOFA, esquinas: 2, etiqueta: 'asiento' });
  }
  cajas.push({ x0: 64, y0: 30, x1: 85, y1: 62, z0: 5, z1: 10, tonos: CREMA_SOFA, esquinas: 2, etiqueta: 'asiento' });
  // Brazos: el izquierdo cierra el brazo largo; el derecho recorre todo el costado hasta el final de la chaise.
  cajas.push({ x0: 1, y0: 0, x1: 9, y1: 30, z0: 5, z1: 15, tonos: CREMA_SOFA, esquinas: 2 });
  cajas.push({ x0: 85, y0: 0, x1: 93, y1: 62, z0: 5, z1: 15, tonos: CREMA_SOFA, esquinas: 2 });
  return cajas;
}

export function dibujoSofaL(): DibujoObjeto {
  const modelo = modeloSofaL();
  const tramos: Record<Giro, ReadonlyArray<readonly [number, number]>> = {
    S: [[0, 23.2], [30, 35.2], [62, 67]],
    N: [[2, 24], [34, 56], [64, 68]],
    // En E y O la chaise ocupa una sola casilla: su piso se mantiene dentro de ella (tramo más corto) y el resto sigue la escala normal.
    E: [[3, 18], [32, 38], [96, 100]],
    O: [[1, 18], [64, 82], [96, 100]],
  };
  const de = (giro: Giro): Lienzo => {
    const gira90 = giro === 'E' || giro === 'O';
    return giroDeSofa(modelo, giro, 96, 64, gira90 ? { ancho: 64, alto: 104 } : { ancho: 96, alto: 72 }, (fondo) => ({ base: gira90 ? 100 : 68, fondo, ky: gira90 ? 0.7 : 0.4, tramos: tramos[giro] }), [34, 60]);
  };
  return { rampaBase: 'crema', vistas: { S: de('S'), N: de('N'), E: de('E'), O: de('O') }, variante: varianteSofa };
}
