import fs from 'node:fs';
import path from 'node:path';
import {
  AVISO_ASIGNACION,
  avatarAlAzar,
  disfrazDe,
  disfrazDisponible,
  limpiarNombreMascota,
  limpiarPaquetes,
  mascotaDisponible,
  mascotaPorId,
  migrarAvatar,
  movilidadDisponible,
  parteDisponible,
  validarAvatar,
  validarMascota,
  type AvatarSpec,
  type CatalogoMascotas,
  type CatalogoPersonaje,
} from '@ol/shared';
import { RAIZ } from '../config';

const DIR = path.join(RAIZ, 'shared', 'src', 'catalogo');
let cache: CatalogoPersonaje | null = null;

/** El catálogo de personajes publicado más nuevo (personajes-v3.json, personajes-v4.json...). */
export function catalogoPersonajes(): CatalogoPersonaje {
  if (cache) return cache;
  const archivos = fs
    .readdirSync(DIR)
    .map((f) => /^personajes-v(\d+)\.json$/.exec(f))
    .filter((m): m is RegExpExecArray => m !== null)
    .sort((a, b) => Number(b[1]) - Number(a[1]));
  const mas = archivos[0];
  if (!mas) throw new Error('No hay un catálogo de personajes publicado en shared/src/catalogo.');
  cache = JSON.parse(fs.readFileSync(path.join(DIR, mas[0]), 'utf8')) as CatalogoPersonaje;
  return cache;
}

let cacheMascotas: CatalogoMascotas | null = null;

/** El catálogo de mascotas publicado más nuevo (mascotas-v1.json...). */
export function catalogoMascotas(): CatalogoMascotas {
  if (cacheMascotas) return cacheMascotas;
  const archivos = fs
    .readdirSync(DIR)
    .map((f) => /^mascotas-v(\d+)\.json$/.exec(f))
    .filter((m): m is RegExpExecArray => m !== null)
    .sort((a, b) => Number(b[1]) - Number(a[1]));
  const mas = archivos[0];
  if (!mas) throw new Error('No hay un catálogo de mascotas publicado en shared/src/catalogo.');
  cacheMascotas = JSON.parse(fs.readFileSync(path.join(DIR, mas[0]), 'utf8')) as CatalogoMascotas;
  return cacheMascotas;
}

/** Para pruebas: vuelve a leer los catálogos. */
export const olvidarCatalogo = (): void => {
  cache = null;
  cacheMascotas = null;
};

/** Una semilla estable a partir de un texto (para que una migración dé siempre el mismo resultado). */
function semillaDe(texto: string): number {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) h = Math.imul(h ^ texto.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** El personaje con el que arranca una cuenta nueva: uno al azar, normal (sin disfraz ni movilidad), siempre el mismo para esa semilla. */
export function personajeInicial(semilla: number): AvatarSpec {
  return avatarAlAzar(catalogoPersonajes(), semilla);
}

/**
 * Por qué un personaje no se puede guardar para esta persona (o `null` si está bien): ids que no existen, ropa premium sin el
 * paquete, disfraces fuera de fecha, ayudas de movilidad sin permiso o una mascota que no le asignaron.
 * `previo` es el personaje que ya tenía guardado: lo premium que ya lleva puesto lo conserva (el paquete solo controla lo que
 * se puede elegir de nuevo).
 */
export function motivoNoValido(spec: AvatarSpec, paquetes: readonly string[], fecha: Date = new Date(), previo: AvatarSpec | null = null): string | null {
  const cat = catalogoPersonajes();
  const forma = validarAvatar(spec, cat);
  if (forma) return forma;
  const yaLlevaba = new Set<string>([...(previo?.accesorios ?? []).map((a) => a.id), ...(previo?.chaqueta ? [previo.chaqueta.id] : [])]);
  for (const a of spec.accesorios) {
    const parte = cat.accesorios.find((p) => p.id === a.id);
    if (parte && !parteDisponible(parte, paquetes) && !yaLlevaba.has(a.id)) return `«${parte.nombre}» es ropa premium. ${AVISO_ASIGNACION}`;
  }
  if (spec.chaqueta) {
    const parte = (cat.chaquetas ?? []).find((p) => p.id === spec.chaqueta?.id);
    if (parte && !parteDisponible(parte, paquetes) && !yaLlevaba.has(parte.id)) return `«${parte.nombre}» es ropa premium. ${AVISO_ASIGNACION}`;
  }
  if (spec.especial) {
    const d = disfrazDe(spec, cat);
    if (!d || !disfrazDisponible(d, paquetes, fecha)) return 'Ese disfraz se activa en las fechas de su fiesta o cuando la administración te lo asigne.';
  }
  if (spec.movilidad && !movilidadDisponible(paquetes)) return 'Esa ayuda de movilidad todavía no te la asignaron.';
  if (spec.mascota) {
    const cm = catalogoMascotas();
    const mal = validarMascota(spec.mascota, cm);
    if (mal) return mal;
    const def = mascotaPorId(cm, spec.mascota.id);
    if (def && !mascotaDisponible(def, paquetes)) return `Todavía no tienes la mascota «${def.nombre}». ${AVISO_ASIGNACION}`;
  }
  return null;
}

/**
 * El personaje como se ve hoy: si lo que tenía (disfraz, movilidad, mascota) ya no está disponible, se quita y queda con su
 * ropa de siempre. Así los disfraces aparecen solos en las fechas de cada fiesta y se van cuando terminan. La ropa premium que
 * ya lleva puesta se conserva aunque no tenga el paquete: no se le quita nada, solo no puede elegir más.
 */
export function personajeVisible(spec: AvatarSpec | null, paquetes: readonly string[], fecha: Date = new Date()): AvatarSpec | null {
  if (!spec) return null;
  const cat = catalogoPersonajes();
  // Una cuenta guardada con un catálogo anterior (v2 o v3) cae a un personaje válido del actual: nunca rompe el ingreso ni el mundo.
  let r = validarAvatar(spec, cat) === null ? spec : migrarAvatar(spec, cat, semillaDe(JSON.stringify(spec)));
  if (r.especial) {
    const d = disfrazDe(r, cat);
    if (!d || !disfrazDisponible(d, paquetes, fecha)) {
      const { especial: _quitar, ...resto } = r;
      r = resto;
    }
  }
  if (r.movilidad && !movilidadDisponible(paquetes)) {
    const { movilidad: _quitar, ...resto } = r;
    r = resto;
  }
  if (r.mascota) {
    const cm = catalogoMascotas();
    const def = validarMascota(r.mascota, cm) === null ? mascotaPorId(cm, r.mascota.id) : undefined;
    if (!def || !mascotaDisponible(def, paquetes)) {
      const { mascota: _quitar, ...resto } = r;
      r = resto;
    } else {
      const nombre = limpiarNombreMascota(r.mascota.nombre);
      r = { ...r, mascota: { id: r.mascota.id, color: r.mascota.color, ...(nombre === undefined ? {} : { nombre }) } };
    }
  }
  return r;
}

export { limpiarPaquetes };
