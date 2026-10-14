import { describe, expect, it } from 'vitest';
import { PLANTILLAS_MAPA, alcanzables, asientosDe, calcularBloqueo, edificioVacio, hayErrores, huellaColocada, objetoPorId, plantillaDeMapa, plantillaNaos, validarMapa, type IdPlantillaMapa, type SalaMapa } from '../src';

const CONSTRUIDAS: IdPlantillaMapa[] = ['naos', 'abierta', 'sede'];
const salaDe = (id: IdPlantillaMapa): SalaMapa => plantillaDeMapa(id).salas[0]!;

/** Casillas sin nada que bloquee, con piso. */
function libres(sala: SalaMapa): (x: number, y: number) => boolean {
  const b = calcularBloqueo(sala);
  return (x, y) => x >= 0 && y >= 0 && x < sala.ancho && y < sala.alto && !b[y * sala.ancho + x];
}

describe('plantillas del mapa', () => {
  it('el edificio vacío es válido y trae solo el cascarón', () => {
    const mapa = edificioVacio();
    expect(hayErrores(validarMapa(mapa))).toBe(false);
    const sala = mapa.salas[0]!;
    expect(sala.id).toBe('piso-4');
    expect(mapa.salaInicial).toBe('piso-4');
    expect(sala.zonas).toHaveLength(0);
    expect(sala.areas ?? []).toHaveLength(0);
    expect(sala.llegadas.length).toBeGreaterThanOrEqual(1);
    expect(sala.llegadas.length).toBeLessThanOrEqual(2);
    const objetos = new Set(sala.colocaciones.map((c) => c.objeto));
    expect([...objetos].sort()).toEqual(['cerca', 'pared-lisa', 'puerta-simple']);
    expect(sala.colocaciones.filter((c) => c.objeto === 'puerta-simple')).toHaveLength(1);
  });

  it('el catálogo de plantillas trae nombre, descripción corta y tamaño, y «Vacía» es la de arranque', () => {
    expect(PLANTILLAS_MAPA.map((p) => p.id)).toEqual(['vacia', 'naos', 'abierta', 'sede']);
    for (const p of PLANTILLAS_MAPA) {
      expect(p.nombre.length, p.id).toBeGreaterThan(3);
      expect(p.descripcion.length, p.id).toBeGreaterThan(20);
      expect(p.descripcion.length, p.id).toBeLessThan(200);
      expect(p.tamano, p.id).toBe('46×30 casillas');
    }
    expect(plantillaDeMapa('vacia').salas[0]!.zonas).toHaveLength(0);
  });

  it('la plantilla de Naos conserva sus bases y se elige por id', () => {
    const naos = plantillaNaos();
    const sala = naos.salas[0]!;
    const nombres = sala.zonas.map((z) => z.nombre);
    for (const n of ['Zona de Play 5', 'Recibidor', 'Cafetería', 'Baño de hombres', 'Baño de mujeres', 'Oficina de dirección A', 'Oficina de dirección B', 'Equipo Digital', 'Terraza', 'Sala de dirección A', 'Sala de dirección B', 'Sala de la cafetería', 'Sofás del recibidor']) expect(nombres, n).toContain(n);
    expect(sala.zonas.find((z) => z.nombre === 'Sofás del recibidor')?.tipo).toBe('coworking');
    expect(sala.areas?.map((a) => a.nombre)).toEqual(['Oficina de Ana Ruiz', 'Oficina de Luis Gómez', 'Oficina de Marta Díaz', 'Oficina de Camila Torres', 'Oficina de Pablo Rojas', 'Oficina de Sara León', 'Oficina de Diego Vargas', 'Oficina libre']);
    expect(sala.puestos.map((p) => p.etiqueta)).toEqual(expect.arrayContaining(['Dirección A', 'Dirección B', 'Ana Ruiz · Data Entry', 'Diego Vargas · Frontend']));
    expect(sala.puestos).toHaveLength(9);
    expect(sala.colocaciones.length).toBeGreaterThan(400);
    expect(plantillaDeMapa('naos').salas[0]!.zonas).toHaveLength(sala.zonas.length);
  });
});

describe.each(CONSTRUIDAS)('plantilla «%s»', (id) => {
  const mapa = plantillaDeMapa(id);
  const sala = mapa.salas[0]!;

  it('se construye con la regla estricta y valida sin errores ni avisos (realismo, cubículos y asientos incluidos)', () => {
    expect(hayErrores(validarMapa(mapa))).toBe(false);
    expect(validarMapa(mapa).map((p) => `${p.nivel} ${p.codigo} ${p.mensaje}`)).toEqual([]);
  });

  it('es la misma sala de 46x30 con el mismo anillo exterior, el balcón y su puerta', () => {
    expect([sala.id, sala.ancho, sala.alto, mapa.salaInicial]).toEqual(['piso-4', 46, 30, 'piso-4']);
    const vacia = edificioVacio().salas[0]!;
    // El anillo son las casillas de pared (muro, ventana o puerta) de afuera: las ventanas de la fachada reemplazan muro, así que se compara el lugar, no el objeto.
    const anillo = (s: SalaMapa) => s.colocaciones.filter((c) => objetoPorId(c.objeto)?.pared !== undefined && c.objeto !== 'cerca' && (c.x <= 1 || c.x >= 36 || c.y <= 3 || c.y >= 26)).map((c) => `${c.x},${c.y}`).sort();
    expect(anillo(sala)).toEqual(anillo(vacia));
    expect(sala.colocaciones.filter((c) => c.objeto === 'cerca').length).toBe(vacia.colocaciones.filter((c) => c.objeto === 'cerca').length);
    expect(sala.colocaciones.find((c) => c.objeto === 'puerta-simple' && c.x === 36 && c.y === 20)?.orientacion).toBe('E');
  });

  it('solo usa objetos y pisos vigentes (ninguno obsoleto ni desconocido)', () => {
    for (const c of sala.colocaciones) {
      const o = objetoPorId(c.objeto);
      expect(o, c.objeto).toBeDefined();
      expect(o?.obsoleto, c.objeto).not.toBe(true);
    }
    for (const fila of sala.piso) for (const p of fila) if (p) expect(objetoPorId(p)?.obsoleto, p).not.toBe(true);
  });

  it('todo asiento es alcanzable, ninguna casilla libre queda encerrada y las llegadas están libres', () => {
    expect(sala.llegadas.length).toBeGreaterThanOrEqual(2);
    const alc = alcanzables(sala, sala.llegadas);
    for (const a of asientosDe(sala)) expect(alc[a.y * sala.ancho + a.x], `${a.colocacion} en ${a.x},${a.y}`).toBe(1);
    const libre = libres(sala);
    for (const l of sala.llegadas) expect(libre(l.x, l.y), `llegada ${l.x},${l.y}`).toBe(true);
    for (let y = 0; y < sala.alto; y++) for (let x = 0; x < sala.ancho; x++) if (libre(x, y)) expect(alc[y * sala.ancho + x], `casilla ${x},${y}`).toBe(1);
  });

  it('las puertas tienen espacio libre delante, a los dos lados', () => {
    const libre = libres(sala);
    for (const c of sala.colocaciones) {
      if (c.objeto !== 'puerta-simple' && c.objeto !== 'puerta-vidrio' && c.objeto !== 'puerta-cubiculo') continue;
      const o = objetoPorId(c.objeto)!;
      const h = huellaColocada(o, c.x, c.y, c.orientacion);
      const vertical = c.orientacion !== 'S';
      const lados: [number, number][] = vertical ? [[c.x - 1, c.y], [c.x + 1, c.y]] : [[c.x, c.y - 1], [c.x, c.y + 1]];
      for (const [x, y] of lados) expect(libre(x, y), `${c.objeto} en ${c.x},${c.y} (${h.ancho}x${h.alto}): casilla ${x},${y}`).toBe(true);
    }
  });

  it('los baños tienen un cubículo con puerta por sanitario y divisores en los dos lados', () => {
    const cuenta = (obj: string, zona: string): number => {
      const z = sala.zonas.find((q) => q.nombre === zona)!;
      return sala.colocaciones.filter((c) => c.objeto === obj && c.x >= z.rect.x - 1 && c.x <= z.rect.x + z.rect.w && c.y >= z.rect.y - 1 && c.y < z.rect.y + z.rect.h).length;
    };
    expect([cuenta('sanitario', 'Baño de hombres'), cuenta('puerta-cubiculo', 'Baño de hombres'), cuenta('urinario', 'Baño de hombres'), cuenta('divisor-urinario', 'Baño de hombres'), cuenta('lavabo-meson', 'Baño de hombres'), cuenta('espejo-bano', 'Baño de hombres')]).toEqual([3, 3, 2, 1, 1, 1]);
    expect([cuenta('sanitario', 'Baño de mujeres'), cuenta('puerta-cubiculo', 'Baño de mujeres'), cuenta('lavabo-meson', 'Baño de mujeres'), cuenta('espejo-bano', 'Baño de mujeres')]).toEqual([4, 4, 1, 1]);
    for (const zona of ['Baño de hombres', 'Baño de mujeres']) {
      expect(cuenta('dispensador-jabon', zona), zona).toBe(1);
      expect(cuenta('dispensador-papel', zona), zona).toBeGreaterThanOrEqual(1);
      expect(cuenta('secador-manos', zona), zona).toBe(1);
      expect(cuenta('papelera-bano', zona), zona).toBe(1);
    }
  });

  it('las zonas de sala (reuniones) existen y la plantilla trae descripción de nombre y tamaño en el catálogo', () => {
    expect(sala.zonas.some((z) => z.tipo === 'sala')).toBe(true);
    expect(PLANTILLAS_MAPA.find((p) => p.id === id)).toBeDefined();
  });
});

describe('detalles de cada plantilla', () => {
  it('Naos: el pasillo central mide al menos 2 casillas en todo su largo y las mini oficinas traen objetos personales distintos', () => {
    const sala = salaDe('naos');
    const libre = libres(sala);
    for (let y = 4; y <= 25; y++) expect([13, 14, 15].filter((x) => libre(x, y)).length, `pasillo y ${y}`).toBeGreaterThanOrEqual(2);
    const sobre = new Set<string>();
    for (const a of sala.areas ?? []) {
      const dentro = sala.colocaciones.filter((c) => objetoPorId(c.objeto)?.apoyado && c.x >= a.rect.x && c.x < a.rect.x + a.rect.w && c.y >= a.rect.y && c.y < a.rect.y + a.rect.h);
      sobre.add(dentro.map((c) => `${c.objeto}:${c.variante}`).sort().join('|'));
    }
    expect(sobre.size).toBe(8);
  });

  it('Oficina abierta: seis escritorios de equipo de 3x2 con seis sillas cada uno, dos salas con vidrio y tres cabinas', () => {
    const sala = salaDe('abierta');
    const equipos = sala.colocaciones.filter((c) => c.objeto === 'escritorio-3x2');
    expect(equipos).toHaveLength(6);
    for (const e of equipos) expect(sala.colocaciones.filter((c) => c.objeto === 'silla-oficina' && c.x >= e.x && c.x < e.x + 3 && (c.y === e.y - 1 || c.y === e.y + 2)), `${e.x},${e.y}`).toHaveLength(6);
    expect(sala.colocaciones.filter((c) => c.objeto === 'puerta-vidrio')).toHaveLength(5);
    expect(sala.zonas.filter((z) => z.tipo === 'sala')).toHaveLength(2);
    expect(sala.zonas.filter((z) => z.nombre.startsWith('Cabina'))).toHaveLength(3);
    expect(sala.zonas.some((z) => z.tipo === 'coworking')).toBe(true);
    const sofas = sala.colocaciones.filter((c) => /^sofa|^puf/.test(c.objeto)).length;
    expect(sofas).toBeGreaterThanOrEqual(6);
  });

  it('Sede: cuatro salas de reunión de 12, 6, 6 y 4 personas con TV, una sala creativa con mesa grande y pizarras, y biblioteca', () => {
    const sala = salaDe('sede');
    const sillas = (zona: string): number => {
      const z = sala.zonas.find((q) => q.nombre.startsWith(zona))!;
      return sala.colocaciones.filter((c) => c.objeto.startsWith('silla-') && c.x >= z.rect.x && c.x < z.rect.x + z.rect.w && c.y >= z.rect.y && c.y < z.rect.y + z.rect.h).length;
    };
    expect([sillas('Sala grande'), sillas('Sala mediana 1'), sillas('Sala mediana 2'), sillas('Sala pequeña')]).toEqual([12, 6, 6, 4]);
    expect(sala.colocaciones.filter((c) => c.objeto === 'tv-pared')).toHaveLength(4);
    expect(sala.colocaciones.filter((c) => c.objeto === 'pizarra-pie').length).toBeGreaterThanOrEqual(2);
    expect(sala.zonas.map((z) => z.nombre)).toEqual(expect.arrayContaining(['Sala creativa (war room)', 'Biblioteca y descanso', 'Cafetería', 'Terraza']));
    expect(sala.colocaciones.filter((c) => c.objeto === 'estanteria-libros').length).toBeGreaterThanOrEqual(6);
  });
});
