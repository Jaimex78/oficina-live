/**
 * Vistas de revisión de los personajes v5 (solo para mirar el arte, nunca se publican). Todas arman al personaje con `planDeAvatar` y
 * `recolorearConRampas`, los mismos pasos que sigue el navegador: lo que se ve aquí es lo que verá la gente.
 *
 *  - `personajes-giro.png`           un personaje en las 4 direcciones y los 8 cuadros
 *  - `personajes-ciclo.png`          ciclos de caminar de varios personajes
 *  - `personajes-combinaciones.png`  combinaciones al azar, para ver que nada se rompa
 *  - `personajes-catalogo.png`       cada parte del catálogo sola
 *  - `personajes-sentados.png`       los cuadros sentados sobre un asiento sencillo
 *  - `personajes-v5-<categoria>.png` cada opción de una categoría sobre un maniquí
 */

import { createHash } from 'node:crypto';
import { CICLO_CAMINAR, DIRECCIONES_PERSONAJE, avatarAlAzar, planDeAvatar } from '@ol/shared';
import type { AvatarSpec, CatalogoPersonaje, Direccion } from '@ol/shared';
import { Lienzo, codificarPng, dibujarTexto, hojaContacto, marcadoresJson, recolorearConRampas } from '../nucleo';
import type { ItemSprite, Marco } from '../nucleo';
import type { CatalogoConstruido } from './catalogo';
import { ALTO as ALTO_CUADRO, ANCHO as ANCHO_CUADRO } from './v5/datos-disenador';

export const PISO_CLARO = '#E9D5B0';
export const PISO_OSCURO = '#3A2F3A';
const GRIS = '#8E8E98';

type Cuadro = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

/** El catálogo completo tal como lo leerá el navegador (con el atlas ya empaquetado). */
export function catalogoParaVista(c: CatalogoConstruido, atlas: Lienzo, frames: Readonly<Record<string, Marco>>, nombre = 'personajes-v5'): CatalogoPersonaje {
  const huella = createHash('sha1').update(codificarPng(atlas)).digest('hex').slice(0, 10);
  const marcos: Record<string, Marco> = {};
  for (const [id, m] of Object.entries(frames)) marcos[id] = { x: m.x, y: m.y, w: m.w, h: m.h };
  return { version: 1, archivo: `${nombre}.png`, huella, ancho: atlas.ancho, alto: atlas.alto, frames: marcos, marcadores: marcadoresJson(), ...c.meta };
}

/** Arma un cuadro del personaje: una pila de cuadros recoloreados (respetando `dy` y `filaMin` del plan). */
export function renderizar(spec: AvatarSpec, cat: CatalogoPersonaje, lienzos: ReadonlyMap<string, Lienzo>, dir: Direccion, cuadro: Cuadro): Lienzo {
  const salida = new Lienzo(ANCHO_CUADRO, ALTO_CUADRO);
  for (const capa of planDeAvatar(spec, cat, dir, cuadro)) {
    const base = lienzos.get(capa.frame);
    if (base === undefined) throw new Error(`Falta el cuadro ${capa.frame} en el catálogo.`);
    const color = recolorearConRampas(base, capa.rampas);
    const desde = capa.filaMin ?? 0;
    salida.pegar(desde > 0 ? color.recortar(0, desde, ANCHO_CUADRO, ALTO_CUADRO - desde) : color, 0, desde + capa.dy);
  }
  return salida;
}

const primero = <T extends { id: string }>(l: readonly T[] | undefined): string => l?.[0]?.id ?? '';

/** Un personaje de prueba con la primera opción de cada lista; `ajustes` cambia lo que se quiera. */
export function avatarBase(cat: CatalogoPersonaje, ajustes: Partial<AvatarSpec> = {}): AvatarSpec {
  return {
    v: 1,
    cuerpo: primero(cat.cuerpos),
    piel: primero(cat.pieles),
    peinado: primero(cat.peinados),
    pelo: primero(cat.pelos),
    arriba: primero(cat.arriba),
    colorArriba: primero(cat.colores),
    colorArriba2: primero(cat.colores),
    abajo: primero(cat.abajo),
    colorAbajo: primero(cat.colores),
    zapatos: primero(cat.zapatos),
    colorZapatos: primero(cat.colores),
    accesorios: [],
    ...ajustes,
  };
}

/** El maniquí de las hojas de revisión: siempre el mismo personaje para comparar prendas y accesorios. */
export function maniqui(cat: CatalogoPersonaje, ajustes: Partial<AvatarSpec> = {}): AvatarSpec {
  const color = (id: string): string => cat.colores.find((c) => c.id === id)?.id ?? primero(cat.colores);
  return avatarBase(cat, {
    piel: cat.pieles[2]?.id ?? primero(cat.pieles),
    peinado: cat.peinados.find((p) => p.id === 'peinado-corto')?.id ?? primero(cat.peinados),
    pelo: cat.pelos.find((p) => p.id === 'pelo-cafe-oscuro')?.id ?? primero(cat.pelos),
    arriba: cat.arriba.find((p) => p.id === 'arriba-camiseta')?.id ?? primero(cat.arriba),
    colorArriba: color('azul-violeta'),
    colorArriba2: color('beige'),
    abajo: cat.abajo.find((p) => p.id === 'abajo-pantalon')?.id ?? primero(cat.abajo),
    colorAbajo: color('gris'),
    zapatos: cat.zapatos.find((p) => p.id === 'zapatos-tenis')?.id ?? primero(cat.zapatos),
    colorZapatos: color('negro'),
    ...ajustes,
  });
}

const fondoLiso = (ancho: number, alto: number, color: string): Lienzo => new Lienzo(ancho, alto).rect(0, 0, ancho, alto, color);
const pegarEscalado = (hoja: Lienzo, personaje: Lienzo, x: number, y: number, escala: number): void => {
  hoja.pegar(personaje.escalar(escala), x, y);
};
const etiqueta = (hoja: Lienzo, texto: string, x: number, y: number, color = '#14141A'): void => {
  dibujarTexto(hoja, texto.toUpperCase(), x, y, color, 1);
};

type Lienzos = ReadonlyMap<string, Lienzo>;
/** Las 8 columnas de la hoja en orden. */
const CUADROS_TODOS: readonly Cuadro[] = [0, 1, 2, 3, 4, 5, 6, 7];

/** Un personaje en las 4 direcciones y los 8 cuadros, sobre un piso claro. */
export function hojaGiro(spec: AvatarSpec, cat: CatalogoPersonaje, lienzos: Lienzos, escala = 3): Lienzo {
  const margen = 8;
  const celdaW = ANCHO_CUADRO * escala;
  const celdaH = ALTO_CUADRO * escala;
  const hoja = fondoLiso(margen + CUADROS_TODOS.length * (celdaW + 2), margen + 4 * (celdaH + margen), GRIS);
  DIRECCIONES_PERSONAJE.forEach((dir, fila) => {
    CUADROS_TODOS.forEach((cuadro, col) => {
      const x = margen + col * (celdaW + 2);
      const y = margen + fila * (celdaH + margen);
      hoja.pegar(fondoLiso(celdaW, celdaH, PISO_CLARO), x, y);
      pegarEscalado(hoja, renderizar(spec, cat, lienzos, dir, cuadro), x, y, escala);
      etiqueta(hoja, `${dir}${cuadro}`, x + 2, y + 2);
    });
  });
  return hoja;
}

/** Ciclos de caminar de varios personajes: frente, perfil derecho, espalda y perfil izquierdo. */
export function hojaCiclo(especificaciones: readonly AvatarSpec[], cat: CatalogoPersonaje, lienzos: Lienzos, escala = 2): Lienzo {
  const margen = 6;
  const celdaW = ANCHO_CUADRO * escala;
  const celdaH = ALTO_CUADRO * escala;
  const direcciones: Direccion[] = ['S', 'E', 'N', 'O'];
  const hoja = fondoLiso(margen + direcciones.length * (CICLO_CAMINAR.length * celdaW + margen), margen + especificaciones.length * (celdaH + margen), GRIS);
  especificaciones.forEach((spec, fila) => {
    direcciones.forEach((dir, bloque) => {
      CICLO_CAMINAR.forEach((cuadro, i) => {
        const x = margen + bloque * (CICLO_CAMINAR.length * celdaW + margen) + i * celdaW;
        const y = margen + fila * (celdaH + margen);
        hoja.pegar(fondoLiso(celdaW, celdaH, PISO_CLARO), x, y);
        pegarEscalado(hoja, renderizar(spec, cat, lienzos, dir, cuadro), x, y, escala);
      });
    });
  });
  return hoja;
}

/** Combinaciones al azar, cada una de frente y de perfil. */
export function hojaCombinaciones(cat: CatalogoPersonaje, lienzos: Lienzos, cantidad = 24, escala = 2, fabrica: (i: number) => AvatarSpec = (i) => avatarAlAzar(cat, i + 1)): Lienzo {
  const margen = 6;
  const celdaW = ANCHO_CUADRO * escala;
  const celdaH = ALTO_CUADRO * escala;
  const columnas = 8;
  const filas = Math.ceil(cantidad / columnas);
  const anchoPar = 2 * celdaW + 4;
  const hoja = fondoLiso(margen + columnas * (anchoPar + margen), margen + filas * (celdaH + margen + 8), GRIS);
  for (let i = 0; i < cantidad; i++) {
    const spec = fabrica(i);
    const x = margen + (i % columnas) * (anchoPar + margen);
    const y = margen + Math.floor(i / columnas) * (celdaH + margen + 8);
    hoja.pegar(fondoLiso(anchoPar, celdaH, i % 2 === 0 ? PISO_CLARO : PISO_OSCURO), x, y);
    pegarEscalado(hoja, renderizar(spec, cat, lienzos, 'S', 0), x, y, escala);
    pegarEscalado(hoja, renderizar(spec, cat, lienzos, 'E', 0), x + celdaW + 4, y, escala);
    etiqueta(hoja, `#${i + 1}`, x + 2, y + celdaH + 2, '#F4F4F8');
  }
  return hoja;
}

/** Cada parte del catálogo sola (cuadros quieto, paso y sentado de las animadas). */
export function hojaCatalogo(c: CatalogoConstruido, escala = 1): Lienzo {
  const items: ItemSprite[] = [];
  const grupos = [c.meta.cuerpos, c.meta.peinados, c.meta.barbas, c.meta.arriba, c.meta.chaquetas, c.meta.abajo, c.meta.zapatos, c.meta.accesorios, ...c.meta.especiales.map((e) => e.partes)];
  for (const grupo of grupos) {
    for (const parte of grupo) {
      const animada = (parte.frames.S?.length ?? 1) >= 6;
      for (const cuadro of animada ? [0, 2, 5] : [0]) {
        for (const dir of ['S', 'O', 'E', 'N'] as const) {
          for (const lista of [parte.frames[dir], parte.atras?.[dir]]) {
            const id = lista?.[cuadro];
            const lienzo = id === undefined ? undefined : c.lienzos.get(id);
            if (id !== undefined && lienzo !== undefined && !items.some((i) => i.id === id)) items.push({ id, lienzo });
          }
        }
      }
    }
  }
  return hojaContacto(items, { escala, columnas: 24, fondo: GRIS, rejilla: false, mostrarTamano: false, escalaTexto: 1 });
}

// ---------------------------------------------------------------------------
// Sentados
// ---------------------------------------------------------------------------

const SILLA = { tela: '#46557A', telaClara: '#6677A0', telaOscura: '#2F3957', madera: '#B07158', maderaOscura: '#885544', sofa: '#E0C2A0', sofaClaro: '#EED9BC', sofaOscuro: '#CBA582' };

/** Asiento de la vista previa: sofá de frente, silla de oficina de espaldas y silla sencilla de perfil (el motor decide el desplazamiento real). */
function silla(dir: Direccion): { detras: Lienzo; delante: Lienzo } {
  const detras = new Lienzo(ANCHO_CUADRO, ALTO_CUADRO + 4);
  const delante = new Lienzo(ANCHO_CUADRO, ALTO_CUADRO + 4);
  if (dir === 'S') {
    detras.rectRedondeado(2, 50, 28, 10, 3, SILLA.sofa);
    detras.rect(3, 51, 26, 1, SILLA.sofaClaro);
    delante.rect(2, 59, 28, 3, SILLA.sofaOscuro);
    delante.rect(2, 59, 28, 1, SILLA.sofaClaro);
  } else if (dir === 'N') {
    delante.rectRedondeado(5, 54, 22, 6, 2, SILLA.tela);
    delante.rect(6, 55, 20, 1, SILLA.telaClara);
    delante.rect(14, 60, 4, 3, SILLA.maderaOscura);
  } else {
    const atras = dir === 'E' ? 7 : 22;
    detras.rectRedondeado(atras, 44, 3, 14, 1, SILLA.tela);
    detras.rect(8, 58, 16, 3, SILLA.tela);
    detras.rect(8, 58, 16, 1, SILLA.telaClara);
    detras.rect(15, 61, 2, 3, SILLA.maderaOscura);
  }
  return { detras, delante };
}

/** Personajes sentados en las 4 direcciones (vista de referencia, sin el desplazamiento real del motor). */
export function hojaSentados(especificaciones: readonly AvatarSpec[], cat: CatalogoPersonaje, lienzos: Lienzos, escala = 3): Lienzo {
  const margen = 8;
  const celdaW = ANCHO_CUADRO * escala;
  const celdaH = (ALTO_CUADRO + 4) * escala;
  const direcciones: Direccion[] = ['S', 'O', 'E', 'N'];
  const hoja = fondoLiso(margen + direcciones.length * (celdaW + margen), margen + especificaciones.length * (celdaH + margen), GRIS);
  especificaciones.forEach((spec, fila) => {
    direcciones.forEach((dir, col) => {
      const escena = fondoLiso(ANCHO_CUADRO, ALTO_CUADRO + 4, fila % 2 === 0 ? PISO_CLARO : PISO_OSCURO);
      const { detras, delante } = silla(dir);
      escena.pegar(detras, 0, 0);
      escena.pegar(renderizar(spec, cat, lienzos, dir, 5), 0, 0);
      escena.pegar(delante, 0, 0);
      pegarEscalado(hoja, escena, margen + col * (celdaW + margen), margen + fila * (celdaH + margen), escala);
    });
  });
  return hoja;
}

export interface FilaRevision {
  nombre: string;
  spec: AvatarSpec;
}

export const VISTAS_REVISION: ReadonlyArray<readonly [Direccion, Cuadro]> = [['S', 0], ['N', 0], ['O', 0], ['E', 0], ['S', 2], ['O', 2], ['S', 5], ['N', 5], ['O', 5]];

/** Una fila por avatar y una columna por vista; las últimas `oscuras` columnas van sobre el piso oscuro. */
export function hojaRevision(filas: readonly FilaRevision[], cat: CatalogoPersonaje, lienzos: Lienzos, o: { vistas?: typeof VISTAS_REVISION; escala?: number; bloques?: number; oscuras?: number; y0?: number; alto?: number } = {}): Lienzo {
  const vistas = o.vistas ?? VISTAS_REVISION;
  const escala = o.escala ?? 3;
  const bloques = Math.max(1, o.bloques ?? 1);
  const oscuras = o.oscuras ?? 3;
  const margen = 6;
  const celdaW = ANCHO_CUADRO * escala;
  const y0 = o.y0 ?? 20;
  const altoV = o.alto ?? ALTO_CUADRO - y0;
  const celdaH = altoV * escala;
  const porBloque = Math.ceil(filas.length / bloques);
  const anchoBloque = vistas.length * celdaW + margen;
  const hoja = fondoLiso(margen + bloques * (anchoBloque + margen), margen + porBloque * (celdaH + margen + 9), GRIS);
  filas.forEach((fila, i) => {
    const x0 = margen + Math.floor(i / porBloque) * (anchoBloque + margen);
    const y = margen + (i % porBloque) * (celdaH + margen + 9);
    etiqueta(hoja, fila.nombre, x0, y + celdaH + 1, '#F4F4F8');
    vistas.forEach(([dir, cuadro], c) => {
      const x = x0 + c * celdaW;
      hoja.pegar(fondoLiso(celdaW, celdaH, c >= vistas.length - oscuras ? PISO_OSCURO : PISO_CLARO), x, y);
      pegarEscalado(hoja, renderizar(fila.spec, cat, lienzos, dir, cuadro).recortar(0, y0, ANCHO_CUADRO, altoV), x, y, escala);
    });
  });
  return hoja;
}
