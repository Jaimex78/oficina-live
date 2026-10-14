import { describe, expect, it } from 'vitest';
import {
  CATEGORIAS_EDITOR,
  reboteDe,
  migrarAvatar,
  CAPAS_PERSONAJE,
  CARPETAS_ACCESORIO,
  COLECCIONES,
  DIRECCIONES_PERSONAJE,
  MAX_ACCESORIOS,
  REBOTE,
  avatarAlAzar,
  claveAvatar,
  disfrazDe,
  movilidadDe,
  planDeAvatar,
  validarAvatar,
} from '../src';
import type { AvatarSpec, CapaPersonaje, CatalogoPersonaje, DisfrazCatalogo, MovilidadCatalogo, ParteCatalogo, Rampa5 } from '../src';
import catalogoPublicado from '../src/catalogo/personajes-v5.json';

// ---------------------------------------------------------------------------
// Un catálogo mínimo hecho a mano: lo justo para probar el plan sin depender del arte
// ---------------------------------------------------------------------------

const rampa = (n: number): Rampa5 => [`#0${n}0000`, `#0${n}1111`, `#0${n}2222`, `#0${n}3333`, `#0${n}4444`];

/** Una parte con un cuadro por dirección (estática) o seis (animada: quieto, 4 de caminar y sentado). */
function parte(id: string, capa: CapaPersonaje, animada: boolean, extra: Partial<ParteCatalogo> = {}): ParteCatalogo {
  const frames: ParteCatalogo['frames'] = {};
  for (const dir of DIRECCIONES_PERSONAJE) frames[dir] = (animada ? [0, 1, 2, 3, 4, 5] : [0]).map((c) => `${id}@${dir}${c}`);
  return { id, nombre: id, capa, slots: [], frames, etiquetas: [], ...extra };
}

function catalogoMinimo(): CatalogoPersonaje {
  const traje = parte('especial-prueba-traje', 'arriba', true);
  const capa = parte('especial-prueba-capa', 'atras', true);
  const gorro = parte('especial-prueba-gorro', 'cabeza', false);
  const bruja: DisfrazCatalogo = {
    id: 'especial-prueba',
    nombre: 'Prueba',
    coleccion: 'halloween',
    ocultaPelo: false,
    ocultaAccesorios: false,
    slots: ['ropaA', 'ropaB'],
    porDefecto: { color: 'rojo', color2: 'azul' },
    etiquetas: [],
    partes: [traje, capa, gorro],
  };
  const fantasma: DisfrazCatalogo = {
    ...bruja,
    id: 'especial-fantasma',
    nombre: 'Fantasma',
    ocultaPelo: true,
    ocultaAccesorios: true,
    porDefecto: { color: 'azul' },
    partes: [parte('especial-fantasma-sabana', 'arriba', true), parte('especial-fantasma-cabeza', 'cabeza', false)],
  };
  const sombrero: DisfrazCatalogo = {
    ...bruja,
    id: 'especial-sombrerudo',
    nombre: 'Sombrerudo',
    ocultaCabeza: true,
    partes: [parte('especial-sombrerudo-traje', 'arriba', true), parte('especial-sombrerudo-sombrero', 'cabeza', false)],
  };
  const patineta: MovilidadCatalogo = {
    id: 'movilidad-patineta',
    nombre: 'Patineta',
    slots: ['accA'],
    porDefecto: 'rojo',
    elevacion: [3, 3, 3, 3, 3, 0, 3, 0],
    cuadroCuerpo: [0, 0, 0, 0, 0, 5, 0, 5],
    etiquetas: [],
    partes: [parte('movilidad-patineta-tabla', 'atras', true), parte('movilidad-patineta-borde', 'delante', true)],
  };
  const silla: MovilidadCatalogo = {
    id: 'movilidad-silla',
    nombre: 'Silla',
    slots: ['accA'],
    porDefecto: 'azul',
    elevacion: [0, 0, 0, 0, 0, 0, 0, 0],
    cuadroCuerpo: [5, 5, 5, 5, 5, 5, 5, 5],
    etiquetas: [],
    partes: [parte('movilidad-silla-armazon', 'atras', true), parte('movilidad-silla-rueda', 'delante', true)],
  };
  return {
    version: 1,
    archivo: 'personajes-prueba.png',
    huella: 'abc',
    ancho: 10,
    alto: 10,
    frames: {},
    marcadores: { piel: [], cabello: [], ropaA: [], ropaB: [], pantalon: [], zapatos: [], accA: [], accB: [] },
    pieles: [{ id: 'piel-1', nombre: 'Tono 1', rampa: rampa(1) }],
    pelos: [{ id: 'pelo-negro', nombre: 'Negro', rampa: rampa(2) }],
    colores: [
      { id: 'rojo', nombre: 'Rojo', rampa: rampa(3) },
      { id: 'azul', nombre: 'Azul', rampa: rampa(4) },
      { id: 'verde', nombre: 'Verde', rampa: rampa(5) },
    ],
    cuerpos: [parte('cuerpo-a', 'cuerpo', true)],
    peinados: [parte('peinado-corto', 'pelo', false)],
    arriba: [parte('arriba-camiseta', 'arriba', true)],
    abajo: [parte('abajo-pantalon', 'abajo', true)],
    zapatos: [parte('zapatos-tenis', 'zapatos', true)],
    accesorios: [
      parte('acc-gorra', 'cabeza', false, { carpeta: 'sombrero' }),
      parte('acc-gafas', 'cara', false, { carpeta: 'gafas' }),
      parte('acc-mochila', 'cuello', false, { carpeta: 'otro' }),
    ],
    especiales: [bruja, fantasma, sombrero],
    movilidad: [patineta, silla],
  };
}

const base = (extra: Partial<AvatarSpec> = {}): AvatarSpec => ({
  v: 1,
  cuerpo: 'cuerpo-a',
  piel: 'piel-1',
  peinado: 'peinado-corto',
  pelo: 'pelo-negro',
  arriba: 'arriba-camiseta',
  colorArriba: 'rojo',
  colorArriba2: 'verde',
  abajo: 'abajo-pantalon',
  colorAbajo: 'azul',
  zapatos: 'zapatos-tenis',
  colorZapatos: 'rojo',
  accesorios: [],
  ...extra,
});

const partesDe = (spec: AvatarSpec, cat: CatalogoPersonaje, dir = 'S' as const, cuadro: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 = 0): string[] => planDeAvatar(spec, cat, dir, cuadro).map((c) => c.parte);

// ---------------------------------------------------------------------------

describe('contrato de personajes v5', () => {
  it('el rebote es el del personaje v5: la cabeza sube 1 en los pasos A y B, y no se mueve sentada ni al parpadear, en las 4 direcciones', () => {
    for (const d of ['S', 'N', 'E', 'O'] as const) expect([0, 1, 2, 3, 4, 5, 6, 7].map((c) => reboteDe(d, c)), d).toEqual([0, 0, -1, 0, -1, 0, 0, 0]);
  });

  it('la capa chaqueta va sobre arriba y debajo del cuello y de la barba', () => {
    const i = (c: CapaPersonaje): number => CAPAS_PERSONAJE.indexOf(c);
    expect(i('chaqueta')).toBeGreaterThan(i('arriba'));
    expect(i('chaqueta')).toBeLessThan(i('cuello'));
    expect(i('chaqueta')).toBeLessThan(i('barba'));
  });

  it('el editor tiene las 11 categorías de Gather en su orden y «Mascota» al final', () => {
    expect(CATEGORIAS_EDITOR.map((c) => c.nombre)).toEqual(['Piel', 'Cabello', 'Vello facial', 'Arriba', 'Chaqueta', 'Abajo', 'Zapatos', 'Sombrero', 'Gafas', 'Otro', 'Disfraz', 'Mascota']);
  });

  it('las capas incluyen atras (detrás del cuerpo) y delante (por encima de todo)', () => {
    expect(CAPAS_PERSONAJE[0]).toBe('sombra');
    expect(CAPAS_PERSONAJE.indexOf('atras')).toBe(1);
    expect(CAPAS_PERSONAJE.indexOf('atras')).toBeLessThan(CAPAS_PERSONAJE.indexOf('cuerpo'));
    expect(CAPAS_PERSONAJE[CAPAS_PERSONAJE.length - 1]).toBe('delante');
  });

  it('la capa barba va sobre el cuello y debajo del pelo, de la cara y de la cabeza', () => {
    const i = (c: CapaPersonaje): number => CAPAS_PERSONAJE.indexOf(c);
    expect(i('barba')).toBeGreaterThan(i('cuello'));
    expect(i('barba')).toBeLessThan(i('pelo'));
    expect(i('barba')).toBeLessThan(i('cara'));
    expect(i('barba')).toBeLessThan(i('cabeza'));
  });

  it('las subcarpetas de accesorios son sombrero, gafas y otro', () => {
    expect(CARPETAS_ACCESORIO.map((c) => c.id)).toEqual(['sombrero', 'gafas', 'otro']);
  });

  it('las colecciones de los disfraces son las de COLECCIONES', () => {
    expect(COLECCIONES.map((c) => c.id)).toEqual(['halloween', 'navidad', 'amor-amistad', 'ano-nuevo', 'colombia', 'pascua', 'cumpleanos']);
  });
});

describe('planDeAvatar: compatibilidad con la v1', () => {
  it('un avatar sin disfraz ni movilidad arma lo mismo con el catálogo v2 y con uno sin `especiales` ni `movilidad`', () => {
    const cat = catalogoMinimo();
    const v1 = { ...cat } as Partial<CatalogoPersonaje>;
    delete v1.especiales;
    delete v1.movilidad;
    const spec = base({ accesorios: [{ id: 'acc-gorra', color: 'rojo', color2: 'azul' }] });
    for (const dir of DIRECCIONES_PERSONAJE) {
      for (const cuadro of [0, 1, 2, 3, 4, 5] as const) {
        expect(planDeAvatar(spec, v1 as CatalogoPersonaje, dir, cuadro)).toEqual(planDeAvatar(spec, cat, dir, cuadro));
      }
    }
  });

  it('el orden de las capas y el rebote de un avatar de la v1 no cambian', () => {
    const cat = catalogoMinimo();
    const plan = planDeAvatar(base(), cat, 'S', 5);
    expect(plan.map((c) => c.capa)).toEqual(['cuerpo', 'zapatos', 'abajo', 'arriba', 'pelo']);
    // El pelo es estático: baja REBOTE[5] (0, la cabeza no se mueve sentada). Las demás partes traen el cuadro sentado dibujado.
    expect(plan.map((c) => c.dy)).toEqual([0, 0, 0, 0, REBOTE[5]]);
    expect(plan[0]?.frame).toBe('cuerpo-a@S5');
  });

  it('un catálogo de la v1 ignora los avatares con disfraz o movilidad que no conoce (no se rompe)', () => {
    const cat = catalogoMinimo();
    const v1 = { ...cat } as Partial<CatalogoPersonaje>;
    delete v1.especiales;
    delete v1.movilidad;
    const spec = base({ especial: { id: 'especial-prueba' }, movilidad: { id: 'movilidad-patineta' } });
    expect(() => planDeAvatar(spec, v1 as CatalogoPersonaje, 'S', 0)).not.toThrow();
    expect(partesDe(spec, v1 as CatalogoPersonaje)).toContain('arriba-camiseta');
    expect(validarAvatar(spec, v1 as CatalogoPersonaje)).not.toBeNull();
  });

  it('la llave de un avatar de la v1 no cambia (no suma nada si no hay disfraz ni movilidad)', () => {
    const spec = base({ accesorios: [{ id: 'acc-gorra', color: 'rojo' }] });
    expect(claveAvatar(spec)).toBe('cuerpo-a|piel-1|peinado-corto|pelo-negro|arriba-camiseta|rojo|verde|abajo-pantalon|azul|zapatos-tenis|rojo|acc-gorra:rojo:');
  });
});

describe('planDeAvatar: disfraces', () => {
  const cat = catalogoMinimo();

  it('un disfraz reemplaza la prenda de arriba, la de abajo y los zapatos', () => {
    const partes = partesDe(base({ especial: { id: 'especial-prueba' } }), cat);
    expect(partes).not.toContain('arriba-camiseta');
    expect(partes).not.toContain('abajo-pantalon');
    expect(partes).not.toContain('zapatos-tenis');
    expect(partes).toEqual(expect.arrayContaining(['cuerpo-a', 'especial-prueba-traje', 'especial-prueba-capa', 'especial-prueba-gorro', 'peinado-corto']));
  });

  it('las partes del disfraz van en su capa: la capa detrás del cuerpo y el gorro encima del pelo', () => {
    const plan = planDeAvatar(base({ especial: { id: 'especial-prueba' } }), cat, 'S', 0);
    const orden = plan.map((c) => c.parte);
    expect(orden.indexOf('especial-prueba-capa')).toBeLessThan(orden.indexOf('cuerpo-a'));
    expect(orden.indexOf('especial-prueba-traje')).toBeGreaterThan(orden.indexOf('cuerpo-a'));
    expect(orden.indexOf('especial-prueba-gorro')).toBeGreaterThan(orden.indexOf('peinado-corto'));
    const capas = plan.map((c) => CAPAS_PERSONAJE.indexOf(c.capa));
    expect([...capas].sort((a, b) => a - b)).toEqual(capas);
  });

  it('el disfraz usa sus colores por defecto y las rampas elegidas cuando las hay', () => {
    const sin = planDeAvatar(base({ especial: { id: 'especial-prueba' } }), cat, 'S', 0).find((c) => c.parte === 'especial-prueba-traje');
    expect(sin?.rampas.ropaA).toEqual(cat.colores[0]?.rampa);
    expect(sin?.rampas.ropaB).toEqual(cat.colores[1]?.rampa);
    expect(sin?.rampas.piel).toEqual(cat.pieles[0]?.rampa);
    const con = planDeAvatar(base({ especial: { id: 'especial-prueba', color: 'verde', color2: 'rojo' } }), cat, 'S', 0).find((c) => c.parte === 'especial-prueba-traje');
    expect(con?.rampas.ropaA).toEqual(cat.colores[2]?.rampa);
    expect(con?.rampas.ropaB).toEqual(cat.colores[0]?.rampa);
  });

  it('sin segundo color, el segundo color es el primero que se eligió (o el del disfraz)', () => {
    const solo = planDeAvatar(base({ especial: { id: 'especial-fantasma', color: 'verde' } }), cat, 'S', 0).find((c) => c.parte === 'especial-fantasma-sabana');
    expect(solo?.rampas.ropaB).toEqual(cat.colores[2]?.rampa);
    const porDefecto = planDeAvatar(base({ especial: { id: 'especial-fantasma' } }), cat, 'S', 0).find((c) => c.parte === 'especial-fantasma-sabana');
    expect(porDefecto?.rampas.ropaB).toEqual(cat.colores[1]?.rampa);
  });

  it('ocultaPelo quita el peinado y ocultaAccesorios quita todos los accesorios', () => {
    const accesorios = [
      { id: 'acc-gorra', color: 'rojo' },
      { id: 'acc-gafas', color: 'azul' },
    ];
    const normal = partesDe(base({ especial: { id: 'especial-prueba' }, accesorios }), cat);
    expect(normal).toEqual(expect.arrayContaining(['peinado-corto', 'acc-gorra', 'acc-gafas']));
    const oculto = partesDe(base({ especial: { id: 'especial-fantasma' }, accesorios }), cat);
    expect(oculto).not.toContain('peinado-corto');
    expect(oculto).not.toContain('acc-gorra');
    expect(oculto).not.toContain('acc-gafas');
  });

  it('ocultaCabeza quita solo los accesorios de la capa cabeza', () => {
    const accesorios = [
      { id: 'acc-gorra', color: 'rojo' },
      { id: 'acc-gafas', color: 'azul' },
      { id: 'acc-mochila', color: 'verde' },
    ];
    const partes = partesDe(base({ especial: { id: 'especial-sombrerudo' }, accesorios }), cat);
    expect(partes).not.toContain('acc-gorra');
    expect(partes).toEqual(expect.arrayContaining(['acc-gafas', 'acc-mochila', 'peinado-corto']));
  });

  it('un id de disfraz que no existe se ignora al armar y se rechaza al validar', () => {
    const spec = base({ especial: { id: 'especial-no-existe' } });
    expect(partesDe(spec, cat)).toContain('arriba-camiseta');
    expect(validarAvatar(spec, cat)).toMatch(/disfraz/);
  });

  it('las partes estáticas del disfraz bajan REBOTE como el pelo y las animadas traen su cuadro', () => {
    for (const cuadro of [0, 1, 2, 3, 4, 5] as const) {
      const plan = planDeAvatar(base({ especial: { id: 'especial-prueba' } }), cat, 'E', cuadro);
      const gorro = plan.find((c) => c.parte === 'especial-prueba-gorro');
      const traje = plan.find((c) => c.parte === 'especial-prueba-traje');
      expect(gorro?.dy).toBe(REBOTE[cuadro]);
      expect(gorro?.frame).toBe('especial-prueba-gorro@E0');
      expect(traje?.dy).toBe(0);
      expect(traje?.frame).toBe(`especial-prueba-traje@E${cuadro}`);
    }
  });

  it('disfrazDe devuelve el disfraz del avatar o undefined', () => {
    expect(disfrazDe(base(), cat)).toBeUndefined();
    expect(disfrazDe(base({ especial: { id: 'especial-fantasma' } }), cat)?.id).toBe('especial-fantasma');
    expect(disfrazDe(base({ especial: { id: 'x' } }), cat)).toBeUndefined();
  });
});

describe('planDeAvatar: movilidad', () => {
  const cat = catalogoMinimo();

  it('la patineta sube al personaje 3 píxeles y lo deja en el cuadro quieto mientras camina', () => {
    const spec = base({ movilidad: { id: 'movilidad-patineta' } });
    for (const cuadro of [0, 1, 2, 3, 4] as const) {
      const plan = planDeAvatar(spec, cat, 'S', cuadro);
      const cuerpo = plan.find((c) => c.parte === 'cuerpo-a');
      expect(cuerpo?.frame, `cuadro ${cuadro}`).toBe('cuerpo-a@S0');
      expect(cuerpo?.dy).toBe(-3);
      const pelo = plan.find((c) => c.parte === 'peinado-corto');
      expect(pelo?.dy).toBe(-3 + (REBOTE[0] ?? 0));
      const tabla = plan.find((c) => c.parte === 'movilidad-patineta-tabla');
      expect(tabla?.frame).toBe(`movilidad-patineta-tabla@S${cuadro}`);
      expect(tabla?.dy).toBe(0);
    }
  });

  it('sentado, la patineta no sube al personaje y el cuerpo usa el cuadro sentado', () => {
    const plan = planDeAvatar(base({ movilidad: { id: 'movilidad-patineta' } }), cat, 'E', 5);
    expect(plan.find((c) => c.parte === 'cuerpo-a')?.frame).toBe('cuerpo-a@E5');
    expect(plan.find((c) => c.parte === 'cuerpo-a')?.dy).toBe(0);
    expect(plan.find((c) => c.parte === 'movilidad-patineta-tabla')?.frame).toBe('movilidad-patineta-tabla@E5');
  });

  it('la silla de ruedas deja al personaje siempre sentado (cuadro 5) y sus ruedas siguen el cuadro pedido', () => {
    const spec = base({ movilidad: { id: 'movilidad-silla' }, arriba: 'arriba-camiseta' });
    for (const cuadro of [0, 1, 2, 3, 4, 5] as const) {
      const plan = planDeAvatar(spec, cat, 'S', cuadro);
      expect(plan.find((c) => c.parte === 'cuerpo-a')?.frame).toBe('cuerpo-a@S5');
      expect(plan.find((c) => c.parte === 'arriba-camiseta')?.frame).toBe('arriba-camiseta@S5');
      expect(plan.find((c) => c.parte === 'zapatos-tenis')?.frame).toBe('zapatos-tenis@S5');
      expect(plan.find((c) => c.parte === 'peinado-corto')?.dy).toBe(REBOTE[5]);
      expect(plan.find((c) => c.parte === 'movilidad-silla-rueda')?.frame).toBe(`movilidad-silla-rueda@S${cuadro}`);
    }
  });

  it('las partes de la movilidad van detrás del cuerpo (atras) y por encima de todo (delante)', () => {
    const plan = planDeAvatar(base({ movilidad: { id: 'movilidad-silla' }, accesorios: [{ id: 'acc-gorra', color: 'rojo' }] }), cat, 'S', 0);
    const orden = plan.map((c) => c.parte);
    expect(orden[0]).toBe('movilidad-silla-armazon');
    expect(orden[orden.length - 1]).toBe('movilidad-silla-rueda');
    expect(orden.indexOf('movilidad-silla-armazon')).toBeLessThan(orden.indexOf('cuerpo-a'));
  });

  it('el color de la movilidad es accA y accB, el elegido o el del catálogo', () => {
    const por = planDeAvatar(base({ movilidad: { id: 'movilidad-silla' } }), cat, 'S', 0)[0];
    expect(por?.rampas.accA).toEqual(cat.colores[1]?.rampa);
    const elegido = planDeAvatar(base({ movilidad: { id: 'movilidad-silla', color: 'verde' } }), cat, 'S', 0)[0];
    expect(elegido?.rampas.accA).toEqual(cat.colores[2]?.rampa);
    expect(elegido?.rampas.accB).toEqual(cat.colores[2]?.rampa);
  });

  it('un disfraz con movilidad suben juntos: el traje y la cabeza del disfraz suben con el personaje', () => {
    const plan = planDeAvatar(base({ especial: { id: 'especial-prueba' }, movilidad: { id: 'movilidad-patineta' } }), cat, 'S', 0);
    for (const nombre of ['especial-prueba-traje', 'especial-prueba-capa']) expect(plan.find((c) => c.parte === nombre)?.dy).toBe(-3);
    expect(plan.find((c) => c.parte === 'especial-prueba-gorro')?.dy).toBe(-3);
  });

  it('movilidadDe devuelve la ayuda del avatar o undefined', () => {
    expect(movilidadDe(base(), cat)).toBeUndefined();
    expect(movilidadDe(base({ movilidad: { id: 'movilidad-silla' } }), cat)?.id).toBe('movilidad-silla');
  });
});

describe('validarAvatar y claveAvatar con disfraz y movilidad', () => {
  const cat = catalogoMinimo();

  it('acepta un avatar completo con disfraz y movilidad', () => {
    const spec = base({ especial: { id: 'especial-prueba', color: 'verde', color2: 'rojo' }, movilidad: { id: 'movilidad-patineta', color: 'azul' } });
    expect(validarAvatar(spec, cat)).toBeNull();
  });

  it('rechaza ids inexistentes de disfraz, de movilidad y de sus colores', () => {
    expect(validarAvatar(base({ especial: { id: 'no-existe' } }), cat)).toMatch(/disfraz/);
    expect(validarAvatar(base({ especial: { id: 'especial-prueba', color: 'no-existe' } }), cat)).toMatch(/color del disfraz/);
    expect(validarAvatar(base({ especial: { id: 'especial-prueba', color2: 'no-existe' } }), cat)).toMatch(/segundo color del disfraz/);
    expect(validarAvatar(base({ movilidad: { id: 'no-existe' } }), cat)).toMatch(/movilidad/);
    expect(validarAvatar(base({ movilidad: { id: 'movilidad-silla', color: 'no-existe' } }), cat)).toMatch(/color de la movilidad/);
  });

  it('un disfraz no se confunde con un accesorio ni con una prenda: los ids son de su lista', () => {
    expect(validarAvatar(base({ especial: { id: 'acc-gorra' } }), cat)).toMatch(/disfraz/);
    expect(validarAvatar(base({ movilidad: { id: 'especial-prueba' } }), cat)).toMatch(/movilidad/);
  });

  it('las demás reglas de la v1 siguen igual', () => {
    expect(validarAvatar(base({ cuerpo: 'x' }), cat)).toMatch(/cuerpo/);
    expect(validarAvatar({ ...base(), v: 2 as unknown as 1 }, cat)).toMatch(/versión/);
    const muchos = Array.from({ length: MAX_ACCESORIOS + 1 }, (_, i) => ({ id: `acc-${i}`, color: 'rojo' }));
    expect(validarAvatar(base({ accesorios: muchos }), cat)).toMatch(/Máximo/);
  });

  it('la llave cambia con el disfraz, con sus colores, con la movilidad y con su color', () => {
    const k0 = claveAvatar(base());
    const ke = claveAvatar(base({ especial: { id: 'especial-prueba' } }));
    const kec = claveAvatar(base({ especial: { id: 'especial-prueba', color: 'verde' } }));
    const kec2 = claveAvatar(base({ especial: { id: 'especial-prueba', color: 'verde', color2: 'azul' } }));
    const km = claveAvatar(base({ movilidad: { id: 'movilidad-silla' } }));
    const kmc = claveAvatar(base({ movilidad: { id: 'movilidad-silla', color: 'verde' } }));
    const todas = [k0, ke, kec, kec2, km, kmc];
    expect(new Set(todas).size).toBe(todas.length);
    expect(claveAvatar(base({ especial: { id: 'especial-prueba' } }))).toBe(ke);
  });
});

describe('avatarAlAzar con el catálogo v2', () => {
  const cat = catalogoMinimo();

  it('nunca elige disfraz ni movilidad y siempre produce avatares válidos (500 semillas)', () => {
    for (let semilla = 1; semilla <= 500; semilla++) {
      const spec = avatarAlAzar(cat, semilla);
      expect(spec.especial, `semilla ${semilla}`).toBeUndefined();
      expect(spec.movilidad, `semilla ${semilla}`).toBeUndefined();
      expect(validarAvatar(spec, cat), `semilla ${semilla}`).toBeNull();
    }
  });

  it('es determinista', () => {
    expect(avatarAlAzar(cat, 42)).toEqual(avatarAlAzar(cat, 42));
  });
});

// ---------------------------------------------------------------------------
// Chaqueta, sombreros que tapan el pelo, azar y migración
// ---------------------------------------------------------------------------

describe('planDeAvatar: chaqueta', () => {
  const cat = { ...catalogoMinimo(), chaquetas: [parte('chaqueta-blazer', 'chaqueta', true)] };

  it('va sobre la prenda de arriba y con su propio color', () => {
    const plan = planDeAvatar(base({ chaqueta: { id: 'chaqueta-blazer', color: 'azul' } }), cat, 'S', 0);
    const partes = plan.map((c) => c.parte);
    expect(partes.indexOf('chaqueta-blazer')).toBeGreaterThan(partes.indexOf('arriba-camiseta'));
    const ch = plan.find((c) => c.parte === 'chaqueta-blazer');
    expect(ch?.rampas.ropaA).toEqual(cat.colores.find((c) => c.id === 'azul')?.rampa);
    expect(plan.find((c) => c.parte === 'arriba-camiseta')?.rampas.ropaA).toEqual(cat.colores.find((c) => c.id === 'rojo')?.rampa);
  });

  it('se valida, cambia la llave y un disfraz la reemplaza', () => {
    const spec = base({ chaqueta: { id: 'chaqueta-blazer', color: 'azul' } });
    expect(validarAvatar(spec, cat)).toBeNull();
    expect(validarAvatar({ ...spec, chaqueta: { id: 'no-existe', color: 'azul' } }, cat)).not.toBeNull();
    expect(validarAvatar({ ...spec, chaqueta: { id: 'chaqueta-blazer', color: 'no-existe' } }, cat)).not.toBeNull();
    expect(claveAvatar(spec)).not.toBe(claveAvatar(base()));
    expect(partesDe({ ...spec, especial: { id: 'especial-prueba' } }, cat)).not.toContain('chaqueta-blazer');
  });
});

describe('planDeAvatar: sombrero que tapa el peinado', () => {
  const cat = catalogoMinimo();
  const conGorro = { ...cat, accesorios: cat.accesorios.map((a) => (a.id === 'acc-gorra' ? { ...a, ocultaPeloSobre: 19 } : a)) };

  it('el peinado lleva filaMin cuando el sombrero lo pide, y solo entonces', () => {
    const con = planDeAvatar(base({ accesorios: [{ id: 'acc-gorra', color: 'rojo' }] }), conGorro, 'S', 0).find((c) => c.capa === 'pelo');
    expect(con?.filaMin).toBe(19);
    const sin = planDeAvatar(base(), conGorro, 'S', 0).find((c) => c.capa === 'pelo');
    expect(sin?.filaMin).toBeUndefined();
    const otro = planDeAvatar(base({ accesorios: [{ id: 'acc-gafas', color: 'rojo' }] }), conGorro, 'S', 0).find((c) => c.capa === 'pelo');
    expect(otro?.filaMin).toBeUndefined();
  });
});

describe('avatarAlAzar', () => {
  const cat = { ...catalogoMinimo(), chaquetas: [parte('chaqueta-blazer', 'chaqueta', true)] };

  it('siempre produce avatares válidos, sin disfraz ni movilidad, y es determinista (500 semillas)', () => {
    for (let semilla = 1; semilla <= 500; semilla++) {
      const spec = avatarAlAzar(cat, semilla);
      expect(validarAvatar(spec, cat), `semilla ${semilla}`).toBeNull();
      expect(spec.especial).toBeUndefined();
      expect(spec.movilidad).toBeUndefined();
      expect(avatarAlAzar(cat, semilla)).toEqual(spec);
    }
  });

  it('elige a lo sumo un accesorio por carpeta y a veces una chaqueta', () => {
    let conChaqueta = 0;
    for (let semilla = 1; semilla <= 300; semilla++) {
      const spec = avatarAlAzar(cat, semilla);
      const carpetas = spec.accesorios.map((a) => cat.accesorios.find((p) => p.id === a.id)?.carpeta);
      expect(new Set(carpetas).size).toBe(carpetas.length);
      if (spec.chaqueta) conChaqueta++;
    }
    expect(conChaqueta).toBeGreaterThan(50);
    expect(conChaqueta).toBeLessThan(200);
  });
});

// ---------------------------------------------------------------------------
// El catálogo publicado (shared/src/catalogo/personajes-v5.json)
// ---------------------------------------------------------------------------

const publicado = catalogoPublicado as unknown as CatalogoPersonaje;
const todasLasPartes = (c: CatalogoPersonaje): ParteCatalogo[] => [
  ...c.cuerpos,
  ...c.peinados,
  ...(c.barbas ?? []),
  ...c.arriba,
  ...(c.chaquetas ?? []),
  ...c.abajo,
  ...c.zapatos,
  ...c.accesorios,
  ...c.especiales.flatMap((e) => e.partes),
  ...c.movilidad.flatMap((m) => m.partes),
];

describe('catálogo publicado personajes-v5', () => {
  const cat = publicado;

  it('trae los conteos del corte vertical y las paletas de Gather', () => {
    expect(cat.pieles).toHaveLength(5);
    expect(cat.cuerpos).toHaveLength(5);
    expect(cat.pelos).toHaveLength(12);
    expect(cat.colores).toHaveLength(16);
    expect(cat.peinados.length).toBeGreaterThanOrEqual(12);
    expect(cat.barbas?.length).toBeGreaterThanOrEqual(2);
    expect(cat.arriba.length).toBeGreaterThanOrEqual(4);
    expect(cat.chaquetas?.length).toBeGreaterThanOrEqual(3);
    expect(cat.abajo.length).toBeGreaterThanOrEqual(3);
    expect(cat.zapatos.length).toBeGreaterThanOrEqual(3);
    for (const c of CARPETAS_ACCESORIO) expect(cat.accesorios.filter((a) => a.carpeta === c.id).length, c.id).toBeGreaterThanOrEqual(3);
    expect(cat.especiales.length).toBeGreaterThanOrEqual(1);
  });

  it('los ids son únicos y todos los cuadros prometidos existen en el atlas, de 32x64', () => {
    const ids = todasLasPartes(cat).map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const parte of todasLasPartes(cat)) {
      const direcciones = Object.keys(parte.frames);
      expect(direcciones.length, parte.id).toBeGreaterThanOrEqual(3);
      for (const dir of direcciones) {
        const lista = parte.frames[dir as 'S'] ?? [];
        expect([1, 6, 8], `${parte.id} ${dir}`).toContain(lista.length);
        for (const id of lista) {
          const m = cat.frames[id];
          expect(m, id).toBeDefined();
          expect([m?.w, m?.h], id).toEqual([32, 64]);
        }
      }
    }
  });

  it('una cuenta guardada con ids de la v4 se migra a la v5: ids que siguen, equivalentes cercanos y nada roto', () => {
    const v4 = {
      v: 1, cuerpo: 'cara-pecas', piel: 'piel-3', peinado: 'peinado-hoja-05', pelo: 'pelo-rojizo', arriba: 'arriba-rayas', colorArriba: 'verde', colorArriba2: 'amarillo',
      abajo: 'abajo-short-deportivo', colorAbajo: 'gris', zapatos: 'zapatos-mocasines', colorZapatos: 'negro',
      accesorios: [{ id: 'acc-orejas-gato', color: 'rosa' }, { id: 'acc-gorra', color: 'rojo' }, { id: 'acc-lectura', color: 'negro' }, { id: 'acc-collar', color: 'rojo' }],
      chaqueta: { id: 'chaqueta-capa-corta', color: 'azul-violeta' }, barba: { id: 'barba-larga', color: 'pelo-rojizo' },
    } as unknown as AvatarSpec;
    expect(validarAvatar(v4, cat)).not.toBeNull();
    const nueva = migrarAvatar(v4, cat, 7);
    expect(validarAvatar(nueva, cat)).toBeNull();
    expect([nueva.cuerpo, nueva.piel, nueva.pelo, nueva.arriba, nueva.abajo, nueva.zapatos]).toEqual(['cara-pecas', 'piel-3', 'pelo-rojizo', 'arriba-camiseta', 'abajo-corto', 'zapatos-formales']);
    expect(nueva.chaqueta?.id).toBe('chaqueta-chaleco');
    expect(nueva.barba?.id).toBe('barba-completa');
    // una sola pieza por carpeta: de los dos sombreros que caían en el mismo lugar gana el primero, y lo que no existe se quita
    expect(nueva.accesorios.map((a) => a.id)).toEqual(['acc-gorro-lana', 'acc-gafas-redondas']);
  });

  it('cada avatar al azar (200 semillas) se valida y se arma en las 4 direcciones y los 8 cuadros con cuadros que existen', () => {
    for (let semilla = 1; semilla <= 200; semilla++) {
      const spec = avatarAlAzar(cat, semilla);
      expect(validarAvatar(spec, cat), `semilla ${semilla}`).toBeNull();
      for (const dir of DIRECCIONES_PERSONAJE) {
        for (const cuadro of [0, 1, 2, 3, 4, 5, 6, 7] as const) {
          const plan = planDeAvatar(spec, cat, dir, cuadro);
          expect(plan.length).toBeGreaterThanOrEqual(4);
          for (const c of plan) expect(cat.frames[c.frame], c.frame).toBeDefined();
        }
      }
    }
  });

  it('los sombreros dicen desde qué fila tapan el peinado', () => {
    for (const a of cat.accesorios.filter((p) => p.carpeta === 'sombrero')) if (a.ocultaPeloSobre !== undefined) expect(a.ocultaPeloSobre, a.id).toBeGreaterThan(14);
  });

  it('las capas de cada categoría son las del contrato', () => {
    expect(new Set(cat.peinados.map((p) => p.capa))).toEqual(new Set(['pelo']));
    expect(new Set((cat.barbas ?? []).map((p) => p.capa))).toEqual(new Set(['barba']));
    expect(new Set(cat.arriba.map((p) => p.capa))).toEqual(new Set(['arriba']));
    expect(new Set((cat.chaquetas ?? []).map((p) => p.capa))).toEqual(new Set(['chaqueta']));
    expect(new Set(cat.abajo.map((p) => p.capa))).toEqual(new Set(['abajo']));
    expect(new Set(cat.zapatos.map((p) => p.capa))).toEqual(new Set(['zapatos']));
  });
});

describe('migrarAvatar', () => {
  const cat = publicado;
  const viejo: AvatarSpec = {
    v: 1,
    cuerpo: 'cuerpo-b',
    piel: 'piel-7',
    peinado: 'peinado-bob-flequillo',
    pelo: 'pelo-pelirrojo',
    arriba: 'arriba-blazer',
    colorArriba: 'rojo-coral',
    colorArriba2: 'blanco',
    abajo: 'abajo-jean',
    colorAbajo: 'azul-marino',
    zapatos: 'zapatos-sandalias',
    colorZapatos: 'negro',
    accesorios: [
      { id: 'acc-gorro-lana', color: 'verde' },
      { id: 'acc-alas-angel', color: 'blanco' },
    ],
    movilidad: { id: 'movilidad-patineta' },
    especial: { id: 'especial-pirata' },
  };

  it('un personaje del catálogo anterior cae a uno válido, conserva lo equivalente y quita lo que ya no existe', () => {
    const r = migrarAvatar(viejo, cat, 5);
    expect(validarAvatar(r, cat)).toBeNull();
    expect(r.peinado).toBe('peinado-flequillo');
    expect(r.pelo).toBe('pelo-rojizo');
    expect(r.colorArriba).toBe('rojo');
    expect(r.chaqueta?.id).toBe('chaqueta-blazer');
    expect(r.accesorios.map((a) => a.id)).toEqual(['acc-gorro-lana']);
    expect(r.movilidad).toBeUndefined();
    expect(r.especial).toBeUndefined();
  });

  it('es determinista y deja igual a un avatar que ya es válido', () => {
    expect(migrarAvatar(viejo, cat, 5)).toEqual(migrarAvatar(viejo, cat, 5));
    const bueno = avatarAlAzar(cat, 9);
    expect(migrarAvatar(bueno, cat, 1)).toBe(bueno);
  });

  it('un avatar vacío o roto cae a avatarAlAzar', () => {
    expect(migrarAvatar(null, cat, 3)).toEqual(avatarAlAzar(cat, 3));
    expect(validarAvatar(migrarAvatar({ ...viejo, v: 2 as 1 }, cat, 3), cat)).toBeNull();
    expect(validarAvatar(migrarAvatar({ ...viejo, cuerpo: 'x', peinado: 'y', arriba: 'z', abajo: 'w', zapatos: 'v' }, cat, 8), cat)).toBeNull();
  });
});
