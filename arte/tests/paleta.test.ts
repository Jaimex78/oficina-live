import { describe, expect, it } from 'vitest';
import {
  ALIAS,
  PALETA,
  RAMPAS,
  color,
  esColorDePaleta,
  hexAOklch,
  hexARgb,
  mapaEntreRampas,
  nombreDeColor,
  normalizarHex,
  oklchAHex,
  oscurecerEnRampa,
  rampa,
  rampa5,
  rgbAHex,
  ubicarEnPaleta,
} from '../src/nucleo';

const todos = Object.values(PALETA);

describe('paleta global', () => {
  it('tiene entre 48 y 128 colores, todos distintos y en formato #RRGGBB mayúsculas', () => {
    expect(todos.length).toBeGreaterThanOrEqual(48);
    expect(todos.length).toBeLessThanOrEqual(128);
    expect(new Set(todos).size).toBe(todos.length);
    for (const hex of todos) expect(hex).toMatch(/^#[0-9A-F]{6}$/);
  });

  it('cada rampa tiene de 4 a 6 tonos, salvo neutro que tiene 8', () => {
    for (const [nombre, tonos] of Object.entries(RAMPAS)) {
      if (nombre === 'neutro') expect(tonos).toHaveLength(8);
      else {
        expect(tonos.length, nombre).toBeGreaterThanOrEqual(4);
        expect(tonos.length, nombre).toBeLessThanOrEqual(6);
      }
    }
  });

  it('incluye las rampas mínimas del entorno', () => {
    const minimas = [
      'neutro',
      'pared-calida',
      'madera-clara',
      'madera-oscura',
      'metal',
      'vidrio',
      'tela-gris',
      'tela-calida',
      'planta',
      'maceta-terracota',
      'cemento',
      'baldosa',
      'cesped',
      'rojo',
    ];
    for (const nombre of minimas) expect(Object.keys(RAMPAS), nombre).toContain(nombre);
  });

  it('cada rampa va de más oscura a más clara (la luminosidad crece en cada tono)', () => {
    for (const [nombre, tonos] of Object.entries(RAMPAS)) {
      const luces = tonos.map((hex) => hexAOklch(hex).L);
      for (let i = 1; i < luces.length; i++) {
        expect(luces[i] as number, `${nombre} tono ${i}`).toBeGreaterThan(luces[i - 1] as number);
      }
    }
  });

  it('los pasos de luminosidad dentro de una rampa son visibles (al menos 0.04 en OKLab)', () => {
    for (const [nombre, tonos] of Object.entries(RAMPAS)) {
      const luces = tonos.map((hex) => hexAOklch(hex).L);
      for (let i = 1; i < luces.length; i++) {
        expect((luces[i] as number) - (luces[i - 1] as number), `${nombre} tono ${i}`).toBeGreaterThan(0.04);
      }
    }
  });

  it('neutro empieza en negro tinta y llega al blanco', () => {
    expect(RAMPAS.neutro[0]).toBe('#0A0A0A');
    expect(RAMPAS.neutro[7]).toBe('#FFFFFF');
  });

  it('los acentos de marca son los del proyecto: rojo #EF3B3A y su oscuro #D42E2D', () => {
    expect(RAMPAS.rojo[3]).toBe('#EF3B3A');
    expect(RAMPAS.rojo[2]).toBe('#D42E2D');
    expect(color('rojo-coral')).toBe('#EF3B3A');
    expect(color('rojo-coral-oscuro')).toBe('#D42E2D');
    expect(color('tinta')).toBe('#0A0A0A');
    expect(color('blanco')).toBe('#FFFFFF');
  });

  it('los alias apuntan a colores que existen', () => {
    for (const destino of Object.values(ALIAS)) expect(PALETA[destino]).toBeDefined();
  });

  it('la piel y el cabello no están en la paleta global', () => {
    expect(Object.keys(RAMPAS).some((n) => n.includes('piel') || n.includes('cabello'))).toBe(false);
  });

  it('cada color está en una sola rampa y se puede ubicar', () => {
    for (const [nombre, tonos] of Object.entries(RAMPAS)) {
      tonos.forEach((hex, indice) => {
        expect(ubicarEnPaleta(hex)).toEqual({ rampa: nombre, indice });
        expect(nombreDeColor(hex)).toBe(`${nombre}-${indice}`);
      });
    }
    expect(ubicarEnPaleta('#123456')).toBeNull();
    expect(nombreDeColor('no-es-hex')).toBeNull();
  });
});

describe('color, rampa y esColorDePaleta', () => {
  it('color() resuelve nombres, alias y hex, y normaliza a mayúsculas', () => {
    expect(color('madera-clara-3')).toBe(PALETA['madera-clara-3']);
    expect(color('#e9c28a')).toBe('#E9C28A');
    expect(color('#123456')).toBe('#123456');
  });

  it('color() lanza errores con sugerencias legibles', () => {
    expect(() => color('maderaclara-3')).toThrow(/Color desconocido/);
    expect(() => color('metl-2')).toThrow(/metal-2/);
    expect(() => color('#12345')).toThrow(/#RRGGBB/);
  });

  it('rampa() devuelve la rampa completa y no se puede modificar', () => {
    const r = rampa('madera-clara');
    expect(r).toHaveLength(5);
    expect(r[0]).toBe(PALETA['madera-clara-0']);
    expect(() => (r as string[]).push('#000000')).toThrow();
    expect(() => rampa('madera')).toThrow(/madera-clara|madera-oscura/);
  });

  it('esColorDePaleta distingue mayúsculas de minúsculas sin importar y rechaza lo ajeno', () => {
    expect(esColorDePaleta('#e9c28a')).toBe(true);
    expect(esColorDePaleta('#E9C28A')).toBe(true);
    expect(esColorDePaleta('#E9C28B')).toBe(false);
    expect(esColorDePaleta('madera-clara-3')).toBe(false);
    expect(esColorDePaleta('')).toBe(false);
  });
});

describe('oscurecerEnRampa', () => {
  it('devuelve el tono anterior de la rampa que contiene al color', () => {
    expect(oscurecerEnRampa(PALETA['madera-clara-3'])).toBe(PALETA['madera-clara-2']);
    expect(oscurecerEnRampa(PALETA['rojo-3'])).toBe('#D42E2D');
    expect(oscurecerEnRampa(PALETA['neutro-7'])).toBe(PALETA['neutro-6']);
  });

  it('en el tono 0 devuelve el mismo color', () => {
    expect(oscurecerEnRampa(PALETA['madera-clara-0'])).toBe(PALETA['madera-clara-0']);
    expect(oscurecerEnRampa(PALETA['neutro-0'])).toBe('#0A0A0A');
  });

  it('con pasos retrocede varios tonos sin pasarse del 0', () => {
    expect(oscurecerEnRampa(PALETA['madera-clara-4'], 2)).toBe(PALETA['madera-clara-2']);
    expect(oscurecerEnRampa(PALETA['madera-clara-1'], 5)).toBe(PALETA['madera-clara-0']);
    expect(oscurecerEnRampa(PALETA['madera-clara-3'], 0)).toBe(PALETA['madera-clara-3']);
  });

  it('acepta minúsculas y, fuera de la paleta, da un color más oscuro', () => {
    expect(oscurecerEnRampa('#e9c28a')).toBe(PALETA['madera-clara-2']);
    const base = '#6A9955';
    const oscuro = oscurecerEnRampa(base);
    expect(hexAOklch(oscuro).L).toBeLessThan(hexAOklch(base).L);
    expect(oscurecerEnRampa(base, 2)).toBe(rampa5(base)[0]);
    expect(oscurecerEnRampa(base, 0)).toBe(base);
  });
});

describe('rampa5', () => {
  const bases = [
    '#EF3B3A',
    '#D9A66B',
    '#7A4B33',
    '#3A9A4B',
    '#E5B143',
    '#4F95C8',
    '#8E6BBF',
    '#C68642',
    '#8D5524',
    '#F1C27D',
    '#FFDBAC',
    '#6B6B75',
    '#2B2B33',
    '#E8DCC4',
    '#5C3A21',
    '#1A1A22',
  ];

  it('devuelve 5 tonos con el base en el centro, en mayúsculas', () => {
    for (const base of bases) {
      const r = rampa5(base);
      expect(r).toHaveLength(5);
      expect(r[2]).toBe(base.toUpperCase());
      for (const hex of r) expect(hex).toMatch(/^#[0-9A-F]{6}$/);
    }
    expect(rampa5('#d9a66b')[2]).toBe('#D9A66B');
  });

  it('la luminosidad crece de forma estricta en colores normales', () => {
    for (const base of bases) {
      const r = rampa5(base);
      const luces = r.map((hex) => hexAOklch(hex).L);
      for (let i = 1; i < 5; i++) expect(luces[i] as number, `${base} tono ${i}`).toBeGreaterThan(luces[i - 1] as number);
    }
  });

  it('los 5 tonos son distintos y se separan al menos 0.025 en OKLab', () => {
    for (const base of bases) {
      const luces = rampa5(base).map((hex) => hexAOklch(hex).L);
      for (let i = 1; i < 5; i++) expect((luces[i] as number) - (luces[i - 1] as number), `${base} tono ${i}`).toBeGreaterThan(0.025);
    }
  });

  it('es determinista', () => {
    for (const base of bases) expect(rampa5(base)).toEqual(rampa5(base));
  });

  it('corre las sombras hacia el azul violeta y las luces hacia el amarillo', () => {
    // Naranja (matiz ~65): las sombras bajan el matiz (hacia rojo y violeta) y las luces lo suben (hacia amarillo).
    const naranja = rampa5('#D9A66B').map((hex) => hexAOklch(hex).h);
    expect(naranja[0] as number).toBeLessThan(naranja[2] as number);
    expect(naranja[1] as number).toBeLessThan(naranja[2] as number);
    expect(naranja[4] as number).toBeGreaterThan(naranja[2] as number);
    // Verde (matiz ~150): las sombras suben hacia azul y las luces bajan hacia amarillo.
    const verde = rampa5('#3A9A4B').map((hex) => hexAOklch(hex).h);
    expect(verde[0] as number).toBeGreaterThan(verde[2] as number);
    expect(verde[4] as number).toBeLessThan(verde[2] as number);
  });

  it('en grises da sombras frías y luces casi neutras', () => {
    const [s0, , , , l4] = rampa5('#8C8C96');
    const sombra = hexARgb(s0);
    expect(sombra[2]).toBeGreaterThan(sombra[0]); // más azul que rojo
    const luz = hexAOklch(l4);
    expect(luz.C).toBeLessThan(0.03);
  });

  it('con colores muy oscuros o muy claros abre el otro lado y no se sale del rango', () => {
    const oscuro = rampa5('#101018');
    expect(hexAOklch(oscuro[4]).L - hexAOklch(oscuro[2]).L).toBeGreaterThan(0.12);
    const claro = rampa5('#F2EEE2');
    expect(hexAOklch(claro[2]).L - hexAOklch(claro[0]).L).toBeGreaterThan(0.2);
    expect(() => rampa5('#000000')).not.toThrow();
    expect(() => rampa5('#FFFFFF')).not.toThrow();
  });

  it('rechaza colores que no son hex', () => {
    expect(() => rampa5('rojo')).toThrow(/inválido/);
  });
});

describe('mapaEntreRampas', () => {
  it('empareja tono a tono rampas del mismo largo', () => {
    const mapa = mapaEntreRampas('madera-clara', 'madera-oscura');
    RAMPAS['madera-clara'].forEach((hex, i) => expect(mapa[hex]).toBe(RAMPAS['madera-oscura'][i]));
  });

  it('con largos distintos empareja oscuro con oscuro y claro con claro', () => {
    const mapa = mapaEntreRampas('tela-gris', 'rojo');
    expect(mapa[RAMPAS['tela-gris'][0]]).toBe(RAMPAS.rojo[0]);
    expect(mapa[RAMPAS['tela-gris'][3]]).toBe(RAMPAS.rojo[4]);
    expect(Object.keys(mapa)).toHaveLength(4);
  });

  it('acepta listas de hex además de nombres', () => {
    const mapa = mapaEntreRampas(['#112233', '#445566'], rampa5('#AA5500'));
    expect(mapa['#112233']).toBe(rampa5('#AA5500')[0]);
    expect(mapa['#445566']).toBe(rampa5('#AA5500')[4]);
  });
});

describe('color: conversiones', () => {
  it('rgbAHex y hexARgb son inversos y recortan a 0..255', () => {
    expect(rgbAHex(0, 128, 255)).toBe('#0080FF');
    expect(hexARgb('#0080ff')).toEqual([0, 128, 255]);
    expect(rgbAHex(-5, 300, 12.6)).toBe('#00FF0D');
    expect(normalizarHex('#abcdef')).toBe('#ABCDEF');
  });

  it('OKLCH ida y vuelta conserva el color (con un byte de tolerancia)', () => {
    for (const hex of ['#EF3B3A', '#3A9A4B', '#6B6B75', '#F7DDB0', '#2E3644']) {
      const { L, C, h } = hexAOklch(hex);
      const vuelta = hexARgb(oklchAHex(L, C, h));
      const original = hexARgb(hex);
      for (let i = 0; i < 3; i++) expect(Math.abs((vuelta[i] as number) - (original[i] as number))).toBeLessThanOrEqual(1);
    }
  });

  it('oklchAHex baja el croma cuando el color no cabe en sRGB', () => {
    const hex = oklchAHex(0.5, 0.5, 145);
    expect(hex).toMatch(/^#[0-9A-F]{6}$/);
    const { L } = hexAOklch(hex);
    expect(Math.abs(L - 0.5)).toBeLessThan(0.03);
  });
});
