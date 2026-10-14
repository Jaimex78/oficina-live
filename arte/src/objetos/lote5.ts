/**
 * Constructor del lote 5 (`objetos-lote5`, atlas `objetos-v6`): 15 objetos de juegos, música y aparatos.
 *  - Mesas de juego: billar, hockey de aire, póker y ajedrez.
 *  - De pared: diana de dardos y aro de baloncesto.
 *  - Música: rockola, piano, guitarra en su soporte y disco de vinilo gigante en el suelo.
 *  - Vehículo y silla: kart (base, azul, rojo) y silla gamer (base, rojo, azul, morado).
 *  - Aparatos: cabina de fotos, rack de servidores y nevera de vinos.
 *
 * Archivos: `l5-comun.ts` (ayudas), `l5-mesas.ts`, `l5-pared.ts`, `l5-musica.ts`, `l5-kart.ts`, `l5-sillon.ts`,
 * `l5-equipos.ts`, `l5-escenas.ts` (salas de prueba) y `l5-todo.ts` (los junta sin efectos secundarios; las pruebas lo
 * importan). Este archivo solo registra el constructor.
 *
 * Decisiones del lote (siguen la guía de estilo de Gather y las del lote 4):
 *  - Luz arriba a la izquierda, contorno azul marino (`azul-oficina-0`) y sombreado de 2 a 4 tonos sin degradados.
 *  - SOMBRAS: todo lo de suelo lleva sombra proyectada abajo a la derecha en dos tonos sólidos, `azul-oficina-2` pegado al
 *    objeto y `azul-oficina-3` más lejos, y una mancha plana de contacto bajo la base. Lo colgado (diana, aro) lleva una
 *    sombra de 1 px sobre la pared y sigue su geometría (en `E` y `O` solo se ve la franja de la tapa). El vinilo va plano
 *    en el suelo: solo contorno.
 *  - Las pantallas de los aparatos se ven siempre de frente. Lo que emite luz (rockola, rack, nevera, cabina) lleva sus
 *    partes encendidas en los tonos más claros.
 */

import { itemsDe, publicarObjetos } from './comunes';
import { registrarConstructor } from '../construir';
import { escenasDelLote5 } from './l5-escenas';
import { IDS_LOTE_5, construirLote5 } from './l5-todo';

registrarConstructor('objetos-lote5', (ctx) => {
  const { cuadros, objetos, terminados } = construirLote5();
  ctx.log(`${terminados.length} de ${objetos.length} objetos terminados, ${cuadros.size} cuadros dibujados`);

  for (const [grupo, ids] of Object.entries(IDS_LOTE_5)) {
    const lista = terminados.filter((o) => ids.includes(o.id));
    ctx.guardarHoja(`objetos-lote5-${grupo}.png`, itemsDe(lista, cuadros), { escala: 3, columnas: grupo === 'mesas' ? 4 : 6 });
  }
  for (const { nombre, imagen } of escenasDelLote5(cuadros)) ctx.guardarPng(`objetos-lote5-escena-${nombre}.png`, imagen);

  publicarObjetos(ctx, 'objetos-v6', terminados, cuadros);
});
