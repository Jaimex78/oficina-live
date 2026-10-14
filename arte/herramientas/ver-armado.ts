/**
 * Hojas internas del armado realista: las escenas de cafetería, oficina de dirección y mini oficinas
 * dibujadas con el compositor del arte. Escribe «<escena>-antes.png» (lo apoyado donde estaba) y «<escena>-despues.png»
 * (sobre la tapa, como en el navegador) en arte/referencia/propia/armado-realista/.
 *
 *   npx tsx arte/herramientas/ver-armado.ts [escena ...]       escenas: cafeteria, direccion, minioficinas, pcs, sillas
 */
import { join } from 'node:path';
import { ConstructorSala, type SalaMapa } from '@ol/shared';
import { componerSala, resolverDesdePublicados } from '../src/objetos/compositor';
import { escribirPng } from '../src/nucleo';

const SALIDA = join(process.cwd(), 'arte/referencia/propia/armado-realista');
export const ESCENAS: Record<string, () => SalaMapa> = {
  cafeteria: () => {
    const b = new ConstructorSala('c', 'Cafetería', 20, 12).piso(0, 0, 20, 12, 'piso-cocina');
    b.poner('meson', 1, 1, 'S').poner('meson', 8, 1, 'S');
    for (const [o, x] of [['cafetera', 1], ['tostadora', 2], ['frutero', 3], ['pizza', 8], ['taza-regular', 9], ['ensalada', 10]] as const) b.poner(o, x, 1);
    b.poner('mesa-redonda', 2, 4).poner('taza-regular', 2, 4).poner('dona', 3, 5);
    b.poner('mesa-redonda', 8, 4).poner('canasta-pascua', 8, 5).poner('vaso-termico', 9, 4);
    b.poner('mesa-comedor', 4, 8, 'S').poner('tabla-quesos', 4, 8).poner('botella-agua', 5, 8).poner('bandeja-sushi', 6, 8).poner('pizza', 5, 9).poner('ensalada', 4, 9).poner('taza-ancha', 6, 9);
    for (const x of [2, 3, 4, 5, 6, 7]) b.poner('silla-comedor', x, 7, 'S');
    return b.construir();
  },
  direccion: () => {
    const b = new ConstructorSala('d', 'Dirección', 14, 9).piso(0, 0, 14, 9, 'piso-parquet');
    b.poner('mesa-conferencia-3x3', 3, 3, 'S');
    b.poner('jarron-meiji', 3, 3).poner('tabla-quesos', 4, 4).poner('taza-regular', 5, 5).poner('jarron-moderno', 4, 3).poner('documentos-pila', 3, 5);
    b.poner('escritorio-ejecutivo-moderno', 8, 2, 'S').poner('monitor', 8, 2).poner('planta-chica', 10, 2).poner('lampara-escritorio', 9, 2);
    b.poner('mesa-lateral-moderna', 11, 6).poner('jarron-rosas', 11, 6);
    return b.construir();
  },
  minioficinas: () => {
    const b = new ConstructorSala('m', 'Mini oficinas', 18, 8).piso(0, 0, 18, 8, 'piso-madera-clara');
    for (const [i, x] of [0, 4, 8, 12].entries()) {
      b.poner('escritorio-oficina', x + 1, 2, 'S');
      if (i % 2) b.poner('computador-moderno', x + 1, 2).poner('planta-chica', x + 3, 2);
      else b.poner('monitor', x + 1, 2).poner(i === 2 ? 'portatil' : 'taza-regular', x + 2, 2).poner('planta-chica', x + 3, 2);
      b.poner('silla-ejecutiva', x + 2, 3, 'S');
    }
    b.poner('escritorio-3x2', 1, 5, 'S').poner('pc-gamer', 1, 5).poner('lampara-escritorio', 3, 6).poner('cuaderno-abierto', 2, 6).poner('telefono-escritorio', 3, 5);
    return b.construir();
  },
  sillas: () => {
    const b = new ConstructorSala('s', 'Sillas', 26, 16).piso(0, 0, 26, 16, 'piso-madera-clara').estricto();
    b.poner('mesa-simple-3x1', 2, 2, 'S').sillasAlrededor({ lados: 'todos', silla: 'silla-simple' });
    b.poner('mesa-tronco-3x2', 7, 2, 'S').sillasAlrededor({ lados: 'uno', silla: 'silla-comedor' });
    b.poner('mesa-industrial-3x3', 12, 2, 'S').sillasAlrededor({ lados: 'todos', silla: 'silla-comedor-industrial' });
    b.poner('mesa-redonda', 18, 2).sillasAlrededor({ lados: 'uno', silla: 'silla-comedor' });
    b.poner('mesa-redonda', 22, 2).sillasAlrededor({ lados: 'todos', silla: 'silla-comedor' });
    b.poner('mesa-redonda-grande', 2, 8).sillasAlrededor({ lados: 'uno', silla: 'silla-reunion' });
    b.poner('mesa-comedor', 8, 9, 'E').sillasAlrededor({ lados: 'todos', silla: 'butaca' });
    b.poner('mesa-reunion-8', 12, 9, 'S').sillasAlrededor({ lados: 'largos', silla: 'silla-ejecutiva' });
    b.poner('escritorio-oficina', 18, 9, 'S').sillasAlrededor({ lados: 'uno', silla: 'silla-oficina' });
    b.poner('escritorio-3x2', 22, 9, 'S').sillasAlrededor({ lados: 'uno', silla: 'silla-ejecutiva' });
    return b.construir();
  },
};

const solicitadas = process.argv.slice(2);
const resolver = resolverDesdePublicados();
for (const nombre of solicitadas.length ? solicitadas : Object.keys(ESCENAS)) {
  const sala = ESCENAS[nombre]?.();
  if (!sala) { console.log('no existe la escena', nombre); continue; }
  escribirPng(componerSala(sala, resolver, { apoyos: false, margenSuperior: 32 }).escalar(3), join(SALIDA, `${nombre}-antes.png`));
  escribirPng(componerSala(sala, resolver, { margenSuperior: 32 }).escalar(3), join(SALIDA, `${nombre}-despues.png`));
  console.log('escena', nombre);
}
