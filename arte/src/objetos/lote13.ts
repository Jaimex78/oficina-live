/**
 * Constructor del lote 13 (`objetos-lote13`, atlas `objetos-v14`): exterior y juegos interactivos de Gather v2 (árboles, agua y
 * plantas de jardín, fogatas, parrillas, carros, juegos que abren un enlace, pizarras y objetos inteligentes de adorno). Ver
 * `arte/GUIA-ESTILO-GATHER-V2.md` y `arte/GUIA-OBJETOS-V2.md`.
 *
 * Archivos: `l13-comun.ts` (ayudas), `l13-arboles.ts`, `l13-jardin.ts`, `l13-exterior.ts`, `l13-juegos.ts`, `l13-todo.ts` (junta los
 * grupos) y `l13-escenas.ts` (salas de revisión). Este archivo solo registra el constructor. Solo se publican los objetos con
 * TODOS sus cuadros.
 */

import { itemsDe, publicarObjetos } from './comunes';
import { registrarConstructor } from '../construir';
import { escenasDelLote13 } from './l13-escenas';
import { FAMILIAS_LOTE_13, construirLote13, familiaDeRevision } from './l13-todo';

registrarConstructor('objetos-lote13', (ctx) => {
  const { cuadros, objetos, terminados, pendientes } = construirLote13();
  ctx.log(`${terminados.length} de ${objetos.length} objetos terminados, ${cuadros.size} cuadros dibujados`);
  if (pendientes.length > 0) ctx.log(`pendientes: ${pendientes.map((o) => o.id).join(', ')}`);

  // Una hoja de revisión por familia: solo la variante base de cada orientación.
  for (const familia of FAMILIAS_LOTE_13) {
    const lista = terminados.filter((o) => familiaDeRevision(o) === familia);
    const items = itemsDe(lista, cuadros).filter((i) => !i.id.includes('~'));
    ctx.guardarHoja(`objetos-lote13-${familia}.png`, items, { escala: 3, columnas: 8 });
  }
  for (const { nombre, imagen } of escenasDelLote13(cuadros)) ctx.guardarPng(`objetos-lote13-escena-${nombre}.png`, imagen);

  // Un solo atlas: todo el lote mide menos de 4096 px de alto (lo revisa la prueba).
  publicarObjetos(ctx, 'objetos-v14', terminados, cuadros);
});
