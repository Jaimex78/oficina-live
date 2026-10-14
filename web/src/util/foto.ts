/** Lógica pura de la foto de perfil (sin React): rutas, inicial y límites. */

/** La foto es solo el ícono de la persona. Nunca reemplaza a su personaje en el mapa. */
export const FOTO_TIPOS_ACEPTADOS = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const FOTO_MAX_BYTES = 3 * 1024 * 1024;

/** La ruta de la API. La versión va en la consulta: cambia al subir o borrar y deja la respuesta anterior en caché sin riesgo. */
export function rutaFoto(id: number, version: number): string {
  return `/fotos/${Math.trunc(id)}?v=${Math.trunc(version)}`;
}

export function claveFoto(id: number, version: number): string {
  return `${Math.trunc(id)}:${Math.trunc(version)}`;
}

/** Una persona tiene foto si su versión es un número mayor que 0. */
export function tieneFoto(version: number | null | undefined): version is number {
  return typeof version === 'number' && Number.isFinite(version) && version > 0;
}

/** La letra para el círculo cuando no hay foto: la primera del nombre, en mayúscula. */
export function inicialDeNombre(nombre: string): string {
  const letra = Array.from(nombre.trim())[0];
  return letra ? letra.toUpperCase() : '?';
}

/** Mensaje claro si el archivo no sirve; `null` si puede subirse. El servidor vuelve a comprobarlo por su firma real. */
export function problemaConArchivo(archivo: { type: string; size: number }): string | null {
  if (!(FOTO_TIPOS_ACEPTADOS as readonly string[]).includes(archivo.type)) return 'Sube una foto JPG, PNG o WebP.';
  if (archivo.size > FOTO_MAX_BYTES) return 'La foto pesa más de 3 MB. Elige una más liviana.';
  if (archivo.size === 0) return 'Ese archivo está vacío.';
  return null;
}

/**
 * Cuadro de recorte sobre una imagen de `ancho` x `alto`, con zoom (1 = lo más grande posible que cabe) y
 * el centro del cuadro como fracción 0..1 de la imagen. Devuelve el cuadrado en píxeles de la imagen, siempre dentro de ella.
 */
export function cuadroDeRecorte(ancho: number, alto: number, zoom: number, centroX: number, centroY: number): { x: number; y: number; lado: number } {
  const z = Math.min(Math.max(zoom, 1), 8);
  const lado = Math.max(1, Math.min(ancho, alto) / z);
  const x = Math.min(Math.max(centroX * ancho - lado / 2, 0), Math.max(ancho - lado, 0));
  const y = Math.min(Math.max(centroY * alto - lado / 2, 0), Math.max(alto - lado, 0));
  return { x, y, lado };
}
