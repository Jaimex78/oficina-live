import { X } from 'lucide-react';
import { useEffect, useId, useRef, type ReactNode } from 'react';

interface Props {
  titulo: string;
  descripcion?: string;
  onCerrar: () => void;
  children: ReactNode;
  pie?: ReactNode;
  ancho?: boolean;
  /** Clase extra para el cuadro (por ejemplo, la configuración de la oficina tiene su propio tamaño). */
  clase?: string;
  /** No se cierra con Escape ni con un clic afuera (por ejemplo, mientras se guarda). */
  bloqueante?: boolean;
}

const ENFOCABLES = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Diálogo con foco atrapado, Escape para cerrar y retorno del foco a quien lo abrió. */
export function Modal({ titulo, descripcion, onCerrar, children, pie, ancho, clase, bloqueante }: Props) {
  const idTitulo = useId();
  const idDescripcion = useId();
  const caja = useRef<HTMLDivElement>(null);
  const cerrar = useRef(onCerrar);
  const fijo = useRef(bloqueante);
  cerrar.current = onCerrar;
  fijo.current = bloqueante;

  useEffect(() => {
    const previo = document.activeElement as HTMLElement | null;
    const raiz = caja.current;
    if (!raiz) return;
    const inicial = raiz.querySelector<HTMLElement>('[data-autofoco]') ?? raiz.querySelector<HTMLElement>('input:not([disabled]), select:not([disabled]), textarea:not([disabled])') ?? raiz.querySelector<HTMLElement>(ENFOCABLES);
    (inicial ?? raiz).focus();
    document.body.style.overflow = 'hidden';

    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !fijo.current) {
        e.stopPropagation();
        cerrar.current();
        return;
      }
      if (e.key !== 'Tab') return;
      const lista = [...raiz.querySelectorAll<HTMLElement>(ENFOCABLES)].filter((el) => el.offsetParent !== null);
      if (lista.length === 0) {
        e.preventDefault();
        return;
      }
      const primero = lista[0] as HTMLElement;
      const ultimo = lista[lista.length - 1] as HTMLElement;
      if (e.shiftKey && document.activeElement === primero) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primero.focus();
      }
    };
    document.addEventListener('keydown', alTeclear);
    return () => {
      document.removeEventListener('keydown', alTeclear);
      document.body.style.overflow = '';
      previo?.focus?.();
    };
  }, []);

  return (
    <div
      className="velo"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !bloqueante) onCerrar();
      }}
    >
      <div ref={caja} className={`modal${ancho ? ' modal--ancho' : ''}${clase ? ` ${clase}` : ''}`} role="dialog" aria-modal="true" aria-labelledby={idTitulo} aria-describedby={descripcion ? idDescripcion : undefined} tabIndex={-1}>
        <div className="modal__cab">
          <div>
            <h2 id={idTitulo} className="sub">
              {titulo}
            </h2>
            {descripcion && <p id={idDescripcion}>{descripcion}</p>}
          </div>
          {!bloqueante && (
            <button type="button" className="modal__cerrar" onClick={onCerrar} aria-label="Cerrar">
              <X aria-hidden="true" size={20} />
            </button>
          )}
        </div>
        {children}
        {pie && <div className="modal__pie">{pie}</div>}
      </div>
    </div>
  );
}
