import type { MapaOficina as FilaMapa } from '@prisma/client';
import { aplicarEdicionDeArea, asientosDe, objetoDisponible, objetoPorId, calcularBloqueo, comprimirMapa, descomprimirMapa, esFallo, hayErrores, plantillaDeMapa, validarMapa, type MapaGuardado, type MapaOficina, type Problema } from '@ol/shared';
import type { Contexto } from '../contexto';
import { leerAcceso } from '../auth/servicio';
import { ErrorHttp } from '../errores';
import type { DatosSala, ProveedorSalas } from '../presencia/servidor';
import { leerMapaGuardado, parsearEdicionArea, parsearEntradaBorrador } from './esquema';

/** Cuántas versiones anteriores a la vigente se conservan. Las más antiguas se borran al publicar. */
export const MAX_HISTORICO = 30;
export const MAX_NOTA = 200;

const MENSAJE_CHOQUE = 'Otra persona guardó cambios en el borrador. Recarga para ver lo último.';

/** Quién hace el cambio: sirve para el autor de la versión y para el registro de actividad. */
export interface Actor {
  id: number;
  /** Cuenta (para la actividad). */
  usuario: string;
  /** Nombre para mostrar (autor de la versión). */
  nombre: string;
  ip?: string;
}

export interface VersionPublicada {
  id: number;
  numero: number;
  mapa: MapaGuardado;
  creadoEn: Date;
  autor: string;
  nota: string;
}

export interface InfoBorrador {
  id: number;
  revision: number;
  mapa: MapaGuardado;
  actualizadoEn: Date;
  autor: string;
}

export interface InfoVersion {
  id: number;
  numero: number;
  autor: string;
  nota: string;
  creadoEn: string;
  vigente: boolean;
}

/** Geometría de una sala ya calculada: lo que necesita la presencia para decidir por dónde se puede caminar. */
export type GeometriaSala = Required<DatosSala>;

interface Vigente extends VersionPublicada {
  /** El mismo mapa, ya descomprimido (con el piso como matriz). */
  oficina: MapaOficina;
  salaInicial: string;
  salas: Map<string, GeometriaSala>;
}

/** Resumen de lo que `validarMapa` encontró, en un mensaje que se lee de corrido. Solo cuenta los errores. */
function mensajeDeErrores(problemas: readonly Problema[]): string {
  const errores = problemas.filter((p) => p.nivel === 'error');
  const lista = errores.slice(0, 3).map((p) => p.mensaje).join(' ');
  const resto = errores.length - 3;
  const cuantos = errores.length === 1 ? 'este error' : `estos ${errores.length} errores`;
  return `No se puede publicar. Corrige ${cuantos}: ${lista}${resto > 0 ? ` Y ${resto} más.` : ''}`;
}

/**
 * Versiones del mapa de la oficina: la publicada (en memoria para la presencia), un borrador compartido entre
 * quienes construyen y el historial. Todas las escrituras pasan por una cola, así que dos guardados al mismo
 * tiempo se ordenan y el segundo ve la revisión del primero.
 */
export class ServicioOficina {
  private vigente: Vigente | null = null;
  private cola: Promise<unknown> = Promise.resolve();

  /** Solo usa `prisma`, `auditoria` y `presencia`. La presencia se lee al publicar, porque la asigna index.ts después. */
  constructor(private readonly ctx: Pick<Contexto, 'prisma' | 'auditoria' | 'presencia' | 'config'>) {}

  private get db() {
    return this.ctx.prisma.mapaOficina;
  }

  private serializar<T>(tarea: () => Promise<T>): Promise<T> {
    const siguiente = this.cola.then(tarea);
    this.cola = siguiente.then(
      () => undefined,
      () => undefined,
    );
    return siguiente;
  }

  // ---------- publicado (en memoria) ----------

  /** Asegura que exista un mapa publicado y llena la caché. Se llama al arrancar y después de cada publicación. */
  cargar(): Promise<void> {
    return this.serializar(() => this.recargar());
  }

  private async recargar(): Promise<void> {
    const fila = (await this.db.findFirst({ where: { estado: 'publicado' }, orderBy: { numero: 'desc' } })) ?? (await this.sembrar());
    this.vigente = this.construirVigente(fila);
  }

  /** Primer arranque: publica la plantilla inicial (el edificio vacío; en la demo, la oficina de ejemplo) como versión 1. */
  private async sembrar(): Promise<FilaMapa> {
    const maximo = await this.db.aggregate({ _max: { numero: true } });
    return this.db.create({
      data: {
        estado: 'publicado',
        numero: (maximo._max.numero ?? 0) + 1,
        contenido: JSON.stringify(comprimirMapa(plantillaDeMapa(this.ctx.config.plantillaInicial))),
        nota: this.ctx.config.plantillaInicial === 'naos' ? 'Oficina de ejemplo' : 'Edificio vacío',
        autor: 'Sistema',
      },
    });
  }

  private construirVigente(fila: FilaMapa): Vigente {
    const mapa = leerMapaGuardado(fila.contenido, `la versión ${fila.numero}`);
    const oficina = descomprimirMapa(mapa);
    const salas = new Map<string, GeometriaSala>();
    for (const s of oficina.salas) {
      const asientos = new Set<number>();
      for (const a of asientosDe(s)) {
        if (a.x >= 0 && a.y >= 0 && a.x < s.ancho && a.y < s.alto) asientos.add(a.y * s.ancho + a.x);
      }
      salas.set(s.id, {
        id: s.id,
        ancho: s.ancho,
        alto: s.alto,
        llegadas: s.llegadas.map((l) => ({ x: l.x, y: l.y })),
        bloqueo: calcularBloqueo(s),
        asientos,
        zonas: s.zonas.map((z) => ({ id: z.id, tipo: z.tipo, nombre: z.nombre, rect: { ...z.rect } })),
      });
    }
    return { id: fila.id, numero: fila.numero, mapa, creadoEn: fila.creadoEn, autor: fila.autor, nota: fila.nota, oficina, salaInicial: oficina.salaInicial, salas };
  }

  private requerirVigente(): Vigente {
    if (!this.vigente) throw new Error('La oficina todavía no se cargó. Falta llamar a cargar().');
    return this.vigente;
  }

  publicado(): VersionPublicada {
    const { id, numero, mapa, creadoEn, autor, nota } = this.requerirVigente();
    return { id, numero, mapa, creadoEn, autor, nota };
  }

  /** El mapa publicado ya descomprimido (el que usa la lógica de shared: zonas, asientos, portales). No se debe modificar. */
  oficinaPublicada(): MapaOficina {
    return this.requerirVigente().oficina;
  }

  numeroPublicado(): number {
    return this.vigente?.numero ?? 0;
  }

  /** Geometría ya calculada de una sala del mapa publicado (bloqueo, asientos y llegadas). */
  geometria(idSala: string): GeometriaSala | undefined {
    return this.vigente?.salas.get(idSala);
  }

  /** Para la presencia. Lee la caché de forma síncrona, así que siempre ve el último mapa cargado. */
  proveedorSalas(): ProveedorSalas {
    return {
      sala: (id) => this.geometria(id),
      inicial: () => this.vigente?.salaInicial ?? 'principal',
      numero: () => this.numeroPublicado(),
    };
  }

  // ---------- borrador ----------

  private filaBorrador(): Promise<FilaMapa | null> {
    return this.db.findFirst({ where: { estado: 'borrador' }, orderBy: { id: 'desc' } });
  }

  async borrador(): Promise<InfoBorrador | null> {
    const fila = await this.filaBorrador();
    if (!fila) return null;
    return { id: fila.id, revision: fila.revision, mapa: leerMapaGuardado(fila.contenido, 'el borrador'), actualizadoEn: fila.actualizadoEn, autor: fila.autor };
  }

  private choque(actual: Pick<FilaMapa, 'revision' | 'autor'> | null): ErrorHttp {
    if (!actual) {
      return new ErrorHttp(409, 'El borrador ya no existe: alguien lo publicó o lo descartó. Recarga para ver lo último.', 'choque_borrador', { revision: null, autor: '' });
    }
    return new ErrorHttp(409, MENSAJE_CHOQUE, 'choque_borrador', { revision: actual.revision, autor: actual.autor });
  }

  /**
   * Guarda el borrador. `entrada` es `{ revision, mapa }` tal como llega por la API: `revision` es la que la persona
   * vio al cargar (null si no había borrador). Los problemas del mapa no impiden guardar, solo se devuelven.
   */
  async guardarBorrador(entrada: unknown, autor: Actor): Promise<{ revision: number; problemas: Problema[] }> {
    const { revision, mapa } = parsearEntradaBorrador(entrada);
    const problemas = validarMapa(descomprimirMapa(mapa));
    const contenido = JSON.stringify(mapa);

    const nueva = await this.serializar(async () => {
      const actual = await this.filaBorrador();
      if (!actual) {
        if (revision !== null) throw this.choque(null);
        const creada = await this.db.create({ data: { estado: 'borrador', revision: 1, contenido, autorId: autor.id, autor: autor.nombre } });
        return creada.revision;
      }
      if (revision !== actual.revision) throw this.choque(actual);
      // La condición en el WHERE es la garantía final: si otra escritura se coló, no se actualiza nada.
      const r = await this.db.updateMany({
        where: { id: actual.id, estado: 'borrador', revision: actual.revision },
        data: { contenido, revision: { increment: 1 }, autorId: autor.id, autor: autor.nombre },
      });
      if (r.count !== 1) throw this.choque(actual);
      return actual.revision + 1;
    });
    return { revision: nueva, problemas };
  }

  async descartarBorrador(actor: Actor): Promise<void> {
    const quitado = await this.serializar(async () => {
      const fila = await this.filaBorrador();
      if (!fila) throw new ErrorHttp(404, 'No hay un borrador para descartar.');
      await this.db.deleteMany({ where: { estado: 'borrador' } });
      return fila;
    });
    await this.ctx.auditoria.registrar({
      usuario: { id: actor.id, usuario: actor.usuario },
      accion: 'mapa_borrador_descartado',
      objeto: 'Borrador',
      detalle: `Revisión ${quitado.revision}, guardada por ${quitado.autor || 'alguien'}`,
      ip: actor.ip ?? '',
    });
  }

  // ---------- publicar ----------

  async publicar(actor: Actor, nota = ''): Promise<{ numero: number; creadoEn: Date; nota: string; problemas: Problema[] }> {
    const textoNota = nota.trim().slice(0, MAX_NOTA);
    const r = await this.serializar(async () => {
      const borrador = await this.filaBorrador();
      if (!borrador) throw new ErrorHttp(409, 'No hay un borrador para publicar. Guarda cambios primero.', 'sin_borrador');
      const problemas = validarMapa(descomprimirMapa(leerMapaGuardado(borrador.contenido, 'el borrador')));
      if (hayErrores(problemas)) {
        const mensaje = mensajeDeErrores(problemas);
        throw new ErrorHttp(422, mensaje, 'mapa_con_errores', { mensaje, problemas });
      }

      const creada = await this.ctx.prisma.$transaction(async (tx) => {
        const maximo = await tx.mapaOficina.aggregate({ _max: { numero: true }, where: { estado: { in: ['publicado', 'historico'] } } });
        await tx.mapaOficina.updateMany({ where: { estado: 'publicado' }, data: { estado: 'historico' } });
        const nueva = await tx.mapaOficina.create({
          data: { estado: 'publicado', numero: (maximo._max.numero ?? 0) + 1, contenido: borrador.contenido, nota: textoNota, autorId: actor.id, autor: actor.nombre },
        });
        await tx.mapaOficina.deleteMany({ where: { estado: 'borrador' } });
        const viejas = await tx.mapaOficina.findMany({ where: { estado: 'historico' }, orderBy: { numero: 'desc' }, skip: MAX_HISTORICO, select: { id: true } });
        if (viejas.length > 0) await tx.mapaOficina.deleteMany({ where: { id: { in: viejas.map((v) => v.id) } } });
        return nueva;
      });

      await this.recargar();
      return { creada, problemas };
    });

    // Avisar a quien está conectado no puede tumbar una publicación que ya quedó guardada.
    try {
      this.ctx.presencia?.mapaPublicado(r.creada.numero);
    } catch (e) {
      console.error('[oficina] no se pudo avisar a la presencia', e);
    }
    await this.ctx.auditoria.registrar({
      usuario: { id: actor.id, usuario: actor.usuario },
      accion: 'mapa_publicado',
      objeto: `Versión ${r.creada.numero}`,
      detalle: textoNota || 'Sin nota',
      ip: actor.ip ?? '',
    });
    return { numero: r.creada.numero, creadoEn: r.creada.creadoEn, nota: r.creada.nota, problemas: r.problemas };
  }

  // ---------- áreas personales ----------

  /**
   * Una persona con un área cambia los objetos de SU área (poner otro computador, quitar una planta). Se publica en el
   * acto como una versión nueva, porque son cambios pequeños y de una sola persona. El servidor es quien decide:
   * comprueba que la cuenta sea dueña del área, que cada objeto esté permitido y entero dentro de ella, y que el mapa
   * no quede con errores. Si hay un borrador de quien administra, el mismo cambio se aplica también ahí para que no
   * lo pise al publicar.
   */
  async editarArea(actor: Actor, idSala: string, idArea: string, entrada: unknown): Promise<{ numero: number; mapa: MapaGuardado }> {
    const { base, colocaciones } = parsearEdicionArea(entrada);
    const r = await this.serializar(async () => {
      const vigente = this.requerirVigente();
      if (base !== vigente.numero) {
        throw new ErrorHttp(409, 'La oficina cambió mientras editabas. Recarga para ver lo último.', 'choque_mapa', { numero: vigente.numero });
      }
      const sala = vigente.oficina.salas.find((s) => s.id === idSala);
      const area = sala?.areas?.find((a) => a.id === idArea);
      if (!sala || !area) throw new ErrorHttp(404, 'Esa área ya no existe.');
      if (!area.duenos.includes(actor.id)) throw new ErrorHttp(403, 'Esa área no es tuya. Pídele a quien administra la oficina que te la asigne.', 'area_ajena');

      // Lo que ya estaba en el área se conserva aunque no sea de sus paquetes; lo nuevo sí exige tener el paquete.
      const cuenta = await this.ctx.prisma.usuario.findUnique({ where: { id: actor.id }, select: { acceso: true } });
      const paquetes = cuenta ? leerAcceso(cuenta.acceso) : [];
      const existentes = new Map(sala.colocaciones.map((c) => [c.id, c.objeto]));
      for (const c of colocaciones) {
        const o = objetoPorId(c.objeto);
        if (o && !objetoDisponible(o, paquetes) && existentes.get(c.id) !== c.objeto) {
          throw new ErrorHttp(403, `${o.nombre} no está entre los objetos que tienes disponibles. Pídele a quien administra que te lo asigne.`, 'objeto_sin_acceso');
        }
      }

      const aplicada = aplicarEdicionDeArea(sala, area, colocaciones);
      if (esFallo(aplicada)) throw new ErrorHttp(422, aplicada.error, 'area_no_valida');
      const antes = validarMapa(vigente.oficina).filter((p) => p.nivel === 'error').length;
      const nuevoMapa = { ...vigente.oficina, salas: vigente.oficina.salas.map((s) => (s.id === sala.id ? aplicada.sala : s)) };
      const problemas = validarMapa(nuevoMapa);
      if (problemas.filter((p) => p.nivel === 'error').length > antes) {
        const mensaje = mensajeDeErrores(problemas);
        throw new ErrorHttp(422, mensaje, 'area_con_errores', { mensaje, problemas });
      }
      const contenido = JSON.stringify(comprimirMapa(nuevoMapa));
      const nota = `Área «${area.nombre}» editada por ${actor.nombre}`.slice(0, MAX_NOTA);

      const creada = await this.ctx.prisma.$transaction(async (tx) => {
        const maximo = await tx.mapaOficina.aggregate({ _max: { numero: true }, where: { estado: { in: ['publicado', 'historico'] } } });
        await tx.mapaOficina.updateMany({ where: { estado: 'publicado' }, data: { estado: 'historico' } });
        const nueva = await tx.mapaOficina.create({ data: { estado: 'publicado', numero: (maximo._max.numero ?? 0) + 1, contenido, nota, autorId: actor.id, autor: actor.nombre } });
        const viejas = await tx.mapaOficina.findMany({ where: { estado: 'historico' }, orderBy: { numero: 'desc' }, skip: MAX_HISTORICO, select: { id: true } });
        if (viejas.length > 0) await tx.mapaOficina.deleteMany({ where: { id: { in: viejas.map((v) => v.id) } } });
        // El mismo cambio en el borrador de quien administra, si lo hay, para que publicarlo no lo borre.
        const borrador = await tx.mapaOficina.findFirst({ where: { estado: 'borrador' }, orderBy: { id: 'desc' } });
        if (borrador) {
          try {
            const mapaBorrador = descomprimirMapa(leerMapaGuardado(borrador.contenido, 'el borrador'));
            const salaB = mapaBorrador.salas.find((s) => s.id === sala.id);
            const areaB = salaB?.areas?.find((a) => a.id === area.id);
            if (salaB && areaB) {
              const ap = aplicarEdicionDeArea(salaB, areaB, colocaciones);
              if (!esFallo(ap)) {
                const mb = { ...mapaBorrador, salas: mapaBorrador.salas.map((s) => (s.id === salaB.id ? ap.sala : s)) };
                await tx.mapaOficina.update({ where: { id: borrador.id }, data: { contenido: JSON.stringify(comprimirMapa(mb)), revision: { increment: 1 } } });
              }
            }
          } catch (e) {
            console.error('[oficina] no se pudo reflejar el cambio de área en el borrador', e);
          }
        }
        return nueva;
      });
      await this.recargar();
      return { creada, mapa: comprimirMapa(nuevoMapa), nombreArea: area.nombre };
    });

    try {
      this.ctx.presencia?.mapaPublicado(r.creada.numero);
    } catch (e) {
      console.error('[oficina] no se pudo avisar a la presencia', e);
    }
    await this.ctx.auditoria.registrar({
      usuario: { id: actor.id, usuario: actor.usuario },
      accion: 'mapa_area_editada',
      objeto: `Versión ${r.creada.numero}`,
      detalle: `Área «${r.nombreArea}»`,
      ip: actor.ip ?? '',
    });
    return { numero: r.creada.numero, mapa: r.mapa };
  }

  // ---------- historial ----------

  async versiones(): Promise<InfoVersion[]> {
    const filas = await this.db.findMany({
      where: { estado: { in: ['publicado', 'historico'] } },
      orderBy: { numero: 'desc' },
      select: { id: true, numero: true, autor: true, nota: true, creadoEn: true, estado: true },
    });
    return filas.map((f) => ({ id: f.id, numero: f.numero, autor: f.autor, nota: f.nota, creadoEn: f.creadoEn.toISOString(), vigente: f.estado === 'publicado' }));
  }

  /** Copia una versión al borrador (reemplaza el que hubiera). No publica nada. */
  async restaurar(id: number, actor: Actor): Promise<{ numero: number; revision: number; problemas: Problema[] }> {
    const r = await this.serializar(async () => {
      const origen = await this.db.findFirst({ where: { id, estado: { in: ['publicado', 'historico'] } } });
      if (!origen) throw new ErrorHttp(404, 'No existe esa versión.');
      const mapa = leerMapaGuardado(origen.contenido, `la versión ${origen.numero}`);
      const datos = { contenido: origen.contenido, nota: `Restaurada de la versión ${origen.numero}`, autorId: actor.id, autor: actor.nombre };
      const actual = await this.filaBorrador();
      const borrador = actual
        ? await this.db.update({ where: { id: actual.id }, data: { ...datos, revision: { increment: 1 } } })
        : await this.db.create({ data: { estado: 'borrador', revision: 1, ...datos } });
      return { numero: origen.numero, revision: borrador.revision, mapa };
    });
    await this.ctx.auditoria.registrar({
      usuario: { id: actor.id, usuario: actor.usuario },
      accion: 'mapa_restaurado',
      objeto: `Versión ${r.numero}`,
      detalle: `Pasó al borrador (revisión ${r.revision})`,
      ip: actor.ip ?? '',
    });
    return { numero: r.numero, revision: r.revision, problemas: validarMapa(descomprimirMapa(r.mapa)) };
  }
}
