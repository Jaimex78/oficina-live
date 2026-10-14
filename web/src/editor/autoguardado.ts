import type { MapaOficina } from '@ol/shared';
import type { Almacen } from '../mundo/almacen';
import type { EstadoMundo } from '../mundo/tipos';

export interface OpcionesAutoguardado {
  almacen: Almacen<EstadoMundo>;
  /** Revisión del borrador en el servidor (`null` si todavía no hay borrador). */
  revisionInicial: number | null;
  guardar: (revision: number | null, mapa: MapaOficina) => Promise<{ revision: number }>;
  /** Cuánto esperar después del último cambio antes de guardar. */
  espera?: number;
  /** Cuánto esperar para reintentar si falla la conexión. */
  reintento?: number;
}

/** Guarda el borrador solo, poco después de cada cambio, de a un guardado a la vez y sin perder el último cambio. */
export class Autoguardado {
  private revision: number | null;
  private pendiente: MapaOficina | null = null;
  private guardando: Promise<void> | null = null;
  private reloj: ReturnType<typeof setTimeout> | null = null;
  private detenido = false;
  private conflicto = false;

  constructor(private readonly o: OpcionesAutoguardado) {
    this.revision = o.revisionInicial;
  }

  get revisionActual(): number | null {
    return this.revision;
  }

  get hayPendiente(): boolean {
    return this.pendiente !== null || this.guardando !== null;
  }

  /** Después de publicar el borrador desaparece del servidor: el siguiente guardado crea uno nuevo. */
  reiniciar(revision: number | null): void {
    this.revision = revision;
    this.conflicto = false;
  }

  programar(mapa: MapaOficina): void {
    if (this.detenido || this.conflicto) return;
    this.pendiente = mapa;
    this.o.almacen.set({ guardado: 'pendiente' });
    if (this.reloj) clearTimeout(this.reloj);
    this.reloj = setTimeout(() => void this.ahora(), this.o.espera ?? 1200);
  }

  /** Guarda ya lo que esté pendiente y espera a que termine. */
  async ahora(): Promise<void> {
    if (this.reloj) clearTimeout(this.reloj);
    this.reloj = null;
    if (this.guardando) {
      await this.guardando;
      if (!this.pendiente) return;
    }
    const mapa = this.pendiente;
    if (!mapa || this.detenido || this.conflicto) return;
    this.pendiente = null;
    this.o.almacen.set({ guardado: 'guardando' });
    this.guardando = (async () => {
      try {
        const r = await this.o.guardar(this.revision, mapa);
        this.revision = r.revision;
        if (!this.pendiente) this.o.almacen.set({ guardado: 'guardado' });
      } catch (x) {
        const estado = (x as { estado?: number }).estado;
        if (estado === 409) {
          this.conflicto = true;
          this.pendiente = null;
          this.o.almacen.set({ guardado: 'conflicto' });
        } else {
          // Sin conexión o error del servidor: se conserva el último estado y se reintenta.
          this.pendiente = this.pendiente ?? mapa;
          this.o.almacen.set({ guardado: 'error' });
          if (!this.detenido) this.reloj = setTimeout(() => void this.ahora(), this.o.reintento ?? 5000);
        }
      } finally {
        this.guardando = null;
      }
    })();
    await this.guardando;
    if (this.pendiente && !this.reloj && !this.detenido && !this.conflicto) this.reloj = setTimeout(() => void this.ahora(), 200);
  }

  detener(): void {
    this.detenido = true;
    if (this.reloj) clearTimeout(this.reloj);
    this.reloj = null;
  }
}
