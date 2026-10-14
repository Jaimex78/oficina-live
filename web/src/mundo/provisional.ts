import { CASILLA, COLORES_VARIANTE, huellaDe, type ObjetoCatalogo, type Orientacion } from '@ol/shared';

/**
 * Arte provisional: bloques dibujados con código para que el mundo y el editor funcionen
 * antes de que exista el atlas pintado. Cuando el atlas trae el cuadro, este dibujo no se usa.
 */

type Ctx = CanvasRenderingContext2D;

function lienzo(w: number, h: number): [HTMLCanvasElement, Ctx] {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  const g = c.getContext('2d') as Ctx;
  g.imageSmoothingEnabled = false;
  return [c, g];
}

function rgb(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function hex(r: number, g: number, b: number): string {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}
/** Mezcla hacia el blanco (t > 0) o hacia el negro (t < 0). */
function tono(color: string, t: number): string {
  const [r, g, b] = rgb(color);
  const a = t >= 0 ? 255 : 0;
  const k = Math.abs(t);
  return hex(r + (a - r) * k, g + (a - g) * k, b + (a - b) * k);
}

const PISOS: Record<string, string> = {
  'piso-madera-clara': '#D9B382',
  'piso-madera-oscura': '#8B5E3C',
  'piso-baldosa': '#C9CDD2',
  'piso-cemento': '#9A9CA1',
  'piso-alfombra-gris': '#7B7F86',
  'piso-alfombra-roja': '#B8383A',
  'piso-cesped': '#5E9A4B',
  'piso-deck': '#B58B5C',
  'piso-parquet': '#C79A64',
  'piso-cocina': '#E1E4E8',
};

const CATEGORIA: Record<string, string> = {
  pisos: '#C9CDD2',
  paredes: '#E4DED2',
  puestos: '#B9854F',
  asientos: '#5B6B8C',
  mesas: '#B9854F',
  tecnologia: '#2B2F3A',
  colaboracion: '#F2F2F7',
  cocina: '#C7CBD1',
  decoracion: '#4C9A5C',
  temporada: '#E27D3A',
  exterior: '#6BA36B',
};

export function colorBase(o: ObjetoCatalogo, variante: string): string {
  if (o.capa === 'piso') return PISOS[o.id] ?? '#C9CDD2';
  if (variante !== 'base') {
    const m = COLORES_VARIANTE[variante]?.muestra ?? o.variantes.find((v) => v.id === variante)?.muestra;
    if (m) return m;
  }
  return CATEGORIA[o.categoria] ?? '#9A9AA0';
}

function rect(g: Ctx, color: string, x: number, y: number, w: number, h: number): void {
  g.fillStyle = color;
  g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function elipse(g: Ctx, color: string, cx: number, cy: number, rx: number, ry: number): void {
  g.fillStyle = color;
  g.beginPath();
  g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  g.fill();
}

function contorno(g: Ctx, w: number, h: number, color = 'rgba(10,12,20,0.55)'): void {
  g.strokeStyle = color;
  g.lineWidth = 1;
  g.strokeRect(0.5, 0.5, w - 1, h - 1);
}

function dibujarPiso(o: ObjetoCatalogo): HTMLCanvasElement {
  const [c, g] = lienzo(CASILLA, CASILLA);
  const base = colorBase(o, 'base');
  rect(g, base, 0, 0, CASILLA, CASILLA);
  const claro = tono(base, 0.08);
  const oscuro = tono(base, -0.14);
  if (o.id.includes('madera') || o.id.includes('deck') || o.id.includes('parquet')) {
    for (let i = 0; i < 4; i++) rect(g, oscuro, 0, i * 8 + 7, CASILLA, 1);
    rect(g, oscuro, 11, 0, 1, 7);
    rect(g, oscuro, 22, 8, 1, 7);
    rect(g, oscuro, 6, 16, 1, 7);
    rect(g, oscuro, 26, 24, 1, 7);
    rect(g, claro, 0, 0, CASILLA, 1);
  } else if (o.id.includes('baldosa') || o.id.includes('cocina')) {
    rect(g, oscuro, 15, 0, 1, CASILLA);
    rect(g, oscuro, 0, 15, CASILLA, 1);
    rect(g, claro, 0, 0, 15, 1);
  } else if (o.id.includes('cesped')) {
    for (let i = 0; i < 9; i++) rect(g, i % 2 ? tono(base, 0.12) : tono(base, -0.12), (i * 11) % 30, (i * 7) % 28, 2, 3);
  } else {
    for (let i = 0; i < 7; i++) rect(g, i % 2 ? claro : oscuro, (i * 13) % 30, (i * 9) % 30, 2, 2);
  }
  return c;
}

function dibujarPared(o: ObjetoCatalogo, variante: string, mascara: string): HTMLCanvasElement {
  const alto = CASILLA + o.sobresale;
  const [c, g] = lienzo(CASILLA, alto);
  const base = o.id === 'vidrio' ? '#9CC8E8' : variante === 'base' ? '#E4DED2' : colorBase(o, variante);
  const [n, e, s, w] = [...mascara].map((v) => v === '1');
  const cara = s ? tono(base, 0.1) : tono(base, -0.06);
  const tapa = tono(base, 0.16);
  rect(g, tapa, 0, 0, CASILLA, alto);
  if (!s) {
    rect(g, cara, 0, alto - CASILLA, CASILLA, CASILLA);
    rect(g, tono(base, -0.28), 0, alto - 6, CASILLA, 6);
    rect(g, tono(base, 0.3), 0, alto - CASILLA, CASILLA, 1);
  }
  if (!w) rect(g, tono(base, -0.3), 0, 0, 1, alto);
  if (!e) rect(g, tono(base, -0.3), CASILLA - 1, 0, 1, alto);
  if (!n) rect(g, tono(base, -0.3), 0, 0, CASILLA, 1);
  if (o.id === 'vidrio') {
    g.globalAlpha = 0.55;
    rect(g, '#FFFFFF', 4, alto - CASILLA + 3, 6, CASILLA - 12);
    g.globalAlpha = 1;
  }
  return c;
}

function dibujarAbertura(o: ObjetoCatalogo, orientacion: Orientacion, variante: string): HTMLCanvasElement {
  const h = huellaDe(o, orientacion);
  const ancho = h.ancho * CASILLA;
  const alto = h.alto * CASILLA + o.sobresale;
  const [c, g] = lienzo(ancho, alto);
  const pared = '#E4DED2';
  rect(g, tono(pared, 0.16), 0, 0, ancho, alto);
  rect(g, tono(pared, -0.06), 0, alto - h.alto * CASILLA, ancho, h.alto * CASILLA);
  const vertical = orientacion === 'E' || orientacion === 'O';
  if (o.id === 'pared-ventana') {
    const gx = vertical ? 10 : 4;
    const gw = vertical ? ancho - 20 : ancho - 8;
    rect(g, '#6C7A89', gx - 1, alto - 28, gw + 2, 24);
    rect(g, '#BFE0F5', gx, alto - 27, gw, 22);
    rect(g, '#EAF6FF', gx, alto - 27, gw, 7);
    rect(g, '#6C7A89', gx + Math.floor(gw / 2), alto - 27, 1, 22);
  } else if (o.id === 'arco') {
    rect(g, '#6B5B4B', 2, alto - 30, ancho - 4, 4);
    rect(g, '#3A3128', 5, alto - 26, ancho - 10, 26);
  } else if (o.id === 'ascensor') {
    rect(g, '#9AA0A8', 3, alto - 30, ancho - 6, 30);
    rect(g, '#C8CDD3', ancho / 2, alto - 30, 1, 30);
  } else {
    const marco = o.id === 'puerta-vidrio' ? '#7F93A6' : '#6B4A2F';
    const hoja = o.id === 'puerta-vidrio' ? '#BFE0F5' : variante === 'base' ? '#9A6B3F' : colorBase(o, variante);
    if (vertical) {
      rect(g, marco, 8, alto - 31, ancho - 16, 31);
      rect(g, hoja, 10, alto - 29, ancho - 20, 29);
    } else {
      rect(g, marco, 3, alto - 31, ancho - 6, 31);
      rect(g, hoja, 5, alto - 29, ancho - 10, 29);
      if (ancho > CASILLA) rect(g, marco, ancho / 2, alto - 29, 1, 29);
      rect(g, '#E8C26A', ancho / 2 - 4, alto - 14, 2, 2);
    }
  }
  return c;
}

function dibujarMontado(o: ObjetoCatalogo, orientacion: Orientacion, variante: string): HTMLCanvasElement {
  const h = huellaDe(o, orientacion);
  const ancho = h.ancho * CASILLA;
  const alto = h.alto * CASILLA + o.sobresale;
  const [c, g] = lienzo(ancho, alto);
  const base = colorBase(o, variante);
  const y0 = Math.max(2, alto - CASILLA + 3);
  const hh = Math.max(10, CASILLA - 12);
  rect(g, '#3A3128', 3, y0, ancho - 6, hh);
  rect(g, o.id === 'tv-pared' ? '#0E1620' : tono(base, 0.1), 5, y0 + 2, ancho - 10, hh - 4);
  if (o.id === 'tv-pared' || o.id.includes('kanban')) {
    rect(g, o.id === 'tv-pared' ? '#4FA3FF' : '#EF3B3A', 8, y0 + 5, 12, 3);
    rect(g, o.id === 'tv-pared' ? '#9CC8FF' : '#3E8E5A', 8, y0 + 11, ancho - 26, 3);
  } else if (o.id.includes('cuadro')) {
    rect(g, tono(base, -0.1), 8, y0 + 7, 8, hh - 12);
    rect(g, '#EF3B3A', ancho - 16, y0 + 5, 6, 6);
  }
  return c;
}

function dibujarPlanta(alto: number, ancho: number, base: string): HTMLCanvasElement {
  const [c, g] = lienzo(ancho, alto);
  const cx = ancho / 2;
  elipse(g, 'rgba(0,0,0,0.18)', cx, alto - 3, ancho * 0.32, 3);
  rect(g, '#B8623C', cx - 6, alto - 14, 12, 12);
  rect(g, '#8E4627', cx - 7, alto - 14, 14, 3);
  const verde = base;
  elipse(g, tono(verde, -0.2), cx, alto - 22, Math.min(13, ancho * 0.4), Math.min(14, alto * 0.3));
  elipse(g, verde, cx - 3, alto - 25, Math.min(10, ancho * 0.3), Math.min(11, alto * 0.25));
  elipse(g, tono(verde, 0.25), cx + 2, alto - 28, 5, 6);
  return c;
}

function dibujarAsiento(o: ObjetoCatalogo, orientacion: Orientacion, variante: string): HTMLCanvasElement {
  const h = huellaDe(o, orientacion);
  const ancho = h.ancho * CASILLA;
  const alto = h.alto * CASILLA + o.sobresale;
  const [c, g] = lienzo(ancho, alto);
  const base = colorBase(o, variante);
  const redondo = o.id === 'puff' || o.id === 'taburete';
  const px = 3;
  const py = alto - h.alto * CASILLA + 4;
  const pw = ancho - 6;
  const ph = h.alto * CASILLA - 8;
  elipse(g, 'rgba(0,0,0,0.18)', ancho / 2, alto - 4, ancho * 0.4, 3);
  if (redondo) {
    elipse(g, tono(base, -0.25), ancho / 2, alto - 10, pw / 2, 9);
    elipse(g, base, ancho / 2, alto - 14, pw / 2 - 1, 9);
    elipse(g, tono(base, 0.2), ancho / 2 - 3, alto - 16, pw / 4, 4);
    return c;
  }
  rect(g, tono(base, -0.3), px, py + 2, pw, ph);
  rect(g, base, px, py, pw, ph - 2);
  const lomo = tono(base, -0.18);
  const grosor = 8;
  const dir = orientacion === 'U' ? 'S' : orientacion;
  if (dir === 'S') rect(g, lomo, px, py - 6, pw, grosor);
  else if (dir === 'N') rect(g, lomo, px, py + ph - grosor + 2, pw, grosor);
  else if (dir === 'E') rect(g, lomo, px - 1, py - 4, grosor - 2, ph + 4);
  else rect(g, lomo, px + pw - grosor + 3, py - 4, grosor - 2, ph + 4);
  rect(g, tono(base, 0.2), px + 2, py + 1, pw - 4, 2);
  return c;
}

function dibujarPantalla(o: ObjetoCatalogo, orientacion: Orientacion): HTMLCanvasElement {
  const h = huellaDe(o, orientacion);
  const ancho = h.ancho * CASILLA;
  const alto = h.alto * CASILLA + o.sobresale;
  const [c, g] = lienzo(ancho, alto);
  const dir = orientacion === 'U' ? 'S' : orientacion;
  const grande = o.id.includes('sala') || o.id.includes('pizarra');
  const sw = Math.min(ancho - 6, grande ? ancho - 6 : 18);
  const sh = grande ? alto - 6 : 12;
  const sx = (ancho - sw) / 2;
  const sy = alto - sh - (grande ? 3 : 10);
  if (!grande) {
    rect(g, '#555B66', ancho / 2 - 4, alto - 8, 8, 3);
    rect(g, '#555B66', ancho / 2 - 1, sy + sh, 2, 5);
  }
  rect(g, '#14171D', sx - 1, sy - 1, sw + 2, sh + 2);
  if (dir === 'N') rect(g, '#222833', sx, sy, sw, sh);
  else {
    rect(g, '#2F6FD0', sx, sy, sw, sh);
    rect(g, '#8EC1FF', sx + 1, sy + 1, Math.max(2, sw / 2), 2);
    rect(g, '#EF3B3A', sx + sw - 6, sy + sh - 4, 4, 2);
  }
  return c;
}

function dibujarMesa(o: ObjetoCatalogo, orientacion: Orientacion, variante: string): HTMLCanvasElement {
  const h = huellaDe(o, orientacion);
  const ancho = h.ancho * CASILLA;
  const alto = h.alto * CASILLA + o.sobresale;
  const [c, g] = lienzo(ancho, alto);
  const base = colorBase(o, variante);
  const redonda = o.id === 'mesa-redonda' || o.id === 'fuente';
  const frente = Math.min(16, Math.max(8, alto * 0.28));
  elipse(g, 'rgba(0,0,0,0.16)', ancho / 2, alto - 2, ancho * 0.46, 3);
  if (redonda) {
    elipse(g, tono(base, -0.3), ancho / 2, alto - frente + 2, ancho / 2 - 2, alto / 2 - 4);
    elipse(g, base, ancho / 2, alto / 2 - 2, ancho / 2 - 2, alto / 2 - 5);
    elipse(g, tono(base, 0.18), ancho / 2 - 4, alto / 2 - 5, ancho / 4, alto / 6);
    return c;
  }
  rect(g, tono(base, -0.32), 1, alto - frente, ancho - 2, frente - 1);
  rect(g, base, 1, 2, ancho - 2, alto - frente - 2);
  rect(g, tono(base, 0.18), 3, 3, ancho - 6, 2);
  rect(g, tono(base, -0.12), 1, alto - frente - 1, ancho - 2, 1);
  if (o.categoria === 'puestos' && h.ancho >= 2) {
    rect(g, tono(base, -0.1), ancho - 14, alto - frente - 7, 11, 5);
    rect(g, '#2B2F3A', ancho - 12, alto - frente - 6, 7, 1);
  }
  return c;
}

function dibujarAlfombra(o: ObjetoCatalogo, variante: string): HTMLCanvasElement {
  const h = huellaDe(o, 'U');
  const [c, g] = lienzo(h.ancho * CASILLA, h.alto * CASILLA);
  const base = colorBase(o, variante);
  const redonda = o.id.includes('redonda');
  g.globalAlpha = 0.92;
  if (redonda) {
    elipse(g, tono(base, -0.15), c.width / 2, c.height / 2, c.width / 2 - 1, c.height / 2 - 1);
    elipse(g, base, c.width / 2, c.height / 2, c.width / 2 - 4, c.height / 2 - 4);
  } else {
    rect(g, tono(base, -0.15), 1, 1, c.width - 2, c.height - 2);
    rect(g, base, 4, 4, c.width - 8, c.height - 8);
  }
  g.globalAlpha = 1;
  return c;
}

function dibujarCaja(o: ObjetoCatalogo, orientacion: Orientacion, variante: string): HTMLCanvasElement {
  const h = huellaDe(o, orientacion);
  const ancho = h.ancho * CASILLA;
  const alto = h.alto * CASILLA + o.sobresale;
  const [c, g] = lienzo(ancho, alto);
  const base = colorBase(o, variante);
  const frente = Math.min(alto - 4, Math.max(10, 8 + o.sobresale * 0.55));
  elipse(g, 'rgba(0,0,0,0.16)', ancho / 2, alto - 2, ancho * 0.45, 3);
  rect(g, tono(base, -0.3), 2, alto - frente, ancho - 4, frente - 1);
  rect(g, base, 2, 2, ancho - 4, alto - frente - 2);
  rect(g, tono(base, 0.2), 4, 3, ancho - 8, 2);
  if (o.emisor && o.emisor.modo === 'noche') {
    elipse(g, '#FFE9B0', ancho / 2, 8, 5, 4);
    rect(g, tono(base, -0.3), ancho / 2 - 1, 11, 2, alto - 14);
  }
  return c;
}

/** Dibuja el cuadro provisional de un objeto. Mide lo mismo que mediría el arte final. */
export function dibujarProvisional(o: ObjetoCatalogo, orientacion: Orientacion, variante: string, mascara?: string): HTMLCanvasElement {
  let c: HTMLCanvasElement;
  if (o.capa === 'piso') c = dibujarPiso(o);
  else if (o.autotile) c = dibujarPared(o, variante, mascara ?? '0000');
  else if (o.pared === 'abertura') c = dibujarAbertura(o, orientacion, variante);
  else if (o.montado) c = dibujarMontado(o, orientacion, variante);
  else if (o.capa === 'suelo') c = dibujarAlfombra(o, variante);
  else if (o.interaccion === 'sentarse') c = dibujarAsiento(o, orientacion, variante);
  else if (o.id.startsWith('planta') || o.id === 'palmera' || o.id === 'arbol' || o.id === 'jardinera') {
    const h = huellaDe(o, orientacion);
    c = dibujarPlanta(h.alto * CASILLA + o.sobresale, h.ancho * CASILLA, o.id === 'arbol' || o.id === 'palmera' ? '#3F8F4A' : '#4C9A5C');
  } else if (o.categoria === 'tecnologia') c = dibujarPantalla(o, orientacion);
  else if (o.categoria === 'mesas' || (o.categoria === 'puestos' && (o.id.includes('escritorio') || o.id.includes('mesa')))) c = dibujarMesa(o, orientacion, variante);
  else c = dibujarCaja(o, orientacion, variante);
  const g = c.getContext('2d') as Ctx;
  if (o.capa === 'suelo' || o.capa === 'piso') {
    if (o.capa === 'suelo') contorno(g, c.width, c.height, 'rgba(10,12,20,0.25)');
  }
  return c;
}
