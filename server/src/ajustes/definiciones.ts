import type { TipoAjuste } from '@ol/shared';

/** Cada ajuste que la administración puede cambiar desde la interfaz. Los valores por defecto son seguros. */
export interface DefAjuste {
  clave: string;
  grupo: string;
  tipo: TipoAjuste;
  defecto: string | number | boolean;
  etiqueta: string;
  ayuda?: string;
  min?: number;
  max?: number;
  maxLargo?: number;
  opciones?: { valor: string; etiqueta: string }[];
  /** El texto puede quedar vacío. */
  opcional?: boolean;
  /** Se puede mostrar sin sesión (ingreso). */
  publico?: boolean;
}

export const GRUPOS: { id: string; titulo: string; descripcion: string }[] = [
  { id: 'seguridad', titulo: 'Seguridad', descripcion: 'Sesiones, intentos de ingreso, contraseñas y solicitudes de acceso.' },
  { id: 'correo', titulo: 'Correo del servidor', descripcion: 'Para enviar enlaces de activación por correo. Todavía no envía nada: se prepara aquí para cuando la plataforma esté en un servidor.' },
  { id: 'apariencia', titulo: 'Apariencia', descripcion: 'Nombre y colores de la plataforma.' },
  { id: 'oficina', titulo: 'Oficina', descripcion: 'Horario, ausencia automática y cercanía entre personas.' },
  { id: 'chat', titulo: 'Chat y Teams', descripcion: 'Chat de cercanía y botones para hablar por Teams.' },
  { id: 'respaldos', titulo: 'Respaldos', descripcion: 'Copias automáticas de la base de datos.' },
];

export const DEFINICIONES: DefAjuste[] = [
  // Seguridad
  { clave: 'sesion_horas', grupo: 'seguridad', tipo: 'entero', defecto: 8, min: 1, max: 72, etiqueta: 'Duración de la sesión (horas)', ayuda: 'Pasado ese tiempo hay que volver a ingresar.' },
  { clave: 'intentos_max', grupo: 'seguridad', tipo: 'entero', defecto: 5, min: 3, max: 20, etiqueta: 'Intentos fallidos antes de bloquear la cuenta' },
  { clave: 'bloqueo_min', grupo: 'seguridad', tipo: 'entero', defecto: 5, min: 1, max: 120, etiqueta: 'Minutos de bloqueo de la cuenta' },
  { clave: 'clave_min', grupo: 'seguridad', tipo: 'entero', defecto: 10, min: 8, max: 64, etiqueta: 'Largo mínimo de la contraseña', ayuda: 'Siempre pide mayúsculas, minúsculas y un número.' },
  { clave: 'ip_intentos_max', grupo: 'seguridad', tipo: 'entero', defecto: 20, min: 5, max: 200, etiqueta: 'Intentos fallidos por conexión', ayuda: 'Frena a quien prueba muchas cuentas desde una misma conexión.' },
  { clave: 'ip_ventana_min', grupo: 'seguridad', tipo: 'entero', defecto: 10, min: 1, max: 120, etiqueta: 'Minutos que cuentan para el límite por conexión' },
  { clave: 'solicitudes_activas', grupo: 'seguridad', tipo: 'booleano', defecto: true, etiqueta: 'Permitir solicitudes de acceso desde el ingreso', publico: true },
  { clave: 'solicitudes_por_ip_hora', grupo: 'seguridad', tipo: 'entero', defecto: 5, min: 1, max: 50, etiqueta: 'Solicitudes por conexión y por hora' },

  { clave: 'dominios_permitidos', grupo: 'seguridad', tipo: 'texto', defecto: '', opcional: true, maxLargo: 300, etiqueta: 'Dominios de correo permitidos', ayuda: 'Separados por coma. Si lo dejas vacío, se permite cualquier dominio. Para restringir los perfiles a tu organización, escribe sus dominios, por ejemplo empresa.com.' },
  { clave: 'activacion_dias', grupo: 'seguridad', tipo: 'entero', defecto: 7, min: 1, max: 30, etiqueta: 'Días de vigencia del enlace de activación' },

  // Correo del servidor (opcional; todavía no se usa para enviar)
  { clave: 'smtp_host', grupo: 'correo', tipo: 'texto', defecto: '', opcional: true, maxLargo: 120, etiqueta: 'Servidor SMTP', ayuda: 'Por ejemplo smtp.office365.com. Déjalo vacío mientras no uses correo.' },
  { clave: 'smtp_puerto', grupo: 'correo', tipo: 'entero', defecto: 587, min: 1, max: 65535, etiqueta: 'Puerto SMTP' },
  { clave: 'smtp_seguro', grupo: 'correo', tipo: 'booleano', defecto: false, etiqueta: 'Conexión segura directa (TLS)', ayuda: 'Apagado usa STARTTLS, que es lo habitual en el puerto 587.' },
  { clave: 'smtp_usuario', grupo: 'correo', tipo: 'texto', defecto: '', opcional: true, maxLargo: 120, etiqueta: 'Usuario SMTP', ayuda: 'La contraseña no se guarda aquí: irá en una variable de entorno del servidor (OL_SMTP_CLAVE).' },
  { clave: 'smtp_remitente', grupo: 'correo', tipo: 'texto', defecto: '', opcional: true, maxLargo: 120, etiqueta: 'Correo remitente', ayuda: 'Desde qué dirección salen los enlaces, por ejemplo oficina-live@empresa.com.' },

  // Apariencia
  { clave: 'nombre_plataforma', grupo: 'apariencia', tipo: 'texto', defecto: 'Oficina Live', maxLargo: 40, etiqueta: 'Nombre de la plataforma', publico: true },
  { clave: 'color_primario', grupo: 'apariencia', tipo: 'color', defecto: '#EF3B3A', etiqueta: 'Color principal', ayuda: 'Botones, enlaces y luces del ingreso. Por defecto, el rojo coral.', publico: true },
  { clave: 'color_secundario', grupo: 'apariencia', tipo: 'color', defecto: '#1C1C1E', etiqueta: 'Color secundario', ayuda: 'Fondos oscuros y textos fuertes.', publico: true },

  // Oficina
  { clave: 'horario_activo', grupo: 'oficina', tipo: 'booleano', defecto: false, etiqueta: 'Usar horario de oficina', ayuda: 'Fuera del horario la oficina aparece cerrada y no avisa cercanías.' },
  { clave: 'horario_dias', grupo: 'oficina', tipo: 'dias', defecto: '1,2,3,4,5', etiqueta: 'Días de oficina' },
  { clave: 'horario_desde', grupo: 'oficina', tipo: 'hora', defecto: '08:00', etiqueta: 'Abre a las' },
  { clave: 'horario_hasta', grupo: 'oficina', tipo: 'hora', defecto: '18:00', etiqueta: 'Cierra a las' },
  { clave: 'zona_horaria', grupo: 'oficina', tipo: 'texto', defecto: 'America/Bogota', maxLargo: 60, etiqueta: 'Zona horaria' },
  { clave: 'ausencia_min', grupo: 'oficina', tipo: 'entero', defecto: 10, min: 1, max: 120, etiqueta: 'Minutos sin actividad para pasar a ausente' },
  { clave: 'distancia_cercania', grupo: 'oficina', tipo: 'entero', defecto: 3, min: 1, max: 10, etiqueta: 'Distancia de cercanía (casillas)', ayuda: 'A esa distancia aparece el botón para hablar.' },
  { clave: 'invisibles_permitido', grupo: 'oficina', tipo: 'booleano', defecto: true, etiqueta: 'Permitir que cada persona se vea invisible' },
  { clave: 'maximo_personas', grupo: 'oficina', tipo: 'entero', defecto: 50, min: 5, max: 500, etiqueta: 'Personas a la vez en la oficina' },

  // Chat y Teams
  { clave: 'chat_activo', grupo: 'chat', tipo: 'booleano', defecto: true, etiqueta: 'Activar el chat de cercanía', ayuda: 'No se guarda: vive en memoria mientras dura la conversación.' },
  { clave: 'chat_max_caracteres', grupo: 'chat', tipo: 'entero', defecto: 280, min: 20, max: 1000, etiqueta: 'Largo máximo de un mensaje' },
  { clave: 'teams_activo', grupo: 'chat', tipo: 'booleano', defecto: true, etiqueta: 'Mostrar los botones para hablar por Teams' },

  // Respaldos
  { clave: 'respaldo_auto_horas', grupo: 'respaldos', tipo: 'entero', defecto: 24, min: 0, max: 720, etiqueta: 'Respaldo automático cada (horas)', ayuda: '0 apaga el respaldo automático.' },
  { clave: 'respaldos_max', grupo: 'respaldos', tipo: 'entero', defecto: 14, min: 1, max: 60, etiqueta: 'Respaldos que se conservan', ayuda: 'Los más viejos se borran. Los previos a una migración se conservan siempre.' },
];

export const POR_CLAVE: ReadonlyMap<string, DefAjuste> = new Map(DEFINICIONES.map((d) => [d.clave, d]));

const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;
const DOMINIO = /^(?=.{3,100}$)[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/;
const COLOR = /^#[0-9a-fA-F]{6}$/;

export class ErrorAjuste extends Error {}

/** Valida y deja el valor en su forma canónica. Lanza ErrorAjuste con un mensaje legible. */
export function normalizar(def: DefAjuste, valor: unknown): string | number | boolean {
  const nombre = `«${def.etiqueta}»`;
  switch (def.tipo) {
    case 'entero': {
      const n = typeof valor === 'string' && valor.trim() !== '' ? Number(valor) : valor;
      if (typeof n !== 'number' || !Number.isInteger(n)) throw new ErrorAjuste(`${nombre} debe ser un número entero.`);
      if ((def.min !== undefined && n < def.min) || (def.max !== undefined && n > def.max)) {
        throw new ErrorAjuste(`${nombre} debe estar entre ${def.min} y ${def.max}.`);
      }
      return n;
    }
    case 'booleano': {
      if (typeof valor !== 'boolean') throw new ErrorAjuste(`${nombre} debe ser sí o no.`);
      return valor;
    }
    case 'texto': {
      if (typeof valor !== 'string') throw new ErrorAjuste(`${nombre} debe ser un texto.`);
      const t = valor.trim();
      if (!t && !def.opcional) throw new ErrorAjuste(`${nombre} no puede quedar vacío.`);
      if (def.maxLargo !== undefined && t.length > def.maxLargo) throw new ErrorAjuste(`${nombre} admite hasta ${def.maxLargo} caracteres.`);
      if (def.clave === 'dominios_permitidos') {
        const dominios = [...new Set(t.split(',').map((x) => x.trim().toLowerCase().replace(/^@/, '')).filter(Boolean))];
        if (dominios.some((d) => !DOMINIO.test(d))) throw new ErrorAjuste(`${nombre} solo admite dominios como empresa.com, separados por coma, o vacío para permitir cualquiera.`);
        return dominios.join(',');
      }
      if (def.clave === 'zona_horaria') {
        try {
          new Intl.DateTimeFormat('es-CO', { timeZone: t });
        } catch {
          throw new ErrorAjuste(`${nombre} no es una zona horaria válida (por ejemplo America/Bogota).`);
        }
      }
      return t;
    }
    case 'color': {
      if (typeof valor !== 'string' || !COLOR.test(valor.trim())) throw new ErrorAjuste(`${nombre} debe ser un color como #EF3B3A.`);
      return valor.trim().toUpperCase();
    }
    case 'hora': {
      if (typeof valor !== 'string' || !HORA.test(valor.trim())) throw new ErrorAjuste(`${nombre} debe tener el formato HH:MM.`);
      return valor.trim();
    }
    case 'dias': {
      if (typeof valor !== 'string') throw new ErrorAjuste(`${nombre} no es válido.`);
      const dias = valor
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean)
        .map(Number);
      if (dias.some((d) => !Number.isInteger(d) || d < 1 || d > 7)) throw new ErrorAjuste(`${nombre} debe usar números del 1 (lunes) al 7 (domingo).`);
      return [...new Set(dias)].sort((a, b) => a - b).join(',');
    }
    case 'seleccion': {
      if (typeof valor !== 'string' || !def.opciones?.some((o) => o.valor === valor)) throw new ErrorAjuste(`${nombre} tiene una opción que no existe.`);
      return valor;
    }
  }
}
