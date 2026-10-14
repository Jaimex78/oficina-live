/**
 * Constructor del lote 3B de objetos (`objetos-lote3b`, atlas `objetos-v5`): la segunda mitad del lote 3, 16 objetos
 * del estilo Gather: silla tallada, perchero con bombillas, cámara en trípode, ave del paraíso, espantapájaros,
 * máquina arcade, balón, cómoda, estantes de plantas y de frascos, chimenea, acuario, mini nevera, cuadro de
 * mariposas, pino y abedul. 48 cuadros.
 *
 * Archivos: `l3b-comun.ts` (ayudas y colores), un archivo por familia (`l3b-asientos.ts`, `l3b-decoracion.ts`,
 * `l3b-juegos.ts`, `l3b-muebles.ts`, `l3b-hogar.ts`, `l3b-paredes.ts`, `l3b-arboles.ts`), `l3b-escenas.ts` (salas de
 * prueba) y `l3b-todo.ts` (los junta sin efectos secundarios; las pruebas lo importan). Este archivo solo registra
 * el constructor.
 *
 * Decisiones (las del lote 1 y el 2B, con la guía de estilo de Gather encima):
 *  - Luz arriba a la izquierda, contorno azul marino `azul-oficina-0` y una sola sombra abajo a la derecha: la
 *    estándar (2 px, suave al alejarse) en los muebles, y una elipse tramada en dos tonos al pie de lo que no es
 *    caja (balón, árboles).
 *  - Lo colgado (cuadro de mariposas) lleva una sombra de 1 px sobre la pared y respeta la geometría de paredes del
 *    lote 1: frente en las filas 0 a 23 del cuadro y, de lado, una placa delgada pegada a la franja de la tapa.
 *  - Lo que emite luz (bombillas, pantalla del arcade, llamas, agua del acuario) usa los tonos más claros.
 *  - Los muebles largos en `E`: tapa arriba, testero abajo y una franja angosta a la derecha con el frente.
 *  - Los árboles miden 64 x 128 y bloquean solo la fila de abajo.
 */

import { itemsDe, publicarObjetos } from './comunes';
import { registrarConstructor } from '../construir';
import { escenasDelLote3B } from './l3b-escenas';
import { construirLote3B } from './l3b-todo';

registrarConstructor('objetos-lote3b', (ctx) => {
  const { cuadros, objetos } = construirLote3B();
  ctx.log(`${objetos.length} objetos, ${cuadros.size} cuadros dibujados`);

  const grupos: ReadonlyArray<readonly [string, readonly string[], number]> = [
    ['pequenos', ['silla-tallada', 'perchero', 'camara-tripode', 'ave-del-paraiso', 'espantapajaros', 'balon-futbol', 'mini-nevera'], 8],
    ['muebles', ['maquina-arcade', 'comoda', 'estante-plantas', 'estante-frascos', 'acuario', 'cuadro-mariposas'], 4],
    ['chimenea-y-arboles', ['chimenea', 'pino', 'abedul'], 3],
  ];
  for (const [nombre, ids, columnas] of grupos) {
    const lista = objetos.filter((o) => ids.includes(o.id));
    ctx.guardarHoja(`objetos-lote3b-${nombre}.png`, itemsDe(lista, cuadros), { escala: 3, columnas });
  }
  for (const { nombre, imagen } of escenasDelLote3B(cuadros)) ctx.guardarPng(`objetos-lote3b-escena-${nombre}.png`, imagen);

  publicarObjetos(ctx, 'objetos-v5', objetos, cuadros);
});
