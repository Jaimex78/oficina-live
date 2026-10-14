/**
 * Bot de pruebas de presencia: entra a la oficina como una persona de la demostración, camina por la sala siguiendo el mismo
 * A* y la misma regla de colisión que el navegador, reacciona con un emoji y se va. Sirve para ver desde otra pestaña cómo
 * se ve entrar, caminar y salir a otra persona.
 *
 * Uso (con el servidor de la demostración encendido):
 *   npx tsx server/scripts/bot-presencia.ts [usuario] [--segundos 40] [--reaccion 👋] [--puerto 8790] [--sentarse]
 *
 * Solo para uso local: la contraseña es la de las cuentas de la demostración (`CLAVE_DEMO`).
 */
import { WebSocket } from 'ws';
import {
  CASILLA,
  VELOCIDAD_PX_S,
  accesosDeAsiento,
  asientosDe,
  buscarRuta,
  calcularBloqueo,
  descomprimirMapa,
  type MapaGuardado,
  type MensajeCliente,
  type MensajeServidor,
  type SalaMapa,
} from '@ol/shared';
import { CLAVE_DEMO } from '../src/demo';

const args = process.argv.slice(2);
const flag = (nombre: string, defecto: string): string => {
  const i = args.indexOf(`--${nombre}`);
  return i >= 0 && args[i + 1] ? (args[i + 1] as string) : defecto;
};
const usuario = args.find((a) => !a.startsWith('--') && !/^\d+$/.test(a) && args[args.indexOf(a) - 1]?.startsWith('--') !== true) ?? 'demo.ana';
const puerto = flag('puerto', '8790');
const segundos = Number(flag('segundos', '40'));
const reaccion = flag('reaccion', '👋');
const sentarse = args.includes('--sentarse');
const base = `http://127.0.0.1:${puerto}`;

const dormir = (ms: number) => new Promise<void>((ok) => setTimeout(ok, ms));
const log = (...x: unknown[]) => console.log(`[bot ${usuario}]`, ...x);

async function main(): Promise<void> {
  const login = await fetch(`${base}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-OL': '1' }, body: JSON.stringify({ usuario, clave: CLAVE_DEMO }) });
  if (!login.ok) throw new Error(`No pude ingresar como ${usuario}: ${login.status}. ¿Está encendida la demostración?`);
  const { token } = (await login.json()) as { token: string };
  const ofi = (await (await fetch(`${base}/api/oficina`, { headers: { Authorization: `Bearer ${token}`, 'X-OL': '1' } })).json()) as { mapa: MapaGuardado };
  const sala: SalaMapa = descomprimirMapa(ofi.mapa).salas[0] as SalaMapa;
  const bloqueo = calcularBloqueo(sala);

  const ws = new WebSocket(`ws://127.0.0.1:${puerto}/ws`);
  const enviar = (m: MensajeCliente) => ws.send(JSON.stringify(m));
  let yo = { x: 0, y: 0, id: 0 };
  const bienvenida = new Promise<void>((ok, mal) => {
    ws.on('message', (d) => {
      const m = JSON.parse(d.toString()) as MensajeServidor;
      if (m.t === 'bienvenida') {
        yo = { x: m.yo.x, y: m.yo.y, id: m.yo.id };
        log(`entré como ${m.yo.nombre} en (${Math.round(m.yo.x)}, ${Math.round(m.yo.y)}); en la sala: ${m.personas.map((p) => p.nombre).join(', ') || 'nadie más'}`);
        ok();
      } else if (m.t === 'entra') log(`entró ${m.persona.nombre}`);
      else if (m.t === 'sale') log(`salió ${m.id}`);
      else if (m.t === 'corregir') {
        log(`el servidor me corrigió a (${Math.round(m.x)}, ${Math.round(m.y)})`);
        yo.x = m.x;
        yo.y = m.y;
      } else if (m.t === 'cerrar') {
        log(`cierre: ${m.motivo}: ${m.mensaje}`);
        mal(new Error(m.mensaje));
      } else if (m.t === 'chat') log(`chat de ${m.nombre}: ${m.texto}`);
    });
    ws.on('close', () => log('conexión cerrada'));
  });
  await new Promise<void>((ok, mal) => {
    ws.on('open', () => ok());
    ws.on('error', mal);
  });
  enviar({ t: 'hola', token });
  enviar({ t: 'entrar' });
  await bienvenida;

  /** Camina por una ruta de casillas a la velocidad normal, mandando un movimiento cada 100 ms. */
  async function caminarPor(ruta: { x: number; y: number }[]): Promise<void> {
    for (const c of ruta) {
      const meta = { x: c.x * CASILLA + CASILLA / 2, y: c.y * CASILLA + 24 };
      while (Math.hypot(meta.x - yo.x, meta.y - yo.y) > 2) {
        const d = Math.hypot(meta.x - yo.x, meta.y - yo.y);
        const paso = Math.min(d, (VELOCIDAD_PX_S * 100) / 1000);
        const dx = ((meta.x - yo.x) / d) * paso;
        const dy = ((meta.y - yo.y) / d) * paso;
        yo.x += dx;
        yo.y += dy;
        const dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'O' : 'E') : dy < 0 ? 'N' : 'S';
        enviar({ t: 'mover', x: yo.x, y: yo.y, dir, anim: 'caminar' });
        await dormir(100);
      }
    }
    enviar({ t: 'mover', x: yo.x, y: yo.y, dir: 'S', anim: 'quieto' });
  }

  const celdaActual = () => ({ x: Math.floor(yo.x / CASILLA), y: Math.floor((yo.y - 4) / CASILLA) });
  const libres: { x: number; y: number }[] = [];
  for (let y = 0; y < sala.alto; y++) for (let x = 0; x < sala.ancho; x++) if (!bloqueo[y * sala.ancho + x]) libres.push({ x, y });

  const fin = Date.now() + segundos * 1000;
  let primera = true;
  while (Date.now() < fin) {
    if (sentarse && primera) {
      // Va a una silla libre y se sienta en ella.
      const asiento = asientosDe(sala).find((a) => accesosDeAsiento(sala, a.x, a.y).length > 0);
      if (asiento) {
        const acceso = accesosDeAsiento(sala, asiento.x, asiento.y)[0] as [number, number];
        const r = buscarRuta(bloqueo, sala.ancho, sala.alto, celdaActual(), { x: acceso[0], y: acceso[1] });
        if (r) {
          log(`camino a sentarme en (${asiento.x}, ${asiento.y})`);
          await caminarPor(r);
          yo.x = asiento.x * CASILLA + CASILLA / 2;
          yo.y = asiento.y * CASILLA + CASILLA - 3;
          enviar({ t: 'mover', x: yo.x, y: yo.y, dir: asiento.mira, anim: 'sentado' });
          log('sentado');
          await dormir(4000);
        }
      }
    }
    primera = false;
    const destino = libres[Math.floor(Math.random() * libres.length)];
    if (!destino) break;
    const ruta = buscarRuta(bloqueo, sala.ancho, sala.alto, celdaActual(), destino);
    if (!ruta || ruta.length === 0) continue;
    log(`camino a (${destino.x}, ${destino.y}), ${ruta.length} casillas`);
    await caminarPor(ruta);
    enviar({ t: 'reaccion', emoji: reaccion });
    await dormir(1500);
  }
  log('me voy');
  ws.close(1000);
  await dormir(300);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
