/**
 * Árboles, arbustos y sus sombras, vistos desde el piso 4: las copas se ven desde arriba, redondas y blandas, con un
 * poco de tronco asomando por debajo. Cada copa tiene tres cuadros de viento (a, b, c): el motor los alterna con
 * fases distintas por árbol para que las hojas se muevan sin girar píxeles.
 */

import { Lienzo } from '../nucleo';
import { azar, pk, rk } from './comun';
import { k, type Token } from './paleta';

export interface SpriteConAncla {
  id: string;
  lienzo: Lienzo;
  /** Punto del cuadro donde apoya el objeto en el suelo (los pies, la base del tronco). */
  ancla: { x: number; y: number };
}

type Racimo = readonly [number, number, number];

/** Racimos de la copa grande: desplazamiento x, y desde el centro y radio. De atrás hacia adelante. */
const RACIMOS_GRANDE: readonly Racimo[] = [
  [-28, -8, 17],
  [28, -8, 17],
  [-12, -22, 16],
  [14, -22, 16],
  [-34, 6, 15],
  [34, 6, 15],
  [-14, 2, 21],
  [16, 2, 21],
  [0, -4, 22],
  [-22, 20, 15],
  [22, 20, 15],
  [0, 21, 15],
];

interface OpcionesCopa {
  /** 1 es la copa grande de 100 x 96. */
  escala: number;
  tonos: readonly [Token, Token, Token, Token];
  contorno: Token;
  semilla: number;
  viento: number;
  /** Motas de otro color (flores). */
  flor?: Token;
}

function copa(op: OpcionesCopa): { lienzo: Lienzo; ancla: { x: number; y: number } } {
  const e = op.escala;
  const W = Math.round(100 * e);
  const H = Math.round(96 * e);
  const l = new Lienzo(W, H);
  const cx = Math.round(W / 2);
  const cy = Math.round(42 * e);
  const baseY = H - Math.max(2, Math.round(6 * e));
  // Tronco con luz a la izquierda, debajo de la copa.
  const tAncho = Math.max(4, Math.round(7 * e));
  const x0 = cx - Math.floor(tAncho / 2);
  for (let y = cy + Math.round(20 * e); y <= baseY; y++) {
    rk(l, x0, y, tAncho, 1, 'tr1');
    pk(l, x0, y, 'tr2');
    pk(l, x0 + tAncho - 1, y, 'tr0');
  }
  const tonos = op.tonos.map(k) as [string, string, string, string];
  for (let i = 0; i < RACIMOS_GRANDE.length; i++) {
    const [dx, dy, r] = RACIMOS_GRANDE[i] as Racimo;
    // El viento mueve cada racimo un píxel, con otra fase en cada cuadro.
    const jx = op.viento === 0 ? 0 : Math.round((azar(i, op.viento, op.semilla) - 0.5) * 2);
    const jy = op.viento === 0 ? 0 : Math.round((azar(i, op.viento, op.semilla + 1) - 0.5) * 2);
    const rr = Math.max(3, Math.round(r * e));
    l.elipseSombreada(cx + Math.round(dx * e) + jx, cy + Math.round(dy * e) + jy, rr, Math.max(3, Math.round(rr * 0.92)), tonos);
  }
  // Hojas sueltas: claras arriba a la izquierda, oscuras abajo. La semilla del cuadro de viento las reparte distinto.
  const n = Math.round(150 * e * e);
  for (let i = 0; i < n; i++) {
    const a = azar(i, op.semilla, 300 + op.viento) * Math.PI * 2;
    const rad = Math.sqrt(azar(i, op.semilla, 310 + op.viento)) * 46 * e;
    const px = Math.round(cx + Math.cos(a) * rad);
    const py = Math.round(cy + Math.sin(a) * rad * 0.9);
    if (!l.esOpaco(px, py)) continue;
    const arriba = py < cy - 6 * e;
    if (op.flor && azar(i, op.semilla, 320 + op.viento) < 0.35) {
      pk(l, px, py, op.flor);
      continue;
    }
    l.rect(px, py, 2, 1, k(arriba ? op.tonos[3] : op.tonos[0]));
  }
  l.contorno(k(op.contorno));
  return { lienzo: l, ancla: { x: cx, y: baseY } };
}

const VIENTOS = ['a', 'b', 'c'] as const;

/** Copas de andén en tres tamaños y con jacarandá: tres cuadros de viento cada una. */
export function spritesArboles(): SpriteConAncla[] {
  const salida: SpriteConAncla[] = [];
  const tipos: ReadonlyArray<{ id: string; escala: number; tonos: readonly [Token, Token, Token, Token]; contorno: Token; semilla: number; flor?: Token }> = [
    { id: 'arbol-g', escala: 1, tonos: ['v1', 'v2', 'v3', 'v4'], contorno: 'v0', semilla: 1 },
    { id: 'arbol-m', escala: 0.74, tonos: ['v1', 'v2', 'v3', 'v4'], contorno: 'v0', semilla: 2 },
    { id: 'arbol-p', escala: 0.52, tonos: ['v1', 'v2', 'v3', 'v4'], contorno: 'v0', semilla: 3 },
    { id: 'arbol-jac', escala: 0.82, tonos: ['ja0', 'ja1', 'ja2', 'ja3'], contorno: 'ja0', semilla: 4 },
  ];
  for (const t of tipos) {
    VIENTOS.forEach((v, i) => {
      const { lienzo, ancla } = copa({ escala: t.escala, tonos: t.tonos, contorno: t.contorno, semilla: t.semilla, viento: i, ...(t.flor ? { flor: t.flor } : {}) });
      salida.push({ id: `${t.id}-${v}`, lienzo, ancla });
    });
  }
  return salida;
}

/** Pino visto desde arriba: pisos de ramas que giran. */
export function spritePino(variante: number): SpriteConAncla {
  const W = 46;
  const H = 54;
  const l = new Lienzo(W, H);
  const cx = 23;
  const cy = 24;
  rk(l, cx - 2, cy + 14, 4, 14, 'tr1');
  pk(l, cx - 2, cy + 14, 'tr2');
  const tonos = [k('v1'), k('v2'), k('v3'), k('v4')];
  // Cinco ramas en estrella por piso: cada piso más chico y girado.
  for (let piso = 0; piso < 3; piso++) {
    const R = 19 - piso * 5;
    const giro = piso * 0.5 + variante * 0.3;
    for (let b = 0; b < 7; b++) {
      const a = giro + (b / 7) * Math.PI * 2;
      const bx = Math.round(cx + Math.cos(a) * R * 0.55);
      const by = Math.round(cy + Math.sin(a) * R * 0.5);
      l.elipseSombreada(bx, by, Math.round(R * 0.5), Math.round(R * 0.44), tonos);
    }
    l.elipseSombreada(cx, cy - piso, Math.round(R * 0.55), Math.round(R * 0.5), tonos);
  }
  l.px(cx, cy - 2, k('v4'));
  l.px(cx - 1, cy - 1, k('v4'));
  l.contorno(k('v0'));
  return { id: `pino-${variante === 0 ? 'a' : 'b'}`, lienzo: l, ancla: { x: cx, y: cy + 27 } };
}

/** Arbusto redondo de tres bolas. */
export function spriteArbusto(id: string, ancho: number, variante: number): SpriteConAncla {
  const W = ancho + 4;
  const H = Math.round(ancho * 0.75) + 4;
  const l = new Lienzo(W, H);
  const r = Math.round(ancho * 0.28);
  const tonos = [k('v1'), k('v2'), k('v3'), k('v4')];
  const cy = H - r - 3;
  l.elipseSombreada(2 + r, cy, r, Math.round(r * 0.9), tonos);
  l.elipseSombreada(W - 2 - r, cy, r, Math.round(r * 0.9), tonos);
  l.elipseSombreada(W / 2, cy - Math.round(r * 0.5), Math.round(r * 1.1), Math.round(r), tonos);
  for (let i = 0; i < ancho; i++) {
    const px = Math.round(azar(i, variante, 330) * (W - 4)) + 2;
    const py = Math.round(azar(i, variante, 331) * (H - 4)) + 2;
    if (l.esOpaco(px, py)) l.px(px, py, k(py < H / 2 ? 'v4' : 'v0'));
  }
  l.contorno(k('v0'));
  return { id, lienzo: l, ancla: { x: Math.round(W / 2), y: H - 1 } };
}

/** Seto bajo de un tile de ancho: para bordes de jardín. */
export function spriteSeto(): SpriteConAncla {
  const l = new Lienzo(32, 16);
  const tonos = [k('v1'), k('v2'), k('v3'), k('v4')];
  for (let x = 0; x < 4; x++) l.elipseSombreada(4 + x * 8, 9, 5, 5, tonos);
  l.rect(0, 11, 32, 3, k('v1'));
  l.rect(0, 11, 32, 1, k('v2'));
  l.contorno(k('v0'));
  return { id: 'seto', lienzo: l, ancla: { x: 16, y: 14 } };
}

/** Sombra opaca de una copa: el motor la dibuja con transparencia. Un anillo tramado rodea la parte sólida. */
export function spriteSombraElipse(id: string, rx: number, ry: number): SpriteConAncla {
  const W = rx * 2 + 4;
  const H = ry * 2 + 4;
  const l = new Lienzo(W, H);
  const cx = W / 2;
  const cy = H / 2;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const dx = (x + 0.5 - cx) / (rx + 1);
      const dy = (y + 0.5 - cy) / (ry + 1);
      const d = dx * dx + dy * dy;
      if (d <= 0.55) pk(l, x, y, 'sh');
      else if (d <= 1 && (x + y) % 2 === 0) pk(l, x, y, 'sh');
    }
  }
  return { id, lienzo: l, ancla: { x: Math.round(cx), y: Math.round(cy) } };
}

/** Alcorque: el cuadro de tierra con reja donde nace cada árbol de andén. */
export function spriteAlcorque(): SpriteConAncla {
  const l = new Lienzo(38, 20);
  l.elipse(19, 10, 17, 8, k('c1'));
  l.elipse(19, 10, 15, 7, k('c3'));
  l.elipse(19, 10, 13, 6, k('tie1'));
  for (let x = 8; x < 31; x += 3) {
    l.linea(x, 6, x, 14, k('c1'));
  }
  l.elipse(19, 10, 4, 2, k('tr0'));
  l.contorno(k('bo0'));
  return { id: 'alcorque', lienzo: l, ancla: { x: 19, y: 10 } };
}
