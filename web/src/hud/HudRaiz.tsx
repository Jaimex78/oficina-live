import { Armchair, Bell, Hammer, House, LayoutGrid, ListChecks, Lock, MapPin, MessageSquare, Monitor, Moon, Presentation, Settings, Sun, UserRound, Users, VolumeX, type LucideIcon } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { EstadoPresencia, NotificacionPlanner, PedidoEnfoque, Zona } from '@ol/shared';
import { useAvisos } from '../componentes/Avisos';
import { TableroPlanner } from '../componentes/TableroPlanner';
import { useMarca } from '../estado/marca';
import { useSesion } from '../estado/sesion';
import { useTema } from '../estado/tema';
import { useAlmacen } from '../mundo/almacen';
import type { Interaccion, Puente } from '../mundo/puente';
import { ZOOMS } from '../mundo/zoom';
import { useNotificaciones } from '../planner/useNotificaciones';
import { BarraInferior } from './BarraInferior';
import { BarraSala } from './BarraSala';
import { AvatarFuera } from './AvatarFuera';
import { Buscador, type ResultadoBusqueda } from './Buscador';
import { Configuracion, type SeccionConfig } from './Configuracion';
import { Controles } from './Controles';
import { avisoCoworkingVisto, marcarAvisoCoworkingVisto } from './coworking';
import { AvisoCoworking, PanelCoworking, SesionesDeLaZona, TarjetaSesion } from './Enfoque';
import { EditarPerfil } from './EditarPerfil';
import { enlaceDeZona, PARAMETRO_SALA } from './enlaces';
import { FICHAS_ESTADO, primerNombre } from './estados';
import { Minimapa } from './Minimapa';
import { sonido } from '../mundo/sonido-global';
import { PildoraLugar } from './PildoraLugar';
import { PanelActividad, PanelMapa } from './Panel';
import { Riel, type Pestana } from './Riel';
import { CapaReacciones, Sobrebarra, type BurbujaCerca, type EfectoReaccion } from './Sobrebarra';
import { copiarTexto } from './teams';
import { TarjetaArea, TarjetaPersona } from './Tarjetas';
import { chatMaximo, ordenesDe, type EventoRuta, type Seleccion } from './tipos';
import { useCercanos } from './useCercanos';
import { usePersonasEn } from './useEnZona';
import { useMiembros, usePresencia } from './usePresencia';
import { useTeams } from './useTeams';
import { usePrefsHud } from './usePrefsHud';

export interface PropsHud {
  puente: Puente;
  puedeConstruir: boolean;
  puedeEditarArea: boolean;
  alMiArea: () => void;
  cargandoConstruccion: boolean;
  zona: Zona | null;
  cerca: Interaccion | null;
  sentado: boolean;
  puesto: string | null;
  zoom: number;
  alZoom: (paso: 1 | -1) => void;
  alIrAMi: () => void;
  alUsar: () => void;
  alConstruir: () => void;
}

const TIPO_ZONA: Record<string, { texto: string; Icono: LucideIcon }> = {
  sala: { texto: 'Sala de reuniones', Icono: Presentation },
  abierta: { texto: 'Zona abierta', Icono: Users },
  silenciosa: { texto: 'Zona silenciosa', Icono: VolumeX },
  privada: { texto: 'Zona privada', Icono: Lock },
  coworking: { texto: 'Zona de coworking', Icono: Armchair },
};

const DURACION_BURBUJA_MS = 8000;
const DURACION_REACCION_MS = 1900;

/**
 * La interfaz flotante de la oficina, como la de Gather: riel y panel a la izquierda, barra oscura abajo, controles y
 * mapa pequeño sobre el mundo, y tarjetas arriba a la derecha. El motor le habla por `puente`; ella le da órdenes con `puente.ordenes`.
 */
export function HudRaiz(props: PropsHud) {
  const { puente, puedeConstruir, puedeEditarArea, zona, cerca, sentado, puesto, zoom } = props;
  const navegar = useNavigate();
  const { usuario, tiene, salir } = useSesion();
  const avisos = useAvisos();
  const { marca } = useMarca();
  const { tema, alternar } = useTema();
  const prefs = usePrefsHud(puente);
  const presencia = usePresencia(puente);
  const miembros = useMiembros(Boolean(usuario), presencia.otros.length);
  const teams = useTeams();
  const notif = useNotificaciones(Boolean(usuario));
  const cercanos = useCercanos(puente);
  // Quiénes están dentro de la sala en la que estás y de la zona tocada (para la barra de la sala y la tarjeta).
  const enMiZona = usePersonasEn(puente, zona?.rect ?? null);

  const sala = useAlmacen(puente.almacen, (e) => e.sala);
  const zoomMin = useAlmacen(puente.almacen, (e) => e.zoomMin);
  const red = useAlmacen(puente.almacen, (e) => e.red);
  const redMotivo = useAlmacen(puente.almacen, (e) => e.redMotivo);

  const [pestana, setPestana] = useState<Pestana>('mapa');
  const [plannerAbierto, setPlannerAbierto] = useState(false);
  const [buscar, setBuscar] = useState<null | 'todo' | 'ir'>(null);
  const [config, setConfig] = useState<SeccionConfig | null>(null);
  const [ruta, setRuta] = useState<EventoRuta | null>(null);
  const [seleccion, setSeleccion] = useState<Seleccion>(null);
  const [panelEnfoque, setPanelEnfoque] = useState(false);
  /** El aviso de la primera vez en una zona de coworking. `alAceptar` sigue con lo que la persona quería hacer (ir hasta allá). */
  const [avisoCowork, setAvisoCowork] = useState<null | { alAceptar?: () => void }>(null);
  const [params, setParams] = useSearchParams();
  const [editarPerfil, setEditarPerfil] = useState(false);
  const [burbujas, setBurbujas] = useState<BurbujaCerca[]>([]);
  const [efectos, setEfectos] = useState<EfectoReaccion[]>([]);
  const campoBuscar = useRef<HTMLInputElement>(null);
  const contador = useRef(0);
  const yoId = usuario?.id ?? 0;
  const zonaTocada = seleccion?.tipo === 'area' ? sala?.zonas.find((z) => z.id === seleccion.id) : undefined;
  const enZonaTocada = usePersonasEn(puente, zonaTocada?.rect ?? null);

  // ---------- lo que el motor avisa ----------
  const agregarBurbuja = useCallback((b: Omit<BurbujaCerca, 'id'>) => {
    const id = ++contador.current;
    setBurbujas((l) => [...l.slice(-3), { ...b, id }]);
    window.setTimeout(() => setBurbujas((l) => l.filter((x) => x.id !== id)), DURACION_BURBUJA_MS);
  }, []);

  const burbujasActivas = useRef(prefs.burbujas);
  burbujasActivas.current = prefs.burbujas;

  useEffect(() => {
    puente.alRuta = (r) => setRuta(r.activa ? r : null);
    puente.alSeleccion = (s) => setSeleccion(s);
    puente.alChat = (m) => {
      if (burbujasActivas.current || m.de === yoId) agregarBurbuja({ nombre: m.nombre, texto: m.texto, propio: m.de === yoId });
      if (m.de !== yoId) sonido.reproducir('mensaje');
    };
    puente.alErrorRed = (m) => avisos.error(m);
    return () => {
      delete puente.alRuta;
      delete puente.alSeleccion;
      delete puente.alChat;
      delete puente.alErrorRed;
    };
  }, [puente, agregarBurbuja, avisos, yoId]);

  // El lienzo cambia de tamaño cuando el panel se pliega o el celular gira: se le avisa a Phaser sin esperar.
  useEffect(() => {
    const t = window.setTimeout(() => window.dispatchEvent(new Event('resize')), 40);
    return () => window.clearTimeout(t);
  }, [prefs.panelAbierto]);

  // ---------- avisos del navegador (si la persona los activó) ----------
  const vistos = useRef<Set<number> | null>(null);
  useEffect(() => {
    if (notif.lista.length === 0 && vistos.current === null) return;
    if (vistos.current === null) {
      vistos.current = new Set(notif.lista.map((a) => a.id));
      return;
    }
    for (const a of notif.lista) {
      if (vistos.current.has(a.id)) continue;
      vistos.current.add(a.id);
      if (!a.leida) sonido.reproducir('aviso');
      if (!a.leida && prefs.avisosNavegador && document.visibilityState === 'hidden' && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        try {
          new Notification(a.titulo, { body: a.texto, tag: `ol-aviso-${a.id}` });
        } catch {
          /* algunos navegadores solo permiten avisos desde un service worker */
        }
      }
    }
  }, [notif.lista, prefs.avisosNavegador]);

  // ---------- atajos ----------
  const hayCapa = buscar !== null || config !== null;
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      const k = e.key.toLowerCase();
      if (mod && k === 'k') {
        e.preventDefault();
        setBuscar((b) => (b ? null : 'todo'));
      } else if (mod && k === 'f') {
        e.preventDefault();
        setPestana('mapa');
        setPlannerAbierto(false);
        prefs.setPanelAbierto(true);
        window.setTimeout(() => campoBuscar.current?.focus(), 30);
      } else if (e.key === 'Escape' && !hayCapa) {
        if (plannerAbierto) setPlannerAbierto(false);
        else if (seleccion) {
          setSeleccion(null);
          ordenesDe(puente).deseleccionar?.();
        }
      }
    };
    document.addEventListener('keydown', tecla);
    return () => document.removeEventListener('keydown', tecla);
  }, [hayCapa, seleccion, plannerAbierto, puente, prefs]);

  // ---------- órdenes al motor ----------
  const avisarSinMotor = useCallback(() => avisos.info('El mundo todavía no puede hacer eso.'), [avisos]);

  const irAPersona = useCallback(
    (id: number) => {
      const o = ordenesDe(puente);
      if (!o.irAPersona) return avisarSinMotor();
      o.irAPersona(id);
    },
    [puente, avisarSinMotor],
  );

  const irAMiEscritorio = useCallback(() => {
    const o = ordenesDe(puente);
    if (!o.irAMiEscritorio) return avisarSinMotor();
    o.irAMiEscritorio();
  }, [puente, avisarSinMotor]);

  const irAArea = useCallback(
    (id: string) => {
      const o = ordenesDe(puente);
      if (!o.irAArea) return avisarSinMotor();
      o.irAArea(id);
    },
    [puente, avisarSinMotor],
  );

  /** «Ir a» una zona. En una de coworking, la primera vez antes sale el aviso de «Cowork en áreas de coworking». */
  const irAZona = useCallback(
    (id: string) => {
      const z = sala?.zonas.find((x) => x.id === id);
      if (z?.tipo === 'coworking' && !avisoCoworkingVisto()) {
        setAvisoCowork({ alAceptar: () => irAArea(id) });
        return;
      }
      irAArea(id);
    },
    [sala, irAArea],
  );

  // Entrar caminando a un área de coworking por primera vez también muestra el aviso.
  useEffect(() => {
    if (zona?.tipo === 'coworking' && !avisoCoworkingVisto()) setAvisoCowork((a) => a ?? {});
  }, [zona?.id, zona?.tipo]);

  // Enlace profundo: /oficina?sala=<id> abre la tarjeta de ese lugar (con «Ir a»).
  const zonaDelEnlace = params.get(PARAMETRO_SALA);
  useEffect(() => {
    if (!zonaDelEnlace || !sala) return;
    const limpiar = () =>
      setParams(
        (p) => {
          p.delete(PARAMETRO_SALA);
          return p;
        },
        { replace: true },
      );
    if (!sala.zonas.some((z) => z.id === zonaDelEnlace)) {
      avisos.info('Ese lugar ya no está en la oficina.');
      limpiar();
      return;
    }
    // El motor tarda un poco en tener la sala dibujada: se prueba cada 400 ms hasta que pueda abrir la tarjeta (máximo unos 10 s).
    let intentos = 0;
    const t = window.setInterval(() => {
      const listo = puente.almacen.get().modo === 'mundo' && Boolean(puente.vivo.yo) && Boolean(ordenesDe(puente).seleccionarArea);
      if (listo) ordenesDe(puente).seleccionarArea?.(zonaDelEnlace);
      if (listo || ++intentos >= 25) {
        window.clearInterval(t);
        limpiar();
      }
    }, 400);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zonaDelEnlace, sala, puente]);

  const cambiarEstado = useCallback(
    (c: { estado?: EstadoPresencia; lugar?: 'naos' | 'remoto' | '' }) => {
      const yo = puente.vivo.yo;
      if (!yo) return;
      const o = ordenesDe(puente);
      if (o.cambiarEstado) o.cambiarEstado(c);
      else puente.red?.cambiarEstado(c);
      // Se refleja en el acto aunque la red tarde o no esté; si el servidor lo rechaza, el motor lo corrige.
      puente.vivo.estado(yo.id, c.estado ?? yo.estado, c.lugar ?? yo.lugar);
    },
    [puente],
  );

  // ---------- sesiones de enfoque (coworking) ----------
  const miEnfoque = presencia.yo?.enfoque ?? null;
  const enCoworking = sentado && zona?.tipo === 'coworking';
  const estadoAntesLocal = useRef<EstadoPresencia | null>(null);
  // El panel se abre al sentarte en una zona de coworking y se cierra al levantarte.
  useEffect(() => {
    setPanelEnfoque(Boolean(enCoworking) && !puente.vivo.yo?.enfoque);
  }, [enCoworking, puente]);

  const iniciarEnfoque = useCallback(
    (pedido: PedidoEnfoque) => {
      const yo = puente.vivo.yo;
      if (!yo) return;
      if (puente.red) {
        if (puente.red.estado !== 'conectado') {
          avisos.error('No hay conexión con la oficina. La sesión no empezó.');
          return;
        }
        puente.red.enfocar(pedido); // tu sesión aparece cuando el servidor la confirma
      } else {
        // Sin conexión (modo local): la sesión vive solo en tu pantalla.
        const ahora = Date.now();
        puente.vivo.enfoque(yo.id, { modo: pedido.modo, tema: pedido.tema, inicio: ahora, fin: ahora + pedido.minutos * 60_000, ...(pedido.spotify ? { spotify: pedido.spotify } : {}) });
        if (pedido.visibilidad !== 'nadie' && yo.estado !== 'concentrado') {
          estadoAntesLocal.current = yo.estado;
          puente.vivo.estado(yo.id, 'concentrado', yo.lugar);
        }
      }
      setPanelEnfoque(false);
    },
    [puente, avisos],
  );

  const terminarEnfoque = useCallback(() => {
    const yo = puente.vivo.yo;
    if (!yo?.enfoque) return;
    puente.red?.enfocar(null);
    puente.vivo.enfoque(yo.id, null);
    if (!puente.red && estadoAntesLocal.current) {
      puente.vivo.estado(yo.id, estadoAntesLocal.current, yo.lugar);
      estadoAntesLocal.current = null;
    }
  }, [puente]);

  // Levantarte cierra la sesión.
  useEffect(() => {
    if (!sentado && miEnfoque) terminarEnfoque();
  }, [sentado, miEnfoque, terminarEnfoque]);

  const reaccionar = useCallback(
    (emoji: string) => {
      const o = ordenesDe(puente);
      if (o.reaccionar) return o.reaccionar(emoji);
      // Sin motor: el emoji sube desde el centro del mundo, donde la cámara sigue a tu personaje, y la red sí lo manda.
      const id = ++contador.current;
      setEfectos((l) => [...l.slice(-6), { id, emoji, dx: Math.round((Math.random() - 0.5) * 36) }]);
      window.setTimeout(() => setEfectos((l) => l.filter((x) => x.id !== id)), DURACION_REACCION_MS);
      puente.alReaccion?.(emoji);
    },
    [puente],
  );

  const enviarCerca = useCallback(
    (texto: string) => {
      const o = ordenesDe(puente);
      if (puente.red && puente.red.estado !== 'conectado') {
        avisos.error('No hay conexión con la oficina. Tu mensaje no salió.');
        return;
      }
      if (o.enviarCerca) o.enviarCerca(texto);
      else if (puente.red) puente.red.chat(texto);
      else agregarBurbuja({ nombre: 'Tú', texto, propio: true }); // sin red solo queda en tu pantalla
    },
    [puente, avisos, agregarBurbuja],
  );

  /** Cómo llamamos a cada persona a la que saludamos, para el aviso que vuelve del servidor. */
  const saludados = useRef(new Map<number, string>());
  const saludar = useCallback(
    (id: number) => {
      const otro = puente.vivo.otros.get(id);
      const miembro = miembros.find((m) => m.id === id);
      const nombre = otro ? primerNombre(otro) : miembro ? primerNombre(miembro) : 'esa persona';
      // Cerca: como siempre, el 👋 sobre tu personaje y un mensaje cercano.
      if (otro && cercanos.some((c) => c.id === id)) {
        reaccionar('👋');
        enviarCerca(`👋 Hola, ${nombre}`);
        return;
      }
      // Lejos o sin conexión: saludo a distancia. El servidor lo entrega solo si la persona está en línea y nos responde qué pasó.
      if (!puente.red) {
        avisos.info(`${nombre} está lejos. Camina hasta allá para saludar.`);
        return;
      }
      if (puente.red.estado !== 'conectado') {
        avisos.error('No hay conexión con la oficina. Tu saludo no salió.');
        return;
      }
      saludados.current.set(id, nombre);
      puente.red.saludar(id);
    },
    [puente, cercanos, miembros, reaccionar, enviarCerca, avisos],
  );

  useEffect(() => {
    puente.alSaludo = (m) => {
      sonido.reproducir('aviso');
      avisos.info(`👋 ${m.nombre.split(' ')[0] ?? m.nombre} te saludó`);
    };
    puente.alResultadoSaludo = ({ a, estado }) => {
      const nombre = saludados.current.get(a) ?? 'esa persona';
      if (estado === 'entregado') avisos.info(`👋 Saludaste a ${nombre}`);
      else if (estado === 'limite') avisos.info(`Ya saludaste a ${nombre} hace un momento. Espera unos segundos.`);
      else avisos.info(`${nombre} no está en línea ahora.`, { texto: 'Abrir un chat de Teams', alElegir: () => void teams.chatCon(a) });
    };
    return () => {
      delete puente.alSaludo;
      delete puente.alResultadoSaludo;
    };
  }, [puente, avisos, teams]);

  const abrirAviso = useCallback(
    (a: NotificacionPlanner) => {
      void notif.leer(a.id);
      if (a.enlace) navegar(a.enlace);
    },
    [notif, navegar],
  );

  // ---------- panel y riel ----------
  const verPestana = (p: Pestana) => {
    setPlannerAbierto(false);
    if (pestana === p && prefs.panelAbierto && !plannerAbierto) prefs.setPanelAbierto(false);
    else {
      setPestana(p);
      prefs.setPanelAbierto(true);
    }
  };

  const tieneArea = puedeEditarArea && !puedeConstruir;
  const accionesMenu = {
    puedeConstruir,
    puedeAdministrar: tiene('administrar'),
    tieneArea,
    construyendo: props.cargandoConstruccion,
    alConfiguracion: () => setConfig('general'),
    alInicio: () => navegar('/'),
    alMiArea: props.alMiArea,
    alConstruir: props.alConstruir,
    alAdministrar: () => navegar('/admin'),
    alCerrarSesion: () => void salir(),
  };

  /** Elegir una zona en ⌘K abre su tarjeta (con «Ir a»), como en Gather. */
  const seleccionarZona = (id: string) => {
    const o = ordenesDe(puente);
    if (o.seleccionarArea) o.seleccionarArea(id);
    else irAArea(id);
  };

  // ---------- búsqueda ⌘K ----------
  const resultados = useMemo<ResultadoBusqueda[]>(() => {
    const lista: ResultadoBusqueda[] = [];
    const yo = presencia.yo;
    if (buscar === 'todo') {
      for (const f of FICHAS_ESTADO) {
        if (yo?.estado === f.estado) continue;
        lista.push({
          id: `estado-${f.estado}`,
          grupo: 'Acciones',
          titulo: `Ponerte como ${f.texto.toLowerCase()}`,
          Icono: f.estado === 'ausente' ? Moon : f.estado === 'concentrado' ? Bell : Sun,
          alElegir: () => cambiarEstado({ estado: f.estado }),
        });
      }
      lista.push({ id: 'mi-escritorio', grupo: 'Acciones', titulo: 'Ir a mi escritorio', Icono: Monitor, alElegir: irAMiEscritorio });
      lista.push({ id: 'planner', grupo: 'Acciones', titulo: 'Abrir el Planner', Icono: ListChecks, claves: 'tareas tablero', alElegir: () => setPlannerAbierto(true) });
      lista.push({
        id: 'actividad',
        grupo: 'Acciones',
        titulo: 'Ver actividad',
        detalle: notif.sinLeer > 0 ? `${notif.sinLeer} sin leer` : undefined,
        Icono: Bell,
        claves: 'avisos notificaciones',
        alElegir: () => {
          setPlannerAbierto(false);
          setPestana('actividad');
          prefs.setPanelAbierto(true);
        },
      });
      lista.push({ id: 'luces', grupo: 'Acciones', titulo: tema === 'claro' ? 'Apagar las luces' : 'Prender las luces', Icono: tema === 'claro' ? Moon : Sun, claves: 'tema oscuro claro modo color', alElegir: () => alternar() });
      lista.push({ id: 'config', grupo: 'Acciones', titulo: 'Abrir la configuración', Icono: Settings, alElegir: () => setConfig('general') });
      if (puedeConstruir) lista.push({ id: 'construir', grupo: 'Acciones', titulo: 'Editar la oficina', Icono: Hammer, claves: 'construir', alElegir: props.alConstruir });
      if (tieneArea) lista.push({ id: 'mi-area', grupo: 'Acciones', titulo: 'Decorar mi área', Icono: LayoutGrid, claves: 'escritorio', alElegir: props.alMiArea });
      lista.push({ id: 'inicio', grupo: 'Acciones', titulo: 'Ir al inicio', Icono: House, alElegir: () => navegar('/') });
    }
    for (const p of presencia.otros) {
      lista.push({ id: `persona-${p.id}`, grupo: 'Personas', titulo: p.nombre, detalle: p.cargo || undefined, Icono: UserRound, persona: { id: p.id, nombre: p.nombre, foto: p.foto }, claves: p.apodo, alElegir: () => irAPersona(p.id) });
    }
    if (buscar === 'todo') {
      // Un chat de Teams por persona, en línea o no. El servidor arma el enlace con su correo.
      const todas = new Map<number, { id: number; nombre: string; apodo: string; cargo: string; foto?: number }>();
      for (const m of miembros) if (m.id !== yoId) todas.set(m.id, m);
      for (const p of presencia.otros) todas.set(p.id, p);
      for (const p of [...todas.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))) {
        lista.push({ id: `teams-${p.id}`, grupo: 'Teams', titulo: `Chat de Teams con ${p.nombre}`, detalle: p.cargo || undefined, Icono: MessageSquare, persona: { id: p.id, nombre: p.nombre, foto: p.foto }, claves: `${p.apodo} chat teams escribir`, soloAlBuscar: true, alElegir: () => void teams.chatCon(p.id) });
      }
    }
    const nombresVistos = new Set<string>();
    for (const z of sala?.zonas ?? []) {
      nombresVistos.add(z.nombre);
      const t = TIPO_ZONA[z.tipo] ?? { texto: 'Zona', Icono: MapPin };
      lista.push({ id: `zona-${z.id}`, grupo: 'Lugares', titulo: z.nombre, detalle: t.texto, Icono: t.Icono, claves: 'zona sala coworking', alElegir: () => seleccionarZona(z.id) });
    }
    for (const a of sala?.areas ?? []) {
      if (nombresVistos.has(a.nombre)) continue;
      lista.push({ id: `area-${a.id}`, grupo: 'Lugares', titulo: a.nombre, detalle: 'Escritorio', Icono: Monitor, alElegir: () => irAArea(a.id) });
    }
    return lista;
    // Las acciones que cambian cada render no importan: se vuelve a armar cuando cambia lo que se muestra.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buscar, presencia, miembros, teams, yoId, sala, notif.sinLeer, tema, puedeConstruir, tieneArea]);

  // ---------- la tarjeta de arriba a la derecha ----------
  const tarjeta = (() => {
    if (!seleccion) return null;
    const cerrar = () => {
      setSeleccion(null);
      ordenesDe(puente).deseleccionar?.();
    };
    if (seleccion.tipo === 'persona') {
      const p = seleccion.id === presencia.yo?.id ? presencia.yo : presencia.otros.find((o) => o.id === seleccion.id);
      if (!p) return null;
      const esYo = p.id === yoId;
      return (
        <TarjetaPersona
          puente={puente}
          persona={p}
          esYo={esYo}
          teams={teams}
          alCerrar={cerrar}
          alEditarPerfil={() => setEditarPerfil(true)}
          alIrA={() => {
            irAPersona(p.id);
            cerrar();
          }}
          alSaludar={() => saludar(p.id)}
          alAviso={(t) => avisos.info(t)}
        />
      );
    }
    const areaTocada = sala?.areas?.find((a) => a.id === seleccion.id);
    const esMia = Boolean(areaTocada?.duenos.includes(yoId));
    return (
      <TarjetaArea
        nombre={seleccion.nombre}
        clase={seleccion.clase}
        claseId={seleccion.claseId}
        zona={zonaTocada}
        puente={puente}
        participantes={enZonaTocada}
        yoId={yoId}
        teams={teams}
        alAviso={(t) => avisos.info(t)}
        puedeEditar={puedeConstruir || esMia}
        etiquetaEditar={puedeConstruir ? 'Editar la oficina' : 'Decorar mi área'}
        alCerrar={cerrar}
        alIrAhi={() => {
          if (zonaTocada) irAZona(seleccion.id);
          else irAArea(seleccion.id);
          cerrar();
        }}
        alCopiarEnlace={zonaTocada ? () => void copiarTexto(enlaceDeZona(zonaTocada.id)).then((ok) => avisos.info(ok ? 'Copié el enlace del lugar.' : 'No pude copiar el enlace. Cópialo a mano.')) : undefined}
        alEditar={puedeConstruir ? props.alConstruir : props.alMiArea}
      />
    );
  })();

  const alIr = () => {
    if (seleccion?.tipo === 'persona' && seleccion.id !== yoId) irAPersona(seleccion.id);
    else if (seleccion?.tipo === 'area') irAArea(seleccion.id);
    else setBuscar('ir');
  };
  const etiquetaIr = seleccion?.tipo === 'persona' && seleccion.id !== yoId ? 'Ir hacia la persona seleccionada' : seleccion?.tipo === 'area' ? 'Ir hacia el lugar seleccionado' : 'Ir a una persona o un lugar';

  const panel =
    pestana === 'mapa' ? (
      <PanelMapa
        puente={puente}
        sala={sala}
        titulo={marca.nombre}
        presencia={presencia}
        miembros={miembros}
        alPlegar={() => prefs.setPanelAbierto(false)}
        campoBuscar={campoBuscar}
        acciones={{
          alSeleccionar: (id) => {
            setSeleccion({ tipo: 'persona', id });
          },
          alIrA: irAPersona,
          alSaludar: saludar,
          alChat: (id) => void teams.chatCon(id),
        }}
      />
    ) : (
      <PanelActividad lista={notif.lista} sinLeer={notif.sinLeer} alAbrir={abrirAviso} alLeerTodas={() => void notif.leerTodas()} alPlegar={() => prefs.setPanelAbierto(false)} />
    );

  const riel = (
    <Riel
      {...accionesMenu}
      pestana={pestana}
      panelAbierto={prefs.panelAbierto}
      plannerAbierto={plannerAbierto}
      sinLeer={notif.sinLeer}
      alMapa={() => verPestana('mapa')}
      alActividad={() => verPestana('actividad')}
      alPlanner={() => setPlannerAbierto((a) => !a)}
      alBuscar={() => setBuscar('todo')}
      alConfiguracion={() => setConfig('general')}
    />
  );

  const redCaida = red === 'reconectando' || red === 'cerrado';

  // ---------- sala de reuniones: candado ----------
  const bloqueadaPorId = zona?.tipo === 'sala' ? puente.vivo.bloqueos.get(zona.id) : undefined;
  const salaBloqueada = bloqueadaPorId !== undefined;
  const bloqueadaPorOtro = salaBloqueada && bloqueadaPorId !== yoId;
  const nombreDeQuienBloqueo = bloqueadaPorOtro ? presencia.otros.find((o) => o.id === bloqueadaPorId)?.nombre : undefined;
  const alternarBloqueo = () => {
    if (!zona || zona.tipo !== 'sala' || bloqueadaPorOtro) return;
    const bloquear = !salaBloqueada;
    if (puente.red) {
      if (puente.red.estado !== 'conectado') {
        avisos.error('No hay conexión con la oficina. El candado no cambió.');
        return;
      }
      puente.red.bloquearSala(zona.id, bloquear);
    } else puente.vivo.bloqueo(zona.id, bloquear, yoId); // sin conexión (modo local) solo cambia en tu pantalla
    avisos.info(bloquear ? 'Bloqueada: esta sala ahora es privada' : 'Desbloqueada: otros pueden unirse');
  };

  return (
    <div className="hud hud--v2" data-panel={prefs.panelAbierto ? 'abierto' : 'cerrado'}>
      <div className="hd-izq">
        {riel}
        {prefs.panelAbierto && (
          <aside className="hd-panel" aria-label={pestana === 'mapa' ? 'Personas de la oficina' : 'Actividad'}>
            {panel}
          </aside>
        )}
      </div>

      <div className="hd-escena">
        {zona && <PildoraLugar zona={zona} personas={enMiZona.length} bloqueada={salaBloqueada} puedeAlternar={!bloqueadaPorOtro} bloqueadaPor={nombreDeQuienBloqueo} alAlternar={alternarBloqueo} />}
        {zona?.tipo === 'sala' && (
          <BarraSala zona={zona} personas={enMiZona} yoId={yoId} teams={teams} bloqueadaPorOtro={bloqueadaPorOtro} puedeConstruir={puedeConstruir} alConstruir={props.alConstruir} alAviso={(t) => avisos.info(t)} />
        )}
        {puesto && (
          <div className="hd-puesto" role="status">
            <MapPin aria-hidden="true" />
            Escritorio de {puesto.split(' · ')[0]}
          </div>
        )}
        {redCaida && (
          <div className="hd-red" role="status">
            <span>{red === 'reconectando' ? 'Reconectando con la oficina…' : (redMotivo ?? 'Se cerró tu conexión con la oficina.')}</span>
            {red === 'cerrado' && puente.red && (
              <button type="button" onClick={() => puente.red?.reintentar()}>
                Reintentar
              </button>
            )}
          </div>
        )}

        {zona?.tipo === 'coworking' && enMiZona.some((p) => p.enfoque && p.id !== yoId) && (
          <div className="hd-zona-sesiones">
            <SesionesDeLaZona personas={enMiZona.filter((p) => p.id !== yoId)} yoId={yoId} />
          </div>
        )}

        {panelEnfoque && enCoworking && zona ? (
          <PanelCoworking zona={zona} alIniciar={iniciarEnfoque} alCerrar={() => setPanelEnfoque(false)} />
        ) : (
          (tarjeta ??
          (miEnfoque && zona ? <TarjetaSesion sesion={miEnfoque} lugar={zona.nombre} enlaceArea={enlaceDeZona(zona.id)} alTerminar={terminarEnfoque} alAviso={(t) => avisos.info(t)} /> : null))
        )}

        <Controles
          zoom={zoom}
          zoomMin={zoomMin}
          zoomMax={ZOOMS[ZOOMS.length - 1] ?? 4}
          alZoom={props.alZoom}
          alMiEscritorio={irAMiEscritorio}
          alCentrar={props.alIrAMi}
          etiquetaIr={etiquetaIr}
          alIr={alIr}
          minimapa={prefs.minimapa}
          alMinimapa={() => prefs.setMinimapa(!prefs.minimapa)}
          vista={prefs.vista}
          alVista={prefs.setVista}
        />

        <Minimapa puente={puente} visible={prefs.minimapa} />
        <AvatarFuera puente={puente} activo={!props.cargandoConstruccion} yo={presencia.yo ? { id: presencia.yo.id, nombre: presencia.yo.nombre, foto: presencia.yo.foto } : null} />

        <Sobrebarra ruta={ruta} alCancelarRuta={() => ordenesDe(puente).cancelarRuta?.()} cerca={cerca} alUsar={props.alUsar} burbujas={burbujas} enfoque={enCoworking && !miEnfoque && !panelEnfoque ? { alAbrir: () => setPanelEnfoque(true) } : null} />
        <CapaReacciones efectos={efectos} />

        <BarraInferior
          yo={presencia.yo}
          cercanos={cercanos}
          zona={zona}
          enZona={enMiZona}
          teams={teams}
          chatMax={chatMaximo(puente)}
          alCambiarEstado={cambiarEstado}
          alReaccionar={reaccionar}
          alEnviarCerca={enviarCerca}
          alEditarPerfil={() => setEditarPerfil(true)}
          alSalir={() => navegar('/')}
          alAviso={(t) => avisos.info(t)}
          enfoque={miEnfoque}
          alTerminarEnfoque={terminarEnfoque}
        />
      </div>

      {plannerAbierto && <TableroPlanner titulo="Planner" alCerrar={() => setPlannerAbierto(false)} />}
      {buscar && <Buscador resultados={resultados} marcador={buscar === 'ir' ? 'Ir a una persona o un lugar...' : 'Encuentra cualquier cosa...'} alCerrar={() => setBuscar(null)} />}
      {editarPerfil && <EditarPerfil alCerrar={() => setEditarPerfil(false)} alAvatar={() => navegar('/personaje')} />}
      {avisoCowork && (
        <AvisoCoworking
          alCancelar={() => setAvisoCowork(null)}
          alAceptar={() => {
            marcarAvisoCoworkingVisto();
            const seguir = avisoCowork.alAceptar;
            setAvisoCowork(null);
            seguir?.();
          }}
        />
      )}
      {config && <Configuracion prefs={prefs} seccionInicial={config} alCerrar={() => setConfig(null)} />}
    </div>
  );
}
