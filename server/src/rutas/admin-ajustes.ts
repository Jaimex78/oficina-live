import { Router } from 'express';
import { z } from 'zod';
import type { Contexto } from '../contexto';
import { parsear } from '../errores';

const esqGuardar = z.object({
  cambios: z.record(z.unknown(), { invalid_type_error: 'Los cambios no tienen un formato válido.' }),
});

export function rutasAdminAjustes(ctx: Contexto): Router {
  const r = Router();

  r.get('/', (_req, res) => {
    res.json({ grupos: ctx.ajustes.grupos() });
  });

  r.put('/', async (req, res) => {
    const d = parsear(esqGuardar, req.body);
    const cambiados = await ctx.ajustes.guardar(d.cambios);
    if (cambiados.length > 0) {
      const detalle = cambiados.map((c) => `${c}=${String(ctx.ajustes.obtener(c))}`).join('; ');
      await ctx.auditoria.registrar({ usuario: req.usuario!, accion: 'ajustes_guardados', objeto: cambiados.join(', '), detalle, ip: req.ipReal });
    }
    res.json({ grupos: ctx.ajustes.grupos(), cambiados });
  });

  return r;
}
