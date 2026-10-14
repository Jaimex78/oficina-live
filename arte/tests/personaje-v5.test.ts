/**
 * Propuesta de personaje v5 (aislada): la transcripción de los 5 archivos del arte base de Jaime Orozco tiene 0 píxeles de diferencia y todas las
 * combinaciones de la hoja se arman sin errores y dentro del lienzo de 32 x 64.
 */

import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { comprobarPerfilesPelo, comprobarTodo } from '../herramientas/verificar-disenador';
import { OJO_MEDIO_I, OJO_MEDIO_S, PERFIL_P1 } from '../src/personaje/v5/disenador';
import { figura } from '../src/personaje/v5/figura';
import type { Look } from '../src/personaje/v5/figura';
import { PEINADOS } from '../src/personaje/v5/peinados';
import { BASE_S } from '../src/personaje/v5/rejilla';
import { BASE_I, BASE_N } from '../src/personaje/v5/vistas';
import { poseCuerpo } from '../src/personaje/v5/pose';
import { PRENDAS } from '../src/personaje/v5/prendas';
import { ctxDe } from '../src/personaje/v5/vestir';
import { PERFIL_IZQUIERDO } from '../src/personaje/v5/datos-perfiles';
import { PERFIL_X0, PERFIL_Y0 } from '../src/personaje/v5/disenador';
import { desdeFilas } from '../src/personaje/v5/rejilla';
import type { Cuadro, Dir } from '../src/personaje/v5/vistas';

// Las imágenes originales viven en `arte/referencia/` (material local que no se publica): sin ellas estas dos pruebas se saltan.
const HAY_REFERENCIA = fs.existsSync(fileURLToPath(new URL('../referencia/estilo-pixel-gba/', import.meta.url)));

describe('personaje v5', () => {
  it.skipIf(!HAY_REFERENCIA)('replica los 5 originales del diseñador sin diferencias', () => {
    for (const c of comprobarTodo()) expect(c.pixelesDiferentes, c.nombre).toBe(0);
  });

  it.skipIf(!HAY_REFERENCIA)('replica los perfiles 15 y 16 (pelo, chaqueta roja y ojo) sin diferencias', () => {
    for (const c of comprobarPerfilesPelo()) expect(c.pixelesDiferentes, c.nombre).toBe(0);
    expect(PERFIL_P1.ojoMedio.size).toBe(17);
    expect(OJO_MEDIO_I.size).toBe(8);
    expect(OJO_MEDIO_S.size).toBe(12);
  });

  it('las piernas del cuerpo no se tocan: 0 píxeles de diferencia con el arte base', () => {
    // Se probó cerrar las piernas y se revirtió: el cuerpo queda EXACTO y la ropa se adapta a su silueta
    for (const v of ['S', 'N'] as const) for (let y = 55; y <= 62; y++) expect(poseCuerpo(v, 0).g[y]!.join(''), `${v} fila ${y}`).toBe(BASE_S[y]!.join(''));
    const perfil = desdeFilas(PERFIL_IZQUIERDO, PERFIL_Y0, PERFIL_X0);
    expect(BASE_I.map((f) => f.join(''))).toEqual(perfil.map((f) => f.join('')));
    expect(BASE_N[60]!.join('')).toBe(BASE_S[60]!.join(''));
  });

  it('la falda tapa el espacio entre las piernas en frente, espalda, caminar y sentado', () => {
    const falda = PRENDAS.find((x) => x.id === 'abajo-falda')!;
    for (const v of ['S', 'N'] as const) for (const c of [0, 1, 2, 3, 4, 5]) {
      const ctx = ctxDe(v, c);
      const capa = falda.dibujar(ctx);
      const filas = new Map<number, number[]>();
      for (const [k, z] of ctx.z) if (z === 'H') filas.set(Math.floor(k / 32), [...(filas.get(Math.floor(k / 32)) ?? []), k % 32]);
      for (const [y, xs] of filas) for (let x = Math.min(...xs); x <= Math.max(...xs); x++) expect(capa.has(y * 32 + x), `${v}${c} (${x},${y})`).toBe(true);
    }
  });

  it('arma peinados, caminar y sentado en las 4 vistas', () => {
    const dirs: Dir[] = ['S', 'I', 'D', 'N'];
    PEINADOS.forEach((_, p) => {
      for (const d of dirs) {
        const look: Look = { piel: p % 5, cara: p % 5, peinado: p, ropa: p % 2 === 0 ? 'tirantes' : 'camiseta', gafas: p === 0 };
        expect(figura(look, d).contarOpacos()).toBeGreaterThan(300);
        for (const f of [0, 1, 2, 3] as Cuadro[]) expect(figura(look, d, { tipo: 'caminar', cuadro: f }).contarOpacos()).toBeGreaterThan(300);
        expect(figura(look, d, { tipo: 'sentado' }).contarOpacos()).toBeGreaterThan(200);
      }
    });
    for (const d of dirs) expect(figura({ piel: 1, cara: 0, peinado: 0, ropa: 'completa', gafas: true }, d).contarOpacos()).toBeGreaterThan(500);
  });
});
