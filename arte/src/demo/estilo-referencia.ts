/**
 * Estilo de referencia: un set pequeño dibujado SOLO con el núcleo para fijar
 * cómo se ve el arte de Oficina Live. Los constructores de objetos y de
 * personajes deben parecerse a esto: misma luz, mismas proporciones, mismo
 * tipo de contorno.
 *
 * Lo que hay aquí (todo con vista 3/4 y luz arriba a la izquierda):
 *  a) piso de madera clara 32 x 32, sin costuras
 *  b) pared con zócalo (tile 32 x 32 que repite a lo ancho)
 *  c) escritorio de 2 x 1 casillas (64 x 32)
 *  d) silla de oficina 1 x 1
 *  e) planta mediana de 1 x 2 casillas (32 x 64)
 *  f) monitor sobre mesa 1 x 1
 * Además, una escena de prueba que los junta para juzgar la coherencia.
 *
 * Las recetas están explicadas en el README y en los comentarios de cada función.
 */

import { join } from 'node:path';
import { Lienzo, escribirPng, hojaContacto, hojaPaleta, mapaEntreRampas, rampa, rutaSalida, validarLienzo } from '../nucleo';
import type { ColorEntrada, ItemSprite, PatronTrama } from '../nucleo';

/** Cómo se dibuja la única sombra de un objeto. */
export interface EstiloSombra {
  color: ColorEntrada;
  /** Desplazamiento a la derecha y hacia abajo, en píxeles. */
  dx: number;
  dy: number;
  patron?: PatronTrama | 'degradado';
}

/** Sombra estándar de los objetos: gris frío, 2 px a la derecha y 2 hacia abajo, suave al alejarse. */
export const SOMBRA_ESTANDAR: EstiloSombra = { color: 'neutro-2', dx: 2, dy: 2, patron: 'degradado' };

export interface OpcionesDemo {
  /** `false` quita la sombra (por ejemplo, para compararla). */
  sombra?: EstiloSombra | false;
}

function conSombra(l: Lienzo, opciones: OpcionesDemo, extra?: (estilo: EstiloSombra) => Lienzo): Lienzo {
  const estilo = opciones.sombra === undefined ? SOMBRA_ESTANDAR : opciones.sombra;
  if (estilo === false) return l;
  l.sombraProyectada(estilo.color, estilo.dx, estilo.dy, estilo.patron === undefined ? {} : { patron: estilo.patron });
  if (extra !== undefined) l.pegar(extra(estilo), 0, 0, { modo: 'debajo' });
  return l;
}

// ---------------------------------------------------------------------------
// a) Piso de madera clara
// ---------------------------------------------------------------------------

/**
 * Receta de un tile sin costuras: cada fila de tablas atraviesa el tile
 * completo (así empata con el tile vecino) y su única junta vertical cae en
 * un x distinto por fila. Nada se dibuja pegado a los bordes izquierdo y
 * derecho, y el patrón de filas se repite cada 32 px.
 *
 * El piso es el fondo de todo: poco contraste, solo tres tonos de la rampa
 * y cero ruido, para que los objetos (que sí tienen contorno) resalten.
 */
export function pisoMaderaClara(): Lienzo {
  const l = new Lienzo(32, 32);
  const juntas = [12, 28, 5, 21];
  const vetas: Array<Array<[number, number, number]>> = [
    [[2, 3, 6], [17, 5, 5]],
    [[8, 3, 5], [15, 5, 7]],
    [[11, 2, 6], [24, 5, 4]],
    [[3, 4, 5], [16, 2, 6]],
  ];
  for (let fila = 0; fila < 4; fila++) {
    const y = fila * 8;
    l.rect(0, y, 32, 7, 'madera-clara-3'); // cuerpo de la tabla
    l.rect(0, y, 32, 1, 'madera-clara-4'); // brillo del canto superior
    l.rect(0, y + 7, 32, 1, 'madera-clara-2'); // ranura entre tablas
    l.rect(juntas[fila] ?? 0, y, 1, 7, 'madera-clara-1'); // junta de testa
    for (const [x, dy, largo] of vetas[fila] ?? []) l.rect(x, y + dy, largo, 1, 'madera-clara-2');
  }
  return l;
}

// ---------------------------------------------------------------------------
// b) Pared con zócalo
// ---------------------------------------------------------------------------

/**
 * Pared vista de frente con luz arriba: la tapa (cara superior) es el tono más
 * claro, el frente es el tono medio y el zócalo de madera oscura la ancla al
 * piso. Una fila tramada y una sólida oscurecen el frente cerca del zócalo
 * (oclusión). Repite a lo ancho sin costuras porque no hay nada vertical.
 */
export function paredConZocalo(): Lienzo {
  const l = new Lienzo(32, 32);
  l.rect(0, 0, 32, 7, 'pared-calida-3');
  l.rect(0, 0, 32, 1, 'pared-calida-2');
  l.rect(0, 7, 32, 19, 'pared-calida-2');
  l.rect(0, 24, 32, 2, 'pared-calida-1');
  // Zócalo de madera oscura con brillo arriba y sombra abajo.
  l.rect(0, 26, 32, 6, 'madera-oscura-3');
  l.rect(0, 26, 32, 1, 'madera-oscura-4');
  l.rect(0, 30, 32, 1, 'madera-oscura-2');
  l.rect(0, 31, 32, 1, 'madera-oscura-1');
  return l;
}

// ---------------------------------------------------------------------------
// c) Escritorio de 2 x 1
// ---------------------------------------------------------------------------

/**
 * Receta de mueble de lados rectos: `caja` para el tablero (cara superior
 * clara + canto frontal oscuro), patas y cajonera con tres tonos de metal o
 * madera cada una, contorno tonal y, al final, la sombra. La oscuridad bajo
 * el tablero va con la misma trama que la sombra, pegada con modo `debajo`.
 */
export function escritorio(opciones: OpcionesDemo = {}): Lienzo {
  const l = new Lienzo(64, 32);
  l.caja({
    x: 3,
    y: 2,
    ancho: 58,
    fondo: 16,
    alto: 3,
    superior: 'madera-oscura-3',
    frontal: 'madera-oscura-2',
    luz: 'madera-oscura-4',
    filo: 'madera-oscura-3',
    sombra: 'madera-oscura-1',
  });
  l.rect(60, 3, 1, 15, 'madera-oscura-2');
  for (const [x, y, largo] of [[9, 6, 12], [28, 10, 14], [14, 13, 8], [40, 5, 9], [46, 14, 7]] as const) {
    l.rect(x, y, largo, 1, 'madera-oscura-2');
  }
  for (const [x, y, largo] of [[18, 8, 6], [34, 12, 5], [10, 15, 5]] as const) {
    l.rect(x, y, largo, 1, 'madera-oscura-4');
  }
  // Pata izquierda de metal: luz, medio y sombra de izquierda a derecha.
  l.rect(5, 21, 1, 8, 'metal-3');
  l.rect(6, 21, 1, 8, 'metal-2');
  l.rect(7, 21, 1, 8, 'metal-1');
  l.rect(5, 28, 3, 1, 'metal-0');
  // Cajonera a la derecha, con dos cajones y tiradores.
  l.rect(42, 21, 17, 8, 'madera-oscura-2');
  l.rect(42, 21, 17, 1, 'madera-oscura-1');
  l.rect(42, 25, 17, 1, 'madera-oscura-1');
  l.rect(42, 22, 1, 6, 'madera-oscura-3');
  l.rect(42, 28, 17, 1, 'madera-oscura-1');
  for (const y of [23, 27]) {
    l.rect(48, y, 5, 1, 'metal-3');
    l.rect(48, y + 1, 5, 1, 'metal-1');
  }
  l.contornoTonal();
  return conSombra(l, opciones, (estilo) => {
    const capa = new Lienzo(64, 32);
    capa.rect(8, 22, 34, 1, estilo.color);
    capa.trama(8, 23, 34, 2, null, estilo.color, 'bayer50');
    return capa;
  });
}

// ---------------------------------------------------------------------------
// d) Silla de oficina
// ---------------------------------------------------------------------------

/**
 * Silla vista de frente: el respaldo se ve por delante, sobre el asiento. Los
 * cojines son rectángulos redondeados en tres capas (sombra, frente, cara
 * superior) y el brillo va en el borde izquierdo y superior.
 */
export function sillaOficina(opciones: OpcionesDemo = {}): Lienzo {
  const l = new Lienzo(32, 32);
  // Apoyabrazos: poste y almohadilla.
  for (const x of [5, 25]) {
    l.rect(x + 1, 13, 1, 8, 'neutro-2');
    l.rect(x, 11, 3, 3, 'neutro-3');
    l.rect(x, 11, 3, 1, 'neutro-4');
  }
  // Respaldo
  l.rectRedondeado(9, 1, 14, 14, 4, 'tela-gris-2');
  l.rect(11, 2, 9, 1, 'tela-gris-3');
  l.rect(10, 4, 1, 7, 'tela-gris-3');
  l.rect(21, 4, 1, 10, 'tela-gris-1');
  l.rect(11, 13, 10, 1, 'tela-gris-1');
  // Asiento: tres capas para dar grosor al cojín.
  l.rectRedondeado(7, 14, 18, 10, 3, 'tela-gris-1');
  l.rectRedondeado(7, 14, 18, 8, 3, 'tela-gris-2');
  l.rectRedondeado(7, 14, 18, 6, 3, 'tela-gris-3');
  // Columna y base de cinco brazos vista de frente.
  l.rect(15, 24, 2, 3, 'metal-2');
  l.rect(16, 24, 1, 3, 'metal-1');
  l.rect(9, 27, 14, 1, 'metal-1');
  l.rect(9, 27, 5, 1, 'metal-2');
  l.linea(9, 27, 6, 29, 'metal-1');
  l.linea(22, 27, 25, 29, 'metal-1');
  l.rect(15, 28, 2, 1, 'metal-1');
  for (const x of [5, 15, 25]) l.rect(x, 29, 2, 1, 'neutro-2');
  l.contornoTonal();
  return conSombra(l, opciones);
}

// ---------------------------------------------------------------------------
// e) Planta mediana
// ---------------------------------------------------------------------------

/**
 * Planta de 1 x 2: las hojas salen en abanico de un punto del tallo con
 * `hoja()` (base, punta, ancho y tres o cuatro tonos), las de atrás primero.
 * La maceta usa el mismo esquema de tres tonos que todo: luz a la izquierda,
 * medio al centro, sombra a la derecha. El tono 0 de cada rampa queda para
 * el contorno tonal.
 */
export function plantaMediana(opciones: OpcionesDemo = {}): Lienzo {
  const l = new Lienzo(32, 64);
  const tonos = ['planta-1', 'planta-2', 'planta-3', 'planta-4'] as const;
  const hojas: Array<[[number, number], [number, number], number]> = [
    [[16, 44], [16, 3], 9],
    [[15, 44], [4, 8], 9],
    [[17, 44], [28, 8], 9],
    [[14, 45], [3, 22], 9],
    [[18, 45], [28, 22], 9],
    [[13, 46], [4, 36], 8],
    [[19, 46], [27, 36], 8],
  ];
  for (const [base, punta, ancho] of hojas) l.hoja(base, punta, ancho, tonos);

  // Maceta: borde, cuerpo que se angosta hacia abajo y tierra.
  l.rectRedondeado(8, 43, 16, 7, 2, 'maceta-terracota-3');
  for (let y = 50; y < 60; y++) {
    const recorte = Math.floor((y - 50) / 4);
    l.rect(9 + recorte, y, 14 - 2 * recorte, 1, 'maceta-terracota-2');
  }
  l.rect(9, 50, 3, 9, 'maceta-terracota-3');
  l.rect(19, 50, 4, 9, 'maceta-terracota-1');
  l.rect(19, 44, 5, 6, 'maceta-terracota-2');
  l.rect(8, 43, 16, 1, 'maceta-terracota-3');
  l.rectRedondeado(10, 44, 12, 3, 2, 'madera-oscura-1');
  l.rect(11, 44, 5, 1, 'madera-oscura-2');
  l.contornoTonal();
  return conSombra(l, opciones);
}

// ---------------------------------------------------------------------------
// f) Monitor sobre mesa
// ---------------------------------------------------------------------------

/**
 * El monitor es un rectángulo de bisel oscuro con la pantalla en la rampa
 * `vidrio` (el 0 hace de fondo azul). Los renglones de la pantalla son barras
 * de 1 px: nada de texto ni logos reales.
 */
export function monitorSobreMesa(opciones: OpcionesDemo = {}): Lienzo {
  const l = new Lienzo(32, 32);
  l.caja({
    x: 3,
    y: 17,
    ancho: 25,
    fondo: 7,
    alto: 2,
    superior: 'madera-clara-3',
    frontal: 'madera-clara-2',
    luz: 'madera-clara-4',
    sombra: 'madera-clara-1',
  });
  l.rect(4, 21, 2, 7, 'metal-2');
  l.rect(24, 21, 2, 7, 'metal-1');
  // Monitor
  l.rect(5, 2, 22, 14, 'neutro-1');
  l.rect(6, 3, 20, 11, 'vidrio-0');
  l.rect(7, 4, 18, 1, 'vidrio-1');
  l.rect(7, 6, 10, 1, 'vidrio-2');
  l.rect(7, 8, 14, 1, 'vidrio-1');
  l.rect(7, 10, 8, 1, 'vidrio-2');
  l.rect(19, 10, 6, 3, 'rojo-3');
  l.rect(14, 16, 4, 2, 'metal-1');
  l.rect(11, 18, 10, 1, 'metal-2');
  // Teclado
  l.rect(9, 20, 14, 3, 'neutro-5');
  l.rect(9, 22, 14, 1, 'neutro-4');
  l.trama(10, 20, 12, 2, 'neutro-5', 'neutro-6', 'bayer50');
  l.contornoTonal();
  return conSombra(l, opciones);
}

// ---------------------------------------------------------------------------
// Escena de prueba, conjunto y hoja de contacto
// ---------------------------------------------------------------------------

/**
 * Junta los objetos sobre el piso y bajo la pared para juzgar la coherencia
 * de luz, paleta y contraste. Se pega en orden de abajo hacia arriba (por el
 * borde inferior de cada objeto), como lo hará el motor.
 */
export function escenaDePrueba(opciones: OpcionesDemo = {}): Lienzo {
  const columnas = 9;
  const filas = 5;
  const escena = new Lienzo(columnas * 32, filas * 32);
  const piso = pisoMaderaClara();
  const pared = paredConZocalo();
  for (let fila = 1; fila < filas; fila++) {
    for (let col = 0; col < columnas; col++) escena.pegar(piso, col * 32, fila * 32);
  }
  for (let col = 0; col < columnas; col++) escena.pegar(pared, col * 32, 0);

  const objetos: Array<{ lienzo: Lienzo; x: number; y: number }> = [
    { lienzo: plantaMediana(opciones), x: 0, y: 1 * 32 },
    { lienzo: escritorio(opciones), x: 2 * 32, y: 1 * 32 },
    { lienzo: sillaOficina(opciones), x: 3 * 32, y: 2 * 32 },
    { lienzo: monitorSobreMesa(opciones), x: 6 * 32, y: 2 * 32 },
    { lienzo: plantaMediana(opciones), x: 8 * 32, y: 2 * 32 },
  ];
  objetos.sort((a, b) => a.y + a.lienzo.alto - (b.y + b.lienzo.alto));
  for (const o of objetos) escena.pegar(o.lienzo, o.x, o.y);
  return escena;
}

/** Los sprites del estilo de referencia, con su id. Todos son múltiplos de 32 px. */
export function construirEstiloReferencia(opciones: OpcionesDemo = {}): ItemSprite[] {
  const piso = pisoMaderaClara();
  const pared = paredConZocalo();
  return [
    { id: 'piso-madera-clara', lienzo: piso },
    { id: 'pared-zocalo', lienzo: pared },
    { id: 'escritorio-2x1', lienzo: escritorio(opciones) },
    { id: 'silla-oficina', lienzo: sillaOficina(opciones) },
    { id: 'planta-mediana', lienzo: plantaMediana(opciones) },
    { id: 'monitor-sobre-mesa', lienzo: monitorSobreMesa(opciones) },
  ];
}

/**
 * Variantes de color por cambio de paleta, sin redibujar: la silla se pinta una
 * sola vez con `tela-gris` y las demás salen de `recolorear`. Los ids siguen el
 * contrato de `shared` (`objeto~variante`).
 * Con `.slice(0, 4)` se usan los cuatro primeros tonos de `rojo` (sin el brillo
 * rosado), que es lo que mejor se lee en una tela.
 */
export function construirVariantes(opciones: OpcionesDemo = {}): ItemSprite[] {
  const silla = sillaOficina(opciones);
  return [
    { id: 'silla-oficina~rojo', lienzo: silla.recolorear(mapaEntreRampas('tela-gris', rampa('rojo').slice(0, 4))) },
    { id: 'silla-oficina~mostaza', lienzo: silla.recolorear(mapaEntreRampas('tela-gris', 'tela-calida')) },
  ];
}

/** Comprobaciones de verificación visual: el mosaico de piso 3x3, la pared repetida y la escena. */
export function construirVerificaciones(opciones: OpcionesDemo = {}): ItemSprite[] {
  return [
    { id: 'piso-mosaico-3x3', lienzo: pisoMaderaClara().mosaico(3, 3) },
    { id: 'pared-mosaico-3x1', lienzo: paredConZocalo().mosaico(3, 1) },
    { id: 'escena-prueba', lienzo: escenaDePrueba(opciones) },
  ];
}

/**
 * Construye el demo, lo valida y escribe en la carpeta de salida:
 * - `demo-nucleo.png`: hoja de contacto a escala 3,
 * - `paleta.png`: todas las rampas de la paleta.
 * No publica nada en `web/` ni en `shared/`.
 */
export function construirDemoNucleo(directorio: string = rutaSalida()): { items: ItemSprite[]; ruta: string } {
  const items = [...construirEstiloReferencia(), ...construirVariantes(), ...construirVerificaciones()];
  for (const item of items) {
    const errores = validarLienzo(item.lienzo, { multiplo: { ancho: 32, alto: 32 }, noVacio: true });
    if (errores.length > 0) throw new Error(`El demo "${item.id}" no pasa la validación:\n${errores.join('\n')}`);
  }
  const hoja = hojaContacto(items, { escala: 3, columnas: 4 });
  const ruta = join(directorio, 'demo-nucleo.png');
  escribirPng(hoja, ruta);
  escribirPng(hojaPaleta(), join(directorio, 'paleta.png'));
  return { items, ruta };
}
