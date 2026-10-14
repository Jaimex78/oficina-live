/**
 * Constructor del lote 8 (`objetos-lote8`, atlas `objetos-v9`): el molde del estilo Gather v2. Puestos de trabajo
 * completos: escritorios de 3 casillas, silla de oficina, los 29 computadores y aparatos de Gather, y los accesorios del
 * escritorio. Ver `arte/GUIA-ESTILO-GATHER-V2.md` (el estilo medido) y `arte/GUIA-OBJETOS-V2.md` (cómo se agrega un lote).
 *
 * Archivos: `l8-comun.ts` (ayudas y piezas), `l8-escritorio.ts`, `l8-silla.ts`, `l8-pcs.ts` y demás grupos listados en
 * `l8-todo.ts`, `l8-escenas.ts` (salas de prueba y comparación con la referencia). Este archivo solo registra el constructor.
 * Solo se publican los objetos con TODOS sus cuadros; el resto sale en el registro como pendiente.
 */

import { itemsDe, publicarObjetos } from './comunes';
import { registrarConstructor } from '../construir';
import { escenasDelLote8 } from './l8-escenas';
import { construirLote8 } from './l8-todo';

registrarConstructor('objetos-lote8', (ctx) => {
  const { cuadros, objetos, terminados, pendientes } = construirLote8();
  ctx.log(`${terminados.length} de ${objetos.length} objetos terminados, ${cuadros.size} cuadros dibujados`);
  if (pendientes.length > 0) ctx.log(`pendientes: ${pendientes.map((o) => o.id).join(', ')}`);

  const porCategoria = new Map<string, typeof terminados>();
  for (const o of terminados) porCategoria.set(o.categoria, [...(porCategoria.get(o.categoria) ?? []), o]);
  for (const [categoria, lista] of porCategoria) ctx.guardarHoja(`objetos-lote8-${categoria}.png`, itemsDe(lista, cuadros), { escala: 3, columnas: 3 });
  for (const { nombre, imagen } of escenasDelLote8(cuadros)) ctx.guardarPng(`objetos-lote8-escena-${nombre}.png`, imagen);

  publicarObjetos(ctx, 'objetos-v9', terminados, cuadros);
});
