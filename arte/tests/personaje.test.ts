/**
 * Personajes v5 (32 x 64 sobre el cuerpo del diseñador): catálogo, cuadros, rig, parpadeo, espejo, peinado exacto y colores.
 */

import { DIRECCIONES_PERSONAJE, avatarAlAzar, planDeAvatar, reboteDe, validarAvatar } from '@ol/shared';
import type { AvatarSpec, CatalogoPersonaje, Direccion, ParteCatalogo } from '@ol/shared';
import { describe, expect, it } from 'vitest';
import { Lienzo, codificarPng, validarAtlas } from '../src/nucleo';
import { CARAS_V5, VALIDACION_V5, construirCatalogo, empaquetarCatalogo, idCuadro } from '../src/personaje/catalogo';
import { COLORES, PELOS, PIELES } from '../src/personaje/colores';
import { catalogoParaVista, maniqui, renderizar } from '../src/personaje/vistas';
import { CAPAS_DISENADOR, espejoCapa, PELO_P1_PERFIL } from '../src/personaje/v5/disenador';
import { ANCHO } from '../src/personaje/v5/datos-disenador';

const construido = construirCatalogo();
const { atlas, frames } = empaquetarCatalogo(construido.items);
const cat: CatalogoPersonaje = catalogoParaVista(construido, atlas, frames);
const lienzos = construido.lienzos;
const todas = (c: CatalogoPersonaje): ParteCatalogo[] => [
  ...c.cuerpos, ...c.peinados, ...(c.barbas ?? []), ...c.arriba, ...(c.chaquetas ?? []), ...c.abajo, ...c.zapatos, ...c.accesorios, ...c.especiales.flatMap((e) => e.partes),
];
const unaLista = (p: ParteCatalogo): string[] => [...Object.values(p.frames), ...Object.values(p.atras ?? {})].flat();
const caja = (l: Lienzo): { x0: number; y0: number; x1: number; y1: number } => {
  let x0 = 99, y0 = 99, x1 = -1, y1 = -1;
  for (let y = 0; y < l.alto; y++) for (let x = 0; x < l.ancho; x++) if (l.leerHex(x, y)) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  return { x0, y0, x1, y1 };
};
const lienzo = (id: string): Lienzo => lienzos.get(id)!;
const igual = (a: Lienzo, b: Lienzo): boolean => codificarPng(a).equals(codificarPng(b));
const difieren = (a: Lienzo, b: Lienzo): number => { let n = 0; for (let y = 0; y < a.alto; y++) for (let x = 0; x < a.ancho; x++) if (a.leerHex(x, y) !== b.leerHex(x, y)) n++; return n; };

describe('catálogo v5', () => {
  it('trae los conteos pedidos: 5 caras, 12 peinados, 4 vellos, 6 arriba, 5 chaquetas, 5 abajo, 4 zapatos, 4+4+4 accesorios y 5 disfraces', () => {
    expect(cat.cuerpos).toHaveLength(5);
    expect(cat.pieles).toHaveLength(5);
    expect(cat.peinados).toHaveLength(12);
    expect(cat.barbas).toHaveLength(4);
    expect(cat.arriba).toHaveLength(6);
    expect(cat.chaquetas).toHaveLength(5);
    expect(cat.abajo).toHaveLength(5);
    expect(cat.zapatos).toHaveLength(4);
    for (const carpeta of ['sombrero', 'gafas', 'otro']) expect(cat.accesorios.filter((a) => a.carpeta === carpeta), carpeta).toHaveLength(4);
    expect(cat.especiales.map((e) => e.id)).toEqual(['especial-calamar', 'especial-momia', 'especial-vampiro', 'especial-zorro', 'especial-bruja']);
    expect(CARAS_V5).toHaveLength(5);
  });

  it('pasa la validación: solo paleta, marcadores y colores fijos del diseñador, alfa 0 o 255, cuadros de 32x64', () => {
    expect(validarAtlas(atlas, frames, { ...VALIDACION_V5, permitirMarcadores: true })).toEqual([]);
  });

  it('todos los cuadros prometidos existen, miden 32x64 y ninguno está vacío', () => {
    const ids = todas(cat).map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const parte of todas(cat)) {
      expect(Object.keys(parte.frames).length, parte.id).toBeGreaterThanOrEqual(3);
      for (const id of unaLista(parte)) {
        const m = cat.frames[id];
        expect(m, id).toBeDefined();
        expect([m?.w, m?.h], id).toEqual([32, 64]);
        expect(caja(lienzo(id)).x1, id).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('el cuerpo trae 8 cuadros por dirección, las partes animadas 6 y las estáticas 1', () => {
    for (const c of cat.cuerpos) for (const d of DIRECCIONES_PERSONAJE) expect(c.frames[d]).toHaveLength(8);
    for (const p of [...cat.arriba, ...(cat.chaquetas ?? []), ...cat.abajo, ...cat.zapatos]) for (const d of DIRECCIONES_PERSONAJE) expect(p.frames[d], p.id).toHaveLength(6);
    for (const p of [...cat.peinados, ...(cat.barbas ?? [])]) for (const d of Object.keys(p.frames)) expect(p.frames[d as Direccion], p.id).toHaveLength(1);
  });

  it('es determinista: dos construcciones dan los mismos bytes', () => {
    const otro = empaquetarCatalogo(construirCatalogo().items);
    expect(codificarPng(otro.atlas).equals(codificarPng(atlas))).toBe(true);
  });

  it('hay 5 pieles, 12 cabellos y 16 colores de ropa con rampa de 5 tonos y ids únicos; el tono 0 es más oscuro que el 2', () => {
    expect([PIELES.length, PELOS.length, COLORES.length]).toEqual([5, 12, 16]);
    for (const lista of [PIELES, PELOS, COLORES]) {
      expect(new Set(lista.map((c) => c.id)).size).toBe(lista.length);
      for (const c of lista) { expect(c.rampa).toHaveLength(5); expect(parseInt(c.rampa[0].slice(1), 16)).toBeLessThan(parseInt(c.rampa[2].slice(1), 16)); }
    }
  });
});

describe('cuerpo y rig', () => {
  const S = (cuadro: number): Lienzo => lienzo(idCuadro('cara-lisa', 'S', cuadro));

  it('la figura de frente mide 20 de ancho y 33 de alto (la del diseñador) con los pies en la fila 61', () => {
    const c = caja(S(0));
    expect([c.x1 - c.x0 + 1, c.y1 - c.y0 + 1, c.y1]).toEqual([20, 33, 61]);
  });

  it('los pies quedan en la fila 61 de frente y de espalda al caminar; la pierna que va adelante baja 1 (fila 62) y nunca más', () => {
    for (const dir of ['S', 'N'] as const) for (const cu of [1, 2, 3, 4]) expect([61, 62], `${dir}${cu}`).toContain(caja(lienzo(idCuadro('cara-lisa', dir, cu))).y1);
  });

  it('la cabeza sube 1 fila en los pasos 2 y 4 y los demás cuadros de caminar la dejan en su sitio, igual que reboteDe', () => {
    const arriba = (dir: Direccion, cu: number): number => caja(lienzo(idCuadro('cara-lisa', dir, cu))).y0;
    for (const dir of DIRECCIONES_PERSONAJE) {
      for (const cu of [1, 2, 3, 4]) expect(arriba(dir, cu) - arriba(dir, 0), `${dir}${cu}`).toBe(reboteDe(dir, cu));
    }
  });

  it('el perfil derecho es el espejo exacto del izquierdo', () => {
    for (const cu of [0, 2, 5]) {
      const o = lienzo(idCuadro('cara-lisa', 'O', cu)), e = lienzo(idCuadro('cara-lisa', 'E', cu));
      for (let y = 0; y < 64; y++) for (let x = 0; x < 32; x++) expect(e.leerHex(31 - x, y), `${cu} ${x},${y}`).toBe(o.leerHex(x, y));
    }
  });

  it('el parpadeo cambia solo los píxeles del ojo: 10 de frente y 8 de perfil; de espaldas repite el cuadro', () => {
    expect(difieren(S(0), S(6))).toBe(10); // 12 píxeles cambian de regla, 2 ya eran oscuros
    expect(difieren(S(5), S(7))).toBe(10);
    expect(difieren(lienzo(idCuadro('cara-lisa', 'O', 0)), lienzo(idCuadro('cara-lisa', 'O', 6)))).toBe(8);
    expect(difieren(lienzo(idCuadro('cara-lisa', 'E', 5)), lienzo(idCuadro('cara-lisa', 'E', 7)))).toBe(8);
    expect(cat.cuerpos[0]?.frames.N?.[6]).toBe(cat.cuerpos[0]?.frames.N?.[0]);
  });

  it('las 5 caras son distintas y comparten la silueta', () => {
    const formas = cat.cuerpos.map((c) => { const l = lienzo(c.frames.S![0]!); return [caja(l), l] as const; });
    for (const [c] of formas) expect(c).toEqual(formas[0]![0]);
    for (let i = 1; i < formas.length; i++) expect(igual(formas[i]![1], formas[0]![1]), `cara ${i}`).toBe(false);
  });
});

describe('peinado del diseñador y proporción de perfil', () => {
  it('el peinado 1 de frente es el exacto del diseñador: con sus 5 tonos pinta los mismos píxeles', () => {
    const l = lienzo(idCuadro('peinado-despeinado', 'S', 0));
    let n = 0;
    for (const [k] of CAPAS_DISENADOR.pelo) { if (l.leerHex(k % ANCHO, Math.floor(k / ANCHO))) n++; }
    expect(n).toBe(CAPAS_DISENADOR.pelo.size);
    expect(caja(l).y0).toBe(27);
  });

  it('el peinado 1 de perfil es el de los archivos 15 y 16 (sin los 2 píxeles del ojo, que pasan al cuerpo) y el derecho es su espejo', () => {
    const o = lienzo(idCuadro('peinado-despeinado', 'O', 0));
    let n = 0;
    for (const [k] of PELO_P1_PERFIL) if (o.leerHex(k % ANCHO, Math.floor(k / ANCHO))) n++;
    expect(n).toBe(PELO_P1_PERFIL.size);
    const e = lienzo(idCuadro('peinado-despeinado', 'E', 0));
    for (const k of espejoCapa(PELO_P1_PERFIL).keys()) expect(e.leerHex(k % ANCHO, Math.floor(k / ANCHO))).not.toBeNull();
  });

  it('todos los peinados de perfil caben en el domo del diseñador: de la columna 3 a la 29 y desde la fila 18', () => {
    for (const p of cat.peinados) {
      const c = caja(lienzo(p.frames.O![0]!));
      expect(c.x0, p.id).toBeGreaterThanOrEqual(p.id === 'peinado-afro' ? 1 : 3); // el afro es el único con volumen fuera del domo
      expect(c.x1, p.id).toBeLessThanOrEqual(29);
      expect(c.y0, p.id).toBeGreaterThanOrEqual(18);
    }
  });
});

describe('armado', () => {
  const base = maniqui(cat);
  const avatares: AvatarSpec[] = Array.from({ length: 200 }, (_, i) => avatarAlAzar(cat, i + 1));

  it('un maniquí con cada parte se arma en las 4 direcciones y los 8 cuadros sin faltar cuadros', () => {
    const variantes: Partial<AvatarSpec>[] = [
      ...cat.peinados.map((p) => ({ peinado: p.id })),
      ...cat.arriba.map((p) => ({ arriba: p.id })),
      ...cat.abajo.map((p) => ({ abajo: p.id })),
      ...cat.zapatos.map((p) => ({ zapatos: p.id })),
      ...(cat.chaquetas ?? []).map((p) => ({ chaqueta: { id: p.id, color: 'rojo' } })),
      ...(cat.barbas ?? []).map((b) => ({ barba: { id: b.id, color: 'pelo-casi-negro' } })),
      ...cat.accesorios.map((a) => ({ accesorios: [{ id: a.id, color: 'rojo', color2: 'azul-violeta' }] })),
      ...cat.especiales.map((e) => ({ especial: { id: e.id } })),
    ];
    for (const v of variantes) {
      const spec = { ...base, ...v };
      expect(validarAvatar(spec, cat), JSON.stringify(v)).toBeNull();
      for (const dir of DIRECCIONES_PERSONAJE) for (const cu of [0, 1, 2, 3, 4, 5, 6, 7] as const) {
        const l = renderizar(spec, cat, lienzos, dir, cu);
        expect(caja(l).x1, `${JSON.stringify(v)} ${dir}${cu}`).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('avatarAlAzar produce avatares válidos con 200 semillas y se arman completos', () => {
    for (const spec of avatares) {
      expect(validarAvatar(spec, cat)).toBeNull();
      for (const dir of DIRECCIONES_PERSONAJE) for (const cu of [0, 3, 5, 6] as const) for (const c of planDeAvatar(spec, cat, dir, cu)) expect(cat.frames[c.frame], c.frame).toBeDefined();
    }
  });

  it('un sombrero oculta el peinado desde su fila: arriba de ella no queda pelo en el cuadro final', () => {
    const gorra = cat.accesorios.find((a) => a.id === 'acc-gorra')!;
    expect(gorra.ocultaPeloSobre).toBeGreaterThan(30);
    const plan = planDeAvatar({ ...base, peinado: 'peinado-melena', accesorios: [{ id: gorra.id, color: 'rojo' }] }, cat, 'S', 0);
    const pelo = plan.find((c) => c.capa === 'pelo');
    expect(pelo?.filaMin).toBe(gorra.ocultaPeloSobre);
  });

  it('los peinados largos traen la melena detrás del cuerpo (capa atras) y la mochila también', () => {
    const plan = planDeAvatar({ ...base, peinado: 'peinado-melena' }, cat, 'S', 0);
    expect(plan.map((c) => c.capa)[0]).toBe('atras');
    const mochila = planDeAvatar({ ...base, accesorios: [{ id: 'acc-mochila', color: 'rojo' }] }, cat, 'O', 0);
    expect(mochila.filter((c) => c.capa === 'atras').length).toBe(1);
  });

  it('un disfraz reemplaza arriba, abajo y zapatos y la bruja corta el pelo bajo su sombrero', () => {
    const plan = planDeAvatar({ ...base, especial: { id: 'especial-bruja' } }, cat, 'S', 0);
    expect(plan.some((c) => c.parte === 'arriba-camiseta' || c.parte === 'abajo-pantalon')).toBe(false);
    expect(plan.find((c) => c.capa === 'pelo')?.filaMin).toBeGreaterThan(30);
  });
});
