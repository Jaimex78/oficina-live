/**
 * Constructor del lote 9 (`objetos-lote9`, atlas `objetos-v10`, `objetos-v10-mesas` y `objetos-v10-almacenaje`): asientos, mesas, escritorios y almacenaje de Gather v2.
 * Ver `arte/GUIA-ESTILO-GATHER-V2.md` y `arte/GUIA-OBJETOS-V2.md`.
 *
 * Archivos: `l9-comun.ts` (motor de cajas, materiales y variantes), `l9-sillas.ts`, `l9-sofas.ts`, `l9-mesas.ts`,
 * `l9-almacenaje.ts`, `l9-todo.ts` (junta los grupos) y `l9-escenas.ts` (salas de revisión). Este archivo solo registra el
 * constructor. Solo se publican los objetos con TODOS sus cuadros.
 */

import { itemsDe, publicarObjetos } from './comunes';
import { registrarConstructor } from '../construir';
import { escenasDelLote9 } from './l9-escenas';
import { NOMBRES_ATLAS_LOTE_9, categoriaDeRevision, construirLote9 } from './l9-todo';

registrarConstructor('objetos-lote9', (ctx) => {
  const { cuadros, objetos, terminados, pendientes } = construirLote9();
  ctx.log(`${terminados.length} de ${objetos.length} objetos terminados, ${cuadros.size} cuadros dibujados`);
  if (pendientes.length > 0) ctx.log(`pendientes: ${pendientes.map((o) => o.id).join(', ')}`);

  // Una hoja de revisión por categoría: solo la variante base de cada orientación.
  for (const categoria of ['asientos', 'mesas', 'almacenaje'] as const) {
    const lista = terminados.filter((o) => categoriaDeRevision(o) === categoria);
    const items = itemsDe(lista, cuadros).filter((i) => !i.id.includes('~'));
    ctx.guardarHoja(`objetos-lote9-${categoria}.png`, items, { escala: 2, columnas: 8 });
  }
  for (const { nombre, imagen } of escenasDelLote9(cuadros)) ctx.guardarPng(`objetos-lote9-escena-${nombre}.png`, imagen);

  // Tres atlas (uno por categoría): juntos pasan de 4096 px de alto y algunas tarjetas gráficas no cargan texturas tan altas.
  for (const categoria of ['asientos', 'mesas', 'almacenaje'] as const) {
    publicarObjetos(ctx, NOMBRES_ATLAS_LOTE_9[categoria], terminados.filter((o) => categoriaDeRevision(o) === categoria), cuadros);
  }
});
