/**
 * Punto de entrada del pipeline de arte: `npm run arte` (desde la raíz del repo).
 *
 * Aquí vive el registro de constructores. Cada grupo de arte (objetos,
 * personajes, el demo de referencia) registra una función con un nombre, y
 * `construirTodo()` las ejecuta en el orden en que se registraron.
 *
 * Cómo se suma un constructor nuevo:
 *   1. Crea `arte/src/objetos/index.ts` (o `arte/src/personaje/index.ts`).
 *   2. Ahí llama a `registrarConstructor('mi-grupo', (ctx) => { ... })`.
 *   3. Este archivo importa esos `index.ts` si existen; no hay que tocarlo.
 *
 * Dentro del constructor se dibuja, se valida (`validarLienzo`, `validarAtlas`),
 * se guardan vistas en `ctx.dirSalida` y se llama a `ctx.publicarAtlas(...)`,
 * que solo escribe en `web/public/assets/arte/` y `shared/src/catalogo/` si se
 * pidió `--publicar`.
 *
 * Opciones de la línea de comandos:
 *   npm run arte                      construye todo (sin publicar)
 *   npm run arte -- --publicar        construye y publica los atlas
 *   npm run arte -- --solo=a,b        solo los constructores indicados
 *   npm run arte -- --lista           muestra los nombres registrados
 */

import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { construirDemoNucleo } from './demo/estilo-referencia';
import { escribirPng, hojaContacto, publicarAtlas as publicarAtlasEnDisco, rutaSalida } from './nucleo';
import type {
  ItemSprite,
  Lienzo,
  Marco,
  OpcionesHojaContacto,
  OpcionesPublicacion,
  ResultadoPublicacion,
} from './nucleo';

/** Lo que recibe cada constructor al ejecutarse. */
export interface ContextoConstruccion {
  /** Carpeta de vistas previas y hojas de contacto (`arte/salida`). */
  dirSalida: string;
  /** Si es `true`, el constructor debe publicar su atlas. Si es `false`, no escribe fuera de `dirSalida`. */
  publicar: boolean;
  /** Escribe una línea en la consola con el nombre del constructor por delante. */
  log(mensaje: string): void;
  /** Guarda un lienzo como PNG en `dirSalida` y devuelve la ruta. */
  guardarPng(nombreArchivo: string, lienzo: Lienzo): string;
  /** Arma una hoja de contacto, la guarda en `dirSalida` y devuelve la ruta. */
  guardarHoja(nombreArchivo: string, items: readonly ItemSprite[], opciones?: OpcionesHojaContacto): string;
  /**
   * Publica un atlas (`publicarAtlas`) solo si se pidió `--publicar`. Si no,
   * lo anota en el registro y devuelve `null` sin escribir nada. Así el
   * constructor lo llama siempre y no tiene que revisar `publicar`.
   */
  publicarAtlas(
    nombre: string,
    atlas: Lienzo,
    frames: Readonly<Record<string, Marco>>,
    metadatos?: Readonly<Record<string, unknown>>,
    opciones?: OpcionesPublicacion,
  ): ResultadoPublicacion | null;
}

export type FnConstructor = (ctx: ContextoConstruccion) => void | Promise<void>;

export interface ResultadoConstructor {
  nombre: string;
  ok: boolean;
  /** Milisegundos que tardó. */
  ms: number;
  /** Mensaje de error si falló. */
  error?: string;
}

export interface OpcionesConstruccion {
  /** Solo estos constructores. Si se pide uno que no existe, se lanza un error. */
  solo?: readonly string[];
  /** Publicar los atlas. Por defecto no. */
  publicar?: boolean;
  /** Carpeta de salida. Por defecto `arte/salida`. */
  dirSalida?: string;
  /** Raíz alternativa para publicar (pensada para pruebas). Por defecto, la raíz del repo. */
  raizPublicacion?: string;
  /** Dónde escribir los mensajes. Por defecto la consola. */
  escribir?: (linea: string) => void;
}

/** Registro de constructores. Se puede crear uno aparte para probar sin tocar el global. */
export class RegistroConstructores {
  private readonly constructores = new Map<string, FnConstructor>();

  /** Registra un constructor. El nombre debe ser único y no vacío. */
  registrar(nombre: string, fn: FnConstructor): void {
    if (nombre.trim() === '') throw new RangeError('El constructor necesita un nombre.');
    if (this.constructores.has(nombre)) throw new RangeError(`Ya hay un constructor llamado "${nombre}".`);
    this.constructores.set(nombre, fn);
  }

  /** Nombres registrados, en orden de registro. */
  nombres(): string[] {
    return [...this.constructores.keys()];
  }

  /** Borra todos los registros. Pensado para pruebas. */
  limpiar(): void {
    this.constructores.clear();
  }

  /**
   * Ejecuta los constructores en orden de registro. Un error en uno no frena a
   * los demás: queda anotado en el resultado.
   */
  async construirTodo(opciones: OpcionesConstruccion = {}): Promise<ResultadoConstructor[]> {
    const escribir = opciones.escribir ?? ((linea: string) => console.log(linea));
    const dirSalida = opciones.dirSalida ?? rutaSalida();
    const publicar = opciones.publicar ?? false;
    const pedidos = opciones.solo;
    if (pedidos !== undefined) {
      const desconocidos = pedidos.filter((n) => !this.constructores.has(n));
      if (desconocidos.length > 0) {
        throw new RangeError(
          `No existe el constructor ${desconocidos.map((n) => `"${n}"`).join(', ')}. Registrados: ${this.nombres().join(', ') || '(ninguno)'}.`,
        );
      }
    }

    const resultados: ResultadoConstructor[] = [];
    for (const [nombre, fn] of this.constructores) {
      if (pedidos !== undefined && !pedidos.includes(nombre)) continue;
      const contexto: ContextoConstruccion = {
        dirSalida,
        publicar,
        log: (mensaje) => escribir(`[${nombre}] ${mensaje}`),
        guardarPng: (nombreArchivo, lienzo) => {
          const ruta = join(dirSalida, nombreArchivo);
          escribirPng(lienzo, ruta);
          return ruta;
        },
        guardarHoja: (nombreArchivo, items, opcionesHoja) => {
          const ruta = join(dirSalida, nombreArchivo);
          escribirPng(hojaContacto(items, opcionesHoja), ruta);
          return ruta;
        },
        publicarAtlas: (nombreAtlas, atlas, frames, metadatos, opcionesPublicacion) => {
          if (!publicar) {
            escribir(`[${nombre}] atlas "${nombreAtlas}" listo; no se publica (usa --publicar)`);
            return null;
          }
          const raiz = opcionesPublicacion?.raiz ?? opciones.raizPublicacion;
          const resultado = publicarAtlasEnDisco(nombreAtlas, atlas, frames, metadatos, {
            ...opcionesPublicacion,
            ...(raiz !== undefined ? { raiz } : {}),
          });
          escribir(`[${nombre}] atlas "${nombreAtlas}" publicado (${resultado.huella}${resultado.cambiado ? '' : ', sin cambios'})`);
          return resultado;
        },
      };
      const inicio = performance.now();
      try {
        await fn(contexto);
        const ms = Math.round(performance.now() - inicio);
        escribir(`[${nombre}] listo en ${ms} ms`);
        resultados.push({ nombre, ok: true, ms });
      } catch (error) {
        const ms = Math.round(performance.now() - inicio);
        const mensaje = error instanceof Error ? error.message : String(error);
        escribir(`[${nombre}] FALLÓ: ${mensaje}`);
        resultados.push({ nombre, ok: false, ms, error: mensaje });
      }
    }
    return resultados;
  }
}

// El registro global se guarda en `globalThis` para que sea uno solo aunque
// este módulo se cargue dos veces (por ejemplo, como entrada y como import).
const CLAVE_REGISTRO = Symbol.for('ol.arte.registro-constructores');
const almacen = globalThis as unknown as Record<symbol, RegistroConstructores | undefined>;
const registroGlobal: RegistroConstructores = (almacen[CLAVE_REGISTRO] ??= new RegistroConstructores());

/** Registra un constructor en el registro global. */
export function registrarConstructor(nombre: string, fn: FnConstructor): void {
  registroGlobal.registrar(nombre, fn);
}

/** Nombres de los constructores registrados, en orden. */
export function constructoresRegistrados(): string[] {
  return registroGlobal.nombres();
}

/** Ejecuta los constructores registrados en el registro global. */
export function construirTodo(opciones: OpcionesConstruccion = {}): Promise<ResultadoConstructor[]> {
  return registroGlobal.construirTodo(opciones);
}

// ---------------------------------------------------------------------------
// Constructores incluidos
// ---------------------------------------------------------------------------

if (!registroGlobal.nombres().includes('demo-estilo-referencia')) {
  registrarConstructor('demo-estilo-referencia', (ctx) => {
    const { items, ruta } = construirDemoNucleo(ctx.dirSalida);
    ctx.log(`${items.length} sprites validados. Hoja de contacto: ${ruta}`);
  });
}

// ---------------------------------------------------------------------------
// Línea de comandos
// ---------------------------------------------------------------------------

/** Módulos que registran constructores. Si el archivo existe, se importa. */
const MODULOS_OPCIONALES = ['./objetos/index.ts', './personaje/index.ts', './ingreso/fachada.ts', './ingreso/ascensor.ts', './exterior/index.ts', './mascota/index.ts'] as const;

async function cargarModulosOpcionales(): Promise<string[]> {
  const cargados: string[] = [];
  for (const relativa of MODULOS_OPCIONALES) {
    const url = new URL(relativa, import.meta.url);
    if (!existsSync(fileURLToPath(url))) continue;
    await import(url.href);
    cargados.push(relativa);
  }
  return cargados;
}

async function principal(argumentos: readonly string[]): Promise<number> {
  const cargados = await cargarModulosOpcionales();
  if (cargados.length > 0) console.log(`Módulos cargados: ${cargados.join(', ')}`);

  if (argumentos.includes('--lista')) {
    console.log(constructoresRegistrados().join('\n'));
    return 0;
  }
  const solo = argumentos.find((a) => a.startsWith('--solo='));
  const resultados = await construirTodo({
    publicar: argumentos.includes('--publicar'),
    ...(solo !== undefined ? { solo: solo.slice('--solo='.length).split(',').filter((n) => n !== '') } : {}),
  });
  const fallidos = resultados.filter((r) => !r.ok);
  console.log(`\n${resultados.length - fallidos.length} de ${resultados.length} constructores listos.`);
  return fallidos.length === 0 ? 0 : 1;
}

const entrada = process.argv[1];
if (entrada !== undefined && pathToFileURL(resolve(entrada)).href === import.meta.url) {
  principal(process.argv.slice(2)).then(
    (codigo) => {
      process.exitCode = codigo;
    },
    (error: unknown) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    },
  );
}
