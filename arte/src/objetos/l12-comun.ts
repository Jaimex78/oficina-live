/**
 * Ayudas del lote 12 (atlas `objetos-v13`): objetos de pared dibujados a mano con el acabado de Gather v2.
 *
 * Geometría (la de `GUIA-OBJETOS.md` sección 5): un colgante mide `ancho * 32` por `32 + sobresale`. La cara de la pared llega
 * hasta 9 filas antes del borde de abajo (ahí empieza el zócalo), así que se dibuja entre la fila 1 y la fila `H - 10`.
 * `registrarPared` toma UN dibujo de frente (sin contorno) y saca de él las tres orientaciones: el frente (`S`) y dos placas
 * delgadas pegadas a la franja de la tapa de las paredes verticales (`E` y `O`), con el color del marco del dibujo.
 * Las ventanas (aberturas) llevan su propio lateral: ver `l12-ventanas.ts`.
 */

import { objetoPorId } from '@ol/shared';
import { Lienzo, RAMPAS, ubicarEnPaleta } from '../nucleo';
import type { ColorEntrada } from '../nucleo';
import { cerrarColgado } from './l4-comun';
import { registrarR } from './l9-comun';
import type { Cuadros } from './l4-comun';

export { cerrarColgado, registrarR };
export type { Cuadros };
export { azar } from './l2b-comun';

export type Dibujo = (l: Lienzo, W: number, H: number) => void;

/** Última fila dibujable de la cara de la pared en un cuadro de alto `H`. */
export const fondo = (H: number): number => H - 10;

/** Tono vecino dentro de su rampa (`paso` positivo aclara, negativo oscurece). Si no es de la paleta, lo deja igual. */
export function vecino(hex: string, paso: number): string {
  const u = ubicarEnPaleta(hex);
  if (u === null) return hex;
  const tonos = RAMPAS[u.rampa] as readonly string[];
  return tonos[Math.min(tonos.length - 1, Math.max(0, u.indice + paso))] ?? hex;
}

/** Tonos de un marco con bisel: luz arriba a la izquierda, sombra abajo a la derecha. */
export interface Marco3 {
  luz: ColorEntrada;
  medio: ColorEntrada;
  sombra: ColorEntrada;
}
export const marcoDe = (rampa: string, sombra: number, medio: number, luz: number): Marco3 => ({ luz: `${rampa}-${luz}`, medio: `${rampa}-${medio}`, sombra: `${rampa}-${sombra}` });

export const NOGAL = marcoDe('madera-oscura', 1, 2, 3);
export const ROBLE = marcoDe('madera-clara', 1, 2, 3);
export const DORADO = marcoDe('tela-calida', 0, 1, 3);
export const NEGRO = marcoDe('neutro', 1, 2, 3);
export const BLANCO = marcoDe('neutro', 4, 6, 7);
export const PLATA = marcoDe('metal', 1, 2, 3);

/** Marco biselado de `g` px de grosor; devuelve el rectángulo interior para pintar el contenido. */
export function marco(l: Lienzo, x: number, y: number, w: number, h: number, m: Marco3, g = 2): { x: number; y: number; w: number; h: number } {
  l.rect(x, y, w, h, m.medio);
  l.rect(x, y, w, 1, m.luz);
  l.rect(x, y, 1, h, m.luz);
  l.rect(x + w - 1, y + 1, 1, h - 1, m.sombra);
  l.rect(x + 1, y + h - 1, w - 1, 1, m.sombra);
  if (g >= 3) {
    // Filo interior: sombra arriba y a la izquierda, luz abajo y a la derecha.
    l.rect(x + g - 1, y + g - 1, w - 2 * g + 2, 1, m.sombra);
    l.rect(x + g - 1, y + g - 1, 1, h - 2 * g + 2, m.sombra);
  }
  return { x: x + g, y: y + g, w: w - 2 * g, h: h - 2 * g };
}

/** Centra un cuadro de `w` por `h` en la cara de una pared de `W` por `H`; devuelve la esquina de arriba a la izquierda. */
export function centrar(W: number, H: number, w: number, h: number): [number, number] {
  const alto = fondo(H);
  return [Math.floor((W - 2 - w) / 2) + 1, Math.max(1, Math.floor((alto - h) / 2) + 1)];
}

// ---------------------------------------------------------------------------
// Laterales
// ---------------------------------------------------------------------------

/** Color más común del anillo exterior (2 px) del dibujo: el color del marco. */
function colorDeMarco(s: Lienzo, caja: { x: number; y: number; w: number; h: number }, desde?: readonly string[]): string {
  if (desde !== undefined) {
    // Si el objeto tiene variantes, la placa toma el color que cambia (así cada variante se ve distinta de lado).
    const propios = new Set(desde.map((h) => h.toUpperCase()));
    const mas = [...s.colores().entries()].filter(([h]) => propios.has(h.toUpperCase()));
    const medio = mas.sort((a, b) => b[1] - a[1])[0]?.[0];
    if (medio !== undefined) return medio;
  }
  const cuenta = new Map<string, number>();
  for (let y = caja.y; y < caja.y + caja.h; y++) {
    for (let x = caja.x; x < caja.x + caja.w; x++) {
      const borde = x < caja.x + 2 || x >= caja.x + caja.w - 2 || y < caja.y + 2 || y >= caja.y + caja.h - 2;
      const hex = s.leerHex(x, y);
      if (borde && hex !== null) cuenta.set(hex, (cuenta.get(hex) ?? 0) + 1);
    }
  }
  return [...cuenta.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))[0]?.[0] ?? '#8794A8';
}

/**
 * Lateral de un colgante: placa de 3 columnas pegada a la franja de la tapa (el este a la derecha, el oeste a la izquierda),
 * del color del marco. Su largo sale del alto y el ancho del dibujo de frente.
 */
export function lateral(s: Lienzo, ancho: number, sobresale: number, lado: 'E' | 'O', desde?: readonly string[]): Lienzo {
  const caja = s.cajaOpaca();
  if (caja === null) throw new Error('El dibujo de frente está vacío.');
  const H = 32 * ancho + sobresale;
  const l = new Lienzo(32, H);
  const marcoHex = colorDeMarco(s, caja, desde);
  const largo = Math.min(H - 12, Math.max(8, caja.h, Math.round(caja.w * 0.5)));
  const centro = caja.y + caja.h / 2 + 16 * (ancho - 1);
  const y0 = Math.max(2, Math.min(H - 10 - largo, Math.round(centro - largo / 2)));
  const x0 = lado === 'E' ? 21 : 7;
  const tonos: string[] = lado === 'E' ? [marcoHex, marcoHex, vecino(marcoHex, -1)] : [vecino(marcoHex, 1), marcoHex, vecino(marcoHex, -1)];
  tonos.forEach((t, i) => l.rect(x0 + i, y0, 1, largo, t));
  l.rect(x0, y0, 3, 1, vecino(marcoHex, 1));
  l.rect(x0, y0 + largo - 1, 3, 1, vecino(marcoHex, -1));
  return l;
}

/**
 * Registra las tres orientaciones de un colgante a partir de un dibujo de frente. `desde` es la rampa del material que cambia
 * entre variantes (una sola por objeto).
 */
export function registrarPared(c: Cuadros, id: string, dibujar: Dibujo, desde?: readonly string[]): void {
  const o = objetoPorId(id);
  if (o === undefined) throw new Error(`[${id}] no existe en el inventario.`);
  const W = o.ancho * 32;
  const H = 32 + o.sobresale;
  const s = new Lienzo(W, H);
  dibujar(s, W, H);
  registrarR(c, id, 'S', cerrarColgado(s.copiar()), desde);
  registrarR(c, id, 'E', cerrarColgado(lateral(s, o.ancho, o.sobresale, 'E', desde)), desde);
  registrarR(c, id, 'O', cerrarColgado(lateral(s, o.ancho, o.sobresale, 'O', desde)), desde);
}

export type Fila = readonly [id: string, dibujar: Dibujo, desde?: readonly string[]];

/** Registra una tabla `[id, dibujo, rampa de origen]`. */
export function registrarTabla(c: Cuadros, tabla: readonly Fila[]): Cuadros {
  for (const [id, dibujar, desde] of tabla) registrarPared(c, id, dibujar, desde);
  return c;
}
