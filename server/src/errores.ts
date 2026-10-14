import type { NextFunction, Request, Response } from 'express';
import { ZodError, type ZodTypeAny, type z } from 'zod';

/** Error con estado HTTP y un mensaje que la persona puede leer tal cual. */
export class ErrorHttp extends Error {
  readonly estado: number;
  readonly codigo: string | undefined;
  /** Datos que viajan en el cuerpo de la respuesta junto al mensaje (por ejemplo, la revisión actual de un borrador). */
  readonly extra: Record<string, unknown> | undefined;

  constructor(estado: number, mensaje: string, codigo?: string, extra?: Record<string, unknown>) {
    super(mensaje);
    this.estado = estado;
    this.codigo = codigo;
    this.extra = extra;
  }
}

/** Valida con zod y devuelve el primer problema como mensaje legible. */
export function parsear<S extends ZodTypeAny>(esquema: S, datos: unknown): z.infer<S> {
  const r = esquema.safeParse(datos);
  if (r.success) return r.data;
  throw new ErrorHttp(422, r.error.issues[0]?.message ?? 'Revisa los datos enviados.');
}

export function manejadorErrores(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ErrorHttp) {
    res.status(err.estado).json({ ...err.extra, error: err.message, ...(err.codigo ? { codigo: err.codigo } : {}) });
    return;
  }
  if (err instanceof ZodError) {
    res.status(422).json({ error: err.issues[0]?.message ?? 'Revisa los datos enviados.' });
    return;
  }
  const raro = err as { type?: string; status?: number };
  if (raro?.type === 'entity.too.large') {
    res.status(413).json({ error: 'El envío es demasiado grande.' });
    return;
  }
  if (raro?.type === 'entity.parse.failed') {
    res.status(400).json({ error: 'El envío no tiene un formato válido.' });
    return;
  }
  console.error('[error]', err);
  res.status(500).json({ error: 'Ocurrió un error interno. Intenta de nuevo.' });
}
