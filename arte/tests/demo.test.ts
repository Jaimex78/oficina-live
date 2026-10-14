import { afterAll, describe, expect, it } from 'vitest';
import { Lienzo, PALETA, leerPng, validarLienzo } from '../src/nucleo';
import type { ItemSprite } from '../src/nucleo';
import {
  SOMBRA_ESTANDAR,
  construirDemoNucleo,
  construirEstiloReferencia,
  construirVariantes,
  construirVerificaciones,
  escenaDePrueba,
  escritorio,
  monitorSobreMesa,
  paredConZocalo,
  pisoMaderaClara,
  plantaMediana,
  sillaOficina,
} from '../src/demo/estilo-referencia';
import { carpetaTemporal, diferenciasEntreColumnas, diferenciasEntreFilas } from './ayudas';

const tmp = carpetaTemporal('ol-arte-demo-');
afterAll(() => tmp.limpiar());

const COLOR_SOMBRA = PALETA['neutro-2'];

function pixelesSueltos(l: Lienzo): Array<[number, number]> {
  const sueltos: Array<[number, number]> = [];
  for (let y = 0; y < l.alto; y++) {
    for (let x = 0; x < l.ancho; x++) {
      if (!l.esOpaco(x, y)) continue;
      let vecinos = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx !== 0 || dy !== 0) && l.esOpaco(x + dx, y + dy)) vecinos++;
      if (vecinos === 0) sueltos.push([x, y]);
    }
  }
  return sueltos;
}

function cuenta(l: Lienzo, hex: string, x0: number, y0: number, w: number, h: number): number {
  let n = 0;
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (l.leerHex(x, y) === hex) n++;
  return n;
}

describe('estilo de referencia: tamaños y validación', () => {
  const esperados: Array<[string, number, number]> = [
    ['piso-madera-clara', 32, 32],
    ['pared-zocalo', 32, 32],
    ['escritorio-2x1', 64, 32],
    ['silla-oficina', 32, 32],
    ['planta-mediana', 32, 64],
    ['monitor-sobre-mesa', 32, 32],
  ];

  it('trae los seis sprites pedidos, con las medidas en casillas de 32', () => {
    const items = construirEstiloReferencia();
    expect(items.map((i) => [i.id, i.lienzo.ancho, i.lienzo.alto])).toEqual(esperados);
  });

  it('todos pasan validarLienzo: paleta global, alfa binario, múltiplos de 32 y no vacíos', () => {
    const todos: ItemSprite[] = [...construirEstiloReferencia(), ...construirVariantes(), ...construirVerificaciones()];
    expect(todos).toHaveLength(11);
    for (const item of todos) {
      expect(validarLienzo(item.lienzo, { multiplo: { ancho: 32, alto: 32 }, noVacio: true }), item.id).toEqual([]);
    }
  });

  it('es determinista: construir dos veces da exactamente los mismos píxeles', () => {
    const a = [...construirEstiloReferencia(), ...construirVariantes(), ...construirVerificaciones()];
    const b = [...construirEstiloReferencia(), ...construirVariantes(), ...construirVerificaciones()];
    a.forEach((item, i) => expect(item.lienzo.huella(), item.id).toBe(b[i]?.lienzo.huella()));
  });

  it('usa pocos colores por sprite (rampas coherentes, nada de ruido de color)', () => {
    for (const item of construirEstiloReferencia()) {
      expect(item.lienzo.colores().size, item.id).toBeLessThanOrEqual(20);
    }
  });

  it('no deja píxeles sueltos (ruido): todo píxel visible toca a otro', () => {
    for (const item of construirEstiloReferencia()) expect(pixelesSueltos(item.lienzo), item.id).toEqual([]);
  });

  it('no usa negro puro y casi no usa el negro tinta: los contornos son tonales', () => {
    for (const item of [...construirEstiloReferencia(), ...construirVerificaciones()]) {
      const colores = item.lienzo.colores();
      expect(colores.has('#000000'), item.id).toBe(false);
      const tinta = colores.get('#0A0A0A') ?? 0;
      expect(tinta / Math.max(1, item.lienzo.contarOpacos()), item.id).toBeLessThan(0.1);
    }
  });
});

describe('estilo de referencia: tiles sin costuras', () => {
  it('el piso de madera repite sin costuras: los bordes opuestos empatan como cualquier columna o fila vecina', () => {
    const piso = pisoMaderaClara();
    let maximoColumnas = 0;
    for (let x = 0; x < 31; x++) maximoColumnas = Math.max(maximoColumnas, diferenciasEntreColumnas(piso, x, x + 1));
    expect(diferenciasEntreColumnas(piso, 31, 0)).toBeLessThanOrEqual(maximoColumnas);
    let maximoFilas = 0;
    for (let y = 0; y < 31; y++) maximoFilas = Math.max(maximoFilas, diferenciasEntreFilas(piso, y, y + 1));
    expect(diferenciasEntreFilas(piso, 31, 0)).toBeLessThanOrEqual(maximoFilas);
  });

  it('en el mosaico de 3 x 3 el piso se ve igual a ambos lados de cada unión', () => {
    const mosaico = pisoMaderaClara().mosaico(3, 3);
    let maximoColumnas = 0;
    for (let x = 0; x < 95; x++) {
      if (x % 32 === 31) continue;
      maximoColumnas = Math.max(maximoColumnas, diferenciasEntreColumnas(mosaico, x, x + 1));
    }
    for (const union of [31, 63]) expect(diferenciasEntreColumnas(mosaico, union, union + 1)).toBeLessThanOrEqual(maximoColumnas);
    let maximoFilas = 0;
    for (let y = 0; y < 95; y++) {
      if (y % 32 === 31) continue;
      maximoFilas = Math.max(maximoFilas, diferenciasEntreFilas(mosaico, y, y + 1));
    }
    for (const union of [31, 63]) expect(diferenciasEntreFilas(mosaico, union, union + 1)).toBeLessThanOrEqual(maximoFilas);
  });

  it('el piso es de un solo material: solo la rampa de madera clara', () => {
    for (const hex of pisoMaderaClara().colores().keys()) {
      expect([PALETA['madera-clara-1'], PALETA['madera-clara-2'], PALETA['madera-clara-3'], PALETA['madera-clara-4']]).toContain(hex);
    }
  });

  it('la pared repite a lo ancho sin costuras: no tiene nada vertical y sus bordes son idénticos', () => {
    const pared = paredConZocalo();
    expect(diferenciasEntreColumnas(pared, 0, 31)).toBe(0);
    for (let x = 0; x < 31; x++) expect(diferenciasEntreColumnas(pared, x, x + 1)).toBe(0);
  });

  it('la pared tiene tapa clara arriba, frente medio y zócalo oscuro abajo', () => {
    const pared = paredConZocalo();
    expect(pared.leerHex(5, 3)).toBe(PALETA['pared-calida-3']);
    expect(pared.leerHex(5, 15)).toBe(PALETA['pared-calida-2']);
    expect(pared.leerHex(5, 28)).toBe(PALETA['madera-oscura-3']);
    expect(pared.leerHex(5, 31)).toBe(PALETA['madera-oscura-1']);
  });
});

describe('estilo de referencia: luz arriba a la izquierda y una sola sombra', () => {
  const objetos: Array<[string, Lienzo]> = [
    ['escritorio', escritorio()],
    ['silla', sillaOficina()],
    ['planta', plantaMediana()],
    ['monitor', monitorSobreMesa()],
  ];

  it('la sombra estándar es un gris frío de la paleta que cae abajo a la derecha', () => {
    expect(SOMBRA_ESTANDAR.color).toBe('neutro-2');
    expect(SOMBRA_ESTANDAR.dx).toBeGreaterThan(0);
    expect(SOMBRA_ESTANDAR.dy).toBeGreaterThan(0);
  });

  it('cada objeto proyecta sombra a la derecha y abajo, y ninguna arriba ni a la izquierda', () => {
    for (const [nombre, l] of objetos) {
      const derecha = cuenta(l, COLOR_SOMBRA, l.ancho - 3, 0, 3, l.alto);
      const izquierda = cuenta(l, COLOR_SOMBRA, 0, 0, 3, l.alto);
      const abajo = cuenta(l, COLOR_SOMBRA, 0, l.alto - 3, l.ancho, 3);
      const arriba = cuenta(l, COLOR_SOMBRA, 0, 0, l.ancho, 3);
      expect(derecha, `${nombre} derecha`).toBeGreaterThan(0);
      expect(abajo, `${nombre} abajo`).toBeGreaterThan(0);
      expect(izquierda, `${nombre} izquierda`).toBe(0);
      expect(arriba, `${nombre} arriba`).toBe(0);
    }
  });

  it('se puede dibujar sin sombra y entonces el sprite tiene menos píxeles', () => {
    expect(escritorio({ sombra: false }).colores().has(COLOR_SOMBRA)).toBe(false);
    expect(sillaOficina({ sombra: false }).contarOpacos()).toBeLessThan(sillaOficina().contarOpacos());
    expect(plantaMediana({ sombra: false }).contarOpacos()).toBeLessThan(plantaMediana().contarOpacos());
    expect(monitorSobreMesa({ sombra: false }).contarOpacos()).toBeLessThan(monitorSobreMesa().contarOpacos());
  });

  it('en el escritorio la cara superior es la parte más clara y el canto frontal es más oscuro', () => {
    const l = escritorio({ sombra: false });
    expect(l.leerHex(30, 8)).toBe(PALETA['madera-oscura-3']); // cara superior
    expect(l.leerHex(30, 2)).toBe(PALETA['madera-oscura-4']); // brillo del borde superior
    expect(l.leerHex(30, 19)).toBe(PALETA['madera-oscura-2']); // canto frontal
    expect(l.leerHex(3, 8)).toBe(PALETA['madera-oscura-4']); // brillo del borde izquierdo
  });

  it('el contorno tonal de la silla es el tono anterior de su tela, no negro', () => {
    const silla = sillaOficina({ sombra: false });
    // El respaldo (tela-gris-2) queda rodeado por tela-gris-1.
    expect(silla.leerHex(15, 0)).toBe(PALETA['tela-gris-1']);
  });
});

describe('estilo de referencia: variantes de color', () => {
  it('las variantes salen de recolorear la silla: misma silueta, otra tela, todo dentro de la paleta', () => {
    const base = sillaOficina();
    const variantes = construirVariantes();
    expect(variantes.map((v) => v.id)).toEqual(['silla-oficina~rojo', 'silla-oficina~mostaza']);
    for (const v of variantes) {
      expect(v.lienzo.cajaOpaca()).toEqual(base.cajaOpaca());
      expect(v.lienzo.contarOpacos()).toBe(base.contarOpacos());
      expect(v.lienzo.huella()).not.toBe(base.huella());
      expect(validarLienzo(v.lienzo, { multiplo: { ancho: 32, alto: 32 } }), v.id).toEqual([]);
      expect(v.lienzo.colores().has(PALETA['tela-gris-2']), v.id).toBe(false);
    }
    // El rojo usa el rojo de marca en el cuerpo del respaldo.
    expect(variantes[0]?.lienzo.colores().has(PALETA['rojo-2'])).toBe(true);
    // El plástico y el metal no cambian: siguen usando los mismos grises.
    expect(variantes[0]?.lienzo.colores().has(PALETA['metal-1'])).toBe(true);
  });
});

describe('estilo de referencia: piezas y escena', () => {
  it('el monitor usa el rojo coral exacto en su acento y el azul de la rampa vidrio en la pantalla', () => {
    const colores = monitorSobreMesa().colores();
    expect(colores.has('#EF3B3A')).toBe(true);
    expect(colores.has(PALETA['vidrio-0'])).toBe(true);
  });

  it('la planta tiene la maceta abajo y las hojas arriba, y cabe en 1 x 2 casillas', () => {
    const planta = plantaMediana({ sombra: false });
    const caja = planta.cajaOpaca();
    expect(caja).not.toBeNull();
    expect((caja?.y ?? 99)).toBeLessThanOrEqual(6);
    expect((caja?.y ?? 0) + (caja?.h ?? 0)).toBeLessThanOrEqual(62);
    expect(planta.leerHex(16, 52)).toBe(PALETA['maceta-terracota-2']);
    expect(planta.leerHex(16, 20)).not.toBeNull();
    // Las hojas usan toda la rampa de planta, del contorno al brillo.
    for (let tono = 0; tono <= 4; tono++) expect(planta.colores().has(PALETA[`planta-${tono}` as keyof typeof PALETA]), `planta-${tono}`).toBe(true);
  });

  it('la escena de prueba junta todo sobre el piso, es de 9 x 5 casillas y sin huecos', () => {
    const escena = escenaDePrueba();
    expect(escena.ancho).toBe(9 * 32);
    expect(escena.alto).toBe(5 * 32);
    expect(escena.contarOpacos()).toBe(escena.ancho * escena.alto);
    expect(validarLienzo(escena, { multiplo: { ancho: 32, alto: 32 } })).toEqual([]);
    // Contiene las rampas de todos los objetos.
    const colores = escena.colores();
    for (const hex of [PALETA['madera-oscura-3'], PALETA['tela-gris-3'], PALETA['planta-3'], PALETA['vidrio-0'], PALETA['madera-clara-3']]) {
      expect(colores.has(hex), hex).toBe(true);
    }
  });
});

describe('construirDemoNucleo', () => {
  it('escribe la hoja de contacto en la carpeta pedida y devuelve los sprites validados', () => {
    const { items, ruta } = construirDemoNucleo(tmp.ruta);
    expect(items.map((i) => i.id)).toEqual([
      'piso-madera-clara',
      'pared-zocalo',
      'escritorio-2x1',
      'silla-oficina',
      'planta-mediana',
      'monitor-sobre-mesa',
      'silla-oficina~rojo',
      'silla-oficina~mostaza',
      'piso-mosaico-3x3',
      'pared-mosaico-3x1',
      'escena-prueba',
    ]);
    expect(ruta.endsWith('demo-nucleo.png')).toBe(true);
    const hoja = leerPng(ruta);
    expect(hoja.ancho).toBeGreaterThan(600);
    expect(hoja.alto).toBeGreaterThan(400);
  });
});
