import type { Request } from 'express';
import { Router } from 'express';
import type { FiltroActividad } from '../auditoria';
import type { Contexto } from '../contexto';

function texto(valor: unknown): string | undefined {
  return typeof valor === 'string' && valor.trim() ? valor.trim().slice(0, 100) : undefined;
}

function fecha(valor: unknown): Date | undefined {
  if (typeof valor !== 'string') return undefined;
  const d = new Date(valor);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function filtroDe(req: Request): FiltroActividad {
  const f: FiltroActividad = {};
  const q = texto(req.query['q']);
  const accion = texto(req.query['accion']);
  const usuario = texto(req.query['usuario']);
  const desde = fecha(req.query['desde']);
  const hasta = fecha(req.query['hasta']);
  if (q) f.q = q;
  if (accion) f.accion = accion;
  if (usuario) f.usuario = usuario;
  if (desde) f.desde = desde;
  if (hasta) f.hasta = hasta;
  return f;
}

export function rutasAdminActividad(ctx: Contexto): Router {
  const r = Router();

  r.get('/', async (req, res) => {
    const pagina = Math.max(1, Number.parseInt(String(req.query['pagina'] ?? '1'), 10) || 1);
    const porPagina = Math.min(200, Math.max(10, Number.parseInt(String(req.query['porPagina'] ?? '50'), 10) || 50));
    res.json(await ctx.auditoria.listar(filtroDe(req), pagina, porPagina));
  });

  r.get('/csv', async (req, res) => {
    const csv = await ctx.auditoria.csv(filtroDe(req));
    await ctx.auditoria.registrar({ usuario: req.usuario!, accion: 'actividad_exportada', ip: req.ipReal });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="actividad-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send(csv);
  });

  return r;
}
