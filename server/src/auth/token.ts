import { SignJWT, jwtVerify } from 'jose';
import type { ServicioAjustes } from '../ajustes/servicio';

/** Sesión por token firmado en Authorization: Bearer. Sin cookies: funciona igual detrás de cualquier proxy. */
export class Tokens {
  private readonly clave: Uint8Array;

  constructor(
    secreto: string,
    private readonly ajustes: ServicioAjustes,
  ) {
    this.clave = new TextEncoder().encode(secreto);
  }

  async emitir(u: { id: number; versionToken: number }): Promise<string> {
    const horas = this.ajustes.obtener<number>('sesion_horas');
    return new SignJWT({ tv: u.versionToken })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(String(u.id))
      .setIssuedAt()
      .setExpirationTime(`${horas}h`)
      .sign(this.clave);
  }

  async verificar(token: string): Promise<{ id: number; tv: number } | null> {
    try {
      const { payload } = await jwtVerify(token, this.clave, { algorithms: ['HS256'] });
      const id = Number(payload.sub);
      const tv = Number(payload['tv']);
      if (!Number.isInteger(id) || !Number.isInteger(tv)) return null;
      return { id, tv };
    } catch {
      return null;
    }
  }
}
