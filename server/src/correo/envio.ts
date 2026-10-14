/**
 * Envío de correo. Hoy no envía nada: la interfaz queda lista para conectar un servidor SMTP cuando la plataforma
 * pase a un servidor. La contraseña SMTP nunca se guarda en la base: vendrá de la variable de entorno OL_SMTP_CLAVE.
 */
export interface MensajeCorreo {
  para: string;
  asunto: string;
  texto: string;
}

export interface EnviadorCorreo {
  /** false mientras no haya un servidor de correo configurado y una implementación real. */
  readonly disponible: boolean;
  enviar(mensaje: MensajeCorreo): Promise<void>;
}

/** Implementación vacía: no está disponible y, si alguien la llama, falla en vez de fingir que envió. */
export class EnviadorVacio implements EnviadorCorreo {
  readonly disponible = false;
  async enviar(_mensaje: MensajeCorreo): Promise<void> {
    throw new Error('El envío de correo no está configurado en este servidor.');
  }
}

/** Texto del correo de activación (listo para cuando exista un enviador real). */
export function mensajeActivacion(nombre: string, url: string, vence: Date, plataforma: string): MensajeCorreo & { para: '' } {
  const fecha = vence.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
  return {
    para: '',
    asunto: `Activa tu cuenta de ${plataforma}`,
    texto: `Hola ${nombre.split(' ')[0]},\n\nCrea tu contraseña para entrar a ${plataforma}:\n${url}\n\nEl enlace sirve una sola vez y vence el ${fecha}.\n`,
  };
}
