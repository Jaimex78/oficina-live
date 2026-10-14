import { Router } from 'express';
import type { Contexto } from '../contexto';
import { ErrorHttp } from '../errores';

export function rutasAdminRespaldos(ctx: Contexto): Router {
  const r = Router();

  r.get('/', (_req, res) => {
    res.json({ respaldos: ctx.respaldos.listar() });
  });

  r.post('/', async (req, res) => {
    const respaldo = await ctx.respaldos.crear('manual');
    await ctx.auditoria.registrar({ usuario: req.usuario!, accion: 'respaldo_manual', objeto: respaldo.nombre, ip: req.ipReal });
    res.status(201).json({ respaldo, respaldos: ctx.respaldos.listar() });
  });

  r.get('/:nombre', async (req, res) => {
    const nombre = String(req.params['nombre']);
    const ruta = ctx.respaldos.ruta(nombre);
    if (!ruta) throw new ErrorHttp(404, 'No existe ese respaldo.');
    await ctx.auditoria.registrar({ usuario: req.usuario!, accion: 'respaldo_descargado', objeto: nombre, ip: req.ipReal });
    res.download(ruta, nombre);
  });

  return r;
}
