import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { CLAVE, cliente, crearCuenta, crearEntorno, ingresar, type Entorno } from './ayudas';

let env: Entorno;
beforeAll(async () => {
  env = await crearEntorno();
});
afterAll(async () => {
  await env.cerrar();
});

describe('ingreso', () => {
  it('acepta credenciales correctas y no devuelve datos internos', async () => {
    await crearCuenta(env.ctx, 'ana', 'usuario');
    const r = await cliente(env.app).post('/api/auth/login').send({ usuario: 'Ana ', clave: CLAVE });
    expect(r.status).toBe(200);
    expect(r.body.token).toEqual(expect.any(String));
    expect(r.body.usuario).toMatchObject({ usuario: 'ana', rol: 'usuario', permisos: ['caminar'], debeCambiarClave: false });
    expect(JSON.stringify(r.body)).not.toMatch(/claveHash|intentos|versionToken/);
  });

  it('responde igual si la cuenta no existe o la clave falla (no delata cuentas)', async () => {
    const mala = await cliente(env.app).post('/api/auth/login').send({ usuario: 'ana', clave: 'otraClave1' });
    const inexistente = await cliente(env.app).post('/api/auth/login').send({ usuario: 'nadie', clave: 'otraClave1' });
    expect(mala.status).toBe(401);
    expect(inexistente.status).toBe(401);
    expect(mala.body.error).toBe(inexistente.body.error);
  });

  it('exige la cabecera propia en las escrituras', async () => {
    const r = await (await import('supertest')).default(env.app).post('/api/auth/login').send({ usuario: 'ana', clave: CLAVE });
    expect(r.status).toBe(403);
  });

  it('valida los campos con mensajes legibles', async () => {
    const r = await cliente(env.app).post('/api/auth/login').send({ usuario: '', clave: '' });
    expect(r.status).toBe(422);
    expect(r.body.error).toBe('Escribe tu usuario.');
  });

  it('no deja ingresar a una cuenta desactivada', async () => {
    await crearCuenta(env.ctx, 'inactivo');
    await env.ctx.prisma.usuario.update({ where: { usuario: 'inactivo' }, data: { activo: false } });
    const r = await cliente(env.app).post('/api/auth/login').send({ usuario: 'inactivo', clave: CLAVE });
    expect(r.status).toBe(401);
  });
});

describe('bloqueos', () => {
  it('bloquea la cuenta tras los intentos permitidos, aun con la clave correcta', async () => {
    await env.ctx.ajustes.guardar({ intentos_max: 3, bloqueo_min: 5 });
    await crearCuenta(env.ctx, 'bloqueable');
    for (let i = 0; i < 3; i++) {
      const r = await cliente(env.app).post('/api/auth/login').send({ usuario: 'bloqueable', clave: 'incorrecta1A' });
      expect(r.status).toBe(401);
    }
    const r = await cliente(env.app).post('/api/auth/login').send({ usuario: 'bloqueable', clave: CLAVE });
    expect(r.status).toBe(429);
    expect(r.body.error).toMatch(/bloqueada/);
    const acciones = (await env.ctx.prisma.actividad.findMany({ where: { usuario: 'bloqueable' } })).map((a) => a.accion);
    expect(acciones).toContain('bloqueo_cuenta');
  });

  it('frena a una conexión que prueba muchas cuentas', async () => {
    const otro = await crearEntorno();
    try {
      await otro.ctx.ajustes.guardar({ ip_intentos_max: 5 });
      for (let i = 0; i < 5; i++) {
        await cliente(otro.app).post('/api/auth/login').send({ usuario: `fantasma${i}`, clave: 'incorrecta1A' });
      }
      const r = await cliente(otro.app).post('/api/auth/login').send({ usuario: 'fantasma9', clave: 'incorrecta1A' });
      expect(r.status).toBe(429);
      expect(r.body.error).toMatch(/conexión/);
    } finally {
      await otro.cerrar();
    }
  });
});

describe('contraseña temporal y sesiones', () => {
  it('obliga a cambiarla antes de usar la plataforma y cierra las sesiones anteriores', async () => {
    await crearCuenta(env.ctx, 'nueva', 'usuario', { debeCambiar: true });
    const token = await ingresar(env.app, 'nueva');
    const api = cliente(env.app, token);

    expect((await api.get('/api/auth/yo')).body.usuario.debeCambiarClave).toBe(true);
    const bloqueada = await api.get('/api/cuenta');
    expect(bloqueada.status).toBe(403);
    expect(bloqueada.body.codigo).toBe('cambiar_clave');

    expect((await api.post('/api/auth/cambiar-clave').send({ actual: CLAVE, nueva: 'corta1A' })).status).toBe(422);
    expect((await api.post('/api/auth/cambiar-clave').send({ actual: CLAVE, nueva: 'todominusculas123' })).status).toBe(422);
    expect((await api.post('/api/auth/cambiar-clave').send({ actual: CLAVE, nueva: 'SinNumeroAquiTampoco' })).status).toBe(422);
    expect((await api.post('/api/auth/cambiar-clave').send({ actual: 'equivocada1A', nueva: 'NuevaClave2026x' })).status).toBe(401);
    expect((await api.post('/api/auth/cambiar-clave').send({ actual: CLAVE, nueva: CLAVE })).status).toBe(422);

    const ok = await api.post('/api/auth/cambiar-clave').send({ actual: CLAVE, nueva: 'NuevaClave2026x' });
    expect(ok.status).toBe(200);
    expect(ok.body.usuario.debeCambiarClave).toBe(false);

    // el token viejo ya no sirve; el nuevo sí
    expect((await api.get('/api/auth/yo')).status).toBe(401);
    expect((await cliente(env.app, ok.body.token).get('/api/cuenta')).status).toBe(200);
    // y la clave anterior dejó de valer
    expect((await cliente(env.app).post('/api/auth/login').send({ usuario: 'nueva', clave: CLAVE })).status).toBe(401);
    expect((await cliente(env.app).post('/api/auth/login').send({ usuario: 'nueva', clave: 'NuevaClave2026x' })).status).toBe(200);
  });

  it('rechaza tokens ausentes, alterados o de otra firma', async () => {
    expect((await cliente(env.app).get('/api/cuenta')).status).toBe(401);
    const token = await ingresar(env.app, 'ana');
    expect((await cliente(env.app, `${token}x`).get('/api/cuenta')).status).toBe(401);
    expect((await cliente(env.app, 'abc.def.ghi').get('/api/cuenta')).status).toBe(401);
  });

  it('registra el cierre de sesión', async () => {
    const token = await ingresar(env.app, 'ana');
    expect((await cliente(env.app, token).post('/api/auth/salir')).status).toBe(200);
    const salidas = await env.ctx.prisma.actividad.count({ where: { usuario: 'ana', accion: 'logout' } });
    expect(salidas).toBe(1);
  });
});
