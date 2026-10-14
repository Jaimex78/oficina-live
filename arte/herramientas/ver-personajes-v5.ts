/**
 * Hoja de la PROPUESTA de personaje v5 (no publica nada: no toca el catálogo, el atlas v4, el motor, el servidor ni el creador).
 *
 *   npx tsx arte/herramientas/ver-personajes-v5.ts
 *
 * Escribe `arte/salida/personajes-v5-propuesta.png`:
 *   A  comparación de los 5 originales del diseñador (frente 09, 10, 11 y perfiles 12, 13): original | transcripción | diferencia
 *   B  cuerpo base en las 4 vistas, 5 pieles y 5 caras (frente y perfil)
 *   C  caminar de 4 cuadros por dirección y tiras del ciclo
 *   D  sentado en las tres orientaciones del juego, sobre los objetos reales del juego, con el desplazamiento que pide cada una
 *   E  6 peinados en 4 vistas
 *   F  vestuario de prueba (ropa completa y camiseta de color con shorts)
 */

import { Lienzo, dibujarTexto, escribirPng, rutaSalida } from '../src/nucleo';
import { GRUPOS_LOTE_9 } from '../src/objetos/l9-todo';
import { ANCHO, ALTO } from '../src/personaje/v5/datos-disenador';
import { BORDES_X_DERECHO, BORDES_X_IZQUIERDO, BORDES_Y_DERECHO, BORDES_Y_IZQUIERDO } from '../src/personaje/v5/datos-perfiles';
import { figura } from '../src/personaje/v5/figura';
import type { Look } from '../src/personaje/v5/figura';
import { PEINADOS } from '../src/personaje/v5/peinados';
import { NOMBRES_CARA } from '../src/personaje/v5/rostro';
import type { Cuadro, Dir } from '../src/personaje/v5/vistas';
import { comprobarTodo } from './verificar-disenador';

const FONDO = '#6E6A7A';
const PISO = '#D9CBAA';
const TXT = '#F4F1FA';
const TXT2 = '#C9C3D8';

const W = 1320;
let y = 8;
const filasLienzo: { l: Lienzo; x: number; y: number }[] = [];
const textos: { t: string; x: number; y: number; esc: number; c: string }[] = [];
const rects: { x: number; y: number; w: number; h: number; c: string }[] = [];

const texto = (t: string, x: number, yy: number, esc = 2, c = TXT): void => { textos.push({ t, x, y: yy, esc, c }); };
const poner = (l: Lienzo, x: number, yy: number): void => { filasLienzo.push({ l, x, y: yy }); };
const fondo = (x: number, yy: number, w: number, h: number, c = PISO): void => { rects.push({ x, y: yy, w, h, c }); };

/** Figura recortada a 30 x 44 (columnas 1..30, filas 20..63) escalada. */
function fig(look: Look, dir: Dir, pose: Parameters<typeof figura>[2] = { tipo: 'quieto' }, e = 4): Lienzo {
  return figura(look, dir, pose).recortar(1, 20, 30, 44).escalar(e);
}
const FW = (e: number): number => 30 * e;
const FH = (e: number): number => 44 * e;

// ---------- A. comparación con los originales ----------
function muestrear(l: Lienzo, cx: (c: number) => number, cy: (r: number) => number, cols: number, filas: number): (string | null)[][] {
  const out: (string | null)[][] = [];
  for (let r = 0; r < filas; r++) { const f: (string | null)[] = []; for (let c = 0; c < cols; c++) f.push(l.leerHex(cx(c), cy(r))); out.push(f); }
  return out;
}
function aLienzo(g: (string | null)[][]): Lienzo {
  const l = new Lienzo(g[0]!.length, g.length);
  g.forEach((f, r) => f.forEach((v, c) => { if (v) l.px(c, r, v); }));
  return l;
}

texto('PROPUESTA PERSONAJE V5 - ARTE BASE DE JAIME OROZCO (FRENTE Y PERFILES EXACTOS) - NADA PUBLICADO', 10, y, 2);
y += 18;
texto('A. LOS 5 ORIGINALES: ARCHIVO | TRANSCRIPCION POR CODIGO | DIFERENCIA (ROJO = PIXEL DISTINTO)', 10, y, 2);
y += 16;
const comps = comprobarTodo();
const E_A = 3;
let xA = 10;
const alturaA = 38 * E_A + 22;
comps.forEach((c, i) => {
  let go: Lienzo, gt: Lienzo, gd: Lienzo;
  let celdasDif = 0;
  if (i < 3) {
    const cols = 28, filas = 38;
    const mk = (l: Lienzo): (string | null)[][] => muestrear(l, (cc) => (cc + 2) * 4 + 2, (r) => (r + 26) * 4 + 2, cols, filas);
    const go0 = mk(c.original), gt0 = mk(c.transcripcion);
    go = aLienzo(go0); gt = aLienzo(gt0);
    gd = new Lienzo(cols, filas);
    go0.forEach((f, r) => f.forEach((v, cc) => { if (v !== gt0[r]![cc]) { celdasDif++; gd.px(cc, r, '#FF2040'); } else if (v) gd.px(cc, r, '#4A4A54'); }));
  } else {
    const bx = i === 3 ? BORDES_X_IZQUIERDO : BORDES_X_DERECHO;
    const by = i === 3 ? BORDES_Y_IZQUIERDO : BORDES_Y_DERECHO;
    const cols = 16, filas = 33;
    const mk = (l: Lienzo): (string | null)[][] => muestrear(l, (cc) => Math.floor((bx[cc]! + bx[cc + 1]!) / 2), (r) => Math.floor((by[r]! + by[r + 1]!) / 2), cols, filas);
    const go0 = mk(c.original), gt0 = mk(c.transcripcion);
    go = aLienzo(go0); gt = aLienzo(gt0);
    gd = new Lienzo(cols, filas);
    // la transcripción usa los colores del 09 (los PNG de perfil están corridos unos niveles): se compara por celda con el original reconstruido a raster
    go0.forEach((f, r) => f.forEach((v, cc) => { const t = gt0[r]![cc]; if ((v === null) !== (t === null)) { celdasDif++; gd.px(cc, r, '#FF2040'); } else if (v) gd.px(cc, r, '#4A4A54'); }));
  }
  const pw = go.ancho * E_A;
  const bloqueW = pw * 3 + 10;
  if (xA + bloqueW > W - 8) { xA = 10; y += alturaA + 4; }
  [go, gt, gd].forEach((l, k) => { fondo(xA + k * (pw + 3), y, pw, l.alto * E_A, k === 2 ? '#2A2A32' : PISO); poner(l.escalar(E_A), xA + k * (pw + 3), y); });
  texto(`${c.nombre.slice(0, 2)} ${['FRENTE CALVO', 'FRENTE CON PELO', 'FRENTE CHAQUETA', 'PERFIL IZQ', 'PERFIL DER'][i]}`, xA, y + go.alto * E_A + 3, 1, TXT);
  texto(`DIF ${c.pixelesDiferentes} PX (${celdasDif} CELDAS)`, xA, y + go.alto * E_A + 11, 1, c.pixelesDiferentes === 0 ? '#9BE3A0' : '#FF8090');
  xA += bloqueW + 14;
});
y += alturaA + 10;

// ---------- B. base, pieles y caras ----------
texto('B. CUERPO BASE DEL DISENADOR EN LAS 4 VISTAS (FRENTE EXACTO, PERFILES EXACTOS, ESPALDA DERIVADA)  -  FIGURA 20 X 33 PX DE JUEGO, LIENZO 32 X 64', 10, y, 2);
y += 16;
const E_B = 6;
const baseLook: Look = { piel: 1, cara: 0, peinado: null, ropa: 'tirantes' };
(['S', 'I', 'D', 'N'] as Dir[]).forEach((d, i) => {
  const x = 10 + i * (FW(E_B) + 8);
  fondo(x, y, FW(E_B), FH(E_B));
  poner(fig(baseLook, d, { tipo: 'quieto' }, E_B), x, y);
  texto({ S: 'FRENTE (EXACTO)', I: 'PERFIL IZQ (EXACTO)', D: 'PERFIL DER (EXACTO)', N: 'ESPALDA (DERIVADA)' }[d], x + 2, y + FH(E_B) - 10, 1, '#4A4458');
});
// medidas
const xm = 10 + 4 * (FW(E_B) + 8) + 6;
['MEDIDAS DEL DISENADOR (PX DE JUEGO)', '', 'FIGURA CALVA: 20 X 33 (FRENTE)', 'PERFIL: 16 X 33', 'CABEZA: 20 X 17 CON OREJAS', 'CRANEO 14 X 16, MANDIBULA 12', 'TORSO 10 X 9, BRAZOS 4 X 9', 'PIERNAS 3 X 7, 4 LIBRES ENTRE ELLAS', 'CABEZA = 51 % DE LA ALTURA', 'CON PELO: 22 X 35. CON CHAQUETA: 26 X 36', 'GATHER MEDIDO: 21 X 34 (PERFIL), 26 X 36 (FRENTE)', 'CAPTURAS GATHER A 8 PX POR PIXEL: SOLO SE MIDIERON'].forEach((t, k) => texto(t, xm, y + 4 + k * 14, 1, k === 0 ? TXT : TXT2));
y += FH(E_B) + 8;

texto('5 PIELES (CARA 1)  FRENTE Y PERFIL', 10, y, 1, TXT2);
y += 10;
const E_C = 4;
const cabeza = (look: Look, dir: Dir): Lienzo => figura(look, dir).recortar(dir === 'S' ? 5 : 8, 27, dir === 'S' ? 22 : 16, 20).escalar(E_C);
for (let p = 0; p < 5; p++) {
  const x = 10 + p * 250;
  const a = cabeza({ ...baseLook, piel: p }, 'S'), b = cabeza({ ...baseLook, piel: p }, 'I');
  fondo(x, y, a.ancho, a.alto); fondo(x + a.ancho + 4, y, b.ancho, b.alto);
  poner(a, x, y); poner(b, x + a.ancho + 4, y);
  texto(`PIEL ${p + 1}${p === 1 ? ' (DISENADOR)' : ''}`, x, y + a.alto + 3, 1, TXT2);
}
y += 20 * E_C + 14;
texto('5 CARAS (PIEL 2)  FRENTE Y PERFIL: LOS OJOS NO CAMBIAN, VARIAN PECAS, MANCHAS, BRILLO, CEJAS Y BOCA', 10, y, 1, TXT2);
y += 10;
for (let c = 0; c < 5; c++) {
  const x = 10 + c * 250;
  const a = cabeza({ ...baseLook, cara: c }, 'S'), b = cabeza({ ...baseLook, cara: c }, 'I');
  fondo(x, y, a.ancho, a.alto); fondo(x + a.ancho + 4, y, b.ancho, b.alto);
  poner(a, x, y); poner(b, x + a.ancho + 4, y);
  texto(NOMBRES_CARA[c]!.toUpperCase().slice(0, 28), x, y + a.alto + 3, 1, TXT2);
}
y += 20 * E_C + 16;

// ---------- C. caminar ----------
texto('C. CAMINAR: 4 CUADROS POR DIRECCION (CONTACTO, PASO, CONTACTO, PASO; BRAZOS Y PIERNAS OPUESTOS Y REBOTE DE 1 PX).  PERFIL DER = ESPEJO DEL IZQ', 10, y, 2);
y += 16;
const E_W = 4;
const caminar: Look = { piel: 1, cara: 0, peinado: 0, ropa: 'tirantes' };
const bloquesW: [Dir, string][][] = [[['S', 'FRENTE'], ['I', 'PERFIL IZQ']], [['N', 'ESPALDA'], ['D', 'PERFIL DER']]];
bloquesW.forEach((par) => {
  par.forEach(([d, nombre], k) => {
    for (let f = 0; f < 4; f++) {
      const x = 10 + k * (4 * (FW(E_W) + 6) + 20) + f * (FW(E_W) + 6);
      fondo(x, y, FW(E_W), FH(E_W));
      poner(fig(caminar, d, { tipo: 'caminar', cuadro: f as Cuadro }, E_W), x, y);
      texto(`${nombre} ${f + 1}`, x + 2, y + FH(E_W) - 8, 1, '#4A4458');
    }
  });
  y += FH(E_W) + 6;
});
// tiras: los 4 cuadros pegados al paso real (30 px) a escala 3
texto('TIRAS DEL CICLO A ESCALA 3 (FRENTE, PERFIL IZQ, ESPALDA)', 10, y, 1, TXT2);
y += 10;
(['S', 'I', 'N'] as Dir[]).forEach((d, k) => {
  const x0 = 10 + k * (4 * 24 * 3 + 40);
  fondo(x0, y, 4 * 24 * 3, 44 * 3);
  for (let f = 0; f < 4; f++) {
    const l = figura(caminar, d, { tipo: 'caminar', cuadro: f as Cuadro }).recortar(4, 20, 24, 44).escalar(3);
    poner(l, x0 + f * 24 * 3, y);
  }
});
y += 44 * 3 + 14;

// ---------- D. sentado ----------
texto('D. SENTADO EN LAS 3 ORIENTACIONES DEL JUEGO, SOBRE LOS OBJETOS REALES (CASILLA DE 32 PX)', 10, y, 2);
y += 16;
const objs = new Map<string, Lienzo>();
for (const g of ['sillas', 'sofas']) for (const [id, l] of GRUPOS_LOTE_9[g]!().entries()) objs.set(id, l as Lienzo);
interface Escena { silla: string; titulo: string; look: Look; dir: Dir; dx: number; dy: number; tapa?: number; nota: string }
const ESCENAS: Escena[] = [
  { silla: 'silla-giratoria-industrial@N', titulo: 'DE ESPALDAS: SILLA DE ESCRITORIO', look: { piel: 0, cara: 0, peinado: 0, ropa: 'camiseta', camiseta: 'amarillo', shorts: 'gris', gafas: true }, dir: 'N', dx: 0, dy: 6, tapa: 20, nota: 'TAPA DESDE FILA 20 DE LA SILLA' },
  { silla: 'butaca-knoll@S', titulo: 'DE FRENTE: BUTACA', look: { piel: 2, cara: 2, peinado: 2, ropa: 'camiseta', camiseta: 'celeste', shorts: 'beige' }, dir: 'S', dx: 0, dy: 3, nota: 'IGUAL EN SOFA (SU CASILLA)' },
  { silla: 'puf-saco', titulo: 'DE FRENTE: PUF', look: { piel: 3, cara: 4, peinado: 5, ropa: 'camiseta', camiseta: 'rojo', shorts: 'gris' }, dir: 'S', dx: 0, dy: 2, nota: 'BAJA 1 PX MENOS QUE BUTACA' },
  { silla: 'silla-comedor-industrial@E', titulo: 'PERFIL DER: SILLA DE COMEDOR', look: { piel: 1, cara: 3, peinado: 4, ropa: 'camiseta', camiseta: 'verde', shorts: 'beige' }, dir: 'D', dx: 0, dy: -3, nota: 'IGUAL EN BANCA @E' },
  { silla: 'silla-comedor-industrial@O', titulo: 'PERFIL IZQ: SILLA DE COMEDOR', look: { piel: 4, cara: 1, peinado: 1, ropa: 'camiseta', camiseta: 'azul', shorts: 'gris' }, dir: 'I', dx: 0, dy: -3, nota: 'IGUAL EN BANCA @O' },
];
const CW = 48, CH = 84, cellTop = 44, E_D = 4;
ESCENAS.forEach((e, i) => {
  const c = new Lienzo(CW, CH).rect(0, 0, CW, CH, PISO);
  const sil = objs.get(e.silla);
  if (!sil) throw new Error(`Falta ${e.silla}`);
  const sy = cellTop + 32 - sil.alto;
  c.rectBorde(8, cellTop, 32, 32, '#B3A582');
  c.pegar(sil, 8, sy);
  const ax = 8 + 16, ay = cellTop + 24;
  c.pegar(figura(e.look, e.dir, { tipo: 'sentado' }), ax - 16 + e.dx, ay - 62 + e.dy);
  if (e.tapa !== undefined) c.pegar(sil.recortar(0, e.tapa, 32, sil.alto - e.tapa), 8, sy + e.tapa);
  const x = 10 + i * (CW * E_D + 12);
  const rec = c.recortar(0, 16, CW, 66).escalar(E_D);
  poner(rec, x, y);
  texto(e.titulo, x, y + rec.alto + 4, 1, TXT);
  texto(`DX ${e.dx >= 0 ? '+' : ''}${e.dx}  DY ${e.dy >= 0 ? '+' : ''}${e.dy} PX`, x, y + rec.alto + 14, 1, '#9BE3A0');
  texto(e.nota, x, y + rec.alto + 24, 1, TXT2);
});
y += 66 * E_D + 40;
texto('DX, DY: DESPLAZAMIENTO DEL LIENZO DE 32 X 64 RESPECTO DE LA PERSONA DE PIE (PIES EN CENTRO DE CASILLA, 24 PX BAJO SU BORDE SUPERIOR; COLUMNA 16 Y BORDE INFERIOR DE LA FILA 61). + = MAS A LA DERECHA Y MAS ABAJO.', 10, y, 1, TXT2);
y += 14;

// ---------- E. peinados ----------
texto('E. SEIS PEINADOS EN 4 VISTAS: MASAS Y MECHONES POR CAPAS, 5 TONOS, BRILLO ARRIBA A LA IZQUIERDA, PUNTAS OSCURAS (EL 1 DE FRENTE ES EL EXACTO DEL DISENADOR)', 10, y, 2);
y += 16;
const E_E = 3;
const columnasE = 2;
const anchoBloque = 4 * (FW(E_E) + 4) + 10;
PEINADOS.forEach((p, i) => {
  const col = i % columnasE, fila = Math.floor(i / columnasE);
  const x0 = 10 + col * (anchoBloque + 50);
  const yy = y + fila * (FH(E_E) + 18);
  (['S', 'I', 'D', 'N'] as Dir[]).forEach((d, k) => {
    const x = x0 + k * (FW(E_E) + 4);
    fondo(x, yy, FW(E_E), FH(E_E));
    poner(fig({ piel: 1, cara: 0, peinado: i, ropa: 'tirantes' }, d, { tipo: 'quieto' }, E_E), x, yy);
  });
  texto(`${i + 1} ${p.nombre.toUpperCase()}`, x0, yy + FH(E_E) + 3, 1, TXT);
});
y += 3 * (FH(E_E) + 18) + 6;

// ---------- F. vestuario ----------
texto('F. VESTUARIO DE PRUEBA: ROPA COMPLETA (FRENTE = EXACTO DEL ARTE BASE + GAFAS; LAS DEMAS VISTAS, DERIVADAS) Y CAMISETA DE COLOR CON SHORTS', 10, y, 2);
y += 16;
const E_F = 5;
const trajes: Look[] = [
  { piel: 1, cara: 0, peinado: 0, ropa: 'completa', gafas: true },
  { piel: 2, cara: 2, peinado: 2, ropa: 'camiseta', camiseta: 'celeste', shorts: 'beige' },
];
trajes.forEach((lk, k) => {
  (['S', 'I', 'D', 'N'] as Dir[]).forEach((d, i) => {
    const x = 10 + k * (4 * (FW(E_F) + 6) + 30) + i * (FW(E_F) + 6);
    fondo(x, y, FW(E_F), FH(E_F));
    poner(fig(lk, d, { tipo: 'quieto' }, E_F), x, y);
  });
});
y += FH(E_F) + 6;
texto('CAPAS RECOLOREABLES: CUERPO/PIEL, CARA, PELO, CAMISETA, SHORTS O PANTALON, CHAQUETA, GAFAS', 10, y, 1, TXT2);
y += 16;

// ---------- salida ----------
const H = y + 8;
const hoja = new Lienzo(W, H).rect(0, 0, W, H, FONDO);
for (const r of rects) hoja.rect(r.x, r.y, r.w, r.h, r.c);
for (const f of filasLienzo) hoja.pegar(f.l, f.x, f.y);
for (const t of textos) dibujarTexto(hoja, t.t, t.x, t.y, t.c, t.esc);
escribirPng(hoja, `${rutaSalida()}/personajes-v5-propuesta.png`);
console.log(`hoja ${W}x${H}`);
for (const c of comps) console.log(c.nombre, 'dif raster', c.pixelesDiferentes);
void ANCHO; void ALTO;
