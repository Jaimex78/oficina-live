# Guía de personajes v5 (catálogo reducido sobre el arte base de Jaime Orozco)

Estado: **etapas 1, 2 y 3 hechas** (2026-10-10). El personaje se rehízo sobre los archivos originales del arte base de Jaime Orozco,
que se transcriben exactos (0 píxeles de diferencia, ver `arte/herramientas/verificar-disenador.ts`). Reemplaza a la v4. Es una versión REDUCIDA (5 prendas por categoría, 12 peinados):
se amplía después con el mismo generador. Notas de producción, mediciones y avance por etapa: `arte/src/personaje/v5/LEEME.md`.
Pruebas: shared 127, server 207, web 199, arte 546 (todas verdes), `npm run typecheck` limpio.

## Qué hay dibujado

| Categoría | Hecho | Archivo |
|---|---|---|
| Piel (cara) | 5 caras x 5 tonos de piel (la piel 2 y la cara «con rubor» son las del arte base) | `v5/pose.ts`, `v5/rostro.ts`, `colores.ts` |
| Cabello | 12 (despeinado del arte base, flequillo, rizado corto, afro, melena, moño, corto clásico, rapado, rizos largos, trenzas, cola alta, largo ondulado) | `v5/cabello.ts`, `v5/cabeza.ts` |
| Vello facial | 4 (bigote, perilla, barba corta, barba completa) | `v5/accesorios.ts` |
| Arriba | 6 (camiseta, camisa de manga larga, polo, buso con capota, suéter, blusa) | `v5/prendas.ts` |
| Chaqueta | 5 (blazer abierto, chaqueta con cierre, abrigo, chaleco, cárdigan) | `v5/prendas.ts` |
| Abajo | 5 (pantalón largo, jean, corto, falda, pantalón de vestir) | `v5/prendas.ts` |
| Zapatos | 4 (tenis, botas, zapatos de vestir, sandalias) | `v5/prendas.ts` |
| Sombrero | 4 (gorra, gorro de lana, boina, audífonos) | `v5/accesorios.ts` |
| Gafas | 4 (redondas, cuadradas, de sol, sin marco) | `v5/accesorios.ts` |
| Otro | 4 (mochila, bufanda, auriculares al cuello, capa) | `v5/otros.ts` |
| Disfraz | 5 (calamar rosa, momia, vampiro, zorro, bruja; colección Halloween, del 15 de octubre al 2 de noviembre) | `v5/disfraces.ts` |

Colores: 5 pieles (tonos del arte base), 12 de cabello y vello, 16 de ropa (`colores.ts`). Premium (`premium.ts`): chaqueta 2 de 5, sombrero 2 de 4, gafas 2 de 4 y Otro 2 de 4.
Atlas `personajes-v5` (1038 cuadros, 1022 x 2312 px) con su json en `shared/src/catalogo/personajes-v5.json`.

## Cómo está hecho

- **Lienzo** de 32 x 64 por cuadro (`PERSONAJE_ALTO = 64`). Figura calva de 20 x 33 de frente y 16 x 33 de perfil; con pelo 22 x 35; los pies terminan en la fila 61 (contorno de la suela) y el sprite se ancla ahí (`ORIGEN_Y = 62 / 64` en `web/src/mundo/personas.ts`). El eje del personaje es el borde entre las columnas 15 y 16.
- **Hoja de 8 cuadros por dirección** (S frente, O perfil izquierdo, E perfil derecho = espejo, N espalda): 0 quieto, 1 a 4 caminar (contacto A, paso A, contacto B, paso B), 5 sentado, 6 quieto con ojo medio cerrado y 7 sentado con ojo medio cerrado (`CUADROS_HOJA = 8`, `CICLO_CAMINAR = [1, 2, 3, 4]`). El parpadeo es un cuadro alterno del `cuerpo`: las demás partes usan el 0 o el 5.
- **Rebote** (`REBOTE`): la cabeza sube 1 fila en los pasos (cuadros 2 y 4) y no se mueve sentada. Las partes estáticas (peinado, gafas, sombrero) traen un solo cuadro y bajan `reboteDe`; las animadas traen 6.
- **Cuerpo y zonas** (`v5/pose.ts`): cada pose parte del cuerpo del arte base (tirantes y shorts) y se le hace cirugía de píxeles. `zonas()` marca torso, pecho, cuello, brazo, mano, cadera, pierna y pie. Las prendas se pintan SOBRE esas zonas (`v5/prendas.ts`), así sirven en las 3 vistas, los 4 cuadros de caminar y sentadas sin dibujar cada pose.
- **Contorno**: negro de 1 px. El cuerpo trae el suyo; una prenda que sobresale trae el contorno de lo que sobresale (`conSilueta` en `v5/vestir.ts`). El perfil derecho es siempre el espejo del izquierdo.
- **Color**: marcadores de `nucleo` (piel, cabello, ropaA, ropaB, pantalon, zapatos, accA, accB), 5 tonos por slot. Los ojos y el contorno son colores fijos del arte base (`COLORES_FIJOS_V5` en `catalogo.ts`).
- **Capa compañera `atras`** (`ParteCatalogo.atras`): lo que cae detrás del cuerpo (melena, trenzas, mochila de frente, capa).
- **Peinado 1 y perfil**: de frente y de perfil es el EXACTO del arte base (archivos 10, 15 y 16); los otros 11 siguen su proporción de perfil (domo de pelo de la columna 4 a la 24 y de la fila 28 a la 40).

### Sentado en el motor (`web/src/mundo/sentado-anclas.ts`)
Los pies de quien se sienta quedan respecto del centro de la casilla (24 px bajo su borde de arriba): espaldas en silla de escritorio +6, frente en butaca o sofá +3, puf +2, perfil en silla de comedor o banca -3.
Confirmados con los objetos reales. De espaldas la silla se vuelve a dibujar desde la fila 20 de su imagen (la barra del respaldo).

### Para agregar una pieza
1. Defínela en su archivo (`prendas.ts`, `accesorios.ts`, `otros.ts`, `cabello.ts` o `disfraces.ts`) y súmala a `PARTES` en `catalogo.ts` (los ids publicados no cambian: las personas solo guardan ids).
2. `npm run construir -w @ol/arte -- --solo=personajes` y mira `arte/salida/personajes-v5-<categoria>.png` (una hoja por categoría). Revisión rápida: `npx tsx arte/herramientas/v5-categoria.ts arriba|chaqueta|abajo|zapatos`, `v5-cabello.ts`, `v5-cabeza.ts`.
3. `npm test -w @ol/arte`. Para publicar: agrega `--publicar`.

### Piernas y falda (2026-10-10)
Las piernas del cuerpo base son las exactas del arte base (0 píxeles de diferencia). La falda y el abrigo rellenan el espacio entre las piernas de frente y de espalda (de pie, caminando y sentado); detalle en `src/personaje/v5/LEEME.md`.

### Migración de cuentas
`migrarAvatar` (`shared/src/personaje-migracion.ts`) conserva los ids que siguen y cae a lo más parecido con los demás: los 41 peinados de la v4 a los 12 de la v5 (los `peinado-hoja-NN` según su número), `arriba-sin-mangas`, `rayas` y `estampada` a camiseta, las 18 chaquetas a las 5, los 10 vellos a los 4, bermuda y short a `abajo-corto`, mocasines a zapatos de vestir, y los accesorios a su equivalente (los que no tienen, como cola, collar o peluche, se quitan). Solo queda una pieza por carpeta (un sombrero, unas gafas, un «Otro»).

### Pendiente de ojo de diseño
- Las piernas de perfil al caminar son tiras derivadas (zancada reducida a 2 columnas el 2026-10-10, ver `LEEME.md`); las caras de perfil y espalda son derivadas (conviene revisarlas).
- Las prendas se diferencian por detalle (cuellos, botones, solapas, bolsillos, tejido): las piernas de la base miden 3 filas, así Abajo y Zapatos se parecen más entre sí.
- Pelo largo de espaldas, afro y rizos largos (sobresalen del domo), y los disfraces (calamar, vampiro, zorro) piden retoque fino.
- Falta ampliar el catálogo (peinados 36 a 42, prendas 10 a 18 por categoría, accesorios 12 a 15) y los disfraces de las demás fiestas; ver las estimaciones en `arte/src/personaje/v5/LEEME.md`.
- Dos tipos de cuerpo (masculino y femenino, referencia 08): solo si se pide.
- Mascotas en el perfil de la tarjeta (HUD) y en Mi cuenta: no se dibujan todavía.

## Qué se borró (etapa 3)
Todo el arte de la v4: el cuerpo y las partes de 32 x 48 (`cuerpo-base.ts`, `rig.ts`, `armado.ts`, `partes/`, `mascara.ts`, `luz.ts`, `raster.ts`, `contorno.ts`, `deriva.ts`), las herramientas de la hoja 07 (`hoja07.ts`, `base07.ts`, `derivar07.ts`, `extraer07.ts`, `transcribir-hoja07.ts`, `hojas-base07.ts`, `propuesta-hires.ts`, `util-partes.ts`), el atlas `personajes-v4.png` y su json, y sus hojas de revisión. Se conserva la hoja aprobada 07 como referencia en `referencia/estilo-pixel-gba/`.

## Mascotas

Criaturas pequeñas que acompañan al personaje (Gather no las tiene; son un extra nuestro). Todas originales.

### Etapa 1, arte (hecha 2026-10-10)
- 12 mascotas: gato, perro, conejo, búho, pollito, panda, rana, zorro (animales) y dragoncito, nube, hongo, fantasmita (fantásticas). 3 colores cada una (recoloreo de `accA` principal y `accB` secundario; `colores.ts`).
- Cuadro de 32 x 32 con la figura en 24 x 24 (columnas 4 a 27, filas 8 a 31) y los pies en la fila 31. Las flotantes (nube, fantasmita) quedan 2 a 4 filas arriba. 4 direcciones (S, O, E, N; O es el espejo de E) x 4 cuadros: 0 quieto, 1 y 2 pasos, 3 sentada o dormida (ojos cerrados). 192 cuadros en el atlas `mascotas-v1` (1022 x 240 px).
- Código: `arte/src/mascota/` (`pincel.ts` formas con sombreado y contorno automáticos, `ctx.ts` esqueleto cabeza grande + cuerpo + pies, `especies.ts` las 12, `colores.ts`, `index.ts` constructor y hoja). Contrato en `shared/src/mascota.ts`.
- Construir: `npm run construir -w @ol/arte -- --solo=mascotas` (hoja `arte/salida/mascotas-v1.png`); publicar: agrega `--publicar` (escribe `web/public/assets/arte/mascotas-v1.png` y `shared/src/catalogo/mascotas-v1.json`). Prueba: `arte/tests/mascotas.test.ts`.
- Para agregar una mascota: define su función en `especies.ts` (con `chibi(cfg, v, f)` o a mano), sus 3 variantes en `colores.ts` y súmala a `ESPECIES`. Los ids publicados no cambian: las personas guardan ids.

### Etapa 2, contrato, servidor y permisos (hecha 2026-10-10)
- `AvatarSpec.mascota?: { id, color, nombre? }` (`shared/src/mascota.ts`). El nombre es opcional (hasta 20 letras). No entra en `claveAvatar`: no cambia el dibujo del personaje. Cuentas existentes: no hace falta migración (el campo es opcional); `migrarAvatar` lo conserva.
- Catálogo `mascotas-v1.json`: el servidor lo lee con `catalogoMascotas()` (`server/src/personaje/catalogo.ts`) y lo entrega en `GET /api/cuenta/personaje/catalogo` junto con los paquetes de la persona. Validación en `motivoNoValido` (id, color, nombre y permiso) y zod en `rutas/cuenta.ts`.
- Decisión de diseño: nadie tiene mascota por defecto ni ropa premium; se piden a un administrador. Paquetes nuevos en `shared/src/acceso.ts` (grupo Personaje): `ropa-premium`, `mascotas` (las 12), `mascotas-animales` (8) y `mascotas-fantasticas` (4). El paquete viejo `accesorios-especiales` se convierte solo en `ropa-premium` (`PAQUETES_RENOMBRADOS`). Aviso al usuario: `AVISO_ASIGNACION` («Pídele a un administrador que te la asigne.»).
- Ropa premium: `ParteCatalogo.premium?: true`. Lista en `arte/src/personaje/premium.ts` (chaquetas 7 de 18, sombreros 6 de 15, gafas 5 de 12 y Otro 5 de 12; libre 58 a 61 %). Lo básico (cabello, vello, arriba, abajo, zapatos) no lleva marca. Disfraces: siguen con fechas y paquetes de fiesta. Para cambiar la lista: edita `premium.ts` y publica con `--solo=personajes --publicar` (los ids no cambian).
- Quien ya lleva puesta una parte premium la conserva: `personajeVisible` no se la quita y `motivoNoValido(spec, paquetes, fecha, previo)` acepta lo que ya estaba guardado; solo se bloquea elegir piezas premium nuevas. La mascota sí se quita de la vista si no tiene paquete (y vuelve si se le asigna). `avatarAlAzar(cat, semilla, conPremium = false)` solo sortea ropa básica y nunca mascota.
- Administración > Cuentas (`CuentaModales.tsx`, `PATCH /api/admin/usuarios/:id`): los paquetes nuevos salen solos en el grupo Personaje con su descripción; al guardar, si la persona está conectada, `perfilCambiado` actualiza al instante su personaje (y su mascota) para todos, y el creador pide los paquetes cada vez que se abre.
- Presencia: la mascota viaja dentro de `avatar` (mensajes `entra`, `bienvenida` y `avatar`). Pruebas: `server/tests/perfil.test.ts`, `server/tests/presencia.test.ts`, `shared/tests/mascota.test.ts`, `shared/tests/acceso.test.ts`, `arte/tests/premium.test.ts`.

### Etapa 3, motor (hecha 2026-10-10)
- `web/src/mundo/mascota-motor.ts` (sin Phaser, probado en `mascota-motor.test.ts`): la mascota sigue las «migas» de su dueño a 22 px por el camino recorrido, un poco más rápida; usa la misma caja y rejilla de colisión que las personas (no atraviesa paredes ni muebles); si algo se interpone, rodea con A* (a lo sumo cada 0,5 s); con el dueño quieto 0,35 s se acomoda a su lado; se sienta a los 2,5 s y duerme a los 14 s; si el dueño se sienta, busca una casilla libre junto a su silla; aparece junto al dueño si cambia de sala, queda a más de 11 casillas o se atasca 1,6 s. 50 mascotas por 20 s simuladas cuestan poco (prueba incluida).
- `web/src/mundo/capa-mascotas.ts` dibuja sprite, sombra (`sombra-mascota`), una «z» al dormir y la etiqueta con el nombre al pasar el puntero (el nombre que le puso su dueño o el de su especie). Profundidad por los pies, igual que las personas; se oculta con la vista esquemática. `mascotas.ts` arma las hojas recoloreadas (una por mascota y color, en caché). Integración en `escena.ts` y `Arte.fuenteMascotas()`; todos los clientes simulan la mascota de cada persona a partir de su posición mostrada.

### Etapa 4, creador (hecha 2026-10-10)
- Categoría 12 «Mascota» al final de `CATEGORIAS_EDITOR`: «Ninguna» (por defecto), cuadrícula con las 12, 3 colores, nombre opcional y vista previa con la mascota junto al personaje (camina y gira con él). Las mascotas sin permiso salen con candado y «Pídele a un administrador que te la asigne.».
- La ropa premium sin paquete (chaquetas, sombreros, gafas, Otro) sale con candado y el mismo aviso; lo que ya lleva puesto se puede seguir eligiendo. «Al azar» no cambia la mascota.
- Se verificó en el navegador: sigue al dueño, sentada al lado, dormida con etiqueta, junto a la silla y en el creador.

### Pendiente de ojo de diseño
- Revisar el tamaño de las mascotas frente al personaje (24 x 24 contra 17 x 26), las alas y los cuernos del dragoncito y las pupilas del búho en sentada.
- Mascotas en el perfil de la tarjeta (HUD) y en Mi cuenta: no se dibujan todavía.
