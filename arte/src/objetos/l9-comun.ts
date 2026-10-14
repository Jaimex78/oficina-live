/**
 * Ayudas del lote 9 (atlas `objetos-v10`): asientos, mesas, escritorios y almacenaje.
 *
 * Todo mueble se describe UNA vez como cajas en el plano `S` (motor `l2a-cajas.ts`) y de ahí salen las cuatro
 * orientaciones. Aquí vive lo que comparten los cuatro archivos de dibujo:
 *  - `Modelo` y `dibujarModelo`: cajas, proyección que se ajusta sola al cuadro, detalles y acabado Gather v2 (contorno azul
 *    marino de 1 px y sombra de dos tonos, `cerrarSuelo`).
 *  - Los materiales como `TonosCaja`: tapiz (4 tonos recoloreables), madera (5), metal y plástico azul marino.
 *  - El recoloreo de variantes con tablas propias (`registrarR`): solo cambia el material principal del objeto; el contorno
 *    y los demás materiales no cambian.
 *
 * Reglas del plano (píxeles de plano, 32 por casilla): `x` hacia el este, `y` hacia el sur, `z` hacia arriba en filas. Deja
 * 1 px libre a la izquierda y arriba, y 3 a la derecha y abajo (contorno y sombra): las cajas van entre x = 1 y W - 3.
 */

import { objetoPorId } from '@ol/shared';
import { Lienzo, mapaEntreRampas, rampa } from '../nucleo';
import type { ColorEntrada } from '../nucleo';
import { filaDe, girarCajas, dibujarCajas } from './l2a-cajas';
import type { CajaPlano, Giro, Proyeccion, TonosCaja } from './l2a-cajas';
import { cerrarSuelo } from './l8-comun';
import type { Cuadros } from './l8-comun';

export { caraSuperior, caraSur } from './l2a-cajas';
export type { CajaPlano, Giro, Proyeccion, TonosCaja } from './l2a-cajas';
export { cerrarSuelo };
export type { Cuadros };

// ---------------------------------------------------------------------------
// Materiales
// ---------------------------------------------------------------------------

/** Tapiz: cuatro tonos de la rampa, de oscuro a claro, y los nombres para dibujar. */
export interface Tapiz {
  /** Nombres de color para dibujar, del tono 0 (sombra) al 3 (luz). */
  n: readonly [string, string, string, string];
  /** Los mismos tonos en hex, para recolorear. */
  h: readonly string[];
}

/** `desde` es el primer tono de la rampa que se usa (1 para las de 5 tonos, 0 para las de 4). */
export function tapiz(nombre: string, desde = 1): Tapiz {
  const h = rampa(nombre).slice(desde, desde + 4);
  const n = [0, 1, 2, 3].map((i) => `${nombre}-${desde + i}`) as unknown as Tapiz['n'];
  return { n, h };
}

export const TAPICES = {
  cuero: tapiz('cuero'),
  crema: tapiz('crema'),
  gris: tapiz('tela-gris', 0),
  lavanda: tapiz('lavanda'),
  naranja: tapiz('naranja'),
  morado: tapiz('morado'),
  pastel: tapiz('hoja-pastel'),
  rosa: tapiz('rojo-suave'),
  mostaza: tapiz('tela-calida', 0),
} as const;

/** Cojín o tapiz: la cara de arriba un tono más clara que el frente, brillo arriba a la izquierda y sombra al pie. */
export const tonosTapiz = (t: Tapiz): TonosCaja => ({ superior: t.n[2], frente: t.n[1], luz: t.n[3], luzFrente: t.n[2], sombra: t.n[0], sombraLado: t.n[0] });

/** Rampa de 5 tonos (madera, cuero, cemento...): arriba el 3, frente el 2, luz el 4, sombra el 1. */
export const tonos5 = (r: string, desplazar = 0): TonosCaja => ({
  superior: `${r}-${3 + desplazar}`,
  frente: `${r}-${2 + desplazar}`,
  luz: `${r}-${4 + desplazar}`,
  luzFrente: `${r}-${3 + desplazar}`,
  sombra: `${r}-${1 + desplazar}`,
  sombraLado: `${r}-${1 + desplazar}`,
});

export const MADERA_OSCURA = tonos5('madera-oscura');
export const MADERA_CLARA = tonos5('madera-clara');
export const CUERO_OSCURO = tonos5('cuero');
export const CREMA_5 = tonos5('crema');
export const CEMENTO = tonosCemento();
export const PIZARRA: TonosCaja = { superior: 'pizarra-4', frente: 'pizarra-1', luz: 'pizarra-5', luzFrente: 'pizarra-2', filo: 'pizarra-3', sombra: 'pizarra-0', sombraLado: 'pizarra-0' };
export const BLANCO: TonosCaja = { superior: 'neutro-7', frente: 'neutro-5', luz: 'neutro-7', luzFrente: 'neutro-6', sombra: 'neutro-3', sombraLado: 'neutro-4' };
export const MARMOL: TonosCaja = { superior: 'neutro-7', frente: 'neutro-6', luz: 'neutro-7', luzFrente: 'neutro-7', sombra: 'baldosa-gris-3', sombraLado: 'neutro-5' };
/** Metal frío de 4 tonos. */
export const METAL: TonosCaja = { superior: 'metal-3', frente: 'metal-2', luz: 'neutro-6', luzFrente: 'metal-3', sombra: 'metal-1', sombraLado: 'metal-1' };
export const METAL_OSCURO: TonosCaja = { superior: 'metal-2', frente: 'metal-1', luz: 'metal-3', luzFrente: 'metal-2', sombra: 'metal-0', sombraLado: 'metal-0' };
/** Plástico y tubos azul marino. */
export const AZUL: TonosCaja = { superior: 'azul-oficina-3', frente: 'azul-oficina-2', luz: 'azul-oficina-4', luzFrente: 'azul-oficina-3', sombra: 'azul-oficina-1', sombraLado: 'azul-oficina-1' };
export const NEGRO: TonosCaja = { superior: 'neutro-3', frente: 'neutro-2', luz: 'neutro-4', luzFrente: 'neutro-3', sombra: 'neutro-1', sombraLado: 'neutro-1' };
export const ORO: TonosCaja = { superior: 'tela-calida-3', frente: 'tela-calida-2', luz: 'tela-calida-3', luzFrente: 'tela-calida-3', sombra: 'tela-calida-1', sombraLado: 'tela-calida-1' };
export const PLANTA: TonosCaja = { superior: 'planta-3', frente: 'planta-2', luz: 'planta-4', luzFrente: 'planta-3', sombra: 'planta-1', sombraLado: 'planta-1' };
export const VIDRIO: TonosCaja = { superior: 'vidrio-3', frente: 'vidrio-2', luz: 'neutro-7', luzFrente: 'vidrio-3', sombra: 'vidrio-1', sombraLado: 'vidrio-1' };

function tonosCemento(): TonosCaja {
  return { superior: 'cemento-3', frente: 'cemento-2', luz: 'neutro-6', luzFrente: 'cemento-3', sombra: 'cemento-0', sombraLado: 'cemento-1' };
}

// ---------------------------------------------------------------------------
// Cajas
// ---------------------------------------------------------------------------

export const bx = (x0: number, y0: number, x1: number, y1: number, z0: number, z1: number, tonos: TonosCaja, extra: Partial<CajaPlano> = {}): CajaPlano => ({ x0, y0, x1, y1, z0, z1, tonos, ...extra });

/** Cuatro patas cuadradas de `g` px en las esquinas del rectángulo, de `z0` a `z1`. */
export function patas4(x0: number, y0: number, x1: number, y1: number, z0: number, z1: number, tonos: TonosCaja, g = 2): CajaPlano[] {
  return [
    bx(x0, y0, x0 + g, y0 + g, z0, z1, tonos),
    bx(x1 - g, y0, x1, y0 + g, z0, z1, tonos),
    bx(x0, y1 - g, x0 + g, y1, z0, z1, tonos),
    bx(x1 - g, y1 - g, x1, y1, z0, z1, tonos),
  ];
}

// ---------------------------------------------------------------------------
// Modelo y dibujo
// ---------------------------------------------------------------------------

export interface Modelo {
  /** Ancho y fondo del plano en píxeles (32 por casilla). */
  W: number;
  D: number;
  cajas: CajaPlano[];
  /** Detalles pintados encima de las cajas (botones, vetas, libros...). Recibe las cajas ya giradas. */
  detalle?: (l: Lienzo, p: Proyeccion, giro: Giro, cajas: readonly CajaPlano[]) => void;
  /** Escala vertical máxima (filas de pantalla por píxel de fondo). Por defecto 0,7; las mesas usan 1 para llenar el cuadro. */
  kyMax?: number;
  /** Después del contorno: acabados que dependen de la silueta (por ejemplo recortar esquinas). */
  antesDeCerrar?: (l: Lienzo, giro: Giro) => void;
  /** Mancha de contacto bajo la base (objetos altos y delgados). */
  contacto?: (giro: Giro, ancho: number, alto: number) => readonly [number, number, number, number];
}

const pasoKy = 0.01;

/** Dibuja el modelo en la orientación pedida dentro de un cuadro de `ancho x alto` casillas (de frente) y `sobresale` filas extra. */
export function dibujarModelo(m: Modelo, giro: Giro, ancho: number, alto: number, sobresale: number): Lienzo {
  const g = girarCajas(m.cajas, giro, m.W, m.D);
  const gira = giro === 'E' || giro === 'O';
  const tw = gira ? alto : ancho;
  const th = gira ? ancho : alto;
  const W = tw * 32;
  const H = th * 32 + sobresale;
  // Fila del piso donde apoyan las patas más al sur.
  const apoyo = g.cajas.filter((c) => c.z0 === 0);
  const pie = Math.max(...(apoyo.length > 0 ? apoyo : g.cajas).map((c) => c.y1));
  const proy = (ky: number): Proyeccion => ({ base: H - 3 + (g.fondo - pie) * ky, fondo: g.fondo, ky });
  let ky = m.kyMax ?? 0.7;
  while (ky > 0.2 && Math.min(...g.cajas.map((c) => filaDe(proy(ky), c.y0, c.z1))) < 1) ky -= pasoKy;
  const p = proy(ky);
  const l = new Lienzo(W, H);
  dibujarCajas(l, g.cajas, p);
  m.detalle?.(l, p, giro, g.cajas);
  m.antesDeCerrar?.(l, giro);
  const contacto = m.contacto?.(giro, tw, th);
  return cerrarSuelo(l, contacto === undefined ? {} : { contacto });
}

/** Un `Modelo` ya dibujado para las cuatro orientaciones (o solo las que pide el objeto). */
export interface Receta {
  id: string;
  modelo: Modelo;
  /** Rampa del material principal, en hex, para recolorear las variantes (`tapiz.h`, `rampa('madera-oscura')`...). */
  desde?: readonly string[];
}

// ---------------------------------------------------------------------------
// Variantes
// ---------------------------------------------------------------------------

/** Tonos de cada variante. Si la base tiene otro largo, se empareja por posición relativa (ver `mapaEntreRampas`). */
export const DESTINOS: Readonly<Record<string, readonly string[]>> = {
  rojo: rampa('rojo'),
  azul: rampa('vidrio'),
  verde: rampa('planta'),
  amarillo: rampa('tela-calida'),
  negro: rampa('neutro').slice(0, 5),
  blanco: rampa('neutro').slice(3, 8),
  gris: rampa('tela-gris'),
  madera: rampa('madera-clara'),
  naranja: rampa('naranja'),
  morado: rampa('morado'),
};

/** Recolorea un cuadro de la rampa `desde` a la variante. `base` devuelve el mismo cuadro. */
export function recolorear9(l: Lienzo, desde: readonly string[], variante: string): Lienzo {
  if (variante === 'base') return l;
  let destino = DESTINOS[variante];
  if (destino === undefined) throw new RangeError(`No hay colores para la variante "${variante}".`);
  // Si la base ya es de esa rampa (una madera clara que pide «madera»), la variante pasa a la madera oscura.
  if (variante === 'madera' && desde[0]?.toUpperCase() === destino[0]?.toUpperCase()) destino = rampa('madera-oscura');
  const nuevo = l.recolorear(mapaEntreRampas(desde, destino));
  if (nuevo.igual(l)) throw new Error(`La variante "${variante}" sale igual a la base: la rampa de origen ya es de ese color.`);
  return nuevo;
}

/** Registra un cuadro con todas las variantes que promete el inventario, recoloreando la base. */
export function registrarR(c: Cuadros, id: string, clave: string, base: Lienzo, desde?: readonly string[]): void {
  const objeto = objetoPorId(id);
  if (objeto === undefined) throw new Error(`[${id}] no existe en el inventario.`);
  const porVariante = objeto.frames[clave];
  if (porVariante === undefined) throw new Error(`[${id}] el inventario no promete la clave "${clave}".`);
  for (const [variante, idFrame] of Object.entries(porVariante)) {
    if (variante === 'base') c.set(idFrame, base);
    else if (desde !== undefined) c.set(idFrame, recolorear9(base, desde, variante));
    else throw new Error(`[${id}] la variante "${variante}" necesita la rampa de origen.`);
  }
}

/** Dibuja todas las orientaciones de un objeto con su modelo y registra los cuadros. */
export function registrarReceta(c: Cuadros, r: Receta): void {
  const o = objetoPorId(r.id);
  if (o === undefined) throw new Error(`[${r.id}] no existe en el inventario.`);
  for (const clave of o.orientaciones) {
    const giro: Giro = clave === 'U' ? 'S' : (clave as Giro);
    registrarR(c, r.id, clave, dibujarModelo(r.modelo, giro, o.ancho, o.alto, o.sobresale), r.desde);
  }
}

// ---------------------------------------------------------------------------
// Detalles sobre las caras
// ---------------------------------------------------------------------------

/** Rectángulo en pantalla. */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Botón de capitoné: una cruz de 5 px. */
export function cruz(l: Lienzo, x: number, y: number, color: ColorEntrada): void {
  for (const [dx, dy] of [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1]] as const) l.px(x + dx, y + dy, color);
}

/** Botones repartidos a lo largo de lado mayor del rectángulo (uno por cada `paso` px). */
export function botones(l: Lienzo, r: Rect, color: ColorEntrada, paso = 12): void {
  if (r.w < 7 || r.h < 5) return;
  const horizontal = r.w >= r.h;
  const n = Math.max(1, Math.round((horizontal ? r.w : r.h) / paso));
  for (let i = 0; i < n; i++) {
    const f = (i + 0.5) / n;
    if (horizontal) cruz(l, r.x + Math.round(r.w * f), r.y + Math.floor(r.h / 2), color);
    else cruz(l, r.x + Math.floor(r.w / 2), r.y + Math.round(r.h * f), color);
  }
}

/** Busca las cajas con una etiqueta. */
export const conEtiqueta = (cajas: readonly CajaPlano[], etiqueta: string): CajaPlano[] => cajas.filter((c) => c.etiqueta === etiqueta);
