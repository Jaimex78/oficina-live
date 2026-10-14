import { Ban, Dices, Footprints, Lock, PawPrint, Repeat, RotateCcw, RotateCw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CATEGORIAS_EDITOR,
  COLECCIONES,
  CICLO_CAMINAR,
  DIRECCIONES_PERSONAJE,
  AVISO_ASIGNACION,
  MAX_ACCESORIOS,
  MAX_NOMBRE_MASCOTA,
  avatarAlAzar,
  disfrazDisponible,
  mascotaDisponible,
  parteDisponible,
  textoVentana,
  tienePremium,
  type AvatarSpec,
  type CarpetaAccesorio,
  type CatalogoMascotas,
  type CatalogoPersonaje,
  type CategoriaEditor,
  type Cuadro,
  type Direccion,
  type MascotaSpec,
  type OpcionColor,
  type ParteCatalogo,
} from '@ol/shared';
import { ErrorApi, api } from '../api';
import { useAvisos } from '../componentes/Avisos';
import { Cargando } from '../componentes/Estados';
import { useSesion } from '../estado/sesion';
import { Arte } from '../mundo/arte';
import type { FuenteAvatares } from '../mundo/avatar';
import type { FuenteMascotas } from '../mundo/mascotas';

/**
 * Editor de avatar, inspirado en el de Gather: categorías a la izquierda, opciones en cuadrícula de 3 columnas y paleta de colores al
 * centro, y el personaje grande (girando y caminando) a la derecha. Dibuja todo con el atlas real y el mismo `planDeAvatar`
 * que usa el mundo. La primera vez que alguien entra se abre solo, con su personaje de partida ya elegido.
 */

interface DatosCatalogo {
  catalogo: CatalogoPersonaje;
  /** Las mascotas (de la fuente de arte, o las del servidor si el atlas no cargó). */
  mascotas: CatalogoMascotas | null;
  paquetes: string[];
  hoy: Date;
}

/** Un recorte del cuadro de 32 x 64 donde está la figura: la cabeza (con sombreros y peinados altos) o el cuerpo entero. */
interface Recorte {
  x: number;
  y: number;
  w: number;
  h: number;
}
const RECORTE_CABEZA: Recorte = { x: 2, y: 14, w: 28, h: 35 };
const RECORTE_CUERPO: Recorte = { x: 2, y: 14, w: 28, h: 50 };
const RECORTE_MINI_CABEZA: Recorte = { x: 2, y: 14, w: 28, h: 35 };
const RECORTE_MINI_CUERPO: Recorte = { x: 2, y: 36, w: 28, h: 28 };
const RECORTE_VISTA: Recorte = { x: 0, y: 14, w: 32, h: 50 };

const CABEZA: ReadonlySet<CategoriaEditor> = new Set<CategoriaEditor>(['piel', 'cabello', 'vello', 'sombrero', 'gafas']);

/** Cada opción de una categoría: lo que se dibuja en su casilla y lo que pasa al elegirla. */
interface Opcion {
  id: string;
  nombre: string;
  activa: boolean;
  /** Si viene, la opción está bloqueada y esto explica cuándo o cómo se abre. */
  bloqueo?: string;
  /** Cómo se vería el avatar con esta opción puesta. */
  vista: AvatarSpec;
  elegir: () => void;
  /** Es la casilla de «sin esto». */
  ninguna?: boolean;
  /** En la categoría Mascota: la casilla muestra a la criatura, no al personaje. */
  mascota?: MascotaSpec;
}

interface Paleta {
  id: string;
  titulo: string;
  opciones: readonly OpcionColor[];
  elegido: string;
  elegir: (id: string) => void;
}

const hex = (o: OpcionColor): string => o.rampa[2];

/** El avatar sin una de sus partes opcionales. */
function sin<K extends 'chaqueta' | 'especial' | 'barba' | 'mascota'>(spec: AvatarSpec, clave: K): AvatarSpec {
  const { [clave]: _quitada, ...resto } = spec;
  return resto as AvatarSpec;
}

const porId = <T extends { id: string }>(lista: readonly T[] | undefined, id: string | undefined): T | undefined => (id ? lista?.find((p) => p.id === id) : undefined);

function Cuadro({ fuente, spec, dir = 'S', cuadro = 0, recorte, escala, clase }: { fuente: FuenteAvatares; spec: AvatarSpec; dir?: Direccion; cuadro?: Cuadro; recorte: Recorte; escala: number; clase: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    const g = c?.getContext('2d');
    if (!c || !g || !fuente.celda) return;
    g.imageSmoothingEnabled = false;
    g.clearRect(0, 0, c.width, c.height);
    g.drawImage(fuente.celda(spec, dir, cuadro), recorte.x, recorte.y, recorte.w, recorte.h, 0, 0, recorte.w, recorte.h);
  }, [fuente, spec, dir, cuadro, recorte]);
  return <canvas ref={ref} width={recorte.w} height={recorte.h} className={clase} style={{ width: recorte.w * escala, height: recorte.h * escala }} aria-hidden="true" />;
}

/** Un cuadro de una mascota (32 x 32) recortado a la zona donde se dibuja la criatura. */
function CuadroMascota({ fuente, mascota, dir = 'S', cuadro = 0, recorte, escala, clase }: { fuente: FuenteMascotas; mascota: MascotaSpec; dir?: Direccion; cuadro?: 0 | 1 | 2 | 3; recorte: Recorte; escala: number; clase: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    const g = c?.getContext('2d');
    const celda = fuente.celda(mascota, dir, cuadro);
    if (!c || !g || !celda) return;
    g.imageSmoothingEnabled = false;
    g.clearRect(0, 0, c.width, c.height);
    g.drawImage(celda, recorte.x, recorte.y, recorte.w, recorte.h, 0, 0, recorte.w, recorte.h);
  }, [fuente, mascota, dir, cuadro, recorte]);
  return <canvas ref={ref} width={recorte.w} height={recorte.h} className={clase} style={{ width: recorte.w * escala, height: recorte.h * escala }} aria-hidden="true" />;
}

/** La criatura cabe en 24 x 24 dentro del cuadro de 32 x 32 (columnas 4 a 27, filas 8 a 31). */
const RECORTE_MASCOTA: Recorte = { x: 4, y: 8, w: 24, h: 24 };
const RECORTE_MASCOTA_VISTA: Recorte = { x: 0, y: 0, w: 32, h: 32 };

function Muestras({ paleta }: { paleta: Paleta }) {
  const { opciones, elegido, elegir } = paleta;
  const alTeclear = (e: KeyboardEvent<HTMLDivElement>) => {
    const paso = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (paso === 0) return;
    e.preventDefault();
    const i = Math.max(0, opciones.findIndex((o) => o.id === elegido));
    const sig = opciones[(i + paso + opciones.length) % opciones.length];
    if (!sig) return;
    elegir(sig.id);
    requestAnimationFrame(() => e.currentTarget.querySelector<HTMLButtonElement>('[aria-checked="true"]')?.focus());
  };
  return (
    <div className="pj-paleta" role="radiogroup" aria-label={paleta.titulo} onKeyDown={alTeclear}>
      {paleta.titulo && opciones.length > 0 && <span className="pj-paleta__titulo">{paleta.titulo}</span>}
      {opciones.map((o, i) => {
        const activo = o.id === elegido;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={activo}
            aria-label={o.nombre}
            tabIndex={activo || (!opciones.some((x) => x.id === elegido) && i === 0) ? 0 : -1}
            className="pj-muestra"
            style={{ background: hex(o) }}
            title={o.nombre}
            onClick={() => elegir(o.id)}
          />
        );
      })}
    </div>
  );
}

/** El creador de personaje: la primera vez que entras sale solo, y después se abre desde Mi cuenta. */
export default function Creador() {
  const { usuario, actualizarUsuario } = useSesion();
  const navegar = useNavigate();
  const avisos = useAvisos();
  const [arte, setArte] = useState<Arte | null>(null);
  const [datos, setDatos] = useState<DatosCatalogo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [spec, setSpec] = useState<AvatarSpec | null>(null);
  const inicial = useRef<AvatarSpec | null>(null);
  const [apodo, setApodo] = useState(usuario?.apodo ?? '');
  const [categoria, setCategoria] = useState<CategoriaEditor>('piel');
  const [dir, setDir] = useState<Direccion>('S');
  const [girar, setGirar] = useState(() => !window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [caminar, setCaminar] = useState(() => !window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [cuadro, setCuadro] = useState<Cuadro>(0);
  const [guardando, setGuardando] = useState(false);
  const primeraVez = !usuario?.personajeListo;

  useEffect(() => {
    let vigente = true;
    void Promise.all([Arte.cargarPersonajes(), api<{ catalogo: CatalogoPersonaje; mascotas?: CatalogoMascotas; paquetes: string[]; hoy: string }>('/cuenta/personaje/catalogo')])
      .then(([a, c]) => {
        if (!vigente) return;
        setArte(a);
        const catalogo = a.fuenteAvatares().catalogo ?? c.catalogo;
        // Siempre los paquetes de hoy: si la administración te asignó algo, aparece al abrir el creador.
        setDatos({ catalogo, mascotas: a.fuenteMascotas()?.catalogo ?? c.mascotas ?? null, paquetes: c.paquetes, hoy: new Date(c.hoy) });
        setSpec((previo) => {
          if (previo) return previo;
          const partida = usuario?.personaje ?? avatarAlAzar(catalogo, usuario?.id ?? 1);
          inicial.current = partida;
          return partida;
        });
      })
      .catch((x: unknown) => vigente && setError(x instanceof Error ? x.message : 'No se pudo cargar el creador.'));
    return () => {
      vigente = false;
    };
  }, [usuario?.id, usuario?.personaje]);

  const fuente = useMemo(() => arte?.fuenteAvatares() ?? null, [arte]);
  const fuenteMascotas = useMemo(() => arte?.fuenteMascotas() ?? null, [arte]);

  // La vista previa gira sola entre las 4 direcciones y camina; los botones pausan cada cosa.
  useEffect(() => {
    if (!girar) return;
    const tic = setInterval(() => setDir((d) => DIRECCIONES_PERSONAJE[(DIRECCIONES_PERSONAJE.indexOf(d) + 1) % DIRECCIONES_PERSONAJE.length] ?? 'S'), 1600);
    return () => clearInterval(tic);
  }, [girar]);
  useEffect(() => {
    if (!caminar) {
      // Quieto: de vez en cuando parpadea (cuadro 6, ojo medio cerrado).
      setCuadro(0);
      let apagar: ReturnType<typeof setTimeout> | undefined;
      const tic = setInterval(() => {
        setCuadro(6);
        apagar = setTimeout(() => setCuadro(0), 140);
      }, 3200);
      return () => {
        clearInterval(tic);
        if (apagar) clearTimeout(apagar);
      };
    }
    let paso = 0;
    setCuadro(CICLO_CAMINAR[0] as Cuadro);
    const tic = setInterval(() => {
      paso = (paso + 1) % CICLO_CAMINAR.length;
      setCuadro((CICLO_CAMINAR[paso] ?? 0) as Cuadro);
    }, 125);
    return () => clearInterval(tic);
  }, [caminar]);
  /** La mascota tiene 4 cuadros (quieto, paso A, paso B y sentada): se le da el paso que corresponde al del personaje. */
  const cuadroMascota = ({ 0: 0, 1: 1, 2: 0, 3: 2, 4: 0, 5: 3, 6: 0, 7: 3 } as const)[cuadro];

  const giro = useCallback((paso: 1 | -1) => {
    setGirar(false);
    // El orden visual del giro: frente, izquierda, espalda, derecha.
    const orden: Direccion[] = ['S', 'O', 'N', 'E'];
    setDir((d) => orden[(orden.indexOf(d) + paso + orden.length) % orden.length] ?? 'S');
  }, []);

  if (error) return <div className="pj-pagina"><p className="pj-error">{error}</p></div>;
  if (!fuente || !datos || !spec || !usuario) return <div className="pj-pagina"><Cargando texto="Preparando tu personaje…" /></div>;

  const { catalogo, mascotas: catalogoMascotas, paquetes, hoy } = datos;
  const cambiar = (c: Partial<AvatarSpec>) => setSpec((s) => (s ? { ...s, ...c } : s));
  const colores = catalogo.colores;
  const colorBase = colores[0]?.id ?? '';

  // ---------- opciones y paletas de cada categoría ----------

  const accesoriosDe = (carpeta: CarpetaAccesorio): ParteCatalogo[] => catalogo.accesorios.filter((a) => a.carpeta === carpeta);
  /** El accesorio que lleva puesto el avatar en una carpeta (solo uno por carpeta, como en Gather). */
  const puestoEn = (s: AvatarSpec, carpeta: CarpetaAccesorio) => s.accesorios.find((a) => porId(catalogo.accesorios, a.id)?.carpeta === carpeta);
  const conAccesorio = (s: AvatarSpec, carpeta: CarpetaAccesorio, id: string | null): AvatarSpec => {
    const previo = puestoEn(s, carpeta);
    const otros = s.accesorios.filter((a) => porId(catalogo.accesorios, a.id)?.carpeta !== carpeta);
    if (id === null) return { ...s, accesorios: otros };
    return { ...s, accesorios: [...otros, { id, color: previo?.color ?? colorBase, ...(previo?.color2 ? { color2: previo.color2 } : {}) }].slice(0, MAX_ACCESORIOS) };
  };

  /** Lo premium que ya lleva puesto lo conserva: el paquete solo controla lo que se puede elegir de nuevo. */
  const yaLlevaba = new Set<string>([...(inicial.current?.accesorios ?? []).map((a) => a.id), ...(inicial.current?.chaqueta ? [inicial.current.chaqueta.id] : [])]);
  const ropaLibre = (p: ParteCatalogo): boolean => parteDisponible(p, paquetes) || yaLlevaba.has(p.id);
  const bloqueoRopa = (p: ParteCatalogo): { bloqueo: string } | Record<string, never> => (ropaLibre(p) ? {} : { bloqueo: `Es ropa premium. ${AVISO_ASIGNACION}` });

  const opcionNinguna = (activa: boolean, vista: AvatarSpec, elegir: () => void): Opcion => ({ id: 'ninguna', nombre: 'Ninguno', activa, vista, elegir, ninguna: true });

  const opciones = (cat: CategoriaEditor): Opcion[] => {
    switch (cat) {
      case 'piel':
        return catalogo.cuerpos.map((c) => ({ id: c.id, nombre: c.nombre, activa: spec.cuerpo === c.id, vista: { ...spec, cuerpo: c.id }, elegir: () => cambiar({ cuerpo: c.id }) }));
      case 'cabello':
        return catalogo.peinados.map((p) => ({ id: p.id, nombre: p.nombre, activa: spec.peinado === p.id, vista: { ...spec, peinado: p.id }, elegir: () => cambiar({ peinado: p.id }) }));
      case 'vello': {
        const color = spec.barba?.color || spec.pelo;
        return [
          opcionNinguna(!spec.barba, sin(spec, 'barba'), () => setSpec((s) => (s ? sin(s, 'barba') : s))),
          ...(catalogo.barbas ?? []).map((b) => ({ id: b.id, nombre: b.nombre, activa: spec.barba?.id === b.id, vista: { ...spec, barba: { id: b.id, color } }, elegir: () => cambiar({ barba: { id: b.id, color } }) })),
        ];
      }
      case 'arriba':
        return catalogo.arriba.map((a) => ({ id: a.id, nombre: a.nombre, activa: spec.arriba === a.id, vista: { ...spec, arriba: a.id }, elegir: () => cambiar({ arriba: a.id }) }));
      case 'chaqueta': {
        const color = spec.chaqueta?.color ?? colorBase;
        return [
          opcionNinguna(!spec.chaqueta, sin(spec, 'chaqueta'), () => setSpec((s) => (s ? sin(s, 'chaqueta') : s))),
          ...(catalogo.chaquetas ?? []).map((c) => ({ id: c.id, nombre: c.nombre, activa: spec.chaqueta?.id === c.id, ...bloqueoRopa(c), vista: { ...spec, chaqueta: { id: c.id, color } }, elegir: () => cambiar({ chaqueta: { id: c.id, color } }) })),
        ];
      }
      case 'abajo':
        return catalogo.abajo.map((a) => ({ id: a.id, nombre: a.nombre, activa: spec.abajo === a.id, vista: { ...spec, abajo: a.id }, elegir: () => cambiar({ abajo: a.id }) }));
      case 'zapatos':
        return catalogo.zapatos.map((a) => ({ id: a.id, nombre: a.nombre, activa: spec.zapatos === a.id, vista: { ...spec, zapatos: a.id }, elegir: () => cambiar({ zapatos: a.id }) }));
      case 'sombrero':
      case 'gafas':
      case 'otro': {
        const carpeta = cat;
        const puesto = puestoEn(spec, carpeta);
        return [
          opcionNinguna(!puesto, conAccesorio(spec, carpeta, null), () => setSpec((s) => (s ? conAccesorio(s, carpeta, null) : s))),
          ...accesoriosDe(carpeta).map((a) => ({
            id: a.id,
            nombre: a.nombre,
            activa: puesto?.id === a.id,
            ...bloqueoRopa(a),
            vista: conAccesorio(spec, carpeta, a.id),
            elegir: () => setSpec((s) => (s ? conAccesorio(s, carpeta, a.id) : s)),
          })),
        ];
      }
      case 'disfraz':
        return [
          opcionNinguna(!spec.especial, sin(spec, 'especial'), () => setSpec((s) => (s ? sin(s, 'especial') : s))),
          ...(catalogo.especiales ?? []).map((d) => {
            const libre = disfrazDisponible(d, paquetes, hoy);
            const ventana = textoVentana(d.coleccion);
            const bloqueo = libre ? undefined : ventana ? `Se activa ${ventana}.` : 'Te lo asigna la administración.';
            return { id: d.id, nombre: d.nombre, activa: spec.especial?.id === d.id, ...(bloqueo ? { bloqueo } : {}), vista: { ...spec, especial: { id: d.id } }, elegir: () => cambiar({ especial: { id: d.id } }) };
          }),
        ];
      case 'mascota':
        return [
          opcionNinguna(!spec.mascota, sin(spec, 'mascota'), () => setSpec((s) => (s ? sin(s, 'mascota') : s))),
          ...(catalogoMascotas?.mascotas ?? []).map((m) => {
            const color = spec.mascota?.id === m.id ? spec.mascota.color : (m.variantes[0]?.id ?? '');
            const nueva: MascotaSpec = { id: m.id, color, ...(spec.mascota?.nombre ? { nombre: spec.mascota.nombre } : {}) };
            return { id: m.id, nombre: m.nombre, activa: spec.mascota?.id === m.id, ...(mascotaDisponible(m, paquetes) ? {} : { bloqueo: AVISO_ASIGNACION }), vista: { ...spec, mascota: nueva }, mascota: nueva, elegir: () => cambiar({ mascota: nueva }) };
          }),
        ];
    }
  };

  const paletas = (cat: CategoriaEditor): Paleta[] => {
    switch (cat) {
      case 'piel':
        return [{ id: 'piel', titulo: 'Tono de piel', opciones: catalogo.pieles, elegido: spec.piel, elegir: (id) => cambiar({ piel: id }) }];
      case 'cabello':
        return [{ id: 'pelo', titulo: 'Color del cabello', opciones: catalogo.pelos, elegido: spec.pelo, elegir: (id) => cambiar({ pelo: id }) }];
      case 'vello':
        return spec.barba ? [{ id: 'vello', titulo: 'Color del vello facial', opciones: catalogo.pelos, elegido: spec.barba.color || spec.pelo, elegir: (id) => setSpec((s) => (s?.barba ? { ...s, barba: { id: s.barba.id, color: id } } : s)) }] : [];
      case 'arriba': {
        const dobles = porId(catalogo.arriba, spec.arriba)?.slots.includes('ropaB') ?? false;
        return [
          { id: 'arriba', titulo: dobles ? 'Color principal' : 'Color de la prenda', opciones: colores, elegido: spec.colorArriba, elegir: (id) => cambiar({ colorArriba: id }) },
          ...(dobles ? [{ id: 'arriba2', titulo: 'Color secundario', opciones: colores, elegido: spec.colorArriba2, elegir: (id: string) => cambiar({ colorArriba2: id }) }] : []),
        ];
      }
      case 'chaqueta':
        return spec.chaqueta ? [{ id: 'chaqueta', titulo: 'Color de la chaqueta', opciones: colores, elegido: spec.chaqueta.color, elegir: (id) => setSpec((s) => (s?.chaqueta ? { ...s, chaqueta: { id: s.chaqueta.id, color: id } } : s)) }] : [];
      case 'abajo':
        return [{ id: 'abajo', titulo: 'Color de la prenda', opciones: colores, elegido: spec.colorAbajo, elegir: (id) => cambiar({ colorAbajo: id }) }];
      case 'zapatos':
        return [{ id: 'zapatos', titulo: 'Color de los zapatos', opciones: colores, elegido: spec.colorZapatos, elegir: (id) => cambiar({ colorZapatos: id }) }];
      case 'sombrero':
      case 'gafas':
      case 'otro': {
        const puesto = puestoEn(spec, cat);
        if (!puesto) return [];
        const parte = porId(catalogo.accesorios, puesto.id);
        const doble = parte?.slots.includes('accB') ?? false;
        const poner = (c: { color?: string; color2?: string }) => setSpec((s) => (s ? { ...s, accesorios: s.accesorios.map((a) => (a.id === puesto.id ? { ...a, ...c } : a)) } : s));
        return [
          { id: 'acc', titulo: doble ? 'Color principal' : 'Color', opciones: colores, elegido: puesto.color, elegir: (id) => poner({ color: id }) },
          ...(doble ? [{ id: 'acc2', titulo: 'Color secundario', opciones: colores, elegido: puesto.color2 ?? puesto.color, elegir: (id: string) => poner({ color2: id }) }] : []),
        ];
      }
      case 'disfraz': {
        if (!spec.especial) return [];
        const d = porId(catalogo.especiales, spec.especial.id);
        if (!d) return [];
        const e = spec.especial;
        const doble = d.slots.includes('ropaB');
        const poner = (c: { color?: string; color2?: string }) => setSpec((s) => (s?.especial ? { ...s, especial: { ...s.especial, ...c } } : s));
        return [
          { id: 'dis', titulo: doble ? 'Color principal' : 'Color', opciones: colores, elegido: e.color ?? d.porDefecto.color, elegir: (id) => poner({ color: id }) },
          ...(doble ? [{ id: 'dis2', titulo: 'Color secundario', opciones: colores, elegido: e.color2 ?? d.porDefecto.color2 ?? d.porDefecto.color, elegir: (id: string) => poner({ color2: id }) }] : []),
        ];
      }
      case 'mascota': {
        const def = spec.mascota ? catalogoMascotas?.mascotas.find((m) => m.id === spec.mascota?.id) : undefined;
        if (!spec.mascota || !def) return [];
        const variantes: OpcionColor[] = def.variantes.map((v) => ({ id: v.id, nombre: v.nombre, rampa: v.rampas.accA ?? ['#000000', '#444444', '#888888', '#bbbbbb', '#ffffff'] }));
        return [{ id: 'mascota', titulo: 'Color de la mascota', opciones: variantes, elegido: spec.mascota.color, elegir: (id) => setSpec((s) => (s?.mascota ? { ...s, mascota: { ...s.mascota, color: id } } : s)) }];
      }
    }
  };

  /** Aviso de la categoría Disfraz: cuándo se abren los disfraces que están bloqueados. */
  const cerrada = categoria === 'disfraz' ? COLECCIONES.find((c) => catalogo.especiales.some((d) => d.coleccion === c.id && !disfrazDisponible(d, paquetes, hoy))) : undefined;
  const ventanaCerrada = cerrada ? textoVentana(cerrada.id) : null;
  const hayRopaBloqueada = (['chaqueta', 'sombrero', 'gafas', 'otro'] as const).includes(categoria as never) && opciones(categoria).some((o) => o.bloqueo);
  const avisoTexto = cerrada
    ? `Los disfraces de ${cerrada.nombre} se activan ${ventanaCerrada ?? 'cuando la administración te los asigne'}. La administración también puede dártelos antes.`
    : categoria === 'mascota' && (catalogoMascotas?.mascotas ?? []).some((m) => !mascotaDisponible(m, paquetes))
      ? `Las mascotas las asigna la administración. ${AVISO_ASIGNACION}`
      : hayRopaBloqueada
        ? `Lo que tiene candado es ropa premium. ${AVISO_ASIGNACION}`
        : null;

  const lista = opciones(categoria);
  const cabeza = CABEZA.has(categoria);
  const nombreCategoria = CATEGORIAS_EDITOR.find((c) => c.id === categoria)?.nombre ?? '';

  const alAzar = () => {
    const nuevo = avatarAlAzar(catalogo, Math.floor(Math.random() * 2 ** 31), tienePremium(paquetes));
    // Al azar solo cambia la ropa: la mascota (y su nombre) se quedan como estaban.
    setSpec({ ...nuevo, ...(spec.mascota ? { mascota: spec.mascota } : {}) });
  };

  const alTeclearLista = (e: KeyboardEvent<HTMLDivElement>) => {
    const paso = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0;
    if (paso === 0) return;
    e.preventDefault();
    const i = CATEGORIAS_EDITOR.findIndex((c) => c.id === categoria);
    const sig = CATEGORIAS_EDITOR[(i + paso + CATEGORIAS_EDITOR.length) % CATEGORIAS_EDITOR.length];
    if (!sig) return;
    setCategoria(sig.id);
    requestAnimationFrame(() => e.currentTarget.querySelector<HTMLButtonElement>('[aria-selected="true"]')?.focus());
  };

  const cancelar = () => {
    if (primeraVez) {
      if (inicial.current) setSpec(inicial.current);
      setApodo(usuario.apodo ?? '');
      avisos.info('Volviste al personaje con el que empezaste.');
    } else navegar(-1);
  };

  const guardar = async () => {
    setGuardando(true);
    try {
      const nombreMascota = spec.mascota?.nombre?.trim();
      const personaje: AvatarSpec = spec.mascota ? { ...spec, mascota: { id: spec.mascota.id, color: spec.mascota.color, ...(nombreMascota ? { nombre: nombreMascota } : {}) } } : spec;
      const r = await api<{ usuario: typeof usuario }>('/cuenta/perfil', { metodo: 'PUT', cuerpo: { apodo, personaje, confirmar: true } });
      actualizarUsuario(r.usuario);
      navegar('/', { replace: true });
    } catch (x) {
      avisos.error(x instanceof ErrorApi ? x.message : 'No se pudo guardar tu personaje.');
      setGuardando(false);
    }
  };

  return (
    <div className="pj-pagina">
      <div className="pj-modal" role="dialog" aria-modal="true" aria-labelledby="pj-titulo">
        <header className="pj-cab">
          <h1 id="pj-titulo">{primeraVez ? 'Crea tu personaje' : 'Editar avatar'}</h1>
          <p>{primeraVez ? 'Así te verán en la oficina. Ya traes uno de partida: cámbialo como quieras.' : 'Cámbialo cuando quieras.'}</p>
        </header>

        <div className="pj-cuerpo">
          <div className="pj-categorias" role="tablist" aria-orientation="vertical" aria-label="Categorías del personaje" onKeyDown={alTeclearLista}>
            {CATEGORIAS_EDITOR.map((c) => (
              <button key={c.id} type="button" role="tab" id={`pj-tab-${c.id}`} aria-selected={categoria === c.id} aria-controls="pj-panel" tabIndex={categoria === c.id ? 0 : -1} className="pj-categoria" onClick={() => setCategoria(c.id)}>
                {c.id === 'mascota' ? (
                  spec.mascota && fuenteMascotas ? (
                    <CuadroMascota fuente={fuenteMascotas} mascota={spec.mascota} recorte={RECORTE_MASCOTA} escala={1} clase="pj-mini" />
                  ) : (
                    <PawPrint className="pj-mini pj-mini--icono" aria-hidden="true" />
                  )
                ) : (
                  <Cuadro fuente={fuente} spec={spec} recorte={CABEZA.has(c.id) ? RECORTE_MINI_CABEZA : RECORTE_MINI_CUERPO} escala={1} clase="pj-mini" />
                )}
                <span>{c.nombre}</span>
              </button>
            ))}
          </div>

          <div className="pj-centro" id="pj-panel" role="tabpanel" aria-labelledby={`pj-tab-${categoria}`}>
            <div className="pj-opciones" aria-label={`Opciones de ${nombreCategoria}`}>
              {avisoTexto && <p className="pj-aviso">{avisoTexto}</p>}
              <div className="pj-rejilla">
                {lista.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    className={`pj-opcion${o.activa ? ' pj-opcion--activa' : ''}${o.bloqueo ? ' pj-opcion--bloqueada' : ''}${o.ninguna ? ' pj-opcion--ninguna' : ''}`}
                    aria-pressed={o.activa}
                    aria-disabled={o.bloqueo ? true : undefined}
                    aria-label={o.bloqueo ? `${o.nombre}, bloqueado. ${o.bloqueo}` : o.nombre}
                    data-nombre={o.bloqueo ? `${o.nombre} · ${o.bloqueo}` : o.nombre}
                    onClick={() => (o.bloqueo ? avisos.info(`${o.nombre}: ${o.bloqueo}`) : o.elegir())}
                  >
                    {o.ninguna ? (
                      <Ban className="pj-ninguna" aria-hidden="true" />
                    ) : o.mascota && fuenteMascotas ? (
                      <CuadroMascota fuente={fuenteMascotas} mascota={o.mascota} recorte={RECORTE_MASCOTA} escala={3} clase="pj-opcion__img" />
                    ) : (
                      <Cuadro fuente={fuente} spec={o.vista} recorte={cabeza ? RECORTE_CABEZA : RECORTE_CUERPO} escala={3} clase="pj-opcion__img" />
                    )}
                    {o.bloqueo && <Lock className="pj-candado" aria-hidden="true" />}
                  </button>
                ))}
              </div>
            </div>
            <div className="pj-paletas">
              {paletas(categoria).map((p) => (
                <Muestras key={p.id} paleta={p} />
              ))}
              {categoria === 'mascota' && spec.mascota && (
                <label className="pj-apodo pj-apodo--mascota">
                  <span>Nombre de tu mascota (opcional)</span>
                  <input
                    className="entrada"
                    value={spec.mascota.nombre ?? ''}
                    maxLength={MAX_NOMBRE_MASCOTA}
                    placeholder={catalogoMascotas?.mascotas.find((m) => m.id === spec.mascota?.id)?.nombre ?? 'Mascota'}
                    autoComplete="off"
                    onChange={(e) => {
                      const nombre = e.target.value;
                      setSpec((s) => (s?.mascota ? { ...s, mascota: { id: s.mascota.id, color: s.mascota.color, ...(nombre ? { nombre } : {}) } } : s));
                    }}
                  />
                </label>
              )}
            </div>
          </div>

          <section className="pj-vista" aria-label="Vista previa">
            <div className={`pj-escena${spec.mascota && fuenteMascotas ? ' pj-escena--mascota' : ''}`}>
              <Cuadro fuente={fuente} spec={spec} dir={dir} cuadro={cuadro} recorte={RECORTE_VISTA} escala={7} clase="pj-grande" />
              <div className="pj-sombra" aria-hidden="true" />
              {spec.mascota && fuenteMascotas && (
                <>
                  <div className="pj-sombra pj-sombra--mascota" aria-hidden="true" />
                  <CuadroMascota fuente={fuenteMascotas} mascota={spec.mascota} dir={dir} cuadro={cuadroMascota} recorte={RECORTE_MASCOTA_VISTA} escala={4} clase="pj-mascota" />
                </>
              )}
              <button type="button" className="pj-dado" aria-label="Personaje al azar" title="Al azar" onClick={alAzar}>
                <Dices aria-hidden="true" />
              </button>
            </div>
            <div className="pj-controles" role="group" aria-label="Mover la vista previa">
              <button type="button" className="pj-chico" aria-label="Girar a la izquierda" title="Girar a la izquierda" onClick={() => giro(-1)}>
                <RotateCcw aria-hidden="true" />
              </button>
              <button type="button" className="pj-chico" aria-label="Girar a la derecha" title="Girar a la derecha" onClick={() => giro(1)}>
                <RotateCw aria-hidden="true" />
              </button>
              <button type="button" className="pj-chico" aria-pressed={girar} aria-label="Giro automático" title="Giro automático" onClick={() => setGirar((v) => !v)}>
                <Repeat aria-hidden="true" />
              </button>
              <button type="button" className="pj-chico" aria-pressed={caminar} aria-label="Caminar" title="Caminar" onClick={() => setCaminar((v) => !v)}>
                <Footprints aria-hidden="true" />
              </button>
            </div>
            <label className="pj-apodo">
              <span>¿Cómo te llaman?</span>
              <input className="entrada" value={apodo} onChange={(e) => setApodo(e.target.value)} maxLength={24} placeholder={usuario.nombre.split(' ')[0]} autoComplete="off" />
            </label>
          </section>
        </div>

        <footer className="pj-pie">
          <button type="button" className="btn btn--secundario" onClick={cancelar} disabled={guardando}>
            Cancelar
          </button>
          <button type="button" className="btn btn--primario" onClick={() => void guardar()} disabled={guardando}>
            Listo
          </button>
        </footer>
      </div>
    </div>
  );
}
