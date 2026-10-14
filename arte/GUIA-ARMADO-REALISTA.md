# Guía del armado realista

Reglas y herramientas para que las plantillas y el editor armen la oficina de forma realista, inspirada en la experiencia de Gather: lo apoyado sobre las
mesas, sillas pegadas y centradas, y una revisión que avisa de lo que se ve mal. Todo vive en `shared/` (datos y reglas) y
se dibuja igual en el navegador (`web/src/mundo/vista-sala.ts`) y en el compositor del arte (`arte/src/objetos/compositor.ts`).

## 1. Objetos apoyados

Un objeto con `apoyado: true` (taza, monitor, jarrón, planta chica...) solo se coloca sobre una casilla cubierta por la tapa de
un mueble con superficie. No se guarda ninguna posición extra: al dibujar, `apoyosDe(sala)` calcula un desplazamiento en
píxeles `(dx, dy)` para cada apoyado y la vista lo aplica. Por eso un mapa viejo se ve corregido sin tocar lo guardado.

**Reglas** (`shared/src/superficies.ts` y `shared/src/apoyos.ts`):

- La casilla debe estar cubierta por la tapa de un mueble (la tapa tapa al menos el 15 % de la casilla, `CUBIERTA_MINIMA`).
  En mesas redondas la cubierta se mide con la elipse y el objeto se acomoda dentro del rectángulo inscrito (`zonaUtil`).
- Posición automática: el centro de la caja visible del objeto (medida sobre el dibujo, `superficies-cajas.ts`) va al centro de su
  casilla y se corre lo justo para que la caja entera quede dentro de la tapa. Se queda a 3 px del labio delantero
  (`FRENTE_LIBRE`) y puede sobresalir 4 px por detrás (`TOLERANCIA_ARRIBA`, el reborde y la perspectiva).
- Si no cabe (jarrón en un escritorio angosto, bandeja grande): el editor no lo deja y explica «No cabe sobre esta mesa.».
  Sin mueble debajo: «Ponlo sobre una mesa o un escritorio.».
- Muebles contra la pared (`contraPared`: mesón, barra, cómoda, aparador, gabinetes, baúl, cajonera): la base se apoya cerca del
  frente de la tapa y el cuerpo puede subir por detrás. Ahí caben cafeteras, microondas y plantas.
- Pantallas y computadores (`esDeFondo`: `computador-*`, `pc-*`, `portatil*`, `monitor`, `todo-en-uno`, `laptop-dock`, `tableta*`,
  `impresora-3d-*`, `consola-portatil`, `telefono-conferencia`) conservan su ancla vertical: se dibujaron para el fondo de los
  escritorios de 3 casillas. Solo se centran y se les deja pasarse 4 px por cada lado (`TOLERANCIA_LADOS`); su base debe quedar dentro de
  la tapa. Verificado en hoja (`minioficinas-despues.png`): se ven bien, sin cambiar el ancla.
- Ningún apoyado quedó sin lugar: los 191 caben al menos sobre 15 muebles (el que menos, sobre mesas grandes), así que
  ningún objeto pasó a objeto de suelo. Si un lote nuevo trae algo que no cabe en ninguna mesa, se pasa a suelo quitando `apoyado`
  en su `def` (el id no cambia) y se le da `bloquea`.
- Una casilla admite un solo apoyado (como antes).

**API**

- `tapaDe(objeto, orientacion)`: tapa del mueble en píxeles relativos a la esquina superior izquierda de su huella (`y` puede ser
  negativa). Orden de prioridad: `EXCEPCIONES` (a mano) > `TAPAS_MEDIDAS` (generado) > `FAMILIAS` (márgenes por familia).
  Las otras orientaciones se derivan por márgenes (la vista siempre es desde el sur: el labio queda abajo) salvo las que el medidor
  halló distintas.
- `soporteDe(sala, objeto, x, y, orientacion, ignorar?)`: `{ ok, sobre, dx, dy }` o `{ ok: false, motivo }`.
- `apoyosDe(sala)`: mapa id de colocación a `{ sobre, dx, dy }` (memoizado por sala).
- `evaluarColocacion` y `colocar` aplican la regla; `{ sinApoyo: true }` la salta (mapas viejos y plantillas heredadas; el editor nunca lo usa).
- `reubicarApoyado(sala, colocacion)`: la casilla libre más cercana donde sí cabe (lo usa «Arreglar»).

**Medir y revisar**

```
npx tsx arte/herramientas/medir-superficies.ts      # regenera superficies-medidas.ts y superficies-cajas.ts + tapas-medidas.png
npx tsx arte/herramientas/ver-armado.ts             # hojas antes/después en la carpeta local de salida
npx tsx arte/herramientas/_ver.ts --esc=4 id:S ...  # mira frames sueltos
```

Tapa = región clara de arriba hasta el labio delantero (donde la luminosidad cae), con 2 px de margen, leída en dos bandas laterales para
que enchufes y manijas del centro no confundan. Las lecturas que no se pudieron hacer (tapas oscuras con vetas) caen a `FAMILIAS`.

### Tabla de superficies (orientación S)

`x, y, w, h` en píxeles relativos a la huella. Huella: ancho x alto + sobresale.

| id | huella | x | y | w | h | forma |
|---|---|---|---|---|---|---|
| escritorio-individual | 2x1+0 | 3 | 0 | 58 | 16 |  |
| escritorio-doble | 2x2+0 | 3 | 0 | 58 | 48 |  |
| escritorio-l | 2x2+0 | 4 | 2 | 58 | 14 |  |
| mesa-compartida-6 | 4x2+0 | 4 | 7 | 122 | 27 |  |
| escritorio-de-pie | 2x1+0 | 4 | 3 | 58 | 5 |  |
| cajonera | 1x1+0 | 4 | 3 | 24 | 6 |  |
| mesa-reunion-4 | 2x2+0 | 4 | 7 | 58 | 43 |  |
| mesa-reunion-6 | 3x2+0 | 4 | 7 | 90 | 43 |  |
| mesa-reunion-8 | 4x2+0 | 4 | 3 | 120 | 37 |  |
| mesa-reunion-12 | 6x2+0 | 4 | 3 | 184 | 37 |  |
| mesa-redonda | 2x2+0 | 4 | 7 | 58 | 42 | elipse |
| mesa-centro | 2x1+0 | 6 | 7 | 54 | 16 | elipse |
| mesa-alta | 1x1+0 | 5 | 2 | 22 | 14 | elipse |
| mesa-comedor | 3x2+0 | 4 | 3 | 88 | 35 |  |
| mesa-pingpong | 3x2+0 | 3 | 0 | 90 | 48 |  |
| mesa-teams | 2x1+0 | 3 | 0 | 58 | 16 |  |
| meson | 3x1+8 | 2 | -4 | 92 | 9 |  |
| barra | 3x1+8 | 2 | -6 | 92 | 22 |  |
| mesa-terraza | 1x1+0 | 3 | 0 | 26 | 16 |  |
| comoda | 2x1+8 | 4 | -1 | 58 | 10 |  |
| mesa-billar | 3x2+0 | 3 | 0 | 90 | 48 |  |
| mesa-air-hockey | 3x2+0 | 3 | 0 | 90 | 48 |  |
| mesa-poker | 3x2+0 | 3 | 0 | 90 | 48 |  |
| mesa-ajedrez | 1x1+0 | 3 | 0 | 26 | 16 |  |
| escritorio-largo | 4x1+0 | 4 | 3 | 122 | 15 |  |
| escritorio-3x1 | 3x1+10 | 3 | -8 | 90 | 23 |  |
| escritorio-3x2 | 3x2+10 | 3 | -8 | 90 | 55 |  |
| mesa-tronco-3x1 | 3x1+10 | 3 | -6 | 91 | 24 |  |
| mesa-tronco-3x2 | 3x2+10 | 3 | -6 | 91 | 56 |  |
| mesa-tronco-3x3 | 3x3+10 | 3 | -6 | 91 | 88 |  |
| mesa-chippendale-3x1 | 3x1+10 | 3 | -6 | 91 | 21 |  |
| mesa-chippendale-3x2 | 3x2+10 | 3 | -6 | 91 | 53 |  |
| mesa-chippendale-3x3 | 3x3+10 | 3 | -6 | 91 | 85 |  |
| mesa-industrial-3x1 | 3x1+10 | 3 | -7 | 90 | 23 |  |
| mesa-industrial-3x2 | 3x2+10 | 3 | -7 | 90 | 55 |  |
| mesa-industrial-3x3 | 3x3+10 | 3 | -7 | 90 | 87 |  |
| mesa-simple-3x1 | 3x1+10 | 3 | -7 | 91 | 23 |  |
| mesa-simple-3x2 | 3x2+10 | 3 | -7 | 91 | 55 |  |
| mesa-simple-3x3 | 3x3+10 | 3 | -7 | 91 | 87 |  |
| mesa-pesada-3x1 | 3x1+10 | 3 | -8 | 91 | 26 |  |
| mesa-pesada-3x2 | 3x2+10 | 3 | -8 | 91 | 58 |  |
| mesa-pesada-3x3 | 3x3+10 | 3 | -8 | 91 | 90 |  |
| mesa-octagonal-3x1 | 3x1+10 | 3 | -7 | 91 | 24 |  |
| mesa-octagonal-3x2 | 3x2+10 | 3 | -7 | 91 | 56 |  |
| mesa-octagonal-3x3 | 3x3+10 | 3 | -7 | 91 | 88 |  |
| mesa-conferencia-3x1 | 3x1+10 | 3 | -7 | 91 | 22 |  |
| mesa-conferencia-3x2 | 3x2+10 | 3 | -7 | 91 | 54 |  |
| mesa-conferencia-3x3 | 3x3+10 | 3 | -7 | 91 | 86 |  |
| mesa-lateral-moderna | 1x1+8 | 5 | -4 | 22 | 14 | elipse |
| mesa-centro-redonda | 2x2+8 | 3 | -5 | 58 | 46 | elipse |
| mesa-elegante-marmol | 1x1+8 | 5 | -4 | 22 | 14 | elipse |
| mesa-elegante-redonda | 1x1+8 | 5 | -4 | 22 | 14 | elipse |
| mesa-piedra | 2x1+10 | 3 | -6 | 59 | 24 |  |
| mesa-cuadrada | 2x2+10 | 3 | -7 | 59 | 55 |  |
| mesa-centro-antigua | 2x1+8 | 3 | -4 | 59 | 21 |  |
| mesa-centro-tronco | 2x1+8 | 3 | -4 | 59 | 24 |  |
| mesa-redonda-grande | 3x3+10 | 4 | -6 | 90 | 85 | elipse |
| mesa-centro-simple | 2x1+8 | 3 | -4 | 59 | 7 |  |
| escritorio-simple | 3x1+10 | 3 | -7 | 91 | 23 |  |
| escritorio-chippendale | 3x1+10 | 3 | -7 | 91 | 21 |  |
| escritorio-zen | 3x1+10 | 3 | -5 | 91 | 22 |  |
| escritorio-ovalado | 3x1+10 | 3 | -7 | 90 | 23 |  |
| escritorio-industrial | 3x1+10 | 3 | -7 | 90 | 23 |  |
| escritorio-ejecutivo-antiguo | 3x1+10 | 3 | -7 | 90 | 23 |  |
| escritorio-oficina | 3x1+10 | 3 | -7 | 91 | 23 |  |
| escritorio-bauhaus | 3x1+10 | 3 | -6 | 91 | 22 |  |
| escritorio-patas-nelson | 3x1+10 | 3 | -6 | 91 | 22 |  |
| escritorio-ejecutivo-moderno | 3x1+10 | 3 | -7 | 91 | 21 |  |
| mesa-de-dibujo | 3x1+10 | 3 | -7 | 90 | 23 |  |
| escritorio-transportador | 3x1+10 | 3 | -6 | 91 | 23 |  |
| escritorio-madera-recuperada | 3x1+10 | 3 | -7 | 90 | 23 |  |
| mueble-planos | 2x1+8 | 2 | -6 | 60 | 12 |  |
| aparador-moderno | 3x1+8 | 2 | -6 | 92 | 11 |  |
| baul-vapor | 2x1+8 | 3 | -6 | 59 | 12 |  |
| gabinete-curiosidades | 2x1+32 | 2 | -30 | 60 | 42 |  |
| taquillas-bajas | 2x1+16 | 3 | -14 | 59 | 12 |  |
| gabinete-oficina | 2x1+16 | 2 | -14 | 60 | 10 |  |
| taquillas-altas | 2x1+32 | 2 | -30 | 60 | 42 |  |
| gabinete-cocina-pequeno | 1x1+8 | 2 | -6 | 28 | 7 |  |
| comoda-alta | 1x1+24 | 2 | -22 | 28 | 34 |  |
| gabinete-cocina-grande | 2x1+8 | 2 | -6 | 60 | 7 |  |
| mesa-de-bruja | 1x1+16 | 3 | -13 | 26 | 29 |  |
| mesa-palabras | 2x1+8 | 3 | -5 | 58 | 21 |  |
| mesa-lobos | 2x1+8 | 3 | -5 | 58 | 21 |  |
| mesa-patrones | 2x1+8 | 3 | -5 | 58 | 21 |  |
| mesa-mazos | 2x1+8 | 3 | -5 | 58 | 21 |  |

## 2. Sillas alrededor de una mesa

`sillasAlrededor(sala, mesaId, { lados, silla, variante })` en `shared/src/sillas.ts`, el botón «Poner sillas alrededor» del inspector
y `ConstructorSala.sillasAlrededor(opciones, mesaId?)` usan la misma regla.

- Las sillas van en las casillas pegadas a la huella (sin hueco), nunca en las esquinas, mirando a la mesa: arriba miran al sur
  (`S`), abajo al norte (`N`), a la izquierda al este (`E`) y a la derecha al oeste (`O`).
- `lados`: `todos` (una silla por casilla de cada lado: lado par son pares, lado impar son pares y una al centro), `largos` (solo los
  dos lados largos; en una mesa cuadrada, arriba y abajo), `uno` (una por lado: lado impar una al centro, lado par el par central) y
  `ninguno`.
- Mesas redondas con huella par (2x2, 4x4) no tienen casilla central: con `uno` se usa la variante simétrica más cercana, un
  molinete de cuatro sillas (una por lado, corrida media mesa en el sentido del reloj), que queda igual al girarlo 90 grados.
  Con `todos` van pares en cada lado. Por defecto, las redondas usan `uno` y las demás `todos`.
- Se omiten casillas con pared, puerta, otro objeto o sin piso; el resultado trae `omitidas` con el motivo de cada una.
- Quedan hasta ~8 px de aire entre el labio de la mesa y la silla del lado sur (las patas del dibujo); es del arte, no de la rejilla.
- «Sus» sillas se hallan por cercanía (`sillasDeMesa`): asientos pegados a la mesa y mirando hacia ella. No hay grupos guardados. En el inspector:
  «Mover con sus sillas» (las suma a la selección) y «Quitar con sus sillas». Si se quita solo la mesa, la Revisión avisa de las sillas sueltas.
- `esAsientoParaMesa` (lo que se ofrece en el inspector: `silla-*` y `butaca*` de 1x1) y `esSillaDeMesa` (lo que debe estar junto a una mesa; no butacas, sofás ni puffs).

## 3. `ConstructorSala` (plantillas)

```ts
new ConstructorSala('id', 'Nombre', 30, 20)
  .estricto()                                   // activa la regla de apoyo: lo apoyado exige mesa y que quepa (lanza si no)
  .piso(0, 0, 30, 20, 'piso-madera-clara')
  .poner('mesa-conferencia-3x2', 8, 6, 'S')
  .sillasAlrededor({ lados: 'todos', silla: 'silla-reunion' })   // sin mesa, usa la última colocación puesta
  .poner('tabla-quesos', 9, 6)                  // se acomoda solo sobre la tapa
  .construir();
```

- Sin `.estricto()` el constructor se comporta como antes (saltándose la regla de apoyo): así las plantillas heredadas
  (`plantillaNaos`, mapa inicial) siguen construyendo, y la Revisión les avisa de lo que no cuadra (hoy 26 apoyados y 1 silla en Naos).
  Las plantillas nuevas deben llamar `.estricto()` primero.
- Las sillas del constructor usan ids estables `i<n>`.
- Orden: pon la mesa, luego sus sillas y lo apoyado. En el editor, mover una selección pone lo apoyado al final.

## 4. Revisión de realismo

`validarMapa` agrega **avisos** (nunca errores) con código y, cuando se puede, `arreglo` para el botón «Arreglar» del panel Revisión:

| código | cuándo | arreglo |
|---|---|---|
| `apoyado_sin_mueble` | apoyado sin mueble con tapa debajo | `apoyado`: lo lleva a la casilla libre más cercana donde cabe |
| `apoyado_no_cabe` | no cabe en la tapa | `apoyado` |
| `silla_suelta` | silla de mesa sin mesa o escritorio pegado | `silla`: la pega a la mesa más cercana, mirándola |
| `montado_sin_pared` | objeto de pared sin pared detrás | no |
| `sanitario_fuera_de_bano` | sanitario o urinario fuera de una zona cuyo nombre contenga «baño» (el urinario colgado cuenta por la casilla de piso que tiene delante) | no |
| `sanitario_sin_cubiculo` | sanitario dentro de una zona de baño sin pared o divisor a sus dos lados (izquierda y derecha si mira al sur o al norte, arriba y abajo si mira al este u oeste); el urinario no lo necesita | no |
| `casilla_encerrada` | casillas libres que nadie alcanza caminando desde una llegada | no |

Las zonas de baño se reconocen por el nombre (`baño`, `sanitario`, `wc`): el agente de baños debe nombrar así sus zonas.

## 5. Editor: cambio de pestañas (bloque 1)

Causa: `PanelLateral` tenía un efecto que, mientras hubiera una herramienta activa (piso, zona, área, objeto, sala, llegada), devolvía
la pestaña a la de esa herramienta. Al tocar otra pestaña, el efecto la regresaba al instante: «buggeado». Arreglo:

- El efecto solo reacciona cuando cambia la herramienta (no la pestaña).
- Cambiar de pestaña llama `prepararCambioDePestana`: suelta la herramienta de otra pestaña y cierra lo que estaba a medias (`cerrarEnCurso`):
  lo ya pintado se queda y se deshace como un solo paso; un rectángulo o una línea sin soltar se descartan. Antes, `elegirHerramienta` perdía
  el paso del historial de un trazo en curso.
- Esc (`cancelar`): si hay algo a medias, lo deshace y deja la herramienta; un segundo Esc la suelta.
- `soltarPuntero` cierra el gesto si la ventana pierde el foco con el botón apretado.
- Pruebas: las 42 parejas de pestañas (`web/src/editor/cambio-pestanas.test.ts`) y verificación en el navegador con la demo B.

## Avance por bloque (2026-10-11)

- **Bloque 1, hecho.** Causa hallada y arreglada, 42 parejas probadas en pruebas y en el navegador (demo B, sin fallos), Esc y puntero soltado cubiertos.
- **Bloque 2, hecho.** Tapas medidas (56 muebles, más familias y excepciones), reglas de apoyo, dibujo automático en `vista-sala.ts` y en el compositor, fantasma
  pegado a la tapa con motivo, hojas antes/después en la carpeta local de salida. Ningún apoyado pasó a suelo.
  Cambiaron dos pruebas que ponían una planta chica sobre el suelo (ahora usan una planta de suelo).
- **Bloque 3, hecho.** `sillasAlrededor`, botón en el inspector con lados, tipo y color, «mover/quitar con sus sillas», pruebas con todas las mesas y
  orientaciones y hoja `sillas-despues.png`.
- **Bloque 4, hecho.** Seis avisos nuevos, «Arreglar» para apoyados y sillas (en la demo B bajó de 22 a 2 avisos de apoyo sin lugar), pruebas unitarias.
  Pendiente para quien arme las plantillas: las de Naos traen 26 apoyados y 1 silla fuera de regla; el botón «Arreglar» las corrige en el editor.
- El script `npm test` ahora incluye `shared`.

## 6. Plantillas del mapa (2026-10-11, segunda tanda)

Las plantillas viven en `shared/src/plantillas/` y se eligen con `plantillaDeMapa(id)` (`PLANTILLAS_MAPA` trae id, nombre, descripción corta y tamaño para la
tarjeta del panel de Salas). Las tres usan el mismo cascarón (`edificio.ts`: sala de 46x30, anillo exterior, balcón y puerta en (36, 20)), se construyen con
`.estricto()` y validan sin errores ni avisos.

| id | archivo | qué trae |
|---|---|---|
| `vacia` | `mapa-inicial.ts` | solo el cascarón (arranque) |
| `naos` | `plantillas/naos.ts` | la planta de ejemplo rehecha: dos oficinas de dirección (A y B), 8 mini oficinas de Digital, cafetería, Play 5, recibidor, sofás coworking, terraza |
| `abierta` | `plantillas/oficina-abierta.ts` | 6 escritorios de equipo de 3x2 con 6 sillas, 2 salas con vidrio, coworking con sofás y puffs, cocineta, 3 cabinas telefónicas, recibidor, terraza |
| `sede` | `plantillas/sede.ts` | recibidor amplio, salas de 12, 6, 6 y 4 con TV, sala creativa con pizarras, biblioteca, cafetería, terraza |

Ayudas (`plantillas/comun.ts`): `puestoDeTrabajo` (escritorio de 3 casillas con su silla al centro), `mesaConSillas`, `mesaConSillasSinAbajo`, `sobreMesa`, `colgar`.
Baños (`plantillas/banos.ts`): `banoHombres` (3 cubículos, 2 urinarios con divisor, mesón de 2 lavabos) y `banoMujeres` (4 cubículos y mesón de 2 lavabos);
interior de 10x4 casillas con muros y puerta de entrada a cargo de la planta.

Lo que se aprendió armando:

- **Una pared tapa la fila que tiene al norte.** Todo lo que esté en la casilla justo al norte de una pared horizontal (muro, vidrio) queda detrás de ella: sillas y
  personas ahí no se ven. Por eso la última fila de cada espacio cerrado va libre o con muebles altos (de las filas de abajo solo asoma la mitad de arriba).
  En los baños esa fila es el pasillo de los cubículos, y el avatar se asoma al llegar a las puertas.
- **Apoyo en muebles contra la pared.** Con la regla del 15 %, la cubierta de `aparador-moderno`, `meson`, `cajonera`, `archivador-metalico`, `fichero-tarjetas` y la
  recepción es muy delgada: solo cabe algo en la casilla del centro, o nada. Usa `barra`, `comoda`, `comoda-alta` o una mesa para la cocineta y las consolas. La
  mesa lateral y la mesa alta solo admiten una taza de té.
- Los objetos con enlace (`pizarra-pie`, `pizarra-pared`, `mesa-teams`) avisan hasta tener enlace: ponles `props.enlace` (https) o evítalos.
- Pruebas: `shared/tests/plantillas.test.ts` (cada plantilla: sin avisos, mismo anillo, objetos vigentes, asientos alcanzables, ninguna casilla encerrada, puertas con
  espacio, baños completos y el detalle de cada una) y `web/src/editor/miniatura-plantilla.test.ts`. Hoja para mirar: `npx tsx arte/herramientas/ver-plantilla.ts <id> [--diag]
  [--recorte=x,y,w,h,escala]` escribe en la carpeta local de salida.

## Avance de la segunda tanda (2026-10-11)

- **Bloque 1, hecho.** Lote 14 (9 objetos, 132 cuadros, atlas `objetos-v15` publicado): `divisor-cubiculo` y `divisor-urinario` (autotile de 16 máscaras, gris, azul y
  madera), `puerta-cubiculo` (abertura con `interaccion: 'puerta'`; `puertas.ts` ganó un ajuste mínimo: hoja de 22 px del color de la variante),
  `papelera-bano`, `dispensador-papel`, `dispensador-jabon`, `secador-manos`, `espejo-bano` y `lavabo-meson` (el lavamanos sin su espejo, para colgar el espejo
  encima; `lavamanos` sigue igual). Aviso nuevo `sanitario_sin_cubiculo`. Hoja: `arte/salida/objetos-lote14-*.png`.
- **Bloque 2, hecho.** `plantillaNaos` rehecha con los baños nuevos (la pared de los baños se corrió a x = 25: la cafetería quedó de 9 columnas), mesas con
  `sillasAlrededor`, escritorios con silla al centro, objetos personales distintos en cada mini oficina, alfombras, cuadros y relojes. Las llegadas pasaron a y 10..11
  (la fila 12 queda detrás del muro).
- **Bloque 3, hecho.** Plantillas `abierta` y `sede` con tarjeta (nombre, descripción, tamaño y miniatura dibujada desde los datos) en el panel de Salas; la carga
  conserva la confirmación y el deshacer.
- **Bloque 4, hecho.** En la instancia B (copia desechable, respaldo `data-demo-b/interna.sqlite.bak-plantillas-2026-10-11`) se publicó Naos como versión 12 y se
  revisaron baños, cafetería, oficina de dirección y mini oficinas; se cargaron las tres plantillas desde el panel (todas «Todo en orden»). 
