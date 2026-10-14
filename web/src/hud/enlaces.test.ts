import { describe, expect, it } from 'vitest';
import { enlaceDeZona, zonaDeLaDireccion } from './enlaces';

describe('enlaces profundos de zonas', () => {
  it('arma y lee el enlace de una zona', () => {
    const url = enlaceDeZona('z-sala 1', 'https://oficina.ejemplo.co');
    expect(url).toBe('https://oficina.ejemplo.co/oficina?sala=z-sala%201');
    expect(zonaDeLaDireccion(new URL(url).search)).toBe('z-sala 1');
  });
  it('ignora direcciones sin zona o con un valor desmedido', () => {
    expect(zonaDeLaDireccion('')).toBeNull();
    expect(zonaDeLaDireccion('?otra=1')).toBeNull();
    expect(zonaDeLaDireccion(`?sala=${'x'.repeat(61)}`)).toBeNull();
  });
});
