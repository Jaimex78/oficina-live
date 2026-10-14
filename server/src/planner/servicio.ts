import type { Prisma, PrismaClient } from '@prisma/client';
import {
  CONFIG_INICIAL_PLANNER,
  LIMITES_PLANNER,
  TIPOS_CAMPO_PLANNER,
  esColor,
  limpiarValores,
  type CampoPlanner,
  type ColumnaPlanner,
  type ComentarioPlanner,
  type ConfigPlanner,
  type DatosPlanner,
  type EntradaTarea,
  type TableroPlanner,
  type TareaPlanner,
  type TipoCampoPlanner,
  type ValorCampo,
} from '@ol/shared';
import type { Auditoria } from '../auditoria';
import { ErrorHttp } from '../errores';
import { versionFoto } from '../fotos/servicio';
import type { ServicioNotificaciones } from '../notificaciones/servicio';

export interface ActorPlanner {
  id: number;
  usuario: string;
  nombre: string;
  /** Quien administra puede borrar tareas ajenas y cambiar la configuración. */
  administra: boolean;
  ip?: string;
}

type Tx = Prisma.TransactionClient;
type Db = Tx | PrismaClient;

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

const leerLista = <T,>(texto: string): T[] => {
  try {
    const v: unknown = JSON.parse(texto);
    return Array.isArray(v) ? (v as T[]) : [];
  } catch {
    return [];
  }
};

function leerValores(texto: string): Record<string, ValorCampo> {
  try {
    const v: unknown = JSON.parse(texto);
    return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, ValorCampo>) : {};
  } catch {
    return {};
  }
}

const aFecha = (d: Date | null): string | null => (d ? d.toISOString().slice(0, 10) : null);
const enlaceTarea = (tableroId: number, tareaId: number): string => `/planner?tablero=${tableroId}&tarea=${tareaId}`;

type FilaTarea = Prisma.PlannerTareaGetPayload<{ include: { subtareas: true; _count: { select: { comentarios: true } } } }>;

/** El Planner: tableros, columnas, campos configurables y tareas. Todo pasa por aquí para que las reglas se cumplan igual desde cualquier ruta. */
export class ServicioPlanner {
  private semilla: Promise<void> | null = null;

  constructor(private readonly ctx: { prisma: PrismaClient; auditoria: Auditoria; notificaciones: ServicioNotificaciones }) {}

  private get db() {
    return this.ctx.prisma;
  }

  /** La primera vez, el primer tablero no tiene columnas: se le pone la configuración inicial. */
  private asegurarSemilla(): Promise<void> {
    this.semilla ??= (async () => {
      if ((await this.db.plannerTablero.count()) === 0) await this.db.plannerTablero.create({ data: { id: 1, nombre: 'Tablero del equipo', color: '#3B82F6' } });
      if ((await this.db.plannerColumna.count()) > 0) return;
      const primero = await this.db.plannerTablero.findFirstOrThrow({ orderBy: { id: 'asc' } });
      await this.db.$transaction(async (tx) => {
        await this.aplicarConfig(tx, primero.id, CONFIG_INICIAL_PLANNER);
      });
    })().catch((e) => {
      this.semilla = null;
      throw e;
    });
    return this.semilla;
  }

  // ---------- lectura ----------

  private async tableros(db: Db = this.db): Promise<TableroPlanner[]> {
    const filas = await db.plannerTablero.findMany({ where: { archivado: false }, orderBy: [{ orden: 'asc' }, { id: 'asc' }] });
    return filas.map((t) => ({ id: t.id, nombre: t.nombre, color: t.color }));
  }

  private async leerConfig(db: Db, tableroId: number): Promise<{ columnas: ColumnaPlanner[]; campos: CampoPlanner[] }> {
    const columnas = await db.plannerColumna.findMany({ where: { tableroId }, orderBy: [{ orden: 'asc' }, { id: 'asc' }] });
    const campos = await db.plannerCampo.findMany({ where: { tableroId }, orderBy: [{ orden: 'asc' }, { id: 'asc' }], include: { opciones: { orderBy: [{ orden: 'asc' }, { id: 'asc' }] } } });
    return {
      columnas: columnas.map((c) => ({ id: c.id, nombre: c.nombre, color: c.color, esFinal: c.esFinal, limite: c.limite })),
      campos: campos.map((c) => ({
        id: c.id,
        nombre: c.nombre,
        tipo: (TIPOS_CAMPO_PLANNER as readonly string[]).includes(c.tipo) ? (c.tipo as TipoCampoPlanner) : 'texto',
        semaforo: c.semaforo,
        opciones: c.opciones.map((o) => ({ id: o.id, nombre: o.nombre, color: o.color })),
      })),
    };
  }

  private aTarea(t: FilaTarea): TareaPlanner {
    return {
      id: t.id,
      titulo: t.titulo,
      descripcion: t.descripcion,
      columnaId: t.columnaId,
      responsableId: t.responsableId,
      miembros: leerLista<number>(t.miembros).filter((x) => Number.isInteger(x)),
      fechaLimite: aFecha(t.fechaLimite),
      valores: leerValores(t.valores),
      orden: t.orden,
      archivada: t.archivada,
      subtareas: [...t.subtareas].sort((a, b) => a.orden - b.orden || a.id - b.id).map((s) => ({ id: s.id, titulo: s.titulo, hecha: s.hecha })),
      comentarios: t._count.comentarios,
      creadaPor: t.creadaPor,
      creadaPorId: t.creadaPorId,
      creadaEn: t.creadaEn.toISOString(),
      completadaEn: t.completadaEn ? t.completadaEn.toISOString() : null,
    };
  }

  private readonly incluir = { subtareas: true, _count: { select: { comentarios: true } } } as const;

  private async tableroDe(id: number | undefined): Promise<TableroPlanner> {
    const lista = await this.tableros();
    const t = id === undefined ? lista[0] : lista.find((x) => x.id === id);
    if (!t) throw new ErrorHttp(404, 'Ese tablero no existe.', 'tablero_inexistente');
    return t;
  }

  async datos(tableroId?: number): Promise<DatosPlanner> {
    await this.asegurarSemilla();
    const tableros = await this.tableros();
    const tablero = await this.tableroDe(tableroId);
    const { columnas, campos } = await this.leerConfig(this.db, tablero.id);
    const tareas = await this.db.plannerTarea.findMany({
      where: { columnaId: { in: columnas.map((c) => c.id) } },
      orderBy: [{ columnaId: 'asc' }, { orden: 'asc' }, { id: 'asc' }],
      include: this.incluir,
    });
    const personas = await this.db.usuario.findMany({ where: { activo: true }, orderBy: { nombre: 'asc' }, select: { id: true, nombre: true, usuario: true, fotoArchivo: true, fotoVersion: true } });
    return { tableros, tablero, columnas, campos, tareas: tareas.map((t) => this.aTarea(t)), personas: personas.map(({ fotoArchivo, fotoVersion, ...p }) => ({ ...p, foto: versionFoto({ fotoArchivo, fotoVersion }) })) };
  }

  /** Una tarea con sus comentarios (para cuando se abre). */
  async tarea(id: number): Promise<{ tarea: TareaPlanner; tableroId: number; comentarios: ComentarioPlanner[] }> {
    const t = await this.db.plannerTarea.findUnique({ where: { id }, include: { ...this.incluir, columna: true } });
    if (!t) throw new ErrorHttp(404, 'Esa tarea ya no existe.', 'tarea_inexistente');
    const comentarios = await this.db.plannerComentario.findMany({ where: { tareaId: id }, orderBy: [{ creadaEn: 'asc' }, { id: 'asc' }] });
    return {
      tarea: this.aTarea(t),
      tableroId: t.columna.tableroId,
      comentarios: comentarios.map((c) => ({ id: c.id, autorId: c.autorId, autor: c.autor, texto: c.texto, creadaEn: c.creadaEn.toISOString() })),
    };
  }

  // ---------- tareas ----------

  private validarCampos(e: EntradaTarea): void {
    if (e.titulo !== undefined && (!e.titulo.trim() || e.titulo.trim().length > LIMITES_PLANNER.titulo)) {
      throw new ErrorHttp(400, `El título es obligatorio y admite hasta ${LIMITES_PLANNER.titulo} caracteres.`, 'titulo_invalido');
    }
    if (e.descripcion !== undefined && e.descripcion.length > LIMITES_PLANNER.descripcion) {
      throw new ErrorHttp(400, `La descripción admite hasta ${LIMITES_PLANNER.descripcion} caracteres.`, 'descripcion_larga');
    }
    if (e.fechaLimite !== undefined && e.fechaLimite !== null && (!FECHA.test(e.fechaLimite) || Number.isNaN(Date.parse(e.fechaLimite)))) {
      throw new ErrorHttp(400, 'La fecha límite debe ser AAAA-MM-DD.', 'fecha_invalida');
    }
    if (e.miembros !== undefined && e.miembros.length > LIMITES_PLANNER.miembros) throw new ErrorHttp(400, `Una tarea admite hasta ${LIMITES_PLANNER.miembros} miembros.`, 'demasiados_miembros');
    if (e.subtareas !== undefined) {
      if (e.subtareas.length > LIMITES_PLANNER.subtareas) throw new ErrorHttp(400, `Una tarea admite hasta ${LIMITES_PLANNER.subtareas} subtareas.`, 'demasiadas_subtareas');
      if (e.subtareas.some((s) => !s.titulo.trim() || s.titulo.length > LIMITES_PLANNER.titulo)) throw new ErrorHttp(400, 'Cada subtarea necesita un título corto.', 'subtarea_invalida');
    }
  }

  private async verificarPersonas(tx: Tx, e: EntradaTarea): Promise<void> {
    const ids = [...new Set([...(e.responsableId ? [e.responsableId] : []), ...(e.miembros ?? [])])];
    if (ids.length === 0) return;
    const hay = await tx.usuario.count({ where: { id: { in: ids }, activo: true } });
    if (hay !== ids.length) throw new ErrorHttp(404, 'Alguna de las personas no existe o está desactivada.', 'persona_inexistente');
  }

  private async reemplazarSubtareas(tx: Tx, tareaId: number, lista: NonNullable<EntradaTarea['subtareas']>): Promise<void> {
    const actuales = await tx.plannerSubtarea.findMany({ where: { tareaId }, select: { id: true } });
    const idsActuales = new Set(actuales.map((s) => s.id));
    const conservar = new Set(lista.filter((s) => s.id !== undefined && idsActuales.has(s.id)).map((s) => s.id as number));
    const quitar = actuales.filter((s) => !conservar.has(s.id)).map((s) => s.id);
    if (quitar.length > 0) await tx.plannerSubtarea.deleteMany({ where: { id: { in: quitar } } });
    for (let i = 0; i < lista.length; i++) {
      const s = lista[i]!;
      const datos = { titulo: s.titulo.trim(), hecha: s.hecha, orden: i };
      if (s.id !== undefined && idsActuales.has(s.id)) await tx.plannerSubtarea.update({ where: { id: s.id }, data: datos });
      else await tx.plannerSubtarea.create({ data: { ...datos, tareaId } });
    }
  }

  async crearTarea(actor: ActorPlanner, e: EntradaTarea, tableroId?: number): Promise<TareaPlanner> {
    await this.asegurarSemilla();
    this.validarCampos(e);
    if (!e.titulo?.trim()) throw new ErrorHttp(400, 'La tarea necesita un título.', 'titulo_invalido');
    const creada = await this.db.$transaction(async (tx) => {
      if ((await tx.plannerTarea.count()) >= LIMITES_PLANNER.tareas) throw new ErrorHttp(409, `El Planner llegó al máximo de ${LIMITES_PLANNER.tareas} tareas. Borra o archiva alguna.`, 'planner_lleno');
      await this.verificarPersonas(tx, e);
      let columna = e.columnaId !== undefined ? await tx.plannerColumna.findUnique({ where: { id: e.columnaId } }) : null;
      if (e.columnaId !== undefined && !columna) throw new ErrorHttp(404, 'Esa columna no existe.', 'columna_inexistente');
      if (!columna) {
        const tablero = await this.tableroDe(tableroId);
        columna = await tx.plannerColumna.findFirst({ where: { tableroId: tablero.id }, orderBy: [{ orden: 'asc' }, { id: 'asc' }] });
      }
      if (!columna) throw new ErrorHttp(409, 'No hay columnas. Crea una en la configuración.', 'sin_columnas');
      const { campos } = await this.leerConfig(tx, columna.tableroId);
      const ultima = await tx.plannerTarea.aggregate({ _max: { orden: true }, where: { columnaId: columna.id } });
      const t = await tx.plannerTarea.create({
        data: {
          titulo: e.titulo!.trim(),
          descripcion: e.descripcion ?? '',
          columnaId: columna.id,
          responsableId: e.responsableId ?? null,
          miembros: JSON.stringify([...new Set(e.miembros ?? [])].filter((m) => m !== e.responsableId)),
          fechaLimite: e.fechaLimite ? new Date(`${e.fechaLimite}T12:00:00Z`) : null,
          valores: JSON.stringify(limpiarValores(campos, e.valores)),
          orden: (ultima._max.orden ?? -1) + 1,
          creadaPorId: actor.id,
          creadaPor: actor.nombre,
          completadaEn: columna.esFinal ? new Date() : null,
        },
      });
      if (e.subtareas && e.subtareas.length > 0) await this.reemplazarSubtareas(tx, t.id, e.subtareas);
      return { id: t.id, tableroId: columna.tableroId };
    });
    const t = await this.db.plannerTarea.findUniqueOrThrow({ where: { id: creada.id }, include: this.incluir });
    const enlace = enlaceTarea(creada.tableroId, t.id);
    await this.ctx.notificaciones.avisar([t.responsableId], actor.id, { tipo: 'tarea_asignada', titulo: `${actor.nombre} te asignó una tarea`, texto: t.titulo, enlace });
    await this.ctx.notificaciones.avisar(leerLista<number>(t.miembros), actor.id, { tipo: 'tarea_miembro', titulo: `${actor.nombre} te agregó a una tarea`, texto: t.titulo, enlace });
    await this.ctx.auditoria.registrar({ usuario: { id: actor.id, usuario: actor.usuario }, accion: 'planner_tarea_creada', objeto: `Tarea ${t.id}`, detalle: t.titulo.slice(0, 80), ip: actor.ip ?? '' });
    return this.aTarea(t);
  }

  async actualizarTarea(actor: ActorPlanner, id: number, e: EntradaTarea): Promise<TareaPlanner> {
    this.validarCampos(e);
    const resultado = await this.db.$transaction(async (tx) => {
      const previa = await tx.plannerTarea.findUnique({ where: { id }, include: { columna: true } });
      if (!previa) throw new ErrorHttp(404, 'Esa tarea ya no existe.', 'tarea_inexistente');
      await this.verificarPersonas(tx, e);
      const { columnas, campos } = await this.leerConfig(tx, previa.columna.tableroId);
      const datos: Prisma.PlannerTareaUpdateInput = {};
      if (e.titulo !== undefined) datos.titulo = e.titulo.trim();
      if (e.descripcion !== undefined) datos.descripcion = e.descripcion;
      if (e.responsableId !== undefined) datos.responsableId = e.responsableId;
      if (e.miembros !== undefined) datos.miembros = JSON.stringify([...new Set(e.miembros)].filter((m) => m !== (e.responsableId !== undefined ? e.responsableId : previa.responsableId)));
      if (e.fechaLimite !== undefined) {
        datos.fechaLimite = e.fechaLimite ? new Date(`${e.fechaLimite}T12:00:00Z`) : null;
        datos.avisoVencimiento = false;
      }
      if (e.valores !== undefined) datos.valores = JSON.stringify(limpiarValores(campos, e.valores));
      if (e.archivada !== undefined) datos.archivada = e.archivada;
      if (e.columnaId !== undefined && e.columnaId !== previa.columnaId) {
        const destino = columnas.find((c) => c.id === e.columnaId);
        if (!destino) throw new ErrorHttp(404, 'Esa columna no existe en este tablero.', 'columna_inexistente');
        const ultima = await tx.plannerTarea.aggregate({ _max: { orden: true }, where: { columnaId: e.columnaId } });
        datos.columna = { connect: { id: e.columnaId } };
        datos.orden = (ultima._max.orden ?? -1) + 1;
        datos.completadaEn = destino.esFinal ? new Date() : null;
      }
      await tx.plannerTarea.update({ where: { id }, data: datos });
      if (e.subtareas !== undefined) await this.reemplazarSubtareas(tx, id, e.subtareas);
      return { previa, tableroId: previa.columna.tableroId };
    });
    const t = await this.db.plannerTarea.findUniqueOrThrow({ where: { id }, include: this.incluir });
    const enlace = enlaceTarea(resultado.tableroId, id);
    if (e.responsableId !== undefined && e.responsableId !== resultado.previa.responsableId) {
      await this.ctx.notificaciones.avisar([e.responsableId], actor.id, { tipo: 'tarea_asignada', titulo: `${actor.nombre} te asignó una tarea`, texto: t.titulo, enlace });
    }
    if (e.miembros !== undefined) {
      const antes = new Set(leerLista<number>(resultado.previa.miembros));
      await this.ctx.notificaciones.avisar(e.miembros.filter((m) => !antes.has(m) && m !== e.responsableId), actor.id, { tipo: 'tarea_miembro', titulo: `${actor.nombre} te agregó a una tarea`, texto: t.titulo, enlace });
    }
    if (t.completadaEn && !resultado.previa.completadaEn) await this.avisarTerminada(actor, t, enlace);
    return this.aTarea(t);
  }

  private async avisarTerminada(actor: ActorPlanner, t: { titulo: string; responsableId: number | null; creadaPorId: number | null; miembros: string }, enlace: string): Promise<void> {
    await this.ctx.notificaciones.avisar([t.creadaPorId, t.responsableId, ...leerLista<number>(t.miembros)], actor.id, { tipo: 'tarea_terminada', titulo: `${actor.nombre} terminó una tarea`, texto: t.titulo, enlace });
  }

  /** Mueve una tarea a una columna y a una posición (0 es arriba). Las demás se reordenan. */
  async moverTarea(actor: ActorPlanner, id: number, columnaId: number, posicion: number): Promise<TareaPlanner> {
    const r = await this.db.$transaction(async (tx) => {
      const tarea = await tx.plannerTarea.findUnique({ where: { id }, include: { columna: true } });
      if (!tarea) throw new ErrorHttp(404, 'Esa tarea ya no existe.', 'tarea_inexistente');
      const destino = await tx.plannerColumna.findUnique({ where: { id: columnaId } });
      if (!destino) throw new ErrorHttp(404, 'Esa columna no existe.', 'columna_inexistente');
      if (destino.tableroId !== tarea.columna.tableroId) throw new ErrorHttp(409, 'Una tarea no puede pasar a otro tablero.', 'otro_tablero');
      const otras = await tx.plannerTarea.findMany({ where: { columnaId, archivada: false, NOT: { id } }, orderBy: [{ orden: 'asc' }, { id: 'asc' }], select: { id: true } });
      if (destino.limite !== null && columnaId !== tarea.columnaId && otras.length >= destino.limite) {
        throw new ErrorHttp(409, `La columna «${destino.nombre}» ya tiene su máximo de ${destino.limite} ${destino.limite === 1 ? 'tarea' : 'tareas'}.`, 'columna_llena');
      }
      const lugar = Math.max(0, Math.min(otras.length, Math.trunc(posicion)));
      const ids = [...otras.map((o) => o.id)];
      ids.splice(lugar, 0, id);
      for (let i = 0; i < ids.length; i++) {
        if (ids[i] === id) await tx.plannerTarea.update({ where: { id }, data: { columnaId, orden: i, completadaEn: destino.esFinal ? (tarea.completadaEn ?? new Date()) : null } });
        else await tx.plannerTarea.update({ where: { id: ids[i]! }, data: { orden: i } });
      }
      return { yaTerminada: Boolean(tarea.completadaEn), tableroId: tarea.columna.tableroId };
    });
    const t = await this.db.plannerTarea.findUniqueOrThrow({ where: { id }, include: this.incluir });
    if (t.completadaEn && !r.yaTerminada) await this.avisarTerminada(actor, t, enlaceTarea(r.tableroId, id));
    return this.aTarea(t);
  }

  async borrarTarea(actor: ActorPlanner, id: number): Promise<void> {
    const t = await this.db.plannerTarea.findUnique({ where: { id } });
    if (!t) throw new ErrorHttp(404, 'Esa tarea ya no existe.', 'tarea_inexistente');
    if (!actor.administra && t.creadaPorId !== actor.id) throw new ErrorHttp(403, 'Solo quien creó la tarea o quien administra puede borrarla.', 'tarea_ajena');
    await this.db.plannerTarea.delete({ where: { id } });
    await this.ctx.auditoria.registrar({ usuario: { id: actor.id, usuario: actor.usuario }, accion: 'planner_tarea_borrada', objeto: `Tarea ${id}`, detalle: t.titulo.slice(0, 80), ip: actor.ip ?? '' });
  }

  // ---------- comentarios ----------

  async comentar(actor: ActorPlanner, id: number, texto: string): Promise<ComentarioPlanner> {
    const limpio = texto.trim();
    if (!limpio || limpio.length > LIMITES_PLANNER.comentario) throw new ErrorHttp(400, `El comentario es obligatorio y admite hasta ${LIMITES_PLANNER.comentario} caracteres.`, 'comentario_invalido');
    const t = await this.db.plannerTarea.findUnique({ where: { id }, include: { columna: true } });
    if (!t) throw new ErrorHttp(404, 'Esa tarea ya no existe.', 'tarea_inexistente');
    const c = await this.db.plannerComentario.create({ data: { tareaId: id, autorId: actor.id, autor: actor.nombre, texto: limpio } });
    await this.ctx.notificaciones.avisar([t.responsableId, t.creadaPorId, ...leerLista<number>(t.miembros)], actor.id, {
      tipo: 'tarea_comentario',
      titulo: `${actor.nombre} comentó en una tarea`,
      texto: `${t.titulo}: ${limpio}`,
      enlace: enlaceTarea(t.columna.tableroId, id),
    });
    return { id: c.id, autorId: c.autorId, autor: c.autor, texto: c.texto, creadaEn: c.creadaEn.toISOString() };
  }

  async borrarComentario(actor: ActorPlanner, tareaId: number, comentarioId: number): Promise<void> {
    const c = await this.db.plannerComentario.findFirst({ where: { id: comentarioId, tareaId } });
    if (!c) throw new ErrorHttp(404, 'Ese comentario ya no existe.', 'comentario_inexistente');
    if (!actor.administra && c.autorId !== actor.id) throw new ErrorHttp(403, 'Solo quien lo escribió o quien administra puede borrar un comentario.', 'comentario_ajeno');
    await this.db.plannerComentario.delete({ where: { id: comentarioId } });
  }

  // ---------- avisos de vencimiento ----------

  /** Avisa de las tareas que vencen hoy o mañana (o ya vencieron) a quien las tiene. Una sola vez por fecha límite. */
  async revisarVencimientos(ahora: Date = new Date()): Promise<number> {
    const limite = new Date(ahora.getTime() + 36 * 3_600_000);
    const tareas = await this.db.plannerTarea.findMany({
      where: { fechaLimite: { not: null, lte: limite }, completadaEn: null, archivada: false, avisoVencimiento: false },
      include: { columna: true },
    });
    for (const t of tareas) {
      await this.ctx.notificaciones.avisar([t.responsableId, ...leerLista<number>(t.miembros)], null, {
        tipo: 'tarea_vence',
        titulo: t.fechaLimite && t.fechaLimite.getTime() < ahora.getTime() - 12 * 3_600_000 ? 'Una tarea ya venció' : 'Una tarea vence pronto',
        texto: `${t.titulo} · ${aFecha(t.fechaLimite) ?? ''}`,
        enlace: enlaceTarea(t.columna.tableroId, t.id),
      });
      await this.db.plannerTarea.update({ where: { id: t.id }, data: { avisoVencimiento: true } });
    }
    return tareas.length;
  }

  // ---------- tableros y configuración ----------

  validarConfig(c: ConfigPlanner): void {
    const malo = (m: string): never => {
      throw new ErrorHttp(400, m, 'config_invalida');
    };
    if (c.nombre !== undefined && (!c.nombre.trim() || c.nombre.trim().length > LIMITES_PLANNER.nombre)) malo(`El tablero necesita un nombre de hasta ${LIMITES_PLANNER.nombre} caracteres.`);
    if (c.color !== undefined && !esColor(c.color)) malo('El color del tablero no es válido.');
    if (c.columnas.length < 1) malo('Tiene que haber al menos una columna.');
    if (c.columnas.length > LIMITES_PLANNER.columnas) malo(`Máximo ${LIMITES_PLANNER.columnas} columnas.`);
    if (c.campos.length > LIMITES_PLANNER.campos) malo(`Máximo ${LIMITES_PLANNER.campos} campos.`);
    const nombres = new Set<string>();
    for (const col of c.columnas) {
      const n = col.nombre.trim();
      if (!n || n.length > LIMITES_PLANNER.nombre) malo(`Cada columna necesita un nombre de hasta ${LIMITES_PLANNER.nombre} caracteres.`);
      if (!esColor(col.color)) malo(`El color de «${n}» no es válido.`);
      if (col.limite !== undefined && col.limite !== null && (!Number.isInteger(col.limite) || col.limite < 1 || col.limite > 500)) malo(`El límite de «${n}» debe ser un número entero entre 1 y 500.`);
    }
    for (const campo of c.campos) {
      const n = campo.nombre.trim();
      if (!n || n.length > LIMITES_PLANNER.nombre) malo(`Cada campo necesita un nombre de hasta ${LIMITES_PLANNER.nombre} caracteres.`);
      if (nombres.has(n.toLowerCase())) malo(`Hay dos campos llamados «${n}».`);
      nombres.add(n.toLowerCase());
      if (!(TIPOS_CAMPO_PLANNER as readonly string[]).includes(campo.tipo)) malo(`El tipo del campo «${n}» no es válido.`);
      if (campo.tipo !== 'lista' && (campo.opciones.length > 0 || campo.semaforo)) malo(`Solo los campos de lista tienen opciones y semáforo («${n}»).`);
      if (campo.opciones.length > LIMITES_PLANNER.opcionesPorCampo) malo(`Máximo ${LIMITES_PLANNER.opcionesPorCampo} opciones por campo («${n}»).`);
      const op = new Set<string>();
      for (const o of campo.opciones) {
        const on = o.nombre.trim();
        if (!on || on.length > LIMITES_PLANNER.nombre) malo(`Cada opción de «${n}» necesita un nombre de hasta ${LIMITES_PLANNER.nombre} caracteres.`);
        if (op.has(on.toLowerCase())) malo(`«${n}» tiene dos opciones llamadas «${on}».`);
        op.add(on.toLowerCase());
        if (!esColor(o.color)) malo(`El color de «${on}» no es válido.`);
      }
    }
  }

  /** Aplica la configuración de un tablero dentro de una transacción: crea, actualiza y borra. Las tareas se acomodan solas. */
  private async aplicarConfig(tx: Tx, tableroId: number, c: ConfigPlanner): Promise<void> {
    if (c.nombre !== undefined || c.color !== undefined) {
      await tx.plannerTablero.update({ where: { id: tableroId }, data: { ...(c.nombre !== undefined ? { nombre: c.nombre.trim() } : {}), ...(c.color !== undefined ? { color: c.color } : {}) } });
    }
    const columnasActuales = await tx.plannerColumna.findMany({ where: { tableroId } });
    const idsColumnas = new Set(c.columnas.filter((x) => x.id !== undefined).map((x) => x.id as number));
    const columnaFinal: number[] = [];
    let primera: number | null = null;
    for (let i = 0; i < c.columnas.length; i++) {
      const col = c.columnas[i]!;
      const datos = { nombre: col.nombre.trim(), color: col.color, esFinal: col.esFinal, orden: i, limite: col.limite ?? null };
      const existente = col.id !== undefined ? columnasActuales.find((x) => x.id === col.id) : undefined;
      const id = existente ? (await tx.plannerColumna.update({ where: { id: existente.id }, data: datos })).id : (await tx.plannerColumna.create({ data: { ...datos, tableroId } })).id;
      if (primera === null) primera = id;
      if (col.esFinal) columnaFinal.push(id);
    }
    const idsDelTablero = (await tx.plannerColumna.findMany({ where: { tableroId }, select: { id: true } })).map((x) => x.id);
    const sobran = columnasActuales.filter((x) => !idsColumnas.has(x.id));
    if (sobran.length > 0 && primera !== null) {
      await tx.plannerTarea.updateMany({ where: { columnaId: { in: sobran.map((x) => x.id) } }, data: { columnaId: primera } });
      await tx.plannerColumna.deleteMany({ where: { id: { in: sobran.map((x) => x.id) } } });
    }
    // Una tarea que está en una columna final cuenta como terminada; si ya no lo es, deja de contar.
    await tx.plannerTarea.updateMany({ where: { columnaId: { in: idsDelTablero, notIn: columnaFinal }, completadaEn: { not: null } }, data: { completadaEn: null } });
    if (columnaFinal.length > 0) await tx.plannerTarea.updateMany({ where: { columnaId: { in: columnaFinal }, completadaEn: null }, data: { completadaEn: new Date() } });

    const camposActuales = await tx.plannerCampo.findMany({ where: { tableroId }, include: { opciones: true } });
    const idsCampos = new Set(c.campos.filter((x) => x.id !== undefined).map((x) => x.id as number));
    const opcionesBorradas = new Map<number, number[]>();
    const camposBorrados = camposActuales.filter((x) => !idsCampos.has(x.id)).map((x) => x.id);
    for (let i = 0; i < c.campos.length; i++) {
      const campo = c.campos[i]!;
      const datos = { nombre: campo.nombre.trim(), tipo: campo.tipo, semaforo: campo.semaforo, orden: i };
      const previo = campo.id !== undefined ? camposActuales.find((x) => x.id === campo.id) : undefined;
      const campoId = previo ? (await tx.plannerCampo.update({ where: { id: previo.id }, data: datos })).id : (await tx.plannerCampo.create({ data: { ...datos, tableroId } })).id;
      const idsOp = new Set(campo.opciones.filter((o) => o.id !== undefined).map((o) => o.id as number));
      const quitar = (previo?.opciones ?? []).filter((o) => !idsOp.has(o.id)).map((o) => o.id);
      if (quitar.length > 0) {
        await tx.plannerOpcion.deleteMany({ where: { id: { in: quitar } } });
        opcionesBorradas.set(campoId, quitar);
      }
      for (let j = 0; j < campo.opciones.length; j++) {
        const o = campo.opciones[j]!;
        const d = { nombre: o.nombre.trim(), color: o.color, orden: j };
        const existente = o.id !== undefined ? previo?.opciones.find((x) => x.id === o.id) : undefined;
        if (existente) await tx.plannerOpcion.update({ where: { id: existente.id }, data: d });
        else await tx.plannerOpcion.create({ data: { ...d, campoId } });
      }
    }
    if (camposBorrados.length > 0) await tx.plannerCampo.deleteMany({ where: { id: { in: camposBorrados } } });
    if (camposBorrados.length > 0 || opcionesBorradas.size > 0) {
      const tareas = await tx.plannerTarea.findMany({ where: { columnaId: { in: (await tx.plannerColumna.findMany({ where: { tableroId }, select: { id: true } })).map((x) => x.id) } }, select: { id: true, valores: true } });
      for (const t of tareas) {
        const v = leerValores(t.valores);
        let cambio = false;
        for (const id of camposBorrados) if (String(id) in v) { delete v[String(id)]; cambio = true; }
        for (const [campoId, ops] of opcionesBorradas) if (typeof v[String(campoId)] === 'number' && ops.includes(v[String(campoId)] as number)) { delete v[String(campoId)]; cambio = true; }
        if (cambio) await tx.plannerTarea.update({ where: { id: t.id }, data: { valores: JSON.stringify(v) } });
      }
    }
  }

  private exigirAdmin(actor: ActorPlanner): void {
    if (!actor.administra) throw new ErrorHttp(403, 'Solo quien administra puede cambiar los tableros y su configuración.', 'sin_permiso');
  }

  async guardarConfig(actor: ActorPlanner, tableroId: number, c: ConfigPlanner): Promise<DatosPlanner> {
    this.exigirAdmin(actor);
    await this.asegurarSemilla();
    await this.tableroDe(tableroId);
    this.validarConfig(c);
    await this.db.$transaction(async (tx) => {
      await this.aplicarConfig(tx, tableroId, c);
    });
    await this.ctx.auditoria.registrar({ usuario: { id: actor.id, usuario: actor.usuario }, accion: 'planner_config', objeto: `Tablero ${tableroId}`, detalle: `${c.columnas.length} columnas, ${c.campos.length} campos`, ip: actor.ip ?? '' });
    return this.datos(tableroId);
  }

  /** Crea un tablero nuevo, vacío, con la configuración inicial o copiando las columnas y los campos de otro. */
  async crearTablero(actor: ActorPlanner, entrada: { nombre: string; color?: string; copiarDe?: number }): Promise<DatosPlanner> {
    this.exigirAdmin(actor);
    await this.asegurarSemilla();
    const nombre = entrada.nombre.trim();
    if (!nombre || nombre.length > LIMITES_PLANNER.nombre) throw new ErrorHttp(400, `El tablero necesita un nombre de hasta ${LIMITES_PLANNER.nombre} caracteres.`, 'nombre_invalido');
    if (entrada.color !== undefined && !esColor(entrada.color)) throw new ErrorHttp(400, 'El color del tablero no es válido.', 'color_invalido');
    if ((await this.db.plannerTablero.count({ where: { archivado: false } })) >= LIMITES_PLANNER.tableros) throw new ErrorHttp(409, `Máximo ${LIMITES_PLANNER.tableros} tableros.`, 'demasiados_tableros');
    const id = await this.db.$transaction(async (tx) => {
      const ultimo = await tx.plannerTablero.aggregate({ _max: { orden: true } });
      const t = await tx.plannerTablero.create({ data: { nombre, color: entrada.color ?? '#3B82F6', orden: (ultimo._max.orden ?? -1) + 1 } });
      let config: ConfigPlanner = CONFIG_INICIAL_PLANNER;
      if (entrada.copiarDe !== undefined) {
        const origen = await this.leerConfig(tx, entrada.copiarDe);
        if (origen.columnas.length === 0) throw new ErrorHttp(404, 'No se pudo copiar ese tablero.', 'tablero_inexistente');
        // Se copia la forma, no los ids: los del tablero nuevo se crean aparte.
        config = {
          columnas: origen.columnas.map((c) => ({ nombre: c.nombre, color: c.color, esFinal: c.esFinal, limite: c.limite })),
          campos: origen.campos.map((c) => ({ nombre: c.nombre, tipo: c.tipo, semaforo: c.semaforo, opciones: c.opciones.map((o) => ({ nombre: o.nombre, color: o.color })) })),
        };
      }
      await this.aplicarConfig(tx, t.id, config);
      return t.id;
    });
    await this.ctx.auditoria.registrar({ usuario: { id: actor.id, usuario: actor.usuario }, accion: 'planner_config', objeto: `Tablero ${id}`, detalle: `creó «${nombre}»`, ip: actor.ip ?? '' });
    return this.datos(id);
  }

  /** Quita un tablero con sus tareas. Siempre debe quedar al menos uno. */
  async borrarTablero(actor: ActorPlanner, id: number): Promise<void> {
    this.exigirAdmin(actor);
    const lista = await this.tableros();
    if (!lista.some((t) => t.id === id)) throw new ErrorHttp(404, 'Ese tablero no existe.', 'tablero_inexistente');
    if (lista.length <= 1) throw new ErrorHttp(409, 'Tiene que quedar al menos un tablero.', 'ultimo_tablero');
    await this.db.$transaction(async (tx) => {
      const columnas = await tx.plannerColumna.findMany({ where: { tableroId: id }, select: { id: true } });
      await tx.plannerTarea.deleteMany({ where: { columnaId: { in: columnas.map((c) => c.id) } } });
      await tx.plannerColumna.deleteMany({ where: { tableroId: id } });
      await tx.plannerCampo.deleteMany({ where: { tableroId: id } });
      await tx.plannerTablero.delete({ where: { id } });
    });
    await this.ctx.auditoria.registrar({ usuario: { id: actor.id, usuario: actor.usuario }, accion: 'planner_config', objeto: `Tablero ${id}`, detalle: 'borró el tablero', ip: actor.ip ?? '' });
  }
}
