/**
 * Constructor del lote 4 y de la primera mitad del lote 3 (`objetos-lote4`, atlas `objetos-v4`): 22 objetos.
 *  - Lote 4: computador gamer, PlayStation 5, sanitario, lavamanos con espejo y urinario.
 *  - Lote 3A (los del catálogo de Gather): 4 pisos, manzana, cono naranja, planta de hojas en bowl, suculenta, planta
 *    globo, lámpara de escritorio, pato de goma, taza con postre, bowl de comida, consola con control, figuritas, reloj de
 *    pie y sillón.
 *
 * Archivos: `l4-comun.ts` (sombras y ayudas), `l4-pisos.ts`, `l4-decoracion.ts` (objetos pequeños y reloj de pie),
 * `l4-gamer.ts` (computador gamer y PS5), `l4-sillon.ts`, `l4-banos.ts`, `l4-escenas.ts` (salas de prueba) y `l4-todo.ts`
 * (los junta sin efectos secundarios; las pruebas lo importan). Este archivo solo registra el constructor.
 *
 * Decisiones del lote (siguen la guía de estilo de Gather y las del lote 1):
 *  - Luz arriba a la izquierda, contorno azul marino (`azul-oficina-0`) y sombreado de 2 a 4 tonos sin degradados.
 *  - SOMBRAS: lo de piso y de suelo (cono, planta globo, reloj de pie, sanitario, lavamanos, sillón) lleva una sombra
 *    proyectada abajo a la derecha en dos tonos escalonados, `azul-oficina-2` pegado al objeto y `azul-oficina-3` más
 *    lejos, sólidos y sin trama; lo alto suma una mancha plana de contacto bajo la base. Lo apoyado en una mesa lleva un
 *    reborde de 1 px de `azul-oficina-2`. Lo colgado de una pared (urinario), una sombra de 1 px sobre ella.
 *  - Lo apoyado baja hasta la fila 15 de su casilla, como el resto, y deja la fila 0 para el contorno.
 *  - Lo que emite luz (lámpara, consola, PS5, computador gamer) lleva sus partes encendidas en los tonos más claros.
 *  - Los pisos son tiles de 32 x 32 que repiten sin costuras y no llevan contorno ni sombra.
 */

import { itemsDe, publicarObjetos } from './comunes';
import { registrarConstructor } from '../construir';
import { escenasDelLote4 } from './l4-escenas';
import { construirLote4 } from './l4-todo';

registrarConstructor('objetos-lote4', (ctx) => {
  const { cuadros, objetos, terminados } = construirLote4();
  ctx.log(`${terminados.length} de ${objetos.length} objetos terminados, ${cuadros.size} cuadros dibujados`);

  const porCategoria = new Map<string, typeof terminados>();
  for (const o of terminados) porCategoria.set(o.categoria, [...(porCategoria.get(o.categoria) ?? []), o]);
  for (const [categoria, lista] of porCategoria) {
    ctx.guardarHoja(`objetos-lote4-${categoria}.png`, itemsDe(lista, cuadros), { escala: 3, columnas: categoria === 'pisos' ? 4 : 6 });
  }
  for (const { nombre, imagen } of escenasDelLote4(cuadros)) ctx.guardarPng(`objetos-lote4-escena-${nombre}.png`, imagen);

  publicarObjetos(ctx, 'objetos-v4', terminados, cuadros);
});
