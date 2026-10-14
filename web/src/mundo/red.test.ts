import { describe, expect, it, vi } from 'vitest';
import type { MensajeServidor, PersonaPresente } from '@ol/shared';
import { ClienteRed, LimitadorMovimiento, aRelojLocal, esperaReconexion, motivoDeCodigo, politicaDeCierre, urlDePresencia, type InfoRed, type Reloj, type SocketMinimo } from './red';
import { VivoMundo } from './vivo';

class RelojFalso implements Reloj {
  t = 0;
  private lista: { id: number; en: number; f: () => void }[] = [];
  private n = 0;
  ahora(): number {
    return this.t;
  }
  programar(f: () => void, ms: number): unknown {
    const id = ++this.n;
    this.lista.push({ id, en: this.t + ms, f });
    return id;
  }
  cancelar(id: unknown): void {
    this.lista = this.lista.filter((x) => x.id !== id);
  }
  avanzar(ms: number): void {
    const fin = this.t + ms;
    for (;;) {
      this.lista.sort((a, b) => a.en - b.en);
      const sig = this.lista[0];
      if (!sig || sig.en > fin) break;
      this.lista.shift();
      this.t = sig.en;
      sig.f();
    }
    this.t = fin;
  }
  pendientes(): number {
    return this.lista.length;
  }
}

class SocketFalso implements SocketMinimo {
  readyState = 0;
  enviados: Record<string, unknown>[] = [];
  onopen: ((e: unknown) => void) | null = null;
  onmessage: ((e: { data: unknown }) => void) | null = null;
  onclose: ((e: { code: number; reason: string }) => void) | null = null;
  onerror: ((e: unknown) => void) | null = null;
  send(d: string): void {
    this.enviados.push(JSON.parse(d) as Record<string, unknown>);
  }
  close(codigo = 1000): void {
    this.cerrar(codigo);
  }
  abrir(): void {
    this.readyState = 1;
    this.onopen?.({});
  }
  recibir(m: MensajeServidor): void {
    this.onmessage?.({ data: JSON.stringify(m) });
  }
  cerrar(codigo: number): void {
    this.readyState = 3;
    this.onclose?.({ code: codigo, reason: '' });
  }
  tipos(): unknown[] {
    return this.enviados.map((m) => m['t']);
  }
}

const persona = (id: number, extra: Partial<PersonaPresente> = {}): PersonaPresente => ({
  id,
  nombre: `Persona ${id}`,
  cargo: '',
  apodo: '',
  avatar: null,
  sala: 'principal',
  x: 100,
  y: 100,
  dir: 'S',
  anim: 'quieto',
  estado: 'disponible',
  lugar: '',
  ...extra,
});

const AJUSTES = { distanciaCercania: 3, chatActivo: true, chatMax: 280, teamsActivo: false, ausenciaMin: 10, invisiblesPermitido: true };
const bienvenida = (yo: PersonaPresente, personas: PersonaPresente[] = [], mapa = 5): MensajeServidor => ({ t: 'bienvenida', yo, sala: 'principal', personas, ajustes: AJUSTES, invisible: false, mapa, bloqueos: [] });

function montar(extra: { token?: string | null } = {}) {
  const reloj = new RelojFalso();
  const vivo = new VivoMundo();
  const sockets: SocketFalso[] = [];
  const estados: InfoRed[] = [];
  const mapas: number[] = [];
  const sesion = vi.fn();
  const errores: string[] = [];
  const cliente = new ClienteRed({
    vivo,
    token: () => (extra.token === undefined ? 'token-de-prueba-largo' : extra.token),
    url: 'ws://prueba/ws',
    alEstado: (i) => estados.push(i),
    alMapa: (n) => mapas.push(n),
    alError: (m) => errores.push(m),
    alSesionTerminada: sesion,
    crearSocket: () => {
      const s = new SocketFalso();
      sockets.push(s);
      return s;
    },
    reloj,
    azar: () => 0.5, // sin variación: la espera es exactamente la base
  });
  const ultimo = () => sockets[sockets.length - 1] as SocketFalso;
  return { reloj, vivo, sockets, estados, mapas, sesion, errores, cliente, ultimo };
}

describe('esperaReconexion', () => {
  it('crece al doble hasta 15 segundos', () => {
    expect([1, 2, 3, 4, 5, 6, 9].map((n) => esperaReconexion(n, 0.5))).toEqual([1000, 2000, 4000, 8000, 15000, 15000, 15000]);
  });
  it('el azar la mueve un 20 % y el mínimo la sube', () => {
    expect(esperaReconexion(1, 0)).toBe(800);
    expect(esperaReconexion(1, 1)).toBe(1200);
    expect(esperaReconexion(1, 0.5, 10_000)).toBe(10_000);
    expect(esperaReconexion(0, 0.5)).toBe(1000);
  });
});

describe('políticas de cierre', () => {
  it('otra sesión, sin permiso, sesión terminada y oficina cerrada no se reintentan', () => {
    for (const m of ['otra_sesion', 'sin_permiso', 'sesion_terminada', 'cerrada'] as const) expect(politicaDeCierre(m).definitivo).toBe(true);
  });
  it('oficina llena y cortes de red sí se reintentan, la llena con calma', () => {
    expect(politicaDeCierre('llena')).toMatchObject({ definitivo: false, minimoMs: 10_000 });
    expect(politicaDeCierre(null).definitivo).toBe(false);
    expect(politicaDeCierre('sin_hola').definitivo).toBe(false);
  });
  it('reconoce los códigos de la aplicación', () => {
    expect(motivoDeCodigo(4001)).toBe('otra_sesion');
    expect(motivoDeCodigo(4003)).toBe('sin_permiso');
    expect(motivoDeCodigo(1006)).toBeNull();
  });
});

describe('urlDePresencia', () => {
  it('cambia http por ws y https por wss', () => {
    expect(urlDePresencia({ protocol: 'http:', host: 'localhost:5190' })).toBe('ws://localhost:5190/ws');
    expect(urlDePresencia({ protocol: 'https:', host: 'live.empresa.co' })).toBe('wss://live.empresa.co/ws');
  });
});

describe('LimitadorMovimiento', () => {
  const m = (x: number) => ({ x, y: 0, dir: 'E' as const, anim: 'caminar' as const });
  it('deja pasar el primero al instante y junta el resto en uno solo por intervalo, siempre con el más reciente', () => {
    const reloj = new RelojFalso();
    const salida: number[] = [];
    const l = new LimitadorMovimiento((v) => salida.push(v.x), 100, reloj);
    l.empujar(m(1));
    expect(salida).toEqual([1]);
    reloj.avanzar(30);
    l.empujar(m(2));
    reloj.avanzar(30);
    l.empujar(m(3));
    expect(salida).toEqual([1]);
    reloj.avanzar(40);
    expect(salida).toEqual([1, 3]);
    reloj.avanzar(500);
    expect(salida).toEqual([1, 3]); // nada pendiente
    l.empujar(m(4));
    expect(salida).toEqual([1, 3, 4]); // pasó el intervalo: sale al instante
  });
  it('nunca manda más de uno por intervalo aunque lleguen 60 por segundo', () => {
    const reloj = new RelojFalso();
    const tiempos: number[] = [];
    const l = new LimitadorMovimiento(() => tiempos.push(reloj.ahora()), 100, reloj);
    for (let i = 0; i < 120; i++) {
      l.empujar(m(i));
      reloj.avanzar(16);
    }
    reloj.avanzar(200);
    for (let i = 1; i < tiempos.length; i++) expect((tiempos[i] as number) - (tiempos[i - 1] as number)).toBeGreaterThanOrEqual(100);
    expect(tiempos.length).toBeLessThanOrEqual(21);
  });
  it('vaciar descarta lo pendiente', () => {
    const reloj = new RelojFalso();
    const salida: number[] = [];
    const l = new LimitadorMovimiento((v) => salida.push(v.x), 100, reloj);
    l.empujar(m(1));
    l.empujar(m(2));
    l.vaciar();
    reloj.avanzar(500);
    expect(salida).toEqual([1]);
    expect(reloj.pendientes()).toBe(0);
  });
});

describe('ClienteRed: entrar y ver a los demás', () => {
  it('al abrir se identifica y entra; la bienvenida llena a VivoMundo y marca «conectado»', () => {
    const t = montar();
    t.cliente.iniciar();
    expect(t.estados).toEqual([{ estado: 'conectando' }]);
    t.ultimo().abrir();
    expect(t.ultimo().enviados).toEqual([{ t: 'hola', token: 'token-de-prueba-largo' }, { t: 'entrar' }]);
    t.ultimo().recibir(bienvenida(persona(1, { x: 150, y: 170 }), [persona(2), persona(3)]));
    expect(t.vivo.yo).toMatchObject({ id: 1, x: 150, y: 170, vx: 150, vy: 170 });
    expect([...t.vivo.otros.keys()]).toEqual([2, 3]);
    expect(t.vivo.ajustes?.distanciaCercania).toBe(3);
    expect(t.estados.at(-1)).toEqual({ estado: 'conectado' });
    expect(t.mapas).toEqual([5]);
  });

  it('ve entrar, caminar, cambiar de estado y salir a otra persona', () => {
    const t = montar();
    t.cliente.iniciar();
    t.ultimo().abrir();
    t.ultimo().recibir(bienvenida(persona(1)));
    t.ultimo().recibir({ t: 'entra', persona: persona(2, { nombre: 'Ana Ruiz' }) });
    expect(t.vivo.otros.get(2)?.nombre).toBe('Ana Ruiz');
    t.ultimo().recibir({ t: 'movimientos', lista: [{ id: 2, x: 220, y: 240, dir: 'E', anim: 'caminar' }] });
    expect(t.vivo.otros.get(2)).toMatchObject({ x: 220, y: 240, dir: 'E', anim: 'caminar' });
    t.ultimo().recibir({ t: 'estado', id: 2, estado: 'ausente', lugar: 'remoto' });
    expect(t.vivo.otros.get(2)).toMatchObject({ estado: 'ausente', lugar: 'remoto' });
    t.ultimo().recibir({ t: 'sale', id: 2 });
    expect(t.vivo.otros.has(2)).toBe(false);
  });

  it('un cambio de personaje reemplaza el objeto para que el mundo lo vuelva a dibujar', () => {
    const t = montar();
    t.cliente.iniciar();
    t.ultimo().abrir();
    t.ultimo().recibir(bienvenida(persona(1), [persona(2)]));
    const antes = t.vivo.otros.get(2);
    const version = t.vivo.version;
    t.ultimo().recibir({ t: 'avatar', id: 2, avatar: null, apodo: 'Anita' });
    expect(t.vivo.otros.get(2)).not.toBe(antes);
    expect(t.vivo.otros.get(2)?.apodo).toBe('Anita');
    expect(t.vivo.version).toBeGreaterThan(version);
  });

  it('«corregir» te devuelve a donde el servidor dice y te levanta si estabas sentado', () => {
    const t = montar();
    const avisos: string[] = [];
    t.vivo.suscribir((c) => avisos.push(c));
    t.cliente.iniciar();
    t.ultimo().abrir();
    t.ultimo().recibir(bienvenida(persona(1)));
    (t.vivo.yo as { anim: string }).anim = 'sentado';
    t.ultimo().recibir({ t: 'corregir', x: 64, y: 88 });
    expect(t.vivo.yo).toMatchObject({ x: 64, y: 88, vx: 64, vy: 88, anim: 'quieto' });
    expect(avisos).toContain('corregido');
  });

  it('las reacciones y el chat llegan, y los errores del servidor se avisan', () => {
    const t = montar();
    const chats: string[] = [];
    const reacciones: string[] = [];
    t.vivo.suscribir((c) => c === 'reaccion' && reacciones.push(t.vivo.ultimaReaccion?.emoji ?? ''));
    const c2 = new ClienteRed({ vivo: t.vivo, token: () => 'token-de-prueba-largo', url: 'x', alEstado: () => undefined, alChat: (m) => chats.push(m.texto), alError: (m) => t.errores.push(m), crearSocket: () => (t.sockets[t.sockets.length] = new SocketFalso()), reloj: t.reloj });
    c2.iniciar();
    const s = t.sockets[t.sockets.length - 1] as SocketFalso;
    s.abrir();
    s.recibir(bienvenida(persona(1)));
    s.recibir({ t: 'chat', de: 2, nombre: 'Ana', texto: 'hola', ts: 1 });
    s.recibir({ t: 'reaccion', id: 2, emoji: '🎉' });
    s.recibir({ t: 'error', mensaje: 'Vas muy rápido.' });
    expect(chats).toEqual(['hola']);
    expect(reacciones).toEqual(['🎉']);
    expect(t.errores).toEqual(['Vas muy rápido.']);
  });
});

describe('saludo a distancia en el cliente', () => {
  it('manda el saludo con el id de a quién y entrega lo que llega (saludo recibido y resultado)', () => {
    const t = montar();
    const recibidos: { de: number; nombre: string }[] = [];
    const resultados: { a: number; estado: string }[] = [];
    const c2 = new ClienteRed({
      vivo: t.vivo,
      token: () => 'token-de-prueba-largo',
      url: 'x',
      alEstado: () => undefined,
      alSaludo: (m) => recibidos.push(m),
      alResultadoSaludo: (m) => resultados.push(m),
      crearSocket: () => (t.sockets[t.sockets.length] = new SocketFalso()),
      reloj: t.reloj,
    });
    c2.iniciar();
    const s = t.sockets[t.sockets.length - 1] as SocketFalso;
    s.abrir();
    s.recibir(bienvenida(persona(1)));
    c2.saludar(7);
    expect(s.enviados.at(-1)).toEqual({ t: 'saludo', a: 7 });
    s.recibir({ t: 'saludo', de: 2, nombre: 'Ana' });
    s.recibir({ t: 'saludo-resultado', a: 7, estado: 'sin-conexion' });
    expect(recibidos).toEqual([{ de: 2, nombre: 'Ana' }]);
    expect(resultados).toEqual([{ a: 7, estado: 'sin-conexion' }]);
  });
});

describe('sesiones de enfoque en el cliente', () => {
  it('lleva las horas del reloj del servidor al local', () => {
    const s = { modo: 'enfoque' as const, tema: 'Informe', inicio: 10_000, fin: 10_000 + 25 * 60_000, ahora: 10_000 };
    expect(aRelojLocal(s, 12_000)).toEqual({ modo: 'enfoque', tema: 'Informe', inicio: 12_000, fin: 12_000 + 25 * 60_000 });
    const sin = { modo: 'libre' as const, tema: '', inicio: 5, fin: 9 };
    expect(aRelojLocal(sin, 100)).toBe(sin);
  });

  it('la sesión de alguien llega con la bienvenida, al empezar y al terminar; lo que se manda sale como pedido', () => {
    const t = montar();
    t.cliente.iniciar();
    t.ultimo().abrir();
    const sesion = { modo: 'pomodoro' as const, tema: 'Cierre', inicio: 1000, fin: 1000 + 60 * 60_000, spotify: 'https://spotify.link/x', ahora: 1000 };
    t.ultimo().recibir(bienvenida(persona(1), [persona(2, { estado: 'concentrado', enfoque: sesion })]));
    expect(t.vivo.otros.get(2)?.enfoque).toMatchObject({ tema: 'Cierre', spotify: 'https://spotify.link/x' });
    expect(t.vivo.otros.get(2)?.enfoque).not.toHaveProperty('ahora');
    t.ultimo().recibir({ t: 'enfoque', id: 2, sesion: null });
    expect(t.vivo.otros.get(2)?.enfoque).toBeUndefined();
    t.ultimo().recibir({ t: 'enfoque', id: 1, sesion: { modo: 'enfoque', tema: 'Mío', inicio: 0, fin: 60_000, ahora: 0 } });
    expect(t.vivo.yo?.enfoque).toMatchObject({ tema: 'Mío' });
    t.cliente.enfocar({ modo: 'libre', tema: 'x', minutos: 15, visibilidad: 'todos' });
    t.cliente.enfocar(null);
    expect(t.ultimo().enviados.slice(-2)).toEqual([{ t: 'enfoque', sesion: { modo: 'libre', tema: 'x', minutos: 15, visibilidad: 'todos' } }, { t: 'enfoque', sesion: null }]);
  });
});

describe('ClienteRed: lo que sale', () => {
  it('no manda movimientos hasta estar conectado, y luego uno por intervalo', () => {
    const t = montar();
    t.cliente.iniciar();
    t.ultimo().abrir();
    t.cliente.mover(1, 1, 'E', 'caminar');
    expect(t.ultimo().tipos()).toEqual(['hola', 'entrar']);
    t.ultimo().recibir(bienvenida(persona(1)));
    t.cliente.mover(10, 20, 'E', 'caminar');
    t.cliente.mover(12, 20, 'E', 'caminar');
    t.cliente.mover(14, 20, 'E', 'caminar');
    expect(t.ultimo().enviados.filter((m) => m['t'] === 'mover')).toEqual([{ t: 'mover', x: 10, y: 20, dir: 'E', anim: 'caminar' }]);
    t.reloj.avanzar(100);
    expect(t.ultimo().enviados.filter((m) => m['t'] === 'mover').at(-1)).toEqual({ t: 'mover', x: 14, y: 20, dir: 'E', anim: 'caminar' });
  });

  it('cambiar de estado se refleja al instante en ti y se manda al servidor', () => {
    const t = montar();
    t.cliente.iniciar();
    t.ultimo().abrir();
    t.ultimo().recibir(bienvenida(persona(1)));
    t.cliente.cambiarEstado({ estado: 'concentrado', lugar: 'remoto' });
    expect(t.vivo.yo).toMatchObject({ estado: 'concentrado', lugar: 'remoto' });
    expect(t.ultimo().enviados.at(-1)).toEqual({ t: 'estado', estado: 'concentrado', lugar: 'remoto' });
    t.cliente.chat('hola cerca');
    t.cliente.reaccionar('👋');
    expect(t.ultimo().enviados.slice(-2)).toEqual([{ t: 'chat', texto: 'hola cerca' }, { t: 'reaccion', emoji: '👋' }]);
  });
});

describe('ClienteRed: caídas y cierres', () => {
  it('si se corta la red, reconecta con espera creciente y al volver a entrar reinicia la cuenta', () => {
    const t = montar();
    t.cliente.iniciar();
    t.ultimo().abrir();
    t.ultimo().recibir(bienvenida(persona(1), [persona(2)]));
    t.ultimo().cerrar(1006);
    expect(t.estados.at(-1)).toMatchObject({ estado: 'reconectando', intento: 1, reintentoEnMs: 1000 });
    expect(t.vivo.otros.size).toBe(0); // los demás no quedan congelados en pantalla
    expect(t.vivo.yo?.id).toBe(1); // tú sigues
    t.reloj.avanzar(999);
    expect(t.sockets).toHaveLength(1);
    t.reloj.avanzar(1);
    expect(t.sockets).toHaveLength(2);
    t.ultimo().cerrar(1006); // el segundo intento tampoco entra
    expect(t.estados.at(-1)).toMatchObject({ estado: 'reconectando', intento: 2, reintentoEnMs: 2000 });
    t.reloj.avanzar(2000);
    t.ultimo().abrir();
    t.ultimo().recibir(bienvenida(persona(1), [persona(2), persona(4)]));
    expect(t.estados.at(-1)).toEqual({ estado: 'conectado' });
    expect([...t.vivo.otros.keys()]).toEqual([2, 4]);
    t.ultimo().cerrar(1006);
    expect(t.estados.at(-1)).toMatchObject({ intento: 1, reintentoEnMs: 1000 }); // volvió a empezar
  });

  it('«otra sesión» y «sin permiso» cierran para siempre, con el mensaje del servidor', () => {
    for (const [motivo, codigo, texto] of [['otra_sesion', 4001, 'Abriste la oficina en otro lugar.'], ['sin_permiso', 4003, 'No tienes permiso para entrar a la oficina.']] as const) {
      const t = montar();
      t.cliente.iniciar();
      t.ultimo().abrir();
      t.ultimo().recibir(bienvenida(persona(1)));
      t.ultimo().recibir({ t: 'cerrar', motivo, mensaje: texto });
      t.ultimo().cerrar(codigo);
      expect(t.estados.at(-1)).toEqual({ estado: 'cerrado', motivo: texto });
      t.reloj.avanzar(120_000);
      expect(t.sockets).toHaveLength(1);
      expect(t.sesion).not.toHaveBeenCalled();
    }
  });

  it('con «sesión terminada» avisa para volver al ingreso; con la oficina cerrada muestra el horario', () => {
    const t = montar();
    t.cliente.iniciar();
    t.ultimo().abrir();
    t.ultimo().recibir({ t: 'cerrar', motivo: 'sesion_terminada', mensaje: 'Tu sesión terminó. Ingresa de nuevo.' });
    t.ultimo().cerrar(4004);
    expect(t.sesion).toHaveBeenCalledTimes(1);
    const u = montar();
    u.cliente.iniciar();
    u.ultimo().abrir();
    u.ultimo().recibir({ t: 'cerrada', mensaje: 'La oficina está cerrada. Abre lunes a viernes de 8 a 6.' });
    u.ultimo().recibir({ t: 'cerrar', motivo: 'cerrada', mensaje: 'La oficina está cerrada. Abre lunes a viernes de 8 a 6.' });
    u.ultimo().cerrar(4006);
    expect(u.estados.at(-1)).toEqual({ estado: 'cerrado', motivo: 'La oficina está cerrada. Abre lunes a viernes de 8 a 6.' });
  });

  it('con la oficina llena espera al menos 10 segundos antes de volver a intentar', () => {
    const t = montar();
    t.cliente.iniciar();
    t.ultimo().abrir();
    t.ultimo().recibir({ t: 'cerrar', motivo: 'llena', mensaje: 'La oficina está llena por ahora. Intenta en unos minutos.' });
    t.ultimo().cerrar(4002);
    expect(t.estados.at(-1)).toMatchObject({ estado: 'reconectando', reintentoEnMs: 10_000, motivo: 'La oficina está llena por ahora. Intenta en unos minutos.' });
  });

  it('sin token no se conecta', () => {
    const t = montar({ token: null });
    t.cliente.iniciar();
    expect(t.sockets).toHaveLength(0);
    expect(t.estados.at(-1)?.estado).toBe('cerrado');
  });

  it('detener cierra sin reintentar y «reintentar» sirve después de un cierre que se puede arreglar', () => {
    const t = montar();
    t.cliente.iniciar();
    t.ultimo().abrir();
    t.cliente.detener();
    t.reloj.avanzar(60_000);
    expect(t.sockets).toHaveLength(1);

    const u = montar();
    u.cliente.iniciar();
    u.ultimo().abrir();
    u.ultimo().recibir({ t: 'cerrar', motivo: 'otra_sesion', mensaje: 'x' });
    u.ultimo().cerrar(4001);
    u.cliente.reintentar();
    expect(u.sockets).toHaveLength(2);
    expect(u.estados.at(-1)?.estado).toBe('conectando');
  });

  it('manda un ping cada 20 segundos y, si pasan 70 sin noticias del servidor, cierra y reconecta', () => {
    const t = montar();
    t.cliente.iniciar();
    t.ultimo().abrir();
    t.ultimo().recibir(bienvenida(persona(1)));
    t.reloj.avanzar(20_000);
    expect(t.ultimo().tipos().filter((x) => x === 'ping')).toHaveLength(1);
    t.ultimo().recibir({ t: 'pong' });
    t.reloj.avanzar(60_000); // 60 s desde el pong: todavía no es «sin noticias»
    expect(t.sockets).toHaveLength(1);
    t.reloj.avanzar(20_000);
    expect(t.estados.at(-1)?.estado).toBe('reconectando');
  });
});

describe('salas bloqueadas en el cliente', () => {
  it('la bienvenida trae los bloqueos y los avisos del servidor los ponen y los quitan', () => {
    const t = montar();
    t.cliente.iniciar();
    t.ultimo().abrir();
    t.ultimo().recibir({ ...(bienvenida(persona(1)) as Extract<MensajeServidor, { t: 'bienvenida' }>), bloqueos: [{ zona: 'z-sala', por: 2 }] });
    expect(t.vivo.bloqueos.get('z-sala')).toBe(2);
    t.ultimo().recibir({ t: 'sala-bloqueada', zona: 'z-otra', bloqueada: true, por: 3 });
    expect([...t.vivo.bloqueos.keys()].sort()).toEqual(['z-otra', 'z-sala']);
    t.ultimo().recibir({ t: 'sala-bloqueada', zona: 'z-sala', bloqueada: false, por: 2 });
    expect([...t.vivo.bloqueos.keys()]).toEqual(['z-otra']);
  });
});
