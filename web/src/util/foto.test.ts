import { beforeEach, describe, expect, it, vi } from 'vitest';
import { claveFoto, cuadroDeRecorte, inicialDeNombre, problemaConArchivo, rutaFoto, tieneFoto } from './foto';

describe('foto de perfil: lógica pura', () => {
  it('la ruta lleva la versión y la clave la incluye', () => {
    expect(rutaFoto(7, 3)).toBe('/fotos/7?v=3');
    expect(claveFoto(7, 3)).toBe('7:3');
    expect(claveFoto(7, 3)).not.toBe(claveFoto(7, 4));
  });

  it('tiene foto solo con una versión mayor que 0', () => {
    expect(tieneFoto(0)).toBe(false);
    expect(tieneFoto(undefined)).toBe(false);
    expect(tieneFoto(null)).toBe(false);
    expect(tieneFoto(NaN)).toBe(false);
    expect(tieneFoto(1)).toBe(true);
  });

  it('la inicial es la primera letra en mayúscula, y un signo si no hay nombre', () => {
    expect(inicialDeNombre('  ana Gómez')).toBe('A');
    expect(inicialDeNombre('ñandú')).toBe('Ñ');
    expect(inicialDeNombre('')).toBe('?');
  });

  it('rechaza tipos que no son JPG, PNG o WebP, y lo que pesa más de 3 MB', () => {
    expect(problemaConArchivo({ type: 'image/png', size: 1000 })).toBeNull();
    expect(problemaConArchivo({ type: 'image/jpeg', size: 3 * 1024 * 1024 })).toBeNull();
    expect(problemaConArchivo({ type: 'image/gif', size: 1000 })).toMatch(/JPG, PNG o WebP/);
    expect(problemaConArchivo({ type: 'application/pdf', size: 1000 })).not.toBeNull();
    expect(problemaConArchivo({ type: 'image/png', size: 3 * 1024 * 1024 + 1 })).toMatch(/3 MB/);
    expect(problemaConArchivo({ type: 'image/png', size: 0 })).not.toBeNull();
  });

  it('el recorte siempre es un cuadrado dentro de la imagen', () => {
    const centrado = cuadroDeRecorte(800, 400, 1, 0.5, 0.5);
    expect(centrado).toEqual({ x: 200, y: 0, lado: 400 });
    const acercado = cuadroDeRecorte(800, 400, 2, 0.5, 0.5);
    expect(acercado.lado).toBe(200);
    // En las esquinas no se sale de la imagen.
    const esquina = cuadroDeRecorte(800, 400, 4, 0, 1);
    expect(esquina.x).toBe(0);
    expect(esquina.y + esquina.lado).toBeLessThanOrEqual(400);
    const otra = cuadroDeRecorte(800, 400, 4, 1, 0);
    expect(otra.x + otra.lado).toBeLessThanOrEqual(800);
    // El zoom se limita.
    expect(cuadroDeRecorte(400, 400, 0.1, 0.5, 0.5).lado).toBe(400);
  });
});

describe('caché de fotos', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('pide cada (persona, versión) una sola vez y vuelve a pedir si cambia la versión', async () => {
    const obtenerBlob = vi.fn(async () => new Blob(['x'], { type: 'image/webp' }));
    vi.doMock('../api', () => ({ obtenerBlob }));
    let n = 0;
    vi.stubGlobal('URL', { createObjectURL: () => `blob:prueba-${++n}`, revokeObjectURL: vi.fn() });
    const { cargarFoto, fotoEnCache, limpiarCacheFotos } = await import('./cacheFotos');

    const [a, b] = await Promise.all([cargarFoto(5, 1), cargarFoto(5, 1)]);
    expect(a).toBe(b);
    expect(obtenerBlob).toHaveBeenCalledTimes(1);
    expect(obtenerBlob).toHaveBeenCalledWith('/fotos/5?v=1');
    expect(fotoEnCache(5, 1)).toBe(a);
    await cargarFoto(5, 2);
    expect(obtenerBlob).toHaveBeenCalledTimes(2);
    limpiarCacheFotos();
    expect(fotoEnCache(5, 1)).toBeNull();
    vi.unstubAllGlobals();
  });

  it('si la carga falla devuelve null y no insiste enseguida', async () => {
    const obtenerBlob = vi.fn(async () => {
      throw new Error('404');
    });
    vi.doMock('../api', () => ({ obtenerBlob }));
    const { cargarFoto } = await import('./cacheFotos');
    expect(await cargarFoto(9, 1)).toBeNull();
    expect(await cargarFoto(9, 1)).toBeNull();
    expect(obtenerBlob).toHaveBeenCalledTimes(1);
  });
});
