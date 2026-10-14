/**
 * Las 12 mascotas, todas originales: 8 animales comunes (gato, perro, conejo, búho, pollito, panda, rana, zorro) y
 * 4 criaturas inventadas (dragoncito, nube, hongo, fantasmita). Cada una se define con el esqueleto de `ctx.ts`
 * más sus piezas propias. `accA` es el color principal y `accB` el secundario (panza, interior de orejas, lunares).
 */

import { Ctx, chibi } from './ctx';
import type { Cfg, NumCuadro, Vista } from './ctx';
import { BLANCO, NARANJA, NARANJA_OSC, NARANJA_PROF, Pincel, ROSA, ROSA_OSC, TINTA, cadena, elipse, inter, mat, poligono, rectangulo, resta, union } from './pincel';

export interface DefMascota {
  id: string;
  nombre: string;
  descripcion: string;
  grupo: 'animales' | 'fantasticas';
  dibujar: (v: Vista, f: NumCuadro) => Pincel;
}

const sub = (f: NumCuadro): number => [0, -1, 1, 0][f] ?? 0;
const hoc = (c: Ctx, dx = 0, dy = 4): [number, number] => [Math.round(c.hx - 0.5 + dx), Math.round(c.hy + dy)];

// ---------- gato ----------
const gato: Cfg = {
  cab: { rx: 9, ry: 7.5, cy: 10.8 },
  cue: { rx: 6, ry: 4.6, cy: 18 },
  vientre: { rx: 3.6, ry: 2.8 },
  atras(c) {
    const w = sub(c.f);
    const ty = c.sentado ? 21 : 19.5;
    if (c.E) c.cola([[c.bx - 6.5, ty], [c.bx - 8.5, ty - 3 + w], [c.bx - 8, ty - 6 + w]], 1.6);
    else c.cola([[17.5, ty], [20, ty - 1.5 + w], [20.8, ty - 4.5 + w]], 1.7);
  },
  orejas(c) {
    const o = c.o;
    if (c.E) {
      c.poli([[c.hx + 1, 5.5 + o], [c.hx + 3.4, 0.4 + o], [c.hx + 6.4, 5 + o]], 'accA', { tono: -1 });
      c.poli([[c.hx - 6, 6.2 + o], [c.hx - 4.6, 0 + o], [c.hx + 0.2, 4 + o]], 'accA');
      c.poli([[c.hx - 4.8, 5.4 + o], [c.hx - 4.4, 2.4 + o], [c.hx - 1.8, 4.4 + o]], 'accB', { contorno: false, plano: true });
      return;
    }
    c.par((X) => {
      c.poli([[X(3.2), 6.8 + o], [X(4.2), 0.2 + o], [X(10), 3.8 + o]], 'accA');
      if (!c.N) c.poli([[X(4.9), 5.6 + o], [X(5.2), 2.4 + o], [X(8), 4.4 + o]], 'accB', { contorno: false, plano: true });
    });
  },
  rostro(c) {
    if (c.N) {
      c.p.pxs([[10, c.hy - 5], [11, c.hy - 6], [12, c.hy - 6], [13, c.hy - 5]], mat('accA', 1));
      return;
    }
    c.sobreCabeza(elipse(c.hx + (c.E ? 3.2 : 0), c.hy + 4.6, c.E ? 3.6 : 3.8, 2.6), 'accB', { tono: 1 });
    c.sobreCabeza(elipse(c.hx, c.hy - 6, 2.6, 1.8), 'accA', { tono: -1 });
  },
  frente(c) {
    if (c.N) return;
    const [nx, ny] = hoc(c, 0, 3.6);
    if (c.E) {
      c.p.pxs([[20, ny], [21, ny]], ROSA_OSC);
      c.p.pxs([[19, ny + 2], [20, ny + 2]], TINTA);
    } else {
      c.p.pxs([[nx, ny], [nx + 1, ny]], ROSA_OSC);
      c.p.pxs([[nx - 1, ny + 1], [nx, ny + 2], [nx + 1, ny + 2], [nx + 2, ny + 1]], TINTA);
    }
  },
};

// ---------- perro ----------
const perro: Cfg = {
  cab: { rx: 9, ry: 7.5, cy: 10.8 },
  cue: { rx: 6.2, ry: 4.6, cy: 18 },
  vientre: { rx: 3.4, ry: 2.6, tono: 1 },
  atras(c) {
    const w = sub(c.f);
    const ty = c.sentado ? 21 : 19.5;
    if (c.E) c.cola([[c.bx - 6.5, ty - 1], [c.bx - 8.2, ty - 3 + w]], 1.6, 'accA', { tono: -1 });
    else c.cola([[18.5 + w, ty], [20.2 + w, ty - 2]], 1.6, 'accA', { tono: -1 });
  },
  rostro(c) {
    if (c.N) return;
    // Mancha de un ojo y hocico claro.
    if (c.E) {
      c.sobreCabeza(elipse(c.hx + 3.5, c.hy + 2, 3.2, 3.2), 'accB');
      c.sobreCabeza(elipse(c.hx + 5.5, c.hy + 4.6, 4, 2.8), 'accA', { tono: 1 });
    } else {
      c.sobreCabeza(elipse(c.hx + 3.2, c.hy + 2.6, 3, 3.4), 'accB');
      c.sobreCabeza(elipse(c.hx, c.hy + 4.8, 4.2, 2.8), 'accA', { tono: 1 });
    }
  },
  frente(c) {
    // Orejas caídas sobre los costados de la cabeza.
    if (c.E) {
      c.llenar(elipse(c.hx - 2, c.hy + 0.5, 2.8, 5), 'accB', { tono: -1 });
    } else {
      c.par((X) => c.llenar(elipse(X(3.4), c.hy + 0.5, 2.6, 5), 'accB', { tono: -1 }));
    }
    if (c.N) return;
    const [nx, ny] = hoc(c, 0, 3.8);
    if (c.E) {
      c.p.pxs([[21, ny], [21, ny + 1], [20, ny]], TINTA);
      if (!c.sentado) c.p.px(19, ny + 3, ROSA_OSC);
    } else {
      c.p.pxs([[nx, ny], [nx + 1, ny], [nx, ny + 1], [nx + 1, ny + 1]], TINTA);
      if (!c.sentado) c.p.pxs([[nx + 1, ny + 3], [nx + 1, ny + 4]], ROSA_OSC);
    }
  },
};

// ---------- conejo ----------
const conejo: Cfg = {
  cab: { rx: 8.4, ry: 7, cy: 13 },
  cue: { rx: 5.8, ry: 4.2, cy: 18.6 },
  vientre: { rx: 3.2, ry: 2.4 },
  atras(c) {
    if (c.E) c.llenar(elipse(c.bx - 7, c.sentado ? 20.8 : 19.5, 2.4, 2.4), 'accB', { tono: 1, brillo: true });
  },
  cuerpo(c) {
    if (c.N) c.llenar(elipse(11.5, c.sentado ? 20.6 : 20, 3.2, 2.6), 'accB', { tono: 1, brillo: true });
  },
  orejas(c) {
    const o = c.o;
    if (c.E) {
      c.cola([[c.hx + 1.5, 7.5 + o], [c.hx + 0.2, 4 + o], [c.hx - 0.8, 1.4 + o]], 2, 'accA', { tono: -1 });
      c.cola([[c.hx - 1.5, 8 + o], [c.hx - 3.2, 4.4 + o], [c.hx - 4.5, 1.8 + o]], 2.2);
      c.sobreCabeza(elipse(0, 0, 0.1, 0.1), 'accB');
      c.p.pxs([[c.hx - 3.4, 4 + o], [c.hx - 3.8, 3 + o], [c.hx - 2.6, 5 + o]], '#F4A09C');
      return;
    }
    c.par((X) => {
      c.llenar(elipse(X(7.6), 5.6 + o, 2.5, 5.4), 'accA');
      if (!c.N) c.llenar(elipse(X(7.6), 6 + o, 1, 3.4), 'accB', { contorno: false, plano: true });
    });
  },
  frente(c) {
    if (c.N) return;
    const [nx, ny] = hoc(c, 0, 3.4);
    if (c.E) {
      c.p.pxs([[c.hx + 6.5, ny], [c.hx + 7.5, ny]], ROSA_OSC);
      c.p.pxs([[c.hx + 6, ny + 2], [c.hx + 6, ny + 3]], BLANCO);
    } else {
      c.p.pxs([[nx, ny], [nx + 1, ny]], ROSA_OSC);
      c.p.pxs([[nx, ny + 1], [nx + 1, ny + 1]], BLANCO);
      c.p.pxs([[nx, ny + 2], [nx + 1, ny + 2]], BLANCO);
      c.p.pxs([[nx - 1, ny + 1], [nx + 2, ny + 1], [nx - 1, ny + 2], [nx + 2, ny + 2], [nx, ny + 3], [nx + 1, ny + 3]], TINTA);
    }
  },
};

// ---------- búho ----------
const buho: Cfg = {
  cab: { rx: 8.6, ry: 8, cy: 10.6 },
  cue: { rx: 7.2, ry: 5.6, cy: 17.4 },
  vientre: { rx: 4.4, ry: 3.6, dy: 1 },
  pies: { fijo: NARANJA, rx: 2.2 },
  orejas(c) {
    const o = c.o;
    if (c.E) {
      c.poli([[c.hx - 5.5, 5 + o], [c.hx - 4.8, 0.8 + o], [c.hx - 0.5, 3.5 + o]], 'accA', { tono: -1 });
      c.poli([[c.hx + 0.5, 4 + o], [c.hx + 2.6, 1 + o], [c.hx + 4.8, 4.5 + o]], 'accA', { tono: -1 });
      return;
    }
    c.par((X) => c.poli([[X(3.6), 5.5 + o], [X(3.6), 1 + o], [X(8.4), 3.8 + o]], 'accA', { tono: -1 }));
  },
  cuerpo(c) {
    const w = c.f === 1 ? -1 : c.f === 2 ? 1 : 0;
    if (c.N) c.llenar(elipse(c.bx, c.by - 0.5, c.cueRx - 1, c.cueRy - 0.6), 'accA', { tono: -1 });
    else if (c.E) c.llenar(elipse(c.bx - 0.5, c.by - 0.4 + (c.f === 0 ? 0 : -w * 0.5), 3.4, 3.6), 'accA', { tono: -1 });
    else {
      c.llenar(elipse(4.6, c.by - 0.6 + (w === -1 ? -1 : 0), 2.2, 3.6), 'accA', { tono: -1 });
      c.llenar(elipse(18.4, c.by - 0.6 + (w === 1 ? -1 : 0), 2.2, 3.6), 'accA', { tono: -1 });
    }
    if (!c.N && !c.E) c.p.pxs([[10, c.by - 1], [13, c.by - 1], [11, c.by + 0.5], [12, c.by + 0.5], [9, c.by + 1.5], [14, c.by + 1.5]], mat('accB', 1));
  },
  rostro(c) {
    if (c.N) return;
    const y = c.hy + 1.6;
    if (c.sentado) {
      // Dormido: ojos cerrados sobre el disco facial.
      if (c.E) c.p.pxs([[c.hx + 3.5, y], [c.hx + 4.5, y], [c.hx + 5.5, y]], TINTA);
      else c.p.pxs([[6, y], [7, y], [8, y], [15, y], [16, y], [17, y]], TINTA);
      return;
    }
    if (c.E) {
      c.llenar(elipse(c.hx + 3.8, y, 3, 3), 'accB', { fijo: BLANCO, contornoFijo: TINTA });
      c.p.pxs([[c.hx + 4.5, y - 0.5], [c.hx + 5.5, y - 0.5], [c.hx + 4.5, y + 0.5], [c.hx + 5.5, y + 0.5]], TINTA);
      c.p.px(c.hx + 4.5, y - 0.5, BLANCO);
    } else {
      c.par((X) => {
        c.llenar(elipse(X(7.7), y, 3.1, 3.1), 'accB', { fijo: BLANCO, contornoFijo: TINTA });
        const px = X(7.7) < 11.5 ? 7.7 : 15.3;
        c.p.pxs([[px - 0.5 + 0.1, y - 0.6], [px + 0.6, y - 0.6], [px - 0.4, y + 0.5], [px + 0.6, y + 0.5]], TINTA);
        c.p.px(px - 0.4, y - 0.6, BLANCO);
      });
    }
  },
  ojos: false,
  frente(c) {
    if (c.N) return;
    const [nx, ny] = hoc(c, 0, 4.4);
    if (c.E) {
      c.p.pxs([[21, ny], [22, ny]], NARANJA);
      c.p.pxs([[21, ny + 1]], NARANJA_OSC);
    } else {
      c.p.pxs([[nx, ny], [nx + 1, ny]], NARANJA);
      c.p.pxs([[nx, ny + 1], [nx + 1, ny + 1]], NARANJA_OSC);
    }
  },
};

// ---------- pollito ----------
const pollito: Cfg = {
  cab: { rx: 9.2, ry: 8.6, cy: 12.6 },
  cue: { rx: 1, ry: 1, cy: 20 },
  sinCuerpo: true,
  baja: 2.4,
  pies(c) {
    const lev = (l: 'i' | 'd'): number => c.alza(l);
    const pata = (x: number, l: number): void => {
      c.p.pxs([[x, 21 - l], [x, 22 - l]], NARANJA_OSC);
      c.p.pxs([[x - 1, 23 - l], [x, 23 - l], [x + 1, 23 - l]], NARANJA);
    };
    if (c.sentado) return;
    if (c.E) {
      pata(Math.round(c.hx - 2), lev('i'));
      pata(Math.round(c.hx + 3), lev('d'));
    } else {
      pata(8, lev('i'));
      pata(15, lev('d'));
    }
  },
  orejas(c) {
    const o = c.o;
    if (c.E) {
      c.llenar(elipse(c.hx - 1.8, 3.4 + o, 1.7, 2.7), 'accA');
      c.llenar(elipse(c.hx + 1, 3.8 + o, 1.7, 2.4), 'accA');
      return;
    }
    c.llenar(elipse(10.2, 3.4 + o, 1.7, 2.7), 'accA');
    c.llenar(elipse(13.2, 3.8 + o, 1.7, 2.4), 'accA');
  },
  rostro(c) {
    c.sobreCabeza(elipse(c.hx + (c.E ? 1.5 : 0), c.hy + 6, 5.5, 3), 'accA', { tono: 1 });
  },
  ojos: { dy: -0.5, sep: 3, ladoDx: 3.4 },
  frente(c) {
    const w = c.f === 1 ? -1 : c.f === 2 ? 1 : 0;
    if (c.E) {
      c.llenar(elipse(c.hx - 3.2, c.hy + 3.4 + (c.sentado ? 0 : w * 0.5), 2.6, 2.4), 'accB');
    } else if (!c.N) {
      c.llenar(elipse(3.4, c.hy + 3.4 + (w === -1 ? -1 : 0), 1.9, 3), 'accB');
      c.llenar(elipse(19.6, c.hy + 3.4 + (w === 1 ? -1 : 0), 1.9, 3), 'accB');
    } else {
      c.llenar(elipse(11.5, c.hy + 3, 4.2, 3), 'accB', { contorno: false, plano: true });
    }
    if (c.N) return;
    const [nx, ny] = hoc(c, 0, c.sentado ? 3 : 3);
    if (c.E) {
      c.p.pxs([[21, ny], [22, ny], [21, ny + 1]], NARANJA);
      c.p.px(22, ny + 1, NARANJA_OSC);
    } else {
      c.p.pxs([[nx - 1, ny], [nx, ny], [nx + 1, ny], [nx + 2, ny]], NARANJA);
      c.p.pxs([[nx, ny + 1], [nx + 1, ny + 1]], NARANJA_OSC);
    }
  },
};

// ---------- panda ----------
const panda: Cfg = {
  cab: { rx: 9, ry: 7.5, cy: 10.8 },
  cue: { rx: 6.4, ry: 4.8, cy: 18 },
  pies: { slot: 'accB', tono: 0 },
  vientre: { rx: 4, ry: 2.8, tono: 1 },
  orejas(c) {
    const o = c.o;
    if (c.E) {
      c.llenar(elipse(c.hx - 3.2, 4.4 + o, 2.7, 2.7), 'accB');
      c.llenar(elipse(c.hx + 2.6, 4.4 + o, 2.5, 2.5), 'accB', { tono: -1 });
      return;
    }
    c.par((X) => c.llenar(elipse(X(5), 4.4 + o, 2.8, 2.8), 'accB'));
  },
  cuerpo(c) {
    // Brazos negros.
    if (c.E) c.llenar(elipse(c.bx + 0.5, c.by + (c.f === 1 ? 0.5 : 0), 2.4, 3.3), 'accB');
    else c.par((X) => c.llenar(elipse(X(4.4), c.by + 0.2 + (X(0) === 0 ? (c.f === 1 ? 1 : 0) : c.f === 2 ? 1 : 0), 2.2, 3.4), 'accB'));
  },
  rostro(c) {
    if (c.N) return;
    const y = c.hy + 2.7;
    if (c.E) c.llenar(elipse(c.hx + 4.1, y, 2.5, 3.2), 'accB', { contorno: false, plano: true });
    else c.par((X) => c.sobreCabeza(elipse(X(8.5), y, 2.5, 3.1), 'accB'));
  },
  ojos: { rubor: false, claros: true },
  frente(c) {
    if (c.N) return;
    const [nx, ny] = hoc(c, 0, 5);
    if (c.E) c.p.pxs([[21, ny - 0], [20, ny]], TINTA);
    else {
      c.p.pxs([[nx, ny], [nx + 1, ny]], TINTA);
      c.p.pxs([[nx - 1, ny + 1], [nx + 2, ny + 1]], TINTA);
    }
  },
};

// ---------- rana ----------
const rana: Cfg = {
  cab: { rx: 9.6, ry: 6, cy: 13.6 },
  cue: { rx: 5.8, ry: 4, cy: 18.8 },
  sep: 4.6,
  pies: { rx: 2.8 },
  vientre: { rx: 3.8, ry: 2.4, dy: 0.8 },
  orejas(c) {
    const o = c.o;
    if (c.E) {
      c.llenar(elipse(c.hx - 1.5, 7.2 + o, 3, 3), 'accA');
      return;
    }
    c.par((X) => c.llenar(elipse(X(6.6), 7.2 + o, 3.1, 3.1), 'accA', { brillo: true }));
  },
  ojos: { y: 6, sep: 5, alto: 3, rubor: false, ladoDx: -1 },
  frente(c) {
    if (c.N) return;
    const y = Math.round(c.hy + 1.6);
    if (c.E) {
      c.p.pxs([[c.hx + 0, y], [c.hx + 1, y + 1], [c.hx + 2, y + 1], [c.hx + 3, y + 1], [c.hx + 4, y + 1], [c.hx + 5, y + 1], [c.hx + 6, y + 1], [c.hx + 7, y]], TINTA);
      c.p.px(c.hx + 6, y - 2, ROSA);
    } else {
      c.p.pxs([[6, y], [7, y + 1], [8, y + 1], [9, y + 1], [10, y + 1], [13, y + 1], [14, y + 1], [15, y + 1], [16, y + 1], [17, y], [11, y + 1], [12, y + 1]], TINTA);
      c.p.pxs([[10, y - 2], [13, y - 2]], '#25252B');
      c.p.pxs([[4, y - 1], [19, y - 1]], ROSA);
    }
  },
};

// ---------- zorro ----------
const zorro: Cfg = {
  cab: { rx: 9.3, ry: 7, cy: 11 },
  cue: { rx: 5.8, ry: 4.5, cy: 18.2 },
  vientre: { rx: 3.2, ry: 2.6 },
  atras(c) {
    const w = sub(c.f);
    const base = c.sentado ? 21.5 : 20;
    if (c.E) {
      const t = cadena([[c.bx - 5, base], [c.bx - 7.5, base - 2 + w], [c.bx - 8.5, base - 5.5 + w]], [2.2, 2.8, 2.6]);
      c.llenar(t, 'accA');
      c.p.llenar(inter(t, elipse(c.bx - 8.4, base - 6.8 + w, 3.4, 2.4)), 'accB', { contorno: false, plano: true });
    } else if (!c.N) {
      const t = cadena([[16.5, base], [20, base - 2 + w], [21.2, base - 6 + w]], [2.2, 2.6, 2.4]);
      c.llenar(t, 'accA');
      c.p.llenar(inter(t, elipse(21.2, base - 7.4 + w, 3, 2.4)), 'accB', { contorno: false, plano: true });
    }
  },
  cuerpo(c) {
    if (!c.N) return;
    const t = cadena([[11.5, c.by - 1], [11.5, c.by + 3]], [3.3, 3.5]);
    c.llenar(t, 'accA');
    c.p.llenar(inter(t, elipse(11.5, c.by + 4.4, 4, 2)), 'accB', { contorno: false, plano: true });
  },
  orejas(c) {
    const o = c.o;
    if (c.E) {
      c.poli([[c.hx + 1.4, 5 + o], [c.hx + 3.6, 0 + o], [c.hx + 6.5, 5 + o]], 'accA', { tono: -1 });
      c.poli([[c.hx - 6.4, 6 + o], [c.hx - 4.4, -0.4 + o], [c.hx + 0.6, 4 + o]], 'accA');
      c.p.pxs([[c.hx - 4.4, 1 + o], [c.hx - 4.4, 2 + o], [c.hx - 3.4, 2 + o]], mat('accA', 1));
      return;
    }
    c.par((X) => {
      c.poli([[X(3), 6.8 + o], [X(4.2), -0.3 + o], [X(10.4), 3.8 + o]], 'accA');
      if (!c.N) c.poli([[X(4.9), 5.5 + o], [X(5.3), 2.2 + o], [X(8), 4.4 + o]], 'accB', { contorno: false, plano: true, tono: -1 });
    });
  },
  rostro(c) {
    if (c.N) return;
    if (c.E) c.sobreCabeza(elipse(c.hx + 3, c.hy + 5, 6.5, 3), 'accB');
    else c.sobreCabeza(elipse(c.hx, c.hy + 5.4, 8.6, 3.4), 'accB');
  },
  frente(c) {
    if (c.N) return;
    const [nx, ny] = hoc(c, 0, 3.8);
    if (c.E) {
      c.p.pxs([[21, ny], [22, ny], [21, ny + 1]], TINTA);
    } else {
      c.p.pxs([[nx, ny], [nx + 1, ny]], TINTA);
      c.p.pxs([[nx - 1, ny + 2], [nx + 2, ny + 2], [nx, ny + 3], [nx + 1, ny + 3]], TINTA);
    }
  },
};

// ---------- dragoncito ----------
const dragon: Cfg = {
  cab: { rx: 8.6, ry: 7.2, cy: 11.2 },
  cue: { rx: 6, ry: 4.7, cy: 18.3 },
  vientre: { rx: 3.6, ry: 3, tono: 0 },
  atras(c) {
    const w = sub(c.f);
    const base = c.sentado ? 21.5 : 20;
    if (c.E) {
      c.cola([[c.bx - 6, base], [c.bx - 8.5, base - 1.6 + w], [c.bx - 10, base - 4 + w]], [1.9, 1.7, 1.4], 'accA');
      c.poli([[c.bx - 10, base - 6.4 + w], [c.bx - 8.2, base - 3.4 + w], [c.bx - 11.4, base - 3.2 + w]], 'accB');
      // Alas
      c.poli([[c.bx - 2, 14 + w], [c.bx - 7, 8.5 - w], [c.bx - 5.5, 15]], 'accB', { tono: -1 });
    } else {
      if (!c.N) {
        c.cola([[17, base], [19.8, base - 1.5 + w], [21.4, base - 4 + w]], [1.9, 1.7, 1.4], 'accA');
        c.poli([[21.8, base - 6.2 + w], [20, base - 3.4 + w], [22.8, base - 2.8 + w]], 'accB');
      }
      const al = c.f === 1 ? 1 : 0;
      const ar = c.f === 2 ? 1 : 0;
      c.poli([[6.5, 17], [1, 10.5 + al], [1.4, 16.5], [4, 18.5]], 'accB', { tono: -1 });
      c.poli([[16.5, 17], [22, 10.5 + ar], [21.6, 16.5], [19, 18.5]], 'accB', { tono: -1 });
    }
  },
  orejas(c) {
    const o = c.o;
    if (c.E) {
      c.cola([[c.hx + 2.4, 4.8 + o], [c.hx + 2.4, 2.6 + o], [c.hx + 2.8, 1.2 + o]], [1.7, 1.4, 1], 'accB', { tono: -1 });
      c.cola([[c.hx - 4.4, 5 + o], [c.hx - 5.6, 2.8 + o], [c.hx - 6.2, 1.2 + o]], [2, 1.6, 1.1], 'accB');
      return;
    }
    c.par((X) => c.cola([[X(5.6), 5 + o], [X(4.4), 2.8 + o], [X(3.9), 1.2 + o]], [2, 1.6, 1.1], 'accB'));
  },
  rostro(c) {
    if (c.N) return;
    if (c.E) c.sobreCabeza(elipse(c.hx + 5.4, c.hy + 4.2, 4.4, 3), 'accB');
    else c.sobreCabeza(elipse(c.hx, c.hy + 4.8, 4.4, 3), 'accB');
  },
  frente(c) {
    if (c.N) return;
    const [nx, ny] = hoc(c, 0, 3.6);
    if (c.E) {
      c.p.pxs([[20, ny], [21, ny]], TINTA);
      c.p.px(20, ny + 3, BLANCO);
    } else {
      c.p.pxs([[nx - 1, ny], [nx + 2, ny]], TINTA);
      c.p.pxs([[nx - 1, ny + 3], [nx + 2, ny + 3]], BLANCO);
    }
  },
};

// ---------- nube ----------
function dibujarNube(v: Vista, f: NumCuadro): Pincel {
  const c = new Ctx(v, f, { cab: { rx: 10, ry: 7, cy: 13.5 }, cue: { rx: 1, ry: 1, cy: 20 } });
  const flota = f === 1 || f === 2 ? -1 : 0;
  const dy = (c.sentado ? 2 : 0) + flota + 1;
  const dx = c.E ? 1 : 0;
  const nube = union(
    elipse(11.5 + dx, 9.6 + dy, 5.6, 5),
    elipse(6.4 + dx, 13.4 + dy, 4.6, 4.2),
    elipse(16.6 + dx, 13.4 + dy, 4.6, 4.2),
    elipse(11.5 + dx, 15.2 + dy + (c.sentado ? 0.5 : 0), 9.6, 4.8),
  );
  c.llenar(nube, 'accA', { brillo: true });
  c.p.llenar(inter(nube, elipse(11.5 + dx, 20.5 + dy, 8.2, 2.4)), 'accB', { contorno: false, plano: true, tono: 0 });
  // Dos volutas a los lados.
  const ojosY = 12.2 + dy - 1.5;
  const g = c.p;
  const top = Math.round(ojosY);
  if (!c.N) {
    const ojo = (x0: number): void => {
      if (c.sentado) {
        g.px(x0, top + 2, TINTA);
        g.px(x0 + 1, top + 2, TINTA);
        return;
      }
      for (let j = 0; j < 3; j++) {
        g.px(x0, top + j, TINTA);
        g.px(x0 + 1, top + j, TINTA);
      }
      g.px(x0, top, BLANCO);
    };
    if (c.E) {
      ojo(15);
      g.px(12, top + 3, ROSA);
      g.pxs([[17, top + 4], [18, top + 4]], TINTA);
    } else {
      ojo(8);
      ojo(14);
      g.px(6, top + 3, ROSA);
      g.px(17, top + 3, ROSA);
      g.pxs([[11, top + 4], [12, top + 4]], TINTA);
    }
  }
  return g;
}

// ---------- hongo ----------
function dibujarHongo(v: Vista, f: NumCuadro): Pincel {
  const c = new Ctx(v, f, { cab: { rx: 10, ry: 7, cy: 8.5 }, cue: { rx: 5.6, ry: 5.2, cy: 17.4 } });
  const bob = c.bob;
  const s = c.sentado ? 3 : bob;
  const dx = c.E ? 1.4 : 0;
  const balanceo = f === 1 ? 1 : f === 2 ? -1 : 0;
  // Pie
  if (!c.sentado) {
    c.llenar(elipse(11.5 - 3 + (c.E ? -0.5 : 0), 22.2 - c.alza('i'), 2.3, 1.6), 'accB', { tono: -1 });
    c.llenar(elipse(11.5 + 3 + (c.E ? 1 : 0), 22.2 - c.alza('d'), 2.3, 1.6), 'accB', { tono: -1 });
  }
  const rY = c.sentado ? 19.8 : 17.4 + bob * 0.5;
  const rRy = c.sentado ? 3.6 : 5.2;
  const tallo = elipse(11.5 + (c.E ? -0.3 : 0), rY, 5.6, rRy);
  c.llenar(tallo, 'accB', { brillo: true });
  if (c.sentado) {
    c.llenar(elipse(8.5, 22.4, 2, 1.4), 'accB', { tono: -1 });
    c.llenar(elipse(14.5, 22.4, 2, 1.4), 'accB', { tono: -1 });
  }
  // Sombrero
  const cx = 11.5 + dx + balanceo * 0.5;
  const cy = 8.6 + s;
  const sombrero = inter(rectangulo(0, 0, 23, Math.round(cy + 3.4)), elipse(cx, cy, 10.8, 7.2));
  c.llenar(sombrero, 'accA', { brillo: true });
  // Lunares
  const lun = (x: number, y: number, r: number): void => c.p.llenar(inter(sombrero, elipse(x + dx, y + s, r, r)), 'accB', { contorno: false, plano: true, tono: 1 });
  if (c.N) {
    lun(7, 7, 1.9);
    lun(15, 5.5, 1.7);
    lun(11.5, 10, 1.6);
    lun(18.5, 9.2, 1.4);
    lun(5, 10.5, 1.2);
  } else {
    lun(6.6, 7, 1.9);
    lun(14.6, 4.8, 1.6);
    lun(18.4, 8.6, 1.5);
    lun(10.6, 9.6, 1.2);
  }
  // Cara en el pie
  if (!c.N) {
    const top = Math.round(c.sentado ? 17.4 : 14.8 + bob * 0.5);
    const g = c.p;
    const ojo = (x0: number): void => {
      if (c.sentado) {
        g.px(x0, top + 1, TINTA);
        g.px(x0 + 1, top + 1, TINTA);
        return;
      }
      g.pxs([[x0, top], [x0 + 1, top], [x0, top + 1], [x0 + 1, top + 1], [x0, top + 2], [x0 + 1, top + 2]], TINTA);
      g.px(x0, top, BLANCO);
    };
    if (c.E) {
      ojo(12);
      g.px(10, top + 3, ROSA);
      g.px(15, top + 4, TINTA);
    } else {
      ojo(9);
      ojo(13);
      g.pxs([[7, top + 3], [16, top + 3]], ROSA);
      g.pxs([[11, top + 4], [12, top + 4]], TINTA);
    }
  }
  return c.p;
}

// ---------- fantasmita ----------
function dibujarFantasma(v: Vista, f: NumCuadro): Pincel {
  const c = new Ctx(v, f, { cab: { rx: 8.6, ry: 8, cy: 10.4 }, cue: { rx: 1, ry: 1, cy: 20 } });
  const flota = f === 1 || f === 2 ? -1 : 0;
  const dy = (c.sentado ? 2 : 0) + flota;
  const dx = c.E ? 1.5 : 0;
  const fase = f * 2;
  const bajo = 19 + dy;
  const cuerpo = union(
    elipse(11.5 + dx, 10 + dy, 8.6, 8),
    {
      ...rectangulo(3, 10 + dy, 20, bajo + 2),
      dentro: (x, y) => x >= 3 && x <= 20 && y >= 10 + dy && y <= bajo + (((x + fase) % 6) < 3 ? 2 : 1),
    },
    ...(c.E ? [elipse(7, 17 + dy, 5, 3.4)] : []),
  );
  // Brazos
  const bz = (x: number, y: number, sube: number): void => c.llenar(elipse(x, y - sube, 1.8, 2.6), 'accA', { tono: -1 });
  if (c.E) bz(12, 16 + dy, f === 1 ? 1 : 0);
  else if (c.N) {
    // sin brazos a la vista
  } else {
    bz(3.2, 16 + dy, f === 1 ? 1 : 0);
    bz(19.8, 16 + dy, f === 2 ? 1 : 0);
  }
  c.llenar(cuerpo, 'accA', { brillo: true });
  c.p.llenar(inter(cuerpo, elipse(11.5 + dx, 13.5 + dy, 5.6, 5)), 'accB', { contorno: false, plano: true, tono: 1 });
  if (c.E) {
    // Los brazos del perfil van por delante.
    bz(13, 16 + dy, f === 1 ? 1 : 0);
  }
  if (!c.N) {
    const top = Math.round(8.6 + dy);
    const g = c.p;
    const ojo = (x0: number): void => {
      if (c.sentado) {
        g.px(x0, top + 1, TINTA);
        g.px(x0 + 1, top + 1, TINTA);
        return;
      }
      g.pxs([[x0, top], [x0 + 1, top], [x0, top + 1], [x0 + 1, top + 1], [x0, top + 2], [x0 + 1, top + 2]], TINTA);
      g.px(x0, top, BLANCO);
    };
    if (c.E) {
      ojo(16);
      g.px(13, top + 3, ROSA);
      g.px(19, top + 4, TINTA);
    } else {
      ojo(8);
      ojo(14);
      g.pxs([[6, top + 3], [17, top + 3]], ROSA);
      g.pxs([[11, top + 4], [12, top + 4], [11, top + 5], [12, top + 5]], TINTA);
    }
  }
  return c.p;
}

export const ESPECIES: readonly DefMascota[] = [
  { id: 'gato', nombre: 'Gato', descripcion: 'Un gatito curioso de orejas puntudas.', grupo: 'animales', dibujar: (v, f) => chibi(gato, v, f) },
  { id: 'perro', nombre: 'Perro', descripcion: 'Un perrito juguetón de orejas caídas.', grupo: 'animales', dibujar: (v, f) => chibi(perro, v, f) },
  { id: 'conejo', nombre: 'Conejo', descripcion: 'Un conejito de orejas largas y colita de algodón.', grupo: 'animales', dibujar: (v, f) => chibi(conejo, v, f) },
  { id: 'buho', nombre: 'Búho', descripcion: 'Un búho redondo de ojos grandes.', grupo: 'animales', dibujar: (v, f) => chibi(buho, v, f) },
  { id: 'pollito', nombre: 'Pollito', descripcion: 'Un pollito esponjoso que da saltitos.', grupo: 'animales', dibujar: (v, f) => chibi(pollito, v, f) },
  { id: 'panda', nombre: 'Panda', descripcion: 'Un osito panda con antifaz y orejas redondas.', grupo: 'animales', dibujar: (v, f) => chibi(panda, v, f) },
  { id: 'rana', nombre: 'Rana', descripcion: 'Una ranita de ojos saltones y sonrisa ancha.', grupo: 'animales', dibujar: (v, f) => chibi(rana, v, f) },
  { id: 'zorro', nombre: 'Zorro', descripcion: 'Un zorrito de cola grande con la punta clara.', grupo: 'animales', dibujar: (v, f) => chibi(zorro, v, f) },
  { id: 'dragoncito', nombre: 'Dragoncito', descripcion: 'Un dragón bebé con cuernitos y alas pequeñas.', grupo: 'fantasticas', dibujar: (v, f) => chibi(dragon, v, f) },
  { id: 'nube', nombre: 'Nube', descripcion: 'Una nubecita con ojos que flota a tu lado.', grupo: 'fantasticas', dibujar: dibujarNube },
  { id: 'hongo', nombre: 'Hongo', descripcion: 'Un hongo caminante de sombrero con lunares.', grupo: 'fantasticas', dibujar: dibujarHongo },
  { id: 'fantasmita', nombre: 'Fantasmita', descripcion: 'Un fantasmita amable que flota sin hacer ruido.', grupo: 'fantasticas', dibujar: dibujarFantasma },
];

void NARANJA_PROF;
void poligono;
void resta;
void ROSA_OSC;
