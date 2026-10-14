import { VELOCIDAD_PX_S } from '@ol/shared';
import { describe, expect, it } from 'vitest';
import { PX_POR_CUADRO, cicloDeCaminar, cuadroDeCaminar, recorridoAlParar } from './pasos';

describe('cadencia de los pasos', () => {
  it('a la velocidad normal son 8 cuadros por segundo', () => {
    expect(VELOCIDAD_PX_S / PX_POR_CUADRO).toBe(8);
  });

  it('el ciclo sigue la distancia: arranca en el contacto A y recorre los 4 cuadros de caminar en orden', () => {
    const c = cicloDeCaminar();
    expect(c).toEqual([1, 2, 3, 4]);
    expect([0, 1, 2, 3, 4].map((k) => cuadroDeCaminar(k * PX_POR_CUADRO + 1, c))).toEqual([1, 2, 3, 4, 1]);
  });

  it('despacio los pies van despacio: la mitad de distancia, la mitad de cuadros', () => {
    expect(cuadroDeCaminar(PX_POR_CUADRO - 1)).toBe(1);
    expect(cuadroDeCaminar(PX_POR_CUADRO * 2 - 1)).toBe(2);
  });

  it('al parar el recorrido salta a un paso de apoyo, alternando de pie', () => {
    // Paró con 1.3 cuadros recorridos: el siguiente arranque empieza en el cuadro de contacto B (3), el otro pie.
    const px = recorridoAlParar(1.3 * PX_POR_CUADRO);
    expect(cuadroDeCaminar(px)).toBe(3);
    // Y siempre cae en un cuadro de contacto (1 o 3), nunca en uno de paso.
    for (const k of [0.1, 0.9, 1.5, 2.2, 3.7, 7.3]) expect([1, 3]).toContain(cuadroDeCaminar(recorridoAlParar(k * PX_POR_CUADRO)));
  });
});
