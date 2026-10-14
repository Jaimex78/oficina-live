/**
 * Constructor del lote 6 (`objetos-lote6`, atlas `objetos-v7`): las fiestas del año, 32 objetos, una colección por fiesta.
 *  - Halloween (10): calabaza tallada, telaraña, esqueleto, lápida, caldero, fantasma colgante, murciélagos, escoba,
 *    árbol seco y bowl de dulces.
 *  - Navidad (6): pesebre, muñeco de nieve, corona, guirnalda, reno y calcetines.
 *  - Amor y amistad (4): ramo de rosas, globos de corazón, oso de peluche y caja de chocolates.
 *  - Año Nuevo (4): copas de champán, globos, cuenta regresiva y serpentinas.
 *  - Fiestas de Colombia (4): bandera, sombrero vueltiao, mochila wayuu y máscara de carnaval.
 *  - Pascua (2): huevos y conejo.
 *  - Cumpleaños (2): torta con velas y sombreros de fiesta.
 *
 * Archivos: `l6-comun.ts` (sombras y ayudas), un archivo por colección (`l6-halloween.ts`, `l6-navidad.ts`,
 * `l6-amor.ts`, `l6-ano-nuevo.ts`, `l6-colombia.ts`, `l6-pascua.ts`, `l6-cumpleanos.ts`), `l6-escenas.ts` (salas de
 * prueba por colección) y `l6-todo.ts` (los junta sin efectos secundarios; las pruebas lo importan). Este archivo solo
 * registra el constructor y escribe una hoja de revisión por colección en `arte/salida/`.
 *
 * Decisiones del lote (siguen la guía de estilo de Gather y las de los lotes 1 y 4):
 *  - Luz arriba a la izquierda, contorno azul marino (`azul-oficina-0`) y sombreado de 2 a 4 tonos sin degradados.
 *  - SOMBRAS: lo de piso lleva sombra proyectada abajo a la derecha en dos tonos sólidos (`azul-oficina-2` y
 *    `azul-oficina-3`) y, lo alto, una mancha de contacto bajo la base. Lo apoyado en una mesa lleva un reborde de 1 px.
 *    Lo colgado de una pared, una sombra de 1 px sobre ella (en las paredes verticales solo se ve la franja de la tapa,
 *    así que ahí es una placa delgada). Lo que va en el aire (`capa: sobre`) no lleva sombra.
 *  - Lo que emite luz (calabaza, caldero, cuenta regresiva, torta) lleva sus partes encendidas en los tonos más claros.
 *  - Variantes: solo `globos-corazon` (base multicolor y rojo), que cambia cada rampa por la roja.
 */

import { itemsDe, publicarObjetos } from './comunes';
import { registrarConstructor } from '../construir';
import { escenasDelLote6 } from './l6-escenas';
import { COLECCIONES_LISTAS, construirLote6, objetosDelLote6 } from './l6-todo';

const COLUMNAS: Readonly<Record<string, number>> = { halloween: 5, navidad: 6, 'amor-amistad': 6, 'ano-nuevo': 6, colombia: 6, pascua: 4, cumpleanos: 4 };

registrarConstructor('objetos-lote6', (ctx) => {
  const { cuadros, objetos, terminados } = construirLote6();
  ctx.log(`${terminados.length} de ${objetos.length} objetos terminados, ${cuadros.size} cuadros dibujados`);

  for (const coleccion of COLECCIONES_LISTAS) {
    const lista = objetosDelLote6(coleccion).filter((o) => terminados.includes(o));
    ctx.guardarHoja(`objetos-lote6-${coleccion}.png`, itemsDe(lista, cuadros), { escala: 4, columnas: COLUMNAS[coleccion] ?? 5 });
  }
  for (const { nombre, imagen } of escenasDelLote6(cuadros)) ctx.guardarPng(`objetos-lote6-escena-${nombre}.png`, imagen);

  publicarObjetos(ctx, 'objetos-v7', terminados, cuadros);
});
