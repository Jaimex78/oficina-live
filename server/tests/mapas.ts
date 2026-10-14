import { comprimirMapa, ConstructorSala, type MapaGuardado, type MapaOficina } from '@ol/shared';
import type { cliente } from './ayudas';

type Api = ReturnType<typeof cliente>;

/**
 * Sala de 12x8 con piso en x 1..10 e y 1..6, una sola llegada en (4,3) y un objeto en (5,3).
 * Con una silla, esa casilla es un asiento sólido. Con una planta, es sólida y no se puede usar para sentarse.
 */
function salaConObjeto(objeto: string, nombre: string): MapaOficina {
  const b = new ConstructorSala('principal', 'Sala de prueba', 12, 8);
  b.piso(1, 1, 10, 6, 'piso-madera-clara');
  b.poner(objeto, 5, 3, objeto === 'silla-oficina' ? 'S' : undefined);
  // Una silla de oficina va junto a una mesa (si no, la Revisión avisa de silla suelta).
  if (objeto === 'silla-oficina') b.poner('mesa-alta', 5, 4);
  b.llegadas({ x: 4, y: 3 });
  return { version: 1, nombre, salaInicial: 'principal', salas: [b.construir()] };
}

export const mapaConSilla = (nombre = 'Prueba con silla'): MapaOficina => salaConObjeto('silla-oficina', nombre);
export const mapaConPlanta = (nombre = 'Prueba con planta'): MapaOficina => salaConObjeto('planta-grande', nombre);

/**
 * Una sola sala, «anexo», que no existía antes: quien estaba en «principal» tiene que pasar aquí.
 * Tiene piso en x 1..8, así que la columna 9 (que en «principal» sí tenía piso) ya no se puede pisar.
 */
export function mapaSoloAnexo(nombre = 'Prueba con anexo'): MapaOficina {
  const b = new ConstructorSala('anexo', 'Anexo', 10, 8);
  b.piso(1, 1, 8, 6, 'piso-cemento');
  b.llegadas({ x: 8, y: 3 });
  return { version: 1, nombre, salaInicial: 'anexo', salas: [b.construir()] };
}

/** Copia del mapa compacto para que cada prueba lo estropee a su manera. */
export function compactoDePrueba(nombre?: string): MapaGuardado {
  return structuredClone(comprimirMapa(mapaConSilla(nombre)));
}

/** Guarda el mapa como borrador y lo publica con una cuenta que pueda construir. Devuelve el número publicado. */
export async function publicarMapa(api: Api, mapa: MapaOficina, nota = ''): Promise<number> {
  const construccion = await api.get('/api/oficina/construccion');
  const revision = (construccion.body.borrador?.revision ?? null) as number | null;
  const guardado = await api.put('/api/oficina/borrador').send({ revision, mapa: comprimirMapa(mapa) });
  if (guardado.status !== 200) throw new Error(`No se pudo guardar el borrador: ${guardado.status} ${JSON.stringify(guardado.body)}`);
  const publicado = await api.post('/api/oficina/publicar').send({ nota });
  if (publicado.status !== 200) throw new Error(`No se pudo publicar: ${publicado.status} ${JSON.stringify(publicado.body)}`);
  return publicado.body.numero as number;
}
