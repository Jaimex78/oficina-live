/**
 * Hoja de revisión de las sentadas (solo para mirar): cada familia de asiento en sus orientaciones, con el personaje v5 sentado, armado
 * exactamente como lo hace el motor (`web/src/mundo/personas.ts`): sprite de 32 x 64 anclado con la fila 61 en los pies, profundidad del
 * asiento + 0,6 y, de espaldas, la tapa del respaldo; con el campo `sentado` (corte) la banda de la imagen del asiento que se vuelve a dibujar por delante.
 *
 *   npx tsx arte/herramientas/hoja-sentadas.ts [antes|despues] [familia,...]    (SALIDA=ruta.png, ESCALA=4, TODOS=1 para los 65 objetos)
 */
import { tmpdir } from 'node:os';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { CASILLA, INVENTARIO, huellaDe, type Direccion, type ObjetoCatalogo } from '@ol/shared';
import { Lienzo, dibujarTexto, escribirPng, leerPng } from '../src/nucleo';
import { COLORES, PELOS, PIELES } from '../src/personaje/colores';
import { capasPeinado, PEINADOS_V5 } from '../src/personaje/v5/cabeza';
import { capaCuerpo, capaPrenda, lienzoDeCapas } from '../src/personaje/v5/armado5';
import type { Vista4 } from '../src/personaje/v5/armado5';
import { espejoCapa } from '../src/personaje/v5/disenador';
import { PRENDAS } from '../src/personaje/v5/prendas';

const RAIZ = new URL('../../', import.meta.url).pathname;
const CAT = join(RAIZ, 'shared/src/catalogo');
const PNG = join(RAIZ, 'web/public/assets/arte');

// ---------- atlas de objetos ----------
const frames = new Map<string, Lienzo>();
for (const f of readdirSync(CAT).filter((n) => /^objetos-v\d+(-\w+)?\.json$/.test(n))) {
  const j = JSON.parse(readFileSync(join(CAT, f), 'utf8')) as { archivo: string; frames: Record<string, { x: number; y: number; w: number; h: number }> };
  const atlas = leerPng(join(PNG, j.archivo));
  for (const [k, r] of Object.entries(j.frames)) if (!frames.has(k)) frames.set(k, atlas.recortar(r.x, r.y, r.w, r.h));
}

// ---------- maniquí ----------
const pr = (i: string) => PRENDAS.find((p) => p.id === i)!;
const color = (i: string): readonly string[] => COLORES.find((c) => c.id === i)!.rampa;
const peinado = PEINADOS_V5[Number(process.env.PEINADO ?? 6)]!;
const RAMPAS = { piel: PIELES[1]!.rampa, cabello: PELOS[1]!.rampa, ropaA: color('azul-violeta'), ropaB: color('beige'), pantalon: color('gris'), zapatos: color(process.env.ZAPATO ?? 'negro') };
const cacheFigura = new Map<string, Lienzo>();
function figura(dir: Direccion, cuadro = 5): Lienzo {
  const v: Vista4 = dir === 'S' ? 'S' : dir === 'N' ? 'N' : dir === 'O' ? 'I' : 'D';
  const llave = `${v}${cuadro}`;
  const c = cacheFigura.get(llave);
  if (c) return c;
  const b = (v === 'D' ? 'I' : v) as 'S' | 'N' | 'I';
  const p = capasPeinado(peinado, b);
  const f = (x: typeof p.frente) => (v === 'D' ? espejoCapa(x) : x);
  const capas = [f(p.atras), capaCuerpo(v, cuadro), capaPrenda(pr('abajo-pantalon'), v, cuadro), capaPrenda(pr('zapatos-tenis'), v, cuadro), capaPrenda(pr('arriba-camiseta'), v, cuadro), f(p.frente)];
  const l = lienzoDeCapas(capas, RAMPAS);
  cacheFigura.set(llave, l);
  return l;
}

// ---------- reglas ----------
export interface Reglas { dx: number; dy: number; corte: readonly [number, number] | null; pose: Direccion; desdeArriba?: number }
type Cual = (o: ObjetoCatalogo, mira: Direccion) => Reglas;

/** Lo que hace el motor antes del cambio: `sentado-anclas.ts` y la tapa de la silla desde la fila 20 solo de espaldas. */
const antes: Cual = (o, mira) => {
  const sinFrente = o.orientaciones.length === 1;
  const dy = sinFrente ? 2 : mira === 'N' ? 6 : mira === 'S' ? 3 : -3;
  return { dx: 0, dy, corte: mira === 'N' && !sinFrente ? [0, 0] : null, pose: mira, desdeArriba: mira === 'N' && !sinFrente ? 20 : undefined };
};

const FAMILIAS: Record<string, string[]> = {
  oficina: ['silla-oficina', 'silla-ejecutiva', 'silla-giratoria-industrial', 'silla-malla-ergonomica', 'sillon-gamer', 'silla-giratoria-madera', 'silla-oficina-delgada'],
  comedor: ['silla-comedor', 'silla-reunion', 'silla-comedor-industrial', 'silla-simple', 'silla-plastica', 'silla-cafe', 'silla-z', 'silla-auxiliar-moderna', 'silla-roble-curvo', 'silla-wabi-sabi', 'silla-modernista', 'silla-tallada'],
  clasica: ['silla-chippendale', 'silla-salon-antigua', 'silla-director', 'silla-barcelona', 'silla-camping', 'silla-jardin-plegable', 'silla-ratan', 'silla-adirondack', 'silla-perezosa', 'silla-espacial', 'silla-columpio'],
  butaca: ['butaca', 'sillon-rojo', 'butaca-knoll', 'butaca-art-deco', 'butaca-aviador', 'butaca-nube', 'butaca-acogedora', 'butaca-en-u', 'butaca-lecorbusier', 'sillon-lounger', 'sillon-huevo', 'sillon-huevo-mimbre'],
  sofa: ['sofa-2', 'sofa-3', 'sofa-l', 'sofa-cuero-moderno', 'sofa-antiguo', 'sofa-knoll', 'sofa-lecorbusier', 'sofa-art-deco', 'sofa-aviador', 'chaise-antigua'],
  modulo: ['modular-segmento', 'modular-exterior-segmento', 'modular-exterior-esquina', 'modular-esquina'],
  banca: ['banca-interior', 'banca-exterior', 'banca-parque', 'banca-jardin', 'banca-con-cojin'],
  puf: ['puff', 'puf-saco', 'banco', 'taburete'],
};

async function main(): Promise<void> {
  const modo = process.argv[2] ?? 'antes';
  const quien = process.argv[3]?.split(',');
  const escala = Number(process.env.ESCALA ?? 3);
  const cual: Cual = modo === 'antes' ? antes : ((await import(process.env.REGLAS ?? '../../shared/src/sentado')).reglasDeSentado as Cual);
  const ids = process.env.TODOS ? INVENTARIO.filter((o) => o.interaccion === 'sentarse').map((o) => o.id) : (quien ?? Object.keys(FAMILIAS)).flatMap((f) => (FAMILIAS[f] ? FAMILIAS[f]!.slice(0, Number(process.env.N ?? 3)) : [f]));
  const celdas: { l: Lienzo; et: string }[] = [];
  const [i0, i1] = (process.env.TRAMO ?? '0,999').split(',').map(Number) as [number, number];
  for (const id of ids.slice(i0, i1)) {
    const o = INVENTARIO.find((x) => x.id === id);
    if (!o) continue;
    const ors = o.orientaciones.length === 1 ? (['U'] as const) : (o.orientaciones as readonly string[]);
    for (const or of ors.filter((x) => !process.env.ORS || process.env.ORS.split(',').includes(x))) {
      const mira = (or === 'U' ? 'S' : or) as Direccion;
      const img = frames.get(`${id}@${or}`) ?? frames.get(`${id}@${or}~base`);
      if (!img) continue;
      const hu = huellaDe(o, or);
      const tiles = hu.ancho;
      const idx = tiles === 3 ? 1 : 0;
      const idy = hu.alto === 3 ? 1 : hu.alto - 1;
      const r = cual(o, mira);
      const W = tiles * CASILLA + 24, H = 70 + (hu.alto - 1) * CASILLA, ox = 12, oy = 34; // origen de la casilla (0,0) dentro de la celda
      const l = new Lienzo(W, H);
      l.rect(0, 0, W, H, '#D9CBAA');
      const huellaAlto = hu.alto;
      const imgX = ox, imgY = oy + huellaAlto * CASILLA - img.alto;
      l.pegar(img, imgX, imgY);
      const cx = ox + idx * CASILLA + CASILLA / 2 + r.dx;
      const pies = oy + idy * CASILLA + 24 + r.dy;
      l.pegar(figura(r.pose), cx - 16, pies - 62);
      if (r.corte) {
        const a = r.desdeArriba ?? Math.max(0, img.alto - r.corte[0]), b = r.desdeArriba !== undefined ? img.alto : Math.max(0, img.alto - r.corte[1]);
        const izq = Math.max(0, cx - 12 - imgX), der = Math.min(img.ancho, cx + 12 - imgX);
        if (mira === 'N') l.pegar(img.recortar(izq, a, der - izq, b - a), imgX + izq, imgY + a);
        else l.pegar(img.recortar(0, a, img.ancho, b - a), imgX, imgY + a);
      }
      celdas.push({ l, et: `${id.slice(0, 22)} ${or}` });
    }
  }
  const cols = Number(process.env.COLS ?? 8);
  const cw = (celdas.reduce((m, c) => Math.max(m, c.l.ancho), 0)) * escala + 4, ch = celdas.reduce((m, c) => Math.max(m, c.l.alto), 0) * escala + 14;
  const filas = Math.ceil(celdas.length / cols);
  const hoja = new Lienzo(cols * cw + 4, filas * ch + 4);
  hoja.rect(0, 0, hoja.ancho, hoja.alto, '#6E6A7A');
  celdas.forEach((c, i) => {
    const x = 4 + (i % cols) * cw, y = 4 + Math.floor(i / cols) * ch;
    hoja.pegar(c.l.escalar(escala), x, y);
    dibujarTexto(hoja, c.et.toUpperCase(), x + 1, y + ch - 11, '#F4F1FA', 1);
  });
  escribirPng(hoja, process.env.SALIDA ?? join(tmpdir(), 'oficina-live', `sentadas-${modo}.png`));
  console.log(celdas.length, 'celdas');
}
void main();
