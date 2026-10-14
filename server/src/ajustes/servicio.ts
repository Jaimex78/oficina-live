import type { PrismaClient } from '@prisma/client';
import type { ConfigPublica, GrupoAjustes } from '@ol/shared';
import { VERSION } from '../config';
import { ErrorHttp } from '../errores';
import { DEFINICIONES, ErrorAjuste, GRUPOS, POR_CLAVE, normalizar } from './definiciones';

type Valor = string | number | boolean;

/** Ajustes editables. Se leen de memoria (se cargan al arrancar y al guardar) para no ir a la base en cada petición. */
export class ServicioAjustes {
  private readonly valores = new Map<string, Valor>();

  constructor(private readonly prisma: PrismaClient) {}

  async cargar(): Promise<void> {
    const filas = await this.prisma.ajuste.findMany();
    this.valores.clear();
    for (const f of filas) {
      const def = POR_CLAVE.get(f.clave);
      if (!def) continue;
      try {
        this.valores.set(f.clave, normalizar(def, JSON.parse(f.valor)));
      } catch {
        // Un valor guardado que ya no es válido se ignora y vuelve el valor por defecto.
      }
    }
  }

  obtener<T extends Valor = Valor>(clave: string): T {
    const def = POR_CLAVE.get(clave);
    if (!def) throw new Error(`Ajuste desconocido: ${clave}`);
    return (this.valores.get(clave) ?? def.defecto) as T;
  }

  /** Valida todo antes de guardar nada. Devuelve las claves que de verdad cambiaron. */
  async guardar(cambios: Record<string, unknown>): Promise<string[]> {
    const nuevos = new Map<string, Valor>();
    for (const [clave, bruto] of Object.entries(cambios)) {
      const def = POR_CLAVE.get(clave);
      if (!def) throw new ErrorHttp(422, `Ajuste desconocido: ${clave}`);
      try {
        nuevos.set(clave, normalizar(def, bruto));
      } catch (e) {
        if (e instanceof ErrorAjuste) throw new ErrorHttp(422, e.message);
        throw e;
      }
    }
    const final = <T extends Valor>(clave: string): T => (nuevos.has(clave) ? (nuevos.get(clave) as T) : this.obtener<T>(clave));

    if (final<string>('horario_desde') >= final<string>('horario_hasta')) {
      throw new ErrorHttp(422, 'La hora de cierre debe ser posterior a la de apertura.');
    }
    if (final<boolean>('horario_activo') && final<string>('horario_dias') === '') {
      throw new ErrorHttp(422, 'Elige al menos un día de oficina.');
    }

    const cambiados = [...nuevos].filter(([clave, v]) => this.obtener(clave) !== v).map(([clave]) => clave);
    if (cambiados.length === 0) return [];

    await this.prisma.$transaction(
      cambiados.map((clave) =>
        this.prisma.ajuste.upsert({
          where: { clave },
          create: { clave, valor: JSON.stringify(nuevos.get(clave)) },
          update: { valor: JSON.stringify(nuevos.get(clave)) },
        }),
      ),
    );
    for (const clave of cambiados) this.valores.set(clave, nuevos.get(clave) as Valor);
    return cambiados;
  }

  /** Todo agrupado y con sus límites, para que la pantalla de configuración se dibuje sola. */
  grupos(): GrupoAjustes[] {
    return GRUPOS.map((g) => ({
      id: g.id,
      titulo: g.titulo,
      descripcion: g.descripcion,
      ajustes: DEFINICIONES.filter((d) => d.grupo === g.id).map((d) => ({
        clave: d.clave,
        grupo: d.grupo,
        tipo: d.tipo,
        etiqueta: d.etiqueta,
        ...(d.ayuda ? { ayuda: d.ayuda } : {}),
        valor: this.obtener(d.clave),
        defecto: d.defecto,
        ...(d.min !== undefined ? { min: d.min } : {}),
        ...(d.max !== undefined ? { max: d.max } : {}),
        ...(d.maxLargo !== undefined ? { maxLargo: d.maxLargo } : {}),
        ...(d.opciones ? { opciones: d.opciones } : {}),
      })),
    }));
  }

  publicos(): ConfigPublica {
    return {
      nombre: this.obtener<string>('nombre_plataforma'),
      colorPrimario: this.obtener<string>('color_primario'),
      colorSecundario: this.obtener<string>('color_secundario'),
      solicitudesActivas: this.obtener<boolean>('solicitudes_activas'),
      claveMin: this.obtener<number>('clave_min'),
      version: VERSION,
    };
  }
}
