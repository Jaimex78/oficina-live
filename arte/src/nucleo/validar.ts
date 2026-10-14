/**
 * Validadores de calidad del arte. Devuelven listas de errores legibles en
 * español; una lista vacía significa que todo está bien.
 *
 * Controles (ver "Controles de calidad" en la nota de arte pixel):
 * - solo colores de la paleta,
 * - sin semitransparencia (alfa 0 o 255),
 * - tamaño en múltiplos de la casilla,
 * - en el atlas: cada sprite dentro del atlas, sin solapes y sin píxeles sueltos en el relleno.
 */

import { rgbAHex } from './color';
import type { Lienzo } from './lienzo';
import { infoMarcador } from './marcadores';
import { PALETA } from './paleta';
import type { Marco, Medidas } from './tipos';

export interface OpcionesValidacion {
  /**
   * Colores permitidos (hex). Por defecto, los 64 de la paleta global.
   * Para un caso especial pasa `[...Object.values(PALETA), '#...']` y deja
   * escrito por qué en el código que lo pide.
   */
  paleta?: Iterable<string>;
  /** Acepta además los 40 colores marcador de los personajes. */
  permitirMarcadores?: boolean;
  /** Exige que ancho y alto sean múltiplos de estas medidas (por ejemplo 32 x 32). */
  multiplo?: Medidas;
  /** Marca como error un lienzo sin ningún píxel visible. */
  noVacio?: boolean;
}

const PALETA_GLOBAL: ReadonlySet<string> = new Set(Object.values(PALETA).map((h) => h.toUpperCase()));

function conjuntoDePaleta(paleta: Iterable<string> | undefined): ReadonlySet<string> {
  if (paleta === undefined) return PALETA_GLOBAL;
  return new Set([...paleta].map((h) => h.toUpperCase()));
}

/** Revisa un lienzo y devuelve los problemas encontrados, uno por línea. */
export function validarLienzo(lienzo: Lienzo, opciones: OpcionesValidacion = {}): string[] {
  const errores: string[] = [];
  const permitidos = conjuntoDePaleta(opciones.paleta);
  const marcadores = opciones.permitirMarcadores ?? false;

  if (opciones.multiplo !== undefined) {
    const { ancho, alto } = opciones.multiplo;
    if (lienzo.ancho % ancho !== 0 || lienzo.alto % alto !== 0) {
      errores.push(`Tamaño ${lienzo.ancho}x${lienzo.alto}: no es múltiplo de ${ancho}x${alto}.`);
    }
  }

  // Se agrupa por color y por alfa para no inundar la lista con un error por píxel.
  const fuera = new Map<string, { cantidad: number; x: number; y: number }>();
  const parciales = new Map<number, { cantidad: number; x: number; y: number }>();
  const d = lienzo.datos;
  let opacos = 0;
  for (let y = 0; y < lienzo.alto; y++) {
    for (let x = 0; x < lienzo.ancho; x++) {
      const i = (y * lienzo.ancho + x) * 4;
      const a = d[i + 3] ?? 0;
      if (a === 0) continue;
      opacos++;
      if (a !== 255) {
        const previo = parciales.get(a);
        if (previo === undefined) parciales.set(a, { cantidad: 1, x, y });
        else previo.cantidad++;
        continue;
      }
      const hex = rgbAHex(d[i] ?? 0, d[i + 1] ?? 0, d[i + 2] ?? 0);
      if (permitidos.has(hex)) continue;
      if (marcadores && infoMarcador(hex) !== null) continue;
      const previo = fuera.get(hex);
      if (previo === undefined) fuera.set(hex, { cantidad: 1, x, y });
      else previo.cantidad++;
    }
  }

  for (const [hex, info] of fuera) {
    errores.push(
      `Color fuera de la paleta: ${hex} (${info.cantidad} ${info.cantidad === 1 ? 'píxel' : 'píxeles'}, el primero en x=${info.x}, y=${info.y}).`,
    );
  }
  for (const [alfa, info] of [...parciales].sort((a, b) => a[0] - b[0])) {
    errores.push(
      `Alfa parcial ${alfa}: ${info.cantidad} ${info.cantidad === 1 ? 'píxel' : 'píxeles'}, el primero en x=${info.x}, y=${info.y}. Solo se permite alfa 0 o 255.`,
    );
  }
  if (opciones.noVacio && opacos === 0) errores.push('El lienzo está vacío: no tiene ningún píxel visible.');
  return errores;
}

export interface OpcionesValidacionAtlas extends OpcionesValidacion {
  /**
   * Relleno transparente que debe haber entre sprites. Si se indica, cada
   * sprite debe estar a esa distancia mínima de los bordes del atlas y de
   * los otros sprites.
   */
  relleno?: number;
}

function seCruzan(a: Marco, b: Marco, separacion: number): boolean {
  return (
    a.x < b.x + b.w + separacion &&
    b.x < a.x + a.w + separacion &&
    a.y < b.y + b.h + separacion &&
    b.y < a.y + a.h + separacion
  );
}

/**
 * Revisa un atlas ya empaquetado: cada sprite (con su id en el mensaje), que
 * los marcos estén dentro, que no se solapen y que no haya píxeles visibles
 * fuera de los marcos (eso sería sangrado de textura).
 */
export function validarAtlas(
  atlas: Lienzo,
  frames: Readonly<Record<string, Marco>>,
  opciones: OpcionesValidacionAtlas = {},
): string[] {
  const errores: string[] = [];
  const ids = Object.keys(frames).sort();
  const { relleno: rellenoPedido, paleta: paletaPedida, ...demasOpciones } = opciones;
  const relleno = rellenoPedido ?? 0;
  // Se pasa a lista una sola vez: una paleta dada como generador solo se puede recorrer una vez.
  const opcionesSprite: OpcionesValidacion = {
    ...demasOpciones,
    ...(paletaPedida !== undefined ? { paleta: [...paletaPedida] } : {}),
  };

  for (const id of ids) {
    const m = frames[id] as Marco;
    const dentro = m.x >= 0 && m.y >= 0 && m.w > 0 && m.h > 0 && m.x + m.w <= atlas.ancho && m.y + m.h <= atlas.alto;
    if (!dentro) {
      errores.push(`[${id}] El marco (${m.x}, ${m.y}, ${m.w}x${m.h}) queda fuera del atlas de ${atlas.ancho}x${atlas.alto}.`);
      continue;
    }
    if (
      relleno > 0 &&
      (m.x < relleno || m.y < relleno || m.x + m.w + relleno > atlas.ancho || m.y + m.h + relleno > atlas.alto)
    ) {
      errores.push(`[${id}] Queda a menos de ${relleno} px del borde del atlas.`);
    }
    for (const problema of validarLienzo(atlas.recortar(m.x, m.y, m.w, m.h), opcionesSprite)) {
      errores.push(`[${id}] ${problema}`);
    }
  }

  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const a = frames[ids[i] as string] as Marco;
      const b = frames[ids[j] as string] as Marco;
      if (seCruzan(a, b, 0)) {
        errores.push(`[${ids[i]}] y [${ids[j]}] se solapan en el atlas.`);
      } else if (relleno > 0 && seCruzan(a, b, relleno)) {
        errores.push(`[${ids[i]}] y [${ids[j]}] quedan a menos de ${relleno} px entre sí.`);
      }
    }
  }

  // Todo píxel visible debe pertenecer a algún marco.
  const cubierto = new Uint8Array(atlas.ancho * atlas.alto);
  for (const id of ids) {
    const m = frames[id] as Marco;
    for (let y = Math.max(0, m.y); y < Math.min(atlas.alto, m.y + m.h); y++) {
      for (let x = Math.max(0, m.x); x < Math.min(atlas.ancho, m.x + m.w); x++) {
        cubierto[y * atlas.ancho + x] = 1;
      }
    }
  }
  let sueltos = 0;
  let primero: { x: number; y: number } | null = null;
  for (let y = 0; y < atlas.alto; y++) {
    for (let x = 0; x < atlas.ancho; x++) {
      const p = y * atlas.ancho + x;
      if ((atlas.datos[p * 4 + 3] ?? 0) === 0 || cubierto[p] === 1) continue;
      sueltos++;
      primero ??= { x, y };
    }
  }
  if (sueltos > 0 && primero !== null) {
    errores.push(
      `Hay ${sueltos} ${sueltos === 1 ? 'píxel visible' : 'píxeles visibles'} fuera de los marcos (sangrado), el primero en x=${primero.x}, y=${primero.y}.`,
    );
  }
  return errores;
}
