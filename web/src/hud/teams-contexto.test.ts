import { describe, expect, it } from 'vitest';
import { contextoTeams, listaDeNombres, pedidoDe } from './teams-contexto';

const p = (id: number, nombre: string, apodo = '') => ({ id, nombre, apodo });
const SALA = { id: 'z-sala', nombre: 'Sala Norte', tipo: 'sala' } as const;
const ABIERTA = { id: 'z-piso', nombre: 'Piso Naos', tipo: 'abierta' } as const;
const yo = p(1, 'Yo');

describe('contexto del botón de Teams', () => {
  it('dentro de una sala de reuniones: chat de la sala, aunque haya gente cerca', () => {
    const c = contextoTeams(SALA, [yo, p(2, 'Ana Gómez')], [p(2, 'Ana Gómez')], 1);
    expect(c).toMatchObject({ tipo: 'sala', etiqueta: 'Chat de Sala Norte', etiquetaLlamada: 'Llamar a la sala', hayOtros: true });
    expect(pedidoDe(c, 'chat')).toEqual({ tipo: 'chat', sala: 'z-sala' });
    expect(pedidoDe(c, 'llamada')).toEqual({ tipo: 'llamada', sala: 'z-sala' });
  });
  it('solo en la sala: sigue siendo la sala, pero sin otros', () => {
    expect(contextoTeams(SALA, [yo], [], 1)).toMatchObject({ tipo: 'sala', hayOtros: false });
  });
  it('cerca de una sola persona: chat con ella, por su apodo si lo tiene', () => {
    const c = contextoTeams(ABIERTA, [yo], [p(2, 'Ana María Gómez')], 1);
    expect(c).toMatchObject({ tipo: 'persona', etiqueta: 'Chat con Ana', etiquetaLlamada: 'Llamar a Ana' });
    expect(pedidoDe(c, 'chat')).toEqual({ tipo: 'chat', personas: [2] });
    expect(contextoTeams(null, [], [p(2, 'Camilo Rojas', 'Cami')], 1)).toMatchObject({ etiqueta: 'Chat con Cami' });
  });
  it('cerca de varias: conversación en el lugar, o en la oficina si no hay zona', () => {
    const cerca = [p(2, 'Ana Gómez'), p(3, 'Luis Pérez'), p(4, 'Sofía Ríos')];
    const c = contextoTeams(ABIERTA, [yo], cerca, 1);
    expect(c).toMatchObject({ tipo: 'grupo', etiqueta: 'Conversación en Piso Naos', etiquetaLlamada: 'Llamar a Ana, Luis y Sofía' });
    expect(pedidoDe(c, 'chat')).toEqual({ tipo: 'chat', personas: [2, 3, 4], lugar: 'Piso Naos' });
    expect(contextoTeams(null, [], cerca, 1)).toMatchObject({ etiqueta: 'Conversación en la oficina' });
  });
  it('sin nadie cerca: abre Teams general y no hay pedido al servidor', () => {
    const c = contextoTeams(ABIERTA, [yo], [], 1);
    expect(c.tipo).toBe('ninguno');
    expect(pedidoDe(c, 'chat')).toBeNull();
  });
  it('nunca te cuenta a ti entre quienes están cerca', () => {
    expect(contextoTeams(null, [], [yo], 1).tipo).toBe('ninguno');
  });
  it('arma listas de nombres', () => {
    expect(listaDeNombres(['Ana'])).toBe('Ana');
    expect(listaDeNombres(['Ana', 'Luis'])).toBe('Ana y Luis');
  });
});
