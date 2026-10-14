import { describe, expect, it } from 'vitest';
import { ZOOMS, debeVerEsquema, pasoDeZoom, radioCirculo, suavizar, zoomMinimoPermitido, zoomQueAjusta } from './zoom';

describe('zoom que hace caber la sala', () => {
  const W = 46 * 32;
  const H = 30 * 32;
  it('en un escritorio de 1280 x 800 la sala cabe a poco más de la mitad y se permite alejar hasta el esquema', () => {
    const ajuste = zoomQueAjusta(1280, 800, W, H);
    expect(ajuste).toBeGreaterThan(0.7);
    expect(ajuste).toBeLessThan(0.9);
    expect(zoomMinimoPermitido(ajuste)).toBe(0.35);
  });
  it('un mapa grande en una pantalla de 1440 x 900 llega hasta los pasos más lejanos', () => {
    const ajuste = zoomQueAjusta(1440, 900, 120 * 32, 120 * 32);
    expect(ajuste).toBeLessThan(0.25);
    expect(zoomMinimoPermitido(ajuste)).toBe(ZOOMS[0]);
  });
  it('datos inválidos no rompen nada', () => {
    expect(zoomQueAjusta(0, 0, W, H)).toBe(ZOOMS[0]);
    expect(zoomMinimoPermitido(0)).toBe(ZOOMS[0]);
  });
});

describe('cuándo se ve el esquema', () => {
  it('forzada y apagada ignoran el zoom', () => {
    expect(debeVerEsquema('forzada', 4, false)).toBe(true);
    expect(debeVerEsquema('apagada', 0.15, true)).toBe(false);
  });
  it('en auto entra al alejar y sale al acercar, con una franja en medio donde no cambia', () => {
    expect(debeVerEsquema('auto', 0.35, false)).toBe(true);
    expect(debeVerEsquema('auto', 0.5, false)).toBe(false);
    expect(debeVerEsquema('auto', 0.5, true)).toBe(true); // ya estaba en esquema: sigue
    expect(debeVerEsquema('auto', 0.5, false)).toBe(false); // ya estaba en arte: sigue
    expect(debeVerEsquema('auto', 1, true)).toBe(false);
  });
});

describe('pasoDeZoom', () => {
  it('sube y baja de a un paso y respeta el mínimo', () => {
    expect(pasoDeZoom(1, -1)).toBe(0.5);
    expect(pasoDeZoom(1, 1)).toBe(2);
    expect(pasoDeZoom(0.35, -1, 0.35)).toBe(0.35);
    expect(pasoDeZoom(4, 1)).toBe(4);
    expect(pasoDeZoom(0.5, -1, 0.35)).toBe(0.35);
  });
  it('un valor que no es un paso parte del más cercano', () => {
    expect(pasoDeZoom(1.4, 1)).toBe(2);
  });
});

describe('suavizar', () => {
  it('se acerca sin pasarse y termina clavado en el objetivo', () => {
    let v = 0;
    for (let i = 0; i < 200; i++) v = suavizar(v, 1, 1 / 60, 6);
    expect(v).toBe(1);
    expect(suavizar(0, 1, 1 / 60, 6)).toBeGreaterThan(0);
    expect(suavizar(0, 1, 1 / 60, 6)).toBeLessThan(1);
  });
});

describe('radioCirculo', () => {
  it('mide unos 13 píxeles de pantalla, con tope abajo y arriba', () => {
    expect(radioCirculo(0.5)).toBe(26);
    expect(radioCirculo(0.25)).toBe(36); // tope: no pasa de una casilla
    expect(radioCirculo(4)).toBe(14); // no baja del tamaño de una persona
    expect(radioCirculo(0)).toBe(36);
  });
});
