/**
 * Constructor del lote 12 (`objetos-lote12`, atlas `objetos-v13`): objetos de pared de Gather v2 (ventanas, relojes, cuadros,
 * luces, plantas de pared, paneles, banderas y otros colgantes). Ver `arte/GUIA-ESTILO-GATHER-V2.md` y `arte/GUIA-OBJETOS-V2.md`.
 *
 * Archivos: `l12-comun.ts` (marcos, laterales y registro de colgantes), `l12-ventanas.ts`, `l12-arte.ts`, `l12-luces.ts`,
 * `l12-plantas.ts`, `l12-otros.ts`, `l12-todo.ts` (junta los grupos) y `l12-escenas.ts` (salas de revisión). Este archivo solo
 * registra el constructor. Solo se publican los objetos con TODOS sus cuadros.
 */

import { itemsDe, publicarObjetos } from './comunes';
import { registrarConstructor } from '../construir';
import { escenasDelLote12 } from './l12-escenas';
import { FAMILIAS_LOTE_12, construirLote12, familiaDeRevision } from './l12-todo';

registrarConstructor('objetos-lote12', (ctx) => {
  const { cuadros, objetos, terminados, pendientes } = construirLote12();
  ctx.log(`${terminados.length} de ${objetos.length} objetos terminados, ${cuadros.size} cuadros dibujados`);
  if (pendientes.length > 0) ctx.log(`pendientes: ${pendientes.map((o) => o.id).join(', ')}`);

  // Una hoja de revisión por familia: solo la variante base de cada orientación.
  for (const familia of FAMILIAS_LOTE_12) {
    const lista = terminados.filter((o) => familiaDeRevision(o) === familia);
    const items = itemsDe(lista, cuadros).filter((i) => !i.id.includes('~'));
    ctx.guardarHoja(`objetos-lote12-${familia}.png`, items, { escala: 3, columnas: 9 });
  }
  for (const { nombre, imagen } of escenasDelLote12(cuadros)) ctx.guardarPng(`objetos-lote12-escena-${nombre}.png`, imagen);

  // Un solo atlas: todo el lote mide menos de 4096 px de alto (lo revisa la prueba).
  publicarObjetos(ctx, 'objetos-v13', terminados, cuadros);
});
