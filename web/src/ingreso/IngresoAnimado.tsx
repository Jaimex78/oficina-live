import { useCallback, useEffect, useRef, useState } from 'react';
import { useTema } from '../estado/tema';
import { ALTO, ANCHO } from './dibujo';
import { INICIOS, PUNTO_DE_ESPERA, T_ESTATICO, TOTAL, dibujarCuadro, type ImagenesAscensor, type ImagenesNaos, type RecursosIngreso } from './escenas';

interface Props {
  /** Hoja de animación del personaje de quien entra (4 columnas por 4 filas de 32x48). */
  hoja: HTMLCanvasElement;
  /** true cuando la oficina ya está lista debajo. Mientras no lo esté, el ascensor sigue subiendo. */
  listo: boolean;
  alTerminar: () => void;
}

const SALIDA_MS = 380;

const ARCHIVOS_NAOS = ['fachada-naos-dia.png', 'fachada-naos-noche.png', 'puerta-naos-hoja-izq.png', 'puerta-naos-hoja-der.png', 'puerta-naos-interior.png'] as const;

const ARCHIVOS_ASCENSOR = [
  'ascensor-marco.png',
  'ascensor-hoja-izq.png',
  'ascensor-hoja-der.png',
  'ascensor-llamada.png',
  'ascensor-interior.png',
  'lobby-fondo.png',
  'cabina-fondo.png',
  'pasillo-fondo.png',
  'pasillo-puerta-abierta.png',
] as const;

function cargarImagen(nombre: string): Promise<HTMLImageElement> {
  return new Promise((ok, mal) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = () => mal(new Error(nombre));
    img.src = `/assets/ingreso/${nombre}`;
  });
}

/** Las imágenes de la fachada de Naos; `null` si alguna no está (se usa la de respaldo). */
async function cargarNaos(): Promise<ImagenesNaos | null> {
  try {
    const [dia, noche, hojaIzq, hojaDer, interior] = await Promise.all(ARCHIVOS_NAOS.map(cargarImagen));
    return { dia: dia as HTMLImageElement, noche: noche as HTMLImageElement, hojaIzq: hojaIzq as HTMLImageElement, hojaDer: hojaDer as HTMLImageElement, interior: interior as HTMLImageElement };
  } catch {
    return null;
  }
}

/** El arte del lobby, el ascensor y el pasillo; `null` si falta alguno (esas escenas quedan en un fondo liso). */
async function cargarAscensor(): Promise<ImagenesAscensor | null> {
  try {
    const [marco, hojaIzq, hojaDer, llamada, interior, lobby, cabina, pasillo, puertaAbierta] = (await Promise.all(ARCHIVOS_ASCENSOR.map(cargarImagen))) as HTMLImageElement[];
    return { marco, hojaIzq, hojaDer, llamada, interior, lobby, cabina, pasillo, puertaAbierta } as ImagenesAscensor;
  } catch {
    return null;
  }
}

/** Pantalla de carga en pixel art: tu personaje llega al edificio, sube en el ascensor y entra a la oficina. */
export function IngresoAnimado({ hoja, listo, alTerminar }: Props) {
  const { tema } = useTema();
  const lienzo = useRef<HTMLCanvasElement>(null);
  const t = useRef(0);
  const listoRef = useRef(listo);
  const saltar = useRef(false);
  const terminado = useRef(false);
  const [texto, setTexto] = useState('Llegando al edificio…');
  const [avance, setAvance] = useState(0);
  const [saliendo, setSaliendo] = useState(false);
  const [escala, setEscala] = useState(1);
  const reducido = useRef(typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  listoRef.current = listo;

  const terminar = useCallback(() => {
    if (terminado.current) return;
    terminado.current = true;
    setSaliendo(true);
    window.setTimeout(alTerminar, SALIDA_MS);
  }, [alTerminar]);

  // Tamaño: escala entera cuando cabe, para que los píxeles se vean enteros.
  useEffect(() => {
    const medir = () => {
      const e = Math.min(window.innerWidth / ANCHO, (window.innerHeight - 110) / ALTO);
      setEscala(e >= 1 ? Math.floor(e * 2) / 2 : Math.max(0.3, e));
    };
    medir();
    window.addEventListener('resize', medir);
    return () => window.removeEventListener('resize', medir);
  }, []);

  useEffect(() => {
    const c = lienzo.current;
    const ctx = c?.getContext('2d');
    if (!c || !ctx) return;
    const recursos: RecursosIngreso = { hoja, noche: tema === 'oscuro', naos: null, asc: null };
    // La fachada real se carga aparte: mientras llega se usa la de respaldo, y si falta algún archivo se queda con ella.
    let cancelada = false;
    void cargarNaos().then((n) => {
      if (!cancelada) recursos.naos = n;
    });
    void cargarAscensor().then((a) => {
      if (!cancelada) recursos.asc = a;
    });
    let previo = performance.now();
    let cuadro = 0;
    let ultimoTexto = '';
    let ultimoAvance = -1;
    let esperaReducida = 0;
    // Solo en desarrollo: ?ingresoT=4.5 congela el cuadro en ese segundo para revisar cada escena.
    const congelado = import.meta.env.DEV ? Number(new URLSearchParams(window.location.search).get('ingresoT')) : Number.NaN;
    if (Number.isFinite(congelado) && congelado > 0) {
      const pintar = () => dibujarCuadro(ctx, recursos, congelado, 0, false);
      pintar();
      void Promise.all([cargarNaos(), cargarAscensor()]).then(([n, a]) => {
        recursos.naos = n;
        recursos.asc = a;
        pintar();
      });
      return;
    }

    const paso = (ahora: number) => {
      const dt = Math.min(0.1, (ahora - previo) / 1000);
      previo = ahora;
      if (terminado.current) return;
      if (reducido.current) {
        const info = dibujarCuadro(ctx, recursos, T_ESTATICO, ahora / 1000, true);
        if (info.texto !== ultimoTexto) setTexto('Entrando a tu oficina…');
        ultimoTexto = info.texto;
        esperaReducida += dt;
        if (listoRef.current && esperaReducida > 0.5) return terminar();
      } else {
        const espera = !listoRef.current;
        if (saltar.current && listoRef.current) return terminar();
        if (saltar.current && t.current < INICIOS.cabina) t.current = INICIOS.cabina;
        t.current = espera ? Math.min(PUNTO_DE_ESPERA, t.current + dt) : t.current + dt;
        const info = dibujarCuadro(ctx, recursos, t.current, ahora / 1000, listoRef.current);
        const texto2 = espera && t.current >= PUNTO_DE_ESPERA ? 'Preparando tu oficina…' : info.texto;
        if (texto2 !== ultimoTexto) {
          ultimoTexto = texto2;
          setTexto(texto2);
        }
        const a = Math.round(info.avance * 100);
        if (a !== ultimoAvance) {
          ultimoAvance = a;
          setAvance(a);
        }
        if (info.fin) return terminar();
      }
      cuadro = requestAnimationFrame(paso);
    };
    cuadro = requestAnimationFrame(paso);
    return () => {
      cancelada = true;
      cancelAnimationFrame(cuadro);
    };
  }, [hoja, tema, terminar]);

  const omitir = () => {
    saltar.current = true;
    if (listoRef.current) terminar();
  };

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        omitir();
      }
    };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  });

  return (
    <div className={`ingreso-anim${saliendo ? ' ingreso-anim--sale' : ''}`} role="status" aria-live="polite" aria-label="Entrando a la oficina">
      <canvas ref={lienzo} width={ANCHO} height={ALTO} style={{ width: ANCHO * escala, height: ALTO * escala }} aria-hidden="true" />
      <div className="ingreso-anim__pie" style={{ width: ANCHO * escala }}>
        <p className="ingreso-anim__texto">{texto}</p>
        <div className="ingreso-anim__barra" aria-hidden="true">
          <span style={{ width: `${avance}%` }} />
        </div>
        <button type="button" className="ingreso-anim__saltar" onClick={omitir}>
          Saltar
        </button>
      </div>
    </div>
  );
}

export { TOTAL };
