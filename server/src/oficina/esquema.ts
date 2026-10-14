import { z } from 'zod';
import { LIMITES_MAPA, type MapaGuardado } from '@ol/shared';
import { ErrorHttp } from '../errores';

/**
 * Forma estricta del mapa que llega del editor (formato compacto). Aquí solo se revisa la FORMA: tipos, largos,
 * rangos, claves desconocidas y enlaces. Que el mapa tenga sentido (objetos que existen, paredes, puertas) lo
 * decide `validarMapa` de shared, y esos problemas no impiden guardar un borrador.
 */

/** Debe ser igual al alfabeto de `comprimirMapa` en shared/src/oficina.ts, que no lo exporta. */
const ALFABETO = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

export const LIMITES_ESQUEMA = {
  id: 40,
  nombre: 60,
  titulo: 80,
  texto: 1000,
  enlace: 500,
  ladoMinimo: 4,
  zonasPorSala: 200,
  areasPorSala: 300,
  duenosPorArea: 20,
  objetosPorEdicionDeArea: 60,
  puestosPorSala: 1000,
  llegadasPorSala: 64,
  portalesPorSala: 100,
  paleta: ALFABETO.length,
  /** Las coordenadas que se salen de la sala las reporta `validarMapa`; esto solo frena números absurdos. */
  coordenada: 1000,
} as const;

// ---------- piezas ----------

const id = z.string().min(1, 'no puede estar vacío').max(LIMITES_ESQUEMA.id);
const nombre = z.string().max(LIMITES_ESQUEMA.nombre);
const coordenada = z.number().int().min(-LIMITES_ESQUEMA.coordenada).max(LIMITES_ESQUEMA.coordenada);

/** Mismo criterio que `validarMapa`, más que el navegador pueda leerlo como URL. Rechaza javascript:, data: y http:. */
const ENLACE_HTTPS = /^https:\/\/[^\s]+$/i;
const enlaceHttps = z
  .string()
  .max(LIMITES_ESQUEMA.enlace)
  .refine((v) => ENLACE_HTTPS.test(v) && URL.canParse(v), { message: 'debe ser un enlace que empiece por https://' });

const props = z
  .object({
    enlace: enlaceHttps.optional(),
    texto: z.string().max(LIMITES_ESQUEMA.texto).optional(),
    imagen: enlaceHttps.optional(),
    titulo: z.string().max(LIMITES_ESQUEMA.titulo).optional(),
  })
  .strict();

const colocacion = z
  .object({
    id,
    objeto: id,
    x: coordenada,
    y: coordenada,
    orientacion: z.enum(['N', 'E', 'S', 'O', 'U']),
    variante: id,
    props: props.optional(),
  })
  .strict();

const zona = z
  .object({
    id,
    nombre,
    tipo: z.enum(['abierta', 'silenciosa', 'privada', 'sala', 'coworking']),
    rect: z
      .object({
        x: coordenada,
        y: coordenada,
        w: z.number().int().min(0).max(LIMITES_MAPA.ancho),
        h: z.number().int().min(0).max(LIMITES_MAPA.alto),
      })
      .strict(),
    enlaceTeams: enlaceHttps.optional(),
    descripcion: z.string().trim().max(120, 'La descripción admite hasta 120 letras.').optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'debe ser un color con el formato #RRGGBB').optional(),
  })
  .strict();

const puesto = z
  .object({
    id,
    colocacion: id,
    usuarioId: z.number().int().min(1).nullable(),
    etiqueta: nombre,
  })
  .strict();

const area = z
  .object({
    id,
    nombre,
    rect: z
      .object({
        x: coordenada,
        y: coordenada,
        w: z.number().int().min(0).max(LIMITES_MAPA.ancho),
        h: z.number().int().min(0).max(LIMITES_MAPA.alto),
      })
      .strict(),
    duenos: z.array(z.number().int().min(1)).max(LIMITES_ESQUEMA.duenosPorArea, `máximo ${LIMITES_ESQUEMA.duenosPorArea} personas por área`),
  })
  .strict();

const llegada = z.object({ x: coordenada, y: coordenada }).strict();

const portal = z
  .object({
    id,
    x: coordenada,
    y: coordenada,
    destinoSala: id,
    destinoX: coordenada,
    destinoY: coordenada,
    etiqueta: nombre,
  })
  .strict();

const sala = z
  .object({
    id,
    nombre,
    ancho: z.number().int().min(LIMITES_ESQUEMA.ladoMinimo).max(LIMITES_MAPA.ancho),
    alto: z.number().int().min(LIMITES_ESQUEMA.ladoMinimo).max(LIMITES_MAPA.alto),
    colocaciones: z.array(colocacion).max(LIMITES_MAPA.colocaciones, `máximo ${LIMITES_MAPA.colocaciones} objetos por sala`),
    zonas: z.array(zona).max(LIMITES_ESQUEMA.zonasPorSala, `máximo ${LIMITES_ESQUEMA.zonasPorSala} zonas por sala`),
    puestos: z.array(puesto).max(LIMITES_ESQUEMA.puestosPorSala, `máximo ${LIMITES_ESQUEMA.puestosPorSala} puestos por sala`),
    llegadas: z.array(llegada).max(LIMITES_ESQUEMA.llegadasPorSala, `máximo ${LIMITES_ESQUEMA.llegadasPorSala} puntos de llegada por sala`),
    portales: z.array(portal).max(LIMITES_ESQUEMA.portalesPorSala, `máximo ${LIMITES_ESQUEMA.portalesPorSala} portales por sala`),
    areas: z.array(area).max(LIMITES_ESQUEMA.areasPorSala, `máximo ${LIMITES_ESQUEMA.areasPorSala} áreas por sala`).optional(),
    paleta: z.array(z.string().max(LIMITES_ESQUEMA.id)).min(1, 'debe tener al menos una entrada').max(LIMITES_ESQUEMA.paleta, `máximo ${LIMITES_ESQUEMA.paleta} entradas`),
    filas: z.array(z.string().regex(/^[0-9a-zA-Z]*$/, 'solo admite letras y números')).max(LIMITES_MAPA.alto),
  })
  .strict()
  .superRefine((s, ctx) => {
    const problema = (path: (string | number)[], message: string) => ctx.addIssue({ code: z.ZodIssueCode.custom, path, message });
    if (s.paleta[0] !== '') problema(['paleta', 0], 'la primera entrada debe estar vacía (sin piso)');
    if (s.filas.length !== s.alto) {
      problema(['filas'], `debe tener ${s.alto} filas, tiene ${s.filas.length}`);
      return;
    }
    for (let i = 0; i < s.filas.length; i++) {
      const fila = s.filas[i] as string;
      if (fila.length !== s.ancho) {
        problema(['filas', i], `la fila debe tener ${s.ancho} caracteres, tiene ${fila.length}`);
        continue;
      }
      for (let j = 0; j < fila.length; j++) {
        if (ALFABETO.indexOf(fila[j] as string) >= s.paleta.length) {
          problema(['filas', i], `el carácter «${fila[j]}» (columna ${j}) no existe en la paleta`);
          break;
        }
      }
    }
  });

const esquemaMapa = z
  .object({
    version: z.literal(1),
    nombre,
    salaInicial: z.string().max(LIMITES_ESQUEMA.id),
    salas: z.array(sala).max(LIMITES_MAPA.salas, `máximo ${LIMITES_MAPA.salas} salas`),
  })
  .strict();

const esquemaEntrada = z
  .object({
    revision: z.number().int().min(1).nullable(),
    mapa: esquemaMapa,
  })
  .strict();

/** Lo que manda una persona con un área: la versión del mapa que vio y los objetos que quiere en su área. */
const esquemaEdicionArea = z
  .object({
    base: z.number().int().min(0),
    colocaciones: z.array(colocacion).max(LIMITES_ESQUEMA.objetosPorEdicionDeArea, `máximo ${LIMITES_ESQUEMA.objetosPorEdicionDeArea} objetos por área`),
  })
  .strict();

export interface EdicionArea {
  base: number;
  colocaciones: z.infer<typeof esquemaEdicionArea>['colocaciones'];
}

export function parsearEdicionArea(datos: unknown): EdicionArea {
  const r = esquemaEdicionArea.safeParse(datos, { errorMap: mapaDeErrores });
  if (!r.success) throw new ErrorHttp(400, mensajeDeForma(r.error), 'area_invalida', { detalles: detallesDeForma(r.error) });
  return r.data;
}

export interface EntradaBorrador {
  revision: number | null;
  mapa: MapaGuardado;
}

// ---------- mensajes en español ----------

const TIPOS: Record<string, string> = {
  string: 'un texto',
  number: 'un número',
  integer: 'un número entero',
  float: 'un número entero',
  boolean: 'verdadero o falso',
  array: 'una lista',
  object: 'un objeto',
  null: 'null',
};

/**
 * Reemplaza los textos en inglés de zod. Solo los mensajes puestos como segundo argumento de una regla
 * (`.max(40, '...')`) ganan sobre este mapa: `invalid_type_error` y `required_error` no, por eso `revision` se trata aquí.
 */
const mapaDeErrores: z.ZodErrorMap = (issue, ctx) => {
  switch (issue.code) {
    case 'invalid_type':
      if (issue.path.length === 1 && issue.path[0] === 'revision') {
        return { message: issue.received === 'undefined' ? 'falta este dato (usa null si aún no hay borrador)' : 'debe ser un número entero o null' };
      }
      if (issue.received === 'undefined') return { message: 'falta este dato' };
      return { message: `debe ser ${TIPOS[issue.expected] ?? issue.expected}` };
    case 'invalid_literal':
      return { message: `debe valer ${JSON.stringify(issue.expected)}` };
    case 'unrecognized_keys':
      return { message: `trae campos que no existen: ${issue.keys.join(', ')}` };
    case 'invalid_enum_value':
      return { message: `debe ser uno de: ${issue.options.join(', ')}` };
    case 'too_small':
      if (issue.type === 'string') return { message: `debe tener al menos ${issue.minimum} caracteres` };
      if (issue.type === 'array') return { message: `debe tener al menos ${issue.minimum} elementos` };
      return { message: `debe ser ${issue.inclusive ? 'mayor o igual que' : 'mayor que'} ${issue.minimum}` };
    case 'too_big':
      if (issue.type === 'string') return { message: `máximo ${issue.maximum} caracteres` };
      if (issue.type === 'array') return { message: `máximo ${issue.maximum} elementos` };
      return { message: `debe ser ${issue.inclusive ? 'menor o igual que' : 'menor que'} ${issue.maximum}` };
    case 'invalid_string':
      return { message: 'tiene un formato que no se admite' };
    case 'not_finite':
      return { message: 'debe ser un número finito' };
    default:
      return { message: ctx.defaultError };
  }
};

function rutaLegible(path: ReadonlyArray<string | number>): string {
  let r = '';
  for (const p of path) r += typeof p === 'number' ? `[${p}]` : r ? `.${p}` : p;
  return r;
}

const MAX_DETALLES = 5;

/** Un mensaje corto con la ruta del primer campo que falla, por ejemplo: «Mapa no válido en salas[0].colocaciones[3].props.enlace: ...». */
function mensajeDeForma(error: z.ZodError): string {
  const primero = error.issues[0];
  if (!primero) return 'El envío no es válido.';
  const otros = error.issues.length - 1;
  const mas = otros > 0 ? ` (y ${otros} ${otros === 1 ? 'problema más' : 'problemas más'})` : '';
  const [raiz, ...resto] = primero.path;
  if (primero.path.length === 0) return `El envío no es válido: ${primero.message}${mas}.`;
  if (raiz === 'revision') return `Revisión no válida: ${primero.message}${mas}.`;
  const donde = rutaLegible(raiz === 'mapa' ? resto : primero.path);
  return `Mapa no válido${donde ? ` en ${donde}` : ''}: ${primero.message}${mas}.`;
}

function detallesDeForma(error: z.ZodError): { ruta: string; mensaje: string }[] {
  return error.issues.slice(0, MAX_DETALLES).map((i) => ({ ruta: rutaLegible(i.path[0] === 'mapa' ? i.path.slice(1) : i.path), mensaje: i.message }));
}

// ---------- uso ----------

/** Valida el cuerpo de «guardar borrador». Si la forma no sirve, responde 400 con un mensaje legible y los primeros detalles. */
export function parsearEntradaBorrador(datos: unknown): EntradaBorrador {
  if (typeof datos !== 'object' || datos === null || Array.isArray(datos)) {
    throw new ErrorHttp(400, 'Envía un objeto JSON con «revision» y «mapa».', 'mapa_invalido');
  }
  const r = esquemaEntrada.safeParse(datos, { errorMap: mapaDeErrores });
  if (!r.success) throw new ErrorHttp(400, mensajeDeForma(r.error), 'mapa_invalido', { detalles: detallesDeForma(r.error) });
  return r.data;
}

/** Lee un mapa guardado en la base. Si no sirve es un fallo nuestro (500), no de quien hizo la petición. */
export function leerMapaGuardado(texto: string, origen: string): MapaGuardado {
  let bruto: unknown;
  try {
    bruto = JSON.parse(texto);
  } catch {
    throw new Error(`El contenido de ${origen} no es JSON.`);
  }
  const r = esquemaMapa.safeParse(bruto, { errorMap: mapaDeErrores });
  if (!r.success) throw new Error(`El contenido de ${origen} no es un mapa válido. ${mensajeDeForma(r.error)}`);
  return r.data;
}
