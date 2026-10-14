/**
 * Armado de una figura del personaje v5 a partir de capas: cuerpo base (con piel y cara), ropa, peinado y gafas, en cualquiera de
 * las 4 vistas (S frente, N espalda, I perfil izquierdo, D perfil derecho = espejo del I) y en reposo o en uno de los 4 cuadros de caminar.
 * Devuelve un lienzo de 32 x 64 (el del diseñador). Nada se publica: es solo para mirar la propuesta.
 */

import { Lienzo } from '../../nucleo';
import { LEYENDA, ANCHO, ALTO } from './datos-disenador';
import { CAPAS_DISENADOR, espejoCapa, moverCapa, unirCapas } from './disenador';
import type { Capa } from './disenador';
import { PEINADOS, pintarPeinado } from './peinados';
import { contornear } from './pelo';
import { caraFrente, caraPerfil, leyendaConPiel } from './rostro';
import { RAMPA_CHAQUETA, ROPA_COLOR, chaquetaEspalda, chaquetaPerfil, gafas, mangasCortas, recolorearRopa } from './ropa';
import { BASE_I, BASE_N, caminarFrontal, caminarPerfilIzquierdo, espejoRejilla, reboteCuadro } from './vistas';
import type { Cuadro, Dir } from './vistas';
import { BASE_S, aCapaRejilla, copiar } from './rejilla';
import { LETRAS_SHORTS_TIRANTES, sentadoEspalda, sentadoFrente, sentadoPerfil } from './sentado';
import type { Rejilla } from './rejilla';

export type Ropa = 'tirantes' | 'completa' | 'camiseta';
export interface Look {
  piel: number;
  cara: number;
  /** Índice en PEINADOS, o null para calvo. */
  peinado: number | null;
  ropa: Ropa;
  camiseta?: keyof typeof ROPA_COLOR;
  shorts?: keyof typeof ROPA_COLOR;
  gafas?: boolean;
}
export type PoseFigura = { tipo: 'quieto' } | { tipo: 'caminar'; cuadro: Cuadro } | { tipo: 'sentado' };

void RAMPA_CHAQUETA;

/** Capa de una rejilla con una leyenda propia. */
function capaDe(g: Rejilla, leyenda: Record<string, string>): Capa {
  const c: Capa = new Map();
  for (let y = 0; y < ALTO; y++) for (let x = 0; x < ANCHO; x++) {
    const ch = g[y]![x]!;
    if (ch === '.') continue;
    const h = leyenda[ch];
    if (!h) throw new Error(`Letra sin color: ${ch}`);
    c.set(y * ANCHO + x, h);
  }
  return c;
}

function lienzoDe(c: Capa): Lienzo {
  const l = new Lienzo(ANCHO, ALTO);
  for (const [k, v] of c) l.px(k % ANCHO, Math.floor(k / ANCHO), v);
  return l;
}

export interface Capas {
  atras: Capa;
  cuerpo: Capa;
  ropa: Capa[];
  frente: Capa;
  extra: Capa;
  contorno: Capa;
}

export function capasDeFigura(look: Look, dir: Dir, pose: PoseFigura): Capas {
  const vista = dir === 'D' ? 'I' : dir;
  const cuadro: Cuadro | null = pose.tipo === 'caminar' ? pose.cuadro : null;
  const b = cuadro === null ? 0 : reboteCuadro(cuadro);
  // 1. cuerpo base con cara y ropa de color
  let g: Rejilla = vista === 'S' ? copiar(BASE_S) : vista === 'N' ? copiar(BASE_N) : copiar(BASE_I);
  if (vista === 'S') caraFrente(g, look.cara);
  if (vista === 'I') caraPerfil(g, look.cara);
  let ley = leyendaConPiel(look.piel);
  if (look.ropa === 'camiseta') {
    const cam = ROPA_COLOR[look.camiseta ?? 'celeste']!, sho = ROPA_COLOR[look.shorts ?? 'beige']!;
    const yShorts = vista === 'I' ? 56 : 55;
    const extra = recolorearRopa(g, cam, sho, 46, yShorts);
    ley = { ...ley, ...extra };
    if (vista === 'S' || vista === 'N') mangasCortas(g, [{ x0: 6, x1: 10, y0: 47, y1: 50 }, { x0: 21, x1: 25, y0: 47, y1: 50 }]);
    else mangasCortas(g, [{ x0: 14, x1: 18, y0: 48, y1: 51 }]);
    ley = { ...ley, ...{ N: cam.luz, F: cam.base, L: cam.sombra, K: cam.oscuro } };
  }
  const cam = look.ropa === 'camiseta' ? { f: 'F', l: 'L', k: 'K' } : { f: 'f', l: 'l', k: 'k' };
  if (cuadro !== null) g = vista === 'I' ? caminarPerfilIzquierdo(cuadro, g, cam) : caminarFrontal(g, cuadro, vista === 'N');
  if (pose.tipo === 'sentado') {
    const letras = look.ropa === 'camiseta' ? { n: 'Q', f: 'R', l: 'S', k: 'T' } : LETRAS_SHORTS_TIRANTES;
    g = vista === 'S' ? sentadoFrente(g, letras) : vista === 'N' ? sentadoEspalda(g) : sentadoPerfil(g, letras, cam);
  }
  const cuerpo = capaDe(g, ley);

  // 2. ropa de vestuario (solo en reposo)
  const ropa: Capa[] = [];
  if (look.ropa === 'completa' && cuadro === null && pose.tipo !== 'sentado') {
    if (vista === 'S') ropa.push(CAPAS_DISENADOR.pantalon, CAPAS_DISENADOR.chaqueta);
    else if (vista === 'N') { const r = chaquetaEspalda(); ropa.push(r.pantalon, r.chaqueta); }
    else { const r = chaquetaPerfil(); ropa.push(r.pantalon, r.chaqueta); }
  }

  // 3. peinado
  let atras: Capa = new Map();
  let frente: Capa = new Map();
  if (look.peinado !== null) {
    const p = PEINADOS[look.peinado]!;
    if (p.id === 'p1' && vista === 'S') frente = CAPAS_DISENADOR.pelo;
    else { const r = pintarPeinado(p, vista); atras = r.atras; frente = r.frente; }
    if (b !== 0) { atras = moverCapa(atras, 0, b); frente = moverCapa(frente, 0, b); }
  }

  // 4. contorno de lo generado (el del diseñador ya lo trae)
  const generado = unirCapas(atras, vista === 'S' && look.peinado === 0 ? new Map() : frente, ...(look.ropa === 'completa' && vista !== 'S' ? ropa : []));
  const ocupado = new Set<number>([...cuerpo.keys(), ...generado.keys(), ...(vista === 'S' && look.peinado === 0 ? frente.keys() : [])]);
  const contorno = contornear(generado, ocupado);

  const extra = look.gafas ? gafas(vista === 'S' ? 'S' : vista === 'I' ? 'I' : 'N') : new Map();
  const capas: Capas = { atras, cuerpo, ropa, frente, extra: b !== 0 ? moverCapa(extra, 0, b) : extra, contorno };
  if (dir === 'D') {
    return { atras: espejoCapa(capas.atras), cuerpo: espejoCapa(capas.cuerpo), ropa: capas.ropa.map(espejoCapa), frente: espejoCapa(capas.frente), extra: espejoCapa(capas.extra), contorno: espejoCapa(capas.contorno) };
  }
  return capas;
}

export function figura(look: Look, dir: Dir, pose: PoseFigura = { tipo: 'quieto' }): Lienzo {
  const c = capasDeFigura(look, dir, pose);
  const todo = unirCapas(c.contorno, c.atras, c.cuerpo, ...c.ropa, c.frente, c.extra);
  return lienzoDe(todo);
}

void espejoRejilla; void aCapaRejilla; void LEYENDA;
