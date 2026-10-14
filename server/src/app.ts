import path from 'node:path';
import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import helmet from 'helmet';
import { crearMiddleware } from './auth/middleware';
import type { Contexto } from './contexto';
import { ErrorHttp, manejadorErrores } from './errores';
import { rutasAdminActividad } from './rutas/admin-actividad';
import { rutasAdminAjustes } from './rutas/admin-ajustes';
import { rutasAdminRespaldos } from './rutas/admin-respaldos';
import { rutasAdminSistema } from './rutas/admin-sistema';
import { rutasAdminSolicitudes } from './rutas/admin-solicitudes';
import { rutasAdminUsuarios } from './rutas/admin-usuarios';
import { rutasAuth } from './rutas/auth';
import { rutasCuenta } from './rutas/cuenta';
import { rutasFotos } from './rutas/fotos';
import { lectorDeBorrador, rutasOficina } from './rutas/oficina';
import { rutasTeams } from './rutas/teams';
import { rutasNotificaciones } from './rutas/notificaciones';
import { rutasPlanner } from './rutas/planner';
import { rutasPublico } from './rutas/publico';

/** Los archivos que Vite nombra con huella de contenido se guardan un año; el resto, nunca sin revisar. */
const CON_HUELLA = /-[A-Za-z0-9_-]{8,}\.(js|css|woff2?|png|svg|webp)$/;

export function crearApp(ctx: Contexto): Express {
  const app = express();
  app.disable('x-powered-by');
  if (ctx.config.confiarProxy) app.set('trust proxy', true);

  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'default-src': ["'self'"],
          'img-src': ["'self'", 'data:', 'blob:'],
          'style-src': ["'self'", "'unsafe-inline'"],
          'font-src': ["'self'", 'data:'],
          'connect-src': ["'self'", 'ws:', 'wss:'],
          'object-src': ["'none'"],
          'frame-ancestors': ["'none'"],
          'base-uri': ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );

  const mw = crearMiddleware(ctx);

  // El borrador del mapa es la única ruta con cuerpo grande (hasta 3 MB). Su lector va ANTES del general:
  // Express no vuelve a leer un cuerpo ya leído, y todo lo demás sigue con el límite de 200 kb.
  app.put('/api/oficina/borrador', ...lectorDeBorrador(mw));
  app.use(express.json({ limit: '200kb' }));

  // ---- API ----
  const api = express.Router();
  api.use(mw.base);
  api.use('/auth', rutasAuth(ctx, mw));
  api.use('/cuenta', mw.operador, rutasCuenta(ctx));
  api.use('/fotos', mw.operador, rutasFotos(ctx));
  api.use('/oficina', rutasOficina(ctx, mw));
  api.use('/teams', rutasTeams(ctx, mw));
  api.use('/planner', rutasPlanner(ctx, mw));
  api.use('/notificaciones', rutasNotificaciones(ctx, mw.operador));
  api.use('/admin', mw.requierePermiso('administrar'));
  api.use('/admin/usuarios', rutasAdminUsuarios(ctx));
  api.use('/admin/solicitudes', rutasAdminSolicitudes(ctx));
  api.use('/admin/actividad', rutasAdminActividad(ctx));
  api.use('/admin/ajustes', rutasAdminAjustes(ctx));
  api.use('/admin/respaldos', rutasAdminRespaldos(ctx));
  api.use('/admin/sistema', rutasAdminSistema(ctx));
  api.use(rutasPublico(ctx));
  api.use((_req, _res, next) => next(new ErrorHttp(404, 'No existe.')));
  app.use('/api', api);

  // ---- Interfaz compilada (solo si existe web/dist) ----
  const dist = ctx.config.webDist;
  if (dist) {
    app.use(
      express.static(dist, {
        index: false,
        setHeaders(res, ruta) {
          res.setHeader('Cache-Control', CON_HUELLA.test(ruta) ? 'public, max-age=31536000, immutable' : 'no-cache');
        },
      }),
    );
    app.use((req: Request, res: Response, next: NextFunction) => {
      if ((req.method !== 'GET' && req.method !== 'HEAD') || req.path.startsWith('/api') || req.path.startsWith('/ws')) {
        next();
        return;
      }
      res.setHeader('Cache-Control', 'no-cache');
      res.sendFile(path.join(dist, 'index.html'));
    });
  }

  app.use(manejadorErrores);
  return app;
}
