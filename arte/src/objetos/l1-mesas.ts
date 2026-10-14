/**
 * Mesas del lote 1: mesa de reunión de 4 y de 6, mesa redonda y mesa de centro.
 *
 * Estilo Gather. Las mesas de reunión rectangulares son como los escritorios: tapa blanca, labio claro y panel
 * azul grisáceo entre patas oscuras (misma estructura vertical, ver `l1-puestos.ts`), con una caja de conexiones
 * azul marino en el centro. La mesa redonda y la mesa de centro siguen las de las referencias de Gather: tapa de
 * madera clara arenosa (`crema`) con canto más oscuro y patas cortas.
 *
 * Variantes: `base` (Gather), `madera` (madera clara), `blanco` y `negro`. Cada una se dibuja con su propio
 * conjunto de colores, no por recoloreo.
 */

import { Lienzo } from '../nucleo';
import { cerrar, registrarObjeto, type Cuadros } from './l1-comun';
import { MATERIALES, panelConPatas, tapaConLabio, type MaterialMueble, type VarianteMueble } from './l1-puestos';

const AZ = (n: 0 | 1 | 2 | 3 | 4) => `azul-oficina-${n}` as const;
const VARIANTES: VarianteMueble[] = ['base', 'madera', 'blanco', 'negro'];

/** Colores de una mesa de tapa redonda: la tapa, su brillo, el canto y las patas. */
interface MaterialRedondo {
  tapa: string;
  luz: string;
  sombra: string;
  canto: string;
  pata: string;
  veta: string;
}

const REDONDOS: Record<VarianteMueble, MaterialRedondo> = {
  base: { tapa: 'crema-3', luz: 'crema-4', sombra: 'crema-2', canto: 'crema-1', pata: 'crema-0', veta: 'crema-2' },
  madera: { tapa: 'madera-clara-3', luz: 'madera-clara-4', sombra: 'madera-clara-2', canto: 'madera-clara-1', pata: 'madera-clara-0', veta: 'madera-clara-2' },
  blanco: { tapa: 'neutro-7', luz: 'neutro-7', sombra: 'neutro-6', canto: 'neutro-5', pata: 'azul-oficina-3', veta: 'neutro-6' },
  negro: { tapa: 'neutro-2', luz: 'neutro-3', sombra: 'neutro-1', canto: 'neutro-0', pata: 'neutro-0', veta: 'neutro-1' },
};

/** Registra una mesa dibujando cada variante con sus colores. */
function registrar<M>(salida: Cuadros, id: string, materiales: Record<VarianteMueble, M>, dibujar: (m: M, clave: string) => Lienzo): void {
  registrarObjeto(salida, id, (clave) => dibujar(materiales.base, clave), {
    variante: (_base, variante, clave) => (VARIANTES.includes(variante as VarianteMueble) ? dibujar(materiales[variante as VarianteMueble], clave) : undefined),
  });
}

/** Caja de conexiones en el centro de la tapa: una placa azul marino con dos tomas. */
function cajaDeConexiones(l: Lienzo, cx: number, cy: number): void {
  l.rect(cx - 4, cy - 2, 8, 5, AZ(2));
  l.rect(cx - 4, cy - 2, 8, 1, AZ(3));
  l.rect(cx - 4, cy - 2, 1, 5, AZ(3));
  l.rect(cx + 3, cy - 1, 1, 4, AZ(1));
  l.rect(cx - 4, cy + 2, 8, 1, AZ(1));
  l.rect(cx - 2, cy, 2, 1, AZ(0));
  l.rect(cx + 1, cy, 2, 1, AZ(0));
}

/** Mesa de reunión rectangular. `ancho` y `alto` son los del cuadro (ya girado en E). */
function mesaReunion(m: MaterialMueble, ancho: number, alto: number, semilla: number): Lienzo {
  const l = new Lienzo(ancho, alto);
  tapaConLabio(l, 3, 6, ancho - 6, alto - 18, m, semilla);
  cajaDeConexiones(l, Math.floor(ancho / 2), 6 + Math.floor((alto - 18) / 2));
  panelConPatas(l, 3, ancho - 6, alto - 10, m, ancho > 64 ? [Math.floor(ancho / 2) - 2] : []);
  return cerrar(l);
}

/** Mesa redonda de 2 x 2: tapa elíptica con borde claro, canto grueso y tres patas cortas. */
function mesaRedonda(m: MaterialRedondo): Lienzo {
  const l = new Lienzo(64, 64);
  // Patas cortas y el canto, que da el espesor de la tapa.
  for (const x of [14, 30, 47]) {
    l.rect(x, 50, 4, 9, m.pata);
    l.rect(x, 50, 1, 9, m.canto);
  }
  l.elipse(31.5, 33, 28.5, 21, m.canto);
  l.elipse(31.5, 29, 28.5, 22, m.sombra);
  l.elipse(31.5, 28, 28.5, 22, m.luz);
  l.elipse(32, 28.5, 27.5, 21.5, m.tapa);
  // Algunas vetas suaves que siguen el eje largo.
  for (const [x, y, largo] of [[14, 20, 12], [30, 16, 14], [22, 26, 10], [38, 24, 12], [16, 34, 14], [34, 36, 10], [26, 42, 12]] as const) l.rect(x, y, largo, 1, m.veta);
  return cerrar(l);
}

/** Mesa de centro ovalada: baja, de tapa corta. De frente es de 2 x 1 y de lado de 1 x 2. */
function mesaCentro(m: MaterialRedondo, orientacion: 'S' | 'E'): Lienzo {
  const horizontal = orientacion === 'S';
  const l = new Lienzo(horizontal ? 64 : 32, horizontal ? 32 : 64);
  const cx = horizontal ? 31.5 : 15.5;
  const cy = horizontal ? 15 : 28;
  const rx = horizontal ? 26.5 : 12.5;
  const ry = horizontal ? 9 : 22;
  for (const [dx, dy] of horizontal ? ([[-18, 9], [14, 9]] as const) : ([[-9, 20], [6, 20]] as const)) {
    l.rect(Math.round(cx + dx), Math.round(cy + dy), 4, 6, m.pata);
    l.rect(Math.round(cx + dx), Math.round(cy + dy), 1, 6, m.canto);
  }
  l.elipse(cx, cy + 3, rx, ry, m.canto);
  l.elipse(cx, cy + 1, rx, ry, m.sombra);
  l.elipse(cx, cy, rx, ry, m.luz);
  l.elipse(cx + 0.5, cy + 0.5, rx - 1, ry - 1, m.tapa);
  return cerrar(l);
}

export function dibujarMesas(salida: Cuadros): void {
  registrar(salida, 'mesa-reunion-4', MATERIALES, (m) => mesaReunion(m, 64, 64, 61));
  registrar(salida, 'mesa-reunion-6', MATERIALES, (m, clave) => (clave === 'S' ? mesaReunion(m, 96, 64, 63) : mesaReunion(m, 64, 96, 64)));
  registrar(salida, 'mesa-redonda', REDONDOS, (m) => mesaRedonda(m));
  registrar(salida, 'mesa-centro', REDONDOS, (m, clave) => mesaCentro(m, clave === 'S' ? 'S' : 'E'));
}
