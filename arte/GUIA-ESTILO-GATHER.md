# Guía de estilo: inspirado en Gather

Oficina Live se inspira en la experiencia de Gather (gather.town, versión 2.0) en interfaz, funciones, objetos y personajes. Lo único que cambia es Teams. Esta guía manda sobre el estilo de cualquier otro documento de `arte/` cuando haya choque, salvo `GUIA-ESTILO-GATHER-V2.md`, que tiene las medidas (paleta, contorno, proporciones, alturas) y la reemplaza en lo que se contradigan.

La carpeta `arte/referencia/` es material de estudio de terceros y no se publica. Sirvió para estudiar el estilo, las proporciones y las categorías de objetos: proporciones medidas, sin copiar píxeles. No se copian sprites ni se calcan píxeles. Todo se dibuja desde cero con nuestro pipeline, con el mismo espíritu.

## Personajes (medidas de estudio, casilla de 32 px)

- Figura completa: unos 36 px de alto (1,1 casillas) y unos 22 a 24 px de ancho en la cabeza.
- Cabeza con pelo: 20 a 21 px de alto, es decir cerca del 57 por ciento de la altura. Tronco y piernas juntos: 15 a 16 px. Piernas muy cortas (5 a 6 px) con zapatos pequeños. Hombros angostos, brazos cortos pegados al cuerpo, manos en la cintura o casi invisibles.
- Cara: dos ojos de punto oscuro bien separados, sin nariz y sin boca (o una raya mínima). Tierna, no realista.
- Pelo: masa grande y redondeada con contorno oscuro. El pelo y los accesorios de cabeza dan la personalidad (corona de flores, auriculares, gorro, moño, melena, afro, rizos). De espaldas se ve pura cabellera con nuca.
- Contorno azul marino muy oscuro (cerca de `azul-oficina-0`), no negro. Sombreado de 2 a 3 tonos, sin degradados.
- Sentado en un escritorio se ve de espaldas: cabeza, hombros y la silla. Sentado en un sofá o un puff se ve de frente con las manos en el regazo.
- El lienzo del personaje sigue siendo 32x48 con los pies en la fila 47, pero la figura ocupa solo las 36 filas de abajo. Arriba queda aire para sombreros y pelo alto.

## Objetos y entorno

- Escritorios: tapa blanca o gris muy claro, panel frontal azul grisáceo (`azul-oficina`), con objetos pequeños encima. Hileras de 3 escritorios por equipo.
- Sillas de oficina: azul marino (`azul-oficina`), con base de 5 patas y respaldo redondeado. Una casilla.
- Sofás: arena o cuero claro (`crema`, `cuero`), tapizado con botones, 3 asientos. Mesa de centro redonda de madera clara. Puffs morado (`morado`) y azul.
- Pisos: ladrillo crema (`ladrillo-crema`) en pasillos; alfombra lavanda con zigzag (`lavanda`) en salas; baldosa gris azulada en damero (`baldosa-gris`) en áreas de equipo; losa clara con rombos en descanso.
- Paredes: delgadas, con zócalo oscuro; en las salas, lavanda o gris azulado; separadores de vidrio y de madera; puertas de madera y de vidrio.
- Plantas: grandes, frondosas, muy verdes, en macetas blancas, grises o de barro. Hay de todo tipo: ave del paraíso, bambú, helechos, cactus, suculentas.
- Exterior: árboles redondos, pinos y abedules con copas grandes y claras (`cesped`, `hoja-pastel`).
- Formas redondeadas y blandas, detalle rico pero legible a 1x. Colores suaves y desaturados con acentos saturados (rojo, naranja, morado). Contorno oscuro azulado.
- Paleta: ya existen las rampas `lavanda`, `azul-oficina`, `baldosa-gris`, `ladrillo-crema`, `rojo-suave`, `naranja`, `cuero`, `hoja-pastel`, `crema` y `morado`. Úsalas. No se agregan más sin avisar.

## Objetos del inventario propio

El inventario incluye objetos propios dibujados desde cero, de categorías típicas de una oficina virtual: manzana roja, cono naranja, planta de hojas en bowl, suculenta gris, planta globo, lámpara de escritorio negra, pato de goma, taza con postre, bowl de comida, balón de fútbol, reloj de pie, sillón rojo, silla tallada de respaldo alto, perchero con bombillas, cámara en trípode, ave del paraíso, espantapájaros, máquina arcade, cómoda con cajones, sofá beige, futbolín, estante de plantas, pizarra blanca con ruedas, estante de frascos, chimenea con repisa y velas, máquina expendedora, acuario, dispensador de agua con garrafón azul, cafetera de cápsulas, tazas, mini nevera, mesa de ping-pong, estanterías con libros, corchos, cuadro de colección de mariposas, escritorios con consola de juegos y figuritas, mesas redondas de reunión con sillas de madera y cojín azul y árboles de exterior.

Todo está en `shared/src/inventario.ts`. Los de esta tanda llevan `lote: 3`.

## Reglas de siempre

- Alfa 0 o 255. Sin píxeles sueltos. Paleta cerrada (la nueva de 114 colores).
- Medidas, orientaciones, variantes, ids de cuadro y flujo de trabajo: los de `arte/GUIA-OBJETOS.md` y `arte/GUIA-PERSONAJES.md`.
- Nada de guiones largos en textos ni comentarios.
