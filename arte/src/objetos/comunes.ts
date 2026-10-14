/**
 * Herramientas comunes de los constructores de objetos: colores por variante, medidas esperadas,
 * verificación contra el inventario y publicación del atlas. Todos los grupos de objetos usan esto
 * para que el resultado sea uniforme.
 */

import { CASILLA, huellaDe, type ObjetoCatalogo } from '@ol/shared';
import { Lienzo, empaquetar, mapaEntreRampas, rampa, validarAtlas } from '../nucleo';
import type { ItemSprite } from '../nucleo';
import type { ContextoConstruccion } from '../construir';

/** Rampa de destino de cada variante de color. `base` no recolorea. Las rampas de origen son de 4 tonos salvo la madera (5). */
const DESTINOS_4: Record<string, readonly string[]> = {
  rojo: rampa('rojo').slice(0, 4),
  azul: rampa('vidrio'),
  verde: rampa('planta').slice(0, 4),
  amarillo: rampa('tela-calida'),
  naranja: rampa('maceta-terracota'),
  negro: rampa('neutro').slice(0, 4),
  blanco: rampa('neutro').slice(4, 8),
  gris: rampa('tela-gris'),
  morado: rampa('morado').slice(0, 4),
};

const DESTINOS_MADERA: Record<string, readonly string[]> = {
  madera: rampa('madera-clara'),
  blanco: rampa('neutro').slice(3, 8),
  negro: rampa('neutro').slice(0, 5),
};

/**
 * Recolorea un lienzo dibujado con `rampaBase` para la variante pedida.
 * - Telas, plásticos y metales (rampas de 4 tonos): rojo, azul, verde, amarillo, naranja, negro, blanco, gris.
 * - Madera (`madera-oscura` o `madera-clara`, 5 tonos): `madera`, `blanco` y `negro`.
 * Devuelve el mismo lienzo (copia) si la variante es `base`.
 */
export function recolorearVariante(lienzo: Lienzo, rampaBase: string, variante: string): Lienzo {
  if (variante === 'base') return lienzo.copiar();
  const esMadera = rampaBase.startsWith('madera');
  const destino = (esMadera ? DESTINOS_MADERA : DESTINOS_4)[variante];
  if (!destino) throw new RangeError(`No hay colores definidos para la variante "${variante}" sobre la rampa "${rampaBase}".`);
  return lienzo.recolorear(mapaEntreRampas(rampaBase, destino));
}

export interface FrameEsperado {
  id: string;
  /** Clave de orientación (`S`, `E`, `U`...) o máscara de vecinos (`0101`) en paredes con autotile. */
  clave: string;
  variante: string;
  ancho: number;
  alto: number;
}

/** Todos los cuadros que el inventario promete para un objeto, con su medida exacta en píxeles. */
export function framesEsperados(o: ObjetoCatalogo): FrameEsperado[] {
  const r: FrameEsperado[] = [];
  for (const [clave, porVariante] of Object.entries(o.frames)) {
    const h = o.autotile ? { ancho: 1, alto: 1 } : huellaDe(o, clave);
    for (const [variante, id] of Object.entries(porVariante)) {
      r.push({ id, clave, variante, ancho: h.ancho * CASILLA, alto: h.alto * CASILLA + o.sobresale });
    }
  }
  return r;
}

/** Lista de problemas: cuadros que faltan o miden distinto de lo que promete el inventario. Vacía si todo está bien. */
export function verificarObjeto(o: ObjetoCatalogo, cuadros: ReadonlyMap<string, Lienzo>): string[] {
  const errores: string[] = [];
  for (const f of framesEsperados(o)) {
    const l = cuadros.get(f.id);
    if (!l) {
      errores.push(`[${o.id}] falta el cuadro ${f.id}.`);
      continue;
    }
    if (l.ancho !== f.ancho || l.alto !== f.alto) errores.push(`[${o.id}] ${f.id} mide ${l.ancho}x${l.alto} y debe medir ${f.ancho}x${f.alto}.`);
  }
  return errores;
}

/** Cuadros de un conjunto de objetos como ítems listos para una hoja de contacto o un atlas. */
export function itemsDe(objetos: readonly ObjetoCatalogo[], cuadros: ReadonlyMap<string, Lienzo>): ItemSprite[] {
  const r: ItemSprite[] = [];
  for (const o of objetos) for (const f of framesEsperados(o)) {
    const lienzo = cuadros.get(f.id);
    if (lienzo) r.push({ id: f.id, lienzo });
  }
  return r;
}

/**
 * Verifica, empaqueta, valida y publica (con `--publicar`) el atlas de un grupo de objetos.
 * Lanza un error con todos los problemas si algo no coincide con el inventario o con la paleta.
 */
export function publicarObjetos(ctx: ContextoConstruccion, nombreAtlas: string, objetos: readonly ObjetoCatalogo[], cuadros: ReadonlyMap<string, Lienzo>): void {
  const problemas = objetos.flatMap((o) => verificarObjeto(o, cuadros));
  if (problemas.length > 0) throw new Error(`${problemas.length} problemas:\n${problemas.slice(0, 40).join('\n')}`);
  const items = itemsDe(objetos, cuadros);
  const { atlas, frames } = empaquetar(items, { anchoMax: 1024, relleno: 2 });
  const errores = validarAtlas(atlas, frames, { relleno: 2 });
  if (errores.length > 0) throw new Error(`Atlas inválido:\n${errores.slice(0, 40).join('\n')}`);
  ctx.log(`${objetos.length} objetos, ${items.length} cuadros, atlas ${atlas.ancho}x${atlas.alto}`);
  ctx.publicarAtlas(nombreAtlas, atlas, frames);
}
