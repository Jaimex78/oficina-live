/**
 * Constructor del lote 7 (`objetos-lote7`, atlas `objetos-v8`), OBSOLETO: solo el escritorio largo de 4 casillas, que
 * sigue publicado porque hay mapas guardados que lo usan. Lo reemplaza `escritorio-3x1` del lote 8.
 * Archivos: `l7-escritorio.ts` y `l7-todo.ts`.
 */

import { itemsDe, publicarObjetos } from './comunes';
import { registrarConstructor } from '../construir';
import { construirLote7 } from './l7-todo';

registrarConstructor('objetos-lote7', (ctx) => {
  const { cuadros, terminados } = construirLote7();
  ctx.log(`${terminados.length} objeto terminado, ${cuadros.size} cuadros`);
  ctx.guardarHoja('objetos-lote7-escritorio.png', itemsDe(terminados, cuadros), { escala: 3, columnas: 2 });
  publicarObjetos(ctx, 'objetos-v8', terminados, cuadros);
});
