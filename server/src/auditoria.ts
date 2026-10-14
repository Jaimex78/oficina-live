import type { Prisma, PrismaClient } from '@prisma/client';
import { etiquetaAccion, type PaginaActividad, type RegistroActividad } from '@ol/shared';

export interface EventoAuditoria {
  usuario?: { id: number; usuario: string } | null;
  accion: string;
  objeto?: string;
  detalle?: string;
  ip?: string;
}

export interface FiltroActividad {
  q?: string;
  accion?: string;
  usuario?: string;
  desde?: Date;
  hasta?: Date;
}

const MAX_FILAS_CSV = 20000;

/** Registro de cada acción con persona, hora e IP. Auditar nunca debe tumbar una petición. */
export class Auditoria {
  constructor(private readonly prisma: PrismaClient) {}

  async registrar(e: EventoAuditoria): Promise<void> {
    try {
      await this.prisma.actividad.create({
        data: {
          usuarioId: e.usuario?.id ?? null,
          usuario: e.usuario?.usuario ?? '',
          accion: e.accion,
          objeto: (e.objeto ?? '').slice(0, 200),
          detalle: (e.detalle ?? '').slice(0, 500),
          ip: e.ip ?? '',
        },
      });
    } catch (err) {
      console.error('[auditoria] no se pudo registrar', err);
    }
  }

  private donde(f: FiltroActividad): Prisma.ActividadWhereInput {
    const y: Prisma.ActividadWhereInput[] = [];
    if (f.accion) y.push({ accion: f.accion });
    if (f.usuario) y.push({ usuario: { contains: f.usuario.toLowerCase() } });
    if (f.desde) y.push({ fecha: { gte: f.desde } });
    if (f.hasta) y.push({ fecha: { lte: f.hasta } });
    if (f.q) y.push({ OR: [{ usuario: { contains: f.q } }, { objeto: { contains: f.q } }, { detalle: { contains: f.q } }, { ip: { contains: f.q } }] });
    return y.length ? { AND: y } : {};
  }

  async listar(f: FiltroActividad, pagina: number, porPagina: number): Promise<PaginaActividad> {
    const where = this.donde(f);
    const [total, filas] = await Promise.all([
      this.prisma.actividad.count({ where }),
      this.prisma.actividad.findMany({ where, orderBy: { id: 'desc' }, skip: (pagina - 1) * porPagina, take: porPagina }),
    ]);
    return { registros: filas.map(aRegistro), total, pagina, porPagina };
  }

  /** CSV con BOM para que Excel respete los acentos. Neutraliza celdas que empiezan como fórmula. */
  async csv(f: FiltroActividad): Promise<string> {
    const filas = await this.prisma.actividad.findMany({ where: this.donde(f), orderBy: { id: 'desc' }, take: MAX_FILAS_CSV });
    const lineas = [['fecha', 'usuario', 'accion', 'descripcion', 'objeto', 'detalle', 'ip'].join(',')];
    for (const r of filas) {
      lineas.push(
        [r.fecha.toISOString(), r.usuario, r.accion, etiquetaAccion(r.accion), r.objeto, r.detalle, r.ip].map(celdaCsv).join(','),
      );
    }
    return `﻿${lineas.join('\r\n')}\r\n`;
  }
}

function aRegistro(r: { id: number; fecha: Date; usuarioId: number | null; usuario: string; accion: string; objeto: string; detalle: string; ip: string }): RegistroActividad {
  return { id: r.id, fecha: r.fecha.toISOString(), usuarioId: r.usuarioId, usuario: r.usuario, accion: r.accion, objeto: r.objeto, detalle: r.detalle, ip: r.ip };
}

export function celdaCsv(valor: string): string {
  let v = valor;
  if (/^[=+\-@\t\r]/.test(v)) v = `'${v}`;
  return /[",\r\n]/.test(v) ? `"${v.replaceAll('"', '""')}"` : v;
}
