# Guía para dibujar los objetos de la oficina

> Desde el lote 8 hay un molde nuevo con el estilo de Gather v2 medido: lee primero `GUIA-ESTILO-GATHER-V2.md` y `GUIA-OBJETOS-V2.md` (cómo se agrega un lote sin pisar a los demás). Esta guía sigue vigente en medidas, anclaje, orientaciones y variantes. Lo que cambió: los escritorios miden 3 casillas, lo apoyado se dibuja con su borde de abajo en la fila 10 de la casilla (no la 15) y la paleta tiene la rampa `pizarra`.

Esta guía es el contrato entre el inventario (`shared/src/inventario.ts`), el pipeline de arte (`arte/`) y el motor del navegador (`web/`). Léela completa antes de dibujar. El núcleo del pipeline se explica en `arte/README.md`: la paleta, el lienzo, las recetas de sombreado, los atlas.

## 1. Qué se dibuja y de dónde sale la lista

Los objetos están en `INVENTARIO` (`shared/src/inventario.ts` y, desde el lote 8, `shared/src/inventario-lotes/`). El inventario ya dice, para cada objeto: tamaño en casillas, cuánto sobresale, qué orientaciones tiene, qué variantes de color, si es pared, si va colgado, si va apoyado, si emite luz. NO se cambia desde aquí. Si un dato no sirve (por ejemplo un `sobresale` que no alcanza), lo reportas en tu informe final y yo lo corrijo.

Lo que se dibuja es exactamente lo que `framesDe(objeto)` promete: un cuadro por cada orientación (o máscara de paredes) y por cada variante, con el id canónico `idFrame(objeto, orientacion, variante)`:

- `silla-oficina@S` es la silla mirando al sur, variante base.
- `silla-oficina@S~rojo` es la misma, variante roja.
- `pared-lisa@0101` es la pared con vecinos al este y al oeste (máscara N,E,S,O).
- Los objetos de orientación única (`U`) no llevan `@U`: `planta-grande`, `planta-grande~...` si tuviera variantes.

`framesEsperados(objeto)` en `arte/src/objetos/comunes.ts` te da la lista con la medida exacta de cada cuadro. `verificarObjeto` compara tu resultado contra ella. No inventes ids ni cuadros extra.

## 2. Medidas y anclaje

- Un cuadro mide `ancho * 32` por `alto * 32 + sobresale` píxeles, donde `ancho` y `alto` son los de la huella ya girada: `huellaDe(objeto, orientacion)`. En `E` y `O` los objetos no cuadrados se giran 90 grados y se transponen (un escritorio de 2x1 mide 1x2 casillas en `E`).
- El motor ancla el cuadro por su esquina inferior izquierda a la esquina inferior izquierda de la huella. La huella son las filas de abajo (`alto * 32`); `sobresale` son las filas de arriba que sobresalen (objetos altos).
- Nada se dibuja fuera de la caja. Deja 1 px libre arriba y a la izquierda y 3 px a la derecha y abajo para contorno y sombra, como en el estilo de referencia, salvo los objetos que llenan la casilla de lado a lado (pisos, paredes).
- Pisos: 32x32 sin costuras. Verifica con `mosaico(3, 3)` y `desplazar(16, 16)`.

## 3. Orientaciones

- `U`: un solo cuadro.
- `S`, `N`, `E`, `O`: hacia dónde MIRA el frente del objeto. `S` mira hacia abajo en la pantalla (hacia quien juega): se ve el frente. `N` mira hacia arriba: se ve la parte de atrás. `E` mira a la derecha y `O` a la izquierda: se ve de lado.
- Sillas, sofás, butacas, bancos y puffs con respaldo: la orientación es hacia donde mira QUIEN SE SIENTA. En `S`, quien se sienta mira hacia abajo y el respaldo queda arriba, detrás. En `N` mira hacia arriba y el respaldo queda abajo, delante (se ve la espalda de la silla).
- Escritorios, mesas, mesones: `S` es el lado largo horizontal. `E` es el mismo mueble girado 90 grados (lado largo vertical, frente hacia la derecha).
- La luz viene de arriba a la izquierda en TODOS los cuadros. Un cuadro `O` no es el reflejo exacto de `E`: si lo espejas, vuelve a sombrear los bordes para que la luz siga viniendo de la izquierda.
- Monitores y pantallas: la orientación es hacia donde mira la PANTALLA. `N` muestra la parte trasera (sin pantalla) cuando la pantalla mira hacia arriba, es decir, de espaldas a quien juega.
- Objetos colgados (`montado`): la orientación elige la cara de la pared donde cuelgan (`S` pared norte vista de frente, `E` y `O` paredes laterales).

## 4. Paredes

Las paredes (`pared: 'muro'` con `autotile: 'paredes4'`) tienen 16 cuadros por variante: uno por cada combinación de vecinos. La clave es una cadena de 4 caracteres en el orden Norte, Este, Sur, Oeste, con `1` si en esa dirección hay otra pieza de pared (muro o abertura) y `0` si no. Ejemplos: `0000` pared aislada (un pilar), `0101` tramo horizontal con vecinos a los dos lados, `1010` tramo vertical, `0100` extremo izquierdo de un tramo horizontal, `1100` esquina que une el norte con el este, `1111` cruce.

- Cuadro de 32x64 (`sobresale` 32). La fila 63 es el borde sur de la casilla. La pared es DELGADA (unos 8 a 10 px de grosor) y ALTA: su cara visible mide unos 48 px de alto, más que un personaje (48 px), de modo que quien camina detrás queda oculto.
- Cara frontal (vista desde el sur): se ve cuando NO hay pared al sur (`S` = 0). Tapa superior: la parte de arriba, más clara. Zócalo oscuro abajo.
- Los tramos verticales muestran su tapa como una franja delgada; la cara solo aparece en el extremo sur. El orden de dibujo es de norte a sur (por borde inferior), así que la pared del sur tapa la parte baja de la del norte: úsalo.
- Las aberturas (`pared: 'abertura'`: ventana, puertas, arco, ascensor) ocupan el lugar de una pieza de pared. Deben encajar con los muros vecinos: misma altura, mismo grosor, mismas rampas y la misma tapa a ambos lados. En orientación `S` van en tramos horizontales; en `E` y `O` en tramos verticales.
- Verifica SIEMPRE con una sala de prueba: un rectángulo cerrado, un pasillo, una T, un cruce, un pilar suelto, extremos libres, una puerta y una ventana en un tramo. Si ves huecos, saltos de altura o costuras, corrige antes de seguir.

## 5. Objetos colgados, apoyados y de suelo

- `montado` (cuadros, relojes, TV de pared, corcho, muro Kanban, carteles, cortinas, espejo, cámara): se dibujan encima de la cara de una pared. Un cuadro de `sobresale 0` mide solo su huella (por ejemplo 64x32) y debe quedar centrado en la mitad baja de la cara de la pared (de la fila 32 a la 63 de un cuadro de pared), unos 8 a 10 px sobre el zócalo. Los que sobresalen (TV de pared 64x48) ocupan la cara completa.
- `apoyado` (monitor, portátil, lámpara de mesa, planta chica, trofeos, cojín...): van encima de un escritorio o una mesa. Dibújalos como si ya estuvieran sobre la tapa: el motor los coloca en la casilla de su huella, con el borde inferior en la casilla.
- `capa: 'suelo'` (alfombras, portal): planos sobre el piso, sin sombra proyectada hacia fuera.
- `capa: 'sobre'` (lámparas colgantes, banderines, globos, sombrilla, piñata): se dibujan por encima de las personas. Sin sombra.
- Objetos con `emisor` (lámparas, pantallas, TV, máquina de café, nevera de bebidas...): el motor les suma luz en modo oscuro. Dibuja la parte que emite (bombilla, pantalla) con los tonos MÁS CLAROS y saturados de su rampa para que se lea encendida de noche. No dibujes el resplandor: lo pone el motor.
- Ventanas (`ventana`): el motor añade el rayo de sol sobre el piso. Tú dibuja el cristal con tonos claros de la rampa `vidrio`.

## 6. Variantes de color

La variante `base` es el dibujo original. Las demás se obtienen RECOLOREANDO, no redibujando: `recolorearVariante(lienzo, rampaBase, variante)` de `arte/src/objetos/comunes.ts`.

- Telas y plásticos: dibújalos con la rampa de 4 tonos `tela-gris` y recolorea. Para `rojo`, `azul`, `verde`, `amarillo`, `naranja`, `negro`, `blanco`, `gris` la tabla está en `comunes.ts`.
- Madera: dibuja con `madera-oscura` (la base de escritorios y mesas) y las variantes `madera` (clara), `blanco` y `negro` salen del recoloreo.
- Si una variante se ve mal en un objeto concreto (por ejemplo, un detalle que cambia de color y no debería), dibuja ese detalle con una rampa distinta que no se recolorea, o ajusta el cuadro a mano después del recoloreo.
- Cada variante es un cuadro completo del atlas.

## 7. Estilo

- Mira `arte/salida/demo-nucleo.png` y lee `arte/src/demo/estilo-referencia.ts`: es la vara. Mismos contornos tonales, misma sombra horneada abajo a la derecha, la misma paleta cerrada de 64 colores. No se agregan colores a la paleta: si hace falta uno, lo escribes en tu informe.
- Sin semitransparencia: alfa 0 o 255. Ningún píxel suelto. Pocos colores por sprite (máximo recomendado 20).
- Oficina de ejemplo: limpia, cálida, moderna. Madera, cemento, vidrio, plantas, y el rojo coral (`rojo-coral`) como acento, no como color dominante. Nada infantil, nada genérico.
- Los objetos de una misma familia comparten materiales: todas las mesas de reunión usan la misma madera, todos los monitores el mismo bisel.
- Legibilidad a tamaño real: el motor muestra todo a 1x o 2x. Un objeto debe reconocerse a 1x, sin lupa. Verifica con la hoja de contacto a escala 1 y a 3.
- Los detalles que no se leen a 1x no se dibujan.

## 8. Cómo trabajar

1. Haz un constructor por grupo en `arte/src/objetos/<tu-grupo>.ts` (puedes dividir en varios archivos con tu prefijo, por ejemplo `l1-asientos.ts`). Registra UN constructor con `registrarConstructor('objetos-<tu-grupo>', (ctx) => ...)`. No edites `arte/src/objetos/index.ts` ni los archivos de otros grupos ni `paleta.ts`.
2. Dibuja por categorías. Después de cada categoría: construye, mira la hoja de contacto a escala 3 (usa la herramienta Read sobre el PNG: te muestra la imagen), corrige, y solo entonces sigue.
3. Compón escenas de prueba con `componerSala` (`arte/src/objetos/compositor.ts`): sirve para ver las paredes unidas, las sillas junto a los escritorios, lo colgado sobre su pared. `npm run construir -w @ol/arte -- --solo=escena-oficina-inicial` arma la oficina de ejemplo con TODO el arte publicado hasta el momento (lo que falta sale como cuadros magenta con una X). Úsala al final de cada hito.
4. Cierra con `publicarObjetos(ctx, '<nombre-del-atlas>', objetosDelGrupo, cuadros)`: verifica contra el inventario, empaqueta, valida y publica. Publica solo con `npm run construir -w @ol/arte -- --solo=<tu-constructor> --publicar`. NUNCA publiques sin `--solo`: tocarías los atlas de otros grupos.
5. Publica por hitos, no solo al final: cuando termines una categoría completa, publica el atlas con los objetos terminados (pasa solo esos objetos a `publicarObjetos`). Así el navegador va usando el arte real mientras sigues trabajando.
6. Cada constructor debe ser determinista: mismos datos, mismos bytes.
7. Escribe pruebas en `arte/tests/objetos-<tu-grupo>.test.ts`: que todos los cuadros prometidos existan con su medida exacta, que solo usen colores de la paleta, que no haya semitransparencia ni píxeles sueltos, que el constructor sea determinista, y que las variantes no sean idénticas a la base. `npm run test -w @ol/arte` y `npm run typecheck -w @ol/arte` deben quedar en verde.

## 9. Reglas del repositorio

- Todo el texto (comentarios, mensajes, nombres) en español neutro, frases cortas. NUNCA rayas largas ni medias (ni la raya larga ni la raya media) en ningún texto ni comentario: hay una prueba que lo revisa en todo `arte/`. Cuidado: las herramientas de escritura convierten los escapes `\uXXXX` en el carácter literal.
- No hagas commit ni push. No instales dependencias.
- No toques `web/`, `server/` ni `shared/` (otras personas trabajan ahí a la vez). Los archivos que se publican (`web/public/assets/arte/objetos-*.png` y `shared/src/catalogo/objetos-*.json`) los escribe el pipeline.
- Informe final corto: qué objetos quedaron, cuántos cuadros, cuáles tienen dudas, datos del inventario que habría que cambiar, y el resultado exacto de las verificaciones.

## 10. Lo que NO se dibuja

Personas y personajes: son otro módulo. Letras legibles dentro del arte: los carteles llevan rótulos genéricos (rayas), nada de texto real (el texto de los carteles lo pone el motor).
