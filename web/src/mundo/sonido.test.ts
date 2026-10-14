import { CASILLA, CICLO_CAMINAR } from '@ol/shared';
import { describe, expect, it } from 'vitest';
import { cuadroDeCaminar, PX_POR_CUADRO } from './pasos';
import {
  AJUSTES_POR_DEFECTO,
  AlmacenAjustesSonido,
  CATEGORIA_DE_EFECTO,
  CadenciaPasos,
  CLAVE_AJUSTES_SONIDO,
  LimiteVoces,
  RADIO_OIDO,
  gananciaDe,
  leerAjustesSonido,
  materialDePiso,
  panoramaEstereo,
  puedeSonar,
  sonidoDeOtro,
  volumenPorDistancia,
  type Efecto,
} from './sonido';


const memoria = (inicial: Record<string, string> = {}) => {
  const d = { ...inicial };
  return { d, getItem: (k: string) => d[k] ?? null, setItem: (k: string, v: string) => void (d[k] = v) };
};

describe('pasos: un sonido por cuadro de contacto del ciclo de 4 cuadros', () => {
  it('en un ciclo completo suenan 2 pasos, en los cuadros de contacto, alternando las variantes', () => {
    const c = new CadenciaPasos(() => 0.5);
    const vistos: (number | null)[] = [];
    for (let i = 0; i < 8; i++) vistos.push(c.cuadro(CICLO_CAMINAR[i % 4] as number, true)?.variante ?? null);
    // Cuadros del ciclo: contacto A, paso A, contacto B, paso B (dos vueltas).
    expect(vistos).toEqual([0, null, 1, null, 0, null, 1, null]);
  });

  it('la cadencia sigue la distancia recorrida: 8 pasos por segundo de cuadro, 4 pasos por segundo de pie, a la velocidad normal', () => {
    const c = new CadenciaPasos(() => 0.5);
    let pasos = 0;
    let recorrido = 0;
    // Un segundo a velocidad normal = 8 cuadros = 2 ciclos = 4 contactos.
    for (let i = 0; i < 8 * PX_POR_CUADRO; i += 1) {
      recorrido += 1;
      if (c.cuadro(cuadroDeCaminar(recorrido), true)) pasos++;
    }
    expect(pasos).toBeGreaterThanOrEqual(3);
    expect(pasos).toBeLessThanOrEqual(5);
  });

  it('quieto o sentado no suena, y un mismo cuadro no suena dos veces', () => {
    const c = new CadenciaPasos(() => 0.5);
    expect(c.cuadro(0, false)).toBeNull();
    expect(c.cuadro(CICLO_CAMINAR[0] as number, true)).not.toBeNull();
    expect(c.cuadro(CICLO_CAMINAR[0] as number, true)).toBeNull();
    expect(c.cuadro(CICLO_CAMINAR[0] as number, false)).toBeNull();
    // Al volver a caminar en un contacto, suena de nuevo.
    expect(c.cuadro(CICLO_CAMINAR[0] as number, true)).not.toBeNull();
  });

  it('el tono varía al azar un poco (±6 %)', () => {
    expect(new CadenciaPasos(() => 0).cuadro(1, true)?.tono).toBeCloseTo(0.94, 5);
    expect(new CadenciaPasos(() => 1).cuadro(1, true)?.tono).toBeCloseTo(1.06, 5);
  });
});

describe('material de los pasos según el piso', () => {
  it('cada id piso-* cae en su material', () => {
    const casos: [string, string][] = [
      ['piso-madera-clara', 'madera'], ['piso-madera-oscura', 'madera'], ['piso-parquet', 'madera'],
      ['piso-baldosa', 'baldosa'], ['piso-cocina', 'baldosa'], ['piso-baldosa-ajedrez', 'baldosa'], ['piso-losa-rombos', 'baldosa'],
      ['piso-alfombra-gris', 'alfombra'], ['piso-alfombra-roja', 'alfombra'], ['piso-alfombra-lavanda', 'alfombra'],
      ['piso-cemento', 'cemento'], ['piso-deck', 'deck'], ['piso-cesped', 'pasto'],
    ];
    for (const [id, m] of casos) expect(materialDePiso(id), id).toBe(m);
    expect(materialDePiso(undefined)).toBe('baldosa');
    expect(materialDePiso('')).toBe('baldosa');
  });
});

describe('las demás personas: distancia, paneo y límite de voces', () => {
  it('el volumen baja con la distancia y es cero a las 8 casillas', () => {
    expect(RADIO_OIDO).toBe(8 * CASILLA);
    expect(volumenPorDistancia(0)).toBe(1);
    expect(volumenPorDistancia(RADIO_OIDO)).toBe(0);
    expect(volumenPorDistancia(RADIO_OIDO + 50)).toBe(0);
    const v = [1, 2, 4, 6, 7].map((c) => volumenPorDistancia(c * CASILLA));
    for (let i = 1; i < v.length; i++) expect(v[i] as number).toBeLessThan(v[i - 1] as number);
  });

  it('el paneo va de izquierda a derecha según la posición respecto del centro de la cámara', () => {
    expect(panoramaEstereo(0, 300)).toBe(0);
    expect(panoramaEstereo(-300, 300)).toBeLessThan(-0.5);
    expect(panoramaEstereo(300, 300)).toBeGreaterThan(0.5);
    expect(panoramaEstereo(99999, 300)).toBeLessThanOrEqual(1);
    expect(panoramaEstereo(10, 0)).toBe(0);
  });

  it('sonidoDeOtro junta ambas cosas y calla a quien está fuera del alcance', () => {
    const cerca = sonidoDeOtro(200, 100, 100, 100, 400);
    expect(cerca?.pan).toBeGreaterThan(0);
    expect(cerca?.volumen).toBeGreaterThan(0);
    expect(sonidoDeOtro(100 + RADIO_OIDO + 1, 100, 100, 100, 400)).toBeNull();
  });

  it('máximo 4 voces simultáneas de otras personas; se liberan al terminar', () => {
    const l = new LimiteVoces();
    expect([0, 1, 2, 3].map(() => l.pedir(1000, 200))).toEqual([true, true, true, true]);
    expect(l.pedir(1100, 200)).toBe(false);
    expect(l.activas).toBe(4);
    expect(l.pedir(1250, 200)).toBe(true);
  });
});

describe('ajustes del sonido', () => {
  it('por defecto: volumen 50 y los tres interruptores activados', () => {
    expect(AJUSTES_POR_DEFECTO).toEqual({ volumen: 50, pasos: true, asientos: true, avisos: true });
    expect(leerAjustesSonido(memoria())).toEqual(AJUSTES_POR_DEFECTO);
    expect(leerAjustesSonido(null)).toEqual(AJUSTES_POR_DEFECTO);
  });

  it('se guardan en el navegador y se recuperan; lo raro vuelve al valor por defecto', () => {
    const m = memoria();
    const a = new AlmacenAjustesSonido(m);
    let avisos = 0;
    a.suscribir(() => avisos++);
    a.fijar({ volumen: 80, pasos: false });
    expect(avisos).toBe(1);
    expect(JSON.parse(m.d[CLAVE_AJUSTES_SONIDO] as string)).toEqual({ volumen: 80, pasos: false, asientos: true, avisos: true });
    expect(new AlmacenAjustesSonido(m).leer()).toEqual({ volumen: 80, pasos: false, asientos: true, avisos: true });
    a.fijar({ volumen: 500 });
    expect(a.leer().volumen).toBe(100);
    expect(leerAjustesSonido(memoria({ [CLAVE_AJUSTES_SONIDO]: '{no es json' }))).toEqual(AJUSTES_POR_DEFECTO);
    expect(leerAjustesSonido(memoria({ [CLAVE_AJUSTES_SONIDO]: JSON.stringify({ volumen: 'alto', pasos: 3 }) }))).toEqual(AJUSTES_POR_DEFECTO);
  });

  it('cada interruptor silencia solo su categoría y el volumen 0 silencia todo', () => {
    const efectos = Object.keys(CATEGORIA_DE_EFECTO) as Efecto[];
    const sinPasos = { ...AJUSTES_POR_DEFECTO, pasos: false };
    expect(gananciaDe(sinPasos, 'paso')).toBe(0);
    expect(gananciaDe(sinPasos, 'sentar-blando')).toBeGreaterThan(0);
    expect(gananciaDe({ ...AJUSTES_POR_DEFECTO, asientos: false }, 'puerta-abre')).toBe(0);
    expect(gananciaDe({ ...AJUSTES_POR_DEFECTO, avisos: false }, 'reaccion')).toBe(0);
    expect(gananciaDe({ ...AJUSTES_POR_DEFECTO, avisos: false }, 'puerta-cierra')).toBeGreaterThan(0);
    for (const e of efectos) expect(gananciaDe({ ...AJUSTES_POR_DEFECTO, volumen: 0 }, e)).toBe(0);
  });
});

describe('cuándo puede sonar', () => {
  it('no suena con la pestaña oculta, en modo Eficiente ni en la vista esquemática', () => {
    const ok = { paginaVisible: true, rendimiento: 'equilibrado', esquema: false };
    expect(puedeSonar(ok)).toBe(true);
    expect(puedeSonar({ ...ok, rendimiento: 'calidad' })).toBe(true);
    expect(puedeSonar({ ...ok, paginaVisible: false })).toBe(false);
    expect(puedeSonar({ ...ok, rendimiento: 'eficiente' })).toBe(false);
    expect(puedeSonar({ ...ok, esquema: true })).toBe(false);
  });
});
