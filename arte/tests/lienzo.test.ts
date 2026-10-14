import { describe, expect, it } from 'vitest';
import { Lienzo, PALETA, luminancia, rampa, rampa5 } from '../src/nucleo';
import { aleatorio, soloAlfaBinario } from './ayudas';

const A = '#112233';
const B = '#445566';

function texto(l: Lienzo): string[] {
  return l.aTexto().lineas;
}

describe('Lienzo: creación y acceso', () => {
  it('nace transparente y con las medidas pedidas', () => {
    const l = new Lienzo(5, 3);
    expect(l.ancho).toBe(5);
    expect(l.alto).toBe(3);
    expect(l.datos.length).toBe(5 * 3 * 4);
    expect(l.contarOpacos()).toBe(0);
    expect(l.cajaOpaca()).toBeNull();
  });

  it('rechaza medidas inválidas', () => {
    expect(() => new Lienzo(0, 4)).toThrow(RangeError);
    expect(() => new Lienzo(4, -1)).toThrow(RangeError);
    expect(() => new Lienzo(2.5, 4)).toThrow(RangeError);
    expect(() => new Lienzo(100000, 4)).toThrow(/demasiado grande/);
  });

  it('px y leer: hex, nombre de paleta, alias y transparente', () => {
    const l = new Lienzo(4, 4);
    l.px(0, 0, A).px(1, 0, 'madera-clara-3').px(2, 0, 'tinta').px(3, 0, 'rojo-coral');
    expect(l.leerHex(0, 0)).toBe('#112233');
    expect(l.leerHex(1, 0)).toBe(PALETA['madera-clara-3']);
    expect(l.leerHex(2, 0)).toBe('#0A0A0A');
    expect(l.leerHex(3, 0)).toBe('#EF3B3A');
    expect(l.leer(0, 0)).toEqual({ r: 0x11, g: 0x22, b: 0x33, a: 255 });
    expect(l.esOpaco(0, 0)).toBe(true);

    l.px(0, 0, null);
    expect(l.leer(0, 0)).toEqual({ r: 0, g: 0, b: 0, a: 0 });
    l.px(1, 0, 'transparente');
    expect(l.esOpaco(1, 0)).toBe(false);
    expect(l.leerHex(1, 0)).toBeNull();
  });

  it('acepta hex en minúsculas y lo devuelve en mayúsculas', () => {
    const l = new Lienzo(1, 1).px(0, 0, '#aabbcc');
    expect(l.leerHex(0, 0)).toBe('#AABBCC');
  });

  it('un nombre de color inexistente lanza un error con sugerencias', () => {
    const l = new Lienzo(2, 2);
    expect(() => l.px(0, 0, 'madera-clra-3')).toThrow(/madera-clara-3/);
    expect(() => l.px(0, 0, '#12')).toThrow(/inválido/);
  });

  it('dibujar fuera del lienzo no lanza errores y no cambia nada', () => {
    const l = new Lienzo(4, 4);
    expect(() => {
      l.px(-1, 0, A).px(0, -1, A).px(4, 0, A).px(0, 4, A).px(999, 999, A);
      l.rect(-10, -10, 5, 5, A).rect(10, 10, 5, 5, A).rect(2, 2, 0, 5, A).rect(2, 2, -3, -3, A);
      l.linea(-20, -20, -10, -5, A).linea(10, 10, 30, 12, A);
      l.elipse(-30, -30, 4, 4, A).elipse(30, 30, 4, 4, A);
      l.rellenar(-1, -1, A).rellenar(10, 10, A);
      l.trama(-5, -5, 2, 2, A, B, 'bayer50').trama(9, 9, 5, 5, A, B, 'tablero');
    }).not.toThrow();
    expect(l.contarOpacos()).toBe(0);
    expect(l.leer(-3, 2)).toEqual({ r: 0, g: 0, b: 0, a: 0 });
    expect(l.leerHex(99, 99)).toBeNull();
  });

  it('las formas enormes solo recorren la parte visible y las líneas absurdas fallan con un error claro', () => {
    const inicio = performance.now();
    const redondeado = new Lienzo(16, 16).rectRedondeado(-1_000_000, -1_000_000, 2_000_016, 2_000_016, 4, A);
    expect(redondeado.contarOpacos()).toBe(256);
    const degradado = new Lienzo(8, 8).degradadoV(-5_000_000, -5_000_000, 10_000_008, 10_000_008, [A, B]);
    expect(degradado.contarOpacos()).toBe(64);
    expect(new Lienzo(8, 8).elipse(4, 4, 1e7, 1e7, A).contarOpacos()).toBe(64);
    expect(performance.now() - inicio).toBeLessThan(1000);
    expect(() => new Lienzo(8, 8).linea(0, 0, 5_000_000, 0, A)).toThrow(/demasiado larga/);
    expect(new Lienzo(8, 8).linea(-300, 4, 300, 4, A).contarOpacos()).toBe(8);
  });

  it('las coordenadas decimales se truncan y las no finitas lanzan error', () => {
    const l = new Lienzo(4, 4).px(1.9, 2.2, A);
    expect(l.leerHex(1, 2)).toBe('#112233');
    expect(() => l.px(Number.NaN, 0, A)).toThrow(TypeError);
    expect(() => l.rect(0, Number.POSITIVE_INFINITY, 1, 1, A)).toThrow(TypeError);
  });
});

describe('Lienzo: formas', () => {
  it('rect rellena exactamente el área y se recorta en los bordes', () => {
    const l = new Lienzo(6, 4).rect(1, 1, 3, 2, A);
    expect(texto(l)).toEqual(['......', '.aaa..', '.aaa..', '......']);
    const recortado = new Lienzo(4, 4).rect(2, 2, 10, 10, A);
    expect(recortado.contarOpacos()).toBe(4);
    expect(recortado.cajaOpaca()).toEqual({ x: 2, y: 2, w: 2, h: 2 });
  });

  it('rectBorde dibuja solo el borde, con grosor opcional', () => {
    const l = new Lienzo(7, 6).rectBorde(1, 1, 5, 4, A);
    expect(texto(l)).toEqual(['.......', '.aaaaa.', '.a...a.', '.a...a.', '.aaaaa.', '.......']);
    const grueso = new Lienzo(8, 8).rectBorde(0, 0, 8, 8, A, 2);
    expect(grueso.contarOpacos()).toBe(8 * 8 - 4 * 4);
    // Si el borde llena todo el rectángulo, se rellena.
    expect(new Lienzo(4, 4).rectBorde(0, 0, 3, 3, A, 2).contarOpacos()).toBe(9);
  });

  it('rectRedondeado recorta las esquinas según el radio', () => {
    const r1 = new Lienzo(6, 4).rectRedondeado(0, 0, 6, 4, 1, A);
    expect(r1.contarOpacos()).toBe(24);
    const r2 = new Lienzo(6, 4).rectRedondeado(0, 0, 6, 4, 2, A);
    expect(texto(r2)).toEqual(['.aaaa.', 'aaaaaa', 'aaaaaa', '.aaaa.']);
    const r4 = new Lienzo(12, 8).rectRedondeado(0, 0, 12, 8, 4, A);
    expect(texto(r4)).toEqual([
      '..aaaaaaaa..',
      '.aaaaaaaaaa.',
      'aaaaaaaaaaaa',
      'aaaaaaaaaaaa',
      'aaaaaaaaaaaa',
      'aaaaaaaaaaaa',
      '.aaaaaaaaaa.',
      '..aaaaaaaa..',
    ]);
    // Un radio mayor que la mitad del lado se limita y no deja huecos raros.
    expect(new Lienzo(4, 4).rectRedondeado(0, 0, 4, 4, 50, A).contarOpacos()).toBeGreaterThan(8);
  });

  it('linea: horizontal, vertical y diagonal, con extremos incluidos', () => {
    const h = new Lienzo(6, 3).linea(1, 1, 4, 1, A);
    expect(texto(h)[1]).toBe('.aaaa.');
    const v = new Lienzo(3, 6).linea(1, 1, 1, 4, A);
    expect(v.contarOpacos()).toBe(4);
    const d = new Lienzo(5, 5).linea(0, 0, 4, 4, A);
    expect(texto(d)).toEqual(['a....', '.a...', '..a..', '...a.', '....a']);
    const inversa = new Lienzo(5, 5).linea(4, 4, 0, 0, A);
    expect(inversa.igual(d)).toBe(true);
    expect(new Lienzo(3, 3).linea(1, 1, 1, 1, A).contarOpacos()).toBe(1);
  });

  it('linea es conectada: cada paso avanza como máximo un píxel en cada eje', () => {
    const l = new Lienzo(20, 20).linea(2, 3, 17, 9, A);
    const puntos: Array<[number, number]> = [];
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) if (l.esOpaco(x, y)) puntos.push([x, y]);
    expect(puntos.length).toBe(16);
    for (let x = 2; x <= 17; x++) expect(puntos.filter(([px]) => px === x).length).toBe(1);
  });

  it('elipse: un círculo de radio 3 mide 7 de ancho y es simétrico', () => {
    const c = new Lienzo(9, 9).elipse(4, 4, 3, 3, A);
    const esperado = Lienzo.desdeTexto(
      [
        '.........',
        '...aaa...',
        '..aaaaa..',
        '.aaaaaaa.',
        '.aaaaaaa.',
        '.aaaaaaa.',
        '..aaaaa..',
        '...aaa...',
        '.........',
      ],
      { a: A },
    );
    expect(c.igual(esperado)).toBe(true);
    expect(c.igual(c.voltearH())).toBe(true);
    expect(c.igual(c.voltearV())).toBe(true);
  });

  it('elipse con centro y radio de medio píxel da un ancho par', () => {
    const c = new Lienzo(12, 10).elipse(5.5, 4.5, 3.5, 3.5, A);
    expect(c.cajaOpaca()).toEqual({ x: 2, y: 1, w: 8, h: 8 });
    expect(c.igual(c.voltearH())).toBe(true);
  });

  it('elipse con relleno falso es solo el borde y elipseBorde es lo mismo', () => {
    const b = new Lienzo(9, 9).elipse(4, 4, 3, 3, A, { relleno: false });
    expect(b.leerHex(4, 4)).toBeNull();
    expect(b.leerHex(4, 1)).toBe('#112233');
    expect(b.leerHex(1, 4)).toBe('#112233');
    const lleno = new Lienzo(9, 9).elipse(4, 4, 3, 3, A);
    expect(b.contarOpacos()).toBeLessThan(lleno.contarOpacos());
    expect(b.igual(new Lienzo(9, 9).elipseBorde(4, 4, 3, 3, A))).toBe(true);
  });

  it('elipse gira: con 90 grados intercambia ancho y alto', () => {
    const plana = new Lienzo(20, 20).elipse(10, 10, 8, 2, A);
    const girada = new Lienzo(20, 20).elipse(10, 10, 8, 2, A, { angulo: 90 });
    expect(plana.cajaOpaca()).toEqual({ x: 2, y: 8, w: 17, h: 5 });
    expect(girada.cajaOpaca()).toEqual({ x: 8, y: 2, w: 5, h: 17 });
    // Con -45 grados apunta hacia arriba a la derecha: el extremo superior queda a la derecha.
    const diagonal = new Lienzo(24, 24).elipse(12, 12, 9, 2, A, { angulo: -45 });
    expect(diagonal.esOpaco(18, 6)).toBe(true);
    expect(diagonal.esOpaco(6, 18)).toBe(true);
    expect(diagonal.esOpaco(6, 6)).toBe(false);
  });

  it('rellenar inunda solo la región conectada y no cruza bordes', () => {
    const l = Lienzo.desdeTexto(['aaaaa', 'a...a', 'a.a.a', 'a...a', 'aaaaa'], { a: A });
    l.rellenar(1, 1, B);
    expect(texto(l)).toEqual(['aaaaa', 'abbba', 'ababa', 'abbba', 'aaaaa']);
    // Una región separada (diagonal) no se toca.
    const diag = Lienzo.desdeTexto(['.a', 'a.'], { a: A });
    diag.rellenar(0, 0, B);
    expect(diag.leerHex(0, 0)).toBe('#445566');
    expect(diag.leerHex(1, 1)).toBeNull();
    expect(diag.leerHex(1, 0)).toBe('#112233');
  });

  it('rellenar con el mismo color no hace nada y con null borra', () => {
    const l = new Lienzo(3, 3).rect(0, 0, 3, 3, A);
    const antes = l.huella();
    l.rellenar(1, 1, A);
    expect(l.huella()).toBe(antes);
    l.rellenar(1, 1, null);
    expect(l.contarOpacos()).toBe(0);
  });

  it('trama: cobertura de cada patrón en un bloque de 4 x 4', () => {
    const cobertura = (patron: Parameters<Lienzo['trama']>[6]): number => {
      const l = new Lienzo(4, 4).trama(0, 0, 4, 4, A, B, patron);
      return [...l.colores().entries()].find(([hex]) => hex === '#445566')?.[1] ?? 0;
    };
    expect(cobertura('bayer25')).toBe(4);
    expect(cobertura('bayer50')).toBe(8);
    expect(cobertura('bayer75')).toBe(12);
    expect(cobertura('tablero')).toBe(8);
    expect(cobertura('lineas-h')).toBe(8);
    expect(cobertura('lineas-v')).toBe(8);
    expect(cobertura('diagonal')).toBe(4);
  });

  it('trama: fases conocidas y patrón en coordenadas del lienzo', () => {
    const t = new Lienzo(4, 2).trama(0, 0, 4, 2, A, B, 'tablero');
    expect(t.leerHex(0, 0)).toBe('#112233');
    expect(t.leerHex(1, 0)).toBe('#445566');
    expect(t.leerHex(0, 1)).toBe('#445566');
    const q = new Lienzo(4, 4).trama(0, 0, 4, 4, A, B, 'bayer25');
    expect(q.leerHex(0, 0)).toBe('#445566');
    expect(q.leerHex(1, 0)).toBe('#112233');
    expect(q.leerHex(2, 2)).toBe('#445566');
    // Dos rectángulos vecinos encajan igual que uno solo.
    const unido = new Lienzo(8, 4).trama(0, 0, 8, 4, A, B, 'bayer50');
    const partido = new Lienzo(8, 4).trama(0, 0, 3, 4, A, B, 'bayer50').trama(3, 0, 5, 4, A, B, 'bayer50');
    expect(partido.igual(unido)).toBe(true);
  });

  it('trama con null deja huecos transparentes', () => {
    const l = new Lienzo(4, 4).trama(0, 0, 4, 4, null, B, 'bayer50');
    expect(l.contarOpacos()).toBe(8);
  });

  it('degradadoV reparte bandas de arriba hacia abajo', () => {
    const l = new Lienzo(3, 6).degradadoV(0, 0, 3, 6, [A, B, '#778899']);
    expect(l.leerHex(0, 0)).toBe('#112233');
    expect(l.leerHex(2, 1)).toBe('#112233');
    expect(l.leerHex(1, 2)).toBe('#445566');
    expect(l.leerHex(1, 4)).toBe('#778899');
    expect(l.leerHex(1, 5)).toBe('#778899');
    // Con el nombre de una rampa de la paleta.
    const r = new Lienzo(2, 8).degradadoV(0, 0, 2, 8, 'metal');
    expect(r.leerHex(0, 0)).toBe(rampa('metal')[0]);
    expect(r.leerHex(0, 7)).toBe(rampa('metal')[3]);
  });

  it('degradadoV con dither mezcla solo los dos colores vecinos en el cambio de banda', () => {
    const l = new Lienzo(8, 12).degradadoV(0, 0, 8, 12, [A, B], { dither: true });
    const colores = new Set(l.colores().keys());
    expect(colores).toEqual(new Set(['#112233', '#445566']));
    // Las filas del medio son una mezcla, no un color sólido.
    const fila5 = new Set<string | null>();
    for (let x = 0; x < 8; x++) fila5.add(l.leerHex(x, 5));
    expect(fila5.size).toBe(2);
    expect(l.leerHex(0, 0)).toBe('#112233');
    expect(l.leerHex(0, 11)).toBe('#445566');
  });
});

describe('Lienzo: contornos', () => {
  it('contorno exterior de 1 px en 4 direcciones y con diagonales', () => {
    const base = new Lienzo(6, 6).rect(2, 2, 2, 2, A);
    const c4 = base.copiar().contorno(B);
    expect(c4.contarOpacos() - 4).toBe(8);
    expect(c4.leerHex(1, 1)).toBeNull();
    expect(c4.leerHex(2, 1)).toBe('#445566');
    const c8 = base.copiar().contorno(B, { diagonales: true });
    expect(c8.contarOpacos() - 4).toBe(12);
    expect(c8.leerHex(1, 1)).toBe('#445566');
    // No pinta encima de la forma.
    expect(c8.leerHex(2, 2)).toBe('#112233');
  });

  it('contorno en el borde del lienzo no se sale ni lanza errores', () => {
    const l = new Lienzo(3, 3).rect(0, 0, 3, 3, A);
    expect(() => l.contorno(B)).not.toThrow();
    expect(l.contarOpacos()).toBe(9);
  });

  it('contornoTonal usa el tono anterior de la rampa de cada color', () => {
    const l = new Lienzo(10, 8).rect(2, 2, 6, 4, 'madera-clara-3').contornoTonal();
    expect(l.contarOpacos()).toBe(6 * 4 + 20);
    expect(l.leerHex(1, 3)).toBe(PALETA['madera-clara-2']);
    expect(l.leerHex(4, 1)).toBe(PALETA['madera-clara-2']);
    expect(l.leerHex(8, 3)).toBe(PALETA['madera-clara-2']);
    expect(l.leerHex(4, 6)).toBe(PALETA['madera-clara-2']);
    expect(l.leerHex(4, 3)).toBe(PALETA['madera-clara-3']);
  });

  it('contornoTonal: cada material tiene su propio borde y el tono 0 se queda en 0', () => {
    const l = new Lienzo(12, 6).rect(1, 1, 4, 4, 'rojo-3').rect(6, 1, 4, 4, 'metal-0').contornoTonal();
    expect(l.leerHex(0, 2)).toBe(PALETA['rojo-2']);
    expect(l.leerHex(5, 0)).toBeNull(); // nada en la esquina entre ambos
    expect(l.leerHex(10, 2)).toBe(PALETA['metal-0']);
  });

  it('contornoTonal elige el borde más oscuro cuando un vacío toca dos colores', () => {
    const l = new Lienzo(5, 3).px(0, 1, 'madera-clara-4').px(2, 1, 'madera-clara-2');
    l.contornoTonal();
    expect(l.leerHex(1, 1)).toBe(PALETA['madera-clara-1']);
  });

  it('contornoTonal con pasos mueve más tonos hacia abajo', () => {
    const l = new Lienzo(5, 5).rect(1, 1, 3, 3, 'madera-clara-4').contornoTonal({ pasos: 2 });
    expect(l.leerHex(0, 2)).toBe(PALETA['madera-clara-2']);
  });

  it('contornoTonal en modo interior no agranda la silueta', () => {
    const l = new Lienzo(7, 7).rect(1, 1, 5, 5, 'madera-clara-3');
    const antes = l.contarOpacos();
    l.contornoTonal({ modo: 'interior' });
    expect(l.contarOpacos()).toBe(antes);
    expect(l.leerHex(1, 1)).toBe(PALETA['madera-clara-2']);
    expect(l.leerHex(3, 3)).toBe(PALETA['madera-clara-3']);
    // Un lienzo lleno no tiene borde interior porque el borde del lienzo no cuenta.
    const lleno = new Lienzo(4, 4).rect(0, 0, 4, 4, 'madera-clara-3').contornoTonal({ modo: 'interior' });
    expect(lleno.colores().size).toBe(1);
  });

  it('contornoTonal con colores fuera de la paleta saca una sombra más oscura', () => {
    const l = new Lienzo(5, 5).rect(1, 1, 3, 3, '#6A9955').contornoTonal();
    const borde = l.leerHex(0, 2);
    expect(borde).not.toBeNull();
    expect(luminancia(borde as string)).toBeLessThan(luminancia('#6A9955'));
    expect(borde).toBe(rampa5('#6A9955')[1]);
  });

  it('contornoTonal respeta los marcadores de personajes: baja un tono dentro del mismo slot', () => {
    const l = new Lienzo(5, 5).rect(1, 1, 3, 3, '#FA08E0').contornoTonal();
    expect(l.leerHex(0, 2)).toBe('#FA08D4');
  });

  it('contornoTonal acepta una función propia', () => {
    const l = new Lienzo(5, 5).rect(1, 1, 3, 3, 'madera-clara-3').contornoTonal({ oscurecer: () => '#000000' });
    expect(l.leerHex(0, 2)).toBe('#000000');
  });
});

describe('Lienzo: sombra proyectada', () => {
  it('copia la silueta corrida y solo pinta donde estaba vacío', () => {
    const l = new Lienzo(10, 8).rect(1, 1, 5, 3, A);
    l.sombraProyectada(B, 2, 2);
    expect(texto(l)).toEqual([
      '..........',
      '.aaaaa....',
      '.aaaaab...',
      '.aaaaabb..',
      '..bbbbbb..',
      '...bbbbb..',
      '..........',
      '..........',
    ]);
  });

  it('sin extruir, solo queda la copia desplazada', () => {
    const l = new Lienzo(8, 8).rect(1, 1, 2, 2, A);
    l.sombraProyectada(B, 2, 2, { extruir: false });
    expect(l.leerHex(3, 3)).toBe('#445566');
    expect(l.leerHex(4, 4)).toBe('#445566');
    expect(l.leerHex(3, 2)).toBeNull();
  });

  it('respeta una trama: bayer50 pinta menos píxeles que la sombra sólida', () => {
    const sombra = (patron?: 'bayer50' | 'bayer25' | 'degradado'): number => {
      const l = new Lienzo(16, 16).rect(2, 2, 8, 8, A);
      l.sombraProyectada(B, 2, 2, patron === undefined ? {} : { patron });
      return l.contarOpacos() - 64;
    };
    const solida = sombra();
    expect(sombra('bayer50')).toBeLessThan(solida);
    expect(sombra('bayer25')).toBeLessThan(sombra('bayer50'));
    // El degradado deja sólido el primer píxel y trama el resto.
    expect(sombra('degradado')).toBeLessThan(solida);
    expect(sombra('degradado')).toBeGreaterThan(sombra('bayer50'));
  });

  it('capaSombra no modifica el lienzo y su resultado es lo que pintaría sombraProyectada', () => {
    const l = new Lienzo(10, 8).rect(1, 1, 5, 3, A);
    const antes = l.huella();
    const capa = l.capaSombra(B, 2, 2);
    expect(l.huella()).toBe(antes);
    expect(capa.contarOpacos()).toBe(14);
    expect(capa.leerHex(1, 1)).toBeNull();
    const pintado = l.copiar().sombraProyectada(B, 2, 2);
    expect(pintado.igual(l.copiar().pegar(capa, 0, 0, { modo: 'debajo' }))).toBe(true);
  });

  it('el desplazamiento cero y los lienzos vacíos no hacen nada', () => {
    const l = new Lienzo(4, 4).rect(1, 1, 2, 2, A);
    expect(l.copiar().sombraProyectada(B, 0, 0).igual(l)).toBe(true);
    expect(new Lienzo(4, 4).sombraProyectada(B, 2, 2).contarOpacos()).toBe(0);
  });
});

describe('Lienzo: pegar, copiar y transformar', () => {
  const fondo = (): Lienzo => Lienzo.desdeTexto(['aaaa', 'a..a', 'aaaa'], { a: A });
  const sprite = (): Lienzo => Lienzo.desdeTexto(['b.', '.b'], { b: B });

  it('pegar modo sobre: solo los píxeles opacos tapan al destino', () => {
    const l = fondo().pegar(sprite(), 1, 1);
    expect(texto(l)).toEqual(['aaaa', 'ab.a', 'aaba']);
  });

  it('pegar modos reemplazar, debajo y borrar', () => {
    const reemplazar = fondo().pegar(sprite(), 1, 1, { modo: 'reemplazar' });
    expect(reemplazar.leerHex(2, 1)).toBeNull();
    expect(reemplazar.leerHex(1, 1)).toBe('#445566');

    const debajo = fondo().pegar(sprite(), 1, 1, { modo: 'debajo' });
    expect(debajo.leerHex(1, 1)).toBe('#445566'); // el destino estaba vacío
    expect(debajo.leerHex(2, 2)).toBe('#112233'); // el destino tenía color y se conserva

    const borrar = fondo().pegar(sprite(), 0, 0, { modo: 'borrar' });
    expect(borrar.leerHex(0, 0)).toBeNull();
    expect(borrar.leerHex(1, 1)).toBeNull();
    expect(borrar.leerHex(3, 0)).toBe('#112233');
  });

  it('pegar con espejoH voltea el sprite', () => {
    const l = new Lienzo(4, 2).pegar(Lienzo.desdeTexto(['b..', 'bb.'], { b: B }), 0, 0, { espejoH: true });
    expect(l.leerHex(2, 0)).toBe('#445566');
    expect(l.leerHex(0, 0)).toBeNull();
    expect(l.leerHex(1, 1)).toBe('#445566');
    expect(l.leerHex(2, 1)).toBe('#445566');
  });

  it('pegar se recorta en los bordes y acepta pegar un lienzo sobre sí mismo', () => {
    const l = new Lienzo(4, 4);
    expect(() => l.pegar(sprite(), -1, -1).pegar(sprite(), 3, 3).pegar(sprite(), 99, 99)).not.toThrow();
    expect(l.leerHex(0, 0)).toBe('#445566');
    expect(l.leerHex(3, 3)).toBe('#445566');
    const mismo = Lienzo.desdeTexto(['b.', '..'], { b: B }).copiar();
    mismo.pegar(mismo, 1, 1);
    expect(texto(mismo)).toEqual(['a.', '.a']);
  });

  it('recortar devuelve un lienzo nuevo y lo que cae fuera queda vacío', () => {
    const l = Lienzo.desdeTexto(['ab', 'ba'], { a: A, b: B });
    const r = l.recortar(1, 0, 3, 2);
    expect(r.ancho).toBe(3);
    expect(r.leerHex(0, 0)).toBe('#445566');
    expect(r.leerHex(2, 0)).toBeNull();
    expect(l.ancho).toBe(2);
  });

  it('copiar es independiente del original', () => {
    const l = new Lienzo(3, 3).px(1, 1, A);
    const c = l.copiar();
    c.px(0, 0, B);
    expect(l.leerHex(0, 0)).toBeNull();
    expect(c.leerHex(1, 1)).toBe('#112233');
  });

  it('voltearH y voltearV devuelven lienzos nuevos', () => {
    const l = Lienzo.desdeTexto(['ab.', '...'], { a: A, b: B });
    const h = l.voltearH();
    expect(h.leerHex(0, 0)).toBeNull();
    expect(h.leerHex(2, 0)).toBe('#112233');
    expect(h.leerHex(1, 0)).toBe('#445566');
    expect(l.leerHex(0, 0)).toBe('#112233');
    const v = l.voltearV();
    expect(v.leerHex(0, 1)).toBe('#112233');
    expect(v.leerHex(0, 0)).toBeNull();
    expect(l.voltearH().voltearH().igual(l)).toBe(true);
  });

  it('escalar amplía sin suavizado y mantiene solo alfa binario', () => {
    const l = Lienzo.desdeTexto(['ab', '.a'], { a: A, b: B });
    const e = l.escalar(3);
    expect(e.ancho).toBe(6);
    expect(e.alto).toBe(6);
    expect(e.leerHex(2, 2)).toBe('#112233');
    expect(e.leerHex(3, 0)).toBe('#445566');
    expect(e.leerHex(0, 4)).toBeNull();
    expect(e.contarOpacos()).toBe(3 * 9);
    expect(soloAlfaBinario(e)).toBe(true);
    expect(() => l.escalar(0)).toThrow(RangeError);
  });

  it('mosaico repite y desplazar envuelve por los bordes', () => {
    const l = Lienzo.desdeTexto(['ab', '..'], { a: A, b: B });
    const m = l.mosaico(2, 2);
    expect(m.ancho).toBe(4);
    expect(m.alto).toBe(4);
    expect(m.leerHex(2, 2)).toBe('#112233');
    expect(m.leerHex(3, 2)).toBe('#445566');
    const d = l.desplazar(1, 0);
    expect(d.leerHex(1, 0)).toBe('#112233');
    expect(d.leerHex(0, 0)).toBe('#445566');
    const atras = l.desplazar(-1, 0);
    expect(atras.leerHex(0, 0)).toBe('#445566');
    expect(atras.leerHex(1, 0)).toBe('#112233');
    expect(l.desplazar(2, 2).igual(l)).toBe(true);
  });
});

describe('Lienzo: recolorear', () => {
  const base = (): Lienzo => Lienzo.desdeTexto(['ab', 'ba'], { a: A, b: B });

  it('con un objeto: cambia solo los colores del mapa y devuelve un lienzo nuevo', () => {
    const l = base();
    const r = l.recolorear({ [A]: 'rojo-3' });
    expect(r.leerHex(0, 0)).toBe(PALETA['rojo-3']);
    expect(r.leerHex(1, 0)).toBe('#445566');
    expect(l.leerHex(0, 0)).toBe('#112233');
  });

  it('con un Map, con nombres de paleta como clave y con null para borrar', () => {
    const r = base().recolorear(new Map([[B, null]]));
    expect(r.leerHex(1, 0)).toBeNull();
    const n = Lienzo.desdeTexto(['a'], { a: 'madera-clara-3' }).recolorear({ 'madera-clara-3': 'metal-1' });
    expect(n.leerHex(0, 0)).toBe(PALETA['metal-1']);
  });

  it('con una función: undefined deja el color como está', () => {
    const r = base().recolorear((hex) => (hex === '#112233' ? '#FFFFFF' : undefined));
    expect(r.leerHex(0, 0)).toBe('#FFFFFF');
    expect(r.leerHex(1, 0)).toBe('#445566');
  });

  it('no toca los píxeles vacíos', () => {
    const r = new Lienzo(2, 2).px(0, 0, A).recolorear({ [A]: B });
    expect(r.contarOpacos()).toBe(1);
  });
});

describe('Lienzo: consulta y texto', () => {
  it('cajaOpaca, contarOpacos y colores', () => {
    const l = new Lienzo(10, 10).rect(2, 3, 4, 2, A).px(8, 8, B);
    expect(l.cajaOpaca()).toEqual({ x: 2, y: 3, w: 7, h: 6 });
    expect(l.contarOpacos()).toBe(9);
    expect([...l.colores().entries()]).toEqual([
      ['#112233', 8],
      ['#445566', 1],
    ]);
  });

  it('igual y huella distinguen contenidos y medidas', () => {
    const a = new Lienzo(4, 4).rect(0, 0, 2, 2, A);
    const b = new Lienzo(4, 4).rect(0, 0, 2, 2, A);
    const c = new Lienzo(4, 4).rect(0, 0, 2, 3, A);
    const d = new Lienzo(2, 8).rect(0, 0, 2, 2, A);
    expect(a.igual(b)).toBe(true);
    expect(a.huella()).toBe(b.huella());
    expect(a.igual(c)).toBe(false);
    expect(a.huella()).not.toBe(c.huella());
    expect(a.igual(d)).toBe(false);
    expect(a.huella()).toHaveLength(10);
  });

  it('desdeTexto: el punto es transparente y la leyenda acepta hex, paleta y null', () => {
    const l = Lienzo.desdeTexto(['.xy', 'z.x'], { x: 'rojo-3', y: '#010203', z: null });
    expect(l.ancho).toBe(3);
    expect(l.alto).toBe(2);
    expect(l.leerHex(0, 0)).toBeNull();
    expect(l.leerHex(1, 0)).toBe(PALETA['rojo-3']);
    expect(l.leerHex(2, 0)).toBe('#010203');
    expect(l.leerHex(0, 1)).toBeNull();
    expect(l.contarOpacos()).toBe(3);
  });

  it('desdeTexto: errores claros con filas desiguales o caracteres sin leyenda', () => {
    expect(() => Lienzo.desdeTexto(['ab', 'a'], { a: A, b: B })).toThrow(/fila 1/);
    expect(() => Lienzo.desdeTexto(['az'], { a: A })).toThrow(/"z"/);
    expect(() => Lienzo.desdeTexto([], {})).toThrow(RangeError);
    expect(() => Lienzo.desdeTexto([''], {})).toThrow(/vacía/);
  });

  it('aTexto es el inverso de desdeTexto', () => {
    const original = Lienzo.desdeTexto(['.ab.', 'ba.a'], { a: A, b: B });
    const { lineas, leyenda } = original.aTexto();
    expect(lineas).toEqual(['.ab.', 'ba.a']);
    expect(Lienzo.desdeTexto(lineas, leyenda).igual(original)).toBe(true);
  });

  it('desdeDatos normaliza los píxeles vacíos y conserva el resto', () => {
    const datos = new Uint8ClampedArray([10, 20, 30, 0, 1, 2, 3, 255]);
    const l = Lienzo.desdeDatos(2, 1, datos);
    expect(l.leer(0, 0)).toEqual({ r: 0, g: 0, b: 0, a: 0 });
    expect(l.leer(1, 0)).toEqual({ r: 1, g: 2, b: 3, a: 255 });
    expect(() => Lienzo.desdeDatos(2, 2, datos)).toThrow(RangeError);
  });
});

describe('Lienzo: recetas con volumen', () => {
  it('caja pone la cara superior arriba, el frente abajo, la luz y la sombra', () => {
    const l = new Lienzo(20, 20).caja({
      x: 2,
      y: 2,
      ancho: 12,
      fondo: 8,
      alto: 4,
      superior: 'madera-clara-3',
      frontal: 'madera-clara-2',
      luz: 'madera-clara-4',
      filo: 'madera-clara-3',
      sombra: 'madera-clara-1',
    });
    expect(l.leerHex(5, 5)).toBe(PALETA['madera-clara-3']);
    expect(l.leerHex(5, 2)).toBe(PALETA['madera-clara-4']); // borde superior
    expect(l.leerHex(2, 6)).toBe(PALETA['madera-clara-4']); // borde izquierdo
    expect(l.leerHex(5, 10)).toBe(PALETA['madera-clara-3']); // filo
    expect(l.leerHex(5, 11)).toBe(PALETA['madera-clara-2']); // frente
    expect(l.leerHex(5, 13)).toBe(PALETA['madera-clara-1']); // sombra
    expect(l.cajaOpaca()).toEqual({ x: 2, y: 2, w: 12, h: 12 });
  });

  it('elipseSombreada: luz arriba a la izquierda y sombra abajo a la derecha', () => {
    const tonos = ['planta-1', 'planta-2', 'planta-3', 'planta-4'] as const;
    const l = new Lienzo(21, 21).elipseSombreada(10, 10, 8, 8, tonos);
    const lum = (x: number, y: number): number => luminancia(l.leerHex(x, y) as string);
    expect(lum(6, 6)).toBeGreaterThan(lum(14, 14));
    expect(lum(10, 5)).toBeGreaterThan(lum(10, 15));
    expect(lum(5, 10)).toBeGreaterThan(lum(15, 10));
    // Usa todos los tonos pedidos y ninguno más.
    expect(new Set(l.colores().keys())).toEqual(new Set(tonos.map((n) => PALETA[n])));
    // El mismo círculo que `elipse`.
    expect(l.contarOpacos()).toBe(new Lienzo(21, 21).elipse(10, 10, 8, 8, A).contarOpacos());
  });

  it('elipseSombreada pide al menos dos tonos y valida los umbrales', () => {
    const l = new Lienzo(8, 8);
    expect(() => l.elipseSombreada(4, 4, 3, 3, ['planta-2'])).toThrow(RangeError);
    expect(() => l.elipseSombreada(4, 4, 3, 3, ['planta-1', 'planta-2'], { umbrales: [0.2, 0.5] })).toThrow(/umbrales/);
    const dos = l.elipseSombreada(4, 4, 3, 3, ['planta-1', 'planta-3']);
    expect(dos.colores().size).toBe(2);
  });

  it('hoja: llega a la punta, es más ancha cerca de la base y recibe la luz por la izquierda', () => {
    const tonos = ['planta-1', 'planta-2', 'planta-3', 'planta-4'] as const;
    const l = new Lienzo(24, 40).hoja([12, 36], [12, 4], 10, tonos);
    const caja = l.cajaOpaca();
    expect(caja).not.toBeNull();
    expect(caja?.y).toBeLessThanOrEqual(5);
    expect(caja?.y).toBeGreaterThanOrEqual(3);
    expect(l.esOpaco(12, 4)).toBe(true); // la punta está dentro
    expect(l.esOpaco(12, 36)).toBe(true); // y la base también
    const anchoEnY = (y: number): number => {
      let n = 0;
      for (let x = 0; x < 24; x++) if (l.esOpaco(x, y)) n++;
      return n;
    };
    expect(anchoEnY(26)).toBeGreaterThan(anchoEnY(6));
    expect(anchoEnY(26)).toBeGreaterThanOrEqual(8);
    expect(anchoEnY(26)).toBeLessThanOrEqual(11);
    // Simétrica en contorno: el lado izquierdo es más claro que el derecho.
    let izq = 0;
    let der = 0;
    for (let y = 0; y < 40; y++) {
      for (let x = 0; x < 24; x++) {
        const hex = l.leerHex(x, y);
        if (hex === null) continue;
        if (x < 12) izq += luminancia(hex);
        else if (x > 12) der += luminancia(hex);
      }
    }
    expect(izq).toBeGreaterThan(der);
  });

  it('hoja: con nervadura marca la vena con el tono más oscuro y valida los tonos', () => {
    const tonos = ['planta-1', 'planta-2', 'planta-3'] as const;
    const l = new Lienzo(24, 40).hoja([12, 36], [12, 4], 10, tonos, { nervadura: true });
    expect(l.leerHex(12, 20)).toBe(PALETA['planta-1']);
    expect(() => new Lienzo(4, 4).hoja([0, 0], [3, 3], 3, ['planta-1', 'planta-2'])).toThrow(RangeError);
    expect(new Lienzo(4, 4).hoja([2, 2], [2, 2], 3, tonos).contarOpacos()).toBe(0);
  });
});

describe('Lienzo: invariantes con dibujo aleatorio', () => {
  function dibujarAlAzar(semilla: number): Lienzo {
    const rnd = aleatorio(semilla);
    const entero = (max: number): number => Math.floor(rnd() * max) - 4;
    const colores = ['rojo-3', 'metal-2', 'planta-3', '#123456', 'madera-clara-2', null] as const;
    const color = () => colores[Math.floor(rnd() * colores.length)] ?? null;
    const l = new Lienzo(32, 32);
    for (let i = 0; i < 60; i++) {
      switch (Math.floor(rnd() * 9)) {
        case 0:
          l.rect(entero(36), entero(36), entero(14), entero(14), color());
          break;
        case 1:
          l.linea(entero(36), entero(36), entero(36), entero(36), color());
          break;
        case 2:
          l.elipse(entero(36), entero(36), rnd() * 6, rnd() * 6, color(), { relleno: rnd() > 0.5, angulo: rnd() * 180 });
          break;
        case 3:
          l.rellenar(entero(36), entero(36), color());
          break;
        case 4:
          l.trama(entero(36), entero(36), entero(14), entero(14), color(), color(), 'bayer50');
          break;
        case 5:
          l.contornoTonal();
          break;
        case 6:
          l.sombraProyectada('neutro-2', 2, 2, { patron: 'degradado' });
          break;
        case 7:
          l.pegar(l.recortar(entero(30), entero(30), 8, 8), entero(36), entero(36), { espejoH: rnd() > 0.5 });
          break;
        default:
          l.hoja([entero(32), entero(32)], [entero(32), entero(32)], rnd() * 8, ['planta-1', 'planta-2', 'planta-3']);
      }
    }
    return l;
  }

  it('después de cualquier secuencia de operaciones solo hay alfa 0 o 255', () => {
    for (const semilla of [1, 2, 3, 4, 5, 6, 7, 8]) expect(soloAlfaBinario(dibujarAlAzar(semilla))).toBe(true);
  });

  it('la misma semilla da exactamente el mismo dibujo', () => {
    for (const semilla of [11, 12, 13]) expect(dibujarAlAzar(semilla).huella()).toBe(dibujarAlAzar(semilla).huella());
    expect(dibujarAlAzar(11).huella()).not.toBe(dibujarAlAzar(12).huella());
  });
});
