/**
 * Salida del pipeline: dónde se escriben los archivos y cómo se publica un atlas.
 *
 * - Las vistas previas y hojas de contacto van a `arte/salida/` (no se versiona).
 * - Un atlas publicado deja DOS archivos:
 *     web/public/assets/arte/<nombre>.png      la imagen,
 *     shared/src/catalogo/<nombre>.json        las posiciones y los metadatos.
 *   Los dos se versionan, para que la web y el servidor lean lo mismo.
 * - Todo es determinista: publicar dos veces los mismos datos escribe los mismos bytes
 *   (y si el archivo ya está igual, ni siquiera lo reescribe).
 */

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Lienzo } from './lienzo';
import { contarMarcadores, marcadoresJson } from './marcadores';
import type { TablaMarcadoresJson } from './marcadores';
import { codificarPng } from './png';
import type { Marco } from './tipos';
import { validarAtlas } from './validar';
import type { OpcionesValidacionAtlas } from './validar';

/** Carpeta (desde la raíz del repo) donde se publican las imágenes de los atlas. */
export const DIR_PNG_PUBLICO = join('web', 'public', 'assets', 'arte');
/** Carpeta (desde la raíz del repo) donde se publican los catálogos JSON de los atlas. */
export const DIR_JSON_CATALOGO = join('shared', 'src', 'catalogo');

let raizEnCache: string | null = null;

function buscarRaiz(): string {
  const aqui = dirname(fileURLToPath(import.meta.url));
  let dir = aqui;
  for (let i = 0; i < 8; i++) {
    const paquete = join(dir, 'package.json');
    if (existsSync(paquete)) {
      try {
        const json = JSON.parse(readFileSync(paquete, 'utf8')) as { workspaces?: unknown };
        if (Array.isArray(json.workspaces)) return dir;
      } catch {
        // Un package.json ilegible no es la raíz: seguimos subiendo.
      }
    }
    const padre = dirname(dir);
    if (padre === dir) break;
    dir = padre;
  }
  // Respaldo: este archivo vive en <raíz>/arte/src/nucleo.
  return resolve(aqui, '..', '..', '..');
}

/** Raíz del monorepo (la carpeta con el `package.json` que declara los workspaces). */
export function rutaRaiz(): string {
  raizEnCache ??= buscarRaiz();
  return raizEnCache;
}

/** Carpeta del paquete `arte/`. */
export function rutaArte(): string {
  return join(rutaRaiz(), 'arte');
}

/** Carpeta `arte/salida/`: vistas previas y hojas de contacto. No se versiona. */
export function rutaSalida(): string {
  return join(rutaArte(), 'salida');
}

/** Lo que se escribe en el JSON de un atlas. */
export interface ManifiestoAtlas {
  version: 1;
  archivo: string;
  /** Primeros 10 caracteres hex del sha1 del PNG. Cambia si cambia la imagen. */
  huella: string;
  ancho: number;
  alto: number;
  frames: Record<string, Marco>;
  /** Tabla de marcadores, solo si el atlas contiene colores marcador. */
  marcadores?: TablaMarcadoresJson;
  [clave: string]: unknown;
}

export interface OpcionesPublicacion {
  /** Raíz alternativa del repo. Sirve para probar sin escribir en las carpetas reales. */
  raiz?: string;
  /**
   * Fuerza (`true`) o impide (`false`) escribir la tabla de marcadores en el
   * JSON. Por defecto se incluye solo si el atlas tiene píxeles marcador.
   */
  incluirMarcadores?: boolean;
  /**
   * Validación antes de escribir nada (`validarAtlas`). Por defecto revisa la
   * paleta global (más los marcadores de personajes), el alfa binario, que los
   * marcos estén dentro del atlas y sin solapes, y que no haya píxeles sueltos
   * fuera de los marcos. Se le pueden pasar más reglas (por ejemplo `multiplo`
   * o `relleno`) y con `false` se omite. Si hay errores, lanza uno con la lista.
   */
  validar?: OpcionesValidacionAtlas | false;
}

export interface ResultadoPublicacion {
  rutaPng: string;
  rutaJson: string;
  huella: string;
  manifiesto: ManifiestoAtlas;
  /** `false` si los dos archivos ya tenían exactamente este contenido. */
  cambiado: boolean;
}

const CLAVES_RESERVADAS = ['version', 'archivo', 'huella', 'ancho', 'alto', 'frames', 'marcadores'] as const;
const NOMBRE_VALIDO = /^[a-z0-9][a-z0-9._-]*$/;

function esPrimitivo(v: unknown): boolean {
  return v === null || typeof v !== 'object';
}

/**
 * JSON con sangría de 2 espacios, claves en el orden recibido y los objetos y
 * listas "planos" en una sola línea (cada frame ocupa una línea: los diffs en git quedan limpios).
 */
export function jsonLegible(valor: unknown, nivel = 0): string {
  if (valor === undefined) return 'null';
  if (esPrimitivo(valor)) {
    if (typeof valor === 'number' && !Number.isFinite(valor)) {
      throw new TypeError('El JSON no admite NaN ni Infinity.');
    }
    return JSON.stringify(valor);
  }
  const sangria = '  '.repeat(nivel);
  if (Array.isArray(valor)) {
    if (valor.length === 0) return '[]';
    const plano = `[${valor.map((v) => jsonLegible(v, 0)).join(', ')}]`;
    if (valor.every(esPrimitivo) && plano.length <= 100) return plano;
    return `[\n${valor.map((v) => `${sangria}  ${jsonLegible(v, nivel + 1)}`).join(',\n')}\n${sangria}]`;
  }
  const entradas = Object.entries(valor as Record<string, unknown>).filter(([, v]) => v !== undefined);
  if (entradas.length === 0) return '{}';
  const plano = `{ ${entradas.map(([k, v]) => `${JSON.stringify(k)}: ${jsonLegible(v, 0)}`).join(', ')} }`;
  if (entradas.every(([, v]) => esPrimitivo(v)) && plano.length <= 100) return plano;
  return `{\n${entradas
    .map(([k, v]) => `${sangria}  ${JSON.stringify(k)}: ${jsonLegible(v, nivel + 1)}`)
    .join(',\n')}\n${sangria}}`;
}

function escribirSiCambio(ruta: string, contenido: Buffer): boolean {
  if (existsSync(ruta) && readFileSync(ruta).equals(contenido)) return false;
  mkdirSync(dirname(ruta), { recursive: true });
  writeFileSync(ruta, contenido);
  return true;
}

/**
 * Publica un atlas: escribe el PNG y el JSON en sus carpetas del repo.
 *
 * El JSON queda así: `{ version: 1, archivo, huella, ancho, alto, frames, ...metadatos }`.
 * Los frames se escriben ordenados por id. Si el atlas contiene colores
 * marcador, el JSON incluye también `marcadores` (la tabla exacta para el
 * navegador).
 *
 * `nombre` solo admite minúsculas, números, punto, guion y guion bajo. Por la
 * regla de "los atlas llevan versión en el nombre", lo normal es algo como
 * `objetos-v1`. `metadatos` no puede usar las claves reservadas
 * (`version`, `archivo`, `huella`, `ancho`, `alto`, `frames`, `marcadores`).
 *
 * Antes de escribir valida el atlas (ver `OpcionesPublicacion.validar`): un
 * atlas con colores fuera de la paleta o con marcos mal puestos no se publica.
 */
export function publicarAtlas(
  nombre: string,
  atlas: Lienzo,
  frames: Readonly<Record<string, Marco>>,
  metadatos: Readonly<Record<string, unknown>> = {},
  opciones: OpcionesPublicacion = {},
): ResultadoPublicacion {
  if (!NOMBRE_VALIDO.test(nombre)) {
    throw new RangeError(
      `Nombre de atlas inválido: "${nombre}". Usa minúsculas, números, punto, guion o guion bajo (por ejemplo "objetos-v1").`,
    );
  }
  for (const clave of CLAVES_RESERVADAS) {
    if (Object.prototype.hasOwnProperty.call(metadatos, clave)) {
      throw new RangeError(`Los metadatos no pueden usar la clave reservada "${clave}".`);
    }
  }

  if (opciones.validar !== false) {
    const problemas = validarAtlas(atlas, frames, { permitirMarcadores: true, ...(opciones.validar ?? {}) });
    if (problemas.length > 0) {
      throw new Error(`El atlas "${nombre}" no pasa la validación y no se publicó:\n${problemas.join('\n')}`);
    }
  }

  const raiz = opciones.raiz ?? rutaRaiz();
  const png = codificarPng(atlas);
  const huella = createHash('sha1').update(png).digest('hex').slice(0, 10);

  const ordenados: Record<string, Marco> = {};
  for (const id of Object.keys(frames).sort()) {
    const m = frames[id] as Marco;
    ordenados[id] = { x: m.x, y: m.y, w: m.w, h: m.h };
  }

  const incluirMarcadores = opciones.incluirMarcadores ?? contarMarcadores(atlas) > 0;
  const manifiesto: ManifiestoAtlas = {
    version: 1,
    archivo: `${nombre}.png`,
    huella,
    ancho: atlas.ancho,
    alto: atlas.alto,
    frames: ordenados,
    ...metadatos,
    ...(incluirMarcadores ? { marcadores: marcadoresJson() } : {}),
  };

  const rutaPng = join(raiz, DIR_PNG_PUBLICO, `${nombre}.png`);
  const rutaJson = join(raiz, DIR_JSON_CATALOGO, `${nombre}.json`);
  const cambioPng = escribirSiCambio(rutaPng, png);
  const cambioJson = escribirSiCambio(rutaJson, Buffer.from(`${jsonLegible(manifiesto)}\n`, 'utf8'));
  return { rutaPng, rutaJson, huella, manifiesto, cambiado: cambioPng || cambioJson };
}
