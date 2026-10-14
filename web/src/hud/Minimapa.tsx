import { useEffect, useRef } from 'react';
import { CASILLA, objetoPorId, type SalaMapa, type TipoZona } from '@ol/shared';
import type { Puente } from '../mundo/puente';
import { distanciaCercania } from './tipos';

/** Como el de Gather (unos 110 x 80): a 1024 px de ancho con el panel abierto no tapa la barra. */
const LADO_MAX = { w: 120, h: 84 };
const COLOR_ZONA: Record<TipoZona, string> = {
  abierta: 'rgba(255,255,255,0.20)',
  silenciosa: 'rgba(120,220,150,0.38)',
  privada: 'rgba(190,150,255,0.42)',
  sala: 'rgba(120,170,255,0.45)',
  coworking: 'rgba(80,220,200,0.40)',
};

/** Dibuja una sola vez el contorno de la sala: piso, paredes y zonas. */
function dibujarBase(sala: SalaMapa, escala: number, dpr: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = Math.ceil(sala.ancho * escala * dpr);
  c.height = Math.ceil(sala.alto * escala * dpr);
  const g = c.getContext('2d') as CanvasRenderingContext2D;
  g.scale(dpr, dpr);
  g.fillStyle = 'rgba(255,255,255,0.09)';
  for (let y = 0; y < sala.alto; y++) {
    const fila = sala.piso[y];
    if (!fila) continue;
    for (let x = 0; x < sala.ancho; x++) if (fila[x]) g.fillRect(x * escala, y * escala, escala + 0.4, escala + 0.4);
  }
  for (const z of sala.zonas) {
    g.fillStyle = COLOR_ZONA[z.tipo] ?? COLOR_ZONA.abierta;
    g.globalAlpha = 0.28;
    g.fillRect(z.rect.x * escala, z.rect.y * escala, z.rect.w * escala, z.rect.h * escala);
    g.globalAlpha = 1;
    g.strokeStyle = COLOR_ZONA[z.tipo] ?? COLOR_ZONA.abierta;
    g.lineWidth = 0.8;
    g.strokeRect(z.rect.x * escala + 0.4, z.rect.y * escala + 0.4, z.rect.w * escala - 0.8, z.rect.h * escala - 0.8);
  }
  g.fillStyle = 'rgba(255,255,255,0.62)';
  for (const col of sala.colocaciones) {
    const o = objetoPorId(col.objeto);
    if (o?.categoria === 'paredes') g.fillRect(col.x * escala, col.y * escala, Math.max(1, escala * 0.9), Math.max(1, escala * 0.9));
  }
  return c;
}

/** El mapa pequeño de abajo a la izquierda: fondo oscuro, contorno de la oficina, tu punto verde y el círculo de cercanía. */
export function Minimapa({ puente, visible }: { puente: Puente; visible: boolean }) {
  const lienzo = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!visible) return;
    const c = lienzo.current;
    if (!c) return;
    const g = c.getContext('2d') as CanvasRenderingContext2D;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let base: HTMLCanvasElement | null = null;
    let salaBase: SalaMapa | null = null;
    let escala = 3;
    let parar = false;
    let ultimo = 0;
    let cuadro = 0;

    const dibujar = (t: number) => {
      if (parar) return;
      cuadro = requestAnimationFrame(dibujar);
      const cada = document.documentElement.dataset['rendimiento'] === 'eficiente' ? 250 : 90;
      if (t - ultimo < cada) return;
      ultimo = t;
      const sala = puente.almacen.get().sala;
      if (!sala) return;
      if (sala !== salaBase) {
        salaBase = sala;
        escala = Math.max(1, Math.min(LADO_MAX.w / sala.ancho, LADO_MAX.h / sala.alto));
        base = dibujarBase(sala, escala, dpr);
        const w = Math.ceil(sala.ancho * escala);
        const h = Math.ceil(sala.alto * escala);
        c.width = w * dpr;
        c.height = h * dpr;
        c.style.width = `${w}px`;
        c.style.height = `${h}px`;
      }
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.clearRect(0, 0, c.width, c.height);
      if (base) g.drawImage(base, 0, 0);
      g.scale(dpr, dpr);
      const px = escala / CASILLA;
      const yo = puente.vivo.yo;
      for (const o of puente.vivo.otros.values()) {
        if (o.sala !== sala.id) continue;
        g.fillStyle = 'rgba(255,255,255,0.92)';
        g.beginPath();
        g.arc(o.vx * px, (o.vy - 8) * px, Math.max(1.6, escala * 0.55), 0, Math.PI * 2);
        g.fill();
      }
      if (yo) {
        const cx = yo.vx * px;
        const cy = (yo.vy - 8) * px;
        g.strokeStyle = 'rgba(255,255,255,0.55)';
        g.lineWidth = 1;
        g.setLineDash([2, 3]);
        g.beginPath();
        g.arc(cx, cy, distanciaCercania(puente) * escala, 0, Math.PI * 2);
        g.stroke();
        g.setLineDash([]);
        g.fillStyle = '#34c759';
        g.beginPath();
        g.arc(cx, cy, Math.max(2.2, escala * 0.8), 0, Math.PI * 2);
        g.fill();
      }
    };
    cuadro = requestAnimationFrame(dibujar);
    return () => {
      parar = true;
      cancelAnimationFrame(cuadro);
    };
  }, [puente, visible]);

  if (!visible) return null;
  return (
    <div className="hd-minimapa" role="img" aria-label="Mapa pequeño de la oficina: tu posición en verde y tu radio de cercanía">
      <canvas ref={lienzo} aria-hidden="true" />
    </div>
  );
}
