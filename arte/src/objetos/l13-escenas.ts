/**
 * Escenas de revisión del lote 13: exterior y juegos EN CONTEXTO, por familias, a escala 1 y a escala 3.
 *
 * `sala` pone cada objeto del lote en una sala grande (lo de piso en filas por familia, lo apoyado sobre mesas y la pizarra de
 * pared sobre un muro) y `comparacion` suma tres recortes a escala 3 para juzgar el detalle: árboles, agua y plantas, y juegos.
 */

import { ConstructorSala, INVENTARIO, type ObjetoCatalogo, type SalaMapa } from '@ol/shared';
import { Lienzo } from '../nucleo';
import { resolverCombinado, resolverDesdePublicados, type ResolverCuadro } from './compositor';
import { componerConPersonas } from './l8-personas';
import type { Cuadros } from './l8-comun';
import { FAMILIAS_LOTE_13, familiaDeRevision, type FamiliaLote13 } from './l13-todo';

/** Piezas que no cupieron en la última sala armada (solo para depurar la escena). */
export const OMITIDAS: string[] = [];

interface Puesto {
  id: string;
  x: number;
  y: number;
  o: 'U' | 'S';
}

const ANCHO = 34;

/** Reparte los objetos por familias: filas para lo de piso, mesas con lo apoyado y un muro para lo colgado. */
function planear(): { piezas: Puesto[]; muros: number[]; alto: number; filas: Record<FamiliaLote13, number> } {
  const piezas: Puesto[] = [];
  const muros: number[] = [];
  const filas = {} as Record<FamiliaLote13, number>;
  let y = 1;
  const lote = INVENTARIO.filter((o) => o.lote === 13);
  for (const familia of FAMILIAS_LOTE_13) {
    filas[familia] = y;
    const lista = lote.filter((o) => familiaDeRevision(o) === familia);
    const colgados = lista.filter((o) => o.montado === true);
    const apoyados = lista.filter((o) => o.apoyado === true);
    const suelto = lista.filter((o) => o.montado !== true && o.apoyado !== true);
    // Lo grande y lo chico en filas, de lo más alto a lo más bajo, con espacio para lo que sobresale.
    const ordenados = [...suelto].sort((a, b) => b.sobresale - a.sobresale);
    let x = 1;
    let altoFila = 0;
    let sobre = 0;
    for (const o of ordenados) {
      const alto = o.sobresale > 0 ? Math.ceil(o.sobresale / 32) : 0;
      if (x === 1 && altoFila === 0) {
        sobre = alto;
        y += sobre;
      }
      if (x + o.ancho > ANCHO - 1) {
        y += altoFila + 1;
        x = 1;
        altoFila = 0;
        sobre = alto;
        y += sobre;
      }
      piezas.push({ id: o.id, x, y, o: 'U' });
      x += o.ancho + 1;
      altoFila = Math.max(altoFila, o.alto);
    }
    y += altoFila + 1;
    // Pizarra de pared sobre un muro.
    if (colgados.length > 0) {
      y += 1;
      muros.push(y);
      colgados.forEach((o, k) => piezas.push({ id: o.id, x: 2 + k * 4, y, o: 'S' }));
      y += 3;
    }
    // Lo apoyado va sobre mesas de 3 casillas, tres por mesa.
    if (apoyados.length > 0) {
      y += 1;
      for (let i = 0; i < apoyados.length; i += 3) {
        const mx = 1 + (i / 3) * 4;
        piezas.push({ id: 'mesa-simple-3x1', x: mx, y, o: 'S' });
        apoyados.slice(i, i + 3).forEach((o, k) => piezas.push({ id: o.id, x: mx + k, y, o: 'U' }));
      }
      y += 2;
    }
    y += 1;
  }
  return { piezas, muros, alto: y + 2, filas };
}

export function salaDelLote13(): { sala: SalaMapa; filas: Record<FamiliaLote13, number> } {
  const { piezas, muros, alto, filas } = planear();
  const b = new ConstructorSala('lote13', 'Revisión del lote 13', ANCHO, alto);
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
  for (const m of muros) b.muro(0, m, ANCHO - 1, m);
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

/** La sala a escala 1 y, debajo, tres recortes a escala 3: árboles, agua y plantas, y juegos. */
export function escenasDelLote13(cuadros: Cuadros): EscenaDelLote[] {
  OMITIDAS.length = 0;
  const { sala, filas } = salaDelLote13();
  const margen = 40;
  const completa = componerConPersonas(sala, resolverDeSalas(cuadros), [], null, margen);
  const recorte = (fila: number, alto: number): Lienzo => completa.recortar(0, Math.max(0, margen + (fila - 1) * 32 - 8), 8 * 32, alto * 32);
  const recortes = [recorte(filas.arboles, 5), recorte(filas.jardin, 5), recorte(filas.juegos, 5)];
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
