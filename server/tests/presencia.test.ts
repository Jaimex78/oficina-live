import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { WebSocket } from 'ws';
import type { AvatarSpec, MensajeCliente, MensajeServidor } from '@ol/shared';
import { oficinaAbierta } from '../src/presencia/horario';
import { ServidorPresencia, type OpcionesPresencia, type ProveedorSalas } from '../src/presencia/servidor';
import { cliente, crearCuenta, crearEntorno, ingresar, sesionComo, type Entorno } from './ayudas';
import { mapaConPlanta, mapaConSilla, mapaSoloAnexo, publicarMapa } from './mapas';

type Tipo = MensajeServidor['t'];

/** Cliente de pruebas: guarda lo que llega y deja esperar un mensaje concreto. */
class Persona {
  readonly mensajes: MensajeServidor[] = [];
  cierre: { codigo: number; razon: string } | null = null;
  /** Dónde lo puso el servidor al entrar. */
  pos = { x: 0, y: 0 };
  private avisos: Array<() => void> = [];
  readonly ws: WebSocket;

  constructor(url: string, origen?: string) {
    this.ws = new WebSocket(url, origen ? { headers: { Origin: origen } } : undefined);
    this.ws.on('message', (d) => {
      const m = JSON.parse(d.toString()) as MensajeServidor;
      if (m.t === 'bienvenida') this.pos = { x: m.yo.x, y: m.yo.y };
      this.mensajes.push(m);
      this.despertar();
    });
    this.ws.on('close', (codigo, razon) => {
      this.cierre = { codigo, razon: razon.toString() };
      this.despertar();
    });
    this.ws.on('error', () => this.despertar());
  }

  private despertar(): void {
    for (const f of this.avisos.splice(0)) f();
  }

  abierto(): Promise<void> {
    return new Promise((ok, mal) => {
      if (this.ws.readyState === WebSocket.OPEN) return ok();
      this.ws.once('open', () => ok());
      this.ws.once('error', (e) => mal(e));
    });
  }

  enviar(m: MensajeCliente | object): void {
    this.ws.send(JSON.stringify(m));
  }

  private async espera(ms: number): Promise<void> {
    await new Promise<void>((ok) => {
      const t = setTimeout(ok, ms);
      this.avisos.push(() => {
        clearTimeout(t);
        ok();
      });
    });
  }

  /** Espera y consume el primer mensaje de ese tipo (y que cumpla el filtro, si hay). */
  async esperar<T extends Tipo>(tipo: T, filtro?: (m: Extract<MensajeServidor, { t: T }>) => boolean, ms = 2000): Promise<Extract<MensajeServidor, { t: T }>> {
    const fin = Date.now() + ms;
    for (;;) {
      const i = this.mensajes.findIndex((m) => m.t === tipo && (!filtro || filtro(m as Extract<MensajeServidor, { t: T }>)));
      if (i >= 0) return this.mensajes.splice(i, 1)[0] as Extract<MensajeServidor, { t: T }>;
      const resto = fin - Date.now();
      if (resto <= 0) throw new Error(`No llegó «${tipo}». Llegaron: ${JSON.stringify(this.mensajes.map((m) => m.t))}`);
      await this.espera(resto);
    }
  }

  /** Comprueba que NO llega un mensaje de ese tipo en ese tiempo. */
  async nada(tipo: Tipo, ms = 250): Promise<void> {
    await this.espera(ms);
    const hay = this.mensajes.filter((m) => m.t === tipo);
    expect(hay, `no debía llegar «${tipo}»`).toEqual([]);
  }

  async cerrado(ms = 2000): Promise<{ codigo: number; razon: string }> {
    const fin = Date.now() + ms;
    while (!this.cierre) {
      const resto = fin - Date.now();
      if (resto <= 0) throw new Error('La conexión no se cerró.');
      await this.espera(resto);
    }
    return this.cierre;
  }
}

interface Banco {
  env: Entorno;
  presencia: ServidorPresencia;
  servidor: http.Server;
  url: string;
  puerto: number;
  gente: Persona[];
  conectar(usuario: string, opciones?: { entrar?: boolean; token?: string }): Promise<Persona>;
  detener(): Promise<void>;
}

/** `conOficina` hace que la presencia lea las salas del mapa publicado, como en producción. Sin ella se usan las salas por defecto. */
async function levantar(extra: OpcionesPresencia & { conOficina?: boolean } = {}): Promise<Banco> {
  const { conOficina, ...opciones } = extra;
  const env = await crearEntorno();
  const presencia = new ServidorPresencia(env.ctx, {
    tickMs: 20,
    revisarAusenciaMs: 3_600_000,
    plazoHolaMs: 300,
    ...(conOficina ? { salas: env.ctx.oficina.proveedorSalas() } : {}),
    ...opciones,
  });
  env.ctx.presencia = presencia;
  const servidor = http.createServer(env.app);
  servidor.on('upgrade', (req, socket, head) => {
    if (!presencia.manejarUpgrade(req, socket, head)) socket.destroy();
  });
  await new Promise<void>((ok) => servidor.listen(0, '127.0.0.1', ok));
  const puerto = (servidor.address() as AddressInfo).port;
  const url = `ws://127.0.0.1:${puerto}/ws`;
  const gente: Persona[] = [];
  return {
    env,
    presencia,
    servidor,
    url,
    puerto,
    gente,
    async conectar(usuario, opciones = {}) {
      const token = opciones.token ?? (await ingresar(env.app, usuario));
      const p = new Persona(url, `http://127.0.0.1:${puerto}`);
      gente.push(p);
      await p.abierto();
      p.enviar({ t: 'hola', token });
      if (opciones.entrar !== false) {
        p.enviar({ t: 'entrar' });
        await p.esperar('bienvenida');
      }
      return p;
    },
    async detener() {
      for (const p of gente) p.ws.terminate();
      await presencia.detener();
      await new Promise<void>((ok) => servidor.close(() => ok()));
      await env.cerrar();
    },
  };
}

/** Sala con tres llegadas: dos juntas y una lejos, para probar el chat por cercanía. */
const SALA_TRES: ProveedorSalas = {
  inicial: () => 'principal',
  sala: (id) =>
    id === 'principal'
      ? {
          id,
          ancho: 60,
          alto: 40,
          llegadas: [
            { x: 5, y: 5 },
            { x: 6, y: 5 },
            { x: 45, y: 30 },
          ],
        }
      : undefined,
};

describe('horario de oficina', () => {
  const base = { activo: true, dias: '1,2,3,4,5', desde: '08:00', hasta: '18:00', zona: 'America/Bogota' };

  it('abre solo en los días y horas configurados, en la zona horaria elegida', () => {
    expect(oficinaAbierta({ ...base, activo: false }, new Date('2026-10-04T03:00:00Z'))).toBe(true); // sin horario: siempre
    expect(oficinaAbierta(base, new Date('2026-10-05T14:00:00Z'))).toBe(true); // lunes 09:00 en Bogotá
    expect(oficinaAbierta(base, new Date('2026-10-05T22:59:00Z'))).toBe(true); // lunes 17:59
    expect(oficinaAbierta(base, new Date('2026-10-05T23:00:00Z'))).toBe(false); // lunes 18:00 ya cerró
    expect(oficinaAbierta(base, new Date('2026-10-05T12:59:00Z'))).toBe(false); // lunes 07:59 aún no abre
    expect(oficinaAbierta(base, new Date('2026-10-10T16:00:00Z'))).toBe(false); // sábado
    expect(oficinaAbierta({ ...base, zona: 'UTC' }, new Date('2026-10-05T12:59:00Z'))).toBe(true); // en UTC ya son las 12:59
  });
});

describe('presencia por WebSocket', () => {
  let b: Banco;
  beforeAll(async () => {
    b = await levantar();
    for (const u of ['ana', 'beto', 'carla']) await crearCuenta(b.env.ctx, u, 'usuario');
    await crearCuenta(b.env.ctx, 'jefa', 'admin');
  });
  afterEach(async () => {
    for (const p of b.gente.splice(0)) p.ws.terminate();
    await new Promise((ok) => setTimeout(ok, 40));
  });
  afterAll(async () => {
    await b.detener();
  });

  it('cierra a quien no se identifica a tiempo o trae un token inválido', async () => {
    const callado = new Persona(b.url, `http://127.0.0.1:${b.puerto}`);
    b.gente.push(callado);
    await callado.abierto();
    expect((await callado.cerrado()).codigo).toBe(4005);

    const falso = await b.conectar('ana', { entrar: false, token: 'x'.repeat(40) });
    expect((await falso.cerrado()).codigo).toBe(4004);
  });

  it('no deja pasar a una cuenta desactivada ni a quien aún debe cambiar su clave', async () => {
    const u = await crearCuenta(b.env.ctx, 'baja', 'usuario');
    const token = await ingresar(b.env.app, 'baja');
    await b.env.ctx.prisma.usuario.update({ where: { id: u.id }, data: { activo: false } });
    const p = await b.conectar('baja', { entrar: false, token });
    expect((await p.cerrado()).codigo).toBe(4004);
  });

  it('rechaza el origen de un sitio ajeno', async () => {
    const ajeno = new Persona(b.url, 'http://sitio-ajeno.example');
    b.gente.push(ajeno);
    await expect(ajeno.abierto()).rejects.toThrow(/403/);
  });

  it('dos personas se ven entrar, moverse y salir; nadie recibe sus propios movimientos', async () => {
    const ana = await b.conectar('ana');
    const beto = await b.conectar('beto');

    const entra = await ana.esperar('entra');
    expect(entra.persona.nombre).toBe('Persona beto');
    expect(entra.persona.sala).toBe('principal');

    beto.enviar({ t: 'mover', x: 200, y: 180, dir: 'E', anim: 'caminar' });
    const movimiento = (await ana.esperar('movimientos')).lista[0];
    expect(movimiento).toMatchObject({ id: entra.persona.id, x: 200, y: 180, dir: 'E', anim: 'caminar' });
    await beto.nada('movimientos');

    beto.ws.close();
    expect((await ana.esperar('sale')).id).toBe(entra.persona.id);
  });

  it('quien llega después recibe a los que ya estaban', async () => {
    const ana = await b.conectar('ana');
    const beto = await b.conectar('beto', { entrar: false });
    beto.enviar({ t: 'entrar' });
    const hola = await beto.esperar('bienvenida');
    expect(hola.personas.map((p) => p.nombre)).toEqual(['Persona ana']);
    expect(hola.yo.nombre).toBe('Persona beto');
    expect(hola.ajustes.distanciaCercania).toBe(3);
    expect(hola.mapa).toBe(0); // las salas por defecto no vienen de un mapa publicado
    await ana.esperar('entra');
  });

  it('la mascota de una persona la ven los demás al entrar y al cambiar, y desaparece si le quitan el paquete', async () => {
    const carla = await b.env.ctx.prisma.usuario.findFirstOrThrow({ where: { usuario: 'carla' } });
    const spec = JSON.parse(carla.personaje!) as AvatarSpec;
    await b.env.ctx.prisma.usuario.update({ where: { id: carla.id }, data: { acceso: JSON.stringify(['mascotas']), personaje: JSON.stringify({ ...spec, mascota: { id: 'zorro', color: 'nieve', nombre: 'Copo' } }) } });
    const ana = await b.conectar('ana');
    const c = await b.conectar('carla');
    expect((await ana.esperar('entra')).persona.avatar?.mascota).toEqual({ id: 'zorro', color: 'nieve', nombre: 'Copo' });
    expect(c).toBeDefined();
    // Cambia de mascota desde su cuenta: Ana lo ve al instante.
    const api = cliente(b.env.app, await ingresar(b.env.app, 'carla'));
    const nuevo = await api.put('/api/cuenta/perfil').send({ personaje: { ...spec, mascota: { id: 'nube', color: 'rosa' } } });
    expect(nuevo.status).toBe(200);
    expect((await ana.esperar('avatar', (m) => m.avatar?.mascota?.id === 'nube')).avatar?.mascota).toEqual({ id: 'nube', color: 'rosa' });
    // La administración le quita el paquete: la mascota se va para todos.
    const admin = cliente(b.env.app, await ingresar(b.env.app, 'jefa'));
    expect((await admin.patch(`/api/admin/usuarios/${carla.id}`).send({ acceso: [] })).status).toBe(200);
    expect((await ana.esperar('avatar', (m) => m.avatar !== null && m.avatar.mascota === undefined)).avatar?.peinado).toBe(spec.peinado);
  });

  it('quien cambia su perfil también recibe el aviso (así ve su foto nueva al instante)', async () => {
    const carla = await b.env.ctx.prisma.usuario.findFirstOrThrow({ where: { usuario: 'carla' } });
    const c = await b.conectar('carla');
    const api = cliente(b.env.app, await ingresar(b.env.app, 'carla'));
    expect((await api.put('/api/cuenta/perfil').send({ personaje: { ...JSON.parse(carla.personaje!), mascota: undefined } })).status).toBe(200);
    expect((await c.esperar('avatar', (m) => m.id === carla.id)).id).toBe(carla.id);
  });

  it('no acepta saltos imposibles: corrige a la persona y nadie más los ve', async () => {
    const ana = await b.conectar('ana');
    const beto = await b.conectar('beto');
    await ana.esperar('entra');
    beto.enviar({ t: 'mover', x: 900, y: 900, dir: 'S', anim: 'caminar' });
    const c = await beto.esperar('corregir');
    expect(c.x).toBeLessThan(400);
    await ana.nada('movimientos');
  });

  it('las reacciones con emoji las ven los demás, no quien reacciona, y no se acepta texto libre ni spam', async () => {
    const ana = await b.conectar('ana');
    const beto = await b.conectar('beto');
    const entra = await ana.esperar('entra');
    beto.enviar({ t: 'reaccion', emoji: '👋' });
    expect(await ana.esperar('reaccion')).toEqual({ t: 'reaccion', id: entra.persona.id, emoji: '👋' });
    await beto.nada('reaccion');
    beto.enviar({ t: 'reaccion', emoji: '❤️' });
    expect((await ana.esperar('reaccion')).emoji).toBe('❤️');
    beto.enviar({ t: 'reaccion', emoji: 'hola' });
    beto.enviar({ t: 'reaccion', emoji: '👋'.repeat(9) });
    await ana.nada('reaccion');
    for (let i = 0; i < 12; i++) beto.enviar({ t: 'reaccion', emoji: '🎉' });
    await new Promise((ok) => setTimeout(ok, 120));
    expect(ana.mensajes.filter((m) => m.t === 'reaccion').length).toBeLessThanOrEqual(8);
  });

  it('un cliente que manda muchos pasos pequeños no puede ir más rápido que el límite', async () => {
    const ana = await b.conectar('ana');
    const beto = await b.conectar('beto');
    await ana.esperar('entra');
    let x = 6.5 * 32;
    let corregido = false;
    for (let i = 0; i < 25; i++) {
      x += 20; // 20 px cada 10 ms = 2000 px/s
      beto.enviar({ t: 'mover', x, y: 5.5 * 32, dir: 'E', anim: 'caminar' });
      await new Promise((ok) => setTimeout(ok, 10));
    }
    try {
      await beto.esperar('corregir', undefined, 500);
      corregido = true;
    } catch {
      corregido = false;
    }
    expect(corregido).toBe(true);
  });

  it('el estado y el lugar se difunden; «invisible» hace que los demás dejen de verte', async () => {
    const ana = await b.conectar('ana');
    const beto = await b.conectar('beto');
    const id = (await ana.esperar('entra')).persona.id;

    beto.enviar({ t: 'estado', estado: 'concentrado', lugar: 'naos' });
    expect(await ana.esperar('estado')).toMatchObject({ id, estado: 'concentrado', lugar: 'naos' });

    beto.enviar({ t: 'estado', invisible: true });
    expect((await ana.esperar('sale')).id).toBe(id);
    beto.enviar({ t: 'mover', x: 215, y: 180, dir: 'S', anim: 'caminar' });
    await ana.nada('movimientos');
    beto.enviar({ t: 'estado', invisible: false });
    expect((await ana.esperar('entra')).persona.id).toBe(id);

    // las preferencias quedan guardadas para la próxima vez; la posición no
    await new Promise((ok) => setTimeout(ok, 60));
    const guardado = await b.env.ctx.prisma.usuario.findUniqueOrThrow({ where: { id } });
    expect(guardado).toMatchObject({ estado: 'concentrado', etiquetaLugar: 'naos', invisible: false });
  });

  it('puede prohibirse el modo invisible desde la configuración', async () => {
    await b.env.ctx.ajustes.guardar({ invisibles_permitido: false });
    const ana = await b.conectar('ana');
    ana.enviar({ t: 'estado', invisible: true });
    expect((await ana.esperar('error')).mensaje).toMatch(/invisible/);
    await b.env.ctx.ajustes.guardar({ invisibles_permitido: true });
  });

  it('una sola conexión por persona: la nueva reemplaza a la anterior', async () => {
    const primera = await b.conectar('ana');
    const segunda = await b.conectar('ana');
    expect((await primera.esperar('cerrar')).motivo).toBe('otra_sesion');
    expect((await primera.cerrado()).codigo).toBe(4001);
    segunda.enviar({ t: 'ping' });
    await segunda.esperar('pong');
  });

  it('al reemplazar una conexión, los demás no ven «sale» de quien sigue en la oficina', async () => {
    const beto = await b.conectar('beto');
    const primera = await b.conectar('ana');
    await beto.esperar('entra');
    const segunda = await b.conectar('ana');
    await primera.cerrado();
    await beto.esperar('entra'); // la conexión nueva se anuncia
    await beto.nada('sale', 300); // y la vieja, al cerrarse, no la borra
    segunda.ws.close();
    await beto.esperar('sale'); // cuando de verdad sale, sí se avisa
  });

  it('cierra la conexión cuando la administración desactiva la cuenta o restablece la clave', async () => {
    const admin = cliente(b.env.app, await ingresar(b.env.app, 'jefa'));
    const ana = await b.conectar('ana');
    const carla = await b.conectar('carla');
    await ana.esperar('entra');
    const idCarla = (await b.env.ctx.prisma.usuario.findUniqueOrThrow({ where: { usuario: 'carla' } })).id;
    expect((await admin.patch(`/api/admin/usuarios/${idCarla}`).send({ activo: false })).status).toBe(200);
    expect((await carla.cerrado()).codigo).toBe(4004);
    expect((await ana.esperar('sale')).id).toBe(idCarla);
    await admin.patch(`/api/admin/usuarios/${idCarla}`).send({ activo: true });
  });

  it('ignora mensajes mal formados y cierra los que pesan demasiado', async () => {
    const ana = await b.conectar('ana');
    ana.ws.send('esto no es json');
    ana.enviar({ t: 'mover', x: 'a', y: null });
    ana.enviar({ t: 'inventado' });
    ana.enviar({ t: 'ping' });
    await ana.esperar('pong');
    ana.ws.send(JSON.stringify({ t: 'chat', texto: 'x'.repeat(20_000) }));
    expect((await ana.cerrado()).codigo).toBe(1009);
  });
});

describe('sesiones de enfoque', () => {
  let b: Banco;
  const JAM = 'https://open.spotify.com/socialsession/abc123';
  const pedido = (extra: Record<string, unknown> = {}) => ({ modo: 'enfoque', tema: 'Informe de ventas', minutos: 25, spotify: JAM, visibilidad: 'todos', ...extra });
  /** Se sienta donde apareció (la sala por defecto no tiene muebles) y deja a los demás enterarse. */
  const sentarse = async (p: Persona) => {
    p.enviar({ t: 'mover', x: p.pos.x, y: p.pos.y, dir: 'S', anim: 'sentado' });
    await new Promise((ok) => setTimeout(ok, 60));
  };
  beforeAll(async () => {
    b = await levantar();
    for (const u of ['ana', 'beto']) await crearCuenta(b.env.ctx, u, 'usuario');
  });
  afterEach(async () => {
    for (const p of b.gente.splice(0)) p.ws.terminate();
    await new Promise((ok) => setTimeout(ok, 40));
  });
  afterAll(async () => {
    await b.detener();
  });

  it('con «todos» pasa a concentrado, los demás ven el tema, el tiempo y el Jam, y al levantarse se cierra y vuelve su estado', async () => {
    const ana = await b.conectar('ana');
    const beto = await b.conectar('beto');
    const id = (await ana.esperar('entra')).persona.id;
    await sentarse(beto);
    beto.enviar({ t: 'enfoque', sesion: pedido() });

    const propia = await beto.esperar('enfoque');
    expect(propia.id).toBe(id);
    expect(propia.sesion).toMatchObject({ modo: 'enfoque', tema: 'Informe de ventas', spotify: JAM, visibilidad: 'todos' });
    expect((propia.sesion?.fin ?? 0) - (propia.sesion?.inicio ?? 0)).toBe(25 * 60_000);
    expect(typeof propia.sesion?.ahora).toBe('number');

    expect(await ana.esperar('estado', (m) => m.id === id && m.estado === 'concentrado')).toMatchObject({ id });
    const vista = await ana.esperar('enfoque');
    expect(vista).toMatchObject({ id, sesion: { tema: 'Informe de ventas', spotify: JAM } });
    expect(vista.sesion).not.toHaveProperty('visibilidad');

    beto.enviar({ t: 'mover', x: beto.pos.x, y: beto.pos.y, dir: 'S', anim: 'quieto' });
    expect((await ana.esperar('enfoque')).sesion).toBeNull();
    expect(await ana.esperar('estado', (m) => m.id === id && m.estado === 'disponible')).toMatchObject({ id });
    expect((await beto.esperar('enfoque')).sesion).toBeNull();
  });

  it('quien llega después recibe la sesión de quien ya está concentrado', async () => {
    const ana = await b.conectar('ana');
    await sentarse(ana);
    ana.enviar({ t: 'enfoque', sesion: pedido({ tema: 'Presupuesto' }) });
    await ana.esperar('enfoque');
    const beto = await b.conectar('beto', { entrar: false });
    beto.enviar({ t: 'entrar' });
    const bienvenida = await beto.esperar('bienvenida');
    expect(bienvenida.personas[0]).toMatchObject({ estado: 'concentrado', enfoque: { tema: 'Presupuesto', modo: 'enfoque' } });
  });

  it('«solo el estado» muestra concentrado sin tema; «no» no muestra nada', async () => {
    const ana = await b.conectar('ana');
    const beto = await b.conectar('beto');
    const id = (await ana.esperar('entra')).persona.id;
    await sentarse(beto);
    beto.enviar({ t: 'enfoque', sesion: pedido({ visibilidad: 'estado' }) });
    expect(await ana.esperar('estado', (m) => m.id === id && m.estado === 'concentrado')).toMatchObject({ id });
    await ana.nada('enfoque');
    expect((await beto.esperar('enfoque')).sesion).toMatchObject({ visibilidad: 'estado' }); // quien la inicia sí la tiene

    beto.enviar({ t: 'enfoque', sesion: null });
    await ana.esperar('estado', (m) => m.id === id && m.estado === 'disponible');
    beto.enviar({ t: 'enfoque', sesion: pedido({ visibilidad: 'nadie' }) });
    await beto.esperar('enfoque', (m) => m.sesion !== null);
    await ana.nada('estado');
    await ana.nada('enfoque');
  });

  it('rechaza lo que no es válido: de pie, enlaces que no son de Spotify, duraciones fuera de la lista', async () => {
    const ana = await b.conectar('ana');
    ana.enviar({ t: 'enfoque', sesion: pedido() });
    expect((await ana.esperar('error')).mensaje).toMatch(/Siéntate/);
    await sentarse(ana);
    ana.enviar({ t: 'enfoque', sesion: pedido({ spotify: 'https://ejemplo.com/jam' }) });
    expect((await ana.esperar('error')).mensaje).toMatch(/Spotify/);
    ana.enviar({ t: 'enfoque', sesion: pedido({ spotify: 'http://open.spotify.com/jam' }) });
    expect((await ana.esperar('error')).mensaje).toMatch(/Spotify/);
    ana.enviar({ t: 'enfoque', sesion: pedido({ minutos: 7 }) });
    ana.enviar({ t: 'enfoque', sesion: pedido({ modo: 'inventado' }) });
    await ana.nada('enfoque', 300);
    // un tema larguísimo se recorta
    ana.enviar({ t: 'enfoque', sesion: pedido({ tema: 'x'.repeat(300), spotify: undefined }) });
    expect((await ana.esperar('enfoque')).sesion?.tema).toHaveLength(80);
  });

  it('se cierra sola al acabarse el tiempo y devuelve el estado de antes', async () => {
    const ana = await b.conectar('ana');
    const beto = await b.conectar('beto');
    const id = (await ana.esperar('entra')).persona.id;
    await sentarse(beto);
    beto.enviar({ t: 'enfoque', sesion: pedido({ minutos: 15 }) });
    await ana.esperar('enfoque');
    b.presencia.revisarEnfoques(Date.now() + 14 * 60_000);
    await ana.nada('enfoque', 150);
    b.presencia.revisarEnfoques(Date.now() + 16 * 60_000);
    expect((await ana.esperar('enfoque')).sesion).toBeNull();
    expect(await ana.esperar('estado', (m) => m.id === id && m.estado === 'disponible')).toMatchObject({ id });
    expect((await beto.esperar('enfoque', (m) => m.sesion === null)).sesion).toBeNull();
  });

  it('si cambia su estado a mano durante la sesión, al terminar no se le pisa', async () => {
    const ana = await b.conectar('ana');
    const beto = await b.conectar('beto');
    const id = (await ana.esperar('entra')).persona.id;
    await sentarse(beto);
    beto.enviar({ t: 'enfoque', sesion: pedido() });
    await ana.esperar('estado', (m) => m.id === id && m.estado === 'concentrado');
    beto.enviar({ t: 'estado', estado: 'reunion' });
    await ana.esperar('estado', (m) => m.id === id && m.estado === 'reunion');
    beto.enviar({ t: 'enfoque', sesion: null });
    await ana.esperar('enfoque', (m) => m.sesion === null);
    await ana.nada('estado', 200);
  });
});

describe('chat de cercanía', () => {
  let b: Banco;
  beforeAll(async () => {
    b = await levantar({ salas: SALA_TRES });
    for (const u of ['ana', 'beto', 'carla']) await crearCuenta(b.env.ctx, u, 'usuario');
  });
  afterEach(async () => {
    for (const p of b.gente.splice(0)) p.ws.terminate();
    await new Promise((ok) => setTimeout(ok, 60));
  });
  afterAll(async () => {
    await b.detener();
  });

  it('solo lo oye quien está cerca, incluida la persona que lo escribe', async () => {
    // el reparto de llegadas es por orden: ana y beto quedan juntos; carla, lejos
    const ana = await b.conectar('ana');
    const beto = await b.conectar('beto');
    const carla = await b.conectar('carla');
    ana.enviar({ t: 'chat', texto: '  Hola, ¿tienes un minuto?  ' });
    const aBeto = await beto.esperar('chat');
    expect(aBeto.texto).toBe('Hola, ¿tienes un minuto?');
    expect(aBeto.nombre).toBe('Persona ana');
    await ana.esperar('chat');
    await carla.nada('chat');
  });

  it('respeta la configuración: apagado, largo máximo, invisibles y ritmo', async () => {
    const ana = await b.conectar('ana');
    const beto = await b.conectar('beto');

    await b.env.ctx.ajustes.guardar({ chat_activo: false });
    ana.enviar({ t: 'chat', texto: 'hola' });
    expect((await ana.esperar('error')).mensaje).toMatch(/desactivado/);
    await b.env.ctx.ajustes.guardar({ chat_activo: true, chat_max_caracteres: 20 });

    ana.enviar({ t: 'chat', texto: 'x'.repeat(21) });
    expect((await ana.esperar('error')).mensaje).toMatch(/20 caracteres/);
    await b.env.ctx.ajustes.guardar({ chat_max_caracteres: 280 });

    beto.enviar({ t: 'estado', invisible: true });
    await ana.esperar('sale');
    beto.enviar({ t: 'chat', texto: 'hola' });
    expect((await beto.esperar('error')).mensaje).toMatch(/vuelve a verte/);
    beto.enviar({ t: 'estado', invisible: false });
    await ana.esperar('entra');

    for (let i = 0; i < 6; i++) ana.enviar({ t: 'chat', texto: `mensaje ${i}` });
    expect((await ana.esperar('error', (m) => /rápido/.test(m.mensaje))).mensaje).toMatch(/rápido/);
  });
});

describe('límites de la oficina', () => {
  it('un borde del mapa se respeta: el destino se recorta al límite de la sala', async () => {
    const pequena: ProveedorSalas = { inicial: () => 'principal', sala: (id) => (id === 'principal' ? { id, ancho: 10, alto: 10, llegadas: [{ x: 0, y: 0 }] } : undefined) };
    const b = await levantar({ salas: pequena });
    try {
      for (const u of ['ana', 'beto']) await crearCuenta(b.env.ctx, u, 'usuario');
      const ana = await b.conectar('ana');
      const beto = await b.conectar('beto');
      await ana.esperar('entra');
      beto.enviar({ t: 'mover', x: -20, y: 10, dir: 'O', anim: 'caminar' });
      const m = await ana.esperar('movimientos');
      expect(m.lista[0]).toMatchObject({ x: 0 });
    } finally {
      await b.detener();
    }
  });

  it('un punto justo en el borde de la sala cuenta en su última casilla', async () => {
    // Sala de 4x4 con la casilla (0,3) bloqueada. Con un cálculo ingenuo, x = 128 caería en la columna 4,
    // que es la columna 0 de la fila siguiente: la casilla bloqueada.
    const bloqueo = new Uint8Array(16);
    bloqueo[3 * 4] = 1;
    const sala: ProveedorSalas = {
      inicial: () => 'principal',
      sala: (id) => (id === 'principal' ? { id, ancho: 4, alto: 4, llegadas: [{ x: 3, y: 2 }], bloqueo, asientos: new Set<number>() } : undefined),
    };
    const b = await levantar({ salas: sala });
    try {
      for (const u of ['ana', 'beto']) await crearCuenta(b.env.ctx, u, 'usuario');
      const ana = await b.conectar('ana');
      const beto = await b.conectar('beto');
      await ana.esperar('entra');
      beto.enviar({ t: 'mover', x: 4 * 32, y: 2.5 * 32, dir: 'E', anim: 'caminar' });
      expect((await ana.esperar('movimientos')).lista[0]).toMatchObject({ x: 4 * 32, y: 2.5 * 32 });
      await beto.nada('corregir');
    } finally {
      await b.detener();
    }
  });

  it('la oficina cerrada deja fuera a las personas, pero no a quien construye', async () => {
    const b = await levantar({ ahora: () => new Date('2026-10-07T15:00:00Z') }); // miércoles
    try {
      await crearCuenta(b.env.ctx, 'ana', 'usuario');
      await crearCuenta(b.env.ctx, 'obra', 'constructor');
      await b.env.ctx.ajustes.guardar({ horario_activo: true, horario_dias: '1', horario_desde: '08:00', horario_hasta: '18:00', zona_horaria: 'UTC' });
      const ana = await b.conectar('ana', { entrar: false });
      expect((await ana.esperar('cerrada')).mensaje).toMatch(/cerrada.*lunes de 08:00 a 18:00/);
      expect((await ana.cerrado()).codigo).toBe(4006);
      const obra = await b.conectar('obra');
      expect(obra.cierre).toBeNull();
    } finally {
      await b.detener();
    }
  });

  it('cuando se llena, la persona siguiente espera; quien construye entra igual', async () => {
    const b = await levantar();
    try {
      await b.env.ctx.ajustes.guardar({ maximo_personas: 5 });
      for (let i = 1; i <= 6; i++) await crearCuenta(b.env.ctx, `p${i}`, 'usuario');
      await crearCuenta(b.env.ctx, 'obra', 'constructor');
      for (let i = 1; i <= 5; i++) await b.conectar(`p${i}`);
      const sexta = await b.conectar('p6', { entrar: false });
      expect((await sexta.esperar('cerrar')).motivo).toBe('llena');
      const obra = await b.conectar('obra');
      expect(obra.cierre).toBeNull();
    } finally {
      await b.detener();
    }
  });

  it('pasa a «ausente» tras el tiempo sin actividad y vuelve al moverse', async () => {
    const b = await levantar();
    try {
      for (const u of ['ana', 'beto']) await crearCuenta(b.env.ctx, u, 'usuario');
      const ana = await b.conectar('ana');
      const beto = await b.conectar('beto');
      const id = (await ana.esperar('entra')).persona.id;
      b.presencia.revisarAusencias(Date.now() + 11 * 60_000);
      expect(await ana.esperar('estado')).toMatchObject({ id, estado: 'ausente' });
      beto.enviar({ t: 'mover', x: 210, y: 180, dir: 'S', anim: 'caminar' });
      expect(await ana.esperar('estado')).toMatchObject({ id, estado: 'disponible' });
    } finally {
      await b.detener();
    }
  });
});

describe('mapa publicado, colisiones y cambios de oficina', () => {
  // Mapa de partida: sala «principal» de 12x8, una llegada en (4,3) y una silla sólida en (5,3).
  const LLEGADA = { x: 4.5 * 32, y: 3.5 * 32 };
  const SILLA = { x: 5.5 * 32, y: 3.5 * 32 };

  let b: Banco;
  let obra: ReturnType<typeof cliente>;
  beforeAll(async () => {
    b = await levantar({ conOficina: true });
    for (const u of ['ana', 'beto']) await crearCuenta(b.env.ctx, u, 'usuario');
    obra = (await sesionComo(b.env, 'obra', 'constructor')).api;
  });
  beforeEach(async () => {
    await publicarMapa(obra, mapaConSilla()); // cada prueba parte del mismo mapa
  });
  afterEach(async () => {
    for (const p of b.gente.splice(0)) p.ws.terminate();
    await new Promise((ok) => setTimeout(ok, 40));
  });
  afterAll(async () => {
    await b.detener();
  });

  const esperarMs = (ms: number) => new Promise((ok) => setTimeout(ok, ms));

  /** Conecta e identifica sin entrar a la sala. El ping asegura que la identificación ya terminó. */
  async function identificada(usuario: string): Promise<Persona> {
    const p = await b.conectar(usuario, { entrar: false });
    p.enviar({ t: 'ping' });
    await p.esperar('pong');
    return p;
  }

  it('la bienvenida trae el número del mapa publicado y la persona aparece en su llegada', async () => {
    const ana = await identificada('ana');
    ana.enviar({ t: 'entrar' });
    const hola = await ana.esperar('bienvenida');
    expect(hola.mapa).toBe(b.env.ctx.oficina.numeroPublicado());
    expect(hola.mapa).toBeGreaterThan(1);
    expect(hola.sala).toBe('principal');
    expect(hola.yo).toMatchObject(LLEGADA);
  });

  it('un mover hacia una casilla bloqueada recibe corregir con la última posición válida', async () => {
    const ana = await b.conectar('ana');
    const beto = await b.conectar('beto');
    await ana.esperar('entra');

    ana.enviar({ t: 'mover', x: 16, y: 16, dir: 'O', anim: 'caminar' }); // fuera del piso: bloqueado
    expect(await ana.esperar('corregir')).toEqual({ t: 'corregir', ...LLEGADA });
    await beto.nada('movimientos');

    // el rechazo no gasta fichas de velocidad: una casilla libre se acepta enseguida
    ana.enviar({ t: 'mover', x: 3.5 * 32, y: 3.5 * 32, dir: 'O', anim: 'caminar' });
    expect((await beto.esperar('movimientos')).lista[0]).toMatchObject({ x: 3.5 * 32, y: 3.5 * 32 });
    await ana.nada('corregir');
  });

  it('los asientos se cruzan caminando y sentarse en uno es legal', async () => {
    const ana = await b.conectar('ana');
    const beto = await b.conectar('beto');
    await ana.esperar('entra');

    // cruzar la silla sin sentarse
    ana.enviar({ t: 'mover', x: SILLA.x, y: SILLA.y, dir: 'E', anim: 'caminar' });
    expect((await beto.esperar('movimientos')).lista[0]).toMatchObject({ ...SILLA, anim: 'caminar' });
    await ana.nada('corregir');

    // detenerse y sentarse en ella
    await esperarMs(150);
    ana.enviar({ t: 'mover', x: SILLA.x, y: SILLA.y, dir: 'S', anim: 'sentado' });
    expect((await beto.esperar('movimientos')).lista[0]).toMatchObject({ ...SILLA, anim: 'sentado' });
    await ana.nada('corregir');

    // se levanta y sigue caminando
    ana.enviar({ t: 'mover', x: LLEGADA.x, y: LLEGADA.y, dir: 'O', anim: 'caminar' });
    expect((await beto.esperar('movimientos')).lista[0]).toMatchObject({ ...LLEGADA, anim: 'caminar' });
  });

  it('un asiento ocupado no se cruza ni se comparte', async () => {
    const ana = await b.conectar('ana');
    const beto = await b.conectar('beto');
    await ana.esperar('entra');
    ana.enviar({ t: 'mover', x: SILLA.x, y: SILLA.y, dir: 'S', anim: 'sentado' });
    await beto.esperar('movimientos'); // ana está sentada en la silla

    // beto no puede cruzar la silla de ana ni sentarse en ella
    beto.enviar({ t: 'mover', x: SILLA.x, y: SILLA.y, dir: 'E', anim: 'caminar' });
    expect((await beto.esperar('corregir')).t).toBe('corregir');
    await esperarMs(150);
    beto.enviar({ t: 'mover', x: SILLA.x, y: SILLA.y, dir: 'S', anim: 'sentado' });
    expect((await beto.esperar('corregir')).t).toBe('corregir');

    // cuando ana se levanta, el asiento queda libre
    await esperarMs(150);
    ana.enviar({ t: 'mover', x: LLEGADA.x, y: LLEGADA.y, dir: 'O', anim: 'caminar' });
    await beto.esperar('movimientos');
    await esperarMs(150);
    beto.enviar({ t: 'mover', x: SILLA.x, y: SILLA.y, dir: 'S', anim: 'sentado' });
    await beto.nada('corregir');
  });

  it('sentarse en una casilla sólida que no es un asiento se rechaza', async () => {
    const ana = await b.conectar('ana');
    await publicarMapa(obra, mapaConPlanta());
    await ana.esperar('mapa');
    ana.enviar({ t: 'mover', x: SILLA.x, y: SILLA.y, dir: 'E', anim: 'sentado' }); // ahora hay una planta
    expect(await ana.esperar('corregir')).toEqual({ t: 'corregir', ...LLEGADA });
  });

  it('al publicar un mapa nuevo, todos reciben el aviso y quien quedó sobre una casilla bloqueada es corregido', async () => {
    const ana = await b.conectar('ana');
    const beto = await b.conectar('beto');
    await ana.esperar('entra');
    ana.enviar({ t: 'mover', x: SILLA.x, y: SILLA.y, dir: 'E', anim: 'sentado' });
    await beto.esperar('movimientos'); // ana ya está sentada en la silla

    const numero = await publicarMapa(obra, mapaConPlanta()); // la silla se cambia por una planta
    expect(await ana.esperar('mapa')).toEqual({ t: 'mapa', numero });
    expect(await beto.esperar('mapa')).toEqual({ t: 'mapa', numero });
    expect(await ana.esperar('corregir')).toEqual({ t: 'corregir', ...LLEGADA });
    await beto.nada('corregir'); // beto estaba en una casilla libre

    // los demás ven el salto de ana en el siguiente reparto de movimientos
    expect((await beto.esperar('movimientos')).lista[0]).toMatchObject({ ...LLEGADA, anim: 'quieto' });
  });

  it('quien sigue en una casilla libre no recibe corregir; quien aún no entró a la sala también se entera', async () => {
    const ana = await b.conectar('ana');
    const afuera = await identificada('beto');
    const numero = await publicarMapa(obra, mapaConPlanta());
    expect((await ana.esperar('mapa')).numero).toBe(numero);
    expect((await afuera.esperar('mapa')).numero).toBe(numero);
    await ana.nada('corregir');
    await afuera.nada('corregir');

    afuera.enviar({ t: 'entrar' });
    expect((await afuera.esperar('bienvenida')).mapa).toBe(numero);
  });

  it('quien estaba sentado en una silla que sigue ahí se queda sentado', async () => {
    const ana = await b.conectar('ana');
    ana.enviar({ t: 'mover', x: SILLA.x, y: SILLA.y, dir: 'E', anim: 'sentado' });
    await esperarMs(60);
    const numero = await publicarMapa(obra, mapaConSilla('Misma silla, otro nombre'));
    expect((await ana.esperar('mapa')).numero).toBe(numero);
    await ana.nada('corregir');
  });

  it('si la sala desaparece, pasa a la sala de entrada con una bienvenida nueva y los demás lo ven', async () => {
    const ana = await b.conectar('ana');
    const beto = await b.conectar('beto');
    await ana.esperar('entra');

    const numero = await publicarMapa(obra, mapaSoloAnexo());
    expect(b.env.ctx.oficina.proveedorSalas().sala('principal')).toBeUndefined();

    expect((await ana.esperar('mapa')).numero).toBe(numero);
    const deAna = await ana.esperar('bienvenida');
    expect(deAna).toMatchObject({ sala: 'anexo', mapa: numero, yo: { sala: 'anexo', x: 8.5 * 32, y: 3.5 * 32, anim: 'quieto' } });
    const deBeto = await beto.esperar('bienvenida');
    expect(deBeto).toMatchObject({ sala: 'anexo', mapa: numero });
    expect(deBeto.personas.map((p) => p.nombre)).toEqual(['Persona ana']);
    expect((await ana.esperar('entra')).persona.nombre).toBe('Persona beto');
    await ana.nada('corregir'); // la bienvenida ya trae la posición nueva
  });

  it('mover después del cambio usa la geometría nueva', async () => {
    const ana = await b.conectar('ana');
    await publicarMapa(obra, mapaSoloAnexo());
    await ana.esperar('bienvenida'); // ana queda en la llegada del anexo, en el borde este del piso
    // la columna 9 era piso en el mapa anterior y en el anexo ya no lo es
    ana.enviar({ t: 'mover', x: 9.5 * 32, y: 3.5 * 32, dir: 'E', anim: 'caminar' });
    expect(await ana.esperar('corregir')).toEqual({ t: 'corregir', x: 8.5 * 32, y: 3.5 * 32 });
    // y la columna 7, que sí tiene piso, se acepta
    ana.enviar({ t: 'mover', x: 7.5 * 32, y: 3.5 * 32, dir: 'O', anim: 'caminar' });
    await ana.nada('corregir');
  });
});

/** Sala con una sala de reuniones (casillas 4 a 7 en x, 4 a 6 en y) dentro de una zona abierta, y dos llegadas dentro de la sala. */
const SALA_CON_REUNION: ProveedorSalas = {
  inicial: () => 'principal',
  sala: (id) =>
    id === 'principal'
      ? {
          id,
          ancho: 60,
          alto: 40,
          llegadas: [
            { x: 5, y: 5 },
            { x: 6, y: 5 },
          ],
          zonas: [
            { id: 'z-sala', tipo: 'sala', rect: { x: 4, y: 4, w: 4, h: 3 } },
            { id: 'z-abierta', tipo: 'abierta', rect: { x: 0, y: 0, w: 60, h: 40 } },
          ],
        }
      : undefined,
};

describe('salas de reuniones bloqueadas', () => {
  let b: Banco;
  beforeAll(async () => {
    b = await levantar({ salas: SALA_CON_REUNION });
    for (const u of ['ana', 'beto']) await crearCuenta(b.env.ctx, u, 'usuario');
  });
  afterEach(async () => {
    for (const p of b.gente.splice(0)) p.ws.terminate();
    await new Promise((ok) => setTimeout(ok, 40));
  });
  afterAll(async () => {
    await b.detener();
  });
  /** Camina en pasos cortos (el servidor limita la velocidad) hasta una casilla. */
  const caminarA = async (p: Persona, cx: number, cy: number) => {
    let { x, y } = p.pos;
    const meta = { x: (cx + 0.5) * 32, y: (cy + 0.5) * 32 };
    while (Math.hypot(meta.x - x, meta.y - y) > 0.5) {
      const d = Math.hypot(meta.x - x, meta.y - y);
      const paso = Math.min(d, 28);
      x += ((meta.x - x) / d) * paso;
      y += ((meta.y - y) / d) * paso;
      p.enviar({ t: 'mover', x, y, dir: 'E', anim: 'caminar' });
      await new Promise((ok) => setTimeout(ok, 120));
    }
    p.pos = { x, y };
  };

  it('quien está adentro la bloquea, todos lo ven y quien llega después la encuentra bloqueada', async () => {
    const beto = await b.conectar('beto');
    const ana = await b.conectar('ana');
    const idAna = (await beto.esperar('entra')).persona.id;
    ana.enviar({ t: 'bloquear-sala', zona: 'z-sala', bloqueada: true });
    expect(await ana.esperar('sala-bloqueada')).toEqual({ t: 'sala-bloqueada', zona: 'z-sala', bloqueada: true, por: idAna });
    expect(await beto.esperar('sala-bloqueada')).toMatchObject({ zona: 'z-sala', bloqueada: true, por: idAna });

    const tarde = await b.conectar('beto', { entrar: false });
    tarde.enviar({ t: 'entrar' });
    expect((await tarde.esperar('bienvenida')).bloqueos).toEqual([{ zona: 'z-sala', por: idAna }]);
  });

  it('solo la dueña la desbloquea, y bloquear no impide caminar adentro', async () => {
    const beto = await b.conectar('beto');
    const ana = await b.conectar('ana');
    const idAna = (await beto.esperar('entra')).persona.id;
    ana.enviar({ t: 'bloquear-sala', zona: 'z-sala', bloqueada: true });
    await beto.esperar('sala-bloqueada');

    beto.enviar({ t: 'bloquear-sala', zona: 'z-sala', bloqueada: false });
    expect((await beto.esperar('error')).mensaje).toMatch(/Solo quien bloqueó/);
    beto.enviar({ t: 'mover', x: beto.pos.x + 10, y: beto.pos.y, dir: 'E', anim: 'caminar' });
    await beto.nada('corregir');

    ana.enviar({ t: 'bloquear-sala', zona: 'z-sala', bloqueada: false });
    expect(await beto.esperar('sala-bloqueada')).toEqual({ t: 'sala-bloqueada', zona: 'z-sala', bloqueada: false, por: idAna });
  });

  it('rechaza zonas que no son salas, salas inexistentes y bloquear desde afuera', async () => {
    const ana = await b.conectar('ana');
    ana.enviar({ t: 'bloquear-sala', zona: 'z-abierta', bloqueada: true });
    expect((await ana.esperar('error')).mensaje).toMatch(/sala de reuniones/);
    ana.enviar({ t: 'bloquear-sala', zona: 'no-existe', bloqueada: true });
    expect((await ana.esperar('error')).mensaje).toMatch(/sala de reuniones/);
    ana.enviar({ t: 'bloquear-sala', zona: '', bloqueada: true }); // el esquema lo descarta sin responder
    await caminarA(ana, 9, 5); // sale de la sala
    ana.enviar({ t: 'bloquear-sala', zona: 'z-sala', bloqueada: true });
    expect((await ana.esperar('error')).mensaje).toMatch(/estar adentro/);
  });

  it('se libera sola cuando quien la bloqueó sale o se desconecta', async () => {
    const beto = await b.conectar('beto');
    const ana = await b.conectar('ana');
    const idAna = (await beto.esperar('entra')).persona.id;
    ana.enviar({ t: 'bloquear-sala', zona: 'z-sala', bloqueada: true });
    await beto.esperar('sala-bloqueada');
    await caminarA(ana, 9, 5);
    expect(await beto.esperar('sala-bloqueada', (m) => !m.bloqueada)).toMatchObject({ zona: 'z-sala', por: idAna });

    // Vuelve, la bloquea y se desconecta.
    await caminarA(ana, 6, 5);
    ana.enviar({ t: 'bloquear-sala', zona: 'z-sala', bloqueada: true });
    await beto.esperar('sala-bloqueada', (m) => m.bloqueada);
    ana.ws.terminate();
    expect(await beto.esperar('sala-bloqueada', (m) => !m.bloqueada)).toMatchObject({ zona: 'z-sala' });
  });
});
