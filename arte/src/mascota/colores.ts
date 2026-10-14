/** Variantes de color de las mascotas: 3 por criatura. `accA` es el color principal y `accB` el secundario. */

import type { VarianteMascota } from '@ol/shared';
import { rampa } from '../personaje/colores';

const BLANCO = ['#14141E', '#B6BACD', '#E6E8F0', '#F6F7FB', '#FFFFFF'] as const;
const suave = (hex: string) => rampa(hex, { sube: 0.05, baja: 0.1 });

const v = (id: string, nombre: string, a: readonly string[], b: readonly string[]): VarianteMascota => ({
  id,
  nombre,
  rampas: { accA: [...a] as unknown as readonly [string, string, string, string, string], accB: [...b] as unknown as readonly [string, string, string, string, string] },
});

export const VARIANTES: Readonly<Record<string, VarianteMascota[]>> = {
  gato: [
    v('naranja', 'Naranja', rampa('#E08A3A'), suave('#F8E6C8')),
    v('gris', 'Gris', rampa('#8F97A8'), suave('#E4E8EF')),
    v('negro', 'Negro', rampa('#3A3C48', { t0: 0.09, sube: 0.1, baja: 0.08 }), rampa('#9AA0B0')),
  ],
  perro: [
    v('cafe', 'Café', rampa('#B8794A'), rampa('#6A4129')),
    v('crema', 'Crema', suave('#E7C79A'), rampa('#A8723F')),
    v('gris', 'Gris', rampa('#9AA3B3'), rampa('#4C5262')),
  ],
  conejo: [
    v('blanco', 'Blanco', BLANCO, suave('#F5A9B8')),
    v('cafe', 'Café', rampa('#B58A62'), suave('#F0C8B0')),
    v('gris', 'Gris', rampa('#A5A9B8'), suave('#F2B8C4')),
  ],
  buho: [
    v('cafe', 'Café', rampa('#9A6A44'), suave('#E7CDA3')),
    v('gris', 'Gris', rampa('#8C93A8'), suave('#DDE1EC')),
    v('nieve', 'Nieve', BLANCO, rampa('#BFC6DA')),
  ],
  pollito: [
    v('amarillo', 'Amarillo', rampa('#FCD548'), rampa('#F4A83C')),
    v('naranja', 'Naranja', rampa('#F59A4A'), rampa('#D6602F')),
    v('celeste', 'Celeste', rampa('#7FD0F2'), rampa('#3E9BD6')),
  ],
  panda: [
    v('clasico', 'Clásico', BLANCO, rampa('#2E3038', { t0: 0.08, sube: 0.1, baja: 0.07 })),
    v('cafe', 'Café', suave('#F0DCC0'), rampa('#6B4630')),
    v('rosa', 'Rosa', suave('#FADCE6'), rampa('#7A4A66')),
  ],
  rana: [
    v('verde', 'Verde', rampa('#5CBE55'), suave('#D9F0A8')),
    v('celeste', 'Celeste', rampa('#4FB8E8'), suave('#D8F2FF')),
    v('roja', 'Roja', rampa('#E5584A'), suave('#FBD0A0')),
  ],
  zorro: [
    v('naranja', 'Naranja', rampa('#E8853A'), suave('#FFF3E0')),
    v('gris', 'Gris', rampa('#8A94AE'), suave('#F2F4FA')),
    v('nieve', 'Nieve', BLANCO, rampa('#C5CBE0')),
  ],
  dragoncito: [
    v('verde', 'Verde', rampa('#4FB35A'), suave('#F5E3A0')),
    v('morado', 'Morado', rampa('#9468D4'), suave('#F3C8F0')),
    v('rojo', 'Rojo', rampa('#E0503C'), suave('#FFD79A')),
  ],
  nube: [
    v('blanca', 'Blanca', BLANCO, rampa('#C3CBE6')),
    v('tormenta', 'Tormenta', rampa('#8E97B0'), rampa('#5F6985')),
    v('rosa', 'Rosa', suave('#F7B9D0'), rampa('#E88EB4')),
  ],
  hongo: [
    v('rojo', 'Rojo', rampa('#E0453A'), suave('#FFF1D6')),
    v('cafe', 'Café', rampa('#A5683F'), suave('#F3E2C0')),
    v('morado', 'Morado', rampa('#8F63C9'), suave('#F0E6FF')),
  ],
  fantasmita: [
    v('blanco', 'Blanco', ['#14141E', '#C4C9DE', '#EEF0F8', '#FAFBFE', '#FFFFFF'], suave('#C9D2F0')),
    v('celeste', 'Celeste', rampa('#A8DCF5'), suave('#E4F6FF')),
    v('lila', 'Lila', rampa('#C5A8F0'), suave('#F0E4FF')),
  ],
};
