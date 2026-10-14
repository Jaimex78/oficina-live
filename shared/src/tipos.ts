import type { AvatarSpec } from './personaje';
import type { Permiso, Rol } from './roles';

/** Lo que la interfaz puede saber de una persona. Nunca incluye hash, intentos ni tokens. */
export interface UsuarioPublico {
  id: number;
  usuario: string;
  nombre: string;
  cargo: string;
  correo: string;
  rol: Rol;
  permisos: Permiso[];
  debeCambiarClave: boolean;
  activo: boolean;
  creadoEn: string;
  ultimoIngreso: string | null;
  /** Cómo te llaman en la oficina. Vacío: se usa tu primer nombre. */
  apodo: string;
  /** Tu personaje. Es `null` hasta que lo creas en el primer ingreso a la oficina. */
  personaje: AvatarSpec | null;
  /** Paquetes del catálogo que la administración le dio a esta cuenta (ver `PAQUETES_ACCESO`). */
  acceso: string[];
  /** false hasta que la persona confirma su personaje la primera vez que entra (el creador le sale solo). */
  personajeListo: boolean;
  /** Versión de la foto de perfil. 0 = sin foto. Se pide en `/api/fotos/:id?v=<versión>`. */
  foto: number;
}

/** Lo que la administración ve de cada cuenta. */
export interface UsuarioAdmin extends UsuarioPublico {
  /** Hasta cuándo está bloqueada por intentos fallidos (si lo está ahora). */
  bloqueadaHasta: string | null;
  /** true si la persona todavía no creó su contraseña con el enlace de activación. */
  pendiente: boolean;
  /** Cuándo vence el enlace de activación vigente (solo en cuentas pendientes). */
  enlaceVence: string | null;
}

/** Enlace de activación recién generado. Se muestra una sola vez: el servidor solo guarda su huella. */
export interface EnlaceActivacion {
  token: string;
  url: string;
  vence: string;
}

/** Una línea de la creación en lote. */
export interface ResultadoLote {
  linea: number;
  nombre: string;
  correo: string;
  rol: string;
  ok: boolean;
  error?: string;
  usuario?: UsuarioAdmin;
  enlace?: EnlaceActivacion;
}

/** Lo que cada persona puede cambiar de sí misma en la oficina. */
export interface PerfilEntrada {
  apodo?: string;
  personaje?: AvatarSpec;
}

export interface RespuestaSesion {
  token: string;
  usuario: UsuarioPublico;
}

/** Lo único que se publica sin sesión: sirve para dibujar el ingreso con la marca elegida. */
export interface ConfigPublica {
  nombre: string;
  colorPrimario: string;
  colorSecundario: string;
  solicitudesActivas: boolean;
  /** Largo mínimo de la contraseña (para mostrar las reglas al crearla). */
  claveMin: number;
  version: string;
}

export interface SolicitudAcceso {
  id: number;
  nombre: string;
  correo: string;
  cargo: string;
  mensaje: string;
  ip: string;
  estado: 'pendiente' | 'atendida' | 'rechazada';
  creadaEn: string;
  atendidaPor: string | null;
  atendidaEn: string | null;
}

export interface RegistroActividad {
  id: number;
  fecha: string;
  usuarioId: number | null;
  usuario: string;
  accion: string;
  objeto: string;
  detalle: string;
  ip: string;
}

export interface PaginaActividad {
  registros: RegistroActividad[];
  total: number;
  pagina: number;
  porPagina: number;
}

export type TipoAjuste = 'entero' | 'booleano' | 'texto' | 'color' | 'hora' | 'seleccion' | 'dias';

export interface AjusteInfo {
  clave: string;
  grupo: string;
  tipo: TipoAjuste;
  etiqueta: string;
  ayuda?: string;
  valor: unknown;
  defecto: unknown;
  min?: number;
  max?: number;
  maxLargo?: number;
  opciones?: { valor: string; etiqueta: string }[];
}

export interface GrupoAjustes {
  id: string;
  titulo: string;
  descripcion?: string;
  ajustes: AjusteInfo[];
}

export interface InfoRespaldo {
  nombre: string;
  bytes: number;
  creadoEn: string;
  motivo: string;
}

export interface InfoSistema {
  version: string;
  node: string;
  iniciadoEn: string;
  segundosActivo: number;
  baseBytes: number;
  usuarios: number;
  usuariosActivos: number;
  solicitudesPendientes: number;
  ultimoRespaldo: InfoRespaldo | null;
  carpetaDatos: string;
  modoDemo: boolean;
}

/** Foto de perfil: reglas que comparten la interfaz y el servidor. */
export const FOTO_PERFIL = {
  /** Lado de la foto que se guarda, en píxeles. */
  lado: 256,
  /** Lo más que puede pesar lo que se sube. */
  maxBytes: 3 * 1024 * 1024,
  tipos: ['image/jpeg', 'image/png', 'image/webp'],
} as const;
