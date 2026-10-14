import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ConstructorSala, descomprimirMapa, type MapaGuardado, type MapaOficina } from '@ol/shared';
import { crearEntorno, sesionComo, type Entorno } from './ayudas';
import { publicarMapa } from './mapas';

/** Sala de 14x10 con piso, un escritorio de Ana dentro de su área (x 3..6, y 3..5) y una planta fuera de ella. */
function mapaConArea(duenoId: number): MapaOficina {
  const b = new ConstructorSala('principal', 'Sala de prueba', 14, 10);
  b.piso(1, 1, 12, 8, 'piso-madera-clara');
  b.poner('escritorio-individual', 3, 4, 'S');
  b.poner('planta-grande', 10, 2);
  b.llegadas({ x: 2, y: 7 });
  b.area('Escritorio de Ana', 3, 3, 4, 3, [duenoId]);
  return { version: 1, nombre: 'Prueba de áreas', salaInicial: 'principal', salas: [b.construir()] };
}

describe('áreas personales en el servidor', () => {
  let env: Entorno;
  let ana: Awaited<ReturnType<typeof sesionComo>>;
  let beto: Awaited<ReturnType<typeof sesionComo>>;
  let obra: Awaited<ReturnType<typeof sesionComo>>;
  let jefa: Awaited<ReturnType<typeof sesionComo>>;
  let areaId = '';
  let base = 0;

  beforeAll(async () => {
    env = await crearEntorno();
    ana = await sesionComo(env, 'ana', 'usuario');
    beto = await sesionComo(env, 'beto', 'usuario');
    obra = await sesionComo(env, 'obra', 'constructor');
    jefa = await sesionComo(env, 'jefa', 'admin');
    base = await publicarMapa(obra.api, mapaConArea(ana.cuenta.id));
    areaId = descomprimirMapa(env.ctx.oficina.publicado().mapa).salas[0]!.areas![0]!.id;
  });
  afterAll(async () => {
    await env.cerrar();
  });

  const escritorio = { id: 'e1', objeto: 'escritorio-individual', x: 3, y: 4, orientacion: 'S', variante: 'base' } as const;
  const url = () => `/api/oficina/areas/principal/${areaId}`;

  it('lo que no es básico exige el paquete que la administración le dio a la persona', async () => {
    const intento = { base, colocaciones: [escritorio, { id: 'p1', objeto: 'pc-gamer', x: 3, y: 4, orientacion: 'S', variante: 'rojo' }] };
    const sin = await ana.api.put(url()).send(intento);
    expect(sin.status).toBe(403);
    expect(sin.body.codigo ?? sin.body.code).toBe('objeto_sin_acceso');
    // Un paquete que no existe se rechaza, y uno válido se asigna.
    expect((await jefa.api.patch(`/api/admin/usuarios/${ana.cuenta.id}`).send({ acceso: ['no-existe'] })).status).toBe(422);
    const dado = await jefa.api.patch(`/api/admin/usuarios/${ana.cuenta.id}`).send({ acceso: ['gamer', 'gamer'] });
    expect(dado.status).toBe(200);
    expect(dado.body.usuario.acceso).toEqual(['gamer']);
    // Una persona común no puede darse paquetes a sí misma.
    expect((await ana.api.patch(`/api/admin/usuarios/${ana.cuenta.id}`).send({ acceso: ['gamer', 'juegos'] })).status).toBe(403);
  });

  it('la dueña pone un computador gamer y una planta en su área, y queda publicado', async () => {
    const r = await ana.api.put(url()).send({
      base,
      colocaciones: [escritorio, { id: 'p1', objeto: 'pc-gamer', x: 3, y: 4, orientacion: 'S', variante: 'rojo' }, { id: 'p2', objeto: 'planta-mediana', x: 6, y: 5, orientacion: 'U', variante: 'base' }],
    });
    expect(r.status).toBe(200);
    expect(r.body.numero).toBe(base + 1);
    const sala = descomprimirMapa(env.ctx.oficina.publicado().mapa).salas[0]!;
    expect(sala.colocaciones.map((c) => c.objeto).sort()).toEqual(['escritorio-individual', 'pc-gamer', 'planta-grande', 'planta-mediana']);
    expect(env.ctx.oficina.publicado().nota).toContain('Escritorio de Ana');
    base = r.body.numero as number;
  });

  it('puede quitar lo suyo y no toca lo de afuera', async () => {
    const r = await ana.api.put(url()).send({ base, colocaciones: [] });
    expect(r.status).toBe(200);
    const sala = descomprimirMapa(env.ctx.oficina.publicado().mapa).salas[0]!;
    expect(sala.colocaciones.map((c) => c.objeto)).toEqual(['planta-grande']);
    base = r.body.numero as number;
  });

  it('otra persona no puede editar un área que no es suya', async () => {
    const r = await beto.api.put(url()).send({ base, colocaciones: [] });
    expect(r.status).toBe(403);
    expect(r.body.codigo ?? r.body.code).toBe('area_ajena');
  });

  it('sin sesión no se puede', async () => {
    const r = await ana.api.put('/api/oficina/areas/principal/inexistente').send({ base, colocaciones: [] });
    expect(r.status).toBe(404);
  });

  it('rechaza objetos fuera del área, paredes, portales y objetos que no existen', async () => {
    for (const c of [
      { id: 'x1', objeto: 'planta-grande', x: 10, y: 6, orientacion: 'U', variante: 'base' },
      { id: 'x2', objeto: 'pared-lisa', x: 4, y: 3, orientacion: 'U', variante: 'base' },
      { id: 'x3', objeto: 'portal', x: 4, y: 3, orientacion: 'U', variante: 'base' },
      { id: 'x4', objeto: 'cosa-inventada', x: 4, y: 3, orientacion: 'U', variante: 'base' },
    ]) {
      const r = await ana.api.put(url()).send({ base, colocaciones: [c] });
      expect(r.status, c.objeto).toBe(422);
    }
    expect(env.ctx.oficina.numeroPublicado()).toBe(base);
  });

  it('exige la versión que la persona vio', async () => {
    const r = await ana.api.put(url()).send({ base: base - 1, colocaciones: [] });
    expect(r.status).toBe(409);
  });

  it('rechaza cuerpos con forma incorrecta', async () => {
    expect((await ana.api.put(url()).send({ colocaciones: [] })).status).toBe(400);
    expect((await ana.api.put(url()).send({ base, colocaciones: [], extra: 1 })).status).toBe(400);
    expect((await ana.api.put(url()).send({ base, colocaciones: [{ id: 'z', objeto: 'planta-chica', x: 'a', y: 1, orientacion: 'U', variante: 'base' }] })).status).toBe(400);
  });

  it('quien construye ve la lista de personas para asignar áreas; una persona común no', async () => {
    const ok = await obra.api.get('/api/oficina/personas');
    expect(ok.status).toBe(200);
    expect(ok.body.personas.map((p: { usuario: string }) => p.usuario)).toEqual(expect.arrayContaining(['ana', 'beto', 'obra']));
    expect((await ana.api.get('/api/oficina/personas')).status).toBe(403);
  });

  it('reflejan el cambio en el borrador de quien administra para que publicarlo no lo borre', async () => {
    const construccion = await obra.api.get('/api/oficina/construccion');
    const mapa = structuredClone(env.ctx.oficina.publicado().mapa) as MapaGuardado;
    const guardado = await obra.api.put('/api/oficina/borrador').send({ revision: construccion.body.borrador?.revision ?? null, mapa });
    expect(guardado.status).toBe(200);
    const r = await ana.api.put(url()).send({ base, colocaciones: [{ id: 'q1', objeto: 'planta-mediana', x: 5, y: 5, orientacion: 'U', variante: 'base' }] });
    expect(r.status).toBe(200);
    const b = (await obra.api.get('/api/oficina/construccion')).body.borrador as { mapa: MapaGuardado };
    expect(b.mapa.salas[0]!.colocaciones.map((c) => c.objeto)).toContain('planta-mediana');
  });
});
