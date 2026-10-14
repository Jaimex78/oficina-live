import { describe, expect, it } from 'vitest';
import { PLANTILLAS_MAPA, plantillaDeMapa } from '@ol/shared';
import { dibujarMiniatura } from './MiniaturaPlantilla';

/** Un contexto de mentira que solo cuenta lo que se pinta. */
function contextoFalso() {
  const cuadros: { x: number; y: number; w: number; h: number; color: string }[] = [];
  const g = {
    fillStyle: '',
    globalAlpha: 1,
    clearRect: () => undefined,
    fillRect(x: number, y: number, w: number, h: number) {
      cuadros.push({ x, y, w, h, color: String(this.fillStyle) });
    },
  };
  return { g: g as unknown as CanvasRenderingContext2D, cuadros };
}

describe('miniatura de plantilla', () => {
  it.each(PLANTILLAS_MAPA.map((p) => p.id))('«%s»: se dibuja desde sus datos, dentro de su tamaño y con las llegadas en verde', (id) => {
    const sala = plantillaDeMapa(id).salas[0]!;
    const { g, cuadros } = contextoFalso();
    dibujarMiniatura(g, sala, 4);
    expect(cuadros.length).toBeGreaterThan(300);
    for (const c of cuadros) {
      expect(c.x).toBeGreaterThanOrEqual(0);
      expect(c.y).toBeGreaterThanOrEqual(0);
      expect(c.x + c.w).toBeLessThanOrEqual(sala.ancho * 4 + 1);
      expect(c.y + c.h).toBeLessThanOrEqual(sala.alto * 4 + 1);
    }
    expect(cuadros.filter((c) => c.color === '#34c759')).toHaveLength(sala.llegadas.length);
  });

  it('cada plantilla se ve distinta de las demás', () => {
    const huella = (id: (typeof PLANTILLAS_MAPA)[number]['id']): string => {
      const { g, cuadros } = contextoFalso();
      dibujarMiniatura(g, plantillaDeMapa(id).salas[0]!, 4);
      return cuadros.map((c) => `${c.x},${c.y},${c.w},${c.color}`).join(';');
    };
    const todas = PLANTILLAS_MAPA.map((p) => huella(p.id));
    expect(new Set(todas).size).toBe(todas.length);
  });
});
