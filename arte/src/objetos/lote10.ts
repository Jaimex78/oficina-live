/**
 * Constructor del lote 10 (`objetos-lote10`, atlas `objetos-v11`): decoración de Gather v2 (plantas, lámparas, arte y museo,
 * aparatos, deportes y piezas de temporada). Ver `arte/GUIA-ESTILO-GATHER-V2.md` y `arte/GUIA-OBJETOS-V2.md`.
 *
 * Archivos: `l10-comun.ts` (ayudas y piezas que se repiten), `l10-plantas.ts`, `l10-luz.ts` (lámparas, velas, museo y
 * jarrones), `l10-piezas.ts` (aparatos y objetos de oficina y hogar), `l10-deportes.ts` (deportes, juegos y temporada),
 * `l10-todo.ts` (junta los grupos) y `l10-escenas.ts` (salas de revisión). Este archivo solo registra el constructor.
 * Solo se publican los objetos con TODOS sus cuadros.
 */

import { itemsDe, publicarObjetos } from './comunes';
import { registrarConstructor } from '../construir';
import { escenasDelLote10 } from './l10-escenas';
import { FAMILIAS_LOTE_10, construirLote10, familiaDeRevision } from './l10-todo';

registrarConstructor('objetos-lote10', (ctx) => {
  const { cuadros, objetos, terminados, pendientes } = construirLote10();
  ctx.log(`${terminados.length} de ${objetos.length} objetos terminados, ${cuadros.size} cuadros dibujados`);
  if (pendientes.length > 0) ctx.log(`pendientes: ${pendientes.map((o) => o.id).join(', ')}`);

  // Una hoja de revisión por familia: solo la variante base de cada orientación.
  for (const familia of FAMILIAS_LOTE_10) {
    const lista = terminados.filter((o) => familiaDeRevision(o) === familia);
    const items = itemsDe(lista, cuadros).filter((i) => !i.id.includes('~'));
    ctx.guardarHoja(`objetos-lote10-${familia}.png`, items, { escala: 3, columnas: 8 });
  }
  for (const { nombre, imagen } of escenasDelLote10(cuadros)) ctx.guardarPng(`objetos-lote10-escena-${nombre}.png`, imagen);

  // Un solo atlas: todo el lote mide menos de 4096 px de alto (lo revisa la prueba).
  publicarObjetos(ctx, 'objetos-v11', terminados, cuadros);
});
