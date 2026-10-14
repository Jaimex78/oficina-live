import { useEffect, type RefObject } from 'react';

export type Rgb = [number, number, number];

/**
 * Las luces del panel oscuro reaccionan al puntero: tres variables CSS (posición y color) se
 * actualizan con requestAnimationFrame y un suavizado (lerp). Con «reducir movimiento» quedan quietas.
 */
export function useLucesInteractivas(ref: RefObject<HTMLElement | null>, paleta: Rgb[]): void {
  const clave = paleta.map((c) => c.join(',')).join('|');

  useEffect(() => {
    const panel = ref.current;
    if (!panel) return;
    const colores = clave.split('|').map((c) => c.split(',').map(Number) as Rgb);
    const n = colores.length;
    const estado = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, k: 0, tk: 0 };

    const color = (k: number, desfase: number): string => {
      const t = ((((k + desfase) % 1) + 1) % 1) * n;
      const i = Math.floor(t) % n;
      const j = (i + 1) % n;
      const f = t - Math.floor(t);
      const a = colores[i] as Rgb;
      const b = colores[j] as Rgb;
      return a.map((v, m) => Math.round(v + ((b[m] as number) - v) * f)).join(',');
    };

    const poner = (): void => {
      const s = panel.style;
      s.setProperty('--c1', color(estado.k, 0));
      s.setProperty('--c2', color(estado.k, 0.34));
      s.setProperty('--c3', color(estado.k, 0.67));
      const dx = estado.x - 0.5;
      const dy = estado.y - 0.5;
      s.setProperty('--ax', `${dx * -150}px`);
      s.setProperty('--ay', `${dy * 130}px`);
      s.setProperty('--bx', `${dx * 170}px`);
      s.setProperty('--by', `${dy * -140}px`);
      s.setProperty('--cx', `${dx * 260}px`);
      s.setProperty('--cy', `${dy * 230}px`);
    };

    poner();
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const mover = (e: PointerEvent): void => {
      const r = panel.getBoundingClientRect();
      estado.tx = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
      estado.ty = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
      estado.tk = estado.tx * 0.75 + estado.ty * 0.25; // el color depende sobre todo de por dónde cruza en horizontal
    };
    panel.addEventListener('pointermove', mover);
    panel.addEventListener('pointerdown', mover);

    let cuadro = 0;
    const lazo = (): void => {
      estado.x += (estado.tx - estado.x) * 0.07;
      estado.y += (estado.ty - estado.y) * 0.07;
      estado.k += (estado.tk - estado.k) * 0.035;
      poner();
      cuadro = requestAnimationFrame(lazo);
    };
    cuadro = requestAnimationFrame(lazo);

    return () => {
      cancelAnimationFrame(cuadro);
      panel.removeEventListener('pointermove', mover);
      panel.removeEventListener('pointerdown', mover);
    };
  }, [ref, clave]);
}
