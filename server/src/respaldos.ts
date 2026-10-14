import fs from 'node:fs';
import path from 'node:path';
import type { PrismaClient } from '@prisma/client';
import type { InfoRespaldo } from '@ol/shared';
import type { ServicioAjustes } from './ajustes/servicio';
import type { Config } from './config';
import { ErrorHttp } from './errores';

export type MotivoRespaldo = 'manual' | 'auto' | 'previo-migracion';

const PATRON = /^respaldo-(\d{8})-(\d{9})-(manual|auto|previo-migracion)\.sqlite$/;

export function nombreRespaldo(motivo: MotivoRespaldo, fecha = new Date()): string {
  const p = (n: number, l = 2) => String(n).padStart(l, '0');
  const dia = `${fecha.getUTCFullYear()}${p(fecha.getUTCMonth() + 1)}${p(fecha.getUTCDate())}`;
  const hora = `${p(fecha.getUTCHours())}${p(fecha.getUTCMinutes())}${p(fecha.getUTCSeconds())}${p(fecha.getUTCMilliseconds(), 3)}`;
  return `respaldo-${dia}-${hora}-${motivo}.sqlite`;
}

/** Copias consistentes de la base (VACUUM INTO) con retención configurable. */
export class Respaldos {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly config: Config,
    private readonly ajustes: ServicioAjustes,
  ) {}

  async crear(motivo: Exclude<MotivoRespaldo, 'previo-migracion'>): Promise<InfoRespaldo> {
    const nombre = nombreRespaldo(motivo);
    const destino = path.join(this.config.respaldosDir, nombre);
    if (destino.includes("'")) throw new ErrorHttp(500, 'La ruta de respaldos no puede tener comillas simples.');
    await this.prisma.$executeRawUnsafe(`VACUUM INTO '${destino}'`);
    fs.chmodSync(destino, 0o600);
    this.copiarFotos(nombre);
    await this.limpiar();
    return this.info(nombre) as InfoRespaldo;
  }

  /** Carpeta con las fotos de perfil que acompañan a un respaldo: mismo nombre, terminada en «.fotos». */
  private carpetaFotosDe(nombre: string): string {
    return path.join(this.config.respaldosDir, nombre.replace(/\.sqlite$/, '.fotos'));
  }

  /** Las fotos viven fuera de la base: sin esta copia, restaurar un respaldo dejaría cuentas sin foto. */
  private copiarFotos(nombre: string): void {
    const origen = path.join(this.config.dataDir, 'fotos');
    if (!fs.existsSync(origen)) return;
    const destino = this.carpetaFotosDe(nombre);
    fs.cpSync(origen, destino, { recursive: true });
    fs.chmodSync(destino, 0o700);
  }

  listar(): InfoRespaldo[] {
    if (!fs.existsSync(this.config.respaldosDir)) return [];
    return fs
      .readdirSync(this.config.respaldosDir)
      .filter((n) => PATRON.test(n))
      .sort()
      .reverse()
      .map((n) => this.info(n))
      .filter((x): x is InfoRespaldo => x !== null);
  }

  /** Ruta absoluta solo si el nombre es uno de los nuestros y existe: evita salirse de la carpeta. */
  ruta(nombre: string): string | null {
    if (!PATRON.test(nombre)) return null;
    const ruta = path.join(this.config.respaldosDir, nombre);
    return fs.existsSync(ruta) ? ruta : null;
  }

  /** Crea un respaldo automático si pasó el tiempo configurado desde el último. */
  async automatico(): Promise<InfoRespaldo | null> {
    const horas = this.ajustes.obtener<number>('respaldo_auto_horas');
    if (horas <= 0) return null;
    const ultimo = this.listar().find((r) => r.motivo !== 'previo-migracion');
    if (ultimo && Date.now() - new Date(ultimo.creadoEn).getTime() < horas * 3600_000) return null;
    return this.crear('auto');
  }

  private async limpiar(): Promise<void> {
    const maximo = this.ajustes.obtener<number>('respaldos_max');
    const borrables = this.listar().filter((r) => r.motivo !== 'previo-migracion');
    for (const viejo of borrables.slice(maximo)) {
      fs.rmSync(path.join(this.config.respaldosDir, viejo.nombre), { force: true });
      fs.rmSync(this.carpetaFotosDe(viejo.nombre), { recursive: true, force: true });
    }
  }

  private info(nombre: string): InfoRespaldo | null {
    const m = PATRON.exec(nombre);
    if (!m) return null;
    try {
      const st = fs.statSync(path.join(this.config.respaldosDir, nombre));
      return { nombre, bytes: st.size, creadoEn: st.mtime.toISOString(), motivo: m[3] as string };
    } catch {
      return null;
    }
  }
}
