/**
 * Hoja de contacto: todos los sprites en una sola imagen, ampliados y con su
 * id escrito debajo. Sirve para revisar el arte.
 *
 * La hoja es una vista previa, no un asset: usa colores que no tienen que
 * estar en la paleta (fondo, rejilla, texto).
 */

import { luminancia, mezclarHex } from './color';
import { ALTO_GLIFO, anchoTexto, dibujarTexto } from './fuente';
import { Lienzo, LADO_MAXIMO } from './lienzo';
import { PREVISUALIZACION_MARCADORES, contarMarcadores, recolorearConRampas } from './marcadores';
import { RAMPAS, color as colorDePaleta } from './paleta';
import type { NombreRampa } from './paleta';
import type { ColorEntrada, ItemSprite } from './tipos';

export interface OpcionesHojaContacto {
  /** Cuántas veces se amplía cada sprite. Por defecto 2. */
  escala?: number;
  /** Sprites por fila. Si no se indica, se llenan filas hasta `anchoMax`. */
  columnas?: number;
  /** Color de fondo (hex o paleta). Por defecto un gris medio neutro. */
  fondo?: ColorEntrada;
  /** Lado de la rejilla en píxeles del sprite (32 por defecto). `false` o `0` la apaga. */
  rejilla?: number | false;
  /** Ancho máximo de la hoja cuando no se fijan columnas. Por defecto 1600 px. */
  anchoMax?: number;
  /** Margen alrededor de cada sprite, en píxeles de la hoja. Por defecto 8. */
  margen?: number;
  /** Escribe el id debajo de cada sprite. Por defecto sí. */
  etiquetas?: boolean;
  /** Escribe también las medidas (por ejemplo 64X32). Por defecto sí. */
  mostrarTamano?: boolean;
  /** Escala de la fuente de las etiquetas. Por defecto 2. */
  escalaTexto?: number;
  /**
   * Muestra los colores marcador de los personajes con colores de vista
   * previa reconocibles (piel, cabello, ropa...). Por defecto sí. Solo afecta
   * a la hoja, nunca a los sprites.
   */
  marcadoresVisibles?: boolean;
}

const FONDO_POR_DEFECTO = '#7A7A84';
const ANCHO_MAX_ETIQUETA = 240;

function recortarEtiqueta(texto: string, anchoDisponible: number, escalaTexto: number): string {
  if (anchoTexto(texto, escalaTexto) <= anchoDisponible) return texto;
  let t = texto;
  while (t.length > 1 && anchoTexto(`${t}..`, escalaTexto) > anchoDisponible) t = t.slice(0, -1);
  return `${t}..`;
}

/**
 * Arma la hoja de contacto. Los sprites van en el orden recibido, de
 * izquierda a derecha y de arriba abajo, alineados arriba a la izquierda de
 * su celda para que la rejilla de casillas coincida con el sprite.
 */
export function hojaContacto(items: readonly ItemSprite[], opciones: OpcionesHojaContacto = {}): Lienzo {
  if (items.length === 0) throw new RangeError('No hay sprites para la hoja de contacto.');
  const escala = Math.max(1, Math.floor(opciones.escala ?? 2));
  const margen = Math.max(0, Math.floor(opciones.margen ?? 8));
  const escalaTexto = Math.max(1, Math.floor(opciones.escalaTexto ?? 2));
  const etiquetas = opciones.etiquetas ?? true;
  const mostrarTamano = opciones.mostrarTamano ?? true;
  const rejilla = opciones.rejilla === undefined ? 32 : opciones.rejilla === false ? 0 : Math.floor(opciones.rejilla);
  const anchoMax = opciones.anchoMax ?? 1600;
  const marcadoresVisibles = opciones.marcadoresVisibles ?? true;
  const fondo = colorDePaleta(opciones.fondo === undefined || opciones.fondo === null ? FONDO_POR_DEFECTO : opciones.fondo);

  const claro = luminancia(fondo) > 0.35;
  const colorTexto = claro ? '#14141A' : '#F4F4F8';
  const colorTextoSuave = mezclarHex(fondo, colorTexto, 0.62);
  const colorRejilla = mezclarHex(fondo, claro ? '#000000' : '#FFFFFF', 0.16);

  const altoLinea = ALTO_GLIFO * escalaTexto;
  const separacion = 4;

  interface Celda {
    item: ItemSprite;
    anchoSprite: number;
    altoSprite: number;
    anchoRejilla: number;
    altoRejilla: number;
    etiqueta: string;
    tamano: string;
    ancho: number;
    alto: number;
  }

  const celdas: Celda[] = items.map((item) => {
    const anchoSprite = item.lienzo.ancho * escala;
    const altoSprite = item.lienzo.alto * escala;
    const anchoRejilla = rejilla > 0 ? Math.ceil(item.lienzo.ancho / rejilla) * rejilla * escala : anchoSprite;
    const altoRejilla = rejilla > 0 ? Math.ceil(item.lienzo.alto / rejilla) * rejilla * escala : altoSprite;
    const etiqueta = recortarEtiqueta(item.id, Math.max(anchoRejilla, ANCHO_MAX_ETIQUETA), escalaTexto);
    const tamano = `${item.lienzo.ancho}X${item.lienzo.alto}`;
    const anchoEtiqueta = etiquetas ? Math.max(anchoTexto(etiqueta, escalaTexto), mostrarTamano ? anchoTexto(tamano, escalaTexto) : 0) : 0;
    const altoEtiquetas = etiquetas ? separacion + altoLinea + (mostrarTamano ? 2 + altoLinea : 0) : 0;
    return {
      item,
      anchoSprite,
      altoSprite,
      anchoRejilla,
      altoRejilla,
      etiqueta,
      tamano,
      ancho: Math.max(anchoRejilla, anchoEtiqueta) + 2 * margen,
      alto: altoRejilla + altoEtiquetas + 2 * margen,
    };
  });

  // Reparto en filas.
  const filas: Celda[][] = [];
  let actual: Celda[] = [];
  let anchoActual = 0;
  for (const celda of celdas) {
    const llena =
      opciones.columnas !== undefined
        ? actual.length >= opciones.columnas
        : actual.length > 0 && anchoActual + celda.ancho > anchoMax;
    if (llena) {
      filas.push(actual);
      actual = [];
      anchoActual = 0;
    }
    actual.push(celda);
    anchoActual += celda.ancho;
  }
  if (actual.length > 0) filas.push(actual);

  const anchoHoja = Math.max(...filas.map((f) => f.reduce((suma, c) => suma + c.ancho, 0)));
  const altoHoja = filas.reduce((suma, f) => suma + Math.max(...f.map((c) => c.alto)), 0);
  if (anchoHoja > LADO_MAXIMO || altoHoja > LADO_MAXIMO) {
    throw new RangeError(
      `La hoja de contacto saldría de ${anchoHoja}x${altoHoja} px (máximo ${LADO_MAXIMO}). Baja la escala o reparte los sprites en varias hojas.`,
    );
  }

  const hoja = new Lienzo(anchoHoja, altoHoja).rect(0, 0, anchoHoja, altoHoja, fondo);
  let y = 0;
  for (const fila of filas) {
    let x = 0;
    const altoFila = Math.max(...fila.map((c) => c.alto));
    for (const celda of fila) {
      const x0 = x + margen;
      const y0 = y + margen;
      if (rejilla > 0) {
        const paso = rejilla * escala;
        for (let gx = 0; gx <= celda.anchoRejilla; gx += paso) {
          hoja.rect(x0 + Math.min(gx, celda.anchoRejilla - 1), y0, 1, celda.altoRejilla, colorRejilla);
        }
        for (let gy = 0; gy <= celda.altoRejilla; gy += paso) {
          hoja.rect(x0, y0 + Math.min(gy, celda.altoRejilla - 1), celda.anchoRejilla, 1, colorRejilla);
        }
      }
      const base =
        marcadoresVisibles && contarMarcadores(celda.item.lienzo) > 0
          ? recolorearConRampas(celda.item.lienzo, PREVISUALIZACION_MARCADORES)
          : celda.item.lienzo;
      hoja.pegar(base.escalar(escala), x0, y0);
      if (etiquetas) {
        let yTexto = y0 + celda.altoRejilla + separacion;
        dibujarTexto(hoja, celda.etiqueta, x0, yTexto, colorTexto, escalaTexto);
        if (mostrarTamano) {
          yTexto += altoLinea + 2;
          dibujarTexto(hoja, celda.tamano, x0, yTexto, colorTextoSuave, escalaTexto);
        }
      }
      x += celda.ancho;
    }
    y += altoFila;
  }
  return hoja;
}

/**
 * Hoja con toda la paleta: una fila por rampa, del tono más oscuro (0) al más
 * claro, con el número de tono y el código hex dentro de cada muestra.
 * Sirve para revisar la paleta de un vistazo.
 */
export function hojaPaleta(opciones: { fondo?: ColorEntrada } = {}): Lienzo {
  const fondo = colorDePaleta(opciones.fondo === undefined || opciones.fondo === null ? '#2B2B31' : opciones.fondo);
  const nombres = Object.keys(RAMPAS) as NombreRampa[];
  const anchoMuestra = 40;
  const altoMuestra = 30;
  const separacion = 3;
  const margen = 8;
  const escalaNombre = 2;
  const anchoNombres = Math.max(...nombres.map((n) => anchoTexto(n, escalaNombre))) + 12;
  const maxTonos = Math.max(...nombres.map((n) => RAMPAS[n].length));
  const ancho = margen * 2 + anchoNombres + maxTonos * (anchoMuestra + separacion);
  const alto = margen * 2 + nombres.length * (altoMuestra + separacion);
  const hoja = new Lienzo(ancho, alto).rect(0, 0, ancho, alto, fondo);
  const colorNombre = luminancia(fondo) > 0.35 ? '#14141A' : '#F4F4F8';
  nombres.forEach((nombre, fila) => {
    const y = margen + fila * (altoMuestra + separacion);
    dibujarTexto(hoja, nombre, margen, y + Math.floor((altoMuestra - ALTO_GLIFO * escalaNombre) / 2), colorNombre, escalaNombre);
    (RAMPAS[nombre] as readonly string[]).forEach((hex, tono) => {
      const x = margen + anchoNombres + tono * (anchoMuestra + separacion);
      hoja.rect(x, y, anchoMuestra, altoMuestra, hex);
      const tinta = luminancia(hex) > 0.35 ? '#14141A' : '#F4F4F8';
      dibujarTexto(hoja, String(tono), x + 3, y + 3, tinta, 2);
      dibujarTexto(hoja, hex.slice(1), x + 3, y + altoMuestra - ALTO_GLIFO - 3, tinta, 1);
    });
  });
  return hoja;
}
