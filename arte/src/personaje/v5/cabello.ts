/**
 * Los 12 peinados del catálogo v5. Formas para `pintarPelo` (masas, mechones, rizos) en las 3 vistas dibujadas: S frente, N espalda, I
 * perfil izquierdo (el derecho es el espejo). Coordenadas del lienzo de 32 x 64.
 *
 * PROPORCIÓN DE PERFIL (la de los perfiles del diseñador, archivos 15 y 16): domo de pelo de la columna 4 a la 24 y de la fila 28 a la 40,
 * redondo; el flequillo sobresale por delante de la frente, la masa cae recta por la nuca (columna 24) hasta la fila 40 y deja la nuca y la oreja
 * a la vista (oreja en columnas 20 a 22, filas 38 a 42); mechones en diagonal con brillo arriba a la izquierda y puntas oscuras.
 * Los peinados 1 a 6 ya estaban aprobados de frente y de espalda: se conservan sus vistas S y N y se redibuja el perfil con el domo.
 *
 *   1 despeinado oscuro de lado (el del diseñador, exacto de frente y de perfil)   2 flequillo largo recto   3 rizado corto   4 afro
 *   5 melena larga suelta   6 moño alto   7 corto clásico   8 rapado   9 rizos largos   10 trenzas   11 cola alta   12 largo ondulado
 *
 * `atras` es lo que cae DETRÁS del cuerpo (melena, trenzas, cola): va en la capa `atras` del catálogo.
 */

import { CAPAS_DISENADOR, PERFIL_P1 } from './disenador';
import type { Capa } from './disenador';
import { PEINADOS as PROPUESTA } from './peinados';
import type { Peinado, VistaPelo } from './peinados';
import { el, po, rampaPelo, tr } from './pelo';
import type { Forma, Pt } from './pelo';

export interface PeinadoCatalogo extends Omit<Peinado, 'vistas'> {
  vistas: Record<VistaPelo, { atras: Forma[]; frente: Forma[] }>;
  /** Capas exactas del diseñador (con su contorno) en vez de formas. */
  exactas?: Partial<Record<VistaPelo, Capa>>;
  /** Fila del lienzo desde la que el pelo es visible bajo un sombrero con ala (los sombreros cortan el pelo sobre `ocultaPeloSobre`). */
  etiquetas: string[];
}

const ES = (c: string): readonly string[] => rampaPelo(c);

/** Corona de rizos sobre un polígono (como en `peinados.ts`). */
function rizosEn(poligono: Pt[], paso: number, radio: number, semilla: number, excluir: (x: number, y: number) => boolean = () => false): Forma[] {
  const xs = poligono.map((p) => p[0]), ys = poligono.map((p) => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const dentro = (px: number, py: number): boolean => {
    let d = false;
    for (let i = 0, j = poligono.length - 1; i < poligono.length; j = i++) {
      const [xi, yi] = poligono[i]!, [xj, yj] = poligono[j]!;
      if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) d = !d;
    }
    return d;
  };
  const out: Forma[] = [];
  let fila = 0;
  for (let y = y0; y <= y1; y += paso * 0.86, fila++) {
    for (let x = x0 + (fila % 2 === 0 ? 0 : paso / 2); x <= x1; x += paso) {
      const j1 = Math.sin((x * 12.9898 + y * 78.233 + semilla) * 43758.5453) * 0.5;
      const j2 = Math.sin((x * 39.346 + y * 11.135 + semilla) * 24634.6345) * 0.5;
      const cx = x + (j1 - Math.floor(j1) - 0.5) * 1.2, cy = y + (j2 - Math.floor(j2) - 0.5) * 1.0;
      if (dentro(cx, cy) && !excluir(cx, cy)) out.push(el(cx, cy, radio, radio * 0.92, { rizo: true, brillo: 0.6 }));
    }
  }
  return out;
}

/** Cadena de elipses que baja zigzagueando: una trenza. `x` y `y0` arrancan arriba; `dir` es la oscilación lateral. */
function trenza(x: number, y0: number, largo: number, amp = 1.1, tono = 3): Forma[] {
  const out: Forma[] = [];
  for (let i = 0; i < largo; i++) {
    const y = y0 + i * 1.7;
    const cx = x + (i % 2 === 0 ? -amp : amp) * 0.55;
    out.push(el(cx, y, 1.9, 1.15, { brillo: 0.55, tono: i % 2 === 0 ? tono : tono - 1 }));
  }
  return out;
}

/** Los 6 de la propuesta, con sus vistas S y N y el perfil nuevo. */
const P = (id: string): Peinado => PROPUESTA.find((p) => p.id === id)!;

// ---------- 1. despeinado oscuro de lado: exacto de frente y de perfil ----------
const P1: PeinadoCatalogo = {
  ...P('p1'),
  etiquetas: ['despeinado', 'oscuro', 'corto'],
  exactas: { S: CAPAS_DISENADOR.pelo, I: PERFIL_P1.pelo },
};

// ---------- 2. flequillo largo recto ----------
const P2: PeinadoCatalogo = {
  ...P('p2'),
  etiquetas: ['flequillo', 'largo', 'recto'],
  vistas: {
    S: P('p2').vistas.S,
    N: P('p2').vistas.N,
    I: {
      atras: [
        po([[16, 37], [22, 33.5], [26, 38], [27, 45], [26, 51], [23, 53], [20, 50.5], [17, 52], [16, 46]], { brillo: 0.35 }),
        tr([[22, 38], [24, 44], [23.4, 50]], [3, 2.6, 1.2], { tono: 2 }),
      ],
      frente: [
        el(14.6, 34, 9.8, 6.2, { brillo: 0.55 }),
        po([[5.4, 36.5], [8, 32], [15, 29.4], [22, 30.6], [23.6, 36], [21.6, 40], [18.4, 38], [15.6, 40.8], [12, 39.4], [9.4, 41.6], [6.4, 40.2]], { brillo: 0.5 }),
        tr([[8, 33], [8, 38], [8.6, 42]], [3, 2.6, 1.2]),
        tr([[17, 31], [18.6, 36], [18.4, 41]], [3.4, 3, 1.2], { tono: 2 }),
        tr([[21.4, 32], [22.6, 38], [22.2, 44]], [3, 2.6, 1.2]),
      ],
    },
  },
};

// ---------- 3. rizado corto ----------
const P3: PeinadoCatalogo = {
  ...P('p3'),
  etiquetas: ['rizado', 'corto', 'rizos'],
  vistas: {
    S: P('p3').vistas.S,
    N: P('p3').vistas.N,
    I: {
      atras: [],
      frente: [
        el(14.6, 34, 9.2, 5.6, { brillo: 0.3 }),
        ...rizosEn([[7.4, 36.4], [7.8, 33], [9.6, 29.4], [13, 27.2], [18, 27.2], [22.4, 28.8], [24.6, 32.4], [25, 37], [24.6, 41.4], [22, 43], [20.6, 39.4], [18, 37.4], [14, 37.6], [11, 39], [8, 38.6]], 4.1, 3.0, 7, (x, y) => y > 38.4 && x < 13),
      ],
    },
  },
};

// ---------- 4. afro ----------
const P4: PeinadoCatalogo = {
  ...P('p4'),
  etiquetas: ['afro', 'rizado', 'volumen'],
  vistas: {
    S: P('p4').vistas.S,
    N: P('p4').vistas.N,
    I: {
      atras: [el(15.4, 34.4, 12.2, 10, { brillo: 0.2 })],
      frente: [...rizosEn((() => { const pts: [number, number][] = []; for (let i = 0; i < 28; i++) { const a = (i / 28) * Math.PI * 2; pts.push([15.4 + Math.cos(a) * 11.6, 34 + Math.sin(a) * 10]); } return pts; })(), 4.5, 3.3, 17, (x, y) => y > 37 && x < 14.4)],
    },
  },
};

// ---------- 5. melena larga suelta ----------
const P5: PeinadoCatalogo = {
  ...P('p5'),
  etiquetas: ['melena', 'largo', 'suelto'],
  vistas: {
    S: P('p5').vistas.S,
    N: P('p5').vistas.N,
    I: {
      atras: [po([[16, 36], [22, 33], [26.4, 38], [27.4, 46], [26.6, 54], [24, 52.4], [22, 56], [19.8, 51], [17.4, 44]], { brillo: 0.35 })],
      frente: [
        el(14.6, 34, 9.8, 6.2, { brillo: 0.55 }),
        tr([[9, 31], [7, 35], [6.4, 40]], [3.6, 3, 1.2]),
        tr([[19, 33], [20.2, 42], [20.6, 49], [20.2, 54]], [4, 3.6, 3, 1.4]),
        tr([[23, 35], [24.4, 44], [24, 52]], [3, 2.8, 1.2], { tono: 2 }),
        tr([[12, 31.4], [15.4, 30], [19, 31]], [3, 3, 2.4], { brillo: 0.7 }),
      ],
    },
  },
};

// ---------- 6. moño alto con mechones ----------
const P6: PeinadoCatalogo = {
  ...P('p6'),
  etiquetas: ['moño', 'recogido', 'alto'],
  vistas: {
    S: P('p6').vistas.S,
    N: P('p6').vistas.N,
    I: {
      atras: [],
      frente: [
        el(14.6, 34.2, 9.6, 5.9, { brillo: 0.5 }),
        po([[6, 37], [6.8, 33], [10, 29.6], [15, 28.2], [20.4, 29], [24.2, 32.6], [24.6, 38], [24, 42.6], [21.8, 39.4], [18.6, 36.6], [14, 36], [10, 37.6]], { brillo: 0.5 }),
        tr([[10, 32], [15, 29], [20, 26.4]], [3.4, 3, 2.6]),
        el(20.4, 24.4, 4.6, 4.1, { rizo: true, brillo: 0.7 }),
        tr([[19.4, 37.4], [20.6, 40.6], [21.4, 44]], [2.6, 2.4, 1.2]),
      ],
    },
  },
};

// ---------- 7. corto clásico (raya al lado) ----------
const C7 = '#4A3324';
const P7: PeinadoCatalogo = {
  id: 'p7', nombre: 'corto clásico', color: C7, rampa: ES(C7), etiquetas: ['corto', 'clasico', 'raya'],
  vistas: {
    S: {
      atras: [],
      frente: [
        el(16, 33.4, 9.9, 6.4, { brillo: 0.5 }),
        po([[7.2, 38.4], [6.6, 33.4], [9, 29.4], [13, 27.6], [19, 27.4], [23, 29.2], [25.4, 33.4], [24.8, 38.6], [23.6, 36.8], [21, 35], [16, 34.4], [11, 35.6], [8.6, 37.4]], { brillo: 0.5 }),
        tr([[8, 31], [12, 28.6], [18, 28]], [3.4, 3, 2.4], { brillo: 0.7 }),
        tr([[11, 35.6], [9, 37], [8, 39.6]], [3, 2.4, 1.2], { tono: 2 }),
        tr([[22.4, 35.4], [23.8, 37.6], [24.4, 40]], [3, 2.4, 1.2], { tono: 2 }),
        tr([[17, 28.4], [14, 31.6], [11.4, 35]], [2.2, 2, 1.2], { tono: 2 }),
      ],
    },
    N: {
      atras: [],
      frente: [
        el(16, 35.6, 10, 8.4, { brillo: 0.4 }),
        po([[7.4, 40], [6.8, 33.6], [9, 29.4], [13, 27.6], [19, 27.4], [23, 29.2], [25.4, 33.6], [25, 40], [23.2, 43.4], [19, 42.4], [16, 43.8], [13, 42.4], [9, 43.2]], { brillo: 0.45 }),
        tr([[10, 33], [9.6, 38], [10.4, 42]], [3, 2.6, 1.2], { tono: 2 }),
        tr([[16, 31], [16, 37], [16, 43]], [3, 2.6, 1.2]),
        tr([[22, 33], [22.4, 38], [21.6, 42]], [3, 2.6, 1.2], { tono: 2 }),
      ],
    },
    I: {
      atras: [],
      frente: [
        el(14.8, 34.4, 9, 5.8, { brillo: 0.5 }),
        po([[7, 37.4], [7.6, 33], [10.4, 29.4], [15, 28], [20, 28.6], [23.8, 31.6], [24.6, 36.4], [24.2, 41.6], [21.6, 41.8], [20.2, 37.6], [17.6, 35.4], [13, 35], [10, 36.8]], { brillo: 0.5 }),
        tr([[9, 33], [13, 29.6], [19, 28.6]], [3.4, 3, 2.4], { brillo: 0.7 }),
        tr([[19, 36], [19.6, 39], [19.2, 42]], [2.6, 2.4, 1.2], { tono: 2 }),
        tr([[8, 35.4], [8.4, 38], [9.8, 39.8]], [2.2, 2, 1.2]),
      ],
    },
  },
};

// ---------- 8. rapado ----------
const C8 = '#3A3340';
const P8: PeinadoCatalogo = {
  id: 'p8', nombre: 'rapado', color: C8, rampa: ES(C8), etiquetas: ['rapado', 'corto', 'militar'],
  vistas: {
    S: {
      atras: [],
      frente: [
        el(16, 34.6, 8.7, 5.9, { liso: false, brillo: 0.15, tono: 2 }),
        po([[8.2, 38], [7.6, 33.6], [10, 30.6], [14, 29.4], [18, 29.4], [22, 30.8], [24.2, 33.6], [23.8, 38], [22.6, 36], [19, 34.4], [16, 35.2], [13, 34.4], [9.6, 36]], { tono: 2, brillo: 0.2 }),
      ],
    },
    N: {
      atras: [],
      frente: [
        el(16, 36.4, 8.9, 7.6, { brillo: 0.15, tono: 2 }),
        po([[8.2, 41], [7.8, 34], [10, 30.4], [14, 29.4], [18, 29.4], [22, 30.6], [24.4, 34], [24, 41], [22, 43], [16, 44], [10, 43]], { tono: 2, brillo: 0.15 }),
      ],
    },
    I: {
      atras: [],
      frente: [
        el(15.6, 35, 8.2, 5.8, { brillo: 0.15, tono: 2 }),
        po([[8.4, 37.6], [9, 34], [11.6, 30.6], [16, 29.4], [20.6, 30.4], [23.2, 33.6], [23.8, 38.4], [23.4, 42], [21, 41.8], [19.8, 38], [17, 35.6], [13, 35.2], [10.4, 36.6]], { tono: 2, brillo: 0.2 }),
      ],
    },
  },
};

// ---------- 9. rizos largos ----------
const C9 = '#7A4A2A';
const rizosLargosS = (): Forma[] => [
  ...rizosEn([[6.6, 40], [6, 33.4], [8.6, 29.4], [12, 27], [18, 26.6], [22.6, 28.6], [25.6, 32.6], [26, 40], [25.6, 47], [26.4, 52], [23.6, 53.4], [22.6, 47], [22.4, 40], [20, 37], [16, 36.2], [12, 37], [9.8, 40], [9.4, 47], [8.4, 53.4], [5.6, 52], [6.4, 47]], 4.4, 3.1, 31, (x, y) => y > 37.4 && x > 10 && x < 22),
];
const P9: PeinadoCatalogo = {
  id: 'p9', nombre: 'rizos largos', color: C9, rampa: ES(C9), etiquetas: ['rizos', 'largo', 'rizado'],
  vistas: {
    S: { atras: [], frente: [el(16, 33, 9.8, 6.4, { brillo: 0.3 }), ...rizosLargosS()] },
    N: {
      atras: [],
      frente: [
        el(16, 38, 10.4, 11.4, { brillo: 0.3 }),
        ...rizosEn([[6.6, 40], [6, 33.4], [8.6, 29.4], [12, 27], [18, 26.6], [22.6, 28.6], [25.6, 32.6], [26, 40], [26.4, 47], [25.6, 53.4], [20, 55.4], [16, 55], [12, 55.4], [6.4, 53.4], [5.6, 47]], 4.4, 3.1, 33),
      ],
    },
    I: {
      atras: [],
      frente: [
        el(14.6, 34, 9.3, 5.8, { brillo: 0.3 }),
        ...rizosEn([[6.4, 36.4], [6.8, 33], [9, 29.4], [13, 27.2], [18, 27.2], [22.4, 28.8], [25, 32.4], [26.4, 38], [27, 46], [26.4, 53.4], [22, 54.6], [19, 49], [18, 42], [15, 38], [11, 39], [8, 38.6]], 4.3, 3.1, 35, (x, y) => y > 38.4 && x < 14),
      ],
    },
  },
};

// ---------- 10. trenzas ----------
const C10 = '#2F2A38';
const P10: PeinadoCatalogo = {
  id: 'p10', nombre: 'trenzas', color: C10, rampa: ES(C10), etiquetas: ['trenzas', 'largo', 'recogido'],
  vistas: {
    S: {
      atras: [],
      frente: [
        el(16, 33.2, 9.9, 6.4, { brillo: 0.5 }),
        po([[7.2, 38.4], [6.6, 33.4], [9, 29.4], [13, 27.6], [19, 27.4], [23, 29.2], [25.4, 33.4], [24.8, 38.6], [23, 36], [16, 34.4], [9, 36]], { brillo: 0.5 }),
        tr([[16, 28], [16, 31], [15.6, 34]], [1.6, 1.4, 1.2], { tono: 1, liso: true }),
        tr([[9, 30], [11, 33], [12, 36]], [2.4, 2.2, 1.2], { tono: 2 }),
        tr([[22, 30], [20, 33], [19, 36]], [2.4, 2.2, 1.2], { tono: 2 }),
        ...trenza(7.4, 38, 8), ...trenza(24.6, 38, 8),
        el(7.4, 52.4, 1.3, 1.4, { liso: true, tono: 4 }), el(24.6, 52.4, 1.3, 1.4, { liso: true, tono: 4 }),
      ],
    },
    N: {
      atras: [],
      frente: [
        el(16, 35.6, 10, 8.4, { brillo: 0.4 }),
        po([[7.4, 40], [6.8, 33.6], [9, 29.4], [13, 27.6], [19, 27.4], [23, 29.2], [25.4, 33.6], [25, 40], [23.2, 43.4], [16, 44.2], [9, 43.2]], { brillo: 0.45 }),
        tr([[16, 28], [16, 36], [16, 43]], [1.6, 1.4, 1.2], { tono: 1, liso: true }),
        ...trenza(12.4, 42, 8), ...trenza(19.6, 42, 8),
        el(12.4, 56.4, 1.3, 1.4, { liso: true, tono: 4 }), el(19.6, 56.4, 1.3, 1.4, { liso: true, tono: 4 }),
      ],
    },
    I: {
      atras: [],
      frente: [
        el(14.6, 34, 9.3, 5.9, { brillo: 0.5 }),
        po([[6.4, 37], [7.4, 33], [10.4, 29.4], [15, 28.2], [20, 28.8], [23.8, 32], [24.6, 37.4], [24.6, 41.4], [21.4, 39], [18, 36.4], [13, 35.6], [9.6, 37]], { brillo: 0.5 }),
        tr([[10, 31], [12, 33], [13, 36]], [2.4, 2.2, 1.2], { tono: 2 }),
        ...trenza(23.2, 40, 8), el(23.2, 54.4, 1.3, 1.4, { liso: true, tono: 4 }),
      ],
    },
  },
};

// ---------- 11. cola alta ----------
const C11 = '#C2813B';
const P11: PeinadoCatalogo = {
  id: 'p11', nombre: 'cola alta', color: C11, rampa: ES(C11), etiquetas: ['cola', 'recogido', 'alto'],
  vistas: {
    S: {
      atras: [],
      frente: [
        el(16, 33.4, 9.9, 6.2, { brillo: 0.6 }),
        po([[7.2, 38], [6.6, 33.4], [9, 29.6], [13, 27.8], [19, 27.8], [23, 29.4], [25.4, 33.4], [24.8, 38], [23.2, 35], [16, 34.4], [8.8, 35.4]], { brillo: 0.55 }),
        tr([[9, 31], [13, 28.6], [19, 28]], [3.4, 3, 2.4], { brillo: 0.8 }),
        tr([[8, 35], [8.4, 38], [9, 40]], [2.6, 2.2, 1.2], { tono: 2 }),
        tr([[24, 35], [23.6, 38], [23, 40]], [2.6, 2.2, 1.2], { tono: 2 }),
        // la cola asoma por encima de la cabeza
        po([[12.4, 28], [14, 24.4], [18, 24.4], [19.6, 28]], { brillo: 0.6 }),
        tr([[16, 27.6], [16, 25.4]], [2.4, 2.4], { tono: 4, liso: true, punta: false }),
      ],
    },
    N: {
      atras: [],
      frente: [
        el(16, 35.4, 10, 8.2, { brillo: 0.5 }),
        po([[7.4, 40], [6.8, 33.6], [9, 29.6], [13, 27.8], [19, 27.8], [23, 29.4], [25.4, 33.6], [25, 40], [23, 43.2], [16, 44], [9, 43]], { brillo: 0.5 }),
        tr([[16, 27], [15.4, 33], [16, 40], [15.6, 47], [16.4, 52], [15.6, 55]], [4.6, 4.8, 4.4, 4, 3, 1.4], { brillo: 0.6 }),
        tr([[13.6, 29], [13.4, 38], [13.8, 48]], [2.2, 2.4, 1.2], { tono: 2 }),
        tr([[18.4, 29], [18.8, 38], [18.2, 48]], [2.2, 2.4, 1.2], { tono: 2 }),
        el(16, 27.6, 3.6, 1.5, { liso: true, tono: 1 }),
      ],
    },
    I: {
      atras: [],
      frente: [
        el(14.8, 34.2, 9.4, 6, { brillo: 0.6 }),
        po([[6.6, 37], [7.6, 33], [10.4, 29.6], [15, 28.4], [20, 29], [23.8, 32.4], [24.6, 37.6], [24, 41], [21.6, 38.4], [17.6, 36], [13, 35.6], [9.6, 37]], { brillo: 0.55 }),
        tr([[10, 32], [14, 29.4], [19, 29]], [3.4, 3, 2.4], { brillo: 0.8 }),
        // cola: nace atrás y arriba y cae curvada
        tr([[22, 29.6], [25, 29.4], [26.6, 33], [26.4, 38.4], [25.4, 44]], [3.6, 4, 3.8, 3.2, 1.4], { brillo: 0.6 }),
        tr([[23.6, 31], [26, 32.6], [26.2, 38]], [2.2, 2, 1.2], { tono: 2 }),
        el(23.4, 29.8, 1.8, 2.2, { liso: true, tono: 1 }),
      ],
    },
  },
};

// ---------- 12. largo ondulado ----------
const C12 = '#B07644';
const onda = (x0: number, y0: number, y1: number, amp: number, w: number, fase = 0): Pt[] => {
  const pts: Pt[] = [];
  for (let y = y0; y <= y1; y += 2) pts.push([x0 + Math.sin((y - y0) * 0.9 + fase) * amp, y]);
  return pts;
};
const P12: PeinadoCatalogo = {
  id: 'p12', nombre: 'largo ondulado', color: C12, rampa: ES(C12), etiquetas: ['largo', 'ondulado', 'suelto'],
  vistas: {
    S: {
      atras: [
        po([[7, 36], [5, 42], [4.6, 49], [5.6, 55], [7.4, 53], [9.2, 56], [10.6, 50], [10.4, 38]], { brillo: 0.35 }),
        po([[25, 36], [27, 42], [27.4, 49], [26.4, 55], [24.6, 53], [22.8, 56], [21.4, 50], [21.6, 38]], { brillo: 0.35 }),
      ],
      frente: [
        el(16, 33, 9.9, 6.6, { brillo: 0.6 }),
        tr([[16, 28], [14, 31], [10, 35], [8.4, 41]], [2.4, 3.4, 3.2, 1.4], { tono: 2 }),
        tr([[16, 28], [18, 31], [22, 35], [23.6, 41]], [2.4, 3.4, 3.2, 1.4], { tono: 3 }),
        tr(onda(8.6, 36, 52, 1.1, 3.8), [3.8, 3.6, 3.2, 2.6, 1.4], { brillo: 0.6 }),
        tr(onda(23.2, 36, 52, 1.1, 3.8, 1.6), [3.8, 3.6, 3.2, 2.6, 1.4], { tono: 2, brillo: 0.5 }),
        tr(onda(6.8, 38, 50, 0.9, 2.6, 0.8), [2.6, 2.4, 1.2], { tono: 2 }),
        tr(onda(25, 38, 50, 0.9, 2.6, 2.4), [2.6, 2.4, 1.2], { tono: 2 }),
      ],
    },
    N: {
      atras: [],
      frente: [
        po([[7.4, 38], [6.8, 33], [9, 29.6], [13, 27.8], [19, 27.8], [23, 29.4], [25.4, 33], [26, 40], [26.6, 47], [26, 54], [24, 56], [22, 53.4], [20, 56.2], [18, 53.6], [16, 56.4], [14, 53.6], [12, 56.2], [10, 53.4], [8, 56], [6.6, 54], [6.4, 47], [6.6, 40]], { brillo: 0.5 }),
        tr(onda(10.6, 34, 53, 1.1, 3.4), [3.4, 3.2, 1.4], { tono: 2 }),
        tr(onda(16, 32, 54, 1.2, 3.4, 1.5), [3.4, 3.2, 1.4], { tono: 3 }),
        tr(onda(21.4, 34, 53, 1.1, 3.4, 3), [3.4, 3.2, 1.4], { tono: 2 }),
      ],
    },
    I: {
      atras: [po([[16, 36], [22, 33], [26.4, 38], [27.6, 46], [27, 54], [24.8, 52.4], [22.6, 56], [20.4, 51.4], [18, 44]], { brillo: 0.35 })],
      frente: [
        el(14.6, 34, 9.8, 6.2, { brillo: 0.6 }),
        tr(onda(8, 33, 45, 1.0, 3.4), [3.4, 3, 1.2], { tono: 2 }),
        tr(onda(19.6, 34, 53, 1.2, 4), [4, 3.8, 3.2, 1.4], { brillo: 0.6 }),
        tr(onda(23.6, 36, 52, 1.0, 3), [3, 2.8, 1.2], { tono: 2 }),
        tr([[12, 31.4], [15.4, 29.8], [19, 30.6]], [3, 3, 2.4], { brillo: 0.8 }),
      ],
    },
  },
};

export const CABELLOS: PeinadoCatalogo[] = [P1, P2, P3, P4, P5, P6, P7, P8, P9, P10, P11, P12];
