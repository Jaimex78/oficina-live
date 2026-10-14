import type { Request } from 'express';

/**
 * IP de quien pide. Solo se confía en CF-Connecting-IP / X-Forwarded-For si el servidor está detrás de un proxy
 * propio (OL_PROXY=1): en cualquier otro caso esas cabeceras las puede escribir quien hace la petición.
 */
export function ipReal(req: Request, confiarProxy: boolean): string {
  if (confiarProxy) {
    const cf = req.headers['cf-connecting-ip'];
    if (typeof cf === 'string' && cf.trim()) return cf.trim();
    const xff = req.headers['x-forwarded-for'];
    if (typeof xff === 'string' && xff.trim()) return xff.split(',')[0]?.trim() ?? '';
  }
  return req.socket.remoteAddress ?? '';
}
