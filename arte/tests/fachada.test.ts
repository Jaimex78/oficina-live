import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { construirTodo } from '../src/construir';
import { DIR_INGRESO, PANEL, construirFachadaNaos } from '../src/ingreso/fachada';
import { BORDILLO_Y, PIES_Y, PUERTA, SUELO } from '../src/ingreso/escena-naos';
import { coloresNaos } from '../src/ingreso/paleta-naos';
import { Lienzo, leerPng, rutaRaiz, validarLienzo } from '../src/nucleo';
import { carpetaTemporal } from './ayudas';

const tmp = carpetaTemporal('ol-arte-fachada-');
afterAll(() => tmp.limpiar());

const r = construirFachadaNaos();

function alfaBinario(l: Lienzo): boolean {
  for (let i = 3; i < l.datos.length; i += 4) {
    const a = l.datos[i] ?? 0;
    if (a !== 0 && a !== 255) return false;
  }
  return true;
}

describe('fachada de Naos: medidas', () => {
  it('las escenas miden 640 x 360 y el panel 480 x 360', () => {
    expect([r.dia.ancho, r.dia.alto]).toEqual([640, 360]);
    expect([r.noche.ancho, r.noche.alto]).toEqual([640, 360]);
    expect([r.panel.ancho, r.panel.alto]).toEqual([PANEL.ancho, PANEL.alto]);
    expect([PANEL.ancho, PANEL.alto]).toEqual([480, 360]);
  });

  it('la puerta mide al menos 56 px de alto y las hojas encajan en el hueco', () => {
    expect(PUERTA.alto).toBeGreaterThanOrEqual(56);
    expect([r.hojaIzq.ancho, r.hojaIzq.alto]).toEqual([PUERTA.ancho / 2, PUERTA.alto]);
    expect([r.hojaDer.ancho, r.hojaDer.alto]).toEqual([PUERTA.ancho / 2, PUERTA.alto]);
    expect([r.interior.ancho, r.interior.alto]).toEqual([PUERTA.ancho, PUERTA.alto]);
    expect(PUERTA.y + PUERTA.alto).toBe(SUELO);
  });

  it('la acera deja al menos 60 px libres y los pies caen dentro de ella', () => {
    expect(BORDILLO_Y - SUELO).toBeGreaterThanOrEqual(60);
    expect(PIES_Y).toBeGreaterThan(SUELO);
    expect(PIES_Y).toBeLessThan(BORDILLO_Y);
    // El personaje (48 px) cabe entre la acera y el borde superior de la escena.
    expect(PIES_Y - 48).toBeGreaterThanOrEqual(0);
  });
});

describe('fachada de Naos: calidad del arte', () => {
  const piezas: ReadonlyArray<readonly [string, Lienzo, boolean]> = [
    ['dia', r.dia, false],
    ['noche', r.noche, true],
    ['panel', r.panel, true],
    ['hoja izquierda', r.hojaIzq, false],
    ['hoja derecha', r.hojaDer, false],
    ['interior', r.interior, false],
  ];

  it.each(piezas)('%s: alfa 0 o 255 y solo colores de la paleta de la escena', (_nombre, lienzo, noche) => {
    expect(alfaBinario(lienzo)).toBe(true);
    expect(validarLienzo(lienzo, { paleta: coloresNaos(noche), noVacio: true })).toEqual([]);
  });

  it('las dos paletas (día y noche) caben en el tope de 128 colores', () => {
    expect(coloresNaos(false).length).toBeLessThanOrEqual(128);
    expect(coloresNaos(true).length).toBeLessThanOrEqual(128);
  });

  it('la escena, sin personajes, no deja huecos transparentes', () => {
    expect(r.dia.contarOpacos()).toBe(640 * 360);
    expect(r.noche.contarOpacos()).toBe(640 * 360);
  });

  it('la puerta cerrada de la escena es exactamente las dos hojas en su sitio', () => {
    for (const escena of [r.dia, r.noche]) {
      expect(escena.recortar(PUERTA.x, PUERTA.y, 20, PUERTA.alto).igual(r.hojaIzq)).toBe(true);
      expect(escena.recortar(PUERTA.x + 20, PUERTA.y, 20, PUERTA.alto).igual(r.hojaDer)).toBe(true);
    }
  });

  it('de noche el piso 4 tiene luz cálida y de día no', () => {
    const p = r.meta.piso4 as { fachada: { x0: number; y0Arriba: number; y0Abajo: number } };
    const calidos = (l: Lienzo): number => {
      let n = 0;
      for (let x = p.fachada.x0; x < 200; x++) {
        for (let y = p.fachada.y0Arriba; y < p.fachada.y0Abajo + 20; y++) {
          const { r: rojo, g, b } = l.leer(x, y);
          if (rojo > 200 && g > 130 && b < 140) n++;
        }
      }
      return n;
    };
    expect(calidos(r.noche)).toBeGreaterThan(80);
    expect(calidos(r.dia)).toBe(0);
  });

  it('es determinista: dos corridas dan los mismos píxeles', () => {
    const otra = construirFachadaNaos();
    expect(otra.dia.huella()).toBe(r.dia.huella());
    expect(otra.noche.huella()).toBe(r.noche.huella());
    expect(otra.panel.huella()).toBe(r.panel.huella());
  });
});

describe('fachada de Naos: constructor y archivos', () => {
  it('queda registrado, corre sin errores y escribe los archivos', async () => {
    const mensajes: string[] = [];
    const resultados = await construirTodo({ solo: ['fachada-naos'], dirSalida: tmp.ruta, escribir: (l) => mensajes.push(l) });
    expect(resultados).toHaveLength(1);
    expect(resultados[0]?.ok, resultados[0]?.error).toBe(true);

    const dir = join(rutaRaiz(), DIR_INGRESO);
    const nombres = [
      'fachada-naos-dia.png',
      'fachada-naos-noche.png',
      'fachada-naos-solo-edificio-noche.png',
      'puerta-naos-hoja-izq.png',
      'puerta-naos-hoja-der.png',
      'puerta-naos-interior.png',
      'fachada-naos-meta.json',
    ];
    for (const n of nombres) expect(existsSync(join(dir, n)), n).toBe(true);
    for (const n of ['fachada-naos-revision-dia.png', 'fachada-naos-revision-puerta.png']) {
      expect(existsSync(join(tmp.ruta, n)), n).toBe(true);
    }

    // Lo escrito en disco es lo que se dibuja.
    expect(leerPng(join(dir, 'fachada-naos-dia.png')).igual(r.dia)).toBe(true);
    expect(leerPng(join(dir, 'fachada-naos-solo-edificio-noche.png')).igual(r.panel)).toBe(true);
    expect(leerPng(join(dir, 'puerta-naos-hoja-der.png')).igual(r.hojaDer)).toBe(true);
  });

  it('la meta trae puerta, pies, inicio y piso 4', () => {
    const dir = join(rutaRaiz(), DIR_INGRESO);
    const meta = JSON.parse(readFileSync(join(dir, 'fachada-naos-meta.json'), 'utf8')) as Record<string, any>;
    expect(meta.puerta).toMatchObject({ x: PUERTA.x, y: PUERTA.y, ancho: PUERTA.ancho, alto: PUERTA.alto });
    expect(meta.personaje).toMatchObject({ yPies: PIES_Y, xInicio: -16, xPuerta: PUERTA.x + PUERTA.ancho / 2 });
    expect(meta.acera.yPies).toBe(PIES_Y);
    expect(meta.piso4.caja.ancho).toBeGreaterThan(500);
    expect(meta.piso4.tambor.yCentroArriba).toBeLessThan(meta.piso4.tambor.yBordeArriba);
  });
});
