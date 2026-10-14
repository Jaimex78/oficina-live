import type { ClaseId } from './areas';

/**
 * Iconos pequeños dibujados con trazos propios (no son de ninguna biblioteca): se pintan en un canvas 2D
 * y sirven para las píldoras de zona y para la vista esquemática.
 */

export type IconoId = 'personas' | 'libro' | 'sofa' | 'candado' | 'hoja' | 'escritorio' | 'pin';

export const ICONO_DE_CLASE: Record<ClaseId, IconoId> = {
  reunion: 'libro',
  descanso: 'sofa',
  escritorios: 'personas',
  privada: 'candado',
  abierta: 'pin',
  silenciosa: 'hoja',
  escritorio: 'escritorio',
  coworking: 'sofa',
};

/** Color del icono (y de la clase en general) según el tema. */
export const COLOR_CLASE: Record<ClaseId, { claro: string; oscuro: string }> = {
  reunion: { claro: '#5B6BD6', oscuro: '#9AA7FF' },
  descanso: { claro: '#D0529A', oscuro: '#F28CC4' },
  escritorios: { claro: '#6B7694', oscuro: '#A9B3CE' },
  privada: { claro: '#5A6781', oscuro: '#A3AFC9' },
  abierta: { claro: '#B77A3E', oscuro: '#E5B07C' },
  silenciosa: { claro: '#2F8A5B', oscuro: '#7FD6A5' },
  escritorio: { claro: '#6B7694', oscuro: '#A9B3CE' },
  coworking: { claro: '#1E9A8C', oscuro: '#6FE0D2' },
};

type Ctx = CanvasRenderingContext2D;

function rectRedondo(g: Ctx, x: number, y: number, w: number, h: number, r: number): void {
  const rr = Math.min(r, w / 2, h / 2);
  g.beginPath();
  g.moveTo(x + rr, y);
  g.arcTo(x + w, y, x + w, y + h, rr);
  g.arcTo(x + w, y + h, x, y + h, rr);
  g.arcTo(x, y + h, x, y, rr);
  g.arcTo(x, y, x + w, y, rr);
  g.closePath();
}

/** Dibuja el icono dentro del cuadro (x, y, s, s). Los trazos escalan con `s`. */
export function dibujarIcono(g: Ctx, id: IconoId, x: number, y: number, s: number, color: string): void {
  g.save();
  g.translate(x, y);
  g.scale(s, s);
  g.strokeStyle = color;
  g.fillStyle = color;
  g.lineWidth = 0.12;
  g.lineCap = 'round';
  g.lineJoin = 'round';
  switch (id) {
    case 'personas': {
      g.beginPath();
      g.arc(0.36, 0.3, 0.17, 0, Math.PI * 2);
      g.fill();
      g.beginPath();
      g.moveTo(0.08, 0.92);
      g.quadraticCurveTo(0.08, 0.55, 0.36, 0.55);
      g.quadraticCurveTo(0.64, 0.55, 0.64, 0.92);
      g.closePath();
      g.fill();
      g.beginPath();
      g.arc(0.74, 0.36, 0.12, 0, Math.PI * 2);
      g.fill();
      g.beginPath();
      g.moveTo(0.7, 0.62);
      g.quadraticCurveTo(0.94, 0.62, 0.94, 0.9);
      g.lineTo(0.72, 0.9);
      g.closePath();
      g.fill();
      break;
    }
    case 'libro': {
      g.beginPath();
      g.moveTo(0.06, 0.22);
      g.quadraticCurveTo(0.28, 0.12, 0.49, 0.26);
      g.lineTo(0.49, 0.88);
      g.quadraticCurveTo(0.28, 0.76, 0.06, 0.84);
      g.closePath();
      g.moveTo(0.94, 0.22);
      g.quadraticCurveTo(0.72, 0.12, 0.51, 0.26);
      g.lineTo(0.51, 0.88);
      g.quadraticCurveTo(0.72, 0.76, 0.94, 0.84);
      g.closePath();
      g.stroke();
      break;
    }
    case 'sofa': {
      rectRedondo(g, 0.16, 0.18, 0.68, 0.38, 0.1);
      g.stroke();
      rectRedondo(g, 0.04, 0.44, 0.92, 0.3, 0.1);
      g.stroke();
      g.beginPath();
      g.moveTo(0.2, 0.74);
      g.lineTo(0.2, 0.88);
      g.moveTo(0.8, 0.74);
      g.lineTo(0.8, 0.88);
      g.stroke();
      break;
    }
    case 'candado': {
      rectRedondo(g, 0.2, 0.44, 0.6, 0.46, 0.1);
      g.fill();
      g.beginPath();
      g.arc(0.5, 0.44, 0.2, Math.PI, Math.PI * 2);
      g.stroke();
      break;
    }
    case 'hoja': {
      g.beginPath();
      g.moveTo(0.14, 0.86);
      g.quadraticCurveTo(0.08, 0.2, 0.86, 0.12);
      g.quadraticCurveTo(0.9, 0.78, 0.14, 0.86);
      g.closePath();
      g.stroke();
      g.beginPath();
      g.moveTo(0.14, 0.86);
      g.lineTo(0.6, 0.4);
      g.stroke();
      break;
    }
    case 'escritorio': {
      rectRedondo(g, 0.06, 0.28, 0.88, 0.2, 0.06);
      g.fill();
      g.beginPath();
      g.moveTo(0.16, 0.48);
      g.lineTo(0.16, 0.88);
      g.moveTo(0.84, 0.48);
      g.lineTo(0.84, 0.88);
      g.stroke();
      break;
    }
    case 'pin': {
      g.beginPath();
      g.moveTo(0.5, 0.94);
      g.quadraticCurveTo(0.14, 0.58, 0.14, 0.38);
      g.arc(0.5, 0.38, 0.36, Math.PI, 0);
      g.quadraticCurveTo(0.86, 0.58, 0.5, 0.94);
      g.closePath();
      g.stroke();
      g.beginPath();
      g.arc(0.5, 0.38, 0.12, 0, Math.PI * 2);
      g.fill();
      break;
    }
  }
  g.restore();
}
