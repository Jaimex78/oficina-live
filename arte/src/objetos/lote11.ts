/**
 * Constructor del lote 11 (`objetos-lote11`, atlas `objetos-v12`): comida y bebida de Gather v2 (cafetería, bebidas, almuerzo,
 * frutas y postres, y platos colombianos). Ver `arte/GUIA-ESTILO-GATHER-V2.md` y `arte/GUIA-OBJETOS-V2.md`.
 *
 * Archivos: `l11-comun.ts` (cuadrícula de texto y ayudas), `l11-cafe.ts`, `l11-bebidas.ts`, `l11-almuerzo.ts`, `l11-dulces.ts`,
 * `l11-todo.ts` (junta los grupos) y `l11-escenas.ts` (salas de revisión). Este archivo solo registra el constructor.
 * Solo se publican los objetos con TODOS sus cuadros.
 */

import { itemsDe, publicarObjetos } from './comunes';
import { registrarConstructor } from '../construir';
import { escenasDelLote11 } from './l11-escenas';
import { FAMILIAS_LOTE_11, construirLote11, familiaDeRevision } from './l11-todo';

registrarConstructor('objetos-lote11', (ctx) => {
  const { cuadros, objetos, terminados, pendientes } = construirLote11();
  ctx.log(`${terminados.length} de ${objetos.length} objetos terminados, ${cuadros.size} cuadros dibujados`);
  if (pendientes.length > 0) ctx.log(`pendientes: ${pendientes.map((o) => o.id).join(', ')}`);

  // Una hoja de revisión por familia: solo la variante base de cada orientación.
  for (const familia of FAMILIAS_LOTE_11) {
    const lista = terminados.filter((o) => familiaDeRevision(o) === familia);
    const items = itemsDe(lista, cuadros).filter((i) => !i.id.includes('~'));
    ctx.guardarHoja(`objetos-lote11-${familia}.png`, items, { escala: 3, columnas: 8 });
  }
  for (const { nombre, imagen } of escenasDelLote11(cuadros)) ctx.guardarPng(`objetos-lote11-escena-${nombre}.png`, imagen);

  // Un solo atlas: todo el lote mide menos de 4096 px de alto (lo revisa la prueba).
  publicarObjetos(ctx, 'objetos-v12', terminados, cuadros);
});
