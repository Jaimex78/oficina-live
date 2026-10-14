import { Router } from 'express';
import type { Contexto } from '../contexto';
import { ErrorHttp } from '../errores';

/** Los avisos de quien tiene la sesión abierta: cualquiera puede ver y marcar los suyos, y solo los suyos. */
export function rutasNotificaciones(ctx: Contexto, operador: import('express').RequestHandler[]): Router {
  const r = Router();

  r.get('/', ...operador, async (req, res) => {
    res.json(await ctx.notificaciones.listar(req.usuario!.id));
  });

  r.post('/leidas', ...operador, async (req, res) => {
    await ctx.notificaciones.marcarTodas(req.usuario!.id);
    res.json({ ok: true });
  });

  r.post('/:id/leida', ...operador, async (req, res) => {
    const id = Number(req.params['id']);
    if (!Number.isInteger(id) || id < 1) throw new ErrorHttp(404, 'Ese aviso ya no existe.');
    await ctx.notificaciones.marcarLeida(req.usuario!.id, id);
    res.json({ ok: true });
  });

  return r;
}
