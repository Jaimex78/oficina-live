/**
 * Constructor de las mascotas (atlas `mascotas-v1`): 12 criaturas, 4 direcciones por 4 cuadros en 32 x 32, y la hoja de
 * revisión `arte/salida/mascotas-v1.png`. Solo publica (`web/public/assets/arte/mascotas-v1.png` y
 * `shared/src/catalogo/mascotas-v1.json`) con `--publicar`:
 *
 *   npm run construir -w @ol/arte -- --solo=mascotas --publicar
 */

import { createHash } from 'node:crypto';
import { DIRECCIONES_PERSONAJE } from '@ol/shared';
import type { CatalogoMascotas, Direccion, MascotaCatalogo, VarianteMascota } from '@ol/shared';
import { registrarConstructor } from '../construir';
import { Lienzo, codificarPng, dibujarTexto, empaquetar, marcadoresJson, recolorearConRampas, validarAtlas } from '../nucleo';
import type { ItemSprite, Marco } from '../nucleo';
import { VARIANTES } from './colores';
import { ESPECIES } from './especies';
import type { NumCuadro, Vista } from './ctx';
import { L } from './pincel';
import type { Pincel } from './pincel';

export const NOMBRE_ATLAS = 'mascotas-v1';
const LADO = 32;
/** Dónde queda la rejilla de 24 x 24 dentro del cuadro de 32 x 32: centrada, con los pies en la fila 31. */
const DX = 4;
const DY = 8;

function aLienzo(p: Pincel): Lienzo {
  const l = new Lienzo(LADO, LADO);
  for (let y = 0; y < L; y++) for (let x = 0; x < L; x++) {
    const c = p.celdas[y * L + x];
    if (c) l.px(x + DX, y + DY, c);
  }
  return l;
}

export const idCuadro = (id: string, dir: Direccion, cuadro: number): string => `${id}@${dir}${cuadro}`;

export interface MascotasConstruidas {
  items: ItemSprite[];
  lienzos: Map<string, Lienzo>;
  mascotas: MascotaCatalogo[];
}

export function construirMascotas(): MascotasConstruidas {
  const items: ItemSprite[] = [];
  const lienzos = new Map<string, Lienzo>();
  const mascotas: MascotaCatalogo[] = [];
  for (const e of ESPECIES) {
    const frames: Partial<Record<Direccion, string[]>> = {};
    for (const dir of DIRECCIONES_PERSONAJE) {
      const vista: Vista = dir === 'O' ? 'E' : dir === 'E' ? 'E' : dir === 'N' ? 'N' : 'S';
      const ids: string[] = [];
      for (const cuadro of [0, 1, 2, 3] as NumCuadro[]) {
        let l = aLienzo(e.dibujar(vista, cuadro));
        if (dir === 'O') l = l.voltearH();
        const id = idCuadro(e.id, dir, cuadro);
        items.push({ id, lienzo: l });
        lienzos.set(id, l);
        ids.push(id);
      }
      frames[dir] = ids;
    }
    const variantes = VARIANTES[e.id];
    if (!variantes) throw new Error(`Faltan los colores de la mascota ${e.id}.`);
    mascotas.push({ id: e.id, nombre: e.nombre, descripcion: e.descripcion, grupo: e.grupo, frames, variantes, etiquetas: [e.grupo, e.id] });
  }
  return { items, lienzos, mascotas };
}

/** Un cuadro ya recoloreado con una variante. */
export const recolorear = (l: Lienzo, v: VarianteMascota): Lienzo => recolorearConRampas(l, v.rampas);

const PISO = '#E9D5B0';
const PISO2 = '#3A2F3A';

/** Hoja de revisión: una fila por mascota con S (4 cuadros), E (4), N (quieto y sentada) y sus 3 colores. */
function hojaRevision(m: MascotasConstruidas): Lienzo {
  const esc = 3;
  const celda = LADO * esc;
  const columnas = 4 + 4 + 2 + 3 + 3;
  const margen = 78;
  const hoja = new Lienzo(margen + columnas * celda, m.mascotas.length * celda);
  hoja.rect(0, 0, hoja.ancho, hoja.alto, PISO);
  hoja.rect(margen + 10 * celda, 0, 3 * celda, hoja.alto, PISO2);
  m.mascotas.forEach((def, fila) => {
    const y = fila * celda;
    dibujarTexto(hoja, def.nombre, 4, y + celda / 2 - 3, '#14141E', 1);
    const poner = (col: number, id: string, v: VarianteMascota): void => {
      const l = recolorear(m.lienzos.get(id) as Lienzo, v).escalar(esc);
      hoja.pegar(l, margen + col * celda, y, { modo: 'sobre' });
    };
    const v0 = def.variantes[0] as VarianteMascota;
    let col = 0;
    for (const c of [0, 1, 2, 3]) poner(col++, idCuadro(def.id, 'S', c), v0);
    for (const c of [0, 1, 2, 3]) poner(col++, idCuadro(def.id, 'E', c), v0);
    poner(col++, idCuadro(def.id, 'N', 0), v0);
    poner(col++, idCuadro(def.id, 'N', 3), v0);
    for (const v of def.variantes) poner(col++, idCuadro(def.id, 'S', 0), v);
    for (const v of def.variantes) poner(col++, idCuadro(def.id, 'O', 1), v);
  });
  return hoja;
}

registrarConstructor('mascotas', (ctx) => {
  const m = construirMascotas();
  const { atlas, frames } = empaquetar(m.items, { anchoMax: 1024, relleno: 2 });
  const errores = validarAtlas(atlas, frames, { multiplo: { ancho: LADO, alto: LADO }, relleno: 2, permitirMarcadores: true });
  if (errores.length > 0) throw new Error(`Las mascotas no pasan la validación:\n${errores.slice(0, 20).join('\n')}`);
  ctx.guardarPng('mascotas-v1.png', hojaRevision(m));
  const huella = createHash('sha1').update(codificarPng(atlas)).digest('hex').slice(0, 10);
  void huella;
  void marcadoresJson;
  ctx.log(`${m.items.length} cuadros de ${m.mascotas.length} mascotas, atlas de ${atlas.ancho}x${atlas.alto} px validado`);
  ctx.publicarAtlas(NOMBRE_ATLAS, atlas, frames, { mascotas: m.mascotas }, { validar: { multiplo: { ancho: LADO, alto: LADO }, relleno: 2 } });
});

export type { CatalogoMascotas, Marco };
