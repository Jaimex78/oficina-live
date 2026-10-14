# Guía de estilo v2 (medida)

Esta guía fija el estilo de los objetos con números medidos en capturas de estudio de la experiencia de Gather (no a ojo): proporciones medidas, sin copiar píxeles. Manda sobre `GUIA-ESTILO-GATHER.md` cuando haya choque. La carpeta `arte/referencia/` es material de estudio de terceros y no se publica. Nada se copia ni se calca; todo se dibuja desde cero con el pipeline.

## Cómo se midió (reproducible)

Herramienta: `arte/herramientas/medir-gather.ts` (Node con `pngjs`, corre con `npx tsx`). Se usa sobre capturas locales de estudio.

```bash
npx tsx arte/herramientas/medir-gather.ts ficha <captura de escritorios>.png
npx tsx arte/herramientas/medir-gather.ts colores <png> x y w h [cuantos] [paso]
npx tsx arte/herramientas/medir-gather.ts filas <png> y x0 x1      # tramos de color a lo largo de una fila
npx tsx arte/herramientas/medir-gather.ts columnas <png> x y0 y1   # ídem en vertical
```

Las capturas JPEG se pasan antes a PNG (`sips -s format png entrada.jpg --out salida.png`).

La escala de cada captura sale de medir un patrón que repite cada 32 px nativos (por ejemplo, el de una alfombra). Con esa escala todo lo de abajo está en píxeles nativos de 32 px por casilla, con error de más o menos 1 px.

## Paleta (hex medidos y a qué rampa nuestra corresponden)

Distancia en OKLab (`dE`): menos de 0,03 se lee igual a simple vista. Casi todo ya estaba cubierto por las rampas del lote 1; lo que faltaba era el gris azulado del escritorio, que ahora es la rampa `pizarra` (6 colores).

| Material | Hex medido | Rampa y tono | dE |
|---|---|---|---|
| Tapa del escritorio | `#FFFFFF` | `neutro-7` | 0,000 |
| Sombra suave de la tapa | `#EAEFF7` | `pizarra-5` `#EEF2F8` | 0,01 |
| Brillo del labio | `#CCD2E4` | `pizarra-4` `#CFD7E5` | 0,014 |
| Labio del escritorio | `#B4C0CC` | `pizarra-3` `#B4C0CC` | 0,000 |
| Arista de luz del frente | `#727E8A` | `pizarra-2` `#7E8A97` | 0,03 |
| Frente del escritorio | `#606C72` a `#666C78` | `pizarra-1` `#636D77` | 0,006 a 0,009 |
| Sombra bajo la tapa, borde inferior | `#484E60` | `pizarra-0` `#414A56` | 0,02 |
| Patas y ranuras (azul marino) | `#3C3C60` | `azul-oficina-1` `#2F3957` | 0,028 |
| Contorno de todo objeto | `#14162A` a `#222433` | `azul-oficina-0` `#141828` | 0,00 |
| Silla (cuerpo, luz, sombra) | `#545A6C`, `#6C7884`, `#42486C` | `tela-gris-1`, `tela-gris-2`, `tela-gris-0` | 0,003 a 0,011 |
| Bisel de monitor y torre | `#3C3C5A` a `#484E66` | `azul-oficina-1` y `azul-oficina-2` | 0,03 |
| Teclas azules del teclado | `#5A96D2` | `vidrio-1` | 0,016 |
| Pantalla de ciudad (cielo y sol) | `#5A42A8`, `#EA78AE`, `#F6D878` | `morado-1`, `rojo-suave-3`, `tela-calida-3` | 0,06 a 0,09 |
| Alfombra gris de equipo | `#AEBAC0` / `#BAC0C6` / `#A8B4BA` | `baldosa-gris-3`, `pizarra-3`, `neutro-5` | 0,01 |
| Alfombra morada (zigzag) | `#8A90CC` / `#909CD8` / `#54547E` | `lavanda-2`, `lavanda-3`, `azul-oficina-2` | 0,006 a 0,035 |
| Piso crema (pasillo de ladrillo) | `#EAE4DE` / `#EAE4D8` | `ladrillo-crema-3` | 0,02 |
| Madera clara (escritorio de madera) | `#E8C48C` borde `#C88850` | `madera-clara-3` / `madera-clara-1` | 0,02 |
| Metal de las patas y brazos | `#8898A8`, `#586070` | `metal-2`, `metal-1` | 0,007 a 0,012 |
| Vidrio y pantallas apagadas | `#68C0D0`, `#B0C0D0` | `vidrio-2`, `baldosa-1` | 0,03 a 0,07 |
| Plantas (hojas, mochila verde) | `#72B488`, `#60A272`, `#5A966C` | `hoja-pastel-2`, `hoja-pastel-1` | 0,015 a 0,06 |
| Maceta y detalles naranja | `#EA7E42` | `naranja-2` | 0,031 |
| Lámpara (bombilla) | `#F6D878`, `#FCE4A8` | `tela-calida-3`, `madera-clara-4` | 0,013 a 0,025 |
| Madera tallada, cuero, muebles | `#986048`, `#A07060`, `#C08868` | `madera-oscura-3`, `cuero-2`, `madera-oscura-4` | 0,013 a 0,03 |

Paleta del pipeline: 120 colores de 128. Se agregó solo `pizarra` (6 tonos). Quedan 8 libres para las categorías de la Fase B (por ejemplo un rosa de 3 a 4 tonos para plantas y sillas). Si hiciera falta más, la reorganización propuesta es fundir `cemento` y `baldosa` (8 colores de pisos casi iguales a `baldosa-gris` y `ladrillo-crema`) y liberar 8 más.

## Contorno

- Siempre 1 px de azul marino muy oscuro, `azul-oficina-0`, alrededor de TODA la silueta. Nunca negro puro y nunca contorno tonal en este molde.
- Excepciones: pisos y alfombras (planos, sin contorno) y piezas internas que se separan por tono (una tecla, un cajón).
- Se aplica con `cerrarSuelo()` (objetos de piso) o `cerrarApoyado()` (objetos sobre el escritorio).

## Tonos por material y luz

- Luz desde arriba a la izquierda en TODOS los cuadros: arista clara arriba y a la izquierda, sombra abajo y a la derecha.
- 2 a 4 tonos por material, sin degradados ni trama dentro del objeto. Los brillos son 1 px.
- Cada superficie: luz, medio y sombra de SU rampa; el tono 0 de la rampa se reserva para el contorno o la sombra profunda.
- Pantallas: siempre encendidas, de frente, con contenido distinto (código, gráficos, terminal, ciudad de neón, documento) en los tonos claros y saturados de la rampa. Un reflejo de 3 px blancos en la esquina superior izquierda.
- Un objeto debe leerse a 1x sin lupa. Lo que no se lee a 1x no se dibuja.

## Sombra

- Medida en las capturas de estudio: la sombra proyectada es una mancha 12 % más oscura que el piso, corrida 2 px a la derecha y 1 a 2 px hacia abajo. Bajo el frente de un escritorio casi no se nota (menos de 1 fila).
- Nuestro pipeline no tiene semitransparencia, así que se reproduce con dos tonos sólidos de `azul-oficina`: `azul-oficina-2` pegado al objeto y `azul-oficina-3` un píxel más lejos (lo de piso), y un reborde de 1 px de `azul-oficina-2` sobre la tapa (lo apoyado). Es la convención de los lotes 4 a 7 y se mantiene para que todo el catálogo se vea parejo.

## Proporciones (casilla de 32 px)

| Pieza | Medida nativa |
|---|---|
| Escritorio de 3 casillas | 92 px de ancho dentro de 96 (margen de 1 px a la izquierda y 3 a la derecha); alto total 42 |
| Tapa | 26 filas (la fila 0 es contorno y la 1 el borde trasero un tono más oscuro) |
| Labio | 3 filas (1 de brillo y 2 de labio) |
| Frente | 9 filas (arista de luz, 7 de frente con patas y cajonera, borde inferior) más contorno y 2 de sombra |
| Pata (ranura) | 2 a 4 px de ancho por 6 a 7 de alto, azul marino |
| Silla de oficina | 24 x 22 (respaldo de 18 de ancho y 14 de alto, brazos de 3 px a cada lado, base con 3 ruedas de 3 x 3) |
| Monitor | 28 x 20 con bisel de 1 px y barbilla de 3; cuello de 2 a 3 filas y pie de 12 x 2 |
| Monitor lateral en ángulo | 17 x 20, el borde del lado lejano baja 3 px (cizalla), no hay perspectiva real |
| Torre | 10 a 12 de ancho por 24 a 26 de alto |
| Teclado | 21 x 9 (cuerpo, 4 hileras de teclas de 2 px con 1 px de separación, espaciadora, canto de adelante) |
| Ratón | 5 x 7 con cable que sube 2 px |
| Control de videojuego | 15 x 9 |
| Alfombra | el patrón repite cada 32 px |

## Alturas y perspectiva

- Cámara desde el sur y un poco desde arriba (3/4). Los frentes de escritorios y las pantallas miran al SUR. Las sillas van al sur del escritorio, vistas de espaldas (orientación `N`: quien se sienta mira al norte), con las ruedas visibles.
- Lo apoyado en el escritorio se dibuja con su borde de abajo en la fila 10 de su casilla (`FILA_PIE`, `pie(sobresale)` en `l8-comun.ts`). La tapa llega hasta la fila 16, así que quedan unas 6 filas de tapa libre delante del teclado (donde apoya los brazos quien trabaja). Esto se midió: en las capturas de estudio el teclado no toca el labio.
- Los monitores y las torres suben unos 13 px por encima del borde de atrás de la tapa. Por eso los equipos de 2 casillas sobresalen 24 px (`sobresale: 24`) y los de 1 casilla 8 a 16.
- Los objetos apoyados llevan solo la orientación `S` (el motor las dibuja siempre de frente: `frameDeColocacion`). Las que ya existían con 4 orientaciones (`monitor`, `portatil`) las conservan para no invalidar mapas guardados.

## Variantes de color

- Escritorios: `base` (tapa blanca, frente pizarra), `madera`, `negro` y `rojo` (frente rojo coral). Cada variante se dibuja con su propio material (`MATERIALES_ESCRITORIO`), no por recoloreo, para cuidar el detalle.
- Sillas, telas y plásticos: se dibujan con la rampa de 4 tonos `tela-gris` y se recolorean (`recolorearVariante`): `rojo`, `negro`, `blanco`.
- Equipos con luces (gamer, torre): cuatro temas de luz propios (`base`, `azul`, `rojo`, `morado`) que cambian las luces RGB y el paisaje de la pantalla.
- El contorno nunca cambia de color entre variantes.
