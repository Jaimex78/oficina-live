/**
 * Constructor del lote 2B de objetos (`objetos-lote2b`, atlas `objetos-v3`): tecnología, colaboración, cocina,
 * decoración, temporada y exterior (lo que no está en el lote 1 ni en el 2A). 52 objetos y 186 cuadros.
 *
 * Archivos: `l2b-comun.ts` (ayudas), un archivo por categoría (`l2b-tecnologia.ts`, `l2b-colaboracion.ts`,
 * `l2b-cocina.ts`, `l2b-decoracion.ts`, `l2b-temporada.ts`, `l2b-exterior.ts`), `l2b-paredes.ts` (lo que cuelga de las
 * paredes), `l2b-cerca.ts` (la cerca, un autotile de 16 máscaras), `l2b-escenas.ts` (salas de prueba) y `l2b-todo.ts`
 * (los junta sin efectos secundarios; las pruebas lo importan). Este archivo solo registra el constructor.
 *
 * Decisiones que comparte con el lote 1 (el que fija el estilo):
 *  - Luz arriba a la izquierda, contorno tonal y una sola sombra abajo a la derecha (2 px, suave al alejarse).
 *  - Lo apoyado (monitor doble, portátil, microondas, cafetera, tostadora, frutero, planta chica, lámpara de mesa,
 *    trofeos, parlante, cojín, calabazas, regalos) baja hasta la fila 15 de su casilla, la misma del monitor del lote 1.
 *  - Lo que va en el aire (proyector, lámparas colgantes, luces, globos, banderines, piñata, sombrilla, planta colgante)
 *    está en la capa `sobre`: sin sombra proyectada. Lo colgado de una pared lleva una sombra de 1 px sobre ella.
 *  - Lo colgado respeta la geometría de paredes del lote 1: la cara del sur va de la fila 16 a la 63 del cuadro de
 *    pared y el zócalo ocupa las 8 últimas. En las paredes verticales (E y O) solo se ve la franja de la tapa, así que
 *    lo colgado ahí es una placa delgada pegada a ella.
 *  - La cerca sigue la misma idea de "más" delgado de las paredes, más baja y calada (tablillas con hueco).
 *  - Variantes de color: telas con `tela-gris`, maderas con `madera-oscura` o `madera-clara`, y lo multicolor (globos,
 *    banderines, regalos) dibuja una base de varios colores cuyas variantes pasan a un solo color.
 */

import { itemsDe, publicarObjetos } from './comunes';
import { registrarConstructor } from '../construir';
import { escenasDelLote2B } from './l2b-escenas';
import { construirLote2B } from './l2b-todo';

registrarConstructor('objetos-lote2b', (ctx) => {
  const { cuadros, objetos, terminados } = construirLote2B();
  ctx.log(`${terminados.length} de ${objetos.length} objetos terminados, ${cuadros.size} cuadros dibujados`);

  const porCategoria = new Map<string, typeof terminados>();
  for (const o of terminados) porCategoria.set(o.categoria, [...(porCategoria.get(o.categoria) ?? []), o]);
  for (const [categoria, lista] of porCategoria) {
    const columnas = categoria === 'exterior' ? 8 : categoria === 'decoracion' ? 8 : 6;
    ctx.guardarHoja(`objetos-lote2b-${categoria}.png`, itemsDe(lista, cuadros), { escala: 3, columnas });
  }
  for (const { nombre, imagen } of escenasDelLote2B(cuadros)) ctx.guardarPng(`objetos-lote2b-escena-${nombre}.png`, imagen);

  publicarObjetos(ctx, 'objetos-v3', terminados, cuadros);
});
