import { describe, expect, it } from 'vitest';
import { aEnlaceApp, CHAT_GENERAL, enlaceChat, enlaceLlamada, esCorreo, esHttps } from './teams';
import { lineaEstado, pastel, primerNombre } from './estados';

describe('enlaces de Teams', () => {
  it('arma la llamada con los correos válidos y descarta lo que no es correo', () => {
    expect(enlaceLlamada(['ana@ejemplo.com', 'sin-arroba', 'luis@ejemplo.com'])).toBe('https://teams.microsoft.com/l/call/0/0?users=ana%40ejemplo.com,luis%40ejemplo.com');
  });
  it('sin correos conocidos abre la pantalla de llamada sin invitados', () => {
    expect(enlaceLlamada([])).toBe('https://teams.microsoft.com/l/call/0/0');
    expect(enlaceLlamada(['x'])).toBe('https://teams.microsoft.com/l/call/0/0');
  });
  it('puede pedir video en la llamada', () => {
    expect(enlaceLlamada(['ana@ejemplo.com'], true)).toBe('https://teams.microsoft.com/l/call/0/0?users=ana%40ejemplo.com&withVideo=true');
  });
  it('arma el chat con mensaje codificado', () => {
    expect(enlaceChat(['ana@ejemplo.com'], 'Hola, ¿almorzamos?')).toBe('https://teams.microsoft.com/l/chat/0/0?users=ana%40ejemplo.com&message=Hola%2C%20%C2%BFalmorzamos%3F');
    expect(enlaceChat()).toBe('https://teams.microsoft.com/l/chat/0/0');
  });
  it('reconoce correos y enlaces https', () => {
    expect(esCorreo('ana@ejemplo.com')).toBe(true);
    expect(esCorreo('ana@ejemplo')).toBe(false);
    expect(esCorreo('a b@ejemplo.com')).toBe(false);
    expect(esCorreo(undefined)).toBe(false);
    expect(esHttps('https://teams.microsoft.com/l/meetup-join/abc')).toBe(true);
    expect(esHttps('http://x.com')).toBe(false);
    expect(esHttps('javascript:alert(1)')).toBe(false);
  });
});

describe('esquema de la aplicación de Teams', () => {
  it('cambia https por msteams solo en enlaces de teams.microsoft.com', () => {
    expect(aEnlaceApp('https://teams.microsoft.com/l/meetup-join/abc')).toBe('msteams://teams.microsoft.com/l/meetup-join/abc');
    expect(aEnlaceApp('https://otro.com/x')).toBe('https://otro.com/x');
    expect(CHAT_GENERAL.urlApp).toBe(aEnlaceApp(CHAT_GENERAL.url));
  });
});

describe('estados y nombres', () => {
  it('usa las palabras de Gather y suma el lugar', () => {
    expect(lineaEstado('disponible', 'naos')).toBe('Activo · En el Naos');
    expect(lineaEstado('concentrado', 'remoto')).toBe('Ocupado · Remoto');
    expect(lineaEstado('ausente', '')).toBe('Ausente');
    expect(lineaEstado('reunion', '')).toBe('En reunión');
  });
  it('el nombre corto es el apodo o el primer nombre', () => {
    expect(primerNombre({ nombre: 'Ana María Gómez', apodo: '' })).toBe('Ana');
    expect(primerNombre({ nombre: 'Camilo Rojas', apodo: 'Cami' })).toBe('Cami');
  });
  it('el color pastel es estable por persona', () => {
    expect(pastel(7)).toBe(pastel(7));
    expect(pastel(7)).not.toBe(pastel(8));
  });
});
