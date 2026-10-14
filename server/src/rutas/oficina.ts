import express, { Router, type Request, type RequestHandler } from 'express';
import { z } from 'zod';
import type { Middleware } from '../auth/middleware';
import type { Contexto } from '../contexto';
import { ErrorHttp } from '../errores';
import { leerAcceso } from '../auth/servicio';
import { versionFoto } from '../fotos/servicio';
import { personajeVisible } from '../personaje/catalogo';
import { leerAvatar } from '../presencia/servidor';
import { MAX_NOTA, type Actor } from '../oficina/servicio';

/** Cuerpo máximo al guardar el borrador. Es la única ruta que recibe un mapa entero: el resto de la API admite 200 kb. */
export const LIMITE_CUERPO_BORRADOR = '3mb';

/**
 * Lo que va antes del lector de JSON general (app.ts), solo para `PUT /api/oficina/borrador`.
 * Pide sesión y permiso primero, para no leer 3 MB de alguien que no puede construir. Express no vuelve
 * a leer un cuerpo que ya se leyó, así que el límite de 200 kb de después ya no le aplica.
 */
export function lectorDeBorrador(mw: Middleware): RequestHandler[] {
  return [mw.base, ...mw.requierePermiso('construir'), express.json({ limit: LIMITE_CUERPO_BORRADOR })];
}

const esqPublicar = z.object(
  { nota: z.string({ invalid_type_error: 'La nota debe ser un texto.' }).max(MAX_NOTA, `La nota admite hasta ${MAX_NOTA} caracteres.`).optional() },
  { invalid_type_error: 'Envía un objeto JSON con la nota.' },
);

function actorDe(req: Request): Actor {
  const u = req.usuario!;
  return { id: u.id, usuario: u.usuario, nombre: u.nombre, ip: req.ipReal };
}

function idDe(req: Request): number {
  const id = Number(req.params['id']);
  if (!Number.isInteger(id) || id < 1) throw new ErrorHttp(404, 'No existe esa versión.');
  return id;
}

export function rutasOficina(ctx: Contexto, mw: Middleware): Router {
  const r = Router();
  const caminar = mw.requierePermiso('caminar');
  const construir = mw.requierePermiso('construir');

  // La oficina publicada: la pide cualquiera que pueda entrar a caminar.
  r.get('/', ...caminar, (_req, res) => {
    const p = ctx.oficina.publicado();
    res.json({ numero: p.numero, mapa: p.mapa, creadoEn: p.creadoEn.toISOString() });
  });

  // Lo que necesita el editor al abrir: qué hay publicado y el borrador vigente, si existe.
  r.get('/construccion', ...construir, async (_req, res) => {
    const p = ctx.oficina.publicado();
    const b = await ctx.oficina.borrador();
    res.json({
      publicado: { numero: p.numero, creadoEn: p.creadoEn.toISOString(), autor: p.autor },
      borrador: b ? { revision: b.revision, mapa: b.mapa, actualizadoEn: b.actualizadoEn.toISOString(), autor: b.autor } : null,
    });
  });

  // Autoguardado: no deja registro en la actividad. El cuerpo ya lo leyó `lectorDeBorrador` con su límite propio.
  r.put('/borrador', ...construir, async (req, res) => {
    res.json(await ctx.oficina.guardarBorrador(req.body, actorDe(req)));
  });

  r.delete('/borrador', ...construir, async (req, res) => {
    await ctx.oficina.descartarBorrador(actorDe(req));
    res.json({ ok: true });
  });

  r.post('/publicar', ...construir, async (req, res) => {
    const d = esqPublicar.safeParse(req.body ?? {});
    if (!d.success) throw new ErrorHttp(400, d.error.issues[0]?.message ?? 'Revisa los datos enviados.');
    const publicada = await ctx.oficina.publicar(actorDe(req), d.data.nota ?? '');
    res.json({ numero: publicada.numero, creadoEn: publicada.creadoEn.toISOString(), nota: publicada.nota, problemas: publicada.problemas });
  });

  // Una persona con un área cambia solo lo suyo. Basta con poder caminar: el servicio comprueba que sea la dueña del área.
  r.put('/areas/:sala/:area', ...caminar, async (req, res) => {
    const sala = String(req.params['sala'] ?? '');
    const area = String(req.params['area'] ?? '');
    const hecho = await ctx.oficina.editarArea(actorDe(req), sala, area, req.body);
    res.json({ numero: hecho.numero, mapa: hecho.mapa });
  });

  // Las cuentas a las que se les puede dar un área (lo usa quien construye).
  r.get('/personas', ...construir, async (_req, res) => {
    const filas = await ctx.prisma.usuario.findMany({ where: { activo: true }, orderBy: { nombre: 'asc' }, select: { id: true, usuario: true, nombre: true, cargo: true, fotoArchivo: true, fotoVersion: true } });
    res.json({ personas: filas.map(({ fotoArchivo, fotoVersion, ...p }) => ({ ...p, foto: versionFoto({ fotoArchivo, fotoVersion }) })) });
  });

  // Todas las personas activas de la organización, con o sin conexión. Sin correos ni nada privado: es lo que ya se ve en la oficina.
  r.get('/miembros', ...caminar, async (_req, res) => {
    const filas = await ctx.prisma.usuario.findMany({
      where: { activo: true, pendiente: false },
      orderBy: { nombre: 'asc' },
      select: { id: true, nombre: true, apodo: true, cargo: true, etiquetaLugar: true, fotoArchivo: true, fotoVersion: true, personaje: true, acceso: true },
    });
    const enLinea = ctx.presencia?.idsEnLinea() ?? new Set<number>();
    res.json({
      miembros: filas.map((f) => ({
        id: f.id,
        nombre: f.nombre,
        apodo: f.apodo,
        cargo: f.cargo,
        lugar: f.etiquetaLugar === 'naos' || f.etiquetaLugar === 'remoto' ? f.etiquetaLugar : '',
        foto: versionFoto(f),
        avatar: personajeVisible(leerAvatar(f.personaje), leerAcceso(f.acceso)),
        enLinea: enLinea.has(f.id),
      })),
    });
  });

  r.get('/versiones', ...construir, async (_req, res) => {
    res.json({ versiones: await ctx.oficina.versiones() });
  });

  r.post('/versiones/:id/restaurar', ...construir, async (req, res) => {
    res.json(await ctx.oficina.restaurar(idDe(req), actorDe(req)));
  });

  return r;
}
