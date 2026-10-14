/**
 * Cambiar el color de una prenda o accesorio tiene que cambiar píxeles del cuadro final, también con las demás capas encima.
 * Nació de un fallo real: el pantalón largo, el jean y el pantalón de vestir pintaban los pies y tapaban los zapatos por completo, así que
 * `colorZapatos` no cambiaba ni un píxel con el pantalón por defecto (los zapatos salían siempre negros).
 */
import { planDeAvatar, type AvatarSpec, type CatalogoPersonaje, type Cuadro, type Direccion } from '@ol/shared';
import { describe, expect, it } from 'vitest';
import { construirCatalogo, empaquetarCatalogo } from '../src/personaje/catalogo';
import { catalogoParaVista, maniqui, renderizar } from '../src/personaje/vistas';

const construido = construirCatalogo();
const { atlas, frames } = empaquetarCatalogo(construido.items);
const cat: CatalogoPersonaje = catalogoParaVista(construido, atlas, frames);
const base = maniqui(cat);
const VISTAS: [Direccion, Cuadro][] = [['S', 0], ['N', 0], ['O', 0], ['E', 0], ['S', 2], ['O', 3], ['S', 5], ['O', 5], ['E', 5]] as [Direccion, Cuadro][];

function pixelesDistintos(a: AvatarSpec, b: AvatarSpec, vistas = VISTAS): number {
  let n = 0;
  for (const [d, c] of vistas) {
    const x = renderizar(a, cat, construido.lienzos, d, c);
    const y = renderizar(b, cat, construido.lienzos, d, c);
    for (let j = 0; j < x.alto; j++) for (let i = 0; i < x.ancho; i++) if (x.leerHex(i, j) !== y.leerHex(i, j)) n++;
  }
  return n;
}
const color = (id: string): string => cat.colores.find((c) => c.id === id)!.id;

describe('el color elegido se ve en el cuadro final', () => {
  it('los 16 colores de ropa son distintos entre sí en los zapatos, con cualquier zapato y cualquier pantalón', () => {
    for (const z of cat.zapatos) for (const ab of cat.abajo) {
      for (const c of cat.colores) {
        const rojo = { ...base, zapatos: z.id, abajo: ab.id, colorZapatos: color('rojo') };
        const otro = { ...base, zapatos: z.id, abajo: ab.id, colorZapatos: c.id };
        if (c.id !== 'rojo') expect(pixelesDistintos(rojo, otro), `${z.id} con ${ab.id}: rojo contra ${c.id}`).toBeGreaterThan(0);
      }
    }
  });

  it('cada zapato cambia de color en frente, perfiles, espalda, caminar y sentado (al menos 2 píxeles por vista, salvo la espalda sentada)', () => {
    for (const z of cat.zapatos) for (const [d, c] of VISTAS) {
      const a = { ...base, zapatos: z.id, colorZapatos: color('rojo') };
      const b = { ...base, zapatos: z.id, colorZapatos: color('azul-violeta') };
      expect(pixelesDistintos(a, b, [[d, c]]), `${z.id} ${d}${c}`).toBeGreaterThanOrEqual(d === 'N' && c === 5 ? 1 : 2);
    }
  });

  it('arriba, chaqueta, abajo, sombrero, gafas y otro cambian de color con su paleta', () => {
    for (const p of cat.arriba) expect(pixelesDistintos({ ...base, arriba: p.id, colorArriba: color('rojo') }, { ...base, arriba: p.id, colorArriba: color('verde') }), p.id).toBeGreaterThan(0);
    for (const p of cat.abajo) expect(pixelesDistintos({ ...base, abajo: p.id, colorAbajo: color('rojo') }, { ...base, abajo: p.id, colorAbajo: color('verde') }), p.id).toBeGreaterThan(0);
    for (const p of cat.chaquetas ?? []) expect(pixelesDistintos({ ...base, chaqueta: { id: p.id, color: color('rojo') } }, { ...base, chaqueta: { id: p.id, color: color('verde') } }), p.id).toBeGreaterThan(0);
    for (const p of cat.accesorios) {
      const uno = pixelesDistintos({ ...base, accesorios: [{ id: p.id, color: color('rojo'), color2: color('rojo') }] }, { ...base, accesorios: [{ id: p.id, color: color('verde'), color2: color('verde') }] });
      expect(uno, p.id).toBeGreaterThan(0);
    }
  });

  it('planDeAvatar usa el color de zapatos elegido y no otro', () => {
    const plan = planDeAvatar({ ...base, colorZapatos: color('rojo') }, cat, 'S', 0);
    const z = plan.find((c) => c.capa === 'zapatos');
    expect(z?.rampas.zapatos?.[2]).toBe(cat.colores.find((c) => c.id === 'rojo')!.rampa[2]);
  });
});
