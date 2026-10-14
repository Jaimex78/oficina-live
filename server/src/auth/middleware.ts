import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { Usuario } from '@prisma/client';
import { esRol, tienePermiso, type Permiso } from '@ol/shared';
import type { Contexto } from '../contexto';
import { ErrorHttp } from '../errores';
import { ipReal } from './ip';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      usuario?: Usuario;
      ipReal: string;
    }
  }
}

const ESCRITURAS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export interface Middleware {
  /** IP real y defensa contra peticiones de otros sitios. Va en todo /api. */
  base: RequestHandler;
  /** Hay sesión válida (aunque la persona deba cambiar su clave). */
  sesion: RequestHandler;
  /** Sesión válida y clave ya cambiada. */
  operador: RequestHandler[];
  requierePermiso(permiso: Permiso): RequestHandler[];
}

export function crearMiddleware(ctx: Contexto): Middleware {
  const base: RequestHandler = (req: Request, _res: Response, next: NextFunction) => {
    req.ipReal = ipReal(req, ctx.config.confiarProxy);
    // Sin cookies no hay CSRF clásico, pero se exige una cabecera propia que un formulario ajeno no puede enviar.
    if (ESCRITURAS.has(req.method) && req.headers['x-ol'] !== '1') throw new ErrorHttp(403, 'Solicitud no válida.');
    next();
  };

  const sesion: RequestHandler = async (req, _res, next) => {
    const cab = req.headers.authorization ?? '';
    const token = /^bearer /i.test(cab) ? cab.slice(7).trim() : '';
    if (!token) throw new ErrorHttp(401, 'Inicia sesión.');
    const datos = await ctx.tokens.verificar(token);
    const caducada = new ErrorHttp(401, 'Tu sesión terminó. Inicia sesión de nuevo.');
    if (!datos) throw caducada;
    const u = await ctx.prisma.usuario.findUnique({ where: { id: datos.id } });
    if (!u || !u.activo || u.versionToken !== datos.tv) throw caducada;
    req.usuario = u;
    next();
  };

  const claveCambiada: RequestHandler = (req, _res, next) => {
    if (req.usuario?.debeCambiarClave) throw new ErrorHttp(403, 'Debes cambiar tu contraseña antes de continuar.', 'cambiar_clave');
    next();
  };

  const operador = [sesion, claveCambiada];

  return {
    base,
    sesion,
    operador,
    requierePermiso(permiso: Permiso): RequestHandler[] {
      const permitido: RequestHandler = (req, _res, next) => {
        const rol = req.usuario?.rol;
        if (!rol || !esRol(rol) || !tienePermiso(rol, permiso)) throw new ErrorHttp(403, 'No tienes permiso para esto.');
        next();
      };
      return [...operador, permitido];
    },
  };
}
