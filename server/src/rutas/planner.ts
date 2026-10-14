import { Router, type Request } from 'express';
import { z } from 'zod';
import { LIMITES_PLANNER, esRol, tienePermiso } from '@ol/shared';
import type { Middleware } from '../auth/middleware';
import type { Contexto } from '../contexto';
import { ErrorHttp } from '../errores';
import type { ActorPlanner } from '../planner/servicio';

const id = z.number().int().min(1);
const valor = z.union([z.number(), z.string().max(LIMITES_PLANNER.texto), z.null()]);
const esqTarea = z
  .object({
    titulo: z.string().max(LIMITES_PLANNER.titulo + 40).optional(),
    descripcion: z.string().max(LIMITES_PLANNER.descripcion + 100).optional(),
    columnaId: id.optional(),
    responsableId: id.nullable().optional(),
    miembros: z.array(id).max(LIMITES_PLANNER.miembros + 5).optional(),
    fechaLimite: z.string().max(10).nullable().optional(),
    valores: z.record(z.string().max(12), valor).optional(),
    archivada: z.boolean().optional(),
    subtareas: z.array(z.object({ id: id.optional(), titulo: z.string().max(LIMITES_PLANNER.titulo + 40), hecha: z.boolean() }).strict()).max(LIMITES_PLANNER.subtareas + 5).optional(),
  })
  .strict();
const esqMover = z.object({ columnaId: id, posicion: z.number().int().min(0).max(5000) }).strict();
const esqComentario = z.object({ texto: z.string().max(LIMITES_PLANNER.comentario + 100) }).strict();
const color = z.string().regex(/^#[0-9A-Fa-f]{6}$/);
const esqConfig = z
  .object({
    nombre: z.string().max(80).optional(),
    color: color.optional(),
    columnas: z.array(z.object({ id: id.optional(), nombre: z.string().max(80), color, esFinal: z.boolean(), limite: z.number().int().nullable().optional() }).strict()).max(LIMITES_PLANNER.columnas + 5),
    campos: z
      .array(
        z
          .object({
            id: id.optional(),
            nombre: z.string().max(80),
            tipo: z.enum(['lista', 'texto', 'fecha']),
            semaforo: z.boolean(),
            opciones: z.array(z.object({ id: id.optional(), nombre: z.string().max(80), color }).strict()).max(LIMITES_PLANNER.opcionesPorCampo + 10),
          })
          .strict(),
      )
      .max(LIMITES_PLANNER.campos + 5),
  })
  .strict();
const esqTablero = z.object({ nombre: z.string().max(80), color: color.optional(), copiarDe: id.optional() }).strict();

function leer<T>(esq: z.ZodType<T>, cuerpo: unknown): T {
  const r = esq.safeParse(cuerpo ?? {});
  if (!r.success) throw new ErrorHttp(400, 'Revisa los datos enviados.', 'datos_invalidos', { detalles: r.error.issues.slice(0, 5).map((i) => ({ ruta: i.path.join('.'), mensaje: i.message })) });
  return r.data;
}

function numero(req: Request, nombre: string): number {
  const n = Number(req.params[nombre]);
  if (!Number.isInteger(n) || n < 1) throw new ErrorHttp(404, 'No existe.');
  return n;
}

/** Quita las claves `undefined` (exactOptionalPropertyTypes). */
const sinIndefinidos = <T extends object>(o: T): T => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as T;

export function rutasPlanner(ctx: Contexto, mw: Middleware): Router {
  const r = Router();
  const caminar = mw.requierePermiso('caminar');
  const actorDe = (req: Request): ActorPlanner => {
    const u = req.usuario!;
    return { id: u.id, usuario: u.usuario, nombre: u.nombre, administra: esRol(u.rol) && tienePermiso(u.rol, 'administrar'), ip: req.ipReal };
  };
  const tableroDe = (req: Request): number | undefined => {
    const q = req.query['tablero'];
    if (typeof q !== 'string' || q === '') return undefined;
    const n = Number(q);
    if (!Number.isInteger(n) || n < 1) throw new ErrorHttp(404, 'Ese tablero no existe.');
    return n;
  };

  r.get('/', ...caminar, async (req, res) => {
    res.json(await ctx.planner.datos(tableroDe(req)));
  });

  r.get('/tareas/:id', ...caminar, async (req, res) => {
    res.json(await ctx.planner.tarea(numero(req, 'id')));
  });

  r.post('/tareas', ...caminar, async (req, res) => {
    const t = await ctx.planner.crearTarea(actorDe(req), sinIndefinidos(leer(esqTarea, req.body)), tableroDe(req));
    res.status(201).json({ tarea: t });
  });

  r.patch('/tareas/:id', ...caminar, async (req, res) => {
    const t = await ctx.planner.actualizarTarea(actorDe(req), numero(req, 'id'), sinIndefinidos(leer(esqTarea, req.body)));
    res.json({ tarea: t });
  });

  r.post('/tareas/:id/mover', ...caminar, async (req, res) => {
    const { columnaId, posicion } = leer(esqMover, req.body);
    res.json({ tarea: await ctx.planner.moverTarea(actorDe(req), numero(req, 'id'), columnaId, posicion) });
  });

  r.delete('/tareas/:id', ...caminar, async (req, res) => {
    await ctx.planner.borrarTarea(actorDe(req), numero(req, 'id'));
    res.json({ ok: true });
  });

  r.post('/tareas/:id/comentarios', ...caminar, async (req, res) => {
    const c = await ctx.planner.comentar(actorDe(req), numero(req, 'id'), leer(esqComentario, req.body).texto);
    res.status(201).json({ comentario: c });
  });

  r.delete('/tareas/:id/comentarios/:comentario', ...caminar, async (req, res) => {
    await ctx.planner.borrarComentario(actorDe(req), numero(req, 'id'), numero(req, 'comentario'));
    res.json({ ok: true });
  });

  // Tableros y su configuración (columnas, campos como Marca, Cliente o el semáforo): solo quien administra.
  const admin = mw.requierePermiso('administrar');
  r.post('/tableros', ...admin, async (req, res) => {
    res.status(201).json(await ctx.planner.crearTablero(actorDe(req), sinIndefinidos(leer(esqTablero, req.body))));
  });
  r.put('/tableros/:id/config', ...admin, async (req, res) => {
    res.json(await ctx.planner.guardarConfig(actorDe(req), numero(req, 'id'), sinIndefinidos(leer(esqConfig, req.body))));
  });
  r.delete('/tableros/:id', ...admin, async (req, res) => {
    await ctx.planner.borrarTablero(actorDe(req), numero(req, 'id'));
    res.json({ ok: true });
  });

  return r;
}
