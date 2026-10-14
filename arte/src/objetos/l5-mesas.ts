/**
 * Mesas de juego del lote 5: billar, hockey de aire, póker y ajedrez.
 *
 * Las tres mesas grandes miden 3 x 2 casillas (`S`: 96 x 64, `E`: 64 x 96) y se dibujan con el mismo molde: `cuerpoMesa`
 * pone patas, faldón, canto y el borde de la tapa, y encima se pinta el paño, el hielo o el tapete sobre un `Plano`
 * que se gira para `E`. Las cosas redondas (bolas, fichas) se dibujan en pantalla, sin girar.
 * Sombra: la de suelo del lote 4, en dos tonos, con una mancha de contacto entre las patas.
 */

import { Lienzo } from '../nucleo';
import { carta, cerrarSuelo, cuerpoMesa, Plano, pilaFichas, registrar, tonosDe } from './l5-comun';
import type { Cuadros, MedidasMesa, Tonos } from './l5-comun';

/** Mancha de contacto bajo el faldón, entre las patas. */
function contactoMesa(x: number, ancho: number, m: MedidasMesa): [number, number, number, number] {
  return [x + ancho / 2, m.yPie - 3, ancho / 2 - 8, 3];
}

/** Medidas de la tapa según la orientación: largo horizontal en `S`, vertical en `E`. */
function medidas(girado: boolean, alto: number): { x: number; y: number; ancho: number; fondo: number } {
  const ancho = girado ? 60 : 92;
  return { x: 1, y: 1, ancho, fondo: alto - 19 };
}

// ---------------------------------------------------------------------------
// Billar
// ---------------------------------------------------------------------------

const NOGAL: Tonos = tonosDe('madera-oscura', 1, 2, 3);
const NOGAL_PATA: Tonos = tonosDe('madera-oscura', 0, 1, 2);

type ParBola = readonly [string, string];
const BOLAS: readonly ParBola[] = [
  ['tela-calida-3', 'tela-calida-1'],
  ['vidrio-1', 'vidrio-0'],
  ['rojo-3', 'rojo-1'],
  ['morado-2', 'morado-0'],
  ['naranja-2', 'naranja-0'],
  ['neutro-2', 'neutro-0'],
  ['rojo-suave-4', 'rojo-suave-2'],
  ['cuero-2', 'cuero-0'],
  ['tela-calida-2', 'tela-calida-0'],
  ['vidrio-2', 'vidrio-0'],
];

/** Un agujero de la mesa de billar: óvalo oscuro con un borde de cuero. */
function tronera(l: Lienzo, cx: number, cy: number, rx = 3, ry = 3): void {
  l.elipse(cx, cy, rx, ry, 'neutro-2');
  l.elipse(cx, cy, rx - 1, ry - 1, 'azul-oficina-0');
  l.px(cx + 1, cy + 1, 'neutro-1');
}

export function dibujarBillar(orientacion: 'S' | 'E'): Lienzo {
  const girado = orientacion === 'E';
  const alto = girado ? 96 : 64;
  const l = new Lienzo(girado ? 64 : 96, alto);
  const { x, y, ancho, fondo } = medidas(girado, alto);
  const m = cuerpoMesa(l, { x, y, ancho, fondo, radio: 4, tapa: NOGAL, faldon: NOGAL_PATA, pata: NOGAL_PATA });
  // Banda de paño oscuro (la goma) y paño verde.
  l.rect(x + 3, y + 3, ancho - 6, fondo - 6, 'planta-1');
  l.rect(x + 3, y + 3, ancho - 6, 1, 'planta-2');
  l.rect(x + 3, y + 3, 1, fondo - 6, 'planta-2');
  l.rect(x + 6, y + 6, ancho - 12, fondo - 12, 'planta-2');
  l.rect(x + 6, y + 6, ancho - 12, 1, 'planta-3');
  l.rect(x + 6, y + 6, 1, fondo - 12, 'planta-3');
  // Diamantes en el borde de madera.
  const U = girado ? fondo : ancho;
  const V = girado ? ancho : fondo;
  const marcos = new Plano(l, x, y, U, V, girado);
  for (let i = 1; i < 8; i++) {
    if (i === 4) continue;
    const u = Math.round((U * i) / 8);
    marcos.px(u, 1, 'crema-4').px(u, V - 2, 'crema-4');
  }
  // Troneras: cuatro esquinas y dos al centro de los lados largos.
  const plano = new Plano(l, x + 6, y + 6, U - 12, V - 12, girado);
  const esquinasT: Array<[number, number]> = [[3.5, 3.5], [U - 4.5, 3.5], [3.5, V - 4.5], [U - 4.5, V - 4.5]];
  for (const [u, v] of esquinasT) {
    const [sx, sy] = marcos.pt(u, v);
    tronera(l, sx, sy, 3, 3);
  }
  for (const v of [2.5, V - 3.5]) {
    const [sx, sy] = marcos.pt(U / 2, v);
    tronera(l, sx, sy, girado ? 2 : 3, girado ? 3 : 2);
  }
  // Línea de cabecera y punto de salida.
  const Uf = U - 12;
  const Vf = V - 12;
  plano.rect(Math.round(Uf * 0.27), 1, 1, Vf - 2, 'planta-3');
  // Triángulo de diez bolas con el vértice hacia la bola blanca.
  const u0 = Math.round(Uf * 0.62);
  const v0 = Math.round(Vf / 2) - 8;
  let k = 0;
  for (let fila = 0; fila < 4; fila++) {
    for (let j = 0; j <= fila; j++) {
      plano.bola(u0 + fila * 4, v0 + 8 - fila * 2 + j * 4, BOLAS[k % BOLAS.length] as ParBola);
      k++;
    }
  }
  // Bola blanca y dos sueltas.
  plano.bola(Math.round(Uf * 0.16), Math.round(Vf / 2) - 2, ['neutro-7', 'neutro-5']);
  plano.bola(Math.round(Uf * 0.42), Math.round(Vf * 0.22), BOLAS[6] as ParBola);
  plano.bola(Math.round(Uf * 0.85), Math.round(Vf * 0.78), BOLAS[3] as ParBola);
  // Taco sobre el paño: dos rayas paralelas con punta de tiza azul y base oscura, y su sombra sobre el paño.
  const ua = 5;
  const va = Vf - 5;
  const ub = Math.round(Uf * 0.36);
  const vb = Math.round(Vf * 0.62);
  plano.linea(ua + 1, va + 1, ub + 1, vb + 1, 'planta-1');
  plano.linea(ua, va, ub, vb, 'madera-clara-2');
  plano.linea(ua, va - 1, ub, vb - 1, 'madera-clara-4');
  plano.px(ub, vb, 'vidrio-2');
  plano.px(ub, vb - 1, 'vidrio-3');
  plano.px(ua, va, 'madera-oscura-1');
  plano.px(ua, va - 1, 'madera-oscura-2');
  // Tiza azul sobre el borde.
  const [cx, cy] = marcos.pt(U * 0.78, 0);
  l.rect(cx, cy, 3, 2, 'vidrio-1');
  l.px(cx, cy, 'vidrio-3');
  return cerrarSuelo(l, { contacto: contactoMesa(x, ancho, m) });
}

// ---------------------------------------------------------------------------
// Hockey de aire
// ---------------------------------------------------------------------------

const PLASTICO: Tonos = tonosDe('azul-oficina', 1, 2, 3);
const PLASTICO_PATA: Tonos = tonosDe('azul-oficina', 0, 1, 2);

/** Mazo en forma de hongo visto de arriba: disco de color con el mango más claro. */
function mazo(l: Lienzo, cx: number, cy: number, t: readonly [string, string, string]): void {
  l.elipse(cx, cy, 4, 4, t[1]);
  l.elipse(cx - 1, cy - 1, 3, 3, t[2]);
  l.elipse(cx, cy, 2, 2, t[0]);
  l.elipse(cx - 1, cy - 1, 1, 1, 'neutro-7');
  l.px(cx + 1, cy + 1, t[2]);
}

export function dibujarAirHockey(orientacion: 'S' | 'E'): Lienzo {
  const girado = orientacion === 'E';
  const alto = girado ? 96 : 64;
  const l = new Lienzo(girado ? 64 : 96, alto);
  const { x, y, ancho, fondo } = medidas(girado, alto);
  const m = cuerpoMesa(l, { x, y, ancho, fondo, radio: 5, tapa: PLASTICO, faldon: PLASTICO_PATA, pata: PLASTICO_PATA });
  const U = girado ? fondo : ancho;
  const V = girado ? ancho : fondo;
  // Superficie blanca con borde azul claro y el hielo perforado.
  l.rectRedondeado(x + 3, y + 3, ancho - 6, fondo - 6, 4, 'azul-oficina-3');
  l.rectRedondeado(x + 4, y + 4, ancho - 8, fondo - 8, 3, 'neutro-7');
  const p = new Plano(l, x + 4, y + 4, U - 8, V - 8, girado);
  const Uf = U - 8;
  const Vf = V - 8;
  for (let v = 2; v < Vf - 2; v += 3) for (let u = 3 + (v % 2 === 0 ? 0 : 1) * 0; u < Uf - 3; u += 4) p.px(u, v, 'neutro-6');
  // Sombra interior arriba y a la izquierda del borde.
  l.rect(x + 5, y + 4, ancho - 10, 1, 'neutro-6');
  // Línea central roja y círculo.
  p.rect(Math.floor(Uf / 2), 1, 1, Vf - 2, 'rojo-3');
  p.elipse(Math.floor(Uf / 2) + 0.5, Math.floor(Vf / 2), 7, 7, 'rojo-suave-4');
  p.elipse(Math.floor(Uf / 2) + 0.5, Math.floor(Vf / 2), 6, 6, 'neutro-7');
  p.rect(Math.floor(Uf / 2), 1, 1, Vf - 2, 'rojo-3');
  // Dos porterías con su semicírculo, dibujadas aparte para que no se salgan de la superficie.
  const hielo = new Lienzo(l.ancho, l.alto);
  const ph = new Plano(hielo, x + 4, y + 4, U - 8, V - 8, girado);
  for (const lado of [0, 1]) {
    const uc = lado === 0 ? 0 : Uf - 1;
    ph.elipse(uc, Math.floor(Vf / 2), 7, 9, 'vidrio-2');
    ph.elipse(uc, Math.floor(Vf / 2), 6, 8, 'neutro-7');
    ph.rect(lado === 0 ? 0 : Uf - 2, Math.floor(Vf / 2) - 7, 2, 15, 'azul-oficina-0');
  }
  const mascara = new Lienzo(l.ancho, l.alto);
  mascara.rectRedondeado(x + 4, y + 4, ancho - 8, fondo - 8, 3, 'neutro-7');
  for (let yy = 0; yy < l.alto; yy++) for (let xx = 0; xx < l.ancho; xx++) {
    const hex = hielo.leerHex(xx, yy);
    if (hex !== null && mascara.esOpaco(xx, yy)) l.px(xx, yy, hex);
  }
  p.rect(Math.floor(Uf / 2), 1, 1, Vf - 2, 'rojo-3');
  p.elipse(Math.floor(Uf / 2) + 0.5, Math.floor(Vf / 2), 1, 1, 'rojo-2');
  // Mazos y disco.
  const [ax, ay] = p.pt(Math.floor(Uf * 0.2), Math.floor(Vf * 0.55));
  mazo(l, ax + 1, ay + 1, ['rojo-2', 'rojo-3', 'rojo-4']);
  const [bx, by] = p.pt(Math.floor(Uf * 0.78), Math.floor(Vf * 0.35));
  mazo(l, bx + 1, by + 1, ['vidrio-0', 'vidrio-1', 'vidrio-2']);
  const [dx, dy] = p.pt(Math.floor(Uf * 0.55), Math.floor(Vf * 0.62));
  l.elipse(dx + 1, dy + 1, 2, 2, 'neutro-1');
  l.px(dx, dy, 'neutro-3');
  // Marcador electrónico en el borde delantero.
  const mx = x + 8;
  const my = y + fondo - 1;
  l.rect(mx, my, 10, 3, 'neutro-1');
  l.rect(mx + 1, my + 1, 3, 1, 'planta-4');
  l.rect(mx + 6, my + 1, 3, 1, 'rojo-4');
  return cerrarSuelo(l, { contacto: contactoMesa(x, ancho, m) });
}

// ---------------------------------------------------------------------------
// Póker
// ---------------------------------------------------------------------------

const CUERO: Tonos = tonosDe('cuero', 0, 1, 2);
const CUERO_PATA: Tonos = tonosDe('madera-oscura', 0, 1, 2);

const FICHAS: readonly (readonly [string, string])[] = [
  ['rojo-3', 'rojo-1'],
  ['vidrio-1', 'vidrio-0'],
  ['tela-calida-3', 'tela-calida-1'],
  ['neutro-7', 'neutro-5'],
  ['planta-3', 'planta-1'],
];

export function dibujarPoker(orientacion: 'S' | 'E'): Lienzo {
  const girado = orientacion === 'E';
  const alto = girado ? 96 : 64;
  const l = new Lienzo(girado ? 64 : 96, alto);
  const { x, y, ancho, fondo } = medidas(girado, alto);
  const m = cuerpoMesa(l, { x, y, ancho, fondo, radio: girado ? 12 : 14, tapa: CUERO, faldon: CUERO_PATA, pata: CUERO_PATA, margenPata: girado ? 7 : 10 });
  const U = girado ? fondo : ancho;
  const V = girado ? ancho : fondo;
  const r = girado ? 9 : 11;
  // Paño verde oscuro con una línea de apuesta más clara.
  l.rectRedondeado(x + 4, y + 4, ancho - 8, fondo - 8, r, 'planta-0');
  l.rectRedondeado(x + 4, y + 4, ancho - 9, fondo - 9, r, 'planta-1');
  l.rect(x + 4 + r, y + 4, ancho - 8 - 2 * r, 1, 'planta-2');
  const p = new Plano(l, x + 4, y + 4, U - 8, V - 8, girado);
  const Uf = U - 8;
  const Vf = V - 8;
  // Línea de apuestas: un óvalo fino.
  const [ox, oy] = p.pt(Uf / 2, Vf / 2);
  if (girado) l.elipseBorde(ox, oy, Math.floor(Vf / 2) - 6, Math.floor(Uf / 2) - 8, 'planta-2');
  else l.elipseBorde(ox, oy, Math.floor(Uf / 2) - 8, Math.floor(Vf / 2) - 6, 'planta-2');
  // Seis puestos: dos cartas y una pila de fichas.
  const posiciones = girado
    ? [[0.2, 0], [0.5, 0], [0.8, 0], [0.2, 1], [0.5, 1], [0.8, 1]]
    : [[0.2, 0], [0.5, 0], [0.8, 0], [0.2, 1], [0.5, 1], [0.8, 1]];
  posiciones.forEach(([fu = 0, lado], i) => {
    const u = Math.round(Uf * fu);
    const v = lado === 0 ? 5 : Vf - 12;
    const [cx, cy] = p.pt(u, v);
    carta(l, cx - 3, cy, null);
    carta(l, cx + 1, cy + 1, i % 2 === 0 ? 'rojo-3' : 'neutro-1');
    const [fx, fy] = p.pt(u + (fu > 0.7 ? -11 : 9), v + 1);
    pilaFichas(l, fx, fy + 4, 1 + (i % 3), FICHAS[i % FICHAS.length] as readonly [string, string]);
  });
  // Cartas comunitarias al centro y fichas del bote.
  const [cx0, cy0] = p.pt(Math.round(Uf / 2) - 12, Math.round(Vf / 2) - 3);
  for (let i = 0; i < 5; i++) carta(l, cx0 + i * 5 - (girado ? 0 : 0), cy0, i < 3 ? (i === 1 ? 'neutro-1' : 'rojo-3') : i === 3 ? 'neutro-1' : 'rojo-3');
  const [bx, by] = p.pt(Math.round(Uf / 2) - 4, Math.round(Vf / 2) + 6);
  pilaFichas(l, bx - 4, by + 2, 2, FICHAS[0] as readonly [string, string]);
  pilaFichas(l, bx + 2, by + 3, 3, FICHAS[1] as readonly [string, string]);
  pilaFichas(l, bx + 8, by + 2, 2, FICHAS[2] as readonly [string, string]);
  // Botón del repartidor.
  const [rx, ry] = p.pt(Math.round(Uf * 0.34), 11);
  l.elipse(rx, ry, 2, 1, 'neutro-7');
  l.px(rx, ry, 'rojo-3');
  l.px(rx + 2, ry + 1, 'neutro-5');
  return cerrarSuelo(l, { contacto: contactoMesa(x, ancho, m) });
}

// ---------------------------------------------------------------------------
// Ajedrez (1 x 1)
// ---------------------------------------------------------------------------

/** Pieza de ajedrez de 3 x 4 (peón: 3 x 3) con su contorno: devuelve un lienzo de 5 x 6 con la base en la fila 4. */
function pieza(tipo: 'peon' | 'torre' | 'rey', claro: boolean): Lienzo {
  const p = new Lienzo(5, 6);
  const cuerpo = claro ? 'neutro-7' : 'neutro-2';
  const sombra = claro ? 'neutro-5' : 'neutro-1';
  const brillo = claro ? 'neutro-7' : 'neutro-4';
  if (tipo === 'peon') {
    p.rect(1, 3, 3, 2, cuerpo);
    p.px(2, 2, cuerpo);
    p.px(3, 4, sombra);
    p.px(1, 3, brillo);
  } else if (tipo === 'torre') {
    p.rect(1, 1, 3, 4, cuerpo);
    p.px(2, 1, null);
    p.rect(3, 2, 1, 3, sombra);
    p.px(1, 2, brillo);
  } else {
    p.rect(1, 2, 3, 3, cuerpo);
    p.px(2, 0, cuerpo).px(2, 1, cuerpo);
    p.px(1, 1, cuerpo).px(3, 1, cuerpo);
    p.rect(3, 3, 1, 2, sombra);
    p.px(1, 2, brillo);
  }
  return p.contorno(claro ? 'madera-oscura-1' : 'azul-oficina-0');
}

export function dibujarAjedrez(orientacion: 'S' | 'E'): Lienzo {
  const e = orientacion === 'E';
  const l = new Lienzo(32, 32);
  const x = 1;
  const y = 3;
  // Patas y canto.
  l.rect(x + 3, y + 20, 3, 6, 'madera-oscura-1');
  l.rect(x + 3, y + 20, 1, 6, 'madera-oscura-2');
  l.rect(x + 22, y + 20, 3, 6, 'madera-oscura-1');
  l.rect(x + 22, y + 20, 1, 6, 'madera-oscura-2');
  l.rect(x + 1, y + 18, 26, 3, 'madera-oscura-1');
  l.rect(x + 1, y + 18, 26, 1, 'madera-oscura-2');
  // Marco y tablero de 8 x 8 casillas de 3 x 2.
  l.rectRedondeado(x, y, 28, 20, 3, 'madera-oscura-2');
  l.rect(x + 1, y, 24, 1, 'madera-oscura-3');
  l.rect(x, y + 1, 1, 15, 'madera-oscura-3');
  l.rect(x + 2, y + 2, 24, 16, 'madera-oscura-0');
  for (let f = 0; f < 8; f++) {
    for (let c = 0; c < 8; c++) {
      const clara = (f + c + (e ? 1 : 0)) % 2 === 0;
      l.rect(x + 2 + c * 3, y + 2 + f * 2, 3, 2, clara ? 'crema-4' : 'madera-oscura-3');
    }
  }
  // Piezas: una partida a medias, distinta en cada orientación. `[columna, fila, tipo, claro]`.
  const piezas: Array<[number, number, 'peon' | 'torre' | 'rey', boolean]> = e
    ? [[1, 1, 'rey', false], [5, 2, 'torre', false], [3, 3, 'peon', false], [6, 5, 'peon', true], [2, 6, 'rey', true], [4, 5, 'torre', true]]
    : [[1, 2, 'torre', false], [4, 1, 'rey', false], [6, 3, 'peon', false], [2, 5, 'peon', true], [5, 6, 'rey', true], [1, 6, 'torre', true]];
  for (const [c, f, tipo, claro] of piezas) l.pegar(pieza(tipo, claro), x + 2 + c * 3 - 1, y + 2 + f * 2 + 1 - 4);
  return cerrarSuelo(l, { contacto: [x + 14, y + 25, 11, 1], largo: 2 });
}

// ---------------------------------------------------------------------------
// Registro
// ---------------------------------------------------------------------------

export function cuadrosMesas(): Cuadros {
  const c: Cuadros = new Map();
  registrar(c, 'mesa-billar', 'S', dibujarBillar('S'));
  registrar(c, 'mesa-billar', 'E', dibujarBillar('E'));
  registrar(c, 'mesa-air-hockey', 'S', dibujarAirHockey('S'));
  registrar(c, 'mesa-air-hockey', 'E', dibujarAirHockey('E'));
  registrar(c, 'mesa-poker', 'S', dibujarPoker('S'));
  registrar(c, 'mesa-poker', 'E', dibujarPoker('E'));
  registrar(c, 'mesa-ajedrez', 'S', dibujarAjedrez('S'));
  registrar(c, 'mesa-ajedrez', 'E', dibujarAjedrez('E'));
  return c;
}
