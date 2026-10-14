/**
 * Constructor del lote 2A (30 objetos, 236 cuadros): pisos restantes, piezas de pared bajas y especiales,
 * puestos de trabajo, asientos y mesas restantes. Publica el atlas `objetos-v2`.
 *
 * Los dibujos viven en `l2a-*.ts`; la lista y la expansión a variantes, en `l2a-lote.ts`.
 * Cada corrida deja una hoja de contacto por categoría en `arte/salida/` (`objetos-lote2a-<categoria>.png`).
 * Con `--publicar` escribe el atlas con los objetos que ya tienen dibujo; sin `--publicar` no escribe fuera de `arte/salida/`.
 *
 *   npm run construir -w @ol/arte -- --solo=objetos-lote2a            construye y deja las hojas
 *   npm run construir -w @ol/arte -- --solo=objetos-lote2a --publicar publica `objetos-v2`
 */

import { registrarConstructor } from '../construir';
import type { ItemSprite } from '../nucleo';
import { itemsDe, publicarObjetos } from './comunes';
import { componerEscenaLote2a } from './l2a-escenas';
import { OBJETOS_2A_POR_CATEGORIA, construirCuadros2a, idsDibujados, objetosDelLote } from './l2a-lote';
import { pisoAlfombraGris, pisoAlfombraRoja, pisoCesped, pisoCocina, pisoDeck, pisoParquet } from './l2a-pisos';

registrarConstructor('objetos-lote2a', (ctx) => {
  const ids = idsDibujados();
  const objetos = objetosDelLote(ids);
  const cuadros = construirCuadros2a(ids);

  for (const categoria of Object.keys(OBJETOS_2A_POR_CATEGORIA)) {
    const deLaCategoria = objetos.filter((o) => o.categoria === categoria);
    if (deLaCategoria.length === 0) continue;
    const items: ItemSprite[] = itemsDe(deLaCategoria, cuadros);
    if (categoria === 'pisos') {
      // Verificación visual de las costuras: cada piso en mosaico de 3 x 3 y desplazado 16 px.
      for (const f of [pisoAlfombraGris, pisoAlfombraRoja, pisoCesped, pisoDeck, pisoParquet, pisoCocina]) {
        items.push({ id: `mosaico-${f.name}`, lienzo: f().desplazar(16, 16).mosaico(3, 3) });
      }
    }
    ctx.guardarHoja(`objetos-lote2a-${categoria}.png`, items, { escala: 3, anchoMax: 2400 });
  }

  // Sala de prueba en contexto, con las paredes y sillas del lote 1.
  const { lienzo, avisos } = componerEscenaLote2a();
  ctx.guardarPng('objetos-lote2a-escena.png', lienzo.escalar(2));
  for (const aviso of avisos) ctx.log(`escena: ${aviso}`);

  publicarObjetos(ctx, 'objetos-v2', objetos, cuadros);
  ctx.log(`Lote 2A: ${objetos.length} de 30 objetos con dibujo, ${cuadros.size} cuadros`);
});
