/**
 * Salas de prueba del lote 8: cada objeto EN CONTEXTO y comparado con una referencia local de estudio.
 *
 * Salas:
 *  - `puestos`: dos filas de escritorios de 3 casillas con equipos, sillas y personas sentadas, sobre alfombra lavanda y gris
 *    (una disposición de dos filas de tres escritorios).
 *  - `comparacion`: el recorte de una captura de estudio (a su tamaño nativo, con el factor medido) junto a nuestro puesto,
 *    a escala 3. Es la prueba de que estilo, color, tamaño y nivel de detalle se leen iguales.
 *  - `escritorios`: los dos tamaños y las cuatro orientaciones del escritorio.
 * Las escenas usan los cuadros en memoria del lote y lo publicado por los demás lotes (pisos, paredes).
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { ConstructorSala, type SalaMapa } from '@ol/shared';
import { Lienzo, leerPng, rutaRaiz } from '../nucleo';
import { resolverCombinado, resolverDesdePublicados, type ResolverCuadro } from './compositor';
import { avataresDeRevision, cargarPersonajes, componerConPersonas, type PersonaEnSala } from './l8-personas';
import type { Cuadros } from './l8-comun';

/** Cuánto más grande se ve la captura de Gather que su arte nativo: un escritorio de 96 px mide 123 en la captura. */
export const FACTOR_REFERENCIA = 1.28;

function resolverDeSalas(cuadros: Cuadros): ResolverCuadro {
  return resolverCombinado((id) => cuadros.get(id), resolverDesdePublicados());
}

/** Dos filas de tres escritorios (como el «Product team» de Gather) con lo que haya dibujado, sillas al sur. */
export function salaPuestos(): SalaMapa {
  const b = new ConstructorSala('puestos', 'Puestos de prueba', 12, 9);
  b.piso(0, 0, 12, 9, 'piso-alfombra-lavanda');
  b.piso(0, 5, 12, 4, 'piso-alfombra-gris');
  const fila = (y: number, objetos: ReadonlyArray<readonly [string, number, string?]>): void => {
    for (const [i, [id, celda, variante]] of objetos.entries()) {
      void i;
      b.poner(id, celda, y, 'S', variante ?? 'base');
    }
  };
  for (const x of [0, 3, 6, 9]) {
    if (x + 3 > 12) continue;
    b.poner('escritorio-3x1', x, 1, 'S');
    b.poner('silla-oficina', x + 1, 2, 'N');
  }
  fila(1, [['pc-desarrollador', 0], ['pc-doble', 3], ['pc-gamer', 6]]);
  b.poner('taza-regular', 2, 1, 'U').poner('lampara-escritorio', 5, 1, 'U').poner('planta-chica', 8, 1, 'U');
  b.poner('monitor', 9, 1, 'S').poner('cuaderno-abierto', 10, 1, 'U').poner('taza-alta', 11, 1, 'U', 'rojo');
  for (const x of [0, 3, 6]) {
    b.poner('escritorio-3x1', x, 6, 'S', x === 3 ? 'madera' : 'base');
    b.poner('silla-oficina', x + 1, 7, 'N', x === 6 ? 'blanco' : 'base');
  }
  b.poner('portatil', 3, 6, 'S').poner('lampara-pantalla', 5, 6, 'U').poner('pc-gamer', 6, 6, 'S', 'azul').poner('telefono-escritorio', 8, 6, 'S');
  b.poner('laptop-dock', 0, 6, 'S').poner('control-videojuegos', 1, 6, 'S', 'base').poner('vaso-para-llevar', 2, 6, 'U');
  b.poner('torre-pc', 10, 6, 'S').poner('mochila', 9, 7, 'U', 'verde');
  return b.construir();
}

/** Los escritorios en sus dos tamaños y cuatro orientaciones. */
export function salaEscritorios(): SalaMapa {
  const b = new ConstructorSala('escritorios', 'Escritorios de prueba', 16, 10);
  b.piso(0, 0, 16, 10, 'piso-alfombra-lavanda');
  b.poner('escritorio-3x1', 1, 1, 'S').poner('escritorio-3x1', 5, 1, 'N', 'madera').poner('escritorio-3x1', 9, 1, 'S', 'negro').poner('escritorio-3x1', 13, 3, 'E', 'rojo');
  b.poner('escritorio-3x2', 1, 5, 'S').poner('escritorio-3x2', 5, 5, 'S', 'madera').poner('escritorio-3x2', 9, 5, 'E');
  b.poner('silla-oficina', 2, 2, 'N').poner('silla-oficina', 6, 0, 'S').poner('silla-oficina', 10, 2, 'N', 'negro');
  b.poner('silla-oficina', 12, 4, 'O').poner('silla-oficina', 14, 4, 'E');
  return b.construir();
}

export interface EscenaDelLote {
  nombre: string;
  imagen: Lienzo;
}

/** Recorte de la captura de Gather a su tamaño nativo (promedio de bloques), solo para comparar. Devuelve `null` si no está. */
export function referenciaNativa(x: number, y: number, w: number, h: number, factor = FACTOR_REFERENCIA): Lienzo | null {
  const ruta = join(rutaRaiz(), 'arte', 'referencia', 'gather', 'usuario-escritorios-product-team.png');
  if (!existsSync(ruta)) return null;
  const png = leerPng(ruta);
  const salida = new Lienzo(Math.floor(w / factor), Math.floor(h / factor));
  for (let j = 0; j < salida.alto; j++) {
    for (let i = 0; i < salida.ancho; i++) {
      let r = 0;
      let g = 0;
      let bb = 0;
      let n = 0;
      for (let v = Math.floor((y + j * factor)); v < Math.ceil(y + (j + 1) * factor); v++) {
        for (let u = Math.floor(x + i * factor); u < Math.ceil(x + (i + 1) * factor); u++) {
          const c = png.leer(u, v);
          r += c.r;
          g += c.g;
          bb += c.b;
          n++;
        }
      }
      const h2 = (v: number): string => Math.round(v / n).toString(16).padStart(2, '0');
      salida.px(i, j, `#${h2(r)}${h2(g)}${h2(bb)}`);
    }
  }
  return salida;
}

/** Compone las salas con los cuadros del lote y lo publicado por los demás. */
export function escenasDelLote8(cuadros: Cuadros): EscenaDelLote[] {
  const resolver = resolverDeSalas(cuadros);
  const gente = cargarPersonajes();
  const avatares = avataresDeRevision(gente);
  const sala = salaPuestos();
  const sentadas: PersonaEnSala[] = sala.colocaciones
    .filter((c) => c.objeto === 'silla-oficina' && c.orientacion === 'N')
    .map((c, i): PersonaEnSala => ({ x: c.x, y: c.y, dir: 'N', sentada: true, spec: avatares[i % Math.max(1, avatares.length)] as PersonaEnSala['spec'] }))
    .filter((p) => p.spec !== undefined && p.x % 3 === 1 && p.y === 2);
  const puestos = componerConPersonas(sala, resolver, sentadas, gente, 16);
  const salida: EscenaDelLote[] = [
    { nombre: 'puestos', imagen: puestos.escalar(2) },
    { nombre: 'escritorios', imagen: componerConPersonas(salaEscritorios(), resolver, [], null, 16).escalar(2) },
  ];

  const ref = referenciaNativa(240, 70, 330, 140);
  if (ref !== null) {
    const nuestro = puestos.recortar(0, 16 + 8, 12 * 32, 4 * 32);
    const ancho = ref.ancho * 3 + 12 + nuestro.ancho * 3;
    const alto = Math.max(ref.alto, nuestro.alto) * 3 + 8;
    const hoja = new Lienzo(ancho, alto);
    hoja.rect(0, 0, ancho, alto, '#2B2B31');
    hoja.pegar(ref.escalar(3), 4, 4);
    hoja.pegar(nuestro.escalar(3), ref.ancho * 3 + 12, 4);
    salida.push({ nombre: 'comparacion', imagen: hoja });
  }
  return salida;
}
