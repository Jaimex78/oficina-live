# Exterior de Oficina Live

La calle, el andén y los edificios vecinos que se ven alrededor de la oficina, como si estuviéramos en el piso 4 del Naos Empresarial (Ak 9 con calle 102, Bogotá). Va detrás de todo lo demás. No se camina afuera; sí se puede estar en el balcón.

Solo para computador, por ahora.

## Cómo se usa

```ts
import { crearExterior, llevaCalle } from './exterior';
const exterior = crearExterior(escena, sala, { luz: 'claro' });
exterior.actualizarLuz('oscuro');
exterior.modoEsquema(true);   // bandas planas, sin animación
exterior.modoEdicion(true);   // atenuado, para no estorbar al construir
exterior.limites;             // rectángulo en píxeles del mundo
exterior.margenCamara;        // px que la cámara puede mirar más allá de la sala
exterior.destruir();
```

`llevaCalle(sala)` dice si una sala lleva calle: solo la sala `piso-4`. Las demás conservan el fondo plano.

## Cómo se integra en `escena.ts`

- `import { crearExterior, llevaCalle, type Exterior } from './exterior'` y el campo `private exterior`.
- `sincronizarExterior(sala)` se llama desde `cargarSala`: crea o destruye el exterior solo si cambia la sala o su tamaño (no en cada edición).
- `alCambiarEstado`: `actualizarLuz` cuando cambia `e.luz` y `modoEdicion` cuando cambia `e.modo`.
- `avisarExterior(activo)` (ya existía) llama a `modoEsquema`.
- `aplicarCamara`: el margen del encuadre es `max(MARGEN_CASILLAS, exterior.margenCamara)`: 24 casillas. El zoom automático y el centrado no cambian.
- `luces.ts`: la penumbra de noche ahora solo cubre las casillas con piso (`zonasConPiso`). Antes cubría todo el rectángulo de la sala y dejaba una franja oscura con borde duro sobre la calle.
- `apagar()` destruye el exterior.

## Geometría (en casillas, con la sala de 46 x 30)

Se rehízo mirando un mapa de calles de la zona: la Avenida Carrera 9 bordea el predio por el sur con dos calzadas, una por sentido y de dos carriles cada una, y un corredor de tren con rieles en el medio. La calle 102 llega por el lado de la esquina y se une a la calzada norte, junto al balcón.

La geometría sale de la sala: el cuerpo del edificio es el rectángulo de casillas con piso que no son `piso-deck`, y el balcón es el de `piso-deck`. El plano es relativo a eso, así que sigue valiendo si la planta cambia por dentro.

| Zona | Dónde |
|---|---|
| Edificio | x 1..36, y 3..26 |
| Balcón sureste | x 36..42, y 19..28 |
| Caída (4 pisos de fachada) | y 27..30 |
| Andén de la fachada | y 31..34, con árboles, obra y paradero |
| Calzada norte (hacia el oeste, 2 carriles) | y 35..37 |
| Corredor del tren (rieles, durmientes y balasto) | y 38..39 |
| Calzada sur (hacia el este, 2 carriles) | y 40..42 |
| Andén de enfrente | y 43..45, con otro paradero |
| Calle 102 (2 carriles, doble línea amarilla) | x 44..46, de arriba hasta la calzada norte |
| Paso peatonal de la avenida | columna 42, cruza las dos calzadas y la vía |
| Cebra de la calle 102 | fila 33 |
| Explanada del edificio | x 37..43 |
| Callejón trasero | y -3..-1 |

El exterior se dibuja 24 casillas más allá de cada lado: de -24 a 70 en x y de -24 a 54 en y.

Decisiones, una línea cada una:

- Los vecinos (norte, oeste, este y sur) son bloques lisos de un solo tono apagado, sin ventanas, parapetos ni equipos, y los lotes son verde grisáceo: el ojo se queda en la avenida, el tren, los carros y la gente. Solo el edificio propio conserva su arte completo y sus ventanas encendidas de noche.
- Cada calzada lleva flechas de sentido; la norte va al oeste y la sur al este (se conduce por la derecha).
- La calle 102 termina en la calzada norte: no cruza la vía. Sus carros bajan, frenan en la cebra y giran a la derecha hacia el oeste; algunos de la calzada norte giran a la derecha hacia la calle 102.
- La calle queda 4 casillas más abajo que el borde de la losa (la caída): desde el piso 4 se ven los pisos 3, 2, 1 y la planta baja.
- La calle 102 empieza 1 casilla después del balcón, para que el voladizo no quede sobre la calzada.
- Sin textos pintados en el mundo: nada que haya que traducir ni mantener.

## Capas y profundidad

Todo va por debajo de `PROF.piso` (-1.000.000). Los objetos se ordenan por su pie: `BASE + y`, con `BASE = -1.900.000`.

1. Fondo de bruma (un rectángulo enorme).
2. Mapa de baldosas: suelo, detalle (parapetos de la azotea baja, losa del balcón), sombras (con transparencia) y luz de ventanas.
3. Sombras de objetos, árboles, carros, gente y mobiliario.
4. Bruma de los cuatro bordes.
5. Multiplicador azul de noche (`MULTIPLY`).
6. Ventanas encendidas y halos aditivos (postes, faros, semáforos, vestíbulo, luces de obra, paradero).
7. Cubierta y bandas del esquema; atenuación del modo construir.

De noche el mismo atlas de día se multiplica por un azul oscuro y se le suman las luces: no hay un atlas de noche. Los tonos de día de andén, asfalto, árboles, vidrio y conos son los de `ingreso/paleta-naos.ts`, para que sea el mismo lugar que la entrada animada.

## Arte

`arte/src/exterior/**` genera el atlas `exterior-v1` (PNG y JSON en `web/public/assets/exterior/`):

```
npm run construir -w @ol/arte -- --solo=exterior-v1 --publicar
```

Hoja de revisión en `arte/salida/exterior-atlas.png`. El JSON trae `tiles.nombres` (los tiles de 32 x 32, en el orden del tileset) y `anclas` (dónde apoya cada sprite en el suelo). La paleta propia (unos 100 colores, tope 128) está en `arte/src/exterior/paleta.ts`.

## Vida

- Carros en las dos calzadas, cada una en su sentido, en 6 colores, con taxi amarillo, motos y un bus rojo articulado por calzada que para en su paradero. Siguen al de adelante, frenan en las líneas de pare y respetan los semáforos.
- Ciclo del cruce (41 s): la Ak 9 pasa 11 s, la calle 102 pasa 7 s y luego los peatones tienen 14 s para cruzar la calle 102 y toda la avenida, con amarillo y un instante en rojo entre fases.
- Tren: locomotora roja con nariz amarilla y 4 vagones crema, a 95 px/s. Pasa cada 100 s de lado a lado (cada paso va al revés del anterior) y entre pasos la vía queda vacía. Mientras pasa suena un pitido visual (tres arcos blancos en dos ráfagas) y las balizas del paso peatonal alternan sus luces rojas.
- Peatones: 10 personas. Unas caminan por los andenes, dos esperan el bus y las demás cruzan por las cebras en el turno de peatones: solo salen en los primeros segundos de ese turno y no cruzan la avenida si hay un tren cerca del paso. Algunas llevan bolso de mano y otras mochila.
- Copas con tres cuadros de viento por árbol.
- Se apaga todo con el esquema completo. La luz y el esquema cambian con suavidad.
- De noche: faros, postes, semáforos con su color, ventanas del edificio, luz de cada unidad del tren y su faro, y balizas con halo.

Cuesta poco: unos 370 objetos de Phaser en total, una sola textura de atlas y el motor corre a 120 fps en escritorio.

## Pruebas

- `arte/tests/exterior.test.ts`: paleta, tope de colores, alfa binario, marcos, anclas, tiles sin costura, determinismo y publicación.
- `web/src/mundo/exterior/plano.test.ts`: geometría desde el mapa inicial, que todo tile y sprite usado exista en el atlas publicado, y que el plano sea determinista.
- `web/src/mundo/exterior/trafico.test.ts`: semáforos, carros que no se montan y frenan en rojo, giro de la calle 102, buses y motos en las dos calzadas, tren (pasa de vez en cuando, 5 unidades, cada paso al revés) y peatones que cruzan solo en su turno y sin tren.

## Falta

- Un tiempo del día intermedio (atardecer) y cielo: hoy solo hay día y noche.
- Rótulos o siluetas de edificios conocidos si hiciera falta reconocer cuadras concretas (hoy son bloques anónimos a propósito).
