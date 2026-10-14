import type { PrismaClient } from '@prisma/client';
import { PrismaClient as Prisma } from '@prisma/client';
import { ServicioAjustes } from './ajustes/servicio';
import { Auditoria } from './auditoria';
import { ServicioAuth } from './auth/servicio';
import { Tokens } from './auth/token';
import type { Config } from './config';
import { EnviadorVacio, type EnviadorCorreo } from './correo/envio';
import { aplicarMigraciones } from './migraciones';
import { ServicioOficina } from './oficina/servicio';
import { ServicioNotificaciones } from './notificaciones/servicio';
import { ServicioPlanner } from './planner/servicio';
import type { ServidorPresencia } from './presencia/servidor';
import { Respaldos } from './respaldos';

export interface Memoria {
  /** Fallos de ingreso recientes por IP (se pierden al reiniciar, a propósito). */
  intentosIp: Map<string, number[]>;
}

/** Todo lo que necesitan las rutas, armado una sola vez. En pruebas se arma uno por archivo. */
export interface Contexto {
  config: Config;
  prisma: PrismaClient;
  ajustes: ServicioAjustes;
  auditoria: Auditoria;
  tokens: Tokens;
  auth: ServicioAuth;
  respaldos: Respaldos;
  memoria: Memoria;
  /** El mapa de la oficina: publicado (ya cargado en memoria), borrador e historial. */
  oficina: ServicioOficina;
  /** El Planner interno: tareas, columnas y campos configurables. */
  planner: ServicioPlanner;
  /** Los avisos de cada persona (por ejemplo, «te asignaron una tarea»). */
  notificaciones: ServicioNotificaciones;
  /** Lo asigna index.ts (o la prueba) al levantar el WebSocket. Las rutas lo usan para cerrar sesiones abiertas. */
  presencia: ServidorPresencia | null;
  /** Envío de correo. Hoy es una implementación vacía: nada se envía. */
  correo: EnviadorCorreo;
  iniciadoEn: Date;
  cerrar(): Promise<void>;
}

export async function crearContexto(config: Config, opciones: { migrar?: boolean } = {}): Promise<Contexto> {
  const prisma = new Prisma({ datasources: { db: { url: `file:${config.dbPath}` } }, log: ['error'] });
  if (opciones.migrar !== false) {
    const r = await aplicarMigraciones(config, prisma);
    if (r.aplicadas > 0) console.log(`[db] ${r.aplicadas} migración(es) aplicada(s)${r.respaldo ? `; respaldo previo: ${r.respaldo}` : ''}`);
  }
  const ajustes = new ServicioAjustes(prisma);
  await ajustes.cargar();
  const auditoria = new Auditoria(prisma);
  const tokens = new Tokens(config.secreto, ajustes);
  const memoria: Memoria = { intentosIp: new Map() };
  const auth = new ServicioAuth(prisma, config, ajustes, auditoria, tokens, memoria.intentosIp);
  const respaldos = new Respaldos(prisma, config, ajustes);
  const ctx: Contexto = {
    config,
    prisma,
    ajustes,
    auditoria,
    tokens,
    auth,
    respaldos,
    memoria,
    oficina: null as unknown as ServicioOficina, // se asigna justo abajo: el servicio necesita el contexto completo
    planner: null as unknown as ServicioPlanner, // se asigna justo abajo
    notificaciones: new ServicioNotificaciones(prisma),
    presencia: null,
    correo: new EnviadorVacio(),
    iniciadoEn: new Date(),
    cerrar: () => prisma.$disconnect(),
  };
  // Como los ajustes, el mapa publicado queda en memoria antes de atender la primera petición. En un arranque
  // nuevo, esto publica la oficina de ejemplo como versión 1.
  ctx.planner = new ServicioPlanner({ prisma, auditoria, notificaciones: ctx.notificaciones });
  ctx.oficina = new ServicioOficina(ctx);
  await ctx.oficina.cargar();
  return ctx;
}
