import { useEffect, useRef, useState } from 'react';
import type { ObjetoCatalogo } from '@ol/shared';
import { MiniaturaObjeto } from './MiniaturaObjeto';

type Aviso = () => void;
const avisos = new WeakMap<Element, Aviso>();
let vigia: IntersectionObserver | null = null;

/** Un solo observador para todas las miniaturas: avisa la primera vez que cada una se acerca a la vista. */
function observar(el: Element, alVer: Aviso): () => void {
  vigia ??= new IntersectionObserver(
    (entradas) => {
      for (const e of entradas) {
        if (!e.isIntersecting) continue;
        vigia?.unobserve(e.target);
        avisos.get(e.target)?.();
        avisos.delete(e.target);
      }
    },
    { rootMargin: '240px 0px' },
  );
  avisos.set(el, alVer);
  vigia.observe(el);
  return () => {
    vigia?.unobserve(el);
    avisos.delete(el);
  };
}

/** Miniatura que no se dibuja hasta que está cerca de la parte visible del panel (el inventario pasa de 700 objetos). */
export function MiniaturaPerezosa({ objeto, lado = 64 }: { objeto: ObjetoCatalogo; lado?: number }) {
  const caja = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(typeof IntersectionObserver === 'undefined');
  useEffect(() => {
    const el = caja.current;
    if (visible || !el) return;
    return observar(el, () => setVisible(true));
  }, [visible]);
  return (
    <span ref={caja} className="ed-mini-caja" style={{ width: lado, height: lado }}>
      {visible && <MiniaturaObjeto objeto={objeto} lado={lado} />}
    </span>
  );
}
