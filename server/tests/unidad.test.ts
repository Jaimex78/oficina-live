import { describe, expect, it } from 'vitest';
import { PERMISOS_POR_ROL, ROLES, tienePermiso } from '@ol/shared';
import { claveTemporal, hashear, motivoClaveInvalida, verificar } from '../src/auth/clave';

describe('contraseñas', () => {
  it('hashea con sal distinta cada vez y verifica', async () => {
    const a = await hashear('MiClave2026x', 2 ** 10);
    const b = await hashear('MiClave2026x', 2 ** 10);
    expect(a).not.toBe(b);
    expect(await verificar('MiClave2026x', a)).toBe(true);
    expect(await verificar('miclave2026x', a)).toBe(false);
    expect(await verificar('MiClave2026x', 'basura')).toBe(false);
  });

  it('la clave temporal siempre cumple la política y no repite', () => {
    const vistas = new Set<string>();
    for (let i = 0; i < 300; i++) {
      const c = claveTemporal(10);
      expect(motivoClaveInvalida(c, 10), c).toBeNull();
      expect(c).toMatch(/^[A-HJ-NP-Za-km-z2-9]+$/); // sin 0, O, 1, l, I
      vistas.add(c);
    }
    expect(vistas.size).toBe(300);
    expect(claveTemporal(40)).toHaveLength(40);
  });

  it('explica por qué una clave no sirve', () => {
    expect(motivoClaveInvalida('Ab1', 10)).toMatch(/al menos 10/);
    expect(motivoClaveInvalida('sololetrasminusculas', 10)).toMatch(/mayúsculas/);
    expect(motivoClaveInvalida('SOLOMAYUSCULAS1234', 10)).toMatch(/mayúsculas/);
    expect(motivoClaveInvalida('SinNumerosAquiNi', 10)).toMatch(/número/);
    expect(motivoClaveInvalida('Valida2026abc', 10)).toBeNull();
    expect(motivoClaveInvalida(`Aa1${'x'.repeat(200)}`, 10)).toMatch(/128/);
  });
});

describe('roles', () => {
  it('cada rol tiene solo los permisos que dice el plan', () => {
    expect(ROLES).toEqual(['admin', 'constructor', 'usuario']);
    expect(PERMISOS_POR_ROL.admin).toEqual(['administrar', 'construir', 'caminar']);
    expect(tienePermiso('constructor', 'construir')).toBe(true);
    expect(tienePermiso('constructor', 'administrar')).toBe(false);
    expect(tienePermiso('usuario', 'construir')).toBe(false);
    expect(tienePermiso('usuario', 'caminar')).toBe(true);
  });
});
