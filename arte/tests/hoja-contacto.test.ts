import { describe, expect, it } from 'vitest';
import {
  ALTO_GLIFO,
  ANCHO_GLIFO,
  CARACTERES_FUENTE,
  Lienzo,
  MARCADORES,
  anchoTexto,
  contarMarcadores,
  dibujarTexto,
  glifoDe,
  hojaContacto,
  normalizarTexto,
} from '../src/nucleo';
import type { ItemSprite } from '../src/nucleo';
import { bloque, soloAlfaBinario } from './ayudas';

describe('fuente 3 x 5', () => {
  it('cubre A a Z, 0 a 9 y los signos básicos', () => {
    for (const c of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789') expect(CARACTERES_FUENTE, c).toContain(c);
    for (const c of '-_.,:;/()[]+=*#!?%\'"<>@~|^ ') expect(CARACTERES_FUENTE, c).toContain(c);
  });

  it('cada glifo mide 3 x 5 y no hay dos letras o números iguales', () => {
    const vistos = new Map<string, string>();
    for (const c of CARACTERES_FUENTE) {
      const g = glifoDe(c);
      expect(g, c).toBeDefined();
      expect(g).toHaveLength(ALTO_GLIFO);
      for (const fila of g ?? []) expect(fila, c).toMatch(/^[#.]{3}$/);
      const clave = (g ?? []).join('/');
      const previo = vistos.get(clave);
      expect(previo, `${c} se repite con ${previo ?? ''}`).toBeUndefined();
      vistos.set(clave, c);
    }
    expect(ANCHO_GLIFO).toBe(3);
    expect(ALTO_GLIFO).toBe(5);
  });

  it('las minúsculas y las tildes se muestran como su mayúscula sin marca', () => {
    expect(normalizarTexto('silla-oficina')).toBe('SILLA-OFICINA');
    expect(normalizarTexto('Pingüino Ñandú ácido')).toBe('PINGUINO NANDU ACIDO');
    const a = new Lienzo(40, 8);
    const b = new Lienzo(40, 8);
    dibujarTexto(a, 'Hola mundo', 1, 1, 'tinta');
    dibujarTexto(b, 'HOLA MUNDO', 1, 1, 'tinta');
    expect(a.igual(b)).toBe(true);
  });

  it('unifica las rayas largas a un guion y dibuja ? para lo desconocido', () => {
    expect(normalizarTexto(`a${String.fromCharCode(0x2014)}b${String.fromCharCode(0x2013)}c`)).toBe('A-B-C');
    const a = new Lienzo(10, 8);
    const b = new Lienzo(10, 8);
    dibujarTexto(a, String.fromCharCode(0xa7), 1, 1, 'tinta');
    dibujarTexto(b, '?', 1, 1, 'tinta');
    expect(a.igual(b)).toBe(true);
  });

  it('anchoTexto cuenta 3 de cada letra más 1 de separación y escala', () => {
    expect(anchoTexto('')).toBe(0);
    expect(anchoTexto('A')).toBe(3);
    expect(anchoTexto('AB')).toBe(7);
    expect(anchoTexto('ABC', 2)).toBe(22);
  });

  it('dibujarTexto devuelve el ancho, pinta con la escala pedida y solo usa un color', () => {
    const l = new Lienzo(30, 16);
    const ancho = dibujarTexto(l, 'HI', 2, 3, 'rojo-3', 2);
    expect(ancho).toBe(anchoTexto('HI', 2));
    const caja = l.cajaOpaca();
    expect(caja).toEqual({ x: 2, y: 3, w: ancho, h: 10 });
    expect(l.colores().size).toBe(1);
    expect(soloAlfaBinario(l)).toBe(true);
    // La H de 3 x 5 a escala 2: el pixel de arriba a la izquierda es un bloque de 2 x 2.
    expect(l.esOpaco(2, 3)).toBe(true);
    expect(l.esOpaco(3, 4)).toBe(true);
    expect(l.esOpaco(4, 3)).toBe(false);
  });

  it('dibujar texto fuera del lienzo no lanza errores', () => {
    const l = new Lienzo(8, 8);
    expect(() => dibujarTexto(l, 'DESBORDE', 4, 6, 'tinta', 3)).not.toThrow();
    expect(() => dibujarTexto(l, 'X', -20, -20, 'tinta')).not.toThrow();
  });
});

describe('hojaContacto', () => {
  const items = (): ItemSprite[] => [
    { id: 'silla-oficina', lienzo: bloque(32, 32, 'tela-gris-2') },
    { id: 'escritorio', lienzo: bloque(64, 32, 'madera-oscura-2') },
    { id: 'planta', lienzo: bloque(32, 64, 'planta-2') },
  ];

  it('devuelve un lienzo más grande que los sprites ampliados, con fondo opaco', () => {
    const hoja = hojaContacto(items());
    expect(hoja.ancho).toBeGreaterThan(64 * 2);
    expect(hoja.alto).toBeGreaterThan(64 * 2);
    expect(hoja.contarOpacos()).toBe(hoja.ancho * hoja.alto);
    expect(soloAlfaBinario(hoja)).toBe(true);
  });

  it('dibuja cada sprite ampliado sin suavizado (solo bloques del color original)', () => {
    const hoja = hojaContacto(items(), { escala: 3, rejilla: false, etiquetas: false, fondo: '#202020' });
    const colores = hoja.colores();
    expect(colores.has('#7E839A')).toBe(true); // tela-gris-2
    expect(colores.get('#7E839A')).toBe(32 * 32 * 9);
    expect(colores.get('#73452F')).toBe(64 * 32 * 9);
    expect(colores.get('#34934A')).toBe(32 * 64 * 9);
    expect(colores.get('#202020')).toBeGreaterThan(0);
  });

  it('escribe las etiquetas: con etiquetas hay más colores y más alto que sin ellas', () => {
    const con = hojaContacto(items(), { rejilla: false });
    const sin = hojaContacto(items(), { rejilla: false, etiquetas: false });
    expect(con.alto).toBeGreaterThan(sin.alto);
    expect(con.colores().size).toBeGreaterThan(sin.colores().size);
  });

  it('el texto de la etiqueta coincide con el id en mayúsculas', () => {
    const solo = [{ id: 'planta', lienzo: bloque(32, 32, 'planta-2') }];
    const hoja = hojaContacto(solo, { escala: 2, rejilla: false, margen: 8, mostrarTamano: false, fondo: '#808080' });
    // La etiqueta empieza en x = margen e y = margen + alto del sprite ampliado + 4.
    const esperado = new Lienzo(hoja.ancho, 12).rect(0, 0, hoja.ancho, 12, '#808080');
    // Sobre un fondo gris medio la hoja usa texto claro.
    dibujarTexto(esperado, 'PLANTA', 8, 0, '#F4F4F8', 2);
    const recorte = hoja.recortar(0, 8 + 64 + 4, hoja.ancho, 12);
    expect(recorte.leerHex(8, 0)).toBe(esperado.leerHex(8, 0));
    let iguales = 0;
    for (let y = 0; y < 12; y++) for (let x = 0; x < hoja.ancho; x++) if (recorte.leerHex(x, y) === esperado.leerHex(x, y)) iguales++;
    expect(iguales).toBe(hoja.ancho * 12);
  });

  it('respeta las columnas pedidas', () => {
    const doce: ItemSprite[] = Array.from({ length: 12 }, (_, i) => ({ id: `s${i}`, lienzo: bloque(32, 32, 'metal-2') }));
    const tres = hojaContacto(doce, { columnas: 3, escala: 1, rejilla: false, etiquetas: false, margen: 0 });
    expect(tres.ancho).toBe(3 * 32);
    expect(tres.alto).toBe(4 * 32);
    const seis = hojaContacto(doce, { columnas: 6, escala: 1, rejilla: false, etiquetas: false, margen: 0 });
    expect(seis.ancho).toBe(6 * 32);
    expect(seis.alto).toBe(2 * 32);
  });

  it('sin columnas llena filas hasta el ancho máximo', () => {
    const doce: ItemSprite[] = Array.from({ length: 12 }, (_, i) => ({ id: `s${i}`, lienzo: bloque(32, 32, 'metal-2') }));
    const hoja = hojaContacto(doce, { escala: 1, rejilla: false, etiquetas: false, margen: 0, anchoMax: 100 });
    expect(hoja.ancho).toBe(96);
    expect(hoja.alto).toBe(4 * 32);
  });

  it('dibuja la rejilla de casillas bajo cada sprite y se puede apagar', () => {
    const l = new Lienzo(64, 32);
    const con = hojaContacto([{ id: 'v', lienzo: l }], { escala: 2, rejilla: 32, etiquetas: false, margen: 4, fondo: '#808080' });
    const sin = hojaContacto([{ id: 'v', lienzo: l }], { escala: 2, rejilla: false, etiquetas: false, margen: 4, fondo: '#808080' });
    expect(con.colores().size).toBe(2);
    expect(sin.colores().size).toBe(1);
    // Hay una línea vertical cada 32 píxeles del sprite, es decir cada 64 de la hoja.
    expect(con.leerHex(4, 20)).not.toBe('#808080');
    expect(con.leerHex(4 + 64, 20)).not.toBe('#808080');
    expect(con.leerHex(4 + 32, 20)).toBe('#808080');
  });

  it('muestra los marcadores de personajes con colores de vista previa, sin tocar el sprite', () => {
    const personaje = new Lienzo(32, 48).rect(8, 8, 16, 30, MARCADORES.piel[2]);
    const sprite = { id: 'cuerpo', lienzo: personaje };
    const con = hojaContacto([sprite], { rejilla: false, etiquetas: false });
    for (const hex of con.colores().keys()) expect(hex).not.toBe(MARCADORES.piel[2]);
    const sin = hojaContacto([sprite], { rejilla: false, etiquetas: false, marcadoresVisibles: false });
    expect(sin.colores().has(MARCADORES.piel[2])).toBe(true);
    expect(contarMarcadores(personaje)).toBe(16 * 30);
  });

  it('recorta etiquetas muy largas con puntos suspensivos y lanza error si no hay sprites', () => {
    const largo = [{ id: 'personaje/abajo/caminar/cuadro-tres/variante-de-prueba', lienzo: bloque(32, 32, 'metal-2') }];
    expect(() => hojaContacto(largo)).not.toThrow();
    expect(hojaContacto(largo).ancho).toBeLessThan(400);
    expect(() => hojaContacto([])).toThrow(/No hay sprites/);
  });

  it('avisa cuando la hoja resultaría gigante', () => {
    const enorme = [{ id: 'g', lienzo: new Lienzo(2200, 2200) }];
    expect(() => hojaContacto(enorme, { escala: 4 })).toThrow(/demasiado|máximo/);
  });
});
