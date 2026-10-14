# Guía de objetos v2: cómo se agrega un lote nuevo (molde del lote 8)

Esta guía sigue a `GUIA-OBJETOS.md` (el contrato de medidas, anclaje, orientaciones y variantes, que sigue vigente) y a `GUIA-ESTILO-GATHER-V2.md` (el estilo medido). Aquí está el paso a paso para que otra persona agregue un lote de objetos (Fase B, una categoría por lote) sin pisar a los demás, y la tabla de lo que falta.

## Estado de las etapas (lote 8, Fase A)

| Etapa | Qué es | Estado |
|---|---|---|
| 1 | Medición de Gather v2 (`arte/herramientas/medir-gather.ts`) y paleta (`pizarra`, 6 colores; quedan 8 libres) | LISTA |
| 2 | Mecanismo de lotes en `shared`: `inventario-def.ts`, `inventario-lotes/`, `l8.ts` (46 objetos), tipo `lote: number`, campo `obsoleto` | LISTA |
| 3 | Limpieza de lotes viejos (lotes 1, 2b, 4 y 7) y pruebas ajustadas | LISTA |
| 4 | Molde: escritorios, silla, ayudas (`l8-comun.ts`), PCs de ejemplo (`l8-pcs.ts`), accesorios (`l8-accesorios.ts`), escenas y vista previa | LISTA |
| 5 | Los 29 equipos de la categoría de referencia: `l8-pcs.ts`, `l8-pcs-b.ts`, `l8-pequenos.ts`, `l8-maquinas.ts` | LISTA (46 de 46 objetos, 131 cuadros) |
| 6 | Publicación de `objetos-v9` y republicación de los atlas viejos (v1, v3, v4, v8) sin los objetos reemplazados | LISTA |
| 7 | Revisión en el mundo (`/oficina`, modo Construir) | LISTA (los objetos nuevos salen en el catálogo, se colocan y se ven bien; el catálogo todavía muestra los obsoletos) |
| 8 | Conectar los ids nuevos en `shared/src/mapa-inicial.ts` y ocultar los `obsoleto` en el catálogo del editor | PENDIENTE (lo hace quien rehace el mapa y la interfaz) |

## Qué se reemplazó (tabla de reemplazos del lote 8)

| Objeto viejo | Qué pasó | Reemplazo |
|---|---|---|
| `escritorio-individual` (2x1, lote 1) | OBSOLETO (sigue dibujándose: lo usan mapas guardados) | `escritorio-3x1` |
| `escritorio-doble` (2x2, lote 1) | OBSOLETO | `escritorio-3x2` |
| `escritorio-largo` (4x1, lote 7) | OBSOLETO (lote 7 queda solo con él) | `escritorio-3x1` |
| `silla-oficina` (lote 1) | redibujada con el MISMO id (lote 8) | la misma, estilo Gather |
| `monitor` (lote 1), `portatil` (lote 2b) | redibujados con el mismo id; conservan 4 orientaciones | los mismos |
| `pc-gamer` (lote 4), `pc-doble`, `torre-pc`, `mochila`, `audifonos-escritorio` (lote 7), `lampara-escritorio` (lote 3), `planta-chica` (lote 2b) | redibujados con el mismo id | los mismos |
| `monitor-doble`, `impresora` (lote 2b) | ELIMINADOS (nadie los usaba) | `pc-doble`, `impresora-oficina` |
| `pc-triple`, `pc-ultrawide`, `laptop-puesto` (lote 7) | ELIMINADOS (nadie los usaba) | `pc-desarrollador`, `pc-gamer` (pantalla curva), `laptop-dock` |

Los obsoletos (`obsoleto: true`, `reemplazadoPor`) siguen en `INVENTARIO` para que los mapas guardados no se rompan; el catálogo del editor debe ocultarlos (`o.obsoleto`). Se pueden borrar (inventario, arte y atlas) cuando `mapa-inicial.ts` y el mapa publicado ya no los usen.

Quedan SIN rehacer, para la Fase B (categoría mesas y almacenaje): `escritorio-l`, `escritorio-de-pie`, `mesa-compartida-6`, `locker`, `archivador`, `cajonera`, `panel-divisor`, `papelera`, `silla-ejecutiva`, `silla-reunion`, `sillon-gamer` y el resto de asientos.

## Pasos para agregar un lote nuevo (por ejemplo el lote 9)

Convención: el lote N se llama `objetos-loteN`, su atlas `objetos-v(N+1)` y todo lo suyo lleva el prefijo `lN-` (en `arte/src/objetos/`) o `lN` (en `shared/src/inventario-lotes/`).

1. **Define los objetos** en `shared/src/inventario-lotes/l9.ts` (nuevo). Copia la cabecera de `l8.ts`: importa `def`, `luz`, `CUATRO`, `HV`, `U`... de `../inventario-def` y exporta `LOTE_9: readonly ObjetoCatalogo[]` con `lote: 9` en cada `def({...})`. El tipo `lote` acepta cualquier número. Una pieza por línea. Los ids son `kebab-case` en español, únicos en todo el inventario (hay una prueba).
2. **Súmalo al inventario** en `shared/src/inventario-lotes/index.ts`: dos líneas, `import { LOTE_9 } from './l9';` y agregar `LOTE_9` al arreglo `LOTES_EXTRA`. No hace falta tocar `inventario.ts`.
3. **Dibuja** en `arte/src/objetos/l9-<grupo>.ts` (uno o varios archivos). Cada archivo exporta `cuadros<Grupo>(): Cuadros` y registra con `registrar(c, id, clave, lienzo[, rampaBase])` o `registrarVariantes`. Importa las piezas de `./l8-comun` (monitor, teclado, pantallas, acabados) y los materiales que necesites; si una pieza es de tu categoría, déjala en tu archivo. Las pruebas del lote 8 (`objetos-lote8.test.ts`) son la plantilla de las tuyas.
4. **Junta los grupos** en `arte/src/objetos/l9-todo.ts` (copia `l8-todo.ts`): lista de grupos, `construirLote9()` que revisa que no falte ni sobre ningún cuadro y devuelve `terminados` y `pendientes`.
5. **Registra el constructor** en `arte/src/objetos/lote9.ts` (copia `lote8.ts`): `registrarConstructor('objetos-lote9', ...)`, hojas de contacto por categoría, escenas y `publicarObjetos(ctx, 'objetos-v10', terminados, cuadros)`.
6. **Regístralo en el índice** `arte/src/objetos/index.ts`: agrega `'./lote9'` a la lista de módulos. NO hace falta tocar `arte/src/construir.ts`: ya importa `objetos/index.ts` y ejecuta los constructores registrados.
7. **Web**: no hay que tocar nada. `web/src/mundo/arte.ts` carga solo todos los `shared/src/catalogo/objetos*.json`. Ojo: el mismo id de cuadro NO puede estar en dos atlas (se ordenan por nombre y `objetos-v10` queda antes de `objetos-v2`); si rehaces un objeto viejo con el mismo id, quítalo del lote viejo (código, lista de ids, prueba) y republica ese atlas.
8. **Vista previa mientras dibujas**: `npx tsx arte/herramientas/ver-lote8.ts <grupo>` (cámbiale el nombre para tu lote) dibuja la hoja de contacto y una escena con tus objetos sobre un escritorio de 3 casillas con silla; compárala con una captura local de estudio con `escenasDelLote8` (la hoja `comparacion` pone el recorte de Gather a su tamaño nativo junto a lo nuestro, a escala 3).
9. **Construye y publica**: `npm run construir -w @ol/arte -- --solo=objetos-lote9` (no escribe nada fuera de `arte/salida/`) y, cuando esté bien, `... --solo=objetos-lote9 --publicar`. NUNCA publiques sin `--solo`. Solo se publican los objetos con TODOS sus cuadros; los pendientes salen en el registro.
10. **Pruebas**: `arte/tests/objetos-lote9.test.ts` (copia `objetos-lote8.test.ts`): lista y medidas exactas de cada cuadro, solo colores de la paleta, alfa binario, sin píxeles sueltos, contorno azul marino, variantes distintas de la base, orientaciones distintas, sombras coherentes, determinismo y atlas válido. Corre `npm run arte`, `npm run typecheck` y `npm test` desde la raíz.

Reglas que se olvidan:

- Orientaciones guardadas: `orientacionValida` se revisa al validar un mapa. Si rehaces un objeto con el mismo id, conserva sus orientaciones y variantes (un mapa guardado puede tener `monitor` mirando al norte). Lo apoyado de la categoría `tecnologia` con orientación `S` se dibuja siempre con el cuadro `S` (`frameDeColocacion`).
- Un solo objeto apoyado por casilla (`Ya hay algo apoyado ahí`). Los equipos incluyen su teclado y ratón.
- Los objetos de la categoría `puestos` que no son apoyados cuentan como escritorios para sentarse y asignar puestos (`web/src/mundo/escritorios.ts`): no pongas ahí nada que no lo sea.
- Lo apoyado se dibuja con su borde de abajo en la fila `pie(sobresale)` (equipos: la fila 10 de la casilla; accesorios chicos: la 14).
- Las tablas de pruebas viejas cuentan objetos por lote (`oficina.test.ts` lista los lotes 1 a 7). Los lotes nuevos no cambian esas cuentas.
- Texto en español neutro, sin rayas largas ni medias (una prueba lo revisa en todo `arte/`).

## Qué falta contra las categorías de referencia

Los conteos de «tenemos» son aproximados (equivalentes por nombre y función); la Fase B afina cada categoría.

| Categoría de referencia | Referencia | Tenemos | Faltan | Dónde van | Lote sugerido |
|---|---|---|---|---|---|
| Computadores y tecnología | 29 | 29 | 0 | `tecnologia` | 8 (hecho) |
| Decoración | 172 | unos 45 | 0 (127 del lote 10; el almacenaje fue del lote 9) | `decoracion`, `juegos` y `temporada` | 10 (hecho, ver abajo) |
| Comida y bebida | 89 | 78 del lote 11 (más las tazas del lote 8 y lo que ya existía) | 0 (las religiosas o de otros países quedan fuera a propósito) | `cocina` | 11 (hecho, ver abajo) |
| Exterior | 52 | 41 del lote 13 (38 equivalentes de la referencia y 3 extras nuestros) más 13 equivalentes que ya existían | 0 (la menorá pública queda fuera a propósito) | `exterior` y `temporada` | 13 (hecho, ver abajo) |
| Pared | 101 | unos 23 colgados más 77 del lote 12 | 0 (los de otros países, religiosos y con animales quedan fuera a propósito) | `decoracion`, `paredes` y `temporada` con `montado` o aberturas | 12 (hecho, ver abajo) |
| Almacenaje | 23 | 21 del lote 9 más `estante-plantas` y `comoda` (ya existían) | 0 | `decoracion` (no `puestos`) | 9 (hecho) |
| Mesas y escritorios | 45 | 45 del lote 9 (21 mesas en 3 tamaños, 11 sueltas, 13 escritorios) | 0 | `mesas` y `puestos` | 9 (hecho) |
| Asientos | 51 | 49 del lote 9 más `silla-oficina` y `sillon-gamer` | 0 | `asientos` | 9 (hecho) |
| Juegos e interactivos | 13 | 13 interactivos del lote 13 (genéricos, con enlace) más 12 de ocio y 16 de deportes que ya existían | 0 | `juegos` | 13 (hecho, ver abajo) |
| Objetos inteligentes | 3 | 3 de adorno del lote 13 (bandeja de entrada, monitor de estado, bombilla de estado) | 0 de dibujo; falta conectarlos a datos vivos | `colaboracion` | 13 (dibujo hecho; datos vivos pendientes) |

Una orden de trabajo por lote: elegir los objetos de la categoría de referencia (lista local de estudio), darle a cada uno su nombre en español, su tamaño en casillas (tabla de arriba para las mesas) y su uso, y dibujarlos con este molde.

## Lote 9 (Fase B): asientos, mesas y almacenaje

Estado: HECHO las tres etapas (asientos, mesas y escritorios, almacenaje): 115 objetos y 1669 cuadros.

| Categoría | Objetos | Cuadros | Atlas | Archivos de dibujo |
|---|---|---|---|---|
| Asientos | 49 | 893 | `objetos-v10` | `l9-sillas.ts` (20 sillas), `l9-sofas.ts` (29: sofás, butacas, módulos, bancas, huevos, columpio, puf) |
| Mesas y escritorios | 45 | 440 | `objetos-v10-mesas` | `l9-mesas.ts` (21 mesas de 7 familias en 3 x 1, 3 x 2 y 3 x 3, 5 rectangulares sueltas, 5 redondas y el soporte de plantas, 13 escritorios) |
| Almacenaje | 21 | 336 | `objetos-v10-almacenaje` | `l9-almacenaje.ts` (libreros, estantes, taquillas, gabinetes, cajoneras, baúl, andamio, carrito) |

Cómo está hecho (para el que siga):

- **Motor de cajas.** Cada mueble es un `Modelo` de cajas en el plano `S` (`l9-comun.ts`, sobre `l2a-cajas.ts`) y de ahí salen las cuatro orientaciones. `dibujarModelo` ajusta sola la escala vertical para que quepa en el cuadro y cierra con el contorno y la sombra de Gather v2 (`cerrarSuelo`). Para agregar un asiento nuevo basta una receta en `RECETAS_SILLAS` o `RECETAS_SOFAS` (o una función `silla()`/`sofa()` con otras piezas) y su línea en `shared/src/inventario-lotes/l9.ts`.
- **Mesas.** `mesa()` arma tapa, patas, cajoneras y detalles (vetas, tablones, incrustación, anillos de tronco, remaches, transportador, tablero inclinado, recorte octagonal u ovalado). Las tres medidas de una familia salen de la misma función. Las redondas se dibujan directo (`mesaRedonda`) y no giran.
- **Variantes.** Se recolorea solo el material principal (`desde` de cada receta, rampas de `TAPICES` o de madera, metal, pizarra). `registrarR` falla si una variante sale igual a la base, y si una madera clara pide `madera` pasa a la oscura.
- **Atlas.** Tres atlas (uno por categoría) porque juntos medían 1022 x 4866 y las texturas de más de 4096 de alto no cargan en todas las tarjetas. La prueba exige que cada uno mida 4096 o menos.
- **Pruebas:** `arte/tests/objetos-lote9.test.ts`. **Vista previa:** `npx tsx arte/herramientas/ver-lote9.ts <sillas|sofas|mesas|almacenaje> [escala] [filtro]`. **Revisión:** `arte/salida/objetos-lote9-{asientos,mesas,almacenaje}.png` y las escenas `objetos-lote9-escena-sala.png` y `objetos-lote9-escena-comparacion.png` (sala a escala 1 y tres recortes a escala 3).

Supuestos y pendientes:

- Tamaños en casillas: solo las mesas (3 de ancho por 1, 2 y 3) y los escritorios (3 de ancho) vienen de Gather. Los demás se estimaron por función: sofás de 2 o 3 casillas, bancas de 2, módulos y sillas de 1, chaise de 1 x 2, libreros y estantes de 2 de ancho, mesas de centro de 2. Si Gather usa otra medida, se cambia el `def` en `l9.ts` y el `W`/`D` del modelo.
- Equivalencias con lo que ya existía: `silla-oficina` (Office Chair), `sillon-gamer` (Gamer Chair), `estante-plantas` (Plant Shelf) y `comoda` (Chest of Drawers) no se redibujaron. El Mason Jar Shelf ya tenía `estante-frascos` (lote 3, estilo viejo); el nuevo es `estante-conservas`. Los muebles viejos de `puestos` y `asientos` (`locker`, `archivador`, `silla-ejecutiva`, etc.) siguen en su estilo anterior y se pueden marcar obsoletos cuando el mapa deje de usarlos.
- Los escritorios del lote 9 son de la categoría `puestos` (cuentan como escritorio para asignar puestos). El almacenaje va en `decoracion` a propósito.
- Los objetos colgantes (columpio, huevo de mimbre) son asientos de piso con su estructura. Los dibujos de mesas sueltas redondas tienen una sola orientación.
- Sin conectar en `mapa-inicial.ts` ni en la interfaz del editor (igual que el lote 8): aparecen solos en el catálogo.

## Lote 10 (Fase B): decoración

Estado: HECHAS las cuatro etapas por orden de prioridad (1 plantas y lámparas, 2 peceras, relojes y arte, 3 juegos, deportes e instrumentos, 4 el resto): 127 objetos, 232 cuadros, un solo atlas `objetos-v11` (1022 x 476, sin publicar).

| Familia | Objetos | Archivo de dibujo |
|---|---|---|
| Plantas y macetas | 35 | `l10-plantas.ts` |
| Lámparas y velas | 15 | `l10-luz.ts` |
| Arte, museo, jarrones, atriles y figuras | 18 | `l10-luz.ts` |
| Aparatos, instrumentos, oficina y hogar | 33 | `l10-piezas.ts` |
| Deportes (categoría `juegos`) | 16 | `l10-deportes.ts` |
| Temporada (Halloween, Navidad, Pascua) | 10 | `l10-deportes.ts` |

Cómo está hecho:

- **Dibujo directo, pieza por pieza** (no cajas): `l10-comun.ts` trae las rampas como funciones (`PL(2)`, `WO(3)`...), `maceta`, `abanico` de hojas, `copa` de follaje, `flor`, `bloque`, `vela`, `hojaPapel`, y los cierres `suelo` (contorno y sombra de dos tonos con mancha de contacto) y `apoyado`. Lo apoyado se apoya en la fila `pieA(s) = s + 14`, igual que los accesorios del lote 8.
- **Variantes por recoloreo** con `registrarR` (de `l9-comun.ts`): macetas de barro (`blanco`, `negro`, `azul`, rampa `maceta-terracota`), flores (`amarillo`, `morado`, `blanco`, rampa `rojo-suave`), y pantallas, faroles, balón de playa, tabla de surf, regalo y otros con su rampa propia. Cada objeto con variantes se dibuja con UNA sola rampa en el material que cambia.
- **Tamaños** estimados por función (Gather no los publica): todo de 1 x 1, salvo jardineras, cajón de siembra, seto, muro de bambú, radiador, contenedores, biombos, divisor y pared de escalada (2 x 1), y la planta carnívora gigante (2 x 2).
- **Fuera por religiosas o de otros países:** Shofar, Tzedakah, Kinara de Kwanzaa, Hagadá, Menorah, Ofrenda, sobre de Año Nuevo Lunar, olla de oro, cuerno de la abundancia, gavillas, tallos de maíz, calabazas decorativas y vuvuzela.
- **Ya existían y no se redibujan:** Small y Large Fishtank (`pecera`, `acuario`), Water Cooler, Vending Machine, Mini Fridge y Fridge, Traffic Cone, Rubber Ducky, Grandfather Clock, Guitar, Upright Piano, Arcade, Pool Table, Soccer Ball, Teddy Bear, Cauldron, Christmas Tree, Jack-o'-Lantern, Witch Broom, cuadernos, lámparas de escritorio, Trophy, Headphones, Camera On Tripod, Office Divider, Bike Rack, Presents, **Ping Pong Table (`mesa-pingpong`) y Foosball Table (`futbolin`)** (estas dos estaban en el lote 2, categoría `mesas`; se detectó el choque de ids al probar y se quitaron del lote 10).
- **Pruebas:** `arte/tests/objetos-lote10.test.ts`. **Vista previa:** `npx tsx arte/herramientas/ver-lote10.ts <plantas|luz|piezas|deportes> [escala] [filtro|todo] [columnas]` (el filtro admite varios ids con `|`). **Revisión:** `arte/salida/objetos-lote10-{plantas,lamparas,arte,piezas,deportes,temporada}.png` (una hoja por familia) y las escenas `objetos-lote10-escena-sala.png` y `objetos-lote10-escena-comparacion.png`.

Pendientes y supuestos:

- No se publicó el atlas (`--solo=objetos-lote10 --publicar`) por instrucción; hay que publicarlo y conectar en el editor.
- Las piezas de temporada llevan `coleccion`; la `flecha-piso` va en la capa `suelo` y la `flecha-flotante` es de piso sin bloquear.
- El `mesa-simple-3x1` de la escena sirve de soporte de lo apoyado; ningún objeto del lote tiene orientaciones.

## Lote 11 (Fase B): comida y bebida

Estado: HECHAS las cuatro etapas por orden de prioridad (1 cafetería, 2 almuerzo, 3 frutas y postres, 4 platos colombianos y resto): 78 objetos, 115 cuadros, un solo atlas `objetos-v12` (1022 x 162, publicado).

| Familia | Objetos | Archivo de dibujo |
|---|---|---|
| Cafetería: máquinas, teteras, tazas, termos, estación de espresso | 17 | `l11-cafe.ts` |
| Bebidas: latas, botellas, copas, cócteles, bebidas calientes, tinto | 21 | `l11-bebidas.ts` |
| Almuerzo: pizza, hamburguesa, sushi, sopas, carnes, panes | 26 | `l11-almuerzo.ts` |
| Frutas, postres y platos colombianos (arepa, empanadas, pandebono, ajiaco, bandeja paisa, buñuelos: extras nuestros) | 14 | `l11-dulces.ts` |

Cómo está hecho:

- **Cuadrícula de texto.** `l11-comun.ts` trae `spr(id, filas, paleta local)`: un carácter por píxel con una letra por tono (`PAL`: `w` blanco, `A` metal claro, `e` vidrio claro, `p` madera clara...). Toma el alto del inventario (`sobresale`), centra y cierra con contorno y sombra. `dib(id, (l, fb) => ...)` hace lo mismo con funciones (elipses sombreadas, `taza`, `plato`, `cuenco`) para lo redondo.
- **Variantes por recoloreo** con `registrarR` y la rampa del material que cambia en `desde`: cafeteras y teteras, termos, latas, jugos, donas, té boba.
- **Tamaño:** todo de 1 x 1, apoyado y sin bloquear (`bloquea: 'nada'`), salvo `estacion-espresso` (piso, bloquea su casilla, emite luz). Lo apoyado usa `sobresale` 0, 8 o 16 según la altura.
- **Fuera por religiosas o de otros países:** jalá (dos), sufganiyot, plato del Séder, matzá, latkes, copa del Kidush, miel de Rosh Hashaná, taza de la Unidad, pasteles de luna, banh chung, pan de Pascua con cruz, conejo de chocolate, pastel y jarabe de arce de Canadá y knafeh.
- **Ya existían y no se redibujan:** taza regular, ancha y alta y vaso para llevar (lote 8), manzana (lote 3), bombones de San Valentín (`caja-chocolates`), bandeja de comida (`bowl-comida`), frutero y cafetera (lote 2).
- **Pruebas:** `arte/tests/objetos-lote11.test.ts`. **Vista previa:** `npx tsx arte/herramientas/ver-lote11.ts <cafe|bebidas|almuerzo|dulces> [escala] [filtro|todo] [columnas]`. **Revisión:** `arte/salida/objetos-lote11-{cafeteria,bebidas,almuerzo,dulces}.png` y las escenas `objetos-lote11-escena-sala.png` y `objetos-lote11-escena-comparacion.png`.

Pendientes y supuestos:

- Publicado el atlas; falta conectar en el editor (aparecen solos en el catálogo, categoría `cocina`).
- El dibujo es original, a la medida de los lotes anteriores (objetos de 10 a 24 px); algunos platos (pandebono, empanadas, granada abierta) se leen como formas simples a escala 1.

## Lote 12 (Fase B): objetos de pared

Estado: HECHAS las tres etapas por orden de prioridad (1 ventanas, relojes y cuadros, 2 luces, plantas de pared y paneles, 3 el resto): 77 objetos, 312 cuadros, un solo atlas `objetos-v13` (1022 x 634, publicado).

| Familia | Objetos | Archivo de dibujo |
|---|---|---|
| Ventanas (aberturas de la pared, categoría `paredes`) | 12 | `l12-ventanas.ts` |
| Relojes, cuadros, pinturas, pósters, macramé y teléfono | 31 | `l12-arte.ts` |
| Luces: cuerdas, linterna, farol, luz industrial, lámpara, hexágonos | 7 | `l12-luces.ts` |
| Plantas de pared, jardineras, paneles acústicos | 7 | `l12-plantas.ts` |
| Corcho, extintor, botón, armario, repisa, chimenea, aire, tuberías, ladrillo, espejo, timón, trofeo, letrero, banderas y fiestas | 20 | `l12-otros.ts` |

Cómo está hecho:

- **Un dibujo de frente, tres orientaciones.** Cada colgante lleva `MURO` (S, E, O). `l12-comun.ts` trae `registrarPared(c, id, dibujo, desde?)`: se dibuja SOLO el frente (cuadro de `ancho * 32` por `32 + sobresale`, cara de pared entre la fila 1 y la `H - 10`), se cierra con contorno y sombra de 1 px (`cerrarColgado`) y el lateral `E`/`O` sale solo: placa de 3 columnas pegada a la franja de la tapa, del color del marco (o de la rampa que cambia entre variantes). Ayudas de dibujo: `marco` biselado (`NOGAL`, `ROBLE`, `DORADO`, `NEGRO`, `BLANCO`, `PLATA`), `centrar`, `fondo`.
- **Ventanas.** Parten de `muroLiso('0101')` (frente) y `muroLiso('1010')` (lado) para encajar con las paredes vecinas: la tapa y la mitad de abajo del lateral no se tocan (lo revisa la prueba). Tienen `ventana: true` y el mismo emisor de `pared-ventana`, salvo la del aire acondicionado. Todas son de 1 casilla.
- **Variantes por recoloreo** (`registrarR` con la rampa en `desde`): relojes, cuadros abstractos, cuerda de luces de un color, linterna de papel, lámpara de pared, hexágonos, jardinera de ventana, paneles acústicos y armario.
- **Fuera por animales, otros países o festividades religiosas:** trofeo de ciervo, murciélago disecado, banderines de Canadá, EE. UU., Irlanda y Eid, estandartes del Año Nuevo Lunar y de Prosperidad, cruz, bandera de Juneteenth, Tío Sam, mapa de Japón, linterna de papel de Año Nuevo, corona de otoño y las banderas de orgullo distintas del arcoíris y del progreso.
- **Ya existían y no se redibujan:** reloj de pared (`reloj-pared`), TV de pared (`tv-pared`), corcho (`corcho`), cuadros genéricos, cuadro de mariposas grande, corona, guirnalda y calcetines de Navidad (lote 6), espejo y cortinas. La bandera de Colombia de asta (`bandera-colombia`) y la `chimenea` siguen; las nuevas son `bandera-colombia-pared` y `chimenea-antigua`. El `farol-marroqui` de mesa es del lote 10: el de pared es `farol-marroqui-pared`.
- **Piezas de fiesta nuevas** (`temporada`, con colección): banderines y trenza de ajos (Halloween), copos de pared (Navidad), bandera de Colombia de pared.
- **Letrero:** `letrero-oficina-live` lleva la marca de la plataforma (la casita de 3 x 3) y el nombre con la fuente de píxeles del pipeline.
- **Pruebas:** `arte/tests/objetos-lote12.test.ts`. **Vista previa:** `npx tsx arte/herramientas/ver-lote12.ts <ventanas|arte|luces|plantas|otros> [escala] [filtro|todo] [columnas]` (usa el filtro `@S` para ver solo los frentes). **Revisión:** `arte/salida/objetos-lote12-{ventanas,arte,luces,plantas,otros}.png` (una hoja por familia) y las escenas `objetos-lote12-escena-sala.png` y `objetos-lote12-escena-comparacion.png`.

Pendientes y supuestos:

- Publicado el atlas; falta conectar en el editor (aparecen solos en el catálogo; las ventanas, en `paredes`).
- Tamaños estimados por función: los cuadros panorámicos, canastas, armario, repisa, paneles, tuberías, ladrillo, chimenea y aire acondicionado son de 2 casillas; el letrero, de 3; todo lo demás, de 1.
- Los laterales `E` y `O` son placas simples (como la diana de dardos y el aro del lote 5); si se quiere más detalle de canto en alguna pieza, se dibuja aparte y se registra con `registrarR`.
- La TV de pared se dejó con el equivalente que ya existía (Gather solo trae una).

## Lote 13 (Fase B): exterior y juegos interactivos

Estado: HECHAS las tres etapas por orden de prioridad (1 árboles, agua y plantas, 2 juegos y pizarras, 3 el resto del exterior y los objetos inteligentes): 57 objetos, 78 cuadros, un solo atlas `objetos-v14` (1014 x 314, publicado).

| Familia | Objetos | Archivo de dibujo |
|---|---|---|
| Árboles: arce, sauce llorón, cerezo, palmera de coco, árbol de invierno, pino pequeño, pino pequeño nevado, pino grande nevado | 8 | `l13-arboles.ts` |
| Agua, piedra y plantas: estanque con koi, cascada, jardín zen, linterna de piedra, arbustos, helecho, hosta, equinácea, rosal, girasoles | 11 | `l13-jardin.ts` |
| Resto del exterior: troncos, tocón, fogatas, parrillas, carros de comida, antorcha tiki, carretilla, tendedero, flamingo, paca, panel solar, turbina, condensador, arco de otoño, mojón, mástil de cintas, fuegos artificiales | 22 | `l13-exterior.ts` |
| Juegos que abren un enlace (4 mesas, 4 cabinas y quioscos, torneo, minigolf, gong y 2 pizarras) | 13 | `l13-juegos.ts` |
| Objetos inteligentes de adorno (bandeja de entrada, monitor de estado, bombilla de estado) | 3 | `l13-juegos.ts` |

Cómo está hecho:

- **Dibujo directo, pieza por pieza** con las ayudas del lote 10 (`l10-comun.ts`) y las propias de `l13-comun.ts`: `mata` (follaje con contorno propio), `pisoPino` (con o sin nieve), `roca`, `tronco`, `rueda`, `mesaDeJuego` (tapa, canto y patas de 2 casillas) y `rejilla` (texto de píxeles).
- **Árboles grandes** de 2 x 2 con `sobresale` 64 (cuadro de 64 x 128) y bloqueo solo en la fila del tronco, igual que `pino` y `abedul`. Los pinos pequeños son de 1 x 1 (32 x 96).
- **Variantes por recoloreo** con `registrarR`: el arce pasa a otoño (`naranja`, `rojo`) desde la rampa `planta`; el cerezo a `blanco`; arbusto con flores, equinácea y rosal a `amarillo`, `morado` y `blanco`; los dos carros de comida a `azul` y `amarillo`; la bombilla de estado a `verde`, `rojo` y `azul`.
- **Juegos.** Todos con `interaccion: 'enlace'` (el enlace lo pone la administración en las propiedades del objeto colocado), nombres en español y dibujos genéricos: mesa de palabras secretas, mesa de pueblo y lobos, mesa de cartas de patrones, mesa de construcción de mazos, juego de bloques que caen, juego de dibujo en equipo, juego de adivinar, torneo de cuatro, minigolf, gong y dock de repositorio de código. La pizarra de pared es un colgante con `MURO` (S, E y O, con `registrarPared`); la de pie es de piso. Los objetos inteligentes son apoyados y de `colaboracion`, sin interacción por ahora.
- **Luces:** fogatas y antorcha tiki emiten luz (con parpadeo); la linterna de piedra, de noche.
- **Pruebas:** `arte/tests/objetos-lote13.test.ts` (incluye ids y cuadros no repetidos en todo el inventario). **Vista previa:** `npx tsx arte/herramientas/ver-lote13.ts <arboles|jardin|exterior|juegos> [escala] [filtro|todo] [columnas]`. **Revisión:** `arte/salida/objetos-lote13-{arboles,jardin,exterior,juegos}.png` (una hoja por familia) y las escenas `objetos-lote13-escena-sala.png` y `objetos-lote13-escena-comparacion.png`.

Equivalencias con la categoría de exterior de referencia (52):

- **38 dibujados nuevos:** pino pequeño, arce, estanque koi, helecho, linterna de piedra, hosta, pino pequeño nevado, carretilla, carro de piragua, antorcha tiki, equinácea, sauce llorón, parrilla de parque, jardín zen, turbina, cerezo, condensador de aire, arco de otoño, tendedero, parrilla de bola, paca de heno, girasol, tocón, tronco corto, fogata en pozo, caja de fuegos, fogata abierta, tronco largo, panel solar, flamingo, rosal, mástil de cintas, cohete, cascada, pino grande nevado, árbol de invierno, palmera de coco y carro de perros calientes.
- **13 con equivalente que ya existía y no se redibuja:** abedul, pino grande (`pino`), fuente, calabaza grande y las tres de calabazas (`calabaza-grande`, `calabazas`), las cuatro lápidas (`tumba`), muñeco de nieve y espantapájaros.
- **1 fuera por religiosa:** menorá pública de Hanukkah.
- **3 extras nuestros:** arbusto, arbusto con flores y mojón de piedra. Gather no los trae; `cerca` y `arbol-seco` ya existían.

Pendientes y supuestos:

- Tamaños estimados por función: fogatas, parrillas, plantas y troncos cortos de 1 x 1; estanque, cascada, jardín zen y árboles grandes de 2 x 2; carros, panel solar, turbina, troncos largos, mesas de juego, pizarras y torneo de 2; tendedero, arco de otoño y minigolf de 3. Si Gather usa otra medida, se cambia el `def` en `l13.ts` y el dibujo.
- Sin conectar en `mapa-inicial.ts` ni en la interfaz del editor: aparecen solos en el catálogo (`exterior`, `juegos`, `colaboracion`, y los fuegos artificiales en `temporada`, colección Año Nuevo).
- Los objetos inteligentes son solo adorno: falta conectarlos a datos (bandeja con pendientes, monitor con el estado de servicios, bombilla con la disponibilidad) y decidir qué variante de la bombilla se asigna a cada estado.
- Los laterales `E` y `O` de la pizarra de pared son placas simples, como los demás colgantes.

## Lote 14: baños con cubículos

Estado: HECHO, 9 objetos y 132 cuadros, un solo atlas `objetos-v15` (1022 x 260, publicado). Pedido: cubículos para los inodoros, con una puertica para privacidad.

| Familia | Objetos | Archivo de dibujo |
|---|---|---|
| Divisores y puerta (categoría `paredes`) | `divisor-cubiculo` (+16), `divisor-urinario` (+8), `puerta-cubiculo` (abertura de 1 casilla) | `l14-divisores.ts` |
| Accesorios (categoría `banos`) | `papelera-bano`, `dispensador-papel`, `dispensador-jabon`, `secador-manos` (colgados), `espejo-bano` (2 casillas, colgado), `lavabo-meson` (el lavamanos sin espejo, 3 orientaciones) | `l14-banos.ts` |

- Los divisores usan la geometría del divisor bajo (la tapa queda en las mismas filas; crece la cara) y flotan 3 filas sobre el piso. Variantes dibujadas a mano: gris azulado (`base`), `azul` y `madera`.
- La puerta es el tramo este-oeste con un hueco de 26 px; la hoja la dibuja `web/src/mundo/puertas.ts` en código, del color de la variante.
- `lavabo-meson` se recorta de `dibujarLavamanosS(false)` y `dibujarLavamanosLado(lado, false)` (parámetro nuevo `conEspejo`, por defecto `true`).
- **Pruebas:** `arte/tests/objetos-lote14.test.ts` (incluye ids y cuadros no repetidos y los dos baños armados sin avisos). **Revisión:** `arte/salida/objetos-lote14-{divisores,accesorios}.png` y las escenas `objetos-lote14-escena-{banos,comparacion}.png`.

## Tabla final: lo cubierto contra las 9 categorías de referencia

| Categoría de referencia | Referencia | Cubierto | Lotes | Estado |
|---|---|---|---|---|
| Computadores y tecnología | 29 | 29 | 8 | completa |
| Decoración | 172 | 172 (127 del lote 10, más lo ya existente y las piezas de temporada) | 10 | completa, menos las religiosas y de otros países a propósito |
| Comida y bebida | 89 | 78 del lote 11 más lo ya existente | 11 | completa, menos las religiosas y de otros países a propósito |
| Exterior | 52 | 51 (38 nuevos del lote 13 y 13 equivalentes ya existentes) | 13 | completa, menos la menorá pública (religiosa) |
| Pared | 101 | 100 (77 del lote 12 y 23 ya existentes) | 12 | completa, menos animales, otros países y religiosas a propósito |
| Almacenaje | 23 | 23 | 9 | completa |
| Mesas y escritorios | 45 | 45 | 9 | completa |
| Asientos | 51 | 51 | 9 | completa |
| Juegos e interactivos | 13 | 13 (genéricos, con enlace) | 13 | completa; falta que la administración ponga el enlace de cada uno |
| Objetos inteligentes | 3 | 3 (de adorno) | 13 | dibujo completo; faltan los datos vivos |

