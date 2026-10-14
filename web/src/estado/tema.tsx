import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from 'react';

/**
 * Luces de la oficina: claro = se prenden las luces y se abren las ventanas; oscuro = se apagan las luces.
 * «auto» sigue el sistema operativo. La elección queda en este navegador.
 */
export type PreferenciaTema = 'auto' | 'claro' | 'oscuro';
export type Tema = 'claro' | 'oscuro';

const CLAVE = 'ol_tema';
const CONSULTA_OSCURO = '(prefers-color-scheme: dark)';

function leerPreferencia(): PreferenciaTema {
  try {
    const v = localStorage.getItem(CLAVE);
    return v === 'claro' || v === 'oscuro' ? v : 'auto';
  } catch {
    return 'auto';
  }
}

function aplicar(tema: Tema): void {
  const raiz = document.documentElement;
  raiz.dataset['tema'] = tema;
  raiz.style.colorScheme = tema === 'oscuro' ? 'dark' : 'light';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', tema === 'oscuro' ? '#101012' : '#f2f2f7');
}

interface Origen {
  x: number;
  y: number;
}

interface ContextoTema {
  preferencia: PreferenciaTema;
  /** El tema que se está viendo ahora (ya resuelto si la preferencia es «auto»). */
  tema: Tema;
  elegir(preferencia: PreferenciaTema, origen?: Origen): void;
  /** Alterna entre claro y oscuro. */
  alternar(origen?: Origen): void;
}

const Ctx = createContext<ContextoTema | null>(null);

type ConTransicion = Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void>; finished: Promise<void> } };

export function TemaProvider({ children }: { children: ReactNode }) {
  const [preferencia, setPreferencia] = useState<PreferenciaTema>(leerPreferencia);
  const [sistemaOscuro, setSistemaOscuro] = useState<boolean>(() => matchMedia(CONSULTA_OSCURO).matches);

  useEffect(() => {
    const mq = matchMedia(CONSULTA_OSCURO);
    const alCambiar = () => setSistemaOscuro(mq.matches);
    mq.addEventListener('change', alCambiar);
    return () => mq.removeEventListener('change', alCambiar);
  }, []);

  const tema: Tema = preferencia === 'auto' ? (sistemaOscuro ? 'oscuro' : 'claro') : preferencia;

  useLayoutEffect(() => {
    aplicar(tema);
  }, [tema]);

  const elegir = useCallback(
    (nueva: PreferenciaTema, origen?: Origen) => {
      const siguiente: Tema = nueva === 'auto' ? (matchMedia(CONSULTA_OSCURO).matches ? 'oscuro' : 'claro') : nueva;
      const guardar = () => {
        try {
          if (nueva === 'auto') localStorage.removeItem(CLAVE);
          else localStorage.setItem(CLAVE, nueva);
        } catch {
          /* sin almacenamiento: dura hasta recargar */
        }
      };

      const doc = document as ConTransicion;
      const sinMovimiento = matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (siguiente === tema || sinMovimiento || !doc.startViewTransition || !origen) {
        guardar();
        setPreferencia(nueva);
        return;
      }

      // El cambio se anima desde el interruptor: la claridad se expande al prender; se recoge al apagar.
      const aClaro = siguiente === 'claro';
      document.documentElement.dataset['transicion'] = aClaro ? 'a-claro' : 'a-oscuro';
      const transicion = doc.startViewTransition(() => {
        aplicar(siguiente);
        guardar();
        setPreferencia(nueva);
      });
      void transicion.ready.then(() => {
        const radio = Math.hypot(Math.max(origen.x, innerWidth - origen.x), Math.max(origen.y, innerHeight - origen.y));
        const circuloChico = `circle(0px at ${origen.x}px ${origen.y}px)`;
        const circuloGrande = `circle(${radio}px at ${origen.x}px ${origen.y}px)`;
        document.documentElement.animate(
          { clipPath: aClaro ? [circuloChico, circuloGrande] : [circuloGrande, circuloChico] },
          {
            duration: aClaro ? 720 : 460,
            easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
            fill: 'forwards',
            pseudoElement: aClaro ? '::view-transition-new(root)' : '::view-transition-old(root)',
          },
        );
      });
      void transicion.finished.finally(() => {
        delete document.documentElement.dataset['transicion'];
      });
    },
    [tema],
  );

  const alternar = useCallback((origen?: Origen) => elegir(tema === 'oscuro' ? 'claro' : 'oscuro', origen), [elegir, tema]);

  const valor = useMemo<ContextoTema>(() => ({ preferencia, tema, elegir, alternar }), [preferencia, tema, elegir, alternar]);
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useTema(): ContextoTema {
  const c = useContext(Ctx);
  if (!c) throw new Error('useTema debe usarse dentro de TemaProvider');
  return c;
}
