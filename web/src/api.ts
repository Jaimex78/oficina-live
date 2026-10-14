/** Cliente de la API. La sesión es un token en la pestaña (sessionStorage), nunca una cookie. */

const CLAVE_TOKEN = 'ol_token';

export const token = {
  leer(): string | null {
    try {
      return sessionStorage.getItem(CLAVE_TOKEN);
    } catch {
      return null;
    }
  },
  guardar(valor: string): void {
    try {
      sessionStorage.setItem(CLAVE_TOKEN, valor);
    } catch {
      /* sin almacenamiento: la sesión dura hasta recargar */
    }
  },
  borrar(): void {
    try {
      sessionStorage.removeItem(CLAVE_TOKEN);
    } catch {
      /* nada que borrar */
    }
  },
};

export class ErrorApi extends Error {
  readonly estado: number;
  readonly codigo: string | undefined;
  constructor(estado: number, mensaje: string, codigo?: string) {
    super(mensaje);
    this.estado = estado;
    this.codigo = codigo;
  }
}

export const EVENTO_SESION_TERMINADA = 'ol:sesion-terminada';

interface Opciones {
  metodo?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  cuerpo?: unknown;
  consulta?: Record<string, string | number | undefined | null>;
  /** Para el ingreso: un 401 es «datos incorrectos», no «sesión vencida». */
  sinCierreDeSesion?: boolean;
  /** Un archivo como cuerpo tal cual (por ejemplo, la foto de perfil). Su tipo viaja como Content-Type. */
  binario?: Blob;
}

function url(ruta: string, consulta?: Opciones['consulta']): string {
  if (!consulta) return `/api${ruta}`;
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(consulta)) if (v !== undefined && v !== null && v !== '') p.set(k, String(v));
  const s = p.toString();
  return `/api${ruta}${s ? `?${s}` : ''}`;
}

async function pedir(ruta: string, o: Opciones): Promise<Response> {
  const cabeceras: Record<string, string> = { 'X-OL': '1' };
  const t = token.leer();
  if (t) cabeceras['Authorization'] = `Bearer ${t}`;
  if (o.binario) cabeceras['Content-Type'] = o.binario.type || 'application/octet-stream';
  else if (o.cuerpo !== undefined) cabeceras['Content-Type'] = 'application/json';
  let res: Response;
  try {
    res = await fetch(url(ruta, o.consulta), {
      method: o.metodo ?? 'GET',
      headers: cabeceras,
      ...(o.binario ? { body: o.binario } : o.cuerpo !== undefined ? { body: JSON.stringify(o.cuerpo) } : {}),
    });
  } catch {
    throw new ErrorApi(0, 'No se pudo conectar con el servidor. Revisa tu conexión e intenta de nuevo.');
  }
  if (res.status === 401 && t && !o.sinCierreDeSesion) {
    token.borrar();
    window.dispatchEvent(new Event(EVENTO_SESION_TERMINADA));
  }
  return res;
}

async function aError(res: Response): Promise<ErrorApi> {
  let mensaje = `Algo salió mal (${res.status}). Intenta de nuevo.`;
  let codigo: string | undefined;
  try {
    const datos = (await res.json()) as { error?: string; codigo?: string };
    if (datos.error) mensaje = datos.error;
    codigo = datos.codigo;
  } catch {
    /* respuesta sin JSON */
  }
  return new ErrorApi(res.status, mensaje, codigo);
}

export async function api<T>(ruta: string, opciones: Opciones = {}): Promise<T> {
  const res = await pedir(ruta, opciones);
  if (!res.ok) throw await aError(res);
  return (await res.json()) as T;
}

/**
 * Descargas con fetch y blob, nunca con un enlace: sin cookies, una navegación no manda Authorization
 * y el navegador saldría de la plataforma mostrando el error (estándar de plataformas).
 */
export async function descargar(ruta: string, nombreSugerido: string, consulta?: Opciones['consulta']): Promise<void> {
  const res = await pedir(ruta, { ...(consulta ? { consulta } : {}) });
  if (!res.ok) throw await aError(res);
  const blob = await res.blob();
  const a = document.createElement('a');
  const enlace = URL.createObjectURL(blob);
  a.href = enlace;
  a.download = nombreSugerido;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(enlace), 10_000);
}

/** Sube un archivo como cuerpo de la petición y devuelve la respuesta en JSON. */
export async function subirArchivo<T>(ruta: string, archivo: Blob, metodo: 'PUT' | 'POST' = 'PUT'): Promise<T> {
  const res = await pedir(ruta, { metodo, binario: archivo });
  if (!res.ok) throw await aError(res);
  return (await res.json()) as T;
}

/** Un archivo (por ejemplo, una imagen) con la sesión puesta. Un <img> no manda Authorization, por eso se pide con fetch. */
export async function obtenerBlob(ruta: string): Promise<Blob> {
  const res = await pedir(ruta, {});
  if (!res.ok) throw await aError(res);
  return await res.blob();
}
