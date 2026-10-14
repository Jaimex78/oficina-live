import { Router } from 'express';
import { z } from 'zod';
import type { Middleware } from '../auth/middleware';
import { aPublico } from '../auth/servicio';
import type { Contexto } from '../contexto';
import { parsear } from '../errores';

const esqLogin = z.object({
  usuario: z.string({ required_error: 'Escribe tu usuario.' }).trim().min(1, 'Escribe tu usuario.').max(64, 'El usuario es demasiado largo.'),
  clave: z.string({ required_error: 'Escribe tu contraseña.' }).min(1, 'Escribe tu contraseña.').max(256, 'La contraseña es demasiado larga.'),
});

const esqCambio = z.object({
  actual: z.string({ required_error: 'Escribe tu contraseña actual.' }).min(1, 'Escribe tu contraseña actual.').max(256),
  nueva: z.string({ required_error: 'Escribe la contraseña nueva.' }).min(1, 'Escribe la contraseña nueva.').max(256),
});

const esqEnlace = z.object({
  token: z.string({ required_error: 'Falta el enlace.' }).min(1, 'Falta el enlace.').max(200, 'El enlace no es válido.'),
});

const esqActivar = esqEnlace.extend({
  clave: z.string({ required_error: 'Escribe la contraseña.' }).min(1, 'Escribe la contraseña.').max(256, 'La contraseña es demasiado larga.'),
});

export function rutasAuth(ctx: Contexto, mw: Middleware): Router {
  const r = Router();

  r.post('/login', async (req, res) => {
    const d = parsear(esqLogin, req.body);
    const { usuario, token } = await ctx.auth.login(d.usuario, d.clave, req.ipReal);
    res.json({ token, usuario: aPublico(usuario) });
  });

  // Activación con enlace de un solo uso. El token viaja en el cuerpo, no en la URL de la API, para no quedar en registros.
  r.post('/activacion/consultar', async (req, res) => {
    const d = parsear(esqEnlace, req.body);
    res.json(await ctx.auth.consultarEnlace(d.token, req.ipReal));
  });

  r.post('/activacion', async (req, res) => {
    const d = parsear(esqActivar, req.body);
    const { usuario, token } = await ctx.auth.activar(d.token, d.clave, req.ipReal);
    res.json({ token, usuario: aPublico(usuario) });
  });

  r.get('/yo', mw.sesion, (req, res) => {
    res.json({ usuario: aPublico(req.usuario!) });
  });

  r.post('/cambiar-clave', mw.sesion, async (req, res) => {
    const d = parsear(esqCambio, req.body);
    const token = await ctx.auth.cambiarClave(req.usuario!, d.actual, d.nueva, req.ipReal);
    ctx.presencia?.expulsar(req.usuario!.id);
    const u = await ctx.prisma.usuario.findUniqueOrThrow({ where: { id: req.usuario!.id } });
    res.json({ token, usuario: aPublico(u) });
  });

  r.post('/salir', mw.sesion, async (req, res) => {
    await ctx.auditoria.registrar({ usuario: req.usuario!, accion: 'logout', ip: req.ipReal });
    res.json({ ok: true });
  });

  return r;
}
