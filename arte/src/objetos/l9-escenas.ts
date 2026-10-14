/**
 * Escenas de revisión del lote 9: asientos, mesas, escritorios y almacenaje EN CONTEXTO, a escala 1 y a escala 3.
 *
 * `comparacion` pone una sala con las tres categorías juntas (libreros y taquillas contra el fondo, escritorios con su silla,
 * mesas de reunión con sillas alrededor, sala de descanso con sofás y módulos) a escala 1, y debajo tres recortes a escala 3.
 */

import { ConstructorSala, type SalaMapa } from '@ol/shared';
import { Lienzo } from '../nucleo';
import { resolverCombinado, resolverDesdePublicados, type ResolverCuadro } from './compositor';
import { componerConPersonas } from './l8-personas';
import type { Cuadros } from './l8-comun';

/** Piezas que no cupieron en la última sala armada (solo para depurar la escena). */
export const OMITIDAS: string[] = [];

export function salaDelLote9(): SalaMapa {
  const b = new ConstructorSala('lote9', 'Revisión del lote 9', 24, 17);
  // En una escena de revisión una pieza que no cabe se omite (y se anota) en lugar de tumbar la escena.
  const poner = b.poner.bind(b);
  b.poner = (...a: Parameters<typeof poner>) => {
    try {
      return poner(...a);
    } catch (e) {
      OMITIDAS.push(String(e instanceof Error ? e.message : e));
      return b;
    }
  };
  b.piso(0, 0, 24, 17, 'piso-alfombra-gris');
  // Almacenaje contra el fondo.
  const fondo: ReadonlyArray<readonly [string, number, string?]> = [
    ['librero-alto', 0], ['librero-chippendale', 2], ['gabinete-curiosidades', 4], ['estante-conservas', 6], ['taquillas-altas', 8],
    ['archivador-metalico', 10], ['estante-cocina', 11], ['librero-mediano', 13, 'madera'], ['estante-cubiculo', 15], ['andamio', 17],
    ['estante-madera-recuperada', 19], ['baul-vapor', 21],
  ];
  for (const [id, x, v] of fondo) b.poner(id, x, 1, 'S', v ?? 'base');
  b.poner('aparador-moderno', 0, 3, 'S').poner('mueble-planos', 3, 3, 'S').poner('gabinete-oficina', 5, 3, 'S').poner('taquillas-bajas', 7, 3, 'S');
  b.poner('gabinete-cocina-grande', 9, 3, 'S').poner('gabinete-cocina-pequeno', 11, 3, 'S').poner('fichero-tarjetas', 12, 3, 'S').poner('comoda-alta', 13, 3, 'S').poner('carrito-herramientas', 14, 3, 'S');
  // Escritorios con su silla al sur.
  const escritorios = ['escritorio-simple', 'escritorio-chippendale', 'escritorio-zen', 'escritorio-ovalado', 'escritorio-industrial', 'escritorio-ejecutivo-antiguo', 'escritorio-oficina', 'escritorio-bauhaus'];
  const sillasEscr = ['silla-oficina', 'silla-malla-ergonomica', 'silla-giratoria-madera', 'silla-oficina-delgada', 'silla-giratoria-industrial', 'silla-salon-antigua', 'silla-chippendale', 'silla-z'];
  escritorios.slice(0, 4).forEach((id, i) => {
    b.poner(id, i * 3 + (i > 0 ? i : 0), 5, 'S');
    b.poner(sillasEscr[i] as string, i * 3 + (i > 0 ? i : 0) + 1, 6, 'N');
  });
  escritorios.slice(4).forEach((id, i) => {
    b.poner(id, i * 4, 8, 'S');
    b.poner(sillasEscr[i + 4] as string, i * 4 + 1, 9, 'N');
  });
  b.poner('escritorio-ejecutivo-moderno', 16, 5, 'S').poner('silla-barcelona', 17, 6, 'N');
  b.poner('escritorio-patas-nelson', 20, 5, 'S').poner('silla-ratan', 21, 6, 'N');
  b.poner('mesa-de-dibujo', 16, 8, 'S').poner('silla-wabi-sabi', 17, 9, 'N');
  b.poner('escritorio-transportador', 20, 8, 'S').poner('silla-simple', 21, 9, 'N');
  // Mesas de reunión con sillas alrededor.
  b.poner('mesa-conferencia-3x2', 0, 11, 'S');
  for (const x of [0, 1, 2]) b.poner('silla-plastica', x, 10, 'S').poner('silla-cafe', x, 13, 'N');
  b.poner('mesa-octagonal-3x3', 4, 10, 'S');
  b.poner('silla-comedor-industrial', 3, 11, 'E').poner('silla-roble-curvo', 7, 11, 'O').poner('silla-camping', 6, 9, 'S').poner('silla-jardin-plegable', 5, 13, 'N');
  b.poner('mesa-redonda-grande', 8, 10, 'U');
  b.poner('silla-director', 10, 9, 'S').poner('silla-adirondack', 11, 13, 'N').poner('silla-espacial', 7, 12, 'E').poner('silla-modernista', 11, 12, 'O');
  b.poner('mesa-industrial-3x1', 16, 10, 'S').poner('mesa-tronco-3x2', 12, 10, 'S').poner('mesa-chippendale-3x1', 12, 13, 'S').poner('mesa-pesada-3x1', 12, 15, 'S').poner('mesa-simple-3x1', 16, 11, 'S');
  // Descanso.
  b.poner('sofa-antiguo', 16, 13, 'S').poner('mesa-centro-redonda', 17, 15, 'U');
  b.poner('sofa-cuero-moderno', 20, 11, 'S').poner('sofa-art-deco', 20, 13, 'S').poner('chaise-antigua', 22, 14, 'S');
  b.poner('modular-segmento', 20, 15, 'S').poner('modular-esquina', 21, 15, 'S');
  b.poner('butaca-nube', 19, 15, 'N').poner('puf-saco', 15, 15, 'U').poner('mesa-lateral-moderna', 14, 16, 'U').poner('soporte-plantas', 23, 11, 'U');
  b.poner('silla-columpio', 23, 9, 'S');
  return b.construir();
}

export interface EscenaDelLote {
  nombre: string;
  imagen: Lienzo;
}

function resolverDeSalas(cuadros: Cuadros): ResolverCuadro {
  return resolverCombinado((id) => cuadros.get(id), resolverDesdePublicados());
}

/** La sala a escala 1 y, debajo, tres recortes (almacenaje, puestos y reunión, descanso) a escala 3. */
export function escenasDelLote9(cuadros: Cuadros): EscenaDelLote[] {
  const sala = salaDelLote9();
  const margen = 40;
  const completa = componerConPersonas(sala, resolverDeSalas(cuadros), [], null, margen);
  // Tres recortes a escala 3: almacenaje, puestos y mesas de reunión, descanso.
  const recortes = [
    completa.recortar(0, 0, 8 * 32, margen + 3 * 32),
    completa.recortar(0, margen + 5 * 32 - 8, 8 * 32, 5 * 32),
    completa.recortar(16 * 32, margen + 10 * 32 - 4, 8 * 32, 6 * 32),
  ];
  const ancho3 = recortes.reduce((n, r) => n + r.ancho * 3 + 8, 8);
  const alto3 = Math.max(...recortes.map((r) => r.alto * 3)) + 8;
  const hoja = new Lienzo(Math.max(completa.ancho + 8, ancho3), completa.alto + 12 + alto3);
  hoja.rect(0, 0, hoja.ancho, hoja.alto, '#2B2B31');
  hoja.pegar(completa, 4, 4);
  let x = 4;
  for (const r of recortes) {
    hoja.pegar(r.escalar(3), x, completa.alto + 12);
    x += r.ancho * 3 + 8;
  }
  return [
    { nombre: 'sala', imagen: completa.escalar(2) },
    { nombre: 'comparacion', imagen: hoja },
  ];
}
