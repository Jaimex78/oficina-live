import { Router } from 'express';
import type { Solicitud } from '@prisma/client';
import type { SolicitudAcceso } from '@ol/shared';
import { z } from 'zod';
import type { Contexto } from '../contexto';
import { ErrorHttp, parsear } from '../errores';

const esqAtender = z.object({
  estado: z.enum(['atendida', 'rechazada'], { errorMap: () => ({ message: 'Elige atendida o rechazada.' }) }),
});

function aSolicitud(s: Solicitud): SolicitudAcceso {
  return {
    id: s.id,
    nombre: s.nombre,
    correo: s.correo,
    cargo: s.cargo,
    mensaje: s.mensaje,
    ip: s.ip,
    estado: s.estado === 'atendida' || s.estado === 'rechazada' ? s.estado : 'pendiente',
    creadaEn: s.creadaEn.toISOString(),
    atendidaPor: s.atendidaPor,
    atendidaEn: s.atendidaEn ? s.atendidaEn.toISOString() : null,
  };
}

export function rutasAdminSolicitudes(ctx: Contexto): Router {
  const r = Router();

  r.get('/', async (req, res) => {
    const estado = req.query['estado'];
    const filas = await ctx.prisma.solicitud.findMany({
      where: estado === 'pendiente' || estado === 'atendida' || estado === 'rechazada' ? { estado } : {},
      orderBy: { id: 'desc' },
      take: 300,
    });
    res.json({ solicitudes: filas.map(aSolicitud) });
  });

  r.post('/:id/atender', async (req, res) => {
    const id = Number(req.params['id']);
    const d = parsear(esqAtender, req.body);
    const s = Number.isInteger(id) ? await ctx.prisma.solicitud.findUnique({ where: { id } }) : null;
    if (!s) throw new ErrorHttp(404, 'No existe esa solicitud.');
    if (s.estado !== 'pendiente') throw new ErrorHttp(409, 'Esa solicitud ya fue atendida.');
    const nueva = await ctx.prisma.solicitud.update({
      where: { id },
      data: { estado: d.estado, atendidaPor: req.usuario!.usuario, atendidaEn: new Date() },
    });
    await ctx.auditoria.registrar({ usuario: req.usuario!, accion: 'solicitud_atendida', objeto: s.correo, detalle: d.estado, ip: req.ipReal });
    res.json({ solicitud: aSolicitud(nueva) });
  });

  return r;
}
