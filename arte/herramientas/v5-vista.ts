/** Utilidad de revisión del personaje v5: pega capas o lienzos en una hoja y la escribe como PNG (solo para mirar). */
import { Lienzo, dibujarTexto, escribirPng } from '../src/nucleo';
import type { Capa } from '../src/personaje/v5/disenador';
import { ALTO, ANCHO } from '../src/personaje/v5/datos-disenador';

export function capaALienzo32(c: Capa): Lienzo {
  const l = new Lienzo(ANCHO, ALTO);
  for (const [k, v] of c) l.px(k % ANCHO, Math.floor(k / ANCHO), v);
  return l;
}

export interface Celda { lienzo: Lienzo; etiqueta?: string }
/** Recorta la figura a la ventana (x, y, w, h) del lienzo de 32 x 64, la escala y las pone en una cuadrícula. */
export function hoja(celdas: Celda[], opciones: { columnas: number; escala: number; ventana?: [number, number, number, number]; fondo?: string; piso?: string; ruta: string }): void {
  const [vx, vy, vw, vh] = opciones.ventana ?? [0, 0, ANCHO, ALTO];
  const e = opciones.escala;
  const margen = 4, pie = 10;
  const cw = vw * e + margen, ch = vh * e + margen + pie;
  const filas = Math.ceil(celdas.length / opciones.columnas);
  const h = new Lienzo(opciones.columnas * cw + margen, filas * ch + margen);
  h.rect(0, 0, h.ancho, h.alto, opciones.fondo ?? '#6E6A7A');
  celdas.forEach((c, i) => {
    const x = margen + (i % opciones.columnas) * cw, y = margen + Math.floor(i / opciones.columnas) * ch;
    h.rect(x, y, vw * e, vh * e, opciones.piso ?? '#D9CBAA');
    h.pegar(c.lienzo.recortar(vx, vy, vw, vh).escalar(e), x, y);
    if (c.etiqueta) dibujarTexto(h, c.etiqueta.toUpperCase(), x + 1, y + vh * e + 2, '#F4F1FA', 1);
  });
  escribirPng(h, opciones.ruta);
}
