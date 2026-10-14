/**
 * Constructor del lote 14 (`objetos-lote14`, atlas `objetos-v15`): baños con cubículos (divisores y puerta de cubículo, divisor de
 * urinarios, papelera, dispensadores, secador, espejo ancho y mesón con dos lavabos). Ver `arte/GUIA-OBJETOS-V2.md`.
 *
 * Archivos: `l14-divisores.ts`, `l14-banos.ts`, `l14-todo.ts` (junta los grupos) y `l14-escenas.ts` (sala de revisión).
 */

import { itemsDe, publicarObjetos } from './comunes';
import { registrarConstructor } from '../construir';
import { escenasDelLote14 } from './l14-escenas';
import { FAMILIAS_LOTE_14, construirLote14, familiaDeRevision14 } from './l14-todo';

registrarConstructor('objetos-lote14', (ctx) => {
  const { cuadros, objetos, terminados, pendientes } = construirLote14();
  ctx.log(`${terminados.length} de ${objetos.length} objetos terminados, ${cuadros.size} cuadros dibujados`);
  if (pendientes.length > 0) ctx.log(`pendientes: ${pendientes.map((o) => o.id).join(', ')}`);
  for (const familia of FAMILIAS_LOTE_14) {
    const items = itemsDe(terminados.filter((o) => familiaDeRevision14(o) === familia), cuadros).filter((i) => !i.id.includes('~'));
    ctx.guardarHoja(`objetos-lote14-${familia}.png`, items, { escala: 3, columnas: 8 });
  }
  for (const { nombre, imagen } of escenasDelLote14(cuadros)) ctx.guardarPng(`objetos-lote14-escena-${nombre}.png`, imagen);
  publicarObjetos(ctx, 'objetos-v15', terminados, cuadros);
});
