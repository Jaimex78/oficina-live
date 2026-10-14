import { describe, expect, it } from 'vitest';
import { esEnlaceSpotify, fasePomodoro, limpiarTema, minutosRestantes, textoCronometro, validarPedidoEnfoque } from '../src/enfoque';

describe('enlaces de Spotify', () => {
  it('acepta open.spotify.com y spotify.link con https, y nada más', () => {
    expect(esEnlaceSpotify('https://open.spotify.com/socialsession/abc?si=1')).toBe(true);
    expect(esEnlaceSpotify('https://spotify.link/xyz')).toBe(true);
    expect(esEnlaceSpotify('http://open.spotify.com/jam')).toBe(false);
    expect(esEnlaceSpotify('https://open.spotify.com.malo.com/jam')).toBe(false);
    expect(esEnlaceSpotify('https://usuario:clave@open.spotify.com/jam')).toBe(false);
    expect(esEnlaceSpotify('https://ejemplo.com/open.spotify.com')).toBe(false);
    expect(esEnlaceSpotify('javascript:alert(1)')).toBe(false);
    expect(esEnlaceSpotify('https://open.spotify.com/a b')).toBe(false);
    expect(esEnlaceSpotify('')).toBe(false);
    expect(esEnlaceSpotify(undefined)).toBe(false);
  });
});

describe('Pomodoro y cronómetro', () => {
  const s = { inicio: 1_000_000, fin: 1_000_000 + 90 * 60_000 };
  const min = (n: number) => s.inicio + n * 60_000;
  it('alterna 25 minutos de trabajo y 5 de descanso', () => {
    expect(fasePomodoro(s, min(0))).toMatchObject({ fase: 'trabajo', ciclo: 1, restanteMs: 25 * 60_000 });
    expect(fasePomodoro(s, min(24.5))).toMatchObject({ fase: 'trabajo', restanteMs: 30_000 });
    expect(fasePomodoro(s, min(25))).toMatchObject({ fase: 'descanso', restanteMs: 5 * 60_000 });
    expect(fasePomodoro(s, min(30))).toMatchObject({ fase: 'trabajo', ciclo: 2, restanteMs: 25 * 60_000 });
    expect(fasePomodoro(s, min(57))).toMatchObject({ fase: 'descanso', ciclo: 2 });
  });
  it('la última fase no pasa del final de la sesión', () => {
    const corta = { inicio: 0, fin: 40 * 60_000 };
    expect(fasePomodoro(corta, 38 * 60_000)).toMatchObject({ fase: 'trabajo', restanteMs: 2 * 60_000 });
  });
  it('los minutos que quedan se redondean hacia arriba y el cronómetro marca mm:ss', () => {
    expect(minutosRestantes(s, min(47.5))).toBe(43);
    expect(minutosRestantes(s, s.fin + 5)).toBe(0);
    expect(textoCronometro(42 * 60_000 + 7_000)).toBe('42:07');
    expect(textoCronometro(-5)).toBe('00:00');
    expect(textoCronometro(59_100)).toBe('01:00');
  });
});

describe('validar el pedido', () => {
  const ok = { modo: 'pomodoro', tema: '  Informe \n de ventas ', minutos: 45, spotify: ' https://spotify.link/x ', visibilidad: 'estado' };
  it('limpia el tema y el enlace', () => {
    expect(validarPedidoEnfoque(ok)).toEqual({ modo: 'pomodoro', tema: 'Informe de ventas', minutos: 45, spotify: 'https://spotify.link/x', visibilidad: 'estado' });
    expect(limpiarTema('x'.repeat(200))).toHaveLength(80);
  });
  it('rechaza modos, duraciones, visibilidades y enlaces que no son de la lista', () => {
    for (const mal of [{ modo: 'x' }, { minutos: 30 }, { visibilidad: 'amigos' }, { spotify: 'https://ejemplo.com' }]) expect(typeof validarPedidoEnfoque({ ...ok, ...mal })).toBe('string');
    expect(typeof validarPedidoEnfoque(null)).toBe('string');
  });
});
