import type { ObjetoCatalogo } from '../arte';
import { LOTE_8 } from './l8';
import { LOTE_9 } from './l9';
import { LOTE_10 } from './l10';
import { LOTE_11 } from './l11';
import { LOTE_12 } from './l12';
import { LOTE_13 } from './l13';
import { LOTE_14 } from './l14';

/**
 * Lotes de objetos extra. Cada lote nuevo vive en su propio archivo `lN.ts` (`LOTE_N`) y se suma aquí con DOS líneas:
 * la importación y su lugar en la lista. El orden de la lista es el orden en que salen en `INVENTARIO`.
 * Ver `arte/GUIA-OBJETOS-V2.md`.
 */
export const LOTES_EXTRA: readonly (readonly ObjetoCatalogo[])[] = [LOTE_8, LOTE_9, LOTE_10, LOTE_11, LOTE_12, LOTE_13, LOTE_14];
