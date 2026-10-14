import type { ObjetoCatalogo } from '../arte';
import { MURO, def } from '../inventario-def';

/**
 * Lote 14: baños con cubículos (atlas `objetos-v15`). Pedido: cubículos para los inodoros, con una
 * puertica para privacidad. Ver `arte/GUIA-OBJETOS-V2.md` y `arte/GUIA-ARMADO-REALISTA.md`.
 *
 * Reglas del lote (las revisa `arte/tests/objetos-lote14.test.ts`):
 *  - Todo va en la pestaña «Baños» (`grupo: 'banos'`).
 *  - `divisor-cubiculo` y `divisor-urinario` son paredes que se unen entre sí (autotile de 16 máscaras) y con las paredes
 *    vecinas, como `divisor-bajo`, pero más altas (cubículo: 16 filas de más; urinario: 8). Variantes: gris (la base), azul y madera.
 *  - `puerta-cubiculo` es una abertura de una casilla que encaja en la línea de divisores, con `interaccion: 'puerta'`:
 *    la hoja se dibuja en código (`web/src/mundo/puertas.ts`) y se abre al acercarse y se cierra después de cruzar.
 *  - `espejo-bano`, `dispensador-papel`, `dispensador-jabon` y `secador-manos` van colgados de la pared (`montado`).
 *  - `lavabo-meson` es el mesón con dos lavabos sin el espejo del `lavamanos` de siempre (que lo lleva pegado): así el
 *    `espejo-bano` se cuelga de la pared encima. `lavamanos` sigue igual para los mapas guardados.
 */

const MATERIAL = ['base', 'azul', 'madera'];

export const LOTE_14: readonly ObjetoCatalogo[] = [
  def({ id: 'divisor-cubiculo', pared: 'muro', nombre: 'Divisor de cubículo', categoria: 'paredes', sobresale: 16, autotile: 'paredes4', variantes: MATERIAL, etiquetas: ['baño', 'cubículo', 'divisor', 'privacidad'], lote: 14, grupo: 'banos' }),
  def({ id: 'puerta-cubiculo', pared: 'abertura', nombre: 'Puerta de cubículo', categoria: 'paredes', sobresale: 16, orientaciones: ['S'], variantes: MATERIAL, bloquea: 'nada', interaccion: 'puerta', etiquetas: ['baño', 'cubículo', 'puerta', 'privacidad'], lote: 14, grupo: 'banos' }),
  def({ id: 'divisor-urinario', pared: 'muro', nombre: 'Divisor de urinarios', categoria: 'paredes', sobresale: 8, autotile: 'paredes4', variantes: MATERIAL, etiquetas: ['baño', 'urinario', 'divisor', 'panel'], lote: 14, grupo: 'banos' }),
  def({ id: 'papelera-bano', nombre: 'Papelera de baño', categoria: 'banos', variantes: ['base', 'blanco', 'negro'], etiquetas: ['baño', 'papelera', 'basura'], lote: 14, grupo: 'banos' }),
  def({ id: 'dispensador-papel', montado: true, nombre: 'Dispensador de papel', categoria: 'banos', bloquea: 'nada', orientaciones: MURO, variantes: ['base', 'negro'], etiquetas: ['baño', 'papel', 'toallas', 'pared'], lote: 14, grupo: 'banos' }),
  def({ id: 'dispensador-jabon', montado: true, nombre: 'Dispensador de jabón', categoria: 'banos', bloquea: 'nada', orientaciones: MURO, variantes: ['base', 'negro'], etiquetas: ['baño', 'jabón', 'pared'], lote: 14, grupo: 'banos' }),
  def({ id: 'secador-manos', montado: true, nombre: 'Secador de manos', categoria: 'banos', bloquea: 'nada', orientaciones: MURO, variantes: ['base', 'negro'], etiquetas: ['baño', 'secador', 'manos', 'pared'], lote: 14, grupo: 'banos' }),
  def({ id: 'espejo-bano', montado: true, nombre: 'Espejo de baño', categoria: 'banos', ancho: 2, bloquea: 'nada', sobresale: 16, orientaciones: MURO, variantes: ['base', 'negro', 'madera'], etiquetas: ['baño', 'espejo', 'lavamanos', 'pared'], lote: 14, grupo: 'banos' }),
  def({ id: 'lavabo-meson', nombre: 'Mesón con dos lavabos', categoria: 'banos', ancho: 2, sobresale: 2, orientaciones: MURO, etiquetas: ['baño', 'lavamanos', 'lavabo', 'mesón'], lote: 14, grupo: 'banos' }),
];

export const LOTE_14_DIVISORES: readonly ObjetoCatalogo[] = LOTE_14.filter((o) => o.pared === 'muro');
export const LOTE_14_ABERTURAS: readonly ObjetoCatalogo[] = LOTE_14.filter((o) => o.pared === 'abertura');
export const LOTE_14_COLGADOS: readonly ObjetoCatalogo[] = LOTE_14.filter((o) => o.montado === true);
