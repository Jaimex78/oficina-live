import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { areasDeUsuario, colocacionesEditablesDeArea, edificioVacio, type AreaPersonal, type MapaOficina, type SalaMapa, type Zona } from '@ol/shared';
import { ErrorApi } from '../api';
import { useAvisos } from '../componentes/Avisos';
import { Confirmar } from '../componentes/Confirmar';
import { CajaError, Cargando } from '../componentes/Estados';
import { HudMundo } from '../componentes/HudMundo';
import { PanelInteraccion } from '../componentes/PanelInteraccion';
import { Autoguardado } from '../editor/autoguardado';
import { ProveedorEditor, type ContextoEditor } from '../editor/contexto';
import { ControladorEditor } from '../editor/controlador';
import { EditorUI } from '../editor/EditorUI';
import { ModalPublicar } from '../editor/ModalPublicar';
import { useAtajosEditor } from '../editor/atajos';
import { useSesion } from '../estado/sesion';
import { useTema } from '../estado/tema';
import { crearAlmacen, useAlmacen } from '../mundo/almacen';
import { guardarArea, guardarBorradorEnServidor, pedirConstruccion, pedirOficina, publicarMapa, type OficinaPublicada } from '../mundo/api-oficina';
import { IngresoAnimado } from '../ingreso/IngresoAnimado';
import { Arte } from '../mundo/arte';
import { ZOOMS } from '../mundo/escena';
import { Mundo } from '../mundo/Mundo';
import { useRed } from '../mundo/useRed';
import type { Interaccion, Puente } from '../mundo/puente';
import { ESTADO_INICIAL, type EstadoMundo } from '../mundo/tipos';
import { VivoMundo } from '../mundo/vivo';

interface Datos {
  arte: Arte;
  publicado: OficinaPublicada;
}

interface Edicion {
  ctl: ControladorEditor;
  /** Solo quien construye guarda borrador. Quien edita su área guarda al terminar. */
  auto: Autoguardado | null;
  autor: string;
  area?: { sala: string; area: AreaPersonal };
}

const ZOOM_CAMINAR = 2;
const ZOOM_CONSTRUIR = 1;
const SIN_ALMACEN = crearAlmacen<EstadoMundo>({ ...ESTADO_INICIAL });

function salaInicialDe(mapa: MapaOficina): SalaMapa {
  return mapa.salas.find((s) => s.id === mapa.salaInicial) ?? (mapa.salas[0] as SalaMapa);
}

/** La oficina: el mundo en pixel art, donde caminas, y el modo construir para quien tiene permiso. */
export default function Oficina() {
  const { usuario, tiene } = useSesion();
  const { tema } = useTema();
  const avisos = useAvisos();
  const [datos, setDatos] = useState<Datos | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);
  const [arteTemprano, setArteTemprano] = useState<Arte | null>(null);
  const [animando, setAnimando] = useState(true);
  const [edicion, setEdicion] = useState<Edicion | null>(null);
  const [cargandoEdicion, setCargandoEdicion] = useState(false);
  const [publicando, setPublicando] = useState(false);
  const [confirmarSalida, setConfirmarSalida] = useState(false);
  const [zona, setZona] = useState<Zona | null>(null);
  const [cerca, setCerca] = useState<Interaccion | null>(null);
  const [sentado, setSentado] = useState(false);
  const [puesto, setPuesto] = useState<string | null>(null);
  const [interaccion, setInteraccion] = useState<Interaccion | null>(null);
  const ctlRef = useRef<ControladorEditor | null>(null);
  const temporizadorAviso = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---------- carga ----------
  useEffect(() => {
    let vigente = true;
    setError(null);
    const publicado = pedirOficina().catch((x: unknown) => {
      // En desarrollo, si el servidor aún no tiene el mapa, se usa el de ejemplo para poder trabajar la interfaz.
      if (import.meta.env.DEV && x instanceof ErrorApi && (x.estado === 404 || x.estado === 0)) {
        console.warn('[oficina] sin mapa en el servidor: se usa el de ejemplo (solo en desarrollo)');
        return { numero: 0, mapa: edificioVacio(), creadoEn: new Date().toISOString() } satisfies OficinaPublicada;
      }
      throw x;
    });
    const arteP = Arte.cargar();
    void arteP.then((a) => vigente && setArteTemprano(a)).catch(() => undefined);
    void Promise.all([arteP, publicado])
      .then(([arte, pub]) => vigente && setDatos({ arte, publicado: pub }))
      .catch((x: unknown) => vigente && setError(x instanceof Error ? x.message : 'No se pudo cargar la oficina.'));
    return () => {
      vigente = false;
    };
  }, [intento]);

  // ---------- el puente con el motor ----------
  const puente = useMemo<Puente | null>(() => {
    if (!datos || !usuario) return null;
    const sala = salaInicialDe(datos.publicado.mapa);
    const inicial: EstadoMundo = { ...ESTADO_INICIAL, sala, zoom: ZOOM_CAMINAR, luz: document.documentElement.dataset['tema'] === 'oscuro' ? 'oscuro' : 'claro' };
    const almacen = crearAlmacen<EstadoMundo>(inicial);
    const vivo = new VivoMundo();
    const llegada = sala.llegadas[Math.floor(Math.random() * Math.max(1, sala.llegadas.length))] ?? { x: 2, y: 2 };
    vivo.establecerYo({
      id: usuario.id,
      nombre: usuario.nombre,
      cargo: usuario.cargo,
      apodo: usuario.apodo,
      avatar: usuario.personaje,
      sala: sala.id,
      x: llegada.x * 32 + 16,
      y: llegada.y * 32 + 24,
      dir: 'S',
      anim: 'quieto',
      estado: 'disponible',
      lugar: '',
    });
    return {
      arte: datos.arte,
      almacen,
      avatares: datos.arte.fuenteAvatares(),
      mascotas: datos.arte.fuenteMascotas(),
      vivo,
      puntero: (e) => ctlRef.current?.puntero(e),
      alCambiarZona: setZona,
      alCerca: setCerca,
      alSentarse: setSentado,
      alPuesto: setPuesto,
      alInteractuar: setInteraccion,
    };
    // El puente se crea una vez por carga de datos: el mapa publicado cambia por otro camino (almacen.sala).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datos?.arte, usuario?.id]);

  useEffect(() => {
    puente?.almacen.set({ luz: tema === 'oscuro' ? 'oscuro' : 'claro' });
  }, [puente, tema]);

  const modo = useAlmacen(puente?.almacen ?? SIN_ALMACEN, (e) => e.modo);
  const zoom = useAlmacen(puente?.almacen ?? SIN_ALMACEN, (e) => e.zoom);
  const guardado = useAlmacen(puente?.almacen ?? SIN_ALMACEN, (e) => e.guardado);

  // ---------- presencia en red: tú apareces para los demás y ves a quienes están ----------
  // Si se publicó otra versión del mapa, se vuelve a pedir; el mundo la cambia solo cuando no estás construyendo.
  const numeroPublicado = useRef(0);
  numeroPublicado.current = datos?.publicado.numero ?? 0;
  const alMapaNuevo = useCallback(
    (numero: number) => {
      if (!puente || numero === 0 || numero === numeroPublicado.current) return;
      void pedirOficina()
        .then((pub) => {
          setDatos((d) => (d ? { ...d, publicado: pub } : d));
          if (puente.almacen.get().modo !== 'mundo') return;
          const actual = puente.almacen.get().sala?.id;
          puente.almacen.set({ sala: pub.mapa.salas.find((s) => s.id === actual) ?? salaInicialDe(pub.mapa) });
        })
        .catch(() => undefined);
    },
    [puente],
  );
  useRed(puente, { alMapa: alMapaNuevo });

  // ---------- avisos del editor ----------
  const mostrarAviso = useCallback(
    (texto: string, tipo: 'info' | 'error') => {
      puente?.almacen.set({ aviso: { texto, tipo, n: Date.now() } });
      if (temporizadorAviso.current) clearTimeout(temporizadorAviso.current);
      temporizadorAviso.current = setTimeout(() => puente?.almacen.set({ aviso: null }), 3600);
    },
    [puente],
  );
  useEffect(
    () => () => {
      if (temporizadorAviso.current) clearTimeout(temporizadorAviso.current);
    },
    [],
  );

  // ---------- mi área (quien no construye, pero el administrador le dio un área) ----------
  const misAreas = useMemo(() => (datos && usuario && !tiene('construir') ? areasDeUsuario(datos.publicado.mapa, usuario.id) : []), [datos, usuario, tiene]);

  const entrarAMiArea = useCallback(() => {
    const primera = misAreas[0];
    if (!puente || !datos || edicion || !primera) return;
    const { sala: salaId, area } = { sala: primera.sala.id, area: primera.area };
    const ctl = new ControladorEditor({ almacen: puente.almacen, mapa: datos.publicado.mapa, area: { sala: salaId, area }, aviso: mostrarAviso });
    ctlRef.current = ctl;
    puente.almacen.set({
      modo: 'edicion',
      zoom: 2,
      herramienta: 'seleccionar',
      guardado: 'limpio',
      areaPermitida: { ...area.rect },
      centrar: { x: (area.rect.x + area.rect.w / 2) * 32, y: (area.rect.y + area.rect.h / 2) * 32, n: Date.now() },
    });
    setInteraccion(null);
    setEdicion({ ctl, auto: null, autor: '', area: { sala: salaId, area } });
  }, [misAreas, puente, datos, edicion, mostrarAviso]);

  // ---------- construir ----------
  const entrarAConstruir = useCallback(async () => {
    if (!puente || !datos || edicion) return;
    setCargandoEdicion(true);
    try {
      let construccion: Awaited<ReturnType<typeof pedirConstruccion>>;
      try {
        construccion = await pedirConstruccion();
      } catch (x) {
        if (import.meta.env.DEV && x instanceof ErrorApi && (x.estado === 404 || x.estado === 0)) {
          construccion = { publicado: { numero: datos.publicado.numero, creadoEn: datos.publicado.creadoEn, autor: 'Sistema' }, borrador: null };
        } else throw x;
      }
      const mapa = construccion.borrador?.mapa ?? datos.publicado.mapa;
      const auto = new Autoguardado({ almacen: puente.almacen, revisionInicial: construccion.borrador?.revision ?? null, guardar: guardarBorradorEnServidor });
      const ctl = new ControladorEditor({ almacen: puente.almacen, mapa, alCambiar: (m) => auto.programar(m), aviso: mostrarAviso });
      ctlRef.current = ctl;
      const sala = ctl.sala;
      puente.almacen.set({
        modo: 'edicion',
        zoom: ZOOM_CONSTRUIR,
        herramienta: 'seleccionar',
        guardado: construccion.borrador ? 'guardado' : 'limpio',
        centrar: { x: (sala.ancho * 32) / 2, y: (sala.alto * 32) / 2, n: Date.now() },
      });
      setInteraccion(null);
      setEdicion({ ctl, auto, autor: construccion.borrador?.autor ?? '' });
    } catch (x) {
      avisos.error(x instanceof ErrorApi ? x.message : 'No se pudo abrir el modo construir.');
    } finally {
      setCargandoEdicion(false);
    }
  }, [puente, datos, edicion, mostrarAviso, avisos]);

  const cerrarEdicion = useCallback((mapaNuevo?: MapaOficina) => {
    if (!puente || !datos || !edicion) return;
    edicion.auto?.detener();
    edicion.ctl.destruir();
    ctlRef.current = null;
    puente.almacen.set({
      modo: 'mundo',
      zoom: ZOOM_CAMINAR,
      herramienta: 'seleccionar',
      sala: salaInicialDe(mapaNuevo ?? datos.publicado.mapa),
      seleccion: [],
      fantasma: null,
      vistaPrevia: null,
      marquesina: null,
      zonaEnCurso: null,
      areaPermitida: null,
      problemas: [],
      aviso: null,
      guardado: 'limpio',
    });
    setEdicion(null);
    setConfirmarSalida(false);
  }, [puente, datos, edicion]);

  const guardarMiArea = useCallback(async () => {
    if (!edicion?.area || !datos || !puente) return;
    const { sala, area } = edicion.area;
    puente.almacen.set({ guardado: 'guardando' });
    try {
      const editables = colocacionesEditablesDeArea(edicion.ctl.sala, area);
      const r = await guardarArea(sala, area.id, datos.publicado.numero, editables);
      setDatos({ ...datos, publicado: { numero: r.numero, mapa: r.mapa, creadoEn: new Date().toISOString() } });
      cerrarEdicion(r.mapa);
      avisos.ok('Guardé los cambios de tu área.');
    } catch (x) {
      puente.almacen.set({ guardado: 'error' });
      avisos.error(x instanceof ErrorApi ? x.message : 'No se pudo guardar tu área.');
    }
  }, [edicion, datos, puente, avisos, cerrarEdicion]);

  const salirDeConstruir = useCallback(async () => {
    if (!edicion) return;
    if (edicion.area) {
      // Sin guardar: si hubo cambios se avisa antes de perderlos.
      if (edicion.ctl.estado.puedeDeshacer) setConfirmarSalida(true);
      else cerrarEdicion();
      return;
    }
    if (!edicion.auto) return;
    await edicion.auto.ahora();
    const g = puente?.almacen.get().guardado;
    if (g === 'error' || g === 'conflicto') {
      setConfirmarSalida(true);
      return;
    }
    cerrarEdicion();
  }, [edicion, puente, cerrarEdicion]);

  const recargarDelServidor = useCallback(async () => {
    if (!puente || !datos || !edicion || !edicion.auto) return;
    try {
      const c = await pedirConstruccion();
      const mapa = c.borrador?.mapa ?? datos.publicado.mapa;
      edicion.auto.reiniciar(c.borrador?.revision ?? null);
      edicion.ctl.cargarMapa(mapa);
      puente.almacen.set({ guardado: c.borrador ? 'guardado' : 'limpio' });
      setEdicion({ ...edicion, autor: c.borrador?.autor ?? '' });
      mostrarAviso('Cargué lo último que guardó la otra persona.', 'info');
    } catch (x) {
      avisos.error(x instanceof ErrorApi ? x.message : 'No se pudo recargar el borrador.');
    }
  }, [puente, datos, edicion, mostrarAviso, avisos]);

  const publicar = useCallback(
    async (nota: string) => {
      if (!edicion || !datos || !puente || !edicion.auto) return;
      await edicion.auto.ahora();
      const g = puente.almacen.get().guardado;
      if (g === 'error' || g === 'conflicto') throw new Error('No se pudo guardar el borrador antes de publicar. Revisa la conexión o carga lo último.');
      try {
        const r = await publicarMapa(nota);
        const mapa = edicion.ctl.mapaActual;
        setDatos({ ...datos, publicado: { numero: r.numero, mapa, creadoEn: new Date().toISOString() } });
        edicion.auto.reiniciar(null);
        puente.almacen.set({ guardado: 'limpio' });
        setPublicando(false);
        avisos.ok(`Publicaste la versión ${r.numero} de la oficina.`);
      } catch (x) {
        throw new Error(x instanceof ErrorApi ? x.message : 'No se pudo publicar. Intenta de nuevo.');
      }
    },
    [edicion, datos, puente, avisos],
  );

  const contexto = useMemo<ContextoEditor | null>(() => {
    if (!edicion || !puente || !datos) return null;
    return {
      ctl: edicion.ctl,
      almacen: puente.almacen,
      arte: datos.arte,
      salir: () => void salirDeConstruir(),
      publicar: () => setPublicando(true),
      recargarDelServidor: () => void recargarDelServidor(),
      autorBorrador: edicion.autor,
      areaPropia: edicion.area ? { nombre: edicion.area.area.nombre } : null,
      paquetes: edicion.area ? (usuario?.acceso ?? []) : null,
      guardarArea: () => void guardarMiArea(),
    };
  }, [edicion, puente, datos, usuario?.acceso, salirDeConstruir, recargarDelServidor, guardarMiArea]);

  useAtajosEditor(edicion?.ctl ?? null, puente?.almacen ?? SIN_ALMACEN, Boolean(edicion && puente));

  // Mientras se construye, la barra lateral se esconde para darle toda la pantalla a la oficina.
  const construyendo = Boolean(edicion);
  useEffect(() => {
    if (!construyendo) return;
    document.documentElement.dataset['construyendo'] = '1';
    return () => {
      delete document.documentElement.dataset['construyendo'];
    };
  }, [construyendo]);

  // Al salir de la página se deja de guardar y se limpia.
  useEffect(
    () => () => {
      ctlRef.current?.destruir();
      ctlRef.current = null;
    },
    [],
  );

  const cambiarZoom = (paso: 1 | -1) => {
    if (!puente) return;
    const i = ZOOMS.findIndex((z) => z === zoom);
    const z = ZOOMS[Math.max(0, Math.min(ZOOMS.length - 1, (i < 0 ? 2 : i) + paso))];
    if (z !== undefined) puente.almacen.set({ zoom: z });
  };

  const ingreso =
    animando && usuario && arteTemprano ? (
      <IngresoAnimado key="ingreso" hoja={arteTemprano.fuenteAvatares().hoja(usuario.personaje, usuario.id)} listo={Boolean(puente && datos)} alTerminar={() => setAnimando(false)} />
    ) : null;

  if (error) {
    return (
      <section className="panel">
        <CajaError mensaje={error} onReintentar={() => setIntento((n) => n + 1)} />
      </section>
    );
  }
  // Misma forma que el árbol de abajo (hijo 0 = mundo, hijo 1 = ingreso) para que la animación no se reinicie al terminar de cargar.
  if (!puente || !datos) return ingreso ? <div className="mundo">{null}{ingreso}</div> : <Cargando texto="Preparando la oficina…" />;

  const editando = modo === 'edicion' && edicion && contexto;

  return (
    <div className="mundo">
      <Mundo puente={puente} />
      {ingreso}
      {editando ? (
        <ProveedorEditor value={contexto}>
          <EditorUI />
        </ProveedorEditor>
      ) : (
        <>
          <HudMundo
            puente={puente}
            puedeConstruir={tiene('construir')}
            puedeEditarArea={misAreas.length > 0}
            alMiArea={entrarAMiArea}
            cargandoConstruccion={cargandoEdicion}
            zona={zona}
            cerca={cerca}
            sentado={sentado}
            puesto={puesto}
            zoom={zoom}
            alZoom={cambiarZoom}
            alIrAMi={() => puente.ordenes?.irAMi()}
            alUsar={() => puente.ordenes?.usarCercano()}
            alConstruir={() => void entrarAConstruir()}
          />
          {interaccion && <PanelInteraccion i={interaccion} sala={puente.almacen.get().sala} alCerrar={() => setInteraccion(null)} />}
        </>
      )}
      {editando && publicando && <ModalPublicar sala={edicion.ctl.sala} problemas={puente.almacen.get().problemas} alPublicar={publicar} alCerrar={() => setPublicando(false)} />}
      {confirmarSalida && (
        <Confirmar
          titulo="Hay cambios sin guardar"
          mensaje={<p>{edicion?.area ? 'Hiciste cambios en tu área que todavía no guardaste. Si sales ahora, se pierden.' : 'No pude guardar el borrador. Si sales ahora, lo último que hiciste puede perderse.'}</p>}
          textoConfirmar="Salir de todos modos"
          peligro
          onCerrar={() => setConfirmarSalida(false)}
          onConfirmar={async () => cerrarEdicion()}
        />
      )}
      {editando && guardado === 'conflicto' && (
        <div className="ed-conflicto" role="alert">
          <p>{contexto.autorBorrador || 'Otra persona'} guardó cambios en el borrador mientras trabajabas. Tus últimos cambios no se guardaron para no pisar los suyos.</p>
          <button type="button" className="btn btn--primario btn--chico" onClick={contexto.recargarDelServidor}>
            Cargar lo último
          </button>
        </div>
      )}
    </div>
  );
}
