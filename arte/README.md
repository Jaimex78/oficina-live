# Arte pixel de Oficina Live (`@ol/arte`)

Núcleo del pipeline de arte. Dibuja POR CÓDIGO (sin imágenes externas) los objetos de oficina y los personajes personalizables, valida el resultado contra la paleta y lo empaqueta en atlas listos para el motor.

Este paquete trae el núcleo (`src/nucleo/`) y un estilo de referencia (`src/demo/`). Los objetos (`src/objetos/`) y el personaje (`src/personaje/`) se construyen encima, en otros pasos.

## Filosofía

1. **Código antes que píxeles a mano.** A 32 px cada objeto tiene cuatro veces más píxeles que a 16: dibujar píxel por píxel es lento y trae errores. Se dibuja con un lenguaje de formas (rectángulos, líneas, elipses, tramas, contorno y sombra automáticos). Las cuadrículas de texto quedan para detalles pequeños: pantallas, caras.
2. **Una paleta cerrada.** 120 colores en 25 rampas (10 son de un estilo suave inspirado en Gather y la última, `pizarra`, salió de proporciones medidas, sin copiar píxeles). Lo que no está en la paleta, no pasa la validación.
3. **Una luz y una sombra.** Luz desde arriba a la izquierda, una sola sombra por objeto.
4. **Todo determinista.** Mismos datos, mismos bytes. Los atlas se pueden versionar y comparar.
5. **Se revisa mirando.** Cada constructor genera una hoja de contacto para ver el arte antes de publicarlo.

## Inicio rápido

Desde la raíz del repositorio:

```bash
npm run arte                                         # construye todo y escribe en arte/salida/
npm run construir -w @ol/arte -- --lista             # muestra los constructores registrados
npm run construir -w @ol/arte -- --solo=demo-estilo-referencia
npm run construir -w @ol/arte -- --publicar          # los constructores que publican escriben sus atlas
npm run typecheck -w @ol/arte
npm run test -w @ol/arte
```

Los argumentos (`--lista`, `--solo=`, `--publicar`) se pasan con la forma `npm run construir -w @ol/arte -- ...`. Con `npm run arte -- ...` el segundo `npm run` los intercepta y no llegan.

El demo escribe, en `arte/salida/` (esa carpeta no se versiona):

- `demo-nucleo.png`: hoja de contacto del estilo de referencia a escala 3: los seis sprites, dos variantes de color de la silla, el mosaico de piso 3 x 3, la pared repetida y una escena de prueba que los junta.
- `paleta.png`: las 14 rampas con su número de tono y su código hex.

## Estructura

```
arte/
  src/
    nucleo/            el núcleo (todo lo que usan los constructores)
      tipos.ts           Rgba, Marco, ItemSprite, ColorEntrada...
      color.ts           hex, RGB, luminancia y OKLCH
      paleta.ts          PALETA, RAMPAS, color(), rampa(), rampa5(), oscurecerEnRampa()...
      lienzo.ts          la clase Lienzo (dibujo, contornos, sombras, transformaciones)
      png.ts             codificarPng, escribirPng, decodificarPng, leerPng
      empaquetador.ts    empaquetar(): sprites a un atlas
      marcadores.ts      recoloreo de personajes por marcadores
      validar.ts         validarLienzo, validarAtlas
      salida.ts          rutas y publicarAtlas()
      fuente.ts          fuente bitmap 3 x 5
      hoja-contacto.ts   hojaContacto(), hojaPaleta()
      index.ts           reexporta todo
    demo/
      estilo-referencia.ts   el estilo de referencia (piso, pared, escritorio, silla, planta, monitor)
    construir.ts       registro de constructores y línea de comandos
    objetos/index.ts   (pendiente) lo crea el agente de objetos
    personaje/index.ts (pendiente) lo crea el agente de personajes
  tests/               vitest
  salida/              vistas previas generadas (no se versiona)
```

Todo se importa desde el índice: `import { Lienzo, rampa, empaquetar } from '../nucleo';`.

El núcleo es solo para Node (usa `fs` y `crypto`). El navegador no importa este paquete: lee los PNG y los JSON publicados e implementa por su cuenta el recoloreo por marcadores (ver más abajo).

## Convenciones de arte

| Tema | Regla |
|---|---|
| Casilla | 32 x 32 px. Los objetos miden múltiplos de 32 (`validarLienzo` con `multiplo`). |
| Personaje | 32 x 48 px. |
| Ampliación | El motor muestra todo a 2x sin suavizado. |
| Vista | Desde arriba con leve ángulo (3/4): de los objetos se ve la cara superior (más clara) y la frontal (más oscura). |
| Luz | Arriba a la izquierda. Brillos en los bordes superior e izquierdo, sombras en el inferior y el derecho. |
| Sombra | Una sola por objeto, abajo a la derecha. |
| Píxeles | Alfa 0 o 255. Nada de antialiasing ni semitransparencia. |
| Paleta | Solo la paleta global. 120 colores, rampas de 4 a 6 tonos (la neutra, 8). |
| Contorno | 1 px en el tono anterior de la rampa del propio color (contorno tonal). Negro tinta solo en detalles. |
| Marca | Rojo coral `#EF3B3A` (oscuro `#D42E2D`), negro tinta `#0A0A0A`, grises y blanco. No se inventan logos ni tipografías de marca. |
| Letras en el mundo | Fuente pixel libre, pendiente de elegir. La fuente 3 x 5 de este paquete es solo para rótulos técnicos. |

### La paleta

Cada color pertenece a una sola rampa y se llama `<rampa>-<tono>`, por ejemplo `madera-clara-3`. El tono 0 es el más oscuro. Alias: `tinta` (`neutro-0`), `blanco` (`neutro-7`), `rojo-coral` (`rojo-3`) y `rojo-coral-oscuro` (`rojo-2`). Se ve completa en `arte/salida/paleta.png`.

| Rampa | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---|---|---|---|---|---|---|---|
| `neutro` | `#0A0A0A` | `#25252B` | `#44444C` | `#666670` | `#8C8C96` | `#B2B2BB` | `#D7D7DD` | `#FFFFFF` |
| `pared-calida` | `#7E6A62` | `#B9A38F` | `#E2D3BB` | `#F6EEDD` |  |  |  |  |
| `madera-clara` | `#7B4B3A` | `#B07A4E` | `#D4A26A` | `#E9C28A` | `#F7DDB0` |  |  |  |
| `madera-oscura` | `#2A1820` | `#4B2B2B` | `#73452F` | `#986444` | `#BD8A60` |  |  |  |
| `metal` | `#2E3644` | `#566274` | `#8794A8` | `#C4CDD9` |  |  |  |  |
| `vidrio` | `#2E5E9A` | `#4F96CB` | `#8FD0EC` | `#D6F1FA` |  |  |  |  |
| `tela-gris` | `#34364A` | `#565A72` | `#7E839A` | `#A9AEC0` |  |  |  |  |
| `tela-calida` | `#8A561F` | `#C28A28` | `#E6B445` | `#F8DB84` |  |  |  |  |
| `planta` | `#123C34` | `#1C6542` | `#34934A` | `#67BD58` | `#A5E07B` |  |  |  |
| `maceta-terracota` | `#6E2F2E` | `#A5503A` | `#D27B4E` | `#EDA776` |  |  |  |  |
| `cemento` | `#6F6A6B` | `#96908E` | `#BAB4AD` | `#D8D3CB` |  |  |  |  |
| `baldosa` | `#7E9A9A` | `#A9C3C0` | `#D2E3DD` | `#EEF6F1` |  |  |  |  |
| `cesped` | `#2F6B3A` | `#4C9A3F` | `#7CC24E` | `#B3E26E` |  |  |  |  |
| `rojo` | `#6A1B2B` | `#A62430` | `#D42E2D` | `#EF3B3A` | `#F98C80` |  |  |  |

Piel y cabello NO están aquí: los define el módulo de personajes con marcadores.

La paleta tiene 120 colores y el tope es 128 (la rampa `pizarra` de 6 tonos es del molde Gather v2: ver `GUIA-ESTILO-GATHER-V2.md`). Agregar un color o una rampa es una decisión de arte, no un detalle de código: se cambia `RAMPAS` en `paleta.ts` y se actualizan las pruebas. Si un objeto necesita una excepción puntual, se pasa `paleta` a `validarLienzo` dejando escrito por qué.

Con estos colores se cubre lo que pide el inventario: amarillo de post-its y trofeos (`tela-calida`), azul de pantallas y banderas (`vidrio`), naranja de calabazas (`maceta-terracota`), verdes (`planta`, `cesped`), rojo de marca (`rojo`).

Variantes de color (sillas, sofás, alfombras, paredes) se hacen cambiando de rampa, no redibujando. El demo las muestra en la hoja de contacto (`silla-oficina~rojo` y `silla-oficina~mostaza`, con el formato de id `objeto~variante` del contrato de `shared`):

```ts
import { mapaEntreRampas, rampa } from '../nucleo';

const silla = sillaOficina();                                                            // dibujada con 'tela-gris'
const sillaRoja = silla.recolorear(mapaEntreRampas('tela-gris', rampa('rojo').slice(0, 4)));
const sillaMostaza = silla.recolorear(mapaEntreRampas('tela-gris', 'tela-calida'));
```

`mapaEntreRampas` empareja oscuro con oscuro y claro con claro. Si las rampas tienen distinto largo (4 contra 5), el emparejamiento es proporcional: con `rojo` completo, el tono más claro de la tela caería en el brillo rosado `#F98C80`. Por eso se pasan solo los 4 primeros tonos (`.slice(0, 4)`), que dan un rojo profundo con el rojo de marca como luz.

`rampa5('#C68642')` genera una rampa de 5 tonos desde cualquier color base (para ropa, cabello, piel). Ese color NO está en la paleta global: úsalo solo con marcadores de personajes.

## Recetas que funcionaron

Todas salen de `src/demo/estilo-referencia.ts`, que es el código completo y verificado por las pruebas. Míralo junto con `arte/salida/demo-nucleo.png`.

### Proporciones en vista 3/4

La cara superior (la profundidad vista desde arriba) pesa más que el frente en muebles bajos, y menos en muebles altos:

| Objeto | Cara superior | Canto o frente | Patas o base |
|---|---|---|---|
| Escritorio 64 x 32 | 16 filas | 3 filas de canto | 8 filas de patas y cajonera |
| Mesa pequeña 32 x 32 | 7 filas | 2 filas de canto | 7 filas de patas |
| Mueble alto (locker, nevera), recomendación aún sin ejemplo | 4 a 6 filas | 22 a 26 filas de frente | sin patas |

- Margen para contorno y sombra: deja 1 px libre arriba y a la izquierda (contorno) y 3 px a la derecha y abajo (contorno más sombra de 2 px). Los objetos que llenan la casilla de lado a lado no tienen sombra visible de ese lado.
- El contacto con el piso queda a unos 3 px del borde inferior del sprite.
- Un objeto de 1 x 2 casillas apoya en la casilla de abajo; la de arriba es la parte que sobresale.

### Cómo se sombrea

- Cada superficie usa tres tonos de su rampa: luz, medio, sombra. El tono 0 se reserva para el contorno y el tono más alto para un brillo puntual.
- La cara superior va un tono más clara que la frontal (en el escritorio, `madera-oscura-3` arriba y `madera-oscura-2` al frente).
- El brillo va en los bordes superior e izquierdo (`madera-oscura-4`) y la sombra en el borde inferior y el derecho (`madera-oscura-1`). La receta `caja` hace esto sola:

```ts
l.caja({
  x: 3, y: 2, ancho: 58, fondo: 16, alto: 3,
  superior: 'madera-oscura-3', frontal: 'madera-oscura-2',
  luz: 'madera-oscura-4', filo: 'madera-oscura-3', sombra: 'madera-oscura-1',
});
```

- Las patas y las columnas finas llevan los tres tonos de izquierda a derecha: luz, medio, sombra (`metal-3`, `metal-2`, `metal-1`).
- Volúmenes redondos o blandos (cojines, hojas, puffs): `elipseSombreada` con 3 a 5 tonos, o `rectRedondeado` en tres capas (sombra, frente, cara superior), como la silla.

### Cómo se hace un contorno tonal

`contornoTonal()` pinta, alrededor de la forma, cada píxel vacío con el tono ANTERIOR de la rampa del vecino. Dibuja la forma dejando 1 px de margen y llámalo al final del cuerpo (antes de la sombra):

```ts
new Lienzo(10, 8).rect(2, 2, 6, 4, 'madera-clara-3').contornoTonal();
```

```
..........
..aaaaaa..      a = madera-clara-2 (el contorno, un tono menos que el cuerpo)
.abbbbbba.      b = madera-clara-3 (el cuerpo)
.abbbbbba.
.abbbbbba.
.abbbbbba.
..aaaaaa..
..........
```

- Un borde claro queda claro y uno oscuro queda oscuro: la tapa de una pared se contorna con un tono claro y el zócalo con uno oscuro. Así la forma se integra en vez de verse recortada con tijeras.
- Si un píxel vacío toca dos materiales, toma el contorno más oscuro de los dos.
- `contornoTonal({ pasos: 2 })` baja dos tonos para un contorno más marcado. `{ modo: 'interior' }` oscurece el borde de la propia forma sin agrandar la silueta. `{ diagonales: true }` tapa las esquinas.
- Los marcadores de personajes también funcionan: el borde de un píxel de piel tono 2 sale piel tono 1.
- No uses `contorno('tinta')` salvo en detalles diminutos (pantallas, ojos).

### La sombra

Una sola, abajo a la derecha, aplicada DESPUÉS del contorno. Como no hay semitransparencia, se tramaba para que deje ver el piso:

```ts
l.sombraProyectada('neutro-2', 2, 2, { patron: 'degradado' });
```

- `degradado` deja sólido el primer píxel junto al objeto y trama el resto (`bayer50`), como una sombra que se suaviza al alejarse. Es la sombra estándar: gris frío `neutro-2`, 2 px a la derecha y 2 hacia abajo.
- La oscuridad bajo una mesa se dibuja aparte y se pega con modo `debajo` para que no tape nada:

```ts
const capa = new Lienzo(64, 32);
capa.rect(8, 22, 34, 1, 'neutro-2');
capa.trama(8, 23, 34, 2, null, 'neutro-2', 'bayer50');
l.pegar(capa, 0, 0, { modo: 'debajo' });
```

- Una sombra horneada con color fijo nunca coincide con todos los pisos. Si el motor prefiere una sombra suave con transparencia en tiempo de ejecución, `l.capaSombra(color, dx, dy)` devuelve la sombra como un lienzo aparte (sin tocar el original) para publicarla como otro frame y dibujarla con alfa. Elegir una de las dos vías es una decisión de diseño pendiente.

### Tiles sin costuras (pisos y paredes)

- Cada fila de tablas atraviesa el tile completo y su junta vertical cae en un x distinto por fila (`12, 28, 5, 21`).
- Nada se dibuja pegado a los bordes izquierdo y derecho, y el patrón vertical se repite cada 32 px.
- Las tramas usan coordenadas del lienzo y sus periodos (2 y 4) dividen a 32: encajan solas entre tiles.
- Verifica siempre con `piso.mosaico(3, 3)` y `piso.desplazar(16, 16)` (corre el tile con vuelta al otro lado: si se ve una costura en el medio, el tile no repite). `tests/demo.test.ts` mide las costuras con números.
- El piso es el fondo de todo: poco contraste, tres tonos de la rampa y cero ruido, para que los objetos resalten.
- La pared repite a lo ancho porque no tiene nada vertical: tapa clara arriba, frente medio, zócalo oscuro abajo con brillo arriba y sombra abajo.

### Plantas y hojas

```ts
const tonos = ['planta-1', 'planta-2', 'planta-3', 'planta-4'];
l.hoja([16, 44], [16, 3], 9, tonos);   // base, punta, ancho máximo
l.hoja([15, 44], [4, 8], 9, tonos);    // las de atrás primero
```

Las hojas salen en abanico desde un punto del tallo. Después, la maceta (terracota con luz a la izquierda, medio al centro y sombra a la derecha), `contornoTonal()` y la sombra. Deja los tonos 0 para el contorno.

### Cómo se evita el ruido

- Ningún píxel suelto: todo píxel visible debe tocar a otro (lo comprueba `tests/demo.test.ts`).
- Las tramas son para transiciones y sombras, no para texturas. Las vetas de madera son rayas de 1 px de alto y 4 a 14 de largo, en el tono vecino de la rampa, sin cruzar bordes.
- No mezcles rampas dentro de un mismo material.
- Pocos colores por sprite: los del demo usan 4 a 18, con un máximo recomendado de 20.
- Líneas y curvas con `linea`, `elipse` y `rectRedondeado`: pasos regulares, nada de escalones irregulares. Esquinas con radio 2 (recorta 1 px) o 4 (recorta 3).
- Dibuja formas grandes primero y detalles después. Los contornos y la sombra van al final.
- Mira siempre la hoja de contacto a escala 3 y, para los detalles, un solo sprite a escala 8 o 10:

```ts
escribirPng(hojaContacto([{ id: 'silla', lienzo }], { escala: 10, etiquetas: false }), 'arte/salida/silla-zoom.png');
```

## API del núcleo

### Colores aceptados

Todo método que pinta recibe un `ColorEntrada`: `"#RRGGBB"` (también en minúsculas), un nombre de la paleta (`"madera-clara-3"`), un alias (`"tinta"`), o `null` / `"transparente"` para borrar. Un nombre mal escrito lanza un error con sugerencias: `Color desconocido: "madera-clra-3". ¿Quisiste decir "madera-clara-3", ...?`.

### Paleta (`paleta.ts`)

```ts
PALETA                     // { 'madera-clara-3': '#E9C28A', ... } (120 entradas)
RAMPAS                     // { 'madera-clara': ['#7B4B3A', ...], ... }
color('madera-clara-3')    // '#E9C28A' (también acepta alias y hex)
rampa('madera-clara')      // los 5 hex, del más oscuro al más claro
esColorDePaleta('#E9C28A') // true
oscurecerEnRampa('#E9C28A')    // '#D4A26A', el tono anterior. En el tono 0 devuelve el mismo color.
oscurecerEnRampa('#E9C28A', 2) // '#B07A4E'
rampa5('#C68642')          // 5 hex: [sombra profunda, sombra, base, luz, brillo]
mapaEntreRampas('tela-gris', 'rojo') // { '#34364A': '#6A1B2B', ... } para recolorear
```

`rampa5` pone el color base en el tono 2, corre las sombras hacia el azul violeta y las luces hacia el amarillo, y abre más el lado que tenga espacio (colores muy claros o muy oscuros). Es determinista. Fuera de la paleta, `oscurecerEnRampa` usa `rampa5` para dar una sombra más oscura del mismo color.

### Lienzo (`lienzo.ts`)

Un lienzo RGBA que nace transparente. Cada píxel es alfa 0 o 255. Un píxel vacío vale siempre `(0, 0, 0, 0)`. Dibujar fuera del lienzo no lanza errores: se recorta. Las coordenadas decimales se truncan; `NaN` o infinito lanzan un `TypeError`.

**Regla de oro:** los métodos que DIBUJAN modifican el lienzo y devuelven `this` (se encadenan). Los que TRANSFORMAN devuelven un lienzo NUEVO y no tocan el original.

```ts
const l = new Lienzo(32, 32);
l.rect(4, 4, 24, 20, 'madera-clara-3').linea(4, 24, 27, 24, 'madera-clara-1').contornoTonal();
```

| Método | Qué hace |
|---|---|
| `px(x, y, color)` | Un píxel. |
| `leer(x, y)` | `{ r, g, b, a }`. Vacío o fuera del lienzo da ceros. Además: `leerHex(x, y)` (`#RRGGBB` o `null`), `esOpaco(x, y)`, `dentro(x, y)`. |
| `rect(x, y, w, h, color)` | Rectángulo relleno. |
| `rectBorde(x, y, w, h, color, grosor = 1)` | Solo el borde, hacia adentro. |
| `rectRedondeado(x, y, w, h, radio, color)` | Esquinas redondeadas: radio 2 recorta 1 px, radio 4 recorta 3. |
| `linea(x0, y0, x1, y1, color)` | Bresenham, extremos incluidos. |
| `elipse(cx, cy, rx, ry, color, { relleno = true, angulo = 0 })` | Ancho resultante `2 * rx + 1`. Para anchos pares usa centro y radio con medio píxel (`5.5`, `3.5` da 8). `angulo` en grados, horario. |
| `elipseBorde(cx, cy, rx, ry, color)` | Igual que `elipse(..., { relleno: false })`. |
| `elipseSombreada(cx, cy, rx, ry, tonos, { angulo, luz, relieve, umbrales })` | Elipse con volumen, luz arriba a la izquierda. `tonos` de oscuro a claro (2 a 5). |
| `hoja(base, punta, ancho, tonos, { nervadura })` | Hoja con punta, sombreada. `tonos`: 3 o 4. |
| `rellenar(x, y, color)` | Cubeta de pintura: región conectada en 4 direcciones. |
| `trama(x, y, w, h, colorA, colorB, patron)` | Mezcla dos colores. Patrones abajo. |
| `degradadoV(x, y, w, h, rampa, { dither })` | Degradado vertical por bandas. El primer color queda arriba. `rampa` es una lista o el nombre de una rampa. |
| `caja({ x, y, ancho, fondo, alto, superior, frontal, luz?, filo?, sombra? })` | Caja 3/4: cara superior y frontal con brillo y sombra. |
| `contorno(color, { diagonales })` | Contorno exterior de 1 px de un solo color. |
| `contornoTonal({ diagonales, pasos, modo, oscurecer })` | Contorno selectivo (ver receta). |
| `sombraProyectada(color, dx, dy, { extruir = true, patron })` | La sombra, solo sobre píxeles vacíos. |
| `capaSombra(color, dx, dy, opciones)` | La misma sombra como lienzo nuevo, sin tocar este. |
| `pegar(otro, x, y, { espejoH, modo })` | Modos: `sobre` (por defecto), `reemplazar`, `debajo` (solo donde el destino está vacío), `borrar` (usa el origen de máscara). |
| `recortar(x, y, w, h)` | Lienzo nuevo con una parte. Lo que cae fuera queda vacío. |
| `copiar()`, `voltearH()`, `voltearV()` | Lienzos nuevos. |
| `recolorear(mapa)` | Lienzo nuevo. `mapa` es un objeto, un `Map` o una función `(hex) => color`. |
| `escalar(n)`, `mosaico(nx, ny)`, `desplazar(dx, dy)` | Lienzos nuevos. `desplazar` envuelve por los bordes. |
| `cajaOpaca()` | Marco `{ x, y, w, h }` de lo dibujado, o `null`. |
| `contarOpacos()`, `colores()`, `igual(otro)`, `huella()` | Consulta: cantidad de píxeles, histograma de colores, igualdad y huella de 10 caracteres. |
| `aTexto()` | Vuelca a cuadrícula de texto (lo inverso de `desdeTexto`), útil para depurar. |

`Lienzo.desdeTexto(lineas, leyenda)` crea un lienzo desde una cuadrícula de texto. `.` es transparente. Todas las filas deben medir lo mismo:

```ts
const pantalla = Lienzo.desdeTexto(
  [
    'oooooooo',
    'obbbbbbo',
    'obwwwwbo',
    'obbbrrbo',
    'oooooooo',
  ],
  { o: 'neutro-1', b: 'vidrio-0', w: 'vidrio-2', r: 'rojo-3' },
);
```

También existe `Lienzo.desdeDatos(ancho, alto, datos)` para crear un lienzo desde bytes RGBA.

#### Tramas

`trama` calcula el patrón con las coordenadas del lienzo (no las del rectángulo), así dos rectángulos vecinos encajan y los tiles de 32 px no tienen costuras. `A` es `colorA` y `B` es `colorB`:

```
tablero        bayer25        bayer50        bayer75
ABABABAB       BABABABA       BABABABA       BBBBBBBB
BABABABA       AAAAAAAA       ABABABAB       ABABABAB
ABABABAB       BABABABA       BABABABA       BBBBBBBB
BABABABA       AAAAAAAA       ABABABAB       ABABABAB

lineas-h       lineas-v       diagonal
AAAAAAAA       ABABABAB       BAAABAAA
BBBBBBBB       ABABABAB       AAABAAAB
AAAAAAAA       ABABABAB       AABAAABA
BBBBBBBB       ABABABAB       ABAAABAA
```

El porcentaje de `bayer` es la parte de píxeles que toma `B` (25, 50 o 75). Con `null` en un color esos píxeles quedan vacíos.

### PNG (`png.ts`)

```ts
const bytes = codificarPng(lienzo);        // Buffer, RGBA de 8 bits
escribirPng(lienzo, 'arte/salida/x.png');  // crea las carpetas que falten
const otro = leerPng('arte/salida/x.png'); // un Lienzo
const mismo = decodificarPng(bytes);
```

La salida es determinista y solo escribe los bloques `IHDR`, `IDAT` e `IEND`: sin gamma ni perfiles de color, para que los colores marcador lleguen exactos al navegador.

### Empaquetador (`empaquetador.ts`)

```ts
const { atlas, frames } = empaquetar(
  [{ id: 'silla-oficina', lienzo: silla }, { id: 'escritorio-2x1', lienzo: escritorio }],
  { anchoMax: 1024, relleno: 2 },
);
// frames['escritorio-2x1'] === { x: 2, y: 2, w: 64, h: 32 }
// frames['silla-oficina']  === { x: 68, y: 2, w: 32, h: 32 }
```

Algoritmo de estantes. Ordena por alto (de mayor a menor) y luego por id, así el orden de entrada no importa: los mismos sprites dan el mismo atlas, byte por byte. Deja `relleno` píxeles transparentes entre sprites y en los bordes para evitar el sangrado de textura. `frames[id]` es el rectángulo exacto del sprite, sin el relleno. Lanza error con ids repetidos o vacíos, sprites que no caben o listas vacías.

### Validación (`validar.ts`)

Devuelven listas de errores legibles. Lista vacía significa que todo está bien.

```ts
validarLienzo(lienzo, {
  paleta,                    // colores permitidos (hex). Por defecto, la paleta global.
  permitirMarcadores: true,  // acepta además los 40 colores marcador
  multiplo: { ancho: 32, alto: 32 },
  noVacio: true,
});
// ["Color fuera de la paleta: #123456 (2 píxeles, el primero en x=5, y=2).",
//  "Alfa parcial 128: 1 píxel, el primero en x=0, y=0. Solo se permite alfa 0 o 255.",
//  "Tamaño 30x32: no es múltiplo de 32x32."]

validarAtlas(atlas, frames, { relleno: 2, multiplo: { ancho: 32, alto: 32 } });
// valida cada sprite (con su id en el mensaje), que los marcos estén dentro del atlas,
// que no se solapen, que respeten el relleno y que no haya píxeles visibles fuera de los marcos.
```

### Hoja de contacto (`hoja-contacto.ts`)

```ts
const hoja = hojaContacto(items, {
  escala: 2,        // ampliación entera (por defecto 2)
  columnas: 4,      // sprites por fila (por defecto llena filas hasta anchoMax)
  fondo: '#7A7A84', // gris medio neutro por defecto
  rejilla: 32,      // rejilla de casillas bajo cada sprite; false la apaga
  etiquetas: true,  // id debajo de cada sprite
});
escribirPng(hoja, 'arte/salida/mi-hoja.png');
```

Los sprites van en el orden recibido, alineados arriba a la izquierda de su celda, y debajo de cada uno se escribe su id y sus medidas con la fuente 3 x 5. Los marcadores de personajes se ven con colores de vista previa (solo en la hoja, nunca en el sprite). `hojaPaleta()` dibuja la paleta completa.

### Fuente 3 x 5 (`fuente.ts`)

`dibujarTexto(lienzo, texto, x, y, color, escala = 1)` devuelve el ancho dibujado. Soporta A a Z, 0 a 9 y signos básicos. Las minúsculas salen como mayúsculas, las tildes y la Ñ sin marca, y lo desconocido como `?`. `anchoTexto(texto, escala)` mide sin dibujar.

## Personajes: marcadores de recoloreo

Los personajes se dibujan UNA vez con colores marcador. Cada marcador dice "aquí va el tono T del slot S". Para armar a una persona, cada marcador se cambia por el tono correspondiente de la rampa de 5 tonos elegida. El servidor solo guarda ids del catálogo y el navegador recolorea al armar al personaje.

Los 8 slots son `piel`, `cabello`, `ropaA`, `ropaB`, `pantalon`, `zapatos`, `accA` y `accB`. Cada uno tiene 5 tonos: 0 contorno o sombra profunda, 1 sombra, 2 base, 3 luz, 4 brillo.

**Fórmula exacta** (R fijo, G por slot, B por tono):

```
R = 250
G = 8 x índice del slot        (piel 0, cabello 1, ropaA 2, ropaB 3, pantalon 4, zapatos 5, accA 6, accB 7)
B = 200 + 12 x tono            (200, 212, 224, 236, 248)
```

**Tabla exacta** (la misma que `MARCADORES` en `marcadores.ts` y que el JSON de cada atlas de personajes):

| Slot | Índice (G) | Tono 0 | Tono 1 | Tono 2 | Tono 3 | Tono 4 |
|---|---|---|---|---|---|---|
| `piel` | 0 (0) | `#FA00C8` | `#FA00D4` | `#FA00E0` | `#FA00EC` | `#FA00F8` |
| `cabello` | 1 (8) | `#FA08C8` | `#FA08D4` | `#FA08E0` | `#FA08EC` | `#FA08F8` |
| `ropaA` | 2 (16) | `#FA10C8` | `#FA10D4` | `#FA10E0` | `#FA10EC` | `#FA10F8` |
| `ropaB` | 3 (24) | `#FA18C8` | `#FA18D4` | `#FA18E0` | `#FA18EC` | `#FA18F8` |
| `pantalon` | 4 (32) | `#FA20C8` | `#FA20D4` | `#FA20E0` | `#FA20EC` | `#FA20F8` |
| `zapatos` | 5 (40) | `#FA28C8` | `#FA28D4` | `#FA28E0` | `#FA28EC` | `#FA28F8` |
| `accA` | 6 (48) | `#FA30C8` | `#FA30D4` | `#FA30E0` | `#FA30EC` | `#FA30F8` |
| `accB` | 7 (56) | `#FA38C8` | `#FA38D4` | `#FA38E0` | `#FA38EC` | `#FA38F8` |

En RGB decimal (`R, G, B`):

| Slot | Tono 0 | Tono 1 | Tono 2 | Tono 3 | Tono 4 |
|---|---|---|---|---|---|
| `piel` | 250, 0, 200 | 250, 0, 212 | 250, 0, 224 | 250, 0, 236 | 250, 0, 248 |
| `cabello` | 250, 8, 200 | 250, 8, 212 | 250, 8, 224 | 250, 8, 236 | 250, 8, 248 |
| `ropaA` | 250, 16, 200 | 250, 16, 212 | 250, 16, 224 | 250, 16, 236 | 250, 16, 248 |
| `ropaB` | 250, 24, 200 | 250, 24, 212 | 250, 24, 224 | 250, 24, 236 | 250, 24, 248 |
| `pantalon` | 250, 32, 200 | 250, 32, 212 | 250, 32, 224 | 250, 32, 236 | 250, 32, 248 |
| `zapatos` | 250, 40, 200 | 250, 40, 212 | 250, 40, 224 | 250, 40, 236 | 250, 40, 248 |
| `accA` | 250, 48, 200 | 250, 48, 212 | 250, 48, 224 | 250, 48, 236 | 250, 48, 248 |
| `accB` | 250, 56, 200 | 250, 56, 212 | 250, 56, 224 | 250, 56, 236 | 250, 56, 248 |

Son rosados muy vivos, a más de 100 de distancia (en RGB) de cualquier color de la paleta: no se confunden con nada, y si uno se queda sin recolorear salta a la vista (y `validarLienzo` lo reporta, porque por defecto no los permite). Hay una prueba que comprueba que esta tabla del README coincide con el código.

**Cómo se usan al dibujar:**

```ts
import { Lienzo, MARCADORES, colorMarcador, recolorearConRampas, rampa5 } from '../nucleo';

const cuerpo = new Lienzo(32, 48);
cuerpo.rect(11, 14, 10, 12, MARCADORES.ropaA[2]);            // camiseta: tono base de ropaA
cuerpo.rect(11, 14, 3, 12, colorMarcador('ropaA', 3));        // luz a la izquierda
cuerpo.rect(18, 14, 3, 12, colorMarcador('ropaA', 1));        // sombra a la derecha
cuerpo.px(14, 8, 'tinta').px(17, 8, 'tinta');                // los ojos NO se recolorean: color normal
cuerpo.contornoTonal();                                       // el borde baja un tono dentro del mismo slot

const persona = recolorearConRampas(cuerpo, {
  piel: rampa5('#C68642'),
  cabello: rampa5('#3B2519'),
  ropaA: rampa5('#4F7AC6'),
});
```

- `recolorearConRampas(lienzo, rampasPorSlot)` devuelve un lienzo NUEVO. Cada rampa debe tener exactamente 5 colores. Los slots sin rampa dejan sus marcadores, y los colores que no son marcadores (ojos, contornos fijos) pasan sin cambios.
- `esMarcador(hex)`, `infoMarcador(hex)` (`{ slot, tono }` o `null`) y `contarMarcadores(lienzo)` ayudan a depurar.
- `hojaContacto` muestra los marcadores con colores de vista previa (`PREVISUALIZACION_MARCADORES`), así el personaje se ve con piel, cabello y ropa reconocibles antes de recolorear.

**En el navegador:** la tabla viaja en el JSON de cada atlas que contenga marcadores (clave `marcadores`, ver más abajo). La lógica es esta:

```ts
// Forma 1: con la fórmula (sin tablas).
function recolorear(datos: Uint8ClampedArray, rampas: number[][] /* [índiceSlot][tono] = 0xRRGGBB */): void {
  for (let i = 0; i < datos.length; i += 4) {
    if (datos[i + 3] !== 255 || datos[i] !== 250) continue;
    const g = datos[i + 1], b = datos[i + 2];
    if (g % 8 !== 0 || g > 56 || b < 200 || b > 248 || (b - 200) % 12 !== 0) continue;
    const color = rampas[g / 8]?.[(b - 200) / 12];
    if (color === undefined) continue;                  // slot sin rampa: se deja el marcador
    datos[i] = color >> 16; datos[i + 1] = (color >> 8) & 255; datos[i + 2] = color & 255;
  }
}
```

La misma lógica con la tabla del JSON: arma un `Map` de `0xFAGGBB` a `[slot, tono]` recorriendo `marcadores[slot][tono]` y consulta cada píxel con `datos[i] === 250`. En código del núcleo, `FORMULA_MARCADORES` exporta `{ r: 250, gPorSlot: 8, bBase: 200, bPorTono: 12 }`.

## Cómo se registra un constructor

`src/construir.ts` guarda un registro de constructores. Cada grupo de arte registra uno:

```ts
// arte/src/objetos/index.ts
import { registrarConstructor } from '../construir';
import { empaquetar, validarAtlas } from '../nucleo';
import type { ItemSprite } from '../nucleo';

registrarConstructor('objetos-lote-1', (ctx) => {
  const items: ItemSprite[] = [
    { id: 'silla-oficina', lienzo: dibujarSilla() },
    // ...
  ];
  const { atlas, frames } = empaquetar(items);

  const errores = validarAtlas(atlas, frames, { relleno: 2, multiplo: { ancho: 32, alto: 32 } });
  if (errores.length > 0) throw new Error(errores.join('\n'));

  ctx.guardarHoja('objetos-lote-1.png', items, { escala: 2, columnas: 8 }); // arte/salida/
  ctx.log(`${items.length} objetos validados`);

  // Solo escribe en web/ y shared/ si se corrió con --publicar; si no, lo anota y sigue.
  ctx.publicarAtlas('objetos-v1', atlas, frames, { casilla: 32, lote: 1 });
});
```

- `construir.ts` importa `./objetos/index.ts` y `./personaje/index.ts` solo si existen, así que no hay que tocarlo.
- Los constructores corren en el orden en que se registraron. Un error en uno no frena a los demás: queda anotado y el comando termina con código 1.
- El registro vive en `globalThis`, por lo que es uno solo aunque el módulo se cargue dos veces.
- `ctx` trae `dirSalida`, `publicar`, `log(mensaje)`, `guardarPng(nombre, lienzo)`, `guardarHoja(nombre, items, opciones)` y `publicarAtlas(...)`.
- `ctx.publicarAtlas` recibe los mismos argumentos que `publicarAtlas` del núcleo, pero solo escribe si se corrió con `--publicar`. Si no, lo anota y devuelve `null`. Sin `--publicar`, un constructor no debe escribir fuera de `arte/salida/`.

## Cómo se publica un atlas

```ts
const r = publicarAtlas('objetos-v1', atlas, frames, { casilla: 32 });
// r.rutaPng  -> web/public/assets/arte/objetos-v1.png
// r.rutaJson -> shared/src/catalogo/objetos-v1.json
// r.huella   -> primeros 10 hex del sha1 del PNG
```

El JSON queda así (los frames van ordenados por id y cada uno en una línea):

```json
{
  "version": 1,
  "archivo": "objetos-v1.png",
  "huella": "feea2ada08",
  "ancho": 136,
  "alto": 68,
  "frames": {
    "escritorio-2x1": { "x": 36, "y": 2, "w": 64, "h": 32 },
    "planta-mediana": { "x": 2, "y": 2, "w": 32, "h": 64 },
    "silla-oficina": { "x": 102, "y": 2, "w": 32, "h": 32 }
  },
  "casilla": 32
}
```

Un atlas con marcadores (personajes) agrega la tabla al final del JSON:

```json
{
  "version": 1,
  "archivo": "personaje-v1.png",
  "huella": "98d7301b3f",
  "ancho": 36,
  "alto": 52,
  "frames": {
    "cuerpo/abajo/quieto/0": { "x": 2, "y": 2, "w": 32, "h": 48 }
  },
  "casilla": 32,
  "marcadores": {
    "piel": ["#FA00C8", "#FA00D4", "#FA00E0", "#FA00EC", "#FA00F8"],
    "cabello": ["#FA08C8", "#FA08D4", "#FA08E0", "#FA08EC", "#FA08F8"],
    "ropaA": ["#FA10C8", "#FA10D4", "#FA10E0", "#FA10EC", "#FA10F8"],
    "ropaB": ["#FA18C8", "#FA18D4", "#FA18E0", "#FA18EC", "#FA18F8"],
    "pantalon": ["#FA20C8", "#FA20D4", "#FA20E0", "#FA20EC", "#FA20F8"],
    "zapatos": ["#FA28C8", "#FA28D4", "#FA28E0", "#FA28EC", "#FA28F8"],
    "accA": ["#FA30C8", "#FA30D4", "#FA30E0", "#FA30EC", "#FA30F8"],
    "accB": ["#FA38C8", "#FA38D4", "#FA38E0", "#FA38EC", "#FA38F8"]
  }
}
```

- Los atlas llevan versión en el nombre (`objetos-v1`, `personaje-v1`). El nombre solo admite minúsculas, números, punto, guion y guion bajo.
- Los metadatos son libres, salvo las claves reservadas `version`, `archivo`, `huella`, `ancho`, `alto`, `frames` y `marcadores`.
- Si el atlas contiene colores marcador, el JSON incluye también `marcadores`: la tabla exacta de slot a sus 5 colores hex, con la misma forma que `CatalogoPersonaje.marcadores` de `shared` (ejemplo abajo). Se puede forzar o impedir con `{ incluirMarcadores: true | false }`. La misma tabla sale de `marcadoresJson()`.
- Antes de escribir nada valida el atlas con `validarAtlas`: paleta global más marcadores, alfa binario, marcos dentro del atlas, sin solapes y sin píxeles sueltos fuera de los marcos. Si algo falla lanza un error con la lista y no escribe. Se ajusta con `{ validar: { multiplo: { ancho: 32, alto: 32 }, relleno: 2 } }` y se apaga con `{ validar: false }` (úsalo solo con una razón escrita).
- Es determinista: publicar dos veces los mismos datos escribe los mismos bytes, y si los archivos ya están iguales no los reescribe (`cambiado: false`).
- `{ raiz }` redirige la escritura a otra carpeta. Las pruebas lo usan para no tocar `web/` ni `shared/`.
- El demo NO publica nada: solo escribe en `arte/salida/`.

## Pruebas

`npm run test -w @ol/arte` corre vitest sobre `tests/`: operaciones del lienzo, paleta, PNG (ida y vuelta y bytes deterministas), empaquetador (sin solapes y en cualquier orden de entrada), marcadores, validadores, publicación, hoja de contacto y fuente, registro de constructores, y el demo (cumple `validarLienzo`, sin píxeles sueltos, sin costuras, luz y sombra a la derecha y abajo). Una prueba también revisa que ningún archivo del paquete use rayas largas ni medias.

Al escribir regexes con herramientas que convierten las secuencias de escape Unicode en caracteres reales, arma el patrón con `String.fromCharCode(...)` o usa propiedades Unicode (`\p{Pd}` para rayas), como hace `fuente.ts`.

## Checklist antes de entregar un sprite

1. Medidas en múltiplos de 32 (los cuadros de personaje miden 32 x 48: usa `multiplo: { ancho: 32, alto: 48 }`).
2. Solo colores de la paleta (o marcadores, en personajes): `validarLienzo(l, { multiplo: { ancho: 32, alto: 32 }, noVacio: true })` da `[]`.
3. Luz arriba a la izquierda: brillos arriba y a la izquierda, sombras abajo y a la derecha.
4. Cara superior más clara que la frontal.
5. Contorno tonal, sin negro puro. Margen de 1 px arriba y a la izquierda, y 3 px a la derecha y abajo.
6. Una sola sombra, aplicada al final.
7. Sin píxeles sueltos y con pocos colores.
8. Los tiles repiten sin costuras en el mosaico 3 x 3.
9. Se lee bien en la hoja de contacto a escala 2 y 3.
10. Registrado en un constructor, con hoja de contacto, y sin tocar la paleta.
