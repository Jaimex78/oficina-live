import { EllipsisVertical } from 'lucide-react';
import { useEffect, useId, useRef, useState, type ComponentType } from 'react';

export interface ItemMenu {
  clave: string;
  etiqueta: string;
  Icono: ComponentType<{ 'aria-hidden'?: boolean }>;
  onElegir: () => void;
  peligro?: boolean;
  deshabilitado?: boolean;
}

/** Menú de acciones por fila: teclado completo (flechas, Escape) y cierre al hacer clic afuera. */
export function MenuAcciones({ etiqueta, items }: { etiqueta: string; items: ItemMenu[] }) {
  const [abierto, setAbierto] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);
  const boton = useRef<HTMLButtonElement>(null);
  const idMenu = useId();

  useEffect(() => {
    if (!abierto) return;
    raiz.current?.querySelector<HTMLElement>('[role="menuitem"]:not(:disabled)')?.focus();
    const afuera = (e: MouseEvent) => {
      if (!raiz.current?.contains(e.target as Node)) setAbierto(false);
    };
    const tecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setAbierto(false);
        boton.current?.focus();
      }
    };
    document.addEventListener('mousedown', afuera);
    document.addEventListener('keydown', tecla, true);
    return () => {
      document.removeEventListener('mousedown', afuera);
      document.removeEventListener('keydown', tecla, true);
    };
  }, [abierto]);

  const mover = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const todos = [...(raiz.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not(:disabled)') ?? [])];
    const i = todos.indexOf(document.activeElement as HTMLElement);
    const siguiente = e.key === 'ArrowDown' ? (i + 1) % todos.length : (i - 1 + todos.length) % todos.length;
    todos[siguiente]?.focus();
  };

  return (
    <div className="menu-acc" ref={raiz}>
      <button ref={boton} type="button" className="menu-acc__boton" aria-label={etiqueta} aria-haspopup="menu" aria-expanded={abierto} aria-controls={abierto ? idMenu : undefined} onClick={() => setAbierto((a) => !a)}>
        <EllipsisVertical aria-hidden="true" size={20} />
      </button>
      {abierto && (
        <div id={idMenu} className="menu-acc__lista" role="menu" aria-label={etiqueta} onKeyDown={mover}>
          {items.map(({ clave, etiqueta: texto, Icono, onElegir, peligro, deshabilitado }) => (
            <button
              key={clave}
              type="button"
              role="menuitem"
              className={`menu-acc__item${peligro ? ' menu-acc__item--peligro' : ''}`}
              disabled={deshabilitado}
              onClick={() => {
                setAbierto(false);
                onElegir();
              }}
            >
              <Icono aria-hidden={true} />
              {texto}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
