/**
 * Escenas de revisión del lote 10: toda la decoración EN CONTEXTO, por familias, a escala 1 y a escala 3.
 *
 * `sala` pone cada objeto del lote en una sala grande (lo de piso en filas por familia, lo pequeño sobre mesas) y
 * `comparacion` suma tres recortes a escala 3 para juzgar el detalle contra la referencia de Gather: plantas, lámparas y
 * velas, y arte con museo.
 */

import { ConstructorSala, INVENTARIO, type ObjetoCatalogo, type SalaMapa } from '@ol/shared';
import { Lienzo } from '../nucleo';
import { resolverCombinado, resolverDesdePublicados, type ResolverCuadro } from './compositor';
import { componerConPersonas } from './l8-personas';
import type { Cuadros } from './l8-comun';
import { FAMILIAS_LOTE_10, familiaDeRevision, type FamiliaLote10 } from './l10-todo';

/** Piezas que no cupieron en la última sala armada (solo para depurar la escena). */
export const OMITIDAS: string[] = [];

interface Puesto {
  id: string;
  x: number;
  y: number;
  o: 'U' | 'S';
  v?: string;
}

const ANCHO = 30;

/** Reparte los objetos del lote por familias: filas para lo de piso y mesas con lo apoyado. Devuelve las piezas y el alto. */
function planear(): { piezas: Puesto[]; alto: number; filas: Record<FamiliaLote10, number> } {
  const piezas: Puesto[] = [];
  const filas = {} as Record<FamiliaLote10, number>;
  let y = 1;
  const lote = INVENTARIO.filter((o) => o.lote === 10);
  for (const familia of FAMILIAS_LOTE_10) {
    filas[familia] = y;
    const lista = lote.filter((o) => familiaDeRevision(o) === familia);
    const orient = (o: ObjetoCatalogo): 'U' | 'S' => (o.orientaciones[0] === 'U' ? 'U' : 'S');
    const apoyados = lista.filter((o) => o.apoyado === true);
    const suelto = lista.filter((o) => o.apoyado !== true);
    // Lo de piso de 1 x 1, ordenado de lo más alto a lo más bajo, en filas de 13 con una casilla de aire.
    const chicos = suelto.filter((o) => o.ancho === 1 && o.alto === 1).sort((a, b) => b.sobresale - a.sobresale);
    for (let i = 0; i < chicos.length; i += 14) {
      const fila = chicos.slice(i, i + 14);
      const gap = Math.ceil(Math.max(...fila.map((o) => o.sobresale)) / 32);
      y += gap;
      fila.forEach((o, k) => piezas.push({ id: o.id, x: 1 + k * 2, y, o: orient(o) }));
      y += 1;
    }
    // Lo grande, cada uno con su espacio.
    let x = 1;
    let altoFila = 0;
    const grandes = suelto.filter((o) => o.ancho > 1 || o.alto > 1);
    if (grandes.length > 0) y += Math.ceil(Math.max(...grandes.map((o) => o.sobresale)) / 32);
    for (const o of grandes) {
      if (x + o.ancho > ANCHO - 1) {
        x = 1;
        y += altoFila + 1 + Math.ceil(o.sobresale / 32);
        altoFila = 0;
      }
      const w = orient(o) === 'U' ? o.ancho : o.ancho;
      piezas.push({ id: o.id, x, y, o: orient(o) });
      x += w + 1;
      altoFila = Math.max(altoFila, o.alto);
    }
    if (grandes.length > 0) y += altoFila;
    // Lo apoyado va en mesas de 3 casillas, tres por mesa.
    if (apoyados.length > 0) {
      y += 2;
      let m = 0;
      for (let i = 0; i < apoyados.length; i += 3) {
        const mx = 1 + (m % 7) * 4;
        if (m > 0 && m % 7 === 0) y += 3;
        piezas.push({ id: 'mesa-simple-3x1', x: mx, y, o: 'S' });
        apoyados.slice(i, i + 3).forEach((o, k) => piezas.push({ id: o.id, x: mx + k, y, o: 'U' }));
        m++;
      }
      y += 1;
    }
    y += 1;
  }
  return { piezas, alto: y + 2, filas };
}

export function salaDelLote10(): { sala: SalaMapa; filas: Record<FamiliaLote10, number> } {
  const { piezas, alto, filas } = planear();
  const b = new ConstructorSala('lote10', 'Revisión del lote 10', ANCHO, alto);
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
  for (const p of piezas) b.poner(p.id, p.x, p.y, p.o, p.v ?? 'base');
  return { sala: b.construir(), filas };
}

export interface EscenaDelLote {
  nombre: string;
  imagen: Lienzo;
}

function resolverDeSalas(cuadros: Cuadros): ResolverCuadro {
  return resolverCombinado((id) => cuadros.get(id), resolverDesdePublicados());
}

/** La sala a escala 1 (dibujada a escala 2) y, debajo, tres recortes a escala 3: plantas, lámparas y arte. */
export function escenasDelLote10(cuadros: Cuadros): EscenaDelLote[] {
  OMITIDAS.length = 0;
  const { sala, filas } = salaDelLote10();
  const margen = 40;
  const completa = componerConPersonas(sala, resolverDeSalas(cuadros), [], null, margen);
  const recorte = (fila: number): Lienzo => completa.recortar(0, margen + (fila - 1) * 32 - 8, 8 * 32, 5 * 32);
  const recortes = [recorte(filas.plantas), recorte(filas.lamparas), recorte(filas.arte)];
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
