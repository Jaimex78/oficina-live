# Personaje v5 (propuesta aislada, nada publicado)

Base nueva del personaje de Oficina Live. Parte de los archivos originales del arte base de Jaime Orozco (frente: archivos 09, 10 y 11; perfiles: 12 y 13), que se transcriben exactos como capas, y deriva en el mismo estilo lo que el arte base no trajo: espalda, caminar de 4 cuadros, sentado, peinados y vestuario de prueba. No toca el catálogo publicado, el atlas v4, el motor, el servidor ni el creador.

Hoja de entrega: `arte/salida/personajes-v5-propuesta.png`. Se regenera con `npx tsx arte/herramientas/ver-personajes-v5.ts`. La prueba `arte/tests/personaje-v5.test.ts` comprueba que los 5 originales tienen 0 píxeles de diferencia.

## Resolución elegida

Lienzo de **32 x 64 px de juego** por cuadro (el del arte base). Figura calva de **20 x 33** de frente y **16 x 33** de perfil; con pelo 22 x 35; con chaqueta 26 x 36. Justificación: es la medida del arte base, y coincide con lo que se midió en Gather (un avatar de estudio capturado a 8 px por píxel de juego: 21 x 34 de perfil y espalda, 26 x 36 de frente con chaqueta abierta). La v4 mide 17 x 26.

## Mediciones

Gather (capturas de estudio locales, solo proporciones medidas, sin copiar píxeles; `herramientas/medir-avatar-gather.ts` y `rejilla-avatar-gather.ts`):

- Escala de las capturas del avatar: 8 px de pantalla por píxel de juego (se contaron los tramos del contorno). La base gris va a 3 px y las caras a unos 5,5 px: se usaron solo para proporciones.
- Avatar: cabeza con pelo 18 filas; el cráneo calvo 14 a 15 filas; cuerpo calvo 32 filas con contorno; torso 8 a 9 filas; piernas y pies 7 a 8 filas. La cabeza calva es el 44 % de la altura y con pelo el 50 %.
- Cabeza: 17 px de ancho de relleno con pelo, cráneo de 13 a 14, orejas de 2 px que sobresalen en las filas del medio. Ojos en el cuarto inferior de la cara (a 3 filas de la barbilla), pómulos con rubor, sin nariz ni boca. Contorno negro de 1 px.
- Pelo: masa con 3 a 4 tonos, mechones en diagonal con brillo arriba a la izquierda, puntas oscuras y flequillo en picos.

Diseñador (transcrito a código, medidas en píxeles de juego sin contar el contorno salvo que se diga):

- Frente calvo: 20 de ancho por 33 de alto con contorno. Cráneo 14 x 16, orejas hasta 18 de ancho (filas 38 a 42), mandíbula de 12, cabeza total 17 filas (51 % de la altura).
- Torso 10 de ancho (filas 46 a 54), brazos 4 de ancho y 9 de largo, manos de 2 filas, shorts de 2 filas, piernas de 3 de ancho con 4 px libres entre ellas, suela en la fila 61.
- Perfil: 16 x 33; torso de 7 de relleno, brazo de 4, piernas de 4.
- Paleta: piel F9BF95 y sombra D8885C, con pecas CC8C5D y rubor F4845C; camiseta ECE9F0, C8C2D1, FFFFFF y 9193A6; pelo 222034, 2D2833, 393137, 453E50 y 61535E; chaqueta 222034, 272936, 32343B, 464952 y 696C72.
- Los PNG de frente están a 4x exacto; los de perfil traen fondo y el píxel mide 6,67 px de pantalla (celdas de 6 u 8 px), con los colores corridos unos niveles. Se detectó la rejilla por los cambios de color. El perfil derecho es el espejo del izquierdo (difiere en 1 px).

## Estructura de capas propuesta

Cada capa es un mapa disperso `y * 32 + x -> color` sobre el lienzo de 32 x 64, con las letras de color de `datos-disenador.ts`. Se compone de atrás hacia delante:

1. `atras`: pelo que cae por detrás del cuerpo (melena, bun).
2. `cuerpo`: piel + cara + camiseta y shorts del arte base (se recolorean por letras).
3. `ropa[]`: pantalón y chaqueta (de frente son las capas exactas del 11).
4. `frente`: pelo por encima de la cabeza.
5. `extra`: gafas (y a futuro sombrero, vello facial, otro).
6. `contorno`: negro de 1 px que `figura.ts` calcula alrededor de lo generado.

Recolorear es cambiar la leyenda (piel: `rostro.ts`, 5 pieles; pelo: `rampaPelo(color)`; ropa: `ROPA_COLOR`). Las capas del arte base (`CAPAS_DISENADOR`: base, pelo, chaqueta, pantalon) se obtuvieron como la diferencia entre los tres PNG: ninguna borra píxeles de la anterior.

Archivos de `arte/src/personaje/v5/`:

- `datos-disenador.ts`, `datos-perfiles.ts`: transcripción literal (generados por `herramientas/transcribir-disenador.ts` y `transcribir-perfiles.ts`).
- `disenador.ts`: capas exactas, espejo, mover.
- `rejilla.ts`, `vistas.ts`: cirugía de píxeles; espalda, caminar de 4 cuadros en 4 direcciones.
- `pelo.ts`, `peinados.ts`: generador de mechones y los 6 peinados.
- `ropa.ts`, `rostro.ts`: camiseta de color, mangas, chaqueta de espalda y de perfil, gafas, 5 pieles y 5 caras.
- `sentado.ts`, `figura.ts`: poses sentado y armado de una figura completa.

## Cómo se derivó lo que el arte base no trajo

- Espalda: el sprite del frente con la cara borrada (ojos, cejas, rubor, pecas) y la camiseta cerrada por detrás.
- Caminar (contacto A, paso A, contacto B, paso B): de frente y de espalda, la cabeza sube 1 px en los pasos y el torso se estira una fila; cada brazo se alarga o acorta una fila y cada pierna repite o quita su fila central (la pierna que va adelante baja 1 px, la de atrás sube 1 px, la que pasa se levanta). De perfil, las piernas son dos tiras inclinadas con los colores del arte base y el brazo se inclina 2 columnas. El perfil derecho es el espejo.
- Peinados: formas (masas, mechones, rizos) que se pintan de atrás hacia delante con luz arriba a la izquierda, veta a lo largo del mechón y punta oscura; 5 tonos como el peinado del arte base. El peinado 1 de frente es el exacto; sus vistas N, I y D se derivan.
- Chaqueta de espalda y de perfil: mismo generador con los 5 tonos de la chaqueta del arte base.

## Sentado (las 3 orientaciones del juego)

El tronco y la cabeza no se mueven respecto de pie; cambian piernas y, de perfil, el brazo. Pose por pose:

- De espaldas, silla de escritorio: se corta por la cadera (fila 57); el respaldo de la silla se vuelve a dibujar encima desde la fila 20 de su imagen (la barra del respaldo). Se ven cabeza, hombros, tronco y la silla alrededor.
- De frente, sofá, butaca y puf: muslos cortos hacia el espectador, rodillas, espinillas y pies. Manos apoyadas junto a los muslos. Suela en la fila 62.
- De perfil, silla de comedor y banca: torso derecho contra el respaldo, muslo horizontal, espinilla vertical, antebrazo adelantado con la mano sobre el muslo. Suela en la fila 63. El perfil derecho es el espejo.

Desplazamiento que necesita el motor (para aplicar en `web/src/mundo/escena.ts`, sin tocarlo aquí). Referencia: la persona de pie tiene los pies en el centro de la casilla, 24 px bajo su borde superior (`centroDeCelda`). El lienzo de 32 x 64 se coloca con su columna 16 (el eje) en x = centro + DX y el borde inferior de la fila 61 en y = pies + DY. Los objetos de 32 x 32 se pintan con su esquina en la de la casilla; los más altos, con el borde inferior en el de la casilla.

| Pose y objeto | DX | DY | Nota |
|---|---|---|---|
| Espaldas, `silla-giratoria-industrial@N` (y sillas de escritorio) | 0 | +6 | tapa desde la fila 20 de la imagen de la silla |
| Frente, `butaca-knoll@S` (y sofás, en la casilla del asiento) | 0 | +3 | |
| Frente, `puf-saco` | 0 | +2 | |
| Perfil der, `silla-comedor-industrial@E` (y banca `@E`) | 0 | -3 | pies colgando |
| Perfil izq, `silla-comedor-industrial@O` (y banca `@O`) | 0 | -3 | pies colgando |

Estos números salen de alinear las caderas con la superficie del asiento en cada objeto; hay que reconfirmarlos en el juego con la profundidad real (`profAsiento + 0.6`) antes de fijarlos. El `SUBE_DE_ESPALDAS = 10` y `ALTO_FIGURA_SENTADO` actuales eran para el sprite v4 y se reemplazan por estos DY.

## Lo que falta y estimación para las 11 categorías

Hecho en la propuesta: base exacta (frente y perfiles), espalda, caminar y sentado del cuerpo, 5 pieles, 5 caras, 6 peinados en 4 vistas, camiseta y shorts de color, chaqueta, gafas.

No resuelto: caminar y sentado con chaqueta, pantalón largo, zapatos, mochila o capa (hoy solo se ven en reposo); las caras de perfil y de espalda derivadas necesitan una revisión de arte; la chaqueta de espalda y de perfil es la parte menos fina; el cuerpo del arte base no trae zapatos (los pies son de color piel sombreado).

Estimación realista de trabajo (una persona, con el generador de aquí y revisión visual; jornada = 6 a 7 horas):

| Categoría | Qué es | Estimación |
|---|---|---|
| Piel | 5 pieles x 5 caras, frente y perfil | 1 jornada (ya hay 5 x 5 en 2 vistas) |
| Cabello | 36 a 42 peinados x 4 vistas, 12 colores por rampa | 8 a 10 jornadas (unos 20 a 25 min por peinado y vista, más ajuste) |
| Vello facial | 10 estilos x 3 vistas | 2 jornadas |
| Arriba | 10 prendas, con caminar y sentado | 4 jornadas |
| Chaqueta | 18 prendas, con caminar y sentado | 7 a 8 jornadas (las más largas por vuelo y mangas) |
| Abajo | 10 prendas, con caminar y sentado | 4 jornadas |
| Zapatos | 9 estilos, 4 vistas, caminar y sentado | 3 jornadas |
| Sombrero | 15 estilos x 4 vistas (la mayoría sigue la cabeza) | 4 jornadas |
| Gafas | 12 a 15 x 3 vistas | 2 jornadas |
| Otro | 12 (mochila, capa, cola, bufanda, collar) | 4 a 5 jornadas |
| Disfraz | 5 de cuerpo completo, con caminar y sentado | 4 jornadas |
| Integración | atlas con 32 x 64, anclas, sentado en `escena.ts`, creador, pruebas | 4 a 5 jornadas |

Total: unas 47 a 53 jornadas si se hace todo el catálogo de Gather; un catálogo reducido (12 peinados, 5 prendas por categoría) baja a unas 20 a 25 jornadas. Lo que más pesa es cabello, chaqueta y la integración.

---

# Avance de producción (2026-10-10)

## Etapa 1 (hecha): perfiles exactos con pelo, chaqueta roja y ojo

- Archivos 15 y 16: 21 x 34 px de juego, celdas de 4 y 6 px de pantalla (5,33 px por píxel). `herramientas/transcribir-perfiles-pelo.ts` los transcribe (`datos-perfiles-pelo.ts`, letras W X Y Z para los 4 rojos). Reconstrucción: 0 píxeles de diferencia.
- Hallazgo: el 16 espejado es igual al 15 salvo 17 píxeles (el ojo y el borde del flequillo). Los dos son el mismo sprite con el ojo abierto (16) y medio cerrado (15). La cara coincide con la del perfil base 12 desplazada (4 columnas, 1 fila): pixel (x, y) del archivo = columna x + 4, fila y + 28 del lienzo.
- `disenador.ts`: `PERFIL_P1` separa el perfil en capas sobre el 12 (`pelo`, `chaqueta`, `ojoMedio`); `perfilExacto('I'|'D', 'abierto'|'medio')` los rehace. `verificar-disenador.ts` (`comprobarPerfilesPelo`) los rehace DESDE LAS CAPAS y compara con el PNG: 0 de diferencia en los dos. Prueba en `tests/personaje-v5.test.ts`.
- Proporción del pelo de perfil que manda para TODOS los peinados (en columnas del lienzo): domo de pelo de la columna 4 a la 24 y de la fila 28 a la 40 (el flequillo sobresale 4 columnas por delante de la frente; la masa se extiende 1 columna por detrás del cráneo y cae recta por la nuca hasta la fila 40), cráneo redondo, nuca y oreja a la vista (oreja en las filas 38 a 42, columnas 20 a 22), ojo en las filas 41 a 43, chaqueta con cuello alto, solapa y manga caídas.
- Parpadeo: cuadro alterno de ojo medio cerrado, píxeles que reemplazan al ojo abierto: `OJO_MEDIO_S` (12 px, derivado con la misma regla del arte base) y `OJO_MEDIO_I` (8 px del ojo del 15; los 9 del borde del flequillo son solo del peinado 1). Perfil derecho = espejo. Va como cuadros alternos de `cuerpo` (columnas extra de la hoja: quieto con parpadeo y sentado con parpadeo), ver etapa 3.

## Etapa 2 (hecha): catálogo reducido sobre la base v5

Arquitectura (todo en `arte/src/personaje/v5/` y `arte/src/personaje/catalogo.ts`, que reemplaza al de la v4):
- `pose.ts`: el cuerpo del arte base (tirantes y shorts) en cada pose como rejilla de letras: cuadros 0 quieto, 1 a 4 caminar, 5 sentado, 6 y 7 los mismos con ojo medio cerrado; vistas S, N, I (D = espejo). `zonas()` marca cada píxel como T torso, C pecho, N cuello, A brazo, M mano, H cadera, P pierna, F pie.
- `vestir.ts`: contexto de pose (`ctxDe`), cuerpo desnudo con piel recoloreable (`cuerpoDesnudo`), `Pincel` y `conSilueta` (contorno negro solo donde la prenda sobresale del cuerpo; repinta el contorno del cuerpo que la prenda cubre).
- Prendas por zonas (`prendas.ts`): sirven en las 3 vistas, los 4 cuadros de caminar y sentada sin dibujar cada pose. Arriba 6, Chaqueta 5, Abajo 5, Zapatos 4. Accesorios de cabeza (`accesorios.ts`): Vello 4, Sombrero 4, Gafas 4. `otros.ts` (mochila, bufanda, auriculares al cuello, capa) y `disfraces.ts` (calamar, momia, vampiro, zorro, bruja) siguen el cuerpo en los 6 cuadros. `cabello.ts` + `cabeza.ts`: 12 peinados (S, N, I con el domo de perfil de los archivos 15 y 16; capa `atras` para lo que cae detrás).
- Colores: marcadores de `nucleo` (piel, cabello, ropaA, ropaB, pantalon, zapatos, accA, accB). Pieles rehechas con los tonos del arte base (`colores.ts`; la piel 2 es la suya). Colores fijos: contorno negro y ojos del arte base (`COLORES_FIJOS_V5` en `catalogo.ts`, pasados a la validación a propósito).
- Premium (`premium.ts`): chaqueta 2 de 5 (abrigo, cárdigan), sombrero 2 de 4 (boina, audífonos), gafas 2 de 4 (cuadradas, sin marco), Otro 2 de 4 (auriculares al cuello, capa). Con 4 piezas lo más cercano al 40 % es 50 %.
- Catálogo: 1038 cuadros de 91 opciones, atlas `personajes-v5` de 1022 x 2312 px. Hojas de revisión en `arte/salida/personajes-v5-<categoria>.png`, `personajes-giro.png`, `-ciclo`, `-combinaciones`, `-catalogo`, `-sentados`. Herramientas de revisión rápidas: `arte/herramientas/v5-categoria.ts`, `v5-cabello.ts`, `v5-cabeza.ts`.
- Contrato `ParteCatalogo.atras?` nuevo (capa compañera detrás del cuerpo); `planDeAvatar` ahora usa 8 cuadros.
- Pendiente de ojo de diseño (no bloquea): detalle fino de prendas en perfil caminando (las piernas de perfil son tiras derivadas), pelo largo de espaldas, y la proporción del afro y de los rizos largos (sobresalen del domo).

## Etapa 3 (hecha): integración, reemplaza a la v4

- Contrato (`shared/src/personaje.ts`, `personaje-plan.ts`): `PERSONAJE_ALTO = 64`, `CUADROS_HOJA = 8`, `CICLO_CAMINAR = [1, 2, 3, 4]`, `REBOTE = [0, 0, -1, 0, -1, 0, 0, 0]`, `Cuadro` de 0 a 7, `ParteCatalogo.atras`. Las partes de 6 cuadros usan el 0 o el 5 en los de parpadeo. El corte de pelo (`ocultaPeloSobre`) también lo pide el sombrero de un disfraz (bruja).
- Atlas `personajes-v5` publicado (`npm run construir -w @ol/arte -- --solo=personajes --publicar`): 1038 cuadros de 91 opciones, 1022 x 2312 px. Borrados el atlas, el json y todo el arte de la v4.
- Migración v4 a v5 en `shared/src/personaje-migracion.ts` (prueba en `shared/tests/personaje.test.ts`); una cuenta guardada con ids de la v4 cargó bien en el navegador.
- Servidor: lee el catálogo de versión más alta (`personajes-v5.json`) sin cambios; el servidor de pruebas hay que reiniciarlo porque cachea el catálogo.
- Web: `avatar.ts` (8 columnas, personaje provisional de 64), `pasos.ts` (4 cuadros de caminar), `personas.ts` (ancla en la fila 61 con `ORIGEN_Y`, alto de figura 35, sombra de 26, parpadeo cada 2,6 a 6,2 s durante 140 ms al estar quieto o sentado, tapa de silla desde la fila 20), `sentado-anclas.ts` (+6 espaldas, +3 frente, +2 puf, -3 perfil; confirmados con los objetos reales), `escena.ts` (pies al sentarse y caja de clic), `Creador.tsx` (recortes de 64, parpadeo en la vista previa, mascota con su propio cuadro), `hud/AvatarPixel.tsx`, `ingreso/piezas.ts`. La caja de colisión (12 x 6 px en los pies) no cambia: los pies miden 12 de ancho.
- Se revisó en el navegador el caminar (4 cuadros por dirección) y los sentados (silla de escritorio, silla de comedor E y O, sofá y butaca; el puf no se alcanzó desde la sala de la prueba, su ajuste sale de la hoja de la propuesta).

## Ajuste de piernas y caminar (2026-10-10)

### Piernas: el cuerpo NO se toca, la ropa se adapta
Se probó cerrar las piernas 1 px y después se revirtió: las piernas del arte base quedan EXACTAS. La diferencia de píxeles entre el cuerpo del atlas y los originales del arte base es **0**, también en las piernas de frente, espalda y perfiles (prueba `arte/tests/personaje-v5.test.ts`: «las piernas del cuerpo no se tocan»). Lo que se corrigió es la ropa sobre esa silueta:
- Falda (`prendas.ts`): de frente y de espalda es una sola pieza. En cada fila de la cadera rellena todo lo que hay entre la primera y la última casilla del cuerpo (también en los cuadros de caminar y sentado, donde el hueco cambia de columnas), así no se ve el fondo entre las piernas; el dobladillo sigue siendo continuo y deja ver solo los pies. Prueba: «la falda tapa el espacio entre las piernas».
- Abrigo (`cubrirEntrePiernas`): mismo relleno hasta el dobladillo (fila 58), de pie, caminando y sentado. Pantalones y shorts dejan las piernas separadas (es natural). La capa va detrás del cuerpo y ya cubría el hueco.
- Pendiente: la silueta sentada de frente trae las piernas corridas unas columnas a la derecha (viene del cuerpo derivado `sentado.ts`, no del arte base); no se tocó a propósito.

### Caminar (comparado con capturas de estudio de Gather; solo se midió)
- Perfil: la zancada de contacto bajó de 3 a 2 columnas por pierna (se veía a horcajadas); el brazo cercano ahora se mueve al revés que la pierna cercana (antes iban del mismo lado y parecía andar a paso de robot).
- Espalda: desde atrás la pierna que va adelante se ve más arriba; en los cuadros de contacto el cambio de lado y de altura se cancelan, y en los de paso la pierna que pasa es la del lado contrario de la pantalla (`caminarFrontal(g, c, espalda)`).
- Sin cambios: rebote de 1 px de la cabeza en los pasos, balanceo de brazos de frente, atlas, ids y cuadros.
- Hoja interna de revisión (antes y después): `arte/salida/personajes-v5-piernas-y-caminar.png` (`arte/herramientas/v5-piernas-caminar.ts`).
