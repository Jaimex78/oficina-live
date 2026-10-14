/**
 * Ayudas compartidas por las pruebas del núcleo de arte.
 */

import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Lienzo } from '../src/nucleo';

/** Generador pseudoaleatorio con semilla (mulberry32): mismas semillas, mismos números. */
export function aleatorio(semilla: number): () => number {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Carpeta temporal que se borra sola al llamar a `limpiar`. */
export function carpetaTemporal(prefijo = 'ol-arte-'): { ruta: string; limpiar: () => void } {
  const ruta = mkdtempSync(join(tmpdir(), prefijo));
  return { ruta, limpiar: () => rmSync(ruta, { recursive: true, force: true }) };
}

/** Cuántos píxeles distintos hay entre dos columnas del lienzo. */
export function diferenciasEntreColumnas(l: Lienzo, a: number, b: number): number {
  let n = 0;
  for (let y = 0; y < l.alto; y++) if (l.leerHex(a, y) !== l.leerHex(b, y)) n++;
  return n;
}

/** Cuántos píxeles distintos hay entre dos filas del lienzo. */
export function diferenciasEntreFilas(l: Lienzo, a: number, b: number): number {
  let n = 0;
  for (let x = 0; x < l.ancho; x++) if (l.leerHex(x, a) !== l.leerHex(x, b)) n++;
  return n;
}

/** Un sprite rectangular de un solo color, para pruebas de empaquetado. */
export function bloque(ancho: number, alto: number, color: string): Lienzo {
  return new Lienzo(ancho, alto).rect(0, 0, ancho, alto, color);
}

/** Comprueba que todo píxel sea alfa 0 (con RGB en cero) o alfa 255. */
export function soloAlfaBinario(l: Lienzo): boolean {
  for (let i = 0; i < l.datos.length; i += 4) {
    const a = l.datos[i + 3];
    if (a === 0) {
      if (l.datos[i] !== 0 || l.datos[i + 1] !== 0 || l.datos[i + 2] !== 0) return false;
    } else if (a !== 255) {
      return false;
    }
  }
  return true;
}
