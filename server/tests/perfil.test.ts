import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { avatarAlAzar, coleccionesActivas, COLECCIONES, type AvatarSpec } from '@ol/shared';
import { catalogoMascotas, catalogoPersonajes, personajeVisible } from '../src/personaje/catalogo';
import { CLAVE, crearEntorno, cliente, crearCuenta, ingresar, sesionComo, type Entorno } from './ayudas';

describe('perfil y personaje', () => {
  let env: Entorno;
  let ana: Awaited<ReturnType<typeof sesionComo>>;
  let jefa: Awaited<ReturnType<typeof sesionComo>>;

  beforeAll(async () => {
    env = await crearEntorno();
    ana = await sesionComo(env, 'ana', 'usuario');
    jefa = await sesionComo(env, 'jefa', 'admin');
  });
  afterAll(async () => {
    await env.cerrar();
  });

  const cat = catalogoPersonajes();
  const base = (): AvatarSpec => avatarAlAzar(cat, 7);
  const inactiva = COLECCIONES.map((c) => c.id).find((c) => !coleccionesActivas().includes(c) && cat.especiales?.some((e) => e.coleccion === c))!;
  const disfrazInactivo = cat.especiales!.find((e) => e.coleccion === inactiva)!;
  const fantasia = cat.accesorios.find((a) => a.premium === true);
  const chaquetaPremium = (cat.chaquetas ?? []).find((c) => c.premium === true);

  it('una cuenta nueva trae un personaje preseleccionado y todavía no lo confirmó', async () => {
    const cuenta = await crearCuenta(env.ctx, 'nueva', 'usuario');
    const fila = await env.ctx.prisma.usuario.findUnique({ where: { id: cuenta.id } });
    const spec = JSON.parse(fila!.personaje!) as AvatarSpec;
    expect(spec.v).toBe(1);
    expect(spec.especial).toBeUndefined();
    expect(spec.movilidad).toBeUndefined();
    expect(fila!.personajeListo).toBe(false);
    const yo = await cliente(env.app, await ingresar(env.app, 'nueva')).get('/api/cuenta');
    expect(yo.body.usuario).toMatchObject({ personajeListo: false });
    expect(yo.body.usuario.personaje).toMatchObject({ v: 1 });
  });

  it('se entra con el correo de trabajo', async () => {
    await crearCuenta(env.ctx, 'conmail', 'usuario', { correo: 'persona@ejemplo.com' });
    const r = await cliente(env.app).post('/api/auth/login').send({ usuario: 'Persona@Ejemplo.com', clave: CLAVE });
    expect(r.status).toBe(200);
    expect(r.body.usuario.usuario).toBe('conmail');
    expect((await cliente(env.app).post('/api/auth/login').send({ usuario: 'otra@ejemplo.com', clave: CLAVE })).status).toBe(401);
  });

  it('guarda el personaje con partes normales y lo confirma', async () => {
    const spec = base();
    const r = await ana.api.put('/api/cuenta/perfil').send({ apodo: 'Anita', personaje: spec, confirmar: true });
    expect(r.status).toBe(200);
    expect(r.body.usuario).toMatchObject({ apodo: 'Anita', personajeListo: true });
    expect(r.body.usuario.personaje.peinado).toBe(spec.peinado);
  });

  it('rechaza partes que no existen y formas incorrectas', async () => {
    expect((await ana.api.put('/api/cuenta/perfil').send({ personaje: { ...base(), peinado: 'no-existe' } })).status).toBe(422);
    expect((await ana.api.put('/api/cuenta/perfil').send({ personaje: { ...base(), extra: 1 } })).status).toBe(422);
    expect((await ana.api.put('/api/cuenta/perfil').send({ apodo: 'x'.repeat(30) })).status).toBe(422);
  });

  it('un disfraz fuera de fecha, la ropa premium y la movilidad exigen permiso', async () => {
    const disfraz = { ...base(), especial: { id: disfrazInactivo.id } };
    const sin = await ana.api.put('/api/cuenta/perfil').send({ personaje: disfraz });
    expect(sin.status).toBe(422);
    expect(sin.body.codigo ?? sin.body.code).toBe('personaje_no_valido');
    // Los accesorios de fantasía y la movilidad solo existen en el catálogo cuando la Fase B dibuja su arte (en la v4 inicial no hay).
    const premium = await ana.api.put('/api/cuenta/perfil').send({ personaje: { ...base(), accesorios: [{ id: fantasia!.id, color: cat.colores[0]!.id }] } });
    expect(premium.status).toBe(422);
    expect(premium.body.error ?? premium.body.mensaje ?? JSON.stringify(premium.body)).toContain('Pídele a un administrador');
    expect((await ana.api.put('/api/cuenta/perfil').send({ personaje: { ...base(), chaqueta: { id: chaquetaPremium!.id, color: cat.colores[0]!.id } } })).status).toBe(422);
    if (cat.movilidad[0]) expect((await ana.api.put('/api/cuenta/perfil').send({ personaje: { ...base(), movilidad: { id: cat.movilidad[0].id } } })).status).toBe(422);
    // Un accesorio normal sí.
    expect((await ana.api.put('/api/cuenta/perfil').send({ personaje: { ...base(), accesorios: [{ id: 'acc-gorra', color: cat.colores[0]!.id }] } })).status).toBe(200);
  });

  it('con el paquete de la fiesta, de fantasía y de movilidad, la administración los habilita', async () => {
    await jefa.api.patch(`/api/admin/usuarios/${ana.cuenta.id}`).send({ acceso: [`fiesta-${inactiva}`, 'ropa-premium', 'movilidad'] });
    const spec = { ...base(), especial: { id: disfrazInactivo.id }, ...(cat.movilidad[0] ? { movilidad: { id: cat.movilidad[0].id } } : {}), accesorios: fantasia ? [{ id: fantasia.id, color: cat.colores[0]!.id }] : [] };
    const r = await ana.api.put('/api/cuenta/perfil').send({ personaje: spec });
    expect(r.status).toBe(200);
    expect(r.body.usuario.personaje.especial).toMatchObject({ id: disfrazInactivo.id });
    // Si se le quita el permiso, el disfraz deja de verse solo, sin borrar lo demás.
    await jefa.api.patch(`/api/admin/usuarios/${ana.cuenta.id}`).send({ acceso: [] });
    const hoy = (await ana.api.get('/api/cuenta')).body.usuario;
    expect(hoy.personaje.especial).toBeUndefined();
    expect(hoy.personaje.movilidad).toBeUndefined();
    // La ropa premium que ya lleva puesta no se le quita: solo deja de poder elegir más.
    expect(hoy.personaje.accesorios).toHaveLength(1);
    expect(hoy.personaje.peinado).toBe(spec.peinado);
    const guardar = await ana.api.put('/api/cuenta/perfil').send({ personaje: { ...spec, especial: undefined, movilidad: undefined, peinado: hoy.personaje.peinado } });
    expect(guardar.status).toBe(200);
    // Y no puede sumar otra pieza premium.
    const otra = (cat.accesorios.filter((a) => a.premium === true && a.id !== fantasia!.id)[0])!;
    const dos = await ana.api.put('/api/cuenta/perfil').send({ personaje: { ...spec, especial: undefined, movilidad: undefined, accesorios: [...spec.accesorios, { id: otra.id, color: cat.colores[0]!.id }] } });
    expect(dos.status).toBe(422);
  });

  it('las mascotas no son de nadie por defecto: se piden a un administrador, por paquete general o por grupo', async () => {
    const cm = catalogoMascotas();
    const gato = cm.mascotas.find((m) => m.id === 'gato')!;
    const dragon = cm.mascotas.find((m) => m.id === 'dragoncito')!;
    const conGato = { ...base(), mascota: { id: gato.id, color: gato.variantes[0]!.id } };
    const sinPaquete = await ana.api.put('/api/cuenta/perfil').send({ personaje: conGato });
    expect(sinPaquete.status).toBe(422);
    expect(JSON.stringify(sinPaquete.body)).toContain('Pídele a un administrador');
    // Solo los animales: el gato sí, el dragoncito no.
    await jefa.api.patch(`/api/admin/usuarios/${ana.cuenta.id}`).send({ acceso: ['mascotas-animales'] });
    const ok = await ana.api.put('/api/cuenta/perfil').send({ personaje: { ...conGato, mascota: { ...conGato.mascota, nombre: 'Michi' } } });
    expect(ok.status).toBe(200);
    expect(ok.body.usuario.personaje.mascota).toEqual({ id: 'gato', color: gato.variantes[0]!.id, nombre: 'Michi' });
    expect((await ana.api.put('/api/cuenta/perfil').send({ personaje: { ...base(), mascota: { id: dragon.id, color: dragon.variantes[0]!.id } } })).status).toBe(422);
    // Con el paquete general sí.
    await jefa.api.patch(`/api/admin/usuarios/${ana.cuenta.id}`).send({ acceso: ['mascotas'] });
    expect((await ana.api.put('/api/cuenta/perfil').send({ personaje: { ...base(), mascota: { id: dragon.id, color: dragon.variantes[0]!.id } } })).status).toBe(200);
    // Ids y formas incorrectas.
    expect((await ana.api.put('/api/cuenta/perfil').send({ personaje: { ...base(), mascota: { id: 'unicornio', color: 'x' } } })).status).toBe(422);
    expect((await ana.api.put('/api/cuenta/perfil').send({ personaje: { ...base(), mascota: { id: 'gato', color: 'azul' } } })).status).toBe(422);
    expect((await ana.api.put('/api/cuenta/perfil').send({ personaje: { ...base(), mascota: { id: 'gato', color: gato.variantes[0]!.id, nombre: 'x'.repeat(30) } } })).status).toBe(422);
    // Al quitarle el paquete, la mascota deja de verse sin borrar lo demás.
    await jefa.api.patch(`/api/admin/usuarios/${ana.cuenta.id}`).send({ acceso: [] });
    const hoy = (await ana.api.get('/api/cuenta')).body.usuario;
    expect(hoy.personaje.mascota).toBeUndefined();
    expect(hoy.personaje.peinado).toBeDefined();
  });

  it('la administración puede asignar paquetes de personaje y se aplican al instante en el catálogo de esa persona', async () => {
    await jefa.api.patch(`/api/admin/usuarios/${ana.cuenta.id}`).send({ acceso: ['ropa-premium', 'mascotas-fantasticas'] });
    const r = await ana.api.get('/api/cuenta/personaje/catalogo');
    expect(r.body.paquetes.sort()).toEqual(['mascotas-fantasticas', 'ropa-premium']);
    expect(r.body.mascotas.mascotas).toHaveLength(12);
    // Un paquete que no existe se rechaza y el nombre viejo se convierte.
    expect((await jefa.api.patch(`/api/admin/usuarios/${ana.cuenta.id}`).send({ acceso: ['no-existe'] })).status).toBe(422);
    await jefa.api.patch(`/api/admin/usuarios/${ana.cuenta.id}`).send({ acceso: ['accesorios-especiales'] });
    expect((await ana.api.get('/api/cuenta/personaje/catalogo')).body.paquetes).toEqual(['ropa-premium']);
    await jefa.api.patch(`/api/admin/usuarios/${ana.cuenta.id}`).send({ acceso: [] });
  });

  it('personajeVisible conserva la ropa premium puesta y quita una mascota que no está asignada', () => {
    const spec: AvatarSpec = { ...base(), accesorios: [{ id: fantasia!.id, color: cat.colores[0]!.id }], mascota: { id: 'panda', color: 'clasico' } };
    const v = personajeVisible(spec, [])!;
    expect(v.accesorios).toHaveLength(1);
    expect(v.mascota).toBeUndefined();
    expect(personajeVisible(spec, ['mascotas-animales'])!.mascota).toMatchObject({ id: 'panda' });
    expect(personajeVisible({ ...spec, mascota: { id: 'panda', color: 'inexistente' } }, ['mascotas'])!.mascota).toBeUndefined();
  });

  it('una cuenta nueva no trae mascota ni ropa premium', async () => {
    for (let i = 1; i <= 60; i++) {
      const a = avatarAlAzar(cat, i);
      expect(a.mascota).toBeUndefined();
      for (const x of a.accesorios) expect(cat.accesorios.find((p) => p.id === x.id)?.premium).not.toBe(true);
      if (a.chaqueta) expect((cat.chaquetas ?? []).find((p) => p.id === a.chaqueta!.id)?.premium).not.toBe(true);
    }
  });

  it('guarda una barba con el color del pelo y rechaza una que no existe', async () => {
    const barbas = (cat as unknown as { barbas?: { id: string }[] }).barbas ?? [];
    expect(barbas.length).toBeGreaterThanOrEqual(2);
    const spec = base();
    const ok = await ana.api.put('/api/cuenta/perfil').send({ personaje: { ...spec, barba: { id: barbas[0]!.id, color: spec.pelo } } });
    expect(ok.status).toBe(200);
    expect(ok.body.usuario.personaje.barba).toMatchObject({ id: barbas[0]!.id });
    expect((await ana.api.put('/api/cuenta/perfil').send({ personaje: { ...spec, barba: { id: 'barba-inventada', color: spec.pelo } } })).status).toBe(422);
  });

  it('el catálogo llega con los permisos de la persona', async () => {
    const r = await ana.api.get('/api/cuenta/personaje/catalogo');
    expect(r.status).toBe(200);
    expect(r.body.catalogo.peinados.length).toBeGreaterThanOrEqual(12);
    expect(r.body.paquetes).toEqual([]);
    expect(typeof r.body.hoy).toBe('string');
  });
});

describe('personajes guardados con el catálogo anterior', () => {
  it('un personaje con ids de la v2 o v3 se ve como uno válido y no rompe el ingreso', async () => {
    const { personajeVisible } = await import('../src/personaje/catalogo');
    const viejo = JSON.stringify({ v: 1, cuerpo: 'cuerpo-a', piel: 'piel-6', peinado: 'peinado-afro-grande', pelo: 'pelo-negro', arriba: 'arriba-sueter', colorArriba: 'rojo-coral', colorArriba2: 'blanco', abajo: 'abajo-jean', colorAbajo: 'azul-marino', zapatos: 'zapatos-botas', colorZapatos: 'negro', accesorios: [{ id: 'acc-audifonos', color: 'negro' }], movilidad: { id: 'movilidad-patineta' } });
    const visible = personajeVisible(JSON.parse(viejo), ['movilidad']);
    expect(visible).not.toBeNull();
    const { validarAvatar } = await import('@ol/shared');
    expect(validarAvatar(visible!, catalogoPersonajes())).toBeNull();
    expect(visible!.peinado).toBe('peinado-afro');
    expect(visible!.movilidad).toBeUndefined();
  });
});
