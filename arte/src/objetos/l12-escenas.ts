/**
 * Escenas de revisión del lote 12: toda la pared EN CONTEXTO, por familias, a escala 1 y a escala 3.
 *
 * `sala` cuelga cada objeto en galerías de pared (una hilera de muro por fila, con piso delante) y pone a los lados muros
 * verticales con piezas de una casilla en `E` y `O`. `comparacion` suma tres recortes a escala 3: ventanas, relojes y cuadros,
 * y luces.
 */

import { ConstructorSala, INVENTARIO, type SalaMapa } from '@ol/shared';
import { Lienzo } from '../nucleo';
import { resolverCombinado, resolverDesdePublicados, type ResolverCuadro } from './compositor';
import { componerConPersonas } from './l8-personas';
import type { Cuadros } from './l8-comun';
import { FAMILIAS_LOTE_12, familiaDeRevision, type FamiliaLote12 } from './l12-todo';

/** Piezas que no cupieron en la última sala armada (solo para depurar la escena). */
export const OMITIDAS: string[] = [];

interface Puesto {
  id: string;
  x: number;
  y: number;
  o: 'S' | 'E' | 'O';
}

const ANCHO = 34;
const SEPARACION = 5;

/** Reparte los objetos por familias en hileras de muro. Devuelve las piezas, las hileras de muro y el alto. */
function planear(): { piezas: Puesto[]; hileras: number[]; alto: number; filas: Record<FamiliaLote12, number> } {
  const piezas: Puesto[] = [];
  const hileras: number[] = [];
  const filas = {} as Record<FamiliaLote12, number>;
  let y = 2;
  const lote = INVENTARIO.filter((o) => o.lote === 12);
  for (const familia of FAMILIAS_LOTE_12) {
    filas[familia] = y;
    let x = 2;
    hileras.push(y);
    const lista = lote.filter((o) => familiaDeRevision(o) === familia);
    let k = 0;
    for (const o of lista) {
      const sepVentana = o.pared === 'abertura' ? 1 : 0;
      if (x + o.ancho > ANCHO - 2) {
        x = 2;
        y += SEPARACION;
        hileras.push(y);
      }
      piezas.push({ id: o.id, x, y, o: 'S' });
      x += o.ancho + 1 + sepVentana;
      k++;
    }
    void k;
    y += SEPARACION;
  }
  // Laterales: una pieza de una casilla en E (muro izquierdo) y en O (muro derecho) por hilera, en el piso de debajo.
  const unaCasilla = lote.filter((o) => o.ancho === 1 && o.pared !== 'abertura');
  hileras.forEach((h, i) => {
    const a = unaCasilla[(i * 2) % unaCasilla.length];
    const b = unaCasilla[(i * 2 + 1) % unaCasilla.length];
    if (a !== undefined) piezas.push({ id: a.id, x: 0, y: h + 2, o: 'E' });
    if (b !== undefined) piezas.push({ id: b.id, x: ANCHO - 1, y: h + 2, o: 'O' });
  });
  return { piezas, hileras, alto: y, filas };
}

export function salaDelLote12(): { sala: SalaMapa; filas: Record<FamiliaLote12, number> } {
  const { piezas, hileras, alto, filas } = planear();
  const b = new ConstructorSala('lote12', 'Revisión del lote 12', ANCHO, alto);
  // En una escena de revisión una pieza que no cabe se omite (y se anota) en lugar de tumbar la escena.
  const poner = b.poner.bind(b);
  b.poner = (...a: Parameters<typeof poner>) => {
    try {
      return poner(...a);
    } catch (e) {
      OMITIDAS.push(String(e instanceof Error ? e.message : e));
      return b;
    }
  };
  b.piso(0, 0, ANCHO, alto, 'piso-alfombra-gris');
  for (const h of hileras) b.muro(0, h, ANCHO - 1, h);
  b.muro(0, 1, 0, alto - 1).muro(ANCHO - 1, 1, ANCHO - 1, alto - 1);
  for (const p of piezas) b.poner(p.id, p.x, p.y, p.o, 'base');
  return { sala: b.construir(), filas };
}

export interface EscenaDelLote {
  nombre: string;
  imagen: Lienzo;
}

function resolverDeSalas(cuadros: Cuadros): ResolverCuadro {
  return resolverCombinado((id) => cuadros.get(id), resolverDesdePublicados());
}

/** La sala a escala 1 y, debajo, tres recortes a escala 3: ventanas, relojes y cuadros, luces. */
export function escenasDelLote12(cuadros: Cuadros): EscenaDelLote[] {
  OMITIDAS.length = 0;
  const { sala, filas } = salaDelLote12();
  const margen = 40;
  const completa = componerConPersonas(sala, resolverDeSalas(cuadros), [], null, margen);
  const recorte = (fila: number, desdeX = 0): Lienzo => completa.recortar(desdeX * 32, margen + (fila - 2) * 32 - 8, 8 * 32, 4 * 32);
  const recortes = [recorte(filas.ventanas, 1), recorte(filas.arte, 1), recorte(filas.luces, 1)];
  const ancho3 = recortes.reduce((n, r) => n + r.ancho * 3 + 8, 8);
  const alto3 = Math.max(...recortes.map((r) => r.alto * 3)) + 8;
  const hoja = new Lienzo(Math.max(completa.ancho + 8, ancho3), completa.alto + 12 + alto3);
  hoja.rect(0, 0, hoja.ancho, hoja.alto, '#2B2B31');
  hoja.pegar(completa, 4, 4);
  let x = 4;
  for (const r of recortes) {
    hoja.pegar(r.escalar(3), x, completa.alto + 12);
    x += r.ancho * 3 + 8;
  }
  return [
    { nombre: 'sala', imagen: completa },
    { nombre: 'comparacion', imagen: hoja },
  ];
}
