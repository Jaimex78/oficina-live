import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PNG } from 'pngjs';
import { afterAll, describe, expect, it } from 'vitest';
import { Lienzo, codificarPng, decodificarPng, escribirPng, leerPng } from '../src/nucleo';
import { carpetaTemporal, soloAlfaBinario } from './ayudas';

const tmp = carpetaTemporal('ol-arte-png-');
afterAll(() => tmp.limpiar());

function dibujo(): Lienzo {
  return new Lienzo(24, 17)
    .rect(1, 1, 10, 6, 'rojo-3')
    .elipse(16, 8, 5, 6, 'planta-2')
    .linea(0, 16, 23, 0, 'metal-1')
    .trama(2, 10, 8, 5, 'madera-clara-2', null, 'bayer50')
    .px(23, 16, '#123456');
}

describe('PNG', () => {
  it('ida y vuelta en memoria devuelve el mismo lienzo', () => {
    const original = dibujo();
    const vuelta = decodificarPng(codificarPng(original));
    expect(vuelta.ancho).toBe(original.ancho);
    expect(vuelta.alto).toBe(original.alto);
    expect(vuelta.igual(original)).toBe(true);
    expect(soloAlfaBinario(vuelta)).toBe(true);
  });

  it('ida y vuelta por archivo, creando las carpetas que falten', () => {
    const ruta = join(tmp.ruta, 'a', 'b', 'prueba.png');
    escribirPng(dibujo(), ruta);
    expect(leerPng(ruta).igual(dibujo())).toBe(true);
  });

  it('es un PNG válido: firma, colorType RGBA y 8 bits', () => {
    const bytes = codificarPng(dibujo());
    expect([...bytes.subarray(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const png = PNG.sync.read(bytes);
    expect(png.width).toBe(24);
    expect(png.height).toBe(17);
    // IHDR: ancho(4) alto(4) profundidad(1) tipo de color(1)
    expect(bytes[24]).toBe(8);
    expect(bytes[25]).toBe(6);
  });

  it('solo escribe los bloques IHDR, IDAT e IEND: sin gamma ni perfiles que alteren los colores exactos', () => {
    const bytes = codificarPng(dibujo());
    const tipos: string[] = [];
    let i = 8;
    while (i < bytes.length) {
      const largo = bytes.readUInt32BE(i);
      tipos.push(bytes.subarray(i + 4, i + 8).toString('latin1'));
      i += 12 + largo;
    }
    expect(tipos[0]).toBe('IHDR');
    expect(tipos[tipos.length - 1]).toBe('IEND');
    for (const tipo of tipos) expect(['IHDR', 'IDAT', 'IEND']).toContain(tipo);
  });

  it('la salida es determinista: mismos datos, mismos bytes', () => {
    const a = codificarPng(dibujo());
    const b = codificarPng(dibujo());
    expect(a.equals(b)).toBe(true);
    const huella = (x: Buffer): string => createHash('sha1').update(x).digest('hex');
    expect(huella(a)).toBe(huella(b));
    // Y cambia si cambia un solo píxel.
    const distinto = dibujo().px(5, 5, '#010101');
    expect(codificarPng(distinto).equals(a)).toBe(false);
  });

  it('escribir dos veces el mismo lienzo deja archivos idénticos', () => {
    const r1 = join(tmp.ruta, 'uno.png');
    const r2 = join(tmp.ruta, 'dos.png');
    escribirPng(dibujo(), r1);
    escribirPng(dibujo(), r2);
    expect(readFileSync(r1).equals(readFileSync(r2))).toBe(true);
  });

  it('los píxeles vacíos salen como (0, 0, 0, 0)', () => {
    const png = PNG.sync.read(codificarPng(new Lienzo(3, 1).px(1, 0, 'rojo-3')));
    expect([...png.data.subarray(0, 4)]).toEqual([0, 0, 0, 0]);
    expect([...png.data.subarray(4, 8)]).toEqual([0xef, 0x3b, 0x3a, 255]);
  });

  it('conserva un alfa parcial para que la validación lo pueda reportar', () => {
    const l = Lienzo.desdeDatos(2, 1, new Uint8ClampedArray([10, 20, 30, 128, 0, 0, 0, 0]));
    const vuelta = decodificarPng(codificarPng(l));
    expect(vuelta.leer(0, 0)).toEqual({ r: 10, g: 20, b: 30, a: 128 });
  });

  it('lee un PNG sin canal alfa como opaco', () => {
    const rgb = new PNG({ width: 2, height: 1 });
    rgb.data.set([255, 0, 0, 255, 0, 255, 0, 255]);
    const bytes = PNG.sync.write(rgb, { colorType: 2, inputColorType: 6, inputHasAlpha: true });
    const l = decodificarPng(bytes);
    expect(l.leerHex(0, 0)).toBe('#FF0000');
    expect(l.leerHex(1, 0)).toBe('#00FF00');
  });

  it('maneja tamaños mínimos y grandes', () => {
    expect(decodificarPng(codificarPng(new Lienzo(1, 1).px(0, 0, 'tinta'))).leerHex(0, 0)).toBe('#0A0A0A');
    const grande = new Lienzo(512, 300).rect(10, 10, 400, 200, 'cemento-2');
    expect(decodificarPng(codificarPng(grande)).igual(grande)).toBe(true);
  });
});
