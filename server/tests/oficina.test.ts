import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { descomprimirMapa, etiquetaAccion, hayErrores, plantillaNaos, validarMapa, type MapaGuardado } from '@ol/shared';
import { CLAVE_DEMO, sembrarDemo } from '../src/demo';
import { ServicioOficina, MAX_HISTORICO } from '../src/oficina/servicio';
import type { ServidorPresencia } from '../src/presencia/servidor';
import { cliente, crearEntorno, ingresar, sesionComo, type Entorno } from './ayudas';
import { compactoDePrueba, mapaConPlanta, mapaConSilla, publicarMapa } from './mapas';

type Api = ReturnType<typeof cliente>;

interface Banco {
  env: Entorno;
  persona: Api;
  obra: Api;
  jefa: Api;
}

/** Un servidor nuevo con una persona común, una cuenta que construye y una administradora. */
async function levantar(): Promise<Banco> {
  const env = await crearEntorno();
  return {
    env,
    persona: (await sesionComo(env, 'ana', 'usuario')).api,
    obra: (await sesionComo(env, 'obra', 'constructor')).api,
    jefa: (await sesionComo(env, 'jefa', 'admin')).api,
  };
}

const MENSAJE_CHOQUE = 'Otra persona guardó cambios en el borrador. Recarga para ver lo último.';

async function borradorActual(api: Api) {
  const r = await api.get('/api/oficina/construccion');
  return r.body.borrador as { revision: number; mapa: MapaGuardado; autor: string; actualizadoEn: string } | null;
}

// ---------------------------------------------------------------------------------------------------------------

describe('primer arranque', () => {
  let env: Entorno;
  beforeAll(async () => {
    env = await crearEntorno();
  });
  afterAll(async () => {
    await env.cerrar();
  });

  it('publica la oficina de ejemplo como versión 1 y esa oficina es válida', async () => {
    const p = env.ctx.oficina.publicado();
    expect(p).toMatchObject({ numero: 1, autor: 'Sistema', nota: 'Oficina de ejemplo' });
    expect(p.mapa.nombre).toBe(plantillaNaos().nombre);
    const filas = await env.ctx.prisma.mapaOficina.findMany();
    expect(filas.map((f) => `${f.estado}:${f.numero}`)).toEqual(['publicado:1']);
    expect(hayErrores(validarMapa(descomprimirMapa(p.mapa)))).toBe(false);
  });

  it('volver a cargar no publica otra versión', async () => {
    await env.ctx.oficina.cargar();
    expect(await env.ctx.prisma.mapaOficina.count()).toBe(1);
    expect(env.ctx.oficina.numeroPublicado()).toBe(1);
  });

  it('deja lista la geometría que usa la presencia', () => {
    const esperada = plantillaNaos().salas[0]!;
    const salas = env.ctx.oficina.proveedorSalas();
    expect(salas.inicial()).toBe(plantillaNaos().salaInicial);
    expect(salas.numero?.()).toBe(1);
    const sala = salas.sala(esperada.id);
    expect(sala).toMatchObject({ id: esperada.id, ancho: esperada.ancho, alto: esperada.alto });
    expect(sala?.bloqueo).toHaveLength(esperada.ancho * esperada.alto);
    expect(sala?.llegadas).toHaveLength(esperada.llegadas.length);
    expect(sala?.asientos?.size).toBeGreaterThan(0);
    for (const k of sala?.asientos ?? []) expect(sala?.bloqueo?.[k], 'un asiento se puede cruzar').toBe(0);
    for (const l of sala?.llegadas ?? []) expect(sala?.bloqueo?.[l.y * esperada.ancho + l.x], 'una llegada se puede pisar').toBe(0);
    expect(salas.sala('no-existe')).toBeUndefined();
  });

  it('guarda también el mapa publicado ya descomprimido', () => {
    const esperado = plantillaNaos();
    const oficina = env.ctx.oficina.oficinaPublicada();
    expect(oficina.nombre).toBe(esperado.nombre);
    expect(oficina.salas.map((s) => s.id)).toEqual(esperado.salas.map((s) => s.id));
    expect(oficina.salas[0]?.piso).toEqual(esperado.salas[0]?.piso);
    expect(oficina.salas[0]?.zonas.map((z) => z.nombre)).toEqual(esperado.salas[0]?.zonas.map((z) => z.nombre)); // los ids de zona son al azar
    // y es exactamente lo que sale de descomprimir lo que se sirve a las personas
    expect(oficina).toEqual(descomprimirMapa(env.ctx.oficina.publicado().mapa));
  });

  it('con las cuentas demo, GET /api/oficina entrega el mapa inicial', async () => {
    const demo = await crearEntorno({ demo: true });
    try {
      await sembrarDemo(demo.ctx);
      const ana = cliente(demo.app, await ingresar(demo.app, 'demo.ana', CLAVE_DEMO));
      const r = await ana.get('/api/oficina');
      expect(r.status).toBe(200);
      expect(r.body.numero).toBe(1);
      expect(r.body.mapa.nombre).toBe(plantillaNaos().nombre);
      expect(r.body.mapa.salas).toHaveLength(plantillaNaos().salas.length);
      expect(new Date(r.body.creadoEn).getTime()).toBeGreaterThan(Date.now() - 60_000);

      const obra = cliente(demo.app, await ingresar(demo.app, 'demo.constructor', CLAVE_DEMO));
      expect((await obra.get('/api/oficina/construccion')).status).toBe(200);

      // quien debe cambiar su contraseña no pasa, igual que en el resto de la API
      const nuevo = cliente(demo.app, await ingresar(demo.app, 'demo.nuevo', CLAVE_DEMO));
      const bloqueada = await nuevo.get('/api/oficina');
      expect(bloqueada.status).toBe(403);
      expect(bloqueada.body.codigo).toBe('cambiar_clave');
    } finally {
      await demo.cerrar();
    }
  });
});

// ---------------------------------------------------------------------------------------------------------------

describe('quién puede qué', () => {
  let b: Banco;
  beforeAll(async () => {
    b = await levantar();
  });
  afterAll(async () => {
    await b.env.cerrar();
  });

  const CONSTRUCCION: Array<['get' | 'put' | 'delete' | 'post', string]> = [
    ['get', '/api/oficina/construccion'],
    ['put', '/api/oficina/borrador'],
    ['delete', '/api/oficina/borrador'],
    ['post', '/api/oficina/publicar'],
    ['get', '/api/oficina/versiones'],
    ['post', '/api/oficina/versiones/1/restaurar'],
  ];

  it('sin sesión todo responde 401', async () => {
    const anonimo = cliente(b.env.app);
    expect((await anonimo.get('/api/oficina')).status).toBe(401);
    for (const [metodo, ruta] of CONSTRUCCION) {
      const r = await anonimo[metodo](ruta).send(metodo === 'put' ? { revision: null, mapa: compactoDePrueba() } : {});
      expect(r.status, `${metodo} ${ruta}`).toBe(401);
    }
  });

  it('una persona común lee la oficina publicada pero recibe 403 en toda la construcción', async () => {
    const r = await b.persona.get('/api/oficina');
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ numero: 1 });
    expect(r.body.mapa.salas.length).toBeGreaterThan(0);
    expect(typeof r.body.creadoEn).toBe('string');

    for (const [metodo, ruta] of CONSTRUCCION) {
      const respuesta = await b.persona[metodo](ruta).send(metodo === 'put' ? { revision: null, mapa: compactoDePrueba() } : {});
      expect(respuesta.status, `${metodo} ${ruta}`).toBe(403);
    }
    // y no quedó nada guardado
    expect(await b.env.ctx.prisma.mapaOficina.count({ where: { estado: 'borrador' } })).toBe(0);
  });

  it('quien construye y la administración entran a la construcción', async () => {
    for (const api of [b.obra, b.jefa]) {
      expect((await api.get('/api/oficina')).status).toBe(200);
      expect((await api.get('/api/oficina/construccion')).status).toBe(200);
      expect((await api.get('/api/oficina/versiones')).status).toBe(200);
    }
  });

  it('las escrituras exigen la cabecera propia X-OL', async () => {
    const token = await ingresar(b.env.app, 'obra');
    const sinCabecera = await request(b.env.app).put('/api/oficina/borrador').set('Authorization', `Bearer ${token}`).send({ revision: null, mapa: compactoDePrueba() });
    expect(sinCabecera.status).toBe(403);
    expect(await b.env.ctx.prisma.mapaOficina.count({ where: { estado: 'borrador' } })).toBe(0);
  });
});

// ---------------------------------------------------------------------------------------------------------------

describe('borrador', () => {
  let b: Banco;
  beforeAll(async () => {
    b = await levantar();
  });
  afterAll(async () => {
    await b.env.cerrar();
  });

  it('al principio solo hay lo publicado', async () => {
    const r = await b.obra.get('/api/oficina/construccion');
    expect(r.status).toBe(200);
    expect(r.body.borrador).toBeNull();
    expect(r.body.publicado).toMatchObject({ numero: 1, autor: 'Sistema' });
    expect(typeof r.body.publicado.creadoEn).toBe('string');
  });

  it('el primer guardado va con revisión null y crea la 1; cada guardado sube de a uno y guarda a su autor', async () => {
    const uno = await b.obra.put('/api/oficina/borrador').send({ revision: null, mapa: compactoDePrueba('Borrador uno') });
    expect(uno.status).toBe(200);
    expect(uno.body.revision).toBe(1);
    expect(uno.body.problemas).toEqual([]);

    const dos = await b.jefa.put('/api/oficina/borrador').send({ revision: 1, mapa: compactoDePrueba('Borrador dos') });
    expect(dos.status).toBe(200);
    expect(dos.body.revision).toBe(2);

    const borrador = await borradorActual(b.obra);
    expect(borrador).toMatchObject({ revision: 2, autor: 'Persona jefa' });
    expect(borrador?.mapa).toEqual(compactoDePrueba('Borrador dos'));
    expect(new Date(borrador!.actualizadoEn).getTime()).toBeGreaterThan(Date.now() - 60_000);
    // lo publicado no se movió
    expect((await b.persona.get('/api/oficina')).body.numero).toBe(1);
  });

  it('los problemas del mapa se devuelven, pero el borrador se guarda igual', async () => {
    const mapa = compactoDePrueba('Con problemas');
    mapa.salas[0]!.colocaciones.push({ id: 'raro', objeto: 'objeto-inventado', x: 2, y: 2, orientacion: 'U', variante: 'base' });
    mapa.salas[0]!.colocaciones.push({ id: 'mt', objeto: 'mesa-teams', x: 8, y: 4, orientacion: 'S', variante: 'base' });
    const r = await b.obra.put('/api/oficina/borrador').send({ revision: 2, mapa });
    expect(r.status).toBe(200);
    expect(r.body.revision).toBe(3);
    const codigos = (r.body.problemas as { nivel: string; codigo: string }[]).map((p) => `${p.nivel}:${p.codigo}`);
    expect(codigos).toContain('error:objeto_desconocido');
    expect(codigos).toContain('aviso:teams_vacio');
    expect((await borradorActual(b.obra))?.mapa.nombre).toBe('Con problemas');
  });

  it('si el borrador cambió desde que lo cargaste, responde 409 con la revisión actual y el autor', async () => {
    const r = await b.obra.put('/api/oficina/borrador').send({ revision: 1, mapa: compactoDePrueba('Pisa lo ajeno') });
    expect(r.status).toBe(409);
    expect(r.body.error).toBe(MENSAJE_CHOQUE);
    expect(r.body.revision).toBe(3);
    expect(r.body.autor).toBe('Persona obra');
    expect(r.body.codigo).toBe('choque_borrador');

    // mandar null cuando ya hay borrador también choca
    const nulo = await b.jefa.put('/api/oficina/borrador').send({ revision: null, mapa: compactoDePrueba('Otro inicio') });
    expect(nulo.status).toBe(409);
    expect(nulo.body.error).toBe(MENSAJE_CHOQUE);

    const borrador = await borradorActual(b.obra);
    expect(borrador?.revision).toBe(3);
    expect(borrador?.mapa.nombre).toBe('Con problemas');
  });

  it('dos guardados a la vez con la misma revisión: uno gana y el otro recibe el choque', async () => {
    const revision = (await borradorActual(b.obra))!.revision;
    const [a, c] = await Promise.all([
      b.obra.put('/api/oficina/borrador').send({ revision, mapa: compactoDePrueba('Gana A') }),
      b.jefa.put('/api/oficina/borrador').send({ revision, mapa: compactoDePrueba('Gana B') }),
    ]);
    expect([a.status, c.status].sort()).toEqual([200, 409]);
    const ganadora = a.status === 200 ? a : c;
    expect(ganadora.body.revision).toBe(revision + 1);
    expect((await borradorActual(b.obra))?.revision).toBe(revision + 1);
  });
});

// ---------------------------------------------------------------------------------------------------------------

describe('formas inválidas', () => {
  let b: Banco;
  beforeAll(async () => {
    b = await levantar();
    const r = await b.obra.put('/api/oficina/borrador').send({ revision: null, mapa: compactoDePrueba('Intacto') });
    expect(r.status).toBe(200);
  });
  afterAll(async () => {
    await b.env.cerrar();
  });

  const zonaBase = { id: 'z1', nombre: 'Zona', tipo: 'sala' as const, rect: { x: 1, y: 1, w: 3, h: 3 } };
  const objeto = (m: MapaGuardado) => m.salas[0]!.colocaciones[0]!;
  const sueltos = (o: unknown) => o as Record<string, unknown>;

  const CASOS: Array<[string, (m: MapaGuardado) => void, RegExp]> = [
    ['enlace javascript: en un objeto', (m) => (objeto(m).props = { enlace: 'javascript:alert(1)' }), /salas\[0\]\.colocaciones\[0\]\.props\.enlace: .*https:\/\//],
    ['enlace http: en un objeto', (m) => (objeto(m).props = { enlace: 'http://ejemplo.co' }), /props\.enlace: .*https:\/\//],
    ['imagen data:', (m) => (objeto(m).props = { imagen: 'data:image/png;base64,AAAA' }), /props\.imagen: .*https:\/\//],
    ['enlace con espacios', (m) => (objeto(m).props = { enlace: 'https://ejemplo.co/a b' }), /props\.enlace/],
    ['enlace demasiado largo', (m) => (objeto(m).props = { enlace: `https://ejemplo.co/${'a'.repeat(500)}` }), /props\.enlace: máximo 500 caracteres/],
    ['enlace de Teams con http:', (m) => m.salas[0]!.zonas.push({ ...zonaBase, enlaceTeams: 'http://teams.microsoft.com/x' }), /salas\[0\]\.zonas\[0\]\.enlaceTeams: .*https:\/\//],
    ['enlace de Teams con javascript:', (m) => m.salas[0]!.zonas.push({ ...zonaBase, enlaceTeams: 'javascript:void(0)' }), /zonas\[0\]\.enlaceTeams/],
    ['color de zona que no es #RRGGBB', (m) => m.salas[0]!.zonas.push({ ...zonaBase, color: 'rojo' }), /zonas\[0\]\.color: .*#RRGGBB/],
    ['tipo de zona inventado', (m) => m.salas[0]!.zonas.push({ ...zonaBase, tipo: 'rara' as never }), /zonas\[0\]\.tipo: debe ser uno de: abierta, silenciosa, privada, sala/],
    ['fila de largo incorrecto', (m) => (m.salas[0]!.filas[2] = '000'), /salas\[0\]\.filas\[2\]: la fila debe tener 12 caracteres, tiene 3/],
    ['faltan filas', (m) => m.salas[0]!.filas.pop(), /salas\[0\]\.filas: debe tener 8 filas, tiene 7/],
    ['carácter que no está en la paleta', (m) => (m.salas[0]!.filas[1] = 'z'.repeat(12)), /salas\[0\]\.filas\[1\]: .*no existe en la paleta/],
    ['símbolos en las filas', (m) => (m.salas[0]!.filas[0] = '#'.repeat(12)), /salas\[0\]\.filas\[0\]: solo admite letras y números/],
    ['paleta sin la entrada vacía', (m) => (m.salas[0]!.paleta[0] = 'piso-madera-clara'), /salas\[0\]\.paleta\[0\]: la primera entrada debe estar vacía/],
    ['paleta de más de 62 entradas', (m) => (m.salas[0]!.paleta = ['', ...Array.from({ length: 62 }, (_, i) => `piso-${i}`)]), /salas\[0\]\.paleta: máximo 62 entradas/],
    [
      'demasiados objetos en una sala',
      (m) => (m.salas[0]!.colocaciones = Array.from({ length: 4001 }, (_, i) => ({ id: `c${i}`, objeto: 'planta-grande', x: 1, y: 1, orientacion: 'U' as const, variante: 'base' }))),
      /salas\[0\]\.colocaciones: máximo 4000 objetos por sala/,
    ],
    [
      'demasiadas zonas',
      (m) => (m.salas[0]!.zonas = Array.from({ length: 201 }, (_, i) => ({ ...zonaBase, id: `z${i}` }))),
      /salas\[0\]\.zonas: máximo 200 zonas por sala/,
    ],
    ['demasiados puntos de llegada', (m) => (m.salas[0]!.llegadas = Array.from({ length: 65 }, () => ({ x: 4, y: 3 }))), /salas\[0\]\.llegadas: máximo 64/],
    [
      'demasiados portales',
      (m) => (m.salas[0]!.portales = Array.from({ length: 101 }, (_, i) => ({ id: `p${i}`, x: 4, y: 3, destinoSala: 'principal', destinoX: 4, destinoY: 3, etiqueta: 'Portal' }))),
      /salas\[0\]\.portales: máximo 100/,
    ],
    [
      'demasiados puestos',
      (m) => (m.salas[0]!.puestos = Array.from({ length: 1001 }, (_, i) => ({ id: `u${i}`, colocacion: 'i1', usuarioId: null, etiqueta: '' }))),
      /salas\[0\]\.puestos: máximo 1000/,
    ],
    [
      'más de 24 salas',
      (m) => (m.salas = Array.from({ length: 25 }, (_, i) => ({ ...structuredClone(m.salas[0]!), id: `s${i}` }))),
      /salas: máximo 24 salas/,
    ],
    ['campo desconocido en el mapa', (m) => (sueltos(m)['extra'] = 1), /Mapa no válido: trae campos que no existen: extra/],
    ['campo desconocido en un objeto', (m) => (sueltos(objeto(m))['foo'] = 1), /salas\[0\]\.colocaciones\[0\]: trae campos que no existen: foo/],
    ['el piso sin comprimir (campo «piso»)', (m) => (sueltos(m.salas[0])['piso'] = []), /salas\[0\]: trae campos que no existen: piso/],
    ['campo desconocido dentro de props', (m) => (objeto(m).props = sueltos({ enlace: 'https://ejemplo.co', secreto: 'x' }) as never), /props: trae campos que no existen: secreto/],
    ['orientación inventada', (m) => (objeto(m).orientacion = 'X' as never), /colocaciones\[0\]\.orientacion: debe ser uno de: N, E, S, O, U/],
    ['versión del formato distinta', (m) => (sueltos(m)['version'] = 2), /Mapa no válido en version: debe valer 1/],
    ['sala demasiado pequeña', (m) => (m.salas[0]!.ancho = 3), /salas\[0\]\.ancho: debe ser mayor o igual que 4/],
    ['sala demasiado grande', (m) => (m.salas[0]!.alto = 121), /salas\[0\]\.alto: debe ser menor o igual que 120/],
    ['coordenada con decimales', (m) => (objeto(m).x = 1.5), /colocaciones\[0\]\.x: debe ser un número entero/],
    ['coordenada que no es número', (m) => (objeto(m).y = '2' as never), /colocaciones\[0\]\.y: debe ser un número/],
    ['texto de más de 1000 caracteres', (m) => (objeto(m).props = { texto: 'x'.repeat(1001) }), /props\.texto: máximo 1000 caracteres/],
    ['id de más de 40 caracteres', (m) => (objeto(m).id = 'i'.repeat(41)), /colocaciones\[0\]\.id: máximo 40 caracteres/],
    ['id vacío', (m) => (objeto(m).id = ''), /colocaciones\[0\]\.id: no puede estar vacío/],
    ['nombre de sala de más de 60 caracteres', (m) => (m.salas[0]!.nombre = 'n'.repeat(61)), /salas\[0\]\.nombre: máximo 60 caracteres/],
    ['falta un campo obligatorio', (m) => delete sueltos(m.salas[0])['zonas'], /salas\[0\]\.zonas: falta este dato/],
  ];

  it.each(CASOS)('rechaza con 400: %s', async (_nombre, estropear, mensaje) => {
    const mapa = compactoDePrueba();
    estropear(mapa);
    const r = await b.obra.put('/api/oficina/borrador').send({ revision: 1, mapa });
    expect(r.status).toBe(400);
    expect(r.body.codigo).toBe('mapa_invalido');
    expect(r.body.error).toMatch(mensaje);
    expect(r.body.error, 'sin el texto crudo de zod').not.toMatch(/Expected|Required|Invalid|received/);
    expect(r.body.error.length).toBeLessThan(260);
    expect(Array.isArray(r.body.detalles)).toBe(true);
  });

  it('acepta enlaces https de verdad en objetos, imágenes y reuniones de Teams', async () => {
    const mapa = compactoDePrueba();
    objeto(mapa).props = { enlace: 'https://planner.cloud.microsoft/tablero?x=1', imagen: 'https://ejemplo.co/imagen.png', texto: 'Hola', titulo: 'Tablero' };
    mapa.salas[0]!.zonas.push({ ...zonaBase, enlaceTeams: 'https://teams.microsoft.com/l/meetup-join/19%3ameeting_abc%40thread.v2/0?context=%7b%7d', color: '#3B82F6' });
    const r = await b.obra.put('/api/oficina/borrador').send({ revision: 1, mapa });
    expect(r.status).toBe(200);
    expect(r.body.revision).toBe(2);
  });

  it('rechaza un cuerpo que no tiene forma de borrador', async () => {
    const mapa = compactoDePrueba();
    const casos: Array<[unknown, RegExp]> = [
      [{ revision: '2', mapa }, /Revisión no válida: debe ser un número entero o null/],
      [{ mapa }, /Revisión no válida: falta este dato/],
      [{ revision: 0, mapa }, /Revisión no válida/],
      [{ revision: 1.5, mapa }, /Revisión no válida/],
      [{ revision: 2 }, /Mapa no válido: falta este dato/],
      [{ revision: 2, mapa, extra: true }, /El envío no es válido: trae campos que no existen: extra/],
      [{ revision: 2, mapa: 'texto' }, /Mapa no válido: debe ser un objeto/],
      [[], /Envía un objeto JSON/],
    ];
    for (const [cuerpo, mensaje] of casos) {
      const r = await b.obra.put('/api/oficina/borrador').send(cuerpo as object);
      expect(r.status, JSON.stringify(cuerpo).slice(0, 60)).toBe(400);
      expect(r.body.error).toMatch(mensaje);
    }
    const vacio = await b.obra.put('/api/oficina/borrador');
    expect(vacio.status).toBe(400);
    expect(vacio.body.error).toMatch(/Envía un objeto JSON/);
  });

  it('un JSON roto responde 400 y nada de esto cambia el borrador', async () => {
    const roto = await b.obra.put('/api/oficina/borrador').set('Content-Type', 'application/json').send('{ no es json');
    expect(roto.status).toBe(400);
    const guardado = await borradorActual(b.obra);
    expect(guardado?.revision).toBe(2); // la única escritura buena fue la de los enlaces https
    expect(guardado?.mapa.salas[0]!.zonas).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------------------------------------------

describe('publicar', () => {
  let b: Banco;
  beforeAll(async () => {
    b = await levantar();
  });
  afterAll(async () => {
    await b.env.cerrar();
  });

  it('sin borrador no hay nada que publicar (409)', async () => {
    const r = await b.obra.post('/api/oficina/publicar').send({});
    expect(r.status).toBe(409);
    expect(r.body.error).toMatch(/No hay un borrador/);
  });

  it('con errores responde 422, devuelve todos los problemas y no cambia nada', async () => {
    const mapa = compactoDePrueba('Con errores');
    for (let i = 0; i < 5; i++) mapa.salas[0]!.colocaciones.push({ id: `x${i}`, objeto: `inventado-${i}`, x: 2, y: 2, orientacion: 'U', variante: 'base' });
    mapa.salas[0]!.colocaciones.push({ id: 'mt', objeto: 'mesa-teams', x: 8, y: 4, orientacion: 'S', variante: 'base' });
    const guardado = await b.obra.put('/api/oficina/borrador').send({ revision: null, mapa });
    expect(guardado.body.revision).toBe(1);

    const r = await b.obra.post('/api/oficina/publicar').send({ nota: 'No debería salir' });
    expect(r.status).toBe(422);
    expect(r.body.error).toBe(r.body.mensaje);
    expect(r.body.mensaje).toMatch(/^No se puede publicar\. Corrige estos 5 errores: /);
    expect(r.body.mensaje).toContain('«inventado-0»');
    expect(r.body.mensaje).toMatch(/Y 2 más\.$/);
    expect(r.body.mensaje, 'los avisos no van en el mensaje').not.toMatch(/Teams/);
    const codigos = (r.body.problemas as { nivel: string; codigo: string }[]).map((p) => `${p.nivel}:${p.codigo}`);
    expect(codigos.filter((c) => c === 'error:objeto_desconocido')).toHaveLength(5);
    expect(codigos).toContain('aviso:teams_vacio');

    expect((await b.persona.get('/api/oficina')).body.numero).toBe(1);
    expect((await borradorActual(b.obra))?.revision).toBe(1);
    expect(await b.env.ctx.prisma.mapaOficina.count({ where: { estado: 'historico' } })).toBe(0);
  });

  it('un solo error se nombra en singular', async () => {
    const mapa = compactoDePrueba('Un error');
    mapa.salas[0]!.colocaciones.push({ id: 'x', objeto: 'inventado', x: 2, y: 2, orientacion: 'U', variante: 'base' });
    await b.obra.put('/api/oficina/borrador').send({ revision: 1, mapa });
    const r = await b.obra.post('/api/oficina/publicar').send({});
    expect(r.status).toBe(422);
    expect(r.body.mensaje).toBe('No se puede publicar. Corrige este error: El objeto «inventado» ya no existe en el inventario.');
  });

  it('sin errores sube el número, deja la anterior como histórico y borra el borrador', async () => {
    const actual = await borradorActual(b.obra);
    const guardado = await b.obra.put('/api/oficina/borrador').send({ revision: actual!.revision, mapa: compactoDePrueba('Versión dos') });
    expect(guardado.status).toBe(200);

    const r = await b.obra.post('/api/oficina/publicar').send({ nota: '  Primera de prueba  ' });
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ numero: 2, nota: 'Primera de prueba', problemas: [] });
    expect(new Date(r.body.creadoEn).getTime()).toBeGreaterThan(Date.now() - 60_000);

    const filas = await b.env.ctx.prisma.mapaOficina.findMany({ orderBy: { id: 'asc' } });
    expect(filas.map((f) => `${f.estado}:${f.numero}`)).toEqual(['historico:1', 'publicado:2']);
    expect(filas[1]).toMatchObject({ autor: 'Persona obra', nota: 'Primera de prueba' });

    const vigente = await b.persona.get('/api/oficina');
    expect(vigente.body.numero).toBe(2);
    expect(vigente.body.mapa.nombre).toBe('Versión dos');
    const construccion = await b.obra.get('/api/oficina/construccion');
    expect(construccion.body.borrador).toBeNull();
    expect(construccion.body.publicado).toMatchObject({ numero: 2, autor: 'Persona obra' });
  });

  it('la presencia ve de inmediato la geometría del mapa nuevo', () => {
    const salas = b.env.ctx.oficina.proveedorSalas();
    expect(salas.numero?.()).toBe(2);
    expect(salas.inicial()).toBe('principal');
    expect(salas.sala('principal')).toBe(b.env.ctx.oficina.geometria('principal'));
    const sala = b.env.ctx.oficina.geometria('principal')!;
    expect(sala).toMatchObject({ ancho: 12, alto: 8 });
    expect(sala.llegadas).toEqual([{ x: 4, y: 3 }]);
    const silla = 3 * 12 + 5;
    expect(sala.bloqueo[silla]).toBe(0); // el asiento se cruza
    expect(sala.asientos.has(silla)).toBe(true);
    expect(sala.bloqueo[3 * 12 + 4]).toBe(0); // la llegada
    expect(sala.bloqueo[0]).toBe(1); // fuera del piso
    expect(sala.asientos.size).toBe(1);
  });

  it('la nota admite hasta 200 caracteres y se puede publicar sin cuerpo', async () => {
    await b.obra.put('/api/oficina/borrador').send({ revision: null, mapa: compactoDePrueba('Tres') });
    const larga = await b.obra.post('/api/oficina/publicar').send({ nota: 'n'.repeat(201) });
    expect(larga.status).toBe(400);
    expect(larga.body.error).toMatch(/hasta 200 caracteres/);
    const mala = await b.obra.post('/api/oficina/publicar').send({ nota: 5 });
    expect(mala.status).toBe(400);
    expect(await borradorActual(b.obra)).not.toBeNull(); // el borrador sigue ahí

    const sinCuerpo = await b.obra.post('/api/oficina/publicar');
    expect(sinCuerpo.status).toBe(200);
    expect(sinCuerpo.body).toMatchObject({ numero: 3, nota: '' });
  });

  it('avisa a la presencia con el número publicado, y si el aviso falla la publicación igual queda', async () => {
    const avisos: number[] = [];
    b.env.ctx.presencia = { mapaPublicado: (n: number) => void avisos.push(n) } as unknown as ServidorPresencia;
    const cuatro = await publicarMapa(b.obra, mapaConPlanta('Cuatro'));
    expect(cuatro).toBe(4);
    expect(avisos).toEqual([4]);

    const silenciar = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    b.env.ctx.presencia = {
      mapaPublicado: () => {
        throw new Error('falla de prueba');
      },
    } as unknown as ServidorPresencia;
    expect(await publicarMapa(b.obra, mapaConSilla('Cinco'))).toBe(5);
    expect(silenciar).toHaveBeenCalled();
    silenciar.mockRestore();
    b.env.ctx.presencia = null;
    expect((await b.persona.get('/api/oficina')).body.numero).toBe(5);
  });

  it(`conserva como máximo ${MAX_HISTORICO} versiones históricas y los números suben de uno en uno`, async () => {
    for (let i = 6; i <= 36; i++) expect(await publicarMapa(b.obra, mapaConSilla(`Versión ${i}`))).toBe(i);

    const historicos = await b.env.ctx.prisma.mapaOficina.findMany({ where: { estado: 'historico' }, orderBy: { numero: 'asc' } });
    expect(historicos).toHaveLength(MAX_HISTORICO);
    expect(historicos[0]?.numero).toBe(6); // 1 a 5 se borraron: eran las más antiguas
    expect(historicos[historicos.length - 1]?.numero).toBe(35);

    const lista = (await b.obra.get('/api/oficina/versiones')).body.versiones as { numero: number; vigente: boolean }[];
    expect(lista).toHaveLength(MAX_HISTORICO + 1);
    expect(lista.map((v) => v.numero)).toEqual(Array.from({ length: 31 }, (_, i) => 36 - i));
    expect(lista.filter((v) => v.vigente).map((v) => v.numero)).toEqual([36]);
  });
});

// ---------------------------------------------------------------------------------------------------------------

describe('historial, restaurar y descartar', () => {
  let b: Banco;
  beforeAll(async () => {
    b = await levantar();
    await publicarMapa(b.obra, mapaConSilla('Segunda'), 'Con silla'); // 2
    await publicarMapa(b.obra, mapaConPlanta('Tercera'), 'Con planta'); // 3
  });
  afterAll(async () => {
    await b.env.cerrar();
  });

  const idDe = async (numero: number) => {
    const lista = (await b.obra.get('/api/oficina/versiones')).body.versiones as { id: number; numero: number }[];
    return lista.find((v) => v.numero === numero)!.id;
  };

  it('lista las versiones de la más nueva a la más vieja, con autor, nota y cuál está vigente', async () => {
    const r = await b.obra.get('/api/oficina/versiones');
    expect(r.status).toBe(200);
    const lista = r.body.versiones as { id: number; numero: number; autor: string; nota: string; creadoEn: string; vigente: boolean }[];
    expect(lista.map((v) => [v.numero, v.vigente, v.autor, v.nota])).toEqual([
      [3, true, 'Persona obra', 'Con planta'],
      [2, false, 'Persona obra', 'Con silla'],
      [1, false, 'Sistema', 'Oficina de ejemplo'],
    ]);
    expect(lista.every((v) => Number.isInteger(v.id) && !Number.isNaN(Date.parse(v.creadoEn)))).toBe(true);
    expect(lista[0]).not.toHaveProperty('mapa');
  });

  it('restaurar copia una versión al borrador (revisión 1 si no había) y no publica nada', async () => {
    expect(await borradorActual(b.obra)).toBeNull();
    const r = await b.jefa.post(`/api/oficina/versiones/${await idDe(2)}/restaurar`);
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ numero: 2, revision: 1, problemas: [] });

    const borrador = await borradorActual(b.obra);
    expect(borrador).toMatchObject({ revision: 1, autor: 'Persona jefa' });
    expect(borrador?.mapa.nombre).toBe('Segunda');
    expect((await b.persona.get('/api/oficina')).body.numero).toBe(3); // lo vigente no se movió
  });

  it('si ya había un borrador lo reemplaza y sube su revisión', async () => {
    const guardado = await b.obra.put('/api/oficina/borrador').send({ revision: 1, mapa: compactoDePrueba('Trabajo a medias') });
    expect(guardado.body.revision).toBe(2);
    const r = await b.obra.post(`/api/oficina/versiones/${await idDe(1)}/restaurar`);
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ numero: 1, revision: 3 });
    const borrador = await borradorActual(b.obra);
    expect(borrador?.revision).toBe(3);
    expect(borrador?.mapa.nombre).toBe(plantillaNaos().nombre);
    expect(borrador?.autor).toBe('Persona obra');

    // quien tenía abierta la revisión 2 choca al guardar
    const viejo = await b.jefa.put('/api/oficina/borrador').send({ revision: 2, mapa: compactoDePrueba('Tarde') });
    expect(viejo.status).toBe(409);
  });

  it('también se puede restaurar la versión vigente', async () => {
    const r = await b.obra.post(`/api/oficina/versiones/${await idDe(3)}/restaurar`);
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ numero: 3, revision: 4 });
    expect((await borradorActual(b.obra))?.mapa.nombre).toBe('Tercera');
  });

  it('responde 404 si la versión no existe, el id es raro o es el del borrador', async () => {
    expect((await b.obra.post('/api/oficina/versiones/99999/restaurar')).status).toBe(404);
    expect((await b.obra.post('/api/oficina/versiones/abc/restaurar')).status).toBe(404);
    expect((await b.obra.post('/api/oficina/versiones/0/restaurar')).status).toBe(404);
    expect((await b.obra.post('/api/oficina/versiones/-3/restaurar')).status).toBe(404);
    const fila = await b.env.ctx.prisma.mapaOficina.findFirstOrThrow({ where: { estado: 'borrador' } });
    const r = await b.obra.post(`/api/oficina/versiones/${fila.id}/restaurar`);
    expect(r.status).toBe(404);
    expect(r.body.error).toBe('No existe esa versión.');
  });

  it('descartar borra el borrador; hacerlo otra vez responde 404', async () => {
    const r = await b.jefa.delete('/api/oficina/borrador');
    expect(r.status).toBe(200);
    expect(r.body).toEqual({ ok: true });
    expect(await borradorActual(b.obra)).toBeNull();
    expect((await b.persona.get('/api/oficina')).body.numero).toBe(3);

    const otra = await b.obra.delete('/api/oficina/borrador');
    expect(otra.status).toBe(404);
    expect(otra.body.error).toMatch(/No hay un borrador/);
  });

  it('guardar con una revisión cuando el borrador ya no existe da 409, y con null empieza otra vez en 1', async () => {
    const tarde = await b.obra.put('/api/oficina/borrador').send({ revision: 4, mapa: compactoDePrueba('Fantasma') });
    expect(tarde.status).toBe(409);
    expect(tarde.body.error).toMatch(/ya no existe/);
    expect(tarde.body.revision).toBeNull();
    expect(await borradorActual(b.obra)).toBeNull();

    const nuevo = await b.obra.put('/api/oficina/borrador').send({ revision: null, mapa: compactoDePrueba('Nuevo comienzo') });
    expect(nuevo.status).toBe(200);
    expect(nuevo.body.revision).toBe(1);
  });
});

// ---------------------------------------------------------------------------------------------------------------

describe('registro de actividad', () => {
  let b: Banco;
  beforeAll(async () => {
    b = await levantar();
  });
  afterAll(async () => {
    await b.env.cerrar();
  });

  it('registra publicar, restaurar y descartar, y no registra los guardados', async () => {
    const total = () => b.env.ctx.prisma.actividad.count();
    const antes = await total();

    // varios autoguardados seguidos
    let revision: number | null = null;
    for (let i = 0; i < 3; i++) {
      const r = await b.obra.put('/api/oficina/borrador').send({ revision, mapa: compactoDePrueba(`Autoguardado ${i}`) });
      revision = r.body.revision as number;
    }
    expect(revision).toBe(3);
    expect(await total(), 'guardar no deja rastro').toBe(antes);

    expect((await b.obra.post('/api/oficina/publicar').send({ nota: 'Cambia la silla' })).status).toBe(200);
    const primera = (await b.obra.get('/api/oficina/versiones')).body.versiones.find((v: { numero: number }) => v.numero === 1) as { id: number };
    expect((await b.obra.post(`/api/oficina/versiones/${primera.id}/restaurar`)).status).toBe(200);
    expect((await b.obra.delete('/api/oficina/borrador')).status).toBe(200);
    // los intentos fallidos tampoco dejan rastro
    expect((await b.obra.delete('/api/oficina/borrador')).status).toBe(404);
    expect((await b.persona.post('/api/oficina/publicar')).status).toBe(403);

    const filas = await b.env.ctx.prisma.actividad.findMany({ where: { accion: { startsWith: 'mapa_' } }, orderBy: { id: 'asc' } });
    expect(filas.map((f) => f.accion)).toEqual(['mapa_publicado', 'mapa_restaurado', 'mapa_borrador_descartado']);
    expect(filas.every((f) => f.usuario === 'obra' && f.ip !== '')).toBe(true);
    expect(filas[0]).toMatchObject({ objeto: 'Versión 2', detalle: 'Cambia la silla' });
    expect(filas[1]).toMatchObject({ objeto: 'Versión 1' });
    expect(filas[2]).toMatchObject({ objeto: 'Borrador' });
    expect(await total()).toBe(antes + 3);

    // el registro las muestra con su texto en español
    expect(etiquetaAccion('mapa_publicado')).toBe('Publicó una versión de la oficina');
    expect(etiquetaAccion('mapa_restaurado')).toBe('Restauró una versión de la oficina');
    expect(etiquetaAccion('mapa_borrador_descartado')).toBe('Descartó el borrador de la oficina');
    const lista = await b.jefa.get('/api/admin/actividad?accion=mapa_publicado');
    expect(lista.body.total).toBe(1);
  });
});

// ---------------------------------------------------------------------------------------------------------------

describe('cuerpos grandes', () => {
  let b: Banco;
  beforeAll(async () => {
    b = await levantar();
  });
  afterAll(async () => {
    await b.env.cerrar();
  });

  /** Mapa válido en su forma con `cantidad` objetos de 1000 caracteres de texto cada uno (más de 1 kb por objeto). */
  function compactoGrande(cantidad: number): MapaGuardado {
    const mapa = compactoDePrueba('Mapa grande');
    const texto = 'x'.repeat(1000);
    mapa.salas[0]!.colocaciones.push(
      ...Array.from({ length: cantidad }, (_, i) => ({
        id: `g${i}`,
        objeto: 'planta-grande',
        x: 1 + (i % 10),
        y: 1 + (Math.floor(i / 10) % 6),
        orientacion: 'U' as const,
        variante: 'base',
        props: { texto },
      })),
    );
    return mapa;
  }

  it('el borrador admite más de 200 kb (hasta 3 MB), pero el resto de la API no', async () => {
    const mapa = compactoGrande(300);
    const bytes = JSON.stringify({ revision: null, mapa }).length;
    expect(bytes).toBeGreaterThan(200 * 1024);
    expect(bytes).toBeLessThan(3 * 1024 * 1024);

    const r = await b.obra.put('/api/oficina/borrador').send({ revision: null, mapa });
    expect(r.status).toBe(200);
    expect((await borradorActual(b.obra))?.mapa.salas[0]!.colocaciones).toHaveLength(302);

    // el mismo cuerpo en otras rutas se corta con el límite de siempre
    const publicar = await b.obra.post('/api/oficina/publicar').send({ nota: 'x', relleno: mapa });
    expect(publicar.status).toBe(413);
    expect(publicar.body.error).toBe('El envío es demasiado grande.');
    const ajustes = await b.jefa.put('/api/admin/ajustes').send({ cambios: {}, relleno: mapa });
    expect(ajustes.status).toBe(413);
  });

  it('pasados los 3 MB, también el borrador responde 413', async () => {
    const mapa = compactoGrande(3100);
    expect(JSON.stringify({ revision: 1, mapa }).length).toBeGreaterThan(3 * 1024 * 1024);
    const r = await b.obra.put('/api/oficina/borrador').send({ revision: 1, mapa });
    expect(r.status).toBe(413);
    expect(r.body.error).toBe('El envío es demasiado grande.');
    expect((await borradorActual(b.obra))?.revision).toBe(1);
  });

  it('el límite grande solo se concede a quien puede construir: sin permiso ni se lee el cuerpo', async () => {
    const mapa = compactoGrande(3100); // pasa de 3 MB: si se leyera antes de revisar el permiso, la respuesta sería 413
    for (const quien of [cliente(b.env.app), b.persona]) {
      // El servidor responde sin leer el cuerpo y cierra la conexión: según el momento, el cliente ve la
      // respuesta o ve el reinicio de la conexión mientras todavía estaba enviando.
      const resultado = await quien.put('/api/oficina/borrador').send({ revision: 1, mapa }).then(
        (r) => r.status,
        (e: unknown) => String(e),
      );
      if (typeof resultado === 'number') expect([401, 403]).toContain(resultado);
      else expect(resultado).toMatch(/ECONNRESET|EPIPE|socket hang up/);
    }
    expect((await borradorActual(b.obra))?.revision).toBe(1); // nada se guardó
  });
});

// ---------------------------------------------------------------------------------------------------------------

describe('persistencia', () => {
  it('lo publicado y el borrador sobreviven a un reinicio del servidor', async () => {
    const b = await levantar();
    try {
      await publicarMapa(b.obra, mapaConSilla('Sobrevive'), 'Antes de reiniciar');
      await b.obra.put('/api/oficina/borrador').send({ revision: null, mapa: compactoDePrueba('Borrador pendiente') });

      // un servicio nuevo sobre la misma base es lo que ocurre al arrancar de nuevo
      const reiniciado = new ServicioOficina(b.env.ctx);
      await reiniciado.cargar();
      expect(reiniciado.numeroPublicado()).toBe(2);
      expect(reiniciado.publicado()).toMatchObject({ numero: 2, nota: 'Antes de reiniciar', autor: 'Persona obra' });
      expect(reiniciado.publicado().mapa.nombre).toBe('Sobrevive');
      expect((await reiniciado.borrador())?.mapa.nombre).toBe('Borrador pendiente');
      expect(reiniciado.proveedorSalas().sala('principal')).toMatchObject({ ancho: 12, alto: 8 });
      expect(await b.env.ctx.prisma.mapaOficina.count({ where: { estado: 'publicado' } })).toBe(1);
    } finally {
      await b.env.cerrar();
    }
  });
});
