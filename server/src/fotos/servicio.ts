import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { FOTO_PERFIL } from '@ol/shared';
import { ErrorHttp } from '../errores';

/**
 * Fotos de perfil.
 *
 * - El tipo se decide por la firma de bytes del archivo, nunca por la extensión ni por el Content-Type.
 * - `sharp` decodifica de verdad la imagen (si no es una imagen entera y válida, falla), la gira según su EXIF,
 *   recorta al centro en cuadrado, la reduce a 256x256 y la vuelve a codificar como WebP. La salida no
 *   lleva metadatos (ni EXIF, ni GPS, ni perfil de color): sharp los descarta si no se le pide conservarlos.
 * - Se guardan en `<carpeta de datos>/fotos`, fuera de cualquier carpeta pública, con un nombre al azar.
 */

export type TipoImagen = 'jpeg' | 'png' | 'webp';

/** Lo que dice la firma de los primeros bytes. `null`: no es JPG, PNG ni WebP. */
export function tipoPorFirma(b: Buffer): TipoImagen | null {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpeg';
  if (b.length >= 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (b.length >= 12 && b.toString('latin1', 0, 4) === 'RIFF' && b.toString('latin1', 8, 12) === 'WEBP') return 'webp';
  return null;
}

/** Solo un archivo que este servicio creó: 32 letras hexadecimales y .webp. Evita salir de la carpeta con un nombre raro. */
const NOMBRE_VALIDO = /^[0-9a-f]{32}\.webp$/;

export function carpetaFotos(dataDir: string): string {
  const dir = path.join(dataDir, 'fotos');
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  return dir;
}

/** Versión que se muestra: 0 si la persona no tiene foto. */
export function versionFoto(u: { fotoArchivo: string; fotoVersion: number }): number {
  return u.fotoArchivo ? u.fotoVersion : 0;
}

/** Valida y reduce lo que llegó. Devuelve el WebP de 256x256 listo para guardar. */
export async function procesarFoto(entrada: Buffer): Promise<Buffer> {
  if (entrada.length === 0) throw new ErrorHttp(400, 'No llegó ninguna imagen.', 'foto_vacia');
  if (entrada.length > FOTO_PERFIL.maxBytes) throw new ErrorHttp(413, 'La foto pesa más de 3 MB.', 'foto_grande');
  if (!tipoPorFirma(entrada)) throw new ErrorHttp(415, 'Sube una foto JPG, PNG o WebP.', 'foto_tipo');
  try {
    return await sharp(entrada, { limitInputPixels: 25_000_000, failOn: 'error' })
      .rotate()
      .resize(FOTO_PERFIL.lado, FOTO_PERFIL.lado, { fit: 'cover', position: 'centre' })
      .webp({ quality: 86 })
      .toBuffer();
  } catch {
    throw new ErrorHttp(415, 'No se pudo leer esa imagen. Prueba con otra foto JPG, PNG o WebP.', 'foto_tipo');
  }
}

/** Guarda el WebP con un nombre al azar y devuelve ese nombre. */
export async function guardarArchivoFoto(dataDir: string, webp: Buffer): Promise<string> {
  const nombre = `${crypto.randomBytes(16).toString('hex')}.webp`;
  await fs.promises.writeFile(path.join(carpetaFotos(dataDir), nombre), webp, { mode: 0o600, flag: 'wx' });
  return nombre;
}

export async function borrarArchivoFoto(dataDir: string, nombre: string): Promise<void> {
  if (!NOMBRE_VALIDO.test(nombre)) return;
  await fs.promises.rm(path.join(dataDir, 'fotos', nombre), { force: true });
}

export function rutaArchivoFoto(dataDir: string, nombre: string): string | null {
  return NOMBRE_VALIDO.test(nombre) ? path.join(dataDir, 'fotos', nombre) : null;
}

/** Límite sencillo por persona: unas pocas fotos nuevas por ventana. Se pierde al reiniciar, a propósito. */
export class LimiteFotos {
  private readonly marcas = new Map<number, number[]>();
  constructor(
    private readonly maximo = 15,
    private readonly ventanaMs = 10 * 60_000,
  ) {}

  /** Anota un intento. Devuelve false si ya hubo demasiados. */
  permitir(usuarioId: number, ahora = Date.now()): boolean {
    const recientes = (this.marcas.get(usuarioId) ?? []).filter((t) => ahora - t < this.ventanaMs);
    if (recientes.length >= this.maximo) {
      this.marcas.set(usuarioId, recientes);
      return false;
    }
    recientes.push(ahora);
    this.marcas.set(usuarioId, recientes);
    return true;
  }
}
