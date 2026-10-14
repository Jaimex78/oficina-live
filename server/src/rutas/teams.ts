import { Router } from 'express';
import { z } from 'zod';
import type { Middleware } from '../auth/middleware';
import type { Contexto } from '../contexto';
import { ErrorHttp } from '../errores';
import { armarEnlace, esCorreo, INVITADOS_MAX, LimiteIntentos, limpiarTitulo } from '../teams/enlaces';

const esquema = z.object(
  {
    tipo: z.enum(['chat', 'llamada'], { errorMap: () => ({ message: 'El tipo debe ser «chat» o «llamada».' }) }),
    personas: z.array(z.number().int().positive(), { invalid_type_error: 'Las personas deben ser una lista de números.' }).max(INVITADOS_MAX, `Máximo ${INVITADOS_MAX} personas.`).optional(),
    sala: z.string().min(1).max(60).optional(),
    /** Solo una pista del nombre del lugar para titular un chat grupal cuando el servidor no puede deducirlo. */
    lugar: z.string().max(120).optional(),
  },
  { invalid_type_error: 'Envía un objeto JSON.' },
);

/**
 * `POST /api/teams/enlace`: arma el enlace profundo de Teams con los correos de los invitados. Los correos nunca salen del
 * servidor: la respuesta trae el enlace pedido y la cantidad de invitados, nada más. No se registra ningún correo.
 */
export function rutasTeams(ctx: Contexto, mw: Middleware): Router {
  const r = Router();
  const limite = new LimiteIntentos(30, 60_000);

  r.post('/enlace', ...mw.requierePermiso('caminar'), async (req, res) => {
    const yo = req.usuario!;
    const p = esquema.safeParse(req.body ?? {});
    if (!p.success) throw new ErrorHttp(400, p.error.issues[0]?.message ?? 'Revisa los datos enviados.');
    const { tipo, personas, sala, lugar } = p.data;
    if (!limite.permitir(yo.id)) throw new ErrorHttp(429, 'Pediste muchos enlaces de Teams seguidos. Espera un momento.', 'teams_limite');
    if ((personas === undefined) === (sala === undefined)) throw new ErrorHttp(400, 'Indica una sala o una lista de personas, solo una de las dos.');

    let ids: number[];
    let titulo = '';
    let solo = false; // chat con una sola persona: sin título

    if (sala !== undefined) {
      const ocupantes = ctx.presencia?.ocupantesDeZona(yo.id, sala) ?? null;
      if (!ocupantes) throw new ErrorHttp(409, 'Entra a la oficina para armar el chat de una sala.', 'teams_sin_presencia');
      if (!ocupantes.ids.length) {
        throw new ErrorHttp(409, ocupantes.yoDentro ? 'Estás solo en la sala. Invita a alguien o copia el enlace.' : 'No hay nadie en esa sala ahora mismo.', 'teams_solo');
      }
      ids = ocupantes.ids;
      titulo = ocupantes.nombre || 'Sala';
    } else {
      ids = [...new Set(personas ?? [])].filter((i) => i !== yo.id);
      if (!ids.length) throw new ErrorHttp(400, 'Elige al menos una persona distinta de ti.');
      solo = ids.length === 1;
      if (!solo) titulo = `Conversación en ${ctx.presencia?.lugarDe(yo.id) || limpiarTitulo(lugar ?? '') || 'la oficina'}`;
    }

    ids = ids.slice(0, INVITADOS_MAX);
    const filas = await ctx.prisma.usuario.findMany({ where: { id: { in: ids }, activo: true, pendiente: false }, select: { id: true, correo: true } });
    if (sala === undefined && filas.length !== ids.length) throw new ErrorHttp(404, 'Alguna de esas personas no existe o ya no está activa.', 'teams_persona');
    const correos = filas.map((f) => f.correo.trim()).filter(esCorreo);
    if (!correos.length) {
      throw new ErrorHttp(409, ids.length === 1 ? 'Esa persona no tiene correo registrado en Oficina Live.' : 'Nadie de ese grupo tiene correo registrado en Oficina Live.', 'teams_sin_correo');
    }
    const enlace = armarEnlace(tipo, correos, solo ? '' : titulo);
    res.json({ ...enlace, titulo: limpiarTitulo(titulo), invitados: correos.length });
  });

  return r;
}
