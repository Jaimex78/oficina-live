import { Router } from 'express';
import { z } from 'zod';
import { VERSION } from '../config';
import type { Contexto } from '../contexto';
import { ErrorHttp, parsear } from '../errores';

const esqSolicitud = z.object({
  nombre: z.string({ required_error: 'Escribe tu nombre.' }).trim().min(2, 'Escribe tu nombre.').max(80, 'El nombre es demasiado largo.'),
  correo: z.string({ required_error: 'Escribe tu correo.' }).trim().toLowerCase().email('Escribe un correo válido.').max(120, 'El correo es demasiado largo.'),
  cargo: z.string().trim().max(80, 'El cargo es demasiado largo.').optional().default(''),
  mensaje: z.string().trim().max(500, 'El mensaje admite hasta 500 caracteres.').optional().default(''),
});

/** Lo que se puede pedir sin sesión: estado del servicio, marca del ingreso y solicitudes de acceso. */
export function rutasPublico(ctx: Contexto): Router {
  const r = Router();

  r.get('/salud', (_req, res) => {
    res.json({ ok: true, version: VERSION });
  });

  r.get('/publico/config', (_req, res) => {
    res.json(ctx.ajustes.publicos());
  });

  r.post('/solicitudes', async (req, res) => {
    if (!ctx.ajustes.obtener<boolean>('solicitudes_activas')) throw new ErrorHttp(403, 'Las solicitudes de acceso están cerradas por ahora.');
    const d = parsear(esqSolicitud, req.body);

    if (req.ipReal) {
      const limite = ctx.ajustes.obtener<number>('solicitudes_por_ip_hora');
      const recientes = await ctx.prisma.solicitud.count({ where: { ip: req.ipReal, creadaEn: { gte: new Date(Date.now() - 3_600_000) } } });
      if (recientes >= limite) throw new ErrorHttp(429, 'Ya enviaste varias solicitudes. Intenta más tarde.');
    }

    // Si esa persona ya tiene una solicitud pendiente no se duplica, pero tampoco se le avisa.
    const repetida = await ctx.prisma.solicitud.findFirst({ where: { correo: d.correo, estado: 'pendiente' } });
    if (!repetida) {
      await ctx.prisma.solicitud.create({ data: { nombre: d.nombre, correo: d.correo, cargo: d.cargo, mensaje: d.mensaje, ip: req.ipReal } });
      await ctx.auditoria.registrar({ accion: 'solicitud_nueva', objeto: d.correo, ip: req.ipReal });
    }
    res.status(201).json({ ok: true });
  });

  return r;
}
