/**
 * Constructor del lote 1 de objetos (`objetos-lote1`, atlas `objetos-v1`): 40 objetos y 283 cuadros.
 * Es el lote que FIJA EL ESTILO de los demás. Aquí quedan escritas las decisiones de geometría de las
 * paredes y de materiales, para que los lotes 2a y 2b hablen el mismo idioma.
 *
 * Archivos: `l1-comun.ts` (ayudas), `l1-pisos.ts`, `l1-paredes.ts` (sistema de paredes y vidrio),
 * `l1-aberturas.ts` (ventana, puertas, portal), y un archivo por categoría de muebles. `l1-todo.ts` los
 * junta sin efectos secundarios (las pruebas lo importan) y este archivo registra el constructor.
 *
 * ============================================================================================
 * GEOMETRÍA DE PAREDES (la parte más delicada)
 * ============================================================================================
 * Cada pieza es un cuadro de 32 x 64 anclado abajo: la fila 63 es el borde sur de la casilla y las
 * filas 0 a 31 sobresalen hacia el norte. La pared es un "más" delgado centrado en x = 16 y pegado
 * al borde sur de su casilla, visto en 3/4:
 *
 *     fila 0..5    tallo hacia el norte (solo si hay vecino al norte), columnas 11 a 20
 *     fila 6..15   TAPA: el grosor de la pared, 10 px, visto desde arriba (la parte más clara)
 *     fila 16..63  CARA: lo que mira al sur, 48 px de alto (más que un personaje de 48 px)
 *     fila 56..63  zócalo de madera oscura (8 filas), dentro de la cara
 *
 *        0101 (tramo recto)         1010 (tramo vertical)       0110 (esquina NO)
 *     .......................     ...........####........     ..........####.........
 *     ..TTTTTTTTTTTTTTTTTTTTT     ...........####........     ..........TTTTTTTTTTTTT   T = tapa
 *     ..CCCCCCCCCCCCCCCCCCCCC     ...........####........     ..........TTTTTTTTTTTTT   C = cara
 *     ..CCCCCCCCCCCCCCCCCCCCC     ...........####........     ..........####CCCCCCCCC
 *     ..ZZZZZZZZZZZZZZZZZZZZZ                                  ..........####CCCCCCCCC
 *
 * Reglas, para cada máscara de vecinos N, E, S, O (1 = hay otra pieza de pared o abertura):
 *  - Cubo central: tapa de 10 x 10 en las filas 6 a 15 y columnas 11 a 20 (la pared aislada 0000 es un pilar).
 *  - Este u oeste: el tramo horizontal llega hasta el borde del cuadro (columna 31 o 0), así dos piezas
 *    contiguas se tocan sin costura. La cara baja de la fila 16 a la 63 en todo ese ancho.
 *  - Norte: sube un tallo de tapa por las filas 0 a 5. La pieza del norte lo continúa.
 *  - Sur: baja un tallo de tapa por las filas 16 a 31 y NO hay cara en el centro (la pieza del sur sigue la
 *    franja en sus filas 0 a 31). A los lados del tallo queda la cara, filas 16 a 63. Los tallos verticales
 *    muestran su tapa como una franja de 10 px y la cara solo aparece en el extremo sur (máscara sin S).
 *  - El orden de dibujo es de norte a sur por borde inferior: la pared del sur tapa la parte baja de la del
 *    norte, y por eso cada pieza dibuja su franja de tapa en las filas 0 a 31 (desplazada 32 px hacia arriba
 *    de su casilla), contigua a la de la pieza vecina.
 *  - Extremos libres: el tramo empieza o termina en la columna 11 o 20, con un brillo en el borde izquierdo y
 *    una sombra en el derecho. La pared del este y la del oeste terminan con el mismo tallo de 10 px.
 *  - Contorno: 1 px alrededor de la silueta, nunca sobre los bordes del cuadro donde la pieza sigue en la
 *    vecina. Es `azul-oficina-0` (azul marino muy oscuro) en toda la pieza.
 *  - La pared no proyecta sombra afuera (queda fuera del cuadro); solo oscurece la cara cerca del zócalo con
 *    cuatro filas tramadas (oclusión), que usan coordenadas del lienzo y por eso encajan entre piezas.
 *
 * Aberturas (ventana, puertas): ocupan el lugar de una pieza y parten de la pared lisa de tramo recto
 * (0101 en horizontal, 1010 en vertical), así tienen la misma tapa, altura, grosor y rampas que sus vecinas.
 *  - Horizontal (orientación S): hueco de verdad en la cara. La ventana es un marco blanco de 4 vidrios con
 *    alféizar; las puertas dejan el piso a la vista (alfa 0) entre un dintel de madera y dos jambas.
 *  - Vertical (E y O): solo se ve la tapa, así que la ventana es un cristal con marco dentro de la franja y
 *    la puerta es un dintel de madera con jamba en cada extremo y manijas. El alféizar asoma hacia el lado
 *    al que mira.
 *
 * Vidrio: misma geometría, pero el cristal es transparente (alfa 0). Se lee como vidrio por el marco de
 * aluminio (rampa metal), una banda esmerilada a la altura de la cintura, dos destellos en diagonal y una
 * tapa en forma de canal con el núcleo azul claro. Un poste de aluminio de 2 px marca la unión de cada panel.
 *
 * ============================================================================================
 * ESTILO GATHER Y MATERIALES (GUIA-ESTILO-GATHER.md manda sobre lo anterior)
 * ============================================================================================
 *  - Contorno: azul marino muy oscuro (`azul-oficina-0`) de 1 px alrededor de cada objeto, no tonal. Lo que se
 *    levanta del piso lleva ademas una sombra unica abajo a la derecha en `neutro-2` tramado (no en un tono de
 *    `azul-oficina`, `crema` o `morado`, para que no cambie de color al recolorear las variantes).
 *  - Pared: `lavanda` (tapa 4, cara 2, oclusion 1) con zocalo oscuro `azul-oficina`. Variantes gris (`baldosa-gris`) y
 *    rojo (`rojo`). Puertas con tapa y marco de `madera-clara`.
 *  - Escritorios, mesas rectangulares y meson: tapa blanca con labio claro y panel frontal azul grisaceo
 *    (`azul-oficina` 3) entre patas oscuras (`azul-oficina` 1). `base` es Gather; `madera`, `blanco` y `negro` son
 *    alternativas que se dibujan con su propio conjunto de colores (`MATERIALES` en `l1-puestos.ts`).
 *  - Mesa redonda y mesa de centro: madera clara arenosa (`crema`) como las de las referencias de Gather.
 *  - Silla de oficina: azul marino (`azul-oficina`) con X de malla y base de cinco patas. Silla de reunion: madera
 *    clara con cojin azul. Variantes: cambian solo los tonos 1 a 4 de la rampa, el contorno no.
 *  - Sofa y butaca: `crema` con botones y patas de madera; puff: `morado`. Variantes rojo (`rojo-suave`), azul,
 *    verde, amarillo y negro por cambio de rampa.
 *  - Plantas: hojas `planta` con sombra propia por hoja y maceta gris azulada (grande) o de barro (mediana).
 *  - Pantallas: bisel `azul-oficina` y vidrio encendido (`vidrio`, `lavanda`) en los tonos mas claros.
 *  - Pisos: madera clara casi crema (`ladrillo-crema`), madera oscura, baldosa y cemento en `baldosa-gris`.
 *  - Alfombra grande: `lavanda` con zigzag; plana, sin contorno ni sombra.
 *  - Acento de marca: `rojo-coral` (rojo-3) en detalles, nunca como color dominante.
 */

import { itemsDe, publicarObjetos } from './comunes';
import { registrarConstructor } from '../construir';
import { componerConCuadros, salaPruebaParedes } from './l1-escenas';
import { construirLote1 } from './l1-todo';

registrarConstructor('objetos-lote1', (ctx) => {
  const { cuadros, terminados } = construirLote1();
  ctx.log(`${terminados.length} objetos terminados, ${cuadros.size} cuadros`);

  const porCategoria = new Map<string, typeof terminados>();
  for (const o of terminados) porCategoria.set(o.categoria, [...(porCategoria.get(o.categoria) ?? []), o]);
  for (const [categoria, objetos] of porCategoria) {
    ctx.guardarHoja(`objetos-lote1-${categoria}.png`, itemsDe(objetos, cuadros), { escala: 3, columnas: categoria === 'paredes' ? 8 : 6 });
  }
  ctx.guardarPng('objetos-lote1-escena-paredes.png', componerConCuadros(salaPruebaParedes(), cuadros).escalar(2));

  publicarObjetos(ctx, 'objetos-v1', terminados, cuadros);
});
