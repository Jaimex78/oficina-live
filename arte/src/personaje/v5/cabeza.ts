/**
 * Piezas de la cabeza del catálogo v5: peinados (capas `pelo` y `atras`). Estáticas: un cuadro por vista; al caminar bajan con el rebote de
 * la cabeza (`REBOTE`). El contorno de lo que sobresale lo agrega `conSilueta`.
 */

import { ANCHO, LEYENDA } from './datos-disenador';
import type { Capa } from './disenador';
import { CABELLOS } from './cabello';
import type { PeinadoCatalogo } from './cabello';
import { pintarPelo } from './pelo';
import { NEGRO, conSilueta, ctxDe, mk } from './vestir';
import type { Ctx } from './vestir';

export const RAMPA_CABELLO: readonly string[] = [0, 1, 2, 3, 4].map((t) => mk('cabello', t));
/** Tonos del peinado del diseñador (d q o p r) a tono de marcador. */
const TONO_DISENADOR: Record<string, number> = { [LEYENDA.d!]: 0, [LEYENDA.q!]: 1, [LEYENDA.o!]: 2, [LEYENDA.p!]: 3, [LEYENDA.r!]: 4 };

/** Capa exacta del diseñador a marcadores de cabello (el contorno negro queda negro). */
function exactaAMarcadores(c: Capa): Capa {
  const o: Capa = new Map();
  for (const [k, v] of c) {
    if (v === NEGRO) { o.set(k, v); continue; }
    const t = TONO_DISENADOR[v];
    if (t === undefined) throw new Error(`Color del peinado exacto sin tono: ${v}`);
    o.set(k, mk('cabello', t));
  }
  return o;
}

export interface CapasPeinado { atras: Capa; frente: Capa }

/** Contorno de una masa que cae detrás del cuerpo: un anillo alrededor de su relleno (lo que queda bajo el cuerpo no se ve). */
function anillo(relleno: Capa): Capa {
  const out: Capa = new Map(relleno);
  for (const k of relleno.keys()) {
    const x = k % ANCHO;
    for (const n of [k - ANCHO, k + ANCHO, k - 1, k + 1]) {
      if (n < 0 || (n === k - 1 && x === 0) || (n === k + 1 && x === ANCHO - 1)) continue;
      if (!relleno.has(n)) out.set(n, NEGRO);
    }
  }
  return out;
}

export function capasPeinado(p: PeinadoCatalogo, vista: 'S' | 'N' | 'I', ctx: Ctx = ctxDe(vista, 0)): CapasPeinado {
  const v = p.vistas[vista];
  const semilla = p.id.length * 7 + p.id.charCodeAt(p.id.length - 1);
  const atrasRelleno = v.atras.length > 0 ? pintarPelo(v.atras, RAMPA_CABELLO, { semilla }) : new Map<number, string>();
  const atras = atrasRelleno.size > 0 ? anillo(atrasRelleno) : atrasRelleno;
  const exacta = p.exactas?.[vista];
  let frente: Capa;
  if (exacta) {
    frente = exactaAMarcadores(vista === 'I' ? PELO_I : exacta);
  } else {
    const relleno = pintarPelo(v.frente, RAMPA_CABELLO, { semilla: semilla + 3 });
    frente = conSilueta(ctx, relleno, new Set(atrasRelleno.keys()));
  }
  return { atras, frente };
}

import { PELO_P1_PERFIL } from './disenador';
const PELO_I = PELO_P1_PERFIL;

export const PEINADOS_V5: PeinadoCatalogo[] = CABELLOS;
