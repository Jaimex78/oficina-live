import { describe, expect, it } from 'vitest';
import { AYUDA_SPOTIFY, avanceDeSesion, nombreDeSesion, textoQueda, textoVisibilidadSesion, zonaDeCoworking } from './coworking';

describe('textos de coworking', () => {
  it('el nombre de la sesión es el tema o «Trabajo compartido enfocado»', () => {
    expect(nombreDeSesion('Informe de ventas')).toBe('Informe de ventas');
    expect(nombreDeSesion('   ')).toBe('Trabajo compartido enfocado');
    expect(nombreDeSesion(undefined)).toBe('Trabajo compartido enfocado');
  });

  it('el tiempo que queda se dice en minutos y horas', () => {
    expect(textoQueda(59 * 60_000 + 50_000)).toBe('Queda 59m');
    expect(textoQueda(60 * 60_000)).toBe('Queda 1h');
    expect(textoQueda(65 * 60_000)).toBe('Queda 1h 05m');
    expect(textoQueda(20_000)).toBe('Queda menos de 1m');
    expect(textoQueda(-5)).toBe('Queda menos de 1m');
  });

  it('el avance de la barra va de 0 a 1', () => {
    const s = { inicio: 1000, fin: 3000 };
    expect(avanceDeSesion(s, 0)).toBe(0);
    expect(avanceDeSesion(s, 2000)).toBe(0.5);
    expect(avanceDeSesion(s, 9000)).toBe(1);
  });

  it('dice quién la ve', () => {
    expect(textoVisibilidadSesion('todos')).toBe('Visible para todos');
    expect(textoVisibilidadSesion('nadie')).toBe('Solo visible para ti');
    expect(textoVisibilidadSesion(undefined)).toBe('Visible para todos');
  });

  it('la ayuda aclara que Oficina Live no reproduce el audio de Spotify', () => {
    expect(AYUDA_SPOTIFY).toMatch(/app de Spotify de cada persona/);
    expect(AYUDA_SPOTIFY).toMatch(/no reproduce el audio/);
  });

  it('encuentra la zona más pequeña donde está alguien', () => {
    const sala = {
      zonas: [
        { id: 'a', nombre: 'Grande', tipo: 'abierta' as const, rect: { x: 0, y: 0, w: 20, h: 20 } },
        { id: 'b', nombre: 'Sofás', tipo: 'coworking' as const, rect: { x: 5, y: 5, w: 3, h: 3 } },
      ],
    };
    expect(zonaDeCoworking(sala, 6.5 * 32, 6.5 * 32)?.nombre).toBe('Sofás');
    expect(zonaDeCoworking(sala, 15 * 32, 15 * 32)?.nombre).toBe('Grande');
    expect(zonaDeCoworking(sala, 40 * 32, 40 * 32)).toBeUndefined();
  });
});
