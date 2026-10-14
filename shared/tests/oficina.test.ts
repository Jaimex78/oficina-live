import { describe, expect, it } from 'vitest';
import {
  CATEGORIAS_OBJETO,
  INVENTARIO,
  INVENTARIO_POR_ID,
  alcanzables,
  alternarLlegada,
  asientosDe,
  asignarPuesto,
  buscarRuta,
  calcularBloqueo,
  cambiarProps,
  cambiarVariante,
  celdasLinea,
  colocar,
  comprimirMapa,
  crearPortal,
  crearZona,
  descomprimirMapa,
  esFallo,
  evaluarColocacion,
  frameDeColocacion,
  girarColocacion,
  hayErrores,
  huellaDe,
  plantillaNaos,
  masCercanoAlcanzable,
  mascaraPared,
  objetoPorId,
  pintarPiso,
  quitar,
  regionDePiso,
  reubicar,
  salaVacia,
  todosLosFrames,
  validarMapa,
  zonaEn,
  type MapaOficina,
  type SalaMapa,
} from '../src';

const piso = (s: SalaMapa, x: number, y: number, w: number, h: number, id = 'piso-madera-clara'): SalaMapa => {
  const r = pintarPiso(
    s,
    Array.from({ length: w * h }, (_, i) => [x + (i % w), y + Math.floor(i / w)] as const),
    id,
  );
  if (esFallo(r)) throw new Error(r.error);
  return r;
};
const poner = (s: SalaMapa, objeto: string, x: number, y: number, extra: { orientacion?: 'N' | 'E' | 'S' | 'O' | 'U'; variante?: string } = {}): SalaMapa => {
  const r = colocar(s, { objeto, x, y, ...extra });
  if (esFallo(r)) throw new Error(`${objeto}: ${r.error}`);
  return r.sala;
};
const sala = () => piso(salaVacia('t', 'Prueba', 20, 14), 0, 0, 20, 14);

describe('inventario', () => {
  it('tiene los objetos de cada lote y ningún id repetido (lote 8 en adelante: un archivo por lote en inventario-lotes)', () => {
    const ids = INVENTARIO.map((o) => o.id);
    expect(new Set(ids).size).toBe(ids.length);
    const deLote = (n: number): number => INVENTARIO.filter((o) => o.lote === n).length;
    // Lotes 1 a 7: los puestos de trabajo y la tecnología que se rehicieron con el molde Gather v2 pasaron al lote 8.
    expect([1, 2, 3, 4, 5, 6, 7].map(deLote)).toEqual([38, 78, 32, 4, 15, 32, 1]);
    expect(deLote(8)).toBeGreaterThanOrEqual(46);
    expect(INVENTARIO.length).toBe(INVENTARIO.filter((o) => o.lote <= 7).length + INVENTARIO.filter((o) => o.lote >= 8).length);
  });

  it('los objetos obsoletos dicen quién los reemplaza y el reemplazo existe', () => {
    const obsoletos = INVENTARIO.filter((o) => o.obsoleto);
    expect(obsoletos.map((o) => o.id).sort()).toEqual(['escritorio-doble', 'escritorio-individual', 'escritorio-largo']);
    for (const o of obsoletos) expect(objetoPorId(o.reemplazadoPor ?? ''), o.id).toBeDefined();
  });

  it('cada objeto pertenece a una categoría conocida y tiene la variante base', () => {
    const categorias = new Set<string>(CATEGORIAS_OBJETO.map((c) => c.id));
    for (const o of INVENTARIO) {
      expect(categorias.has(o.categoria), o.id).toBe(true);
      expect(o.variantes[0]?.id, o.id).toBe('base');
      expect(o.id, o.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it('los frames prometidos no se repiten', () => {
    const frames = todosLosFrames(INVENTARIO);
    expect(new Set(frames).size).toBe(frames.length);
  });

  it('los asientos no bloquean el paso: sofás, puffs y sillas se cruzan caminando', () => {
    let s = piso(salaVacia('t', 'P', 12, 8), 1, 1, 10, 6);
    s = poner(s, 'sofa-3', 4, 3, { orientacion: 'S' });
    s = poner(s, 'puff', 8, 3);
    const b = calcularBloqueo(s);
    for (const a of asientosDe(s)) expect(b[a.y * 12 + a.x], `${a.x},${a.y}`).toBe(0);
  });

  it('los pisos no bloquean y las paredes con autotile tienen 16 máscaras', () => {
    for (const o of INVENTARIO.filter((p) => p.capa === 'piso')) expect(o.bloquea).toHaveLength(0);
    for (const o of INVENTARIO.filter((p) => p.autotile)) expect(Object.keys(o.frames), o.id).toHaveLength(16);
  });

  it('gira la huella con la orientación', () => {
    const l = objetoPorId('escritorio-l')!;
    expect(huellaDe(l, 'S').bloquea).toEqual([[0, 0], [1, 0], [0, 1]]);
    const e = huellaDe(l, 'E');
    expect(e.ancho).toBe(2);
    expect(e.bloquea).toHaveLength(3);
    const mesa = objetoPorId('mesa-reunion-6')!;
    expect(huellaDe(mesa, 'S')).toMatchObject({ ancho: 3, alto: 2 });
    expect(huellaDe(mesa, 'E')).toMatchObject({ ancho: 2, alto: 3 });
  });

  it('los emisores tienen valores razonables', () => {
    for (const o of INVENTARIO.filter((p) => p.emisor)) {
      expect(o.emisor!.color, o.id).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(o.emisor!.radio, o.id).toBeGreaterThan(0);
      expect(o.emisor!.intensidad, o.id).toBeGreaterThan(0);
      expect(o.emisor!.intensidad, o.id).toBeLessThanOrEqual(1);
    }
  });
});

describe('colocar', () => {
  it('coloca un objeto sobre piso', () => {
    const r = colocar(sala(), { objeto: 'silla-oficina', x: 3, y: 3, orientacion: 'S' });
    expect(esFallo(r)).toBe(false);
  });

  it('rechaza lo que queda fuera o sin piso', () => {
    expect(esFallo(colocar(sala(), { objeto: 'escritorio-doble', x: 19, y: 13 }))).toBe(true);
    const vacia = salaVacia('t', 'Vacía', 10, 10);
    const r = colocar(vacia, { objeto: 'silla-oficina', x: 2, y: 2 });
    expect(esFallo(r) && r.error).toMatch(/piso/i);
  });

  it('no deja encimar objetos sólidos pero sí apoyar un monitor en un escritorio', () => {
    let s = poner(sala(), 'escritorio-doble', 4, 4);
    expect(esFallo(colocar(s, { objeto: 'silla-oficina', x: 5, y: 5 }))).toBe(true);
    s = poner(s, 'monitor', 4, 4, { orientacion: 'N' });
    expect(esFallo(colocar(s, { objeto: 'monitor', x: 4, y: 4, orientacion: 'S' }))).toBe(true);
    expect(esFallo(colocar(s, { objeto: 'monitor', x: 5, y: 5, orientacion: 'S' }))).toBe(false);
  });

  it('permite alfombras bajo los muebles pero no dos alfombras juntas', () => {
    let s = poner(sala(), 'alfombra-grande', 2, 2);
    s = poner(s, 'mesa-redonda', 3, 2);
    expect(esFallo(colocar(s, { objeto: 'alfombra-grande', x: 3, y: 3 }))).toBe(true);
  });

  it('lo colgado exige pared', () => {
    const s = sala();
    expect(esFallo(colocar(s, { objeto: 'cuadro-grande', x: 5, y: 5, orientacion: 'S' }))).toBe(true);
    const conPared = poner(poner(s, 'pared-lisa', 5, 5, { orientacion: 'U' }), 'pared-lisa', 6, 5, { orientacion: 'U' });
    expect(esFallo(colocar(conPared, { objeto: 'cuadro-grande', x: 5, y: 5, orientacion: 'S' }))).toBe(false);
  });

  it('una puerta reemplaza al muro de su casilla', () => {
    let s = sala();
    for (let x = 3; x <= 8; x++) s = poner(s, 'pared-lisa', x, 5, { orientacion: 'U' });
    const r = colocar(s, { objeto: 'puerta-simple', x: 5, y: 5, orientacion: 'S' });
    expect(esFallo(r)).toBe(false);
    if (!esFallo(r)) {
      expect(r.sala.colocaciones.filter((c) => c.x === 5 && c.y === 5)).toHaveLength(1);
      expect(calcularBloqueo(r.sala)[5 * 20 + 5]).toBe(0);
      expect(calcularBloqueo(r.sala)[5 * 20 + 4]).toBe(1);
    }
  });

  it('no deja una puerta donde cuelga un cuadro', () => {
    let s = sala();
    for (let x = 3; x <= 8; x++) s = poner(s, 'pared-lisa', x, 5, { orientacion: 'U' });
    s = poner(s, 'cuadro-grande', 4, 5, { orientacion: 'S' });
    expect(esFallo(colocar(s, { objeto: 'puerta-simple', x: 4, y: 5, orientacion: 'S' }))).toBe(true);
  });

  it('valida la variante y limpia las propiedades', () => {
    const s = sala();
    expect(esFallo(colocar(s, { objeto: 'silla-oficina', x: 1, y: 1, variante: 'fucsia' }))).toBe(true);
    const r = colocar(s, { objeto: 'pizarron', x: 3, y: 3, props: { texto: '  Ideas  ', titulo: '' } });
    expect(esFallo(r)).toBe(false);
    if (!esFallo(r)) expect(r.colocacion.props).toEqual({ texto: 'Ideas' });
  });
});

describe('ediciones', () => {
  it('quita un muro y se lleva lo que colgaba de él', () => {
    let s = sala();
    for (let x = 3; x <= 6; x++) s = poner(s, 'pared-lisa', x, 5, { orientacion: 'U' });
    s = poner(s, 'cuadro-grande', 3, 5, { orientacion: 'S' });
    const muro = s.colocaciones.find((c) => c.objeto === 'pared-lisa' && c.x === 4)!;
    const r = quitar(s, [muro.id]);
    expect(r.sala.colocaciones.some((c) => c.objeto === 'cuadro-grande')).toBe(false);
    expect(r.quitados).toHaveLength(2);
  });

  it('mueve un objeto sin chocar consigo mismo', () => {
    const s = poner(sala(), 'mesa-reunion-6', 4, 4);
    const id = s.colocaciones[0]!.id;
    const r = reubicar(s, id, 5, 4);
    expect(esFallo(r)).toBe(false);
    const otra = poner(s, 'columna', 9, 4);
    expect(esFallo(reubicar(otra, id, 7, 4))).toBe(true);
  });

  it('gira un objeto y cambia su huella', () => {
    const s = poner(sala(), 'mesa-reunion-6', 4, 4, { orientacion: 'S' });
    const r = girarColocacion(s, s.colocaciones[0]!.id);
    expect(esFallo(r)).toBe(false);
    if (!esFallo(r)) {
      expect(r.colocacion.orientacion).toBe('E');
      expect(calcularBloqueo(r.sala)[6 * 20 + 4]).toBe(1);
    }
  });

  it('no gira lo que no cabe girado', () => {
    const s = poner(poner(sala(), 'mesa-reunion-6', 4, 4, { orientacion: 'S' }), 'columna', 4, 6);
    expect(esFallo(girarColocacion(s, s.colocaciones[0]!.id))).toBe(true);
  });

  it('cambia el color y las propiedades', () => {
    const s = poner(sala(), 'silla-oficina', 3, 3);
    const id = s.colocaciones[0]!.id;
    const a = cambiarVariante(s, id, 'rojo');
    expect(esFallo(a)).toBe(false);
    expect(esFallo(cambiarVariante(s, id, 'violeta'))).toBe(true);
    const n = poner(sala(), 'pizarron', 3, 3);
    const b = cambiarProps(n, n.colocaciones[0]!.id, { texto: 'Hola' });
    expect(esFallo(b) ? null : (b as SalaMapa).colocaciones[0]!.props).toEqual({ texto: 'Hola' });
  });
});

describe('pisos', () => {
  it('pinta, borra y rellena regiones', () => {
    let s = salaVacia('t', 'P', 10, 8);
    s = piso(s, 0, 0, 5, 4, 'piso-baldosa');
    expect(regionDePiso(s, 1, 1)).toHaveLength(20);
    expect(regionDePiso(s, 8, 6)).toHaveLength(80 - 20);
    const borrado = pintarPiso(s, [[0, 0]], '');
    expect(esFallo(borrado) ? 0 : (borrado as SalaMapa).piso[0]![0]).toBe('');
    expect(esFallo(pintarPiso(s, [[0, 0]], 'silla-oficina'))).toBe(true);
  });

  it('no cambia nada si el piso ya era ese', () => {
    const s = piso(salaVacia('t', 'P', 6, 6), 0, 0, 6, 6);
    expect(pintarPiso(s, [[2, 2]], 'piso-madera-clara')).toBe(s);
  });
});

describe('paredes y paso', () => {
  it('calcula la máscara de vecinos N, E, S, O', () => {
    let s = sala();
    for (const [x, y] of [[5, 5], [6, 5], [7, 5], [6, 6]] as const) s = poner(s, 'pared-lisa', x, y, { orientacion: 'U' });
    expect(mascaraPared(s, 5, 5)).toBe('0100');
    expect(mascaraPared(s, 6, 5)).toBe('0111');
    expect(mascaraPared(s, 6, 6)).toBe('1000');
    expect(frameDeColocacion(objetoPorId('pared-lisa')!, 'U', 'base', '0111')).toBe('pared-lisa@0111');
  });

  it('las ventanas y puertas conectan a sus muros vecinos', () => {
    let s = sala();
    for (let x = 3; x <= 7; x++) s = poner(s, 'pared-lisa', x, 5, { orientacion: 'U' });
    s = poner(s, 'pared-ventana', 5, 5, { orientacion: 'S' });
    expect(mascaraPared(s, 4, 5)).toBe('0101');
    expect(mascaraPared(s, 6, 5)).toBe('0101');
    expect(mascaraPared(s, 7, 5)).toBe('0001');
  });

  it('bloquea el vacío y los muebles, y deja pasar asientos, monitores y puertas', () => {
    let s = piso(salaVacia('t', 'P', 12, 8), 2, 2, 8, 4);
    s = poner(s, 'escritorio-individual', 3, 3);
    s = poner(s, 'monitor', 3, 3, { orientacion: 'N' });
    s = poner(s, 'silla-oficina', 3, 4, { orientacion: 'N' });
    const b = calcularBloqueo(s);
    const k = (x: number, y: number) => y * 12 + x;
    expect(b[k(0, 0)]).toBe(1);
    expect(b[k(3, 3)]).toBe(1);
    expect(b[k(3, 4)]).toBe(0); // la silla se cruza caminando
    expect(b[k(6, 3)]).toBe(0);
  });

  it('halla los asientos y desde dónde se llega a ellos', () => {
    const s = poner(poner(sala(), 'sofa-3', 4, 4, { orientacion: 'S' }), 'silla-oficina', 10, 4, { orientacion: 'N' });
    const a = asientosDe(s);
    expect(a).toHaveLength(4);
    expect(a.filter((p) => p.mira === 'S')).toHaveLength(3);
  });

  it('un asiento rodeado no se alcanza y el mapa avisa', () => {
    let s = sala();
    s = poner(s, 'silla-oficina', 5, 5, { orientacion: 'S' });
    for (const [x, y] of [[4, 5], [6, 5], [5, 4], [5, 6]] as const) s = poner(s, 'columna', x, y);
    const alt = alternarLlegada(s, 12, 8);
    if (esFallo(alt)) throw new Error(alt.error);
    const mapa: MapaOficina = { version: 1, nombre: 'T', salaInicial: 't', salas: [alt] };
    const problemas = validarMapa(mapa);
    expect(problemas.some((p) => p.codigo === 'asiento_inalcanzable')).toBe(true);
    expect(hayErrores(problemas)).toBe(false);
  });

  it('calcula lo alcanzable desde un punto', () => {
    let s = sala();
    for (let y = 0; y < 14; y++) s = poner(s, 'columna', 10, y);
    const alc = alcanzables(s, [{ x: 2, y: 2 }]);
    expect(alc[2 * 20 + 3]).toBe(1);
    expect(alc[2 * 20 + 15]).toBe(0);
  });
});

describe('rutas', () => {
  const rejilla = (filas: string[]) => {
    const alto = filas.length;
    const ancho = filas[0]!.length;
    const b = new Uint8Array(ancho * alto);
    filas.forEach((f, y) => [...f].forEach((c, x) => (b[y * ancho + x] = c === '#' ? 1 : 0)));
    return { b, ancho, alto };
  };

  it('rodea un obstáculo', () => {
    const { b, ancho, alto } = rejilla(['.....', '.###.', '.....']);
    const r = buscarRuta(b, ancho, alto, { x: 0, y: 1 }, { x: 4, y: 1 });
    expect(r).not.toBeNull();
    expect(r![r!.length - 1]).toEqual({ x: 4, y: 1 });
    for (const c of r!) expect(b[c.y * ancho + c.x]).toBe(0);
  });

  it('no corta esquinas en diagonal', () => {
    const { b, ancho, alto } = rejilla(['.#', '#.']);
    expect(buscarRuta(b, ancho, alto, { x: 0, y: 0 }, { x: 1, y: 1 })).toBeNull();
  });

  it('devuelve null si no hay camino o la meta está bloqueada', () => {
    const { b, ancho, alto } = rejilla(['..#..', '..#..']);
    expect(buscarRuta(b, ancho, alto, { x: 0, y: 0 }, { x: 4, y: 0 })).toBeNull();
    expect(buscarRuta(b, ancho, alto, { x: 0, y: 0 }, { x: 2, y: 0 })).toBeNull();
  });

  it('elige la casilla alcanzable más cercana a un objetivo bloqueado', () => {
    const { b, ancho, alto } = rejilla(['.....', '..#..', '.....']);
    expect(masCercanoAlcanzable(b, ancho, alto, { x: 0, y: 0 }, { x: 2, y: 1 })).toMatchObject({ x: expect.any(Number) });
    const c = masCercanoAlcanzable(b, ancho, alto, { x: 0, y: 0 }, { x: 2, y: 1 })!;
    expect(Math.abs(c.x - 2) + Math.abs(c.y - 1)).toBe(1);
  });

  it('genera líneas rectas', () => {
    expect(celdasLinea(2, 3, 6, 4)).toHaveLength(5);
    expect(celdasLinea(2, 3, 3, 8)).toHaveLength(6);
  });
});

describe('zonas, portales y puestos', () => {
  it('crea zonas dentro de la oficina y halla la más específica', () => {
    let s = sala();
    const a = crearZona(s, { nombre: 'Grande', tipo: 'abierta', rect: { x: 0, y: 0, w: 10, h: 10 } });
    if (esFallo(a)) throw new Error(a.error);
    const b = crearZona(a.sala, { nombre: 'Chica', tipo: 'privada', rect: { x: 2, y: 2, w: 3, h: 3 } });
    if (esFallo(b)) throw new Error(b.error);
    s = b.sala;
    expect(zonaEn(s, 3, 3)?.nombre).toBe('Chica');
    expect(zonaEn(s, 8, 8)?.nombre).toBe('Grande');
    expect(zonaEn(s, 15, 12)).toBeUndefined();
    expect(esFallo(crearZona(s, { nombre: 'Fuera', tipo: 'abierta', rect: { x: 18, y: 0, w: 5, h: 2 } }))).toBe(true);
  });

  it('alterna llegadas y no deja ponerlas en lo bloqueado', () => {
    const s = poner(sala(), 'columna', 5, 5);
    expect(esFallo(alternarLlegada(s, 5, 5))).toBe(true);
    const a = alternarLlegada(s, 6, 5);
    expect(esFallo(a) ? 0 : (a as SalaMapa).llegadas.length).toBe(1);
    const b = alternarLlegada(a as SalaMapa, 6, 5);
    expect(esFallo(b) ? 1 : (b as SalaMapa).llegadas.length).toBe(0);
  });

  it('un portal a una sala que no existe es un error', () => {
    const s = sala();
    const p = crearPortal(s, { x: 3, y: 3, destinoSala: 'nada', destinoX: 1, destinoY: 1, etiqueta: 'Escalera' });
    if (esFallo(p)) throw new Error(p.error);
    const llegada = alternarLlegada(p.sala, 8, 8);
    const mapa: MapaOficina = { version: 1, nombre: 'T', salaInicial: 't', salas: [llegada as SalaMapa] };
    expect(validarMapa(mapa).some((q) => q.codigo === 'portal_destino')).toBe(true);
  });

  it('asigna un puesto a una persona y lo libera', () => {
    const s = poner(sala(), 'silla-oficina', 3, 3);
    const id = s.colocaciones[0]!.id;
    const a = asignarPuesto(s, id, 7, 'Puesto de Ana') as SalaMapa;
    expect(a.puestos).toHaveLength(1);
    const b = asignarPuesto(a, id, null, '') as SalaMapa;
    expect(b.puestos[0]?.usuarioId).toBeNull();
    const c = quitar(a, [id]).sala;
    expect(c.puestos).toHaveLength(0);
  });
});

describe('mapa inicial y formato guardado', () => {
  const mapa = plantillaNaos();

  it('es válido: sin errores', () => {
    const errores = validarMapa(mapa).filter((p) => p.nivel === 'error');
    expect(errores).toEqual([]);
  });

  it('solo usa objetos del inventario', () => {
    for (const c of mapa.salas[0]!.colocaciones) expect(INVENTARIO_POR_ID.has(c.objeto), c.objeto).toBe(true);
    for (const fila of mapa.salas[0]!.piso) for (const id of fila) if (id) expect(INVENTARIO_POR_ID.has(id), id).toBe(true);
  });

  it('todo asiento se alcanza caminando desde la llegada', () => {
    expect(validarMapa(mapa).some((p) => p.codigo === 'asiento_inalcanzable')).toBe(false);
  });

  it('ida y vuelta del formato compacto', () => {
    const g = comprimirMapa(mapa);
    expect(descomprimirMapa(JSON.parse(JSON.stringify(g)))).toEqual(mapa);
    expect(JSON.stringify(g).length).toBeLessThan(JSON.stringify(mapa).length);
  });

  it('detecta objetos desconocidos y llegadas bloqueadas', () => {
    const copia: MapaOficina = JSON.parse(JSON.stringify(mapa));
    copia.salas[0]!.colocaciones.push({ id: 'zz', objeto: 'dragon', x: 5, y: 5, orientacion: 'U', variante: 'base' });
    copia.salas[0]!.llegadas.push({ x: 0, y: 0 });
    const codigos = validarMapa(copia).map((p) => p.codigo);
    expect(codigos).toContain('objeto_desconocido');
    expect(codigos).toContain('llegada_bloqueada');
  });

  it('exige llegadas en la sala de entrada', () => {
    const copia: MapaOficina = JSON.parse(JSON.stringify(mapa));
    copia.salas[0]!.llegadas = [];
    expect(validarMapa(copia).some((p) => p.codigo === 'sin_llegadas' && p.nivel === 'error')).toBe(true);
  });

  it('evaluarColocacion explica por qué no cabe algo', () => {
    const o = objetoPorId('escritorio-doble')!;
    const ev = evaluarColocacion(mapa.salas[0]!, o, 4, 19, 'S');
    expect(ev.ok).toBe(false);
  });
});
