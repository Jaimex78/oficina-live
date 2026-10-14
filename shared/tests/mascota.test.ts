import { describe, expect, it } from 'vitest';
import { claveMascota, limpiarNombreMascota, mascotaPorId, migrarAvatar, validarMascota, varianteDe, avatarAlAzar, validarAvatar, type AvatarSpec, type CatalogoMascotas, type CatalogoPersonaje } from '../src';
import mascotasJson from '../src/catalogo/mascotas-v1.json';
import personajesJson from '../src/catalogo/personajes-v5.json';

const cm = mascotasJson as unknown as CatalogoMascotas;
const cat = personajesJson as unknown as CatalogoPersonaje;

describe('contrato de mascotas', () => {
  it('el catálogo trae 12 mascotas, 4 direcciones de 4 cuadros que existen en el atlas y 3 colores', () => {
    expect(cm.mascotas).toHaveLength(12);
    for (const m of cm.mascotas) {
      expect(m.variantes).toHaveLength(3);
      for (const dir of ['S', 'O', 'E', 'N'] as const) {
        expect(m.frames[dir]).toHaveLength(4);
        for (const id of m.frames[dir]!) expect(cm.frames[id], id).toBeDefined();
      }
      for (const v of m.variantes) {
        expect(v.rampas.accA).toHaveLength(5);
        expect(v.rampas.accB).toHaveLength(5);
      }
    }
    expect(cm.mascotas.filter((m) => m.grupo === 'animales')).toHaveLength(8);
    expect(cm.mascotas.filter((m) => m.grupo === 'fantasticas')).toHaveLength(4);
  });

  it('validarMascota: sin mascota está bien; id, color y nombre se revisan', () => {
    expect(validarMascota(undefined, cm)).toBeNull();
    expect(validarMascota({ id: 'zorro', color: 'nieve' }, cm)).toBeNull();
    expect(validarMascota({ id: 'zorro', color: 'rojo' }, cm)).not.toBeNull();
    expect(validarMascota({ id: 'yeti', color: 'blanco' }, cm)).not.toBeNull();
    expect(validarMascota({ id: 'zorro', color: 'nieve', nombre: 'a'.repeat(21) }, cm)).not.toBeNull();
    expect(validarMascota({ id: 3, color: 'nieve' } as never, cm)).not.toBeNull();
  });

  it('varianteDe cae a la primera, la clave es estable y el nombre se limpia', () => {
    const gato = mascotaPorId(cm, 'gato')!;
    expect(varianteDe(gato, 'gris')?.id).toBe('gris');
    expect(varianteDe(gato, 'nada')?.id).toBe(gato.variantes[0]!.id);
    expect(claveMascota({ id: 'gato', color: 'gris', nombre: 'x' })).toBe('gato:gris');
    expect(limpiarNombreMascota('  Michi   el\tgrande  ')).toBe('Michi el grande');
    expect(limpiarNombreMascota('')).toBeUndefined();
    expect(limpiarNombreMascota(5)).toBeUndefined();
    expect(limpiarNombreMascota('x'.repeat(50))).toHaveLength(20);
  });

  it('la mascota no depende del catálogo de ropa: validarAvatar la ignora y migrarAvatar la conserva', () => {
    const spec: AvatarSpec = { ...avatarAlAzar(cat, 3), mascota: { id: 'panda', color: 'clasico' } };
    expect(validarAvatar(spec, cat)).toBeNull();
    expect(migrarAvatar(spec, cat)).toEqual(spec);
    const roto = { ...spec, peinado: 'peinado-viejo-que-no-existe' };
    expect(migrarAvatar(roto, cat, 5).mascota).toEqual({ id: 'panda', color: 'clasico' });
    // Un personaje de antes (sin el campo) sigue siendo válido y no gana mascota.
    expect(migrarAvatar(avatarAlAzar(cat, 4), cat).mascota).toBeUndefined();
  });

  it('avatarAlAzar nunca sortea mascota y, sin el paquete, tampoco ropa premium', () => {
    for (let i = 1; i <= 80; i++) {
      const a = avatarAlAzar(cat, i);
      expect(a.mascota).toBeUndefined();
      for (const x of a.accesorios) expect(cat.accesorios.find((p) => p.id === x.id)?.premium).not.toBe(true);
    }
    const alguno = Array.from({ length: 200 }, (_, i) => avatarAlAzar(cat, i + 1, true)).some((a) => a.accesorios.some((x) => cat.accesorios.find((p) => p.id === x.id)?.premium === true));
    expect(alguno).toBe(true);
  });
});
