import fs from 'node:fs';
import { Router } from 'express';
import type { InfoSistema } from '@ol/shared';
import { VERSION } from '../config';
import type { Contexto } from '../contexto';

export function rutasAdminSistema(ctx: Contexto): Router {
  const r = Router();

  r.get('/', async (_req, res) => {
    const [usuarios, usuariosActivos, solicitudesPendientes] = await Promise.all([
      ctx.prisma.usuario.count(),
      ctx.prisma.usuario.count({ where: { activo: true } }),
      ctx.prisma.solicitud.count({ where: { estado: 'pendiente' } }),
    ]);
    const info: InfoSistema = {
      version: VERSION,
      node: process.version,
      iniciadoEn: ctx.iniciadoEn.toISOString(),
      segundosActivo: Math.round((Date.now() - ctx.iniciadoEn.getTime()) / 1000),
      baseBytes: fs.existsSync(ctx.config.dbPath) ? fs.statSync(ctx.config.dbPath).size : 0,
      usuarios,
      usuariosActivos,
      solicitudesPendientes,
      ultimoRespaldo: ctx.respaldos.listar()[0] ?? null,
      carpetaDatos: ctx.config.dataDir,
      modoDemo: ctx.config.demo,
    };
    res.json(info);
  });

  return r;
}
