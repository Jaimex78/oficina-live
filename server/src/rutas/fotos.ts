import fs from 'node:fs';
import { Router } from 'express';
import type { Contexto } from '../contexto';
import { ErrorHttp } from '../errores';
import { rutaArchivoFoto, versionFoto } from '../fotos/servicio';

/**
 * Lectura de fotos de perfil. Va detrás de la sesión (el montaje en app.ts pone `mw.operador`):
 * ninguna foto se sirve a quien no haya iniciado sesión, y la carpeta no es pública.
 *
 * GET /api/fotos/:usuarioId?v=<versión>
 * - Con `v` igual a la versión actual: la respuesta no cambia nunca, se guarda un año (solo en el navegador de la persona).
 * - Sin `v` o con otra: se entrega la actual, pero el navegador debe revisarla con ETag cada vez.
 */
export function rutasFotos(ctx: Contexto): Router {
  const r = Router();

  r.get('/:usuarioId', async (req, res) => {
    const id = Number(req.params['usuarioId']);
    if (!Number.isInteger(id) || id < 1) throw new ErrorHttp(404, 'Esa persona no tiene foto.');
    const u = await ctx.prisma.usuario.findUnique({ where: { id }, select: { activo: true, fotoArchivo: true, fotoVersion: true } });
    const ruta = u?.activo ? rutaArchivoFoto(ctx.config.dataDir, u.fotoArchivo) : null;
    if (!u || !ruta) throw new ErrorHttp(404, 'Esa persona no tiene foto.');
    let datos: Buffer;
    try {
      datos = await fs.promises.readFile(ruta);
    } catch {
      throw new ErrorHttp(404, 'Esa persona no tiene foto.');
    }
    const version = versionFoto(u);
    const etag = `"foto-${id}-${version}"`;
    const inmutable = req.query['v'] === String(version);
    res.setHeader('ETag', etag);
    res.setHeader('Cache-Control', inmutable ? 'private, max-age=31536000, immutable' : 'private, no-cache');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Type', 'image/webp');
    res.setHeader('Content-Disposition', 'inline');
    if (req.headers['if-none-match'] === etag) {
      res.status(304).end();
      return;
    }
    res.end(datos);
  });

  return r;
}
