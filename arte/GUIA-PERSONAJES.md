# Guía para dibujar los personajes personalizables

Contrato entre el pipeline de arte (`arte/`), el navegador (`web/`) y el servidor. Cada persona crea su personaje al entrar por primera vez y lo cambia cuando quiera: elige cuerpo, piel, peinado, color de pelo, prenda de arriba, prenda de abajo, zapatos y hasta 4 accesorios, cada uno con sus colores. Lo que se guarda por persona son SOLO ids (`AvatarSpec`), nunca imágenes.

Lee antes: `arte/README.md` (paleta, `Lienzo`, contorno tonal, atlas, y la sección de marcadores), `shared/src/personaje.ts` (el contrato de datos) y `shared/src/personaje-plan.ts` (cómo se arma un personaje: la única fuente de verdad, la usan el navegador y tú).

## 1. Cómo se arma un personaje

Un personaje es una pila de cuadros de 32x48 px, de atrás hacia adelante, según `CAPAS_PERSONAJE`: `sombra`, `cuerpo`, `zapatos`, `abajo`, `arriba`, `cuello`, `pelo`, `cara`, `cabeza`. Cada parte del catálogo pertenece a una capa y trae un cuadro por dirección (y por cuadro de animación, si se anima). `planDeAvatar(spec, catalogo, direccion, cuadro)` devuelve la lista exacta de cuadros, con su rampa de color y su desplazamiento. Si tu constructor de vista previa usa esa función, lo que ves es lo que verá el navegador.

- Direcciones: `S` frente, `O` izquierda, `E` derecha, `N` espalda.
- Cuadros de animación por dirección: 0 quieto, 1 paso A, 2 paso B, 3 sentado. El ciclo de caminar es 1, 0, 2, 0 (`CICLO_CAMINAR`).
- Partes que se animan (traen los 4 cuadros por dirección): `cuerpo`, `zapatos`, `abajo`, `arriba`. El cuerpo, la ropa y los zapatos ya traen dibujado el movimiento de caminar y de sentarse.
- Partes estáticas (traen 1 cuadro por dirección): `pelo` y todos los accesorios. El motor las reutiliza en los 4 cuadros desplazándolas hacia abajo `REBOTE[cuadro]` píxeles para que acompañen al cuerpo: `[0, 1, 1, 5]`. Quiere decir: en los pasos el torso baja 1 px y al sentarse baja 5 px. Tus cuadros animados deben bajar el torso y la cabeza EXACTAMENTE esos píxeles respecto al cuadro 0 (si ves que otro valor de sentado funciona mejor, dilo en tu informe y yo cambio `REBOTE`).
- No hay sombra en los cuadros: el motor dibuja una elipse de sombra bajo los pies. No dibujes sombra proyectada ni contornos de sombra bajo los zapatos.
- Los pies quedan en la fila 47 (la última) y centrados en x. El motor ancla el cuadro por los pies.
- Los ojos y la boca van en el cuerpo (el cuerpo trae la cara completa). El pelo se dibuja ENCIMA, así que debe dejar libre la cara (frente y ojos visibles): el flequillo cae por encima de las cejas. La capa `cara` es solo para accesorios de la cara (gafas, etc.).
- Capas de los accesorios: gafas en `cara`; gorra, gorro y audífonos en `cabeza`; bufanda y cordón con carné en `cuello` (quedan encima de la prenda de arriba); mochila en `cuello` también (en la dirección `S` solo se ven las correas sobre el pecho; en `N` se ve la mochila entera).

## 2. Color por marcadores

Dibujas con colores marcador (tabla en `arte/src/nucleo/marcadores.ts` y en el README): 8 slots por 5 tonos cada uno: `piel`, `cabello`, `ropaA`, `ropaB`, `pantalon`, `zapatos`, `accA`, `accB`. El navegador cambia cada marcador por el tono correspondiente de la rampa elegida (`OpcionColor.rampa`, 5 hex del más oscuro al brillo). Una forma pintada sirve para todos los colores. Ojos, dientes, detalles de metal y lo que no deba cambiar de color usan colores normales de la paleta.

- El tono 0 de cada slot es el contorno; `contornoTonal()` funciona con marcadores (el borde de un píxel de piel tono 2 sale piel tono 1).
- `ropaA` es el color principal de la prenda de arriba y `ropaB` el secundario (cuello, mangas, rayas, estampado): úsalo en las prendas que lo piden.
- `slots` de cada parte del catálogo debe listar los slots que realmente usa (el editor muestra solo los selectores justos).

## 3. Qué se entrega: catálogo v1

Atlas `personajes-v1` publicado con `ctx.publicarAtlas('personajes-v1', atlas, frames, metadatos)`. Los `metadatos` son EXACTAMENTE los campos que faltan de `CatalogoPersonaje` (`shared/src/personaje.ts`): `pieles`, `pelos`, `colores`, `cuerpos`, `peinados`, `arriba`, `abajo`, `zapatos`, `accesorios`. El pipeline agrega solo `version`, `archivo`, `huella`, `ancho`, `alto`, `frames` y `marcadores`. Los ids de cuadro son tuyos; sugerencia: `<parte>@<direccion><cuadro>` (`arriba-camiseta@S0`). `frames[dir]` de cada parte es la lista de ids en orden de cuadro (4 para las animadas, 1 para las estáticas).

Contenido mínimo (si te alcanza el tiempo, más):

- `cuerpos`: 2 (`cuerpo-a`, `cuerpo-b`). Mismo esqueleto y mismas poses (las prendas encajan en los dos, no se dibuja ropa por cuerpo): se distinguen por la forma de la cabeza y la cara, el cuello, las manos y un píxel o dos de silueta que la ropa cubre. Nombres neutros, sin género.
- `pieles`: 8 tonos de claro a oscuro (`piel-1` a `piel-8`, nombres «Tono 1» a «Tono 8»), con rampas naturales y bonitas (usa `rampa5`).
- `pelos` (colores de pelo): 12: negro, castaño oscuro, castaño, castaño claro, rubio oscuro, rubio, rubio ceniza, pelirrojo, canoso, blanco, y 2 o 3 de fantasía (azul, rosado, verde).
- `peinados`: 10, variados y con personalidad: corto con raya, corto clásico, rapado, rizado corto, afro grande, ondulado a los hombros, largo suelto, largo con cola, trenzas, moño alto (y si puedes, bob con flequillo).
- `arriba`: 8: camiseta, camisa manga larga, polo, buso con capota, suéter cuello alto, blazer, chaqueta, blusa sin mangas.
- `abajo`: 5: pantalón largo, jean, bermuda, falda, jogger.
- `zapatos`: 4: tenis, botas, formales, sandalias.
- `accesorios`: 10 a 12: gafas redondas, gafas rectangulares, gafas de sol, audífonos de diadema, gorra, gorro de lana, bufanda, cordón con carné, mochila, y los que se te ocurran que den personalidad en una agencia de publicidad (cinta del pelo, corbata, moño de lana). Cada uno con `slots` (`accA`, `accB`).
- `colores` (ropa y accesorios): 16 con rampa: rojo coral (el rojo de marca, `#EF3B3A`), negro, blanco, gris, azul marino, azul, celeste, verde, verde oscuro, amarillo, naranja, rosado, morado, beige, café, vino. `OpcionColor.id` en minúsculas con guiones.

Dibuja por código aprovechando la estructura: define UN esqueleto parametrizado por dirección y cuadro (cabeza, torso, brazos, piernas, pies) y construye las prendas como regiones derivadas del cuerpo (la camiseta es torso y mangas, el pantalón son las piernas, los zapatos los pies), en lugar de píxel por píxel por cada combinación. Así las prendas siempre encajan con cualquier cuerpo y pose.

## 4. Estilo

- Proporciones «chibi» legibles a 1x: cabeza grande (unos 16x14 px), cuerpo corto. Siluetas distintas y expresivas: el pelo, los accesorios y la ropa llevan la personalidad.
- Vista 3/4 de frente, luz arriba a la izquierda (igual que los objetos). Contorno tonal por slot. Alfa 0 o 255.
- Debe quedar bien sobre pisos claros y oscuros y a la luz de una lámpara de noche.
- Inclusivo y profesional: una oficina moderna. Casual cuidado, creativo. Nada caricaturesco ni infantil, nada de estereotipos.
- Animar bien: el paso se nota (brazos opuestos a las piernas), sin saltos entre cuadros. Sentado se entiende (se ve de qué lado mira) sobre una silla de oficina.

## 5. Vista previa y verificación

Escribe un constructor de vista previa que use `planDeAvatar` y `recolorearConRampas` (en Node, con `Lienzo`) y guarde en `arte/salida/`:

- `personajes-giro.png`: un personaje en las 4 direcciones y los 4 cuadros.
- `personajes-ciclo.png`: ciclos de caminar de varios personajes.
- `personajes-combinaciones.png`: 24 combinaciones al azar (`avatarAlAzar(catalogo, semilla)`) a escala 3, para ver la variedad y que ninguna combinación se rompa (pelo que tapa la cara, prenda que se sale del cuerpo, accesorio que choca con otro).
- `personajes-catalogo.png`: cada parte del catálogo sola, con etiqueta.
- `personajes-sentados.png`: los cuadros sentados sobre una silla de oficina (puedes usar el arte de objetos si ya está publicado en `shared/src/catalogo/objetos-v*.json`; si no, un bloque gris).
Mira cada hoja con la herramienta Read, corrige y repite.

Pruebas en `arte/tests/personaje*.test.ts`: todos los cuadros prometidos existen y miden 32x48; solo colores de paleta y marcadores (`validarAtlas` con `permitirMarcadores` y `multiplo: { ancho: 32, alto: 48 }`); las partes animadas traen 4 cuadros en las 4 direcciones y las estáticas al menos 1; cada `slots` declarado coincide con los marcadores que la parte usa; `avatarAlAzar` produce avatares que pasan `validarAvatar` con 200 semillas; el constructor es determinista; ningún cuadro está vacío.

## 6. Reglas del repositorio

- Constructor: `registrarConstructor('personajes', ...)` en `arte/src/personaje/index.ts` (puedes dividir en `arte/src/personaje/p-*.ts`). No edites `arte/src/objetos/**`, ni `paleta.ts`, ni `arte/src/nucleo/**` (si falta algo del núcleo, dilo en tu informe; los marcadores ya están hechos).
- Publica solo con `npm run construir -w @ol/arte -- --solo=personajes --publicar` (NUNCA sin `--solo`).
- No toques `web/`, `server/` ni `shared/` (otras personas trabajan ahí a la vez).
- Todo el texto en español neutro, frases cortas, y NUNCA guiones largos ni medios (la raya larga y la raya media): hay una prueba global que revisa hasta esta guía. Cuidado: las herramientas de escritura convierten los escapes `\uXXXX` en el carácter literal.
- Sin commit, sin push, sin instalar dependencias. Determinista: mismos datos, mismos bytes.
- Informe final corto: qué quedó, cuadros publicados, decisiones (esqueleto, sentado, rebote), dudas, resultado exacto de los comandos.

## 7. Versión 2: disfraces, movilidad y accesorios por carpetas

El atlas publicado ahora es `personajes-v2` (`shared/src/catalogo/personajes-v2.json` y `web/public/assets/arte/personajes-v2.png`). Es el único catálogo de personajes: `web/src/mundo/arte.ts` carga uno solo (si hubiera dos, gana el de versión más alta). Conserva todos los ids de la v1 y sus 396 cuadros, píxel por píxel, así que los avatares ya guardados siguen funcionando. `AvatarSpec.v` sigue siendo 1.

- Capas nuevas: `atras` (detrás del cuerpo: capas, colas, alas, el respaldo de una silla) y `delante` (por encima de todo: rueda cercana, manubrio).
- Accesorios: 34, cada uno con `carpeta` (`sombrero`, `gafas`, `otros`).
- Disfraces (`CatalogoPersonaje.especiales`): 20, en las 7 colecciones de `COLECCIONES`. Reemplazan arriba, abajo y zapatos. Se arman con partes: el traje (animado, capa `arriba`), la cabeza o máscara (estática) y, si hace falta, algo detrás (`atras`). Banderas: `ocultaPelo`, `ocultaAccesorios` y `ocultaCabeza` (quita solo los accesorios de la capa `cabeza`). Usan los slots `ropaA` y `ropaB` (sus dos colores) y, para orejas o manos, la `piel` del avatar. `porDefecto` dice con qué colores se ven si la persona no elige otros.
- Movilidad (`CatalogoPersonaje.movilidad`): patineta, scooter y silla de ruedas. `elevacion` sube al personaje por cuadro (patineta y scooter: 3 y 2 píxeles) y `cuadroCuerpo` dice qué cuadro del cuerpo se usa (la silla lo deja siempre sentado). Sus partes siguen el cuadro pedido y no se mueven con el rebote.
- `AvatarSpec` suma `especial?: { id, color?, color2? }` y `movilidad?: { id, color? }`. `avatarAlAzar` nunca los elige.
- Reglas de arte: las partes estáticas dejan 3 filas de aire arriba (la movilidad sube al personaje) y no pasan de la fila 42 (el rebote al sentarse suma 5). Todo cabe en 32x48.
- Pruebas: `arte/tests/personaje.test.ts` y `shared/tests/personaje.test.ts`. Hojas de revisión en `arte/salida/personajes-v2-*.png` (una por colección, por carpeta de accesorios, movilidad, ciclos, combinaciones y sentados). Con `PERSONAJES_ZOOM=bruja,patineta` se genera `personajes-v2-zoom.png` a escala 6.

## 8. Versión 3: barbas

El atlas publicado ahora es `personajes-v3` (`shared/src/catalogo/personajes-v3.json` y `web/public/assets/arte/personajes-v3.png`) y reemplaza a la v2: sigue habiendo un solo catálogo. Conserva todos los ids y los 1076 cuadros de la v2, píxel por píxel (el atlas se reempaqueta, las posiciones cambian, las imágenes no). `AvatarSpec.v` sigue siendo 1.

- `CatalogoPersonaje.barbas` (opcional en catálogos viejos): 10 opciones (`barba-sombra`, `-corta`, `-completa`, `-larga`, `-perilla`, `-chivita-bigote`, `-bigote-clasico`, `-bigote-grueso`, `-patillas`, `-candado`). Capa nueva `barba`: sobre el cuello y la ropa, debajo del pelo, de las gafas y de lo que va en la cabeza. Slot `cabello`: usa los colores de `pelos`.
- `AvatarSpec.barba?: { id, color }`: `color` es un id de `pelos`; vacío o desconocido significa el color del pelo del personaje. Sin `barba`, el avatar se ve y se guarda igual que antes (la llave de `claveAvatar` no cambia).
- Cuadros: un cuadro estático por dirección en `S`, `O` y `E`. De espaldas no se ve, así que no hay cuadro `N` (`DefParte.direcciones`). Bajan `REBOTE` como el pelo. Llegan hasta la fila 37 (al sentarse, la 42).
- Reglas de arte: no tocan los ojos (filas 25 y 26). Llevan contorno azul marino solo donde salen de la cabeza (bajo el mentón, sobre la ropa); sobre la piel usan 3 tonos del cabello. Cubren a la vez los dos cuerpos: la mandíbula de la cara redonda es 1 px más ancha que la de la alargada y la barba abraza a las dos.
- `DisfrazCatalogo.ocultaBarba?`: los disfraces que tapan la cara ocultan la barba (fantasma, momia, esqueleto, calabaza, zombie, lobo, Papá Noel, reno, muñeco de nieve, marimonda, conejo y pollito).
- `avatarAlAzar` pone barba en 1 de cada 4 semillas, la sortea al final (lo demás sale igual que antes) y la pueden llevar los dos cuerpos.
- Hoja de revisión: `arte/salida/personajes-v3-barbas.png` (cada barba sobre 3 pieles y 3 colores de pelo, de frente y de perfil). Pruebas de contrato de datos en `shared/tests/personaje.test.ts`; pruebas de arte en `arte/tests/personaje.test.ts`, con la huella de cada parte de la v2 en `arte/tests/fixtures/personajes-v2-huellas.json` para que ningún cambio toque los ids ya publicados.
