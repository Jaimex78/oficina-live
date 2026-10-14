import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { WebSocket } from 'ws';
import type { MensajeCliente, MensajeServidor } from '@ol/shared';
import { armarEnlace, limpiarTitulo } from '../src/teams/enlaces';
import { ServidorPresencia, type ProveedorSalas } from '../src/presencia/servidor';
import { cliente, crearCuenta, crearEntorno, ingresar, type Entorno } from './ayudas';

/** Un cliente mínimo de la presencia. */
class Conectado {
  readonly mensajes: MensajeServidor[] = [];
  readonly ws: WebSocket;
  constructor(url: string, origen: string) {
    this.ws = new WebSocket(url, { headers: { Origin: origen } });
    this.ws.on('message', (d) => this.mensajes.push(JSON.parse(d.toString()) as MensajeServidor));
  }
  enviar(m: MensajeCliente): void {
    this.ws.send(JSON.stringify(m));
  }
  async esperar<T extends MensajeServidor['t']>(tipo: T, ms = 2000): Promise<Extract<MensajeServidor, { t: T }>> {
    const fin = Date.now() + ms;
    for (;;) {
      const i = this.mensajes.findIndex((m) => m.t === tipo);
      if (i >= 0) return this.mensajes.splice(i, 1)[0] as Extract<MensajeServidor, { t: T }>;
      if (Date.now() > fin) throw new Error(`No llegó «${tipo}»`);
      await new Promise((ok) => setTimeout(ok, 15));
    }
  }
  async nada(tipo: MensajeServidor['t'], ms = 250): Promise<void> {
    await new Promise((ok) => setTimeout(ok, ms));
    expect(this.mensajes.filter((m) => m.t === tipo)).toEqual([]);
  }
}

/** Cuatro llegadas dentro de la sala y una afuera. Después de la primera prueba se quita la de afuera para que las llegadas no dependan del orden. */
const LLEGADAS = [
  { x: 5, y: 5 },
  { x: 6, y: 5 },
  { x: 5, y: 6 },
  { x: 6, y: 6 },
  { x: 30, y: 30 },
];

const NOMBRE_LARGO = `Sala\n\tde  reuniones ${'muy larga '.repeat(8)}`;

/** Una sala de reuniones (casillas 4 a 7 en x, 4 a 6 en y) y otra con nombre larguísimo y caracteres de control. Cuatro llegadas dentro de la primera y una afuera. */
const SALAS: ProveedorSalas = {
  inicial: () => 'principal',
  sala: (id) =>
    id === 'principal'
      ? {
          id,
          ancho: 60,
          alto: 40,
          llegadas: LLEGADAS,
          zonas: [
            { id: 'z-sala', tipo: 'sala', nombre: 'Sala Norte', rect: { x: 4, y: 4, w: 4, h: 3 } },
            { id: 'z-larga', tipo: 'sala', nombre: NOMBRE_LARGO, rect: { x: 4, y: 4, w: 4, h: 3 } },
            { id: 'z-abierta', tipo: 'abierta', nombre: 'Piso Naos', rect: { x: 0, y: 0, w: 60, h: 40 } },
          ],
        }
      : undefined,
};

describe('enlaces de Teams (funciones)', () => {
  it('arma chat y llamada con codificación correcta y el esquema de la aplicación', () => {
    const c = armarEnlace('chat', ['ana+x@ejemplo.com', 'luis@ejemplo.com'], 'Sala Norte & Co');
    expect(c.url).toBe('https://teams.microsoft.com/l/chat/0/0?users=ana%2Bx%40ejemplo.com,luis%40ejemplo.com&topicName=Sala%20Norte%20%26%20Co');
    expect(c.urlApp).toBe(c.url.replace('https://', 'msteams://'));
    expect(armarEnlace('llamada', ['ana@ejemplo.com']).url).toBe('https://teams.microsoft.com/l/call/0/0?users=ana%40ejemplo.com');
  });
  it('un chat con una sola persona no lleva título', () => {
    expect(armarEnlace('chat', ['ana@ejemplo.com'], 'Algo').url).toBe('https://teams.microsoft.com/l/chat/0/0?users=ana%40ejemplo.com');
  });
  it('limpia el título: sin control, espacios simples, 50 caracteres sin partir emojis', () => {
    expect(limpiarTitulo('  Sala\n\tNorte \u0007  ')).toBe('Sala Norte');
    expect(limpiarTitulo(NOMBRE_LARGO).length).toBeLessThanOrEqual(50);
    const t = limpiarTitulo('😀'.repeat(60));
    expect(Array.from(t)).toHaveLength(50);
  });
});

describe('POST /api/teams/enlace', () => {
  let env: Entorno;
  let presencia: ServidorPresencia;
  let servidor: http.Server;
  let url: string;
  let origen: string;
  const abiertos: Conectado[] = [];
  const ids: Record<string, number> = {};
  const tokens: Record<string, string> = {};

  const api = (u: string) => cliente(env.app, tokens[u]);
  const pedir = (u: string, cuerpo: unknown) => api(u).post('/api/teams/enlace').send(cuerpo as object);
  const conectar = async (u: string): Promise<Conectado> => {
    const p = new Conectado(url, origen);
    abiertos.push(p);
    await new Promise<void>((ok) => p.ws.once('open', () => ok()));
    p.enviar({ t: 'hola', token: tokens[u]! });
    p.enviar({ t: 'entrar' });
    await p.esperar('bienvenida');
    return p;
  };
  const desconectar = async () => {
    for (const p of abiertos.splice(0)) p.ws.terminate();
    await new Promise((ok) => setTimeout(ok, 60));
  };

  beforeAll(async () => {
    env = await crearEntorno();
    presencia = new ServidorPresencia(env.ctx, { salas: SALAS, tickMs: 20, revisarAusenciaMs: 3_600_000, plazoHolaMs: 300 });
    env.ctx.presencia = presencia;
    servidor = http.createServer(env.app);
    servidor.on('upgrade', (req, socket, head) => {
      if (!presencia.manejarUpgrade(req, socket, head)) socket.destroy();
    });
    await new Promise<void>((ok) => servidor.listen(0, '127.0.0.1', ok));
    const puerto = (servidor.address() as AddressInfo).port;
    url = `ws://127.0.0.1:${puerto}/ws`;
    origen = `http://127.0.0.1:${puerto}`;
    for (const u of ['ana', 'beto', 'cami', 'dani', 'eli', 'sincorreo', 'baja']) {
      const cuenta = await crearCuenta(env.ctx, u, 'usuario', u === 'sincorreo' ? {} : { correo: `${u}@ejemplo.com` });
      ids[u] = cuenta.id;
      tokens[u] = await ingresar(env.app, u);
    }
    await env.ctx.prisma.usuario.update({ where: { id: ids['baja']! }, data: { activo: false } });
  });
  afterAll(async () => {
    await desconectar();
    await presencia.detener();
    await new Promise<void>((ok) => servidor.close(() => ok()));
    await env.cerrar();
  });

  it('exige sesión y la cabecera de la aplicación', async () => {
    const sin = await cliente(env.app).post('/api/teams/enlace').send({ tipo: 'chat', personas: [ids['beto']] });
    expect(sin.status).toBe(401);
    const sinCabecera = await (await import('supertest')).default(env.app).post('/api/teams/enlace').set('Authorization', `Bearer ${tokens['ana']}`).send({ tipo: 'chat', personas: [ids['beto']] });
    expect(sinCabecera.status).toBe(403);
  });

  it('chat de una persona: enlace con su correo, sin título, y sin correos fuera del enlace', async () => {
    const r = await pedir('ana', { tipo: 'chat', personas: [ids['beto']] });
    expect(r.status).toBe(200);
    expect(r.body).toEqual({ url: 'https://teams.microsoft.com/l/chat/0/0?users=beto%40ejemplo.com', urlApp: 'msteams://teams.microsoft.com/l/chat/0/0?users=beto%40ejemplo.com', titulo: '', invitados: 1 });
    const { url: u, urlApp, ...resto } = r.body as Record<string, unknown>;
    expect(JSON.stringify(resto)).not.toMatch(/@|ejemplo\.com/);
    expect(typeof u).toBe('string');
    expect(typeof urlApp).toBe('string');
  });

  it('llamada y chat grupal con título «Conversación en <lugar>»', async () => {
    const ll = await pedir('ana', { tipo: 'llamada', personas: [ids['beto']] });
    expect(ll.body.url).toBe('https://teams.microsoft.com/l/call/0/0?users=beto%40ejemplo.com');
    const g = await pedir('ana', { tipo: 'chat', personas: [ids['beto'], ids['cami']], lugar: 'Piso 2' });
    expect(g.status).toBe(200);
    expect(g.body.titulo).toBe('Conversación en Piso 2');
    expect(g.body.url).toContain('users=beto%40ejemplo.com,cami%40ejemplo.com');
    expect(g.body.url).toContain('topicName=Conversaci%C3%B3n%20en%20Piso%202');
    expect(g.body.invitados).toBe(2);
  });

  it('valida las personas: inexistentes, inactivas, yo mismo, sin correo, demasiadas y cuerpos raros', async () => {
    expect((await pedir('ana', { tipo: 'chat', personas: [999999] })).status).toBe(404);
    expect((await pedir('ana', { tipo: 'chat', personas: [ids['baja']] })).status).toBe(404);
    expect((await pedir('ana', { tipo: 'chat', personas: [ids['ana']] })).status).toBe(400);
    const sc = await pedir('ana', { tipo: 'chat', personas: [ids['sincorreo']] });
    expect(sc.status).toBe(409);
    expect(sc.body.error).toMatch(/no tiene correo/);
    expect((await pedir('ana', { tipo: 'chat', personas: Array.from({ length: 21 }, (_, i) => i + 1) })).status).toBe(400);
    expect((await pedir('ana', { tipo: 'chat' })).status).toBe(400);
    expect((await pedir('ana', { tipo: 'chat', personas: [ids['beto']], sala: 'z-sala' })).status).toBe(400);
    expect((await pedir('ana', { tipo: 'correo', personas: [ids['beto']] })).status).toBe(400);
    expect((await pedir('ana', { tipo: 'chat', personas: ['x'] })).status).toBe(400);
  });

  it('en un grupo, quien no tiene correo se omite mientras alguien sí lo tenga', async () => {
    const r = await pedir('ana', { tipo: 'chat', personas: [ids['beto'], ids['sincorreo']] });
    expect(r.status).toBe(200);
    expect(r.body.invitados).toBe(1);
    expect(r.body.url).toBe('https://teams.microsoft.com/l/chat/0/0?users=beto%40ejemplo.com');
  });

  it('sala: invita a quienes están dentro ahora, con el nombre de la sala, sin contarme; solo en la sala es 409', async () => {
    await conectar('ana');
    const solo = await pedir('ana', { tipo: 'chat', sala: 'z-sala' });
    expect(solo.status).toBe(409);
    expect(solo.body.error).toMatch(/solo en la sala/);

    await conectar('beto');
    const dos = await pedir('ana', { tipo: 'chat', sala: 'z-sala' });
    expect(dos.status).toBe(200);
    expect(dos.body).toMatchObject({ titulo: 'Sala Norte', invitados: 1, url: 'https://teams.microsoft.com/l/chat/0/0?users=beto%40ejemplo.com' });

    await conectar('cami');
    const tres = await pedir('ana', { tipo: 'chat', sala: 'z-sala' });
    expect(tres.body.invitados).toBe(2);
    expect(tres.body.titulo).toBe('Sala Norte');
    expect(tres.body.url).toBe('https://teams.microsoft.com/l/chat/0/0?users=beto%40ejemplo.com,cami%40ejemplo.com&topicName=Sala%20Norte');
    expect(tres.body.url).not.toContain('ana%40');
    const { url: _u, urlApp: _a, ...resto } = tres.body as Record<string, unknown>;
    expect(JSON.stringify(resto)).not.toMatch(/@/);

    const llamada = await pedir('ana', { tipo: 'llamada', sala: 'z-sala' });
    expect(llamada.body.url).toBe('https://teams.microsoft.com/l/call/0/0?users=beto%40ejemplo.com,cami%40ejemplo.com');

    // quien está afuera no entra al chat de la sala
    await conectar('dani'); // cuarta llegada, todavía dentro
    await conectar('eli'); // quinta llegada, afuera de la sala
    const igual = await pedir('ana', { tipo: 'chat', sala: 'z-sala' });
    expect(igual.body.invitados).toBe(3);
    expect(igual.body.url).toContain('dani%40');
    expect(igual.body.url).not.toContain('eli%40');
    LLEGADAS.length = 4;
    await desconectar();
  });

  it('sala: quien está invisible no se invita; sala inexistente o sin presencia da 409', async () => {
    await conectar('ana');
    const beto = await conectar('beto');
    beto.enviar({ t: 'estado', invisible: true });
    await new Promise((ok) => setTimeout(ok, 120));
    expect((await pedir('ana', { tipo: 'chat', sala: 'z-sala' })).status).toBe(409);
    expect((await pedir('ana', { tipo: 'chat', sala: 'no-existe' })).status).toBe(409);
    await desconectar();
    expect((await pedir('ana', { tipo: 'chat', sala: 'z-sala' })).status).toBe(409); // ni siquiera estoy en la oficina
    await env.ctx.prisma.usuario.update({ where: { id: ids['beto']! }, data: { invisible: false } });
  });

  it('el título se limpia y se acorta a 50 caracteres', async () => {
    await conectar('ana');
    await conectar('beto');
    await conectar('cami');
    const r = await pedir('ana', { tipo: 'chat', sala: 'z-larga' });
    expect(r.status).toBe(200);
    expect(r.body.titulo).not.toMatch(/[\n\t]/);
    expect(Array.from(r.body.titulo as string).length).toBeLessThanOrEqual(50);
    expect((r.body.titulo as string).startsWith('Sala de reuniones muy larga')).toBe(true);
    expect(decodeURIComponent((r.body.url as string).split('topicName=')[1]!)).toBe(r.body.titulo);
    await desconectar();
  });

  it('limita los intentos por persona (30 por minuto) sin afectar a las demás', async () => {
    const estados: number[] = [];
    for (let i = 0; i < 40; i++) estados.push((await pedir('dani', { tipo: 'chat', personas: [ids['beto']] })).status);
    const ok = estados.filter((e) => e === 200).length;
    expect(ok).toBeGreaterThan(0);
    expect(ok).toBeLessThanOrEqual(30);
    expect(estados[estados.length - 1]).toBe(429);
    expect((await pedir('cami', { tipo: 'chat', personas: [ids['beto']] })).status).toBe(200);
  });
});

describe('GET /api/oficina/miembros y saludo a distancia', () => {
  let env: Entorno;
  let presencia: ServidorPresencia;
  let servidor: http.Server;
  let url: string;
  let origen: string;
  const abiertos: Conectado[] = [];
  const ids: Record<string, number> = {};
  const tokens: Record<string, string> = {};

  const conectar = async (u: string): Promise<Conectado> => {
    const p = new Conectado(url, origen);
    abiertos.push(p);
    await new Promise<void>((ok) => p.ws.once('open', () => ok()));
    p.enviar({ t: 'hola', token: tokens[u]! });
    p.enviar({ t: 'entrar' });
    await p.esperar('bienvenida');
    return p;
  };

  beforeAll(async () => {
    env = await crearEntorno();
    presencia = new ServidorPresencia(env.ctx, { salas: SALAS, tickMs: 20, revisarAusenciaMs: 3_600_000, plazoHolaMs: 300 });
    env.ctx.presencia = presencia;
    servidor = http.createServer(env.app);
    servidor.on('upgrade', (req, socket, head) => {
      if (!presencia.manejarUpgrade(req, socket, head)) socket.destroy();
    });
    await new Promise<void>((ok) => servidor.listen(0, '127.0.0.1', ok));
    const puerto = (servidor.address() as AddressInfo).port;
    url = `ws://127.0.0.1:${puerto}/ws`;
    origen = `http://127.0.0.1:${puerto}`;
    for (const u of ['ana', 'beto', 'cami', 'baja']) {
      const cuenta = await crearCuenta(env.ctx, u, 'usuario', { correo: `${u}@ejemplo.com`, nombre: `Persona ${u}` });
      ids[u] = cuenta.id;
      tokens[u] = await ingresar(env.app, u);
    }
    await env.ctx.prisma.usuario.update({ where: { id: ids['baja']! }, data: { activo: false } });
    await env.ctx.prisma.usuario.update({ where: { id: ids['cami']! }, data: { apodo: 'Cami', etiquetaLugar: 'remoto' } });
  });
  afterAll(async () => {
    for (const p of abiertos.splice(0)) p.ws.terminate();
    await presencia.detener();
    await new Promise<void>((ok) => servidor.close(() => ok()));
    await env.cerrar();
  });

  it('la lista de miembros pide sesión, trae a todas las personas activas y no trae correos', async () => {
    expect((await cliente(env.app).get('/api/oficina/miembros')).status).toBe(401);
    const r = await cliente(env.app, tokens['ana']).get('/api/oficina/miembros');
    expect(r.status).toBe(200);
    const m = r.body.miembros as { id: number; nombre: string; apodo: string; cargo: string; lugar: string; foto: number; avatar: unknown; enLinea: boolean }[];
    expect(m.map((x) => x.nombre).sort()).toEqual(['Persona ana', 'Persona beto', 'Persona cami']);
    expect(m.every((x) => x.enLinea === false)).toBe(true);
    expect(m.find((x) => x.id === ids['cami'])).toMatchObject({ apodo: 'Cami', lugar: 'remoto', foto: 0 });
    expect(JSON.stringify(r.body)).not.toMatch(/@|correo|ejemplo\.com/i);
    expect(Object.keys(m[0]!).sort()).toEqual(['apodo', 'avatar', 'cargo', 'enLinea', 'foto', 'id', 'lugar', 'nombre']);
  });

  it('distingue en línea de sin conexión, y quien está invisible aparece sin conexión', async () => {
    await conectar('ana');
    const beto = await conectar('beto');
    const pedirLista = async () => {
      const r = await cliente(env.app, tokens['cami']).get('/api/oficina/miembros');
      return Object.fromEntries((r.body.miembros as { id: number; enLinea: boolean }[]).map((x) => [x.id, x.enLinea]));
    };
    expect(await pedirLista()).toEqual({ [ids['ana']!]: true, [ids['beto']!]: true, [ids['cami']!]: false });
    beto.enviar({ t: 'estado', invisible: true });
    await new Promise((ok) => setTimeout(ok, 120));
    expect(await pedirLista()).toMatchObject({ [ids['ana']!]: true, [ids['beto']!]: false });
    beto.ws.terminate();
    await new Promise((ok) => setTimeout(ok, 120));
    expect(await pedirLista()).toMatchObject({ [ids['ana']!]: true, [ids['beto']!]: false });
  });

  it('el saludo llega solo a quien está en línea, confirma a quien saluda y tiene límite por destino', async () => {
    const ana = await conectar('ana');
    const cami = await conectar('cami');
    ana.enviar({ t: 'saludo', a: ids['cami']! });
    const recibido = await cami.esperar('saludo');
    expect(recibido).toEqual({ t: 'saludo', de: ids['ana'], nombre: 'Persona ana' });
    expect(await ana.esperar('saludo-resultado')).toEqual({ t: 'saludo-resultado', a: ids['cami'], estado: 'entregado' });
    // otro saludo enseguida: límite, y a cami no le llega
    ana.enviar({ t: 'saludo', a: ids['cami']! });
    expect((await ana.esperar('saludo-resultado')).estado).toBe('limite');
    await cami.nada('saludo');
    // el límite es por destino y por quien saluda
    cami.enviar({ t: 'saludo', a: ids['ana']! });
    expect(await ana.esperar('saludo')).toMatchObject({ de: ids['cami'], nombre: 'Cami' });
  });

  it('saludar a alguien sin conexión, a uno mismo o a alguien invisible no entrega nada', async () => {
    const ana = await conectar('ana');
    ana.enviar({ t: 'saludo', a: ids['beto']! });
    expect(await ana.esperar('saludo-resultado')).toEqual({ t: 'saludo-resultado', a: ids['beto'], estado: 'sin-conexion' });
    ana.enviar({ t: 'saludo', a: ids['ana']! });
    await ana.nada('saludo-resultado');
    const beto = await conectar('beto');
    beto.enviar({ t: 'estado', invisible: true });
    await new Promise((ok) => setTimeout(ok, 120));
    await new Promise((ok) => setTimeout(ok, 10_100)); // pasa la espera del destino anterior
    ana.enviar({ t: 'saludo', a: ids['beto']! });
    expect((await ana.esperar('saludo-resultado')).estado).toBe('sin-conexion');
    await beto.nada('saludo');
    ana.enviar({ t: 'saludo', a: 'x' as unknown as number }); // mal formado: se descarta
    await ana.nada('saludo-resultado');
  }, 20_000);
});
