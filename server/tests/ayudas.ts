import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { Express } from 'express';
import request from 'supertest';
import type { Rol } from '@ol/shared';
import { crearApp } from '../src/app';
import { cargarConfig } from '../src/config';
import { crearContexto, type Contexto } from '../src/contexto';
import { PLANTILLA } from './globalSetup';

export const CLAVE = 'ClaveDePrueba1';

export interface Entorno {
  ctx: Contexto;
  app: Express;
  dir: string;
  cerrar(): Promise<void>;
}

/** Un servidor completo sobre una base nueva en una carpeta temporal. `demo` solo cambia el modo de la configuración: las cuentas se siembran con `sembrarDemo`. */
export async function crearEntorno(opciones: { demo?: boolean; plantilla?: 'vacia' | 'naos' } = {}): Promise<Entorno> {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ol-prueba-'));
  fs.copyFileSync(PLANTILLA, path.join(dir, 'interna.sqlite'));
  const config = cargarConfig({ dataDir: dir, costoHash: 2 ** 10, secreto: 'secreto-de-prueba-'.repeat(3), webDist: null, demo: opciones.demo ?? false, plantillaInicial: opciones.plantilla ?? 'naos' });
  const ctx = await crearContexto(config, { migrar: false });
  const app = crearApp(ctx);
  return {
    ctx,
    app,
    dir,
    async cerrar() {
      await ctx.cerrar();
      fs.rmSync(dir, { recursive: true, force: true });
    },
  };
}

/** Cliente HTTP que ya manda la cabecera propia y, si hay, el token. */
export function cliente(app: Express, token?: string) {
  const con = (t: request.Test): request.Test => {
    t.set('X-OL', '1');
    if (token) t.set('Authorization', `Bearer ${token}`);
    return t;
  };
  return {
    get: (url: string) => con(request(app).get(url)),
    post: (url: string) => con(request(app).post(url)),
    put: (url: string) => con(request(app).put(url)),
    patch: (url: string) => con(request(app).patch(url)),
    delete: (url: string) => con(request(app).delete(url)),
  };
}

export async function crearCuenta(
  ctx: Contexto,
  usuario: string,
  rol: Rol = 'usuario',
  extra: { debeCambiar?: boolean; correo?: string; clave?: string; nombre?: string } = {},
) {
  const { usuario: u } = await ctx.auth.crearUsuario({
    usuario,
    nombre: extra.nombre ?? `Persona ${usuario}`,
    rol,
    clave: extra.clave ?? CLAVE,
    debeCambiar: extra.debeCambiar ?? false,
    ...(extra.correo ? { correo: extra.correo } : {}),
  });
  return u;
}

export async function ingresar(app: Express, usuario: string, clave = CLAVE): Promise<string> {
  const r = await cliente(app).post('/api/auth/login').send({ usuario, clave });
  if (r.status !== 200) throw new Error(`No se pudo ingresar como ${usuario}: ${r.status} ${JSON.stringify(r.body)}`);
  return r.body.token as string;
}

/** Crea la cuenta, ingresa y devuelve un cliente con su token. */
export async function sesionComo(env: Entorno, usuario: string, rol: Rol) {
  const cuenta = await crearCuenta(env.ctx, usuario, rol);
  const token = await ingresar(env.app, usuario);
  return { cuenta, token, api: cliente(env.app, token) };
}
