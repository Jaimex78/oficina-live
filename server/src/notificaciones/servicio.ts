import type { PrismaClient } from '@prisma/client';
import type { NotificacionPlanner, RespuestaNotificaciones } from '@ol/shared';
import { ErrorHttp } from '../errores';

export interface DatosNotificacion {
  tipo: NotificacionPlanner['tipo'];
  titulo: string;
  texto?: string;
  enlace?: string;
}

const DIAS_QUE_SE_GUARDAN = 60;
const MAXIMO_EN_LISTA = 40;

/** Los avisos de cada persona. Los crea el sistema cuando pasa algo que le importa (por ejemplo, le asignan una tarea). */
export class ServicioNotificaciones {
  constructor(private readonly prisma: PrismaClient) {}

  /** Avisa a varias personas, sin repetir y sin avisarle a quien hizo el cambio. */
  async avisar(destinatarios: ReadonlyArray<number | null | undefined>, quienHizo: number | null, datos: DatosNotificacion): Promise<void> {
    const ids = [...new Set(destinatarios.filter((x): x is number => typeof x === 'number' && x !== quienHizo))];
    if (ids.length === 0) return;
    const activos = await this.prisma.usuario.findMany({ where: { id: { in: ids }, activo: true }, select: { id: true } });
    if (activos.length === 0) return;
    await this.prisma.notificacion.createMany({
      data: activos.map((u) => ({ usuarioId: u.id, tipo: datos.tipo, titulo: datos.titulo.slice(0, 120), texto: (datos.texto ?? '').slice(0, 300), enlace: datos.enlace ?? '' })),
    });
  }

  async listar(usuarioId: number): Promise<RespuestaNotificaciones> {
    const [filas, sinLeer] = await Promise.all([
      this.prisma.notificacion.findMany({ where: { usuarioId }, orderBy: [{ creadaEn: 'desc' }, { id: 'desc' }], take: MAXIMO_EN_LISTA }),
      this.prisma.notificacion.count({ where: { usuarioId, leida: false } }),
    ]);
    return {
      sinLeer,
      notificaciones: filas.map((n) => ({ id: n.id, tipo: n.tipo as NotificacionPlanner['tipo'], titulo: n.titulo, texto: n.texto, enlace: n.enlace, leida: n.leida, creadaEn: n.creadaEn.toISOString() })),
    };
  }

  async marcarLeida(usuarioId: number, id: number): Promise<void> {
    const r = await this.prisma.notificacion.updateMany({ where: { id, usuarioId }, data: { leida: true } });
    if (r.count === 0 && !(await this.prisma.notificacion.findFirst({ where: { id, usuarioId } }))) throw new ErrorHttp(404, 'Ese aviso ya no existe.');
  }

  async marcarTodas(usuarioId: number): Promise<void> {
    await this.prisma.notificacion.updateMany({ where: { usuarioId, leida: false }, data: { leida: true } });
  }

  /** Borra los avisos viejos. Se llama de vez en cuando. */
  async limpiar(): Promise<number> {
    const limite = new Date(Date.now() - DIAS_QUE_SE_GUARDAN * 86_400_000);
    const r = await this.prisma.notificacion.deleteMany({ where: { creadaEn: { lt: limite } } });
    return r.count;
  }
}
