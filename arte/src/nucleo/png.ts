/**
 * Lectura y escritura de PNG con `pngjs`.
 *
 * La salida es determinista: los mismos píxeles producen siempre los mismos
 * bytes (RGBA de 8 bits, sin metadatos, filtro automático y compresión máxima).
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { PNG } from 'pngjs';
import { Lienzo } from './lienzo';

/** Convierte un lienzo en los bytes de un PNG RGBA de 8 bits. */
export function codificarPng(lienzo: Lienzo): Buffer {
  const png = new PNG({ width: lienzo.ancho, height: lienzo.alto });
  png.data.set(lienzo.datos);
  return PNG.sync.write(png, {
    colorType: 6,
    inputColorType: 6,
    inputHasAlpha: true,
    bitDepth: 8,
    deflateLevel: 9,
    filterType: -1,
  });
}

/** Escribe el lienzo como PNG, creando las carpetas que falten. */
export function escribirPng(lienzo: Lienzo, ruta: string): void {
  mkdirSync(dirname(ruta), { recursive: true });
  writeFileSync(ruta, codificarPng(lienzo));
}

/** Lee los bytes de un PNG y devuelve un lienzo. Los píxeles de alfa 0 quedan en (0, 0, 0, 0). */
export function decodificarPng(bytes: Uint8Array): Lienzo {
  const png = PNG.sync.read(Buffer.from(bytes));
  return Lienzo.desdeDatos(png.width, png.height, png.data);
}

/** Lee un archivo PNG del disco. */
export function leerPng(ruta: string): Lienzo {
  return decodificarPng(readFileSync(ruta));
}
