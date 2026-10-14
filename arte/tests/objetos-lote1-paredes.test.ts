import { MASCARAS_PARED } from '@ol/shared';
import { describe, expect, it } from 'vitest';
import { Lienzo, PALETA } from '../src/nucleo';
import { construirLote1 } from '../src/objetos/l1-todo';
import { CARA_Y0, PARED_ALTO, PARED_ANCHO, TALLO_X0, TALLO_X1, ZOCALO_Y0, geometria } from '../src/objetos/l1-paredes';
import { diferenciasEntreColumnas, diferenciasEntreFilas } from './ayudas';

const { cuadros } = construirLote1();
const cuadro = (id: string): Lienzo => {
  const l = cuadros.get(id);
  if (!l) throw new Error(`Falta el cuadro ${id}`);
  return l;
};

describe('pisos: tiles sin costuras', () => {
  const pisos = ['piso-madera-clara', 'piso-madera-oscura', 'piso-baldosa', 'piso-cemento'];

  it('son de 32 x 32 y no tienen ningún píxel vacío', () => {
    for (const id of pisos) {
      const l = cuadro(id);
      expect([l.ancho, l.alto], id).toEqual([32, 32]);
      expect(l.contarOpacos(), id).toBe(32 * 32);
    }
  });

  it('los bordes opuestos empatan como cualquier columna o fila vecina', () => {
    for (const id of pisos) {
      const piso = cuadro(id);
      let maxColumnas = 0;
      for (let x = 0; x < 31; x++) maxColumnas = Math.max(maxColumnas, diferenciasEntreColumnas(piso, x, x + 1));
      expect(diferenciasEntreColumnas(piso, 31, 0), `${id} columnas`).toBeLessThanOrEqual(maxColumnas);
      let maxFilas = 0;
      for (let y = 0; y < 31; y++) maxFilas = Math.max(maxFilas, diferenciasEntreFilas(piso, y, y + 1));
      expect(diferenciasEntreFilas(piso, 31, 0), `${id} filas`).toBeLessThanOrEqual(maxFilas);
    }
  });

  it('en el mosaico de 3 x 3 y desplazado a la mitad no aparece una costura mayor que las del propio tile', () => {
    for (const id of pisos) {
      const piso = cuadro(id);
      const mosaico = piso.mosaico(3, 3);
      let maxColumnas = 0;
      let maxFilas = 0;
      for (let x = 0; x < 95; x++) if (x % 32 !== 31) maxColumnas = Math.max(maxColumnas, diferenciasEntreColumnas(mosaico, x, x + 1));
      for (let y = 0; y < 95; y++) if (y % 32 !== 31) maxFilas = Math.max(maxFilas, diferenciasEntreFilas(mosaico, y, y + 1));
      for (const union of [31, 63]) {
        expect(diferenciasEntreColumnas(mosaico, union, union + 1), `${id} unión x=${union}`).toBeLessThanOrEqual(maxColumnas);
        expect(diferenciasEntreFilas(mosaico, union, union + 1), `${id} unión y=${union}`).toBeLessThanOrEqual(maxFilas);
      }
      // Desplazado a la mitad, las uniones caen en el centro del tile: tampoco puede verse una costura mayor.
      const medio = piso.desplazar(16, 16);
      let maxMedioColumnas = 0;
      for (let x = 0; x < 31; x++) maxMedioColumnas = Math.max(maxMedioColumnas, diferenciasEntreColumnas(medio, x, x + 1));
      expect(maxMedioColumnas, id).toBeLessThanOrEqual(Math.max(maxColumnas, 32));
    }
  });

  it('cada piso usa pocos colores y de su propia familia', () => {
    const familias: Record<string, string[]> = {
      'piso-madera-clara': ['ladrillo-crema'],
      'piso-madera-oscura': ['madera-oscura'],
      'piso-baldosa': ['baldosa-gris', 'neutro-7'],
      'piso-cemento': ['baldosa-gris'],
    };
    for (const id of pisos) {
      const permitidos = new Set(Object.entries(PALETA).filter(([nombre]) => (familias[id] ?? []).some((f) => nombre === f || nombre.startsWith(`${f}-`))).map(([, hex]) => hex));
      for (const hex of cuadro(id).colores().keys()) expect(permitidos.has(hex), `${id} ${hex}`).toBe(true);
    }
  });

  it('el piso oscuro es más oscuro que el tablero de los muebles de nogal (madera-oscura-3)', () => {
    const colores = cuadro('piso-madera-oscura').colores();
    expect(colores.has(PALETA['madera-oscura-4'])).toBe(false);
    expect([...colores.entries()][0]?.[0]).toBe(PALETA['madera-oscura-2']);
  });
});

describe('paredes: geometría de las 16 máscaras', () => {
  it('hay 16 máscaras y cada pieza mide 32 x 64', () => {
    expect(MASCARAS_PARED).toHaveLength(16);
    for (const m of MASCARAS_PARED) {
      const l = cuadro(`pared-lisa@${m}`);
      expect([l.ancho, l.alto], m).toEqual([PARED_ANCHO, PARED_ALTO]);
    }
  });

  it('una pared aislada es un pilar de 10 px: tapa de 10 filas, cara de 48 y contorno de 1 px', () => {
    const l = cuadro('pared-lisa@0000');
    const caja = l.cajaOpaca();
    // Contorno incluido: 12 px de ancho (10 de tapa más 1 a cada lado) y desde la fila 5 hasta la 63.
    expect(caja).toEqual({ x: TALLO_X0 - 1, y: 5, w: TALLO_X1 - TALLO_X0 + 2, h: PARED_ALTO - 5 });
  });

  it('la cara mide 48 px, más que un personaje, y termina en la última fila del cuadro', () => {
    for (const m of MASCARAS_PARED) {
      const g = geometria(m);
      if (g.s) continue;
      for (let x = g.xi; x < g.xd; x++) {
        expect(cuadro(`pared-lisa@${m}`).esOpaco(x, CARA_Y0), `${m} x=${x} arriba`).toBe(true);
        expect(cuadro(`pared-lisa@${m}`).esOpaco(x, PARED_ALTO - 1), `${m} x=${x} abajo`).toBe(true);
      }
      expect(PARED_ALTO - CARA_Y0).toBeGreaterThan(48 - 1);
    }
  });

  it('el zócalo es oscuro, azul marino, en las 8 últimas filas de toda cara visible', () => {
    const l = cuadro('pared-lisa@0101');
    for (let y = ZOCALO_Y0; y < PARED_ALTO; y++) {
      expect([PALETA['azul-oficina-3'], PALETA['azul-oficina-2'], PALETA['azul-oficina-1'], PALETA['azul-oficina-0']], `fila ${y}`).toContain(l.leerHex(16, y));
    }
  });

  it('un tramo vertical muestra solo la tapa (franja de 10 px) y ninguna cara', () => {
    const l = cuadro('pared-lisa@1010');
    for (let y = 0; y < 32; y++) {
      expect(l.esOpaco(TALLO_X0, y), `y=${y} dentro`).toBe(true);
      expect(l.esOpaco(TALLO_X1 - 1, y), `y=${y} dentro`).toBe(true);
      expect(l.esOpaco(TALLO_X0 - 4, y), `y=${y} fuera`).toBe(false);
    }
    for (let y = 33; y < PARED_ALTO; y++) expect(l.esOpaco(16, y), `y=${y} debajo`).toBe(false);
  });

  it('el extremo sur de un tramo vertical muestra la cara en el tallo', () => {
    const l = cuadro('pared-lisa@1000');
    expect(l.esOpaco(16, PARED_ALTO - 1)).toBe(true);
    expect(l.esOpaco(16, CARA_Y0 + 10)).toBe(true);
    expect(l.esOpaco(4, PARED_ALTO - 1)).toBe(false);
  });
});

describe('paredes: uniones sin costuras', () => {
  const materiales: Array<[string, (m: string) => string]> = [
    ['base', (m) => `pared-lisa@${m}`],
    ['gris', (m) => `pared-lisa@${m}~gris`],
    ['rojo', (m) => `pared-lisa@${m}~rojo`],
  ];

  it('en horizontal, la columna 31 de una pieza con vecino al este y la 0 de una con vecino al oeste son idénticas en silueta y color', () => {
    for (const [nombre, id] of materiales) {
      for (const a of MASCARAS_PARED.filter((m) => m[1] === '1')) {
        for (const b of MASCARAS_PARED.filter((m) => m[3] === '1')) {
          const izquierda = cuadro(id(a));
          const derecha = cuadro(id(b));
          for (let y = 0; y < PARED_ALTO; y++) {
            expect(izquierda.esOpaco(31, y), `${nombre} ${a}|${b} y=${y}`).toBe(derecha.esOpaco(0, y));
          }
        }
      }
    }
  });

  it('en vertical, la franja de tapa no se corta entre una pieza con vecino al sur y la que está debajo', () => {
    for (const [nombre, id] of materiales) {
      for (const a of MASCARAS_PARED.filter((m) => m[2] === '1')) {
        for (const b of MASCARAS_PARED.filter((m) => m[0] === '1')) {
          const compuesto = new Lienzo(PARED_ANCHO, PARED_ALTO + 32);
          compuesto.pegar(cuadro(id(a)), 0, 0);
          compuesto.pegar(cuadro(id(b)), 0, 32);
          for (let x = TALLO_X0; x < TALLO_X1; x++) {
            for (let y = 16; y < 48; y++) expect(compuesto.esOpaco(x, y), `${nombre} ${a} sobre ${b} (${x},${y})`).toBe(true);
            // Sin salto de color en la costura entre cuadros (fila 31 contra fila 32).
            expect(compuesto.leerHex(x, 31), `${nombre} ${a} sobre ${b} x=${x}`).toBe(compuesto.leerHex(x, 32));
          }
        }
      }
    }
  });

  it('con un muro al sur, el contorno del tallo no deja huecos entre cuadros', () => {
    const arriba = cuadro('pared-lisa@1010');
    const abajo = cuadro('pared-lisa@1010');
    const compuesto = new Lienzo(PARED_ANCHO, PARED_ALTO + 32);
    compuesto.pegar(arriba, 0, 0);
    compuesto.pegar(abajo, 0, 32);
    for (let y = 8; y < 56; y++) {
      expect(compuesto.esOpaco(TALLO_X0 - 1, y), `contorno izquierdo y=${y}`).toBe(true);
      expect(compuesto.esOpaco(TALLO_X1, y), `contorno derecho y=${y}`).toBe(true);
    }
  });
});

describe('aberturas: encajan con el muro vecino', () => {
  const bordes = (l: Lienzo, x: number): boolean[] => Array.from({ length: l.alto }, (_, y) => l.esOpaco(x, y));

  it('la ventana de frente tiene los mismos bordes que la pared lisa de tramo recto', () => {
    const lisa = cuadro('pared-lisa@0101');
    const ventana = cuadro('pared-ventana@S');
    for (const x of [0, 31]) expect(bordes(ventana, x), `x=${x}`).toEqual(bordes(lisa, x));
    for (let y = 0; y < CARA_Y0; y++) for (let x = 0; x < 32; x++) expect(ventana.leerHex(x, y), `(${x},${y})`).toBe(lisa.leerHex(x, y));
  });

  it('las puertas de frente tienen la misma silueta de borde que la pared lisa y dejan un hueco de verdad', () => {
    const lisa = cuadro('pared-lisa@0101');
    const simple = cuadro('puerta-simple@S');
    for (const x of [0, 31]) expect(bordes(simple, x), `x=${x}`).toEqual(bordes(lisa, x));
    // Hueco: se ve a través de la puerta (alfa 0) en el centro, de la fila 24 a la 60.
    for (let y = 26; y < 60; y++) expect(simple.esOpaco(16, y), `y=${y}`).toBe(false);
    const doble = cuadro('puerta-doble@S');
    expect([doble.ancho, doble.alto]).toEqual([64, 64]);
    for (const x of [0, 63]) expect(bordes(doble, x), `doble x=${x}`).toEqual(bordes(lisa, 0));
    for (let y = 26; y < 60; y++) expect(doble.esOpaco(32, y), `doble y=${y}`).toBe(false);
  });

  it('las aberturas verticales tienen la misma franja de tapa que el tramo vertical de pared lisa', () => {
    const lisa = cuadro('pared-lisa@1010');
    for (const id of ['pared-ventana@E', 'pared-ventana@O', 'puerta-simple@E']) {
      const l = cuadro(id);
      for (let y = 0; y < 32; y++) {
        for (let x = TALLO_X0 - 1; x <= TALLO_X1; x++) expect(l.esOpaco(x, y), `${id} (${x},${y})`).toBe(lisa.esOpaco(x, y));
      }
    }
    const doble = cuadro('puerta-doble@E');
    expect([doble.ancho, doble.alto]).toEqual([32, 96]);
    for (let y = 0; y < 64; y++) for (let x = TALLO_X0 - 1; x <= TALLO_X1; x++) expect(doble.esOpaco(x, y), `doble (${x},${y})`).toBe(lisa.esOpaco(x, y % 32));
  });
});

describe('vidrio', () => {
  it('es transparente de verdad: el cristal deja ver el piso y a quien esté detrás', () => {
    const l = cuadro('vidrio@0101');
    let transparentes = 0;
    for (let y = 19; y < 60; y++) for (let x = 3; x < 29; x++) if (!l.esOpaco(x, y)) transparentes++;
    expect(transparentes).toBeGreaterThan(300);
  });

  it('el marco es de aluminio (rampa metal) y el cristal usa la rampa vidrio', () => {
    const colores = cuadro('vidrio@0101').colores();
    expect(colores.has(PALETA['metal-2'])).toBe(true);
    expect(colores.has(PALETA['vidrio-3'])).toBe(true);
  });

  it('en horizontal, los postes de unión caen en el borde del cuadro y empatan con el panel vecino', () => {
    const l = cuadro('vidrio@0101');
    for (let y = 16; y < PARED_ALTO; y++) expect(l.esOpaco(0, y), `poste y=${y}`).toBe(true);
  });
});
