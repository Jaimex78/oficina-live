import { describe, expect, it } from 'vitest';
import { ConstructorSala, VELOCIDAD_PX_S, buscarRuta, descomprimirMapa, type Celda, type MapaGuardado, type SalaMapa } from '@ol/shared';
import mapaGuardado from './fixtures/oficina-publicada.json';
import { avanzarPorRuta, chocaEn, lineaLibre, pasoConDeslizamiento } from './movimiento';
import { celdaDePies, centroDeCelda, cuadriculaDe, rutaAPunto } from './ruta';

/** Camina `ruta` a velocidad normal con cuadros de 1/60 s. Devuelve dónde quedó y si llegó. */
function caminar(g: ReturnType<typeof cuadriculaDe>, desde: { x: number; y: number }, ruta: Celda[], maxSeg = 40) {
  let { x, y } = desde;
  let cuadros = 0;
  const copia = [...ruta];
  while (cuadros < maxSeg * 60) {
    const r = avanzarPorRuta(g, x, y, copia, (VELOCIDAD_PX_S * 1) / 60);
    x = r.x;
    y = r.y;
    cuadros++;
    if (r.termino) return { x, y, llego: true, seg: cuadros / 60 };
    if (!r.movio) return { x, y, llego: false, seg: cuadros / 60, atascado: true };
  }
  return { x, y, llego: false, seg: maxSeg };
}

describe('colisión y deslizamiento', () => {
  const sala = new ConstructorSala('s', 'S', 10, 8).piso(0, 0, 10, 8, 'piso-madera-clara').muro(5, 0, 5, 3).muro(5, 5, 5, 7).construir(); // muro con una puerta de 1 casilla en y = 4
  const g = cuadriculaDe(sala);

  it('la caja no entra en un muro y sí cabe en el pasillo', () => {
    expect(chocaEn(g, 5 * 32 + 16, 40)).toBe(true);
    expect(chocaEn(g, 3 * 32 + 16, 40)).toBe(false);
  });
  it('contra una pared recta se desliza por el otro eje', () => {
    const r = pasoConDeslizamiento(g, 5 * 32 - 7, 60, 0.7071, 0.7071, 3);
    expect(r.y).toBeGreaterThan(60);
    expect(r.x).toBeLessThanOrEqual(5 * 32 - 6);
  });
  it('cruza una puerta de una casilla caminando recto aunque vaya desalineado unos píxeles', () => {
    for (const desvio of [-9, -5, 0, 5, 9]) {
      let x = 3 * 32;
      let y = 4 * 32 + 24 + desvio;
      for (let i = 0; i < 90; i++) {
        const r = pasoConDeslizamiento(g, x, y, 1, 0, 160 / 60);
        x = r.x;
        y = r.y;
      }
      expect(x, `desvío ${desvio}`).toBeGreaterThan(5 * 32 + 20);
    }
  });
  it('sin pared no se corre de lado', () => {
    const r = pasoConDeslizamiento(g, 80, 100, 1, 0, 3);
    expect(r).toMatchObject({ x: 83, y: 100, movio: true });
  });
  it('la línea libre se corta con un muro', () => {
    expect(lineaLibre(g, 40, 100, 120, 100)).toBe(true);
    expect(lineaLibre(g, 40, 40, 280, 40)).toBe(false);
  });
});

describe('seguir un camino', () => {
  const sala: SalaMapa = descomprimirMapa(mapaGuardado as unknown as MapaGuardado).salas[0] as SalaMapa;
  const g = cuadriculaDe(sala);
  const libres: Celda[] = [];
  for (let y = 0; y < g.alto; y++) for (let x = 0; x < g.ancho; x++) if (!g.bloqueo[y * g.ancho + x]) libres.push({ x, y });

  it('llega sin trabarse a decenas de destinos del mapa publicado, incluidas las oficinas con puerta', () => {
    // Generador fijo para que la prueba sea la misma siempre.
    let semilla = 12345;
    const azar = () => (semilla = (semilla * 1664525 + 1013904223) % 4294967296) / 4294967296;
    const salida = libres.filter((c) => c.x >= 17 && c.x <= 20 && c.y >= 10 && c.y <= 12)[0] ?? (libres[0] as Celda);
    const inicio = centroDeCelda(salida);
    let fallos = 0;
    let probados = 0;
    for (let i = 0; i < 60; i++) {
      const destino = libres[Math.floor(azar() * libres.length)] as Celda;
      const ruta = rutaAPunto(g, celdaDePies(inicio.x, inicio.y), destino);
      if (!ruta || ruta.length === 0) continue;
      probados++;
      const r = caminar(g, inicio, ruta);
      if (!r.llego) fallos++;
      else {
        // Si el destino no se alcanza caminando (un rincón cerrado), el camino termina en la casilla alcanzable más cercana.
        const fin = centroDeCelda(ruta[ruta.length - 1] as Celda);
        expect(Math.hypot(r.x - fin.x, r.y - fin.y)).toBeLessThan(3);
      }
    }
    expect(probados).toBeGreaterThan(30);
    expect(fallos).toBe(0);
  });

  it('cada puerta del mapa se puede cruzar de lado a lado', () => {
    const puertas = sala.colocaciones.filter((c) => c.objeto.startsWith('puerta'));
    expect(puertas.length).toBeGreaterThan(0);
    let probadas = 0;
    for (const p of puertas) {
      // Las casillas libres a los dos lados de la puerta (norte-sur o este-oeste).
      const pares: [Celda, Celda][] = [
        [{ x: p.x, y: p.y - 1 }, { x: p.x, y: p.y + 1 }],
        [{ x: p.x - 1, y: p.y }, { x: p.x + 1, y: p.y }],
      ];
      const libre = (c: Celda) => c.x >= 0 && c.y >= 0 && c.x < g.ancho && c.y < g.alto && !g.bloqueo[c.y * g.ancho + c.x];
      const par = pares.find(([a, b]) => libre(a) && libre(b));
      if (!par) continue;
      probadas++;
      const [a, b] = par;
      const ruta = buscarRuta(g.bloqueo, g.ancho, g.alto, a, b);
      expect(ruta, `puerta en (${p.x},${p.y})`).not.toBeNull();
      const r = caminar(g, centroDeCelda(a), ruta as Celda[]);
      expect(r.llego, `puerta en (${p.x},${p.y})`).toBe(true);
    }
    expect(probadas).toBeGreaterThanOrEqual(5);
  });
});
