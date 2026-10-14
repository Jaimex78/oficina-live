import { ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { FotoPersona } from '../componentes/FotoPersona';
import type { Puente } from '../mundo/puente';
import { burbujaFuera, type BurbujaFuera } from './avatar-fuera';
import { ordenesDe } from './tipos';

/** Espacio que dejan libre las barras flotantes: píldoras de arriba, dock de abajo y controles. */
const MARGENES = { izq: 44, der: 44, arriba: 58, abajo: 96 };

/**
 * Si al mover la vista tu personaje queda fuera del cuadro, en el borde del mapa aparece una burbuja redonda con tu foto o tu
 * inicial y una flecha hacia donde estás. Al hacer clic, la cámara vuelve a centrarse en ti. Solo se mira mientras el mundo está activo.
 */
export function AvatarFuera({ puente, activo, yo }: { puente: Puente; activo: boolean; yo: { id: number; nombre: string; foto?: number | undefined } | null }) {
  const [b, setB] = useState<BurbujaFuera | null>(null);

  useEffect(() => {
    if (!activo) {
      setB(null);
      return;
    }
    let cuadro = 0;
    const mirar = () => {
      const p = ordenesDe(puente).miPuntoEnPantalla?.();
      const nueva = p ? burbujaFuera(p, MARGENES) : null;
      setB((v) => {
        if (!nueva || !v) return nueva ?? (v ? null : v);
        return Math.abs(v.x - nueva.x) < 0.5 && Math.abs(v.y - nueva.y) < 0.5 && Math.abs(v.grados - nueva.grados) < 0.5 ? v : nueva;
      });
      cuadro = requestAnimationFrame(mirar);
    };
    cuadro = requestAnimationFrame(mirar);
    return () => cancelAnimationFrame(cuadro);
  }, [puente, activo]);

  if (!b || !yo) return null;
  return (
    <button type="button" className="hd-yo-fuera" style={{ left: b.x, top: b.y }} onClick={() => ordenesDe(puente).centrarEnMi?.()} aria-label="Estás fuera de la vista. Centrar la cámara en ti" title="Ir a mi personaje">
      <FotoPersona id={yo.id} nombre={yo.nombre} foto={yo.foto} className="hd-yo-fuera__foto" decorativa />
      <span className="hd-yo-fuera__flecha" style={{ transform: `rotate(${b.grados}deg) translateX(30px)` }} aria-hidden="true">
        <ArrowRight />
      </span>
    </button>
  );
}
